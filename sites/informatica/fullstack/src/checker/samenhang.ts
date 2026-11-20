import { blanco, regelBegins, regelVan as regelIn } from '@coderius/checker/plekken';
import type { Plek, ProjectFiles, Samenhangfout } from '@coderius/checker/types';
import { IMPORT_VAN, gebruikt, geimporteerd, importRegel } from './imports';

// Samenhang: wat tussen twee bestanden niet aansluit. Een beginner schrijft
// een formulier in HTML, een functie in Python en een template in Jinja, en
// de namen moeten in alle drie hetzelfde zijn. Gaat dat mis, dan zegt Python
// niets: de browser toont een 422, een 404 of een lege plek, en de fout zit in
// een ander bestand dan waar je kijkt. Deze controle legt de twee kanten naast
// elkaar en wijst beide regels aan.
//
// Zo voorzichtig mogelijk: een melding die niet klopt, kost een leerling meer
// dan een gemiste. Wat de controle niet zeker weet (een dictionary uit een
// variabele, `await request.form()`, een router met prefix, een template met
// macro's) slaat hij over.

interface Route {
  methode: string;
  pad: string;
  functie: string;
  bestand: string;
  regel: number;
  /** De formuliervelden, of null als de controle ze niet zeker kent. */
  velden: Veld[] | null;
  /**
   * Gewone parameters zonder standaardwaarde en zonder Form(...): FastAPI
   * zoekt die in de URL. Bij een POST uit een formulier is dat bijna altijd
   * een vergeten `= Form(...)`, en dan geeft FastAPI een 422.
   */
  inUrl: { naam: string; regel: number }[];
  body: string;
  bodyStart: number;
}

interface Veld {
  naam: string;
  verplicht: boolean;
  regel: number;
}

interface Formulier {
  bestand: string;
  regel: number;
  methode: string;
  action: string;
  /** `knop`: een button of submit-input, die stuurt zijn naam alleen als je erop klikt. */
  velden: { naam: string; regel: number; knop: boolean }[];
  /**
   * Velden die de controle niet ziet: een `{% include %}` of `{% block %}` in
   * het formulier, of een name met `{{ … }}`. Dan meldt hij geen ontbrekend
   * veld.
   */
  onzeker: boolean;
}

const MAP_VAN = (pad: string) => (pad.includes('/') ? pad.slice(0, pad.lastIndexOf('/') + 1) : '');

/**
 * Een map of bestand dat een Python-bestand noemt. De server zoekt vanaf de
 * map waarin hij gestart wordt, en dat is meestal die van main.py, maar met
 * main.py in `app/` en `static/` ernaast is het de projectmap. Eerst gaf dat
 * vijf valse meldingen; nu telt elk van de twee die bestaat.
 */
function opzoeken(files: ProjectFiles, pyPad: string, pad: string, map = false): string {
  const schoon = pad.replace(/^\.\//, '').replace(/\/$/, '');
  const opties = [`${MAP_VAN(pyPad)}${schoon}`, schoon];
  const bestaat = (o: string) =>
    map ? Object.keys(files).some((p) => p.startsWith(`${o}/`)) : o in files;
  return opties.find(bestaat) ?? opties[0];
}

// Per tekst één keer de regelbegins, en dan zoeken: eerst telde elke treffer
// opnieuw vanaf het begin van het bestand. samenhang() leegt de cache.
const begins = new Map<string, number[]>();

export function regelVan(tekst: string, index: number): number {
  let lijst = begins.get(tekst);
  if (!lijst) {
    lijst = regelBegins(tekst);
    begins.set(tekst, lijst);
  }
  return regelIn(lijst, index);
}

/**
 * HTML- en Jinja-commentaar wordt spaties, met behoud van posities: een
 * uitgecommentarieerd formulier of `{# {{ oud }} #}` gaf anders meldingen
 * over code die niet meer meedoet.
 */
function zonderCommentaar(files: ProjectFiles): ProjectFiles {
  return Object.fromEntries(
    Object.entries(files).map(([pad, f]) => [
      pad,
      f.kind === 'html' && f.content
        ? { ...f, content: f.content.replace(/<!--[\s\S]*?-->|\{#[\s\S]*?#\}/g, blanco) }
        : f,
    ]),
  );
}

/** De index van het haakje dat het haakje op `open` sluit, met strings overgeslagen. */
function sluitHaakje(tekst: string, open: number): number {
  const paren: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
  const stapel: string[] = [];
  for (let i = open; i < tekst.length; i++) {
    const c = tekst[i];
    if (c === '"' || c === "'") {
      const eind = tekst.indexOf(c, i + 1);
      if (eind === -1) return -1;
      i = eind;
    } else if (c === '#') {
      const eind = tekst.indexOf('\n', i);
      if (eind === -1) return -1;
      i = eind;
    } else if (paren[c]) stapel.push(paren[c]);
    else if (c === ')' || c === ']' || c === '}') {
      if (stapel.pop() !== c) return -1;
      if (stapel.length === 0) return i;
    }
  }
  return -1;
}

/** Splitst op komma's die niet tussen haakjes of in een string staan. */
function splitsArgumenten(tekst: string): { deel: string; start: number }[] {
  const uit: { deel: string; start: number }[] = [];
  let diepte = 0;
  let start = 0;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (c === '"' || c === "'") {
      const eind = tekst.indexOf(c, i + 1);
      i = eind === -1 ? tekst.length : eind;
    } else if ('([{'.includes(c)) diepte++;
    else if (')]}'.includes(c)) diepte--;
    else if (c === ',' && diepte === 0) {
      uit.push({ deel: tekst.slice(start, i), start });
      start = i + 1;
    }
  }
  uit.push({ deel: tekst.slice(start), start });
  return uit.filter((d) => d.deel.trim() !== '');
}

const ENKELVOUDIG =
  /^(str|int|float|bool|Optional\[(str|int|float|bool)\]|(str|int|float|bool) \| None|UploadFile)$/;

/** De formuliervelden uit de parameters van een functie, of null bij twijfel. */
function formVelden(params: string, paramsStart: number, tekst: string): Veld[] | null {
  const velden: Veld[] = [];
  for (const { deel, start } of splitsArgumenten(params)) {
    const p = deel.trim();
    // Een model uit Depends(...) of een body: welke velden dat zijn, weten
    // we niet. Eerst gaf `data: Bericht = Depends(Bericht.as_form)` voor
    // elk veld "komt nergens aan".
    if (/\b(Depends|Body)\(/.test(p)) return null;
    if (!/\b(Form|File)\(/.test(p)) continue;
    const m = p.match(/^(\w+)\s*:\s*(.+?)\s*(?:=\s*(.+))?$/s);
    if (!m) return null;
    const [, naam, typeTekst, standaard] = m;
    let type = typeTekst.trim();
    let verplicht: boolean;
    let formAanroep: string;
    if (type.startsWith('Annotated[')) {
      const binnen = type.match(/^Annotated\[\s*([^,]+?)\s*,\s*((?:Form|File)\(.*\))\s*\]$/s);
      if (!binnen) return null;
      type = binnen[1];
      formAanroep = binnen[2];
      verplicht = standaard === undefined;
    } else {
      if (!standaard || !/^(Form|File)\(/.test(standaard.trim())) return null;
      formAanroep = standaard.trim();
      const args = formAanroep.slice(formAanroep.indexOf('(') + 1, -1).trim();
      const eerste = splitsArgumenten(args)[0]?.deel.trim();
      verplicht = args === '' || eerste === '...' || (eerste?.includes('=') ?? false);
      if (/\bdefault\s*=/.test(args)) verplicht = false;
    }
    // Een model of lijst als formulier: welke velden dat zijn, weten we niet.
    if (!ENKELVOUDIG.test(type)) return null;
    const alias = formAanroep.match(/\balias\s*=\s*["']([^"']+)["']/);
    velden.push({
      naam: alias ? alias[1] : naam,
      verplicht,
      regel: regelVan(tekst, paramsStart + start + (deel.length - deel.trimStart().length)),
    });
  }
  return velden;
}

const GEEN_VELD = /^(Request|Response|BackgroundTasks|WebSocket)$/;

/** Gewone parameters zonder standaardwaarde: die zoekt FastAPI in de URL. */
function urlParams(
  params: string,
  paramsStart: number,
  tekst: string,
  pad: string,
): { naam: string; regel: number }[] {
  const uit: { naam: string; regel: number }[] = [];
  for (const { deel, start } of splitsArgumenten(params)) {
    const m = deel.trim().match(/^(\w+)\s*(?::\s*([^=]+?))?\s*$/);
    if (!m || m[1] === 'self' || pad.includes(`{${m[1]}`)) continue;
    const type = m[2]?.trim();
    if (type && (GEEN_VELD.test(type) || !ENKELVOUDIG.test(type))) continue;
    uit.push({
      naam: m[1],
      regel: regelVan(tekst, paramsStart + start + (deel.length - deel.trimStart().length)),
    });
  }
  return uit;
}

function routes(files: ProjectFiles): { routes: Route[]; zeker: boolean } {
  const uit: Route[] = [];
  let zeker = true;
  for (const f of Object.values(files)) {
    if (f.kind !== 'py' || !f.content) continue;
    const tekst = f.content;
    if (/\binclude_router\s*\(|\bAPIRouter\s*\(|\badd_api_route\s*\(/.test(tekst)) zeker = false;
    // Elke decorator moet een pad als tekst hebben: bij @app.api_route(…),
    // @app.get(path="/x") of @app.get(PAD) weet hij niet welke route het is,
    // en dan meldde hij valse 404's bij formulieren en links.
    const alle = tekst.match(/^@\w+\.(get|post|put|delete|patch|api_route)\(/gm)?.length ?? 0;
    const herkend = tekst.match(/^@\w+\.(get|post|put|delete|patch)\(\s*["']/gm)?.length ?? 0;
    if (alle !== herkend) zeker = false;
    const deco = /^@\w+\.(get|post|put|delete|patch)\(\s*(["'])(.*?)\2/gm;
    for (const m of tekst.matchAll(deco)) {
      const def = /^(?:async\s+)?def\s+(\w+)\s*\(/m;
      const rest = tekst.slice(m.index);
      const d = rest.match(def);
      if (!d || d.index === undefined) continue;
      const open = m.index + d.index + d[0].length - 1;
      const sluit = sluitHaakje(tekst, open);
      if (sluit === -1) continue;
      const params = tekst.slice(open + 1, sluit);
      // De body loopt tot de volgende regel die niet inspringt.
      const na = tekst.indexOf('\n', sluit);
      const volgende = na === -1 ? -1 : tekst.slice(na + 1).search(/^[^\s#]/m);
      const body =
        na === -1 ? '' : tekst.slice(na + 1, volgende === -1 ? undefined : na + 1 + volgende);
      const leestZelf = /\.form\(\)/.test(body);
      uit.push({
        methode: m[1].toUpperCase(),
        pad: m[3],
        functie: d[1],
        bestand: f.path,
        regel: regelVan(tekst, m.index + d.index),
        velden: leestZelf ? null : formVelden(params, open + 1, tekst),
        inUrl: urlParams(params, open + 1, tekst, m[3]),
        body,
        bodyStart: na + 1,
      });
    }
  }
  return { routes: uit, zeker };
}

/** Past een adres uit HTML bij een routepad met `{parameters}`? */
function past(adres: string, routepad: string): boolean {
  // Eén slash aan het eind maakt niet uit: FastAPI stuurt `/gastenboek/` met
  // een 307 door naar `/gastenboek`, en een POST blijft dan een POST.
  const zonderSlash = (pad: string) => (pad.length > 1 ? pad.replace(/\/$/, '') : pad);
  const a = zonderSlash(adres.split(/[?#]/)[0]).split('/');
  const r = zonderSlash(routepad).split('/');
  const stukPast = (deel: string, i: number) =>
    /^\{.+\}$/.test(deel) || deel === a[i] || a[i] === '\u0000';
  // {pad:path} pakt de rest van het adres, slashes inbegrepen.
  if (r.at(-1)?.match(/^\{\w+:path\}$/))
    return a.length >= r.length && r.slice(0, -1).every(stukPast);
  return a.length === r.length && r.every(stukPast);
}

/** Een adres met Jinja erin: elk `{{ … }}` wordt een joker voor één stuk pad. */
function adresMetJokers(adres: string): string | null {
  if (!adres.includes('{{')) return adres;
  const vervangen = adres.replace(/\{\{.*?\}\}/g, '\u0000');
  // Alleen als elk joker-stuk een heel padstuk is.
  return vervangen.split('/').every((d) => !d.includes('\u0000') || d === '\u0000')
    ? vervangen
    : null;
}

function attribuut(tag: string, naam: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${naam}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}

function formulieren(files: ProjectFiles): Formulier[] {
  const uit: Formulier[] = [];
  for (const f of Object.values(files)) {
    if (f.kind !== 'html' || !f.content) continue;
    const tekst = f.content;
    for (const m of tekst.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/gi)) {
      const tag = m[0].slice(0, m[0].indexOf('>') + 1);
      const action = attribuut(tag, 'action');
      if (action === undefined) continue;
      const binnenStart = (m.index ?? 0) + tag.length;
      const velden: Formulier['velden'] = [];
      let onzeker = /\{%/.test(m[1]);
      for (const v of m[1].matchAll(/<(input|textarea|select|button)\b[^>]*>/gi)) {
        const naam = attribuut(v[0], 'name');
        if (naam === undefined) continue;
        if (naam.includes('{')) {
          onzeker = true;
          continue;
        }
        const knop =
          v[1].toLowerCase() === 'button' ||
          /^(submit|image|reset)$/i.test(attribuut(v[0], 'type') ?? '');
        velden.push({ naam, regel: regelVan(tekst, binnenStart + (v.index ?? 0)), knop });
      }
      uit.push({
        bestand: f.path,
        regel: regelVan(tekst, m.index ?? 0),
        methode: (attribuut(tag, 'method') ?? 'get').toUpperCase(),
        action,
        velden,
        onzeker,
      });
    }
  }
  return uit;
}

const plek = (bestand: string, regel: number): Plek => ({ bestand, regel });

function controleerFormulieren(lijst: Route[], fouten: Samenhangfout[], files: ProjectFiles) {
  for (const form of formulieren(files)) {
    if (!form.action.startsWith('/') || form.action.startsWith('//')) continue;
    // Een HTML-formulier kent alleen get en post; een andere method stuurt de
    // browser als GET. Wie `hx-delete` kent, schrijft snel method="delete".
    if (form.methode !== 'GET' && form.methode !== 'POST') {
      fouten.push({
        titel: `Een formulier kan geen ${form.methode} sturen`,
        uitleg: `Een HTML-formulier kent alleen method="get" en method="post". Bij method="${form.methode.toLowerCase()}" stuurt de browser een GET naar ${form.action}, en een route met @app.${form.methode.toLowerCase()} krijgt dan 405 Method Not Allowed. Gebruik een formulier met method="post" en @app.post, of htmx met hx-${form.methode.toLowerCase()}.`,
        plekken: [plek(form.bestand, form.regel)],
      });
      continue;
    }
    const adres = adresMetJokers(form.action);
    if (adres === null) continue;
    const bijAdres = lijst.filter((r) => past(adres, r.pad));
    const route = bijAdres.find((r) => r.methode === form.methode);
    if (!route) {
      const ander = bijAdres[0];
      fouten.push(
        ander
          ? {
              titel: `Het formulier stuurt een ${form.methode}, de route kent alleen ${ander.methode}`,
              uitleg: `Het formulier verstuurt naar ${form.action} met method="${form.methode.toLowerCase()}", maar in Python staat daar alleen @app.${ander.methode.toLowerCase()}. De browser krijgt dan 405 Method Not Allowed. Maak de method in het formulier en de decorator in Python gelijk.`,
              plekken: [plek(form.bestand, form.regel), plek(ander.bestand, ander.regel)],
            }
          : {
              titel: `Het formulier stuurt naar ${form.action}, en die route bestaat niet`,
              uitleg: `Geen enkele functie in je Python-code hoort bij ${form.action}. Na het versturen krijgt de browser 404 Not Found. Controleer of de action in het formulier precies hetzelfde pad is als in @app.${form.methode.toLowerCase()}(...).`,
              plekken: [plek(form.bestand, form.regel)],
            },
      );
      continue;
    }
    if (form.methode !== 'POST' || route.velden === null) continue;
    const namen = new Set(form.velden.map((v) => v.naam));
    const params = new Set(route.velden.map((v) => v.naam));
    // Radioknoppen delen een naam: één melding per naam, niet per knop.
    const gemeld = new Set<string>();
    // Een veld waarvan de functie een gewone parameter heeft: `= Form(...)`
    // vergeten. FastAPI zoekt hem dan in de URL en geeft een 422; eerst zei
    // de melding dat het veld weggegooid werd.
    for (const v of form.velden) {
      const inUrl = route.inUrl.find((p) => p.naam === v.naam);
      if (!inUrl || params.has(v.naam) || gemeld.has(v.naam)) continue;
      gemeld.add(v.naam);
      fouten.push({
        titel: `${route.functie}() zoekt "${v.naam}" in de URL, niet in het formulier`,
        uitleg: `De parameter ${v.naam} heeft geen = Form(...) erachter. Dan zoekt FastAPI hem in de URL (?${v.naam}=…), vindt hem niet en weigert het verzoek met 422 Unprocessable Entity, met "query" in de melding. Zet = Form(...) achter de parameter.`,
        plekken: [plek(route.bestand, inUrl.regel), plek(form.bestand, v.regel)],
      });
    }
    for (const p of route.velden) {
      if (!p.verplicht || namen.has(p.naam) || form.onzeker) continue;
      fouten.push({
        titel: `De functie verwacht het veld "${p.naam}", het formulier stuurt het niet`,
        uitleg: `${route.functie}() heeft een parameter ${p.naam} met Form(...), maar het formulier heeft geen veld met name="${p.naam}". FastAPI weigert het verzoek dan met 422 Unprocessable Entity. Zet de name in het formulier en de parameter in Python gelijk.`,
        plekken: [plek(form.bestand, form.regel), plek(route.bestand, p.regel)],
      });
    }
    for (const v of form.velden) {
      // Een knop met een name (welke knop je koos) is geen fout als de
      // functie hem niet leest.
      if (v.knop || params.has(v.naam) || gemeld.has(v.naam)) continue;
      gemeld.add(v.naam);
      fouten.push({
        titel: `Het veld "${v.naam}" komt nergens aan`,
        uitleg: `Het formulier stuurt name="${v.naam}", maar ${route.functie}() heeft geen parameter ${v.naam} met Form(...). FastAPI gooit wat je daar invult weg, zonder melding.`,
        plekken: [plek(form.bestand, v.regel), plek(route.bestand, route.regel)],
      });
    }
  }
}

function controleerLinks(
  lijst: Route[] | null,
  fouten: Samenhangfout[],
  files: ProjectFiles,
  statisch: Statisch[],
  bestaat: (pad: string) => boolean,
) {
  const ingebouwd = ['/docs', '/redoc', '/openapi.json'];
  for (const f of Object.values(files)) {
    if (f.kind !== 'html' || !f.content) continue;
    const tekst = f.content;
    for (const m of tekst.matchAll(/<(a|link|img|script|source|video|audio|iframe)\b[^>]*>/gi)) {
      const attr = m[1].toLowerCase() === 'a' || m[1].toLowerCase() === 'link' ? 'href' : 'src';
      const doel = attribuut(m[0], attr);
      if (!doel?.startsWith('/') || doel.startsWith('//')) continue;
      const regel = regelVan(tekst, m.index ?? 0);
      const mount = statisch.find((s) => doel === s.prefix || doel.startsWith(`${s.prefix}/`));
      if (mount) {
        // Een berekende map (BASE_DIR / "static"): welk bestand erbij hoort,
        // weet hij niet. Het is wel een bestand en geen route.
        if (doel.includes('{') || mount.map === null) continue;
        // Een losse % (`100%.png`) laat decodeURI een URIError gooien, en dan
        // kwam er voor niemand een rapport. Zo'n link laat hij met rust.
        let rest: string;
        try {
          rest = decodeURI(doel.split(/[?#]/)[0].slice(mount.prefix.length + 1));
        } catch {
          continue;
        }
        const pad = `${mount.map}${rest}`;
        if (rest !== '' && !bestaat(pad)) {
          fouten.push({
            titel: `${doel} wijst naar een bestand dat er niet is`,
            uitleg: `Alles onder ${mount.prefix}/ haalt de server uit de map ${mount.map || '(hoofdmap)'}, maar ${pad} staat niet in je project. De browser krijgt 404 Not Found. Kijk naar de spelling en de hoofdletters van de map en het bestand.`,
            plekken: [plek(f.path, regel), plek(mount.bestand, mount.regel)],
          });
        }
        continue;
      }
      if (m[1].toLowerCase() !== 'a' || lijst === null) continue;
      const adres = adresMetJokers(doel);
      if (adres === null || ingebouwd.includes(adres.split(/[?#]/)[0])) continue;
      if (lijst.some((r) => r.methode === 'GET' && past(adres, r.pad))) continue;
      const ander = lijst.find((r) => past(adres, r.pad));
      if (ander) {
        fouten.push({
          titel: `De link naar ${doel} gaat naar een route die alleen ${ander.methode} kent`,
          uitleg: `Een link stuurt altijd een GET, maar bij ${doel.split(/[?#]/)[0]} staat alleen @app.${ander.methode.toLowerCase()}. Wie op de link klikt, krijgt 405 Method Not Allowed. Maak er een formulier met method="post" van, of zet een @app.get bij dat pad.`,
          plekken: [plek(f.path, regel), plek(ander.bestand, ander.regel)],
        });
        continue;
      }
      fouten.push({
        titel: `De link naar ${doel} heeft geen route`,
        uitleg: `Er is geen @app.get die bij ${doel.split(/[?#]/)[0]} hoort. Wie op de link klikt, krijgt 404 Not Found. Kijk of het pad in de link precies hetzelfde is als in Python.`,
        plekken: [plek(f.path, regel)],
      });
    }
  }
}

interface Statisch {
  prefix: string;
  /** De map in het project, of null als die berekend wordt (BASE_DIR / "static"). */
  map: string | null;
  bestand: string;
  regel: number;
}

/**
 * De StaticFiles-mounts. `zeker` is false als een mount een voorvoegsel heeft
 * dat geen letterlijke tekst is: dan kan elk pad een bestand zijn.
 */
function statischeMappen(files: ProjectFiles): { mappen: Statisch[]; zeker: boolean } {
  const mappen: Statisch[] = [];
  let zeker = true;
  for (const f of Object.values(files)) {
    if (f.kind !== 'py' || !f.content) continue;
    const tekst = f.content;
    for (const m of tekst.matchAll(/\.mount\(/g)) {
      const open = (m.index ?? 0) + m[0].length - 1;
      const sluit = sluitHaakje(tekst, open);
      if (sluit === -1) continue;
      const args = splitsArgumenten(tekst.slice(open + 1, sluit)).map((a) => a.deel.trim());
      const statisch = args.find((a) => /^(app\s*=\s*)?StaticFiles\(/.test(a));
      if (!statisch) continue;
      const prefix = args[0]?.match(/^["']([^"']*)["']$/)?.[1];
      if (prefix === undefined) {
        zeker = false;
        continue;
      }
      const dir =
        statisch.match(/\bdirectory\s*=\s*["']([^"']+)["']/)?.[1] ??
        statisch.match(/^(?:app\s*=\s*)?StaticFiles\(\s*["']([^"']+)["']/)?.[1];
      mappen.push({
        prefix: prefix.replace(/\/$/, ''),
        map: dir === undefined ? null : `${opzoeken(files, f.path, dir, true)}/`,
        bestand: f.path,
        regel: regelVan(tekst, m.index ?? 0),
      });
    }
  }
  return { mappen, zeker };
}

const JINJA_INGEBOUWD = new Set([
  'request',
  'url_for',
  'loop',
  'range',
  'true',
  'false',
  'none',
  'True',
  'False',
  'None',
  'super',
  'self',
  'caller',
  'varargs',
  'kwargs',
  'not',
  'dict',
  'lipsum',
  'cycler',
  'joiner',
  'namespace',
  'get_flashed_messages',
]);

/** De namen die een template uit zijn context leest, met hun regel; null bij twijfel. */
function templateNamen(tekst: string): { naam: string; regel: number }[] | null {
  if (/\{%-?\s*(macro|import|from|call)\b/.test(tekst)) return null;
  const lokaal = new Set<string>();
  for (const m of tekst.matchAll(/\{%-?\s*for\s+([\w\s,()]+?)\s+in\b/g))
    for (const n of m[1].match(/\w+/g) ?? []) lokaal.add(n);
  for (const m of tekst.matchAll(/\{%-?\s*(?:set|with)\s+(\w+)/g)) lokaal.add(m[1]);
  // Een naam in een {% if %} mag ontbreken: Jinja leest hem dan als niet
  // waar, zonder fout. `{% if fout %}<p>{{ fout }}</p>{% endif %}` met een
  // dictionary zonder fout is een gewoon patroon, geen vergissing.
  for (const m of tekst.matchAll(/\{%-?\s*(?:if|elif)\s+(?:not\s+)?([A-Za-z_]\w*)/g))
    lokaal.add(m[1]);
  const uit: { naam: string; regel: number }[] = [];
  const patronen = [/\{\{-?\s*([A-Za-z_]\w*)/g, /\{%-?\s*for\s+[\w\s,()]+?\s+in\s+([A-Za-z_]\w*)/g];
  for (const re of patronen)
    for (const m of tekst.matchAll(re)) {
      const naam = m[1];
      if (lokaal.has(naam) || JINJA_INGEBOUWD.has(naam)) continue;
      if (
        new RegExp(`\\b${naam}\\s+is\\s+(not\\s+)?defined|\\b${naam}\\s*\\|\\s*default\\b`).test(
          tekst,
        )
      )
        continue;
      uit.push({ naam, regel: regelVan(tekst, m.index ?? 0) });
    }
  return uit;
}

function controleerTemplates(
  lijst: Route[],
  fouten: Samenhangfout[],
  files: ProjectFiles,
  bestaat: (pad: string) => boolean,
) {
  for (const f of Object.values(files)) {
    if (f.kind !== 'py' || !f.content) continue;
    const tekst = f.content;
    const dir = tekst.match(/Jinja2Templates\(\s*directory\s*=\s*["']([^"']+)["']/);
    if (!dir) continue;
    const map = `${opzoeken(files, f.path, dir[1], true)}/`;
    for (const m of tekst.matchAll(/\bTemplateResponse\(/g)) {
      const open = (m.index ?? 0) + m[0].length - 1;
      const sluit = sluitHaakje(tekst, open);
      if (sluit === -1) continue;
      const args = splitsArgumenten(tekst.slice(open + 1, sluit)).map((a) => ({
        deel: a.deel.trim(),
        start: open + 1 + a.start + (a.deel.length - a.deel.trimStart().length),
      }));
      const regel = regelVan(tekst, m.index ?? 0);
      const naamArg = args.find((a) => /^(name\s*=\s*)?["'][^"']+["']$/.test(a.deel));
      if (!naamArg) continue;
      const naam = naamArg.deel.match(/["']([^"']+)["']/)?.[1] ?? '';
      const pad = `${map}${naam}`;
      const route = lijst.find(
        (r) =>
          r.bestand === f.path &&
          m.index !== undefined &&
          m.index >= r.bodyStart &&
          m.index < r.bodyStart + r.body.length,
      );
      const waar = route ? `${route.functie}()` : 'Python';
      const template = files[pad];
      if (!template && !bestaat(pad)) {
        fouten.push({
          titel: `Het template ${naam} bestaat niet`,
          uitleg: `${waar} vraagt om ${naam}, maar ${pad} staat niet in je project. De server geeft dan een foutmelding en de browser toont 500 Internal Server Error. Kijk of het bestand in de map ${map.replace(/\/$/, '')} staat, met precies deze naam.`,
          plekken: [plek(f.path, regel)],
        });
        continue;
      }
      // De context: alleen een dictionary dat hier letterlijk staat.
      const ctxArg = args.find((a) => /^(context\s*=\s*)?\{/.test(a.deel));
      if (!ctxArg || !template?.content) continue;
      const dict = ctxArg.deel.replace(/^context\s*=\s*/, '');
      const binnen = dict.slice(1, sluitHaakje(dict, 0));
      const sleutels = new Set<string>();
      let zeker = true;
      for (const { deel } of splitsArgumenten(binnen)) {
        const s = deel.trim().match(/^["'](\w+)["']\s*:/);
        if (s) sleutels.add(s[1]);
        else zeker = false; // **andere, of een sleutel uit een variabele
      }
      if (!zeker) continue;
      const namen = templateNamen(template.content);
      if (namen === null) continue;
      const gemeld = new Set<string>();
      for (const n of namen) {
        if (sleutels.has(n.naam) || gemeld.has(n.naam)) continue;
        gemeld.add(n.naam);
        const voorbeeld = [...sleutels][0];
        fouten.push({
          titel: `Het template gebruikt ${n.naam}, het dictionary geeft het niet mee`,
          uitleg: `${naam} leest ${n.naam}, maar ${waar} geeft ${sleutels.size === 0 ? 'een leeg dictionary mee' : `alleen ${[...sleutels].join(', ')} mee`}. Dan blijft die plek leeg, of geeft de pagina een foutmelding. Geef in het dictionary een sleutel "${n.naam}" mee${voorbeeld ? `, of gebruik in het template de naam ${voorbeeld}` : ''}.`,
          plekken: [plek(template.path, n.regel), plek(f.path, regelVan(tekst, ctxArg.start))],
        });
      }
    }
  }
}

function controleerBestandsantwoorden(
  fouten: Samenhangfout[],
  files: ProjectFiles,
  bestaat: (pad: string) => boolean,
) {
  for (const f of Object.values(files)) {
    if (f.kind !== 'py' || !f.content) continue;
    // Alleen een pad dat helemaal tekst is: bij "static/pages/" + naam is de
    // tekst maar het begin van het pad.
    for (const m of f.content.matchAll(/\bFileResponse\(\s*["']([^"']+)["']\s*[,)]/g)) {
      const pad = opzoeken(files, f.path, m[1]);
      if (bestaat(pad)) continue;
      fouten.push({
        titel: `FileResponse wijst naar ${m[1]}, en dat bestand is er niet`,
        uitleg: `De server zoekt ${m[1]} vanaf de map waarin je main.py staat, en vindt het niet. De browser krijgt dan een foutmelding. Kijk naar de map, de spelling en de hoofdletters.`,
        plekken: [plek(f.path, regelVan(f.content, m.index ?? 0))],
      });
    }
  }
}

/**
 * Een RedirectResponse naar een pad waar geen enkele route bij hoort. Dat
 * patroon staat vanaf Doorsturen na opslaan in elke stand van main.py; een
 * tikfout geeft na het opslaan een 404, terwijl het bericht wel bewaard is.
 */
function controleerDoorsturen(lijst: Route[], fouten: Samenhangfout[], files: ProjectFiles) {
  for (const f of Object.values(files)) {
    if (f.kind !== 'py' || !f.content) continue;
    const doorsturen = /\bRedirectResponse\(\s*(?:url\s*=\s*)?["'](\/[^"'?#]*)[^"']*["']/g;
    for (const m of f.content.matchAll(doorsturen)) {
      const adres = m[1];
      if (adres.startsWith('//') || lijst.some((r) => past(adres, r.pad))) continue;
      fouten.push({
        titel: `RedirectResponse stuurt door naar ${adres}, en die route bestaat niet`,
        uitleg: `Na dit antwoord vraagt de browser ${adres} op, maar geen functie in je Python-code hoort bij dat pad. De bezoeker krijgt dan 404 Not Found, ook als het opslaan wel gelukt is. Kijk of het pad precies hetzelfde is als in een @app.get(...).`,
        plekken: [plek(f.path, regelVan(f.content, m.index ?? 0))],
      });
    }
  }
}

/**
 * Een naam uit de tabel (src/checker/imports.ts) die main.py gebruikt zonder
 * hem te importeren. Dan start de server niet, met een NameError in de
 * terminal: de fout waar leerlingen het vaakst op vastliepen. Met rust laten:
 * een `import *`, een naam die het bestand zelf maakt (def, class, een
 * toekenning of een parameter), en `fastapi.Form` met de module ervoor.
 */
function controleerImports(fouten: Samenhangfout[], files: ProjectFiles) {
  for (const f of Object.values(files)) {
    if (f.kind !== 'py' || !f.content) continue;
    const tekst = f.content;
    if (/^\s*from [\w.]+ import \*/m.test(tekst)) continue;
    const binnen = geimporteerd(tekst);
    for (const [naam, index] of gebruikt(tekst)) {
      if (binnen.has(naam)) continue;
      const zelf = new RegExp(
        `^\\s*(?:async\\s+)?(?:def|class)\\s+${naam}\\b|^\\s*${naam}\\s*=[^=]|[(,]\\s*${naam}\\s*[:=,)]`,
        'm',
      );
      if (zelf.test(tekst)) continue;
      const module = IMPORT_VAN[naam];
      const regel = [
        ...tekst.matchAll(
          new RegExp(`^from ${module.replace('.', '\\.')} import ([\\w ,]+)$`, 'gm'),
        ),
      ][0];
      const wat = regel
        ? `Zet ${naam} in je regel \`${regel[0]}\`, met een komma ertussen.`
        : `Zet bovenaan je bestand: \`${importRegel(naam)}\`.`;
      fouten.push({
        titel: `${naam} wordt gebruikt, maar staat niet bij de imports`,
        uitleg: `Python kent ${naam} pas als je hem importeert. Zonder import start de server niet, of geeft hij bij het eerste verzoek een 500, met in de terminal NameError: name '${naam}' is not defined. ${wat}`,
        plekken: [plek(f.path, regelVan(tekst, index))],
      });
    }
  }
}

/**
 * @param project de bestanden van de leerling
 * @param alle ook de bibliotheken (`htmx.min.js` in static/): die zijn niet
 *   van de leerling, maar een link ernaar is geen kapotte link. Eerst gaf elk
 *   project met de htmx-uitbreiding een valse 404.
 */
export function samenhang(project: ProjectFiles, alle: ProjectFiles = project): Samenhangfout[] {
  begins.clear();
  const files = zonderCommentaar(project);
  const fouten: Samenhangfout[] = [];
  const bestaat = (pad: string) => pad in files || pad in alle;
  const { routes: lijst, zeker } = routes(files);
  if (lijst.length > 0 && zeker) {
    controleerFormulieren(lijst, fouten, files);
    controleerDoorsturen(lijst, fouten, files);
  }
  // Zonder routes (alleen HTML, of een router met prefix) weet hij niet
  // welke links goed zijn; static-bestanden kan hij dan nog wel nalopen.
  // Een StaticFiles op `/` serveert elk pad dat geen route heeft: welke link
  // dan een bestand of een route is, weet hij niet, dus die links laat hij
  // met rust. De andere mounts loopt hij gewoon na.
  // Alleen main.py geüpload (via Kies bestanden): dan ontbreekt elk
  // template en elk bestand, en dat zijn geen fouten van de leerling. Eerst
  // gaf dat twaalf meldingen. Zonder één HTML-bestand slaat hij die over.
  // Losse bestanden (Kies bestanden, zonder map of zip) hebben geen mappen:
  // dan ontbreekt elk static-bestand en elk template op zijn plek, terwijl
  // ze net geüpload zijn. Die controles slaat hij dan over; de pagina zegt
  // dat de leerling zijn projectmap moet kiezen.
  const metMappen = Object.keys(alle).some((p) => p.includes('/'));
  const metHtml = metMappen && Object.values(files).some((f) => f.kind === 'html');
  const { mappen, zeker: mountsZeker } = statischeMappen(files);
  const opWortel = mappen.some((m) => m.prefix === '');
  if (metHtml) {
    controleerLinks(
      lijst.length > 0 && zeker && mountsZeker && !opWortel ? lijst : null,
      fouten,
      files,
      mappen.filter((m) => m.prefix !== ''),
      bestaat,
    );
    controleerTemplates(lijst, fouten, files, bestaat);
    controleerBestandsantwoorden(fouten, files, bestaat);
  }
  controleerImports(fouten, files);
  begins.clear();
  // Twee keer dezelfde fout op dezelfde plek (een link die twee keer op een
  // regel staat) is één melding; eerst kregen ze in het rapport ook dezelfde
  // React-key.
  const gezien = new Set<string>();
  return fouten.filter((f) => {
    const sleutel = `${f.titel}|${f.plekken.map((p) => `${p.bestand}:${p.regel}`).join(',')}`;
    if (gezien.has(sleutel)) return false;
    gezien.add(sleutel);
    return true;
  });
}
