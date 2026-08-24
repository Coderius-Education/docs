import {
  Children,
  type ReactNode,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
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

interface Aanwijzing {
  n: number;
  tot?: number;
}

export default function CodeUitleg({ children }: { children?: ReactNode }): ReactNode {
  const codeRef = useRef<HTMLDivElement>(null);
  // Twee bronnen voor dezelfde markering. Zweven wint zolang het duurt, zodat
  // de muis zich precies gedraagt zoals je verwacht; wie met het toetsenbord
  // werkt zet er met Enter één vast en houdt hem.
  const [zweef, setZweef] = useState<Aanwijzing | null>(null);
  const [vast, setVast] = useState<Aanwijzing | null>(null);
  const actief = zweef ?? vast;

  const kinderen = Children.toArray(children);
  const regels = kinderen.filter(
    (kind): kind is React.ReactElement<RegelProps> => isValidElement(kind) && kind.type === Regel,
  );
  const codeblok = kinderen.filter((kind) => !(isValidElement(kind) && kind.type === Regel));

  // Prism rendert elke coderegel als .token-line. Vinden we die niet — een
  // andere theme-versie, of een blok zonder highlighting — dan gebeurt er
  // simpelweg niets extra's; de uitleg blijft gewoon leesbaar.
  useEffect(() => {
    const lijnen = codeRef.current?.querySelectorAll<HTMLElement>('.token-line');
    if (!lijnen) return;
    lijnen.forEach((lijn, i) => {
      const nummer = i + 1;
      const aan = actief !== null && nummer >= actief.n && nummer <= (actief.tot ?? actief.n);
      lijn.classList.toggle(styles.opgelicht, aan);
    });
  }, [actief]);

  const zetVast = useCallback((n: number, tot?: number) => {
    setVast((huidig) => (huidig?.n === n ? null : { n, tot }));
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
            const label = nummerLabel(n, tot);
            return (
              <li
                key={`${n}-${tot ?? n}`}
                className={actief?.n === n ? styles.actief : undefined}
                onMouseEnter={() => setZweef({ n, tot })}
                onMouseLeave={() => setZweef(null)}
              >
                {/* Het nummer is een echte knop en niet een <li> met tabIndex:
                    de uitleg eronder bestaat uit alinea's, en die horen niet in
                    een knop. Zo krijgt wie tabt wél de bijbehorende regel te
                    zien, met een gewone focusring erbij. */}
                <button
                  type="button"
                  className={styles.nummer}
                  aria-label={`Licht regel ${label} op in de code`}
                  aria-pressed={vast?.n === n}
                  onClick={() => zetVast(n, tot)}
                  onFocus={() => setZweef({ n, tot })}
                  onBlur={() => setZweef(null)}
                >
                  <span aria-hidden="true">{label}</span>
                </button>
                <div className={styles.tekst}>
                  <span className={styles.srOnly}>{`Regel ${label}: `}</span>
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
