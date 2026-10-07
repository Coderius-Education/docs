// php-wasm levert geen typedeclaraties. De tests laden PhpNode dynamisch en
// geven de instantie door aan de (untyped) PhpWasmProvider; meer dan "bestaat"
// hoeft TypeScript hier niet te weten.
declare module 'php-wasm/PhpNode.mjs' {
  export class PhpNode {
    constructor(options?: Record<string, unknown>);
  }
}
