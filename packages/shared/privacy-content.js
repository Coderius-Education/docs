// Gedeelde inhoud van de privacyverklaring (/privacy op elke site). Platte
// data i.p.v. markdown, zodat zowel het React-component (Docusaurus-sites)
// als de Svelte-pagina (sites/home) dezelfde tekst renderen zonder dat er een
// markdown-parser-dependency bij hoeft — beide kanten doen gewoon map()/each
// over `sections`.
//
// LET OP vóór publicatie: vul controller.schoolName en controller.contactEmail
// hieronder in (nu placeholders) — zie stap 6 van de handmatige stappen in het
// implementatieplan.

const { MATOMO_RETENTION_DAYS } = require('./matomo');

const PRIVACY_CONTENT = {
  lastUpdated: '2026-08-15',
  retentionDays: MATOMO_RETENTION_DAYS,
  controller: {
    schoolName: 'Coderius Education',
    contactEmail: 'info@coderius.nl',
  },
  sections: [
    {
      id: 'intro',
      heading: 'Privacyverklaring',
      paragraphs: [
        'Deze verklaring gaat over de cursussites van Coderius (alle *.coderius.nl-domeinen). We gebruiken Matomo, een zelf gehost statistiekenprogramma, om te zien hoe deze sites gebruikt worden. Hieronder lees je welke gegevens dat oplevert, met welk doel, hoe lang we ze bewaren, en hoe je bezwaar kunt maken.',
      ],
    },
    {
      id: 'geen-toestemming-nodig',
      heading: 'Waarom je geen toestemming hoeft te geven',
      paragraphs: [
        'Matomo staat op onze eigen server en plaatst geen cookies. Zonder cookies is er geen profiel dat je tussen bezoeken herkent, en daarom geldt de wettelijke uitzondering: we hoeven geen toestemming te vragen voor deze statistieken.',
        'Die uitzondering betekent niet dat we je niet hoeven te informeren, en ook niet dat we onbeperkt met de gegevens mogen doen wat we willen. Deze pagina is die informatie, en verderop staat ook de grondslag waarop we de gegevens verwerken.',
      ],
    },
    {
      id: 'doel',
      heading: 'Waarvoor gebruiken we de gegevens',
      paragraphs: [
        'We gebruiken Matomo om te zien welke pagina’s bezocht worden en welk lesmateriaal goed werkt. Dat helpt ons de cursussen te verbeteren.',
      ],
    },
    {
      id: 'welke-gegevens',
      heading: 'Welke gegevens verzamelen we',
      paragraphs: ['Matomo registreert per bezoek een beperkte set technische gegevens:'],
      list: [
        'welke pagina’s je bezoekt en op welk tijdstip',
        'een geanonimiseerd IP-adres (het laatste deel wordt gemaskeerd), waaruit hooguit een globale regio af te leiden is',
        'het type browser en besturingssysteem',
        'op pagina’s met een code-editor: of je de oefening hebt aangepast, gedraaid of teruggezet naar de startcode',
        'op pagina’s met uitklapbare tips of antwoorden: welk blok je openklapt',
      ],
      trailingParagraphs: [
        'De code die je in een oefening typt blijft in je browser en gaat nooit mee naar de statistieken. Van een oefening tellen we alleen dát je hem gebruikt hebt, zodat we zien welke opdrachten gemaakt worden en welke blijven liggen.',
        'Bij een uitklapblok registreren we alleen wélk blok het was, bijvoorbeeld het antwoord bij Make op deze les. Niet wat erin staat, en niet of je de opdracht goed had.',
        'We verzamelen geen naam, e-mailadres of ander persoonlijk gegeven, en combineren de statistieken niet met andere diensten of trackers buiten Matomo.',
      ],
    },
    {
      id: 'bewaartermijn',
      heading: 'Hoe lang bewaren we de gegevens',
      paragraphs: [
        `We bewaren de ruwe bezoekgegevens ${MATOMO_RETENTION_DAYS} dagen. Daarna verwijderen we ze automatisch; wat overblijft zijn alleen samengevatte, geaggregeerde statistieken (bijvoorbeeld: "deze pagina had in maart 400 bezoeken") waaruit geen individueel bezoek meer te herleiden is.`,
      ],
    },
    {
      id: 'grondslag',
      heading: 'Op welke grondslag verwerken we dit',
      paragraphs: [
        'De AVG vereist een grondslag voor elke verwerking, ook als er geen toestemming nodig is voor de cookies zelf. Wij baseren ons op gerechtvaardigd belang: we willen weten of ons lesmateriaal werkt, zonder leerlingen individueel te volgen.',
        'Om dat belang te laten opwegen tegen jouw privacy houden we de verwerking beperkt: geen cookies, een geanonimiseerd IP-adres, een korte bewaartermijn, geen gegevens die we delen met derden, en geen gebruik voor iets anders dan het verbeteren van de cursussen.',
      ],
    },
    {
      id: 'delen',
      heading: 'Delen we gegevens met anderen',
      paragraphs: [
        'Nee. Matomo draait op onze eigen server; de gegevens gaan niet naar Google, Meta of een andere externe partij, en we verkopen of delen ze niet.',
      ],
    },
    {
      id: 'bezwaar',
      heading: 'Bezwaar maken',
      paragraphs: [
        'Je kunt op elk moment bezwaar maken tegen deze statistieken. Onderstaande schakelaar onthoudt je keuze in je browser, ook zonder cookie.',
      ],
    },
    {
      id: 'contact',
      heading: 'Contact',
      paragraphs: ['Vragen over deze privacyverklaring of over hoe we met gegevens omgaan?'],
    },
    {
      id: 'wijzigingen',
      heading: 'Wijzigingen',
      paragraphs: [
        'We passen deze verklaring aan als de manier waarop we Matomo gebruiken verandert.',
      ],
    },
  ],
};

module.exports = { PRIVACY_CONTENT };
