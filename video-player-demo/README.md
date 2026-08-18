# JARVIS Keyword Video Player Demo

This is deliberately isolated from the JARVIS OS UI, SPA router, legacy media scripts, and existing E2E contracts.

## Goal

`keyword -> search -> real result -> play`

The first implementation uses a tiny Python HTTP service plus `yt-dlp` for discovery. It does not use the YouTube Data API, browser CORS proxies, PeerTube normalization, or VLC.

## Run

```bash
cd video-player-demo
python -m venv .venv
# activate the environment
pip install -r requirements.txt
python server.py
```

Open `http://127.0.0.1:8765/`.

Search for any keyword. The service asks `yt-dlp` for the first YouTube result and returns its current browser-playable media URL. The browser uses a normal HTML5 `<video>` element.

## Why this is separate

If this demo fails, the failure is isolated to media discovery/playback. If it works, the proven player can be integrated into JARVIS without carrying the old media architecture with it.
