import type { CheckerConfig, ProjectFiles } from './types';

// Beoordelingen die blijven staan. Een docent neemt 's ochtends vijf
// mondelingen af, vinkt per leerling aan wat hij hoort en typt opmerkingen,
// en maakt 's middags pas de PDF's. Tot nu toe stond alles alleen in het
// geheugen van de pagina: een nieuwe upload wiste de vorige leerling, en
// herladen wiste alles. Hier staat elke beoordeling apart, met het project
// erbij, zodat hij later precies zo weer opengaat.
//
// Alles blijft in de browser van de docent (IndexedDB, zie Checker/idbOpslag);
// deze module kent alleen een abstracte opslag, zodat de logica in node te
// testen is.

/** Wat de docent invult; klein, en wordt bij elke wijziging opgeslagen. */
export interface Beoordeling {
  id: string;
  /** Naam van de leerling (of groep), zoals de docent hem typte. */
  naam: string;
  aangemaakt: number;
  bijgewerkt: number;
  /** Aangevinkte handmatige concepten. */
  handmatig: string[];
  notes: string;
  track: string | null;
}

/** Het ingeleverde project; groot, en wordt één keer opgeslagen. */
export interface Project {
  files: ProjectFiles;
  warnings: string[];
}

export interface Bak<T> {
  alle(): Promise<T[]>;
  lees(id: string): Promise<T | undefined>;
  schrijf(id: string, waarde: T): Promise<void>;
  wis(id: string): Promise<void>;
}

/**
 * Twee bakken: de beoordeling en het project apart, zodat een getypte
 * opmerking niet elke keer het hele project (met foto's) herschrijft.
 */
export interface Opslag {
  beoordelingen: Bak<Beoordeling>;
  projecten: Bak<Project>;
}

export type Wijziging = Partial<Pick<Beoordeling, 'naam' | 'handmatig' | 'notes' | 'track'>>;

/**
 * Naam van de database: per site, want alle cursussen van een vak delen één
 * origin en dus één IndexedDB (packages/shared/opslag.js). De docentsleutel
 * is al per site ('coderius:web:webChecker.docentUnlocked'); de laatste
 * schakel wordt 'nakijker.beoordelingen'.
 */
export function databaseNaam(config: Pick<CheckerConfig, 'teacher'>): string {
  const sleutel = config.teacher.storageKey;
  const knip = sleutel.lastIndexOf(':');
  return `${knip === -1 ? `${sleutel}:` : sleutel.slice(0, knip + 1)}nakijker.beoordelingen`;
}

/** Een naam als de docent niets invulde: de tijd van de upload. */
export function standaardNaam(nu: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `Leerling ${p(nu.getDate())}-${p(nu.getMonth() + 1)} ${p(nu.getHours())}:${p(nu.getMinutes())}`;
}

/**
 * Zet de naam van de leerling in de bestandsnaam van de PDF, vóór `.pdf`:
 * 'Beoordeling Web Project - 2026-10-19.pdf' wordt
 * 'Beoordeling Web Project - 2026-10-19 - Sam 5V2.pdf'. Tekens die een
 * bestandssysteem weigert, gaan eruit.
 */
export function pdfNaamMetLeerling(bestandsnaam: string, naam: string): string {
  const schoon = naam
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (schoon === '') return bestandsnaam;
  const punt = bestandsnaam.toLowerCase().endsWith('.pdf') ? bestandsnaam.length - 4 : -1;
  return punt === -1
    ? `${bestandsnaam} - ${schoon}`
    : `${bestandsnaam.slice(0, punt)} - ${schoon}.pdf`;
}

function nieuwId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Bewaart een net geüpload project als nieuwe, lege beoordeling. */
export async function bewaarNieuw(
  opslag: Opslag,
  naam: string,
  project: Project,
  nu: Date,
  track: string | null,
): Promise<Beoordeling> {
  const beoordeling: Beoordeling = {
    id: nieuwId(),
    naam: naam.trim() || standaardNaam(nu),
    aangemaakt: nu.getTime(),
    bijgewerkt: nu.getTime(),
    handmatig: [],
    notes: '',
    track,
  };
  // Eerst het project: een beoordeling zonder project kan niet meer open.
  await opslag.projecten.schrijf(beoordeling.id, project);
  await opslag.beoordelingen.schrijf(beoordeling.id, beoordeling);
  return beoordeling;
}

/** Alle beoordelingen, de laatst bewerkte bovenaan. */
export async function lijst(opslag: Opslag): Promise<Beoordeling[]> {
  const alle = await opslag.beoordelingen.alle();
  return alle.sort((a, b) => b.bijgewerkt - a.bijgewerkt);
}

/** Een beoordeling met het project, of null als een van beide weg is. */
export async function open(
  opslag: Opslag,
  id: string,
): Promise<{ beoordeling: Beoordeling; project: Project } | null> {
  const [beoordeling, project] = await Promise.all([
    opslag.beoordelingen.lees(id),
    opslag.projecten.lees(id),
  ]);
  return beoordeling && project ? { beoordeling, project } : null;
}

/**
 * De nieuwe versie van een beoordeling, zonder op te slaan. Apart van
 * werkBij, zodat de pagina de nieuwe versie meteen heeft: twee snelle
 * wijzigingen (een vinkje en een letter) bouwen dan op elkaar voort in
 * plaats van allebei op de oude versie.
 */
export function pasAan(beoordeling: Beoordeling, wijziging: Wijziging, nu: Date): Beoordeling {
  const nieuw: Beoordeling = { ...beoordeling, ...wijziging, bijgewerkt: nu.getTime() };
  if (wijziging.naam !== undefined && wijziging.naam.trim() === '') nieuw.naam = beoordeling.naam;
  return nieuw;
}

/** Past de beoordeling aan en slaat hem op; geeft de nieuwe versie terug. */
export async function werkBij(
  opslag: Opslag,
  beoordeling: Beoordeling,
  wijziging: Wijziging,
  nu: Date,
): Promise<Beoordeling> {
  const nieuw = pasAan(beoordeling, wijziging, nu);
  await opslag.beoordelingen.schrijf(nieuw.id, nieuw);
  return nieuw;
}

export async function verwijder(opslag: Opslag, id: string): Promise<void> {
  // Eerst de beoordeling: zonder die verschijnt het project nergens meer.
  await opslag.beoordelingen.wis(id);
  await opslag.projecten.wis(id);
}

/** Een opslag in het geheugen: voor tests, en als IndexedDB niet werkt. */
export function geheugenOpslag(): Opslag {
  const bak = <T>(): Bak<T> => {
    const m = new Map<string, T>();
    return {
      alle: async () => Array.from(m.values(), (v) => structuredClone(v)),
      lees: async (id) => (m.has(id) ? structuredClone(m.get(id) as T) : undefined),
      schrijf: async (id, waarde) => {
        m.set(id, structuredClone(waarde));
      },
      wis: async (id) => {
        m.delete(id);
      },
    };
  };
  return { beoordelingen: bak<Beoordeling>(), projecten: bak<Project>() };
}
