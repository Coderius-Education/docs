import { describe, expect, it, vi } from 'vitest';
import {
  DOWNLOAD_BEWAREN_MS,
  type Omgeving,
  type ShowSaveFilePicker,
  bewaarPdf,
  download,
  knipPunten,
  meldingNaBewaren,
  meldingVan,
} from './exportPdf';

describe('knipPunten', () => {
  it('knipt op een lege rij boven de volle hoogte, niet door een regel', () => {
    // Rijen 90 tot en met 110 zijn tekst; 85 is leeg.
    const leeg = (y: number) => y < 90 || y > 110;
    expect(knipPunten(250, 100, leeg)).toEqual([0, 89, 189]);
  });

  it('knipt op de volle hoogte als er geen lege rij in de buurt is', () => {
    expect(knipPunten(250, 100, () => false)).toEqual([0, 100, 200]);
  });

  it('heeft één pagina als alles past', () => {
    expect(knipPunten(80, 100, () => true)).toEqual([0]);
  });
});

// Issue 218: "pdf export tool werkt niet meer". Chrome en Edge openen het
// venster Opslaan als alleen binnen een paar seconden na een klik. De export
// vroeg het venster pas nadat de PDF gemaakt was; duurde dat langer (foto's,
// een lang rapport, een trage computer), dan weigerde de browser en zag de
// docent "Het opslaan als PDF is mislukt". In Chromium gemeten: tot vier
// seconden na de klik opent het venster, na zes seconden komt er een
// SecurityError. Dat een echte browser zo doet, speelt node niet na; de
// volgorde en de terugval wel.
describe('bewaarPdf', () => {
  const pdf = new Blob(['%PDF'], { type: 'application/pdf' });

  /** Een omgeving die bijhoudt in welke volgorde alles gebeurt. */
  function proef(kiezer?: (stappen: string[]) => ReturnType<ShowSaveFilePicker>) {
    const stappen: string[] = [];
    const geschreven: Blob[] = [];
    const gedownload: [Blob, string][] = [];
    const handle = {
      createWritable: async () => ({
        write: async (b: Blob) => {
          stappen.push('schrijven');
          geschreven.push(b);
        },
        close: async () => {},
      }),
      remove: vi.fn(async () => {
        stappen.push('weghalen');
      }),
    };
    const omgeving: Omgeving = {
      kiezer: kiezer
        ? () => kiezer(stappen)
        : async () => {
            stappen.push('venster');
            return handle;
          },
      download: (b, naam) => {
        stappen.push('download');
        gedownload.push([b, naam]);
      },
    };
    const maak = vi.fn(async () => {
      stappen.push('maken');
      return pdf;
    });
    return { stappen, geschreven, gedownload, handle, omgeving, maak };
  }

  it('vraagt eerst waar de PDF moet komen, en maakt hem dan pas', async () => {
    const p = proef();
    expect(await bewaarPdf(p.maak, 'rapport.pdf', p.omgeving)).toEqual({ plek: 'gekozen' });
    // Andersom is de klik bij een groot rapport te lang geleden voor de browser.
    expect(p.stappen).toEqual(['venster', 'maken', 'schrijven']);
    expect(p.geschreven).toEqual([pdf]);
    expect(p.gedownload).toEqual([]);
  });

  it('geeft het venster de naam van het bestand en het soort PDF mee', async () => {
    const kiezer = vi.fn(async () => proef().handle);
    await bewaarPdf(async () => pdf, 'Beoordeling Robot - Sam.pdf', { kiezer, download: () => {} });
    expect(kiezer).toHaveBeenCalledWith({
      suggestedName: 'Beoordeling Robot - Sam.pdf',
      types: [{ description: 'PDF-bestand', accept: { 'application/pdf': ['.pdf'] } }],
    });
  });

  it('maakt geen PDF als de docent het venster wegklikt', async () => {
    const p = proef(async () => {
      throw new DOMException('The user aborted a request.', 'AbortError');
    });
    expect(await bewaarPdf(p.maak, 'rapport.pdf', p.omgeving)).toBeNull();
    expect(p.maak).not.toHaveBeenCalled();
    expect(p.gedownload).toEqual([]);
  });

  it('valt terug op een download als de browser het venster weigert', async () => {
    const waarschuwing = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // De melding van Chrome als de klik te lang geleden is.
    const p = proef(async () => {
      throw new DOMException(
        'Must be handling a user gesture to show a file picker.',
        'SecurityError',
      );
    });
    expect(await bewaarPdf(p.maak, 'rapport.pdf', p.omgeving)).toEqual({
      plek: 'downloads',
      reden: 'Must be handling a user gesture to show a file picker.',
    });
    expect(p.stappen).toEqual(['maken', 'download']);
    expect(p.gedownload).toEqual([[pdf, 'rapport.pdf']]);
    expect(waarschuwing).toHaveBeenCalled();
    waarschuwing.mockRestore();
  });

  it('downloadt in een browser zonder het venster (Firefox, Safari)', async () => {
    const p = proef();
    p.omgeving.kiezer = undefined;
    expect(await bewaarPdf(p.maak, 'rapport.pdf', p.omgeving)).toEqual({
      plek: 'downloads',
      reden: null,
    });
    expect(p.stappen).toEqual(['maken', 'download']);
  });

  it('valt terug op een download als schrijven naar het gekozen bestand mislukt', async () => {
    const waarschuwing = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = proef();
    p.handle.createWritable = async () => {
      throw new DOMException('Geen toegang', 'NotAllowedError');
    };
    expect(await bewaarPdf(p.maak, 'rapport.pdf', p.omgeving)).toEqual({
      plek: 'downloads',
      reden: 'Geen toegang',
    });
    // Het lege bestand dat het venster al aanmaakte, gaat weer weg.
    expect(p.stappen).toEqual(['venster', 'maken', 'weghalen', 'download']);
    expect(p.gedownload).toEqual([[pdf, 'rapport.pdf']]);
    waarschuwing.mockRestore();
  });

  it('haalt het lege bestand weg en geeft de fout door als het maken mislukt', async () => {
    const p = proef();
    const fout = new Error('canvas te groot');
    await expect(
      bewaarPdf(
        async () => {
          throw fout;
        },
        'rapport.pdf',
        p.omgeving,
      ),
    ).rejects.toBe(fout);
    expect(p.handle.remove).toHaveBeenCalledTimes(1);
    expect(p.gedownload).toEqual([]);
  });

  it('werkt ook met een bestand dat niet weg kan (een oudere Chrome)', async () => {
    const p = proef();
    const { remove: _weg, ...zonder } = p.handle;
    p.omgeving.kiezer = async () => zonder;
    await expect(
      bewaarPdf(
        async () => {
          throw new Error('mislukt');
        },
        'rapport.pdf',
        p.omgeving,
      ),
    ).rejects.toThrow('mislukt');
  });
});

// Issue 225: "pdf export werkt voor alle stappen behalve het opslaan van het
// bestand". De nakijker zei "PDF opgeslagen" ook als het venster niet kon en
// de PDF als download kwam, en dan stond hij niet waar de docent hem zocht.
// Of een download aankomt, ziet de pagina niet: een school kan downloads
// tegenhouden. De melding zegt daarom waar de PDF hoort te staan, en waarom
// het gekozen bestand niet lukte.
describe('de melding na het bewaren', () => {
  it('zegt "PDF opgeslagen" alleen als de PDF in het gekozen bestand staat', () => {
    expect(meldingNaBewaren({ plek: 'gekozen' }).melding).toBe('PDF opgeslagen.');
    for (const reden of [null, 'Geen toegang'])
      expect(meldingNaBewaren({ plek: 'downloads', reden }).melding).not.toMatch(/opgeslagen/);
  });

  it('noemt bij een download de map Downloads, en wat er mis kan zijn', () => {
    const { melding, klaar } = meldingNaBewaren({ plek: 'downloads', reden: null });
    expect(melding).toMatch(/map Downloads/);
    expect(melding).toMatch(/houdt de browser downloads tegen/);
    expect(melding).not.toMatch(/koos/);
    // Pas als hij de PDF heeft gezien, gooit de docent de beoordeling weg.
    expect(klaar).toMatch(/Staat hij daar/);
  });

  it('noemt de reden als het gekozen bestand niet lukte', () => {
    expect(meldingNaBewaren({ plek: 'downloads', reden: 'Geen toegang' }).melding).toMatch(
      /De plek die je koos, lukte niet \(Geen toegang\)/,
    );
  });

  it('haalt de reden uit elke soort fout', () => {
    expect(meldingVan(new DOMException('Geen toegang', 'NotAllowedError'))).toBe('Geen toegang');
    expect(meldingVan(new DOMException('', 'SecurityError'))).toBe('SecurityError');
    expect(meldingVan(new Error('canvas te groot'))).toBe('canvas te groot');
    expect(meldingVan('kapot')).toBe('kapot');
  });
});

describe('download', () => {
  it('houdt het adres van de PDF een minuut geldig', () => {
    // Firefox en Safari halen een download soms pas na de klik op; was het
    // adres dan al ingetrokken, dan mislukte hij stil.
    const ingetrokken: string[] = [];
    const geklikt: string[] = [];
    const later: [() => void, number][] = [];
    const origineel = { maak: URL.createObjectURL, trek: URL.revokeObjectURL };
    URL.createObjectURL = () => 'blob:proef';
    URL.revokeObjectURL = (u: string) => {
      ingetrokken.push(u);
    };
    const a = {
      href: '',
      download: '',
      style: {},
      click: () => geklikt.push(a.href),
      remove: () => {},
    };
    const doc = globalThis.document;
    // node heeft geen document; dit is genoeg voor een link die klikt.
    (globalThis as { document?: unknown }).document = {
      createElement: () => a,
      body: { appendChild: () => {} },
    };
    try {
      download(new Blob(['%PDF']), 'rapport.pdf', (ga, ms) => later.push([ga, ms]));
      expect(geklikt).toEqual(['blob:proef']);
      expect(a.download).toBe('rapport.pdf');
      expect(ingetrokken).toEqual([]);
      expect(later.map(([, ms]) => ms)).toEqual([DOWNLOAD_BEWAREN_MS]);
      expect(DOWNLOAD_BEWAREN_MS).toBeGreaterThanOrEqual(40_000);
      later[0][0]();
      expect(ingetrokken).toEqual(['blob:proef']);
    } finally {
      URL.createObjectURL = origineel.maak;
      URL.revokeObjectURL = origineel.trek;
      (globalThis as { document?: unknown }).document = doc;
    }
  });
});
