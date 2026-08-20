# Jarvis OS

A lightweight, local-first desktop environment that runs in a browser tab or as a PWA. The browser supplies the runtime, while Jarvis supplies the shell, app model and persistent local data layer.

## Current foundation
- Apple-inspired desktop shell with dark/light appearance
- Responsive navigation and app launcher
- Native IndexedDB persistence, no database server
- Calculator
- Snake game
- Files/system workspace view
- Persistent Notes
- Settings
- PWA manifest
- Playwright browser smoke/SIT tests

## Development
```bash
npm install
npm run dev
```

## Verification
```bash
npm run build
npm run test
npm run test:browser
```

The project intentionally avoids a heavyweight desktop wrapper at this stage. Electron/Tauri can be introduced later only if native capabilities become necessary.

## Roadmap
1. App sandbox + permission model
2. Real virtual filesystem and import/export
3. Terminal/WASM runtime
4. Window manager and multitasking
5. Offline service worker + install experience
6. Broader browser compatibility matrix
7. Performance budget and full SIT suite

## CI/CD

Production Pages deployment is validated through the GitHub Actions deployment workflow. Live Media verification requires the repository `YOUTUBE_API_KEY` Actions secret, restricted to YouTube Data API v3 and the GitHub Pages site origin.
