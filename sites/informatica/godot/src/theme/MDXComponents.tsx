import SiteLink from '@coderius/shared/components/SiteLink';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import GDQuestLes, { GDQuestTabel } from '@site/src/components/GDQuestLes';
import GodotVersie from '@site/src/components/GodotVersie';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt deze componenten globaal beschikbaar in alle .md/.mdx zonder import.
export default {
  ...MDXComponents,
  SiteLink,
  Voorkennis,
  GodotVersie,
  GDQuestLes,
  GDQuestTabel,
};
