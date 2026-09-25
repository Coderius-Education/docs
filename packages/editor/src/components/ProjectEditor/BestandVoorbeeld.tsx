import { File as FileIcon } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { bestandsgrootte, isAfbeelding, leesbareGrootte } from '../../vfs/bestanden';
import styles from './styles.module.css';

interface BestandVoorbeeldProps {
  pad: string;
  inhoud: string;
}

// Een geüpload binair bestand (afbeelding, geluid, …) in plaats van de editor:
// een data:-URL als tekst in Monaco is een muur van letters waar de leerling
// niets aan heeft, en per ongeluk typen maakt het bestand kapot.
export default function BestandVoorbeeld({ pad, inhoud }: BestandVoorbeeldProps): ReactNode {
  const [maat, setMaat] = useState<{ b: number; h: number } | null>(null);
  const naam = pad.split('/').pop() ?? pad;
  const grootte = leesbareGrootte(bestandsgrootte(inhoud));

  return (
    <div className={styles.voorbeeld}>
      {isAfbeelding(pad) ? (
        <div className={styles.voorbeeldVlak}>
          <img
            src={inhoud}
            alt={naam}
            className={styles.voorbeeldBeeld}
            onLoad={(e) =>
              setMaat({ b: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
            }
            // Een klein plaatje (een sprite van 16 pixels, een icoon) zou als
            // stipje in het vlak staan. Dat vergroten we tot zo'n 200 pixels,
            // met scherpe pixels in plaats van een wazige vlek.
            style={
              maat && Math.max(maat.b, maat.h) < 100
                ? {
                    width: maat.b * Math.floor(200 / Math.max(maat.b, maat.h)),
                    imageRendering: 'pixelated',
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <div className={styles.voorbeeldLeeg}>
          <FileIcon aria-hidden="true" size={40} strokeWidth={1.4} />
          <p>
            Dit bestand kan de editor niet tonen. Het staat wel in je project: je programma kan het
            gebruiken, en het gaat mee als je het project downloadt.
          </p>
        </div>
      )}
      <p className={styles.voorbeeldInfo}>
        <span className={styles.voorbeeldNaam}>{naam}</span>
        <span>{maat ? `${maat.b} × ${maat.h} pixels, ${grootte}` : grootte}</span>
        <span>
          In je code: <code>{pad}</code>
        </span>
      </p>
    </div>
  );
}
