import Voorkennis from '@coderius/shared/components/Voorkennis';
import Ethiek from '@site/src/components/Ethiek';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt <Voorkennis> en <Ethiek> globaal beschikbaar in alle .md/.mdx
// zonder import.
export default {
  ...MDXComponents,
  Voorkennis,
  Ethiek,
};
