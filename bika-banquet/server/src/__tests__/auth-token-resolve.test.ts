import fs from 'fs';
import path from 'path';

describe('resolveToken — Authorization header only', () => {
  it('query string token approach is removed', () => {
    // This is a static assertion: if resolveToken still had query fallback,
    // requests with only ?token= would be authenticated.
    // We document the intended behavior here as a specification test.
    const resolveTokenSource = fs.readFileSync(
      path.join(__dirname, '../middleware/auth.middleware.ts'),
      'utf8'
    );
    expect(resolveTokenSource).not.toContain('req.query.token');
    expect(resolveTokenSource).not.toContain('queryToken');
  });
});
