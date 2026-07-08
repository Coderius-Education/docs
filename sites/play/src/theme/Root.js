import React from 'react';
import Sidebar from '../components/CodeRunner/Sidebar';
import { CodeRunnerProvider } from '../components/CodeRunner/context';

export default function Root({ children }) {
  return (
    <CodeRunnerProvider>
      {children}
      <Sidebar />
    </CodeRunnerProvider>
  );
}
