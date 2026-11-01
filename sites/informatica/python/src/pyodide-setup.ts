import { setPyodideBaseUrl } from '@coderius/python-runner/PyodideProvider';
import siteConfig from '@generated/docusaurus.config';

// python-docs serveert Pyodide zelf onder <baseUrl>pyodide/ (geen CDN); createConfig
// zet de runtime daar bij start en build klaar uit node_modules.
// Deze clientModule draait op elke pagina vóór de componenten mounten.
setPyodideBaseUrl(`${siteConfig.baseUrl}pyodide/`);
