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
import GDQuestLes, { GDQuestTabel } from '@site/src/components/GDQuestLes';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt deze componenten globaal beschikbaar in alle .md/.mdx zonder import.
export default {
  ...MDXComponents,
  SiteLink,
  Voorkennis,
  GDQuestLes,
  GDQuestTabel,
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
