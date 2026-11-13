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

/** De les zonder wat in een uitklapblok staat: dat ziet een leerling pas als hij het opent. */
const zonderUitklapblokken = (tekst: string) => tekst.replace(/<details>[\s\S]*?<\/details>/g, '');

/**
 * Commando's die de leerling in een opdracht zelf moet vinden: die staan met
 * opzet alleen in het antwoord. Elk met de opdracht en hoe hij het vindt.
 */
const ZELF_VINDEN: Record<string, string> = {
  hostname: '1.1.a: de leerling zoekt het op met help',
  uname: '1.1.a: de leerling zoekt het op met help',
  sort: '5.3.b: de leerling zoekt het op met apropos',
};

function gebruik(id: string, { open = true }: { open?: boolean } = {}): Gebruik[] {
  const bron = readFileSync(`${DOCS}/${id}.mdx`, 'utf8').replace(/^---[\s\S]*?---/, '');
  const tekst = open ? bron : zonderUitklapblokken(bron);
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

/**
 * De opties uit een zin als "Net als bij `rm` heb je `-r` nodig" die de les
 * van dat commando niet noemt, als "commando -optie".
 */
function verkeerdeVergelijkingen(tekst: string): string[] {
  const uit: string[] = [];
  for (const zin of tekst.split(/(?<=[.:;])\s+/)) {
    const m = /[Nn]et als bij `([a-z]+)`/.exec(zin);
    if (!m || !Object.hasOwn(EERSTE_LES, m[1])) continue;
    const { pagina } = EERSTE_LES[m[1] as keyof typeof EERSTE_LES];
    const les = readFileSync(`${DOCS}/${pagina}.mdx`, 'utf8');
    for (const [, optie] of zin.matchAll(/`(-[a-zA-Z]+)`/g)) {
      if (!new RegExp(`\\b${m[1]} ${optie}\\b`).test(les)) uit.push(`${m[1]} ${optie}`);
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

  it('een commando dat alleen in een uitklapblok staat, is niet uitgelegd', () => {
    // In 5.4 stonden `export` en `printenv` alleen in het antwoord van de
    // voorspelvraag, en begon het tabblad erna met "Typ je die elke keer met
    // export". Wie het antwoord niet opende, miste de kern van de les. Een
    // tip, een antwoord en het antwoord van Voorspel tellen dus niet mee.
    const fout = Object.entries(EERSTE_LES)
      .filter(([c]) => !Object.hasOwn(ZELF_VINDEN, c))
      .filter(([c, { pagina }]) => !gebruik(pagina, { open: false }).some((g) => g.commando === c))
      .map(([c, { pagina }]) => `${c} staat in ${pagina} alleen in een uitklapblok`);
    expect(fout).toEqual([]);
    // Een uitzondering die niet meer nodig is, is een oude regel.
    const onnodig = Object.keys(ZELF_VINDEN).filter((c) => {
      const { pagina } = EERSTE_LES[c as keyof typeof EERSTE_LES];
      return gebruik(pagina, { open: false }).some((g) => g.commando === c);
    });
    expect(onnodig).toEqual([]);
  });

  it('de regel ziet een commando in een uitklapblok niet', () => {
    expect(
      zonderUitklapblokken('a\n<details>\n<summary>x</summary>\n`export A=1`\n</details>\nb'),
    ).toBe('a\n\nb');
  });

  it('"net als bij" een commando noemt een optie die zijn les uitlegt', () => {
    // In 7.4 stond "Net als bij `cp` heb je voor een map `-r` nodig", maar
    // geen les legt `cp -r` uit: 2.3 leert `rm -r`. Een leerling denkt dan
    // dat hij iets gemist heeft.
    expect(verkeerdeVergelijkingen('Net als bij `cp` heb je voor een map `-r` nodig.')).toEqual([
      'cp -r',
    ]);
    const fout = lessen.flatMap((id) =>
      verkeerdeVergelijkingen(readFileSync(`${DOCS}/${id}.mdx`, 'utf8')).map(
        (o) => `${nummer.get(id)} ${id}: ${o}`,
      ),
    );
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
