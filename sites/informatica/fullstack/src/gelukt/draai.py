"""Draai de Gelukt-blokken van de route Veiligheid na.

Elke les in Veiligheid eindigt met een groen blok "Gelukt als je dit ziet",
vaak met de uitvoer van een script. Vier leerling-doorlopen deden die blokken
met de hand na; dit script doet het in CI (job fullstack), zodat een les die
verandert niet stil iets anders belooft dan hij doet.

Per reeks (een map in docs/veiligheid/, in de volgorde van veiligheidSidebar)
zet het script een lege map neer en loopt het de lessen af zoals een
leerling. Wat het doet, staat in markers in de les, in dezelfde vorm als
`{/* niet-compileren: … */}`:

- `{/* bestand: pad */}` direct boven een codeblok: zet dat blok in `pad`.
- Het uitklapblok "Zo ziet je `main.py` er nu uit" is altijd `main.py`, en
  gaat in voor het eerste script van die les draait.
- `{/* erbij: pad */}` direct boven een codeblok: zet dat blok onderaan `pad`
  ("zet onderaan je script …"). `{/* bovenaan: pad */}` zet het blok erboven.
- `{/* vervang: pad */}` direct boven een codeblok: vervang in `pad` wat het
  blok vervangt ("vervang `bericht_verwijderen` tijdelijk door …"). Een blok
  dat met `@app.` of `def ` begint, vervangt de functie met dezelfde eerste
  regel; één losse regel vervangt de regel die tot de eerste `(` gelijk is.
  Vervangt een les zo `main.py`, dan geldt het uitklapblok met de stand pas
  aan het eind van de les.
- `{/* weg: a.db b.db */}`: gooi die bestanden weg (zoals de les zegt).
- `{/* draai: script.py */}` in een `<Gelukt>`: draai het script tegen de
  server en vergelijk wat het print met het eerste ```text-blok daarna, regel
  voor regel. Met `{/* draai: script.py; vrij: <regex> */}` mag wat op de
  regex past verschillen (een zout, een meettijd). Met `; deel` (vóór een
  `vrij:`) hoeft het blok maar een aaneengesloten stuk van de uitvoer te zijn
  (een les die alleen de eerste regels of de laatste regel toont).
- `{/* open: /pad */}` in een `<Gelukt>`: wat de browser op dat adres toont,
  vergeleken met het ```text-blok erna (een JSON-antwoord, een tekst).
- `{/* verstuur: /pad veld=waarde&veld=waarde */}` in een `<Gelukt>`: wat de
  browser toont na **Verstuur** in een formulier (een POST met die velden,
  zoals een browser hem stuurt), vergeleken met het ```text-blok erna.
- `{/* verstuur-ook: /pad veld=waarde&veld=waarde */}`: verstuur dat formulier,
  zonder te vergelijken (een bericht dat de les eerst laat invullen).
- `{/* draai-ook: script.py */}`: draai het script, zonder te vergelijken
  (een registratie die de les eerst laat doen).
- `{/* gelukt-met-de-hand: reden */}` in een `<Gelukt>`: dit succesmoment zie
  je in de browser of een terminal die het script niet kan nadoen.

De server is uvicorn in die map, op een poort die uvicorn zelf kiest; een
script dat `127.0.0.1:8000` noemt, krijgt die poort. Verandert `main.py`, dan
start de server opnieuw. De reeksen draaien elk in een eigen proces.

    python sites/informatica/fullstack/src/gelukt/draai.py [reeks ...]
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

HIER = Path(__file__).resolve().parent
SITE = HIER.parent.parent
VEILIGHEID = SITE / "docs" / "veiligheid"

OPSTARTEN = 30
LUISTERT = re.compile(r"Uvicorn running on http://127\.0\.0\.1:(\d+)")
MARKER = re.compile(
    r"\{/\*\s*(bestand|erbij|bovenaan|vervang|weg|draai|draai-ook|open|verstuur|verstuur-ook|gelukt-met-de-hand):\s*(.*?)\s*\*/\}"
)
FENCE = re.compile(r"^```[^\n]*\n(.*?)^```", re.M | re.S)
STAND = "<summary>Zo ziet je `main.py` er nu uit</summary>"


def reeksen() -> list[tuple[str, list[str]]]:
    """De reeksen en hun lessen, in de volgorde van veiligheidSidebar."""
    bron = (SITE / "sidebars.ts").read_text(encoding="utf-8")
    deel = bron[bron.index("veiligheidSidebar") :]
    deel = deel[: deel.index("\n  ],")]
    uit: dict[str, list[str]] = {}
    for map_, les in re.findall(r"'veiligheid/([a-z-]+)/([a-z-]+)'", deel):
        uit.setdefault(map_, []).append(les)
    return list(uit.items())


class Server:
    def __init__(self, map_: Path):
        self.map = map_
        self.poort: int | None = None
        self.proces = None
        self.main = ""

    def start(self):
        self.log = self.map / "uvicorn.log"
        self.logbestand = self.log.open("w")
        self.main = (self.map / "main.py").read_text(encoding="utf-8")
        self.proces = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "0"],
            cwd=self.map,
            stdout=self.logbestand,
            stderr=subprocess.STDOUT,
        )
        tot = time.monotonic() + OPSTARTEN
        while time.monotonic() < tot and self.proces.poll() is None:
            m = LUISTERT.search(self.log.read_text(encoding="utf-8", errors="replace"))
            if m:
                self.poort = int(m.group(1))
                return
            time.sleep(0.05)
        self.stop()
        raise RuntimeError(f"uvicorn start niet:\n{self.log.read_text()}")

    def zorg_dat_hij_draait(self):
        main = (self.map / "main.py").read_text(encoding="utf-8")
        if self.proces is not None and self.proces.poll() is None and main == self.main:
            return
        self.stop()
        self.start()

    def stop(self):
        if self.proces is None:
            return
        self.proces.terminate()
        try:
            self.proces.wait(timeout=10)
        except subprocess.TimeoutExpired:
            self.proces.kill()
            self.proces.wait()
        self.logbestand.close()
        self.proces = None


def stappen(tekst: str) -> list[tuple[str, str, str | None]]:
    """De markers van een les op volgorde: (soort, waarde, codeblok erna)."""
    uit = []
    for m in MARKER.finditer(tekst):
        rest = tekst[m.end() :]
        blok = None
        if m.group(1) in ("bestand", "erbij", "bovenaan", "vervang"):
            f = FENCE.search(rest)
            # Een andere marker ertussen (route-dubbel, niet-compileren) mag.
            tussen = re.sub(r"\{/\*.*?\*/\}", "", rest[: f.start()] if f else "", flags=re.S)
            if f is None or tussen.strip() not in ("", "<CodeUitleg>"):
                raise ValueError(f"{m.group(1)}: {m.group(2)} staat niet direct boven een codeblok")
            blok = f.group(1)
        elif m.group(1) in ("draai", "open", "verstuur"):
            einde = rest.find("</Gelukt>")
            f = FENCE.search(rest, 0, einde if einde != -1 else len(rest))
            if f is None or not rest[f.start() :].startswith("```text"):
                raise ValueError(f"draai: {m.group(2)} heeft geen ```text-blok in het Gelukt-blok")
            blok = f.group(1)
        uit.append((m.group(1), m.group(2), blok))
    return uit


def stand(tekst: str) -> str | None:
    i = tekst.find(STAND)
    if i == -1:
        return None
    f = FENCE.search(tekst, i)
    return f.group(1) if f else None


def vervang(oud: str, blok: str) -> str:
    """Zet `blok` in `oud` op de plek van de functie of regel die het vervangt."""
    regels = oud.split("\n")
    nieuw = blok.rstrip("\n").split("\n")
    if nieuw[0].startswith(("@app.", "def ")):
        begin = [i for i, r in enumerate(regels) if r == nieuw[0]]
        if len(begin) != 1:
            raise ValueError(f"vervang: {nieuw[0]!r} staat {len(begin)} keer in het bestand")
        eind = begin[0] + 1
        while eind < len(regels) and not regels[eind].startswith(("@app.", "def ")):
            eind += 1
        while eind > begin[0] + 1 and regels[eind - 1].strip() == "":
            eind -= 1
        return "\n".join(regels[: begin[0]] + nieuw + regels[eind:])
    if len(nieuw) != 1 or "(" not in nieuw[0]:
        raise ValueError("vervang: geef een functie of één regel met een (")
    kop = nieuw[0][: nieuw[0].index("(")]
    plek = [i for i, r in enumerate(regels) if r.startswith(kop + "(")]
    if len(plek) != 1:
        raise ValueError(f"vervang: {kop!r} staat {len(plek)} keer in het bestand")
    regels[plek[0]] = nieuw[0]
    return "\n".join(regels)


def vergelijk(verwacht: str, kreeg: str, vrij: str | None, deel: bool = False) -> list[str]:
    a = [r.rstrip() for r in verwacht.strip("\n").split("\n")]
    b = [r.rstrip() for r in kreeg.strip("\n").split("\n")]
    if vrij:
        a = [re.sub(vrij, "…", r) for r in a]
        b = [re.sub(vrij, "…", r) for r in b]
    if a == b:
        return []
    if deel and any(b[i : i + len(a)] == a for i in range(len(b) - len(a) + 1)):
        return []
    return [f"    verwacht: {x!r}\n    kreeg:    {y!r}" for x, y in zip_lang(a, b) if x != y][:5]


def zip_lang(a, b):
    for i in range(max(len(a), len(b))):
        yield (a[i] if i < len(a) else None, b[i] if i < len(b) else None)


def draai_script(map_: Path, naam: str, poort: int) -> str:
    pad = map_ / naam
    code = pad.read_text(encoding="utf-8")
    pad.write_text(
        code.replace("127.0.0.1:8000", f"127.0.0.1:{poort}").replace(
            "localhost:8000", f"localhost:{poort}"
        ),
        encoding="utf-8",
    )
    try:
        r = subprocess.run(
            [sys.executable, naam],
            cwd=map_,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=180,
        )
    finally:
        pad.write_text(code, encoding="utf-8")
    return r.stdout + (r.stderr if r.returncode else "")


def haal(poort: int, pad: str, formulier: str | None = None) -> str:
    """GET op pad, of met formulier (veld=waarde&…) een POST zoals een browser."""
    data = formulier.encode("utf-8") if formulier is not None else None
    verzoek = urllib.request.Request(f"http://127.0.0.1:{poort}{pad}", data=data)
    try:
        with urllib.request.urlopen(verzoek, timeout=30) as r:
            return r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.read().decode("utf-8")


def doe_reeks(reeks: str, lessen: list[str]) -> tuple[str, list[str], int]:
    fouten: list[str] = []
    gedaan = 0
    with tempfile.TemporaryDirectory(prefix=f"gelukt-{reeks}-") as tmp:
        map_ = Path(tmp)
        server = Server(map_)
        try:
            for les in lessen:
                if les == "praktijk":
                    continue
                naam = f"{reeks}/{les}"
                tekst = (VEILIGHEID / reeks / f"{les}.mdx").read_text(encoding="utf-8")
                nieuwe_main = stand(tekst)
                main_gezet = False
                tijdelijk = False
                for soort, waarde, blok in stappen(tekst):
                    if soort == "bestand":
                        doel = map_ / waarde
                        doel.parent.mkdir(parents=True, exist_ok=True)
                        doel.write_text(blok, encoding="utf-8")
                    elif soort == "bovenaan":
                        doel = map_ / waarde
                        doel.write_text(blok + doel.read_text(encoding="utf-8"), encoding="utf-8")
                    elif soort == "erbij":
                        doel = map_ / waarde
                        doel.write_text(doel.read_text(encoding="utf-8") + "\n" + blok, encoding="utf-8")
                    elif soort == "vervang":
                        doel = map_ / waarde
                        doel.write_text(vervang(doel.read_text(encoding="utf-8"), blok), encoding="utf-8")
                        if waarde == "main.py":
                            main_gezet = tijdelijk = True
                    elif soort == "weg":
                        for bestand in waarde.split():
                            (map_ / bestand).unlink(missing_ok=True)
                    elif soort == "verstuur-ook":
                        if nieuwe_main is not None and not main_gezet:
                            (map_ / "main.py").write_text(nieuwe_main, encoding="utf-8")
                            main_gezet = True
                        server.zorg_dat_hij_draait()
                        pad, _, velden = waarde.partition(" ")
                        haal(server.poort, pad, velden.strip())
                    elif soort in ("open", "verstuur"):
                        if nieuwe_main is not None and not main_gezet:
                            (map_ / "main.py").write_text(nieuwe_main, encoding="utf-8")
                            main_gezet = True
                        server.zorg_dat_hij_draait()
                        gedaan += 1
                        pad, _, velden = waarde.partition(" ")
                        formulier = velden.strip() if soort == "verstuur" else None
                        verschil = vergelijk(blok, haal(server.poort, pad, formulier), None)
                        if verschil:
                            fouten.append(f"✗ {naam}: {soort} {waarde}\n" + "\n".join(verschil))
                    elif soort in ("draai", "draai-ook"):
                        if nieuwe_main is not None and not main_gezet:
                            (map_ / "main.py").write_text(nieuwe_main, encoding="utf-8")
                            main_gezet = True
                        script, _, optie = waarde.partition(";")
                        vrij = optie.split("vrij:", 1)[1].strip() if "vrij:" in optie else None
                        deel = "deel" in [o.strip() for o in optie.split(";")]
                        server.zorg_dat_hij_draait()
                        uitvoer = draai_script(map_, script.strip(), server.poort)
                        if soort == "draai":
                            gedaan += 1
                            verschil = vergelijk(blok, uitvoer, vrij, deel)
                            if verschil:
                                fouten.append(f"✗ {naam}: {script.strip()}\n" + "\n".join(verschil))
                if nieuwe_main is not None and (tijdelijk or not main_gezet):
                    (map_ / "main.py").write_text(nieuwe_main, encoding="utf-8")
        except Exception as e:  # noqa: BLE001
            fouten.append(f"✗ {reeks}: {e}")
        finally:
            server.stop()
    return reeks, fouten, gedaan


def main(argv: list[str]) -> int:
    alle = reeksen()
    gekozen = [r for r in alle if not argv or r[0] in argv]
    met_fouten = 0
    with ProcessPoolExecutor(max_workers=len(gekozen) or 1) as pool:
        for reeks, fouten, gedaan in pool.map(doe_reeks, *zip(*gekozen)):
            if fouten:
                met_fouten += len(fouten)
                print(f"{reeks}: {len(fouten)} van {gedaan} Gelukt-blokken kloppen niet")
                for f in fouten:
                    print(f)
            else:
                print(f"✓ {reeks}: {gedaan} Gelukt-blokken kloppen")
    return 1 if met_fouten else 0


if __name__ == "__main__":
    shutil.rmtree(HIER / "__pycache__", ignore_errors=True)
    sys.exit(main(sys.argv[1:]))
