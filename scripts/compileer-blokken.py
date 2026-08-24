"""Compileert elk uit de docs geextraheerd Python-blok.

Puur syntactisch: namen en imports hoeven niet te bestaan, dus er is geen
board, server of library nodig. Gedeeld door robotica (MicroPython) en
fullstack (FastAPI) - voor compile() is MicroPython gewoon Python.

Aanroep vanuit de repo-root, met de map waar de extractie in schrijft:

    python3 scripts/compileer-blokken.py sites/fullstack/code-tests/extracted

Afsluitcode 0 als alles compileert, 1 zodra er iets misgaat.
"""

import json
import sys
from pathlib import Path


def compileer(extracted: Path) -> int:
    index_pad = extracted / "index.json"
    if not index_pad.exists():
        print(f"geen {index_pad} - draai eerst de extractie van deze site")
        return 1

    index = json.loads(index_pad.read_text())
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
    if len(argv) != 2:
        print(__doc__)
        return 2
    return compileer(Path(argv[1]).resolve())


if __name__ == "__main__":
    sys.exit(main(sys.argv))
