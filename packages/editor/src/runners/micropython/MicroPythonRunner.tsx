import { type FormEvent, type ReactNode, useState, useSyncExternalStore } from 'react';
import type { OutputEvent, RunContext, Runner, RunnerHostProps } from '../types';
import { writeBoardFile } from './protocol';
import { SerialClient } from './serial';
import styles from './styles.module.css';

type ConnState = 'disconnected' | 'connecting' | 'connected';

export function createMicroPythonRunner(): Runner {
  let client: SerialClient | null = null;
  let connState: ConnState = 'disconnected';
  let currentEmit: ((ev: OutputEvent) => void) | null = null;
  const listeners = new Set<() => void>();

  const setConnState = (next: ConnState) => {
    connState = next;
    for (const l of listeners) l();
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  const connect = async () => {
    if (!SerialClient.isSupported()) {
      currentEmit?.({
        kind: 'system',
        text: 'WebSerial wordt niet ondersteund in deze browser. Gebruik Chrome of Edge.\n',
      });
      return;
    }
    setConnState('connecting');
    try {
      client = new SerialClient();
      client.onData = (text) => currentEmit?.({ kind: 'stdout', text });
      client.onDisconnect = () => {
        client = null;
        setConnState('disconnected');
        currentEmit?.({ kind: 'system', text: 'Verbinding met het board verbroken.\n' });
      };
      await client.connect();
      setConnState('connected');
      currentEmit?.({ kind: 'system', text: 'Verbonden met het board.\n' });
    } catch (err) {
      client = null;
      setConnState('disconnected');
      // Annuleren van de poortkiezer is geen fout die aandacht verdient.
      if (err instanceof Error && err.name !== 'NotFoundError') {
        currentEmit?.({ kind: 'system', text: `Verbinden mislukt: ${err.message}\n` });
      }
    }
  };

  const disconnect = async () => {
    await client?.disconnect();
    client = null;
    setConnState('disconnected');
  };

  function ControlsComponent(_props: RunnerHostProps): ReactNode {
    const state = useSyncExternalStore(subscribe, () => connState);
    return (
      <span className={styles.controls}>
        {state === 'connected' ? (
          <button type="button" className={styles.connectButton} onClick={() => void disconnect()}>
            Verbinding verbreken
          </button>
        ) : (
          <button
            type="button"
            className={styles.connectButton}
            disabled={state === 'connecting'}
            onClick={() => void connect()}
          >
            {state === 'connecting' ? 'Verbinden…' : 'Verbinden met board'}
          </button>
        )}
        <span className={styles.connState}>
          {state === 'connected' ? '● verbonden' : '○ niet verbonden'}
        </span>
      </span>
    );
  }

  function InputComponent(_props: RunnerHostProps): ReactNode {
    const state = useSyncExternalStore(subscribe, () => connState);
    const [line, setLine] = useState('');
    if (state !== 'connected') return null;
    const submit = (e: FormEvent) => {
      e.preventDefault();
      if (!client || !line.trim()) return;
      currentEmit?.({ kind: 'system', text: `>>> ${line}\n` });
      void client.typeLine(line);
      setLine('');
    };
    return (
      <form className={styles.replForm} onSubmit={submit}>
        <input
          className={styles.replInput}
          value={line}
          onChange={(e) => setLine(e.target.value)}
          placeholder="REPL-commando, bijv. print(1 + 1)"
          spellCheck={false}
        />
        <button type="submit" className={styles.connectButton}>
          Stuur
        </button>
      </form>
    );
  }

  return {
    id: 'micropython',
    label: 'MicroPython',
    languages: { py: 'python', txt: 'plaintext', json: 'json' },
    capabilities: { stop: true, preview: false, connect: true, autoRun: false },

    async init(onState) {
      onState('ready');
    },

    async run(ctx: RunContext) {
      currentEmit = ctx.emit;
      if (!client || connState !== 'connected') {
        ctx.emit({
          kind: 'system',
          text: 'Geen board verbonden. Klik eerst op "Verbinden met board".\n',
        });
        return;
      }
      ctx.emit({ kind: 'system', text: 'Programma stoppen en bestanden uploaden…\n' });
      try {
        await client.interrupt();
        for (const [path, content] of Object.entries(ctx.files)) {
          // Het entry-bestand wordt als /main.py geüpload zodat het ook na een
          // reset of losse voeding automatisch start.
          const target = path === ctx.entry ? '/main.py' : `/${path}`;
          await writeBoardFile(client, target, content);
        }
      } catch (err) {
        ctx.emit({
          kind: 'stderr',
          text: `Uploaden mislukt: ${err instanceof Error ? err.message : String(err)}\n`,
        });
        return;
      }
      ctx.emit({ kind: 'system', text: 'Herstarten (soft reboot)…\n' });
      await client.softReboot();
    },

    async stop() {
      if (client) {
        await client.interrupt();
        currentEmit?.({ kind: 'system', text: 'Programma onderbroken (Ctrl-C).\n' });
      }
    },

    dispose() {
      currentEmit = null;
      void client?.disconnect();
      client = null;
    },

    ControlsComponent,
    InputComponent,
  };
}
