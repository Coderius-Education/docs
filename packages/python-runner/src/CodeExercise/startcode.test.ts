import { describe, expect, it } from 'vitest';
import { startcode } from './startcode';

// Een veld waarin de leerling zelf alles schrijft, begon met een regel
// commentaar die hij eerst weg moest halen (issue 216): 116 velden in de
// python-cursus. Nu is zo'n veld leeg, met het commentaar als aanwijzing.

describe('startcode met alleen commentaar', () => {
  it('is een leeg veld met de tekst als aanwijzing', () => {
    expect(startcode('# Schrijf hier je code')).toEqual({
      start: '',
      aanwijzing: 'Schrijf hier je code',
    });
    expect(startcode('# Plak hier je programma uit stap 1')).toEqual({
      start: '',
      aanwijzing: 'Plak hier je programma uit stap 1',
    });
  });

  it('meer regels commentaar blijven regels, zonder hekjes en lege regels', () => {
    expect(startcode('# Stap 1: lees de naam\n\n  #Stap 2: print hem').aanwijzing).toBe(
      'Stap 1: lees de naam\nStap 2: print hem',
    );
  });
});

describe('startcode met code', () => {
  it('blijft staan, ook het commentaar ertussen', () => {
    const code = 'dieren = ["kat", "hond"]\n# Schrijf hier je loop';
    expect(startcode(code)).toEqual({ start: code });
  });

  it('een hekje in een string is geen commentaar', () => {
    expect(startcode('print("# niet")')).toEqual({ start: 'print("# niet")' });
  });
});

describe('een leeg veld', () => {
  it('heeft geen aanwijzing van zichzelf', () => {
    expect(startcode('')).toEqual({ start: '' });
    expect(startcode('#')).toEqual({ start: '#' });
  });
});
