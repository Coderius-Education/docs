import { useInLesTab, useLesDoel } from '@coderius/shared/components/LesTabs/paneel';
import { meetRuimte, pasHoogte } from '@coderius/shared/components/LesTabs/pasHoogte';
import BrowserOnly from '@docusaurus/BrowserOnly';
import type React from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HighlightedEditor } from '../HighlightedEditor';
import type { Opname, PyodideInterface } from '../PyodideProvider';
import Stapper from '../Stapper';
import Tekening from '../Tekening';
import type { Tekening as TekeningData } from '../Tekening/tekening';
import styles from './styles.module.css';

/** Lager wordt het veld in een tabblad niet: de werkbalk en een regel of vijf. */
const MIN_VELD = 180;
/** De hoogte van de werkbalk, tot hij gemeten is. */
const BALK = 40;

function CodeExerciseInner({
  starterCode,
  doel,
}: {
  starterCode: string;
  doel?: React.ReactNode;
}) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [opname, setOpname] = useState<Opname | null>(null);
  const [tekening, setTekening] = useState<TekeningData | null>(null);
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
  const [veldHoogte, setVeldHoogte] = useState<number | null>(null);
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
  const editorMax =
    veldHoogte === null ? undefined : veldHoogte - (balkRef.current?.offsetHeight ?? BALK);

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

  return (
    <div ref={veldRef} className={`${styles.exercise}${inTab ? ` ${styles.inTab}` : ''}`}>
      {/* Op een smal scherm staat het doel boven de code: onder een startcode
          van dertig regels zag de leerling pas na het scrollen wat hij moest
          maken. Op een breed scherm staat het in de uitvoerkolom (hieronder). */}
      {doel && <div className={`${styles.doel} ${styles.doelBoven}`}>{doel}</div>}
      <div className={styles.editorSection}>
        <div className={styles.toolbar} ref={balkRef}>
          <span className={styles.label}>Probeer het zelf</span>
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.resetButton}
              onClick={() => setCode(starterCode)}
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
          disabled={isLoading}
          minHeight={120}
          maxHeight={editorMax}
        />
      </div>
      {opname && <Stapper code={opnameCode} opname={opname} onSluiten={() => setOpname(null)} />}
      <div
        className={styles.resultaat}
        style={veldHoogte === null ? undefined : { maxHeight: veldHoogte }}
      >
        {tekening && <Tekening tekening={tekening} />}
        {output && <pre className={styles.output}>{output}</pre>}
        {isLoading && <div className={styles.loading}>Python wordt geladen...</div>}
        {inTab && !output && !tekening && !opname && !isLoading && (
          // Het vak naast de code is er al voordat er iets gedraaid is: zo
          // verspringt het veld niet, en ziet de leerling waar hij moet kijken.
          <p className={styles.wacht}>Klik op Uitvoeren. De uitvoer verschijnt hier.</p>
        )}
        {/* Wat de opdracht moet opleveren (de verwachte uitvoer of het
            doelplaatje), onder wat de leerling zelf kreeg: zo vergelijkt hij
            ze zonder te scrollen. */}
        {doel && <div className={`${styles.doel} ${styles.doelNaast}`}>{doel}</div>}
      </div>
    </div>
  );
}

export default function CodeExercise({ children }: { children: string }) {
  const code = (children || '').trim();
  // In een les-tabblad zet <LesVeld> het doel van de opdracht om het veld.
  const doel = useLesDoel();
  return (
    <BrowserOnly
      fallback={
        <div className={styles.exercise}>
          <pre>{code}</pre>
          {doel && <div className={styles.doel}>{doel}</div>}
        </div>
      }
    >
      {() => <CodeExerciseInner starterCode={code} doel={doel} />}
    </BrowserOnly>
  );
}
