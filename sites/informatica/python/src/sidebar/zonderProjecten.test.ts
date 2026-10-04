import { describe, expect, it } from 'vitest';
import { zonderProjecten } from './zonderProjecten';

describe('zonderProjecten', () => {
  it('haalt de projecten uit de Tutorial-sidebar en laat de lessen staan', () => {
    const items = [
      { type: 'category', label: 'Basis', items: [{ type: 'doc', id: 'basis/introductie' }] },
      {
        type: 'category',
        label: 'projecten',
        items: [
          { type: 'doc', id: 'projecten/index' },
          {
            type: 'category',
            label: 'Tien groene flessen',
            items: [{ type: 'doc', id: 'projecten/tien-groene-flessen/stap-1-print' }],
          },
        ],
      },
      { type: 'doc', id: 'losse-les' },
    ];
    expect(zonderProjecten(items).map((i) => ('label' in i ? i.label : i.id))).toEqual([
      'Basis',
      'losse-les',
    ]);
  });

  it('herkent een projectcategorie ook aan zijn link', () => {
    const items = [{ type: 'category', items: [], link: { type: 'doc', id: 'projecten/index' } }];
    expect(zonderProjecten(items)).toEqual([]);
  });
});
