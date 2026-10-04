// Eén verbinding per browsertab, buiten React om.
//
// De SerialClient zat in een useRef van de editor-component. Wie via de navbar
// naar een les ging en terugkwam, kreeg een verse component zonder client: de
// poort bleef open in de browser (de oude reader hield zijn lock), maar de
// editor wist er niets meer van en "Verbind met board" faalde met "port
// already open" tot de leerling de pagina herlaadde. Deze module houdt de
// client vast zolang de tab leeft; de component meldt zich bij het mounten aan
// als luisteraar en weer af bij het unmounten.
//
// Alles wat een operatie ná een await verandert, staat hier en niet in de
// component: de shell-tekst, de status, en de stand van de editor (code,
// geopend bestand, voortgang van de installer). Een operatie die vóór een
// paginawissel begon, rondt anders af in een component die al weg is: de
// status bleef dan op "Bezig", de live uitvoer van "Test direct" verdween, en
// een geopend bestand kwam nooit in de editor. De component is een weergave
// van deze sessie, meer niet.
//
// Na een echte herlaad is de poort wel dicht. WebSerial onthoudt de toestemming
// per site, dus `herverbind` opent dezelfde poort opnieuw zonder kiezer — maar
// alleen in de tab die eerder zelf verbonden was (sessionStorage), zodat een
// tweede tab niet om de poort gaat vechten.

import { friendlyError } from './errorMessages';
import type { InstallProgress } from './leaphyInstaller';
import { SerialClient, type SerialPort, type SerialStatus } from './serial';
import { TEMPLATES } from './templates';

/** Zelfde plafond als de shell zelf: meer dan dit ziet niemand terug. */
const MAX_SHELL = 20000;
export const WAS_VERBONDEN_KEY = 'webMicroEditor.wasVerbonden';
const CODE_KEY = 'webMicroEditor.code';
const FILE_KEY = 'webMicroEditor.currentFile';

/** 'verbindt': er loopt een stille herverbind-poging na een herlaad. */
export type SessieStatus = SerialStatus | 'verbindt';

/** De stand van de editor die operaties veranderen; code en bestand blijven in localStorage. */
export type Stand = {
  code: string;
  /** De code zoals die het laatst geladen of opgeslagen is, om wijzigingen te zien. */
  loadedCode: string;
  currentFile: string | null;
  progress: InstallProgress | null;
};

export type Luisteraar = {
  /** Eén stuk nieuwe shell-tekst; de hele tekst staat in `replText`. */
  onData: (tekst: string) => void;
  /**
   * Elke statuswissel, ook van een operatie die een vorige component begon.
   * Zonder dit bleef een component die tijdens "Test direct" mountte voor
   * altijd op 'busy' staan: het einde van de test meldde zich bij de oude,
   * al ge-unmounte component.
   */
  onStatus: (status: SessieStatus) => void;
  onStand: (stand: Stand) => void;
};

type Opslag = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type HerverbindOpties = {
  poorten?: () => Promise<SerialPort[]>;
  maakClient?: () => SerialClient;
};

export class EditorSessie {
  client: SerialClient | null = null;
  /** De shell-tekst, zodat die na een paginawissel niet leeg begint. */
  replText = '';
  stand: Stand;

  private luisteraar: Luisteraar | null = null;
  /** Een operatie (Run, Opslaan, installer) loopt; los van de raw-modus van de client. */
  private bezig = false;
  /**
   * Volgnummer van de lopende operatie. Een operatie die op een oude client
   * begon en pas na een herverbinding afrondt, mag de bezig-vlag van een
   * nieuwe operatie niet wissen; haar nummer is dan verlopen.
   */
  private operatie = 0;
  private poging: Promise<boolean> | null = null;
  private laatstGemeld: SessieStatus | null = null;

  constructor(
    /** Per tab (sessionStorage): of deze tab zelf verbonden was. */
    private tab: Opslag | null,
    /** Blijvend (localStorage): de code en het geopende bestand. */
    blijvend: Opslag | null,
  ) {
    const code = blijvend?.getItem(CODE_KEY) ?? TEMPLATES[0].code;
    this.stand = {
      code,
      loadedCode: code,
      currentFile: blijvend?.getItem(FILE_KEY) ?? null,
      progress: null,
    };
    this.blijvend = blijvend;
  }

  private blijvend: Opslag | null;

  get status(): SessieStatus {
    if (this.client) {
      return this.bezig || this.client.status === 'busy' ? 'busy' : 'connected';
    }
    return this.poging ? 'verbindt' : 'disconnected';
  }

  /** Waar: er loopt een herverbind-poging. */
  get verbindt(): boolean {
    return this.poging !== null;
  }

  /** Markeer het begin van een operatie; het nummer hoort bij `eindOperatie`. */
  beginOperatie(): number {
    this.operatie += 1;
    this.bezig = true;
    this.meldStatus();
    return this.operatie;
  }

  /** Rondt een operatie af; een verlopen nummer (na herverbinding) doet niets. */
  eindOperatie(nummer: number): void {
    if (nummer !== this.operatie) return;
    this.bezig = false;
    this.meldStatus();
  }

  /** Voeg tekst aan de shell toe en geef het stuk door aan de component die er is. */
  schrijf(tekst: string): void {
    this.replText = (this.replText + tekst).slice(-MAX_SHELL);
    this.luisteraar?.onData(tekst);
  }

  wis(): void {
    this.replText = '';
  }

  /** Verander de stand; code en bestand gaan meteen naar localStorage. */
  zet(deel: Partial<Stand>): void {
    this.stand = { ...this.stand, ...deel };
    if (deel.code !== undefined) this.blijvend?.setItem(CODE_KEY, deel.code);
    if (deel.currentFile !== undefined) {
      if (deel.currentFile === null) this.blijvend?.removeItem(FILE_KEY);
      else this.blijvend?.setItem(FILE_KEY, deel.currentFile);
    }
    this.luisteraar?.onStand(this.stand);
  }

  /**
   * Verbind via de poortkiezer. Loopt er nog een stille herverbind-poging,
   * dan wacht dit daarop en slaat de kiezer over als die slaagt.
   */
  async verbind(maakClient: () => SerialClient = () => new SerialClient()): Promise<boolean> {
    if (this.client) return false;
    if (this.poging && (await this.poging)) return true;
    const client = maakClient();
    try {
      await client.connect();
    } catch (err) {
      this.schrijf(`[verbinden mislukt: ${friendlyError(err)}]\n`);
      return false;
    }
    this.neemOver(client);
    this.schrijf('[verbonden]\n');
    return true;
  }

  /** Neemt een net geopende client in beheer en hangt de callbacks eraan. */
  neemOver(client: SerialClient): void {
    this.client = client;
    this.bezig = false;
    this.operatie += 1;
    client.onData = (tekst) => this.schrijf(tekst);
    client.onDisconnect = () => {
      if (this.client === client) {
        this.client = null;
        this.bezig = false;
        this.operatie += 1;
      }
      this.schrijf('\n[verbinding verbroken]\n');
      this.meldStatus();
    };
    this.tab?.setItem(WAS_VERBONDEN_KEY, '1');
    this.meldStatus();
  }

  /** Bewust verbreken: dan ook na een herlaad niet meer vanzelf verbinden. */
  async verbreek(): Promise<void> {
    const client = this.client;
    this.client = null;
    this.bezig = false;
    this.operatie += 1;
    this.tab?.removeItem(WAS_VERBONDEN_KEY);
    this.meldStatus();
    await client?.disconnect();
  }

  /** Meld een component aan; geeft de afmeld-functie terug voor de cleanup van het effect. */
  luister(luisteraar: Luisteraar): () => void {
    this.luisteraar = luisteraar;
    this.laatstGemeld = null;
    return () => {
      if (this.luisteraar === luisteraar) this.luisteraar = null;
    };
  }

  /**
   * Opnieuw verbinden met de eerder toegestane poort, zonder kiezer. Alleen als
   * deze tab eerder zelf verbonden was en er precies één bekende poort is; bij
   * twee boards moet de leerling zelf kiezen.
   */
  async herverbind(opties: HerverbindOpties = {}): Promise<boolean> {
    if (this.client || this.poging) return false;
    if (this.tab?.getItem(WAS_VERBONDEN_KEY) !== '1') return false;
    this.poging = this.probeerHerverbind(opties);
    this.meldStatus();
    try {
      return await this.poging;
    } finally {
      this.poging = null;
      this.meldStatus();
    }
  }

  private async probeerHerverbind(opties: HerverbindOpties): Promise<boolean> {
    let poorten: SerialPort[];
    try {
      // Ook getPorts kan weigeren (Permissions-Policy, cross-origin iframe);
      // dan hoort dit stil niets te doen.
      poorten = await (opties.poorten ?? SerialClient.bekendePoorten)();
    } catch {
      return false;
    }
    if (poorten.length !== 1) return false;
    const client = (opties.maakClient ?? (() => new SerialClient()))();
    try {
      await client.connect(poorten[0]);
    } catch (err) {
      this.schrijf(`[opnieuw verbinden mislukt: ${friendlyError(err)}]\n`);
      return false;
    }
    // neemOver meldt de status aan wie er nú luistert — ook als dat een
    // andere component is dan die de poging startte.
    this.neemOver(client);
    this.schrijf('[opnieuw verbonden]\n');
    return true;
  }

  private meldStatus(): void {
    const status = this.status;
    if (status === this.laatstGemeld) return;
    this.laatstGemeld = status;
    this.luisteraar?.onStatus(status);
  }
}

export const sessie = new EditorSessie(
  typeof sessionStorage !== 'undefined' ? sessionStorage : null,
  typeof localStorage !== 'undefined' ? localStorage : null,
);
