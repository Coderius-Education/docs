import { SITES_BY_ID, normalizeUrl } from '@coderius/shared/sites';
import Link from '@docusaurus/Link';
import type React from 'react';
import { useState } from 'react';
import {
  type Activiteit,
  type Link as ActiviteitLink,
  CONCEPTNAMEN,
  SOORTEN,
  type Soort,
  activiteiten,
  conceptenIn,
  filter,
  vanafLes,
} from '../../data/projecten';
import styles from './styles.module.css';

// De projecten als kaarten. Je kiest een concept dat je wilt oefenen, en ziet
// in welke projecten het voorkomt; chips voor de soort filteren verder. Zonder
// keuze (en in de HTML van de build, dus ook zonder JavaScript) staan alle
// kaarten er, in de volgorde waarin je ze in de cursus kunt doen.

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

function Concepten({
  activiteit,
  gekozen,
}: {
  activiteit: Activiteit;
  gekozen: string | null;
}): React.JSX.Element {
  return (
    <span className={styles.lessen}>
      {activiteit.concepten.map((id) => (
        <span key={id} className={`${styles.les} ${id === gekozen ? styles.lesGekozen : ''}`}>
          {CONCEPTNAMEN[id]}
        </span>
      ))}
    </span>
  );
}

function Kaart({
  activiteit,
  gekozen,
}: {
  activiteit: Activiteit;
  gekozen: string | null;
}): React.JSX.Element {
  const extern = !('to' in activiteit.link) || 'site' in activiteit.link;
  return (
    <KaartLink link={activiteit.link} className={styles.kaart}>
      <span className={styles.kop}>
        <span className={`${styles.soort} ${styles[activiteit.soort]}`}>
          {SOORT_LABEL[activiteit.soort]}
        </span>
        <span className={styles.titel}>
          {activiteit.titel}
          {extern ? ' ↗' : ''}
        </span>
      </span>
      <span className={styles.wat}>{activiteit.wat}</span>
      <span className={styles.voet}>
        <Concepten activiteit={activiteit} gekozen={gekozen} />
        <span className={styles.vanaf} title={`Vanaf les ${vanafLes(activiteit).label}`}>
          {activiteit.stappen !== undefined ? `${activiteit.stappen} stappen · ` : ''}
          vanaf les {vanafLes(activiteit).id.replace(/^0/, '')}
        </span>
      </span>
    </KaartLink>
  );
}

// De algoritmes staan allemaal op een andere site en zijn met veel: als
// compacte rij in een lijst in plaats van als kaart.
function Rij({
  activiteit,
  gekozen,
}: {
  activiteit: Activiteit;
  gekozen: string | null;
}): React.JSX.Element {
  return (
    <KaartLink link={activiteit.link} className={styles.rij}>
      <span className={styles.rijTitel}>{activiteit.titel} ↗</span>
      <span className={styles.rijWat}>{activiteit.wat}</span>
      <Concepten activiteit={activiteit} gekozen={gekozen} />
    </KaartLink>
  );
}

const GROEPEN: { titel: string; soorten: Soort[]; alsLijst?: boolean }[] = [
  { titel: 'Projecten, puzzel en spel', soorten: ['project', 'puzzel', 'spel'] },
  { titel: 'Tekenen met turtle', soorten: ['turtle'] },
  { titel: 'Algoritmes', soorten: ['algoritme'], alsLijst: true },
];

function Chip({
  actief,
  onClick,
  children,
}: {
  actief: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button type="button" className={styles.chip} aria-pressed={actief} onClick={onClick}>
      {children}
    </button>
  );
}

export default function ProjectKiezer({
  soorten,
}: {
  /** Alleen deze soorten tonen, zonder soortfilter (bv. ['turtle']). */
  soorten?: Soort[];
}): React.JSX.Element {
  const [concept, setConcept] = useState<string | null>(null);
  const [soort, setSoort] = useState<Soort | null>(null);

  const lijst = soorten ? activiteiten.filter((a) => soorten.includes(a.soort)) : activiteiten;
  const concepten = conceptenIn(lijst);
  const zichtbareSoorten = SOORTEN.filter((s) => lijst.some((a) => a.soort === s.id));
  const getoond = filter(lijst, concept, soort);
  const aantal = (id: string) => filter(lijst, id, soort).length;

  const groepen = GROEPEN.map((g) => ({
    ...g,
    items: getoond.filter((a) => g.soorten.includes(a.soort)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className={styles.kiezer}>
      <div className={styles.balk}>
        {zichtbareSoorten.length > 1 && (
          <fieldset className={styles.chips}>
            <legend className={styles.legenda}>Soort</legend>
            <div className={styles.chipRij}>
              <Chip actief={soort === null} onClick={() => setSoort(null)}>
                Alles
              </Chip>
              {zichtbareSoorten.map((s) => (
                <Chip
                  key={s.id}
                  actief={soort === s.id}
                  onClick={() => setSoort(soort === s.id ? null : s.id)}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </fieldset>
        )}
        <fieldset className={styles.chips}>
          <legend className={styles.legenda}>Wat wil je oefenen?</legend>
          <div className={styles.chipRij}>
            <Chip actief={concept === null} onClick={() => setConcept(null)}>
              Alles
            </Chip>
            {concepten.map((id) => (
              <Chip
                key={id}
                actief={concept === id}
                onClick={() => setConcept(concept === id ? null : id)}
              >
                {CONCEPTNAMEN[id]} <span className={styles.aantal}>{aantal(id)}</span>
              </Chip>
            ))}
          </div>
        </fieldset>
      </div>

      <p className={styles.telling} aria-live="polite">
        {concept === null
          ? `${getoond.length} activiteiten`
          : `${getoond.length} met ${CONCEPTNAMEN[concept]}`}
      </p>

      {getoond.length === 0 && (
        <p className={styles.leeg}>Hier is nog niets van deze soort met dit concept.</p>
      )}
      {groepen.map((g) => (
        <section key={g.titel} className={styles.groep}>
          {groepen.length > 1 || !soorten ? <h2 className={styles.groepTitel}>{g.titel}</h2> : null}
          {g.alsLijst ? (
            <div className={styles.lijst}>
              {g.items.map((a) => (
                <Rij key={a.id} activiteit={a} gekozen={concept} />
              ))}
            </div>
          ) : (
            <div className={styles.raster}>
              {g.items.map((a) => (
                <Kaart key={a.id} activiteit={a} gekozen={concept} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
