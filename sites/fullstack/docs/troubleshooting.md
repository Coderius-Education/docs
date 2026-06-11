---
sidebar_class_name: hidden
---

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
- Let op hoofdletters in bestandsnamen!

</details>

<details>
<summary>Afbeelding laadt niet (broken image)</summary>

- Staat de afbeelding in de `static` folder?
- Klopt de bestandsnaam exact? (hoofdletters tellen!)
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
# Fout - naam niet meegestuurd
return templates.TemplateResponse("pagina.html", {"request": request})

# Goed - naam meegestuurd
return templates.TemplateResponse("pagina.html", {"request": request, "naam": naam})
```

</details>

<details>
<summary>TypeError: context must include a "request" key</summary>

Je bent `"request": request` vergeten:

```python
# Fout
return templates.TemplateResponse("pagina.html", {"naam": naam})

# Goed
return templates.TemplateResponse("pagina.html", {"request": request, "naam": naam})
```

</details>

## Database (sqlitedict)

<details>
<summary>ModuleNotFoundError: No module named 'sqlitedict'</summary>

Installeer het:
```bash
pip install sqlitedict
```

Check dat je in je virtual environment zit!

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
