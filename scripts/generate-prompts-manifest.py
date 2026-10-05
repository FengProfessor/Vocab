import os
import json
import urllib.request
import time
import re

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

with open('scripts/extracted-cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

print(f"Total cards to generate prompts for: {len(cards)}")

system_prompt = """You are an expert educational art director for an English-learning web app for Vietnamese students.
For each card, generate a vivid, concrete visual scene description for FLUX.1 image generation.
The image MUST depict the exact situation of the English example sentence and Vietnamese meaning so a learner understands the grammatical concept at a glance.

STRICT CONSTRAINTS:
1. Absolutely NO text, letters, signs, labels, book covers with text, or readable typography in the scene.
2. Focus on characters, their actions, posture, facial expressions, clear physical objects, and distinct environments.
3. Every prompt MUST end with: ", educational digital illustration, vibrant colors, clear lighting, no text, no letters, no words, no watermark, no typography"
4. Output a STRICT JSON object mapping each card's "id" (e.g. "verb-to-be_1") to the prompt string.
"""

def clean_json_str(s):
    s = s.strip()
    if s.startswith('```json'):
        s = s[7:]
    elif s.startswith('```'):
        s = s[3:]
    if s.endswith('```'):
        s = s[:-3]
    return s.strip()

prompts_dict = {}

# We also prepare a fallback prompt builder in case the LLM skips a key
def fallback_prompt(c):
    return (
        f"A detailed scene illustrating '{c['sentence']}' ({c['situation']}), "
        f"showing clear character interaction and authentic environmental context, "
        f"educational digital illustration, vibrant colors, clear lighting, no text, no letters, no words, no watermark, no typography"
    )

batch_size = 15
for i in range(0, len(cards), batch_size):
    batch = cards[i:i+batch_size]
    print(f"Processing batch {i//batch_size + 1}/{(len(cards)+batch_size-1)//batch_size} (cards {i+1} to {min(i+batch_size, len(cards))})...")
    
    input_items = [
        {
            "id": f"{c['topic']}_{c['cardIndex']}",
            "sentence": c['sentence'],
            "vietnamese": c['vi'],
            "situation": c['situation']
        }
        for c in batch
    ]
    
    user_msg = f"Generate prompts for these cards:\n{json.dumps(input_items, ensure_ascii=False, indent=2)}\n\nOutput JSON:"
    
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.1-8b-instruct"
    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg}
        ],
        "temperature": 0.2,
        "max_tokens": 1500
    }
    
    for attempt in range(3):
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                raw = data.get("result", {}).get("response", "")
                parsed = json.loads(clean_json_str(raw))
                for item in input_items:
                    k = item["id"]
                    if k in parsed:
                        p = parsed[k].strip()
                        # Ensure negative suffix
                        if "no text" not in p:
                            p += ", educational digital illustration, vibrant colors, clear lighting, no text, no letters, no words, no watermark, no typography"
                        prompts_dict[k] = p
                    else:
                        c_match = next((x for x in batch if f"{x['topic']}_{x['cardIndex']}" == k), None)
                        prompts_dict[k] = fallback_prompt(c_match)
                break
        except Exception as e:
            print(f"  Attempt {attempt+1} failed: {e}")
            time.sleep(2)
            if attempt == 2:
                for item in input_items:
                    k = item["id"]
                    c_match = next((x for x in batch if f"{x['topic']}_{x['cardIndex']}" == k), None)
                    prompts_dict[k] = fallback_prompt(c_match)

print(f"Total prompts successfully gathered: {len(prompts_dict)}")

# Now build the full manifest
manifest = []

# First Topic 1 (personal-pronouns): 8 cards
with open('src/data/grammar-topic-assets.json', 'r', encoding='utf-8') as f:
    full_assets = json.load(f)

for idx, c in enumerate(full_assets.get('personal-pronouns', [])):
    manifest.append({
        "topic": "personal-pronouns",
        "cardIndex": idx + 1,
        "sentence": c.get('caption', '').split('(')[0].replace('"', '').strip(),
        "vietnamese": c.get('caption', '').split('(')[1].split(')')[0].strip() if '(' in c.get('caption', '') else '',
        "situation": "Đại từ nhân xưng chuẩn giao tiếp sư phạm",
        "prompt": f"Authentic professional photograph representing {c.get('imageAlt', '')}, natural lighting, clean composition, high resolution",
        "outputFile": f"/grammar/topics/personal-pronouns/0{idx+1}.webp",
        "diskPath": f"public/grammar/topics/personal-pronouns/0{idx+1}.webp",
        "format": "image/webp",
        "dimensions": "800x500"
    })

# Topics 2..62
for c in cards:
    k = f"{c['topic']}_{c['cardIndex']}"
    num_str = f"0{c['cardIndex']}" if c['cardIndex'] < 10 else f"{c['cardIndex']}"
    manifest.append({
        "topic": c['topic'],
        "cardIndex": c['cardIndex'],
        "sentence": c['sentence'],
        "vietnamese": c['vi'],
        "situation": c['situation'],
        "prompt": prompts_dict.get(k, fallback_prompt(c)),
        "outputFile": f"/grammar/topics/{c['topic']}/{num_str}.webp",
        "diskPath": f"public/grammar/topics/{c['topic']}/{num_str}.webp",
        "format": "image/webp",
        "dimensions": "800x500"
    })

print(f"Total manifest entries: {len(manifest)} (8 from topic 1 + 255 from topics 2..62 = 263 total)")
os.makedirs('docs/grammar', exist_ok=True)
with open('docs/grammar/IMAGE_GENERATION_MANIFEST.json', 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Saved manifest to docs/grammar/IMAGE_GENERATION_MANIFEST.json")
