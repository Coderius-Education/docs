import type React from 'react';
import { useState } from 'react';
import { HighlightedEditor } from '../HighlightedEditor';
import type { Opname, Stap } from '../PyodideProvider';
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

export default function Stapper({
  code,
  opname,
  onSluiten,
}: {
  code: string;
  opname: Opname;
  onSluiten: () => void;
}): React.JSX.Element {
  const [index, setIndex] = useState(0);

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

  const laatste = index >= totaal - 1;
  const foutHier = laatste && opname.fout;
  // Het laatste return-event van de buitenste scope is het einde van het
  // programma, niet een functie die iets teruggeeft.
  const klaar = laatste && stap.gebeurtenis === 'return' && stap.frames.length === 1;

  return (
    <div className={styles.stapper}>
      <div className={styles.balk}>
        <span className={styles.titel}>
          Stap {index + 1} van {totaal}
          {klaar ? ' — klaar' : ''}
        </span>
        <button type="button" className={styles.sluitKnop} onClick={onSluiten}>
          Sluiten
        </button>
      </div>

      <div className={styles.inhoud}>
        <div className={styles.codeKant}>
          <HighlightedEditor
            code={code}
            onChange={niksDoen}
            onKeyDown={niksDoen}
            disabled={false}
            readOnly
            highlightLine={stap.regel}
            minHeight={160}
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
        </div>
      </div>

      {foutHier && (
        <p className={styles.fout}>
          Hier ging het mis — {opname.fout?.soort}: {opname.fout?.bericht}
        </p>
      )}
      {opname.afgekapt && laatste && (
        <p className={styles.melding}>
          Alleen de eerste {totaal} stappen zijn opgenomen. Loopt je code eindeloos door?
        </p>
      )}

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
        />
        <button
          type="button"
          className={styles.stapKnop}
          onClick={() => setIndex((n) => Math.min(totaal - 1, n + 1))}
          disabled={laatste}
        >
          Volgende ▶
        </button>
      </div>
      <div className={styles.hint}>Tip: klik de schuifbalk aan en gebruik de pijltjestoetsen.</div>
    </div>
  );
}
