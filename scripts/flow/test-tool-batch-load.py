import asyncio
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

sample_content = """1 | sister | A cheerful older sister helping her little brother tie his shoelaces in a cozy room
2 | baby | An adorable happy baby with chubby cheeks laughing joyfully with colorful soft building blocks
3 | brother | Two young brothers playfully building a pillow and blanket fort together in the living room
4 | grandmother | A kind smiling grandmother with warm glasses lovingly baking fresh warm cookies in a bright kitchen
5 | grandfather | A gentle wise grandfather with round spectacles happily carving a little wooden toy sailboat for his grandchild"""

async def test_batch_load():
    sample_file = Path('tmp/flow/test_sample_5.txt')
    sample_file.parent.mkdir(parents=True, exist_ok=True)
    sample_file.write_text(sample_content, encoding='utf-8')
    print(f"Sample file created: {sample_file}")

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

        # Click 'Xem trước' tab
        preview = page.locator('button:has-text("Xem trước"), [role="tab"]:has-text("Xem trước")').first
        if await preview.count() > 0:
            await preview.click()
            await asyncio.sleep(4)

        # Locate frame with tool
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

        # 1. Fill textarea with the 5 sample words
        textarea = app_frame.locator('textarea').first
        if await textarea.count() > 0:
            print("Found textarea! Filling with sample content...")
            await textarea.fill(sample_content)
            await asyncio.sleep(2)
            # Dispatch change/input event
            await textarea.dispatch_event('input')
            await asyncio.sleep(2)
        else:
            print("[WARN] No textarea found, checking file input...")
            file_input = app_frame.locator('input[type="file"]').first
            if await file_input.count() > 0:
                print("Setting input files...")
                await file_input.set_input_files(str(sample_file.resolve()))
                await asyncio.sleep(3)

        # Check cards generated in DOM
        cards = await app_frame.locator('div[class*="card"], div:has(button:has-text("Tạo thẻ này"))').all()
        print(f"Cards detected in DOM: {len(cards)}")
        
        # Take screenshot
        os.makedirs('tmp/flow/tools', exist_ok=True)
        await page.screenshot(path='tmp/flow/tools/sample_5_loaded.png')
        print("Saved screenshot to tmp/flow/tools/sample_5_loaded.png")

        # Let's inspect the cards
        single_btns = await app_frame.locator('button:has-text("Tạo thẻ này")').all()
        print(f"Single-card generate buttons available: {len(single_btns)}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_batch_load())
