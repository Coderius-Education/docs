// Balk boven de les zolang een klas actief is: terug naar de klaspagina, of de
// klasweergave verlaten. Ook in cursussen die niet in de klas staan, zodat een
// leerling altijd de weg terug vindt.

import Main from '@theme-init/DocRoot/Layout/Main';
import React from 'react';
import { useKlas, verlaatKlas } from '../../../../klas/useKlas';

function KlasBalk() {
  const { klas } = useKlas();
  if (!klas) return null;
  return (
    <div className="coderius-klasbalk" role="note">
      <span>
        Je kijkt als klas <strong>{klas.naam}</strong>
      </span>
      {/* Gewone <a>: de klaspagina staat buiten de baseUrl van deze cursus. */}
      <a href={`/klas/${klas.code}`}>Naar de klaspagina</a>
      <button type="button" onClick={() => verlaatKlas(klas.code)}>
        Verlaten
      </button>
    </div>
  );
}

export default function MainMetKlas(props) {
  return (
    <Main {...props}>
      <KlasBalk />
      {props.children}
    </Main>
  );
}
