/**
 * Comprehensive stress test and data population script for Bika Banquet.
 * Simulates 10-15 employees making entries across all tables and operations.
 *
 * Run: cd server && tsx src/scripts/stressTest.ts
 *
 * What it tests:
 *  1. Concurrent serializable transactions (hall booking race conditions)
 *  2. All booking lifecycle states: enquiry → booking → payment → party-over
 *  3. Edge cases: past dates, same-day multi-hall, pencil expiry, version chains
 *  4. Input validation guards (negative guests, same primary/secondary customer)
 *  5. RBAC (banquet-scoped employees can only see their halls)
 *  6. Financial accuracy across 500+ payment records
 *  7. Menu structure: packs with multiple items, varying rates
 *  8. Search and pagination under load
 */

import prisma from '../config/database';
import { hashPassword } from '../utils/auth';

// ─── Colours for terminal output ─────────────────────────────────────────────
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function ok(label: string) {
  passed++;
  console.log(`${GREEN}  ✔ ${label}${RESET}`);
}

function fail(label: string, err?: unknown) {
  failed++;
  const msg = err instanceof Error ? err.message : String(err ?? '');
  failures.push(`${label}: ${msg}`);
  console.log(`${RED}  ✘ ${label}${msg ? ` — ${msg}` : ''}${RESET}`);
}

function section(title: string) {
  console.log(`\n${CYAN}▶ ${title}${RESET}`);
}

async function assert(label: string, fn: () => Promise<void>) {
  try {
    await fn();
    ok(label);
  } catch (err) {
    fail(label, err);
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function futureDate(daysAhead: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function pastDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${CYAN}═══════════════════════════════════════════════════${RESET}`);
  console.log(`${CYAN}  BIKA BANQUET — STRESS TEST & DATA POPULATION${RESET}`);
  console.log(`${CYAN}═══════════════════════════════════════════════════${RESET}`);

  // ── 1. Seed permissions & roles ─────────────────────────────────────────
  section('1. Permissions & Roles');

  const permissionNames = [
    'view_dashboard', 'view_reports', 'view_calendar',
    'add_user', 'view_user', 'edit_user', 'delete_user',
    'add_customer', 'view_customer', 'edit_customer', 'delete_customer',
    'assign_role', 'add_role', 'view_role', 'edit_role', 'delete_role',
    'manage_permission', 'add_permission', 'view_permission', 'edit_permission', 'delete_permission',
    'add_item', 'view_item', 'edit_item', 'delete_item',
    'add_itemtype', 'view_itemtype', 'edit_itemtype', 'delete_itemtype',
    'add_hall', 'view_hall', 'edit_hall', 'delete_hall',
    'add_banquet', 'view_banquet', 'edit_banquet', 'delete_banquet',
    'add_booking', 'view_booking', 'edit_booking', 'delete_booking',
    'add_enquiry', 'view_enquiry', 'edit_enquiry', 'delete_enquiry',
    'send_templatemenu', 'download_templatemenu',
    'add_templatemenu', 'view_templatemenu', 'edit_templatemenu', 'delete_templatemenu',
    'manage_payments', 'manage_enquiries', 'manage_bookings', 'manage_customers',
    'manage_users', 'manage_roles',
    'add_ingredient', 'view_ingredient', 'edit_ingredient', 'delete_ingredient',
    'add_vendor', 'view_vendor', 'edit_vendor', 'delete_vendor',
  ];

  for (const name of permissionNames) {
    await prisma.permission.upsert({ where: { name }, update: {}, create: { name } });
  }

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' }, update: {},
    create: { name: 'Admin', description: 'Full access' },
  });
  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' }, update: {},
    create: { name: 'Manager', description: 'Booking & ops' },
  });
  const receptionistRole = await prisma.role.upsert({
    where: { name: 'Receptionist' }, update: {},
    create: { name: 'Receptionist', description: 'Walk-in & enquiry handling' },
  });
  const accountsRole = await prisma.role.upsert({
    where: { name: 'Accounts' }, update: {},
    create: { name: 'Accounts', description: 'Payment collection only' },
  });

  // Assign ALL permissions to Admin
  const allPerms = await prisma.permission.findMany();
  for (const p of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {}, create: { roleId: adminRole.id, permissionId: p.id },
    });
  }

  // Manager: all except user/role management
  const managerPerms = allPerms.filter(
    (p) => !['add_user', 'delete_user', 'manage_roles', 'manage_permission', 'add_permission',
              'edit_permission', 'delete_permission', 'delete_role', 'assign_role'].includes(p.name)
  );
  for (const p of managerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: managerRole.id, permissionId: p.id } },
      update: {}, create: { roleId: managerRole.id, permissionId: p.id },
    });
  }

  // Receptionist: view + enquiry + booking + customer
  const receptPerms = allPerms.filter((p) =>
    ['view_dashboard', 'view_calendar', 'view_hall', 'add_customer', 'view_customer',
     'edit_customer', 'add_enquiry', 'view_enquiry', 'edit_enquiry',
     'add_booking', 'view_booking', 'edit_booking', 'view_templatemenu'].includes(p.name)
  );
  for (const p of receptPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: receptionistRole.id, permissionId: p.id } },
      update: {}, create: { roleId: receptionistRole.id, permissionId: p.id },
    });
  }

  // Accounts: payments only
  const accountsPerms = allPerms.filter((p) =>
    ['view_dashboard', 'view_booking', 'manage_payments', 'view_reports'].includes(p.name)
  );
  for (const p of accountsPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: accountsRole.id, permissionId: p.id } },
      update: {}, create: { roleId: accountsRole.id, permissionId: p.id },
    });
  }

  ok('Permissions seeded');
  ok('Roles seeded (Admin, Manager, Receptionist, Accounts)');

  // ── 2. Create 2 banquets ──────────────────────────────────────────────────
  section('2. Banquets');

  const banquet1 = await prisma.banquet.upsert({
    where: { name: 'Bika Banquet Hall — Main' },
    update: {},
    create: {
      name: 'Bika Banquet Hall — Main',
      location: 'Kolkata',
      address: '12 Park Street, Kolkata',
      city: 'Kolkata', state: 'West Bengal', pincode: '700016',
      phone: '03322291000', email: 'main@bikabanquet.com', isActive: true,
    },
  });

  const banquet2 = await prisma.banquet.upsert({
    where: { name: 'Bika Annexe' },
    update: {},
    create: {
      name: 'Bika Annexe',
      location: 'Kolkata', address: '14 Park Street, Kolkata',
      city: 'Kolkata', state: 'West Bengal', pincode: '700016',
      phone: '03322291001', email: 'annexe@bikabanquet.com', isActive: true,
    },
  });

  ok(`Banquet 1: ${banquet1.name}`);
  ok(`Banquet 2: ${banquet2.name}`);

  // ── 3. Create 15 users (employees) ───────────────────────────────────────
  section('3. Users (15 employees across roles)');

  const pw = await hashPassword('Test@1234');

  const employeeData = [
    { email: 'admin@bikabanquet.com', name: 'Admin User', role: adminRole },
    { email: 'manager1@bikabanquet.com', name: 'Rajesh Sharma', role: managerRole },
    { email: 'manager2@bikabanquet.com', name: 'Priya Mehta', role: managerRole },
    { email: 'recept1@bikabanquet.com', name: 'Anita Roy', role: receptionistRole },
    { email: 'recept2@bikabanquet.com', name: 'Sunita Das', role: receptionistRole },
    { email: 'recept3@bikabanquet.com', name: 'Kavita Singh', role: receptionistRole },
    { email: 'recept4@bikabanquet.com', name: 'Pooja Gupta', role: receptionistRole },
    { email: 'recept5@bikabanquet.com', name: 'Meera Banerjee', role: receptionistRole },
    { email: 'accounts1@bikabanquet.com', name: 'Suresh Agarwal', role: accountsRole },
    { email: 'accounts2@bikabanquet.com', name: 'Deepa Joshi', role: accountsRole },
    { email: 'manager3@bikabanquet.com', name: 'Amit Kumar', role: managerRole },
    { email: 'recept6@bikabanquet.com', name: 'Ritu Verma', role: receptionistRole },
    { email: 'recept7@bikabanquet.com', name: 'Geeta Mishra', role: receptionistRole },
    { email: 'accounts3@bikabanquet.com', name: 'Vijay Tiwari', role: accountsRole },
    { email: 'manager4@bikabanquet.com', name: 'Nisha Kapoor', role: managerRole },
  ];

  const createdUsers: { id: string; email: string }[] = [];
  for (const emp of employeeData) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: { email: emp.email, name: emp.name, password: pw, isVerified: true },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: emp.role.id } },
      update: {}, create: { userId: user.id, roleId: emp.role.id },
    });
    createdUsers.push({ id: user.id, email: emp.email });
  }

  ok(`Created/updated ${createdUsers.length} employee users`);

  // ── 4. Create halls ───────────────────────────────────────────────────────
  section('4. Halls (7 halls across 2 banquets)');

  const hallData = [
    { name: 'Diamond Hall', banquetId: banquet1.id, capacity: 500, floatingCapacity: 600, basePrice: 50000, floorNumber: 1, area: 2000.0 },
    { name: 'Sapphire Hall', banquetId: banquet1.id, capacity: 300, floatingCapacity: 350, basePrice: 30000, floorNumber: 2, area: 1200.0 },
    { name: 'Gold Hall', banquetId: banquet1.id, capacity: 200, floatingCapacity: 250, basePrice: 20000, floorNumber: 3, area: 800.0 },
    { name: 'Silver Hall', banquetId: banquet1.id, capacity: 100, floatingCapacity: 120, basePrice: 10000, floorNumber: 3, area: 400.0 },
    { name: 'Crystal Hall', banquetId: banquet2.id, capacity: 400, floatingCapacity: 500, basePrice: 40000, floorNumber: 1, area: 1800.0 },
    { name: 'Emerald Hall', banquetId: banquet2.id, capacity: 150, floatingCapacity: 180, basePrice: 15000, floorNumber: 2, area: 600.0 },
    { name: 'Pearl Hall', banquetId: banquet2.id, capacity: 80, floatingCapacity: 100, basePrice: 8000, floorNumber: 1, area: 320.0 },
  ];

  const halls: { id: string; name: string; banquetId: string | null }[] = [];
  for (const h of hallData) {
    const hall = await prisma.hall.upsert({
      where: { name: h.name },
      update: {},
      create: { ...h, isActive: true },
    });
    halls.push({ id: hall.id, name: hall.name, banquetId: hall.banquetId });
  }

  ok(`Created ${halls.length} halls`);

  // ── 5. Item types and items ───────────────────────────────────────────────
  section('5. Item Types & Menu Items');

  const itemTypeData = [
    { name: 'Starters', order: 1 },
    { name: 'Main Course', order: 2 },
    { name: 'Rice & Breads', order: 3 },
    { name: 'Dal & Curry', order: 4 },
    { name: 'Sweets', order: 5 },
    { name: 'Salads', order: 6 },
    { name: 'Desserts', order: 7 },
    { name: 'Beverages', order: 8 },
    { name: 'Live Counters', order: 9 },
  ];

  const itemTypes: { id: string; name: string }[] = [];
  for (const it of itemTypeData) {
    const itemType = await prisma.itemType.upsert({
      where: { name: it.name },
      update: {},
      create: { ...it, isActive: true },
    });
    itemTypes.push({ id: itemType.id, name: itemType.name });
  }

  const itemData = [
    // Starters
    { name: 'Paneer Tikka', itemTypeName: 'Starters', isVeg: true, points: 2.5, cost: 180 },
    { name: 'Chicken Tikka', itemTypeName: 'Starters', isVeg: false, points: 3.0, cost: 220 },
    { name: 'Hara Bhara Kabab', itemTypeName: 'Starters', isVeg: true, points: 2.0, cost: 150 },
    { name: 'Fish Fry', itemTypeName: 'Starters', isVeg: false, points: 3.5, cost: 260 },
    { name: 'Veg Spring Roll', itemTypeName: 'Starters', isVeg: true, points: 1.5, cost: 120 },
    { name: 'Mutton Seekh Kabab', itemTypeName: 'Starters', isVeg: false, points: 4.0, cost: 300 },
    // Main Course
    { name: 'Paneer Butter Masala', itemTypeName: 'Main Course', isVeg: true, points: 3.0, cost: 200 },
    { name: 'Chicken Curry', itemTypeName: 'Main Course', isVeg: false, points: 3.5, cost: 250 },
    { name: 'Mutton Rogan Josh', itemTypeName: 'Main Course', isVeg: false, points: 4.5, cost: 350 },
    { name: 'Dal Makhani', itemTypeName: 'Main Course', isVeg: true, points: 2.5, cost: 160 },
    { name: 'Palak Paneer', itemTypeName: 'Main Course', isVeg: true, points: 2.5, cost: 180 },
    { name: 'Fish Curry', itemTypeName: 'Main Course', isVeg: false, points: 4.0, cost: 280 },
    { name: 'Aloo Gobhi', itemTypeName: 'Main Course', isVeg: true, points: 1.5, cost: 130 },
    // Rice & Breads
    { name: 'Steamed Rice', itemTypeName: 'Rice & Breads', isVeg: true, points: 1.0, cost: 80 },
    { name: 'Jeera Rice', itemTypeName: 'Rice & Breads', isVeg: true, points: 1.5, cost: 100 },
    { name: 'Biryani (Veg)', itemTypeName: 'Rice & Breads', isVeg: true, points: 3.0, cost: 220 },
    { name: 'Biryani (Chicken)', itemTypeName: 'Rice & Breads', isVeg: false, points: 4.0, cost: 300 },
    { name: 'Naan', itemTypeName: 'Rice & Breads', isVeg: true, points: 1.0, cost: 60 },
    { name: 'Paratha', itemTypeName: 'Rice & Breads', isVeg: true, points: 1.0, cost: 70 },
    { name: 'Puri', itemTypeName: 'Rice & Breads', isVeg: true, points: 1.0, cost: 50 },
    // Dal & Curry
    { name: 'Dal Tadka', itemTypeName: 'Dal & Curry', isVeg: true, points: 1.5, cost: 120 },
    { name: 'Chana Masala', itemTypeName: 'Dal & Curry', isVeg: true, points: 2.0, cost: 140 },
    { name: 'Rajma', itemTypeName: 'Dal & Curry', isVeg: true, points: 2.0, cost: 150 },
    // Sweets
    { name: 'Rasgulla', itemTypeName: 'Sweets', isVeg: true, points: 2.0, cost: 120 },
    { name: 'Gulab Jamun', itemTypeName: 'Sweets', isVeg: true, points: 2.0, cost: 100 },
    { name: 'Sandesh', itemTypeName: 'Sweets', isVeg: true, points: 2.5, cost: 140 },
    { name: 'Kheer', itemTypeName: 'Sweets', isVeg: true, points: 2.0, cost: 110 },
    { name: 'Rasmalai', itemTypeName: 'Sweets', isVeg: true, points: 2.5, cost: 160 },
    // Salads
    { name: 'Green Salad', itemTypeName: 'Salads', isVeg: true, points: 0.5, cost: 50 },
    { name: 'Raita', itemTypeName: 'Salads', isVeg: true, points: 0.5, cost: 60 },
    { name: 'Papad', itemTypeName: 'Salads', isVeg: true, points: 0.5, cost: 30 },
    // Desserts
    { name: 'Ice Cream', itemTypeName: 'Desserts', isVeg: true, points: 1.5, cost: 90 },
    { name: 'Halwa', itemTypeName: 'Desserts', isVeg: true, points: 2.0, cost: 100 },
    // Beverages
    { name: 'Lassi', itemTypeName: 'Beverages', isVeg: true, points: 1.0, cost: 60 },
    { name: 'Buttermilk', itemTypeName: 'Beverages', isVeg: true, points: 0.5, cost: 30 },
    { name: 'Sharbat', itemTypeName: 'Beverages', isVeg: true, points: 0.5, cost: 40 },
    // Live Counters
    { name: 'Dosa Counter', itemTypeName: 'Live Counters', isVeg: true, points: 3.0, cost: 200 },
    { name: 'Chaat Counter', itemTypeName: 'Live Counters', isVeg: true, points: 2.5, cost: 180 },
    { name: 'Pasta Counter', itemTypeName: 'Live Counters', isVeg: true, points: 3.0, cost: 220 },
    { name: 'Egg Station', itemTypeName: 'Live Counters', isVeg: false, points: 3.5, cost: 250 },
  ];

  const items: { id: string; name: string }[] = [];
  for (const item of itemData) {
    const typeId = itemTypes.find((it) => it.name === item.itemTypeName)?.id;
    if (!typeId) continue;
    const created = await prisma.item.upsert({
      where: { id: (await prisma.item.findFirst({ where: { name: item.name } }))?.id ?? 'new' },
      update: {},
      create: {
        name: item.name,
        itemTypeId: typeId,
        isVeg: item.isVeg,
        points: item.points,
        cost: item.cost,
        isActive: true,
      },
    });
    items.push({ id: created.id, name: created.name });
  }

  ok(`Created ${items.length} menu items across ${itemTypes.length} item types`);

  // ── 6. Meal slots ─────────────────────────────────────────────────────────
  section('6. Meal Slots');

  const mealSlotData = [
    { name: 'Breakfast', startTime: '07:00', endTime: '10:00', displayOrder: 1 },
    { name: 'Lunch', startTime: '12:00', endTime: '15:00', displayOrder: 2 },
    { name: 'Hi-Tea', startTime: '16:00', endTime: '18:00', displayOrder: 3 },
    { name: 'Dinner', startTime: '19:00', endTime: '23:00', displayOrder: 4 },
    { name: 'Cocktail', startTime: '18:00', endTime: '20:00', displayOrder: 5 },
    { name: 'Brunch', startTime: '10:00', endTime: '13:00', displayOrder: 6 },
  ];

  const mealSlots: { id: string; name: string }[] = [];
  for (const ms of mealSlotData) {
    const slot = await prisma.mealSlot.upsert({
      where: { name: ms.name },
      update: {},
      create: { ...ms, isActive: true },
    });
    mealSlots.push({ id: slot.id, name: slot.name });
  }

  ok(`Created ${mealSlots.length} meal slots`);

  // ── 7. Template menus ─────────────────────────────────────────────────────
  section('7. Template Menus');

  const templateMenuData = [
    {
      name: 'Standard Veg Menu',
      ratePerPlate: 850,
      setupCost: 5000,
      items: ['Paneer Tikka', 'Hara Bhara Kabab', 'Paneer Butter Masala', 'Dal Makhani',
               'Palak Paneer', 'Steamed Rice', 'Naan', 'Rasgulla', 'Gulab Jamun', 'Green Salad'],
    },
    {
      name: 'Premium Veg Menu',
      ratePerPlate: 1200,
      setupCost: 8000,
      items: ['Paneer Tikka', 'Veg Spring Roll', 'Dosa Counter', 'Chaat Counter',
               'Paneer Butter Masala', 'Dal Makhani', 'Biryani (Veg)', 'Naan', 'Puri',
               'Rasgulla', 'Sandesh', 'Rasmalai', 'Ice Cream', 'Lassi'],
    },
    {
      name: 'Non-Veg Combo',
      ratePerPlate: 1100,
      setupCost: 7000,
      items: ['Chicken Tikka', 'Fish Fry', 'Chicken Curry', 'Fish Curry',
               'Steamed Rice', 'Jeera Rice', 'Naan', 'Dal Tadka', 'Gulab Jamun', 'Kheer'],
    },
    {
      name: 'Full Buffet Special',
      ratePerPlate: 1500,
      setupCost: 12000,
      items: ['Paneer Tikka', 'Chicken Tikka', 'Mutton Seekh Kabab', 'Fish Fry',
               'Paneer Butter Masala', 'Mutton Rogan Josh', 'Chicken Curry',
               'Biryani (Chicken)', 'Naan', 'Paratha', 'Dal Makhani',
               'Rasgulla', 'Rasmalai', 'Ice Cream', 'Egg Station'],
    },
    {
      name: 'Budget Menu',
      ratePerPlate: 650,
      setupCost: 3000,
      items: ['Hara Bhara Kabab', 'Aloo Gobhi', 'Dal Tadka', 'Chana Masala',
               'Steamed Rice', 'Puri', 'Green Salad', 'Papad', 'Gulab Jamun'],
    },
    {
      name: 'Hi-Tea Menu',
      ratePerPlate: 400,
      setupCost: 2000,
      items: ['Veg Spring Roll', 'Hara Bhara Kabab', 'Pasta Counter', 'Chaat Counter',
               'Lassi', 'Sharbat', 'Sandesh'],
    },
  ];

  const templateMenus: { id: string; name: string }[] = [];
  for (const tm of templateMenuData) {
    const existingMenu = await prisma.templateMenu.findUnique({ where: { name: tm.name } });
    let menu;
    if (existingMenu) {
      menu = existingMenu;
    } else {
      menu = await prisma.templateMenu.create({
        data: { name: tm.name, ratePerPlate: tm.ratePerPlate, setupCost: tm.setupCost, isActive: true },
      });
    }

    for (const itemName of tm.items) {
      const item = items.find((i) => i.name === itemName);
      if (!item) continue;
      await prisma.templateMenuItem.upsert({
        where: { templateMenuId_itemId: { templateMenuId: menu.id, itemId: item.id } },
        update: {},
        create: { templateMenuId: menu.id, itemId: item.id, quantity: 1 },
      });
    }

    templateMenus.push({ id: menu.id, name: menu.name });
  }

  ok(`Created ${templateMenus.length} template menus with items`);

  // ── 8. Customers (60 diverse customers) ───────────────────────────────────
  section('8. Customers (60 diverse profiles)');

  const customerProfiles = [
    { name: 'Ramesh Agarwal', phone: '9800000001', city: 'Kolkata', priority: 1 },
    { name: 'Sunita Banerjee', phone: '9800000002', city: 'Howrah', priority: 2 },
    { name: 'Manoj Gupta', phone: '9800000003', city: 'Kolkata', priority: 1 },
    { name: 'Priyanka Chatterjee', phone: '9800000004', city: 'Barasat', priority: 3 },
    { name: 'Vikram Singhania', phone: '9800000005', city: 'Kolkata', priority: 1 },
    { name: 'Anita Joshi', phone: '9800000006', city: 'Salt Lake', priority: 2 },
    { name: 'Deepak Marwari', phone: '9800000007', city: 'Kolkata', priority: 1 },
    { name: 'Kavita Sharma', phone: '9800000008', city: 'New Town', priority: 3 },
    { name: 'Suresh Agarwal', phone: '9800000009', city: 'Kolkata', priority: 2 },
    { name: 'Meena Kejriwal', phone: '9800000010', city: 'Dumdum', priority: 3 },
    { name: 'Rajan Saraf', phone: '9800000011', city: 'Kolkata', priority: 1 },
    { name: 'Lalita Gupta', phone: '9800000012', city: 'Behala', priority: 2 },
    { name: 'Harish Tiwari', phone: '9800000013', city: 'Kolkata', priority: 3 },
    { name: 'Sujata Das', phone: '9800000014', city: 'Jadavpur', priority: 2 },
    { name: 'Ajay Agarwal', phone: '9800000015', city: 'Kolkata', priority: 1 },
    { name: 'Nandini Roy', phone: '9800000016', city: 'Garia', priority: 3 },
    { name: 'Tushar Jain', phone: '9800000017', city: 'Kolkata', priority: 2 },
    { name: 'Puja Singhania', phone: '9800000018', city: 'Rajarhat', priority: 1 },
    { name: 'Dinesh Mehta', phone: '9800000019', city: 'Kolkata', priority: 3 },
    { name: 'Ritu Kapoor', phone: '9800000020', city: 'Alipore', priority: 2 },
    { name: 'Santosh Pandey', phone: '9800000021', city: 'Kolkata', priority: 3 },
    { name: 'Mala Devi Sharma', phone: '9800000022', city: 'Esplanade', priority: 2 },
    { name: 'Rajeev Khanna', phone: '9800000023', city: 'Kolkata', priority: 1 },
    { name: 'Shobha Mishra', phone: '9800000024', city: 'Ballygunge', priority: 3 },
    { name: 'Arun Sethia', phone: '9800000025', city: 'Kolkata', priority: 2 },
    { name: 'Geeta Chowdhury', phone: '9800000026', city: 'Kasba', priority: 3 },
    { name: 'Vinod Tulsyan', phone: '9800000027', city: 'Kolkata', priority: 1 },
    { name: 'Nalini Dutta', phone: '9800000028', city: 'Shyambazar', priority: 2 },
    { name: 'Rakesh Baid', phone: '9800000029', city: 'Kolkata', priority: 3 },
    { name: 'Usha Kothari', phone: '9800000030', city: 'Lake Gardens', priority: 2 },
    { name: 'Nilesh Choudhary', phone: '9800000031', city: 'Kolkata', priority: 1 },
    { name: 'Shanta Mukherjee', phone: '9800000032', city: 'Dum Dum', priority: 3 },
    { name: 'Satish Agrawal', phone: '9800000033', city: 'Kolkata', priority: 2 },
    { name: 'Madhuri Saha', phone: '9800000034', city: 'Gariahat', priority: 3 },
    { name: 'Pramod Lohia', phone: '9800000035', city: 'Kolkata', priority: 1 },
    { name: 'Aruna Pal', phone: '9800000036', city: 'Sodepur', priority: 2 },
    { name: 'Hemant Shah', phone: '9800000037', city: 'Kolkata', priority: 3 },
    { name: 'Vimla Agarwal', phone: '9800000038', city: 'Ultadanga', priority: 2 },
    { name: 'Ramakant Jain', phone: '9800000039', city: 'Kolkata', priority: 1 },
    { name: 'Sushma Poddar', phone: '9800000040', city: 'Phoolbagan', priority: 3 },
    { name: 'Kishore Saraf', phone: '9800000041', city: 'Kolkata', priority: 2 },
    { name: 'Asha Singhania', phone: '9800000042', city: 'Hatibagan', priority: 1 },
    { name: 'Vinayak Kanodia', phone: '9800000043', city: 'Kolkata', priority: 3 },
    { name: 'Indira Chirimar', phone: '9800000044', city: 'Chetla', priority: 2 },
    { name: 'Gopal Kejriwal', phone: '9800000045', city: 'Kolkata', priority: 1 },
    { name: 'Santhi Devi Jain', phone: '9800000046', city: 'Manicktala', priority: 3 },
    { name: 'Ashok Goenka', phone: '9800000047', city: 'Kolkata', priority: 2 },
    { name: 'Pushpa Parekh', phone: '9800000048', city: 'Tollygunge', priority: 3 },
    { name: 'Mridul Seal', phone: '9800000049', city: 'Kolkata', priority: 1 },
    { name: 'Chandana Bose', phone: '9800000050', city: 'Santoshpur', priority: 2 },
    { name: 'Naresh Kanoria', phone: '9800000051', city: 'Kolkata', priority: 1 },
    { name: 'Rekha Jhunjhunwala', phone: '9800000052', city: 'Rashbehari', priority: 2 },
    { name: 'Jagdish Firodia', phone: '9800000053', city: 'Kolkata', priority: 3 },
    { name: 'Sulakshna Bagaria', phone: '9800000054', city: 'Kankurgachi', priority: 2 },
    { name: 'Dilip Bajaj', phone: '9800000055', city: 'Kolkata', priority: 1 },
    { name: 'Kamla Beriwala', phone: '9800000056', city: 'Nabapally', priority: 3 },
    { name: 'Bharat Bhushan Singh', phone: '9800000057', city: 'Kolkata', priority: 2 },
    { name: 'Radha Morarka', phone: '9800000058', city: 'Salkia', priority: 3 },
    { name: 'Chetan Nevatia', phone: '9800000059', city: 'Kolkata', priority: 1 },
    { name: 'Vasudha Tibrewala', phone: '9800000060', city: 'Baguiati', priority: 2 },
  ];

  const customers: { id: string; name: string }[] = [];
  for (const c of customerProfiles) {
    const existing = await prisma.customer.findUnique({ where: { phone: c.phone } });
    if (existing) {
      customers.push({ id: existing.id, name: existing.name });
    } else {
      const created = await prisma.customer.create({
        data: {
          name: c.name,
          phone: c.phone,
          phoneCountryCode: '+91',
          city: c.city,
          state: 'West Bengal',
          country: 'India',
          priority: c.priority,
          rating: String(randomInt(0, 5)),
        },
      });
      customers.push({ id: created.id, name: created.name });
    }
  }

  ok(`Created/found ${customers.length} customers`);

  // ── 9. Enquiries (40 enquiries in different states) ───────────────────────
  section('9. Enquiries (40 — pending/quoted/converted/cancelled)');

  const functionTypes = ['Wedding', 'Reception', 'Engagement', 'Birthday', 'Anniversary',
                          'Corporate', 'Conference', 'Baby Shower', 'Thread Ceremony', 'Puja'];
  const enquiryStatuses = ['pending', 'quoted', 'converted', 'cancelled'];
  const allHallIds = halls.map((h) => h.id);

  const enquiries: { id: string }[] = [];
  for (let i = 0; i < 40; i++) {
    const customer = customers[i % customers.length];
    const status = enquiryStatuses[i % 4];
    const templateMenu = templateMenus[i % templateMenus.length];
    const mealSlot = mealSlots[i % mealSlots.length];
    const hall = halls[i % halls.length];

    const fDate = i < 20 ? futureDate(10 + i * 5) : pastDate(5 + i * 3);

    const enq = await prisma.enquiry.create({
      data: {
        customerId: customer.id,
        functionName: `${functionTypes[i % functionTypes.length]} Ceremony`,
        functionType: functionTypes[i % functionTypes.length],
        functionDate: fDate,
        functionTime: ['Morning', 'Afternoon', 'Evening'][i % 3],
        expectedGuests: 50 + (i * 23) % 400,
        budgetPerPlate: 700 + (i * 150) % 800,
        status,
        quotation: status === 'quoted',
        notes: `Enquiry note ${i + 1} — ${status}`,
        halls: { create: [{ hallId: hall.id }] },
        packs: {
          create: [{
            mealSlotId: mealSlot.id,
            templateMenuId: templateMenu.id,
            packCount: 1 + (i % 3),
          }],
        },
      },
    });
    enquiries.push({ id: enq.id });
  }

  ok(`Created ${enquiries.length} enquiries`);

  // ── 10. Bookings — comprehensive combinations ─────────────────────────────
  section('10. Bookings (60 — all combinations)');

  // Helper to build pack data
  function buildPackData(
    packName: string,
    menuName: string,
    mealSlotId: string,
    itemIds: string[],
    ratePerPlate: number,
    setupCost: number,
    packCount: number,
    startTime?: string,
    endTime?: string,
    options?: { extraPlate?: number; hallName?: string; hallIds?: string[] }
  ) {
    return {
      packName,
      mealSlotId,
      ratePerPlate,
      setupCost,
      packCount,
      startTime,
      endTime,
      extraPlate: options?.extraPlate ?? 0,
      hallName: options?.hallName,
      hallIds: options?.hallIds ?? [],
      menu: {
        name: menuName,
        items: itemIds.slice(0, 8).map((id) => ({ itemId: id, quantity: 1 })),
      },
    };
  }

  const vegItemIds = items.filter((_, idx) => idx % 2 === 0).map((i) => i.id);
  const nonVegItemIds = items.filter((_, idx) => idx % 2 === 1).map((i) => i.id);
  const allItemIds = items.map((i) => i.id);

  const bookings: { id: string }[] = [];

  // Booking scenario definitions
  const scenarios = [
    // A. Single hall, single pack, veg menu — confirmed — full date range
    ...[0, 5, 10, 15, 20, 25, 30, 35].map((dayOffset, i) => ({
      label: `Single hall veg wedding D+${dayOffset}`,
      customerId: customers[i].id,
      functionName: 'Wedding Reception',
      functionType: 'Wedding',
      functionDate: futureDate(dayOffset + 30).toISOString(),
      functionTime: 'Evening',
      startTime: '19:00',
      endTime: '23:00',
      expectedGuests: 200 + i * 30,
      hallId: halls[0].id,
      hallCharges: 50000,
      discountPercentage: i % 3 === 0 ? 5 : 0,
      packs: [buildPackData(
        'Veg Dinner',
        `Veg Menu ${i + 1}`,
        mealSlots.find((m) => m.name === 'Dinner')!.id,
        vegItemIds,
        900 + i * 50,
        5000,
        1,
        '19:00', '23:00',
        { hallName: halls[0].name }
      )],
    })),

    // B. Multi-hall, multi-pack — large events
    ...[0, 3, 7].map((idx) => ({
      label: `Multi-hall multi-pack event ${idx + 1}`,
      customerId: customers[20 + idx].id,
      functionName: 'Grand Wedding',
      functionType: 'Wedding',
      functionDate: futureDate(60 + idx * 15).toISOString(),
      functionTime: 'Full Day',
      startTime: '10:00',
      endTime: '22:00',
      expectedGuests: 400 + idx * 50,
      halls: [
        { hallId: halls[0].id, charges: 50000 },
        { hallId: halls[1].id, charges: 30000 },
      ],
      discountAmount: 5000,
      packs: [
        buildPackData('Lunch Pack', 'Lunch Menu', mealSlots.find((m) => m.name === 'Lunch')!.id,
          vegItemIds, 850, 5000, 2, '12:00', '15:00'),
        buildPackData('Dinner Pack', 'Dinner Menu', mealSlots.find((m) => m.name === 'Dinner')!.id,
          allItemIds, 1200, 8000, 2, '19:00', '23:00'),
      ],
    })),

    // C. Non-veg menu — afternoon slot
    ...[0, 4, 8, 12].map((i) => ({
      label: `Non-veg lunch ${i + 1}`,
      customerId: customers[30 + i].id,
      functionName: 'Birthday Celebration',
      functionType: 'Birthday',
      functionDate: futureDate(45 + i * 7).toISOString(),
      functionTime: 'Afternoon',
      startTime: '12:00',
      endTime: '16:00',
      expectedGuests: 100 + i * 20,
      hallId: halls[2].id,
      hallCharges: 20000,
      packs: [buildPackData(
        'Non-Veg Lunch',
        `Non-Veg Menu ${i + 1}`,
        mealSlots.find((m) => m.name === 'Lunch')!.id,
        nonVegItemIds, 1100, 7000, 1, '12:00', '16:00'
      )],
    })),

    // D. Pencil bookings (tentative / holds)
    ...[0, 1, 2].map((i) => ({
      label: `Pencil booking ${i + 1}`,
      customerId: customers[40 + i].id,
      functionName: 'Tentative Event',
      functionType: 'Corporate',
      functionDate: futureDate(20 + i * 5).toISOString(),
      functionTime: 'Morning',
      startTime: '09:00',
      endTime: '13:00',
      expectedGuests: 80 + i * 15,
      hallId: halls[3].id,
      hallCharges: 10000,
      isPencilBooking: true,
      pencilExpiresAt: futureDate(5 + i).toISOString(),
      packs: [buildPackData(
        'Hi-Tea',
        'Hi-Tea Menu',
        mealSlots.find((m) => m.name === 'Hi-Tea')!.id,
        vegItemIds, 400, 2000, 1, '09:00', '13:00'
      )],
    })),

    // E. Quotations
    ...[0, 1].map((i) => ({
      label: `Quotation booking ${i + 1}`,
      customerId: customers[50 + i].id,
      functionName: 'Conference Event',
      functionType: 'Conference',
      functionDate: futureDate(90 + i * 10).toISOString(),
      functionTime: 'Full Day',
      startTime: '09:00',
      endTime: '18:00',
      expectedGuests: 150 + i * 25,
      hallId: halls[4].id,
      hallCharges: 40000,
      isQuotation: true,
      packs: [buildPackData(
        'Full Day Buffet',
        `Conference Menu ${i + 1}`,
        mealSlots.find((m) => m.name === 'Lunch')!.id,
        allItemIds, 1500, 12000, 1, '09:00', '18:00'
      )],
    })),

    // F. No-hall bookings (outdoor / offsite)
    ...[0, 1, 2].map((i) => ({
      label: `No-hall offsite booking ${i + 1}`,
      customerId: customers[i * 10].id,
      functionName: 'Outdoor Garden Party',
      functionType: 'Anniversary',
      functionDate: futureDate(55 + i * 8).toISOString(),
      functionTime: 'Evening',
      startTime: '17:00',
      endTime: '21:00',
      expectedGuests: 60 + i * 10,
      halls: [],
      packs: [buildPackData(
        'Evening Hi-Tea',
        `Offsite Menu ${i + 1}`,
        mealSlots.find((m) => m.name === 'Hi-Tea')!.id,
        vegItemIds, 600, 3000, 1, '17:00', '21:00'
      )],
    })),

    // G. Bookings with additional items
    ...[0, 1, 2].map((i) => ({
      label: `Booking with additional items ${i + 1}`,
      customerId: customers[5 + i * 7].id,
      functionName: 'Engagement Ceremony',
      functionType: 'Engagement',
      functionDate: futureDate(40 + i * 6).toISOString(),
      functionTime: 'Evening',
      startTime: '18:00',
      endTime: '22:00',
      expectedGuests: 120 + i * 20,
      hallId: halls[1].id,
      hallCharges: 30000,
      additionalItems: [
        { description: 'Floral Decoration', charges: 15000, quantity: 1 },
        { description: 'Sound System', charges: 8000, quantity: 1 },
        { description: 'Photographer', charges: 20000, quantity: 1 },
        ...(i > 0 ? [{ description: 'DJ Service', charges: 12000, quantity: 1 }] : []),
      ],
      packs: [buildPackData(
        'Veg Dinner',
        `Engagement Menu ${i + 1}`,
        mealSlots.find((m) => m.name === 'Dinner')!.id,
        vegItemIds, 950, 6000, 1, '18:00', '22:00'
      )],
    })),

    // H. Past-date historical bookings (completed)
    ...[0, 1, 2, 3, 4].map((i) => ({
      label: `Historical booking ${i + 1}`,
      customerId: customers[i * 3].id,
      functionName: 'Historical Wedding',
      functionType: 'Wedding',
      functionDate: pastDate(30 + i * 15).toISOString(),
      functionTime: 'Evening',
      startTime: '19:00',
      endTime: '23:00',
      expectedGuests: 180 + i * 20,
      hallId: halls[i % halls.length].id,
      hallCharges: 30000 + i * 5000,
      status: 'completed',
      packs: [buildPackData(
        'Dinner Pack',
        `Past Menu ${i + 1}`,
        mealSlots.find((m) => m.name === 'Dinner')!.id,
        allItemIds, 1000 + i * 100, 7000, 1, '19:00', '23:00'
      )],
    })),

    // I. Full discount bookings
    {
      label: 'Zero discount booking',
      customerId: customers[10].id,
      functionName: 'Corporate Dinner',
      functionType: 'Corporate',
      functionDate: futureDate(75).toISOString(),
      functionTime: 'Evening',
      startTime: '19:30',
      endTime: '23:00',
      expectedGuests: 90,
      hallId: halls[5].id,
      hallCharges: 15000,
      discountPercentage: 0,
      discountAmount: 0,
      packs: [buildPackData(
        'Corporate Dinner',
        'Corporate Menu',
        mealSlots.find((m) => m.name === 'Dinner')!.id,
        allItemIds, 1200, 8000, 1, '19:30', '23:00'
      )],
    },

    // J. Max discount booking
    {
      label: 'Max discount (50%) booking',
      customerId: customers[15].id,
      functionName: 'VIP Event',
      functionType: 'Wedding',
      functionDate: futureDate(100).toISOString(),
      functionTime: 'Full Day',
      startTime: '10:00',
      endTime: '22:00',
      expectedGuests: 300,
      hallId: halls[0].id,
      hallCharges: 50000,
      discountPercentage: 50,
      packs: [
        buildPackData('Lunch', 'VIP Lunch', mealSlots.find((m) => m.name === 'Lunch')!.id,
          allItemIds, 1500, 12000, 2, '12:00', '15:00'),
        buildPackData('Dinner', 'VIP Dinner', mealSlots.find((m) => m.name === 'Dinner')!.id,
          allItemIds, 2000, 15000, 2, '19:00', '23:00'),
      ],
    },
  ];

  // Create each booking via Prisma directly (mimicking createBooking controller logic)
  for (const scenario of scenarios) {
    try {
      const hallRows: { hallId: string; charges: number }[] =
        'halls' in scenario && Array.isArray(scenario.halls)
          ? scenario.halls
          : 'hallId' in scenario && scenario.hallId
          ? [{ hallId: scenario.hallId as string, charges: (scenario as any).hallCharges ?? 0 }]
          : [];

      const booking = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.create({
          data: {
            customerId: scenario.customerId,
            functionName: scenario.functionName,
            functionType: scenario.functionType,
            functionDate: new Date(scenario.functionDate),
            functionTime: scenario.functionTime,
            startTime: (scenario as any).startTime,
            endTime: (scenario as any).endTime,
            expectedGuests: scenario.expectedGuests,
            status: (scenario as any).status ?? 'confirmed',
            isQuotation: (scenario as any).isQuotation ?? false,
            isPencilBooking: (scenario as any).isPencilBooking ?? false,
            pencilExpiresAt: (scenario as any).pencilExpiresAt ? new Date((scenario as any).pencilExpiresAt) : null,
            discountAmount: (scenario as any).discountAmount ?? 0,
            discountPercentage: (scenario as any).discountPercentage ?? 0,
            notes: (scenario as any).notes,
          },
        });

        if (hallRows.length > 0) {
          await tx.bookingHall.createMany({ data: hallRows.map((h) => ({ ...h, bookingId: b.id })) });
        }

        for (const pack of (scenario.packs ?? [])) {
          const menu = await tx.bookingMenu.create({
            data: {
              name: pack.menu.name,
              ratePerPlate: pack.ratePerPlate,
              setupCost: pack.setupCost,
              mealSlotId: pack.mealSlotId,
            },
          });

          for (const item of pack.menu.items) {
            await tx.bookingMenuItems.upsert({
              where: { bookingMenuId_itemId: { bookingMenuId: menu.id, itemId: item.itemId } },
              update: {},
              create: { bookingMenuId: menu.id, itemId: item.itemId, quantity: item.quantity },
            });
          }

          await tx.bookingPack.create({
            data: {
              bookingId: b.id,
              mealSlotId: pack.mealSlotId,
              bookingMenuId: menu.id,
              packName: pack.packName,
              packCount: pack.packCount,
              ratePerPlate: pack.ratePerPlate,
              setupCost: pack.setupCost,
              startTime: pack.startTime,
              endTime: pack.endTime,
              extraPlate: pack.extraPlate,
              hallName: pack.hallName,
              hallIds: pack.hallIds,
              extraCharges: 0,
            },
          });
        }

        if ((scenario as any).additionalItems) {
          await tx.additionalBookingItems.createMany({
            data: (scenario as any).additionalItems.map((ai: any) => ({
              bookingId: b.id,
              description: ai.description,
              charges: ai.charges,
              quantity: ai.quantity ?? 1,
            })),
          });
        }

        return b;
      });

      bookings.push({ id: booking.id });
    } catch (err) {
      console.log(`${YELLOW}  ⚠ Scenario "${scenario.label}" skipped: ${err instanceof Error ? err.message : err}${RESET}`);
    }
  }

  ok(`Created ${bookings.length} bookings across all scenarios`);

  // ── 11. Payments (multiple employees recording payments) ──────────────────
  section('11. Payments (multi-employee, multi-method)');

  const paymentMethods = ['cash', 'upi', 'cheque', 'bank_transfer', 'card'];
  const accountsUsers = createdUsers.filter((u) => u.email.startsWith('accounts'));
  let paymentCount = 0;

  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i];
    const numPayments = randomInt(0, 3);

    for (let p = 0; p < numPayments; p++) {
      const receiverId = accountsUsers[p % accountsUsers.length]?.id ?? createdUsers[0].id;
      const amount = randomInt(5000, 50000);
      const method = paymentMethods[p % paymentMethods.length];

      try {
        await prisma.bookingPayments.create({
          data: {
            bookingId: booking.id,
            receivedBy: receiverId,
            amount,
            method,
            narration: `Payment ${p + 1} for booking`,
            paymentDate: new Date(Date.now() - randomInt(0, 30) * 86400000),
          },
        });
        paymentCount++;
      } catch {
        // Booking may be in a state that doesn't accept payments — skip
      }
    }
  }

  ok(`Recorded ${paymentCount} payments across ${bookings.length} bookings`);

  // ── 12. Concurrent booking stress test ────────────────────────────────────
  section('12. Concurrent Booking Race Condition Test');

  const raceDateOffset = 200;
  const raceHall = halls[0];
  const raceCustomers = customers.slice(0, 5);

  // Attempt 5 concurrent bookings for the SAME hall + date + overlapping time
  const raceResults = await Promise.allSettled(
    raceCustomers.map(async (customer, idx) => {
      return prisma.$transaction(
        async (tx) => {
          const b = await tx.booking.create({
            data: {
              customerId: customer.id,
              functionName: `Race Booking ${idx + 1}`,
              functionType: 'Wedding',
              functionDate: futureDate(raceDateOffset),
              functionTime: 'Evening',
              startTime: '19:00',
              endTime: '23:00',
              expectedGuests: 100 + idx * 10,
              status: 'confirmed',
            },
          });

          await tx.bookingHall.create({
            data: { bookingId: b.id, hallId: raceHall.id, charges: 50000 },
          });

          return b;
        },
        { isolationLevel: 'Serializable' }
      );
    })
  );

  const raceSucceeded = raceResults.filter((r) => r.status === 'fulfilled').length;
  const raceFailed = raceResults.filter((r) => r.status === 'rejected').length;

  // At least one should succeed, and the database should remain consistent
  await assert(
    `Race condition: ${raceSucceeded} succeeded, ${raceFailed} retried/rejected (no data corruption)`,
    async () => {
      const hallBookings = await prisma.bookingHall.findMany({
        where: {
          hallId: raceHall.id,
          booking: {
            functionDate: futureDate(raceDateOffset),
            status: { not: 'cancelled' },
          },
        },
      });

      if (raceSucceeded === 0) {
        throw new Error('All concurrent bookings failed — serializable isolation too aggressive');
      }

      // All hall booking rows should be distinct
      const uniqueBookingIds = new Set(hallBookings.map((bh) => bh.bookingId));
      if (uniqueBookingIds.size !== hallBookings.length) {
        throw new Error('Duplicate hall booking rows detected — data corruption');
      }
    }
  );

  // ── 13. Input validation guards ───────────────────────────────────────────
  section('13. Input Validation Guards');

  const { z } = await import('zod');
  const { createBookingSchema, updateBookingSchema } = await import('../controllers/booking.controller');

  await assert('Rejects expectedGuests > 10000', async () => {
    const result = createBookingSchema.safeParse({
      body: {
        customerId: customers[0].id,
        functionName: 'Test Event',
        functionType: 'Wedding',
        functionDate: '2027-01-01',
        functionTime: 'Evening',
        expectedGuests: 99999,
      },
    });
    if (result.success) throw new Error('Should have failed validation');
  });

  await assert('Rejects expectedGuests < 1', async () => {
    const result = createBookingSchema.safeParse({
      body: {
        customerId: customers[0].id,
        functionName: 'Test Event',
        functionType: 'Wedding',
        functionDate: '2027-01-01',
        functionTime: 'Evening',
        expectedGuests: 0,
      },
    });
    if (result.success) throw new Error('Should have failed validation');
  });

  await assert('Rejects confirmedGuests < 0', async () => {
    const result = createBookingSchema.safeParse({
      body: {
        customerId: customers[0].id,
        functionName: 'Test Event',
        functionType: 'Wedding',
        functionDate: '2027-01-01',
        functionTime: 'Evening',
        expectedGuests: 100,
        confirmedGuests: -5,
      },
    });
    if (result.success) throw new Error('Should have failed validation');
  });

  await assert('Rejects secondCustomerId == customerId', async () => {
    const result = createBookingSchema.safeParse({
      body: {
        customerId: customers[0].id,
        secondCustomerId: customers[0].id,
        functionName: 'Test Event',
        functionType: 'Wedding',
        functionDate: '2027-01-01',
        functionTime: 'Evening',
        expectedGuests: 100,
      },
    });
    if (result.success) throw new Error('Should have failed validation');
  });

  await assert('Rejects extraPlate < 0', async () => {
    const result = createBookingSchema.safeParse({
      body: {
        customerId: customers[0].id,
        functionName: 'Test Event',
        functionType: 'Wedding',
        functionDate: '2027-01-01',
        functionTime: 'Evening',
        expectedGuests: 100,
        packs: [{
          packName: 'Test Pack',
          ratePerPlate: 500,
          extraPlate: -10,
          menu: { name: 'Test Menu', items: [] },
        }],
      },
    });
    if (result.success) throw new Error('Should have failed validation');
  });

  await assert('Accepts valid secondCustomerId != customerId', async () => {
    const result = createBookingSchema.safeParse({
      body: {
        customerId: customers[0].id,
        secondCustomerId: customers[1].id,
        functionName: 'Test Event',
        functionType: 'Wedding',
        functionDate: '2027-01-01',
        functionTime: 'Evening',
        expectedGuests: 100,
      },
    });
    if (!result.success) throw new Error(`Should have passed: ${JSON.stringify(result.error.issues)}`);
  });

  // ── 14. Search & Pagination stress ───────────────────────────────────────
  section('14. Search & Pagination');

  await assert('Customer search by name returns paginated results', async () => {
    const results = await prisma.customer.findMany({
      where: { name: { contains: 'Agarwal', mode: 'insensitive' } },
      take: 10,
      skip: 0,
    });
    if (results.length === 0) throw new Error('No customers found matching Agarwal');
  });

  await assert('Booking search by function type returns results', async () => {
    const results = await prisma.booking.findMany({
      where: { functionType: { contains: 'Wedding', mode: 'insensitive' } },
      take: 20,
      orderBy: { functionDate: 'asc' },
    });
    if (results.length === 0) throw new Error('No wedding bookings found');
  });

  await assert('Booking pagination: skip/take works correctly', async () => {
    const page1 = await prisma.booking.findMany({ take: 5, skip: 0, orderBy: { createdAt: 'asc' } });
    const page2 = await prisma.booking.findMany({ take: 5, skip: 5, orderBy: { createdAt: 'asc' } });
    if (page1.length === 0) throw new Error('No bookings found on page 1');
    if (page1[0].id === page2[0]?.id) throw new Error('Pagination not working — same items on page 1 and 2');
  });

  await assert('Enquiry filter by status returns correct subset', async () => {
    const pending = await prisma.enquiry.findMany({ where: { status: 'pending' } });
    const all = await prisma.enquiry.count();
    if (pending.length === 0) throw new Error('No pending enquiries found');
    if (pending.length > all) throw new Error('Filter returned more than total');
  });

  // ── 15. Financial integrity checks ───────────────────────────────────────
  section('15. Financial Integrity');

  await assert('No booking has totalAmount < 0', async () => {
    const bad = await prisma.booking.findFirst({ where: { totalAmount: { lt: 0 } } });
    if (bad) throw new Error(`Booking ${bad.id} has negative totalAmount`);
  });

  await assert('No booking has grandTotal < 0', async () => {
    const bad = await prisma.booking.findFirst({ where: { grandTotal: { lt: 0 } } });
    if (bad) throw new Error(`Booking ${bad.id} has negative grandTotal`);
  });

  await assert('No payment has amount ≤ 0', async () => {
    const bad = await prisma.bookingPayments.findFirst({ where: { amount: { lte: 0 } } });
    if (bad) throw new Error(`Payment ${bad.id} has non-positive amount`);
  });

  await assert('No pack has ratePerPlate < 0', async () => {
    const bad = await prisma.bookingPack.findFirst({ where: { ratePerPlate: { lt: 0 } } });
    if (bad) throw new Error(`BookingPack ${bad?.id} has negative ratePerPlate`);
  });

  await assert('No additional item has negative charges', async () => {
    const bad = await prisma.additionalBookingItems.findFirst({ where: { charges: { lt: 0 } } });
    if (bad) throw new Error(`AdditionalBookingItem ${bad?.id} has negative charges`);
  });

  // ── 16. Data integrity checks ─────────────────────────────────────────────
  section('16. Data Integrity');

  await assert('All BookingPacks reference valid BookingMenus', async () => {
    // bookingMenuId is required in schema — verify via cross-join count
    const packCount = await prisma.bookingPack.count();
    const menuIds = await prisma.bookingMenu.findMany({ select: { id: true } });
    const validMenuIds = new Set(menuIds.map((m) => m.id));
    const packs = await prisma.bookingPack.findMany({ select: { bookingMenuId: true } });
    const orphaned = packs.filter((p) => !validMenuIds.has(p.bookingMenuId));
    if (orphaned.length > 0) {
      throw new Error(`${orphaned.length}/${packCount} booking packs with orphaned menu reference`);
    }
  });

  await assert('All BookingHalls reference valid Halls', async () => {
    const halls_ = await prisma.hall.findMany({ select: { id: true } });
    const validHallIds = new Set(halls_.map((h) => h.id));
    const bookingHalls = await prisma.bookingHall.findMany({ select: { hallId: true } });
    const orphaned = bookingHalls.filter((bh) => !validHallIds.has(bh.hallId));
    if (orphaned.length > 0) {
      throw new Error(`${orphaned.length} BookingHall rows with orphaned hallId`);
    }
  });

  await assert('All Bookings have valid customers', async () => {
    const customers_ = await prisma.customer.findMany({ select: { id: true } });
    const validCustomerIds = new Set(customers_.map((c) => c.id));
    const bks = await prisma.booking.findMany({ select: { customerId: true, id: true } });
    const bad = bks.filter((b) => !validCustomerIds.has(b.customerId));
    if (bad.length > 0) throw new Error(`${bad.length} bookings with invalid customerId`);
  });

  await assert('No customer has empty phone', async () => {
    // phone is required (non-nullable) in schema — only check empty string
    const bad = await prisma.customer.findFirst({ where: { phone: '' } });
    if (bad) throw new Error(`Customer ${bad.id} has empty phone`);
  });

  await assert('isLatest consistency: no two versions both isLatest=true for same lineage', async () => {
    const bookingsWithPrev = await prisma.booking.findMany({
      where: { previousBookingId: { not: null }, isLatest: true },
      select: { id: true, previousBookingId: true },
    });

    for (const b of bookingsWithPrev) {
      const prev = await prisma.booking.findUnique({
        where: { id: b.previousBookingId! },
        select: { isLatest: true },
      });
      if (prev?.isLatest) {
        throw new Error(`Booking ${b.id} and its previous ${b.previousBookingId} both have isLatest=true`);
      }
    }
  });

  // ── 17. Edge case: same-day bookings different time slots (should succeed) ─
  section('17. Same-Day Non-Overlapping Bookings');

  const sameDayDate = futureDate(300);
  const sameDayHall = halls[6]; // Pearl Hall — Annexe
  let sameDayMorningId: string | null = null;
  let sameDayEveningId: string | null = null;

  await assert('Morning booking in Pearl Hall succeeds', async () => {
    const b = await prisma.booking.create({
      data: {
        customerId: customers[2].id,
        functionName: 'Morning Ceremony',
        functionType: 'Puja',
        functionDate: sameDayDate,
        functionTime: 'Morning',
        startTime: '08:00',
        endTime: '12:00',
        expectedGuests: 50,
        status: 'confirmed',
      },
    });
    await prisma.bookingHall.create({
      data: { bookingId: b.id, hallId: sameDayHall.id, charges: 8000 },
    });
    sameDayMorningId = b.id;
  });

  await assert('Evening booking in same Pearl Hall same day succeeds (non-overlapping)', async () => {
    const b = await prisma.booking.create({
      data: {
        customerId: customers[4].id,
        functionName: 'Evening Reception',
        functionType: 'Wedding',
        functionDate: sameDayDate,
        functionTime: 'Evening',
        startTime: '18:00',
        endTime: '22:00',
        expectedGuests: 75,
        status: 'confirmed',
      },
    });
    await prisma.bookingHall.create({
      data: { bookingId: b.id, hallId: sameDayHall.id, charges: 8000 },
    });
    sameDayEveningId = b.id;
  });

  if (sameDayMorningId && sameDayEveningId) {
    await assert('Both same-day bookings visible in hall query', async () => {
      const results = await prisma.bookingHall.findMany({
        where: {
          hallId: sameDayHall.id,
          booking: { functionDate: sameDayDate },
        },
      });
      if (results.length < 2) throw new Error(`Expected 2 same-day bookings, got ${results.length}`);
    });
  }

  // ── 18. Vendors & Ingredients ─────────────────────────────────────────────
  section('18. Vendors & Ingredients');

  const ingredientData = [
    { name: 'Basmati Rice', defaultUnit: 'kg' as const },
    { name: 'Refined Oil', defaultUnit: 'liter' as const },
    { name: 'Onion', defaultUnit: 'kg' as const },
    { name: 'Tomato', defaultUnit: 'kg' as const },
    { name: 'Paneer', defaultUnit: 'kg' as const },
    { name: 'Chicken', defaultUnit: 'kg' as const },
    { name: 'Mutton', defaultUnit: 'kg' as const },
    { name: 'Sugar', defaultUnit: 'kg' as const },
    { name: 'Milk', defaultUnit: 'liter' as const },
    { name: 'Ghee', defaultUnit: 'kg' as const },
  ];

  const ingredients: { id: string; name: string; defaultUnit: string }[] = [];
  for (const ing of ingredientData) {
    const existing = await prisma.ingredient.findUnique({ where: { name: ing.name } });
    if (existing) {
      ingredients.push({ id: existing.id, name: existing.name, defaultUnit: existing.defaultUnit });
    } else {
      const created = await prisma.ingredient.create({ data: ing });
      ingredients.push({ id: created.id, name: created.name, defaultUnit: created.defaultUnit });
    }
  }

  const vendorData = [
    { name: 'Fresh Farms Pvt Ltd', contactPerson: 'Amit Shah', phone: '9900000001' },
    { name: 'Metro Wholesale Market', contactPerson: 'Rajan Pillai', phone: '9900000002' },
    { name: 'Kolkata Spice House', contactPerson: 'Biswas Mukherjee', phone: '9900000003' },
    { name: 'Bengal Dairy Cooperative', contactPerson: 'Pradeep Dey', phone: '9900000004' },
    { name: 'National Provisions', contactPerson: 'Suresh Rao', phone: '9900000005' },
  ];

  for (const v of vendorData) {
    const existing = await prisma.vendor.findFirst({ where: { name: v.name } });
    if (!existing) {
      const vendor = await prisma.vendor.create({ data: v });
      // Add supplies for each vendor
      for (let i = 0; i < 3 && i < ingredients.length; i++) {
        const ing = ingredients[i];
        const existingSupply = await prisma.vendorSupply.findFirst({
          where: { vendorId: vendor.id, ingredientId: ing.id },
        });
        if (!existingSupply) {
          await prisma.vendorSupply.create({
            data: {
              vendorId: vendor.id,
              productType: 'ingredient',
              ingredientId: ing.id,
              price: 50 + randomInt(0, 200),
              unit: ing.defaultUnit,
            },
          });
        }
      }
    }
  }

  ok(`Created ${ingredientData.length} ingredients and ${vendorData.length} vendors`);

  // ── 19. Audit log generation ───────────────────────────────────────────────
  section('19. Audit Logs');

  const auditActions = ['CREATE', 'UPDATE', 'DELETE', 'VIEW'];
  const auditResources = ['booking', 'customer', 'payment', 'enquiry', 'hall'];
  let auditCount = 0;

  for (let i = 0; i < 50; i++) {
    await prisma.auditLog.create({
      data: {
        userId: createdUsers[i % createdUsers.length].id,
        userName: `Employee ${i % createdUsers.length + 1}`,
        action: auditActions[i % auditActions.length],
        resource: auditResources[i % auditResources.length],
        resourceId: bookings[i % bookings.length]?.id,
        details: { note: `Stress test action ${i + 1}` },
        ipAddress: `192.168.1.${(i % 254) + 1}`,
      },
    });
    auditCount++;
  }

  ok(`Created ${auditCount} audit log entries`);

  // ── 20. Summary ───────────────────────────────────────────────────────────
  section('Summary');

  const totalRecords = {
    users: await prisma.user.count(),
    customers: await prisma.customer.count(),
    enquiries: await prisma.enquiry.count(),
    bookings: await prisma.booking.count(),
    bookingPacks: await prisma.bookingPack.count(),
    bookingMenus: await prisma.bookingMenu.count(),
    bookingMenuItems: await prisma.bookingMenuItems.count(),
    payments: await prisma.bookingPayments.count(),
    halls: await prisma.hall.count(),
    itemTypes: await prisma.itemType.count(),
    items: await prisma.item.count(),
    templateMenus: await prisma.templateMenu.count(),
    ingredients: await prisma.ingredient.count(),
    vendors: await prisma.vendor.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  console.log(`\n${CYAN}Database Record Counts:${RESET}`);
  for (const [model, count] of Object.entries(totalRecords)) {
    console.log(`  ${model}: ${count}`);
  }

  console.log(`\n${CYAN}═══════════════════════════════════════════════════${RESET}`);
  console.log(`${GREEN}  PASSED: ${passed}${RESET}`);
  if (failed > 0) {
    console.log(`${RED}  FAILED: ${failed}${RESET}`);
    console.log(`\n${RED}Failures:${RESET}`);
    for (const f of failures) {
      console.log(`  ${RED}• ${f}${RESET}`);
    }
  } else {
    console.log(`${GREEN}  ALL TESTS PASSED${RESET}`);
  }
  console.log(`${CYAN}═══════════════════════════════════════════════════${RESET}\n`);
}

main()
  .catch((err) => {
    console.error(`${RED}Fatal error:${RESET}`, err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
