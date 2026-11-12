import LesTabs, {
  LesDoel,
  LesLeerdoel,
  LesStap,
  LesStappen,
  LesTab,
  LesVeld,
  LesVoorbeeld,
} from '@coderius/shared/components/LesTabs';
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
  // De docentenhandleiding: de legenda van de iconen op de tabbladen, en per
  // les de werkvormen op een rij.
  Werkvormen,
  LesWerkvormen,
};
