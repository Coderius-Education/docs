# Er gaat iets mis

Klik op je probleem om de oplossing te zien.

## Server starten

<details>
<summary>fastapi: command not found</summary>

FastAPI is niet geïnstalleerd. Run:
```bash
pip install "fastapi[standard]"
```

Zorg dat je in je virtual environment zit (je ziet `(.venv)` in de terminal).

</details>

<details>
<summary>ModuleNotFoundError: No module named 'fastapi'</summary>

Je zit niet in je virtual environment. Check of je `(.venv)` ziet in de terminal. Zo niet, activeer het:
```bash
# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate
```

</details>

<details>
<summary>Address already in use (poort 8000 bezet)</summary>

Er draait al een server op poort 8000. Sluit de andere terminal of gebruik een andere poort:
```bash
fastapi dev main.py --port 8001
```

</details>

<details>
<summary>Server start maar pagina laadt niet</summary>

- Check of je naar `http://127.0.0.1:8000` gaat (niet `https`)
- Check of de server nog draait in de terminal
- Probeer de pagina te refreshen (Ctrl+F5)

</details>

<details>
<summary>Mijn klasgenoot kan niet bij mijn server</summary>

1. Draait je server met `--host 0.0.0.0`? Zonder dat luistert hij alleen naar je eigen computer.
2. Geef je het juiste adres door? `127.0.0.1` verwijst bij hem naar zijn eigen computer, niet naar die van jou. Zoek je adres met `ipconfig` of `ip addr`.
3. Zitten jullie op hetzelfde netwerk? Het gastennetwerk op school staat vaak los van het schoolnetwerk.
4. Vraagt je firewall om toestemming? Die moet je toestaan.

Meer uitleg: [Laat het aan anderen zien](/docs/FastAPI/laat-het-zien).

</details>

## HTML & CSS

<details>
<summary>CSS werkt niet / styling is weg</summary>

Check:
1. Heb je `app.mount("/static", StaticFiles(directory="static"), name="static")` in je code?
2. Staat je CSS bestand in `static/css/style.css`?
3. Staat in je HTML: `<link rel="stylesheet" href="/static/css/style.css">`?
4. Herstart de server en doe een hard refresh (Ctrl+F5)

</details>

<details>
<summary>404 Not Found bij een pagina</summary>

- Check of het pad in `FileResponse("...")` klopt
- Check of het bestand echt op die plek staat
- Let op hoofdletters in bestandsnamen.

</details>

<details>
<summary>Afbeelding laadt niet (broken image)</summary>

- Staat de afbeelding in de `static` folder?
- Klopt de bestandsnaam exact? (hoofdletters tellen.)
- Klopt het pad in `src="/static/foto.jpg"`?
- Heb je `app.mount("/static", ...)` in je code?

</details>

<details>
<summary>HTML wordt als tekst getoond (je ziet de tags)</summary>

Je mist `response_class=HTMLResponse`:

```python
# Fout - toont HTML als tekst
@app.get("/pagina")
async def pagina():
    return "<h1>Hallo</h1>"

# Goed - toont HTML als pagina
@app.get("/pagina", response_class=HTMLResponse)
async def pagina():
    return "<h1>Hallo</h1>"
```

</details>

## Formulieren & POST

<details>
<summary>422 Unprocessable Entity</summary>

Dit betekent dat FastAPI de form data niet kan verwerken. Check:
1. Heb je `from fastapi import Form` geimporteerd?
2. Staat `name="..."` op je `<input>` tags?
3. Matcht de `name` in HTML met de parameter in Python?
4. Staat `method="post"` op je `<form>` tag?

</details>

<details>
<summary>Form data komt niet aan</summary>

Check:
1. `method="post"` in de form tag?
2. `action="/juiste_endpoint"` in de form tag?
3. `name="veldnaam"` op elk input veld?
4. Parameter naam in Python matcht met `name` in HTML?

Voorbeeld:
```html
<input name="naam">     <!-- HTML -->
```
```python
naam: str = Form(...)    # Python - moet "naam" zijn!
```

</details>

<details>
<summary>Method Not Allowed (405)</summary>

Je stuurt een POST naar een GET endpoint of andersom. Check:
- Formulier heeft `method="post"` → endpoint moet `@app.post(...)` zijn
- Browser URL bezoeken is altijd GET → endpoint moet `@app.get(...)` zijn

</details>

## Templates (Jinja2)

<details>
<summary>TemplateNotFound error</summary>

- Staat je template in de `templates` folder?
- Klopt de bestandsnaam in `TemplateResponse("bestand.html", ...)`?
- Heb je `templates = Jinja2Templates(directory="templates")` in je code?

</details>

<details>
<summary>Template variabele toont niets</summary>

Check of je de variabele meestuurt in het dictionary:

```python
# FOUT - naam niet meegestuurd
return templates.TemplateResponse(request, "pagina.html", {})

# GOED - naam meegestuurd
return templates.TemplateResponse(request, "pagina.html", {"naam": naam})
```

</details>

<details>
<summary>TypeError: unhashable type: 'dict'</summary>

Je gebruikt de oude volgorde, waarin `request` ín het dictionary staat. Die kom je nog overal online tegen, maar hij werkt niet meer. `request` gaat tegenwoordig als eerste mee:

```python
# FOUT - oude schrijfwijze
return templates.TemplateResponse("pagina.html", {"request": request, "naam": naam})

# GOED - request vooraan
return templates.TemplateResponse(request, "pagina.html", {"naam": naam})
```

De foutmelding noemt templates niet, omdat jouw bestandsnaam op de plek van `request` belandt en jouw dictionary op de plek van de bestandsnaam. FastAPI zoekt dan een template met een dictionary als naam.

Meer uitleg: [POST met templates](/docs/FastAPI/post_met_templates).

</details>

<details>
<summary>Lijst blijft leeg terwijl er wel data in de database staat</summary>

Een `{% for %}` die niets toont betekent bijna altijd dat de lijst leeg bij de template aankomt. Check in deze volgorde:

1. Staat de naam in `{% for bericht in berichten %}` precies gelijk aan de sleutel in `{"berichten": ...}`?
2. Print `alle_berichten` in je endpoint. Zie je daar wél data, dan zit de fout in de template.
3. Staat je database wel echt vol? Open `/berichten` nadat je een bericht hebt verstuurd, niet ervoor.

Meer uitleg: [Een lijst tonen](/docs/FastAPI/lijst_tonen).

</details>

<details>
<summary>AttributeError: 'NoneType' object has no attribute 'select'</summary>

Je gebruikt de data van je database buiten het `with`-blok, zonder er eerst een lijst van te maken. `db.values()` geeft geen lijst maar een generator: die haalt de rijen pas op als je erdoorheen loopt, en tegen die tijd is de database al dicht.

```python
# FOUT - de generator wordt pas buiten het with-blok gebruikt
with SqliteDict("gastenboek.db") as db:
    alle_berichten = db.values()

# GOED - list() haalt de data binnen het with-blok op
with SqliteDict("gastenboek.db") as db:
    alle_berichten = list(db.values())
```

Meer uitleg: [Een lijst tonen](/docs/FastAPI/lijst_tonen).

</details>

<details>
<summary>Na het versturen van een formulier krijg je 405 Method Not Allowed</summary>

Je stuurt een redirect terug zonder `status_code=303`:

```python
# FOUT - stuurt 307, de browser herhaalt je POST op de nieuwe URL
return RedirectResponse(url="/berichten")

# GOED - stuurt 303, de browser doet een GET
return RedirectResponse(url="/berichten", status_code=303)
```

Meer uitleg: [Terug naar de lijst](/docs/FastAPI/redirect).

</details>

## JavaScript

<details>
<summary>Cannot read properties of null (reading 'addEventListener')</summary>

Je script draait voordat het element bestaat. Zet `defer` op je script-tag:

```html
<!-- FOUT - draait terwijl de browser nog in de head zit -->
<script src="/static/js/app.js"></script>

<!-- GOED - wacht tot de pagina er staat -->
<script src="/static/js/app.js" defer></script>
```

Staat `defer` er wel? Check dan of de `id` in je HTML precies gelijk is aan die in je `querySelector`, inclusief hoofdletters.

Meer uitleg: [JavaScript erbij](/docs/FastAPI/javascript).

</details>

<details>
<summary>Mijn JavaScript-bestand wordt niet geladen (404 in de console)</summary>

Check in deze volgorde:

1. Staat het bestand in `static/js/`?
2. Staat `app.mount("/static", StaticFiles(directory="static"), name="static")` in je `main.py`?
3. Begint het pad in je script-tag met een slash: `src="/static/js/app.js"`?

Open `http://127.0.0.1:8000/static/js/app.js` rechtstreeks in je browser. Zie je je code, dan ligt het aan de script-tag; krijg je een 404, dan aan het pad of de mount.

</details>

<details>
<summary>Mijn controle in de HTML wordt genegeerd</summary>

`maxlength` en `required` gelden alleen in de browser van de bezoeker. Wie het formulier omzeilt, komt er gewoon langs. Wil je echt een grens, controleer dan óók in Python:

```python
if len(bericht) > 80:
    raise HTTPException(status_code=400, detail="Bericht is te lang")
```

Meer uitleg: [Server of browser?](/docs/FastAPI/server-of-browser).

</details>

<details>
<summary>TypeError: antwoord.json is not a function</summary>

Je bent een `await` vergeten bij `fetch`:

```javascript
// FOUT - antwoord is nog een belofte, geen antwoord
const antwoord = fetch("/api/berichten");

// GOED
const antwoord = await fetch("/api/berichten");
```

Meer uitleg: [Data ophalen met fetch](/docs/FastAPI/fetch).

</details>

<details>
<summary>await is only valid in async functions</summary>

`await` mag alleen in een functie die zelf `async` is:

```javascript
// FOUT
function laadBerichten() {
    const antwoord = await fetch("/api/berichten");
}

// GOED
async function laadBerichten() {
    const antwoord = await fetch("/api/berichten");
}
```

</details>

## Database (sqlitedict)

<details>
<summary>ModuleNotFoundError: No module named 'sqlitedict'</summary>

Installeer het:
```bash
pip install sqlitedict
```

Check dat je in je virtual environment zit.

</details>

<details>
<summary>Data is weg na herstarten</summary>

Je bent `db.commit()` vergeten:

```python
with SqliteDict("data.db") as db:
    db["key"] = "waarde"
    db.commit()  # DIT NIET VERGETEN!
```

</details>

<details>
<summary>KeyError bij uitlezen</summary>

De key bestaat niet. Gebruik `db.get()` met een default waarde:

```python
# Fout - crasht als key niet bestaat
waarde = db["naam"]

# Goed - geeft "Onbekend" als key niet bestaat
waarde = db.get("naam", "Onbekend")
```

</details>

## Algemeen

<details>
<summary>Wijzigingen zijn niet zichtbaar</summary>

1. Herstart de server (Ctrl+C, dan opnieuw `fastapi dev main.py`)
2. Hard refresh in browser (Ctrl+F5)
3. Check of je het juiste bestand hebt aangepast

</details>

<details>
<summary>ImportError / NameError</summary>

Je bent een import vergeten. Meest voorkomende imports:

```python
from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlitedict import SqliteDict
```

</details>

<details>
<summary>IndentationError</summary>

Python is streng op inspringen. Gebruik overal dezelfde hoeveelheid spaties (4 spaties is standaard). Mix niet tabs en spaties.

</details>
