import { describe, expect, it, vi } from 'vitest';
import { type Omgeving, type ShowSaveFilePicker, bewaarPdf, knipPunten } from './exportPdf';

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
    expect(await bewaarPdf(p.maak, 'rapport.pdf', p.omgeving)).toBe(true);
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
    expect(await bewaarPdf(p.maak, 'rapport.pdf', p.omgeving)).toBe(false);
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
    expect(await bewaarPdf(p.maak, 'rapport.pdf', p.omgeving)).toBe(true);
    expect(p.stappen).toEqual(['maken', 'download']);
    expect(p.gedownload).toEqual([[pdf, 'rapport.pdf']]);
    expect(waarschuwing).toHaveBeenCalled();
    waarschuwing.mockRestore();
  });

  it('downloadt in een browser zonder het venster (Firefox, Safari)', async () => {
    const p = proef();
    p.omgeving.kiezer = undefined;
    expect(await bewaarPdf(p.maak, 'rapport.pdf', p.omgeving)).toBe(true);
    expect(p.stappen).toEqual(['maken', 'download']);
  });

  it('valt terug op een download als schrijven naar het gekozen bestand mislukt', async () => {
    const waarschuwing = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = proef();
    p.handle.createWritable = async () => {
      throw new DOMException('Geen toegang', 'NotAllowedError');
    };
    expect(await bewaarPdf(p.maak, 'rapport.pdf', p.omgeving)).toBe(true);
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
