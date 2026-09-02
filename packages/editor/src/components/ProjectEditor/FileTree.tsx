import clsx from 'clsx';
import type { ReactNode } from 'react';
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
}

export default function FileTree({
  files,
  folders,
  activePath,
  entry,
  onOpen,
  onRename,
  onDelete,
}: FileTreeProps): ReactNode {
  const tree = buildTree(files, folders);

  const renderNodes = (nodes: TreeNode[], depth: number): ReactNode =>
    nodes.map((node) => (
      <li key={node.path}>
        <div
          className={clsx(styles.treeRow, node.path === activePath && styles.treeRowActive)}
          style={{ paddingLeft: `${0.5 + depth * 0.9}rem` }}
        >
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
            <button
              type="button"
              className={styles.treeAction}
              title="Naam wijzigen"
              onClick={() => onRename(node.path, node.isFolder)}
            >
              ✎
            </button>
            <button
              type="button"
              className={styles.treeAction}
              title="Verwijderen"
              onClick={() => onDelete(node.path, node.isFolder)}
            >
              ×
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
