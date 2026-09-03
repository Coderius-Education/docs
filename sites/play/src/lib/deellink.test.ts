import { describe, expect, it } from 'vitest';
import { codeerDeelLink, decodeerDeelLink } from './deellink';

// De speeltuin zette de code als `btoa(encodeURIComponent(code))` in de
// URL-hash en las 'm terug met `decodeURIComponent(atob(...))`. Dat overleeft
// `é`, `→` en een hele emoji, maar encodeURIComponent gooit een URIError op
// een losse surrogate — een halve emoji, die een editor tijdens typen of
// plakken even kan bevatten. Die exception verdween in een lege `catch {}` en
// de deellink werd vanaf dat moment stilletjes niet meer bijgewerkt: je
// deelde de code van vijf minuten geleden. Het nieuwe formaat gaat via
// UTF-8-bytes en gooit nooit; oude links moeten blijven werken.

const OUD = (code: string) => btoa(encodeURIComponent(code));

describe('deellink', () => {
  it.each([
    ['ASCII', 'import play\n\nplay.new_circle(color="red")\n'],
    ['é', 'print("Café")'],
    ['pijl', 'print("links → rechts")'],
    ['emoji in een string', 'tekst = play.new_text(words="Score: 🎮 0")'],
    ['lege string', ''],
  ])('codeert en decodeert %s zonder verlies', (_naam, code) => {
    expect(decodeerDeelLink(codeerDeelLink(code))).toBe(code);
  });

  it('gooit niet op een losse surrogate, waar het oude formaat wél op stukliep', () => {
    const halveEmoji = 'print("\uD83C")';
    expect(() => OUD(halveEmoji)).toThrow(URIError);
    expect(() => codeerDeelLink(halveEmoji)).not.toThrow();
    // TextEncoder vervangt de halve emoji door U+FFFD; de link blijft bijwerken.
    expect(decodeerDeelLink(codeerDeelLink(halveEmoji))).toBe('print("\uFFFD")');
  });

  it('maakt een waarde die in een URL-hash past', () => {
    const waarde = codeerDeelLink('print("Café → 🎮")');
    expect(waarde).toMatch(/^u8-[A-Za-z0-9+/=]*$/);
  });

  it('leest een link in het oude btoa-formaat nog', () => {
    const code = 'import play\n\nplay.new_circle(color="red", radius=80)\n';
    expect(decodeerDeelLink(OUD(code))).toBe(code);
    expect(decodeerDeelLink(OUD(''))).toBe('');
  });

  it('verwart een nieuwe link nooit met een oude, ook niet bij procenttekens', () => {
    // Zonder de prefix zou "%41" als oud formaat gelezen worden en "A" opleveren.
    expect(decodeerDeelLink(codeerDeelLink('%41'))).toBe('%41');
  });

  it('geeft null bij rommel', () => {
    expect(decodeerDeelLink('%%%geen base64%%%')).toBeNull();
    expect(decodeerDeelLink('u8-%%%')).toBeNull();
    // Geldige base64, maar geen geldige UTF-8: 0xFF mag nergens staan.
    expect(decodeerDeelLink(`u8-${btoa('\xff\xfe')}`)).toBeNull();
    // Oud formaat met een kapotte procent-sequentie.
    expect(decodeerDeelLink(btoa('%E0%A4%A'))).toBeNull();
  });
});
