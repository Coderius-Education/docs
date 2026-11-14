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
import MDXComponents from '@theme-original/MDXComponents';

// Maakt <Voorkennis> globaal beschikbaar in alle .md/.mdx zonder import.
export default {
  ...MDXComponents,
  Voorkennis,
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
