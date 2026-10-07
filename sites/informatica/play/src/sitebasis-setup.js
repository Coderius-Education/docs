// clientModule: geeft engine.js de baseUrl van deze site mee (zie
// components/CodeRunner/sitebasis.js).
import siteConfig from '@generated/docusaurus.config';
import { zetBasisPad } from './components/CodeRunner/sitebasis';

zetBasisPad(siteConfig.baseUrl);
