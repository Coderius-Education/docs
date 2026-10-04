import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De eerste XSS-pagina liet de leerling alert("Hacked!") invullen en beloofde
// een pop-up met "Hacked."; en onder "Er gaat iets mis" stond dat je de tag
// als tekst ziet als de browser CSP aan heeft. CSP blokkeert het uitvoeren,
// het zet de tag niet als tekst op het scherm: dat doet escapen.

const LOW = readFileSync(
  fileURLToPath(new URL('../../docs/dvwa_tutorial/06-xss-reflected/low.mdx', import.meta.url)),
  'utf8',
);

describe('XSS reflected, low', () => {
  it('de beloofde pop-up toont de tekst uit het ingevulde script', () => {
    const ingevuld = LOW.match(/<script>alert\("([^"]+)"\);<\/script>/)?.[1];
    expect(ingevuld).toBeDefined();
    const belooft = LOW.match(/pop-up \(alert\) met de tekst `([^`]+)`/)?.[1];
    expect(belooft).toBe(ingevuld);
  });

  it('CSP wordt niet genoemd als reden dat je de tag als tekst ziet', () => {
    expect(LOW).not.toMatch(
      /letterlijk de tekst[^\n]*\n[^\n]*Content Security Policy \(CSP\)\* heeft ingeschakeld/,
    );
    expect(LOW).not.toMatch(/CSP\)\* heeft ingeschakeld/);
  });
});
