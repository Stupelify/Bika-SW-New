import prisma from './config/database';
import { hashPassword } from './utils/auth';
import logger from './utils/logger';
import { syncPermissions } from './utils/syncPermissions';

async function main() {
  try {
    logger.info('🌱 Starting database seed...');

    // Permissions + built-in roles (Admin/Manager/Employee) are managed by the
    // shared registry in src/config/permissions.ts and reconciled idempotently
    // here. This keeps the seed in lock-step with boot-time/CLI syncs.
    await syncPermissions();

    logger.info('✅ Permissions and roles synced');

    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'Admin' },
    });

    // Create default admin user
    const adminPassword = await hashPassword('admin123');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@bikabanquet.com' },
      update: {},
      create: {
        email: 'admin@bikabanquet.com',
        password: adminPassword,
        name: 'Admin User',
        isVerified: true,
      },
    });

    // Assign admin role to admin user
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    logger.info('✅ Admin user created (email: admin@bikabanquet.com, password: admin123)');

    // Create sample meal slots
    const mealSlots = [
      { name: 'Breakfast', startTime: '08:00', endTime: '11:00' },
      { name: 'Lunch', startTime: '12:00', endTime: '15:00' },
      { name: 'Hi-Tea', startTime: '16:00', endTime: '18:00' },
      { name: 'Dinner', startTime: '19:00', endTime: '23:00' },
    ];

    for (const slot of mealSlots) {
      await prisma.mealSlot.upsert({
        where: { name: slot.name },
        update: {},
        create: slot,
      });
    }

    logger.info('✅ Meal slots created');

    // Create sample item types
    const itemTypes = [
      { name: 'Starters' },
      { name: 'Main Course' },
      { name: 'Breads' },
      { name: 'Rice' },
      { name: 'Desserts' },
      { name: 'Beverages' },
    ];

    for (const type of itemTypes) {
      await prisma.itemType.upsert({
        where: { name: type.name },
        update: {},
        create: type,
      });
    }

    logger.info('✅ Item types created');

    // Create sample banquet and hall
    const banquet = await prisma.banquet.upsert({
      where: { name: 'Bika Grand Banquet' },
      update: {},
      create: {
        name: 'Bika Grand Banquet',
        location: 'Downtown',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '+91 22 1234 5678',
      },
    });

    await prisma.hall.upsert({
      where: { name: 'Grand Hall' },
      update: {},
      create: {
        name: 'Grand Hall',
        banquetId: banquet.id,
        capacity: 500,
        floatingCapacity: 600,
        area: 5000,
        basePrice: 50000,
      },
    });

    logger.info('✅ Sample banquet and hall created');

    logger.info('🎉 Database seed completed successfully!');
  } catch (error) {
    logger.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
