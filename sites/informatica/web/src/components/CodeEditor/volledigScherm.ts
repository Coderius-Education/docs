// Echt volledig scherm (de Fullscreen API) haalt ook de adresbalk en de tabs
// van de browser weg; Groter vult alleen het venster. Niet elke browser kan
// het: de iPhone heeft de API niet voor een gewone <div>, en in een iframe
// zonder `allow="fullscreen"` staat `fullscreenEnabled` op false. Dan blijft
// alleen Groter over.

interface MetFullscreen {
  fullscreenEnabled?: boolean;
}

interface MetRequest {
  requestFullscreen?: unknown;
}

export function kanVolledigScherm(doc: MetFullscreen, el: MetRequest | null | undefined): boolean {
  return doc.fullscreenEnabled === true && typeof el?.requestFullscreen === 'function';
}

export type SchermStand = 'normaal' | 'groter' | 'volledig';

// Volledig scherm gaat voor: wie vanuit Groter naar volledig scherm ging en
// op Esc drukt, staat daarna weer in Groter, dus waar hij was.
export function schermStand(uitgeklapt: boolean, volledig: boolean): SchermStand {
  if (volledig) return 'volledig';
  return uitgeklapt ? 'groter' : 'normaal';
}
