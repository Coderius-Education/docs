import clsx from 'clsx';
import {
  FileCode,
  File as FileIcon,
  FileImage,
  Folder,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react';
import type { DragEvent, ReactNode } from 'react';
import { isAfbeelding, isTekstbestand } from '../../vfs/bestanden';
import styles from './styles.module.css';
import { type TreeNode, buildTree } from './tree';

export interface FileTreeProps {
  files: string[];
  folders: string[];
  activePath: string | null;
  entry: string;
  onOpen(path: string): void;
  onRename(path: string, isFolder: boolean): void;
  onDelete(path: string, isFolder: boolean): void;
  // Bestanden van de computer naar deze map ('' is de hoofdmap).
  onUpload(map: string): void;
  // De map waar gesleepte bestanden nu terecht zouden komen; die licht op.
  sleepDoel: string | null;
  onSleepOver(map: string): void;
}

function mapVan(pad: string): string {
  return pad.includes('/') ? pad.slice(0, pad.lastIndexOf('/')) : '';
}

function Icoon({ node }: { node: TreeNode }): ReactNode {
  const Soort = node.isFolder
    ? Folder
    : isAfbeelding(node.path)
      ? FileImage
      : isTekstbestand(node.path)
        ? FileCode
        : FileIcon;
  return <Soort aria-hidden="true" size={14} className={styles.treeIcoon} />;
}

export default function FileTree({
  files,
  folders,
  activePath,
  entry,
  onOpen,
  onRename,
  onDelete,
  onUpload,
  sleepDoel,
  onSleepOver,
}: FileTreeProps): ReactNode {
  const tree = buildTree(files, folders);

  // Sleep je bestanden over een map, dan gaan ze daarin; over een bestand, dan
  // in de map van dat bestand. preventDefault zegt de browser dat hier
  // neerzetten mag, en laat de zijbalk weten dat een rij het doel al koos.
  const overRij = (node: TreeNode) => (e: DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    onSleepOver(node.isFolder ? node.path : mapVan(node.path));
  };

  const renderNodes = (nodes: TreeNode[], depth: number): ReactNode =>
    nodes.map((node) => (
      <li key={node.path}>
        <div
          className={clsx(
            styles.treeRow,
            node.path === activePath && styles.treeRowActive,
            node.isFolder && node.path === sleepDoel && styles.treeRowSleep,
          )}
          style={{ paddingLeft: `${0.5 + depth * 0.9}rem` }}
          onDragOver={overRij(node)}
        >
          <Icoon node={node} />
          {node.isFolder ? (
            <span className={styles.treeName}>{node.name}</span>
          ) : (
            <button
              type="button"
              className={styles.treeName}
              onClick={() => onOpen(node.path)}
              title={node.path}
            >
              {node.name}
              {node.path === entry && (
                <span className={styles.entryBadge} title="Startbestand">
                  {' '}
                  ▸
                </span>
              )}
            </button>
          )}
          <span className={styles.treeActions}>
            {node.isFolder && (
              <button
                type="button"
                className={styles.treeAction}
                title="Bestanden uploaden naar deze map"
                aria-label={`Bestanden uploaden naar ${node.path}`}
                onClick={() => onUpload(node.path)}
              >
                <Upload aria-hidden="true" size={13} />
              </button>
            )}
            <button
              type="button"
              className={styles.treeAction}
              title="Naam wijzigen"
              aria-label={`${node.path} een andere naam geven`}
              onClick={() => onRename(node.path, node.isFolder)}
            >
              <Pencil aria-hidden="true" size={13} />
            </button>
            <button
              type="button"
              className={styles.treeAction}
              title="Verwijderen"
              aria-label={`${node.path} verwijderen`}
              onClick={() => onDelete(node.path, node.isFolder)}
            >
              <Trash2 aria-hidden="true" size={13} />
            </button>
          </span>
        </div>
        {node.isFolder && node.children.length > 0 && (
          <ul className={styles.treeList}>{renderNodes(node.children, depth + 1)}</ul>
        )}
      </li>
    ));

  return <ul className={styles.treeList}>{renderNodes(tree, 0)}</ul>;
}
