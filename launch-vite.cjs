// CJS: launches vite via cmd.exe so .cmd scripts work on Windows
const { spawn } = require('child_process');

const root = 'C:\\Users\\juans\\OneDrive\\Im\u00e1genes\\Escritorio\\gestor de tareas\\.claude\\worktrees\\romantic-sinoussi\\taskmaster';

const child = spawn(
  'cmd.exe',
  ['/c', root + '\\node_modules\\.bin\\vite.cmd', '--port', '5173', '--host', 'localhost'],
  { cwd: root, stdio: 'inherit', windowsHide: true }
);

child.on('error', (e) => process.stderr.write('Error: ' + e.message + '\n'));
process.on('exit', () => { try { child.kill(); } catch (_) {} });
