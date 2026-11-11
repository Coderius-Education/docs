import Link from '@docusaurus/Link';
import { tips } from '@site/src/data/tips';
import type { ReactNode } from 'react';
import { perCategorie } from '../TipZoeker/filterTips';
import styles from './styles.module.css';

/**
 * De controlevragen van alle tips, per categorie: de lijst waarmee je een les
 * naloopt. Een categorie zonder tips staat erbij, zodat te zien is waar de
 * verzameling nog leeg is. De vinkjes worden niet bewaard: de lijst is om af
 * te lopen of te printen, niet om een stand bij te houden.
 */
export default function Checklist(): ReactNode {
  return (
    <>
      {perCategorie(tips).map(({ categorie, tips: lijst }) => (
        <section key={categorie.id} className={styles.groep}>
          <h2 id={categorie.id}>{categorie.label}</h2>
          <p className={styles.omschrijving}>{categorie.omschrijving}</p>
          {lijst.length === 0 ? (
            <p className={styles.leeg}>Nog geen tips in deze categorie.</p>
          ) : (
            <ul className={styles.vragen}>
              {lijst.map((tip) => (
                <li key={tip.slug}>
                  <label>
                    <input type="checkbox" /> {tip.controlevraag}
                  </label>
                  <span className={styles.tip}>
                    Tip: <Link to={tip.detailPad}>{tip.term}</Link>
                    {tip.bron === 'praktijk' ? ' (uit de praktijk)' : ' (uit onderzoek)'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}
