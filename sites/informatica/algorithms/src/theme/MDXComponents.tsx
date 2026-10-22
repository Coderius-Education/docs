import Antwoordblad from '@coderius/shared/components/Antwoordblad';
import CodeUitleg, { Regel } from '@coderius/shared/components/CodeUitleg';
import Handout from '@coderius/shared/components/Handout';
import Schrijflijnen from '@coderius/shared/components/Schrijflijnen';
import SiteLink from '@coderius/shared/components/SiteLink';
import Voorkennis from '@coderius/shared/components/Voorkennis';
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
};
