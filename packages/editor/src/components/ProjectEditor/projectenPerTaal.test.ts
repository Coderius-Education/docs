import { describe, expect, it } from 'vitest';
import type { ProjectSummary } from '../../vfs/types';
import { projectenPerTaal } from './projectenPerTaal';

const p = (id: string, runnerId: ProjectSummary['runnerId']): ProjectSummary => ({
  id,
  name: id,
  runnerId,
  updatedAt: 0,
});

describe('projectenPerTaal', () => {
  it('groepeert per taal en houdt de volgorde van de lijst aan', () => {
    const groepen = projectenPerTaal([p('a', 'web'), p('b', 'python'), p('c', 'web')]);

    expect(groepen.map(([, lijst]) => lijst.map((x) => x.id))).toEqual([['a', 'c'], ['b']]);
  });

  it('geeft geen groepen zonder projecten', () => {
    expect(projectenPerTaal([])).toEqual([]);
  });
});
