"""Het project na de uitbreidingen en Afronden, opgebouwd uit de lessen zelf.

De basislessen sluiten af met het hele main.py ("Zo ziet je main.py er nu
uit"); daarom is referentie/ een vaste kopie van de laatste stand. De
uitbreidingen hebben zo'n stand niet: ze tonen alleen wat erbij komt ("zet …
erbij") of wat verandert ("vervang je POST /gastenboek door"). Een vaste kopie
daarvan zou met de hand samengesteld zijn en stil uit de pas lopen met de
lessen. Daarom bouwt dit bestand het project op: het neemt referentie/ en
voert per les uit wat de tekst zegt, met de endpoints en de code letterlijk uit
de hoofdtekst van die les (alles vóór ## Opdrachten). Verandert een les een
endpoint, dan verandert het eindproject mee; verdwijnt een kop of een blok dat
hier gebruikt wordt, dan faalt het opbouwen met een duidelijke melding.

Van de htmx-recepten ("kies wat je gastenboek nodig heeft") bouwt dit
eindproject verversen, verwijderen en zoeken; het formulierrecept staat als
variant in kapot.py (VARIANTEN), want Sessies schrijft het hoofdtekst-formulier
zonder htmx uit.

    python uitbreidingen.py <doelmap>   # het eindproject neerzetten
"""

from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent
SITE = HIER.parent.parent
REFERENTIE = HIER / "referentie"
HTMX = SITE / "static" / "htmx" / "htmx.min.js"

BLOK = re.compile(r"((?:<Bestand pad=\"([^\"]+)\" />\s*\n)?(?:\{/\*([^\n]*)\*/\}\s*\n)?)```(\w+)[^\n]*\n([\s\S]*?)```")


class Fout(Exception):
    pass


def hoofdtekst(les: str) -> str:
    tekst = (SITE / "docs" / f"{les}.mdx").read_text(encoding="utf-8")
    return tekst.split("\n## Opdrachten\n")[0]


def blokken(les: str, taal: str | None = None, pad: str | None = None) -> list[tuple[str | None, str, str]]:
    """De codeblokken in de hoofdtekst: (pad uit <Bestand>, marker, code)."""
    uit = []
    for m in BLOK.finditer(hoofdtekst(les)):
        if taal and m.group(4) != taal:
            continue
        if pad and m.group(2) != pad:
            continue
        uit.append((m.group(2), (m.group(3) or "").strip(), m.group(5)))
    return uit


def blok(les: str, pad: str, bevat: str, taal: str = "html") -> str:
    """Het laatste blok voor `pad` in de hoofdtekst waar `bevat` in staat."""
    kandidaten = [code for _, _, code in blokken(les, taal, pad) if bevat in code]
    if not kandidaten:
        raise Fout(f"{les}: geen {taal}-blok voor {pad} met {bevat!r}")
    return kandidaten[-1]


def endpoint(les: str, kop: str) -> str:
    """Het endpoint dat begint met `kop`, letterlijk uit het laatste blok in de les."""
    gevonden = None
    for _, marker, code in blokken(les, "python"):
        if marker.startswith("route-dubbel: voorspelvraag") or "\n    ...\n" in code + "\n":
            continue
        start = code.find(kop)
        if start < 0:
            continue
        rest = code[start:]
        einde = rest.find("\n@app.", 1)
        gevonden = (rest if einde < 0 else rest[:einde]).rstrip() + "\n"
    if gevonden is None:
        raise Fout(f"{les}: geen endpoint {kop} in de hoofdtekst")
    return gevonden


def imports(les: str) -> list[str]:
    regels = []
    for _, _, code in blokken(les, "python"):
        regels += [r for r in code.splitlines() if re.match(r"(from \S+ )?import ", r)]
    return regels


def inspringen(tekst: str, spaties: int) -> str:
    return "\n".join((" " * spaties + r) if r.strip() else r for r in tekst.rstrip("\n").splitlines())


class Project:
    def __init__(self, map_: Path):
        self.map = map_

    def lees(self, pad: str) -> str:
        return (self.map / pad).read_text(encoding="utf-8")

    def schrijf(self, pad: str, tekst: str):
        (self.map / pad).parent.mkdir(parents=True, exist_ok=True)
        (self.map / pad).write_text(tekst, encoding="utf-8")

    def vervang(self, pad: str, oud: str, nieuw: str):
        tekst = self.lees(pad)
        if tekst.count(oud) != 1:
            raise Fout(f"{pad}: {oud!r} staat er {tekst.count(oud)} keer in, verwacht 1 keer")
        self.schrijf(pad, tekst.replace(oud, nieuw))

    def imports(self, regels: list[str]):
        tekst = self.lees("main.py")
        bestaand = tekst.splitlines()
        namen = set()
        for r in bestaand:
            m = re.match(r"(?:from \S+ )?import (.+)", r)
            if m:
                namen |= {n.strip() for n in m.group(1).split(",")}
        nieuw = []
        for r in dict.fromkeys(regels):
            m = re.match(r"(?:from \S+ )?import (.+)", r)
            if r not in bestaand and not {n.strip() for n in m.group(1).split(",")} <= namen:
                nieuw.append(r)
        if not nieuw:
            return
        plek = tekst.index("\napp = FastAPI(")
        kop = tekst[:plek].rstrip("\n")
        self.schrijf("main.py", kop + "\n" + "\n".join(nieuw) + "\n" + tekst[plek:])

    def _handler(self, tekst: str, kop: str) -> tuple[int, int]:
        start = tekst.find(kop)
        if start < 0 or tekst.count(kop) != 1:
            raise Fout(f"main.py: {kop} staat er {tekst.count(kop)} keer in, verwacht 1 keer")
        # Tot de volgende regel aan de kantlijn die geen def van deze handler is.
        m = re.compile(r"\n(?=@|(?!async def |def )[A-Za-z_])").search(tekst, start + len(kop))
        return start, (m.start() + 1 if m else len(tekst))

    def vervang_endpoint(self, kop: str, code: str):
        tekst = self.lees("main.py")
        start, einde = self._handler(tekst, kop)
        self.schrijf("main.py", tekst[:start] + code.rstrip() + "\n\n" + tekst[einde:].lstrip("\n"))

    def voeg_endpoint(self, code: str):
        self.schrijf("main.py", self.lees("main.py").rstrip("\n") + "\n\n" + code.rstrip() + "\n")


# ── Per les wat de hoofdtekst zegt ───────────────────────────────────────────


def htmx(p: Project):
    les = "FastAPI/zonder-herladen/htmx"
    # "Maak een map static/js/ en zet daar htmx.min.js in"
    p.schrijf("static/js/htmx.min.js", HTMX.read_text(encoding="utf-8"))
    script = blok(les, "static/pages/home.html", "<script")
    knop = blok(les, "static/pages/home.html", "hx-get")
    p.vervang("static/pages/home.html", "    </head>", inspringen(script, 8) + "\n    </head>")
    p.vervang("static/pages/home.html", "<h1>Home</h1>\n", "<h1>Home</h1>\n" + inspringen(knop, 8) + "\n")
    p.imports(imports(les))
    p.voeg_endpoint(endpoint(les, '@app.get("/tijd")'))


def htmx_overzicht(p: Project):
    les = "FastAPI/zonder-herladen/htmx-overzicht"
    # Verversen: het {% if %}-blok naar een eigen template, een knop en een div.
    lijst = blok(les, "templates/berichten_lijst.html", "{% for")
    # Verwijderen: elke <li> een id en een knop met hx-delete.
    li = blok(les, "templates/berichten_lijst.html", "hx-delete")
    lijst = re.sub(r"( *)<li>[\s\S]*?</li>", lambda m: inspringen(li, len(m.group(1))), lijst)
    # Zoeken: het else-blok met de zoekterm.
    anders = blok(les, "templates/berichten_lijst.html", "{% if term %}")
    lijst = lijst[: lijst.rindex("{% else %}")] + anders
    p.schrijf("templates/berichten_lijst.html", lijst)

    berichten = p.lees("templates/berichten.html")
    m = re.search(r"( *)\{% if berichten %\}[\s\S]*\{% endif %\}", berichten)
    if not m:
        raise Fout("templates/berichten.html: geen {% if berichten %}-blok")
    zoek = blok(les, "templates/berichten.html", 'name="term"')
    ververs = blok(les, "templates/berichten.html", "Ververs")
    nieuw = inspringen(zoek + "\n" + ververs, len(m.group(1))).lstrip(" ")
    berichten = berichten[: m.start()] + m.group(1) + nieuw + berichten[m.end() :]
    script = blok(les, "static/pages/gastenboek_form.html", "<script").strip().splitlines()[1].strip()
    p.schrijf("templates/berichten.html", berichten.replace("    </head>", f"        {script}\n    </head>", 1))

    p.voeg_endpoint(endpoint(les, '@app.get("/berichten/lijst")'))
    p.voeg_endpoint(endpoint(les, '@app.delete("/bericht/{sleutel}")'))


def javascript(p: Project):
    les = "FastAPI/in-de-browser/javascript"
    p.schrijf("static/js/app.js", blok(les, "static/js/app.js", "const veld", "js"))
    script = blok(les, "static/pages/gastenboek_form.html", "app.js").strip()
    veld = blok(les, "static/pages/gastenboek_form.html", "bericht-veld").strip()
    teller = blok(les, "static/pages/gastenboek_form.html", 'id="teller"').strip()
    pad = "static/pages/gastenboek_form.html"
    # "Heeft het bestand nog geen <head>, zet er dan een boven de <body>"
    p.vervang(pad, "    <body>", f"    <head>\n        {script}\n    </head>\n    <body>")
    p.vervang(
        pad,
        '            <input type="text" name="bericht" placeholder="Je bericht" required>\n',
        f"            {veld}\n            {teller}\n",
    )


def server_of_browser(p: Project):
    les = "FastAPI/in-de-browser/server-of-browser"
    code = next(c for _, _, c in blokken(les, "python") if "len(bericht)" in c)
    controle = code.split("):\n", 1)[1].split("    ...")[0]
    p.vervang("main.py", "    bericht: str = Form(...),\n):\n", "    bericht: str = Form(...),\n):\n" + controle + "\n")


def cookies(p: Project):
    les = "FastAPI/onthouden/cookies"
    p.imports(imports(les))
    p.vervang_endpoint('@app.post("/gastenboek")', endpoint(les, '@app.post("/gastenboek")'))
    p.vervang_endpoint('@app.get("/gastenboek")', endpoint(les, '@app.get("/gastenboek")'))
    # "verplaats het hele bestand naar templates/gastenboek.html … value="{{ naam }}" komt erbij"
    formulier = p.lees("static/pages/gastenboek_form.html")
    (p.map / "static/pages/gastenboek_form.html").unlink()
    if 'value="{{ naam }}"' not in blok(les, "templates/gastenboek.html", "<form"):
        raise Fout(f"{les}: het formulier zet de naam niet meer in value")
    p.schrijf("templates/gastenboek.html", formulier.replace('name="naam"', 'name="naam" value="{{ naam }}"', 1))


def sessies(p: Project):
    les = "FastAPI/onthouden/sessies"
    p.imports(imports(les))
    p.voeg_endpoint(endpoint(les, '@app.post("/inloggen")'))
    p.vervang_endpoint('@app.get("/gastenboek")', endpoint(les, '@app.get("/gastenboek")'))
    p.vervang_endpoint('@app.post("/gastenboek")', endpoint(les, '@app.post("/gastenboek")'))
    # Het formulier wordt inloggen of schrijven. De teller houdt zijn id, en de
    # <script> voor app.js gaat het {% if naam %}-blok in, onder het formulier.
    keuze = blok(les, "templates/gastenboek.html", "{% if naam %}")
    tekst = p.lees("templates/gastenboek.html")
    veld = re.search(r"<input[^>]*bericht-veld[^>]*>", tekst).group(0)
    teller = re.search(r'<p id="teller">[^\n]*', tekst).group(0)
    script = re.search(r"\n *(<script src=\"/static/js/app\.js\"[^\n]*)", tekst).group(1)
    keuze = re.sub(
        r'( *)<input type="text" name="bericht" required>',
        lambda m: f"{m.group(1)}{veld}\n{m.group(1)}{teller}",
        keuze,
        count=1,
    )
    keuze = keuze.replace("    </form>\n{% else %}", f"    </form>\n    {script}\n{{% else %}}", 1)
    tekst = tekst.replace(f"        {script}\n", "").replace("    <head>\n    </head>\n", "")
    m = re.search(r"( *)<form method=\"post\" action=\"/gastenboek\">[\s\S]*?Nog geen account\?</a>", tekst)
    if not m:
        raise Fout("templates/gastenboek.html: formulier met link naar /registreer niet gevonden")
    tekst = tekst[: m.start()] + inspringen(keuze, len(m.group(1))) + tekst[m.end() :]
    p.schrijf("templates/gastenboek.html", tekst)


def foutpagina(p: Project):
    les = "FastAPI/afronden/foutpagina"
    p.schrijf("templates/404.html", blok(les, "templates/404.html", "<!DOCTYPE"))
    p.voeg_endpoint(endpoint(les, "@app.exception_handler(404)"))


STAPPEN = [
    ("FastAPI/zonder-herladen/htmx", htmx),
    ("FastAPI/zonder-herladen/htmx-overzicht", htmx_overzicht),
    ("FastAPI/in-de-browser/javascript", javascript),
    ("FastAPI/in-de-browser/server-of-browser", server_of_browser),
    ("FastAPI/onthouden/cookies", cookies),
    ("FastAPI/onthouden/sessies", sessies),
    ("FastAPI/afronden/foutpagina", foutpagina),
]


def maak(doel: Path, tot: str | None = None) -> Path:
    """Het basisproject plus de uitbreidingen, tot en met les `tot` (of alles)."""
    if doel.exists():
        shutil.rmtree(doel)
    shutil.copytree(REFERENTIE, doel, ignore=shutil.ignore_patterns("*.db", "__pycache__"))
    p = Project(doel)
    for les, stap in STAPPEN:
        stap(p)
        if les == tot:
            break
    return doel


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("gebruik: python uitbreidingen.py <doelmap>")
    print(maak(Path(sys.argv[1])))
