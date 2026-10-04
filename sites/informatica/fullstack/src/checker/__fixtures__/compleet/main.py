import time

from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlitedict import SqliteDict

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/gastenboek")
async def gastenboek_form():
    return FileResponse("static/pages/gastenboek_form.html")


@app.post("/gastenboek")
async def gastenboek_opslaan(naam: str = Form(...), bericht: str = Form(...)):
    if len(bericht) > 80:
        raise HTTPException(status_code=400, detail="Bericht is te lang")
    with SqliteDict("gastenboek.db") as db:
        db[f"bericht_{time.time_ns()}"] = {"naam": naam, "bericht": bericht}
        db.commit()
    return RedirectResponse(url="/berichten", status_code=303)


@app.get("/berichten")
async def berichten(request: Request):
    with SqliteDict("gastenboek.db") as db:
        alle_berichten = list(db.items())
    return templates.TemplateResponse(request, "berichten.html", {"berichten": alle_berichten})


@app.get("/bericht/{sleutel}")
async def bericht_detail(request: Request, sleutel: str):
    with SqliteDict("gastenboek.db") as db:
        bericht = db.get(sleutel)
    if bericht is None:
        raise HTTPException(status_code=404, detail="Dit bericht bestaat niet")
    return templates.TemplateResponse(request, "bericht.html", {"bericht": bericht})
