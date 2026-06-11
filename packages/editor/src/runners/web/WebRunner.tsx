import type { ReactNode } from 'react';
import type { OutputEvent, RunContext, Runner, RunnerHostProps } from '../types';
import { MESSAGE_SOURCE, buildDoc } from './buildDoc';
import styles from './styles.module.css';

function PreviewComponent({ session }: RunnerHostProps): ReactNode {
  const srcdoc = (session.data.srcdoc as string) ?? '';
  return (
    <iframe
      className={styles.preview}
      title="Voorbeeld van je website"
      // allow-modals zodat alert() en prompt() uit de les gewoon werken.
      sandbox="allow-scripts allow-modals"
      srcDoc={srcdoc}
    />
  );
}

export function createWebRunner(): Runner {
  // Iedere runner-instantie filtert berichten op een eigen token, zodat
  // meerdere web-editors op één pagina elkaars console niet vervuilen.
  const token = Math.random().toString(36).slice(2);
  let currentEmit: ((ev: OutputEvent) => void) | null = null;

  const onMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || data.source !== MESSAGE_SOURCE || data.token !== token) return;
    if (data.type !== 'console') return;
    const text = `${data.text}\n`;
    currentEmit?.({
      kind: data.level === 'error' || data.level === 'warn' ? 'stderr' : 'stdout',
      text,
    });
  };

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
      currentEmit = ctx.emit;
      // Verse console per (auto-)run: oude logs horen bij het oude document.
      ctx.emit({ kind: 'clear' });
      ctx.setData('srcdoc', buildDoc(ctx.files, ctx.entry, token));
    },

    dispose() {
      currentEmit = null;
      window.removeEventListener('message', onMessage);
    },

    PreviewComponent,
  };
}
