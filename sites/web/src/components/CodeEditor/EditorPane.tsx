import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';
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
      extensions={[langExtension[language], EditorView.lineWrapping]}
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
