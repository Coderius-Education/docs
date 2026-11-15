import type { ReactNode } from 'react';
import styles from './hulp.module.css';
import type { Hulp } from './paneel';

export { hulpBreedte } from './paneel';

// De tip en het antwoord van een opdracht in het oefenveld (useLesHulp): de
// knoppen die kiezen wat de leerling naast zijn code ziet, en het vak waar
// de tip of het antwoord in staat. Elk oefenveld gebruikt dezelfde twee
// (de CodeExercise van python-runner, de PyRunner van algoritmes, de
// CodeEditor van web), zodat de hulp overal op dezelfde plek staat en
// hetzelfde heet.

/** Wat er naast de code staat: de uitvoer van het veld, de tip of het antwoord. */
export type Weergave = 'uitvoer' | 'tip' | 'antwoord';

const hoofdletter = (woord: string) => woord.charAt(0).toUpperCase() + woord.slice(1);

/** Het attribuut op het vak van een tip of antwoord, met de soort als waarde. */
export const LES_HULP = 'data-les-hulp';

/** Het attribuut op de rij knoppen. */
export const LES_HULP_KEUZE = 'data-les-hulp-keuze';

/**
 * De knoppen boven het vak: de uitvoer van het veld (`eerste`: Uitvoer, of
 * Voorbeeld bij web), de tip en het antwoord. Het antwoord heet zoals de les
 * het noemt: Oplossing of Antwoord.
 */
export function HulpKeuze({
  hulp,
  weergave,
  kies,
  eerste = 'Uitvoer',
}: {
  hulp: Hulp;
  weergave: Weergave;
  kies: (weergave: Weergave) => void;
  eerste?: string;
}): ReactNode {
  const namen: Record<Weergave, string> = {
    uitvoer: eerste,
    tip: 'Tip',
    antwoord: hoofdletter(hulp.naam ?? 'antwoord'),
  };
  return (
    <fieldset className={styles.keuze} aria-label="Naast je code" {...{ [LES_HULP_KEUZE]: '' }}>
      {(['uitvoer', 'tip', 'antwoord'] as const)
        .filter((w) => w === 'uitvoer' || hulp[w])
        .map((w) => (
          <button
            key={w}
            type="button"
            className={styles.knop}
            aria-pressed={weergave === w}
            onClick={() => kies(w)}
          >
            {namen[w]}
          </button>
        ))}
    </fieldset>
  );
}

/**
 * Het vak met de tip of het antwoord. Het blijft in de pagina staan als het
 * dicht is: een link erin staat in de HTML van de build, en wat erin draait
 * (de uitvoer van de oplossing) blijft bewaard.
 */
export function HulpVak({
  soort,
  open,
  children,
}: {
  soort: 'tip' | 'antwoord';
  open: boolean;
  children?: ReactNode;
}): ReactNode {
  return (
    <div className={styles.vak} hidden={!open} {...{ [LES_HULP]: soort }}>
      {children}
    </div>
  );
}
