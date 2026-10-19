import Keuzelijst from '@coderius/shared/components/Keuzelijst';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Plek, ProjectFiles } from '../types';
import { regelsVan } from '../vragen';
import styles from './CodeWeergave.module.css';

// De code van het project, met de regels gemarkeerd waar een concept of
// vondst staat. Bedoeld voor het mondeling: je wijst naar de regel ("regel
// 14: wat doet dit?") zonder dat de leerling zijn editor hoeft te openen, en
// je markeert vooraf regels als vraag. Klik op een regelnummer om een regel
// te kiezen, shift-klik om een reeks te kiezen.

export interface CodeOpen {
  /** Waar de docent op klikte, bijvoorbeeld '<canvas>' of 'display: flex'. */
  titel: string;
  plekken: Plek[];
  /**
   * Een reeks regels die als geheel oplicht, zoals het fragment van een
   * vraag: één plek om naartoe te gaan, niet een plek per regel.
   */
  bereik?: { bestand: string; van: number; tot: number };
}

interface CodeWeergaveProps {
  files: ProjectFiles;
  textKinds: string[];
  open: CodeOpen | null;
  onSluit: () => void;
  /** Weglaten: geen markeren (geen open beoordeling). */
  onMarkeer?: (bestand: string, van: number, tot: number, vraag: string) => void;
}

interface Selectie {
  anker: number;
  eind: number;
}

export function CodeWeergave({ files, textKinds, open, onSluit, onMarkeer }: CodeWeergaveProps) {
  const dialoog = useRef<HTMLDialogElement>(null);
  const regelRefs = useRef(new Map<number, HTMLLIElement>());
  const bestanden = useMemo(
    () =>
      Object.values(files)
        .filter((f) => f.content !== null && textKinds.includes(f.kind))
        .map((f) => f.path)
        .sort((a, b) => a.localeCompare(b)),
    [files, textKinds],
  );
  const plekken = open?.plekken ?? [];
  const [plekNr, setPlekNr] = useState(0);
  const [bestand, setBestand] = useState<string | null>(null);
  const [doel, setDoel] = useState<number | null>(null);
  const [selectie, setSelectie] = useState<Selectie | null>(null);
  const [vraag, setVraag] = useState('');
  const [melding, setMelding] = useState<string | null>(null);

  useEffect(() => {
    const d = dialoog.current;
    if (!d) return;
    if (open) {
      const eerste = open.plekken[0];
      setPlekNr(0);
      // Zonder plekken: het startbestand van een website, anders het eerste.
      const start = bestanden.find((b) => /(^|\/)index\.html?$/i.test(b)) ?? bestanden[0];
      // Alleen een bestand dat als tekst is ingelezen kan open.
      const gevraagd = eerste?.bestand;
      setBestand(gevraagd && bestanden.includes(gevraagd) ? gevraagd : (start ?? null));
      setDoel(eerste?.regel ?? null);
      setSelectie(null);
      setVraag('');
      setMelding(null);
      if (!d.open) d.showModal();
    } else if (d.open) {
      d.close();
    }
  }, [open, bestanden]);

  // Scrol de regel waar het om gaat naar het midden, ook als alleen het
  // bestand wisselt (andere regels onder hetzelfde nummer) of het venster
  // opnieuw opengaat op dezelfde plek (de lijst is dan nieuw, en staat
  // bovenaan).
  // biome-ignore lint/correctness/useExhaustiveDependencies: bestand en open zijn de aanleiding, geen waarden die het effect leest
  useEffect(() => {
    if (doel === null) return;
    regelRefs.current.get(doel)?.scrollIntoView({ block: 'center' });
  }, [doel, bestand, open]);

  // Dezelfde regels als de fragmenten bij de vragen, dus dezelfde nummers.
  const regels = useMemo(
    () => (bestand ? (regelsVan(files, bestand) ?? []) : []),
    [files, bestand],
  );
  const bereik = open?.bereik;
  const treffers = useMemo(() => {
    const regels = new Set(plekken.filter((p) => p.bestand === bestand).map((p) => p.regel));
    if (bereik && bereik.bestand === bestand) {
      for (let r = bereik.van; r <= bereik.tot; r++) regels.add(r);
    }
    return regels;
  }, [plekken, bestand, bereik]);
  const van = selectie ? Math.min(selectie.anker, selectie.eind) : null;
  const tot = selectie ? Math.max(selectie.anker, selectie.eind) : null;

  const naarPlek = (nr: number) => {
    const p = plekken[nr];
    if (!p) return;
    setPlekNr(nr);
    if (p.bestand !== bestand) setSelectie(null);
    setBestand(p.bestand);
    setDoel(p.regel);
  };

  const kiesRegel = (nr: number, uitbreiden: boolean) => {
    setMelding(null);
    setSelectie((s) => (uitbreiden && s ? { anker: s.anker, eind: nr } : { anker: nr, eind: nr }));
  };

  const markeer = () => {
    if (!onMarkeer || !bestand || van === null || tot === null) return;
    onMarkeer(bestand, van, tot, vraag);
    setMelding(
      van === tot
        ? `Regel ${van} staat bij de vragen.`
        : `Regels ${van}–${tot} staan bij de vragen.`,
    );
    setSelectie(null);
    setVraag('');
  };

  return (
    <dialog ref={dialoog} className={styles.dialoog} onClose={onSluit} aria-labelledby="code-titel">
      {open && (
        <div className={styles.kader}>
          <header className={styles.kop}>
            <h2 id="code-titel" className={styles.titel}>
              {open.titel}
            </h2>
            <button type="button" className={styles.sluit} onClick={onSluit}>
              Sluiten
            </button>
          </header>

          <div className={styles.balk}>
            <div className={styles.bestandKeuze}>
              <span id="code-bestand">Bestand</span>
              <Keuzelijst
                label="Bestand"
                waarde={bestand}
                opties={bestanden.map((b) => ({ waarde: b, label: b }))}
                onKies={(b) => {
                  setBestand(b);
                  setSelectie(null);
                  setDoel(treffersIn(plekken, b)[0] ?? 1);
                  // De teller volgt mee: de eerste plek in dit bestand.
                  const eerste = plekken.findIndex((p) => p.bestand === b);
                  if (eerste !== -1) setPlekNr(eerste);
                }}
              />
            </div>
            {plekken.length > 0 && (
              <div className={styles.plekken}>
                <button type="button" onClick={() => naarPlek(plekNr - 1)} disabled={plekNr === 0}>
                  Vorige
                </button>
                <span>
                  plek {plekNr + 1} van {plekken.length}
                </span>
                <button
                  type="button"
                  onClick={() => naarPlek(plekNr + 1)}
                  disabled={plekNr >= plekken.length - 1}
                >
                  Volgende
                </button>
              </div>
            )}
          </div>

          <ol className={styles.code} aria-label={bestand ?? 'Code'}>
            {regels.map((tekst, i) => {
              const nr = i + 1;
              const gekozen = van !== null && tot !== null && nr >= van && nr <= tot;
              return (
                <li
                  key={nr}
                  ref={(el) => {
                    if (el) regelRefs.current.set(nr, el);
                    else regelRefs.current.delete(nr);
                  }}
                  className={`${styles.regel} ${treffers.has(nr) ? styles.treffer : ''} ${gekozen ? styles.gekozen : ''}`}
                >
                  <button
                    type="button"
                    className={styles.nr}
                    onClick={(e) => kiesRegel(nr, e.shiftKey)}
                    aria-pressed={gekozen}
                    aria-label={`Regel ${nr} kiezen`}
                    disabled={!onMarkeer}
                  >
                    {nr}
                  </button>
                  <code className={styles.tekst}>{tekst || ' '}</code>
                </li>
              );
            })}
          </ol>

          {onMarkeer && (
            <footer className={styles.voet}>
              {van === null ? (
                <p className={styles.hint}>
                  Klik op een regelnummer om een regel te kiezen; shift-klik voor een reeks regels.
                </p>
              ) : (
                <>
                  <span className={styles.gekozenLabel}>
                    {van === tot ? `Regel ${van}` : `Regels ${van}–${tot}`}
                  </span>
                  <input
                    className={styles.vraag}
                    value={vraag}
                    onChange={(e) => setVraag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') markeer();
                    }}
                    placeholder="Wat wil je hierover vragen?"
                    aria-label="Vraag bij deze regels"
                  />
                  <button type="button" className={styles.markeer} onClick={markeer}>
                    Markeer als vraag
                  </button>
                </>
              )}
              {melding && (
                <output className={styles.melding} aria-live="polite">
                  {melding}
                </output>
              )}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}

function treffersIn(plekken: Plek[], bestand: string): number[] {
  return plekken.filter((p) => p.bestand === bestand).map((p) => p.regel);
}
