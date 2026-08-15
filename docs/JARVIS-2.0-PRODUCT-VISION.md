# J.A.R.V.I.S. 2.0 Product Vision

## The reset

JARVIS is not a collection of small web apps. It is a personal computing environment whose applications are capabilities of one intelligence layer.

The quality bar is not "the test passes". A capability ships only when it is useful, fast, resilient, coherent, and visibly better than opening a separate website or utility.

## Product principles

1. **Zero dead ends**: every action produces progress, a useful fallback, or an explicit recovery path.
2. **Perceived-zero latency**: cached/stale data renders first; network refresh happens behind the interface.
3. **Intent over navigation**: users can ask JARVIS for an outcome instead of knowing which app to open.
4. **Depth over app count**: fewer excellent subsystems beat many shallow demos.
5. **Local-first**: games, notes, preferences, history, caching and UI state work without a network.
6. **Provider-agnostic**: search, news and media use adapters and fallbacks instead of trusting one public endpoint.
7. **Graceful degradation**: external provider failure never becomes a blank panel.
8. **Contextual workspace**: the shell changes emphasis based on whether the user is researching, watching, engineering, navigating or playing.
9. **Real interaction quality**: keyboard navigation, loading states, empty states, errors, retry, focus management and responsive layouts are product features.
10. **Truthful QA**: E2E tests verify user outcomes, while integration tests verify provider contracts. A green test is necessary, never sufficient.

## New information architecture

### Command Core
The home screen is a command cockpit, not a dashboard full of unrelated cards. It exposes the command channel, current mission/context, fast actions, system state and a compact intelligence briefing.

### Intelligence Desk
A live, cached, summarized news/research surface. Headlines are clustered, summarized and source-linked. The first render uses cached data when available and a stale snapshot when fresh data is slow. Genre filters are optional and secondary.

### Media Engine
A provider-neutral discovery and playback subsystem. Discovery and playback are separate. Search with a keyword and zero-keyword recommendations are both first-class. Playback attempts the best supported in-house route and falls back to a browser/source route without leaving a dead player.

### Research Browser
A real tabbed research workspace: multiple providers, recent tabs, history, bookmarks, reader-oriented results and a path for JARVIS to use search results as context.

### API Lab
A serious HTTP workspace: collections, request history, headers, query/body editors, auth, environments/variables, JSON response inspection, cURL import and WebSocket/GraphQL expansion points.

### File Command
A dual-pane file/SFTP workspace with transfer queue, bookmarks, permissions and terminal handoff. Browser permissions remain explicit and honest.

### Navigation
A map workspace focused on search, places, directions and useful layers rather than a decorative embedded map.

### Arcade
A local-first game room. Initial games: Snake, Tic Tac Toe, 2048 and Tetris, followed by Minesweeper, Breakout, Connect Four, Sudoku, Solitaire and Chess. Games must launch instantly and persist scores locally.

### Control Center
Settings become a real system control surface: appearance, voice, search providers, startup workspace, cache controls, privacy/network status, keyboard shortcuts and diagnostics.

## Runtime architecture

```text
                    J.A.R.V.I.S. CORE
                           |
              +------------+------------+
              |                         |
        Intent / Command          Context / Memory
              |                         |
      +-------+-------+-----------------+------+
      |       |       |       |         |      |
    Search  News    Media    API      Files   Maps
      |       |       |       |         |      |
      +-------+-------+-------+---------+------+
                      |
                Provider adapters
                      |
             cache -> network -> fallback
```

## Performance contract

- Render the shell immediately.
- Render cached content immediately when present.
- Never block the complete workspace on news/media/network calls.
- Cache successful provider responses with TTL metadata.
- Allow stale data to render while refreshing in the background.
- Deduplicate concurrent identical requests.
- Abort superseded searches.
- Show useful skeletons only where content is genuinely unknown.
- Measure time-to-shell, time-to-first-content and time-to-interaction in development diagnostics.

## Media contract

A media result is a logical item independent of playback mechanism.

```ts
interface MediaItem {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  source: string;
  watchUrl?: string;
  streamUrl?: string;
  playable: boolean;
}
```

The UI never assumes a provider-specific stream format. Playback resolution returns a `PlaybackTarget` with `native`, `embed`, `external`, or `unavailable` mode plus a user-readable reason and retry/fallback action.

## News contract

News cards are not raw API payloads. They are normalized intelligence objects:

- title
- source
- published time
- image
- short summary
- importance
- topic
- canonical URL

The UI can render the cached normalized object without contacting the provider again.

## QA contract

Every major subsystem receives four layers of validation:

1. Type/build validation.
2. Unit tests for normalization/cache/state logic.
3. Provider contract tests using fixtures.
4. Playwright user journeys covering successful, empty, slow and failed-provider states.

Tests must assert observable user outcomes, not accidental DOM implementation details.

## Build order

### Phase A: Foundation
- runtime/cache service
- normalized provider adapters
- global loading/error/fallback model
- command/context model
- diagnostics

### Phase B: Intelligence + media
- instant news desk
- news summarization pipeline
- zero-keyword media discovery
- provider-neutral playback engine
- browser fallback

### Phase C: Core applications
- research browser
- API Lab depth
- File/SFTP depth
- maps

### Phase D: Delight
- Arcade expansion
- contextual modes
- advanced voice interaction
- visual refinement

### Phase E: Spatial
- 3D scanning and spatial interfaces only after the core product is stable.

## Definition of done

A feature is done only when a first-time user can discover it, use it without documentation, recover from a provider failure, and understand what JARVIS is doing. The interface should feel like one machine, not a folder of mini-projects.
