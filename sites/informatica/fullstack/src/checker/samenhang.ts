import type { Plek, ProjectFiles, Samenhangfout } from '@coderius/checker/types';

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
  velden: { naam: string; regel: number }[];
}

const MAP_VAN = (pad: string) => (pad.includes('/') ? pad.slice(0, pad.lastIndexOf('/') + 1) : '');

export function regelVan(tekst: string, index: number): number {
  let n = 1;
  for (let i = 0; i < index && i < tekst.length; i++) if (tekst[i] === '\n') n++;
  return n;
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

function routes(files: ProjectFiles): { routes: Route[]; zeker: boolean } {
  const uit: Route[] = [];
  let zeker = true;
  for (const f of Object.values(files)) {
    if (f.kind !== 'py' || !f.content) continue;
    const tekst = f.content;
    if (/\binclude_router\s*\(|\bAPIRouter\s*\(/.test(tekst)) zeker = false;
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
      const velden: { naam: string; regel: number }[] = [];
      for (const v of m[1].matchAll(/<(input|textarea|select|button)\b[^>]*>/gi)) {
        const naam = attribuut(v[0], 'name');
        if (naam === undefined || naam.includes('{')) continue;
        velden.push({ naam, regel: regelVan(tekst, binnenStart + (v.index ?? 0)) });
      }
      uit.push({
        bestand: f.path,
        regel: regelVan(tekst, m.index ?? 0),
        methode: (attribuut(tag, 'method') ?? 'get').toUpperCase(),
        action,
        velden,
      });
    }
  }
  return uit;
}

const plek = (bestand: string, regel: number): Plek => ({ bestand, regel });

function controleerFormulieren(lijst: Route[], fouten: Samenhangfout[], files: ProjectFiles) {
  for (const form of formulieren(files)) {
    if (!form.action.startsWith('/') || form.action.startsWith('//')) continue;
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
    for (const p of route.velden) {
      if (!p.verplicht || namen.has(p.naam)) continue;
      fouten.push({
        titel: `De functie verwacht het veld "${p.naam}", het formulier stuurt het niet`,
        uitleg: `${route.functie}() heeft een parameter ${p.naam} met Form(...), maar het formulier heeft geen veld met name="${p.naam}". FastAPI weigert het verzoek dan met 422 Unprocessable Entity. Zet de name in het formulier en de parameter in Python gelijk.`,
        plekken: [plek(form.bestand, form.regel), plek(route.bestand, p.regel)],
      });
    }
    for (const v of form.velden) {
      if (params.has(v.naam)) continue;
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
        if (doel.includes('{')) continue;
        // Een losse % (`100%.png`) laat decodeURI een URIError gooien, en dan
        // kwam er voor niemand een rapport. Zo'n link laat hij met rust.
        let rest: string;
        try {
          rest = decodeURI(doel.split(/[?#]/)[0].slice(mount.prefix.length + 1));
        } catch {
          continue;
        }
        const pad = `${mount.map}${rest}`;
        if (rest !== '' && !(pad in files)) {
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
  map: string;
  bestand: string;
  regel: number;
}

function statischeMappen(files: ProjectFiles): Statisch[] {
  const uit: Statisch[] = [];
  for (const f of Object.values(files)) {
    if (f.kind !== 'py' || !f.content) continue;
    const re =
      /\.mount\(\s*["']([^"']+)["']\s*,\s*StaticFiles\(\s*directory\s*=\s*["']([^"']+)["']/g;
    for (const m of f.content.matchAll(re)) {
      const map = m[2].replace(/^\.\//, '').replace(/\/$/, '');
      uit.push({
        prefix: m[1].replace(/\/$/, ''),
        map: `${MAP_VAN(f.path)}${map}/`,
        bestand: f.path,
        regel: regelVan(f.content, m.index ?? 0),
      });
    }
  }
  return uit;
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

function controleerTemplates(lijst: Route[], fouten: Samenhangfout[], files: ProjectFiles) {
  for (const f of Object.values(files)) {
    if (f.kind !== 'py' || !f.content) continue;
    const tekst = f.content;
    const dir = tekst.match(/Jinja2Templates\(\s*directory\s*=\s*["']([^"']+)["']/);
    if (!dir) continue;
    const map = `${MAP_VAN(f.path)}${dir[1].replace(/^\.\//, '').replace(/\/$/, '')}/`;
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
      if (!template) {
        fouten.push({
          titel: `Het template ${naam} bestaat niet`,
          uitleg: `${waar} vraagt om ${naam}, maar ${pad} staat niet in je project. De server geeft dan een foutmelding en de browser toont 500 Internal Server Error. Kijk of het bestand in de map ${map.replace(/\/$/, '')} staat, met precies deze naam.`,
          plekken: [plek(f.path, regel)],
        });
        continue;
      }
      // De context: alleen een dictionary dat hier letterlijk staat.
      const ctxArg = args.find((a) => /^(context\s*=\s*)?\{/.test(a.deel));
      if (!ctxArg || !template.content) continue;
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

function controleerBestandsantwoorden(fouten: Samenhangfout[], files: ProjectFiles) {
  for (const f of Object.values(files)) {
    if (f.kind !== 'py' || !f.content) continue;
    for (const m of f.content.matchAll(/\bFileResponse\(\s*["']([^"']+)["']/g)) {
      const pad = `${MAP_VAN(f.path)}${m[1].replace(/^\.\//, '')}`;
      if (pad in files) continue;
      fouten.push({
        titel: `FileResponse wijst naar ${m[1]}, en dat bestand is er niet`,
        uitleg: `De server zoekt ${m[1]} vanaf de map waarin je main.py staat, en vindt het niet. De browser krijgt dan een foutmelding. Kijk naar de map, de spelling en de hoofdletters.`,
        plekken: [plek(f.path, regelVan(f.content, m.index ?? 0))],
      });
    }
  }
}

export function samenhang(files: ProjectFiles): Samenhangfout[] {
  const fouten: Samenhangfout[] = [];
  const { routes: lijst, zeker } = routes(files);
  if (lijst.length > 0 && zeker) {
    controleerFormulieren(lijst, fouten, files);
  }
  // Zonder routes (alleen HTML, of een router met prefix) weet hij niet
  // welke links goed zijn; static-bestanden kan hij dan nog wel nalopen.
  // Een StaticFiles op `/` serveert elk pad dat geen route heeft: welke link
  // dan een bestand of een route is, weet hij niet, dus die links laat hij
  // met rust. De andere mounts loopt hij gewoon na.
  const mappen = statischeMappen(files);
  const opWortel = mappen.some((m) => m.prefix === '');
  controleerLinks(
    lijst.length > 0 && zeker && !opWortel ? lijst : null,
    fouten,
    files,
    mappen.filter((m) => m.prefix !== ''),
  );
  controleerTemplates(lijst, fouten, files);
  controleerBestandsantwoorden(fouten, files);
  return fouten;
}
