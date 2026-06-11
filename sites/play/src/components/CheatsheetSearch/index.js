import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

export default function CheatsheetSearch() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const q = query.toLowerCase().trim();

    document.querySelectorAll('[data-cheatsheet-grid]').forEach(grid => {
      const items = grid.querySelectorAll('details');
      let visible = 0;
      items.forEach(d => {
        const text = d.querySelector('summary')?.textContent?.toLowerCase() || '';
        const match = !q || text.includes(q);
        d.style.display = match ? '' : 'none';
        if (match) visible++;
      });

      const hidden = q && visible === 0;
      grid.style.display = hidden ? 'none' : '';

      // Hide the section heading (h2) when no items match
      let el = grid.previousElementSibling;
      while (el && el.tagName !== 'H2') el = el.previousElementSibling;
      if (el?.tagName === 'H2') el.style.display = hidden ? 'none' : '';
    });
  }, [query]);

  return (
    <div className={styles.wrap}>
      <input
        className={styles.input}
        type="search"
        placeholder="Zoek in cheatsheet..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        autoComplete="off"
      />
    </div>
  );
}
