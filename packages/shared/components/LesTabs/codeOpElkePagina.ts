// Clientmodule van een cursus met les-tabbladen (createConfig zet hem aan).
// Een pagina met tabbladen past de letters van zijn code zelf aan (LesTabs);
// een pagina zonder (de cheatsheet, een overzicht van foutmeldingen, een
// hand-out) heeft dat onderdeel niet. Daar doet deze module het: na elke
// pagina, na een klik (een uitklapblok dat opengaat) en bij een andere maat
// van het venster.
import { pasCode } from './pasCode';

const pas = () => {
  if (!document.querySelector('[data-les-tabs]')) pasCode(document);
};
const straks = () => window.requestAnimationFrame(pas);

if (typeof window !== 'undefined') {
  window.addEventListener('resize', straks);
  document.addEventListener('click', straks);
  // Een uitklapblok is bij de klik nog dicht; `toggle` komt als het open is.
  document.addEventListener('toggle', straks, true);
  // Het lettertype van de code is breder dan wat er staat tot het geladen is.
  document.fonts?.addEventListener?.('loadingdone', straks);
}

export function onRouteDidUpdate(): void {
  if (typeof window !== 'undefined') straks();
}
