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
heet.

Hoofdstuk 10 vangt zijn toetsen niet met een decorator op maar in zijn eigen
event-lus. Die krijgt daarom een ronde synthetische KEYDOWN-events voor elke
toets die het blok noemt, en een `get_pressed()` die om en om wel en niet
ingedrukt meldt zodat een if/else-paar allebei zijn takken haalt. Een seconde
vóór de wekker komt er een QUIT langs, zodat ook `actief = False` en
`pygame.quit()` meelopen. Zonder die injectie draaide 84% van de regels in dat
hoofdstuk; nu 99% — de rest is een `global`-regel, en die levert in CPython
geen trace-event op.

Daarna gaat elke geregistreerde callback één keer af. Zonder die stap blijft de
inhoud van elke `@play.when_key_pressed`-functie ongelezen — 321 regels lesstof
waarin een tikfout ongestraft bleef staan. Wat een leerling ziet als "er gebeurt
niets als ik op spatie druk" was hier gewoon groen. Dit blijft een opstart-test
en geen speeltest: de callback draait één keer, zonder echte muis, toets of
speelsituatie.

Wat de callback-fase wél en niet vangt: alles wat een uitzondering geeft — een
onbekende naam, een verkeerd argument, een methode die niet bestaat. Níét: een
tikfout in een attribuut dat je *schrijft* (``cirkel.colour = 'red'`` maakt in
Python gewoon een nieuw attribuut aan en gaat door). Lezen van datzelfde
attribuut geeft wél een AttributeError, en dat vangt dit dus weer wel.

Markers, direct boven het blok:

    {/* niet-draaien: reden */}       runner-blok alleen compileren
                                      (bewuste runtime-fout in een les)
    {/* niet-compileren: reden */}    blok helemaal overslaan
                                      (bewuste syntaxfout, of fragment)
    {/* draaien: reden */}            kaal blok tóch uitvoeren
                                      (hoofdstuk 10: compleet programma zonder
                                      runner, want pygame draait zijn eigen lus)

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
# Hoofdstuk 10 draait niet in de browser — een pygame-voorbeeld schrijft zijn
# eigen game-loop en de stopknop krijgt die niet meer stil. Zonder runner zou
# zo'n blok terugvallen op alleen compileren, terwijl het juist de code is die
# een leerling zelf moet overtikken. Deze marker haalt hem alsnog door de
# uitvoerslag.
DRAAIEN_RE = re.compile(r"\{/\*\s*draaien:.*?\*/\}\s*$")

# Het harnas: game-loop uit, geluid/beeld naar dummy, en het blok in een
# try/except zodat een fout in de les een nette traceback en exitcode 1 geeft.
# Afsluiten gaat met os._exit: dat slaat de interpreter-teardown over, waar
# pymunks cffi-objecten anders ruis (en op sommige systemen een segfault)
# produceren die niets over de lescode zegt. Een expliciete
# play.start_program() onderaan een ouder voorbeeld wordt een no-op.
#
# De wekker is er voor hoofdstuk 10. Een pygame-ce-voorbeeld schrijft zijn eigen
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


# De wekker gaat in twee stappen. Eerst een seconde vóór het einde: dan zetten
# we een QUIT klaar, zodat de lus zichzelf netjes afsluit en `actief = False` en
# `pygame.quit()` ook meelopen. Pakt het blok die QUIT niet op, dan gooit de
# tweede stap alsnog _Genoeg. Zo krijgt een voorbeeld zijn volle looptijd én is
# zijn afsluitpad gedekt.
_stoppen = {{'ja': False}}
_fase = {{'n': 0}}


def _wekker(_nummer, _frame):
    _fase['n'] += 1
    if _fase['n'] == 1:
        _stoppen['ja'] = True
        _signal.alarm(1)
        return
    raise _Genoeg


_signal.signal(_signal.SIGALRM, _wekker)

_BRON = open('blok.py').read()

# Hoofdstuk 10 vangt zijn toetsen zelf op, in de event-lus, en niet met een
# decorator. De callback-fase hieronder raakt die dus niet: `if event.key ==
# pygame.K_SPACE:` en de regel eronder draaiden nooit, terwijl dat juist is
# waar zo'n les over gaat. Daarom voeren we de lus zelf toetsen: één ronde met
# een KEYDOWN voor elke toets die het blok noemt, daarna een QUIT zodat ook het
# afsluitpad meeloopt. Bij een blok zonder pygame gebeurt er niets.
if 'import pygame' in _BRON:
    import re as _re

    import pygame as _pg

    _pg.init()
    # Geen woordgrens in dit patroon: HARNAS is een gewone string, dus een
    # `\\b` zou hier een backspace-teken worden en dan matcht de regex niets —
    # precies de stille no-op die deze injectie moest voorkomen.
    _TOETSEN = [
        getattr(_pg, _naam)
        for _naam in sorted(set(_re.findall('K_[A-Za-z0-9_]+', _BRON)))
        if hasattr(_pg, _naam)
    ]
    if 'K_' in _BRON and not _TOETSEN:
        print('geen toetsen herkend terwijl het blok er wel noemt', file=_sys.stderr)
        _os._exit(1)
    _echte_get = _pg.event.get
    _ronde = {{'n': 0}}

    def _get(*args, **kwargs):
        _ronde['n'] += 1
        if _ronde['n'] == 1 and _TOETSEN:
            return [_pg.event.Event(_pg.KEYDOWN, key=_k, unicode='', mod=0) for _k in _TOETSEN] + [
                _pg.event.Event(_pg.KEYUP, key=_k, mod=0) for _k in _TOETSEN
            ]
        if _stoppen['ja']:
            return [_pg.event.Event(_pg.QUIT)]
        return _echte_get(*args, **kwargs)

    _pg.event.get = _get

    # get_pressed() leest de echte toetsenbordstaat en is headless altijd leeg.
    # Een les die daarmee beweegt ("zolang je pijltje links indrukt") zou dus
    # nooit bewegen. Deze variant meldt precies de toetsen die het blok noemt.
    class _Ingedrukt:
        def __init__(self, _aan):
            self._aan = _aan

        def __getitem__(self, _k):
            return self._aan and _k in _TOETSEN

        def __len__(self):
            return 512

    # Om en om ingedrukt: anders wint bij `if shift: ... else: ...` altijd
    # dezelfde tak en blijft de andere ongelezen.
    _pg.key.get_pressed = lambda *a, **k: _Ingedrukt(_ronde['n'] % 2 == 1)

_signal.alarm(max(1, {seconden} - 1))
try:
    exec(compile(_BRON, {bron!r}, 'exec'), {{'__name__': '__main__'}})
except _Genoeg:
    pass
except BaseException:
    _signal.alarm(0)
    _tb.print_exc()
    _sys.stderr.flush()
    _os._exit(1)
_signal.alarm(0)

# Fase twee: de callbacks. Play bewaart ze op twee plekken. Toetsen, kliks op
# een vorm en when_touching gaan via de callback_manager; de UI-widgets houden
# hun functies zelf bij, want new_slider().when_changed geeft de functie
# ongewijzigd terug. Beide moeten mee, anders test je hoofdstuk 7 niet.
import asyncio as _asyncio, inspect as _inspect
from play.callback import CallbackType as _CT, callback_manager as _cm
from play.globals import globals_list as _gl2

# Argumenten raden op naam. Een when_changed-functie heet zijn parameter in de
# lessen `waarde`, een when_submit-functie `naam` of `tekst`. Staat er iets
# anders, dan krijgt hij 1 — genoeg om de regels erin uit te voeren.
# De namen die de lessen echt gebruiken, zodat een callback met iets zinnigs
# draait. Een naam die hier niet staat krijgt 1. Dat kan een blok ten onrechte
# laten omvallen (`antwoord.strip()` op een getal), maar dan wordt CI rood en
# zet je de naam erbij — een gemiste fout is erger dan een valse.
_PROEF = {{
    'active_key': 'space', 'key': 'space', 'button': 'a', 'axis': 0.5,
    'waarde': 50, 'value': 50, 'plek': 0, 'index': 0, 'aangevinkt': True,
    'tekst': 'test', 'text': 'test', 'naam': 'test', 'antwoord': 'test',
    'wall': None, 'sprite': None,
}}


def _argumenten(_fn):
    try:
        _namen = list(_inspect.signature(_fn).parameters)
    except (TypeError, ValueError):
        return []
    return [_PROEF.get(_naam, 1) for _naam in _namen]


_taken = []
for _soort in _CT:
    try:
        _cbs = _cm.get_callbacks(_soort)
    except Exception:
        continue
    if not _cbs:
        continue
    _rij = []
    if isinstance(_cbs, dict):
        for _v in _cbs.values():
            _rij += _v if isinstance(_v, list) else [_v]
    else:
        _rij = list(_cbs)
    for _item in _rij:
        # when_touching bewaart (functie, doelvorm); alleen het eerste deel
        # is aanroepbaar.
        _taken.append(_item[0] if isinstance(_item, tuple) and _item else _item)

for _sprite in list(_gl2.sprites_group):
    for _attr in ('_on_change_callbacks', '_on_submit_callbacks', '_on_click_callbacks'):
        _taken += list(getattr(_sprite, _attr, None) or [])

# De wekker begint hier opnieuw, en zonder de QUIT-stap: er is geen event-lus
# meer om netjes af te sluiten. _fase op 1 zetten laat het volgende alarm dus
# meteen _Genoeg gooien, ongeacht hoeveel stappen de vorige fase al gebruikt
# had — anders krijgt een blok dat de wekker haalde drie seconden en een blok
# dat er ruim binnen bleef er vier.
_fase['n'] = 1
_signal.alarm({seconden})
try:
    for _fn in _taken:
        if not callable(_fn):
            continue
        _uit = _fn(*_argumenten(_fn))
        if _inspect.isawaitable(_uit):
            _asyncio.get_event_loop().run_until_complete(_uit)
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
            soort = "draai" if DRAAIEN_RE.search(ervoor) else "compileer"
            blokken.append((bron, regel, m.group(1), soort))
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
