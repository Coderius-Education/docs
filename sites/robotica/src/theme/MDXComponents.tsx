import CodeUitleg, { Regel } from '@coderius/shared/components/CodeUitleg';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt <Voorkennis> en <CodeUitleg>/<Regel> globaal beschikbaar in alle
// .md/.mdx zonder import. De lessen zijn .md-bestanden; zonder registratie
// hier zou een JSX-tag daar als platte tekst renderen.
export default {
  ...MDXComponents,
  Voorkennis,
  CodeUitleg,
  Regel,
};
