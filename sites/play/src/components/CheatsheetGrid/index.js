import React from 'react';
import styles from './styles.module.css';

export default function CheatsheetGrid({ children }) {
  return <div className={styles.grid} data-cheatsheet-grid="">{children}</div>;
}
