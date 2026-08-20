# JARVIS OS 3.0

## Direction

JARVIS OS 3.0 is a reliability-first evolution of the existing browser-native operating environment. The goal is to make the product feel like one coherent operating system rather than a collection of feature patches.

## Non-negotiable principles

1. **One runtime authority per subsystem.** A subsystem may have adapters/providers, but only one active UI/runtime owner.
2. **Live data means live data.** No canned, recycled, or unrelated fallback results presented as successful discovery.
3. **Degraded states are explicit.** When a provider fails, JARVIS says what failed and preserves useful alternatives rather than inventing success.
4. **The deployed application is the product.** CI must exercise the built/deployed experience, not merely source-level contracts.
5. **Provider is an implementation detail.** Search, maps, news, media, games, and intelligence expose stable JARVIS contracts while providers can change underneath.
6. **Offline-first where it is legitimate.** Shell, settings, notes, calculator, games, recent activity, and core navigation remain usable without the network.
7. **Native boundaries are honest.** Capabilities such as raw SSH/SFTP require a local/native bridge and must never be faked by a browser-only UI.
8. **No destructive refresh.** Refresh and reconnect behavior must preserve the current workspace and state unless the user explicitly resets it.

## Target architecture

```text
JARVIS OS
├── Shell
│   ├── Workspace / tabs
│   ├── Window manager
│   ├── command palette
│   ├── notifications
│   └── global search
├── Intelligence Runtime
│   ├── command router
│   ├── voice bridge
│   ├── research/search adapters
│   └── action/permission broker
├── Apps
│   ├── Home
│   ├── News
│   ├── Maps
│   ├── Media
│   ├── Games
│   ├── API Lab
│   ├── SFTP / Files
│   ├── Notes
│   ├── Terminal
│   └── Settings
├── Data Layer
│   ├── IndexedDB
│   ├── cache / TTL policy
│   ├── recent activity
│   └── import/export
└── Provider Layer
    ├── search
    ├── news
    ├── geocoding/maps
    ├── media
    └── optional local/native adapters
```

## 3.0 feature priorities

### P0: Stabilize the foundation

- Consolidate the active runtime into one clear application entrypoint.
- Remove obsolete runtime references from production HTML and CI checks.
- Introduce a typed-ish capability contract between apps and provider adapters.
- Add explicit loading, success, empty, degraded, and error states to live-data apps.
- Add a consistent telemetry/event ledger in local storage for troubleshooting.
- Make cache keys/versioning subsystem-scoped instead of ad-hoc file-level bumps.

### P1: Make the OS feel like an OS

- Real tab/workspace model with restore-last-session.
- Window manager behavior on desktop and usable sheet/panel behavior on mobile.
- Global command palette with app-aware actions.
- Recent tabs, recent files, recent searches, and command history.
- Cross-app search entrypoint.
- Persistent notifications/toasts with severity and action affordances.

### P1: Serious productivity tools

- API Lab as a real REST client: methods, headers, query params, body editor, auth profiles, response viewer, history, import/export.
- SFTP workspace with explicit browser/native boundary and connection profiles.
- Files workspace with import/export and local virtual filesystem semantics.
- Terminal sandbox using WASM/local capabilities where available.

### P1: Intelligence and voice

- Mature voice input surface with text fallback and explicit provider/status indicators.
- Intent routing that can navigate apps, search, read results, and trigger safe UI actions.
- Search provider selection: web, news, media, maps, and local JARVIS data.
- Conversation/action history that is inspectable and clearable.
- Voice output abstraction so browser TTS can later be replaced by a better voice engine without rewriting the UI.

### P1: Media, News, Maps

- Media: keyword-sensitive live discovery, result diversity, filters, and in-shell playback.
- News: live category/search refresh, stale-state protection, and source metadata.
- Maps: arbitrary geocoding/search, provider failover, saved places, and route handoff.
- All three must survive provider outages without presenting fake success.

### P2: Entertainment and knowledge

- Games hub with multiple lightweight offline-capable games.
- Online ebook/reader workspace with bookmarks, reading position, font controls, and offline caching where licensing permits.
- Media/watch history and favorites.

### P2: Personalization and polish

- More granular Settings and capability permissions.
- Themes beyond light/dark while preserving accessibility.
- Keyboard-first navigation.
- Reduced-motion/accessibility mode.
- Performance budget and lazy loading per app.

## CI/CD contract for 3.0

Every production change should prove:

- install and build succeed;
- static runtime references are coherent and have no obsolete authorities;
- unit and contract tests pass;
- Chromium deployed-app smoke passes;
- critical live-data gates use real providers or explicit deterministic provider contracts;
- media `cats` and at least one additional arbitrary keyword produce query-sensitive live results;
- News Home refresh changes state using fresh data or reports a controlled degraded state;
- Maps resolves arbitrary locations, not a fixed allowlist;
- command/voice flows do not steal ordinary form input;
- no destructive auto-refresh wipes app/workspace state;
- browser/mobile layout smoke passes;
- failure artifacts are uploaded for diagnosis.

## Definition of done

A 3.0 feature is not done because its code exists. It is done when the feature is reachable from the real shell, survives a refresh, has explicit degraded/error behavior, works on the deployed Pages build, and has an automated acceptance gate for its critical behavior.

## Migration strategy

Do not rewrite the whole application in one shot. Migrate subsystem-by-subsystem:

1. freeze the current main behavior;
2. define the subsystem contract;
3. make one authority canonical;
4. remove competing legacy authority;
5. add deployed acceptance coverage;
6. ship the subsystem;
7. move to the next subsystem.

This keeps JARVIS usable while the 3.0 architecture grows underneath it.
