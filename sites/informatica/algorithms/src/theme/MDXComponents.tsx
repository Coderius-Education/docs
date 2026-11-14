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
import { Werkvormen } from '@coderius/shared/components/Werkvorm';
import AlgorithmModel from '@site/src/components/AlgorithmModel';
import GameTree from '@site/src/components/GameTree';
import HanoiGame from '@site/src/components/HanoiGame';
import PyRunner from '@site/src/components/PyRunner';
import MDXComponents from '@theme-original/MDXComponents';

export default {
  ...MDXComponents,
  CodeUitleg,
  Regel,
  SiteLink,
  Voorkennis,
  AlgorithmModel,
  Antwoordblad,
  GameTree,
  Handout,
  Schrijflijnen,
  HanoiGame,
  PyRunner,
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
