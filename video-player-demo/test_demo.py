import json
import os
import subprocess
import sys
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))


def test_python_compiles():
    subprocess.run([sys.executable, "-m", "py_compile", "server.py"], cwd=ROOT, check=True)


def test_health_contract():
    # Static contract test only. Live YouTube access belongs to the manual/local smoke test.
    assert os.path.exists(os.path.join(ROOT, "index.html"))
    assert os.path.exists(os.path.join(ROOT, "requirements.txt"))
    assert "yt-dlp" in open(os.path.join(ROOT, "requirements.txt"), encoding="utf-8").read()


def test_api_shape_documented():
    source = open(os.path.join(ROOT, "server.py"), encoding="utf-8").read()
    for token in ("/api/search", "ytsearch1:", "mediaUrl", "webpageUrl"):
        assert token in source
