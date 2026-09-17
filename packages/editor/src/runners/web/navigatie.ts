import { resolvePath } from './buildDoc';

// Links tussen de HTML-bestanden van een project. De preview is een
// srcdoc-iframe zonder bestandslocatie, dus <a href="over.html"> kan de
// browser nergens heen brengen; het script in de pagina meldt de klik en de
// runner bouwt het doelbestand als nieuw voorbeeld. Dit bestand is de pure
// logica daarachter: waar een link heen wijst, en op welke pagina het
// voorbeeld staat (met een weg terug, want de Terug-knop van de browser
// werkt hier niet).

export type LinkDoel = { pad: string } | { fout: string };

/** Waar een link in de pagina `vanaf` heen wijst, binnen de projectbestanden. */
export function linkDoel(
  vanaf: string,
  href: string,
  files: Readonly<Record<string, string>>,
): LinkDoel {
  const kaal = href.replace(/[?#].*$/, '');
  if (kaal === '') return { pad: vanaf };
  const baseDir = vanaf.includes('/') ? vanaf.slice(0, vanaf.lastIndexOf('/')) : '';
  let pad = resolvePath(baseDir, kaal);
  const index = `${pad ? `${pad}/` : ''}index.html`;
  if (!(pad in files) && index in files) pad = index;
  if (!(pad in files)) {
    return {
      fout: `De link "${href}" wijst naar "${pad}", maar dat bestand staat niet in je project.`,
    };
  }
  if (!/\.html?$/i.test(pad)) {
    return {
      fout: `De link "${href}" wijst naar "${pad}", en het voorbeeld kan alleen een HTML-bestand tonen.`,
    };
  }
  return { pad };
}

/**
 * Op welke pagina het voorbeeld staat. Het startbestand is de bodem; elke
 * gevolgde link komt erbovenop, en Terug haalt er één af. Een nieuwe run
 * (de leerling typte) blijft op de bezochte pagina, zodat je aan over.html
 * kunt werken terwijl je hem ziet; alleen een ander startbestand, of een
 * pagina die niet meer bestaat, zet het voorbeeld terug.
 */
export class Bezoek {
  private entry = '';
  private stapel: string[] = [];

  get pagina(): string {
    return this.stapel[this.stapel.length - 1] ?? this.entry;
  }

  /** De pagina waar Terug naartoe gaat, of null op het startbestand. */
  get terugNaar(): string | null {
    if (this.stapel.length === 0) return null;
    return this.stapel[this.stapel.length - 2] ?? this.entry;
  }

  bijRun(entry: string, files: Readonly<Record<string, string>>): string {
    if (entry !== this.entry) {
      this.entry = entry;
      this.stapel = [];
    }
    this.stapel = this.stapel.filter((pad) => pad in files);
    return this.pagina;
  }

  /**
   * Volg een link. Een link terug naar een pagina die al op de stapel staat
   * (of naar het startbestand) gaat daarheen terug in plaats van erbovenop:
   * wie via "Terug naar de startpagina" op index.html belandt, hoort daar
   * geen knop "Terug naar over.html" te zien.
   */
  ga(pad: string): string {
    if (pad === this.entry) {
      this.stapel = [];
    } else if (this.stapel.includes(pad)) {
      this.stapel = this.stapel.slice(0, this.stapel.indexOf(pad) + 1);
    } else {
      this.stapel.push(pad);
    }
    return this.pagina;
  }

  terug(): string {
    this.stapel.pop();
    return this.pagina;
  }
}
