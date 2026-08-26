import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De schrijfgids legt het opdracht-format vast (§3 en §6), maar niets
// controleerde het. Gevolg: nummers van vier niveaus (1.2.1.a), koppen die
// zichzelf nummeren, titels zonder dubbele punt, en zes formuleringen voor
// dezelfde knop. Een leerling die "Opdracht 4.1.b" zoekt omdat de docent dat
// noemt, moet die op één plek vinden.
//
// Wat hier vastligt is het formaat, niet de inhoud: welke opdracht waar staat
// blijft een redactionele keuze.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

/** Alles wat geen proza is eruit, met de regelnummers intact. */
function zonderCode(tekst: string): string {
  const leeg = (m: string) => m.replace(/[^\n]/g, ' ');
  return tekst.replace(/```[\s\S]*?```/g, leeg).replace(/code=\{`[\s\S]*?`\}/g, leeg);
}

type Pagina = { pad: string; tekst: string; proza: string };

function paginas(map = DOCS, prefix = ''): Pagina[] {
  const uit: Pagina[] = [];
  for (const entry of readdirSync(map, { withFileTypes: true })) {
    const pad = join(map, entry.name);
    if (entry.isDirectory()) uit.push(...paginas(pad, `${prefix}${entry.name}/`));
    else if (/\.mdx?$/.test(entry.name)) {
      const tekst = readFileSync(pad, 'utf8');
      uit.push({ pad: prefix + entry.name, tekst, proza: zonderCode(tekst) });
    }
  }
  return uit;
}

const PAGINAS = paginas();

type Kop = { niveau: number; tekst: string; start: number; eind: number };

function koppen(proza: string): Kop[] {
  const gevonden: Kop[] = [];
  for (const m of proza.matchAll(/^(#{1,6})\s+(.*)$/gm)) {
    gevonden.push({ niveau: m[1].length, tekst: m[2].trim(), start: m.index, eind: proza.length });
  }
  // Een sectie loopt tot de eerstvolgende kop van hetzelfde of een hoger niveau.
  for (let i = 0; i < gevonden.length; i++) {
    const volgende = gevonden.slice(i + 1).find((k) => k.niveau <= gevonden[i].niveau);
    if (volgende) gevonden[i].eind = volgende.start;
  }
  return gevonden;
}

// Jouw project is een capstone zonder hoofdstuknummer in de sidebar; een
// opdracht daar draagt geen H.S. Elke andere uitzondering hoort hier met een
// reden bij te komen, niet stilzwijgend in de test te verdwijnen.
const ZONDER_NUMMER = new Map([['jouw_project/3_startmenu.md', 'capstone zonder hoofdstuknummer']]);

const OPDRACHT_KOP = /^Opdracht (\d+)\.(\d+)\.([a-z]): \S/;

describe('opdrachten', () => {
  const opdrachten = PAGINAS.flatMap((p) =>
    koppen(p.proza)
      .filter((k) => k.tekst.startsWith('Opdracht'))
      .map((k) => ({ pagina: p, kop: k })),
  );

  it('er zijn opdrachten om te controleren', () => {
    expect(opdrachten.length).toBeGreaterThan(60);
  });

  it('heten "Opdracht <hoofdstuk>.<sectie>.<letter>: <Titel>"', () => {
    const fout = opdrachten
      .filter(({ pagina, kop }) => !ZONDER_NUMMER.has(pagina.pad) && !OPDRACHT_KOP.test(kop.tekst))
      .map(({ pagina, kop }) => `${pagina.pad}: ${kop.tekst}`);
    expect(fout).toEqual([]);
  });

  it('beginnen met een hoofdletter na de dubbele punt', () => {
    const fout = opdrachten
      .filter(({ kop }) => {
        const titel = kop.tekst.split(':').slice(1).join(':').trim();
        return titel !== '' && titel[0] !== titel[0].toUpperCase();
      })
      .map(({ pagina, kop }) => `${pagina.pad}: ${kop.tekst}`);
    expect(fout).toEqual([]);
  });

  it('dragen het hoofdstuk- en sectienummer van hun eigen pagina', () => {
    const fout: string[] = [];
    for (const { pagina, kop } of opdrachten) {
      if (ZONDER_NUMMER.has(pagina.pad)) continue;
      const h1 = pagina.proza.match(/^#\s+(\d+)\.(\d+)\s/m);
      const nummer = kop.tekst.match(OPDRACHT_KOP);
      if (!h1 || !nummer) continue;
      if (nummer[1] !== h1[1] || nummer[2] !== h1[2]) {
        fout.push(`${pagina.pad}: ${kop.tekst} hoort bij ${h1[1]}.${h1[2]}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('tellen per pagina door vanaf a, zonder gaten', () => {
    const fout: string[] = [];
    for (const pagina of PAGINAS) {
      const letters = koppen(pagina.proza)
        .map((k) => k.tekst.match(OPDRACHT_KOP)?.[3])
        .filter((l): l is string => !!l);
      const verwacht = letters.map((_, i) => String.fromCharCode(97 + i));
      if (letters.join('') !== verwacht.join('')) {
        fout.push(`${pagina.pad}: ${letters.join('') || '-'} in plaats van ${verwacht.join('')}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('hebben allemaal een uitgewerkte oplossing', () => {
    const fout = opdrachten
      .filter(({ pagina, kop }) => {
        const sectie = pagina.tekst.slice(kop.start, kop.eind);
        return !sectie.includes('<summary>Klik hier voor de oplossing.</summary>');
      })
      .map(({ pagina, kop }) => `${pagina.pad}: ${kop.tekst}`);
    expect(fout).toEqual([]);
  });
});

describe('koppen en inklapblokken', () => {
  // Een <summary> is een knop. Drie formuleringen zijn genoeg: een tip, de
  // oplossing van een opdracht, of het antwoord op een voorspel-vraag.
  const TOEGESTAAN = new Set([
    'Klik hier voor een tip.',
    'Klik hier voor de oplossing.',
    'Klik hier voor het antwoord.',
  ]);

  it('gebruiken drie vaste formuleringen voor "Klik hier"', () => {
    const fout: string[] = [];
    for (const pagina of PAGINAS) {
      for (const m of pagina.proza.matchAll(/<summary>\s*(Klik hier[^<]*?)\s*<\/summary>/g)) {
        if (!TOEGESTAAN.has(m[1])) fout.push(`${pagina.pad}: ${m[1]}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('nummeren zichzelf niet onder H1', () => {
    const fout: string[] = [];
    for (const pagina of PAGINAS) {
      for (const kop of koppen(pagina.proza)) {
        if (kop.niveau > 1 && /^\d+\.\d+/.test(kop.tekst)) {
          fout.push(`${pagina.pad}: ${'#'.repeat(kop.niveau)} ${kop.tekst}`);
        }
      }
    }
    expect(fout).toEqual([]);
  });
});
