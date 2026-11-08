"""Draait elk codeblok van robotica met de echte leaphymicropython.

compileer-blokken.py kijkt alleen of een blok geldige Python is. Deze runner
voert het ook uit: met de leaphymicropython van de commit in
`src/lego-tests/leaphy-api.json` en een nagebootst bord (scripts/leaphy_nep/)
dat de regels van MicroPython v1.28.0 volgt. Zo valt op wat pas op het bord
misging: een verkeerd aantal argumenten, een snelheid buiten 0-255, `scale=0`,
een getal waar `text()` tekst wil, een pinnaam die het bord niet kent, of
`sda_gpio_pin="A4"` (A4 loopt via de wifi-chip, en I2C weigert dat).

    pnpm --filter @coderius/robotica-docs lego:extract
    python3 scripts/draai-leaphy-blokken.py [--alleen changed.json] [--bibliotheek <map>]

Zonder --bibliotheek haalt de runner leaphymicropython zelf op (git, alleen
die ene commit) in ~/.cache/coderius.

- Een while True stopt na 200 keer sleep() of 20.000 regels: op het bord
  loopt hij door, en dat is geen fout.
- Een fragment (een losse `oled.fill(...)`) dat een NameError geeft, draait
  opnieuw met scripts/leaphy_nep/vooraf.py ervoor: de objecten zoals de lessen
  ze maken.
- `{/* niet-draaien: reden */}` boven een blok slaat het over (een bewust fout
  voorbeeld); compileren doet compileer-blokken.py dan nog wel.
- Elke run begint met een zelftest: bekende fouten moeten falen met de
  melding van het bord of de bibliotheek. Vangt het harnas ze niet meer, dan
  faalt de runner, in plaats van stil alles goed te keuren.

Afsluitcode 0 als elk blok draait, 1 zodra er iets misgaat.
"""

import argparse
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HIER = Path(__file__).resolve().parent
ROOT = HIER.parent
SITE = ROOT / "sites" / "informatica" / "robotica"
EXTRACTED = SITE / "lego-tests" / "extracted"
API = SITE / "src" / "lego-tests" / "leaphy-api.json"
NEP = HIER / "leaphy_nep"
REPO = "https://github.com/leaphy-robotics/leaphy-micropython"
NIET_DRAAIEN = "{/* niet-draaien:"

sys.path.insert(0, str(HIER))
from alleen import Selectie, lees

_spec = importlib.util.spec_from_file_location(
    "compileer", HIER / "compileer-blokken.py"
)
_compileer = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_compileer)

# Bekende fouten met de melding die een leerling dan ziet. Komt er een niet
# meer uit, dan vangt het harnas die soort fout niet meer.
ZELFTEST = [
    (
        "from leaphymicropython.actuators.oled_screen import OLEDSH1106\n"
        'oled = OLEDSH1106(channel=7, sda_gpio_pin="A4", scl_gpio_pin="A5")\n'
        'oled.fill("white")\n',
        "ValueError: expecting a regular GPIO Pin",
    ),
    (
        "from leaphymicropython.actuators.oled_screen import OLEDSH1106\n"
        'oled = OLEDSH1106(channel=7, sda_gpio_pin="D7", scl_gpio_pin="D8")\n'
        'oled.fill("white")\n',
        "ValueError: bad SCL pin",
    ),
    (
        "from leaphymicropython.actuators.oled_screen import OLEDSH1106\n"
        "oled = OLEDSH1106(channel=7)\noled.text(123, 0, 0)\n",
        "TypeError: can't convert int to str",
    ),
    (
        "from leaphymicropython.actuators.oled_screen import OLEDSH1106\n"
        'oled = OLEDSH1106(channel=7)\noled.text("hoi", 0, 0, scale=0)\n',
        "ValueError: you gave the scale 0",
    ),
    (
        "from leaphymicropython.actuators.oled_screen import OLEDSH1106\n"
        'oled = OLEDSH1106(channel=7)\noled.fill("blauw")\n',
        "ValueError: you gave the input blauw",
    ),
    (
        "from leaphymicropython.actuators.dcmotor import DCMotors\n"
        "DCMotors().motor_a.forward(300)\n",
        "ValueError: Speed must be up to and including 0 and 255",
    ),
    (
        "from leaphymicropython.actuators.dcmotor import DCMotors\n"
        'DCMotors(pwm_pin_motor_a="A6")\n',
        "ValueError: expecting a regular GPIO Pin",
    ),
    (
        'from leaphymicropython.sensors.linesensor import AnalogIR\nAnalogIR("D5", 2500)\n',
        "ValueError: Pin doesn't have ADC capabilities",
    ),
    (
        'from machine import Pin\nPin("D22", Pin.OUT)\n',
        'ValueError: unknown named pin "D22"',
    ),
    (
        "from leaphymicropython.actuators.servo import set_servo_angle\n"
        'set_servo_angle("D9", 200)\n',
        "ValueError: Speed must be up to and including 0 and 180",
    ),
    ("from leaphymicropython.actuators.dcmotor import DCMotorz\n", "ImportError"),
]


def bibliotheek(gekozen: str | None) -> Path:
    """De map met leaphymicropython op de commit uit leaphy-api.json."""
    if gekozen:
        return Path(gekozen)
    commit = json.loads(API.read_text())["commit"]
    doel = Path.home() / ".cache" / "coderius" / f"leaphy-micropython-{commit[:12]}"
    if not (doel / "leaphymicropython").exists():
        doel.mkdir(parents=True, exist_ok=True)
        git = ["git", "-C", str(doel)]
        subprocess.run([*git, "init", "-q"], check=True)
        subprocess.run([*git, "fetch", "-q", "--depth", "1", REPO, commit], check=True)
        subprocess.run([*git, "checkout", "-q", "FETCH_HEAD"], check=True)
    return doel


def draai(code_pad: Path, lib: Path, vooraf: bool = False) -> dict:
    args = [sys.executable, "-I", str(NEP / "blok.py"), str(code_pad), str(lib)]
    if vooraf:
        args.append(str(NEP / "vooraf.py"))
    env = {**os.environ, "LEAPHY_API_JSON": str(API)}
    try:
        p = subprocess.run(args, capture_output=True, text=True, timeout=60, env=env)
    except subprocess.TimeoutExpired:
        return {
            "uitkomst": "fout",
            "fout": "liep vast (60 s), ook buiten een lus van de les",
        }
    regels = p.stdout.strip().splitlines()
    if not regels:
        return {
            "uitkomst": "fout",
            "fout": f"harnas gaf geen uitkomst: {p.stderr.strip()[-300:]}",
        }
    return json.loads(regels[-1])


def met_vooraf(code_pad: Path, lib: Path) -> dict:
    """Een fragment krijgt de objecten uit vooraf.py als het een naam mist."""
    uit = draai(code_pad, lib)
    if uit["uitkomst"] == "fout" and uit.get("naam"):
        tweede = draai(code_pad, lib, vooraf=True)
        tweede["fragment"] = True
        return tweede
    return uit


def zelftest(lib: Path) -> list[str]:
    fouten = []
    with tempfile.TemporaryDirectory() as tmp:
        for i, (code, verwacht) in enumerate(ZELFTEST):
            pad = Path(tmp) / f"zelftest_{i}.py"
            pad.write_text(code)
            uit = draai(pad, lib)
            if verwacht not in (uit.get("fout") or ""):
                fouten.append(
                    f"zelftest {i}: verwacht '{verwacht}', kreeg {uit.get('fout') or uit['uitkomst']}"
                )
    return fouten


def niet_draaien(item: dict) -> bool:
    """Staat er een niet-draaien-marker tussen het vorige blok en dit blok?"""
    regels = (SITE / item["bron"]).read_text().split("\n")[: item["regel"] - 1]
    ervoor = "\n".join(regels)
    vorige = ervoor.rfind("```")
    return NIET_DRAAIEN in (ervoor if vorige == -1 else ervoor[vorige + 3 :])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--alleen", help="changed.json uit de plan-job")
    parser.add_argument(
        "--bibliotheek", help="map met een checkout van leaphy-micropython"
    )
    args = parser.parse_args()

    index_pad = EXTRACTED / "index.json"
    if not index_pad.exists():
        print(
            f"geen {index_pad} - draai eerst: pnpm --filter @coderius/robotica-docs lego:extract"
        )
        return 1
    index = json.loads(index_pad.read_text())
    if args.alleen:
        selectie = Selectie(lees(args.alleen), "robotica")
        if not selectie.alles:
            alle = len(index)
            index = _compileer.gekozen(index, SITE, selectie)
            print(
                f"--alleen: {len(index)} van {alle} blokken geraakt door de wijziging"
            )

    lib = bibliotheek(args.bibliotheek)
    fouten = zelftest(lib)
    if fouten:
        print("Het harnas vangt bekende fouten niet meer:")
        for f in fouten:
            print(f"  {f}")
        return 1
    print(f"Zelftest: {len(ZELFTEST)} bekende fouten gevangen.")

    overslaan = [item for item in index if niet_draaien(item)]
    te_draaien = [item for item in index if item not in overslaan]

    def een(item):
        return item, met_vooraf(EXTRACTED / f"{item['naam']}.py", lib)

    with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as pool:
        uitkomsten = list(pool.map(een, te_draaien))

    fout = 0
    tellers = {"klaar": 0, "lus": 0, "fragment": 0}
    for item, uit in uitkomsten:
        waar = f"{item['bron']}:{item['regel']}"
        if uit["uitkomst"] == "fout":
            regel = uit.get("regel")
            plek = f"{item['bron']}:{item['regel'] + regel}" if regel else waar
            extra = (
                " (ook met scripts/leaphy_nep/vooraf.py ervoor)"
                if uit.get("fragment")
                else ""
            )
            print(f"{plek}: {uit['fout']}{extra}")
            fout += 1
            continue
        for w in uit.get("waarschuwingen", []):
            print(f"{waar}: de bibliotheek waarschuwt: {w}")
            fout += 1
        tellers["fragment" if uit.get("fragment") else uit["uitkomst"]] += 1
    print(
        f"Gedraaid: {len(te_draaien)} blokken ({tellers['klaar']} klaar, {tellers['lus']} in een lus,"
        f" {tellers['fragment']} fragmenten met vooraf.py), {len(overslaan)} met niet-draaien"
        f" overgeslagen, {fout} fout(en)."
    )
    return 1 if fout else 0


if __name__ == "__main__":
    sys.exit(main())
