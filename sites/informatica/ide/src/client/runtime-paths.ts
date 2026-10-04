// Runtime-assets worden self-hosted geserveerd (geen CDN): Pyodide uit
// static/pyodide/ van deze site, Monaco uit de static-map van @coderius/editor.
import { setMonacoBaseUrl } from '@coderius/editor/monaco';
import { setPyodideBaseUrl } from '@coderius/python-runner/PyodideProvider';

setPyodideBaseUrl('/pyodide/');
setMonacoBaseUrl('/monaco/vs');
