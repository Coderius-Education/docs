import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
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

export function EditorPane({ language, value, onChange, height }: EditorPaneProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[langExtension[language]]}
      theme={vscodeDark}
      height={height}
      className={styles.codeMirrorWrapper}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
      }}
    />
  );
}
