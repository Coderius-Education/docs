// Herkent een bibliotheek die een leerling naast zijn eigen code meelevert:
// jQuery, Bootstrap, Font Awesome. Zo'n bestand telde eerst als eigen werk:
// een project met alleen een kop en een jquery.min.js kreeg functies, loops,
// arrays, if else en events op "toegepast", en Buiten de lesstof stond vol
// met wat de leerling nooit schreef.
//
// Bewust aan de voorzichtige kant: een eigen bestand mag nooit wegvallen. Een
// naam als reset.css of chart.js kan van de leerling zelf zijn en telt dus
// niet als bibliotheek.

// Namen die een leerling niet zelf aan zijn eigen bestand geeft.
const BEKEND =
  /^(?:jquery|bootstrap|popper|normalize|font-?awesome|tailwind)(?:[.-][\w.-]*)?\.(?:js|css)$/i;

// Een geminificeerd bestand heeft regels van duizenden tekens; met de hand
// geschreven code niet.
const LANGE_REGEL = 1000;

export function lijktBibliotheek(path: string, content: string): boolean {
  const naam = path.slice(path.lastIndexOf('/') + 1);
  if (!/\.(?:js|mjs|css)$/i.test(naam)) return false;
  if (/\.min\.(?:js|css)$/i.test(naam) || BEKEND.test(naam)) return true;
  // Bibliotheken beginnen met een licentiekop die bewaard moet blijven: /*!
  if (content.trimStart().startsWith('/*!')) return true;
  return content.split('\n').some((regel) => regel.length > LANGE_REGEL);
}
