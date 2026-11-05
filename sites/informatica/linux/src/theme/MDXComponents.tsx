import Antwoordblad from '@coderius/shared/components/Antwoordblad';
import Begrip from '@coderius/shared/components/Begrip';
import Handout from '@coderius/shared/components/Handout';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import Woordenlijst from '@coderius/shared/components/Woordenlijst';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt <Voorkennis> en de hand-outcomponenten van docs/unplugged globaal
// beschikbaar in alle .md/.mdx zonder import, en <Begrip> (dat zet de
// remark-stap van de begrippen in de lessen) en <Woordenlijst>.
export default {
  ...MDXComponents,
  Antwoordblad,
  Begrip,
  Handout,
  Voorkennis,
  Woordenlijst,
};
