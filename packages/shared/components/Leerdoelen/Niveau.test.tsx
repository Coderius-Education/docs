// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { leesLeerdoelen } from '../../leerdoelen';
import Niveau from './Niveau';

// De concepten van één niveau, met bij elk dat anders is dan het niveau
// ervoor een labeltje. Een concept dat terugkwam (robotica: continue op 1 en
// 4, niet op 3) heette eerst "nieuw", terwijl de vergelijking "weer erbij" zei.

vi.mock('@docusaurus/Link', () => ({
  default: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

afterEach(cleanup);

const leerdoelen = leesLeerdoelen({
  niveaus: ['1', '3', '4'],
  onderwerpen: [{ id: 'py', label: 'Python' }],
  concepten: [
    {
      id: 'continue',
      onderwerp: 'py',
      concept: 'continue',
      1: 'gevorderd',
      3: null,
      4: 'gevorderd',
    },
    { id: 'lijst', onderwerp: 'py', concept: 'een lijst', 1: 'gevorderd', 3: 'basis', 4: 'basis' },
    { id: 'klasse', onderwerp: 'py', concept: 'een klasse', 1: null, 3: null, 4: 'basis' },
  ],
});

describe('Niveau', () => {
  it('zet wat een concept op het niveau ervoor was erbij', () => {
    render(<Niveau leerdoelen={leerdoelen} niveau="3" />);
    expect(screen.getByText('was gevorderd op Niveau 1')).toBeTruthy();
  });

  it('noemt een concept dat terugkomt weer erbij, en alleen een echt nieuw concept nieuw', () => {
    render(<Niveau leerdoelen={leerdoelen} niveau="4" />);
    expect(screen.getByText('weer erbij, was gevorderd op Niveau 1')).toBeTruthy();
    expect(screen.getAllByText('nieuw')).toHaveLength(1);
  });

  it('heeft op het eerste niveau geen labeltjes', () => {
    render(<Niveau leerdoelen={leerdoelen} niveau="1" />);
    expect(screen.queryByText(/^was |^nieuw$|weer erbij/)).toBeNull();
  });
});
