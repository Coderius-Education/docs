import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { kies, leesArgumenten } from '../../scripts/tekst-argumenten.mjs';

// scripts/controleer-tekst.mjs neemt een site-id of lesbestanden. Twee
// fouten gaven een vals beeld: het eerste argument werd altijd overgeslagen
// (dus `fullstack` controleerde elke site), en een bestandsnaam leverde stil
// "0 fouten" op, omdat geen site zo heette.
//
// De argumenten leest een losse functie; die test zonder het script te
// starten. Het script zelf draait hier alleen op twee bestanden en op wat
// het weigert: over een hele site kostte het een seconde rekentijd, naast
// andere tests die hun eigen tijd meten.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SITES = new Set(['fullstack', 'python']);

function draai(...args: string[]) {
  const r = spawnSync('node', ['scripts/controleer-tekst.mjs', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_ACTIONS: '' },
  });
  const meldingen = r.stdout.split('\n').filter((l) => /^sites\/\S+:\d+ /.test(l));
  return { status: r.status, fout: r.stderr, meldingen };
}

describe('de argumenten van controleer-tekst', () => {
  it('een site-id als eerste argument telt', () => {
    expect(leesArgumenten(['fullstack'], SITES).sites).toEqual(['fullstack']);
    expect(leesArgumenten(['fullstack', '--streng'], SITES)).toMatchObject({
      sites: ['fullstack'],
      streng: true,
    });
  });

  it('het pad na --regels is geen site of bestand', () => {
    expect(leesArgumenten(['--regels', 'changed.json', 'python'], SITES)).toEqual({
      streng: false,
      regelsPad: 'changed.json',
      sites: ['python'],
      bestanden: [],
    });
  });

  it('wat geen site is, is een bestand', () => {
    expect(leesArgumenten(['docs/a.mdx', 'fullstack'], SITES)).toMatchObject({
      sites: ['fullstack'],
      bestanden: ['docs/a.mdx'],
    });
  });
});

describe('welke sites en bestanden meedoen', () => {
  const ALLE = [
    { id: 'fullstack', dir: 'sites/informatica/fullstack' },
    { id: 'python', dir: 'sites/informatica/python' },
    { id: 'web', dir: 'sites/informatica/web' },
  ];
  const ids = (k: ReturnType<typeof kies>) => k.sites.map((s) => s.id);

  it('zonder argumenten alles', () => {
    const k = kies(ALLE, [], new Set());
    expect(ids(k)).toEqual(['fullstack', 'python', 'web']);
    expect(k.telt('web', 'sites/informatica/web/docs/a.mdx')).toBe(true);
  });

  it('een site en een bestand van een andere site tellen op', () => {
    // Eerst hielden ze elkaar tegen: het bestand viel weg met "Geen lestekst".
    const bestand = 'sites/informatica/fullstack/docs/a.mdx';
    const k = kies(ALLE, ['python'], new Set([bestand]));
    expect(ids(k)).toEqual(['fullstack', 'python']);
    expect(k.telt('fullstack', bestand)).toBe(true);
    expect(k.telt('fullstack', 'sites/informatica/fullstack/docs/b.mdx')).toBe(false);
    expect(k.telt('python', 'sites/informatica/python/docs/c.mdx')).toBe(true);
  });
});

describe('controleer-tekst.mjs', () => {
  it('een bestand als argument controleert alleen dat bestand', () => {
    const a = 'sites/informatica/fullstack/src/pages/docenten.mdx';
    const b = 'sites/informatica/algorithms/src/pages/docenten.mdx';
    const { status, meldingen } = draai(a, b);
    expect(status).toBe(0);
    expect(meldingen.filter((m) => !m.startsWith(`${a}:`) && !m.startsWith(`${b}:`))).toEqual([]);
  });

  it('weigert wat geen site en geen lesbestand is', () => {
    const onbekend = draai('bestaat-niet.mdx');
    expect(onbekend.status).toBe(2);
    expect(onbekend.fout).toContain('Onbekend argument');
    const buiten = draai('CLAUDE.md');
    expect(buiten.status).toBe(2);
    expect(buiten.fout).toContain('Geen lestekst');
  });
});
