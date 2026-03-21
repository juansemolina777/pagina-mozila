import { createServer } from './taskmaster/node_modules/vite/dist/node/index.js';

// Hardcoded root — avoids import.meta.url resolution issues with accented paths
const root = 'C:\\Users\\juans\\OneDrive\\Im\u00e1genes\\Escritorio\\gestor de tareas\\.claude\\worktrees\\romantic-sinoussi\\taskmaster';

process.chdir(root);

const server = await createServer({
  root,
  configFile: root + '\\vite.config.ts',
  server: { port: 5173, host: 'localhost' }
});
await server.listen();
server.printUrls();
