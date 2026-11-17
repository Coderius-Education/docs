import { storageKey } from '@coderius/shared/opslag';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { type Bouwsteen, GROEPEN } from './bouwstenen';
import styles from './styles.module.css';

type Props = {
  /** Een klik op een bouwsteen: toon zijn voorbeeld naast de code. */
  onKies: (bouwsteen: Bouwsteen) => void;
  /** De bouwsteen waarvan het voorbeeld nu open staat. */
  gekozen: string | null;
};

const GROEP_KEY = storageKey('robotica', 'webMicroEditor.bouwstenenGroep');

function bewaardeGroep(): string | null {
  try {
    const id = localStorage.getItem(GROEP_KEY);
    if (id === '') return null;
    return GROEPEN.some((g) => g.id === id) ? id : GROEPEN[0].id;
  } catch {
    return GROEPEN[0].id;
  }
}

/**
 * Het palet links van de code: de onderdelen van de robot en de stappen van
 * Python, per groep. Een klik toont het voorbeeld van de bouwsteen naast de
 * code (Voorbeeld.tsx); er komt niets in de code van de leerling. Eén groep
 * tegelijk open, zodat de lijst zonder schuiven in het paneel past; welke
 * groep open stond, blijft bewaard.
 *
 * Voor het toetsenbord is het palet één stop in de Tab-volgorde, met de
 * pijltjes erbinnen: Tab gaat van het palet door naar de code.
 */
export default function Palet({ onKies, gekozen }: Props): React.JSX.Element {
  const [open, setOpen] = useState<string | null>(bewaardeGroep);
  const [actief, setActief] = useState<string>(`groep:${GROEPEN[0].id}`);

  const wissel = (id: string) => {
    const nieuw = open === id ? null : id;
    setOpen(nieuw);
    setActief(`groep:${id}`);
    try {
      localStorage.setItem(GROEP_KEY, nieuw ?? '');
    } catch {
      // Zonder opslag opent het palet de volgende keer op de eerste groep.
    }
  };

  const item = (sleutel: string) => ({
    'data-palet-item': sleutel,
    tabIndex: actief === sleutel ? 0 : -1,
    onFocus: () => setActief(sleutel),
  });

  const metPijltjes = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const stap = { ArrowDown: 1, ArrowUp: -1, Home: 0, End: 0 }[e.key];
    if (stap === undefined) return;
    const items = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>('[data-palet-item]'),
    ).filter((el) => !el.closest('[hidden]'));
    const nu = items.indexOf(document.activeElement as HTMLElement);
    if (nu === -1) return;
    e.preventDefault();
    const doel =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? items.length - 1
          : (nu + stap + items.length) % items.length;
    items[doel].focus();
  };

  return (
    <div className={styles.palet} data-bouwstenen onKeyDown={metPijltjes}>
      {GROEPEN.map((groep) => {
        const isOpen = open === groep.id;
        const lijstId = `bouwstenen-${groep.id}`;
        return (
          <section key={groep.id} className={styles.paletGroep} data-groep={groep.id}>
            <button
              type="button"
              className={styles.paletKopKnop}
              aria-expanded={isOpen}
              aria-controls={lijstId}
              onClick={() => wissel(groep.id)}
              {...item(`groep:${groep.id}`)}
            >
              {isOpen ? (
                <ChevronDown aria-hidden="true" size={15} />
              ) : (
                <ChevronRight aria-hidden="true" size={15} />
              )}
              {groep.label}
            </button>
            <ul id={lijstId} className={styles.paletLijst} hidden={!isOpen}>
              {groep.bouwstenen.map((b) => (
                <li key={b.id} className={styles.steen}>
                  <button
                    type="button"
                    className={styles.steenKnop}
                    data-bouwsteen={b.id}
                    onClick={() => onKies(b)}
                    aria-pressed={gekozen === b.id}
                    {...item(`steen:${b.id}`)}
                  >
                    {b.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
