"""Phase 1 local JARVIS media smoke test.

Prerequisites:
  1. Python 3.10+
  2. pip install -r requirements.txt
  3. A native VLC/libVLC installation on PATH
  4. ffmpeg available on PATH for robust yt-dlp YouTube extraction
"""

import time

from media_agent import JarvisMediaPlayer


def wait_for_playback(player: JarvisMediaPlayer, timeout: float = 30.0) -> bool:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        status = player.get_status()
        if status.state == "playing":
            print(f"Playback confirmed: {status.title}")
            return True
        if status.state == "error":
            print(f"Playback failed: {status.detail}")
            return False
        time.sleep(0.25)
    print("Playback confirmation timed out.")
    return False


def run_smoke_test() -> None:
    print("--- JARVIS Media Service Smoke Test ---")
    player = JarvisMediaPlayer()

    if not player.vlc_available:
        print("FATAL: VLC/libVLC is unavailable on this machine.")
        return

    try:
        print("\n[Test 1/5] search_and_play...")
        result = player.search_and_play("Iron man suit up scene")
        print(f"Agent Response: {result}")
        if result.startswith("Error:") or not wait_for_playback(player):
            return

        print("Playing for 8 seconds...")
        time.sleep(8)

        print("\n[Test 2/5] control_player(pause)...")
        print(f"Agent Response: {player.control_player("pause")}")
        time.sleep(3)

        print("\n[Test 3/5] control_player(resume)...")
        print(f"Agent Response: {player.control_player("resume")}")
        time.sleep(4)

        print("\n[Test 4/5] control_player(volume, 30)...")
        print(f"Agent Response: {player.control_player("volume", volume=30)}")
        time.sleep(4)

        print("\n[Test 5/5] control_player(stop)...")
        print(f"Agent Response: {player.control_player("stop")}")
        print("\n--- Smoke Test Complete ---")
    finally:
        player.close()


if __name__ == "__main__":
    run_smoke_test()
