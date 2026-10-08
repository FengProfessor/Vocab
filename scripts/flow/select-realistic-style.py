import asyncio
import os
import sys
from playwright.async_api import async_playwright

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

async def select_realistic():
    profile_dir = os.path.expandvars(r'%LOCALAPPDATA%\ffroliva\gflow-cli\profile_fengprofessor')
    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(
            profile_dir,
            headless=True,
            channel='chrome',
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        page = await browser.new_page()
        await page.set_viewport_size({'width': 1600, 'height': 1200})

        tool_url = 'https://flow.google.com/project/e4449359-9369-4c4a-99ad-73ba35a90fdd/tool/e19e3e94-a658-495b-b7e0-fb89d7c83581?mode=EDIT'
        print(f"Opening tool URL: {tool_url}...")
        await page.goto(tool_url, wait_until='domcontentloaded', timeout=45000)
        await asyncio.sleep(6)

        # Switch to 'Xem trước' tab
        preview = page.locator('button:has-text("Xem trước"), [role="tab"]:has-text("Xem trước")').first
        if await preview.count() > 0:
            await preview.click()
            await asyncio.sleep(4)

        app_frame = None
        for fr in page.frames:
            if await fr.locator('button:has-text("Bắt đầu tạo hàng loạt"), button:has-text("Tạo thẻ này")').count() > 0:
                app_frame = fr
                break

        if not app_frame:
            print("[ERROR] Could not find tool frame!")
            await browser.close()
            return

        print("[OK] Found Flow Tool frame!")

        # 1. Find style dropdown
        selects = await app_frame.locator('select').all()
        for s in selects:
            options = await s.locator('option').all_inner_texts()
            print("Found <select> with options:", options)
            if any('Realistic' in o for o in options):
                print("Selecting 'Realistic Photo' in <select>...")
                await s.select_option(label='Realistic Photo')
                await asyncio.sleep(1)

        # Also check custom select or dropdown triggers
        dropdown_btn = app_frame.locator('button:has-text("Pixar 3D"), [role="combobox"]:has-text("Pixar 3D"), div:has-text("Pixar 3D Animation")').first
        if await dropdown_btn.count() > 0:
            print("Found dropdown trigger! Clicking...")
            await dropdown_btn.click()
            await asyncio.sleep(2)
            # Click 'Realistic Photo' option
            opt = app_frame.locator('li:has-text("Realistic Photo"), option:has-text("Realistic Photo"), div[role="option"]:has-text("Realistic Photo"), button:has-text("Realistic Photo")').first
            if await opt.count() > 0:
                print("Found 'Realistic Photo' option! Selecting...")
                await opt.click()
                await asyncio.sleep(2)

        # 2. Fill the new 500 realistic scenes into textarea
        bulk_file = os.path.abspath('tmp/flow/vocab_500_bulk.txt')
        with open(bulk_file, 'r', encoding='utf-8') as f:
            content = f.read()

        textarea = app_frame.locator('textarea').first
        if await textarea.count() > 0:
            print("Filling 500 realistic scenes into textarea...")
            await textarea.fill(content)
            await textarea.dispatch_event('input')
            await asyncio.sleep(4)

        cards_count = await app_frame.locator('button:has-text("Tạo thẻ này"), button:has-text("Tải thẻ xuống")').count()
        print(f"Cards in DOM: {cards_count}")

        # Take screenshot of configured app
        os.makedirs('tmp/flow/tools', exist_ok=True)
        await page.screenshot(path='tmp/flow/tools/realistic_500_configured.png')
        print("Saved screenshot to tmp/flow/tools/realistic_500_configured.png")

        # 3. Click 'Bắt đầu tạo hàng loạt'
        batch_btn = app_frame.locator('button:has-text("Bắt đầu tạo hàng loạt")').first
        if await batch_btn.count() > 0:
            print("Clicking 'Bắt đầu tạo hàng loạt' (Start Batch)...")
            await batch_btn.click()
            await asyncio.sleep(4)
            await page.screenshot(path='tmp/flow/tools/realistic_batch_started.png')
            print("Batch started! Saved realistic_batch_started.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(select_realistic())
