import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Een project van de route machine learning noemt in zijn :::info de Python
// die het gebruikt: "`random.choice` uit [een les](site:…)". Bij de review
// bleek dat zo'n link vaker meer belooft dan de les geeft: `min` wees naar
// een les met alleen `min(lijst)`, `random.choice` naar een project waar het
// alleen in een onderzoeksvraag stond. Deze test eist dat elke term in
// backticks vóór "uit [les](site:…)" ook echt op die les staat.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));
const PYTHON = fileURLToPath(new URL('../../../python/docs/', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) => {
    const pad = join(map, e.name);
    if (e.isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(e.name) ? [pad] : [];
  });
}

/** Route op de site → bestand. Python zet de cijferprefixen er niet in, algoritmes wel. */
const lessen = new Map<string, string>();
for (const pad of bestanden(PYTHON)) {
  const route = relative(PYTHON, pad)
    .replace(/\.mdx?$/, '')
    .split('/')
    .map((deel) => deel.replace(/^\d+-/, ''))
    .join('/');
  lessen.set(`python/docs/${route}`, pad);
}
for (const pad of bestanden(DOCS)) {
  lessen.set(`algorithms/docs/${relative(DOCS, pad).replace(/\.mdx?$/, '')}`, pad);
}

/** `.split()` → split, `random.randint(1, 6)` → random.randint. */
function kern(term: string): string {
  return term.replace(/^\./, '').split('(')[0];
}

const projecten = bestanden(DOCS).filter((p) => /\/ml-[a-z]+\//.test(p));

describe('de :::info van een project belooft niets wat de les niet geeft', () => {
  it('er zijn projecten om te controleren', () => {
    expect(projecten.length).toBeGreaterThanOrEqual(15);
  });

  for (const pad of projecten) {
    it(relative(DOCS, pad), () => {
      const tekst = readFileSync(pad, 'utf8');
      const info = tekst.match(/^:::info\n([\s\S]*?)\n:::/m)?.[1] ?? '';
      const fout: string[] = [];
      let vorige = 0;
      for (const m of info.matchAll(/uit\s+\[[^\]]*\]\(site:([^)#]+)(?:#[^)]*)?\)/g)) {
        const zin = info.slice(vorige, m.index);
        vorige = (m.index ?? 0) + m[0].length;
        const termen = [...zin.matchAll(/`([^`]+)`/g)].map((t) => kern(t[1]));
        if (termen.length === 0) continue;
        const doel = lessen.get(m[1]);
        if (!doel) {
          fout.push(`site:${m[1]} bestaat niet`);
          continue;
        }
        const daar = readFileSync(doel, 'utf8');
        for (const term of termen) {
          if (!daar.includes(term)) fout.push(`\`${term}\` staat niet op site:${m[1]}`);
        }
      }
      expect(fout).toEqual([]);
    });
  }
});
