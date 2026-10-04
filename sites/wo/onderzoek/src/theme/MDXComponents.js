import Begrip from '@site/src/components/Begrip';
import Definitie from '@site/src/components/Definitie';
import Denker from '@site/src/components/Denker';
import EchtGebeurd from '@site/src/components/EchtGebeurd';
import PrintKnop from '@site/src/components/PrintKnop';
import Quiz from '@site/src/components/Quiz';
import StartKaarten from '@site/src/components/StartKaarten';
import TermenLijst from '@site/src/components/TermenLijst';
import TermenTrainer from '@site/src/components/TermenTrainer';
import WelNiet from '@site/src/components/WelNiet';
import MDXComponents from '@theme-original/MDXComponents';

// Globaal beschikbaar in alle .md/.mdx-pagina's, zonder import.
export default {
  ...MDXComponents,
  B: Begrip,
  Definitie,
  WelNiet,
  Quiz,
  TermenTrainer,
  TermenLijst,
  StartKaarten,
  EchtGebeurd,
  Denker,
  PrintKnop,
};
