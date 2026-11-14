// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { breedsteGroot, getekend } from './Vergroot';
import LesTabs, {
  LesDoel,
  LesLeerdoel,
  LesReeks,
  LesStap,
  LesStappen,
  LesTab,
  LesVeld,
  LesVoorbeeld,
  VOLGENDE_KNOP,
  useInLesTab,
} from './index';
import { useLesDoel } from './paneel';
import { pasCode } from './pasCode';
import { MARGE, schuifInRij } from './schuifRij';

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

// pasCode en verdeelSpeling doen hun echte werk, en schrijven op wanneer ze
// draaien: de volgorde staat vast in 'pasCode rekent na de speling opnieuw'.
const aanroepen = vi.hoisted(() => [] as string[]);
vi.mock('./pasCode', async (echt) => {
  const m = await echt<typeof import('./pasCode')>();
  return {
    ...m,
    pasCode: (...a: Parameters<typeof m.pasCode>) => {
      aanroepen.push('pasCode');
      m.pasCode(...a);
    },
  };
});
vi.mock('./speling', async (echt) => {
  const m = await echt<typeof import('./speling')>();
  return {
    ...m,
    verdeelSpeling: (...a: Parameters<typeof m.verdeelSpeling>) => {
      aanroepen.push('verdeelSpeling');
      m.verdeelSpeling(...a);
    },
  };
});

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

  it('laat de pagina staan als het doel al in beeld is', () => {
    // De arm van de Golfbot: "Eerst de servo op 90°" is een anker bovenaan een
    // stap. De pagina schoof er 162 pixels naartoe, en de rij tabbladen stond
    // dan onder de navbar. Of iets in beeld staat, meet jsdom niet: de maten
    // staan hier vast.
    const echt = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => ({ top: 300, bottom: 340 }) as DOMRect;
    try {
      locatie = { pathname: '/les', hash: '#een-fout', search: '' };
      render(<Les />);
      expect(paneel('er-gaat-iets-mis').hidden).toBe(false);
      expect(scrol).not.toHaveBeenCalled();
    } finally {
      Element.prototype.getBoundingClientRect = echt;
    }
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

  it('merkt de knop Volgende, zodat de link naar de volgende les dan weg kan', () => {
    // De opmaak verbergt die link zolang het open tabblad `data-les-verder`
    // als kind heeft; op het laatste tabblad staat hij er weer.
    render(<Les />);
    expect(paneel('theorie').querySelector(':scope > [data-les-verder] button')).not.toBeNull();
    expect(paneel('er-gaat-iets-mis').querySelector('[data-les-verder]')).toBeNull();
  });

  it('vindt met VOLGENDE_KNOP de knop Volgende van het open tabblad', () => {
    // De oefenterminal van Linux zet met Esc en dan Tab de focus op deze
    // knop. Een selector die niets meer vindt, valt daar stil: de Tab gaat
    // dan naar Opnieuw beginnen.
    render(<Les />);
    expect(document.querySelector(VOLGENDE_KNOP)).toBe(
      screen.getByRole('button', { name: 'Volgende: Opdracht 1' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: Opdracht 1' }));
    const knop = document.querySelector(VOLGENDE_KNOP);
    expect(knop).toBe(screen.getByRole('button', { name: 'Volgende: Er gaat iets mis' }));
    expect(paneel('opdracht-1-tel').contains(knop)).toBe(true);
    // Het laatste tabblad heeft geen knop Volgende.
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: Er gaat iets mis' }));
    expect(document.querySelector(VOLGENDE_KNOP)).toBeNull();
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

describe('een volle rij stappen', () => {
  it('heeft de naam van een stap in een eigen vak, en voluit in de titel van de knop', () => {
    // Op een breed scherm staat de rij op één regel: de knoppen die niet open
    // staan krimpen, en hun naam eindigt dan op een beletselteken. De opmaak
    // kort het vak in, niet de knop; de hele naam staat in de titel. Of de
    // rij op één regel staat, meet het meetscript (`stapregels`).
    render(<LesMetStappen />);
    const knop = document.querySelector('[data-stap="koppen"]') as HTMLElement;
    expect(knop.querySelector('span:last-child')?.textContent).toBe('Koppen');
    expect(knop.getAttribute('title')).toBe('Koppen');
    // Een schermlezer leest de naam van de knop, niet de titel.
    expect(knop.textContent).toBe('2Koppen');
    // Een tabblad heeft dat vak niet: daar staat het icoon met de naam.
    expect(document.querySelector('[data-tab="make"]')?.getAttribute('title')).toBeNull();
  });
});

describe('de code van een les', () => {
  it('wordt opnieuw gemeten als het lettertype van de code geladen is', () => {
    // Het lettertype van de code laadt pas als er code in beeld komt, en is
    // breder dan wat er tot dan staat. Een regel die paste toen pasCode.ts
    // hem mat, was daarna dertig pixels afgesneden (fullstack, Cookies). De
    // les luistert daarom naar `loadingdone`, en ruimt dat weer op.
    const letters = new EventTarget();
    const erbij = vi.spyOn(letters, 'addEventListener');
    const eraf = vi.spyOn(letters, 'removeEventListener');
    Object.defineProperty(document, 'fonts', { value: letters, configurable: true });
    try {
      const { unmount } = render(<Les />);
      expect(erbij).toHaveBeenCalledWith('loadingdone', expect.any(Function));
      unmount();
      expect(eraf).toHaveBeenCalledWith('loadingdone', expect.any(Function));
    } finally {
      Reflect.deleteProperty(document, 'fonts');
    }
  });
});

describe('code past ook met een schuifbalk', () => {
  it('pasCode rekent na de speling opnieuw', () => {
    // verdeelSpeling kan een codevak lager maken; dan schuift het verticaal,
    // en een klassieke schuifbalk nam 10 px van de breedte (robotica, tof:
    // de langste regel viel af). Na elke wissel van tabblad dus eerst de
    // letters (dat verandert de hoogte), dan de speling, en dan de letters
    // nog een keer, nu met de schuifbalk erbij. Welke pixels dat zijn, ziet
    // alleen een browser; de volgorde staat hier vast.
    const beeld = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((terug) => {
      terug(0);
      return 1;
    });
    aanroepen.length = 0;
    try {
      render(<Les />);
      expect(aanroepen).toEqual(['pasCode', 'verdeelSpeling', 'pasCode']);
      aanroepen.length = 0;
      fireEvent.click(screen.getByRole('tab', { name: /Opdracht 1/ }));
      // Een klik in de les meet ook (een andere stap), dus het rondje kan
      // twee keer gaan; elk rondje heeft dezelfde volgorde.
      expect(aanroepen.length).toBeGreaterThanOrEqual(3);
      expect(aanroepen.length % 3).toBe(0);
      for (let i = 0; i < aanroepen.length; i += 3)
        expect(aanroepen.slice(i, i + 3)).toEqual(['pasCode', 'verdeelSpeling', 'pasCode']);
    } finally {
      beeld.mockRestore();
      aanroepen.length = 0;
    }
  });
});

describe('de verwachte uitvoer in een oefenveld', () => {
  it('krijgt geen kleinere letters: hij breekt af, zoals uitvoer in een terminal', () => {
    // De CodeExercise van python-runner toont de verwachte uitvoer in zijn
    // uitvoerkolom, en daar breekt een lange regel af (`.doel pre code`).
    // pasCode maakte de letters eerst tot 80% kleiner, en daarna brak de
    // regel toch: klein en afgebroken. Een blok dat zelf afbreekt, slaat
    // pasCode over, net als de uitvoer van het veld.
    const stijl = document.createElement('style');
    stijl.textContent = '.doel pre code { white-space: pre-wrap; }';
    document.head.append(stijl);
    const wortel = document.createElement('div');
    const blok = '<div class="theme-code-block"><pre><code>een lange regel</code></pre></div>';
    wortel.innerHTML = `<div class="doel"><p>Verwachte uitvoer:</p>${blok}</div>${blok}`;
    document.body.append(wortel);
    try {
      const [doel, les] = Array.from(wortel.querySelectorAll('pre'));
      for (const pre of [doel, les]) {
        Object.defineProperty(pre, 'clientWidth', { value: 400, configurable: true });
        Object.defineProperty(pre, 'scrollWidth', {
          configurable: true,
          get: () => (pre.style.fontSize ? 400 : 440),
        });
      }
      // Was hij al verkleind (een venster dat smaller werd), dan gaat dat eraf.
      doel.style.fontSize = '12px';
      pasCode(wortel);
      expect(doel.style.fontSize).toBe('');
      expect(doel.hasAttribute('data-code-breekt')).toBe(false);
      // Een gewoon codeblok van de les krijgt wel kleinere letters.
      expect(les.style.fontSize).not.toBe('');
    } finally {
      wortel.remove();
      stijl.remove();
    }
  });
});

describe('de knop Volgende', () => {
  it('zegt niet twee keer Volgende als het volgende tabblad zo heet', () => {
    // De laatste stap van Git basis: het tabblad Volgende tutorial stond op
    // de knop als "Volgende: Volgende tutorial".
    render(
      <LesTabs>
        <LesTab id="a" titel="Probeer het zelf" label="Probeer het zelf">
          <p>a</p>
        </LesTab>
        <LesTab id="b" titel="Volgende tutorial" label="Volgende tutorial">
          <p>b</p>
        </LesTab>
      </LesTabs>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Volgende tutorial' }));
    expect(document.getElementById('paneel-b')?.hasAttribute('hidden')).toBe(false);
  });
});

describe('code in een uitklapblok', () => {
  it('wordt gemeten als het blok open is, niet bij de klik', async () => {
    // Bij de klik op de summary is het blok nog dicht en heeft de code geen
    // breedte. In les 2.1 van Linux bleef de uitvoer in het antwoord van de
    // voorspelvraag daardoor op volle grootte staan, 383 pixels afgesneden:
    // het woord waar de vraag om draait, viel weg. De les luistert nu naar
    // `toggle`, dat komt als het blok open is.
    render(
      <LesTabs>
        <LesTab id="a" titel="A" label="A">
          <details>
            <summary>Antwoord</summary>
            <div className="theme-code-block">
              <pre>
                <code>een lange regel uitvoer</code>
              </pre>
            </div>
          </details>
        </LesTab>
        <LesTab id="b" titel="B" label="B">
          <p>b</p>
        </LesTab>
      </LesTabs>,
    );
    const beeld = () => new Promise((klaar) => window.requestAnimationFrame(() => klaar(null)));
    const details = document.querySelector('details') as HTMLDetailsElement;
    const pre = document.querySelector('pre') as HTMLPreElement;
    Object.defineProperty(pre, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(pre, 'scrollWidth', {
      configurable: true,
      get: () => (pre.style.fontSize ? 400 : 440),
    });
    await beeld();
    // Dicht: niets gemeten.
    expect(pre.style.fontSize).toBe('');
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
    await beeld();
    expect(pre.style.fontSize).not.toBe('');
  });
});

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

describe('een rij stappen die zijwaarts schuift', () => {
  // In de smalle kolom naast de oefenterminal van Linux, en op een telefoon,
  // schuift de rij stappen. Na een link naar een latere stap, de knop
  // Volgende of het laden met een stap in het adres stond de knop van de
  // open stap buiten beeld. De rij schuift nu zelf, met scrollLeft: de
  // pagina verspringt niet (geen scrollIntoView, geen window.scrollTo).
  //
  // jsdom heeft geen opmaak: hier is de rij 200 pixels breed en elke knop
  // 100, naast elkaar, en scrollLeft schuift ze echt.
  const BREEDTE = 200;
  const schuif = new WeakMap<Element, number>();
  const rijVan = (el: Element) => el.closest('[aria-label="Stappen in dit onderdeel"]');
  const echt = {
    rect: Element.prototype.getBoundingClientRect,
    links: Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft'),
    breed: Object.getOwnPropertyDescriptor(Element.prototype, 'scrollWidth'),
    zicht: Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth'),
  };
  let schuiftRij = true;
  beforeEach(() => {
    schuiftRij = true;
    Object.defineProperty(Element.prototype, 'scrollLeft', {
      configurable: true,
      get() {
        return schuif.get(this) ?? 0;
      },
      set(v: number) {
        const rij = this as Element;
        const max = rij.querySelectorAll('[data-stap]').length * 100 - BREEDTE;
        schuif.set(rij, Math.max(0, Math.min(max, v)));
      },
    });
    Object.defineProperty(Element.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        return schuiftRij ? (this as Element).querySelectorAll('[data-stap]').length * 100 : 0;
      },
    });
    Object.defineProperty(Element.prototype, 'clientWidth', {
      configurable: true,
      get: () => BREEDTE,
    });
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const rij = rijVan(this);
      if (this.hasAttribute('data-stap') && rij) {
        const i = Array.from(rij.querySelectorAll('[data-stap]')).indexOf(this);
        const left = i * 100 - (schuif.get(rij) ?? 0);
        return { left, right: left + 100, top: 300, bottom: 340 } as DOMRect;
      }
      if (rij === this) return { left: 0, right: BREEDTE, top: 300, bottom: 340 } as DOMRect;
      return { left: 0, right: 0, top: 300, bottom: 340 } as DOMRect;
    };
  });
  afterEach(() => {
    Element.prototype.getBoundingClientRect = echt.rect;
    for (const [naam, d] of [
      ['scrollLeft', echt.links],
      ['scrollWidth', echt.breed],
      ['clientWidth', echt.zicht],
    ] as const) {
      if (d) Object.defineProperty(Element.prototype, naam, d);
      else delete (Element.prototype as unknown as Record<string, unknown>)[naam];
    }
  });

  /** Staat de knop van de open stap helemaal in de rij? */
  const inBeeld = () => {
    const knop = document.querySelector('[data-stap][aria-selected="true"]') as HTMLElement;
    const { left, right } = knop.getBoundingClientRect();
    return left >= 0 && right <= BREEDTE;
  };
  const rij = () =>
    document.querySelector('[aria-label="Stappen in dit onderdeel"]') as HTMLElement;

  it('zet bij het laden met een latere stap in het adres die knop in beeld', () => {
    const naarBoven = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    locatie = { pathname: '/les', hash: '#lijsten', search: '' };
    render(<LesMetStappen />);
    expect(stap()).toBe('3Lijsten');
    expect(rij().scrollLeft).toBeGreaterThan(0);
    expect(inBeeld()).toBe(true);
    // Alleen de rij schuift: de pagina blijft staan.
    expect(scrol).not.toHaveBeenCalled();
    expect(naarBoven).not.toHaveBeenCalled();
    naarBoven.mockRestore();
  });

  it('volgt de knop Volgende, en een link terug naar de eerste stap', () => {
    const { rerender } = render(<LesMetStappen />);
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: Koppen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: Lijsten' }));
    expect(stap()).toBe('3Lijsten');
    expect(inBeeld()).toBe(true);
    expect(scrol).not.toHaveBeenCalled();
    locatie = { pathname: '/les', hash: '#theorie-basis', search: '' };
    rerender(<LesMetStappen />);
    expect(stap()).toBe('1De basis');
    expect(rij().scrollLeft).toBe(0);
  });

  it('zet de knop weer in beeld als het tabblad opnieuw opengaat', () => {
    // Een rij die niet te zien was, begint in de browser weer links.
    render(<LesMetStappen />);
    fireEvent.click(document.querySelector('[data-stap="lijsten"]') as HTMLElement);
    fireEvent.click(document.querySelector('[data-tab="make"]') as HTMLElement);
    rij().scrollLeft = 0;
    fireEvent.click(document.querySelector('[data-tab="theorie"]') as HTMLElement);
    expect(stap()).toBe('3Lijsten');
    expect(inBeeld()).toBe(true);
  });

  it('zet de knop in beeld als de rij pas later gaat schuiven', () => {
    // Het oefenveld komt pas na het hydrateren naast de les: dan wordt de
    // rij smaller en gaat hij schuiven. jsdom heeft geen ResizeObserver.
    const waarnemers: [Element, () => void][] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        terug: () => void;
        constructor(terug: () => void) {
          this.terug = terug;
        }
        observe(el: Element) {
          waarnemers.push([el, this.terug]);
        }
        disconnect() {}
      },
    );
    try {
      schuiftRij = false;
      locatie = { pathname: '/les', hash: '#lijsten', search: '' };
      render(<LesMetStappen />);
      expect(rij().scrollLeft).toBe(0);
      schuiftRij = true;
      for (const [el, terug] of waarnemers) if (el === rij()) terug();
      expect(inBeeld()).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('koppelt de oude waarnemer los na een wissel van stap, en alles bij het weggaan', () => {
    // Na elke wissel van stap komt er een nieuwe ResizeObserver op de rij.
    // Zonder disconnect bleef elke oude meekijken, en zette hij bij elke
    // andere maat een knop in beeld die niet meer open stond.
    const waarnemers: { el: Element; los: number }[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        eigen: { el: Element; los: number }[] = [];
        observe(el: Element) {
          const w = { el, los: 0 };
          this.eigen.push(w);
          waarnemers.push(w);
        }
        disconnect() {
          for (const w of this.eigen) w.los++;
        }
      },
    );
    try {
      const { unmount } = render(<LesMetStappen />);
      const opRij = () => waarnemers.filter((w) => w.el === rij());
      const voor = opRij().length;
      expect(voor).toBeGreaterThan(0);
      expect(opRij().every((w, i) => (i < voor - 1 ? w.los === 1 : w.los === 0))).toBe(true);
      fireEvent.click(screen.getByRole('button', { name: 'Volgende: Koppen' }));
      const na = opRij();
      expect(na.length).toBeGreaterThan(voor);
      // De oude zijn elk één keer losgekoppeld, alleen de nieuwste kijkt nog.
      expect(na.slice(0, -1).map((w) => w.los)).toEqual(na.slice(0, -1).map(() => 1));
      expect(na.at(-1)?.los).toBe(0);
      unmount();
      expect(waarnemers.every((w) => w.los === 1)).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('een rij die niet schuift, blijft staan', () => {
    schuiftRij = false;
    locatie = { pathname: '/les', hash: '#lijsten', search: '' };
    render(<LesMetStappen />);
    expect(rij().scrollLeft).toBe(0);
  });
});

describe('schuifInRij', () => {
  const maak = (knop: { left: number; right: number }, scrollLeft = 0) => {
    const rij = {
      scrollWidth: 600,
      clientWidth: 200,
      scrollLeft,
      getBoundingClientRect: () => ({ left: 0, right: 200 }),
    } as unknown as HTMLElement;
    const k = { getBoundingClientRect: () => knop } as unknown as HTMLElement;
    return { rij, k };
  };

  it('schuift naar rechts tot de knop er met een stukje van de volgende in staat', () => {
    const { rij, k } = maak({ left: 250, right: 330 });
    schuifInRij(rij, k);
    expect(rij.scrollLeft).toBe(330 - 200 + MARGE);
  });

  it('schuift naar links voor een knop die links buiten beeld staat', () => {
    const { rij, k } = maak({ left: -90, right: -10 }, 300);
    schuifInRij(rij, k);
    expect(rij.scrollLeft).toBe(300 - 90 - MARGE);
  });

  it('een knop die breder is dan de rij, begint links in beeld', () => {
    const { rij, k } = maak({ left: 120, right: 420 });
    schuifInRij(rij, k);
    expect(rij.scrollLeft).toBe(120);
  });

  it('een knop die al in beeld staat, laat de rij staan', () => {
    const { rij, k } = maak({ left: 20, right: 120 }, 40);
    schuifInRij(rij, k);
    expect(rij.scrollLeft).toBe(40);
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

  it('stappen in een uitklapblok houden de knop Volgende niet vast', () => {
    // Deel 5 van de Lego-auto importeert het deel over I2C in een <details>.
    // Dat deel heeft drie stappen, en de knop Volgende liep die af terwijl het
    // blok dicht was: "Volgende: In je code", en er veranderde niets.
    render(
      <LesTabs>
        <LesTab id="stap-1" titel="Stap 1" label="Stap 1">
          <p>code</p>
          <details>
            <summary>Waarom staat er SDA en SCL?</summary>
            <LesStappen>
              <LesStap id="twee-draden" titel="Twee draden" label="Twee draden">
                <p>a</p>
              </LesStap>
              <LesStap id="in-je-code" titel="In je code" label="In je code">
                <p>b</p>
              </LesStap>
            </LesStappen>
          </details>
        </LesTab>
        <LesTab id="voorspel" titel="Voorspel" label="Voorspel">
          <p>vraag</p>
        </LesTab>
      </LesTabs>,
    );
    expect(screen.queryByRole('button', { name: 'Volgende: In je code' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: Voorspel' }));
    expect(tabblad()).toBe('Voorspel');
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

  it('code met een vraag ernaast heeft een hoger codevak dan code met een lijst', () => {
    const { container } = render(
      <>
        <LesVoorbeeld toelichting="ja">
          <pre>code</pre>
        </LesVoorbeeld>
        <LesVoorbeeld toelichting="vraag">
          <pre>code</pre>
        </LesVoorbeeld>
      </>,
    );
    const [lijst, vraag] = Array.from(container.querySelectorAll('[data-les-voorbeeld]'));
    expect(vraag.className).toContain(lijst.className);
    expect(vraag.className).not.toBe(lijst.className);
  });
});

describe('een kort label op het tabblad', () => {
  it('toont het nummer, en houdt het label voor een schermlezer en de knop Volgende', () => {
    // Code beter begrijpen (robotica): tien tabbladen stonden op twee regels.
    // Na de eerste opdracht staat alleen het nummer op het tabblad.
    render(
      <LesTabs>
        <LesTab id="a" titel="Opdracht 5.7.a: een loop" label="Opdracht 5.7.a">
          <p>a</p>
        </LesTab>
        <LesTab id="b" titel="Opdracht 5.7.b: twee loops" label="Opdracht 5.7.b" kort="5.7.b">
          <p>b</p>
        </LesTab>
      </LesTabs>,
    );
    const tab = screen.getByRole('tab', { name: 'Opdracht 5.7.b' });
    expect(tab.textContent).toBe('5.7.b');
    expect(tab.getAttribute('title')).toBe('Opdracht 5.7.b: twee loops');
    expect(screen.getByRole('button', { name: /Volgende/ }).textContent).toContain(
      'Opdracht 5.7.b',
    );
  });
});

describe('LesReeks', () => {
  const reeks = () =>
    render(
      <LesReeks>
        <figure>stap 1</figure>
        <figure>stap 2</figure>
        <figure>stap 3</figure>
      </LesReeks>,
    );
  const zichtbaar = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('figure'))
      .filter((f) => !f.closest('[hidden]'))
      .map((f) => f.textContent);

  it('toont één plaatje tegelijk, met Vorige en Volgende en een teller', () => {
    // De toren van de Golfbot: tien bouwstappen onder elkaar waren 3375
    // pixels te lang. Zoals in een bouwboekje staat er één in beeld.
    const { container } = reeks();
    expect(zichtbaar(container)).toEqual(['stap 1']);
    expect(container.textContent).toContain('Plaatje 1 van 3');
    const vorige = screen.getByRole('button', { name: 'Vorige' }) as HTMLButtonElement;
    const volgende = screen.getByRole('button', { name: 'Volgende' }) as HTMLButtonElement;
    expect(vorige.disabled).toBe(true);
    fireEvent.click(volgende);
    fireEvent.click(volgende);
    expect(zichtbaar(container)).toEqual(['stap 3']);
    expect(container.textContent).toContain('Plaatje 3 van 3');
    expect(volgende.disabled).toBe(true);
    fireEvent.click(vorige);
    expect(zichtbaar(container)).toEqual(['stap 2']);
  });

  it('zet elk plaatje in de HTML van de build', () => {
    // cross-links en een zoekmachine lezen de HTML; een plaatje dat pas na een
    // klik bestaat, zien ze niet.
    const html = renderToStaticMarkup(
      <LesReeks>
        <figure>stap 1</figure>
        <figure>stap 2</figure>
        <figure>stap 3</figure>
      </LesReeks>,
    );
    expect(html.match(/<figure>/g)).toHaveLength(3);
  });
});

describe('de knop Volgende bij een reeks plaatjes', () => {
  // Bij de toren van de Golfbot stonden er twee knoppen Volgende: die van de
  // reeks, en rechtsonder "Volgende: Controlevraag". De tweede ging verder
  // terwijl de reeks nog op plaatje 1 van 10 stond.
  const les = () =>
    render(
      <LesTabs>
        <LesTab id="toren" titel="De toren" label="De toren">
          <LesStappen>
            <LesStap id="toren-basis" titel="De basis" label="De basis">
              <p>vooraf</p>
            </LesStap>
            <LesStap id="bouwstappen" titel="De bouwstappen" label="De bouwstappen">
              <LesReeks>
                <figure>stap 1</figure>
                <figure>stap 2</figure>
                <figure>stap 3</figure>
              </LesReeks>
            </LesStap>
          </LesStappen>
        </LesTab>
        <LesTab id="controlevraag" titel="Controlevraag" label="Controlevraag">
          <p>vraag</p>
        </LesTab>
      </LesTabs>,
    );
  const teller = () => document.querySelector('[data-les-reeks] [aria-live]')?.textContent;

  it('een reeks in een stap die niet open is, doet niet mee', () => {
    les();
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: De bouwstappen' }));
    expect(stap()).toBe('2De bouwstappen');
  });

  it('loopt eerst de plaatjes af, en gaat dan pas verder', () => {
    les();
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: De bouwstappen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: plaatje 2 van 3' }));
    expect(teller()).toBe('Plaatje 2 van 3');
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: plaatje 3 van 3' }));
    expect(teller()).toBe('Plaatje 3 van 3');
    expect(tabblad()).toBe('De toren');
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: Controlevraag' }));
    expect(tabblad()).toBe('Controlevraag');
  });

  it('wie met de knop van de reeks zelf bladert, komt op hetzelfde uit', () => {
    les();
    fireEvent.click(screen.getByRole('button', { name: 'Volgende: De bouwstappen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Volgende' }));
    expect(screen.getByRole('button', { name: 'Volgende: plaatje 3 van 3' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Volgende' }));
    expect(screen.getByRole('button', { name: 'Volgende: Controlevraag' })).toBeTruthy();
  });
});

describe('een plaatje vergroten', () => {
  // Een aansluitschema van robotica stond op 128 pixels breed: de namen van
  // de pinnen waren niet te lezen. Een klik toont het groot. Maten meet jsdom
  // niet, dus die staan hier vast; of het venster er goed uitziet, is in
  // Chromium bekeken.
  const les = () =>
    render(
      <LesTabs>
        <LesTab id="aansluiten" titel="Aansluiten" label="Aansluiten">
          <p>
            <img src="/schema.png" alt="Het schema van de joystick" />
          </p>
          <button type="button">
            <img src="/foto.png" alt="Een foto in een knop" />
          </button>
        </LesTab>
        <LesTab id="code" titel="Code" label="Code">
          <p>code</p>
        </LesTab>
      </LesTabs>,
    );
  const maten = (img: HTMLElement, natuurlijk: number, getoond: number) => {
    for (const [naam, waarde] of Object.entries({
      naturalWidth: natuurlijk,
      naturalHeight: natuurlijk,
      clientWidth: getoond,
      clientHeight: getoond,
    }))
      Object.defineProperty(img, naam, { value: waarde, configurable: true });
  };
  const toon = vi.fn();
  beforeEach(() => {
    toon.mockClear();
    // jsdom kent showModal niet.
    HTMLDialogElement.prototype.showModal = toon;
  });

  it('een klik op een plaatje dat kleiner staat dan het is, toont het groot', () => {
    const { container } = les();
    const schema = screen.getByAltText('Het schema van de joystick');
    maten(schema, 1600, 240);
    fireEvent.click(schema);
    expect(toon).toHaveBeenCalledTimes(1);
    const groot = container.querySelector('dialog img');
    expect(groot?.getAttribute('src')).toMatch(/\/schema\.png$/);
    expect(groot?.getAttribute('alt')).toBe('Het schema van de joystick');
    expect(screen.getByRole('button', { name: 'Sluiten', hidden: true })).toBeTruthy();
  });

  it('met Enter kan het ook', () => {
    les();
    const schema = screen.getByAltText('Het schema van de joystick');
    maten(schema, 1600, 240);
    fireEvent.keyDown(schema, { key: 'Enter' });
    expect(toon).toHaveBeenCalledTimes(1);
  });

  it('een plaatje op zijn eigen grootte, of in een knop, doet niets', () => {
    const { container } = les();
    const schema = screen.getByAltText('Het schema van de joystick');
    maten(schema, 240, 240);
    fireEvent.click(schema);
    const foto = screen.getByAltText('Een foto in een knop');
    maten(foto, 1600, 100);
    fireEvent.click(foto);
    expect(toon).not.toHaveBeenCalled();
    expect(container.querySelector('dialog img')).toBeNull();
  });
});

describe('het label Klik om te vergroten', () => {
  // Het label hing aan de alinea om het plaatje. Een bouwstap in een <figure>
  // had er geen, en op een telefoon stond het op 44 plaatjes die in het
  // venster kleiner werden dan in de les (348 tegen 358 pixels).
  const maten = (img: HTMLElement, natuurlijk: number, getoond: number) => {
    for (const [naam, waarde] of Object.entries({
      naturalWidth: natuurlijk,
      naturalHeight: natuurlijk,
      clientWidth: getoond,
      clientHeight: getoond,
    }))
      Object.defineProperty(img, naam, { value: waarde, configurable: true });
  };
  const les = () =>
    render(
      <LesTabs>
        <LesTab id="bouwen" titel="Bouwen" label="Bouwen">
          <figure>
            <img src="/stap-01.jpg" alt="Bouwstap 1" />
            <figcaption>Stap 1</figcaption>
          </figure>
        </LesTab>
        <LesTab id="code" titel="Code" label="Code">
          <p>code</p>
        </LesTab>
      </LesTabs>,
    );
  const breedte = window.innerWidth;
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: breedte, configurable: true });
  });
  const opnieuw = () => fireEvent(window, new Event('resize'));

  it('staat op het element om het plaatje, ook als dat geen alinea is', () => {
    les();
    const img = screen.getByAltText('Bouwstap 1');
    maten(img, 1000, 427);
    opnieuw();
    expect(img.hasAttribute('data-vergroot')).toBe(true);
    expect(img.parentElement?.tagName).toBe('FIGURE');
    expect(img.parentElement?.hasAttribute('data-vergroot-vak')).toBe(true);
    // Staat het plaatje daarna op zijn eigen grootte, dan gaat het label weg.
    maten(img, 1000, 1000);
    opnieuw();
    expect(img.hasAttribute('data-vergroot')).toBe(false);
    expect(img.parentElement?.hasAttribute('data-vergroot-vak')).toBe(false);
  });

  it('niet op een telefoon: het venster is daar smaller dan het plaatje in de les', () => {
    const toon = vi.fn();
    HTMLDialogElement.prototype.showModal = toon;
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    les();
    const img = screen.getByAltText('Bouwstap 1');
    maten(img, 1600, 358);
    opnieuw();
    expect(breedsteGroot(390)).toBeLessThan(358 * 1.2);
    expect(img.hasAttribute('data-vergroot')).toBe(false);
    fireEvent.click(img);
    expect(toon).not.toHaveBeenCalled();
  });

  it('de hoek van het plaatje in zijn vak: daar staat het label, en daar opent het venster', () => {
    // Een staand schema (1600 bij 3000) in een vak van 500 bij 496: het
    // plaatje is 265 breed en staat in het midden van het vak.
    const {
      x,
      y,
      breedte: b,
      hoogte: h,
    } = getekend({ breedte: 500, hoogte: 496 }, { breedte: 1600, hoogte: 3000 });
    expect(Math.round(b)).toBe(265);
    expect(Math.round(h)).toBe(496);
    expect(Math.round(x)).toBe(118);
    expect(y).toBe(0);
    // Een plaatje dat nog niet geladen is, heeft geen maten.
    expect(getekend({ breedte: 500, hoogte: 496 }, { breedte: 0, hoogte: 0 })).toEqual({
      x: 0,
      y: 0,
      breedte: 500,
      hoogte: 496,
    });
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
