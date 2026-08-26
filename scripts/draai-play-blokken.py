"""Voert elk speeltuin-codeblok uit de play-docs echt uit.

De lessen tonen code in twee vormen, en die krijgen elk hun eigen diepte:

- ``<PygbagRunner code={`...`}>``-blokken draaien in de browser, dus die worden
  hier ook echt uitgevoerd — tegen de gebundelde wheel uit static/whl/, dezelfde
  die de speeltuin serveert. Dat vangt verkeerde argumenten en kapotte
  callbacks, niet alleen tikfouten in namen.
- Kale ```python-blokken worden alleen gecompileerd (zoals robotica en
  fullstack doen): die mogen bestanden of context veronderstellen die hier
  niet bestaat.

Uitvoeren gebeurt headless (SDL dummy) met de game-loop van play uitgeschakeld:
module-niveau-code draait, decorators registreren hun callbacks, maar er start
geen eindeloze lus. Een pygame-ce-voorbeeld schrijft zijn lus wél zelf; die
krijgt een paar seconden en wordt daarna afgebroken zonder dat het een fout
heet. Interactie (kliks, toetsen) blijft buiten beeld — dit is een opstart-test,
geen speeltest.

Markers, direct boven het blok:

    {/* niet-draaien: reden */}       runner-blok alleen compileren
                                      (bewuste runtime-fout in een les)
    {/* niet-compileren: reden */}    blok helemaal overslaan
                                      (bewuste syntaxfout, of fragment)

Aanroep vanuit de repo-root:

    python3 scripts/draai-play-blokken.py

Afsluitcode 0 als alles slaagt, 1 zodra er iets misgaat.
"""

import re
import subprocess
import sys
import tempfile
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "sites" / "play"
DOCS = SITE / "docs"
ENGINE = SITE / "src" / "components" / "CodeRunner" / "engine.js"

RUNNER_RE = re.compile(r"<PygbagRunner code=\{`(.*?)`\}", re.S)
KAAL_RE = re.compile(r"```python[^\n]*\n(.*?)```", re.S)
NIET_DRAAIEN_RE = re.compile(r"\{/\*\s*niet-draaien:.*?\*/\}\s*$")
NIET_COMPILEREN_RE = re.compile(r"\{/\*\s*niet-compileren:.*?\*/\}\s*$")

# Het harnas: game-loop uit, geluid/beeld naar dummy, en het blok in een
# try/except zodat een fout in de les een nette traceback en exitcode 1 geeft.
# Afsluiten gaat met os._exit: dat slaat de interpreter-teardown over, waar
# pymunks cffi-objecten anders ruis (en op sommige systemen een segfault)
# produceren die niets over de lescode zegt. Een expliciete
# play.start_program() onderaan een ouder voorbeeld wordt een no-op.
#
# De wekker is er voor hoofdstuk 7. Een pygame-ce-voorbeeld schrijft zijn eigen
# `while actief:` en die loopt hier, zonder venster om op het kruisje te
# klikken, nooit af. In de browser is dat precies goed — daar draait het spel
# tot de leerling op stop drukt. Hier is de vraag een andere: start het, en
# overleeft het een paar seconden draaien. Haalt het blok de wekker, dan is het
# antwoord ja. _Genoeg erft van BaseException zodat een `except Exception` in de
# lescode hem niet opeet.
WEKKER_SECONDEN = 3

HARNAS = """\
import os as _os, signal as _signal, sys as _sys, traceback as _tb
_os.environ.setdefault('SDL_VIDEODRIVER', 'dummy')
_os.environ.setdefault('SDL_AUDIODRIVER', 'dummy')
_sys.path.insert(0, {wheel_map!r})
from play.globals import globals_list as _gl
_gl.should_auto_start = False
_gl.start_program_fn = lambda: None
import play as _play
_play.start_program = lambda: None
_play.api.utils.start_program = lambda: None


class _Genoeg(BaseException):
    pass


_signal.signal(_signal.SIGALRM, lambda _nummer, _frame: (_ for _ in ()).throw(_Genoeg()))
_signal.alarm({seconden})
try:
    exec(compile(open('blok.py').read(), {bron!r}, 'exec'), {{'__name__': '__main__'}})
except _Genoeg:
    pass
except BaseException:
    _signal.alarm(0)
    _tb.print_exc()
    _sys.stderr.flush()
    _os._exit(1)
_signal.alarm(0)
_sys.stdout.flush(); _sys.stderr.flush()
_os._exit(0)
"""


def wheel_pad() -> Path:
    m = re.search(r"PLAY_WHEEL = '/whl/([^']+)'", ENGINE.read_text())
    if not m:
        sys.exit("PLAY_WHEEL niet gevonden in engine.js")
    pad = SITE / "static" / "whl" / m.group(1)
    if not pad.exists():
        sys.exit(f"wheel {pad} bestaat niet")
    return pad


def verzamel():
    """Alle blokken uit de docs: (bron, regel, code, soort)."""
    blokken = []
    for pad in sorted(DOCS.rglob("*.md")) + sorted(DOCS.rglob("*.mdx")):
        tekst = pad.read_text()
        bron = pad.relative_to(ROOT)
        for m in RUNNER_RE.finditer(tekst):
            regel = tekst[: m.start()].count("\n") + 1
            ervoor = tekst[: m.start()].rstrip()
            # Een les over foutmeldingen toont bewust kapotte code. Runtime-fout
            # -> niet-draaien (compileren moet nog lukken); syntaxfout ->
            # niet-compileren (helemaal overslaan).
            if NIET_COMPILEREN_RE.search(ervoor):
                continue
            soort = "compileer" if NIET_DRAAIEN_RE.search(ervoor) else "draai"
            blokken.append((bron, regel, m.group(1), soort))
        for m in KAAL_RE.finditer(tekst):
            regel = tekst[: m.start()].count("\n") + 1
            ervoor = tekst[: m.start()].rstrip()
            if NIET_COMPILEREN_RE.search(ervoor):
                continue
            blokken.append((bron, regel, m.group(1), "compileer"))
    return blokken


def compileer(bron, regel, code) -> str | None:
    try:
        compile(code, str(bron), "exec")
        return None
    except SyntaxError as e:
        return f"{bron}:{regel + (e.lineno or 1)}: {e.msg}"


def draai(bron, regel, code, wheel_map: str) -> str | None:
    fout = compileer(bron, regel, code)
    if fout:
        return fout
    # Eigen werkmap per blok: voorbeelden met new_database schrijven een
    # json-bestand en mogen elkaar niet zien.
    with tempfile.TemporaryDirectory() as werkmap:
        (Path(werkmap) / "blok.py").write_text(code)
        harnas = Path(werkmap) / "harnas.py"
        harnas.write_text(
            HARNAS.format(wheel_map=wheel_map, bron=str(bron), seconden=WEKKER_SECONDEN)
        )
        try:
            r = subprocess.run(
                [sys.executable, str(harnas)],
                capture_output=True,
                text=True,
                timeout=60,
                cwd=werkmap,
            )
        except subprocess.TimeoutExpired:
            return f"{bron}:{regel}: blok draait na 60s nog — start hier een lus?"
    if r.returncode != 0:
        kern = next(
            (rgl for rgl in reversed(r.stderr.strip().splitlines()) if rgl.strip()),
            f"exitcode {r.returncode}",
        )
        return f"{bron}:{regel}: {kern}"
    return None


def main() -> int:
    blokken = verzamel()
    te_draaien = [b for b in blokken if b[3] == "draai"]
    te_compileren = [b for b in blokken if b[3] == "compileer"]

    with tempfile.TemporaryDirectory() as wheel_map:
        zipfile.ZipFile(wheel_pad()).extractall(wheel_map)

        fouten = [f for b in te_compileren if (f := compileer(b[0], b[1], b[2]))]

        with ThreadPoolExecutor(max_workers=8) as pool:
            resultaten = pool.map(lambda b: draai(b[0], b[1], b[2], wheel_map), te_draaien)
            fouten += [f for f in resultaten if f]

    for fout in fouten:
        print(fout)
    print(
        f"Uitgevoerd: {len(te_draaien)} speeltuin-blokken, "
        f"gecompileerd: {len(te_compileren)} overige — {len(fouten)} fouten."
    )
    return 1 if fouten else 0


if __name__ == "__main__":
    sys.exit(main())
