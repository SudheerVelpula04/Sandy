// Some managed Windows environments deny Node's native realpath implementation
// for workspace files while allowing the JavaScript fallback. Keep Vite usable
// there without changing normal Node behavior on other systems.
import fs from 'node:fs';
if (process.platform === 'win32') fs.realpathSync.native = fs.realpathSync;

const { createServer, build, preview } = await import('vite');
const command = process.argv[2] || 'dev';
if (command === 'build') await build();
else if (command === 'preview') {
  const server = await preview();
  server.printUrls();
} else {
  const server = await createServer();
  await server.listen();
  server.printUrls();
}
