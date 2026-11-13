// De kop van een kaart op een overzichtspagina (een categorie, de challenges
// van ctf), zonder het icoon dat Docusaurus ervoor zet: een emoji (📄, 🗃,
// 🔗). De schrijfgids wil geen emoji, ook niet in de opmaak van de site.
// Een emoji die een auteur zelf in een label zet, blijft staan: die haalt
// Docusaurus er al uit voordat hij hier komt, en dan is hij een keuze.
//
// Een site die DocCard/Heading zelf swizzlet, schaduwt deze wikkel;
// klas.test.ts bewaakt dat.

import DocCardHeading from '@theme-init/DocCard/Heading';
import React from 'react';

export default function KopZonderIcoon(props) {
  return <DocCardHeading {...props} icon={undefined} />;
}
