# J.A.R.V.I.S. Stable Baseline

**Baseline status:** STABLE / TEST-VERIFIED

This checkpoint is the reference point for future J.A.R.V.I.S. development.

## Working capabilities protected by this baseline

- Core command routing and conversational context handoff.
- Search Hub result selection and ordinal follow-ups.
- Maps search, restaurant result context, nearest-result follow-ups, and `take me there` entity handoff.
- YouTube/media context and follow-up selection.
- Public-domain ebook/Gutenberg search, including command-driven searches, first-run reconciliation, Enter-key search, and `READ IN JARVIS`.
- Ebook reader/re-entry behavior.
- Voice response/handoff behavior and mobile/iOS stability fixes.
- Current polished HUD/mobile UI, including the rotating arc-reactor control.
- Existing CI/CD and TEST/production deployment flow.

## Regression contract

Future work must follow these rules:

1. **One capability at a time.** A phase must have a single clearly defined objective.
2. **No opportunistic cleanup.** Do not refactor, rename, reorder, or modernize unrelated working code during a feature push.
3. **Preserve the baseline.** New code must be additive or narrowly scoped. Existing authorities, context stores, routing, reader, maps, media, and voice paths are protected unless the phase explicitly targets one of them.
4. **TEST before promotion.** Every meaningful change gets an isolated TEST deployment and user verification before production promotion.
5. **Failure means surgical rollback.** If a test fails, revert only the exact phase/change that caused the regression. Do not roll back unrelated working fixes.
6. **Trace before guessing.** For context/routing bugs, inspect the actual intent, entity, reference, and handoff payload before changing grammar or routing rules.
7. **Keep authority boundaries explicit.** A new feature must not silently become the authority for an existing domain merely because it sees the same command.
8. **No cross-domain contamination.** Maps changes must not alter ebook/media behavior; ebook changes must not alter maps/search/voice behavior; UI-only changes must not alter command semantics.
9. **Cache/version changes are intentional.** When a client-side script changes, update its cache-busting version deliberately so TEST results correspond to the pushed code.
10. **User verification is the acceptance gate.** A phase is considered complete only after the real deployed app passes the intended test flow.

## Next development phase

### Chain of Command / Authority Architecture

The next phase should improve how J.A.R.V.I.S. decides **which capability owns a command**, how that authority is preserved across follow-ups, and how new capabilities can be added without stealing context from existing domains.

The design goal is an explicit command-authority chain rather than an expanding collection of overlapping keyword patches.

Future phases should build on this baseline and leave this document unchanged unless the baseline itself is intentionally re-established after a verified milestone.

## Baseline principle

> **Add intelligence without disturbing memory. Add capability without stealing authority.**

This file is a development guardrail, not application runtime code.
