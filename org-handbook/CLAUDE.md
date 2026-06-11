Dit project is geen passieve documentatie, maar een interactief curriculum. 
Het doel is om studenten te begeleiden van "consumptie" naar "creatie" door middel van de PRIMM-methode en "fout-gestuurd" leren.

Didactische Principes

1. De PRIMM-methode

Elke module moet de student door de PRIMM-cyclus leiden. Gebruik interactieve elementen om "spoilers" te voorkomen en de student te dwingen eerst zelf na te denken.

- Predict: Toon een code-snippet en stel de vraag: "Wat denk je dat dit doet?". Verberg de uitleg achter een <details> blok.
- Run: Geef instructies om de code lokaal uit te voeren. Bevestig de output.
- Investigate: Stel diepere vragen. "Wat gebeurt er als je X verandert in Y?".
- Modify: Geef een kleine programmeertaak om de bestaande code aan te passen.
- Make: Een grotere opdracht waarbij de student zelfstandig iets nieuws bouwt op basis van het geleerde.

2. Opdrachten & Oplossingen (Scaffolding)

Bij het aanbieden van opdrachten (Modify/Make) hanteren we een vaste structuur die hulp stapsgewijs aanbiedt. 
Zowel de tip als het antwoord zijn verborgen om de student te stimuleren eerst zelf op zoek te gaan naar de oplossing:
- Opdrachtomschrijving: Wat moet er gebeuren?
- Tip: Gebruik een <details><summary></summary></details> blok voor een subtiele hint.
- Antwoord: Plaats de volledige oplossing in een tweede <details><summary></summary></details> blok onder de tip.

3. "Er gaat iets mis" (Error-Driven Learning)
We verbergen fouten niet, we gebruiken ze als leermoment.
Documenteer de meest voorkomende foutmeldingen.
Leg uit waarom de fout optreedt in plaats van alleen de oplossing te geven.

4. Beperken van Cognitieve Belasting (Cognitive Load)
Om te voorkomen dat studenten overweldigd raken, hanteren we de volgende regels voor informatiebeheer:
- Eén concept per keer: Introduceer maximaal 1 of 2 nieuwe concepten per pagina.
- Geen "Wall of Text": Gebruik korte paragrafen, bullet points en voldoende witruimte.
- Progressive Disclosure: Gebruik <details> niet alleen voor antwoorden, maar ook voor optionele diepgaande theorie die niet essentieel is voor de basisopdracht.
- Consistentie: Gebruik overal dezelfde terminologie en codeer-conventies om verwarring te voorkomen.

5. Cheatsheets
Er moet een aparte pagina zijn met een cheatsheet. Dit is slechts een opsomming van <details><summary></summary></details> elementen voor snelle referentie van syntax en commando's.
Headers worden gebruikt voor het conceptueel scheiden van de <details> elementen.

6. Licentie
De licentie is Licensed under Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0).
Plaats dit in de footer.

7. SEO
Pas de meest simpele strategie toe die past bij een docusarus project.

📂 Projectstructuur & Conventies
- Bestandsnamen: Gebruik kebab-case en nummering (bijv. 01-introductie-play.md).
- Taal: Nederlands (informeel "je", maar professioneel).

Mappen:
- docs/: Bevat alle leerinhoud.
- docs/assets/: Afbeeldingen en schema's.

✅ Workflow voor Auteurs
- Leerdoel: Welk concept moet de student beheersen? Is dit er maximaal één (Cognitive Load)?
- De Fout: Welke fout gaat de student maken? Maak een "Er gaat iets mis" blok.
- Interactie: Gebruik <details> voor "Predict", "Tips" en "Antwoorden".
- Scaffolding: Is de tip ook verborgen achter een <details> zodat de student niet per ongeluk de hint leest?
- Referentie: Is de cheatsheet bijgewerkt?
