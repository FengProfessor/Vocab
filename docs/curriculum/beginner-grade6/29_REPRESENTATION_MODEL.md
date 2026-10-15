# 29. Lexical Representation & Evidence Model (Layer C)

> **Curriculum Project**: English From Zero – Foundation Curriculum (Grade 6 Vietnam, 11–12yo False Beginners, Pre-A1)  
> **Status**: Approved Layer C Specification (Representation & Evidence Architecture)  
> **Core Tenet**: A Word Is Not a Flashcard; A Concept Is an Ecosystem of Representations  

---

## 1. The Single-Flashcard Fallacy

Traditional educational software binds a vocabulary item to a single hard-coded database row:
```typescript
// ANTI-PATTERN: The Brittle Flashcard Model
interface LegacyWord {
  word: "dog";
  vietnamese: "con chó";
  imageUrl: "https://.../cute_puppy.png"; // Single point of failure
  audioUrl: "https://.../dog.mp3";
}
```

### Cognitive Hazards of the Single-Flashcard Model:
1. **Visual Over-Fitting**: A Grade 6 learner memorizes the specific cartoon puppy illustration. When shown a real photograph or a black dog, they fail to recognize the concept because they acquired an **image association**, not a **linguistic lemma**.
2. **Auditory Monoculture**: A learner recognizes a single synthetic voice speaking at 100% volume in isolation, but fails when encountering the word embedded in connected speech with a different pitch or rhythm.
3. **Forced Abstract Clipart**: Attempting to represent abstract function words (*want, need, know, because*) with static clipart forces confusing metaphors (e.g. a cartoon brain with a question mark for *know*), generating severe diagnostic noise.

---

## 2. Multi-Representation Entity Architecture (Layer C)

In the *English From Zero* curriculum, each lexical entry is modeled as an abstract **Lexical Concept Entity** connected to multiple independent representation modalities:

```
                          ┌─────────────────────────────┐
                          │   LEXICAL_CONCEPT ENTITY    │
                          │   Concept ID: CON-G6-066    │
                          │   Lemma: "dog" / /dɔːɡ/     │
                          │   Semantic Core: Canine     │
                          └──────────────┬──────────────┘
                                         │
     ┌───────────────────┬───────────────┼───────────────┬───────────────────┐
     ▼                   ▼               ▼               ▼                   ▼
[TEXT FORMS]       [AUDIO FORMS]    [VISUAL FORMS]  [SYNTACTIC FRAMES] [CONTRAST SETS]
- Citation: dog     - Citation (US)  - Canonical V0  - "I have a dog"   - vs "cat"
- Plural: dogs      - Connected      - Variant V2    - "This is my dog" - vs "pet"
- Ortho tiles       - Slow articulate- Context Scene
```

### Detailed Structural Schema:

```yaml
Concept_ID: CON-G6-066
Canonical_Lemma: "dog"
IPA: "/dɔːɡ/"
Primary_POS: "noun"
Utility_Index: 10000
Generative_Power: 70
Imageability_Tier: "Tier 1 (High)"

Representations:
  Text:
    - id: "TXT-DOG-01"
      form: "dog"
      type: "lemma"
    - id: "TXT-DOG-02"
      form: "dogs"
      type: "regular_plural"

  Audio:
    - id: "AUD-DOG-01"
      type: "citation_clear"
      speaker_profile: "en-US-AriaNeural"
      speed: "1.0x"
      file: "g6_dog_citation.mp3"
    - id: "AUD-DOG-02"
      type: "slow_articulate"
      speed: "0.85x"
      file: "g6_dog_slow.mp3"
    - id: "AUD-DOG-03"
      type: "sentence_coda"
      sentence: "I have a friendly dog."
      file: "g6_dog_sent01.mp3"

  Visual:
    - id: "IMG-DOG-CANONICAL"
      type: "diagnostic_canonical"
      clarity_rating: "V0"
      description: "Friendly golden puppy sitting alert, plain neutral background, 70% focal area"
      file: "public/curriculum/beginner-grade6/images/dog_v0.webp"
    - id: "IMG-DOG-VARIANT-01"
      type: "teaching_variant"
      clarity_rating: "V1"
      description: "Black-and-white small corgi walking playfully, anti-overfitting card"
      file: "public/curriculum/beginner-grade6/images/dog_v1_corgi.webp"
    - id: "IMG-DOG-CONTEXT"
      type: "situational_scene"
      description: "Vietnamese student petting a friendly domestic dog in schoolyard"
      file: "public/curriculum/beginner-grade6/images/dog_context_scene.webp"

  Syntactic_Frames:
    - frame_id: "FRM-DOG-01"
      pattern: "I have a [NOUN]"
      target_slot: "dog"
      example: "I have a dog."
    - frame_id: "FRM-DOG-02"
      pattern: "This is my [NOUN]"
      target_slot: "dog"
      example: "This is my dog."

  Semantic_Contrast_Sets:
    - pair_type: "category_boundary"
      counterpart_concept: "cat"
      discriminator: "Canine bark vs Feline meow"
    - pair_type: "hypernym_boundary"
      counterpart_concept: "pet"
      discriminator: "Specific species vs General companion animal"
```

---

## 3. Representation Rules for Non-Imageable & Abstract Lemmas

A strict pedagogical firewall governs what representation modalities are permitted for each lemma:

```
┌──────────────────────────┬──────────────────────────┬──────────────────────────────┐
│ Semantic Category        │ Permitted Modalities     │ PROHIBITED Modalities        │
├──────────────────────────┼──────────────────────────┼──────────────────────────────┤
│ Concrete Nouns           │ Audio, Text, Static V0   │ Complex busy backgrounds     │
│ (book, pen, bag, dog)    │ Variant Images, Chunks   │ Distracting accessories      │
├──────────────────────────┼──────────────────────────┼──────────────────────────────┤
│ Observable Actions       │ Audio, Text, Dynamic V0  │ Static ambiguous poses       │
│ (run, swim, cook, eat)   │ Motion accents, Chunks   │ Poses without motion lines   │
├──────────────────────────┼──────────────────────────┼──────────────────────────────┤
│ Physical/Emotional States│ Paired Contrast Visuals  │ Isolated floating face icons │
│ (happy, tired, hot, cold)│ Contextual situations    │ Clinical medical depictions  │
├──────────────────────────┼──────────────────────────┼──────────────────────────────┤
│ Abstract Function Words  │ Audio micro-dialogues    │ ANY STATIC IMAGE FLASHCARD   │
│ (want, need, know, can)  │ Two-panel scenarios      │ (Prohibited from standalone  │
│ (because, please, slowly)│ Contrastive routines     │  visual multiple-choice)     │
└──────────────────────────┴──────────────────────────┴──────────────────────────────┘
```

### How to Represent Abstract Concepts Without Clipart:
1. **`want` (Desire / Request)**:
   - *Prohibited*: A cartoon child dreaming of a toy with a thought bubble.
   - *Required Representation*: **Two-Panel Situational Frame**:
     - Panel 1: Empty glass on desk, student pointing with thirst gesture $\to$ audio: *"I want water."*
     - Panel 2: Water glass handed over, smiling relief $\to$ audio: *"Thank you."*
2. **`know` (Mental State)**:
   - *Prohibited*: A head with a glowing lightbulb or gears.
   - *Required Representation*: **Micro-Dialogue Routine**:
     - Teacher: *"What is this in English?"*
     - Student shrugging hands gently with comfortable expression: *"I don't know."*
     - Measures communicative function, not philosophical cognition.

---

## 4. Multi-Representation Defense Against Over-Fitting

To guarantee that a learner has acquired a true semantic concept rather than memorized a single picture:

### The 3-Image Validation Protocol:
1. **Diagnostic Stage**: The student encounters **`Canonical V0`** (purest prototype: e.g. standard blue school backpack).
2. **Teaching & Practice Stage**: The student encounters **`Variant V1`** (different color/style: e.g. dark teal backpack from side angle).
3. **Generalization Probe**: The student encounters **`Context Scene`** (backpack resting beside student on school bench).

```
                      ACQUISITION GENERALIZATION CHECK
                      
        [ Canonical V0 ]          [ Variant V1 ]          [ Context Scene ]
        (Standard Bag)            (Teal Bag)              (Bag on Bench)
              │                         │                        │
              ▼                         ▼                        ▼
       Diagnostic Pass           Instruction Pass        Generalization Pass
              │                         │                        │
              └─────────────────────────┴────────────────────────┘
                                        │
                                        ▼
                         [ CONCEPT ACQUIRED: TRUE ]
                         (Resistant to Visual Bias)
```

---

## 5. Evidence Invalidation Protocol (Instrument Integrity)

If an instructional or diagnostic probe returns an error:

```python
def process_probe_result(learner_id, concept_id, probe_response, visual_asset_id):
    # Step 1: Check visual asset integrity
    asset = get_visual_asset(visual_asset_id)
    
    if asset.clarity_rating in ["V2", "V3"]:
        # INSTRUMENT FAILURE: The image is flawed, NOT the child!
        log_event(
            event="PROBE_INVALIDATED",
            reason="VISUAL_AMBIGUITY_SUSPECTED",
            learner_id=learner_id,
            concept_id=concept_id,
            asset_id=visual_asset_id
        )
        # Protect learner profile: DO NOT decrement mastery score!
        schedule_reprobe_with_alternate_representation(learner_id, concept_id)
        flag_asset_for_art_audit(visual_asset_id)
        return
        
    # Step 2: Normal linguistic evidence logging
    if probe_response.is_correct:
        record_evidence(learner_id, concept_id, probe_response.dimension, status="PASS")
    else:
        record_gap(learner_id, concept_id, infer_gap_type(probe_response))
```

This protocol guarantees that **no child is ever penalized for bad artwork**.
