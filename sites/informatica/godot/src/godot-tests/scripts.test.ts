import { describe, expect, it } from 'vitest';
import { type Blok, blokkenInVolgorde, functies } from './lessen';

// Hoofdstuk 10 bouwt op het project van de leerling. Een volledig script in
// een les of oplossing vervangt bij overnemen wat er stond, en dan moet het
// houden wat er al was. Zo verdween geef_sprongboost() uit de oplossing van
// 10.1.b (daarna gaf de power-up "Nonexistent function"), en ging het
// voorbeeld van 10.5.b uit van de vijand uit 7.1.a in plaats van 7.3.a,
// waardoor de levens niet meer zakten.
//
// Per soort script (karakter, vijand, muntje) is de voorganger het laatste
// volledige script van die soort eerder in de cursus; een opdracht telt
// alleen als de soort buiten opdrachten nog niet voorkwam (de vijand bestaat
// alleen in opdrachten). Een volledig script in hoofdstuk 10 moet:
//  - de eigen functies van zijn voorganger hebben;
//  - dezelfde Global-namen gebruiken als zijn voorganger;
//  - bij het karakter: elke functie hebben die een ander script in de les
//    (geen opdracht) op `body.` aanroept, zoals de power-up met
//    body.geef_sprongboost().

type Soort = 'karakter' | 'vijand' | 'muntje';

function soortVan(b: Blok): Soort | undefined {
  if (!b.heelScript || b.fout || b.hoofdstuk === 9) return undefined;
  if (/^extends CharacterBody2D/m.test(b.code) && /sprongkracht|JUMP_VELOCITY/.test(b.code)) {
    return 'karakter';
  }
  if (!/^extends Area2D/m.test(b.code)) return undefined;
  if (/\b(?:Global|body)\.score\s*\+=/.test(b.code)) return 'muntje';
  if (/\b(?:Global|body)\.levens\s*-=|vijand/i.test(b.code)) return 'vijand';
  return undefined;
}

const eigenFuncties = (code: string) =>
  [...functies(code).keys()].filter((n) => !n.startsWith('_'));
const globalNamen = (code: string) =>
  new Set([...code.matchAll(/\bGlobal\.(\w+)/g)].map((m) => m[1]));

describe('volledige scripts in hoofdstuk 10', () => {
  it('houden wat het script van de leerling al had', () => {
    const blokken = blokkenInVolgorde();
    const fout: string[] = [];
    let gecontroleerd = 0;
    blokken.forEach((b, i) => {
      const soort = soortVan(b);
      if (!soort || b.hoofdstuk !== 10) return;
      gecontroleerd += 1;
      const eerder = blokken.slice(0, i).filter((e) => soortVan(e) === soort);
      const voorganger = (eerder.filter((e) => !e.opdracht).at(-1) ?? eerder.at(-1)) as Blok;
      if (!voorganger) return;
      const heeft = new Set(eigenFuncties(b.code));
      const globals = globalNamen(b.code);
      const mist = [
        ...eigenFuncties(voorganger.code)
          .filter((f) => !heeft.has(f))
          .map((f) => `${f}()`),
        ...[...globalNamen(voorganger.code)]
          .filter((g) => !globals.has(g))
          .map((g) => `Global.${g}`),
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
});
