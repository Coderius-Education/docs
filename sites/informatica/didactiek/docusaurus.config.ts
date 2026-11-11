import fs from 'node:fs';
import path from 'node:path';
import { createConfig } from '@coderius/shared/config';
import { exportTips } from './src/data/export';

export default createConfig({
  title: 'Didactiek — Coderius',
  tagline: 'Waarom we het zo doen, en waarop dat berust',
  siteId: 'didactiek',
  organizationName: 'coderius',
  projectName: 'coderius-didactiek',
  matomoSiteId: 14,
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  description:
    'De onderbouwing achter het Coderius-lesmateriaal: didactische tips en de onderzoeken waarop ze rusten.',
  keywords:
    'didactiek, onderwijs, cognitive load, PRIMM, scaffolding, retrieval practice, onderzoek',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'bronnen',
          numberPrefixParser: false,
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],

  plugins: [
    // De tips als tips.json naast de site: per categorie de controlevragen,
    // met het adres van de onderbouwing. Zo is de verzameling buiten deze
    // repo te gebruiken als invoer voor het nalopen van een cursus.
    function tipsExport(context: { siteConfig: { url: string; baseUrl: string } }) {
      return {
        name: 'didactiek-tips-export',
        async postBuild({ outDir }: { outDir: string }) {
          const { url, baseUrl } = context.siteConfig;
          const basis = `${url}${baseUrl}`.replace(/\/$/, '');
          fs.writeFileSync(
            path.join(outDir, 'tips.json'),
            `${JSON.stringify(exportTips(basis), null, 2)}\n`,
          );
        },
      };
    },
  ],

  themeConfig: {
    navbar: {
      items: [
        { to: '/', label: 'Tips', position: 'left' },
        { to: '/checklist', label: 'Checklist', position: 'left' },
        { type: 'docSidebar', sidebarId: 'bronnenSidebar', position: 'left', label: 'Bronnen' },
      ],
    },
    prism: {
      additionalLanguages: ['python'],
    },
  },
});
