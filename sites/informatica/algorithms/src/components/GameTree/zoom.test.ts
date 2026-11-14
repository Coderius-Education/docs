import { describe, expect, it } from 'vitest';
import { KLEINSTE_ZOOM, boomZoom } from './zoom';

describe('de spelboom in een les-tabblad', () => {
  it('blijft op ware grootte als hij past', () => {
    expect(boomZoom(800, 633)).toBe(1);
  });

  it('wordt zo klein als nodig om te passen', () => {
    const zoom = boomZoom(400, 633);
    expect(zoom * 633).toBeLessThanOrEqual(400);
    expect(zoom).toBeGreaterThan(0.6);
  });

  it('wordt niet kleiner dan een bord leesbaar is', () => {
    expect(boomZoom(100, 633)).toBe(KLEINSTE_ZOOM);
  });
});
