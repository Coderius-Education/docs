import BrowserOnly from '@docusaurus/BrowserOnly';
import React from 'react';
import styles from './TryButton.module.css';
import { useCodeRunner } from './context';
import { detectMode } from './engine';

function TryButtonInner({ code, mode }) {
  const { openWithCode } = useCodeRunner();

  function handleClick() {
    openWithCode(code, mode || detectMode(code));
  }

  return (
    <button type="button" onClick={handleClick} className={styles.tryButton}>
      &#x25B6; Probeer in browser
    </button>
  );
}

export default function TryButton(props) {
  return <BrowserOnly fallback={null}>{() => <TryButtonInner {...props} />}</BrowserOnly>;
}
