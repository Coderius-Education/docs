// Eén bron voor de koppeling tussen web.coderius.nl en de Code.org Web Lab-cursus
// "Web Development". Zowel de per-les callout (<CodeOrg>) als de centrale tabel
// (<CodeOrgTabel>) lezen hieruit, zodat ze nooit uit elkaar lopen.
//
// Jaar-bump (bv. 2026 -> 2027) is hier één regel: pas CODEORG_COURSE aan.
// De lesnummers en Engelse titels komen uit de Code.org unit-1 lessenlijst.
export const CODEORG_COURSE = 'web-development-2026';
export const CODEORG_UNIT = 1;

// Directe level-URL van een les (level 1), zonder class-specifieke section_id.
export function lessonUrl(lesson: number): string {
  return `https://studio.code.org/courses/${CODEORG_COURSE}/units/${CODEORG_UNIT}/lessons/${lesson}/levels/1`;
}

export type CodeOrgLes = {
  /** coderius-paginaslug onder /docs/html-css/ */
  slug: string;
  /** interne coderius-route */
  to: string;
  /** Code.org lesnummer (unit 1) */
  lesson: number;
  /** Engelse Code.org-lestitel */
  title: string;
  /** Nederlandse titel van de coderius-oefenpagina */
  nl: string;
  /** directe Code.org level-URL */
  url: string;
};

// Didactische volgorde (bewust niet numeriek), zoals de hub-tabel die aanhoudt.
export const codeorgUnit1: CodeOrgLes[] = (
  [
    { slug: 'intro-html', lesson: 2, title: 'Intro to HTML', nl: 'Intro tot HTML' },
    { slug: 'koppen-lijsten', lesson: 3, title: 'Headings and Lists', nl: 'Koppen en lijsten' },
    {
      slug: 'tekst-opmaken-css',
      lesson: 6,
      title: 'Styling Text with CSS',
      nl: 'Tekst opmaken met CSS',
    },
    { slug: 'afbeeldingen', lesson: 8, title: 'Using Images', nl: 'Afbeeldingen' },
    { slug: 'paginas-koppelen', lesson: 17, title: 'Linking Pages', nl: "Pagina's koppelen" },
    {
      slug: 'elementen-opmaken',
      lesson: 9,
      title: 'Styling Elements with CSS',
      nl: 'Elementen opmaken',
    },
    { slug: 'css-klassen', lesson: 11, title: 'CSS Classes', nl: 'CSS Klassen' },
    { slug: 'pseudo-klassen', lesson: 18, title: 'CSS Pseudo-classes', nl: 'CSS Pseudo-klassen' },
    { slug: 'flexbox', lesson: 12, title: 'Organizing Content with Flexbox', nl: 'Flexbox' },
  ] as const
).map((l) => ({ ...l, to: `/docs/html-css/${l.slug}`, url: lessonUrl(l.lesson) }));

// Snelle lookup op slug voor de per-les callout.
export const codeorgBySlug: Record<string, CodeOrgLes> = Object.fromEntries(
  codeorgUnit1.map((l) => [l.slug, l]),
);

export type CodeOrgProject = { lesson: number; title: string; url: string };

// Code.org's projectlessen waarin leerlingen een eigen (multi-page) website
// bouwen — aansluitend op onze capstone /jouw-website.
export const codeorgProjects: CodeOrgProject[] = [
  { lesson: 19, title: 'Planning a Multi-Page Site' },
  { lesson: 20, title: 'Project - Website for a Purpose' },
  { lesson: 14, title: 'Chapter 1 Project' },
].map((p) => ({ ...p, url: lessonUrl(p.lesson) }));
