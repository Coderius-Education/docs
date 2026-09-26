import Keuzelijst from '@coderius/shared/components/Keuzelijst';
import { SITES_BY_ID, normalizeUrl } from '@coderius/shared/sites';
import Link from '@docusaurus/Link';
import type React from 'react';
import { useEffect, useState } from 'react';
import { lessen } from '../../data/lessen';
import {
  type Activiteit,
  type Link as ActiviteitLink,
  SOORTEN,
  type Soort,
  activiteiten,
  indelen,
  lessenVan,
  pastNa,
} from '../../data/projecten';
import styles from './styles.module.css';

// De projecten als kaarten, met één keuze: "Ik ben bij les …". Daarmee delen
// de kaarten zich in naar wat nu past en wat straks komt. De keuze wordt in
// de browser onthouden. Zonder keuze (en in de HTML van de build, dus ook
// zonder JavaScript) staan alle kaarten er, in de volgorde van de cursus.

const OPSLAG = 'coderius-python-bij-les';

function leesKeuze(): string | null {
  try {
    const waarde = window.localStorage.getItem(OPSLAG);
    return waarde && lessen.some((les) => les.id === waarde) ? waarde : null;
  } catch {
    return null;
  }
}

function bewaarKeuze(waarde: string | null): void {
  try {
    if (waarde === null) window.localStorage.removeItem(OPSLAG);
    else window.localStorage.setItem(OPSLAG, waarde);
  } catch {
    // Geen opslag (privévenster, geblokkeerd): dan geldt de keuze alleen nu.
  }
}

function KaartLink({
  link,
  className,
  children,
}: {
  link: ActiviteitLink;
  className: string;
  children: React.ReactNode;
}): React.JSX.Element {
  if ('href' in link || 'site' in link) {
    const href = 'href' in link ? link.href : normalizeUrl(SITES_BY_ID[link.site].url) + link.to;
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className={className} to={link.to}>
      {children}
    </Link>
  );
}

const SOORT_LABEL = Object.fromEntries(SOORTEN.map((s) => [s.id, s.label])) as Record<
  Soort,
  string
>;

function Kaart({
  activiteit,
  straks,
  toonVoet,
}: {
  activiteit: Activiteit;
  straks: boolean;
  /** Onder "Past nu" is "past na les …" dubbel; daar staat hij niet. */
  toonVoet: boolean;
}): React.JSX.Element {
  const extern = !('to' in activiteit.link) || 'site' in activiteit.link;
  return (
    <KaartLink link={activiteit.link} className={`${styles.kaart} ${straks ? styles.straks : ''}`}>
      <span className={styles.kop}>
        <span className={`${styles.soort} ${styles[activiteit.soort]}`}>
          {SOORT_LABEL[activiteit.soort]}
        </span>
        {activiteit.stappen !== undefined && (
          <span className={styles.stappen}>{activiteit.stappen} stappen</span>
        )}
        {extern && <span className={styles.stappen}>andere site ↗</span>}
      </span>
      <span className={styles.titel}>{activiteit.titel}</span>
      <span className={styles.wat}>{activiteit.wat}</span>
      <span className={styles.lessen}>
        {lessenVan(activiteit).map((les) => (
          <span key={les.id} className={styles.les}>
            {les.label}
          </span>
        ))}
      </span>
      {toonVoet && <span className={styles.voet}>Past na les {pastNa(activiteit).label}</span>}
    </KaartLink>
  );
}

export default function ProjectKiezer({
  soorten,
}: {
  /** Alleen deze soorten tonen, zonder soortfilter (bv. ['turtle']). */
  soorten?: Soort[];
}): React.JSX.Element {
  const [les, setLes] = useState<string | null>(null);
  const [soort, setSoort] = useState<Soort | null>(null);

  useEffect(() => {
    setLes(leesKeuze());
  }, []);

  const kies = (waarde: string) => {
    const nieuw = waarde === '' ? null : waarde;
    setLes(nieuw);
    bewaarKeuze(nieuw);
  };

  const lijst = soorten ? activiteiten.filter((a) => soorten.includes(a.soort)) : activiteiten;
  const { nu, straks } = indelen(lijst, les, soort);
  const zichtbareSoorten = SOORTEN.filter((s) => lijst.some((a) => a.soort === s.id));

  return (
    <div className={styles.kiezer}>
      <div className={styles.filters}>
        <div className={styles.keuze}>
          <label htmlFor="bij-les">Ik ben bij les</label>
          <Keuzelijst
            id="bij-les"
            waarde={les ?? ''}
            onKies={kies}
            opties={[
              { waarde: '', label: 'Laat alles zien' },
              ...lessen.map((l) => ({ waarde: l.id, label: l.label, groep: l.hoofdstuk })),
            ]}
          />
        </div>
        {zichtbareSoorten.length > 1 && (
          <fieldset className={styles.chips}>
            <legend className={styles.verborgen}>Soort</legend>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={soort === null}
              onClick={() => setSoort(null)}
            >
              Alles
            </button>
            {zichtbareSoorten.map((s) => (
              <button
                key={s.id}
                type="button"
                className={styles.chip}
                aria-pressed={soort === s.id}
                onClick={() => setSoort(soort === s.id ? null : s.id)}
              >
                {s.label}
              </button>
            ))}
          </fieldset>
        )}
      </div>

      {les !== null && <div className={styles.sectie}>Past nu ({nu.length})</div>}
      {nu.length > 0 ? (
        <div className={styles.raster}>
          {nu.map((a) => (
            <Kaart key={a.id} activiteit={a} straks={false} toonVoet={les === null} />
          ))}
        </div>
      ) : (
        <p className={styles.leeg}>
          Nog niets bij deze les. Kijk hieronder wat er na de volgende lessen komt.
        </p>
      )}

      {straks.length > 0 && (
        <>
          <div className={styles.sectie}>Straks ({straks.length})</div>
          <div className={styles.raster}>
            {straks.map((a) => (
              <Kaart key={a.id} activiteit={a} straks toonVoet />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
