import { describe, expect, it } from 'vitest';
import { kanVolledigScherm, schermStand } from './volledigScherm';

const element = { requestFullscreen: () => Promise.resolve() };

describe('kanVolledigScherm', () => {
  it('ja in een browser die het toestaat', () => {
    expect(kanVolledigScherm({ fullscreenEnabled: true }, element)).toBe(true);
  });

  it('nee op een iPhone, waar de API ontbreekt', () => {
    expect(kanVolledigScherm({}, {})).toBe(false);
  });

  it('nee in een iframe zonder toestemming', () => {
    expect(kanVolledigScherm({ fullscreenEnabled: false }, element)).toBe(false);
  });

  it('nee zolang er nog geen element is', () => {
    expect(kanVolledigScherm({ fullscreenEnabled: true }, null)).toBe(false);
  });
});

describe('schermStand', () => {
  it('volgt de knoppen', () => {
    expect(schermStand(false, false)).toBe('normaal');
    expect(schermStand(true, false)).toBe('groter');
    expect(schermStand(false, true)).toBe('volledig');
  });

  it('volledig scherm gaat voor Groter', () => {
    expect(schermStand(true, true)).toBe('volledig');
  });
});
