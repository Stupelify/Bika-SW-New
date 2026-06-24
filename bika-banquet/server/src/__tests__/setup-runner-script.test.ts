import fs from 'fs';
import path from 'path';

describe('setup-github-runner.sh', () => {
  const scriptPath = path.join(__dirname, '../../../scripts/setup-github-runner.sh');

  it('installs the service as the dedicated runner user', () => {
    const content = fs.readFileSync(scriptPath, 'utf8');

    expect(content).toContain('./svc.sh install "$RUNNER_USER"');
  });
});
