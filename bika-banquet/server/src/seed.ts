import prisma from './config/database';
import { hashPassword } from './utils/auth';
import logger from './utils/logger';

async function main() {
  try {
    logger.info('🌱 Starting database seed...');

    // Create permissions
    const permissions = [
      { name: 'view_dashboard', description: 'View dashboard' },
      { name: 'view_reports', description: 'View analytics and reports' },
      { name: 'view_calendar', description: 'View calendar' },
      { name: 'add_user', description: 'Add users' },
      { name: 'view_user', description: 'View users' },
      { name: 'edit_user', description: 'Edit users' },
      { name: 'delete_user', description: 'Delete users' },
      { name: 'add_customer', description: 'Add customers' },
      { name: 'view_customer', description: 'View customers' },
      { name: 'edit_customer', description: 'Edit customers' },
      { name: 'delete_customer', description: 'Delete customers' },
      { name: 'assign_role', description: 'Assign roles' },
      { name: 'add_role', description: 'Add roles' },
      { name: 'view_role', description: 'View roles' },
      { name: 'edit_role', description: 'Edit roles' },
      { name: 'delete_role', description: 'Delete roles' },
      { name: 'manage_permission', description: 'Manage permissions' },
      { name: 'add_permission', description: 'Add permissions' },
      { name: 'view_permission', description: 'View permissions' },
      { name: 'edit_permission', description: 'Edit permissions' },
      { name: 'delete_permission', description: 'Delete permissions' },
      { name: 'add_item', description: 'Add items' },
      { name: 'view_item', description: 'View items' },
      { name: 'edit_item', description: 'Edit items' },
      { name: 'delete_item', description: 'Delete items' },
      { name: 'add_itemtype', description: 'Add item types' },
      { name: 'view_itemtype', description: 'View item types' },
      { name: 'edit_itemtype', description: 'Edit item types' },
      { name: 'delete_itemtype', description: 'Delete item types' },
      { name: 'add_hall', description: 'Add halls' },
      { name: 'view_hall', description: 'View halls' },
      { name: 'edit_hall', description: 'Edit halls' },
      { name: 'delete_hall', description: 'Delete halls' },
      { name: 'add_banquet', description: 'Add banquets' },
      { name: 'view_banquet', description: 'View banquets' },
      { name: 'edit_banquet', description: 'Edit banquets' },
      { name: 'delete_banquet', description: 'Delete banquets' },
      { name: 'add_booking', description: 'Add bookings' },
      { name: 'view_booking', description: 'View bookings' },
      { name: 'edit_booking', description: 'Edit bookings' },
      { name: 'delete_booking', description: 'Delete bookings' },
      { name: 'add_enquiry', description: 'Add enquiries' },
      { name: 'view_enquiry', description: 'View enquiries' },
      { name: 'edit_enquiry', description: 'Edit enquiries' },
      { name: 'delete_enquiry', description: 'Delete enquiries' },
      { name: 'send_templatemenu', description: 'Send template menu' },
      { name: 'download_templatemenu', description: 'Download template menu' },
      { name: 'add_templatemenu', description: 'Add template menu' },
      { name: 'view_templatemenu', description: 'View template menu' },
      { name: 'edit_templatemenu', description: 'Edit template menu' },
      { name: 'delete_templatemenu', description: 'Delete template menu' },
      { name: 'manage_payments', description: 'Manage payments' },
      { name: 'manage_enquiries', description: 'Manage enquiries' },
      { name: 'manage_bookings', description: 'Manage bookings' },
      { name: 'manage_customers', description: 'Manage customers' },
      { name: 'manage_users', description: 'Manage users' },
      { name: 'manage_roles', description: 'Manage roles and permissions' },
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      });
    }

    logger.info('✅ Permissions created');

    // Create roles
    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Full system access',
      },
    });

    const managerRole = await prisma.role.upsert({
      where: { name: 'Manager' },
      update: {},
      create: {
        name: 'Manager',
        description: 'Booking and operations management',
      },
    });

    const employeeRole = await prisma.role.upsert({
      where: { name: 'Employee' },
      update: {},
      create: {
        name: 'Employee',
        description: 'Operational access',
      },
    });
    void employeeRole;

    logger.info('✅ Roles created');

    // Assign all permissions to Admin
    const allPermissions = await prisma.permission.findMany();
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }

    logger.info('✅ Admin permissions assigned');

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
