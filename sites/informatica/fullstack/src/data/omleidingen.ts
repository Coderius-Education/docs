// Lessen die verhuisd zijn, met hun oude adres. createConfig zet op elk oud
// adres een pagina die doorstuurt (packages/shared/plugins/omleidingen.js).
// omleidingen.test.ts eist dat elk doel een pagina is en elk oud adres niet meer.

export type Omleiding = { van: string; naar: string };

// Elke categorie van de FastAPI-route kreeg een eigen map. Daarvoor stonden
// alle lessen los in docs/FastAPI/. Per map de lessen die erin kwamen; SqliteDict
// op een rij heette sqlitedict.mdx en werd sqlitedict/op-een-rij.mdx.
const mappen: Record<string, (string | [string, string])[]> = {
  'eerste-server': ['installatie', 'eerste_endpoint', 'verzoek-eerste', 'devtools-netwerk'],
  html: ['html_tonen', 'html_bestanden', 'links', 'static_files', 'afbeeldingen', 'verzoek-static'],
  formulieren: ['templates', 'get_vs_post', 'forms', 'post_met_templates'],
  sqlitedict: ['database', 'database-sleutels', 'database-waarden', ['sqlitedict', 'op-een-rij']],
  gastenboek: ['post_naar_database', 'lijst_tonen', 'redirect', 'detailpagina', 'verzoek-get'],
  accounts: ['registreren', 'inloggen'],
  'zonder-herladen': ['htmx', 'htmx-overzicht', 'verzoek-htmx'],
  'in-de-browser': ['javascript', 'devtools-console', 'server-of-browser'],
  onthouden: ['cookies', 'sessies', 'cookie-of-sessie', 'verzoek-sessie'],
  afronden: ['foutpagina', 'hoe-een-verzoek-werkt', 'laat-het-zien'],
};

export const verhuisd: Omleiding[] = Object.entries(mappen).flatMap(([map, lessen]) =>
  lessen.map((les) => {
    const [oud, nieuw] = typeof les === 'string' ? [les, les] : les;
    return { van: `/docs/FastAPI/${oud}`, naar: `/docs/FastAPI/${map}/${nieuw}` };
  }),
);

export const omleidingen: Omleiding[] = [
  // De eindopdracht Jouw eigen project is uit de cursus gehaald; het oude
  // adres komt uit bij het eind van de basis.
  { van: '/docs/FastAPI/jouw-project', naar: '/docs/FastAPI/accounts/inloggen' },
  // Het diagram van één formulier staat sinds de herindeling op dezelfde
  // pagina als dat van één klik.
  { van: '/docs/FastAPI/verzoek-post', naar: '/docs/FastAPI/gastenboek/verzoek-get#een-formulier' },
  ...verhuisd,
];
