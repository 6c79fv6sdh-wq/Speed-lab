// Always restore the production build, including after a failed browser check.
import { spawnSync } from 'node:child_process';
const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status ?? 1;
};
let status = run('npm', ['run', 'build']);
if (status === 0) {
  try {
    status = run(process.execPath, ['e2e/make-fixture.mjs']);
    if (status === 0) status = run(process.execPath, ['e2e/run.mjs']);
  } finally {
    const restored = run('npm', ['run', 'build']);
    if (restored) status = restored;
  }
}
process.exitCode = status;
