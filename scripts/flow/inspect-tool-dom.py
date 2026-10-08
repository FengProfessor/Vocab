import asyncio
import os
import sys
from playwright.async_api import async_playwright

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

async def inspect():
    profile_dir = os.path.expandvars(r'%LOCALAPPDATA%\ffroliva\gflow-cli\profile_fengprofessor')
    async with async_playwright() as p:
        browser_context = await p.chromium.launch_persistent_context(
            profile_dir,
            headless=True,
            channel='chrome',
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        page = await browser_context.new_page()
        tool_url = 'https://flow.google.com/project/e4449359-9369-4c4a-99ad-73ba35a90fdd/tool/e19e3e94-a658-495b-b7e0-fb89d7c83581?mode=EDIT'
        print('Opening tool:', tool_url)
        await page.goto(tool_url, wait_until='domcontentloaded', timeout=45000)
        await asyncio.sleep(6)
        
        # Check preview tab
        preview = page.locator('button:has-text("Xem trước"), [role="tab"]:has-text("Xem trước")').first
        if await preview.count() > 0:
            await preview.click()
            await asyncio.sleep(4)
        
        print('Total Frames:', len(page.frames))
        for idx, fr in enumerate(page.frames):
            inputs = await fr.locator('textarea, input').all()
            btns = await fr.locator('button').all()
            if len(inputs) > 0 or len(btns) > 0:
                print(f'\nFrame #{idx} (url: {fr.url[:80]}...): {len(inputs)} inputs, {len(btns)} buttons')
                for inp in inputs:
                    tag = await inp.evaluate("el => el.tagName")
                    ph = await inp.get_attribute('placeholder') or ''
                    typ = await inp.get_attribute('type') or ''
                    print(f'  Input: <{tag}> type="{typ}" ph="{ph}"')
                for btn in btns[:15]:
                    txt = (await btn.inner_text()).strip().replace('\n', ' ')
                    print(f'  Button: "{txt}"')

        os.makedirs('tmp/flow/tools', exist_ok=True)
        await page.screenshot(path='tmp/flow/tools/inspect_tool_current.png')
        print("Screenshot saved to tmp/flow/tools/inspect_tool_current.png")
        await browser_context.close()

if __name__ == '__main__':
    asyncio.run(inspect())
