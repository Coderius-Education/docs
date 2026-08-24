import { describe, expect, it } from 'vitest';
import { levelVoor } from './conceptLevel';
import type { Concept } from './types';

function concept(level: Concept['level']): Concept {
  return {
    id: 'x',
    subject: 'alles',
    group: 'Groep',
    label: 'x',
    level,
    detect: { type: 'handmatig' },
  };
}

describe('levelVoor', () => {
  it('geeft een kaal niveau terug, ongeacht de track', () => {
    expect(levelVoor(concept('gevorderd'), null)).toBe('gevorderd');
    expect(levelVoor(concept('gevorderd'), 'start')).toBe('gevorderd');
    expect(levelVoor(concept('gevorderd'), 'verdieping')).toBe('gevorderd');
  });

  it('kiest per track het juiste niveau', () => {
    // Dit is de hele reden dat tracks bestaan: hetzelfde concept telt in de
    // ene route als gevorderd en in de andere als basis.
    const c = concept({ start: 'gevorderd', verdieping: 'basis' });
    expect(levelVoor(c, 'start')).toBe('gevorderd');
    expect(levelVoor(c, 'verdieping')).toBe('basis');
  });

  it('valt terug op het eerste niveau bij een onbekende of ontbrekende track', () => {
    // validateConfig hoort dit al te melden; hier gaat het erom dat het
    // concept niet stil uit de tellingen verdwijnt.
    const c = concept({ start: 'gevorderd', verdieping: 'basis' });
    expect(levelVoor(c, 'bestaat-niet')).toBe('gevorderd');
    expect(levelVoor(c, null)).toBe('gevorderd');
  });
});
