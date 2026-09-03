import { SITES_BY_ID } from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';
import {
  ACK_MESSAGE,
  DEFAULT_PROJECT_NAME,
  MESSAGE_SOURCE,
  MESSAGE_TYPE,
  isAllowedOrigin,
  parseImportMessage,
  projectFromImport,
} from './importContract';

// De /import-pagina ontvangt een project van de Website-checker via
// postMessage. Wijst de ontvanger een geldig bericht af, dan gebeurt er
// níéts: geen fout, alleen na vijftien seconden "Geen project ontvangen.
// Controleer of pop-ups zijn toegestaan" — een melding die de leerling de
// verkeerde kant op stuurt. Daarom pinnen deze tests de wire-waarden en de
// vormcontrole letterlijk; de zender-kant staat in
// packages/checker/src/Checker/openInIde.test.ts.

const WEB = 'https://web.coderius.nl';

function bericht(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    source: MESSAGE_SOURCE,
    type: MESSAGE_TYPE,
    entry: 'index.html',
    files: { 'index.html': '<h1>Hoi</h1>', 'stijl.css': 'h1{color:red}' },
    name: 'Mijn site',
    ...overrides,
  };
}

describe('het /import-contract — wire-waarden', () => {
  it('gebruikt dezelfde strings als de zender in de checker', () => {
    expect(MESSAGE_SOURCE).toBe('coderius-website-checker');
    expect(MESSAGE_TYPE).toBe('import-files');
    expect(ACK_MESSAGE).toEqual({ source: 'coderius-editor-import', type: 'ack' });
  });
});

describe('isAllowedOrigin', () => {
  it('accepteert de checker uit de registry, en die URL is origin-vormig', () => {
    // Een slash of pad achter de URL in sites.js zou de === stil laten
    // mislukken: dan komt geen enkel project meer binnen.
    expect(SITES_BY_ID.web.url).toBe(WEB);
    expect(isAllowedOrigin(SITES_BY_ID.web.url)).toBe(true);
    expect(isAllowedOrigin(WEB)).toBe(true);
  });

  it('accepteert een lokale dev-server op een poort', () => {
    expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
  });

  it.each([
    `${WEB}/`,
    'http://web.coderius.nl',
    'https://web.coderius.nl.kwaad.nl',
    'https://kwaad.nl',
    'null',
    'http://localhost',
    'https://localhost:3000',
  ])('weigert %s', (origin) => {
    expect(isAllowedOrigin(origin)).toBe(false);
  });
});

describe('parseImportMessage', () => {
  it('geeft entry, files en name terug van een geldig bericht', () => {
    expect(parseImportMessage(bericht(), WEB)).toEqual({
      entry: 'index.html',
      files: { 'index.html': '<h1>Hoi</h1>', 'stijl.css': 'h1{color:red}' },
      name: 'Mijn site',
    });
  });

  it('laat name weg als die ontbreekt', () => {
    expect(parseImportMessage(bericht({ name: undefined }), WEB)?.name).toBeUndefined();
  });

  it('weigert een goed bericht van een verkeerde origin', () => {
    expect(parseImportMessage(bericht(), 'https://kwaad.nl')).toBeNull();
  });

  it.each([
    ['verkeerde source (de ack-bron)', bericht({ source: ACK_MESSAGE.source })],
    ['verkeerd type (het ack-type)', bericht({ type: ACK_MESSAGE.type })],
    ['entry ontbreekt', bericht({ entry: undefined })],
    ['entry is geen string', bericht({ entry: 42 })],
    ['files ontbreekt', bericht({ files: undefined })],
    ['files is null', bericht({ files: null })],
    ['files is een string', bericht({ files: 'index.html' })],
  ])('weigert: %s', (_naam, data) => {
    expect(parseImportMessage(data, WEB)).toBeNull();
  });

  it.each([undefined, null, 'tekst', 42, {}])('weigert los data: %s', (data) => {
    expect(parseImportMessage(data, WEB)).toBeNull();
  });
});

describe('projectFromImport', () => {
  const msg = { entry: 'index.html', files: { 'index.html': '<h1>Hoi</h1>' } };

  it('bouwt een web-project zonder mappen met gelijke tijdstempels', () => {
    const project = projectFromImport({ ...msg, name: 'Mijn site' }, 'id-1', 1234);
    expect(project).toEqual({
      id: 'id-1',
      name: 'Mijn site',
      runnerId: 'web',
      entry: 'index.html',
      files: { 'index.html': '<h1>Hoi</h1>' },
      folders: [],
      createdAt: 1234,
      updatedAt: 1234,
    });
  });

  it('valt terug op een standaardnaam bij een lege of ontbrekende naam', () => {
    expect(projectFromImport({ ...msg, name: '' }, 'id', 0).name).toBe(DEFAULT_PROJECT_NAME);
    expect(projectFromImport(msg, 'id', 0).name).toBe(DEFAULT_PROJECT_NAME);
  });
});
