import json
import re

with open('src/data/grammar-topic-assets.json', 'r', encoding='utf-8') as f:
    assets = json.load(f)

extracted = []
for slug, cards in assets.items():
    if slug == 'personal-pronouns':
        continue
    for idx, c in enumerate(cards):
        cap = c.get('caption', '')
        # Extract sentence
        m = re.match(r'^\"+([^\"]+?)\"+(?:\s*→\s*\"+([^\"]+?)\"+)?\s*\(([^)]+)\)\s*(?:—|–|-)\s*(?:Tình huống|Ngữ cảnh):\s*(.*)$', cap)
        if m:
            en1 = m.group(1).strip()
            en2 = m.group(2).strip() if m.group(2) else ''
            vi = m.group(3).strip()
            sit = m.group(4).strip()
            sentence = f"{en1} -> {en2}" if en2 else en1
        else:
            # Fallback
            sentence = cap.split('(')[0].replace('"', '').strip()
            vi = cap.split('(')[1].split(')')[0].strip() if '(' in cap and ')' in cap else ''
            sit = cap.split('—')[-1].replace('Tình huống:', '').strip() if '—' in cap else ''

        extracted.append({
            'topic': slug,
            'cardIndex': idx + 1,
            'sentence': sentence,
            'vi': vi,
            'situation': sit,
            'alt': c.get('imageAlt', '')
        })

print(f"Extracted {len(extracted)} cards for topics 2..62.")
with open('scripts/extracted-cards.json', 'w', encoding='utf-8') as f:
    json.dump(extracted, f, ensure_ascii=False, indent=2)
print("Saved to scripts/extracted-cards.json")
