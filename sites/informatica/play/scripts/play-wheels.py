#!/usr/bin/env python3
"""De wheels van de speeltuin: coderius-play en de pymunk-wheel voor Pyodide.

De speeltuin draait niet op PyPI maar op static/whl/. Er zijn twee manieren
om die te vullen:

    python3 scripts/play-wheels.py --map ../play   # bouw uit een checkout van de play-repo
    python3 scripts/play-wheels.py --pypi 3.5.0    # na de release: de wheel van PyPI

Een build uit een checkout krijgt een build-tag met branch en commit in de
bestandsnaam (coderius_play-3.5.0-0main7a7db94-py3-none-any.whl). De service
worker cachet wheels op bestandsnaam, "cache first" (src/sw.js). Had de
branch-build dezelfde naam als de latere release, dan bleef een leerling na de
release de branch-build uit zijn cache krijgen.

Daarna haalt het script de pymunk-wheel die de play-wheel pint, voor dezelfde
Pyodide-ABI als de huidige PYMUNK_WHEEL in engine.js, zet beide namen in
engine.js en schrijft waar ze vandaan komen in wheels-herkomst.json.
src/api-tests/wheels.test.ts legt die herkomst naast de bestanden.
"""

import argparse
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
WHL = SITE / "static" / "whl"
ENGINE = SITE / "src" / "components" / "CodeRunner" / "engine.js"
HERKOMST = SITE / "src" / "components" / "CodeRunner" / "wheels-herkomst.json"


def fout(tekst: str) -> None:
    sys.exit(f"play-wheels: {tekst}")


def sha256(pad: Path) -> str:
    return hashlib.sha256(pad.read_bytes()).hexdigest()


def pypi_wheel(project: str, versie: str, bestandsnaam: str, doel: Path) -> Path:
    """Download één wheel van PyPI en controleer hem tegen de sha256 die PyPI opgeeft."""
    with urllib.request.urlopen(f"https://pypi.org/pypi/{project}/{versie}/json") as antwoord:
        info = json.load(antwoord)
    for bestand in info["urls"]:
        if bestand["filename"] == bestandsnaam:
            pad = doel / bestandsnaam
            urllib.request.urlretrieve(bestand["url"], pad)
            if sha256(pad) != bestand["digests"]["sha256"]:
                fout(f"{bestandsnaam}: sha256 klopt niet met PyPI")
            return pad
    fout(f"{project} {versie} heeft geen {bestandsnaam} op PyPI")
    raise AssertionError


def metadata(wheel: Path) -> str:
    with zipfile.ZipFile(wheel) as zf:
        naam = next(n for n in zf.namelist() if n.endswith(".dist-info/METADATA"))
        return zf.read(naam).decode()


def uit_map(map_: Path, doel: Path) -> tuple[Path, str]:
    """Bouw de play-wheel uit een schone checkout en zet branch en commit in de build-tag."""
    git = lambda *a: subprocess.run(
        ["git", "-C", str(map_), *a], check=True, capture_output=True, text=True
    ).stdout.strip()
    if git("status", "--porcelain"):
        fout(f"{map_} heeft niet-gecommitte wijzigingen; bouw alleen uit een commit")
    commit = git("rev-parse", "--short", "HEAD")
    branch = git("rev-parse", "--abbrev-ref", "HEAD")
    bouw = doel / "bouw"
    subprocess.run(
        [sys.executable, "-m", "pip", "wheel", "--no-deps", "--quiet", "-w", str(bouw), str(map_)],
        check=True,
    )
    (wheel,) = bouw.glob("coderius_play-*-py3-none-any.whl")
    versie = wheel.name.split("-")[1]
    # Een build-tag begint met een cijfer en bevat geen streepje.
    tag = "0" + re.sub(r"[^A-Za-z0-9]", "", branch) + commit
    naam = f"coderius_play-{versie}-{tag}-py3-none-any.whl"
    return wheel.rename(doel / naam), f"Coderius-Education/play {branch} @ {commit}"


def zet_in_engine(constante: str, bestand: str) -> None:
    engine = ENGINE.read_text()
    nieuw, n = re.subn(
        rf"^const {constante} = '/whl/[^']+';$",
        f"const {constante} = '/whl/{bestand}';",
        engine,
        flags=re.M,
    )
    if n != 1:
        fout(f"{constante} niet precies één keer gevonden in engine.js")
    ENGINE.write_text(nieuw)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    bron = parser.add_mutually_exclusive_group(required=True)
    bron.add_argument("--map", type=Path, help="een checkout van de play-repo")
    bron.add_argument("--pypi", metavar="VERSIE", help="een uitgebrachte versie van PyPI")
    args = parser.parse_args()

    huidige_pymunk = re.search(r"PYMUNK_WHEEL = '/whl/([^']+)'", ENGINE.read_text())
    if not huidige_pymunk:
        fout("PYMUNK_WHEEL niet gevonden in engine.js")
    # pymunk-7.3.0-cp313-cp313-pyemscripten_2025_0_wasm32.whl: alles na de
    # versie zijn de tags van de Pyodide in engine.js, en die blijven gelijk.
    pymunk_tags = huidige_pymunk.group(1).split("-", 2)[2]

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        if args.map:
            play, play_bron = uit_map(args.map.resolve(), tmp)
        else:
            naam = f"coderius_play-{args.pypi}-py3-none-any.whl"
            play, play_bron = pypi_wheel("coderius-play", args.pypi, naam, tmp), "pypi"

        meta = metadata(play)
        versie = re.search(r"^Version: (\S+)$", meta, re.M).group(1)
        pin = re.search(r"^Requires-Dist: pymunk==([\d.]+)", meta, re.M)
        if not pin:
            fout(f"{play.name} pint pymunk niet exact; de speeltuin heeft een vaste versie nodig")
        pymunk_naam = f"pymunk-{pin.group(1)}-{pymunk_tags}"
        pymunk = pypi_wheel("pymunk", pin.group(1), pymunk_naam, tmp)

        for oud in [*WHL.glob("coderius_play-*.whl"), *WHL.glob("pymunk-*.whl")]:
            oud.unlink()
        for wheel in (play, pymunk):
            (WHL / wheel.name).write_bytes(wheel.read_bytes())

    zet_in_engine("PLAY_WHEEL", play.name)
    zet_in_engine("PYMUNK_WHEEL", pymunk.name)
    herkomst = {
        "coderius_play": {
            "bestand": play.name,
            "versie": versie,
            "bron": play_bron,
            "sha256": sha256(WHL / play.name),
        },
        "pymunk": {
            "bestand": pymunk.name,
            "versie": pin.group(1),
            "bron": "pypi",
            "sha256": sha256(WHL / pymunk.name),
        },
    }
    HERKOMST.write_text(json.dumps(herkomst, indent=2, ensure_ascii=False) + "\n")

    print(f"{play.name}  ({play_bron})")
    print(f"{pymunk.name}  (pypi)")
    print(
        "\nLees de diff van de play-repo vóór je dit commit: een andere standaardwaarde "
        "of een verdwenen waarschuwing maakt lesstof stilzwijgend onjuist (zie CLAUDE.md)."
    )


if __name__ == "__main__":
    main()
