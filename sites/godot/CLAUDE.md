# Project-specifieke conventies (Godot)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`).

- Veel handelingen zijn UI-acties in de editor: combineer korte zinnen met screenshots in `docs/images/`.
- Bij GDScript-voorbeelden: gebruik dezelfde conventies als bij Python (variabelnamen NL, keywords/methoden EN).
- Bij scene-/node-uitleg: noem expliciet welk node-type je toevoegt en waar in de tree het komt.
- Voor de "jouw project"-pagina's: verwijs naar de cheatsheet i.p.v. voorbeelden te dupliceren.
- **Voorkennis-blokken** (`<Voorkennis>`, doelsite `python`) staan alleen waar er voor het eerst GDScript-stof langskomt die de python-cursus al uitlegt — zeven van de achtendertig lessen. `src/data/voorkennis.test.ts` houdt twee lijsten bij: `MET_BLOK` en `ZONDER_BLOK`, die laatste gegroepeerd per reden (editorwerk zonder code, voortbouwen op de vorige les, naslag, projectidee). Élk lesbestand moet in een van beide staan, dus een nieuwe les dwingt een expliciete keuze af. Dát de paden bestaan wordt monorepo-breed getest in `packages/shared/voorkennis.test.ts`.

## De nakijker

- **`src/checker/niveaus.json` is de tabel van de docent**, en de enige plek waar staat wélke concepten er zijn en op welk niveau ze tellen. Eén regel per concept, met onderwerp, groep, het concept in de woorden van de tabel, en een niveau per leerroute. `config.ts` voegt daar alleen de detectie aan toe: hoe je dat concept in de bestanden terugvindt. Een rij erbij in de JSON zonder detectie in `config.ts` laat de config bij het laden omvallen — bewust, want stil niet-detecteren is erger dan een harde fout.
- **Twee leerroutes, Start en Verdieping**, met per concept een eigen niveau. Dat is de reden dat de niveaus in een tabel staan en niet in de code: wat in Start nog gevorderd is (globals, lijsten, dictionaries, loops, zelf nieuwe nodes zoeken) is in Verdieping gewoon basis. De routeknop staat in de docentweergave; een leerling ziet alleen zijn bestandstelling.
- **De niveaus hingen eerder los van de cursus.** Het hele bewegingsscript van hoofdstuk 5 (`velocity`, `move_and_slide`, `is_on_floor`, `get_gravity`, `_physics_process`) stond op "gevorderd", net als `_process`. Wie de cursus afmaakte zag zo de helft van zijn eigen werk als gevorderd staan. De oude, op losse keywords gebouwde conceptenlijst is daarom vervangen door de vaardigheden uit de tabel.
- **"Veranderen" betekent: niet de waarde van de tutorial.** `snelheid veranderen` en `sprongkracht veranderen` slaan pas aan als er iets anders staat dan `300.0` respectievelijk `-800.0`/`-400.0`, en `animatie veranderen` pas bij een andere naam dan `idle`/`run`/`jump`. Die cursuswaardes staan bovenin `config.ts`; verandert een les zijn getallen, dan horen ze hier mee te veranderen. Let bij zo'n lookahead op `(?![\d.])` in plaats van `\b` — achter de `300` in `300.5` staat óók een woordgrens, en met `\b` telde een eigen waarde ten onrechte als die van de cursus.
- **"Nuttig gebruik" benaderen we met een drempel van twee.** Een regex kan niet zien of iets nuttig is; wel of het meer dan één keer voorkomt. Een lijst die je aanmaakt maar nooit gebruikt haalt die drempel niet, en dat is precies de bedoeling. De fixture `__fixtures__/eigen` legt beide kanten vast.
- **Drie voorbeeldprojecten** in `__fixtures__`: `minimaal` (een kaal project, hoort niets te scoren), `compleet` (de cursus nagedaan — haalt de nodes en de code, maar niet de vier "eigen gemaakt"-concepten, want het gebruikt de waardes uit de les) en `eigen` (een leerling die er zijn eigen spel van maakte). Die drie samen zijn de test; `config.test.ts` zet erbij waaróm een concept wel of niet hoort te tellen.

## Blokken "Er gaat iets mis"

Naast **Oorzaak:** en **Oplossing:** (zie de schrijfgids §8) krijgt een blok een derde element zodra de fout zich zonder foutmelding voordoet:

- **Zelf vinden:** — welke concrete meting de leerling had kunnen doen om hier zelf te komen, meestal één `print()` op een genoemde plek, met erbij wat elke uitkomst betekent.

Dit hoort alleen bij symptoomblokken ("mijn karakter valt niet"), niet bij blokken die met een letterlijke foutmelding beginnen — daar is de melding zelf al de aanwijzing. De methode erachter staat in [Fouten zoeken](docs/05-bewegingsscript/fouten-zoeken.md); verwijs daarheen in plaats van de uitleg te herhalen.
