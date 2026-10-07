"""Compileert elk uit de docs geextraheerd Python-blok.

Puur syntactisch: namen en imports hoeven niet te bestaan, dus er is geen
board, server of library nodig. Gedeeld door robotica (MicroPython) en
fullstack (FastAPI) - voor compile() is MicroPython gewoon Python.

Aanroep vanuit de repo-root, met de map waar de extractie in schrijft:

    python3 scripts/compileer-blokken.py sites/informatica/fullstack/code-tests/extracted
    python3 scripts/compileer-blokken.py <map> --alleen changed.json

Met `--alleen changed.json` (uit de plan-job, zie scripts/alleen.py) alleen de
blokken waarvan een regel gewijzigd is (`begin`/`eind` uit index.json, de
marker erboven meegerekend). Een item zonder `eind`, zoals een editor-template
van robotica, hangt af van zijn hele bronbestand. Blokken staan op zichzelf:
er is geen keten. Verandert deze runner of de extractie, dan beslist de
planner dat alles draait.

Afsluitcode 0 als alles compileert, 1 zodra er iets misgaat.
"""

import json
import sys
from pathlib import Path

from alleen import HEEL, Selectie, lees

ROOT = Path(__file__).resolve().parent.parent


def gekozen(index: list[dict], site: Path, selectie: Selectie) -> list[dict]:
    """De items uit index.json die de wijziging raakt.

    `bron` in index.json is relatief aan de site; changed.json rekent vanaf de
    repo-root.
    """
    uit = []
    for item in index:
        pad = (site / item["bron"]).resolve()
        try:
            pad = pad.relative_to(ROOT)
        except ValueError:
            uit.append(item)  # buiten de repo: niet te beoordelen, dus doen
            continue
        if "eind" in item:
            bereik = (item.get("begin", item["regel"]), item["eind"])
        else:
            bereik = HEEL
        if selectie.raakt(pad, *bereik):
            uit.append(item)
    return uit


def compileer(extracted: Path, selectie: Selectie | None = None) -> int:
    index_pad = extracted / "index.json"
    if not index_pad.exists():
        print(f"geen {index_pad} - draai eerst de extractie van deze site")
        return 1

    index = json.loads(index_pad.read_text())
    if selectie is not None and not selectie.alles:
        alle = len(index)
        # extracted ligt in <site>/<x>-tests/extracted.
        index = gekozen(index, extracted.parent.parent, selectie)
        print(f"--alleen: {len(index)} van {alle} blokken geraakt door de wijziging:")
        for item in index:
            print(f"  blok {item['bron']}:{item['regel']}")

    fouten = 0
    for item in index:
        pad = extracted / f"{item['naam']}.py"
        try:
            compile(pad.read_text(), item["naam"], "exec")
        except SyntaxError as e:
            # item["regel"] is de regel van de ```-fence, e.lineno telt vanaf 1
            # binnen het blok, dus samen wijzen ze naar de regel in de bron.
            regel = item["regel"] + (e.lineno or 1)
            print(f"{item['bron']}:{regel}: {e.msg}")
            fouten += 1

    print(f"Gecompileerd: {len(index) - fouten} van {len(index)} blokken.")
    return 1 if fouten else 0


def main(argv: list[str]) -> int:
    rest = lees(argv[1:], "")[1]
    if len(rest) != 1:
        print(__doc__)
        return 2
    extracted = Path(rest[0]).resolve()
    # De runner heet naar zijn site (robotica, fullstack), net als in changed.json.
    selectie = lees(argv[1:], extracted.parent.parent.name)[0]
    return compileer(extracted, selectie)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
