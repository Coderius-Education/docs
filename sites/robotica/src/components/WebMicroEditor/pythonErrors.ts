// Herkent MicroPython-tracebacks in de REPL-uitvoer en vertaalt ze naar
// leerlingtaal. De les-sites werken fout-gestuurd ("Er gaat iets mis"); de
// editor hoort een traceback dus niet als ruis te tonen maar als leermoment:
// rood in de REPL, een banner met uitleg, en de regel gemarkeerd in de editor.

export type PythonFout = {
  /** bv. 'NameError' */
  type: string;
  /** de tekst achter de dubbele punt op de laatste regel, kan leeg zijn */
  melding: string;
  /** regelnummer in de code van de leerling (main.py of <stdin>), of null */
  regel: number | null;
  /** waar de eigen code draaide: main.py, de REPL-regel, of onbekend */
  bron: 'main.py' | '<stdin>' | null;
  /** leerlingvriendelijke uitleg bij dit fouttype */
  uitleg: string;
};

const FRAME_RE = /^\s+File "([^"]+)", line (\d+)/;
const FOUT_RE = /^([A-Za-z_][A-Za-z0-9_.]*)(?::\s?(.*))?$/;

const UITLEG: Array<{ type: RegExp; uitleg: string }> = [
  {
    type: /^NameError$/,
    uitleg:
      'Python kent deze naam niet. Meestal een typefout: controleer of de naam precies zo geschreven is als op de plek waar je hem maakte.',
  },
  {
    type: /^SyntaxError$/,
    uitleg:
      'Deze regel is geen geldige Python. Kijk naar vergeten haakjes of quotes, en of er een dubbele punt aan het einde van je if- of while-regel staat.',
  },
  {
    type: /^IndentationError$/,
    uitleg:
      'De inspringing klopt niet. Alles wat bij een loop of if hoort, springt één tab in — en meng geen tabs met spaties.',
  },
  {
    type: /^(ImportError|ModuleNotFoundError)$/,
    uitleg:
      'Python kan deze module niet vinden. Gebruik je iets uit de Leaphy-library, installeer die dan eerst via Board instellen.',
  },
  {
    type: /^TypeError$/,
    uitleg:
      'Je gebruikt een waarde op een manier die niet kan, bijvoorbeeld tekst en een getal aan elkaar plakken. Zet een getal eerst om met str().',
  },
  {
    type: /^AttributeError$/,
    uitleg:
      'Dit object heeft geen methode of eigenschap met deze naam. Controleer de spelling, en of je het juiste object voor de punt hebt staan.',
  },
  {
    type: /^OSError$/,
    uitleg:
      'Het board kan iets niet uitvoeren. Vaak zit een pin of channel verkeerd, of is een onderdeel niet aangesloten. Controleer je bedrading en channelnummers.',
  },
  {
    type: /^ValueError$/,
    uitleg:
      'De waarde die je meegeeft kan hier niet. Controleer of het getal of de tekst past bij wat de functie verwacht.',
  },
];

const ALGEMENE_UITLEG =
  'Lees de laatste regel van de foutmelding: daar staat wat er misging. De regels erboven laten zien waar in je code het gebeurde.';

/**
 * Zoekt de laatste volledige traceback in de tekst en vertaalt hem.
 * KeyboardInterrupt geeft null terug: dat is de Stop-knop, geen fout.
 */
export function vindLaatsteFout(tekst: string): PythonFout | null {
  const start = tekst.lastIndexOf('Traceback (most recent call last):');
  if (start === -1) return null;
  const regels = tekst.slice(start).split('\n');

  let eigenRegel: number | null = null;
  let eigenBron: 'main.py' | '<stdin>' | null = null;
  let foutRegel: RegExpMatchArray | null = null;
  for (const regel of regels.slice(1)) {
    const frame = regel.match(FRAME_RE);
    if (frame) {
      // Onthoud het diepste frame in de eigen code — een fout ín de library
      // wijst de leerling naar de aanroep in zijn eigen script.
      if (frame[1] === 'main.py' || frame[1] === '<stdin>') {
        eigenRegel = Number(frame[2]);
        eigenBron = frame[1] as 'main.py' | '<stdin>';
      }
      continue;
    }
    if (/^\s/.test(regel) || regel.trim() === '') continue;
    foutRegel = regel.trimEnd().match(FOUT_RE);
    break;
  }
  if (!foutRegel) return null;

  const type = foutRegel[1];
  if (type === 'KeyboardInterrupt') return null;

  return {
    type,
    melding: foutRegel[2] ?? '',
    regel: eigenRegel,
    bron: eigenBron,
    uitleg: UITLEG.find((u) => u.type.test(type))?.uitleg ?? ALGEMENE_UITLEG,
  };
}

export type ReplSegment = {
  tekst: string;
  fout: boolean;
};

/**
 * Splitst REPL-tekst in segmenten, zodat traceback-regels rood gerenderd
 * kunnen worden. Een traceback loopt van de "Traceback"-kop via de
 * ingesprongen frames tot en met de foutregel zelf.
 */
export function splitsFoutSegmenten(tekst: string): ReplSegment[] {
  const segmenten: ReplSegment[] = [];
  let inTraceback = false;

  const voegToe = (regel: string, fout: boolean) => {
    const vorige = segmenten[segmenten.length - 1];
    if (vorige && vorige.fout === fout) vorige.tekst += regel;
    else segmenten.push({ tekst: regel, fout });
  };

  const regels = tekst.split('\n');
  for (let i = 0; i < regels.length; i++) {
    const regel = regels[i] + (i < regels.length - 1 ? '\n' : '');
    if (regels[i].startsWith('Traceback (most recent call last):')) {
      inTraceback = true;
      voegToe(regel, true);
    } else if (inTraceback) {
      voegToe(regel, true);
      // de eerste niet-ingesprongen regel is de foutregel zelf: daarna stopt het
      if (regels[i].trim() !== '' && !/^\s/.test(regels[i])) inTraceback = false;
    } else {
      voegToe(regel, false);
    }
  }
  return segmenten;
}
