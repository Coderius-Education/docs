import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import { PRIVACY_CONTENT } from '../../privacy-content';
import MatomoOptOut from './MatomoOptOut';
import styles from './styles.module.css';

// Volledige paginawrapper voor de /privacy-route (toegevoegd door de gedeelde
// privacy-route plugin). Rendert de gedeelde inhoud uit privacy-content.js —
// dezelfde brontekst die sites/home (Svelte) ook rendert.
export default function PrivacyPage(): ReactNode {
  const { sections, lastUpdated, controller } = PRIVACY_CONTENT;

  return (
    <Layout
      title="Privacy"
      description="Privacyverklaring: hoe en waarom Coderius-cursussites bezoekstatistieken verzamelen via Matomo."
    >
      <main className="container margin-vert--lg">
        <div className={styles.content}>
          {sections.map((section) => (
            <section key={section.id} className={styles.section}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {section.list && (
                <ul>
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.trailingParagraphs?.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {section.id === 'bezwaar' && <MatomoOptOut />}
              {section.id === 'contact' && (
                <p>
                  Neem contact op met {controller.schoolName}, via{' '}
                  <a href={`mailto:${controller.contactEmail}`}>{controller.contactEmail}</a>.
                </p>
              )}
            </section>
          ))}
          <p className={styles.updated}>Laatst bijgewerkt: {lastUpdated}.</p>
        </div>
      </main>
    </Layout>
  );
}
