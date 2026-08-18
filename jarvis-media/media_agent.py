"""Local JARVIS media engine.

The browser UI should treat this module as a local tool service. yt-dlp performs
search/extraction and libVLC performs playback. Extraction runs on a dedicated
worker so an agent's voice/listening loop is never blocked by network I/O.
"""

from __future__ import annotations

import logging
import os
import threading
from concurrent.futures import Future, ThreadPoolExecutor
from dataclasses import dataclass
from typing import Optional

import yt_dlp

try:
    import vlc
except ImportError:  # pragma: no cover - exercised on machines without the binding
    vlc = None  # type: ignore[assignment]


LOGGER = logging.getLogger("jarvis.media")


@dataclass(frozen=True)
class MediaStatus:
    state: str
    title: str = ""
    detail: str = ""


class JarvisMediaPlayer:
    """Stateful, non-blocking local media player for a JARVIS agent."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="jarvis-media")
        self._future: Optional[Future[str]] = None
        self._status = MediaStatus("idle")
        self._vlc_available = False
        self._vlc_instance = None
        self._player = None

        self.ydl_opts = {
            "default_search": "ytsearch1",
            "download": False,
            "format": "best[ext=mp4]/best",
            "quiet": True,
            "noplaylist": True,
            "extract_flat": False,
            "no_warnings": True,
        }

        self._initialize_vlc()

    @property
    def vlc_available(self) -> bool:
        return self._vlc_available

    def _initialize_vlc(self) -> None:
        if vlc is None:
            LOGGER.error("python-vlc is not installed")
            return

        try:
            vlc_path = os.getenv("VLC_PATH")
            if vlc_path and hasattr(vlc, "libvlc_set_path"):
                vlc.libvlc_set_path(vlc_path)

            self._vlc_instance = vlc.Instance("--no-video-title-show")
            self._player = self._vlc_instance.media_player_new()
            self._vlc_available = True
        except Exception:
            LOGGER.exception("VLC initialization failed")
            self._vlc_instance = None
            self._player = None
            self._vlc_available = False

    def search_and_play(self, query: str) -> str:
        """Start search/extraction/playback without blocking the agent thread."""
        query = (query or "").strip()
        if not query:
            return "Error: Search failure. Query cannot be empty."
        if not self._vlc_available:
            return "Error: VLC unavailable. Install VLC/libVLC and python-vlc."

        with self._lock:
            if self._future and not self._future.done():
                return "Error: Media operation already in progress."
            self._status = MediaStatus("searching", detail=query)
            self._future = self._executor.submit(self._search_and_play_worker, query)

        return f"Success: Media search started for '{query}'."

    def _search_and_play_worker(self, query: str) -> str:
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(query, download=False)

            if not info:
                return self._set_error(f"Search failure. No result found for '{query}'.")

            entries = info.get("entries") if isinstance(info, dict) else None
            video_data = next((entry for entry in entries or [] if entry), None) if entries is not None else info
            if not video_data:
                return self._set_error(f"Search failure. No result found for '{query}'.")

            title = video_data.get("title") or "Unknown Title"
            stream_url = video_data.get("url")
            if not stream_url:
                return self._set_error(
                    f"Extraction failure. Found '{title}' but no playable direct stream URL was returned."
                )

            with self._lock:
                if not self._vlc_instance or not self._player:
                    return self._set_error("VLC unavailable. The local media engine is not initialized.")
                media = self._vlc_instance.media_new(stream_url)
                self._player.set_media(media)
                result = self._player.play()

            if result == -1:
                return self._set_error(f"Playback failure. VLC refused '{title}'.")

            with self._lock:
                self._status = MediaStatus("playing", title=title, detail=stream_url)
            return f"Success: Now playing '{title}'."

        except yt_dlp.utils.DownloadError as exc:
            return self._set_error(f"Extraction failure. yt-dlp: {exc}")
        except Exception as exc:
            LOGGER.exception("Unexpected media worker failure")
            return self._set_error(f"Playback failure. Unexpected media engine error: {exc}")

    def control_player(self, action: str, volume: Optional[int] = None) -> str:
        """Control the current VLC session without blocking on extraction."""
        if not self._vlc_available or not self._player:
            return "Error: VLC unavailable."

        action = (action or "").strip().lower()
        try:
            with self._lock:
                if action == "stop":
                    self._player.stop()
                    self._status = MediaStatus("stopped")
                    return "Success: Playback stopped."

                if action == "pause":
                    self._player.set_pause(1)
                    current = self._status
                    self._status = MediaStatus("paused", current.title, current.detail)
                    return "Success: Playback paused."

                if action == "resume":
                    self._player.set_pause(0)
                    current = self._status
                    self._status = MediaStatus("playing", current.title, current.detail)
                    return "Success: Playback resumed."

                if action == "volume":
                    if volume is None:
                        return "Error: Volume level not provided."
                    level = max(0, min(100, int(volume)))
                    if self._player.audio_set_volume(level) == -1:
                        return "Error: Playback failure. VLC rejected the volume change."
                    return f"Success: Volume set to {level}%."

                return f"Error: Unrecognized control action '{action}'."
        except Exception as exc:
            LOGGER.exception("VLC control failed")
            return f"Error: Playback failure. VLC control error: {exc}"

    def get_status(self) -> MediaStatus:
        """Return a snapshot useful to the local bridge and smoke tests."""
        with self._lock:
            return self._status

    def _set_error(self, detail: str) -> str:
        with self._lock:
            self._status = MediaStatus("error", detail=detail)
        LOGGER.warning("JARVIS media error: %s", detail)
        return f"Error: {detail}"

    def close(self) -> None:
        """Stop playback and release the worker; safe to call multiple times."""
        try:
            if self._player:
                self._player.stop()
        finally:
            self._executor.shutdown(wait=False, cancel_futures=True)


__all__ = ["JarvisMediaPlayer", "MediaStatus"]
