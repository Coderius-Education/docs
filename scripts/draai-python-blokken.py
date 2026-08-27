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

Datzelfde geldt voor de foutmeldingen die los in de tekst staan, onder "## Er
gaat iets mis" of in een antwoord-`<details>`. Die horen bij code die de leerling
zélf heeft (een aanroep, een bestand dat hij maakte), dus ze staan niet naast een
draaibaar blok. Toch is het een letterlijke belofte over wat Python zegt, en juist
die tekst verschuift: `UnboundLocalError` heet sinds 3.11 anders dan daarvoor, en
de les die dat uitlegt zou het als eerste merken. Daarom wijst elke losse
foutmelding aan waaruit hij te reproduceren is:

    {/* foutmelding-van: blok-erboven */}   het python-blok hierboven draaien
    {/* foutmelding-van: fout-helft */}     de `# FOUT`-helft van het blok
                                            hieronder; de `# GOED`-helft moet
                                            dan juist schoon draaien
    {/* foutmelding-van: import rekenen */} een eigen reproductie op één regel

De reproductie draait in een lege map, zodat een regel als
`open("random.py", "w").close(); import random` kan laten zien wat er gebeurt als
een eigen bestand een module overschaduwt. Kan een melding echt niet gereproduceerd
worden, dan zegt `{/* foutmelding-los: reden */}` dat met reden — zonder marker
valt de controle om, want een foutmelding zonder reproductie is precies wat hier
stilletjes veroudert.

Zet je er een … achter, dan telt alleen de kop ervoor. Dat is voor de meldingen
waar Python iets achteraan plakt dat bij niemand gelijk is: bij een module die
je eigen bestand overschaduwt noemt 3.13 het volledige pad van dat bestand.

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
import tempfile
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
# Een losse foutmelding wijst aan waaruit hij te reproduceren is; zonder zo'n
# marker staat er een belofte over Python die niemand nakijkt.
# Zonder re.S: `.` mag geen regels overspringen, anders rekt `(.+?)` zich uit tot
# de láátste marker in het bestand en krijgt het tweede blok de waarde van het
# eerste. Dat is ook waarom de markers hierboven geen re.S hebben.
VAN_RE = re.compile(r"\{/\*\s*foutmelding-van:\s*(.+?)\s*\*/\}\s*$")
LOS_RE = re.compile(r"\{/\*\s*foutmelding-los:.*?\*/\}\s*$")

TIJDSLIMIET = 30

# De speeltuin op de site draait Pyodide 0.29.4, en dat is CPython 3.13. Dáár
# leest een leerling zijn foutmelding, dus die versie bepaalt of een citaat klopt.
# De bewoording verschilt per versie — 3.12 raadt bij een NameError welke module
# je vergat, 3.13 noemt bij een overschaduwde module het pad van je bestand — dus
# op een oudere Python wordt de tekst niet vergeleken in plaats van ten onrechte
# afgekeurd. De job draait op 3.13; daar telt hij wel.
PYTHON_VAN_DE_SITE = (3, 13)
OORDEELT_OVER_TEKST = sys.version_info[:2] == PYTHON_VAN_DE_SITE


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


def helften(code: str) -> tuple[str, str | None]:
    """Splitst een `# FOUT` / `# GOED`-blok uit §8 in zijn twee helften."""
    regels = code.split("\n")
    grens = next((i for i, r in enumerate(regels) if r.strip() == "# GOED"), None)
    if grens is None:
        return code, None
    fout = "\n".join(r for r in regels[:grens] if r.strip() != "# FOUT")
    return fout.strip("\n"), "\n".join(regels[grens + 1 :]).strip("\n")


def melding_van(kaalcode: str) -> str | None:
    """De foutmelding waarop een uitvoerblok eindigt, als het er een is."""
    regels = [r.strip() for r in kaalcode.strip().splitlines() if r.strip()]
    return regels[-1] if regels and FOUT_RE.match(regels[-1]) else None


def verzamel():
    """(blokken, claims) — blokken zijn (bron, regel, code, soort, verwacht, varieert)."""
    blokken, claims = [], []
    for pad in sorted(DOCS.rglob("*.mdx")) + sorted(DOCS.rglob("*.md")):
        tekst = pad.read_text()
        bron = pad.relative_to(ROOT)
        vorige = None  # laatst geziene python-blok, kandidaat voor een uitvoerblok
        laatste_py = None  # ook als de band met een uitvoerblok al verbroken is

        for m in BLOK_RE.finditer(tekst):
            if m.group("kaal") is not None:
                # Een kale fence vlak onder een python-blok is zijn uitvoer.
                # Twee dingen verbreken die band: te veel tekst ertussen, en een
                # kopje. Onder "## Er gaat iets mis" hoort de foutmelding juist
                # bij het blok dat erna komt.
                tussen = tekst[vorige[0] : m.start()] if vorige is not None else ""
                gepaard = vorige is not None and len(tussen.strip()) <= 40 and "#" not in tussen
                if gepaard:
                    rij = blokken[vorige[1]]
                    blokken[vorige[1]] = rij[:4] + (inspring_weg(m.group("kaalcode")), rij[5])
                melding = melding_van(m.group("kaalcode"))
                if melding and not gepaard:
                    ervoor = tekst[: m.start()].rstrip()
                    van = VAN_RE.search(ervoor)
                    claims.append(
                        (
                            bron,
                            tekst[: m.start()].count("\n") + 1,
                            melding,
                            van.group(1) if van else None,
                            bool(LOS_RE.search(ervoor)),
                            laatste_py,
                            volgend_blok(tekst, m.end()),
                        )
                    )
                vorige = None
                continue

            code = m.group("pycode") if m.group("py") is not None else m.group("oefcode")
            regel = tekst[: m.start()].count("\n") + 1
            ervoor = tekst[: m.start()].rstrip()
            if m.group("py") is not None:
                laatste_py = inspring_weg(code)
            if NIET_COMPILEREN_RE.search(ervoor):
                vorige = None
                continue
            soort = "compileer" if NIET_DRAAIEN_RE.search(ervoor) else "draai"
            varieert = bool(VARIEERT_RE.search(ervoor))
            blokken.append((bron, regel, inspring_weg(code), soort, None, varieert))
            vorige = (m.end(), len(blokken) - 1) if m.group("py") is not None else None
    return blokken, claims


def volgend_blok(tekst: str, vanaf: int) -> str | None:
    """De code van het eerstvolgende ```python-blok, voor `fout-helft`."""
    m = re.search(r"^```python[^\n]*\n(.*?)^```", tekst[vanaf:], re.S | re.M)
    return inspring_weg(m.group(1)) if m else None


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


def los_fragment(code: str) -> tuple[int, str]:
    """Draait een fragment in een lege map; geeft (exitcode, laatste stderr-regel).

    De lege map doet er wel degelijk toe: `import rekenen` hoort te falen omdat
    dat bestand er niet is, en een reproductie die zelf een `random.py` neerzet
    moet dat niet in de repo doen.
    """
    with tempfile.TemporaryDirectory() as werkmap:
        try:
            r = subprocess.run(
                [sys.executable, "-c", code],
                capture_output=True,
                text=True,
                timeout=TIJDSLIMIET,
                cwd=werkmap,
            )
        except subprocess.TimeoutExpired:
            return -1, f"draait na {TIJDSLIMIET}s nog"
    laatste = next((x.strip() for x in reversed(r.stderr.strip().splitlines()) if x.strip()), "")
    return r.returncode, laatste


def controleer_claim(claim) -> str | None:
    bron, regel, melding, hoe, los, erboven, eronder = claim
    plek = f"{bron}:{regel}"

    if los:
        return None
    if hoe is None:
        return (
            f"{plek}: {melding!r} staat er als belofte over Python, maar niets "
            f"reproduceert hem — zet {{/* foutmelding-van: … */}} boven het blok"
        )

    goed = None
    if hoe == "blok-erboven":
        if erboven is None:
            return f"{plek}: 'blok-erboven', maar er staat geen python-blok boven"
        code = erboven
    elif hoe == "fout-helft":
        if eronder is None:
            return f"{plek}: 'fout-helft', maar er volgt geen python-blok"
        code, goed = helften(eronder)
        if goed is None:
            return f"{plek}: 'fout-helft', maar het blok eronder heeft geen '# GOED'"
    else:
        code = hoe

    exitcode, gegeven = los_fragment(code)
    if exitcode == 0:
        return f"{plek}: belooft {melding!r}, maar de reproductie draait gewoon door"
    # Een melding die op … eindigt citeert alleen de vaste kop. Dat is nodig als
    # Python er iets machine-eigens achter zet — bij een overschaduwde module
    # noemt 3.13 het volledige pad van je bestand, en dat is bij niemand gelijk.
    if not OORDEELT_OVER_TEKST:
        pass
    elif melding.endswith("…"):
        if not gegeven.startswith(melding[:-1].rstrip()):
            return f"{plek}: belooft {melding!r}, geeft {gegeven!r}"
    elif gegeven != melding:
        return f"{plek}: belooft {melding!r}, geeft {gegeven!r}"

    if goed is not None:
        exitcode, gegeven = los_fragment(goed)
        if exitcode != 0:
            return f"{plek}: de '# GOED'-helft hoort te werken, maar geeft {gegeven!r}"
    return None


def main() -> int:
    blokken, claims = verzamel()
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
        fouten += [f for f in pool.map(controleer_claim, claims) if f]

    for fout in fouten:
        print(fout)
    print(
        f"Uitgevoerd: {len(te_draaien)} blokken, waarvan {met_belofte} met een "
        f"beloofde uitvoer; gecompileerd: {len(te_compileren)}; "
        f"losse foutmeldingen gereproduceerd: {len([c for c in claims if not c[4]])}"
        f"{'' if OORDEELT_OVER_TEKST else ' (tekst niet vergeleken, zie hieronder)'} "
        f"— {len(fouten)} fouten."
    )
    if not OORDEELT_OVER_TEKST:
        nu = ".".join(str(x) for x in sys.version_info[:2])
        mikt = ".".join(str(x) for x in PYTHON_VAN_DE_SITE)
        print(
            f"\nJe draait Python {nu}; de speeltuin op de site draait {mikt}. De "
            f"foutmeldingen zijn wel gereproduceerd, maar hun tekst is niet "
            f"vergeleken — die verschilt per versie. De job doet dat op {mikt}."
        )
    return 1 if fouten else 0


if __name__ == "__main__":
    sys.exit(main())
