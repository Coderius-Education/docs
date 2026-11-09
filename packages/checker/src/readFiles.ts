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

// Mappen die nooit bij een project horen, waar ze ook staan. site-packages
// is het hart van elke Python-venv, ook een die `env` of `.env311` heet: een
// leerling die zijn venv meezipte, gaf eerst 10 MB aan FastAPI-bron, waarna
// zijn eigen main.py buiten het leesbudget viel.
const ALTIJD_WEG = new Set([
  'node_modules',
  '.git',
  '.DS_Store',
  '__MACOSX',
  '__pycache__',
  '.godot',
  'site-packages',
]);

// Mappen die in een project rommel zijn, maar die als bovenste map gewoon de
// naam van het project kunnen zijn: een leerling die zijn map `build` noemde,
// kreeg eerst "Geen bruikbare bestanden". Ze tellen daarom pas onder de
// gemeenschappelijke bovenmap.
const IGNORED_SEGMENTS = new Set([
  ...ALTIJD_WEG,
  '.venv',
  'venv',
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

function altijdWeg(path: string): boolean {
  return path.split('/').some((segment) => ALTIJD_WEG.has(segment));
}

// Een reservekopie naast het project ("mijn-game - kopie", "Kopie van site",
// "backup"). Die telde mee, en dan haalde een lijst die maar één keer in het
// project staat de drempel van twee.
const KOPIE =
  /\s-\s*(?:kopie|copy)(?:\s*\(\d+\))?$|^(?:kopie|copy)\s+(?:van|of)\s|^(?:backup|back-up)$/i;

/** De map van een reservekopie in dit pad, of null. Alleen mappen, niet de bestandsnaam. */
function kopieMap(path: string): string | null {
  const delen = path.split('/');
  const i = delen.slice(0, -1).findIndex((d) => KOPIE.test(d));
  return i === -1 ? null : delen.slice(0, i + 1).join('/');
}

// Archieven die de nakijker niet kan openen.
const ANDER_ARCHIEF = /\.(?:rar|7z|tar|gz|tgz|bz2|xz)$/i;

// Foto's van een telefoon die een browser niet kan tonen.
const HEIC = /\.hei[cf]$/i;

/** Een fout met een melding voor de leerling, in het Nederlands. */
export class LeesFout extends Error {}

const ONLEESBAAR = (pad: string) =>
  `Kon "${pad}" niet lezen. Staat je map in OneDrive, iCloud of Google Drive? Zet de bestanden dan eerst op deze computer (in OneDrive: rechtsklik, "Altijd op dit apparaat bewaren") en probeer het opnieuw.`;

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
    getBytes: async () => {
      try {
        return new Uint8Array(await file.arrayBuffer());
      } catch {
        // Een NotReadableError in het Engels, bij een bestand dat alleen in
        // de cloud staat.
        throw new LeesFout(ONLEESBAAR(relativePath));
      }
    },
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
      const pad = `${prefix}${entry.name}`;
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, () => reject(new LeesFout(ONLEESBAAR(pad)))),
      );
      entries.push(fileToRawEntry(file, pad));
    } else if (entry.isDirectory) {
      // Genegeerde mappen niet eens inlopen (scheelt enorm bij node_modules
      // e.d.). De gesleepte map zelf wel, ook als hij `build` heet.
      if (ALTIJD_WEG.has(entry.name) || (prefix !== '' && IGNORED_SEGMENTS.has(entry.name))) return;
      let children: FileSystemEntry[];
      try {
        children = await readAllEntries((entry as FileSystemDirectoryEntry).createReader());
      } catch {
        throw new LeesFout(ONLEESBAAR(`${prefix}${entry.name}`));
      }
      // Een venv, hoe hij ook heet.
      if (prefix !== '' && children.some((c) => c.isFile && c.name === 'pyvenv.cfg')) return;
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
async function unzipToRawEntries(file: File, opts: ReadOptions, diepte = 0): Promise<RawEntry[]> {
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
        // De bovenste map van een zip is vaak de projectmap zelf, en mag dus
        // `build` heten; wat daaronder in IGNORED_SEGMENTS staat, telt niet.
        if (altijdWeg(f.name) || isIgnoredPath(f.name.split('/').slice(1).join('/'))) return false;
        // originalSize, niet size: die laatste is de gecomprimeerde grootte, en
        // tekst comprimeert enorm (6 MB JavaScript wordt zo'n 12 kB). Daarop
        // wegen zou elk codebestand langs de limieten hieronder laten glippen,
        // en het bestandsoverzicht een onzinnig getal geven.
        const size = f.originalSize;
        meta.push({ name: f.name, size });
        const kind = opts.classify(f.name);
        const wantText = opts.textKinds.includes(kind) && size <= MAX_TEXT_FILE_SIZE;
        const wantImage = imageKinds.includes(kind) && size <= MAX_IMAGE_FILE_SIZE;
        // Een zip in een zip pakken we uit als hij het enige is (zie onder).
        const wantZip = diepte === 0 && /\.zip$/i.test(f.name);
        return wantText || wantImage || wantZip;
      },
    });
  } catch {
    throw new LeesFout(
      `${file.name} kon niet worden geopend. Controleer of het bestand niet beschadigd is.`,
    );
  }

  const entries: RawEntry[] = meta.map((m) => ({
    relativePath: m.name,
    size: m.size,
    getBytes: m.name in unzipped ? async () => unzipped[m.name] : null,
  }));
  // Een inlevering die één zip met het project bevat (de leerling zipte zijn
  // zip nog eens): pak die ook uit. Een zip naast andere bestanden is iets uit
  // het project zelf, zoals een export, en blijft dicht.
  const echt = entries.filter((e) => !altijdWeg(e.relativePath));
  if (diepte === 0 && echt.length === 1 && /\.zip$/i.test(echt[0].relativePath)) {
    const binnen = echt[0];
    if (binnen.getBytes) {
      const naam = binnen.relativePath.split('/').pop() ?? binnen.relativePath;
      return unzipToRawEntries(new File([await binnen.getBytes()], naam), opts, diepte + 1);
    }
  }
  return entries;
}

/** Tekst uit bytes: UTF-8, of UTF-16 zoals Kladblok het als "Unicode" bewaart. */
export function decodeerTekst(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
  // UTF-16 zonder BOM: bij gewone tekst is elke tweede byte een nul.
  const proef = bytes.subarray(0, 512);
  let nullen = 0;
  for (let i = 1; i < proef.length; i += 2) if (proef[i] === 0) nullen++;
  if (proef.length >= 8 && nullen > proef.length / 4) {
    return new TextDecoder('utf-16le').decode(bytes);
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

/** "a", "a en b", "a, b en c", en bij meer dan drie "a, b, c en 2 andere". */
function opsomming(namen: string[]): string {
  const lijst = namen.length > 3 ? [...namen.slice(0, 3), `${namen.length - 3} andere`] : namen;
  return lijst.length === 1 ? lijst[0] : `${lijst.slice(0, -1).join(', ')} en ${lijst.at(-1)}`;
}

// Strip élke gemeenschappelijke bovenliggende map (typisch bij een gezipte of
// gesleepte projectmap), zodat het rapport onafhankelijk is van hoe er precies
// geüpload is.
//
// Let op de keerzijde: zit een heel project onder één diep pad — bijvoorbeeld
// alleen bestanden in `proj/templates/` — dan verdwijnt ook die `templates/`
// uit het pad, en vinden de pad-concepten van fullstack en godot hem niet meer.
// Zeldzaam (een echt project heeft meerdere mappen naast elkaar) maar stil.
// Vastgelegd in readFiles.test.ts.
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
  // Een map met pyvenv.cfg is een venv, hoe hij ook heet.
  const venvs = rawEntries
    .map((e) => e.relativePath)
    .filter((p) => p.endsWith('/pyvenv.cfg'))
    .map((p) => p.slice(0, -'pyvenv.cfg'.length));
  const schoon = rawEntries.filter(
    (e) =>
      e.relativePath.trim() !== '' &&
      !altijdWeg(e.relativePath) &&
      !venvs.some((v) => e.relativePath.startsWith(v)),
  );
  const paden = stripCommonRoot(schoon.map((e) => e.relativePath));
  const kopieen = new Set<string>();
  const gekozen: { entry: RawEntry; path: string }[] = [];
  schoon.forEach((entry, i) => {
    const path = paden[i];
    if (isIgnoredPath(path)) return;
    const kopie = kopieMap(path);
    if (kopie) kopieen.add(kopie);
    else gekozen.push({ entry, path });
  });

  if (gekozen.length === 0) {
    throw new LeesFout('Geen bruikbare bestanden gevonden in de upload.');
  }
  if (gekozen.length > MAX_FILE_COUNT) {
    throw new LeesFout(
      `Dit project bevat ${gekozen.length} bestanden — dat is meer dan de limiet van ${MAX_FILE_COUNT}. Upload een kleiner project.`,
    );
  }

  const files: ProjectFiles = {};
  const warnings: string[] = [];
  let skippedTooLarge = 0;
  const teGroteFotos: string[] = [];
  const nietGelezen: string[] = [];
  let textBudget = MAX_TEXT_TOTAL_SIZE;
  let imageBudget = MAX_IMAGE_TOTAL_SIZE;

  // Ondiep eerst: de eigen code staat bovenin (main.py, scripts/), en een map
  // vol code van een ander dieper. Zo valt bij een te groot project het werk
  // van de leerling niet als eerste buiten het leesbudget.
  const volgorde = [...gekozen].sort(
    (a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path),
  );

  for (const { entry, path } of volgorde) {
    const kind = opts.classify(path);
    const isTextKind = opts.textKinds.includes(kind);
    const isImageKind = imageKinds.includes(kind);

    let content: string | null = null;
    let tooLarge = false;

    // De grootte-check staat vóór de getBytes-guard, want bij een zip zijn de
    // bytes van een te groot bestand er bewust al niet: de uitpak-filter slaat
    // die over. Zonder deze volgorde zou zo'n bestand stil buiten de analyse
    // vallen, terwijl dezelfde upload als map wél een waarschuwing geeft.
    if (isTextKind && entry.size > MAX_TEXT_FILE_SIZE) {
      tooLarge = true;
      skippedTooLarge++;
    } else if (isTextKind && entry.getBytes) {
      if (entry.size > textBudget) {
        nietGelezen.push(path);
      } else {
        content = decodeerTekst(await entry.getBytes());
        textBudget -= entry.size;
      }
    } else if (isImageKind && entry.size > MAX_IMAGE_FILE_SIZE) {
      // Een foto is bij robotica het bewijs voor een vinkje; stil weglaten
      // mag dus niet.
      tooLarge = true;
      teGroteFotos.push(path);
    } else if (isImageKind && entry.getBytes) {
      if (entry.size > imageBudget) {
        nietGelezen.push(path);
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
  if (teGroteFotos.length > 0) {
    warnings.push(
      `Niet bekeken, want groter dan ${MAX_IMAGE_FILE_SIZE / (1024 * 1024)} MB: ${opsomming(teGroteFotos)}. Maak de foto kleiner (bijvoorbeeld met een schermafbeelding) en upload opnieuw.`,
    );
  }
  if (nietGelezen.length > 0) {
    warnings.push(
      `Niet gelezen, want het project is te groot: ${opsomming(nietGelezen)}. Haal mappen die niet van jou zijn eruit en upload opnieuw.`,
    );
  }
  if (kopieen.size > 0) {
    warnings.push(
      `Niet meegeteld, want het lijkt een reservekopie: ${opsomming([...kopieen].sort())}. Hoort die map wel bij je project, geef hem dan een andere naam.`,
    );
  }
  const heic = gekozen.filter(({ path }) => HEIC.test(path)).map(({ path }) => path);
  if (imageKinds.length > 0 && heic.length > 0) {
    warnings.push(
      `Een browser kan HEIC-foto's niet tonen: ${opsomming(heic)}. Zet je telefoon op "Meest compatibel" (iPhone: Instellingen, Camera, Formaten) of stuur de foto als JPG.`,
    );
  }

  return { files, warnings };
}

/**
 * Eén ingang voor alle upload-methoden. Pakt een zip uit die de leerling zelf
 * koos, ook naast losse foto's; een zip in een map blijft dicht.
 */
export async function readUploadedFiles(
  source: FileList | File[] | DataTransferItemList,
  opts: ReadOptions,
): Promise<ReadFilesResult> {
  try {
    return await leesUpload(source, opts);
  } catch (err) {
    if (err instanceof LeesFout) throw err;
    // Een DOMException van de browser, in het Engels.
    const naam = err instanceof Error ? err.name : String(err);
    throw new LeesFout(
      `Het inlezen is mislukt (${naam}). Probeer het opnieuw, of maak een zip van je projectmap en upload die.`,
    );
  }
}

async function leesUpload(
  source: FileList | File[] | DataTransferItemList,
  opts: ReadOptions,
): Promise<ReadFilesResult> {
  const isDataTransferItems =
    typeof DataTransferItemList !== 'undefined' && source instanceof DataTransferItemList;

  const rawEntries = isDataTransferItems
    ? await collectFromDataTransferItems(source as DataTransferItemList)
    : collectFromFiles(source as FileList | File[]);

  // Alleen wat de leerling zelf koos of sleepte, niet iets uit een map.
  const losZip = (e: RawEntry) => !e.relativePath.includes('/') && /\.zip$/i.test(e.relativePath);
  const losArchief = (e: RawEntry) =>
    !e.relativePath.includes('/') && ANDER_ARCHIEF.test(e.relativePath);

  const archieven = rawEntries.filter(losArchief).map((e) => e.relativePath);
  if (archieven.length > 0 && archieven.length === rawEntries.length) {
    throw new LeesFout(
      `De nakijker kan alleen een .zip openen, en ${opsomming(archieven)} is een ander soort archief. Pak het uit en upload de map, of maak er een .zip van.`,
    );
  }

  const alles: RawEntry[] = [];
  const zips = rawEntries.filter(losZip);
  for (const e of rawEntries) {
    if (losArchief(e)) continue;
    if (!losZip(e)) {
      alles.push(e);
      continue;
    }
    if (!e.getBytes) throw new LeesFout(`Kon ${e.relativePath} niet lezen.`);
    const uitgepakt = await unzipToRawEntries(new File([await e.getBytes()], e.relativePath), opts);
    // Eén zip: zijn inhoud is het project. Meer bestanden: elke zip een eigen
    // map, zodat twee zips elkaars bestanden niet overschrijven.
    const voor =
      rawEntries.length === 1 ? '' : zips.length > 1 ? `${e.relativePath.slice(0, -4)}/` : '';
    for (const u of uitgepakt) alles.push({ ...u, relativePath: `${voor}${u.relativePath}` });
  }

  const resultaat = await entriesToProjectFiles(alles, opts);
  if (archieven.length > 0) {
    resultaat.warnings.push(
      `Niet geopend: ${opsomming(archieven)}. De nakijker kan alleen een .zip openen; pak het uit of maak er een .zip van.`,
    );
  }
  return resultaat;
}
