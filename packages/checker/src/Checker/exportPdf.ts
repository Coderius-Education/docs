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

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const vanDeBrowser = (): Omgeving => ({
  kiezer: (
    window as unknown as { showSaveFilePicker?: ShowSaveFilePicker }
  ).showSaveFilePicker?.bind(window),
  download,
});

/**
 * Bewaart de PDF die `maak` oplevert. Geeft false terug als de docent het
 * opslaan-venster wegklikte.
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
): Promise<boolean> {
  let handle: SaveFileHandle | null = null;
  if (omgeving.kiezer) {
    try {
      handle = await omgeving.kiezer({
        suggestedName: filename,
        types: [{ description: 'PDF-bestand', accept: { 'application/pdf': ['.pdf'] } }],
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return false;
      console.warn('Het venster Opslaan als kon niet open; de PDF komt in Downloads.', err);
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
      return true;
    } catch (err) {
      console.warn('Schrijven naar het gekozen bestand lukte niet; de PDF komt in Downloads.', err);
      await handle.remove?.().catch(() => {});
    }
  }
  omgeving.download(blob, filename);
  return true;
}

/**
 * Waar de pagina's van de PDF beginnen, in pixels van het plaatje. Een pagina
 * eindigt op een lege (witte) rij vlak boven de volle hoogte, zodat een regel
 * tekst niet doormidden gaat; is er in het laatste kwart geen lege rij, dan
 * op de volle hoogte.
 */
export function knipPunten(
  hoogte: number,
  paginaHoogte: number,
  isLeeg: (y: number) => boolean,
): number[] {
  const starts = [0];
  let start = 0;
  while (start + paginaHoogte < hoogte) {
    let knip = start + paginaHoogte;
    const ondergrens = start + Math.floor(paginaHoogte * 0.75);
    for (let y = knip; y > ondergrens; y--) {
      if (isLeeg(y)) {
        knip = y;
        break;
      }
    }
    starts.push(knip);
    start = knip;
  }
  return starts;
}

export function exportReportToPdf(
  element: HTMLElement,
  exportingClass: string,
  filename: string,
): Promise<boolean> {
  return bewaarPdf(() => maakPdf(element, exportingClass), filename);
}

/** Het rapport als PDF: een plaatje van de DOM, over pagina's verdeeld. */
async function maakPdf(element: HTMLElement, exportingClass: string): Promise<Blob> {
  const { default: html2canvas } = await import('html2canvas-pro');
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    onclone: (doc, cloned) => {
      (cloned as HTMLElement).classList.add(exportingClass);
      // Altijd het lichte thema: in donker kwam lichte tekst op het witte
      // papier, en waren de kaarten zwarte blokken.
      doc.documentElement.setAttribute('data-theme', 'light');
    },
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const paginaPx = Math.floor((canvas.width * pageH) / pageW);
  const ctx = canvas.getContext('2d');
  const isLeeg = (y: number) => {
    if (!ctx) return false;
    const rij = ctx.getImageData(0, y, canvas.width, 1).data;
    for (let i = 0; i < rij.length; i += 16) {
      if (rij[i] < 245 || rij[i + 1] < 245 || rij[i + 2] < 245) return false;
    }
    return true;
  };
  const starts = knipPunten(canvas.height, paginaPx, isLeeg);

  starts.forEach((start, i) => {
    const eind = starts[i + 1] ?? canvas.height;
    const stuk = document.createElement('canvas');
    stuk.width = canvas.width;
    stuk.height = eind - start;
    const s = stuk.getContext('2d');
    if (!s) return;
    s.fillStyle = '#ffffff';
    s.fillRect(0, 0, stuk.width, stuk.height);
    s.drawImage(canvas, 0, -start);
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
