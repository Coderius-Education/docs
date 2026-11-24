# Onderzoek (Docusaurus-site)

Nederlandstalig lesmateriaal over onderzoeksvaardigheden voor bovenbouw havo/vwo.
Hoort bij het vak wetenschapsoriëntatie en staat op https://wo.coderius.nl/onderzoek/
(registry: `packages/shared/sites.js`, id `onderzoek`). De oude GitHub Pages-site
(coderius-education.github.io/onderzoek) wordt vervangen door doorverwijzingen hierheen.

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
- Werkvormen (`docs/werkvormen/`) zijn handouts: `<PrintKnop />` bovenaan, daaronder een
  `.alleen-print`-regel voor naam en klas, dan een uitklapbaar `<details className="docentblok">`
  (duur, groepsvorm, benodigdheden, beoordeling). De rest staat in de je-vorm, in genummerde
  stappen, met invulschema's in `<div className="invulschema">`. Print-hulpklassen staan in
  `src/css/custom.css`: `printbaar` (het enige blok dat op papier komt — staat er zo'n blok op
  een pagina, dan printen alleen dat blok, de titel en de `alleen-print`-regel), `alleen-print`
  (alleen op papier), `geen-print` (nooit op papier), `invulschema` (schrijfruimte in de
  laatste kolom), `invulschema-kort` (compacte variant: twee blokken passen op één A4),
  `invulschema-gelijk` (gelijke kolommen), `nieuwe-pagina` (begin dit blok op een nieuw vel) en `kaartjesvel`/`kaartje` (kaartjes om uit te knippen; schrijflijnen zijn randen, want browsers printen achtergronden standaard niet). De schrijfruimte staat
  in `--schrijfruimte`. Controleer na elke wijziging hoeveel A4 een werkblad beslaat. Een pagina zonder `printbaar`-blok print
  gewoon helemaal.
- Een hoofdstuk kan een handout hebben: alles op één A4, voor- en achterkant
  (`wetenschapsfilosofie/handout.mdx`). Twee blokken `printbaar handout-vel`, het tweede met
  `nieuwe-pagina`; `handout-vel` zet de afdruk op 10 punt met smalle tabellen. Na elke wijziging
  print je hem naar PDF (A4, marges van 1 cm) en kijk je of het nog precies twee bladzijden zijn.
  Hij zegt hetzelfde als de pagina's, met dezelfde vaste definities (zie hieronder).
- `src/data/begrippen.js` is de enige bron voor definities: tooltips (`<B t="…"/>`),
  de termen-trainer en de termenlijst worden eruit gegenereerd. Nieuwe begrippen dáár toevoegen.
  Het hoofdstuk van een begrip volgt uit het eerste deel van zijn `url`; een nieuw hoofdstuk
  (nieuwe map in `docs/`) krijgt een regel in `src/data/hoofdstukken.js`, anders ontbreekt
  het in de trainer.
- Een pagina die een begrip of indeling uit een bron overneemt, heeft direct onder de
  H1 `<Bron id="…" hoofdstuk="…" over="…" />`, zonder eigen kop (die zou als eerste in de
  inhoudsopgave staan); `over` zegt wat er is overgenomen. De gegevens van de bron
  staan één keer in `src/data/bronnen.js`, en de docentenhandleiding verantwoordt dezelfde
  bron onder `## Bronnen`. Neem begrippen en indelingen over, nooit tekst, figuren of
  opdrachten: de site staat onder CC BY-NC, en die licentie kun je alleen geven op eigen
  werk. Twee bronnen: *Ik denk* (Le Coultre, 2007), hoofdstuk 4 Kennisleer voor
  `kennisleer/` en de denkers (niet Chomsky, wel Kant), hoofdstuk 5 Wetenschapsfilosofie voor
  het hoofdstuk `wetenschapsfilosofie/` (redeneervormen, falsificatie, descriptief en
  normatief, de empirisch-analytische methode, hermeneutiek, en Bacon, Popper en Dilthey),
  het inductieprobleem, intersubjectieve kennis en de eis van Popper in `vragen/hypothese`; en
  *Eureka!* (Wientjes & Veenhoven, 2023), hoofdstuk 2 Wat is goed onderzoek voor
  `spelregels/` (niet auteursrecht), plus de functies (`opzet/functies/`) en de typen
  (`typen/`). `src/data/bronnen.test.ts` houdt per pagina bij welke bron en welk
  hoofdstuk erbij hoort; een nieuwe pagina in die mappen moet daar ook in.
- **Een woord dat elders op de site al een andere betekenis heeft, krijgt die uitleg bij de eerste keer.**
  Een review van het hoofdstuk Wetenschapsfilosofie (november 2026) vond vier botsingen:
  *verklaren* is in de wetenschapsfilosofie een oorzaak of wet zoeken, bij de functies van
  onderzoek elke waaromvraag beantwoorden (een `:::note` op `verklaren-vs-begrijpen`, en de
  begrippen zeggen het); *bevestigen* kan volgens Popper niet, dus een hypothese "houdt stand";
  een hypothese komt uit een verklaring (abductie of literatuur) en is zelf de voorspelling die
  je met deductie afleidt, geen gok; en de soort gegevens (kwalitatief, kwantitatief) is een ander
  onderscheid dan de methode (verklaren, begrijpen). Waar filosofen het oneens zijn (rust
  wetenschap op inductie?), zegt de pagina wie wat vindt; een norm van Popper staat er als norm,
  niet als beschrijving. Een denker krijgt alleen wat van hem is: de vooroordelen als
  vertrekpunt van de hermeneutische cirkel zijn van Gadamer, het Socrates-syllogisme is een later
  schoolvoorbeeld in de vorm van Aristoteles. Geen test ziet dit; lees een nieuwe pagina naast de
  pagina's waar ze naar linkt.
- **Wat elke pagina hetzelfde zegt.** Een doorloop als leerling (november 2026) vond dat
  pagina's die elk klopten, elkaar tegenspraken. Houd daarom deze vast. *Valide*: je meet wat je
  wilt weten (de spelregel), niet "wat je hoopte". *Object en subject gescheiden*: de onderzoeker
  staat buiten wat hij onderzoekt; bij de hermeneutiek staat hij er niet buiten. *Deductie*: de
  conclusie is zeker als de redenering geldig is én de uitgangspunten waar zijn; een fout
  uitgangspunt maakt haar onzeker, niet altijd onwaar, en een hypothese volgt alleen zeker als
  ook je andere aannames kloppen. In de vijf stappen hoort de deductie bij stap 2 (de hypothese),
  niet nog eens bij stap 3. *Oorzaak* zie je volgens Hume niet; volgens Kant voegt je verstand
  hem toe. Of Popper het inductieprobleem oploste, is een meningsverschil, geen feit.
- `src/data/structuur.test.ts` eist dat elk begrip in `<B t="…"/>` bestaat (een onbekend id
  verschijnt stil als vette tekst), dat de url van elk begrip en elke interne `linkUrl` van een
  `<Denker>` een bestaande pagina is, en dat een verbandpagina (titel met "vs.", "naast elkaar"
  of "combineren") opent met "Het verband in één zin".
- Twee categorieën met hetzelfde label in de sidebar (Denkers bij Kennisleer en bij
  Wetenschapsfilosofie) krijgen elk een eigen `key`: anders geven ze dezelfde vertaalsleutel
  en stopt de build.
- Teksten van de zoekplugin staan in het Nederlands in `i18n/nl/code.json`.
- Kleuren, letters en het merk komen uit de gedeelde huisstijl (`createConfig`);
  `src/css/custom.css` bevat alleen de handout- en printregels en wordt na de
  gedeelde CSS geladen.
- Componenten zijn globaal geregistreerd in `src/theme/MDXComponents.js`; geen imports nodig in docs.
- Verplaatste of hernoemde pagina's krijgen een omleiding in `src/data/omleidingen.js`
  (het gedeelde `omleidingen`-mechanisme van `createConfig`).
- Een interne route in een component-prop (`linkUrl`, `to`) is absoluut vanaf de
  site (`/kennisleer/plato`) en gaat altijd via `<Link>` of `useBaseUrl`, zodat
  de baseUrl `/onderzoek/` ervoor komt.

## Werkwijze

- `pnpm --filter @coderius/onderzoek build` moet slagen (`onBrokenLinks: 'throw'` vangt
  kapotte links); de algemene werkwijze van de monorepo staat in `../../../CLAUDE.md`.
