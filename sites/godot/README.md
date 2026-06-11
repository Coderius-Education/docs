# Coderius Godot — Nederlandse cursus 2D gamedev

Gratis, interactief curriculum waarmee leerlingen stap voor stap hun eerste 2D game bouwen in [Godot 4](https://godotengine.org/). Geschikt voor het voortgezet onderwijs (vak Informatica, HAVO/VWO) en voor zelfstudie door beginners.

🔗 **Live site:** [https://godot.coderius.nl](https://godot.coderius.nl)

## Wat leer je?

- Godot installeren en de editor leren kennen
- Sprites, scenes en nodes opbouwen
- Bewegen en physics met `CharacterBody2D`
- GDScript-basis (variabelen, functies, signals)
- Animaties en `AnimationPlayer`
- Tilemaps, collisions en achtergronden
- Score bijhouden en op het scherm tonen

## Didactische aanpak

Dit project is geen passieve documentatie maar een **interactief curriculum**. De inhoud volgt:

- **PRIMM-methode** (Predict → Run → Investigate → Modify → Make) — student denkt eerst zelf na voordat code wordt onthuld.
- **Fout-gestuurd leren** — veelvoorkomende foutmeldingen krijgen een eigen "Er gaat iets mis"-blok met uitleg.
- **Cognitive load**-beperking — maximaal 1-2 nieuwe concepten per pagina; antwoorden en hints staan achter `<details>`-blokken.

Voor docenten en bijdragers: de volledige redactionele richtlijnen staan in [CLAUDE.md](CLAUDE.md).

## Licentie

Inhoud onder [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/). Vrij te gebruiken en aan te passen voor onderwijs, niet voor commerciële doeleinden.

---

## Lokaal draaien (voor bijdragers)

Vereist Node.js 20+.

```bash
npm ci
npm start
```

Dit start een lokale dev-server met live-reload.

### Build

```bash
npm run build
```

Statische output verschijnt in `build/`.

### Deployment

Push naar `main` triggert automatisch [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), die de site naar GitHub Pages publiceert op `godot.coderius.nl`.
