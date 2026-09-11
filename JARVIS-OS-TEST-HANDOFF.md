# JARVIS OS TEST HANDOFF

TEST branch is the experiment path. PROD is the frozen baseline. Keep changes surgical, verify Actions, then test on the deployed TEST URL before any promotion.

## Current TEST Engineering Bay

Engineering Bay is exposed by the canonical home engineering-card owner (`jarvis-core-recovery-v1.js`) directly after API Lab and SFTP. The Bay opens the existing Engineering surface, where JSON, JWT, and Diff tools are provided by `jarvis-engineering-bay-v1.js`.

Do not add parallel home-card injectors or global context routing for this capability.
