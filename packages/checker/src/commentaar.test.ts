import { describe, expect, it } from 'vitest';
import { zonderCommentaar } from './commentaar';

// Wat wegvalt wordt spaties; elke regel blijft even lang, zodat een plek in
// het rapport naar de goede regel van het echte bestand wijst.
const zelfdeVorm = (voor: string, na: string) => {
  expect(na.length).toBe(voor.length);
  expect(na.split('\n').map((r) => r.length)).toEqual(voor.split('\n').map((r) => r.length));
};

describe('zonderCommentaar', () => {
  it('Python: haalt # en docstrings weg, laat strings staan', () => {
    const code = [
      'def rijd():',
      '    """Rijdt als wit or zwart: sensoren = [a, b]."""',
      '    # tof = TimeOfFlight(sda_gpio_pin="SDA")',
      '    print(f"kleur #{kleur}")  # uitleg',
      '    tekst = """geen docstring"""',
      "@app.get('/dier/{naam}')",
    ].join('\n');
    const uit = zonderCommentaar(code, 'python');
    zelfdeVorm(code, uit);
    expect(uit).not.toMatch(/TimeOfFlight|wit or zwart|uitleg/);
    expect(uit).toContain('print(f"kleur #{kleur}")');
    expect(uit).toContain('"""geen docstring"""');
    expect(uit).toContain("@app.get('/dier/{naam}')");
  });

  it('GDScript: haalt # weg, ook binnen een regel, niet een kleur in een string', () => {
    const code = 'extends Node2D\n# var t = create_tween()\nvar kleur = "#ff0000" # rood\n';
    const uit = zonderCommentaar(code, 'gdscript');
    zelfdeVorm(code, uit);
    expect(uit).not.toContain('create_tween');
    expect(uit).not.toContain('rood');
    expect(uit).toContain('"#ff0000"');
  });

  it('HTML: haalt HTML-, Jinja-, script- en stijlcommentaar weg', () => {
    const code = [
      '<!-- <button hx-get="/x">Oud</button> -->',
      '{# {{ oud }} #}',
      '<script>// fetch("/a")\nlet u = "http://x"; /* weg */</script>',
      '<style>/* .oud { } */ p { }</style>',
    ].join('\n');
    const uit = zonderCommentaar(code, 'html');
    zelfdeVorm(code, uit);
    expect(uit).not.toMatch(/hx-get|oud|fetch|weg/);
    expect(uit).toContain('"http://x"');
    expect(uit).toContain('p { }');
  });

  it('JavaScript en CSS', () => {
    expect(zonderCommentaar('let a = "//niet"; // wel', 'js')).toBe('let a = "//niet";       ');
    expect(zonderCommentaar('/* x */ p {}', 'css')).toBe('        p {}');
  });
});
