const { execFileSync } = require('node:child_process');

/**
 * De commit waarvan deze build komt, en of de werkmap schoon was. Een vuile
 * build heeft geen commit: docs-management vertrouwt een manifest alleen als
 * het precies bij de commit van de build hoort.
 */
function buildCommit(siteDir) {
  let commit = process.env.GITHUB_SHA || null;
  if (!commit) {
    try {
      commit = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: siteDir,
        encoding: 'utf8',
      }).trim();
    } catch {}
  }
  let dirty = false;
  try {
    dirty = Boolean(
      execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], {
        cwd: siteDir,
        encoding: 'utf8',
      }).trim(),
    );
  } catch {}
  return { commit: dirty ? null : commit, dirty };
}

module.exports = { buildCommit };
