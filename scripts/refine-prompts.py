import json
import re

with open('src/data/grammar-topic-assets.json', 'r', encoding='utf-8') as f:
    assets = json.load(f)

# Load existing manifest
with open('docs/grammar/IMAGE_GENERATION_MANIFEST.json', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

refined_count = 0

def clean_and_enhance_prompt(m, asset_card):
    p = m['prompt']
    
    # 1. Remove any quote artifacts like "saying '...'", "reading '...'", "that says '...'"
    p = re.sub(r"(?:saying|reading|that says|with the words|labeled|written)\s*['\"][^'\"]*['\"]", "", p, flags=re.IGNORECASE)
    p = re.sub(r"['\"][^'\"]*['\"]\s*(?:written|printed|label|sign)", "", p, flags=re.IGNORECASE)
    p = re.sub(r"holding a ['\"][^'\"]*['\"] candle", "holding birthday candles", p, flags=re.IGNORECASE)
    p = re.sub(r"name tag that reads.*?,", "", p, flags=re.IGNORECASE)
    p = re.sub(r"with a name tag.*?,", "", p, flags=re.IGNORECASE)
    
    # Clean up double spaces or commas
    p = re.sub(r'\s+,', ',', p)
    p = re.sub(r',\s*,', ',', p)
    p = re.sub(r'\s{2,}', ' ', p).strip()
    
    # Ensure core quality and negative style suffix
    suffix = ", educational digital illustration, crisp lighting, clear visual storytelling, vibrant colors, no text, no letters, no words, no watermark, no typography, no captions, no signs"
    
    # Strip existing suffixes to rebuild uniformly
    for phrase in [
        ", educational digital illustration",
        ", vibrant colors",
        ", clear lighting",
        ", no text",
        ", no letters",
        ", no words",
        ", no watermark",
        ", no typography",
        ", clear situational educational illustration",
        ", modern vibrant art style"
    ]:
        p = p.replace(phrase, "")
        
    p = p.strip().rstrip('.,;') + suffix
    return p

for item in manifest:
    slug = item['topic']
    idx = item['cardIndex']
    cards = assets.get(slug, [])
    card = cards[idx - 1] if idx <= len(cards) else None
    
    if slug != 'personal-pronouns':
        old_p = item['prompt']
        item['prompt'] = clean_and_enhance_prompt(item, card)
        if item['prompt'] != old_p:
            refined_count += 1

print(f"Refined {refined_count} prompts in manifest.")

with open('docs/grammar/IMAGE_GENERATION_MANIFEST.json', 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Saved refined manifest to docs/grammar/IMAGE_GENERATION_MANIFEST.json")
