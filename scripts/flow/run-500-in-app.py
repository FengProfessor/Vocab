import asyncio
import base64
import json
import os
import re
import sys
import time
from pathlib import Path
from playwright.async_api import async_playwright

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def slugify(s: str) -> str:
    return "".join(c if c.isalnum() else "_" for c in s.lower()).strip("_")

async def extract_image_bytes(img_locator):
    try:
        # Method 1: Canvas extraction for maximum original resolution
        data_url = await img_locator.evaluate('''async (img) => {
            if (!img.complete || img.naturalWidth === 0) return null;
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                return canvas.toDataURL('image/png');
            } catch (e) {
                return null;
            }
        }''')
        if data_url and ',' in data_url:
            return base64.b64decode(data_url.split(',', 1)[1])
    except Exception:
        pass

    try:
        # Method 2: Playwright element screenshot fallback
        return await img_locator.screenshot(type='png')
    except Exception:
        return None

async def main():
    bulk_file = Path('tmp/flow/vocab_500_bulk.txt').resolve()
    if not bulk_file.exists():
        print(f"[ERROR] {bulk_file} not found.")
        return

    raw_lines = [l.strip() for l in bulk_file.read_text(encoding='utf-8').splitlines() if l.strip()]
    vocab_items = []
    vocab_by_stt = {}
    for line in raw_lines:
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 2:
            stt = int(parts[0]) if parts[0].isdigit() else len(vocab_items) + 1
            word = parts[1]
            desc = parts[2] if len(parts) > 2 else word
            item = {'stt': stt, 'word': word, 'desc': desc, 'slug': slugify(word)}
            vocab_items.append(item)
            vocab_by_stt[stt] = item

    print(f"Loaded {len(vocab_items)} vocabulary items from {bulk_file.name}")

    out_dir = Path('tmp/flow/500_output')
    out_dir.mkdir(parents=True, exist_ok=True)

    progress_file = out_dir / "progress.json"
    saved_stts = set()
    for f in out_dir.glob("*.png"):
        m = re.match(r"^(\d+)_", f.name)
        if m and f.stat().st_size > 5000:
            saved_stts.add(int(m.group(1)))

    print(f"Existing valid saved images on disk: {len(saved_stts)}")

    profile_dir = os.path.expandvars(r'%LOCALAPPDATA%\ffroliva\gflow-cli\profile_fengprofessor')
    print("=" * 65)
    print("GOOGLE FLOW APP: BULK 500 REALISTIC EVERYDAY GENERATOR")
    print(f"Profile:     {profile_dir}")
    print(f"Total Words: {len(vocab_items)}")
    print(f"Output:      {out_dir}")
    print("=" * 65)

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
        print(f"[FlowApp] Opening tool editor: {tool_url}...")
        await page.goto(tool_url, wait_until='domcontentloaded', timeout=45000)
        await asyncio.sleep(6)

        # Click 'Xem trước' tab
        preview = page.locator('button:has-text("Xem trước"), [role="tab"]:has-text("Xem trước")').first
        if await preview.count() > 0:
            await preview.click()
            await asyncio.sleep(4)

        # Locate tool frame
        app_frame = None
        for fr in page.frames:
            if await fr.locator('button:has-text("Bắt đầu tạo hàng loạt"), button:has-text("Tạo thẻ này")').count() > 0:
                app_frame = fr
                break

        if not app_frame:
            print("[ERROR] Tool frame not found in page frames!")
            await browser.close()
            return

        print("[OK] Found Flow Tool frame!")

        # 1. Select 'Realistic Photo' in Art Style <select>
        select_els = await app_frame.locator('select').all()
        for s in select_els:
            opts = await s.locator('option').all_inner_texts()
            if any('Realistic' in o for o in opts):
                print(f"[FlowApp] Setting Art Style to 'Realistic Photo'...")
                await s.select_option(label='Realistic Photo')
                await s.dispatch_event('change')
                await asyncio.sleep(1)
                break

        # 2. Fill the 500 realistic scenes into textarea
        print("[FlowApp] Filling 500 items into textarea...")
        textarea = app_frame.locator('textarea').first
        content_all = bulk_file.read_text(encoding='utf-8')
        await textarea.fill(content_all)
        await textarea.dispatch_event('input')
        await asyncio.sleep(4)
        cards_count = await app_frame.locator('button:has-text("Tạo thẻ này"), button:has-text("Tải thẻ xuống")').count()
        print(f"[FlowApp] Cards rendered after input: {cards_count}")

        # 3. Check "Bắt đầu tạo hàng loạt" button
        batch_btn = app_frame.locator('button:has-text("Bắt đầu tạo hàng loạt")').first
        stop_btn = app_frame.locator('button:has-text("Dừng tiến trình")').first

        if await stop_btn.count() > 0:
            print("[FlowApp] Batch process is ALREADY ACTIVE and generating!")
        elif await batch_btn.count() > 0:
            print("[FlowApp] Clicking 'Bắt đầu tạo hàng loạt' (Start Batch)...")
            await batch_btn.click()
            await asyncio.sleep(3)
        else:
            print("[FlowApp] Checking state...")

        # 4. Continuous monitoring & image saving loop
        start_time = time.time()
        last_screenshot_time = time.time()
        last_save_time = time.time()
        print("\n[FlowApp] Monitoring batch generation queue (Realistic Everyday Life)...")

        scroll_y = 0
        while True:
            await asyncio.sleep(6)
            now = time.time()

            # Find all card containers
            all_cards = await app_frame.locator('div:has(button:has-text("Tải thẻ xuống")), div:has(button:has-text("Tạo thẻ này"))').all()

            new_saved = 0
            for card in all_cards:
                try:
                    dl_btn = card.locator('button:has-text("Tải thẻ xuống")')
                    if await dl_btn.count() > 0:
                        img = card.locator('img')
                        if await img.count() > 0:
                            card_text = await card.inner_text()
                            m = re.search(r'#(\d+)', card_text)
                            if m:
                                stt = int(m.group(1))
                                matched_item = vocab_by_stt.get(stt)
                                if matched_item and stt not in saved_stts:
                                    slug = matched_item['slug']
                                    out_img = out_dir / f"{stt:03d}_{slug}.png"
                                    img_data = await extract_image_bytes(img.first)
                                    if img_data and len(img_data) > 5000:
                                        out_img.write_bytes(img_data)
                                        saved_stts.add(stt)
                                        new_saved += 1
                                        print(f" -> [SAVED {len(saved_stts)}/500] #{stt} '{matched_item['word']}' => {out_img.name} ({len(img_data)//1024} KB)")
                except Exception:
                    continue

            # Update progress JSON
            if new_saved > 0 or now - last_save_time > 30:
                last_save_time = now
                progress_file.write_text(json.dumps({
                    'total': len(vocab_items),
                    'completed_count': len(saved_stts),
                    'completed_stts': sorted(list(saved_stts)),
                    'last_updated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
                    'elapsed_minutes': round((now - start_time) / 60, 1),
                }, indent=2), encoding='utf-8')

            # Check if all completed
            if len(saved_stts) >= len(vocab_items):
                print(f"\n[DONE] All {len(vocab_items)} vocabulary images successfully generated and saved!")
                break

            # Status log
            elapsed_m = (now - start_time) / 60
            print(f" ... [{elapsed_m:.1f}m] Saved: {len(saved_stts)}/500 images | Queue active...", end='\r', flush=True)

            # Auto-scroll slightly to keep DOM reactive
            try:
                scroll_y = (scroll_y + 400) % 8000
                await app_frame.evaluate(f'(y) => window.scrollTo(0, y)', scroll_y)
            except Exception:
                pass

            # Periodically take screenshot every 2 minutes
            if now - last_screenshot_time > 120:
                last_screenshot_time = now
                try:
                    await page.screenshot(path='tmp/flow/tools/500_running_status.png')
                except Exception:
                    pass

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
