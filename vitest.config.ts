import { defineConfig } from 'vitest/config';

// Tests draaien alleen op de nakijk-checker: de gedeelde motor in
// packages/checker en de conceptenlijsten per site. De Docusaurus-sites zelf
// worden niet getest — die dekt `pnpm build` af.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/checker/src/**/*.test.ts', 'sites/*/src/checker/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
