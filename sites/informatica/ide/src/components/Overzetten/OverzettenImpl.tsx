import { useSiteId } from '@coderius/editor/lib/siteId';
import { loadProject, projectOpslag, saveProject } from '@coderius/editor/vfs/store';
import type { Project } from '@coderius/editor/vfs/types';
import Link from '@docusaurus/Link';
import { type ChangeEvent, type ReactNode, useEffect, useState } from 'react';
import styles from './Overzetten.module.css';
import {
  KLAAR_BERICHT,
  isVanOudePagina,
  leesProjecten,
  moetOpslaan,
  ontvangenBericht,
  oudeOrigin,
} from './overzettenContract';

// Ontvangt de projecten van de oude IDE (https://ide.coderius.nl/oud/overzetten/)
// en zet ze in de opslag van deze IDE. Twee wegen: de oude pagina opent deze
// en geeft ze via postMessage, of de leerling kiest het bestand dat de oude
// pagina downloadde. Het contract staat in overzettenContract.ts.

type Stand =
  | { soort: 'wachten' }
  | { soort: 'bezig' }
  | { soort: 'klaar'; opgeslagen: number; overgeslagen: number }
  | { soort: 'fout'; tekst: string };

/** Zet de projecten in de opslag; een project dat hier al nieuwer is blijft staan. */
async function bewaar(opslag: string, projecten: Project[]): Promise<Stand> {
  let opgeslagen = 0;
  for (const p of projecten) {
    const bestaand = await loadProject(opslag, p.id);
    if (moetOpslaan(p, bestaand)) {
      await saveProject(opslag, p);
      opgeslagen += 1;
    }
  }
  return { soort: 'klaar', opgeslagen, overgeslagen: projecten.length - opgeslagen };
}

export default function OverzettenImpl(): ReactNode {
  const opslag = projectOpslag(useSiteId());
  const verwacht = oudeOrigin(window.location);
  const [stand, setStand] = useState<Stand>({ soort: 'wachten' });

  useEffect(() => {
    const opener = window.opener as Window | null;
    if (!opener) return;
    let afgehandeld = false;

    function onMessage(event: MessageEvent) {
      if (afgehandeld || !isVanOudePagina(event.origin, event.source, opener, verwacht)) return;
      const projecten = leesProjecten(event.data);
      if (!projecten) return;
      afgehandeld = true;
      setStand({ soort: 'bezig' });
      bewaar(opslag, projecten)
        .then((uitkomst) => {
          setStand(uitkomst);
          opener?.postMessage(ontvangenBericht(projecten.length), verwacht);
        })
        .catch(() => setStand({ soort: 'fout', tekst: 'Opslaan in deze browser lukte niet.' }));
    }

    window.addEventListener('message', onMessage);
    // targetOrigin: alleen een opener op de oude origin krijgt dit te zien.
    opener.postMessage(KLAAR_BERICHT, verwacht);
    return () => window.removeEventListener('message', onMessage);
  }, [opslag, verwacht]);

  async function kiesBestand(event: ChangeEvent<HTMLInputElement>) {
    const bestand = event.target.files?.[0];
    if (!bestand) return;
    setStand({ soort: 'bezig' });
    try {
      const projecten = leesProjecten(JSON.parse(await bestand.text()));
      if (!projecten) {
        setStand({
          soort: 'fout',
          tekst: 'Dit bestand komt niet van de oude IDE. Kies ide-projecten.json.',
        });
        return;
      }
      setStand(await bewaar(opslag, projecten));
    } catch {
      setStand({ soort: 'fout', tekst: 'Dit bestand kon niet gelezen worden.' });
    }
  }

  const oudePagina = `${verwacht}/oud/overzetten/`;

  return (
    <main className={styles.wrap}>
      <h1>Oude projecten overzetten</h1>
      <p>
        De IDE stond eerst op <code>ide.coderius.nl</code>. Projecten die je daar maakte, staan nog
        in je browser, maar de nieuwe IDE kan er niet bij. Zo neem je ze mee:
      </p>
      <ol className={styles.stappen}>
        <li>
          Open <a href={oudePagina}>de overzetpagina op het oude adres</a>, in dezelfde browser
          waarin je de projecten maakte.
        </li>
        <li>
          Klik daar op <strong>Zet over naar de nieuwe IDE</strong>. Dit tabblad gaat dan open en
          neemt de projecten over.
        </li>
      </ol>

      {/* Altijd in de DOM: een live-regio die pas verschijnt, wordt niet altijd voorgelezen. */}
      <output className={styles.status} aria-live="polite" hidden={stand.soort === 'wachten'}>
        {stand.soort === 'bezig' && 'Projecten overzetten…'}
        {stand.soort === 'fout' && stand.tekst}
        {stand.soort === 'klaar' && (
          <>
            {stand.opgeslagen} {stand.opgeslagen === 1 ? 'project' : 'projecten'} overgezet
            {stand.overgeslagen > 0 &&
              `, ${stand.overgeslagen} stond${stand.overgeslagen === 1 ? '' : 'en'} hier al`}
            . <Link to="/">Open de IDE</Link>
          </>
        )}
      </output>

      <div className={styles.bestand}>
        <label htmlFor="projectbestand">
          Heb je de projecten gedownload als <code>ide-projecten.json</code>? Kies dat bestand:
        </label>
        <br />
        <input
          id="projectbestand"
          type="file"
          accept=".json,application/json"
          onChange={kiesBestand}
        />
      </div>
    </main>
  );
}
