import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { projectNaarZip, zipBestandsnaam } from './zip';

const uitpakken = (zip: Uint8Array) => unzipSync(zip);

describe('projectNaarZip', () => {
  it('zet elk bestand op zijn pad, met de inhoud intact', () => {
    const zip = uitpakken(
      projectNaarZip({
        files: { 'index.html': '<h1>Café</h1>', 'css/stijl.css': 'h1 { color: red; }' },
        folders: [],
      }),
    );

    expect(Object.keys(zip).sort()).toEqual(['css/stijl.css', 'index.html']);
    expect(strFromU8(zip['index.html'])).toBe('<h1>Café</h1>');
    expect(strFromU8(zip['css/stijl.css'])).toBe('h1 { color: red; }');
  });

  it('neemt lege mappen mee, ook geneste', () => {
    // Zonder eigen entry verdwijnt een lege map bij het uitpakken, en een
    // leerling die een map afbeeldingen/ klaarzette, mist die dan.
    const zip = uitpakken(projectNaarZip({ files: { 'main.py': '' }, folders: ['leeg', 'a/b'] }));

    expect(zip['leeg/']).toEqual(new Uint8Array(0));
    expect(zip['a/b/']).toEqual(new Uint8Array(0));
    expect(zip['main.py']).toEqual(new Uint8Array(0));
  });

  it('schrijft een geüploade afbeelding als het echte bestand', () => {
    // In het project staat hij als data-URL; in de zip moet een PNG staan
    // die een beeldviewer opent, niet de tekst "data:image/png;base64,...".
    const zip = uitpakken(
      projectNaarZip({ files: { 'foto.png': 'data:image/png;base64,iVBORw==' }, folders: [] }),
    );

    expect(Array.from(zip['foto.png'])).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it('laat paden weg die buiten de uitpakmap zouden schrijven', () => {
    const zip = uitpakken(
      projectNaarZip({
        files: { 'main.py': 'print(1)', '../buiten.py': 'x', '/root.py': 'x' },
        folders: ['../weg'],
      }),
    );

    expect(Object.keys(zip)).toEqual(['main.py']);
  });
});

describe('zipBestandsnaam', () => {
  it('maakt van de projectnaam een geldige bestandsnaam', () => {
    expect(zipBestandsnaam('Mijn site: v2?')).toBe('Mijn-site-v2.zip');
    expect(zipBestandsnaam('  Café  ')).toBe('Café.zip');
  });

  it('valt terug op project.zip als er niets overblijft', () => {
    expect(zipBestandsnaam('')).toBe('project.zip');
    expect(zipBestandsnaam('...')).toBe('project.zip');
    expect(zipBestandsnaam('???')).toBe('project.zip');
  });

  it('kapt een lange naam af', () => {
    expect(zipBestandsnaam('a'.repeat(200))).toBe(`${'a'.repeat(80)}.zip`);
  });
});
