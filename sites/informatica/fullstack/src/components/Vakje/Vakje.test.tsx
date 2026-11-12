import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Vakje from './index';

// De controlelijst van Beveilig je eigen project: 27 vakjes die uit stonden.

afterEach(cleanup);

describe('Vakje', () => {
  it('een vakje uit een takenlijst kun je aanvinken en weer uitzetten', () => {
    // Zo maakt Markdown het: disabled, en checked staat vast.
    render(<Vakje type="checkbox" disabled checked={false} />);
    const vakje = screen.getByRole('checkbox') as HTMLInputElement;
    expect(vakje.disabled).toBe(false);
    fireEvent.click(vakje);
    expect(vakje.checked).toBe(true);
    fireEvent.click(vakje);
    expect(vakje.checked).toBe(false);
  });

  it('een punt dat in de les al is afgevinkt, begint aangevinkt', () => {
    render(<Vakje type="checkbox" disabled checked />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });

  it('een ander invoerveld blijft zoals het is', () => {
    render(<Vakje type="text" disabled aria-label="naam" />);
    expect((screen.getByLabelText('naam') as HTMLInputElement).disabled).toBe(true);
  });

  it('staat in MDXComponents, en de controlelijst heeft vakjes', () => {
    const lees = (pad: string) =>
      readFileSync(fileURLToPath(new URL(pad, import.meta.url)), 'utf8');
    expect(lees('../../theme/MDXComponents.tsx')).toMatch(/\binput: Vakje\b/);
    expect(lees('../../../docs/veiligheid/eigen-project.mdx').match(/^- \[ \] /gm)?.length).toBe(
      27,
    );
  });
});
