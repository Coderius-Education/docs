/**
 * Bepaal of een `message`-event uit het eigen lab-iframe komt en een
 * formulier-submit is.
 *
 * Het iframe post zijn formulierdata met `postMessage(..., '*')` naar de
 * parent, en de parent luistert op `window`. Elke `<DvwaLab>` op dezelfde
 * pagina ontvangt dus elk bericht — ook dat van een ander lab. Zonder deze
 * check reageren twee labs op één lespagina (bijv. low en medium naast elkaar)
 * op elkaars formulieren: een submit in het ene lab draait ook de PHP van het
 * andere. Alleen een bericht waarvan `event.source` het eigen iframe-window is,
 * telt mee.
 *
 * @param {MessageEvent | null | undefined} event
 * @param {Window | null | undefined} iframeWindow `iframeRef.current?.contentWindow`
 * @returns {boolean}
 */
export function isEigenLabBericht(event, iframeWindow) {
  if (!iframeWindow || !event || event.source !== iframeWindow) return false;
  return Boolean(event.data) && event.data.type === 'dvwa-form';
}
