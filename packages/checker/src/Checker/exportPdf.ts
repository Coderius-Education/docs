import { jsPDF } from 'jspdf';

// Genereert client-side een PDF van het rapport en opent (waar de browser dat
// ondersteunt) het native "Opslaan als"-venster. Blijft 100% in de browser.
// De tekst wordt als afbeelding in de PDF gezet (html2canvas-pro rastert de DOM).

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description?: string; accept: Record<string, string[]> }[];
}
interface FileSystemWritable {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
}
interface SaveFileHandle {
  createWritable: () => Promise<FileSystemWritable>;
  /** Chrome 110 en later; haalt het bestand weer weg. */
  remove?: () => Promise<void>;
}
export type ShowSaveFilePicker = (options?: SaveFilePickerOptions) => Promise<SaveFileHandle>;

export type Omgeving = {
  /** `window.showSaveFilePicker`, of undefined in Firefox en Safari. */
  kiezer?: ShowSaveFilePicker;
  /** Een gewone download naar de map Downloads. */
  download: (blob: Blob, filename: string) => void;
};

/**
 * Hoe lang het adres van een download blijft bestaan. Firefox en Safari
 * halen een blob pas op nadat de klik is afgehandeld; trok de nakijker het
 * adres meteen na de klik in, dan kon de download stil mislukken (issue 225).
 * FileSaver.js wacht om die reden veertig seconden.
 */
export const DOWNLOAD_BEWAREN_MS = 60_000;

/** Een gewone download, met het adres van de blob nog even geldig. */
export function download(
  blob: Blob,
  filename: string,
  wacht: (ga: () => void, ms: number) => unknown = setTimeout,
): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  wacht(() => URL.revokeObjectURL(url), DOWNLOAD_BEWAREN_MS);
}

/**
 * Waar de PDF terechtkwam: in het bestand dat de docent koos, of als gewone
 * download in de map Downloads. Bij een download zegt `reden` waarom het
 * gekozen bestand niet lukte (de melding van de browser); zonder venster
 * (Firefox, Safari) is er geen reden.
 */
export type Bewaard = { plek: 'gekozen' } | { plek: 'downloads'; reden: string | null };

/**
 * Wat de nakijker na het bewaren zegt. "PDF opgeslagen" alleen als hij in het
 * gekozen bestand staat: eerst stond die zin er ook na een download die de
 * browser tegenhield, en zocht de docent een bestand dat er niet was (issue
 * 225). Bij een download staat erbij waar hij hoort te staan, en waarom niet
 * op de gekozen plek.
 */
export function meldingNaBewaren(bewaard: Bewaard): { melding: string; klaar: string } {
  if (bewaard.plek === 'gekozen') return { melding: 'PDF opgeslagen.', klaar: 'Klaar met' };
  const waarom = bewaard.reden ? ` De plek die je koos, lukte niet (${bewaard.reden}).` : '';
  return {
    melding: `De PDF staat in je map Downloads.${waarom} Zie je hem daar niet, dan houdt de browser downloads tegen.`,
    klaar: 'Staat hij daar, en ben je klaar met',
  };
}

/** De melding van een fout, zoals de browser hem gaf. */
export const meldingVan = (err: unknown): string =>
  err instanceof Error ? err.message || err.name : String(err);

const vanDeBrowser = (): Omgeving => ({
  kiezer: (
    window as unknown as { showSaveFilePicker?: ShowSaveFilePicker }
  ).showSaveFilePicker?.bind(window),
  download,
});

/**
 * Bewaart de PDF die `maak` oplevert, en zegt waar hij staat. Geeft null
 * terug als de docent het opslaan-venster wegklikte.
 *
 * Het venster komt eerst, direct op de klik, en pas daarna wordt de PDF
 * gemaakt. Chrome en Edge openen "Opslaan als" alleen binnen een paar
 * seconden na een klik. Eerst kwam het venster ná het maken: bij een rapport
 * met foto's of op een trage computer duurde dat langer dan vijf seconden, de
 * browser weigerde het venster ("Must be handling a user gesture to show a
 * file picker") en de docent zag alleen "Het opslaan als PDF is mislukt"
 * (issue 218).
 *
 * Kan het venster om een andere reden niet open, of lukt het schrijven niet,
 * dan komt de PDF als gewone download: een PDF in Downloads is beter dan
 * geen PDF.
 */
export async function bewaarPdf(
  maak: () => Promise<Blob>,
  filename: string,
  omgeving: Omgeving = vanDeBrowser(),
): Promise<Bewaard | null> {
  let handle: SaveFileHandle | null = null;
  let reden: string | null = null;
  if (omgeving.kiezer) {
    try {
      handle = await omgeving.kiezer({
        suggestedName: filename,
        types: [{ description: 'PDF-bestand', accept: { 'application/pdf': ['.pdf'] } }],
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null;
      console.warn('Het venster Opslaan als kon niet open; de PDF komt in Downloads.', err);
      reden = meldingVan(err);
    }
  }

  let blob: Blob;
  try {
    blob = await maak();
  } catch (err) {
    // Het gekozen bestand bestaat al, en is leeg: haal het weer weg.
    await handle?.remove?.().catch(() => {});
    throw err;
  }

  if (handle) {
    try {
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { plek: 'gekozen' };
    } catch (err) {
      // Een school die downloads tegenhoudt, houdt in Chrome ook dit tegen;
      // dan mislukt de download hieronder net zo. Daarom zegt de nakijker
      // waar de PDF zou moeten staan, en waarom niet op de gekozen plek.
      console.warn('Schrijven naar het gekozen bestand lukte niet; de PDF komt in Downloads.', err);
      reden = meldingVan(err);
      await handle.remove?.().catch(() => {});
    }
  }
  omgeving.download(blob, filename);
  return { plek: 'downloads', reden };
}

/**
 * Waar de pagina's van de PDF beginnen, in pixels van het plaatje. Een pagina
 * eindigt op een lege (witte) rij vlak boven de volle hoogte, zodat een regel
 * tekst niet doormidden gaat; is er in het laatste kwart geen lege rij, dan
 * op de volle hoogte. Begint er onderaan een pagina een kop (`koppen`: de
 * bovenkant van elke h2 en h3, in het laatste zesde van de pagina), dan
 * begint de volgende pagina met die kop: eerst stond Samenhang of
 * Vragen als laatste regel van een pagina, en de rest erna.
 */
export function knipPunten(
  hoogte: number,
  paginaHoogte: number,
  isLeeg: (y: number) => boolean,
  koppen: number[] = [],
): number[] {
  const starts = [0];
  let start = 0;
  while (start + paginaHoogte < hoogte) {
    let knip = start + paginaHoogte;
    const kopGrens = start + Math.floor(paginaHoogte * (5 / 6));
    // De eerste kop in die zone: staan er twee (een h2 en de h3 eronder),
    // dan gaan ze samen naar de volgende pagina.
    const onderaan = koppen.filter((y) => y > kopGrens && y <= knip);
    if (onderaan.length > 0) {
      knip = Math.min(...onderaan) - 1;
    } else {
      const ondergrens = start + Math.floor(paginaHoogte * 0.75);
      for (let y = knip; y > ondergrens; y--) {
        if (isLeeg(y)) {
          knip = y;
          break;
        }
      }
    }
    starts.push(knip);
    start = knip;
  }
  return starts;
}

/**
 * De regel boven elke pagina: de naam van het bestand (cursus, datum en
 * leerling) en het paginanummer. Een losse tweede pagina zei eerst niet van
 * wie hij was.
 */
export function kopregel(
  bestand: string,
  pagina: number,
  totaal: number,
): { links: string; rechts: string } {
  return {
    links: bestand.replace(/\.pdf$/i, ''),
    rechts: `pagina ${pagina} van ${totaal}`,
  };
}

/** Hoogte van de kopregel, in millimeter van de pagina. */
const KOP_MM = 10;

export function exportReportToPdf(
  element: HTMLElement,
  exportingClass: string,
  filename: string,
): Promise<Bewaard | null> {
  return bewaarPdf(() => maakPdf(element, exportingClass, filename), filename);
}

/** Het rapport als PDF: een plaatje van de DOM, over pagina's verdeeld. */
async function maakPdf(
  element: HTMLElement,
  exportingClass: string,
  bestand: string,
): Promise<Blob> {
  const { default: html2canvas } = await import('html2canvas-pro');
  const schaal = 2;
  // De bovenkant van elke kop, gemeten in de kloon: daar staan de knoppen
  // weg en de opmerkingen als tekst, dus de plek is anders dan op het scherm.
  let koppen: number[] = [];
  const canvas = await html2canvas(element, {
    scale: schaal,
    backgroundColor: '#ffffff',
    onclone: (doc, cloned) => {
      (cloned as HTMLElement).classList.add(exportingClass);
      // Altijd het lichte thema: in donker kwam lichte tekst op het witte
      // papier, en waren de kaarten zwarte blokken.
      doc.documentElement.setAttribute('data-theme', 'light');
      const boven = cloned.getBoundingClientRect().top;
      koppen = Array.from(cloned.querySelectorAll('h2, h3'))
        .map((h) => h.getBoundingClientRect())
        .filter((r) => r.height > 0)
        .map((r) => Math.round((r.top - boven) * schaal));
    },
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const mmNaarPx = canvas.width / pageW;
  const kopPx = Math.round(KOP_MM * mmNaarPx);
  const paginaPx = Math.floor((pageH - KOP_MM) * mmNaarPx);
  const ctx = canvas.getContext('2d');
  const isLeeg = (y: number) => {
    if (!ctx) return false;
    const rij = ctx.getImageData(0, y, canvas.width, 1).data;
    for (let i = 0; i < rij.length; i += 16) {
      if (rij[i] < 245 || rij[i + 1] < 245 || rij[i + 2] < 245) return false;
    }
    return true;
  };
  const starts = knipPunten(canvas.height, paginaPx, isLeeg, koppen);

  starts.forEach((start, i) => {
    const eind = starts[i + 1] ?? canvas.height;
    const stuk = document.createElement('canvas');
    stuk.width = canvas.width;
    stuk.height = kopPx + eind - start;
    const s = stuk.getContext('2d');
    if (!s) return;
    s.fillStyle = '#ffffff';
    s.fillRect(0, 0, stuk.width, stuk.height);
    // De kopregel tekent de browser, niet jsPDF: de letters van jsPDF kennen
    // alleen Latin-1, en een naam als Şükrü kwam er dan verminkt in.
    const kop = kopregel(bestand, i + 1, starts.length);
    const marge = Math.round(12 * mmNaarPx);
    s.fillStyle = '#555555';
    s.font = `${Math.round(3 * mmNaarPx)}px system-ui, sans-serif`;
    s.textBaseline = 'middle';
    s.textAlign = 'right';
    s.fillText(kop.rechts, stuk.width - marge, kopPx / 2);
    const rechtsBreed = s.measureText(kop.rechts).width;
    s.textAlign = 'left';
    s.fillText(kop.links, marge, kopPx / 2, stuk.width - 3 * marge - rechtsBreed);
    s.drawImage(canvas, 0, kopPx - start);
    if (i > 0) pdf.addPage();
    pdf.addImage(
      stuk.toDataURL('image/jpeg', 0.85),
      'JPEG',
      0,
      0,
      pageW,
      (stuk.height * pageW) / stuk.width,
    );
  });

  return pdf.output('blob');
}
