import MDXComponents from '@theme-original/MDXComponents';
import Begrip from '@site/src/components/Begrip';
import Definitie from '@site/src/components/Definitie';
import WelNiet from '@site/src/components/WelNiet';
import Quiz from '@site/src/components/Quiz';
import TermenTrainer from '@site/src/components/TermenTrainer';
import TermenLijst from '@site/src/components/TermenLijst';

// Globaal beschikbaar in alle .md/.mdx-pagina's, zonder import.
export default {
  ...MDXComponents,
  B: Begrip,
  Definitie,
  WelNiet,
  Quiz,
  TermenTrainer,
  TermenLijst,
};
