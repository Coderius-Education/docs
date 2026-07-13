import { jsPDF } from 'jspdf';

// Genereert client-side een PDF van het rapport en opent (waar de browser dat
// ondersteunt) het native "Opslaan als"-venster zodat de docent zelf een map
// kiest. Blijft 100% in de browser — er gaat niets naar een server.
//
// De tekst wordt als afbeelding in de PDF gezet (html2canvas-pro rastert de
// DOM). Dat is bewust: de browser-print-route gaf scherpere tekst maar kon
// het opslaan-venster niet direct openen.

// showSaveFilePicker zit nog niet in de standaard TS DOM-lib.
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
}
type ShowSaveFilePicker = (options?: SaveFilePickerOptions) => Promise<SaveFileHandle>;

function todayStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function savePdfBlob(blob: Blob, filename: string): Promise<void> {
  const picker = (window as unknown as { showSaveFilePicker?: ShowSaveFilePicker })
    .showSaveFilePicker;
  if (picker) {
    let handle: SaveFileHandle;
    try {
      handle = await picker({
        suggestedName: filename,
        types: [{ description: 'PDF-bestand', accept: { 'application/pdf': ['.pdf'] } }],
      });
    } catch (err) {
      // De docent heeft het opslaan-venster geannuleerd: stil stoppen.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      throw err;
    }
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  // Fallback (Firefox/Safari): gewone download naar de Downloads-map.
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Rastert `element` naar een A4-PDF (meerdere pagina's indien nodig) en biedt
 * die aan om op te slaan. `onclone` verbergt de interactieve knoppen en toont
 * de opmerkingen als nette tekstblok — zonder flikkering op het scherm, omdat
 * alleen de gekloonde DOM wordt aangepast.
 */
export async function exportReportToPdf(
  element: HTMLElement,
  exportingClass: string,
): Promise<void> {
  const { default: html2canvas } = await import('html2canvas-pro');
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    onclone: (_doc, cloned) => {
      (cloned as HTMLElement).classList.add(exportingClass);
    },
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;
  // JPEG i.p.v. PNG: op een witte achtergrond nauwelijks zichtbaar verschil,
  // maar een fractie van de bestandsgrootte (een lossless PNG van een lang
  // rapport op scale 2 werd al gauw tientallen MB's).
  const imgData = canvas.toDataURL('image/jpeg', 0.85);

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
    heightLeft -= pageH;
  }

  const blob = pdf.output('blob');
  await savePdfBlob(blob, `Beoordeling Web Project - ${todayStamp()}.pdf`);
}
