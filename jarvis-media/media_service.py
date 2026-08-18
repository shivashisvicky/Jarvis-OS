"""Local HTTP bridge for the JARVIS media engine."""
from __future__ import annotations
import json, logging, os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from media_agent import JarvisMediaPlayer

HOST = os.getenv("JARVIS_MEDIA_HOST", "127.0.0.1")
PORT = int(os.getenv("JARVIS_MEDIA_PORT", "8765"))
PLAYER = JarvisMediaPlayer()
logging.basicConfig(level=logging.INFO, format="[JARVIS MEDIA] %(levelname)s %(message)s")

class MediaHandler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/health":
            s = PLAYER.get_status()
            self._send(200, {"ok": True, "vlc": PLAYER.vlc_available, "state": s.state, "title": s.title})
            return
        if path == "/status":
            s = PLAYER.get_status()
            self._send(200, {"state": s.state, "title": s.title, "detail": s.detail})
            return
        self._send(404, {"ok": False, "error": "Not found"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        try:
            length = int(self.headers.get("Content-Length", "0"))
            data = json.loads(self.rfile.read(length).decode("utf-8") if length else "{}")
        except (ValueError, json.JSONDecodeError) as exc:
            self._send(400, {"ok": False, "error": f"Invalid JSON: {exc}"})
            return
        if path == "/search-play":
            result = PLAYER.search_and_play(str(data.get("query", "")).strip())
        elif path == "/control":
            result = PLAYER.control_player(str(data.get("action", "")).strip(), data.get("volume"))
        else:
            self._send(404, {"ok": False, "error": "Not found"})
            return
        self._send(200 if result.startswith("Success") else 422, {"ok": result.startswith("Success"), "message": result})

    def log_message(self, fmt: str, *args) -> None:
        logging.info("%s - %s", self.address_string(), fmt % args)

def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), MediaHandler)
    logging.info("Media service listening on http://%s:%s", HOST, PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        PLAYER.close()
        server.server_close()

if __name__ == "__main__":
    main()
