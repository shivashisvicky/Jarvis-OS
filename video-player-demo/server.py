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


def fetch_text(url: str, headers=None, timeout=8):
    request_headers = {"User-Agent": UA}
    if headers:
        request_headers.update(headers)
    request = urllib.request.Request(url, headers=request_headers)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def fetch_json(url: str, headers=None, timeout=8):
    return json.loads(fetch_text(url, headers={"Accept": "application/json", **(headers or {})}, timeout=timeout))


def search_decapi(query: str):
    url = "https://decapi.me/youtube/videoid?" + urllib.parse.urlencode({"search": query})
    value = fetch_text(url, headers={"User-Agent": "curl/7.81.0"}, timeout=6).strip()
    if VIDEO_ID_RE.fullmatch(value):
        return value, query
    raise RuntimeError(f"DecAPI returned invalid ID: {value[:120]!r}")


def search_youtube_direct(query: str):
    url = "https://www.youtube.com/results?" + urllib.parse.urlencode({"search_query": query})
    page = fetch_text(url, headers={"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"}, timeout=8)
    matches = re.findall(r'"videoId":"([A-Za-z0-9_-]{11})"', page)
    if not matches:
        matches = re.findall(r'/watch\?v=([A-Za-z0-9_-]{11})', page)
    if matches:
        return matches[0], query
    raise RuntimeError("YouTube HTML contained no videoId")


def search_piped(query: str):
    instances = [
        "https://pipedapi.adminforge.de",
        "https://pipedapi.kavin.rocks",
        "https://pipedapi.reallyaweso.me",
        "https://pipedapi.leptons.xyz",
    ]
    encoded = urllib.parse.quote(query)
    errors = []
    for instance in instances:
        try:
            data = fetch_json(f"{instance}/search?q={encoded}&filter=videos", timeout=6)
            for item in data.get("items", []):
                raw = item.get("url", "")
                match = re.search(r"(?:v=|watch/)([A-Za-z0-9_-]{11})", raw)
                if match:
                    return match.group(1), item.get("title") or query
            errors.append(f"{instance}: empty result")
        except Exception as exc:
            errors.append(f"{instance}: {exc}")
    raise RuntimeError("Piped: " + " | ".join(errors))


def search_invidious_registry(query: str):
    registry = fetch_json("https://api.invidious.io/instances.json?sort_by=health", timeout=8)
    encoded = urllib.parse.quote(query)
    errors = []
    for item in registry:
        if not isinstance(item, list) or len(item) < 2 or not isinstance(item[1], dict):
            continue
        meta = item[1]
        if meta.get("api") is not True or meta.get("type") != "https":
            continue
        instance = "https://" + item[0]
        try:
            data = fetch_json(f"{instance}/api/v1/search?q={encoded}&type=video&page=1", timeout=5)
            items = data if isinstance(data, list) else data.get("items", [])
            for result in items:
                vid = result.get("videoId")
                if VIDEO_ID_RE.fullmatch(vid or ""):
                    return vid, result.get("title") or query
            errors.append(f"{instance}: empty result")
        except Exception as exc:
            errors.append(f"{instance}: {exc}")
    raise RuntimeError("Invidious: " + " | ".join(errors[:12]))


def search_duckduckgo(query: str):
    q = f"site:youtube.com/watch {query}"
    url = "https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": q})
    page = html.unescape(urllib.parse.unquote(fetch_text(url, timeout=12)))
    candidates = []
    for pattern in (
        r"(?:https?://)?(?:www\.)?youtube\.com/(?:watch\?v=|shorts/)([A-Za-z0-9_-]{11})",
        r"https?://youtu\.be/([A-Za-z0-9_-]{11})",
        r"(?:v=|v%3D)([A-Za-z0-9_-]{11})",
    ):
        candidates.extend(re.findall(pattern, page))
    for candidate in candidates:
        if VIDEO_ID_RE.fullmatch(candidate):
            return candidate, query
    raise RuntimeError("DuckDuckGo returned no YouTube video ID")


def search_video(query: str) -> dict:
    query = query.strip()
    if not query:
        raise ValueError("query is required")

    direct = youtube_id(query)
    if direct:
        return {"id": direct, "title": "YouTube video", "webpageUrl": f"https://www.youtube.com/watch?v={direct}", "embedUrl": f"https://www.youtube-nocookie.com/embed/{direct}", "provider": "youtube"}

    providers = [
        ("DecAPI", search_decapi),
        ("YouTube Direct", search_youtube_direct),
        ("Piped", search_piped),
        ("Invidious", search_invidious_registry),
        ("DuckDuckGo", search_duckduckgo),
    ]
    errors = []
    for name, provider in providers:
        try:
            result = provider(query)
            if result:
                video_id, title = result
                if VIDEO_ID_RE.fullmatch(video_id):
                    return {"id": video_id, "title": title or query, "webpageUrl": f"https://www.youtube.com/watch?v={video_id}", "embedUrl": f"https://www.youtube-nocookie.com/embed/{video_id}", "provider": "youtube"}
            errors.append(f"{name}: returned no valid video ID")
        except Exception as exc:
            errors.append(f"{name}: {exc}")

    raise RuntimeError("All live video search providers failed:\n  - " + "\n  - ".join(errors))


class Handler(BaseHTTPRequestHandler):
    server_version = "JarvisVideoDemo/10.0"

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
            self.send_json(200, {"ok": True, "service": "jarvis-video-demo", "version": 10})
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
