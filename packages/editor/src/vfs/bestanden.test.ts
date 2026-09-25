import { describe, expect, it } from 'vitest';
import {
  bestandsgrootte,
  inhoudNaarBytes,
  isAfbeelding,
  isDataUrl,
  isTekstbestand,
  leesbareGrootte,
  uploadPad,
  veiligeBestandsnaam,
} from './bestanden';

// Een PNG van 1x1 pixel.
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('tekst of binair', () => {
  it('code en platte tekst zijn tekst', () => {
    expect(isTekstbestand('main.py')).toBe(true);
    expect(isTekstbestand('css/stijl.CSS')).toBe(true);
    expect(isTekstbestand('data/leerlingen.csv')).toBe(true);
  });

  it('afbeeldingen, ook svg, en onbekende bestanden niet', () => {
    expect(isTekstbestand('logo.svg')).toBe(false);
    expect(isTekstbestand('foto.JPG')).toBe(false);
    expect(isTekstbestand('geluid.mp3')).toBe(false);
    expect(isTekstbestand('Makefile')).toBe(false);
    expect(isAfbeelding('img/logo.svg')).toBe(true);
    expect(isAfbeelding('geluid.mp3')).toBe(false);
  });

  it('herkent een data-URL', () => {
    expect(isDataUrl(PNG)).toBe(true);
    expect(isDataUrl('print("data:")')).toBe(false);
  });
});

describe('inhoudNaarBytes', () => {
  it('geeft tekst als UTF-8', () => {
    expect(Array.from(inhoudNaarBytes('é'))).toEqual([0xc3, 0xa9]);
  });

  it('decodeert een data-URL naar de echte bytes', () => {
    const bytes = inhoudNaarBytes(PNG);

    // De PNG-handtekening.
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
    expect(bytes.length).toBe(bestandsgrootte(PNG));
  });
});

describe('grootte', () => {
  it('telt de bytes, niet de lengte van de data-URL', () => {
    expect(bestandsgrootte(PNG)).toBe(70);
    expect(bestandsgrootte('hé')).toBe(3);
  });

  it('is leesbaar', () => {
    expect(leesbareGrootte(512)).toBe('512 B');
    expect(leesbareGrootte(2048)).toBe('2 kB');
    expect(leesbareGrootte(5.5 * 1024 * 1024)).toBe('5,5 MB');
    expect(leesbareGrootte(5 * 1024 * 1024)).toBe('5 MB');
  });
});

describe('namen en paden', () => {
  it('maakt een naam van de computer geschikt voor het project', () => {
    expect(veiligeBestandsnaam('mijn foto.png')).toBe('mijn foto.png');
    expect(veiligeBestandsnaam('wat?.png')).toBe('wat-.png');
    expect(veiligeBestandsnaam('..verborgen')).toBe('verborgen');
    expect(veiligeBestandsnaam('   ')).toBe('bestand');
  });

  it('zet het bestand in de gekozen map', () => {
    expect(uploadPad('', 'foto.png')).toBe('foto.png');
    expect(uploadPad('img/dieren', 'kat.png')).toBe('img/dieren/kat.png');
  });
});
