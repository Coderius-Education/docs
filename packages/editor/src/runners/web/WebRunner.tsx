import type { ReactNode } from 'react';
import type { RunContext, Runner, RunnerHostProps } from '../types';
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

  function PreviewComponent({ session }: RunnerHostProps): ReactNode {
    const srcdoc = (session.data.srcdoc as string) ?? '';
    const stand = session.data.bezoek as BezoekData | undefined;
    return (
      <div className={styles.kolom}>
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
        <iframe
          className={styles.preview}
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
