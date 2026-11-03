import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Elk Gelukt-blok in Veiligheid belooft iets wat de leerling ziet. CI doet
// dat na met src/gelukt/draai.py (job fullstack): die volgt de markers in de
// les. Deze test eist dat elk Gelukt-blok zegt hoe het nagedaan wordt (een
// script, een adres, of met de hand met een reden), en dat elk script dat
// draait eerder in de reeks als bestand is neergezet. Vier leerling-doorlopen
// deden dit eerst met de hand; zonder deze test verandert een les stil.

const VEILIGHEID = fileURLToPath(new URL('../../docs/veiligheid', import.meta.url));
type Categorie = { type: string; items: string[] };
const reeksen = (sidebars.veiligheidSidebar as unknown as (string | Categorie)[])
  .filter((c): c is Categorie => typeof c !== 'string' && c.type === 'category')
  .map((c) => c.items.map((id) => id.slice('veiligheid/'.length)));

const MARKER = /\{\/\*\s*(bestand|weg|draai|draai-ook|open|gelukt-met-de-hand):\s*(.*?)\s*\*\/\}/g;

describe('elk Gelukt-blok in Veiligheid wordt nagedaan', () => {
  for (const lessen of reeksen) {
    const reeks = lessen[0].split('/')[0];
    it(reeks, () => {
      const fout: string[] = [];
      const bestanden = new Set<string>();
      for (const les of lessen.filter((l) => !l.endsWith('/praktijk'))) {
        const tekst = readFileSync(join(VEILIGHEID, `${les}.mdx`), 'utf8');
        for (const m of tekst.matchAll(MARKER)) {
          const [soort, waarde] = [m[1], m[2]];
          const script = waarde.split(';')[0].trim();
          if (soort === 'bestand') bestanden.add(waarde);
          if ((soort === 'draai' || soort === 'draai-ook') && !bestanden.has(script))
            fout.push(`${les}: ${script} draait voordat het als bestand is neergezet`);
          if (soort === 'gelukt-met-de-hand' && waarde.length < 10)
            fout.push(`${les}: met de hand zonder reden`);
        }
        const blok = tekst.match(/^<Gelukt>$([\s\S]*?)^<\/Gelukt>$/m)?.[1] ?? '';
        const hoe = [...blok.matchAll(MARKER)].filter((m) =>
          ['draai', 'open', 'gelukt-met-de-hand'].includes(m[1]),
        );
        if (hoe.length === 0) fout.push(`${les}: het Gelukt-blok zegt niet hoe het nagedaan wordt`);
      }
      expect(fout).toEqual([]);
    });
  }
});
