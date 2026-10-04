import OriginalCodeBlock from '@theme-original/CodeBlock';
import type { ComponentProps, ReactNode } from 'react';
import { wilRegelnummers } from './metastring';

// Elk python-codeblok krijgt regelnummers, zodat een leerling en de docent
// dezelfde regel kunnen aanwijzen ("kijk naar regel 3"). Opt-out per blok met
// de meta ```python geen-regelnummers. Blokken zonder taal (de tekstuele
// visualisaties in de concept-lessen) blijven kaal.

type Props = ComponentProps<typeof OriginalCodeBlock> & {
  children?: ReactNode;
  metastring?: string;
};

export default function CodeBlock(props: Props): ReactNode {
  if (props.showLineNumbers !== undefined || !wilRegelnummers(props.className, props.metastring)) {
    return <OriginalCodeBlock {...props} />;
  }
  return <OriginalCodeBlock {...props} showLineNumbers />;
}
