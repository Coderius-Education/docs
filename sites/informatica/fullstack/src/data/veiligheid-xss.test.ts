import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De reeks XSS ging alleen over opgeslagen HTML: het gastenboek. Twee vormen
// uit DVWA ontbraken. Reflected XSS: de HTML zit in een link, en de server zet
// hem terug in de pagina zonder iets op te slaan (de les url, /zoek?term=). En
// DOM-XSS: JavaScript zet tekst met innerHTML in de pagina, en dan helpt
// escape() op de server niet, want de server ziet de tekst nooit (de les
// browser). Deze
// test pint de plek van die twee lessen vast, dat /zoek in elke latere stand
// blijft en escapet, en weert innerHTML met een waarde in de hele cursus,
// tenzij het blok {/* onveilig-voorbeeld: reden */} heeft.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const MAP = join(DOCS, 'veiligheid/xss');
const lees = (stap: string) => readFileSync(join(MAP, `${stap}.mdx`), 'utf8');
const blokken = (tekst: string, taal = 'python') =>
  [...tekst.matchAll(new RegExp(`\`\`\`${taal}[^\\n]*\\n([\\s\\S]*?)\`\`\``, 'g'))].map(
    (m) => m[1],
  );
const stand = (tekst: string) =>
  blokken(tekst.slice(tekst.indexOf('<summary>Zo ziet je `main.py` er nu uit')))[0] ?? '';

type Categorie = { label: string; items: string[] };
const reeks = (sidebars.veiligheidSidebar as unknown as (string | Categorie)[]).find(
  (c): c is Categorie => typeof c !== 'string' && c.items[0]?.startsWith('veiligheid/xss/'),
);
const stappen = (reeks?.items ?? []).map((i) => i.slice('veiligheid/xss/'.length));

function bestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

describe('HTML van een bezoeker (XSS)', () => {
  it('heeft reflected XSS na escapen, en DOM-XSS na |safe', () => {
    expect(stappen).toEqual([
      'gastenboek',
      'zwakheid',
      'escape',
      'url',
      'templates',
      'safe',
      'browser',
      'textcontent',
      'eigen-project',
      'praktijk',
    ]);
  });

  it('de zoekpagina zet de term eerst zonder escape terug, en de stand escapet hem', () => {
    const tekst = lees('url');
    expect(blokken(tekst)[0]).toContain('{term}</p>');
    expect(tekst).toMatch(/\{\/\* onveilig-voorbeeld: [^*]+\*\/\}\s*<CodeUitleg>\s*```python/);
    expect(stand(tekst)).toContain('{escape(term)}');
  });

  it('elke stand na de zoekpagina houdt /zoek, met escape om de term', () => {
    for (const stap of stappen.slice(stappen.indexOf('url'))) {
      const code = stand(lees(stap));
      if (!code) continue;
      expect(code, stap).toContain('@app.get("/zoek")');
      expect(code, stap).toContain('{escape(term)}');
    }
  });

  it('de les over innerHTML zegt waarom escape op de server niet helpt, en eindigt met textContent', () => {
    const tekst = lees('browser');
    expect(tekst).toContain('## Waarom `escape` op de server hier niet helpt');
    expect(blokken(tekst, 'js')[0]).toContain('voorbeeld.innerHTML = veld.value;');
    const js = blokken(lees('textcontent'), 'js');
    expect(js[0]).toContain('voorbeeld.textContent = veld.value;');
    expect(js.at(-1)).toContain('voorbeeld.textContent = veld.value;');
    expect(js.at(-1)).not.toContain('innerHTML');
  });

  it('de eerste les zegt dat het gastenboek van de reeks geen accounts heeft', () => {
    // De basis eindigt met accounts en een wachtwoordveld; dit gastenboek heeft
    // ze niet, en dat stond er niet bij.
    const tekst = lees('gastenboek');
    expect(tekst).toContain('zonder accounts');
    expect(tekst).toContain('wachtwoordveld');
  });

  it('de eerste les met hx-trigger="load, …" legt load en de komma uit', () => {
    // De htmx-lessen kennen alleen every; load en twee triggers met een komma
    // kwamen in de reeks zonder uitleg.
    const eerste = stappen.find((stap) => lees(stap).includes('hx-trigger="load, '));
    expect(eerste).toBe('gastenboek');
    const proza = lees('gastenboek').replace(/```[\s\S]*?```/g, '');
    expect(proza).toMatch(/`load`[^.]*geladen/);
    expect(proza).toMatch(/komma/);
  });

  it('de les over innerHTML zegt dat de link een tweede keer een 304 geeft', () => {
    // De les beloofde een regel met 200; open je de link opnieuw, dan staat er
    // 304 Not Modified (nagedraaid in Chromium).
    expect(lees('browser')).toContain('304 Not Modified');
  });

  it('een lijst-uitvoer in de hoofdtekst komt na "gastenboek.db weg" in dezelfde les', () => {
    // De opdrachten van les 3 en les 5 laten Noor een bericht schrijven. De les
    // erna beloofde een lijst met alleen Sara, en de leerling zag er een
    // <li> van Noor bij (nagedraaid). Wie een <li>-uitvoer belooft, laat eerst
    // de database weggooien.
    const fout: string[] = [];
    for (const stap of stappen) {
      const tekst = lees(stap);
      const mis = tekst.indexOf('\n## Er gaat iets mis\n');
      const hoofd = mis === -1 ? tekst : tekst.slice(0, mis);
      for (const m of hoofd.matchAll(/```(\w*)[^\n]*\n([\s\S]*?)```/g)) {
        if (!['', 'text'].includes(m[1]) || !m[2].includes('<li>')) continue;
        if (!hoofd.slice(0, m.index).includes('`gastenboek.db` weg')) {
          fout.push(`${stap}: ${m[2].split('\n').find((r) => r.includes('<li>'))}`);
        }
      }
    }
    expect(fout).toEqual([]);
  });

  it('de les die de lijst naar een template zet, noemt TemplateNotFound', () => {
    // Staat het template niet in templates/, dan geeft de lijst een 500, en
    // htmx laat een open pagina stil de oude lijst houden (nagedraaid).
    const eerste = stappen.find((stap) => lees(stap).includes('Jinja2Templates('));
    expect(eerste).toBe('templates');
    const mis = lees('templates').split(/^## Er gaat iets mis\s*$/m)[1] ?? '';
    expect(mis).toContain('### TemplateNotFound');
    expect(mis).toContain("not found in search path: 'templates'");
  });

  it('In je eigen project noemt de omleiding en het htmx-antwoord', () => {
    // Het eigen gastenboek antwoordt met een RedirectResponse, of na htmx met
    // een HTMLResponse; beide komen in de route voor.
    const tekst = lees('eigen-project');
    expect(tekst).toContain('RedirectResponse');
    expect(tekst).toContain('HTMLResponse');
  });

  for (const pad of bestanden(DOCS)) {
    const tekst = readFileSync(pad, 'utf8');
    if (!tekst.includes('innerHTML =')) continue;
    it(`${relative(DOCS, pad)}: innerHTML met een waarde alleen in een gemarkeerd onveilig voorbeeld`, () => {
      const fout: string[] = [];
      for (const m of tekst.matchAll(/```(?:js|javascript|html)[^\n]*\n([\s\S]*?)```/g)) {
        if (!/\.innerHTML\s*=/.test(m[1])) continue;
        const ervoor = tekst.slice(Math.max(0, (m.index ?? 0) - 300), m.index);
        const gemarkeerd = /\{\/\* onveilig-voorbeeld: \S[^*]*\*\/\}\s*(<CodeUitleg>\s*)?$/.test(
          ervoor,
        );
        if (!gemarkeerd) fout.push(m[1].split('\n').find((r) => r.includes('innerHTML')) ?? '');
      }
      expect(fout).toEqual([]);
    });
  }
});
