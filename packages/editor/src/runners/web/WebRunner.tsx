import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { RunContext, Runner, RunnerHostProps } from '../types';
import { APPARATEN, type Apparaat, schaal } from './apparaten';
import { MESSAGE_SOURCE, buildDoc } from './buildDoc';
import { Bezoek, linkDoel } from './navigatie';
import styles from './styles.module.css';

/** Wat de preview over de bezochte pagina weet (session.data.bezoek). */
interface BezoekData {
  pagina: string;
  terugNaar: string | null;
}

export function createWebRunner(): Runner {
  // Iedere runner-instantie filtert berichten op een eigen token, zodat
  // meerdere web-editors op één pagina elkaars console niet vervuilen.
  const token = Math.random().toString(36).slice(2);
  let huidig: Pick<RunContext, 'files' | 'emit' | 'setData'> | null = null;
  // Op welke pagina het voorbeeld staat: het startbestand, of een pagina
  // waar de leerling via een link naartoe klikte (zie navigatie.ts).
  const bezoek = new Bezoek();

  const toon = (pad: string) => {
    if (!huidig) return;
    huidig.setData('srcdoc', buildDoc(huidig.files, pad, token));
    const data: BezoekData = { pagina: pad, terugNaar: bezoek.terugNaar };
    huidig.setData('bezoek', data);
  };

  const terug = () => {
    if (!huidig) return;
    huidig.emit({ kind: 'clear' });
    toon(bezoek.terug());
  };

  const onMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || data.source !== MESSAGE_SOURCE || data.token !== token) return;
    if (data.type === 'navigate' && typeof data.href === 'string') {
      if (!huidig) return;
      const doel = linkDoel(bezoek.pagina, data.href, huidig.files);
      if ('fout' in doel) {
        huidig.emit({ kind: 'stderr', text: `${doel.fout}\n` });
        return;
      }
      // Net als een browser: een nieuwe pagina begint met een lege console.
      huidig.emit({ kind: 'clear' });
      toon(bezoek.ga(doel.pad));
      return;
    }
    if (data.type !== 'console') return;
    const text = `${data.text}\n`;
    huidig?.emit({
      kind: data.level === 'error' || data.level === 'warn' ? 'stderr' : 'stdout',
      text,
    });
  };

  const ICONEN = { desktop: Monitor, tablet: Tablet, telefoon: Smartphone } as const;

  function PreviewComponent({ session, apparaten }: RunnerHostProps): ReactNode {
    const srcdoc = (session.data.srcdoc as string) ?? '';
    const stand = session.data.bezoek as BezoekData | undefined;
    const [apparaat, setApparaat] = useState<Apparaat>(APPARATEN[0]);
    const ruimteRef = useRef<HTMLDivElement>(null);
    const [ruimte, setRuimte] = useState({ breedte: 0, hoogte: 0 });

    // Meet het paneel, zodat een tablet of telefoon er verkleind in past.
    useEffect(() => {
      const el = ruimteRef.current;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const meet = () => setRuimte({ breedte: el.clientWidth, hoogte: el.clientHeight });
      meet();
      const waarnemer = new ResizeObserver(meet);
      waarnemer.observe(el);
      return () => waarnemer.disconnect();
    }, []);

    const maat = apparaten ? apparaat.maat : null;
    // Het paneel heeft rondom een halve rem marge om het apparaat heen.
    const MARGE = 16;
    const factor = maat
      ? schaal(maat, { breedte: ruimte.breedte - MARGE, hoogte: ruimte.hoogte - MARGE })
      : 1;

    const iframe = (
      <iframe
        className={maat ? styles.apparaatFrame : styles.preview}
        style={
          maat
            ? { width: maat.breedte, height: maat.hoogte, transform: `scale(${factor})` }
            : undefined
        }
        title="Voorbeeld van je website"
        // allow-modals zodat alert() en prompt() uit de les gewoon werken.
        // allow-popups zodat target="_blank" een tabblad opent, en
        // allow-popups-to-escape-sandbox zodat dat tabblad niet de sandbox
        // erft (opaque origin, SecurityError op localStorage: de meeste sites
        // doen het dan niet). Géén allow-same-origin: de code van de leerling
        // blijft van de editor af.
        sandbox="allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox"
        srcDoc={srcdoc}
      />
    );

    return (
      <div className={styles.kolom}>
        {apparaten && (
          <fieldset className={styles.apparaatBalk} aria-label="Voorbeeld tonen als">
            {APPARATEN.map((a) => {
              const Icoon = ICONEN[a.id];
              return (
                <button
                  key={a.id}
                  type="button"
                  className={styles.apparaatKnop}
                  aria-pressed={a.id === apparaat.id}
                  title={
                    a.maat ? `${a.label}: ${a.maat.breedte} × ${a.maat.hoogte}` : 'Volle breedte'
                  }
                  onClick={() => setApparaat(a)}
                >
                  <Icoon aria-hidden="true" size={14} />
                  {a.label}
                </button>
              );
            })}
            {maat && (
              <span className={styles.apparaatMaat}>
                {maat.breedte} × {maat.hoogte}
                {factor < 1 && `, ${Math.round(factor * 100)}%`}
              </span>
            )}
          </fieldset>
        )}
        {stand?.terugNaar !== null && stand?.terugNaar !== undefined && (
          // De leerling volgde een link naar een ander bestand; de Terug-knop
          // van de browser werkt niet in een srcdoc-iframe, dus hier een eigen.
          <div className={styles.balk}>
            <span>
              Je bekijkt <code>{stand.pagina}</code>
            </span>
            <button type="button" className={styles.balkKnop} onClick={terug}>
              ← Terug naar {stand.terugNaar}
            </button>
          </div>
        )}
        {/* Eén gemeten paneel, of er nu een apparaat gekozen is of niet. */}
        <div ref={ruimteRef} className={maat ? styles.apparaatRuimte : styles.volleRuimte}>
          {maat ? (
            // Het iframe krijgt de echte maat van het apparaat, zodat @media
            // aanslaat, en wordt verkleind; de doos eromheen neemt de
            // verkleinde maat aan, zodat hij netjes in het midden staat.
            <div
              className={styles.apparaatDoos}
              style={{ width: maat.breedte * factor, height: maat.hoogte * factor }}
            >
              {iframe}
            </div>
          ) : (
            iframe
          )}
        </div>
      </div>
    );
  }

  return {
    id: 'web',
    label: 'Website',
    languages: { html: 'html', css: 'css', js: 'javascript', json: 'json', svg: 'xml' },
    capabilities: { stop: false, preview: true, connect: false, autoRun: true },

    async init(onState) {
      window.addEventListener('message', onMessage);
      onState('ready');
    },

    async run(ctx: RunContext) {
      huidig = ctx;
      // Verse console per (auto-)run: oude logs horen bij het oude document.
      ctx.emit({ kind: 'clear' });
      toon(bezoek.bijRun(ctx.entry, ctx.files));
    },

    dispose() {
      huidig = null;
      window.removeEventListener('message', onMessage);
    },

    PreviewComponent,
  };
}
