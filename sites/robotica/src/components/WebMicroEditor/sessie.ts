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
  onDisconnect: () => void;
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

  constructor(private opslag: Storage | null) {}

  get status(): SerialStatus {
    return this.client?.status ?? 'disconnected';
  }

  /** Neemt een net geopende client in beheer en hangt de callbacks eraan. */
  neemOver(client: SerialClient): void {
    this.client = client;
    client.onData = (tekst) => this.ontvang(tekst);
    client.onDisconnect = () => {
      if (this.client === client) this.client = null;
      this.ontvang('\n[verbinding verbroken]\n');
      this.luisteraar?.onDisconnect();
    };
    this.opslag?.setItem(WAS_VERBONDEN_KEY, '1');
  }

  /** Bewust verbreken: dan ook na een herlaad niet meer vanzelf verbinden. */
  async verbreek(): Promise<void> {
    const client = this.client;
    this.client = null;
    this.opslag?.removeItem(WAS_VERBONDEN_KEY);
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
      const poorten = await (opties.poorten ?? SerialClient.bekendePoorten)();
      if (poorten.length !== 1) return false;
      const client = (opties.maakClient ?? (() => new SerialClient()))();
      try {
        await client.connect(poorten[0]);
      } catch {
        return false;
      }
      this.neemOver(client);
      return true;
    } finally {
      this.verbindt = false;
    }
  }

  private ontvang(tekst: string): void {
    if (this.luisteraar) {
      this.luisteraar.onData(tekst);
    } else {
      this.opgespaard = (this.opgespaard + tekst).slice(-MAX_OPGESPAARD);
    }
  }
}

export const sessie = new EditorSessie(
  typeof sessionStorage !== 'undefined' ? sessionStorage : null,
);
