import { describe, expect, it } from 'vitest';
import type { ProjectFiles } from '../types';
import { ACK_SOURCE, MESSAGE_SOURCE, buildImportPayload, pickEntry } from './openInIde';

function files(...paths: string[]): ProjectFiles {
  return filesMet(Object.fromEntries(paths.map((path) => [path, ''])));
}

/** Zoals files(), maar met inhoud per pad (null = niet leesbaar, zoals readFiles.ts dat levert). */
function filesMet(inhoud: Record<string, string | null>): ProjectFiles {
  return Object.fromEntries(
    Object.entries(inhoud).map(([path, content]) => [
      path,
      {
        path,
        kind: path.endsWith('.html') ? 'html' : 'other',
        content,
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

// Het /import-contract met de IDE is een wire-format tussen twee apart
// gedeployde sites. De ontvanger (sites/ide/.../importContract.test.ts) pint
// dezelfde letterlijke strings; wie één kant wijzigt, ziet hier de andere.
describe('buildImportPayload — wat de nakijker naar de IDE stuurt', () => {
  it('gebruikt de gepinde wire-waarden van het contract', () => {
    expect(MESSAGE_SOURCE).toBe('coderius-website-checker');
    expect(ACK_SOURCE).toBe('coderius-editor-import');
    expect(buildImportPayload(files('index.html'), 'Vanuit de nakijker')).toEqual({
      source: 'coderius-website-checker',
      type: 'import-files',
      files: { 'index.html': '' },
      entry: 'index.html',
      name: 'Vanuit de nakijker',
    });
  });

  it('stuurt tekst en data-URLs mee en laat bestanden zonder inhoud weg', () => {
    const payload = buildImportPayload(
      filesMet({
        'index.html': '<h1>Hoi</h1>',
        'img/logo.png': 'data:image/png;base64,AAA',
        'groot.zip': null,
      }),
      'Site',
    );
    expect(payload?.files).toEqual({
      'index.html': '<h1>Hoi</h1>',
      'img/logo.png': 'data:image/png;base64,AAA',
    });
  });

  it('kiest het startbestand zoals pickEntry en geeft null zonder html', () => {
    expect(buildImportPayload(files('over.html', 'site/index.html'), 'x')?.entry).toBe(
      'site/index.html',
    );
    expect(buildImportPayload(files('script.js'), 'x')).toBeNull();
  });
});
