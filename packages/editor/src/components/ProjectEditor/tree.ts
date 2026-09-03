// De boom die FileTree tekent. Losse module zonder React zodat de opbouw
// (impliciete mappen, sortering) los van de component te testen is.

export interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
}

export function buildTree(files: string[], folders: string[]): TreeNode[] {
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
