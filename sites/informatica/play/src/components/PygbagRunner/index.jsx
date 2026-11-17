import { HulpKeuze, HulpVak } from '@coderius/shared/components/LesTabs/Hulp';
import {
  hulpBreedte,
  useInBeeld,
  useInLesTab,
  useLesHulp,
} from '@coderius/shared/components/LesTabs/paneel';
import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { useCallback, useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import CodeEditor from '../CodeRunner/CodeEditor';
import { detectMode, ensureAsync } from '../CodeRunner/engine';
import { requestRun, schedule, stop as sharedStop } from '../SharedRunner';
import {
  CODE_MIN,
  KLEINSTE_SPEL,
  codeKolom,
  spelHoogte,
  spelInBlok,
  veldGrenzen,
  veldInScherm,
} from './maat';
import styles from './styles.module.css';

let nextOwnerId = 1;

function PygbagRunnerInner({ code, title, width, height, mode }) {
  const [editableCode, setEditableCode] = useState(code);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLines, setConsoleLines] = useState([]);
  const [copied, setCopied] = useState(false);
  // Telt de klikken op Speel: in een tabblad blijft de knop staan terwijl
  // het spel draait, en een tweede klik begint opnieuw.
  const [beurt, setBeurt] = useState(0);

  const ownerId = useMemo(() => nextOwnerId++, []);
  const slotRef = useRef(null);
  const consoleRef = useRef(null);
  const pendingRunRef = useRef(null);

  // Determine execution mode: explicit prop > auto-detect from code
  const execMode = mode || detectMode(editableCode) || 'pygame';
  const canRunInBrowser = !!code;
  const displayHeight = height || 450;

  // In een les-tabblad staat de code links en het spel rechts (vanaf 997px,
  // in de opmaak): de code blijft te lezen terwijl het spel draait, en het
  // veld is voor en na de klik op Speel even hoog. Eerst kwam het spel op de
  // plek van de code, en versprong alles eronder. Zie maat.js voor de hoogte.
  const inTab = useInLesTab();
  const inBeeld = useInBeeld();
  const veldRef = useRef(null);
  const spelRef = useRef(null);
  const [spel, setSpel] = useState(null);
  // De kolom van de code volgt de langste regel van de code van de les.
  const tekens = useMemo(
    () =>
      Math.max(
        0,
        ...String(code ?? '')
          .split('\n')
          .map((regel) => regel.length),
      ),
    [code],
  );
  const [kolomMaat, setKolomMaat] = useState({ deel: CODE_MIN, schaal: 1 });
  // De tip en de oplossing van de opdracht staan in het veld, op de plek van
  // het spel (zie hulpInVeld in packages/shared/plugins/les-tabs.js): de
  // knoppen Spel, Tip en Oplossing kiezen wat er naast de code staat.
  const hulp = useLesHulp();
  const [weergave, setWeergave] = useState('uitvoer');
  const weergaveRef = useRef(weergave);
  weergaveRef.current = weergave;
  const [veldBreedte, setVeldBreedte] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: na een andere kolombreedte meet het spel zijn kolom opnieuw.
  useLayoutEffect(() => {
    const veld = veldRef.current;
    const kolom = spelRef.current;
    const paneel = veld?.closest('[data-les-tab]');
    if (!inTab || !veld || !kolom || !paneel || typeof ResizeObserver === 'undefined') return;
    const breed = window.matchMedia('(min-width: 997px)');
    const meet = () => {
      if (kolom.clientWidth === 0) return setSpel(null);
      const maat = codeKolom(tekens, breed.matches ? veld.clientWidth : 0);
      setKolomMaat((was) => (was.deel === maat.deel && was.schaal === maat.schaal ? was : maat));
      setVeldBreedte(breed.matches ? veld.clientWidth : 0);
      // Met de tip of de oplossing open is de kolom breder (hulpBreedte), en
      // zou het spel dus hoger worden: het veld houdt de hoogte die het had,
      // anders verspringt alles eronder bij elke wissel.
      if (weergaveRef.current !== 'uitvoer') return;
      const eigen = spelHoogte(kolom.clientWidth, displayHeight);
      // Op een smal scherm staat het spel onder de knoppen, op de hoogte die
      // bij zijn breedte hoort: op een telefoon stond er anders een donkere
      // band onder.
      if (!breed.matches) return setSpel(eigen);
      const rond = veld.offsetHeight - kolom.querySelector('[data-play-spel]').offsetHeight;
      // Het scherm van dit veld: de stap, of het tabblad zonder stappen.
      const stap = veld.closest('[data-les-stap]') ?? paneel;
      const teZien = (el) => el.getClientRects().length > 0;
      const velden = Array.from(stap.querySelectorAll('[data-play-veld]')).filter(teZien);
      // Het paneel met een veld dat zichzelf passend maakt: de vrije ruimte
      // is van het veld, niet van een codevak ernaast (speling.ts in LesTabs).
      paneel.setAttribute('data-heeft-veld', '');
      veld.setAttribute('data-les-veld', '');
      // Een open tip of oplossing die te lang is, schuift in een eigen vak
      // (openBlokInVak in LesTabs). Wat daar buiten beeld staat, telt mee:
      // de uitkomst mag niet veranderen door wat dat vak al heeft gedaan.
      let verborgen = 0;
      for (const vak of stap.querySelectorAll('details[open] [style*="max-height"]'))
        if (teZien(vak)) verborgen += Math.max(0, vak.scrollHeight - vak.clientHeight);
      const onderkant = paneel.getBoundingClientRect().bottom + window.scrollY + verborgen;
      const scherm = window.innerHeight;
      const blok = veld.closest('details');
      if (blok) {
        // In een open oplossing: van een veld van 380 pixels in een vak van
        // 280 was nog de onderste helft te zien. Het veld neemt daarom zelf
        // de ruimte die er op het scherm over is.
        if (velden.filter((v) => blok.contains(v)).length !== 1) return setSpel(eigen);
        return setSpel(
          spelInBlok({ scherm, zonderVeld: onderkant - veld.offsetHeight, rond, eigen }),
        );
      }
      // Alleen een veld dat het enige op zijn scherm is, neemt de ruimte van
      // dat scherm: twee velden die elk meten wat de ander overlaat, duwen
      // elkaar naar hun ondergrens.
      const buiten = velden.filter((v) => !v.closest('details'));
      if (buiten.length !== 1) return setSpel(eigen);
      // Klapt er op dit scherm iets open (de voorkennis, een tip, de
      // oplossing), dan staat het veld ruimte af. Eerst hield het zijn volle
      // hoogte: met de oplossing open was bijna de helft van de schermen
      // tot 240 pixels te lang. Staat er in de oplossing zelf een veld, dan
      // krijgt dat eerst zijn kleinste maat; wat er dan over is, is voor dit
      // veld. Zo rekenen de twee niet op elkaars hoogte.
      const binnen = velden.filter((v) => v.closest('details'));
      const anderen = binnen.reduce((som, v) => som + v.offsetHeight, 0);
      const { min, max } = veldGrenzen(kolom.clientWidth, rond);
      setSpel(
        veldInScherm({
          scherm,
          zonderVeld: onderkant - veld.offsetHeight - anderen,
          nodigVoorAnderen: binnen.length * (rond + KLEINSTE_SPEL),
          min,
          max,
        }) - rond,
      );
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
  }, [inTab, displayHeight, tekens, kolomMaat.deel, weergave]);

  // Tell SharedRunner about this code at mount so its iframe boots with the
  // superset of needed packages.
  useEffect(() => {
    if (canRunInBrowser) schedule(code);
  }, [canRunInBrowser, code]);

  // Auto-scroll console to bottom when new lines arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: consoleLines triggert bewust een her-scroll; de body zelf leest alleen de ref.
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleLines]);

  // Stop our run if the component unmounts (page navigation, etc).
  useEffect(() => () => sharedStop(ownerId), [ownerId]);

  const appendLine = useCallback((text, isError) => {
    setConsoleLines((prev) => [...prev, { text, isError }]);
  }, []);

  function handleCopy() {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(editableCode)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  }

  /** Speelt code af in het vak van dit veld: die van de leerling, of de oplossing. */
  function speel(bron, melding) {
    setConsoleLines(melding ? [{ text: `${melding}\n`, isError: false }] : []);

    // Prepare code per mode. Play-mode appends start_program() if missing;
    // pygame-mode wraps user code in async main and exposes a line offset
    // so the iframe can correct traceback line numbers.
    const soort = mode || detectMode(bron) || 'pygame';
    let userPythonCode = bron;
    let lineOffset = 0;
    let ingevoegd = [];
    if (soort === 'pygame') {
      const wrapped = ensureAsync(bron);
      userPythonCode = wrapped.code;
      lineOffset = wrapped.lineOffset;
      ingevoegd = wrapped.ingevoegd;
    } else if (!userPythonCode.includes('start_program')) {
      userPythonCode = `${userPythonCode}\nplay.start_program()`;
    }

    // Park the run params until React has rendered the slot div (effect below).
    pendingRunRef.current = { code: userPythonCode, mode: soort, lineOffset, ingevoegd };
    setIsRunning(true);
    setBeurt((n) => n + 1);
  }

  function handleRun() {
    setWeergave('uitvoer');
    speel(editableCode);
  }

  // De oplossing speelt in hetzelfde vak, zonder de code van de leerling aan
  // te raken. De console zegt wat er draait: het spel ziet er anders net zo
  // uit als dat van hemzelf.
  function speelOplossing() {
    setWeergave('uitvoer');
    speel(hulp.code, 'Dit is de oplossing van de les, niet jouw code.');
  }

  // Het spel stoppen: het spelvenster (SharedRunner) laat zijn vak los, en het
  // veld weet dat er niets meer draait. Op één plek, voor de knop Stop, een
  // tabblad of uitklapblok dat dichtgaat, en een fout waarna niets meer draait.
  const stopSpel = useCallback(() => {
    sharedStop(ownerId);
    setIsRunning(false);
  }, [ownerId]);

  // Fire the run only AFTER the slot is in the DOM — otherwise slotRef.current
  // is null and SharedRunner has no anchor to position over.
  // biome-ignore lint/correctness/useExhaustiveDependencies: beurt start het spel opnieuw bij een tweede klik op Speel.
  useEffect(() => {
    if (!isRunning || !pendingRunRef.current || !slotRef.current) return;
    const { code, mode, lineOffset, ingevoegd } = pendingRunRef.current;
    pendingRunRef.current = null;
    requestRun({
      ownerId,
      slotEl: slotRef.current,
      code,
      mode,
      lineOffset,
      ingevoegd,
      listeners: {
        onStdout: (text) => appendLine(text, false),
        onStderr: (text) => appendLine(text, true),
        onDone: () => {
          /* keep canvas visible until user stops */
        },
        onError: (msg, fatal) => {
          appendLine(msg, true);
          // Na een fatale fout (Pyodide start niet) draait er niets meer. In
          // een tabblad blijft het vak van het spel staan: zonder het venster
          // los te laten bleef dat over de tekst "Klik op Speel in browser"
          // hangen, zonder knop Stop om het weg te krijgen.
          if (fatal) stopSpel();
        },
        onPreempted: () => setIsRunning(false),
      },
    });
    // Op een smal scherm staat het spel onder de code en de knoppen: breng
    // het in beeld, anders begint het onder de rand van het scherm.
    if (inTab && window.matchMedia && !window.matchMedia('(min-width: 997px)').matches)
      slotRef.current.scrollIntoView?.({ block: 'nearest' });
  }, [isRunning, beurt, ownerId, appendLine, stopSpel, inTab]);

  const handleStop = stopSpel;

  // Het spel draait in een iframe die los van de pagina boven dit veld
  // zweeft (SharedRunner). Gaat het tabblad of de stap van dit veld dicht,
  // of het uitklapblok eromheen, dan bleef hij op de oude plek hangen, over
  // het volgende scherm heen. Dan stopt het spel.
  useEffect(() => {
    if (!inBeeld) stopSpel();
  }, [inBeeld, stopSpel]);
  useEffect(() => {
    const blok = veldRef.current?.closest('details');
    if (!blok) return;
    const dicht = () => {
      if (!blok.open) stopSpel();
    };
    blok.addEventListener('toggle', dicht);
    return () => blok.removeEventListener('toggle', dicht);
  }, [stopSpel]);

  const kop = (
    <div className={styles.header}>
      <span className={styles.title}>{title || 'Python Game'}</span>
      {isRunning ? (
        <button type="button" onClick={handleStop} className={styles.stopButton}>
          &#x23F9; Stop
        </button>
      ) : (
        <span className={styles.badge}>{execMode === 'play' ? 'play' : 'pygame-ce'}</span>
      )}
    </div>
  );
  const editor = (
    <div className={styles.codeSection}>
      <CodeEditor value={editableCode} onChange={setEditableCode} height="auto" />
    </div>
  );
  const acties = (
    <div className={styles.actions}>
      {canRunInBrowser && (
        <button type="button" onClick={handleRun} className={styles.playButton}>
          &#x25B6; {isRunning ? 'Opnieuw spelen' : 'Speel in browser'}
        </button>
      )}
      {inTab && !title && isRunning && (
        <button type="button" onClick={handleStop} className={styles.stopButton}>
          &#x23F9; Stop
        </button>
      )}
      <button type="button" onClick={handleCopy} className={styles.copyButton}>
        {copied ? '✓ Gekopieerd' : 'Kopieer code'}
      </button>
    </div>
  );
  const console_ = (
    <div ref={consoleRef} className={styles.consolePanel}>
      {consoleLines.length === 0 ? (
        <span className={styles.consolePlaceholder}>
          Console - output van print() verschijnt hier
        </span>
      ) : (
        consoleLines.map((line, i) => (
          <span key={`${i}-${line.text}`} className={line.isError ? styles.errLine : undefined}>
            {line.text}
          </span>
        ))
      )}
    </div>
  );

  const toontHulp = !!hulp && weergave !== 'uitvoer';
  // Met de tip of de oplossing open krijgt die de breedte die zijn langste
  // regel code nodig heeft; de code van de leerling levert zolang in.
  const kolommen =
    toontHulp && veldBreedte
      ? `minmax(0, 1fr) ${hulpBreedte(
          weergave === 'tip' ? hulp.tipTekens : hulp.tekens,
          veldBreedte,
          { minDeel: 1 - kolomMaat.deel },
        )}px`
      : `minmax(0, ${kolomMaat.deel}fr) minmax(0, ${1 - kolomMaat.deel}fr)`;

  if (inTab) {
    // Code en spel staan allebei in de pagina; de opmaak zet ze op een breed
    // scherm naast elkaar, en op een smal scherm het spel onder de code.
    // De balk met de titel vervalt als de les geen titel geeft (geen enkele
    // les doet dat): "Python Game" boven elk veld kostte elk scherm 37
    // pixels, en in een open oplossing schoof de knop Stop erdoor uit beeld.
    // Stop staat dan naast de knop waarmee het spel begon.
    return (
      <div
        ref={veldRef}
        data-play-veld=""
        className={`${styles.runner} ${styles.inTab}${isRunning ? ` ${styles.loopt}` : ''}${hulp ? ` ${styles.metHulp}` : ''}`}
        style={{ '--play-code-schaal': kolomMaat.schaal }}
      >
        {title && kop}
        <div className={styles.werkvlak} style={{ gridTemplateColumns: kolommen }}>
          <div className={styles.codeKolom}>
            <div className={styles.codeBinnen}>{editor}</div>
          </div>
          {acties}
          <div ref={spelRef} className={styles.spelKolom}>
            {hulp && <HulpKeuze hulp={hulp} weergave={weergave} kies={setWeergave} eerste="Spel" />}
            <div className={styles.spelVlak}>
              <div className={toontHulp ? styles.wegVoorHulp : undefined}>
                <div
                  ref={slotRef}
                  data-play-spel=""
                  className={styles.canvasArea}
                  style={{ height: spel ?? displayHeight, background: '#1a1a2e' }}
                >
                  {!isRunning && canRunInBrowser && (
                    <p className={styles.wacht}>
                      Klik op Speel in browser. Het spel verschijnt hier.
                    </p>
                  )}
                </div>
                {console_}
              </div>
              {hulp?.tip && (
                <div className={styles.hulpLaag} hidden={weergave !== 'tip'}>
                  <HulpVak soort="tip" open={weergave === 'tip'}>
                    {hulp.tip}
                  </HulpVak>
                </div>
              )}
              {hulp?.antwoord && (
                <div className={styles.hulpLaag} hidden={weergave !== 'antwoord'}>
                  <HulpVak soort="antwoord" open={weergave === 'antwoord'}>
                    {hulp.antwoord}
                    {hulp.code && (
                      <button
                        type="button"
                        onClick={speelOplossing}
                        className={styles.oplossingKnop}
                        title="Je eigen code blijft staan"
                      >
                        &#x25B6; Speel {hulp.naam === 'antwoord' ? 'het antwoord' : 'de oplossing'}
                      </button>
                    )}
                  </HulpVak>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.runner}>
      {kop}
      {isRunning ? (
        <>
          <div
            ref={slotRef}
            className={styles.canvasArea}
            style={{ height: displayHeight, background: '#1a1a2e' }}
          >
            {/* SharedRunner positions its iframe over this slot via fixed CSS */}
          </div>
          {console_}
        </>
      ) : (
        <>
          {editor}
          {acties}
        </>
      )}
    </div>
  );
}

// Tot de pagina in de browser draait, staat de code er al: de les is zo ook
// zonder JavaScript te lezen, en het veld springt bij het laden niet van één
// regel ("Spel laden...") naar zijn volle hoogte.
function Wacht({ code, title }) {
  // De tip en de oplossing staan ook in de HTML van de build: een link erin
  // moet de controle van de links kunnen vinden.
  const hulp = useLesHulp();
  return (
    <div className={styles.runner}>
      <div className={styles.header}>
        <span className={styles.title}>{title || 'Python Game'}</span>
      </div>
      <pre className={styles.wachtCode}>
        <code>{code}</code>
      </pre>
      {hulp?.tip && (
        <details>
          <summary>Tip</summary>
          {hulp.tip}
        </details>
      )}
      {hulp?.antwoord && (
        <details>
          <summary>{hulp.naam === 'antwoord' ? 'Antwoord' : 'Oplossing'}</summary>
          {hulp.antwoord}
        </details>
      )}
    </div>
  );
}

export default function PygbagRunner(props) {
  return (
    <BrowserOnly fallback={<Wacht code={props.code} title={props.title} />}>
      {() => <PygbagRunnerInner {...props} />}
    </BrowserOnly>
  );
}
