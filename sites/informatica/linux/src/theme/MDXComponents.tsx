import Antwoordblad from '@coderius/shared/components/Antwoordblad';
import Begrip from '@coderius/shared/components/Begrip';
import Handout from '@coderius/shared/components/Handout';
import LesTabs, {
  LesDoel,
  LesLeerdoel,
  LesReeks,
  LesStap,
  LesStappen,
  LesTab,
  LesVeld,
  LesVoorbeeld,
} from '@coderius/shared/components/LesTabs';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import { Werkvormen } from '@coderius/shared/components/Werkvorm';
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
  // Les-tabbladen: de remark-stap zet elke ##-sectie in een <LesTab>, en in
  // een sectie met meer ###-koppen elke ### in een <LesStap>.
  LesTabs,
  LesTab,
  LesStappen,
  LesStap,
  LesLeerdoel,
  LesVoorbeeld,
  LesVeld,
  LesDoel,
  LesReeks,
  // De docentenhandleiding: de onderdelen van een les met hun literatuur.
  Werkvormen,
};
