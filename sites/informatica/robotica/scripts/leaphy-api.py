"""Schrijf src/lego-tests/leaphy-api.json: wat leaphymicropython aanbiedt.

De lessen roepen de bibliotheek aan die de online editor installeert (main van
leaphy-robotics/leaphy-micropython). Die veranderde onder de lessen door:
read_line_sensor verdween in mei 2025, en sinds augustus 2025 is een pin een
naam ("D6") en geen getal, en in november 2026 kreeg text() van het OLED-scherm
een scale. leaphy-api.test.ts toetst elke import, elke pin en elke methode met
zijn keyword-argumenten in de lessen tegen dit bestand.

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


def parameters(functie):
    """De namen die je bij een aanroep mag meegeven, zonder self; met * en ** erbij
    als de functie alles aanneemt."""
    args = functie.args
    namen = [a.arg for a in args.posonlyargs + args.args + args.kwonlyargs]
    if namen[:1] == ["self"]:
        namen = namen[1:]
    if args.vararg:
        namen.append("*")
    if args.kwarg:
        namen.append("**")
    return namen


bron, pins_csv = Path(sys.argv[1]), Path(sys.argv[2])
modules = {}
klassen = {}
for pad in sorted((bron / "leaphymicropython").rglob("*.py")):
    if pad.name == "__init__.py":
        continue
    naam = ".".join(pad.relative_to(bron).with_suffix("").parts)
    boom = ast.parse(pad.read_text())
    namen = sorted(
        knoop.name
        for knoop in boom.body
        if isinstance(knoop, (ast.FunctionDef, ast.ClassDef))
        and not knoop.name.startswith("_")
    )
    modules[naam] = namen
    for knoop in boom.body:
        if isinstance(knoop, ast.ClassDef) and not knoop.name.startswith("_"):
            klassen[f"{naam}.{knoop.name}"] = {
                "basis": [ast.unparse(b).split(".")[-1] for b in knoop.bases],
                "methoden": {
                    m.name: parameters(m)
                    for m in knoop.body
                    if isinstance(m, ast.FunctionDef)
                    and (m.name == "__init__" or not m.name.startswith("_"))
                },
            }

pinnen = {}
for regel in pins_csv.read_text().splitlines():
    if "," in regel:
        naam, gpio = regel.split(",", 1)
        pinnen[naam.strip()] = gpio.strip()

commit = subprocess.run(
    ["git", "-C", str(bron), "rev-parse", "HEAD"],
    capture_output=True,
    text=True,
    check=True,
).stdout.strip()

uit = Path(__file__).resolve().parent.parent / "src" / "lego-tests" / "leaphy-api.json"
uit.write_text(
    json.dumps(
        {"commit": commit, "modules": modules, "klassen": klassen, "pinnen": pinnen},
        indent=2,
        ensure_ascii=False,
    )
    + "\n"
)
print(
    f"{uit}: {len(modules)} modules, {len(klassen)} klassen, {len(pinnen)} pinnen, commit {commit[:7]}"
)
