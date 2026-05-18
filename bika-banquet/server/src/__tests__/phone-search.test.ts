import prisma from '../config/database';

describe('phone search indexes', () => {
  it('pg_trgm extension is enabled', async () => {
    const result = await prisma.$queryRaw<{ extname: string }[]>`
      SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'
    `;
    expect(result.length).toBe(1);
    expect(result[0].extname).toBe('pg_trgm');
  });

  it('GIN index exists on Customer phoneE164', async () => {
    const result = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'customers'
      AND indexdef ILIKE '%gin%'
      AND indexdef ILIKE '%"phoneE164"%'
    `;
    expect(result.length).toBeGreaterThan(0);
  });
});
