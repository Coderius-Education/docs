import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { pythonLanguage } from '@codemirror/lang-python';
import { HighlightStyle, defaultHighlightStyle } from '@codemirror/language';
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
import { type Highlighter, highlightTree, tags } from '@lezer/highlight';
import { describe, expect, it } from 'vitest';

// De CodeMirror-editors van play en robotica kleurden in licht met
// defaultHighlightStyle en in donker met oneDark. Die twee kleurden niet
// dezelfde soorten: in donker waren `range(`, `print(` en elke variabele
// gekleurd, in licht zwart (issue #223), en had `in` een andere kleur dan
// `for`. Nu komen beide standen uit één lijst (CODEMIRROR in prism-thema.js).
// Deze test kleurt een stuk Python zoals de editor dat doet.

const require = createRequire(import.meta.url);
const { CODEMIRROR, codeMirrorStijlen } = require('./prism-thema');
const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const CODE = [
  'import play',
  '# tel tot drie',
  'for i in range(3):',
  '    print("hoi", len(i), True, None, 3.5)',
  'def doe(x):',
  '    return x.y and not x',
  'class Spel:',
  '    pass',
].join('\n');

/** De stukken code die de stijl een kleur geeft, met hun klasse. */
function gekleurd(stijl: Highlighter): Map<string, string> {
  const uit = new Map<string, string>();
  highlightTree(pythonLanguage.parser.parse(CODE), stijl, (van, tot, klasse) => {
    uit.set(CODE.slice(van, tot), klasse);
  });
  return uit;
}

const { licht, donker } = codeMirrorStijlen({ HighlightStyle, tags });

describe('de kleuren van de CodeMirror-editors in licht en donker', () => {
  it('licht en donker kleuren dezelfde stukken code', () => {
    expect([...gekleurd(licht).keys()].sort()).toEqual([...gekleurd(donker).keys()].sort());
  });

  it('range, print en len hebben in beide standen een kleur', () => {
    for (const stijl of [licht, donker])
      for (const stuk of ['range', 'print', 'len', 'doe'])
        expect(gekleurd(stijl).has(stuk), stuk).toBe(true);
  });

  it('een variabele en een eigenschap zijn in beide standen gewone tekst', () => {
    for (const stijl of [licht, donker])
      for (const stuk of ['i', 'x', 'y', 'play'])
        expect(gekleurd(stijl).has(stuk), stuk).toBe(false);
  });

  it('for en in hebben dezelfde kleur, net als None', () => {
    for (const stijl of [licht, donker]) {
      const k = gekleurd(stijl);
      expect(k.get('in')).toBe(k.get('for'));
      expect(k.get('not')).toBe(k.get('for'));
    }
  });

  it('geen soort is cursief of vet, in geen van beide standen', () => {
    for (const regel of CODEMIRROR)
      expect(Object.keys(regel).sort()).toEqual(['donker', 'licht', 'soorten']);
  });

  it('de oude standaardstijl en oneDark kleurden niet dezelfde stukken: daar kwam het issue vandaan', () => {
    const oud = [...gekleurd(defaultHighlightStyle).keys()];
    const nieuw = [...gekleurd(oneDarkHighlightStyle).keys()];
    expect(nieuw.filter((stuk) => !oud.includes(stuk))).toEqual(
      expect.arrayContaining(['range', 'print', 'i']),
    );
  });

  it('play en robotica gebruiken deze stijlen, en niet oneDark of de lichte standaardstijl', () => {
    const lees = (pad: string) => readFileSync(`${ROOT}/${pad}`, 'utf8');
    const play = lees('sites/informatica/play/src/components/CodeRunner/CodeEditor.js');
    expect(play).toMatch(/syntaxHighlighting\(kleuren\.donker\)/);
    expect(play).toMatch(/syntaxHighlighting\(kleuren\.licht\)/);
    expect(play).not.toMatch(/\boneDark\b(?!Theme)|defaultHighlightStyle/);
    for (const bestand of ['index.tsx', 'Voorbeeld.tsx']) {
      const bron = lees(`sites/informatica/robotica/src/components/WebMicroEditor/${bestand}`);
      expect(bron, bestand).toMatch(/theme=\{editorThema\(/);
      // Het oude thema van @uiw: theme={donker ? 'dark' : 'light'}.
      expect(bron, bestand).not.toMatch(/theme=\{[^}]*\?\s*'dark'\s*:\s*'light'\}/);
    }
    expect(lees('sites/informatica/robotica/src/components/WebMicroEditor/kleuren.ts')).toMatch(
      /codeMirrorStijlen\(\{ HighlightStyle, tags \}\)/,
    );
  });
});
