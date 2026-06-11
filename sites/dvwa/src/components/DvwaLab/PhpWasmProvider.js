let phpInstance = null;
let loadingPromise = null;

/**
 * Lazily initialize and return a singleton PhpWeb instance.
 * The WASM binary (~10-18 MB) is downloaded once and cached by the browser.
 */
export async function getPhp() {
  if (phpInstance) return phpInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const { PhpWeb } = await import('php-wasm/PhpWeb.mjs');
    const php = new PhpWeb();

    // Wait for the WASM binary to be ready
    await php.binary;

    // Initialize the SQLite database with DVWA users
    await php.run(`<?php
      $db = new SQLite3('/tmp/dvwa.db');
      $db->exec('CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        user TEXT NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT DEFAULT "default.jpg"
      )');
      $db->exec('CREATE TABLE IF NOT EXISTS guestbook (
        comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        comment TEXT NOT NULL,
        name TEXT NOT NULL
      )');
      // Check if users already seeded
      $count = $db->querySingle('SELECT COUNT(*) FROM users');
      if ($count == 0) {
        $db->exec("INSERT INTO users VALUES (1,'admin','admin','admin','" . md5('password') . "','admin.jpg')");
        $db->exec("INSERT INTO users VALUES (2,'Gordon','Brown','gordonb','" . md5('abc123') . "','gordonb.jpg')");
        $db->exec("INSERT INTO users VALUES (3,'Hack','Me','1337','" . md5('charley') . "','1337.jpg')");
        $db->exec("INSERT INTO users VALUES (4,'Pablo','Picasso','pablo','" . md5('letmein') . "','pablo.jpg')");
        $db->exec("INSERT INTO users VALUES (5,'Bob','Smith','smithy','" . md5('password') . "','smithy.jpg')");
      }
      $db->close();
    ?>`);

    phpInstance = php;
    return php;
  })();

  return loadingPromise;
}

/**
 * Run PHP code with injected $_GET and $_POST superglobals.
 * Returns the captured HTML output as a string.
 */
export async function runPhp(code, getData, postData) {
  const php = await getPhp();

  // Build superglobal injection
  let inject = '';
  if (getData && Object.keys(getData).length > 0) {
    for (const [k, v] of Object.entries(getData)) {
      const safeKey = k.replace(/'/g, "\\'");
      const safeVal = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      inject += `$_GET['${safeKey}'] = '${safeVal}';\n`;
    }
    inject += '$_REQUEST = array_merge($_REQUEST ?? [], $_GET);\n';
  }
  if (postData && Object.keys(postData).length > 0) {
    for (const [k, v] of Object.entries(postData)) {
      const safeKey = k.replace(/'/g, "\\'");
      const safeVal = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      inject += `$_POST['${safeKey}'] = '${safeVal}';\n`;
    }
    inject += '$_REQUEST = array_merge($_REQUEST ?? [], $_POST);\n';
    inject += "$_SERVER['REQUEST_METHOD'] = 'POST';\n";
  }

  // Inject superglobals after the opening PHP tag
  let injected = code;
  if (inject) {
    injected = code.replace('<?php', `<?php\n${inject}`);
  }

  // Capture stdout output
  let output = '';
  const outputHandler = (event) => {
    if (event.detail && event.detail[0]) {
      output += event.detail[0];
    }
  };

  php.addEventListener('output', outputHandler);

  try {
    await php.run(injected);
  } finally {
    php.removeEventListener('output', outputHandler);
  }

  return output;
}

/**
 * Reset the DVWA SQLite database (clear guestbook, etc.)
 */
export async function resetDatabase() {
  const php = await getPhp();
  await php.run(`<?php
    $db = new SQLite3('/tmp/dvwa.db');
    $db->exec('DELETE FROM guestbook');
    $db->close();
    echo 'Database reset.';
  ?>`);
}
