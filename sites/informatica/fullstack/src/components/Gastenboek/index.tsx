import clsx from 'clsx';
import type { ReactElement, ReactNode } from 'react';
import styles from './styles.module.css';

// Het gastenboek uit de basis, nagebouwd in HTML en CSS voor de startpagina's:
// wat je aan het eind hebt. Geen schermafbeelding, om dezelfde reden als bij
// DevtoolsPaneel: die veroudert en hoort bij één browser. De inhoud volgt de
// pagina's uit de lessen (gastenboek_form.html na Inloggen, met een
// wachtwoordveld, en berichten.html na Eén item tonen). Het is een plaatje: de knoppen en velden zijn geen echte knoppen en
// velden, daarom staat de inhoud onder aria-hidden en zegt het onderschrift
// wat er te zien is.
//
// `beschermd` is het gastenboek na de route Veiligheid: wat een bezoeker als
// HTML typt staat er als tekst, je ziet alleen bij je eigen bericht een
// verwijderknop, en een script dat toch een ander zijn bericht wist, krijgt een
// 403. Namen en uitvoer komen uit Wie mag wat (toegang/zwakheid en controle).

function Venster({
  adres,
  children,
  terminal = false,
}: {
  adres: string;
  children: ReactNode;
  terminal?: boolean;
}): ReactElement {
  return (
    <div className={styles.venster}>
      <div className={styles.balk}>
        <span className={styles.stippen}>
          <span />
          <span />
          <span />
        </span>
        <span className={styles.adres}>{adres}</span>
      </div>
      {terminal ? children : <div className={styles.pagina}>{children}</div>}
    </div>
  );
}

const Knop = ({ children }: { children: ReactNode }) => (
  <span className={styles.knop}>{children}</span>
);

function Formulier(): ReactElement {
  return (
    <Venster adres="127.0.0.1:8000/gastenboek">
      <div className={styles.kop}>Gastenboek</div>
      <div className={styles.formulier}>
        <span className={styles.veld}>Je naam</span>
        <span className={styles.veld}>Je wachtwoord</span>
        <span className={styles.veld}>Je bericht</span>
        <Knop>Verstuur</Knop>
      </div>
      <span className={styles.link}>Nog geen account?</span>
    </Venster>
  );
}

function Berichten({ beschermd }: { beschermd: boolean }): ReactElement {
  const berichten = beschermd
    ? [
        { naam: 'Sara', tekst: 'Hoi allemaal', eigen: true },
        { naam: 'Alex', tekst: '<b>Leuk</b> gastenboek', eigen: false },
      ]
    : [
        { naam: 'Sara', tekst: 'Hoi allemaal', eigen: true },
        { naam: 'Alex', tekst: 'Leuk gastenboek', eigen: true },
      ];
  return (
    <Venster adres="127.0.0.1:8000/berichten">
      <div className={styles.kop}>Gastenboek</div>
      <ul className={styles.lijst}>
        {berichten.map((b) => (
          <li key={b.naam}>
            <span>
              <span className={styles.link}>{b.naam}</span>:{' '}
              <span className={clsx(b.tekst.startsWith('<') && styles.code)}>{b.tekst}</span>
            </span>
            {b.eigen && <Knop>Verwijderen</Knop>}
          </li>
        ))}
      </ul>
      <span className={styles.link}>Nieuw bericht</span>
    </Venster>
  );
}

function Script(): ReactElement {
  return (
    <Venster adres="Terminal" terminal>
      <pre className={styles.terminal}>
        {'> python test_verwijderen.py\nAlex verwijdert het bericht van Sara: '}
        <span className={styles.fout}>403</span>
        {"\nNog in het gastenboek: ['Sara', 'Alex']"}
      </pre>
    </Venster>
  );
}

export default function Gastenboek({ beschermd = false }: { beschermd?: boolean }): ReactElement {
  return (
    <figure className={styles.figuur}>
      <div className={styles.vensters} aria-hidden="true">
        {beschermd ? <Script /> : <Formulier />}
        <Berichten beschermd={beschermd} />
      </div>
      <figcaption className={styles.onderschrift}>
        {beschermd
          ? 'In de terminal probeert Alex met een script het bericht van Sara te verwijderen, en je server antwoordt met 403. In het gastenboek staat de HTML die Alex typte als gewone tekst, en heeft alleen je eigen bericht een verwijderknop.'
          : 'Het formulier op /gastenboek, waar je met de naam en het wachtwoord van je account een bericht schrijft, en alle berichten op /berichten. Een klik op een naam opent de losse pagina van dat bericht, en Verwijderen haalt het weg. Het ziet er kaal uit, met jouw stylesheet erbij wordt het je eigen site.'}
      </figcaption>
    </figure>
  );
}
