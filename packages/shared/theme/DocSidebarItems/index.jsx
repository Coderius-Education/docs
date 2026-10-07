// Wikkel om de sidebar-items van de klassieke theme: met een actieve klas toont
// de bovenste laag alleen de hoofdstukken die de docent wil, in zijn volgorde.
// Dieper ingrijpen doen we niet. Verborgen is alleen uit de navigatie; zie
// klas/index.js.
//
// Een site die zelf DocSidebarItems swizzlet, schaduwt deze wikkel; een test
// in packages/shared bewaakt dat.

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DocSidebarItems from '@theme-init/DocSidebarItems';
import React, { useEffect, useMemo } from 'react';
import { pasKlasToe } from '../../klas';
import { markeerKlaar, useKlas } from '../../klas/useKlas';

function BovensteLaag(props) {
  const { siteConfig } = useDocusaurusContext();
  const siteId = siteConfig.customFields?.siteId;
  const { klaar, klas } = useKlas();
  const instelling = klas?.cursussen?.[siteId];
  const items = useMemo(
    () => (instelling ? pasKlasToe(props.items, instelling) : props.items),
    [props.items, instelling],
  );
  useEffect(() => {
    if (klaar) markeerKlaar();
  }, [klaar]);
  return <DocSidebarItems {...props} items={items} />;
}

export default function DocSidebarItemsMetKlas(props) {
  if (props.level !== 1) return <DocSidebarItems {...props} />;
  return <BovensteLaag {...props} />;
}
