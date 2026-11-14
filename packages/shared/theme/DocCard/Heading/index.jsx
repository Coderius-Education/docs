// De kop van een kaart op een overzichtspagina (een categorie, de challenges
// van ctf), zonder het icoon dat Docusaurus ervoor zet: een emoji (📄, 🗃,
// 🔗). De schrijfgids wil geen emoji, ook niet in de opmaak van de site.
// Wat Docusaurus als icoon uit het label haalde (ook het nummer van
// "3. Acties"), komt terug in de titel (titel.jsx).
//
// Een site die DocCard/Heading zelf swizzlet, schaduwt deze wikkel;
// klas.test.ts bewaakt dat.

import DocCardHeading from '@theme-init/DocCard/Heading';
import React from 'react';
import { kaartTitel } from './titel';

export default function KopZonderIcoon(props) {
  return (
    <DocCardHeading
      {...props}
      title={kaartTitel(props.item, props.title, props.icon)}
      icon={undefined}
    />
  );
}
