import Antwoordblad from '@coderius/shared/components/Antwoordblad';
import Handout from '@coderius/shared/components/Handout';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt <Voorkennis> en de hand-outcomponenten van docs/unplugged globaal
// beschikbaar in alle .md/.mdx zonder import.
export default {
  ...MDXComponents,
  Antwoordblad,
  Handout,
  Voorkennis,
};
