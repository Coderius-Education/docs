import { maakOpslag } from '@coderius/shared/oefenveld/opslag';

// De opslag van de speeltuinen in de lessen: wat een leerling in een veld
// typt, blijft bewaard in zijn browser, zoals bij de oefenvelden van web en
// python (packages/shared/oefenveld). Eén database voor de hele cursus; een
// veld vindt zijn werk met het pad van de les, de vingerafdruk van zijn
// startcode en het hoeveelste veld met die startcode het is.
export const opslag = maakOpslag({ site: 'play', naam: 'oefenvelden', delen: ['code'] });
