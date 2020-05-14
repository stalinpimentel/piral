import { resolve, join } from 'path';
import { LogLevels, NpmClientType } from '../types';
import {
  readJson,
  checkExistingDirectory,
  installDependencies,
  setLogLevel,
  progress,
  fail,
  log,
  logDone,
  updateExistingJson,
  checkExists,
  repositoryUrl,
  findSpecificVersion,
  determineNpmClient,
} from '../common';

export interface UpgradePiralOptions {
  version?: string;
  target?: string;
  logLevel?: LogLevels;
  install?: boolean;
  npmClient?: NpmClientType;
}

export const upgradePiralDefaults: UpgradePiralOptions = {
  version: 'latest',
  target: '.',
  logLevel: LogLevels.info,
  install: true,
  npmClient: undefined,
};

function updateDependencies(deps: Record<string, string>, version: string) {
  if (deps) {
    for (const name of Object.keys(deps)) {
      try {
        const data = require(`${name}/package.json`);
        const packageRepoUrl = data?.repository?.url;

        if (packageRepoUrl === repositoryUrl) {
          deps[name] = version;
        }
      } catch {
        log('packageNotInstalled_0023', name);
      }
    }
  }
}

export async function upgradePiral(baseDir = process.cwd(), options: UpgradePiralOptions = {}) {
  const {
    version = upgradePiralDefaults.version,
    target = upgradePiralDefaults.target,
    logLevel = upgradePiralDefaults.logLevel,
    install = upgradePiralDefaults.install,
  } = options;
  setLogLevel(logLevel);
  const root = resolve(baseDir, target);
  const valid = await checkExistingDirectory(root);
  const exists = await checkExists(join(root, 'package.json'));

  if (!valid || !exists) {
    fail('packageJsonNotFound_0020');
  }

  const npmClient = await determineNpmClient(root, options.npmClient);

  progress(`Checking provided version ...`);
  const realVersion = await findSpecificVersion('piral-cli', version);

  if (!realVersion) {
    fail('packageVersionInvalid_0024', version);
  }

  log('generalDebug_0003', `Found real version: "${version}".`);
  const pckg = await readJson(root, 'package.json');
  log('generalDebug_0003', `Updating all dependencies ...`);

  progress(`Reading installed packages ...`);
  updateDependencies(pckg.devDependencies, realVersion);
  updateDependencies(pckg.dependencies, realVersion);

  log('generalDebug_0003', `Patching the package.json ...`);
  await updateExistingJson(root, 'package.json', pckg);

  if (install) {
    progress(`Updating the NPM packages to %s ...`, version);
    await installDependencies(npmClient, root);
  }

  logDone('Piral instance upgraded successfully!');
}
