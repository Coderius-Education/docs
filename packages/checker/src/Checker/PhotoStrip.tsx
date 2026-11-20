import { useRef, useState } from 'react';
import type { CheckerConfig, ProjectFiles } from '../types';
import styles from './PhotoStrip.module.css';

// Afbeeldingen worden al als data-URL ingelezen door readFiles.ts, maar tot nu
// toe alleen om ze naar de online editor te kunnen sturen — ze werden nergens
// getoond. Voor een cursus waar het eindproduct fysiek is (robotica) zijn die
// foto's juist het bewijs: de code zegt niets over of het frame er staat.
//
// Staat binnen reportRef in CheckerInner, dus de foto's komen automatisch mee
// in de PDF-export.
//
// Een klik op een foto toont hem groot, heel en niet bijgesneden: in de strip
// zag de docent het frame of de sensoren te klein om een vinkje op te zetten,
// en een schermafbeelding van het scherm van de robot werd bijgesneden tot
// een zwart vlak.

interface PhotoStripProps {
  files: ProjectFiles;
  config: CheckerConfig;
}

export function PhotoStrip({ files, config }: PhotoStripProps) {
  const venster = useRef<HTMLDialogElement>(null);
  const [groot, setGroot] = useState<{ src: string; naam: string } | null>(null);
  const imageKinds = config.imageKinds ?? [];
  if (imageKinds.length === 0) return null;

  const fotos = Object.values(files)
    .filter((f) => imageKinds.includes(f.kind) && f.content !== null)
    .sort((a, b) => a.path.localeCompare(b.path));

  if (fotos.length === 0) return null;

  const open = (src: string, naam: string) => {
    setGroot({ src, naam });
    // showModal bestaat niet in jsdom; daar is het venster er alleen in de DOM.
    venster.current?.showModal?.();
  };

  return (
    <section className={styles.section}>
      <h2>
        Foto's{' '}
        <span className={styles.count}>
          {fotos.length} {fotos.length === 1 ? 'afbeelding' : 'afbeeldingen'}
        </span>
      </h2>
      <ul className={styles.strip}>
        {fotos.map((foto) => (
          <li className={styles.item} key={foto.path}>
            <button
              type="button"
              className={styles.knop}
              onClick={() => open(foto.content ?? '', foto.path)}
              aria-label={`Bekijk ${foto.path} groot`}
            >
              <img
                className={styles.foto}
                src={foto.content ?? ''}
                alt={foto.path}
                loading="lazy"
              />
            </button>
            <span className={styles.naam}>{foto.path}</span>
          </li>
        ))}
      </ul>
      <dialog
        ref={venster}
        className={styles.venster}
        aria-label={groot ? groot.naam : "Foto's"}
        onClose={() => setGroot(null)}
        data-html2canvas-ignore
      >
        {groot && (
          <>
            <div className={styles.vensterKop}>
              <span>{groot.naam}</span>
              <button
                type="button"
                className={styles.sluit}
                onClick={() => venster.current?.close()}
              >
                Sluiten
              </button>
            </div>
            <img className={styles.grootBeeld} src={groot.src} alt={groot.naam} />
          </>
        )}
      </dialog>
    </section>
  );
}
