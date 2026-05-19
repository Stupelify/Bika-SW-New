describe('connectDatabase — retry logic', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('succeeds immediately when DB is available on first try', async () => {
    const prisma = require('../config/database').default;
    jest.spyOn(prisma, '$connect').mockResolvedValueOnce(undefined);
    const { connectDatabase } = require('../config/database');
    await expect(connectDatabase()).resolves.toBeUndefined();
    expect(prisma.$connect).toHaveBeenCalledTimes(1);
  });

  it('retries and succeeds on second attempt', async () => {
    const prisma = require('../config/database').default;
    jest.spyOn(prisma, '$connect')
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(undefined);
    const { connectDatabase } = require('../config/database');
    await expect(connectDatabase({ retryDelayMs: 0 })).resolves.toBeUndefined();
    expect(prisma.$connect).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting all retries without calling process.exit', async () => {
    const prisma = require('../config/database').default;
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    jest.spyOn(prisma, '$connect').mockRejectedValue(new Error('DB down'));
    const { connectDatabase } = require('../config/database');
    await expect(connectDatabase({ maxRetries: 2, retryDelayMs: 0 })).rejects.toThrow('DB down');
    expect(mockExit).not.toHaveBeenCalled();
    mockExit.mockRestore();
  });
});
