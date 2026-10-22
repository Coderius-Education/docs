import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// scripts/controleer-tekst.mjs neemt een site-id of lesbestanden. Twee
// fouten gaven een vals beeld: het eerste argument werd altijd overgeslagen
// (dus `fullstack` controleerde elke site), en een bestandsnaam leverde stil
// "0 fouten" op, omdat geen site zo heette.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

function draai(...args: string[]) {
  const r = spawnSync('node', ['scripts/controleer-tekst.mjs', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_ACTIONS: '' },
  });
  const meldingen = r.stdout.split('\n').filter((l) => /^sites\/\S+:\d+ /.test(l));
  return { status: r.status, uit: r.stdout, fout: r.stderr, meldingen };
}

describe('controleer-tekst.mjs', () => {
  it('een site-id als eerste argument beperkt de controle tot die site', () => {
    const { meldingen } = draai('fullstack');
    expect(meldingen.filter((m) => !m.startsWith('sites/informatica/fullstack/'))).toEqual([]);
  });

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
