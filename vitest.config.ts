import { defineConfig } from 'vitest/config';

// Bewust een brede include: elk *.test.ts in packages/ of sites/ telt mee. Een
// smalle lijst met mappen zou een nieuwe test buiten die mappen stilzwijgend
// overslaan terwijl `pnpm test` groen blijft — en daar hangen de site-builds
// nu aan.
//
// De tests staan bij de code die ze bewaken: de nakijk-checker en de
// conceptenlijsten per site, de DVWA-labs, de editor-package (preview-builder,
// bestandsboom, paden) en de python-runner. De Docusaurus-pagina's zelf worden
// niet getest — die dekt `pnpm build` af.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['{packages,sites}/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/build/**', '**/.docusaurus/**', '**/__fixtures__/**'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
