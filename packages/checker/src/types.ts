// Domein-onafhankelijke types voor de gedeelde 'nakijken'-checker. Een site
// levert een CheckerConfig aan (welke concepten, hoe bestanden te classificeren,
// welke onderwerpen) en de engine analyseert een geüpload project client-side.

export type Level = 'basis' | 'gevorderd';

export interface ProjectFile {
  /** Genormaliseerd, "/"-gescheiden pad, geen leidende "/". */
  path: string;
  /** Kind-id uit config.classify (bv. 'py', 'html', 'css', 'image', 'other'). */
  kind: string;
  /** Tekstinhoud (voor tekst-kinds), data-URL (voor image-kinds), of null. */
  content: string | null;
  sizeBytes: number;
  tooLarge: boolean;
}

export type ProjectFiles = Record<string, ProjectFile>;

/** Hoe een concept gedetecteerd wordt. */
export type ConceptDetect =
  | {
      type: 'regex';
      /** Globaal (`/g`) patroon, geteld over de inhoud van bestanden. */
      pattern: RegExp;
      /** Beperk tot bepaalde kinds; standaard alle tekst-kinds. */
      in?: string[];
      /**
       * Hoe vaak het patroon minstens moet voorkomen (standaard 1). Zo houd je
       * twee concepten uit elkaar die hetzelfde patroon delen: "twee
       * IR-sensoren" en "vier IR-sensoren" zijn allebei `AnalogIR(`, alleen
       * met een andere drempel.
       */
      minCount?: number;
      /**
       * Een concept met onderdelen ("ol & ul, li", "flexbox of grid"): het
       * rapport noemt welke onderdelen gevonden zijn. Een lijst namen hoort bij
       * benoemde groepen d0, d1, … in het patroon (de eerste die past, telt);
       * `true` neemt de eerste gewone groep die iets vond, zoals de tagnaam van
       * een selector.
       */
      delen?: string[] | true;
    }
  | {
      /** "Aanwezig" als een bestandspad hierop matcht (mappenstructuur-check). */
      type: 'path';
      pattern: RegExp;
    }
  | {
      /**
       * Niet uit de bestanden af te leiden — de docent vinkt dit zelf aan.
       * Voor alles wat je alleen met je ogen vaststelt: is het frame gebouwd,
       * rijdt de robot om een obstakel heen. `analyze()` laat zo'n concept
       * altijd op `used: false` staan; de docentweergave maakt er een
       * vinkvakje van.
       */
      type: 'handmatig';
    };

/**
 * Een cursus met twee leerroutes geeft per concept een niveau per route. Een
 * kale `Level` betekent: in elke track hetzelfde.
 */
export type ConceptLevel = Level | Record<string, Level>;

export interface Concept {
  id: string;
  /** Verwijst naar een SubjectInfo.id. */
  subject: string;
  /** Groepskop binnen het onderwerp (kaartje in het rapport). */
  group: string;
  /** Nederlandstalig label voor de checklist. */
  label: string;
  level: ConceptLevel;
  /**
   * Optioneel: de denkvaardigheid van Bloom (onthouden, begrijpen, toepassen,
   * analyseren, evalueren, creëren) als tweede as naast het niveau. De
   * rapportage doet er nog niets mee; de tabel van een site legt hem vast.
   */
  bloom?: string;
  detect: ConceptDetect;
}

/** Een leerroute; alleen nodig als een site er meer dan één heeft. */
export interface TrackInfo {
  id: string;
  label: string;
}

/** Een regel in een bestand van het project (regels tellen vanaf 1). */
export interface Plek {
  bestand: string;
  regel: number;
}

export interface ConceptMatch {
  id: string;
  count: number;
  used: boolean;
  /** Welke onderdelen gevonden zijn, als het concept `delen` heeft. */
  delen?: string[];
  /**
   * Waar het concept staat, hooguit MAX_PLEKKEN regels. Leeg voor een
   * handmatig concept; voor een pad-concept de eerste regel van elk
   * passend bestand.
   */
  plekken?: Plek[];
}

export interface SubjectInfo {
  id: string;
  label: string;
}

export interface FileKindInfo {
  id: string;
  label: string;
}

export interface CheckerConfig {
  /** Onderwerpen (bv. FastAPI, HTML, Database) in weergavevolgorde. */
  subjects: SubjectInfo[];
  /**
   * Optioneel: concepten die de nakijker herkent maar die niet meetellen
   * voor het niveau, omdat ze niet in de tabel van de docent staan. Het
   * rapport toont de gebruikte apart, onder "Ook gebruikt".
   */
  extra?: ExtraConcept[];
  /**
   * Leerroutes waartussen de docent kan schakelen. Weglaten = één route, en
   * dan gedraagt alles zich als voorheen. De eerste track is de startwaarde.
   */
  tracks?: TrackInfo[];
  concepts: Concept[];
  /** Bestandssoorten voor het bestandsoverzicht (volgorde + labels). */
  fileKinds: FileKindInfo[];
  /** Pad → kind-id. */
  classify: (path: string) => string;
  /** Kinds waarvan de inhoud als tekst wordt gelezen. */
  textKinds: string[];
  /**
   * Optioneel: soorten tekst die de config zelf maakt uit de bestanden, en
   * waarin een concept kan zoeken met `detect.in`. Bijvoorbeeld "alleen de
   * JavaScript uit dit HTML-bestand, zonder commentaar en tekst". Zo zoekt
   * een JavaScript-patroon niet in een alinea of een commentaar.
   */
  afgeleid?: AfgeleideSoort[];
  /**
   * Optioneel: is dit bestand een bibliotheek die de leerling meelevert, en
   * geen eigen code? Zo'n bestand telt niet mee voor de concepten en niet
   * voor Buiten de lesstof; het rapport noemt het in een waarschuwing.
   * `lijktBibliotheek` uit `bibliotheek.ts` herkent jQuery, Bootstrap en
   * geminificeerde bestanden.
   */
  bibliotheek?: (path: string, content: string) => boolean;
  /** Kinds die als data-URL worden ingelezen (optioneel; bv. afbeeldingen). */
  imageKinds?: string[];
  /** Accept-attribuut voor de bestandskiezer. */
  accept: string;
  /** Zacht docentwachtwoord (geen echte beveiliging op een statische site). */
  teacher: { password: string; storageKey: string };
  /** Voorgestelde PDF-bestandsnaam. */
  pdfFilename: (date: Date) => string;
  /** Korte privacy-belofte onder de uploadzone. */
  privacyNote?: string;
  /**
   * Optioneel: toon een "Bekijk in Online Editor"-knop die het project via
   * window.open + postMessage naar de IDE stuurt (alleen zinvol voor projecten
   * die in de web-IDE draaien, bv. HTML/CSS/JS).
   */
  ide?: { url: string };
  /**
   * Optioneel: zoek wat het project gebruikt dat níet in het lesmateriaal
   * staat (een `<canvas>`, `@keyframes`, `fetch()`). Het rapport zet de
   * vondsten in een eigen blok voor de docent, als aanknopingspunt voor het
   * mondeling: wie het zelf heeft uitgezocht kan het uitleggen. Telt nergens
   * mee in de niveausamenvatting.
   */
  buitenLesstof?: (files: ProjectFiles) => Vondst[];
}

/** Iets in het project dat het lesmateriaal niet behandelt. */
export interface Vondst {
  /** Kop waaronder de vondst staat, bv. 'HTML-elementen' of 'JavaScript'. */
  groep: string;
  /** Wat er gevonden is, zoals de leerling het schreef: '<canvas>', '@keyframes'. */
  label: string;
  count: number;
  /** De bestanden waarin het staat, zodat de docent ernaar kan vragen. */
  files: string[];
  /** De regels waar het staat, hooguit MAX_PLEKKEN. */
  plekken?: Plek[];
}

/**
 * Een afgeleide soort: per bestand van een van de soorten in `van` een nieuwe
 * tekst. Die tekst moet even lang blijven, met elk regeleinde op zijn plek,
 * want de regelnummers van een vondst wijzen naar het echte bestand. Wat
 * wegvalt, wordt spaties.
 */
export interface AfgeleideSoort {
  /** De naam waaronder een concept hem in `detect.in` noemt. */
  kind: string;
  /** Van welke bestandssoorten hij gemaakt wordt. */
  van: string[];
  maak: (inhoud: string, soort: string) => string;
}

/** Een concept zonder niveau: wordt herkend en getoond, telt niet mee. */
export type ExtraConcept = Omit<Concept, 'level' | 'bloom'>;

export interface CheckReport {
  fileStats: {
    total: number;
    byKind: Record<string, number>;
    skippedTooLarge: number;
  };
  concepts: ConceptMatch[];
  /** De extra concepten (zie CheckerConfig.extra); leeg zonder. */
  extra?: ConceptMatch[];
  /** Leeg als de config geen `buitenLesstof` heeft. */
  buitenLesstof: Vondst[];
  warnings: string[];
}
