import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  type Code,
  type Fout,
  bewaarVeld,
  gelijkeCode,
  laadVeld,
  soortFout,
  veldSleutel,
  wisVeld,
  zaadVan,
} from './opslag';

const BEWAAR_NA_MS = 500;
// Antwoordt IndexedDB niet binnen deze tijd (een hangende database, een
// browser die de vraag in de wacht zet), dan opent het veld met de startcode
// en bewaart het deze sessie niets: schrijven over werk dat we niet konden
// lezen, zou het juist weggooien.
const GEEF_OP_NA_MS = 1500;

export type OpslagStand = 'leeg' | 'bewaard' | Fout;

interface Opties {
  start: Code;
  huidig: Code;
  containerRef: RefObject<HTMLElement | null>;
  // Zet de bewaarde code terug in het veld.
  onHerstel: (code: Code) => void;
}

export function useOpslag({ start, huidig, containerRef, onHerstel }: Opties) {
  // Tot het laden klaar is, toont het veld de editor nog niet. CodeMirror
  // neemt een wijziging van buitenaf op in zijn undo-geschiedenis; zou de
  // bewaarde code pas ná het tonen binnenkomen, dan bracht Ctrl+Z de leerling
  // terug naar de startcode. En wat hij vóór het laden typte, zou verdwijnen.
  const [geladen, setGeladen] = useState(false);
  const [stand, setStand] = useState<OpslagStand>('leeg');
  const [zaad] = useState(() => zaadVan(start));

  const startRef = useRef(start);
  const onHerstelRef = useRef(onHerstel);
  onHerstelRef.current = onHerstel;
  const sleutelRef = useRef<string | null>(null);
  const laatstRef = useRef<Code>(start);
  const teBewarenRef = useRef<Code | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: laadt één keer per veld; start, zaad en de ref veranderen niet.
  useEffect(() => {
    let klaar = false;
    const container = containerRef.current;
    // Het hoeveelste veld met deze startcode op de pagina (zie veldSleutel).
    // Uit de DOM en niet uit een teller: die zou bij navigeren tussen lessen
    // opnieuw moeten beginnen.
    const n = container
      ? Array.from(document.querySelectorAll(`[data-zaad="${zaad}"]`)).indexOf(container)
      : 0;
    const sleutel = veldSleutel(window.location.pathname, zaad, Math.max(n, 0));

    const opgeven = window.setTimeout(() => {
      if (klaar) return;
      klaar = true;
      setStand('geweigerd');
      setGeladen(true);
    }, GEEF_OP_NA_MS);

    laadVeld(sleutel, zaad)
      .then((code) => {
        if (klaar) return;
        klaar = true;
        window.clearTimeout(opgeven);
        sleutelRef.current = sleutel;
        if (code) {
          laatstRef.current = code;
          onHerstelRef.current(code);
          setStand('bewaard');
        }
        setGeladen(true);
      })
      .catch((fout: unknown) => {
        if (klaar) return;
        klaar = true;
        window.clearTimeout(opgeven);
        setStand(soortFout(fout));
        setGeladen(true);
      });

    return () => {
      klaar = true;
      window.clearTimeout(opgeven);
    };
  }, []);

  const schrijf = useCallback(() => {
    const sleutel = sleutelRef.current;
    const code = teBewarenRef.current;
    if (!sleutel || !code) return;
    teBewarenRef.current = null;
    bewaarVeld(sleutel, code, startRef.current, zaad)
      .then(() => setStand(gelijkeCode(code, startRef.current) ? 'leeg' : 'bewaard'))
      .catch((fout: unknown) => setStand(soortFout(fout)));
  }, [zaad]);

  // Na elke wijziging een halve seconde wachten, zodat niet elke toetsaanslag
  // een schrijfactie wordt.
  useEffect(() => {
    if (!geladen || !sleutelRef.current) return;
    if (gelijkeCode(huidig, laatstRef.current)) return;
    laatstRef.current = huidig;
    teBewarenRef.current = huidig;
    const timer = window.setTimeout(schrijf, BEWAAR_NA_MS);
    return () => window.clearTimeout(timer);
  }, [huidig, geladen, schrijf]);

  // Wat er nog in de wacht staat gaat meteen weg als de leerling de tab
  // wisselt, de pagina sluit, of doorklikt naar de volgende les; dat laatste
  // is in Docusaurus geen nieuwe pagina maar een unmount van dit veld.
  useEffect(() => {
    const bijVerbergen = () => {
      if (document.visibilityState === 'hidden') schrijf();
    };
    document.addEventListener('visibilitychange', bijVerbergen);
    window.addEventListener('pagehide', schrijf);
    return () => {
      document.removeEventListener('visibilitychange', bijVerbergen);
      window.removeEventListener('pagehide', schrijf);
      schrijf();
    };
  }, [schrijf]);

  const wis = useCallback(() => {
    teBewarenRef.current = null;
    laatstRef.current = startRef.current;
    const sleutel = sleutelRef.current;
    if (!sleutel) return;
    wisVeld(sleutel)
      .then(() => setStand('leeg'))
      .catch((fout: unknown) => setStand(soortFout(fout)));
  }, []);

  return { geladen, stand, zaad, wis };
}
