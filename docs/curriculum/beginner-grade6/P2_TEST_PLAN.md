# P2 Test Plan & Pedagogical Verification Suite

> **Project**: English From Zero – Foundation Curriculum (Grade 6 Vietnam, 11–12yo False Beginners, Pre-A1)  
> **Phase**: P2 — Safe Implementation  
> **Test Harness**: `tests/foundation-curriculum/gap-model.test.ts`  
> **Execution Runner**: `npx tsx tests/foundation-curriculum/gap-model.test.ts`  
> **Verification Status**: 10/10 Tests Passed (100% Success Rate)

---

## 1. Testing Philosophy & Verification Strategy

The Foundation Curriculum deals with delicate cognitive and psychological dynamics in young adolescents (11–12yo false beginners who fear English). A buggy diagnostic engine that gives false negatives, marks lucky guesses as solid mastery, or penalizes learners for bad clipart causes active psychological harm.

Therefore, the P2 test suite adheres to:
1. **Zero Black-Box Assertions**: Every test verifies exact inspectable dimensional states (`SOUND_RECOGNITION`, `TEXT_RECOGNITION`, `MEANING_RECALL`, `FORM_RECALL`, `CHUNK_USE`, `RETENTION`).
2. **Deterministic State Derivation**: State transitions are verified as pure mathematical functions of immutable evidence event sequences.
3. **Instrument Integrity Testing**: Rigorous testing of the visual asset firewall ensuring no learner is ever penalized for ambiguous artwork.
4. **Adolescent Boundary Testing**: Testing reaction latency thresholds ($8,000\text{ms}$ and $15,000\text{ms}$) and ego-depletion stop rules ($\le 3$ failures).

---

## 2. Matrix of Verified Test Scenarios

| Scenario ID | Test Name | Input Evidence Stream | Expected State / Classification | Pedagogical Invariant Tested | Result |
|---|---|---|---|---|---|
| **TC-01** | `Sound-form gap` | `TEXT_RECOGNITION: PASS`, `SOUND_RECOGNITION: FAIL` | `SOUND_FORM_GAP`, `status: PARTIAL` | Detects auditory lexical gap caused by Vietnamese coda consonant interference. | **PASS** |
| **TC-02** | `Meaning recall gap` | Sound/Text Pass; `distractor: pencil` (category foil) for `pen` | `MEANING_RECALL_GAP`, `status: PARTIAL` | Pinpoints fuzzy semantic boundaries between coordinate concepts. | **PASS** |
| **TC-03** | `Chunk usage gap` | Isolated Form Recall Pass; Frame Cloze Fail (`This is my [X]`) | `CHUNK_USAGE_GAP`, `status: PARTIAL` | Separates isolated word familiarity from syntactic slot-assembly ability. | **PASS** |
| **TC-04** | `V2 image invalidation` | Visual card clarity rating `V2`; learner taps ambiguous card | `POSSIBLE_VISUAL_ITEM_ERROR`, `status: RECHECK` | Protects learner from instrument error; prior mastery is NEVER destroyed. | **PASS** |
| **TC-05** | `Support level gate` | Pass achieved under `MODELLED` or `PROMPTED` support | `passes: 0`, `status != SOLID` | Scaffolding credit recorded, but cannot grant autonomous independent mastery. | **PASS** |
| **TC-06** | `Reaction latency` | Pass with $8,500\text{ms}$ latency; Fail with $16,500\text{ms}$ latency | Slow pass: not `SOLID`; Extreme fail: `POSSIBLE_TASK_CONFUSION` | Filters out lucky hesitation guesses and detects cognitive freeze/friction. | **PASS** |
| **TC-07** | `Spaced retrieval decay` | Receptive pass at $T_0$; Delayed probe fail at $T_{+8\text{d}}$ | `RETENTION_GAP`, `retention_stable: FALSE` | Distinguishes transient short-term familiarity from durable consolidation. | **PASS** |
| **TC-08** | `Generative Power priority`| Unprobed pool containing `eat` ($GP: 90$) and `ruler` ($GP: 65$) | Selected: `eat` (`MODE_A_SOUND_IMAGE`) | Maximizes diagnostic leverage by prioritizing high-utility communicative lemmata. | **PASS** |
| **TC-09** | `Anxiety stop rule` | 3 consecutive failures across recent probes | `selectNextDiagnosticProbe() === null` | Halts testing immediately upon 3 consecutive failures to safeguard learner ego. | **PASS** |
| **TC-10** | `Teacher recommendations` | State map with `SOLID` `bag` and `SOUND_FORM_GAP` `book` | `bag: IGNORE (DO NOT RE-TEACH)`, `book: REVIEW (coda phonetics)` | Prescribes actionable, evidence-backed advice; prevents wasted class time. | **PASS** |

---

## 3. Execution Logs & Reproduction Commands

To independently execute and verify the suite:
```powershell
npx tsx tests/foundation-curriculum/gap-model.test.ts
```

### Official Execution Output:
```text
--- STARTING FOUNDATION CURRICULUM GAP MODEL SUITE ---
  ✓ PASS: Scenario 1: Sound-form gap (recognizes text, fails spoken audio)
  ✓ PASS: Scenario 2: Meaning recall gap (confuses category foil e.g. pen vs pencil)
  ✓ PASS: Scenario 3: Chunk usage gap (recalls isolated form, fails in syntactic frame)
  ✓ PASS: Scenario 4: V2 image invalidation (rejects from diagnostic and does not penalize learner)
  ✓ PASS: Scenario 5: Modelled / Prompted support level prevents SOLID status
  ✓ PASS: Scenario 6: High latency (> 8s) prevents SOLID; > 15s flags POSSIBLE_TASK_CONFUSION
  ✓ PASS: Scenario 7: Spaced retrieval decay (passed initially, failed at T+7d)
  ✓ PASS: Scenario 8: Generative Power (GP) priority selects eat (GP:90) before ruler (GP:65)
  ✓ PASS: Scenario 9: Adolescent anxiety stop rule halts sampling on 3 consecutive failures
  ✓ PASS: Scenario 10: Teacher recommendations give prescriptive advice and DO NOT RE-TEACH solid items

--- ALL 10/10 FOUNDATION CURRICULUM GAP MODEL TESTS PASSED ---
```
