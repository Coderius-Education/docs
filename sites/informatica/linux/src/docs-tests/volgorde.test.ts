import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';
import { EERSTE_LES } from '../components/LinuxTerminal/commandos';

// Geen les gebruikt een commando vóór de les die het uitlegt (commandos.js).
// De leerling-doorloop vond dat 1.3 drie keer `cat` gebruikte, twee lessen
// voor 2.1, en dat 5.3 `sudo apt` gebruikte voor 6.1. Een vooruitwijzing mag:
// dan linkt dezelfde alinea naar de les waar het commando aan bod komt. In
// een bash-blok mag het niet; dat typt de leerling.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Categorie = { type: 'category'; label: string; items: string[] };
const themas = (sidebars.linuxSidebar as unknown as (string | Categorie)[]).filter(
  (i): i is Categorie => typeof i !== 'string',
);
const lessen = themas.flatMap((t) => t.items);
const plek = new Map(lessen.map((id, i) => [id, i]));
const nummer = new Map(
  themas.flatMap((t, ti) => t.items.map((id, li) => [id, `${ti + 1}.${li + 1}`] as const)),
);

type Gebruik = { commando: string; inCode: boolean; alinea: string };

/** De commando's in een regel: het eerste woord van elk stuk, en na sudo ook het volgende. */
function commandosIn(regel: string): string[] {
  return regel
    .split(/;|&&|\|\||\|/)
    .flatMap((stuk) => {
      const w = stuk.trim().split(/\s+/);
      return w[0] === 'sudo'
        ? ['sudo', w.find((x, i) => i > 0 && !x.startsWith('-')) ?? '']
        : [w[0]];
    })
    .filter((c) => c && Object.hasOwn(EERSTE_LES, c));
}

function gebruik(id: string): Gebruik[] {
  const tekst = readFileSync(`${DOCS}/${id}.mdx`, 'utf8').replace(/^---[\s\S]*?---/, '');
  const uit: Gebruik[] = [];
  const delen = tekst.split(/^(```[a-z]*\n[\s\S]*?^```)\s*$/m);
  for (const deel of delen) {
    if (deel.startsWith('```')) {
      if (!deel.startsWith('```bash')) continue;
      for (const regel of deel.split('\n').slice(1, -1)) {
        if (regel.trim().startsWith('#')) continue;
        for (const c of commandosIn(regel)) uit.push({ commando: c, inCode: true, alinea: deel });
      }
      continue;
    }
    for (const alinea of deel.split(/\n\s*\n/)) {
      for (const m of alinea.matchAll(/`([^`\n]+)`/g)) {
        for (const c of commandosIn(m[1])) uit.push({ commando: c, inCode: false, alinea });
      }
    }
  }
  return uit;
}

describe('de volgorde van de commando’s', () => {
  it('de tabel klopt met de sidebar: elk nummer hoort bij zijn pagina', () => {
    const fout = Object.entries(EERSTE_LES)
      .filter(([, { les, pagina }]) => nummer.get(pagina) !== les)
      .map(([c, { les, pagina }]) => `${c}: ${les} maar ${pagina} is ${nummer.get(pagina)}`);
    expect(fout).toEqual([]);
  });

  it('elk commando komt voor in de les die het uitlegt', () => {
    const fout = Object.entries(EERSTE_LES)
      .filter(([c, { pagina }]) => !gebruik(pagina).some((g) => g.commando === c))
      .map(([c, { pagina }]) => `${c} niet in ${pagina}`);
    expect(fout).toEqual([]);
  });

  it('geen les gebruikt een commando vóór zijn les, tenzij de alinea ernaar linkt', () => {
    const fout: string[] = [];
    for (const id of lessen) {
      for (const g of gebruik(id)) {
        const { les, pagina } = EERSTE_LES[g.commando as keyof typeof EERSTE_LES];
        if ((plek.get(id) ?? 0) >= (plek.get(pagina) ?? 0)) continue;
        if (!g.inCode && g.alinea.includes(`(site:linux/docs/${pagina}`)) continue;
        fout.push(`${nummer.get(id)} ${id}: ${g.commando} (komt pas in ${les})`);
      }
    }
    expect([...new Set(fout)]).toEqual([]);
  });
});
