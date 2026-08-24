import { Children, type ReactNode, isValidElement, useCallback, useRef, useState } from 'react';
import styles from './styles.module.css';

// De lessen leggen code regel voor regel uit. Dat stond eerst als een rij
// gewone alinea's die elk met een stuk vetgedrukte code begonnen: correct,
// maar vlak — je oog glijdt eroverheen en de koppeling met de code erboven
// moet je zelf leggen.
//
// Dit component maakt die koppeling zichtbaar. Elke uitleg krijgt het
// regelnummer uit het codeblok ernaast, en wie een uitleg aanwijst ziet de
// bijbehorende regel in de code oplichten.
//
// Het codeblok blijft een gewoon markdown-codeblok als kind. Dat is bewust:
// zo houdt het zijn syntax-highlighting, zijn "Open in de editor"-link én
// wordt het gewoon meegenomen door de compileercheck in CI. Een variant met
// de code in een prop zou alle drie stilletjes verliezen.

type RegelProps = {
  /** Het regelnummer in het codeblok hierboven; 1-gebaseerd, net als daar. */
  n: number;
  /** Meerdere regels tegelijk uitleggen: `n={3} tot={5}`. */
  tot?: number;
  children?: ReactNode;
};

/** Eén uitleg, hoort bij regel `n` van het codeblok in de omliggende CodeUitleg. */
export function Regel({ children }: RegelProps): ReactNode {
  return <>{children}</>;
}

function nummerLabel(n: number, tot?: number): string {
  return tot && tot > n ? `${n}-${tot}` : String(n);
}

export default function CodeUitleg({ children }: { children?: ReactNode }): ReactNode {
  const codeRef = useRef<HTMLDivElement>(null);
  const [actief, setActief] = useState<number | null>(null);

  const kinderen = Children.toArray(children);
  const regels = kinderen.filter(
    (kind): kind is React.ReactElement<RegelProps> => isValidElement(kind) && kind.type === Regel,
  );
  const codeblok = kinderen.filter((kind) => !(isValidElement(kind) && kind.type === Regel));

  // Prism rendert elke coderegel als .token-line. Vinden we die niet — een
  // andere theme-versie, of een blok zonder highlighting — dan gebeurt er
  // simpelweg niets extra's; de uitleg blijft gewoon leesbaar.
  const markeer = useCallback((van: number | null, tot?: number) => {
    setActief(van);
    const lijnen = codeRef.current?.querySelectorAll<HTMLElement>('.token-line');
    if (!lijnen) return;
    const laatste = tot ?? van;
    lijnen.forEach((lijn, i) => {
      const nummer = i + 1;
      const aan = van !== null && laatste !== null && nummer >= van && nummer <= laatste;
      lijn.classList.toggle(styles.opgelicht, aan);
    });
  }, []);

  return (
    <div className={styles.blok}>
      <div className={styles.code} ref={codeRef}>
        {codeblok}
      </div>

      {regels.length > 0 && (
        <ol className={styles.uitleg}>
          {regels.map((regel) => {
            const { n, tot } = regel.props;
            return (
              <li
                key={`${n}-${tot ?? n}`}
                className={actief === n ? styles.actief : undefined}
                onMouseEnter={() => markeer(n, tot)}
                onMouseLeave={() => markeer(null)}
                onFocus={() => markeer(n, tot)}
                onBlur={() => markeer(null)}
              >
                <span className={styles.nummer} aria-hidden="true">
                  {nummerLabel(n, tot)}
                </span>
                <div className={styles.tekst}>
                  <span className={styles.srOnly}>{`Regel ${nummerLabel(n, tot)}: `}</span>
                  {regel}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
