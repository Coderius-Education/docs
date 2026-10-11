import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type { ReactNode } from 'react';
// sites.js is CommonJS; named imports werken via de bundler-interop.
import { SITES_BY_ID, routeUrl, siteByUrl } from '../../sites';

/**
 * Alleen voor TSX/JSX-componenten. In lestekst (md/mdx) schrijf je een link als
 * [tekst](site:editor/git/vscode); zie stijlgids §12 en plugins/site-links.js.
 *
 * Inline link naar een pagina op een andere cursussite, opgebouwd uit de
 * gedeelde registry. Waar <Voorkennis> terugblikt (een inklapbaar blok met wat
 * je al gehad hebt), wijst SiteLink vooruit in lopende tekst: "zet je project
 * in git — zie <SiteLink site="editor" to="/git/vscode/">Git in VS Code</SiteLink>".
 *
 * De registry is de enige bron van waarheid voor cursus-URL's (stijlgids §12);
 * dit component bestaat zodat een vooruitwijzing geen hardcoded
 * *.coderius.nl-URL nodig heeft. `packages/shared/sitelink.test.ts` controleert
 * monorepo-breed dat elk doelpad echt bestaat.
 */
export default function SiteLink({
  site,
  to,
  children,
}: {
  /** Registry-id van de cursus (bv. 'editor'). Weglaten = huidige cursus. */
  site?: string;
  /** Pad binnen die cursus, bv. '/git/vscode/'. */
  to: string;
  children: ReactNode;
}): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  // De cursus staat onder een pad van de vak-host: url + baseUrl wijst hem aan.
  const current = siteByUrl(siteConfig.url + siteConfig.baseUrl);
  const target = site ? SITES_BY_ID[site] : current;
  const isExternal = !!target && (!current || target.id !== current.id);

  if (isExternal && target) {
    return (
      <a href={routeUrl(target.id, to)} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return <Link to={to}>{children}</Link>;
}
