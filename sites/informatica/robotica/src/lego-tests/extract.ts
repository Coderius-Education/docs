// De extractie zelf staat in packages/shared/codeblokken.js, gedeeld met
// fullstack: beide cursussen halen ```python-blokken uit hun lespagina's en
// laten die in CI compileren. Dit bestand bestaat nog als vaste importplek
// voor schrijf.ts en de tests hier.

export type { Fragment, Overgeslagen } from '@coderius/shared/codeblokken';
export {
  alleLesbestanden,
  dedent,
  fragmentenUit,
  verzamel,
} from '@coderius/shared/codeblokken';
