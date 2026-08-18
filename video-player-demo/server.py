from __future__ import annotations

import json
import mimetypes
import os
import subprocess
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8765"))


def search_video(query: str) -> dict:
    """Resolve a keyword or supported URL to one browser-playable media URL."""
    value = query.strip()
    is_url = value.startswith(("http://", "https://"))
    target = value if is_url else f"ytsearch1:{value}"
    opts = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--no-playlist",
        "--quiet",
        "--no-warnings",
        "--format",
        "best[ext=mp4][vcodec!=none][acodec!=none]/best[ext=mp4]/best",
        "--js-runtimes",
        "deno",
        "--print",
        "%(id)s\t%(title)s\t%(webpage_url)s\t%(url)s\t%(duration)s",
        target,
    ]
    try:
        result = subprocess.run(
            opts,
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=45,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("video search timed out after 45 seconds") from exc

    if result.returncode != 0:
        detail = (result.stderr or result.stdout).strip().splitlines()
        raise RuntimeError(detail[-1] if detail else "yt-dlp failed")

    line = next((x for x in result.stdout.splitlines() if x.strip()), "")
    parts = line.split("\t", 4)
    if len(parts) != 5 or not parts[0] or not parts[3]:
        raise RuntimeError("yt-dlp returned no playable result")

    video_id, title, webpage_url, media_url, duration = parts
    return {
        "id": video_id,
        "title": title,
        "webpageUrl": webpage_url,
        "mediaUrl": media_url,
        "duration": int(duration) if duration.isdigit() else 0,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "JarvisVideoDemo/2.0"

    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/search":
            query = urllib.parse.parse_qs(parsed.query).get("q", [""])[0].strip()
            if not query:
                self.send_json(400, {"error": "query is required"})
                return
            try:
                self.send_json(200, {"result": search_video(query)})
            except Exception as exc:
                self.send_json(502, {"error": str(exc)})
            return

        if parsed.path == "/health":
            self.send_json(200, {"ok": True, "service": "jarvis-video-demo"})
            return

        path = parsed.path.lstrip("/") or "index.html"
        full = os.path.abspath(os.path.join(ROOT, path))
        if not full.startswith(ROOT + os.sep) or not os.path.isfile(full):
            self.send_error(404)
            return
        with open(full, "rb") as fh:
            data = fh.read()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(full)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    print(f"JARVIS video demo: http://127.0.0.1:{PORT}/", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
