from __future__ import annotations

import json
import mimetypes
import os
import subprocess
import sys
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8765"))
MAX_QUERY = 300


def search_video(query: str) -> dict:
    value = query.strip()
    if not value or len(value) > MAX_QUERY:
        raise ValueError("query is empty or too long")

    target = value if value.startswith(("http://", "https://")) else f"ytsearch1:{value}"
    opts = [
        sys.executable, "-m", "yt_dlp",
        "--no-playlist",
        "--quiet",
        "--no-warnings",
        "--skip-download",
        "--format", "best[ext=mp4][vcodec!=none][acodec!=none]/best[ext=mp4]/best",
        "--js-runtimes", "deno",
        "--remote-components", "ejs:github",
        "--no-check-certificates",
        "--add-header", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "--add-header", "Accept-Language: en-US,en;q=0.9",
        "--print", "%(id)s\t%(title)s\t%(webpage_url)s\t%(url)s\t%(duration)s",
        target,
    ]

    try:
        result = subprocess.run(
            opts,
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("yt-dlp search timed out after 60 seconds") from exc

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
        "webpageUrl": webpage_url or f"https://www.youtube.com/watch?v={video_id}",
        "mediaUrl": media_url,
        "duration": int(duration) if duration.isdigit() else 0,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "JarvisVideoDemo/4.0"

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

        if parsed.path == "/api/media":
            target = urllib.parse.parse_qs(parsed.query).get("url", [""])[0]
            try:
                source = urllib.parse.urlparse(target)
                if source.scheme != "https" or not source.hostname:
                    raise ValueError("only HTTPS media URLs are accepted")
                request = urllib.request.Request(
                    target,
                    headers={"User-Agent": "Mozilla/5.0", "Accept": "*/*"},
                )
                if self.headers.get("Range"):
                    request.add_header("Range", self.headers["Range"])
                with urllib.request.urlopen(request, timeout=20) as upstream:
                    self.send_response(upstream.status)
                    for key in ("Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"):
                        value = upstream.headers.get(key)
                        if value:
                            self.send_header(key, value)
                    self.send_header("Cache-Control", "no-store")
                    self.end_headers()
                    while chunk := upstream.read(1024 * 1024):
                        self.wfile.write(chunk)
                return
            except Exception as exc:
                self.send_json(502, {"error": f"media proxy failed: {exc}"})
                return

        if parsed.path == "/health":
            self.send_json(200, {"ok": True, "service": "jarvis-video-demo", "version": 4})
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
