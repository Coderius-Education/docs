// De paginator onder een les (Vorige en Volgende van Docusaurus), met de
// vorige en de volgende les erbij voor de tabbladen: op een les met
// tabbladen staan die knoppen in de rij onderaan het tabblad, en is deze
// paginator verborgen (de opmaak van LesTabs). Zie components/LesTabs/buren.ts.
//
// Een site die DocPaginator zelf swizzlet, schaduwt deze wikkel;
// klas.test.ts bewaakt dat.

import DocPaginator from '@theme-init/DocPaginator';
import React, { useEffect } from 'react';
import { zetBuren } from '../../components/LesTabs/buren';

const buur = (link) => (link ? { titel: link.title, adres: link.permalink } : undefined);

export default function PaginatorMetBuren(props) {
  const { previous, next } = props;
  useEffect(() => {
    zetBuren({ vorige: buur(previous), volgende: buur(next) });
    return () => zetBuren({});
  }, [previous, next]);
  return <DocPaginator {...props} />;
}
