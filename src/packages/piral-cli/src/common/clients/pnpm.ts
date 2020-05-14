import { resolve } from 'path';
import { log } from '../log';
import { isWindows } from '../info';
import { runScript } from '../scripts';
import { MemoryStream } from '../MemoryStream';

const pnpmCommand = isWindows ? 'pnpm.cmd' : 'pnpm';

function runPnpmProcess(args: Array<string>, target: string, output?: NodeJS.WritableStream) {
  log('generalDebug_0003', 'Starting the Pnpm process ...');
  const cwd = resolve(process.cwd(), target);
  const cmd = [pnpmCommand, ...args].join(' ');
  log('generalDebug_0003', `Applying Pnpm cmd "${cmd}" in directory "${cwd}".`);
  return runScript(cmd, cwd, output);
}

function convert(flags: Array<string>) {
  return flags.map(flag => {
    switch (flag) {
      case '--no-save':
        // unfortunately no (https://github.com/pnpm/pnpm/issues/1237)
        return '';
      default:
        return flag;
    }
  });
}

export async function installDependencies(target = '.', ...flags: Array<string>) {
  const ms = new MemoryStream();
  await runPnpmProcess(['install', ...convert(flags)], target, ms);
  log('generalDebug_0003', `Pnpm install dependencies result: ${ms.value}`);
  return ms.value;
}

export async function installPackage(packageRef: string, target = '.', ...flags: Array<string>) {
  const ms = new MemoryStream();
  await runPnpmProcess(['add', packageRef, ...convert(flags)], target, ms);
  log('generalDebug_0003', `Pnpm install package result: ${ms.value}`);
  return ms.value;
}
