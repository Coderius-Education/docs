import SiteLink from '@coderius/shared/components/SiteLink';
import { SITES_BY_ID, normalizeUrl } from '@coderius/shared/sites';
import Link from '@docusaurus/Link';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
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
  telling,
  vanafLes,
  zichtbareConcepten,
} from '../../data/projecten';
import styles from './styles.module.css';

// De projecten per soort, elk in een eigen tabblad: zo ziet een leerling
// meteen wat er is (de tabbladen met hun aantal) en hoeft hij niet langs
// dertig activiteiten te scrollen. Binnen een tabblad kiest hij een concept
// dat hij wil oefenen; de chips tonen alleen de concepten van dat tabblad.
// De turtle-projecten zijn een lijn die je van boven naar beneden doet, dus
// die staan genummerd. Tabs rendert alle panelen in de HTML van de build;
// het tabblad staat in de URL (?soort=turtle).

type Vorm = 'kaarten' | 'lijn' | 'lijst';

const GROEPEN: { id: string; titel: string; soorten: Soort[]; vorm: Vorm }[] = [
  {
    id: 'projecten',
    titel: 'Projecten',
    soorten: ['project', 'puzzel', 'spel'],
    vorm: 'kaarten',
  },
  { id: 'turtle', titel: 'Turtle', soorten: ['turtle'], vorm: 'lijn' },
  { id: 'algoritmes', titel: 'Algoritmes', soorten: ['algoritme'], vorm: 'lijst' },
];

const SOORT_LABEL = Object.fromEntries(SOORTEN.map((s) => [s.id, s.label])) as Record<
  Soort,
  string
>;

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

function Vanaf({ activiteit }: { activiteit: Activiteit }): React.JSX.Element {
  const les = vanafLes(activiteit);
  return <span title={`Vanaf les ${les.label}`}>vanaf les {les.id.replace(/^0/, '')}</span>;
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
        <span className={styles.vanaf}>
          {activiteit.stappen !== undefined ? `${activiteit.stappen} stappen · ` : ''}
          <Vanaf activiteit={activiteit} />
        </span>
      </span>
    </KaartLink>
  );
}

// Eén rij per activiteit: voor de algoritmes, en genummerd voor de lijn van
// de turtle-projecten.
function Rij({
  activiteit,
  gekozen,
  nummer,
}: {
  activiteit: Activiteit;
  gekozen: string | null;
  nummer?: number;
}): React.JSX.Element {
  const extern = !('to' in activiteit.link) || 'site' in activiteit.link;
  return (
    <KaartLink
      link={activiteit.link}
      className={`${styles.rij} ${nummer !== undefined ? styles.rijGenummerd : ''}`}
    >
      {nummer !== undefined && <span className={styles.nummer}>{nummer}</span>}
      <span className={styles.rijTitel}>
        {activiteit.titel}
        {extern ? ' ↗' : ''}
      </span>
      <span className={styles.rijWat}>{activiteit.wat}</span>
      <Concepten activiteit={activiteit} gekozen={gekozen} />
      <span className={styles.vanaf}>
        <Vanaf activiteit={activiteit} />
      </span>
    </KaartLink>
  );
}

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

function Groep({
  vorm,
  items,
  concept,
  setConcept,
}: {
  vorm: Vorm;
  items: Activiteit[];
  concept: string | null;
  setConcept: (c: string | null) => void;
}): React.JSX.Element {
  const getoond = filter(items, concept, null);
  const aantal = (id: string) => filter(items, id, null).length;
  // Nummers horen bij de plek in de lijn, ook als een concept er een paar
  // wegfiltert: project 9 blijft 9.
  const nummer = new Map(filter(items, null, null).map((a, i) => [a.id, i + 1]));

  return (
    <>
      <fieldset className={styles.chips}>
        <legend className={styles.onzichtbaar}>Wat wil je oefenen?</legend>
        <div className={styles.chipRij}>
          <span className={styles.legenda} aria-hidden="true">
            Oefen:
          </span>
          <Chip actief={concept === null} onClick={() => setConcept(null)}>
            Alles
          </Chip>
          {zichtbareConcepten(conceptenIn(items), aantal, concept).map((id) => (
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

      {/* Het tabblad toont het aantal al; voorlezen doet deze regel. */}
      <p className={styles.onzichtbaar} aria-live="polite">
        {telling(getoond.length, concept)}
      </p>

      {getoond.length === 0 && <p className={styles.leeg}>Hier oefen je dit concept niet.</p>}
      {vorm === 'kaarten' && (
        <div className={styles.raster}>
          {getoond.map((a) => (
            <Kaart key={a.id} activiteit={a} gekozen={concept} />
          ))}
        </div>
      )}
      {vorm !== 'kaarten' && getoond.length > 0 && (
        <div className={styles.lijst}>
          {getoond.map((a) => (
            <Rij
              key={a.id}
              activiteit={a}
              gekozen={concept}
              nummer={vorm === 'lijn' ? nummer.get(a.id) : undefined}
            />
          ))}
        </div>
      )}
      {vorm === 'lijst' && (
        <p className={styles.onder}>
          Hoe de algoritmes op de lessen voortbouwen, zie je op de{' '}
          <SiteLink site="algorithms" to="/conceptenkaart">
            conceptenkaart
          </SiteLink>
          .
        </p>
      )}
    </>
  );
}

export default function ProjectKiezer({
  soorten,
}: {
  /** Alleen deze soorten tonen, zonder tabbladen (bv. ['turtle']). */
  soorten?: Soort[];
}): React.JSX.Element {
  const [concept, setConcept] = useState<string | null>(null);

  if (soorten) {
    const groep = GROEPEN.find((g) => g.soorten.every((s) => soorten.includes(s)));
    return (
      <div className={styles.kiezer}>
        <Groep
          vorm={groep?.vorm ?? 'kaarten'}
          items={activiteiten.filter((a) => soorten.includes(a.soort))}
          concept={concept}
          setConcept={setConcept}
        />
      </div>
    );
  }

  const perGroep = GROEPEN.map((g) => ({
    ...g,
    items: activiteiten.filter((a) => g.soorten.includes(a.soort)),
  }));

  return (
    <div className={styles.kiezer}>
      <Tabs queryString="soort" defaultValue={GROEPEN[0].id} className={styles.tabs}>
        {perGroep.map((g) => (
          <TabItem
            key={g.id}
            value={g.id}
            label={`${g.titel} (${filter(g.items, concept, null).length})`}
          >
            <Groep vorm={g.vorm} items={g.items} concept={concept} setConcept={setConcept} />
          </TabItem>
        ))}
      </Tabs>
    </div>
  );
}
