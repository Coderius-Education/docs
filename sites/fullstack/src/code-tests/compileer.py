"""Compileert elk uit de docs geextraheerd Python-blok.

Puur syntactisch: namen en imports hoeven niet te bestaan, dus er is geen
server en geen fastapi nodig. Draai eerst `pnpm code:extract`.
Afsluitcode 0 als alles compileert, 1 zodra er iets misgaat.
"""

import json
import sys
from pathlib import Path

EXTRACTED = Path(__file__).resolve().parents[2] / "code-tests" / "extracted"


def main() -> int:
    index_pad = EXTRACTED / "index.json"
    if not index_pad.exists():
        print("geen code-tests/extracted/index.json - draai eerst `pnpm lego:extract`")
        return 1

    index = json.loads(index_pad.read_text())
    fouten = 0
    for item in index:
        pad = EXTRACTED / f"{item['naam']}.py"
        try:
            compile(pad.read_text(), item["naam"], "exec")
        except SyntaxError as e:
            regel = item["regel"] + (e.lineno or 1)
            print(f"{item['bron']}:{regel}: {e.msg}")
            fouten += 1

    print(f"Gecompileerd: {len(index) - fouten} van {len(index)} blokken.")
    return 1 if fouten else 0


if __name__ == "__main__":
    sys.exit(main())
