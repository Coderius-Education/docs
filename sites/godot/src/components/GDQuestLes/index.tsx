import {
  GDQUEST_URL,
  type GDQuestKoppeling,
  gdquestBySlug,
  gdquestKoppelingen,
  gdquestLes,
  lesUrl,
} from '@site/src/data/gdquest';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

// "les 5: Coding Your First Function" of, als het lesnummer nog niet
// gecontroleerd is, "de lessen over voorwaarden".
function lesTekst(koppeling: GDQuestKoppeling): ReactNode {
  const lessen = koppeling.lessen.map(gdquestLes).filter((l) => l !== undefined);

  if (lessen.length === 0) {
    return <>de lessen over {koppeling.onderwerp}</>;
  }

  return lessen.map((les, i) => (
    <span key={les.nummer}>
      {i > 0 ? ' en ' : ''}
      les {les.nummer}: {les.titel}
    </span>
  ));
}

/**
 * Per-les callout die een godot-lespagina koppelt aan de GDQuest-les waar
 * hetzelfde concept los geoefend wordt. Globaal geregistreerd (zie
 * src/theme/MDXComponents.tsx), dus bruikbaar als
 * `<GDQuestLes slug="movement-motor" />` zonder import. Een slug die niet in de
 * mapping staat, rendert niets.
 */
export function GDQuestLes({ slug }: { slug: string }): ReactNode {
  const koppeling = gdquestBySlug[slug];
  if (!koppeling) return null;

  const eersteLes = koppeling.lessen[0];
  const url = eersteLes === undefined ? GDQUEST_URL : lesUrl(eersteLes);

  return (
    <aside className={styles.callout}>
      <span className={styles.badge}>GDQuest</span>
      <span className={styles.text}>
        Hier schrijf je <strong>{koppeling.concept}</strong>. Dat oefen je los in{' '}
        <strong>{lesTekst(koppeling)}</strong>.{' '}
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open Learn GDScript From Zero →
        </a>
      </span>
    </aside>
  );
}

/**
 * Centrale tabel "les hier → GDQuest-les" voor de hub-pagina, gegenereerd uit
 * dezelfde bron als de callouts.
 */
export function GDQuestTabel(): ReactNode {
  return (
    <table>
      <thead>
        <tr>
          <th>Wat je schrijft</th>
          <th>In welke les</th>
          <th>Oefenen bij GDQuest</th>
        </tr>
      </thead>
      <tbody>
        {gdquestKoppelingen.map((k) => (
          <tr key={k.slug}>
            <td>{k.concept}</td>
            <td>
              <a href={k.to}>{k.nl}</a>
            </td>
            <td>{lesTekst(k)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default GDQuestLes;
