const fs = require('fs');

// Read and normalise to LF
let content = fs.readFileSync('docs/cheatsheet.md', 'utf8').replace(/\r\n/g, '\n');

const testMatches = content.match(/```(?:python|py)\n/g);
console.log('Fence openers found:', testMatches ? testMatches.length : 0);

let count = 0;

const FENCE_RE = /```(?:python|py)\n([\s\S]*?)```/g;

const result = content.replace(FENCE_RE, (match, code) => {
  if (!code.includes('import play')) return match;
  if (/play\.new_image|set_backdrop_image/.test(code)) return match;
  if (/new_database|database\./.test(code)) return match;
  if (/play\.controllers|controller\.get_/.test(code)) return match;
  const hasVisual = /play\.new_circle|play\.new_box|play\.new_text|play\.set_backdrop|start_physics/.test(code);
  const hasPrintOnly = /\bprint\s*\(/.test(code) && !hasVisual;
  if (hasPrintOnly) return match;

  count++;
  const escaped = code.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  return '<PygbagRunner code={`' + escaped + '`} height={350} />';
});

// Write back with LF (or keep LF — Docusaurus is fine with it)
fs.writeFileSync('docs/cheatsheet.md', result, 'utf8');
console.log('Converted', count, 'code blocks in cheatsheet.md');
