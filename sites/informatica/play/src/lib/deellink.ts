/**
 * De deellink van de speeltuin: de code staat als `code=…` in de URL-hash.
 *
 * Formaat (nieuw): `u8-` + base64 van de UTF-8-bytes van de code. Het oude
 * `btoa(encodeURIComponent(code))` omzeilde de Latin-1-grens van btoa, maar
 * encodeURIComponent gooit een URIError op een losse surrogate (een halve
 * emoji, die een editor tijdens het typen of plakken even kan bevatten). Die
 * exception verdween in een lege `catch {}` en de link hield stilletjes op met
 * bijwerken. TextEncoder gooit nooit, en de link wordt bovendien korter: geen
 * `%C3%A9` van drie tekens per byte meer.
 *
 * Herkenningsregel voor oude links: het oude formaat was
 * `btoa(encodeURIComponent(code))`, en btoa produceert alleen tekens uit het
 * base64-alfabet (`A-Z a-z 0-9 + / =`). Een `-` op de vierde plek kan dus
 * nooit een oude link zijn. Begint de waarde met `u8-`, dan is het het nieuwe
 * formaat; alles anders wordt als oud gelezen.
 */

const PREFIX = 'u8-';

function bytesNaarBase64(bytes: Uint8Array): string {
  // Geen spread in String.fromCharCode: dat loopt bij lange code tegen de
  // argumentenlimiet aan.
  let binair = '';
  for (const byte of bytes) binair += String.fromCharCode(byte);
  return btoa(binair);
}

function base64NaarBytes(base64: string): Uint8Array {
  const binair = atob(base64);
  const bytes = new Uint8Array(binair.length);
  for (let i = 0; i < binair.length; i++) bytes[i] = binair.charCodeAt(i);
  return bytes;
}

/** Codeert de code voor de `code`-parameter in de hash. Gooit nooit. */
export function codeerDeelLink(code: string): string {
  return PREFIX + bytesNaarBase64(new TextEncoder().encode(code));
}

/**
 * Leest de waarde van de `code`-parameter terug. Geeft `null` als de waarde
 * in geen van beide formaten te ontcijferen is.
 */
export function decodeerDeelLink(hash: string): string | null {
  try {
    if (hash.startsWith(PREFIX)) {
      // fatal: een kapotte byte-reeks is een kapotte link, geen vervangteken.
      return new TextDecoder('utf-8', { fatal: true }).decode(
        base64NaarBytes(hash.slice(PREFIX.length)),
      );
    }
    return decodeURIComponent(atob(hash));
  } catch {
    return null;
  }
}
