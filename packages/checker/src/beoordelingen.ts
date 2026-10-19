import type { CheckerConfig, ProjectFiles } from './types';
import type { Vraag } from './vragen';

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
  /** Vragen voor het mondeling, in de volgorde van de docent. */
  vragen: Vraag[];
}

/** Het ingeleverde project; groot, en wordt één keer opgeslagen. */
export interface Project {
  files: ProjectFiles;
  warnings: string[];
}

export interface Bak<T> {
  alle(): Promise<T[]>;
  sleutels(): Promise<string[]>;
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
  /** Sluit de verbinding (IndexedDB); een geheugenopslag heeft niets te sluiten. */
  sluit?: () => void;
}

export type Wijziging = Partial<
  Pick<Beoordeling, 'naam' | 'handmatig' | 'notes' | 'track' | 'vragen'>
>;

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

/**
 * Een beoordeling uit de opslag, aangevuld met velden die een oudere versie
 * van de nakijker nog niet bewaarde.
 */
export function aangevuld(b: Beoordeling): Beoordeling {
  return { ...b, handmatig: b.handmatig ?? [], notes: b.notes ?? '', vragen: b.vragen ?? [] };
}

export function nieuwId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** De nieuwe versie van een beoordeling na een wijziging; een lege naam telt niet. */
export function pasAan(beoordeling: Beoordeling, wijziging: Wijziging, nu: Date): Beoordeling {
  const nieuw: Beoordeling = { ...beoordeling, ...wijziging, bijgewerkt: nu.getTime() };
  if (wijziging.naam !== undefined && wijziging.naam.trim() === '') nieuw.naam = beoordeling.naam;
  return nieuw;
}

/** Een foutmelding voor de docent bij een mislukte schrijf- of wisactie. */
export function opslagMelding(fout: unknown): string {
  const naam = fout instanceof DOMException || fout instanceof Error ? fout.name : '';
  if (naam === 'QuotaExceededError') {
    return 'De opslag van deze browser is vol. Verwijder beoordelingen die je niet meer nodig hebt; de laatste wijziging is niet bewaard.';
  }
  return 'Bewaren in deze browser lukte niet; de laatste wijziging staat alleen op dit scherm. Maak de PDF voor je de pagina sluit.';
}

interface BewaarderOpties {
  /** Na elke wijziging in de lijst, de laatst bewerkte bovenaan. */
  onLijst: (lijst: Beoordeling[]) => void;
  /** Als bewaren of wissen mislukt; de tekst is voor de docent. */
  onFout: (melding: string) => void;
  nu?: () => Date;
}

/**
 * De beoordelingen van de pagina, met de opslag erachter. De pagina werkt
 * alleen hiermee, nooit rechtstreeks met de opslag, om drie redenen:
 *
 * - Een nieuwe beoordeling bestaat meteen (`nieuw` is synchroon). Zo telt
 *   een vinkje dat de docent zet terwijl het project nog wordt weggeschreven
 *   gewoon mee, en kan een trage schrijfactie later niet een andere leerling
 *   actief maken dan die op het scherm staat.
 * - Alle schrijf- en wisacties lopen in één rij, op volgorde. De rij wacht
 *   op de opslag, dus een upload terwijl IndexedDB nog opengaat raakt niet
 *   kwijt; en een wijziging komt nooit vóór de beoordeling zelf aan.
 * - Wijzigingen die wachten worden samengevoegd: honderd toetsaanslagen in
 *   de opmerkingen worden een paar schrijfacties, niet honderd.
 */
export class Bewaarder {
  private readonly opslag: Promise<Opslag>;
  private readonly opties: BewaarderOpties;
  private readonly nu: () => Date;
  private readonly cache = new Map<string, Beoordeling>();
  /** Gewijzigd maar nog niet weggeschreven. */
  private readonly teSchrijven = new Set<string>();
  /** Nieuw, maar het project staat nog niet in de opslag. */
  private readonly zonderProject = new Set<string>();
  /** Projecten die niet bewaard konden worden; blijven tot de pagina sluit. */
  private readonly alleenHier = new Map<string, Project>();
  private rij: Promise<unknown> = Promise.resolve();
  private schrijfGepland = false;
  /** Klaar als de bestaande beoordelingen zijn ingelezen. */
  readonly klaar: Promise<void>;

  constructor(opslag: Promise<Opslag>, opties: BewaarderOpties) {
    this.opslag = opslag;
    this.opties = opties;
    this.nu = opties.nu ?? (() => new Date());
    this.klaar = this.inRij(async (o) => {
      await ruimOp(o);
      for (const b of await o.beoordelingen.alle()) {
        if (!this.cache.has(b.id)) this.cache.set(b.id, aangevuld(b));
      }
      this.meld();
    }).catch(() => undefined);
  }

  lijst(): Beoordeling[] {
    return Array.from(this.cache.values()).sort((a, b) => b.bijgewerkt - a.bijgewerkt);
  }

  get(id: string): Beoordeling | undefined {
    return this.cache.get(id);
  }

  /** Een net geüpload project als nieuwe, lege beoordeling; bestaat meteen. */
  nieuw(naam: string, project: Project, track: string | null): Beoordeling {
    const nu = this.nu();
    const b: Beoordeling = {
      id: nieuwId(),
      naam: naam.trim() || standaardNaam(nu),
      aangemaakt: nu.getTime(),
      bijgewerkt: nu.getTime(),
      handmatig: [],
      notes: '',
      track,
      vragen: [],
    };
    this.cache.set(b.id, b);
    this.zonderProject.add(b.id);
    this.meld();
    this.inRij(async (o) => {
      if (!this.cache.has(b.id)) return; // al weer verwijderd
      await o.projecten.schrijf(b.id, project);
      try {
        // De nieuwste versie: de docent kan al iets hebben aangevinkt.
        await o.beoordelingen.schrijf(b.id, this.cache.get(b.id) ?? b);
      } catch (fout) {
        // Geen project zonder beoordeling achterlaten: dat ziet niemand
        // meer, en het neemt wel ruimte in.
        await o.projecten.wis(b.id).catch(() => undefined);
        throw fout;
      }
      // Een wijziging tijdens het wegschrijven hierboven staat in
      // teSchrijven en gaat met de volgende schrijfactie mee.
      this.zonderProject.delete(b.id);
    }).catch((fout) => {
      // Niet bewaard, maar op deze pagina blijft de beoordeling bruikbaar.
      this.alleenHier.set(b.id, project);
      this.opties.onFout(opslagMelding(fout));
    });
    return b;
  }

  /** Past een beoordeling meteen aan en zet het wegschrijven in de rij. */
  wijzig(id: string, wijziging: Wijziging): Beoordeling | undefined {
    const huidig = this.cache.get(id);
    if (!huidig) return undefined;
    const nieuw = pasAan(huidig, wijziging, this.nu());
    this.cache.set(id, nieuw);
    this.teSchrijven.add(id);
    this.meld();
    if (!this.schrijfGepland) {
      this.schrijfGepland = true;
      this.inRij(async (o) => {
        this.schrijfGepland = false;
        const ids = Array.from(this.teSchrijven);
        this.teSchrijven.clear();
        for (const i of ids) {
          const b = this.cache.get(i);
          // Zonder project in de opslag nog niet: dat doet nieuw() zelf, met
          // de nieuwste versie.
          if (b && !this.zonderProject.has(i)) await o.beoordelingen.schrijf(i, b);
        }
      }).catch((fout) => this.opties.onFout(opslagMelding(fout)));
    }
    return nieuw;
  }

  /** De beoordeling met het project, na alles wat nog in de rij staat. */
  open(id: string): Promise<{ beoordeling: Beoordeling; project: Project } | null> {
    return this.inRij(async (o) => {
      const beoordeling = this.cache.get(id);
      const project = this.alleenHier.get(id) ?? (await o.projecten.lees(id));
      return beoordeling && project ? { beoordeling, project } : null;
    });
  }

  /**
   * Verwijdert een beoordeling met het project. Lukt dat niet, dan leest de
   * lijst opnieuw wat er echt nog staat, en hoort de docent het: op een
   * gedeelde computer mag niemand denken dat leerlingwerk weg is als het er
   * nog staat.
   */
  async verwijder(id: string): Promise<boolean> {
    return this.verwijderIds([id]);
  }

  async verwijderAlles(): Promise<boolean> {
    return this.verwijderIds(Array.from(this.cache.keys()));
  }

  /** Wacht tot alles in de rij klaar is, en sluit de opslag. */
  async sluit(): Promise<void> {
    await this.rij.catch(() => undefined);
    const o = await this.opslag.catch(() => null);
    o?.sluit?.();
  }

  private async verwijderIds(ids: string[]): Promise<boolean> {
    for (const id of ids) {
      this.cache.delete(id);
      this.teSchrijven.delete(id);
      this.zonderProject.delete(id);
      this.alleenHier.delete(id);
    }
    this.meld();
    try {
      await this.inRij(async (o) => {
        const mislukt: unknown[] = [];
        for (const id of ids) {
          // Eerst de beoordeling: zonder die verschijnt het project nergens.
          await o.beoordelingen.wis(id).catch((f) => mislukt.push(f));
          await o.projecten.wis(id).catch((f) => mislukt.push(f));
        }
        if (mislukt.length > 0) throw mislukt[0];
      });
      return true;
    } catch {
      await this.herlaad();
      this.opties.onFout(
        'Niet alles kon worden verwijderd. De lijst toont wat er nog in deze browser staat; probeer het opnieuw.',
      );
      return false;
    }
  }

  private async herlaad(): Promise<void> {
    await this.inRij(async (o) => {
      const opgeslagen = await o.beoordelingen.alle();
      for (const b of opgeslagen) if (!this.cache.has(b.id)) this.cache.set(b.id, aangevuld(b));
      this.meld();
    }).catch(() => undefined);
  }

  private inRij<T>(taak: (o: Opslag) => Promise<T>): Promise<T> {
    const resultaat = this.rij.then(() => this.opslag).then(taak);
    // De rij loopt door na een fout; de fout zelf gaat naar wie wacht.
    this.rij = resultaat.catch(() => undefined);
    return resultaat;
  }

  private meld(): void {
    this.opties.onLijst(this.lijst());
  }
}

/**
 * Gooit projecten weg waar geen beoordeling meer bij hoort. Die ontstaan
 * als het wegschrijven halverwege mislukt (opslag vol); niemand ziet ze,
 * maar ze nemen wel ruimte in.
 */
export async function ruimOp(opslag: Opslag): Promise<void> {
  const beoordelingen = new Set(await opslag.beoordelingen.sleutels());
  for (const id of await opslag.projecten.sleutels()) {
    if (!beoordelingen.has(id)) await opslag.projecten.wis(id);
  }
}

/** Een opslag in het geheugen: voor tests, en als IndexedDB niet werkt. */
export function geheugenOpslag(): Opslag {
  const bak = <T>(): Bak<T> => {
    const m = new Map<string, T>();
    return {
      alle: async () => Array.from(m.values(), (v) => structuredClone(v)),
      sleutels: async () => Array.from(m.keys()),
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
