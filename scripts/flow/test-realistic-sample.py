import asyncio
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

async def generate_realistic_sample():
    profile_dir = os.path.expandvars(r'%LOCALAPPDATA%\ffroliva\gflow-cli\profile_fengprofessor')
    async with async_playwright() as p:
        browser = await p.chromium.launch_persistent_context(
            profile_dir,
            headless=True,
            channel='chrome',
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        page = await browser.new_page()
        await page.set_viewport_size({'width': 1600, 'height': 900})

        # Open project
        project_url = 'https://flow.google.com/project/e4449359-9369-4c4a-99ad-73ba35a90fdd'
        print(f"Opening project: {project_url}...")
        await page.goto(project_url, wait_until='domcontentloaded', timeout=45000)
        await asyncio.sleep(5)

        # Wait for composer
        prose = page.locator('.ProseMirror')
        await prose.wait_for(timeout=30000)
        print("Composer ready!")

        # Count images before
        before_imgs = await page.locator('img').all()
        before_srcs = set()
        for im in before_imgs:
            src = await im.get_attribute('src') or ''
            if '/asb/' in src:
                before_srcs.add(src)

        # Submit realistic prompt for 'relative'
        realistic_prompt = (
            "A warm candid authentic photograph of an extended multi-generational family (grandparents, smiling parents, friendly aunts and uncles, cheerful young cousins) chatting and laughing together around a sunny outdoor dining table in a cozy backyard garden, natural sunlight, cinematic 35mm portrait photography, authentic human facial expressions, true-to-life skin textures, 8k resolution, 16:9 widescreen, no text, no letters, no typography, no watermarks, no logos"
        )

        print("Submitting realistic prompt to Flow...")
        await prose.click()
        await asyncio.sleep(0.5)
        await page.keyboard.press("Control+A")
        await page.keyboard.press("Backspace")
        await asyncio.sleep(0.3)
        await prose.fill(realistic_prompt)
        await asyncio.sleep(0.5)
        await page.keyboard.press("Enter")
        print("Prompt submitted. Waiting for generated image...")

        # Wait for new ASB image
        new_src = None
        for step in range(16): # 80 seconds
            await asyncio.sleep(5)
            imgs = await page.locator('img').all()
            for im in imgs:
                src = await im.get_attribute('src') or ''
                if '/asb/' in src and src not in before_srcs:
                    box = await im.bounding_box()
                    if box and box['width'] > 300:
                        new_src = src
                        break
            if new_src:
                print(f"Found new realistic image after {(step+1)*5}s!")
                break
            print(f" ... waiting ({(step+1)*5}s)...")

        if new_src:
            # Download image bytes via page.evaluate
            b64_str = await page.evaluate('''async (url) => {
                const res = await fetch(url);
                const blob = await res.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            }''', new_src)
            import base64
            header, encoded = b64_str.split(',', 1)
            img_bytes = base64.b64decode(encoded)
            
            out_file = Path('tmp/flow/sample_realistic_relative.png')
            out_file.write_bytes(img_bytes)
            print(f"Saved realistic sample to {out_file.resolve()} ({len(img_bytes)//1024} KB)")

            # Also copy to artifacts directory for display
            artifact_dest = Path(r'C:\Users\tapho\.gemini\antigravity\brain\86f8a733-cd54-414b-a144-93d3b15c12d4\sample_realistic_relative.png')
            artifact_dest.write_bytes(img_bytes)
            print("Copied to artifacts directory!")
        else:
            print("[WARN] Did not capture new image within timeout.")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(generate_realistic_sample())
