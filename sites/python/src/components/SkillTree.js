import React, { useState } from 'react';
import { knowledgeGraph } from '@site/src/data/knowledgeGraph';

const SkillTree = () => {
  const [selectedTutorialIndex, setSelectedTutorialIndex] = useState(0);
  const tutorial = knowledgeGraph.tutorials[selectedTutorialIndex];

  const concepts = knowledgeGraph.concepts;
  
  // Calculate current levels
  const getCurrentLevels = (tutorialIdx) => {
    const levels = {};
    concepts.forEach(c => levels[c.id] = 0);
    for (let i = 0; i <= tutorialIdx; i++) {
      knowledgeGraph.tutorials[i].impact.forEach(imp => {
        if (imp.level > levels[imp.concept]) levels[imp.concept] = imp.level;
      });
    }
    return levels;
  };

  const currentLevels = getCurrentLevels(selectedTutorialIndex);
  const highlightedImpacts = tutorial.impact.reduce((acc, imp) => {
    acc[imp.concept] = imp.level;
    return acc;
  }, {});

  return (
    <div style={{ backgroundColor: 'var(--ifm-background-surface-color)', padding: '25px', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '15px' }}>Voortgang na Tutorial</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {knowledgeGraph.tutorials.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setSelectedTutorialIndex(i)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: '2px solid',
                borderColor: i === selectedTutorialIndex ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-300)',
                backgroundColor: i === selectedTutorialIndex ? 'var(--ifm-color-primary)' : 'transparent',
                color: i === selectedTutorialIndex ? '#fff' : 'var(--ifm-color-content)',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s ease',
                fontWeight: i === selectedTutorialIndex ? 'bold' : 'normal'
              }}
            >
              {t.title.split('. ')[0]}
            </button>
          ))}
        </div>
        <p style={{ marginTop: '10px', fontSize: '14px', color: 'var(--ifm-color-primary)', fontWeight: 'bold' }}>
          {tutorial.title}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {concepts.map((concept) => {
          const level = currentLevels[concept.id];
          const highlightLevel = highlightedImpacts[concept.id];
          const maxLevel = concept.maxLevel || 5;
          
          return (
            <div key={concept.id} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{concept.label}</span>
                <span style={{ fontSize: '14px', opacity: 0.7 }}>Level {level} / {maxLevel}</span>
              </div>
              
              <div style={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center' }}>
                {/* The "Line between levels" */}
                <div style={{ 
                  position: 'absolute', 
                  left: '15px', 
                  right: '15px', 
                  height: '4px', 
                  backgroundColor: 'var(--ifm-color-emphasis-200)',
                  borderRadius: '2px'
                }} />
                
                {/* Filled part of the line */}
                <div style={{ 
                  position: 'absolute', 
                  left: '15px', 
                  width: `calc(${(level / maxLevel) * 100}% - 30px)`, 
                  height: '4px', 
                  backgroundColor: 'var(--ifm-color-primary)',
                  borderRadius: '2px',
                  transition: 'width 0.5s ease'
                }} />

                {/* Level Nodes */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                  {Array.from({ length: maxLevel + 1 }).map((_, i) => {
                    const isReached = i <= level;
                    const isImpacted = i === highlightLevel;
                    
                    return (
                      <div 
                        key={i} 
                        style={{ position: 'relative' }}
                        title={isImpacted ? tutorial.impact.find(imp => imp.concept === concept.id && imp.level === i)?.depth : `Level ${i}`}
                      >
                        <div style={{
                          width: isImpacted ? '24px' : '16px',
                          height: isImpacted ? '24px' : '16px',
                          borderRadius: '50%',
                          backgroundColor: isReached ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-300)',
                          border: '3px solid var(--ifm-background-surface-color)',
                          boxShadow: isImpacted ? '0 0 10px var(--ifm-color-primary)' : 'none',
                          transform: isImpacted ? 'scale(1.2)' : 'none',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}>
                          {isImpacted && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                        </div>
                        {isImpacted && (
                          <div style={{
                            position: 'absolute',
                            top: '30px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '200px',
                            backgroundColor: 'var(--ifm-color-primary)',
                            color: '#fff',
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            zIndex: 10,
                            textAlign: 'center',
                            pointerEvents: 'none'
                          }}>
                            <strong>Nieuw:</strong> {tutorial.impact.find(imp => imp.concept === concept.id).depth}
                            <div style={{
                              position: 'absolute',
                              top: '-5px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              borderLeft: '5px solid transparent',
                              borderRight: '5px solid transparent',
                              borderBottom: '5px solid var(--ifm-color-primary)'
                            }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: '40px', padding: '15px', backgroundColor: 'var(--ifm-color-emphasis-100)', borderRadius: '8px', fontSize: '14px' }}>
        <p style={{ margin: 0 }}>
          <strong>Tip:</strong> Klik op de tutorial-knoppen bovenaan om te zien hoe de lijnen tussen de levels worden ingevuld. 
          Het oplichtende punt met de tekstballon laat zien wat je <em>precies</em> in die les hebt geleerd.
        </p>
      </div>
    </div>
  );
};

export default SkillTree;
