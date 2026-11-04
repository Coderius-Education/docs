# Leerdoelen en Bloom

Elke cursus met leerdoelen heeft `src/leerdoelen.json`. Het is de tabel van de
docent uit het beoordelingsblad, en de enige bron voor:

- het overzicht `/leerdoelen`, met de uitleg van Bloom, een pagina
  `/leerdoelen/niveau-<n>` per niveau, en bij meer niveaus
  `/leerdoelen/vergelijken` (`../plugins/leerdoelen.js`,
  `../components/Leerdoelen/`);
- de nakijker (`leerdoelenNaarConfig` in `packages/checker`);
- coderius.nl: na de build staat het bestand als `<cursus>/leerdoelen.json`
  op de site.

## De niveaus

Elke cursus kent dezelfde vier niveaus (`niveaus.json`): Niveau 1 tot en met
Niveau 4. Een cursus zet in `niveaus` welke hij heeft, op volgorde; de naam komt
uit `niveaus.json`. Op de sites heten ze alleen Niveau 1 tot en met 4, zonder
schoolsoort.

## De vorm

```json
{
  "niveaus": ["1", "2", "3", "4"],
  "onderwerpen": [{ "id": "gdscript", "label": "GDScript" }],
  "concepten": [
    { "id": "gd-groups", "onderwerp": "gdscript", "concept": "groups", "1": "gevorderd", "2": "gevorderd", "3": "gevorderd", "4": "basis" }
  ]
}
```

- Elk niveau is een sleutel op de rij, met `basis`, `gevorderd` of `expert`.
  Elke rij heeft elk niveau van de cursus; een ontbrekend of onbekend niveau
  is een fout.
- Andere velden die mogen: `bloom` (een denkvaardigheid uit `bloom.json`),
  `groep` (een kop in de nakijker) en `toelichting` (een zin op de pagina).
- De volgorde is die van het blad. Een rij blijft op één regel: `biome.json`
  geeft `leerdoelen.json` een regelbreedte van 200.

## Een rij toevoegen

1. Een regel in `src/leerdoelen.json`, met een nieuwe `id`.
2. Heeft de cursus een nakijker, dan een herkenning voor die `id` in
   `src/checker/config.ts`. Zonder herkenning stopt de nakijker met een fout
   die de `id` noemt.
3. `pnpm test`: `packages/shared/leerdoelen.test.ts` controleert de vorm van
   elk bestand, de nakijker-test van de cursus de herkenning.

## Een niveau toevoegen aan een cursus

Het nummer in `niveaus` (op volgorde) en een sleutel op élke rij. De nakijker
krijgt het niveau vanzelf als leerroute ("Niveau 3"), en de
pagina's een kolom en een eigen route. Een vijfde niveau voor alle cursussen
is een regel in `niveaus.json`.

## Bloom en het cijfer

`bloom.json` is voor alle cursussen gelijk: de zes denkvaardigheden met
werkwoorden en voorbeelden, de moeilijkheden, de cijfertabel, het sjabloon,
de vuistregels en de bronnen. Een bron staat er alleen als vakdidactiek hem
uitlegt: `didactiek` is het pad van die pagina (`/bronnen/<slug>`), en de test
eist dat de pagina en de tip in `tips.ts` bestaan en dezelfde paper noemen. `index.js` rekent ermee:

- `cijferVoor(bloom, moeilijkheid)`: het cijfer uit de tabel. Expert telt als
  gevorderd (`cijferAls`), tot het blad er een eigen kolom voor heeft.
- `sjabloonZin(bloom, moeilijkheid)`: de zin voor op de beoordeling.
- `moeilijkheidVoorstel(perOnderwerp)`: het voorstel in de nakijker. Een
  onderwerp haalt een moeilijkheid met één concept van die moeilijkheid of
  hoger; hoe vaak telt niet. De moeilijkheid is gehaald als elk onderwerp met
  zulke concepten hem haalt.
