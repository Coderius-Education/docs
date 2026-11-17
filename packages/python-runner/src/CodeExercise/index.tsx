import { HulpKeuze, HulpVak, type Weergave } from '@coderius/shared/components/LesTabs/Hulp';
import {
  type Hulp,
  hulpBreedte,
  useInLesTab,
  useLesDoel,
  useLesHulp,
} from '@coderius/shared/components/LesTabs/paneel';
import { meetRuimte, pasHoogte } from '@coderius/shared/components/LesTabs/pasHoogte';
import { bevestig } from '@coderius/shared/dialoog';
import { useOpslag } from '@coderius/shared/oefenveld/useOpslag';
import BrowserOnly from '@docusaurus/BrowserOnly';
import type React from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { HighlightedEditor } from '../HighlightedEditor';
import type { Opname, PyodideInterface } from '../PyodideProvider';
import Stapper from '../Stapper';
import Tekening from '../Tekening';
import type { Tekening as TekeningData } from '../Tekening/tekening';
import { type Code, opslagVoor } from './opslag';
import { startcode } from './startcode';
import styles from './styles.module.css';

/** Lager wordt het veld in een tabblad niet: de werkbalk en een regel of vijf. */
const MIN_VELD = 180;
/** Lager wordt de editor niet. */
const MIN_EDITOR = 120;
/** De hoogte van de werkbalk, tot hij gemeten is. */
const BALK = 40;
/** De rand van het veld, boven en onder: die telt mee in zijn hoogte. */
const RAND = 2;

function CodeExerciseInner({
  starterCode,
  aanwijzing,
  site,
  doel,
  hulp,
}: {
  starterCode: string;
  aanwijzing?: string;
  site?: string;
  doel?: React.ReactNode;
  hulp?: Hulp | null;
}) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [opname, setOpname] = useState<Opname | null>(null);
  const [tekening, setTekening] = useState<TekeningData | null>(null);
  // De tip en het antwoord van de opdracht staan op de plek van de uitvoer
  // (useLesHulp): de code van de leerling blijft ernaast staan. Het antwoord
  // draait los van die code, met een eigen uitvoer.
  const [weergave, setWeergave] = useState<Weergave>('uitvoer');
  const [antwoordUit, setAntwoordUit] = useState<string | null>(null);
  const [antwoordTekening, setAntwoordTekening] = useState<TekeningData | null>(null);
  // De code zoals hij was toen de opname werd gemaakt: de leerling mag intussen
  // doortypen, en dan zouden de regelnummers uit de opname naar de verkeerde
  // regels wijzen.
  const [opnameCode, setOpnameCode] = useState('');
  const pyodideRef = useRef<PyodideInterface | null>(null);
  // In een les-tabblad moet het paneel op het scherm passen. Daar staat de
  // uitvoer op een breed scherm naast de code in plaats van eronder, en
  // schuift een lange uitvoer in zijn eigen vak: het veld duwt de rest van
  // het scherm dan niet weg op het moment dat je op Uitvoeren klikt.
  const inTab = useInLesTab();
  // Het veld is daar ook niet hoger dan wat er op het scherm overblijft na
  // wat er in het paneel boven en onder staat (pasHoogte.ts): een startcode
  // van dertig regels duwde de opdracht en de knop Volgende anders van het
  // scherm. Langere code schuift in de editor zelf.
  const veldRef = useRef<HTMLDivElement>(null);
  const balkRef = useRef<HTMLDivElement>(null);
  // De code blijft bewaard in deze browser (packages/shared/oefenveld), als
  // de cursus zegt welke site hij is. Eerst was het werk weg bij herladen en
  // bij de volgende les, en zei het veld dat er zelf bij (issue 216).
  const huidig = useMemo<Code>(() => ({ code }), [code]);
  const bewaard = useOpslag<Code>({
    opslag: site ? opslagVoor(site) : null,
    start: { code: starterCode },
    huidig,
    containerRef: veldRef,
    onHerstel: (werk) => setCode(werk.code),
  });
  const nietBewaard = bewaard.stand === 'vol' || bewaard.stand === 'geweigerd';
  const waaromNiet =
    bewaard.stand === 'vol'
      ? 'Niet bewaard: de opslag van je browser is vol. Kopieer je code als je hem wilt houden.'
      : 'Niet bewaard: deze browser slaat hier niets op (privévenster?). Kopieer je code als je hem wilt houden.';
  // Reset gooit ook weg wat er bewaard is, en dat komt niet meer terug:
  // dan eerst vragen. Zonder opslag, of zonder wijziging, is er niets te
  // verliezen.
  const handleReset = useCallback(async () => {
    if (site && code !== starterCode) {
      const zeker = await bevestig(
        'Je code in dit veld gaat verloren, ook de versie die in deze browser bewaard is.',
        { titel: 'Terug naar de startcode?', bevestigLabel: 'Reset', gevaarlijk: true },
      );
      if (!zeker) return;
    }
    bewaard.wis();
    setCode(starterCode);
  }, [site, code, starterCode, bewaard.wis]);
  const [veldHoogte, setVeldHoogte] = useState<number | null>(null);
  const [veldBreedte, setVeldBreedte] = useState<number | null>(null);
  const stapt = opname !== null;
  useLayoutEffect(() => {
    const veld = veldRef.current;
    const paneel = veld?.closest<HTMLElement>('[data-les-tab]');
    if (!inTab || !veld || !paneel || typeof ResizeObserver === 'undefined') return;
    const breed = window.matchMedia('(min-width: 997px)');
    const meet = () => {
      // Op een smal scherm scrolt de leerling, en Stap voor stap staat onder
      // het veld: dan zegt de ruimte in het paneel niets over het veld.
      if (!breed.matches) return setVeldHoogte(null);
      if (veld.clientWidth > 0) setVeldBreedte(veld.clientWidth);
      if (stapt) return;
      const ruimte = meetRuimte(veld, paneel, Number.POSITIVE_INFINITY);
      if (ruimte) setVeldHoogte(pasHoogte(ruimte, MIN_VELD));
    };
    meet();
    const kijker = new ResizeObserver(meet);
    kijker.observe(paneel);
    window.addEventListener('resize', meet);
    breed.addEventListener('change', meet);
    return () => {
      kijker.disconnect();
      window.removeEventListener('resize', meet);
      breed.removeEventListener('change', meet);
    };
  }, [inTab, stapt]);
  // Het veld wordt niet lager als de leerling naar de tip of het antwoord
  // wisselt: een korte tip liet het veld krimpen, en dan versprong alles wat
  // eronder staat. De kolom houdt de grootste hoogte die hij had.
  const kolomRef = useRef<HTMLDivElement>(null);
  const [kolomMin, setKolomMin] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: een andere hoogte van het veld begint opnieuw.
  useLayoutEffect(() => setKolomMin(0), [veldHoogte]);
  useLayoutEffect(() => {
    if (!hulp || veldHoogte === null) return;
    const hoogte = kolomRef.current?.offsetHeight ?? 0;
    if (hoogte > kolomMin) setKolomMin(hoogte);
  });
  const editorMax =
    veldHoogte === null ? undefined : veldHoogte - (balkRef.current?.offsetHeight ?? BALK);
  // Met de tip of de oplossing open krijgt die kolom de breedte die zijn
  // langste regel code nodig heeft, minstens de helft van het veld: de code
  // van de leerling levert in. Anders was het eind van een regel afgesneden.
  const hulpKolom =
    weergave !== 'uitvoer' && veldBreedte !== null
      ? hulpBreedte(weergave === 'tip' ? hulp?.tipTekens : hulp?.tekens, veldBreedte)
      : null;
  // De hoogte van Stap voor stap in een tabblad: wat de editor had.
  const stapper = stapt && editorMax !== undefined ? editorMax - 2 * RAND : undefined;

  useEffect(() => {
    let cancelled = false;
    // Dynamic import to avoid SSR issues
    import('../PyodideProvider').then(({ getPyodide }) => {
      getPyodide()
        .then((pyodide) => {
          if (!cancelled) {
            pyodideRef.current = pyodide;
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setOutput(`Fout bij het laden van Python: ${err}`);
            setIsLoading(false);
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Laadde Python niet (geen netwerk, een CDN dat de school blokkeert), dan
  // probeert een klik op Uitvoeren of Stap voor stap het opnieuw. Eerst stond
  // de knop aan maar deed hij niets, onder een foutmelding die bleef staan.
  const zorgVoorPyodide = useCallback(async (): Promise<PyodideInterface | null> => {
    if (pyodideRef.current) return pyodideRef.current;
    setIsLoading(true);
    setOutput('');
    try {
      const { getPyodide } = await import('../PyodideProvider');
      pyodideRef.current = await getPyodide();
      return pyodideRef.current;
    } catch (err) {
      setOutput(`Fout bij het laden van Python: ${err}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const execCode = useCallback(async () => {
    if (isRunning) return;
    const pyodide = await zorgVoorPyodide();
    if (!pyodide) return;
    setIsRunning(true);
    setWeergave('uitvoer');
    setOutput('');
    setOpname(null);
    setTekening(null);
    try {
      const { haalTekening, runPython } = await import('../PyodideProvider');
      const result = await runPython(pyodide, code, { turtle: true });
      setOutput(result);
      setTekening(haalTekening(pyodide));
    } catch (err) {
      setOutput(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  }, [code, isRunning, zorgVoorPyodide]);

  const stapCode = useCallback(async () => {
    if (isRunning) return;
    const pyodide = await zorgVoorPyodide();
    if (!pyodide) return;
    setIsRunning(true);
    setWeergave('uitvoer');
    setOutput('');
    setTekening(null);
    try {
      const { tracePython } = await import('../PyodideProvider');
      setOpnameCode(code);
      setOpname(await tracePython(pyodide, code, undefined, { turtle: true }));
    } catch (err) {
      setOutput(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  }, [code, isRunning, zorgVoorPyodide]);

  // Het antwoord uitvoeren raakt de code en de uitvoer van de leerling niet:
  // hij ziet wat het antwoord doet, en zijn eigen werk staat er nog.
  const antwoordCode = hulp?.code;
  const voerAntwoordUit = useCallback(async () => {
    if (isRunning || !antwoordCode) return;
    const pyodide = await zorgVoorPyodide();
    if (!pyodide) return;
    setIsRunning(true);
    try {
      const { haalTekening, runPython } = await import('../PyodideProvider');
      setAntwoordUit(await runPython(pyodide, antwoordCode, { turtle: true }));
      setAntwoordTekening(haalTekening(pyodide));
    } catch (err) {
      setAntwoordUit(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  }, [antwoordCode, isRunning, zorgVoorPyodide]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab, Shift+Tab en Enter regelt HighlightedEditor zelf; hier alleen Ctrl+Enter.
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        execCode();
      }
    },
    [execCode],
  );

  const uitvoer = (
    <>
      {tekening && <Tekening tekening={tekening} />}
      {output && <pre className={styles.output}>{output}</pre>}
      {isLoading && !inTab && <div className={styles.loading}>Python wordt geladen...</div>}
      {inTab && !output && !tekening && !opname && (
        // Het vak naast de code is er al voordat er iets gedraaid is: zo
        // verspringt het veld niet, en ziet de leerling waar hij moet kijken.
        // Ook terwijl Python laadt: de regel "Python wordt geladen..." was
        // lager dan dit vak, en dan versprong het veld (op een telefoon 35
        // pixels) op het moment dat Python er was. De zin die er straks
        // staat, houdt daarom alvast zijn plek.
        <p className={styles.wacht}>
          <span className={styles.wachtRegel}>
            <span className={isLoading ? styles.straks : undefined} aria-hidden={isLoading}>
              Klik op Uitvoeren. De uitvoer verschijnt hier.
            </span>
            {isLoading && <span>Python wordt geladen...</span>}
          </span>
          {/* Wat nodig is om het veld te gebruiken, zegt het veld zelf. */}
          <span className={styles.bewaart}>
            {!site
              ? 'Dit veld bewaart je code niet: kopieer wat je wilt houden.'
              : nietBewaard
                ? waaromNiet
                : 'Je code blijft bewaard in deze browser.'}
          </span>
        </p>
      )}
      {/* Wat de opdracht moet opleveren (de verwachte uitvoer of het
            doelplaatje), onder wat de leerling zelf kreeg: zo vergelijkt hij
            ze zonder te scrollen. */}
      {doel && <div className={`${styles.doel} ${styles.doelNaast}`}>{doel}</div>}
    </>
  );

  return (
    <div
      ref={veldRef}
      // Het hoeveelste veld met deze startcode: daar hangt zijn opslag aan.
      data-zaad={bewaard.zaad || undefined}
      className={[
        styles.exercise,
        inTab && styles.inTab,
        // Stap voor stap neemt in een tabblad de plek van de editor en de
        // uitvoer in, op dezelfde hoogte: eronder was het scherm tot 1600
        // pixels te lang, met de code er twee keer.
        stapper !== undefined && styles.staptInTab,
        hulpKolom !== null && styles.naastHulp,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        hulpKolom === null
          ? undefined
          : ({ '--hulp-breedte': `${hulpKolom}px` } as React.CSSProperties)
      }
    >
      {/* Op een smal scherm staat het doel boven de code: onder een startcode
          van dertig regels zag de leerling pas na het scrollen wat hij moest
          maken. Op een breed scherm staat het in de uitvoerkolom (hieronder). */}
      {doel && <div className={`${styles.doel} ${styles.doelBoven}`}>{doel}</div>}
      <div className={styles.editorSection}>
        <div className={styles.toolbar} ref={balkRef}>
          <span className={styles.label}>
            {bewaard.stand === 'bewaard' ? (
              <output title="Je code staat in deze browser op dit apparaat. Op een andere computer, in een privévenster of na het wissen van je browsergegevens is hij er niet.">
                Bewaard
              </output>
            ) : nietBewaard ? (
              <output title={waaromNiet}>Niet bewaard</output>
            ) : (
              'Probeer het zelf'
            )}
          </span>
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.resetButton}
              onClick={handleReset}
              title="Reset naar begincode"
            >
              Reset
            </button>
            <button
              type="button"
              className={styles.stapButton}
              onClick={stapCode}
              disabled={isLoading || isRunning}
              title="Loop regel voor regel door je code en zie wat elke variabele doet"
            >
              Stap voor stap
            </button>
            <button
              type="button"
              className={styles.runButton}
              onClick={execCode}
              disabled={isLoading || isRunning}
            >
              {isLoading ? 'Laden...' : isRunning ? 'Bezig...' : '▶ Uitvoeren'}
            </button>
          </div>
        </div>
        <HighlightedEditor
          code={code}
          onChange={setCode}
          onKeyDown={handleKeyDown}
          // Tot het bewaarde werk er is: wat de leerling eerder typte, zou
          // eroverheen komen.
          disabled={isLoading || !bewaard.geladen}
          placeholder={aanwijzing ?? 'Schrijf hier je code'}
          minHeight={MIN_EDITOR}
          maxHeight={editorMax}
          // Naast de tip of de oplossing is de code smaller. Een regel die
          // dan niet past, schuift: afgebroken telde de kantlijn hem als
          // twee regels.
          afbreken={hulpKolom === null}
        />
      </div>
      {opname && (
        <Stapper
          code={opnameCode}
          opname={opname}
          onSluiten={() => setOpname(null)}
          hoogte={stapper}
        />
      )}
      <div
        // Met een doelplaatje erbij zijn de eigen tekening en het doel samen
        // niet hoger dan het veld: anders schoof het doel na Uitvoeren uit beeld.
        ref={kolomRef}
        className={`${styles.resultaat}${doel && tekening ? ` ${styles.vergelijk}` : ''}`}
        style={
          veldHoogte === null
            ? undefined
            : ({
                maxHeight: veldHoogte,
                minHeight: kolomMin || undefined,
                '--veld-hoogte': `${veldHoogte}px`,
              } as React.CSSProperties)
        }
      >
        {hulp ? (
          <>
            <HulpKeuze hulp={hulp} weergave={weergave} kies={setWeergave} />
            <div hidden={weergave !== 'uitvoer'}>{uitvoer}</div>
            {hulp.tip && (
              <HulpVak soort="tip" open={weergave === 'tip'}>
                {hulp.tip}
              </HulpVak>
            )}
            {hulp.antwoord && (
              <HulpVak soort="antwoord" open={weergave === 'antwoord'}>
                {hulp.antwoord}
                {antwoordCode && (
                  <button
                    type="button"
                    className={styles.antwoordKnop}
                    onClick={voerAntwoordUit}
                    disabled={isLoading || isRunning}
                    title="Je eigen code blijft staan"
                  >
                    ▶ Voer {hulp.naam === 'oplossing' ? 'de oplossing' : 'het antwoord'} uit
                  </button>
                )}
                {antwoordTekening && <Tekening tekening={antwoordTekening} />}
                {antwoordUit !== null && (
                  <pre className={styles.output}>{antwoordUit || '(geen uitvoer)'}</pre>
                )}
              </HulpVak>
            )}
          </>
        ) : (
          uitvoer
        )}
      </div>
    </div>
  );
}

export default function CodeExercise({
  children,
  site,
}: {
  children: string;
  /**
   * Het registry-id van de cursus ('python'). Daarmee bewaart het veld de
   * code van de leerling in deze browser; zonder bewaart het niets.
   */
  site?: string;
}) {
  // Startcode met alleen commentaar is een leeg veld met die tekst als
  // aanwijzing (startcode.ts).
  const { start: code, aanwijzing } = startcode((children || '').trim());
  // In een les-tabblad zet <LesVeld> het doel van de opdracht om het veld.
  const doel = useLesDoel();
  // En de tip en het antwoord, op de plek van de uitvoer.
  const hulp = useLesHulp();
  return (
    <BrowserOnly
      fallback={
        <div className={styles.exercise}>
          <pre>{code || <span className={styles.aanwijzing}>{aanwijzing}</span>}</pre>
          {doel && <div className={styles.doel}>{doel}</div>}
          {/* In de HTML van de build, voor een link in de tip of het antwoord;
              dicht tot het veld er is. */}
          {hulp && (
            <div hidden>
              {hulp.tip}
              {hulp.antwoord}
            </div>
          )}
        </div>
      }
    >
      {() => (
        <CodeExerciseInner
          starterCode={code}
          aanwijzing={aanwijzing}
          site={site}
          doel={doel}
          hulp={hulp}
        />
      )}
    </BrowserOnly>
  );
}
