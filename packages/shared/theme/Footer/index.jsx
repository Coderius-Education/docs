// De footer op één regel, op elke pagina van elke cursus: links de cursus
// (leerdoelen, docentenhandleiding, wat de site zelf meegeeft), in het midden
// de licentie als klein plaatje, rechts Coderius. De links komen uit de config
// (createConfig maakt er twee kolommen van); de titels van de kolommen staan
// er alleen voor een schermlezer.
//
// Eerst stond elke kolom met zijn titel en links onder elkaar, met de
// licentie in een zin eronder: 270 pixels, meer dan de helft van wat een les
// op 1280×720 aan ruimte heeft. Nu is hij zo'n 45 pixels.
//
// Een site die Footer zelf swizzlet, schaduwt deze; klas.test.ts bewaakt dat.

import { ThemeClassNames, useThemeConfig } from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';
import LinkItem from '@theme/Footer/LinkItem';
import clsx from 'clsx';
import React from 'react';

export const LICENTIE = {
  url: 'https://creativecommons.org/licenses/by-nc/4.0/deed.nl',
  naam: 'Creative Commons Naamsvermelding-NietCommercieel 4.0 Internationaal (CC BY-NC 4.0)',
};

function Links({ kolom, className }) {
  if (!kolom?.items?.length) return <div className={className} />;
  return (
    <nav className={clsx('coderius-footer__links', className)} aria-label={kolom.title}>
      <ul>
        {kolom.items.map((item) => (
          <li key={item.href ?? item.to}>
            <LinkItem item={item} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Footer() {
  const { footer } = useThemeConfig();
  const plaatje = useBaseUrl('/img/cc-by-nc.svg');
  if (!footer) return null;
  const [cursus, coderius] = footer.links ?? [];
  return (
    <footer
      className={clsx(ThemeClassNames.layout.footer.container, 'footer', 'coderius-footer', {
        'footer--dark': footer.style === 'dark',
      })}
    >
      <div className="container container-fluid coderius-footer__rij">
        <Links kolom={cursus} className="coderius-footer__cursus" />
        <a
          className="coderius-footer__licentie"
          href={LICENTIE.url}
          target="_blank"
          rel="license noopener noreferrer"
          title={`Licentie: ${LICENTIE.naam}`}
        >
          <img src={plaatje} alt={`Licentie: ${LICENTIE.naam}`} width={80} height={15} />
        </a>
        <Links kolom={coderius} className="coderius-footer__coderius" />
      </div>
    </footer>
  );
}

export default React.memo(Footer);
