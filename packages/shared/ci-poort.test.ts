import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { RUNNERS, EIGEN_JOB, blokkenNodig } = require('./wijzigingen.js');

// De hostingbackend haalt elke `<site>-static` uit een run op, ook uit een
// mislukte run. De builds draaien tegelijk met de tests en uploaden
// `<site>-gebouwd`; alleen `publiceer` maakt er `<site>-static` van, en die
// wacht op groene tests. Zo kost het wachten op de tests geen bouwtijd meer,
// en gaat een nakijker met rode tests nog steeds niet live.

const workflow = readFileSync(
  new URL('../../.github/workflows/build.yml', import.meta.url),
  'utf8',
);

function job(naam: string): string {
  const begin = workflow.indexOf(`\n  ${naam}:\n`);
  expect(begin, `job ${naam} in build.yml`).toBeGreaterThan(-1);
  const rest = workflow.slice(begin + naam.length + 4);
  const eind = rest.search(/\n {2}[a-z-]+:\n/);
  return eind === -1 ? rest : rest.slice(0, eind);
}

const uploads = (tekst: string) =>
  [...tekst.matchAll(/uses: actions\/upload-artifact@\S+\n\s+with:\n\s+name: (.+)/g)].map(
    (m) => m[1],
  );

describe('de poort naar de hostingbackend', () => {
  it('build wacht niet op de tests en uploadt alleen <site>-gebouwd', () => {
    const build = job('build');
    expect(build).toMatch(/^ {4}needs: plan$/m);
    expect(uploads(build)).toEqual(['${{ matrix.site }}-gebouwd']);
  });

  it('alleen publiceer maakt <site>-static, na de build en groene (of overgeslagen) tests', () => {
    const publiceer = job('publiceer');
    expect(publiceer).toMatch(/^ {4}needs: \[plan, test, build\]$/m);
    expect(publiceer).toContain(
      "(needs.test.result == 'success' || needs.test.result == 'skipped')",
    );
    expect(publiceer).toContain('name: ${{ matrix.site }}-gebouwd');
    expect(uploads(publiceer)).toEqual(['${{ matrix.site }}-static']);
    // Nergens anders een -static: dan ging hij om de tests heen.
    const elders = workflow.replace(publiceer, '');
    expect(elders).not.toMatch(/name: \$\{\{ matrix\.site \}\}-static/);
  });

  // Een rode test die iemand later opnieuw draait, laat `publiceer` daarna
  // de bundle uit de eerste poging ophalen. Eerst bleef die één dag bestaan:
  // na een weekend publiceerde de herhaling niets meer. De test zelf heeft
  // `wijzigingen` nodig, dus zo lang moet de bundle minstens blijven.
  it('de gebouwde bundle blijft even lang als wijzigingen, voor een latere herhaling', () => {
    const bewaard = (naam: string) =>
      Number(
        workflow.match(
          new RegExp(`name: ${naam}\\n(?:\\s+[a-z-]+: .+\\n)*?\\s+retention-days: (\\d+)`),
        )?.[1],
      );
    expect(bewaard('wijzigingen')).toBeGreaterThanOrEqual(7);
    expect(bewaard('\\$\\{\\{ matrix\\.site \\}\\}-gebouwd')).toBe(bewaard('wijzigingen'));
  });

  it('cross-links gebruikt de gebouwde bundles en wacht dus niet op de tests', () => {
    const crossLinks = job('cross-links');
    expect(crossLinks).toMatch(/^ {4}needs: \[plan, build, voorraad\]$/m);
    expect(crossLinks).toContain("pattern: '*-gebouwd'");
  });

  it('de verplichte check build telt publiceer mee, als de build nodig was', () => {
    const klaar = job('build-klaar');
    expect(klaar).toMatch(
      /^ {4}needs: \[plan, test, build, publiceer, voorraad, checks, cross-links[,\]]/m,
    );
    expect(klaar).toContain('oordeel publiceer "$PUBLICEER" "$NODIG_BUILD"');
  });
});

// De blokrunners (godot, fullstack, python, …) draaien de codevoorbeelden uit
// de lessen. Ze telden eerst niet mee voor de verplichte check build: een PR
// met kapotte voorbeelden werd groen, en nu de builds niet meer op de tests
// wachten was build zelfs groen terwijl fullstack nog liep. Daarom geldt het
// voor elke job in de workflow: hij telt mee, of hij staat hieronder met een
// reden. Zo valt ook een nieuwe job op die niemand aan build-klaar toevoegde.
describe('de verplichte check build', () => {
  const TELT_NIET: Record<string, string> = {
    tekst: 'een spel- of stijlfout mag een merge niet tegenhouden (keuze van de opdrachtgever)',
  };
  // Zijn oordeel staat vast in plaats van uit het plan te komen.
  const VAST: Record<string, string> = {
    plan: 'true', // altijd nodig
    voorraad: 'false', // vult alleen de cache; cross-links oordeelt
  };

  const jobs = [...workflow.slice(workflow.indexOf('\njobs:\n')).matchAll(/^ {2}([a-z-]+):$/gm)]
    .map((m) => m[1])
    .filter((naam) => naam !== 'build-klaar');

  /** De plan-uitvoer die een job aanzet, uit zijn `if:` (ook over meer regels). */
  function aanzetter(naam: string): string | undefined {
    const blok = job(naam);
    const als = blok.match(/^ {4}if: [\s\S]*?(?=\n {4}[a-z-]+:)/m)?.[0] ?? '';
    return als.match(/needs\.plan\.outputs\.([a-z]+) == 'true'/)?.[1];
  }

  const klaar = job('build-klaar');
  const needs = klaar.match(/^ {4}needs: \[(.+)\]$/m)?.[1].split(', ') ?? [];
  const env = Object.fromEntries(
    [...klaar.matchAll(/^ {10}([A-Z_]+): \$\{\{ (.+) \}\}$/gm)].map((m) => [m[1], m[2]]),
  );
  const oordelen = Object.fromEntries(
    [...klaar.matchAll(/^ {10}oordeel ([a-z-]+) "\$([A-Z_]+)" (\S+)$/gm)].map((m) => [
      m[1],
      { resultaat: m[2], nodig: m[3] },
    ]),
  );

  it('vindt de jobs, ook de blokrunners', () => {
    expect(jobs).toEqual(
      expect.arrayContaining([
        'plan',
        'test',
        'build',
        'publiceer',
        'cross-links',
        'fullstack',
        'blokken',
      ]),
    );
  });

  it('telt elke job mee, behalve met een reden', () => {
    const vergeten = jobs.filter((naam) => !(naam in TELT_NIET) && !needs.includes(naam));
    expect(vergeten).toEqual([]);
    for (const naam of Object.keys(TELT_NIET)) expect(needs, naam).not.toContain(naam);
  });

  it.each(jobs.filter((naam) => !(naam in TELT_NIET)))(
    '%s: oordeel op zijn eigen resultaat, en overgeslagen alleen als het plan hem niet nodig vond',
    (naam) => {
      const oordeel = oordelen[naam];
      expect(oordeel, `oordeel ${naam} in build-klaar`).toBeDefined();
      expect(env[oordeel.resultaat]).toBe(`needs.${naam}.result`);
      if (naam in VAST) {
        expect(oordeel.nodig).toBe(VAST[naam]);
        return;
      }
      const uitvoer = aanzetter(naam);
      expect(uitvoer, `${naam} hangt aan een plan-uitvoer`).toBeDefined();
      const nodig = oordeel.nodig.match(/^"\$([A-Z_]+)"$/)?.[1] ?? '';
      expect(env[nodig], naam).toBe(`needs.plan.outputs.${uitvoer}`);
    },
  );
});

// Vijf blokrunners draaien samen in de job `blokken`, de rest heeft een eigen
// job. Een runner die nergens draait, valt niet op: zijn job is er gewoon
// niet. Daarom moet elke runner uit RUNNERS een plek hebben.
describe('elke blokrunner draait ergens', () => {
  const blokken = job('blokken');
  const inBlokken = Object.keys(RUNNERS).filter((naam: string) => !EIGEN_JOB.includes(naam));
  const lus = blokken.match(/for naam in ([a-z ]+); do/)?.[1].split(' ') ?? [];

  it('een runner met een eigen job heeft die job', () => {
    for (const naam of EIGEN_JOB) {
      expect(job(naam)).toMatch(new RegExp(`if: needs\\.plan\\.outputs\\.${naam} == 'true'`));
    }
  });

  it.each(inBlokken)('%s: vlag uit het plan, een functie en een plek in de lus', (naam) => {
    expect(blokken).toContain(`BLOK_${naam.toUpperCase()}: \${{ needs.plan.outputs.${naam} }}`);
    expect(blokken).toMatch(new RegExp(`^ {10}${naam}_\\(\\) \\{$`, 'm'));
    expect(lus).toContain(naam);
  });

  it('de lus kent geen runner die niet in RUNNERS staat', () => {
    expect([...lus].sort()).toEqual([...inBlokken].sort());
  });

  it('blokken draait als één van zijn runners nodig is, en niet voor fullstack alleen', () => {
    const met = (aan: string[]) => ({
      runners: Object.fromEntries(
        Object.keys(RUNNERS).map((n: string) => [n, { draaien: aan.includes(n), alles: false }]),
      ),
    });
    expect(blokkenNodig(met([]))).toBe(false);
    expect(blokkenNodig(met(['fullstack']))).toBe(false);
    for (const naam of inBlokken) expect(blokkenNodig(met([naam])), naam).toBe(true);
  });
});
