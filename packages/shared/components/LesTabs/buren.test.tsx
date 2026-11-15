// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBuren, zetBuren } from './buren';

// De paginator van Docusaurus (theme/DocPaginator) zet de vorige en de
// volgende les neer; de rij onderaan een tabblad leest ze. Een tabblad dat al
// staat, krijgt ze alsnog: de paginator staat na de les.
function Toon() {
  const { vorige, volgende } = useBuren();
  return <p>{`${vorige?.titel ?? '-'} | ${volgende?.titel ?? '-'}`}</p>;
}

describe('de vorige en de volgende les', () => {
  it('komen bij een tabblad dat er al staat, en gaan weer weg met de les', () => {
    render(<Toon />);
    expect(screen.getByText('- | -')).toBeTruthy();
    act(() => zetBuren({ vorige: { titel: 'Intro', adres: '/intro' } }));
    expect(screen.getByText('Intro | -')).toBeTruthy();
    act(() => zetBuren({}));
    expect(screen.getByText('- | -')).toBeTruthy();
  });
});
