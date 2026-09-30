# Er gaat iets mis

Klik op je probleem om de oplossing te zien. De koppen volgen de hoofdstukken van de cursus; fouten die in elk hoofdstuk kunnen voorkomen, staan onderaan bij Algemeen.

## Je eerste server

<details>
<summary>De term 'fastapi' wordt niet herkend (fastapi: command not found)</summary>

In PowerShell op Windows staat er:

```
fastapi : De term fastapi wordt niet herkend als de naam van een cmdlet, functie, scriptbestand of uitvoerbaar programma.
```

In een Engelse Windows is dat `The term 'fastapi' is not recognized as the name of a cmdlet`, en op een Mac `fastapi: command not found`.

**Oorzaak:** FastAPI is niet geïnstalleerd in de omgeving waar je terminal nu in werkt.

**Oplossing:** check eerst of je `(.venv)` vooraan je terminalregel ziet. Installeer daarna:

```bash
python -m pip install "fastapi[standard]"
```

Meer uitleg: [Installatie](/docs/FastAPI/installatie)

</details>

<details>
<summary>ModuleNotFoundError: No module named 'fastapi'</summary>

```
ModuleNotFoundError: No module named 'fastapi'
```

**Oorzaak:** je virtual environment is niet actief, dus Python kijkt in de verkeerde map naar geïnstalleerde pakketten.

**Oplossing:** open je project in VS Code met `code .` vanuit je projectmap en werk in de terminal van VS Code (**Terminal** → **New Terminal**); die zet de venv zelf aan. Lukt dat niet, activeer hem dan met de hand en check dat `(.venv)` in je terminal verschijnt:

```bash
# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate
```

Zegt PowerShell dan dat het script niet kan worden geladen omdat het uitvoeren van scripts is uitgeschakeld (in een Engelse Windows: `running scripts is disabled on this system`), dan blokkeert Windows het handmatig activeren. Ga dan terug naar de terminal van VS Code; wat je daar moet controleren staat bij <SiteLink site="editor" to="/python/problemen">problemen bij het installeren</SiteLink>.

Meer uitleg: [Installatie](/docs/FastAPI/installatie)

</details>

<details>
<summary>Poort 8000 is bezet (WinError 10048, Address already in use)</summary>

Op Windows eindigt de melding met:

```
[WinError 10048] Elk socketadres (protocol/netwerkadres/poort) kan normaal slechts één keer worden gebruikt
```

In een Engelse Windows staat er `only one usage of each socket address`, en op een Mac `Address already in use`.

**Oorzaak:** er draait al een server op poort 8000, meestal een vorige `fastapi dev` in een andere terminal die je vergeten bent.

**Oplossing:** stop die andere server met Ctrl+C in zijn terminal, of sluit die terminal. Of start op een andere poort:

```bash
fastapi dev main.py --port 8001
```

Meer uitleg: [Kijken wat de browser doet](/docs/FastAPI/devtools-netwerk#opdracht-4-investigate---de-server-staat-uit), waar je de server met Ctrl+C stopt.

</details>

<details>
<summary>In de terminal staat GET /favicon.ico 404 Not Found</summary>

```
INFO:     127.0.0.1:52341 - "GET /favicon.ico HTTP/1.1" 404 Not Found
```

**Oorzaak:** de browser vraagt bij een nieuwe site uit zichzelf om `/favicon.ico`, het icoontje voor op het tabblad. Jouw server heeft geen endpoint voor dat adres, dus antwoordt hij met 404.

**Oplossing:** niets, er is niets mis. Je eigen pagina's werken wel.

Meer uitleg: [Kijken wat de browser doet](/docs/FastAPI/devtools-netwerk)

</details>

<details>
<summary>De pagina laadt niet: ERR_CONNECTION_REFUSED of ERR_SSL_PROTOCOL_ERROR</summary>

De browser zegt dat de site niet bereikbaar is, met onderaan een code:

```
ERR_CONNECTION_REFUSED
```

**Oorzaak:** de browser praat niet met je server. Bij `ERR_CONNECTION_REFUSED` draait er geen server: hij is gestopt, of nooit gestart. Bij `ERR_SSL_PROTOCOL_ERROR` probeert de browser `https`, en je server spreekt alleen `http`. In de terminal staat dan:

```
WARNING:  Invalid HTTP request received.
```

**Oplossing:**

1. Kijk in de terminal of de server nog draait. Staat de prompt er weer, start hem dan opnieuw met `fastapi dev main.py`
2. Typ het adres helemaal uit: `http://127.0.0.1:8000`, met `http` en niet `https`

Meer uitleg: [Kijken wat de browser doet](/docs/FastAPI/devtools-netwerk#opdracht-4-investigate---de-server-staat-uit)

</details>

<details>
<summary>NameError: name 'app' is not defined</summary>

De server start niet, en onderaan de melding staat:

```
NameError: name 'app' is not defined
```

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
<summary>Je past een endpoint aan, maar de browser toont nog het oude antwoord (twee keer hetzelfde pad)</summary>

**Oorzaak:** er staan twee endpoints met hetzelfde pad in je `main.py`, bijvoorbeeld twee keer `@app.get("/test")`. FastAPI geeft geen foutmelding, maar gebruikt altijd de eerste. Wat je aan de tweede verandert, zie je nooit.

**Oplossing:** zoek in je `main.py` (Ctrl+F) op het pad en geef elk endpoint een eigen pad.

{/* niet-compileren: FOUT/GOED-voorbeeld met twee keer dezelfde functie */}
```python
# FOUT - de tweede wordt nooit gebruikt
@app.get("/test")
async def test1():
    return {"bericht": "Eerste"}

@app.get("/test")
async def test2():
    return {"bericht": "Tweede"}

# GOED - elk endpoint een eigen pad
@app.get("/test")
async def test1():
    return {"bericht": "Eerste"}

@app.get("/test2")
async def test2():
    return {"bericht": "Tweede"}
```

Meer uitleg: [Je eerste endpoint](/docs/FastAPI/eerste_endpoint#opdracht-3-investigate---dubbele-url)

</details>

<details>
<summary>Endpoints die eerst werkten, geven ineens Not Found (twee keer app = FastAPI())</summary>

```
{"detail":"Not Found"}
```

**Oorzaak:** er staat een tweede `app = FastAPI()` in je `main.py`, vaak omdat je een voorbeeld met de regel erbij hebt geplakt. Die maakt een nieuwe, lege app. De endpoints boven die regel hangen aan de oude app, en die gebruikt de server niet meer.

**Oplossing:** laat één `app = FastAPI()` staan, bovenaan, direct na de imports. Haal de tweede weg.

Meer uitleg: [Je eerste endpoint](/docs/FastAPI/eerste_endpoint)

</details>

<details>
<summary>Het tabblad Netwerk is leeg, of mist het verzoek dat je zoekt</summary>

**Oorzaak:** Netwerk laat alleen zien wat het heeft opgenomen, en alleen wat door het filter komt. Daarom is de lijst de ene keer leeg en de andere keer niet.

**Oplossing:** loop deze vier langs.

1. Open het tabblad vóór je de pagina laadt, of herlaad met het tabblad open
2. Zet **Logboek behouden** (Preserve log) aan als je een formulier verstuurt of naar een andere pagina gaat: anders wist elke nieuwe pagina de lijst
3. Klik op **Alle** (All) in de rij soorten en maak het zoekvak leeg: een filter als **Fetch/XHR** blijft staan tot je hem uitzet
4. Kijk of het rondje linksboven rood is; grijs betekent dat opnemen uit staat (Ctrl+E zet het aan en uit)

Meer uitleg: [Kijken wat de browser doet](/docs/FastAPI/devtools-netwerk#als-de-lijst-leeg-is)

</details>

## HTML-pagina's

<details>
<summary>HTML wordt als tekst getoond, tussen aanhalingstekens en met \n erin</summary>

**Oorzaak:** zonder `response_class=HTMLResponse` maakt FastAPI JSON van je string. De browser toont dan één regel tussen aanhalingstekens, met `\n` waar jij een nieuwe regel begon, zoals `"\n    <!DOCTYPE html>\n    <html>..."`.

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

<details>
<summary>500 Internal Server Error, en in de terminal: RuntimeError ... does not exist</summary>

```
INFO:     127.0.0.1:54164 - "GET / HTTP/1.1" 500 Internal Server Error
RuntimeError: File at path static/pages/home.html does not exist.
```

**Oorzaak:** het endpoint bestaat wél, maar het bestand dat `FileResponse` moet sturen niet. Daarom krijg je een 500 en geen 404: de fout zit aan de serverkant, dus kijk in je terminal.

**Oplossing:** check of het bestand echt op die plek staat, met precies die naam (hoofdletters tellen). Het pad is relatief aan de map waar je `fastapi dev` startte, dus start de server vanuit je projectmap.

Meer uitleg: [HTML in bestanden](/docs/FastAPI/html_bestanden)

</details>

<details>
<summary>404 Not Found bij het openen van een pagina</summary>

In de browser staat `{"detail":"Not Found"}`, en in de terminal:

```
INFO:     127.0.0.1:52344 - "GET /about.html HTTP/1.1" 404 Not Found
```

**Oorzaak:** het endpoint bestaat niet. De URL die je opvraagt komt met geen enkele `@app.get(...)` in je `main.py` overeen: een typfout in de link, of het endpoint is nooit gemaakt.

**Oplossing:** vergelijk de URL in de adresbalk letter voor letter met het pad in je decorator. Vaak zit de fout in een link naar het bestand in plaats van naar het endpoint:

```html
<!-- FOUT - de browser zoekt een endpoint /about.html, dat bestaat niet -->
<a href="about.html">Over mij</a>

<!-- GOED - het endpoint uit je main.py -->
<a href="/about">Over mij</a>
```

Meer uitleg: [Links tussen pagina's](/docs/FastAPI/links)

</details>

<details>
<summary>CSS werkt niet / styling is weg</summary>

**Oorzaak:** de browser kan het CSS-bestand niet ophalen. De static-map is niet gekoppeld, of het pad in je `<link>` wijst ernaast.

**Oplossing:**

1. Staat `app.mount("/static", StaticFiles(directory="static"), name="static")` in je code?
2. Staat je CSS-bestand in `static/css/style.css`?
3. Staat in je HTML: `<link rel="stylesheet" href="/static/css/style.css">`?
4. Herstart de server en herlaad zonder cache (Ctrl+Shift+R, zie Wijzigingen zijn niet zichtbaar, hieronder)

Open `http://127.0.0.1:8000/static/css/style.css` rechtstreeks: zie je je CSS, dan ligt het aan de `<link>`; een 404, dan aan het pad of de mount.

Meer uitleg: [CSS in een eigen bestand (static files)](/docs/FastAPI/static_files)

</details>

<details>
<summary>Wijzigingen zijn niet zichtbaar</summary>

**Oorzaak:** de browser toont zijn eigen bewaarde kopie van de pagina (de cache), of de server draait nog met je oude code.

**Zelf vinden:** druk op F12, kies het tabblad **Netwerk** en herlaad. Staat bij Grootte **(schijfcache)** of **(geheugencache)**, dan heeft de browser de server niet eens gevraagd; de status is dan ook 200, dus kijk naar Grootte. Staat er een echt aantal bytes en is het bestand toch oud, dan draait de server met oude code.

**Oplossing:**

1. Herlaad zonder cache: met de ontwikkelaarstools open, rechtermuisknop op de herlaadknop en **Cache wissen en geforceerd opnieuw laden**, of Ctrl+Shift+R
2. Zet in het tabblad Netwerk het vinkje **Cache uitzetten** aan zolang je werkt
3. Herstart de server (Ctrl+C, dan opnieuw `fastapi dev main.py`)
4. Check of je het juiste bestand hebt aangepast

Meer uitleg: [Als je wijziging niet doorkomt](/docs/FastAPI/static_files#als-je-wijziging-niet-doorkomt)

</details>

<details>
<summary>Afbeelding laadt niet (broken image)</summary>

**Oorzaak:** het pad in `src` komt niet overeen met de plek van het bestand in je `static`-map.

**Oplossing:**

1. Staat de afbeelding in de `static` folder?
2. Klopt de bestandsnaam exact? (hoofdletters tellen) Windows verbergt vaak de extensie: een bestand dat `kat.jpg` lijkt, heet soms `kat.jpg.jpg` of `kat.jpeg`. Zet in de Verkenner bij Beeld het vinkje **Bestandsnaamextensies** aan om de echte naam te zien.
3. Klopt het pad in `src="/static/foto.jpg"`?
4. Staat `app.mount("/static", ...)` in je code?

Meer uitleg: [Afbeeldingen tonen](/docs/FastAPI/afbeeldingen)

</details>

## Templates en formulieren \{#templates-jinja2}

<details>
<summary>TemplateNotFound</summary>

```
jinja2.exceptions.TemplateNotFound: 'dobbelsteen.html' not found in search path: 'templates'
```

**Oorzaak:** Jinja2 zoekt het bestand in de map die je bij `Jinja2Templates(directory=...)` opgaf, en vindt het daar niet.

**Oplossing:**

1. Staat je template in de `templates`-map, naast `main.py`?
2. Klopt de bestandsnaam in `TemplateResponse(request, "bestand.html", ...)` precies? Geef alleen de naam door, zonder `templates/` ervoor
3. Staat `templates = Jinja2Templates(directory="templates")` in je code?

Meer uitleg: [Templates met Jinja2](/docs/FastAPI/templates)

</details>

<details>
<summary>Template variabele toont niets</summary>

**Oorzaak:** Jinja2 vult alleen in wat je meestuurt in het dictionary. Een naam die daar niet in zit, blijft leeg, zonder foutmelding.

**Oplossing:**

{/* niet-compileren: FOUT/GOED-voorbeeld */}
```python
# FOUT - naam niet meegestuurd
return templates.TemplateResponse(request, "pagina.html", {})

# GOED - naam meegestuurd
return templates.TemplateResponse(request, "pagina.html", {"naam": naam})
```

Check ook dat de naam in `{{ naam }}` precies gelijk is aan de sleutel in het dictionary.

Meer uitleg: [Templates met Jinja2](/docs/FastAPI/templates)

</details>

<details>
<summary>TypeError: unhashable type: 'dict'</summary>

```
TypeError: unhashable type: 'dict'
```

**Oorzaak:** je gebruikt de oude volgorde, waarin `request` ín het dictionary staat. Die kom je online nog overal tegen, maar hij werkt niet meer. Je bestandsnaam belandt dan op de plek van `request` en je dictionary op de plek van de bestandsnaam, dus FastAPI zoekt een template met een dictionary als naam.

**Oplossing:** zet `request` vooraan:

{/* niet-compileren: FOUT/GOED-voorbeeld */}
```python
# FOUT - oude schrijfwijze
return templates.TemplateResponse("pagina.html", {"request": request, "naam": naam})

# GOED - request vooraan
return templates.TemplateResponse(request, "pagina.html", {"naam": naam})
```

Meer uitleg: [Templates met Jinja2](/docs/FastAPI/templates)

</details>

<details>
<summary>422 Unprocessable Entity (of 422 Unprocessable Content)</summary>

In de browser staat een antwoord als dit:

```
{"detail":[{"type":"missing","loc":["body","naam"],"msg":"Field required","input":null}]}
```

En in de terminal, met Python 3.13 en nieuwer:

```
INFO:     127.0.0.1:54152 - "POST /gastenboek HTTP/1.1" 422 Unprocessable Content
```

Met een oudere Python staat er `422 Unprocessable Entity`. Het is dezelfde fout.

**Oorzaak:** FastAPI verwacht een waarde die niet binnenkomt, of niet in het goede type. `loc` zegt waar hij zocht, en het tweede woord is de naam die hij niet vond:

- `"body"`: een formulierveld. De `name` in je HTML is anders dan de parameter in Python, het veld mist een `name`, of het veld is leeg verstuurd. Een leeg veld telt bij `Form(...)` als ontbrekend
- `"query"`: een parameter na het vraagteken in de URL. Die staat niet in de URL, of je parameter heet anders dan de naam tussen de accolades in het pad; dan zoekt FastAPI hem na het vraagteken
- `"path"` met `"type":"int_parsing"`: je parameter is een `int`, en in de URL staat tekst, zoals bij `/bericht-nummer/abc`

**Oplossing:** maak de namen gelijk:

```html
<input name="naam" required>      <!-- HTML -->
```

{/* niet-compileren: losse parameter en losse handler-signatures */}
```python
naam: str = Form(...)    # Python: moet ook "naam" heten

# FOUT - {sleutel} in het pad, key in de functie
@app.get("/bericht/{sleutel}")
async def bericht_detail(request: Request, key: str):

# GOED
@app.get("/bericht/{sleutel}")
async def bericht_detail(request: Request, sleutel: str):
```

Mag een query-parameter ontbreken, geef hem dan een standaardwaarde: `term: str = ""`. Vergeet `required` op je `<input>` niet, dan verstuurt de browser geen leeg veld.

Meer uitleg: [GET vs POST](/docs/FastAPI/get_vs_post) (wat `loc` zegt), [Een formulier versturen (POST)](/docs/FastAPI/forms) en [Eén item tonen: path-parameters en 404](/docs/FastAPI/detailpagina)

</details>

<details>
<summary>405 Method Not Allowed</summary>

In de browser staat `{"detail":"Method Not Allowed"}`, en in de terminal bijvoorbeeld:

```
INFO:     127.0.0.1:54160 - "GET /verwijderen HTTP/1.1" 405 Method Not Allowed
```

**Oorzaak:** het pad bestaat, maar niet voor deze soort verzoek. Er komt een GET binnen bij een `@app.post`, een POST bij een `@app.get`, of een DELETE bij een `@app.post`.

**Oplossing:** kijk in de terminal welk werkwoord binnenkwam, en zoek je geval op:

1. **Je typte de URL in de adresbalk.** Dat is altijd een GET, dus het endpoint moet `@app.get(...)` zijn.
2. **Je verstuurde een formulier en de adresbalk toont `?naam=...`.** De `<form>` mist `method="post"`, en zonder die regel verstuurt de browser een GET.
3. **Je verstuurde een formulier en de 405 komt meteen daarna.** In de terminal staat dan `"POST /berichten HTTP/1.1" 405` na een `307 Temporary Redirect`. Je redirect mist `status_code=303`. De standaard is 307, en die laat de browser je POST herhalen op de nieuwe URL, waar alleen een `@app.get` staat:

   {/* niet-compileren: FOUT/GOED-voorbeeld */}
   ```python
   # FOUT - stuurt 307, de browser herhaalt je POST op de nieuwe URL
   return RedirectResponse(url="/berichten")

   # GOED - stuurt 303, de browser doet een GET
   return RedirectResponse(url="/berichten", status_code=303)
   ```

4. **Je klikte op een htmx-knop met `hx-delete`.** Die stuurt een DELETE, dus het endpoint moet `@app.delete(...)` zijn en niet `@app.post(...)`.

Meer uitleg: [GET vs POST](/docs/FastAPI/get_vs_post), [Doorsturen na opslaan (redirect)](/docs/FastAPI/redirect) en [htmx-recepten: formulier, verversen, verwijderen, zoeken](/docs/FastAPI/htmx-overzicht)

</details>

## Gegevens opslaan en tonen

<details>
<summary>ModuleNotFoundError: No module named 'sqlitedict'</summary>

```
ModuleNotFoundError: No module named 'sqlitedict'
```

**Oorzaak:** het pakket is niet geïnstalleerd in de omgeving waar je server in draait.

**Oplossing:** check dat je `(.venv)` in de terminal ziet en installeer:

```bash
python -m pip install sqlitedict
```

Meer uitleg: [Gegevens opslaan met SqliteDict](/docs/FastAPI/database)

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

Meer uitleg: [Gegevens opslaan met SqliteDict](/docs/FastAPI/database)

</details>

<details>
<summary>Er blijft maar één bericht over, of er verdwijnt er af en toe een</summary>

**Oorzaak:** elk bericht krijgt dezelfde sleutel, en een nieuw bericht overschrijft dan het vorige. Dat gebeurt met een vaste sleutel zoals `"bericht"`, en ook met `int(time.time())`: twee berichten in dezelfde seconde krijgen dan dezelfde sleutel.

**Oplossing:** maak de sleutel met `time.time_ns()`, en zet `import time` bovenaan:

{/* niet-compileren: losse regels uit een handler */}
```python
# FOUT - elk bericht onder dezelfde sleutel
sleutel = "bericht"

# GOED - elk bericht een eigen sleutel
sleutel = f"bericht_{time.time_ns()}"
```

Meer uitleg: [Een formulier opslaan](/docs/FastAPI/post_naar_database)

</details>

<details>
<summary>AttributeError: 'NoneType' object has no attribute 'select'</summary>

```
AttributeError: 'NoneType' object has no attribute 'select'
```

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

Meer uitleg: [Alles tonen: een for-lus in je template](/docs/FastAPI/lijst_tonen)

</details>

<details>
<summary>TemplateSyntaxError: Unexpected end of template</summary>

```
jinja2.exceptions.TemplateSyntaxError: Unexpected end of template. Jinja was looking for the following tags: 'endfor' or 'else'. The innermost block that needs to be closed is 'for'.
```

**Oorzaak:** een `{% for %}` of `{% if %}` in je template gaat nooit dicht. Het bestand is op terwijl het blok nog openstaat.

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

Meer uitleg: [Alles tonen: een for-lus in je template](/docs/FastAPI/lijst_tonen)

</details>

<details>
<summary>Lijst blijft leeg terwijl er wel data in de database staat</summary>

**Oorzaak:** de lijst komt leeg of onder een andere naam bij de template aan. Jinja2 toont dan niets, zonder foutmelding.

**Oplossing:** check in deze volgorde:

1. Staat de naam in `{% for bericht in berichten %}` precies gelijk aan de sleutel in `{"berichten": ...}`?
2. Print `alle_berichten` in je endpoint. Zie je daar wél data, dan zit de fout in de template.
3. Staat er echt iets in je database? Open `/berichten` nadat je een bericht hebt verstuurd, niet ervoor.

Meer uitleg: [Alles tonen: een for-lus in je template](/docs/FastAPI/lijst_tonen)

</details>

<details>
<summary>Elk bericht is een lege regel met alleen een dubbele punt</summary>

**Oorzaak:** je endpoint stuurt `list(db.items())`, maar je template loopt nog met `{% for bericht in berichten %}`. Elk element is dan een paar van sleutel en bericht, en zo'n paar heeft geen `naam`. Jinja2 laat de plek leeg, zonder foutmelding.

**Oplossing:** pak het paar uit in de lus:

```html
<!-- FOUT - bericht is hier een paar -->
{% for bericht in berichten %}
    <li>{{ bericht.naam }}: {{ bericht.bericht }}</li>
{% endfor %}

<!-- GOED -->
{% for sleutel, bericht in berichten %}
    <li>{{ bericht.naam }}: {{ bericht.bericht }}</li>
{% endfor %}
```

Meer uitleg: [Doorsturen na opslaan (redirect)](/docs/FastAPI/redirect)

</details>

<details>
<summary>KeyError bij uitlezen of verwijderen</summary>

In de browser staat `Internal Server Error`, en in de terminal eindigt de melding met de sleutel die niet bestaat:

```
KeyError: 'bericht_1767225600123456789'
```

**Oorzaak:** je vraagt met vierkante haken een sleutel op die niet in de database staat, of je verwijdert hem. Dat gebeurt bij een verkeerde sleutel in de URL, als iemand twee keer op Verwijderen klikt, en bij een eerste bezoek zonder sessie.

**Oplossing:** controleer eerst of de sleutel er is, of gebruik `.get()`:

```python
# FOUT - crasht als de sleutel niet bestaat
with SqliteDict("gastenboek.db") as db:
    bericht = db[sleutel]
    del db[sleutel]
    db.commit()

# GOED - get() geeft None als de sleutel niet bestaat
with SqliteDict("gastenboek.db") as db:
    bericht = db.get(sleutel)

# GOED - alleen verwijderen wat er is
with SqliteDict("gastenboek.db") as db:
    if sleutel in db:
        del db[sleutel]
        db.commit()

# GOED - bij sessies een lege sessie als er nog geen is
with SqliteDict("sessies.db") as sessies:
    mijn = sessies.get(sessie_id, {})
```

Meer uitleg: [Eén item tonen: path-parameters en 404](/docs/FastAPI/detailpagina) (`db.get`), [Doorsturen na opslaan (redirect)](/docs/FastAPI/redirect) (verwijderen) en [Onthouden op de server: sessies](/docs/FastAPI/sessies)

</details>

<details>
<summary>In plaats van een foutpagina zie je JSON met status_code en detail (return in plaats van raise)</summary>

```
{"status_code":404,"detail":"Dit bericht bestaat niet","headers":null}
```

**Oorzaak:** je schrijft `return HTTPException(...)` in plaats van `raise`. Dan geeft je endpoint de fout terug als gewone data: de status is 200 en de browser toont de fout als JSON.

**Oplossing:**

{/* niet-compileren: losse regels uit een handler */}
```python
# FOUT - status 200, met de fout als data
if bericht is None:
    return HTTPException(status_code=404, detail="Dit bericht bestaat niet")

# GOED - status 404, en de functie stopt hier
if bericht is None:
    raise HTTPException(status_code=404, detail="Dit bericht bestaat niet")
```

Meer uitleg: [Eén item tonen: path-parameters en 404](/docs/FastAPI/detailpagina)

</details>

## Uitbreiding: zonder herladen (htmx)

<details>
<summary>Na een klik staat de hele pagina in het doel (twee keer de kop)</summary>

**Oorzaak:** je endpoint geeft de hele pagina terug, of een omleiding. htmx volgt een omleiding net als de browser en zet alles wat binnenkomt in het doel van `hx-target`.

**Oplossing:** laat het endpoint alleen het stukje teruggeven dat in het doel hoort. Voor `escape` zet je `from html import escape` bovenaan:

{/* niet-compileren: twee losse return-regels uit een handler */}
```python
# FOUT
return RedirectResponse(url="/berichten", status_code=303)

# GOED
return HTMLResponse(f"Bedankt, {escape(naam)}. Je bericht staat in het gastenboek.")
```

Meer uitleg: [Zonder herladen met htmx](/docs/FastAPI/htmx)

</details>

<details>
<summary>Er gebeurt niets na een klik, of het formulier verspringt met ?naam= in de adresbalk</summary>

**Oorzaak:** htmx zet alleen een geslaagd antwoord in de pagina. Er gebeurt dus niets als htmx niet geladen is, of als het verzoek mislukt.

**Oplossing:** open het tabblad **Netwerk** en klik nog een keer.

1. **Geen nieuwe regel, of een rode regel bij `htmx.min.js`**: htmx is niet geladen. Zonder htmx zijn `hx-get` en `hx-post` attributen die de browser niet kent: een knop doet niets, en een formulier zonder `method` verstuurt hij als GET naar dezelfde pagina, met `?naam=` in de adresbalk. Zet `htmx.min.js` in `static/js/` en de script-tag in de `<head>`:

   ```html
   <script src="/static/js/htmx.min.js"></script>
   ```

2. **Een rode regel bij je eigen verzoek**: 404 is een verkeerd pad in `hx-get` of `hx-post`, 405 een verkeerd werkwoord (zie 405 Method Not Allowed hierboven), 500 een fout in je endpoint (kijk in de terminal), `(mislukt)` een server die niet draait.

Meer uitleg: [Zonder herladen met htmx](/docs/FastAPI/htmx) en [htmx-recepten: formulier, verversen, verwijderen, zoeken](/docs/FastAPI/htmx-overzicht)

</details>

## Uitbreiding: JavaScript in de browser

<details>
<summary>Cannot read properties of null (reading 'addEventListener')</summary>

In de Console staat:

```
Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
```

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
<summary>Mijn JavaScript-bestand wordt niet geladen (rode regel in de Console)</summary>

**Oorzaak:** de browser kan het bestand niet vinden. Het staat op de verkeerde plek, het pad klopt niet, of de static-map is niet gekoppeld.

**Oplossing:**

1. Staat het bestand in `static/js/`?
2. Staat `app.mount("/static", StaticFiles(directory="static"), name="static")` in je `main.py`?
3. Begint het pad in je script-tag met een slash: `src="/static/js/app.js"`?

Open `http://127.0.0.1:8000/static/js/app.js` rechtstreeks in je browser. Zie je je code, dan ligt het aan de script-tag; krijg je een 404, dan aan het pad of de mount.

Meer uitleg: [JavaScript erbij](/docs/FastAPI/javascript)

</details>

<details>
<summary>Mijn controle in de HTML wordt genegeerd</summary>

**Oorzaak:** `maxlength` en `required` zijn instructies aan de browser, en de browser is van de bezoeker. Wie het formulier omzeilt, komt er zo langs.

**Oplossing:** wil je echt een grens, controleer dan óók in Python:

```python
if len(bericht) > 80:
    raise HTTPException(status_code=400, detail="Bericht is te lang")
```

Meer uitleg: [Server of browser?](/docs/FastAPI/server-of-browser)

</details>

## Uitbreiding: onthouden (cookies en sessies)

Een `KeyError` bij `sessies[sessie_id]` staat bij KeyError bij uitlezen of verwijderen, onder [Gegevens opslaan en tonen](#gegevens-opslaan-en-tonen).

<details>
<summary>De cookie wordt niet onthouden</summary>

**Oorzaak:** `set_cookie` staat op een ander antwoord dan het antwoord dat je returnt.

**Oplossing:**

{/* niet-compileren: FOUT/GOED-voorbeeld */}
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

**Oorzaak:** FastAPI zoekt de cookie op onder de naam van je parameter. Heet je parameter anders dan je cookie, dan vindt hij niets en krijg je de standaardwaarde.

**Oplossing:** heet je cookie `sessie_id`, dan heet je parameter ook `sessie_id`:

{/* niet-compileren: FOUT/GOED-voorbeeld */}
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
<summary>Iedereen krijgt dezelfde sessie te zien</summary>

**Oorzaak:** je gebruikt een vaste waarde als sessie-id in plaats van een willekeurige. Dan krijgt elke bezoeker dezelfde sleutel, en dus elkaars gegevens.

**Oplossing:** laat `secrets` het id maken:

```python
# FOUT - iedereen deelt deze sessie
sessie_id = "sessie1"

# GOED - niet te raden, en voor elke bezoeker anders
sessie_id = secrets.token_hex(16)
```

Meer uitleg: [Onthouden op de server: sessies](/docs/FastAPI/sessies)

</details>

<details>
<summary>Mijn sessie wordt elke keer vergeten</summary>

**Oorzaak:** je maakt bij elk verzoek een nieuw sessie-id aan, ook als de bezoeker er al een had. De vorige sessie blijft dan onaangeroerd achter in je database.

**Oplossing:** maak alleen een nieuw id als er nog geen is:

```python
# FOUT - overschrijft ook een bestaande sessie
sessie_id = secrets.token_hex(16)

# GOED
if not sessie_id:
    sessie_id = secrets.token_hex(16)
```

Meer uitleg: [Onthouden op de server: sessies](/docs/FastAPI/sessies)

</details>

## Afronden

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

## Algemeen

<details>
<summary>NameError: name '...' is not defined (een import ontbreekt)</summary>

```
NameError: name 'Form' is not defined
```

Voor een module als `time` voegt Python 3.12 en nieuwer er een hint aan toe:

```
NameError: name 'time' is not defined. Did you forget to import 'time'?
```

**Oorzaak:** je gebruikt iets dat niet geïmporteerd is. Elke naam die je van FastAPI, sqlitedict of Python zelf gebruikt, moet bovenaan je bestand geïmporteerd staan. Staat de naam in een `@app`-regel of in de parameters, dan start de server niet; staat hij in de functie, dan gaat het pas mis bij het eerste verzoek, met een 500.

**Oplossing:** zet de import bovenaan. Dit zijn alle imports die in deze cursus voorkomen; neem over wat je gebruikt:

```python
import random
import secrets
import time
from datetime import datetime
from html import escape

from fastapi import Cookie, FastAPI, Form, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlitedict import SqliteDict
```

Meer uitleg: <SiteLink site="python" to="/docs/modules/09d-modules">Modules importeren</SiteLink>

</details>

<details>
<summary>IndentationError of TabError</summary>

Onderaan de melding staat een van deze regels:

```
IndentationError: expected an indented block after function definition on line 7
IndentationError: unindent does not match any outer indentation level
IndentationError: unexpected indent
TabError: inconsistent use of tabs and spaces in indentation
```

**Oorzaak:** Python leest de structuur van je code aan het inspringen af, en ergens klopt dat niet. Een regel onder een `def` of `with` springt niet in, een regel springt verder of minder in dan de regels erboven, of er staan tabs en spaties door elkaar (dat is de `TabError`).

**Oplossing:** ga naar het regelnummer uit de melding en zet de regel precies onder de regels die bij hetzelfde blok horen, met vier spaties per niveau. Bij een `TabError`: druk in VS Code op Ctrl+Shift+P, typ `Convert Indentation to Spaces` en druk op Enter; dan zijn alle tabs spaties.

Meer uitleg: <SiteLink site="python" to="/docs/beslissen/05b-if-else">If en else</SiteLink>

</details>
