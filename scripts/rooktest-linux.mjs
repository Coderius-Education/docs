// Rooktest van de oefenterminal van linux in een echte browser.
//
//   node scripts/rooktest-linux.mjs [map-van-de-build]
//
// De tests van de terminal draaien de simulator in node (opdrachten.test.ts,
// regel.test.js) en de tabbladen in jsdom; wat alleen een browser doet, zien
// ze niet: of xterm de focus houdt en weer loslaat (Esc en dan Tab), of een
// doel afvinkt terwijl de leerling typt, of de terminal naast de les plakt
// als een antwoord open staat, en hoe hij op een telefoon staat. Dit script
// serveert de gebouwde linux-site onder zijn eigen pad, net als
// rooktest-speeltuin.mjs de python-site, en doet dat in Chromium.
//
// Lokaal: `pnpm --filter ./sites/informatica/linux build`, dan dit script.
// Met de .br van scripts/comprimeer.mjs naast de bestanden serveert het die,
// zoals de hostingbackend. Met CHROMIUM=<pad> een Chromium die al op de
// computer staat, zoals in meet-les-tabs.mjs.
//
// Met klassieke schuifbalken, zoals meet-les-tabs.mjs: Playwright start
// Chromium anders met --hide-scrollbars, en een schoolcomputer met Windows
// heeft schuifbalken die ruimte innemen.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const { SITES_BY_ID, siteDir } = require('../packages/shared/sites.js');
const LINUX = join(fileURLToPath(new URL('..', import.meta.url)), siteDir('linux'));

const argumenten = process.argv.slice(2);
const BUILD = resolve(argumenten.find((a) => !a.startsWith('--')) ?? join(LINUX, 'build'));
const BASIS = `/${SITES_BY_ID.linux.path}/`;
const KOPIEREN = `${BASIS}docs/terminal/kopieren/`;
const JOKERTEKENS = `${BASIS}docs/terminal/jokertekens/`;
const BREED = { width: 1280, height: 720 };
const TELEFOON = { width: 390, height: 800 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.sh': 'text/plain; charset=utf-8',
};

if (!existsSync(join(BUILD, 'index.html'))) {
  console.error(
    `Geen build in ${BUILD}. Bouw eerst: pnpm --filter ./sites/informatica/linux build`,
  );
  process.exit(2);
}

function serveer() {
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (!url.startsWith(BASIS)) {
      res.writeHead(404).end();
      return;
    }
    let pad = join(BUILD, url.slice(BASIS.length));
    if (!pad.startsWith(BUILD)) {
      res.writeHead(403).end();
      return;
    }
    try {
      if (statSync(pad).isDirectory()) pad = join(pad, 'index.html');
      const kop = { 'content-type': MIME[extname(pad)] ?? 'application/octet-stream' };
      // Zoals nginx met brotli_static en gzip_static: de .br of .gz naast het
      // bestand, als de browser erom vraagt, met het Content-Type van het
      // origineel.
      const vraagt = String(req.headers['accept-encoding'] ?? '');
      const variant = [
        ['br', '.br'],
        ['gzip', '.gz'],
      ].find(([naam, ext]) => vraagt.includes(naam) && existsSync(pad + ext));
      if (variant) {
        kop['content-encoding'] = variant[0];
        kop.vary = 'Accept-Encoding';
      }
      const inhoud = readFileSync(variant ? pad + variant[1] : pad);
      res.writeHead(200, kop);
      res.end(inhoud);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((klaar) => server.listen(0, '127.0.0.1', () => klaar(server)));
}

const start = Date.now();
const server = await serveer();
const adres = `http://127.0.0.1:${server.address().port}`;

// Zonder CHROMIUM de volledige Chromium, niet de headless shell (zie
// meet-les-tabs.mjs).
const browser = await chromium.launch({
  ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : { channel: 'chromium' }),
  ignoreDefaultArgs: ['--hide-scrollbars'],
});

const fouten = [];
const paginaFouten = [];
const controleer = async (naam, stap) => {
  try {
    const meer = await stap();
    console.log(`ok  ${naam}${meer ? ` (${meer})` : ''}`);
    return true;
  } catch (e) {
    fouten.push(`${naam}: ${e.message.split('\n')[0]}`);
    console.log(`FOUT ${naam}: ${e.message.split('\n')[0]}`);
    return false;
  }
};
const eis = (waar, melding) => {
  if (!waar) throw new Error(melding);
};

async function nieuwePagina(scherm, opties = {}) {
  const context = await browser.newContext({ viewport: scherm, ...opties });
  // Alleen de eigen server: een aanvraag naar buiten (de statistieken, een
  // lettertype) kan op de runner van CI blijven hangen (meet-les-tabs.mjs).
  await context.route(
    (url) => url.hostname !== '127.0.0.1',
    (route) => route.abort(),
  );
  const page = await context.newPage();
  page.on('pageerror', (e) => paginaFouten.push(e.message));
  return page;
}

/** Open een les en wacht tot React de tabbladen heeft overgenomen. */
async function openLes(page, pad) {
  await page.goto(`${adres}${pad}`);
  await page.locator('[role="tab"]').first().waitFor();
  // De terminal is een <BrowserOnly>: er is pas een terminal na het hydrateren.
  await page.locator('[data-terminal]').first().waitFor({ state: 'attached' });
}

/** De terminal met `data-terminal="<id>"`, gestart (xterm staat erin). */
async function terminal(page, id) {
  const wortel = page.locator(`[data-terminal="${id}"]`);
  await wortel.locator('.xterm-screen').waitFor({ state: 'visible' });
  return wortel;
}

/** De regels op het scherm van een terminal, zonder spaties aan het eind. */
const schermregels = (wortel) =>
  wortel
    .locator('.xterm-rows > div')
    .evaluateAll((rijen) => rijen.map((r) => r.textContent.replace(/ /g, ' ').trimEnd()));

/** Een regel met de prompt, en wat erachter getypt is. */
const PROMPT = /^student@oefenpc:[^$]*\$(?: (.*))?$/;

/** Wat er getypt is op de regel van de cursor: de laatste met een prompt. */
async function invoerregel(wortel) {
  const regel = (await schermregels(wortel)).findLast((r) => PROMPT.test(r));
  return regel?.match(PROMPT)[1] ?? '';
}

/** Wacht tot de invoerregel `verwacht` is (xterm tekent na een frame). */
async function wachtOpRegel(wortel, verwacht) {
  let laatst = '';
  for (let i = 0; i < 40; i++) {
    laatst = (await invoerregel(wortel)).trimEnd();
    if (laatst === verwacht) return;
    await wortel.page().waitForTimeout(50);
  }
  throw new Error(`de regel is ${JSON.stringify(laatst)}, niet ${JSON.stringify(verwacht)}`);
}

/** De commando's uit het antwoord van een opdracht, zoals de les ze geeft:
 *  het eerste bash-blok na "Klik hier voor het antwoord" onder zijn kop. */
function antwoordUitLes(bestand, opdracht) {
  const bron = readFileSync(join(LINUX, 'docs', bestand), 'utf8');
  const kop = bron.indexOf(`## Opdracht ${opdracht}:`);
  const antwoord = bron.indexOf('Klik hier voor het antwoord', kop);
  const blok = bron.slice(antwoord).match(/```bash\n([\s\S]*?)```/);
  if (kop < 0 || antwoord < 0 || !blok)
    throw new Error(`geen antwoord bij ${opdracht} in ${bestand}`);
  return blok[1].split('\n').filter((r) => r.trim());
}

/** Staat de focus in (de textarea van) deze terminal? */
const focusIn = (wortel) => wortel.evaluate((el) => el.contains(document.activeElement));

try {
  const page = await nieuwePagina(BREED);
  await openLes(page, KOPIEREN);
  await page.locator('[role="tab"][data-tab="opdracht-23a-opruimen"]').click();
  const t23 = await terminal(page, '2.3.a');

  await controleer('2.3.a: Tab vult aan, ook na Esc, wegklikken en terugkomen', async () => {
    await t23.locator('.xterm-screen').click();
    eis(await focusIn(t23), 'een klik in de terminal zet de focus er niet in');
    await page.keyboard.type('cp no');
    await page.keyboard.press('Tab');
    await wachtOpRegel(t23, 'cp notities.txt');
    await page.keyboard.press('Control+U');
    await wachtOpRegel(t23, '');
    // Esc, en dan ergens anders op de pagina klikken: de uitweg moet de Esc
    // vergeten, anders verlaat de eerste Tab na terugkomst de terminal. Die
    // Tab is dus de eerste toets na het terugkomen (elke andere toets zet de
    // uitweg ook terug): `cp no` staat er al voor de Esc.
    await page.keyboard.type('cp no');
    await wachtOpRegel(t23, 'cp no');
    await page.keyboard.press('Escape');
    await page.locator('article h1').click();
    eis(!(await focusIn(t23)), 'na het wegklikken staat de focus nog in de terminal');
    await t23.locator('.xterm-screen').click();
    await page.keyboard.press('Tab');
    eis(await focusIn(t23), 'de Tab na terugkomen liet de terminal los');
    await wachtOpRegel(t23, 'cp notities.txt');
  });

  await controleer('2.3.a: Esc en dan Tab gaat naar de knop Volgende', async () => {
    await t23.locator('.xterm-screen').click();
    await page.keyboard.press('Control+U');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Tab');
    const op = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tekst: el?.textContent?.trim() ?? '',
        tag: el?.tagName ?? '',
        inOpenTab: Boolean(el?.closest('[data-les-tab]:not([hidden])')),
      };
    });
    eis(
      op.tag === 'BUTTON' && op.tekst.startsWith('Volgende') && op.inOpenTab,
      `de focus staat op ${op.tag} ${JSON.stringify(op.tekst)}`,
    );
    return op.tekst;
  });

  await controleer('2.3.a: het antwoord uit de les vinkt elk doel af', async () => {
    await t23.locator('.xterm-screen').click();
    await page.keyboard.press('Control+U');
    const antwoord = antwoordUitLes('terminal/kopieren.mdx', '2.3.a');
    for (const regel of antwoord) {
      await page.keyboard.type(regel);
      await page.keyboard.press('Enter');
    }
    const doelen = t23.locator('li');
    const status = t23.locator('[aria-live="polite"]');
    await status
      .filter({ hasText: /^Klaar/ })
      .waitFor({ timeout: 5_000 })
      .catch(() => {});
    const teksten = await doelen.allTextContents();
    eis(teksten.length > 0, 'de terminal heeft geen doelen');
    const open = teksten.filter((t) => !t.includes('Gehaald:'));
    eis(open.length === 0, `niet gehaald: ${open.join(' | ')}`);
    const zegt = (await status.textContent()) ?? '';
    eis(zegt.startsWith('Klaar'), `de status zegt ${JSON.stringify(zegt)}`);
    return `${teksten.length} doelen`;
  });

  await page.context().close();

  const joker = await nieuwePagina(BREED);
  await openLes(joker, JOKERTEKENS);
  await joker.locator('[role="tab"][data-tab="opdracht-24a-fotos-sorteren"]').click();
  await terminal(joker, '2.4.a');

  await controleer('2.4.a: met het antwoord open blijven de doelen in beeld', async () => {
    const summary = joker.locator('summary:visible', { hasText: 'Klik hier voor het antwoord' });
    eis((await summary.count()) === 1, `${await summary.count()} zichtbare antwoorden`);
    await summary.click();
    const blok = summary.locator('xpath=..');
    // Het <details> van Docusaurus klapt open met een animatie.
    await joker.waitForFunction(
      (el) => el.open && el.getBoundingClientRect().height > 100,
      await blok.elementHandle(),
    );
    await joker.waitForTimeout(400);
    const terminalTop = () =>
      joker.evaluate(() =>
        Math.round(document.querySelector('[data-terminal="2.4.a"]').getBoundingClientRect().top),
      );
    const ervoor = await terminalTop();
    const geschoven = await blok.evaluate((el) => {
      const voor = window.scrollY;
      window.scrollBy(0, el.getBoundingClientRect().bottom - window.innerHeight);
      return window.scrollY - voor;
    });
    await joker.waitForTimeout(100);
    const maat = await joker.evaluate(() => {
      const el = document.querySelector('[data-terminal="2.4.a"]');
      const nav = document.querySelector('.navbar').getBoundingClientRect();
      // Waar de terminal naast de les plakt (LinuxTerminal/styles.module.css).
      const gast = el.closest('[data-les-naast-gast]');
      return {
        top: Math.round(el.getBoundingClientRect().top),
        navbar: Math.round(nav.bottom),
        hoog: window.innerHeight,
        plakplek: gast ? Number.parseFloat(getComputedStyle(gast).top) : Number.NaN,
      };
    });
    eis(
      maat.top >= maat.navbar - 1 && maat.top < maat.hoog,
      `de bovenkant van de terminal staat op ${maat.top}px (navbar tot ${maat.navbar}px, venster ${maat.hoog}px, ${geschoven}px geschoven)`,
    );
    // Binnen het venster is niet genoeg: in 2.4.a schuift het antwoord de
    // pagina maar 90 pixels, en dan staat ook een terminal die niet plakt
    // nog net onder de navbar. Hij schuift mee tot zijn plakplek, en niet
    // verder.
    //
    // Dat bewijst alleen iets als de pagina verder schuift dan de afstand
    // tot de plakplek: anders staat een terminal die niet plakt op dezelfde
    // plek (ervoor - geschoven), en slaagt deze controle stil. Een korter
    // antwoord of een terminal die hoger begint, laat hem dan falen.
    eis(
      Number.isFinite(maat.plakplek),
      'de terminal staat niet in een plakkende kolom naast de les (data-les-naast-gast)',
    );
    eis(
      geschoven > ervoor - maat.plakplek,
      `de pagina schoof maar ${geschoven}px, de terminal stond ${ervoor - maat.plakplek}px onder zijn plakplek (${maat.plakplek}px): of hij plakt, is zo niet te zien`,
    );
    const verwacht = Math.max(ervoor - geschoven, Math.min(ervoor, maat.plakplek));
    eis(
      Math.abs(maat.top - verwacht) <= 2,
      `de terminal plakt niet: hij ging van ${ervoor}px naar ${maat.top}px, niet naar ${verwacht}px (${geschoven}px geschoven)`,
    );
    return `${geschoven}px geschoven, terminal van ${ervoor}px naar ${maat.top}px (plakplek ${maat.plakplek}px), navbar tot ${maat.navbar}px`;
  });
  await joker.context().close();

  const tel = await nieuwePagina(TELEFOON, { isMobile: true, hasTouch: true });
  await openLes(tel, KOPIEREN);
  const tLes = await terminal(tel, 'les');

  await controleer('telefoon: de terminal van de les staat onder de tekst', async () => {
    const maat = await tel.evaluate(() => {
      const t = document.querySelector('[data-terminal="les"]').getBoundingClientRect();
      const p = document.querySelector('[data-les-tab]:not([hidden])').getBoundingClientRect();
      return { terminal: Math.round(t.top + scrollY), tekst: Math.round(p.bottom + scrollY) };
    });
    eis(
      maat.terminal >= maat.tekst - 1,
      `de terminal begint op ${maat.terminal}px, de tekst eindigt op ${maat.tekst}px`,
    );
  });

  await controleer('telefoon: niets schuift zijwaarts', async () => {
    const b = await tel.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    eis(b.scroll <= b.client, `de pagina is ${b.scroll}px breed in ${b.client}px`);
  });

  await controleer('telefoon: help past in de terminal', async () => {
    await tLes.locator('.xterm-screen').tap();
    await tel.keyboard.type('help');
    await tel.keyboard.press('Enter');
    // Klaar als er onder het commando weer een prompt staat.
    let rijen = [];
    for (let i = 0; i < 40; i++) {
      rijen = await schermregels(tLes);
      const laatste = rijen.findLast((r) => r !== '')?.match(PROMPT);
      if (laatste && laatste[1] === undefined) break;
      await tel.waitForTimeout(50);
    }
    // De eerste regel van help moet nog op het scherm staan: dan passen de
    // regels van help en de nieuwe prompt in de hoogte van de terminal.
    const eerste = rijen.findIndex((r) => r.startsWith("Beschikbare commando's"));
    const prompt = rijen.findLastIndex((r) => PROMPT.test(r));
    eis(
      eerste >= 0 && prompt > eerste,
      `het begin van help staat niet meer op het scherm van ${rijen.length} regels`,
    );
    const regels = prompt - eerste;
    eis(regels < rijen.length, `help geeft ${regels} regels in een terminal van ${rijen.length}`);
    return `${regels} regels in een terminal van ${rijen.length}`;
  });
  await tel.context().close();

  await controleer('geen JavaScript-fouten op de pagina', async () => {
    eis(paginaFouten.length === 0, paginaFouten.join(' | '));
  });
} finally {
  await browser.close();
  server.close();
}

const duur = ((Date.now() - start) / 1000).toFixed(1);
if (fouten.length) {
  for (const f of fouten) console.error(`::error::${f}`);
  console.error(`${fouten.length} controle(s) faalden (${duur} s).`);
  process.exit(1);
}
console.log(`De oefenterminal werkt in Chromium (${duur} s).`);
