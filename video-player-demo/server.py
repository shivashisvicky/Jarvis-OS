from __future__ import annotations

import json
import mimetypes
import os
import sys
import traceback
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8765"))

INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://inv.n8n.io",
]
UA = "JARVIS-OS/2.0"


def http_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def youtube_id(value: str):
    p = urllib.parse.urlparse(value)
    host = (p.hostname or "").lower()
    if host in {"youtube.com", "www.youtube.com", "m.youtube.com"}:
        if p.path.startswith("/shorts/"):
            return p.path.split("/")[2] if len(p.path.split("/")) > 2 else None
        return urllib.parse.parse_qs(p.query).get("v", [None])[0]
    if host == "youtu.be":
        return p.path.strip("/").split("/")[0] or None
    return None


def search_video(query: str) -> dict:
    query = query.strip()
    if not query:
        raise ValueError("query is required")

    existing_id = youtube_id(query)
    if existing_id:
        return {
            "id": existing_id,
            "title": "YouTube video",
            "webpageUrl": f"https://www.youtube.com/watch?v={existing_id}",
            "embedUrl": f"https://www.youtube-nocookie.com/embed/{existing_id}",
            "provider": "youtube",
        }

    errors = []
    encoded = urllib.parse.quote(query)
    for instance in INVIDIOUS_INSTANCES:
        try:
            data = http_json(f"{instance}/api/v1/search?q={encoded}&type=video&page=1")
            items = data if isinstance(data, list) else data.get("items", [])
            for item in items:
                vid = item.get("videoId")
                if vid:
                    return {
                        "id": vid,
                        "title": item.get("title") or query,
                        "webpageUrl": f"https://www.youtube.com/watch?v={vid}",
                        "embedUrl": f"https://www.youtube-nocookie.com/embed/{vid}",
                        "provider": "youtube",
                    }
            errors.append(f"{instance}: empty result")
        except Exception as exc:
            errors.append(f"{instance}: {exc}")

    raise RuntimeError("No live search provider responded: " + " | ".join(errors))


class Handler(BaseHTTPRequestHandler):
    server_version = "JarvisVideoDemo/7.0"

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
            self.send_json(200, {"ok": True, "service": "jarvis-video-demo", "version": 7})
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
