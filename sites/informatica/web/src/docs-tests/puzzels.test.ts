import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { gebreken, puzzelsIn } from '../../../../../packages/shared/components/Puzzel/controle';
import { regelsVan } from '../../../../../packages/shared/components/Puzzel/logica';

// Een paar lessen hebben een tabblad Puzzel: de regels van werkende code
// staan door elkaar, en de leerling zet ze in de goede volgorde (<Puzzel>,
// packages/shared/components/Puzzel; zie vakdidactiek, Parsons-puzzels). De
// puzzel keurt alleen de volgorde van de les goed, dus die moet de enige
// zijn. Dat kan een test maar voor een deel zien; wat hij wel ziet, staat
// hier.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

const lessen = readdirSync(DOCS, { withFileTypes: true })
  .filter((map) => map.isDirectory())
  .flatMap((map) =>
    readdirSync(join(DOCS, map.name))
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => ({
        naam: `${map.name}/${f}`,
        inhoud: readFileSync(join(DOCS, map.name, f), 'utf8'),
      })),
  )
  .filter((les) => les.inhoud.includes('<Puzzel'));

const exportVan = (inhoud: string, naam: string) =>
  new RegExp(`^export const ${naam} = \`([\\s\\S]*?)\`;`, 'm').exec(inhoud)?.[1];
const koppen = (inhoud: string) => [...inhoud.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
const sectie = (inhoud: string, kop: string) => {
  const start = inhoud.indexOf(`\n## ${kop}\n`);
  const eind = inhoud.indexOf('\n## ', start + 1);
  return inhoud.slice(start, eind === -1 ? undefined : eind);
};

// Regels die elke pagina of elk blok heeft: een kale tag zonder tekst, een
// accolade.
const SKELET = /^(<!DOCTYPE html>|<\/?[a-z0-9]+( lang="nl")?>|\}|\} else \{)$/;

describe('puzzels in de web-cursus', () => {
  it('staan in een paar lessen, niet in elke', () => {
    // "Alleen waar de volgorde het nieuwe is" (vakdidactiek). Een puzzel in
    // elke les is geen keuze meer.
    expect(lessen.length).toBeGreaterThanOrEqual(4);
    expect(lessen.length).toBeLessThanOrEqual(12);
  });

  it('hebben een eigen tabblad, na Probeer en onderzoek en vóór de eerste opdracht', () => {
    for (const { naam, inhoud } of lessen) {
      const rij = koppen(inhoud);
      const plek = rij.indexOf('Puzzel');
      expect(
        rij.filter((k) => k === 'Puzzel'),
        naam,
      ).toHaveLength(1);
      expect(rij[plek - 1], naam).toBe('Probeer en onderzoek');
      expect(rij[plek + 1], naam).toMatch(/^(Modify|Opdracht 1:)/);
      expect(inhoud.match(/<Puzzel\b/g), naam).toHaveLength(1);
      expect(sectie(inhoud, 'Puzzel'), naam).toContain('<Puzzel code={puzzel} taal="');
    }
  });

  it('zeggen wat de code moet doen, leggen de volgorde uit, en hebben korte regels', () => {
    // De vorm is in elke cursus dezelfde (`gebreken` in het gedeelde
    // onderdeel): de opdracht zegt dat de regels door elkaar staan en wat
    // boven wat hoort, er is uitleg als alles klopt, vijf tot twaalf regels,
    // en geen regel die afbreekt.
    for (const { naam, inhoud } of lessen)
      for (const puzzel of puzzelsIn(inhoud)) expect(gebreken(puzzel), naam).toEqual([]);
  });

  it('zijn geen kopie van het oefenveld', () => {
    for (const { naam, inhoud } of lessen) {
      const code = exportVan(inhoud, 'puzzel');
      expect(code, naam).toBeDefined();
      const regels = regelsVan(code ?? '').map((r) => r.tekst);
      // De puzzel is nieuwe code met wat de les aanleert, niet de startcode
      // die de leerling net draaide. Per regel, want een kopie met een regel
      // minder of een andere inspringing is nog steeds een kopie. Het skelet
      // (`<body>`, `</ul>`, `}`) telt niet: dat heeft elke pagina.
      const inhoud2 = regels.map((r) => r.trim()).filter((r) => !SKELET.test(r));
      expect(inhoud2.length, naam).toBeGreaterThanOrEqual(3);
      for (const m of inhoud.matchAll(/^export const (start\w+|make\w+) = `([\s\S]*?)`;/gm)) {
        const daar = new Set(m[2].split('\n').map((r) => r.trim()));
        const gedeeld = inhoud2.filter((r) => daar.has(r));
        expect(gedeeld.length * 2, `${naam}: ${m[1]} deelt ${gedeeld.join(' | ')}`).toBeLessThan(
          inhoud2.length,
        );
      }
    }
  });
});
