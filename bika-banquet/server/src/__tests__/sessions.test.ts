import prisma from '../config/database';
import { invalidateSessionCacheByToken } from '../middleware/auth.middleware';
import { refreshUserSessions, refreshUsersByRole } from '../utils/sessions';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    session: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../middleware/auth.middleware', () => ({
  invalidateSessionCacheByToken: jest.fn(),
}));

const findSessions = prisma.session.findMany as unknown as jest.Mock;
const deleteSessions = prisma.session.deleteMany as unknown as jest.Mock;
const findUserRoles = prisma.userRole.findMany as unknown as jest.Mock;
const invalidateSession = invalidateSessionCacheByToken as jest.Mock;

describe('session refresh helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateSession.mockResolvedValue(undefined);
  });

  it('refreshes a user by invalidating cached session tokens without deleting sessions', async () => {
    findSessions.mockResolvedValue([{ token: 'token-1' }, { token: 'token-2' }]);

    await refreshUserSessions('user-1');

    expect(findSessions).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { token: true },
    });
    expect(invalidateSession).toHaveBeenCalledTimes(2);
    expect(invalidateSession).toHaveBeenNthCalledWith(1, 'token-1');
    expect(invalidateSession).toHaveBeenNthCalledWith(2, 'token-2');
    expect(deleteSessions).not.toHaveBeenCalled();
  });

  it('continues refreshing remaining sessions when one cache invalidation fails', async () => {
    findSessions.mockResolvedValue([{ token: 'bad-token' }, { token: 'good-token' }]);
    invalidateSession
      .mockRejectedValueOnce(new Error('redis unavailable'))
      .mockResolvedValueOnce(undefined);

    await expect(refreshUserSessions('user-1')).resolves.toBeUndefined();
    expect(invalidateSession).toHaveBeenCalledTimes(2);
  });

  it('refreshes every user assigned to a changed role', async () => {
    findUserRoles.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }]);
    findSessions.mockImplementation(({ where }: { where: { userId: string } }) =>
      Promise.resolve([{ token: `${where.userId}-token` }])
    );

    await refreshUsersByRole('role-1');

    expect(findUserRoles).toHaveBeenCalledWith({
      where: { roleId: 'role-1' },
      select: { userId: true },
    });
    expect(invalidateSession).toHaveBeenCalledWith('user-1-token');
    expect(invalidateSession).toHaveBeenCalledWith('user-2-token');
  });
});
