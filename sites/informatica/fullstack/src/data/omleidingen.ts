// Lessen die verhuisd zijn, met hun oude adres. createConfig zet op elk oud
// adres een pagina die doorstuurt (packages/shared/plugins/omleidingen.js).
// omleidingen.test.ts eist dat elk doel een pagina is en elk oud adres niet meer.

export type Omleiding = { van: string; naar: string };

// Tot oktober 2026 stonden alle lessen los in docs/FastAPI/; toen kreeg elke
// categorie een eigen map. Hier staan alleen de adressen die toen live waren,
// met de les waar ze nu heen gaan. Een gesplitste les stuurt door naar zijn
// eerste deel: post_naar_database naar Een formulier opslaan, en lijst_tonen,
// redirect en detailpagina naar de les die de oude naam hield.
const losseLessen: Record<string, string> = {
  installatie: 'eerste-server/installatie',
  eerste_endpoint: 'eerste-server/eerste_endpoint',
  'verzoek-eerste': 'eerste-server/verzoek-eerste',
  'devtools-netwerk': 'eerste-server/devtools-netwerk',
  html_tonen: 'paginas/html_tonen',
  html_bestanden: 'paginas/html_bestanden',
  links: 'paginas/links',
  static_files: 'css-en-afbeeldingen/static_files',
  afbeeldingen: 'css-en-afbeeldingen/afbeeldingen',
  'verzoek-static': 'css-en-afbeeldingen/verzoek-static',
  templates: 'formulieren/templates',
  get_vs_post: 'formulieren/forms',
  forms: 'formulieren/forms',
  post_met_templates: 'formulieren/post_met_templates',
  database: 'sqlitedict/database',
  post_naar_database: 'berichten-opslaan/naam-opslaan',
  lijst_tonen: 'berichten-tonen/lijst_tonen',
  redirect: 'berichten-opslaan/redirect',
  detailpagina: 'berichten-tonen/detailpagina',
  'verzoek-get': 'accounts/verzoek-get',
  htmx: 'zonder-herladen/htmx',
  'htmx-overzicht': 'zonder-herladen/htmx-overzicht',
  'verzoek-htmx': 'zonder-herladen/verzoek-htmx',
  javascript: 'in-de-browser/javascript',
  'devtools-console': 'in-de-browser/devtools-console',
  'server-of-browser': 'in-de-browser/server-of-browser',
  cookies: 'onthouden/cookies',
  sessies: 'onthouden/sessies',
  'cookie-of-sessie': 'onthouden/cookie-of-sessie',
  'verzoek-sessie': 'onthouden/verzoek-sessie',
  'hoe-een-verzoek-werkt': 'afronden/hoe-een-verzoek-werkt',
  'laat-het-zien': 'afronden/laat-het-zien',
};

export const verhuisd: Omleiding[] = Object.entries(losseLessen).map(([oud, nieuw]) => ({
  van: `/docs/FastAPI/${oud}`,
  naar: `/docs/FastAPI/${nieuw}`,
}));

export const omleidingen: Omleiding[] = [
  // De eindopdracht Jouw eigen project is uit de cursus gehaald; het oude
  // adres komt uit bij het eind van de basis.
  { van: '/docs/FastAPI/jouw-project', naar: '/docs/FastAPI/accounts/verzoek-get' },
  // Het diagram van één formulier staat sinds de herindeling op dezelfde
  // pagina als dat van één klik.
  {
    van: '/docs/FastAPI/verzoek-post',
    naar: '/docs/FastAPI/accounts/verzoek-get#een-formulier',
  },
  ...verhuisd,
];
