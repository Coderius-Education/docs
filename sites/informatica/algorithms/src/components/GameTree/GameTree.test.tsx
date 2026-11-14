// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { PaneelContext } from '@coderius/shared/components/LesTabs/paneel';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import GameTree from './index';

// In een les-tabblad staat de spelboom op 1280 bij 720 op zijn kleinste zoom
// (zoom.ts). De ruimte om de boom (een marge van 1,5rem eronder, die alleen
// boven de knop Volgende stond) maakte de stappen Teken de boom en De wortel
// van minimax 2 en De wandeling in de boom van bouwsteen 8 een paar pixels te
// lang. In een tabblad is die ruimte kleiner; daarbuiten en op papier niet.

afterEach(cleanup);

// In jsdom is import.meta.url geen bestandsadres, dus het pad vanuit de root.
const css = readFileSync(
  'sites/informatica/algorithms/src/components/GameTree/styles.module.css',
  'utf8',
);

const omhulsel = (container: HTMLElement) =>
  container.querySelector('ul')?.parentElement as HTMLElement;

describe('GameTree', () => {
  it('heeft in een tabblad minder ruimte om de boom', () => {
    const { container } = render(
      <PaneelContext.Provider value={() => {}}>
        <GameTree bord="XXO/OOX/..." />
      </PaneelContext.Provider>,
    );
    expect(omhulsel(container).className).toContain('inTab');
    const regel = css.match(/@media screen\s*\{\s*\.omhulsel\.inTab\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(regel).toMatch(/margin:\s*0\.5rem 0;/);
    expect(regel).toMatch(/padding:\s*0\.25rem 0 0\.5rem;/);
  });

  it('houdt buiten een tabblad zijn ruimte', () => {
    const { container } = render(<GameTree bord="XXO/OOX/..." />);
    expect(omhulsel(container).className).not.toContain('inTab');
  });
});
