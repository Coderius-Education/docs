import MDXComponents from '@theme-original/MDXComponents';
import Voorkennis from '@coderius/shared/components/Voorkennis';

// Maakt <Voorkennis> globaal beschikbaar in alle .md/.mdx zonder import.
export default {
  ...MDXComponents,
  Voorkennis,
};
