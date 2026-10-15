# 33. Image Asset Manifest & Version Governance Specification

> **Curriculum Project**: English From Zero – Foundation Curriculum (Grade 6 Vietnam, 11–12yo False Beginners, Pre-A1)  
> **Status**: Approved Infrastructure Specification  
> **Governance Model**: Strict Non-Destructive Versioning & Provenance Auditing  

---

## 1. Lifecycle & Governance Architecture

Every visual asset in the curriculum must be accountable to a verifiable audit trail. Random generation without metadata leads to "ghost assets" where nobody knows who generated an image, what prompt was used, whether it was approved for diagnostics, or whether it leaks text.

### The 5-Stage Asset Lifecycle:
```
  [ STAGE 1: SPECIFICATION ]
  Prompt drafted in 32_IMAGE_GENERATION_PROMPTS.md
              │
              ▼
  [ STAGE 2: GENERATION ]
  Engine run (Flux-1-schnell / SDXL) -> PNG Master in Staging
              │
              ▼
  [ STAGE 3: PEDAGOGICAL AUDIT ]
  Multi-Reviewer Check:
  * Semantic Clarity (V0–V3)
  * Age Dignity (11–12yo)
  * Text Leakage (OCR Pass)
              │
      ┌───────┴───────┐
      ▼               ▼
  [ REJECTED ]    [ APPROVED ]
  Log Reason &    Stage 4: Optimization
  Increment Ver   WebP conversion (<75KB)
  (v1 -> v2)          │
                      ▼
                  Stage 5: Production Deployment
                  Marked PROJECT_AI_GENERATED
```

---

## 2. Image Asset Manifest Schema

The manifest is maintained as a canonical machine-readable registry. Every record adheres to the following 11-field schema:

| Column Name | Type | Allowed Values / Format | Description |
|---|---|---|---|
| **`asset_id`** | String (Unique) | `IMG-G6-[001-999]-[v1-v9]` | Unique identifier of the physical binary asset. |
| **`concept_id`** | String | `CON-G6-[001-130]` | Canonical ID of the underlying lexical concept. |
| **`prompt_id`** | String | `PROMPT-G6-[001-999]` | Reference to prompt dossier in Doc 32. |
| **`prompt_version`** | String | `v1.0`, `v1.1`, `v2.0` | Strict semantic version of the generation prompt. |
| **`generator`** | String | `Flux-1-schnell`, `SDXL-Turbo`, `DALL-E-3` | AI model engine and inference checkpoint. |
| **`generation_date`** | Date (ISO) | `YYYY-MM-DD` | Date of generation run. |
| **`review_status`** | Enum | `DRAFT`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `QUARANTINED` | Current status in quality pipeline. |
| **`semantic_clarity`** | Enum | `V0`, `V1`, `V2`, `V3` | Visual Semantic Rating score. |
| **`approved_diagnostic`**| Boolean | `TRUE`, `FALSE` | Only `V0` assets may be `TRUE`. |
| **`approved_teaching`**  | Boolean | `TRUE`, `FALSE` | `V0` and `V1` assets may be `TRUE`. |
| **`notes`** | Text | Free text | Specific reviewer commentary or rejection rationale. |

---

## 3. Strict Non-Destructive Versioning Policy

If an image is rejected during pedagogical audit, **it is strictly forbidden to silently overwrite the asset file or erase the prompt history**.

### Versioning Protocol:
1. When `IMG-RUN-001-v1` is generated, it is reviewed.
2. If the reviewer observes that the student in the illustration has both feet planted high in the air without forward torso lean, looking like a high jump rather than a sprint:
   - Status updated: `REJECTED`.
   - Clarity score: `V2`.
   - Notes: `"Action ambiguity: posture resembles jumping over an obstacle rather than sprinting on a track."`
   - `IMG-RUN-001-v1.webp` is moved to `archive/rejected/`.
3. The prompt is modified with explicit negative constraints (`no jumping, low flight phase, 25-degree forward lean`).
4. Prompt version incremented to `v2.0`.
5. Re-run generates `IMG-RUN-001-v2`.
6. Upon passing audit:
   - Status updated: `APPROVED`.
   - Clarity score: `V0`.
   - `approved_diagnostic: TRUE`.

---

## 4. Initial Manifest Ledger (Pilot Set 1)

```csv
asset_id,concept_id,prompt_id,prompt_version,generator,generation_date,review_status,semantic_clarity,approved_diagnostic,approved_teaching,notes
IMG-G6-001-v1,CON-G6-027,PROMPT-G6-001,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Crisp navy secondary backpack; zero text; 70% focal area.
IMG-G6-002-v1,CON-G6-028,PROMPT-G6-002,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Blue ballpoint pen with translucent ink barrel; distinct from pencil.
IMG-G6-003-v1,CON-G6-029,PROMPT-G6-003,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Textbook with clean blank sage-green cover; zero text leakage.
IMG-G6-004-v1,CON-G6-030,PROMPT-G6-004,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Clear 20cm metric ruler with non-linguistic tick dashes; no numbers.
IMG-G6-005-v1,CON-G6-031,PROMPT-G6-005,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Yellow wooden pencil with graphite tip and pink eraser; sharp focus.
IMG-G6-006-v1,CON-G6-016,PROMPT-G6-006,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Freestyle swimming stroke; clear lane water; goggles on.
IMG-G6-007-v1,CON-G6-017,PROMPT-G6-007,v1.0,Flux-1-schnell,2026-10-09,REJECTED,V2,FALSE,FALSE,Looked like jumping; needs acute forward torso lean.
IMG-G6-007-v2,CON-G6-017,PROMPT-G6-007,v2.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Dynamic forward sprint on track; distinct flight phase.
IMG-G6-008-v1,CON-G6-018,PROMPT-G6-008,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Hand actively sketching cat outline; distinct from writing letters.
IMG-G6-009-v1,CON-G6-019,PROMPT-G6-009,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Student stirring pot on kitchen stove; no eating utensils.
IMG-G6-010-v1,CON-G6-086,PROMPT-G6-010,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Pure drinking water in transparent glass; zero coloring or ice.
IMG-G6-011-v1,CON-G6-087,PROMPT-G6-011,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Student eating food with fork to mouth; zero cups/drinks in frame.
IMG-G6-012-v1,CON-G6-088,PROMPT-G6-012,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Student drinking water from glass; zero solid food in frame.
IMG-G6-013-v1,CON-G6-041,PROMPT-G6-013,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Warm natural smile; 11yo adolescent proportions; dignified.
IMG-G6-014-v1,CON-G6-042,PROMPT-G6-014,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Tired student resting head on desk; zero ZZZ text symbols.
IMG-G6-015-v1,CON-G6-046,PROMPT-G6-015,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Hot summer day; wiping forehead sweat with paper fan.
IMG-G6-016-v1,CON-G6-045,PROMPT-G6-016,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Cold winter day; heavy jacket and scarf shivering; frosty breath.
IMG-G6-017-v1,CON-G6-065,PROMPT-G6-017,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Side-by-side big backpack vs tiny pencil pouch; same ground plane.
IMG-G6-018A-v1,CON-G6-090,PROMPT-G6-018,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Spatial prepositions: red ball IN open desk drawer.
IMG-G6-018B-v1,CON-G6-089,PROMPT-G6-018,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Spatial prepositions: red ball ON desk top surface.
IMG-G6-018C-v1,CON-G6-091,PROMPT-G6-018,v1.0,Flux-1-schnell,2026-10-09,APPROVED,V0,TRUE,TRUE,Spatial prepositions: red ball UNDER desk on floor.
```

---

## 5. Storage Hierarchy & Production Delivery

When assets are generated and approved:
```
public/curriculum/beginner-grade6/
├── images/
│   ├── bag_v0.webp                  (Diagnostic Master: 800x800, <65KB)
│   ├── pen_v0.webp                  (Diagnostic Master: 800x800, <65KB)
│   ├── book_v0.webp                 (Diagnostic Master: 800x800, <65KB)
│   ├── ruler_v0.webp                (Diagnostic Master: 800x800, <65KB)
│   ├── pencil_v0.webp               (Diagnostic Master: 800x800, <65KB)
│   └── thumbs/                      (Mobile Thumbnails: 400x400, <30KB)
└── master_archive/                  (Lossless PNG Master 1024x1024)
```
All paths are mirrored in [`IMAGE_ASSET_MANIFEST.csv`](file:///d:/Vibe/Vocab/web-app/docs/curriculum/beginner-grade6/visuals/IMAGE_ASSET_MANIFEST.csv).
