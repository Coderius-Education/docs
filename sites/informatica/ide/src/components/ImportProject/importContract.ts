import type { Project } from '@coderius/editor/vfs/types';
import { SITES_BY_ID } from '@coderius/shared/sites';

// Het /import-contract met de Website-checker (de zender staat in
// packages/checker/src/Checker/openInIde.ts). Dit zijn wire-waarden tussen twee
// apart gedeployde sites (web.coderius.nl -> ide.coderius.nl): wie er één
// wijzigt, wijzigt ze aan beide kanten en deployt samen. Er is bewust geen
// gedeelde constante — de tests hier en in openInIde.test.ts pinnen de
// letterlijke strings, zodat een wijziging aan één kant niet stil blijft.
export const MESSAGE_SOURCE = 'coderius-website-checker';
export const MESSAGE_TYPE = 'import-files';
export const ACK_MESSAGE = { source: 'coderius-editor-import', type: 'ack' } as const;
export const DEFAULT_PROJECT_NAME = 'Vanuit Website-checker';

export interface ImportMessage {
  entry: string;
  // Pad -> tekstinhoud, of een data:-URL voor afbeeldingen (zie readFiles.ts
  // in de checker).
  files: Record<string, string>;
  name?: string;
}

// Alleen de checker zelf, of een lokale dev-server. Een exacte vergelijking
// met de registry-URL: die moet dus origin-vormig zijn (schema + host, geen
// slash erachter).
export function isAllowedOrigin(origin: string): boolean {
  return origin === SITES_BY_ID.web.url || origin.startsWith('http://localhost:');
}

// postMessage levert wat dan ook af (andere extensies, andere tabbladen), dus
// alles wat niet precies het contract volgt wordt stil genegeerd.
export function parseImportMessage(data: unknown, origin: string): ImportMessage | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.source !== MESSAGE_SOURCE || d.type !== MESSAGE_TYPE) return null;
  if (!isAllowedOrigin(origin)) return null;
  if (typeof d.entry !== 'string' || typeof d.files !== 'object' || d.files === null) return null;
  return {
    entry: d.entry,
    files: d.files as Record<string, string>,
    name: typeof d.name === 'string' ? d.name : undefined,
  };
}

export function projectFromImport(msg: ImportMessage, id: string, now: number): Project {
  return {
    id,
    name: msg.name ? msg.name : DEFAULT_PROJECT_NAME,
    runnerId: 'web',
    entry: msg.entry,
    files: msg.files,
    folders: [],
    createdAt: now,
    updatedAt: now,
  };
}
