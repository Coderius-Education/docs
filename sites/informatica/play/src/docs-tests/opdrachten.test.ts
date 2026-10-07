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

// Een tip hoort erbij, behalve waar de opdracht zelf het onderzoek ís: probeer
// deze drie waarden en kijk wat er gebeurt, of voorspel het type en controleer
// het. Een tip zou daar het antwoord weggeven. Elke uitzondering staat hier met
// zijn reden, zodat een nieuwe opdracht zonder tip een keuze is en geen
// vergissing.
const ZONDER_TIP = new Map([
  ['Opdracht 1.2.b', 'voorspel-vraag; een tip verklapt de uitkomst'],
  ['Opdracht 2.2.a', 'redeneervraag; de tip zou het antwoord zijn'],
  ['Opdracht 2.2.b', 'voorspellen en daarna zelf controleren met physics_info()'],
  ['Opdracht 4.1.a', 'uitvoeren en waarnemen wat er gebeurt'],
  ['Opdracht 5.1.a', 'uitvoeren en waarnemen wat er gebeurt'],
  ['Opdracht 10.1.a', 'twee getallen aanpassen in het voorbeeld er direct boven'],
  ['Opdracht 10.2.a', 'drie kleuren uitproberen in het voorbeeld er direct boven'],
  ['Opdracht 10.2.b', 'zelfde voorbeeld met een andere kleur en titel'],
  ['Opdracht 10.5.a', 'zelfde voorbeeld met een andere tekst'],
  ['Opdracht 10.7.a', 'terugzoekvragen; de tip zou het antwoord zijn'],
  ['Opdracht 10.8.a', 'drie waarden uitproberen en waarnemen'],
  ['Opdracht 10.9.a', 'drie waarden uitproberen en waarnemen'],
]);

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

  it('hebben een tip, of staan met reden in ZONDER_TIP', () => {
    const fout = opdrachten
      .filter(({ pagina, kop }) => {
        const nummer = kop.tekst.split(':')[0].trim();
        if (ZONDER_TIP.has(nummer)) return false;
        const sectie = pagina.tekst.slice(kop.start, kop.eind);
        return !sectie.includes('<summary>Klik hier voor een tip.</summary>');
      })
      .map(({ pagina, kop }) => `${pagina.pad}: ${kop.tekst}`);
    expect(fout).toEqual([]);
  });

  it('staan niet voor niets in ZONDER_TIP', () => {
    // Een uitzondering die z'n tip inmiddels wél heeft, hoort uit de lijst.
    const overbodig = opdrachten
      .filter(({ pagina, kop }) => {
        const nummer = kop.tekst.split(':')[0].trim();
        return (
          ZONDER_TIP.has(nummer) &&
          pagina.tekst
            .slice(kop.start, kop.eind)
            .includes('<summary>Klik hier voor een tip.</summary>')
        );
      })
      .map(({ kop }) => kop.tekst.split(':')[0].trim());
    expect(overbodig).toEqual([]);
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

// De sidebar en de titels vertellen hetzelfde verhaal op twee plekken: het
// hoofdstuknummer staat in `_category_.json`, het sectienummer in de
// frontmatter, en allebei staan ze nog eens in de H1. Toen pygame-ce van
// hoofdstuk 7 naar 10 verhuisde moesten er dertig van die getallen mee, en met
// de hand is dat precies één vergeten regel van "10.4 Beweging" onder kopje 9.
// Deze test legt de drie naast elkaar.
describe('hoofdstuknummering', () => {
  type Les = { pad: string; map: string; hoofdstuk: string; sectie: number; h1: string };

  const lessen: Les[] = [];
  for (const pagina of PAGINAS) {
    const map = pagina.pad.includes('/') ? pagina.pad.split('/')[0] : '';
    if (!map) continue;
    let label: string;
    try {
      label = JSON.parse(readFileSync(join(DOCS, map, '_category_.json'), 'utf8')).label ?? '';
    } catch {
      continue;
    }
    // Installatie, Jouw project en Voor de docent dragen geen hoofdstuknummer.
    const nummer = label.match(/^(\d+)\./);
    if (!nummer) continue;
    const kop = pagina.tekst.match(/^#\s+(.*)$/m);
    const positie = pagina.tekst.replace(/^﻿/, '').match(/^sidebar_position:\s*(\d+)/m);
    lessen.push({
      pad: pagina.pad,
      map,
      hoofdstuk: nummer[1],
      sectie: positie ? Number(positie[1]) : Number.NaN,
      h1: kop ? kop[1].trim() : '',
    });
  }

  it('er zijn genummerde hoofdstukken om te controleren', () => {
    expect(lessen.length).toBeGreaterThan(30);
  });

  it('dragen in hun H1 het hoofdstuk van hun sidebar-categorie', () => {
    const fout = lessen
      .filter((l) => !new RegExp(`^${l.hoofdstuk}\\.\\d+\\s`).test(l.h1))
      .map((l) => `${l.pad}: hoofdstuk ${l.hoofdstuk}, maar H1 is "${l.h1}"`);
    expect(fout).toEqual([]);
  });

  it('dragen in hun H1 het sectienummer van hun sidebar_position', () => {
    const fout = lessen
      .filter((l) => l.h1.match(/^\d+\.(\d+)\s/)?.[1] !== String(l.sectie))
      .map((l) => `${l.pad}: sidebar_position ${l.sectie}, maar H1 is "${l.h1}"`);
    expect(fout).toEqual([]);
  });

  it('nummeren binnen een hoofdstuk door vanaf 1, zonder gaten of dubbelen', () => {
    const fout: string[] = [];
    for (const map of new Set(lessen.map((l) => l.map))) {
      const posities = lessen
        .filter((l) => l.map === map)
        .map((l) => l.sectie)
        .sort((a, b) => a - b);
      const verwacht = posities.map((_, i) => i + 1);
      if (posities.join() !== verwacht.join()) fout.push(`${map}: ${posities.join(', ')}`);
    }
    expect(fout).toEqual([]);
  });
});
