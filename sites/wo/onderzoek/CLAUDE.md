# Onderzoek (Docusaurus-site)

Nederlandstalig lesmateriaal over onderzoeksvaardigheden voor bovenbouw havo/vwo.
Live op https://coderius-education.github.io/onderzoek/ via GitHub Pages; elke push
naar `main` deployt automatisch (`.github/workflows/deploy.yml`).

## Stijlregels

- **Geen emoji of emoticons** in inhoud, componenten of UI-teksten. Sobere
  typografische symbolen met functie (✓, ✗, ↻ in quiz en trainer) zijn wél toegestaan.
- Alles in het Nederlands, toegankelijk geschreven voor havo/vwo-leerlingen.
- "Een van de" zonder accenten (Taalunie-advies); accenten alleen bij echte klemtoon.
- Admonition-titels in bracket-syntax: `:::tip[Titel]` — de oude spatie-syntax
  (`:::tip Titel`) wordt door de `future.v4`-vlag niet meer geparsed.

## Structuur

- Conceptpagina's (één kernbegrip per pagina): definitiekader (`<Definitie>`), voorbeelden,
  valkuil-admonition, eventueel `<WelNiet>`, `<EchtGebeurd>` (beroemde casus) en `<Denker>`
  (kort kader van twee zinnen dat doorlinkt naar de eigen pagina van die denker; `linkUrl`
  is een absolute route zoals `/kennisleer/plato`, want relatieve .md-paden werken niet in
  component-props), afgesloten met "Hangt samen met".
- Verbandpagina's (titels als "… vs. …", "… samen", "… combineren"): openen met "Het verband
  in één zin" en bevatten de vergelijkingstabellen en `<Quiz>`-oefeningen. Een overzichtspagina
  van een heel mapje staat als eerste zichtbare item ín dat mapje (zie Onderzoek opzetten en
  Kennisleer), niet als onzichtbare `link` op de categorie.
- `src/data/begrippen.js` is de enige bron voor definities: tooltips (`<B t="…"/>`),
  de termen-trainer en de termenlijst worden eruit gegenereerd. Nieuwe begrippen dáár toevoegen.
- Componenten zijn globaal geregistreerd in `src/theme/MDXComponents.js`; geen imports nodig in docs.
- Verplaatste of hernoemde pagina's krijgen een redirect in `docusaurus.config.js`
  (plugin-client-redirects).

## Werkwijze

- `npm run build` moet slagen vóór elke push (`onBrokenLinks: 'throw'` vangt kapotte links).
- Ontwikkel op branch `claude/repo-push-permissions-cz6p40`; direct pushen naar `main` is toegestaan.
