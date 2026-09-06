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

Het uitvoerblok mag ook in een `<details><summary>Wat zie je?</summary>` staan,
en het hoort net zo goed bij een runbaar component (`<PyRunner>`,
`<CodeExercise>`) als bij een kale fence: de "Wat zie je?"-antwoorden onder de
speeltuinen zijn precies de plek waar een leerling zijn eigen uitvoer naast die
van de les legt. De wikkel telt niet als tekst ertussen; verdere tekst (een
"Ongeveer:" boven een willekeurig resultaat) verbreekt de band wel.

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
    {/* foutmelding-van: blok-eronder */}   het blok of de oefening hieronder
    {/* foutmelding-van: fout-helft */}     de `# FOUT`-helft van het blok
                                            hieronder; de `# GOED`-helft moet
                                            dan juist schoon draaien
    {/* foutmelding-van: import rekenen */} een eigen reproductie; \n erin voor
                                            meer dan één regel

Datzelfde geldt voor een foutmelding die de lopende tekst noemt — "dan krijg je
een `ValueError`". Daar staat de marker boven de alinea in plaats van boven het
blok. Noemt de zin alleen de soort en niet de bewoording, dan wordt ook alleen
de soort vergeleken; dat oordeel hangt niet aan een Python-versie.

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

Aanroep vanuit de repo-root (zonder site-naam: de python-cursus):

    python3 scripts/draai-python-blokken.py
    python3 scripts/draai-python-blokken.py algorithms
    python3 scripts/draai-python-blokken.py algorithms --pins   # pip-regel voor CI

Het script bedient meerdere cursussen; wat per site verschilt (docs-map, het
runbare component, de Python-versie van de Pyodide, de gepinde pakketten) staat
in de SITES-tabel bovenaan. Voor algorithms pint CI numpy en matplotlib op de
versies die de browser laadt, uit static/pyodide/pyodide-lock.json — draait de
controle tegen een andere numpy, dan zegt groen niets over wat een leerling ziet.

Afsluitcode 0 als alles slaagt, 1 zodra er iets misgaat.
"""

import json
import os
import re
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Twee cursussen delen dit script; hier staat alleen wat echt verschilt.
# `component` is de regex van het runbare component op die site, met de code in
# de named group `oefcode`. `python_versie` is de CPython van de Pyodide die de
# site serveert — alleen op die versie worden foutmeldingsteksten beoordeeld.
# `pins` zijn de pakketten die CI vastzet op de versie die de browser laadt,
# afgelezen uit static/pyodide/pyodide-lock.json van de site zelf.
SITES = {
    "python": {
        "docs": ROOT / "sites" / "python" / "docs",
        "component": r"<CodeExercise>\{`(?P<oefcode>.*?)`\}</CodeExercise>",
        "component_tag": r"<CodeExercise\b",
        "python_versie": (3, 13),
        "pins": (),
        "env": {},
        # In deze cursus is elk kaal blok een compleet programma; draaien dus.
        "fences_draaien": True,
    },
    "algorithms": {
        "docs": ROOT / "sites" / "algorithms" / "docs",
        # rows/editable mogen voor of na initialCode staan, en de props mogen
        # over meerdere regels gespreid zijn; vóór de code-literal komt nooit
        # een backtick, dus daar loopt de match op af.
        "component": r"<PyRunner\s[^`]*?initialCode=\{`(?P<oefcode>.*?)`\}",
        "component_tag": r"<PyRunner\b",
        "python_versie": (3, 12),
        # numpy en matplotlib bepalen wat een blok print; de rest van de
        # matplotlib-keten reist als dependency mee.
        "pins": ("numpy", "matplotlib"),
        # Dezelfde backend als PyRunner in de browser; zonder deze wil
        # matplotlib een venster.
        "env": {"MPLBACKEND": "Agg"},
        # De bouwen-lessen tonen bewust fragmenten van een paar regels die op
        # de pagina ervoor leunen; een kaal blok wordt hier alleen
        # gecompileerd. Draaien is opt-in: een uitvoerblok eronder, een
        # print-belofte erin, of een {/* draaien: reden */}-marker erboven.
        # PyRunner-blokken draaien altijd — daar drukt een leerling op de knop.
        "fences_draaien": False,
    },
}

def kies_site(naam: str) -> None:
    """Zet de module-globals op de gekozen site; main() roept dit als eerste."""
    global SITE_NAAM, SITE, DOCS, COMPONENT_RE, BLOK_RE, PYTHON_VAN_DE_SITE
    global OORDEELT_OVER_TEKST
    SITE_NAAM = naam
    SITE = SITES[naam]
    DOCS = SITE["docs"]
    COMPONENT_RE = re.compile(SITE["component"], re.S)
    # In documentvolgorde, zodat een uitvoerblok bij het blok ervóór hoort.
    BLOK_RE = re.compile(
        r"(?P<py>^```python[^\n]*\n(?P<pycode>.*?)^```)"
        r"|(?P<kaal>^```\n(?P<kaalcode>.*?)^```)"
        rf"|(?P<oef>{SITE['component']})",
        re.S | re.M,
    )
    PYTHON_VAN_DE_SITE = SITE["python_versie"]
    OORDEELT_OVER_TEKST = sys.version_info[:2] == PYTHON_VAN_DE_SITE
NIET_DRAAIEN_RE = re.compile(r"\{/\*\s*niet-draaien:.*?\*/\}\s*$")
DRAAIEN_RE = re.compile(r"\{/\*\s*draaien:.*?\*/\}\s*$")
# Een Voorspel-blok gebruikt vaak de functie die eerder op de pagina is
# opgebouwd; met deze marker draait het met dat blok ervoor geplakt, zodat de
# beloofde uitvoer tóch te controleren is. De beloftes komen uit het blok zélf
# en worden tegen de staart van de uitvoer gelegd (het eigen blok draait als
# laatste); regelnummers in een foutmelding zijn teruggerekend naar dit blok en
# de melding zegt erbij dat het blok erboven meedraait. Alleen blokken die
# zelfstandig compileren mogen de keten voeden.
MET_RE = re.compile(r"\{/\*\s*draaien-met:\s*blok-erboven\s*\*/\}\s*$")
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

# De runners op de site draaien de CPython van hun Pyodide; dáár leest een
# leerling zijn foutmelding, dus die versie (per site, zie SITES) bepaalt of een
# geciteerde tekst klopt. De bewoording verschilt per versie — 3.12 raadt bij
# een NameError welke module je vergat, 3.13 noemt bij een overschaduwde module
# het pad van je bestand — dus op een andere Python wordt de tekst niet
# vergeleken in plaats van ten onrechte afgekeurd. De jobs draaien op de goede;
# in CI is dat hard (zie main), lokaal een voetnoot.
#
# kies_site is de enige plek die de site-globals zet; deze aanroep maakt de
# module direct bruikbaar (importeren + verzamel() zonder eerst kiezen).
kies_site("python")


# De code van een component staat in een JS-template-literal; de browser
# vertaalt de ontsnappingen voordat Python de tekst ziet. `\\n` in de bron is
# dus `\n` voor Python (een regeleinde), en een kale `\n` in de bron wordt een
# echt regeleinde midden in de Python-string — precies de fout die je alleen
# in de browser ziet. Daarom vertaalt de controle ze op dezelfde manier.
TEMPLATE_ONTSNAPPING = {"n": "\n", "t": "\t", "r": "\r"}


def template_ontsnap(code: str) -> str:
    return re.sub(
        r"\\(.)",
        lambda m: TEMPLATE_ONTSNAPPING.get(m.group(1), m.group(1)),
        code,
        flags=re.S,
    )


def hoort_bij_elkaar(tussen: str) -> bool:
    """Is een kale fence met alléén `tussen` ervoor de uitvoer van het blok erboven?

    De sluiting van het component (`/>`) en de details-wikkel om een
    "Wat zie je?"-antwoord zijn geen tekst ertussen. Wat overblijft moet kort
    zijn en mag geen kopje bevatten: onder "## Er gaat iets mis" hoort de
    foutmelding juist bij het blok dat erna komt.
    """
    kaal = re.sub(r"^\s*/>", "", tussen.strip())
    kaal = re.sub(r"<details>|<summary>[^<\n]*</summary>", "", kaal)
    return len(kaal.strip()) <= 40 and "#" not in kaal


def zelftest() -> None:
    """De twee vertaalslagen die stil kunnen verslappen, hardop nagelopen.

    Zonder deze regels zou de controle nog steeds groen zijn — met minder
    blokken die meedoen. Dat is precies de regressie die je niet ziet.
    """
    assert template_ontsnap(r"print('a\\nb')") == r"print('a\nb')"
    assert template_ontsnap(r"\`") == "`"
    assert template_ontsnap(r"\${x}") == "${x}"
    assert hoort_bij_elkaar(" />\n\n<details>\n<summary>Wat zie je?</summary>\n\n")
    assert hoort_bij_elkaar("\n\n<details>\n<summary>Antwoord — verwacht je dit?</summary>\n\n")
    assert not hoort_bij_elkaar(
        " />\n\n<details>\n<summary>Wat zie je?</summary>\n\nOngeveer dit, want de lijst is elke keer anders:\n\n"
    )
    assert not hoort_bij_elkaar("\n\n## Er gaat iets mis\n\n")


def inspring_weg(code: str) -> str:
    regels = code.lstrip("\n").rstrip().split("\n")
    inspringen = [len(r) - len(r.lstrip()) for r in regels if r.strip()]
    n = min(inspringen) if inspringen else 0
    return "\n".join(r[n:] for r in regels)


def waarde_van(belofte: str) -> str:
    """De kale waarde uit een belofte, zonder toelichting tussen haakjes.

    De spatie vóór het haakje is wat een toelichting onderscheidt van een
    waarde: `14  (eerst 3 * 4)` is een getal met uitleg, maar `set()` en
    `(1, 2)` zijn zelf de uitvoer. Het voorvoegsel `verwacht:` — het
    belofte-idioom van de algorithms-cursus — telt niet mee.
    """
    zonder = re.sub(r"^verwacht:\s*", "", belofte)
    zonder = re.sub(r"\s+\(.*\)$", "", zonder).strip()
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
    """(blokken, claims, fouten).

    Elk blok is (bron, regel, code, soort, verwacht, varieert, voorplak);
    voorplak is het aantal regels dat draaien-met ervoor heeft geplakt (0 als
    er niets geplakt is). `fouten` zijn structurele problemen die het
    verzamelen zelf vond, zoals een component-tag die niet geparseerd werd.
    """
    blokken, claims, fouten = [], [], []
    tag_re = re.compile(SITE["component_tag"])
    fence_weg = re.compile(r"^```.*?^```[^\n]*$", re.S | re.M)

    for pad in sorted(DOCS.rglob("*.mdx")) + sorted(DOCS.rglob("*.md")):
        tekst = pad.read_text()
        bron = pad.relative_to(ROOT)
        verzameld_hier = 0  # componenten die BLOK_RE in dit bestand oppikt
        vorige = None  # laatst geziene python-blok, kandidaat voor een uitvoerblok
        # Voor draaien-met: de code van het vorige blok, mét zijn eigen
        # met-expansie. Zo mag een reeks blokken op elkaar doorbouwen, zoals
        # een lezer ze ook van boven naar beneden leest. Bewust kapotte
        # blokken (niet-draaien/niet-compileren) doen niet mee.
        erboven_effectief = None

        for m in BLOK_RE.finditer(tekst):
            if m.group("kaal") is not None:
                # Een kale fence vlak onder een python-blok is zijn uitvoer.
                # Twee dingen verbreken die band: te veel tekst ertussen, en een
                # kopje. Onder "## Er gaat iets mis" hoort de foutmelding juist
                # bij het blok dat erna komt.
                tussen = tekst[vorige[0] : m.start()] if vorige is not None else ""
                gepaard = vorige is not None and hoort_bij_elkaar(tussen)
                if gepaard:
                    rij = blokken[vorige[1]]
                    # Een uitvoerblok is een belofte; een fence die er een
                    # draagt draait dus altijd, ook op een site waar kale
                    # fences normaal alleen compileren.
                    soort = "draai" if rij[3] != "compileer-marker" else "compileer"
                    blokken[vorige[1]] = rij[:3] + (soort, inspring_weg(m.group("kaalcode")), rij[5], rij[6])
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
                            vorig_blok(tekst, m.start()),
                            volgend_blok(tekst, m.end()),
                        )
                    )
                vorige = None
                continue

            if m.group("py") is None:
                verzameld_hier += 1
            code = (
                m.group("pycode") if m.group("py") is not None
                else template_ontsnap(m.group("oefcode"))
            )
            regel = tekst[: m.start()].count("\n") + 1
            ervoor = tekst[: m.start()].rstrip()
            if NIET_COMPILEREN_RE.search(ervoor):
                vorige = None
                continue
            kaalcode = inspring_weg(code)
            voorplak = 0
            if MET_RE.search(ervoor):
                boven = erboven_effectief
                if boven is None:
                    blokken.append(
                        (bron, regel, "raise SyntaxError('draaien-met zonder blok erboven')",
                         "draai", None, False, 0)
                    )
                    vorige = None
                    continue
                voorplak = boven.count("\n") + 1
                kaalcode = boven + "\n" + kaalcode
            if NIET_DRAAIEN_RE.search(ervoor):
                # Expliciet uitgezet; een uitvoerblok eronder mag dat niet
                # meer terugdraaien.
                soort = "compileer-marker"
            elif (
                m.group("py") is not None
                and not SITE["fences_draaien"]
                and not DRAAIEN_RE.search(ervoor)
                and not MET_RE.search(ervoor)
                and not any(BELOFTE_RE.match(x) for x in kaalcode.split("\n"))
            ):
                soort = "compileer"
            else:
                soort = "draai"
            varieert = bool(VARIEERT_RE.search(ervoor))
            blokken.append((bron, regel, kaalcode, soort, None, varieert, voorplak))
            # De keten mag alleen gevoed worden door blokken die op zichzelf
            # kunnen bestaan: een fragment dat zelf niet compileert (een losse
            # return-regel) zou elk volgend draaien-met-blok meeslepen.
            if soort != "compileer-marker" and compileert_los(kaalcode):
                erboven_effectief = kaalcode
            vorige = (m.end(), len(blokken) - 1)

        claims += list(inline_claims(tekst, bron))

        # De invariant die een stil gat dichthoudt: elk component-voorkomen in
        # de bron (buiten code-fences) moet door BLOK_RE zijn opgepikt. Een
        # component in een net iets andere schrijfwijze zou anders geruisloos
        # uit álle controles vallen — niet gedraaid, beloftes genegeerd.
        ruw = len(tag_re.findall(fence_weg.sub("", tekst)))
        if ruw != verzameld_hier:
            fouten.append(
                f"{bron}: {ruw} component-tags in de bron, maar {verzameld_hier} "
                f"verzameld — staat er een component in een vorm die BLOK_RE "
                f"niet herkent?"
            )
    return blokken, claims, fouten


def volgend_blok(tekst: str, vanaf: int) -> str | None:
    """De code van het eerstvolgende blok, voor `fout-helft` en `blok-eronder`.

    Ook een `<CodeExercise>` telt mee: een opdracht die een fout laat zien staat
    daarin, niet in een ```python-fence.
    """
    m = re.search(
        rf"^```python[^\n]*\n(?P<py>.*?)^```|{SITE['component']}",
        tekst[vanaf:],
        re.S | re.M,
    )
    if not m:
        return None
    return inspring_weg(m.group("py") if m.group("py") is not None else m.group("oefcode"))


def vorig_blok(tekst: str, tot: int) -> str | None:
    """De code van het laatste blok vóór deze plek (fence of component)."""
    treffers = list(
        re.finditer(
            rf"^```python[^\n]*\n(?P<py>.*?)^```|{SITE['component']}",
            tekst[:tot],
            re.S | re.M,
        )
    )
    if not treffers:
        return None
    t = treffers[-1]
    return inspring_weg(t.group("py") if t.group("py") is not None else t.group("oefcode"))


# Een foutmelding staat niet altijd in een uitvoerblok. Vaak noemt de lopende
# tekst hem: "dan krijg je een `ValueError`". Dat is dezelfde belofte over Python
# en veroudert net zo goed, dus hij wordt op dezelfde manier nagelopen — met de
# marker boven de alinea in plaats van boven het blok. Noemt zo'n zin alleen de
# soort, dan wordt ook alleen de soort vergeleken.
#
# Eén regeleinde in de span mag: proza wrapt, en een lange melding als
# "TypeError: '>' not supported …" breekt in de bron gewoon af. Een lege regel
# beëindigt de span wél, anders slokt een los backtick alinea's op. Bij het
# vergelijken wordt witruimte platgeslagen (zie normaliseer).
INLINE_CODE_RE = re.compile(r"`((?:[^`\n]|\n(?!\n))+)`")
SOORT_RE = re.compile(r"\b([A-Z][A-Za-z]*(?:Error|Exception|Interrupt|Warning))\b")


def proza_van(tekst: str) -> str:
    """Alleen de lopende tekst, met de regelnummers intact.

    Frontmatter, codeblokken en oefeningen gaan eruit: daar staat geen belofte
    aan de lezer, en een `KeyError` in een `description:` is metadata, geen les.
    """

    def leeg(m):
        return "\n" * m.group(0).count("\n")

    zonder = re.sub(r"\A\ufeff?---\n.*?\n---\n", leeg, tekst, count=1, flags=re.S)
    zonder = re.sub(r"^```.*?^```[^\n]*$", leeg, zonder, flags=re.S | re.M)
    return COMPONENT_RE.sub(leeg, zonder)


def inline_claims(tekst: str, bron):
    """De foutmeldingen die de lopende tekst noemt."""
    proza = proza_van(tekst)
    # proza houdt de regelnummers gelijk maar niet de posities — een codeblok
    # wordt vervangen door zijn newlines en is dus korter. Zoeken naar de marker
    # doen we in de bron, dus reken de treffer eerst om via zijn regelnummer.
    begin_van_regel = [0]
    for regel in tekst.split("\n"):
        begin_van_regel.append(begin_van_regel[-1] + len(regel) + 1)

    for m in INLINE_CODE_RE.finditer(proza):
        inhoud = re.sub(r"\s+", " ", m.group(1)).strip()
        if not SOORT_RE.match(inhoud):
            continue
        regelnr = proza[: m.start()].count("\n")
        kolom = m.start() - (proza.rfind("\n", 0, m.start()) + 1)
        plek = begin_van_regel[regelnr] + kolom
        alinea = tekst.rfind("\n\n", 0, plek)
        ervoor = tekst[: alinea if alinea != -1 else 0].rstrip()
        van = VAN_RE.search(ervoor)
        yield (
            bron,
            regelnr + 1,
            inhoud,
            van.group(1) if van else None,
            bool(LOS_RE.search(ervoor)),
            vorig_blok(tekst, plek),
            volgend_blok(tekst, plek),
        )


def compileert_los(code: str) -> bool:
    """Compileert dit blok zonder wrapper? Alleen dan mag het de keten voeden."""
    try:
        compile(code, "<keten>", "exec")
        return True
    except SyntaxError:
        return False


def compileer(bron, regel, code) -> str | None:
    try:
        compile(code, str(bron), "exec")
        return None
    except SyntaxError as e:
        # Een cheatsheet-fragment toont vaak alleen het return- of break-deel
        # van een functie of lus. Dat is geen fout in de les maar de vorm van
        # een fragment; binnen een wrapper moet het wél gewoon compileren,
        # zodat een echte tikfout in zo'n fragment blijft omvallen.
        if e.msg and ("outside function" in e.msg or "outside loop" in e.msg):
            ingepakt = "def _w():\n while True:\n" + "".join(
                f"  {r}\n" for r in code.split("\n")
            )
            try:
                compile(ingepakt, str(bron), "exec")
                return None
            except SyntaxError:
                pass
        return f"{bron}:{regel + (e.lineno or 1)}: {e.msg}"


def draai(bron, regel, code, verwacht, varieert=False, voorplak=0) -> str | None:
    # Bij draaien-met telt het voorgeplakte blok mee in de regelnummers van
    # Python; door de startregel te verschuiven wijst een fout in het blok
    # zélf weer naar de juiste documentregel, en de melding zegt erbij dat er
    # is voorgeplakt (een fout kan immers ook dáár vandaan komen).
    fout = compileer(bron, regel - voorplak, code) if voorplak else compileer(bron, regel, code)
    if fout:
        return fout + (" (draaien-met: het blok erboven draait mee)" if voorplak else "")

    try:
        r = subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True,
            text=True,
            timeout=TIJDSLIMIET,
            env={**os.environ, **SITE["env"]},
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
        return f"{bron}:{regel}: {laatste_fout or f'exitcode {r.returncode}'}" + (
            " (draaien-met: het blok erboven draait mee)" if voorplak else ""
        )

    # Een lege regel vooraan (een print("\\n…") als eerste) is in een fence
    # niet te zien; die telt dus niet mee, net als lege regels achteraan.
    uit = r.stdout.strip("\n")

    if verwacht is not None and uit != verwacht:
        return f"{bron}:{regel}: uitvoerblok belooft {verwacht!r}, geeft {uit!r}"

    # Een uitvoerblok legt de volledige uitvoer al vast; commentaren achter de
    # prints zijn dan toelichting ("zou 2 moeten zijn" boven een antwoord dat
    # bewust -1 toont) en geen tweede belofte.
    if verwacht is not None:
        return None

    # Beloftes komen uit het blok zélf, niet uit een voorgeplakt blok — dat
    # heeft zijn eigen beloftes al waargemaakt toen het als los blok draaide.
    eigen = code.split("\n")[voorplak:]
    beloftes = [BELOFTE_RE.match(x).group(1) for x in eigen if BELOFTE_RE.match(x)]
    if beloftes and not varieert:
        regels = uit.split("\n") if uit else []
        if voorplak:
            # Het eigen blok draait als laatste, dus zíjn prints zijn de staart
            # van de uitvoer — maar dat klopt alleen als élke eigen print een
            # belofte draagt. Eén kale print erachter zou de staart stil
            # verschuiven en een belofte tegen de verkeerde regel leggen; dat
            # eisen we dus hardop af in plaats van het te laten gebeuren.
            prints = sum(1 for x in eigen if re.match(r"\s*print\(", x))
            if prints != len(beloftes):
                return (
                    f"{bron}:{regel}: in een draaien-met-blok met beloftes moet "
                    f"elke print er een dragen ({prints} prints, "
                    f"{len(beloftes)} beloftes) — anders is de staart van de "
                    f"uitvoer niet uit te lijnen"
                )
            if len(regels) < len(beloftes):
                return (
                    f"{bron}:{regel}: belooft {len(beloftes)} regels uitvoer, "
                    f"maar er komen er {len(regels)}"
                )
            for echt, belofte in zip(regels[-len(beloftes) :], beloftes):
                if echt != waarde_van(belofte):
                    return f"{bron}:{regel}: belooft {waarde_van(belofte)!r}, geeft {echt!r}"
        # Zonder voorplak vergelijken we alleen als elke print precies één
        # regel opleverde; anders weet je niet welke belofte waarbij hoort.
        elif len(regels) == len(beloftes):
            for echt, belofte in zip(regels, beloftes):
                if echt != waarde_van(belofte):
                    return f"{bron}:{regel}: belooft {waarde_van(belofte)!r}, geeft {echt!r}"
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
                env={**os.environ, **SITE["env"]},
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
            f"reproduceert hem — zet er {{/* foutmelding-van: … */}} boven"
        )

    goed = None
    if hoe == "blok-erboven":
        if erboven is None:
            return f"{plek}: 'blok-erboven', maar er staat geen python-blok boven"
        code = erboven
    elif hoe == "blok-eronder":
        if eronder is None:
            return f"{plek}: 'blok-eronder', maar er volgt geen blok"
        code = eronder
    elif hoe == "fout-helft":
        if eronder is None:
            return f"{plek}: 'fout-helft', maar er volgt geen python-blok"
        code, goed = helften(eronder)
        if goed is None:
            return f"{plek}: 'fout-helft', maar het blok eronder heeft geen '# GOED'"
    else:
        # Een reproductie van meer dan één regel schrijf je met \\n; een
        # inspringfout valt nu eenmaal niet op één regel te laten zien.
        code = hoe.replace("\\n", "\n")

    exitcode, gegeven = los_fragment(code)
    if exitcode == 0:
        return f"{plek}: belooft {melding!r}, maar de reproductie draait gewoon door"
    # Een melding die op … eindigt citeert alleen de vaste kop. Dat is nodig als
    # Python er iets machine-eigens achter zet — bij een overschaduwde module
    # noemt 3.13 het volledige pad van je bestand, en dat is bij niemand gelijk.
    if ":" not in melding:
        # De zin noemt alleen de soort ("dan krijg je een `ValueError`"); dan is
        # dát de belofte en niet de bewoording, en die is versieloos te toetsen.
        if gegeven.split(":", 1)[0] != melding:
            return f"{plek}: belooft {melding}, geeft {gegeven!r}"
    elif not OORDEELT_OVER_TEKST:
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


def python_van_de_lock() -> tuple[int, int] | None:
    """De CPython-versie die de site echt serveert, uit zijn eigen pyodide-lock."""
    lock = DOCS.parent / "static" / "pyodide" / "pyodide-lock.json"
    if not lock.exists():
        return None
    versie = json.loads(lock.read_text()).get("info", {}).get("python")
    if not versie:
        return None
    delen = versie.split(".")
    return (int(delen[0]), int(delen[1]))


def pins() -> dict[str, str]:
    """De browser-versies van de gepinde pakketten, uit de eigen pyodide-lock."""
    if not SITE["pins"]:
        return {}
    lock = json.loads((DOCS.parent / "static" / "pyodide" / "pyodide-lock.json").read_text())
    return {naam: lock["packages"][naam]["version"] for naam in SITE["pins"]}


def controleer_pins() -> str | None:
    """Klopt wat er geïnstalleerd is met wat de browser laadt?"""
    import importlib.metadata as md

    scheef = []
    for naam, verwacht in pins().items():
        try:
            echt = md.version(naam)
        except md.PackageNotFoundError:
            scheef.append(f"{naam} ontbreekt (verwacht {verwacht})")
            continue
        if echt != verwacht:
            scheef.append(f"{naam} is {echt}, de browser laadt {verwacht}")
    if not scheef:
        return None
    return (
        "De geïnstalleerde pakketten wijken af van wat de browser laadt "
        "(static/pyodide/pyodide-lock.json):\n  "
        + "\n  ".join(scheef)
        + "\n\nDan test je iets anders dan een leerling ziet. Installeer met:\n  "
        + "pip install " + " ".join(f"{n}=={v}" for n, v in pins().items())
    )


def main() -> int:
    argv = [a for a in sys.argv[1:] if a != "--pins"]
    naam = argv[0] if argv else "python"
    if naam not in SITES:
        print(f"onbekende site {naam!r}; kies uit: {', '.join(SITES)}", file=sys.stderr)
        return 2
    kies_site(naam)
    zelftest()

    if "--pins" in sys.argv:
        print(" ".join(f"{n}=={v}" for n, v in pins().items()))
        return 0

    # De site-versie staat op drie plekken: de SITES-tabel hier, python-version
    # in build.yml, en wat static/pyodide/ echt serveert. Drijven die uiteen,
    # dan zouden de foutmeldingsteksten stilletjes niet meer vergeleken worden —
    # precies het "groen zegt niets" dat dit script moet uitsluiten. De lock is
    # de waarheid (dat ís wat de browser draait), dus daar toetsen we tegen.
    lock_versie = python_van_de_lock()
    if lock_versie is not None and lock_versie != PYTHON_VAN_DE_SITE:
        print(
            f"SITES[{naam!r}] zegt Python {'.'.join(map(str, PYTHON_VAN_DE_SITE))}, "
            f"maar static/pyodide/pyodide-lock.json van de site serveert "
            f"{'.'.join(map(str, lock_versie))}. Pas python_versie in de SITES-tabel "
            f"aan (en python-version van de job in build.yml).",
            file=sys.stderr,
        )
        return 1
    if os.environ.get("GITHUB_ACTIONS") and not OORDEELT_OVER_TEKST:
        nu = ".".join(str(x) for x in sys.version_info[:2])
        mikt = ".".join(str(x) for x in PYTHON_VAN_DE_SITE)
        print(
            f"Deze job draait Python {nu}, maar de site draait {mikt} — dan worden "
            f"de geciteerde foutmeldingen niet vergeleken. Pas python-version van "
            f"deze job in build.yml aan.",
            file=sys.stderr,
        )
        return 1

    scheef = controleer_pins()
    if scheef:
        print(scheef, file=sys.stderr)
        return 1

    blokken, claims, fouten_vooraf = verzamel()
    te_draaien = [b for b in blokken if b[3] == "draai"]
    te_compileren = [b for b in blokken if b[3] != "draai"]
    met_belofte = sum(
        1
        for b in te_draaien
        if not b[5]
        and (b[4] is not None or any(BELOFTE_RE.match(x) for x in b[2].split("\n")[b[6] :]))
    )

    fouten = fouten_vooraf
    fouten += [f for b in te_compileren if (f := compileer(b[0], b[1], b[2]))]
    with ThreadPoolExecutor(max_workers=8) as pool:
        resultaten = pool.map(lambda b: draai(b[0], b[1], b[2], b[4], b[5], b[6]), te_draaien)
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
