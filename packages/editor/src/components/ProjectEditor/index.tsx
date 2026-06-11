import BrowserOnly from '@docusaurus/BrowserOnly';
import type { ReactNode } from 'react';
import type { RunnerId } from '../../runners/types';
import type { ProjectTemplate } from '../../vfs/types';

export interface ProjectEditorProps {
  // Welke runners aangeboden worden bij "Nieuw project".
  runners?: RunnerId[];
  // Namespace voor de IndexedDB-opslag.
  storagePrefix?: string;
  // Extra projecttemplates naast de ingebouwde.
  templates?: ProjectTemplate[];
  height?: string;
}

export default function ProjectEditor(props: ProjectEditorProps): ReactNode {
  return (
    <BrowserOnly fallback={<div style={{ padding: '1rem' }}>Editor laden…</div>}>
      {() => {
        const Impl = require('./ProjectEditorImpl').default;
        return <Impl {...props} />;
      }}
    </BrowserOnly>
  );
}
