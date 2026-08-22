import { describe, expect, it } from 'vitest';
import { leesEditorHash, maakEditorLink } from './codeLink';

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
});
