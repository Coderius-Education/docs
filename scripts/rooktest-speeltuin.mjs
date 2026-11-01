// Rooktest van de Python-speeltuin in een echte browser.
//
//   node scripts/rooktest-speeltuin.mjs [map-van-de-build]
//
// De node-tests draaien Pyodide in node en de componenttests een nagemaakte
// Pyodide in jsdom; geen van beide laadt de site zoals een leerling hem
// krijgt: de eigen Pyodide onder /python/pyodide/, de wasm, het venster
// voor input(), en de tekening van turtle in de pagina. Dit script serveert
// de gebouwde python-site onder zijn eigen pad, opent in Chromium de eerste
// les met een oefenveld (CodeExercise), en doet daar wat een leerling doet.
// De job `browser` in CI draait het na de build van de python-site.
//
// Lokaal: `pnpm --filter ./sites/informatica/python build`, dan dit script.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const { SITES_BY_ID, siteDir } = require('../packages/shared/sites.js');

const BUILD = resolve(process.argv[2] ?? join(siteDir('python'), 'build'));
const BASIS = `/${SITES_BY_ID.python.path}/`;
// Pyodide laden duurt in CI zo'n tien seconden; ruim daarboven.
const LADEN_MS = 90_000;

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
};

/** De eerste les (alfabetisch) met een oefenveld in de gebouwde HTML. */
function eersteLesMetOefenveld() {
  const docs = join(BUILD, 'docs');
  const zoek = (map) => {
    for (const naam of readdirSync(map).sort()) {
      const pad = join(map, naam);
      if (statSync(pad).isDirectory()) {
        const gevonden = zoek(pad);
        if (gevonden) return gevonden;
      } else if (naam === 'index.html' && readFileSync(pad, 'utf8').includes('class="exercise_')) {
        return pad;
      }
    }
    return null;
  };
  const pad = zoek(docs);
  if (!pad) throw new Error(`geen les met een oefenveld gevonden in ${docs}`);
  return `${BASIS}${pad.slice(BUILD.length + 1).replace(/index\.html$/, '')}`;
}

/** Welk adres gecomprimeerd over de lijn ging, en hoe. */
const gecomprimeerd = new Map();
/** Elk adres dat de server uitleverde, voor de controle van de service worker. */
const geserveerd = [];

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
      // bestand (scripts/comprimeer.mjs), als de browser erom vraagt, met
      // het Content-Type van het origineel.
      const vraagt = String(req.headers['accept-encoding'] ?? '');
      const variant = [
        ['br', '.br'],
        ['gzip', '.gz'],
      ].find(([naam, ext]) => vraagt.includes(naam) && existsSync(pad + ext));
      if (variant) {
        kop['content-encoding'] = variant[0];
        kop.vary = 'Accept-Encoding';
        gecomprimeerd.set(url, variant[0]);
      }
      geserveerd.push(url);
      const inhoud = readFileSync(variant ? pad + variant[1] : pad);
      res.writeHead(200, kop);
      res.end(inhoud);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((klaar) => server.listen(0, '127.0.0.1', () => klaar(server)));
}

const server = await serveer();
const adres = `http://127.0.0.1:${server.address().port}`;
const les = eersteLesMetOefenveld();
console.log(`Les: ${les}`);

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleFouten = [];
page.on('pageerror', (e) => consoleFouten.push(e.message));
// input() zonder JSPI valt terug op window.prompt.
page.on('dialog', (d) => d.accept('Sam'));

const fouten = [];
const controleer = async (naam, stap) => {
  try {
    await stap();
    console.log(`✓ ${naam}`);
    return true;
  } catch (e) {
    fouten.push(`${naam}: ${e.message.split('\n')[0]}`);
    console.log(`✗ ${naam}`);
    return false;
  }
};

const veld = page.locator('[class*="exercise_"]').first();
const uitvoer = veld.locator('[class*="output_"]');

async function draai(code) {
  await veld.locator('textarea').fill(code);
  await veld.getByRole('button', { name: /Uitvoeren/ }).click();
  await veld.getByRole('button', { name: /Uitvoeren/ }).waitFor({ state: 'visible' });
  await page.waitForFunction(
    (el) => !el.querySelector('button[disabled]'),
    await veld.elementHandle(),
    { timeout: 30_000 },
  );
}

async function verwacht(tekst) {
  const echt = (await uitvoer.textContent({ timeout: 5_000 })) ?? '';
  if (!echt.includes(tekst))
    throw new Error(`verwacht ${JSON.stringify(tekst)} in ${JSON.stringify(echt)}`);
}

try {
  await page.goto(`${adres}${les}`);
  const geladen = await controleer('Python laadt (eigen Pyodide, wasm)', async () => {
    await veld.getByRole('button', { name: '▶ Uitvoeren' }).waitFor({ timeout: LADEN_MS });
  });
  // Zonder Python heeft de rest geen zin, en elke stap zou op zijn time-out wachten.
  if (!geladen) throw new Error('stop');

  // Staat er een .br naast de wasm (scripts/comprimeer.mjs, in de job
  // `build`), dan moet Pyodide hem ook gecomprimeerd binnenkrijgen en er
  // nog steeds mee starten: met Content-Encoding en het Content-Type
  // application/wasm, zoals de hostingbackend hem hoort te sturen.
  if (existsSync(join(BUILD, 'pyodide', 'pyodide.asm.wasm.br'))) {
    await controleer('Pyodide start met de wasm gecomprimeerd (brotli)', async () => {
      const hoe = gecomprimeerd.get(`${BASIS}pyodide/pyodide.asm.wasm`);
      if (hoe !== 'br') throw new Error(`de wasm kwam binnen als ${hoe ?? 'ongecomprimeerd'}`);
    });
  }

  await controleer('print komt in de uitvoer', async () => {
    await draai('print("hoi")');
    await verwacht('hoi');
  });

  await controleer('een nieuwe run begint met lege variabelen', async () => {
    await draai('x = 5');
    await draai('print(x)');
    await verwacht("NameError: name 'x' is not defined");
  });

  await controleer('input() vraagt de leerling iets', async () => {
    await veld.locator('textarea').fill('naam = input("Naam? ")\nprint("Hoi " + naam)');
    await veld.getByRole('button', { name: /Uitvoeren/ }).click();
    // Met JSPI het eigen venster van de site, anders window.prompt (hierboven,
    // die antwoordt vanzelf). Wacht op het venster of op het einde van de run,
    // wat het eerst komt: isVisible() wacht niet, en het venster komt pas als
    // Python bij de input() is.
    const venster = page.getByRole('dialog');
    const klaar = page.waitForFunction(
      (el) => !el.querySelector('button[disabled]'),
      await veld.elementHandle(),
      { timeout: 30_000 },
    );
    const opent = venster.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'venster');
    if ((await Promise.race([opent, klaar.then(() => 'klaar')])) === 'venster') {
      await venster.getByRole('textbox').fill('Sam');
      await venster.getByRole('button', { name: 'Invoeren' }).click();
    }
    await klaar;
    opent.catch(() => {});
    await verwacht('Hoi Sam');
  });

  await controleer('turtle tekent in de pagina', async () => {
    await draai('import turtle\nturtle.forward(50)\nturtle.left(90)\nturtle.forward(50)');
    await veld.locator('svg').first().waitFor({ timeout: 10_000 });
  });

  await controleer('Stap voor stap toont de stappen', async () => {
    await veld.locator('textarea').fill('a = 1\nb = a + 1\nprint(b)');
    await veld.getByRole('button', { name: 'Stap voor stap' }).click();
    await veld.getByText(/Stap 1 van \d+/).waitFor({ timeout: 30_000 });
  });

  // De service worker van plugins/pyodide-cache.js. Bij het eerste bezoek
  // meldt hij zich pas aan; bij het tweede ziet hij pyodide.js en bewaart hij
  // de rest; vanaf het derde komt alleen pyodide.js nog van de server.
  await controleer('bij een volgend bezoek komt Pyodide uit de service worker', async () => {
    const opnieuw = async () => {
      await page.reload();
      await veld.getByRole('button', { name: '▶ Uitvoeren' }).waitFor({ timeout: LADEN_MS });
    };
    await opnieuw();
    geserveerd.length = 0;
    await opnieuw();
    const runtime = geserveerd.filter((u) => /\/pyodide\/(?!pyodide\.js$)/.test(u));
    if (runtime.length) throw new Error(`weer van de server: ${runtime.join(', ')}`);
    await draai('print("terug")');
    await verwacht('terug');
  });

  await controleer('geen JavaScript-fouten op de pagina', async () => {
    if (consoleFouten.length) throw new Error(consoleFouten.join(' | '));
  });
} catch (e) {
  if (e.message !== 'stop') throw e;
} finally {
  await browser.close();
  server.close();
}

if (fouten.length) {
  for (const f of fouten) console.error(`::error::${f}`);
  process.exit(1);
}
console.log('De speeltuin werkt in Chromium.');
