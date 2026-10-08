"""
Flow Headless CLI - Automated High-Quality Vocabulary Image Generator via Google Flow
--------------------------------------------------------------------------------------
Usage:
  python scripts/flow/run-flow-headless.py --manifest tmp/flow/stage1/s1-topic-family/manifest.json --out-dir tmp/flow/stage1/s1-topic-family/output/ --limit 5
  python scripts/flow/run-flow-headless.py --manifest tmp/flow/stage1/s1-topic-family/manifest.json --out-dir tmp/flow/stage1/s1-topic-family/output/
"""

import argparse
import asyncio
import base64
import json
import os
import random
import sys
import time
from pathlib import Path
from playwright.async_api import async_playwright

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

DEFAULT_PROFILE = os.path.expandvars(r'%LOCALAPPDATA%\ffroliva\gflow-cli\profile_fengprofessor')

async def fetch_image_base64(page, image_url: str) -> bytes:
    """Fetch image data through the browser session to preserve authenticated cookies."""
    b64_str = await page.evaluate('''async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }''', image_url)
    header, encoded = b64_str.split(',', 1)
    return base64.b64decode(encoded)

async def wait_for_composer(page, timeout_sec=30):
    """Wait until the ProseMirror composer is ready and interactable."""
    start = time.time()
    while time.time() - start < timeout_sec:
        prose = page.locator('.ProseMirror')
        if await prose.count() > 0 and await prose.is_visible():
            return prose
        await asyncio.sleep(1)
    raise TimeoutError("ProseMirror composer did not appear within timeout.")

async def get_all_asb_images(page):
    """Retrieve all high-res /asb/ image sources currently rendered in DOM."""
    imgs = await page.locator('img').all()
    results = []
    for img in imgs:
        try:
            src = await img.get_attribute('src') or ''
            if '/asb/' in src:
                box = await img.bounding_box()
                w = box['width'] if box else 0
                h = box['height'] if box else 0
                x = box['x'] if box else 0
                y = box['y'] if box else 0
                results.append({'src': src, 'width': w, 'height': h, 'x': x, 'y': y})
        except Exception:
            continue
    return results

async def run_batch(args):
    manifest_path = Path(args.manifest)
    if not manifest_path.exists():
        print(f"[ERROR] Manifest file not found: {manifest_path}")
        return

    with open(manifest_path, 'r', encoding='utf-8') as f:
        items = json.load(f)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.limit and args.limit > 0:
        items = items[:args.limit]

    storage_state_path = args.storage_state
    if storage_state_path and not os.path.exists(storage_state_path):
        print(f"[ERROR] Storage state file not found: {storage_state_path}")
        return

    profile_dir = args.profile or DEFAULT_PROFILE
    if not storage_state_path and not os.path.exists(profile_dir):
        print(f"[ERROR] Profile directory not found: {profile_dir}")
        print("Please run 'gflow auth login --browser chrome' first to create a session.")
        return

    print("=" * 60)
    print("GOOGLE FLOW HEADLESS VOCABULARY GENERATOR")
    print(f"Manifest: {manifest_path} ({len(items)} items)")
    print(f"Output:   {out_dir}")
    if storage_state_path:
        print(f"Auth:     Storage state ({storage_state_path})")
    else:
        print(f"Profile:  {profile_dir}")
    print(f"Headless: {args.headless}")
    print("=" * 60)

    async with async_playwright() as p:
        if storage_state_path:
            print(f"[Flow] Launching Chromium with portable storage state...")
            browser_instance = await p.chromium.launch(
                headless=args.headless,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                ]
            )
            context = await browser_instance.new_context(
                storage_state=storage_state_path,
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                viewport={'width': 1600, 'height': 900}
            )
            page = await context.new_page()
            close_target = browser_instance
        else:
            browser = await p.chromium.launch_persistent_context(
                profile_dir,
                headless=args.headless,
                channel='chrome',
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                ]
            )
            page = await browser.new_page()
            close_target = browser
        page.set_default_timeout(60000)

        project_url = args.project_url
        project_cache_file = manifest_path.parent / "project_url.txt"
        if not project_url and project_cache_file.exists():
            saved_url = project_cache_file.read_text(encoding='utf-8').strip()
            if saved_url.startswith("https://flow.google.com/project/"):
                project_url = saved_url
                print(f"[Flow] Reusing saved project session: {project_url}")

        if project_url:
            print(f"[Flow] Navigating to project: {project_url}...")
            await page.goto(project_url, wait_until='domcontentloaded')
        else:
            print("[Flow] Navigating to https://flow.google.com...")
            await page.goto('https://flow.google.com', wait_until='domcontentloaded')
            await asyncio.sleep(4)

            # Check if we are already in a project or need to click 'Dự án mới'
            if '/project/' not in page.url:
                print("[Flow] Creating new project via 'Dự án mới'...")
                btns = await page.locator('button, a, div[role="button"]').all()
                clicked = False
                for btn in btns:
                    try:
                        txt = (await btn.inner_text()).strip().replace('\n', ' ')
                        if 'Dự án' in txt or 'Project' in txt or 'mới' in txt:
                            await btn.click()
                            clicked = True
                            break
                    except Exception:
                        pass
                
                if not clicked:
                    print("[WARN] Could not find 'Dự án mới' button, attempting direct navigation or fallback...")
                
                # Wait for project URL
                for _ in range(15):
                    await asyncio.sleep(1)
                    if '/project/' in page.url:
                        break

            project_url = page.url
            print(f"[Flow] Active project session: {project_url}")
            # Cache project URL for resuming
            try:
                project_cache_file.write_text(project_url, encoding='utf-8')
            except Exception:
                pass

        await asyncio.sleep(4)
        composer = await wait_for_composer(page)
        print("[Flow] Composer ready!")

        total = len(items)
        success_count = 0
        skip_count = 0
        fail_count = 0

        # Filter pending vs already skipped items
        pending_items = []
        for item in items:
            slug = item.get('slug', item.get('word', '').lower().replace(' ', '-'))
            stt = item.get('stt')
            stt_file = out_dir / f"{stt:03d}_{slug}.png" if stt else None
            plain_file = out_dir / f"{slug}.png"
            if args.skip_existing and ((stt_file and stt_file.exists() and stt_file.stat().st_size > 10240) or (plain_file.exists() and plain_file.stat().st_size > 10240)):
                existing_name = stt_file.name if (stt_file and stt_file.exists()) else plain_file.name
                print(f"[SKIP] '{item.get('word')}' already exists: {existing_name}")
                skip_count += 1
            else:
                pending_items.append(item)

        print(f"\n[Flow] Found {skip_count} existing images. {len(pending_items)} items remaining to generate.")

        batch_size = max(1, min(args.batch_size, 5))
        chunks = [pending_items[i:i + batch_size] for i in range(0, len(pending_items), batch_size)]

        for chunk_idx, chunk in enumerate(chunks, 1):
            words_str = ", ".join(f"'{it.get('word')}'" for it in chunk)
            print(f"\n[Batch {chunk_idx}/{len(chunks)}] Generating {len(chunk)} words: {words_str}...")

            # 1. Snapshot existing ASB images before generation
            before_images = await get_all_asb_images(page)
            before_srcs = set(img['src'] for img in before_images)

            # 2. Build prompt
            if len(chunk) == 1:
                prompt_text = chunk[0].get('prompt', '')
            else:
                prompt_lines = [
                    f"Generate {len(chunk)} distinct realistic authentic photographs for these {len(chunk)} vocabulary words (1 image per word, 16:9 aspect ratio, natural daylight, cinematic 35mm lens, authentic human expressions, warm relatable everyday moment, true-to-life textures, no text, no typography, no letters):"
                ]
                for c_i, c_item in enumerate(chunk, 1):
                    scene = c_item.get('scene', c_item.get('pedagogical_scene', c_item.get('prompt', '')))
                    prompt_lines.append(f"{c_i}. '{c_item['word']}': {scene}")
                prompt_text = "\n".join(prompt_lines)

            # 3. Type prompt into composer
            try:
                await composer.click()
                await asyncio.sleep(0.5)
                await page.keyboard.press("Control+A")
                await page.keyboard.press("Backspace")
                await asyncio.sleep(0.3)
                await composer.fill(prompt_text)
                await asyncio.sleep(0.8)
                await page.keyboard.press("Enter")
                print(f" -> Submitted batch prompt to Flow. Waiting for {len(chunk)} images...")
            except Exception as e:
                print(f"[ERROR] Failed to input prompt for batch {chunk_idx}: {e}")
                fail_count += len(chunk)
                continue

            # 4. Wait for new images to appear (Flow generates in ~60s)
            new_cards = []
            max_wait_sec = 120
            poll_interval = 3
            start_poll = time.time()

            while time.time() - start_poll < max_wait_sec:
                await asyncio.sleep(poll_interval)
                current_images = await get_all_asb_images(page)
                
                # Filter new large ASB images
                candidates = [img for img in current_images if img['src'] not in before_srcs and img['width'] > 300]
                if len(candidates) >= len(chunk):
                    # Sort topologically: by Y (row), then X (col)
                    candidates.sort(key=lambda im: (round((page.viewport_size['height'] if False else im.get('y', 0)) / 60) * 60, im.get('x', 0)))
                    new_cards = candidates[:len(chunk)]
                    await asyncio.sleep(2)
                    break

                elapsed = int(time.time() - start_poll)
                print(f"    ... waiting ({elapsed}s) | found {len(candidates)}/{len(chunk)} images", end='\r', flush=True)

            print()

            if len(new_cards) < len(chunk):
                print(f"[WARN] Timeout: only received {len(new_cards)}/{len(chunk)} images for batch.")
                # Attempt to save what we have
                if not new_cards:
                    fail_count += len(chunk)
                    continue

            # 5. Download and match images
            for c_i, c_item in enumerate(chunk):
                if c_i < len(new_cards):
                    target_src = new_cards[c_i]['src']
                    c_word = c_item.get('word', 'unknown')
                    c_slug = c_item.get('slug', c_word.lower().replace(' ', '-'))
                    c_stt = c_item.get('stt')
                    c_out = out_dir / (f"{c_stt:03d}_{c_slug}.png" if c_stt else f"{c_slug}.png")
                    try:
                        img_bytes = await fetch_image_base64(page, target_src)
                        with open(c_out, 'wb') as f_out:
                            f_out.write(img_bytes)
                        print(f" -> [SUCCESS] '{c_word}' => {c_out.name} ({len(img_bytes) // 1024} KB)")
                        success_count += 1
                    except Exception as err:
                        print(f"[ERROR] Download failed for '{c_word}': {err}")
                        fail_count += 1
                else:
                    fail_count += 1

            # 6. Jitter delay
            jitter_sec = random.uniform(args.jitter_min, args.jitter_max)
            print(f" -> Cooling down for {jitter_sec:.1f}s...")
            await asyncio.sleep(jitter_sec)

        print("\n" + "=" * 60)
        print("BATCH COMPLETE")
        print(f"Total:     {total}")
        print(f"Success:   {success_count}")
        print(f"Skipped:   {skip_count}")
        print(f"Failed:    {fail_count}")
        print(f"Project:   {project_url}")
        print("=" * 60)

        await close_target.close()

def main():
    parser = argparse.ArgumentParser(description="Headless Google Flow Vocabulary Image Generator")
    parser.add_argument("--manifest", required=True, help="Path to topic manifest.json")
    parser.add_argument("--out-dir", required=True, help="Directory to save downloaded images")
    parser.add_argument("--storage-state", default=None, help="Path to exported Playwright storage_state JSON file")
    parser.add_argument("--profile", default=None, help="Path to Chrome profile directory")
    parser.add_argument("--project-url", default=None, help="Reuse an existing Flow project URL")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of words to generate (0 for all)")
    parser.add_argument("--batch-size", type=int, default=5, help="Number of images/words to generate per prompt (default 5)")
    parser.add_argument("--headless", action="store_true", default=True, help="Run browser headless")
    parser.add_argument("--headful", action="store_false", dest="headless", help="Run browser with visible GUI")
    parser.add_argument("--skip-existing", action="store_true", default=True, help="Skip words with existing image")
    parser.add_argument("--jitter-min", type=float, default=4.0, help="Min seconds sleep between prompts")
    parser.add_argument("--jitter-max", type=float, default=7.0, help="Max seconds sleep between prompts")

    args = parser.parse_args()
    asyncio.run(run_batch(args))

if __name__ == '__main__':
    main()
