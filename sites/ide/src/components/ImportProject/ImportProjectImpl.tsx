import { newProjectId, saveProject } from '@coderius/editor/vfs/store';
import type { Project } from '@coderius/editor/vfs/types';
import { SITES_BY_ID } from '@coderius/shared/sites';
import { useEffect, useState } from 'react';
import styles from './ImportProject.module.css';

// Ontvangt een project via postMessage van de Website-checker
// (web.coderius.nl) en slaat het op in dezelfde IndexedDB-opslag als
// ProjectEditor (prefix 'coderius-editor'), zodat het na navigeren naar "/"
// automatisch als meest recente project geopend wordt. Blijft 100%
// client-side: er komt geen server aan te pas bij de overdracht.
const MESSAGE_SOURCE = 'coderius-website-checker';
const ACK_SOURCE = 'coderius-editor-import';
const STORAGE_PREFIX = 'coderius-editor';
const TIMEOUT_MS = 15000;

function isAllowedOrigin(origin: string): boolean {
  return origin === SITES_BY_ID.web.url || origin.startsWith('http://localhost:');
}

export default function ImportProjectImpl() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let handled = false;

    function onMessage(event: MessageEvent) {
      if (handled) return;
      const data = event.data;
      if (data?.source !== MESSAGE_SOURCE || data.type !== 'import-files') return;
      if (!isAllowedOrigin(event.origin)) return;
      if (typeof data.entry !== 'string' || typeof data.files !== 'object' || data.files === null) {
        return;
      }
      handled = true;

      const source = event.source as Window | null;
      source?.postMessage({ source: ACK_SOURCE, type: 'ack' }, event.origin);

      const now = Date.now();
      const project: Project = {
        id: newProjectId(),
        name: typeof data.name === 'string' && data.name ? data.name : 'Vanuit Website-checker',
        runnerId: 'web',
        entry: data.entry,
        files: data.files,
        folders: [],
        createdAt: now,
        updatedAt: now,
      };

      void saveProject(STORAGE_PREFIX, project).then(() => {
        window.location.replace('/');
      });
    }

    window.addEventListener('message', onMessage);
    const timer = window.setTimeout(() => {
      if (!handled) setTimedOut(true);
    }, TIMEOUT_MS);

    return () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className={styles.wrap}>
      <p className={styles.message}>
        {timedOut
          ? 'Geen project ontvangen. Controleer of pop-ups zijn toegestaan en probeer opnieuw vanaf de website-checker.'
          : 'Project laden...'}
      </p>
    </div>
  );
}
