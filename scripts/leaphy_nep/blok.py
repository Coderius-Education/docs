"""Draai één codeblok uit robotica met de echte leaphymicropython en het
nagebootste bord uit deze map. Wordt per blok in een eigen proces gestart door
scripts/draai-leaphy-blokken.py; schrijft één JSON-regel met de uitkomst.

    python3 blok.py <blok.py> <map van leaphymicropython> [<vooraf.py>]
"""

import contextlib
import io
import json
import os
import sys
import time as _echt
import traceback
import types

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [HIER, sys.argv[2]]


class Klaar(BaseException):
    """De lus van het blok is lang genoeg gelopen; op het bord loopt hij door."""


MAX_SLEEP = 200  # een while True met sleep() erin
MAX_REGELS = 20_000  # een while True zonder sleep (bewust, zie de les over while)
_teller = {"sleep": 0, "regels": 0}


def sleep(s):
    if not isinstance(s, (int, float)):
        raise TypeError("can't convert %s to float" % type(s).__name__)
    _teller["sleep"] += 1
    if _teller["sleep"] > MAX_SLEEP:
        raise Klaar


_ms = [0]


def _ticks_ms():
    _ms[0] += 1
    return _ms[0]


nep_time = types.ModuleType("time")
nep_time.sleep = sleep
nep_time.sleep_ms = lambda ms: _ms.__setitem__(0, _ms[0] + ms)
nep_time.sleep_us = lambda us: None
nep_time.ticks_ms = _ticks_ms
nep_time.ticks_us = lambda: _ticks_ms() * 1000
nep_time.ticks_diff = lambda a, b: a - b
nep_time.ticks_add = lambda a, b: a + b
nep_time.time = _echt.time
nep_time.monotonic = _echt.monotonic
sys.modules["time"] = sys.modules["utime"] = nep_time
import struct

sys.modules["ustruct"] = struct

import machine

bestand = sys.argv[1]
code = open(bestand).read()
vooraf = open(sys.argv[3]).read() if len(sys.argv) > 3 else ""
verschuiving = vooraf.count("\n")


def tel(frame, gebeurtenis, arg):
    if frame.f_code.co_filename != bestand:
        return None
    if gebeurtenis == "line":
        _teller["regels"] += 1
        if _teller["regels"] > MAX_REGELS:
            raise Klaar
    return tel


uit = io.StringIO()
resultaat = {}
try:
    with contextlib.redirect_stdout(uit):
        sys.settrace(tel)
        exec(compile(vooraf + code, bestand, "exec"), {"__name__": "__main__"})
    resultaat["uitkomst"] = "klaar"
except Klaar:
    resultaat["uitkomst"] = "lus"
except BaseException as e:  # noqa: BLE001 - elke fout is een uitkomst
    sys.settrace(None)
    tb = traceback.extract_tb(e.__traceback__)
    eigen = [f for f in tb if f.filename == bestand]
    resultaat["uitkomst"] = "fout"
    resultaat["fout"] = f"{type(e).__name__}: {e}"
    resultaat["regel"] = eigen[-1].lineno - verschuiving if eigen else None
    resultaat["naam"] = e.name if isinstance(e, NameError) else None
finally:
    sys.settrace(None)
# Waarschuwingen die de bibliotheek print in plaats van een fout te geven. Geen
# "can not find device": het nagebootste bord meldt altijd elk apparaat, dus die
# komt hier nooit, en dan zou de regel dekking beloven die er niet is.
resultaat["waarschuwingen"] = sorted(
    {
        r
        for r in uit.getvalue().splitlines()
        if "Invalid channel" in r or "not possible to use pin" in r
    }
)
gebruik = {}
for gpio, wat in machine.GEBRUIK:
    gebruik.setdefault(gpio, set()).add(wat)
resultaat["pinnen"] = {g: sorted(w) for g, w in gebruik.items()}
print(json.dumps(resultaat, ensure_ascii=False))
