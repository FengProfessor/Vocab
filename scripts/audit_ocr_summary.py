import json

items = json.load(open('ocr_audit_results.json', encoding='utf-8'))
print(f"Total detections: {len(items)}")

high_severity = [] # Full speech bubbles or readable sentences
medium_severity = [] # Words/garbled phrases on posters/signs/screens
low_severity = [] # Single numbers or tiny glyphs

for x in items:
    text_str = ' '.join(x['text'])
    words = [w for w in text_str.split() if len(w) > 2]
    has_stopword = any(w.lower() in ['you', 'she', 'they', 'have', 'must', 'come', 'leave', 'help', 'said', 'will', 'not', 'can', 'may', 'the', 'this', 'that', 'were', 'had', 'been'] for w in text_str.split())
    
    if len(words) >= 3 or (has_stopword and len(words) >= 2):
        high_severity.append((x['topic'], x['cardIndex'], text_str))
    elif len(words) >= 1:
        medium_severity.append((x['topic'], x['cardIndex'], text_str))
    else:
        low_severity.append((x['topic'], x['cardIndex'], text_str))

print(f"\n--- HIGH SEVERITY (Speech bubbles / full sentences) count: {len(high_severity)} ---")
for t, c, s in high_severity:
    print(f"  {t}/{c:02d}: {s[:80]}")

print(f"\n--- MEDIUM SEVERITY (Garbled words on posters/signs) count: {len(medium_severity)} ---")
for t, c, s in medium_severity:
    print(f"  {t}/{c:02d}: {s[:80]}")

print(f"\n--- LOW SEVERITY (Numbers/symbols/noise) count: {len(low_severity)} ---")
for t, c, s in low_severity:
    print(f"  {t}/{c:02d}: {s[:80]}")
