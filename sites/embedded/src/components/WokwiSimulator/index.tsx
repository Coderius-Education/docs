import BrowserOnly from '@docusaurus/BrowserOnly';
import React, { useState } from 'react';
import styles from './styles.module.css';

interface WokwiSimulatorProps {
  /** Wokwi project URL of ID */
  projectUrl: string;
  /** Hoogte van de simulator-iframe */
  height?: number;
  /** Optionele titel boven de simulator */
  title?: string;
}

function WokwiSimulatorInner({ projectUrl, height = 500, title }: WokwiSimulatorProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  // Normaliseer URL: als het alleen een ID is, bouw de volledige URL
  const url = projectUrl.startsWith('http')
    ? projectUrl
    : `https://wokwi.com/projects/${projectUrl}`;

  if (!showSimulator) {
    return (
      <div className={styles.placeholder}>
        <div className={styles.placeholderContent}>
          <div className={styles.icon}>🔌</div>
          <h3>{title || 'Wokwi Simulator'}</h3>
          <p>
            Simuleer het circuit direct in je browser. Je kunt de code aanpassen en het resultaat
            live zien — zonder hardware.
          </p>
          <button className={styles.launchButton} onClick={() => setShowSimulator(true)}>
            ▶ Start Simulator
          </button>
          <a className={styles.externalLink} href={url} target="_blank" rel="noopener noreferrer">
            Open in Wokwi ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {title && <div className={styles.header}>{title}</div>}
      {!isLoaded && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Simulator wordt geladen...</p>
        </div>
      )}
      <iframe
        src={url}
        className={styles.iframe}
        style={{ height, opacity: isLoaded ? 1 : 0 }}
        onLoad={() => setIsLoaded(true)}
        allow="cross-origin-isolated"
        title={title || 'Wokwi Simulator'}
      />
    </div>
  );
}

export default function WokwiSimulator(props: WokwiSimulatorProps) {
  return (
    <BrowserOnly
      fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Simulator laden...</div>}
    >
      {() => <WokwiSimulatorInner {...props} />}
    </BrowserOnly>
  );
}
