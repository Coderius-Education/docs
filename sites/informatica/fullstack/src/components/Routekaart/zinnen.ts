// Per categorie (of losse pagina) in sidebars.ts één zin voor de Routekaart.
// In de FastAPI-route zegt de zin wat je daarna kunt; in de route Veiligheid
// is het de vraag die de reeks beantwoordt. De sleutel is het label uit
// sidebars.ts; logica.test.ts eist dat elke categorie een zin heeft en dat er
// geen zin blijft staan voor een categorie die niet meer bestaat.

export const ZINNEN: Record<string, string> = {
  // FastAPI: de basis
  'Je eerste server':
    'Je start een server op je eigen computer en ziet in de browser wat je functie teruggeeft.',
  "HTML-pagina's": "Je server stuurt echte pagina's, met links, een stylesheet en afbeeldingen.",
  'Templates en formulieren':
    'Een pagina vult zich met waarden uit Python, en je server beantwoordt een formulier.',
  'Gegevens opslaan (SqliteDict)':
    'Een script bewaart gegevens in een bestand, zodat ze er na het afsluiten nog zijn.',
  'Opslaan en tonen in je server':
    'Berichten blijven bewaard en staan in een lijst, elk met een eigen pagina.',
  Accounts: 'Wie schrijft, heeft een account met een naam en een wachtwoord.',
  // FastAPI: de uitbreidingen en de afronding
  'Uitbreiding: zonder herladen (htmx)':
    'Een knop of formulier praat met de server terwijl de pagina blijft staan.',
  'Uitbreiding: JavaScript in de browser':
    'Code draait in de browser, en je weet wat daar hoort en wat op de server.',
  'Uitbreiding: onthouden (cookies en sessies)':
    'Je logt één keer in, en je server herkent je bij het volgende verzoek.',
  Afronden:
    'Een onbekend adres krijgt een eigen pagina, je ziet de weg van klik tot antwoord, en je klas komt kijken.',

  // Veiligheid
  'Een script als bezoeker':
    'Hoe stuur je een verzoek zonder browser? Dat gereedschap gebruik je in elke reeks.',
  'Wat je server laat zien':
    'Wat ziet een bezoeker van je server zonder dat je het hem vertelt, en wat deel je met je bestanden?',
  'Invoer controleren':
    'Hoe houd je tegen wat niet in een veld hoort, als maxlength dat niet doet?',
  'HTML van een bezoeker (XSS)': 'Wat gebeurt er als een bezoeker HTML in je gastenboek typt?',
  'Te veel verzoeken (DoS)': 'Wat doe je tegen een bezoeker die je server blijft bestoken?',
  'Wie mag wat': 'Hoe zorg je dat alleen de schrijver zijn bericht kan verwijderen?',
  'Cookies afschermen': 'Hoe houd je een script weg bij het sessie-id?',
  'Wachtwoorden veilig opslaan':
    'Hoe bewaar je wachtwoorden zo dat een gelekte database ze niet weggeeft?',
  'Beveilig je eigen project': 'Eén lijst om je gastenboek of eigen project mee na te lopen.',
};

// Een mijlpaal staat onder een etappe: hier heb je iets wat werkt.
export const MIJLPALEN: Record<string, string> = {
  Accounts: 'Hier werkt je gastenboek. Wat hierna komt, maakt het mooier, maar is niet nodig.',
  'Beveilig je eigen project': 'Hier is je gastenboek beschermd.',
};
