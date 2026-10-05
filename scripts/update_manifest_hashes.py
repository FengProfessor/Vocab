import json
import os
import hashlib

manifest_path = 'docs/grammar/IMAGE_GENERATION_MANIFEST.json'
with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

print(f"Current manifest entries: {len(manifest)}")

for m in manifest:
    if m['topic'] == 'wish-if-only' and m['cardIndex'] == 1:
        m['prompt'] = "An introspective student sitting at an empty wooden desk, resting chin on hand with a puzzled face. On the desk is a completely blank white sheet of paper with no text, no lines, no writing. Above the student is a white thought bubble containing only a single question mark '?' and nothing else. Plain background wall, clean educational digital illustration, crisp lighting, vibrant colors, absolutely zero text, no words anywhere"
    elif m['topic'] == 'modals-perfect' and m['cardIndex'] == 1:
        m['prompt'] = "An expressive young woman holding up a modern smartphone with a dark blank screen in her hand towards a male friend with an irritated, frustrated expression. The male friend looks remorseful and apologetic with hands slightly raised. The smartphone is prominently held forward to emphasize the missing phone call. Plain solid wall background, strictly zero text, zero letters, zero clocks, no signs, clean educational illustration, vibrant crisp lighting, 16:9 ratio"
    elif m['topic'] == 'third-conditional' and m['cardIndex'] == 2:
        m['prompt'] = "A sad young woman holding a test paper marked with a red X, sitting at a simple plain desk in front of an empty wall, looking disappointed and regretful, educational digital illustration, crisp lighting, clear visual storytelling, vibrant colors, no text, no letters, no words, no watermark, no typography, no captions, no signs"
    elif m['topic'] == 'prepositions-place' and m['cardIndex'] == 1:
        m['prompt'] = "Close-up view looking down into an open stylish leather tote bag resting on a table, with a shiny brass key ring resting clearly inside the main compartment of the bag, educational digital illustration, crisp lighting, clear visual storytelling, vibrant colors, no text, no letters, no words, no watermark, no typography, no captions, no signs"
    elif m['topic'] == 'grammatical-collocations' and m['cardIndex'] == 4:
        m['prompt'] = "A bustling bakery counter with a long queue of customers lined up to buy fresh pastries, an energetic baker serving croissants from full trays, showing a surge in customer interest. Plain modern bakery interior, absolutely zero text, no signs, no letters, no chalkboard, no labels, clean educational illustration, vibrant lighting, 16:9 ratio"

    rel_path = f"public/grammar/topics/{m['topic']}/{m['cardIndex']:02d}.webp"
    if os.path.exists(rel_path):
        m['file_size'] = os.path.getsize(rel_path)
        with open(rel_path, 'rb') as f_bin:
            m['sha256'] = hashlib.sha256(f_bin.read()).hexdigest()
        m['outputFile'] = f"/grammar/topics/{m['topic']}/{m['cardIndex']:02d}.webp"
        m['diskPath'] = rel_path
        m['format'] = 'image/webp'
        m['dimensions'] = '800x500'

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
    f.write('\n')

print("Successfully updated IMAGE_GENERATION_MANIFEST.json")
