import json
import re

with open('src/data/grammar-topic-assets.json', 'r', encoding='utf-8') as f:
    assets = json.load(f)

print(f"Total topics: {len(assets)}")
matched = 0
total = 0

for slug, cards in assets.items():
    for idx, c in enumerate(cards):
        total += 1
        cap = c.get('caption', '')
        # Pattern matching
        m = re.match(r'^\"([^\"]+)\"\s*\(([^)]+)\)\s*(?:—|–|-)\s*(?:Tình huống|Ngữ cảnh):\s*(.*)$', cap)
        if m:
            matched += 1
        else:
            # Try alternate pattern
            m2 = re.match(r'^\"([^\"]+)\"', cap)
            if not m2:
                print(f"[{slug} card {idx+1}] No quote: {cap}")

print(f"Matched canonical pattern: {matched}/{total}")
