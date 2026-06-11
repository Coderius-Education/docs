import React, { useState } from 'react';
import { progressData } from '@site/src/data/progress';

const SkillRadar = () => {
  const [currentIndex, setCurrentIndex] = useState(progressData.length - 1);
  const data = progressData[currentIndex];
  const concepts = Object.keys(data.levels);
  const values = Object.values(data.levels);
  
  const size = 400;
  const center = size / 2;
  const radius = size * 0.4;
  const totalLevels = 10;

  const getCoordinates = (index, value) => {
    const angle = (Math.PI * 2 * index) / concepts.length - Math.PI / 2;
    const r = (radius * value) / totalLevels;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const points = values
    .map((v, i) => {
      const { x, y } = getCoordinates(i, v);
      return `${x},${y}`;
    })
    .join(' ');

  // Background circles
  const circles = [0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
    <circle
      key={scale}
      cx={center}
      cy={center}
      r={radius * scale}
      fill="none"
      stroke="var(--ifm-color-emphasis-300)"
      strokeWidth="1"
      strokeDasharray="4 4"
    />
  ));

  // Axis lines
  const axes = concepts.map((_, i) => {
    const { x, y } = getCoordinates(i, totalLevels);
    return (
      <line
        key={i}
        x1={center}
        y1={center}
        x2={x}
        y2={y}
        stroke="var(--ifm-color-emphasis-300)"
        strokeWidth="1"
      />
    );
  });

  // Labels
  const labels = concepts.map((concept, i) => {
    const { x, y } = getCoordinates(i, totalLevels + 1.5);
    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--ifm-color-content)"
        style={{ fontSize: '14px', fontWeight: 'bold' }}
      >
        {concept}
      </text>
    );
  });

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="tutorial-select" style={{ marginRight: '10px' }}>
          Bekijk niveau na:
        </label>
        <select
          id="tutorial-select"
          value={currentIndex}
          onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid var(--ifm-color-primary)',
            backgroundColor: 'var(--ifm-background-color)',
            color: 'var(--ifm-color-content)',
          }}
        >
          {progressData.map((d, i) => (
            <option key={i} value={i}>
              {d.tutorial}
            </option>
          ))}
        </select>
      </div>

      <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`}>
        {circles}
        {axes}
        <polygon
          points={points}
          fill="rgba(53, 120, 229, 0.4)"
          stroke="var(--ifm-color-primary)"
          strokeWidth="3"
        />
        {values.map((v, i) => {
          const { x, y } = getCoordinates(i, v);
          return <circle key={i} cx={x} cy={y} r="4" fill="var(--ifm-color-primary)" />;
        })}
        {labels}
      </svg>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--ifm-color-emphasis-100)', borderRadius: '8px' }}>
        <h3>Details: {data.tutorial}</h3>
        <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0 }}>
          {concepts.map((c, i) => (
            <li key={i} style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{c}</span>
              <span style={{ fontWeight: 'bold' }}>Niveau {data.levels[c]} / 10</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SkillRadar;
