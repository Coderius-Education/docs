import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { voorstelOnderdelen } from '@coderius/checker/levelSummary';
import { analyze } from '@coderius/checker/matchConcepts';
import type { CheckReport, ProjectFiles } from '@coderius/checker/types';
import { moeilijkheidVoorstel } from '@coderius/shared/leerdoelen';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import leerdoelen from '../leerdoelen.json';
import { fullstackConfig } from './config';

// Het eindproject van de hele FastAPI-route, met de uitbreidingen (htmx,
// cookies, sessies) en Afronden, door de nakijker. src/controle/uitbreidingen.py
// bouwt het uit de lessen zelf: de basis is letterlijk de laatste stand van
// main.py, en elke uitbreiding voegt toe wat de hoofdtekst zegt. Eerst ging
// alleen de basis (src/controle/referentie) door een test, en de fixture
// "compleet" is van vóór de accounts: of een leerling die de hele route
// afmaakt elk leerdoel haalt, zag geen test (review van november 2026).

const HIER = fileURLToPath(new URL('.', import.meta.url));
const SITE = join(HIER, '..', '..');
let map: string;
let eind: ProjectFiles;

function lees(wortel: string): ProjectFiles {
  const uit: ProjectFiles = {};
  const loop = (m: string) => {
    for (const item of readdirSync(m)) {
      const vol = join(m, item);
      if (statSync(vol).isDirectory()) {
        loop(vol);
        continue;
      }
      const path = relative(wortel, vol).split('\\').join('/');
      const kind = fullstackConfig.classify(path);
      const tekst = fullstackConfig.textKinds.includes(kind);
      uit[path] = {
        path,
        kind,
        content: tekst ? readFileSync(vol, 'utf8') : null,
        sizeBytes: statSync(vol).size,
        tooLarge: false,
      };
    }
  };
  loop(wortel);
  return uit;
}

/** Het script aanpassen.py zoals de les Een dictionary aanpassen het laat maken. */
function aanpassenUitDeLes(): ProjectFiles {
  const les = readFileSync(join(SITE, 'docs/FastAPI/sqlitedict/aanpassen.mdx'), 'utf8');
  const na = les.slice(les.indexOf('Maak `aanpassen.py`:'));
  const code = na.match(/```python[^\n]*\n([\s\S]*?)```/)?.[1];
  if (!code) throw new Error('aanpassen.mdx heeft geen blok na "Maak `aanpassen.py`:"');
  return {
    'aanpassen.py': {
      path: 'aanpassen.py',
      kind: 'py',
      content: code,
      sizeBytes: code.length,
      tooLarge: false,
    },
  };
}

beforeAll(() => {
  map = join(mkdtempSync(join(tmpdir(), 'fullstack-eind-')), 'project');
  const r = spawnSync('python3', [join(SITE, 'src/controle/uitbreidingen.py'), map], {
    encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error(`uitbreidingen.py faalde: ${r.stderr}`);
  // De scripts uit Gegevens opslaan staan in de projectmap, naast main.py:
  // "start je scripts vanuit de terminal in je projectmap" (database.mdx).
  eind = { ...lees(map), ...aanpassenUitDeLes() };
}, 60_000);

afterAll(() => rmSync(join(map, '..'), { recursive: true, force: true }));

const perId = (r: CheckReport) => new Map(r.concepts.map((c) => [c.id, c.used]));
const HANDMATIG = new Set(
  fullstackConfig.concepts.filter((c) => c.detect.type === 'handmatig').map((c) => c.id),
);

describe('het eindproject van de FastAPI-route', () => {
  it('haalt elk leerdoel van niveau 1 en 2 dat in de code te zien is', () => {
    const gevonden = perId(analyze(eind, fullstackConfig));
    const rijen = leerdoelen.concepten.filter((c) => c['1'] !== null || c['2'] !== null);
    const gemist = rijen.map((c) => c.id).filter((id) => !HANDMATIG.has(id) && !gevonden.get(id));
    expect(gemist).toEqual([]);
    // Handmatig zijn alleen de installatie en de ontwikkelaarstools.
    expect(rijen.filter((c) => HANDMATIG.has(c.id)).map((c) => c.id)).toEqual([
      'fastapi-installeren',
      'browser-devtools',
    ]);
  });

  it('een dictionary aanpassen staat alleen in het script uit de les, niet in de server', () => {
    // Daarom vraagt Project checken om de hele projectmap: met alleen main.py,
    // static/ en templates/ stond deze rij altijd op niet gebruikt.
    const alleenServer = perId(analyze(lees(map), fullstackConfig));
    expect(alleenServer.get('db-aanpassen')).toBe(false);
    expect(perId(analyze(eind, fullstackConfig)).get('db-aanpassen')).toBe(true);
    const pagina = readFileSync(join(SITE, 'src/pages/project-checken.mdx'), 'utf8');
    expect(pagina).toMatch(/projectmap/);
    expect(pagina).toMatch(/aanpassen\.py/);
  });

  it('geeft geen melding over bestanden die niet aansluiten', () => {
    expect(analyze(eind, fullstackConfig).samenhang?.map((f) => f.titel)).toEqual([]);
  });

  it('stelt het hoogste voor dat elk niveau heeft, en op niveau 3 zonder vinkjes niet aan basis', () => {
    const rapport = analyze(eind, fullstackConfig);
    const voorstel = (track: string) =>
      moeilijkheidVoorstel(voorstelOnderdelen(rapport, fullstackConfig, track));
    expect(voorstel('1').moeilijkheid).toBe('expert');
    // Niveau 2 heeft geen concept op expert: gevorderd is daar het hoogste.
    expect(leerdoelen.concepten.some((c) => c['2'] === 'expert')).toBe(false);
    expect(voorstel('2').moeilijkheid).toBe('gevorderd');
    // Niveau 3 gaat over Linux, Veiligheid en Online zetten: die staan niet
    // in het eindproject van de FastAPI-route, en Linux vinkt de docent aan.
    expect(voorstel('3').moeilijkheid).toBe('niet-aan-basis');
  });
});
