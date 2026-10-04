import { setPyodideBaseUrl } from '@coderius/python-runner/PyodideProvider';
import siteConfig from '@generated/docusaurus.config';

// python-docs serveert Pyodide lokaal vanuit static/pyodide/ (offline, geen CDN).
// Deze clientModule draait op elke pagina vóór de componenten mounten.
setPyodideBaseUrl(`${siteConfig.baseUrl}pyodide/`);
