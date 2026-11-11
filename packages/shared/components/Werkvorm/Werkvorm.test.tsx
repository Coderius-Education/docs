import { createRequire } from 'node:module';
// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LesWerkvormen, WerkvormIcoon, Werkvormen } from './index';

// De werkvormen in de docentenhandleiding: de legenda die elk icoon uitlegt
// en naar vakdidactiek linkt, en per les de iconen van zijn tabbladen.

const require = createRequire(import.meta.url);
const { WERKVORMEN } = require('../../werkvormen/index.js');

vi.mock('@docusaurus/useGlobalData', () => ({
  usePluginData: () => ({
    lessen: {
      'js-basics/events': {
        titel: 'Events',
        pad: '/web/docs/js-basics/events',
        werkvormen: ['uitleg', 'stap', 'stap', 'uitleg', 'voorspellen', 'aanpassen', 'maken'],
      },
    },
  }),
}));
vi.mock('../SiteLink', () => ({
  default: ({ site, to, children }: { site: string; to: string; children: ReactNode }) => (
    <a href={`site:${site}${to}`}>{children}</a>
  ),
}));

afterEach(cleanup);

describe('WerkvormIcoon', () => {
  it('tekent het icoon van de werkvorm, verborgen voor een schermlezer', () => {
    const { container } = render(<WerkvormIcoon id="fouten" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.querySelectorAll('path')).toHaveLength(3);
  });

  it('tekent niets bij een werkvorm die niet bestaat', () => {
    expect(render(<WerkvormIcoon id="bestaat-niet" />).container.innerHTML).toBe('');
  });
});

describe('Werkvormen', () => {
  it('legt elke werkvorm uit, met het icoon en een link naar elke tip bij vakdidactiek', () => {
    render(<Werkvormen />);
    for (const vorm of WERKVORMEN) {
      const rij = screen.getByRole('rowheader', { name: vorm.label }).closest('tr') as HTMLElement;
      expect(rij.querySelector(`svg[data-werkvorm="${vorm.id}"]`), vorm.id).not.toBeNull();
      expect(within(rij).getByText(vorm.doet)).toBeTruthy();
      for (const tip of vorm.tips) {
        const link = within(rij).getByRole('link', { name: tip.term });
        expect(link.getAttribute('href')).toBe(`site:didactiek/bronnen/${tip.slug}`);
      }
    }
  });
});

describe('LesWerkvormen', () => {
  it('toont de werkvormen van een les in volgorde, elk één keer, met hun namen', () => {
    const { container } = render(<LesWerkvormen les="js-basics/events" />);
    const iconen = Array.from(container.querySelectorAll('svg')).map((s) =>
      s.getAttribute('data-werkvorm'),
    );
    expect(iconen).toEqual(['uitleg', 'stap', 'voorspellen', 'aanpassen', 'maken']);
    // De iconen zelf zeggen een schermlezer niets; de rij heeft de namen.
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      'Werkvormen: Uitleg met een voorbeeld, Stap voor stap, Voorspellen, Aanpassen, Zelf maken',
    );
  });

  it('stopt de build bij een les die niet bestaat of geen tabbladen heeft', () => {
    const stil = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<LesWerkvormen les="html-css/bestaat-niet" />)).toThrow(
      /geen les met tabbladen 'html-css\/bestaat-niet'/,
    );
    stil.mockRestore();
  });
});
