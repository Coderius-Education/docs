import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { stukken } from '../components/CodeEditor/onderzoek';
import { onderzoekVan } from './onderzoekUitLes';

// De onderzoeksvragen (Investigate) stonden in een lijst onder het hoofdveld.
// Voor elke vraag scrolde de leerling omhoog naar de code en weer omlaag naar
// de volgende vraag, en een antwoord om zijn bevinding naast te leggen was er
// niet (issue #154). Nu staan ze in het hoofdveld zelf, boven de code, elk
// met een uitklapbaar antwoord: `onderzoek={onderzoek}` op de eerste
// <CodeEditor> onder "## Probeer en onderzoek", met de vragen in een
// `export const onderzoek = [...]` onder de H1.

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
  .filter((les) => les.inhoud.includes('<CodeEditor'));

/** Tekst buiten de stukken tussen backticks. */
const proza = (tekst: string) =>
  stukken(tekst)
    .filter((s) => !s.code)
    .map((s) => s.tekst)
    .join('');

describe('de onderzoeksvragen staan in het oefenveld', () => {
  it('er zijn lessen met een oefenveld', () => {
    expect(lessen.length).toBeGreaterThan(30);
  });

  it.each(lessen.map((l) => [l.naam, l.inhoud]))(
    '%s: geen losse Investigate-lijst meer',
    (_, inhoud) => {
      expect(inhoud).not.toMatch(/^## Investigate/m);
      expect(inhoud).not.toMatch(/^## Probeer het zelf/m);
      expect(inhoud.match(/^## Probeer en onderzoek$/gm)).toHaveLength(1);
    },
  );

  it.each(lessen.map((l) => [l.naam, l.inhoud]))(
    '%s: geen Voorspel-blok onder het hoofdveld',
    (_, inhoud) => {
      // Onder het veld kan de leerling het al uitproberen, dus voorspellen is
      // daar geen voorspellen meer. Zo'n vraag hoort in Predict, of als
      // onderzoeksvraag in het paneel. De aanwijzing "probeer eerst zelf" staat
      // in het paneel zelf, niet als vaste zin in elke les.
      const sectie = inhoud.split(/^## Probeer en onderzoek$/m)[1]?.split(/^## /m)[0] ?? '';
      expect(sectie).not.toMatch(/<summary>Voorspel/);
      expect(inhoud).not.toContain('De vragen staan boven in het veld');
    },
  );

  it.each(lessen.map((l) => [l.naam, l.inhoud]))(
    '%s: het hoofdveld draagt de vragen',
    (_, inhoud) => {
      const velden = [...inhoud.matchAll(/<CodeEditor[\s\S]*?\/>/g)].map((m) => m[0]);
      expect(velden.filter((v) => v.includes('onderzoek={onderzoek}'))).toHaveLength(1);
      // Het eerste veld van de les, en het eerste onder "Probeer en onderzoek".
      expect(velden[0]).toContain('onderzoek={onderzoek}');
      const sectie = inhoud.split(/^## Probeer en onderzoek$/m)[1]?.split(/^## /m)[0] ?? '';
      expect(sectie).toContain('onderzoek={onderzoek}');
    },
  );

  it.each(lessen.map((l) => [l.naam, l.inhoud]))(
    '%s: drie of meer vragen, elk met een antwoord',
    (_, inhoud) => {
      const vragen = onderzoekVan(inhoud);
      expect(vragen).not.toBeNull();
      expect(inhoud.indexOf('export const onderzoek')).toBeGreaterThan(inhoud.search(/^# /m));
      expect((vragen ?? []).length).toBeGreaterThanOrEqual(3);
      for (const { vraag, antwoord } of vragen ?? []) {
        expect(vraag.trim().length).toBeGreaterThan(10);
        expect(antwoord.trim().length).toBeGreaterThan(10);
        for (const t of [vraag, antwoord]) {
          // Een open backtick maakt van de rest van de zin geen code.
          expect(t.split('`').length % 2, t).toBe(1);
          // De schrijfgids: geen uitroeptekens in lestekst. pnpm tekst leest
          // deze zinnen niet, want ze staan in JavaScript.
          expect(proza(t), t).not.toContain('!');
        }
        expect(vraag.trim(), vraag).toMatch(/[?.]$/);
        expect(antwoord.trim(), antwoord).toMatch(/[.)]$/);
      }
    },
  );
});

describe('het paneel met de vragen', () => {
  const bron = readFileSync(
    fileURLToPath(new URL('../components/CodeEditor/CodeEditor.tsx', import.meta.url)),
    'utf8',
  );
  const css = readFileSync(
    fileURLToPath(new URL('../components/CodeEditor/CodeEditor.module.css', import.meta.url)),
    'utf8',
  );

  it('staat ook in de gebouwde HTML, niet alleen in de browser', () => {
    // De editor zit in <BrowserOnly>. Stond het paneel alleen daarbinnen, dan
    // ontbraken de vragen in de HTML van de build: zonder JavaScript was er
    // niets, en tot de editor geladen was ook niet. De oude Investigate-lijst
    // was gewone tekst en stond er wel.
    const wrapper = bron.slice(bron.indexOf('export function CodeEditor('));
    expect(wrapper).toMatch(/<BrowserOnly fallback=\{fallback\}/);
    expect(wrapper.slice(0, wrapper.indexOf('<BrowserOnly'))).toMatch(/<Onderzoek vragen=/);
  });

  it('drukt de code niet weg als het veld het scherm vult', () => {
    // Groter en volledig scherm zijn zo hoog als het scherm. Met alle vijf
    // antwoorden van pseudo-klassen open bleef er van de code 233px over.
    expect(css).toMatch(
      /\.containerUitgeklapt \.onderzoek\s*\{[^}]*max-height:[^}]*overflow-y:\s*auto/,
    );
  });
});
