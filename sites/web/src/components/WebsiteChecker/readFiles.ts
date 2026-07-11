import { classifyFile, isIgnoredPath } from './classifyFile';
import type { ProjectFiles } from './types';

export const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_FILE_COUNT = 500;
export const MAX_TEXT_FILE_SIZE = 2 * 1024 * 1024; // 2 MB per HTML/CSS/JS-bestand
export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per afbeelding (voor de IDE-preview)

const IMAGE_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
};

function mimeTypeForPath(path: string): string {
  const dot = path.lastIndexOf('.');
  const ext = dot === -1 ? '' : path.slice(dot).toLowerCase();
  return IMAGE_MIME_TYPES[ext] ?? 'application/octet-stream';
}

// Zet afbeeldingsbytes om naar een data:-URL, zodat ze als gewone string in
// ProjectFile.content passen — nodig om ze later (via "Bekijk in Online
// Editor") mee te kunnen sturen naar de preview-iframe, die geen echte
// bestandslocatie heeft waar een relatief pad naartoe zou kunnen wijzen.
function bytesToDataUrl(bytes: Uint8Array, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Kon afbeelding niet lezen.'));
    reader.readAsDataURL(new Blob([bytes], { type: mimeType }));
  });
}

export interface ReadFilesResult {
  files: ProjectFiles;
  warnings: string[];
}

/** Minimale, lazy weergave van één bestand — of het nou uit een File-object of uit een uitgepakte zip-entry komt. */
interface RawEntry {
  relativePath: string;
  size: number;
  getBytes: () => Promise<Uint8Array>;
}

function fileToRawEntry(file: File, relativePath: string): RawEntry {
  return {
    relativePath,
    size: file.size,
    getBytes: async () => new Uint8Array(await file.arrayBuffer()),
  };
}

// Bestand/map-selectie geeft File[] (met evt. webkitRelativePath bij mapkeuze).
function collectFromFiles(fileList: FileList | File[]): RawEntry[] {
  const files = Array.from(fileList);
  return files.map((file) => {
    const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
    return fileToRawEntry(file, relative || file.name);
  });
}

// Drag-and-drop kan losse bestanden én hele mappen bevatten — die laatste
// moeten recursief uitgelezen worden via de (niet-gestandaardiseerde maar
// breed ondersteunde) FileSystemEntry-API.
async function collectFromDataTransferItems(items: DataTransferItemList): Promise<RawEntry[]> {
  const topLevel: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) topLevel.push(entry);
  }

  if (topLevel.length === 0) {
    // Browser zonder webkitGetAsEntry: val terug op losse bestanden.
    const files = Array.from(items)
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    return collectFromFiles(files);
  }

  const entries: RawEntry[] = [];

  async function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
    const all: FileSystemEntry[] = [];
    for (;;) {
      // readEntries() kan meerdere aanroepen nodig hebben tot een lege array.
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      if (batch.length === 0) break;
      all.push(...batch);
    }
    return all;
  }

  async function walk(entry: FileSystemEntry, prefix: string): Promise<void> {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject),
      );
      entries.push(fileToRawEntry(file, `${prefix}${entry.name}`));
    } else if (entry.isDirectory) {
      const children = await readAllEntries((entry as FileSystemDirectoryEntry).createReader());
      for (const child of children) {
        await walk(child, `${prefix}${entry.name}/`);
      }
    }
  }

  for (const entry of topLevel) {
    await walk(entry, '');
  }
  return entries;
}

async function unzipToRawEntries(file: File): Promise<RawEntry[]> {
  let unzipSync: typeof import('fflate').unzipSync;
  try {
    ({ unzipSync } = await import('fflate'));
  } catch {
    throw new Error('Kon de zip-uitpaklogica niet laden. Probeer de pagina te verversen.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(bytes);
  } catch {
    throw new Error(
      'Dit zip-bestand kon niet worden geopend. Controleer of het bestand niet beschadigd is.',
    );
  }

  return Object.entries(unzipped)
    .filter(([path]) => !path.endsWith('/')) // map-vermeldingen overslaan
    .map(([path, entryBytes]) => ({
      relativePath: path,
      size: entryBytes.byteLength,
      getBytes: async () => entryBytes,
    }));
}

// Als alle bestanden onder één gemeenschappelijke map zitten (typisch bij een
// gezipte of gesleepte projectmap), strip die ene laag zodat het rapport
// onafhankelijk is van hoe de leerling precies geüpload heeft.
function stripCommonRoot(paths: string[]): string[] {
  if (paths.length <= 1) return paths;
  const segments = paths.map((p) => p.split('/'));
  const minLen = Math.min(...segments.map((s) => s.length));
  let commonLen = 0;
  // De laatste laag is de bestandsnaam zelf — nooit meestrippen.
  for (let i = 0; i < minLen - 1; i++) {
    const candidate = segments[0][i];
    if (segments.every((s) => s[i] === candidate)) {
      commonLen++;
    } else {
      break;
    }
  }
  if (commonLen === 0) return paths;
  return segments.map((s) => s.slice(commonLen).join('/'));
}

async function entriesToProjectFiles(rawEntries: RawEntry[]): Promise<ReadFilesResult> {
  const filtered = rawEntries.filter(
    (e) => !isIgnoredPath(e.relativePath) && e.relativePath.trim() !== '',
  );

  if (filtered.length === 0) {
    throw new Error('Geen bruikbare bestanden gevonden in de upload.');
  }
  if (filtered.length > MAX_FILE_COUNT) {
    throw new Error(
      `Dit project bevat ${filtered.length} bestanden — dat is meer dan de limiet van ${MAX_FILE_COUNT}. Upload een kleiner project.`,
    );
  }
  const totalSize = filtered.reduce((sum, e) => sum + e.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    const mb = (totalSize / (1024 * 1024)).toFixed(1);
    throw new Error(
      `Dit project is samen ${mb} MB — dat is meer dan de limiet van ${MAX_TOTAL_SIZE / (1024 * 1024)} MB. Upload een kleiner project.`,
    );
  }

  const normalizedPaths = stripCommonRoot(filtered.map((e) => e.relativePath));

  const files: ProjectFiles = {};
  const warnings: string[] = [];
  let skippedTooLarge = 0;

  for (let i = 0; i < filtered.length; i++) {
    const entry = filtered[i];
    const path = normalizedPaths[i];
    const kind = classifyFile(path);
    const isTextKind = kind === 'html' || kind === 'css' || kind === 'js';

    let content: string | null = null;
    let tooLarge = false;

    if (isTextKind) {
      if (entry.size > MAX_TEXT_FILE_SIZE) {
        tooLarge = true;
        skippedTooLarge++;
      } else {
        const bytes = await entry.getBytes();
        content = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      }
    } else if (kind === 'image' && entry.size <= MAX_IMAGE_FILE_SIZE) {
      // Stilzwijgend overslaan boven de cap: telt gewoon mee in het
      // bestandsoverzicht, alleen zonder preview-ondersteuning. Geen aparte
      // waarschuwing — dat is iets anders dan de "te groot voor analyse"-melding
      // hierboven.
      const bytes = await entry.getBytes();
      content = await bytesToDataUrl(bytes, mimeTypeForPath(path));
    }

    files[path] = { path, kind, content, sizeBytes: entry.size, tooLarge };
  }

  if (skippedTooLarge > 0) {
    warnings.push(
      `${skippedTooLarge} bestand(en) waren groter dan ${MAX_TEXT_FILE_SIZE / (1024 * 1024)} MB en zijn overgeslagen bij de analyse (ze tellen wel mee in het bestandsoverzicht).`,
    );
  }

  return { files, warnings };
}

/**
 * Eén ingang voor alle upload-methoden (bestand/zip-kiezer, map-kiezer,
 * drag-and-drop). Herkent automatisch een los .zip-bestand en pakt die uit.
 */
export async function readUploadedFiles(
  source: FileList | File[] | DataTransferItemList,
): Promise<ReadFilesResult> {
  const isDataTransferItems =
    typeof DataTransferItemList !== 'undefined' && source instanceof DataTransferItemList;

  const rawEntries = isDataTransferItems
    ? await collectFromDataTransferItems(source as DataTransferItemList)
    : collectFromFiles(source as FileList | File[]);

  if (rawEntries.length === 1 && rawEntries[0].relativePath.toLowerCase().endsWith('.zip')) {
    const zipEntry = rawEntries[0];
    const bytes = await zipEntry.getBytes();
    const zipFile = new File([bytes], zipEntry.relativePath);
    const unzipped = await unzipToRawEntries(zipFile);
    return entriesToProjectFiles(unzipped);
  }

  return entriesToProjectFiles(rawEntries);
}
