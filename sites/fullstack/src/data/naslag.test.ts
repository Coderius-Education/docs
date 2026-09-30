import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// Wat een leerling in de lessen leest, moet hij terugvinden op de plek waar
// hij gaat zoeken: in de navbar, in zijn eigen browser en in zijn terminal.
//
// De pagina met fouten heette in 21 lessen "de troubleshooting pagina", in de
// navbar "Er gaat iets mis" en op de installatiepagina "Troubleshooting". De
// ontwikkelaarstools gaven de Engelse labels (Request Method) waar een
// Nederlandse Chrome "Verzoekmethode" toont.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const lessen = [...alleLesbestanden(`${SITE}/docs`), ...alleLesbestanden(`${SITE}/src/pages`)];
const lees = (pad: string) => readFileSync(pad, 'utf8');
const kort = (pad: string) => pad.slice(SITE.length + 1);

describe('naslag en gereedschap', () => {
  it('een link naar de foutenpagina heet zoals in de navbar: Er gaat iets mis', () => {
    const fout = lessen.flatMap((pad) =>
      [...lees(pad).matchAll(/\[([^\]]+)\]\(\/docs\/troubleshooting[#)]/g)]
        .filter((m) => !m[1].startsWith('Er gaat iets mis'))
        .map((m) => `${kort(pad)}: [${m[1]}]`),
    );
    expect(fout).toEqual([]);
  });

  // Engels label → het label van een Nederlandse Chrome (front_end/core/i18n/
  // locales/nl.json). Staat het Engelse label in een les, dan ook het
  // Nederlandse.
  const LABELS: Record<string, string> = {
    'Request URL': 'Verzoek-URL',
    'Request Method': 'Verzoekmethode',
    'Status Code': 'Statuscode',
    'Preserve log': 'Logboek behouden',
    'Disable cache': 'Cache uitzetten',
  };

  it.each(Object.entries(LABELS))('naast "%s" staat ook "%s"', (engels, nederlands) => {
    const zonder = lessen
      .filter((pad) => lees(pad).includes(engels) && !lees(pad).includes(nederlands))
      .map(kort);
    expect(zonder).toEqual([]);
  });

  it('de les die de eerste terminalregel belooft, legt de favicon-404 uit', () => {
    const tekst = lees(`${SITE}/docs/FastAPI/devtools-netwerk.mdx`);
    expect(tekst).toContain('GET /favicon.ico HTTP/1.1" 404 Not Found');
  });
});
