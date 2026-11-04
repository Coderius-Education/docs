import { describe, expect, it } from 'vitest';
import { autoloadUit, fragmentenUit } from './extract';

// De extractie bepaalt wát Godot in CI te zien krijgt. Neemt hij te weinig mee,
// dan is de suite stil groen zonder iets te controleren; neemt hij fragmenten
// mee die nooit op zichzelf kunnen compileren, dan is hij vals rood.

const kop = '## Je script tot nu toe\n\n';

function pagina(body: string): string {
  return `---\nslug: /voorbeeld\n---\n\n${body}`;
}

describe('GDScript uit de lespagina´s halen', () => {
  it('neemt een foutvoorbeeld met verwacht-fout mee, met de melding en zonder de verbetering', () => {
    const { fragmenten, overgeslagen } = fragmentenUit(
      'les.md',
      pagina(
        '{/* verwacht-fout: Identifier "delta" not declared in the current scope. */}\n\n```gdscript\n# FOUT\nextends Node\n\nfunc val() -> void:\n    print(delta)\n\n# GOED\nfunc val(delta: float) -> void:\n    print(delta)\n```',
      ),
    );
    expect(overgeslagen).toEqual([]);
    expect(fragmenten).toHaveLength(1);
    expect(fragmenten[0].verwachtFout).toBe(
      'Identifier "delta" not declared in the current scope.',
    );
    expect(fragmenten[0].code).toContain('func val() -> void:');
    expect(fragmenten[0].code).not.toContain('GOED');
  });

  it('weigert een verwacht-fout-blok zonder extends', () => {
    // Zonder extends faalt elk blok, ook als de les de verkeerde fout citeert.
    expect(() =>
      fragmentenUit(
        'les.md',
        pagina('{/* verwacht-fout: iets */}\n\n```gdscript\nfunc val():\n    pass\n```'),
      ),
    ).toThrow(/heel script/);
  });

  it('compileert een losse functie met compileer-als onder die regel', () => {
    const { fragmenten } = fragmentenUit(
      'les.md',
      pagina(
        '{/* compileer-als: extends Area2D */}\n\n```gdscript\nfunc _on_body_entered(body: Node2D) -> void:\n    queue_free()\n```',
      ),
    );
    expect(fragmenten).toHaveLength(1);
    expect(fragmenten[0].code).toBe(
      'extends Area2D\n\nfunc _on_body_entered(body: Node2D) -> void:\n    queue_free()\n',
    );
  });

  it('weigert compileer-als boven ingesprongen code', () => {
    // Ingesprongen code hoort binnen een functie; onder een extends geplakt
    // compileert die nooit, en dan zegt de fout niets over de les.
    expect(() =>
      fragmentenUit(
        'les.md',
        pagina('{/* compileer-als: extends Area2D */}\n\n```gdscript\n    queue_free()\n```'),
      ),
    ).toThrow(/compileer-als/);
  });

  it('slaat een # FOUT-blok zonder marker nog steeds over', () => {
    const { fragmenten, overgeslagen } = fragmentenUit(
      'les.md',
      pagina('```gdscript\n# FOUT\nextends Node\n\nfunc f():\n    x\n```'),
    );
    expect(fragmenten).toEqual([]);
    expect(overgeslagen[0].reden).toBe('bewust fout voorbeeld');
  });

  it('neemt een volledig script mee', () => {
    const { fragmenten } = fragmentenUit(
      'les.md',
      pagina(`${kop}\`\`\`gdscript\nextends Node2D\n\nfunc _ready() -> void:\n    pass\n\`\`\``),
    );
    expect(fragmenten).toHaveLength(1);
    expect(fragmenten[0].kop).toBe('Je script tot nu toe');
    expect(fragmenten[0].code).toContain('extends Node2D');
  });

  it('slaat een losse functie over, ook al staat er elders op de pagina een extends', () => {
    // Zo'n functie wijst naar leden die in het volledige script staan; onder een
    // losse extends geplakt geeft dat een parse-fout die niets over de les zegt.
    const { fragmenten, overgeslagen } = fragmentenUit(
      'les.md',
      pagina(
        '```gdscript\nfunc _spring() -> void:\n    velocity.y = SPRONG\n```\n\n' +
          '```gdscript\nextends CharacterBody2D\n\nconst SPRONG = -400\n```',
      ),
    );
    expect(fragmenten).toHaveLength(1);
    expect(fragmenten[0].code).toContain('const SPRONG');
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

  it('slaat een blok over dat de bron als opzettelijk kapot markeert', () => {
    const { fragmenten, overgeslagen } = fragmentenUit(
      'les.md',
      pagina(
        '{/* niet-compileren: dit script is opzettelijk kapot, dat is de opdracht */}\n\n' +
          '```gdscript\nextends Node\n\nfunc _ready() -> void\n    pass\n```',
      ),
    );
    expect(fragmenten).toHaveLength(0);
    expect(overgeslagen[0].reden).toBe('bewust fout voorbeeld');
  });
});

describe('het Global-autoload uit de les bouwen', () => {
  it('voegt losse leden uit verschillende stappen samen tot één script', () => {
    const les = [
      '```gdscript\nextends Node\n\nvar score = 0\n```',
      '```gdscript\nfunc is_game_over() -> bool:\n    return levens <= 0\n```',
      // Een aanroep, geen definitie: hoort er niet in.
      '```gdscript\nif Global.is_game_over():\n    print("einde")\n```',
    ].join('\n\n');

    expect(autoloadUit(les)).toBe(
      'extends Node\n\nvar score = 0\n\nfunc is_game_over() -> bool:\n    return levens <= 0\n',
    );
  });

  it('houdt van een lid dat meermaals voorkomt de uitgewerkte versie', () => {
    const les = [
      '```gdscript\nextends Node\n\nfunc reset():\n    pass\n```',
      '```gdscript\nextends Node\n\nfunc reset():\n    score = 0\n    levens = 3\n```',
    ].join('\n\n');

    expect(autoloadUit(les)).toContain('levens = 3');
  });

  it('geeft niets terug als de pagina geen global-script bevat', () => {
    expect(autoloadUit('# Les\n\n```gdscript\n    print(velocity)\n```')).toBeUndefined();
  });
});
