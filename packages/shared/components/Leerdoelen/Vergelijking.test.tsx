// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { leesLeerdoelen } from '../../leerdoelen';
import Vergelijking from './Vergelijking';
import Verschillen from './Verschillen';

// De vergelijking van de niveaus. Eerst stonden de verschillen tussen
// tientallen gelijke rijen, met alleen een dun randje om één label; nu staan
// standaard alleen de rijen die verschillen erin, en zegt een cel wat hij was.

vi.mock('@docusaurus/Link', () => ({
  default: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

afterEach(cleanup);

const leerdoelen = leesLeerdoelen({
  niveaus: ['1', '2'],
  onderwerpen: [{ id: 'py', label: 'Python' }],
  concepten: [
    { id: 'lijst', onderwerp: 'py', concept: 'een lijst', 1: 'gevorderd', 2: 'basis' },
    { id: 'if', onderwerp: 'py', concept: 'if en else', 1: 'basis', 2: 'basis' },
    { id: 'klasse', onderwerp: 'py', concept: 'een klasse', 1: null, 2: 'gevorderd' },
  ],
});

describe('Vergelijking', () => {
  it('toont eerst alleen wat verschilt, en zegt wat een cel was', () => {
    render(<Vergelijking leerdoelen={leerdoelen} />);
    expect(screen.getByText('een lijst')).toBeTruthy();
    expect(screen.getByText('een klasse')).toBeTruthy();
    expect(screen.queryByText('if en else')).toBeNull();
    expect(screen.getByText('was gevorderd')).toBeTruthy();
    expect(screen.getByText('nieuw')).toBeTruthy();
    const alleen = screen.getByRole('button', { name: 'Alleen wat verschilt (2)' });
    expect(alleen.getAttribute('aria-pressed')).toBe('true');
  });

  it('toont met een klik alle concepten', () => {
    render(<Vergelijking leerdoelen={leerdoelen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Alle concepten (3)' }));
    expect(screen.getByText('if en else')).toBeTruthy();
  });
});

describe('Verschillen', () => {
  it('zegt bij een concept dat terugkomt weer erbij, met het niveau van eerst', () => {
    const terug = leesLeerdoelen({
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
      ],
    });
    render(<Verschillen leerdoelen={terug} />);
    expect(screen.getByText('weer erbij, was gevorderd op Niveau 1')).toBeTruthy();
  });

  it('noemt per overgang wat erbij komt en wat basis wordt', () => {
    render(<Verschillen leerdoelen={leerdoelen} />);
    expect(screen.getByRole('heading', { name: 'Van Niveau 1 naar Niveau 2' })).toBeTruthy();
    expect(screen.getByText('Erbij')).toBeTruthy();
    expect(screen.getByText('een lijst').closest('li')?.textContent).toContain('was gevorderd');
  });
});
