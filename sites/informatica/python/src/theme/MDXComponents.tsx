import Antwoordblad from '@coderius/shared/components/Antwoordblad';
import Handout from '@coderius/shared/components/Handout';
import Schrijflijnen from '@coderius/shared/components/Schrijflijnen';
import SiteLink from '@coderius/shared/components/SiteLink';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import Voorspel, { Keuze, Uitleg } from '@coderius/shared/components/Voorspel';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt <Voorkennis> globaal beschikbaar in alle .md/.mdx zonder import, de
// hand-outcomponenten voor de unplugged werkvormen (docs/unplugged), en
// <Voorspel> met <Keuze> en <Uitleg> voor de voorspelvraag in elke les.
export default {
  ...MDXComponents,
  Antwoordblad,
  Handout,
  Schrijflijnen,
  SiteLink,
  Voorkennis,
  Voorspel,
  Keuze,
  Uitleg,
};
