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

async def run_batch_in_app():
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
            print("[ERROR] Tool app frame not found!")
            await browser.close()
            return

        # 1. Fill textarea
        textarea = app_frame.locator('textarea').first
        if await textarea.count() > 0:
            await textarea.fill(sample_content)
            await textarea.dispatch_event('input')
            await asyncio.sleep(2)

        # 2. Click "Bắt đầu tạo hàng loạt"
        batch_btn = app_frame.locator('button:has-text("Bắt đầu tạo hàng loạt")').first
        if await batch_btn.count() > 0:
            print("[FlowApp] Clicking 'Bắt đầu tạo hàng loạt' (Batch Generate)...")
            await batch_btn.click()
            await asyncio.sleep(4)

            # Monitor progress
            for i in range(12): # up to 60s
                await asyncio.sleep(5)
                # Count images generated
                imgs = await app_frame.locator('img').all()
                asb_imgs = []
                for im in imgs:
                    src = await im.get_attribute('src') or ''
                    if 'asb' in src or 'blob' in src or 'data:' in src or len(src) > 50:
                        asb_imgs.append(src)
                
                # Check status text
                status_texts = []
                headers = await app_frame.locator('div, span, p').all()
                for h in headers[:40]:
                    try:
                        txt = (await h.inner_text()).strip()
                        if 'Đã xong' in txt or 'Tiến độ' in txt:
                            if txt not in status_texts:
                                status_texts.append(txt)
                    except Exception:
                        pass
                
                print(f" ... waited {(i+1)*5}s | Images: {len(asb_imgs)} | Status: {status_texts}")
                if len(asb_imgs) >= 5:
                    print("All 5 images completed!")
                    break

            os.makedirs('tmp/flow/tools', exist_ok=True)
            await page.screenshot(path='tmp/flow/tools/batch_run_progress.png')
            print("Saved screenshot to tmp/flow/tools/batch_run_progress.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run_batch_in_app())
