// Centrale registry van alle Coderius-cursussen — de enige bron van waarheid
// voor cross-site links (footer, navbar-dropdown, Voorkennis-callout en de
// leerlijn-overzichtspagina). CommonJS zodat zowel de config-factory (require)
// als React-componenten (import) hem kunnen gebruiken.
//
// Per cursus:
//   id          stabiele sleutel (gebruikt door <Voorkennis site="...">)
//   label       weergavenaam
//   url         productie-URL (subdomein); bepaalt ook welke site "huidig" is
//   description korte omschrijving (footer/overzicht)
//   requires    leerlijn-voorkennis: cursussen waarop deze voortbouwt
//
// De volgorde hieronder is de globale leerlijn-volgorde (gebruikt door het
// /cursussen-overzicht).

const SITES = [
  {
    id: 'editor',
    label: 'VS Code & Git',
    url: 'https://editor.coderius.nl',
    description: 'Werken met een code-editor, VS Code en Git.',
    requires: [],
  },
  {
    id: 'python',
    label: 'Python',
    url: 'https://python.coderius.nl',
    description: 'Leer stap voor stap programmeren in Python.',
    requires: [],
  },
  {
    id: 'web',
    label: 'Webontwikkeling',
    url: 'https://web.coderius.nl',
    description: 'Maak je eerste website met HTML, CSS en JavaScript.',
    requires: [],
  },
  {
    id: 'play',
    label: 'Python Games',
    url: 'https://play.coderius.nl',
    description: 'Maak games met Python en pygame.',
    requires: ['python'],
  },
  {
    id: 'algorithms',
    label: 'Algoritmes',
    url: 'https://algoritmes.coderius.nl',
    description: 'Leer algoritmes door ze zelf uit te voeren.',
    requires: ['python'],
  },
  {
    id: 'fullstack',
    label: 'Fullstack (FastAPI)',
    url: 'https://fullstack.coderius.nl',
    description: 'Voeg een Python back-end toe aan je website met FastAPI.',
    requires: ['python', 'web'],
  },
  {
    id: 'robotica',
    label: 'Robotica',
    url: 'https://robotica.coderius.nl',
    description: 'Stuur sensoren en motoren aan met MicroPython.',
    requires: ['python'],
  },
  {
    id: 'embedded',
    label: 'Embedded',
    url: 'https://embedded.coderius.nl',
    description: 'Programmeer microcontrollers: van Arduino tot STM32.',
    requires: [],
  },
  {
    id: 'godot',
    label: 'Godot',
    url: 'https://godot.coderius.nl',
    description: 'Bouw je eerste 2D game in Godot 4.',
    requires: [],
  },
  {
    id: 'ctf',
    label: 'Capture The Flag',
    url: 'https://ctf.coderius.nl',
    description: 'Leer cybersecurity door CTF-challenges op te lossen.',
    requires: ['python', 'web'],
  },
  {
    id: 'dvwa',
    label: 'DVWA Websecurity',
    url: 'https://dvwa.coderius.nl',
    description: 'Oefen websecurity in een veilige DVWA-omgeving.',
    requires: ['web'],
  },
  {
    id: 'ide',
    label: 'Online Editor',
    url: 'https://ide.coderius.nl',
    description: 'Schrijf en draai code direct in je browser.',
    requires: [],
  },
];

const SITES_BY_ID = Object.fromEntries(SITES.map((s) => [s.id, s]));

// Normaliseer een url voor vergelijking (trailing slash weg).
function normalizeUrl(url) {
  return (url || '').replace(/\/+$/, '');
}

// Vind de cursus die hoort bij een gegeven site-url (siteConfig.url).
function siteByUrl(url) {
  const norm = normalizeUrl(url);
  return SITES.find((s) => normalizeUrl(s.url) === norm);
}

module.exports = {SITES, SITES_BY_ID, siteByUrl, normalizeUrl};
