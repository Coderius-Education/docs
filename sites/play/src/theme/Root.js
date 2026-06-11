import React from 'react';
import { CodeRunnerProvider } from '../components/CodeRunner/context';
import Sidebar from '../components/CodeRunner/Sidebar';

export default function Root({ children }) {
  return (
    <CodeRunnerProvider>
      {children}
      <Sidebar />
    </CodeRunnerProvider>
  );
}
