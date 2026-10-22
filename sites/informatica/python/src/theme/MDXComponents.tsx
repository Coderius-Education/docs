import Antwoordblad from '@coderius/shared/components/Antwoordblad';
import Handout from '@coderius/shared/components/Handout';
import Schrijflijnen from '@coderius/shared/components/Schrijflijnen';
import SiteLink from '@coderius/shared/components/SiteLink';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt <Voorkennis> globaal beschikbaar in alle .md/.mdx zonder import, en
// de hand-outcomponenten voor de unplugged werkvormen (docs/unplugged).
export default {
  ...MDXComponents,
  Antwoordblad,
  Handout,
  Schrijflijnen,
  SiteLink,
  Voorkennis,
};
