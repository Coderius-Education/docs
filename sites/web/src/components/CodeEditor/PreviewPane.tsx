import type React from 'react';
import styles from './CodeEditor.module.css';

interface PreviewPaneProps {
  srcDoc: string;
  /** Vaste hoogte voor de iframe (gestapelde vorm, gemeten aan de inhoud);
   *  zonder deze prop vult de iframe de kolom (flex). */
  hoogte?: string;
  innerRef?: React.Ref<HTMLIFrameElement>;
}

export function PreviewPane({ srcDoc, hoogte, innerRef }: PreviewPaneProps) {
  return (
    <div className={styles.previewSide}>
      <div className={styles.previewLabel}>Voorbeeld</div>
      <iframe
        ref={innerRef}
        className={styles.preview}
        style={hoogte ? { height: hoogte, flex: 'none' } : undefined}
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-modals"
        title="Code voorbeeld"
      />
    </div>
  );
}
