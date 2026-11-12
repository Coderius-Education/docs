// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LesTabs, {
  LesDoel,
  LesLeerdoel,
  LesStap,
  LesStappen,
  LesTab,
  LesVeld,
  LesVoorbeeld,
  useInLesTab,
} from './index';
import { useLesDoel } from './paneel';

// react-dom/server heeft hier geen types (zie Voorspel/logica.test.ts).
const { renderToStaticMarkup } = (await import('react-dom/server' as string)) as {
  renderToStaticMarkup: (el: React.ReactElement) => string;
};

// De les-tabbladen op de pagina. Twee dingen mogen nooit stil veranderen:
// elk paneel blijft gemount en staat in de HTML van de build (een oefenveld
// dat opnieuw mount raakt zijn werk kwijt, en een link naar een kop zoekt
// zijn doel in de HTML), en een link naar een kop in een ander tabblad opent
// dat tabblad (Docusaurus scrolt niet naar een verborgen kop).

let locatie = { pathname: '/les', hash: '', search: '' };
vi.mock('@docusaurus/router', () => ({ useLocation: () => locatie }));

const scrol = vi.fn();
beforeEach(() => {
  locatie = { pathname: '/les', hash: '', search: '' };
  scrol.mockClear();
  Element.prototype.scrollIntoView = scrol;
  // jsdom kent CSS.escape niet; de id's hier hebben geen bijzondere tekens.
  vi.stubGlobal('CSS', { escape: (s: string) => s });
  window.history.replaceState(null, '', '/les');
});
afterEach(cleanup);

let mounts = 0;
function Veld() {
  useEffect(() => {
    mounts++;
  }, []);
  return <textarea aria-label="oefenveld" />;
}

function Les() {
  return (
    <LesTabs>
      <LesTab id="theorie" titel="Theorie" label="Theorie">
        <h2 id="theorie">Theorie</h2>
        <p>Uitleg.</p>
      </LesTab>
      <LesTab id="opdracht-1-tel" titel="Opdracht 1: Tel" label="Opdracht 1">
        <h2 id="opdracht-1-tel">Opdracht 1: Tel</h2>
        <Veld />
      </LesTab>
      <LesTab id="er-gaat-iets-mis" titel="Er gaat iets mis" label="Er gaat iets mis">
        <h2 id="er-gaat-iets-mis">Er gaat iets mis</h2>
        <h3 id="een-fout">Een fout</h3>
      </LesTab>
    </LesTabs>
  );
}

const actief = () => screen.getByRole('tab', { selected: true }).textContent;
const paneel = (id: string) => document.getElementById(`paneel-${id}`) as HTMLElement;

describe('LesTabs', () => {
  it('zet elk paneel in de HTML van de build, en toont alleen het eerste', () => {
    const html = renderToStaticMarkup(<Les />);
    for (const id of ['theorie', 'opdracht-1-tel', 'er-gaat-iets-mis', 'een-fout'])
      expect(html).toContain(`id="${id}"`);
    expect(html.match(/role="tabpanel"/g)).toHaveLength(3);
    expect(html.match(/role="tabpanel"[^>]*hidden=""/g)).toHaveLength(2);
    expect(html).toContain('data-les-tabs');
  });

  it('toont het label op het tabblad en de hele kop als titel', () => {
    render(<Les />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Theorie',
      'Opdracht 1',
      'Er gaat iets mis',
    ]);
    expect(screen.getByRole('tab', { name: 'Opdracht 1' }).getAttribute('title')).toBe(
      'Opdracht 1: Tel',
    );
  });

  it('wisselt van paneel zonder een veld opnieuw te mounten', () => {
    mounts = 0;
    render(<Les />);
    expect(paneel('opdracht-1-tel').hidden).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1' }));
    expect(paneel('opdracht-1-tel').hidden).toBe(false);
    expect(paneel('theorie').hidden).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: 'Theorie' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1' }));
    // Eén keer, bij het laden van de pagina: ook toen het paneel verborgen was.
    expect(mounts).toBe(1);
  });

  it('zet het adres van het tabblad in de adresbalk', () => {
    render(<Les />);
    fireEvent.click(screen.getByRole('tab', { name: 'Opdracht 1' }));
    expect(window.location.hash).toBe('#opdracht-1-tel');
  });

  it('opent bij het laden het paneel waarin het doel van de link staat, en scrolt ernaartoe', () => {
    locatie = { pathname: '/les', hash: '#een-fout', search: '' };
    render(<Les />);
    expect(actief()).toBe('Er gaat iets mis');
    expect(paneel('er-gaat-iets-mis').hidden).toBe(false);
    expect(scrol.mock.instances.at(-1)).toBe(document.getElementById('een-fout'));
  });

  it('scrolt niet naar de kop van het tabblad zelf', () => {
    locatie = { pathname: '/les', hash: '#opdracht-1-tel', search: '' };
    render(<Les />);
    expect(actief()).toBe('Opdracht 1');
    expect(scrol).not.toHaveBeenCalled();
  });

  it('volgt een link op de pagina, ook een tweede keer naar hetzelfde doel', () => {
    const { rerender } = render(<Les />);
    locatie = { pathname: '/les', hash: '#een-fout', search: '' };
    rerender(<Les />);
    expect(actief()).toBe('Er gaat iets mis');
    fireEvent.click(screen.getByRole('tab', { name: 'Theorie' }));
    expect(actief()).toBe('Theorie');
    // Dezelfde hash, een nieuwe navigatie: de router geeft een nieuw object.
    locatie = { pathname: '/les', hash: '#een-fout', search: '' };
    rerender(<Les />);
    expect(actief()).toBe('Er gaat iets mis');
  });

  it('laat een hash die niet in de les staat met rust', () => {
    locatie = { pathname: '/les', hash: '#bestaat-niet', search: '' };
    render(<Les />);
    expect(actief()).toBe('Theorie');
  });

  it('loopt met de pijltjes, Home en End langs de tabbladen', () => {
    render(<Les />);
    const lijst = screen.getByRole('tablist');
    fireEvent.keyDown(lijst, { key: 'ArrowRight' });
    expect(actief()).toBe('Opdracht 1');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Opdracht 1' }));
    fireEvent.keyDown(lijst, { key: 'End' });
    expect(actief()).toBe('Er gaat iets mis');
    fireEvent.keyDown(lijst, { key: 'ArrowRight' });
    expect(actief()).toBe('Theorie');
    fireEvent.keyDown(lijst, { key: 'ArrowLeft' });
    expect(actief()).toBe('Er gaat iets mis');
    fireEvent.keyDown(lijst, { key: 'Home' });
    expect(actief()).toBe('Theorie');
  });

  it('heeft onderaan elk paneel een knop naar het volgende, behalve het laatste', () => {
    render(<Les />);
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: Opdracht 1' }));
    expect(actief()).toBe('Opdracht 1');
    expect(paneel('er-gaat-iets-mis').querySelector('button')).toBeNull();
  });
});

// Een tabblad met meer ###-koppen toont ze als stappen, één tegelijk.
function LesMetStappen() {
  return (
    <LesTabs>
      <LesTab id="theorie" titel="Theorie" label="Theorie">
        <h2 id="theorie">Theorie</h2>
        <LesStappen>
          <LesStap id="theorie-basis" titel="De basis" label="De basis">
            <p>Kern.</p>
          </LesStap>
          <LesStap id="koppen" titel="Koppen" label="Koppen">
            <h3 id="koppen">Koppen</h3>
            <h4 id="diep">Diep</h4>
          </LesStap>
          <LesStap id="lijsten" titel="Lijsten" label="Lijsten">
            <h3 id="lijsten">Lijsten</h3>
            <Veld />
          </LesStap>
        </LesStappen>
      </LesTab>
      <LesTab id="make" titel="Make" label="Make">
        <h2 id="make">Make</h2>
      </LesTab>
    </LesTabs>
  );
}

const stap = () =>
  Array.from(document.querySelectorAll('[data-stap]')).find(
    (k) => k.getAttribute('aria-selected') === 'true',
  )?.textContent;
const tabblad = () =>
  Array.from(document.querySelectorAll('[data-tab]')).find(
    (k) => k.getAttribute('aria-selected') === 'true',
  )?.textContent;

describe('het icoon van de werkvorm', () => {
  function LesMetWerkvormen() {
    return (
      <LesTabs>
        <LesTab id="predict" titel="Predict" label="Predict" werkvorm="voorspellen">
          <p>a</p>
        </LesTab>
        <LesTab id="make" titel="Make" label="Make" werkvorm="maken">
          <p>b</p>
        </LesTab>
        <LesTab id="los" titel="Los" label="Los">
          <p>c</p>
        </LesTab>
      </LesTabs>
    );
  }

  it('staat op het tabblad, zonder de naam van het tabblad te veranderen', () => {
    render(<LesMetWerkvormen />);
    const tab = screen.getByRole('tab', { name: 'Predict' });
    const icoon = tab.querySelector('svg');
    expect(icoon?.getAttribute('data-werkvorm')).toBe('voorspellen');
    // Een schermlezer leest het label; het icoon zegt hem niets nieuws.
    expect(icoon?.getAttribute('aria-hidden')).toBe('true');
    expect(icoon?.querySelectorAll('path').length).toBeGreaterThan(0);
    expect(screen.getByRole('tab', { name: 'Make' }).querySelector('svg')).not.toBeNull();
  });

  it('een tabblad zonder werkvorm heeft geen icoon', () => {
    render(<LesMetWerkvormen />);
    expect(screen.getByRole('tab', { name: 'Los' }).querySelector('svg')).toBeNull();
  });

  it('staat ook in de HTML van de build', () => {
    expect(renderToStaticMarkup(<LesMetWerkvormen />)).toMatch(/data-werkvorm="voorspellen"/);
  });
});

describe('LesLeerdoel', () => {
  it('toont het leerdoel met het icoon van de werkvorm, en houdt de kop voor een link', () => {
    const { container } = render(
      <LesLeerdoel>
        <h2 id="wat-ga-je-leren">Wat ga je leren?</h2>
        <p>Koppen en lijsten.</p>
      </LesLeerdoel>,
    );
    expect(container.querySelector('svg')?.getAttribute('data-werkvorm')).toBe('leerdoel');
    expect(screen.getByText('Koppen en lijsten.')).toBeTruthy();
    // De kop blijft in de HTML: een link naar #wat-ga-je-leren moet zijn doel
    // vinden, en een schermlezer hoort wat de zin is.
    expect(document.getElementById('wat-ga-je-leren')?.tagName).toBe('H2');
  });
});

describe('het leerdoel boven de stappen', () => {
  const MetLeerdoel = () => (
    <LesTabs>
      <LesTab id="theorie" titel="Theorie" label="Theorie">
        <LesStappen>
          <LesLeerdoel>
            <h2 id="wat-ga-je-leren">Wat ga je leren?</h2>
            <p>Koppen en lijsten.</p>
          </LesLeerdoel>
          <LesStap id="koppen" titel="Koppen" label="Koppen">
            <h3 id="koppen">Koppen</h3>
          </LesStap>
          <LesStap id="lijsten" titel="Lijsten" label="Lijsten">
            <h3 id="lijsten">Lijsten</h3>
          </LesStap>
        </LesStappen>
      </LesTab>
      <LesTab id="make" titel="Make" label="Make">
        <p>Bouw.</p>
      </LesTab>
    </LesTabs>
  );

  it('staat boven de rij stappen, en alleen bij de eerste stap', () => {
    const { container } = render(<MetLeerdoel />);
    const leerdoel = container.querySelector('[data-les-leerdoel]') as HTMLElement;
    const rij = screen.getByRole('tablist', { name: 'Stappen in dit onderdeel' });
    // Boven de rij: het gaat over de hele les, niet over stap 1.
    expect(leerdoel.compareDocumentPosition(rij) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(leerdoel.closest('[hidden]')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: /Lijsten/ }));
    expect(leerdoel.closest('[hidden]')).not.toBeNull();
    // Het telt niet als stap: er zijn er twee.
    expect(rij.querySelectorAll('[role="tab"]')).toHaveLength(2);
  });

  it('blijft in de HTML van de build, voor een link naar zijn kop', () => {
    expect(renderToStaticMarkup(<MetLeerdoel />)).toContain('id="wat-ga-je-leren"');
  });
});

describe('LesStappen', () => {
  it('zet elke stap in de HTML van de build, en toont alleen de eerste', () => {
    const html = renderToStaticMarkup(<LesMetStappen />);
    for (const id of ['koppen', 'lijsten', 'diep']) expect(html).toContain(`id="${id}"`);
    expect(html).toMatch(/<section[^>]*data-les-stap="theorie-basis"(?![^>]*hidden)/);
    expect(html).toMatch(/<section[^>]*data-les-stap="koppen"[^>]*hidden/);
    expect(html).toMatch(/<section[^>]*data-les-stap="lijsten"[^>]*hidden/);
  });

  it('nummert de stappen en wisselt zonder een veld opnieuw te mounten', () => {
    mounts = 0;
    render(<LesMetStappen />);
    expect(stap()).toBe('1De basis');
    fireEvent.click(document.querySelector('[data-stap="lijsten"]') as HTMLElement);
    expect(stap()).toBe('3Lijsten');
    expect(paneel('lijsten').hidden).toBe(false);
    expect(paneel('theorie-basis').hidden).toBe(true);
    expect(window.location.hash).toBe('#lijsten');
    fireEvent.click(document.querySelector('[data-stap="koppen"]') as HTMLElement);
    expect(mounts).toBe(1);
  });

  it('Volgende loopt eerst de stappen door, en dan pas naar het volgende tabblad', () => {
    render(<LesMetStappen />);
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: Koppen' }));
    expect(stap()).toBe('2Koppen');
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: Lijsten' }));
    expect(stap()).toBe('3Lijsten');
    expect(tabblad()).toBe('Theorie');
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: Make' }));
    expect(tabblad()).toBe('Make');
  });

  it('een link naar de kop van een stap opent het tabblad en de stap, zonder te scrollen', () => {
    const { rerender } = render(<LesMetStappen />);
    fireEvent.click(document.querySelector('[data-tab="make"]') as HTMLElement);
    scrol.mockClear();
    locatie = { pathname: '/les', hash: '#lijsten', search: '' };
    rerender(<LesMetStappen />);
    expect(tabblad()).toBe('Theorie');
    expect(stap()).toBe('3Lijsten');
    expect(scrol).not.toHaveBeenCalled();
  });

  it('een link naar een kop verderop in een stap opent die stap en scrolt ernaartoe', () => {
    locatie = { pathname: '/les', hash: '#diep', search: '' };
    render(<LesMetStappen />);
    expect(stap()).toBe('2Koppen');
    expect(scrol.mock.instances.at(-1)).toBe(document.getElementById('diep'));
  });

  it('het adres van De basis, een stap zonder kop, opent het tabblad', () => {
    // De eerste versie zocht het doel alleen als element met dat id; de stap
    // De basis heeft geen kop, en na herladen stond het eerste tabblad open.
    const { rerender } = render(<LesMetStappen />);
    fireEvent.click(document.querySelector('[data-tab="make"]') as HTMLElement);
    locatie = { pathname: '/les', hash: '#theorie-basis', search: '' };
    rerender(<LesMetStappen />);
    expect(tabblad()).toBe('Theorie');
    expect(stap()).toBe('1De basis');
  });

  it('de pijltjes in de stappen verzetten het tabblad niet', () => {
    render(<LesMetStappen />);
    const lijst = screen.getByRole('tablist', { name: 'Stappen in dit onderdeel' });
    fireEvent.keyDown(lijst, { key: 'ArrowRight' });
    expect(stap()).toBe('2Koppen');
    expect(tabblad()).toBe('Theorie');
  });

  it('een stap zonder LesStappen staat gewoon open', () => {
    render(
      <LesStap id="los" titel="Los" label="Los">
        <p>inhoud</p>
      </LesStap>,
    );
    expect(paneel('los').hidden).toBe(false);
  });
});

describe('useInLesTab', () => {
  // Het oefenveld van de web-cursus vraagt hiermee of het zich aan het
  // scherm moet aanpassen.
  function Vraag() {
    return <output>{useInLesTab() ? 'in een tabblad' : 'los'}</output>;
  }

  it('zegt of een onderdeel in een tabblad staat, ook binnen een stap', () => {
    render(<Vraag />);
    expect(screen.getByRole('status').textContent).toBe('los');
    cleanup();
    render(
      <LesTabs>
        <LesTab id="a" titel="A" label="A">
          <LesStappen>
            <LesStap id="b" titel="B" label="B">
              <Vraag />
            </LesStap>
            <LesStap id="c" titel="C" label="C" />
          </LesStappen>
        </LesTab>
        <LesTab id="d" titel="D" label="D" />
      </LesTabs>,
    );
    expect(screen.getByRole('status').textContent).toBe('in een tabblad');
  });
});

describe('LesVeld', () => {
  // Een oefenveld dat het doel van zijn opdracht zelf toont.
  function Veld() {
    const doel = useLesDoel();
    return (
      <div data-veld="">
        code
        <div data-uitvoer="">{doel}</div>
      </div>
    );
  }

  it('geeft het doel aan het veld, en zet zelf niets neer', () => {
    const { container } = render(
      <section>
        <LesVeld>
          <LesDoel>
            <p>Verwachte uitvoer:</p>
            <pre>12</pre>
          </LesDoel>
          <Veld />
        </LesVeld>
      </section>,
    );
    // Het veld blijft een direct kind van het paneel: de opmaak van het
    // paneel (.paneel > …) en de hoogte van het veld rekenen daarop.
    const sectie = container.querySelector('section') as HTMLElement;
    expect(Array.from(sectie.children).map((el) => el.hasAttribute('data-veld'))).toEqual([true]);
    const uitvoer = container.querySelector('[data-uitvoer]') as HTMLElement;
    expect(uitvoer.textContent).toBe('Verwachte uitvoer:12');
  });

  it('een veld zonder LesVeld heeft geen doel', () => {
    const { container } = render(<Veld />);
    expect(container.querySelector('[data-uitvoer]')?.textContent).toBe('');
  });
});

describe('LesVoorbeeld', () => {
  it('met een voorspelvraag krijgt de vraag de helft van de breedte', () => {
    const { container } = render(
      <>
        <LesVoorbeeld>
          <pre>code</pre>
        </LesVoorbeeld>
        <LesVoorbeeld vraag="ja">
          <pre>code</pre>
        </LesVoorbeeld>
      </>,
    );
    const [gewoon, metVraag] = Array.from(container.querySelectorAll('[data-les-voorbeeld]'));
    expect(metVraag.className).not.toBe(gewoon.className);
    expect(metVraag.className).toContain(gewoon.className);
  });
});

describe('LesTab zonder LesTabs', () => {
  it('staat gewoon open', () => {
    render(
      <LesTab id="los" titel="Los" label="Los">
        <p>inhoud</p>
      </LesTab>,
    );
    expect(paneel('los').hidden).toBe(false);
  });
});
