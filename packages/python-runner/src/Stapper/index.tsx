import type React from 'react';
import { useState } from 'react';
import { HighlightedEditor } from '../HighlightedEditor';
import type { Opname, Stap } from '../PyodideProvider';
import Tekening from '../Tekening';
import { afkapMelding } from './melding';
import styles from './styles.module.css';

// Bladert door een opname die tracePython() heeft gemaakt: links de code met de
// regel die op dat moment aan de beurt is, rechts de variabelen per scope, en
// eronder de uitvoer tot en met die stap.
//
// De schuifbalk is bewust een <input type="range">: die reageert vanzelf op de
// pijltjestoetsen, dus stap-voor-stap met het toetsenbord kost geen eigen
// keydown-afhandeling en blijft toegankelijk.

function niksDoen() {
  /* De editor staat op readOnly; tijdens het stappen valt er niets te typen. */
}

function frameTitel(stap: Stap, frameIndex: number): string {
  const frame = stap.frames[frameIndex];
  if (frame.naam !== 'globaal') return frame.naam;
  return stap.frames.length > 1 ? 'globaal' : 'jouw variabelen';
}

/** Hoe hoog de rij knoppen is: in een tabblad het enige dat rond de code staat. */
const ROND_DE_CODE = 46;

/** Lager wordt het vak met de code niet: vier regels. Met de rij knoppen
 *  past dat in het laagste veld (180 pixels, waarvan 40 voor de werkbalk). */
const MIN_CODE = 92;

const TIP = 'Tip: klik de schuifbalk aan en gebruik de pijltjestoetsen.';

export default function Stapper({
  code,
  opname,
  onSluiten,
  hoogte,
}: {
  code: string;
  opname: Opname;
  onSluiten: () => void;
  /** In een les-tabblad: zo hoog is de stapper, en niet hoger. De code en de
   *  variabelen schuiven dan in hun eigen vak, en de regel die aan de beurt
   *  is blijft in beeld. Zonder hoogte is alles voluit te zien. */
  hoogte?: number;
}): React.JSX.Element {
  const [index, setIndex] = useState(0);
  // De hoogte van het vak met de code, of undefined buiten een tabblad.
  const passend = hoogte === undefined ? undefined : Math.max(MIN_CODE, hoogte - ROND_DE_CODE);

  const totaal = opname.stappen.length;
  const stap = opname.stappen[Math.min(index, totaal - 1)];

  if (totaal === 0) {
    return (
      <div className={styles.stapper}>
        <div className={styles.balk}>
          <span className={styles.titel}>Stap voor stap</span>
          <button type="button" className={styles.sluitKnop} onClick={onSluiten}>
            Sluiten
          </button>
        </div>
        <p className={styles.leeg}>
          {opname.fout
            ? `${opname.fout.soort} op regel ${opname.fout.regel}: ${opname.fout.bericht}`
            : 'Er viel niets op te nemen.'}
        </p>
      </div>
    );
  }

  const naast = passend !== undefined && Boolean(opname.tekening);
  const laatste = index >= totaal - 1;
  const foutHier = laatste && opname.fout;
  // Het laatste return-event van de buitenste scope is het einde van het
  // programma, niet een functie die iets teruggeeft.
  const klaar = laatste && stap.gebeurtenis === 'return' && stap.frames.length === 1;

  const compact = passend !== undefined;
  const teller = (
    <>
      <span className={styles.titel}>
        Stap {index + 1} van {totaal}
        {klaar ? ' — klaar' : ''}
      </span>
      <button type="button" className={styles.sluitKnop} onClick={onSluiten}>
        Sluiten
      </button>
    </>
  );
  // In een vaste hoogte staan de meldingen bij de variabelen, in het vak dat
  // schuift: eronder maakten ze de stapper op de laatste stap hoger.
  const meldingen = (
    <>
      {foutHier && (
        <p className={styles.fout}>
          Hier ging het mis — {opname.fout?.soort}: {opname.fout?.bericht}
        </p>
      )}
      {opname.afgekapt && laatste && <p className={styles.melding}>{afkapMelding(totaal)}</p>}
    </>
  );

  return (
    <div
      className={`${styles.stapper}${compact ? ` ${styles.passend}` : ''}`}
      style={
        passend === undefined
          ? undefined
          : ({ '--stap-hoogte': `${passend}px` } as React.CSSProperties)
      }
    >
      {/* In een tabblad staan de teller en Sluiten in de rij knoppen: met een
          eigen balk en een regel met de tip was de stapper bij een laag veld
          tot 75 pixels hoger dan het veld. */}
      {!compact && <div className={styles.balk}>{teller}</div>}

      <div className={`${styles.inhoud}${naast ? ` ${styles.metTekening}` : ''}`}>
        <div className={styles.codeKant}>
          <HighlightedEditor
            code={code}
            onChange={niksDoen}
            onKeyDown={niksDoen}
            disabled={false}
            readOnly
            highlightLine={stap.regel}
            afbreken={false}
            minHeight={passend ? Math.min(160, passend) : 160}
            maxHeight={passend}
          />
        </div>

        <div className={styles.zijkant}>
          {stap.frames.map((frame, i) => (
            <div key={frame.naam} className={styles.scope}>
              <div className={styles.scopeNaam}>{frameTitel(stap, i)}</div>
              {frame.variabelen.length === 0 ? (
                <p className={styles.geenVariabelen}>nog geen variabelen</p>
              ) : (
                <table className={styles.tabel}>
                  <tbody>
                    {frame.variabelen.map((v) => (
                      <tr key={v.naam}>
                        <th scope="row">{v.naam}</th>
                        <td className={styles.soort}>{v.soort}</td>
                        <td className={styles.waarde}>{v.waarde}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}

          <div className={styles.scope}>
            <div className={styles.scopeNaam}>Uitvoer</div>
            <pre className={styles.uitvoer}>
              {opname.uitvoer.slice(0, stap.uitvoerTot) || 'nog niets geprint'}
            </pre>
          </div>
          {compact && meldingen}
        </div>

        {/* In een vaste hoogte staat de tekening naast de code en de
            variabelen, in een eigen kolom, niet eronder. */}
        {naast && opname.tekening && (
          <div className={styles.tekenKant}>
            <Tekening tekening={opname.tekening} tot={stap.tekenTot ?? 0} />
          </div>
        )}
      </div>

      {!naast && opname.tekening && (
        <Tekening tekening={opname.tekening} tot={stap.tekenTot ?? 0} />
      )}

      {!compact && meldingen}

      <div className={styles.knoppen}>
        <button
          type="button"
          className={styles.stapKnop}
          onClick={() => setIndex((n) => Math.max(0, n - 1))}
          disabled={index === 0}
        >
          ◀ Vorige
        </button>
        <input
          type="range"
          className={styles.schuif}
          min={0}
          max={totaal - 1}
          value={Math.min(index, totaal - 1)}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-label="Stap kiezen"
          title={compact ? TIP : undefined}
        />
        <button
          type="button"
          className={styles.stapKnop}
          onClick={() => setIndex((n) => Math.min(totaal - 1, n + 1))}
          disabled={laatste}
        >
          Volgende ▶
        </button>
        {compact && teller}
      </div>
      {!compact && <div className={styles.hint}>{TIP}</div>}
    </div>
  );
}
