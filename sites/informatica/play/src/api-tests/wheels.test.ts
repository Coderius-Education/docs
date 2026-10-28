import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De wheels in static/whl/ komen uit scripts/play-wheels.py: uit een checkout
// van de play-repo (vóór een release), of van PyPI (erna). Het script schrijft
// in wheels-herkomst.json welk bestand waar vandaan komt. Wie een wheel met de
// hand wisselt, of het script half laat lopen, valt hier op.

const SITE = fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');
const WHL = join(SITE, 'static', 'whl');
const CODERUNNER = join(SITE, 'src', 'components', 'CodeRunner');
const engine = readFileSync(join(CODERUNNER, 'engine.js'), 'utf8');

type Wiel = { bestand: string; versie: string; bron: string; sha256: string };
const herkomst: Record<'coderius_play' | 'pymunk', Wiel> = JSON.parse(
  readFileSync(join(CODERUNNER, 'wheels-herkomst.json'), 'utf8'),
);

const sha256 = (bestand: string) =>
  createHash('sha256')
    .update(readFileSync(join(WHL, bestand)))
    .digest('hex');

/** De onderdelen van een wheel-naam; een build-tag maakt er zes van in plaats van vijf. */
const delen = (bestand: string) => bestand.replace(/\.whl$/, '').split('-');

describe('de wheels van de speeltuin en hun herkomst', () => {
  it('static/whl bevat precies de wheels uit de herkomst', () => {
    const wheels = readdirSync(WHL).filter((n) => n.endsWith('.whl'));
    expect(wheels.sort()).toEqual([herkomst.coderius_play.bestand, herkomst.pymunk.bestand].sort());
  });

  it('engine.js laadt precies die wheels', () => {
    expect(engine).toContain(`const PLAY_WHEEL = '/whl/${herkomst.coderius_play.bestand}';`);
    expect(engine).toContain(`const PYMUNK_WHEEL = '/whl/${herkomst.pymunk.bestand}';`);
  });

  it.each(['coderius_play', 'pymunk'] as const)('%s: de inhoud is wat de herkomst zegt', (naam) => {
    expect(sha256(herkomst[naam].bestand)).toBe(herkomst[naam].sha256);
  });

  // De service worker cachet wheels op bestandsnaam, "cache first". Had een
  // build uit de play-repo dezelfde naam als de latere release, dan bleef een
  // leerling na de release de oude build krijgen.
  it('een play-wheel die niet van PyPI komt, draagt een build-tag in zijn naam', () => {
    const { bestand, bron } = herkomst.coderius_play;
    expect(delen(bestand)).toHaveLength(bron === 'pypi' ? 5 : 6);
  });

  // De navbar wijst naar wat er nieuw is; na 3.5.0 stond daar nog "v3.4".
  it('de navbar noemt de versie van de play-wheel', () => {
    const config = readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8');
    const [groot, klein] = herkomst.coderius_play.versie.split('.');
    expect(config).toContain(`label: 'Nieuw: v${groot}.${klein}'`);
  });

  it('de pymunk-wheel is de versie die de play-wheel pint', () => {
    const metadata = execFileSync(
      'unzip',
      ['-p', join(WHL, herkomst.coderius_play.bestand), '*.dist-info/METADATA'],
      { encoding: 'utf8' },
    );
    expect(metadata).toMatch(/^Version: (\S+)$/m);
    expect(metadata.match(/^Version: (\S+)$/m)?.[1]).toBe(herkomst.coderius_play.versie);
    expect(metadata.match(/^Requires-Dist: pymunk==([\d.]+)/m)?.[1]).toBe(herkomst.pymunk.versie);
  });
});
