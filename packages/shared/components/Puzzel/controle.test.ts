import { describe, expect, it } from 'vitest';
import { gebreken, puzzelsIn } from './controle';

const GOED = `# 4.2 Kiezen

export const puzzel = \`<ul>
  <li>een</li>
  <li>twee</li>
  <li>drie</li>
</ul>\`;

## Uitleg

Tekst.

## Puzzel

Dit is een lijst met drie punten. De regels staan door elkaar: zet een boven twee.

<Puzzel code={puzzel} taal="html">

De lijst opent met \`<ul>\` en sluit met \`</ul>\`; de punten staan ertussen.

</Puzzel>

## Opdracht 1: Een lijst
`;

const INLINE = `## Stap 1

Tekst.

## Puzzel \\{#de-puzzel}

De robot kiest. De regels staan door elkaar; een scherpe bocht gaat voor rechtdoor.

<Puzzel taal="python" code={\`if afstand < 100:
    print("Stop")
elif kleur == "black":
    print(f"Bocht {kleur}")
else:
    print("Rechtdoor")\`}>

Python kijkt van boven naar beneden en neemt de eerste tak die klopt, dus stoppen staat bovenaan.

</Puzzel>

## Stap 2
`;

describe('puzzelsIn', () => {
  it('leest de code uit een export, met de koppen eromheen', () => {
    const [puzzel] = puzzelsIn(GOED);
    expect(puzzel.kop).toBe('Puzzel');
    expect(puzzel.kopVoor).toBe('Uitleg');
    expect(puzzel.kopNa).toBe('Opdracht 1: Een lijst');
    expect(puzzel.taal).toBe('html');
    expect(puzzel.code?.split('\n')).toHaveLength(5);
    expect(puzzel.opdracht).toMatch(/^Dit is een lijst/);
    expect(puzzel.uitleg).toMatch(/^De lijst opent/);
  });

  it('leest code die in de tag zelf staat, ook met accolades en een vast id op de kop', () => {
    // Python en robotica schrijven de code in de tag: een f-string heeft
    // accolades, en die sluiten de prop niet af.
    const [puzzel] = puzzelsIn(INLINE);
    expect(puzzel.kop).toBe('Puzzel');
    expect(puzzel.taal).toBe('python');
    expect(puzzel.code?.split('\n')).toHaveLength(6);
    expect(puzzel.code).toContain('print(f"Bocht {kleur}")');
    expect(puzzel.uitleg).toMatch(/^Python kijkt/);
  });

  it('vindt elke puzzel op een pagina', () => {
    expect(puzzelsIn(GOED + INLINE)).toHaveLength(2);
    expect(puzzelsIn('## Uitleg\n\nGeen puzzel.\n')).toEqual([]);
  });
});

describe('gebreken', () => {
  it('vindt niets aan een puzzel die klopt', () => {
    expect(gebreken(puzzelsIn(GOED)[0])).toEqual([]);
    expect(gebreken(puzzelsIn(INLINE)[0])).toEqual([]);
  });

  it('noemt een puzzel onder een andere kop', () => {
    const bron = GOED.replace('## Puzzel', '## Opdracht 0: Puzzel');
    expect(gebreken(puzzelsIn(bron)[0]).join(' ')).toMatch(/eigen kop/);
  });

  it('noemt een opdracht die niet zegt dat de regels door elkaar staan', () => {
    const bron = GOED.replace('door elkaar', 'in de war');
    expect(gebreken(puzzelsIn(bron)[0]).join(' ')).toMatch(/door elkaar/);
  });

  it('noemt een puzzel zonder uitleg', () => {
    const bron = GOED.replace(/De lijst opent[^\n]*/, 'Goed zo.');
    expect(gebreken(puzzelsIn(bron)[0]).join(' ')).toMatch(/geen uitleg/);
  });

  it('noemt te weinig regels, te veel regels en een regel die afbreekt', () => {
    const kort = GOED.replace('  <li>twee</li>\n  <li>drie</li>\n', '');
    expect(gebreken(puzzelsIn(kort)[0]).join(' ')).toMatch(/3 regels/);
    const lang = GOED.replace('  <li>drie</li>\n', '  <li>punt</li>\n'.repeat(9));
    expect(gebreken(puzzelsIn(lang)[0]).join(' ')).toMatch(/13 regels/);
    const breed = GOED.replace('<li>drie</li>', `<li>${'drie '.repeat(12)}</li>`);
    expect(gebreken(puzzelsIn(breed)[0]).join(' ')).toMatch(/breekt af/);
  });

  it('noemt een puzzel zonder taal, of met code die de les niet heeft', () => {
    expect(gebreken(puzzelsIn(GOED.replace(' taal="html"', ''))[0]).join(' ')).toMatch(/taal/);
    const zonder = GOED.replace('code={puzzel}', 'code={elders}');
    expect(gebreken(puzzelsIn(zonder)[0]).join(' ')).toMatch(/niet in de les/);
  });
});
