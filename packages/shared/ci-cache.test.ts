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

describe('de webpack-cache in build.yml', () => {
  for (const job of ['build', 'voorraad']) {
    it(`${job}: sleutel op de bouwomgeving, terug na de install en vóór de build`, () => {
      const s = stappen(job);
      const map = s[plek(s, 'Map en cache-sleutels')];
      expect(map?.tekst).toMatch(/site-hash\.mjs \$\{\{ matrix\.site \}\} --omgeving/);
      const terug = plek(s, 'Webpack-cache van');
      expect(terug).toBeGreaterThan(plek(s, 'Install dependencies'));
      expect(terug).toBeLessThan(plek(s, 'Build ${{ matrix.site }}'));
      expect(s[terug].uses).toMatch(/^actions\/cache\/restore@/);
      expect(s[terug].tekst).toMatch(/path: .*\/node_modules\/\.cache\/webpack$/m);
      expect(s[terug].tekst).toContain('restore-keys: ${{ steps.map.outputs.webpack }}-');
    });
  }

  it('build: een volledige run bouwt koud, en bewaart daarna een verse cache', () => {
    const s = stappen('build');
    expect(s[plek(s, 'Webpack-cache van')].if).toBe("needs.plan.outputs.volledig != 'true'");
    const bewaren = s[plek(s, 'Webpack-cache bewaren')];
    expect(bewaren.uses).toMatch(/^actions\/cache\/save@/);
    expect(plek(s, 'Webpack-cache bewaren')).toBeGreaterThan(plek(s, 'Build ${{ matrix.site }}'));
    // Op een PR met een cache van main niet nog eens bewaren.
    expect(bewaren.if).toContain("github.event_name != 'pull_request'");
    expect(bewaren.if).toContain("steps.webpack.outputs.cache-matched-key == ''");
  });

  it('voorraad bewaart geen webpack-cache: die site verandert in deze run niet', () => {
    expect(plek(stappen('voorraad'), 'Webpack-cache bewaren')).toBe(-1);
  });
});
