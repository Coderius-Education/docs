import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De intro beloofde "elke challenge heeft er drie" terwijl Dubbel er twee
// had, en nummer 14 van de aanbevolen volgorde (Base64) was een regel zonder
// link naar een pagina die niet bestaat. Deze test legt de intro naast de
// challenge-pagina's.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));
const intro = readFileSync(join(DOCS, 'intro.md'), 'utf8');

const challenges = ['code', 'forensics', 'hacking'].flatMap((cat) =>
  readdirSync(join(DOCS, cat))
    .filter((n) => n.endsWith('.md'))
    .map((n) => ({ pad: `${cat}/${n}`, tekst: readFileSync(join(DOCS, cat, n), 'utf8') })),
);
const hints = (tekst: string) => (tekst.match(/<summary>Hint \d+<\/summary>/g) ?? []).length;

describe('ctf: de intro en de challenges', () => {
  it('elk genummerd item in de aanbevolen volgorde linkt naar een bestaande challenge', () => {
    const volgorde = intro.slice(intro.indexOf('## Aanbevolen volgorde')).split(/\n## (?!#)/)[0];
    const items = [...volgorde.matchAll(/^(\d+)\. (.*)$/gm)];
    expect(items.length).toBeGreaterThan(0);
    expect(items.map((m) => +m[1])).toEqual(items.map((_, i) => i + 1));
    for (const [, nr, regel] of items) {
      const link = regel.match(/^\[[^\]]+\]\(\/docs\/([\w/-]+)\)/);
      expect(link, `item ${nr}: ${regel}`).not.toBeNull();
      expect(existsSync(join(DOCS, `${link?.[1]}.md`)), `item ${nr}`).toBe(true);
    }
  });

  it('wat de intro over het aantal hints zegt, klopt', () => {
    for (const c of challenges) expect(hints(c.tekst), c.pad).toBeGreaterThanOrEqual(2);
    if (/elke challenge heeft er drie/.test(intro)) {
      for (const c of challenges) expect(hints(c.tekst), c.pad).toBe(3);
    }
  });
});
