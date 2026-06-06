import fs from 'fs';
import path from 'path';
import { PERMISSION_NAMES } from '../config/permissions';

/**
 * Guards against permission-catalog drift: every permission string referenced
 * by a route via requirePermission(...) must exist in the single source of
 * truth (src/config/permissions.ts). This is what previously broke for
 * manage_menu / manage_halls / cancel_booking — they were required by routes
 * but never defined, so they could not be granted to any role.
 */
describe('permission registry parity', () => {
  const routesDir = path.join(__dirname, '..', 'routes');

  function collectReferencedPermissions(): { permission: string; file: string }[] {
    const refs: { permission: string; file: string }[] = [];
    const files = fs.readdirSync(routesDir).filter((f) => f.endsWith('.ts'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
      // Capture each requirePermission(...) call (may span multiple lines).
      const callRe = /requirePermission\(([\s\S]*?)\)/g;
      let call: RegExpExecArray | null;
      while ((call = callRe.exec(content)) !== null) {
        const strRe = /['"]([^'"]+)['"]/g;
        let str: RegExpExecArray | null;
        while ((str = strRe.exec(call[1])) !== null) {
          refs.push({ permission: str[1], file });
        }
      }
    }
    return refs;
  }

  it('finds permission references to validate (sanity check)', () => {
    expect(collectReferencedPermissions().length).toBeGreaterThan(0);
  });

  it('every permission referenced in routes exists in the registry', () => {
    const unknown = collectReferencedPermissions().filter(
      (ref) => !PERMISSION_NAMES.has(ref.permission)
    );
    if (unknown.length > 0) {
      const detail = unknown
        .map((u) => `  - "${u.permission}" referenced in routes/${u.file}`)
        .join('\n');
      throw new Error(
        'Route(s) reference permissions missing from src/config/permissions.ts:\n' +
          detail
      );
    }
    expect(unknown).toHaveLength(0);
  });
});
