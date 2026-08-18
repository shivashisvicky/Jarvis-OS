import time
import unittest
from unittest.mock import patch

import media_agent


class FakePlayer:
    def __init__(self):
        self.calls = []
        self.media = None

    def set_media(self, media):
        self.media = media
        self.calls.append(("set_media", media))

    def play(self):
        self.calls.append(("play",))
        return 0

    def stop(self):
        self.calls.append(("stop",))

    def set_pause(self, value):
        self.calls.append(("pause", value))

    def audio_set_volume(self, value):
        self.calls.append(("volume", value))
        return 0


class FakeInstance:
    def __init__(self, *_args):
        self.player = FakePlayer()

    def media_player_new(self):
        return self.player

    def media_new(self, url):
        return {"url": url}


class FakeVlc:
    Instance = FakeInstance


class FakeYoutubeDL:
    def __init__(self, _opts):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def extract_info(self, _query, download=False):
        assert download is False
        return {
            "entries": [
                {
                    "title": "Mock JARVIS Video",
                    "url": "https://media.example.test/stream.mp4",
                }
            ]
        }


class MediaAgentSmokeTests(unittest.TestCase):
    def test_search_is_non_blocking_and_eventually_starts_playback(self):
        with patch.object(media_agent, "vlc", FakeVlc), patch.object(
            media_agent.yt_dlp, "YoutubeDL", FakeYoutubeDL
        ):
            player = media_agent.JarvisMediaPlayer()
            try:
                started_at = time.monotonic()
                response = player.search_and_play("test video")
                elapsed = time.monotonic() - started_at

                self.assertTrue(response.startswith("Success: Media search started"))
                self.assertLess(elapsed, 0.25)

                deadline = time.monotonic() + 2
                while time.monotonic() < deadline:
                    if player.get_status().state == "playing":
                        break
                    time.sleep(0.01)

                self.assertEqual(player.get_status().state, "playing")
                self.assertEqual(player.get_status().title, "Mock JARVIS Video")
                self.assertEqual(player.control_player("pause"), "Success: Playback paused.")
                self.assertEqual(player.control_player("resume"), "Success: Playback resumed.")
                self.assertEqual(player.control_player("volume", 30), "Success: Volume set to 30%.")
                self.assertEqual(player.control_player("stop"), "Success: Playback stopped.")
            finally:
                player.close()

    def test_empty_query_is_rejected(self):
        with patch.object(media_agent, "vlc", FakeVlc):
            player = media_agent.JarvisMediaPlayer()
            try:
                self.assertEqual(
                    player.search_and_play("   "),
                    "Error: Search failure. Query cannot be empty.",
                )
            finally:
                player.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
