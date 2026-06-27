import type {ReactNode} from 'react';
import {codeorgBySlug, codeorgUnit1} from '@site/src/data/codeorg';
import styles from './styles.module.css';

/**
 * Per-les callout die een coderius-lespagina koppelt aan de bijbehorende
 * Code.org Web Lab-les. Globaal geregistreerd (zie src/theme/MDXComponents.tsx),
 * dus bruikbaar als `<CodeOrg slug="intro-html" />` zonder import. Een slug die
 * niet in de mapping staat, rendert niets.
 */
export function CodeOrg({slug}: {slug: string}): ReactNode {
  const les = codeorgBySlug[slug];
  if (!les) return null;
  return (
    <aside className={styles.callout}>
      <span className={styles.badge}>Code.org Web Lab</span>
      <span className={styles.text}>
        Hoort bij{' '}
        <strong>
          Lesson {les.lesson}: {les.title}
        </strong>
        .{' '}
        <a href={les.url} target="_blank" rel="noopener noreferrer">
          Open deze les op Code.org →
        </a>
      </span>
    </aside>
  );
}

/**
 * Centrale tabel "Code.org-les → coderius-oefenpagina" voor de hub-pagina,
 * gegenereerd uit dezelfde bron als de callouts.
 */
export function CodeOrgTabel(): ReactNode {
  return (
    <table>
      <thead>
        <tr>
          <th>Les</th>
          <th>Onderwerp</th>
          <th>Oefenen</th>
        </tr>
      </thead>
      <tbody>
        {codeorgUnit1.map((l) => (
          <tr key={l.slug}>
            <td>
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                Lesson {l.lesson}
              </a>
            </td>
            <td>{l.title}</td>
            <td>
              <a href={l.to}>{l.nl}</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default CodeOrg;
