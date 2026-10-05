import os
import json
import urllib.request
import time

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

sample_cards = cards[:5]

system_prompt = """You are an educational art director for an English-learning web app for Vietnamese students.
For each card, generate a vivid, clear, concrete visual scene description for FLUX image generation.
The image must clearly depict the specific situation of the English example sentence so a learner infers the meaning at a glance.
Requirements:
1. Describe characters, objects, setting, actions, emotions, and lighting concretely.
2. Absolutely DO NOT include text, letters, signs, typography, or captions in the image.
3. Keep each prompt to 1-2 descriptive sentences.
4. Output STRICT JSON object mapping the card "key" to the visual prompt string.
Format:
{
  "verb-to-be_1": "A friendly student wearing a backpack...",
  "verb-to-be_2": "..."
}
"""

input_payload = [{"key": f"{c['topic']}_{c['cardIndex']}", "sentence": c['sentence'], "vietnamese": c['vi'], "situation": c['situation']} for c in sample_cards]

user_prompt = f"Cards to process:\n{json.dumps(input_payload, ensure_ascii=False, indent=2)}\n\nOutput JSON:"

url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.1-8b-instruct"
data = {
    "messages": [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ],
    "temperature": 0.2,
    "max_tokens": 1000
}

t0 = time.time()
req = urllib.request.Request(
    url,
    data=json.dumps(data).encode("utf-8"),
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
)

with urllib.request.urlopen(req, timeout=30) as resp:
    res = json.loads(resp.read().decode("utf-8"))
    raw = res.get("result", {}).get("response", "")
    print(f"Elapsed: {time.time()-t0:.2f}s")
    print("Raw output:\n", raw)
