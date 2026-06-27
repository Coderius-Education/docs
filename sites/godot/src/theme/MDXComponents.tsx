import MDXComponents from '@theme-original/MDXComponents';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import GodotVersie from '@site/src/components/GodotVersie';

// Maakt deze componenten globaal beschikbaar in alle .md/.mdx zonder import.
export default {
  ...MDXComponents,
  Voorkennis,
  GodotVersie,
};
