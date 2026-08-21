import Voorkennis from '@coderius/shared/components/Voorkennis';
import GDQuestLes from '@site/src/components/GDQuestLes';
import GodotVersie from '@site/src/components/GodotVersie';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt deze componenten globaal beschikbaar in alle .md/.mdx zonder import.
export default {
  ...MDXComponents,
  Voorkennis,
  GodotVersie,
  GDQuestLes,
};
