import type * as React from 'react';

// Een runner voert projectbestanden uit: Python via Pyodide, web via een
// preview-iframe, MicroPython via WebSerial. Nieuwe runtimes (zoals PHP-wasm)
// implementeren hetzelfde contract en pluggen in zonder UI-wijzigingen.

export type RunnerId = 'python' | 'web' | 'micropython' | (string & {});

export type OutputEvent =
  | { kind: 'stdout' | 'stderr' | 'system'; text: string }
  | { kind: 'clear' }
  | { kind: 'rich'; node: React.ReactNode };

export type RunnerState = 'uninitialized' | 'loading' | 'ready' | 'running' | 'error';

export interface RunContext {
  files: Readonly<Record<string, string>>;
  entry: string;
  // Onzichtbare opzetcode (oefening-scaffolding) die vóór het entry-bestand
  // draait, in dezelfde globals — apart uitgevoerd zodat regelnummers in
  // tracebacks van de leerlingcode blijven kloppen.
  setup?: string;
  emit(ev: OutputEvent): void;
  // Runner-specifieke sessiedata voor de host-UI (bijv. web: het gebouwde
  // srcdoc voor de preview-iframe). PreviewComponent leest dit terug via
  // session.data.
  setData(key: string, value: unknown): void;
  signal: AbortSignal;
}

export interface RunnerCapabilities {
  // Kan een lopend programma gestopt worden? (Python op de main thread: nee.)
  stop: boolean;
  // Toont de host een preview-paneel (PreviewComponent) naast de console?
  preview: boolean;
  // Heeft de runner een verbindingsknop nodig (ControlsComponent)? WebSerial
  // vereist een user-gesture, dus verbinden kan niet binnen run() gebeuren.
  connect: boolean;
  // Opnieuw uitvoeren (met debounce) bij elke wijziging? Voor live preview.
  autoRun: boolean;
}

export interface RunSessionApi {
  runner: Runner | null;
  runnerState: RunnerState;
  stateDetail: string | null;
  running: boolean;
  events: OutputEvent[];
  data: Record<string, unknown>;
  run(files: Record<string, string>, entry: string, options?: { setup?: string }): Promise<void>;
  stop(): Promise<void>;
  clear(): void;
}

export interface RunnerHostProps {
  session: RunSessionApi;
}

export interface Runner {
  readonly id: RunnerId;
  readonly label: string;
  // Bestandsextensie (zonder punt) -> Monaco language id, bijv. {py: 'python'}.
  readonly languages: Record<string, string>;
  readonly capabilities: RunnerCapabilities;
  init(onState: (state: RunnerState, detail?: string) => void): Promise<void>;
  run(ctx: RunContext): Promise<void>;
  stop?(): Promise<void>;
  dispose(): void;
  PreviewComponent?: React.ComponentType<RunnerHostProps>;
  ControlsComponent?: React.ComponentType<RunnerHostProps>;
  // Optionele invoerregel onder de console (bijv. REPL-commando's typen).
  InputComponent?: React.ComponentType<RunnerHostProps>;
}
