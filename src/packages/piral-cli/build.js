const fs = require('fs');
const path = require('path');
const bundler = require('@zeit/ncc');

function resolvePath(m) {
  try {
    return require.resolve(m);
  } catch (err) {
    console.error(err);
  }
}

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
    const m = `${source}/${file}`;
    const p = resolvePath(m);

    if (p) {
      assets[file] = {
        source: fs.readFileSync(p),
      };
    }
  }
}

function writeAssets(target, assets) {
  for (const assetName of Object.keys(assets)) {
    if (!assetName.endsWith('.d.ts')) {
      const p = path.resolve(target, assetName);
      createDirectory(path.dirname(p));

      fs.writeFileSync(p, assets[assetName].source);
    }
  }
}

function writeCode(target, code) {
  fs.writeFileSync(path.resolve(target, 'index.js'), code, 'utf8');
}

function parcelAssets(assets) {
  copyFiles(assets, 'parcel-bundler/src/builtins', ['helpers.min.js', 'helpers.js', 'prelude.js', 'prelude2.js']);
  assets['Pipeline.js'] = {
    source: Buffer.from(`module.exports = require('../pipeline');`, 'utf8'),
  };
  return assets;
}

function pipelineAssets(assets) {
  copyFiles(assets, 'parcel-bundler/src', ['assets/JSAsset.js', 'assets/HTMLAsset.js']);
  return assets;
}

function parcelCode(code) {
  return code.split("__dirname, '../builtins/").join("__dirname, '");
}

function replaceAll(fn, original, modified) {
  const content = fs.readFileSync(fn, 'utf8');
  fs.writeFileSync(fn, content.split(original).join(modified), 'utf8');
}

function bundle(source, target, modifyAssets = assets => assets, modifyCode = code => code) {
  console.log('Bundling "%s" ...', source);
  return bundler(source, {
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
  }).then(
    ({ code, assets }) => {
      createDirectory(target);
      writeCode(target, modifyCode(code));
      writeAssets(target, modifyAssets(assets));
      console.log('Bundled "%s"!', source);
    },
    err => {
      console.log('Failed bundling "%s"!', source);
      console.log(err);
    },
  );
}

Promise.resolve()
  .then(() => bundle('./lib/index.js', path.resolve(__dirname, 'dist', 'bundle'), parcelAssets, parcelCode))
  .then(() => bundle(resolvePath('parcel-bundler/src/Pipeline'), path.resolve(__dirname, 'dist', 'pipeline'), pipelineAssets))
  .then(() => replaceAll(path.resolve(__dirname, 'lib', 'select.js'), `'commands'`, `'../dist/bundle'`));
