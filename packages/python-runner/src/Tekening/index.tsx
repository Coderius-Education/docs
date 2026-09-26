import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import styles from './styles.module.css';
import { type Tekening as TekeningData, afspeelduur, naarSvg } from './tekening';

// Het doek van de turtle. Zonder `tot` speelt hij de tekening af, zodat je de
// schildpad ziet lopen; met `tot` (de Stapper) toont hij precies de stand na
// zoveel gebeurtenissen. De SVG zelf komt uit naarSvg, dezelfde functie die
// de doelplaatjes in de projecten maakt; die ontsnapt alles wat uit de code
// van de leerling komt.

export default function Tekening({
  tekening,
  tot,
}: {
  tekening: TekeningData;
  tot?: number;
}): React.JSX.Element {
  // Een nieuwe ronde is een nieuwe Doek (key), die weer bij nul begint.
  const [ronde, setRonde] = useState(0);
  const [klaar, setKlaar] = useState(false);
  const afspelen = tot === undefined && afspeelduur(tekening) > 0;

  return (
    <div className={styles.tekening}>
      <Doek key={ronde} tekening={tekening} tot={tot} onKlaar={setKlaar} />
      {afspelen && (
        <button
          type="button"
          className={styles.opnieuw}
          onClick={() => {
            setKlaar(false);
            setRonde((r) => r + 1);
          }}
          disabled={!klaar}
        >
          Nog een keer tekenen
        </button>
      )}
    </div>
  );
}

function Doek({
  tekening,
  tot,
  onKlaar,
}: {
  tekening: TekeningData;
  tot?: number;
  onKlaar: (klaar: boolean) => void;
}): React.JSX.Element {
  const totaal = tekening.gebeurtenissen.length;
  const duur = afspeelduur(tekening);
  const [afgespeeld, setAfgespeeld] = useState(tot === undefined && duur > 0 ? 0 : totaal);

  useEffect(() => {
    if (tot !== undefined || duur === 0) {
      setAfgespeeld(totaal);
      onKlaar(true);
      return;
    }
    let frame = 0;
    const begin = performance.now();
    const stap = (nu: number) => {
      const deel = Math.min(1, (nu - begin) / duur);
      setAfgespeeld(Math.round(deel * totaal));
      if (deel < 1) frame = requestAnimationFrame(stap);
      else onKlaar(true);
    };
    frame = requestAnimationFrame(stap);
    return () => cancelAnimationFrame(frame);
  }, [tot, duur, totaal, onKlaar]);

  const svg = useMemo(() => naarSvg(tekening, tot ?? afgespeeld), [tekening, tot, afgespeeld]);

  // biome-ignore lint/security/noDangerouslySetInnerHtml: naarSvg ontsnapt alle tekst uit de leerlingcode.
  return <div className={styles.doek} dangerouslySetInnerHTML={{ __html: svg }} />;
}
