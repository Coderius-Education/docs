import { Children, type ReactElement, type ReactNode, isValidElement, useRef } from 'react';
import { fotoUrl } from '../onderdeelFoto';
import styles from './styles.module.css';

// De materiaallijst van een onderdeel: per ding een kaart met een kleine foto,
// zodat je herkent wat er op tafel moet liggen. Eerst stond er een genummerde
// lijst met daaronder elke foto op volle breedte (de LED 600 pixels hoog, de
// multiplexer 900), en zag je pas twee schermen later of je alles had.
//
//   <Onderdelenlijst>
//     <Onderdeel naam="LED-lampje" foto="led/led.png" alt="…">Met een lang en een kort pootje</Onderdeel>
//     <Onderdeel naam="Weerstand van 220 Ω" />
//   </Onderdelenlijst>
//
// `foto` is een pad onder docs/onderdelen/img/, zoals `foto` van een kaart in
// het overzicht. Een klik op de foto toont hem groot. Een onderdeel zonder foto
// (een jumperdraad, een weerstand) staat in één regel onder de kaarten.
// materiaal.test.ts eist dat elke foto bestaat en een alt-tekst heeft.

export type OnderdeelProps = {
  naam: string;
  foto?: string;
  alt?: string;
  aantal?: number;
  children?: ReactNode;
};

/** Hoort binnen <Onderdelenlijst>; die tekent hem. */
export function Onderdeel(_props: OnderdeelProps): null {
  return null;
}

function Kaart({ naam, foto, alt, aantal, children }: OnderdeelProps): ReactElement {
  const venster = useRef<HTMLDialogElement>(null);
  const src = fotoUrl(foto) as string;
  return (
    <li className={styles.kaart}>
      {/* Geen aria-label: dan las een schermlezer alleen dat label voor en niet
          de alt-tekst, en juist die noemt de pinnen. De naam van de knop is nu
          de alt-tekst met de verborgen zin erachter. */}
      <button type="button" className={styles.foto} onClick={() => venster.current?.showModal?.()}>
        <img src={src} alt={alt} loading="lazy" />
        <span className={styles.verborgen}>Toon de foto groot</span>
      </button>
      <span className={styles.tekst}>
        <span className={styles.naam}>
          {aantal && aantal > 1 ? <span className={styles.aantal}>{aantal}×</span> : null}
          {naam}
        </span>
        {children ? <span className={styles.uitleg}>{children}</span> : null}
      </span>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape sluit een dialog al; de klik op de achtergrond is een extra voor de muis */}
      <dialog
        ref={venster}
        className={styles.venster}
        aria-label={naam}
        onClick={(e) => {
          if (e.target === e.currentTarget) venster.current?.close();
        }}
      >
        <img src={src} alt={alt} loading="lazy" />
        <form method="dialog" className={styles.sluiten}>
          <button type="submit">Sluiten</button>
        </form>
      </dialog>
    </li>
  );
}

export function onderdelen(children: ReactNode): OnderdeelProps[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((kind) => kind.props as OnderdeelProps)
    .filter((p) => typeof p.naam === 'string');
}

export default function Onderdelenlijst({ children }: { children: ReactNode }): ReactElement {
  const alle = onderdelen(children);
  const metFoto = alle.filter((o) => o.foto);
  const zonderFoto = alle.filter((o) => !o.foto);
  return (
    <div className={styles.lijst}>
      <ul className={styles.raster}>
        {metFoto.map((o) => (
          <Kaart key={o.naam} {...o} />
        ))}
      </ul>
      {zonderFoto.length > 0 && (
        <p className={styles.verder}>
          <span className={styles.verderLabel}>Verder:</span>{' '}
          {zonderFoto.map((o, i) => (
            <span key={o.naam}>
              {i > 0 ? ', ' : ''}
              {o.aantal && o.aantal > 1 ? `${o.aantal}× ` : ''}
              {o.naam}
              {o.children ? <> ({o.children})</> : null}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
