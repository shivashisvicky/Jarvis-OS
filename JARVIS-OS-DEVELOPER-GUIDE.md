# JARVIS OS Developer & Recovery Guide

> Living engineering documentation for `shivashisvicky/Jarvis-OS`.
>
> Purpose: preserve what we learned about the repository, runtime architecture, TEST/PROD separation, commit/deploy discipline, debugging, and rollback/recovery. This is an engineering playbook, not a generic Git tutorial.

## 1. Golden rules

1. **TEST first.** New behaviour is developed on `test/jarvis-intelligence-next`.
2. **PROD is not the playground.** Do not edit or push `main` for a TEST fix.
3. **One behavioural change at a time.** Prefer one or a very small number of files.
4. **Trace before patching.** When a feature crosses several authorities, find the owner of the transition before adding another handler.
5. **Green CI is necessary, not sufficient.** Build/deploy verification proves the site can be built and served. It does not prove a voice command behaves correctly.
6. **Preserve known-good commits.** Never throw away a working checkpoint merely because a later experiment failed.
7. **Never casually rewrite a subsystem.** Surgical fixes preserve the accumulated behaviour of Maps, YouTube, Books, voice, routing, and context.
8. **After every push:** wait for Actions, inspect failures, then test the deployed TEST URL. Do not stack speculative fixes while CI is still running.
9. **Cache-bust changed runtime scripts.** Browsers can otherwise execute an older script even when the repository contains the new code.
10. **Rollback by creating a new corrective commit whenever possible.** Do not casually force-reset a shared branch.

---

## 2. Branches and what they mean

```text
GitHub repository
└── shivashisvicky/Jarvis-OS
    ├── main
    │   └── PROD source / production build
    │
    └── test/jarvis-intelligence-next
        └── TEST source / experimental and validation build
```

### Current important checkpoints

| Checkpoint | Meaning |
|---|---|
| `6010a558da5cb14894a46880ed7c2c6c35e2699f` | Protected stable rollback anchor |
| `ede622c6e7f35dbd67f2007806122116d724dcb5` | Frozen Ebook stable checkpoint |
| `a6885092d29f9bb077d87ef090ff03ea9a489548` | Mature runtime checkpoint; useful forensic reference |
| `3b4105975409882c914c44dd94ae529462ed944d` | TEST fix exposing `EntityAuthority.handle()` to Chain |
| `5efc74a42701304da7e14ce2d02c4b2efb7b9346` | TEST Ebook CORS fallback/retry transport fix |
| `50de21ae0e0912137d3263ca4822588fa5cb6eae` | TEST cache-buster refresh for Entity/Ebook |
| `00709514bbf845903ef3b3442cdcbc7867c2ee6c` | TEST chained YouTube narration fix |
| `f75253800784cfbc92789d81a552d230959192ee` | TEST chained entity/ordinal hardening |
| `028073800639858112a2fe3199131df3c312dd5c` | Latest documented TEST cache-buster/index update at time of writing |

**Important:** a checkpoint is a reference point, not automatically a recommendation to reset the whole branch to it. First compare the failing behaviour with the checkpoint and preserve unrelated later fixes.

---

## 3. How TEST becomes TEST on the web

The important deployment workflow is:

`.github/workflows/deploy-dual-pages-test.yml`

Its behaviour is unusual but deliberate:

```text
                 push to TEST branch
                         │
                         ▼
        ┌─────────────────────────────────┐
        │ Deploy Jarvis OS Dual Pages     │
        │ (TEST) workflow                 │
        └─────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       checkout main          checkout TEST
       into prod-src          into test-src
              │                     │
              ▼                     ▼
         build PROD             build TEST
              │                     │
              └──────────┬──────────┘
                         ▼
                 assemble _site
                    /        \
                   /          \
              root /          /test/
                PROD             TEST
                   \             /
                    \           /
                     ▼         ▼
                 GitHub Pages deployment
```

The workflow explicitly checks out `main` as `prod-src` and `test/jarvis-intelligence-next` as `test-src`, builds both, and assembles one Pages artifact where `/` is PROD and `/test/` is TEST. The smoke job then verifies both URLs. fileciteturn433file0L2-L2

### Practical consequence

A commit pushed to TEST **does not mean PROD source has changed**.

It does mean the dual Pages deployment is rebuilt. The PROD part is rebuilt from `main`, while the TEST part is rebuilt from the TEST branch.

Therefore:

```text
Edit TEST file
   │
   ▼
Commit on test/jarvis-intelligence-next
   │
   ▼
Actions
   │
   ├── PROD build from main  ──> /       (unchanged PROD code)
   │
   └── TEST build from TEST  ──> /test/  (your new code)
```

Do **not** change `main` just because the TEST workflow builds both sides.

---

## 4. Repository structure: what matters

JARVIS is a hybrid application: a built frontend under `src/`, plus a large collection of browser-side authority/patch modules loaded by `index.html`.

Conceptually:

```text
JARVIS-OS/
│
├── index.html                         ← runtime wiring / script load order
├── package.json / pnpm files           ← build tooling/dependencies
├── src/
│   └── main.ts                         ← core application / UI / app entry
│
├── .github/workflows/
│   └── deploy-dual-pages-test.yml      ← TEST-triggered dual Pages deployment
│
├── jarvis-context-engine-v1.js         ← context state
├── jarvis-context-memory-v1.js         ← context memory
├── jarvis-context-reference-authority-v1.js
│                                          ← ordinal/follow-up reference routing
├── jarvis-command-chain-v1.js          ← sequential multi-clause commands
├── jarvis-command-authority-v2.js      ← command classification/routing
├── jarvis-entity-authority-v2.js       ← entity-first resolution/handoff
├── jarvis-command-intelligence-v1.js   ← command intelligence layer
├── jarvis-conversation-router-v1.js    ← conversational routing
├── jarvis-conversational-choice-authority-v1.js
│                                          ← conversational choices
│
├── jarvis-youtube-command-authority-v1.js
│                                          ← YouTube command handling
├── jarvis-youtube-gesture-fix.js       ← browser/iOS YouTube gesture support
│
├── jarvis-map-absolute-authority-v25.js
│                                          ← Maps/search/routing authority
├── jarvis-map-pagination-v1.js          ← map result ordinals/pagination
├── jarvis-map-enter-fix-v1.js           ← map navigation fix
├── src/main.ts                           ← map/app integration also lives here
│
├── jarvis-ebook-authority-v2.js        ← ebook source/network authority
├── jarvis-ebook-command-authority-v1.js← ebook command routing
├── jarvis-ebook-search-authority-v2.js ← ebook search/render results
├── jarvis-ebook-resolved-handoff-fix-v1.js
├── jarvis-ebook-network-race-fix-v1.js ← ebook reader transport/race handling
├── jarvis-ebook-text-transport-v2.js  ← text transport
├── jarvis-ebook-reader-v7.js           ← reader UI/opening/pagination
├── jarvis-ebook-library-v2.js          ← ebook library/browse UI
├── jarvis-ebook-stability-v1.js        ← ebook stability patches
│
├── jarvis-speech-recognition-release-v*.js
├── jarvis-voice-response-authority.js
├── jarvis-context-voice-authority-v1.js
├── jarvis-ios-voice-fix.js
├── jarvis-ios-audio-unlock-v3.js
├── jarvis-ios-speech-handoff-v1.js
│                                          ← voice lifecycle / speech stack
│
└── many focused UI/stability/feature patches
```

The exact list evolves. The critical lesson is that **`index.html` is effectively a dependency/wiring map** for these browser modules. It controls script inclusion and, importantly, load order. The current TEST index contains the context, chain, command, entity, YouTube, Ebook, Maps, voice, and core modules in a deliberate sequence. fileciteturn434file0L2-L2

---

## 5. The runtime architecture we learned

JARVIS should be thought of as authorities passing ownership of a command, rather than as one giant parser.

```text
Voice / text input
       │
       ▼
Command Authority / routing
       │
       ├──────── conversational intent ───────► Conversation authority
       │
       ├──────── entity candidate ────────────► Entity Authority
       │                                          │
       │                                          ├── Books
       │                                          ├── Maps
       │                                          └── other entities
       │
       ├──────── YouTube intent ───────────────► YouTube Authority
       │
       ├──────── Maps intent ──────────────────► Map Authority
       │
       └──────── multi-clause command ─────────► Command Chain
                                                   │
                                                   ▼
                                         clause 1 → fresh context
                                                   │
                                                   ▼
                                         clause 2 → context reference
                                                   │
                                                   ▼
                                         ordinal / "third one"
```

### The three especially important layers

#### A. Command Chain

`jarvis-command-chain-v1.js`

Purpose: execute sequential clauses and wait for fresh context between them.

Example:

```text
"show me restaurants in Jagannath Nagar and open the third one"
```

Conceptually:

```text
clause 1: show me restaurants in Jagannath Nagar
      │
      ▼
Map/Search authority produces results
      │
      ▼
context becomes fresh
      │
      ▼
clause 2: open the third one
      │
      ▼
Context Reference Authority resolves ordinal 3
```

The Chain must not blindly treat every first clause as a normal form submission. Entity-first clauses can need Entity Authority directly. The recent targeted hardening added this guard specifically to avoid a stale exact entity causing the wrong route.

#### B. Entity Authority

`jarvis-entity-authority-v2.js`

Purpose: recognize a real entity such as a book title and hand the command to the correct domain.

For example:

```text
"Beowulf"
   │
   ▼
Entity candidate?
   │
   yes
   ▼
Entity Authority
   │
   ├── clear stale context/entity state
   └── resolve Beowulf
           │
           ▼
        BOOKS
```

A critical lesson: **having an internal `handle()` function is not enough**. The Command Chain needs a public `window.jarvisEntityAuthority.handle()` export when it is going to delegate first-clause entity ownership. The missing export caused a real regression even though the function existed internally.

#### C. Context Reference Authority

`jarvis-context-reference-authority-v1.js`

Purpose: interpret references such as:

- `the first one`
- `the second one`
- `the third one`
- `open it`
- `read that`

It is heavily dependent on **fresh, correctly owned context**.

That leads to the central rule:

> **Ordinal bugs are often context bugs, not ordinal-parser bugs.**

If stale YouTube context remains alive while a Book command fails to publish fresh BOOKS context, `open the third one` can correctly parse "third" and still open the wrong thing.

---

## 6. Books → Maps → YouTube → Books: why this sequence is a stress test

A sequence such as:

```text
Books → Maps → YouTube → Books
```

is valuable because it crosses several domains and tests whether context ownership is actually being replaced rather than merely appended.

Example:

```text
1. "Beowulf"
       │
       ▼
   BOOKS context
       │
2. "show restaurants in Jagannath Nagar"
       │
       ▼
   MAPS context replaces/updates active result context
       │
3. "play Oggy on YouTube"
       │
       ▼
   YOUTUBE context
       │
4. "Beowulf"
       │
       ▼
   BOOKS must become fresh again
       │
5. "open the third one"
       │
       ▼
   Context Reference Authority must see BOOKS, not stale YOUTUBE
```

This is why a seemingly tiny routing change can break an unrelated ordinal. The shared state is the bridge.

---

## 7. YouTube chained-command rule

Standalone:

```text
"play Oggy on YouTube"
```

The natural status is:

```text
Playing the first YouTube result...
```

But in a chain:

```text
"play Oggy on YouTube and play the third one"
```

the first clause is effectively a **search/setup step**. The Chain internally transforms/delegates it so that the second clause can consume the fresh result context.

Therefore the expected wording is:

```text
Searching YouTube for Oggy...
        ↓
open/play result #3
```

A recent TEST fix distinguishes the internal chained submission from a genuine standalone play command. The selection itself was already correct; the bug was the narration saying "playing the first" before the third was selected.

---

## 8. Ebook architecture and the major lessons

The Ebook stack is not one file.

```text
User: "Beowulf"
       │
       ▼
Entity Authority
       │
       ▼
Ebook Search Authority
       │
       ├── resolved results if available
       └── remote search fallback
       │
       ▼
Ebook result list
       │
       ▼
"open the third one"
       │
       ▼
Context Reference Authority
       │
       ▼
selected BookRecord
       │
       ▼
Ebook Authority / source resolution
       │
       ▼
Reader transport
       │
       ▼
Reader UI / pagination
```

### Resolved-first search is important

The stable direction is:

```text
resolved BookRecords
      │
      ├── if usable → render immediately
      │
      └── otherwise → remote search
```

This avoids unnecessary network delay and prevents a second remote search from replacing an already-correct entity resolution.

### Reader transport is separate from search

A list can be correct while Reader opening fails.

We observed failures such as:

```text
Beowulf result list: correct
        ↓
Reader: "Fetch is aborted"
```

That is a transport/source problem, not evidence that Entity Authority or Search Authority is broken.

The TEST transport fix added a CORS-capable fallback and retry path while retaining Gutenberg direct/Jina paths.

### Do not create multiple Reader owners

A previous regression showed how dangerous duplicate ownership can be:

```text
Context Reference Authority
        │
        ├──────── normal follow-up path ──────► Reader open
        │
        └──────── event listener/polling ─────► Reader open
```

If both fire, race conditions become possible. The regression ledger records this as a major forensic lesson: find the first owner and remove duplicate execution rather than adding another patch. fileciteturn432file0L2-L2

---

## 9. How to make a change safely in TEST

### Step 1: verify the branch

The intended development branch is:

```text
test/jarvis-intelligence-next
```

Never assume the current branch. Check it.

With local Git:

```bash
git branch --show-current
git status
```

Expected branch:

```text
test/jarvis-intelligence-next
```

### Step 2: identify the owner

Ask:

> Which authority actually owns the failing transition?

Examples:

| Symptom | First files to inspect |
|---|---|
| `open the third one` opens stale result | context engine, context reference authority, command chain |
| `Beowulf` does not enter Books | Entity Authority, Command Chain, Command Authority |
| YouTube third selection is correct but wording says first | YouTube Command Authority + Chain internal-submit flag |
| Book list is correct but Reader aborts | Ebook network/source transport, Reader |
| Map appears then disappears | Map authority, map loading/navigation patches, core recovery |
| Voice gets stuck/orange | speech lifecycle / voice recovery stack |
| App starts frozen | startup boot / module loader / mobile guard |

### Step 3: inspect the known-good reference

Compare the failing file against:

- the immediate parent commit
- the last known-good TEST commit
- the mature `a688509...` runtime checkpoint when relevant
- the protected `6010a...` rollback anchor when broader recovery is required

Do not jump directly to a full rollback.

### Step 4: make one narrow change

Good:

```text
Add one missing public export.
```

Risky:

```text
Rewrite Entity Authority + Chain + Context Engine + Router.
```

### Step 5: cache-bust if a browser script changed

If a file is loaded directly from `index.html`, update its version query string, for example:

```html
<script src="./jarvis-command-chain-v1.js?v=20260908-command-chain-v2-2-2"></script>
```

This is especially important for browser-cached JS.

### Step 6: commit with a diagnostic message

Good commit:

```text
fix(TEST): expose entity handle to command chain
```

Good pattern:

```text
fix(TEST): <one specific behavioural fix>
```

or:

```text
chore(TEST): refresh chain cache-busters
```

Avoid vague messages such as:

```text
fix stuff
update
try again
```

### Step 7: push TEST only

With local Git:

```bash
git add <specific-files>
git commit -m "fix(TEST): <description>"
git push origin test/jarvis-intelligence-next
```

The critical line is:

```bash
git push origin test/jarvis-intelligence-next
```

Do **not** use:

```bash
git push origin main
```

for TEST work.

### Step 8: wait for Actions

The TEST workflow has concurrency enabled with `cancel-in-progress: true`. A newer push can cancel an older run. This is useful, but it means you must test the **latest commit's** run, not an older superseded run. fileciteturn433file0L2-L2

### Step 9: test the deployed TEST URL

The TEST deployment is under:

```text
https://shivashisvicky.github.io/Jarvis-OS/test/
```

Test the exact regression plus a few nearby sanity cases.

Example:

```text
Regression:
  Beowulf
  open the third one

Sanity:
  John Henry Newman
  open the third one
  show restaurants in Jagannath Nagar
  play Oggy on YouTube and play the third one
```

### Step 10: stop when the fix works

Do not "improve" working code in the same commit unless the improvement is required for the same bug.

---

## 10. How to code in PROD

PROD source is `main`.

```text
PROD change
   │
   ▼
main
   │
   ▼
production build
   │
   ▼
https://shivashisvicky.github.io/Jarvis-OS/
```

### Recommended promotion model

Do not develop directly on `main`.

Use:

```text
TEST
  │
  │ validate behaviour
  ▼
known-good TEST commit
  │
  │ deliberate promotion
  ▼
main / PROD
```

If a change is validated in TEST, the safest promotion is to move **only the validated change(s)** to PROD, rather than copying a large experimental TEST tree wholesale.

If using local Git and a clean, reviewed commit is suitable for promotion:

```bash
git switch main
git pull origin main
# apply only the reviewed change, for example:
git cherry-pick <validated-commit-sha>
git push origin main
```

Before doing this, verify that the commit has no TEST-only instrumentation, experimental cache-busters, temporary debug code, or dependencies on other unpromoted TEST commits.

If several TEST commits are tightly coupled, promote the complete validated set deliberately, not just the final commit.

**Never assume "green TEST" means "safe to cherry-pick one commit". Check the dependency chain.**

---

## 11. Commit anatomy: what a commit actually does

A Git commit is a snapshot plus history metadata. Think of it as:

```text
parent commit
      │
      ▼
  new snapshot
      │
      ▼
 commit SHA
```

For example:

```text
6010a558  ← stable tree
    │
    ▼
a6885092  ← mature runtime checkpoint
    │
    ▼
3b410597  ← Entity handle export fix
    │
    ▼
5efc74a4  ← Ebook transport fallback
```

A SHA identifies the exact repository state represented by that commit.

This is why a SHA is far more useful than saying "yesterday's version".

---

## 12. Proper rollback: three different operations

These are often confused.

### A. `git revert` = safest normal rollback

A revert creates a **new commit** that undoes a previous commit.

```text
A ── B ── C ── D
          ▲
       bad change

revert C

A ── B ── C ── D ── R
                     ▲
                 undo C
```

Use this when the bad commit is isolated and you want to preserve history.

Example:

```bash
git switch test/jarvis-intelligence-next
git pull origin test/jarvis-intelligence-next
git revert <bad-commit-sha>
git push origin test/jarvis-intelligence-next
```

### B. Restore selected files from a known-good commit = surgical recovery

This is often the best method for JARVIS.

Suppose a regression changed six files but only two are actually responsible.

Do **not** reset the whole branch.

Instead restore only those files from the known-good checkpoint:

```bash
git restore --source <known-good-sha> -- path/to/file1 path/to/file2
git add path/to/file1 path/to/file2
git commit -m "fix(TEST): restore stable command routing files"
git push origin test/jarvis-intelligence-next
```

Conceptually:

```text
Current TEST tree
 ├── voice       ← keep
 ├── maps        ← keep
 ├── youtube     ← keep
 ├── books      ← keep unless implicated
 ├── context    ← restore if implicated
 └── chain      ← restore if implicated

Known-good SHA
 └── copy only the implicated files
```

This preserves unrelated later fixes.

### C. Hard reset / force push = emergency operation

```bash
git reset --hard <sha>
git push --force-with-lease origin test/jarvis-intelligence-next
```

This rewrites the branch tip.

It should be treated as an emergency tool, not the default rollback strategy. It can invalidate other people's references, complicate Actions history, and erase the clean chronological story of what happened.

For this project, prefer A or B.

---

## 13. How to choose a rollback point

Use this decision tree:

```text
Regression detected
       │
       ▼
Is the bad change isolated to one commit?
       │
   ┌───┴───┐
  YES      NO / uncertain
   │           │
   ▼           ▼
revert     identify changed files
               │
               ▼
       compare with known-good
               │
               ▼
       restore only implicated files
               │
               ▼
          new TEST commit
```

### For JARVIS specifically

Before a broad rollback, compare:

```text
current failing TEST
       │
       ├── immediate parent
       ├── last deployed good TEST
       ├── mature a6885092 checkpoint
       └── protected 6010a558 rollback anchor
```

The regression ledger explicitly records the lesson that a green Actions run can still contain a behavioural regression, and recommends surgical recovery rather than throwing away unrelated historical work. fileciteturn432file0L2-L2

---

## 14. Example: rollback after an Ebook regression

Imagine:

```text
Good:
6010a558
   │
   ▼
new Ebook experiment
   │
   ▼
Beowulf breaks
John Henry breaks
Maps still works
Voice still works
```

Bad reaction:

```text
reset entire TEST branch to 6010a558
```

Why dangerous?

Because later commits may contain unrelated fixes for:

- iOS voice
- Maps
- YouTube
- Search Hub
- startup
- UI

Better:

```text
1. identify changed Ebook/Chain/Entity files
2. compare each against 6010a558 or mature checkpoint
3. restore only the faulty owner(s)
4. commit the recovery
5. deploy TEST
6. rerun the exact regression
```

This preserves the later working machinery while removing the faulty experiment.

---

## 15. Actions debugging procedure

When a run fails:

```text
Actions run
   │
   ▼
Which job failed?
   │
   ├── build
   │      └── inspect install/build/output
   │
   ├── deploy
   │      └── inspect Pages deployment
   │
   └── smoke
          └── inspect URL/content verification
```

Do not guess the cause from the red icon.

For example:

```text
install failed
```

does not prove:

```text
application code is broken
```

Likewise:

```text
build green + deploy green
```

does not prove:

```text
Beowulf ordinal behaviour is correct
```

The regression ledger records this distinction explicitly. fileciteturn432file0L2-L2

### Concurrency warning

The workflow uses:

```yaml
concurrency:
  group: jarvis-pages-dual-test
  cancel-in-progress: true
```

Therefore:

```text
push A → run A
push B → run B
             │
             └── run A may be cancelled
```

Always follow the newest run for the newest commit. fileciteturn433file0L2-L2

---

## 16. Cache-busting: why `index.html` matters

A browser can have:

```text
index.html from commit B
      │
      ▼
old cached jarvis-command-chain-v1.js
```

even though GitHub contains:

```text
new jarvis-command-chain-v1.js
```

Version query strings reduce that problem:

```html
<script src="./jarvis-command-chain-v1.js?v=20260908-command-chain-v2-2-2"></script>
```

When a runtime JS file changes, the safe sequence is:

```text
edit JS
  │
  ▼
update its ?v=... in index.html
  │
  ▼
commit both together
  │
  ▼
deploy
```

Do not randomly bump every script version. Change the cache-buster for the scripts actually changed.

---

## 17. Tracing a difficult bug

For intermittent cross-domain bugs, use a correlation ID.

Example:

```text
JARVIS TRACE 8F31

input: "Beowulf and open the third one"

[08:12:01.001] Chain: clause 1
[08:12:01.004] EntityAuthority: candidate=true
[08:12:01.006] EntityAuthority: handle()
[08:12:01.007] Context: clear
[08:12:01.220] EbookSearch: results=5
[08:12:01.222] Context: domain=BOOKS count=5
[08:12:01.224] Chain: clause 2
[08:12:01.225] ContextReference: ordinal=3 domain=BOOKS
[08:12:01.226] Reader: open Gutenberg=16328
```

For a failure, the first suspicious event is usually more valuable than a dozen later symptoms.

Record:

- correlation ID
- command text
- clause number
- domain
- result count
- selected item / BookRecord ID
- Gutenberg ID when applicable
- first Reader-open call
- whether Reader-open happened twice

---

## 18. What not to do

### Do not stack speculative fixes

Bad:

```text
bug
 ↓
fix A
 ↓
while A is still running, push B
 ↓
push C
 ↓
now nobody knows which change caused what
```

Good:

```text
bug
 ↓
trace
 ↓
fix A
 ↓
CI
 ↓
TEST
 ↓
pass/fail
 ↓
next action
```

### Do not confuse internal functions with public authorities

A function can exist but still be unreachable by another authority.

Example lesson:

```text
Entity Authority
 └── internal handle() exists

BUT

window.jarvisEntityAuthority
 └── handle NOT exported

Therefore Chain cannot delegate to it.
```

### Do not assume the router is always the final authority

An exact entity may need Entity Authority even when generic command classification says `BOOKS`.

### Do not fix an ordinal symptom by changing ordinal parsing first

First ask:

```text
Did the correct domain publish fresh context?
```

### Do not broad-rewrite the context engine to fix one stale result

Context is shared infrastructure. Broad edits have a large blast radius.

---

## 19. A compact developer checklist

Before coding:

```text
[ ] On test/jarvis-intelligence-next?
[ ] Current working tree clean?
[ ] Exact symptom reproduced?
[ ] Correct owner identified?
[ ] Known-good reference identified?
[ ] One-file or minimal diff possible?
```

Before commit:

```text
[ ] No unrelated files changed?
[ ] No PROD/main changes?
[ ] No temporary debug UI?
[ ] Cache-buster updated if required?
[ ] Commit message describes one change?
```

After push:

```text
[ ] Latest Actions run identified?
[ ] Build green?
[ ] Deploy green?
[ ] Smoke/URL verification green?
[ ] TEST URL tested manually?
[ ] Regression test passed?
[ ] Nearby sanity tests passed?
```

Before PROD promotion:

```text
[ ] TEST behaviour confirmed on deployed site?
[ ] Commit dependency chain understood?
[ ] No TEST-only instrumentation?
[ ] No temporary experimental code?
[ ] Only validated changes selected?
[ ] main is current?
[ ] PROD deployment intentionally triggered?
```

---

## 20. The mental model to keep

The most useful single picture is:

```text
                 ┌──────────────────┐
                 │   USER COMMAND   │
                 └────────┬─────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Command / Chain    │
                │ routing + clauses  │
                └─────────┬──────────┘
                          │
             ┌────────────┼─────────────┐
             ▼            ▼             ▼
         Entity        YouTube        Maps
        Authority      Authority     Authority
             │            │             │
             ▼            ▼             ▼
          Books       video results  map results
             │            │             │
             └────────────┼─────────────┘
                          ▼
                 ┌─────────────────┐
                 │ Context Engine  │
                 └────────┬────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Context Reference      │
              │ Authority              │
              └───────────┬────────────┘
                          │
                 "third one", "open it"
                          │
                          ▼
                    Selected result
                          │
             ┌────────────┼─────────────┐
             ▼            ▼             ▼
          Reader        YouTube        Map


         DEVELOPMENT / RECOVERY

 TEST branch ──► Actions ──► /test/
     │
     │ validated
     ▼
 selected commits
     │
     ▼
 main ─────────► PROD ──► /
```

### Final principle

**Protect the graph.**

JARVIS's intelligence is distributed across small authorities and the context they exchange. A one-line change can alter who owns a transition. The safest engineering approach is therefore to identify the owner, make the smallest possible change, preserve the known-good graph, deploy to TEST, observe, and only then promote.

---

## 21. Existing project handoff and regression records

This guide complements:

- `JARVIS-OS-CHAT-HANDOFF.md` — working project handoff and stable-baseline notes. It explicitly calls for freezing a known-good baseline, making one narrowly scoped change, pushing, verifying Actions, and comparing against the last known-good revision when something fails. fileciteturn431file0L2-L2
- `JARVIS-REGRESSIONS.md` — forensic record of regressions, including the Ebook/Entity/Chain interaction and the rule that green CI is not the same as behavioural correctness. fileciteturn432file0L2-L2

Keep those records updated when a new major regression teaches us something architectural. 
