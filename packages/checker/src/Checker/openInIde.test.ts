import { describe, expect, it } from 'vitest';
import type { ProjectFiles } from '../types';
import { pickEntry } from './openInIde';

function files(...paths: string[]): ProjectFiles {
  return Object.fromEntries(
    paths.map((path) => [
      path,
      {
        path,
        kind: path.endsWith('.html') ? 'html' : 'other',
        content: '',
        sizeBytes: 0,
        tooLarge: false,
      },
    ]),
  );
}

describe('pickEntry — welk bestand opent de editor', () => {
  it('kiest index.html in de hoofdmap', () => {
    expect(pickEntry(files('over.html', 'index.html', 'css/stijl.css'))).toBe('index.html');
  });

  it('kiest de minst diep genestelde index.html als die niet in de hoofdmap staat', () => {
    expect(pickEntry(files('a/b/index.html', 'site/index.html'))).toBe('site/index.html');
  });

  it('valt terug op het alfabetisch eerste html-bestand', () => {
    expect(pickEntry(files('zebra.html', 'appel.html'))).toBe('appel.html');
  });

  it('geeft null als er geen html-bestand is', () => {
    expect(pickEntry(files('script.js', 'stijl.css'))).toBeNull();
  });
});
