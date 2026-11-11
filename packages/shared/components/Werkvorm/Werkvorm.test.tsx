import { readFileSync } from 'node:fs';
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
      'js-basics/loops': {
        titel: 'Loops',
        pad: '/web/docs/js-basics/loops',
        werkvormen: ['uitleg', 'stap', 'voorspellen', 'aanpassen', 'maken'],
      },
      // Alleen deze les heeft een leerdoel.
      'js-basics/intro': {
        titel: 'Intro',
        pad: '/web/docs/js-basics/intro',
        werkvormen: ['leerdoel', 'uitleg'],
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
  // De les uit de nagemaakte plugin-data heeft deze werkvormen.
  const GEBRUIKT = ['uitleg', 'stap', 'voorspellen', 'aanpassen', 'maken'];

  it('legt elke werkvorm uit, met het icoon en een link naar elke tip bij vakdidactiek', () => {
    render(<Werkvormen />);
    for (const vorm of WERKVORMEN.filter((w: { id: string }) => GEBRUIKT.includes(w.id))) {
      const rij = screen.getByRole('rowheader', { name: vorm.label }).closest('tr') as HTMLElement;
      expect(rij.querySelector(`svg[data-werkvorm="${vorm.id}"]`), vorm.id).not.toBeNull();
      expect(within(rij).getByText(vorm.doet)).toBeTruthy();
      for (const tip of vorm.tips) {
        const link = within(rij).getByRole('link', { name: tip.term });
        expect(link.getAttribute('href')).toBe(`site:didactiek/bronnen/${tip.slug}`);
        // De literatuur staat erbij: daar gaat de handleiding om.
        expect(link.parentElement?.textContent).toContain(tip.bron ?? 'uit de praktijk');
      }
    }
  });

  it('toont alleen wat in de lessen van de cursus voorkomt, in de volgorde van een les', () => {
    render(<Werkvormen />);
    const namen = screen.getAllByRole('rowheader').map((th) => th.textContent);
    const verwacht = WERKVORMEN.filter((w: { id: string }) => GEBRUIKT.includes(w.id)).map(
      (w: { label: string }) => w.label,
    );
    expect(namen).toEqual(verwacht);
    // Uitleg komt in een les vóór voorspellen, en zelf maken na aanpassen.
    const ids = WERKVORMEN.map((w: { id: string }) => w.id);
    expect(ids.indexOf('uitleg')).toBeLessThan(ids.indexOf('voorspellen'));
    expect(ids.indexOf('aanpassen')).toBeLessThan(ids.indexOf('maken'));
    expect(ids.at(-1)).toBe('fouten');
  });
});

describe('wat in maar één les voorkomt', () => {
  it('staat niet in de tabel: het is geen onderdeel van "een les"', () => {
    // De python-cursus heeft alleen in zijn introductie een leerdoel. Met die
    // ene les erbij zei de docentenhandleiding dat elke les ermee begint.
    render(<Werkvormen />);
    expect(screen.queryByRole('rowheader', { name: 'Leerdoel' })).toBeNull();
    expect(screen.getByRole('rowheader', { name: 'Uitleg met een voorbeeld' })).toBeTruthy();
  });
});

describe('de opmaak van de tabel', () => {
  it('op een telefoon schuift de tabel zelf, niet de pagina', () => {
    // Als `display: table` met een naam die niet afbreekt, was de pagina van
    // de docentenhandleiding op 390 pixels 96 pixels te breed. Gezien in
    // Chromium; jsdom doet geen layout.
    // In jsdom is import.meta.url geen bestandsadres; vitest draait vanuit de root.
    const css = readFileSync('packages/shared/components/Werkvorm/styles.module.css', 'utf8');
    const smal = css.slice(css.indexOf('@media (max-width: 996px)'));
    expect(smal).toMatch(/\.legenda\s*\{[^}]*display:\s*block[^}]*overflow-x:\s*auto/);
    expect(smal).toMatch(/\.naam\s*\{[^}]*white-space:\s*normal/);
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
