import type { Project } from '@coderius/editor/vfs/types';
import { SITES_BY_ID } from '@coderius/shared/sites';

// Het /import-contract met de Website-checker (de zender staat in
// packages/checker/src/Checker/openInIde.ts). Dit zijn wire-waarden tussen twee
// apart gedeployde sites (/web/ -> /ide/ op de vak-host): wie er één
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

// Alleen de checker zelf, of een lokale dev-server. Sinds de cursussen onder
// een pad van de vak-host staan, delen alle informatica-cursussen één origin
// (https://informatica.coderius.nl); de origin alleen zegt dus niet meer dat
// het de web-cursus is. Daarom twee eisen (zie isAllowedSender):
//  1. de origin is die van de web-cursus (of een lokale dev-server), en
//  2. de afzender is het venster dat deze /import-pagina opende (opener), en
//     dat venster staat op een pagina van de web-cursus (pad onder /web/).
// Elke andere pagina op de vak-host, ook een les die leerling-HTML draait,
// valt daarmee af.
export const WEB_ORIGIN = new URL(SITES_BY_ID.web.url).origin;
/** Pad van de web-cursus op de vak-host, bv. '/web/'. */
export const WEB_PAD = new URL(SITES_BY_ID.web.url).pathname;

export function isAllowedOrigin(origin: string): boolean {
  return origin === WEB_ORIGIN || origin.startsWith('http://localhost:');
}

/** Het deel van een venster dat isAllowedSender nodig heeft. */
export interface Afzender {
  location: { pathname: string };
}

/**
 * Komt dit bericht van de Website-checker die deze pagina opende? `source`
 * is event.source, `opener` is window.opener. Zelfde origin, dus het pad van
 * de opener is leesbaar; bij een andere origin gooit dat, en dan: nee.
 */
export function isAllowedSender(
  origin: string,
  source: unknown,
  opener: Afzender | null | undefined,
): boolean {
  if (!isAllowedOrigin(origin)) return false;
  if (!opener || source !== opener) return false;
  if (origin.startsWith('http://localhost:')) return true;
  try {
    return opener.location.pathname.startsWith(WEB_PAD);
  } catch {
    return false;
  }
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
