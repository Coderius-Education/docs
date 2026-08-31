// Centrale begrippenlijst: één bron voor tooltips (Begrip), de
// termen-trainer (flashcards) en de alfabetische termenlijst.
// Per begrip: term, kort (één zin, voor tooltip en flashcard),
// lang (uitgebreidere tekst voor de termenpagina; optioneel) en url.

const begrippen = {
  aanvaardbaar: {
    term: 'Aanvaardbaar',
    kort: 'Ethisch verantwoord onderzoek: eerlijk uitgevoerd, met toestemming, met respect voor privacy en zonder iemand te schaden.',
    lang: 'Een van de vier spelregels: onderzoek is aanvaardbaar als het ethisch verantwoord is — eerlijk uitgevoerd, met toestemming, met respect voor privacy en zonder iemand te schaden.',
    url: '/spelregels/aanvaardbaar',
  },
  'analyse-materiaal': {
    term: 'Analyse van tekst- of beeldmateriaal',
    kort: 'Bestaand materiaal (artikelen, posts, reclames, video’s) systematisch bestuderen met een analyseschema.',
    lang: 'Een methode van gegevensverzameling waarbij je bestaand materiaal (artikelen, posts, reclames, foto’s, video’s) systematisch bestudeert met een analyseschema.',
    url: '/opzet/methoden/analyse-materiaal',
  },
  'beschrijvend-onderzoek': {
    term: 'Beschrijvend onderzoek',
    kort: 'Onderzoek dat beschrijft hoe iets is: puur beschrijvend, vergelijkend, definiërend of evaluerend.',
    lang: 'Onderzoek met als functie te beschrijven hoe iets is. Kan puur beschrijvend, vergelijkend, definiërend of evaluerend zijn.',
    url: '/opzet/functies/functies-overzicht',
  },
  betrouwbaar: {
    term: 'Betrouwbaar',
    kort: 'Het resultaat hangt niet van toeval af: wie het onderzoek herhaalt, krijgt (ongeveer) hetzelfde resultaat.',
    lang: 'Een van de vier spelregels: onderzoek is betrouwbaar als het resultaat niet van toeval afhangt — wie het herhaalt, krijgt (ongeveer) hetzelfde resultaat.',
    url: '/spelregels/betrouwbaar',
  },
  bronvermelding: {
    term: 'Bronvermelding',
    kort: 'Vermelden waar informatie vandaan komt, bij alles wat je van een ander overneemt.',
    lang: 'Het vermelden waar informatie vandaan komt, bij alles wat je van een ander overneemt. Hoort bij de spelregel transparant.',
    url: '/spelregels/transparant',
  },
  conclusie: {
    term: 'Conclusie',
    kort: 'Het onderbouwde antwoord op je hoofdvraag; het eindresultaat van theoriegericht onderzoek.',
    url: '/typen/theoriegericht',
  },
  controlegroep: {
    term: 'Controlegroep',
    kort: 'Een groep die de "behandeling" níét krijgt, zodat je kunt vergelijken.',
    lang: 'Een groep deelnemers die de "behandeling" die je onderzoekt níét krijgt, zodat je kunt vergelijken. Belangrijk hulpmiddel voor interne validiteit.',
    url: '/spelregels/interne-validiteit',
  },
  deelvraag: {
    term: 'Deelvraag',
    kort: 'Een kleinere vraag die helpt om de hoofdvraag te beantwoorden; per deelvraag kies je functie, soort en methode.',
    lang: 'Een kleinere vraag die helpt om de hoofdvraag te beantwoorden. Per deelvraag kies je een functie, soort en methode — zie de keuzedriehoek.',
    url: '/opzet/keuzedriehoek',
  },
  enquete: {
    term: 'Enquête',
    kort: 'Veel mensen dezelfde (neutrale, meestal gesloten) vragen stellen, zodat je antwoorden kunt tellen en vergelijken.',
    lang: 'Een methode van gegevensverzameling waarbij je veel mensen dezelfde (neutrale, meestal gesloten) vragen stelt, zodat je de antwoorden kunt tellen en vergelijken.',
    url: '/opzet/methoden/enquete',
  },
  experimenteel: {
    term: 'Experimenteel onderzoek',
    kort: 'Zelf één variabele veranderen en al het andere gelijk houden, om het effect te meten.',
    lang: 'Een soort onderzoek waarbij je zelf één variabele verandert en al het andere gelijk houdt, om het effect te meten. Sterk in het aantonen van oorzaak en gevolg.',
    url: '/opzet/soorten/experimenteel',
  },
  'externe-validiteit': {
    term: 'Externe validiteit',
    kort: 'De mate waarin je conclusie ook geldt buiten je onderzoek: voor andere mensen, situaties en momenten.',
    lang: 'De mate waarin je conclusie ook geldt buiten je onderzoek: voor andere mensen, situaties en momenten (ook wel generaliseerbaarheid).',
    url: '/spelregels/externe-validiteit',
  },
  hoofdvraag: {
    term: 'Hoofdvraag',
    kort: 'De centrale vraag van je onderzoek: een kennisvraag (theoriegericht) of een ontwerpvraag (ontwerpgericht).',
    lang: 'De centrale vraag van je onderzoek. Bij theoriegericht onderzoek is het een kennisvraag, bij ontwerpgericht onderzoek een ontwerpvraag.',
    url: '/typen/theorie-vs-ontwerp',
  },
  hypothese: {
    term: 'Hypothese',
    kort: 'Je verwachte antwoord, opgesteld vóórdat je gegevens verzamelt; een hypothese die niet klopt is óók een geldig resultaat.',
    lang: 'Je verwachte antwoord op de hoofdvraag, opgesteld vóórdat je gegevens verzamelt. Centraal in verklarend-toetsend onderzoek — en een hypothese die niet klopt is óók een geldig resultaat.',
    url: '/opzet/functies/verklarend-toetsend',
  },
  'interne-validiteit': {
    term: 'Interne validiteit',
    kort: 'De uitkomst komt echt door wat je onderzocht, en niet door een storende variabele.',
    lang: 'De mate waarin de uitkomst van je onderzoek echt komt door wat je onderzocht, en niet door een storende variabele.',
    url: '/spelregels/interne-validiteit',
  },
  interview: {
    term: 'Interview',
    kort: 'Met één of enkele personen dieper doorpraten en doorvragen naar het waarom.',
    lang: 'Een methode van gegevensverzameling waarbij je met één of enkele personen dieper doorpraat over een onderwerp en kunt doorvragen naar het waarom.',
    url: '/opzet/methoden/interview',
  },
  kennisvraag: {
    term: 'Kennisvraag',
    kort: 'Een hoofdvraag waarmee je iets te weten wilt komen: "Hoe zit het…?", "Welke invloed…?", "In hoeverre…?".',
    lang: 'Een hoofdvraag waarmee je iets te weten wilt komen: "Hoe zit het…?", "Welke invloed…?", "In hoeverre…?". Hoort bij theoriegericht onderzoek.',
    url: '/typen/theoriegericht',
  },
  keuzedriehoek: {
    term: 'Keuzedriehoek',
    kort: 'De drie keuzes per deelvraag: functie, soort onderzoek en methode van gegevensverzameling.',
    lang: 'De drie keuzes die je per deelvraag maakt bij het opzetten van onderzoek: de functie, het soort onderzoek en de methode van gegevensverzameling.',
    url: '/opzet/keuzedriehoek',
  },
  kwalitatief: {
    term: 'Kwalitatief onderzoek',
    kort: 'Gegevens in woorden: meningen, ervaringen en verklaringen. Sterk in begrijpen waaróm iets zo is.',
    lang: 'Onderzoek dat gegevens in woorden oplevert: meningen, ervaringen en verklaringen, meestal van een klein aantal mensen. Sterk in begrijpen waaróm iets zo is.',
    url: '/gegevens/kwalitatief',
  },
  kwantitatief: {
    term: 'Kwantitatief onderzoek',
    kort: 'Gegevens in cijfers: aantallen, percentages en gemiddelden. Sterk in vergelijken en generaliseren.',
    lang: 'Onderzoek dat gegevens in cijfers oplevert: aantallen, percentages en gemiddelden van een grote groep. Sterk in vergelijken en generaliseren.',
    url: '/gegevens/kwantitatief',
  },
  literatuuronderzoek: {
    term: 'Literatuuronderzoek',
    kort: 'Bestaande bronnen zoeken, op betrouwbaarheid beoordelen en met elkaar vergelijken.',
    lang: 'Een soort onderzoek (ook wel bronnenonderzoek) waarbij je bestaande bronnen zoekt, op betrouwbaarheid beoordeelt en met elkaar vergelijkt. Bijna elk onderzoek begint ermee.',
    url: '/opzet/soorten/literatuuronderzoek',
  },
  observatieschema: {
    term: 'Observatieschema',
    kort: 'Een vooraf gemaakt schema met wát je gaat turven of noteren (wie, wat, waar, wanneer).',
    lang: 'Een vooraf gemaakt schema waarin staat wát je gaat turven of noteren tijdens een observatie (wie, wat, waar, wanneer). Maakt je observatie gericht en herhaalbaar.',
    url: '/opzet/methoden/observatie',
  },
  observeren: {
    term: 'Observeren',
    kort: 'Gedrag of situaties bekijken en turven, zonder er zelf iets aan te veranderen.',
    lang: 'Een methode van gegevensverzameling waarbij je gedrag of situaties bekijkt en turft, zonder er zelf iets aan te veranderen.',
    url: '/opzet/methoden/observatie',
  },
  ontwerpgericht: {
    term: 'Ontwerpgericht onderzoek',
    kort: 'Onderzoek waarbij je een product maakt dat een probleem oplost, getoetst aan vooraf opgestelde eisen.',
    lang: 'Onderzoek waarbij je een product maakt dat een probleem oplost. Het resultaat is een werkend ontwerp dat je toetst aan vooraf opgestelde eisen.',
    url: '/typen/ontwerpgericht',
  },
  ontwerpvraag: {
    term: 'Ontwerpvraag',
    kort: 'Een hoofdvraag waarmee je iets wilt maken: "Hoe kan ik … ontwerpen/maken dat …?".',
    lang: 'Een hoofdvraag waarmee je iets wilt maken: "Hoe kan ik … ontwerpen/maken/ontwikkelen dat …?". Hoort bij ontwerpgericht onderzoek.',
    url: '/typen/ontwerpgericht',
  },
  plagiaat: {
    term: 'Plagiaat',
    kort: 'Werk of ideeën van een ander presenteren alsof ze van jou zijn, zonder bronvermelding.',
    lang: 'Werk of ideeën van een ander presenteren alsof ze van jou zijn, zonder bronvermelding. Schendt de spelregels transparant en aanvaardbaar.',
    url: '/spelregels/transparant',
  },
  prototype: {
    term: 'Prototype',
    kort: 'Een eerste, testbare versie van je ontwerp — om te testen of je oplossing werkt.',
    lang: 'Een eerste, testbare versie van je ontwerp. Hoeft nog niet af of mooi te zijn — het gaat erom dat je ermee kunt testen of je oplossing werkt.',
    url: '/typen/ontwerpgericht',
  },
  representatief: {
    term: 'Representatief',
    kort: 'Je groep deelnemers lijkt op de hele groep waarover je iets wilt zeggen.',
    lang: 'Een groep deelnemers is representatief als die lijkt op de hele groep waarover je iets wilt zeggen. Belangrijk voor valide onderzoek en externe validiteit.',
    url: '/spelregels/externe-validiteit',
  },
  'storende-variabele': {
    term: 'Storende variabele',
    kort: 'Een factor die je níét onderzoekt maar wel de uitkomst beïnvloedt — bedreigt de interne validiteit.',
    lang: 'Een factor die je níét onderzoekt maar wel de uitkomst beïnvloedt, waardoor je niet weet waar het resultaat door komt. Bedreigt de interne validiteit.',
    url: '/spelregels/interne-validiteit',
  },
  theoriegericht: {
    term: 'Theoriegericht onderzoek',
    kort: 'Onderzoek waarbij je iets te weten wilt komen; het resultaat is een onderbouwde conclusie.',
    lang: 'Onderzoek waarbij je iets te weten wilt komen: hoe iets in elkaar zit, waarom iets gebeurt of wat het effect van iets is. Het resultaat is een onderbouwde conclusie.',
    url: '/typen/theoriegericht',
  },
  transparant: {
    term: 'Transparant',
    kort: 'Een ander kan precies nagaan wat je hebt gedaan: methode beschreven, bronnen vermeld, gegevens zichtbaar.',
    lang: 'Een van de vier spelregels: onderzoek is transparant als een ander precies kan nagaan wat je hebt gedaan — methode beschreven, bronnen vermeld, gegevens zichtbaar.',
    url: '/spelregels/transparant',
  },
  valide: {
    term: 'Valide',
    kort: 'Je meet echt wat je wilt weten: passende methode, juiste groep, neutrale vragen.',
    lang: 'Een van de vier spelregels: onderzoek is valide als je echt meet wat je wilt weten — passende methode, juiste groep, neutrale vragen en geen grotere conclusies dan je gegevens toelaten.',
    url: '/spelregels/valide',
  },
  variabele: {
    term: 'Variabele',
    kort: 'Iets wat kan verschillen of veranderen in je onderzoek; bij een experiment verander je er zelf precies één.',
    lang: 'Iets wat kan verschillen of veranderen in je onderzoek. Bij een experiment verander je zelf één variabele en houd je de rest gelijk; een variabele die je níét onderzoekt maar wel meespeelt, heet een storende variabele.',
    url: '/opzet/soorten/experimenteel',
  },
  veldonderzoek: {
    term: 'Veldonderzoek',
    kort: 'Gegevens verzamelen in de echte situatie: observeren, enquêteren, interviewen of meten op locatie.',
    lang: 'Een soort onderzoek waarbij je gegevens verzamelt in de echte situatie, bijvoorbeeld door te observeren, enquêteren, interviewen of meten op locatie.',
    url: '/opzet/soorten/veldonderzoek',
  },
  'verklarend-onderzoek': {
    term: 'Verklarend onderzoek',
    kort: 'Onderzoek dat verklaart waaróm iets zo is: explorerend (verklaringen zoeken) of toetsend (één hypothese toetsen).',
    lang: 'Onderzoek met als functie te verklaren waaróm iets zo is. Kan explorerend zijn (mogelijke verklaringen opsporen) of toetsend (één hypothese gericht toetsen).',
    url: '/opzet/functies/functies-overzicht',
  },
  'vooraf-opgestelde-eisen': {
    term: 'Vooraf opgestelde eisen',
    kort: 'De lijst eisen waaraan je ontwerp moet voldoen, opgesteld vóórdat je gaat ontwerpen.',
    lang: 'De lijst met eisen waaraan je ontwerp moet voldoen, opgesteld vóórdat je gaat ontwerpen. Aan het einde test je je ontwerp tegen deze eisen.',
    url: '/typen/ontwerpgericht',
  },
};

export default begrippen;
