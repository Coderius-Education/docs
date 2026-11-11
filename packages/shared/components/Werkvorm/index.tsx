import { usePluginData } from '@docusaurus/useGlobalData';
import type { ReactNode } from 'react';
// werkvormen/index.js is CommonJS; named imports werken via de bundler-interop.
import { WERKVORMEN, werkvorm } from '../../werkvormen';
import SiteLink from '../SiteLink';
import { WerkvormIcoon } from './Icoon';
import styles from './styles.module.css';

// Werkvormen (zie ../../werkvormen): wat een leerling in een onderdeel van een
// les doet, met een icoon. Drie onderdelen:
//
//  - <WerkvormIcoon id="voorspellen" />: het icoon, op een les-tabblad en in
//    de docentenhandleiding (Icoon.tsx).
//  - <Werkvormen />: de kern van de docentenhandleiding. Per onderdeel van
//    een les het icoon, wat de leerling doet en de literatuur waarop het
//    steunt: de tip van vakdidactiek, met de paper erbij.
//  - <LesWerkvormen les="html-css/koppen-lijsten" />: de werkvormen van één
//    les op een rij.

type Les = { titel: string; pad: string; werkvormen: string[] };
type Data = { lessen: Record<string, Les> };

/**
 * De onderdelen van een les, in de volgorde van de les, elk met de literatuur
 * waarop het steunt. Alleen wat in de lessen van deze cursus voorkomt: een
 * werkvorm die geen les gebruikt, heeft hier niets uit te leggen.
 */
export function Werkvormen(): ReactNode {
  const data = usePluginData('coderius-werkvormen') as Data | undefined;
  const gebruikt = data && new Set(Object.values(data.lessen).flatMap((les) => les.werkvormen));
  const vormen = WERKVORMEN.filter((vorm) => !gebruikt || gebruikt.has(vorm.id));
  return (
    <table className={styles.legenda}>
      <thead>
        <tr>
          <th scope="col">Onderdeel van de les</th>
          <th scope="col">Wat je leerlingen doen</th>
          <th scope="col">Waar het op steunt</th>
        </tr>
      </thead>
      <tbody>
        {vormen.map((vorm) => (
          <tr key={vorm.id}>
            <th scope="row" className={styles.naam}>
              <WerkvormIcoon id={vorm.id} />
              {vorm.label}
            </th>
            <td>{vorm.doet}</td>
            <td>
              <ul className={styles.tips}>
                {vorm.tips.map((tip) => (
                  <li key={tip.slug}>
                    <SiteLink site="didactiek" to={`/bronnen/${tip.slug}`}>
                      {tip.term}
                    </SiteLink>
                    <span className={styles.bron}>{tip.bron ?? 'uit de praktijk'}</span>
                  </li>
                ))}
              </ul>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * De werkvormen van één les, in de volgorde waarin de leerling ze tegenkomt.
 * Een werkvorm die vaker voorkomt (drie tabbladen uitleg) staat er één keer.
 * De gegevens komen uit plugins/werkvormen.js, die de lessen leest zoals de
 * build ze in tabbladen zet.
 */
export function LesWerkvormen({ les }: { les: string }): ReactNode {
  const { lessen } = usePluginData('coderius-werkvormen') as Data;
  const gevonden = lessen[les];
  // Een les die niet bestaat of geen tabbladen heeft, is een fout in de
  // docentenhandleiding: de build stopt, in plaats van een lege cel te tonen.
  if (!gevonden) throw new Error(`LesWerkvormen: geen les met tabbladen '${les}'`);
  const uniek = [...new Set(gevonden.werkvormen)];
  const namen = uniek.map((id) => werkvorm(id)?.label ?? id);
  return (
    <span className={styles.rij} role="img" aria-label={`Werkvormen: ${namen.join(', ')}`}>
      {uniek.map((id, i) => (
        <span key={id} className={styles.vak} title={namen[i]}>
          <WerkvormIcoon id={id} />
        </span>
      ))}
    </span>
  );
}

export { WerkvormIcoon };
