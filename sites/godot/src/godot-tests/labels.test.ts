import { describe, expect, it } from 'vitest';
import { GEEN_UI_LABEL, uiLabelsUit } from './labels';

// Deze extractie bepaalt wat CI tegen de Godot-binary houdt. Te grof en de job
// staat vol valse alarmen over Nederlandse woorden; te fijn en een hernoemd
// menu-item glipt erdoor.

describe('UI-labels uit de lespagina´s halen', () => {
  it('herkent een Engels knoplabel', () => {
    expect(uiLabelsUit('Klik op **Attach Script** en daarna op **Create**.')).toEqual([
      'Attach Script',
      'Create',
    ]);
  });

  it('laat Nederlandse lestekst met rust', () => {
    expect(uiLabelsUit('Dit is **het belangrijkste** van de les.')).toEqual([]);
    expect(uiLabelsUit('Zet **Template** op leeg.')).toEqual(['Template']);
  });

  it('slaat zinnen en lange stukken over', () => {
    expect(uiLabelsUit('**Snel zichtbaar resultaat.**')).toEqual([]);
    expect(uiLabelsUit('**Een label van veel te veel losse woorden erin**')).toEqual([]);
  });

  it('slaat een versienummer over', () => {
    expect(uiLabelsUit('Gebruik **Godot 4.7**.')).toEqual([]);
  });

  it('respecteert de uitzonderingenlijst', () => {
    expect(uiLabelsUit('Klik op **Magic Wand**.')).toEqual([]);
    expect(GEEN_UI_LABEL['Magic Wand']).toBeTruthy();
  });

  it('geeft elke uitzondering een reden', () => {
    const zonder = Object.entries(GEEN_UI_LABEL)
      .filter(([, reden]) => reden.trim() === '')
      .map(([label]) => label);
    expect(zonder).toEqual([]);
  });
});
