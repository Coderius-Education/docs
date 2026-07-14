import { useCallback, useRef, useState } from 'react';
import { readUploadedFiles } from '../readFiles';
import type { CheckerConfig, ProjectFiles } from '../types';
import styles from './styles.module.css';

interface UploadZoneProps {
  config: CheckerConfig;
  onLoaded: (files: ProjectFiles, warnings: string[]) => void;
  onError: (message: string) => void;
  busy: boolean;
  setBusy: (busy: boolean) => void;
}

export function UploadZone({ config, onLoaded, onError, busy, setBusy }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleSource = useCallback(
    async (source: FileList | File[] | DataTransferItemList) => {
      setBusy(true);
      try {
        const { files, warnings } = await readUploadedFiles(source, {
          classify: config.classify,
          textKinds: config.textKinds,
          imageKinds: config.imageKinds,
        });
        onLoaded(files, warnings);
      } catch (err) {
        onError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [config, onLoaded, onError, setBusy],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) handleSource(files);
      e.target.value = '';
    },
    [handleSource],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.items?.length) {
        handleSource(e.dataTransfer.items);
      } else if (e.dataTransfer.files?.length) {
        handleSource(e.dataTransfer.files);
      }
    },
    [handleSource],
  );

  return (
    <div
      className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <p className={styles.dropZoneText}>Sleep hier je projectmap of .zip-bestand naartoe</p>
      <p className={styles.dropZoneOr}>of</p>
      <div className={styles.dropZoneButtons}>
        <button
          type="button"
          className={styles.uploadButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          Kies bestanden of een zip
        </button>
        <button
          type="button"
          className={styles.uploadButton}
          onClick={() => folderInputRef.current?.click()}
          disabled={busy}
        >
          Kies een map
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={config.accept}
        className={styles.hiddenInput}
        onChange={handleFileInputChange}
        aria-label="Kies bestanden of een zip-bestand"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error -- niet-standaard attribuut, wel breed ondersteund voor mapselectie
        webkitdirectory=""
        className={styles.hiddenInput}
        onChange={handleFileInputChange}
        aria-label="Kies een map met je projectbestanden"
      />
    </div>
  );
}
