import Voorkennis from '@coderius/shared/components/Voorkennis';
import MDXComponents from '@theme-original/MDXComponents';
import CodeUitleg, { Regel } from '../components/CodeUitleg';

// Maakt <Voorkennis> en <CodeUitleg>/<Regel> globaal beschikbaar in alle
// .md/.mdx zonder import. De lessen zijn .md-bestanden; zonder registratie
// hier zou een JSX-tag daar als platte tekst renderen.
export default {
  ...MDXComponents,
  Voorkennis,
  CodeUitleg,
  Regel,
};
