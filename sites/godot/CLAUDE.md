# Project-specifieke conventies (Godot)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`).

- Veel handelingen zijn UI-acties in de editor: combineer korte zinnen met screenshots in `docs/images/`.
- Bij GDScript-voorbeelden: gebruik dezelfde conventies als bij Python (variabelnamen NL, keywords/methoden EN).
- Bij scene-/node-uitleg: noem expliciet welk node-type je toevoegt en waar in de tree het komt.
- Voor de "jouw project"-pagina's: verwijs naar de cheatsheet i.p.v. voorbeelden te dupliceren.
- **Voorkennis-blokken** (`<Voorkennis>`, doelsite `python`) staan alleen waar er voor het eerst GDScript-stof langskomt die de python-cursus al uitlegt — zeven van de achtendertig lessen. `src/data/voorkennis.test.ts` houdt twee lijsten bij: `MET_BLOK` en `ZONDER_BLOK`, die laatste gegroepeerd per reden (editorwerk zonder code, voortbouwen op de vorige les, naslag, projectidee). Élk lesbestand moet in een van beide staan, dus een nieuwe les dwingt een expliciete keuze af. Dát de paden bestaan wordt monorepo-breed getest in `packages/shared/voorkennis.test.ts`.

## Blokken "Er gaat iets mis"

Naast **Oorzaak:** en **Oplossing:** (zie de schrijfgids §8) krijgt een blok een derde element zodra de fout zich zonder foutmelding voordoet:

- **Zelf vinden:** — welke concrete meting de leerling had kunnen doen om hier zelf te komen, meestal één `print()` op een genoemde plek, met erbij wat elke uitkomst betekent.

Dit hoort alleen bij symptoomblokken ("mijn karakter valt niet"), niet bij blokken die met een letterlijke foutmelding beginnen — daar is de melding zelf al de aanwijzing. De methode erachter staat in [Fouten zoeken](docs/05-bewegingsscript/fouten-zoeken.md); verwijs daarheen in plaats van de uitleg te herhalen.
