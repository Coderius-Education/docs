import { useCallback, useEffect, useRef, useState } from 'react';
import { createRunner } from '../../runners/registry';
import type {
  OutputEvent,
  RunSessionApi,
  Runner,
  RunnerId,
  RunnerState,
} from '../../runners/types';

// Eén run-sessie: bezit de runner-lifecycle (lazy laden + init), de
// console-events en runner-specifieke sessiedata (zoals het preview-document
// van de web-runner).
export function useRunSession(runnerId: RunnerId): RunSessionApi {
  const [runner, setRunner] = useState<Runner | null>(null);
  const [runnerState, setRunnerState] = useState<RunnerState>('uninitialized');
  const [stateDetail, setStateDetail] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<OutputEvent[]>([]);
  const [data, setDataState] = useState<Record<string, unknown>>({});

  const runnerRef = useRef<Runner | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const disposedRef = useRef(false);

  useEffect(() => {
    disposedRef.current = false;
    let cancelled = false;

    createRunner(runnerId)
      .then((r) => {
        if (cancelled) {
          r.dispose();
          return;
        }
        runnerRef.current = r;
        setRunner(r);
      })
      .catch((err) => {
        setRunnerState('error');
        setStateDetail(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
      disposedRef.current = true;
      abortRef.current?.abort();
      runnerRef.current?.dispose();
      runnerRef.current = null;
    };
  }, [runnerId]);

  const emit = useCallback((ev: OutputEvent) => {
    if (disposedRef.current) return;
    setEvents((prev) => (ev.kind === 'clear' ? [] : [...prev, ev]));
  }, []);

  const setData = useCallback((key: string, value: unknown) => {
    if (disposedRef.current) return;
    setDataState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onState = useCallback((state: RunnerState, detail?: string) => {
    if (disposedRef.current) return;
    setRunnerState(state);
    setStateDetail(detail ?? null);
  }, []);

  const run = useCallback(
    async (files: Record<string, string>, entry: string, options?: { setup?: string }) => {
      const r = runnerRef.current;
      if (!r || disposedRef.current) return;

      // Een lopende run eerst afbreken (relevant voor autoRun/live preview).
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      try {
        await r.init(onState);
      } catch {
        return;
      }
      if (abort.signal.aborted || disposedRef.current) return;

      setRunning(true);
      setRunnerState('running');
      try {
        await r.run({ files, entry, setup: options?.setup, emit, setData, signal: abort.signal });
      } catch (err) {
        emit({
          kind: 'stderr',
          text: `${err instanceof Error ? err.message : String(err)}\n`,
        });
      } finally {
        if (!disposedRef.current && abortRef.current === abort) {
          setRunning(false);
          setRunnerState('ready');
        }
      }
    },
    [emit, setData, onState],
  );

  const stop = useCallback(async () => {
    abortRef.current?.abort();
    await runnerRef.current?.stop?.();
  }, []);

  const clear = useCallback(() => {
    setEvents([]);
  }, []);

  return { runner, runnerState, stateDetail, running, events, data, run, stop, clear };
}
