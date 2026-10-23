import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

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

  it('cross-links gebruikt de gebouwde bundles en wacht dus niet op de tests', () => {
    const crossLinks = job('cross-links');
    expect(crossLinks).toMatch(/^ {4}needs: \[plan, build, voorraad\]$/m);
    expect(crossLinks).toContain("pattern: '*-gebouwd'");
  });

  it('de verplichte check build telt publiceer mee, als de build nodig was', () => {
    const klaar = job('build-klaar');
    expect(klaar).toContain('needs: [plan, test, build, publiceer, voorraad, checks, cross-links]');
    expect(klaar).toContain('oordeel publiceer "$PUBLICEER" "$NODIG_BUILD"');
  });
});
