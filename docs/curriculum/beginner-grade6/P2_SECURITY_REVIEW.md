# P2 Security & Authorization Architecture Review

> **Project**: English From Zero – Foundation Curriculum (Grade 6 Vietnam, 11–12yo False Beginners, Pre-A1)  
> **Phase**: P2 — Safe Implementation  
> **Target Subsystems**: Diagnostic Evidence Ingestion, Learner State Storage, Teacher Cockpit API  
> **Classification**: Internal Architecture & Threat Mitigation Review

---

## 1. Threat Modeling & Scope

The Foundation Curriculum introduces granular student performance data, micro-diagnostic trial logs, and teacher observation records. Due to Vietnamese educational privacy norms and teenage psychological sensitivities (11–12yo false beginners), student failure data and diagnostic profiles must be strictly protected against unauthorized access, cross-tenant leaks, and tampering.

### Threat Scenarios Identified:
1. **Cross-Student Data Leakage**: A student in Classroom A querying or observing the vocabulary gap map or error logs of another student in Classroom A or Classroom B.
2. **Unauthorized Teacher Access**: A teacher viewing diagnostic maps of students who are not actively enrolled in their assigned classroom(s).
3. **Telemetry Tampering / Fraud**: A student falsifying evidence event logs (e.g. forging `is_correct: true`, `support_level: 'INDEPENDENT'`, or spoofing response latencies) to artificially inflate mastery.
4. **Instrument / Asset Poisoning**: Unauthorized modification of visual asset manifests or clarity ratings (`V0` vs `V3`), compromising diagnostic reliability.
5. **Denial of Service / Event Flooding**: Flooding the evidence submission API with thousands of rapid micro-events to overload database storage.

---

## 2. Security Controls & Mitigation Architecture

```mermaid
flowchart TD
    Client["Client (Browser / Native)"] -->|Cookie / Auth Session| BFF["Next.js Route Handler (/api/foundation/...)"]
    
    subgraph AuthLayer["1. Authentication & Session Verification"]
        BFF --> A1["getAuthUser(req)"]
        A1 -->|No valid session| R401["401 Unauthorized"]
        A1 -->|Valid user_id| A2["Verify Role & Classroom Enrollment"]
    end

    subgraph AuthzLayer["2. Authorization & Tenant Isolation"]
        A2 -->|Student requesting self| AllowStudent["Allow Access (Own Learner ID)"]
        A2 -->|Student requesting other| R403["403 Forbidden"]
        A2 -->|Teacher requesting student| VerifyTeacher["Check enrollments + classrooms table"]
        VerifyTeacher -->|Teacher owns classroom| AllowTeacher["Allow Read-Only Map Access"]
        VerifyTeacher -->|Teacher does not own classroom| R403
    end

    subgraph ValidationLayer["3. Input Validation & Schema Guardrails"]
        AllowStudent --> V1["Strict Runtime Validation (Zod / TS Schema)"]
        AllowTeacher --> V1
        V1 -->|Invalid Enums / Negative Latency / Tampered Fields| R400["400 Bad Request"]
    end

    subgraph DBStore["4. Database Isolation (PostgreSQL / Supabase)"]
        V1 -->|Append-Only Evidence| EvidenceTable["learner_lexical_evidence (Immutable)"]
        V1 -->|Materialized State| StateTable["learner_lexical_state"]
        EvidenceTable -.->|RLS: user_id = auth.uid()| RLSCheck["Postgres RLS Policies"]
    end
```

---

## 3. Detailed Security Invariants

### 3.1 Strict Tenant & Classroom Isolation
- **Student Scoping**: Students are strictly scoped to `learner_id == auth.uid()`. Under no circumstances can a student specify an arbitrary `learner_id` in GET or POST parameters.
- **Teacher Verification Algorithm**: When a teacher requests a student's vocabulary map:
  ```typescript
  // Canonical Teacher Authorization Check
  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .select('classroom_id, classrooms!inner(teacher_id)')
    .eq('student_id', targetLearnerId)
    .eq('classrooms.teacher_id', authenticatedUserId)
    .maybeSingle();

  if (!enrollment || error) {
    throw new SecurityForbiddenError("Teacher does not own an active classroom containing this learner.");
  }
  ```

### 3.2 Append-Only Evidence Ledger (Anti-Tampering)
- The table `learner_lexical_evidence` is strictly **APPEND-ONLY**.
- Neither students nor teachers are granted SQL `UPDATE` or `DELETE` permissions on `learner_lexical_evidence`.
- The derived state (`learner_lexical_state`) is computed deterministically by the pure domain function `deriveVocabularyState` from the immutable sequence of evidence events. A student cannot directly write or patch their own dimensional scores.

### 3.3 Defense Against Latency & Support Tampering
- Input validation sanitizes all incoming evidence payloads:
  - `response_latency_ms`: Bound between $100\text{ms}$ and $120,000\text{ms}$. Values $< 100\text{ms}$ indicate programmatic botting or anomalous double-taps and are quarantined.
  - `support_level`: Strictly validated against the enum `['INDEPENDENT', 'MODELLED', 'PROMPTED', 'NOT_YET']`.
  - `probe_mode`: Strictly validated against `['MODE_A_SOUND_IMAGE', 'MODE_B_TEXT_IMAGE', 'MODE_C_FORM_RECALL', 'MODE_D_CHUNK_CLOZE', 'MODE_E_TEACHER_OBSERVATION']`.

### 3.4 Rate Limiting & Anti-Flooding
- All diagnostic evidence submission endpoints are throttled using the application's distributed rate limiting subsystem (`distributed-rate-limit.ts`).
- Maximum of 30 evidence submissions per minute per active user session, which comfortably accommodates rapid flashcard interactions while preventing denial-of-service spamming.

---

## 4. Supabase Row Level Security (RLS) Policy Specifications

| Table | Operation | Policy Enforcement | Rationale |
|---|---|---|---|
| `foundation_lexical_concepts` | SELECT | `auth.role() = 'authenticated'` | Public curricular read access for all logged-in learners and instructors. |
| `foundation_lexical_concepts` | INSERT/UPDATE/DELETE | `FALSE` (service_role only) | Curricular items can only be managed by canonical database migrations or curriculum admins. |
| `foundation_representations` | SELECT | `auth.role() = 'authenticated'` | Read-only access to validated representations and asset paths. |
| `foundation_representations` | INSERT/UPDATE/DELETE | `FALSE` (service_role only) | Assets and clarity ratings cannot be tampered with by clients. |
| `learner_lexical_evidence` | SELECT | `auth.uid() = learner_id OR EXISTS (teacher check)` | Learner reads own evidence; authorized teacher reads enrolled students. |
| `learner_lexical_evidence` | INSERT | `auth.uid() = learner_id` | Learner can only insert events stamped with their own UID. |
| `learner_lexical_evidence` | UPDATE/DELETE | `FALSE` | Immutable event ledger. |
| `learner_lexical_state` | SELECT | `auth.uid() = learner_id OR EXISTS (teacher check)` | Multi-dimensional state view restricted to student and assigned teacher. |
| `learner_lexical_state` | INSERT/UPDATE | `auth.uid() = learner_id` (or Server BFF) | State updates synchronized through BFF execution of pure domain state derivation. |

---

## 5. Security Verdict & Sign-Off

The P2 security architecture completely isolates student diagnostic profiles, prevents cross-classroom leakage, enforces immutable evidence integrity, and ensures that teachers can only inspect learners enrolled in their respective classes.
