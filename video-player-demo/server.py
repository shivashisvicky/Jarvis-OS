from __future__ import annotations

import html
import json
import mimetypes
import os
import re
import sys
import traceback
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8765"))
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36"
VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


def youtube_id(value: str):
    p = urllib.parse.urlparse(value.strip())
    host = (p.hostname or "").lower()
    if host == "youtu.be":
        candidate = p.path.strip("/").split("/")[0]
        return candidate if VIDEO_ID_RE.fullmatch(candidate or "") else None
    if host in {"youtube.com", "www.youtube.com", "m.youtube.com"}:
        if p.path.startswith("/shorts/"):
            parts = p.path.split("/")
            candidate = parts[2] if len(parts) > 2 else ""
        else:
            candidate = urllib.parse.parse_qs(p.query).get("v", [""])[0]
        return candidate if VIDEO_ID_RE.fullmatch(candidate or "") else None
    return None


def duckduckgo_search(query: str):
    q = f"site:youtube.com/watch {query}"
    url = "https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": q})
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"})
    with urllib.request.urlopen(request, timeout=12) as response:
        page = response.read().decode("utf-8", errors="replace")

    # DDG result links can be wrapped/redirected, so inspect both decoded HTML
    # and href attributes rather than assuming one exact markup format.
    page = html.unescape(urllib.parse.unquote(page))
    candidates = []
    for match in re.finditer(r"(?:https?://)?(?:www\.)?youtube\.com/(?:watch\?v=|shorts/)([A-Za-z0-9_-]{11})", page):
        candidates.append(match.group(1))
    for match in re.finditer(r"https?://youtu\.be/([A-Za-z0-9_-]{11})", page):
        candidates.append(match.group(1))

    seen = set()
    return [x for x in candidates if not (x in seen or seen.add(x))]


def search_video(query: str) -> dict:
    query = query.strip()
    if not query:
        raise ValueError("query is required")

    direct = youtube_id(query)
    if direct:
        return {
            "id": direct,
            "title": "YouTube video",
            "webpageUrl": f"https://www.youtube.com/watch?v={direct}",
            "embedUrl": f"https://www.youtube-nocookie.com/embed/{direct}",
            "provider": "youtube",
        }

    ids = duckduckgo_search(query)
    if not ids:
        raise RuntimeError("Live search returned no YouTube video results")

    video_id = ids[0]
    return {
        "id": video_id,
        "title": f"YouTube result for {query}",
        "webpageUrl": f"https://www.youtube.com/watch?v={video_id}",
        "embedUrl": f"https://www.youtube-nocookie.com/embed/{video_id}",
        "provider": "youtube",
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "JarvisVideoDemo/8.0"

    def log_message(self, fmt, *args):
        sys.stderr.write(f"[{self.log_date_time_string()}] {fmt % args}\n")
        sys.stderr.flush()

    def send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/health":
            self.send_json(200, {"ok": True, "service": "jarvis-video-demo", "version": 8})
            return
        if parsed.path == "/api/search":
            query = urllib.parse.parse_qs(parsed.query).get("q", [""])[0]
            try:
                self.send_json(200, {"result": search_video(query)})
            except Exception as exc:
                traceback.print_exc(file=sys.stderr)
                self.send_json(502, {"error": str(exc)})
            return
        path = parsed.path.lstrip("/") or "index.html"
        full = os.path.abspath(os.path.join(ROOT, path))
        if not full.startswith(ROOT + os.sep) or not os.path.isfile(full):
            self.send_error(404)
            return
        with open(full, "rb") as fh:
            body = fh.read()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(full)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    print(f"JARVIS video demo: http://127.0.0.1:{PORT}/", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
