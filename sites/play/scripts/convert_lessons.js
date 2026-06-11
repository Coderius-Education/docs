/**
 * For each lesson .mdx file:
 *   1. Find code blocks that are directly followed (within ~20 lines) by an orphaned
 *      TryButton remnant (a line ending with `} />).
 *   2. Replace the code block + orphaned lines with a <PygbagRunner> component,
 *      OR just strip the orphaned lines if the code can't run in the browser.
 *
 * Works line-by-line so it never matches across unrelated code blocks.
 */
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');

const targets = [
  'vormen/je_eerste_cirkel.mdx',
  'vormen/je_eerste_programma.mdx',
  'vormen/je_eerste_rechthoek.mdx',
  'vormen/je_eerste_tekst.mdx',
  'vormen/vorm_aanpassen.mdx',
  'vormen/debuggen.mdx',
  'vormen/info_opvragen_over_vorm.mdx',
  'acties/acties.mdx',
  'acties/meer_acties.mdx',
  'acties/random.mdx',
  'acties/functies_methodes.mdx',
  'gebeurtenissen/muis.mdx',
  'gebeurtenissen/toetsenbord.mdx',
  'gebeurtenissen/vormen.mdx',
  'gebeurtenissen/controllers.mdx',
];

function canRunInBrowser(code) {
  if (!code.includes('import play')) return false;
  if (/play\.new_image|set_backdrop_image/.test(code)) return false;
  if (/new_database|database\./.test(code)) return false;
  if (/play\.controllers|controller\.get_/.test(code)) return false;
  const hasVisual = /play\.new_circle|play\.new_box|play\.new_text|play\.set_backdrop|start_physics/.test(code);
  const hasPrintOnly = /\bprint\s*\(/.test(code) && !hasVisual;
  if (hasPrintOnly) return false;
  return true;
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  // Normalise to LF
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const n = lines.length;

  // Label each line
  const OPEN = 'open', CLOSE = 'close', ORPHAN = 'orphan', NORMAL = 'normal';
  const labels = lines.map(l => {
    if (/^```(python|py)\s*$/.test(l)) return OPEN;
    if (l === '```') return CLOSE;
    if (l.endsWith('`} />')) return ORPHAN;
    return NORMAL;
  });

  // Find all code blocks: {start, end, code}
  const blocks = [];
  let openIdx = -1;
  for (let i = 0; i < n; i++) {
    if (labels[i] === OPEN) {
      openIdx = i;
    } else if (labels[i] === CLOSE && openIdx >= 0) {
      blocks.push({ start: openIdx, end: i, code: lines.slice(openIdx + 1, i).join('\n') });
      openIdx = -1;
    }
  }

  // For each code block, look ahead (within 20 lines) for an orphaned remnant
  const replacements = [];
  const usedOrphans = new Set();

  for (const block of blocks) {
    let orphanIdx = -1;
    for (let j = block.end + 1; j < Math.min(n, block.end + 21); j++) {
      if (labels[j] === ORPHAN && !usedOrphans.has(j)) {
        orphanIdx = j;
        break;
      }
      // Stop if we hit another code block or clear MDX structure (not Python comments)
      if (labels[j] === OPEN || labels[j] === CLOSE) break;
      if (/^(<[a-zA-Z\/]|:::)/.test(lines[j])) break;
    }
    if (orphanIdx === -1) continue;

    usedOrphans.add(orphanIdx);
    replacements.push({ block, orphanIdx });
  }

  if (replacements.length === 0) return 0;

  // Apply replacements from bottom to top (so indices stay valid)
  replacements.sort((a, b) => b.block.start - a.block.start);

  let converted = 0;
  for (const { block, orphanIdx } of replacements) {
    const code = block.code;
    if (canRunInBrowser(code)) {
      // Replace lines[block.start .. orphanIdx] with a single PygbagRunner line
      const escaped = code.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      const pygbag = '<PygbagRunner code={`' + escaped + '`} height={300} />';
      lines.splice(block.start, orphanIdx - block.start + 1, pygbag);
      converted++;
    } else {
      // Just remove orphaned lines (from block.end+1 to orphanIdx)
      lines.splice(block.end + 1, orphanIdx - block.end);
    }
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return converted;
}

let total = 0;
for (const rel of targets) {
  const fp = path.join(docsDir, rel);
  if (!fs.existsSync(fp)) { console.log('SKIP:', rel); continue; }
  const n = processFile(fp);
  console.log(n > 0 ? 'OK ' : '-- ', rel, n > 0 ? `(${n} converted)` : '(no changes)');
  total += n;
}
console.log('\nTotal converted:', total);
