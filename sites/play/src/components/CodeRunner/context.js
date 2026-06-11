import React, { createContext, useContext, useState, useCallback } from 'react';
import { detectMode } from './engine';

const CodeRunnerContext = createContext(null);

export function CodeRunnerProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('play');
  const [isRunning, setIsRunning] = useState(false);

  const openWithCode = useCallback((newCode, newMode) => {
    setCode(newCode);
    setMode(newMode || detectMode(newCode));
    setIsRunning(false);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsRunning(false);
    setIsOpen(false);
  }, []);

  return (
    <CodeRunnerContext.Provider
      value={{
        isOpen,
        code,
        mode,
        isRunning,
        setCode,
        setMode,
        setIsRunning,
        openWithCode,
        close,
      }}
    >
      {children}
    </CodeRunnerContext.Provider>
  );
}

export function useCodeRunner() {
  const ctx = useContext(CodeRunnerContext);
  if (!ctx) {
    throw new Error('useCodeRunner must be used within a CodeRunnerProvider');
  }
  return ctx;
}
