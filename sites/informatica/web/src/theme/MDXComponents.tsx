import LesTabs, { LesTab } from '@coderius/shared/components/LesTabs';
import SiteLink from '@coderius/shared/components/SiteLink';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import JsLessen from '@site/src/components/JsLessen';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt deze componenten globaal beschikbaar in alle .md/.mdx zonder import.
export default {
  ...MDXComponents,
  SiteLink,
  Voorkennis,
  JsLessen,
  // Les-tabbladen (proef): de remark-stap zet elke ##-sectie in een <LesTab>.
  LesTabs,
  LesTab,
};
