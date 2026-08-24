import type { CheckerConfig, ProjectFiles } from '../types';
import styles from './PhotoStrip.module.css';

// Afbeeldingen worden al als data-URL ingelezen door readFiles.ts, maar tot nu
// toe alleen om ze naar de online editor te kunnen sturen — ze werden nergens
// getoond. Voor een cursus waar het eindproduct fysiek is (robotica) zijn die
// foto's juist het bewijs: de code zegt niets over of het frame er staat.
//
// Staat binnen reportRef in CheckerInner, dus de foto's komen automatisch mee
// in de PDF-export.

interface PhotoStripProps {
  files: ProjectFiles;
  config: CheckerConfig;
}

export function PhotoStrip({ files, config }: PhotoStripProps) {
  const imageKinds = config.imageKinds ?? [];
  if (imageKinds.length === 0) return null;

  const fotos = Object.values(files)
    .filter((f) => imageKinds.includes(f.kind) && f.content !== null)
    .sort((a, b) => a.path.localeCompare(b.path));

  if (fotos.length === 0) return null;

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
            <img className={styles.foto} src={foto.content ?? ''} alt={foto.path} loading="lazy" />
            <span className={styles.naam}>{foto.path}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
