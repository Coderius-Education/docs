# embedded-docs

Docusaurus-leersite voor embedded programmeren bij Coderius College: van een knipperende LED in de Arduino IDE, via PlatformIO, tot IO en interfaces op een STM32 Blue Pill.

## Lokaal draaien

```bash
npm install
npm run start
```

De site draait dan op `http://localhost:3000`.

## Bouwen

```bash
npm run build
npm run serve
```

`onBrokenLinks` staat op `throw`, dus de build faalt als een interne link niet bestaat.

## Structuur

- `docs/` — alle lesinhoud, geordend per hoofdstuk (mappen met `_category_.json`).
- `src/components/WokwiSimulator/` — embed van de Wokwi-circuitsimulator.
- `src/pages/cheatsheet.md` — snelle referentie.
- `static/` — afbeeldingen en assets.

Schrijfconventies staan in `CLAUDE.md` en in `../org-handbook/`.
