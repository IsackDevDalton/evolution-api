const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageLockPath = path.join(rootDir, 'package-lock.json');

function parseVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([A-Za-z0-9.-]+))?$/.exec(version);

  if (!match) {
    throw new Error(`Version no válida: ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    suffix: match[4] || '',
  };
}

function formatVersion({ major, minor, patch, suffix }) {
  return suffix ? `${major}.${minor}.${patch}-${suffix}` : `${major}.${minor}.${patch}`;
}

function bumpVersion(version, bumpType = 'patch') {
  const current = parseVersion(version);

  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    throw new Error(`Tipo de actualización no válido: ${bumpType}`);
  }

  const next = { ...current };

  if (bumpType === 'major') {
    next.major += 1;
    next.minor = 0;
    next.patch = 0;
  } else if (bumpType === 'minor') {
    next.minor += 1;
    next.patch = 0;
  } else {
    next.patch += 1;
  }

  if (current.suffix) {
    next.suffix = current.suffix;
  }

  return formatVersion(next);
}

function syncVersions(targetVersion) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const lock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));

  const nextVersion = targetVersion || pkg.version;
  pkg.version = nextVersion;
  lock.version = nextVersion;

  if (lock.packages && lock.packages['']) {
    lock.packages[''].version = nextVersion;
  }

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
  fs.writeFileSync(packageLockPath, `${JSON.stringify(lock, null, 2)}\n`);

  return nextVersion;
}

const args = process.argv.slice(2);
let targetVersion;
let bumpType = 'patch';

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === '--version' && args[i + 1]) {
    targetVersion = args[i + 1];
    i += 1;
  } else if (arg === '--bump' && args[i + 1]) {
    bumpType = args[i + 1];
    i += 1;
  }
}

if (!targetVersion) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  targetVersion = bumpType ? bumpVersion(pkg.version, bumpType) : pkg.version;
}

const finalVersion = syncVersions(targetVersion);
console.log(`Versión sincronizada: ${finalVersion}`);
