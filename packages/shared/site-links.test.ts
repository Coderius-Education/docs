import { createRequire } from 'node:module';
import { parseSiteUrl, routeUrl } from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';

// [tekst](site:<cursus>/<pad>#anker) is de enige vorm voor een link naar een
// pagina in lestekst (stijlgids §12). Dezelfde testvectoren staan in
// docs-management (frontend/src/lib/authoring/siteLinks.test.ts): de knop
// 'Link naar pagina' schrijft precies deze vorm.

const require = createRequire(import.meta.url);
const remarkSiteLinks = require('./plugins/site-links');
const { createConfig, withSiteLinks } = require('./config');

type Node = {
  type: string;
  url?: string;
  identifier?: string;
  data?: { hProperties?: Record<string, string> };
  children?: Node[];
};

function verwerk(nodes: Node[], siteId?: string) {
  const tree: Node = { type: 'root', children: [{ type: 'paragraph', children: nodes }] };
  remarkSiteLinks({ siteId })(tree, {
    fail(message: string) {
      throw new Error(message);
    },
  });
  return nodes;
}

describe('parseSiteUrl en routeUrl', () => {
  it.each([
    ['site:python/docs/lussen', { site: 'python', route: '/docs/lussen' }],
    [
      'site:python/docs/lussen#for-lus',
      { site: 'python', route: '/docs/lussen', anchor: 'for-lus' },
    ],
    ['site:editor/', { site: 'editor', route: '/' }],
    ['site:algorithms/docs/cfg/concept', { site: 'algorithms', route: '/docs/cfg/concept' }],
  ])('ontleedt %s', (url, verwacht) => {
    expect(parseSiteUrl(url)).toEqual(verwacht);
  });

  it('negeert andere URLs en weigert misvormde site:-links', () => {
    expect(parseSiteUrl('/docs/x')).toBeNull();
    expect(parseSiteUrl('https://coderius.nl')).toBeNull();
    expect(() => parseSiteUrl('site:python')).toThrow(/site:<cursus>/);
    expect(() => parseSiteUrl('site:python/docs/a b')).toThrow();
    expect(() => parseSiteUrl('site:python/docs/x?y=1')).toThrow();
  });

  it('bouwt de productie-URL uit de registry, met het pad van de cursus', () => {
    expect(routeUrl('algorithms', '/docs/cfg', 'stap-1')).toBe(
      'https://informatica.coderius.nl/algoritmes/docs/cfg#stap-1',
    );
    expect(routeUrl('home', '/')).toBe('https://coderius.nl/');
    expect(() => routeUrl('bestaat-niet', '/')).toThrow(/bestaat-niet/);
  });
});

describe('remark-plugin site-links', () => {
  it('maakt van een link naar de eigen cursus een interne route', () => {
    const [link] = verwerk(
      [{ type: 'link', url: 'site:python/docs/lussen#for', children: [] }],
      'python',
    );
    expect(link.url).toBe('/docs/lussen#for');
    expect(link.data?.hProperties).toBeUndefined();
  });

  it('opent een andere cursus in een nieuw tabblad', () => {
    const [link] = verwerk([{ type: 'link', url: 'site:web/docs/html', children: [] }], 'python');
    expect(link.url).toBe('https://informatica.coderius.nl/web/docs/html');
    expect(link.data?.hProperties).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
  });

  it('volgt definities naar hun linkverwijzingen', () => {
    const [def, ref] = verwerk(
      [
        { type: 'definition', identifier: 'web', url: 'site:web/docs/html' },
        { type: 'linkReference', identifier: 'web', children: [] },
      ],
      'python',
    );
    expect(def.url).toBe('https://informatica.coderius.nl/web/docs/html');
    expect(ref.data?.hProperties?.target).toBe('_blank');
  });

  it('laat andere links met rust en laat de build falen op een onbekende cursus', () => {
    const [extern, eigen] = verwerk(
      [
        { type: 'link', url: 'https://example.com', children: [] },
        { type: 'link', url: './andere-les', children: [] },
      ],
      'python',
    );
    expect(extern.url).toBe('https://example.com');
    expect(eigen.url).toBe('./andere-les');
    expect(() => verwerk([{ type: 'link', url: 'site:pyton/docs/x', children: [] }])).toThrow(
      /pyton/,
    );
  });
});

describe('createConfig hangt de plugin in elke content-plugin', () => {
  it('in docs, pages en blog van het classic preset, vóór de eigen plugins', () => {
    const eigen = () => () => {};
    const config = createConfig({
      siteId: 'python',
      presets: [['classic', { docs: { beforeDefaultRemarkPlugins: [eigen] }, blog: false }]],
    });
    const [, opts] = config.presets[0];
    expect(opts.docs.beforeDefaultRemarkPlugins).toEqual([
      [remarkSiteLinks, { siteId: 'python' }],
      eigen,
    ]);
    expect(opts.pages.beforeDefaultRemarkPlugins[0]).toEqual([
      remarkSiteLinks,
      { siteId: 'python' },
    ]);
    expect(opts.blog).toBe(false);
  });

  it('in losse docs-instanties, ook als string', () => {
    const { plugins } = withSiteLinks(
      [],
      [
        ['@docusaurus/plugin-content-docs', { id: 'lego_auto', path: 'lego_auto' }],
        '@docusaurus/plugin-content-pages',
        ['@docusaurus/plugin-ideal-image', {}],
      ],
      'robotica',
    );
    expect(plugins[0][1]).toMatchObject({
      id: 'lego_auto',
      beforeDefaultRemarkPlugins: [[remarkSiteLinks, { siteId: 'robotica' }]],
    });
    expect(plugins[1][1].beforeDefaultRemarkPlugins).toHaveLength(1);
    expect(plugins[2]).toEqual(['@docusaurus/plugin-ideal-image', {}]);
  });
});
