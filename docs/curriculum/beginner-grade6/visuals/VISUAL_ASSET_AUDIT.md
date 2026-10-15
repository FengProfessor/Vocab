# Repository Visual Asset Audit & Provenance Verification

> **Curriculum Project**: English From Zero – Foundation Curriculum (Grade 6 Vietnam, 11–12yo False Beginners, Pre-A1)  
> **Status**: Comprehensive Initial Audit Complete  
> **Audit Date**: 2026-10-09  
> **Auditors**: Curriculum Engineering Team & Visual Pedagogy Lead  

---

## 1. Executive Summary

Before generating any new visual assets for the *English From Zero* curriculum, an exhaustive repository-wide visual asset audit was executed across all disk directories (`public/`, `src/`, `content/`, `docs/`, `tmp/`, `tmp-*/`), runtime fetch pipelines, and database references.

### Key Findings:
1. **Total Visual Files Scanned on Disk**: 1,248+ visual files (excluding `node_modules`, `.next`, `.git`, mobile platform builds).
2. **Pedagogical Alignment with Grade 6 False Beginners**: **0% ready out-of-the-box**. 
   - Existing repository assets were designed for adult TOEIC test prep, corporate grammar topics (B1/B2), system UI onboarding, or legacy 35mm photorealistic bulk tests.
   - None of the existing assets were authored specifically for an 11–12-year-old Vietnamese secondary school learner at Pre-A1 level.
3. **Provenance & Copyright Integrity**:
   - `public/grammar/foundation/a0` & `a1`: **WEB_SOURCED_LICENSE_VERIFIED** (OpenMoji SVGs under CC BY-SA 4.0) + 1 **PROJECT_AI_GENERATED** (OpenAI ImageGen).
   - `public/grammar/topics/` (263 WebP files): **PROJECT_AI_GENERATED** (Cloudflare Flux-1-schnell via strict manifests) + a few legacy photos flagged as **WEB_SOURCED_LICENSE_UNKNOWN**.
   - `tmp/flow/500_output/` (501 PNG files): **PROJECT_AI_GENERATED** (35mm photorealistic prompts), but uncompressed (2MB+ each), 16:9 widescreen, and pedagogically ambiguous for beginners.
   - `tmp-check-*/`: **WEB_SOURCED_LICENSE_UNKNOWN** (scraped test thumbnails from web search engines). Quarantined; prohibited from student-facing use.
4. **Actionable Mandate**: Zero existing assets can be directly repurposed as primary diagnostic flashcards for Grade 6 without causing severe ambiguity or cognitive mismatch. A clean, purpose-built, dedicated visual set (**Modern Educational Illustration style**) must be generated under strict prompt constraints.

---

## 2. Evaluation Framework (10 Mandatory Criteria)

Every asset category in the repository is evaluated against the following 10 standards:

| # | Evaluation Criterion | Pedagogical Rationale for Grade 6 Beginner |
|---|---|---|
| **C1** | **Asset Existence** | Does an image file or referenced URL physically exist in the repo? |
| **C2** | **Target Representation** | What specific vocabulary item, chunk, or grammatical pattern does it target? |
| **C3** | **Meaning Obviousness** | Can an 11–12-year-old recognize the core meaning within 1.5 seconds without reading any text? |
| **C4** | **Semantic Exclusivity** | Does the image isolate the single intended lemma, or could it easily mean 2–3 other English words? |
| **C5** | **Background Noise & Clutter** | Does background context distract or compete with the focal concept? |
| **C6** | **Age Appropriateness** | Is the visual dignified for 11–12yo (secondary school)? Avoids babyish/toddler chibi and adult corporate suits. |
| **C7** | **Vietnamese Cultural Relatability** | Are character uniforms, domestic objects, and school settings culturally relatable without stereotyping? |
| **C8** | **Visual Style Consistency** | Does the art style belong to a unified, cohesive visual design system? |
| **C9** | **Zero Text Leakage** | Is there zero embedded text on objects, books, signs, or shirts that leaks the answer? |
| **C10** | **Legal Provenance Verified** | Is the asset's origin strictly classified and legally cleared for educational app use? |

---

## 3. Provenance & Ambiguity Classification Scales

### Provenance States (Strict 5-Tier Scale):
- **`A. USER_CREATED`**: Evidence indicates the project owner or internal design team personally authored the asset.
- **`B. PROJECT_AI_GENERATED`**: Formally generated via internal AI workflows (Flux, DALL-E, SD) with verifiable prompt manifests on disk.
- **`C. WEB_SOURCED_LICENSE_VERIFIED`**: Downloaded from an external source with verified public license documentation (e.g. OpenMoji CC BY-SA 4.0).
- **`D. WEB_SOURCED_LICENSE_UNKNOWN`**: Downloaded from the internet without explicit attribution or license proof. **Must be quarantined or replaced.**
- **`E. PROVENANCE_UNKNOWN`**: Binary file with no commit log, metadata, or origin documentation.

### Visual Semantic Clarity Ratings (Ambiguity Scale):
- **`V0 — EXCELLENT`**: Immediate single-point interpretation (<1.0s); zero competing objects; zero text; 100% age-appropriate.
- **`V1 — ACCEPTABLE`**: Clear focal point; minor contextual background that does not induce semantic confusion.
- **`V2 — AMBIGUOUS`**: Plausibly represents two or more distinct English words (e.g. a boy eating an apple could mean *eat*, *boy*, *apple*, *red*, or *breakfast*). Unusable for strict diagnostic testing.
- **`V3 — INVALID`**: Severe cognitive mismatch, answer leakage, toddler/chibi aesthetic offensive to Grade 6, or adult business context alienating to children.

---

## 4. Deep Audit of Existing Repository Asset Clusters

### Cluster A: `public/grammar/foundation/a0/` & `a1/`
- **Asset Count**: 40 SVG icons (OpenMoji) + 1 PNG situation illustration (`a0/01.png`).
- **Target Audience**: General beginner grammar (sentences like "This is a book", "I have a bag").
- **Provenance**:
  - SVGs: `WEB_SOURCED_LICENSE_VERIFIED` (OpenMoji project, CC BY-SA 4.0, documented in `ATTRIBUTION.md`).
  - `a0/01.png`: `PROJECT_AI_GENERATED` (OpenAI ImageGen via prompt in `ATTRIBUTION.md`).
- **Audit Findings**:
  - *Clarity*: V1–V2. Emojis represent discrete icons (🍎, 📖, 🎒) well, but lack human scale, instructional dignity, and action dynamics.
  - *Age Appropriateness*: Borderline. Standard emojis can feel generic or chat-like rather than an engaging educational course.
  - *Answer Leakage*: Clean (no embedded text).
  - *Verdict*: Useful as supplementary lightweight icons in grammar tables, but **inadequate for Grade 6 core vocabulary diagnostics** where actions, physical gestures, and relational concepts need clear illustrative rendering.

### Cluster B: `public/grammar/topics/` (Adult/Corporate Grammar Visuals)
- **Asset Count**: 263 WebP illustrations + 16 legacy JPEG reference photos across 62 grammar topics.
- **Provenance**: `PROJECT_AI_GENERATED` (generated via Cloudflare Flux-1-schnell, fully cataloged in `docs/grammar/IMAGE_GENERATION_MANIFEST.json` and audited in `docs/grammar/VISUAL_INSPECTION_263.md`).
- **Audit Findings**:
  - *Subject Matter*: Professional corporate environments (engineers in server rooms, directors reviewing reports, architects at drafting boards).
  - *Clarity for Grade 6*: **`V3 — INVALID`**.
  - *Reasoning*: A 6th grader in Vietnam learning "he" or "she" cannot relate to a corporate project manager in a blazer presenting a quarterly sales forecast. It increases cognitive anxiety and presents English as an intimidating adult corporate chore.
  - *Verdict*: Kept strictly for the adult B1/B2 grammar track. **Completely excluded from the Grade 6 Beginner Curriculum**.

### Cluster C: `tmp/flow/500_output/` (500 Photorealistic Vocabulary Images)
- **Asset Count**: 501 PNG files (generated from `vocab_500_manifest.json`).
- **Provenance**: `PROJECT_AI_GENERATED` (AI prompt template: *"A candid, authentic, high-resolution photograph of ... cinematic 35mm photography ... 16:9 widescreen"*).
- **Audit Findings**:
  - *Resolution & Performance*: Each file is ~2.0 MB to ~3.5 MB uncompressed PNG. Loading four cards in a diagnostic quiz would require transferring 10+ MB, causing severe lag on mobile connections.
  - *Semantic Exclusivity*: **`V2 — AMBIGUOUS`**. Example: `001_family.png` depicts an extended multi-generational family eating dinner in a brightly decorated dining room. A beginner asked to identify the picture could reasonably answer *family*, *dinner*, *eat*, *people*, *food*, *table*, or *happy*.
  - *Cultural Context*: Predominantly Western suburban living rooms and kitchens, diminishing emotional connection for Vietnamese learners.
  - *Verdict*: Unusable in current state for Grade 6. Stored in `tmp/`. Must not be moved to `public/` without complete re-prompting and conversion.

### Cluster D: `tmp/flow/` 3D Pixar Tests (`manifest.json` & `prompts.txt`)
- **Asset Count**: 5 sample images (`reluctant`, `scrutinize`, `abundant`, etc.).
- **Provenance**: `PROJECT_AI_GENERATED` (Prompts specifying *"3d stylized digital art, Pixar aesthetic, soft cinematic lighting"*).
- **Audit Findings**:
  - *Aesthetic Evaluation*: While visually polished, the "Pixar toddler" style (huge cartoon eyes, babyish chubby cheeks) is perceived by 11–12-year-old Vietnamese 6th graders as "trẻ con" (too childish).
  - *Target Vocabulary*: Advanced B2/C1 words and idioms (`reluctant`, `scrutinize`, `cost an arm and a leg`), completely irrelevant to Pre-A1.
  - *Verdict*: Retain as reference for 3D prompt syntax, but reject the babyish character proportions for Grade 6.

### Cluster E: `tmp-check-imgs/`, `tmp-check-200/`, `tmp-verify/` (Web-Scraped Test Caches)
- **Asset Count**: 110+ JPEG files.
- **Provenance**: **`WEB_SOURCED_LICENSE_UNKNOWN`** (downloaded dynamically during image-pipeline validation scripts from search engines).
- **Audit Findings**:
  - Severe copyright and quality risks. No verifiable open license metadata.
  - *Verdict*: **QUARANTINED**. Marked for deletion upon completion of image pipeline migration. Strict rule: **Never deploy or reference in student-facing components**.

### Cluster F: `public/images/` & `public/lingo-town/`
- **Asset Count**: 12 files (TOEIC book covers, posters, RPG map tiles).
- **Provenance**: `USER_CREATED` / `PROJECT_AI_GENERATED`.
- **Audit Findings**: Not relevant to Grade 6 foundation vocabulary.

---

## 5. Vocabulary Overlap Analysis with 100 Core Lemmas

We mapped the repository's existing visual files against the 100 core foundation lemmas (`core-lexicon.csv`):

| Core Lemma | ID | Existing Asset in Repo | Current Path | Provenance | Semantic Verdict | Action Required |
|---|---|---|---|---|---|---|
| **name** | `lex-001` | Generic name tag illustration | `tmp/flow/500_output/033_name.png` | `PROJECT_AI_GENERATED` | `V2 — AMBIGUOUS` | Exclude. Abstract concept; teach via dialogue frame, not static flashcard. |
| **student** | `lex-002` | Adult university student photo | `public/grammar/topics/personal-pronouns/ex_i_student.jpg` | `PROJECT_AI_GENERATED` | `V3 — INVALID` (Adult) | **Generate New**: 11–12yo Vietnamese student in school uniform with red scarf. |
| **football** | `lex-010` | Adult soccer match scene | `public/grammar/topics/personal-pronouns/ex_he_football.jpg` | `PROJECT_AI_GENERATED` | `V2 — AMBIGUOUS` | **Generate New**: Clean modern illustration of soccer ball or middle school kick. |
| **swim** | `lex-016` | None on disk | None | None | Missing | **Generate New**: Secondary student swimming freestyle in lane (high-priority pilot). |
| **run** | `lex-017` | None on disk | None | None | Missing | **Generate New**: Secondary student sprinting on school running track (pilot contrast). |
| **draw** | `lex-018` | None on disk | None | None | Missing | **Generate New**: Hand drawing a cat on paper with pencil (pilot). |
| **cook** | `lex-019` | Idiom cartoon (`cook the books`) | `tmp/chatgpt-phrase-images/cook_the_books.png` | `PROJECT_AI_GENERATED` | `V3 — INVALID` (Idiom) | **Generate New**: Teen stirring soup in pot in domestic kitchen (pilot). |
| **bag** | `lex-027` | Emoji icon (🎒) | `public/grammar/foundation/a0/18.svg` | `WEB_SOURCED_LICENSE_VERIFIED` | `V1 — ACCEPTABLE` (Generic) | **Generate New**: Modern Vietnamese secondary school backpack (high-priority pilot). |
| **pen** | `lex-028` | None clean on disk | None | None | Missing | **Generate New**: Blue ballpoint pen on plain desk (high-priority pilot). |
| **book** | `lex-029` | OpenMoji book (📖) / TOEIC book | `public/grammar/foundation/a0/06.svg` | `WEB_SOURCED_LICENSE_VERIFIED` | `V1 — ACCEPTABLE` (Emoji) | **Generate New**: Clean textbook with blank cover (zero text leakage). |
| **ruler** | `lex-030` | None on disk | None | None | Missing | **Generate New**: Transparent 20cm metric ruler on desk (pilot). |
| **pencil** | `lex-031` | None on disk | None | None | Missing | **Generate New**: Yellow wooden graphite pencil with pink eraser (pilot). |
| **happy** | `lex-041` | Smiling adult photo | `public/grammar/topics/personal-pronouns/ex_you_happy.jpg` | `PROJECT_AI_GENERATED` | `V3 — INVALID` (Adult) | **Generate New**: Cheerful 11yo student with genuine natural smile (pilot). |
| **tired** | `lex-042` | None on disk | None | None | Missing | **Generate New**: Fatigued 11yo student resting head on arms at desk (pilot). |
| **cold** | `lex-045` | Idiom (`cold feet`) | `tmp/grok-phrase-images/have_cold_feet.jpg` | `PROJECT_AI_GENERATED` | `V3 — INVALID` (Idiom) | **Generate New**: Student shivering in winter jacket (pilot contrast pair). |
| **hot** | `lex-046` | None on disk | None | None | Missing | **Generate New**: Student sweating under sun with handheld fan (pilot contrast pair). |
| **big** | `lex-065` | None on disk | None | None | Missing | **Generate New**: Visual contrast pair: Big schoolbag vs Small pencil pouch (pilot). |
| **dog** | `lex-066` | OpenMoji dog (🐕) | `public/grammar/foundation/a0/19.svg` | `WEB_SOURCED_LICENSE_VERIFIED` | `V1 — ACCEPTABLE` | **Generate New**: Friendly pet puppy in consistent illustration style. |
| **cat** | `lex-067` | OpenMoji cat (🐈) | `public/grammar/foundation/a0/20.svg` | `WEB_SOURCED_LICENSE_VERIFIED` | `V1 — ACCEPTABLE` | **Generate New**: Cute domestic cat sleeping or sitting alert. |
| **bread** | `lex-084` | Photorealistic loaf | `tmp/flow/500_output/157_bread.png` | `PROJECT_AI_GENERATED` | `V2 — AMBIGUOUS` | **Generate New**: Sliced loaf or Vietnamese *bánh mì* on plate. |
| **water** | `lex-086` | Photorealistic glass | `tmp/flow/500_output/193_water.png` | `PROJECT_AI_GENERATED` | `V1 — ACCEPTABLE` (Heavy) | **Generate New**: Clear glass of drinking water, minimal background (pilot). |
| **eat** | `lex-087` | Adult dinner photo | `tmp/flow/500_output/001_family.png` | `PROJECT_AI_GENERATED` | `V2 — AMBIGUOUS` | **Generate New**: Unambiguous action of student eating food with spoon/fork (pilot). |
| **drink** | `lex-088` | None isolated | None | None | Missing | **Generate New**: Student drinking water from a clear glass (pilot). |
| **in / on / under** | `lex-089-91` | None isolated | None | None | Missing | **Generate New**: Tri-contrast spatial scene (pilot). |

---

## 6. Audit Conclusions & Next Steps

1. **Clean Foundation Visual Set Required**:
   - Rather than attempting to patch inconsistent emojis, oversized 35mm photos, and corporate B2 illustrations, the curriculum requires a **dedicated, unified visual asset layer**.
2. **Scope of Pilot Generation**:
   - Initial generation will NOT attempt 150+ items at once.
   - Initial generation is strictly bounded to the **18 Pilot Foundation Items & Contrast Pairs** (Lessons 1–3 + core school/action concrete items).
3. **Artifact Production Plan**:
   - Complete `VISUAL_ASSET_AUDIT.csv` containing granular data rows.
   - Establish `IMAGE_STYLE_GUIDE.md` for consistent art direction.
   - Formulate `DIAGNOSTIC_VISUAL_BANK_SPEC.md` mapping the 100 lemmas to diagnostic modes.
   - Author `IMAGE_GENERATION_PROMPTS.md` containing the 16-field structured prompts for the 18 pilot items.
   - Author `IMAGE_ASSET_MANIFEST.csv` to track lifecycle from draft prompt to final approved WebP.
