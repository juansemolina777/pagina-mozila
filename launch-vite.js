// Launch Vite from the taskmaster directory
const path = require('path');
const root = path.join(__dirname, 'taskmaster');
process.chdir(root);
// Require vite from taskmaster's own node_modules
const { createServer } = require(path.join(root, 'node_modules', 'vite'));
createServer({ root, server: { port: 5173, host: 'localhost' } }).then((s) => s.listen());
