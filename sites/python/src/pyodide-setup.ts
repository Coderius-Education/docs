import {setPyodideBaseUrl} from '@coderius/python-runner/PyodideProvider';

// python-docs serveert Pyodide lokaal vanuit static/pyodide/ (offline, geen CDN).
// Deze clientModule draait op elke pagina vóór de componenten mounten.
setPyodideBaseUrl('/pyodide/');
