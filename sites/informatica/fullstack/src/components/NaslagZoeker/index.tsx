import { type ReactElement, useEffect, useRef, useState } from 'react';
import { normaal, past, splitsLabel } from './logica';
import styles from './styles.module.css';

// Een zoekbalk boven een naslagpagina die uit <details>-blokken onder
// ##-koppen bestaat (Cheatsheet, Er gaat iets mis). Hij filtert de blokken
// op de pagina zelf, zodat de markdown gewone markdown blijft en de tests
// die cheatsheet.md en troubleshooting.md lezen niets hoeven te weten.

interface Onderwerp {
  details: HTMLDetailsElement;
  tekst: string;
}

interface Hoofdstuk {
  kop: HTMLHeadingElement;
  id: string;
  titel: string;
  /** Alles tussen deze kop en de volgende: weg als er niets in past. */
  inhoud: HTMLElement[];
  onderwerpen: Onderwerp[];
}

const SOORTEN = {
  cheatsheet: {
    placeholder: 'Zoek, bijvoorbeeld redirect',
    wat: 'onderwerpen',
  },
  fouten: {
    placeholder: 'Plak hier je foutmelding',
    wat: 'problemen',
  },
};

/** Opent of sluit een blok zoals een klik dat doet, want Docusaurus houdt zelf bij of hij open is. */
function zet(details: HTMLDetailsElement, open: boolean) {
  if (details.open !== open) details.querySelector('summary')?.click();
}

export default function NaslagZoeker({
  soort,
}: {
  soort: keyof typeof SOORTEN;
}): ReactElement {
  const wortel = useRef<HTMLDivElement>(null);
  const veld = useRef<HTMLInputElement>(null);
  const [hoofdstukken, setHoofdstukken] = useState<Hoofdstuk[]>([]);
  const [zoek, setZoek] = useState('');
  const [allesOpen, setAllesOpen] = useState(false);

  // De pagina eenmaal lezen: de koppen en de blokken eronder.
  useEffect(() => {
    const artikel = wortel.current?.closest('.theme-doc-markdown');
    if (!artikel) return;
    const lijst: Hoofdstuk[] = [];
    for (const kind of Array.from(artikel.children) as HTMLElement[]) {
      if (kind.tagName === 'H2') {
        lijst.push({
          kop: kind as HTMLHeadingElement,
          id: kind.id,
          titel: (kind.textContent ?? '').replace(/#$/, '').replace(/​/g, '').trim(),
          inhoud: [],
          onderwerpen: [],
        });
        continue;
      }
      const huidig = lijst.at(-1);
      if (!huidig) continue;
      huidig.inhoud.push(kind);
      const blokken =
        kind.tagName === 'DETAILS'
          ? [kind as HTMLDetailsElement]
          : Array.from(kind.querySelectorAll('details'));
      for (const details of blokken) {
        huidig.onderwerpen.push({ details, tekst: normaal(details.textContent ?? '') });
      }
    }
    // Op de cheatsheet komt de code achter de vraag als label: "Hoe geef ik
    // JSON terug?" met @app.get ernaast in plaats van tussen haakjes.
    if (soort === 'cheatsheet') {
      for (const h of lijst)
        for (const { details } of h.onderwerpen) {
          const summary = details.querySelector('summary');
          if (!summary || summary.dataset.label !== undefined) continue;
          if (summary.childElementCount > 0) continue;
          const { vraag, label } = splitsLabel(summary.textContent ?? '');
          if (!label) continue;
          summary.dataset.label = label;
          summary.textContent = vraag;
          const code = document.createElement('code');
          code.className = styles.label;
          code.textContent = label;
          summary.append(' ', code);
        }
    }
    setHoofdstukken(lijst);
    const uitUrl = new URLSearchParams(window.location.search).get('zoek');
    if (uitUrl) setZoek(uitUrl);
  }, [soort]);

  // Filteren bij elke toets: de DOM aanpassen hoort in een effect, de
  // telling komt in de state.
  const [telling, setTelling] = useState<{
    zichtbaar: number;
    totaal: number;
    raak: HTMLDetailsElement[];
  }>({ zichtbaar: 0, totaal: 0, raak: [] });
  useEffect(() => {
    let zichtbaar = 0;
    let totaal = 0;
    const raak: HTMLDetailsElement[] = [];
    for (const h of hoofdstukken) {
      let inDit = 0;
      const zichtbaarHier: HTMLDetailsElement[] = [];
      for (const o of h.onderwerpen) {
        totaal++;
        const ja = past(o.tekst, zoek);
        o.details.style.display = ja ? '' : 'none';
        if (ja) {
          inDit++;
          raak.push(o.details);
          zichtbaarHier.push(o.details);
        }
      }
      // De eerste en de laatste zichtbare rij krijgen de ronde hoeken: met
      // verborgen rijen ertussen ziet CSS niet welke dat zijn.
      for (const d of h.onderwerpen) delete d.details.dataset.rand;
      zichtbaarHier.forEach((d, i) => {
        const rand = [i === 0 && 'eerste', i === zichtbaarHier.length - 1 && 'laatste'].filter(
          Boolean,
        );
        if (rand.length) d.dataset.rand = rand.join(' ');
      });
      zichtbaar += inDit;
      const weg = zoek.trim() !== '' && inDit === 0;
      h.kop.style.display = weg ? 'none' : '';
      for (const el of h.inhoud) if (el.tagName !== 'DETAILS') el.style.display = weg ? 'none' : '';
    }
    setTelling({ zichtbaar, totaal, raak });
  }, [hoofdstukken, zoek]);

  // Een paar treffers: meteen open, dan staat de oplossing er.
  useEffect(() => {
    if (zoek.trim() && telling.raak.length <= 3) for (const d of telling.raak) zet(d, true);
  }, [telling, zoek]);

  // De zoekopdracht in de URL, zodat je hem kunt delen.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (zoek.trim()) url.searchParams.set('zoek', zoek);
    else url.searchParams.delete('zoek');
    window.history.replaceState(window.history.state, '', url);
  }, [zoek]);

  // Een / ergens op de pagina zet je in het zoekveld.
  useEffect(() => {
    const toets = (e: KeyboardEvent) => {
      const doel = e.target as HTMLElement | null;
      if (e.key !== '/' || doel?.closest('input, textarea, [contenteditable]')) return;
      e.preventDefault();
      veld.current?.focus();
    };
    window.addEventListener('keydown', toets);
    return () => window.removeEventListener('keydown', toets);
  }, []);

  const { placeholder, wat } = SOORTEN[soort];
  const zoekt = zoek.trim() !== '';

  return (
    <div ref={wortel} className={styles.zoeker} data-naslag="">
      <div className={styles.balk}>
        <input
          ref={veld}
          type="search"
          className={styles.veld}
          placeholder={placeholder}
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          aria-label={`Zoek in de ${wat}`}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className={styles.knop}
          onClick={() => {
            const open = !allesOpen;
            for (const d of telling.raak) zet(d, open);
            setAllesOpen(open);
          }}
        >
          {allesOpen ? 'Alles dicht' : 'Alles open'}
        </button>
      </div>
      <p className={styles.telling} aria-live="polite">
        {zoekt
          ? `${telling.zichtbaar} van ${telling.totaal} ${wat}`
          : `${telling.totaal} ${wat}. Typ / om te zoeken.`}
      </p>
      {zoekt && telling.zichtbaar === 0 && (
        <p className={styles.leeg}>
          Niets gevonden voor <strong>{zoek}</strong>. Probeer één woord, zoals de naam van de fout
          of de functie.
        </p>
      )}
      {!zoekt && hoofdstukken.length > 0 && (
        <nav className={styles.chips} aria-label="Hoofdstukken">
          {hoofdstukken.map((h) => (
            <a key={h.id} href={`#${h.id}`} className={styles.chip}>
              {h.titel}
              <span className={styles.aantal}>{h.onderwerpen.length}</span>
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
