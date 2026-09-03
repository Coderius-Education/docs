import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectFiles } from '../types';
import {
  ACK_SOURCE,
  MESSAGE_SOURCE,
  buildImportPayload,
  herpostMomenten,
  openInIde,
  pickEntry,
} from './openInIde';

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

// openInIde herpostte het volledige project elke 300 ms, vijftien seconden
// lang (vijftig keer), ook als de IDE allang luisterde maar het ack nog
// onderweg was, en ook als hij nooit zou luisteren. Nu: één keer meteen,
// daarna op verdubbelende afstand tot het ack komt (de laatste na negen
// seconden, zodat een traag ladend tabblad tot het einde een kans houdt);
// tussendoor alleen kijken of het tabblad dicht is. Node heeft geen window, dus hier staat een
// minimale nep-window die zijn timers aan de (nep-)timers van vitest overlaat.

interface NepTabblad {
  closed: boolean;
  postMessage: ReturnType<typeof vi.fn>;
}

function nepWindow(tabblad: NepTabblad | null) {
  const luisteraars: ((e: MessageEvent) => void)[] = [];
  vi.stubGlobal('window', {
    open: () => tabblad,
    setInterval: (fn: () => void, ms: number) => globalThis.setInterval(fn, ms),
    clearInterval: (id: ReturnType<typeof setInterval>) => globalThis.clearInterval(id),
    setTimeout: (fn: () => void, ms: number) => globalThis.setTimeout(fn, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => globalThis.clearTimeout(id),
    addEventListener: (_type: string, fn: (e: MessageEvent) => void) => {
      luisteraars.push(fn);
    },
    removeEventListener: (_type: string, fn: (e: MessageEvent) => void) => {
      const i = luisteraars.indexOf(fn);
      if (i >= 0) luisteraars.splice(i, 1);
    },
  });
  return {
    /** Laat het IDE-tabblad het ack sturen. */
    ack() {
      const event = { source: tabblad, data: { source: ACK_SOURCE, type: 'ack' } } as MessageEvent;
      for (const fn of luisteraars.slice()) fn(event);
    },
    aantalLuisteraars: () => luisteraars.length,
  };
}

describe('openInIde — herposten tot het ack komt', () => {
  const IDE = 'https://ide.example';
  let tabblad: NepTabblad;

  beforeEach(() => {
    vi.useFakeTimers();
    tabblad = { closed: false, postMessage: vi.fn() };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('de herpost-momenten verdubbelen en dekken de hele timeout', () => {
    expect(herpostMomenten()).toEqual([300, 900, 2100, 4500, 9300]);
    expect(herpostMomenten(100, 1000)).toEqual([100, 300, 700]);
  });

  it('stuurt het project meteen en daarna op verdubbelende afstanden opnieuw', () => {
    nepWindow(tabblad);
    const onResult = vi.fn();

    openInIde(files('index.html'), 'Site', IDE, onResult);
    expect(tabblad.postMessage).toHaveBeenCalledTimes(1);
    expect(tabblad.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ source: MESSAGE_SOURCE, entry: 'index.html' }),
      IDE,
    );

    vi.advanceTimersByTime(9_000);
    expect(tabblad.postMessage).toHaveBeenCalledTimes(5);
    // De laatste herpost valt na 9,3 s: een tabblad dat pas dan luistert
    // krijgt het project alsnog. Met een vaste limiet van tien stopte dat na 3 s.
    vi.advanceTimersByTime(300);
    expect(tabblad.postMessage).toHaveBeenCalledTimes(6);
    vi.advanceTimersByTime(4_700);
    expect(tabblad.postMessage).toHaveBeenCalledTimes(6);
    expect(onResult).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);
    expect(onResult).toHaveBeenCalledWith('timeout');
  });

  it('stopt met herposten zodra het ack er is', () => {
    const w = nepWindow(tabblad);
    const onResult = vi.fn();

    openInIde(files('index.html'), 'Site', IDE, onResult);
    vi.advanceTimersByTime(650);
    expect(tabblad.postMessage).toHaveBeenCalledTimes(2);

    w.ack();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith('opened');
    expect(w.aantalLuisteraars()).toBe(0);

    vi.advanceTimersByTime(20_000);
    expect(tabblad.postMessage).toHaveBeenCalledTimes(2);
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('blijft na het laatste herpost-moment kijken of het tabblad dicht is', () => {
    nepWindow(tabblad);
    const onResult = vi.fn();

    openInIde(files('index.html'), 'Site', IDE, onResult);
    vi.advanceTimersByTime(12_000);
    expect(tabblad.postMessage).toHaveBeenCalledTimes(6);

    tabblad.closed = true;
    vi.advanceTimersByTime(300);
    expect(onResult).toHaveBeenCalledWith('timeout');
  });

  it('meldt blocked als de popup niet opengaat', () => {
    nepWindow(null);
    const onResult = vi.fn();

    openInIde(files('index.html'), 'Site', IDE, onResult);

    expect(onResult).toHaveBeenCalledWith('blocked');
  });

  it('doet niets zonder startbestand', () => {
    nepWindow(tabblad);
    const onResult = vi.fn();

    openInIde(files('script.js'), 'Site', IDE, onResult);

    expect(tabblad.postMessage).not.toHaveBeenCalled();
    expect(onResult).not.toHaveBeenCalled();
  });
});
