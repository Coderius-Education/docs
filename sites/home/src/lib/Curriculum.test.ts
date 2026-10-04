import { HOME, SITES, SITES_BY_ID, SUBJECTS } from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';
import {
  KLASSEN,
  THEMAS,
  THEMAS_PER_VAK,
  curriculum,
  levelColors,
  levelLabels,
  themasVan,
  themasVoorVakken,
} from './Curriculum';
import { examDomainByCode } from './ExamProgram';

// Bewaakt de homepage-kaarten. Curriculum.ts is een handgeschreven mapping
// van cursus-id -> examendomeinen, en twee dingen gaan daar stil kapot: een
// examencode die niet in ExamProgram.ts staat (buildCardChips laat die
// zonder fout weg, de chip verschijnt gewoon niet) en een cursus die wél in
// de registry staat maar hier ontbreekt (dan heeft coderius.nl geen kaart
// voor een cursus die in elke "Cursussen"-dropdown wél staat).
//
// De links zelf wijzen naar de site-root van elke cursus, nooit naar een
// docs-pagina — daarom hoeft hier geen bestand op schijf gecontroleerd te
// worden, alleen dat elke id in de registry zit.

describe('curriculum versus de registry', () => {
  it('elke cursus-id komt maar één keer voor', () => {
    const ids = curriculum.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('elke cursus-id staat in packages/shared/sites.js', () => {
    // De homepage zelf is bewust géén cursus in de registry (HOME staat
    // apart), en hoort dus ook niet als kaart in het curriculum.
    const onbekend = curriculum.filter((c) => !(c.id in SITES_BY_ID)).map((c) => c.id);
    expect(onbekend).toEqual([]);
    expect(curriculum.some((c) => c.id === HOME.id)).toBe(false);
  });

  it('elke cursus uit de registry heeft een kaart, en alleen cursussen', () => {
    // Docentensites (didactiek) staan wel in SITES_BY_ID maar zijn geen
    // cursus; die horen op de docentenpagina, niet als kaart.
    const opDeKaart = new Set(curriculum.map((c) => c.id));
    const vergeten = SITES.map((s) => s.id).filter((id) => !opDeKaart.has(id));
    expect(vergeten).toEqual([]);
    expect(curriculum.some((c) => c.id === 'didactiek')).toBe(false);
  });

  it('link, naam, omschrijving en voorkennis zijn die van de registry, niet een eigen versie', () => {
    // De eigen titels ("Python Play", "Code Editor") waren van de registry
    // weggedreven; nu kan dat niet meer.
    const kapot = curriculum
      .filter((c) => {
        const site = SITES_BY_ID[c.id];
        return (
          c.link !== site?.url ||
          c.label !== site?.label ||
          c.description !== site?.description ||
          c.requires !== site?.requires
        );
      })
      .map((c) => c.id);
    expect(kapot).toEqual([]);
  });

  it('staat op niveau: eerst alle beginners, dan gevorderd, elk in registry-volgorde', () => {
    // Een leerling die begint ziet zo eerst wat voor hem is; binnen een niveau
    // blijft de leerlijn uit de registry de volgorde.
    const registry = SITES.map((s) => s.id);
    const beginners = registry.filter(
      (id) => curriculum.find((c) => c.id === id)?.level === 'Beginner',
    );
    const gevorderd = registry.filter(
      (id) => curriculum.find((c) => c.id === id)?.level === 'Medium',
    );
    expect(curriculum.map((c) => c.id)).toEqual([...beginners, ...gevorderd]);
    expect(beginners.length).toBeGreaterThan(0);
    expect(gevorderd.length).toBeGreaterThan(0);
  });

  it('elke cursus valt onder minstens één thema van de filterrij', () => {
    const zonder = curriculum.filter((c) => themasVan(c).length === 0).map((c) => c.id);
    expect(zonder).toEqual([]);
  });
});

describe('vakken en thema', () => {
  it('elke cursus heeft het vak uit de registry, en dat vak bestaat', () => {
    const vakken = SUBJECTS.map((v) => v.id);
    const kapot = curriculum
      .filter(
        (c) =>
          !c.subject || c.subject !== SITES_BY_ID[c.id]?.subject || !vakken.includes(c.subject),
      )
      .map((c) => c.id);
    expect(kapot).toEqual([]);
  });

  it('elk thema van een cursus hoort bij het vak van die cursus', () => {
    // Anders verschijnt een informatica-cursus onder het thema Onderzoek, of
    // toont het Thema-filter op wo.coderius.nl een thema zonder kaarten.
    const kapot: string[] = [];
    for (const c of curriculum) {
      const eigen: readonly string[] =
        THEMAS_PER_VAK[c.subject as keyof typeof THEMAS_PER_VAK] ?? [];
      for (const t of themasVan(c)) if (!eigen.includes(t)) kapot.push(`${c.id}: ${t}`);
    }
    expect(kapot).toEqual([]);
  });

  it('elk thema hoort bij precies één bestaand vak en heeft minstens één cursus', () => {
    const vakken = SUBJECTS.map((v) => v.id);
    expect(Object.keys(THEMAS_PER_VAK).filter((v) => !vakken.includes(v))).toEqual([]);
    expect(new Set(THEMAS).size).toBe(THEMAS.length);
    const leeg = THEMAS.filter((t) => !curriculum.some((c) => themasVan(c).includes(t)));
    expect(leeg).toEqual([]);
  });

  it("het Thema-filter toont de thema's van de gekozen vakken, of alle", () => {
    expect(themasVoorVakken([])).toEqual(THEMAS);
    expect(themasVoorVakken(['wo'])).toEqual(['Onderzoek']);
    expect(themasVoorVakken(['informatica'])).toEqual([...THEMAS_PER_VAK.informatica]);
    expect(themasVoorVakken(['informatica', 'wo'])).toEqual(THEMAS);
  });
});

describe('curriculum versus het examenprogramma', () => {
  it('elke examencode bestaat in ExamProgram.ts', () => {
    const kapot: string[] = [];
    for (const cursus of curriculum) {
      for (const m of cursus.examDomains ?? []) {
        if (!examDomainByCode.has(m.code)) kapot.push(`${cursus.id}: ${m.code}`);
      }
    }
    expect(kapot).toEqual([]);
  });

  it('geen cursus noemt dezelfde examencode twee keer', () => {
    const kapot: string[] = [];
    for (const cursus of curriculum) {
      const codes = (cursus.examDomains ?? []).map((m) => m.code);
      if (new Set(codes).size !== codes.length) kapot.push(cursus.id);
    }
    expect(kapot).toEqual([]);
  });

  it('elk niveau heeft een kleur en een naam, en elke volgorde is een positief getal', () => {
    const kapot = curriculum
      .filter(
        (c) =>
          !(c.level in levelColors) ||
          !(c.level in levelLabels) ||
          !KLASSEN.includes(c.klas) ||
          !Number.isInteger(c.order.vwo) ||
          !Number.isInteger(c.order.havo) ||
          c.order.vwo < 1 ||
          c.order.havo < 1,
      )
      .map((c) => c.id);
    expect(kapot).toEqual([]);
  });

  it('alleen informatica-cursussen hebben examendomeinen', () => {
    // Het examenprogramma is dat van informatica.
    const kapot = curriculum
      .filter((c) => c.subject !== 'informatica' && (c.examDomains ?? []).length > 0)
      .map((c) => c.id);
    expect(kapot).toEqual([]);
  });

  it('elke informatica-cursus heeft minstens één sterk raakvlak; alleen gereedschap heeft er geen', () => {
    // Gereedschap (editor, ide) valt onder domein A en heeft bewust geen
    // mapping. Een lesreeks zonder sterk raakvlak is vergeten of half ingevuld,
    // zoals embedded lang was.
    // Examendomeinen horen bij informatica; een cursus van een ander vak
    // (onderzoek, wo) heeft er geen.
    const GEREEDSCHAP = ['editor', 'ide'];
    const zonder = curriculum
      .filter((c) => c.subject === 'informatica')
      .filter((c) => !GEREEDSCHAP.includes(c.id))
      .filter((c) => !c.examDomains?.some((m) => m.strength === 'strong'))
      .map((c) => c.id);
    expect(zonder).toEqual([]);
    for (const id of GEREEDSCHAP) {
      expect(curriculum.find((c) => c.id === id)?.examDomains ?? []).toEqual([]);
    }
  });
});
