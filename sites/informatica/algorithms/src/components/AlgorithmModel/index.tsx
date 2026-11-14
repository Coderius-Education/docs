import useBaseUrl from '@docusaurus/useBaseUrl';
import type React from 'react';
import Model, { type AlgorithmModelProps } from './Model';

/** Het interactieve model; de opbouw en de maten staan in Model.tsx. */
export default function AlgorithmModel(props: AlgorithmModelProps): React.ReactElement {
  return <Model {...props} pyodideIndexURL={useBaseUrl('/pyodide/')} />;
}
