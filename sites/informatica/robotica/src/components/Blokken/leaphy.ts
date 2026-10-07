import { blocks, registerExtensions, translations } from '@leaphy-robotics/leaphy-blocks';
import type * as BlocklyType from 'blockly/core';

// De pinnen van de Arduino Nano op het Click Golfer-shield. Easybloqs zelf
// bouwt die lijst per bord op; dat veld zit in de app en niet in het pakket
// met blokken, dus hier staat hij vast. Een voorbeeld met een pin die niet
// op het bord zit, laat de test falen.
export const PINNEN = [
  ...Array.from({ length: 8 }, (_, i) => `A${i}`),
  ...Array.from({ length: 12 }, (_, i) => `${i + 2}`),
];

type Blockly = typeof BlocklyType;

const geregistreerd = new WeakSet<object>();

// Zet Blockly op zoals Easybloqs in het Nederlands: de Nederlandse teksten
// van Blockly zelf, daarover die van Leaphy, en de Leaphy-blokken. Eén keer
// per Blockly-instantie; de component en de test roepen allebei dit aan.
export function registreer(B: Blockly, nl: Record<string, string>): void {
  if (geregistreerd.has(B)) return;
  geregistreerd.add(B);

  B.setLocale(nl);
  Object.assign(B.Msg, translations.nl);

  // Een gewone keuzelijst, zonder eigen klasse: de site zet klassen om naar
  // oud JavaScript, en zo'n klasse kan de klasse van Blockly niet uitbreiden.
  B.fieldRegistry.register('field_pin_selector', {
    fromJson: (opties: object) =>
      new B.FieldDropdown(
        PINNEN.map((pin) => [pin, pin]),
        undefined,
        opties,
      ),
  } as unknown as BlocklyType.fieldRegistry.RegistrableField);

  registerExtensions(B);
  B.defineBlocksWithJsonArray(blocks);
}
