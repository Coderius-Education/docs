import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { autoloadUit, citaatKlopt, fragmentenUit, verzamel } from './extract';

// De extractie bepaalt wát Godot in CI te zien krijgt. Neemt hij te weinig mee,
// dan is de suite stil groen zonder iets te controleren; neemt hij fragmenten
// mee die nooit op zichzelf kunnen compileren, dan is hij vals rood.

const kop = '## Je script tot nu toe\n\n';

const DELTA = 'Identifier "delta" not declared in the current scope.';
const DELTA_SUMMARY = `<details>\n<summary>${DELTA}</summary>\n\n\`\`\`\n${DELTA}\n\`\`\`\n\n`;
const FOUT_SCRIPT =
  '```gdscript\n# FOUT\nextends Node\n\nfunc val() -> void:\n    print(delta)\n```';

function pagina(body: string): string {
  return `---\nslug: /voorbeeld\n---\n\n${body}`;
}

describe('GDScript uit de lespagina´s halen', () => {
  it('neemt een foutvoorbeeld met verwacht-fout mee, met de melding en zonder de verbetering', () => {
    const { fragmenten, overgeslagen } = fragmentenUit(
      'les.md',
      pagina(
        `${DELTA_SUMMARY}{/* verwacht-fout: Identifier "delta" not declared in the current scope. */}\n\n\`\`\`gdscript\n# FOUT\nextends Node\n\nfunc val() -> void:\n    print(delta)\n\n# GOED\nfunc val(delta: float) -> void:\n    print(delta)\n\`\`\``,
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

  it('weigert een verwacht-fout waarvan de summary of het meldingsblok iets anders zegt', () => {
    // De test vergelijkt Godot met de marker; wat de leerling leest, is de
    // summary en het meldingsblok. Die moeten dus dezelfde melding zijn.
    const marker = `{/* verwacht-fout: ${DELTA} */}\n\n${FOUT_SCRIPT}`;
    const andereSummary = DELTA_SUMMARY.replace('<summary>Identifier', '<summary>Identifer');
    expect(() => fragmentenUit('les.md', pagina(andereSummary + marker))).toThrow(/summary/);
    const anderBlok = DELTA_SUMMARY.replace('```\nIdentifier', '```\nIdentifer');
    expect(() => fragmentenUit('les.md', pagina(anderBlok + marker))).toThrow(/meldingsblok/);
    const zonderDetails = marker;
    expect(() => fragmentenUit('les.md', pagina(zonderDetails))).toThrow(/details/);
  });

  it('laat een ... in het citaat staan voor wat per keer verschilt', () => {
    expect(citaatKlopt('in object "Muntje:...".', 'in object "Muntje:<Area2D#123>".')).toBe(true);
    expect(citaatKlopt('in object "Muntje".', 'in object "Muntje:<Area2D#123>".')).toBe(false);
  });

  it('leest bij twee markers kort na elkaar elk blok met zijn eigen melding', () => {
    const tweede = DELTA_SUMMARY.replaceAll(DELTA, 'Fout B');
    const { fragmenten } = fragmentenUit(
      'les.md',
      pagina(
        `${DELTA_SUMMARY}{/* verwacht-fout: ${DELTA} */}\n\n${FOUT_SCRIPT}\n\n</details>\n\n${tweede}{/* verwacht-fout: Fout B */}\n\n${FOUT_SCRIPT}`,
      ),
    );
    expect(fragmenten.map((f) => f.verwachtFout)).toEqual([DELTA, 'Fout B']);
  });

  it('maakt van een marker over meerdere regels één regel', () => {
    const { fragmenten } = fragmentenUit(
      'les.md',
      pagina(
        `${DELTA_SUMMARY}{/* verwacht-fout: Identifier "delta" not declared\n   in the current scope. */}\n\n${FOUT_SCRIPT}`,
      ),
    );
    expect(fragmenten[0].verwachtFout).toBe(DELTA);
  });

  it('weigert een marker die niet direct boven een gdscript-blok staat', () => {
    // Anders valt het blok stil terug op "overgeslagen", en denkt de schrijver
    // dat het gecontroleerd wordt.
    expect(() =>
      fragmentenUit(
        'les.md',
        pagina(
          `${DELTA_SUMMARY}{/* verwacht-fout: ${DELTA} */}\n\nZo ziet dat eruit:\n\n${FOUT_SCRIPT}`,
        ),
      ),
    ).toThrow(/niet direct boven/);
  });

  it('ziet ook een blok met een titel en met Windows-regeleinden', () => {
    const { fragmenten } = fragmentenUit(
      'les.md',
      pagina(
        '```gdscript title="speler.gd"\r\nextends Node2D\r\n\r\nfunc _ready() -> void:\r\n    pass\r\n```',
      ),
    );
    expect(fragmenten).toHaveLength(1);
    expect(fragmenten[0].code).not.toContain('\r');
  });

  it('neemt een runtime-foutvoorbeeld mee als script dat in _ready() de fout maakt', () => {
    const melding = "Invalid access of index '3' on a base object of type: 'Array'.";
    const omhulling = `<details>\n<summary>${melding}</summary>\n\n`;
    const script =
      '```gdscript\n# FOUT\nextends Node\n\nfunc _ready() -> void:\n    print([1, 2, 3][3])\n```';
    const { fragmenten } = fragmentenUit(
      'les.md',
      pagina(`${omhulling}{/* verwacht-runtime-fout: ${melding} */}\n\n${script}`),
    );
    expect(fragmenten[0].verwachtRuntimeFout).toBe(melding);
    expect(fragmenten[0].verwachtFout).toBeUndefined();
    // Zonder _ready() voert de runner niets uit, en dan bewijst het blok niets.
    expect(() =>
      fragmentenUit(
        'les.md',
        pagina(
          `${omhulling}{/* verwacht-runtime-fout: ${melding} */}\n\n${script.replace('_ready', 'f')}`,
        ),
      ),
    ).toThrow(/_ready/);
  });

  it('weigert quit, reload_current_scene en await in een runtime-voorbeeld', () => {
    // quit() beëindigde de hele testrun met exit 0, en een fout na een await
    // valt buiten de frames die de runner wacht.
    const melding = 'x';
    const omhulling = `<details>\n<summary>${melding}</summary>\n\n`;
    for (const regel of [
      'get_tree().quit()',
      'get_tree().reload_current_scene()',
      'await get_tree().process_frame',
    ]) {
      const script = `\`\`\`gdscript\nextends Node\n\nfunc _ready() -> void:\n    ${regel}\n\`\`\``;
      expect(() =>
        fragmentenUit(
          'les.md',
          pagina(`${omhulling}{/* verwacht-runtime-fout: ${melding} */}\n\n${script}`),
        ),
      ).toThrow(/quit\(\), reload_current_scene\(\) of await/);
    }
  });

  it('leest … in een marker als ...', () => {
    const melding = 'in object "Muntje:..."';
    const { fragmenten } = fragmentenUit(
      'les.md',
      pagina(
        `<details>\n<summary>${melding}</summary>\n\n{/* verwacht-runtime-fout: in object "Muntje:…" */}\n\n\`\`\`gdscript\nextends Node\n\nfunc _ready() -> void:\n    pass\n\`\`\``,
      ),
    );
    expect(fragmenten[0].verwachtRuntimeFout).toBe(melding);
  });

  it('controleert ook een meldingsblok met een taal, en slaat gdscript-blokken over', () => {
    const marker = `{/* verwacht-fout: ${DELTA} */}\n\n${FOUT_SCRIPT}`;
    const tekstblok = `<details>\n<summary>${DELTA}</summary>\n\n\`\`\`text\nIets anders.\n\`\`\`\n\n`;
    expect(() => fragmentenUit('les.md', pagina(tekstblok + marker))).toThrow(/meldingsblok/);
    // Een gdscript-blok ervoor in hetzelfde uitklapblok is code, geen melding.
    const metCode = `${DELTA_SUMMARY}\`\`\`gdscript\nvar x = 1\n\`\`\`\n\nen zo:\n\n`;
    expect(fragmentenUit('les.md', pagina(metCode + marker)).fragmenten).toHaveLength(1);
    // <details open> telt ook als uitklapblok.
    expect(
      fragmentenUit('les.md', pagina(DELTA_SUMMARY.replace('<details>', '<details open>') + marker))
        .fragmenten,
    ).toHaveLength(1);
  });

  it('weigert een marker na een gesloten uitklapblok', () => {
    const gesloten = `${DELTA_SUMMARY}</details>\n\n{/* verwacht-fout: ${DELTA} */}\n\n${FOUT_SCRIPT}`;
    expect(() => fragmentenUit('les.md', pagina(gesloten))).toThrow(/hetzelfde <details>/);
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

describe('de runtime-voorbeelden van de cursus', () => {
  it('wisselen niet naar een scène die in het testproject bestaat', () => {
    // De runner hangt een runtime-voorbeeld in zijn eigen scène. Een geldig
    // pad zou de runner vervangen; daarom wijst zo'n voorbeeld naar een level
    // dat er niet is.
    const site = fileURLToPath(new URL('../..', import.meta.url));
    const { fragmenten } = verzamel([join(site, 'docs'), join(site, 'src', 'pages')]);
    const fout: string[] = [];
    for (const f of fragmenten.filter((f) => f.verwachtRuntimeFout)) {
      for (const m of f.code.matchAll(/change_scene_to_\w+\("res:\/\/([^"]+)"/g)) {
        if (existsSync(join(site, 'godot-tests', m[1])))
          fout.push(`${f.bron}:${f.regel} → ${m[1]}`);
      }
    }
    expect(fout).toEqual([]);
  });
});
