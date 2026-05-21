import fs from 'fs';
import path from 'path';

describe('migration guard — entrypoint.sh', () => {
  const entrypointPath = path.join(__dirname, '../../entrypoint.sh');

  it('entrypoint.sh exists', () => {
    expect(fs.existsSync(entrypointPath)).toBe(true);
  });

  it('does not run prisma migrate deploy on startup', () => {
    const content = fs.readFileSync(entrypointPath, 'utf8');
    expect(content).not.toContain('prisma migrate deploy');
  });

  it('contains pm2-runtime', () => {
    const content = fs.readFileSync(entrypointPath, 'utf8');
    expect(content).toContain('pm2-runtime');
  });
});
