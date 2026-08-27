// De opnemer voor de stap-voor-stap-modus.
//
// Aanpak: record-then-replay, zoals pythontutor.com. De hele uitvoering wordt in
// één keer opgenomen met sys.settrace, en de UI bladert daarna door die opname.
// Dat scheelt het pauzeren en hervatten van een levende interpreter, wat in
// Pyodide op één thread niet te doen is zonder de pagina te blokkeren.
//
// De Python-broncode staat hier als string, zoals engine.js in play dat ook doet.
// Twee dingen om in de gaten te houden bij het aanpassen: geen backtick en geen
// dollar-accolade in de Python, want dit is een template literal.
//
// De namen beginnen allemaal met _stapper_ omdat deze code in dezelfde
// Pyodide-globals leeft als de gewone uitvoerknop. De leerlingcode zelf draait
// juist in een verse globals-dict: elke opname begint schoon, en de leerling
// ziet geen enkele naam uit dit bestand terug in de variabelentabel.

export const MAX_STAPPEN = 1000;

export const RECORDER = `
import json as _stapper_json
import sys as _stapper_sys
from io import StringIO as _stapper_StringIO

_STAPPER_BESTAND = '<leerling>'
_STAPPER_MAX_STAPPEN = ${MAX_STAPPEN}
_STAPPER_MAX_TEKENS = 200

# Een import of een def is geen waarde die de leerling volgt; zonder dit filter
# staat de tabel vol met math, print en de functies die hij net zelf schreef.
_STAPPER_VERBORGEN = ('module', 'function', 'builtin_function_or_method', 'type', 'method')


class _StapperGenoeg(BaseException):
    """Stopt de opname bij de stappenlimiet. Erft van BaseException zodat een
    except Exception in de lescode hem niet opeet."""


def _stapper_waarde(waarde):
    try:
        soort = type(waarde).__name__
    except Exception:
        soort = '?'
    try:
        tekst = repr(waarde)
    except Exception:
        return {'soort': soort, 'waarde': '<kan niet getoond worden>'}
    if len(tekst) > _STAPPER_MAX_TEKENS:
        tekst = tekst[:_STAPPER_MAX_TEKENS] + '...'
    return {'soort': soort, 'waarde': tekst}


def _stapper_toonbaar(naam, waarde):
    if naam.startswith('_'):
        return False
    try:
        return type(waarde).__name__ not in _STAPPER_VERBORGEN
    except Exception:
        return False


def _stapper_frames(frame):
    """De keten van leerling-frames, buitenste eerst."""
    keten = []
    huidig = frame
    while huidig is not None:
        if huidig.f_code.co_filename == _STAPPER_BESTAND:
            keten.append(huidig)
        huidig = huidig.f_back
    keten.reverse()

    uit = []
    for f in keten:
        naam = f.f_code.co_name
        variabelen = []
        for sleutel, waarde in list(f.f_locals.items()):
            if not _stapper_toonbaar(sleutel, waarde):
                continue
            item = {'naam': sleutel}
            # repr() nu, niet het object bewaren: een lijst die later groeit zou
            # anders in elke eerdere stap zijn eindwaarde tonen.
            item.update(_stapper_waarde(waarde))
            variabelen.append(item)
        uit.append({
            'naam': 'globaal' if naam == '<module>' else naam + '()',
            'variabelen': variabelen,
        })
    return uit


def _stapper_neem_op(bron):
    stappen = []
    afgekapt = [False]
    uitvoer = _stapper_StringIO()

    def noteer(frame, gebeurtenis):
        if len(stappen) >= _STAPPER_MAX_STAPPEN:
            afgekapt[0] = True
            raise _StapperGenoeg()
        stappen.append({
            'regel': frame.f_lineno,
            'gebeurtenis': gebeurtenis,
            'frames': _stapper_frames(frame),
            'uitvoerTot': len(uitvoer.getvalue()),
        })

    def tracer(frame, gebeurtenis, arg):
        # Alleen frames uit de leerlingcode. Een aanroep naar de standaard-
        # bibliotheek levert een andere filename en dus None: die wordt niet
        # gevolgd. Zonder dit filter loopt het stappenaantal in de duizenden
        # met regels die de leerling nooit heeft geschreven.
        if frame.f_code.co_filename != _STAPPER_BESTAND:
            return None
        if gebeurtenis in ('line', 'return'):
            noteer(frame, gebeurtenis)
        return tracer

    fout = None
    try:
        code = compile(bron, _STAPPER_BESTAND, 'exec')
    except SyntaxError as e:
        # Een syntaxfout haalt de uitvoering nooit, dus er is niets op te nemen.
        return _stapper_json.dumps({
            'stappen': [],
            'uitvoer': '',
            'afgekapt': False,
            'fout': {'soort': type(e).__name__, 'bericht': str(e.msg), 'regel': e.lineno or 1},
        })

    globalen = {'__name__': '__main__', '__builtins__': __builtins__}
    echte_stdout = _stapper_sys.stdout
    _stapper_sys.stdout = uitvoer
    _stapper_sys.settrace(tracer)
    try:
        exec(code, globalen)
    except _StapperGenoeg:
        pass
    except BaseException as e:
        # De diepste regel uit de leerlingcode, niet uit de bibliotheek eronder.
        regel = None
        tb = e.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == _STAPPER_BESTAND:
                regel = tb.tb_lineno
            tb = tb.tb_next
        fout = {'soort': type(e).__name__, 'bericht': str(e), 'regel': regel}
    finally:
        _stapper_sys.settrace(None)
        _stapper_sys.stdout = echte_stdout

    return _stapper_json.dumps({
        'stappen': stappen,
        'uitvoer': uitvoer.getvalue(),
        'afgekapt': afgekapt[0],
        'fout': fout,
    })
`;
