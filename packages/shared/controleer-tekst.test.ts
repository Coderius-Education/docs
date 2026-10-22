import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { leesArgumenten } from '../../scripts/tekst-argumenten.mjs';

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
