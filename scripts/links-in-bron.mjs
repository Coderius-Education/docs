/**
 * Alle links in een md/mdx-bronbestand, met de plek van de ruwe URL in de
 * bron. Gedeeld door de guard-test (packages/shared/links-in-lestekst.test.ts)
 * en de omzetter (scripts/zet-links-om.mjs): beide moeten precies dezelfde
 * links zien als Docusaurus, dus geen regex maar dezelfde parser (remark met
 * mdx, gfm, directives en frontmatter).
 */

import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(remarkMdx);

/**
 * @typedef {{
 *   soort: 'link' | 'definition' | 'sitelink',
 *   url: string,
 *   start: number, end: number,
 *   urlStart?: number, urlEnd?: number,
 *   regel: number,
 *   node: any,
 * }} BronLink
 */

/**
 * Begin en eind van de ruwe bestemming na `](` of `]:`, of null als de bron
 * daar iets anders heeft dan verwacht (dan zet niemand hem automatisch om).
 * @param {string} bron
 * @param {number} vanaf positie direct na `(` of `:`
 */
function bestemming(bron, vanaf) {
  let i = vanaf;
  while (i < bron.length && /[ \t\n]/.test(bron[i])) i++;
  if (bron[i] === '<') {
    const eind = bron.indexOf('>', i);
    return eind < 0 ? null : { urlStart: i + 1, urlEnd: eind };
  }
  const start = i;
  let diepte = 0;
  for (; i < bron.length; i++) {
    const c = bron[i];
    if (c === '\\') {
      i++;
      continue;
    }
    if (/\s/.test(c)) break;
    if (c === '(') diepte++;
    else if (c === ')') {
      if (diepte === 0) break;
      diepte--;
    }
  }
  return i > start ? { urlStart: start, urlEnd: i } : null;
}

/**
 * Docusaurus zet HTML-commentaar om naar MDX-commentaar voordat MDX de bron
 * ziet (markdown.mdx1Compat.comments). Even lang vervangen: de offsets blijven
 * kloppen met het origineel.
 */
function alsMdx1(bron) {
  return bron.replace(/<!--([\s\S]*?)-->/g, (_, binnen) => `{/* ${binnen}*/}`);
}

function bezoek(node, fn) {
  if (fn(node) === false) return;
  for (const kind of node.children || []) bezoek(kind, fn);
}

/**
 * @param {string} bron
 * @returns {{ links: BronLink[], fout?: string }}
 */
export function linksInBron(bron) {
  let tree;
  try {
    tree = processor.parse(alsMdx1(bron));
  } catch (err) {
    return { links: [], fout: String(err.message ?? err) };
  }
  const links = [];
  bezoek(tree, (node) => {
    const pos = node.position;
    if (!pos) return;
    const start = pos.start.offset;
    const end = pos.end.offset;
    if (node.type === 'link') {
      const ruw = bron.slice(start, end);
      // Autolinks (<https://...>) en kale gfm-URL's hebben geen ](.
      if (!ruw.startsWith('[')) return;
      const labelEind = node.children.length
        ? node.children[node.children.length - 1].position.end.offset
        : start + 1;
      const open = bron.indexOf('](', labelEind);
      const plek = open >= 0 && open < end ? bestemming(bron, open + 2) : null;
      links.push({
        soort: 'link',
        url: node.url,
        start,
        end,
        ...plek,
        regel: pos.start.line,
        node,
      });
    } else if (node.type === 'definition') {
      const open = bron.indexOf(']:', start);
      const plek = open >= 0 && open < end ? bestemming(bron, open + 2) : null;
      links.push({
        soort: 'definition',
        url: node.url,
        start,
        end,
        ...plek,
        regel: pos.start.line,
        node,
      });
    } else if (
      (node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') &&
      node.name === 'SiteLink'
    ) {
      const attr = Object.fromEntries(
        (node.attributes || [])
          .filter((a) => a.type === 'mdxJsxAttribute')
          .map((a) => [a.name, typeof a.value === 'string' ? a.value : undefined]),
      );
      links.push({
        soort: 'sitelink',
        url: attr.to ?? '',
        site: attr.site,
        start,
        end,
        regel: pos.start.line,
        node,
      });
      return false;
    }
  });
  return { links };
}

/** Mappen waarvan de content-plugins de md/mdx verwerken, en dus site:-links omzetten. */
export const CONTENTMAPPEN = ['docs', 'src/pages', 'blog', 'lego_auto', 'click_golfer'];

const ASSET = /\.(?!mdx?$)[a-z0-9]{1,5}$/i;

/**
 * Wijst deze URL naar een pagina die als site:-link geschreven hoort te
 * worden? Nee voor externe URL's (met schema, ook site: zelf), ankers op
 * dezelfde pagina, afbeeldingen en downloads (een extensie anders dan .md).
 * @param {string} url
 */
export function isPaginaLink(url) {
  if (!url || url.startsWith('#') || url.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(url))
    return false;
  const pad = url.split(/[?#]/)[0];
  if (pad.startsWith('@site/')) return /\.mdx?$/i.test(pad);
  return !ASSET.test(pad.split('/').pop() ?? '');
}
