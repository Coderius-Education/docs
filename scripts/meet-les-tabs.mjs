// Meet per les en per tabblad of het op één scherm past.
//
//   node scripts/meet-les-tabs.mjs [site-id] [--json] [--les=<stuk van het pad>] [--tegelijk=4]
//
// De les-tabbladen (packages/shared/plugins/les-tabs.js) halen de lange
// pagina weg, maar een tabblad met een oefenveld of veel theorie kan nog
// steeds langer zijn dan het scherm. Of het past, hangt aan de layout en is
// alleen in een browser te meten. Dit script serveert de gebouwde site onder
// zijn eigen pad, opent in Chromium elke les met tabbladen, klikt elk
// tabblad aan (en in een tabblad met stappen elke stap) en meet op 1280×720
// en 1366×768:
//
//   over    hoeveel pixels de onderkant van het paneel onder de rand van het
//           scherm valt (0 of minder: het paneel past);
//   pagina  hoeveel pixels de hele pagina hoger is dan het scherm, met de
//           knoppen naar de vorige en volgende les en de footer erbij.
//
// Twee dingen meet het erbij, omdat ze er bij een review doorheen glipten:
//
//   tabrij     op hoeveel regels de rij tabbladen staat. Een tweede regel
//              kost elk paneel veertig pixels; in acht lessen stond hij er.
//   zijwaarts  hoeveel pixels de pagina breder is dan het scherm, ook op een
//              telefoon (390×800). Daar hoeft een scherm niet te passen,
//              maar zijwaarts schuiven hoort nergens: een verborgen kop
//              maakte 18 schermen tot 236 pixels te breed.
//
// Met `--les=klassen/15f` meet het alleen de lessen met dat stuk in hun pad
// (de vlag mag vaker): na een wijziging in één les hoeft niet de hele cursus
// opnieuw. Het opent vier lessen tegelijk (`--tegelijk=1` voor één): de 150
// pagina's van de python-cursus kostten na elkaar zestien minuten.
//
// Handmatig, niet in CI: het is een meting voor een auteur, geen controle.
// Eerst bouwen: `pnpm --filter ./sites/informatica/web build`.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const { SITES_BY_ID, siteDir } = require('../packages/shared/sites.js');

const argumenten = process.argv.slice(2);
const SITE = argumenten.find((a) => !a.startsWith('--')) ?? 'web';
const ALS_JSON = argumenten.includes('--json');
const waarden = (vlag) =>
  argumenten.filter((a) => a.startsWith(`--${vlag}=`)).map((a) => a.slice(vlag.length + 3));
const ALLEEN = waarden('les');
const TEGELIJK = Math.max(1, Number(waarden('tegelijk')[0] ?? 4));
const BUILD = resolve(join(siteDir(SITE), 'build'));
const BASIS = `/${SITES_BY_ID[SITE].path}/`;
const SCHERMEN = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  // Op een telefoon scrolt de leerling; hier telt alleen zijwaarts.
  { width: 390, height: 800, telefoon: true },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function serveer() {
  const server = createServer((req, res) => {
    const pad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!pad.startsWith(BASIS)) {
      res.writeHead(404).end();
      return;
    }
    const rel = pad.slice(BASIS.length);
    const kandidaten = [rel, `${rel}.html`, join(rel, 'index.html')].map((p) => join(BUILD, p));
    const bestand = kandidaten.find((p) => existsSync(p) && statSync(p).isFile());
    if (!bestand) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(bestand)] ?? 'application/octet-stream' });
    res.end(readFileSync(bestand));
  });
  return new Promise((klaar) => server.listen(0, '127.0.0.1', () => klaar(server)));
}

/** De gebouwde pagina's met tabbladen, als pad onder de site. */
function lessen() {
  const uit = [];
  const loop = (map) => {
    for (const naam of readdirSync(map).sort()) {
      const pad = join(map, naam);
      if (statSync(pad).isDirectory()) loop(pad);
      else if (naam === 'index.html' && readFileSync(pad, 'utf8').includes('data-les-tabs'))
        uit.push(relative(BUILD, map));
    }
  };
  loop(join(BUILD, 'docs'));
  return ALLEEN.length ? uit.filter((les) => ALLEEN.some((stuk) => les.includes(stuk))) : uit;
}

if (!existsSync(BUILD)) {
  console.error(`Geen build in ${BUILD}. Bouw de site eerst.`);
  process.exit(2);
}

const server = await serveer();
const adres = `http://127.0.0.1:${server.address().port}${BASIS}`;
// Met CHROMIUM=<pad> een Chromium die al op de computer staat, voor als de
// browser van deze Playwright-versie niet is geïnstalleerd.
const browser = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
);
const rijen = [];
const tabrijen = [];
let kolomBreedte = null;

async function meetLes(les) {
  for (const scherm of SCHERMEN) {
    // Een verse context per les: bewaard werk in een oefenveld verandert de
    // hoogte van het veld.
    const context = await browser.newContext({
      viewport: { width: scherm.width, height: scherm.height },
    });
    const pagina = await context.newPage();
    await pagina.goto(`${adres}${les}`);
    await pagina.waitForSelector('[role=tab]');
    kolomBreedte ??= await pagina.evaluate(() => {
      const kolom = document.querySelector('[class*="docItemCol"]');
      return kolom ? Math.round((100 * kolom.clientWidth) / kolom.parentElement.clientWidth) : null;
    });
    if (!scherm.telefoon) {
      const regels = await pagina.evaluate(
        () =>
          new Set(
            [...document.querySelectorAll('[data-tab]')].map((t) =>
              Math.round(t.getBoundingClientRect().top),
            ),
          ).size,
      );
      tabrijen.push({ les, scherm: `${scherm.width}x${scherm.height}`, regels });
    }
    const tabs = await pagina.locator('[data-tab]').all();
    for (const tab of tabs) {
      const id = await tab.getAttribute('data-tab');
      const label = (await tab.innerText()).trim();
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
      // Een oefenveld is klaar als de editor staat; daarna nog even voor de
      // hoogte die het voorbeeld zelf meldt.
      await pagina
        .waitForFunction(
          (id) => {
            const paneel = document.querySelector(`[data-les-tab="${CSS.escape(id)}"]`);
            return [...paneel.querySelectorAll('[data-zaad]')].every((v) =>
              v.querySelector('.cm-editor'),
            );
          },
          id,
          { timeout: 10_000 },
        )
        .catch(() => {});
      // Een tabblad met stappen meet per stap; zonder stappen één keer.
      const paneel = pagina.locator(`[data-les-tab="${id}"]`);
      const stappen = await paneel.locator('[data-stap]').all();
      for (const stap of stappen.length ? stappen : [null]) {
        if (stap) {
          await stap.scrollIntoViewIfNeeded();
          await stap.click();
        }
        await pagina.waitForTimeout(scherm.telefoon ? 50 : 400);
        await pagina.evaluate(() => window.scrollTo(0, 0));
        const maat = await pagina.evaluate((id) => {
          const paneel = document.querySelector(`[data-les-tab="${CSS.escape(id)}"]`);
          const r = paneel.getBoundingClientRect();
          return {
            over: Math.round(r.bottom - window.innerHeight),
            boven: Math.round(r.top),
            pagina: document.documentElement.scrollHeight - window.innerHeight,
            zijwaarts: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
            velden: paneel.querySelectorAll('[data-zaad]').length,
          };
        }, id);
        rijen.push({
          les,
          tab: stap ? `${label} › ${(await stap.innerText()).replace(/\s+/g, ' ').trim()}` : label,
          scherm: `${scherm.width}x${scherm.height}`,
          telefoon: Boolean(scherm.telefoon),
          ...maat,
        });
      }
    }
    await context.close();
  }
}

// Een paar lessen tegelijk, elk in zijn eigen context. De uitkomst staat
// daarna weer in de volgorde van de lessen.
const wachtrij = lessen();
const volgorde = new Map(wachtrij.map((les, i) => [les, i]));
await Promise.all(
  Array.from({ length: TEGELIJK }, async () => {
    for (let les = wachtrij.shift(); les; les = wachtrij.shift()) await meetLes(les);
  }),
);
const opVolgorde = (a, b) => volgorde.get(a.les) - volgorde.get(b.les);
rijen.sort(opVolgorde);
tabrijen.sort(opVolgorde);

await browser.close();
server.close();

const naam = (les) => les.replace(/^docs\//, '');
if (ALS_JSON) {
  console.log(JSON.stringify({ kolomBreedte, rijen, tabrijen }, null, 2));
} else {
  for (const { width, height } of SCHERMEN.filter((s) => !s.telefoon)) {
    const scherm = `${width}x${height}`;
    const deze = rijen.filter((r) => r.scherm === scherm);
    const past = deze.filter((r) => r.over <= 0);
    console.log(`\n## ${scherm}: ${past.length} van ${deze.length} schermen passen\n`);
    console.log('| Les | Tabblad of stap | Velden | Te lang (px) |');
    console.log('|---|---|---:|---:|');
    for (const r of deze.filter((r) => r.over > 0).sort((a, b) => b.over - a.over))
      console.log(`| ${naam(r.les)} | ${r.tab} | ${r.velden} | ${r.over} |`);
    const dubbel = tabrijen.filter((t) => t.scherm === scherm && t.regels > 1);
    console.log(
      dubbel.length
        ? `\nDe rij tabbladen staat op meer dan één regel in: ${dubbel.map((t) => naam(t.les)).join(', ')}.`
        : '\nDe rij tabbladen staat in elke les op één regel.',
    );
  }
  const breed = rijen.filter((r) => r.zijwaarts > 0);
  console.log(`\n## Zijwaarts schuiven: ${breed.length} schermen\n`);
  for (const r of breed.sort((a, b) => b.zijwaarts - a.zijwaarts))
    console.log(`- ${naam(r.les)} | ${r.tab} | ${r.scherm}: ${r.zijwaarts} px te breed`);
  console.log(`\nDe les gebruikt ${kolomBreedte}% van de breedte naast de lessenlijst.`);
}
