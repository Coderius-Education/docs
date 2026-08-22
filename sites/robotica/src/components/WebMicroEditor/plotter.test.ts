import { describe, expect, it } from 'vitest';
import { MAX_SAMPLES, parseGetallen, voegSample } from './plotter';

describe('parseGetallen', () => {
  it('leest een kale meetwaarde', () => {
    expect(parseGetallen('12345')).toEqual([12345]);
  });

  it('leest meerdere waarden uit een gelabelde regel', () => {
    expect(parseGetallen('Links: 800 | Rechts: 5000')).toEqual([800, 5000]);
  });

  it('kan met kommagetallen en negatieve waarden overweg', () => {
    expect(parseGetallen('1.5 -2')).toEqual([1.5, -2]);
  });

  it('negeert tekstregels zonder losse getallen', () => {
    expect(parseGetallen('Links: white | Rechts: black')).toEqual([]);
    // het cijfer in een pinnaam is geen meetwaarde
    expect(parseGetallen('sensor op A0 aangesloten')).toEqual([]);
  });

  it('negeert editor-statusmeldingen', () => {
    expect(parseGetallen('[opgeslagen: /main.py]')).toEqual([]);
  });

  it('negeert prompt- en echo-regels van de REPL', () => {
    expect(parseGetallen('>>> sleep(2)')).toEqual([]);
    expect(parseGetallen('>>> print(800)')).toEqual([]);
  });

  it('begrenst op vier reeksen', () => {
    expect(parseGetallen('1 2 3 4 5 6')).toEqual([1, 2, 3, 4]);
  });
});

describe('voegSample', () => {
  it('voegt alleen regels met getallen toe', () => {
    const samples: number[][] = [];
    expect(voegSample(samples, 'Links: white')).toBe(false);
    expect(voegSample(samples, '800')).toBe(true);
    expect(samples).toEqual([[800]]);
  });

  it('begrenst de buffer op MAX_SAMPLES', () => {
    const samples: number[][] = [];
    for (let i = 0; i < MAX_SAMPLES + 50; i++) voegSample(samples, String(i));
    expect(samples).toHaveLength(MAX_SAMPLES);
    expect(samples[0]).toEqual([50]);
    expect(samples[samples.length - 1]).toEqual([MAX_SAMPLES + 49]);
  });
});
