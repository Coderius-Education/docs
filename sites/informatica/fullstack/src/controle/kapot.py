"""Een kapotte kopie van het referentieproject, met fouten die leerlingen maken.

Elke fout is een vervanging in één bestand (of een bestand dat ontbreekt), met
het hoofdstuk waarin static/controleer.py hem moet vinden en het begin van de
✗-regel die daarbij hoort. draai.py zet de kopie neer, start hem en eist per
fout die regel. Een controle die een fout stil goedkeurt, valt zo op.

    python kapot.py <doelmap>   # alleen de kopie maken, om zelf te proberen
"""

from __future__ import annotations

import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

REFERENTIE = Path(__file__).resolve().parent / "referentie"


@dataclass(frozen=True)
class Fout:
    hoofdstuk: str
    bestand: str
    oud: str
    nieuw: str | None  # None: het bestand ontbreekt
    verwacht: str  # het begin van de ✗-regel


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


def maak_kopie(doel: Path, fouten: list[Fout] | None = None, openapi: bool = True) -> Path:
    """Kopieer het referentieproject naar `doel`, met de gegeven fouten erin."""
    if doel.exists():
        shutil.rmtree(doel)
    shutil.copytree(REFERENTIE, doel, ignore=shutil.ignore_patterns("*.db", "__pycache__"))
    for fout in fouten or []:
        pad = doel / fout.bestand
        if fout.nieuw is None:
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
