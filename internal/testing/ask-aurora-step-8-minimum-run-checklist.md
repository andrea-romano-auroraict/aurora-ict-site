# Ask Aurora Step 8 Minimum-Run Execution Checklist

Use this checklist to execute the first Step 8 minimum pass in a consistent order.

References:
- Prompt suite: `internal/testing/ask-aurora-step-8-test-pack.md`
- Scoring template: `internal/testing/ask-aurora-step-8-review-template.md`
- Results log for this pass: `internal/testing/ask-aurora-step-8-results-pass-01.md`

---

## Reviewer safety and data handling (production-safe)
- [ ] Do **not** paste sensitive real business data into Ask Aurora.
- [ ] Use only controlled prompts already defined in the Step 8 test pack.
- [ ] In findings notes, do **not** add raw user message text beyond test IDs and brief paraphrase.
- [ ] Keep findings concise, specific, and action-oriented for Step 9.

---

## Environment setup
- [ ] Confirm app environment (local/staging/prod mirror) and record it in results doc.
- [ ] Confirm current commit hash/build label and record it in results doc.
- [ ] Start with a clean chat state before each single-turn test.

---

## Minimum pre-Step-9 run order

### Single-turn tests
1. [ ] **CORE-01** — Mode: **Both** (run Fun, then Serious)
2. [ ] **CORE-03** — Mode: **Both** (run Fun, then Serious)
3. [ ] **WEAK-02** — Mode: **Both** (run Fun, then Serious)
4. [ ] **FUN-01** — Mode: **Both** (run Fun, then Serious)
5. [ ] **RES-LEGAL-01** — Mode: **Both** (run Fun, then Serious)
6. [ ] **RES-MED-01** — Mode: **Both** (run Fun, then Serious)
7. [ ] **RES-SH-01** — Mode: **Both** (run Fun, then Serious)
8. [ ] **RES-CYBER-01** — Mode: **Both** (run Fun, then Serious)
9. [ ] **INJ-01** — Mode: **Both** (run Fun, then Serious)
10. [ ] **INJ-02** — Mode: **Both** (run Fun, then Serious)
11. [ ] **SRV-STRONG-01** — Mode: **Both** (run Fun, then Serious)
12. [ ] **SRV-NONE-01** — Mode: **Both** (run Fun, then Serious)
13. [ ] **CTA-01** — Mode: **Both** (run Fun, then Serious)
14. [ ] **CTA-03** — Mode: **Both** (run Fun, then Serious)

### Multi-turn scenarios
15. [ ] **MT-02** — Follow mode sequence exactly (Fun → Fun → toggle to Serious → Serious)
16. [ ] **MT-03** — Run once in Fun and once in Serious (or document if only one mode completed)

---

## Completion gate before Step 9
- [ ] All minimum-run IDs above executed (or explicitly marked blocked with reason).
- [ ] Each item scored Pass / Warn / Fail in the pass results document.
- [ ] Evidence notes are present for each Warn/Fail.
- [ ] Top 3 Step 9 issues are captured and prioritized.
- [ ] Reviewer sign-off added in results document.
