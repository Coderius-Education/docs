"""Voert elk codeblok uit de python-cursus uit en controleert de beloofde uitvoer.

Anders dan bij play en de andere cursussen kan de controle hier verder gaan dan
"het crasht niet". Deze lessen zeggen namelijk wát er op het scherm komt, op
twee manieren, en allebei zijn ze machinaal na te lopen:

    print(len(tekst))   # 12          een belofte achter de print-regel

    ```python                          een uitvoerblok direct onder de code
    print("Hallo!")
    ```

    Uitvoer:

    ```
    Hallo!
    ```

Dat verschil doet ertoe. Een blok dat draait maar iets anders print dan de les
belooft, is voor een leerling verwarrender dan een blok dat omvalt: hij ziet een
ander getal dan er staat en denkt dat híj iets fout doet. Zo stond er in de les
over `len()` jarenlang `# 11 (inclusief de spatie)` bij een string van twaalf
tekens.

Beloftes met een toelichting erachter — `# 14  (eerst 3 * 4)` — worden op de
waarde vergeleken; wat tussen haakjes staat is uitleg voor de lezer. Staat er
alleen iets tussen haakjes, dan is dat de waarde zelf (een tuple) en telt het
hele commentaar.

Een uitvoerblok dat op een foutmelding eindigt hoort bij code die juist stuk
moet gaan: dan wordt stderr vergeleken en is een exitcode van nul de fout.

Markers, direct boven het blok, net als in de play-cursus:

    {/* niet-draaien: reden */}       wel compileren, niet uitvoeren
                                      (fragment dat op een eerder blok leunt,
                                      of code die expres omvalt)
    {/* niet-compileren: reden */}    helemaal overslaan (bewuste syntaxfout)
    {/* uitvoer-varieert: reden */}   wel draaien, de beloofde uitvoer niet
                                      vergelijken (een set heeft geen volgorde)

Aanroep vanuit de repo-root:

    python3 scripts/draai-python-blokken.py

Afsluitcode 0 als alles slaagt, 1 zodra er iets misgaat.
"""

import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "sites" / "python" / "docs"

# In documentvolgorde, zodat een uitvoerblok bij het blok ervóór hoort.
BLOK_RE = re.compile(
    r"(?P<py>^```python[^\n]*\n(?P<pycode>.*?)^```)"
    r"|(?P<kaal>^```\n(?P<kaalcode>.*?)^```)"
    r"|(?P<oef><CodeExercise>\{`(?P<oefcode>.*?)`\}</CodeExercise>)",
    re.S | re.M,
)
NIET_DRAAIEN_RE = re.compile(r"\{/\*\s*niet-draaien:.*?\*/\}\s*$")
NIET_COMPILEREN_RE = re.compile(r"\{/\*\s*niet-compileren:.*?\*/\}\s*$")
# Sommige uitvoer ligt niet vast: een set heeft geen volgorde, dus het getoonde
# resultaat is een voorbeeld en geen belofte. Zo'n blok draait wel gewoon.
VARIEERT_RE = re.compile(r"\{/\*\s*uitvoer-varieert:.*?\*/\}\s*$")

# Alleen een commentaar achter een print() op dezelfde regel telt als belofte.
BELOFTE_RE = re.compile(r"^\s*print\(.*\)\s+#\s*(.+?)\s*$")
# Een uitvoerblok dat hierop eindigt hoort bij code die moet omvallen.
FOUT_RE = re.compile(r"^[A-Z]\w*(Error|Exception):")

TIJDSLIMIET = 30


def inspring_weg(code: str) -> str:
    regels = code.lstrip("\n").rstrip().split("\n")
    inspringen = [len(r) - len(r.lstrip()) for r in regels if r.strip()]
    n = min(inspringen) if inspringen else 0
    return "\n".join(r[n:] for r in regels)


def waarde_van(belofte: str) -> str:
    """De kale waarde uit een belofte, zonder toelichting tussen haakjes.

    De spatie vóór het haakje is wat een toelichting onderscheidt van een
    waarde: `14  (eerst 3 * 4)` is een getal met uitleg, maar `set()` en
    `(1, 2)` zijn zelf de uitvoer.
    """
    zonder = re.sub(r"\s+\(.*\)$", "", belofte).strip()
    return zonder or belofte


def verzamel():
    """Alle blokken: (bron, regel, code, soort, verwacht)."""
    blokken = []
    for pad in sorted(DOCS.rglob("*.mdx")) + sorted(DOCS.rglob("*.md")):
        tekst = pad.read_text()
        bron = pad.relative_to(ROOT)
        vorige = None  # laatst geziene python-blok, kandidaat voor een uitvoerblok

        for m in BLOK_RE.finditer(tekst):
            if m.group("kaal") is not None:
                # Een kale fence vlak onder een python-blok is zijn uitvoer.
                # Twee dingen verbreken die band: te veel tekst ertussen, en een
                # kopje. Onder "## Er gaat iets mis" hoort de foutmelding juist
                # bij het blok dat erna komt.
                tussen = tekst[vorige[0] : m.start()] if vorige is not None else ""
                if vorige is not None and len(tussen.strip()) <= 40 and "#" not in tussen:
                    rij = blokken[vorige[1]]
                    blokken[vorige[1]] = rij[:4] + (inspring_weg(m.group("kaalcode")), rij[5])
                vorige = None
                continue

            code = m.group("pycode") if m.group("py") is not None else m.group("oefcode")
            regel = tekst[: m.start()].count("\n") + 1
            ervoor = tekst[: m.start()].rstrip()
            if NIET_COMPILEREN_RE.search(ervoor):
                vorige = None
                continue
            soort = "compileer" if NIET_DRAAIEN_RE.search(ervoor) else "draai"
            varieert = bool(VARIEERT_RE.search(ervoor))
            blokken.append((bron, regel, inspring_weg(code), soort, None, varieert))
            vorige = (m.end(), len(blokken) - 1) if m.group("py") is not None else None
    return blokken


def compileer(bron, regel, code) -> str | None:
    try:
        compile(code, str(bron), "exec")
        return None
    except SyntaxError as e:
        return f"{bron}:{regel + (e.lineno or 1)}: {e.msg}"


def draai(bron, regel, code, verwacht, varieert=False) -> str | None:
    fout = compileer(bron, regel, code)
    if fout:
        return fout

    try:
        r = subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True,
            text=True,
            timeout=TIJDSLIMIET,
        )
    except subprocess.TimeoutExpired:
        return f"{bron}:{regel}: blok draait na {TIJDSLIMIET}s nog — een lus zonder eind?"

    laatste_fout = next(
        (x.strip() for x in reversed(r.stderr.strip().splitlines()) if x.strip()), ""
    )

    if varieert:
        verwacht = None

    if verwacht is not None and FOUT_RE.match(verwacht.strip().splitlines()[-1].strip()):
        # De les belooft een foutmelding; dan hoort het blok juist om te vallen.
        verwachte_fout = verwacht.strip().splitlines()[-1].strip()
        if r.returncode == 0:
            return f"{bron}:{regel}: belooft {verwachte_fout!r}, maar het blok draait gewoon"
        if laatste_fout != verwachte_fout:
            return f"{bron}:{regel}: belooft {verwachte_fout!r}, geeft {laatste_fout!r}"
        return None

    if r.returncode != 0:
        return f"{bron}:{regel}: {laatste_fout or f'exitcode {r.returncode}'}"

    uit = r.stdout.rstrip("\n")

    if verwacht is not None and uit != verwacht:
        return f"{bron}:{regel}: uitvoerblok belooft {verwacht!r}, geeft {uit!r}"

    beloftes = [BELOFTE_RE.match(x).group(1) for x in code.split("\n") if BELOFTE_RE.match(x)]
    if beloftes and not varieert:
        regels = uit.split("\n") if uit else []
        # Alleen vergelijken als elke print precies één regel opleverde; anders
        # weet je niet welke belofte bij welke regel hoort.
        if len(regels) == len(beloftes):
            for echt, belofte in zip(regels, beloftes):
                if echt != waarde_van(belofte):
                    return (
                        f"{bron}:{regel}: belooft {waarde_van(belofte)!r}, geeft {echt!r}"
                    )
    return None


def main() -> int:
    blokken = verzamel()
    te_draaien = [b for b in blokken if b[3] == "draai"]
    te_compileren = [b for b in blokken if b[3] == "compileer"]
    met_belofte = sum(
        1
        for b in te_draaien
        if not b[5]
        and (b[4] is not None or any(BELOFTE_RE.match(x) for x in b[2].split("\n")))
    )

    fouten = [f for b in te_compileren if (f := compileer(b[0], b[1], b[2]))]
    with ThreadPoolExecutor(max_workers=8) as pool:
        resultaten = pool.map(lambda b: draai(b[0], b[1], b[2], b[4], b[5]), te_draaien)
        fouten += [f for f in resultaten if f]

    for fout in fouten:
        print(fout)
    print(
        f"Uitgevoerd: {len(te_draaien)} blokken, waarvan {met_belofte} met een "
        f"beloofde uitvoer; gecompileerd: {len(te_compileren)} — {len(fouten)} fouten."
    )
    return 1 if fouten else 0


if __name__ == "__main__":
    sys.exit(main())
