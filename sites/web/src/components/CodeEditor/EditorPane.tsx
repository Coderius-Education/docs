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
  /** Meegroeien met de code: de editor eindigt waar de code eindigt en
   *  gebruikt `height` als maximum (daarna scrollt hij intern). */
  autoHeight?: boolean;
}

export function EditorPane({ language, value, onChange, height, autoHeight }: EditorPaneProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={[langExtension[language], EditorView.lineWrapping]}
      theme={vscodeDark}
      height={autoHeight ? 'auto' : height}
      minHeight={autoHeight ? '120px' : undefined}
      maxHeight={autoHeight ? height : undefined}
      className={autoHeight ? styles.codeMirrorAuto : styles.codeMirrorWrapper}
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
