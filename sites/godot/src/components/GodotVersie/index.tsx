import type {ReactNode} from 'react';
import Admonition from '@theme/Admonition';
import Link from '@docusaurus/Link';
import {GODOT_VERSION} from '@site/src/data/godot';

/**
 * Versie-banner bovenaan elke tutorial. Leest de doelversie uit één bron
 * (src/data/godot.ts), zodat een versie-bump niet meer op elke pagina hoeft.
 * Globaal geregistreerd, dus bruikbaar als `<GodotVersie />` zonder import.
 */
export default function GodotVersie(): ReactNode {
  return (
    <Admonition type="info" title={`Godot ${GODOT_VERSION}`}>
      <p>
        Geschreven voor <strong>Godot {GODOT_VERSION}.x</strong> — zie{' '}
        <Link to="/docs/godot-versies">Godot-versies</Link> voor compatibiliteit.
      </p>
    </Admonition>
  );
}
