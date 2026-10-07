import Voorkennis from '@coderius/shared/components/Voorkennis';
import Ethiek from '@site/src/components/Ethiek';
import LabBadge from '@site/src/components/LabBadge';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt <Voorkennis>, <Ethiek> en <LabBadge> globaal beschikbaar in alle
// .md/.mdx zonder import.
export default {
  ...MDXComponents,
  Voorkennis,
  Ethiek,
  LabBadge,
};
