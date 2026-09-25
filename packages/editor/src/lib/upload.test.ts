import { describe, expect, it } from 'vitest';
import { inhoudNaarBytes } from '../vfs/bestanden';
import { leesBestand } from './upload';

describe('leesBestand', () => {
  it('leest een tekstbestand als tekst', async () => {
    expect(await leesBestand(new File(['print("hé")'], 'main.py'))).toBe('print("hé")');
  });

  it('leest een afbeelding als data-URL met de echte bytes', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 255]);
    const inhoud = await leesBestand(new File([bytes], 'foto.png', { type: 'image/png' }));

    expect(inhoud.startsWith('data:image/png;base64,')).toBe(true);
    expect(Array.from(inhoudNaarBytes(inhoud))).toEqual(Array.from(bytes));
  });
});
