// Meet per les en per tabblad of het op één scherm past.
//
//   node scripts/meet-les-tabs.mjs [site-id] [--json] [--les=<stuk van het pad>] [--tegelijk=4] [--klik] [--open] [--verborgen-balken] [--bronnen=changed.json] [--streng]
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
//   stapregels op hoeveel regels de rij stappen van het tabblad staat.
//   volgendeLes  of de link naar de volgende les in beeld staat terwijl het
//              scherm zelf een knop Volgende heeft: die slaat de rest van de
//              les over.
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
// Met `--klik` doet het in elk scherm met een Python-veld ook wat een leerling
// doet: het klikt op Uitvoeren en daarna op Stap voor stap, en meet na elke
// klik opnieuw (`naUitvoeren`, `naStappen`). In een scherm met een
// voorspelvraag kiest het een antwoord na het andere tot het goede, en meet
// het na elk antwoord (`naAntwoord`). Een scherm dat past tot je iets
// aanklikt, past niet: Stap voor stap stond eerst onder het veld en maakte
// het scherm tot 1634 pixels te lang. Een veld met `input()` slaat het over
// (dat wacht op een antwoord), en een veld dat na een kwartminuut nog draait
// meldt het op stderr. Dit kost per les het laden van Python erbij.
//
// Met `--open` klapt het in elk scherm elk uitklapblok open dat er te zien
// is (een tip, een antwoord, de voorkennis), eerst elk los en daarna alle
// tegelijk, en meet het na elk blok opnieuw (`naOpen` met de summary van het
// ergste blok in `naOpenBlok`, en `naAllesOpen`). Het klikt op de summary,
// zoals een leerling: het <details> van Docusaurus klapt met een animatie
// open, en een blok dat alleen het attribuut `open` krijgt, blijft leeg.
// In Linux was met het antwoord open 9 van de 10 opdrachten te lang.
//
// Schuifbalken. Playwright start Chromium headless met `--hide-scrollbars`:
// dan heeft geen enkel vak een schuifbalk. Een schoolcomputer met Windows
// heeft klassieke schuifbalken die ruimte innemen: een rij stappen die
// zijwaarts schuift (een telefoon, de smalle kolom naast de oefenterminal
// van Linux) is daar vijftien pixels hoger, en een codevak dat schuift ook.
// Dit script laat die vlag daarom weg (`ignoreDefaultArgs`). Chromium op
// Linux tekent dan zijn klassieke schuifbalk van 15 pixels: even dik als die
// van Chrome en Edge op Windows 11 (de Fluent-schuifbalk, 15 pixels), en
// twee pixels dunner dan de oude van Windows 10 (17). Een CSS-regel als
// `::-webkit-scrollbar { height: 15px }` was geen goede vervanging: die
// verandert ook de dunne schuifbalken die Infima zelf opmaakt
// (`.thin-scrollbar`, de lessenlijst), en een vak met `scrollbar-width`
// negeert hem. Op een telefoon (390×800) liggen de schuifbalken over de
// inhoud heen; daar emuleert het script een telefoon (`isMobile`, `hasTouch`),
// en dan tekent Chromium ze ook zo. Omdat de schuifbalk van de pagina nu
// ruimte inneemt, telt het script met de maat van het venster zonder
// schuifbalken (`documentElement.clientWidth` en `clientHeight`), niet met
// `innerWidth`. Met `--verborgen-balken` meet het zoals vroeger, zonder
// schuifbalken: om een meting van voor deze keuze na te spelen.
//
// Eerst bouwen: `pnpm --filter ./sites/informatica/web build`.
//
// In CI (job `schermen`) is het een controle: met `--bronnen=changed.json`
// meet het alleen de lessen die de wijziging raakt (packages/shared/
// meet-selectie.js), en met `--streng` stopt het met afsluitcode 1 als een
// scherm op 1280×720 of 1366×768 niet past, een pagina zijwaarts schuift,
// de rij tabbladen op twee regels staat, code zijwaarts is afgesneden of een
// id dubbel is. Een les die bewust niet past, staat met een reden in
// scripts/meet-les-tabs-uitzonderingen.json. Een open uitklapblok en een
// klik (`--open`, `--klik`) tellen daar niet: een open antwoord mag het
// scherm langer maken.

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
const KLIK = argumenten.includes('--klik');
const OPEN = argumenten.includes('--open');
const VERBORGEN_BALKEN = argumenten.includes('--verborgen-balken');
const STRENG = argumenten.includes('--streng');
const BRONNEN = waarden('bronnen')[0];
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
  // Voor --klik: Pyodide compileert zijn wasm alleen als stroom met dit type.
  '.wasm': 'application/wasm',
  '.mjs': 'text/javascript',
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
/** Mappen in de build waar geen lessen staan, en die groot zijn. */
const GEEN_LESSEN = ['assets', 'img', 'pyodide', 'oud'];

function lessen(merk = 'data-les-tabs') {
  const uit = [];
  const loop = (map) => {
    for (const naam of readdirSync(map).sort()) {
      const pad = join(map, naam);
      if (statSync(pad).isDirectory()) {
        if (!GEEN_LESSEN.includes(relative(BUILD, pad))) loop(pad);
      } else if (naam === 'index.html') {
        const html = readFileSync(pad, 'utf8');
        if (html.includes(merk)) uit.push(relative(BUILD, map));
      }
    }
  };
  // De hele build, niet alleen docs/: robotica heeft de Lego-auto en de
  // Golfbot in eigen docs-plugins, onder lego_auto/ en golfbot/.
  loop(BUILD);
  const gekozen = KEUZE ? uit.filter((les) => KEUZE.has(les)) : uit;
  return ALLEEN.length
    ? gekozen.filter((les) => ALLEEN.some((stuk) => les.includes(stuk)))
    : gekozen;
}

/** Alle lessen in de build die gemeten worden: met tabbladen, of als één scherm. */
function alleLessen() {
  const uit = [];
  const loop = (map) => {
    for (const naam of readdirSync(map).sort()) {
      const pad = join(map, naam);
      if (statSync(pad).isDirectory()) {
        if (!GEEN_LESSEN.includes(relative(BUILD, pad))) loop(pad);
      } else if (naam === 'index.html') {
        const html = readFileSync(pad, 'utf8');
        if (html.includes('data-les-tabs') || html.includes('data-les-zonder-tabs'))
          uit.push(relative(BUILD, map));
      }
    }
  };
  loop(BUILD);
  return uit;
}

if (!existsSync(BUILD)) {
  console.error(`Geen build in ${BUILD}. Bouw de site eerst.`);
  process.exit(2);
}

// Met --bronnen: alleen de lessen die de wijziging raakt.
let KEUZE = null;
if (BRONNEN) {
  const { lessenVoorMeting } = require('../packages/shared/meet-selectie.js');
  const keuze = lessenVoorMeting({
    plan: JSON.parse(readFileSync(BRONNEN, 'utf8')),
    siteMap: siteDir(SITE),
    lessen: alleLessen(),
    leesBron: (pad) => (existsSync(pad) ? readFileSync(pad, 'utf8') : null),
  });
  console.error(
    keuze.alles
      ? `Alle ${keuze.lessen.length} lessen: ${keuze.reden}.`
      : `${keuze.lessen.length} lessen: ${keuze.reden}.`,
  );
  for (const pad of keuze.nietGevonden)
    console.error(`- ${pad}: geen les met tabbladen of één scherm in de build, niets te meten`);
  if (keuze.lessen.length === 0) process.exit(0);
  KEUZE = new Set(keuze.lessen);
}

const server = await serveer();
const adres = `http://127.0.0.1:${server.address().port}${BASIS}`;
// Met CHROMIUM=<pad> een Chromium die al op de computer staat, voor als de
// browser van deze Playwright-versie niet is geïnstalleerd.
// Zonder `--hide-scrollbars`: klassieke schuifbalken, zoals op een
// schoolcomputer met Windows (zie boven).
// Zonder CHROMIUM de volledige Chromium (`channel: 'chromium'`, de nieuwe
// headless), niet de headless shell die Playwright anders start: die tekent
// tekst en schuifbalken net anders. In CI viel daarmee in web script-tag 27
// px code af die in Chromium zelf paste.
const browser = await chromium.launch({
  ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : { channel: 'chromium' }),
  ...(VERBORGEN_BALKEN ? {} : { ignoreDefaultArgs: ['--hide-scrollbars'] }),
});
/** Een context op de maat van een scherm. Een telefoon heeft schuifbalken
 *  die over de inhoud liggen en geen muis. */
async function nieuweContext(scherm) {
  const context = await browser.newContext({
    viewport: { width: scherm.width, height: scherm.height },
    ...(scherm.telefoon ? { isMobile: true, hasTouch: true } : {}),
  });
  // Alleen de eigen server: een aanvraag naar buiten (de statistieken, een
  // lettertype) bleef op de runner van CI hangen, en dan haalde een pagina
  // zijn `load` niet binnen dertig seconden. Lokaal weigerde de proxy hem
  // meteen. Wat de les zelf nodig heeft, staat in de build.
  await context.route(
    (url) => url.hostname !== '127.0.0.1',
    (route) => route.abort(),
  );
  return context;
}
const rijen = [];
const tabrijen = [];
const dubbeleIds = [];
let kolomBreedte = null;

// De onderkant van een scherm: die van het paneel, of die van het oefenveld
// dat naast de les staat (<LesNaast>, de oefenterminal van Linux) als dat
// lager komt. Als tekst, omdat de functie in de pagina draait.
const ONDERKANT = `(paneel) => {
  const r = paneel.getBoundingClientRect();
  const naast = [...paneel.parentElement.children].find((k) => k.hasAttribute('data-les-naast'));
  const n = naast?.getBoundingClientRect();
  return n && n.height > 0 && n.left >= r.right - 1 ? Math.max(r.bottom, n.bottom) : r.bottom;
}`;

const over = (pagina, id) =>
  pagina.evaluate(
    ([id, onderkant]) => {
      const paneel = document.querySelector(`[data-les-tab="${CSS.escape(id)}"]`);
      return Math.round(
        new Function(`return ${onderkant}`)()(paneel) - document.documentElement.clientHeight,
      );
    },
    [id, ONDERKANT],
  );

// Een knop van het veld, niet de knop van een stap: pixel-art stap 5 heeft
// een stap die zelf "Stap voor stap" heet.
const KNOP = 'button:visible:not([role=tab])';

const binnen = (belofte, ms) =>
  Promise.race([
    belofte,
    new Promise((_, nee) => setTimeout(() => nee(new Error('duurt te lang')), ms)),
  ]);

/**
 * Klikt in het scherm dat open staat op Uitvoeren en op Stap voor stap, en
 * meet na elke klik. Leeg als er geen Python-veld staat of het veld op een
 * antwoord zou wachten.
 */
async function meetNaKlik(pagina, paneel, id) {
  const uitvoeren = paneel.locator(KNOP, { hasText: /Uitvoeren|Laden/ }).first();
  if ((await uitvoeren.count()) === 0) return {};
  const code = await paneel.locator('textarea:visible').first().inputValue();
  if (/\binput\s*\(/.test(code)) return {};
  const klaar = () =>
    pagina.waitForFunction(
      (id) => {
        const paneel = document.querySelector(`[data-les-tab="${CSS.escape(id)}"]`);
        const knop = [...paneel.querySelectorAll('button')].find(
          (k) => k.offsetParent && /Uitvoeren/.test(k.textContent),
        );
        return knop && !knop.disabled;
      },
      id,
      { timeout: 60_000 },
    );
  await klaar();
  await uitvoeren.click();
  await binnen(klaar(), 15_000);
  await pagina.waitForTimeout(400);
  const naUitvoeren = await binnen(over(pagina, id), 15_000);
  await paneel.locator(KNOP, { hasText: 'Stap voor stap' }).first().click();
  const sluiten = paneel.locator(KNOP, { hasText: 'Sluiten' }).first();
  await sluiten.waitFor({ timeout: 15_000 });
  await pagina.waitForTimeout(300);
  const naStappen = await binnen(over(pagina, id), 15_000);
  await sluiten.click();
  return { naUitvoeren, naStappen };
}

/**
 * Beantwoordt de vraag in het scherm dat open staat zoals een leerling: een
 * antwoord na het andere tot het goede, en meet na elk antwoord. Een scherm
 * met een vraag past tot je antwoordt: dan komen de terugkoppeling en de
 * uitleg erbij. In fullstack viel bij twintig van de dertig vragen de uitleg
 * of de knop Volgende daarna onder de rand.
 */
async function meetNaAntwoord(pagina, paneel, id) {
  const vraag = paneel.locator('[data-voorspel]:visible').first();
  if ((await vraag.count()) === 0) return {};
  let naAntwoord = null;
  // Telkens het eerste antwoord dat nog niet is geprobeerd. Zijn alle foute
  // geweest, dan vallen de eerdere weg en staat het goede er nog: tellen op
  // plek gaat dan mis.
  const open = vraag.locator('fieldset button:not(:has-text("Niet goed"))');
  const keuzes = await vraag.locator('fieldset button').count();
  for (let i = 0; i < keuzes && (await open.count()) > 0; i++) {
    await open.first().click();
    await pagina.waitForTimeout(250);
    await pagina.evaluate(() => window.scrollTo(0, 0));
    naAntwoord = Math.max(naAntwoord ?? Number.NEGATIVE_INFINITY, await over(pagina, id));
    if ((await vraag.getAttribute('data-voorspel')) === 'goed') break;
  }
  return naAntwoord === null ? {} : { naAntwoord };
}

/** Wacht tot een uitklapblok (een ElementHandle) helemaal open of dicht is. Het <details> van
 *  Docusaurus klapt met een animatie: open is het pas als de hoogte van de
 *  inhoud weer `auto` is, dicht pas als het attribuut `open` weg is. */
const klaarGeklapt = (blok, open) =>
  blok
    .evaluate(
      (d, open) =>
        new Promise((klaar) => {
          const eind = Date.now() + 3000;
          const kijk = () => {
            const inhoud = [...d.children].find((k) => k.tagName !== 'SUMMARY');
            const hoogte = inhoud?.style.height ?? '';
            const docusaurus = d.hasAttribute('data-collapsed');
            const af = open
              ? d.open &&
                (!docusaurus ||
                  (d.dataset.collapsed === 'false' && (hoogte === '' || hoogte === 'auto')))
              : !d.open;
            if (af || Date.now() > eind) klaar(af);
            else setTimeout(kijk, 50);
          };
          kijk();
        }),
      open,
    )
    .catch(() => false);

/** Klikt op de summary van een uitklapblok en wacht tot het open of dicht is. */
async function klap(blok, open) {
  if ((await blok.evaluate((d) => d.open)) === open) return;
  const summary = await blok.$(':scope > summary');
  if (!summary) return;
  await summary.click();
  await klaarGeklapt(blok, open);
}

/**
 * Klapt in het scherm dat open staat elk uitklapblok open dat er te zien is,
 * eerst elk los en daarna alle tegelijk (ook de blokken die pas in een open
 * blok te zien zijn), en meet na elk blok. Een scherm met een tip of een
 * antwoord past tot je het openklapt; speling.ts maakt daar bewust geen
 * ruimte meer (de editor kromp anders onder het typen).
 */
async function meetNaOpen(pagina, paneel, id) {
  // Vaste verwijzingen, geen locator met een nummer: een blok dat opengaat,
  // maakt de blokken erin zichtbaar, en dan schuift de telling.
  const zichtbaar = async () => {
    const uit = [];
    for (const blok of await paneel.locator('details').elementHandles())
      if (await blok.isVisible()) uit.push(blok);
    return uit;
  };
  const blokken = [];
  for (const blok of await zichtbaar())
    if (!(await blok.evaluate((d) => d.open))) blokken.push(blok);
  if (blokken.length === 0) return {};
  const meet = async () => {
    // Na het klappen: pasCode en speling meten opnieuw in een animatieframe.
    await pagina.waitForTimeout(250);
    await pagina.evaluate(() => window.scrollTo(0, 0));
    return over(pagina, id);
  };
  const samenvatting = (blok) =>
    blok.evaluate((d) => (d.querySelector(':scope > summary')?.textContent ?? '').trim());
  let naOpen = Number.NEGATIVE_INFINITY;
  let naOpenBlok = '';
  const open = [];
  for (const blok of blokken) {
    await klap(blok, true);
    const px = await meet();
    const tekst = await samenvatting(blok);
    open.push({ blok: tekst, over: px });
    if (px > naOpen) {
      naOpen = px;
      naOpenBlok = tekst;
    }
    await klap(blok, false);
  }
  // Alle tegelijk, en wat in een open blok weer een blok is ook: tot er
  // niets meer dicht is (hooguit drie lagen diep).
  const geopend = [];
  for (let laag = 0; laag < 3; laag++) {
    const dicht = [];
    for (const blok of await zichtbaar())
      if (!(await blok.evaluate((d) => d.open))) dicht.push(blok);
    if (dicht.length === 0) break;
    for (const blok of dicht) {
      await klap(blok, true);
      geopend.push(blok);
    }
  }
  const naAllesOpen = await meet();
  // Weer dicht, binnenste eerst: het volgende scherm begint zoals de leerling het ziet.
  for (const blok of geopend.reverse()) await klap(blok, false);
  return { naOpen, naOpenBlok, naAllesOpen, open };
}

async function meetLes(les) {
  for (const scherm of SCHERMEN) {
    // Een verse context per les: bewaard werk in een oefenveld verandert de
    // hoogte van het veld.
    const context = await nieuweContext(scherm);
    const pagina = await context.newPage();
    await pagina.goto(`${adres}${les}`);
    await pagina.waitForSelector('[role=tab]');
    // Met het lettertype van de site zijn de tabbladen breder dan met het
    // reservelettertype. Zonder hierop te wachten telde het script één regel
    // waar de leerling er twee zag (de arm van de Golfbot).
    await pagina.evaluate(() => document.fonts.ready);
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
    if (!scherm.telefoon) {
      // Een kop is ook een adres: twee keer hetzelfde id geeft twee schermen
      // waarvan een link er maar één opent.
      const dubbel = await pagina.evaluate(() => {
        const aantal = new Map();
        for (const el of document.querySelectorAll('.theme-doc-markdown [id]'))
          aantal.set(el.id, (aantal.get(el.id) ?? 0) + 1);
        return [...aantal].filter(([, n]) => n > 1).map(([id]) => id);
      });
      if (dubbel.length && !dubbeleIds.some((d) => d.les === les)) dubbeleIds.push({ les, dubbel });
    }
    const tabs = await pagina.locator('[data-tab]').all();
    let vast = false;
    for (const tab of tabs) {
      if (vast) break;
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
      // Alleen stappen die te zien zijn: een deel met stappen kan in een
      // uitklapblok staan dat dicht is (de uitleg van I2C bij robotica).
      const stappen = await paneel.locator('[data-stap]:visible').all();
      for (const stap of stappen.length ? stappen : [null]) {
        if (stap) {
          await stap.scrollIntoViewIfNeeded();
          await stap.click();
        }
        await pagina.waitForTimeout(scherm.telefoon ? 50 : 400);
        // Het lettertype van de code laadt pas als er code in beeld komt, en
        // pasCode meet opnieuw als het binnen is (loadingdone). Op de runner
        // van CI was het na 400 ms nog niet binnen: daar viel code van 62
        // tekens 27 px af die lokaal paste. Dus wachten tot elk lettertype
        // er is, en pasCode een frame geven.
        await pagina.evaluate(() => document.fonts.ready);
        await pagina.waitForTimeout(scherm.telefoon ? 50 : 150);
        await pagina.evaluate(() => window.scrollTo(0, 0));
        const maat = await pagina.evaluate((id) => {
          const paneel = document.querySelector(`[data-les-tab="${CSS.escape(id)}"]`);
          const r = paneel.getBoundingClientRect();
          // Een oefenveld naast de les telt mee (zie ONDERKANT).
          const naast = [...paneel.parentElement.children].find((k) =>
            k.hasAttribute('data-les-naast'),
          );
          const n = naast?.getBoundingClientRect();
          const onder =
            n && n.height > 0 && n.left >= r.right - 1 ? Math.max(r.bottom, n.bottom) : r.bottom;
          return {
            over: Math.round(onder - document.documentElement.clientHeight),
            naast: !!n && n.height > 0,
            boven: Math.round(r.top),
            pagina: document.documentElement.scrollHeight - document.documentElement.clientHeight,
            // Niet innerWidth: daar hoort de schuifbalk van de pagina bij, en
            // op een telefoon groeit hij mee met een pagina die te breed is.
            zijwaarts: Math.max(
              0,
              document.documentElement.scrollWidth - document.documentElement.clientWidth,
            ),
            velden: paneel.querySelectorAll('[data-zaad]').length,
            volgendeLes: volgendeLesInBeeld(paneel),
            // Op hoeveel regels de rij stappen staat: een tweede regel kost
            // elk scherm van dat tabblad veertig pixels.
            stapregels: new Set(
              [...paneel.querySelectorAll('[data-stap]')]
                .filter((s) => s.getClientRects().length > 0 && !s.closest('details:not([open])'))
                .map((s) => Math.round(s.getBoundingClientRect().top)),
            ).size,
            ...binnenHetScherm(paneel),
          };

          // De link naar de volgende les terwijl dit scherm zelf een knop
          // Volgende heeft: die zegt hetzelfde en slaat de rest van de les
          // over.
          function volgendeLesInBeeld(paneel) {
            const knop = [...paneel.querySelectorAll('[data-les-verder] button')].some(
              (k) => k.getClientRects().length > 0,
            );
            const link = document.querySelector('.pagination-nav__link--next');
            if (!knop || !link || link.getClientRects().length === 0) return false;
            return link.getBoundingClientRect().top < document.documentElement.clientHeight;
          }

          // Wat "past" niet ziet: een scherm past ook als de code zijwaarts
          // is afgesneden, als een programma in een vak van twaalf regels
          // schuift, of als een schema op een tiende van zijn grootte staat.
          function binnenHetScherm(paneel) {
            const teZien = (el) =>
              el.getClientRects().length > 0 && !el.closest('[hidden], details:not([open])');
            const vakken = [...paneel.querySelectorAll('pre')].filter(teZien);
            const afgesneden = Math.max(0, ...vakken.map((v) => v.scrollWidth - v.clientWidth));
            // Een regel die naar een volgende regel afbreekt: hij is hoger
            // dan één regel van het blok. En hoe klein de letters zijn
            // geworden om de langste regel te laten passen (pasCode.ts).
            const afgebroken = vakken.filter((v) => {
              const stijl = getComputedStyle(v);
              const regel =
                Number.parseFloat(stijl.lineHeight) || Number.parseFloat(stijl.fontSize) * 1.45;
              return [...v.querySelectorAll('.token-line')].some(
                (r) => r.getBoundingClientRect().height > regel * 1.5,
              );
            }).length;
            const letters = Math.min(
              16,
              ...vakken.map((v) => Number.parseFloat(getComputedStyle(v).fontSize)),
            );
            const schuift = vakken
              .filter((v) => v.scrollHeight - v.clientHeight > 6)
              .map((v) => {
                const regels = v.querySelectorAll('.token-line').length;
                return {
                  regels,
                  zichtbaar: Math.round((regels * v.clientHeight) / v.scrollHeight),
                };
              });
            // De schaal waarop een plaatje staat; naast zijn tekst staat het
            // passend in een vak (object-fit: contain).
            const plaatjes = [...paneel.querySelectorAll('img')]
              .filter((img) => teZien(img) && img.naturalWidth > 0 && !img.closest('button, a'))
              .map((img) => ({
                schaal: Math.min(
                  img.clientWidth / img.naturalWidth,
                  img.clientHeight / img.naturalHeight,
                ),
                groter: img.hasAttribute('data-vergroot'),
              }))
              .filter((p) => p.schaal < 1 / 3);
            return {
              afgesneden: afgesneden > 6 ? afgesneden : 0,
              afgebroken,
              letters: Math.round(letters * 10) / 10,
              schuift,
              klein: plaatjes.length,
              kleinZonderVergroting: plaatjes.filter((p) => !p.groter).length,
            };
          }
        }, id);
        const naam = stap
          ? `${label} › ${(await stap.innerText()).replace(/\s+/g, ' ').trim()}`
          : label;
        let naOpen = {};
        if (OPEN && !scherm.telefoon) {
          try {
            naOpen = await meetNaOpen(pagina, paneel, id);
          } catch (fout) {
            console.error(
              `${les} | ${naam} | ${scherm.width} (--open): ${fout.message.split('\n')[0]}`,
            );
          }
        }
        let naKlik = {};
        if (KLIK && !scherm.telefoon) {
          try {
            naKlik = {
              ...(await meetNaKlik(pagina, paneel, id)),
              ...(await meetNaAntwoord(pagina, paneel, id)),
            };
          } catch (fout) {
            // Een programma dat blijft draaien, houdt de hele pagina vast:
            // de rest van deze les op dit scherm vervalt.
            console.error(`${les} | ${naam} | ${scherm.width}: ${fout.message.split('\n')[0]}`);
            vast = true;
          }
        }
        rijen.push({
          les,
          tab: naam,
          scherm: `${scherm.width}x${scherm.height}`,
          telefoon: Boolean(scherm.telefoon),
          ...maat,
          ...naOpen,
          ...naKlik,
        });
        if (vast) break;
      }
    }
    await context.close();
  }
}

// Een les zonder tabbladen (één sectie, of een korte stap waarvan de
// afsluiter bij de tekst erboven staat) is één scherm: de tekst van de les
// hoort dan ook op het scherm te passen. In de editor-cursus is dat de helft
// van de pagina's, met de git-simulator erop.
const zonderTabs = [];
async function meetZonderTabs(les) {
  for (const scherm of SCHERMEN) {
    const context = await nieuweContext(scherm);
    const pagina = await context.newPage();
    await pagina.goto(`${adres}${les}`);
    await pagina.waitForSelector('.theme-doc-markdown');
    await pagina.evaluate(() => document.fonts.ready);
    await pagina.waitForTimeout(scherm.telefoon ? 100 : 500);
    zonderTabs.push({
      les,
      scherm: `${scherm.width}x${scherm.height}`,
      telefoon: Boolean(scherm.telefoon),
      ...(await pagina.evaluate(() => {
        const tekst = document.querySelector('.theme-doc-markdown');
        return {
          over: Math.round(
            tekst.getBoundingClientRect().bottom - document.documentElement.clientHeight,
          ),
          zijwaarts: Math.max(
            0,
            document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ),
        };
      })),
    });
    await context.close();
  }
}

// Een paar lessen tegelijk, elk in zijn eigen context. De uitkomst staat
// daarna weer in de volgorde van de lessen.
const los = lessen('data-les-zonder-tabs');
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

const plek = new Map(los.map((les, i) => [les, i]));
await Promise.all(
  Array.from({ length: TEGELIJK }, async () => {
    for (let les = los.shift(); les; les = los.shift()) await meetZonderTabs(les);
  }),
);
zonderTabs.sort((a, b) => plek.get(a.les) - plek.get(b.les));

await browser.close();
server.close();

const naam = (les) => les.replace(/^docs\//, '');
if (ALS_JSON) {
  console.log(JSON.stringify({ kolomBreedte, rijen, tabrijen, dubbeleIds, zonderTabs }, null, 2));
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
  if (KLIK) {
    for (const [veld, wat] of [
      ['naUitvoeren', 'Uitvoeren'],
      ['naStappen', 'Stap voor stap'],
      ['naAntwoord', 'een antwoord op de vraag'],
    ]) {
      const gemeten = rijen.filter((r) => r[veld] !== undefined);
      const telang = gemeten.filter((r) => r.over <= 0 && r[veld] > 0);
      console.log(
        `\n## Na een klik op ${wat}: ${telang.length} van ${gemeten.length} metingen niet meer passend\n`,
      );
      for (const r of telang.sort((a, b) => b[veld] - a[veld]))
        console.log(`- ${naam(r.les)} | ${r.tab} | ${r.scherm}: ${r[veld]} px te lang`);
    }
  }
  if (OPEN) {
    const gemeten = rijen.filter((r) => r.naOpen !== undefined);
    const telang = gemeten.filter((r) => r.over <= 0 && r.naOpen > 0);
    console.log(
      `\n## Met een uitklapblok open: ${telang.length} van ${gemeten.length} metingen niet meer passend\n`,
    );
    for (const r of telang.sort((a, b) => b.naOpen - a.naOpen))
      console.log(
        `- ${naam(r.les)} | ${r.tab} | ${r.scherm}: "${r.naOpenBlok}" ${r.naOpen} px te lang`,
      );
    const alles = gemeten.filter((r) => r.over <= 0 && r.naAllesOpen > 0 && r.open.length > 1);
    console.log(
      `\n## Met alle uitklapblokken tegelijk open (schermen met meer dan één): ${alles.length} niet meer passend\n`,
    );
    for (const r of alles.sort((a, b) => b.naAllesOpen - a.naAllesOpen))
      console.log(
        `- ${naam(r.les)} | ${r.tab} | ${r.scherm}: ${r.naAllesOpen} px te lang (${r.open.map((o) => `"${o.blok}"`).join(', ')})`,
      );
  }
  // Per tabblad één keer, op het kleinste brede scherm.
  const [smal] = SCHERMEN.filter((s) => !s.telefoon);
  const dubbeleRij = new Map();
  for (const r of rijen.filter((r) => r.scherm === `${smal.width}x${smal.height}`))
    if (r.stapregels > 1) dubbeleRij.set(`${naam(r.les)} | ${r.tab.split(' › ')[0]}`, r.stapregels);
  console.log(`\n## Een rij stappen op meer dan één regel: ${dubbeleRij.size} tabbladen\n`);
  for (const [waar, regels] of dubbeleRij) console.log(`- ${waar}: ${regels} regels`);
  const metLink = rijen.filter((r) => r.volgendeLes);
  console.log(
    `\n## De link naar de volgende les naast de knop Volgende: ${metLink.length} schermen\n`,
  );
  for (const r of metLink) console.log(`- ${naam(r.les)} | ${r.tab} | ${r.scherm}`);
  const breed = rijen.filter((r) => r.zijwaarts > 0);
  console.log(`\n## Zijwaarts schuiven: ${breed.length} schermen\n`);
  for (const r of breed.sort((a, b) => b.zijwaarts - a.zijwaarts))
    console.log(`- ${naam(r.les)} | ${r.tab} | ${r.scherm}: ${r.zijwaarts} px te breed`);
  // Wat een scherm dat past toch verbergt, op het kleinste brede scherm.
  const [eerste] = SCHERMEN.filter((s) => !s.telefoon);
  const klein = rijen.filter((r) => r.scherm === `${eerste.width}x${eerste.height}`);
  const af = klein.filter((r) => r.afgesneden > 0);
  console.log(`\n## Code zijwaarts afgesneden: ${af.length} schermen\n`);
  for (const r of af.sort((a, b) => b.afgesneden - a.afgesneden))
    console.log(`- ${naam(r.les)} | ${r.tab}: ${r.afgesneden} px verborgen`);
  const gebroken = klein.filter((r) => r.afgebroken > 0);
  console.log(`\n## Een regel code die afbreekt: ${gebroken.length} schermen\n`);
  for (const r of gebroken) console.log(`- ${naam(r.les)} | ${r.tab}`);
  const kleiner = klein.filter((r) => r.letters < 14);
  console.log(`\n## Code met kleinere letters: ${kleiner.length} schermen\n`);
  for (const r of kleiner.sort((a, b) => a.letters - b.letters).slice(0, 20))
    console.log(`- ${naam(r.les)} | ${r.tab}: ${r.letters} px`);
  const vak = klein.filter((r) => r.schuift.length > 0);
  console.log(`\n## Een programma in een vak dat schuift: ${vak.length} schermen\n`);
  for (const r of vak)
    for (const v of r.schuift)
      console.log(`- ${naam(r.les)} | ${r.tab}: ${v.zichtbaar} van de ${v.regels} regels te zien`);
  const zonder = klein.filter((r) => r.kleinZonderVergroting > 0);
  console.log(
    `\n## Plaatjes onder een derde van hun grootte: ${klein.filter((r) => r.klein > 0).length} schermen, waarvan ${zonder.length} zonder vergroting\n`,
  );
  for (const r of zonder) console.log(`- ${naam(r.les)} | ${r.tab}`);
  for (const { width, height } of SCHERMEN.filter((sch) => !sch.telefoon)) {
    const scherm = `${width}x${height}`;
    const deze = zonderTabs.filter((r) => r.scherm === scherm);
    const telang = deze.filter((r) => r.over > 0).sort((a, b) => b.over - a.over);
    console.log(
      `\n## ${scherm}, pagina's zonder tabbladen: ${deze.length - telang.length} van ${deze.length} passen\n`,
    );
    for (const r of telang) console.log(`- ${naam(r.les)}: ${r.over} px te lang`);
  }
  console.log(`\n## Dubbele id's: ${dubbeleIds.length} pagina's\n`);
  for (const d of dubbeleIds) console.log(`- ${naam(d.les)}: ${d.dubbel.join(', ')}`);
  console.log(`\nDe les gebruikt ${kolomBreedte}% van de breedte naast de lessenlijst.`);
}

if (STRENG) {
  const uitzonderingen = JSON.parse(
    readFileSync(new URL('./meet-les-tabs-uitzonderingen.json', import.meta.url), 'utf8'),
  ).filter((u) => u.site === SITE);
  const bewust = (les, tab) =>
    uitzonderingen.some((u) => u.les === les && (u.tab === undefined || u.tab === tab));
  const fouten = [];
  for (const r of rijen) {
    if (bewust(r.les, r.tab)) continue;
    if (!r.telefoon && r.over > 0)
      fouten.push(`${r.les} | ${r.tab} | ${r.scherm}: ${r.over} px te lang`);
    if (r.zijwaarts > 0)
      fouten.push(`${r.les} | ${r.tab} | ${r.scherm}: ${r.zijwaarts} px te breed`);
    if (!r.telefoon && r.afgesneden > 0)
      fouten.push(`${r.les} | ${r.tab} | ${r.scherm}: code ${r.afgesneden} px afgesneden`);
  }
  for (const t of tabrijen)
    if (t.regels > 1 && !bewust(t.les))
      fouten.push(`${t.les} | ${t.scherm}: de rij tabbladen staat op ${t.regels} regels`);
  for (const r of zonderTabs) {
    if (bewust(r.les)) continue;
    if (!r.telefoon && r.over > 0) fouten.push(`${r.les} | ${r.scherm}: ${r.over} px te lang`);
    if (r.zijwaarts > 0) fouten.push(`${r.les} | ${r.scherm}: ${r.zijwaarts} px te breed`);
  }
  for (const d of dubbeleIds)
    if (!bewust(d.les)) fouten.push(`${d.les}: dubbele id's ${d.dubbel.join(', ')}`);
  if (fouten.length) {
    console.error(`\n${fouten.length} schermen passen niet (zie de schrijfgids, §2):`);
    for (const f of fouten) console.error(`- ${f}`);
    console.error(
      'Splits een te lang scherm met een ### of kort het in; staat het bewust zo, zet het met een reden in scripts/meet-les-tabs-uitzonderingen.json.',
    );
    process.exit(1);
  }
  console.error('Elk gemeten scherm past.');
}
