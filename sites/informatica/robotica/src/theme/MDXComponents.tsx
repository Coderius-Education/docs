import CodeUitleg, { Regel } from '@coderius/shared/components/CodeUitleg';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import Voorspel, { Keuze, Uitleg } from '@coderius/shared/components/Voorspel';
import Onderdelenlijst, { Onderdeel } from '@site/src/components/Onderdelenlijst';
import Probleem from '@site/src/components/Probleem';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt <Voorkennis>, <CodeUitleg>/<Regel>, <Voorspel>/<Keuze>/<Uitleg>,
// <Onderdelenlijst>/<Onderdeel> en <Probleem> globaal beschikbaar in alle .md/.mdx zonder import. De lessen
// zijn .md-bestanden; zonder registratie hier zou een JSX-tag daar als platte
// tekst renderen.
export default {
  ...MDXComponents,
  Voorkennis,
  CodeUitleg,
  Regel,
  Probleem,
  Onderdelenlijst,
  Onderdeel,
  Voorspel,
  Keuze,
  Uitleg,
};
