import CodeUitleg, { Regel } from '@coderius/shared/components/CodeUitleg';
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
import Voorspel, { Keuze, Uitleg } from '@coderius/shared/components/Voorspel';
import { Werkvormen } from '@coderius/shared/components/Werkvorm';
import Onderdelenlijst, { Onderdeel } from '@site/src/components/Onderdelenlijst';
import Probleem from '@site/src/components/Probleem';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt <Voorkennis>, <CodeUitleg>/<Regel>, <Voorspel>/<Keuze>/<Uitleg>,
// <Onderdelenlijst>/<Onderdeel> en <Probleem> globaal beschikbaar in alle .md/.mdx zonder import. De lessen
// zijn .md-bestanden; zonder registratie hier zou een JSX-tag daar als platte
// tekst renderen.
export default {
  ...MDXComponents,
  Voorkennis,
  CodeUitleg,
  Regel,
  Probleem,
  Onderdelenlijst,
  Onderdeel,
  Voorspel,
  Keuze,
  Uitleg,
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
