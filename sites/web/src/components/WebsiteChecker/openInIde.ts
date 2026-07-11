import { SITES_BY_ID } from '@coderius/shared/sites';
import type { ProjectFiles } from './types';

// Stuurt het geüploade project naar een nieuw tabblad op ide.coderius.nl,
// puur client-side (window.open + postMessage — geen server tussenin). De
// ouder blijft pollen tot het kind een ack terugstuurt, in plaats van te
// wachten op window.opener in het kind: dat werkt betrouwbaar ongeacht
// Cross-Origin-Opener-Policy-instellingen, omdat de ouder zijn eigen
// window.open()-handle gebruikt.
const IDE_URL = SITES_BY_ID.ide.url;
const MESSAGE_SOURCE = 'coderius-website-checker';
const ACK_SOURCE = 'coderius-editor-import';
const POLL_INTERVAL_MS = 300;
const TIMEOUT_MS = 15000;

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

// html/css/js komen als platte tekst binnen, afbeeldingen als data:-URL
// (zie readFiles.ts) — 'other' blijft altijd null. Voor beide volstaat het
// dus om simpelweg elk bestand met inhoud mee te sturen.
function buildTransferFiles(files: ProjectFiles): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [path, file] of Object.entries(files)) {
    if (file.content !== null) result[path] = file.content;
  }
  return result;
}

export type OpenInIdeResult = 'opened' | 'blocked' | 'timeout';

export function openInIde(
  files: ProjectFiles,
  projectName: string,
  onResult: (result: OpenInIdeResult) => void,
): void {
  const entry = pickEntry(files);
  if (!entry) return;

  const win = window.open(`${IDE_URL}/import`, '_blank');
  if (!win) {
    onResult('blocked');
    return;
  }

  const payload = {
    source: MESSAGE_SOURCE,
    type: 'import-files' as const,
    files: buildTransferFiles(files),
    entry,
    name: projectName,
  };

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

  const interval = window.setInterval(() => {
    if (win.closed) {
      finish('timeout');
      return;
    }
    win.postMessage(payload, IDE_URL);
  }, POLL_INTERVAL_MS);

  const timer = window.setTimeout(() => finish('timeout'), TIMEOUT_MS);

  window.addEventListener('message', onMessage);
  win.postMessage(payload, IDE_URL);
}
