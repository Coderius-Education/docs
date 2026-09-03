import type { ProjectFiles } from '../types';

// Stuurt het geüploade project naar een nieuw tabblad op de IDE, puur
// client-side (window.open + postMessage — geen server tussenin). De ouder
// blijft pollen tot het kind een ack terugstuurt; dat werkt betrouwbaar
// ongeacht Cross-Origin-Opener-Policy, omdat de ouder zijn eigen
// window.open()-handle gebruikt. De message-source blijft
// 'coderius-website-checker' zodat het bestaande /import-contract op
// ide.coderius.nl blijft werken.
// Wire-waarden van het /import-contract; de ontvanger staat in
// sites/ide/src/components/ImportProject/importContract.ts. Beide kanten pinnen
// ze in hun tests, zodat een wijziging aan één kant niet stil blijft.
export const MESSAGE_SOURCE = 'coderius-website-checker';
export const ACK_SOURCE = 'coderius-editor-import';
const POLL_INTERVAL_MS = 300;
const TIMEOUT_MS = 15000;

/**
 * Momenten (ms na openen) waarop het project opnieuw wordt gepost: op
 * verdubbelende afstand vanaf het polinterval tot de timeout. Zo krijgt een
 * tabblad dat traag laadt tot het einde een kans (de laatste herpost valt na
 * negen seconden), zonder dat een groot project vijftig keer over de lijn
 * gaat. Een vaste bovengrens van tien herposts dekte maar drie seconden.
 */
export function herpostMomenten(interval = POLL_INTERVAL_MS, timeout = TIMEOUT_MS): number[] {
  const momenten: number[] = [];
  let wacht = interval;
  let t = interval;
  while (t < timeout) {
    momenten.push(t);
    wacht *= 2;
    t += wacht;
  }
  return momenten;
}
// Het bericht gaat meteen bij het openen, en daarna hooguit zo vaak opnieuw
// (om de POLL_INTERVAL_MS) zolang het ack uitblijft. Daarna wordt alleen nog
// gekeken of het tabblad dicht is: het hele project 50 keer over de lijn
// sturen is zinloos als de IDE na een paar seconden nog niet luistert.

/** Kies het startbestand (index.html op de kortste diepte, anders eerste .html). */
export function pickEntry(files: ProjectFiles): string | null {
  const htmlPaths = Object.keys(files).filter((p) => files[p].kind === 'html');
  if (htmlPaths.length === 0) return null;
  const rootIndex = htmlPaths.find((p) => p.toLowerCase() === 'index.html');
  if (rootIndex) return rootIndex;
  const nestedIndex = htmlPaths
    .filter((p) => p.toLowerCase().endsWith('/index.html'))
    .sort((a, b) => a.split('/').length - b.split('/').length)[0];
  if (nestedIndex) return nestedIndex;
  return htmlPaths.slice().sort()[0];
}

// Tekst-inhoud gaat als string mee, afbeeldingen als data:-URL (zie
// readFiles.ts); 'other' blijft null. Elk bestand met inhoud wordt meegestuurd.
function buildTransferFiles(files: ProjectFiles): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [path, file] of Object.entries(files)) {
    if (file.content !== null) result[path] = file.content;
  }
  return result;
}

export interface ImportPayload {
  source: typeof MESSAGE_SOURCE;
  type: 'import-files';
  files: Record<string, string>;
  entry: string;
  name: string;
}

/** Het bericht dat naar /import gaat, of null als er geen startbestand is. */
export function buildImportPayload(files: ProjectFiles, projectName: string): ImportPayload | null {
  const entry = pickEntry(files);
  if (!entry) return null;
  return {
    source: MESSAGE_SOURCE,
    type: 'import-files',
    files: buildTransferFiles(files),
    entry,
    name: projectName,
  };
}

export type OpenInIdeResult = 'opened' | 'blocked' | 'timeout';

export function openInIde(
  files: ProjectFiles,
  projectName: string,
  ideUrl: string,
  onResult: (result: OpenInIdeResult) => void,
): void {
  const payload = buildImportPayload(files, projectName);
  if (!payload) return;

  const win = window.open(`${ideUrl}/import`, '_blank');
  if (!win) {
    onResult('blocked');
    return;
  }

  let settled = false;
  const finish = (result: OpenInIdeResult) => {
    if (settled) return;
    settled = true;
    window.clearInterval(interval);
    window.clearTimeout(timer);
    window.removeEventListener('message', onMessage);
    onResult(result);
  };

  function onMessage(event: MessageEvent) {
    if (event.source !== win) return;
    if (event.data?.source !== ACK_SOURCE || event.data.type !== 'ack') return;
    finish('opened');
  }

  const momenten = herpostMomenten();
  let verstreken = 0;
  let volgende = 0;
  const interval = window.setInterval(() => {
    if (win.closed) {
      finish('timeout');
      return;
    }
    verstreken += POLL_INTERVAL_MS;
    if (volgende < momenten.length && verstreken >= momenten[volgende]) {
      volgende += 1;
      win.postMessage(payload, ideUrl);
    }
  }, POLL_INTERVAL_MS);

  const timer = window.setTimeout(() => finish('timeout'), TIMEOUT_MS);

  window.addEventListener('message', onMessage);
  win.postMessage(payload, ideUrl);
}
