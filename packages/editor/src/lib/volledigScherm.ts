import { type RefObject, useCallback, useEffect, useState } from 'react';

// Volledig scherm via de Fullscreen API: ook de navbar van de site en de
// adresbalk en tabs van de browser weg. Niet elke browser kan het voor een
// gewoon element: de iPhone niet, en een iframe zonder `allow="fullscreen"`
// ook niet. Daar verschijnt de knop niet; de editor vult op de IDE-pagina
// het venster al.
export function kanVolledigScherm(
  doc: { fullscreenEnabled?: boolean },
  el: { requestFullscreen?: unknown } | null | undefined,
): boolean {
  return doc.fullscreenEnabled === true && typeof el?.requestFullscreen === 'function';
}

export function useVolledigScherm(ref: RefObject<HTMLElement | null>) {
  const [kan] = useState(
    () => typeof document !== 'undefined' && kanVolledigScherm(document, document.documentElement),
  );
  const [aan, setAan] = useState(false);

  // De browser beslist zelf wanneer volledig scherm eindigt (Esc, F11, de
  // melding bovenin); de stand volgt dus alleen fullscreenchange.
  useEffect(() => {
    const bijWissel = () => setAan(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', bijWissel);
    return () => {
      document.removeEventListener('fullscreenchange', bijWissel);
      // Verdwijnt de editor terwijl hij het scherm vult, dan zou de browser op
      // een leeg volledig scherm blijven staan.
      if (document.fullscreenElement && document.fullscreenElement === ref.current) {
        void document.exitFullscreen();
      }
    };
  }, [ref]);

  const wissel = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      void document.exitFullscreen();
      return;
    }
    // Een weigering (beleid op een beheerd apparaat) laat de editor gewoon
    // staan zoals hij stond; er is niets om op terug te vallen.
    el.requestFullscreen().catch(() => {});
  }, [ref]);

  return { kan, aan, wissel };
}
