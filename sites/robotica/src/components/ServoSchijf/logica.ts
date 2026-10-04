// De rekenkant van de servo-draaischijf, los van React zodat hij in node te
// testen is (`src/lego-tests/servo-schijf.test.ts`).

export const MIN = 0;
export const MAX = 180;

// De tekening: het asje zit in het midden onderaan, de halve cirkel staat
// erboven. 0° ligt links, 90° recht omhoog en 180° rechts, dezelfde kant op
// als de schuif eronder: wie naar links schuift, ziet de arm naar links gaan.
// De les zegt alleen "één kant" en "de andere kant"; welke kant het op een
// echte servo is, hangt af van hoe hij ligt.
export const MIDDEN = { x: 140, y: 140 };
export const STREEPJES = [0, 45, 90, 135, 180] as const;

// Hoeveel de arm in de tekening draait. De arm is naar rechts getekend
// (180°); in SVG draait een positieve hoek met de klok mee. Van 0° naar 180°
// gaat de arm dus van -180 naar 0, over -90 (recht omhoog), en nooit onder
// het asje door.
export function draaiing(stand: number): number {
  return begrens(stand) - 180;
}

// Een punt op de cirkel om het asje, voor de streepjes en hun getallen.
export function punt(stand: number, straal: number): { x: number; y: number } {
  const rad = (begrens(stand) * Math.PI) / 180;
  const rond = (n: number) => Math.round(n * 100) / 100 + 0;
  return {
    x: rond(MIDDEN.x - straal * Math.cos(rad)),
    y: rond(MIDDEN.y - straal * Math.sin(rad)),
  };
}

// Een servo komt niet verder dan 0° en 180°, en kent alleen hele graden.
export function begrens(stand: number): number {
  if (!Number.isFinite(stand)) return MIN;
  return Math.min(MAX, Math.max(MIN, Math.round(stand)));
}

export interface Invoer {
  // De stand waar de servo heen gaat, of null als er geen getal stond.
  stand: number | null;
  // Een korte uitleg als het getal is aangepast of ontbrak.
  melding: string | null;
}

// Wat de leerling in het veld "Servo 9 op [ ]" typt.
export function leesInvoer(tekst: string): Invoer {
  const schoon = tekst.trim().replace(',', '.');
  if (schoon === '' || !/^-?\d+(\.\d+)?$/.test(schoon)) {
    return { stand: null, melding: 'Typ een getal van 0 tot en met 180.' };
  }
  const getal = Number(schoon);
  if (getal < MIN) {
    return {
      stand: MIN,
      melding: `${tekst.trim()} kan niet: een servo gaat niet verder dan 0°. Hij staat nu op 0°.`,
    };
  }
  if (getal > MAX) {
    return {
      stand: MAX,
      melding: `${tekst.trim()} kan niet: een servo draait maar tot 180°. Hij staat nu op 180°.`,
    };
  }
  const stand = begrens(getal);
  if (stand !== getal) {
    return { stand, melding: `Een servo kent alleen hele graden. Hij staat nu op ${stand}°.` };
  }
  return { stand, melding: null };
}

// Hoeveel regels de melding onder het veld mag hebben. De ruimte staat er
// altijd (`.melding` in styles.module.css): verscheen de melding pas als je
// het veld verliet, dan schoof alles eronder omlaag, ook de knop waar je net
// op klikte.
export const MELDING_REGELS = 2;

// Moet het veld bij het verlaten nog bevestigd worden? Alleen als er iets
// staat dat nog niet de stand is. Na Enter staat de stand er al; bevestigen
// zou dan de melding wissen. Die melding wiste een klik op "Volgende
// opdracht" eerst halverwege: de muisknop ging omlaag, het veld verloor zijn
// focus, de melding verdween, de knop schoof omhoog en de muisknop kwam
// naast de knop weer omhoog. De klik telde dan niet.
export function moetBevestigen(tekst: string, stand: number): boolean {
  return tekst !== String(stand);
}

export interface Opdracht {
  vraag: string;
  // Elke stand die goed is. "Helemaal naar één kant" mag 0° of 180° zijn.
  doelen: number[];
  // Wat er bij goed bij komt te staan: waarom deze stand klopt.
  goed: string;
}

// De servo begint op 90°, dus de eerste opdracht vraagt een andere stand.
export const OPDRACHTEN: Opdracht[] = [
  {
    vraag: 'Draai het asje helemaal naar één kant.',
    doelen: [0, 180],
    goed: 'Goed. Verder dan 0° of 180° komt een servo niet.',
  },
  {
    vraag: 'Zet het asje recht in het midden.',
    doelen: [90],
    goed: 'Goed. 90° is recht in het midden.',
  },
  {
    vraag: 'Zet het asje halverwege tussen 0° en het midden.',
    doelen: [45],
    goed: 'Goed. 45° is de helft van 90°.',
  },
  {
    vraag: 'Zet het asje halverwege tussen het midden en 180°.',
    doelen: [135],
    goed: 'Goed. 135° ligt precies tussen 90° en 180°.',
  },
];

// Binnen zoveel graden heet het "bijna" en noemt de terugkoppeling het doel.
export const BIJNA = 15;

export interface Oordeel {
  goed: boolean;
  tekst: string;
}

export function beoordeel(stand: number, opdracht: Opdracht): Oordeel {
  const nu = begrens(stand);
  if (opdracht.doelen.includes(nu)) return { goed: true, tekst: opdracht.goed };
  // Het dichtstbijzijnde doel: bij "één kant" is dat de kant waar je al heen gaat.
  const doel = opdracht.doelen.reduce((a, b) => (Math.abs(b - nu) < Math.abs(a - nu) ? b : a));
  if (Math.abs(doel - nu) <= BIJNA) {
    return { goed: false, tekst: `Bijna: je staat op ${nu}°, je moet naar ${doel}°.` };
  }
  const kant = doel > nu ? 'Draai verder, naar 180° toe.' : 'Draai terug, naar 0° toe.';
  return { goed: false, tekst: `Nog niet: je staat op ${nu}°. ${kant}` };
}
