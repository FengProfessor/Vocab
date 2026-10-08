import asyncio
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

async def load_500():
    txt_file = Path('tmp/flow/vocab_500_bulk.txt').resolve()
    if not txt_file.exists():
        print(f"[ERROR] {txt_file} does not exist.")
        return

    content = txt_file.read_text(encoding='utf-8')
    lines = [l for l in content.splitlines() if l.strip()]
    print(f"Loaded {len(lines)} lines from {txt_file.name}")

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
        print(f"Navigating to Flow Tool: {tool_url}...")
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
            print("[ERROR] Could not find tool app frame!")
            await browser.close()
            return

        print("[OK] Found tool app frame!")

        # First try file upload input:
        file_input = app_frame.locator('input[type="file"]').first
        if await file_input.count() > 0:
            print(f"[FlowApp] Uploading {txt_file.name} to file input...")
            await file_input.set_input_files(str(txt_file))
            await asyncio.sleep(4)

        # Also verify textarea
        textarea = app_frame.locator('textarea').first
        if await textarea.count() > 0:
            val = await textarea.input_value()
            if len(val) < 100:
                print("[FlowApp] Filling textarea directly...")
                await textarea.fill(content)
                await textarea.dispatch_event('input')
                await asyncio.sleep(3)

        # Check total cards and badge
        badge_text = ""
        badges = await app_frame.locator('div, span').all()
        for b in badges:
            try:
                t = (await b.inner_text()).strip()
                if 'từ hợp lệ' in t or 'thẻ' in t:
                    badge_text = t
                    break
            except Exception:
                pass

        print(f"[FlowApp] Status badge: {badge_text}")

        # Check how many card elements exist
        single_btns = await app_frame.locator('button:has-text("Tạo thẻ này")').all()
        print(f"[FlowApp] Total cards ready with single generate button: {len(single_btns)}")

        os.makedirs('tmp/flow/tools', exist_ok=True)
        await page.screenshot(path='tmp/flow/tools/500_words_loaded_in_app.png')
        print("Saved screenshot to tmp/flow/tools/500_words_loaded_in_app.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(load_500())
