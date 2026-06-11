import React from 'react';
import styles from './CodeEditor.module.css';

interface PreviewPaneProps {
  srcDoc: string;
}

export function PreviewPane({ srcDoc }: PreviewPaneProps) {
  return (
    <div className={styles.previewSide}>
      <div className={styles.previewLabel}>Voorbeeld</div>
      <iframe
        className={styles.preview}
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-modals"
        title="Code voorbeeld"
      />
    </div>
  );
}
