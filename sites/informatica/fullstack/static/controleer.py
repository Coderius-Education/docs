"""Controleer je FastAPI-server per hoofdstuk van de fullstack-cursus.

Zet dit bestand naast je main.py. Start je server in de terminal van VS Code
met `fastapi dev main.py`, open een tweede terminal en typ:

    python controleer.py <hoofdstuk>
    python controleer.py <hoofdstuk> --adres http://127.0.0.1:8001

Zonder hoofdstuk zie je de lijst met hoofdstukken. Het script gebruikt alleen
de standaardbibliotheek van Python (3.10 of nieuwer).

Exit-code: 0 als alles goed is, 1 bij een fout in je server, 2 als je server
niet bereikbaar is of het hoofdstuk niet bestaat.
"""

from __future__ import annotations

import argparse
import difflib
import http.cookiejar
import json
import random
import re
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from html.parser import HTMLParser

CURSUS = "https://informatica.coderius.nl/fullstack"

# De hoofdstukken van de basis die een server hebben, in de volgorde van de
# cursus. De sleutel is de map van het hoofdstuk, de waarde de titel in de
# zijbalk. Gegevens opslaan (sqlitedict) heeft geen server en staat er niet in.
HOOFDSTUKKEN = {
    "eerste-server": "Je eerste server",
    "paginas": "Losse pagina's en routes",
    "veel-paginas": "Eén route voor veel pagina's",
    "css-en-afbeeldingen": "CSS en afbeeldingen",
    "formulieren": "Templates en formulieren",
    "berichten-opslaan": "Berichten opslaan",
    "berichten-tonen": "Berichten tonen",
    "berichten-verwijderen": "Berichten verwijderen",
    "accounts": "Accounts",
}

# Waar de uitleg staat bij elke fout: een pagina van de cursus, met een anker
# naar de kop.
UITLEG = {
    "start": "docs/troubleshooting#je-eerste-server",
    "endpoints": "docs/FastAPI/eerste-server/eerste_endpoint#meerdere-endpoints",
    "html-tonen": "docs/FastAPI/paginas/html_tonen#een-html-pagina-tonen",
    "fileresponse": "docs/FastAPI/paginas/html_bestanden#fileresponse-gebruiken",
    "paginas": "docs/troubleshooting#losse-paginas-en-routes",
    "a-tag": "docs/FastAPI/paginas/links#de-a-tag",
    "dier": "docs/FastAPI/veel-paginas/path-parameters#de-tekst-opzoeken",
    "dier-fout": "docs/FastAPI/veel-paginas/path-parameters#er-gaat-iets-mis",
    "query": "docs/FastAPI/veel-paginas/query-parameters#na-een-vraagteken",
    "css-koppelen": "docs/FastAPI/css-en-afbeeldingen/static_files#css-koppelen-aan-je-pagina",
    "img": "docs/FastAPI/css-en-afbeeldingen/afbeeldingen#de-img-tag",
    "static-mis": "docs/FastAPI/css-en-afbeeldingen/verzoek-static#als-het-misgaat",
    "template": "docs/FastAPI/formulieren/templates#een-dobbelsteen-op-een-pagina",
    "template-lege-plek": "docs/FastAPI/formulieren/templates#een-lege-plek-op-de-pagina",
    "template-niet-gevonden": "docs/FastAPI/formulieren/templates#templatenotfound",
    "formulier": "docs/FastAPI/formulieren/forms#het-formulier",
    "formulier-endpoints": "docs/FastAPI/formulieren/forms#de-endpoints",
    "formulier-mis": "docs/troubleshooting#templates-jinja2",
    "groet": "docs/FastAPI/formulieren/post_met_templates#voorbeeld",
    "naam-terug": "docs/FastAPI/berichten-opslaan/naam-opslaan#data-terug-lezen",
    "eigen-sleutel": "docs/FastAPI/berichten-opslaan/eigen-sleutel#een-nieuwe-sleutel-per-bericht",
    "redirect": "docs/FastAPI/berichten-opslaan/redirect#redirectresponse",
    "redirect-303": "docs/FastAPI/berichten-opslaan/redirect#waarom-303",
    "opslaan-mis": "docs/troubleshooting#berichten-opslaan",
    "lijst-template": "docs/FastAPI/berichten-tonen/lijst_tonen#de-data-meesturen",
    "tonen-mis": "docs/troubleshooting#berichten-tonen",
    "detail-link": "docs/FastAPI/berichten-tonen/detailpagina#linken-vanuit-de-lijst",
    "detail": "docs/FastAPI/berichten-tonen/detailpagina#het-bericht-opzoeken",
    "niet-gevonden": "docs/FastAPI/berichten-tonen/niet-gevonden#zeggen-dat-het-niet-bestaat",
    "verwijderen": "docs/FastAPI/berichten-verwijderen/verwijderen#het-endpoint",
    "verwijder-formulier": "docs/FastAPI/berichten-verwijderen/verwijderen#een-formulier-per-bericht",
    "registreer-formulier": "docs/FastAPI/accounts/registreren#het-formulier",
    "registreer-422": "docs/FastAPI/accounts/registreren#422-na-account-maken",
    "registreer": "docs/FastAPI/accounts/registreren#het-account-opslaan",
    "inloggen-formulier": "docs/FastAPI/accounts/inloggen#het-formulier",
    "inloggen-422": "docs/FastAPI/accounts/inloggen#422-na-verstuur",
    "inloggen": "docs/FastAPI/accounts/inloggen#de-controle",
    "inloggen-401": "docs/FastAPI/accounts/inloggen#401-met-het-goede-wachtwoord",
}

WACHTTIJD = 10
VAST_ACCOUNT = "controle-0000"


def link(sleutel: str) -> str:
    return f"{CURSUS}/{UITLEG[sleutel]}"


# ── Verzoeken ────────────────────────────────────────────────────────────────


class ServerWeg(Exception):
    """De server antwoordt niet (meer)."""

    def __init__(self, reden: str, traag: bool = False):
        super().__init__(reden)
        self.traag = traag


class Stop(Exception):
    """Een controle ging mis waar de rest van het hoofdstuk op bouwt."""


@dataclass
class Antwoord:
    status: int
    headers: dict
    tekst: str

    @property
    def soort(self) -> str:
        return self.headers.get("content-type", "")

    @property
    def is_html(self) -> bool:
        return "text/html" in self.soort

    @property
    def is_json(self) -> bool:
        return "application/json" in self.soort

    def json(self):
        try:
            return json.loads(self.tekst)
        except ValueError:
            return None

    @property
    def locatie(self) -> str:
        return urllib.parse.urlsplit(self.headers.get("location", "")).path

    @property
    def niet_gevonden(self) -> bool:
        """Een 404 omdat geen endpoint bij het pad past, niet een 404 van je eigen code."""
        if self.status != 404:
            return False
        detail = (self.json() or {}).get("detail") if self.is_json else None
        return detail is None or detail == "Not Found"


class NietDoorsturen(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


class Server:
    def __init__(self, adres: str):
        self.adres = adres.rstrip("/")
        self.opener = urllib.request.build_opener(
            urllib.request.ProxyHandler({}),
            urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()),
            NietDoorsturen(),
        )
        self._routes = None
        self._routes_geladen = False

    def verzoek(self, methode: str, pad: str, velden: dict | None = None) -> Antwoord:
        data = urllib.parse.urlencode(velden).encode() if velden is not None else None
        req = urllib.request.Request(self.adres + pad, data=data, method=methode)
        if data is not None:
            req.add_header("Content-Type", "application/x-www-form-urlencoded")
        try:
            with self.opener.open(req, timeout=WACHTTIJD) as r:
                return Antwoord(r.status, _kop(r.headers), r.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as e:
            return Antwoord(e.code, _kop(e.headers), e.read().decode("utf-8", "replace"))
        except (urllib.error.URLError, ConnectionError, socket.timeout, TimeoutError) as e:
            reden = getattr(e, "reason", e)
            traag = isinstance(reden, (socket.timeout, TimeoutError))
            raise ServerWeg(str(reden), traag) from e

    def get(self, pad: str) -> Antwoord:
        return self.verzoek("GET", pad)

    def post(self, pad: str, velden: dict) -> Antwoord:
        return self.verzoek("POST", pad, velden)

    # De routes uit /openapi.json, of None als die uit staat.
    @property
    def routes(self) -> dict | None:
        if not self._routes_geladen:
            self._routes_geladen = True
            r = self.get("/openapi.json")
            spec = r.json() if r.status == 200 else None
            if isinstance(spec, dict) and isinstance(spec.get("paths"), dict):
                self._routes = {}
                for pad, methodes in spec["paths"].items():
                    for methode, info in methodes.items():
                        self._routes[(methode.upper(), pad)] = _velden_uit_spec(spec, info)
        return self._routes

    def _route(self, methode: str, pad: str):
        """De route uit /openapi.json; de naam tussen {} telt niet mee."""
        kaal = re.sub(r"\{[^}]*\}", "{}", pad)
        for (m, p), velden in (self.routes or {}).items():
            if m == methode and re.sub(r"\{[^}]*\}", "{}", p) == kaal:
                return velden
        return None

    def bestaat(self, methode: str, pad: str) -> bool:
        """Heeft de server een endpoint voor deze methode en dit pad?"""
        if self.routes is not None:
            return self._route(methode, pad) is not None
        voorbeeld = re.sub(r"\{[^}]+\}", "controle", pad)
        if methode == "GET":
            return not self.get(voorbeeld).niet_gevonden
        # Een POST zonder velden: een endpoint met verplichte velden weigert
        # hem met 422 voordat je code draait.
        r = self.post(voorbeeld, {})
        return r.status not in (404, 405)

    def velden(self, methode: str, pad: str) -> list[str] | None:
        """De verplichte formuliervelden van een endpoint; None als het niet bestaat."""
        if self.routes is not None:
            return self._route(methode, pad)
        r = self.post(pad, {})
        if r.status in (404, 405):
            return None
        detail = (r.json() or {}).get("detail") if r.status == 422 else None
        if not isinstance(detail, list):
            return []
        return [
            str(d["loc"][1])
            for d in detail
            if isinstance(d, dict) and d.get("type") == "missing" and d.get("loc", [""])[0] == "body"
        ]

    def wel(self, methode: str, pad: str) -> str:
        """Een zin met de endpoints die wel bestaan, als /openapi.json aan staat."""
        if self.routes is None:
            return ""
        alle = sorted({p for (m, p) in self.routes if m == methode and not p.startswith("/openapi")})
        if not alle:
            return f" Je server heeft nog geen enkel {methode}-endpoint."
        lijkt = difflib.get_close_matches(pad, alle, n=4, cutoff=0.5)
        toon = lijkt or alle[:8]
        meer = ", …" if not lijkt and len(alle) > 8 else ""
        return " Wel: " + ", ".join(f"{methode} {p}" for p in toon) + meer + "."


def _kop(headers) -> dict:
    return {k.lower(): v for k, v in headers.items()}


def _velden_uit_spec(spec: dict, info: dict) -> list[str]:
    inhoud = (info.get("requestBody") or {}).get("content") or {}
    schema = (
        inhoud.get("application/x-www-form-urlencoded") or inhoud.get("multipart/form-data") or {}
    ).get("schema", {})
    ref = schema.get("$ref", "")
    if ref.startswith("#/components/schemas/"):
        schema = spec.get("components", {}).get("schemas", {}).get(ref.rsplit("/", 1)[1], {})
    return list(schema.get("required", []))


# ── HTML lezen ───────────────────────────────────────────────────────────────


@dataclass
class Formulier:
    actie: str | None
    methode: str
    velden: list[str] = field(default_factory=list)
    waarden: dict = field(default_factory=dict)


class Pagina(HTMLParser):
    """De formulieren, links, stylesheets en afbeeldingen op een pagina."""

    def __init__(self, html: str):
        super().__init__()
        self.formulieren: list[Formulier] = []
        self.links: list[str] = []
        self.stylesheets: list[str] = []
        self.afbeeldingen: list[str] = []
        self._open: Formulier | None = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        a = {k: (v or "") for k, v in attrs}
        if tag == "form":
            self._open = Formulier(a.get("action"), a.get("method", "get").lower())
            self.formulieren.append(self._open)
        elif tag in ("input", "textarea", "select", "button") and self._open and a.get("name"):
            self._open.velden.append(a["name"])
            self._open.waarden.setdefault(a["name"], a.get("value", ""))
        elif tag == "a" and a.get("href"):
            self.links.append(a["href"])
        elif tag == "link" and "stylesheet" in a.get("rel", "").lower() and a.get("href"):
            self.stylesheets.append(a["href"])
        elif tag == "img" and a.get("src"):
            self.afbeeldingen.append(a["src"])

    def handle_endtag(self, tag):
        if tag == "form":
            self._open = None


def lokaal(pad: str, href: str) -> str | None:
    """Het pad op je eigen server waar een href naartoe wijst, of None."""
    delen = urllib.parse.urlsplit(urllib.parse.urljoin(pad, href))
    if delen.scheme or delen.netloc or not delen.path:
        return None
    return delen.path + (f"?{delen.query}" if delen.query else "")


def opsomming(woorden) -> str:
    woorden = list(woorden)
    if len(woorden) <= 1:
        return "".join(woorden)
    return ", ".join(woorden[:-1]) + " en " + woorden[-1]


# ── De controle ──────────────────────────────────────────────────────────────


class Controle:
    def __init__(self, server: Server):
        self.s = server
        self.goed = 0
        self.totaal = 0
        self.marker = f"controle-{random.randint(1000, 9999)}"
        # Berichten schrijft het script onder een vast account, zodat er
        # niet bij elke controle een account bij komt. Alleen het hoofdstuk
        # accounts maakt een nieuw account met de marker als naam.
        self.account_naam = VAST_ACCOUNT
        self.account = False
        self.schrijver = self.marker
        self.achteraf: list[str] = []

    @property
    def wachtwoord(self) -> str:
        return f"{self.account_naam}-wachtwoord"

    # Uitvoer
    def ok(self, tekst: str):
        self.totaal += 1
        self.goed += 1
        print(f"✓ {tekst}")

    def fout(self, tekst: str, uitleg: str, sleutel: str):
        self.totaal += 1
        print(f"✗ {tekst}")
        print(f"    {uitleg}")
        print(f"    Uitleg: {link(sleutel)}")

    # Hulp bij statuscodes
    def status_zin(self, r: Antwoord, wat: str) -> str:
        if r.status == 500:
            return (
                f"{wat} geeft 500 Internal Server Error: er ging iets mis in je Python-code. "
                "De foutmelding staat onderaan in de terminal van je server."
            )
        if r.status == 422:
            return f"{wat} geeft 422: {self.veld_fout(r)}"
        if r.status == 405:
            return f"{wat} geeft 405 Method Not Allowed: dit pad bestaat, maar niet voor deze methode."
        detail = (r.json() or {}).get("detail") if r.is_json else None
        if isinstance(detail, str):
            return f"{wat} geeft status {r.status}: {detail}."
        return f"{wat} geeft status {r.status}."

    def veld_fout(self, r: Antwoord) -> str:
        detail = (r.json() or {}).get("detail") if r.is_json else None
        if isinstance(detail, list):
            soort = {"body": "het veld {}", "query": "?{}= in de URL"}
            mist = [
                soort.get(d["loc"][0], "{}").format(d["loc"][-1])
                for d in detail
                if isinstance(d, dict) and len(d.get("loc", [])) >= 2
            ]
            if mist:
                return f"FastAPI mist {opsomming(mist)}. Kijk of de namen precies gelijk zijn."
        return "het verzoek past niet bij de parameters van je endpoint."

    def geen_endpoint(self, methode: str, pad: str, sleutel: str):
        self.fout(
            f"Je server heeft geen {methode} {pad}.",
            f"Kijk of het pad in @app.{methode.lower()}(…) precies klopt.{self.s.wel(methode, pad)}",
            sleutel,
        )

    def pagina(self, pad: str, sleutel: str, wat: str | None = None) -> Antwoord | None:
        """GET op een pagina die HTML hoort te geven; None als dat niet lukt."""
        r = self.s.get(pad)
        if r.niet_gevonden:
            self.geen_endpoint("GET", pad.split("?")[0], sleutel)
            return None
        if r.status != 200:
            self.fout(f"{wat or pad} doet het niet.", self.status_zin(r, f"GET {pad}"), sleutel)
            return None
        if not r.is_html:
            self.fout(
                f"{wat or pad} geeft geen HTML maar {r.soort or 'iets zonder type'}.",
                "Geef een HTML-bestand terug met FileResponse, of een template met TemplateResponse.",
                sleutel,
            )
            return None
        return r

    def formulier(self, pad: str, actie: str, sleutel: str, bij_velden: str | None = None) -> bool:
        """Staat op `pad` een formulier dat past bij POST `actie`?

        `sleutel` wijst naar de uitleg, `bij_velden` naar die bij een veld met
        een andere naam (als die ergens anders staat).
        """
        r = self.pagina(pad, sleutel)
        if r is None:
            return False
        formulieren = Pagina(r.tekst).formulieren
        passend = [f for f in formulieren if lokaal(pad, f.actie or pad) == actie]
        if not passend:
            if formulieren:
                acties = opsomming(sorted({lokaal(pad, f.actie or pad) or "?" for f in formulieren}))
                self.fout(
                    f"Het formulier op {pad} stuurt naar {acties}, niet naar {actie}.",
                    f'Zet action="{actie}" in de <form>-tag.',
                    sleutel,
                )
            else:
                self.fout(f"Op {pad} staat geen <form>.", f'Maak een formulier met action="{actie}".', sleutel)
            return False
        form = passend[0]
        if form.methode != "post":
            self.fout(
                f"Het formulier op {pad} verstuurt met GET.",
                'Zet method="post" in de <form>-tag, anders komt het verzoek niet bij je POST-endpoint.',
                sleutel,
            )
            return False
        verwacht = self.s.velden("POST", actie)
        if verwacht is None:
            self.geen_endpoint("POST", actie, sleutel)
            return False
        mist = [v for v in verwacht if v not in form.velden]
        if mist:
            heeft = opsomming(form.velden) or "geen velden"
            self.fout(
                f"Het formulier op {pad} mist het veld {opsomming(mist)}.",
                f"POST {actie} verwacht {opsomming(verwacht)}; het formulier stuurt {heeft}. "
                "Maak het name-attribuut letter voor letter gelijk aan de parameter in Python.",
                bij_velden or sleutel,
            )
            return False
        self.ok(f"Het formulier op {pad} past bij POST {actie} ({opsomming(verwacht)}).")
        return True

    # Het gastenboek
    def gastenboek_velden(self) -> list[str] | None:
        return self.s.velden("POST", "/gastenboek")

    def heeft_account_nodig(self) -> bool:
        return "wachtwoord" in (self.gastenboek_velden() or [])

    def zorg_voor_account(self):
        if self.account or not self.s.bestaat("POST", "/registreer"):
            return
        r = self.s.post("/registreer", {"naam": self.account_naam, "wachtwoord": self.wachtwoord})
        self.account = r.status in (200, 302, 303, 307, 400)

    def plaats_bericht(self, tekst: str, naam: str | None = None, wachtwoord: str | None = None) -> Antwoord:
        verwacht = self.gastenboek_velden() or ["naam", "bericht"]
        met_account = "wachtwoord" in verwacht
        if met_account and wachtwoord is None:
            self.zorg_voor_account()
        self.schrijver = naam or (self.account_naam if met_account else self.marker)
        velden = {}
        for v in verwacht:
            if v == "naam":
                velden[v] = self.schrijver
            elif v == "bericht":
                velden[v] = tekst
            elif v == "wachtwoord":
                velden[v] = wachtwoord or self.wachtwoord
            else:
                velden[v] = tekst
        return self.s.post("/gastenboek", velden)

    def bericht_erin(self, tekst: str) -> Antwoord:
        """Plaats een bericht waar de rest op bouwt; Stop als het niet lukt."""
        r = self.plaats_bericht(tekst)
        if r.status not in (200, 302, 303, 307):
            self.fout(
                "Je gastenboek neemt geen bericht aan.",
                self.status_zin(r, "POST /gastenboek"),
                "opslaan-mis",
            )
            raise Stop("zonder bericht valt de rest niet te controleren")
        return r

    def sleutel_van(self, tekst: str) -> str | None:
        """De sleutel van het bericht met deze tekst, uit de pagina /berichten."""
        r = self.s.get("/berichten")
        if not r.is_html:
            return None
        pagina = Pagina(r.tekst)
        kandidaten = [
            f.waarden.get("sleutel", "")
            for f in pagina.formulieren
            if lokaal("/berichten", f.actie or "/berichten") == "/verwijderen"
        ]
        kandidaten += [
            urllib.parse.unquote(h.split("/bericht/", 1)[1])
            for h in pagina.links
            if (lokaal("/berichten", h) or "").startswith("/bericht/")
        ]
        kandidaten = [k for k in dict.fromkeys(kandidaten) if k]
        if self.s.bestaat("GET", "/bericht/{sleutel}"):
            for k in reversed(kandidaten):
                d = self.s.get("/bericht/" + urllib.parse.quote(k, safe=""))
                if d.status == 200 and tekst in d.tekst:
                    return k
            return None
        # Zonder detailpagina: het eerste verborgen veld ná de tekst, zoals in
        # het formulier per bericht uit de les.
        plek = r.tekst.find(tekst)
        if plek < 0:
            return None
        m = re.search(r'name="sleutel"[^>]*value="([^"]+)"|value="([^"]+)"[^>]*name="sleutel"', r.tekst[plek:])
        return (m.group(1) or m.group(2)) if m else None

    def ruim_op(self, teksten: list[str]):
        lijst = self.s.get("/berichten").tekst
        teksten = [t for t in dict.fromkeys(teksten) if t in lijst]
        if not teksten:
            return
        if not self.s.bestaat("POST", "/verwijderen"):
            wat = "Het bericht" if len(teksten) == 1 else "De berichten"
            blijft = "blijft" if len(teksten) == 1 else "blijven"
            self.achteraf.append(
                f"{wat} met {self.marker} {blijft} in gastenboek.db staan: "
                "verwijderen bouw je in Berichten verwijderen."
            )
            return
        weg = 0
        for tekst in teksten:
            sleutel = self.sleutel_van(tekst)
            if sleutel and self.s.post("/verwijderen", {"sleutel": sleutel}).status < 400:
                weg += 1
        if weg == len(teksten):
            wat = "het bericht is" if weg == 1 else "de berichten zijn"
            self.achteraf.append(f"Opgeruimd: {wat} weer verwijderd.")
        else:
            self.achteraf.append(
                f"Niet alle berichten met {self.marker} konden weg; verwijder ze zelf op /berichten."
            )

    def meld_schrijven(self, *delen: str):
        delen = [d for d in delen if d]
        if delen:
            print(f"Deze controle voegt toe: {opsomming(delen)}.")
            print()

    def account_deel(self) -> str:
        if not self.heeft_account_nodig():
            return ""
        return f"het account {self.account_naam} in gebruikers.db (blijft staan)"

    def berichten_deel(self, aantal: int) -> str:
        wat = "een bericht" if aantal == 1 else "twee berichten"
        weg = " (daarna weer weg)" if self.s.bestaat("POST", "/verwijderen") else ""
        return f"{wat} met {self.marker} in gastenboek.db{weg}"

    def bericht_tekst(self, nummer: int = 1) -> str:
        return f"Bericht {nummer} van het controlescript ({self.marker})"


# ── Per hoofdstuk ────────────────────────────────────────────────────────────


def eerste_server(c: Controle):
    r = c.s.get("/")
    if r.status == 200:
        c.ok("GET / geeft een antwoord (200).")
    elif r.niet_gevonden:
        c.fout(
            "GET / geeft 404 Not Found.",
            "Je server kent het pad / niet. Staat er twee keer app = FastAPI() in je main.py? "
            "Dan vallen de endpoints boven de tweede regel weg.",
            "start",
        )
    else:
        c.fout("GET / doet het niet.", c.status_zin(r, "GET /"), "start")

    r = c.s.get("/info")
    if r.niet_gevonden:
        c.geen_endpoint("GET", "/info", "endpoints")
    elif r.status != 200:
        c.fout("GET /info doet het niet.", c.status_zin(r, "GET /info"), "endpoints")
    elif not isinstance(r.json(), dict):
        c.fout(
            "GET /info geeft geen JSON.",
            'Geef een dictionary terug, zoals {"naam": "Jouw Naam", "leeftijd": 16}.',
            "endpoints",
        )
    else:
        c.ok("GET /info geeft JSON.")


def paginas(c: Controle):
    for pad in ("/pagina", "/styled"):
        r = c.s.get(pad)
        if r.niet_gevonden:
            c.geen_endpoint("GET", pad, "html-tonen")
        elif r.status != 200:
            c.fout(f"GET {pad} doet het niet.", c.status_zin(r, f"GET {pad}"), "html-tonen")
        elif r.is_json and r.tekst.lstrip().startswith('"'):
            c.fout(
                f"{pad} toont je HTML als tekst, tussen aanhalingstekens.",
                f'Zet response_class=HTMLResponse in de decorator: @app.get("{pad}", response_class=HTMLResponse).',
                "html-tonen",
            )
        elif not r.is_html:
            c.fout(f"{pad} geeft geen HTML.", "Geef een HTML-string terug met response_class=HTMLResponse.", "html-tonen")
        else:
            c.ok(f"{pad} geeft een HTML-pagina.")

    gelezen = {}
    for pad in ("/", "/about"):
        r = c.s.get(pad)
        if r.niet_gevonden:
            c.geen_endpoint("GET", pad, "fileresponse")
        elif r.status == 500:
            c.fout(
                f"GET {pad} geeft 500 Internal Server Error.",
                "Staat er in de terminal RuntimeError … does not exist? Dan klopt het pad in "
                "FileResponse(…) niet, of het bestand staat niet in static/pages/.",
                "paginas",
            )
        elif r.status != 200:
            c.fout(f"GET {pad} doet het niet.", c.status_zin(r, f"GET {pad}"), "fileresponse")
        elif not r.is_html:
            c.fout(
                f"{pad} geeft geen HTML-pagina.",
                "Geef het HTML-bestand uit static/pages/ terug met FileResponse.",
                "fileresponse",
            )
        else:
            c.ok(f"{pad} geeft een HTML-pagina.")
            gelezen[pad] = Pagina(r.tekst)

    if len(gelezen) == 2:
        heen = "/about" in {lokaal("/", h) for h in gelezen["/"].links}
        terug = "/" in {lokaal("/about", h) for h in gelezen["/about"].links}
        if heen and terug:
            c.ok("/ en /about linken naar elkaar.")
        else:
            mist = "/ heeft geen link naar /about" if not heen else "/about heeft geen link naar /"
            c.fout(
                f"{mist[0].upper()}{mist[1:]}.",
                'Zet een link naar het endpoint in je HTML, zoals <a href="/about">Ga naar Over Mij</a>.',
                "a-tag",
            )

    kapot = []
    gezien = set()
    for pad, pagina in gelezen.items():
        for href in pagina.links:
            doel = lokaal(pad, href)
            if doel is None or doel in gezien:
                continue
            gezien.add(doel)
            r = c.s.get(doel)
            if r.status >= 400:
                kapot.append(f"{doel} (op {pad}, status {r.status})")
    if gelezen:
        if kapot:
            c.fout(
                f"Een link op je pagina's werkt niet: {opsomming(kapot)}.",
                "Een link gaat naar een endpoint. Kijk of het pad in href gelijk is aan het pad in @app.get(…).",
                "paginas",
            )
        else:
            c.ok(f"Alle links op {opsomming(gelezen)} werken.")


def veel_paginas(c: Controle):
    kat = c.s.get("/dier/kat")
    if kat.niet_gevonden:
        c.geen_endpoint("GET", "/dier/{naam}", "dier")
    elif kat.status != 200:
        c.fout("GET /dier/kat doet het niet.", c.status_zin(kat, "GET /dier/kat"), "dier")
    else:
        hond = c.s.get("/dier/hond")
        if hond.status == 200 and hond.tekst != kat.tekst:
            c.ok("/dier/kat en /dier/hond geven elk een eigen pagina uit één route.")
        elif hond.status == 200:
            c.fout(
                "/dier/kat en /dier/hond geven precies dezelfde pagina.",
                "Zoek de tekst op met DIEREN.get(naam, …) en zet die tekst in de HTML.",
                "dier",
            )
        else:
            c.fout("GET /dier/hond doet het niet.", c.status_zin(hond, "GET /dier/hond"), "dier")

        r = c.s.get("/dier/olifant")
        if r.status in (200, 404):
            c.ok(f"Een dier dat er niet is (/dier/olifant) geeft een nette pagina ({r.status}).")
        elif r.status == 500:
            c.fout(
                "/dier/olifant geeft 500 Internal Server Error.",
                "Staat er KeyError: 'olifant' in je terminal? Gebruik DIEREN.get(naam, …) in plaats van DIEREN[naam].",
                "dier-fout",
            )
        else:
            c.fout("/dier/olifant doet het niet.", c.status_zin(r, "GET /dier/olifant"), "dier-fout")

    r = c.s.get("/zoek?term=python")
    if r.niet_gevonden:
        c.geen_endpoint("GET", "/zoek", "query")
    elif r.status == 200 and "python" in r.tekst:
        c.ok("/zoek?term=python geeft de zoekterm terug.")
    elif r.status == 200:
        c.fout(
            "/zoek?term=python geeft de zoekterm niet terug.",
            'Geef term terug in het antwoord, zoals {"je_zocht": term}.',
            "query",
        )
    else:
        c.fout("/zoek?term=python doet het niet.", c.status_zin(r, "GET /zoek?term=python"), "query")


def bestanden_laden(c: Controle, pad: str, pagina: Pagina, soort: str):
    """Laden de stylesheets (soort 'css') of afbeeldingen ('img') op een pagina?"""
    if soort == "css":
        hrefs, naam, type_, sleutel = pagina.stylesheets, "stylesheet", "text/css", "css-koppelen"
        nieuw = '<link rel="stylesheet" href="/static/css/style.css"> in de <head>'
    else:
        hrefs, naam, type_, sleutel = pagina.afbeeldingen, "afbeelding", "image/", "img"
        nieuw = '<img src="/static/kat.jpg" alt="…">'
    doelen = [d for d in (lokaal(pad, h) for h in hrefs) if d]
    if not doelen:
        c.fout(f"Op {pad} staat geen {naam} van je eigen server.", f"Zet er een in, zoals {nieuw}.", sleutel)
        return
    for doel in doelen:
        r = c.s.get(doel)
        if r.status != 200 or type_ not in r.soort:
            reden = f"status {r.status}" if r.status != 200 else f"het type is {r.soort or 'onbekend'}"
            c.fout(
                f"De {naam} {doel} op {pad} laadt niet ({reden}).",
                'Kijk of app.mount("/static", …) in main.py staat en of het bestand echt op die plek in static/ staat.',
                "static-mis",
            )
            return
    c.ok(f"De {naam} op {pad} laadt ({opsomming(doelen)}).")


def css_en_afbeeldingen(c: Controle):
    r = c.pagina("/", "fileresponse", "Je homepage")
    if r is not None:
        bestanden_laden(c, "/", Pagina(r.tekst), "css")
    r = c.pagina("/foto", "img")
    if r is not None:
        c.ok("/foto geeft een HTML-pagina.")
        pagina = Pagina(r.tekst)
        bestanden_laden(c, "/foto", pagina, "img")
        bestanden_laden(c, "/foto", pagina, "css")


def formulieren(c: Controle):
    r = c.s.get("/dobbelsteen")
    if r.niet_gevonden:
        c.geen_endpoint("GET", "/dobbelsteen", "template")
    elif r.status == 500:
        c.fout(
            "/dobbelsteen geeft 500 Internal Server Error.",
            "Staat er TemplateNotFound in je terminal? Zet dobbelsteen.html in de map templates/, naast main.py.",
            "template-niet-gevonden",
        )
    elif r.status != 200:
        c.fout("/dobbelsteen doet het niet.", c.status_zin(r, "GET /dobbelsteen"), "template")
    elif "{{" in r.tekst or "{%" in r.tekst:
        c.fout(
            "Op /dobbelsteen staat nog {{ … }} in de pagina.",
            "Jinja2 heeft de template niet ingevuld. Gebruik templates.TemplateResponse, geen FileResponse.",
            "template",
        )
    elif not re.search(r"(?<![0-9])[1-6](?![0-9])", _zichtbaar(r.tekst)):
        c.fout(
            "Op /dobbelsteen staat geen worp van 1 tot en met 6.",
            "Vergelijk de naam tussen {{ }} in de template met de sleutel in het dictionary.",
            "template-lege-plek",
        )
    else:
        c.ok("/dobbelsteen toont een ingevulde template.")

    c.formulier("/naam", "/verstuur", "formulier")
    if c.s.bestaat("POST", "/verstuur"):
        r = c.s.post("/verstuur", {"naam": c.marker})
        if r.status == 200 and c.marker in r.tekst:
            c.ok(f"POST /verstuur antwoordt met de naam ({c.marker}).")
        elif r.status == 200:
            c.fout(
                "POST /verstuur geeft de naam niet terug.",
                'Geef de naam terug, zoals {"bericht": f"Hallo {naam}!"}.',
                "formulier-endpoints",
            )
        else:
            c.fout("POST /verstuur doet het niet.", c.status_zin(r, "POST /verstuur"), "formulier-mis")

    c.formulier("/groet", "/groet", "groet")
    if c.s.bestaat("POST", "/groet"):
        r = c.s.post("/groet", {"naam": c.marker})
        if r.status == 200 and r.is_html and c.marker in r.tekst and "{{" not in r.tekst:
            c.ok("POST /groet antwoordt met een pagina met de naam erin.")
        elif r.status == 500:
            c.fout(
                "POST /groet geeft 500 Internal Server Error.",
                "Staat er TemplateNotFound in je terminal? Zet groet_resultaat.html in de map templates/.",
                "template-niet-gevonden",
            )
        elif r.status == 200:
            c.fout(
                "POST /groet geeft geen pagina met de naam erin.",
                'Geef een TemplateResponse terug met {"naam": naam}, en zet {{ naam }} in de template.',
                "groet",
            )
        else:
            c.fout("POST /groet doet het niet.", c.status_zin(r, "POST /groet"), "formulier-mis")


def _zichtbaar(html: str) -> str:
    return re.sub(r"<[^>]*>", " ", html)


def berichten_opslaan(c: Controle):
    c.meld_schrijven(
        f"de naam {c.marker} in namen.db (daarna terug naar de naam die er stond)",
        c.account_deel(),
        c.berichten_deel(2),
    )

    c.formulier("/opslaan", "/opslaan", "formulier-mis")
    if c.s.bestaat("POST", "/opslaan"):
        oud = c.s.get("/toon_naam")
        vorige = (oud.json() or {}).get("naam") if oud.status == 200 and oud.is_json else None
        r = c.s.post("/opslaan", {"naam": c.marker})
        if r.status >= 400:
            c.fout("POST /opslaan doet het niet.", c.status_zin(r, "POST /opslaan"), "opslaan-mis")
        else:
            t = c.s.get("/toon_naam")
            if t.niet_gevonden:
                c.geen_endpoint("GET", "/toon_naam", "naam-terug")
            elif t.status == 200 and c.marker in t.tekst:
                c.ok("Een naam uit /opslaan staat daarna op /toon_naam.")
            elif t.status == 200:
                c.fout(
                    "De naam uit /opslaan staat niet op /toon_naam.",
                    "Vergeet db.commit() niet na het opslaan, en gebruik in beide endpoints dezelfde sleutel.",
                    "naam-terug",
                )
            else:
                c.fout("GET /toon_naam doet het niet.", c.status_zin(t, "GET /toon_naam"), "naam-terug")
            if isinstance(vorige, str) and vorige != "Nog niets opgeslagen" and not vorige.startswith("controle-"):
                c.s.post("/opslaan", {"naam": vorige})
            else:
                c.achteraf.append(f"In namen.db staat nu de naam {c.marker}.")

    c.formulier(
        "/gastenboek",
        "/gastenboek",
        "eigen-sleutel",
        bij_velden="inloggen-422" if c.heeft_account_nodig() else "formulier-mis",
    )
    if c.gastenboek_velden() is None:
        return

    teksten = [c.bericht_tekst(1), c.bericht_tekst(2)]
    geplaatst = []
    eerste = None
    for tekst in teksten:
        r = c.plaats_bericht(tekst)
        eerste = eerste or r
        if r.status < 400:
            geplaatst.append(tekst)
    r = eerste
    if r.status == 303 and r.locatie == "/berichten":
        c.ok("POST /gastenboek stuurt door naar /berichten (303).")
    elif r.status in (302, 303, 307):
        if r.status != 303:
            c.fout(
                f"POST /gastenboek stuurt door met {r.status} in plaats van 303.",
                'Zet status_code=303 in RedirectResponse(url="/berichten", status_code=303).',
                "redirect-303",
            )
        else:
            c.fout(
                f"POST /gastenboek stuurt door naar {r.locatie or 'niets'}, niet naar /berichten.",
                'Gebruik RedirectResponse(url="/berichten", status_code=303).',
                "redirect",
            )
    elif r.status == 200:
        c.fout(
            "POST /gastenboek stuurt niet door naar /berichten.",
            'Geef na het opslaan RedirectResponse(url="/berichten", status_code=303) terug.',
            "redirect",
        )
    else:
        c.fout("POST /gastenboek doet het niet.", c.status_zin(r, "POST /gastenboek"), "opslaan-mis")

    if geplaatst:
        b = c.s.get("/berichten")
        if b.niet_gevonden:
            c.geen_endpoint("GET", "/berichten", "eigen-sleutel")
        elif b.status != 200:
            c.fout("GET /berichten doet het niet.", c.status_zin(b, "GET /berichten"), "opslaan-mis")
        elif all(t in b.tekst for t in teksten):
            c.ok("Twee berichten na elkaar staan er allebei op /berichten.")
        elif any(t in b.tekst for t in teksten):
            c.fout(
                "Van twee berichten na elkaar staat er maar één op /berichten.",
                "Elk bericht heeft een eigen sleutel nodig, zoals f\"bericht_{time.time_ns()}\".",
                "eigen-sleutel",
            )
        else:
            c.fout(
                "Je berichten staan niet op /berichten.",
                "Vergeet db.commit() niet, en lees in /berichten dezelfde database (gastenboek.db).",
                "opslaan-mis",
            )
    c.ruim_op(geplaatst)


def berichten_tonen(c: Controle):
    # Eerst zonder te schrijven: is /berichten al een pagina?
    b = c.s.get("/berichten")
    if b.niet_gevonden:
        c.geen_endpoint("GET", "/berichten", "lijst-template")
        return
    if b.status != 200:
        c.fout("GET /berichten doet het niet.", c.status_zin(b, "GET /berichten"), "tonen-mis")
        return
    if not b.is_html:
        c.fout(
            "/berichten geeft nog JSON, geen pagina.",
            "Geef een TemplateResponse terug met berichten.html, en stuur de berichten mee onder de naam berichten.",
            "lijst-template",
        )
        return
    c.ok("/berichten is een HTML-pagina.")

    c.meld_schrijven(c.account_deel(), c.berichten_deel(1))
    tekst = c.bericht_tekst()
    c.bericht_erin(tekst)
    try:
        _berichten_tonen(c, tekst)
    finally:
        c.ruim_op([tekst])


def _berichten_tonen(c: Controle, tekst: str):
    b = c.s.get("/berichten")
    if "{{" in b.tekst or "{%" in b.tekst:
        c.fout(
            "Op /berichten staat nog {{ … }} of {% … %}.",
            "Jinja2 heeft de template niet ingevuld. Gebruik templates.TemplateResponse, geen FileResponse.",
            "lijst-template",
        )
    elif tekst in b.tekst and c.schrijver in b.tekst.replace(tekst, ""):
        c.ok("Je nieuwe bericht staat op /berichten, met naam en tekst.")
    else:
        c.fout(
            "Je nieuwe bericht staat niet (helemaal) op /berichten.",
            "Zie je alleen een dubbele punt per bericht? Loop dan met {% for sleutel, bericht in berichten %} "
            "als je db.items() meestuurt.",
            "tonen-mis",
        )

    if not c.s.bestaat("GET", "/bericht/{sleutel}"):
        c.geen_endpoint("GET", "/bericht/{sleutel}", "detail")
    else:
        links = [d for d in (lokaal("/berichten", h) for h in Pagina(b.tekst).links) if d and d.startswith("/bericht/")]
        if not links:
            c.fout(
                "Op /berichten staat geen link naar /bericht/<sleutel>.",
                'Maak van de naam een link: <a href="/bericht/{{ sleutel }}">.',
                "detail-link",
            )
        elif c.sleutel_van(tekst):
            c.ok("Een link op /berichten opent het bericht op een eigen pagina.")
        else:
            c.fout(
                "De links op /berichten openen je nieuwe bericht niet.",
                "Zoek het bericht op met db.get(sleutel) en geef het mee aan bericht.html.",
                "detail",
            )

        pad = f"/bericht/bestaat-niet-{c.marker}"
        r = c.s.get(pad)
        if r.status == 404:
            c.ok(f"Een bericht dat niet bestaat geeft 404 ({pad}).")
        else:
            c.fout(
                f"{pad} geeft {r.status} in plaats van 404.",
                'Geef een 404 als db.get(sleutel) None is: raise HTTPException(status_code=404, detail="…").',
                "niet-gevonden",
            )


def berichten_verwijderen(c: Controle):
    # Eerst zonder te schrijven: bestaat het endpoint?
    verwacht = c.s.velden("POST", "/verwijderen")
    if verwacht is None:
        c.geen_endpoint("POST", "/verwijderen", "verwijderen")
        return
    c.meld_schrijven(c.account_deel(), c.berichten_deel(1))
    tekst = c.bericht_tekst()
    c.bericht_erin(tekst)
    try:
        _berichten_verwijderen(c, tekst, verwacht)
    finally:
        c.ruim_op([tekst])


def _berichten_verwijderen(c: Controle, tekst: str, verwacht: list[str]):

    b = c.s.get("/berichten")
    formulieren = [
        f for f in Pagina(b.tekst).formulieren if lokaal("/berichten", f.actie or "/berichten") == "/verwijderen"
    ]
    if not formulieren:
        c.fout(
            "Op /berichten staat geen formulier naar /verwijderen.",
            'Zet bij elk bericht een <form method="post" action="/verwijderen"> met een verborgen veld sleutel.',
            "verwijder-formulier",
        )
        raise Stop("zonder formulier valt de rest niet te controleren")
    mist = [v for v in verwacht if v not in formulieren[0].velden]
    if formulieren[0].methode != "post" or mist:
        c.fout(
            "Het formulier naar /verwijderen past niet bij POST /verwijderen.",
            f'POST /verwijderen verwacht {opsomming(verwacht)}; zet method="post" en een verborgen veld '
            'met dezelfde naam: <input type="hidden" name="sleutel" value="{{ sleutel }}">.',
            "verwijder-formulier",
        )
        raise Stop("met dit formulier valt de rest niet te controleren")
    c.ok(f"Bij de berichten staat een formulier dat past bij POST /verwijderen ({opsomming(verwacht)}).")

    sleutel = c.sleutel_van(tekst)
    if not sleutel:
        c.fout(
            "De sleutel van je nieuwe bericht staat niet in het formulier op /berichten.",
            'Zet de sleutel in het verborgen veld: value="{{ sleutel }}", en loop met {% for sleutel, bericht in berichten %}.',
            "verwijder-formulier",
        )
        raise Stop("zonder sleutel valt de rest niet te controleren")

    r = c.s.post("/verwijderen", {"sleutel": sleutel})
    if r.status == 303 and r.locatie == "/berichten":
        c.ok("POST /verwijderen stuurt door naar /berichten (303).")
    elif r.status < 400:
        c.fout(
            f"POST /verwijderen geeft {r.status} in plaats van een 303 naar /berichten.",
            'Geef na het verwijderen RedirectResponse(url="/berichten", status_code=303) terug.',
            "verwijderen",
        )
    else:
        c.fout("POST /verwijderen doet het niet.", c.status_zin(r, "POST /verwijderen"), "verwijderen")

    if tekst in c.s.get("/berichten").tekst:
        c.fout(
            "Na het verwijderen staat het bericht nog op /berichten.",
            "Haal het bericht weg met del db[sleutel], en vergeet db.commit() niet.",
            "verwijderen",
        )
    else:
        c.ok("Na het verwijderen is het bericht weg.")

    r = c.s.post("/verwijderen", {"sleutel": sleutel})
    if r.status < 400:
        c.ok("Een bericht dat al weg is nog een keer verwijderen gaat goed.")
    else:
        c.fout(
            "Een bericht dat al weg is nog een keer verwijderen gaat mis.",
            c.status_zin(r, "POST /verwijderen") + " Zet de controle if sleutel in db: vóór del db[sleutel].",
            "verwijderen",
        )


def accounts(c: Controle):
    c.account_naam = c.marker
    kan_registreren = c.s.bestaat("POST", "/registreer")
    c.meld_schrijven(
        f"het account {c.marker} in gebruikers.db (blijft staan)" if kan_registreren else "",
        c.berichten_deel(1) if kan_registreren and c.heeft_account_nodig() else "",
    )
    c.formulier("/registreer", "/registreer", "registreer-formulier", bij_velden="registreer-422")
    if c.s.bestaat("POST", "/registreer"):
        r = c.s.post("/registreer", {"naam": c.account_naam, "wachtwoord": c.wachtwoord})
        c.account = r.status < 400
        if r.status == 303 and r.locatie == "/gastenboek":
            c.ok("Een nieuw account maken stuurt door naar /gastenboek (303).")
        elif r.status < 400:
            c.fout(
                f"POST /registreer geeft {r.status} in plaats van een 303 naar /gastenboek.",
                'Geef na het opslaan RedirectResponse(url="/gastenboek", status_code=303) terug.',
                "registreer",
            )
        else:
            c.fout("Een nieuw account maken lukt niet.", c.status_zin(r, "POST /registreer"), "registreer")

        r = c.s.post("/registreer", {"naam": c.account_naam, "wachtwoord": c.wachtwoord})
        if r.status == 400:
            c.ok("Een tweede account met dezelfde naam geeft 400.")
        else:
            c.fout(
                f"Een tweede account met dezelfde naam geeft {r.status} in plaats van 400.",
                "Weiger een naam die al in gebruikers.db staat met raise HTTPException(status_code=400, …); "
                "anders overschrijft de tweede het wachtwoord van de eerste.",
                "registreer",
            )

    c.formulier("/gastenboek", "/gastenboek", "inloggen-formulier", bij_velden="inloggen-422")
    if c.gastenboek_velden() is None:
        return
    if not c.heeft_account_nodig():
        c.fout(
            "POST /gastenboek vraagt geen wachtwoord.",
            "Zet een parameter wachtwoord: str = Form(...) in je endpoint en controleer hem met gebruikers.get(naam).",
            "inloggen",
        )
        return
    if not c.account:
        c.zorg_voor_account()

    fout_ww = c.bericht_tekst(2)
    opgeslagen = []
    r = c.plaats_bericht(fout_ww, wachtwoord="fout-wachtwoord")
    if r.status == 401:
        c.ok("Een bericht met een fout wachtwoord geeft 401.")
    else:
        if r.status < 400:
            opgeslagen.append(fout_ww)
        c.fout(
            f"Een bericht met een fout wachtwoord geeft {r.status} in plaats van 401.",
            "Vergelijk vóór het opslaan het opgeslagen wachtwoord met wat er binnenkwam, en stop met "
            "raise HTTPException(status_code=401, …) als ze verschillen.",
            "inloggen",
        )

    r = c.plaats_bericht(fout_ww, naam=f"{c.marker}-onbekend", wachtwoord="een-wachtwoord")
    if r.status == 401:
        c.ok("Een bericht met een naam zonder account geeft 401.")
    else:
        if r.status < 400:
            opgeslagen.append(fout_ww)
        c.fout(
            f"Een bericht met een naam zonder account geeft {r.status} in plaats van 401.",
            "Haal het wachtwoord op met gebruikers.get(naam): een naam zonder account geeft None, en dat is nooit gelijk.",
            "inloggen",
        )

    tekst = c.bericht_tekst(1)
    r = c.plaats_bericht(tekst)
    if r.status < 400:
        opgeslagen.append(tekst)
    if r.status < 400 and tekst in c.s.get("/berichten").tekst:
        c.ok("Met het goede wachtwoord komt het bericht op /berichten.")
    elif r.status == 401:
        c.fout(
            "Met het goede wachtwoord geeft POST /gastenboek 401.",
            "Kijk of /registreer en /gastenboek dezelfde database (gebruikers.db) en dezelfde sleutel (de naam) gebruiken.",
            "inloggen-401",
        )
    else:
        c.fout(
            "Met het goede wachtwoord komt het bericht niet op /berichten.",
            c.status_zin(r, "POST /gastenboek"),
            "inloggen",
        )
    c.ruim_op(opgeslagen)


CONTROLES = {
    "eerste-server": eerste_server,
    "paginas": paginas,
    "veel-paginas": veel_paginas,
    "css-en-afbeeldingen": css_en_afbeeldingen,
    "formulieren": formulieren,
    "berichten-opslaan": berichten_opslaan,
    "berichten-tonen": berichten_tonen,
    "berichten-verwijderen": berichten_verwijderen,
    "accounts": accounts,
}


# ── Starten ──────────────────────────────────────────────────────────────────


def toon_lijst():
    print("Kies een hoofdstuk:")
    print()
    breedte = max(len(h) for h in HOOFDSTUKKEN)
    for sleutel, titel in HOOFDSTUKKEN.items():
        print(f"  {sleutel:<{breedte}}  {titel}")
    print()
    print("Bijvoorbeeld: python controleer.py formulieren")


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    parser = argparse.ArgumentParser(
        prog="controleer.py",
        description="Controleer je FastAPI-server per hoofdstuk van de fullstack-cursus.",
    )
    parser.add_argument("hoofdstuk", nargs="?", help="het hoofdstuk, bijvoorbeeld formulieren")
    parser.add_argument("--adres", default="http://127.0.0.1:8000", help="waar je server draait")
    args = parser.parse_args(argv)

    if args.hoofdstuk is None:
        toon_lijst()
        return 0
    if args.hoofdstuk not in HOOFDSTUKKEN:
        if args.hoofdstuk == "sqlitedict":
            print("Gegevens opslaan (SqliteDict) heeft geen server: dat zijn losse scripts.")
        else:
            print(f"Het hoofdstuk {args.hoofdstuk} ken ik niet.")
        print()
        toon_lijst()
        return 2

    server = Server(args.adres)
    c = Controle(server)
    try:
        server.routes  # meteen proberen: draait de server?
        print(f"Hoofdstuk: {HOOFDSTUKKEN[args.hoofdstuk]}")
        print(f"Server: {server.adres}")
        print()
        try:
            CONTROLES[args.hoofdstuk](c)
        except Stop as e:
            print(f"Hier stopt de controle: {e}.")
    except ServerWeg as e:
        print()
        if e.traag:
            print(f"Je server op {server.adres} antwoordt niet binnen {WACHTTIJD} seconden.")
            print("Kijk in de terminal van je server: staat daar een foutmelding, of draait er een lus die niet stopt?")
            return 2
        print(f"Je server is niet bereikbaar op {server.adres} ({e}).")
        print("Start je server met fastapi dev main.py in de terminal van VS Code, en draai dit script")
        print("in een tweede terminal: klik op het plusje (+) rechtsboven in het terminalpaneel.")
        return 2

    if c.achteraf:
        print()
        for regel in c.achteraf:
            print(regel)
    print()
    print(f"{c.goed} van {c.totaal} goed")
    return 0 if c.goed == c.totaal else 1


if __name__ == "__main__":
    sys.exit(main())
