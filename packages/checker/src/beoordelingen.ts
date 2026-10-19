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

/**
 * De opslag achter de Bewaarder. Beoordeling en project staan apart, zodat
 * een getypte opmerking niet elke keer het hele project (met foto's)
 * herschrijft; maar een nieuwe beoordeling en het wissen gaan over allebei
 * tegelijk, in één transactie. Zo kan er nooit een project zonder
 * beoordeling achterblijven, ook niet als de opslag halverwege vol raakt.
 */
export interface Opslag {
  alleBeoordelingen(): Promise<Beoordeling[]>;
  leesProject(id: string): Promise<Project | undefined>;
  /** Beoordeling en project samen: allebei bewaard, of geen van beide. */
  bewaarNieuw(beoordeling: Beoordeling, project: Project): Promise<void>;
  bewaarBeoordeling(beoordeling: Beoordeling): Promise<void>;
  /** Beoordeling en project samen weg. */
  wis(id: string): Promise<void>;
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

/**
 * Hoe lang een beoordeling zonder wijziging blijft staan. Ze staan in de
 * browser, en op een gedeelde schoolcomputer kan iedereen die het (openbare)
 * docentwachtwoord kent de pagina openen; een mondeling en de PDF erna zijn
 * in twee weken ruim klaar.
 */
export const BEWAARTERMIJN_DAGEN = 14;
const BEWAARTERMIJN_MS = BEWAARTERMIJN_DAGEN * 24 * 60 * 60 * 1000;

/** Is deze beoordeling langer dan de bewaartermijn niet gewijzigd? */
export function verlopen(b: Pick<Beoordeling, 'bijgewerkt'>, nu: Date): boolean {
  return nu.getTime() - b.bijgewerkt > BEWAARTERMIJN_MS;
}

export const LEESFOUT =
  'De bewaarde beoordelingen konden niet worden gelezen. Ze staan er waarschijnlijk nog; herlaad de pagina om het opnieuw te proberen.';

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
  /**
   * Als lezen, bewaren of wissen mislukt, met een tekst voor de docent; met
   * null als bewaren of wissen daarna weer lukt, zodat een oude melding niet
   * blijft staan. Een leesfout blijft staan tot de pagina herlaadt: de lijst
   * is dan misschien niet compleet.
   */
  onFout: (melding: string | null) => void;
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
  /** Nieuw, maar nog niet in de opslag; nieuw() schrijft de laatste versie. */
  private readonly zonderProject = new Set<string>();
  /** Projecten die niet bewaard konden worden; blijven tot de pagina sluit. */
  private readonly alleenHier = new Map<string, Project>();
  private rij: Promise<unknown> = Promise.resolve();
  private schrijfGepland = false;
  /** Welke soort fout er nu gemeld staat. */
  private foutSoort: 'lezen' | 'schrijven' | null = null;
  /** Klaar als de bestaande beoordelingen zijn ingelezen (of dat mislukte). */
  readonly klaar: Promise<void>;

  constructor(opslag: Promise<Opslag>, opties: BewaarderOpties) {
    this.opslag = opslag;
    this.opties = opties;
    this.nu = opties.nu ?? (() => new Date());
    this.klaar = this.inRij(async (o) => {
      let opgeslagen: Beoordeling[];
      try {
        opgeslagen = await o.alleBeoordelingen();
      } catch {
        this.meldFout('lezen', LEESFOUT);
        return;
      }
      const nu = this.nu();
      for (const b of opgeslagen) {
        if (verlopen(b, nu)) {
          // Opruimen mag mislukken: dan probeert de volgende keer het weer.
          await o.wis(b.id).catch(() => undefined);
        } else if (!this.cache.has(b.id)) {
          this.cache.set(b.id, aangevuld(b));
        }
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
      const laatste = this.cache.get(b.id);
      if (!laatste) return; // al weer verwijderd
      // De nieuwste versie: de docent kan al iets hebben aangevinkt. Een
      // wijziging tijdens het wegschrijven staat in teSchrijven en gaat met
      // de volgende schrijfactie mee.
      await o.bewaarNieuw(laatste, project);
      this.zonderProject.delete(b.id);
      this.hersteld();
    }).catch((fout) => {
      // Al verwijderd terwijl het bewaren liep: dan is er niets te bewaren
      // en niets te melden.
      if (!this.cache.has(b.id)) return;
      // Niet bewaard, maar op deze pagina blijft de beoordeling bruikbaar;
      // de volgende schrijfactie (een wijziging, of een verwijdering die
      // ruimte maakt) probeert hem opnieuw.
      this.alleenHier.set(b.id, project);
      this.meldFout('schrijven', opslagMelding(fout));
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
    this.planSchrijven();
    return nieuw;
  }

  /** De beoordeling met het project, na alles wat nog in de rij staat. */
  open(id: string): Promise<{ beoordeling: Beoordeling; project: Project } | null> {
    return this.inRij(async (o) => {
      const beoordeling = this.cache.get(id);
      const project = this.alleenHier.get(id) ?? (await o.leesProject(id));
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
    // Eerst alles inlezen: anders blijven beoordelingen staan die nog niet in
    // de lijst stonden, en verschijnen ze daarna weer.
    await this.klaar;
    return this.verwijderIds(Array.from(this.cache.keys()));
  }

  /** Wacht tot alles in de rij klaar is, en sluit de opslag. */
  async sluit(): Promise<void> {
    await this.rij.catch(() => undefined);
    const o = await this.opslag.catch(() => null);
    o?.sluit?.();
  }

  private planSchrijven(): void {
    if (this.schrijfGepland) return;
    this.schrijfGepland = true;
    this.inRij(async (o) => {
      this.schrijfGepland = false;
      // Alles wat nog niet bewaard is: gewijzigde beoordelingen, en nieuwe
      // die bij de eerste poging niet in de opslag pasten.
      const ids = Array.from(new Set([...this.teSchrijven, ...this.alleenHier.keys()]));
      this.teSchrijven.clear();
      let fout: unknown = null;
      for (const i of ids) {
        const b = this.cache.get(i);
        if (!b) continue;
        const project = this.alleenHier.get(i);
        // Nieuw en nog onderweg: dat doet nieuw() zelf, met de nieuwste versie.
        if (!project && this.zonderProject.has(i)) continue;
        try {
          if (project) {
            await o.bewaarNieuw(b, project);
            this.alleenHier.delete(i);
            this.zonderProject.delete(i);
          } else {
            await o.bewaarBeoordeling(b);
          }
        } catch (f) {
          // Terug in de rij: de volgende schrijfactie probeert hem opnieuw,
          // en de andere beoordelingen in deze ronde gaan gewoon door. (Een
          // nieuwe staat nog in alleenHier.)
          if (!project) this.teSchrijven.add(i);
          fout ??= f;
        }
      }
      if (fout) throw fout;
      if (ids.length > 0) this.hersteld();
    }).catch((fout) => this.meldFout('schrijven', opslagMelding(fout)));
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
        for (const id of ids) await o.wis(id).catch((f) => mislukt.push(f));
        if (mislukt.length > 0) throw mislukt[0];
      });
    } catch {
      await this.herlaad();
      this.meldFout(
        'schrijven',
        'Niet alles kon worden verwijderd. De lijst toont wat er nog in deze browser staat; probeer het opnieuw.',
      );
      return false;
    }
    // Verwijderen maakt ruimte: wat eerder niet paste, krijgt een nieuwe kans.
    if (this.teSchrijven.size > 0 || this.alleenHier.size > 0) this.planSchrijven();
    else this.hersteld();
    return true;
  }

  private meldFout(soort: 'lezen' | 'schrijven', melding: string): void {
    // Een leesfout gaat voor: die zegt dat de lijst misschien niet compleet is.
    if (this.foutSoort === 'lezen' && soort !== 'lezen') return;
    this.foutSoort = soort;
    this.opties.onFout(melding);
  }

  /** Bewaren of wissen lukte weer: een oude schrijffout hoeft niet te blijven staan. */
  private hersteld(): void {
    if (this.foutSoort !== 'schrijven') return;
    this.foutSoort = null;
    this.opties.onFout(null);
  }

  private async herlaad(): Promise<void> {
    await this.inRij(async (o) => {
      const opgeslagen = await o.alleBeoordelingen();
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

/** Een opslag in het geheugen: voor tests, en als IndexedDB niet werkt. */
export function geheugenOpslag(): Opslag {
  const beoordelingen = new Map<string, Beoordeling>();
  const projecten = new Map<string, Project>();
  return {
    alleBeoordelingen: async () => Array.from(beoordelingen.values(), (b) => structuredClone(b)),
    leesProject: async (id) => {
      const p = projecten.get(id);
      return p ? structuredClone(p) : undefined;
    },
    bewaarNieuw: async (b, p) => {
      beoordelingen.set(b.id, structuredClone(b));
      projecten.set(b.id, structuredClone(p));
    },
    bewaarBeoordeling: async (b) => {
      beoordelingen.set(b.id, structuredClone(b));
    },
    wis: async (id) => {
      beoordelingen.delete(id);
      projecten.delete(id);
    },
  };
}
