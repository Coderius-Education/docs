import { storageKey } from '@coderius/shared/opslag';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { type Bouwsteen, GROEPEN, SLEEP_TYPE } from './bouwstenen';
import { bovenaan, leesbaar } from './invoegen';
import styles from './styles.module.css';

type Props = {
  /** Een klik op een bouwsteen: zet hem op de regel van de cursor. */
  onKies: (bouwsteen: Bouwsteen) => void;
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

/** Wat een bouwsteen in de code zet, voor de tooltip. */
function uitleg(b: Bouwsteen): string {
  const boven = bovenaan(b);
  return `Zet in je code:\n${leesbaar(b)}${boven ? `\n\nBovenaan, één keer:\n${boven}` : ''}`;
}

/**
 * Het palet links van de code: de onderdelen van de robot en de stappen van
 * Python, per groep. Een klik zet de bouwsteen op de regel van de cursor; je
 * kunt hem ook naar een regel slepen (de editor vangt dat op, zie
 * paletEditor.ts). Eén groep tegelijk open, zodat de lijst zonder schuiven in
 * het paneel past; welke groep open stond, blijft bewaard.
 *
 * Voor het toetsenbord is het palet één stop in de Tab-volgorde, met de
 * pijltjes erbinnen. Na een bouwsteen staat de cursor in de code; Shift+Tab
 * brengt je terug naar de bouwsteen van net, niet naar het eind van de lijst.
 */
export default function Palet({ onKies }: Props): React.JSX.Element {
  const { withBaseUrl } = useBaseUrlUtils();
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
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(SLEEP_TYPE, b.id);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => onKies(b)}
                    title={uitleg(b)}
                    {...item(`steen:${b.id}`)}
                  >
                    {b.label}
                  </button>
                  {b.les && (
                    <a
                      className={styles.steenLes}
                      href={withBaseUrl(`/docs/onderdelen/${b.les}`)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Uitleg bij ${b.label} (opent in een nieuw tabblad)`}
                      title="Uitleg en aansluitschema"
                      {...item(`les:${b.id}`)}
                    >
                      <BookOpen aria-hidden="true" size={14} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
