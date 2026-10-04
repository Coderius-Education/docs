import CodeUitleg, { Regel } from '@coderius/shared/components/CodeUitleg';
import SiteLink from '@coderius/shared/components/SiteLink';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt <Voorkennis>, <SiteLink> en <CodeUitleg> met <Regel> globaal
// beschikbaar in alle .md/.mdx zonder import.
export default {
  ...MDXComponents,
  CodeUitleg,
  Regel,
  SiteLink,
  Voorkennis,
};
