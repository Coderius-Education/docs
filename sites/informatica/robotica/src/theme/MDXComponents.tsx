import CodeUitleg, { Regel } from '@coderius/shared/components/CodeUitleg';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import Voorspel, { Keuze, Uitleg } from '@coderius/shared/components/Voorspel';
import Probleem from '@site/src/components/Probleem';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt <Voorkennis>, <CodeUitleg>/<Regel>, <Voorspel>/<Keuze>/<Uitleg> en
// <Probleem> globaal beschikbaar in alle .md/.mdx zonder import. De lessen
// zijn .md-bestanden; zonder registratie hier zou een JSX-tag daar als platte
// tekst renderen.
export default {
  ...MDXComponents,
  Voorkennis,
  CodeUitleg,
  Regel,
  Probleem,
  Voorspel,
  Keuze,
  Uitleg,
};
