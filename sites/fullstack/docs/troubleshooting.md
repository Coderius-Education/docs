# Er gaat iets mis

Klik op je probleem om de oplossing te zien.

## Server starten

<details>
<summary>fastapi: command not found</summary>

**Oorzaak:** FastAPI is niet geïnstalleerd in de omgeving waar je terminal nu in werkt.

**Oplossing:** check eerst of je `(.venv)` vooraan je terminalregel ziet. Installeer daarna:

```bash
pip install "fastapi[standard]"
```

Meer uitleg: [Installatie](/docs/FastAPI/installatie)

</details>

<details>
<summary>ModuleNotFoundError: No module named 'fastapi'</summary>

**Oorzaak:** je virtual environment is niet actief, dus Python kijkt in de verkeerde map naar geïnstalleerde pakketten.

**Oplossing:** activeer de venv en check dat `(.venv)` in je terminal verschijnt:

```bash
# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate
```

Meer uitleg: [Installatie](/docs/FastAPI/installatie)

</details>

<details>
<summary>Address already in use (poort 8000 bezet)</summary>

**Oorzaak:** er draait al een server op poort 8000 — meestal een vorige `fastapi dev` in een andere terminal die je vergeten bent.

**Oplossing:** sluit die andere terminal (of stop hem met Ctrl+C), of start op een andere poort:

```bash
fastapi dev main.py --port 8001
```

Meer uitleg: [Je eerste endpoint](/docs/FastAPI/eerste_endpoint)

</details>

<details>
<summary>Server start maar pagina laadt niet</summary>

**Oorzaak:** de browser praat niet met de server die je net startte — verkeerd adres, of de server is inmiddels gestopt.

**Oplossing:**

1. Check of je naar `http://127.0.0.1:8000` gaat (niet `https`)
2. Check of de server nog draait in de terminal
3. Herlaad zonder cache (Ctrl+Shift+R)

Meer uitleg: [Je eerste endpoint](/docs/FastAPI/eerste_endpoint)

</details>

<details>
<summary>Mijn klasgenoot kan niet bij mijn server</summary>

**Oorzaak:** je server luistert alleen naar je eigen computer, of jullie zitten niet op hetzelfde netwerk.

**Oplossing:** check in deze volgorde:

1. Draait je server met `--host 0.0.0.0`? Zonder dat luistert hij alleen naar je eigen computer.
2. Geef je het juiste adres door? `127.0.0.1` verwijst bij hem naar zijn eigen computer, niet naar die van jou. Zoek je adres met `ipconfig` of `ip addr`.
3. Zitten jullie op hetzelfde netwerk? Het gastennetwerk op school staat vaak los van het schoolnetwerk.
4. Vraagt je firewall om toestemming? Die moet je toestaan.

Meer uitleg: [Laat het aan anderen zien](/docs/FastAPI/laat-het-zien)

</details>

## HTML & CSS

<details>
<summary>CSS werkt niet / styling is weg</summary>

**Oorzaak:** de browser kan het CSS-bestand niet ophalen — de static-map is niet gekoppeld, of het pad in je `<link>` wijst ernaast.

**Oplossing:**

1. Staat `app.mount("/static", StaticFiles(directory="static"), name="static")` in je code?
2. Staat je CSS-bestand in `static/css/style.css`?
3. Staat in je HTML: `<link rel="stylesheet" href="/static/css/style.css">`?
4. Herstart de server en herlaad zonder cache (Ctrl+Shift+R)

Open `http://127.0.0.1:8000/static/css/style.css` rechtstreeks: zie je je CSS, dan ligt het aan de `<link>`; een 404, dan aan het pad of de mount.

Meer uitleg: [Static files](/docs/FastAPI/static_files)

</details>

<details>
<summary>404 Not Found bij het openen van een pagina</summary>

**Oorzaak:** het endpoint bestaat niet. De URL die je opvraagt komt met geen enkele `@app.get(...)` in je `main.py` overeen — een typfout in de link, of het endpoint is nooit gemaakt.

**Oplossing:** vergelijk de URL in de adresbalk letter voor letter met het pad in je decorator. Een veelgemaakte variant is linken naar het bestand in plaats van het endpoint:

```html
<!-- FOUT - de browser zoekt een endpoint /about.html, dat bestaat niet -->
<a href="about.html">Over mij</a>

<!-- GOED - het endpoint uit je main.py -->
<a href="/about">Over mij</a>
```

Meer uitleg: [Links tussen pagina's](/docs/FastAPI/links)

</details>

<details>
<summary>500 Internal Server Error, en in de terminal: RuntimeError ... does not exist</summary>

```
RuntimeError: File at path static/pages/home.html does not exist.
```

**Oorzaak:** het endpoint bestaat wél, maar het bestand dat `FileResponse` moet sturen niet. Let op: dit is een 500, geen 404 — de fout zit aan de serverkant, dus kijk in je terminal.

**Oplossing:** check of het bestand echt op die plek staat, met precies die naam (hoofdletters tellen). Het pad is relatief aan de map waar je `fastapi dev` startte, dus start de server vanuit je projectmap.

Meer uitleg: [HTML in bestanden](/docs/FastAPI/html_bestanden)

</details>

<details>
<summary>Afbeelding laadt niet (broken image)</summary>

**Oorzaak:** het pad in `src` komt niet overeen met de plek van het bestand in je `static`-map.

**Oplossing:**

1. Staat de afbeelding in de `static` folder?
2. Klopt de bestandsnaam exact? (hoofdletters tellen)
3. Klopt het pad in `src="/static/foto.jpg"`?
4. Staat `app.mount("/static", ...)` in je code?

Meer uitleg: [Afbeeldingen tonen](/docs/FastAPI/afbeeldingen)

</details>

<details>
<summary>HTML wordt als tekst getoond (je ziet de tags)</summary>

**Oorzaak:** zonder `response_class=HTMLResponse` behandelt FastAPI je string als data, niet als HTML — de browser krijgt hem als platte tekst.

**Oplossing:**

```python
# FOUT - toont HTML als tekst
@app.get("/pagina")
async def pagina():
    return "<h1>Hallo</h1>"

# GOED - toont HTML als pagina
@app.get("/pagina", response_class=HTMLResponse)
async def pagina():
    return "<h1>Hallo</h1>"
```

Meer uitleg: [HTML tonen](/docs/FastAPI/html_tonen)

</details>

## Formulieren & POST

<details>
<summary>422 Unprocessable Entity</summary>

**Oorzaak:** FastAPI verwacht een veld dat niet binnenkomt. Bijna altijd: de `name` in je HTML matcht niet met de parameternaam in Python.

**Oplossing:**

1. Heb je `from fastapi import Form` geïmporteerd?
2. Staat `name="..."` op je `<input>` tags?
3. Matcht de `name` in HTML met de parameter in Python?
4. Staat `method="post"` op je `<form>` tag?

```html
<input name="naam">      <!-- HTML -->
```
```python
naam: str = Form(...)    # Python: moet ook "naam" heten
```

Meer uitleg: [Eigen POST request](/docs/FastAPI/forms)

</details>

<details>
<summary>Form data komt niet aan</summary>

**Oorzaak:** de browser verstuurt het formulier niet zoals je endpoint het verwacht — de method, het doel of een veldnaam wijkt af.

**Oplossing:**

1. `method="post"` in de form-tag?
2. `action="/juiste_endpoint"` in de form-tag?
3. `name="veldnaam"` op elk input-veld?
4. Parameternaam in Python gelijk aan de `name` in HTML?

Meer uitleg: [Eigen POST request](/docs/FastAPI/forms)

</details>

<details>
<summary>Method Not Allowed (405)</summary>

**Oorzaak:** je stuurt een POST naar een GET-endpoint of andersom — het pad bestaat, maar niet voor deze soort verzoek.

**Oplossing:**

- Formulier met `method="post"` → endpoint moet `@app.post(...)` zijn
- Een URL in de adresbalk typen is altijd GET → endpoint moet `@app.get(...)` zijn

Krijg je de 405 direct ná het versturen van een formulier dat doorstuurt? Zie dan de aparte entry onder Templates.

Meer uitleg: [GET vs POST](/docs/FastAPI/get_vs_post)

</details>

## Templates (Jinja2)

<details>
<summary>TemplateNotFound error</summary>

**Oorzaak:** Jinja2 zoekt het bestand in de map die je bij `Jinja2Templates(directory=...)` opgaf, en vindt het daar niet.

**Oplossing:**

1. Staat je template in de `templates`-map?
2. Klopt de bestandsnaam in `TemplateResponse(request, "bestand.html", ...)` precies?
3. Staat `templates = Jinja2Templates(directory="templates")` in je code?

Meer uitleg: [POST met templates](/docs/FastAPI/post_met_templates)

</details>

<details>
<summary>Template variabele toont niets</summary>

**Oorzaak:** Jinja2 vult alleen in wat je meestuurt in het dictionary. Een naam die daar niet in zit wordt stilletjes leeg, zonder foutmelding.

**Oplossing:**

```python
# FOUT - naam niet meegestuurd
return templates.TemplateResponse(request, "pagina.html", {})

# GOED - naam meegestuurd
return templates.TemplateResponse(request, "pagina.html", {"naam": naam})
```

Check ook dat de naam in `{{ naam }}` precies gelijk is aan de sleutel in het dictionary.

Meer uitleg: [POST met templates](/docs/FastAPI/post_met_templates)

</details>

<details>
<summary>TypeError: unhashable type: 'dict'</summary>

**Oorzaak:** je gebruikt de oude volgorde, waarin `request` ín het dictionary staat. Die kom je nog overal online tegen, maar hij werkt niet meer — je bestandsnaam belandt op de plek van `request` en je dictionary op de plek van de bestandsnaam, dus FastAPI zoekt een template met een dictionary als naam.

**Oplossing:** zet `request` vooraan:

```python
# FOUT - oude schrijfwijze
return templates.TemplateResponse("pagina.html", {"request": request, "naam": naam})

# GOED - request vooraan
return templates.TemplateResponse(request, "pagina.html", {"naam": naam})
```

Meer uitleg: [POST met templates](/docs/FastAPI/post_met_templates)

</details>

<details>
<summary>TemplateSyntaxError: Unexpected end of template</summary>

```
jinja2.exceptions.TemplateSyntaxError: Unexpected end of template. Jinja was
looking for the following tags: 'endfor' or 'else'.
```

**Oorzaak:** een `{% for %}` of `{% if %}` in je template wordt nooit gesloten — het bestand is op terwijl het blok nog openstaat.

**Oplossing:** elke `{% for %}` heeft een `{% endfor %}` nodig, elke `{% if %}` een `{% endif %}`:

```html
<!-- FOUT - de lus gaat nooit dicht -->
{% for bericht in berichten %}
    <li>{{ bericht.naam }}</li>

<!-- GOED -->
{% for bericht in berichten %}
    <li>{{ bericht.naam }}</li>
{% endfor %}
```

Meer uitleg: [Een lijst tonen](/docs/FastAPI/lijst_tonen)

</details>

<details>
<summary>Lijst blijft leeg terwijl er wel data in de database staat</summary>

**Oorzaak:** de lijst komt leeg of onder een andere naam bij de template aan — Jinja2 toont dan niets, zonder foutmelding.

**Oplossing:** check in deze volgorde:

1. Staat de naam in `{% for bericht in berichten %}` precies gelijk aan de sleutel in `{"berichten": ...}`?
2. Print `alle_berichten` in je endpoint. Zie je daar wél data, dan zit de fout in de template.
3. Staat je database wel echt vol? Open `/berichten` nadat je een bericht hebt verstuurd, niet ervoor.

Meer uitleg: [Een lijst tonen](/docs/FastAPI/lijst_tonen)

</details>

<details>
<summary>AttributeError: 'NoneType' object has no attribute 'select'</summary>

**Oorzaak:** je gebruikt de data van je database buiten het `with`-blok, zonder er eerst een lijst van te maken. `db.values()` geeft geen lijst maar een generator: die haalt de rijen pas op als je erdoorheen loopt, en tegen die tijd is de database al dicht.

**Oplossing:**

```python
# FOUT - de generator wordt pas buiten het with-blok gebruikt
with SqliteDict("gastenboek.db") as db:
    alle_berichten = db.values()

# GOED - list() haalt de data binnen het with-blok op
with SqliteDict("gastenboek.db") as db:
    alle_berichten = list(db.values())
```

Meer uitleg: [Een lijst tonen](/docs/FastAPI/lijst_tonen)

</details>

<details>
<summary>Na het versturen van een formulier krijg je 405 Method Not Allowed</summary>

**Oorzaak:** je redirect mist `status_code=303`. De standaard is 307, en die laat de browser je POST herhalen op de nieuwe URL — waar alleen een `@app.get` staat.

**Oplossing:**

```python
# FOUT - stuurt 307, de browser herhaalt je POST op de nieuwe URL
return RedirectResponse(url="/berichten")

# GOED - stuurt 303, de browser doet een GET
return RedirectResponse(url="/berichten", status_code=303)
```

Meer uitleg: [Terug naar de lijst](/docs/FastAPI/redirect)

</details>

## JavaScript

<details>
<summary>Cannot read properties of null (reading 'addEventListener')</summary>

**Oorzaak:** je script draait voordat het element bestaat. Zonder `defer` voert de browser je script uit terwijl hij nog in de `<head>` zit, en vindt `querySelector` niets.

**Oplossing:**

```html
<!-- FOUT - draait terwijl de browser nog in de head zit -->
<script src="/static/js/app.js"></script>

<!-- GOED - wacht tot de pagina er staat -->
<script src="/static/js/app.js" defer></script>
```

Staat `defer` er wel? Check dan of de `id` in je HTML precies gelijk is aan die in je `querySelector`, inclusief hoofdletters.

Meer uitleg: [JavaScript erbij](/docs/FastAPI/javascript)

</details>

<details>
<summary>Mijn JavaScript-bestand wordt niet geladen (404 in de console)</summary>

**Oorzaak:** de browser kan het bestand niet vinden — verkeerde plek, verkeerd pad, of de static-map is niet gekoppeld.

**Oplossing:**

1. Staat het bestand in `static/js/`?
2. Staat `app.mount("/static", StaticFiles(directory="static"), name="static")` in je `main.py`?
3. Begint het pad in je script-tag met een slash: `src="/static/js/app.js"`?

Open `http://127.0.0.1:8000/static/js/app.js` rechtstreeks in je browser. Zie je je code, dan ligt het aan de script-tag; krijg je een 404, dan aan het pad of de mount.

Meer uitleg: [JavaScript erbij](/docs/FastAPI/javascript)

</details>

<details>
<summary>Mijn controle in de HTML wordt genegeerd</summary>

**Oorzaak:** `maxlength` en `required` zijn instructies aan de browser, en de browser is van de bezoeker. Wie het formulier omzeilt, komt er gewoon langs.

**Oplossing:** wil je echt een grens, controleer dan óók in Python:

```python
if len(bericht) > 80:
    raise HTTPException(status_code=400, detail="Bericht is te lang")
```

Meer uitleg: [Server of browser?](/docs/FastAPI/server-of-browser)

</details>

## Database (sqlitedict)

<details>
<summary>ModuleNotFoundError: No module named 'sqlitedict'</summary>

**Oorzaak:** het pakket is niet geïnstalleerd in de omgeving waar je server in draait.

**Oplossing:** check dat je `(.venv)` in de terminal ziet en installeer:

```bash
pip install sqlitedict
```

Meer uitleg: [Gegevens opslaan](/docs/FastAPI/database)

</details>

<details>
<summary>Data is weg na herstarten</summary>

**Oorzaak:** zonder `db.commit()` blijven je wijzigingen in het geheugen hangen en schrijft de database ze nooit naar het bestand.

**Oplossing:**

```python
# FOUT - wijziging verdwijnt bij het sluiten
with SqliteDict("data.db") as db:
    db["key"] = "waarde"

# GOED - commit schrijft naar het bestand
with SqliteDict("data.db") as db:
    db["key"] = "waarde"
    db.commit()
```

Meer uitleg: [Gegevens opslaan](/docs/FastAPI/database)

</details>

<details>
<summary>KeyError bij uitlezen</summary>

**Oorzaak:** je vraagt een sleutel op die niet in de database staat, en `db[...]` crasht daarop.

**Oplossing:** gebruik `db.get()` met een standaardwaarde:

```python
# FOUT - crasht als de sleutel niet bestaat
waarde = db["naam"]

# GOED - geeft "Onbekend" als de sleutel niet bestaat
waarde = db.get("naam", "Onbekend")
```

Meer uitleg: [Gegevens opslaan](/docs/FastAPI/database)

</details>

## Cookies & sessies

<details>
<summary>De cookie wordt niet onthouden</summary>

**Oorzaak:** `set_cookie` staat op een ander antwoord dan het antwoord dat je returnt.

**Oplossing:**

```python
# FOUT - de cookie zit op een antwoord dat je weggooit
antwoord = RedirectResponse(url="/berichten", status_code=303)
antwoord.set_cookie(key="naam", value=naam)
return RedirectResponse(url="/berichten", status_code=303)

# GOED - dezelfde variabele erin en eruit
antwoord = RedirectResponse(url="/berichten", status_code=303)
antwoord.set_cookie(key="naam", value=naam)
return antwoord
```

Meer uitleg: [Onthouden met een cookie](/docs/FastAPI/cookies)

</details>

<details>
<summary>De cookie is er wel, maar mijn endpoint krijgt hem niet</summary>

**Oorzaak:** de naam in `Cookie(...)` moet gelijk zijn aan de parameternaam, net als bij `Form`.

**Oplossing:** heet je cookie `sessie_id`, dan heet je parameter ook `sessie_id`:

```python
# FOUT - cookie heet 'sessie_id', parameter heet 'sid'
async def gastenboek_form(request: Request, sid: str = Cookie(default="")):

# GOED
async def gastenboek_form(request: Request, sessie_id: str = Cookie(default="")):
```

Meer uitleg: [Onthouden met een cookie](/docs/FastAPI/cookies)

</details>

<details>
<summary>De cookie verdwijnt zodra ik de browser sluit</summary>

**Oorzaak:** zonder `max_age` maak je een cookie die alleen bestaat zolang de browser openstaat.

**Oplossing:** geef een houdbaarheid in seconden mee, bijvoorbeeld dertig dagen:

```python
antwoord.set_cookie(key="naam", value=naam, max_age=60 * 60 * 24 * 30)
```

Meer uitleg: [Onthouden met een cookie](/docs/FastAPI/cookies)

</details>

<details>
<summary>KeyError bij het uitlezen van een sessie</summary>

**Oorzaak:** je vraagt een sessie-id op dat niet in je database staat. Dat gebeurt bij een eerste bezoek, en zodra iemand zijn cookie aanpast.

**Oplossing:** gebruik `.get()` met een standaardwaarde in plaats van vierkante haken:

```python
# FOUT - crasht bij een onbekend sessie-id
with SqliteDict("sessies.db") as sessies:
    mijn = sessies[sessie_id]

# GOED
with SqliteDict("sessies.db") as sessies:
    mijn = sessies.get(sessie_id, {})
```

Meer uitleg: [Sessies](/docs/FastAPI/sessies)

</details>

<details>
<summary>Iedereen krijgt dezelfde sessie te zien</summary>

**Oorzaak:** je maakt bij elk verzoek een nieuw sessie-id aan, of je gebruikt een vaste waarde in plaats van `secrets.token_hex(16)`.

**Oplossing:** maak alleen een nieuw sessie-id als er nog geen is:

```python
if not sessie_id:
    sessie_id = secrets.token_hex(16)
```

Meer uitleg: [Sessies](/docs/FastAPI/sessies)

</details>

## Algemeen

<details>
<summary>Wijzigingen zijn niet zichtbaar</summary>

**Oorzaak:** de browser toont een bewaarde versie van de pagina, of de server draait nog met je oude code.

**Oplossing:**

1. Herstart de server (Ctrl+C, dan opnieuw `fastapi dev main.py`)
2. Herlaad zonder cache (Ctrl+Shift+R)
3. Check of je het juiste bestand hebt aangepast

Meer uitleg: [Je eerste endpoint](/docs/FastAPI/eerste_endpoint)

</details>

<details>
<summary>NameError: name 'app' is not defined</summary>

**Oorzaak:** je endpoint staat bóven de regel `app = FastAPI()`. Python leest je bestand van boven naar beneden, dus bij `@app.get(...)` bestaat `app` nog niet.

**Oplossing:** zet `app = FastAPI()` bovenaan, direct na de imports, en alle endpoints eronder:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"bericht": "Hallo"}
```

Meer uitleg: [Je eerste endpoint](/docs/FastAPI/eerste_endpoint)

</details>

<details>
<summary>ImportError / NameError bij andere namen</summary>

**Oorzaak:** je gebruikt iets dat niet geïmporteerd is — elke naam die je van FastAPI of sqlitedict gebruikt moet bovenaan je bestand staan.

**Oplossing:** de imports die je in deze cursus nodig hebt:

```python
from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlitedict import SqliteDict
```

</details>

<details>
<summary>IndentationError</summary>

**Oorzaak:** Python leest de structuur van je code aan het inspringen af, en ergens klopt dat niet — vaak een mix van tabs en spaties, of een regel die te ver of te weinig inspringt.

**Oplossing:** gebruik overal vier spaties per niveau en mix geen tabs en spaties. In VS Code: selecteer alles en druk op Shift+Alt+F om automatisch te formatteren.

</details>
