import { python } from '@codemirror/lang-python';
import { Decoration, EditorView } from '@codemirror/view';
import { routeUrl } from '@coderius/shared/sites';
import { useBaseUrlUtils } from '@docusaurus/useBaseUrl';
import CodeMirror from '@uiw/react-codemirror';
import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { type Bouwsteen, type Verwijzing, kernRegels } from './bouwstenen';
import styles from './styles.module.css';

type Props = {
  bouwsteen: Bouwsteen;
  donker: boolean;
  onSluit: () => void;
};

/** Waar een link heen gaat, als woord voor de link. */
export function bronVan(link: Verwijzing): string {
  if (link.site === 'python') return 'Python-cursus';
  if (link.naar.startsWith('/lego_auto/')) return 'Lego-auto';
  if (link.naar.startsWith('/docs/onderdelen/')) return 'Onderdelen';
  return 'Robotica';
}

/** Tekst met `code` tussen backticks. */
function MetCode({ tekst }: { tekst: string }): React.JSX.Element {
  const delen = tekst.split('`');
  let positie = 0;
  return (
    <>
      {delen.map((deel, i) => {
        const key = positie;
        positie += deel.length + 1;
        return i % 2 === 1 ? <code key={key}>{deel}</code> : deel;
      })}
    </>
  );
}

/**
 * Het voorbeeld van een bouwsteen, naast de code van de leerling: een
 * programma dat op het bord draait, met de regels waar het om gaat
 * gemarkeerd, een zin uitleg en links naar de lessen.
 *
 * Er is bewust geen knop die de code overzet: de leerling typt zelf, en
 * neemt alleen over wat hij nodig heeft. De code is wel te selecteren.
 */
export default function Voorbeeld({ bouwsteen, donker, onSluit }: Props): React.JSX.Element {
  const { withBaseUrl } = useBaseUrlUtils();
  const vak = useRef<HTMLElement | null>(null);

  // Op een telefoon staat het voorbeeld onder de code: breng het in beeld.
  // biome-ignore lint/correctness/useExhaustiveDependencies: bij elke andere bouwsteen opnieuw.
  useEffect(() => {
    vak.current?.scrollIntoView?.({ block: 'nearest' });
  }, [bouwsteen.id]);

  const uitbreidingen = useMemo(() => {
    const kern = new Set(kernRegels(bouwsteen));
    return [
      python(),
      // Past een regel niet (op een telefoon), dan loopt hij door op de
      // volgende regel, ingesprongen: achter de rand zag je de naam niet die
      // je importeert.
      EditorView.lineWrapping,
      EditorView.decorations.compute(['doc'], (state) => {
        const regels = [];
        for (let n = 1; n <= state.doc.lines; n++)
          if (kern.has(n))
            regels.push(Decoration.line({ class: 'cm-kern' }).range(state.doc.line(n).from));
        return Decoration.set(regels);
      }),
    ];
  }, [bouwsteen]);

  return (
    <article
      ref={vak}
      className={styles.voorbeeld}
      aria-label={`Voorbeeld: ${bouwsteen.label}`}
      data-voorbeeld={bouwsteen.id}
    >
      <div className={styles.voorbeeldKop}>
        <span>{bouwsteen.label}</span>
        <button
          type="button"
          className={styles.fileDelete}
          onClick={onSluit}
          aria-label="Sluit het voorbeeld"
          title="Sluit het voorbeeld"
        >
          ✕
        </button>
      </div>
      <div className={styles.voorbeeldCode}>
        <CodeMirror
          value={bouwsteen.voorbeeld.replace(/\n$/, '')}
          extensions={uitbreidingen}
          theme={donker ? 'dark' : 'light'}
          editable={false}
          readOnly
          basicSetup={{
            // Zonder regelnummers: die kostten de breedte van vier tekens, en
            // dan paste de langste import niet meer op één regel.
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
          }}
        />
      </div>
      <p className={styles.voorbeeldUitleg}>
        <MetCode tekst={bouwsteen.uitleg} />
      </p>
      <div className={styles.voorbeeldMeer}>Meer uitleg</div>
      <ul className={styles.voorbeeldLinks}>
        {bouwsteen.links.map((link) => (
          <li key={`${link.site ?? ''}${link.naar}`}>
            <span className={styles.voorbeeldBron}>{bronVan(link)}</span>
            {/* Een nieuw tabblad: de editor met de code blijft open staan. */}
            <a
              href={link.site ? routeUrl(link.site, link.naar) : withBaseUrl(link.naar)}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
