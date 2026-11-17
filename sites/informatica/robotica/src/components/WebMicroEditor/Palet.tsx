import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { type Bouwsteen, GROEPEN, SLEEP_TYPE } from './bouwstenen';
import { leesbaar } from './invoegen';
import styles from './styles.module.css';

type Props = {
  /** Een klik op een bouwsteen: zet hem op de regel van de cursor. */
  onKies: (bouwsteen: Bouwsteen) => void;
};

/**
 * Het palet links van de code: de onderdelen van de robot en de stappen van
 * Python, per groep. Een klik zet de bouwsteen op de regel van de cursor; je
 * kunt hem ook naar een regel slepen (de editor vangt dat op, zie index.tsx).
 * Eén groep tegelijk open, zodat de lijst zonder schuiven in het paneel past.
 */
export default function Palet({ onKies }: Props): React.JSX.Element {
  const { withBaseUrl } = useBaseUrlUtils();
  const [open, setOpen] = useState<string | null>(GROEPEN[0].id);

  return (
    <div className={styles.palet} data-bouwstenen>
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
              onClick={() => setOpen(isOpen ? null : groep.id)}
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
                    title={`Zet in je code:\n${leesbaar(b)}`}
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
