// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { PaneelContext } from '@coderius/shared/components/LesTabs/paneel';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import HanoiGame from './index';

// Het spel van Torens van Hanoi staat in de lessen Het spel en Op zoek naar
// patronen in een tabblad, met de vragen waar de leerling op let. Onder elkaar
// (kop, uitleg, knoppen, palen, melding) was het 510 pixels hoog, en dan paste
// het tabblad Speel niet op 1280 bij 720. In een tabblad staan de palen op een
// breed scherm daarom naast de uitleg en de knoppen, en vervalt de kop "Speel
// zelf": het tabblad zegt al wat het is. Of het past, meet
// scripts/meet-les-tabs.mjs; hier staat de vorm vast.

afterEach(cleanup);

// In jsdom is import.meta.url geen bestandsadres, dus het pad vanuit de root.
const css = readFileSync(
  'sites/informatica/algorithms/src/components/HanoiGame/styles.module.css',
  'utf8',
);

describe('HanoiGame', () => {
  it('heeft buiten een tabblad zijn kop, en in een tabblad niet', () => {
    render(<HanoiGame />);
    screen.getByText('Speel zelf');
    cleanup();
    render(
      <PaneelContext.Provider value={() => {}}>
        <HanoiGame />
      </PaneelContext.Provider>,
    );
    expect(screen.queryByText('Speel zelf')).toBeNull();
  });

  it('zet in een tabblad de palen naast de knoppen, vanaf 997 pixels', () => {
    const { container } = render(
      <PaneelContext.Provider value={() => {}}>
        <HanoiGame />
      </PaneelContext.Provider>,
    );
    const spel = container.querySelector('section') as HTMLElement;
    expect(spel.className).toContain('inTab');
    const blok = css.slice(css.indexOf('@media (min-width: 997px)'));
    expect(blok).toMatch(/\.inTab\s*\{[^}]*display:\s*grid/);
    expect(blok).toMatch(/["']board header["']/);
    // Na de gewone regels: met dezelfde selector ervoor won de gewone regel.
    expect(css.indexOf('@media (min-width: 997px)')).toBeGreaterThan(css.indexOf('.statusWin'));
  });

  it('laat de paal niet door de naam van de paal lopen', () => {
    // Tot onderaan liep de paal door de letter A, B of C heen.
    const paal = css.match(/\n\.pole \{([^}]*)\}/)?.[1] ?? '';
    expect(paal).toMatch(/bottom:\s*2\.4rem/);
    const naam = css.match(/\n\.pegNaam \{([^}]*)\}/)?.[1] ?? '';
    expect(naam).toMatch(/margin-top:\s*0\.4rem/);
  });

  it('blijft buiten een tabblad onder elkaar', () => {
    const { container } = render(<HanoiGame />);
    expect((container.querySelector('section') as HTMLElement).className).not.toContain('inTab');
  });
});
