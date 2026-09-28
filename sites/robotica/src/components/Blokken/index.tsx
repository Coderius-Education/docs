import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { eenmalig } from './eenmalig';
import styles from './styles.module.css';

interface BlokkenProps {
  // Het programma zoals Blockly het bewaart (`serialization.workspaces.save`).
  programma: object;
  // Wat er in de blokken staat, in woorden: de alt-tekst van het voorbeeld.
  beschrijving: string;
  onderschrift?: string;
}

const MARGE = 12;
const TUSSEN = 24;

// Blockly en de Leaphy-blokken samen zijn bijna 2 MB. Ze worden pas geladen
// op een pagina met blokken, en maar één keer per bezoek; mislukt het, dan
// probeert het volgende voorbeeld het opnieuw.
const laadBlockly = eenmalig(async () => {
  const [B, , nl, { registreer }, { THEME }] = await Promise.all([
    import('blockly/core'),
    import('blockly/blocks'),
    import('blockly/msg/nl'),
    import('./leaphy'),
    import('@leaphy-robotics/leaphy-blocks'),
  ]);
  registreer(B, nl as unknown as Record<string, string>);
  return { B, THEME };
});

// Leaphy-blokken zoals Easybloqs ze toont, maar alleen om naar te kijken:
// niets verslepen, niets aanpassen. Past het programma niet in de breedte,
// dan wordt het kleiner in plaats van dat de pagina opzij gaat schuiven.
export default function Blokken({
  programma,
  beschrijving,
  onderschrift,
}: BlokkenProps): React.JSX.Element {
  const figuur = useRef<HTMLElement>(null);
  const vlak = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'laden' | 'klaar' | 'mislukt'>('laden');

  useEffect(() => {
    const div = vlak.current;
    const buiten = figuur.current;
    if (!div || !buiten) return;
    let weg = false;
    let ws: import('blockly/core').WorkspaceSvg | null = null;
    let schik: (() => Promise<void>) | null = null;
    let begonnen = false;

    const bouw = async () => {
      // Eén keer wachten, en direct daarna kijken of de pagina er nog is.
      // Is de leerling intussen weggeklikt, dan komt er geen werkblad meer in
      // een losgekoppeld vlak dat niemand ooit opruimt.
      const { B, THEME } = await laadBlockly();
      if (weg) return;
      const thema = B.Theme.defineTheme('coderius-leaphy', {
        name: 'coderius-leaphy',
        base: B.Themes.Classic,
        blockStyles: THEME.defaultBlockStyles,
        categoryStyles: THEME.categoryStyles,
        componentStyles: THEME.componentStyles,
      });
      const werk = B.inject(div, {
        theme: thema,
        renderer: 'zelos',
        readOnly: true,
        sounds: false,
        trashcan: false,
        move: { scrollbars: false, drag: false, wheel: false },
        zoom: { controls: false, wheel: false, pinch: false, startScale: 1 },
      });
      ws = werk;
      B.serialization.workspaces.load(programma, werk);

      // Zet de blokken neer en maak het vlak passend. Dat gebeurt opnieuw bij
      // elke nieuwe breedte, en vooral als de figuur zichtbaar wordt: in een
      // dicht uitklapblok tekent Blockly zijn blokken zonder hoogte, en dan
      // komen ze over elkaar te staan. Alleen de laatste aanroep telt.
      let beurt = 0;
      schik = async () => {
        if (buiten.clientWidth === 0) return;
        const deze = ++beurt;
        werk.setScale(1);
        B.svgResize(werk);
        werk.render();
        // Blockly tekent de blokken pas later. Zonder te wachten is de hoogte
        // van een blok nog niet bekend.
        await B.renderManagement.finishQueuedRenders();
        if (weg || deze !== beurt) return;

        // Het Leaphy-blok en de subprogramma's onder elkaar, in de volgorde
        // van hun `y` in het bestand, en linksboven in het vlak.
        let y = MARGE;
        for (const blok of werk.getTopBlocks(true)) {
          const plek = blok.getRelativeToSurfaceXY();
          blok.moveBy(MARGE - plek.x, y - plek.y);
          y += blok.getHeightWidth().height + TUSSEN;
        }
        await B.renderManagement.finishQueuedRenders();
        if (weg || deze !== beurt) return;

        // Het vlak is precies zo groot als het programma, en past het niet
        // in de breedte, dan schaalt het mee.
        const doos = werk.getBlocksBoundingBox();
        const breedte = doos.right + MARGE;
        const hoogte = doos.bottom + MARGE;
        const schaal = Math.min(1, buiten.clientWidth / breedte);
        div.style.width = `${Math.ceil(breedte * schaal)}px`;
        div.style.height = `${Math.ceil(hoogte * schaal)}px`;
        werk.setScale(schaal);
        B.svgResize(werk);
        werk.scroll(0, 0);
      };
      await schik();
      if (!weg) setStatus('klaar');
    };

    // Pas beginnen als de figuur breedte heeft. In een dicht uitklapblok is
    // die er nog niet, en een werkblad van nul pixels breed meet zijn blokken
    // verkeerd. Zo laadt Blockly ook pas als iemand het antwoord openklapt.
    const begin = () => {
      if (begonnen || buiten.clientWidth === 0) return;
      begonnen = true;
      bouw().catch((fout) => {
        console.error(fout);
        if (!weg) setStatus('mislukt');
      });
    };
    const kijker = new ResizeObserver(() => {
      begin();
      schik?.();
    });
    kijker.observe(buiten);
    begin();

    return () => {
      weg = true;
      kijker.disconnect();
      ws?.dispose();
    };
  }, [programma]);

  return (
    <figure ref={figuur} className={styles.figuur}>
      <div className={styles.kader} role="img" aria-label={beschrijving}>
        <div ref={vlak} className={styles.vlak} data-status={status} aria-hidden="true" />
        {status === 'laden' && <p className={styles.melding}>De blokken worden geladen.</p>}
        {status === 'mislukt' && (
          <p className={styles.melding}>De blokken laden niet. Dit staat erin: {beschrijving}</p>
        )}
      </div>
      {onderschrift && <figcaption>{onderschrift}</figcaption>}
    </figure>
  );
}
