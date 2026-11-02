/**
 * De regel waarin je typt, los van xterm, zodat het in node te testen is.
 *
 * Een stand is { tekst, cursor, terug, concept, tabNet }: wat er staat, waar
 * de cursor staat, hoe ver je met pijltje omhoog terug bent in de
 * geschiedenis (0 = niet), wat je typte voordat je terugging, en of de vorige
 * toets een Tab was (de tweede Tab toont wat er past).
 *
 * toets() geeft de nieuwe stand en wat de terminal moet doen:
 *   'uitvoeren' (Enter), 'afbreken' (Ctrl+C), 'leeg' (Ctrl+L), 'opties' (een
 *   tweede Tab met meer dan één mogelijkheid), of null.
 */

export const LEEG = { tekst: '', cursor: 0, terug: 0, concept: '', tabNet: false };

const invoegen = (s, stuk) => ({
  ...s,
  tekst: s.tekst.slice(0, s.cursor) + stuk + s.tekst.slice(s.cursor),
  cursor: s.cursor + stuk.length,
});

/**
 * @param {typeof LEEG} s
 * @param {string} data  één toets (een teken of een escape-reeks van xterm)
 * @param {{ geschiedenis: string[], aanvullen: (voor: string) => { invoegen: string, opties: string[] } }} sessie
 */
export function toets(s, data, sessie) {
  const tab = data === '\t';
  const st = { ...s, tabNet: tab };

  if (data === '\r' || data === '\n') return { stand: st, actie: 'uitvoeren' };
  if (data === '\x03') return { stand: st, actie: 'afbreken' };
  if (data === '\x0c') return { stand: st, actie: 'leeg' };

  if (tab) {
    const { invoegen: stuk, opties } = sessie.aanvullen(s.tekst.slice(0, s.cursor));
    if (stuk) return { stand: invoegen(st, stuk), actie: null };
    if (opties.length > 1 && s.tabNet) return { stand: st, actie: 'opties', opties };
    return { stand: st, actie: null };
  }

  // Backspace
  if (data === '\x7f' || data === '\b') {
    if (s.cursor === 0) return { stand: st, actie: null };
    return {
      stand: {
        ...st,
        tekst: s.tekst.slice(0, s.cursor - 1) + s.tekst.slice(s.cursor),
        cursor: s.cursor - 1,
      },
      actie: null,
    };
  }
  // Delete
  if (data === '\x1b[3~') {
    return {
      stand: { ...st, tekst: s.tekst.slice(0, s.cursor) + s.tekst.slice(s.cursor + 1) },
      actie: null,
    };
  }
  // Ctrl+U: alles voor de cursor weg, zoals in bash.
  if (data === '\x15') {
    return { stand: { ...st, tekst: s.tekst.slice(s.cursor), cursor: 0 }, actie: null };
  }
  if (data === '\x1b[D')
    return { stand: { ...st, cursor: Math.max(0, s.cursor - 1) }, actie: null };
  if (data === '\x1b[C')
    return { stand: { ...st, cursor: Math.min(s.tekst.length, s.cursor + 1) }, actie: null };
  if (data === '\x1b[H' || data === '\x1bOH' || data === '\x01')
    return { stand: { ...st, cursor: 0 }, actie: null };
  if (data === '\x1b[F' || data === '\x1bOF' || data === '\x05')
    return { stand: { ...st, cursor: s.tekst.length }, actie: null };

  // Pijltje omhoog en omlaag: door de geschiedenis.
  if (data === '\x1b[A' || data === '\x1b[B') {
    const alles = sessie.geschiedenis;
    const terug =
      data === '\x1b[A' ? Math.min(alles.length, s.terug + 1) : Math.max(0, s.terug - 1);
    if (terug === s.terug) return { stand: st, actie: null };
    const concept = s.terug === 0 ? s.tekst : s.concept;
    const tekst = terug === 0 ? concept : alles[alles.length - terug];
    return { stand: { ...st, tekst, cursor: tekst.length, terug, concept }, actie: null };
  }

  // Een gewoon teken; andere escape-reeksen negeren we.
  if (data.startsWith('\x1b') || data.charCodeAt(0) < 32) return { stand: st, actie: null };
  return { stand: invoegen(st, data), actie: null };
}

/**
 * Waar de cursor hoort te staan, als rij (vanaf de rij van de prompt) en
 * kolom, bij een regel die over meer schermregels loopt. `prompt` is het
 * aantal tekens van de prompt zonder kleurcodes.
 */
export function plekVan(prompt, cursor, kolommen) {
  const n = prompt + cursor;
  return { rij: Math.floor(n / kolommen), kolom: n % kolommen };
}

/**
 * De escape-reeks die de cursor van rij `van` naar rij `naar` en kolom
 * `kolom` brengt. Omhoog met CSI A; omlaag met regeleinden, want CSI B
 * stopt onderaan het scherm en een regel die net vol is, staat daar nog
 * niet op de volgende rij.
 */
export function verplaats(van, naar, kolom) {
  const rijen = naar < van ? `\x1b[${van - naar}A` : '\r\n'.repeat(naar - van);
  return `${rijen}\r${kolom > 0 ? `\x1b[${kolom}C` : ''}`;
}

/** De zichtbare lengte van een tekst met kleurcodes. */
export function zichtbaar(tekst) {
  return tekst.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g'), '').length;
}

/**
 * Tekst in regels van hoogstens `kolommen` tekens, afgebroken tussen woorden,
 * elke regel met `inspring` ervoor. xterm breekt een te lange regel af op de
 * rand, ook midden in een woord: op een telefoon stond er eerst
 * "Typ help voor een lijst met comman" en op de volgende regel "do's.".
 */
export function omKolommen(tekst, kolommen, inspring = '  ') {
  const ruimte = Math.max(kolommen - inspring.length, 1);
  const regels = [];
  let regel = '';
  for (const woord of tekst.split(/\s+/).filter(Boolean)) {
    if (regel && regel.length + 1 + woord.length > ruimte) {
      regels.push(regel);
      regel = woord;
    } else regel = regel ? `${regel} ${woord}` : woord;
  }
  if (regel) regels.push(regel);
  return regels.map((r) => inspring + r);
}
