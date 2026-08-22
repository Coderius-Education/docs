import { describe, expect, it } from 'vitest';
import { leesEditorHash, maakEditorLink, verdientEditorLink } from './codeLink';

describe('editor-links', () => {
  it('codeert en decodeert code verliesvrij, inclusief unicode', () => {
    const code = "from machine import Pin\n\nlampje = Pin('LED', Pin.OUT)\n# café ünïcode → test\n";
    const link = maakEditorLink(code);
    expect(link.startsWith('/editor#code=')).toBe(true);
    expect(leesEditorHash(link.slice('/editor'.length))).toBe(code);
  });

  it('geeft null voor een hash zonder code', () => {
    expect(leesEditorHash('')).toBeNull();
    expect(leesEditorHash('#anders')).toBeNull();
  });

  it('geeft null voor kapotte base64 in plaats van te crashen', () => {
    expect(leesEditorHash('#code=%%%niet-base64')).toBeNull();
  });

  it('geeft null voor een afgeknotte lege hash (#code=)', () => {
    // '' zou anders de bewaarde code van de leerling kunnen wissen
    expect(leesEditorHash('#code=')).toBeNull();
  });
});

describe('verdientEditorLink', () => {
  it('wel voor een gewoon runnable blok', () => {
    expect(verdientEditorLink('from machine import Pin\n')).toBe(true);
  });

  it('niet voor REPL-transcripten', () => {
    expect(verdientEditorLink('>>> 1 + 1\n2\n')).toBe(false);
  });

  it('niet voor ingesprongen fragmenten (horen in een groter script)', () => {
    expect(verdientEditorLink('    if kleur_links == "black":\n        pass\n')).toBe(false);
  });

  it('niet als de auteur geen-editor-link meegeeft', () => {
    expect(verdientEditorLink('x = 1\n', 'geen-editor-link')).toBe(false);
  });
});
