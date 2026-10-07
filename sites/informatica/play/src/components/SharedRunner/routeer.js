/**
 * Beslist wat de SharedRunner met een bericht uit de gedeelde iframe doet.
 * Pure functie: geen DOM, geen module-state, zodat index.js een dunne
 * aanroeper wordt en de beslissing in vitest te testen is.
 *
 * Regel: een bericht telt alleen als zijn `requestId` gelijk is aan de run
 * die nu de iframe bezit. Alles daarbuiten wordt genegeerd — ook een bericht
 * zónder requestId. Dat laatste is bewust: de engine hangt aan élk bericht
 * het id van de lopende run, dus een bericht zonder id komt van vóór de
 * eerste run (de boot-fout van Pyodide) en heeft geen eigenaar om naartoe te
 * gaan. De engine herhaalt die fout bij de eerstvolgende 'run', mét id.
 * `iframe-ready` hoort niet bij een run en wordt door index.js vóór deze
 * functie afgehandeld. 'stopped' wordt bewust niet doorgegeven: stop() laat
 * de eigenaar meteen los en een preemptie geeft de iframe al aan de volgende
 * run, dus er is nooit meer een eigenaar om het aan te melden.
 */

const NEGEER = Object.freeze({ negeer: true });

export function routeerBericht(bericht, huidigeRequestId) {
  if (!bericht || typeof bericht !== 'object') return NEGEER;
  if (bericht.requestId == null || huidigeRequestId == null) return NEGEER;
  if (bericht.requestId !== huidigeRequestId) return NEGEER;

  switch (bericht.type) {
    case 'stdout':
      return { type: 'stdout', tekst: String(bericht.text ?? '') };
    case 'stderr':
      return { type: 'stderr', tekst: String(bericht.text ?? '') };
    case 'run-done':
      return { type: 'done' };
    case 'error':
      return { type: 'error', tekst: String(bericht.message ?? ''), fataal: !!bericht.fatal };
    default:
      return NEGEER;
  }
}
