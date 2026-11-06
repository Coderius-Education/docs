import {
  type PyodideInterface as GedeeldePyodide,
  openVerseMain,
  sluitVerseMain,
} from '@coderius/python-runner/PyodideProvider';

// Na een run haalt de runner de bomen op die de verborgen code (of de les
// zelf) in _coderius_bomen heeft gezet, als JSON; de knop "Teken de bomen"
// tekent ze dan.
const BOMEN_LEEG = '_coderius_bomen = []';
const BOMEN_OPHALEN =
  "import json as _coderius_json; _coderius_json.dumps(globals().get('_coderius_bomen') or [])";

type Draaier = {
  runPythonAsync: (code: string, options?: { globals?: unknown }) => Promise<unknown>;
};

/**
 * Draait de verborgen code en daarna de code van de editor, samen in een
 * verse module __main__, en geeft de bomen terug als JSON.
 *
 * Alle runners op een pagina delen één Pyodide. Zonder eigen globals bleef
 * alles van een eerdere run staan, ook van een andere runner: een vergeten
 * `score = 0` gaf dan geen NameError maar de score van het onderzoek, `random`
 * werkte zonder import, en een functie uit de opdracht bestond nog in de
 * editor eronder. Elke run begint daarom leeg, zoals in de python-cursus
 * (openVerseMain uit @coderius/python-runner). Ingeladen modules blijven wel
 * in sys.modules; alleen de namen van de vorige run zijn weg.
 */
export async function draaiInVerseMain(
  py: Draaier,
  code: string,
  verborgen?: string | null,
): Promise<string> {
  const gedeeld = py as unknown as GedeeldePyodide;
  const namespace = openVerseMain(gedeeld);
  const opties = namespace ? { globals: namespace } : undefined;
  try {
    await py.runPythonAsync(BOMEN_LEEG, opties);
    if (verborgen) await py.runPythonAsync(verborgen, opties);
    await py.runPythonAsync(code, opties);
    return (await py.runPythonAsync(BOMEN_OPHALEN, opties)) as string;
  } finally {
    sluitVerseMain(gedeeld, namespace);
  }
}
