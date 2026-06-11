import BrowserOnly from '@docusaurus/BrowserOnly';
import type { ReactNode } from 'react';
import type { RunnerId } from '../../runners/types';

export interface InlineEditorProps {
  runner: RunnerId;
  // Single-file: code als prop of als template-literal child ({`...`}).
  code?: string;
  children?: string;
  // Kleine multi-file modus (tabs, geen bestandsboom).
  files?: Record<string, string>;
  entry?: string;
  height?: number | string;
  readOnly?: boolean;
  // Onzichtbare Python-opzetcode die vóór de leerlingcode draait.
  hiddenSetup?: string;
  // Opt-in: bewaar bewerkingen in localStorage onder deze sleutel.
  persistKey?: string;
  // Web-runner: automatisch opnieuw uitvoeren tijdens het typen.
  autoRun?: boolean;
  // Web-runner: preview-paneel tonen (standaard aan).
  showPreview?: boolean;
  title?: string;
}

export default function InlineEditor(props: InlineEditorProps): ReactNode {
  const fallbackCode = props.code ?? props.children ?? Object.values(props.files ?? {})[0] ?? '';
  return (
    <BrowserOnly
      fallback={
        <pre>
          <code>{fallbackCode}</code>
        </pre>
      }
    >
      {() => {
        const Impl = require('./InlineEditorImpl').default;
        return <Impl {...props} />;
      }}
    </BrowserOnly>
  );
}
