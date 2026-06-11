import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './styles.module.css';

export interface FileTreeProps {
  files: string[];
  folders: string[];
  activePath: string | null;
  entry: string;
  onOpen(path: string): void;
  onRename(path: string, isFolder: boolean): void;
  onDelete(path: string, isFolder: boolean): void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
}

function buildTree(files: string[], folders: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  const folderNodes = new Map<string, TreeNode>();

  const ensureFolder = (path: string): TreeNode[] => {
    if (path === '') return root;
    const existing = folderNodes.get(path);
    if (existing) return existing.children;
    const parentPath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
    const node: TreeNode = {
      name: path.split('/').pop() ?? path,
      path,
      isFolder: true,
      children: [],
    };
    folderNodes.set(path, node);
    ensureFolder(parentPath).push(node);
    return node.children;
  };

  for (const folder of folders) {
    ensureFolder(folder);
  }
  for (const file of files) {
    const parentPath = file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '';
    ensureFolder(parentPath).push({
      name: file.split('/').pop() ?? file,
      path: file,
      isFolder: false,
      children: [],
    });
  }

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) =>
      a.isFolder === b.isFolder ? a.name.localeCompare(b.name) : a.isFolder ? -1 : 1,
    );
    for (const node of nodes) {
      if (node.isFolder) sortNodes(node.children);
    }
  };
  sortNodes(root);
  return root;
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
            <span className={styles.treeName}>
              <span aria-hidden="true">📁 </span>
              {node.name}
            </span>
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
