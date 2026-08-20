import os
import subprocess
import sys
import unittest

ROOT = os.path.dirname(os.path.abspath(__file__))


class VideoDemoContractTests(unittest.TestCase):
    def test_python_compiles(self):
        subprocess.run([sys.executable, "-m", "py_compile", "server.py"], cwd=ROOT, check=True)

    def test_health_contract(self):
        self.assertTrue(os.path.exists(os.path.join(ROOT, "index.html")))
        self.assertTrue(os.path.exists(os.path.join(ROOT, "requirements.txt")))

    def test_api_shape_documented(self):
        with open(os.path.join(ROOT, "server.py"), encoding="utf-8") as handle:
            source = handle.read()
        for token in ("/api/search", "embedUrl", "webpageUrl", "VIDEO_ID_RE"):
            self.assertIn(token, source)
        self.assertNotIn("ytsearch1:", source)
        self.assertNotIn("mediaUrl", source)


if __name__ == "__main__":
    unittest.main(verbosity=2)
