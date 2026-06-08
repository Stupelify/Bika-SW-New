// data.js — Shared calendar data for Bika Banquet calendar redesign
// Reference date: May 21, 2026 (Thursday)

const HALLS = [
  { id: 'crystal', name: 'Crystal Hall',   capacity: 800, color: '#0d9488', tint: '#f0fdfa' }, // teal
  { id: 'grand',   name: 'Grand Banquet',  capacity: 500, color: '#6366f1', tint: '#eef2ff' }, // indigo
  { id: 'emerald', name: 'Emerald Room',   capacity: 300, color: '#f59e0b', tint: '#fffbeb' }, // amber
  { id: 'rose',    name: 'Rose Garden',    capacity: 200, color: '#e11d48', tint: '#fff1f2' }, // rose
];

const SLOTS = [
  { id: 'morning', label: 'Morning', shortLabel: 'Morn',  startH: 9,  endH: 12, startLabel: '9 AM',  endLabel: '12 PM' },
  { id: 'lunch',   label: 'Lunch',   shortLabel: 'Lunch', startH: 12, endH: 16, startLabel: '12 PM', endLabel: '4 PM'  },
  { id: 'evening', label: 'Evening', shortLabel: 'Eve',   startH: 16, endH: 19, startLabel: '4 PM',  endLabel: '7 PM'  },
  { id: 'dinner',  label: 'Dinner',  shortLabel: 'Dinn',  startH: 19, endH: 23, startLabel: '7 PM',  endLabel: '11 PM' },
];

const STATUS = {
  confirmed: { label: 'Confirmed', bg: '#dcfce7', text: '#15803d', accent: '#22c55e', soft: '#f0fdf4' },
  pencil:    { label: 'Pencil',    bg: '#fffbeb', text: '#92400e', accent: '#f59e0b', soft: '#fffbeb' },
  quotation: { label: 'Quotation', bg: '#eff6ff', text: '#1d4ed8', accent: '#3b82f6', soft: '#eff6ff' },
  enquiry:   { label: 'Enquiry',   bg: '#f0f9ff', text: '#0369a1', accent: '#0ea5e9', soft: '#f0f9ff' },
  pending:   { label: 'Pending',   bg: '#fffbeb', text: '#92400e', accent: '#f59e0b', soft: '#fffbeb' },
  cancelled: { label: 'Cancelled', bg: '#fef2f2', text: '#991b1b', accent: '#ef4444', soft: '#fef2f2' },
};

// Sample bookings spread across May 2026 (today = May 21)
// Includes intentional conflict on May 23 (Crystal Hall, Lunch) for warning demo
const BOOKINGS = [
  // Week 1 (May 1-3)
  { id: 'b01', date: '2026-05-01', hall: 'crystal', slot: 'dinner',  function: 'Mehta Reception',     customer: 'Anita Mehta',     type: 'Reception', guests: 450, status: 'confirmed', grand: 425000 },
  { id: 'b02', date: '2026-05-02', hall: 'grand',   slot: 'evening', function: 'Verma Sangeet',       customer: 'Pooja Verma',     type: 'Wedding',   guests: 280, status: 'confirmed', grand: 215000 },
  { id: 'b03', date: '2026-05-02', hall: 'crystal', slot: 'dinner',  function: 'Verma Wedding',       customer: 'Pooja Verma',     type: 'Wedding',   guests: 650, status: 'confirmed', grand: 780000 },
  { id: 'b04', date: '2026-05-03', hall: 'emerald', slot: 'lunch',   function: 'Iyer Engagement',     customer: 'Karthik Iyer',    type: 'Wedding',   guests: 180, status: 'confirmed', grand: 165000 },
  { id: 'b05', date: '2026-05-03', hall: 'rose',    slot: 'evening', function: 'TechCorp Mixer',      customer: 'TechCorp Ltd',    type: 'Corporate', guests: 120, status: 'confirmed', grand: 95000 },

  // Week 2 (May 8-10) — wedding cluster
  { id: 'b06', date: '2026-05-08', hall: 'crystal', slot: 'evening', function: 'Sharma Mehndi',       customer: 'Priya Sharma',    type: 'Wedding',   guests: 320, status: 'confirmed', grand: 245000 },
  { id: 'b07', date: '2026-05-09', hall: 'crystal', slot: 'dinner',  function: 'Sharma Wedding',      customer: 'Priya Sharma',    type: 'Wedding',   guests: 750, status: 'confirmed', grand: 920000 },
  { id: 'b08', date: '2026-05-09', hall: 'grand',   slot: 'lunch',   function: 'Patel Anniversary',   customer: 'Rajesh Patel',    type: 'Reception', guests: 250, status: 'confirmed', grand: 195000 },
  { id: 'b09', date: '2026-05-10', hall: 'crystal', slot: 'lunch',   function: 'Sharma Reception',    customer: 'Priya Sharma',    type: 'Reception', guests: 580, status: 'confirmed', grand: 540000 },
  { id: 'b10', date: '2026-05-10', hall: 'emerald', slot: 'dinner',  function: 'Kapoor Birthday',     customer: 'Aarav Kapoor',    type: 'Birthday',  guests: 90,  status: 'confirmed', grand: 75000 },

  // Week 3 (May 15-17)
  { id: 'b11', date: '2026-05-15', hall: 'grand',   slot: 'dinner',  function: 'Mumbai Tech Gala',    customer: 'Mumbai Tech',     type: 'Corporate', guests: 380, status: 'confirmed', grand: 425000 },
  { id: 'b12', date: '2026-05-16', hall: 'rose',    slot: 'morning', function: 'Yoga Retreat',        customer: 'Wellness Co',     type: 'Corporate', guests: 80,  status: 'quotation', grand: 55000 },
  { id: 'b13', date: '2026-05-16', hall: 'crystal', slot: 'dinner',  function: 'Khanna Wedding',      customer: 'Meera Khanna',    type: 'Wedding',   guests: 700, status: 'confirmed', grand: 875000 },
  { id: 'b14', date: '2026-05-17', hall: 'emerald', slot: 'lunch',   function: 'Joshi Engagement',    customer: 'Rohit Joshi',     type: 'Wedding',   guests: 150, status: 'pencil',    grand: 145000 },

  // This week — May 18-24 (current)
  { id: 'b15', date: '2026-05-18', hall: 'grand',   slot: 'lunch',   function: 'BoardCo Annual',      customer: 'BoardCo',         type: 'Corporate', guests: 220, status: 'confirmed', grand: 185000 },
  { id: 'b16', date: '2026-05-19', hall: 'crystal', slot: 'evening', function: 'Singh Sangeet',       customer: 'Kavita Singh',    type: 'Wedding',   guests: 400, status: 'confirmed', grand: 295000 },
  { id: 'b17', date: '2026-05-20', hall: 'crystal', slot: 'dinner',  function: 'Singh Wedding',       customer: 'Kavita Singh',    type: 'Wedding',   guests: 720, status: 'confirmed', grand: 895000 },
  { id: 'b18', date: '2026-05-20', hall: 'rose',    slot: 'dinner',  function: 'Garcia Birthday',     customer: 'Maria Garcia',    type: 'Birthday',  guests: 100, status: 'confirmed', grand: 85000 },

  // TODAY — May 21, Thursday
  { id: 'b19', date: '2026-05-21', hall: 'crystal', slot: 'morning', function: 'Banking Summit',      customer: 'HDFC Bank',       type: 'Corporate', guests: 200, status: 'confirmed', grand: 165000 },
  { id: 'b20', date: '2026-05-21', hall: 'grand',   slot: 'lunch',   function: 'Pharma Conference',   customer: 'Sun Pharma',      type: 'Corporate', guests: 280, status: 'confirmed', grand: 245000 },
  { id: 'b21', date: '2026-05-21', hall: 'crystal', slot: 'evening', function: 'Singh Reception',     customer: 'Kavita Singh',    type: 'Reception', guests: 480, status: 'confirmed', grand: 425000 },
  { id: 'b22', date: '2026-05-21', hall: 'emerald', slot: 'dinner',  function: 'Reddy Engagement',    customer: 'Aditya Reddy',    type: 'Wedding',   guests: 160, status: 'pencil',    grand: 145000 },
  { id: 'b23', date: '2026-05-21', hall: 'rose',    slot: 'evening', function: 'PixelCo Launch',      customer: 'PixelCo',         type: 'Corporate', guests: 95,  status: 'quotation', grand: 78000 },

  // Tomorrow — May 22, Friday
  { id: 'b24', date: '2026-05-22', hall: 'crystal', slot: 'dinner',  function: 'Gupta Wedding',       customer: 'Vikram Gupta',    type: 'Wedding',   guests: 680, status: 'confirmed', grand: 825000 },
  { id: 'b25', date: '2026-05-22', hall: 'grand',   slot: 'dinner',  function: 'Nair Reception',      customer: 'Suresh Nair',     type: 'Reception', guests: 420, status: 'confirmed', grand: 385000 },
  { id: 'b26', date: '2026-05-22', hall: 'emerald', slot: 'evening', function: 'BookClub Awards',     customer: 'IndiaReads',      type: 'Corporate', guests: 140, status: 'enquiry',   grand: 92000 },

  // Sat May 23 — peak day with CONFLICT
  { id: 'b27', date: '2026-05-23', hall: 'crystal', slot: 'morning', function: 'Agarwal Pooja',       customer: 'Sunita Agarwal',  type: 'Wedding',   guests: 180, status: 'confirmed', grand: 125000 },
  { id: 'b28', date: '2026-05-23', hall: 'crystal', slot: 'lunch',   function: 'Agarwal Reception',   customer: 'Sunita Agarwal',  type: 'Reception', guests: 520, status: 'confirmed', grand: 485000 },
  { id: 'b29', date: '2026-05-23', hall: 'crystal', slot: 'lunch',   function: 'Bose Engagement',     customer: 'Aniket Bose',     type: 'Wedding',   guests: 200, status: 'pencil',    grand: 175000, conflict: true },
  { id: 'b30', date: '2026-05-23', hall: 'crystal', slot: 'dinner',  function: 'Agarwal Wedding',     customer: 'Sunita Agarwal',  type: 'Wedding',   guests: 780, status: 'confirmed', grand: 965000 },
  { id: 'b31', date: '2026-05-23', hall: 'grand',   slot: 'morning', function: 'Mehta Pooja',         customer: 'Anita Mehta',     type: 'Wedding',   guests: 220, status: 'confirmed', grand: 145000 },
  { id: 'b32', date: '2026-05-23', hall: 'grand',   slot: 'evening', function: 'Mehta Sangeet',       customer: 'Anita Mehta',     type: 'Wedding',   guests: 350, status: 'confirmed', grand: 285000 },
  { id: 'b33', date: '2026-05-23', hall: 'grand',   slot: 'dinner',  function: 'Mehta Wedding',       customer: 'Anita Mehta',     type: 'Wedding',   guests: 620, status: 'confirmed', grand: 745000 },
  { id: 'b34', date: '2026-05-23', hall: 'emerald', slot: 'lunch',   function: 'Khan Anniversary',    customer: 'Farhan Khan',     type: 'Reception', guests: 240, status: 'confirmed', grand: 215000 },
  { id: 'b35', date: '2026-05-23', hall: 'emerald', slot: 'dinner',  function: 'Roy Birthday',        customer: 'Debasish Roy',    type: 'Birthday',  guests: 110, status: 'confirmed', grand: 88000 },
  { id: 'b36', date: '2026-05-23', hall: 'rose',    slot: 'lunch',   function: 'Pillai Engagement',   customer: 'Lakshmi Pillai',  type: 'Wedding',   guests: 140, status: 'confirmed', grand: 125000 },
  { id: 'b37', date: '2026-05-23', hall: 'rose',    slot: 'dinner',  function: 'Pillai Wedding',      customer: 'Lakshmi Pillai',  type: 'Wedding',   guests: 195, status: 'confirmed', grand: 185000 },

  // Sun May 24
  { id: 'b38', date: '2026-05-24', hall: 'crystal', slot: 'lunch',   function: 'Bose Family Brunch',  customer: 'Aniket Bose',     type: 'Reception', guests: 320, status: 'enquiry',   grand: 245000 },
  { id: 'b39', date: '2026-05-24', hall: 'grand',   slot: 'dinner',  function: 'Anand Birthday',      customer: 'Devika Anand',    type: 'Birthday',  guests: 180, status: 'quotation', grand: 135000 },

  // Next week
  { id: 'b40', date: '2026-05-29', hall: 'crystal', slot: 'dinner',  function: 'Chopra Wedding',      customer: 'Karan Chopra',    type: 'Wedding',   guests: 690, status: 'confirmed', grand: 825000 },
  { id: 'b41', date: '2026-05-30', hall: 'grand',   slot: 'evening', function: 'StartupIN Demo Day',  customer: 'StartupIN',       type: 'Corporate', guests: 220, status: 'confirmed', grand: 145000 },
  { id: 'b42', date: '2026-05-30', hall: 'crystal', slot: 'dinner',  function: 'Chopra Reception',    customer: 'Karan Chopra',    type: 'Reception', guests: 580, status: 'confirmed', grand: 625000 },
  { id: 'b43', date: '2026-05-31', hall: 'emerald', slot: 'lunch',   function: 'Family Day Brunch',   customer: 'Ravi Menon',      type: 'Reception', guests: 130, status: 'pencil',    grand: 95000 },
];

// Helpers
function getDate(iso) { return new Date(iso + 'T00:00:00'); }
function formatINR(n) { if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`; if (n >= 1000) return `₹${Math.round(n/1000)}K`; return `₹${n}`; }
function dayName(d) { return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]; }
function fullDayName(d) { return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]; }
function monthName(d) { return ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()]; }
function shortMonth(d) { return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]; }

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
function hallById(id) { return HALLS.find(h => h.id === id); }
function slotById(id) { return SLOTS.find(s => s.id === id); }
function statusOf(s) { return STATUS[s] || STATUS.pending; }

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
  HALLS, SLOTS, STATUS, BOOKINGS, TODAY, TODAY_ISO,
  getDate, formatINR, dayName, fullDayName, monthName, shortMonth,
  bookingsForDate, bookingsForRange, isoDate, hallById, slotById, statusOf, buildMonthGrid,
});
