import { zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { MAX_FILE_COUNT, MAX_TEXT_FILE_SIZE, readUploadedFiles } from './readFiles';
import type { ReadOptions } from './readFiles';

// Een echt File-object met het pad dat de browser bij een mapupload meegeeft.
// webkitRelativePath is geen own property in Node, maar wel te definiëren.
function makeFile(relativePath: string, content: string | Uint8Array): File {
  const name = relativePath.split('/').pop() ?? relativePath;
  const file = new File([content as BlobPart], name);
  Object.defineProperty(file, 'webkitRelativePath', { value: relativePath });
  return file;
}

// Doet zich voor als een groot bestand zonder de bytes te bezitten. De
// arrayBuffer() gooit met opzet: zo bewijst een test dat de checker een bestand
// alleen telt en nooit inleest.
function fakeFile(relativePath: string, size: number): File {
  return {
    name: relativePath.split('/').pop(),
    webkitRelativePath: relativePath,
    size,
    arrayBuffer: () => {
      throw new Error(`arrayBuffer() had niet aangeroepen mogen worden voor ${relativePath}`);
    },
  } as unknown as File;
}

// Leesbaar bestand van een opgegeven grootte, met werkende bytes.
function bigTextFile(relativePath: string, size: number): File {
  return makeFile(relativePath, 'a'.repeat(size));
}

const webAchtig: ReadOptions = {
  classify: (path) => {
    const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
    if (ext === '.html') return 'html';
    if (ext === '.css') return 'css';
    if (ext === '.js') return 'js';
    if (ext === '.png') return 'image';
    return 'other';
  },
  textKinds: ['html', 'css', 'js'],
  imageKinds: ['image'],
};

describe('readUploadedFiles — mappen die genegeerd worden', () => {
  it('laat node_modules, build, dist, .git en macOS-rommel buiten het project', async () => {
    const { files } = await readUploadedFiles(
      [
        makeFile('p/index.html', '<h1>Hoi</h1>'),
        makeFile('p/css/stijl.css', 'p { color: red; }'),
        makeFile('p/node_modules/left-pad/index.js', 'module.exports = 1;'),
        makeFile('p/build/bundle.js', 'var a = 1;'),
        makeFile('p/dist/out.js', 'var b = 2;'),
        makeFile('p/.git/config', '[core]'),
        makeFile('p/__MACOSX/._index.html', 'rommel'),
        makeFile('p/.DS_Store', 'rommel'),
        makeFile('p/.vscode/settings.json', '{}'),
      ],
      webAchtig,
    );

    expect(Object.keys(files).sort()).toEqual(['css/stijl.css', 'index.html']);
  });

  it('gooit een duidelijke fout als er na het filteren niets overblijft', async () => {
    await expect(
      readUploadedFiles([makeFile('p/node_modules/x.js', 'var a = 1;')], webAchtig),
    ).rejects.toThrow('Geen bruikbare bestanden gevonden');
  });
});

describe('readUploadedFiles — gemeenschappelijke hoofdmap', () => {
  it('strip de map waar het hele project in zit', async () => {
    const { files } = await readUploadedFiles(
      [
        makeFile('mijn-site/index.html', '<h1>Hoi</h1>'),
        makeFile('mijn-site/css/stijl.css', 'p{}'),
      ],
      webAchtig,
    );

    expect(Object.keys(files).sort()).toEqual(['css/stijl.css', 'index.html']);
  });

  it('strip alle gedeelde niveaus, niet alleen het bovenste', async () => {
    // Bevroren gedrag: de code strip élk gemeenschappelijk segment, terwijl het
    // commentaar erboven over "één gemeenschappelijke bovenliggende map" spreekt.
    // Voor een leerling die een submap zipt kan dat een pad-concept wegnemen.
    const { files } = await readUploadedFiles(
      [makeFile('a/b/index.html', '<h1>Hoi</h1>'), makeFile('a/b/stijl.css', 'p{}')],
      webAchtig,
    );

    expect(Object.keys(files).sort()).toEqual(['index.html', 'stijl.css']);
  });

  it('laat het pad met rust als er meerdere hoofdmappen zijn', async () => {
    const { files } = await readUploadedFiles(
      [makeFile('site-a/index.html', '<h1>A</h1>'), makeFile('site-b/index.html', '<h1>B</h1>')],
      webAchtig,
    );

    expect(Object.keys(files).sort()).toEqual(['site-a/index.html', 'site-b/index.html']);
  });

  it('strip nooit de bestandsnaam zelf bij één bestand', async () => {
    const { files } = await readUploadedFiles(
      [makeFile('p/index.html', '<h1>Hoi</h1>')],
      webAchtig,
    );

    expect(Object.keys(files)).toEqual(['p/index.html']);
  });
});

describe('readUploadedFiles — grenzen', () => {
  it('weigert een project met meer bestanden dan de limiet', async () => {
    const files = Array.from({ length: MAX_FILE_COUNT + 1 }, (_, i) =>
      fakeFile(`p/bestand-${i}.js`, 10),
    );

    await expect(readUploadedFiles(files, webAchtig)).rejects.toThrow(
      `meer dan de limiet van ${MAX_FILE_COUNT}`,
    );
  });

  it('slaat een te groot tekstbestand over zonder het in te lezen, en waarschuwt', async () => {
    const { files, warnings } = await readUploadedFiles(
      [makeFile('p/index.html', '<h1>Hoi</h1>'), fakeFile('p/enorm.js', MAX_TEXT_FILE_SIZE + 1)],
      webAchtig,
    );

    expect(files['enorm.js'].tooLarge).toBe(true);
    expect(files['enorm.js'].content).toBeNull();
    expect(files['enorm.js'].sizeBytes).toBe(MAX_TEXT_FILE_SIZE + 1);
    expect(warnings.join(' ')).toContain('groter dan 2 MB');
  });

  it('slaat bestanden over zodra het leesbudget op is, met één waarschuwing', async () => {
    // Vijf bestanden van precies 2 MB vullen het leesbudget van 10 MB. Het zesde
    // past niet meer; dat is een fakeFile, zodat de test ook bewijst dat de
    // bytes daarvan nooit worden opgehaald.
    const gevuld = Array.from({ length: 5 }, (_, i) =>
      bigTextFile(`p/vol-${i}.js`, MAX_TEXT_FILE_SIZE),
    );
    const { files, warnings } = await readUploadedFiles(
      [...gevuld, fakeFile('p/laatste.js', MAX_TEXT_FILE_SIZE)],
      webAchtig,
    );

    expect(files['vol-0.js'].content).not.toBeNull();
    expect(files['vol-4.js'].content).not.toBeNull();
    expect(files['laatste.js'].content).toBeNull();
    expect(files['laatste.js'].tooLarge).toBe(false);
    expect(warnings.filter((w) => w.includes('erg groot'))).toHaveLength(1);
  });
});

describe('readUploadedFiles — regressie op issue #28 (grote projecten geweigerd)', () => {
  it('accepteert een project met een enorm mediabestand en leest de code gewoon in', async () => {
    // De nakijker weigerde ooit echte projecten met "Dit project is samen 424 MB",
    // omdat de hele upload werd gewogen in plaats van alleen wat ingelezen wordt.
    // De mp4 hieronder gooit als iemand hem probeert te lezen.
    const { files, warnings } = await readUploadedFiles(
      [
        makeFile('p/index.html', '<h1>Mijn site</h1>'),
        makeFile('p/css/stijl.css', 'body { color: red; }'),
        fakeFile('p/assets/intro.mp4', 424 * 1024 * 1024),
        fakeFile('p/node_modules/zwaar/data.bin', 80 * 1024 * 1024),
      ],
      webAchtig,
    );

    expect(files['index.html'].content).toContain('Mijn site');
    expect(files['css/stijl.css'].content).toContain('color: red');
    expect(files['assets/intro.mp4'].content).toBeNull();
    expect(Object.keys(files)).not.toContain('node_modules/zwaar/data.bin');
    expect(warnings).toEqual([]);
  });
});

describe('readUploadedFiles — zip', () => {
  function maakZip(inhoud: Record<string, string>): File {
    const data = Object.fromEntries(
      Object.entries(inhoud).map(([p, c]) => [p, new TextEncoder().encode(c)]),
    );
    return makeFile('project.zip', zipSync(data));
  }

  it('pakt een zip uit als het het enige geüploade bestand is', async () => {
    const zip = maakZip({
      'site/index.html': '<h1>Uit een zip</h1>',
      'site/css/stijl.css': 'p { color: blue; }',
      'site/node_modules/x.js': 'var a = 1;',
    });
    const { files } = await readUploadedFiles([zip], webAchtig);

    expect(Object.keys(files).sort()).toEqual(['css/stijl.css', 'index.html']);
    expect(files['index.html'].content).toContain('Uit een zip');
  });

  it('behandelt zips als gewone bestanden zodra er meer dan één upload is', async () => {
    const { files } = await readUploadedFiles(
      [maakZip({ 'a.html': '<h1>A</h1>' }), makeFile('los.html', '<h1>Los</h1>')],
      webAchtig,
    );

    expect(Object.keys(files).sort()).toEqual(['los.html', 'project.zip']);
    expect(files['project.zip'].kind).toBe('other');
  });

  it('weegt bestanden in een zip op hun uitgepakte grootte, niet de gecomprimeerde', async () => {
    // Tekst comprimeert enorm: 6 MB JavaScript wordt zo'n 12 kB in de zip.
    // Wie de gecomprimeerde grootte weegt, laat dat bestand langs de limiet van
    // 2 MB glippen en leest het alsnog volledig in — precies de bescherming die
    // voor losse mappen wél geldt.
    const groot = 'const x = 1;\n'.repeat(500_000);
    const { files, warnings } = await readUploadedFiles(
      [maakZip({ 'p/index.html': '<h1>Hoi</h1>', 'p/enorm.js': groot })],
      webAchtig,
    );

    expect(files['enorm.js'].sizeBytes).toBe(groot.length);
    expect(files['enorm.js'].tooLarge).toBe(true);
    expect(files['enorm.js'].content).toBeNull();
    expect(warnings.join(' ')).toContain('groter dan 2 MB');
  });

  it('geeft een leesbare fout bij een kapotte zip', async () => {
    const rommel = makeFile('kapot.zip', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));

    await expect(readUploadedFiles([rommel], webAchtig)).rejects.toThrow(
      'zip-bestand kon niet worden geopend',
    );
  });
});

describe('readUploadedFiles — afbeeldingen', () => {
  it('leest een afbeelding in als data-URL wanneer de site dat vraagt', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const { files } = await readUploadedFiles(
      [makeFile('p/index.html', '<h1>Hoi</h1>'), makeFile('p/img/logo.png', png)],
      webAchtig,
    );

    expect(files['img/logo.png'].content).toMatch(/^data:image\/png;base64,/);
  });

  it('laat afbeeldingen ongelezen als de site geen imageKinds opgeeft', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const { files } = await readUploadedFiles(
      [makeFile('p/index.html', '<h1>Hoi</h1>'), makeFile('p/img/logo.png', png)],
      { ...webAchtig, imageKinds: undefined },
    );

    expect(files['img/logo.png'].content).toBeNull();
    expect(files['img/logo.png'].kind).toBe('image');
  });
});
