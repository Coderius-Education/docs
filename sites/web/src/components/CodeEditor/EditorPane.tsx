import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import CodeMirror from '@uiw/react-codemirror';
import React, { useMemo } from 'react';
import styles from './CodeEditor.module.css';

const langExtension = {
  html: html(),
  css: css(),
  javascript: javascript(),
} as const;

interface EditorPaneProps {
  language: 'html' | 'css' | 'javascript';
  value: string;
  onChange: (value: string) => void;
  height: string;
}

// Zowel `extensions` als `basicSetup` staan in de dependencies van het effect
// dat CodeMirror opnieuw configureert. Een vers array- of objectliteral per
// render laat de editor bij elke toetsaanslag een StateEffect.reconfigure
// versturen, dus die twee moeten een stabiele identiteit houden.
const BASIC_SETUP = {
  lineNumbers: true,
  foldGutter: false,
  autocompletion: true,
  bracketMatching: true,
  closeBrackets: true,
  indentOnInput: true,
};

export function EditorPane({ language, value, onChange, height }: EditorPaneProps) {
  const extensions = useMemo(() => [langExtension[language]], [language]);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={vscodeDark}
      height={height}
      className={styles.codeMirrorWrapper}
      basicSetup={BASIC_SETUP}
    />
  );
}
