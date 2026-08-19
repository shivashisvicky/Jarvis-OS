import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))


def test_python_compiles():
    subprocess.run([sys.executable, "-m", "py_compile", "server.py"], cwd=ROOT, check=True)


def test_health_contract():
    assert os.path.exists(os.path.join(ROOT, "index.html"))
    assert os.path.exists(os.path.join(ROOT, "requirements.txt"))


def test_api_shape_documented():
    source = open(os.path.join(ROOT, "server.py"), encoding="utf-8").read()
    for token in ("/api/search", "embedUrl", "webpageUrl", "VIDEO_ID_RE"):
        assert token in source
    assert "ytsearch1:" not in source
    assert "mediaUrl" not in source
