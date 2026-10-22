"""Kapotte kopieën van het referentieproject, met fouten die leerlingen maken.

Elke fout is een vervanging in één bestand (of een bestand dat ontbreekt of
verhuist), met het hoofdstuk waarin static/controleer.py hem moet vinden en het
begin van de ✗-regel die daarbij hoort. draai.py zet de kopie neer, start hem
en eist per fout die regel. Een controle die een fout stil goedkeurt, valt zo
op. De fouten van de basis gaan in referentie/, die van de uitbreidingen in
het eindproject uit uitbreidingen.py (`eind=True`). Fouten die elkaar in de weg
zitten (zonder cookie valt ook de sessie weg) staan in een eigen `groep`, en
krijgen elk een eigen kopie.

VARIANTEN zijn geen fouten maar een andere weg die de lessen toestaan: het
htmx-recept voor het formulier. Daarop moet elk hoofdstuk goed blijven.

    python kapot.py <doelmap>   # alleen de kopie van de basis maken, om zelf te proberen
"""

from __future__ import annotations

import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

HIER = Path(__file__).resolve().parent
REFERENTIE = HIER / "referentie"
sys.path.insert(0, str(HIER))

import uitbreidingen  # noqa: E402


@dataclass(frozen=True)
class Fout:
    hoofdstuk: str
    bestand: str
    oud: str
    nieuw: str | None  # None: het bestand ontbreekt (of verhuist naar `naar`)
    verwacht: str  # het begin van de ✗-regel
    eind: bool = False  # in het eindproject met de uitbreidingen
    groep: int = 0
    naar: str | None = None


FOUTEN = [
    # Een endpoint met een ander pad dan in de les.
    Fout(
        "eerste-server",
        "main.py",
        '@app.get("/info")',
        '@app.get("/over")',
        "✗ Je server heeft geen GET /info.",
    ),
    # response_class vergeten: de HTML komt als JSON-string terug.
    Fout(
        "paginas",
        "main.py",
        '@app.get("/pagina", response_class=HTMLResponse)',
        '@app.get("/pagina")',
        "✗ /pagina toont je HTML als tekst",
    ),
    # Vierkante haken in plaats van get: KeyError bij een onbekend dier.
    Fout(
        "veel-paginas",
        "main.py",
        'tekst = DIEREN.get(naam, "Dit dier staat nog niet op de site.")',
        "tekst = DIEREN[naam]",
        "✗ /dier/olifant geeft 500",
    ),
    # Een tikfout in het pad van de afbeelding.
    Fout(
        "css-en-afbeeldingen",
        "static/pages/foto.html",
        'src="/static/kat.jpg"',
        'src="/static/kat.jpeg"',
        "✗ De afbeelding /static/kat.jpeg op /foto laadt niet (status 404)",
    ),
    # Een template dat ontbreekt.
    Fout(
        "formulieren",
        "templates/dobbelsteen.html",
        "",
        None,
        "✗ /dobbelsteen geeft 500",
    ),
    # Een veld met een andere naam dan de parameter.
    Fout(
        "formulieren",
        "static/pages/naam_form.html",
        'name="naam"',
        'name="voornaam"',
        "✗ Het formulier op /naam mist het veld naam.",
    ),
    # status_code=303 vergeten: RedirectResponse stuurt dan 307.
    Fout(
        "berichten-opslaan",
        "main.py",
        '        db[sleutel] = {"naam": naam, "bericht": bericht}\n'
        "        db.commit()\n"
        '    return RedirectResponse(url="/berichten", status_code=303)',
        '        db[sleutel] = {"naam": naam, "bericht": bericht}\n'
        "        db.commit()\n"
        '    return RedirectResponse(url="/berichten")',
        "✗ POST /gastenboek stuurt door met 307 in plaats van 303.",
    ),
    # Zonder 404: een onbekende sleutel geeft een lege pagina met 200.
    Fout(
        "berichten-tonen",
        "main.py",
        "    if bericht is None:\n"
        '        raise HTTPException(status_code=404, detail="Dit bericht bestaat niet")\n',
        "",
        "✗ /bericht/bestaat-niet-",
    ),
    # Na db.items() de lus zonder sleutel: elk bericht wordt een dubbele punt.
    Fout(
        "berichten-tonen",
        "templates/berichten.html",
        "{% for sleutel, bericht in berichten %}",
        "{% for bericht in berichten %}",
        "✗ Je nieuwe bericht staat niet (helemaal) op /berichten.",
    ),
    # Een ontbrekende route: het endpoint heet anders dan het formulier zegt.
    Fout(
        "berichten-verwijderen",
        "main.py",
        '@app.post("/verwijderen")',
        '@app.post("/verwijder")',
        "✗ Je server heeft geen POST /verwijderen.",
    ),
    # Het wachtwoordveld heet in het formulier anders dan in Python.
    Fout(
        "accounts",
        "static/pages/registreer.html",
        'name="wachtwoord"',
        'name="password"',
        "✗ Het formulier op /registreer mist het veld wachtwoord.",
    ),
    # Zonder de controle op een bezette naam.
    Fout(
        "accounts",
        "main.py",
        "        if naam in gebruikers:\n"
        '            raise HTTPException(status_code=400, detail="Deze naam is al bezet")\n',
        "",
        "✗ Een tweede account met dezelfde naam geeft 303 in plaats van 400.",
    ),
]


UIT_DE_UITBREIDINGEN = [
    # htmx volgt een omleiding en zet dan de hele pagina in het doel.
    Fout(
        "zonder-herladen",
        "main.py",
        '        db.commit()\n    return HTMLResponse("")',
        '        db.commit()\n    return RedirectResponse(url="/berichten", status_code=303)',
        "✗ DELETE /bericht/<sleutel> stuurt door naar /berichten (303).",
        eind=True,
    ),
    # Alleen maxlength in de HTML, geen controle op de server.
    Fout(
        "in-de-browser",
        "main.py",
        '    if len(bericht) > 80:\n        raise HTTPException(status_code=400, detail="Bericht is te lang")\n',
        "",
        "✗ Een bericht van 81 tekens geeft 303 in plaats van 400.",
        eind=True,
    ),
    # app.js zoekt een element dat niet op de pagina staat.
    Fout(
        "in-de-browser",
        "templates/gastenboek.html",
        '                <p id="teller">80 tekens over</p>\n',
        "",
        "✗ Je JavaScript zoekt #teller, maar dat staat niet op /gastenboek.",
        eind=True,
    ),
    # De template voor de foutpagina in static/pages/ in plaats van templates/.
    Fout(
        "afronden",
        "templates/404.html",
        "",
        None,
        "✗ Een onbekend adres geeft 500 Internal Server Error.",
        eind=True,
        naar="static/pages/404.html",
    ),
    # set_cookie op een antwoord dat je niet returnt.
    Fout(
        "onthouden",
        "main.py",
        '    antwoord.set_cookie(key="sessie_id", value=sessie_id, max_age=60 * 60 * 24 * 30)\n'
        "    return antwoord",
        '    antwoord.set_cookie(key="sessie_id", value=sessie_id, max_age=60 * 60 * 24 * 30)\n'
        '    return RedirectResponse(url="/gastenboek", status_code=303)',
        "✗ Inloggen zet geen cookie sessie_id.",
        eind=True,
        groep=1,
    ),
    # Zonder sessies.commit() is de sessie er bij het volgende verzoek niet meer.
    Fout(
        "onthouden",
        "main.py",
        "        sessies[sessie_id] = {\"naam\": naam}\n        sessies.commit()\n",
        "        sessies[sessie_id] = {\"naam\": naam}\n",
        "✗ Na het inloggen weet /gastenboek niet wie je bent",
        eind=True,
        groep=2,
    ),
]
FOUTEN += UIT_DE_UITBREIDINGEN

# Het htmx-recept voor het formulier, op het schrijfformulier uit Sessies: met
# hx-post en een stukje HTML als antwoord, en zonder omleiding.
VARIANTEN = [
    Fout(
        "",
        "templates/gastenboek.html",
        '            <form method="post" action="/gastenboek">',
        '            <form hx-post="/gastenboek" hx-target="#antwoord">',
        "",
        eind=True,
    ),
    Fout(
        "",
        "templates/gastenboek.html",
        "            <script src=\"/static/js/app.js\" defer></script>\n",
        '            <p id="antwoord"></p>\n            <script src="/static/js/app.js" defer></script>\n',
        "",
        eind=True,
    ),
    Fout(
        "",
        "templates/gastenboek.html",
        "<html>\n    <body>",
        '<html>\n    <head>\n        <script src="/static/js/htmx.min.js"></script>\n    </head>\n    <body>',
        "",
        eind=True,
    ),
    Fout(
        "",
        "main.py",
        '        db.commit()\n    return RedirectResponse(url="/berichten", status_code=303)\n\n@app.get("/berichten")',
        "        db.commit()\n"
        "    return HTMLResponse(f\"Bedankt, {escape(mijn['naam'])}. Je bericht staat in het gastenboek.\")\n"
        '\n@app.get("/berichten")',
        "",
        eind=True,
    ),
    Fout("", "main.py", "import secrets\n", "import secrets\nfrom html import escape\n", "", eind=True),
]


def maak_kopie(doel: Path, fouten: list[Fout] | None = None, openapi: bool = True, eind: bool = False) -> Path:
    """Kopieer het referentieproject (of het eindproject) naar `doel`, met de gegeven fouten erin."""
    if eind:
        uitbreidingen.maak(doel)
    else:
        if doel.exists():
            shutil.rmtree(doel)
        shutil.copytree(REFERENTIE, doel, ignore=shutil.ignore_patterns("*.db", "__pycache__"))
    for fout in fouten or []:
        pad = doel / fout.bestand
        if fout.nieuw is None:
            if fout.naar:
                (doel / fout.naar).parent.mkdir(parents=True, exist_ok=True)
                pad.rename(doel / fout.naar)
            else:
                pad.unlink()
            continue
        tekst = pad.read_text(encoding="utf-8")
        aantal = tekst.count(fout.oud)
        if aantal != 1:
            raise SystemExit(f"{fout.bestand}: {fout.oud!r} staat er {aantal} keer in, verwacht 1 keer")
        pad.write_text(tekst.replace(fout.oud, fout.nieuw), encoding="utf-8")
    if not openapi:
        main = doel / "main.py"
        tekst = main.read_text(encoding="utf-8")
        oud = "app = FastAPI()"
        if tekst.count(oud) != 1:
            raise SystemExit("main.py: app = FastAPI() staat er niet precies één keer in")
        main.write_text(
            tekst.replace(oud, "app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)"),
            encoding="utf-8",
        )
    return doel


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("gebruik: python kapot.py <doelmap>")
    print(maak_kopie(Path(sys.argv[1]), FOUTEN))
