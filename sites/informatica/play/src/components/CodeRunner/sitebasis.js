// De play-site staat onder een pad van de vak-host (https://informatica.
// coderius.nl/play/), dus de wheels in static/whl/ staan op /play/whl/, niet
// op /whl/. srcdoc-iframes hebben een opaque origin en kunnen geen relatief
// pad oplossen; daarom bouwt engine.js een absolute URL uit origin plus dit pad.
// src/sitebasis-setup.js zet het pad als clientModule uit de baseUrl.

let basisPad = '/';

/** @param {string} pad de baseUrl van de site, bv. '/play/' */
export function zetBasisPad(pad) {
  basisPad = pad.endsWith('/') ? pad : `${pad}/`;
}

/** Origin plus baseUrl zonder slash erachter, bv. 'https://informatica.coderius.nl/play'. */
export function siteBasis() {
  if (typeof window === 'undefined') return '';
  return window.location.origin + basisPad.replace(/\/$/, '');
}
