// Meet per les en per tabblad of het op één scherm past.
//
//   node scripts/meet-les-tabs.mjs [site-id] [--json] [--les=<stuk van het pad>] [--tegelijk=4] [--klik]
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
// Met `--klik` doet het in elk scherm met een Python-veld ook wat een leerling
// doet: het klikt op Uitvoeren en daarna op Stap voor stap, en meet na elke
// klik opnieuw (`naUitvoeren`, `naStappen`). Een scherm dat past tot je iets
// aanklikt, past niet: Stap voor stap stond eerst onder het veld en maakte
// het scherm tot 1634 pixels te lang. Een veld met `input()` slaat het over
// (dat wacht op een antwoord), en een veld dat na een kwartminuut nog draait
// meldt het op stderr. Dit kost per les het laden van Python erbij.
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
const KLIK = argumenten.includes('--klik');
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

function lessen() {
  const uit = [];
  const loop = (map) => {
    for (const naam of readdirSync(map).sort()) {
      const pad = join(map, naam);
      if (statSync(pad).isDirectory()) {
        if (!GEEN_LESSEN.includes(relative(BUILD, pad))) loop(pad);
      } else if (naam === 'index.html' && readFileSync(pad, 'utf8').includes('data-les-tabs'))
        uit.push(relative(BUILD, map));
    }
  };
  // De hele build, niet alleen docs/: robotica heeft de Lego-auto en de
  // Golfbot in eigen docs-plugins, onder lego_auto/ en golfbot/.
  loop(BUILD);
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
const dubbeleIds = [];
let kolomBreedte = null;

const over = (pagina, id) =>
  pagina.evaluate((id) => {
    const paneel = document.querySelector(`[data-les-tab="${CSS.escape(id)}"]`);
    return Math.round(paneel.getBoundingClientRect().bottom - window.innerHeight);
  }, id);

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
            ...binnenHetScherm(paneel),
          };

          // Wat "past" niet ziet: een scherm past ook als de code zijwaarts
          // is afgesneden, als een programma in een vak van twaalf regels
          // schuift, of als een schema op een tiende van zijn grootte staat.
          function binnenHetScherm(paneel) {
            const teZien = (el) =>
              el.getClientRects().length > 0 && !el.closest('[hidden], details:not([open])');
            const vakken = [...paneel.querySelectorAll('pre')].filter(teZien);
            const afgesneden = Math.max(0, ...vakken.map((v) => v.scrollWidth - v.clientWidth));
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
              schuift,
              klein: plaatjes.length,
              kleinZonderVergroting: plaatjes.filter((p) => !p.groter).length,
            };
          }
        }, id);
        const naam = stap
          ? `${label} › ${(await stap.innerText()).replace(/\s+/g, ' ').trim()}`
          : label;
        let naKlik = {};
        if (KLIK && !scherm.telefoon) {
          try {
            naKlik = await meetNaKlik(pagina, paneel, id);
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
          ...naKlik,
        });
        if (vast) break;
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
  console.log(JSON.stringify({ kolomBreedte, rijen, tabrijen, dubbeleIds }, null, 2));
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
  console.log(`\n## Dubbele id's: ${dubbeleIds.length} pagina's\n`);
  for (const d of dubbeleIds) console.log(`- ${naam(d.les)}: ${d.dubbel.join(', ')}`);
  console.log(`\nDe les gebruikt ${kolomBreedte}% van de breedte naast de lessenlijst.`);
}
