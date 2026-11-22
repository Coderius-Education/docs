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
import Puzzel from '@coderius/shared/components/Puzzel';
import SiteLink from '@coderius/shared/components/SiteLink';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import { LesWerkvormen, Werkvormen } from '@coderius/shared/components/Werkvorm';
import JsLessen from '@site/src/components/JsLessen';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt deze componenten globaal beschikbaar in alle .md/.mdx zonder import.
export default {
  ...MDXComponents,
  SiteLink,
  Voorkennis,
  JsLessen,
  // Een Parsons-puzzel: de regels van werkende code in de goede volgorde
  // zetten, in het tabblad Puzzel van een les.
  Puzzel,
  // Les-tabbladen: de remark-stap zet elke ##-sectie in een <LesTab>,
  // en in een sectie met meer ###-koppen elke ### in een <LesStap>.
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
  // De docentenhandleiding: de legenda van de iconen op de tabbladen, en per
  // les de werkvormen op een rij.
  Werkvormen,
  LesWerkvormen,
};
