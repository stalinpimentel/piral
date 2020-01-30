const fs = require('fs');
const path = require('path');

function createDirectory(targetDir) {
  const sep = '/';
  const initDir = sep;

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(parentDir, childDir);

    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') {
        return curDir;
      }

      if (err.code === 'ENOENT') {
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;

      if (!caughtErr || (caughtErr && curDir === path.resolve(targetDir))) {
        throw err;
      }
    }

    return curDir;
  }, initDir);
}

function copyFiles(assets, source, files) {
  for (const file of files) {
    const p = require.resolve(`${source}/${file}`);
    assets[file] = {
      source: fs.readFileSync(p),
    };
  }
}

require('@zeit/ncc')('./src/index.ts', {
  cache: false,
  externals: ['typescript', 'deasync'],
  filterAssetBase: process.cwd(),
  minify: false, // set to true later
  sourceMap: false,
  sourceMapRegister: false,
  watch: false,
  v8cache: false,
  quiet: false,
  debugLog: false,
}).then(({ code, assets }) => {
  const target = path.resolve(__dirname, 'lib', 'bundle');
  createDirectory(target);
  copyFiles(assets, 'parcel-bundler/src/builtins', ['helpers.min.js', 'helpers.js', 'prelude.js', 'prelude2.js']);

  code = code.split("__dirname, '../builtins/").join("__dirname, '");

  console.log('Writing index.js ...');
  fs.writeFileSync(path.resolve(target, 'index.js'), code, 'utf8');
  console.log('Wrote index.js!');

  for (const assetName of Object.keys(assets)) {
    console.log('Inspect %s', assetName);

    if (!assetName.endsWith('.d.ts')) {
      const p = path.resolve(target, assetName);
      createDirectory(path.dirname(p));

      console.log('Writing %s ...', assetName);
      fs.writeFileSync(p, assets[assetName].source);
      console.log('Wrote %s to %s!', assetName, p);
    }
  }
});
