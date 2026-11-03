"""Schrijf src/lego-tests/leaphy-api.json: wat leaphymicropython aanbiedt.

De lessen roepen de bibliotheek aan die de online editor installeert (main van
leaphy-robotics/leaphy-micropython). Die veranderde onder de lessen door:
read_line_sensor verdween in mei 2025, en sinds augustus 2025 is een pin een
naam ("D6") en geen getal. leaphy-api.test.ts toetst elke import en elke pin in
de lessen tegen dit bestand.

Gebruik, na een nieuwe versie van de bibliotheek:

    git clone --depth 1 https://github.com/leaphy-robotics/leaphy-micropython /tmp/lmp
    curl -o /tmp/pins.csv https://raw.githubusercontent.com/micropython/micropython/master/ports/rp2/boards/ARDUINO_NANO_RP2040_CONNECT/pins.csv
    python3 scripts/leaphy-api.py /tmp/lmp /tmp/pins.csv
"""

import ast
import json
import subprocess
import sys
from pathlib import Path

bron, pins_csv = Path(sys.argv[1]), Path(sys.argv[2])
modules = {}
for pad in sorted((bron / "leaphymicropython").rglob("*.py")):
    if pad.name == "__init__.py":
        continue
    naam = ".".join(pad.relative_to(bron).with_suffix("").parts)
    boom = ast.parse(pad.read_text())
    namen = sorted(
        knoop.name
        for knoop in boom.body
        if isinstance(knoop, (ast.FunctionDef, ast.ClassDef)) and not knoop.name.startswith("_")
    )
    modules[naam] = namen

pinnen = {}
for regel in pins_csv.read_text().splitlines():
    if "," in regel:
        naam, gpio = regel.split(",", 1)
        pinnen[naam.strip()] = gpio.strip()

commit = subprocess.run(
    ["git", "-C", str(bron), "rev-parse", "HEAD"], capture_output=True, text=True, check=True
).stdout.strip()

uit = Path(__file__).resolve().parent.parent / "src" / "lego-tests" / "leaphy-api.json"
uit.write_text(
    json.dumps({"commit": commit, "modules": modules, "pinnen": pinnen}, indent=2, ensure_ascii=False)
    + "\n"
)
print(f"{uit}: {len(modules)} modules, {len(pinnen)} pinnen, commit {commit[:7]}")
