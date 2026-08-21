import { describe, expect, it } from 'vitest';
import { fragmentenUit } from './extract';

// De extractie bepaalt wát Godot in CI te zien krijgt. Neemt hij te weinig mee,
// dan is de suite stil groen zonder iets te controleren; neemt hij fragmenten
// mee die nooit op zichzelf kunnen compileren, dan is hij vals rood.

const kop = '## Je script tot nu toe\n\n';

function pagina(body: string): string {
  return `---\nslug: /voorbeeld\n---\n\n${body}`;
}

describe('GDScript uit de lespagina´s halen', () => {
  it('neemt een volledig script mee', () => {
    const { fragmenten } = fragmentenUit(
      'les.md',
      pagina(`${kop}\`\`\`gdscript\nextends Node2D\n\nfunc _ready() -> void:\n    pass\n\`\`\``),
    );
    expect(fragmenten).toHaveLength(1);
    expect(fragmenten[0].soort).toBe('script');
    expect(fragmenten[0].kop).toBe('Je script tot nu toe');
    expect(fragmenten[0].code).toContain('extends Node2D');
  });

  it('pakt een losse functie in met de extends van diezelfde pagina', () => {
    const { fragmenten } = fragmentenUit(
      'les.md',
      pagina(
        '```gdscript\nfunc _spring() -> void:\n    velocity.y = -400\n```\n\n' +
          '```gdscript\nextends CharacterBody2D\n\nfunc _ready() -> void:\n    pass\n```',
      ),
    );
    // De extends staat ónder het fragment; die moet toch gevonden worden.
    const ingepakt = fragmenten.find((f) => f.soort === 'ingepakt');
    expect(ingepakt?.code).toBe(
      'extends CharacterBody2D\n\nfunc _spring() -> void:\n    velocity.y = -400\n',
    );
  });

  it('slaat een functie zonder body over', () => {
    // Alleen de signatuurregel, als illustratie in de tekst. Ingepakt zou dat
    // een compileerfout geven die niets over de les zegt.
    const { fragmenten, overgeslagen } = fragmentenUit(
      'les.md',
      pagina(
        '```gdscript\nextends Node\n```\n\n```gdscript\nfunc _physics_process(delta: float) -> void:\n```',
      ),
    );
    expect(fragmenten).toHaveLength(1);
    expect(overgeslagen[0].reden).toBe('fragment, geen zelfstandig script');
  });

  it('slaat losse regels binnen een functie over', () => {
    const { fragmenten, overgeslagen } = fragmentenUit(
      'les.md',
      pagina('```gdscript\nextends Node\n```\n\n```gdscript\n    print(velocity)\n```'),
    );
    expect(fragmenten).toHaveLength(1);
    expect(overgeslagen).toHaveLength(1);
  });

  it('slaat een bewust fout voorbeeld over', () => {
    const { fragmenten, overgeslagen } = fragmentenUit(
      'les.md',
      pagina('```gdscript\n# FOUT\nvar x = "res://a.tscn".instantiate()\n```'),
    );
    expect(fragmenten).toHaveLength(0);
    expect(overgeslagen[0].reden).toBe('bewust fout voorbeeld');
  });

  it('geeft elk blok een naam die niet van het absolute pad afhangt', () => {
    const zonderSlug = '# Cheatsheet\n\n```gdscript\nextends Node\n```';
    const a = fragmentenUit('/ergens/anders/cheatsheet.md', zonderSlug);
    const b = fragmentenUit('/heel/ander/pad/cheatsheet.md', zonderSlug);
    expect(a.fragmenten[0].naam).toBe(b.fragmenten[0].naam);
    expect(a.fragmenten[0].naam).toBe('cheatsheet_1');
  });
});
