import asyncio
import os
import sys
from playwright.async_api import async_playwright

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

profile_dir = os.path.expandvars(r'%LOCALAPPDATA%\ffroliva\gflow-cli\profile_fengprofessor')
state_file = 'tmp/flow/flow_auth_state.json'

async def test_portable_auth():
    async with async_playwright() as p:
        # Step 1: Export storage state from Chrome profile
        print("[AuthTest] Step 1: Exporting storage state from profile...")
        b1 = await p.chromium.launch_persistent_context(profile_dir, headless=True, channel='chrome')
        page1 = await b1.new_page()
        await page1.goto('https://flow.google.com', wait_until='domcontentloaded')
        await asyncio.sleep(4)
        await b1.storage_state(path=state_file)
        await b1.close()
        print(f"[AuthTest] Storage state exported to {state_file} ({os.path.getsize(state_file)} bytes)")

        # Step 2: Test loading this state in a clean, isolated Chromium instance (simulating cloud server)
        print("[AuthTest] Step 2: Testing isolated browser with storage_state...")
        b2 = await p.chromium.launch(headless=True)
        ctx = await b2.new_context(
            storage_state=state_file,
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
        )
        page2 = await ctx.new_page()
        await page2.goto('https://flow.google.com', wait_until='domcontentloaded')
        await asyncio.sleep(5)
        print("[AuthTest] Isolated browser URL:", page2.url)
        print("[AuthTest] Isolated browser Title:", await page2.title())

        # Check if project or login button exists
        is_logged_in = await page2.locator('button:has-text("Dự án mới"), div:has-text("ULTRA"), img[src*="googleusercontent"]').count() > 0
        print(f"[AuthTest] Is logged in in isolated browser: {is_logged_in}")

        await page2.screenshot(path='tmp/flow/portable_auth_test.png')
        await b2.close()

if __name__ == '__main__':
    asyncio.run(test_portable_auth())
