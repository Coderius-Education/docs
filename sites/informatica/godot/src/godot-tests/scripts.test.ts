import { describe, expect, it } from 'vitest';
import { type Blok, blokkenInVolgorde, functies } from './lessen';

// Hoofdstuk 10 bouwt op het project van de leerling. Een volledig script in
// een les of oplossing vervangt bij overnemen wat er stond, en dan moet het
// houden wat er al was. Zo verdween geef_sprongboost() uit de oplossing van
// 10.1.b (daarna gaf de power-up "Nonexistent function"), ging het voorbeeld
// van 10.5.b uit van de vijand uit 7.1.a in plaats van 7.3.a, en verdwenen de
// group "muntjes" en de controle op winnen uit 7.5.a uit Dictionaries en
// Tweens.
//
// Per soort script (karakter, vijand, muntje) is de voorganger het laatste
// volledige script van die soort eerder in de cursus: uit een les, of uit een
// opdracht waarop latere lessen voortbouwen (OPDRACHTEN_DIE_BLIJVEN). Een
// volledig script in hoofdstuk 10 moet:
//  - alle functies van zijn voorganger hebben, ook _ready;
//  - dezelfde groups aanmaken en dezelfde Global-namen gebruiken;
//  - bij het karakter: elke functie hebben die een ander script in de les
//    (geen opdracht) op `body.` aanroept, zoals de power-up met
//    body.geef_sprongboost().

/**
 * Opdrachten waarvan het script de basis is voor wat erna komt: de vijand
 * bestaat alleen in opdrachten, en de winst-check uit 7.5.a hoort bij het
 * muntje. 7.6.a (snelheid) staat er bewust niet bij: hoofdstuk 10 noemt die
 * variant in de tekst.
 */
const OPDRACHTEN_DIE_BLIJVEN = [
  'Opdracht 7.1.a',
  'Opdracht 7.3.a',
  'Opdracht 7.5.a',
  'Opdracht 7.5.b',
];

type Soort = 'karakter' | 'vijand' | 'muntje';

function soortVan(b: Blok): Soort | undefined {
  if (!b.heelScript || b.fout || b.hoofdstuk === 9) return undefined;
  if (/^extends CharacterBody2D/m.test(b.code) && /sprongkracht|JUMP_VELOCITY/.test(b.code)) {
    return 'karakter';
  }
  if (!/^extends Area2D/m.test(b.code)) return undefined;
  if (/\b(?:Global|body)\.score\s*\+=|add_to_group\("muntjes"\)/.test(b.code)) return 'muntje';
  if (/\b(?:Global|body)\.levens\s*-=|vijand/i.test(b.code)) return 'vijand';
  return undefined;
}

function telt(b: Blok): boolean {
  return !b.opdracht || OPDRACHTEN_DIE_BLIJVEN.some((o) => b.kop.startsWith(o));
}

const eigenFuncties = (code: string) => [...functies(code).keys()];
const globalNamen = (code: string) =>
  new Set([...code.matchAll(/\bGlobal\.(\w+)/g)].map((m) => m[1]));
const groups = (code: string) =>
  new Set([...code.matchAll(/add_to_group\("(\w+)"\)/g)].map((m) => m[1]));

describe('volledige scripts in hoofdstuk 10', () => {
  it('houden wat het script van de leerling al had', () => {
    const blokken = blokkenInVolgorde();
    const fout: string[] = [];
    let gecontroleerd = 0;
    blokken.forEach((b, i) => {
      const soort = soortVan(b);
      if (!soort || b.hoofdstuk !== 10) return;
      gecontroleerd += 1;
      const voorganger = blokken
        .slice(0, i)
        .filter((e) => soortVan(e) === soort && telt(e))
        .at(-1);
      if (!voorganger) return;
      const heeft = new Set(eigenFuncties(b.code));
      const globals = globalNamen(b.code);
      const eigenGroups = groups(b.code);
      const mist = [
        ...eigenFuncties(voorganger.code)
          .filter((f) => !heeft.has(f))
          .map((f) => `${f}()`),
        ...[...globalNamen(voorganger.code)]
          .filter((g) => !globals.has(g))
          .map((g) => `Global.${g}`),
        ...[...groups(voorganger.code)]
          .filter((g) => !eigenGroups.has(g))
          .map((g) => `add_to_group("${g}")`),
      ];
      if (soort === 'karakter') {
        for (const e of blokken.slice(0, i)) {
          if (!e.heelScript || e.fout || e.opdracht) continue;
          for (const m of e.code.matchAll(/\bbody\.(\w+)\s*\(/g)) {
            if (!heeft.has(m[1]) && !mist.includes(`${m[1]}()`)) mist.push(`${m[1]}()`);
          }
        }
      }
      if (mist.length)
        fout.push(`${b.plek} (${soort}, na ${voorganger.plek}) mist ${mist.join(', ')}`);
    });
    expect(gecontroleerd).toBeGreaterThan(3);
    expect(fout).toEqual([]);
  });

  it('kent de opdrachten die blijven nog als opdracht in de cursus', () => {
    const koppen = new Set(blokkenInVolgorde().map((b) => b.kop.split(':')[0]));
    expect(OPDRACHTEN_DIE_BLIJVEN.filter((o) => !koppen.has(o))).toEqual([]);
  });
});
