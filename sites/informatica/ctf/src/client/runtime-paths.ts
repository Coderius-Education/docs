// Runtime-assets worden self-hosted geserveerd (geen CDN), onder de baseUrl
// van de site (/ide/pyodide/, niet /pyodide/ op de vak-host): Pyodide uit
// node_modules (createConfig zet hem onder pyodide/), Monaco uit de static-map
// van @coderius/editor.
import { setMonacoBaseUrl } from '@coderius/editor/monaco';
import { setPyodideBaseUrl } from '@coderius/python-runner/PyodideProvider';
import siteConfig from '@generated/docusaurus.config';

setPyodideBaseUrl(`${siteConfig.baseUrl}pyodide/`);
setMonacoBaseUrl(`${siteConfig.baseUrl}monaco/vs`);
