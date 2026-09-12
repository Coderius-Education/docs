# Hoe start ik?

Je project staat er nog, maar je computer is uit geweest. Elke les begin
je daarom met dezelfde vier stappen, en daarna werk je verder waar je
gebleven was.

## Stap 1: Open PowerShell in je projectmap

Ga in de Verkenner naar de map van je project. Klik met de
rechtermuisknop in het lege deel van het venster en kies **Open in
Terminal** (Windows 10: **Open PowerShell window here**).

Je ziet het pad van je map vooraan de regel staan.

Lukt dat niet? <SiteLink site="editor" to="/python/stap-2-powershell">PowerShell openen vanuit je map</SiteLink>.

## Stap 2: Open je project in VS Code

Typ in dat venster:

```bash
code .
```

VS Code opent met je projectmap in de Explorer links, inclusief `.venv`
en `main.py`.

## Stap 3: Open een terminal in VS Code

Ga naar **Terminal** → **New Terminal**. Vooraan de regel hoort
`(.venv)` te staan.

Die `(.venv)` is het hele punt van deze stap: hij zegt dat je in de
virtual environment van dít project werkt, waar FastAPI geïnstalleerd
staat. Staat hij er niet, dan vindt Python straks je packages niet.

## Stap 4: Start de server

```bash
fastapi dev main.py
```

In de terminal verschijnt een regel met `Uvicorn running on
http://127.0.0.1:8000`. Open dat adres in je browser en je eigen pagina
staat er weer.

De server blijft draaien zolang dit venster openstaat. Sla je een
bestand op, dan herstart hij zichzelf — je hoeft alleen je browser te
verversen.

## Klaar met werken?

Druk in de terminal op **Ctrl+C**. De server stopt, en je map blijft
staan zoals hij was. Morgen begin je weer bij stap 1.

## Er gaat iets mis

- **`fastapi: command not found`** of **`ModuleNotFoundError`** — je
  zit niet in de virtual environment. Terug naar stap 3 en kijk naar
  die `(.venv)`.
- **`Address already in use`** — er draait nog een server van een
  vorige keer.

Beide meldingen staan met hun oplossing bij [Er gaat iets mis](/docs/troubleshooting).

Werkt de installatie zelf nog niet? Dan is [Installatie](/docs/FastAPI/installatie) de controlelijst: vijf checks met per check wat je hoort te zien.
