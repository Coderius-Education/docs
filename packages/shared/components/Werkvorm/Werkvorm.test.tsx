import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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
const ROOT = require.resolve('../../werkvormen/index.js').replace(/\/packages\/shared\/.*$/, '');

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

describe('een cursus zegt zelf wat zijn leerlingen doen', () => {
  it('vervangt de tekst van een onderdeel, en laat de literatuur staan', () => {
    // In Linux begint een opdracht in een lege terminal: "op code die er al
    // staat" klopte daar niet, net zo min als bij de simulator of bij ctf.
    render(<Werkvormen doet={{ aanpassen: 'Een opdracht in een verse terminal.' }} />);
    const rij = screen.getByRole('rowheader', { name: 'Aanpassen' }).closest('tr') as HTMLElement;
    expect(within(rij).getByText('Een opdracht in een verse terminal.')).toBeTruthy();
    expect(within(rij).queryByText(/code die er al staat/)).toBeNull();
    expect(within(rij).getAllByRole('link').length).toBeGreaterThan(0);
    // De andere onderdelen houden hun tekst.
    const uitleg = screen.getByRole('rowheader', { name: 'Uitleg met een voorbeeld' });
    expect(uitleg.closest('tr')?.textContent).toContain('met werkende code erbij');
  });

  it('een werkvorm die niet bestaat, stopt de build', () => {
    // Een tikfout liet de eigen tekst stil weg, en dan stond er de tekst
    // over code bij een cursus zonder code.
    const stil = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Werkvormen doet={{ aanpasen: 'x' }} />)).toThrow(
      /geen werkvorm 'aanpasen'/,
    );
    stil.mockRestore();
  });

  it('elke cursus die het gebruikt, noemt alleen werkvormen die bestaan', () => {
    const ids = new Set(WERKVORMEN.map((w: { id: string }) => w.id));
    const fout: string[] = [];
    let gezien = 0;
    // In jsdom is import.meta.url geen bestand: de tests draaien vanuit de root.
    for (const vak of readdirSync(`${ROOT}/sites`)) {
      const vakMap = `${ROOT}/sites/${vak}`;
      if (!statSync(vakMap).isDirectory()) continue;
      for (const site of readdirSync(vakMap)) {
        const pagina = `${vakMap}/${site}/src/pages/docenten.mdx`;
        if (!existsSync(pagina)) continue;
        const blok = readFileSync(pagina, 'utf8').match(
          /<Werkvormen\s+doet=\{\{([\s\S]*?)\}\}\s*\/>/,
        );
        if (!blok) continue;
        gezien++;
        for (const m of blok[1].matchAll(/^\s*(\w+):/gm))
          if (!ids.has(m[1])) fout.push(`${site}: ${m[1]}`);
      }
    }
    expect(fout).toEqual([]);
    // Linux, de editor-cursus en ctf hebben een eigen tekst.
    expect(gezien).toBeGreaterThanOrEqual(3);
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
