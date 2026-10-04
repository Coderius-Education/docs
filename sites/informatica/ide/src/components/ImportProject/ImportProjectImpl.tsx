import { DEFAULT_STORAGE_PREFIX, newProjectId, saveProject } from '@coderius/editor/vfs/store';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useEffect, useState } from 'react';
import styles from './ImportProject.module.css';
import { ACK_MESSAGE, parseImportMessage, projectFromImport } from './importContract';

// Ontvangt een project via postMessage van de Website-checker
// (de web-cursus) en slaat het op in dezelfde IndexedDB-opslag als
// ProjectEditor, zodat het na navigeren naar de IDE-start automatisch als meest
// recente project geopend wordt. Blijft 100% client-side: er komt geen server
// aan te pas bij de overdracht. Het contract zelf (bronnen, vormcontrole)
// staat in importContract.ts.
const TIMEOUT_MS = 15000;

export default function ImportProjectImpl() {
  const [timedOut, setTimedOut] = useState(false);
  const ideStart = useBaseUrl('/');

  useEffect(() => {
    let handled = false;

    function onMessage(event: MessageEvent) {
      if (handled) return;
      const msg = parseImportMessage(event.data, event.origin);
      if (!msg) return;
      handled = true;

      const source = event.source as Window | null;
      source?.postMessage(ACK_MESSAGE, event.origin);

      const project = projectFromImport(msg, newProjectId(), Date.now());
      void saveProject(DEFAULT_STORAGE_PREFIX, project).then(() => {
        // Naar de IDE zelf: de baseUrl (/ide/), niet de root van de vak-host.
        window.location.replace(ideStart);
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
  }, [ideStart]);

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
