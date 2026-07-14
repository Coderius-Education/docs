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
}
type ShowSaveFilePicker = (options?: SaveFilePickerOptions) => Promise<SaveFileHandle>;

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

export async function exportReportToPdf(
  element: HTMLElement,
  exportingClass: string,
  filename: string,
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

  await savePdfBlob(pdf.output('blob'), filename);
}
