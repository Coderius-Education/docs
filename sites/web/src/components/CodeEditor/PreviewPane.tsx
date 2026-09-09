import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import styles from './CodeEditor.module.css';

/** Breedtes waarop je het voorbeeld kunt bekijken; `null` is de volle kolom. */
export const VIEWPORTS = [
  { label: 'Telefoon', breedte: 320 },
  { label: 'Tablet', breedte: 768 },
  { label: 'Breed', breedte: 1100 },
] as const;

interface PreviewPaneProps {
  srcDoc: string;
  /** Vaste hoogte voor de iframe (gestapelde vorm, gemeten aan de inhoud);
   *  zonder deze prop vult de iframe de kolom (flex). */
  hoogte?: string;
  innerRef?: React.Ref<HTMLIFrameElement>;
}

export function PreviewPane({ srcDoc, hoogte, innerRef }: PreviewPaneProps) {
  // De preview-kolom is zo'n 330px breed op een laptop, en dat is smaller dan
  // elk breekpunt dat de media-queries-les gebruikt. Zonder deze knoppen ziet
  // de leerling altijd de smalle variant en verandert er nooit iets.
  const [viewport, setViewport] = useState<number | null>(null);
  const [beschikbaar, setBeschikbaar] = useState(0);
  const vakRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vak = vakRef.current;
    if (!vak || typeof ResizeObserver === 'undefined') return;
    const meet = () => setBeschikbaar(vak.clientWidth);
    meet();
    const waarnemer = new ResizeObserver(meet);
    waarnemer.observe(vak);
    return () => waarnemer.disconnect();
  }, []);

  // De iframe krijgt de gekozen breedte écht — anders evalueert de browser de
  // media queries op de kolombreedte — en wordt daarna verkleind zodat hij
  // past. Nooit vergroten: dan wordt een smalle keuze wazig uitgerekt.
  const schaal = viewport && beschikbaar ? Math.min(1, beschikbaar / viewport) : 1;

  return (
    <div className={styles.previewSide}>
      <div className={styles.previewLabel}>
        <span>Voorbeeld</span>
        <span className={styles.viewportKnoppen}>
          <button
            type="button"
            className={`${styles.viewportKnop} ${viewport === null ? styles.viewportKnopActief : ''}`}
            onClick={() => setViewport(null)}
          >
            Vol
          </button>
          {VIEWPORTS.map((v) => (
            <button
              type="button"
              key={v.breedte}
              className={`${styles.viewportKnop} ${viewport === v.breedte ? styles.viewportKnopActief : ''}`}
              onClick={() => setViewport(v.breedte)}
              title={`Bekijk het voorbeeld op ${v.breedte} pixels breed`}
            >
              {v.label}
            </button>
          ))}
        </span>
      </div>
      <div
        className={styles.previewVak}
        ref={vakRef}
        style={hoogte ? { height: hoogte, flex: 'none' } : undefined}
      >
        <iframe
          ref={innerRef}
          className={styles.preview}
          style={
            viewport
              ? {
                  width: `${viewport}px`,
                  height: `${100 / schaal}%`,
                  transform: `scale(${schaal})`,
                  transformOrigin: 'top left',
                }
              : undefined
          }
          srcDoc={srcDoc}
          // Zonder allow-popups-to-escape-sandbox erft een nieuw tabblad de
          // sandbox: het krijgt een opaque origin, cookies en localStorage
          // gooien een SecurityError, en de meeste echte sites doen het dan
          // niet. De les Pagina's koppelen belooft een écht nieuw tabblad.
          sandbox="allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox"
          title="Code voorbeeld"
        />
      </div>
      {viewport !== null && (
        <div className={styles.viewportMelding}>
          Voorbeeld op {viewport} pixels breed
          {schaal < 1 ? `, verkleind naar ${Math.round(schaal * 100)}% om te passen` : ''}
        </div>
      )}
    </div>
  );
}
