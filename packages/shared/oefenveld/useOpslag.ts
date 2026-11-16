import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { type Code, type Fout, type Opslag, soortFout, veldSleutel } from './opslag';

const BEWAAR_NA_MS = 500;
// Antwoordt IndexedDB niet (een hangende database, een browser die de vraag
// in de wacht zet), dan opent het veld met de startcode en bewaart het deze
// sessie niets: schrijven over werk dat we niet konden lezen, zou het juist
// weggooien. De klok telt tikken en geen milliseconden: op een trage computer
// die nog met de pagina bezig is, komt er geen tik en ook geen antwoord van
// de database, en dat is geen hangende database. Met één timer van anderhalve
// seconde gaf het veld het daar op (met een twintig keer vertraagde processor
// drie van de vier velden van een les) en bleef het werk van de leerling weg.
const TIK_MS = 100;
const GEEF_OP_NA_TIKKEN = 15;

export type OpslagStand = 'leeg' | 'bewaard' | Fout;

interface Opties<C extends Code> {
  /** Zonder opslag (een veld buiten een cursus) doet de hook niets. */
  opslag: Opslag<C> | null;
  start: C;
  huidig: C;
  /** Het element van het veld; het draagt `data-zaad`. */
  containerRef: RefObject<HTMLElement | null>;
  /** Zet de bewaarde code terug in het veld. */
  onHerstel: (code: C) => void;
}

export function useOpslag<C extends Code>({
  opslag,
  start,
  huidig,
  containerRef,
  onHerstel,
}: Opties<C>) {
  // Tot het laden klaar is, toont het veld de editor nog niet (web) of laat
  // het niet typen (python). CodeMirror neemt een wijziging van buitenaf op
  // in zijn undo-geschiedenis; zou de bewaarde code pas ná het tonen
  // binnenkomen, dan bracht Ctrl+Z de leerling terug naar de startcode. En
  // wat hij vóór het laden typte, zou verdwijnen.
  const [geladen, setGeladen] = useState(opslag === null);
  const [stand, setStand] = useState<OpslagStand>('leeg');
  const [zaad] = useState(() => (opslag ? opslag.zaadVan(start) : ''));

  const startRef = useRef(start);
  const onHerstelRef = useRef(onHerstel);
  onHerstelRef.current = onHerstel;
  const sleutelRef = useRef<string | null>(null);
  const laatstRef = useRef<C>(start);
  const teBewarenRef = useRef<C | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: laadt één keer per veld; opslag, zaad en de ref veranderen niet.
  useEffect(() => {
    if (!opslag) return;
    let klaar = false;
    const container = containerRef.current;
    // Het hoeveelste veld met deze startcode op de pagina (zie veldSleutel).
    // Uit de DOM en niet uit een teller: die zou bij navigeren tussen lessen
    // opnieuw moeten beginnen.
    const n = container
      ? Array.from(document.querySelectorAll(`[data-zaad="${zaad}"]`)).indexOf(container)
      : 0;
    const sleutel = veldSleutel(window.location.pathname, zaad, Math.max(n, 0));
    // Wat er bij het vorige vertrek nog niet in de database stond.
    const nood = opslag.leesNood(sleutel, zaad);
    const herstel = (code: C | undefined) => {
      if (!code || opslag.gelijk(code, startRef.current)) return false;
      laatstRef.current = code;
      onHerstelRef.current(code);
      return true;
    };

    let tikken = 0;
    const klok = window.setInterval(() => {
      tikken += 1;
      if (klaar || tikken < GEEF_OP_NA_TIKKEN) return;
      klaar = true;
      window.clearInterval(klok);
      // De noodkopie is wel te lezen: die krijgt de leerling terug, en hij
      // blijft staan tot de database hem een keer aanneemt.
      herstel(nood);
      setStand('geweigerd');
      setGeladen(true);
    }, TIK_MS);

    opslag
      .laad(sleutel, zaad)
      .then((code) => {
        if (klaar) return;
        klaar = true;
        window.clearInterval(klok);
        sleutelRef.current = sleutel;
        if (nood) {
          opslag
            .bewaar(sleutel, nood, startRef.current, zaad)
            .then(() => opslag.wisNood(sleutel))
            .catch(() => {});
        }
        if (herstel(nood ?? code)) setStand('bewaard');
        setGeladen(true);
      })
      .catch((fout: unknown) => {
        if (klaar) return;
        klaar = true;
        window.clearInterval(klok);
        herstel(nood);
        setStand(soortFout(fout));
        setGeladen(true);
      });

    return () => {
      klaar = true;
      window.clearInterval(klok);
    };
  }, []);

  // `weg`: de pagina kan elk moment verdwijnen. Dan gaat de code ook als
  // noodkopie naar localStorage, want een schrijfactie naar IndexedDB die nu
  // begint, komt bij herladen niet aan.
  const schrijf = useCallback(
    (weg = false) => {
      const sleutel = sleutelRef.current;
      const code = teBewarenRef.current;
      if (!opslag || !sleutel || !code) return;
      teBewarenRef.current = null;
      const nood = weg ? opslag.zetNood(sleutel, code, zaad) : undefined;
      opslag
        .bewaar(sleutel, code, startRef.current, zaad)
        .then(() => {
          if (weg) opslag.wisNood(sleutel, nood);
          setStand(opslag.gelijk(code, startRef.current) ? 'leeg' : 'bewaard');
        })
        .catch((fout: unknown) => setStand(soortFout(fout)));
    },
    [opslag, zaad],
  );

  // Na elke wijziging een halve seconde wachten, zodat niet elke toetsaanslag
  // een schrijfactie wordt.
  useEffect(() => {
    if (!opslag || !geladen || !sleutelRef.current) return;
    if (opslag.gelijk(huidig, laatstRef.current)) return;
    laatstRef.current = huidig;
    teBewarenRef.current = huidig;
    const timer = window.setTimeout(schrijf, BEWAAR_NA_MS);
    return () => window.clearTimeout(timer);
  }, [huidig, geladen, opslag, schrijf]);

  // Wat er nog in de wacht staat gaat meteen weg als de leerling de tab
  // wisselt, de pagina sluit of herlaadt, of doorklikt naar de volgende les;
  // dat laatste is in Docusaurus geen nieuwe pagina maar een unmount van dit
  // veld.
  useEffect(() => {
    const bijWeg = () => schrijf(true);
    const bijVerbergen = () => {
      if (document.visibilityState === 'hidden') bijWeg();
    };
    document.addEventListener('visibilitychange', bijVerbergen);
    window.addEventListener('pagehide', bijWeg);
    return () => {
      document.removeEventListener('visibilitychange', bijVerbergen);
      window.removeEventListener('pagehide', bijWeg);
      bijWeg();
    };
  }, [schrijf]);

  const wis = useCallback(() => {
    teBewarenRef.current = null;
    laatstRef.current = startRef.current;
    const sleutel = sleutelRef.current;
    if (!opslag || !sleutel) return;
    opslag.wisNood(sleutel);
    opslag
      .wis(sleutel)
      .then(() => setStand('leeg'))
      .catch((fout: unknown) => setStand(soortFout(fout)));
  }, [opslag]);

  return { geladen, stand, zaad, wis };
}
