import { describe, expect, it } from 'vitest';
import { kanVolledigScherm } from './volledigScherm';

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

  it('nee zonder element', () => {
    expect(kanVolledigScherm({ fullscreenEnabled: true }, null)).toBe(false);
  });
});
