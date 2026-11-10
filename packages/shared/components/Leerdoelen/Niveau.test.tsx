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

  it('zet nieuw bij een onderwerp dat begint, niet bij elke rij', () => {
    // Fullstack niveau 3: Linux, Veiligheid en Online zetten beginnen daar,
    // en elke rij had het label nieuw.
    const l = leesLeerdoelen({
      niveaus: ['1', '2'],
      onderwerpen: [
        { id: 'py', label: 'Python' },
        { id: 'lx', label: 'Linux' },
      ],
      concepten: [
        { id: 'a', onderwerp: 'py', concept: 'een lijst', 1: 'basis', 2: 'basis' },
        { id: 'b', onderwerp: 'py', concept: 'een klasse', 1: null, 2: 'basis' },
        { id: 'c', onderwerp: 'lx', concept: 'cd en ls', 1: null, 2: 'basis' },
        { id: 'd', onderwerp: 'lx', concept: 'ssh', 1: null, 2: 'gevorderd' },
      ],
    });
    render(<Niveau leerdoelen={l} niveau="2" />);
    expect(screen.getByRole('heading', { name: /Linux/ }).textContent).toContain(
      'nieuw op Niveau 2',
    );
    expect(screen.getByRole('heading', { name: /Python/ }).textContent).not.toContain('nieuw');
    // Alleen de klasse, nieuw in een onderwerp dat er al was.
    expect(screen.getAllByText('nieuw')).toHaveLength(1);
  });

  it('heeft op het eerste niveau geen labeltjes', () => {
    render(<Niveau leerdoelen={leerdoelen} niveau="1" />);
    expect(screen.queryByText(/^was |^nieuw$|weer erbij/)).toBeNull();
  });
});
