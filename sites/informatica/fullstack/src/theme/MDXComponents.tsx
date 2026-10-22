import Antwoordblad from '@coderius/shared/components/Antwoordblad';
import CodeUitleg, { Regel } from '@coderius/shared/components/CodeUitleg';
import Handout from '@coderius/shared/components/Handout';
import Schrijflijnen from '@coderius/shared/components/Schrijflijnen';
import SiteLink from '@coderius/shared/components/SiteLink';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import Voorspel, { Keuze, Uitleg } from '@coderius/shared/components/Voorspel';
import Bestand from '@site/src/components/Bestand';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt deze componenten globaal beschikbaar in alle .md/.mdx zonder import:
// <Voorkennis>, <SiteLink>, <CodeUitleg> met <Regel>, <Bestand> (het label
// boven een codeblok), <Voorspel> met <Keuze> en <Uitleg> (losse vragen met
// meteen terugkoppeling), en de hand-outcomponenten van docs/unplugged.
export default {
  ...MDXComponents,
  Antwoordblad,
  Bestand,
  CodeUitleg,
  Handout,
  Keuze,
  Regel,
  Schrijflijnen,
  SiteLink,
  Uitleg,
  Voorkennis,
  Voorspel,
};
