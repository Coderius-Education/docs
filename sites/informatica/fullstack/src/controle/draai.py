"""Draai static/controleer.py tegen het referentieproject en kapotte kopieën.

Voor CI (job fullstack) en lokaal, in een omgeving met de packages van de
cursus (`python -m pip install "fastapi[standard]" sqlitedict`):

    python sites/informatica/fullstack/src/controle/draai.py

Wat er gebeurt, telkens met /openapi.json aan én uit:

1. Het referentieproject (het eindproject van de basis) in een tijdelijke map,
   met uvicorn erop: elk hoofdstuk van de basis moet exit-code 0 geven, ook bij
   een tweede ronde, als de databases al gevuld zijn. Daarna hetzelfde voor het
   eindproject met de uitbreidingen (uitbreidingen.py), met elk hoofdstuk.
2. Kopieën met de fouten uit kapot.py. Elk hoofdstuk met een fout moet
   exit-code 1 geven, met de verwachte ✗-regel in de uitvoer.

Verder één keer:

3. Het eindproject met het htmx-recept voor het formulier (VARIANTEN): elk
   hoofdstuk goed.
4. Het project groeit: voor elke les van de basis met een stand van main.py
   zet dit script het project neer zoals het na die les is (main.py uit het
   uitklapblok, de andere bestanden in hun laatste versie tot dan toe), en
   daarna na elke stap uit uitbreidingen.py. Telkens draait elk hoofdstuk dat
   dan af is. Wat in een vroeg hoofdstuk goed was, moet goed blijven, ook als
   vanaf Sessies de naam uit de sessie komt.
5. Elk endpoint uit de hoofdtekst van een uitbreiding staat letterlijk in het
   eindproject.

Daarnaast: zonder server exit-code 2 met een melding hoe je hem start, en
zonder (of met een onbekend) hoofdstuk de lijst.
"""

from __future__ import annotations

import ast
import os
import re
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

import uitbreidingen  # noqa: E402
from kapot import FOUTEN, VARIANTEN, maak_kopie  # noqa: E402
from uitbreidingen import STAPPEN  # noqa: E402

SITE = HIER.parent.parent
SCRIPT = SITE / "static" / "controleer.py"
STAND = re.compile(r"<summary>Zo ziet je `main\.py` er nu uit</summary>[\s\S]*?```python\n([\s\S]*?)```")
BESTAND = re.compile(
    r'<Bestand pad="([^"]+)" />\s*\n(?:\{/\*[^\n]*\*/\}\s*\n)?```(\w+)[^\n]*\n([\s\S]*?)```'
)


def hoofdstukken() -> list[str]:
    tekst = SCRIPT.read_text(encoding="utf-8")
    blok = tekst.split("HOOFDSTUKKEN = {", 1)[1].split("}", 1)[0]
    return re.findall(r'^\s*"([a-z-]+)":', blok, re.M)


def sleutels_bestaan():
    """Elke uitleg-sleutel die het script meegeeft, staat in UITLEG.

    Een tikfout in een sleutel geeft pas een KeyError als die fout bij een
    leerling optreedt; de rondes hieronder komen niet langs elke tak.
    """
    eerder = len(fouten)
    boom = ast.parse(SCRIPT.read_text(encoding="utf-8"))
    uitleg = next(
        n.value
        for n in boom.body
        if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "UITLEG"
    )
    bekend = {k.value for k in uitleg.keys}
    plek = {"fout": 2, "geen_endpoint": 2, "formulier": 2, "pagina": 1}
    gebruikt = 0
    for n in ast.walk(boom):
        if not isinstance(n, ast.Call):
            continue
        naam = getattr(n.func, "attr", getattr(n.func, "id", ""))
        if naam not in plek or len(n.args) <= plek[naam]:
            continue
        args = [n.args[plek[naam]], *(k.value for k in n.keywords if k.arg == "bij_velden")]
        for arg in ast.walk(ast.Tuple(elts=args)):
            if isinstance(arg, ast.Constant) and isinstance(arg.value, str):
                gebruikt += 1
                eis(arg.value in bekend, f"regel {n.lineno}: uitleg-sleutel {arg.value!r} staat niet in UITLEG")
    eis(gebruikt > 20, f"maar {gebruikt} uitleg-sleutels gevonden; leest deze controle het script nog?")
    if len(fouten) == eerder:
        print(f"✓ alle {gebruikt} uitleg-sleutels in het script bestaan")


def vrije_poort() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class Server:
    def __init__(self, map_: Path):
        self.map = map_
        self.poort = vrije_poort()
        self.log = map_ / "uvicorn.log"
        self.proces = None

    def __enter__(self):
        self.proces = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(self.poort)],
            cwd=self.map,
            stdout=self.log.open("w"),
            stderr=subprocess.STDOUT,
        )
        for _ in range(100):
            if self.proces.poll() is not None:
                break
            try:
                with socket.create_connection(("127.0.0.1", self.poort), timeout=0.2):
                    return self
            except OSError:
                time.sleep(0.1)
        raise SystemExit(f"uvicorn start niet in {self.map}:\n{self.log.read_text()}")

    def __exit__(self, *_):
        self.proces.terminate()
        try:
            self.proces.wait(timeout=10)
        except subprocess.TimeoutExpired:
            self.proces.kill()

    @property
    def adres(self) -> str:
        return f"http://127.0.0.1:{self.poort}"


def controleer(*args: str) -> tuple[int, str]:
    env = {**os.environ, "PYTHONIOENCODING": "utf-8"}
    r = subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        env=env,
        timeout=120,
    )
    return r.returncode, r.stdout + r.stderr


fouten: list[str] = []


def eis(voorwaarde: bool, melding: str, uitvoer: str = ""):
    if voorwaarde:
        return
    fouten.append(melding)
    print(f"FOUT: {melding}")
    if uitvoer:
        print("    " + uitvoer.replace("\n", "\n    "))


def zonder_server():
    eerder = len(fouten)
    code, uit = controleer("formulieren", "--adres", f"http://127.0.0.1:{vrije_poort()}")
    eis(code == 2, f"zonder server: exit-code {code}, verwacht 2", uit)
    eis("fastapi dev main.py" in uit, "zonder server: geen melding hoe je de server start", uit)
    code, uit = controleer()
    eis(code == 0 and all(h in uit for h in hoofdstukken()), "zonder hoofdstuk: geen lijst", uit)
    code, uit = controleer("bestaat-niet")
    eis(code == 2 and "formulieren" in uit, "onbekend hoofdstuk: geen lijst of geen exit-code 2", uit)
    if len(fouten) == eerder:
        print("✓ zonder server en zonder hoofdstuk")


def lessen_van_de_basis() -> list[str]:
    """De lessen van de basis in de volgorde van sidebars.ts, tot de eerste uitbreiding."""
    tekst = (SITE / "sidebars.ts").read_text(encoding="utf-8")
    basis = tekst.split("apiSidebar:", 1)[1].split("Uitbreiding:", 1)[0]
    return re.findall(r"'(FastAPI/[^']+)'", basis)


def lessen_na_de_basis() -> list[str]:
    """De lessen van de uitbreidingen en Afronden, in de volgorde van sidebars.ts."""
    tekst = (SITE / "sidebars.ts").read_text(encoding="utf-8")
    api = tekst.split("apiSidebar:", 1)[1].split("veiligheidSidebar:", 1)[0]
    return re.findall(r"'(FastAPI/[^']+)'", api[api.index("Uitbreiding:") :])


def hoofdtekst(les: str) -> str:
    return (SITE / "docs" / f"{les}.mdx").read_text(encoding="utf-8").split("\n## Opdrachten\n")[0]


# Wanneer is een hoofdstuk af? Bij zijn laatste les met een stand van main.py
# (de basis), of bij zijn laatste stap in uitbreidingen.py.
def volgorde() -> tuple[list[str], dict[str, str]]:
    met_stand = [
        les
        for les in lessen_van_de_basis()
        if STAND.search((SITE / "docs" / f"{les}.mdx").read_text(encoding="utf-8"))
    ]
    reeks = met_stand + [les for les, _ in STAPPEN]
    af_bij = {les.split("/")[1]: les for les in reeks}
    return reeks, af_bij


def af_op(les: str) -> list[str]:
    reeks, af_bij = volgorde()
    return [h for h in hoofdstukken() if reeks.index(af_bij[h]) <= reeks.index(les)]


def alle_goed(map_: Path, hoofdstukjes: list[str], wat: str, rondes: int = 1) -> int:
    aantal = 0
    with Server(map_) as s:
        for ronde in range(1, rondes + 1):
            for h in hoofdstukjes:
                code, uit = controleer(h, "--adres", s.adres)
                aantal += 1
                eis(code == 0 and "✗" not in uit, f"{wat}, ronde {ronde}, {h}: exit-code {code}, verwacht 0", uit)
    return aantal


def referentie(werk: Path, openapi: bool):
    soort = "met openapi" if openapi else "zonder openapi"
    eerder = len(fouten)
    reeks, _ = volgorde()
    basis = af_op(reeks[len(reeks) - len(STAPPEN) - 1])
    map_ = maak_kopie(werk / f"referentie-{'aan' if openapi else 'uit'}", openapi=openapi)
    alle_goed(map_, basis, f"referentie {soort}", rondes=2)
    map_ = maak_kopie(werk / f"eind-{'aan' if openapi else 'uit'}", openapi=openapi, eind=True)
    alle_goed(map_, hoofdstukken(), f"eindproject {soort}", rondes=2)
    if len(fouten) == eerder:
        print(f"✓ {soort}: de basis {len(basis)} hoofdstukken goed, het eindproject alle {len(hoofdstukken())}")


def varianten(werk: Path):
    eerder = len(fouten)
    alle_goed(maak_kopie(werk / "variant", VARIANTEN, eind=True), hoofdstukken(), "variant htmx-formulier")
    if len(fouten) == eerder:
        print("✓ eindproject met het htmx-formulier: elk hoofdstuk goed")


def kapot(werk: Path, openapi: bool):
    soort = "met openapi" if openapi else "zonder openapi"
    eerder = len(fouten)
    for eind, groep in sorted({(f.eind, f.groep) for f in FOUTEN}):
        deze = [f for f in FOUTEN if f.eind == eind and f.groep == groep]
        naam = f"kapot-{'eind' if eind else 'basis'}-{groep}-{'aan' if openapi else 'uit'}"
        with Server(maak_kopie(werk / naam, deze, openapi=openapi, eind=eind)) as s:
            for h in dict.fromkeys(f.hoofdstuk for f in deze):
                code, uit = controleer(h, "--adres", s.adres)
                eis(code == 1, f"{naam}, {h}: exit-code {code}, verwacht 1", uit)
                for f in deze:
                    if f.hoofdstuk == h and not any(r.startswith(f.verwacht) for r in uit.splitlines()):
                        eis(False, f"{naam}, {h}: geen regel die begint met {f.verwacht!r}", uit)
    if len(fouten) == eerder:
        print(f"✓ kapot {soort}: elke fout gevonden ({len(FOUTEN)} fouten)")


def standen(werk: Path):
    eerder = len(fouten)
    _, af_bij = volgorde()
    eis(set(af_bij) == set(hoofdstukken()), f"hoofdstukken met een stand of stap: {sorted(af_bij)}")

    bestanden: dict[str, str] = {}
    aantal = 0
    for les in lessen_van_de_basis():
        tekst = (SITE / "docs" / f"{les}.mdx").read_text(encoding="utf-8")
        for pad, taal, code in BESTAND.findall(tekst.split("\n## Opdrachten\n")[0]):
            if pad != "main.py" and (taal != "html" or code.lstrip().startswith("<!DOCTYPE")):
                bestanden[pad] = code
        m = STAND.search(tekst)
        if not m:
            continue
        map_ = werk / "standen" / les.replace("/", "_")
        map_.mkdir(parents=True)
        (map_ / "main.py").write_text(m.group(1), encoding="utf-8")
        for pad, code in bestanden.items():
            (map_ / pad).parent.mkdir(parents=True, exist_ok=True)
            (map_ / pad).write_text(code, encoding="utf-8")
        (map_ / "static").mkdir(exist_ok=True)
        (map_ / "static" / "kat.jpg").write_bytes((HIER / "referentie" / "static" / "kat.jpg").read_bytes())
        aantal += alle_goed(map_, af_op(les), f"stand na {les}")
    for les, _ in STAPPEN:
        map_ = uitbreidingen.maak(werk / "standen" / les.replace("/", "_"), tot=les)
        aantal += alle_goed(map_, af_op(les), f"stand na {les}")
    if len(fouten) == eerder:
        print(f"✓ het project groeit: {aantal} keer een af hoofdstuk op de stand van een latere les goed")


def endpoints_in_het_eindproject(werk: Path):
    """Elk endpoint uit de hoofdtekst van een uitbreiding staat in het eindproject.

    Letterlijk de laatste versie uit de lessen; een les die een endpoint
    toevoegt of verandert zonder dat uitbreidingen.py het meeneemt, valt zo op.
    """
    eerder = len(fouten)
    eind = re.sub(r"\s+", " ", uitbreidingen.maak(werk / "eind-tekst").joinpath("main.py").read_text())
    laatste: dict[str, tuple[str, str]] = {}
    for les in lessen_na_de_basis():
        for route in re.findall(r'@app\.(?:get|post|put|delete)\("[^"]+"\)', hoofdtekst(les)):
            try:
                laatste[route] = (les, uitbreidingen.endpoint(les, route))
            except uitbreidingen.Fout:
                pass  # alleen in een voorspelvraag of een los stuk met ...
    for route, (les, code) in laatste.items():
        eis(re.sub(r"\s+", " ", code).strip() in eind, f"{route} uit {les} staat niet letterlijk in het eindproject")
    if len(fouten) == eerder:
        print(f"✓ alle {len(laatste)} endpoints uit de uitbreidingen staan letterlijk in het eindproject")


def main() -> int:
    eis(len(hoofdstukken()) > 0, "geen hoofdstukken gevonden in controleer.py")
    eis(
        {f.hoofdstuk for f in FOUTEN} == set(hoofdstukken()),
        "kapot.py heeft niet voor elk hoofdstuk een fout",
    )
    with tempfile.TemporaryDirectory(prefix="controleer-fullstack-") as tmp:
        werk = Path(tmp)
        sleutels_bestaan()
        endpoints_in_het_eindproject(werk)
        zonder_server()
        for openapi in (True, False):
            referentie(werk, openapi)
            kapot(werk, openapi)
        varianten(werk)
        standen(werk)
    if fouten:
        print(f"\n{len(fouten)} fout(en)")
        return 1
    print("\nAlles goed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
