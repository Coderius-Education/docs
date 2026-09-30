# Cheatsheet

Snelle referentie voor alles wat je hebt geleerd. Klik op een onderwerp om het te openen. De onderwerpen staan in de volgorde van de lessen. Welk bestand in welke map hoort, staat bij [Projectstructuur](/docs/FastAPI/projectstructuur).


## FastAPI

<details>
<summary>Hoe maak ik een FastAPI-app? (FastAPI)</summary>

```python
from fastapi import FastAPI

app = FastAPI()
```

Eén keer, bovenaan, direct na de imports. Alle endpoints komen eronder.

</details>

<details>
<summary>Hoe start ik mijn server? (fastapi dev)</summary>

```bash
fastapi dev main.py
```

Open: `http://127.0.0.1:8000`. Stoppen doe je met Ctrl+C in de terminal.

</details>

<details>
<summary>Hoe geef ik JSON terug? (@app.get)</summary>

```python
@app.get("/")
async def root():
    return {"bericht": "Hallo wereld"}
```

</details>

<details>
<summary>Hoe geef ik een HTML-pagina terug? (HTMLResponse)</summary>

```python
from fastapi.responses import HTMLResponse

@app.get("/pagina", response_class=HTMLResponse)
async def pagina():
    return """
    <html>
        <body><h1>Hallo</h1></body>
    </html>
    """
```

</details>

<details>
<summary>Hoe stuur ik een HTML-bestand? (FileResponse)</summary>

```python
from fastapi.responses import FileResponse

@app.get("/")
async def home():
    return FileResponse("static/pages/home.html")
```

</details>

<details>
<summary>Hoe maak ik CSS en afbeeldingen bereikbaar? (app.mount)</summary>

```python
from fastapi.staticfiles import StaticFiles

app.mount("/static", StaticFiles(directory="static"), name="static")
```

Alles in de map `static` staat dan op `/static/...`.

</details>

<details>
<summary>Hoe vul ik een template in? (TemplateResponse)</summary>

```python
from fastapi import Request
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")

@app.get("/dobbelsteen")
async def dobbelsteen(request: Request):
    return templates.TemplateResponse(request, "dobbelsteen.html", {"worp": 4})
```

**Let op:** `request` is het eerste argument, vóór de bestandsnaam.

</details>

<details>
<summary>Hoe lees ik iets na het vraagteken in de URL? (query-parameter)</summary>

```python
@app.get("/zoek")
async def zoek(term: str = ""):
    return {"je_zocht": term}
```

`/zoek?term=python` geeft `term` de waarde `python`. Met de standaardwaarde `""` werkt `/zoek` ook zonder vraagteken; zonder standaardwaarde krijg je dan een 422.

</details>

<details>
<summary>Hoe ontvang ik een formulier? (@app.post en Form)</summary>

```python
from fastapi import Form

@app.post("/gastenboek")
async def gastenboek_opslaan(naam: str = Form(...), bericht: str = Form(...)):
    return {"naam": naam, "bericht": bericht}
```

**Let op:** de `name` in HTML moet gelijk zijn aan de parameter in Python.

</details>

<details>
<summary>Hoe stuur ik door na een POST? (RedirectResponse)</summary>

```python
from fastapi.responses import RedirectResponse

@app.post("/gastenboek")
async def gastenboek_opslaan(naam: str = Form(...)):
    return RedirectResponse(url="/berichten", status_code=303)
```

**Let op:** zonder `status_code=303` krijg je een 405. De standaard is 307, en die herhaalt je POST.

</details>

<details>
<summary>Hoe haal ik een waarde uit het pad? (path-parameter)</summary>

```python
@app.get("/bericht/{sleutel}")
async def bericht_detail(sleutel: str):
    return {"sleutel": sleutel}
```

**Let op:** de naam tussen accolades moet gelijk zijn aan de parameternaam.

</details>

<details>
<summary>Hoe stuur ik een 404 als iets niet bestaat? (HTTPException)</summary>

```python
from fastapi import HTTPException

@app.get("/bericht/{sleutel}")
async def bericht_detail(sleutel: str):
    with SqliteDict("gastenboek.db") as db:
        bericht = db.get(sleutel)
    if bericht is None:
        raise HTTPException(status_code=404, detail="Dit bericht bestaat niet")
    return bericht
```

**Let op:** `raise`, niet `return`.

</details>

<details>
<summary>Hoe weiger ik invoer die niet klopt? (HTTPException met 400)</summary>

```python
@app.post("/gastenboek")
async def gastenboek_opslaan(naam: str = Form(...), bericht: str = Form(...)):
    if len(bericht) > 80:
        raise HTTPException(status_code=400, detail="Bericht is te lang")
    return RedirectResponse(url="/berichten", status_code=303)
```

Controleer aan het begin van je endpoint, vóór je iets opslaat. Een `maxlength` in de HTML is geen controle: die kan een bezoeker weghalen.

</details>

<details>
<summary>Wat betekent deze statuscode?</summary>

| Code | Betekent | Wie stuurt hem |
|:---:|---|---|
| `200` | gelukt | je endpoint |
| `303` | ga naar deze URL, met een GET | jij, met `RedirectResponse(..., status_code=303)` |
| `307` | doe hetzelfde verzoek op deze URL | `RedirectResponse` zonder `status_code` |
| `400` | dit verzoek klopt niet | jij, met `HTTPException` |
| `403` | dit mag jij niet | jij, bij iets van een ander |
| `404` | bestaat niet | FastAPI of jij |
| `405` | dit pad bestaat, maar niet voor deze soort verzoek | FastAPI |
| `422` | een waarde ontbreekt of past niet | FastAPI, vóór je functie |
| `429` | te veel verzoeken | `slowapi` |
| `500` | fout in je server | niemand bewust; kijk in de terminal |

`400`, `403` en `429` komen terug in [Veiligheid](/docs/veiligheid#statuscodes).

</details>

<details>
<summary>Hoe verwijder ik zonder herladen? (@app.delete)</summary>

```python
from fastapi.responses import HTMLResponse

@app.delete("/bericht/{sleutel}")
async def bericht_verwijderen(sleutel: str):
    with SqliteDict("gastenboek.db") as db:
        if sleutel not in db:
            raise HTTPException(status_code=404, detail="Dit bericht bestaat niet")
        del db[sleutel]
        db.commit()
    return HTMLResponse("")
```

Een formulier zonder htmx kan alleen GET en POST; `hx-delete` stuurt een DELETE. Met `hx-swap="outerHTML"` haalt het lege antwoord het doel van de pagina.

</details>

<details>
<summary>Hoe geef ik een cookie mee? (set_cookie)</summary>

```python
@app.post("/gastenboek")
async def gastenboek_opslaan(naam: str = Form(...)):
    antwoord = RedirectResponse(url="/berichten", status_code=303)
    antwoord.set_cookie(key="naam", value=naam, max_age=60 * 60 * 24 * 30)
    return antwoord
```

**Let op:** maak het antwoord eerst als variabele, anders heb je geen plek om de cookie op te zetten. `max_age` is de houdbaarheid in seconden.

</details>

<details>
<summary>Hoe lees ik een cookie uit? (Cookie)</summary>

```python
from fastapi import Cookie

@app.get("/gastenboek")
async def gastenboek_form(request: Request, naam: str = Cookie(default="")):
    return templates.TemplateResponse(request, "gastenboek.html", {"naam": naam})
```

Weghalen doe je met `antwoord.delete_cookie("naam")`.

**Let op:** een cookie staat bij de bezoeker en kan door hem veranderd worden. Gebruik hem niet voor iets waar rechten aan hangen.

</details>

<details>
<summary>Hoe onthoud ik iets op de server? (sessie met secrets)</summary>

```python
import secrets

@app.post("/gastenboek")
async def gastenboek_opslaan(
    naam: str = Form(...),
    bericht: str = Form(...),
    sessie_id: str = Cookie(default=""),
):
    if not sessie_id:
        sessie_id = secrets.token_hex(16)

    sleutel = f"bericht_{time.time_ns()}"
    with SqliteDict("gastenboek.db") as db:
        db[sleutel] = {"naam": naam, "bericht": bericht}
        db.commit()

    with SqliteDict("sessies.db") as sessies:
        mijn = sessies.get(sessie_id, {"naam": naam, "berichten": []})
        mijn["naam"] = naam
        mijn["berichten"].append(sleutel)
        sessies[sessie_id] = mijn
        sessies.commit()

    antwoord = RedirectResponse(url="/berichten", status_code=303)
    antwoord.set_cookie(key="sessie_id", value=sessie_id, max_age=60 * 60 * 24 * 30)
    return antwoord
```

Uitlezen:

```python
with SqliteDict("sessies.db") as sessies:
    mijn = sessies.get(sessie_id, {})
```

**Let op:** in de cookie staat alleen het sessie-id, de gegevens staan op de server. Haal de sessie eerst op met `.get()` en vul hem aan: schrijf je er een nieuwe dictionary overheen, dan ben je de lijst `berichten` kwijt.

</details>

<details>
<summary>Hoe zet ik mijn server open voor het netwerk? (--host 0.0.0.0)</summary>

```bash
fastapi dev main.py --host 0.0.0.0
```

Zoek je adres met `ipconfig` (Windows) of `ip addr` (macOS/Linux) en geef `http://<jouw-adres>:8000` door.

**Let op:** iedereen op hetzelfde netwerk kan er dan bij.

</details>

## Browser

<details>
<summary>Hoe open ik de ontwikkelaarstools? (F12)</summary>

Druk op **F12**, of klik met de rechtermuisknop op de pagina en kies **Inspecteren**. Dat laatste opent meteen het tabblad **Elementen** op het element waar je op klikte.

De tabbladen die je in deze cursus gebruikt:

- **Console**: fouten uit je JavaScript, met bestand en regelnummer
- **Netwerk**: elk verzoek van de pagina, met statuscode en herkomst
- **App** (Application; in Firefox Opslag): de cookies van de site

</details>

<details>
<summary>Hoe zie ik welke verzoeken de pagina doet? (tabblad Netwerk)</summary>

Tabblad **Netwerk**, herlaad de pagina. Eén regel per verzoek.

- **Status** `200`: gevonden. `404`: het pad klopt niet, of `app.mount` ontbreekt.
- **Grootte** met **(schijfcache)**: de browser heeft de server niet gevraagd.
- Klik een regel aan voor de headers, zoals `Cookie:` bij een sessie.

</details>

<details>
<summary>Hoe herlaad ik zonder cache? (Ctrl+Shift+R)</summary>

Met de ontwikkelaarstools open: rechtermuisknop op de herlaadknop, dan **Cache wissen en geforceerd opnieuw laden**. Sneltoets: **Ctrl+Shift+R**.

Zolang je aan je site werkt: tabblad **Netwerk**, vinkje **Cache uitzetten** aan.

</details>

## HTML

<details>
<summary>Hoe ziet een HTML-pagina eruit? (DOCTYPE)</summary>

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Titel</title>
    </head>
    <body>
        <h1>Kop</h1>
        <p>Alinea</p>
    </body>
</html>
```

</details>

<details>
<summary>Hoe link ik naar een andere pagina? (a href)</summary>

```html
<a href="/about">Over mij</a>
```

**Let op:** link naar het **endpoint**, niet naar het bestand.

</details>

<details>
<summary>Hoe koppel ik CSS aan mijn pagina? (link)</summary>

```html
<link rel="stylesheet" href="/static/css/style.css">
```

</details>

<details>
<summary>Hoe toon ik een afbeelding? (img)</summary>

```html
<img src="/static/kat.jpg" alt="Een kat op een vensterbank">
```

</details>

<details>
<summary>Hoe zet ik een waarde uit Python in een template? (dubbele accolades)</summary>

In Python:

{/* niet-compileren: losse regel uit een handler */}
```python
return templates.TemplateResponse(request, "welkom.html", {"naam": "Sam", "speler": {"punten": 12}})
```

In de template:

```html
<h1>Welkom {{ naam }}</h1>
<p>{{ speler.punten }} punten</p>
```

De naam tussen de accolades is de sleutel uit het dictionary. Een onderdeel van een dictionary haal je eruit met een punt.

</details>

<details>
<summary>Hoe maak ik een formulier? (form method="post")</summary>

```html
<form method="post" action="/gastenboek">
    <input type="text" name="naam" required>
    <button type="submit">Verstuur</button>
</form>
```

**Let op:** `name` in HTML moet gelijk zijn aan de parameter in Python.

</details>

<details>
<summary>Hoe herhaal ik iets voor elk bericht? (for-lus in een template)</summary>

```html
<ul>
    {% for bericht in berichten %}
        <li>{{ bericht.naam }}: {{ bericht.bericht }}</li>
    {% endfor %}
</ul>
```

Binnen de lus telt `{{ loop.index }}` vanaf 1.

</details>

<details>
<summary>Hoe vang ik een lege lijst op? (if en else in een template)</summary>

```html
{% if berichten %}
    <p>Er zijn berichten</p>
{% else %}
    <p>Nog geen berichten</p>
{% endif %}
```

</details>

<details>
<summary>Hoe maak ik een verwijderknop per bericht? (verborgen veld)</summary>

Stuur de berichten mét sleutel mee (`list(db.items())`, zie Database). In de template:

```html
{% for sleutel, bericht in berichten %}
    <li>
        {{ bericht.naam }}: {{ bericht.bericht }}
        <form method="post" action="/verwijderen">
            <input type="hidden" name="sleutel" value="{{ sleutel }}">
            <button type="submit">Verwijderen</button>
        </form>
    </li>
{% endfor %}
```

In `main.py`:

```python
@app.post("/verwijderen")
async def verwijderen(sleutel: str = Form(...)):
    with SqliteDict("gastenboek.db") as db:
        if sleutel in db:
            del db[sleutel]
            db.commit()
    return RedirectResponse(url="/berichten", status_code=303)
```

Een `type="hidden"` ziet de bezoeker niet, maar hij gaat wel mee met het formulier.

</details>

<details>
<summary>Hoe link ik naar de pagina van één bericht? (sleutel in de link)</summary>

```html
{% for sleutel, bericht in berichten %}
    <li><a href="/bericht/{{ sleutel }}">{{ bericht.naam }}</a></li>
{% endfor %}
```

De link komt uit bij het endpoint `/bericht/{sleutel}` (zie Hoe haal ik een waarde uit het pad?).

</details>

<details>
<summary>Hoe gebruik ik een stuk template opnieuw? (include)</summary>

`templates/berichten_lijst.html` is een stuk pagina zonder `<html>` eromheen. In de pagina:

```html
<div id="berichten-lijst">
    {% include "berichten_lijst.html" %}
</div>
```

Hetzelfde bestand geeft je endpoint terug als antwoord op een htmx-verzoek.

</details>

## Mappenstructuur

<details>
<summary>Welk bestand hoort in welke map? (projectstructuur)</summary>

```
je-project/
├── main.py
├── gastenboek.db
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   └── htmx.min.js
│   ├── pages/
│   │   ├── home.html
│   │   └── gastenboek_form.html
│   └── kat.jpg
└── templates/
    ├── bericht.html
    ├── berichten.html
    └── berichten_lijst.html
```

Vaste pagina's staan in `static/pages/`, pagina's met `{{ }}` in `templates/`. De `.db`-bestanden maakt `sqlitedict` zelf aan. Hoe de mappen per les groeien, staat bij [Projectstructuur](/docs/FastAPI/projectstructuur).

</details>

## Database (sqlitedict)

<details>
<summary>Hoe installeer ik sqlitedict? (python -m pip install)</summary>

```bash
python -m pip install sqlitedict
```

</details>

<details>
<summary>Hoe sla ik iets op? (db[...] = en commit)</summary>

```python
from sqlitedict import SqliteDict

with SqliteDict("data.db") as db:
    db["naam"] = "Jan"
    db.commit()
```

Zonder `db.commit()` is je wijziging weg als de server stopt.

</details>

<details>
<summary>Hoe lees ik iets uit? (db[...])</summary>

```python
with SqliteDict("data.db") as db:
    print(db["naam"])
```

</details>

<details>
<summary>Hoe geef ik elk bericht een eigen sleutel? (time.time_ns)</summary>

```python
import time

with SqliteDict("gastenboek.db") as db:
    sleutel = f"bericht_{time.time_ns()}"
    db[sleutel] = {"naam": "Sam", "bericht": "Hoi"}
    db.commit()
```

**Let op:** met een vaste sleutel, of met `int(time.time())`, overschrijft een nieuw bericht het vorige.

</details>

<details>
<summary>Hoe stuur ik alle berichten naar een template? (list met db.values)</summary>

```python
@app.get("/berichten")
async def berichten(request: Request):
    with SqliteDict("gastenboek.db") as db:
        alle_berichten = list(db.values())
    return templates.TemplateResponse(request, "berichten.html", {"berichten": alle_berichten})
```

**Let op:** `list()` haalt de berichten op zolang de database nog open is. Zonder `list()` krijg je `AttributeError: 'NoneType' object has no attribute 'select'`.

</details>

<details>
<summary>Hoe krijg ik de sleutels erbij? (db.items)</summary>

```python
with SqliteDict("gastenboek.db") as db:
    alle_berichten = list(db.items())
```

Elk element is een paar: eerst de sleutel, dan het bericht. In de template loop je dan met `{% for sleutel, bericht in berichten %}`.

</details>

<details>
<summary>Hoe verwijder ik iets? (del db[...])</summary>

```python
with SqliteDict("gastenboek.db") as db:
    if sleutel in db:
        del db[sleutel]
        db.commit()
```

Zonder `if sleutel in db` crasht je endpoint als iemand twee keer op Verwijderen klikt.

</details>

<details>
<summary>Hoe lees ik iets uit dat misschien niet bestaat? (db.get)</summary>

```python
with SqliteDict("data.db") as db:
    naam = db.get("naam", "Niet gevonden")
```

Zonder tweede argument geeft `db.get()` `None` als de sleutel niet bestaat, in plaats van een `KeyError`.

</details>

## htmx

<details>
<summary>Hoe koppel ik htmx aan mijn pagina? (htmx.min.js)</summary>

Download `htmx.min.js` (de link staat bij [Zonder herladen met htmx](/docs/FastAPI/htmx)) naar `static/js/`, en in de `<head>` van elke pagina die htmx gebruikt:

```html
<script src="/static/js/htmx.min.js"></script>
```

</details>

<details>
<summary>Hoe stuur ik een verzoek zonder herladen? (hx-post, hx-get, hx-delete)</summary>

```html
<form hx-post="/gastenboek" hx-target="#berichten-lijst">
<button hx-get="/berichten/lijst" hx-target="#berichten-lijst">Ververs</button>
<button hx-delete="/bericht/{{ sleutel }}" hx-target="#bericht-{{ sleutel }}" hx-swap="outerHTML">Verwijderen</button>
```

Het endpoint geeft een stukje HTML terug (`HTMLResponse("Bedankt")` of een template zonder `<html>` eromheen), nooit een omleiding.

</details>

<details>
<summary>Waar komt het antwoord terecht? (hx-target en hx-swap)</summary>

- `hx-target="#id"`: het element dat het antwoord krijgt. Zonder `hx-target` is dat het element met het attribuut zelf.
- `hx-swap="innerHTML"` (standaard): vervangt wat er in het doel staat.
- `hx-swap="outerHTML"`: vervangt het doel zelf. Met een leeg antwoord verdwijnt het.

</details>

<details>
<summary>Wanneer gaat het verzoek? (hx-trigger)</summary>

```html
<div id="berichten-lijst" hx-get="/berichten/lijst" hx-trigger="every 10s">
```

Standaard: bij een klik op een knop of het versturen van een formulier.

</details>

<details>
<summary>Hoe vraag ik eerst om bevestiging? (hx-confirm)</summary>

```html
<button hx-delete="/bericht/{{ sleutel }}" hx-confirm="Dit bericht verwijderen?">Verwijderen</button>
```

</details>

## JavaScript

<details>
<summary>Hoe koppel ik JavaScript aan mijn pagina? (script met defer)</summary>

Bestand in `static/js/app.js`, en in de `<head>` van je template:

```html
<script src="/static/js/app.js" defer></script>
```

`app.mount("/static", ...)` serveert het al; aan `main.py` verandert niets.

**Let op:** zonder `defer` draait je script voordat de pagina er staat, en vindt `querySelector` niets.

</details>

<details>
<summary>Hoe reageer ik op typen of klikken? (addEventListener)</summary>

```js
const veld = document.querySelector("#bericht-veld");
const teller = document.querySelector("#teller");

veld.addEventListener("input", function () {
    teller.textContent = 80 - veld.value.length + " tekens over";
});
```

</details>

## Veiligheid

<details>
<summary>Hoe bewaar ik een wachtwoord veilig? (Argon2)</summary>

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()

hash = ph.hash("welkom123")

try:
    ph.verify(hash, "welkom123")
    print("Ingelogd")
except VerifyMismatchError:
    print("Klopt niet")
```

Bewaar de hash, nooit het wachtwoord. `ph.verify` vergelijk je nooit zelf met `==`: elke hash heeft een eigen zout. Zie [Wachtwoorden](/docs/veiligheid/wachtwoorden/gewone-tekst).

</details>

<details>
<summary>Hoe beperk ik het aantal verzoeken? (slowapi)</summary>

```python
from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/")
@limiter.limit("5/minute")
async def root(request: Request):
    return {"bericht": "Hallo wereld!"}
```

Het endpoint heeft `request: Request` nodig. Zie [Te veel verzoeken](/docs/veiligheid/dos/limiet).

</details>

<details>
<summary>Hoe controleer ik wie iets mag? (403)</summary>

```python
if sleutel not in mijn.get("berichten", []):
    raise HTTPException(status_code=403, detail="Dit is niet jouw bericht")
```

Zet de controle in het endpoint, vóór er iets verandert, en op elk endpoint apart. Zie [Wie mag wat](/docs/veiligheid/toegang/zwakheid).

</details>

<details>
<summary>Hoe maak ik HTML van een bezoeker onschadelijk? (escape)</summary>

{/* niet-compileren: losse regel uit een handler */}

```python
from html import escape

return HTMLResponse(f"Bedankt, {escape(naam)}.")
```

Een `{{ }}`-template escapet vanzelf; een f-string niet. Gebruik `|safe` nooit voor tekst van een bezoeker. Zie [HTML van een bezoeker](/docs/veiligheid/xss/zwakheid).

</details>

<details>
<summary>Hoe houd ik scripts bij mijn cookie weg? (httponly)</summary>

```python
antwoord.set_cookie(
    key="sessie_id",
    value=sessie_id,
    max_age=60 * 60 * 24 * 30,
    httponly=True,
    samesite="lax",
)
```

`httponly` houdt scripts bij de cookie weg, `samesite` stuurt hem niet mee vanaf een andere site, en `secure=True` (met https) alleen versleuteld. Zie [Cookies afschermen](/docs/veiligheid/cookies/zwakheid).

</details>

<details>
<summary>Hoe begrens ik invoer op de server? (Form met max_length)</summary>

```python
@app.post("/bericht")
async def bericht_plaatsen(bericht: str = Form(..., min_length=1, max_length=280)):
    ...
```

`maxlength` in de HTML helpt alleen wie zich vergist; de echte grens staat in `Form`. Zie [Invoer controleren](/docs/veiligheid/invoer/grenzen).

</details>
