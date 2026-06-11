import React, { useState } from 'react';
import { progressData } from '@site/src/data/progress';

const SkillGraph = () => {
  const concepts = Object.keys(progressData[0].levels);
  const colors = [
    '#3578e5', // Blue
    '#4caf50', // Green
    '#ff9800', // Orange
    '#e91e63', // Pink
    '#9c27b0', // Purple
    '#00bcd4', // Cyan
  ];

  const width = 800;
  const height = 450;
  const paddingLeft = 50;
  const paddingBottom = 100;
  const paddingTop = 20;
  const paddingRight = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const totalLevels = 10;
  const totalTutorials = progressData.length - 1;

  const getX = (index) => paddingLeft + (index * chartWidth) / totalTutorials;
  const getY = (level) => height - paddingBottom - (level * chartHeight) / totalLevels;

  const [hoveredConcept, setHoveredConcept] = useState(null);

  return (
    <div style={{ width: '100%', overflowX: 'auto', marginBottom: '2em' }}>
      <div style={{ minWidth: '600px', backgroundColor: 'var(--ifm-background-surface-color)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Y-axis grid lines */}
          {[0, 2, 4, 6, 8, 10].map((level) => (
            <g key={level}>
              <line
                x1={paddingLeft}
                y1={getY(level)}
                x2={width - paddingRight}
                y2={getY(level)}
                stroke="var(--ifm-color-emphasis-300)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 10}
                y={getY(level)}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--ifm-color-content)"
                style={{ fontSize: '12px' }}
              >
                {level}
              </text>
            </g>
          ))}

          {/* X-axis labels (Tutorials) */}
          {progressData.map((d, i) => (
            <g key={i} transform={`translate(${getX(i)}, ${height - paddingBottom + 15}) rotate(45)`}>
              <text
                x="0"
                y="0"
                fill="var(--ifm-color-content)"
                style={{ fontSize: '11px', fontWeight: '500' }}
              >
                {d.tutorial.split('. ')[1] || d.tutorial}
              </text>
            </g>
          ))}

          {/* Lines for each concept */}
          {concepts.map((concept, conceptIndex) => {
            const color = colors[conceptIndex % colors.length];
            const points = progressData
              .map((d, i) => `${getX(i)},${getY(d.levels[concept])}`)
              .join(' ');

            const isHovered = hoveredConcept === concept;
            const isAnyHovered = hoveredConcept !== null;

            return (
              <g 
                key={concept} 
                onMouseEnter={() => setHoveredConcept(concept)}
                onMouseLeave={() => setHoveredConcept(null)}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                opacity={!isAnyHovered || isHovered ? 1 : 0.2}
              >
                <polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHovered ? 4 : 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {progressData.map((d, i) => (
                  <circle
                    key={i}
                    cx={getX(i)}
                    cy={getY(d.levels[concept])}
                    r={isHovered ? 5 : 4}
                    fill={color}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: '15px', 
          marginTop: '20px',
          borderTop: '1px solid var(--ifm-color-emphasis-200)',
          paddingTop: '20px'
        }}>
          {concepts.map((concept, i) => (
            <div 
              key={concept} 
              onMouseEnter={() => setHoveredConcept(concept)}
              onMouseLeave={() => setHoveredConcept(null)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                opacity: hoveredConcept && hoveredConcept !== concept ? 0.4 : 1,
                transition: 'opacity 0.2s',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: hoveredConcept === concept ? 'var(--ifm-color-emphasis-100)' : 'transparent'
              }}
            >
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: colors[i % colors.length] }} />
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{concept}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillGraph;
