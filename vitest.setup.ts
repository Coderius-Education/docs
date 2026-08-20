// Node heeft File, Blob en TextDecoder, maar geen FileReader. readFiles.ts
// gebruikt die op één plek: afbeeldingen omzetten naar een data-URL. Deze shim
// dekt precies dat gebruik (readAsDataURL + onload/onerror), zodat de
// afbeeldings-tak testbaar is zonder een volledige DOM-omgeving.

class FileReaderShim {
  result: string | null = null;
  error: unknown = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  readAsDataURL(blob: Blob): void {
    blob
      .arrayBuffer()
      .then((buf) => {
        const base64 = Buffer.from(buf).toString('base64');
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
        this.onload?.();
      })
      .catch((err) => {
        this.error = err;
        this.onerror?.();
      });
  }
}

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = FileReaderShim as unknown as typeof FileReader;
}
