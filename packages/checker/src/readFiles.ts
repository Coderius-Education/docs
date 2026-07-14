import type { ProjectFiles } from './types';

// Leest een geüpload project (zip / map / losse bestanden) client-side in tot
// een ProjectFiles-map. Domein-onafhankelijk: de aanroeper geeft mee hoe paden
// geclassificeerd worden en welke kinds als tekst/afbeelding gelezen moeten
// worden.
//
// Belangrijk: we begrenzen NIET de totale uploadgrootte, maar alleen wat we
// echt inlezen (code + optioneel afbeeldingen). Grote binaire assets/builds
// worden geteld maar nooit gedecomprimeerd of gelezen, zodat een complete
// projectmap of zip van honderden MB's gewoon werkt.

export const MAX_FILE_COUNT = 10000; // runaway-beveiliging
export const MAX_TEXT_FILE_SIZE = 2 * 1024 * 1024; // 2 MB per tekstbestand
export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per afbeelding
export const MAX_TEXT_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB code totaal
export const MAX_IMAGE_TOTAL_SIZE = 25 * 1024 * 1024; // 25 MB afbeeldingen totaal

const IGNORED_SEGMENTS = new Set([
  'node_modules',
  '.git',
  '.DS_Store',
  '__MACOSX',
  '.venv',
  'venv',
  '__pycache__',
  '.godot',
  'build',
  'dist',
  'out',
  '.next',
  '.svelte-kit',
  '.idea',
  '.vscode',
  '.cache',
]);

function isIgnoredPath(path: string): boolean {
  return path.split('/').some((segment) => IGNORED_SEGMENTS.has(segment));
}

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

function bytesToDataUrl(bytes: Uint8Array, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Kon bestand niet lezen.'));
    reader.readAsDataURL(new Blob([bytes], { type: mimeType }));
  });
}

export interface ReadOptions {
  classify: (path: string) => string;
  textKinds: string[];
  imageKinds?: string[];
}

export interface ReadFilesResult {
  files: ProjectFiles;
  warnings: string[];
}

interface RawEntry {
  relativePath: string;
  size: number;
  /** null als de bytes niet beschikbaar zijn (bewust niet gedecomprimeerd). */
  getBytes: (() => Promise<Uint8Array>) | null;
}

function fileToRawEntry(file: File, relativePath: string): RawEntry {
  return {
    relativePath,
    size: file.size,
    getBytes: async () => new Uint8Array(await file.arrayBuffer()),
  };
}

function collectFromFiles(fileList: FileList | File[]): RawEntry[] {
  const files = Array.from(fileList);
  return files.map((file) => {
    const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
    return fileToRawEntry(file, relative || file.name);
  });
}

async function collectFromDataTransferItems(items: DataTransferItemList): Promise<RawEntry[]> {
  const topLevel: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) topLevel.push(entry);
  }

  if (topLevel.length === 0) {
    const files = Array.from(items)
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    return collectFromFiles(files);
  }

  const entries: RawEntry[] = [];

  async function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
    const all: FileSystemEntry[] = [];
    for (;;) {
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
      // Genegeerde mappen niet eens inlopen (scheelt enorm bij node_modules e.d.).
      if (IGNORED_SEGMENTS.has(entry.name)) return;
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

// Pakt een zip uit, maar decomprimeert alleen de tekst-/afbeeldingsbestanden
// binnen de caps. Élke entry wordt wel geregistreerd (voor het bestandsoverzicht),
// zodat grote binaire assets tellen maar niet in het geheugen belanden.
async function unzipToRawEntries(file: File, opts: ReadOptions): Promise<RawEntry[]> {
  let unzipSync: typeof import('fflate').unzipSync;
  try {
    ({ unzipSync } = await import('fflate'));
  } catch {
    throw new Error('Kon de zip-uitpaklogica niet laden. Probeer de pagina te verversen.');
  }

  const imageKinds = opts.imageKinds ?? [];
  const meta: { name: string; size: number }[] = [];
  const bytes = new Uint8Array(await file.arrayBuffer());

  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(bytes, {
      filter: (f) => {
        if (f.name.endsWith('/')) return false;
        if (isIgnoredPath(f.name)) return false;
        meta.push({ name: f.name, size: f.size });
        const kind = opts.classify(f.name);
        const wantText = opts.textKinds.includes(kind) && f.size <= MAX_TEXT_FILE_SIZE;
        const wantImage = imageKinds.includes(kind) && f.size <= MAX_IMAGE_FILE_SIZE;
        return wantText || wantImage;
      },
    });
  } catch {
    throw new Error(
      'Dit zip-bestand kon niet worden geopend. Controleer of het bestand niet beschadigd is.',
    );
  }

  return meta.map((m) => ({
    relativePath: m.name,
    size: m.size,
    getBytes: m.name in unzipped ? async () => unzipped[m.name] : null,
  }));
}

// Strip één gemeenschappelijke bovenliggende map (typisch bij een gezipte of
// gesleepte projectmap), zodat het rapport onafhankelijk is van hoe er precies
// geüpload is.
function stripCommonRoot(paths: string[]): string[] {
  if (paths.length <= 1) return paths;
  const segments = paths.map((p) => p.split('/'));
  const minLen = Math.min(...segments.map((s) => s.length));
  let commonLen = 0;
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

async function entriesToProjectFiles(
  rawEntries: RawEntry[],
  opts: ReadOptions,
): Promise<ReadFilesResult> {
  const imageKinds = opts.imageKinds ?? [];
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

  const normalizedPaths = stripCommonRoot(filtered.map((e) => e.relativePath));

  const files: ProjectFiles = {};
  const warnings: string[] = [];
  let skippedTooLarge = 0;
  let textBudget = MAX_TEXT_TOTAL_SIZE;
  let imageBudget = MAX_IMAGE_TOTAL_SIZE;
  let skippedByBudget = false;

  for (let i = 0; i < filtered.length; i++) {
    const entry = filtered[i];
    const path = normalizedPaths[i];
    const kind = opts.classify(path);
    const isTextKind = opts.textKinds.includes(kind);
    const isImageKind = imageKinds.includes(kind);

    let content: string | null = null;
    let tooLarge = false;

    if (isTextKind && entry.getBytes) {
      if (entry.size > MAX_TEXT_FILE_SIZE) {
        tooLarge = true;
        skippedTooLarge++;
      } else if (entry.size > textBudget) {
        skippedByBudget = true;
      } else {
        const bytes = await entry.getBytes();
        content = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        textBudget -= entry.size;
      }
    } else if (isImageKind && entry.getBytes && entry.size <= MAX_IMAGE_FILE_SIZE) {
      if (entry.size > imageBudget) {
        skippedByBudget = true;
      } else {
        const bytes = await entry.getBytes();
        content = await bytesToDataUrl(bytes, mimeTypeForPath(path));
        imageBudget -= entry.size;
      }
    }

    files[path] = { path, kind, content, sizeBytes: entry.size, tooLarge };
  }

  if (skippedTooLarge > 0) {
    warnings.push(
      `${skippedTooLarge} bestand(en) waren groter dan ${MAX_TEXT_FILE_SIZE / (1024 * 1024)} MB en zijn overgeslagen bij de analyse (ze tellen wel mee in het bestandsoverzicht).`,
    );
  }
  if (skippedByBudget) {
    warnings.push(
      'Een deel van de bestanden is overgeslagen bij de analyse omdat het project erg groot is. De belangrijkste code is wel meegenomen.',
    );
  }

  return { files, warnings };
}

/** Eén ingang voor alle upload-methoden. Pakt een los .zip-bestand automatisch uit. */
export async function readUploadedFiles(
  source: FileList | File[] | DataTransferItemList,
  opts: ReadOptions,
): Promise<ReadFilesResult> {
  const isDataTransferItems =
    typeof DataTransferItemList !== 'undefined' && source instanceof DataTransferItemList;

  const rawEntries = isDataTransferItems
    ? await collectFromDataTransferItems(source as DataTransferItemList)
    : collectFromFiles(source as FileList | File[]);

  if (rawEntries.length === 1 && rawEntries[0].relativePath.toLowerCase().endsWith('.zip')) {
    const zipEntry = rawEntries[0];
    if (!zipEntry.getBytes) throw new Error('Kon het zip-bestand niet lezen.');
    const bytes = await zipEntry.getBytes();
    const zipFile = new File([bytes], zipEntry.relativePath);
    const unzipped = await unzipToRawEntries(zipFile, opts);
    return entriesToProjectFiles(unzipped, opts);
  }

  return entriesToProjectFiles(rawEntries, opts);
}
