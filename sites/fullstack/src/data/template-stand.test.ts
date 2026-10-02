import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// templates/berichten.html groeit in drie basislessen: de lijst (Alles tonen),
// de verwijderknop (redirect) en de link naar de detailpagina. De laatste twee
// gaven alleen een losse for-lus, zonder te zeggen waar die kwam en zonder de
// hele template; main.py had wel een stand, de template niet. Een basisles die
// een stuk van berichten.html laat zien, toont daarom in de hoofdtekst ook de
// hele template ("Compleet voorbeeld" of "Zo ziet je templates/berichten.html
// er nu uit"), en daarin staat elke regel van dat stuk.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
const zijbalk = sidebars.apiSidebar as unknown as Item[];
const eersteUitbreiding = zijbalk.findIndex(
  (i) => typeof i !== 'string' && i.label.startsWith('Uitbreiding:'),
);
const basis = plat(zijbalk.slice(0, eersteUitbreiding));

const htmlBlokken = (tekst: string) =>
  [...tekst.matchAll(/```html\n([\s\S]*?)```/g)].map((m) => m[1]);
const regels = (html: string) =>
  html
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);

describe('de stand van templates/berichten.html', () => {
  it('elk stuk van berichten.html staat ook in een hele template in dezelfde les', () => {
    const fout: string[] = [];
    for (const id of basis) {
      const hoofd = readFileSync(`${DOCS}/${id}.mdx`, 'utf8').split('\n## Opdrachten\n')[0];
      const blokken = htmlBlokken(hoofd);
      const heel = blokken.filter(
        (b) => b.includes('<!DOCTYPE html>') && /in berichten %\}/.test(b),
      );
      const stukken = blokken.filter(
        (b) => !b.includes('<!DOCTYPE html>') && /in berichten %\}/.test(b),
      );
      for (const stuk of stukken) {
        const past = heel.some((h) => {
          const inHeel = new Set(regels(h));
          return regels(stuk).every((r) => inHeel.has(r));
        });
        if (!past) fout.push(`${id}: ${regels(stuk)[0]}`);
      }
    }
    expect(fout).toEqual([]);
  });
});
