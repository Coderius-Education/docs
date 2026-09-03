import { describe, expect, it } from 'vitest';
import { languageForPath } from './languages';

// De extensie bepaalt de highlighting nog vóór de runner geladen is.

describe('languageForPath', () => {
  it.each([
    ['main.py', 'python'],
    ['INDEX.HTML', 'html'],
    ['pagina.htm', 'html'],
    ['stijl.css', 'css'],
    ['app.js', 'javascript'],
    ['x.mjs', 'javascript'],
    ['data.json', 'json'],
    ['a.svg', 'xml'],
    ['notes.txt', 'plaintext'],
    ['README', 'plaintext'],
    ['archive.tar.gz', 'plaintext'],
    ['x.onbekend', 'plaintext'],
  ])('%s → %s', (path, taal) => {
    expect(languageForPath(path)).toBe(taal);
  });
});
