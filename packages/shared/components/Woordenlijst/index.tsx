import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import useBrokenLinks from '@docusaurus/useBrokenLinks';
import { usePluginData } from '@docusaurus/useGlobalData';
import { Fragment, type ReactNode, useState } from 'react';
import type { BegrippenData } from '../../begrippen';
import { MetCode } from '../Begrip';
import styles from './styles.module.css';

// Alle begrippen van de cursus op één pagina, op alfabet, met een zoekveld.
// Uit dezelfde globale data als de tooltips (plugins/begrippen.js), dus een
// begrip in src/begrippen.json staat vanzelf ook hier. Elk begrip heeft een
// anker met zijn id; de link "Alle begrippen" in een tooltip wijst daarheen.

export default function Woordenlijst(): ReactNode {
  const { begrippen } = usePluginData('coderius-begrippen') as BegrippenData;
  const links = useBrokenLinks();
  // Het begrip waar je vandaan kwam (#pipe). Niet met :target in CSS: Docusaurus
  // wisselt van pagina zonder herladen, en dan verandert :target niet.
  const gekozen = decodeURIComponent(useLocation().hash.slice(1));
  const [zoek, setZoek] = useState('');
  // Docusaurus kent alleen de ankers van koppen vanzelf; zonder dit gaf een
  // link naar #pipe bij het bouwen een waarschuwing over een kapot anker.
  for (const b of begrippen) links.collectAnchor(b.id);

  const q = zoek.trim().toLowerCase();
  const zichtbaar = q
    ? begrippen.filter((b) => `${b.term} ${b.kort}`.toLowerCase().includes(q))
    : begrippen;

  return (
    <>
      <input
        type="search"
        className={styles.zoek}
        placeholder={`Zoek in ${begrippen.length} begrippen`}
        aria-label="Zoek een begrip"
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
      />
      {zichtbaar.length === 0 && <p>Geen begrip gevonden voor "{zoek}".</p>}
      <dl className={styles.lijst}>
        {zichtbaar.map((b) => (
          <Fragment key={b.id}>
            <dt
              id={b.id}
              className={b.id === gekozen ? `${styles.term} ${styles.gekozen}` : styles.term}
            >
              {b.term}
            </dt>
            <dd className={b.id === gekozen ? `${styles.uitleg} ${styles.gekozen}` : styles.uitleg}>
              <MetCode tekst={b.kort} />
              {b.les && (
                <>
                  {' '}
                  <Link to={b.les.pad}>Uitgelegd in {b.les.titel}</Link>
                </>
              )}
            </dd>
          </Fragment>
        ))}
      </dl>
    </>
  );
}
