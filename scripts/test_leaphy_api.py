"""Test voor sites/informatica/robotica/scripts/leaphy-api.py.

Dat script maakt leaphy-api.json opnieuw bij een nieuwe versie van
leaphymicropython. Eerst schreef het json.dumps met indent=2, en dat keurt
`biome check` in CI af: wie het bestand bijwerkte, kreeg een rode lint en een
diff van honderden regels die alleen over opmaak ging. Deze test draait het
script op een kleine nagemaakte bibliotheek en eist dat de uitvoer al is zoals
biome hem wil, en dat de standaardwaarden erin staan.

    python3 -m unittest discover -s scripts -p 'test_*.py'
"""

import json
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "sites" / "informatica" / "robotica" / "scripts" / "leaphy-api.py"
CANONIEK = "sites/informatica/robotica/src/lego-tests/leaphy-api.json"

DCMOTOR = textwrap.dedent(
    '''
    class DCMotors:
        def __init__(self, dir_pin_motor_a="D2", pwm_pin_motor_a="D3"):
            pass

        def stop(self):
            pass
    '''
)


class LeaphyApi(unittest.TestCase):
    def test_uitvoer_is_al_opgemaakt_zoals_biome_hem_wil(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            lib = tmp / "lib"
            pakket = lib / "leaphymicropython" / "actuators"
            pakket.mkdir(parents=True)
            (pakket / "dcmotor.py").write_text(DCMOTOR)
            git = ["git", "-C", str(lib), "-c", "user.name=t", "-c", "user.email=t@t"]
            subprocess.run([*git, "init", "-q"], check=True)
            subprocess.run([*git, "add", "."], check=True)
            subprocess.run([*git, "commit", "-q", "-m", "x"], check=True)
            pins = tmp / "pins.csv"
            pins.write_text("D2,GPIO25\nD3,GPIO15\nSDA,GPIO12\n")
            uit = tmp / "leaphy-api.json"

            subprocess.run(
                [sys.executable, str(SCRIPT), str(lib), str(pins), str(uit)],
                check=True,
                capture_output=True,
            )
            tekst = uit.read_text()
            opnieuw = subprocess.run(
                ["pnpm", "exec", "biome", "format", f"--stdin-file-path={CANONIEK}"],
                input=tekst,
                capture_output=True,
                text=True,
                cwd=ROOT,
                check=True,
            ).stdout

        self.assertEqual(tekst, opnieuw)
        klasse = json.loads(tekst)["klassen"]["leaphymicropython.actuators.dcmotor.DCMotors"]
        self.assertEqual(klasse["standaard"], {"dir_pin_motor_a": "D2", "pwm_pin_motor_a": "D3"})


if __name__ == "__main__":
    unittest.main()
