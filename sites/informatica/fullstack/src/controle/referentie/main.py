import random
import time

from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlitedict import SqliteDict

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/")
async def home():
    return FileResponse("static/pages/home.html")

@app.get("/info")
async def info():
    return {"naam": "Jouw Naam", "leeftijd": 16}

@app.get("/pagina", response_class=HTMLResponse)
async def pagina():
    return """
    <!DOCTYPE html>
    <html>
        <head>
            <title>Mijn Pagina</title>
        </head>
        <body>
            <h1>Hallo!</h1>
            <p>Dit is mijn eerste HTML pagina.</p>
        </body>
    </html>
    """

@app.get("/styled", response_class=HTMLResponse)
async def styled():
    return """
    <!DOCTYPE html>
    <html>
        <head>
            <title>Met CSS</title>
            <style>
                h1 { color: blue; }
                p { color: gray; }
            </style>
        </head>
        <body>
            <h1>Gestylede pagina</h1>
            <p>Deze tekst is grijs.</p>
        </body>
    </html>
    """

@app.get("/about")
async def about():
    return FileResponse("static/pages/about.html")

DIEREN = {
    "kat": "Een kat spint als hij tevreden is.",
    "hond": "Een hond kwispelt als hij blij is.",
    "vis": "Een vis ademt met kieuwen.",
}

@app.get("/dier/{naam}", response_class=HTMLResponse)
async def dier(naam: str):
    tekst = DIEREN.get(naam, "Dit dier staat nog niet op de site.")
    return f"""
    <!DOCTYPE html>
    <html>
        <body>
            <h1>Over dieren</h1>
            <p>{tekst}</p>
            <a href="/">Terug naar Home</a>
        </body>
    </html>
    """

@app.get("/zoek")
async def zoek(term: str):
    return {"je_zocht": term}

@app.get("/foto")
async def foto():
    return FileResponse("static/pages/foto.html")

@app.get("/dobbelsteen")
async def dobbelsteen(request: Request):
    worp = random.randint(1, 6)
    return templates.TemplateResponse(
        request,
        "dobbelsteen.html",
        {"worp": worp}
    )

@app.get("/naam")
async def toon_formulier():
    return FileResponse("static/pages/naam_form.html")

@app.post("/verstuur")
async def ontvang_naam(naam: str = Form(...)):
    print(f"Naam ontvangen: {naam}")
    return {"bericht": f"Hallo {naam}!"}

@app.get("/groet")
async def groet_form():
    return FileResponse("static/pages/groet_form.html")

@app.post("/groet")
async def groet_verwerk(request: Request, naam: str = Form(...)):
    return templates.TemplateResponse(
        request,
        "groet_resultaat.html",
        {"naam": naam}
    )

@app.get("/opslaan")
async def naam_formulier():
    return FileResponse("static/pages/naam_opslaan.html")

@app.post("/opslaan")
async def naam_opslaan(naam: str = Form(...)):
    with SqliteDict("namen.db") as db:
        db["laatste_naam"] = naam
        db.commit()

    return {"bericht": f"'{naam}' opgeslagen!"}

@app.get("/toon_naam")
async def toon_naam():
    with SqliteDict("namen.db") as db:
        naam = db.get("laatste_naam", "Nog niets opgeslagen")
    return {"naam": naam}

@app.get("/gastenboek")
async def gastenboek_form():
    return FileResponse("static/pages/gastenboek_form.html")

@app.post("/gastenboek")
async def gastenboek_opslaan(
    naam: str = Form(...),
    wachtwoord: str = Form(...),
    bericht: str = Form(...),
):
    with SqliteDict("gebruikers.db") as gebruikers:
        opgeslagen = gebruikers.get(naam)
    if opgeslagen != wachtwoord:
        raise HTTPException(status_code=401, detail="Naam of wachtwoord klopt niet")

    with SqliteDict("gastenboek.db") as db:
        sleutel = f"bericht_{time.time_ns()}"
        db[sleutel] = {"naam": naam, "bericht": bericht}
        db.commit()
    return RedirectResponse(url="/berichten", status_code=303)

@app.get("/berichten")
async def berichten(request: Request):
    with SqliteDict("gastenboek.db") as db:
        alle_berichten = list(db.items())
    return templates.TemplateResponse(
        request,
        "berichten.html",
        {"berichten": alle_berichten}
    )

@app.post("/verwijderen")
async def verwijderen(sleutel: str = Form(...)):
    with SqliteDict("gastenboek.db") as db:
        if sleutel in db:
            del db[sleutel]
            db.commit()
    return RedirectResponse(url="/berichten", status_code=303)

@app.get("/bericht/{sleutel}")
async def bericht_detail(request: Request, sleutel: str):
    with SqliteDict("gastenboek.db") as db:
        bericht = db.get(sleutel)

    if bericht is None:
        raise HTTPException(status_code=404, detail="Dit bericht bestaat niet")

    return templates.TemplateResponse(
        request,
        "bericht.html",
        {"bericht": bericht}
    )

@app.get("/registreer")
async def registreer_formulier():
    return FileResponse("static/pages/registreer.html")

@app.post("/registreer")
async def registreer(naam: str = Form(...), wachtwoord: str = Form(...)):
    with SqliteDict("gebruikers.db") as gebruikers:
        if naam in gebruikers:
            raise HTTPException(status_code=400, detail="Deze naam is al bezet")
        gebruikers[naam] = wachtwoord
        gebruikers.commit()
    return RedirectResponse(url="/gastenboek", status_code=303)
