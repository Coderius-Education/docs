---
sidebar_position: 5
---

# Veelgestelde vragen

Vragen waar leerlingen vaak op stuiten en die het meeste tijd kosten om in de klas op te lossen. Verwijs leerlingen zo veel mogelijk eerst naar de [foutmeldingen-pagina](/er_gaat_iets_mis) en de [cheatsheet](/docs/cheatsheet) — dat scheelt de docent veel herhaal-werk.

## "Mijn spel start niet, maar ik zie geen foutmelding."

Het venster opent en sluit direct? Meestal staat er ergens een fout boven in de console die snel weer verdwijnt. Vraag de leerling om de terminal-output te scrollen of het programma vanuit Thonny `Run current script` te starten — daar blijft de output staan.

## "De cirkel beweegt niet."

Drie checks in volgorde:
1. Is `start_physics()` aangeroepen? Zonder dat is een vorm "bevroren".
2. Staat `obeys_gravity=True` (de standaard) terwijl er geen vloer is? Dan valt de vorm direct van het scherm. Zet `obeys_gravity=False` of voeg een vloer toe.
3. Is `can_move=False` ingesteld? Dan kan de vorm sowieso niet bewegen.

Meer details in [4.2 Gebeurtenissen bij een vorm](/docs/gebeurtenissen/vormen) en de [foutmeldingen-pagina](/er_gaat_iets_mis).

## "Mijn toetsenbord doet niets."

Vaak een van deze:
- De decorator (`@play.when_key_pressed(...)`) staat niet **direct** boven `def`.
- De toetsnaam klopt niet. Gebruik `"space"`, `"up"`, `"down"`, `"left"`, `"right"` of een kleine letter zoals `"a"`. Niet `"Space"` of `" "`.
- De leerling vergeet `global` bij het wijzigen van een buiten-functie-variabele en denkt dat de toets niets doet, terwijl er een onzichtbare `UnboundLocalError` is.

## "Hoe houd ik een score bij?"

Ze hebben `global` nodig — zie [4.5 Een score bijhouden](/docs/gebeurtenissen/score_bijhouden). Vaak helpt het om eerst zonder global een fout te laten zien, dan global toe te voegen.

## "Het lukt niet om een bal en een batje te laten botsen in Pong."

Volgorde van problemen:
1. Beide vormen moeten `start_physics()` aanroepen — anders worden ze niet door de fysica gezien.
2. Het batje moet **kinematic** zijn (`can_move=True, obeys_gravity=False, stable=True`), anders wordt het zelf weggeduwd door de bal.
3. Voor scorezones aan de zijkanten: gebruik `@bal.when_touching_wall(wall=play.WallSide.LEFT)` — zie [4.2.1](/docs/gebeurtenissen/vormen).

## "Mijn afbeelding (`play.new_image('plaatje.png')`) wordt niet gevonden."

Drie checks:
1. Staat het bestand in **dezelfde map** als het Python-bestand?
2. Komt de naam **exact** overeen, inclusief hoofdletters en de extensie (`.png` vs `.PNG` vs `.jpg`)?
3. Werkt het in Thonny? In de online speeltuin kun je geen bestanden uploaden.

## "Wat is het verschil tussen `==` en `=`?"

Vaak een misvatting. `=` is **toewijzen** (`score = 0`). `==` is **vergelijken** (`if score == 10:`). Een enkele `=` in een `if` geeft een `SyntaxError`. Dit komt veel voor — zie de uitleg in [4.5.1](/docs/gebeurtenissen/score_bijhouden) en op de [foutmeldingen-pagina](/er_gaat_iets_mis).

## "Werkt het ook op een Chromebook of tablet?"

De online speeltuin werkt in elke moderne browser. Voor de **installatie**-route (Thonny / VS Code) is een laptop nodig waarop software geïnstalleerd mag worden. Bij Chromebooks kan dit beperkt zijn — verwijs deze leerlingen naar de speeltuin.
