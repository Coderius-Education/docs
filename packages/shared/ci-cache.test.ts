import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// De webpack-cache van Docusaurus maakt een site-build drie tot vier keer zo
// snel, met dezelfde bestanden als een koude build. Dat blijft alleen zo als
// de stappen in build.yml kloppen: de sleutel is de bouwomgeving (een les
// telt niet mee, een plugin wel), de cache komt pas na de install terug (die
// maakt node_modules van de site), en een volledige run bouwt koud, zodat er
// elke nacht een build zonder cache naast staat.

type Stap = { tekst: string; name: string; uses: string; if: string };

const workflow = readFileSync(
  new URL('../../.github/workflows/build.yml', import.meta.url),
  'utf8',
);

/** De stappen van een job, als tekst, met naam, uses en if eruit gelezen. */
function stappen(job: string): Stap[] {
  const begin = workflow.indexOf(`\n  ${job}:\n`);
  expect(begin, `job ${job} in build.yml`).toBeGreaterThan(-1);
  const rest = workflow.slice(begin + job.length + 4);
  const eind = rest.search(/\n {2}[a-z-]+:\n/);
  const blok = eind === -1 ? rest : rest.slice(0, eind);
  return blok
    .split('\n      - ')
    .slice(1)
    .map((tekst) => ({
      tekst,
      name: tekst.match(/^(?:\s*)name: (.+)$/m)?.[1] ?? '',
      uses: tekst.match(/^(?:\s*)uses: (.+)$/m)?.[1] ?? '',
      if: tekst.match(/^\s*if: (.+)$/m)?.[1] ?? '',
    }));
}

const plek = (lijst: Stap[], deel: string) =>
  lijst.findIndex((s) => (s.name || s.uses).includes(deel));

const pad = (stap: Stap) => stap.tekst.match(/^\s*path: (.+)$/m)?.[1];
const sleutel = (stap: Stap) => stap.tekst.match(/^\s*key: (.+)$/m)?.[1];

describe('de webpack-cache in build.yml', () => {
  for (const job of ['build', 'voorraad']) {
    it(`${job}: één run van site-hash voor beide sleutels, terug na de install en vóór de build`, () => {
      const s = stappen(job);
      const map = s[plek(s, 'Map en cache-sleutels')];
      expect(map.tekst.match(/site-hash\.mjs/g)).toHaveLength(1);
      expect(map.tekst).toContain('--sleutels');
      const terug = plek(s, 'Webpack-cache van');
      expect(terug).toBeGreaterThan(plek(s, 'Install dependencies'));
      expect(terug).toBeLessThan(plek(s, 'Build ${{ matrix.site }}'));
      expect(s[terug].uses).toMatch(/^actions\/cache\/restore@/);
      expect(pad(s[terug])).toBe('${{ steps.map.outputs.dir }}/node_modules/.cache/webpack');
      expect(sleutel(s[terug])).toBe('${{ steps.map.outputs.webpack }}');
      // Geen terugval op een andere bouwomgeving: webpack ziet een
      // gewijzigde plugin niet.
      expect(s[terug].tekst).not.toContain('restore-keys');
      // home bouwt met Vite en heeft geen webpack-cache.
      expect(s[terug].if).toContain("steps.map.outputs.docusaurus == 'true'");
    });
  }

  it('build: een volledige run bouwt koud en kijkt alleen of de cache al bestaat', () => {
    const terug = stappen('build')[plek(stappen('build'), 'Webpack-cache van')];
    expect(terug.tekst).toContain("lookup-only: ${{ needs.plan.outputs.volledig == 'true' }}");
  });

  it('build: bewaart alleen op main, alleen als hij nog niet bestaat, onder dezelfde sleutel', () => {
    const s = stappen('build');
    const terug = s[plek(s, 'Webpack-cache van')];
    const bewaren = s[plek(s, 'Webpack-cache bewaren')];
    expect(bewaren.uses).toMatch(/^actions\/cache\/save@/);
    expect(plek(s, 'Webpack-cache bewaren')).toBeGreaterThan(plek(s, 'Build ${{ matrix.site }}'));
    expect(pad(bewaren)).toBe(pad(terug));
    expect(sleutel(bewaren)).toBe(sleutel(terug));
    // Eén voorwaarde die alle eisen samen stelt: geen PR, alleen main, geen
    // bestaande cache, en alleen voor Docusaurus.
    const voorwaarde = bewaren.tekst.slice(bewaren.tekst.indexOf('if: >-'));
    for (const eis of [
      "steps.map.outputs.docusaurus == 'true'",
      "github.ref == 'refs/heads/main'",
      "github.event_name != 'pull_request'",
      "steps.webpack.outputs.cache-hit != 'true'",
    ]) {
      expect(voorwaarde, eis).toContain(eis);
    }
    expect(voorwaarde).not.toMatch(/\|\|/);
  });

  it('build: een nieuwe cache ruimt de oude van die site op, met actions: write', () => {
    const s = stappen('build');
    const opruimen = s[plek(s, 'Oude webpack-caches')];
    expect(plek(s, 'Oude webpack-caches')).toBeGreaterThan(plek(s, 'Webpack-cache bewaren'));
    expect(opruimen.if).toBe("steps.bewaren.outcome == 'success'");
    expect(opruimen.tekst).toContain('grep -vxF "$HUIDIG"');
    const job = workflow.slice(
      workflow.indexOf('\n  build:\n'),
      workflow.indexOf('\n  voorraad:\n'),
    );
    expect(job).toMatch(/permissions:\n\s+contents: read\n\s+actions: write/);
  });

  it('voorraad bewaart geen webpack-cache: die site verandert in deze run niet', () => {
    expect(plek(stappen('voorraad'), 'Webpack-cache bewaren')).toBe(-1);
  });
});
