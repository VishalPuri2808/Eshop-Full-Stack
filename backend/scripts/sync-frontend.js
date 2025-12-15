const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendRoot = path.resolve(__dirname, '..');
const frontendRoot = path.resolve(backendRoot, '..', 'frontend');
const frontendDist = path.join(frontendRoot, 'dist');
const targetDist = path.join(backendRoot, 'frontend-dist');

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function ensureFrontendBuilt() {
  run('npm run build', frontendRoot);
  if (!fs.existsSync(frontendDist)) {
    throw new Error(`Frontend build output not found at ${frontendDist}`);
  }
}

function copyDist() {
  fs.rmSync(targetDist, { recursive: true, force: true });
  fs.cpSync(frontendDist, targetDist, { recursive: true });
}

try {
  ensureFrontendBuilt();
  copyDist();
  console.log('Frontend dist synced.');
} catch (err) {
  console.error('Failed to sync frontend build:', err.message || err);
  process.exit(1);
}
