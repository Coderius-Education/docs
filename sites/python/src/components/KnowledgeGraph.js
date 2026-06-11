import React, { useState } from 'react';
import { knowledgeGraph } from '@site/src/data/knowledgeGraph';

const KnowledgeGraph = () => {
  const [selectedTutorialIndex, setSelectedTutorialIndex] = useState(knowledgeGraph.tutorials.length - 1);
  const [hoveredConcept, setHoveredConcept] = useState(null);

  const tutorial = knowledgeGraph.tutorials[selectedTutorialIndex];
  
  // Node positions
  const positions = {
    basis: { x: 150, y: 100 },
    variabelen: { x: 450, y: 100 },
    logica: { x: 650, y: 250 },
    herhaling: { x: 450, y: 400 },
    data: { x: 150, y: 400 },
    functies: { x: 50, y: 250 }
  };

  const getImpactForConcept = (conceptId) => {
    return tutorial.impact.find(imp => imp.concept === conceptId);
  };

  // Calculate "current levels" up to selected tutorial
  const getCurrentLevels = (tutorialIdx) => {
    const levels = {};
    knowledgeGraph.concepts.forEach(c => levels[c.id] = 0);
    
    for (let i = 0; i <= tutorialIdx; i++) {
      knowledgeGraph.tutorials[i].impact.forEach(imp => {
        if (imp.level > levels[imp.concept]) {
          levels[imp.concept] = imp.level;
        }
      });
    }
    return levels;
  };

  const currentLevels = getCurrentLevels(selectedTutorialIndex);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ backgroundColor: 'var(--ifm-background-surface-color)', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <label htmlFor="tutorial-select" style={{ fontWeight: 'bold', marginRight: '10px' }}>Voortgang na:</label>
          <select 
            id="tutorial-select"
            value={selectedTutorialIndex} 
            onChange={(e) => setSelectedTutorialIndex(parseInt(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--ifm-color-primary)', backgroundColor: 'var(--ifm-background-color)', color: 'var(--ifm-color-content)' }}
          >
            {knowledgeGraph.tutorials.map((t, i) => (
              <option key={t.id} value={i}>{t.title}</option>
            ))}
          </select>
        </div>

        <div style={{ position: 'relative', width: '100%', height: '500px', border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--ifm-color-emphasis-100)' }}>
          <svg width="100%" height="100%" viewBox="0 0 750 500">
            {/* Edges */}
            {knowledgeGraph.connections.map((conn, i) => (
              <line 
                key={i}
                x1={positions[conn.from].x}
                y1={positions[conn.from].y}
                x2={positions[conn.to].x}
                y2={positions[conn.to].y}
                stroke="var(--ifm-color-emphasis-300)"
                strokeWidth="2"
              />
            ))}

            {/* Nodes */}
            {knowledgeGraph.concepts.map((concept) => {
              const pos = positions[concept.id];
              const level = currentLevels[concept.id];
              const isImpacted = tutorial.impact.some(imp => imp.concept === concept.id);
              const radius = 30 + (level * 3);

              return (
                <g 
                  key={concept.id}
                  onMouseEnter={() => setHoveredConcept(concept.id)}
                  onMouseLeave={() => setHoveredConcept(null)}
                  style={{ cursor: 'help' }}
                >
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r={radius} 
                    fill={isImpacted ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-400)'}
                    stroke="var(--ifm-background-surface-color)"
                    strokeWidth="4"
                    style={{ transition: 'all 0.3s ease', filter: isImpacted ? 'drop-shadow(0 0 8px var(--ifm-color-primary))' : 'none' }}
                  />
                  <text 
                    x={pos.x} 
                    y={pos.y + radius + 20} 
                    textAnchor="middle" 
                    fill="var(--ifm-color-content)"
                    style={{ fontSize: '14px', fontWeight: 'bold' }}
                  >
                    {concept.label}
                  </text>
                  <text 
                    x={pos.x} 
                    y={pos.y} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fill="#fff"
                    style={{ fontSize: '16px', fontWeight: 'bold' }}
                  >
                    {level}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip Overlay */}
          {hoveredConcept && (
            <div style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              width: '250px', 
              backgroundColor: 'var(--ifm-background-surface-color)', 
              padding: '15px', 
              borderRadius: '8px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              border: '1px solid var(--ifm-color-primary)',
              zIndex: 10
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--ifm-color-primary)' }}>
                {knowledgeGraph.concepts.find(c => c.id === hoveredConcept).label}
              </h4>
              <p style={{ fontSize: '13px', margin: '0 0 10px 0' }}>
                {knowledgeGraph.concepts.find(c => c.id === hoveredConcept).description}
              </p>
              <div style={{ fontSize: '12px', borderTop: '1px solid var(--ifm-color-emphasis-200)', paddingTop: '10px' }}>
                <strong>Huidig niveau: {currentLevels[hoveredConcept]}/10</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--ifm-color-emphasis-100)', padding: '20px', borderRadius: '12px' }}>
        <h3>Details van Tutorial: {tutorial.title}</h3>
        <p>Tijdens deze les heb je je kennis verdiept in:</p>
        <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {tutorial.impact.map((imp, i) => (
            <div key={i} style={{ backgroundColor: 'var(--ifm-background-surface-color)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--ifm-color-primary)' }}>
              <strong style={{ display: 'block', marginBottom: '5px' }}>
                {knowledgeGraph.concepts.find(c => c.id === imp.concept).label} (Niveau {imp.level})
              </strong>
              <span style={{ fontSize: '14px', color: 'var(--ifm-color-content-emphasis)' }}>{imp.depth}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
