import CodeUitleg, { Regel } from '@coderius/shared/components/CodeUitleg';
import SiteLink from '@coderius/shared/components/SiteLink';
import Voorkennis from '@coderius/shared/components/Voorkennis';
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
};
