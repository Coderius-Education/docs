import MDXComponents from '@theme-original/MDXComponents';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import CodeOrg, {CodeOrgTabel} from '@site/src/components/CodeOrg';

// Maakt deze componenten globaal beschikbaar in alle .md/.mdx zonder import.
export default {
  ...MDXComponents,
  Voorkennis,
  CodeOrg,
  CodeOrgTabel,
};
