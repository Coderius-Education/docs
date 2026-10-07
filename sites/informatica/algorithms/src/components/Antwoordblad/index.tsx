import type React from 'react';

// Het antwoordblad van een hand-out: op het scherm dicht, op papier de losse
// laatste pagina. Een kale <details>, geen MDX-<details>: Docusaurus vervangt
// die door zijn eigen Details-component met een React-state en een
// inklap-animatie, en die negeert `open` dat de Handout-component bij
// beforeprint op het element zet. Zo printte het blad leeg.
export default function Antwoordblad({
  titel,
  children,
}: {
  titel: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <details className="handout-paginawissel handout-antwoorden">
      <summary>{titel}</summary>
      {children}
    </details>
  );
}
