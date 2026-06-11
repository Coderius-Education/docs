// Fetch the leaphy-micropython library from GitHub and push it to the board.
// Uses the GitHub Trees API + raw.githubusercontent.com (both CORS-enabled).

import type { BoardFS } from './filesystem';

const REPO = 'leaphy-robotics/leaphy-micropython';
const BRANCH = 'main';

type TreeEntry = { path: string; type: 'blob' | 'tree' | string; sha: string };
type TreeResponse = { tree: TreeEntry[]; truncated: boolean };

export type InstallProgress = {
  done: number;
  total: number;
  current: string;
};

export async function installLeaphyLibrary(
  fs: BoardFS,
  onProgress: (p: InstallProgress) => void,
): Promise<void> {
  const treeUrl = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
  const r = await fetch(treeUrl);
  if (!r.ok)
    throw new Error(
      `Kon library-lijst niet ophalen (HTTP ${r.status}). Probeer het later opnieuw.`,
    );
  const data: TreeResponse = await r.json();
  if (data.truncated) {
    // unlikely for this small repo, but warn
    console.warn('GitHub tree response truncated; some files may be missing.');
  }
  const files = data.tree.filter(
    (e) => e.type === 'blob' && e.path.startsWith('leaphymicropython/'),
  );
  if (files.length === 0) throw new Error('Geen library-bestanden gevonden.');

  let done = 0;
  for (const entry of files) {
    onProgress({ done, total: files.length, current: entry.path });
    const rawUrl = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${entry.path}`;
    const fileRes = await fetch(rawUrl);
    if (!fileRes.ok) {
      throw new Error(`Kon ${entry.path} niet ophalen (HTTP ${fileRes.status}).`);
    }
    const bytes = new Uint8Array(await fileRes.arrayBuffer());
    const boardPath = '/lib/' + entry.path;
    await fs.writeFile(boardPath, bytes);
    done += 1;
  }
  onProgress({ done, total: files.length, current: 'klaar' });
}
