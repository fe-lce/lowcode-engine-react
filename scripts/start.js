#!/usr/bin/env node
const os = require('os');
const execa = require('execa');

async function start() {
  const [, , pkgName = '@felce/lowcode-react-simulator-renderer'] = process.argv;
  await execa.command(`lerna exec --scope ${pkgName} -- pnpm build:watch`, {
    stdio: 'inherit',
    encoding: 'utf-8',
  });
  await execa.command(`lerna exec --scope ${pkgName} -- pnpm preview`, {
    stdio: 'inherit',
    encoding: 'utf-8',
  });
}

os.type() === 'Windows_NT'
  ? start()
  : execa.command('scripts/start.sh', { stdio: 'inherit', encoding: 'utf-8' });
