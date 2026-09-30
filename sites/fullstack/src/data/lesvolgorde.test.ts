import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Jinja2 kwam eerst binnen als bijzaak in "POST met templates", samen met een
// formulier: twee nieuwe dingen in één les. Nu heeft het een eigen les,
// "Templates met Jinja2", en die moet in de sidebar vóór elke les staan die
// een template gebruikt. Daarnaast noemt elke les het begrip dat hij leert in
// de titel, zodat een leerling die "404" of "redirect" zoekt de les vindt.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Item = string | { type: string; label: string; items: Item[] };

function plat(items: Item[]): string[] {
  return items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
}

const lessen = plat(sidebars.apiSidebar as unknown as Item[]);
const tekst = (id: string) => readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
const titel = (id: string) => tekst(id).match(/^# (.+)$/m)?.[1] ?? '';

describe('volgorde en titels van de FastAPI-lessen', () => {
  it('de eerste les met TemplateResponse is Templates met Jinja2', () => {
    const eerste = lessen.find((id) => tekst(id).includes('TemplateResponse'));
    expect(eerste).toBe('FastAPI/templates');
  });

  it('elke les heeft een eigen titel', () => {
    const titels = lessen.map(titel);
    expect(titels.filter((t, i) => titels.indexOf(t) !== i)).toEqual([]);
  });

  it.each([
    ['FastAPI/detailpagina', /path-parameters/],
    ['FastAPI/detailpagina', /404/],
    ['FastAPI/redirect', /redirect/],
    ['FastAPI/templates', /Jinja2/],
    ['FastAPI/database', /SqliteDict/],
    ['FastAPI/static_files', /static files/],
    ['FastAPI/lijst_tonen', /for-lus/],
  ])('de titel van %s noemt %s', (id, begrip) => {
    expect(titel(id)).toMatch(begrip);
  });

  it('geen categorie heet naar het voorbeeldproject', () => {
    const labels = (sidebars.apiSidebar as unknown as { label: string }[]).map((c) => c.label);
    expect(labels.filter((l) => /gastenboek/i.test(l))).toEqual([]);
  });
});
