import { SITES, SITES_BY_ID } from '@coderius/shared/sites';
import type { ExamMapping } from './ExamProgram';

export const KLASSEN = ['4', '5+', '4 en 5+'] as const;
export type Klas = (typeof KLASSEN)[number];

export type Activity = {
  /** Registry-id uit packages/shared/sites.js; bepaalt label, beschrijving, link en voorkennis. */
  id: string;
  /** Weergavenaam uit de registry. */
  label: string;
  /** Korte omschrijving uit de registry. */
  description: string;
  /** Voorkennis (registry-ids van cursussen waarop deze voortbouwt). */
  requires: string[];
  labels: string[]; // Keep for backward compatibility

  // New categorical fields
  programmingLanguages?: string[];
  projectTypes?: string[];
  operatingSystems?: string[];

  // Examenprogramma-raakvlakken (havo/vwo informatica)
  examDomains?: ExamMapping[];

  level: 'Beginner' | 'Medium' | 'Advanced';
  /**
   * Waar de cursus in de leerlijn van de school valt. Los van het niveau: de
   * editor-cursus is voor beginners maar hoort bij de verdieping in klas 5+.
   */
  klas: Klas;
  /** Afgeleid uit de gedeelde registry (SITES_BY_ID[id].url); niet hardcoden. */
  link: string;
  order: {
    vwo: number;
    havo: number;
  };
};

// Naam, omschrijving, URL en voorkennis komen uit de gedeelde registry
// (packages/shared/sites.js), de enige bron van waarheid. Hier staat alleen wat
// de registry niet weet: niveau, thema's en examendomeinen. Zo blijven de
// homepage-kaarten en de navigatie van de cursussites automatisch in sync; de
// eigen titels die hier eerst stonden ("Python Play", "Code Editor") waren van
// de registry weggedreven.
function siteVan(id: string) {
  const site = SITES_BY_ID[id];
  if (!site) throw new Error(`Onbekende cursus-id in Curriculum: ${id}`);
  return site;
}

type CurriculumEntry = Omit<Activity, 'label' | 'description' | 'requires' | 'link'>;

const entries: CurriculumEntry[] = [
  {
    id: 'web',
    labels: [],
    programmingLanguages: ['HTML', 'CSS'],
    projectTypes: ['Web Development'],
    operatingSystems: ['Windows', 'Linux', 'macOS', 'ChromeOS'],
    examDomains: [
      { code: 'C3', strength: 'strong' },
      { code: 'C4', strength: 'weak' },
      { code: 'D1', strength: 'strong' },
      { code: 'F1', strength: 'weak' },
    ],
    level: 'Beginner',
    klas: '4',
    order: {
      vwo: 1,
      havo: 1,
    },
  },
  {
    id: 'python',
    labels: [],
    programmingLanguages: ['Python'],
    projectTypes: [],
    operatingSystems: ['Windows', 'Linux', 'macOS', 'ChromeOS'],
    examDomains: [
      { code: 'B1', strength: 'weak' },
      { code: 'C5', strength: 'weak' },
      { code: 'D1', strength: 'strong' },
      { code: 'D2', strength: 'strong' },
    ],
    level: 'Beginner',
    klas: '4',
    order: {
      vwo: 2,
      havo: 2,
    },
  },
  {
    id: 'play',
    labels: [],
    programmingLanguages: ['Python'],
    projectTypes: ['Game Development'],
    operatingSystems: ['Windows', 'Linux', 'macOS'],
    examDomains: [
      { code: 'B1', strength: 'strong' },
      { code: 'C5', strength: 'weak' },
      { code: 'D1', strength: 'strong' },
      { code: 'F1', strength: 'weak' },
    ],
    level: 'Beginner',
    klas: '4',
    order: {
      vwo: 3,
      havo: 3,
    },
  },
  {
    id: 'editor',
    labels: [],
    programmingLanguages: [],
    projectTypes: ['VS Code web', 'VS Code Python', 'git', 'GitHub'],
    operatingSystems: ['Windows', 'Linux', 'macOS'],
    // Geen examDomains: het instrumentarium (editor, git, GitHub) valt onder domein A
    // dat we bewust niet meenemen in de mapping.
    level: 'Beginner',
    klas: '5+',
    order: {
      vwo: 2,
      havo: 2,
    },
  },
  {
    id: 'robotica',
    labels: ['Robotics', 'Python'],
    programmingLanguages: ['Python'],
    projectTypes: ['Robotics'],
    operatingSystems: ['Windows', 'Linux', 'macOS'],
    examDomains: [
      { code: 'B1', strength: 'weak' },
      { code: 'D1', strength: 'strong' },
      { code: 'E1', strength: 'weak' },
      { code: 'M1', strength: 'strong' },
      { code: 'M2', strength: 'strong' },
    ],
    level: 'Medium',
    klas: '4 en 5+',
    order: {
      vwo: 4,
      havo: 4,
    },
  },
  {
    id: 'ctf',
    labels: [],
    programmingLanguages: [],
    projectTypes: ['Cybersecurity'],
    operatingSystems: ['Windows', 'Linux', 'macOS'],
    examDomains: [
      { code: 'E2', strength: 'strong' },
      { code: 'F2', strength: 'weak' },
      { code: 'F3', strength: 'weak' },
      { code: 'F4', strength: 'weak' },
      { code: 'N1', strength: 'strong' },
      { code: 'N2', strength: 'strong' },
    ],
    level: 'Beginner',
    klas: '4',
    order: {
      vwo: 5,
      havo: 5,
    },
  },
  {
    id: 'godot',
    labels: [],
    programmingLanguages: ['GDScript'],
    projectTypes: ['Game Development'],
    operatingSystems: ['Windows', 'Linux', 'macOS', 'ChromeOS'],
    examDomains: [
      { code: 'B1', strength: 'weak' },
      { code: 'D1', strength: 'strong' },
      { code: 'F1', strength: 'strong' },
      { code: 'O3', strength: 'weak' },
      { code: 'P2', strength: 'strong' },
    ],
    level: 'Medium',
    klas: '4 en 5+',
    order: {
      vwo: 6,
      havo: 6,
    },
  },
  {
    id: 'dvwa',
    labels: ['Cybersecurity', 'Web'],
    programmingLanguages: ['Linux Shell'],
    projectTypes: ['Cybersecurity', 'Web Development'],
    operatingSystems: ['Windows', 'Linux'],
    examDomains: [
      { code: 'E2', strength: 'strong' },
      { code: 'L4', strength: 'weak' },
      { code: 'N1', strength: 'strong' },
      { code: 'N2', strength: 'weak' },
    ],
    level: 'Advanced',
    klas: '5+',
    order: {
      vwo: 5,
      havo: 5,
    },
  },
  {
    id: 'fullstack',
    labels: ['Javascript', 'Python'],
    programmingLanguages: ['HTML', 'CSS', 'JavaScript', 'Python'],
    projectTypes: ['Web Development'],
    operatingSystems: ['Windows', 'Linux', 'macOS'],
    examDomains: [
      { code: 'D1', strength: 'strong' },
      { code: 'E1', strength: 'strong' },
      { code: 'F1', strength: 'strong' },
      { code: 'H1', strength: 'weak' },
      { code: 'L2', strength: 'weak' },
      { code: 'O3', strength: 'weak' },
    ],
    level: 'Advanced',
    klas: '5+',
    order: {
      vwo: 5,
      havo: 5,
    },
  },
  {
    id: 'algorithms',
    labels: [],
    programmingLanguages: ['Python'],
    projectTypes: ['Algorithms'],
    operatingSystems: ['Windows', 'Linux', 'macOS', 'ChromeOS'],
    examDomains: [
      { code: 'B1', strength: 'strong' },
      { code: 'B2', strength: 'strong' },
      { code: 'B4', strength: 'weak' },
      { code: 'D1', strength: 'weak' },
      { code: 'G1', strength: 'weak' },
      { code: 'I1', strength: 'weak' },
    ],
    level: 'Medium',
    klas: '5+',
    order: {
      vwo: 7,
      havo: 7,
    },
  },
  {
    id: 'ide',
    labels: [],
    programmingLanguages: ['Python', 'HTML', 'CSS'],
    projectTypes: ['Online Editor'],
    operatingSystems: ['Windows', 'Linux', 'macOS', 'ChromeOS'],
    // Gereedschap (browser-IDE), zoals de Code Editor: valt onder domein A en
    // krijgt daarom geen examDomains-mapping.
    level: 'Beginner',
    klas: '4',
    // TODO(curriculum): juiste plek in de leerlijn bevestigen.
    order: {
      vwo: 1,
      havo: 1,
    },
  },
  {
    id: 'embedded',
    labels: [],
    programmingLanguages: ['C++', 'MicroPython'],
    projectTypes: ['Embedded', 'Robotics'],
    operatingSystems: ['Windows', 'Linux', 'macOS'],
    // TODO(curriculum): examDomains-mapping laten invullen door de
    // curriculum-eigenaar (niet verzinnen).
    examDomains: [],
    level: 'Medium',
    klas: '5+',
    // TODO(curriculum): juiste plek in de leerlijn bevestigen.
    order: {
      vwo: 4,
      havo: 4,
    },
  },
];

// In de volgorde van de registry: dat is de leerlijn, en die staat op één plek.
const volgorde = new Map(SITES.map((s, i) => [s.id, i]));

export const curriculum: Activity[] = entries
  .map((e) => {
    const site = siteVan(e.id);
    return {
      ...e,
      label: site.label,
      description: site.description,
      requires: site.requires,
      link: site.url,
    };
  })
  .sort((a, b) => (volgorde.get(a.id) ?? 99) - (volgorde.get(b.id) ?? 99));

/** Badge-klassen per niveau, leesbaar in licht én donker thema. */
export const levelColors: { [key in Activity['level']]: string } = {
  Beginner:
    'border-transparent bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950',
  Medium: 'border-transparent bg-amber-500 text-amber-950 dark:bg-amber-400',
  Advanced: 'border-transparent bg-rose-600 text-white dark:bg-rose-500 dark:text-rose-950',
};

/** Nederlandse naam per niveau, zoals de leerling 'm op de kaart ziet. */
export const levelLabels: { [key in Activity['level']]: string } = {
  Beginner: 'Beginner',
  Medium: 'Gevorderd',
  Advanced: 'Expert',
};

/** De voorkennis van een cursus als leesbare namen, uit de registry. */
export function voorkennisVan(activity: Activity): string {
  return activity.requires.map((id) => SITES_BY_ID[id]?.label ?? id).join(', ');
}

export const THEMAS = ['Python', 'Web', 'Games', 'Hardware', 'Security'] as const;
export type Thema = (typeof THEMAS)[number];

// Vijf herkenbare thema's voor de filterrij op de homepage, afgeleid uit de
// fijnmazige velden hierboven. Zo hoeft een leerling niet uit 23 opties te
// kiezen; de examendomeinen blijven op de docentenpagina.
export function themasVan(activity: Activity): Thema[] {
  const talen = activity.programmingLanguages ?? [];
  const typen = activity.projectTypes ?? [];
  const uit: Thema[] = [];
  if (
    talen.some((t) => t === 'Python' || t === 'MicroPython') ||
    typen.includes('VS Code Python')
  ) {
    uit.push('Python');
  }
  if (
    typen.includes('Web Development') ||
    typen.includes('VS Code web') ||
    talen.some((t) => ['HTML', 'CSS', 'JavaScript'].includes(t))
  ) {
    uit.push('Web');
  }
  if (typen.includes('Game Development')) uit.push('Games');
  if (typen.includes('Robotics') || typen.includes('Embedded')) uit.push('Hardware');
  if (typen.includes('Cybersecurity')) uit.push('Security');
  return uit;
}
