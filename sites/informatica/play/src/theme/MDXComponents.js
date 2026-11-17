import CodeUitleg, { Regel } from '@coderius/shared/components/CodeUitleg';
import LesTabs, {
  LesDoel,
  LesHulp,
  LesLeerdoel,
  LesReeks,
  LesStap,
  LesStappen,
  LesTab,
  LesVeld,
  LesVoorbeeld,
} from '@coderius/shared/components/LesTabs';
import SiteLink from '@coderius/shared/components/SiteLink';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import { Werkvormen } from '@coderius/shared/components/Werkvorm';
import CheatsheetGrid from '@site/src/components/CheatsheetGrid';
import CheatsheetSearch from '@site/src/components/CheatsheetSearch';
import PygbagRunner from '@site/src/components/PygbagRunner';
import MDXComponents from '@theme-original/MDXComponents';

// De lessen zijn deels .md; zonder registratie hier zou een JSX-tag daar als
// platte tekst renderen.
export default {
  ...MDXComponents,
  SiteLink,
  Voorkennis,
  CodeUitleg,
  Regel,
  PygbagRunner,
  CheatsheetGrid,
  CheatsheetSearch,
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
  LesHulp,
  LesReeks,
  // De docentenhandleiding: de onderdelen van een les met hun literatuur.
  Werkvormen,
};
