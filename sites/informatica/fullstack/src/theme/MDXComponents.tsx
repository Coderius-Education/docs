import Antwoordblad from '@coderius/shared/components/Antwoordblad';
import CodeUitleg, { Regel } from '@coderius/shared/components/CodeUitleg';
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
import Schrijflijnen from '@coderius/shared/components/Schrijflijnen';
import SiteLink from '@coderius/shared/components/SiteLink';
import Voorkennis from '@coderius/shared/components/Voorkennis';
import Voorspel, { Keuze, Uitleg } from '@coderius/shared/components/Voorspel';
import { Werkvormen } from '@coderius/shared/components/Werkvorm';
import Bestand from '@site/src/components/Bestand';
import Gelukt from '@site/src/components/Gelukt';
import MDXComponents from '@theme-original/MDXComponents';

// Maakt deze componenten globaal beschikbaar in alle .md/.mdx zonder import:
// <Voorkennis>, <SiteLink>, <CodeUitleg> met <Regel>, <Bestand> (het label
// boven een codeblok), <Voorspel> met <Keuze> en <Uitleg> (losse vragen met
// meteen terugkoppeling), <Gelukt> (het succesmoment van een stap in Online
// zetten), en de hand-outcomponenten van docs/unplugged.
export default {
  ...MDXComponents,
  Antwoordblad,
  Bestand,
  Gelukt,
  CodeUitleg,
  Handout,
  Keuze,
  Regel,
  Schrijflijnen,
  SiteLink,
  Uitleg,
  Voorkennis,
  Voorspel,
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
