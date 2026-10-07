// Codeert lescode in een editor-link, zodat "Open in de editor" onder een
// codeblok de editor met precies die code kan openen. De code reist mee in
// het #hash-deel van de URL (base64 van UTF-8), dus niets bereikt de server.

const HASH_PREFIX = '#code=';

function naarBase64(tekst: string): string {
  const bytes = new TextEncoder().encode(tekst);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function vanBase64(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function maakEditorLink(code: string): string {
  return `/editor${HASH_PREFIX}${encodeURIComponent(naarBase64(code))}`;
}

/** Leest de code uit een editor-hash terug; null als er geen code in zit. */
export function leesEditorHash(hash: string): string | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  try {
    const code = vanBase64(decodeURIComponent(hash.slice(HASH_PREFIX.length)));
    // Een afgeknotte link (#code=) mag nooit de eigen code van de leerling
    // door een lege buffer vervangen.
    return code === '' ? null : code;
  } catch {
    return null;
  }
}

/**
 * Bepaalt of een python-codeblok een "Open in de editor"-link verdient.
 * Niet voor REPL-transcripten, niet voor ingesprongen fragmenten (die horen
 * ín een groter script en falen los met een IndentationError), en niet als
 * de auteur het blok met de meta `geen-editor-link` heeft gemarkeerd.
 */
export function verdientEditorLink(code: string, metastring?: string): boolean {
  if (metastring?.includes('geen-editor-link')) return false;
  if (code.includes('>>>')) return false;
  const eersteRegel = code.split('\n').find((r) => r.trim() !== '');
  if (!eersteRegel || /^\s/.test(eersteRegel)) return false;
  return true;
}
