# Cheatsheet

Snelle referentie voor alles wat je hebt geleerd. Klik op een onderwerp om het te openen.


## FastAPI

<details>
<summary>FastAPI app aanmaken</summary>

```python
from fastapi import FastAPI

app = FastAPI()
```

</details>

<details>
<summary>Server starten</summary>

```bash
fastapi dev main.py
```

Open: `http://127.0.0.1:8000`

</details>

<details>
<summary>Je server openzetten voor het netwerk</summary>

```bash
fastapi dev main.py --host 0.0.0.0
```

Zoek je adres met `ipconfig` (Windows) of `ip addr` (macOS/Linux) en geef `http://<jouw-adres>:8000` door.

**Let op:** iedereen op hetzelfde netwerk kan er dan bij.

</details>

<details>
<summary>GET endpoint (JSON)</summary>

```python
@app.get("/")
async def root():
    return {"bericht": "Hallo!"}
```

</details>

<details>
<summary>GET endpoint (HTML)</summary>

```python
from fastapi.responses import HTMLResponse

@app.get("/pagina", response_class=HTMLResponse)
async def pagina():
    return """
    <html>
        <body><h1>Hallo!</h1></body>
    </html>
    """
```

</details>

<details>
<summary>Static files instellen</summary>

```python
from fastapi.staticfiles import StaticFiles

app.mount("/static", StaticFiles(directory="static"), name="static")
```

</details>

<details>
<summary>HTML bestand serveren (FileResponse)</summary>

```python
from fastapi.responses import FileResponse

@app.get("/")
async def home():
    return FileResponse("static/pages/home.html")
```

</details>

<details>
<summary>POST endpoint (Form data)</summary>

```python
from fastapi import Form

@app.post("/verstuur")
async def verstuur(naam: str = Form(...)):
    return {"naam": naam}
```

**Let op:** de `name` in HTML moet matchen met de Python parameter.

</details>

<details>
<summary>Jinja2 template response</summary>

```python
from fastapi import Request
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")

@app.post("/groet")
async def groet(request: Request, naam: str = Form(...)):
    return templates.TemplateResponse(
        request,
        "resultaat.html",
        {"naam": naam}
    )
```

**Let op:** `request` is het eerste argument, vóór de bestandsnaam.

</details>

<details>
<summary>Redirect na een POST</summary>

```python
from fastapi.responses import RedirectResponse

@app.post("/opslaan")
async def opslaan(naam: str = Form(...)):
    return RedirectResponse(url="/lijst", status_code=303)
```

**Let op:** zonder `status_code=303` krijg je een 405. De standaard is 307, en die herhaalt je POST.

</details>

<details>
<summary>Path-parameter in de URL</summary>

```python
@app.get("/bericht/{sleutel}")
async def bericht_detail(sleutel: str):
    return {"sleutel": sleutel}
```

**Let op:** de naam tussen accolades moet gelijk zijn aan de parameternaam.

</details>

<details>
<summary>404 sturen als iets niet bestaat</summary>

```python
from fastapi import HTTPException

@app.get("/bericht/{sleutel}")
async def bericht_detail(sleutel: str):
    with SqliteDict("gastenboek.db") as db:
        bericht = db.get(sleutel)
    if bericht is None:
        raise HTTPException(status_code=404, detail="Bestaat niet")
    return bericht
```

**Let op:** `raise`, niet `return`.

</details>

<details>
<summary>Een cookie meegeven</summary>

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
<summary>Een cookie uitlezen</summary>

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
<summary>Een sessie: gegevens op de server</summary>

```python
import secrets

@app.post("/gastenboek")
async def gastenboek_opslaan(naam: str = Form(...), sessie_id: str = Cookie(default="")):
    if not sessie_id:
        sessie_id = secrets.token_hex(16)

    with SqliteDict("sessies.db") as sessies:
        sessies[sessie_id] = {"naam": naam}
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

**Let op:** in de cookie staat alleen het sessie-id, de gegevens staan op de server. Gebruik `.get()` met een standaardwaarde: bij een onbekend sessie-id bestaat de sleutel niet.

</details>

## HTML

<details>
<summary>Basis HTML pagina</summary>

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Titel</title>
    </head>
    <body>
        <h1>Heading</h1>
        <p>Paragraaf</p>
    </body>
</html>
```

</details>

<details>
<summary>CSS koppelen</summary>

```html
<link rel="stylesheet" href="/static/css/style.css">
```

</details>

<details>
<summary>Afbeelding tonen</summary>

```html
<img src="/static/foto.jpg" alt="Beschrijving">
```

</details>

<details>
<summary>Link naar andere pagina</summary>

```html
<a href="/about">Ga naar About</a>
```

**Let op:** link naar het **endpoint**, niet naar het bestand.

</details>

<details>
<summary>Formulier (POST)</summary>

```html
<form method="post" action="/verstuur">
    <input type="text" name="naam" required>
    <button type="submit">Verstuur</button>
</form>
```

**Let op:** `name` in HTML moet matchen met de parameter in Python.

</details>

<details>
<summary>Template variabele (Jinja2)</summary>

In de template:
```html
<h1>Hallo {{ naam }}!</h1>
```

Wordt vervangen door de waarde uit Python.

</details>

<details>
<summary>Lijst herhalen in een template (for-lus)</summary>

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
<summary>Lege lijst opvangen (if en else)</summary>

```html
{% if berichten %}
    <p>Er zijn berichten</p>
{% else %}
    <p>Nog geen berichten</p>
{% endif %}
```

</details>

## JavaScript

<details>
<summary>JavaScript koppelen aan je pagina</summary>

Bestand in `static/js/app.js`, en in de `<head>` van je template:

```html
<script src="/static/js/app.js" defer></script>
```

`app.mount("/static", ...)` serveert het al; aan `main.py` verandert niets.

**Let op:** zonder `defer` draait je script voordat de pagina er staat, en vindt `querySelector` niets.

</details>

<details>
<summary>Reageren op typen of klikken</summary>

```javascript
const veld = document.querySelector("#bericht-veld");
const teller = document.querySelector("#teller");

veld.addEventListener("input", function () {
    teller.textContent = 80 - veld.value.length + " tekens over";
});
```

</details>

## Database (sqlitedict)

<details>
<summary>Installatie</summary>

```bash
pip install sqlitedict
```

</details>

<details>
<summary>Data opslaan</summary>

```python
from sqlitedict import SqliteDict

with SqliteDict("data.db") as db:
    db["naam"] = "Jan"
    db.commit()  # NIET vergeten!
```

</details>

<details>
<summary>Data uitlezen</summary>

```python
with SqliteDict("data.db") as db:
    print(db["naam"])
```

</details>

<details>
<summary>Data veilig uitlezen (met default)</summary>

```python
with SqliteDict("data.db") as db:
    # Crasht niet als "naam" niet bestaat:
    naam = db.get("naam", "Niet gevonden")
```

</details>

<details>
<summary>Data verwijderen</summary>

```python
with SqliteDict("data.db") as db:
    del db["naam"]
    db.commit()
```

</details>

<details>
<summary>Alles bekijken</summary>

```python
with SqliteDict("data.db") as db:
    for key, value in db.items():
        print(key, value)
```

</details>

## Mappenstructuur

<details>
<summary>Compleet project</summary>

```
je-project/
├── main.py
├── static/
│   ├── css/
│   │   └── style.css
│   ├── pages/
│   │   ├── home.html
│   │   └── form.html
│   └── foto.jpg
└── templates/
    └── resultaat.html
```

</details>
