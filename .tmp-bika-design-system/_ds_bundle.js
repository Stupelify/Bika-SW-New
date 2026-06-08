/* @ds-bundle: {"format":3,"namespace":"BikaBanquetDesignSystem_019e30","components":[{"name":"RootLayout","sourcePath":"migration/client/src/app/layout.tsx"}],"sourceHashes":{"app/data.jsx":"69446f3fa020","app/main.jsx":"b16fe577512d","app/scr-bookings.jsx":"710c2cc98d09","app/scr-calendar.jsx":"09f411cbf436","app/scr-catalog.jsx":"11db880d6cd6","app/scr-crm.jsx":"d14c6618ace8","app/scr-dashboard.jsx":"82410b2ce46f","app/shell.jsx":"adf5065f11bc","app/tweaks-panel.jsx":"6591467622ed","app/ui.jsx":"154c9ffdc453","calendar_redesign/data.js":"8a5543fec183","calendar_redesign/design-canvas.jsx":"c9095ef15594","calendar_redesign/mobileViews.jsx":"305cbae9a6c6","calendar_redesign/variantA.jsx":"f7023a4867c4","calendar_redesign/variantB.jsx":"42c8f586b2d7","design-canvas.jsx":"d3ddcf4241b9","migration/client/src/app/layout.tsx":"6e7d099b8588","migration/client/tailwind.config.js":"566eaa33e0dc","mockups/screens.jsx":"d80300ae65a7","mockups/shared.jsx":"965ee6c43500","src/components.jsx":"b5fcb03232b9","src/data.js":"d3bcc806ac3a","src/live.js":"adef58cabc31","src/screens/Bookings.jsx":"c65690595cda","src/screens/Calendar.jsx":"628011fcf656","src/screens/Dashboard.jsx":"e1ede63d5f50","src/screens/Other.jsx":"922ed96d0a3e","src/shell.jsx":"73509444602f","tweaks-panel.jsx":"7f64c6909a8b","ui_kits/booking-dashboard/BookingForm.jsx":"c17952f5b952","ui_kits/booking-dashboard/BookingsTable.jsx":"7d0f19d54c56","ui_kits/booking-dashboard/KpiCard.jsx":"cb62460ea854","ui_kits/booking-dashboard/Sidebar.jsx":"2f015aac5f6c","ui_kits/booking-dashboard/StatusBadge.jsx":"b01c9af492e7"},"inlinedExternals":[],"unexposedExports":[{"name":"metadata","sourcePath":"migration/client/src/app/layout.tsx"},{"name":"viewport","sourcePath":"migration/client/src/app/layout.tsx"}]} */

(() => {

const __ds_ns = (window.BikaBanquetDesignSystem_019e30 = window.BikaBanquetDesignSystem_019e30 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// app/data.jsx
try { (() => {
// data.jsx — mock domain data + helpers for Bika Banquet Ops
// Indian banquet-hall operations. Exported to window.

const VENUES = [{
  id: 'v1',
  name: 'Bika Andheri',
  city: 'Mumbai'
}, {
  id: 'v2',
  name: 'Bika Bandra',
  city: 'Mumbai'
}, {
  id: 'v3',
  name: 'Bika Powai',
  city: 'Mumbai'
}];
const HALLS = [{
  id: 'h1',
  venueId: 'v1',
  name: 'Grand Ballroom',
  capacity: 500,
  floating: 600,
  floor: '2',
  basePrice: 250000
}, {
  id: 'h2',
  venueId: 'v1',
  name: 'Crystal Hall',
  capacity: 200,
  floating: 240,
  floor: '1',
  basePrice: 120000
}, {
  id: 'h3',
  venueId: 'v1',
  name: 'Heritage Hall',
  capacity: 300,
  floating: 360,
  floor: '3',
  basePrice: 160000
}, {
  id: 'h4',
  venueId: 'v2',
  name: 'Emerald Suite',
  capacity: 80,
  floating: 100,
  floor: '1',
  basePrice: 60000
}, {
  id: 'h5',
  venueId: 'v2',
  name: 'Sapphire Room',
  capacity: 120,
  floating: 150,
  floor: '2',
  basePrice: 90000
}, {
  id: 'h6',
  venueId: 'v3',
  name: 'Pearl Lawn',
  capacity: 800,
  floating: 1000,
  floor: 'G',
  basePrice: 320000
}, {
  id: 'h7',
  venueId: 'v3',
  name: 'Ruby Hall',
  capacity: 150,
  floating: 180,
  floor: '1',
  basePrice: 100000
}];
const CUSTOMERS = [{
  id: 'c1',
  name: 'Ramesh Kapoor',
  phone: '+91 98200 31111',
  altPhone: '+91 98200 31112',
  email: 'ramesh@kapoorgroup.in',
  city: 'Mumbai',
  community: 'Sindhi',
  dob: '12 Apr 1968',
  anniversary: '28 Nov 1994',
  occupation: 'Business Owner',
  company: 'Kapoor Textiles',
  gst: '27AABCK1234M1Z5',
  pan: 'AABCK1234M',
  priority: 'VIP',
  rating: 5,
  visits: 6,
  referredBy: null,
  referrals: ['c4'],
  notes: 'Prefers Grand Ballroom. Annual Diwali event.'
}, {
  id: 'c2',
  name: 'Priya Sharma',
  phone: '+91 99300 22122',
  altPhone: null,
  email: 'priya.sharma@gmail.com',
  city: 'Mumbai',
  community: 'Punjabi',
  dob: '03 Jul 1985',
  anniversary: '14 Feb 2012',
  occupation: 'Doctor',
  company: 'Lilavati Hospital',
  gst: null,
  pan: 'BXPPS5678K',
  priority: 'High',
  rating: 4,
  visits: 3,
  referredBy: 'c1',
  referrals: [],
  notes: ''
}, {
  id: 'c3',
  name: 'Anita Mehta',
  phone: '+91 98677 45333',
  altPhone: null,
  email: 'anita.mehta@outlook.com',
  city: 'Thane',
  community: 'Gujarati',
  dob: '21 Sep 1979',
  anniversary: null,
  occupation: 'Architect',
  company: 'Mehta Designs',
  gst: '27AADCM9876P1Z2',
  pan: 'AADCM9876P',
  priority: 'Normal',
  rating: 4,
  visits: 2,
  referredBy: null,
  referrals: [],
  notes: 'Vegetarian only. Jain food for 40 guests.'
}, {
  id: 'c4',
  name: 'Sunil Kumar',
  phone: '+91 90040 67444',
  altPhone: '+91 90040 67445',
  email: 'sunil.k@kumarent.in',
  city: 'Navi Mumbai',
  community: 'Marwari',
  dob: '08 Jan 1972',
  anniversary: '19 Dec 2000',
  occupation: 'Industrialist',
  company: 'Kumar Enterprises',
  gst: '27AABCK5544Q1Z9',
  pan: 'AABCK5544Q',
  priority: 'VIP',
  rating: 5,
  visits: 8,
  referredBy: 'c1',
  referrals: [],
  notes: 'Big spender. Always books premium packs.'
}, {
  id: 'c5',
  name: 'Deepak Patel',
  phone: '+91 97690 88555',
  altPhone: null,
  email: 'deepak.patel@patelco.in',
  city: 'Mumbai',
  community: 'Gujarati',
  dob: '30 May 1981',
  anniversary: '07 Mar 2009',
  occupation: 'CA',
  company: 'Patel & Associates',
  gst: null,
  pan: 'CDXPP3344L',
  priority: 'High',
  rating: 4,
  visits: 3,
  referredBy: null,
  referrals: [],
  notes: ''
}, {
  id: 'c6',
  name: 'Lalitha Iyer',
  phone: '+91 98200 99666',
  altPhone: null,
  email: 'lalitha.iyer@gmail.com',
  city: 'Mumbai',
  community: 'Tamil',
  dob: '15 Oct 1975',
  anniversary: '02 Sep 1999',
  occupation: 'Professor',
  company: 'IIT Bombay',
  gst: null,
  pan: 'EXAPI7788M',
  priority: 'Normal',
  rating: 5,
  visits: 4,
  referredBy: 'c2',
  referrals: [],
  notes: 'South Indian catering preferred.'
}, {
  id: 'c7',
  name: 'Farhan Qureshi',
  phone: '+91 99201 12777',
  altPhone: null,
  email: 'farhan.q@quresoft.com',
  city: 'Mumbai',
  community: 'Muslim',
  dob: '24 Mar 1988',
  anniversary: null,
  occupation: 'Tech Founder',
  company: 'Quresoft',
  gst: '27AAFCQ2211R1Z4',
  pan: 'AAFCQ2211R',
  priority: 'High',
  rating: 4,
  visits: 1,
  referredBy: null,
  referrals: [],
  notes: 'Halal catering required.'
}, {
  id: 'c8',
  name: 'Meera Reddy',
  phone: '+91 90820 33888',
  altPhone: null,
  email: 'meera.reddy@reddyfin.in',
  city: 'Hyderabad',
  community: 'Telugu',
  dob: '11 Dec 1983',
  anniversary: '25 Jan 2011',
  occupation: 'Banker',
  company: 'Reddy Finance',
  gst: null,
  pan: 'FGHPR9900N',
  priority: 'Normal',
  rating: 3,
  visits: 1,
  referredBy: null,
  referrals: [],
  notes: ''
}];
const MENU_PACKS = [{
  id: 'mp1',
  name: 'Royal Veg Thali',
  rate: 1200,
  setup: 25000,
  veg: true,
  course: 'Lunch/Dinner'
}, {
  id: 'mp2',
  name: 'Premium Non-Veg',
  rate: 1800,
  setup: 35000,
  veg: false,
  course: 'Lunch/Dinner'
}, {
  id: 'mp3',
  name: 'Wedding Grand Buffet',
  rate: 2200,
  setup: 50000,
  veg: false,
  course: 'Dinner'
}, {
  id: 'mp4',
  name: 'South Indian Feast',
  rate: 1100,
  setup: 20000,
  veg: true,
  course: 'Lunch'
}, {
  id: 'mp5',
  name: 'Hi-Tea Snacks',
  rate: 650,
  setup: 12000,
  veg: true,
  course: 'Hi-Tea'
}, {
  id: 'mp6',
  name: 'Continental Spread',
  rate: 1600,
  setup: 30000,
  veg: false,
  course: 'Dinner'
}];

// helper: build a date in 2026
const d = (m, day, h = 10, min = 0) => new Date(2026, m - 1, day, h, min);
const BOOKINGS = [{
  id: 'BK-24301',
  status: 'confirmed',
  source: 'in-app',
  functionName: 'Kapoor Wedding Reception',
  functionType: 'Wedding Reception',
  customerId: 'c1',
  start: d(6, 15, 10),
  end: d(6, 15, 22),
  hallIds: ['h1'],
  expectedGuests: 350,
  confirmedGuests: 312,
  packs: [{
    packId: 'mp3',
    plates: 350,
    slot: 'Dinner'
  }],
  hallCharges: 250000,
  discount: 25000,
  taxPct: 18,
  advanceReq: 300000,
  payments: [{
    id: 'p1',
    date: d(4, 2),
    method: 'UPI',
    ref: 'UPI8821',
    amount: 300000,
    by: 'Anita'
  }, {
    id: 'p2',
    date: d(5, 10),
    method: 'Bank Transfer',
    ref: 'NEFT5521',
    amount: 60958,
    by: 'Suresh'
  }],
  notes: 'DJ confirmed 22:00–02:00. Floral arch at entry — Shyam Decorators. AC service by 10 Jun.',
  versions: 3,
  pencilExpiresAt: null
}, {
  id: 'BK-24302',
  status: 'pencil',
  source: 'in-app',
  functionName: 'Sharma Anniversary Dinner',
  functionType: 'Anniversary',
  customerId: 'c2',
  start: d(6, 18, 11),
  end: d(6, 18, 16),
  hallIds: ['h2'],
  expectedGuests: 120,
  confirmedGuests: 0,
  packs: [{
    packId: 'mp1',
    plates: 120,
    slot: 'Lunch'
  }],
  hallCharges: 120000,
  discount: 0,
  taxPct: 18,
  advanceReq: 80000,
  payments: [],
  notes: '',
  versions: 1,
  pencilExpiresAt: d(6, 5)
}, {
  id: 'BK-24303',
  status: 'quotation',
  source: 'in-app',
  functionName: 'Mehta Birthday Celebration',
  functionType: 'Birthday',
  customerId: 'c3',
  start: d(6, 20, 19),
  end: d(6, 20, 23),
  hallIds: ['h3'],
  expectedGuests: 200,
  confirmedGuests: 0,
  packs: [{
    packId: 'mp4',
    plates: 200,
    slot: 'Dinner'
  }],
  hallCharges: 160000,
  discount: 10000,
  taxPct: 18,
  advanceReq: 100000,
  payments: [],
  notes: 'Jain food for 40 guests.',
  versions: 2,
  pencilExpiresAt: null
}, {
  id: 'BK-24304',
  status: 'enquiry',
  source: 'google',
  functionName: 'Kumar Engagement Ceremony',
  functionType: 'Engagement',
  customerId: 'c4',
  start: d(6, 22, 14),
  end: d(6, 22, 18),
  hallIds: ['h4'],
  expectedGuests: 80,
  confirmedGuests: 0,
  packs: [{
    packId: 'mp2',
    plates: 80,
    slot: 'Lunch'
  }],
  hallCharges: 60000,
  discount: 0,
  taxPct: 18,
  advanceReq: 40000,
  payments: [],
  notes: '',
  versions: 1,
  pencilExpiresAt: null
}, {
  id: 'BK-24305',
  status: 'confirmed',
  source: 'in-app',
  functionName: 'Patel Family Reunion',
  functionType: 'Reunion',
  customerId: 'c5',
  start: d(6, 25, 12),
  end: d(6, 25, 17),
  hallIds: ['h1'],
  expectedGuests: 400,
  confirmedGuests: 380,
  packs: [{
    packId: 'mp3',
    plates: 400,
    slot: 'Lunch'
  }],
  hallCharges: 250000,
  discount: 40000,
  taxPct: 18,
  advanceReq: 350000,
  payments: [{
    id: 'p3',
    date: d(5, 1),
    method: 'Cheque',
    ref: 'CHQ3344',
    amount: 350000,
    by: 'Anita'
  }],
  notes: '',
  versions: 2,
  pencilExpiresAt: null
}, {
  id: 'BK-24306',
  status: 'pencil',
  source: 'in-app',
  functionName: 'Iyer Naming Ceremony',
  functionType: 'Naming',
  customerId: 'c6',
  start: d(6, 28, 9),
  end: d(6, 28, 13),
  hallIds: ['h2'],
  expectedGuests: 90,
  confirmedGuests: 0,
  packs: [{
    packId: 'mp4',
    plates: 90,
    slot: 'Lunch'
  }],
  hallCharges: 90000,
  discount: 0,
  taxPct: 18,
  advanceReq: 50000,
  payments: [{
    id: 'p4',
    date: d(5, 20),
    method: 'UPI',
    ref: 'UPI9931',
    amount: 20000,
    by: 'Rakesh'
  }],
  notes: 'South Indian catering.',
  versions: 1,
  pencilExpiresAt: d(6, 8)
}, {
  id: 'BK-24307',
  status: 'confirmed',
  source: 'in-app',
  functionName: 'Qureshi Walima',
  functionType: 'Walima',
  customerId: 'c7',
  start: d(7, 2, 19),
  end: d(7, 2, 23),
  hallIds: ['h6'],
  expectedGuests: 600,
  confirmedGuests: 540,
  packs: [{
    packId: 'mp2',
    plates: 600,
    slot: 'Dinner'
  }],
  hallCharges: 320000,
  discount: 50000,
  taxPct: 18,
  advanceReq: 400000,
  payments: [{
    id: 'p5',
    date: d(5, 15),
    method: 'Bank Transfer',
    ref: 'NEFT7788',
    amount: 400000,
    by: 'Suresh'
  }],
  notes: 'Halal catering required. Separate ladies section.',
  versions: 2,
  pencilExpiresAt: null
}, {
  id: 'BK-24308',
  status: 'quotation',
  source: 'google',
  functionName: 'Reddy Sangeet',
  functionType: 'Sangeet',
  customerId: 'c8',
  start: d(7, 5, 18),
  end: d(7, 5, 23),
  hallIds: ['h7'],
  expectedGuests: 150,
  confirmedGuests: 0,
  packs: [{
    packId: 'mp6',
    plates: 150,
    slot: 'Dinner'
  }],
  hallCharges: 100000,
  discount: 0,
  taxPct: 18,
  advanceReq: 80000,
  payments: [],
  notes: '',
  versions: 1,
  pencilExpiresAt: null
}, {
  id: 'BK-24309',
  status: 'confirmed',
  source: 'in-app',
  functionName: 'Kapoor Diwali Gala',
  functionType: 'Corporate',
  customerId: 'c1',
  start: d(7, 12, 19),
  end: d(7, 12, 23),
  hallIds: ['h1', 'h3'],
  expectedGuests: 500,
  confirmedGuests: 450,
  packs: [{
    packId: 'mp3',
    plates: 500,
    slot: 'Dinner'
  }],
  hallCharges: 410000,
  discount: 60000,
  taxPct: 18,
  advanceReq: 500000,
  payments: [{
    id: 'p6',
    date: d(5, 25),
    method: 'Bank Transfer',
    ref: 'NEFT9012',
    amount: 500000,
    by: 'Suresh'
  }],
  notes: 'Repeat annual event. VIP handling.',
  versions: 1,
  pencilExpiresAt: null
}, {
  id: 'BK-24310',
  status: 'enquiry',
  source: 'in-app',
  functionName: 'Kumar Product Launch',
  functionType: 'Corporate',
  customerId: 'c4',
  start: d(7, 18, 16),
  end: d(7, 18, 20),
  hallIds: ['h5'],
  expectedGuests: 100,
  confirmedGuests: 0,
  packs: [{
    packId: 'mp5',
    plates: 100,
    slot: 'Hi-Tea'
  }],
  hallCharges: 90000,
  discount: 0,
  taxPct: 18,
  advanceReq: 50000,
  payments: [],
  notes: '',
  versions: 1,
  pencilExpiresAt: null
}, {
  id: 'BK-24311',
  status: 'confirmed',
  source: 'google',
  functionName: 'Malhotra Mehendi',
  functionType: 'Mehendi',
  customerId: 'c2',
  start: d(6, 15, 12),
  end: d(6, 15, 16),
  hallIds: ['h1'],
  expectedGuests: 180,
  confirmedGuests: 160,
  packs: [{
    packId: 'mp1',
    plates: 180,
    slot: 'Lunch'
  }],
  hallCharges: 250000,
  discount: 20000,
  taxPct: 18,
  advanceReq: 200000,
  payments: [{
    id: 'p7',
    date: d(5, 18),
    method: 'UPI',
    ref: 'UPI4521',
    amount: 210000,
    by: 'Anita'
  }],
  notes: 'Overlaps Kapoor Wedding — resolve hall clash.',
  versions: 1,
  pencilExpiresAt: null
}];

// Activity log
const ACTIVITY = [{
  id: 'a1',
  when: d(6, 1, 14, 32),
  user: 'Suresh',
  action: 'confirmed',
  target: 'BK-24301',
  fn: 'Kapoor Wedding Reception',
  detail: '₹3.84L grand total',
  ip: '10.2.1.14'
}, {
  id: 'a2',
  when: d(6, 1, 14, 30),
  user: 'Anita',
  action: 'added payment',
  target: 'BK-24305',
  fn: 'Patel Family Reunion',
  detail: '₹3,50,000 · Cheque CHQ3344',
  ip: '10.2.1.09'
}, {
  id: 'a3',
  when: d(6, 1, 14, 25),
  user: 'Vikram',
  action: 'updated hall',
  target: 'BK-24302',
  fn: 'Sharma Anniversary',
  detail: 'Grand Ballroom → Crystal Hall',
  ip: '10.2.1.22'
}, {
  id: 'a4',
  when: d(6, 1, 14, 12),
  user: 'Rakesh',
  action: 'created enquiry',
  target: 'BK-24310',
  fn: 'Kumar Product Launch',
  detail: 'Hi-Tea · 100 guests',
  ip: '10.2.1.31'
}, {
  id: 'a5',
  when: d(6, 1, 13, 58),
  user: 'Anita',
  action: 'marked pencil',
  target: 'BK-24306',
  fn: 'Iyer Naming Ceremony',
  detail: 'Expiry: 08 Jun 2026',
  ip: '10.2.1.09'
}, {
  id: 'a6',
  when: d(6, 1, 13, 40),
  user: 'Suresh',
  action: 'sent quotation',
  target: 'BK-24308',
  fn: 'Reddy Sangeet',
  detail: '₹1.77L estimate emailed',
  ip: '10.2.1.14'
}, {
  id: 'a7',
  when: d(6, 1, 11, 20),
  user: 'Vikram',
  action: 'edited menu',
  target: 'BK-24303',
  fn: 'Mehta Birthday',
  detail: 'Added Jain meal x40',
  ip: '10.2.1.22'
}, {
  id: 'a8',
  when: d(6, 1, 10, 5),
  user: 'Anita',
  action: 'confirmed',
  target: 'BK-24307',
  fn: 'Qureshi Walima',
  detail: '₹400000 advance received',
  ip: '10.2.1.09'
}];
const USERS = [{
  id: 'u1',
  name: 'Priya Nambiar',
  role: 'Operations Lead',
  branch: 'Andheri',
  email: 'priya@bika.in',
  active: true
}, {
  id: 'u2',
  name: 'Suresh Iyer',
  role: 'Booking Manager',
  branch: 'Andheri',
  email: 'suresh@bika.in',
  active: true
}, {
  id: 'u3',
  name: 'Anita Desai',
  role: 'Accounts',
  branch: 'Bandra',
  email: 'anita@bika.in',
  active: true
}, {
  id: 'u4',
  name: 'Vikram Shah',
  role: 'Coordinator',
  branch: 'Powai',
  email: 'vikram@bika.in',
  active: true
}, {
  id: 'u5',
  name: 'Rakesh Menon',
  role: 'Sales',
  branch: 'Andheri',
  email: 'rakesh@bika.in',
  active: false
}];

// ── derived helpers ─────────────────────────────────────────────
const _cust = new Map(CUSTOMERS.map(c => [c.id, c]));
const _hall = new Map(HALLS.map(h => [h.id, h]));
const _venue = new Map(VENUES.map(v => [v.id, v]));
const _pack = new Map(MENU_PACKS.map(p => [p.id, p]));
const customerById = id => _cust.get(id) || {
  name: '—',
  phone: '—'
};
const hallById = id => _hall.get(id) || {
  name: '—'
};
const venueById = id => _venue.get(id) || {
  name: '—'
};
const packById = id => _pack.get(id) || {
  name: '—',
  rate: 0,
  setup: 0
};
function bookingTotal(b) {
  const packsTotal = b.packs.reduce((s, p) => {
    const mp = packById(p.packId);
    return s + p.plates * mp.rate + mp.setup;
  }, 0);
  const sub = b.hallCharges + packsTotal;
  const afterD = sub - (b.discount || 0);
  const tax = afterD * (b.taxPct || 0) / 100;
  const grand = afterD + tax;
  const received = b.payments.reduce((s, p) => s + p.amount, 0);
  return {
    sub,
    afterD,
    tax,
    grand,
    received,
    balance: Math.max(0, grand - received),
    packsTotal
  };
}

// INR formatting → ₹X.XXL (lakhs) or ₹X.XXCr
function inr(n) {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + 'Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'K';
  return '₹' + n;
}
// full rupee with commas (Indian grouping)
function inrFull(n) {
  const s = Math.round(n).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return '₹' + grouped;
}
const fmtDate = dt => dt.toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'short'
});
const fmtDateFull = dt => dt.toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});
const fmtTime = dt => dt.toLocaleTimeString('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

// conflict detection: same hall, overlapping time
function detectConflicts(bookings) {
  const out = new Set();
  for (let i = 0; i < bookings.length; i++) for (let j = i + 1; j < bookings.length; j++) {
    const a = bookings[i],
      b = bookings[j];
    if (a.status === 'cancelled' || b.status === 'cancelled') continue;
    const shareHall = a.hallIds.some(h => b.hallIds.includes(h));
    if (!shareHall) continue;
    if (a.start < b.end && b.start < a.end) {
      out.add(a.id);
      out.add(b.id);
    }
  }
  return out;
}

// Enquiry pipeline derived
const ENQUIRY_STAGES = ['Lead', 'Quotation', 'Pencil', 'Won', 'Lost'];
const ENQUIRIES = [{
  id: 'EN-0001',
  customerId: 'c4',
  functionType: 'Engagement',
  date: d(6, 22),
  guests: 80,
  hallIds: ['h4'],
  stage: 'Lead',
  est: 120000,
  created: d(5, 20)
}, {
  id: 'EN-0002',
  customerId: 'c8',
  functionType: 'Sangeet',
  date: d(7, 5),
  guests: 150,
  hallIds: ['h7'],
  stage: 'Quotation',
  est: 177000,
  created: d(5, 22)
}, {
  id: 'EN-0003',
  customerId: 'c2',
  functionType: 'Anniversary',
  date: d(6, 18),
  guests: 120,
  hallIds: ['h2'],
  stage: 'Pencil',
  est: 195000,
  created: d(5, 18)
}, {
  id: 'EN-0004',
  customerId: 'c6',
  functionType: 'Naming',
  date: d(6, 28),
  guests: 90,
  hallIds: ['h2'],
  stage: 'Pencil',
  est: 106000,
  created: d(5, 19)
}, {
  id: 'EN-0005',
  customerId: 'c1',
  functionType: 'Wedding',
  date: d(6, 15),
  guests: 350,
  hallIds: ['h1'],
  stage: 'Won',
  est: 1180000,
  created: d(4, 1)
}, {
  id: 'EN-0006',
  customerId: 'c7',
  functionType: 'Walima',
  date: d(7, 2),
  guests: 600,
  hallIds: ['h6'],
  stage: 'Won',
  est: 2400000,
  created: d(5, 10)
}, {
  id: 'EN-0007',
  customerId: 'c5',
  functionType: 'Reunion',
  date: d(6, 25),
  guests: 400,
  hallIds: ['h1'],
  stage: 'Won',
  est: 1100000,
  created: d(4, 28)
}, {
  id: 'EN-0008',
  customerId: 'c3',
  functionType: 'Birthday',
  date: d(6, 20),
  guests: 200,
  hallIds: ['h3'],
  stage: 'Quotation',
  est: 224000,
  created: d(5, 15)
}, {
  id: 'EN-0009',
  customerId: 'c4',
  functionType: 'Corporate',
  date: d(7, 18),
  guests: 100,
  hallIds: ['h5'],
  stage: 'Lead',
  est: 108000,
  created: d(5, 28)
}, {
  id: 'EN-0010',
  customerId: 'c8',
  functionType: 'Birthday',
  date: d(5, 30),
  guests: 60,
  hallIds: ['h4'],
  stage: 'Lost',
  est: 72000,
  created: d(5, 1)
}];
Object.assign(window, {
  VENUES,
  HALLS,
  CUSTOMERS,
  MENU_PACKS,
  BOOKINGS,
  ACTIVITY,
  USERS,
  ENQUIRIES,
  ENQUIRY_STAGES,
  customerById,
  hallById,
  venueById,
  packById,
  bookingTotal,
  inr,
  inrFull,
  fmtDate,
  fmtDateFull,
  fmtTime,
  detectConflicts
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/data.jsx", error: String((e && e.message) || e) }); }

// app/main.jsx
try { (() => {
// main.jsx — app router + state, composes shell + screens + Tweaks
const {
  useState: mS,
  useEffect: mE,
  useCallback: mC
} = React;
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "nav": "top",
  "accent": "#0F766E",
  "density": "compact",
  "dark": false
} /*EDITMODE-END*/;
const ACCENTS = ['#0F766E', '#2563EB', '#4F46E5', '#B45309'];
function App() {
  const isMobile = useMedia();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = mS(() => {
    const r = new URLSearchParams(location.search).get('r');
    return r || localStorage.getItem('bika-route') || 'dashboard';
  });
  const [collapsed, setCollapsed] = mS(false);
  const [drawer, setDrawer] = mS(false);
  const [palette, setPalette] = mS(false);
  const [help, setHelp] = mS(false);
  const [theme, toggleTheme] = useTheme();

  // per-screen selection state
  const [bookingId, setBookingId] = mS(null);
  const [showNewBooking, setShowNewBooking] = mS(false);
  const [customerId, setCustomerId] = mS(null);
  mE(() => {
    localStorage.setItem('bika-route', route);
  }, [route]);
  // keep the dark tweak and the theme hook in sync (theme hook is source of truth)
  mE(() => {
    if (t.dark !== (theme === 'dark')) toggleTheme();
  }, [t.dark]);
  mE(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(p => !p);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const go = mC((r, arg) => {
    setRoute(r);
    setDrawer(false);
    if (r === 'bookings') {
      if (arg === 'new') setShowNewBooking(true);else setBookingId(null);
    }
    if (r === 'customers') setCustomerId(null);
  }, []);
  const openBooking = mC(id => {
    setRoute('bookings');
    setBookingId(id);
    setDrawer(false);
    setPalette(false);
  }, []);
  const openCustomer = mC(id => {
    setRoute('customers');
    setCustomerId(id);
    setDrawer(false);
    setPalette(false);
  }, []);

  // keyboard-first navigation
  const NAV_KEYS = ['dashboard', 'bookings', 'calendar', 'enquiries', 'customers', 'payments', 'venues', 'menu', 'reports'];
  useKeys({
    '1': () => go('dashboard'),
    '2': () => go('bookings'),
    '3': () => go('calendar'),
    '4': () => go('enquiries'),
    '5': () => go('customers'),
    '6': () => go('payments'),
    '7': () => go('venues'),
    '8': () => go('menu'),
    '9': () => go('reports'),
    'n': () => {
      setRoute('bookings');
      setBookingId(null);
      setShowNewBooking(true);
    },
    '/': () => setPalette(true),
    '?': () => setHelp(h => !h),
    'Escape': () => {
      setHelp(false);
    }
  }, []);
  const fabAction = mC(() => {
    if (route === 'enquiries') {
      toast('New enquiry', {
        icon: 'check'
      });
      return;
    }
    if (route === 'customers') {
      toast('New customer', {
        icon: 'check'
      });
      return;
    }
    setRoute('bookings');
    setBookingId(null);
    setShowNewBooking(true);
  }, [route]);
  const screen = (() => {
    switch (route) {
      case 'dashboard':
        return /*#__PURE__*/React.createElement(Dashboard, {
          go: go,
          openBooking: openBooking
        });
      case 'bookings':
        return /*#__PURE__*/React.createElement(Bookings, {
          openId: bookingId,
          setOpenId: setBookingId,
          showNew: showNewBooking,
          setShowNew: setShowNewBooking
        });
      case 'calendar':
        return /*#__PURE__*/React.createElement(Calendar, {
          openBooking: openBooking
        });
      case 'enquiries':
        return /*#__PURE__*/React.createElement(Enquiries, {
          openCustomer: openCustomer
        });
      case 'customers':
        return /*#__PURE__*/React.createElement(Customers, {
          openId: customerId,
          setOpenId: setCustomerId,
          openBooking: openBooking
        });
      case 'payments':
        return /*#__PURE__*/React.createElement(Payments, {
          openBooking: openBooking
        });
      case 'venues':
        return /*#__PURE__*/React.createElement(Venues, null);
      case 'menu':
        return /*#__PURE__*/React.createElement(Menu, null);
      case 'reports':
        return /*#__PURE__*/React.createElement(Reports, null);
      case 'activity':
        return /*#__PURE__*/React.createElement(Activity, {
          openBooking: openBooking
        });
      case 'settings':
        return /*#__PURE__*/React.createElement(Settings, {
          theme: theme,
          toggleTheme: toggleTheme
        });
      default:
        return /*#__PURE__*/React.createElement(Dashboard, {
          go: go,
          openBooking: openBooking
        });
    }
  })();

  // accent override (derive soft/border/hover from chosen accent)
  const ac = t.accent || '#0F766E';
  const accentVars = {
    '--ac': ac,
    '--ac-soft': `color-mix(in oklab, ${ac} 10%, var(--sf))`,
    '--ac-bd': `color-mix(in oklab, ${ac} 42%, var(--sf))`,
    '--ac-h': `color-mix(in oklab, ${ac} 82%, black)`
  };
  const topNav = t.nav === 'top' && !isMobile;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(GlobalStyles, null), /*#__PURE__*/React.createElement("div", {
    "data-density": t.density,
    style: {
      ...accentVars,
      display: 'flex',
      flexDirection: topNav ? 'column' : 'row',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      background: 'var(--bg)'
    }
  }, topNav && /*#__PURE__*/React.createElement(TopNav, {
    route: route,
    go: go,
    onSearch: () => setPalette(true),
    theme: theme,
    toggleTheme: toggleTheme
  }), !isMobile && !topNav && /*#__PURE__*/React.createElement(Sidebar, {
    route: route,
    go: go,
    collapsed: collapsed,
    setCollapsed: setCollapsed
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      overflow: 'hidden'
    }
  }, !topNav && /*#__PURE__*/React.createElement(Topbar, {
    route: route,
    onSearch: () => setPalette(true),
    theme: theme,
    toggleTheme: toggleTheme,
    onMenu: () => setDrawer(true),
    isMobile: isMobile
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      overflow: 'hidden',
      minHeight: 0
    }
  }, screen), isMobile && /*#__PURE__*/React.createElement(BottomNav, {
    route: route,
    go: go,
    onMore: () => setDrawer(true)
  }))), isMobile && /*#__PURE__*/React.createElement(MobileDrawer, {
    open: drawer,
    onClose: () => setDrawer(false),
    route: route,
    go: go,
    theme: theme,
    toggleTheme: toggleTheme
  }), isMobile && /*#__PURE__*/React.createElement(FAB, {
    onClick: fabAction
  }), /*#__PURE__*/React.createElement(CommandPalette, {
    open: palette,
    onClose: () => setPalette(false),
    go: go,
    openBooking: openBooking,
    openCustomer: openCustomer
  }), help && /*#__PURE__*/React.createElement(ShortcutsHelp, {
    onClose: () => setHelp(false)
  }), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Navigation"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Nav layout",
    value: t.nav,
    options: ['sidebar', 'top'],
    onChange: v => setTweak('nav', v)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--t3)',
      padding: '2px 2px 8px',
      lineHeight: 1.4
    }
  }, "\u201CTop\u201D mirrors the original codebase bar \u2014 reclaims width for tables & calendar."), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Theme"
  }), /*#__PURE__*/React.createElement(TweakColor, {
    label: "Accent",
    value: t.accent,
    options: ACCENTS,
    onChange: v => setTweak('accent', v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Dark mode",
    value: t.dark,
    onChange: v => setTweak('dark', v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Density"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Spacing",
    value: t.density,
    options: ['compact', 'balanced', 'comfy'],
    onChange: v => setTweak('density', v)
  })));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
function ShortcutsHelp({
  onClose
}) {
  const rows = [['1 – 9', 'Jump to section'], ['N', 'New booking'], ['/', 'Search'], ['⌘K', 'Command palette'], ['Drag', 'Reschedule event (calendar)'], ['Swipe', 'Row actions (mobile)'], ['?', 'Toggle this panel'], ['Esc', 'Close']];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "scrim",
    style: {
      zIndex: 90
    },
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "pop",
    style: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      zIndex: 91,
      width: 'min(420px,92vw)',
      background: 'var(--bg)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h",
    style: {
      borderBottom: '1px solid var(--bd)'
    }
  }, /*#__PURE__*/React.createElement("h3", null, "Keyboard shortcuts"), /*#__PURE__*/React.createElement("button", {
    className: "btn icon sm ghost",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "close",
    s: 16
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 16px 14px'
    }
  }, rows.map(([k, d]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '7px 0',
      borderBottom: '1px solid var(--bd)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--t2)'
    }
  }, d), /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, k))))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/main.jsx", error: String((e && e.message) || e) }); }

// app/scr-bookings.jsx
try { (() => {
// scr-bookings.jsx — dense data table + bulk ops + saved views + inline edit; detail as slide-over
const {
  useState: bkS,
  useMemo: bkM
} = React;
const BNOW = new Date(2026, 5, 4);
const bDayDiff = d => Math.ceil((d - BNOW) / 864e5);
const VIEWS = [{
  id: 'all',
  label: 'All',
  fn: () => true
}, {
  id: 'balance',
  label: 'Balance due',
  fn: b => bookingTotal(b).balance > 0 && b.status === 'confirmed'
}, {
  id: 'pencils',
  label: 'Pencils expiring',
  fn: b => b.status === 'pencil' && b.pencilExpiresAt
}, {
  id: 'unconfirmed',
  label: 'Unconfirmed',
  fn: b => ['pencil', 'quotation', 'enquiry'].includes(b.status)
}, {
  id: 'confirmed',
  label: 'Confirmed',
  fn: b => b.status === 'confirmed'
}, {
  id: 'high',
  label: 'High value · >₹10L',
  fn: b => bookingTotal(b).grand >= 1000000
}];
function Bookings({
  openId,
  setOpenId,
  showNew,
  setShowNew
}) {
  const isMobile = useMedia();
  const [q, setQ] = bkS('');
  const [view, setView] = bkS('all');
  const [sel, setSel] = bkS(() => new Set());
  const [edits, setEdits] = bkS({}); // id -> {expectedGuests}

  const vfn = VIEWS.find(v => v.id === view).fn;
  const list = bkM(() => {
    const t = q.toLowerCase().trim();
    return BOOKINGS.filter(b => {
      if (!vfn(b)) return false;
      if (t) {
        const c = customerById(b.customerId);
        if (!b.functionName.toLowerCase().includes(t) && !b.id.toLowerCase().includes(t) && !c.name.toLowerCase().includes(t)) return false;
      }
      return true;
    }).sort((a, b) => a.start - b.start);
  }, [q, view, edits]);
  const guestsOf = b => edits[b.id] && edits[b.id].expectedGuests != null ? edits[b.id].expectedGuests : b.expectedGuests;
  const setGuests = (b, v) => {
    setEdits(e => ({
      ...e,
      [b.id]: {
        ...e[b.id],
        expectedGuests: Number(v) || 0
      }
    }));
    toast(`${b.id} · guests updated to ${v}`, {
      icon: 'check'
    });
  };
  const selected = openId ? BOOKINGS.find(b => b.id === openId) : null;
  const toggleSel = id => setSel(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const selAll = () => setSel(s => s.size === list.length ? new Set() : new Set(list.map(b => b.id)));
  const bulk = (label, icon) => {
    const n = sel.size;
    setSel(new Set());
    toast(`${label} · ${n} booking${n > 1 ? 's' : ''}`, {
      icon: icon || 'check'
    });
  };

  // ── MOBILE ──
  if (isMobile) {
    if (selected && openId) return /*#__PURE__*/React.createElement(BookingDetail, {
      b: selected,
      onBack: () => setOpenId(null),
      isMobile: true
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "route",
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement(Toolbar, {
      title: null,
      actions: null
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      n: "search",
      s: 15,
      c: "var(--t4)"
    })), /*#__PURE__*/React.createElement("input", {
      className: "input",
      value: q,
      onChange: e => setQ(e.target.value),
      placeholder: "Search bookings\u2026",
      style: {
        paddingLeft: 32,
        height: 32
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        padding: '8px 12px',
        overflowX: 'auto',
        borderBottom: '1px solid var(--bd)',
        background: 'var(--sf)',
        flexShrink: 0
      }
    }, VIEWS.map(v => /*#__PURE__*/React.createElement("button", {
      key: v.id,
      onClick: () => setView(v.id),
      className: `chip${view === v.id ? ' on' : ''}`,
      style: {
        flexShrink: 0
      }
    }, v.label))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto'
      },
      className: "stagger"
    }, list.map(b => /*#__PURE__*/React.createElement(SwipeRow, {
      key: b.id,
      actions: [{
        icon: 'payments',
        label: 'Pay',
        color: 'var(--green)',
        onClick: () => toast(`${b.id} · payment recorded`, {
          icon: 'check'
        })
      }, {
        icon: 'phone',
        label: 'Call',
        color: 'var(--ac)',
        onClick: () => toast(`Calling ${customerById(b.customerId).name}…`, {
          icon: 'bell'
        })
      }]
    }, /*#__PURE__*/React.createElement(BookingRow, {
      b: b,
      guests: guestsOf(b),
      onClick: () => setOpenId(b.id)
    }))), list.length === 0 && /*#__PURE__*/React.createElement(Empty, null), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 80
      }
    })), showNew && /*#__PURE__*/React.createElement(NewBookingSheet, {
      onClose: () => setShowNew(false)
    }));
  }

  // ── DESKTOP: dense table ──
  const totalVal = list.reduce((s, b) => s + bookingTotal(b).grand, 0);
  const totalBal = list.reduce((s, b) => s + bookingTotal(b).balance, 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "route",
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Toolbar, {
    title: "Bookings",
    stats: [{
      label: 'In view',
      value: list.length
    }, {
      label: 'Total value',
      value: inr(totalVal)
    }, {
      label: 'Outstanding',
      value: inr(totalBal),
      color: totalBal > 0 ? 'var(--red)' : 'var(--green)'
    }],
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 9,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      n: "search",
      s: 14,
      c: "var(--t4)"
    })), /*#__PURE__*/React.createElement("input", {
      className: "input",
      value: q,
      onChange: e => setQ(e.target.value),
      placeholder: "Search\u2026",
      style: {
        paddingLeft: 30,
        height: 30,
        width: 180
      }
    })), /*#__PURE__*/React.createElement("button", {
      className: "btn primary",
      onClick: () => setShowNew(true)
    }, /*#__PURE__*/React.createElement(Icon, {
      n: "plus",
      s: 15
    }), "New booking"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      padding: '8px 16px',
      borderBottom: '1px solid var(--bd)',
      background: 'var(--sf)',
      flexShrink: 0,
      alignItems: 'center',
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9.5,
      fontFamily: 'var(--fm)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      color: 'var(--t4)',
      flexShrink: 0
    }
  }, "Views"), VIEWS.map(v => /*#__PURE__*/React.createElement("button", {
    key: v.id,
    onClick: () => setView(v.id),
    className: `chip${view === v.id ? ' on' : ''}`,
    style: {
      flexShrink: 0
    }
  }, v.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      position: 'relative'
    }
  }, sel.size > 0 && /*#__PURE__*/React.createElement("div", {
    className: "pop",
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 5,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 16px',
      background: 'var(--ac)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600
    }
  }, sel.size, " selected"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    style: {
      background: 'rgba(255,255,255,.16)',
      borderColor: 'transparent',
      color: '#fff'
    },
    onClick: () => bulk('Marked confirmed')
  }, "Mark confirmed"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    style: {
      background: 'rgba(255,255,255,.16)',
      borderColor: 'transparent',
      color: '#fff'
    },
    onClick: () => bulk('Reminder sent', 'bell')
  }, "Send reminder"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    style: {
      background: 'rgba(255,255,255,.16)',
      borderColor: 'transparent',
      color: '#fff'
    },
    onClick: () => bulk('Exported', 'download')
  }, "Export"), /*#__PURE__*/React.createElement("button", {
    className: "btn icon sm",
    style: {
      background: 'transparent',
      borderColor: 'transparent',
      color: '#fff'
    },
    onClick: () => setSel(new Set())
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "close",
    s: 16,
    c: "#fff"
  }))), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 34,
      paddingRight: 0
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: sel.size > 0 && sel.size === list.length,
    onChange: selAll,
    style: {
      cursor: 'pointer'
    }
  })), /*#__PURE__*/React.createElement("th", null, "Booking"), /*#__PURE__*/React.createElement("th", null, "Function / Customer"), /*#__PURE__*/React.createElement("th", null, "Date"), /*#__PURE__*/React.createElement("th", null, "Hall"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Guests"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Grand total"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Balance"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", {
    className: "stagger"
  }, list.map(b => {
    const c = customerById(b.customerId),
      t = bookingTotal(b);
    const exp = b.pencilExpiresAt ? bDayDiff(b.pencilExpiresAt) : null;
    return /*#__PURE__*/React.createElement("tr", {
      key: b.id,
      className: sel.has(b.id) ? 'sel' : '',
      onClick: () => setOpenId(b.id)
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        paddingRight: 0
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: sel.has(b.id),
      onChange: () => toggleSel(b.id),
      style: {
        cursor: 'pointer'
      }
    })), /*#__PURE__*/React.createElement("td", {
      className: "mono",
      style: {
        color: 'var(--t3)',
        whiteSpace: 'nowrap'
      }
    }, b.id, b.source === 'google' && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--sky)',
        marginLeft: 4
      },
      title: "Google Calendar"
    }, "G")), /*#__PURE__*/React.createElement("td", {
      style: {
        maxWidth: 220
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--t1)',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, b.functionName), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--t3)'
      }
    }, c.name)), /*#__PURE__*/React.createElement("td", {
      className: "mono",
      style: {
        whiteSpace: 'nowrap'
      }
    }, fmtDate(b.start), exp != null && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9.5,
        color: 'var(--amber)'
      }
    }, "exp ", exp, "d")), /*#__PURE__*/React.createElement("td", {
      style: {
        whiteSpace: 'nowrap'
      }
    }, hallById(b.hallIds[0]).name, b.hallIds.length > 1 && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--t4)'
      }
    }, " +", b.hallIds.length - 1)), /*#__PURE__*/React.createElement("td", {
      className: "num",
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement(InlineEdit, {
      value: edits[b.id] && edits[b.id].expectedGuests != null ? edits[b.id].expectedGuests : b.expectedGuests,
      type: "number",
      onCommit: v => setGuests(b, v),
      width: 56
    })), /*#__PURE__*/React.createElement("td", {
      className: "num",
      style: {
        color: 'var(--t1)'
      }
    }, /*#__PURE__*/React.createElement(Money, {
      v: t.grand
    })), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, /*#__PURE__*/React.createElement(Money, {
      v: t.balance,
      kind: t.balance > 0 ? 'owed' : 'clear'
    })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Badge, {
      s: b.status,
      sm: true
    })));
  }))), list.length === 0 && /*#__PURE__*/React.createElement(Empty, null)), /*#__PURE__*/React.createElement(Sheet, {
    open: !!selected,
    onClose: () => setOpenId(null),
    width: "min(700px,100vw)"
  }, selected && /*#__PURE__*/React.createElement(BookingDetail, {
    b: selected,
    onBack: () => setOpenId(null),
    inSheet: true
  })), showNew && /*#__PURE__*/React.createElement(NewBookingSheet, {
    onClose: () => setShowNew(false)
  }));
}
function Empty() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 48,
      textAlign: 'center',
      color: 'var(--t4)',
      fontSize: 13
    }
  }, "No bookings match this view.");
}
function BookingRow({
  b,
  guests,
  onClick
}) {
  const c = customerById(b.customerId),
    t = bookingTotal(b);
  const pct = t.grand > 0 ? Math.round(t.received / t.grand * 100) : 0;
  const expDays = b.pencilExpiresAt ? bDayDiff(b.pencilExpiresAt) : null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      padding: '11px 14px',
      borderBottom: '1px solid var(--bd)',
      cursor: 'pointer',
      background: 'var(--sf)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 3,
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontFamily: 'var(--fm)',
      color: 'var(--t3)',
      whiteSpace: 'nowrap'
    }
  }, b.id, b.source === 'google' && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--sky)',
      marginLeft: 5
    }
  }, "G")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontFamily: 'var(--fm)',
      color: 'var(--t3)',
      whiteSpace: 'nowrap'
    }
  }, fmtDate(b.start))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 8,
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--t1)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 0,
      flex: 1
    }
  }, b.functionName), /*#__PURE__*/React.createElement(Money, {
    v: t.grand
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--t3)',
      marginBottom: 6,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, c.name, " \xB7 ", hallById(b.hallIds[0]).name, " \xB7 ", guests, " pax"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    s: b.status,
    sm: true
  }), expDays != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontFamily: 'var(--fm)',
      color: 'var(--amber)'
    }
  }, "exp ", expDays, "d"), t.balance > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 10,
      fontFamily: 'var(--fm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t4)'
    }
  }, "bal "), /*#__PURE__*/React.createElement(Money, {
    v: t.balance,
    kind: "owed"
  })), t.balance <= 0 && pct > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 10,
      fontFamily: 'var(--fm)',
      color: 'var(--green)'
    }
  }, "Paid \u2713")), pct > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5
    }
  }, /*#__PURE__*/React.createElement(Progress, {
    pct: pct
  })));
}

// ── Detail ──────────────────────────────────────────────────────
const TABS = ['Overview', 'Money', 'Packs', 'Halls', 'Payments', 'Versions'];
function BookingDetail({
  b,
  onBack,
  isMobile,
  inSheet
}) {
  const [tab, setTab] = bkS('Overview');
  const c = customerById(b.customerId),
    t = bookingTotal(b);
  const pct = t.grand > 0 ? Math.round(t.received / t.grand * 100) : 0;
  const compact = isMobile || inSheet;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: compact ? '12px 16px' : '14px 20px',
      borderBottom: '1px solid var(--bd)',
      background: 'var(--sf)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6
    }
  }, (isMobile || inSheet) && /*#__PURE__*/React.createElement("button", {
    className: "btn icon sm ghost",
    onClick: onBack,
    style: {
      marginLeft: -6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: isMobile ? 'back' : 'close',
    s: 18
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontFamily: 'var(--fm)',
      color: 'var(--t3)'
    }
  }, b.id), /*#__PURE__*/React.createElement(Badge, {
    s: b.status
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontFamily: 'var(--fm)',
      color: 'var(--t4)'
    }
  }, "v", b.versions), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 6
    }
  }, !compact && /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: () => toast('Edit mode', {
      icon: 'check'
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "edit",
    s: 14
  }), "Edit"), !isMobile && /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: () => toast('Sent to printer', {
      icon: 'check'
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "print",
    s: 14
  }), "Print"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm primary",
    onClick: () => toast(`Payment recorded for ${b.id}`, {
      icon: 'check'
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "plus",
    s: 14
  }), "Payment"))), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: compact ? 17 : 20,
      fontWeight: 700,
      letterSpacing: '-.4px'
    }
  }, b.functionName), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--t3)',
      marginTop: 3
    }
  }, c.name, " \xB7 ", c.phone, " \xB7 ", fmtDateFull(b.start), " \xB7 ", fmtTime(b.start), "\u2013", fmtTime(b.end))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      borderBottom: '1px solid var(--bd)',
      background: 'var(--sf)',
      padding: compact ? '0 8px' : '0 20px',
      gap: 2,
      flexShrink: 0,
      overflowX: 'auto'
    }
  }, TABS.map(tb => /*#__PURE__*/React.createElement("button", {
    key: tb,
    onClick: () => setTab(tb),
    style: {
      padding: '9px 11px',
      fontSize: 11,
      fontFamily: 'var(--fm)',
      textTransform: 'uppercase',
      letterSpacing: '.05em',
      border: 'none',
      borderBottom: `2px solid ${tab === tb ? 'var(--ac)' : 'transparent'}`,
      background: 'none',
      color: tab === tb ? 'var(--t1)' : 'var(--t3)',
      whiteSpace: 'nowrap',
      fontWeight: tab === tb ? 600 : 400
    }
  }, tb))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'hidden',
      display: compact ? 'block' : tab === 'Overview' ? 'grid' : 'block',
      gridTemplateColumns: !compact && tab === 'Overview' ? '1fr 300px' : undefined
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: 'auto',
      height: '100%',
      padding: compact ? 16 : 20
    },
    className: "route"
  }, tab === 'Overview' && /*#__PURE__*/React.createElement(OverviewTab, {
    b: b,
    c: c,
    compact: compact
  }), tab === 'Money' && /*#__PURE__*/React.createElement(MoneyTab, {
    b: b,
    t: t
  }), tab === 'Packs' && /*#__PURE__*/React.createElement(PacksTab, {
    b: b
  }), tab === 'Halls' && /*#__PURE__*/React.createElement(HallsTab, {
    b: b
  }), tab === 'Payments' && /*#__PURE__*/React.createElement(PaymentsTab, {
    b: b,
    t: t
  }), tab === 'Versions' && /*#__PURE__*/React.createElement(VersionsTab, {
    b: b
  })), !compact && tab === 'Overview' && /*#__PURE__*/React.createElement("div", {
    style: {
      borderLeft: '1px solid var(--bd)',
      background: 'var(--sf2)',
      overflowY: 'auto',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement(MoneyStack, {
    b: b,
    t: t,
    pct: pct
  }))));
}
function Section({
  title,
  children,
  cols
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginBottom: 10
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: cols ? 'grid' : 'flex',
      gridTemplateColumns: cols ? `repeat(${cols},1fr)` : undefined,
      flexDirection: cols ? undefined : 'column',
      gap: cols ? '10px 20px' : 8
    }
  }, children));
}
function Field({
  k,
  v
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderLeft: '2px solid var(--bd)',
      paddingLeft: 9
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontFamily: 'var(--fm)',
      textTransform: 'uppercase',
      letterSpacing: '.05em',
      color: 'var(--t4)'
    }
  }, k), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--t1)',
      marginTop: 1
    }
  }, v || '—'));
}
function OverviewTab({
  b,
  c,
  compact
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Section, {
    title: "Function details",
    cols: compact ? 2 : 3
  }, /*#__PURE__*/React.createElement(Field, {
    k: "Type",
    v: b.functionType
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Date",
    v: fmtDateFull(b.start)
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Time",
    v: `${fmtTime(b.start)}–${fmtTime(b.end)}`
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Expected",
    v: `${b.expectedGuests} guests`
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Confirmed",
    v: b.confirmedGuests ? `${b.confirmedGuests} guests` : '—'
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Source",
    v: b.source
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Customer",
    cols: compact ? 2 : 3
  }, /*#__PURE__*/React.createElement(Field, {
    k: "Name",
    v: c.name
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Phone",
    v: c.phone
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Email",
    v: c.email
  }), /*#__PURE__*/React.createElement(Field, {
    k: "City",
    v: c.city
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Community",
    v: c.community
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Priority",
    v: c.priority
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Halls"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, b.hallIds.map(h => /*#__PURE__*/React.createElement("span", {
    key: h,
    className: "chip on"
  }, hallById(h).name)))), b.notes && /*#__PURE__*/React.createElement(Section, {
    title: "Notes"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: 'var(--t2)',
      lineHeight: 1.6,
      background: 'var(--sf)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--r-sm)',
      padding: 12
    }
  }, b.notes)), compact && /*#__PURE__*/React.createElement(MoneyStack, {
    b: b,
    t: bookingTotal(b),
    pct: bookingTotal(b).grand > 0 ? Math.round(bookingTotal(b).received / bookingTotal(b).grand * 100) : 0
  }));
}
function MoneyStack({
  b,
  t,
  pct
}) {
  const rows = [{
    k: 'Hall charges',
    v: inrFull(b.hallCharges)
  }, {
    k: 'Packs & menu',
    v: inrFull(t.packsTotal)
  }, {
    k: 'Subtotal',
    v: inrFull(t.sub),
    sep: 1
  }, b.discount ? {
    k: 'Discount',
    v: '− ' + inrFull(b.discount),
    c: 'var(--red)'
  } : null, {
    k: `GST ${b.taxPct}%`,
    v: '+ ' + inrFull(t.tax)
  }, {
    k: 'Grand total',
    v: inrFull(t.grand),
    bold: 1,
    sep: 1
  }, {
    k: 'Advance req.',
    v: inrFull(b.advanceReq)
  }, {
    k: 'Received',
    v: inrFull(t.received),
    c: 'var(--green)'
  }, {
    k: 'Balance',
    v: inrFull(t.balance),
    c: t.balance > 0 ? 'var(--red)' : 'var(--green)',
    bold: 1
  }].filter(Boolean);
  return /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 14,
      fontFamily: 'var(--fm)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginBottom: 12
    }
  }, "Money stack"), rows.map((r, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, r.sep && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--bd)',
      margin: '8px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 5,
      fontSize: 11,
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t3)',
      textTransform: 'uppercase',
      fontSize: 9.5,
      letterSpacing: '.03em',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, r.k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: r.bold ? 700 : 400,
      color: r.c || 'var(--t1)',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      fontVariantNumeric: 'tabular-nums'
    }
  }, r.v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Progress, {
    pct: pct,
    color: pct >= 100 ? 'var(--green)' : 'var(--ac)'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--t3)',
      textAlign: 'right',
      marginTop: 4
    }
  }, pct, "% paid"));
}
function MoneyTab({
  b,
  t
}) {
  const isMobile = useMedia();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: isMobile ? '100%' : 420
    }
  }, /*#__PURE__*/React.createElement(MoneyStack, {
    b: b,
    t: t,
    pct: t.grand > 0 ? Math.round(t.received / t.grand * 100) : 0
  }));
}
function PacksTab({
  b
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Slot"), /*#__PURE__*/React.createElement("th", null, "Menu pack"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Plates"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Rate"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Setup"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Total"))), /*#__PURE__*/React.createElement("tbody", null, b.packs.map((p, i) => {
    const mp = packById(p.packId);
    const tot = p.plates * mp.rate + mp.setup;
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      style: {
        cursor: 'default'
      }
    }, /*#__PURE__*/React.createElement("td", null, p.slot), /*#__PURE__*/React.createElement("td", {
      style: {
        color: 'var(--t1)',
        fontWeight: 500
      }
    }, mp.name, " ", mp.veg ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--green)',
        fontSize: 10
      }
    }, "\u25CF veg") : /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--red)',
        fontSize: 10
      }
    }, "\u25CF non-veg")), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, p.plates), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, inrFull(mp.rate)), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, inrFull(mp.setup)), /*#__PURE__*/React.createElement("td", {
      className: "num",
      style: {
        fontWeight: 600,
        color: 'var(--t1)'
      }
    }, inrFull(tot)));
  }))));
}
function HallsTab({
  b
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, b.hallIds.map(hid => {
    const h = hallById(hid),
      v = venueById(h.venueId);
    return /*#__PURE__*/React.createElement("div", {
      key: hid,
      className: "card lift",
      style: {
        padding: 14,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600
      }
    }, h.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--t3)',
        marginTop: 2
      }
    }, v.name, " \xB7 Floor ", h.floor, " \xB7 Cap ", h.capacity, " (float ", h.floating, ")")), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontFamily: 'var(--fm)',
        fontWeight: 600
      }
    }, inrFull(h.basePrice)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: 'var(--t3)'
      }
    }, "base price")));
  }));
}
function PaymentsTab({
  b,
  t
}) {
  if (!b.payments.length) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 30,
      textAlign: 'center',
      color: 'var(--t4)',
      fontSize: 13
    }
  }, "No payments recorded yet.");
  return /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Date"), /*#__PURE__*/React.createElement("th", null, "Method"), /*#__PURE__*/React.createElement("th", null, "Reference"), /*#__PURE__*/React.createElement("th", null, "By"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Amount"))), /*#__PURE__*/React.createElement("tbody", null, b.payments.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.id,
    style: {
      cursor: 'default'
    }
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, fmtDateFull(p.date)), /*#__PURE__*/React.createElement("td", null, p.method), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      color: 'var(--t3)'
    }
  }, p.ref), /*#__PURE__*/React.createElement("td", null, p.by), /*#__PURE__*/React.createElement("td", {
    className: "num",
    style: {
      fontWeight: 600,
      color: 'var(--green)'
    }
  }, inrFull(p.amount)))), /*#__PURE__*/React.createElement("tr", {
    style: {
      cursor: 'default'
    }
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 4,
    style: {
      fontWeight: 600,
      color: 'var(--t1)'
    }
  }, "Total received"), /*#__PURE__*/React.createElement("td", {
    className: "num",
    style: {
      fontWeight: 700,
      color: 'var(--t1)'
    }
  }, inrFull(t.received))))));
}
function VersionsTab({
  b
}) {
  const versions = Array.from({
    length: b.versions
  }, (_, i) => ({
    n: b.versions - i,
    date: fmtDateFull(new Date(2026, 4, 20 + i * 3)),
    by: ['Suresh', 'Anita', 'Vikram'][i % 3],
    note: i === 0 ? 'Current version' : 'Edited pricing & guests'
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0
    }
  }, versions.map((v, i) => /*#__PURE__*/React.createElement("div", {
    key: v.n,
    style: {
      display: 'flex',
      gap: 12,
      padding: '12px 0',
      borderBottom: i < versions.length - 1 ? '1px solid var(--bd)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: i === 0 ? 'var(--ac-soft)' : 'var(--sf2)',
      color: i === 0 ? 'var(--ac)' : 'var(--t3)',
      display: 'grid',
      placeItems: 'center',
      fontFamily: 'var(--fm)',
      fontSize: 11,
      fontWeight: 600,
      flexShrink: 0
    }
  }, "v", v.n), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, v.note), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--t3)',
      marginTop: 1
    }
  }, v.date, " \xB7 ", v.by)), i === 0 && /*#__PURE__*/React.createElement(Badge, {
    s: "confirmed",
    sm: true,
    label: "Current"
  }))));
}

// ── New booking form ────────────────────────────────────────────
function NewBookingSheet({
  onClose
}) {
  const [step, setStep] = bkS(1);
  const [f, setF] = bkS({
    fn: '',
    type: 'Wedding Reception',
    cust: '',
    phone: '',
    date: '',
    start: '18:00',
    end: '23:00',
    hall: 'h1',
    guests: '',
    pack: 'mp1',
    advance: ''
  });
  const set = (k, v) => setF(p => ({
    ...p,
    [k]: v
  }));
  const mp = packById(f.pack);
  const est = (Number(f.guests) || 0) * mp.rate + mp.setup + hallById(f.hall).basePrice;
  return /*#__PURE__*/React.createElement(Sheet, {
    open: true,
    onClose: onClose,
    width: "min(520px,100vw)",
    mobileFull: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: '1px solid var(--bd)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, "New booking"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--t3)'
    }
  }, "Step ", step, " of 3")), /*#__PURE__*/React.createElement("button", {
    className: "btn icon ghost",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "close",
    s: 18
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 18px 0',
      display: 'flex',
      gap: 4,
      flexShrink: 0
    }
  }, [1, 2, 3].map(s => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      flex: 1,
      height: 3,
      borderRadius: 2,
      background: s <= step ? 'var(--ac)' : 'var(--sf2)',
      marginTop: 12,
      transition: 'background .2s'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    },
    className: "route",
    key: step
  }, step === 1 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Function name"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    value: f.fn,
    onChange: e => set('fn', e.target.value),
    placeholder: "e.g. Kapoor Wedding Reception"
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Function type"), /*#__PURE__*/React.createElement("select", {
    className: "select",
    value: f.type,
    onChange: e => set('type', e.target.value)
  }, ['Wedding Reception', 'Anniversary', 'Birthday', 'Engagement', 'Corporate', 'Naming', 'Sangeet', 'Walima', 'Reunion'].map(x => /*#__PURE__*/React.createElement("option", {
    key: x
  }, x)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Customer name"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    value: f.cust,
    onChange: e => set('cust', e.target.value),
    placeholder: "Full name"
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Phone"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    value: f.phone,
    onChange: e => set('phone', e.target.value),
    placeholder: "+91 \u2026"
  })))), step === 2 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Date"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    type: "date",
    value: f.date,
    onChange: e => set('date', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Start time"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    type: "time",
    value: f.start,
    onChange: e => set('start', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "End time"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    type: "time",
    value: f.end,
    onChange: e => set('end', e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Hall"), /*#__PURE__*/React.createElement("select", {
    className: "select",
    value: f.hall,
    onChange: e => set('hall', e.target.value)
  }, HALLS.map(h => /*#__PURE__*/React.createElement("option", {
    key: h.id,
    value: h.id
  }, h.name, " \u2014 ", venueById(h.venueId).name, " (cap ", h.capacity, ")")))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Expected guests"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    type: "number",
    value: f.guests,
    onChange: e => set('guests', e.target.value),
    placeholder: "0"
  }))), step === 3 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Menu pack"), /*#__PURE__*/React.createElement("select", {
    className: "select",
    value: f.pack,
    onChange: e => set('pack', e.target.value)
  }, MENU_PACKS.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.name, " \u2014 ", inrFull(p.rate), "/plate")))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Advance to collect"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    value: f.advance,
    onChange: e => set('advance', e.target.value),
    placeholder: "\u20B9"
  })), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 14,
      fontFamily: 'var(--fm)',
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginBottom: 10
    }
  }, "Estimate"), /*#__PURE__*/React.createElement(Row, {
    k: "Hall",
    v: inrFull(hallById(f.hall).basePrice)
  }), /*#__PURE__*/React.createElement(Row, {
    k: `${mp.name} ×${f.guests || 0}`,
    v: inrFull((Number(f.guests) || 0) * mp.rate)
  }), /*#__PURE__*/React.createElement(Row, {
    k: "Setup",
    v: inrFull(mp.setup)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--bd)',
      margin: '8px 0'
    }
  }), /*#__PURE__*/React.createElement(Row, {
    k: "Est. before tax",
    v: inrFull(est),
    bold: true
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 18px',
      borderTop: '1px solid var(--bd)',
      display: 'flex',
      gap: 8,
      flexShrink: 0
    }
  }, step > 1 && /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => setStep(step - 1)
  }, "Back"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), step < 3 ? /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: () => setStep(step + 1)
  }, "Continue") : /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: () => {
      toast('Booking created', {
        icon: 'check'
      });
      onClose();
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "check",
    s: 15
  }), "Create booking")));
}
function Row({
  k,
  v,
  bold
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t3)',
      textTransform: 'uppercase',
      fontSize: 9.5
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: bold ? 700 : 400,
      fontVariantNumeric: 'tabular-nums'
    }
  }, v));
}
Object.assign(window, {
  Bookings
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/scr-bookings.jsx", error: String((e && e.message) || e) }); }

// app/scr-calendar.jsx
try { (() => {
// scr-calendar.jsx — hall board (drag-to-reschedule + resize), week, month
const {
  useState: cS,
  useMemo: cM,
  useEffect: cE,
  useRef: cR
} = React;
const ST_COLOR = {
  confirmed: 'var(--green)',
  pencil: 'var(--amber)',
  quotation: 'var(--blue)',
  enquiry: 'var(--sky)'
};
const pad2 = n => String(n).padStart(2, '0');
function Calendar({
  openBooking
}) {
  const isMobile = useMedia();
  const [view, setView] = cS(isMobile ? 'Month' : 'Board');
  const [liveConf, setLiveConf] = cS(() => detectConflicts(BOOKINGS).size);
  return /*#__PURE__*/React.createElement("div", {
    className: "route",
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Toolbar, {
    title: isMobile ? null : 'Calendar',
    stats: isMobile ? null : [{
      label: 'June bookings',
      value: BOOKINGS.filter(b => b.start.getMonth() === 5).length
    }, {
      label: 'Conflicts',
      value: liveConf,
      color: liveConf ? 'var(--red)' : 'var(--green)'
    }],
    actions: /*#__PURE__*/React.createElement("div", {
      className: "seg"
    }, (isMobile ? ['Month', 'Week'] : ['Board', 'Week', 'Month']).map(v => /*#__PURE__*/React.createElement("button", {
      key: v,
      className: view === v ? 'on' : '',
      onClick: () => setView(v)
    }, v)))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'hidden'
    }
  }, view === 'Board' && /*#__PURE__*/React.createElement(HallBoard, {
    openBooking: openBooking,
    onConf: setLiveConf
  }), view === 'Week' && /*#__PURE__*/React.createElement(WeekView, {
    openBooking: openBooking
  }), view === 'Month' && /*#__PURE__*/React.createElement(MonthView, {
    openBooking: openBooking
  })));
}

// ── Hall board with drag-to-reschedule + resize ─────────────────
function HallBoard({
  openBooking,
  onConf
}) {
  const START = 8,
    HOURS = 15,
    PX = 56;
  const day = new Date(2026, 5, 15);
  const dayBookings = cM(() => BOOKINGS.filter(b => b.start.getDate() === 15 && b.start.getMonth() === 5), []);
  const groups = cM(() => VENUES.map(v => ({
    v,
    halls: HALLS.filter(h => h.venueId === v.id)
  })).filter(g => g.halls.length), []);
  const [ov, setOv] = cS({}); // id -> {sh,eh,hallId}
  const [drag, setDrag] = cS(null);
  const lanes = cR({});
  const dragRef = cR(null);
  dragRef.current = drag;
  const base = b => ({
    sh: b.start.getHours() + b.start.getMinutes() / 60,
    eh: b.end.getHours() + b.end.getMinutes() / 60,
    hallId: b.hallIds[0]
  });
  const posOf = b => ov[b.id] || base(b);
  const eff = b => drag && drag.id === b.id ? {
    sh: drag.sh,
    eh: drag.eh,
    hallId: drag.hallId
  } : posOf(b);

  // live conflicts from effective positions
  const confSet = cM(() => {
    const w = dayBookings.map(b => ({
      id: b.id,
      ...eff(b)
    }));
    const s = new Set();
    for (let i = 0; i < w.length; i++) for (let j = i + 1; j < w.length; j++) {
      const a = w[i],
        b = w[j];
      if (a.hallId === b.hallId && a.sh < b.eh && b.sh < a.eh) {
        s.add(a.id);
        s.add(b.id);
      }
    }
    return s;
  }, [ov, drag, dayBookings]);
  cE(() => {
    onConf && onConf(confSet.size);
  }, [confSet.size]);
  const snap = h => Math.round(h / 0.25) * 0.25;
  const clamp = h => Math.max(START, Math.min(START + HOURS, h));
  cE(() => {
    if (!drag) return;
    const move = e => {
      const d = dragRef.current;
      if (!d) return;
      const dxH = (e.clientX - d.startX) / PX;
      if (d.mode === 'resize') {
        const eh = Math.max(d.origSh + 0.5, clamp(snap(d.origEh + dxH)));
        setDrag({
          ...d,
          eh,
          moved: true
        });
      } else {
        let sh = clamp(snap(d.origSh + dxH));
        let eh = sh + (d.origEh - d.origSh);
        if (eh > START + HOURS) {
          eh = START + HOURS;
          sh = eh - (d.origEh - d.origSh);
        }
        let hallId = d.hallId;
        for (const hid in lanes.current) {
          const el = lanes.current[hid];
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (e.clientY >= r.top && e.clientY <= r.bottom) {
            hallId = hid;
            break;
          }
        }
        setDrag({
          ...d,
          sh,
          eh,
          hallId,
          moved: Math.abs(e.clientX - d.startX) > 4 || hallId !== d.hallId
        });
      }
    };
    const up = () => {
      const d = dragRef.current;
      if (!d) return;
      if (d.moved) {
        setOv(o => ({
          ...o,
          [d.id]: {
            sh: d.sh,
            eh: d.eh,
            hallId: d.hallId
          }
        }));
        const hh = Math.floor(d.sh),
          mm = Math.round((d.sh - hh) * 60);
        toast(`${d.id} → ${pad2(hh)}:${pad2(mm)} · ${hallById(d.hallId).name}`, {
          icon: 'check'
        });
      } else {
        openBooking(d.id);
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [drag && drag.id]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflow: 'auto',
      position: 'relative',
      userSelect: drag ? 'none' : 'auto'
    }
  }, confSet.size > 0 && /*#__PURE__*/React.createElement("div", {
    className: "pop",
    style: {
      padding: '7px 16px',
      background: 'var(--red-bg)',
      borderBottom: '1px solid var(--red)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      position: 'sticky',
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "bell",
    s: 15,
    c: "var(--red)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontFamily: 'var(--fm)',
      fontWeight: 700,
      color: 'var(--red-fg)',
      textTransform: 'uppercase',
      letterSpacing: '.05em'
    }
  }, confSet.size, " hall conflict", confSet.size > 1 ? 's' : ''), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: 'var(--t3)'
    }
  }, "drag an event to a free hall or time to resolve")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 16px',
      borderBottom: '1px solid var(--bd)',
      background: 'var(--sf)',
      position: 'sticky',
      top: confSet.size ? 35 : 0,
      zIndex: 19
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, fmtDateFull(day)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: 'var(--t4)',
      fontFamily: 'var(--fm)',
      display: 'flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "grip",
    s: 12,
    c: "var(--t4)"
  }), "drag to reschedule \xB7 drag right edge to resize"), Object.keys(ov).length > 0 && /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    style: {
      marginLeft: 'auto'
    },
    onClick: () => {
      setOv({});
      toast('Reverted all changes', {
        icon: 'clock'
      });
    }
  }, "Reset")), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 140 + HOURS * PX
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      position: 'sticky',
      top: confSet.size ? 70 : 35,
      zIndex: 10,
      background: 'var(--bg)',
      borderBottom: '1px solid var(--bd)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 140,
      flexShrink: 0,
      height: 30,
      background: 'var(--sf)',
      borderRight: '1px solid var(--bd)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px'
    },
    className: "eyebrow"
  }, "Hall"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flex: 1
    }
  }, Array.from({
    length: HOURS
  }, (_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: PX,
      flexShrink: 0,
      height: 30,
      borderLeft: '1px solid var(--bd)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 5,
      fontSize: 9.5,
      fontFamily: 'var(--fm)',
      color: 'var(--t3)'
    }
  }, pad2(START + i), ":00")))), groups.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.v.id
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: 22,
      background: 'var(--sf2)',
      borderBottom: '1px solid var(--bd)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      padding: '0 12px'
    }
  }, g.v.name)), g.halls.map(h => {
    const evs = dayBookings.filter(b => eff(b).hallId === h.id);
    const hasConf = evs.some(e => confSet.has(e.id));
    return /*#__PURE__*/React.createElement("div", {
      key: h.id,
      style: {
        display: 'flex',
        borderBottom: '1px solid var(--bd)',
        height: 60
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 140,
        flexShrink: 0,
        borderRight: '1px solid var(--bd)',
        padding: '8px 12px',
        background: hasConf ? 'var(--red-bg)' : 'var(--sf)',
        position: 'sticky',
        left: 0,
        zIndex: 5
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }
    }, h.name, hasConf && /*#__PURE__*/React.createElement(Icon, {
      n: "bell",
      s: 11,
      c: "var(--red)"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: 'var(--t3)',
        fontFamily: 'var(--fm)'
      }
    }, "cap ", h.capacity)), /*#__PURE__*/React.createElement("div", {
      ref: el => lanes.current[h.id] = el,
      style: {
        position: 'relative',
        flex: 1
      }
    }, Array.from({
      length: HOURS
    }, (_, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: i * PX,
        width: 1,
        background: 'var(--bd)',
        opacity: .5
      }
    })), evs.map(ev => {
      const p = eff(ev);
      const left = (p.sh - START) * PX,
        width = Math.max(46, (p.eh - p.sh) * PX - 3);
      const col = ST_COLOR[ev.status] || 'var(--sky)';
      const isP = ev.status === 'pencil',
        conf = confSet.has(ev.id),
        dragging = drag && drag.id === ev.id;
      const t = BOOKINGS.find(x => x.id === ev.id) ? bookingTotal(BOOKINGS.find(x => x.id === ev.id)) : null;
      return /*#__PURE__*/React.createElement("div", {
        key: ev.id,
        className: conf ? 'conflict' : '',
        onPointerDown: e => {
          if (e.button !== 0) return;
          const p0 = eff(ev);
          setDrag({
            id: ev.id,
            mode: 'move',
            startX: e.clientX,
            origSh: p0.sh,
            origEh: p0.eh,
            sh: p0.sh,
            eh: p0.eh,
            hallId: p0.hallId,
            moved: false
          });
        },
        style: {
          position: 'absolute',
          top: 5,
          bottom: 5,
          left,
          width,
          borderRadius: 3,
          overflow: 'hidden',
          cursor: dragging ? 'grabbing' : 'grab',
          background: isP ? 'var(--sf)' : `color-mix(in oklab,${col} 13%,var(--sf))`,
          borderLeft: `3px solid ${col}`,
          borderStyle: ev.source === 'google' ? 'dashed' : 'solid',
          borderWidth: ev.source === 'google' ? '1px 1px 1px 3px' : '0 0 0 3px',
          borderColor: col,
          boxShadow: dragging ? 'var(--shadow-lg)' : 'none',
          zIndex: dragging ? 30 : 1,
          transition: dragging ? 'none' : 'box-shadow .15s',
          touchAction: 'none'
        },
        title: ev.functionName
      }, /*#__PURE__*/React.createElement("div", {
        className: isP ? 'hatch' : '',
        style: {
          padding: '4px 7px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          pointerEvents: 'none'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10.5,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }
      }, ev.functionName), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9,
          fontFamily: 'var(--fm)',
          color: 'var(--t3)',
          display: 'flex',
          gap: 6,
          whiteSpace: 'nowrap'
        }
      }, /*#__PURE__*/React.createElement("span", null, pad2(Math.floor(p.sh)), ":", pad2(Math.round(p.sh % 1 * 60))), t && /*#__PURE__*/React.createElement("span", null, inr(t.grand)), ev.source === 'google' && /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--sky)'
        }
      }, "G"))), /*#__PURE__*/React.createElement("div", {
        onPointerDown: e => {
          e.stopPropagation();
          if (e.button !== 0) return;
          const p0 = eff(ev);
          setDrag({
            id: ev.id,
            mode: 'resize',
            startX: e.clientX,
            origSh: p0.sh,
            origEh: p0.eh,
            sh: p0.sh,
            eh: p0.eh,
            hallId: p0.hallId,
            moved: false
          });
        },
        style: {
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 9,
          cursor: 'ew-resize',
          touchAction: 'none'
        }
      }));
    })));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 20
    }
  })));
}

// ── Week view ───────────────────────────────────────────────────
function WeekView({
  openBooking
}) {
  const isMobile = useMedia();
  const weekStart = new Date(2026, 5, 15);
  const days = Array.from({
    length: 7
  }, (_, i) => {
    const dt = new Date(weekStart);
    dt.setDate(15 + i);
    return dt;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflow: 'auto',
      padding: isMobile ? 12 : 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "stagger",
    style: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(7,1fr)',
      gap: isMobile ? 10 : 8
    }
  }, days.map(dt => {
    const bks = BOOKINGS.filter(b => b.start.getDate() === dt.getDate() && b.start.getMonth() === dt.getMonth());
    const today = dt.getDate() === 15;
    return /*#__PURE__*/React.createElement("div", {
      key: dt.getDate(),
      className: "card",
      style: {
        minHeight: isMobile ? 'auto' : 180,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '8px 10px',
        borderBottom: '1px solid var(--bd)',
        background: today ? 'var(--ac-soft)' : 'var(--sf2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontFamily: 'var(--fm)',
        textTransform: 'uppercase',
        color: today ? 'var(--ac)' : 'var(--t3)',
        fontWeight: today ? 600 : 400
      }
    }, dt.toLocaleDateString('en-IN', {
      weekday: 'short'
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        fontFamily: 'var(--fm)',
        color: today ? 'var(--ac)' : 'var(--t1)'
      }
    }, dt.getDate())), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        flex: 1
      }
    }, bks.map(b => {
      const c = customerById(b.customerId);
      return /*#__PURE__*/React.createElement("div", {
        key: b.id,
        onClick: () => openBooking(b.id),
        style: {
          padding: '5px 7px',
          borderRadius: 'var(--r-sm)',
          borderLeft: `3px solid ${ST_COLOR[b.status]}`,
          background: 'var(--sf2)',
          cursor: 'pointer',
          transition: 'transform .12s'
        },
        onMouseEnter: e => e.currentTarget.style.transform = 'translateX(2px)',
        onMouseLeave: e => e.currentTarget.style.transform = 'none'
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }
      }, b.functionName), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9.5,
          fontFamily: 'var(--fm)',
          color: 'var(--t3)'
        }
      }, fmtTime(b.start), " \xB7 ", c.name.split(' ')[0]));
    }), !bks.length && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--t4)',
        textAlign: 'center',
        padding: '8px 0'
      }
    }, "\u2014")));
  })));
}

// ── Month view ──────────────────────────────────────────────────
function MonthView({
  openBooking
}) {
  const isMobile = useMedia();
  const daysInMonth = 30,
    offset = 0;
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let dnum = 1; dnum <= daysInMonth; dnum++) cells.push(dnum);
  const dows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflow: 'auto',
      padding: isMobile ? 10 : 16,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      gap: 1,
      marginBottom: 6
    }
  }, dows.map(d => /*#__PURE__*/React.createElement("div", {
    key: d,
    style: {
      textAlign: 'center',
      fontSize: 9.5,
      fontFamily: 'var(--fm)',
      textTransform: 'uppercase',
      color: 'var(--t4)',
      letterSpacing: '.05em',
      padding: '2px 0'
    }
  }, isMobile ? d[0] : d))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      gridAutoRows: '1fr',
      gap: 1,
      background: 'var(--bd)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--r-sm)',
      overflow: 'hidden',
      flex: 1,
      minHeight: isMobile ? 420 : 520
    }
  }, cells.map((dnum, i) => {
    if (dnum === null) return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: 'var(--sf2)',
        opacity: .4
      }
    });
    const bks = BOOKINGS.filter(b => b.start.getDate() === dnum && b.start.getMonth() === 5);
    const today = dnum === 4;
    const rev = bks.reduce((s, b) => s + bookingTotal(b).grand, 0);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: 'var(--sf)',
        padding: isMobile ? '3px' : '5px 6px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minHeight: 0,
        overflow: 'hidden',
        transition: 'background .12s'
      },
      onMouseEnter: e => e.currentTarget.style.background = 'var(--sf2)',
      onMouseLeave: e => e.currentTarget.style.background = 'var(--sf)'
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: isMobile ? 10 : 11.5,
        fontFamily: 'var(--fm)',
        fontWeight: today ? 700 : 400,
        color: today ? '#fff' : 'var(--t2)',
        background: today ? 'var(--ac)' : 'transparent',
        width: today ? 18 : 'auto',
        height: today ? 18 : 'auto',
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center'
      }
    }, dnum), rev > 0 && !isMobile && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 8.5,
        fontFamily: 'var(--fm)',
        color: 'var(--t4)'
      }
    }, inr(rev))), isMobile ? bks.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        marginTop: 1
      }
    }, bks.slice(0, 3).map(b => /*#__PURE__*/React.createElement("span", {
      key: b.id,
      onClick: () => openBooking(b.id),
      style: {
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: ST_COLOR[b.status]
      }
    }))) : /*#__PURE__*/React.createElement(React.Fragment, null, bks.slice(0, 3).map(b => /*#__PURE__*/React.createElement("div", {
      key: b.id,
      onClick: () => openBooking(b.id),
      style: {
        fontSize: 9.5,
        padding: '1px 4px',
        borderRadius: 3,
        borderLeft: `2px solid ${ST_COLOR[b.status]}`,
        background: 'var(--sf2)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'pointer'
      }
    }, b.functionName)), bks.length > 3 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: 'var(--t4)'
      }
    }, "+", bks.length - 3, " more")));
  })));
}
Object.assign(window, {
  Calendar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/scr-calendar.jsx", error: String((e && e.message) || e) }); }

// app/scr-catalog.jsx
try { (() => {
// scr-catalog.jsx — Payments, Venues, Menu, Reports, Activity, Settings
const {
  useState: caS,
  useMemo: caM
} = React;

// responsive table → cards on mobile
function RTable({
  cols,
  rows,
  renderCard
}) {
  const isMobile = useMedia();
  if (isMobile) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 16
      }
    }, rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "card",
      style: {
        padding: 12
      }
    }, renderCard(r))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, cols.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.k,
    style: {
      textAlign: c.num ? 'right' : 'left'
    }
  }, c.l)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    style: {
      cursor: r._click ? 'pointer' : 'default'
    },
    onClick: r._click
  }, cols.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.k,
    className: c.num ? 'num' : '',
    style: c.cell
  }, c.render ? c.render(r) : r[c.k]))))))));
}

// ── PAYMENTS (global ledger) ────────────────────────────────────
function Payments({
  openBooking
}) {
  const all = caM(() => {
    const out = [];
    BOOKINGS.forEach(b => b.payments.forEach(p => out.push({
      ...p,
      bookingId: b.id,
      fn: b.functionName,
      cust: customerById(b.customerId).name
    })));
    return out.sort((a, b) => b.date - a.date);
  }, []);
  const total = all.reduce((s, p) => s + p.amount, 0);
  const outstanding = BOOKINGS.reduce((s, b) => s + bookingTotal(b).balance, 0);
  const isMobile = useMedia();
  return /*#__PURE__*/React.createElement("div", {
    className: "route",
    style: {
      height: '100%',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Toolbar, {
    title: isMobile ? null : 'Payments',
    stats: [{
      label: 'Received · all',
      value: inr(total),
      color: 'var(--green)'
    }, {
      label: 'Outstanding',
      value: inr(outstanding),
      color: outstanding > 0 ? 'var(--red)' : 'var(--green)'
    }, {
      label: 'Transactions',
      value: all.length
    }],
    actions: /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: () => toast('Ledger exported', {
        icon: 'download'
      })
    }, /*#__PURE__*/React.createElement(Icon, {
      n: "download",
      s: 15
    }), isMobile ? '' : 'Export')
  }), /*#__PURE__*/React.createElement(RTable, {
    cols: [{
      k: 'date',
      l: 'Date',
      render: r => fmtDateFull(r.date),
      cell: {
        fontFamily: 'var(--fm)'
      }
    }, {
      k: 'bookingId',
      l: 'Booking',
      cell: {
        fontFamily: 'var(--fm)',
        color: 'var(--ac)'
      }
    }, {
      k: 'cust',
      l: 'Customer'
    }, {
      k: 'method',
      l: 'Method'
    }, {
      k: 'ref',
      l: 'Reference',
      render: r => r.ref || '—',
      cell: {
        fontFamily: 'var(--fm)',
        color: 'var(--t3)'
      }
    }, {
      k: 'by',
      l: 'By'
    }, {
      k: 'amount',
      l: 'Amount',
      num: true,
      render: r => inrFull(r.amount),
      cell: {
        fontWeight: 600,
        color: 'var(--green)'
      }
    }],
    rows: all.map(r => ({
      ...r,
      _click: () => openBooking(r.bookingId)
    })),
    renderCard: r => /*#__PURE__*/React.createElement("div", {
      onClick: () => openBooking(r.bookingId)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600
      }
    }, r.cust), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontFamily: 'var(--fm)',
        fontWeight: 700,
        color: 'var(--green)'
      }
    }, inrFull(r.amount))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--t3)',
        fontFamily: 'var(--fm)',
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--ac)'
      }
    }, r.bookingId), /*#__PURE__*/React.createElement("span", null, fmtDate(r.date)), /*#__PURE__*/React.createElement("span", null, r.method), /*#__PURE__*/React.createElement("span", null, r.ref)))
  }));
}

// ── VENUES (hall catalogue) ─────────────────────────────────────
function Venues() {
  const isMobile = useMedia();
  return /*#__PURE__*/React.createElement("div", {
    className: "route",
    style: {
      height: '100%',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Toolbar, {
    title: isMobile ? null : 'Venues & Halls',
    stats: isMobile ? null : [{
      label: 'Venues',
      value: VENUES.length
    }, {
      label: 'Halls',
      value: HALLS.length
    }],
    actions: /*#__PURE__*/React.createElement("button", {
      className: "btn primary",
      onClick: () => toast('Add hall', {
        icon: 'check'
      })
    }, /*#__PURE__*/React.createElement(Icon, {
      n: "plus",
      s: 15
    }), isMobile ? '' : 'Add hall')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    },
    className: "stagger"
  }, VENUES.map(v => {
    const halls = HALLS.filter(h => h.venueId === v.id);
    return /*#__PURE__*/React.createElement("div", {
      key: v.id,
      className: "card",
      style: {
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "card-h"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, v.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--t3)',
        marginTop: 1
      }
    }, v.city, " \xB7 ", halls.length, " halls"))), isMobile ? /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, halls.map(h => {
      const bks = BOOKINGS.filter(b => b.hallIds.includes(h.id));
      const rev = bks.reduce((s, b) => s + bookingTotal(b).grand, 0);
      return /*#__PURE__*/React.createElement("div", {
        key: h.id,
        style: {
          border: '1px solid var(--bd)',
          borderRadius: 'var(--r-sm)',
          padding: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'space-between'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13,
          fontWeight: 600
        }
      }, h.name), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          fontFamily: 'var(--fm)',
          fontWeight: 600
        }
      }, inr(h.basePrice))), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: 'var(--t3)',
          fontFamily: 'var(--fm)',
          marginTop: 3
        }
      }, "Floor ", h.floor, " \xB7 Cap ", h.capacity, " \xB7 ", bks.length, " bookings \xB7 ", inr(rev)));
    })) : /*#__PURE__*/React.createElement("table", {
      className: "tbl"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Hall"), /*#__PURE__*/React.createElement("th", {
      style: {
        textAlign: 'right'
      }
    }, "Floor"), /*#__PURE__*/React.createElement("th", {
      style: {
        textAlign: 'right'
      }
    }, "Capacity"), /*#__PURE__*/React.createElement("th", {
      style: {
        textAlign: 'right'
      }
    }, "Floating"), /*#__PURE__*/React.createElement("th", {
      style: {
        textAlign: 'right'
      }
    }, "Base price"), /*#__PURE__*/React.createElement("th", {
      style: {
        textAlign: 'right'
      }
    }, "Bookings"), /*#__PURE__*/React.createElement("th", {
      style: {
        textAlign: 'right'
      }
    }, "Revenue"))), /*#__PURE__*/React.createElement("tbody", null, halls.map(h => {
      const bks = BOOKINGS.filter(b => b.hallIds.includes(h.id));
      const rev = bks.reduce((s, b) => s + bookingTotal(b).grand, 0);
      return /*#__PURE__*/React.createElement("tr", {
        key: h.id,
        style: {
          cursor: 'default'
        }
      }, /*#__PURE__*/React.createElement("td", {
        style: {
          color: 'var(--t1)',
          fontWeight: 500
        }
      }, h.name), /*#__PURE__*/React.createElement("td", {
        className: "num"
      }, h.floor), /*#__PURE__*/React.createElement("td", {
        className: "num"
      }, h.capacity), /*#__PURE__*/React.createElement("td", {
        className: "num"
      }, h.floating), /*#__PURE__*/React.createElement("td", {
        className: "num",
        style: {
          fontWeight: 600
        }
      }, inrFull(h.basePrice)), /*#__PURE__*/React.createElement("td", {
        className: "num"
      }, bks.length), /*#__PURE__*/React.createElement("td", {
        className: "num",
        style: {
          color: 'var(--ac)',
          fontWeight: 600
        }
      }, inr(rev)));
    }))));
  })));
}

// ── MENU (items / packs / vendors) ──────────────────────────────
function Menu() {
  const [tab, setTab] = caS('Packs');
  const isMobile = useMedia();
  const tabs = ['Packs', 'Ingredients', 'Vendors'];
  const ingredients = [{
    n: 'Basmati Rice',
    unit: 'kg',
    stock: 420,
    low: 100
  }, {
    n: 'Paneer',
    unit: 'kg',
    stock: 85,
    low: 50
  }, {
    n: 'Chicken',
    unit: 'kg',
    stock: 40,
    low: 60
  }, {
    n: 'Ghee',
    unit: 'L',
    stock: 120,
    low: 40
  }, {
    n: 'Mixed Vegetables',
    unit: 'kg',
    stock: 210,
    low: 80
  }];
  const vendors = [{
    n: 'Sharma Provisions',
    cat: 'Groceries',
    phone: '+91 98201 11000',
    last: '28 May'
  }, {
    n: 'Fresh Farms Co',
    cat: 'Vegetables',
    phone: '+91 98201 22000',
    last: '01 Jun'
  }, {
    n: 'Royal Meats',
    cat: 'Non-veg',
    phone: '+91 98201 33000',
    last: '30 May'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "route",
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Toolbar, {
    title: isMobile ? null : 'Menu & Items',
    actions: /*#__PURE__*/React.createElement("button", {
      className: "btn primary",
      onClick: () => toast('Add item', {
        icon: 'check'
      })
    }, /*#__PURE__*/React.createElement(Icon, {
      n: "plus",
      s: 15
    }), isMobile ? '' : 'Add item')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2,
      padding: '0 16px',
      borderBottom: '1px solid var(--bd)',
      background: 'var(--sf)'
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTab(t),
    style: {
      padding: '10px 12px',
      fontSize: 11.5,
      fontFamily: 'var(--fm)',
      textTransform: 'uppercase',
      letterSpacing: '.05em',
      border: 'none',
      borderBottom: `2px solid ${tab === t ? 'var(--ac)' : 'transparent'}`,
      background: 'none',
      color: tab === t ? 'var(--t1)' : 'var(--t3)',
      fontWeight: tab === t ? 600 : 400
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto'
    }
  }, tab === 'Packs' && /*#__PURE__*/React.createElement(RTable, {
    cols: [{
      k: 'name',
      l: 'Pack',
      cell: {
        fontWeight: 500,
        color: 'var(--t1)'
      }
    }, {
      k: 'course',
      l: 'Course'
    }, {
      k: 'veg',
      l: 'Type',
      render: r => r.veg ? /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--green)'
        }
      }, "\u25CF Veg") : /*#__PURE__*/React.createElement("span", {
        style: {
          color: 'var(--red)'
        }
      }, "\u25CF Non-veg")
    }, {
      k: 'rate',
      l: 'Rate/plate',
      num: true,
      render: r => inrFull(r.rate)
    }, {
      k: 'setup',
      l: 'Setup',
      num: true,
      render: r => inrFull(r.setup)
    }],
    rows: MENU_PACKS,
    renderCard: r => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600
      }
    }, r.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontFamily: 'var(--fm)',
        fontWeight: 700
      }
    }, inrFull(r.rate))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--t3)'
      }
    }, r.course, " \xB7 ", r.veg ? 'Veg' : 'Non-veg', " \xB7 setup ", inrFull(r.setup)))
  }), tab === 'Ingredients' && /*#__PURE__*/React.createElement(RTable, {
    cols: [{
      k: 'n',
      l: 'Ingredient',
      cell: {
        fontWeight: 500,
        color: 'var(--t1)'
      }
    }, {
      k: 'stock',
      l: 'In stock',
      num: true,
      render: r => `${r.stock} ${r.unit}`
    }, {
      k: 'low',
      l: 'Reorder at',
      num: true,
      render: r => `${r.low} ${r.unit}`
    }, {
      k: 'status',
      l: 'Status',
      render: r => r.stock < r.low ? /*#__PURE__*/React.createElement(Badge, {
        s: "lost",
        sm: true,
        label: "Low"
      }) : /*#__PURE__*/React.createElement(Badge, {
        s: "won",
        sm: true,
        label: "OK"
      })
    }],
    rows: ingredients,
    renderCard: r => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600
      }
    }, r.n), r.stock < r.low ? /*#__PURE__*/React.createElement(Badge, {
      s: "lost",
      sm: true,
      label: "Low"
    }) : /*#__PURE__*/React.createElement(Badge, {
      s: "won",
      sm: true,
      label: "OK"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--t3)',
        fontFamily: 'var(--fm)'
      }
    }, r.stock, " ", r.unit, " in stock \xB7 reorder at ", r.low))
  }), tab === 'Vendors' && /*#__PURE__*/React.createElement(RTable, {
    cols: [{
      k: 'n',
      l: 'Vendor',
      cell: {
        fontWeight: 500,
        color: 'var(--t1)'
      }
    }, {
      k: 'cat',
      l: 'Category'
    }, {
      k: 'phone',
      l: 'Phone',
      cell: {
        fontFamily: 'var(--fm)'
      }
    }, {
      k: 'last',
      l: 'Last order',
      num: true
    }],
    rows: vendors,
    renderCard: r => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 4
      }
    }, r.n), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--t3)',
        fontFamily: 'var(--fm)'
      }
    }, r.cat, " \xB7 ", r.phone, " \xB7 last ", r.last))
  })));
}

// ── REPORTS ─────────────────────────────────────────────────────
function Reports() {
  const isMobile = useMedia();
  const byType = caM(() => {
    const m = {};
    BOOKINGS.forEach(b => {
      m[b.functionType] = (m[b.functionType] || 0) + bookingTotal(b).grand;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, []);
  const byHall = caM(() => HALLS.map(h => ({
    n: h.name,
    hrs: BOOKINGS.filter(b => b.hallIds.includes(h.id)).reduce((s, b) => s + (b.end - b.start) / 36e5, 0)
  })).sort((a, b) => b.hrs - a.hrs), []);
  const tMax = Math.max(...byType.map(x => x[1])),
    hMax = Math.max(...byHall.map(x => x.hrs), 1);
  const totalRev = byType.reduce((s, x) => s + x[1], 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "route",
    style: {
      height: '100%',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Toolbar, {
    title: isMobile ? null : 'Reports',
    stats: isMobile ? null : [{
      label: 'Total revenue',
      value: inr(totalRev),
      color: 'var(--ac)'
    }, {
      label: 'Function types',
      value: byType.length
    }],
    actions: /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: () => toast('Report exported', {
        icon: 'download'
      })
    }, /*#__PURE__*/React.createElement(Icon, {
      n: "download",
      s: 15
    }), isMobile ? '' : 'Export CSV')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Revenue by function type")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, byType.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11.5,
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t2)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fm)',
      fontWeight: 600
    }
  }, inr(v))), /*#__PURE__*/React.createElement("div", {
    className: "prog",
    style: {
      height: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: `${v / tMax * 100}%`,
      background: 'var(--ac)'
    }
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Hall utilization (hours)")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, byHall.map(h => /*#__PURE__*/React.createElement("div", {
    key: h.n
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11.5,
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t2)'
    }
  }, h.n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fm)',
      fontWeight: 600
    }
  }, h.hrs, "h")), /*#__PURE__*/React.createElement("div", {
    className: "prog",
    style: {
      height: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: `${h.hrs / hMax * 100}%`,
      background: 'var(--green)'
    }
  }))))))));
}

// ── ACTIVITY (audit log) ────────────────────────────────────────
function Activity({
  openBooking
}) {
  const isMobile = useMedia();
  return /*#__PURE__*/React.createElement("div", {
    className: "route",
    style: {
      height: '100%',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Toolbar, {
    title: isMobile ? null : 'Activity log',
    stats: isMobile ? null : [{
      label: 'Events today',
      value: ACTIVITY.length
    }],
    actions: /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: () => toast('Log exported', {
        icon: 'download'
      })
    }, /*#__PURE__*/React.createElement(Icon, {
      n: "download",
      s: 15
    }), isMobile ? '' : 'Export')
  }), /*#__PURE__*/React.createElement(RTable, {
    cols: [{
      k: 'when',
      l: 'When',
      render: r => `${fmtDate(r.when)} ${fmtTime(r.when)}`,
      cell: {
        fontFamily: 'var(--fm)',
        color: 'var(--t3)',
        whiteSpace: 'nowrap'
      }
    }, {
      k: 'user',
      l: 'User',
      cell: {
        fontWeight: 500,
        color: 'var(--t1)'
      }
    }, {
      k: 'action',
      l: 'Action'
    }, {
      k: 'target',
      l: 'Booking',
      cell: {
        fontFamily: 'var(--fm)',
        color: 'var(--ac)'
      }
    }, {
      k: 'fn',
      l: 'Function'
    }, {
      k: 'detail',
      l: 'Detail',
      cell: {
        color: 'var(--t3)'
      }
    }, {
      k: 'ip',
      l: 'IP',
      cell: {
        fontFamily: 'var(--fm)',
        color: 'var(--t4)',
        fontSize: '11px'
      }
    }],
    rows: ACTIVITY.map(a => ({
      ...a,
      _click: () => openBooking(a.target)
    })),
    renderCard: a => /*#__PURE__*/React.createElement("div", {
      onClick: () => openBooking(a.target)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13
      }
    }, /*#__PURE__*/React.createElement("strong", null, a.user), " ", a.action, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--ac)',
        fontFamily: 'var(--fm)'
      }
    }, a.target))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--t3)'
      }
    }, a.detail), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: 'var(--t4)',
        fontFamily: 'var(--fm)',
        marginTop: 3
      }
    }, fmtDate(a.when), " ", fmtTime(a.when), " \xB7 ", a.ip))
  }));
}

// ── SETTINGS ────────────────────────────────────────────────────
function Settings({
  theme,
  toggleTheme
}) {
  const [tab, setTab] = caS('Profile');
  const isMobile = useMedia();
  const tabs = ['Profile', 'Users', 'Integrations', 'Appearance'];
  return /*#__PURE__*/React.createElement("div", {
    className: "route",
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Toolbar, {
    title: isMobile ? null : 'Settings'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2,
      padding: '0 16px',
      borderBottom: '1px solid var(--bd)',
      background: 'var(--sf)',
      overflowX: 'auto'
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTab(t),
    style: {
      padding: '10px 12px',
      fontSize: 11.5,
      fontFamily: 'var(--fm)',
      textTransform: 'uppercase',
      letterSpacing: '.05em',
      border: 'none',
      borderBottom: `2px solid ${tab === t ? 'var(--ac)' : 'transparent'}`,
      background: 'none',
      color: tab === t ? 'var(--t1)' : 'var(--t3)',
      fontWeight: tab === t ? 600 : 400,
      whiteSpace: 'nowrap'
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 24,
      maxWidth: 680
    }
  }, tab === 'Profile' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Full name"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    defaultValue: "Priya Nambiar"
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Role"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    defaultValue: "Operations Lead",
    readOnly: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Email"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    defaultValue: "priya@bika.in"
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Branch"), /*#__PURE__*/React.createElement("select", {
    className: "select",
    defaultValue: "Andheri"
  }, ['Andheri', 'Bandra', 'Powai'].map(x => /*#__PURE__*/React.createElement("option", {
    key: x
  }, x))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    className: "btn primary"
  }, "Save changes"))), tab === 'Users' && /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Role"), /*#__PURE__*/React.createElement("th", null, "Branch"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, USERS.map(u => /*#__PURE__*/React.createElement("tr", {
    key: u.id,
    style: {
      cursor: 'default'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      color: 'var(--t1)',
      fontWeight: 500
    }
  }, u.name), /*#__PURE__*/React.createElement("td", null, u.role), /*#__PURE__*/React.createElement("td", null, u.branch), /*#__PURE__*/React.createElement("td", null, u.active ? /*#__PURE__*/React.createElement(Badge, {
    s: "won",
    sm: true,
    label: "Active"
  }) : /*#__PURE__*/React.createElement(Badge, {
    s: "normal",
    sm: true,
    label: "Inactive"
  }))))))), tab === 'Integrations' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, [{
    n: 'Google Calendar',
    d: 'Sync bookings to Google Calendar',
    on: true
  }, {
    n: 'WhatsApp Business',
    d: 'Send booking confirmations',
    on: true
  }, {
    n: 'Razorpay',
    d: 'Collect online payments',
    on: false
  }, {
    n: 'Tally',
    d: 'Export to accounting',
    on: false
  }].map(it => /*#__PURE__*/React.createElement("div", {
    key: it.n,
    className: "card",
    style: {
      padding: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600
    }
  }, it.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--t3)'
    }
  }, it.d)), it.on ? /*#__PURE__*/React.createElement(Badge, {
    s: "won",
    label: "Connected"
  }) : /*#__PURE__*/React.createElement("button", {
    className: "btn sm"
  }, "Connect")))), tab === 'Appearance' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "Theme"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--t3)'
    }
  }, "Currently ", theme)), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: toggleTheme
  }, /*#__PURE__*/React.createElement(Icon, {
    n: theme === 'light' ? 'moon' : 'sun',
    s: 15
  }), "Switch to ", theme === 'light' ? 'dark' : 'light')))));
}
Object.assign(window, {
  Payments,
  Venues,
  Menu,
  Reports,
  Activity,
  Settings
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/scr-catalog.jsx", error: String((e && e.message) || e) }); }

// app/scr-crm.jsx
try { (() => {
// scr-crm.jsx — Enquiries kanban + Customers master-detail
const {
  useState: crS,
  useMemo: crM
} = React;

// ── ENQUIRIES (kanban pipeline) ─────────────────────────────────
function Enquiries({
  openCustomer
}) {
  const isMobile = useMedia();
  const stageColor = {
    Lead: 'var(--t4)',
    Quotation: 'var(--blue)',
    Pencil: 'var(--amber)',
    Won: 'var(--green)',
    Lost: 'var(--red)'
  };
  const active = ENQUIRIES.filter(e => ['Lead', 'Quotation', 'Pencil'].includes(e.stage));
  const pipeline = active.reduce((s, e) => s + e.est, 0);
  const wonVal = ENQUIRIES.filter(e => e.stage === 'Won').reduce((s, e) => s + e.est, 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "route",
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Toolbar, {
    title: isMobile ? null : 'Enquiries',
    stats: isMobile ? null : [{
      label: 'Active leads',
      value: active.length
    }, {
      label: 'Pipeline value',
      value: inr(pipeline),
      color: 'var(--ac)'
    }, {
      label: 'Won',
      value: inr(wonVal),
      color: 'var(--green)'
    }],
    actions: /*#__PURE__*/React.createElement("button", {
      className: "btn primary",
      onClick: () => toast('New enquiry', {
        icon: 'check'
      })
    }, /*#__PURE__*/React.createElement(Icon, {
      n: "plus",
      s: 15
    }), isMobile ? '' : 'New enquiry')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      height: '100%',
      minWidth: isMobile ? 'auto' : 900,
      flexDirection: isMobile ? 'column' : 'row'
    }
  }, ENQUIRY_STAGES.map(stage => {
    const items = ENQUIRIES.filter(e => e.stage === stage);
    const total = items.reduce((s, e) => s + e.est, 0);
    return /*#__PURE__*/React.createElement("div", {
      key: stage,
      style: {
        flex: isMobile ? 'none' : 1,
        minWidth: isMobile ? 'auto' : 220,
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '0 4px 8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: stageColor[stage]
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 600
      }
    }, stage), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontFamily: 'var(--fm)',
        color: 'var(--t3)',
        background: 'var(--sf2)',
        borderRadius: 3,
        padding: '0 5px'
      }
    }, items.length), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 'auto',
        fontSize: 10.5,
        fontFamily: 'var(--fm)',
        color: 'var(--t3)'
      }
    }, inr(total))), /*#__PURE__*/React.createElement("div", {
      className: "stagger",
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'var(--sf2)',
        borderRadius: 'var(--r)',
        padding: 8,
        minHeight: isMobile ? 'auto' : 100
      }
    }, items.map(e => {
      const c = customerById(e.customerId);
      return /*#__PURE__*/React.createElement("div", {
        key: e.id,
        onClick: () => openCustomer(e.customerId),
        className: "card lift",
        style: {
          padding: 11,
          cursor: 'pointer',
          boxShadow: 'none'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 6,
          marginBottom: 5
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0,
          flex: 1
        }
      }, c.name), c.priority === 'VIP' && /*#__PURE__*/React.createElement(Badge, {
        s: "vip",
        sm: true
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: 'var(--t2)',
          marginBottom: 3
        }
      }, e.functionType), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10.5,
          color: 'var(--t3)',
          fontFamily: 'var(--fm)',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap'
        }
      }, /*#__PURE__*/React.createElement("span", null, fmtDate(e.date)), /*#__PURE__*/React.createElement("span", null, e.guests, " pax"), /*#__PURE__*/React.createElement("span", null, hallById(e.hallIds[0]).name)), /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid var(--bd)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13,
          fontFamily: 'var(--fm)',
          fontWeight: 700
        }
      }, inr(e.est)), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9.5,
          fontFamily: 'var(--fm)',
          color: 'var(--t4)'
        }
      }, e.id)));
    }), !items.length && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--t4)',
        textAlign: 'center',
        padding: 12
      }
    }, "No enquiries")));
  }))));
}

// ── CUSTOMERS (master-detail / CRM) ─────────────────────────────
function Customers({
  openId,
  setOpenId,
  openBooking
}) {
  const isMobile = useMedia();
  const [q, setQ] = crS('');
  const list = crM(() => {
    const t = q.toLowerCase().trim();
    return CUSTOMERS.filter(c => !t || c.name.toLowerCase().includes(t) || c.phone.includes(t) || (c.city || '').toLowerCase().includes(t));
  }, [q]);
  const selected = openId ? CUSTOMERS.find(c => c.id === openId) : isMobile ? null : list[0];
  const ListHeader = /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderBottom: '1px solid var(--bd)',
      background: 'var(--sf)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 10,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "search",
    s: 15,
    c: "var(--t4)"
  })), /*#__PURE__*/React.createElement("input", {
    className: "input",
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Search customers\u2026",
    style: {
      paddingLeft: 32
    }
  })));
  const ListItems = /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto'
    }
  }, list.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    onClick: () => setOpenId(c.id),
    style: {
      padding: '11px 14px',
      borderBottom: '1px solid var(--bd)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      background: selected && selected.id === c.id && !isMobile ? 'var(--ac-soft)' : 'transparent',
      borderLeft: `2px solid ${selected && selected.id === c.id && !isMobile ? 'var(--ac)' : 'transparent'}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: '50%',
      background: 'var(--sf3)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 12,
      fontWeight: 600,
      fontFamily: 'var(--fm)',
      color: 'var(--t2)',
      flexShrink: 0
    }
  }, c.name.split(' ').map(x => x[0]).slice(0, 2).join('')), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, c.name), c.priority === 'VIP' && /*#__PURE__*/React.createElement(Badge, {
    s: "vip",
    sm: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--t3)',
      fontFamily: 'var(--fm)'
    }
  }, c.phone)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontFamily: 'var(--fm)',
      color: 'var(--t3)'
    }
  }, c.visits, " visits"), /*#__PURE__*/React.createElement(Stars, {
    n: c.rating
  })))));
  if (isMobile) {
    if (selected && openId) return /*#__PURE__*/React.createElement(CustomerDetail, {
      c: selected,
      onBack: () => setOpenId(null),
      openBooking: openBooking,
      isMobile: true
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "route",
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }
    }, ListHeader, ListItems);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "route",
    style: {
      height: '100%',
      display: 'flex',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 320,
      flexShrink: 0,
      borderRight: '1px solid var(--bd)',
      background: 'var(--sf)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, ListHeader, ListItems), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, selected ? /*#__PURE__*/React.createElement(CustomerDetail, {
    c: selected,
    key: selected.id,
    openBooking: openBooking
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--t3)'
    }
  }, "Select a customer")));
}
function Stars({
  n
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 1
    }
  }, [1, 2, 3, 4, 5].map(i => /*#__PURE__*/React.createElement(Icon, {
    key: i,
    n: "star",
    s: 10,
    c: i <= n ? 'var(--amber)' : 'var(--bd2)',
    sw: i <= n ? 0 : 1.5
  })));
}
function CustomerDetail({
  c,
  onBack,
  openBooking,
  isMobile
}) {
  const bookings = BOOKINGS.filter(b => b.customerId === c.id);
  const lifetime = bookings.reduce((s, b) => s + bookingTotal(b).grand, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflowY: 'auto',
      background: 'var(--bg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: isMobile ? '12px 16px' : '18px 24px',
      borderBottom: '1px solid var(--bd)',
      background: 'var(--sf)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, isMobile && /*#__PURE__*/React.createElement("button", {
    className: "btn icon sm ghost",
    onClick: onBack,
    style: {
      marginLeft: -6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back",
    s: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: '50%',
      background: 'var(--ac)',
      display: 'grid',
      placeItems: 'center',
      color: '#fff',
      fontSize: 17,
      fontWeight: 600,
      fontFamily: 'var(--fm)',
      flexShrink: 0
    }
  }, c.name.split(' ').map(x => x[0]).slice(0, 2).join('')), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: isMobile ? 18 : 21,
      fontWeight: 700
    }
  }, c.name), c.priority === 'VIP' && /*#__PURE__*/React.createElement(Badge, {
    s: "vip"
  }), c.priority === 'High' && /*#__PURE__*/React.createElement(Badge, {
    s: "high"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement(Stars, {
    n: c.rating
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: 'var(--t3)'
    }
  }, c.visits, " visits \xB7 ", c.occupation))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    },
    className: "only-desktop"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "phone",
    s: 14
  }), "Call"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "mail",
    s: 14
  }), "Email"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,auto)',
      gap: isMobile ? 10 : 28,
      marginTop: 14
    }
  }, [['Lifetime value', inr(lifetime)], ['Bookings', bookings.length], ['Avg. rating', c.rating + '/5'], ['Member since', '2022']].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, k), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      fontFamily: 'var(--fm)',
      marginTop: 2
    }
  }, v))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: isMobile ? 16 : 24,
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Section, {
    title: "Contact"
  }, /*#__PURE__*/React.createElement(Field, {
    k: "Phone",
    v: c.phone
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Alt phone",
    v: c.altPhone
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Email",
    v: c.email
  }), /*#__PURE__*/React.createElement(Field, {
    k: "City",
    v: c.city
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Profile"
  }, /*#__PURE__*/React.createElement(Field, {
    k: "Community",
    v: c.community
  }), /*#__PURE__*/React.createElement(Field, {
    k: "DOB",
    v: c.dob
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Anniversary",
    v: c.anniversary
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Company",
    v: c.company
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Tax"
  }, /*#__PURE__*/React.createElement(Field, {
    k: "GST",
    v: c.gst
  }), /*#__PURE__*/React.createElement(Field, {
    k: "PAN",
    v: c.pan
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Referrals"
  }, /*#__PURE__*/React.createElement(Field, {
    k: "Referred by",
    v: c.referredBy ? customerById(c.referredBy).name : 'Direct'
  }), /*#__PURE__*/React.createElement(Field, {
    k: "Referred",
    v: c.referrals.length ? c.referrals.map(r => customerById(r).name).join(', ') : 'None'
  }))), c.notes && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: isMobile ? '0 16px 16px' : '0 24px 20px'
    }
  }, /*#__PURE__*/React.createElement(Section, {
    title: "Notes"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: 'var(--t2)',
      lineHeight: 1.6,
      background: 'var(--sf)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--r-sm)',
      padding: 12
    }
  }, c.notes))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: isMobile ? '0 16px 24px' : '0 24px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginBottom: 10
    }
  }, "Booking history"), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      overflow: 'hidden'
    }
  }, bookings.length ? /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "ID"), /*#__PURE__*/React.createElement("th", null, "Function"), /*#__PURE__*/React.createElement("th", null, "Date"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Total"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, bookings.map(b => {
    const t = bookingTotal(b);
    return /*#__PURE__*/React.createElement("tr", {
      key: b.id,
      onClick: () => openBooking(b.id)
    }, /*#__PURE__*/React.createElement("td", {
      className: "mono"
    }, b.id), /*#__PURE__*/React.createElement("td", {
      style: {
        color: 'var(--t1)'
      }
    }, b.functionName), /*#__PURE__*/React.createElement("td", {
      className: "mono"
    }, fmtDate(b.start)), /*#__PURE__*/React.createElement("td", {
      className: "num",
      style: {
        fontWeight: 600
      }
    }, inr(t.grand)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Badge, {
      s: b.status,
      sm: true
    })));
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      textAlign: 'center',
      color: 'var(--t4)',
      fontSize: 13
    }
  }, "No bookings yet."))));
}
Object.assign(window, {
  Enquiries,
  Customers
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/scr-crm.jsx", error: String((e && e.message) || e) }); }

// app/scr-dashboard.jsx
try { (() => {
// scr-dashboard.jsx — operations cockpit: triage queue is the spine
const {
  useState: dS,
  useEffect: dE,
  useMemo: dM
} = React;
const NOW = new Date(2026, 5, 4); // current date
const dayDiff = d => Math.ceil((d - NOW) / 864e5);
function conflictPairs(bookings) {
  const out = [];
  for (let i = 0; i < bookings.length; i++) for (let j = i + 1; j < bookings.length; j++) {
    const a = bookings[i],
      b = bookings[j];
    if (a.status === 'cancelled' || b.status === 'cancelled') continue;
    if (a.hallIds.some(h => b.hallIds.includes(h)) && a.start < b.end && b.start < a.end) out.push([a, b]);
  }
  return out;
}
function buildTriage() {
  const items = [];
  // hall conflicts — highest priority
  conflictPairs(BOOKINGS).forEach(([a, b], i) => {
    items.push({
      key: 'cf' + i,
      sev: 'high',
      icon: 'bell',
      title: 'Hall conflict needs resolving',
      sub: `${hallById(a.hallIds.find(h => b.hallIds.includes(h))).name} · ${fmtDate(a.start)} · ${a.id} ↔ ${b.id}`,
      bid: a.id,
      actions: [{
        l: 'Resolve',
        primary: 1,
        done: 'Opened conflict'
      }, {
        l: 'Dismiss',
        done: 'Dismissed'
      }],
      sort: -1
    });
  });
  // pencils expiring
  BOOKINGS.filter(b => b.status === 'pencil' && b.pencilExpiresAt).forEach(b => {
    const dd = dayDiff(b.pencilExpiresAt);
    const t = bookingTotal(b);
    items.push({
      key: 'pe' + b.id,
      sev: dd <= 2 ? 'high' : 'med',
      icon: 'clock',
      title: `Pencil expires ${dd <= 0 ? 'today' : 'in ' + dd + 'd'}`,
      sub: `${b.functionName} · ${inr(t.grand)} at risk`,
      bid: b.id,
      actions: [{
        l: 'Confirm',
        primary: 1,
        done: 'Booking confirmed'
      }, {
        l: 'Extend',
        done: 'Pencil extended 3 days'
      }],
      sort: dd
    });
  });
  // balances due on near events
  BOOKINGS.filter(b => b.status === 'confirmed').forEach(b => {
    const bal = bookingTotal(b).balance,
      dd = dayDiff(b.start);
    if (bal > 0 && dd >= 0 && dd <= 22) {
      items.push({
        key: 'bal' + b.id,
        sev: dd <= 7 ? 'high' : 'med',
        icon: 'payments',
        title: `Balance ${inr(bal)} due`,
        sub: `${b.functionName} · event in ${dd}d`,
        bid: b.id,
        actions: [{
          l: 'Record',
          primary: 1,
          done: 'Payment recorded'
        }, {
          l: 'Remind',
          done: 'Reminder sent to customer'
        }],
        sort: dd
      });
    }
  });
  // quotations awaiting response
  BOOKINGS.filter(b => b.status === 'quotation').forEach(b => {
    items.push({
      key: 'qt' + b.id,
      sev: 'low',
      icon: 'mail',
      title: 'Quotation awaiting response',
      sub: `${b.functionName} · ${inr(bookingTotal(b).grand)} estimate`,
      bid: b.id,
      actions: [{
        l: 'Follow up',
        primary: 1,
        done: 'Follow-up logged'
      }],
      sort: 30
    });
  });
  const rank = {
    high: 0,
    med: 1,
    low: 2
  };
  return items.sort((a, b) => rank[a.sev] - rank[b.sev] || a.sort - b.sort);
}
function Dashboard({
  go,
  openBooking
}) {
  const isMobile = useMedia();
  const [range, setRange] = dS('This week');
  const [done, setDone] = dS([]);
  const triage = dM(() => buildTriage(), []);
  const live = triage.filter(t => !done.includes(t.key));
  const conflicts = dM(() => detectConflicts(BOOKINGS), []);
  const outstanding = dM(() => BOOKINGS.reduce((s, b) => s + bookingTotal(b).balance, 0), []);
  const pencilRisk = dM(() => BOOKINGS.filter(b => b.status === 'pencil').reduce((s, b) => s + bookingTotal(b).grand, 0), []);
  const confirmedCt = BOOKINGS.filter(b => b.status === 'confirmed').length;
  const weekCt = BOOKINGS.filter(b => {
    const dd = dayDiff(b.start);
    return dd >= 0 && dd <= 7;
  }).length;
  const act = (t, a) => {
    setDone(d => [...d, t.key]);
    if (a.l === 'Resolve') {
      go('calendar');
      return;
    }
    toast(a.done || 'Done', {
      icon: a.l === 'Remind' || a.l === 'Follow up' ? 'bell' : 'check',
      action: 'Undo',
      onAction: () => setDone(d => d.filter(k => k !== t.key))
    });
  };
  const sevColor = {
    high: 'var(--red)',
    med: 'var(--amber)',
    low: 'var(--sky)'
  };
  const sevBg = {
    high: 'var(--red-bg)',
    med: 'var(--amber-bg)',
    low: 'var(--sky-bg)'
  };
  const rev = [42, 58, 51, 64, 72, 88, 124, 96, 110, 132, 118, 62];
  const revLbl = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  const revMax = Math.max(...rev);
  const halls = [{
    n: 'Grand Ballroom',
    pct: 84,
    c: 'var(--ac)'
  }, {
    n: 'Pearl Lawn',
    pct: 72,
    c: 'var(--green)'
  }, {
    n: 'Heritage Hall',
    pct: 61,
    c: 'var(--blue)'
  }, {
    n: 'Crystal Hall',
    pct: 48,
    c: 'var(--amber)'
  }, {
    n: 'Others',
    pct: 33,
    c: 'var(--t4)'
  }];
  const upcoming = [...BOOKINGS].filter(b => dayDiff(b.start) >= 0).sort((a, b) => a.start - b.start).slice(0, 7);
  const stats = [{
    label: 'This week',
    value: /*#__PURE__*/React.createElement(CountUp, {
      value: weekCt,
      format: n => Math.round(n)
    }),
    onClick: () => go('calendar')
  }, {
    label: 'Confirmed',
    value: /*#__PURE__*/React.createElement(CountUp, {
      value: confirmedCt,
      format: n => Math.round(n)
    }),
    color: 'var(--green)',
    onClick: () => go('bookings')
  }, {
    label: 'Pencil at risk',
    value: /*#__PURE__*/React.createElement(CountUp, {
      value: pencilRisk,
      format: n => inr(n)
    }),
    color: 'var(--amber)'
  }, {
    label: 'Outstanding',
    value: /*#__PURE__*/React.createElement(CountUp, {
      value: outstanding,
      format: n => inr(n)
    }),
    color: 'var(--red)',
    onClick: () => go('payments')
  }, {
    label: 'Conflicts',
    value: /*#__PURE__*/React.createElement(CountUp, {
      value: conflicts.size,
      format: n => Math.round(n)
    }),
    color: conflicts.size ? 'var(--red)' : 'var(--t1)',
    onClick: () => go('calendar')
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "route",
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Toolbar, {
    title: isMobile ? null : 'Operations',
    stats: stats,
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "seg only-desktop"
    }, ['Today', 'This week', '30 days', 'Quarter'].map(t => /*#__PURE__*/React.createElement("button", {
      key: t,
      className: range === t ? 'on' : '',
      onClick: () => setRange(t)
    }, t))), /*#__PURE__*/React.createElement("button", {
      className: "btn primary",
      onClick: () => go('bookings', 'new')
    }, /*#__PURE__*/React.createElement(Icon, {
      n: "plus",
      s: 15
    }), isMobile ? '' : 'New booking'))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      background: 'var(--bg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
      gap: 12,
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, "Needs you now", live.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--red)',
      color: '#fff',
      borderRadius: 999,
      fontSize: 10,
      fontFamily: 'var(--fm)',
      fontWeight: 700,
      padding: '1px 7px'
    }
  }, live.length)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: 'var(--t4)',
      fontFamily: 'var(--fm)'
    }
  }, "priority order")), live.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "pop",
    style: {
      padding: '34px 16px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: 'var(--green-bg)',
      display: 'grid',
      placeItems: 'center',
      margin: '0 auto 10px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "check",
    s: 22,
    c: "var(--green)",
    sw: 2.4
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, "You're all caught up"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t3)',
      marginTop: 2
    }
  }, "Every urgent item has been handled.")) : /*#__PURE__*/React.createElement("div", {
    className: "stagger"
  }, live.map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t.key,
    className: "triage-item",
    onClick: () => openBooking(t.bid)
  }, /*#__PURE__*/React.createElement("div", {
    className: "triage-rail",
    style: {
      background: sevColor[t.sev]
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 7,
      background: sevBg[t.sev],
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: t.icon,
    s: 15,
    c: sevColor[t.sev]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, t.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--t3)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, t.sub)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexShrink: 0
    },
    onClick: e => e.stopPropagation()
  }, (isMobile ? t.actions.slice(0, 1) : t.actions).map((a, j) => /*#__PURE__*/React.createElement("button", {
    key: j,
    className: `btn sm ${a.primary ? 'primary' : ''}`,
    onClick: () => act(t, a)
  }, a.l))))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Revenue \xB7 trailing 12 months"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--t3)'
    }
  }, "\u20B9 in Lakhs")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 10px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: isMobile ? 3 : 6,
      height: 110
    }
  }, rev.map((v, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      background: i === 11 ? 'var(--sf3)' : 'var(--ac)',
      opacity: i === 11 ? .6 : 1,
      borderRadius: '3px 3px 0 0',
      height: `${v / revMax * 94}px`,
      minHeight: 3,
      transition: 'height .5s var(--ease-out)'
    },
    title: `${revLbl[i]}: ₹${v}L`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8.5,
      color: 'var(--t4)',
      fontFamily: 'var(--fm)'
    }
  }, revLbl[i])))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Hall utilization"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--t3)'
    }
  }, "This month")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      display: 'flex',
      gap: 18,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Donut, {
    segments: halls
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 7
    }
  }, halls.map(h => /*#__PURE__*/React.createElement("div", {
    key: h.n,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 11.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 2,
      background: h.c,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      color: 'var(--t2)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, h.n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fm)',
      color: 'var(--t3)'
    }
  }, h.pct, "%"))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Upcoming events"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    onClick: () => go('calendar')
  }, "Calendar ", /*#__PURE__*/React.createElement(Icon, {
    n: "chevR",
    s: 13
  }))), /*#__PURE__*/React.createElement("div", {
    className: "stagger"
  }, upcoming.map(b => {
    const c = customerById(b.customerId),
      t = bookingTotal(b);
    return /*#__PURE__*/React.createElement("div", {
      key: b.id,
      onClick: () => openBooking(b.id),
      style: {
        padding: '9px 14px',
        borderBottom: '1px solid var(--bd)',
        display: 'flex',
        gap: 11,
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background .12s'
      },
      onMouseEnter: e => e.currentTarget.style.background = 'var(--sf2)',
      onMouseLeave: e => e.currentTarget.style.background = 'transparent'
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        flexShrink: 0,
        width: 34
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 700,
        fontFamily: 'var(--fm)',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums'
      }
    }, b.start.getDate()), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8.5,
        color: 'var(--t4)',
        textTransform: 'uppercase',
        letterSpacing: '.04em'
      }
    }, b.start.toLocaleDateString('en-IN', {
      month: 'short'
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, b.functionName), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--t3)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, c.name, " \xB7 ", hallById(b.hallIds[0]).name)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Money, {
      v: t.grand
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 3
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      s: b.status,
      sm: true
    }))));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Live activity"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 11,
      color: 'var(--green)',
      fontFamily: 'var(--fm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: 'var(--green)'
    }
  }), "Realtime")), ACTIVITY.slice(0, 6).map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    onClick: () => openBooking(a.target),
    style: {
      padding: '8px 14px',
      borderBottom: i < 5 ? '1px solid var(--bd)' : 'none',
      display: 'flex',
      gap: 10,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--ac)',
      marginTop: 5,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 600
    }
  }, a.user), " ", a.action, " ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 600
    }
  }, a.target)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: 'var(--t3)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, a.detail)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: 'var(--t4)',
      fontFamily: 'var(--fm)',
      flexShrink: 0
    }
  }, fmtTime(a.when))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: isMobile ? 80 : 16
    }
  })));
}
function Donut({
  segments
}) {
  const size = 96,
    r = 38,
    cx = size / 2,
    cy = size / 2,
    circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.pct, 0);
  let off = 0;
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    style: {
      flexShrink: 0,
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r,
    fill: "none",
    stroke: "var(--sf2)",
    strokeWidth: "12"
  }), segments.map((s, i) => {
    const len = s.pct / total * circ;
    const el = /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: cx,
      cy: cy,
      r: r,
      fill: "none",
      stroke: s.c,
      strokeWidth: "12",
      strokeDasharray: `${len} ${circ - len}`,
      strokeDashoffset: -off,
      style: {
        transition: 'stroke-dasharray .6s var(--ease-out)'
      }
    });
    off += len;
    return el;
  }));
}
Object.assign(window, {
  Dashboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/scr-dashboard.jsx", error: String((e && e.message) || e) }); }

// app/shell.jsx
try { (() => {
// shell.jsx — responsive app shell: sidebar (desktop) / bottom-nav + drawer (mobile), topbar, command palette
const {
  useState: uS,
  useEffect: uE,
  useMemo: uM,
  useRef: uR
} = React;
const NAV = [{
  id: 'dashboard',
  l: 'Dashboard',
  icon: 'dashboard',
  grp: 'Operate'
}, {
  id: 'bookings',
  l: 'Bookings',
  icon: 'bookings',
  grp: 'Operate'
}, {
  id: 'calendar',
  l: 'Calendar',
  icon: 'calendar',
  grp: 'Operate'
}, {
  id: 'enquiries',
  l: 'Enquiries',
  icon: 'enquiries',
  grp: 'Operate'
}, {
  id: 'customers',
  l: 'Customers',
  icon: 'customers',
  grp: 'Operate'
}, {
  id: 'payments',
  l: 'Payments',
  icon: 'payments',
  grp: 'Operate'
}, {
  id: 'venues',
  l: 'Venues',
  icon: 'venues',
  grp: 'Catalog'
}, {
  id: 'menu',
  l: 'Menu & Items',
  icon: 'menu',
  grp: 'Catalog'
}, {
  id: 'reports',
  l: 'Reports',
  icon: 'reports',
  grp: 'Catalog'
}, {
  id: 'activity',
  l: 'Activity',
  icon: 'activity',
  grp: 'Catalog'
}, {
  id: 'settings',
  l: 'Settings',
  icon: 'settings',
  grp: 'Catalog'
}];
const MOBILE_TABS = ['dashboard', 'bookings', 'calendar', 'enquiries'];
function navBadge(id) {
  if (id === 'bookings') return BOOKINGS.length;
  if (id === 'enquiries') return ENQUIRIES.filter(e => ['Lead', 'Quotation', 'Pencil'].includes(e.stage)).length;
  if (id === 'payments') return BOOKINGS.filter(b => bookingTotal(b).balance > 0 && b.status === 'confirmed').length;
  return null;
}

// ── Desktop sidebar ─────────────────────────────────────────────
function Sidebar({
  route,
  go,
  collapsed,
  setCollapsed
}) {
  const groups = ['Operate', 'Catalog'];
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: collapsed ? 60 : 224,
      flexShrink: 0,
      height: '100%',
      background: 'var(--sf)',
      borderRight: '1px solid var(--bd)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width .18s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: collapsed ? '0 16px' : '0 16px',
      borderBottom: '1px solid var(--bd)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      background: 'var(--ac)',
      borderRadius: 6,
      display: 'grid',
      placeItems: 'center',
      color: '#fff',
      fontWeight: 700,
      fontSize: 15,
      fontFamily: 'var(--fm)',
      flexShrink: 0
    }
  }, "B"), !collapsed && /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.1,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 13.5,
      letterSpacing: '-.2px',
      whiteSpace: 'nowrap'
    }
  }, "Bika Banquet"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: 'var(--t4)',
      fontFamily: 'var(--fm)',
      textTransform: 'uppercase',
      letterSpacing: '.07em'
    }
  }, "Ops Console"))), /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '8px 0'
    }
  }, groups.map(g => /*#__PURE__*/React.createElement("div", {
    key: g,
    style: {
      marginBottom: 6
    }
  }, !collapsed && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 16px 4px',
      fontSize: 9.5,
      fontFamily: 'var(--fm)',
      textTransform: 'uppercase',
      letterSpacing: '.09em',
      color: 'var(--t4)'
    }
  }, g), NAV.filter(n => n.grp === g).map(n => {
    const on = route === n.id,
      badge = navBadge(n.id);
    return /*#__PURE__*/React.createElement("button", {
      key: n.id,
      onClick: () => go(n.id),
      title: n.l,
      style: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: collapsed ? '9px 0' : '8px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        border: 'none',
        background: on ? 'var(--ac-soft)' : 'transparent',
        color: on ? 'var(--ac)' : 'var(--t2)',
        borderLeft: `2px solid ${on ? 'var(--ac)' : 'transparent'}`,
        fontSize: 12.5,
        fontWeight: on ? 500 : 400,
        textAlign: 'left',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      n: n.icon,
      s: 17,
      c: on ? 'var(--ac)' : 'var(--t3)'
    }), !collapsed && /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        whiteSpace: 'nowrap'
      }
    }, n.l), !collapsed && badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        background: on ? 'var(--ac)' : 'var(--sf2)',
        color: on ? '#fff' : 'var(--t3)',
        borderRadius: 3,
        padding: '0 5px',
        fontSize: 9.5,
        fontFamily: 'var(--fm)',
        fontWeight: 600,
        lineHeight: '16px'
      }
    }, badge), collapsed && badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 5,
        right: 9,
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'var(--ac)'
      }
    }));
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--bd)',
      padding: collapsed ? '10px 0' : '10px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      justifyContent: collapsed ? 'center' : 'flex-start',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: 'var(--ac)',
      display: 'grid',
      placeItems: 'center',
      color: '#fff',
      fontSize: 11,
      fontWeight: 600,
      fontFamily: 'var(--fm)',
      flexShrink: 0
    }
  }, "PN"), !collapsed && /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: 'hidden',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      whiteSpace: 'nowrap'
    }
  }, "Priya Nambiar"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--t3)',
      whiteSpace: 'nowrap'
    }
  }, "Operations Lead \xB7 Andheri")), !collapsed && /*#__PURE__*/React.createElement("button", {
    className: "btn icon sm ghost",
    onClick: () => setCollapsed(true),
    title: "Collapse"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "chevL",
    s: 15
  }))), collapsed && /*#__PURE__*/React.createElement("button", {
    className: "btn icon sm ghost",
    onClick: () => setCollapsed(false),
    style: {
      margin: '0 auto 10px'
    },
    title: "Expand"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "chevR",
    s: 15
  })));
}

// ── Topbar ──────────────────────────────────────────────────────
function Topbar({
  route,
  onSearch,
  theme,
  toggleTheme,
  onMenu,
  isMobile
}) {
  const [clock, setClock] = uS('');
  uE(() => {
    const t = () => setClock(new Date().toLocaleTimeString('en-IN', {
      hour12: false
    }));
    t();
    const i = setInterval(t, 1000);
    return () => clearInterval(i);
  }, []);
  const title = (NAV.find(n => n.id === route) || {}).l || '';
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 56,
      flexShrink: 0,
      background: 'var(--sf)',
      borderBottom: '1px solid var(--bd)',
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '0 14px' : '0 20px',
      gap: 12
    }
  }, isMobile ? /*#__PURE__*/React.createElement("button", {
    className: "btn icon ghost",
    onClick: onMenu
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "menu2",
    s: 20
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12.5,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t3)'
    }
  }, "Bika Banquets"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t4)'
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--t1)',
      fontWeight: 500
    }
  }, title)), isMobile && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      flex: 1
    }
  }, title), !isMobile && /*#__PURE__*/React.createElement("button", {
    onClick: onSearch,
    style: {
      flex: 1,
      maxWidth: 380,
      margin: '0 auto',
      height: 34,
      background: 'var(--sf2)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--r-sm)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 8,
      color: 'var(--t3)',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "search",
    s: 15,
    c: "var(--t3)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      textAlign: 'left'
    }
  }, "Search bookings, customers, halls\u2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fm)',
      fontSize: 10,
      background: 'var(--sf)',
      border: '1px solid var(--bd)',
      borderRadius: 3,
      padding: '1px 5px'
    }
  }, "\u2318K")), isMobile && /*#__PURE__*/React.createElement("button", {
    className: "btn icon ghost",
    onClick: onSearch
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "search",
    s: 19
  })), !isMobile && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 11,
      color: 'var(--green)',
      fontFamily: 'var(--fm)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--green)',
      boxShadow: '0 0 0 3px var(--green-bg)'
    }
  }), "Live"), !isMobile && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      lineHeight: 1.2,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--fm)',
      fontSize: 11,
      color: 'var(--t2)'
    }
  }, clock), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: 'var(--t4)',
      textTransform: 'uppercase',
      letterSpacing: '.06em'
    }
  }, "Mumbai")), /*#__PURE__*/React.createElement("button", {
    className: "btn icon ghost",
    onClick: toggleTheme,
    title: "Theme"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: theme === 'light' ? 'moon' : 'sun',
    s: 17
  })));
}

// ── Desktop horizontal top-nav (alternative to sidebar) ────────
function TopNav({
  route,
  go,
  onSearch,
  theme,
  toggleTheme
}) {
  const [clock, setClock] = uS('');
  uE(() => {
    const t = () => setClock(new Date().toLocaleTimeString('en-IN', {
      hour12: false
    }));
    t();
    const i = setInterval(t, 1000);
    return () => clearInterval(i);
  }, []);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 44,
      flexShrink: 0,
      background: 'var(--sf)',
      borderBottom: '1px solid var(--bd)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 2,
      background: 'var(--ac)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fm)',
      fontSize: 11,
      fontWeight: 500,
      color: 'var(--t3)',
      letterSpacing: '.04em',
      whiteSpace: 'nowrap'
    },
    className: "only-desktop"
  }, "BIKA OPS")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 18,
      background: 'var(--bd)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      flex: 1,
      overflowX: 'auto',
      height: '100%',
      scrollbarWidth: 'none'
    }
  }, NAV.map(n => {
    const on = route === n.id,
      badge = navBadge(n.id);
    return /*#__PURE__*/React.createElement("button", {
      key: n.id,
      onClick: () => go(n.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 10px',
        height: '100%',
        border: 'none',
        background: 'none',
        color: on ? 'var(--ac)' : 'var(--t3)',
        fontSize: 12,
        fontWeight: on ? 600 : 400,
        whiteSpace: 'nowrap',
        borderBottom: `2px solid ${on ? 'var(--ac)' : 'transparent'}`,
        position: 'relative'
      }
    }, n.l, badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        background: on ? 'var(--ac)' : 'var(--sf2)',
        color: on ? '#fff' : 'var(--t3)',
        borderRadius: 3,
        padding: '0 4px',
        fontSize: 9,
        fontFamily: 'var(--fm)',
        fontWeight: 600,
        lineHeight: '15px'
      }
    }, badge));
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onSearch,
    style: {
      height: 28,
      background: 'var(--sf2)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--r-sm)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 9px',
      gap: 7,
      color: 'var(--t4)',
      fontSize: 11.5,
      flexShrink: 0,
      maxWidth: 150
    },
    className: "only-desktop"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "search",
    s: 13,
    c: "var(--t4)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      textAlign: 'left',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, "Search"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fm)',
      fontSize: 9.5,
      border: '1px solid var(--bd)',
      borderRadius: 3,
      padding: '0 4px'
    }
  }, "\u2318K")), /*#__PURE__*/React.createElement("button", {
    className: "btn icon ghost only-mobile",
    onClick: onSearch,
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "search",
    s: 17
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fm)',
      fontSize: 10.5,
      color: 'var(--t4)',
      flexShrink: 0,
      whiteSpace: 'nowrap'
    },
    className: "only-desktop"
  }, clock), /*#__PURE__*/React.createElement("button", {
    className: "btn icon sm ghost",
    onClick: toggleTheme,
    title: "Theme",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: theme === 'light' ? 'moon' : 'sun',
    s: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 26,
      height: 26,
      borderRadius: '50%',
      background: 'var(--sf3)',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--t2)',
      fontSize: 10,
      fontWeight: 600,
      fontFamily: 'var(--fm)',
      flexShrink: 0
    },
    title: "Priya Nambiar \xB7 Operations Lead"
  }, "PN"));
}

// ── Mobile bottom nav ───────────────────────────────────────────
function BottomNav({
  route,
  go,
  onMore
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      height: 60,
      flexShrink: 0,
      background: 'var(--sf)',
      borderTop: '1px solid var(--bd)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }
  }, MOBILE_TABS.map(id => {
    const n = NAV.find(x => x.id === id),
      on = route === id,
      badge = navBadge(id);
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      onClick: () => go(id),
      style: {
        flex: 1,
        border: 'none',
        background: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        color: on ? 'var(--ac)' : 'var(--t3)',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      n: n.icon,
      s: 21,
      c: on ? 'var(--ac)' : 'var(--t3)'
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9.5,
        fontWeight: on ? 600 : 400
      }
    }, n.l), badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: 6,
        right: 'calc(50% - 18px)',
        background: 'var(--ac)',
        color: '#fff',
        fontSize: 8,
        fontFamily: 'var(--fm)',
        fontWeight: 600,
        minWidth: 14,
        height: 14,
        borderRadius: 7,
        display: 'grid',
        placeItems: 'center',
        padding: '0 3px'
      }
    }, badge));
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onMore,
    style: {
      flex: 1,
      border: 'none',
      background: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      color: 'var(--t3)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "more",
    s: 21
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9.5
    }
  }, "More")));
}

// ── Mobile drawer (full nav) ────────────────────────────────────
function MobileDrawer({
  open,
  onClose,
  route,
  go,
  theme,
  toggleTheme
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "scrim",
    onClick: onClose,
    style: {
      zIndex: 70
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: 'min(300px,84vw)',
      background: 'var(--bg)',
      zIndex: 71,
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideL .22s cubic-bezier(.32,.72,0,1)'
    }
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes slideL{from{transform:translateX(-100%)}to{transform:translateX(0)}}`), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 16px',
      borderBottom: '1px solid var(--bd)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      background: 'var(--ac)',
      borderRadius: 6,
      display: 'grid',
      placeItems: 'center',
      color: '#fff',
      fontWeight: 700,
      fontFamily: 'var(--fm)'
    }
  }, "B"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 13.5
    }
  }, "Bika Banquet"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: 'var(--t4)',
      fontFamily: 'var(--fm)',
      textTransform: 'uppercase'
    }
  }, "Ops Console")), /*#__PURE__*/React.createElement("button", {
    className: "btn icon ghost",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "close",
    s: 18
  }))), /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px 0'
    }
  }, ['Operate', 'Catalog'].map(g => /*#__PURE__*/React.createElement("div", {
    key: g
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 16px 4px',
      fontSize: 9.5,
      fontFamily: 'var(--fm)',
      textTransform: 'uppercase',
      letterSpacing: '.09em',
      color: 'var(--t4)'
    }
  }, g), NAV.filter(n => n.grp === g).map(n => {
    const on = route === n.id,
      badge = navBadge(n.id);
    return /*#__PURE__*/React.createElement("button", {
      key: n.id,
      onClick: () => {
        go(n.id);
        onClose();
      },
      style: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 16px',
        border: 'none',
        background: on ? 'var(--ac-soft)' : 'transparent',
        color: on ? 'var(--ac)' : 'var(--t2)',
        borderLeft: `2px solid ${on ? 'var(--ac)' : 'transparent'}`,
        fontSize: 13.5,
        fontWeight: on ? 500 : 400,
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      n: n.icon,
      s: 18,
      c: on ? 'var(--ac)' : 'var(--t3)'
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, n.l), badge != null && /*#__PURE__*/React.createElement("span", {
      style: {
        background: 'var(--sf2)',
        color: 'var(--t3)',
        borderRadius: 3,
        padding: '0 6px',
        fontSize: 10,
        fontFamily: 'var(--fm)',
        fontWeight: 600
      }
    }, badge));
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--bd)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 34,
      height: 34,
      borderRadius: '50%',
      background: 'var(--ac)',
      display: 'grid',
      placeItems: 'center',
      color: '#fff',
      fontSize: 12,
      fontWeight: 600,
      fontFamily: 'var(--fm)'
    }
  }, "PN"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, "Priya Nambiar"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: 'var(--t3)'
    }
  }, "Operations Lead")), /*#__PURE__*/React.createElement("button", {
    className: "btn icon ghost",
    onClick: toggleTheme
  }, /*#__PURE__*/React.createElement(Icon, {
    n: theme === 'light' ? 'moon' : 'sun',
    s: 17
  })))));
}

// ── Command palette ─────────────────────────────────────────────
function CommandPalette({
  open,
  onClose,
  go,
  openBooking,
  openCustomer
}) {
  const [q, setQ] = uS('');
  const inputRef = uR(null);
  uE(() => {
    if (open) {
      setQ('');
      setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    }
  }, [open]);
  const results = uM(() => {
    const t = q.toLowerCase().trim();
    const pages = NAV.filter(n => !t || n.l.toLowerCase().includes(t)).map(n => ({
      grp: 'Pages',
      id: n.id,
      label: n.l,
      icon: n.icon,
      act: () => go(n.id)
    }));
    const bk = BOOKINGS.filter(b => !t || b.functionName.toLowerCase().includes(t) || b.id.toLowerCase().includes(t)).slice(0, 5).map(b => ({
      grp: 'Bookings',
      id: b.id,
      label: b.functionName,
      sub: b.id,
      act: () => openBooking(b.id)
    }));
    const cu = CUSTOMERS.filter(c => !t || c.name.toLowerCase().includes(t) || c.phone.includes(t)).slice(0, 5).map(c => ({
      grp: 'Customers',
      id: c.id,
      label: c.name,
      sub: c.phone,
      act: () => openCustomer(c.id)
    }));
    return [...pages.slice(0, t ? 6 : 4), ...bk, ...cu];
  }, [q]);
  if (!open) return null;
  const grps = [...new Set(results.map(r => r.grp))];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "scrim",
    onClick: onClose,
    style: {
      zIndex: 80,
      alignItems: 'flex-start'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: '12vh',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(560px,92vw)',
      background: 'var(--bg)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 81,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '70vh'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '13px 16px',
      borderBottom: '1px solid var(--bd)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "search",
    s: 17,
    c: "var(--t3)"
  }), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Search bookings, customers, pages\u2026",
    style: {
      flex: 1,
      border: 'none',
      background: 'none',
      outline: 'none',
      fontSize: 14,
      color: 'var(--t1)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fm)',
      fontSize: 10,
      color: 'var(--t4)',
      border: '1px solid var(--bd)',
      borderRadius: 3,
      padding: '1px 5px'
    }
  }, "ESC")), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: 'auto',
      padding: '6px 0'
    }
  }, grps.map(g => /*#__PURE__*/React.createElement("div", {
    key: g
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 16px 2px',
      fontSize: 9.5,
      fontFamily: 'var(--fm)',
      textTransform: 'uppercase',
      letterSpacing: '.08em',
      color: 'var(--t4)'
    }
  }, g), results.filter(r => r.grp === g).map(r => /*#__PURE__*/React.createElement("button", {
    key: r.grp + r.id,
    onClick: () => {
      r.act();
      onClose();
    },
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: '9px 16px',
      border: 'none',
      background: 'none',
      textAlign: 'left',
      color: 'var(--t1)'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'var(--sf2)',
    onMouseLeave: e => e.currentTarget.style.background = 'none'
  }, r.icon && /*#__PURE__*/React.createElement(Icon, {
    n: r.icon,
    s: 16,
    c: "var(--t3)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 13
    }
  }, r.label), r.sub && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--t3)',
      fontFamily: 'var(--fm)'
    }
  }, r.sub))))), results.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px',
      textAlign: 'center',
      color: 'var(--t3)',
      fontSize: 13
    }
  }, "No results"))));
}
Object.assign(window, {
  NAV,
  Sidebar,
  Topbar,
  TopNav,
  BottomNav,
  MobileDrawer,
  CommandPalette
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/shell.jsx", error: String((e && e.message) || e) }); }

// app/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// app/ui.jsx
try { (() => {
// ui.jsx — design tokens (CSS vars), global styles, responsive hook, primitives
const {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext
} = React;

// ── Global stylesheet (warm stone + teal, Inter Tight) ──────────
const GLOBAL_CSS = `
:root{
  --bg:#FAFAF9; --sf:#FFFFFF; --sf2:#F5F5F4; --sf3:#EFEDEA;
  --bd:#EBE9E6; --bd2:#D6D3CE;
  --t1:#1C1917; --t2:#44403C; --t3:#78716C; --t4:#A8A29E;
  --ac:#0F766E; --ac-h:#0D5F58; --ac-soft:#F0FDFA; --ac-bd:#99F6E4;
  --green:#16A34A; --green-bg:#DCFCE7; --green-fg:#14532D;
  --amber:#D97706; --amber-bg:#FEF3C7; --amber-fg:#78350F;
  --blue:#2563EB;  --blue-bg:#DBEAFE;  --blue-fg:#1E3A8A;
  --sky:#0284C7;   --sky-bg:#E0F2FE;   --sky-fg:#075985;
  --red:#DC2626;   --red-bg:#FEE2E2;   --red-fg:#7F1D1D;
  --r:6px; --r-sm:4px; --r-lg:10px;
  --ff:"Inter Tight",ui-sans-serif,system-ui,sans-serif;
  --fm:"JetBrains Mono",ui-monospace,monospace;
  --shadow:0 1px 2px rgba(28,25,23,.04),0 2px 8px rgba(28,25,23,.04);
  --shadow-lg:0 8px 28px rgba(28,25,23,.14),0 2px 8px rgba(28,25,23,.08);
  --ease:cubic-bezier(.32,.72,0,1); --ease-out:cubic-bezier(.16,1,.3,1);
}
[data-theme="dark"]{
  --bg:#0C0A09; --sf:#1C1917; --sf2:#262321; --sf3:#2E2A27;
  --bd:#2E2A27; --bd2:#44403C;
  --t1:#FAFAF9; --t2:#D6D3CE; --t3:#A8A29E; --t4:#78716C;
  --ac:#2DD4BF; --ac-h:#5EEAD4; --ac-soft:#0F2E2A; --ac-bd:#155E56;
  --green-bg:#0F2E1A; --green-fg:#86EFAC;
  --amber-bg:#3A2A0A; --amber-fg:#FCD34D;
  --blue-bg:#13284D; --blue-fg:#93C5FD;
  --sky-bg:#0A2A3D; --sky-fg:#7DD3FC;
  --red-bg:#3A1212; --red-fg:#FCA5A5;
  --shadow:0 1px 2px rgba(0,0,0,.3); --shadow-lg:0 8px 28px rgba(0,0,0,.5);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;width:100%}
body{font-family:var(--ff);background:var(--bg);color:var(--t1);font-size:13px;line-height:1.5;-webkit-font-smoothing:antialiased;overflow:hidden}
button{font-family:inherit;cursor:pointer}
input,select,textarea{font-family:inherit}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:6px;border:2px solid var(--bg)}
::-webkit-scrollbar-track{background:transparent}

/* status badge */
.badge{display:inline-flex;align-items:center;gap:4px;border-radius:3px;padding:2px 7px;font-size:10.5px;font-family:var(--fm);font-weight:600;letter-spacing:.04em;text-transform:uppercase;line-height:1.5;white-space:nowrap;flex-shrink:0}
.badge .dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.badge.sm{font-size:9.5px;padding:1px 5px}
.badge.confirmed{background:var(--green-bg);color:var(--green-fg)} .badge.confirmed .dot{background:var(--green)}
.badge.pencil{background:var(--amber-bg);color:var(--amber-fg)} .badge.pencil .dot{background:var(--amber)}
.badge.quotation{background:var(--blue-bg);color:var(--blue-fg)} .badge.quotation .dot{background:var(--blue)}
.badge.enquiry{background:var(--sky-bg);color:var(--sky-fg)} .badge.enquiry .dot{background:var(--sky)}
.badge.won{background:var(--green-bg);color:var(--green-fg)} .badge.won .dot{background:var(--green)}
.badge.lost{background:var(--red-bg);color:var(--red-fg)} .badge.lost .dot{background:var(--red)}
.badge.cancelled{background:var(--red-bg);color:var(--red-fg)} .badge.cancelled .dot{background:var(--red)}
.badge.lead{background:var(--sf2);color:var(--t3)} .badge.lead .dot{background:var(--t4)}
.badge.vip{background:var(--amber-bg);color:var(--amber-fg)} .badge.vip .dot{background:var(--amber)}
.badge.high{background:var(--blue-bg);color:var(--blue-fg)} .badge.high .dot{background:var(--blue)}
.badge.normal{background:var(--sf2);color:var(--t3)} .badge.normal .dot{background:var(--t4)}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;padding:0 14px;border-radius:var(--r-sm);font-size:12.5px;font-weight:500;border:1px solid var(--bd);background:var(--sf);color:var(--t2);transition:background .12s,border-color .12s;white-space:nowrap}
.btn:hover{background:var(--sf2);border-color:var(--bd2)}
.btn.primary{background:var(--ac);border-color:var(--ac);color:#fff}
.btn.primary:hover{background:var(--ac-h);border-color:var(--ac-h)}
.btn.ghost{border-color:transparent;background:transparent}
.btn.ghost:hover{background:var(--sf2)}
.btn.danger{color:var(--red);border-color:var(--bd)}
.btn.danger:hover{background:var(--red-bg);border-color:var(--red)}
.btn.sm{height:28px;padding:0 10px;font-size:11.5px}
.btn.icon{width:34px;padding:0}
.btn.icon.sm{width:28px}

/* inputs */
.field{display:flex;flex-direction:column;gap:5px}
.field label{font-size:10.5px;font-family:var(--fm);text-transform:uppercase;letter-spacing:.06em;color:var(--t3)}
.input,.select,.textarea{height:34px;padding:0 10px;border:1px solid var(--bd);border-radius:var(--r-sm);background:var(--sf);color:var(--t1);font-size:12.5px;width:100%;transition:border-color .12s,box-shadow .12s}
.textarea{height:auto;padding:8px 10px;resize:vertical;min-height:64px;line-height:1.5}
.input:focus,.select:focus,.textarea:focus{outline:none;border-color:var(--ac);box-shadow:0 0 0 3px var(--ac-soft)}
.input::placeholder,.textarea::placeholder{color:var(--t4)}

/* card */
.card{background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);box-shadow:var(--shadow)}
.card-h{padding:11px 16px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;gap:10px}
.card-h h3{font-size:13px;font-weight:600;color:var(--t1);white-space:nowrap}
.card-h>span,.card-h>button{flex-shrink:0;white-space:nowrap}

/* tables */
.tbl{width:100%;border-collapse:collapse}
.tbl th{text-align:left;padding:9px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--t3);font-family:var(--fm);font-weight:400;border-bottom:1px solid var(--bd);background:var(--sf2);white-space:nowrap;position:sticky;top:0;z-index:2}
.tbl td{padding:10px 14px;border-bottom:1px solid var(--bd);font-size:12.5px;color:var(--t2);vertical-align:middle}
.tbl tbody tr{cursor:pointer;transition:background .1s}
.tbl tbody tr:hover{background:var(--sf2)}
.tbl tbody tr.sel{background:var(--ac-soft)}
.tbl .num{font-family:var(--fm);text-align:right;white-space:nowrap}
.tbl .mono{font-family:var(--fm)}

/* sectioned label */
.eyebrow{font-size:10px;font-family:var(--fm);text-transform:uppercase;letter-spacing:.08em;color:var(--t4)}

/* page header */
.page-h{padding:11px 20px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;background:var(--sf)}
.page-h h1{font-size:15px;font-weight:600;letter-spacing:-.2px;color:var(--t1)}
.page-h .sub{font-size:11.5px;color:var(--t3);margin-top:1px}

/* segmented control */
.seg{display:inline-flex;border:1px solid var(--bd);border-radius:var(--r-sm);overflow:hidden;background:var(--sf)}
.seg button{height:30px;padding:0 12px;font-size:11.5px;border:none;background:transparent;color:var(--t3);border-right:1px solid var(--bd)}
.seg button:last-child{border-right:none}
.seg button.on{background:var(--ac);color:#fff;font-weight:500}

/* chips */
.chip{height:26px;padding:0 9px;border-radius:999px;border:1px solid var(--bd);background:var(--sf);color:var(--t3);font-size:11px;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.chip.on{background:var(--ac-soft);border-color:var(--ac-bd);color:var(--ac)}

/* sheet/modal */
.scrim{position:fixed;inset:0;background:rgba(28,25,23,.32);z-index:60;animation:fade .15s ease}
[data-theme="dark"] .scrim{background:rgba(0,0,0,.55)}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes slideR{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes slideU{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sheet{position:fixed;top:0;right:0;bottom:0;width:min(480px,100vw);background:var(--bg);z-index:61;box-shadow:var(--shadow-lg);display:flex;flex-direction:column;animation:slideR .22s cubic-bezier(.32,.72,0,1)}

/* utility */
.prog{height:4px;background:var(--sf2);border-radius:3px;overflow:hidden}
.prog>span{display:block;height:100%;border-radius:3px}
.hatch{background-image:repeating-linear-gradient(45deg,rgba(217,119,6,.22) 0 6px,transparent 6px 12px)}
@keyframes pulseC{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.0)}50%{box-shadow:0 0 0 3px rgba(220,38,38,.35)}}
.conflict{animation:pulseC 1.8s ease-in-out infinite;outline:2px solid var(--red);outline-offset:-2px}
.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}

/* density */
[data-density="compact"] .tbl td{padding:5px 14px}
[data-density="compact"] .tbl th{padding:5px 14px}
[data-density="compact"] .page-h{padding-top:8px;padding-bottom:8px}
[data-density="compact"] .card-h{padding:7px 16px}
[data-density="compact"] .btn{height:30px}
[data-density="comfy"] .tbl td{padding:14px 16px}
[data-density="comfy"] .tbl th{padding:12px 16px}
[data-density="comfy"] .page-h{padding-top:22px;padding-bottom:22px}
[data-density="comfy"] .card-h{padding:15px 18px}
[data-density="comfy"] .btn{height:38px}

/* ── motion system ─────────────────────────────────────────── */
.num,.mono,.tnum{font-variant-numeric:tabular-nums}
.btn,.chip,.seg button{transition:background .14s,border-color .14s,color .14s,transform .08s}
.btn:active{transform:scale(.97)}
.card{transition:box-shadow .16s var(--ease-out),border-color .16s,transform .16s var(--ease-out)}
.lift{transition:transform .15s var(--ease-out),box-shadow .15s var(--ease-out),border-color .15s}
@media(prefers-reduced-motion:no-preference){
  .lift:hover{transform:translateY(-2px);box-shadow:var(--shadow-lg);border-color:var(--bd2)}
  .route{animation:routeIn .34s var(--ease-out)}
  @keyframes routeIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
  .stagger>*{animation:rowIn .4s var(--ease-out) backwards}
  @keyframes rowIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .stagger>*:nth-child(1){animation-delay:.02s}.stagger>*:nth-child(2){animation-delay:.05s}
  .stagger>*:nth-child(3){animation-delay:.08s}.stagger>*:nth-child(4){animation-delay:.11s}
  .stagger>*:nth-child(5){animation-delay:.14s}.stagger>*:nth-child(6){animation-delay:.17s}
  .stagger>*:nth-child(7){animation-delay:.2s}.stagger>*:nth-child(8){animation-delay:.23s}
  .stagger>*:nth-child(9){animation-delay:.26s}.stagger>*:nth-child(10){animation-delay:.29s}
  .stagger>*:nth-child(n+11){animation-delay:.31s}
  .pop{animation:pop .2s var(--ease-out)}
  @keyframes pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
}

/* ── toolbar (unified header band) ─────────────────────────── */
.toolbar{display:flex;align-items:center;gap:12px;padding:0 16px;height:46px;border-bottom:1px solid var(--bd);background:var(--sf);flex-shrink:0}
.toolbar .tb-title{font-size:13px;font-weight:600;letter-spacing:-.1px;color:var(--t1);white-space:nowrap;flex-shrink:0}
.toolbar .tb-stats{display:flex;align-items:stretch;gap:0;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none}
.toolbar .tb-stats::-webkit-scrollbar{display:none}
.toolbar .tb-actions{display:flex;align-items:center;gap:7px;flex-shrink:0;margin-left:auto}
[data-density="compact"] .toolbar{height:42px}
[data-density="comfy"] .toolbar{height:54px}
.statpill{display:flex;flex-direction:column;justify-content:center;padding:0 14px;border-left:1px solid var(--bd);min-width:0;cursor:default;transition:background .12s}
.statpill:first-child{border-left:none}
.statpill.click{cursor:pointer}
.statpill.click:hover{background:var(--sf2)}
.statpill .sp-l{font-size:9px;font-family:var(--fm);text-transform:uppercase;letter-spacing:.06em;color:var(--t4);white-space:nowrap;line-height:1.3}
.statpill .sp-v{font-size:14px;font-weight:700;letter-spacing:-.3px;font-variant-numeric:tabular-nums;line-height:1.15;white-space:nowrap}
@media(max-width:860px){
  .toolbar{height:auto;flex-wrap:wrap;padding:8px 12px;gap:8px}
  .toolbar .tb-stats{order:3;width:100%;border-top:1px solid var(--bd);padding-top:7px}
  .statpill{padding:0 12px 0 0;border-left:none}
  .statpill .sp-v{font-size:15px}
}

/* ── money ─────────────────────────────────────────────────── */
.money{font-family:var(--fm);font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}
.money.owed{color:var(--red)} .money.clear{color:var(--green)} .money.muted{color:var(--t3)}

/* ── inline edit ───────────────────────────────────────────── */
.iedit{cursor:text;border-radius:3px;padding:1px 4px;margin:-1px -4px;transition:background .12s,box-shadow .12s;display:inline-flex;align-items:center;gap:4px}
.iedit:hover{background:var(--ac-soft);box-shadow:inset 0 0 0 1px var(--ac-bd)}
.iedit-input{font-family:inherit;font-size:inherit;font-weight:inherit;color:var(--t1);border:none;background:var(--sf);outline:2px solid var(--ac);border-radius:3px;padding:1px 4px;margin:-1px -4px;width:auto;min-width:40px}

/* ── toast ─────────────────────────────────────────────────── */
#__toasts{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:200;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}
@media(max-width:860px){#__toasts{bottom:74px}}
.toast{pointer-events:auto;display:flex;align-items:center;gap:10px;background:var(--t1);color:var(--bg);padding:10px 14px;border-radius:8px;font-size:12.5px;box-shadow:var(--shadow-lg);animation:toastIn .26s var(--ease-out);max-width:90vw}
.toast .ta{color:var(--ac);font-weight:600;cursor:pointer;font-size:12px;background:none;border:none;padding:0;white-space:nowrap}
@keyframes toastIn{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
.toast.out{animation:toastOut .2s var(--ease) forwards}
@keyframes toastOut{to{opacity:0;transform:translateY(8px) scale(.97)}}

/* ── FAB ───────────────────────────────────────────────────── */
.fab{position:fixed;right:16px;bottom:74px;z-index:50;width:54px;height:54px;border-radius:50%;background:var(--ac);color:#fff;border:none;box-shadow:0 6px 20px rgba(15,118,110,.4);display:grid;place-items:center;transition:transform .16s var(--ease-out)}
.fab:active{transform:scale(.92)}

/* ── swipe row (mobile) ────────────────────────────────────── */
.swipe-wrap{position:relative;overflow:hidden}
.swipe-actions{position:absolute;top:0;right:0;bottom:0;display:flex;align-items:stretch}
.swipe-actions button{border:none;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:74px;font-size:10px;font-weight:600}
.swipe-fg{position:relative;background:var(--sf);transition:transform .24s var(--ease-out);will-change:transform;touch-action:pan-y}

/* ── triage / action queue ─────────────────────────────────── */
.triage-item{display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid var(--bd);transition:background .12s;cursor:pointer}
.triage-item:hover{background:var(--sf2)}
.triage-rail{width:3px;align-self:stretch;border-radius:2px;flex-shrink:0}
.kbd{font-family:var(--fm);font-size:10px;background:var(--sf2);border:1px solid var(--bd);border-bottom-width:2px;border-radius:4px;padding:1px 5px;color:var(--t3);line-height:1.5;white-space:nowrap}

/* segmented active slide */
.seg button{transition:background .16s var(--ease),color .16s}

/* responsive helpers */
.only-desktop{display:revert}
.only-mobile{display:none}
@media(max-width:860px){
  .only-desktop{display:none!important}
  .only-mobile{display:revert}
  .page-h{padding:14px 16px}
  .page-h h1{font-size:17px}
}
`;
function GlobalStyles() {
  useEffect(() => {
    if (!document.getElementById('__bika_fonts')) {
      const l = document.createElement('link');
      l.id = '__bika_fonts';
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap';
      document.head.appendChild(l);
    }
  }, []);
  return /*#__PURE__*/React.createElement("style", null, GLOBAL_CSS);
}

// ── responsive hook ─────────────────────────────────────────────
function useMedia(q = '(max-width:860px)') {
  const force = typeof window !== 'undefined' && new URLSearchParams(location.search).get('force');
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const fn = e => setM(e.matches);
    mq.addEventListener('change', fn);
    setM(mq.matches);
    return () => mq.removeEventListener('change', fn);
  }, [q]);
  if (force === 'mobile') return true;
  if (force === 'desktop') return false;
  return m;
}

// ── theme ───────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('bika-theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bika-theme', theme);
  }, [theme]);
  return [theme, () => setTheme(t => t === 'light' ? 'dark' : 'light')];
}

// ── primitives ──────────────────────────────────────────────────
function Badge({
  s,
  sm,
  label
}) {
  const labels = {
    confirmed: 'Confirmed',
    pencil: 'Pencil',
    quotation: 'Quotation',
    enquiry: 'Enquiry',
    won: 'Won',
    lost: 'Lost',
    cancelled: 'Cancelled',
    lead: 'Lead',
    vip: 'VIP',
    high: 'High',
    normal: 'Normal'
  };
  return /*#__PURE__*/React.createElement("span", {
    className: `badge ${s}${sm ? ' sm' : ''}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), label || labels[s] || s);
}
function Sparkline({
  data,
  color = 'var(--ac)',
  h = 30,
  w = 64
}) {
  const max = Math.max(...data),
    min = Math.min(...data),
    rng = Math.max(max - min, 1e-6);
  const pts = data.map((v, i) => `${i / (data.length - 1) * w},${h - 2 - (v - min) / rng * (h - 5)}`).join(' ');
  return /*#__PURE__*/React.createElement("svg", {
    width: w,
    height: h,
    viewBox: `0 0 ${w} ${h}`,
    style: {
      display: 'block',
      overflow: 'visible'
    }
  }, /*#__PURE__*/React.createElement("polygon", {
    points: `0,${h} ${pts} ${w},${h}`,
    fill: color,
    opacity: .12
  }), /*#__PURE__*/React.createElement("polyline", {
    points: pts,
    fill: "none",
    stroke: color,
    strokeWidth: "1.5",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }));
}
function Progress({
  pct,
  color
}) {
  const c = color || (pct >= 100 ? 'var(--green)' : 'var(--ac)');
  return /*#__PURE__*/React.createElement("div", {
    className: "prog"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: `${Math.min(100, pct)}%`,
      background: c
    }
  }));
}

// Sheet / drawer — slides from right (desktop) or bottom (mobile)
function Sheet({
  open,
  onClose,
  children,
  width,
  mobileFull
}) {
  const isMobile = useMedia();
  useEffect(() => {
    if (!open) return;
    const h = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  const style = isMobile ? {
    top: mobileFull ? 0 : 'auto',
    right: 0,
    left: 0,
    bottom: 0,
    width: '100vw',
    height: mobileFull ? '100%' : '92%',
    animation: 'slideU .24s cubic-bezier(.32,.72,0,1)',
    borderRadius: mobileFull ? 0 : 'var(--r-lg) var(--r-lg) 0 0'
  } : {
    width: width || 'min(480px,100vw)'
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "scrim",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "sheet",
    style: style
  }, children));
}
function Icon({
  n,
  s = 16,
  c = 'currentColor',
  sw = 1.6
}) {
  const P = {
    dashboard: 'M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 14h7v7H3z',
    bookings: 'M4 4h16v16H4zM4 9h16M9 4v16',
    calendar: 'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4',
    enquiries: 'M4 5h16v10H8l-4 4z',
    customers: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M16 7a3 3 0 110 6M21 20a5 5 0 00-7-4.5',
    payments: 'M3 6h18v12H3zM3 10h18M7 15h3',
    venues: 'M3 21V8l9-5 9 5v13M9 21v-6h6v6',
    menu: 'M4 4h16v16H4zM4 9h16M9 4v16',
    reports: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    activity: 'M22 12h-4l-3 8-6-16-3 8H2',
    settings: 'M12 9a3 3 0 100 6 3 3 0 000-6zM19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1l-.4-2.5h-4l-.4 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5L4.1 11a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1l.4 2.5h4l.4-2.5a7 7 0 001.7-1l2.4 1 2-3.5-2-1.5a7 7 0 00.1-1z',
    search: 'M11 11m-7 0a7 7 0 1014 0 7 7 0 10-14 0M21 21l-5-5',
    plus: 'M12 5v14M5 12h14',
    close: 'M6 6l12 12M18 6L6 18',
    chevR: 'M9 6l6 6-6 6',
    chevL: 'M15 6l-6 6 6 6',
    chevD: 'M6 9l6 6 6-6',
    sun: 'M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    moon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
    menu2: 'M3 6h18M3 12h18M3 18h18',
    back: 'M19 12H5M12 19l-7-7 7-7',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
    check: 'M20 6L9 17l-5-5',
    clock: 'M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z',
    phone: 'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z',
    mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
    edit: 'M11 4H4v16h16v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z',
    print: 'M6 9V2h12v7M6 18H4v-7h16v7h-2M8 14h8v8H8z',
    download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
    filter: 'M3 4h18l-7 8v6l-4 2v-8z',
    star: 'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
    grip: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
    logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9'
  };
  return /*#__PURE__*/React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: c,
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: P[n] || ''
  }));
}

// ── Toolbar (unified header: title + stats + actions) ───────────
function Toolbar({
  title,
  stats,
  actions,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "toolbar"
  }, title && /*#__PURE__*/React.createElement("span", {
    className: "tb-title"
  }, title), stats && /*#__PURE__*/React.createElement("div", {
    className: "tb-stats"
  }, stats.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `statpill${s.onClick ? ' click' : ''}`,
    onClick: s.onClick,
    title: s.title
  }, /*#__PURE__*/React.createElement("span", {
    className: "sp-l"
  }, s.label), /*#__PURE__*/React.createElement("span", {
    className: "sp-v",
    style: {
      color: s.color || 'var(--t1)'
    }
  }, s.value)))), children, actions && /*#__PURE__*/React.createElement("div", {
    className: "tb-actions"
  }, actions));
}

// ── Money (tabular, color-coded) ────────────────────────────────
function Money({
  v,
  kind = 'neutral',
  full,
  abbr
}) {
  const cls = kind === 'owed' ? 'owed' : kind === 'clear' ? 'clear' : kind === 'muted' ? 'muted' : '';
  const txt = abbr ? inr(v) : full ? inrFull(v) : inr(v);
  return /*#__PURE__*/React.createElement("span", {
    className: `money ${cls}`
  }, txt);
}

// ── CountUp (animated number) ───────────────────────────────────
function CountUp({
  value,
  format = n => Math.round(n).toLocaleString('en-IN'),
  dur = 620
}) {
  const [v, setV] = useState(value);
  const ref = useRef(value);
  useEffect(() => {
    let raf, start;
    const from = ref.current,
      to = value;
    if (from === to) return;
    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches || typeof requestAnimationFrame !== 'function';
    if (reduce) {
      setV(to);
      ref.current = to;
      return;
    }
    // guaranteed landing even if rAF is throttled/never fires (e.g. background tab)
    const fb = setTimeout(() => {
      setV(to);
      ref.current = to;
      if (raf) cancelAnimationFrame(raf);
    }, dur + 80);
    const step = t => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const cur = from + (to - from) * e;
      setV(cur);
      ref.current = cur;
      if (p < 1) raf = requestAnimationFrame(step);else {
        ref.current = to;
        clearTimeout(fb);
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(fb);
    };
  }, [value]);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: 'tabular-nums'
    }
  }, format(v));
}

// ── InlineEdit (click-to-edit cell) ─────────────────────────────
function InlineEdit({
  value,
  onCommit,
  type = 'text',
  prefix = '',
  format,
  width
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef(null);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);
  useEffect(() => {
    setVal(value);
  }, [value]);
  const commit = () => {
    setEditing(false);
    if (val !== value) {
      onCommit && onCommit(val);
    }
  };
  if (editing) return /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    className: "iedit-input",
    type: type,
    value: val,
    style: {
      width: width || 70
    },
    onChange: e => setVal(type === 'number' ? e.target.value : e.target.value),
    onBlur: commit,
    onKeyDown: e => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') {
        setVal(value);
        setEditing(false);
      }
    },
    onClick: e => e.stopPropagation()
  });
  return /*#__PURE__*/React.createElement("span", {
    className: "iedit",
    onClick: e => {
      e.stopPropagation();
      setEditing(true);
    },
    title: "Click to edit"
  }, prefix, format ? format(value) : value, /*#__PURE__*/React.createElement(Icon, {
    n: "edit",
    s: 10,
    c: "var(--t4)"
  }));
}

// ── FAB ─────────────────────────────────────────────────────────
function FAB({
  onClick,
  icon = 'plus'
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: "fab",
    onClick: onClick,
    "aria-label": "Quick add"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: icon,
    s: 24,
    c: "#fff",
    sw: 2
  }));
}

// ── SwipeRow (mobile swipe-to-reveal actions) ───────────────────
function SwipeRow({
  children,
  actions
}) {
  const [x, setX] = useState(0);
  const start = useRef(null);
  const W = actions.reduce((s, a) => s + 74, 0);
  const onDown = e => {
    start.current = {
      x: e.clientX,
      base: x
    };
  };
  const onMove = e => {
    if (start.current == null) return;
    const dx = e.clientX - start.current.x;
    let nx = start.current.base + dx;
    nx = Math.max(-W, Math.min(0, nx));
    setX(nx);
  };
  const onUp = () => {
    if (start.current == null) return;
    setX(x < -W / 2 ? -W : 0);
    start.current = null;
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "swipe-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "swipe-actions"
  }, actions.map((a, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    style: {
      background: a.color
    },
    onClick: () => {
      a.onClick();
      setX(0);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: a.icon,
    s: 16,
    c: "#fff"
  }), a.label))), /*#__PURE__*/React.createElement("div", {
    className: "swipe-fg",
    style: {
      transform: `translateX(${x}px)`
    },
    onPointerDown: onDown,
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onUp
  }, children));
}

// ── toast (vanilla, callable from anywhere) ─────────────────────
function toast(message, opts = {}) {
  let host = document.getElementById('__toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = '__toasts';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  const ic = opts.icon || 'check';
  el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${opts.iconColor || '#16A34A'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${{
    check: 'M20 6L9 17l-5-5',
    bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9',
    clock: 'M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z'
  }[ic] || 'M20 6L9 17l-5-5'}"/></svg>`;
  const span = document.createElement('span');
  span.textContent = message;
  el.appendChild(span);
  if (opts.action) {
    const b = document.createElement('button');
    b.className = 'ta';
    b.textContent = opts.action;
    b.onclick = () => {
      opts.onAction && opts.onAction();
      dismiss();
    };
    el.appendChild(b);
  }
  host.appendChild(el);
  const dismiss = () => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 200);
  };
  setTimeout(dismiss, opts.dur || 2600);
}

// ── keyboard shortcuts hook ─────────────────────────────────────
function useKeys(map, deps = []) {
  useEffect(() => {
    const h = e => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const fn = map[e.key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, deps);
}
Object.assign(window, {
  GlobalStyles,
  useMedia,
  useTheme,
  Badge,
  Sparkline,
  Progress,
  Sheet,
  Icon,
  Toolbar,
  Money,
  CountUp,
  InlineEdit,
  FAB,
  SwipeRow,
  toast,
  useKeys
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/ui.jsx", error: String((e && e.message) || e) }); }

// calendar_redesign/data.js
try { (() => {
// data.js — Shared calendar data for Bika Banquet calendar redesign
// Reference date: May 21, 2026 (Thursday)

const HALLS = [{
  id: 'crystal',
  name: 'Crystal Hall',
  capacity: 800,
  color: '#0d9488',
  tint: '#f0fdfa'
},
// teal
{
  id: 'grand',
  name: 'Grand Banquet',
  capacity: 500,
  color: '#6366f1',
  tint: '#eef2ff'
},
// indigo
{
  id: 'emerald',
  name: 'Emerald Room',
  capacity: 300,
  color: '#f59e0b',
  tint: '#fffbeb'
},
// amber
{
  id: 'rose',
  name: 'Rose Garden',
  capacity: 200,
  color: '#e11d48',
  tint: '#fff1f2'
} // rose
];
const SLOTS = [{
  id: 'morning',
  label: 'Morning',
  shortLabel: 'Morn',
  startH: 9,
  endH: 12,
  startLabel: '9 AM',
  endLabel: '12 PM'
}, {
  id: 'lunch',
  label: 'Lunch',
  shortLabel: 'Lunch',
  startH: 12,
  endH: 16,
  startLabel: '12 PM',
  endLabel: '4 PM'
}, {
  id: 'evening',
  label: 'Evening',
  shortLabel: 'Eve',
  startH: 16,
  endH: 19,
  startLabel: '4 PM',
  endLabel: '7 PM'
}, {
  id: 'dinner',
  label: 'Dinner',
  shortLabel: 'Dinn',
  startH: 19,
  endH: 23,
  startLabel: '7 PM',
  endLabel: '11 PM'
}];
const STATUS = {
  confirmed: {
    label: 'Confirmed',
    bg: '#dcfce7',
    text: '#15803d',
    accent: '#22c55e',
    soft: '#f0fdf4'
  },
  pencil: {
    label: 'Pencil',
    bg: '#fffbeb',
    text: '#92400e',
    accent: '#f59e0b',
    soft: '#fffbeb'
  },
  quotation: {
    label: 'Quotation',
    bg: '#eff6ff',
    text: '#1d4ed8',
    accent: '#3b82f6',
    soft: '#eff6ff'
  },
  enquiry: {
    label: 'Enquiry',
    bg: '#f0f9ff',
    text: '#0369a1',
    accent: '#0ea5e9',
    soft: '#f0f9ff'
  },
  pending: {
    label: 'Pending',
    bg: '#fffbeb',
    text: '#92400e',
    accent: '#f59e0b',
    soft: '#fffbeb'
  },
  cancelled: {
    label: 'Cancelled',
    bg: '#fef2f2',
    text: '#991b1b',
    accent: '#ef4444',
    soft: '#fef2f2'
  }
};

// Sample bookings spread across May 2026 (today = May 21)
// Includes intentional conflict on May 23 (Crystal Hall, Lunch) for warning demo
const BOOKINGS = [
// Week 1 (May 1-3)
{
  id: 'b01',
  date: '2026-05-01',
  hall: 'crystal',
  slot: 'dinner',
  function: 'Mehta Reception',
  customer: 'Anita Mehta',
  type: 'Reception',
  guests: 450,
  status: 'confirmed',
  grand: 425000
}, {
  id: 'b02',
  date: '2026-05-02',
  hall: 'grand',
  slot: 'evening',
  function: 'Verma Sangeet',
  customer: 'Pooja Verma',
  type: 'Wedding',
  guests: 280,
  status: 'confirmed',
  grand: 215000
}, {
  id: 'b03',
  date: '2026-05-02',
  hall: 'crystal',
  slot: 'dinner',
  function: 'Verma Wedding',
  customer: 'Pooja Verma',
  type: 'Wedding',
  guests: 650,
  status: 'confirmed',
  grand: 780000
}, {
  id: 'b04',
  date: '2026-05-03',
  hall: 'emerald',
  slot: 'lunch',
  function: 'Iyer Engagement',
  customer: 'Karthik Iyer',
  type: 'Wedding',
  guests: 180,
  status: 'confirmed',
  grand: 165000
}, {
  id: 'b05',
  date: '2026-05-03',
  hall: 'rose',
  slot: 'evening',
  function: 'TechCorp Mixer',
  customer: 'TechCorp Ltd',
  type: 'Corporate',
  guests: 120,
  status: 'confirmed',
  grand: 95000
},
// Week 2 (May 8-10) — wedding cluster
{
  id: 'b06',
  date: '2026-05-08',
  hall: 'crystal',
  slot: 'evening',
  function: 'Sharma Mehndi',
  customer: 'Priya Sharma',
  type: 'Wedding',
  guests: 320,
  status: 'confirmed',
  grand: 245000
}, {
  id: 'b07',
  date: '2026-05-09',
  hall: 'crystal',
  slot: 'dinner',
  function: 'Sharma Wedding',
  customer: 'Priya Sharma',
  type: 'Wedding',
  guests: 750,
  status: 'confirmed',
  grand: 920000
}, {
  id: 'b08',
  date: '2026-05-09',
  hall: 'grand',
  slot: 'lunch',
  function: 'Patel Anniversary',
  customer: 'Rajesh Patel',
  type: 'Reception',
  guests: 250,
  status: 'confirmed',
  grand: 195000
}, {
  id: 'b09',
  date: '2026-05-10',
  hall: 'crystal',
  slot: 'lunch',
  function: 'Sharma Reception',
  customer: 'Priya Sharma',
  type: 'Reception',
  guests: 580,
  status: 'confirmed',
  grand: 540000
}, {
  id: 'b10',
  date: '2026-05-10',
  hall: 'emerald',
  slot: 'dinner',
  function: 'Kapoor Birthday',
  customer: 'Aarav Kapoor',
  type: 'Birthday',
  guests: 90,
  status: 'confirmed',
  grand: 75000
},
// Week 3 (May 15-17)
{
  id: 'b11',
  date: '2026-05-15',
  hall: 'grand',
  slot: 'dinner',
  function: 'Mumbai Tech Gala',
  customer: 'Mumbai Tech',
  type: 'Corporate',
  guests: 380,
  status: 'confirmed',
  grand: 425000
}, {
  id: 'b12',
  date: '2026-05-16',
  hall: 'rose',
  slot: 'morning',
  function: 'Yoga Retreat',
  customer: 'Wellness Co',
  type: 'Corporate',
  guests: 80,
  status: 'quotation',
  grand: 55000
}, {
  id: 'b13',
  date: '2026-05-16',
  hall: 'crystal',
  slot: 'dinner',
  function: 'Khanna Wedding',
  customer: 'Meera Khanna',
  type: 'Wedding',
  guests: 700,
  status: 'confirmed',
  grand: 875000
}, {
  id: 'b14',
  date: '2026-05-17',
  hall: 'emerald',
  slot: 'lunch',
  function: 'Joshi Engagement',
  customer: 'Rohit Joshi',
  type: 'Wedding',
  guests: 150,
  status: 'pencil',
  grand: 145000
},
// This week — May 18-24 (current)
{
  id: 'b15',
  date: '2026-05-18',
  hall: 'grand',
  slot: 'lunch',
  function: 'BoardCo Annual',
  customer: 'BoardCo',
  type: 'Corporate',
  guests: 220,
  status: 'confirmed',
  grand: 185000
}, {
  id: 'b16',
  date: '2026-05-19',
  hall: 'crystal',
  slot: 'evening',
  function: 'Singh Sangeet',
  customer: 'Kavita Singh',
  type: 'Wedding',
  guests: 400,
  status: 'confirmed',
  grand: 295000
}, {
  id: 'b17',
  date: '2026-05-20',
  hall: 'crystal',
  slot: 'dinner',
  function: 'Singh Wedding',
  customer: 'Kavita Singh',
  type: 'Wedding',
  guests: 720,
  status: 'confirmed',
  grand: 895000
}, {
  id: 'b18',
  date: '2026-05-20',
  hall: 'rose',
  slot: 'dinner',
  function: 'Garcia Birthday',
  customer: 'Maria Garcia',
  type: 'Birthday',
  guests: 100,
  status: 'confirmed',
  grand: 85000
},
// TODAY — May 21, Thursday
{
  id: 'b19',
  date: '2026-05-21',
  hall: 'crystal',
  slot: 'morning',
  function: 'Banking Summit',
  customer: 'HDFC Bank',
  type: 'Corporate',
  guests: 200,
  status: 'confirmed',
  grand: 165000
}, {
  id: 'b20',
  date: '2026-05-21',
  hall: 'grand',
  slot: 'lunch',
  function: 'Pharma Conference',
  customer: 'Sun Pharma',
  type: 'Corporate',
  guests: 280,
  status: 'confirmed',
  grand: 245000
}, {
  id: 'b21',
  date: '2026-05-21',
  hall: 'crystal',
  slot: 'evening',
  function: 'Singh Reception',
  customer: 'Kavita Singh',
  type: 'Reception',
  guests: 480,
  status: 'confirmed',
  grand: 425000
}, {
  id: 'b22',
  date: '2026-05-21',
  hall: 'emerald',
  slot: 'dinner',
  function: 'Reddy Engagement',
  customer: 'Aditya Reddy',
  type: 'Wedding',
  guests: 160,
  status: 'pencil',
  grand: 145000
}, {
  id: 'b23',
  date: '2026-05-21',
  hall: 'rose',
  slot: 'evening',
  function: 'PixelCo Launch',
  customer: 'PixelCo',
  type: 'Corporate',
  guests: 95,
  status: 'quotation',
  grand: 78000
},
// Tomorrow — May 22, Friday
{
  id: 'b24',
  date: '2026-05-22',
  hall: 'crystal',
  slot: 'dinner',
  function: 'Gupta Wedding',
  customer: 'Vikram Gupta',
  type: 'Wedding',
  guests: 680,
  status: 'confirmed',
  grand: 825000
}, {
  id: 'b25',
  date: '2026-05-22',
  hall: 'grand',
  slot: 'dinner',
  function: 'Nair Reception',
  customer: 'Suresh Nair',
  type: 'Reception',
  guests: 420,
  status: 'confirmed',
  grand: 385000
}, {
  id: 'b26',
  date: '2026-05-22',
  hall: 'emerald',
  slot: 'evening',
  function: 'BookClub Awards',
  customer: 'IndiaReads',
  type: 'Corporate',
  guests: 140,
  status: 'enquiry',
  grand: 92000
},
// Sat May 23 — peak day with CONFLICT
{
  id: 'b27',
  date: '2026-05-23',
  hall: 'crystal',
  slot: 'morning',
  function: 'Agarwal Pooja',
  customer: 'Sunita Agarwal',
  type: 'Wedding',
  guests: 180,
  status: 'confirmed',
  grand: 125000
}, {
  id: 'b28',
  date: '2026-05-23',
  hall: 'crystal',
  slot: 'lunch',
  function: 'Agarwal Reception',
  customer: 'Sunita Agarwal',
  type: 'Reception',
  guests: 520,
  status: 'confirmed',
  grand: 485000
}, {
  id: 'b29',
  date: '2026-05-23',
  hall: 'crystal',
  slot: 'lunch',
  function: 'Bose Engagement',
  customer: 'Aniket Bose',
  type: 'Wedding',
  guests: 200,
  status: 'pencil',
  grand: 175000,
  conflict: true
}, {
  id: 'b30',
  date: '2026-05-23',
  hall: 'crystal',
  slot: 'dinner',
  function: 'Agarwal Wedding',
  customer: 'Sunita Agarwal',
  type: 'Wedding',
  guests: 780,
  status: 'confirmed',
  grand: 965000
}, {
  id: 'b31',
  date: '2026-05-23',
  hall: 'grand',
  slot: 'morning',
  function: 'Mehta Pooja',
  customer: 'Anita Mehta',
  type: 'Wedding',
  guests: 220,
  status: 'confirmed',
  grand: 145000
}, {
  id: 'b32',
  date: '2026-05-23',
  hall: 'grand',
  slot: 'evening',
  function: 'Mehta Sangeet',
  customer: 'Anita Mehta',
  type: 'Wedding',
  guests: 350,
  status: 'confirmed',
  grand: 285000
}, {
  id: 'b33',
  date: '2026-05-23',
  hall: 'grand',
  slot: 'dinner',
  function: 'Mehta Wedding',
  customer: 'Anita Mehta',
  type: 'Wedding',
  guests: 620,
  status: 'confirmed',
  grand: 745000
}, {
  id: 'b34',
  date: '2026-05-23',
  hall: 'emerald',
  slot: 'lunch',
  function: 'Khan Anniversary',
  customer: 'Farhan Khan',
  type: 'Reception',
  guests: 240,
  status: 'confirmed',
  grand: 215000
}, {
  id: 'b35',
  date: '2026-05-23',
  hall: 'emerald',
  slot: 'dinner',
  function: 'Roy Birthday',
  customer: 'Debasish Roy',
  type: 'Birthday',
  guests: 110,
  status: 'confirmed',
  grand: 88000
}, {
  id: 'b36',
  date: '2026-05-23',
  hall: 'rose',
  slot: 'lunch',
  function: 'Pillai Engagement',
  customer: 'Lakshmi Pillai',
  type: 'Wedding',
  guests: 140,
  status: 'confirmed',
  grand: 125000
}, {
  id: 'b37',
  date: '2026-05-23',
  hall: 'rose',
  slot: 'dinner',
  function: 'Pillai Wedding',
  customer: 'Lakshmi Pillai',
  type: 'Wedding',
  guests: 195,
  status: 'confirmed',
  grand: 185000
},
// Sun May 24
{
  id: 'b38',
  date: '2026-05-24',
  hall: 'crystal',
  slot: 'lunch',
  function: 'Bose Family Brunch',
  customer: 'Aniket Bose',
  type: 'Reception',
  guests: 320,
  status: 'enquiry',
  grand: 245000
}, {
  id: 'b39',
  date: '2026-05-24',
  hall: 'grand',
  slot: 'dinner',
  function: 'Anand Birthday',
  customer: 'Devika Anand',
  type: 'Birthday',
  guests: 180,
  status: 'quotation',
  grand: 135000
},
// Next week
{
  id: 'b40',
  date: '2026-05-29',
  hall: 'crystal',
  slot: 'dinner',
  function: 'Chopra Wedding',
  customer: 'Karan Chopra',
  type: 'Wedding',
  guests: 690,
  status: 'confirmed',
  grand: 825000
}, {
  id: 'b41',
  date: '2026-05-30',
  hall: 'grand',
  slot: 'evening',
  function: 'StartupIN Demo Day',
  customer: 'StartupIN',
  type: 'Corporate',
  guests: 220,
  status: 'confirmed',
  grand: 145000
}, {
  id: 'b42',
  date: '2026-05-30',
  hall: 'crystal',
  slot: 'dinner',
  function: 'Chopra Reception',
  customer: 'Karan Chopra',
  type: 'Reception',
  guests: 580,
  status: 'confirmed',
  grand: 625000
}, {
  id: 'b43',
  date: '2026-05-31',
  hall: 'emerald',
  slot: 'lunch',
  function: 'Family Day Brunch',
  customer: 'Ravi Menon',
  type: 'Reception',
  guests: 130,
  status: 'pencil',
  grand: 95000
}];

// Helpers
function getDate(iso) {
  return new Date(iso + 'T00:00:00');
}
function formatINR(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}K`;
  return `₹${n}`;
}
function dayName(d) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}
function fullDayName(d) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
}
function monthName(d) {
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()];
}
function shortMonth(d) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
}
function bookingsForDate(iso) {
  return BOOKINGS.filter(b => b.date === iso);
}
function bookingsForRange(startIso, endIso) {
  return BOOKINGS.filter(b => b.date >= startIso && b.date <= endIso);
}
function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Today is May 21, 2026
const TODAY_ISO = '2026-05-21';
const TODAY = getDate(TODAY_ISO);

// Hall lookup
function hallById(id) {
  return HALLS.find(h => h.id === id);
}
function slotById(id) {
  return SLOTS.find(s => s.id === id);
}
function statusOf(s) {
  return STATUS[s] || STATUS.pending;
}

// Build a 6-week grid for given month
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startDow = first.getDay(); // 0 = Sun
  const days = [];
  // Start from the Sunday on or before day 1
  const cursor = new Date(year, month, 1 - startDow);
  for (let i = 0; i < 42; i++) {
    const d = new Date(cursor);
    days.push(d);
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
Object.assign(window, {
  HALLS,
  SLOTS,
  STATUS,
  BOOKINGS,
  TODAY,
  TODAY_ISO,
  getDate,
  formatINR,
  dayName,
  fullDayName,
  monthName,
  shortMonth,
  bookingsForDate,
  bookingsForRange,
  isoDate,
  hallById,
  slotById,
  statusOf,
  buildMonthGrid
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "calendar_redesign/data.js", error: String((e && e.message) || e) }); }

// calendar_redesign/design-canvas.jsx
try { (() => {
// DesignCanvas.jsx — Figma-ish design canvas wrapper
// Warm gray grid bg + Sections + Artboards + PostIt notes.
// Artboards are reorderable (grip-drag), deletable, labels/titles are
// inline-editable, and any artboard can be opened in a fullscreen focus
// overlay (←/→/Esc). State persists to a .design-canvas.state.json sidecar
// via the host bridge. No assets, no deps.
//
// Usage:
//   <DesignCanvas>
//     <DCSection id="onboarding" title="Onboarding" subtitle="First-run variants">
//       <DCArtboard id="a" label="A · Dusk" width={260} height={480}>…</DCArtboard>
//       <DCArtboard id="b" label="B · Minimal" width={260} height={480}>…</DCArtboard>
//     </DCSection>
//   </DesignCanvas>

const DC = {
  bg: '#f0eee9',
  grid: 'rgba(0,0,0,0.06)',
  label: 'rgba(60,50,40,0.7)',
  title: 'rgba(40,30,20,0.85)',
  subtitle: 'rgba(60,50,40,0.6)',
  postitBg: '#fef4a8',
  postitText: '#5a4a2a',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
};

// One-time CSS injection (classes are dc-prefixed so they don't collide with
// the hosted design's own styles).
if (typeof document !== 'undefined' && !document.getElementById('dc-styles')) {
  const s = document.createElement('style');
  s.id = 'dc-styles';
  s.textContent = ['.dc-editable{cursor:text;outline:none;white-space:nowrap;border-radius:3px;padding:0 2px;margin:0 -2px}', '.dc-editable:focus{background:#fff;box-shadow:0 0 0 1.5px #c96442}', '[data-dc-slot]{transition:transform .18s cubic-bezier(.2,.7,.3,1)}', '[data-dc-slot].dc-dragging{transition:none;z-index:10;pointer-events:none}', '[data-dc-slot].dc-dragging .dc-card{box-shadow:0 12px 40px rgba(0,0,0,.25),0 0 0 2px #c96442;transform:scale(1.02)}',
  // isolation:isolate contains artboard content's z-indexes so a
  // z-indexed child (sticky navbar etc.) can't paint over .dc-header or
  // the .dc-menu popover that drops into the top of the card.
  '.dc-card{isolation:isolate;transition:box-shadow .15s,transform .15s}', '.dc-card *{scrollbar-width:none}', '.dc-card *::-webkit-scrollbar{display:none}',
  // Per-artboard header: grip + label on the left, delete/expand on the
  // right. Single flex row; when the artboard's on-screen width is too
  // narrow for both the label yields (ellipsis, then hidden entirely below
  // ~4ch via the container query) and the buttons stay on the row.
  '.dc-header{position:absolute;bottom:100%;left:-4px;margin-bottom:calc(4px * var(--dc-inv-zoom,1));z-index:2;', '  display:flex;align-items:center;container-type:inline-size}', '.dc-labelrow{display:flex;align-items:center;gap:4px;height:24px;flex:1 1 auto;min-width:0}', '.dc-grip{flex:0 0 auto;cursor:grab;display:flex;align-items:center;padding:5px 4px;border-radius:4px;transition:background .12s,opacity .12s}', '.dc-grip:hover{background:rgba(0,0,0,.08)}', '.dc-grip:active{cursor:grabbing}', '.dc-labeltext{flex:1 1 auto;min-width:0;cursor:pointer;border-radius:4px;padding:3px 6px;', '  display:flex;align-items:center;transition:background .12s;overflow:hidden}',
  // Below ~4ch of label room: hide the label entirely, and drop the grip to
  // hover-only (same reveal rule as .dc-btns) so a narrow header is clean
  // until the card is moused.
  '@container (max-width: 110px){', '  .dc-labeltext{display:none}', '  .dc-grip{opacity:0}', '  [data-dc-slot]:hover .dc-grip{opacity:1}', '}', '.dc-labeltext:hover{background:rgba(0,0,0,.05)}', '.dc-labeltext .dc-editable{overflow:hidden;text-overflow:ellipsis;max-width:100%}', '.dc-labeltext .dc-editable:focus{overflow:visible;text-overflow:clip}', '.dc-btns{flex:0 0 auto;margin-left:auto;display:flex;gap:2px;opacity:0;transition:opacity .12s}', '[data-dc-slot]:hover .dc-btns,.dc-btns:has(.dc-menu){opacity:1}', '.dc-expand,.dc-kebab{width:22px;height:22px;border-radius:5px;border:none;cursor:pointer;padding:0;', '  background:transparent;color:rgba(60,50,40,.7);display:flex;align-items:center;justify-content:center;', '  font:inherit;transition:background .12s,color .12s}', '.dc-expand:hover,.dc-kebab:hover{background:rgba(0,0,0,.06);color:#2a251f}',
  // Slot hosting an open menu floats above later siblings (which otherwise
  // paint on top — same z-index:auto, later DOM order) so the popup isn't
  // clipped by the next card.
  '[data-dc-slot]:has(.dc-menu){z-index:10}', '.dc-menu{position:absolute;top:100%;right:0;margin-top:4px;background:#fff;border-radius:8px;', '  box-shadow:0 8px 28px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.05);padding:4px;min-width:160px;z-index:10}', '.dc-menu button{display:block;width:100%;padding:7px 10px;border:0;background:transparent;', '  border-radius:5px;font-family:inherit;font-size:13px;font-weight:500;line-height:1.2;', '  color:#29261b;cursor:pointer;text-align:left;transition:background .12s;white-space:nowrap}', '.dc-menu button:hover{background:rgba(0,0,0,.05)}', '.dc-menu hr{border:0;border-top:1px solid rgba(0,0,0,.08);margin:4px 2px}', '.dc-menu .dc-danger{color:#c96442}', '.dc-menu .dc-danger:hover{background:rgba(201,100,66,.1)}',
  // Chrome (titles / labels / buttons) counter-scales against the viewport
  // zoom so it stays a constant on-screen size. --dc-inv-zoom is set by
  // DCViewport on every transform update and inherits to all descendants —
  // any overlay inside the world (e.g. a TweaksPanel on an artboard) can use
  // it the same way.
  //
  // The header uses transform:scale (out-of-flow, so layout impact doesn't
  // matter) with its world-space width set to card-width / inv-zoom so that
  // after counter-scaling its on-screen width exactly matches the card's —
  // that's what lets the container query + text-overflow behave against the
  // card's visible edge at every zoom level.
  //
  // The section head uses CSS zoom instead of transform so its layout box
  // grows with the counter-scale, pushing the card row down — otherwise the
  // constant-screen-size title would overflow into the (shrinking) world-
  // space gap and overlap the artboard headers at low zoom.
  '.dc-header{width:calc((100% + 4px) / var(--dc-inv-zoom,1));', '  transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom left}', '.dc-sectionhead{zoom:var(--dc-inv-zoom,1)}'].join('\n');
  document.head.appendChild(s);
}
const DCCtx = React.createContext(null);

// Recursively unwrap React.Fragment so <>…</> grouping doesn't hide
// DCSection/DCArtboard children from the type-based walks below.
function dcFlatten(children) {
  const out = [];
  React.Children.forEach(children, c => {
    if (c && c.type === React.Fragment) out.push(...dcFlatten(c.props.children));else out.push(c);
  });
  return out;
}

// ─────────────────────────────────────────────────────────────
// DesignCanvas — stateful wrapper around the pan/zoom viewport.
// Owns runtime state (per-section order, renamed titles/labels, hidden
// artboards, focused artboard). Order/titles/labels/hidden persist to a
// .design-canvas.state.json
// sidecar next to the HTML. Reads go via plain fetch() so the saved
// arrangement is visible anywhere the HTML + sidecar are served together
// (omelette preview, direct link, downloaded zip). Writes go through the
// host's window.omelette bridge — editing requires the omelette runtime.
// Focus is ephemeral.
// ─────────────────────────────────────────────────────────────
const DC_STATE_FILE = '.design-canvas.state.json';
function DesignCanvas({
  children,
  minScale,
  maxScale,
  style
}) {
  const [state, setState] = React.useState({
    sections: {},
    focus: null
  });
  // Hold rendering until the sidecar read settles so the saved order/titles
  // appear on first paint (no source-order flash). didRead gates writes until
  // the read settles so the empty initial state can't clobber a slow read;
  // skipNextWrite suppresses the one echo-write that would otherwise follow
  // hydration.
  const [ready, setReady] = React.useState(false);
  const didRead = React.useRef(false);
  const skipNextWrite = React.useRef(false);
  React.useEffect(() => {
    let off = false;
    fetch('./' + DC_STATE_FILE).then(r => r.ok ? r.json() : null).then(saved => {
      if (off || !saved || !saved.sections) return;
      skipNextWrite.current = true;
      setState(s => ({
        ...s,
        sections: saved.sections
      }));
    }).catch(() => {}).finally(() => {
      didRead.current = true;
      if (!off) setReady(true);
    });
    const t = setTimeout(() => {
      if (!off) setReady(true);
    }, 150);
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, []);
  React.useEffect(() => {
    if (!didRead.current) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    const t = setTimeout(() => {
      window.omelette?.writeFile(DC_STATE_FILE, JSON.stringify({
        sections: state.sections
      })).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [state.sections]);

  // Build registries synchronously from children so FocusOverlay can read
  // them in the same render. Fragments are flattened; wrapping in other
  // elements still opts out of focus/reorder.
  const registry = {}; // slotId -> { sectionId, artboard }
  const sectionMeta = {}; // sectionId -> { title, subtitle, slotIds[] }
  const sectionOrder = [];
  dcFlatten(children).forEach(sec => {
    if (!sec || sec.type !== DCSection) return;
    const sid = sec.props.id ?? sec.props.title;
    if (!sid) return;
    sectionOrder.push(sid);
    const persisted = state.sections[sid] || {};
    const abs = [];
    dcFlatten(sec.props.children).forEach(ab => {
      if (!ab || ab.type !== DCArtboard) return;
      const aid = ab.props.id ?? ab.props.label;
      if (aid) abs.push([aid, ab]);
    });
    // hidden is scoped to one source revision — when the agent regenerates
    // (artboard-ID set changes), prior deletes don't apply to new content.
    const srcKey = abs.map(([k]) => k).join('\x1f');
    const hidden = persisted.srcKey === srcKey ? persisted.hidden || [] : [];
    const srcIds = [];
    abs.forEach(([aid, ab]) => {
      if (hidden.includes(aid)) return;
      registry[`${sid}/${aid}`] = {
        sectionId: sid,
        artboard: ab
      };
      srcIds.push(aid);
    });
    const kept = (persisted.order || []).filter(k => srcIds.includes(k));
    sectionMeta[sid] = {
      title: persisted.title ?? sec.props.title,
      subtitle: sec.props.subtitle,
      slotIds: [...kept, ...srcIds.filter(k => !kept.includes(k))]
    };
  });
  const api = React.useMemo(() => ({
    state,
    section: id => state.sections[id] || {},
    patchSection: (id, p) => setState(s => ({
      ...s,
      sections: {
        ...s.sections,
        [id]: {
          ...s.sections[id],
          ...(typeof p === 'function' ? p(s.sections[id] || {}) : p)
        }
      }
    })),
    setFocus: slotId => setState(s => ({
      ...s,
      focus: slotId
    }))
  }), [state]);

  // Esc exits focus; any outside pointerdown commits an in-progress rename.
  React.useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') api.setFocus(null);
    };
    const onPd = e => {
      const ae = document.activeElement;
      if (ae && ae.isContentEditable && !ae.contains(e.target)) ae.blur();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPd, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPd, true);
    };
  }, [api]);
  return /*#__PURE__*/React.createElement(DCCtx.Provider, {
    value: api
  }, /*#__PURE__*/React.createElement(DCViewport, {
    minScale: minScale,
    maxScale: maxScale,
    style: style
  }, ready && children), state.focus && registry[state.focus] && /*#__PURE__*/React.createElement(DCFocusOverlay, {
    entry: registry[state.focus],
    sectionMeta: sectionMeta,
    sectionOrder: sectionOrder
  }));
}

// ─────────────────────────────────────────────────────────────
// DCViewport — transform-based pan/zoom (internal)
//
// Input mapping (Figma-style):
//   • trackpad pinch  → zoom   (ctrlKey wheel; Safari gesture* events)
//   • trackpad scroll → pan    (two-finger)
//   • mouse wheel     → zoom   (notched; distinguished from trackpad scroll)
//   • middle-drag / primary-drag-on-bg → pan
//
// Transform state lives in a ref and is written straight to the DOM
// (translate3d + will-change) so wheel ticks don't go through React —
// keeps pans at 60fps on dense canvases.
// ─────────────────────────────────────────────────────────────
function DCViewport({
  children,
  minScale = 0.1,
  maxScale = 8,
  style = {}
}) {
  const vpRef = React.useRef(null);
  const worldRef = React.useRef(null);
  const tf = React.useRef({
    x: 0,
    y: 0,
    scale: 1
  });
  // Persist viewport across reloads so the user lands back where they were
  // after an agent edit or browser refresh. The sandbox origin is already
  // per-project; pathname keeps multiple canvas files in one project apart.
  const tfKey = 'dc-viewport:' + location.pathname;
  const saveT = React.useRef(0);
  const lastPostedScale = React.useRef();
  const apply = React.useCallback(() => {
    const {
      x,
      y,
      scale
    } = tf.current;
    const el = worldRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    // Exposed for zoom-invariant chrome (labels, buttons, TweaksPanel).
    el.style.setProperty('--dc-inv-zoom', String(1 / scale));
    // Keep the host toolbar's % readout in sync with the canvas scale. Pan
    // ticks leave scale unchanged — skip the cross-frame post for those.
    if (lastPostedScale.current !== scale) {
      lastPostedScale.current = scale;
      window.parent.postMessage({
        type: '__dc_zoom',
        scale
      }, '*');
    }
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      try {
        localStorage.setItem(tfKey, JSON.stringify(tf.current));
      } catch {}
    }, 200);
  }, [tfKey]);
  React.useLayoutEffect(() => {
    const flush = () => {
      clearTimeout(saveT.current);
      try {
        localStorage.setItem(tfKey, JSON.stringify(tf.current));
      } catch {}
    };
    try {
      const s = JSON.parse(localStorage.getItem(tfKey) || 'null');
      if (s && Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.scale)) {
        tf.current = {
          x: s.x,
          y: s.y,
          scale: Math.min(maxScale, Math.max(minScale, s.scale))
        };
        apply();
      }
    } catch {}
    // Flush on pagehide and unmount so a reload within the 200ms debounce
    // window doesn't drop the last pan/zoom.
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);
  React.useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const zoomAt = (cx, cy, factor) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left,
        py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const k = next / t.scale;
      // --dc-inv-zoom consumers (.dc-sectionhead's CSS zoom, each section's
      // marginBottom) reflow on every scale change, vertically shifting the
      // world layout — so a world point mathematically pinned under the cursor
      // drifts as you zoom (content creeps up on zoom-in, down on zoom-out).
      // Anchor the DOM element under the cursor instead: record its screen Y,
      // apply the transform + --dc-inv-zoom, then cancel whatever vertical
      // drift the reflow introduced so it stays put on screen.
      let marker = null,
        markerY0 = 0;
      if (k !== 1) {
        const hit = document.elementFromPoint(cx, cy);
        marker = hit && hit.closest ? hit.closest('[data-dc-slot],[data-dc-section]') : null;
        if (marker) markerY0 = marker.getBoundingClientRect().top;
      }
      // keep the world point under the cursor fixed
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
      if (marker) {
        // A pure zoom around (cx, cy) maps screen Y → cy + (Y - cy) * k. Any
        // departure after the --dc-inv-zoom reflow is the layout drift.
        const drift = marker.getBoundingClientRect().top - (cy + (markerY0 - cy) * k);
        if (Math.abs(drift) > 0.1) {
          t.y -= drift;
          apply();
        }
      }
    };

    // Mouse-wheel vs trackpad-scroll heuristic. A physical wheel sends
    // line-mode deltas (Firefox) or large integer pixel deltas with no X
    // component (Chrome/Safari, typically multiples of 100/120). Trackpad
    // two-finger scroll sends small/fractional pixel deltas, often with
    // non-zero deltaX. ctrlKey is set by the browser for trackpad pinch.
    const isMouseWheel = e => e.deltaMode !== 0 || e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40;
    const onWheel = e => {
      e.preventDefault();
      if (isGesturing) return; // Safari: gesture* owns the pinch — discard concurrent wheels
      if ((e.ctrlKey || e.metaKey) && !isMouseWheel(e)) {
        // trackpad pinch, or ctrl/cmd + smooth-scroll mouse. Notched
        // wheels fall through to the fixed-step branch below.
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else if (isMouseWheel(e)) {
        // notched mouse wheel — fixed-ratio step per click
        zoomAt(e.clientX, e.clientY, Math.exp(-Math.sign(e.deltaY) * 0.18));
      } else {
        // trackpad two-finger scroll — pan
        tf.current.x -= e.deltaX;
        tf.current.y -= e.deltaY;
        apply();
      }
    };

    // Safari sends native gesture* events for trackpad pinch with a smooth
    // e.scale; preferring these over the ctrl+wheel fallback gives a much
    // better feel there. No-ops on other browsers. Safari also fires
    // ctrlKey wheel events during the same pinch — isGesturing makes
    // onWheel drop those entirely so they neither zoom nor pan.
    let gsBase = 1;
    let isGesturing = false;
    const onGestureStart = e => {
      e.preventDefault();
      isGesturing = true;
      gsBase = tf.current.scale;
    };
    const onGestureChange = e => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, gsBase * e.scale / tf.current.scale);
    };
    const onGestureEnd = e => {
      e.preventDefault();
      isGesturing = false;
    };

    // Drag-pan: middle button anywhere, or primary button on canvas
    // background (anything that isn't an artboard or an inline editor).
    let drag = null;
    const onPointerDown = e => {
      const onBg = !e.target.closest('[data-dc-slot], .dc-editable');
      if (!(e.button === 1 || e.button === 0 && onBg)) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = {
        id: e.pointerId,
        lx: e.clientX,
        ly: e.clientY
      };
      vp.style.cursor = 'grabbing';
    };
    const onPointerMove = e => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      apply();
    };
    const onPointerUp = e => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };

    // Host-driven zoom (toolbar % menu). Zooms around viewport centre so the
    // visible midpoint stays fixed — matching the host's iframe-zoom feel.
    const onHostMsg = e => {
      const d = e.data;
      if (d && d.type === '__dc_set_zoom' && typeof d.scale === 'number') {
        const r = vp.getBoundingClientRect();
        zoomAt(r.left + r.width / 2, r.top + r.height / 2, d.scale / tf.current.scale);
      } else if (d && d.type === '__dc_probe') {
        // Host's [readyGen] reset asks whether a canvas is present; it
        // fires on the iframe's native 'load', which for canvases with
        // images/fonts is after our mount-time announce, so re-announce.
        // Clear the pan-tick guard so apply() re-posts the current scale
        // even if it's unchanged — the host just reset dcScale to 1.
        window.parent.postMessage({
          type: '__dc_present'
        }, '*');
        lastPostedScale.current = undefined;
        apply();
      }
    };
    window.addEventListener('message', onHostMsg);
    // Announce canvas mode so the host toolbar proxies its % control here
    // instead of scaling the iframe element (which would just shrink the
    // viewport window of an infinite canvas). The apply() that follows emits
    // the initial __dc_zoom so the toolbar % is correct before first pinch.
    // lastPostedScale reset mirrors the __dc_probe handler: the layout
    // effect's restore-path apply() may already have posted the restored
    // scale (before __dc_present), so clear the guard to re-post it in order.
    window.parent.postMessage({
      type: '__dc_present'
    }, '*');
    lastPostedScale.current = undefined;
    apply();
    vp.addEventListener('wheel', onWheel, {
      passive: false
    });
    vp.addEventListener('gesturestart', onGestureStart, {
      passive: false
    });
    vp.addEventListener('gesturechange', onGestureChange, {
      passive: false
    });
    vp.addEventListener('gestureend', onGestureEnd, {
      passive: false
    });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('message', onHostMsg);
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('gesturestart', onGestureStart);
      vp.removeEventListener('gesturechange', onGestureChange);
      vp.removeEventListener('gestureend', onGestureEnd);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [apply, minScale, maxScale]);
  const gridSvg = `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='${encodeURIComponent(DC.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;
  return /*#__PURE__*/React.createElement("div", {
    ref: vpRef,
    className: "design-canvas",
    style: {
      height: '100vh',
      width: '100vw',
      background: DC.bg,
      overflow: 'hidden',
      overscrollBehavior: 'none',
      touchAction: 'none',
      position: 'relative',
      fontFamily: DC.font,
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: worldRef,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      transformOrigin: '0 0',
      willChange: 'transform',
      width: 'max-content',
      minWidth: '100%',
      minHeight: '100%',
      padding: '60px 0 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: -6000,
      backgroundImage: gridSvg,
      backgroundSize: '120px 120px',
      pointerEvents: 'none',
      zIndex: -1
    }
  }), children));
}

// ─────────────────────────────────────────────────────────────
// DCSection — editable title + h-row of artboards in persisted order
// ─────────────────────────────────────────────────────────────
function DCSection({
  id,
  title,
  subtitle,
  children,
  gap = 48
}) {
  const ctx = React.useContext(DCCtx);
  const sid = id ?? title;
  const all = React.Children.toArray(dcFlatten(children));
  const artboards = all.filter(c => c && c.type === DCArtboard);
  const rest = all.filter(c => !(c && c.type === DCArtboard));
  const sec = ctx && sid && ctx.section(sid) || {};
  // Must match DesignCanvas's srcKey computation exactly (it filters falsy
  // IDs), or onDelete persists a srcKey that DesignCanvas never recognizes.
  const allIds = artboards.map(a => a.props.id ?? a.props.label).filter(Boolean);
  const srcKey = allIds.join('\x1f');
  const hidden = sec.srcKey === srcKey ? sec.hidden || [] : [];
  const srcOrder = allIds.filter(k => !hidden.includes(k));
  const order = React.useMemo(() => {
    const kept = (sec.order || []).filter(k => srcOrder.includes(k));
    return [...kept, ...srcOrder.filter(k => !kept.includes(k))];
  }, [sec.order, srcOrder.join('|')]);
  const byId = Object.fromEntries(artboards.map(a => [a.props.id ?? a.props.label, a]));

  // marginBottom counter-scales so the on-screen gap between sections stays
  // constant — otherwise at low zoom the (world-space) gap collapses while
  // the screen-constant sectionhead below it doesn't, and the title reads as
  // belonging to the section above. paddingBottom below is just enough for
  // the 24px artboard-header (abs-positioned above each card) plus ~8px, so
  // the title sits tight against its own row at every zoom.
  return /*#__PURE__*/React.createElement("div", {
    "data-dc-section": sid,
    style: {
      marginBottom: 'calc(80px * var(--dc-inv-zoom, 1))',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 60px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-sectionhead",
    style: {
      paddingBottom: 36
    }
  }, /*#__PURE__*/React.createElement(DCEditable, {
    tag: "div",
    value: sec.title ?? title,
    onChange: v => ctx && sid && ctx.patchSection(sid, {
      title: v
    }),
    style: {
      fontSize: 28,
      fontWeight: 600,
      color: DC.title,
      letterSpacing: -0.4,
      marginBottom: 6,
      display: 'inline-block'
    }
  }), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: DC.subtitle
    }
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap,
      padding: '0 60px',
      alignItems: 'flex-start',
      width: 'max-content'
    }
  }, order.map(k => /*#__PURE__*/React.createElement(DCArtboardFrame, {
    key: k,
    sectionId: sid,
    artboard: byId[k],
    order: order,
    label: (sec.labels || {})[k] ?? byId[k].props.label,
    onRename: v => ctx && ctx.patchSection(sid, x => ({
      labels: {
        ...x.labels,
        [k]: v
      }
    })),
    onReorder: next => ctx && ctx.patchSection(sid, {
      order: next
    }),
    onDelete: () => ctx && ctx.patchSection(sid, x => ({
      hidden: [...(x.srcKey === srcKey ? x.hidden || [] : []), k],
      srcKey
    })),
    onFocus: () => ctx && ctx.setFocus(`${sid}/${k}`)
  }))), rest);
}

// DCArtboard — marker; rendered by DCArtboardFrame via DCSection.
function DCArtboard() {
  return null;
}

// Per-artboard export (kind: 'png' | 'html'). Both paths share the same
// self-contained clone: computed styles baked in, @font-face / <img> /
// inline-style background-image urls inlined as data URIs. PNG wraps the
// clone in foreignObject→canvas at 3× the artboard's natural width×height
// (same pipeline the host uses for page captures); HTML wraps it in a
// minimal standalone document. Both are independent of viewport zoom.
async function dcExport(node, w, h, name, kind) {
  try {
    await document.fonts.ready;
  } catch {}
  const toDataURL = url => fetch(url).then(r => r.blob()).then(b => new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => res(url);
    fr.readAsDataURL(b);
  })).catch(() => url);

  // Collect @font-face rules. ss.cssRules throws SecurityError on
  // cross-origin sheets (e.g. fonts.googleapis.com) — in that case fetch
  // the CSS text directly (those endpoints send ACAO:*) and regex-extract
  // the blocks. @import and @media/@supports are walked so nested
  // @font-face rules aren't missed.
  const fontRules = [],
    pending = [],
    seen = new Set();
  const scrapeCss = href => {
    if (seen.has(href)) return;
    seen.add(href);
    pending.push(fetch(href).then(r => r.text()).then(css => {
      for (const m of css.match(/@font-face\s*{[^}]*}/g) || []) fontRules.push({
        css: m,
        base: href
      });
      for (const m of css.matchAll(/@import\s+(?:url\()?['"]?([^'")\s;]+)/g)) scrapeCss(new URL(m[1], href).href);
    }).catch(() => {}));
  };
  const walk = (rules, base) => {
    for (const r of rules) {
      if (r.type === CSSRule.FONT_FACE_RULE) fontRules.push({
        css: r.cssText,
        base
      });else if (r.type === CSSRule.IMPORT_RULE && r.styleSheet) {
        const ibase = r.styleSheet.href || base;
        try {
          walk(r.styleSheet.cssRules, ibase);
        } catch {
          scrapeCss(ibase);
        }
      } else if (r.cssRules) walk(r.cssRules, base);
    }
  };
  for (const ss of document.styleSheets) {
    const base = ss.href || location.href;
    try {
      walk(ss.cssRules, base);
    } catch {
      if (ss.href) scrapeCss(ss.href);
    }
  }
  while (pending.length) await pending.shift();
  const fontCss = (await Promise.all(fontRules.map(async rule => {
    let out = rule.css,
      m;
    const re = /url\((['"]?)([^'")]+)\1\)/g;
    while (m = re.exec(rule.css)) {
      if (m[2].indexOf('data:') === 0) continue;
      let abs;
      try {
        abs = new URL(m[2], rule.base).href;
      } catch {
        continue;
      }
      out = out.split(m[0]).join('url("' + (await toDataURL(abs)) + '")');
    }
    return out;
  }))).join('\n');
  const cloneStyled = src => {
    if (src.nodeType === 8 || src.nodeType === 1 && src.tagName === 'SCRIPT') return document.createTextNode('');
    const dst = src.cloneNode(false);
    if (src.nodeType === 1) {
      const cs = getComputedStyle(src);
      let txt = '';
      for (let i = 0; i < cs.length; i++) txt += cs[i] + ':' + cs.getPropertyValue(cs[i]) + ';';
      dst.setAttribute('style', txt + 'animation:none;transition:none;');
      if (src.tagName === 'CANVAS') try {
        const im = document.createElement('img');
        im.src = src.toDataURL();
        im.setAttribute('style', txt);
        return im;
      } catch {}
    }
    for (let c = src.firstChild; c; c = c.nextSibling) dst.appendChild(cloneStyled(c));
    return dst;
  };
  const clone = cloneStyled(node);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  // Drop the card's own shadow/radius so the export is a flush w×h rect;
  // the artboard's own background (if any) is already in the computed style.
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  const jobs = [];
  clone.querySelectorAll('img').forEach(el => {
    const s = el.getAttribute('src');
    if (s && s.indexOf('data:') !== 0) jobs.push(toDataURL(el.src).then(d => el.setAttribute('src', d)));
  });
  [clone, ...clone.querySelectorAll('*')].forEach(el => {
    const bg = el.style.backgroundImage;
    if (!bg) return;
    let m;
    const re = /url\(["']?([^"')]+)["']?\)/g;
    while (m = re.exec(bg)) {
      const tok = m[0],
        url = m[1];
      if (url.indexOf('data:') === 0) continue;
      jobs.push(toDataURL(url).then(d => {
        el.style.backgroundImage = el.style.backgroundImage.split(tok).join('url("' + d + '")');
      }));
    }
  });
  await Promise.all(jobs);
  const xml = new XMLSerializer().serializeToString(clone);
  const save = (blob, ext) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '.' + ext;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  if (kind === 'html') {
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + name + '</title>' + (fontCss ? '<style>' + fontCss + '</style>' : '') + '</head><body style="margin:0">' + xml + '</body></html>';
    return save(new Blob([html], {
      type: 'text/html'
    }), 'html');
  }

  // PNG: the SVG's own width/height must be the output resolution — an
  // <img>-loaded SVG rasterizes at its intrinsic size, so sizing it at 1×
  // and ctx.scale()-ing up would just upscale a 1× bitmap. viewBox maps the
  // w×h foreignObject onto the px·w × px·h SVG canvas so the browser renders
  // the HTML at full resolution.
  const px = 3;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w * px + '" height="' + h * px + '" viewBox="0 0 ' + w + ' ' + h + '"><foreignObject width="' + w + '" height="' + h + '">' + (fontCss ? '<style><![CDATA[' + fontCss + ']]></style>' : '') + xml + '</foreignObject></svg>';
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => rej(new Error('svg load failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  const cv = document.createElement('canvas');
  cv.width = w * px;
  cv.height = h * px;
  cv.getContext('2d').drawImage(img, 0, 0);
  cv.toBlob(blob => save(blob, 'png'), 'image/png');
}
function DCArtboardFrame({
  sectionId,
  artboard,
  label,
  order,
  onRename,
  onReorder,
  onFocus,
  onDelete
}) {
  const {
    id: rawId,
    label: rawLabel,
    width = 260,
    height = 480,
    children,
    style = {}
  } = artboard.props;
  const id = rawId ?? rawLabel;
  const ref = React.useRef(null);
  const cardRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  // ⋯ menu: close on any outside pointerdown. Two-click delete lives inside
  // the menu — first click arms the row, second commits; closing disarms.
  React.useEffect(() => {
    if (!menuOpen) {
      setConfirming(false);
      return;
    }
    const off = e => {
      if (!menuRef.current || !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', off, true);
    return () => document.removeEventListener('pointerdown', off, true);
  }, [menuOpen]);
  const doExport = kind => {
    setMenuOpen(false);
    if (!cardRef.current) return;
    const name = String(label || id || 'artboard').replace(/[^\w\s.-]+/g, '_');
    dcExport(cardRef.current, width, height, name, kind).catch(e => console.error('[design-canvas] export failed:', e));
  };

  // Live drag-reorder: dragged card sticks to cursor; siblings slide into
  // their would-be slots in real time via transforms. DOM order only
  // changes on drop.
  const onGripDown = e => {
    e.preventDefault();
    e.stopPropagation();
    const me = ref.current;
    // translateX is applied in local (pre-scale) space but pointer deltas and
    // getBoundingClientRect().left are screen-space — divide by the viewport's
    // current scale so the dragged card tracks the cursor at any zoom level.
    const scale = me.getBoundingClientRect().width / me.offsetWidth || 1;
    const peers = Array.from(document.querySelectorAll(`[data-dc-section="${sectionId}"] [data-dc-slot]`));
    const homes = peers.map(el => ({
      el,
      id: el.dataset.dcSlot,
      x: el.getBoundingClientRect().left
    }));
    const slotXs = homes.map(h => h.x);
    const startIdx = order.indexOf(id);
    const startX = e.clientX;
    let liveOrder = order.slice();
    me.classList.add('dc-dragging');
    const layout = () => {
      for (const h of homes) {
        if (h.id === id) continue;
        const slot = liveOrder.indexOf(h.id);
        h.el.style.transform = `translateX(${(slotXs[slot] - h.x) / scale}px)`;
      }
    };
    const move = ev => {
      const dx = ev.clientX - startX;
      me.style.transform = `translateX(${dx / scale}px)`;
      const cur = homes[startIdx].x + dx;
      let nearest = 0,
        best = Infinity;
      for (let i = 0; i < slotXs.length; i++) {
        const d = Math.abs(slotXs[i] - cur);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }
      if (liveOrder.indexOf(id) !== nearest) {
        liveOrder = order.filter(k => k !== id);
        liveOrder.splice(nearest, 0, id);
        layout();
      }
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      const finalSlot = liveOrder.indexOf(id);
      me.classList.remove('dc-dragging');
      me.style.transform = `translateX(${(slotXs[finalSlot] - homes[startIdx].x) / scale}px)`;
      // After the settle transition, kill transitions + clear transforms +
      // commit the reorder in the same frame so there's no visual snap-back.
      setTimeout(() => {
        for (const h of homes) {
          h.el.style.transition = 'none';
          h.el.style.transform = '';
        }
        if (liveOrder.join('|') !== order.join('|')) onReorder(liveOrder);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          for (const h of homes) h.el.style.transition = '';
        }));
      }, 180);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    "data-dc-slot": id,
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-header",
    "data-noncommentable": "",
    style: {
      color: DC.label
    },
    onPointerDown: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-labelrow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-grip",
    onPointerDown: onGripDown,
    title: "Drag to reorder"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "13",
    viewBox: "0 0 9 13",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "11",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "11",
    r: "1.1"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-labeltext",
    onClick: onFocus,
    title: "Click to focus"
  }, /*#__PURE__*/React.createElement(DCEditable, {
    value: label,
    onChange: onRename,
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: DC.label,
      lineHeight: 1
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-btns"
  }, /*#__PURE__*/React.createElement("div", {
    ref: menuRef,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "dc-kebab",
    title: "More",
    onClick: () => setMenuOpen(o => !o)
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2.5",
    cy: "6",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9.5",
    cy: "6",
    r: "1.1"
  }))), menuOpen && /*#__PURE__*/React.createElement("div", {
    className: "dc-menu",
    onPointerDown: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => doExport('png')
  }, "Download PNG"), /*#__PURE__*/React.createElement("button", {
    onClick: () => doExport('html')
  }, "Download HTML"), /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("button", {
    className: "dc-danger",
    onClick: () => {
      if (confirming) {
        setMenuOpen(false);
        onDelete();
      } else setConfirming(true);
    }
  }, confirming ? 'Click again to delete' : 'Delete'))), /*#__PURE__*/React.createElement("button", {
    className: "dc-expand",
    onClick: onFocus,
    title: "Focus"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 1h4v4M5 11H1V7M11 1L7.5 4.5M1 11l3.5-3.5"
  }))))), /*#__PURE__*/React.createElement("div", {
    ref: cardRef,
    className: "dc-card",
    style: {
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06)',
      overflow: 'hidden',
      width,
      height,
      background: '#fff',
      ...style
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb',
      fontSize: 13,
      fontFamily: DC.font
    }
  }, id)));
}

// Inline rename — commits on blur or Enter.
function DCEditable({
  value,
  onChange,
  style,
  tag = 'span',
  onClick
}) {
  const T = tag;
  return /*#__PURE__*/React.createElement(T, {
    className: "dc-editable",
    contentEditable: true,
    suppressContentEditableWarning: true,
    onClick: onClick,
    onPointerDown: e => e.stopPropagation(),
    onBlur: e => onChange && onChange(e.currentTarget.textContent),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    style: style
  }, value);
}

// ─────────────────────────────────────────────────────────────
// Focus mode — overlay one artboard; ←/→ within section, ↑/↓ across
// sections, Esc or backdrop click to exit.
// ─────────────────────────────────────────────────────────────
function DCFocusOverlay({
  entry,
  sectionMeta,
  sectionOrder
}) {
  const ctx = React.useContext(DCCtx);
  const {
    sectionId,
    artboard
  } = entry;
  const sec = ctx.section(sectionId);
  const meta = sectionMeta[sectionId];
  const peers = meta.slotIds;
  const aid = artboard.props.id ?? artboard.props.label;
  const idx = peers.indexOf(aid);
  const secIdx = sectionOrder.indexOf(sectionId);
  const go = d => {
    const n = peers[(idx + d + peers.length) % peers.length];
    if (n) ctx.setFocus(`${sectionId}/${n}`);
  };
  const goSection = d => {
    // Sections whose artboards are all deleted have slotIds:[] — step past
    // them to the next non-empty section so ↑/↓ doesn't dead-end.
    const n = sectionOrder.length;
    for (let i = 1; i < n; i++) {
      const ns = sectionOrder[((secIdx + d * i) % n + n) % n];
      const first = sectionMeta[ns] && sectionMeta[ns].slotIds[0];
      if (first) {
        ctx.setFocus(`${ns}/${first}`);
        return;
      }
    }
  };
  React.useEffect(() => {
    const k = e => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goSection(-1);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goSection(1);
      }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });
  const {
    width = 260,
    height = 480,
    children
  } = artboard.props;
  const [vp, setVp] = React.useState({
    w: window.innerWidth,
    h: window.innerHeight
  });
  React.useEffect(() => {
    const r = () => setVp({
      w: window.innerWidth,
      h: window.innerHeight
    });
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  const scale = Math.max(0.1, Math.min((vp.w - 200) / width, (vp.h - 260) / height, 2));
  const [ddOpen, setDd] = React.useState(false);
  const Arrow = ({
    dir,
    onClick
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onClick();
    },
    style: {
      position: 'absolute',
      top: '50%',
      [dir]: 28,
      transform: 'translateY(-50%)',
      border: 'none',
      background: 'rgba(255,255,255,.08)',
      color: 'rgba(255,255,255,.9)',
      width: 44,
      height: 44,
      borderRadius: 22,
      fontSize: 18,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background .15s'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.18)',
    onMouseLeave: e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: dir === 'left' ? 'M11 3L5 9l6 6' : 'M7 3l6 6-6 6'
  })));

  // Portal to body so position:fixed is the real viewport regardless of any
  // transform on DesignCanvas's ancestors (including the canvas zoom itself).
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    onClick: () => ctx.setFocus(null),
    onWheel: e => e.preventDefault(),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(24,20,16,.6)',
      backdropFilter: 'blur(14px)',
      fontFamily: DC.font,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      display: 'flex',
      alignItems: 'flex-start',
      padding: '16px 20px 0',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDd(o => !o),
    style: {
      border: 'none',
      background: 'transparent',
      color: '#fff',
      cursor: 'pointer',
      padding: '6px 8px',
      borderRadius: 6,
      textAlign: 'left',
      fontFamily: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: -0.3
    }
  }, meta.title), /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 11 11",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    style: {
      opacity: .7
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 4l3.5 3.5L9 4"
  }))), meta.subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      opacity: .6,
      fontWeight: 400,
      marginTop: 2
    }
  }, meta.subtitle)), ddOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: 4,
      background: '#2a251f',
      borderRadius: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      padding: 4,
      minWidth: 200,
      zIndex: 10
    }
  }, sectionOrder.filter(sid => sectionMeta[sid].slotIds.length).map(sid => /*#__PURE__*/React.createElement("button", {
    key: sid,
    onClick: () => {
      setDd(false);
      const f = sectionMeta[sid].slotIds[0];
      if (f) ctx.setFocus(`${sid}/${f}`);
    },
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      border: 'none',
      cursor: 'pointer',
      background: sid === sectionId ? 'rgba(255,255,255,.1)' : 'transparent',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: 5,
      fontSize: 14,
      fontWeight: sid === sectionId ? 600 : 400,
      fontFamily: 'inherit'
    }
  }, sectionMeta[sid].title)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => ctx.setFocus(null),
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.12)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent',
    style: {
      border: 'none',
      background: 'transparent',
      color: 'rgba(255,255,255,.7)',
      width: 32,
      height: 32,
      borderRadius: 16,
      fontSize: 20,
      cursor: 'pointer',
      lineHeight: 1,
      transition: 'background .12s'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 64,
      bottom: 56,
      left: 100,
      right: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: width * scale,
      height: height * scale,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      background: '#fff',
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: '0 20px 80px rgba(0,0,0,.4)'
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb'
    }
  }, aid))), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 14,
      fontWeight: 500,
      opacity: .85,
      textAlign: 'center'
    }
  }, (sec.labels || {})[aid] ?? artboard.props.label, /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .5,
      marginLeft: 10,
      fontVariantNumeric: 'tabular-nums'
    }
  }, idx + 1, " / ", peers.length))), /*#__PURE__*/React.createElement(Arrow, {
    dir: "left",
    onClick: () => go(-1)
  }), /*#__PURE__*/React.createElement(Arrow, {
    dir: "right",
    onClick: () => go(1)
  }), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 8
    }
  }, peers.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: p,
    onClick: () => ctx.setFocus(`${sectionId}/${p}`),
    style: {
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      width: 6,
      height: 6,
      borderRadius: 3,
      background: i === idx ? '#fff' : 'rgba(255,255,255,.3)'
    }
  })))), document.body);
}

// ─────────────────────────────────────────────────────────────
// Post-it — absolute-positioned sticky note
// ─────────────────────────────────────────────────────────────
function DCPostIt({
  children,
  top,
  left,
  right,
  bottom,
  rotate = -2,
  width = 180
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top,
      left,
      right,
      bottom,
      width,
      background: DC.postitBg,
      padding: '14px 16px',
      fontFamily: '"Comic Sans MS", "Marker Felt", "Segoe Print", cursive',
      fontSize: 14,
      lineHeight: 1.4,
      color: DC.postitText,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      transform: `rotate(${rotate}deg)`,
      zIndex: 5
    }
  }, children);
}
Object.assign(window, {
  DesignCanvas,
  DCSection,
  DCArtboard,
  DCPostIt
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "calendar_redesign/design-canvas.jsx", error: String((e && e.message) || e) }); }

// calendar_redesign/mobileViews.jsx
try { (() => {
// mobileViews.jsx — Mobile Week + Month for both Variant A & B
// Exports: VA_MobileWeek, VA_MobileMonth, VB_MobileWeek, VB_MobileMonth

const {
  useState: useMVState
} = React;

/* ─── Shared mobile shell ────────────────────────────────────── */
function MobileShell({
  children,
  bg = 'var(--bg)'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: bg,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 26,
      background: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 18px',
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-1)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: 'tabular-nums'
    }
  }, "9:41"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'center',
      fontSize: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u25CF\u25CF\u25CF\u25CF"), /*#__PURE__*/React.createElement("span", null, "5G"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 20,
      height: 9,
      border: '1.5px solid var(--text-1)',
      borderRadius: 2,
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 1,
      top: 1,
      bottom: 1,
      right: 2,
      background: 'var(--text-1)',
      borderRadius: 1
    }
  })))), children);
}

/* ─── Shared mobile nav header ───────────────────────────────── */
function MobileNavHeader({
  title,
  subtitle,
  onPrev,
  onNext,
  view,
  onViewChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px 8px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onPrev,
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: '1px solid var(--border)',
      background: 'var(--surface)',
      color: 'var(--text-3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "15 18 9 12 15 6"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: 'var(--text-1)',
      letterSpacing: '-0.015em',
      lineHeight: 1.1
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10.5,
      color: 'var(--text-4)',
      marginTop: 2,
      fontWeight: 500
    }
  }, subtitle)), /*#__PURE__*/React.createElement("button", {
    onClick: onNext,
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: '1px solid var(--border)',
      background: 'var(--surface)',
      color: 'var(--text-3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "9 18 15 12 9 6"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      padding: '0 14px 10px',
      gap: 6
    }
  }, ['Day', 'Week', 'Month'].map(v => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => onViewChange && onViewChange(v.toLowerCase()),
    style: {
      flex: 1,
      padding: '7px 0',
      borderRadius: 9,
      border: 'none',
      fontFamily: 'inherit',
      fontWeight: 700,
      fontSize: 12.5,
      cursor: 'pointer',
      background: view === v.toLowerCase() ? 'var(--teal-600)' : 'var(--surface-2)',
      color: view === v.toLowerCase() ? 'white' : 'var(--text-3)'
    }
  }, v)), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 36,
      borderRadius: 9,
      border: '1px solid var(--border)',
      background: 'var(--surface)',
      color: 'var(--text-3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("polygon", {
    points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
  }))), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 36,
      borderRadius: 9,
      border: 'none',
      background: 'var(--teal-600)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "5",
    x2: "12",
    y2: "19"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "5",
    y1: "12",
    x2: "19",
    y2: "12"
  })))));
}

/* ─── Mobile bottom tab bar ──────────────────────────────────── */
function MobileTabBar() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      flexShrink: 0
    }
  }, [['home', 'Home'], ['calendar', 'Calendar', true], ['users', 'Guests'], ['menu', 'More']].map(([k, l, active]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2.5,
      color: active ? 'var(--teal-700)' : 'var(--text-4)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, k === 'calendar' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    y1: "2",
    x2: "16",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "2",
    x2: "8",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "10",
    x2: "21",
    y2: "10"
  })), k === 'home' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "9 22 9 12 15 12 15 22"
  })), k === 'users' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  })), k === 'menu' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "12",
    x2: "21",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "6",
    x2: "21",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "18",
    x2: "21",
    y2: "18"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: active ? 700 : 500
    }
  }, l))));
}

/* ─── Day detail bottom sheet ────────────────────────────────── */
function DaySheet({
  iso,
  onClose
}) {
  const list = bookingsForDate(iso);
  const d = getDate(iso);
  if (!iso || list.length === 0) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 56,
      background: 'var(--surface)',
      borderTop: '2px solid var(--border)',
      borderRadius: '16px 16px 0 0',
      boxShadow: '0 -8px 32px rgba(15,23,42,0.12)',
      zIndex: 50,
      maxHeight: '60%',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px 8px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--teal-600)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em'
    }
  }, fullDayName(d)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      fontWeight: 800,
      color: 'var(--text-1)',
      letterSpacing: '-0.02em',
      lineHeight: 1
    }
  }, d.getDate(), " ", shortMonth(d))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)',
      fontWeight: 600
    }
  }, list.length, " bookings"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      width: 28,
      height: 28,
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: 'var(--text-3)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: 'auto',
      padding: '4px 12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, list.map(b => {
    const hall = hallById(b.hall);
    const slot = slotById(b.slot);
    const s = statusOf(b.status);
    return /*#__PURE__*/React.createElement("div", {
      key: b.id,
      style: {
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        padding: '8px 10px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        borderLeft: `4px solid ${hall.color}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: 'var(--text-1)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, b.function), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 11,
        color: 'var(--text-4)',
        marginTop: 1
      }
    }, slot.label, " \xB7 ", hall.name, " \xB7 ", b.guests, " pax")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 9999,
        background: s.bg,
        color: s.text,
        flexShrink: 0
      }
    }, s.label));
  })));
}

/* ══════════════════════════════════════════════════════════════ */
/* VARIANT A — MOBILE WEEK                                        */
/* Halls as rows (sticky left), 7 days as scrollable columns     */
/* ══════════════════════════════════════════════════════════════ */
function VA_MobileWeek() {
  const [selectedDay, setSelectedDay] = useMVState(null);
  const weekStart = new Date(2026, 4, 17);
  const days = Array.from({
    length: 7
  }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const HALL_COL = 90; // px, sticky
  const DAY_COL = 72; // px each day

  return /*#__PURE__*/React.createElement(MobileShell, null, /*#__PURE__*/React.createElement(MobileNavHeader, {
    view: "week",
    title: "17 \u2013 23 May",
    subtitle: "Week 21 \xB7 4 halls"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      overflowX: 'auto',
      flexShrink: 0
    }
  }, days.map((d, i) => {
    const iso = isoDate(d);
    const isToday = iso === TODAY_ISO;
    const count = bookingsForDate(iso).length;
    const isWk = d.getDay() === 0 || d.getDay() === 6;
    const hallSet = new Set(bookingsForDate(iso).map(b => b.hall));
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: () => setSelectedDay(selectedDay === iso ? null : iso),
      style: {
        flex: `0 0 ${DAY_COL}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '7px 4px 6px',
        cursor: 'pointer',
        background: isToday ? 'var(--teal-50)' : selectedDay === iso ? 'var(--surface-2)' : 'transparent',
        borderBottom: isToday ? '2px solid var(--teal-500)' : '2px solid transparent'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9.5,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: isWk ? '#dc2626' : isToday ? 'var(--teal-700)' : 'var(--text-4)'
      }
    }, dayName(d)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        marginTop: 2,
        fontVariantNumeric: 'tabular-nums',
        color: isToday ? 'var(--teal-700)' : 'var(--text-1)'
      }
    }, d.getDate()), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 2,
        marginTop: 3
      }
    }, HALLS.map(h => /*#__PURE__*/React.createElement("span", {
      key: h.id,
      style: {
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: hallSet.has(h.id) ? h.color : 'var(--surface-3)'
      }
    }))));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      background: 'var(--surface)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `${HALL_COL}px repeat(7, ${DAY_COL}px)`,
      minWidth: HALL_COL + DAY_COL * 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface-2)',
      position: 'sticky',
      left: 0,
      zIndex: 3,
      padding: '5px 8px',
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--text-4)'
    }
  }, "Hall"), days.map((d, i) => {
    const iso = isoDate(d);
    const isToday = iso === TODAY_ISO;
    const isWk = d.getDay() === 0 || d.getDay() === 6;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        borderRight: i < 6 ? '1px solid var(--border)' : 'none',
        borderBottom: '1px solid var(--border)',
        padding: '5px 3px',
        textAlign: 'center',
        background: isToday ? 'var(--teal-50)' : 'var(--surface-2)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase',
        color: isWk ? '#dc2626' : isToday ? 'var(--teal-700)' : 'var(--text-4)'
      }
    }, dayName(d)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        color: isToday ? 'var(--teal-600)' : 'var(--text-1)',
        lineHeight: 1,
        marginTop: 1
      }
    }, d.getDate()));
  }), HALLS.map((hall, hIdx) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: hall.id
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      left: 0,
      zIndex: 2,
      background: 'var(--surface-2)',
      borderRight: '1px solid var(--border)',
      borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
      padding: '8px 6px 8px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: hall.color,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: 'var(--text-1)',
      lineHeight: 1.1,
      whiteSpace: 'nowrap'
    }
  }, hall.name.replace(' Banquet', '').replace(' Hall', '').replace(' Room', '').replace(' Garden', '')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: 'var(--text-4)',
      marginTop: 1
    }
  }, hall.capacity))), days.map((d, dIdx) => {
    const iso = isoDate(d);
    const isToday = iso === TODAY_ISO;
    const dayHallBooks = bookingsForDate(iso).filter(b => b.hall === hall.id);
    const hasConflict = SLOTS.some(sl => dayHallBooks.filter(b => b.slot === sl.id).length > 1);
    return /*#__PURE__*/React.createElement("div", {
      key: dIdx,
      onClick: () => setSelectedDay(selectedDay === iso ? null : iso),
      style: {
        borderRight: dIdx < 6 ? '1px solid var(--border)' : 'none',
        borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
        background: isToday ? 'rgba(20,184,166,0.04)' : 'var(--surface)',
        padding: 4,
        cursor: 'pointer',
        display: 'grid',
        gridTemplateRows: 'repeat(4,1fr)',
        gap: 2
      }
    }, SLOTS.map(sl => {
      const list = dayHallBooks.filter(b => b.slot === sl.id);
      const b = list[0];
      const conflict = list.length > 1;
      if (!b) return /*#__PURE__*/React.createElement("div", {
        key: sl.id,
        style: {
          borderRadius: 3,
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.5
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 8,
          color: 'var(--text-4)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }
      }, sl.shortLabel.charAt(0)));
      const s = statusOf(b.status);
      const isPencil = b.status === 'pencil';
      return /*#__PURE__*/React.createElement("div", {
        key: sl.id,
        style: {
          borderRadius: 3,
          background: s.bg,
          color: s.text,
          backgroundImage: isPencil ? 'repeating-linear-gradient(135deg, transparent 0, transparent 3px, rgba(146,64,14,0.2) 3px, rgba(146,64,14,0.2) 4px)' : 'none',
          border: conflict ? '1px solid #ef4444' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }
      }, conflict ? /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 8,
          color: '#ef4444'
        }
      }, "\u26A0") : /*#__PURE__*/React.createElement("span", {
        style: {
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: s.accent
        }
      }));
    }));
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 14px',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      flexShrink: 0
    }
  }, [['confirmed', '#22c55e'], ['pencil', '#f59e0b'], ['quotation', '#3b82f6']].map(([k, c]) => /*#__PURE__*/React.createElement("span", {
    key: k,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 10,
      color: 'var(--text-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: statusOf(k).bg,
      border: `1px solid ${c}`
    }
  }), statusOf(k).label)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 10,
      color: 'var(--text-4)'
    }
  }, "M/L/E/D slots")), selectedDay && /*#__PURE__*/React.createElement(DaySheet, {
    iso: selectedDay,
    onClose: () => setSelectedDay(null)
  }), /*#__PURE__*/React.createElement(MobileTabBar, null));
}

/* ══════════════════════════════════════════════════════════════ */
/* VARIANT A — MOBILE MONTH                                       */
/* Standard month grid, status-coded pills, tap for day sheet    */
/* ══════════════════════════════════════════════════════════════ */
function VA_MobileMonth() {
  const [selectedDay, setSelectedDay] = useMVState(null);
  const year = 2026,
    month = 4;
  const days = buildMonthGrid(year, month);
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return /*#__PURE__*/React.createElement(MobileShell, null, /*#__PURE__*/React.createElement(MobileNavHeader, {
    view: "month",
    title: "May 2026",
    subtitle: "43 bookings \xB7 4 halls"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0
    }
  }, weekdays.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '6px 0',
      textAlign: 'center',
      fontSize: 10.5,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: i === 0 || i === 6 ? '#dc2626' : 'var(--text-4)'
    }
  }, w))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: selectedDay ? '0 0 auto' : 1,
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      gridAutoRows: '1fr',
      background: 'var(--surface)',
      flexShrink: 0
    }
  }, days.map((d, i) => {
    const iso = isoDate(d);
    const inMonth = d.getMonth() === month;
    const isToday = iso === TODAY_ISO;
    const isSel = selectedDay === iso;
    const list = bookingsForDate(iso);
    const isWk = d.getDay() === 0 || d.getDay() === 6;
    const visible = list.slice(0, 2);
    const extra = list.length - visible.length;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: () => inMonth && setSelectedDay(isSel ? null : iso),
      style: {
        borderRight: i % 7 < 6 ? '1px solid var(--border)' : 'none',
        borderBottom: i < 35 ? '1px solid var(--border)' : 'none',
        padding: '4px 3px 3px',
        background: isSel ? 'var(--teal-50)' : isToday ? 'rgba(20,184,166,0.06)' : isWk && inMonth ? '#fafbfc' : 'var(--surface)',
        opacity: inMonth ? 1 : 0.4,
        cursor: inMonth ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minHeight: 0,
        outline: isToday ? '2px solid var(--teal-500)' : 'none',
        outlineOffset: -2,
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        color: isToday ? 'var(--teal-700)' : isWk ? '#dc2626' : 'var(--text-1)',
        ...(isToday ? {
          background: 'var(--teal-600)',
          color: 'white',
          padding: '1px 5px',
          borderRadius: 7,
          fontWeight: 800
        } : {})
      }
    }, d.getDate()), list.length > 2 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 8.5,
        fontWeight: 700,
        color: 'var(--text-4)',
        background: 'var(--surface-2)',
        padding: '0 4px',
        borderRadius: 5,
        fontVariantNumeric: 'tabular-nums'
      }
    }, "+", extra + (visible.length - visible.length))), visible.map(b => {
      const s = statusOf(b.status);
      const hall = hallById(b.hall);
      return /*#__PURE__*/React.createElement("div", {
        key: b.id,
        style: {
          background: s.bg,
          color: s.text,
          borderLeft: `2px solid ${hall.color}`,
          borderRadius: 2,
          padding: '1px 3px',
          fontSize: 8.5,
          fontWeight: 700,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.3
        }
      }, b.function);
    }), extra > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 8.5,
        color: 'var(--text-4)',
        fontWeight: 600,
        paddingLeft: 2
      }
    }, "+", extra));
  })), selectedDay ? /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      borderTop: '2px solid var(--teal-500)',
      background: 'var(--surface)',
      padding: '0 0 8px'
    }
  }, (() => {
    const list = bookingsForDate(selectedDay);
    const d = getDate(selectedDay);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px 8px'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: 'var(--teal-600)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }
    }, fullDayName(d)), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        color: 'var(--text-1)',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        marginTop: 1
      }
    }, d.getDate(), " ", shortMonth(d), " \xB7 ", list.length, " bookings")), /*#__PURE__*/React.createElement("button", {
      onClick: () => setSelectedDay(null),
      style: {
        width: 28,
        height: 28,
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--text-3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "12",
      height: "12",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round"
    }, /*#__PURE__*/React.createElement("line", {
      x1: "18",
      y1: "6",
      x2: "6",
      y2: "18"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "6",
      y1: "6",
      x2: "18",
      y2: "18"
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        padding: '0 10px'
      }
    }, list.map(b => {
      const hall = hallById(b.hall);
      const slot = slotById(b.slot);
      const s = statusOf(b.status);
      return /*#__PURE__*/React.createElement("div", {
        key: b.id,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          borderLeft: `4px solid ${hall.color}`,
          background: 'var(--surface)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("p", {
        style: {
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--text-1)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }
      }, b.function), /*#__PURE__*/React.createElement("p", {
        style: {
          fontSize: 10.5,
          color: 'var(--text-4)',
          marginTop: 1
        }
      }, slot.label, " \xB7 ", hall.name, " \xB7 ", b.guests, " pax")), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9.5,
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: 9999,
          background: s.bg,
          color: s.text,
          flexShrink: 0
        }
      }, s.label));
    })));
  })()) : null, /*#__PURE__*/React.createElement(MobileTabBar, null));
}

/* ══════════════════════════════════════════════════════════════ */
/* VARIANT B — MOBILE WEEK                                        */
/* Hall-coded: big day cards, hall chips, slot bars per day       */
/* ══════════════════════════════════════════════════════════════ */
function VB_MobileWeek() {
  const [activeDay, setActiveDay] = useMVState(TODAY_ISO);
  const weekStart = new Date(2026, 4, 17);
  const days = Array.from({
    length: 7
  }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const activeDayBookings = bookingsForDate(activeDay).sort((a, b) => slotById(a.slot).startH - slotById(b.slot).startH);
  return /*#__PURE__*/React.createElement(MobileShell, null, /*#__PURE__*/React.createElement(MobileNavHeader, {
    view: "week",
    title: "17 \u2013 23 May",
    subtitle: "Week 21"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 12px',
      display: 'flex',
      gap: 7,
      overflowX: 'auto',
      flexShrink: 0
    }
  }, days.map((d, i) => {
    const iso = isoDate(d);
    const isActive = iso === activeDay;
    const isToday = iso === TODAY_ISO;
    const list = bookingsForDate(iso);
    const hallsActive = HALLS.filter(h => list.some(b => b.hall === h.id));
    const isWk = d.getDay() === 0 || d.getDay() === 6;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => setActiveDay(iso),
      style: {
        flex: isActive ? '0 0 78px' : '0 0 54px',
        padding: isActive ? '10px 6px' : '8px 4px',
        borderRadius: 14,
        border: isToday ? '2px solid var(--teal-500)' : '1px solid var(--border)',
        background: isActive ? 'var(--teal-600)' : isToday ? 'var(--teal-50)' : 'var(--surface)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        transition: 'flex 0.2s, background 0.15s'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: isActive ? 9.5 : 9,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: isActive ? 'rgba(255,255,255,0.8)' : isWk ? '#dc2626' : 'var(--text-4)'
      }
    }, dayName(d)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: isActive ? 22 : 17,
        fontWeight: 800,
        letterSpacing: '-0.025em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        color: isActive ? 'white' : 'var(--text-1)'
      }
    }, d.getDate()), isActive ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: 600
      }
    }, list.length, " events") : /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 40
      }
    }, HALLS.map(h => {
      const booked = list.some(b => b.hall === h.id);
      return /*#__PURE__*/React.createElement("span", {
        key: h.id,
        style: {
          width: booked ? 5 : 4,
          height: booked ? 5 : 4,
          borderRadius: '50%',
          background: booked ? h.color : 'var(--surface-3)',
          opacity: booked ? 1 : 0.5
        }
      });
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '12px 12px 0'
    }
  }, HALLS.map(hall => {
    const hallBooks = activeDayBookings.filter(b => b.hall === hall.id);
    return /*#__PURE__*/React.createElement("div", {
      key: hall.id,
      style: {
        marginBottom: 10,
        background: 'var(--surface)',
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        borderLeft: `5px solid ${hall.color}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 12px',
        borderBottom: hallBooks.length > 0 ? '1px solid var(--border)' : 'none',
        background: `${hall.tint}60`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        fontWeight: 800,
        color: 'var(--text-1)',
        letterSpacing: '-0.01em'
      }
    }, hall.name), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 10.5,
        color: 'var(--text-4)',
        marginTop: 1,
        fontWeight: 500
      }
    }, "cap. ", hall.capacity, " \xB7 ", hallBooks.length, " booking", hallBooks.length !== 1 ? 's' : '')), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 3
      }
    }, SLOTS.map(sl => {
      const b = hallBooks.find(bk => bk.slot === sl.id);
      const s = b ? statusOf(b.status) : null;
      return /*#__PURE__*/React.createElement("div", {
        key: sl.id,
        title: sl.label,
        style: {
          width: 22,
          height: 22,
          borderRadius: 6,
          background: s ? s.bg : 'var(--surface-2)',
          border: `1px solid ${s ? s.accent + '80' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 7.5,
          fontWeight: 800,
          color: s ? s.text : 'var(--text-4)',
          textTransform: 'uppercase'
        }
      }, sl.shortLabel.charAt(0)));
    }))), hallBooks.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }
    }, hallBooks.map(b => {
      const slot = slotById(b.slot);
      const s = statusOf(b.status);
      const isPencil = b.status === 'pencil';
      return /*#__PURE__*/React.createElement("div", {
        key: b.id,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 10,
          background: s.soft,
          border: isPencil ? `1.5px dashed ${s.accent}` : `1px solid ${s.accent}50`
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("p", {
        style: {
          fontSize: 12.5,
          fontWeight: 800,
          color: 'var(--text-1)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }
      }, b.function), /*#__PURE__*/React.createElement("p", {
        style: {
          fontSize: 11,
          color: 'var(--text-3)',
          marginTop: 1
        }
      }, slot.label, " \xB7 ", b.customer, " \xB7 ", b.guests, " pax")), /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: 'right',
          flexShrink: 0
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9.5,
          fontWeight: 800,
          padding: '2px 7px',
          borderRadius: 9999,
          background: s.bg,
          color: s.text,
          display: 'block',
          textTransform: 'uppercase',
          letterSpacing: '0.03em'
        }
      }, s.label), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          color: 'var(--text-4)',
          marginTop: 3,
          display: 'block',
          fontVariantNumeric: 'tabular-nums'
        }
      }, formatINR(b.grand))));
    })), hallBooks.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '10px 12px',
        fontSize: 11,
        color: 'var(--text-4)',
        fontStyle: 'italic'
      }
    }, "All slots available \u2014 tap to book"));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 12
    }
  })), /*#__PURE__*/React.createElement(MobileTabBar, null));
}

/* ══════════════════════════════════════════════════════════════ */
/* VARIANT B — MOBILE MONTH                                       */
/* Editorial month: hall-dot strip per day, big tap-to-expand     */
/* ══════════════════════════════════════════════════════════════ */
function VB_MobileMonth() {
  const [selectedDay, setSelectedDay] = useMVState(null);
  const year = 2026,
    month = 4;
  const days = buildMonthGrid(year, month);
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Build per-day hall occupancy
  const dayData = {};
  days.forEach(d => {
    if (d.getMonth() !== month) return;
    const iso = isoDate(d);
    const list = bookingsForDate(iso);
    dayData[iso] = {
      count: list.length,
      halls: HALLS.map(h => ({
        hall: h,
        slots: list.filter(b => b.hall === h.id)
      }))
    };
  });
  return /*#__PURE__*/React.createElement(MobileShell, null, /*#__PURE__*/React.createElement(MobileNavHeader, {
    view: "month",
    title: "May 2026",
    subtitle: "43 bookings \xB7 peak Sat 23"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      padding: '6px 12px 8px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      overflowX: 'auto',
      flexShrink: 0
    }
  }, HALLS.map(h => /*#__PURE__*/React.createElement("span", {
    key: h.id,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 9px',
      borderRadius: 9999,
      background: `${h.color}14`,
      border: `1px solid ${h.color}40`,
      fontSize: 10.5,
      fontWeight: 700,
      color: h.color,
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: h.color
    }
  }), h.name.replace(' Hall', '').replace(' Banquet', '').replace(' Room', '').replace(' Garden', '')))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0
    }
  }, weekdays.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '5px 0',
      textAlign: 'center',
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: '0.06em',
      color: i === 0 || i === 6 ? '#dc2626' : 'var(--text-4)'
    }
  }, w))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      gridAutoRows: selectedDay ? undefined : '1fr',
      flex: selectedDay ? '0 0 auto' : 1,
      background: 'var(--surface)',
      flexShrink: 0
    }
  }, days.map((d, i) => {
    const inMonth = d.getMonth() === month;
    const iso = isoDate(d);
    const isToday = iso === TODAY_ISO;
    const isSel = selectedDay === iso;
    const data = dayData[iso] || {
      count: 0,
      halls: []
    };
    const isWk = d.getDay() === 0 || d.getDay() === 6;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: () => inMonth && setSelectedDay(isSel ? null : iso),
      style: {
        borderRight: i % 7 < 6 ? '1px solid var(--border)' : 'none',
        borderBottom: i < 35 ? '1px solid var(--border)' : 'none',
        padding: '5px 4px 6px',
        background: isSel ? 'var(--teal-50)' : isToday ? 'rgba(20,184,166,0.05)' : 'var(--surface)',
        opacity: inMonth ? 1 : 0.35,
        cursor: inMonth ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        minHeight: selectedDay ? 68 : 0,
        outline: isToday ? '2px solid var(--teal-500)' : isSel ? '2px solid var(--teal-300)' : 'none',
        outlineOffset: -2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        color: isToday ? 'white' : isWk ? '#dc2626' : 'var(--text-1)',
        background: isToday ? 'var(--teal-600)' : 'transparent',
        padding: isToday ? '2px 5px' : 0,
        borderRadius: isToday ? 8 : 0
      }
    }, d.getDate()), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: 2,
        width: '100%'
      }
    }, HALLS.map(h => {
      const booked = data.halls.find(hd => hd.hall.id === h.id);
      const count = booked ? booked.slots.length : 0;
      return /*#__PURE__*/React.createElement("div", {
        key: h.id,
        style: {
          height: 4,
          borderRadius: 2,
          background: count > 0 ? h.color : 'var(--surface-2)',
          opacity: count > 0 ? 1 : 0.4
        }
      });
    })), data.count > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 800,
        color: 'var(--text-4)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1
      }
    }, data.count));
  })), selectedDay && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      borderTop: '2px solid var(--teal-500)',
      background: 'var(--surface)'
    }
  }, (() => {
    const d = getDate(selectedDay);
    const list = bookingsForDate(selectedDay);
    const grouped = SLOTS.map(sl => ({
      slot: sl,
      list: list.filter(b => b.slot === sl.id)
    })).filter(g => g.list.length > 0);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px 8px',
        position: 'sticky',
        top: 0,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        zIndex: 5
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 10,
        fontWeight: 800,
        color: 'var(--teal-600)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }
    }, fullDayName(d)), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: 'var(--text-1)',
        letterSpacing: '-0.025em',
        lineHeight: 1.1,
        marginTop: 2
      }
    }, d.getDate(), " ", shortMonth(d), " \xB7 ", list.length, " events")), /*#__PURE__*/React.createElement("button", {
      onClick: () => setSelectedDay(null),
      style: {
        width: 30,
        height: 30,
        borderRadius: 9,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--text-3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "12",
      height: "12",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round"
    }, /*#__PURE__*/React.createElement("line", {
      x1: "18",
      y1: "6",
      x2: "6",
      y2: "18"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "6",
      y1: "6",
      x2: "18",
      y2: "18"
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '10px 12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, grouped.map(g => /*#__PURE__*/React.createElement("div", {
      key: g.slot.id
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 10,
        fontWeight: 800,
        color: 'var(--text-4)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 6
      }
    }, g.slot.label, " \xB7 ", g.slot.startLabel, "\u2013", g.slot.endLabel), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 5
      }
    }, g.list.map(b => {
      const hall = hallById(b.hall);
      const s = statusOf(b.status);
      return /*#__PURE__*/React.createElement("div", {
        key: b.id,
        style: {
          display: 'flex',
          gap: 8,
          padding: '9px 11px',
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          borderLeft: `5px solid ${hall.color}`
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("p", {
        style: {
          fontSize: 12.5,
          fontWeight: 800,
          color: 'var(--text-1)',
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }
      }, b.function), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginTop: 3
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: hall.color
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: 'var(--text-3)',
          fontWeight: 500
        }
      }, hall.name, " \xB7 ", b.type, " \xB7 ", b.guests, " pax"))), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9.5,
          fontWeight: 800,
          padding: '2px 8px',
          borderRadius: 9999,
          background: s.bg,
          color: s.text,
          alignSelf: 'flex-start',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          flexShrink: 0
        }
      }, s.label));
    }))))));
  })()), /*#__PURE__*/React.createElement(MobileTabBar, null));
}
Object.assign(window, {
  VA_MobileWeek,
  VA_MobileMonth,
  VB_MobileWeek,
  VB_MobileMonth
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "calendar_redesign/mobileViews.jsx", error: String((e && e.message) || e) }); }

// calendar_redesign/variantA.jsx
try { (() => {
// variantA.jsx — "Resource Matrix" — lean, on-brand, dense Gantt
// Exports: VA_Month, VA_Week, VA_Day, VA_Mobile

const {
  useState: useStateA
} = React;

/* ─── Shared icon glyphs ─────────────────────────────────────── */
const A_ICONS = {
  chevL: /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "15 18 9 12 15 6"
  })),
  chevR: /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "9 18 15 12 9 6"
  })),
  chevDn: /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "6 9 12 15 18 9"
  })),
  filter: /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polygon", {
    points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
  })),
  plus: /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "5",
    x2: "12",
    y2: "19"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "5",
    y1: "12",
    x2: "19",
    y2: "12"
  })),
  warn: /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.25",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "9",
    x2: "12",
    y2: "13"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "17",
    x2: "12.01",
    y2: "17"
  }))
};

/* Diagonal stripe pattern for pencil bookings */
const A_STRIPE = 'repeating-linear-gradient(135deg, transparent 0, transparent 4px, rgba(146,64,14,0.18) 4px, rgba(146,64,14,0.18) 5px)';

/* ─── Toolbar ────────────────────────────────────────────────── */
function VA_Toolbar({
  view,
  onView,
  title,
  subtitle
}) {
  const Btn = ({
    children,
    onClick,
    active,
    style
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      padding: '6px 11px',
      borderRadius: 9,
      border: '1px solid var(--border-2)',
      background: active ? 'var(--teal-600)' : 'var(--surface)',
      color: active ? 'white' : 'var(--text-2)',
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      ...style
    }
  }, children);
  const ChipFilter = ({
    label
  }) => /*#__PURE__*/React.createElement("button", {
    style: {
      padding: '5px 10px',
      borderRadius: 9,
      border: '1px solid var(--border-2)',
      background: 'var(--surface)',
      color: 'var(--text-3)',
      fontSize: 11.5,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, A_ICONS.filter, label, A_ICONS.chevDn);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, null, A_ICONS.chevL), /*#__PURE__*/React.createElement(Btn, null, A_ICONS.chevR), /*#__PURE__*/React.createElement(Btn, {
    style: {
      padding: '6px 12px'
    }
  }, "Today"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 10
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--text-1)',
      letterSpacing: '-0.01em',
      lineHeight: 1.1
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)',
      marginTop: 1
    }
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      background: 'var(--surface-2)',
      padding: 3,
      borderRadius: 10,
      gap: 2
    }
  }, ['month', 'week', 'day'].map(v => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => onView && onView(v),
    style: {
      padding: '5px 13px',
      borderRadius: 7,
      border: 'none',
      background: view === v ? 'var(--surface)' : 'transparent',
      color: view === v ? 'var(--text-1)' : 'var(--text-3)',
      fontSize: 12,
      fontWeight: view === v ? 600 : 500,
      cursor: 'pointer',
      fontFamily: 'inherit',
      textTransform: 'capitalize',
      boxShadow: view === v ? '0 1px 2px rgba(15,23,42,0.06)' : 'none'
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(ChipFilter, {
    label: "All halls"
  }), /*#__PURE__*/React.createElement(ChipFilter, {
    label: "Status"
  }), /*#__PURE__*/React.createElement(ChipFilter, {
    label: "Type"
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      padding: '6px 13px',
      borderRadius: 10,
      border: 'none',
      background: 'var(--teal-600)',
      color: 'white',
      fontSize: 12.5,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      boxShadow: '0 1px 3px rgba(13,148,136,0.25)'
    }
  }, A_ICONS.plus, "Booking")));
}

/* ─── Status legend ──────────────────────────────────────────── */
function VA_Legend() {
  const items = [{
    key: 'confirmed',
    label: 'Confirmed'
  }, {
    key: 'pencil',
    label: 'Pencil'
  }, {
    key: 'quotation',
    label: 'Quotation'
  }, {
    key: 'enquiry',
    label: 'Enquiry'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      padding: '6px 16px',
      background: 'var(--surface-2)',
      borderBottom: '1px solid var(--border)',
      fontSize: 11
    }
  }, items.map(i => {
    const s = statusOf(i.key);
    const stripe = i.key === 'pencil';
    return /*#__PURE__*/React.createElement("span", {
      key: i.key,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: 'var(--text-3)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 12,
        height: 12,
        borderRadius: 3,
        background: s.bg,
        border: `1px solid ${s.accent}`,
        backgroundImage: stripe ? A_STRIPE : 'none'
      }
    }), i.label);
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      color: 'var(--text-4)'
    }
  }, "\u25CF Today ", TODAY.getDate(), " ", shortMonth(TODAY)));
}

/* ─── Booking pill (compact) ─────────────────────────────────── */
function VA_Pill({
  booking,
  slim
}) {
  const s = statusOf(booking.status);
  const hall = hallById(booking.hall);
  const slot = slotById(booking.slot);
  const isPencil = booking.status === 'pencil';
  return /*#__PURE__*/React.createElement("div", {
    title: `${booking.function} · ${booking.customer} · ${booking.guests} guests`,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      minWidth: 0,
      padding: slim ? '2px 6px' : '3px 7px',
      borderRadius: 5,
      background: s.bg,
      color: s.text,
      border: `1px solid ${booking.conflict ? '#ef4444' : 'transparent'}`,
      backgroundImage: isPencil ? A_STRIPE : 'none',
      fontSize: 10.5,
      fontWeight: 600,
      lineHeight: 1.2,
      cursor: 'pointer',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 4,
      height: 4,
      borderRadius: '50%',
      background: hall.color,
      flexShrink: 0
    }
  }), !slim && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9.5,
      opacity: 0.7,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.02em'
    }
  }, slot.shortLabel), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      flex: 1
    }
  }, booking.function), booking.conflict && /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#ef4444'
    }
  }, A_ICONS.warn));
}

/* ─── MONTH VIEW ─────────────────────────────────────────────── */
function VA_Month() {
  const year = 2026,
    month = 4; // May
  const days = buildMonthGrid(year, month);
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(VA_Toolbar, {
    view: "month",
    title: "May 2026",
    subtitle: "43 bookings \xB7 4 halls \xB7 31 days"
  }), /*#__PURE__*/React.createElement(VA_Legend, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      background: 'var(--surface-2)',
      borderBottom: '1px solid var(--border)'
    }
  }, dayHeaders.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: d,
    style: {
      padding: '5px 10px',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: i === 0 || i === 6 ? '#dc2626' : 'var(--text-4)',
      borderRight: i < 6 ? '1px solid var(--border)' : 'none'
    }
  }, d))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gridTemplateRows: 'repeat(6, 1fr)',
      background: 'var(--surface)',
      minHeight: 0
    }
  }, days.map((d, i) => {
    const inMonth = d.getMonth() === month;
    const iso = isoDate(d);
    const isToday = iso === TODAY_ISO;
    const list = bookingsForDate(iso);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const visible = list.slice(0, 5);
    const extra = list.length - visible.length;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        borderRight: i % 7 < 6 ? '1px solid var(--border)' : 'none',
        borderBottom: i < 35 ? '1px solid var(--border)' : 'none',
        padding: '4px 5px 3px',
        background: !inMonth ? 'var(--surface-2)' : isToday ? 'var(--teal-50)' : isWeekend ? '#fafbfc' : 'var(--surface)',
        opacity: inMonth ? 1 : 0.55,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minHeight: 0,
        overflow: 'hidden',
        outline: isToday ? '2px solid var(--teal-500)' : 'none',
        outlineOffset: -2,
        cursor: 'pointer',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: isToday ? 13 : 12,
        fontWeight: isToday ? 800 : 600,
        color: isToday ? 'var(--teal-700)' : isWeekend ? '#dc2626' : 'var(--text-1)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        background: isToday ? 'var(--teal-600)' : 'transparent',
        color2: isToday ? 'white' : undefined,
        ...(isToday ? {
          color: 'white',
          padding: '2px 6px',
          borderRadius: 8
        } : {})
      }
    }, d.getDate()), list.length > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 700,
        color: 'var(--text-4)',
        background: 'var(--surface-2)',
        padding: '1px 5px',
        borderRadius: 9,
        fontVariantNumeric: 'tabular-nums'
      }
    }, list.length)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflow: 'hidden',
        flex: 1
      }
    }, visible.map(b => /*#__PURE__*/React.createElement(VA_Pill, {
      key: b.id,
      booking: b,
      slim: list.length > 4
    })), extra > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: 'var(--text-4)',
        fontWeight: 600,
        paddingLeft: 4,
        marginTop: 1
      }
    }, "+ ", extra, " more")));
  })));
}

/* ─── WEEK VIEW (Halls × 7 days) ─────────────────────────────── */
function VA_Week() {
  // Week of May 17-23, 2026 (Sun-Sat)
  const weekStart = new Date(2026, 4, 17);
  const days = Array.from({
    length: 7
  }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(VA_Toolbar, {
    view: "week",
    title: "Week of 17 \u2013 23 May 2026",
    subtitle: "22 bookings \xB7 4 halls \xB7 1 conflict on Sat 23 May"
  }), /*#__PURE__*/React.createElement(VA_Legend, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '170px repeat(7, 1fr)',
      background: 'var(--surface-2)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px',
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--text-4)',
      borderRight: '1px solid var(--border)'
    }
  }, "Hall"), days.map((d, i) => {
    const isToday = isoDate(d) === TODAY_ISO;
    const isWk = d.getDay() === 0 || d.getDay() === 6;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        padding: '6px 10px',
        borderRight: i < 6 ? '1px solid var(--border)' : 'none',
        background: isToday ? 'var(--teal-50)' : 'transparent',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9.5,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: isWk ? '#dc2626' : 'var(--text-4)',
        lineHeight: 1
      }
    }, dayName(d)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: isToday ? 16 : 14,
        fontWeight: isToday ? 800 : 600,
        color: isToday ? 'var(--teal-700)' : 'var(--text-1)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1
      }
    }, d.getDate()));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '170px repeat(7, 1fr)',
      gridTemplateRows: `repeat(${HALLS.length}, 1fr)`,
      background: 'var(--surface)',
      minHeight: 0
    }
  }, HALLS.map((hall, hIdx) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: hall.id
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px',
      borderRight: '1px solid var(--border)',
      borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 2,
      background: 'var(--surface-2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: hall.color,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text-1)',
      letterSpacing: '-0.01em'
    }
  }, hall.name)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: 'var(--text-4)',
      fontVariantNumeric: 'tabular-nums',
      paddingLeft: 15
    }
  }, "cap. ", hall.capacity)), days.map((d, dIdx) => {
    const iso = isoDate(d);
    const isToday = iso === TODAY_ISO;
    const isWk = d.getDay() === 0 || d.getDay() === 6;
    const dayBookings = bookingsForDate(iso).filter(b => b.hall === hall.id);
    return /*#__PURE__*/React.createElement("div", {
      key: dIdx,
      style: {
        borderRight: dIdx < 6 ? '1px solid var(--border)' : 'none',
        borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
        background: isToday ? 'rgba(20,184,166,0.04)' : isWk ? '#fafbfc' : 'var(--surface)',
        display: 'grid',
        gridTemplateRows: 'repeat(4, 1fr)',
        gap: 0,
        padding: 2
      }
    }, SLOTS.map((slot, sIdx) => {
      const slotBookings = dayBookings.filter(b => b.slot === slot.id);
      const b = slotBookings[0];
      const conflict = slotBookings.length > 1;
      if (!b) return /*#__PURE__*/React.createElement("div", {
        key: slot.id,
        style: {
          borderTop: sIdx > 0 ? '1px dashed var(--surface-3)' : 'none',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 4,
          fontSize: 9,
          color: 'var(--text-4)',
          opacity: 0.5
        }
      }, slot.shortLabel);
      const s = statusOf(b.status);
      const isPencil = b.status === 'pencil';
      return /*#__PURE__*/React.createElement("div", {
        key: slot.id,
        style: {
          margin: '1px 0',
          background: s.bg,
          color: s.text,
          backgroundImage: isPencil ? A_STRIPE : 'none',
          borderRadius: 4,
          border: `1px solid ${conflict ? '#ef4444' : s.accent}40`,
          padding: '3px 5px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          fontWeight: 700,
          opacity: 0.6,
          letterSpacing: '0.02em',
          textTransform: 'uppercase'
        }
      }, slot.shortLabel), conflict && /*#__PURE__*/React.createElement("span", {
        style: {
          color: '#ef4444',
          display: 'flex'
        }
      }, A_ICONS.warn)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10.5,
          fontWeight: 700,
          lineHeight: 1.15,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }
      }, b.function), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9.5,
          opacity: 0.75,
          lineHeight: 1.1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }
      }, b.customer, " \xB7 ", b.type));
    }));
  })))));
}

/* ─── DAY VIEW (Halls × hour columns) ────────────────────────── */
function VA_Day() {
  const hours = Array.from({
    length: 15
  }, (_, i) => i + 9); // 9am to 11pm
  const dayBookings = bookingsForDate(TODAY_ISO);
  // Each hour = 1 unit. Total width = 15 units.
  const COL_WIDTH = 75; // px per hour
  const HALL_COL_WIDTH = 160;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(VA_Toolbar, {
    view: "day",
    title: `${fullDayName(TODAY)}, 21 May 2026`,
    subtitle: `${dayBookings.length} bookings today · Now 14:32`
  }), /*#__PURE__*/React.createElement(VA_Legend, null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      background: 'var(--surface)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `${HALL_COL_WIDTH}px 1fr`,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface-2)',
      padding: '8px 12px',
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--text-4)',
      position: 'sticky',
      left: 0,
      zIndex: 2
    }
  }, "Hall"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${hours.length}, ${COL_WIDTH}px)`,
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface-2)'
    }
  }, hours.map(h => {
    const slot = SLOTS.find(s => h >= s.startH && h < s.endH);
    const isNow = h === 14;
    return /*#__PURE__*/React.createElement("div", {
      key: h,
      style: {
        padding: '6px 8px',
        borderRight: '1px solid var(--border)',
        fontSize: 10.5,
        color: isNow ? 'var(--teal-700)' : 'var(--text-4)',
        fontWeight: isNow ? 700 : 600,
        textAlign: 'left',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--text-1)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1
      }
    }, h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        marginTop: 1,
        opacity: 0.65,
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }
    }, slot ? slot.label : ''));
  })), HALLS.map((hall, hIdx) => {
    const hallBookings = dayBookings.filter(b => b.hall === hall.id);
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: hall.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '12px',
        borderRight: '1px solid var(--border)',
        borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
        background: 'var(--surface-2)',
        position: 'sticky',
        left: 0,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 3
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 7
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: 2,
        background: hall.color
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--text-1)',
        letterSpacing: '-0.01em'
      }
    }, hall.name)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--text-4)',
        paddingLeft: 17
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontVariantNumeric: 'tabular-nums'
      }
    }, hallBookings.length), " bookings \xB7 cap. ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontVariantNumeric: 'tabular-nums'
      }
    }, hall.capacity))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
        height: 110,
        backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px)`,
        backgroundSize: `${COL_WIDTH}px 100%`,
        backgroundPosition: '0 0'
      }
    }, SLOTS.map((slot, sIdx) => {
      const left = (slot.startH - 9) * COL_WIDTH;
      const width = (slot.endH - slot.startH) * COL_WIDTH;
      return /*#__PURE__*/React.createElement("div", {
        key: slot.id,
        style: {
          position: 'absolute',
          left,
          top: 0,
          bottom: 0,
          width,
          background: sIdx % 2 === 0 ? 'transparent' : 'rgba(15,23,42,0.015)'
        }
      });
    }), hallBookings.map(b => {
      const slot = slotById(b.slot);
      const left = (slot.startH - 9) * COL_WIDTH + 3;
      const width = (slot.endH - slot.startH) * COL_WIDTH - 6;
      const s = statusOf(b.status);
      const isPencil = b.status === 'pencil';
      return /*#__PURE__*/React.createElement("div", {
        key: b.id,
        style: {
          position: 'absolute',
          left,
          width,
          top: 6,
          bottom: 6,
          background: s.bg,
          color: s.text,
          backgroundImage: isPencil ? A_STRIPE : 'none',
          borderRadius: 7,
          border: `1.5px solid ${s.accent}`,
          borderLeft: `4px solid ${hall.color}`,
          padding: '6px 9px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          overflow: 'hidden'
        }
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.15,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }
      }, b.function), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10.5,
          opacity: 0.85,
          marginTop: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }
      }, b.customer, " \xB7 ", b.type)), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9.5,
          opacity: 0.75,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums'
        }
      }, slot.startLabel, "\u2013", slot.endLabel), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9.5,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          background: 'rgba(255,255,255,0.55)',
          padding: '1px 6px',
          borderRadius: 7
        }
      }, b.guests, " guests")));
    }), hIdx === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: (14.5 - 9) * COL_WIDTH,
        top: 0,
        bottom: -((HALLS.length - 1) * 110 + (HALLS.length - 1)),
        width: 2,
        background: 'var(--teal-600)',
        zIndex: 5,
        pointerEvents: 'none'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: -2,
        left: -4,
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: 'var(--teal-600)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: -16,
        left: 4,
        fontSize: 9.5,
        fontWeight: 700,
        color: 'white',
        background: 'var(--teal-600)',
        padding: '1px 5px',
        borderRadius: 4,
        whiteSpace: 'nowrap'
      }
    }, "Now 14:32"))));
  }))));
}

/* ─── MOBILE — Today's agenda ────────────────────────────────── */
function VA_Mobile() {
  const dayBookings = bookingsForDate(TODAY_ISO).sort((a, b) => slotById(a.slot).startH - slotById(b.slot).startH);
  const grouped = SLOTS.map(slot => ({
    slot,
    list: dayBookings.filter(b => b.slot === slot.id)
  }));

  // 7-day strip centered on today (May 18-24)
  const stripDays = Array.from({
    length: 7
  }, (_, i) => {
    const d = new Date(2026, 4, 18 + i);
    return d;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 28,
      background: 'var(--surface)',
      padding: '0 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-1)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'center',
      fontSize: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u25CF\u25CF\u25CF\u25CF"), /*#__PURE__*/React.createElement("span", null, "5G"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 22,
      height: 10,
      border: '1px solid var(--text-1)',
      borderRadius: 2,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 1,
      top: 1,
      bottom: 1,
      width: 16,
      background: 'var(--text-1)',
      borderRadius: 1
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px 10px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--teal-600)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    }
  }, "Today"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      color: 'var(--text-1)',
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
      marginTop: 2
    }
  }, "Thu, 21 May")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      border: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-3)',
      cursor: 'pointer'
    }
  }, A_ICONS.filter), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      border: 'none',
      background: 'var(--teal-600)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, A_ICONS.plus)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      padding: '10px 14px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      overflowX: 'auto'
    }
  }, stripDays.map((d, i) => {
    const iso = isoDate(d);
    const isToday = iso === TODAY_ISO;
    const count = bookingsForDate(iso).length;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      style: {
        flex: '0 0 46px',
        padding: '8px 4px',
        borderRadius: 12,
        border: 'none',
        background: isToday ? 'var(--teal-600)' : 'transparent',
        color: isToday ? 'white' : 'var(--text-2)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9.5,
        fontWeight: 600,
        opacity: 0.8,
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }
    }, dayName(d)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 17,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1
      }
    }, d.getDate()), count > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: isToday ? 'white' : 'var(--teal-500)'
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      padding: '8px 14px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)'
    }
  }, ['Day', 'Week', 'Month'].map((v, i) => /*#__PURE__*/React.createElement("button", {
    key: v,
    style: {
      padding: '6px 14px',
      borderRadius: 9,
      background: i === 0 ? 'var(--teal-50)' : 'transparent',
      color: i === 0 ? 'var(--teal-700)' : 'var(--text-3)',
      fontSize: 12,
      fontWeight: i === 0 ? 700 : 500,
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'inherit'
    }
  }, v)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 11,
      color: 'var(--text-4)',
      alignSelf: 'center'
    }
  }, bookingsForDate(TODAY_ISO).length, " bookings")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '8px 12px 80px'
    }
  }, grouped.map(g => g.list.length === 0 ? null : /*#__PURE__*/React.createElement("div", {
    key: g.slot.id,
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
      padding: '0 2px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-2)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    }
  }, g.slot.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: 'var(--text-4)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, g.slot.startLabel, " \u2013 ", g.slot.endLabel), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-4)',
      background: 'var(--surface-2)',
      padding: '1px 7px',
      borderRadius: 8
    }
  }, g.list.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, g.list.map(b => {
    const hall = hallById(b.hall);
    const s = statusOf(b.status);
    const isPencil = b.status === 'pencil';
    return /*#__PURE__*/React.createElement("div", {
      key: b.id,
      style: {
        background: 'var(--surface)',
        borderRadius: 12,
        padding: '10px 12px',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${hall.color}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        backgroundImage: isPencil ? `repeating-linear-gradient(135deg, transparent 0, transparent 8px, rgba(146,64,114,0.04) 8px, rgba(146,64,114,0.04) 9px)` : 'none'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        color: 'var(--text-1)',
        lineHeight: 1.25,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, b.function), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-3)',
        marginTop: 2
      }
    }, b.customer), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 5,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--text-4)',
        fontWeight: 600
      }
    }, hall.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: 'var(--text-4)'
      }
    }, "\xB7"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--text-4)'
      }
    }, b.type), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: 'var(--text-4)'
      }
    }, "\xB7"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--text-4)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, b.guests, " pax"))), /*#__PURE__*/React.createElement("span", {
      style: {
        flexShrink: 0,
        fontSize: 10.5,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 9999,
        background: s.bg,
        color: s.text,
        backgroundImage: isPencil ? A_STRIPE : 'none'
      }
    }, s.label));
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      flexShrink: 0
    }
  }, [['home', 'Home'], ['calendar', 'Calendar', true], ['users', 'Customers'], ['menu', 'More']].map(([k, l, active]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      color: active ? 'var(--teal-700)' : 'var(--text-4)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 18,
      height: 18,
      borderRadius: 4,
      background: active ? 'var(--teal-50)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 2
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, k === 'calendar' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    y1: "2",
    x2: "16",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "2",
    x2: "8",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "10",
    x2: "21",
    y2: "10"
  })), k === 'home' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "9 22 9 12 15 12 15 22"
  })), k === 'users' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  })), k === 'menu' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "12",
    x2: "21",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "6",
    x2: "21",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "18",
    x2: "21",
    y2: "18"
  })))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9.5,
      fontWeight: active ? 700 : 500
    }
  }, l)))));
}
Object.assign(window, {
  VA_Month,
  VA_Week,
  VA_Day,
  VA_Mobile
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "calendar_redesign/variantA.jsx", error: String((e && e.message) || e) }); }

// calendar_redesign/variantB.jsx
try { (() => {
// variantB.jsx — "Hall-Coded Editorial" — bolder, hall identity prominent
// Exports: VB_Month, VB_Week, VB_Day, VB_Mobile

const {
  useState: useStateB
} = React;
const B_ICONS = {
  chevL: /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "15 18 9 12 15 6"
  })),
  chevR: /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "9 18 15 12 9 6"
  })),
  chevDn: /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "6 9 12 15 18 9"
  })),
  plus: /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "5",
    x2: "12",
    y2: "19"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "5",
    y1: "12",
    x2: "19",
    y2: "12"
  })),
  warn: /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.25",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "9",
    x2: "12",
    y2: "13"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "17",
    x2: "12.01",
    y2: "17"
  })),
  users: /*#__PURE__*/React.createElement("svg", {
    width: "10",
    height: "10",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  }))
};

/* ─── Hall chip used everywhere ──────────────────────────────── */
function VB_HallChip({
  hall,
  dense
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: dense ? '1px 5px' : '2px 7px',
      borderRadius: 9999,
      background: `${hall.color}14`,
      color: hall.color,
      fontSize: dense ? 9.5 : 10.5,
      fontWeight: 700,
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: hall.color
    }
  }), hall.name.replace(' Hall', '').replace(' Banquet', '').replace(' Room', '').replace(' Garden', ''));
}

/* ─── Toolbar (Variant B) ────────────────────────────────────── */
function VB_Toolbar({
  view,
  title,
  subtitle,
  hallSummary
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 18px',
      gap: 14,
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: 'var(--surface)',
      color: 'var(--text-3)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, B_ICONS.chevL), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: 'var(--surface)',
      color: 'var(--text-3)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, B_ICONS.chevR)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: 'var(--text-1)',
      letterSpacing: '-0.025em',
      lineHeight: 1,
      fontFamily: "'Inter', sans-serif"
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11.5,
      color: 'var(--text-4)',
      marginTop: 3,
      fontWeight: 500
    }
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden'
    }
  }, ['Month', 'Week', 'Day'].map(v => {
    const isActive = v.toLowerCase() === view;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      style: {
        padding: '6px 13px',
        border: 'none',
        background: isActive ? 'var(--text-1)' : 'var(--surface)',
        color: isActive ? 'white' : 'var(--text-3)',
        fontSize: 12,
        fontWeight: isActive ? 700 : 500,
        cursor: 'pointer',
        fontFamily: 'inherit'
      }
    }, v);
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      padding: '6px 14px',
      borderRadius: 10,
      border: 'none',
      background: 'var(--teal-600)',
      color: 'white',
      fontSize: 12.5,
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: 'inherit',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      boxShadow: '0 1px 3px rgba(13,148,136,0.25)'
    }
  }, B_ICONS.plus, "New Booking"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 18px 12px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--text-4)',
      marginRight: 4
    }
  }, "Halls"), HALLS.map(h => /*#__PURE__*/React.createElement("button", {
    key: h.id,
    style: {
      padding: '4px 10px 4px 8px',
      borderRadius: 9999,
      border: `1.5px solid ${h.color}40`,
      background: `${h.color}10`,
      color: h.color,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 11,
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: h.color
    }
  }), h.name, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      opacity: 0.7,
      fontVariantNumeric: 'tabular-nums'
    }
  }, "\xB7 ", hallSummary ? hallSummary[h.id] || 0 : 0))), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      gap: 4
    }
  }, ['Confirmed', 'Pencil', 'Quotation'].map(label => {
    const k = label.toLowerCase();
    const s = statusOf(k);
    return /*#__PURE__*/React.createElement("span", {
      key: k,
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        padding: '3px 9px',
        borderRadius: 9999,
        background: s.bg,
        color: s.text,
        ...(k === 'pencil' ? {
          backgroundImage: 'repeating-linear-gradient(135deg, transparent 0, transparent 3px, rgba(146,64,14,0.18) 3px, rgba(146,64,14,0.18) 4px)'
        } : {})
      }
    }, label);
  }))));
}

/* ─── Booking card for Variant B — denser editorial card ────── */
function VB_Card({
  booking,
  compact
}) {
  const hall = hallById(booking.hall);
  const slot = slotById(booking.slot);
  const s = statusOf(booking.status);
  const isPencil = booking.status === 'pencil';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      borderRadius: compact ? 5 : 8,
      border: isPencil ? `1.5px dashed ${s.accent}` : `1px solid ${s.accent}66`,
      borderLeft: `3px solid ${hall.color}`,
      padding: compact ? '3px 5px 3px 5px' : '5px 7px',
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? 0 : 1,
      overflow: 'hidden',
      minWidth: 0,
      cursor: 'pointer',
      position: 'relative',
      boxShadow: booking.conflict ? '0 0 0 2px #ef4444' : 'none'
    }
  }, booking.conflict && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -6,
      right: -6,
      background: '#ef4444',
      color: 'white',
      width: 14,
      height: 14,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, B_ICONS.warn), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: s.accent,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: compact ? 10 : 11,
      fontWeight: 800,
      color: 'var(--text-1)',
      lineHeight: 1.15,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      flex: 1
    }
  }, booking.function)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: compact ? 9 : 10,
      color: 'var(--text-3)',
      lineHeight: 1.1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      paddingLeft: 9
    }
  }, booking.customer, " \xB7 ", booking.type));
}

/* ─── MONTH VIEW (Variant B) ─────────────────────────────────── */
function VB_Month() {
  const year = 2026,
    month = 4;
  const days = buildMonthGrid(year, month);
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Hall counts for the month
  const hallCounts = {};
  HALLS.forEach(h => {
    hallCounts[h.id] = BOOKINGS.filter(b => b.hall === h.id && b.date.startsWith('2026-05')).length;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }
  }, /*#__PURE__*/React.createElement(VB_Toolbar, {
    view: "month",
    title: "May 2026",
    subtitle: "43 bookings \xB7 4 halls \xB7 peak Sat 23 (10 events)",
    hallSummary: hallCounts
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)'
    }
  }, dayHeaders.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: d,
    style: {
      padding: '8px 12px',
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: i === 0 || i === 6 ? '#dc2626' : 'var(--text-3)',
      borderRight: i < 6 ? '1px solid var(--border)' : 'none',
      background: 'var(--surface)'
    }
  }, d))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gridTemplateRows: 'repeat(6, 1fr)',
      background: 'var(--surface)',
      minHeight: 0
    }
  }, days.map((d, i) => {
    const inMonth = d.getMonth() === month;
    const iso = isoDate(d);
    const isToday = iso === TODAY_ISO;
    const list = bookingsForDate(iso);
    const isWk = d.getDay() === 0 || d.getDay() === 6;
    const visible = list.slice(0, 4);
    const extra = list.length - visible.length;
    // Hall composition strip
    const hallBars = HALLS.map(h => ({
      hall: h,
      count: list.filter(b => b.hall === h.id).length
    }));
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        borderRight: i % 7 < 6 ? '1px solid var(--border)' : 'none',
        borderBottom: i < 35 ? '1px solid var(--border)' : 'none',
        padding: '5px 6px 6px',
        background: !inMonth ? 'rgba(0,0,0,0.025)' : isToday ? 'rgba(20,184,166,0.06)' : 'var(--surface)',
        opacity: inMonth ? 1 : 0.6,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        minHeight: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 1,
        height: 3,
        marginBottom: 1
      }
    }, hallBars.map(({
      hall,
      count
    }) => /*#__PURE__*/React.createElement("div", {
      key: hall.id,
      style: {
        flex: 1,
        background: count > 0 ? hall.color : 'transparent',
        opacity: count > 0 ? 0.85 : 0,
        borderRadius: 1
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: isToday ? 14 : 13,
        fontWeight: 800,
        color: isWk ? '#dc2626' : 'var(--text-1)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        ...(isToday ? {
          background: 'var(--teal-600)',
          color: 'white',
          padding: '2px 7px',
          borderRadius: 9
        } : {})
      }
    }, d.getDate()), list.length > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9.5,
        color: 'var(--text-4)',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums'
      }
    }, "\xB7 ", list.length))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflow: 'hidden',
        flex: 1
      }
    }, visible.map(b => /*#__PURE__*/React.createElement(VB_Card, {
      key: b.id,
      booking: b,
      compact: true
    })), extra > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9.5,
        color: 'var(--text-4)',
        fontWeight: 700,
        marginTop: 2,
        paddingLeft: 2
      }
    }, "+ ", extra, " more")));
  })));
}

/* ─── WEEK VIEW (Variant B) — Halls × 7 days ──────────────── */
function VB_Week() {
  const weekStart = new Date(2026, 4, 17);
  const days = Array.from({
    length: 7
  }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const hallCounts = {};
  HALLS.forEach(h => {
    hallCounts[h.id] = BOOKINGS.filter(b => b.hall === h.id && b.date >= '2026-05-17' && b.date <= '2026-05-23').length;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }
  }, /*#__PURE__*/React.createElement(VB_Toolbar, {
    view: "week",
    title: "17 \u2013 23 May 2026",
    subtitle: "22 bookings \xB7 1 overbooking on Sat 23 May",
    hallSummary: hallCounts
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '170px repeat(7, 1fr)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 12px',
      fontSize: 10,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--text-4)',
      borderRight: '1px solid var(--border)'
    }
  }, "Hall"), days.map((d, i) => {
    const isToday = isoDate(d) === TODAY_ISO;
    const isWk = d.getDay() === 0 || d.getDay() === 6;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        padding: '8px 10px',
        borderRight: i < 6 ? '1px solid var(--border)' : 'none',
        background: isToday ? 'rgba(20,184,166,0.06)' : 'var(--surface)',
        textAlign: 'center',
        position: 'relative'
      }
    }, isToday && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -1,
        height: 2,
        background: 'var(--teal-500)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9.5,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: isWk ? '#dc2626' : 'var(--text-4)',
        lineHeight: 1
      }
    }, dayName(d)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        fontSize: isToday ? 18 : 16,
        fontWeight: isToday ? 800 : 700,
        color: isToday ? 'var(--teal-700)' : 'var(--text-1)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        letterSpacing: '-0.02em'
      }
    }, d.getDate()));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '170px repeat(7, 1fr)',
      gridTemplateRows: `repeat(${HALLS.length}, 1fr)`,
      background: 'var(--surface)',
      minHeight: 0
    }
  }, HALLS.map((hall, hIdx) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: hall.id
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 0 10px 14px',
      borderRight: '1px solid var(--border)',
      borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'var(--surface)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 6,
      bottom: 6,
      width: 4,
      borderRadius: '0 3px 3px 0',
      background: hall.color
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: 'var(--text-1)',
      letterSpacing: '-0.015em'
    }
  }, hall.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--text-4)',
      marginTop: 2,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: 'tabular-nums'
    }
  }, hallCounts[hall.id]), " events \xB7 cap. ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: 'tabular-nums'
    }
  }, hall.capacity)))), days.map((d, dIdx) => {
    const iso = isoDate(d);
    const isToday = iso === TODAY_ISO;
    const dayBookings = bookingsForDate(iso).filter(b => b.hall === hall.id);
    return /*#__PURE__*/React.createElement("div", {
      key: dIdx,
      style: {
        borderRight: dIdx < 6 ? '1px solid var(--border)' : 'none',
        borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
        background: isToday ? 'rgba(20,184,166,0.04)' : 'var(--surface)',
        display: 'grid',
        gridTemplateRows: 'repeat(4, 1fr)',
        padding: 3,
        gap: 2
      }
    }, SLOTS.map((slot, sIdx) => {
      const slotList = dayBookings.filter(b => b.slot === slot.id);
      const b = slotList[0];
      const conflict = slotList.length > 1;
      if (!b) return /*#__PURE__*/React.createElement("div", {
        key: slot.id,
        style: {
          borderRadius: 4,
          background: `repeating-linear-gradient(45deg, transparent 0, transparent 5px, rgba(15,23,42,0.025) 5px, rgba(15,23,42,0.025) 6px)`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 5,
          fontSize: 9,
          color: 'var(--text-4)',
          opacity: 0.7,
          fontWeight: 600
        }
      }, slot.shortLabel);
      return /*#__PURE__*/React.createElement(VB_Card, {
        key: slot.id,
        booking: {
          ...b,
          conflict
        },
        compact: true
      });
    }));
  })))));
}

/* ─── DAY VIEW (Variant B) — Halls × hour columns ─────────── */
function VB_Day() {
  const hours = Array.from({
    length: 15
  }, (_, i) => i + 9);
  const dayBookings = bookingsForDate(TODAY_ISO);
  const COL_WIDTH = 75;
  const HALL_COL_WIDTH = 180;
  const ROW_HEIGHT = 116;
  const hallCounts = {};
  HALLS.forEach(h => {
    hallCounts[h.id] = dayBookings.filter(b => b.hall === h.id).length;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }
  }, /*#__PURE__*/React.createElement(VB_Toolbar, {
    view: "day",
    title: `Thursday, 21 May 2026`,
    subtitle: `${dayBookings.length} bookings today · current time 14:32`,
    hallSummary: hallCounts
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      background: 'var(--surface)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `${HALL_COL_WIDTH}px 1fr`,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      padding: '10px 14px',
      fontSize: 10,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--text-4)',
      position: 'sticky',
      left: 0,
      zIndex: 3
    }
  }, "Hall"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${hours.length}, ${COL_WIDTH}px)`,
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)'
    }
  }, hours.map(h => {
    const slot = SLOTS.find(s => h >= s.startH && h < s.endH);
    const isSlotStart = SLOTS.some(s => s.startH === h);
    return /*#__PURE__*/React.createElement("div", {
      key: h,
      style: {
        padding: '6px 9px',
        borderRight: isSlotStart ? '2px solid var(--border)' : '1px solid var(--border)',
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: 'var(--text-1)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
        lineHeight: 1
      }
    }, h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        marginTop: 2,
        color: slot ? hallById('crystal').color : 'var(--text-4)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        visibility: isSlotStart ? 'visible' : 'hidden'
      }
    }, slot ? slot.label : ''));
  })), HALLS.map((hall, hIdx) => {
    const hallBookings = dayBookings.filter(b => b.hall === hall.id);
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: hall.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 0,
        borderRight: '1px solid var(--border)',
        borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
        background: 'var(--surface)',
        position: 'sticky',
        left: 0,
        zIndex: 3,
        display: 'flex',
        alignItems: 'stretch',
        height: ROW_HEIGHT
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 6,
        background: hall.color,
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: 'var(--text-1)',
        letterSpacing: '-0.02em',
        lineHeight: 1.1
      }
    }, hall.name), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 10.5,
        color: 'var(--text-4)',
        fontWeight: 600
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3
      }
    }, B_ICONS.users, /*#__PURE__*/React.createElement("span", {
      style: {
        fontVariantNumeric: 'tabular-nums'
      }
    }, hall.capacity)), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-4)'
      }
    }, "\xB7"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontVariantNumeric: 'tabular-nums'
      }
    }, hallBookings.length, " today")))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        borderBottom: hIdx < HALLS.length - 1 ? '1px solid var(--border)' : 'none',
        height: ROW_HEIGHT,
        background: `${hall.tint}80`,
        backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px)`,
        backgroundSize: `${COL_WIDTH}px 100%`
      }
    }, SLOTS.slice(1).map(slot => /*#__PURE__*/React.createElement("div", {
      key: slot.id,
      style: {
        position: 'absolute',
        left: (slot.startH - 9) * COL_WIDTH,
        top: 0,
        bottom: 0,
        width: 2,
        background: 'var(--border-2)',
        opacity: 0.7
      }
    })), hallBookings.map(b => {
      const slot = slotById(b.slot);
      const left = (slot.startH - 9) * COL_WIDTH + 4;
      const width = (slot.endH - slot.startH) * COL_WIDTH - 8;
      const s = statusOf(b.status);
      const isPencil = b.status === 'pencil';
      return /*#__PURE__*/React.createElement("div", {
        key: b.id,
        style: {
          position: 'absolute',
          left,
          width,
          top: 8,
          bottom: 8,
          background: 'var(--surface)',
          borderRadius: 10,
          border: isPencil ? `2px dashed ${s.accent}` : `1px solid ${s.accent}80`,
          boxShadow: '0 2px 6px rgba(15,23,42,0.06)',
          padding: '8px 11px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          overflow: 'hidden',
          borderLeft: `4px solid ${hall.color}`
        }
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginBottom: 2
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: s.accent,
          flexShrink: 0
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12.5,
          fontWeight: 800,
          color: 'var(--text-1)',
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1
        }
      }, b.function)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10.5,
          color: 'var(--text-3)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: 2
        }
      }, b.customer, " \xB7 ", b.type)), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9.5,
          fontWeight: 700,
          padding: '1px 7px',
          borderRadius: 9999,
          background: s.bg,
          color: s.text
        }
      }, s.label.toUpperCase()), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-3)',
          fontVariantNumeric: 'tabular-nums'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3
        }
      }, B_ICONS.users, b.guests))));
    }), hIdx === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: (14.5 - 9) * COL_WIDTH,
        top: 0,
        height: ROW_HEIGHT * HALLS.length + (HALLS.length - 1),
        width: 2,
        background: 'var(--teal-600)',
        zIndex: 4,
        boxShadow: '0 0 8px rgba(13,148,136,0.4)',
        pointerEvents: 'none'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: -8,
        left: -5,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: 'var(--teal-600)',
        border: '2px solid white'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: -22,
        left: -16,
        fontSize: 9.5,
        fontWeight: 800,
        color: 'white',
        background: 'var(--teal-600)',
        padding: '2px 7px',
        borderRadius: 9999,
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 4px rgba(13,148,136,0.3)'
      }
    }, "NOW \xB7 14:32"))));
  }))));
}

/* ─── MOBILE (Variant B) — Today as hall-grouped cards ───── */
function VB_Mobile() {
  const dayBookings = bookingsForDate(TODAY_ISO);
  const stripDays = Array.from({
    length: 7
  }, (_, i) => new Date(2026, 4, 18 + i));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: '#f7f8fb',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 28,
      background: 'var(--surface)',
      padding: '0 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-1)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'center',
      fontSize: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u25CF\u25CF\u25CF\u25CF"), /*#__PURE__*/React.createElement("span", null, "5G"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 22,
      height: 10,
      border: '1px solid var(--text-1)',
      borderRadius: 2,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 1,
      top: 1,
      bottom: 1,
      width: 16,
      background: 'var(--text-1)',
      borderRadius: 1
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px 12px',
      background: 'var(--surface)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11.5,
      fontWeight: 800,
      color: 'var(--teal-600)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em'
    }
  }, "Today \xB7 Calendar"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 28,
      fontWeight: 800,
      color: 'var(--text-1)',
      letterSpacing: '-0.025em',
      lineHeight: 1.05,
      marginTop: 4
    }
  }, "Thu, 21 May"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: 'var(--text-3)',
      marginTop: 4,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: 'var(--text-1)'
    }
  }, dayBookings.length, " events"), " across ", new Set(dayBookings.map(b => b.hall)).size, " halls")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      padding: '0 14px 12px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      overflowX: 'auto'
    }
  }, stripDays.map((d, i) => {
    const iso = isoDate(d);
    const isToday = iso === TODAY_ISO;
    const count = bookingsForDate(iso).length;
    // tiny hall dots
    const hallSet = new Set(bookingsForDate(iso).map(b => b.hall));
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      style: {
        flex: '0 0 48px',
        padding: '8px 4px 6px',
        borderRadius: 14,
        border: isToday ? '2px solid var(--teal-600)' : '1px solid transparent',
        background: isToday ? 'var(--teal-50)' : 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: isToday ? 'var(--teal-700)' : 'var(--text-4)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em'
      }
    }, dayName(d)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: isToday ? 'var(--teal-700)' : 'var(--text-1)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        letterSpacing: '-0.02em'
      }
    }, d.getDate()), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 2,
        marginTop: 1
      }
    }, HALLS.map(h => /*#__PURE__*/React.createElement("span", {
      key: h.id,
      style: {
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: hallSet.has(h.id) ? h.color : 'var(--surface-3)',
        opacity: hallSet.has(h.id) ? 1 : 0.4
      }
    }))));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px 8px',
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)'
    }
  }, HALLS.map(h => {
    const count = dayBookings.filter(b => b.hall === h.id).length;
    return /*#__PURE__*/React.createElement("div", {
      key: h.id,
      style: {
        flex: '0 0 auto',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 11px 6px 9px',
        borderRadius: 9999,
        background: `${h.color}14`,
        border: `1px solid ${h.color}40`
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: h.color
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: h.color
      }
    }, h.name.replace(' Hall', '').replace(' Banquet', '').replace(' Room', '').replace(' Garden', '')), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 800,
        color: h.color,
        background: 'white',
        padding: '1px 5px',
        borderRadius: 9999,
        fontVariantNumeric: 'tabular-nums'
      }
    }, count));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '12px 14px 90px'
    }
  }, SLOTS.map(slot => {
    const list = dayBookings.filter(b => b.slot === slot.id);
    if (list.length === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: slot.id,
      style: {
        marginBottom: 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 10,
        fontWeight: 800,
        color: 'var(--text-4)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }
    }, slot.label), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 17,
        fontWeight: 800,
        color: 'var(--text-1)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        marginTop: 2
      }
    }, slot.startLabel, " \u2192 ", slot.endLabel)), /*#__PURE__*/React.createElement("span", {
      style: {
        marginBottom: 1,
        fontSize: 11.5,
        fontWeight: 700,
        color: 'var(--text-3)'
      }
    }, list.length, " event", list.length > 1 ? 's' : '')), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }
    }, list.map(b => {
      const hall = hallById(b.hall);
      const s = statusOf(b.status);
      const isPencil = b.status === 'pencil';
      return /*#__PURE__*/React.createElement("div", {
        key: b.id,
        style: {
          background: 'var(--surface)',
          borderRadius: 14,
          border: isPencil ? `2px dashed ${s.accent}` : '1px solid var(--border)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          background: hall.color
        }
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          paddingLeft: 4
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("p", {
        style: {
          fontSize: 14.5,
          fontWeight: 800,
          color: 'var(--text-1)',
          letterSpacing: '-0.015em',
          lineHeight: 1.2
        }
      }, b.function), /*#__PURE__*/React.createElement("p", {
        style: {
          fontSize: 12,
          color: 'var(--text-3)',
          marginTop: 2,
          fontWeight: 500
        }
      }, b.customer)), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          fontWeight: 800,
          padding: '3px 9px',
          borderRadius: 9999,
          background: s.bg,
          color: s.text,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          flexShrink: 0
        }
      }, s.label)), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingLeft: 4
        }
      }, /*#__PURE__*/React.createElement(VB_HallChip, {
        hall: hall
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-4)'
        }
      }, b.type), /*#__PURE__*/React.createElement("span", {
        style: {
          marginLeft: 'auto',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-2)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontVariantNumeric: 'tabular-nums'
        }
      }, B_ICONS.users, b.guests)));
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 60,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      flexShrink: 0,
      position: 'relative'
    }
  }, [['home', 'Home'], ['calendar', 'Calendar', true], ['users', 'Customers'], ['menu', 'More']].map(([k, l, active]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      color: active ? 'var(--teal-700)' : 'var(--text-4)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, k === 'calendar' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    y1: "2",
    x2: "16",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "2",
    x2: "8",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "10",
    x2: "21",
    y2: "10"
  })), k === 'home' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "9 22 9 12 15 12 15 22"
  })), k === 'users' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  })), k === 'menu' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "12",
    x2: "21",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "6",
    x2: "21",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "18",
    x2: "21",
    y2: "18"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: active ? 800 : 600
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -16,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 48,
      height: 48,
      borderRadius: 16,
      background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 6px 14px rgba(13,148,136,0.4)',
      color: 'white'
    }
  }, B_ICONS.plus)));
}
Object.assign(window, {
  VB_Month,
  VB_Week,
  VB_Day,
  VB_Mobile
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "calendar_redesign/variantB.jsx", error: String((e && e.message) || e) }); }

// design-canvas.jsx
try { (() => {
/* BEGIN USAGE */
// DesignCanvas.jsx — Figma-ish design canvas wrapper
// Warm gray grid bg + Sections + Artboards + PostIt notes.
// Exports (to window): DesignCanvas, DCSection, DCArtboard, DCPostIt.
// Artboards are reorderable (grip-drag), deletable, labels/titles are
// inline-editable, and any artboard can be opened in a fullscreen focus
// overlay (←/→/Esc). State persists to a .design-canvas.state.json sidecar
// via the host bridge. No assets, no deps.
//
// Usage:
//   <DesignCanvas>
//     <DCSection id="onboarding" title="Onboarding" subtitle="First-run variants">
//       <DCArtboard id="a" label="A · Dusk" width={260} height={480}>…</DCArtboard>
//       <DCArtboard id="b" label="B · Minimal" width={260} height={480}>…</DCArtboard>
//     </DCSection>
//   </DesignCanvas>
//
// Artboards are static design frames, not scroll regions — never use
// height: 100% + overflow: auto/scroll on inner elements; size each artboard
// to fit its content (explicit pixel height, or let it grow).
/* END USAGE */

const DC = {
  bg: '#f0eee9',
  grid: 'rgba(0,0,0,0.06)',
  label: 'rgba(60,50,40,0.7)',
  title: 'rgba(40,30,20,0.85)',
  subtitle: 'rgba(60,50,40,0.6)',
  postitBg: '#fef4a8',
  postitText: '#5a4a2a',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
};

// One-time CSS injection (classes are dc-prefixed so they don't collide with
// the hosted design's own styles).
if (typeof document !== 'undefined' && !document.getElementById('dc-styles')) {
  const s = document.createElement('style');
  s.id = 'dc-styles';
  s.textContent = ['.dc-editable{cursor:text;outline:none;white-space:nowrap;border-radius:3px;padding:0 2px;margin:0 -2px}', '.dc-editable:focus{background:#fff;box-shadow:0 0 0 1.5px #c96442}', '[data-dc-slot]{transition:transform .18s cubic-bezier(.2,.7,.3,1)}', '[data-dc-slot].dc-dragging{transition:none;z-index:10;pointer-events:none}', '[data-dc-slot].dc-dragging .dc-card{box-shadow:0 12px 40px rgba(0,0,0,.25),0 0 0 2px #c96442;transform:scale(1.02)}',
  // isolation:isolate contains artboard content's z-indexes so a
  // z-indexed child (sticky navbar etc.) can't paint over .dc-header or
  // the .dc-menu popover that drops into the top of the card.
  '.dc-card{isolation:isolate;transition:box-shadow .15s,transform .15s}', '.dc-card *{scrollbar-width:none}', '.dc-card *::-webkit-scrollbar{display:none}',
  // Per-artboard header: grip + label on the left, delete/expand on the
  // right. Single flex row; when the artboard's on-screen width is too
  // narrow for both the label yields (ellipsis, then hidden entirely below
  // ~4ch via the container query) and the buttons stay on the row.
  '.dc-header{position:absolute;bottom:100%;left:-4px;margin-bottom:calc(4px * var(--dc-inv-zoom,1));z-index:2;', '  display:flex;align-items:center;container-type:inline-size}', '.dc-labelrow{display:flex;align-items:center;gap:4px;height:24px;flex:1 1 auto;min-width:0}', '.dc-grip{flex:0 0 auto;cursor:grab;display:flex;align-items:center;padding:5px 4px;border-radius:4px;transition:background .12s,opacity .12s}', '.dc-grip:hover{background:rgba(0,0,0,.08)}', '.dc-grip:active{cursor:grabbing}', '.dc-labeltext{flex:1 1 auto;min-width:0;cursor:pointer;border-radius:4px;padding:3px 6px;', '  display:flex;align-items:center;transition:background .12s;overflow:hidden}',
  // Below ~4ch of label room: hide the label entirely, and drop the grip to
  // hover-only (same reveal rule as .dc-btns) so a narrow header is clean
  // until the card is moused.
  '@container (max-width: 110px){', '  .dc-labeltext{display:none}', '  .dc-grip{opacity:0}', '  [data-dc-slot]:hover .dc-grip{opacity:1}', '}', '.dc-labeltext:hover{background:rgba(0,0,0,.05)}', '.dc-labeltext .dc-editable{overflow:hidden;text-overflow:ellipsis;max-width:100%}', '.dc-labeltext .dc-editable:focus{overflow:visible;text-overflow:clip}', '.dc-btns{flex:0 0 auto;margin-left:auto;display:flex;gap:2px;opacity:0;transition:opacity .12s}', '[data-dc-slot]:hover .dc-btns,.dc-btns:has(.dc-menu){opacity:1}', '.dc-expand,.dc-kebab{width:22px;height:22px;border-radius:5px;border:none;cursor:pointer;padding:0;', '  background:transparent;color:rgba(60,50,40,.7);display:flex;align-items:center;justify-content:center;', '  font:inherit;transition:background .12s,color .12s}', '.dc-expand:hover,.dc-kebab:hover{background:rgba(0,0,0,.06);color:#2a251f}',
  // Slot hosting an open menu floats above later siblings (which otherwise
  // paint on top — same z-index:auto, later DOM order) so the popup isn't
  // clipped by the next card.
  '[data-dc-slot]:has(.dc-menu){z-index:10}', '.dc-menu{position:absolute;top:100%;right:0;margin-top:4px;background:#fff;border-radius:8px;', '  box-shadow:0 8px 28px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.05);padding:4px;min-width:160px;z-index:10}', '.dc-menu button{display:block;width:100%;padding:7px 10px;border:0;background:transparent;', '  border-radius:5px;font-family:inherit;font-size:13px;font-weight:500;line-height:1.2;', '  color:#29261b;cursor:pointer;text-align:left;transition:background .12s;white-space:nowrap}', '.dc-menu button:hover{background:rgba(0,0,0,.05)}', '.dc-menu hr{border:0;border-top:1px solid rgba(0,0,0,.08);margin:4px 2px}', '.dc-menu .dc-danger{color:#c96442}', '.dc-menu .dc-danger:hover{background:rgba(201,100,66,.1)}',
  // Chrome (titles / labels / buttons) counter-scales against the viewport
  // zoom so it stays a constant on-screen size. --dc-inv-zoom is set by
  // DCViewport on every transform update and inherits to all descendants —
  // any overlay inside the world (e.g. a TweaksPanel on an artboard) can use
  // it the same way.
  //
  // The header uses transform:scale (out-of-flow, so layout impact doesn't
  // matter) with its world-space width set to card-width / inv-zoom so that
  // after counter-scaling its on-screen width exactly matches the card's —
  // that's what lets the container query + text-overflow behave against the
  // card's visible edge at every zoom level.
  //
  // The section head uses CSS zoom instead of transform so its layout box
  // grows with the counter-scale, pushing the card row down — otherwise the
  // constant-screen-size title would overflow into the (shrinking) world-
  // space gap and overlap the artboard headers at low zoom.
  '.dc-header{width:calc((100% + 4px) / var(--dc-inv-zoom,1));', '  transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom left}', '.dc-sectionhead{zoom:var(--dc-inv-zoom,1)}'].join('\n');
  document.head.appendChild(s);
}
const DCCtx = React.createContext(null);

// Recursively unwrap React.Fragment so <>…</> grouping doesn't hide
// DCSection/DCArtboard children from the type-based walks below.
function dcFlatten(children) {
  const out = [];
  React.Children.forEach(children, c => {
    if (c && c.type === React.Fragment) out.push(...dcFlatten(c.props.children));else out.push(c);
  });
  return out;
}

// ─────────────────────────────────────────────────────────────
// DesignCanvas — stateful wrapper around the pan/zoom viewport.
// Owns runtime state (per-section order, renamed titles/labels, hidden
// artboards, focused artboard). Order/titles/labels/hidden persist to a
// .design-canvas.state.json
// sidecar next to the HTML. Reads go via plain fetch() so the saved
// arrangement is visible anywhere the HTML + sidecar are served together
// (omelette preview, direct link, downloaded zip). Writes go through the
// host's window.omelette bridge — editing requires the omelette runtime.
// Focus is ephemeral.
// ─────────────────────────────────────────────────────────────
const DC_STATE_FILE = '.design-canvas.state.json';
function DesignCanvas({
  children,
  minScale,
  maxScale,
  style
}) {
  const [state, setState] = React.useState({
    sections: {},
    focus: null
  });
  // Hold rendering until the sidecar read settles so the saved order/titles
  // appear on first paint (no source-order flash). didRead gates writes until
  // the read settles so the empty initial state can't clobber a slow read;
  // skipNextWrite suppresses the one echo-write that would otherwise follow
  // hydration.
  const [ready, setReady] = React.useState(false);
  const didRead = React.useRef(false);
  const skipNextWrite = React.useRef(false);
  React.useEffect(() => {
    let off = false;
    fetch('./' + DC_STATE_FILE).then(r => r.ok ? r.json() : null).then(saved => {
      if (off || !saved || !saved.sections) return;
      skipNextWrite.current = true;
      setState(s => ({
        ...s,
        sections: saved.sections
      }));
    }).catch(() => {}).finally(() => {
      didRead.current = true;
      if (!off) setReady(true);
    });
    const t = setTimeout(() => {
      if (!off) setReady(true);
    }, 150);
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, []);
  React.useEffect(() => {
    if (!didRead.current) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    const t = setTimeout(() => {
      window.omelette?.writeFile(DC_STATE_FILE, JSON.stringify({
        sections: state.sections
      })).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [state.sections]);

  // Build registries synchronously from children so FocusOverlay can read
  // them in the same render. Fragments are flattened; wrapping in other
  // elements still opts out of focus/reorder.
  const registry = {}; // slotId -> { sectionId, artboard }
  const sectionMeta = {}; // sectionId -> { title, subtitle, slotIds[] }
  const sectionOrder = [];
  dcFlatten(children).forEach(sec => {
    if (!sec || sec.type !== DCSection) return;
    const sid = sec.props.id ?? sec.props.title;
    if (!sid) return;
    sectionOrder.push(sid);
    const persisted = state.sections[sid] || {};
    const abs = [];
    dcFlatten(sec.props.children).forEach(ab => {
      if (!ab || ab.type !== DCArtboard) return;
      const aid = ab.props.id ?? ab.props.label;
      if (aid) abs.push([aid, ab]);
    });
    // hidden is scoped to one source revision — when the agent regenerates
    // (artboard-ID set changes), prior deletes don't apply to new content.
    const srcKey = abs.map(([k]) => k).join('\x1f');
    const hidden = persisted.srcKey === srcKey ? persisted.hidden || [] : [];
    const srcIds = [];
    abs.forEach(([aid, ab]) => {
      if (hidden.includes(aid)) return;
      registry[`${sid}/${aid}`] = {
        sectionId: sid,
        artboard: ab
      };
      srcIds.push(aid);
    });
    const kept = (persisted.order || []).filter(k => srcIds.includes(k));
    sectionMeta[sid] = {
      title: persisted.title ?? sec.props.title,
      subtitle: sec.props.subtitle,
      slotIds: [...kept, ...srcIds.filter(k => !kept.includes(k))]
    };
  });
  const api = React.useMemo(() => ({
    state,
    section: id => state.sections[id] || {},
    patchSection: (id, p) => setState(s => ({
      ...s,
      sections: {
        ...s.sections,
        [id]: {
          ...s.sections[id],
          ...(typeof p === 'function' ? p(s.sections[id] || {}) : p)
        }
      }
    })),
    setFocus: slotId => setState(s => ({
      ...s,
      focus: slotId
    }))
  }), [state]);

  // Esc exits focus; any outside pointerdown commits an in-progress rename.
  React.useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') api.setFocus(null);
    };
    const onPd = e => {
      const ae = document.activeElement;
      if (ae && ae.isContentEditable && !ae.contains(e.target)) ae.blur();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPd, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPd, true);
    };
  }, [api]);
  return /*#__PURE__*/React.createElement(DCCtx.Provider, {
    value: api
  }, /*#__PURE__*/React.createElement(DCViewport, {
    minScale: minScale,
    maxScale: maxScale,
    style: style
  }, ready && children), state.focus && registry[state.focus] && /*#__PURE__*/React.createElement(DCFocusOverlay, {
    entry: registry[state.focus],
    sectionMeta: sectionMeta,
    sectionOrder: sectionOrder
  }));
}

// ─────────────────────────────────────────────────────────────
// DCViewport — transform-based pan/zoom (internal)
//
// Input mapping (Figma-style):
//   • trackpad pinch  → zoom   (ctrlKey wheel; Safari gesture* events)
//   • trackpad scroll → pan    (two-finger)
//   • mouse wheel     → zoom   (notched; distinguished from trackpad scroll)
//   • middle-drag / primary-drag-on-bg → pan
//
// Transform state lives in a ref and is written straight to the DOM
// (translate3d + will-change) so wheel ticks don't go through React —
// keeps pans at 60fps on dense canvases.
// ─────────────────────────────────────────────────────────────
function DCViewport({
  children,
  minScale = 0.1,
  maxScale = 8,
  style = {}
}) {
  const vpRef = React.useRef(null);
  const worldRef = React.useRef(null);
  const tf = React.useRef({
    x: 0,
    y: 0,
    scale: 1
  });
  // Persist viewport across reloads so the user lands back where they were
  // after an agent edit or browser refresh. The sandbox origin is already
  // per-project; pathname keeps multiple canvas files in one project apart.
  const tfKey = 'dc-viewport:' + location.pathname;
  const saveT = React.useRef(0);
  const lastPostedScale = React.useRef();
  const apply = React.useCallback(() => {
    const {
      x,
      y,
      scale
    } = tf.current;
    const el = worldRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    // Exposed for zoom-invariant chrome (labels, buttons, TweaksPanel).
    el.style.setProperty('--dc-inv-zoom', String(1 / scale));
    // Keep the host toolbar's % readout in sync with the canvas scale. Pan
    // ticks leave scale unchanged — skip the cross-frame post for those.
    if (lastPostedScale.current !== scale) {
      lastPostedScale.current = scale;
      window.parent.postMessage({
        type: '__dc_zoom',
        scale
      }, '*');
    }
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      try {
        localStorage.setItem(tfKey, JSON.stringify(tf.current));
      } catch {}
    }, 200);
  }, [tfKey]);
  React.useLayoutEffect(() => {
    const flush = () => {
      clearTimeout(saveT.current);
      try {
        localStorage.setItem(tfKey, JSON.stringify(tf.current));
      } catch {}
    };
    try {
      const s = JSON.parse(localStorage.getItem(tfKey) || 'null');
      if (s && Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.scale)) {
        tf.current = {
          x: s.x,
          y: s.y,
          scale: Math.min(maxScale, Math.max(minScale, s.scale))
        };
        apply();
      }
    } catch {}
    // Flush on pagehide and unmount so a reload within the 200ms debounce
    // window doesn't drop the last pan/zoom.
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);
  React.useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const zoomAt = (cx, cy, factor) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left,
        py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const k = next / t.scale;
      // --dc-inv-zoom consumers (.dc-sectionhead's CSS zoom, each section's
      // marginBottom) reflow on every scale change, vertically shifting the
      // world layout — so a world point mathematically pinned under the cursor
      // drifts as you zoom (content creeps up on zoom-in, down on zoom-out).
      // Anchor the DOM element under the cursor instead: record its screen Y,
      // apply the transform + --dc-inv-zoom, then cancel whatever vertical
      // drift the reflow introduced so it stays put on screen.
      let marker = null,
        markerY0 = 0;
      if (k !== 1) {
        const hit = document.elementFromPoint(cx, cy);
        marker = hit && hit.closest ? hit.closest('[data-dc-slot],[data-dc-section]') : null;
        if (marker) markerY0 = marker.getBoundingClientRect().top;
      }
      // keep the world point under the cursor fixed
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
      if (marker) {
        // A pure zoom around (cx, cy) maps screen Y → cy + (Y - cy) * k. Any
        // departure after the --dc-inv-zoom reflow is the layout drift.
        const drift = marker.getBoundingClientRect().top - (cy + (markerY0 - cy) * k);
        if (Math.abs(drift) > 0.1) {
          t.y -= drift;
          apply();
        }
      }
    };

    // Mouse-wheel vs trackpad-scroll heuristic. A physical wheel sends
    // line-mode deltas (Firefox) or large integer pixel deltas with no X
    // component (Chrome/Safari, typically multiples of 100/120). Trackpad
    // two-finger scroll sends small/fractional pixel deltas, often with
    // non-zero deltaX. ctrlKey is set by the browser for trackpad pinch.
    const isMouseWheel = e => e.deltaMode !== 0 || e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40;
    const onWheel = e => {
      e.preventDefault();
      if (isGesturing) return; // Safari: gesture* owns the pinch — discard concurrent wheels
      if ((e.ctrlKey || e.metaKey) && !isMouseWheel(e)) {
        // trackpad pinch, or ctrl/cmd + smooth-scroll mouse. Notched
        // wheels fall through to the fixed-step branch below.
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else if (isMouseWheel(e)) {
        // notched mouse wheel — fixed-ratio step per click
        zoomAt(e.clientX, e.clientY, Math.exp(-Math.sign(e.deltaY) * 0.18));
      } else {
        // trackpad two-finger scroll — pan
        tf.current.x -= e.deltaX;
        tf.current.y -= e.deltaY;
        apply();
      }
    };

    // Safari sends native gesture* events for trackpad pinch with a smooth
    // e.scale; preferring these over the ctrl+wheel fallback gives a much
    // better feel there. No-ops on other browsers. Safari also fires
    // ctrlKey wheel events during the same pinch — isGesturing makes
    // onWheel drop those entirely so they neither zoom nor pan.
    let gsBase = 1;
    let isGesturing = false;
    const onGestureStart = e => {
      e.preventDefault();
      isGesturing = true;
      gsBase = tf.current.scale;
    };
    const onGestureChange = e => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, gsBase * e.scale / tf.current.scale);
    };
    const onGestureEnd = e => {
      e.preventDefault();
      isGesturing = false;
    };

    // Drag-pan: middle button anywhere, or primary button on canvas
    // background (anything that isn't an artboard or an inline editor).
    let drag = null;
    const onPointerDown = e => {
      const onBg = !e.target.closest('[data-dc-slot], .dc-editable');
      if (!(e.button === 1 || e.button === 0 && onBg)) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = {
        id: e.pointerId,
        lx: e.clientX,
        ly: e.clientY
      };
      vp.style.cursor = 'grabbing';
    };
    const onPointerMove = e => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      apply();
    };
    const onPointerUp = e => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };

    // Host-driven zoom (toolbar % menu). Zooms around viewport centre so the
    // visible midpoint stays fixed — matching the host's iframe-zoom feel.
    const onHostMsg = e => {
      const d = e.data;
      if (d && d.type === '__dc_set_zoom' && typeof d.scale === 'number') {
        const r = vp.getBoundingClientRect();
        zoomAt(r.left + r.width / 2, r.top + r.height / 2, d.scale / tf.current.scale);
      } else if (d && d.type === '__dc_probe') {
        // Host's [readyGen] reset asks whether a canvas is present; it
        // fires on the iframe's native 'load', which for canvases with
        // images/fonts is after our mount-time announce, so re-announce.
        // Clear the pan-tick guard so apply() re-posts the current scale
        // even if it's unchanged — the host just reset dcScale to 1.
        window.parent.postMessage({
          type: '__dc_present'
        }, '*');
        lastPostedScale.current = undefined;
        apply();
      }
    };
    window.addEventListener('message', onHostMsg);
    // Announce canvas mode so the host toolbar proxies its % control here
    // instead of scaling the iframe element (which would just shrink the
    // viewport window of an infinite canvas). The apply() that follows emits
    // the initial __dc_zoom so the toolbar % is correct before first pinch.
    // lastPostedScale reset mirrors the __dc_probe handler: the layout
    // effect's restore-path apply() may already have posted the restored
    // scale (before __dc_present), so clear the guard to re-post it in order.
    window.parent.postMessage({
      type: '__dc_present'
    }, '*');
    lastPostedScale.current = undefined;
    apply();
    vp.addEventListener('wheel', onWheel, {
      passive: false
    });
    vp.addEventListener('gesturestart', onGestureStart, {
      passive: false
    });
    vp.addEventListener('gesturechange', onGestureChange, {
      passive: false
    });
    vp.addEventListener('gestureend', onGestureEnd, {
      passive: false
    });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('message', onHostMsg);
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('gesturestart', onGestureStart);
      vp.removeEventListener('gesturechange', onGestureChange);
      vp.removeEventListener('gestureend', onGestureEnd);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [apply, minScale, maxScale]);
  const gridSvg = `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='${encodeURIComponent(DC.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;
  return /*#__PURE__*/React.createElement("div", {
    ref: vpRef,
    className: "design-canvas",
    style: {
      height: '100vh',
      width: '100vw',
      background: DC.bg,
      overflow: 'hidden',
      overscrollBehavior: 'none',
      touchAction: 'none',
      position: 'relative',
      fontFamily: DC.font,
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: worldRef,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      transformOrigin: '0 0',
      willChange: 'transform',
      width: 'max-content',
      minWidth: '100%',
      minHeight: '100%',
      padding: '60px 0 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: -6000,
      backgroundImage: gridSvg,
      backgroundSize: '120px 120px',
      pointerEvents: 'none',
      zIndex: -1
    }
  }), children));
}

// ─────────────────────────────────────────────────────────────
// DCSection — editable title + h-row of artboards in persisted order
// ─────────────────────────────────────────────────────────────
function DCSection({
  id,
  title,
  subtitle,
  children,
  gap = 48
}) {
  const ctx = React.useContext(DCCtx);
  const sid = id ?? title;
  const all = React.Children.toArray(dcFlatten(children));
  const artboards = all.filter(c => c && c.type === DCArtboard);
  const rest = all.filter(c => !(c && c.type === DCArtboard));
  const sec = ctx && sid && ctx.section(sid) || {};
  // Must match DesignCanvas's srcKey computation exactly (it filters falsy
  // IDs), or onDelete persists a srcKey that DesignCanvas never recognizes.
  const allIds = artboards.map(a => a.props.id ?? a.props.label).filter(Boolean);
  const srcKey = allIds.join('\x1f');
  const hidden = sec.srcKey === srcKey ? sec.hidden || [] : [];
  const srcOrder = allIds.filter(k => !hidden.includes(k));
  const order = React.useMemo(() => {
    const kept = (sec.order || []).filter(k => srcOrder.includes(k));
    return [...kept, ...srcOrder.filter(k => !kept.includes(k))];
  }, [sec.order, srcOrder.join('|')]);
  const byId = Object.fromEntries(artboards.map(a => [a.props.id ?? a.props.label, a]));

  // marginBottom counter-scales so the on-screen gap between sections stays
  // constant — otherwise at low zoom the (world-space) gap collapses while
  // the screen-constant sectionhead below it doesn't, and the title reads as
  // belonging to the section above. paddingBottom below is just enough for
  // the 24px artboard-header (abs-positioned above each card) plus ~8px, so
  // the title sits tight against its own row at every zoom.
  return /*#__PURE__*/React.createElement("div", {
    "data-dc-section": sid,
    style: {
      marginBottom: 'calc(80px * var(--dc-inv-zoom, 1))',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 60px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-sectionhead",
    style: {
      paddingBottom: 36
    }
  }, /*#__PURE__*/React.createElement(DCEditable, {
    tag: "div",
    value: sec.title ?? title,
    onChange: v => ctx && sid && ctx.patchSection(sid, {
      title: v
    }),
    style: {
      fontSize: 28,
      fontWeight: 600,
      color: DC.title,
      letterSpacing: -0.4,
      marginBottom: 6,
      display: 'inline-block'
    }
  }), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: DC.subtitle
    }
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap,
      padding: '0 60px',
      alignItems: 'flex-start',
      width: 'max-content'
    }
  }, order.map(k => /*#__PURE__*/React.createElement(DCArtboardFrame, {
    key: k,
    sectionId: sid,
    artboard: byId[k],
    order: order,
    label: (sec.labels || {})[k] ?? byId[k].props.label,
    onRename: v => ctx && ctx.patchSection(sid, x => ({
      labels: {
        ...x.labels,
        [k]: v
      }
    })),
    onReorder: next => ctx && ctx.patchSection(sid, {
      order: next
    }),
    onDelete: () => ctx && ctx.patchSection(sid, x => ({
      hidden: [...(x.srcKey === srcKey ? x.hidden || [] : []), k],
      srcKey
    })),
    onFocus: () => ctx && ctx.setFocus(`${sid}/${k}`)
  }))), rest);
}

// DCArtboard — marker; rendered by DCArtboardFrame via DCSection.
function DCArtboard() {
  return null;
}

// Per-artboard export (kind: 'png' | 'html'). Both paths share the same
// self-contained clone: computed styles baked in, @font-face / <img> /
// inline-style background-image urls inlined as data URIs. PNG wraps the
// clone in foreignObject→canvas at 3× the artboard's natural width×height
// (same pipeline the host uses for page captures); HTML wraps it in a
// minimal standalone document. Both are independent of viewport zoom.
async function dcExport(node, w, h, name, kind) {
  try {
    await document.fonts.ready;
  } catch {}
  const toDataURL = url => fetch(url).then(r => r.blob()).then(b => new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => res(url);
    fr.readAsDataURL(b);
  })).catch(() => url);

  // Collect @font-face rules. ss.cssRules throws SecurityError on
  // cross-origin sheets (e.g. fonts.googleapis.com) — in that case fetch
  // the CSS text directly (those endpoints send ACAO:*) and regex-extract
  // the blocks. @import and @media/@supports are walked so nested
  // @font-face rules aren't missed.
  const fontRules = [],
    pending = [],
    seen = new Set();
  const scrapeCss = href => {
    if (seen.has(href)) return;
    seen.add(href);
    pending.push(fetch(href).then(r => r.text()).then(css => {
      for (const m of css.match(/@font-face\s*{[^}]*}/g) || []) fontRules.push({
        css: m,
        base: href
      });
      for (const m of css.matchAll(/@import\s+(?:url\()?['"]?([^'")\s;]+)/g)) scrapeCss(new URL(m[1], href).href);
    }).catch(() => {}));
  };
  const walk = (rules, base) => {
    for (const r of rules) {
      if (r.type === CSSRule.FONT_FACE_RULE) fontRules.push({
        css: r.cssText,
        base
      });else if (r.type === CSSRule.IMPORT_RULE && r.styleSheet) {
        const ibase = r.styleSheet.href || base;
        try {
          walk(r.styleSheet.cssRules, ibase);
        } catch {
          scrapeCss(ibase);
        }
      } else if (r.cssRules) walk(r.cssRules, base);
    }
  };
  for (const ss of document.styleSheets) {
    const base = ss.href || location.href;
    try {
      walk(ss.cssRules, base);
    } catch {
      if (ss.href) scrapeCss(ss.href);
    }
  }
  while (pending.length) await pending.shift();
  const fontCss = (await Promise.all(fontRules.map(async rule => {
    let out = rule.css,
      m;
    const re = /url\((['"]?)([^'")]+)\1\)/g;
    while (m = re.exec(rule.css)) {
      if (m[2].indexOf('data:') === 0) continue;
      let abs;
      try {
        abs = new URL(m[2], rule.base).href;
      } catch {
        continue;
      }
      out = out.split(m[0]).join('url("' + (await toDataURL(abs)) + '")');
    }
    return out;
  }))).join('\n');
  const cloneStyled = src => {
    if (src.nodeType === 8 || src.nodeType === 1 && src.tagName === 'SCRIPT') return document.createTextNode('');
    const dst = src.cloneNode(false);
    if (src.nodeType === 1) {
      const cs = getComputedStyle(src);
      let txt = '';
      for (let i = 0; i < cs.length; i++) txt += cs[i] + ':' + cs.getPropertyValue(cs[i]) + ';';
      dst.setAttribute('style', txt + 'animation:none;transition:none;');
      if (src.tagName === 'CANVAS') try {
        const im = document.createElement('img');
        im.src = src.toDataURL();
        im.setAttribute('style', txt);
        return im;
      } catch {}
    }
    for (let c = src.firstChild; c; c = c.nextSibling) dst.appendChild(cloneStyled(c));
    return dst;
  };
  const clone = cloneStyled(node);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  // Drop the card's own shadow/radius so the export is a flush w×h rect;
  // the artboard's own background (if any) is already in the computed style.
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  const jobs = [];
  clone.querySelectorAll('img').forEach(el => {
    const s = el.getAttribute('src');
    if (s && s.indexOf('data:') !== 0) jobs.push(toDataURL(el.src).then(d => el.setAttribute('src', d)));
  });
  [clone, ...clone.querySelectorAll('*')].forEach(el => {
    const bg = el.style.backgroundImage;
    if (!bg) return;
    let m;
    const re = /url\(["']?([^"')]+)["']?\)/g;
    while (m = re.exec(bg)) {
      const tok = m[0],
        url = m[1];
      if (url.indexOf('data:') === 0) continue;
      jobs.push(toDataURL(url).then(d => {
        el.style.backgroundImage = el.style.backgroundImage.split(tok).join('url("' + d + '")');
      }));
    }
  });
  await Promise.all(jobs);
  const xml = new XMLSerializer().serializeToString(clone);
  const save = (blob, ext) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '.' + ext;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  if (kind === 'html') {
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + name + '</title>' + (fontCss ? '<style>' + fontCss + '</style>' : '') + '</head><body style="margin:0">' + xml + '</body></html>';
    return save(new Blob([html], {
      type: 'text/html'
    }), 'html');
  }

  // PNG: the SVG's own width/height must be the output resolution — an
  // <img>-loaded SVG rasterizes at its intrinsic size, so sizing it at 1×
  // and ctx.scale()-ing up would just upscale a 1× bitmap. viewBox maps the
  // w×h foreignObject onto the px·w × px·h SVG canvas so the browser renders
  // the HTML at full resolution.
  const px = 3;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w * px + '" height="' + h * px + '" viewBox="0 0 ' + w + ' ' + h + '"><foreignObject width="' + w + '" height="' + h + '">' + (fontCss ? '<style><![CDATA[' + fontCss + ']]></style>' : '') + xml + '</foreignObject></svg>';
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => rej(new Error('svg load failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  const cv = document.createElement('canvas');
  cv.width = w * px;
  cv.height = h * px;
  cv.getContext('2d').drawImage(img, 0, 0);
  cv.toBlob(blob => save(blob, 'png'), 'image/png');
}
function DCArtboardFrame({
  sectionId,
  artboard,
  label,
  order,
  onRename,
  onReorder,
  onFocus,
  onDelete
}) {
  const {
    id: rawId,
    label: rawLabel,
    width = 260,
    height = 480,
    children,
    style = {}
  } = artboard.props;
  const id = rawId ?? rawLabel;
  const ref = React.useRef(null);
  const cardRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  // ⋯ menu: close on any outside pointerdown. Two-click delete lives inside
  // the menu — first click arms the row, second commits; closing disarms.
  React.useEffect(() => {
    if (!menuOpen) {
      setConfirming(false);
      return;
    }
    const off = e => {
      if (!menuRef.current || !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', off, true);
    return () => document.removeEventListener('pointerdown', off, true);
  }, [menuOpen]);
  const doExport = kind => {
    setMenuOpen(false);
    if (!cardRef.current) return;
    const name = String(label || id || 'artboard').replace(/[^\w\s.-]+/g, '_');
    dcExport(cardRef.current, width, height, name, kind).catch(e => console.error('[design-canvas] export failed:', e));
  };

  // Live drag-reorder: dragged card sticks to cursor; siblings slide into
  // their would-be slots in real time via transforms. DOM order only
  // changes on drop.
  const onGripDown = e => {
    e.preventDefault();
    e.stopPropagation();
    const me = ref.current;
    // translateX is applied in local (pre-scale) space but pointer deltas and
    // getBoundingClientRect().left are screen-space — divide by the viewport's
    // current scale so the dragged card tracks the cursor at any zoom level.
    const scale = me.getBoundingClientRect().width / me.offsetWidth || 1;
    const peers = Array.from(document.querySelectorAll(`[data-dc-section="${sectionId}"] [data-dc-slot]`));
    const homes = peers.map(el => ({
      el,
      id: el.dataset.dcSlot,
      x: el.getBoundingClientRect().left
    }));
    const slotXs = homes.map(h => h.x);
    const startIdx = order.indexOf(id);
    const startX = e.clientX;
    let liveOrder = order.slice();
    me.classList.add('dc-dragging');
    const layout = () => {
      for (const h of homes) {
        if (h.id === id) continue;
        const slot = liveOrder.indexOf(h.id);
        h.el.style.transform = `translateX(${(slotXs[slot] - h.x) / scale}px)`;
      }
    };
    const move = ev => {
      const dx = ev.clientX - startX;
      me.style.transform = `translateX(${dx / scale}px)`;
      const cur = homes[startIdx].x + dx;
      let nearest = 0,
        best = Infinity;
      for (let i = 0; i < slotXs.length; i++) {
        const d = Math.abs(slotXs[i] - cur);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }
      if (liveOrder.indexOf(id) !== nearest) {
        liveOrder = order.filter(k => k !== id);
        liveOrder.splice(nearest, 0, id);
        layout();
      }
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      const finalSlot = liveOrder.indexOf(id);
      me.classList.remove('dc-dragging');
      me.style.transform = `translateX(${(slotXs[finalSlot] - homes[startIdx].x) / scale}px)`;
      // After the settle transition, kill transitions + clear transforms +
      // commit the reorder in the same frame so there's no visual snap-back.
      setTimeout(() => {
        for (const h of homes) {
          h.el.style.transition = 'none';
          h.el.style.transform = '';
        }
        if (liveOrder.join('|') !== order.join('|')) onReorder(liveOrder);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          for (const h of homes) h.el.style.transition = '';
        }));
      }, 180);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    "data-dc-slot": id,
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-header",
    "data-omelette-chrome": "",
    style: {
      color: DC.label
    },
    onPointerDown: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-labelrow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-grip",
    onPointerDown: onGripDown,
    title: "Drag to reorder"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "13",
    viewBox: "0 0 9 13",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "11",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "11",
    r: "1.1"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-labeltext",
    onClick: onFocus,
    title: "Click to focus"
  }, /*#__PURE__*/React.createElement(DCEditable, {
    value: label,
    onChange: onRename,
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: DC.label,
      lineHeight: 1
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-btns"
  }, /*#__PURE__*/React.createElement("div", {
    ref: menuRef,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "dc-kebab",
    title: "More",
    onClick: () => setMenuOpen(o => !o)
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2.5",
    cy: "6",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9.5",
    cy: "6",
    r: "1.1"
  }))), menuOpen && /*#__PURE__*/React.createElement("div", {
    className: "dc-menu",
    onPointerDown: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => doExport('png')
  }, "Download PNG"), /*#__PURE__*/React.createElement("button", {
    onClick: () => doExport('html')
  }, "Download HTML"), /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("button", {
    className: "dc-danger",
    onClick: () => {
      if (confirming) {
        setMenuOpen(false);
        onDelete();
      } else setConfirming(true);
    }
  }, confirming ? 'Click again to delete' : 'Delete'))), /*#__PURE__*/React.createElement("button", {
    className: "dc-expand",
    onClick: onFocus,
    title: "Focus"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 1h4v4M5 11H1V7M11 1L7.5 4.5M1 11l3.5-3.5"
  }))))), /*#__PURE__*/React.createElement("div", {
    ref: cardRef,
    className: "dc-card",
    style: {
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06)',
      overflow: 'hidden',
      width,
      height,
      background: '#fff',
      ...style
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb',
      fontSize: 13,
      fontFamily: DC.font
    }
  }, id)));
}

// Inline rename — commits on blur or Enter.
function DCEditable({
  value,
  onChange,
  style,
  tag = 'span',
  onClick
}) {
  const T = tag;
  return /*#__PURE__*/React.createElement(T, {
    className: "dc-editable",
    contentEditable: true,
    suppressContentEditableWarning: true,
    onClick: onClick,
    onPointerDown: e => e.stopPropagation(),
    onBlur: e => onChange && onChange(e.currentTarget.textContent),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    style: style
  }, value);
}

// ─────────────────────────────────────────────────────────────
// Focus mode — overlay one artboard; ←/→ within section, ↑/↓ across
// sections, Esc or backdrop click to exit.
// ─────────────────────────────────────────────────────────────
function DCFocusOverlay({
  entry,
  sectionMeta,
  sectionOrder
}) {
  const ctx = React.useContext(DCCtx);
  const {
    sectionId,
    artboard
  } = entry;
  const sec = ctx.section(sectionId);
  const meta = sectionMeta[sectionId];
  const peers = meta.slotIds;
  const aid = artboard.props.id ?? artboard.props.label;
  const idx = peers.indexOf(aid);
  const secIdx = sectionOrder.indexOf(sectionId);
  const go = d => {
    const n = peers[(idx + d + peers.length) % peers.length];
    if (n) ctx.setFocus(`${sectionId}/${n}`);
  };
  const goSection = d => {
    // Sections whose artboards are all deleted have slotIds:[] — step past
    // them to the next non-empty section so ↑/↓ doesn't dead-end.
    const n = sectionOrder.length;
    for (let i = 1; i < n; i++) {
      const ns = sectionOrder[((secIdx + d * i) % n + n) % n];
      const first = sectionMeta[ns] && sectionMeta[ns].slotIds[0];
      if (first) {
        ctx.setFocus(`${ns}/${first}`);
        return;
      }
    }
  };
  React.useEffect(() => {
    const k = e => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goSection(-1);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goSection(1);
      }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });
  const {
    width = 260,
    height = 480,
    children
  } = artboard.props;
  const [vp, setVp] = React.useState({
    w: window.innerWidth,
    h: window.innerHeight
  });
  React.useEffect(() => {
    const r = () => setVp({
      w: window.innerWidth,
      h: window.innerHeight
    });
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  const scale = Math.max(0.1, Math.min((vp.w - 200) / width, (vp.h - 260) / height, 2));
  const [ddOpen, setDd] = React.useState(false);
  const Arrow = ({
    dir,
    onClick
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onClick();
    },
    style: {
      position: 'absolute',
      top: '50%',
      [dir]: 28,
      transform: 'translateY(-50%)',
      border: 'none',
      background: 'rgba(255,255,255,.08)',
      color: 'rgba(255,255,255,.9)',
      width: 44,
      height: 44,
      borderRadius: 22,
      fontSize: 18,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background .15s'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.18)',
    onMouseLeave: e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: dir === 'left' ? 'M11 3L5 9l6 6' : 'M7 3l6 6-6 6'
  })));

  // Portal to body so position:fixed is the real viewport regardless of any
  // transform on DesignCanvas's ancestors (including the canvas zoom itself).
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    onClick: () => ctx.setFocus(null),
    onWheel: e => e.preventDefault(),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(24,20,16,.6)',
      backdropFilter: 'blur(14px)',
      fontFamily: DC.font,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      display: 'flex',
      alignItems: 'flex-start',
      padding: '16px 20px 0',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDd(o => !o),
    style: {
      border: 'none',
      background: 'transparent',
      color: '#fff',
      cursor: 'pointer',
      padding: '6px 8px',
      borderRadius: 6,
      textAlign: 'left',
      fontFamily: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: -0.3
    }
  }, meta.title), /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 11 11",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    style: {
      opacity: .7
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 4l3.5 3.5L9 4"
  }))), meta.subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      opacity: .6,
      fontWeight: 400,
      marginTop: 2
    }
  }, meta.subtitle)), ddOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: 4,
      background: '#2a251f',
      borderRadius: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      padding: 4,
      minWidth: 200,
      zIndex: 10
    }
  }, sectionOrder.filter(sid => sectionMeta[sid].slotIds.length).map(sid => /*#__PURE__*/React.createElement("button", {
    key: sid,
    onClick: () => {
      setDd(false);
      const f = sectionMeta[sid].slotIds[0];
      if (f) ctx.setFocus(`${sid}/${f}`);
    },
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      border: 'none',
      cursor: 'pointer',
      background: sid === sectionId ? 'rgba(255,255,255,.1)' : 'transparent',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: 5,
      fontSize: 14,
      fontWeight: sid === sectionId ? 600 : 400,
      fontFamily: 'inherit'
    }
  }, sectionMeta[sid].title)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => ctx.setFocus(null),
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.12)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent',
    style: {
      border: 'none',
      background: 'transparent',
      color: 'rgba(255,255,255,.7)',
      width: 32,
      height: 32,
      borderRadius: 16,
      fontSize: 20,
      cursor: 'pointer',
      lineHeight: 1,
      transition: 'background .12s'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 64,
      bottom: 56,
      left: 100,
      right: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: width * scale,
      height: height * scale,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      background: '#fff',
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: '0 20px 80px rgba(0,0,0,.4)'
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb'
    }
  }, aid))), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 14,
      fontWeight: 500,
      opacity: .85,
      textAlign: 'center'
    }
  }, (sec.labels || {})[aid] ?? artboard.props.label, /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .5,
      marginLeft: 10,
      fontVariantNumeric: 'tabular-nums'
    }
  }, idx + 1, " / ", peers.length))), /*#__PURE__*/React.createElement(Arrow, {
    dir: "left",
    onClick: () => go(-1)
  }), /*#__PURE__*/React.createElement(Arrow, {
    dir: "right",
    onClick: () => go(1)
  }), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 8
    }
  }, peers.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: p,
    onClick: () => ctx.setFocus(`${sectionId}/${p}`),
    style: {
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      width: 6,
      height: 6,
      borderRadius: 3,
      background: i === idx ? '#fff' : 'rgba(255,255,255,.3)'
    }
  })))), document.body);
}

// ─────────────────────────────────────────────────────────────
// Post-it — absolute-positioned sticky note
// ─────────────────────────────────────────────────────────────
function DCPostIt({
  children,
  top,
  left,
  right,
  bottom,
  rotate = -2,
  width = 180
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top,
      left,
      right,
      bottom,
      width,
      background: DC.postitBg,
      padding: '14px 16px',
      fontFamily: '"Comic Sans MS", "Marker Felt", "Segoe Print", cursive',
      fontSize: 14,
      lineHeight: 1.4,
      color: DC.postitText,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      transform: `rotate(${rotate}deg)`,
      zIndex: 5
    }
  }, children);
}
Object.assign(window, {
  DesignCanvas,
  DCSection,
  DCArtboard,
  DCPostIt
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "design-canvas.jsx", error: String((e && e.message) || e) }); }

// migration/client/src/app/layout.tsx
try { (() => {
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

// Tighter, more architectural display face for headings / KPIs
const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap'
});

// Monospace for status badges, IDs, and tabular numbers
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap'
});
const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#0d9488'
};
const metadata = {
  title: 'Bika Banquet - Management System',
  description: 'Complete banquet operations platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bika Banquet'
  },
  icons: {
    icon: 'https://assets.zyrosite.com/MBlLcEqY2yw3y2EF/1-2-removebg-scaled-e1752152009924-7iV2qZXAcVUCou9o.png',
    shortcut: 'https://assets.zyrosite.com/MBlLcEqY2yw3y2EF/1-2-removebg-scaled-e1752152009924-7iV2qZXAcVUCou9o.png',
    apple: 'https://assets.zyrosite.com/MBlLcEqY2yw3y2EF/1-2-removebg-scaled-e1752152009924-7iV2qZXAcVUCou9o.png'
  }
};
function RootLayout({
  children
}) {
  return /*#__PURE__*/React.createElement("html", {
    lang: "en"
  }, /*#__PURE__*/React.createElement("body", {
    className: `${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`
  }, /*#__PURE__*/React.createElement(CapacitorNativeShell, null), /*#__PURE__*/React.createElement(AuthBootstrap, null), /*#__PURE__*/React.createElement(IonicProvider, null, children), /*#__PURE__*/React.createElement(Toaster, {
    position: "top-right",
    richColors: true
  })));
}
Object.assign(__ds_scope, { viewport, metadata, RootLayout });
})(); } catch (e) { __ds_ns.__errors.push({ path: "migration/client/src/app/layout.tsx", error: String((e && e.message) || e) }); }

// migration/client/tailwind.config.js
try { (() => {
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)'
        },
        text: {
          1: 'var(--text-1)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
          4: 'var(--text-4)'
        },
        border: {
          DEFAULT: 'var(--border)',
          2: 'var(--border-2)'
        },
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a'
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'SF Mono', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '6px',
        xl: '6px',
        '2xl': '8px'
      },
      boxShadow: {
        xs: '0 1px 2px rgba(28,25,23,0.04)',
        sm: '0 1px 3px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)',
        md: '0 4px 6px rgba(28,25,23,0.05), 0 2px 4px rgba(28,25,23,0.04)',
        lg: '0 10px 15px rgba(28,25,23,0.06), 0 4px 6px rgba(28,25,23,0.04)'
      }
    }
  },
  plugins: []
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "migration/client/tailwind.config.js", error: String((e && e.message) || e) }); }

// mockups/screens.jsx
try { (() => {
// screens.jsx — artboard content for the 4 migration mockups

// ── Shared data ─────────────────────────────────────────────────
const BOOKINGS_DATA = [{
  id: 'BK-24301',
  fn: 'Kapoor Wedding Reception',
  cust: 'Ramesh Kapoor',
  hall: 'Grand Ballroom',
  date: '15 Jun',
  total: '₹3.84L',
  s: 'confirmed',
  pct: 94
}, {
  id: 'BK-24302',
  fn: 'Sharma Anniversary Dinner',
  cust: 'Priya Sharma',
  hall: 'Crystal Hall',
  date: '18 Jun',
  total: '₹1.95L',
  s: 'pencil',
  pct: 0,
  exp: '2d left'
}, {
  id: 'BK-24303',
  fn: 'Mehta Birthday Celebration',
  cust: 'Anita Mehta',
  hall: 'Heritage Hall',
  date: '20 Jun',
  total: '₹2.24L',
  s: 'quotation',
  pct: 0
}, {
  id: 'BK-24304',
  fn: 'Kumar Engagement Ceremony',
  cust: 'Sunil Kumar',
  hall: 'Emerald Suite',
  date: '22 Jun',
  total: '₹1.12L',
  s: 'enquiry',
  pct: 0
}, {
  id: 'BK-24305',
  fn: 'Patel Family Reunion',
  cust: 'Deepak Patel',
  hall: 'Grand Ballroom',
  date: '25 Jun',
  total: '₹4.50L',
  s: 'confirmed',
  pct: 67
}, {
  id: 'BK-24306',
  fn: 'Iyer Naming Ceremony',
  cust: 'Lalitha Iyer',
  hall: 'Crystal Hall',
  date: '28 Jun',
  total: '₹0.84L',
  s: 'pencil',
  pct: 20,
  exp: '5d left'
}];
const KPI_DATA = [{
  l: 'Revenue · 30d',
  v: '₹62.4L',
  delta: '+14.2%',
  up: true,
  spark: [4, 8, 7, 12, 10, 14, 16, 11, 15, 18, 21, 24],
  c: '#0F766E'
}, {
  l: 'Confirmed',
  v: '38',
  delta: '+6',
  up: true,
  spark: [3, 5, 4, 6, 7, 5, 8, 9, 7, 10, 12, 14],
  c: '#16A34A'
}, {
  l: 'Pencil at risk',
  v: '₹14.2L',
  delta: '+₹3L',
  up: false,
  spark: [2, 3, 5, 4, 6, 7, 6, 8, 9, 10, 11, 12],
  c: '#D97706'
}, {
  l: 'Outstanding',
  v: '₹28.6L',
  delta: '-₹4.1L',
  up: true,
  spark: [40, 38, 36, 34, 32, 30, 29, 29, 28, 28, 27, 27],
  c: '#B45309'
}, {
  l: 'Avg. ticket',
  v: '₹2.18L',
  delta: '+9.4%',
  up: true,
  spark: [1.6, 1.7, 1.8, 1.7, 1.9, 2.0, 2.1, 2.0, 2.1, 2.18, 2.2, 2.25],
  c: '#44403C'
}];
const REV_DATA = [{
  l: 'Jun',
  v: 42
}, {
  l: 'Jul',
  v: 58
}, {
  l: 'Aug',
  v: 51
}, {
  l: 'Sep',
  v: 64
}, {
  l: 'Oct',
  v: 72
}, {
  l: 'Nov',
  v: 88
}, {
  l: 'Dec',
  v: 124
}, {
  l: 'Jan',
  v: 96
}, {
  l: 'Feb',
  v: 110
}, {
  l: 'Mar',
  v: 132
}, {
  l: 'Apr',
  v: 118
}, {
  l: 'May',
  v: 62
}];
const revMax = Math.max(...REV_DATA.map(d => d.v));

// ── ARTBOARD 1 — Before (codebase) ─────────────────────────────
function BeforeArtboard() {
  const today = [{
    time: '10:00–14:00',
    fn: 'Kapoor Wedding Reception',
    cust: 'Ramesh Kapoor',
    hall: 'Grand Ballroom',
    guests: 350,
    total: '₹3.84L',
    s: 'confirmed'
  }, {
    time: '11:00–15:00',
    fn: 'Sharma Anniversary Dinner',
    cust: 'Priya Sharma',
    hall: 'Crystal Hall',
    guests: 120,
    total: '₹1.95L',
    s: 'pencil'
  }, {
    time: '19:00–23:00',
    fn: 'Mehta Birthday Celebration',
    cust: 'Anita Mehta',
    hall: 'Heritage Hall',
    guests: 200,
    total: '₹2.24L',
    s: 'confirmed'
  }];
  const cash = [12, 8, 24, 18, 32, 15, 9, 28, 41, 35, 22, 18, 30, 44];
  const cashMax = Math.max(...cash);
  const funnel = [{
    l: 'Lead',
    v: 14
  }, {
    l: 'Quotation',
    v: 9
  }, {
    l: 'Pencil',
    v: 7
  }, {
    l: 'Won',
    v: 22
  }];
  const fMax = Math.max(...funnel.map(f => f.v));
  const kpis = [{
    l: 'Revenue (30d)',
    v: '₹62.4L',
    sub: 'confirmed',
    c: null
  }, {
    l: 'Received (30d)',
    v: '₹48.1L',
    sub: 'all sources',
    c: null
  }, {
    l: 'Total dues',
    v: '₹14.3L',
    sub: 'open balance',
    c: '#dc2626'
  }, {
    l: 'Today',
    v: '3',
    sub: 'events',
    c: null
  }, {
    l: 'Pencils',
    v: '7',
    sub: 'expiring',
    c: '#d97706'
  }, {
    l: 'Conflicts',
    v: '2',
    sub: '7d ahead',
    c: '#dc2626'
  }];
  const td = {
    padding: '6px 0',
    fontSize: 11,
    fontFamily: CB.fm,
    color: CB.t1,
    borderBottom: `1px solid rgba(228,228,231,0.7)`
  };
  return /*#__PURE__*/React.createElement(BeforeShell, {
    active: "Timeline"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: CB.bg,
      overflow: 'hidden',
      fontFamily: CB.ff
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(6,1fr)',
      gap: 1,
      background: CB.bd,
      borderBottom: `1px solid ${CB.bd}`
    }
  }, kpis.map((k, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: CB.bg,
      padding: '10px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: CB.t4,
      fontFamily: CB.fm
    }
  }, k.l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 600,
      fontFamily: CB.fm,
      marginTop: 2,
      lineHeight: 1,
      color: k.c || CB.t1
    }
  }, k.v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: CB.t3,
      marginTop: 2
    }
  }, k.sub)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '8fr 4fr',
      gap: 1,
      background: CB.bd
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: CB.bg,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: CB.t3,
      fontFamily: CB.fm
    }
  }, "Today"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: CB.ac,
      fontFamily: CB.fm,
      cursor: 'default'
    }
  }, "Open timeline \u2192")), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      borderBottom: `1px solid ${CB.bd}`
    }
  }, ['Time', 'Function', 'Customer', 'Hall', 'Guests', 'Total', 'Status'].map(h => /*#__PURE__*/React.createElement("th", {
    key: h,
    style: {
      textAlign: ['Guests', 'Total', 'Status'].includes(h) ? 'right' : 'left',
      padding: '4px 0',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: CB.t3,
      fontFamily: CB.fm,
      fontWeight: 400
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, today.map((b, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      fontFamily: CB.fm,
      color: CB.t2,
      whiteSpace: 'nowrap'
    }
  }, b.time), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      maxWidth: 180,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      paddingLeft: 4
    }
  }, b.fn), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      color: CB.t3,
      paddingLeft: 4
    }
  }, b.cust), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      color: CB.t3,
      paddingLeft: 4
    }
  }, b.hall), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      textAlign: 'right',
      fontFamily: CB.fm
    }
  }, b.guests), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      textAlign: 'right',
      fontFamily: CB.fm
    }
  }, b.total), /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(OldBadge, {
    s: b.s
  }))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: CB.bg,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: CB.t3,
      fontFamily: CB.fm,
      marginBottom: 8
    }
  }, "Alerts"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, [{
    c: '#dc2626',
    k: '! Conflict',
    msg: 'Kapoor Wedding ⇄ 1 more on 2 Jun'
  }, {
    c: '#d97706',
    k: 'Pencil · exp 2d',
    msg: 'Sharma Anniversary'
  }, {
    c: '#d97706',
    k: 'Pencil · exp 5d',
    msg: 'Iyer Naming Ceremony'
  }, {
    c: '#dc2626',
    k: 'Due 4 Jun',
    msg: 'Patel Family Reunion — ₹1.8L',
    kg: CB.t3
  }].map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '5px 8px',
      borderLeft: `2px solid ${a.c}`,
      background: `rgba(0,0,0,0.02)`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontFamily: CB.fm,
      color: a.kg || a.c,
      marginBottom: 1
    }
  }, a.k), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: CB.t2
    }
  }, a.msg)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 1,
      background: CB.bd
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: CB.bg,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: CB.t3,
      fontFamily: CB.fm
    }
  }, "Cash inflow \u2014 last 14 days"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: CB.fm,
      fontSize: 10,
      color: CB.t3
    }
  }, "total \u20B93.4L")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 2,
      height: 72
    }
  }, cash.map((v, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      background: `rgba(37,99,235,0.18)`,
      borderTop: `1px solid ${CB.ac}`,
      height: `${Math.max(2, v / cashMax * 100)}%`
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 4,
      fontSize: 9,
      fontFamily: CB.fm,
      color: CB.t3
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u221213d"), /*#__PURE__*/React.createElement("span", null, "\u22127d"), /*#__PURE__*/React.createElement("span", null, "today"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: CB.bg,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: CB.t3,
      fontFamily: CB.fm,
      marginBottom: 10
    }
  }, "Enquiry funnel"), funnel.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      fontSize: 10,
      color: CB.t2
    }
  }, f.l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: CB.fm,
      color: CB.t2,
      fontSize: 11
    }
  }, f.v)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      background: CB.sf2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: CB.ac,
      width: `${f.v / fMax * 100}%`
    }
  }))))))));
}

// ── ARTBOARD 2 — After: Redesigned Dashboard ────────────────────
function AfterDashArtboard() {
  const insights = [{
    k: 'good',
    ttl: 'Utilization at 84%',
    sub: 'Grand Ballroom fully booked next 3 weekends'
  }, {
    k: 'warn',
    ttl: '7 pencils expiring this week',
    sub: '₹14.2L at risk — follow up today'
  }, {
    k: 'bad',
    ttl: '2 active hall conflicts',
    sub: 'BK-24301 overlaps with BK-24315 on 15 Jun'
  }, {
    k: 'info',
    ttl: 'Avg. ticket up 9.4%',
    sub: 'Premium packs driving higher spend per head'
  }];
  const insightColor = {
    good: '#16A34A',
    warn: '#D97706',
    bad: '#DC2626',
    info: '#0284C7'
  };
  const insightBg = {
    good: '#F0FDF4',
    warn: '#FFFBEB',
    bad: '#FEF2F2',
    info: '#F0F9FF'
  };
  const upcoming = BOOKINGS_DATA.slice(0, 5);
  return /*#__PURE__*/React.createElement(Shell, {
    active: "dashboard",
    page: "Dashboard"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: T.bg,
      overflow: 'hidden',
      fontFamily: T.ff
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px 10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${T.bd}`,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: T.t1,
      letterSpacing: '-0.3px'
    }
  }, "Operations overview"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: T.t3,
      marginTop: 2
    }
  }, "Andheri property \xB7 Sunday, 1 June 2026")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      border: `1px solid ${T.bd}`,
      borderRadius: 4,
      overflow: 'hidden'
    }
  }, ['Today', 'This week', '30 days', 'Quarter'].map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: t,
    style: {
      padding: '5px 10px',
      fontSize: 11,
      fontFamily: T.ff,
      background: i === 1 ? T.ac : 'transparent',
      color: i === 1 ? '#fff' : T.t3,
      border: 'none',
      borderRight: i < 3 ? `1px solid ${T.bd}` : 'none',
      cursor: 'default',
      fontWeight: i === 1 ? 500 : 400
    }
  }, t))), /*#__PURE__*/React.createElement("button", {
    style: {
      height: 30,
      padding: '0 12px',
      fontSize: 11.5,
      border: `1px solid ${T.bd}`,
      borderRadius: 4,
      background: T.sf,
      color: T.t2,
      cursor: 'default'
    }
  }, "Export"), /*#__PURE__*/React.createElement("button", {
    style: {
      height: 30,
      padding: '0 12px',
      fontSize: 11.5,
      border: 'none',
      borderRadius: 4,
      background: T.ac,
      color: '#fff',
      cursor: 'default',
      fontWeight: 500
    }
  }, "+ New booking"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5,1fr)',
      gap: 1,
      background: T.bd,
      borderBottom: `1px solid ${T.bd}`
    }
  }, KPI_DATA.map((k, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: T.sf,
      padding: '10px 14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: T.t4,
      fontFamily: T.fm
    }
  }, k.l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: T.t1,
      marginTop: 3,
      letterSpacing: '-0.5px',
      lineHeight: 1
    }
  }, k.v), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: k.up ? '#16A34A' : '#DC2626',
      fontFamily: T.fm,
      fontWeight: 500
    }
  }, k.up ? '↑' : '↓', " ", k.delta))), /*#__PURE__*/React.createElement(Sparkline, {
    data: k.spark,
    color: k.c,
    h: 32,
    w: 56
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 360px',
      gap: 12,
      padding: 16,
      height: 'calc(100% - 56px - 72px - 1px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: T.sf,
      border: `1px solid ${T.bd}`,
      borderRadius: T.r,
      padding: 14,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: T.t1
    }
  }, "Revenue \xB7 trailing 12 months"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: T.t3
    }
  }, "All venues \xB7 \u20B9 in Lakhs")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 4,
      height: 90
    }
  }, REV_DATA.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      background: i === 11 ? T.sf2 : T.ac,
      opacity: i === 11 ? 0.4 : 1,
      borderRadius: '2px 2px 0 0',
      height: `${d.v / revMax * 80 + 2}px`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8.5,
      color: T.t4,
      fontFamily: T.fm
    }
  }, d.l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: T.sf,
      border: `1px solid ${T.bd}`,
      borderRadius: T.r,
      flex: 1,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      borderBottom: `1px solid ${T.bd}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: T.t1
    }
  }, "Upcoming events"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: T.t3
    }
  }, "Next 7 days")), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: T.sf2
    }
  }, ['Date', 'Function', 'Hall', 'Guests', 'Total', 'Status'].map(h => /*#__PURE__*/React.createElement("th", {
    key: h,
    style: {
      textAlign: ['Guests', 'Total'].includes(h) ? 'right' : 'left',
      padding: '7px 12px',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: T.t3,
      fontFamily: T.fm,
      fontWeight: 400,
      borderBottom: `1px solid ${T.bd}`
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, upcoming.map((b, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    style: {
      borderBottom: `1px solid ${T.bd}`,
      cursor: 'default'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 12px',
      fontSize: 12,
      fontFamily: T.fm,
      color: T.t2,
      whiteSpace: 'nowrap'
    }
  }, b.date), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 4px',
      fontSize: 12,
      color: T.t1,
      fontWeight: 500,
      maxWidth: 140,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, b.fn), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 4px',
      fontSize: 11.5,
      color: T.t3,
      whiteSpace: 'nowrap'
    }
  }, b.hall), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 4px',
      fontSize: 12,
      fontFamily: T.fm,
      textAlign: 'right',
      color: T.t2
    }
  }, "\u2014"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 4px',
      fontSize: 12,
      fontFamily: T.fm,
      textAlign: 'right',
      fontWeight: 600,
      color: T.t1
    }
  }, b.total), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 12px',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    s: b.s,
    small: true
  })))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: T.sf,
      border: `1px solid ${T.bd}`,
      borderRadius: T.r,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      borderBottom: `1px solid ${T.bd}`,
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: T.t1
    }
  }, "Insights"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: T.t4
    }
  }, "\u2726 Updated 4m ago")), insights.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '9px 14px',
      borderBottom: i < 3 ? `1px solid ${T.bd}` : 'none',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: 4,
      background: insightBg[it.k],
      display: 'grid',
      placeItems: 'center',
      fontSize: 11,
      flexShrink: 0,
      color: insightColor[it.k]
    }
  }, it.k === 'good' ? '↑' : it.k === 'warn' ? '⚠' : it.k === 'bad' ? '✕' : 'ℹ'), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: T.t1
    }
  }, it.ttl), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.t3,
      marginTop: 1
    }
  }, it.sub))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: T.sf,
      border: `1px solid ${T.bd}`,
      borderRadius: T.r,
      flex: 1,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      borderBottom: `1px solid ${T.bd}`,
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: T.t1
    }
  }, "Live activity"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 11,
      color: '#16A34A',
      fontFamily: T.fm
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: '#16A34A',
      display: 'inline-block'
    }
  }), "Realtime")), [{
    who: 'Suresh',
    act: 'confirmed',
    target: 'BK-24301',
    detail: 'Kapoor Wedding Reception · ₹3.84L',
    t: 'now'
  }, {
    who: 'Anita',
    act: 'added payment',
    target: 'BK-24298',
    detail: '₹50,000 · UPI · REF8821',
    t: '2m'
  }, {
    who: 'Vikram',
    act: 'updated',
    target: 'BK-24302',
    detail: 'Hall changed: Grand → Crystal',
    t: '5m'
  }, {
    who: 'Rakesh',
    act: 'created',
    target: 'BK-24307',
    detail: 'New enquiry — Gupta naming',
    t: '12m'
  }, {
    who: 'Anita',
    act: 'marked pencil',
    target: 'BK-24303',
    detail: 'Expiry set: 7 Jun 2026',
    t: '18m'
  }].map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '8px 14px',
      borderBottom: i < 4 ? `1px solid ${T.bd}` : 'none',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: T.ac,
      marginTop: 4,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: T.t1
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 600
    }
  }, a.who), " ", a.act, " ", /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 600
    }
  }, a.target)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: T.t3,
      marginTop: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, a.detail)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: T.t4,
      fontFamily: T.fm,
      flexShrink: 0
    }
  }, a.t))))))));
}

// ── ARTBOARD 3 — Calendar / HallBoard ──────────────────────────
function CalendarArtboard() {
  const HALLS = [{
    v: 'BIKA ANDHERI',
    h: [{
      n: 'Grand Ballroom',
      cap: 500,
      floor: 2,
      occ: 8,
      events: [{
        s: 'confirmed',
        start: 10,
        dur: 4,
        fn: 'Kapoor Wedding',
        guests: 350,
        val: '₹3.84L',
        conflict: true
      }, {
        s: 'confirmed',
        start: 12,
        dur: 4,
        fn: 'Malhotra Mehendi',
        guests: 180,
        val: '₹2.1L',
        conflict: true,
        source: 'google'
      }]
    }, {
      n: 'Crystal Hall',
      cap: 200,
      floor: 1,
      occ: 4,
      events: [{
        s: 'pencil',
        start: 11,
        dur: 5,
        fn: 'Sharma Anniversary',
        guests: 120,
        val: '₹1.95L',
        exp: '2d'
      }]
    }, {
      n: 'Heritage Hall',
      cap: 300,
      floor: 3,
      occ: 6,
      events: [{
        s: 'confirmed',
        start: 9,
        dur: 4,
        fn: 'Mehta Birthday',
        guests: 200,
        val: '₹2.24L'
      }, {
        s: 'quotation',
        start: 15,
        dur: 3,
        fn: 'Patel Engagement',
        guests: 80,
        val: '₹1.1L'
      }]
    }]
  }, {
    v: 'BIKA BANDRA',
    h: [{
      n: 'Emerald Suite',
      cap: 80,
      floor: 1,
      occ: 2,
      events: [{
        s: 'enquiry',
        start: 14,
        dur: 2,
        fn: 'Kumar Pre-wedding',
        guests: 40,
        val: '₹0.52L'
      }]
    }, {
      n: 'Sapphire Room',
      cap: 120,
      floor: 2,
      occ: 5,
      events: [{
        s: 'confirmed',
        start: 16,
        dur: 3,
        fn: 'Iyer Baby Shower',
        guests: 90,
        val: '₹0.84L'
      }]
    }]
  }];
  const START_H = 8,
    TOTAL_H = 14,
    PX = 56;
  const statusColor = {
    confirmed: T.st.confirmed,
    pencil: T.st.pencil,
    quotation: T.st.quotation,
    enquiry: T.st.enquiry
  };
  return /*#__PURE__*/React.createElement(Shell, {
    active: "calendar",
    page: "Calendar"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100%',
      overflow: 'hidden',
      fontFamily: T.ff
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 184,
      flexShrink: 0,
      background: T.sf,
      borderRight: `1px solid ${T.bd}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderBottom: `1px solid ${T.bd}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: 24,
      height: 24,
      display: 'grid',
      placeItems: 'center',
      border: `1px solid ${T.bd}`,
      borderRadius: 3,
      background: 'none',
      color: T.t3,
      cursor: 'default',
      fontSize: 14
    }
  }, "\u2039"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontFamily: T.fm,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: T.t3
    }
  }, "Sunday"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      fontFamily: T.fm,
      color: T.t1
    }
  }, "01 Jun 2026")), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 24,
      height: 24,
      display: 'grid',
      placeItems: 'center',
      border: `1px solid ${T.bd}`,
      borderRadius: 3,
      background: 'none',
      color: T.t3,
      cursor: 'default',
      fontSize: 14
    }
  }, "\u203A")), /*#__PURE__*/React.createElement("button", {
    style: {
      width: '100%',
      padding: '4px 0',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      border: `1px solid ${T.bd}`,
      borderRadius: 3,
      background: 'none',
      color: T.t3,
      cursor: 'default',
      fontFamily: T.fm
    }
  }, "Today")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderBottom: `1px solid ${T.bd}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontFamily: T.fm,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: T.t4,
      marginBottom: 8
    }
  }, "View"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 2
    }
  }, ['Board', 'Day', 'Week', 'Month'].map((v, i) => /*#__PURE__*/React.createElement("button", {
    key: v,
    style: {
      padding: '4px 0',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontFamily: T.fm,
      border: `1px solid ${i === 0 ? T.ac : T.bd}`,
      borderRadius: 3,
      background: i === 0 ? T.ac : 'none',
      color: i === 0 ? '#fff' : T.t3,
      cursor: 'default'
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderBottom: `1px solid ${T.bd}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontFamily: T.fm,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: T.t4,
      marginBottom: 8
    }
  }, "Status"), Object.entries(T.st).filter(([k]) => ['confirmed', 'pencil', 'quotation', 'enquiry'].includes(k)).map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 12,
      height: 12,
      borderRadius: 2,
      background: v.dot,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      textTransform: 'capitalize',
      color: T.t2
    }
  }, v.l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontFamily: T.fm,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: T.t4,
      marginBottom: 8
    }
  }, "Hall occupancy"), HALLS.map(group => /*#__PURE__*/React.createElement("div", {
    key: group.v,
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontFamily: T.fm,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: T.t3,
      marginBottom: 4
    }
  }, group.v.split(' ')[1]), group.h.map(h => {
    const pct = Math.min(100, h.occ / TOTAL_H * 100);
    const barC = pct > 75 ? '#DC2626' : pct > 40 ? T.ac : '#16A34A';
    return /*#__PURE__*/React.createElement("div", {
      key: h.n,
      style: {
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        marginBottom: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: T.t2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: 110
      }
    }, h.n), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: T.fm,
        fontSize: 10,
        color: T.t3,
        flexShrink: 0
      }
    }, h.occ, "h")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 3,
        background: T.sf2,
        borderRadius: 2
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        background: barC,
        borderRadius: 2,
        width: `${pct}%`
      }
    })));
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      position: 'relative',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '7px 14px',
      background: 'color-mix(in oklab,#DC2626 10%,white)',
      borderBottom: `1px solid #FCA5A5`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      position: 'sticky',
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontFamily: T.fm,
      fontWeight: 700,
      color: '#DC2626',
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    }
  }, "! 2 hall conflicts"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: T.t3
    }
  }, "\u2014 overlapping bookings on Grand Ballroom \xB7 Click to resolve.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      borderBottom: `1px solid ${T.bd}`,
      position: 'sticky',
      top: 36,
      zIndex: 10,
      background: T.bg
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 144,
      flexShrink: 0,
      background: T.sf,
      borderRight: `1px solid ${T.bd}`,
      padding: '0 12px',
      height: 32,
      display: 'flex',
      alignItems: 'center',
      fontSize: 9.5,
      fontFamily: T.fm,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: T.t4
    }
  }, "Hall / Time"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flex: 1
    }
  }, Array.from({
    length: TOTAL_H + 1
  }, (_, i) => {
    const h = START_H + i;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        width: PX,
        flexShrink: 0,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 4,
        borderLeft: `1px solid ${T.bd}`,
        fontSize: 9.5,
        fontFamily: T.fm,
        color: T.t3
      }
    }, String(h).padStart(2, '0'), ":00");
  }))), HALLS.map(group => /*#__PURE__*/React.createElement("div", {
    key: group.v
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: 26,
      background: `${T.sf2}`,
      borderBottom: `1px solid ${T.bd}`,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 144,
      padding: '0 12px',
      fontSize: 9.5,
      fontFamily: T.fm,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: T.t3
    }
  }, group.v)), group.h.map(h => /*#__PURE__*/React.createElement("div", {
    key: h.n,
    style: {
      display: 'flex',
      borderBottom: `1px solid ${T.bd}`,
      height: 58
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 144,
      flexShrink: 0,
      borderRight: `1px solid ${T.bd}`,
      padding: '6px 10px',
      background: h.events.some(e => e.conflict) ? 'rgba(220,38,38,0.05)' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: T.t1,
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, h.n.split(' ')[0], h.events.some(e => e.conflict) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: '#DC2626',
      fontFamily: T.fm,
      fontWeight: 700
    }
  }, "!")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.t3,
      fontFamily: T.fm
    }
  }, "cap ", h.cap)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flex: 1,
      overflow: 'hidden'
    }
  }, Array.from({
    length: TOTAL_H
  }, (_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: i * PX,
      width: 1,
      background: T.bd,
      opacity: 0.6
    }
  })), h.events.map((ev, ei) => {
    const st = statusColor[ev.s] || statusColor.enquiry;
    const left = (ev.start - START_H) * PX;
    const width = ev.dur * PX - 3;
    const isHatch = ev.s === 'pencil';
    const bgImg = isHatch ? 'repeating-linear-gradient(45deg,rgba(217,119,6,0.18) 0 6px,transparent 6px 12px)' : undefined;
    const isConflict = ev.conflict;
    return /*#__PURE__*/React.createElement("div", {
      key: ei,
      style: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left,
        width,
        borderLeft: `3px solid ${st.dot}`,
        background: isHatch ? 'transparent' : `color-mix(in oklab,${st.dot} 14%,white)`,
        backgroundImage: bgImg,
        outline: isConflict ? `2px solid #DC2626` : undefined,
        outlineOffset: isConflict ? '-2px' : undefined,
        borderStyle: ev.source === 'google' ? 'dashed' : undefined,
        overflow: 'hidden',
        cursor: 'default'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '3px 6px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        fontWeight: 600,
        color: T.t1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, ev.fn), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9.5,
        fontFamily: T.fm,
        color: T.t3,
        display: 'flex',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", null, ev.start, ":00\u2013", ev.start + ev.dur, ":00"), /*#__PURE__*/React.createElement("span", null, ev.val), ev.exp && /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#D97706'
      }
    }, ev.exp), ev.source === 'google' && /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#0891b2'
      }
    }, "G"))));
  })))))))));
}

// ── ARTBOARD 4 — Bookings Master-Detail ────────────────────────
function BookingsArtboard() {
  const sel = BOOKINGS_DATA[0];
  const TABS = ['Overview', 'Money', 'Packs', 'Halls', 'Payments', 'Versions'];
  const activeTab = 'Overview';
  return /*#__PURE__*/React.createElement(Shell, {
    active: "bookings",
    page: "Bookings"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100%',
      overflow: 'hidden',
      fontFamily: T.ff
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 360,
      flexShrink: 0,
      borderRight: `1px solid ${T.bd}`,
      background: T.sf,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 10,
      borderBottom: `1px solid ${T.bd}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Search bookings, customers\u2026",
    style: {
      width: '100%',
      height: 30,
      padding: '0 10px',
      fontSize: 12,
      border: `1px solid ${T.bd}`,
      borderRadius: 4,
      background: T.bg,
      fontFamily: T.ff,
      color: T.t1,
      outline: 'none'
    },
    readOnly: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2
    }
  }, ['All 42', 'Confirmed', 'Pencil', 'Quotation', 'Enquiry'].map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: s,
    style: {
      padding: '3px 7px',
      fontSize: 10,
      fontFamily: T.fm,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      border: `1px solid ${i === 0 ? T.ac : T.bd}`,
      borderRadius: 3,
      background: i === 0 ? T.ac : 'none',
      color: i === 0 ? '#fff' : T.t3,
      cursor: 'default',
      whiteSpace: 'nowrap'
    }
  }, s)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'hidden'
    }
  }, BOOKINGS_DATA.map((b, i) => {
    const isSel = b.id === sel.id;
    const st = T.st[b.s] || T.st.enquiry;
    return /*#__PURE__*/React.createElement("div", {
      key: b.id,
      style: {
        padding: '10px 12px',
        borderBottom: `1px solid ${T.bd}`,
        background: isSel ? T.acSoft : 'transparent',
        borderLeft: `3px solid ${isSel ? T.ac : 'transparent'}`,
        cursor: 'default'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontFamily: T.fm,
        color: T.t3
      }
    }, b.id), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontFamily: T.fm,
        color: T.t3
      }
    }, b.date)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 500,
        color: T.t1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: 200
      }
    }, b.fn), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontFamily: T.fm,
        fontWeight: 600,
        color: T.t1,
        flexShrink: 0,
        marginLeft: 4
      }
    }, b.total)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: T.t3,
        marginBottom: 5,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, b.cust, " \xB7 ", b.hall), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(StatusBadge, {
      s: b.s,
      small: true
    }), b.exp && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontFamily: T.fm,
        color: T.st.pencil.dot
      }
    }, "exp ", b.exp), b.pct > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 'auto',
        fontSize: 10,
        fontFamily: T.fm,
        color: b.pct === 100 ? '#16A34A' : T.t3
      }
    }, b.pct, "% paid")), b.pct > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        height: 2,
        background: T.sf2,
        borderRadius: 2,
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        background: b.pct === 100 ? '#16A34A' : T.ac,
        borderRadius: 2,
        width: `${b.pct}%`
      }
    })));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: T.bg
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 20px',
      borderBottom: `1px solid ${T.bd}`,
      background: T.sf,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontFamily: T.fm,
      color: T.t3
    }
  }, sel.id), /*#__PURE__*/React.createElement(StatusBadge, {
    s: sel.s
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontFamily: T.fm,
      color: T.t4
    }
  }, "v3"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      padding: '4px 10px',
      fontSize: 11,
      border: `1px solid ${T.bd}`,
      borderRadius: 4,
      background: T.sf,
      color: T.t2,
      cursor: 'default'
    }
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    style: {
      padding: '4px 10px',
      fontSize: 11,
      border: `1px solid ${T.bd}`,
      borderRadius: 4,
      background: T.sf,
      color: T.t2,
      cursor: 'default'
    }
  }, "Print"), /*#__PURE__*/React.createElement("button", {
    style: {
      padding: '4px 10px',
      fontSize: 11,
      border: 'none',
      borderRadius: 4,
      background: T.ac,
      color: '#fff',
      cursor: 'default',
      fontWeight: 500
    }
  }, "Add Payment"))), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: T.t1,
      letterSpacing: '-0.3px'
    }
  }, sel.fn), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: T.t3,
      marginTop: 3
    }
  }, sel.cust, " \xB7 +91 98200 11111 \xB7 ", sel.date, " 2026 \xB7 10:00\u201322:00")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      borderBottom: `1px solid ${T.bd}`,
      background: T.sf,
      padding: '0 20px',
      gap: 2,
      flexShrink: 0
    }
  }, TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    style: {
      padding: '8px 10px',
      fontSize: 11,
      fontFamily: T.fm,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      border: 'none',
      borderBottom: `2px solid ${t === activeTab ? T.ac : 'transparent'}`,
      background: 'none',
      color: t === activeTab ? T.t1 : T.t3,
      cursor: 'default'
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'hidden',
      display: 'grid',
      gridTemplateColumns: '1fr 280px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Section, {
    title: "Customer"
  }, [['Name', 'Ramesh Kapoor'], ['Phone', '+91 98200 31111'], ['Email', 'ramesh@kapoor.com'], ['City', 'Mumbai'], ['Community', 'Sindhi'], ['GST', '—']].map(([k, v]) => /*#__PURE__*/React.createElement(FieldRow, {
    key: k,
    k: k,
    v: v
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "Function"
  }, [['Type', 'Wedding Reception'], ['Expected guests', '350'], ['Confirmed guests', '312'], ['Source', 'in-app']].map(([k, v]) => /*#__PURE__*/React.createElement(FieldRow, {
    key: k,
    k: k,
    v: v
  })))), /*#__PURE__*/React.createElement(Section, {
    title: "Notes"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: T.t2,
      lineHeight: 1.6
    }
  }, "DJ confirmed for 22:00\u201302:00. Floral arch required at entry \u2014 coordinate with Shyam Decorators. Ensure AC is serviced by 10 Jun."))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      borderLeft: `1px solid ${T.bd}`,
      background: `${T.sf2}60`,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: T.sf,
      border: `1px solid ${T.bd}`,
      borderRadius: T.r,
      padding: 14,
      fontFamily: T.fm
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: T.t4,
      marginBottom: 12
    }
  }, "Money stack"), [{
    k: 'Hall charges',
    v: '₹2,50,000'
  }, {
    k: 'Reception pack ×350',
    v: '₹7,00,000'
  }, {
    k: 'DJ setup',
    v: '₹75,000'
  }, {
    k: 'Subtotal',
    v: '₹10,25,000',
    sep: true
  }, {
    k: 'Discount',
    v: '− ₹25,000',
    c: '#DC2626'
  }, {
    k: 'GST 18%',
    v: '+ ₹1,80,000'
  }, {
    k: 'Grand Total',
    v: '₹11,80,000',
    bold: true,
    sep: true
  }, {
    k: 'Advance req.',
    v: '₹3,00,000'
  }, {
    k: 'Received',
    v: '₹3,60,958',
    c: '#16A34A'
  }, {
    k: 'Balance',
    v: '₹8,19,042',
    c: '#DC2626',
    bold: true
  }].map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, r.sep && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: T.bd,
      margin: '7px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.t3,
      textTransform: 'uppercase',
      fontSize: 9.5,
      letterSpacing: '0.04em'
    }
  }, r.k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: r.bold ? 700 : 400,
      color: r.c || T.t1
    }
  }, r.v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 5,
      background: T.sf2,
      borderRadius: 3,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: '#16A34A',
      borderRadius: 3,
      width: '31%'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.t3,
      textAlign: 'right',
      marginTop: 4
    }
  }, "31% paid")))))));
}
function Section({
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: T.t4,
      fontFamily: T.fm,
      marginBottom: 8
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, children));
}
function FieldRow({
  k,
  v
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderLeft: `2px solid ${T.bd}`,
      paddingLeft: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: T.t4,
      fontFamily: T.fm
    }
  }, k), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: T.t1
    }
  }, v));
}
Object.assign(window, {
  BeforeArtboard,
  AfterDashArtboard,
  CalendarArtboard,
  BookingsArtboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "mockups/screens.jsx", error: String((e && e.message) || e) }); }

// mockups/shared.jsx
try { (() => {
// shared.jsx — tokens, shell components, primitives
// Exported to window for use in screens.jsx

// ── New design tokens (warm stone + teal) ──────────────────────
const T = {
  bg: '#FAFAF9',
  sf: '#FFFFFF',
  sf2: '#F5F5F4',
  sf3: '#EFEDEA',
  bd: '#EBE9E6',
  bd2: '#D1CEC9',
  t1: '#1C1917',
  t2: '#44403C',
  t3: '#78716C',
  t4: '#A8A29E',
  ac: '#0F766E',
  acSoft: '#F0FDFA',
  acHover: '#0D5F58',
  ff: '"Inter Tight", ui-sans-serif, sans-serif',
  fm: '"JetBrains Mono", ui-monospace, monospace',
  r: 4,
  st: {
    confirmed: {
      bg: '#DCFCE7',
      fg: '#14532D',
      dot: '#16A34A',
      l: 'Confirmed'
    },
    pencil: {
      bg: '#FEF3C7',
      fg: '#78350F',
      dot: '#D97706',
      l: 'Pencil'
    },
    quotation: {
      bg: '#DBEAFE',
      fg: '#1E3A8A',
      dot: '#2563EB',
      l: 'Quotation'
    },
    enquiry: {
      bg: '#E0F2FE',
      fg: '#075985',
      dot: '#0284C7',
      l: 'Enquiry'
    },
    won: {
      bg: '#DCFCE7',
      fg: '#14532D',
      dot: '#16A34A',
      l: 'Won'
    },
    lost: {
      bg: '#FEE2E2',
      fg: '#7F1D1D',
      dot: '#DC2626',
      l: 'Lost'
    }
  }
};

// ── Codebase tokens (cool zinc + blue) ─────────────────────────
const CB = {
  bg: '#fafafa',
  sf: '#ffffff',
  sf2: '#f4f4f5',
  bd: '#e4e4e7',
  bd2: '#d4d4d8',
  t1: '#18181b',
  t2: '#3f3f46',
  t3: '#71717a',
  t4: '#a1a1aa',
  ac: '#2563eb',
  ff: '"IBM Plex Sans", ui-sans-serif, sans-serif',
  fm: '"IBM Plex Mono", ui-monospace, monospace',
  st: {
    confirmed: '#059669',
    pencil: '#d97706',
    quotation: '#7c3aed',
    enquiry: '#71717a'
  }
};

// ── Status badge — new filled style ────────────────────────────
function StatusBadge({
  s,
  small
}) {
  const st = T.st[s] || {
    bg: T.sf2,
    fg: T.t2,
    dot: T.t3,
    l: s
  };
  const fs = small ? 9.5 : 10.5;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: st.bg,
      color: st.fg,
      borderRadius: 3,
      padding: small ? '1px 5px' : '2px 7px',
      fontSize: fs,
      fontFamily: T.fm,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      lineHeight: 1.5,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: st.dot,
      flexShrink: 0
    }
  }), st.l);
}

// ── Old status badge — codebase border-only style ───────────────
function OldBadge({
  s
}) {
  const c = CB.st[s] || CB.t3;
  const l = s.charAt(0).toUpperCase() + s.slice(1);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: CB.fm,
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      padding: '0 4px',
      lineHeight: '16px',
      color: c,
      border: `1px solid ${c}`,
      whiteSpace: 'nowrap'
    }
  }, l);
}

// ── Sparkline SVG ───────────────────────────────────────────────
function Sparkline({
  data,
  color,
  h = 22,
  w = 60
}) {
  const max = Math.max(...data),
    min = Math.min(...data),
    range = Math.max(max - min, 1);
  const pts = data.map((v, i) => `${i / (data.length - 1) * w},${h - 2 - (v - min) / range * (h - 4) + 2}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return /*#__PURE__*/React.createElement("svg", {
    width: w,
    height: h,
    viewBox: `0 0 ${w} ${h}`,
    style: {
      display: 'block',
      overflow: 'visible'
    }
  }, /*#__PURE__*/React.createElement("polygon", {
    points: area,
    fill: color,
    opacity: 0.14
  }), /*#__PURE__*/React.createElement("polyline", {
    points: pts,
    fill: "none",
    stroke: color,
    strokeWidth: "1.5",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }));
}

// ── Nav data ────────────────────────────────────────────────────
const MAIN_NAV = [{
  id: 'dashboard',
  l: 'Dashboard'
}, {
  id: 'bookings',
  l: 'Bookings',
  badge: 42
}, {
  id: 'calendar',
  l: 'Calendar'
}, {
  id: 'enquiries',
  l: 'Enquiries',
  badge: 12
}, {
  id: 'customers',
  l: 'Customers'
}, {
  id: 'payments',
  l: 'Payments',
  badge: 3
}];
const OPS_NAV = [{
  id: 'venues',
  l: 'Venues'
}, {
  id: 'menu',
  l: 'Menu & Items'
}, {
  id: 'reports',
  l: 'Reports'
}, {
  id: 'activity',
  l: 'Activity'
}, {
  id: 'settings',
  l: 'Settings'
}];
const CB_NAV = ['Timeline', 'Bookings', 'Customers', 'Enquiries', 'Venues', 'Menu', 'Payments', 'Reports', 'Activity', 'Settings'];

// ── New sidebar nav item ────────────────────────────────────────
function NavItem({
  item,
  active
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '7px 12px',
      fontSize: 12.5,
      fontFamily: T.ff,
      cursor: 'default',
      userSelect: 'none',
      color: active ? T.ac : T.t2,
      background: active ? T.acSoft : 'transparent',
      borderLeft: `2px solid ${active ? T.ac : 'transparent'}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontWeight: active ? 500 : 400
    }
  }, item.l), item.badge != null && /*#__PURE__*/React.createElement("span", {
    style: {
      background: active ? T.ac : T.sf2,
      color: active ? '#fff' : T.t3,
      borderRadius: 3,
      padding: '0 5px',
      fontSize: 10,
      fontFamily: T.fm,
      fontWeight: 600,
      lineHeight: '16px'
    }
  }, item.badge));
}

// ── New Shell (sidebar + topbar) ────────────────────────────────
function Shell({
  active = 'dashboard',
  page = 'Dashboard',
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100%',
      width: '100%',
      background: T.bg,
      fontFamily: T.ff,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 220,
      flexShrink: 0,
      height: '100%',
      background: T.sf,
      borderRight: `1px solid ${T.bd}`,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 12px',
      borderBottom: `1px solid ${T.bd}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      background: T.ac,
      borderRadius: 3,
      display: 'grid',
      placeItems: 'center',
      color: '#fff',
      fontWeight: 700,
      fontSize: 14,
      fontFamily: T.fm
    }
  }, "B"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 13,
      color: T.t1,
      letterSpacing: '-0.2px'
    }
  }, "Bika Banquet")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      paddingTop: 8,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 12px 4px',
      fontSize: 9.5,
      fontFamily: T.fm,
      color: T.t4,
      letterSpacing: '0.09em',
      textTransform: 'uppercase'
    }
  }, "Operate"), MAIN_NAV.map(it => /*#__PURE__*/React.createElement(NavItem, {
    key: it.id,
    item: it,
    active: it.id === active
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 12px 4px',
      fontSize: 9.5,
      fontFamily: T.fm,
      color: T.t4,
      letterSpacing: '0.09em',
      textTransform: 'uppercase'
    }
  }, "Catalog"), OPS_NAV.map(it => /*#__PURE__*/React.createElement(NavItem, {
    key: it.id,
    item: it,
    active: it.id === active
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 12px',
      borderTop: `1px solid ${T.bd}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: T.ac,
      display: 'grid',
      placeItems: 'center',
      color: '#fff',
      fontSize: 10,
      fontWeight: 600,
      fontFamily: T.fm,
      flexShrink: 0
    }
  }, "PN"), /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: T.t1,
      whiteSpace: 'nowrap'
    }
  }, "Priya Nambiar"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.t3,
      whiteSpace: 'nowrap'
    }
  }, "Operations Lead \xB7 Andheri")))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      height: 48,
      flexShrink: 0,
      background: T.sf,
      borderBottom: `1px solid ${T.bd}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      display: 'grid',
      placeItems: 'center',
      border: `1px solid ${T.bd}`,
      borderRadius: 4,
      fontSize: 14,
      color: T.t3,
      cursor: 'default',
      flexShrink: 0
    }
  }, "\u2261"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 12,
      fontFamily: T.ff,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.t3
    }
  }, "Bika Banquets"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.t4,
      margin: '0 1px'
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.t1,
      fontWeight: 500
    }
  }, page)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 320,
      margin: '0 auto',
      height: 30,
      background: T.sf2,
      border: `1px solid ${T.bd}`,
      borderRadius: 4,
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      gap: 6,
      color: T.t3,
      fontSize: 11.5
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u2315"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Search bookings, customers, halls\u2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: T.fm,
      fontSize: 10,
      background: T.sf,
      border: `1px solid ${T.bd}`,
      borderRadius: 2,
      padding: '1px 5px'
    }
  }, "\u2318K")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 11,
      color: '#16A34A',
      fontFamily: T.fm,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: '#16A34A',
      display: 'inline-block'
    }
  }), "Live"), /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.3,
      textAlign: 'right',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: T.fm,
      fontSize: 10,
      color: T.t2
    }
  }, "14:32:09"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: T.t4,
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    }
  }, "Mumbai")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      display: 'grid',
      placeItems: 'center',
      border: `1px solid ${T.bd}`,
      borderRadius: 4,
      fontSize: 13,
      color: T.t2,
      cursor: 'default',
      flexShrink: 0
    }
  }, "\u263E"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: T.ac,
      display: 'grid',
      placeItems: 'center',
      color: '#fff',
      fontSize: 10,
      fontWeight: 600,
      fontFamily: T.fm,
      flexShrink: 0
    }
  }, "PN")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'hidden'
    }
  }, children)));
}

// ── Old Codebase Shell (top-nav, zinc) ──────────────────────────
function BeforeShell({
  active = 'Timeline',
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: CB.bg,
      fontFamily: CB.ff,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      height: 44,
      flexShrink: 0,
      background: CB.bg,
      borderBottom: `1px solid ${CB.bd}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 12,
      height: 12,
      background: CB.ac
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: CB.fm,
      fontWeight: 500,
      fontSize: 11,
      color: CB.t1
    }
  }, "BIKA_OPS"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: CB.fm,
      fontSize: 10,
      color: CB.t4
    }
  }, "v2.4")), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      flex: 1,
      overflow: 'hidden'
    }
  }, CB_NAV.map(item => /*#__PURE__*/React.createElement("div", {
    key: item,
    style: {
      padding: '0 9px',
      height: 44,
      display: 'flex',
      alignItems: 'center',
      fontSize: 11,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: item === active ? CB.t1 : CB.t3,
      whiteSpace: 'nowrap',
      cursor: 'default',
      borderBottom: `2px solid ${item === active ? CB.ac : 'transparent'}`
    }
  }, item))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 28,
      padding: '0 8px',
      background: CB.sf,
      border: `1px solid ${CB.bd}`,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      color: CB.t3,
      fontSize: 11,
      minWidth: 160
    }
  }, /*#__PURE__*/React.createElement("span", null, "Jump to\u2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontFamily: CB.fm,
      fontSize: 10,
      border: `1px solid ${CB.bd}`,
      padding: '0 4px'
    }
  }, "\u2318K")), /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.3,
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: CB.fm,
      fontSize: 10,
      color: CB.t2
    }
  }, "14:32:09"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: CB.t4,
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    }
  }, "Mumbai")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      display: 'grid',
      placeItems: 'center',
      border: `1px solid ${CB.bd}`,
      fontSize: 13,
      color: CB.t3,
      cursor: 'default'
    }
  }, "\u263E"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      background: CB.sf2,
      border: `1px solid ${CB.bd}`,
      display: 'grid',
      placeItems: 'center',
      fontFamily: CB.fm,
      fontSize: 10,
      color: CB.t2
    }
  }, "SI"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'hidden'
    }
  }, children));
}

// ── export to window ────────────────────────────────────────────
Object.assign(window, {
  T,
  CB,
  StatusBadge,
  OldBadge,
  Sparkline,
  NavItem,
  Shell,
  BeforeShell,
  MAIN_NAV,
  OPS_NAV,
  CB_NAV
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "mockups/shared.jsx", error: String((e && e.message) || e) }); }

// src/components.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Shared components for Bika Banquet prototype
const {
  useState,
  useEffect,
  useMemo,
  useRef
} = React;
const Icon = ({
  name,
  size = 14,
  ...p
}) => /*#__PURE__*/React.createElement("i", _extends({
  "data-lucide": name,
  style: {
    width: size,
    height: size
  }
}, p));
function fmtINR(n, {
  compact = false
} = {}) {
  if (n == null) return '—';
  if (compact) {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2).replace(/\.0+$/, '') + 'Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(2).replace(/\.0+$/, '') + 'L';
    if (n >= 1000) return '₹' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return '₹' + n.toLocaleString('en-IN');
}
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
}
function fmtDay(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short'
  });
}
const STATUS_LBL = {
  confirmed: 'Confirmed',
  pencil: 'Pencil',
  quotation: 'Quotation',
  enquiry: 'Enquiry',
  cancelled: 'Cancelled'
};
function StatusBadge({
  s
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "st " + s
  }, /*#__PURE__*/React.createElement("span", {
    className: "d"
  }), STATUS_LBL[s] || s);
}
function Sparkline({
  data,
  color = 'var(--accent)',
  height = 24
}) {
  const w = 80;
  const max = Math.max(...data),
    min = Math.min(...data);
  const range = Math.max(max - min, 1);
  const pts = data.map((v, i) => {
    const x = i / (data.length - 1) * w;
    const y = height - (v - min) / range * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const areaPts = `0,${height} ${pts} ${w},${height}`;
  const gid = 'sg-' + Math.random().toString(36).slice(2, 8);
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${w} ${height}`,
    preserveAspectRatio: "none"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.18"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("polygon", {
    points: areaPts,
    fill: `url(#${gid})`
  }), /*#__PURE__*/React.createElement("polyline", {
    points: pts,
    fill: "none",
    stroke: color,
    strokeWidth: "1.5",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }));
}
function KpiTile({
  label,
  value,
  unit,
  delta,
  deltaDir,
  spark,
  sparkColor
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "kpi"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "val"
  }, value, unit && /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, unit), delta != null && /*#__PURE__*/React.createElement("span", {
    className: "delta " + (deltaDir === 'up' ? 'up' : 'down')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: deltaDir === 'up' ? 'trending-up' : 'trending-down',
    size: 11
  }), delta)), /*#__PURE__*/React.createElement("div", {
    className: "spark"
  }, /*#__PURE__*/React.createElement(Sparkline, {
    data: spark,
    color: sparkColor || 'var(--accent)'
  })));
}
function BarChart({
  data,
  color = 'var(--accent)'
}) {
  const max = Math.max(...data.map(d => d.v));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 6,
      height: 140,
      padding: '10px 4px 0'
    }
  }, data.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 32,
      height: `${d.v / max * 100}%`,
      background: `linear-gradient(180deg, ${color}, color-mix(in oklch, ${color} 70%, transparent))`,
      borderRadius: '3px 3px 0 0',
      minHeight: 4
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: 'var(--text-4)'
    }
  }, d.l))));
}
function DonutChart({
  segments,
  size = 120,
  stroke = 14
}) {
  const cx = size / 2,
    cy = size / 2,
    r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.v, 0);
  let acc = 0;
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size
  }, /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r,
    fill: "none",
    stroke: "var(--surface-2)",
    strokeWidth: stroke
  }), segments.map((s, i) => {
    const len = s.v / total * C;
    const offset = -acc;
    acc += len;
    return /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: cx,
      cy: cy,
      r: r,
      fill: "none",
      stroke: s.color,
      strokeWidth: stroke,
      strokeDasharray: `${len} ${C}`,
      strokeDashoffset: offset,
      transform: `rotate(-90 ${cx} ${cy})`,
      strokeLinecap: "butt"
    });
  }), /*#__PURE__*/React.createElement("text", {
    x: cx,
    y: cy - 4,
    textAnchor: "middle",
    fontSize: "11",
    fill: "var(--text-4)"
  }, "Total"), /*#__PURE__*/React.createElement("text", {
    x: cx,
    y: cy + 12,
    textAnchor: "middle",
    fontSize: "14",
    fontWeight: "700",
    fill: "var(--text-1)"
  }, total));
}
function SegBar({
  value,
  max,
  segments
}) {
  let acc = 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: 6,
      borderRadius: 999,
      overflow: 'hidden',
      background: 'var(--surface-2)'
    }
  }, segments.map((s, i) => {
    const w = s.v / max * 100;
    acc += w;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        width: w + '%',
        background: s.color
      }
    });
  }));
}
window.fmtINR = fmtINR;
window.fmtDate = fmtDate;
window.fmtDay = fmtDay;
window.STATUS_LBL = STATUS_LBL;
window.Icon = Icon;
window.StatusBadge = StatusBadge;
window.Sparkline = Sparkline;
window.KpiTile = KpiTile;
window.BarChart = BarChart;
window.DonutChart = DonutChart;
window.SegBar = SegBar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/components.jsx", error: String((e && e.message) || e) }); }

// src/data.js
try { (() => {
// Mock data for Bika Banquet prototype
window.BIKA = function () {
  const halls = [{
    id: 'H1',
    name: 'Grand Ballroom',
    cap: 800,
    tier: 'Premium'
  }, {
    id: 'H2',
    name: 'Crystal Hall',
    cap: 450,
    tier: 'Premium'
  }, {
    id: 'H3',
    name: 'Heritage Hall',
    cap: 600,
    tier: 'Standard'
  }, {
    id: 'H4',
    name: 'Garden Pavilion',
    cap: 250,
    tier: 'Outdoor'
  }, {
    id: 'H5',
    name: 'Emerald Suite',
    cap: 150,
    tier: 'Compact'
  }];
  const customers = [{
    id: 'CUS-1142',
    name: 'Aarav & Diya Sharma',
    phone: '+91 98201 23456',
    city: 'Mumbai',
    bookings: 3,
    value: 1850000,
    since: '2024'
  }, {
    id: 'CUS-1098',
    name: 'Rohan Mehta',
    phone: '+91 99812 44091',
    city: 'Pune',
    bookings: 1,
    value: 425000,
    since: '2026'
  }, {
    id: 'CUS-1077',
    name: 'Kavya Iyer',
    phone: '+91 98330 11267',
    city: 'Bengaluru',
    bookings: 2,
    value: 680000,
    since: '2025'
  }, {
    id: 'CUS-1056',
    name: 'The Patel Family',
    phone: '+91 90041 88822',
    city: 'Surat',
    bookings: 6,
    value: 4250000,
    since: '2022'
  }, {
    id: 'CUS-1042',
    name: 'Sneha Reddy',
    phone: '+91 80850 90021',
    city: 'Hyderabad',
    bookings: 1,
    value: 320000,
    since: '2026'
  }, {
    id: 'CUS-1039',
    name: 'Vikram Singh',
    phone: '+91 70422 18370',
    city: 'Delhi',
    bookings: 2,
    value: 940000,
    since: '2024'
  }, {
    id: 'CUS-1021',
    name: 'Anaya Gupta',
    phone: '+91 99809 24400',
    city: 'Mumbai',
    bookings: 1,
    value: 290000,
    since: '2026'
  }, {
    id: 'CUS-1014',
    name: 'Karthik Subramaniam',
    phone: '+91 96770 50221',
    city: 'Chennai',
    bookings: 4,
    value: 2110000,
    since: '2023'
  }];

  // Generated bookings, mostly for next 60 days
  const today = new Date('2026-05-28');
  function fmtDay(d) {
    return d.toISOString().slice(0, 10);
  }
  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  const fnTypes = ['Wedding Reception', 'Sangeet', 'Engagement', 'Corporate Gala', 'Birthday', 'Anniversary', 'Mehendi', 'Haldi', 'Conference', 'Product Launch'];
  const statuses = ['confirmed', 'confirmed', 'confirmed', 'pencil', 'pencil', 'quotation', 'enquiry', 'cancelled'];
  function rand(n) {
    return Math.floor(Math.random() * n);
  }
  let seed = 7;
  function srand() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  function pick(arr) {
    return arr[Math.floor(srand() * arr.length)];
  }
  const bookings = [];
  for (let i = 0; i < 64; i++) {
    const cust = pick(customers);
    const hall = pick(halls);
    const offset = Math.floor(srand() * 60) - 8;
    const date = addDays(today, offset);
    const guests = 80 + Math.floor(srand() * 600);
    const total = guests * (900 + Math.floor(srand() * 1400));
    const advance = Math.floor(total * (0.2 + srand() * 0.7));
    const status = pick(statuses);
    bookings.push({
      id: 'BK-' + (24300 + i),
      ref: 'BK-' + (24300 + i),
      customerId: cust.id,
      customer: cust.name,
      phone: cust.phone,
      function: pick(fnTypes),
      date: fmtDay(date),
      time: pick(['11:00', '17:00', '19:00', '19:30', '20:00']),
      hall: hall.name,
      hallId: hall.id,
      guests,
      total,
      advance,
      balance: total - advance,
      status,
      created: fmtDay(addDays(date, -(20 + Math.floor(srand() * 40))))
    });
  }
  bookings.sort((a, b) => a.date.localeCompare(b.date));
  const enquiries = [];
  for (let i = 0; i < 18; i++) {
    enquiries.push({
      id: 'EN-' + (8810 + i),
      customer: pick(customers).name,
      phone: '+91 9' + (1000000000 + Math.floor(srand() * 999999999)).toString().slice(0, 9),
      function: pick(fnTypes),
      date: fmtDay(addDays(today, 5 + Math.floor(srand() * 120))),
      guests: 100 + Math.floor(srand() * 500),
      source: pick(['Website', 'Walk-in', 'Referral', 'WhatsApp', 'Just Dial']),
      assignee: pick(['Priya N.', 'Rahul S.', 'Ananya K.', 'Sameer V.']),
      age: pick(['2h', '5h', '1d', '2d', '4d', '1w']),
      score: pick(['Hot', 'Warm', 'Cold'])
    });
  }
  const payments = [];
  bookings.filter(b => b.advance > 0).slice(0, 30).forEach((b, i) => {
    payments.push({
      id: 'PMT-' + (5500 + i),
      bookingId: b.id,
      customer: b.customer,
      method: pick(['UPI', 'NEFT', 'Cash', 'Card', 'Cheque']),
      amount: b.advance,
      date: b.created,
      type: 'Advance',
      status: 'Cleared'
    });
  });
  const insights = [{
    kind: 'good',
    ttl: 'Bookings ahead of last quarter',
    sub: 'Q3 confirmed bookings up 18.4% vs Q2. Wedding season early.'
  }, {
    kind: 'warn',
    ttl: '4 pencil bookings expiring this week',
    sub: '₹14.2L of provisional revenue at risk. Send follow-ups.'
  }, {
    kind: 'info',
    ttl: 'Crystal Hall has 11 open weekends',
    sub: 'Lowest utilization in your portfolio for Jun–Aug.'
  }, {
    kind: 'bad',
    ttl: 'Outstanding balance over 30 days: ₹6.8L',
    sub: '3 customers, 4 bookings. Priority follow-up advised.'
  }];
  return {
    halls,
    customers,
    bookings,
    enquiries,
    payments,
    insights,
    today,
    fmtDay,
    addDays
  };
}();
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/data.js", error: String((e && e.message) || e) }); }

// src/live.js
try { (() => {
// Live activity feed generator
window.createActivityFeed = function (setActivity, isLive) {
  const templates = [{
    kind: 'confirmed',
    who: 'Priya N.',
    action: 'confirmed booking',
    target: 'BK-24319',
    detail: 'Aarav & Diya Sharma · Grand Ballroom · ₹3.8L'
  }, {
    kind: 'payment',
    who: 'Rahul S.',
    action: 'recorded payment',
    target: '₹85,000',
    detail: 'UPI · BK-24312 advance'
  }, {
    kind: 'enquiry',
    who: 'Ananya K.',
    action: 'logged enquiry',
    target: 'EN-8821',
    detail: 'Wedding · 380 pax · Jun 2026 · Hot'
  }, {
    kind: 'confirmed',
    who: 'Sameer V.',
    action: 'updated status',
    target: 'BK-24307',
    detail: 'Pencil → Confirmed · Heritage Hall'
  }, {
    kind: 'payment',
    who: 'Priya N.',
    action: 'recorded payment',
    target: '₹1.20L',
    detail: 'NEFT · BK-24301 balance partial'
  }, {
    kind: 'enquiry',
    who: 'Rahul S.',
    action: 'sent quotation',
    target: 'BK-24317',
    detail: 'Quotation v3 emailed to Mehta'
  }, {
    kind: 'cancel',
    who: 'System',
    action: 'cancelled booking',
    target: 'BK-24289',
    detail: 'Customer request · refund initiated'
  }, {
    kind: 'confirmed',
    who: 'Ananya K.',
    action: 'created booking',
    target: 'BK-24321',
    detail: 'Karthik Subramaniam · Sangeet · Emerald Suite'
  }, {
    kind: 'payment',
    who: 'Sameer V.',
    action: 'cleared advance',
    target: '₹45,000',
    detail: 'Cash · BK-24315 token payment'
  }, {
    kind: 'enquiry',
    who: 'System',
    action: 'received walk-in',
    target: 'EN-8822',
    detail: 'Corporate event · 200 pax · Patel Family referral'
  }];
  const timeLabels = ['just now', '1m ago', '2m ago', '3m ago', '5m ago', '8m ago', '12m ago', '18m ago', '24m ago', '31m ago', '45m ago', '1h ago'];
  let idx = 0;
  let counter = 1000;

  // Seed initial activity
  const initial = templates.map((t, i) => ({
    ...t,
    id: counter++,
    time: timeLabels[Math.min(i, timeLabels.length - 1)],
    fresh: false
  }));
  setActivity(initial);
  if (!isLive) return null;

  // Age existing items on each tick
  function tick(live) {
    if (!live) return;
    setActivity(prev => {
      // Roll time labels forward
      const aged = prev.map((a, i) => ({
        ...a,
        fresh: false,
        time: timeLabels[Math.min(i + 1, timeLabels.length - 1)]
      }));
      // 35% chance of a new event
      if (Math.random() < 0.35) {
        const t = templates[Math.floor(Math.random() * templates.length)];
        const fresh = {
          ...t,
          id: counter++,
          time: 'just now',
          fresh: true
        };
        return [fresh, ...aged].slice(0, 18);
      }
      return aged.slice(0, 18);
    });
  }
  return tick;
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/live.js", error: String((e && e.message) || e) }); }

// src/screens/Bookings.jsx
try { (() => {
// Bookings list + detail side-sheet
function Bookings({
  openSheetForBookingId,
  sheetBookingId,
  closeSheet,
  onNew
}) {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({
    status: null,
    hall: null,
    range: 'next30'
  });
  useEffect(() => {
    const handler = () => onNew();
    window.addEventListener('bika:new-booking', handler);
    return () => window.removeEventListener('bika:new-booking', handler);
  }, [onNew]);
  const list = useMemo(() => {
    let xs = BIKA.bookings;
    if (tab !== 'all') xs = xs.filter(b => b.status === tab);
    if (q) {
      const Q = q.toLowerCase();
      xs = xs.filter(b => b.customer.toLowerCase().includes(Q) || b.ref.toLowerCase().includes(Q) || b.function.toLowerCase().includes(Q));
    }
    if (filters.hall) xs = xs.filter(b => b.hallId === filters.hall);
    return xs;
  }, [tab, q, filters]);
  const counts = {
    all: BIKA.bookings.length,
    confirmed: BIKA.bookings.filter(b => b.status === 'confirmed').length,
    pencil: BIKA.bookings.filter(b => b.status === 'pencil').length,
    quotation: BIKA.bookings.filter(b => b.status === 'quotation').length,
    enquiry: BIKA.bookings.filter(b => b.status === 'enquiry').length
  };
  const sheetBooking = sheetBookingId ? BIKA.bookings.find(b => b.id === sheetBookingId) : null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "page",
    style: {
      paddingTop: 14,
      paddingBottom: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Bookings"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, counts.all, " total \xB7 ", counts.confirmed, " confirmed \xB7 ", counts.pencil, " pencil")), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 13
  }), "Export"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: onNew
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), "New booking"))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      overflow: 'visible'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "toolbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tab-bar"
  }, [['all', 'All', counts.all], ['confirmed', 'Confirmed', counts.confirmed], ['pencil', 'Pencil', counts.pencil], ['quotation', 'Quotation', counts.quotation], ['enquiry', 'Enquiry', counts.enquiry]].map(([id, lbl, n]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    className: "tab " + (tab === id ? 'active' : ''),
    onClick: () => setTab(id)
  }, lbl, /*#__PURE__*/React.createElement("span", {
    className: "count"
  }, n)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 13,
    style: {
      position: 'absolute',
      left: 8,
      top: 8,
      color: 'var(--text-4)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Filter bookings\u2026",
    style: {
      height: 28,
      padding: '0 10px 0 26px',
      border: '1px solid var(--border-2)',
      borderRadius: 6,
      background: 'var(--surface-2)',
      width: 220,
      fontSize: 12.5,
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("button", {
    className: "chip " + (filters.hall ? 'on' : ''),
    onClick: () => setFilters(f => ({
      ...f,
      hall: f.hall ? null : 'H1'
    }))
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "building-2"
  }), "Hall: ", filters.hall ? BIKA.halls.find(h => h.id === filters.hall).name : 'Any'), /*#__PURE__*/React.createElement("button", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar"
  }), "Next 30 days"), /*#__PURE__*/React.createElement("button", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 11
  }), "Add filter"), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Density"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "rows-3",
    size: 14
  })), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Columns"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "columns-3",
    size: 14
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: 'auto',
      maxHeight: 'calc(100vh - 240px)'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Ref"), /*#__PURE__*/React.createElement("th", null, "Customer / Function"), /*#__PURE__*/React.createElement("th", null, "Date"), /*#__PURE__*/React.createElement("th", null, "Hall"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Guests"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Total"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Balance"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, list.map(b => /*#__PURE__*/React.createElement("tr", {
    key: b.id,
    className: "st-" + b.status + (sheetBookingId === b.id ? ' selected' : ''),
    onClick: () => openSheetForBookingId(b.id),
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("td", {
    className: "id"
  }, b.ref), /*#__PURE__*/React.createElement("td", {
    className: "main"
  }, /*#__PURE__*/React.createElement("div", null, b.customer), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)'
    }
  }, b.function)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", null, fmtDate(b.date)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)'
    }
  }, b.time, " \xB7 ", fmtDay(b.date))), /*#__PURE__*/React.createElement("td", null, b.hall), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, b.guests), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "money"
  }, fmtINR(b.total, {
    compact: true
  }))), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "money " + (b.balance > 0 ? 'warn' : 'pos')
  }, fmtINR(b.balance, {
    compact: true
  }))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(StatusBadge, {
    s: b.status
  })), /*#__PURE__*/React.createElement("td", {
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "row-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Open"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "external-link",
    size: 13
  })), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "More"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "more-horizontal",
    size: 13
  }))))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 14px',
      borderTop: '1px solid var(--border)',
      fontSize: 12,
      color: 'var(--text-3)',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, list.length, " bookings"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "J"), " Next  \xA0", /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "K"), " Prev  \xA0", /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "\u21B5"), " Open"))), sheetBooking && /*#__PURE__*/React.createElement(BookingSheet, {
    booking: sheetBooking,
    onClose: closeSheet
  }));
}
function BookingSheet({
  booking: b,
  onClose
}) {
  const [tab, setTab] = useState('overview');
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "sheet-scrim",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "sheet"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sheet-head"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "code",
    style: {
      color: 'var(--text-3)'
    }
  }, b.ref), /*#__PURE__*/React.createElement(StatusBadge, {
    s: b.status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginTop: 4,
      letterSpacing: '-0.01em'
    }
  }, b.function, " \xB7 ", b.customer)), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Edit"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pencil",
    size: 14
  })), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "More"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "more-horizontal",
    size: 14
  })), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    onClick: onClose,
    title: "Close"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 14
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 0,
      padding: '0 16px',
      borderBottom: '1px solid var(--border)'
    }
  }, ['overview', 'menu', 'payments', 'timeline', 'files'].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTab(t),
    style: {
      border: 0,
      background: 'transparent',
      padding: '10px 12px',
      fontSize: 12.5,
      fontWeight: 500,
      cursor: 'pointer',
      color: tab === t ? 'var(--text-1)' : 'var(--text-3)',
      borderBottom: '2px solid ' + (tab === t ? 'var(--accent)' : 'transparent'),
      textTransform: 'capitalize'
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    className: "sheet-body"
  }, tab === 'overview' && /*#__PURE__*/React.createElement(SheetOverview, {
    b: b
  }), tab === 'menu' && /*#__PURE__*/React.createElement(SheetMenu, {
    b: b
  }), tab === 'payments' && /*#__PURE__*/React.createElement(SheetPayments, {
    b: b
  }), tab === 'timeline' && /*#__PURE__*/React.createElement(SheetTimeline, {
    b: b
  }), tab === 'files' && /*#__PURE__*/React.createElement(SheetFiles, null)), /*#__PURE__*/React.createElement("div", {
    className: "sheet-foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-text",
    size: 13
  }), "Quotation PDF"), /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "message-circle",
    size: 13
  }), "WhatsApp"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 13
  }), "Cancel booking"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }), "Confirm"))));
}
function KV({
  k,
  v,
  mono
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '6px 0',
      borderBottom: '1px dashed var(--divider)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em',
      fontWeight: 600
    }
  }, k), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-1)',
      fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      fontVariantNumeric: 'tabular-nums'
    }
  }, v));
}
function SheetOverview({
  b
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 14,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, "Grand total"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      marginTop: 4,
      letterSpacing: '-0.02em'
    }
  }, fmtINR(b.total))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, "Advance"), /*#__PURE__*/React.createElement("div", {
    className: "money pos",
    style: {
      fontSize: 20,
      fontWeight: 700,
      marginTop: 4
    }
  }, fmtINR(b.advance))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, "Balance"), /*#__PURE__*/React.createElement("div", {
    className: "money " + (b.balance > 0 ? 'warn' : 'pos'),
    style: {
      fontSize: 20,
      fontWeight: 700,
      marginTop: 4
    }
  }, fmtINR(b.balance))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      color: 'var(--text-3)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Collection"), /*#__PURE__*/React.createElement("span", null, Math.round(b.advance / b.total * 100), "% received")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(SegBar, {
    value: b.advance,
    max: b.total,
    segments: [{
      v: b.advance,
      color: 'var(--accent)'
    }]
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      marginBottom: 4
    }
  }, "Event details"), /*#__PURE__*/React.createElement(KV, {
    k: "Function date",
    v: `${fmtDate(b.date)} · ${b.time}`
  }), /*#__PURE__*/React.createElement(KV, {
    k: "Hall",
    v: b.hall
  }), /*#__PURE__*/React.createElement(KV, {
    k: "Expected guests",
    v: b.guests
  }), /*#__PURE__*/React.createElement(KV, {
    k: "Booking type",
    v: "Lunch + Dinner \xB7 2 slots"
  }), /*#__PURE__*/React.createElement(KV, {
    k: "Created",
    v: fmtDate(b.created)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      marginBottom: 4
    }
  }, "Customer"), /*#__PURE__*/React.createElement(KV, {
    k: "Name",
    v: b.customer
  }), /*#__PURE__*/React.createElement(KV, {
    k: "Customer ID",
    v: b.customerId,
    mono: true
  }), /*#__PURE__*/React.createElement(KV, {
    k: "Phone",
    v: b.phone,
    mono: true
  }), /*#__PURE__*/React.createElement(KV, {
    k: "Referred by",
    v: "Patel Family (CUS-1056)"
  })));
}
function SheetMenu({
  b
}) {
  const packs = [{
    name: 'Welcome (5 PM – 7 PM)',
    items: ['Pani Puri Station', 'Chaat Counter', 'Mocktail Bar', 'Mini Samosa', 'Tikki Trio']
  }, {
    name: 'Main Dinner (8 PM – 10 PM)',
    items: ['Paneer Tikka Lazeez', 'Murgh Malai', 'Dal Bukhara', 'Tandoori Roti / Kulcha', 'Jeera Rice', 'Salad Bar (6)', 'Live Dosa Counter']
  }, {
    name: 'Dessert (after dinner)',
    items: ['Gulab Jamun', 'Rasmalai', 'Live Jalebi', 'Kulfi Faluda', 'Pan Counter']
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-3)'
    }
  }, "Pack 4 \xB7 Pure Veg \xB7 Jain options available \xB7 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--text-1)'
    }
  }, "\u20B92,150/plate \xD7 ", b.guests, " guests")), packs.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      border: '1px solid var(--border)',
      borderRadius: 8,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px',
      background: 'var(--surface-2)',
      fontWeight: 600,
      fontSize: 12.5,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "utensils-crossed",
    size: 13
  }), " ", p.name, /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 11,
      color: 'var(--text-3)',
      fontWeight: 500
    }
  }, p.items.length, " items")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      padding: 10
    }
  }, p.items.map((it, j) => /*#__PURE__*/React.createElement("span", {
    key: j,
    className: "tag"
  }, it))))));
}
function SheetPayments({
  b
}) {
  const rows = [{
    d: b.created,
    m: 'UPI',
    a: Math.round(b.advance * .4),
    n: 'Token amount'
  }, {
    d: '2026-04-12',
    m: 'NEFT',
    a: Math.round(b.advance * .6),
    n: 'Pre-event advance'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    style: {
      alignSelf: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), "Record payment"), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Date"), /*#__PURE__*/React.createElement("th", null, "Method"), /*#__PURE__*/React.createElement("th", null, "Note"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Amount"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", null, fmtDate(r.d)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, r.m)), /*#__PURE__*/React.createElement("td", {
    className: "main"
  }, r.n), /*#__PURE__*/React.createElement("td", {
    className: "num money pos"
  }, fmtINR(r.a)))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "3",
    style: {
      textAlign: 'right',
      fontWeight: 600,
      color: 'var(--text-3)'
    }
  }, "Balance due"), /*#__PURE__*/React.createElement("td", {
    className: "num money " + (b.balance > 0 ? 'warn' : 'pos'),
    style: {
      fontWeight: 700
    }
  }, fmtINR(b.balance))))));
}
function SheetTimeline({
  b
}) {
  const events = [{
    t: '4m ago',
    who: 'Priya N.',
    txt: 'Updated menu pack to Pack 4',
    kind: 'info'
  }, {
    t: 'Today',
    who: 'Rahul S.',
    txt: 'Recorded payment ₹85,000 via UPI',
    kind: 'good'
  }, {
    t: 'Yesterday',
    who: 'System',
    txt: 'Quotation v3 issued (PDF emailed)',
    kind: 'info'
  }, {
    t: '3d ago',
    who: 'Priya N.',
    txt: 'Confirmed Grand Ballroom for the date',
    kind: 'good'
  }, {
    t: '5d ago',
    who: 'Ananya K.',
    txt: 'Created enquiry · referral from Patel family',
    kind: 'info'
  }];
  return /*#__PURE__*/React.createElement("div", null, events.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: '12px 1fr',
      gap: 12,
      paddingBottom: 14,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 50,
      background: 'var(--accent)',
      marginTop: 5
    }
  }), i < events.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 3.5,
      top: 16,
      bottom: -14,
      width: 1,
      background: 'var(--border-2)'
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-1)'
    }
  }, /*#__PURE__*/React.createElement("b", null, e.who), " ", e.txt), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)',
      marginTop: 2
    }
  }, e.t)))));
}
function SheetFiles() {
  const files = [{
    n: 'Quotation v3.pdf',
    s: '182 KB',
    t: 'PDF'
  }, {
    n: 'Menu pack 4 — signed.pdf',
    s: '94 KB',
    t: 'PDF'
  }, {
    n: 'Floor plan — Grand Ballroom.png',
    s: '1.4 MB',
    t: 'IMG'
  }, {
    n: 'Vendor list (florist + AV).xlsx',
    s: '22 KB',
    t: 'XLS'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 6
    }
  }, files.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 10,
      border: '1px solid var(--border)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 6,
      background: 'var(--surface-2)',
      display: 'grid',
      placeItems: 'center',
      fontSize: 9,
      fontWeight: 700,
      color: 'var(--text-3)'
    }
  }, f.t), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, f.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)'
    }
  }, f.s)), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 13
  })))));
}
function NewBookingSheet({
  onClose
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "sheet-scrim",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "sheet"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sheet-head"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      fontWeight: 600
    }
  }, "New booking"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginTop: 2,
      letterSpacing: '-0.01em'
    }
  }, "Quick booking")), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 14
  }))), /*#__PURE__*/React.createElement("div", {
    className: "sheet-body"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      marginBottom: 10
    }
  }, "Customer"), /*#__PURE__*/React.createElement("div", {
    className: "fld",
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("label", null, "Search or create customer"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 13,
    style: {
      position: 'absolute',
      left: 10,
      top: 9,
      color: 'var(--text-4)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    style: {
      paddingLeft: 30,
      width: '100%'
    },
    placeholder: "Type name or phone\u2026",
    defaultValue: "Aarav"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border)',
      borderRadius: 8,
      marginTop: 4,
      background: 'var(--surface)'
    }
  }, BIKA.customers.slice(0, 3).map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      borderBottom: '1px solid var(--divider)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "avatar",
    style: {
      width: 24,
      height: 24,
      fontSize: 10
    }
  }, c.name.split(' ').map(x => x[0]).slice(0, 2).join('')), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 500
    }
  }, c.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)'
    }
  }, c.phone, " \xB7 ", c.bookings, " bookings \xB7 ", c.city)), /*#__PURE__*/React.createElement("span", {
    className: "code",
    style: {
      fontSize: 11,
      color: 'var(--text-3)'
    }
  }, c.id))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      color: 'var(--accent-text)',
      fontSize: 12.5,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), " Create new customer \"Aarav\u2026\""))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 16
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      marginBottom: 10
    }
  }, "Event"), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "Function name"), /*#__PURE__*/React.createElement("input", {
    defaultValue: "Wedding Reception"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "Function type"), /*#__PURE__*/React.createElement("select", {
    defaultValue: "Wedding"
  }, /*#__PURE__*/React.createElement("option", null, "Wedding"), /*#__PURE__*/React.createElement("option", null, "Engagement"), /*#__PURE__*/React.createElement("option", null, "Corporate"), /*#__PURE__*/React.createElement("option", null, "Other"))), /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-08-14"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "Time"), /*#__PURE__*/React.createElement("input", {
    type: "time",
    defaultValue: "19:30"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "Hall"), /*#__PURE__*/React.createElement("select", null, /*#__PURE__*/React.createElement("option", null, "Grand Ballroom (800)"), /*#__PURE__*/React.createElement("option", null, "Crystal Hall (450)"), /*#__PURE__*/React.createElement("option", null, "Heritage Hall (600)"))), /*#__PURE__*/React.createElement("div", {
    className: "fld"
  }, /*#__PURE__*/React.createElement("label", null, "Expected guests"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    defaultValue: "450"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fld full"
  }, /*#__PURE__*/React.createElement("label", null, "Notes"), /*#__PURE__*/React.createElement("textarea", {
    placeholder: "Any special requirements\u2026"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 16
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      marginBottom: 10
    }
  }, "Pricing"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '4px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-3)'
    }
  }, "Pack 4 \xB7 \u20B92,150/plate \xD7 450"), /*#__PURE__*/React.createElement("span", {
    className: "money"
  }, fmtINR(967500))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '4px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-3)'
    }
  }, "Hall rental \u2014 Grand Ballroom"), /*#__PURE__*/React.createElement("span", {
    className: "money"
  }, fmtINR(75000))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '4px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-3)'
    }
  }, "GST (5%)"), /*#__PURE__*/React.createElement("span", {
    className: "money"
  }, fmtINR(52125))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--border)',
      margin: '8px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontWeight: 700,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", null, "Grand total"), /*#__PURE__*/React.createElement("span", {
    className: "money"
  }, fmtINR(1094625))))), /*#__PURE__*/React.createElement("div", {
    className: "sheet-foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onClose
  }, "Save as Pencil"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, "Save & continue"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }), "Confirm booking"))));
}
window.Bookings = Bookings;
window.NewBookingSheet = NewBookingSheet;
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/screens/Bookings.jsx", error: String((e && e.message) || e) }); }

// src/screens/Calendar.jsx
try { (() => {
// Calendar — month view + venue timeline
function Calendar({
  openSheetForBookingId
}) {
  const [view, setView] = useState('month');
  const [month, setMonth] = useState({
    y: 2026,
    m: 5
  }); // June 2026

  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Calendar"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Visual view of all bookings & enquiries")), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tab-bar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "tab " + (view === 'month' ? 'active' : ''),
    onClick: () => setView('month')
  }, "Month"), /*#__PURE__*/React.createElement("button", {
    className: "tab " + (view === 'timeline' ? 'active' : ''),
    onClick: () => setView('timeline')
  }, "Venue timeline"), /*#__PURE__*/React.createElement("button", {
    className: "tab " + (view === 'week' ? 'active' : ''),
    onClick: () => setView('week')
  }, "Week")), /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "filter",
    size: 13
  }), "Filters"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), "New booking"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-left",
    size: 14
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 14,
      minWidth: 140
    }
  }, new Date(month.y, month.m).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  })), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost"
  }, "Today"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 11.5
    }
  }, [['Confirmed', 'var(--st-confirmed-dot)'], ['Pencil', 'var(--st-pencil-dot)'], ['Quotation', 'var(--st-quotation-dot)'], ['Enquiry', 'var(--st-enquiry-dot)']].map(([l, c]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      color: 'var(--text-3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: c
    }
  }), l)))), view === 'month' && /*#__PURE__*/React.createElement(MonthGrid, {
    month: month,
    openSheetForBookingId: openSheetForBookingId
  }), view === 'timeline' && /*#__PURE__*/React.createElement(VenueTimeline, {
    openSheetForBookingId: openSheetForBookingId
  }), view === 'week' && /*#__PURE__*/React.createElement(WeekView, {
    openSheetForBookingId: openSheetForBookingId
  }));
}
function MonthGrid({
  month,
  openSheetForBookingId
}) {
  const first = new Date(month.y, month.m, 1);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) {
    const d = new Date(month.y, month.m, -(startDow - 1 - i));
    cells.push({
      date: d,
      out: true
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({
      date: new Date(month.y, month.m, i),
      out: false
    });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    cells.push({
      date: d,
      out: true
    });
  }
  const evtsByDay = {};
  BIKA.bookings.forEach(b => {
    (evtsByDay[b.date] ||= []).push(b);
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "cal-grid"
  }, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => /*#__PURE__*/React.createElement("div", {
    key: d,
    className: "dow"
  }, d)), cells.map((c, i) => {
    const iso = c.date.toISOString().slice(0, 10);
    const evts = evtsByDay[iso] || [];
    const today = iso === '2026-05-28';
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "cal-cell " + (c.out ? 'out' : '') + (today ? ' today' : '')
    }, /*#__PURE__*/React.createElement("div", {
      className: "dn"
    }, c.date.getDate(), today && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10
      }
    }, "Today")), evts.slice(0, 3).map(e => /*#__PURE__*/React.createElement("div", {
      key: e.id,
      className: "cal-evt " + e.status,
      onClick: () => openSheetForBookingId(e.id),
      style: {
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 600
      }
    }, e.time), /*#__PURE__*/React.createElement("span", {
      style: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, e.customer))), evts.length > 3 && /*#__PURE__*/React.createElement("div", {
      className: "cal-more"
    }, "+", evts.length - 3, " more"));
  }));
}
function VenueTimeline({
  openSheetForBookingId
}) {
  const startDate = new Date('2026-05-25');
  const days = Array.from({
    length: 14
  }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
  const dayKey = d => d.toISOString().slice(0, 10);

  // Group bookings into bars per hall
  const halls = BIKA.halls;
  function barsFor(hallId) {
    return BIKA.bookings.filter(b => b.hallId === hallId && b.date >= dayKey(days[0]) && b.date <= dayKey(days[13]) && b.status !== 'cancelled');
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "tl-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tl-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lbl"
  }, "Venue"), /*#__PURE__*/React.createElement("div", {
    className: "tl-days"
  }, days.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "d " + (d.getDay() === 0 || d.getDay() === 6 ? 'weekend' : '')
  }, /*#__PURE__*/React.createElement("b", null, d.getDate()), d.toLocaleDateString('en-GB', {
    weekday: 'short'
  }))))), halls.map(h => {
    const bars = barsFor(h.id);
    return /*#__PURE__*/React.createElement("div", {
      key: h.id,
      className: "tl-row"
    }, /*#__PURE__*/React.createElement("div", {
      className: "name"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "building-2",
      size: 13
    }), h.name, /*#__PURE__*/React.createElement("span", {
      className: "cap"
    }, h.cap)), /*#__PURE__*/React.createElement("div", {
      className: "tl-track"
    }, bars.map(b => {
      const idx = days.findIndex(d => dayKey(d) === b.date);
      if (idx < 0) return null;
      const left = idx / 14 * 100;
      const width = 1 / 14 * 100;
      return /*#__PURE__*/React.createElement("div", {
        key: b.id,
        className: "tl-bar " + b.status,
        onClick: () => openSheetForBookingId(b.id),
        style: {
          left: `calc(${left}% + 2px)`,
          width: `calc(${width}% - 4px)`
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: b.status === 'pencil' ? 'pencil' : 'check',
        size: 11
      }), b.customer);
    })));
  })));
}
function WeekView({
  openSheetForBookingId
}) {
  // Simplified week view
  const startDate = new Date('2026-05-25');
  const days = Array.from({
    length: 7
  }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
  const hours = Array.from({
    length: 11
  }, (_, i) => 10 + i);
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '60px repeat(7, 1fr)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", null), days.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '10px 8px',
      borderLeft: '1px solid var(--divider)',
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      fontSize: 10.5,
      letterSpacing: '.06em',
      fontWeight: 600
    }
  }, d.toLocaleDateString('en-GB', {
    weekday: 'short'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--text-1)'
    }
  }, d.getDate())))), hours.map(h => /*#__PURE__*/React.createElement("div", {
    key: h,
    style: {
      display: 'grid',
      gridTemplateColumns: '60px repeat(7, 1fr)',
      borderBottom: '1px solid var(--divider)',
      minHeight: 50
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 8px',
      fontSize: 11,
      color: 'var(--text-4)',
      textAlign: 'right'
    }
  }, h > 12 ? h - 12 + ' PM' : h + ' AM'), days.map((d, i) => {
    const evts = BIKA.bookings.filter(b => b.date === d.toISOString().slice(0, 10) && parseInt(b.time) === h);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        borderLeft: '1px solid var(--divider)',
        padding: 3,
        position: 'relative'
      }
    }, evts.map(e => /*#__PURE__*/React.createElement("div", {
      key: e.id,
      className: "cal-evt " + e.status,
      style: {
        marginBottom: 2,
        cursor: 'pointer'
      },
      onClick: () => openSheetForBookingId(e.id)
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600
      }
    }, e.time), " ", e.customer)));
  }))));
}
window.Calendar = Calendar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/screens/Calendar.jsx", error: String((e && e.message) || e) }); }

// src/screens/Dashboard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Dashboard screen
function Dashboard({
  activity,
  setRoute
}) {
  const kpis = [{
    label: 'Revenue · 30d',
    value: '₹62.4L',
    delta: '+14.2%',
    deltaDir: 'up',
    spark: [4, 8, 7, 12, 10, 14, 16, 11, 15, 18, 21, 24],
    sparkColor: 'var(--accent)'
  }, {
    label: 'Confirmed bookings',
    value: '38',
    delta: '+6',
    deltaDir: 'up',
    spark: [3, 5, 4, 6, 7, 5, 8, 9, 7, 10, 12, 14],
    sparkColor: 'var(--st-confirmed-dot)'
  }, {
    label: 'Pencil at risk',
    value: '₹14.2L',
    delta: '+₹3L',
    deltaDir: 'down',
    spark: [2, 3, 5, 4, 6, 7, 6, 8, 9, 10, 11, 12],
    sparkColor: 'var(--st-pencil-dot)'
  }, {
    label: 'Outstanding',
    value: '₹28.6L',
    delta: '-₹4.1L',
    deltaDir: 'up',
    spark: [40, 38, 36, 34, 32, 30, 30, 29, 29, 28.6, 28, 27],
    sparkColor: 'var(--money-warn)'
  }, {
    label: 'Avg. ticket',
    value: '₹2.18L',
    delta: '+9.4%',
    deltaDir: 'up',
    spark: [1.6, 1.7, 1.8, 1.7, 1.9, 2.0, 2.1, 2.0, 2.1, 2.18, 2.2, 2.25],
    sparkColor: 'var(--text-2)'
  }];
  const revData = [{
    l: 'Jun',
    v: 42
  }, {
    l: 'Jul',
    v: 58
  }, {
    l: 'Aug',
    v: 51
  }, {
    l: 'Sep',
    v: 64
  }, {
    l: 'Oct',
    v: 72
  }, {
    l: 'Nov',
    v: 88
  }, {
    l: 'Dec',
    v: 124
  }, {
    l: 'Jan',
    v: 96
  }, {
    l: 'Feb',
    v: 110
  }, {
    l: 'Mar',
    v: 132
  }, {
    l: 'Apr',
    v: 118
  }, {
    l: 'May',
    v: 62
  }];
  const hallMix = [{
    l: 'Grand Ballroom',
    v: 18,
    color: 'var(--teal-700)'
  }, {
    l: 'Crystal Hall',
    v: 9,
    color: 'var(--teal-500)'
  }, {
    l: 'Heritage Hall',
    v: 14,
    color: 'var(--accent)'
  }, {
    l: 'Garden Pavilion',
    v: 6,
    color: 'var(--money-warn)'
  }, {
    l: 'Emerald Suite',
    v: 4,
    color: 'var(--text-3)'
  }];
  const upcoming = BIKA.bookings.filter(b => b.date >= '2026-05-28' && b.status !== 'cancelled').slice(0, 5);
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Operations overview"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Andheri property \xB7 ", new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  }))), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tab-bar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "tab"
  }, "Today"), /*#__PURE__*/React.createElement("button", {
    className: "tab active"
  }, "This week"), /*#__PURE__*/React.createElement("button", {
    className: "tab"
  }, "30 days"), /*#__PURE__*/React.createElement("button", {
    className: "tab"
  }, "Quarter")), /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 13
  }), "Export"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: () => {
      setRoute('bookings');
      setTimeout(() => window.dispatchEvent(new CustomEvent('bika:new-booking')), 50);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), "New booking"))), /*#__PURE__*/React.createElement("div", {
    className: "scoreboard"
  }, kpis.map((k, i) => /*#__PURE__*/React.createElement(KpiTile, _extends({
    key: i
  }, k)))), /*#__PURE__*/React.createElement("div", {
    className: "split",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ttl"
  }, "Revenue \xB7 trailing 12 months"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "All venues \xB7 \u20B9 in Lakhs")), /*#__PURE__*/React.createElement("div", {
    className: "card-body",
    style: {
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement(BarChart, {
    data: revData,
    color: "var(--accent)"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ttl"
  }, "Upcoming events"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Next 7 days"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    onClick: () => setRoute('bookings')
  }, "View all", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 12
  }))), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Date"), /*#__PURE__*/React.createElement("th", null, "Function"), /*#__PURE__*/React.createElement("th", null, "Hall"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Guests"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Value"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, upcoming.map(b => /*#__PURE__*/React.createElement("tr", {
    key: b.id,
    className: "st-" + b.status
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      color: 'var(--text-1)'
    }
  }, fmtDate(b.date)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)'
    }
  }, b.time, " \xB7 ", fmtDay(b.date))), /*#__PURE__*/React.createElement("td", {
    className: "main"
  }, b.function, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)'
    }
  }, b.customer)), /*#__PURE__*/React.createElement("td", null, b.hall), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, b.guests), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "money"
  }, fmtINR(b.total, {
    compact: true
  }))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(StatusBadge, {
    s: b.status
  }))))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ttl"
  }, "Hall utilization \xB7 this quarter"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Bookings by venue")), /*#__PURE__*/React.createElement("div", {
    className: "card-body",
    style: {
      display: 'grid',
      gridTemplateColumns: '140px 1fr',
      gap: 24,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(DonutChart, {
    segments: hallMix,
    size: 132,
    stroke: 16
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, hallMix.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 8px',
      borderRadius: 6,
      background: 'var(--surface-2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: h.color
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 12.5,
      color: 'var(--text-2)'
    }
  }, h.l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontVariantNumeric: 'tabular-nums',
      fontWeight: 600,
      color: 'var(--text-1)',
      fontSize: 12.5
    }
  }, h.v))))))), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ttl"
  }, "Insights"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 11
  }), " Updated 4m ago")), BIKA.insights.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "insight " + it.kind
  }, /*#__PURE__*/React.createElement("div", {
    className: "ic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: it.kind === 'good' ? 'trending-up' : it.kind === 'warn' ? 'alert-triangle' : it.kind === 'bad' ? 'alert-circle' : 'info',
    size: 14
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ttl"
  }, it.ttl), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, it.sub))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ttl"
  }, "Live activity"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Realtime \xB7 all staff")), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 360,
      overflow: 'auto'
    }
  }, activity.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      textAlign: 'center',
      color: 'var(--text-3)',
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      marginBottom: 4
    }
  }, "\u2014"), "Listening for activity\u2026"), activity.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    className: "feed-item in-" + a.kind + (i === 0 && a.fresh ? ' fresh' : '')
  }, /*#__PURE__*/React.createElement("div", {
    className: "dot"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "who"
  }, /*#__PURE__*/React.createElement("b", null, a.who), " ", a.action, " ", /*#__PURE__*/React.createElement("b", null, a.target)), a.detail && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-3)',
      fontSize: 11.5,
      marginTop: 2
    }
  }, a.detail)), /*#__PURE__*/React.createElement("div", {
    className: "time"
  }, a.time))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ttl"
  }, "Today's checklist"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "3 of 7 done")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 6
    }
  }, [{
    done: true,
    txt: 'Confirm Crystal Hall AC repair',
    who: 'Operations'
  }, {
    done: true,
    txt: 'Send quotation BK-24317 to Mehta',
    who: 'Sales'
  }, {
    done: true,
    txt: 'Approve menu update – Pack 4',
    who: 'Chef'
  }, {
    done: false,
    txt: 'Follow-up: 4 pencil bookings expiring',
    who: 'You · Priya'
  }, {
    done: false,
    txt: 'Daily cash reconciliation',
    who: 'Accounts'
  }, {
    done: false,
    txt: 'Walk-through: tomorrow\'s 3 events',
    who: 'Operations'
  }, {
    done: false,
    txt: 'Vendor payments — 2 overdue',
    who: 'Accounts'
  }].map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 8px',
      borderRadius: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 14,
      height: 14,
      borderRadius: 4,
      border: '1.5px solid ' + (t.done ? 'var(--accent)' : 'var(--border-2)'),
      background: t.done ? 'var(--accent)' : 'transparent',
      display: 'grid',
      placeItems: 'center',
      color: 'white',
      fontSize: 9,
      fontWeight: 700
    }
  }, t.done && '✓'), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 12.5,
      color: t.done ? 'var(--text-4)' : 'var(--text-1)',
      textDecoration: t.done ? 'line-through' : 'none'
    }
  }, t.txt), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)'
    }
  }, t.who))))))));
}
window.Dashboard = Dashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/screens/Dashboard.jsx", error: String((e && e.message) || e) }); }

// src/screens/Other.jsx
try { (() => {
// Customers + Payments + Enquiries + light screens
function Customers({
  openCustomer
}) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    if (!q) return BIKA.customers;
    const Q = q.toLowerCase();
    return BIKA.customers.filter(c => c.name.toLowerCase().includes(Q) || c.phone.includes(q) || c.city.toLowerCase().includes(Q));
  }, [q]);
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Customers"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, BIKA.customers.length, " active \xB7 \u20B91.04Cr lifetime value")), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload",
    size: 13
  }), "Import"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), "New customer"))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "toolbar"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 13,
    style: {
      position: 'absolute',
      left: 8,
      top: 8,
      color: 'var(--text-4)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Search customers by name, phone, city\u2026",
    style: {
      height: 28,
      padding: '0 10px 0 26px',
      border: '1px solid var(--border-2)',
      borderRadius: 6,
      background: 'var(--surface-2)',
      width: 320,
      fontSize: 12.5,
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("button", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "building"
  }), "City"), /*#__PURE__*/React.createElement("button", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trending-up"
  }), "By value"), /*#__PURE__*/React.createElement("button", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "users"
  }), "Repeat 2+"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--text-3)'
    }
  }, list.length, " of ", BIKA.customers.length)), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Customer"), /*#__PURE__*/React.createElement("th", null, "Phone"), /*#__PURE__*/React.createElement("th", null, "City"), /*#__PURE__*/React.createElement("th", null, "Since"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Bookings"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Lifetime value"), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, list.map(c => /*#__PURE__*/React.createElement("tr", {
    key: c.id,
    onClick: () => openCustomer(c.id),
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "avatar",
    style: {
      width: 26,
      height: 26,
      fontSize: 10
    }
  }, c.name.split(' ').map(x => x[0]).slice(0, 2).join('')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--text-1)'
    }
  }, c.name), /*#__PURE__*/React.createElement("div", {
    className: "code",
    style: {
      fontSize: 10.5,
      color: 'var(--text-4)'
    }
  }, c.id)))), /*#__PURE__*/React.createElement("td", {
    className: "code"
  }, c.phone), /*#__PURE__*/React.createElement("td", null, c.city), /*#__PURE__*/React.createElement("td", null, c.since), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, c.bookings), /*#__PURE__*/React.createElement("td", {
    className: "num money"
  }, fmtINR(c.value, {
    compact: true
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "row-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "phone",
    size: 13
  })), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "message-circle",
    size: 13
  }))))))))));
}
function Enquiries() {
  const list = BIKA.enquiries;
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Enquiries"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, list.length, " open \xB7 6 hot leads \xB7 avg response 2h 14m")), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "filter",
    size: 13
  }), "Filters"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), "Log enquiry"))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "toolbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tab-bar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "tab active"
  }, "All", /*#__PURE__*/React.createElement("span", {
    className: "count"
  }, list.length)), /*#__PURE__*/React.createElement("button", {
    className: "tab"
  }, "Hot", /*#__PURE__*/React.createElement("span", {
    className: "count"
  }, list.filter(x => x.score === 'Hot').length)), /*#__PURE__*/React.createElement("button", {
    className: "tab"
  }, "Warm", /*#__PURE__*/React.createElement("span", {
    className: "count"
  }, list.filter(x => x.score === 'Warm').length)), /*#__PURE__*/React.createElement("button", {
    className: "tab"
  }, "Cold", /*#__PURE__*/React.createElement("span", {
    className: "count"
  }, list.filter(x => x.score === 'Cold').length))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user"
  }), "Assignee"), /*#__PURE__*/React.createElement("button", {
    className: "chip"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "phone"
  }), "Source")), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Ref"), /*#__PURE__*/React.createElement("th", null, "Customer / Phone"), /*#__PURE__*/React.createElement("th", null, "Function"), /*#__PURE__*/React.createElement("th", null, "Event date"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Guests"), /*#__PURE__*/React.createElement("th", null, "Source"), /*#__PURE__*/React.createElement("th", null, "Assignee"), /*#__PURE__*/React.createElement("th", null, "Age"), /*#__PURE__*/React.createElement("th", null, "Score"))), /*#__PURE__*/React.createElement("tbody", null, list.map(e => /*#__PURE__*/React.createElement("tr", {
    key: e.id,
    className: "st-enquiry",
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("td", {
    className: "id"
  }, e.id), /*#__PURE__*/React.createElement("td", {
    className: "main"
  }, /*#__PURE__*/React.createElement("div", null, e.customer), /*#__PURE__*/React.createElement("div", {
    className: "code",
    style: {
      fontSize: 10.5,
      color: 'var(--text-4)'
    }
  }, e.phone)), /*#__PURE__*/React.createElement("td", null, e.function), /*#__PURE__*/React.createElement("td", null, fmtDate(e.date)), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, e.guests), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, e.source)), /*#__PURE__*/React.createElement("td", null, e.assignee), /*#__PURE__*/React.createElement("td", {
    className: "muted"
  }, e.age), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "st",
    style: {
      background: e.score === 'Hot' ? 'rgba(220,38,38,.10)' : e.score === 'Warm' ? 'rgba(217,119,6,.10)' : 'rgba(168,162,158,.18)',
      color: e.score === 'Hot' ? 'var(--money-neg)' : e.score === 'Warm' ? 'var(--money-warn)' : 'var(--text-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "d",
    style: {
      background: e.score === 'Hot' ? 'var(--money-neg)' : e.score === 'Warm' ? 'var(--money-warn)' : 'var(--text-4)'
    }
  }), e.score))))))));
}
function Payments() {
  const totalCollected = BIKA.payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = BIKA.bookings.reduce((s, b) => s + (b.status !== 'cancelled' ? b.balance : 0), 0);
  const overdue = Math.round(outstanding * 0.32);
  const due7 = Math.round(outstanding * 0.41);
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Payments & ledger"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "All transactions across bookings")), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 13
  }), "Export"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), "Record payment"))), /*#__PURE__*/React.createElement("div", {
    className: "scoreboard",
    style: {
      gridTemplateColumns: 'repeat(4, 1fr)'
    }
  }, /*#__PURE__*/React.createElement(KpiTile, {
    label: "Collected \xB7 30d",
    value: fmtINR(totalCollected, {
      compact: true
    }),
    delta: "+22%",
    deltaDir: "up",
    spark: [4, 5, 7, 9, 12, 11, 14, 15, 18, 20, 24, 28],
    sparkColor: "var(--money-pos)"
  }), /*#__PURE__*/React.createElement(KpiTile, {
    label: "Outstanding",
    value: fmtINR(outstanding, {
      compact: true
    }),
    delta: "-12%",
    deltaDir: "up",
    spark: [30, 32, 31, 30, 28, 26, 28, 27, 26, 24, 22, 21],
    sparkColor: "var(--money-warn)"
  }), /*#__PURE__*/React.createElement(KpiTile, {
    label: "Overdue 30d+",
    value: fmtINR(overdue, {
      compact: true
    }),
    delta: "+\u20B91.2L",
    deltaDir: "down",
    spark: [5, 6, 7, 7, 8, 9, 10, 11, 11, 12, 12, 11],
    sparkColor: "var(--money-neg)"
  }), /*#__PURE__*/React.createElement(KpiTile, {
    label: "Due in 7 days",
    value: fmtINR(due7, {
      compact: true
    }),
    delta: "3 invoices",
    deltaDir: "up",
    spark: [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
    sparkColor: "var(--accent)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "split",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ttl"
  }, "Recent payments"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Last 30 transactions")), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Date"), /*#__PURE__*/React.createElement("th", null, "Ref"), /*#__PURE__*/React.createElement("th", null, "Customer"), /*#__PURE__*/React.createElement("th", null, "Method"), /*#__PURE__*/React.createElement("th", null, "Type"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Amount"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, BIKA.payments.slice(0, 18).map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.id
  }, /*#__PURE__*/React.createElement("td", null, fmtDate(p.date)), /*#__PURE__*/React.createElement("td", {
    className: "id"
  }, p.bookingId), /*#__PURE__*/React.createElement("td", {
    className: "main"
  }, p.customer), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, p.method)), /*#__PURE__*/React.createElement("td", {
    className: "muted"
  }, p.type), /*#__PURE__*/React.createElement("td", {
    className: "num money pos"
  }, fmtINR(p.amount, {
    compact: true
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "st confirmed"
  }, /*#__PURE__*/React.createElement("span", {
    className: "d"
  }), p.status))))))), /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ttl"
  }, "Collection by method"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "This month")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, [['UPI', 52, 'var(--accent)'], ['NEFT', 28, 'var(--teal-500)'], ['Cash', 12, 'var(--money-warn)'], ['Card', 6, 'var(--text-3)'], ['Cheque', 2, 'var(--text-4)']].map(([m, v, c]) => /*#__PURE__*/React.createElement("div", {
    key: m,
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, m), /*#__PURE__*/React.createElement("span", {
    className: "money",
    style: {
      color: c,
      fontWeight: 600
    }
  }, v, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 5,
      borderRadius: 3,
      background: 'var(--surface-2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: v + '%',
      borderRadius: 3,
      background: c
    }
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ttl"
  }, "Overdue \xB7 priority"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "3 customers")), /*#__PURE__*/React.createElement("div", null, BIKA.bookings.filter(b => b.balance > 100000 && b.status !== 'cancelled').slice(0, 4).map(b => /*#__PURE__*/React.createElement("div", {
    key: b.id,
    style: {
      padding: '10px 14px',
      borderBottom: '1px solid var(--divider)',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 500,
      color: 'var(--text-1)'
    }
  }, b.customer), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)'
    }
  }, b.ref, " \xB7 ", fmtDate(b.date))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "money warn",
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, fmtINR(b.balance, {
    compact: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)'
    }
  }, "due")))))))));
}
function Venues() {
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Venues & halls"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, BIKA.halls.length, " halls \xB7 1 banquet complex")), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), "Add hall"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 14
    }
  }, BIKA.halls.map(h => {
    const upcoming = BIKA.bookings.filter(b => b.hallId === h.id && b.status === 'confirmed').length;
    return /*#__PURE__*/React.createElement("div", {
      key: h.id,
      className: "card"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 110,
        background: 'linear-gradient(135deg, var(--surface-2), var(--surface-3))',
        borderBottom: '1px solid var(--border)',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "tag",
      style: {
        position: 'absolute',
        top: 10,
        left: 10
      }
    }, h.tier), /*#__PURE__*/React.createElement(Icon, {
      name: "building-2",
      size: 36,
      style: {
        position: 'absolute',
        right: 14,
        bottom: 14,
        color: 'var(--text-4)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "card-body"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600,
        fontSize: 14,
        color: 'var(--text-1)',
        flex: 1
      }
    }, h.name), /*#__PURE__*/React.createElement("span", {
      className: "code",
      style: {
        color: 'var(--text-3)',
        fontSize: 11
      }
    }, h.id)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 16,
        marginTop: 12,
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--text-4)',
        fontSize: 10.5,
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        fontWeight: 600
      }
    }, "Capacity"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600,
        color: 'var(--text-1)',
        marginTop: 2
      }
    }, h.cap)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--text-4)',
        fontSize: 10.5,
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        fontWeight: 600
      }
    }, "Confirmed"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600,
        color: 'var(--text-1)',
        marginTop: 2
      }
    }, upcoming)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--text-4)',
        fontSize: 10.5,
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        fontWeight: 600
      }
    }, "Utiliz."), /*#__PURE__*/React.createElement("div", {
      className: "money pos",
      style: {
        fontWeight: 600,
        marginTop: 2
      }
    }, 60 + h.cap % 30, "%")))));
  })));
}
function MenuScreen() {
  const packs = [{
    id: 'P1',
    name: 'Silver Veg',
    plate: 1450,
    items: 24,
    type: 'Veg'
  }, {
    id: 'P2',
    name: 'Gold Veg',
    plate: 1850,
    items: 32,
    type: 'Veg'
  }, {
    id: 'P3',
    name: 'Royal Veg+',
    plate: 2150,
    items: 38,
    type: 'Veg'
  }, {
    id: 'P4',
    name: 'Royal Wedding',
    plate: 2450,
    items: 44,
    type: 'Mixed'
  }, {
    id: 'P5',
    name: 'Corporate Lunch',
    plate: 950,
    items: 18,
    type: 'Mixed'
  }, {
    id: 'P6',
    name: 'Jain Special',
    plate: 1750,
    items: 28,
    type: 'Jain'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Menu & items"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "6 packs \xB7 184 items \xB7 22 categories")), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "utensils-crossed",
    size: 13
  }), "Items"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), "New pack"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 14
    }
  }, packs.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "utensils-crossed",
    size: 16,
    style: {
      color: 'var(--accent)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--text-1)',
      flex: 1
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, p.type)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'flex',
      alignItems: 'baseline',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: '-0.02em'
    }
  }, fmtINR(p.plate)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-3)',
      fontSize: 12
    }
  }, "/plate")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 12,
      color: 'var(--text-3)'
    }
  }, p.items, " items \xB7 3 courses"))))));
}
function Reports() {
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Reports"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Revenue, utilization, function trends")), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 13
  }), "FY 2025\u201326"), /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 13
  }), "Export PDF"))), /*#__PURE__*/React.createElement("div", {
    className: "scoreboard"
  }, /*#__PURE__*/React.createElement(KpiTile, {
    label: "FY revenue",
    value: "\u20B97.42Cr",
    delta: "+18%",
    deltaDir: "up",
    spark: [10, 12, 14, 15, 18, 20, 22, 24, 28, 30, 32, 35],
    sparkColor: "var(--accent)"
  }), /*#__PURE__*/React.createElement(KpiTile, {
    label: "Bookings",
    value: "284",
    delta: "+24",
    deltaDir: "up",
    spark: [18, 20, 22, 26, 28, 30, 32, 30, 32, 34, 36, 38],
    sparkColor: "var(--st-confirmed-dot)"
  }), /*#__PURE__*/React.createElement(KpiTile, {
    label: "Avg ticket",
    value: "\u20B92.61L",
    delta: "+6.4%",
    deltaDir: "up",
    spark: [2.0, 2.1, 2.2, 2.3, 2.4, 2.4, 2.5, 2.5, 2.6, 2.6, 2.61, 2.7],
    sparkColor: "var(--text-2)"
  }), /*#__PURE__*/React.createElement(KpiTile, {
    label: "Cancellations",
    value: "11",
    delta: "-3",
    deltaDir: "up",
    spark: [5, 4, 4, 3, 3, 2, 2, 3, 2, 2, 1, 1],
    sparkColor: "var(--money-neg)"
  }), /*#__PURE__*/React.createElement(KpiTile, {
    label: "Repeat rate",
    value: "32%",
    delta: "+4 pts",
    deltaDir: "up",
    spark: [20, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 32],
    sparkColor: "var(--money-pos)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "split",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ttl"
  }, "Revenue by function type"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "FY 2025\u201326")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement(BarChart, {
    data: [{
      l: 'Wedding',
      v: 320
    }, {
      l: 'Corp.',
      v: 110
    }, {
      l: 'Engage.',
      v: 88
    }, {
      l: 'Recept.',
      v: 156
    }, {
      l: 'B-day',
      v: 42
    }, {
      l: 'Conf.',
      v: 60
    }, {
      l: 'Other',
      v: 36
    }],
    color: "var(--accent)"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ttl"
  }, "Top customers"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "By lifetime value")), /*#__PURE__*/React.createElement("div", null, [...BIKA.customers].sort((a, b) => b.value - a.value).slice(0, 6).map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 14px',
      borderBottom: '1px solid var(--divider)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 18,
      fontSize: 11,
      color: 'var(--text-4)',
      fontWeight: 600
    }
  }, i + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 12.5,
      fontWeight: 500
    }
  }, c.name), /*#__PURE__*/React.createElement("div", {
    className: "money",
    style: {
      fontWeight: 600,
      fontSize: 12.5
    }
  }, fmtINR(c.value, {
    compact: true
  }))))))));
}
function Logs() {
  const items = [{
    t: 'a few seconds ago',
    who: 'Priya N.',
    act: 'updated',
    tgt: 'BK-24317 status to Confirmed',
    mod: 'Bookings'
  }, {
    t: '2 minutes ago',
    who: 'Rahul S.',
    act: 'recorded',
    tgt: 'payment ₹85,000 (UPI) on BK-24312',
    mod: 'Payments'
  }, {
    t: '14 minutes ago',
    who: 'Ananya K.',
    act: 'created',
    tgt: 'enquiry EN-8819 for Wedding',
    mod: 'Enquiries'
  }, {
    t: '1 hour ago',
    who: 'System',
    act: 'sent',
    tgt: 'quotation PDF to mehta@gmail.com',
    mod: 'System'
  }, {
    t: '2 hours ago',
    who: 'Sameer V.',
    act: 'modified',
    tgt: 'menu pack Royal Wedding (Pack 4)',
    mod: 'Menu'
  }, {
    t: '5 hours ago',
    who: 'Priya N.',
    act: 'cancelled',
    tgt: 'BK-24296 with refund ₹2.4L',
    mod: 'Bookings'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Activity log"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Every change, every user, every booking."))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, items.map((x, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '12px 16px',
      borderBottom: '1px solid var(--divider)',
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "avatar",
    style: {
      width: 28,
      height: 28,
      fontSize: 10
    }
  }, x.who.split(' ').map(c => c[0]).join('')), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("b", null, x.who), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-3)'
    }
  }, x.act), " ", /*#__PURE__*/React.createElement("b", null, x.tgt)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)',
      marginTop: 2
    }
  }, x.t, " \xB7 ", x.mod)), /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, x.mod)))));
}
function Settings() {
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Settings"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Team, roles, integrations"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 14
    }
  }, [{
    i: 'users',
    t: 'Team',
    s: '12 users · 4 roles'
  }, {
    i: 'shield',
    t: 'Permissions',
    s: 'Role-based access control'
  }, {
    i: 'building-2',
    t: 'Business profile',
    s: 'Bika Banquets · Andheri'
  }, {
    i: 'mail',
    t: 'Email & WhatsApp',
    s: 'SMTP · WhatsApp Business'
  }, {
    i: 'credit-card',
    t: 'Billing',
    s: 'Pro plan · ₹4,999/mo'
  }, {
    i: 'plug-zap',
    t: 'Integrations',
    s: '4 connected · Razorpay, Zoho'
  }].map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "card",
    style: {
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: 'var(--accent-soft)',
      color: 'var(--accent-text)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: c.i,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--text-1)',
      marginTop: 4
    }
  }, c.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-3)'
    }
  }, c.s)))));
}
window.Customers = Customers;
window.Enquiries = Enquiries;
window.Payments = Payments;
window.Venues = Venues;
window.MenuScreen = MenuScreen;
window.Reports = Reports;
window.Logs = Logs;
window.Settings = Settings;
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/screens/Other.jsx", error: String((e && e.message) || e) }); }

// src/shell.jsx
try { (() => {
// Sidebar nav
function Sidebar({
  route,
  setRoute,
  collapsed,
  counts
}) {
  const main = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard'
  }, {
    id: 'bookings',
    label: 'Bookings',
    icon: 'calendar-check',
    count: counts.bookings
  }, {
    id: 'calendar',
    label: 'Calendar',
    icon: 'calendar-days'
  }, {
    id: 'enquiries',
    label: 'Enquiries',
    icon: 'phone-call',
    count: counts.enquiries
  }, {
    id: 'customers',
    label: 'Customers',
    icon: 'users'
  }, {
    id: 'payments',
    label: 'Payments',
    icon: 'indian-rupee',
    count: counts.duePayments
  }];
  const ops = [{
    id: 'venues',
    label: 'Venues',
    icon: 'building-2'
  }, {
    id: 'menu',
    label: 'Menu & Items',
    icon: 'utensils-crossed'
  }, {
    id: 'reports',
    label: 'Reports',
    icon: 'bar-chart-3'
  }, {
    id: 'logs',
    label: 'Activity',
    icon: 'activity'
  }, {
    id: 'settings',
    label: 'Settings',
    icon: 'settings'
  }];
  const Item = ({
    it
  }) => /*#__PURE__*/React.createElement("div", {
    className: "side-item " + (route === it.id ? 'active' : ''),
    onClick: () => setRoute(it.id),
    title: it.label
  }, /*#__PURE__*/React.createElement(Icon, {
    name: it.icon,
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, it.label), it.count != null && /*#__PURE__*/React.createElement("span", {
    className: "count"
  }, it.count));
  return /*#__PURE__*/React.createElement("aside", {
    className: "side"
  }, /*#__PURE__*/React.createElement("div", {
    className: "side-brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-mark"
  }, "B"), !collapsed && /*#__PURE__*/React.createElement("span", null, "Bika Banquet")), !collapsed && /*#__PURE__*/React.createElement("div", {
    className: "side-section"
  }, "Operate"), /*#__PURE__*/React.createElement("div", {
    className: "side-nav"
  }, main.map(it => /*#__PURE__*/React.createElement(Item, {
    key: it.id,
    it: it
  }))), !collapsed && /*#__PURE__*/React.createElement("div", {
    className: "side-section"
  }, "Catalog"), /*#__PURE__*/React.createElement("div", {
    className: "side-nav"
  }, ops.map(it => /*#__PURE__*/React.createElement(Item, {
    key: it.id,
    it: it
  }))), /*#__PURE__*/React.createElement("div", {
    className: "side-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "avatar"
  }, "PN"), !collapsed && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "who"
  }, /*#__PURE__*/React.createElement("div", {
    className: "name"
  }, "Priya Nambiar"), /*#__PURE__*/React.createElement("div", {
    className: "role"
  }, "Operations Lead \xB7 Andheri")), /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-up-down",
    size: 14
  }))));
}
function TopBar({
  crumbs,
  onOpenCmd,
  live,
  toggleLive,
  theme,
  toggleTheme,
  toggleSide
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "top"
  }, /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    onClick: toggleSide,
    title: "Toggle sidebar"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "panel-left",
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    className: "crumbs"
  }, crumbs.map((c, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    className: "sep"
  }, "/"), /*#__PURE__*/React.createElement("span", {
    className: i === crumbs.length - 1 ? 'leaf' : ''
  }, c)))), /*#__PURE__*/React.createElement("button", {
    className: "search-trigger",
    onClick: onOpenCmd
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 13
  }), /*#__PURE__*/React.createElement("span", null, "Search bookings, customers, halls\u2026"), /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "\u2318 K")), /*#__PURE__*/React.createElement("div", {
    className: "live-dot " + (live ? '' : 'off'),
    onClick: toggleLive,
    style: {
      cursor: 'pointer'
    },
    title: "Toggle live feed"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), live ? 'Live' : 'Paused'), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    onClick: toggleTheme,
    title: "Toggle theme"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: theme === 'dark' ? 'sun' : 'moon',
    size: 16
  })), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Notifications"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 16
  })));
}
function CommandPalette({
  onClose,
  setRoute,
  openBookingById
}) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const groups = useMemo(() => {
    const navItems = [{
      kind: 'nav',
      label: 'Go to Dashboard',
      hint: 'G then D',
      icon: 'layout-dashboard',
      action: () => setRoute('dashboard')
    }, {
      kind: 'nav',
      label: 'Go to Bookings',
      hint: 'G then B',
      icon: 'calendar-check',
      action: () => setRoute('bookings')
    }, {
      kind: 'nav',
      label: 'Go to Calendar',
      hint: 'G then C',
      icon: 'calendar-days',
      action: () => setRoute('calendar')
    }, {
      kind: 'nav',
      label: 'Go to Customers',
      hint: 'G then U',
      icon: 'users',
      action: () => setRoute('customers')
    }, {
      kind: 'nav',
      label: 'Go to Payments',
      hint: 'G then P',
      icon: 'indian-rupee',
      action: () => setRoute('payments')
    }];
    const acts = [{
      kind: 'action',
      label: 'New booking',
      hint: 'N',
      icon: 'plus',
      action: () => {
        setRoute('bookings');
        setTimeout(() => window.dispatchEvent(new CustomEvent('bika:new-booking')), 50);
      }
    }, {
      kind: 'action',
      label: 'New enquiry',
      hint: 'E',
      icon: 'phone-call',
      action: () => setRoute('enquiries')
    }, {
      kind: 'action',
      label: 'Record payment',
      hint: '⇧P',
      icon: 'indian-rupee',
      action: () => setRoute('payments')
    }, {
      kind: 'action',
      label: 'Toggle theme',
      hint: '⇧T',
      icon: 'sun-moon',
      action: () => window.dispatchEvent(new CustomEvent('bika:toggle-theme'))
    }];
    const bks = BIKA.bookings.slice(0, 8).map(b => ({
      kind: 'booking',
      label: `${b.ref} · ${b.customer}`,
      hint: fmtDate(b.date),
      icon: 'calendar-check',
      action: () => openBookingById(b.id)
    }));
    const filter = xs => q ? xs.filter(x => x.label.toLowerCase().includes(q.toLowerCase())) : xs;
    return [{
      lbl: 'Navigate',
      items: filter(navItems)
    }, {
      lbl: 'Actions',
      items: filter(acts)
    }, {
      lbl: 'Recent bookings',
      items: filter(bks)
    }];
  }, [q]);
  const flat = groups.flatMap(g => g.items);
  useEffect(() => {
    if (idx >= flat.length) setIdx(0);
  }, [q]);
  function onKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx(i => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      flat[idx]?.action?.();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }
  let global = -1;
  return /*#__PURE__*/React.createElement("div", {
    className: "cmd-scrim",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "cmd",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    className: "cmd-input",
    placeholder: "Search or run a command\u2026",
    value: q,
    onChange: e => setQ(e.target.value),
    onKeyDown: onKey
  }), /*#__PURE__*/React.createElement("div", {
    className: "cmd-list"
  }, groups.map((g, gi) => g.items.length > 0 && /*#__PURE__*/React.createElement("div", {
    key: gi
  }, /*#__PURE__*/React.createElement("div", {
    className: "cmd-group-lbl"
  }, g.lbl), g.items.map(it => {
    global += 1;
    const i = global;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "cmd-item " + (i === idx ? 'active' : ''),
      onMouseEnter: () => setIdx(i),
      onClick: () => {
        it.action();
        onClose();
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: it.icon,
      size: 15
    }), /*#__PURE__*/React.createElement("span", null, it.label), /*#__PURE__*/React.createElement("span", {
      className: "where"
    }, it.hint));
  }))))));
}
window.Sidebar = Sidebar;
window.TopBar = TopBar;
window.CommandPalette = CommandPalette;
})(); } catch (e) { __ds_ns.__errors.push({ path: "src/shell.jsx", error: String((e && e.message) || e) }); }

// tweaks-panel.jsx
try { (() => {
/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/booking-dashboard/BookingForm.jsx
try { (() => {
// BookingForm.jsx — Bika Banquet UI Kit (New Booking Modal)
// Exports: BookingForm to window

const {
  useState: useFormState
} = React;
function BookingForm({
  onClose,
  onSave
}) {
  const [form, setForm] = useFormState({
    customerName: '',
    phone: '',
    email: '',
    functionName: '',
    functionType: 'Wedding',
    functionDate: '',
    functionTime: '18:00',
    expectedGuests: '',
    hall: 'Crystal Hall',
    grandTotal: '',
    advanceAmount: '',
    notes: ''
  });
  const [step, setStep] = useFormState(1);
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const labelStyle = {
    display: 'block',
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--text-2)',
    marginBottom: 5
  };
  const inputStyle = {
    width: '100%',
    borderRadius: 12,
    padding: '8px 12px',
    fontSize: 13.5,
    fontFamily: 'inherit',
    border: '1px solid var(--border-2)',
    background: 'var(--surface)',
    color: 'var(--text-1)',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s'
  };
  const inputFocusOn = e => {
    e.target.style.borderColor = '#14b8a6';
    e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.18)';
  };
  const inputFocusOff = e => {
    e.target.style.borderColor = 'var(--border-2)';
    e.target.style.boxShadow = 'none';
  };
  const STEPS = ['Customer', 'Event Details', 'Payment'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,23,42,0.5)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    },
    onClick: e => e.target === e.currentTarget && onClose()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      borderRadius: 20,
      boxShadow: '0 20px 40px rgba(15,23,42,0.18)',
      width: '100%',
      maxWidth: 560,
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      animation: 'modalIn 0.2s cubic-bezier(0.32,0.72,0,1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 24px 16px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-1)',
      margin: 0
    }
  }, "New Booking"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: 'var(--text-4)',
      margin: '2px 0 0'
    }
  }, "Step ", step, " of ", STEPS.length, " \u2014 ", STEPS[step - 1])), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      color: 'var(--text-4)',
      padding: 6,
      borderRadius: 8,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      padding: '12px 24px',
      gap: 8,
      flexShrink: 0
    }
  }, STEPS.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 3,
      borderRadius: 2,
      background: i + 1 <= step ? 'var(--teal-500)' : 'var(--surface-3)',
      transition: 'background 0.3s'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      color: i + 1 <= step ? 'var(--teal-600)' : 'var(--text-4)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }
  }, s)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 24px 20px',
      overflowY: 'auto',
      flex: 1
    }
  }, step === 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: labelStyle
  }, "Full Name *"), /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    placeholder: "Customer full name",
    value: form.customerName,
    onChange: e => set('customerName', e.target.value),
    onFocus: inputFocusOn,
    onBlur: inputFocusOff
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: labelStyle
  }, "Phone *"), /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    placeholder: "+91 98765 43210",
    value: form.phone,
    onChange: e => set('phone', e.target.value),
    onFocus: inputFocusOn,
    onBlur: inputFocusOff
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: labelStyle
  }, "Email Address"), /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "email",
    placeholder: "customer@email.com",
    value: form.email,
    onChange: e => set('email', e.target.value),
    onFocus: inputFocusOn,
    onBlur: inputFocusOff
  }))), step === 2 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: labelStyle
  }, "Function Name *"), /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    placeholder: "e.g. Sharma Wedding Reception",
    value: form.functionName,
    onChange: e => set('functionName', e.target.value),
    onFocus: inputFocusOn,
    onBlur: inputFocusOff
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: labelStyle
  }, "Function Type"), /*#__PURE__*/React.createElement("select", {
    style: {
      ...inputStyle,
      appearance: 'none'
    },
    value: form.functionType,
    onChange: e => set('functionType', e.target.value),
    onFocus: inputFocusOn,
    onBlur: inputFocusOff
  }, ['Wedding', 'Reception', 'Birthday', 'Corporate', 'Other'].map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: labelStyle
  }, "Hall"), /*#__PURE__*/React.createElement("select", {
    style: {
      ...inputStyle,
      appearance: 'none'
    },
    value: form.hall,
    onChange: e => set('hall', e.target.value),
    onFocus: inputFocusOn,
    onBlur: inputFocusOff
  }, ['Crystal Hall', 'Grand Banquet', 'Emerald Room', 'Rose Garden', 'Sapphire Suite'].map(h => /*#__PURE__*/React.createElement("option", {
    key: h
  }, h)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: labelStyle
  }, "Function Date *"), /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "date",
    value: form.functionDate,
    onChange: e => set('functionDate', e.target.value),
    onFocus: inputFocusOn,
    onBlur: inputFocusOff
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: labelStyle
  }, "Expected Guests"), /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    placeholder: "500",
    value: form.expectedGuests,
    onChange: e => set('expectedGuests', e.target.value),
    onFocus: inputFocusOn,
    onBlur: inputFocusOff
  })))), step === 3 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: labelStyle
  }, "Grand Total (\u20B9)"), /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    placeholder: "350000",
    value: form.grandTotal,
    onChange: e => set('grandTotal', e.target.value),
    onFocus: inputFocusOn,
    onBlur: inputFocusOff
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: labelStyle
  }, "Advance Amount (\u20B9)"), /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    type: "number",
    placeholder: "100000",
    value: form.advanceAmount,
    onChange: e => set('advanceAmount', e.target.value),
    onFocus: inputFocusOn,
    onBlur: inputFocusOff
  }))), form.grandTotal && form.advanceAmount && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--teal-50)',
      border: '1px solid var(--teal-100)',
      borderRadius: 12,
      padding: '12px 14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-2)',
      fontWeight: 600
    }
  }, "Balance Due"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--teal-700)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, "\u20B9", (Number(form.grandTotal) - Number(form.advanceAmount)).toLocaleString('en-IN'))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: labelStyle
  }, "Special Notes"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...inputStyle,
      minHeight: 72,
      resize: 'vertical'
    },
    placeholder: "Any special requirements, dietary notes, or arrangements\u2026",
    value: form.notes,
    onChange: e => set('notes', e.target.value),
    onFocus: inputFocusOn,
    onBlur: inputFocusOff
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 24px',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      flexShrink: 0,
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: step === 1 ? onClose : () => setStep(s => s - 1),
    style: {
      padding: '8px 18px',
      borderRadius: 12,
      border: '1px solid var(--border-2)',
      background: 'var(--surface)',
      color: 'var(--text-2)',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit'
    }
  }, step === 1 ? 'Cancel' : '← Back'), /*#__PURE__*/React.createElement("button", {
    onClick: step < STEPS.length ? () => setStep(s => s + 1) : () => {
      onSave && onSave(form);
      onClose();
    },
    style: {
      padding: '8px 22px',
      borderRadius: 12,
      border: 'none',
      background: 'var(--teal-600)',
      color: 'white',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      boxShadow: '0 1px 3px rgba(13,148,136,0.25)'
    }
  }, step < STEPS.length ? 'Continue →' : 'Create Booking'))), /*#__PURE__*/React.createElement("style", null, `@keyframes modalIn { from { opacity:0; transform:scale(0.97) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`));
}
Object.assign(window, {
  BookingForm
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/booking-dashboard/BookingForm.jsx", error: String((e && e.message) || e) }); }

// ui_kits/booking-dashboard/BookingsTable.jsx
try { (() => {
// BookingsTable.jsx — Bika Banquet UI Kit
// Exports: BookingsTable to window

const {
  useState: useStateTable
} = React;
const SAMPLE_BOOKINGS = [{
  id: '1',
  name: 'Sharma Wedding Reception',
  customer: 'Priya Sharma',
  phone: '+91 98765 43210',
  functionType: 'Wedding',
  functionDate: '25/12/2024',
  hall: 'Crystal Hall',
  status: 'confirmed',
  grandTotal: 345000,
  advance: 150000
}, {
  id: '2',
  name: 'Patel Corporate Dinner',
  customer: 'Rajesh Patel',
  phone: '+91 87654 32109',
  functionType: 'Corporate',
  functionDate: '28/12/2024',
  hall: 'Grand Banquet',
  status: 'pencil',
  grandTotal: 180000,
  advance: 0
}, {
  id: '3',
  name: 'Kumar Birthday Bash',
  customer: 'Sunita Kumar',
  phone: '+91 76543 21098',
  functionType: 'Birthday',
  functionDate: '01/01/2025',
  hall: 'Emerald Room',
  status: 'quotation',
  grandTotal: 95000,
  advance: 20000
}, {
  id: '4',
  name: 'Mehta Family Reunion',
  customer: 'Ajay Mehta',
  phone: '+91 65432 10987',
  functionType: 'Reception',
  functionDate: '05/01/2025',
  hall: 'Crystal Hall',
  status: 'confirmed',
  grandTotal: 220000,
  advance: 100000
}, {
  id: '5',
  name: 'Singh Engagement',
  customer: 'Kavita Singh',
  phone: '+91 54321 09876',
  functionType: 'Wedding',
  functionDate: '10/01/2025',
  hall: 'Rose Garden',
  status: 'pending',
  grandTotal: 280000,
  advance: 50000
}, {
  id: '6',
  name: 'Gupta Tech Summit',
  customer: 'Vikram Gupta',
  phone: '+91 43210 98765',
  functionType: 'Corporate',
  functionDate: '12/01/2025',
  hall: 'Grand Banquet',
  status: 'enquiry',
  grandTotal: 120000,
  advance: 0
}, {
  id: '7',
  name: 'Sharma Anniversary',
  customer: 'Neha Sharma',
  phone: '+91 32109 87654',
  functionType: 'Reception',
  functionDate: '14/01/2025',
  hall: 'Emerald Room',
  status: 'cancelled',
  grandTotal: 95000,
  advance: 30000
}];
const TABS = ['All', 'Confirmed', 'Pending', 'Pencil', 'Quotation', 'Enquiry', 'Cancelled'];
function BookingsTable({
  onView
}) {
  const [activeTab, setActiveTab] = useStateTable('All');
  const [search, setSearch] = useStateTable('');
  const [page, setPage] = useStateTable(1);
  const PER_PAGE = 5;
  const filtered = SAMPLE_BOOKINGS.filter(b => {
    const matchTab = activeTab === 'All' || b.status === activeTab.toLowerCase();
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.customer.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      padding: 4,
      background: 'var(--surface-2)',
      borderRadius: 12,
      marginBottom: 16,
      overflowX: 'auto',
      width: 'fit-content',
      maxWidth: '100%'
    }
  }, TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => {
      setActiveTab(t);
      setPage(1);
    },
    style: {
      padding: '6px 13px',
      fontSize: 12.5,
      fontWeight: activeTab === t ? 600 : 500,
      color: activeTab === t ? 'var(--text-1)' : 'var(--text-3)',
      borderRadius: 9,
      border: 'none',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      fontFamily: 'inherit',
      transition: 'all 0.15s',
      background: activeTab === t ? 'var(--surface)' : 'transparent',
      boxShadow: activeTab === t ? '0 1px 3px rgba(15,23,42,0.08)' : 'none'
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      marginBottom: 16,
      maxWidth: 320
    }
  }, /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      left: 10,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 14,
      height: 14,
      stroke: 'var(--text-4)',
      fill: 'none',
      strokeWidth: 1.75,
      pointerEvents: 'none'
    },
    viewBox: "0 0 24 24"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.35-4.35"
  })), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search bookings\u2026",
    value: search,
    onChange: e => {
      setSearch(e.target.value);
      setPage(1);
    },
    style: {
      width: '100%',
      borderRadius: 12,
      padding: '8px 12px 8px 32px',
      fontSize: 13,
      fontFamily: 'inherit',
      border: '1px solid var(--border-2)',
      background: 'var(--surface)',
      color: 'var(--text-1)',
      boxSizing: 'border-box',
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 18,
      boxShadow: 'var(--shadow-xs)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: 760
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, ['Customer', 'Function', 'Date', 'Hall', 'Status', 'Grand Total', 'Advance', ''].map(h => /*#__PURE__*/React.createElement("th", {
    key: h,
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--text-4)',
      background: 'var(--surface-2)',
      padding: '9px 14px',
      textAlign: 'left',
      borderBottom: '1px solid var(--border)',
      whiteSpace: 'nowrap'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, paged.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 8,
    style: {
      padding: '40px',
      textAlign: 'center',
      color: 'var(--text-4)',
      fontSize: 13
    }
  }, "No bookings found")) : paged.map(b => /*#__PURE__*/React.createElement("tr", {
    key: b.id,
    style: {
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.12s',
      cursor: 'pointer'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'var(--teal-50)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent'
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 14px',
      verticalAlign: 'middle'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-1)'
    }
  }, b.customer), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)',
      marginTop: 1
    }
  }, b.phone)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 14px',
      fontSize: 13,
      color: 'var(--text-2)',
      verticalAlign: 'middle'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 160,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, b.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-4)',
      marginTop: 1
    }
  }, b.functionType)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 14px',
      fontSize: 13,
      color: 'var(--text-2)',
      fontVariantNumeric: 'tabular-nums',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap'
    }
  }, b.functionDate), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 14px',
      fontSize: 13,
      color: 'var(--text-2)',
      verticalAlign: 'middle'
    }
  }, b.hall), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 14px',
      verticalAlign: 'middle'
    }
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    status: b.status,
    size: "sm"
  })), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 14px',
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text-1)',
      fontVariantNumeric: 'tabular-nums',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap'
    }
  }, fmt(b.grandTotal)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 14px',
      fontSize: 13,
      color: 'var(--text-3)',
      fontVariantNumeric: 'tabular-nums',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap'
    }
  }, fmt(b.advance)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '10px 14px',
      verticalAlign: 'middle'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      opacity: 0.5
    },
    onMouseEnter: e => e.currentTarget.style.opacity = 1,
    onMouseLeave: e => e.currentTarget.style.opacity = 0.5
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onView && onView(b),
    style: {
      padding: '3px 8px',
      borderRadius: 7,
      background: 'var(--surface)',
      border: '1px solid var(--border-2)',
      fontSize: 11.5,
      fontWeight: 600,
      color: 'var(--text-3)',
      cursor: 'pointer',
      fontFamily: 'inherit'
    }
  }, "View")))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      borderTop: '1px solid var(--border)',
      fontSize: 12,
      color: 'var(--text-4)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Showing ", Math.min((page - 1) * PER_PAGE + 1, filtered.length), "\u2013", Math.min(page * PER_PAGE, filtered.length), " of ", filtered.length), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    disabled: page === 1,
    onClick: () => setPage(p => p - 1),
    style: {
      padding: '4px 10px',
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: 'var(--surface)',
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--text-3)',
      cursor: page === 1 ? 'not-allowed' : 'pointer',
      opacity: page === 1 ? 0.5 : 1,
      fontFamily: 'inherit'
    }
  }, "\u2190"), Array.from({
    length: totalPages
  }, (_, i) => i + 1).map(p => /*#__PURE__*/React.createElement("button", {
    key: p,
    onClick: () => setPage(p),
    style: {
      padding: '4px 10px',
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: page === p ? 'var(--teal-600)' : 'var(--surface)',
      fontSize: 12,
      fontWeight: 600,
      color: page === p ? 'white' : 'var(--text-3)',
      cursor: 'pointer',
      fontFamily: 'inherit'
    }
  }, p)), /*#__PURE__*/React.createElement("button", {
    disabled: page === totalPages,
    onClick: () => setPage(p => p + 1),
    style: {
      padding: '4px 10px',
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: 'var(--surface)',
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--text-3)',
      cursor: page === totalPages ? 'not-allowed' : 'pointer',
      opacity: page === totalPages ? 0.5 : 1,
      fontFamily: 'inherit'
    }
  }, "\u2192")))));
}
Object.assign(window, {
  BookingsTable,
  SAMPLE_BOOKINGS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/booking-dashboard/BookingsTable.jsx", error: String((e && e.message) || e) }); }

// ui_kits/booking-dashboard/KpiCard.jsx
try { (() => {
// KpiCard.jsx — Bika Banquet UI Kit
// Exports: KpiCard to window

function Sparkline({
  values,
  color = 'var(--teal-500)'
}) {
  if (!values || values.length < 2) return null;
  const w = 60,
    h = 24;
  const min = Math.min(...values),
    max = Math.max(...values);
  const range = Math.max(1, max - min);
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${h - (v - min) / range * (h - 2) - 1}`).join(' ');
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${w} ${h}`,
    width: "60",
    height: "24",
    "aria-hidden": "true",
    style: {
      overflow: 'visible'
    }
  }, /*#__PURE__*/React.createElement("polyline", {
    points: pts,
    fill: "none",
    stroke: color,
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }));
}
function DeltaBadge({
  value
}) {
  if (value === undefined || value === null) return null;
  const up = value >= 0;
  const neutral = value === 0;
  const bg = neutral ? 'var(--surface-2)' : up ? '#dcfce7' : '#fef2f2';
  const color = neutral ? 'var(--text-3)' : up ? '#15803d' : '#dc2626';
  const arrow = neutral ? '—' : up ? '↑' : '↓';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 7px',
      borderRadius: '9999px',
      background: bg,
      color
    }
  }, arrow, " ", Math.abs(value), "% Trend");
}
function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  sparkline,
  format = 'number'
}) {
  function fmt(v) {
    if (typeof v === 'string') return v;
    if (format === 'currency') return `₹${Number(v).toLocaleString('en-IN', {
      maximumFractionDigits: 0
    })}`;
    if (format === 'percent') return `${Number(v).toFixed(1)}%`;
    return Number(v).toLocaleString('en-IN');
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 18,
      padding: '18px 20px',
      boxShadow: 'var(--shadow-xs)',
      transition: 'border-color 0.2s',
      cursor: 'default'
    },
    onMouseEnter: e => e.currentTarget.style.borderColor = 'var(--border-2)',
    onMouseLeave: e => e.currentTarget.style.borderColor = 'var(--border)'
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--text-4)',
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, label), Icon && /*#__PURE__*/React.createElement(Icon, null)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 24,
      fontWeight: 700,
      color: 'var(--text-1)',
      letterSpacing: '-0.03em',
      lineHeight: 1,
      marginBottom: 8,
      fontVariantNumeric: 'tabular-nums'
    }
  }, fmt(value)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(DeltaBadge, {
    value: delta
  }), sparkline && /*#__PURE__*/React.createElement(Sparkline, {
    values: sparkline
  })));
}
Object.assign(window, {
  KpiCard,
  Sparkline
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/booking-dashboard/KpiCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/booking-dashboard/Sidebar.jsx
try { (() => {
// Sidebar.jsx — Bika Banquet UI Kit
// Exports: Sidebar to window

const {
  useState
} = React;
const NAV_PRIMARY = [{
  name: 'Dashboard',
  icon: 'layout-dashboard',
  href: 'dashboard'
}, {
  name: 'Bookings',
  icon: 'calendar-check',
  href: 'bookings'
}, {
  name: 'Calendar',
  icon: 'calendar-days',
  href: 'calendar'
}, {
  name: 'Customers',
  icon: 'users',
  href: 'customers'
}, {
  name: 'Enquiries',
  icon: 'phone-call',
  href: 'enquiries',
  badge: 3
}, {
  name: 'Payments',
  icon: 'indian-rupee',
  href: 'payments'
}];
const NAV_SECONDARY = [{
  name: 'Venues',
  icon: 'building-2',
  href: 'venues'
}, {
  name: 'Menu & Items',
  icon: 'utensils-crossed',
  href: 'menu'
}, {
  name: 'Reports',
  icon: 'bar-chart-3',
  href: 'reports'
}, {
  name: 'Activity Logs',
  icon: 'activity',
  href: 'logs'
}, {
  name: 'Settings',
  icon: 'settings',
  href: 'settings'
}];
const sidebarStyles = {
  sidebar: {
    width: '208px',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flexShrink: 0,
    position: 'relative',
    zIndex: 20,
    transition: 'width 0.2s ease'
  },
  sidebarCollapsed: {
    width: '64px'
  },
  logo: {
    padding: '16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minHeight: '52px'
  },
  nav: {
    flex: 1,
    padding: '10px 8px',
    overflowY: 'auto'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '7px 10px',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: 450,
    color: 'var(--text-3)',
    cursor: 'pointer',
    textDecoration: 'none',
    marginBottom: '2px',
    position: 'relative',
    transition: 'color 0.15s, background 0.15s',
    background: 'transparent',
    border: 'none',
    fontFamily: 'inherit',
    width: '100%',
    textAlign: 'left'
  },
  itemActive: {
    background: 'var(--teal-50)',
    color: 'var(--teal-700)',
    fontWeight: 600
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: '22%',
    bottom: '22%',
    width: '3px',
    background: 'var(--teal-500)',
    borderRadius: '0 3px 3px 0'
  },
  itemSecondary: {
    fontSize: '12.5px',
    fontWeight: 450
  },
  divider: {
    height: '1px',
    background: 'var(--border)',
    margin: '8px 4px'
  },
  badge: {
    marginLeft: 'auto',
    fontSize: '10px',
    fontWeight: 700,
    background: '#ef4444',
    color: 'white',
    borderRadius: '100px',
    padding: '1px 5px',
    minWidth: '16px',
    textAlign: 'center',
    lineHeight: '14px'
  },
  userRow: {
    padding: '10px 10px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
    flexShrink: 0
  },
  label: {
    overflow: 'hidden',
    transition: 'opacity 0.2s, width 0.2s'
  },
  labelCollapsed: {
    opacity: 0,
    width: 0,
    pointerEvents: 'none',
    display: 'none'
  }
};
function NavIcon({
  name,
  size = 15
}) {
  const icons = {
    'layout-dashboard': /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "3",
      width: "7",
      height: "7"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "14",
      y: "3",
      width: "7",
      height: "7"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "14",
      y: "14",
      width: "7",
      height: "7"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "14",
      width: "7",
      height: "7"
    })),
    'calendar-check': /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "4",
      width: "18",
      height: "18",
      rx: "2"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "16",
      y1: "2",
      x2: "16",
      y2: "6"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "8",
      y1: "2",
      x2: "8",
      y2: "6"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "3",
      y1: "10",
      x2: "21",
      y2: "10"
    }), /*#__PURE__*/React.createElement("polyline", {
      points: "9 16 11 18 15 14"
    })),
    'calendar-days': /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "4",
      width: "18",
      height: "18",
      rx: "2"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "16",
      y1: "2",
      x2: "16",
      y2: "6"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "8",
      y1: "2",
      x2: "8",
      y2: "6"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "3",
      y1: "10",
      x2: "21",
      y2: "10"
    })),
    'users': /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "9",
      cy: "7",
      r: "4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M23 21v-2a4 4 0 0 0-3-3.87"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M16 3.13a4 4 0 0 1 0 7.75"
    })),
    'phone-call': /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.12 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.65-1.65a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
    })),
    'indian-rupee': /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M6 3h12M6 8h12M6 13l8.5 8L18 13"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M6 13c0-2.21 1.79-5 6-5"
    })),
    'building-2': /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 6h4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 10h4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 14h4"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 18h4"
    })),
    'utensils-crossed': /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m2.1 21.8 6.4-6.3"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m19 5-7 7"
    })),
    'bar-chart-3': /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("line", {
      x1: "18",
      y1: "20",
      x2: "18",
      y2: "10"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "12",
      y1: "20",
      x2: "12",
      y2: "4"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "6",
      y1: "20",
      x2: "6",
      y2: "14"
    })),
    'activity': /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("polyline", {
      points: "22 12 18 12 15 21 9 3 6 12 2 12"
    })),
    'settings': /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "3"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"
    })),
    'log-out': /*#__PURE__*/React.createElement("svg", {
      width: 15,
      height: 15,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
    }), /*#__PURE__*/React.createElement("polyline", {
      points: "16 17 21 12 16 7"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "21",
      y1: "12",
      x2: "9",
      y2: "12"
    }))
  };
  return icons[name] || /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24"
  });
}
function Sidebar({
  active,
  onNavigate,
  collapsed,
  onLogout
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      ...sidebarStyles.sidebar,
      ...(collapsed ? sidebarStyles.sidebarCollapsed : {})
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: sidebarStyles.logo
  }, /*#__PURE__*/React.createElement("img", {
    src: "https://assets.zyrosite.com/MBlLcEqY2yw3y2EF/1-2-removebg-scaled-e1752152009924-7iV2qZXAcVUCou9o.png",
    alt: "Bika Banquet",
    style: {
      width: 28,
      height: 28,
      objectFit: 'contain',
      flexShrink: 0
    }
  }), !collapsed && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text-1)',
      whiteSpace: 'nowrap'
    }
  }, "Bika Banquet")), /*#__PURE__*/React.createElement("nav", {
    style: sidebarStyles.nav
  }, NAV_PRIMARY.map(item => {
    const isActive = active === item.href;
    return /*#__PURE__*/React.createElement("button", {
      key: item.href,
      onClick: () => onNavigate(item.href),
      style: {
        ...sidebarStyles.item,
        ...(isActive ? sidebarStyles.itemActive : {}),
        flexDirection: collapsed ? 'column' : 'row',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '8px 4px' : '7px 10px'
      }
    }, isActive && /*#__PURE__*/React.createElement("div", {
      style: sidebarStyles.activeBar
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        color: isActive ? 'var(--teal-600)' : 'currentColor',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(NavIcon, {
      name: item.icon
    })), !collapsed && /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        textAlign: 'left',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, item.name), !collapsed && item.badge && /*#__PURE__*/React.createElement("span", {
      style: sidebarStyles.badge
    }, item.badge), collapsed && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        lineHeight: 1.1,
        marginTop: 2,
        color: isActive ? 'var(--teal-700)' : 'var(--text-4)',
        textAlign: 'center'
      }
    }, item.name));
  }), /*#__PURE__*/React.createElement("div", {
    style: sidebarStyles.divider
  }), NAV_SECONDARY.map(item => {
    const isActive = active === item.href;
    return /*#__PURE__*/React.createElement("button", {
      key: item.href,
      onClick: () => onNavigate(item.href),
      style: {
        ...sidebarStyles.item,
        ...sidebarStyles.itemSecondary,
        ...(isActive ? sidebarStyles.itemActive : {}),
        flexDirection: collapsed ? 'column' : 'row',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '8px 4px' : '6px 10px'
      }
    }, isActive && /*#__PURE__*/React.createElement("div", {
      style: sidebarStyles.activeBar
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        color: isActive ? 'var(--teal-600)' : 'currentColor',
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(NavIcon, {
      name: item.icon,
      size: 14
    })), !collapsed && /*#__PURE__*/React.createElement("span", {
      style: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, item.name), collapsed && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        lineHeight: 1.1,
        marginTop: 2,
        color: isActive ? 'var(--teal-700)' : 'var(--text-4)',
        textAlign: 'center'
      }
    }, item.name));
  })), /*#__PURE__*/React.createElement("div", {
    style: sidebarStyles.userRow
  }, /*#__PURE__*/React.createElement("div", {
    style: sidebarStyles.avatar
  }, "A"), !collapsed && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--text-1)',
      margin: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, "Admin User"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 10,
      color: 'var(--text-4)',
      margin: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, "admin@bikabanquet.com")), !collapsed && /*#__PURE__*/React.createElement("button", {
    onClick: onLogout,
    title: "Log out",
    style: {
      border: 'none',
      background: 'none',
      color: 'var(--text-4)',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(NavIcon, {
    name: "log-out"
  }))));
}
Object.assign(window, {
  Sidebar,
  NavIcon
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/booking-dashboard/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/booking-dashboard/StatusBadge.jsx
try { (() => {
// StatusBadge.jsx — Bika Banquet UI Kit
// Exports: StatusBadge to window

const STATUS_MAP = {
  confirmed: {
    label: 'Confirmed',
    bg: '#dcfce7',
    color: '#15803d'
  },
  pending: {
    label: 'Pending',
    bg: '#fffbeb',
    color: '#92400e'
  },
  cancelled: {
    label: 'Cancelled',
    bg: '#fef2f2',
    color: '#991b1b'
  },
  quotation: {
    label: 'Quotation',
    bg: '#eff6ff',
    color: '#1d4ed8'
  },
  pencil: {
    label: 'Pencil',
    bg: '#fffbeb',
    color: '#92400e'
  },
  enquiry: {
    label: 'Enquiry',
    bg: '#f0f9ff',
    color: '#0369a1'
  }
};
function StatusBadge({
  status,
  size = 'md'
}) {
  const key = (status || '').toLowerCase().trim();
  const cfg = STATUS_MAP[key] || STATUS_MAP.pending;
  const isSmall = size === 'sm';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: isSmall ? '2px 7px' : '3px 9px',
      borderRadius: '9999px',
      fontSize: isSmall ? '11px' : '12px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      background: cfg.bg,
      color: cfg.color
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: cfg.color,
      display: 'inline-block',
      flexShrink: 0
    }
  }), cfg.label);
}
Object.assign(window, {
  StatusBadge
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/booking-dashboard/StatusBadge.jsx", error: String((e && e.message) || e) }); }

__ds_ns.RootLayout = __ds_scope.RootLayout;

})();
