---
sidebar_position: 2
title: "Stap 2: een wijziging pushen"
hide_table_of_contents: true
---

# Stap 2: een wijziging pushen

Nu je gekoppeld bent, gaat elke volgende push veel sneller. De hele cyclus is:

1. Pas in VS Code `hello.txt` aan, bijvoorbeeld voeg toe: `Dit gaat naar GitHub!`. Sla op.
2. Ga naar **Source Control**
3. Stage het bestand (`+`)
4. Typ een commit-boodschap: `update vanaf VS Code`
5. Klik **Commit** — de commit staat nu lokaal
6. Klik op **Sync Changes** om de commit naar GitHub te uploaden

Die laatste knop staat bovenaan met een wolk- of pijl-icoon, vaak met een cijfer ernaast: het aantal commits dat nog niet gesynchroniseerd is.

Ververs je github.com-pagina: je nieuwe commit staat erop.

**Sync Changes** doet eigenlijk twee dingen:

- `git pull` — eventuele nieuwe commits van GitHub ophalen
- `git push` — jouw nieuwe commits uploaden

Voor je eigen projecten waar alleen jij aan werkt, voelt dit hetzelfde als alleen pushen.
