"""Tests voor `draai-play-blokken.py --pins` bij een wheel met build-tag.

Een wheel uit de play-repo heet coderius_play-3.5.0-0master7a7db94-…: de
build-tag staat in de bestandsnaam, niet in de naam van de dist-info. Leidde
`pins()` de dist-info af uit de bestandsnaam, dan vond hij geen METADATA en
stopte de job `blokken` voordat er één blok draaide. Na de release staat er
weer een wheel zonder build-tag, en dan hield niets in CI dit nog vast.

    python3 -m unittest discover -s scripts -p 'test_*.py'
"""

import importlib.util
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

METADATA = """\
Metadata-Version: 2.4
Name: coderius-play
Version: 3.5.0
Requires-Dist: numpy==2.2.6; python_version < "3.14" and sys_platform != "emscripten"
Requires-Dist: numpy; sys_platform == "emscripten"
Requires-Dist: pygame-ce==2.5.8; sys_platform != "emscripten"
Requires-Dist: pymunk==7.3.1
"""


def laad(naam: str, bestand: str):
    spec = importlib.util.spec_from_file_location(naam, HIER / bestand)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TestPins(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mod = laad("draai_play_blokken_pins", "draai-play-blokken.py")
        cls.tmp = tempfile.TemporaryDirectory()

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def pins_van(self, bestandsnaam: str) -> dict[str, str]:
        wheel = Path(self.tmp.name) / bestandsnaam
        with zipfile.ZipFile(wheel, "w") as zf:
            zf.writestr("play/__init__.py", "")
            zf.writestr("coderius_play-3.5.0.dist-info/METADATA", METADATA)
        origineel = self.mod.wheel_pad
        self.mod.wheel_pad = lambda: wheel
        try:
            return self.mod.pins()
        finally:
            self.mod.wheel_pad = origineel

    def test_wheel_met_build_tag(self):
        pins = self.pins_van("coderius_play-3.5.0-0master7a7db94-py3-none-any.whl")
        self.assertEqual(pins["pymunk"], "7.3.1")
        self.assertEqual(pins["pygame-ce"], "2.5.8")

    def test_wheel_zonder_build_tag(self):
        pins = self.pins_van("coderius_play-3.5.0-py3-none-any.whl")
        self.assertEqual(pins["pymunk"], "7.3.1")


if __name__ == "__main__":
    unittest.main()
