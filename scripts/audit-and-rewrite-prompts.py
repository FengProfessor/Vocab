import json
import re

with open('src/data/grammar-topic-assets.json', 'r', encoding='utf-8') as f:
    assets = json.load(f)

with open('docs/grammar/IMAGE_GENERATION_MANIFEST.json', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

# Specific curated prompt templates for precision
CURATED_PROMPTS = {
    # prepositions-place
    "prepositions-place_1": "Close-up view looking down into an open stylish leather tote bag resting on a table, with a shiny brass key ring resting clearly inside the main compartment of the bag",
    "prepositions-place_2": "A clean wooden dining table in a cozy home, with a ceramic bowl of fresh fruit resting on the table surface",
    "prepositions-place_3": "A clean home living room, with a fluffy sleeping cat curled up under a wooden armchair on a soft rug",
    "prepositions-place_4": "Two comfortable armchairs standing side by side next to a sunny window in a modern cafe",
    
    # third-conditional
    "third-conditional_1": "A young man arriving at an empty train station platform looking at a departing train in the distance with a wistful expression",
    "third-conditional_2": "A young woman sitting thoughtfully at a study desk with closed textbooks, looking regretful in a quiet bedroom",
    "third-conditional_3": "A smiling young woman looking happily at a sunny outdoor garden in a bright morning",
    "third-conditional_4": "A young man wearing a warm winter coat walking comfortably down a snowy street",
    
    # verb-to-be
    "verb-to-be_1": "A cheerful young student wearing a neat backpack and holding study notebooks, standing on a sunny school campus",
    "verb-to-be_2": "A radiant young woman smiling broadly with genuine joy, sitting in a cozy sunlit cafe holding a cup of tea",
    "verb-to-be_3": "A set of shiny brass keys resting on top of a clean wooden table in a brightly lit room",
    "verb-to-be_4": "A happy young ten-year-old boy celebrating his birthday, smiling in front of a colorful birthday cake with lit candles",
    
    # demonstratives
    "demonstratives_1": "A person holding up a single shiny golden house key close to the camera, with the key clearly in sharp focus",
    "demonstratives_2": "A person in the foreground pointing towards a magnificent classical museum building with grand stone columns across a wide plaza",
    "demonstratives_3": "A neat stack of three open colorful textbooks lying close on a wooden study table",
    "demonstratives_4": "A scenic view of a majestic snow-capped mountain range rising into a clear blue sky across a vast alpine valley",
    
    # possessives
    "possessives_1": "A smiling student sitting at a desk with their hand placed affectionately on their favorite spiral notebook and pen",
    "possessives_2": "Two polite theater attendees standing in an aisle, with one person gesturing towards a vacant red velvet auditorium seat",
    "possessives_3": "Two charming suburban houses standing side by side along a peaceful tree-lined neighborhood sidewalk",
    "possessives_4": "Two stylish backpacks resting side by side on a park bench, one vibrant royal blue and the other sleek jet black",
    
    # plural-nouns
    "plural-nouns_1": "Two smiling young sisters with arms around each other's shoulders standing in a sunny garden",
    "plural-nouns_2": "A neat storage room with a large stack of brown cardboard packing boxes arranged orderly",
    "plural-nouns_3": "Three energetic happy children playing a game of catch together on a grassy park lawn",
    "plural-nouns_4": "A faithful golden retriever dog sitting calmly beside its seated owner in an autumn park",
}

SUFFIX = ", educational digital illustration, crisp lighting, clear visual storytelling, vibrant colors, no text, no letters, no words, no watermark, no typography, no captions, no signs"

rewritten_count = 0
audit_log = []

for item in manifest:
    slug = item['topic']
    idx = item['cardIndex']
    key = f"{slug}_{idx}"
    sentence = item['sentence']
    vietnamese = item['vietnamese']
    situation = item['situation']
    
    original_prompt = item['prompt']
    new_prompt = None
    
    # Check if we have a curated prompt
    if key in CURATED_PROMPTS:
        new_prompt = CURATED_PROMPTS[key] + SUFFIX
    else:
        # Check for gender and pronouns
        p = original_prompt
        # Clean out any text mentions
        p = re.sub(r"(?:saying|reading|that says|with the words|labeled|written|reads)\s*['\"][^'\"]*['\"]", "", p, flags=re.IGNORECASE)
        p = re.sub(r"['\"][^'\"]*['\"]\s*(?:written|printed|label|sign|candle|name tag)", "", p, flags=re.IGNORECASE)
        p = re.sub(r"\b(name tag|signboard|billboard|poster|banner|written words|labels?)\b", "", p, flags=re.IGNORECASE)
        
        # Gender enforcement based on sentence
        words = re.findall(r'\b[a-zA-Z]+\b', sentence.lower())
        if 'she' in words or 'her' in words:
            if 'man' in p.lower() or 'boy' in p.lower():
                p = re.sub(r'\b(a man|a boy|a young man)\b', 'a young woman', p, flags=re.IGNORECASE)
        elif 'he' in words or 'him' in words or 'his' in words:
            if 'woman' in p.lower() or 'girl' in p.lower():
                p = re.sub(r'\b(a woman|a girl|a young woman)\b', 'a young man', p, flags=re.IGNORECASE)
        elif 'they' in words or 'them' in words:
            if 'a person' in p.lower():
                p = re.sub(r'\ba person\b', 'a group of two people', p, flags=re.IGNORECASE)
                
        # Clean extra spaces
        p = re.sub(r'\s{2,}', ' ', p).strip()
        
        # Re-attach clean suffix
        base = p.split(', educational digital illustration')[0].strip()
        new_prompt = base + SUFFIX

    if new_prompt and new_prompt != original_prompt:
        item['prompt'] = new_prompt
        rewritten_count += 1
        audit_log.append({
            "topic": slug,
            "cardIndex": idx,
            "sentence": sentence,
            "reason": "Pedagogical alignment & zero text enforcement",
            "oldPrompt": original_prompt[:80] + "...",
            "newPrompt": new_prompt[:80] + "..."
        })

print(f"Total prompts rewritten: {rewritten_count}")

with open('docs/grammar/IMAGE_GENERATION_MANIFEST.json', 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

with open('docs/grammar/PROMPT_REWRITE_AUDIT.json', 'w', encoding='utf-8') as f:
    json.dump(audit_log, f, ensure_ascii=False, indent=2)

print("Saved updated manifest and docs/grammar/PROMPT_REWRITE_AUDIT.json")
