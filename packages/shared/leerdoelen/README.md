# Leerdoelen en Bloom

Elke cursus met leerdoelen heeft `src/leerdoelen.json`. Het is de tabel van de
docent uit het beoordelingsblad, en de enige bron voor:

- de pagina's `/leerdoelen`, `/leerdoelen/<niveau>` en `/leerdoelen/bloom`
  (`../plugins/leerdoelen.js`, `../components/Leerdoelen/`);
- de nakijker (`leerdoelenNaarConfig` in `packages/checker`);
- coderius.nl: na de build staat het bestand als `<cursus>/leerdoelen.json`
  op de site.

## De vorm

```json
{
  "niveaus": [
    { "id": "start", "label": "Start" },
    { "id": "havo", "label": "Verdieping havo" }
  ],
  "onderwerpen": [{ "id": "gdscript", "label": "GDScript" }],
  "concepten": [
    { "id": "gd-groups", "onderwerp": "gdscript", "concept": "groups", "start": "gevorderd", "havo": "basis" }
  ]
}
```

- Elk niveau is een sleutel op de rij, met `basis`, `gevorderd` of `expert`.
  Elke rij heeft elk niveau; een ontbrekend of onbekend niveau is een fout.
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

## Een niveau toevoegen

Een regel in `niveaus` en een sleutel op élke rij. De nakijker krijgt het
niveau vanzelf als leerroute, en de pagina's een kolom en een eigen route.
Een niveau mag niet `bloom` heten (dat is de route van de Bloom-pagina) en niet
de naam van een veld hebben.

## Bloom en het cijfer

`bloom.json` is voor alle cursussen gelijk: de zes denkvaardigheden met
werkwoorden en voorbeelden, de moeilijkheden, de cijfertabel, het sjabloon,
de vuistregels en de bronnen. `index.js` rekent ermee:

- `cijferVoor(bloom, moeilijkheid)`: het cijfer uit de tabel. Expert telt als
  gevorderd (`cijferAls`), tot het blad er een eigen kolom voor heeft.
- `sjabloonZin(bloom, moeilijkheid)`: de zin voor op de beoordeling.
- `moeilijkheidVoorstel(perOnderwerp)`: het voorstel in de nakijker. Een
  onderwerp haalt een moeilijkheid met één concept van die moeilijkheid of
  hoger; hoe vaak telt niet. De moeilijkheid is gehaald als elk onderwerp met
  zulke concepten hem haalt.
