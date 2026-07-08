import Voorkennis from '@coderius/shared/components/Voorkennis';
import CodeOrg, { CodeOrgTabel, CodeOrgProjecten } from '@site/src/components/CodeOrg';
import JsLessen from '@site/src/components/JsLessen';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt deze componenten globaal beschikbaar in alle .md/.mdx zonder import.
export default {
  ...MDXComponents,
  Voorkennis,
  CodeOrg,
  CodeOrgTabel,
  CodeOrgProjecten,
  JsLessen,
};
