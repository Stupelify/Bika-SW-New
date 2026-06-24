import prisma from '../config/database';
import { isLastActiveAdmin, userHasAdminRole } from '../utils/adminGuard';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    userRole: {
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  },
}));

const findUserRoles = prisma.userRole.findMany as unknown as jest.Mock;
const countUsers = prisma.user.count as unknown as jest.Mock;

describe('adminGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('userHasAdminRole', () => {
    it('treats Admin role names case-insensitively', async () => {
      findUserRoles.mockResolvedValue([
        { role: { name: 'manager' } },
        { role: { name: 'ADMIN' } },
      ]);

      await expect(userHasAdminRole('user-1')).resolves.toBe(true);
      expect(findUserRoles).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { role: { select: { name: true } } },
      });
    });

    it('returns false when the user has no Admin role', async () => {
      findUserRoles.mockResolvedValue([{ role: { name: 'Sales' } }]);

      await expect(userHasAdminRole('user-1')).resolves.toBe(false);
    });
  });

  describe('isLastActiveAdmin', () => {
    it('does not count non-admin users as the last active admin', async () => {
      findUserRoles.mockResolvedValue([{ role: { name: 'Manager' } }]);

      await expect(isLastActiveAdmin('user-1')).resolves.toBe(false);
      expect(countUsers).not.toHaveBeenCalled();
    });

    it('returns true when an admin has no other active admins', async () => {
      findUserRoles.mockResolvedValue([{ role: { name: 'Admin' } }]);
      countUsers.mockResolvedValue(0);

      await expect(isLastActiveAdmin('admin-1')).resolves.toBe(true);
      expect(countUsers).toHaveBeenCalledWith({
        where: {
          id: { not: 'admin-1' },
          isActive: true,
          userRoles: {
            some: { role: { name: { equals: 'Admin', mode: 'insensitive' } } },
          },
        },
      });
    });

    it('returns false when another active admin remains', async () => {
      findUserRoles.mockResolvedValue([{ role: { name: 'Admin' } }]);
      countUsers.mockResolvedValue(1);

      await expect(isLastActiveAdmin('admin-1')).resolves.toBe(false);
    });
  });
});
