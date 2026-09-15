// Eén verbinding per browsertab, buiten React om.
//
// De SerialClient zat in een useRef van de editor-component. Wie via de navbar
// naar een les ging en terugkwam, kreeg een verse component zonder client: de
// poort bleef open in de browser (de oude reader hield zijn lock), maar de
// editor wist er niets meer van en "Verbind met board" faalde met "port
// already open" tot de leerling de pagina herlaadde. Deze module houdt de
// client vast zolang de tab leeft; de component meldt zich bij het mounten aan
// als luisteraar en weer af bij het unmounten. Uitvoer die binnenkomt terwijl
// niemand luistert (een print-loop terwijl de leerling een les leest) wordt
// opgespaard en bij de volgende mount alsnog getoond.
//
// Na een echte herlaad is de poort wel dicht. WebSerial onthoudt de toestemming
// per site, dus `herverbind` opent dezelfde poort opnieuw zonder kiezer — maar
// alleen in de tab die eerder zelf verbonden was (sessionStorage), zodat een
// tweede tab niet om de poort gaat vechten.

import { SerialClient, type SerialPort, type SerialStatus } from './serial';

/** Zelfde plafond als de shell zelf: meer dan dit ziet niemand terug. */
const MAX_OPGESPAARD = 20000;
export const WAS_VERBONDEN_KEY = 'webMicroEditor.wasVerbonden';

export type Luisteraar = {
  onData: (tekst: string) => void;
  /**
   * Elke statuswissel, ook van een operatie die een vorige component begon.
   * Zonder dit bleef een component die tijdens "Test direct" mountte voor
   * altijd op 'busy' staan: het einde van de test meldde zich bij de oude,
   * al ge-unmounte component.
   */
  onStatus: (status: SerialStatus) => void;
};

type HerverbindOpties = {
  poorten?: () => Promise<SerialPort[]>;
  maakClient?: () => SerialClient;
};

export class EditorSessie {
  client: SerialClient | null = null;
  /** De shell-tekst, zodat die na een paginawissel niet leeg begint. */
  replText = '';
  /** Waar: er loopt een herverbind-poging; de knop moet dan niet ook nog kiezen. */
  verbindt = false;

  private luisteraar: Luisteraar | null = null;
  private opgespaard = '';
  /** Een operatie (Run, Opslaan, installer) loopt; los van de raw-modus van de client. */
  private bezig = false;

  constructor(private opslag: Storage | null) {}

  get status(): SerialStatus {
    if (!this.client) return 'disconnected';
    return this.bezig || this.client.status === 'busy' ? 'busy' : 'connected';
  }

  /** Markeer het begin en einde van een operatie; de luisteraar hoort het meteen. */
  zetBezig(bezig: boolean): void {
    this.bezig = bezig;
    this.meldStatus();
  }

  /** Schrijf een regel naar de shell: direct als er een component is, anders opgespaard. */
  schrijf(tekst: string): void {
    if (this.luisteraar) {
      this.luisteraar.onData(tekst);
    } else {
      this.opgespaard = (this.opgespaard + tekst).slice(-MAX_OPGESPAARD);
    }
  }

  /** Neemt een net geopende client in beheer en hangt de callbacks eraan. */
  neemOver(client: SerialClient): void {
    this.client = client;
    this.bezig = false;
    client.onData = (tekst) => this.schrijf(tekst);
    client.onDisconnect = () => {
      if (this.client === client) {
        this.client = null;
        this.bezig = false;
      }
      this.schrijf('\n[verbinding verbroken]\n');
      this.meldStatus();
    };
    this.opslag?.setItem(WAS_VERBONDEN_KEY, '1');
    this.meldStatus();
  }

  /** Bewust verbreken: dan ook na een herlaad niet meer vanzelf verbinden. */
  async verbreek(): Promise<void> {
    const client = this.client;
    this.client = null;
    this.bezig = false;
    this.opslag?.removeItem(WAS_VERBONDEN_KEY);
    this.meldStatus();
    await client?.disconnect();
  }

  /**
   * Meld een component aan. Opgespaarde uitvoer komt meteen binnen. Geeft de
   * afmeld-functie terug, voor de cleanup van het effect.
   */
  luister(luisteraar: Luisteraar): () => void {
    this.luisteraar = luisteraar;
    if (this.opgespaard) {
      const tekst = this.opgespaard;
      this.opgespaard = '';
      luisteraar.onData(tekst);
    }
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
    if (this.client || this.verbindt) return false;
    if (this.opslag?.getItem(WAS_VERBONDEN_KEY) !== '1') return false;
    this.verbindt = true;
    try {
      // Alles in één try: ook getPorts kan weigeren (Permissions-Policy,
      // cross-origin iframe), en dan hoort dit stil niets te doen.
      const poorten = await (opties.poorten ?? SerialClient.bekendePoorten)();
      if (poorten.length !== 1) return false;
      const client = (opties.maakClient ?? (() => new SerialClient()))();
      await client.connect(poorten[0]);
      // neemOver meldt de status aan wie er nú luistert — ook als dat een
      // andere component is dan die de poging startte.
      this.neemOver(client);
      this.schrijf('[opnieuw verbonden]\n');
      return true;
    } catch {
      return false;
    } finally {
      this.verbindt = false;
    }
  }

  private meldStatus(): void {
    this.luisteraar?.onStatus(this.status);
  }
}

export const sessie = new EditorSessie(
  typeof sessionStorage !== 'undefined' ? sessionStorage : null,
);
