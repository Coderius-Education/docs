import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De uitbreidingen bouwen voort op de basis én op elkaar. De leerling-doorloop
// vond vier manieren waarop dat stil misging:
// - Server of browser? zet een lengtecontrole in POST /gastenboek, en Cookies
//   en Sessies zeiden daarna "vervang door deze versie" met een blok zonder
//   die controle; Laat het zien beweerde vervolgens dat je controles werk doen;
// - het antwoord van Sessies opdracht 4 gaf een berichtenlijst zonder de link
//   naar de detailpagina uit Eén item tonen;
// - Server of browser? opdracht 4 zette code "onder wat er al staat" in
//   berichten.js, een bestand dat alleen een overslaanbare Make-opdracht maakte;
// - JavaScript erbij koppelde een script in de <head> van gastenboek_form.html,
//   dat in de basis geen <head> heeft;
// - htmx.mdx beloofde "dezelfde versie als op htmx.org", wat stil veroudert.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const STATIC = fileURLToPath(new URL('../../static', import.meta.url));

type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
const lessen = plat(sidebars.apiSidebar as unknown as Item[]);
const les = (id: string) => readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
const na = (id: string) => lessen.slice(lessen.indexOf(id) + 1);
const hoofdtekst = (id: string) => les(id).split('\n## Opdrachten\n')[0];
const opdrachten = (id: string) => les(id).split('\n## Opdrachten\n')[1] ?? '';
const blokken = (bron: string, taal: string) =>
  [...bron.matchAll(new RegExp(`\`\`\`${taal}[^\\n]*\\n([\\s\\S]*?)\`\`\``, 'g'))].map((m) => m[1]);

describe('een vervangend blok houdt wat een eerdere les erbij zette', () => {
  it('na Server of browser? houdt elk volledig POST /gastenboek de controle op de lengte', () => {
    const fout = na('FastAPI/in-de-browser/server-of-browser').flatMap((id) =>
      blokken(les(id), 'python')
        .filter((b) => b.includes('@app.post("/gastenboek")') && b.includes('SqliteDict'))
        .filter((b) => !b.includes('len(bericht) > 80'))
        .map(() => id),
    );
    expect(fout).toEqual([]);
  });

  it('na Eén item tonen houdt elke berichtenlijst de link naar de detailpagina', () => {
    const fout = na('FastAPI/een-item/detailpagina').flatMap((id) =>
      blokken(les(id), 'html')
        .filter((b) => b.includes('{% for sleutel, bericht in berichten %}'))
        .filter((b) => !b.includes('/bericht/{{ sleutel }}'))
        .map(() => id),
    );
    expect(fout).toEqual([]);
  });
});

describe('een opdracht gaat niet uit van een overgeslagen opdracht', () => {
  it('een JavaScript-bestand in een opdracht komt uit een hoofdtekst, of de opdracht koppelt het zelf', () => {
    const fout = lessen.flatMap((id, i) => {
      const bekend = lessen
        .slice(0, i + 1)
        .map(hoofdtekst)
        .join('\n');
      return opdrachten(id)
        .split(/\n(?=### )/)
        .flatMap((sectie) =>
          [...new Set([...sectie.matchAll(/static\/js\/([\w-]+\.js)/g)].map((m) => m[1]))]
            .filter((f) => !bekend.includes(`static/js/${f}`))
            .filter((f) => !sectie.includes(`<script src="/static/js/${f}"`))
            .map((f) => `${id}, ${sectie.split('\n')[0]}: ${f}`),
        );
    });
    expect(fout).toEqual([]);
  });

  it('wie een script in de <head> van gastenboek_form.html zet, hoort wat te doen zonder <head>', () => {
    // In de basis (Een formulier opslaan) heeft gastenboek_form.html geen <head>.
    const fout = na('FastAPI/formulier-opslaan/naam-opslaan').filter((id) => {
      const alineas = hoofdtekst(id).split('\n\n');
      const koppelt = alineas.some(
        (a) => a.includes('gastenboek_form.html') && a.includes('in de `<head>`'),
      );
      return koppelt && !/nog geen `<head>`/.test(hoofdtekst(id));
    });
    expect(fout).toEqual([]);
  });
});

describe('htmx-versie', () => {
  it('de les noemt de versie van het meegeleverde bestand, en vergelijkt niet met htmx.org', () => {
    const bestand = readFileSync(`${STATIC}/htmx/htmx.min.js`, 'utf8');
    const versie = bestand.match(/version:"([\d.]+)"/)?.[1];
    const tekst = les('FastAPI/zonder-herladen/htmx');
    expect(versie).toBeDefined();
    expect(tekst).toContain(`(versie ${versie})`);
    expect(tekst).not.toMatch(/dezelfde versie als/);
  });
});
