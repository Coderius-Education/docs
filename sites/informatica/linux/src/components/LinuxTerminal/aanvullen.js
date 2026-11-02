/**
 * Tab in de oefenterminal, zoals bash het doet.
 *
 * Het laatste woord voor de cursor wordt aangevuld: het eerste woord met een
 * commando, de rest met een naam in de map (een pad mag, ook met ~). Past er
 * één ding, dan komt het er helemaal te staan, met een / achter een map en een
 * spatie achter de rest. Passen er meer, dan vult Tab aan tot waar ze
 * verschillen. Kan dat niet verder, dan doet de eerste Tab niets en toont de
 * tweede wat er past (`opties`), net als in bash.
 */

import { COMMANDONAMEN } from './commands';
import { getNode, resolvePath } from './filesystem';

const gemeenschappelijk = (namen) =>
  namen.reduce((pre, naam) => {
    let i = 0;
    while (i < pre.length && pre[i] === naam[i]) i++;
    return pre.slice(0, i);
  });

/**
 * @param {string} voor  de regel tot de cursor
 * @param {{ fs: object, cwd: string }} env
 * @returns {{ invoegen: string, opties: string[] }} wat er bij de cursor bij
 *   komt, en wat er past als dat niets is (voor een tweede Tab)
 */
export function vulAan(voor, env) {
  const woord = voor.match(/(?:^|[\s;|&])([^\s;|&]*)$/)?.[1] ?? '';
  const ervoor = voor.slice(0, voor.length - woord.length);
  const eersteWoord = /^\s*$|[;|&]\s*$/.test(ervoor);

  let kandidaten;
  let stuk;
  if (eersteWoord && !woord.includes('/')) {
    stuk = woord;
    kandidaten = COMMANDONAMEN.filter((c) => c.startsWith(woord)).map((c) => ({
      naam: c,
      isMap: false,
    }));
  } else {
    const slash = woord.lastIndexOf('/');
    const map = slash === -1 ? '' : woord.slice(0, slash + 1);
    stuk = woord.slice(slash + 1);
    const plek = getNode(env.fs, map ? resolvePath(env.cwd, map) : env.cwd);
    if (!plek.isDir) return { invoegen: '', opties: [] };
    kandidaten = Object.keys(plek.node)
      .sort()
      .filter((n) => n.startsWith(stuk) && (stuk.startsWith('.') || !n.startsWith('.')))
      .map((n) => {
        const kind = plek.node[n];
        return { naam: n, isMap: kind !== null && typeof kind === 'object' };
      });
  }

  if (kandidaten.length === 0) return { invoegen: '', opties: [] };
  if (kandidaten.length === 1) {
    const [k] = kandidaten;
    return { invoegen: k.naam.slice(stuk.length) + (k.isMap ? '/' : ' '), opties: [] };
  }
  const pre = gemeenschappelijk(kandidaten.map((k) => k.naam));
  if (pre.length > stuk.length) return { invoegen: pre.slice(stuk.length), opties: [] };
  return { invoegen: '', opties: kandidaten.map((k) => k.naam + (k.isMap ? '/' : '')) };
}
