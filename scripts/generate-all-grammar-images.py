import os
import sys
import json
import base64
import urllib.request
import time
import io
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

# Read credentials safely without printing/logging
dotenv_path = '.env.local'
env_vars = {}
with open(dotenv_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env_vars[k.strip()] = v.strip()

account_id = env_vars.get('CLOUDFLARE_ACCOUNT_ID')
token = env_vars.get('CLOUDFLARE_API_TOKEN')

if not account_id or not token:
    print("FATAL: Missing Cloudflare credentials in .env.local", file=sys.stderr)
    sys.exit(1)

CF_URL = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/black-forest-labs/flux-1-schnell"

# Load manifest
manifest_path = 'docs/grammar/IMAGE_GENERATION_MANIFEST.json'
with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

# Step 1: Process Topic 1 (personal-pronouns)
print("=== Step 1: Standardizing Topic 1 (personal-pronouns) 8 cards to WebP ===")
p1_dir = 'public/grammar/topics/personal-pronouns'
p1_photos = [
    ('real_01_i.jpg', '01.webp', 'real_01_i.webp'),
    ('real_02_me.jpg', '02.webp', 'real_02_me.webp'),
    ('real_03_you.jpg', '03.webp', 'real_03_you.webp'),
    ('real_04_he_him.jpg', '04.webp', 'real_04_he_him.webp'),
    ('real_05_she_her.jpg', '05.webp', 'real_05_she_her.webp'),
    ('real_06_it.jpg', '06.webp', 'real_06_it.webp'),
    ('real_07_we_us.jpg', '07.webp', 'real_07_we_us.webp'),
    ('real_08_they_them.jpg', '08.webp', 'real_08_they_them.webp'),
]

for src_name, dst_num, dst_real in p1_photos:
    src_path = os.path.join(p1_dir, src_name)
    if os.path.exists(src_path):
        with Image.open(src_path) as img:
            img_rgb = img.convert('RGB')
            img_resized = img_rgb.resize((800, 500), Image.Resampling.LANCZOS)
            
            # Save both 0X.webp and real_0X.webp
            dst_num_path = os.path.join(p1_dir, dst_num)
            dst_real_path = os.path.join(p1_dir, dst_real)
            img_resized.save(dst_num_path, format='WEBP', quality=85)
            img_resized.save(dst_real_path, format='WEBP', quality=85)
            print(f"  Standardized {src_name} -> {dst_num} ({os.path.getsize(dst_num_path)} bytes)")

# Step 2: Generate 255 Situational Raster WebP Images for Topics 2..62
print("\n=== Step 2: Generating 255 Situational AI Illustrations via FLUX-1-schnell ===")
cards_to_generate = [m for m in manifest if m['topic'] != 'personal-pronouns']
print(f"Total cards queued for AI generation: {len(cards_to_generate)}")

call_count = 0

def generate_single_card(item):
    global call_count
    disk_path = item['diskPath']
    
    # Check if already generated and valid
    if os.path.exists(disk_path) and os.path.getsize(disk_path) > 10000:
        try:
            with open(disk_path, 'rb') as f:
                header = f.read(12)
                if header[:4] == b'RIFF' and header[8:12] == b'WEBP':
                    return (item, True, "Already exists", os.path.getsize(disk_path))
        except Exception:
            pass

    os.makedirs(os.path.dirname(disk_path), exist_ok=True)
    
    prompt = item['prompt']
    payload = json.dumps({"prompt": prompt, "steps": 4}).encode('utf-8')
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    max_retries = 5
    backoff = 3
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(CF_URL, data=payload, headers=headers)
            with urllib.request.urlopen(req, timeout=45) as resp:
                call_count += 1
                data = json.loads(resp.read().decode('utf-8'))
                b64_img = data.get('result', {}).get('image')
                if not b64_img:
                    raise ValueError(f"No image in response: {data}")
                
                raw_bytes = base64.b64decode(b64_img)
                img = Image.open(io.BytesIO(raw_bytes))
                img_rgb = img.convert('RGB')
                img_resized = img_rgb.resize((800, 500), Image.Resampling.LANCZOS)
                
                # Save as WebP
                img_resized.save(disk_path, format='WEBP', quality=85)
                size = os.path.getsize(disk_path)
                return (item, True, "Generated", size)
        except Exception as e:
            err_str = str(e)
            if "429" in err_str:
                sleep_sec = 12 + attempt * 4
                time.sleep(sleep_sec)
            else:
                time.sleep(backoff)
                backoff *= 2
            if attempt == max_retries - 1:
                return (item, False, err_str, 0)

t0 = time.time()
completed = 0
failed = 0

# Concurrency 2 workers for smooth rate-limited generation
with ThreadPoolExecutor(max_workers=2) as executor:
    futures = {executor.submit(generate_single_card, item): item for item in cards_to_generate}
    for fut in as_completed(futures):
        item, success, status, size = fut.result()
        if success:
            completed += 1
            print(f"[{completed}/{len(cards_to_generate)}] OK: {item['topic']}/0{item['cardIndex']}.webp ({size//1024} KB)")
        else:
            failed += 1
            print(f"[{completed+failed}/{len(cards_to_generate)}] FAILED: {item['topic']}/0{item['cardIndex']}.webp: {status}", file=sys.stderr)

elapsed = time.time() - t0
print(f"\nGeneration complete in {elapsed:.1f}s. Completed: {completed}, Failed: {failed}")
print(f"Total API inference calls executed: {call_count}")

if failed > 0:
    print(f"WARNING: {failed} cards failed generation. Please re-run script to complete remaining.", file=sys.stderr)
