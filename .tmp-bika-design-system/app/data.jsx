// data.jsx — mock domain data + helpers for Bika Banquet Ops
// Indian banquet-hall operations. Exported to window.

const VENUES = [
  { id:'v1', name:'Bika Andheri',  city:'Mumbai' },
  { id:'v2', name:'Bika Bandra',   city:'Mumbai' },
  { id:'v3', name:'Bika Powai',    city:'Mumbai' },
];

const HALLS = [
  { id:'h1', venueId:'v1', name:'Grand Ballroom', capacity:500, floating:600, floor:'2', basePrice:250000 },
  { id:'h2', venueId:'v1', name:'Crystal Hall',   capacity:200, floating:240, floor:'1', basePrice:120000 },
  { id:'h3', venueId:'v1', name:'Heritage Hall',  capacity:300, floating:360, floor:'3', basePrice:160000 },
  { id:'h4', venueId:'v2', name:'Emerald Suite',  capacity:80,  floating:100, floor:'1', basePrice:60000 },
  { id:'h5', venueId:'v2', name:'Sapphire Room',  capacity:120, floating:150, floor:'2', basePrice:90000 },
  { id:'h6', venueId:'v3', name:'Pearl Lawn',     capacity:800, floating:1000,floor:'G', basePrice:320000 },
  { id:'h7', venueId:'v3', name:'Ruby Hall',      capacity:150, floating:180, floor:'1', basePrice:100000 },
];

const CUSTOMERS = [
  { id:'c1', name:'Ramesh Kapoor', phone:'+91 98200 31111', altPhone:'+91 98200 31112', email:'ramesh@kapoorgroup.in', city:'Mumbai', community:'Sindhi', dob:'12 Apr 1968', anniversary:'28 Nov 1994', occupation:'Business Owner', company:'Kapoor Textiles', gst:'27AABCK1234M1Z5', pan:'AABCK1234M', priority:'VIP', rating:5, visits:6, referredBy:null, referrals:['c4'], notes:'Prefers Grand Ballroom. Annual Diwali event.' },
  { id:'c2', name:'Priya Sharma', phone:'+91 99300 22122', altPhone:null, email:'priya.sharma@gmail.com', city:'Mumbai', community:'Punjabi', dob:'03 Jul 1985', anniversary:'14 Feb 2012', occupation:'Doctor', company:'Lilavati Hospital', gst:null, pan:'BXPPS5678K', priority:'High', rating:4, visits:3, referredBy:'c1', referrals:[], notes:'' },
  { id:'c3', name:'Anita Mehta', phone:'+91 98677 45333', altPhone:null, email:'anita.mehta@outlook.com', city:'Thane', community:'Gujarati', dob:'21 Sep 1979', anniversary:null, occupation:'Architect', company:'Mehta Designs', gst:'27AADCM9876P1Z2', pan:'AADCM9876P', priority:'Normal', rating:4, visits:2, referredBy:null, referrals:[], notes:'Vegetarian only. Jain food for 40 guests.' },
  { id:'c4', name:'Sunil Kumar', phone:'+91 90040 67444', altPhone:'+91 90040 67445', email:'sunil.k@kumarent.in', city:'Navi Mumbai', community:'Marwari', dob:'08 Jan 1972', anniversary:'19 Dec 2000', occupation:'Industrialist', company:'Kumar Enterprises', gst:'27AABCK5544Q1Z9', pan:'AABCK5544Q', priority:'VIP', rating:5, visits:8, referredBy:'c1', referrals:[], notes:'Big spender. Always books premium packs.' },
  { id:'c5', name:'Deepak Patel', phone:'+91 97690 88555', altPhone:null, email:'deepak.patel@patelco.in', city:'Mumbai', community:'Gujarati', dob:'30 May 1981', anniversary:'07 Mar 2009', occupation:'CA', company:'Patel & Associates', gst:null, pan:'CDXPP3344L', priority:'High', rating:4, visits:3, referredBy:null, referrals:[], notes:'' },
  { id:'c6', name:'Lalitha Iyer', phone:'+91 98200 99666', altPhone:null, email:'lalitha.iyer@gmail.com', city:'Mumbai', community:'Tamil', dob:'15 Oct 1975', anniversary:'02 Sep 1999', occupation:'Professor', company:'IIT Bombay', gst:null, pan:'EXAPI7788M', priority:'Normal', rating:5, visits:4, referredBy:'c2', referrals:[], notes:'South Indian catering preferred.' },
  { id:'c7', name:'Farhan Qureshi', phone:'+91 99201 12777', altPhone:null, email:'farhan.q@quresoft.com', city:'Mumbai', community:'Muslim', dob:'24 Mar 1988', anniversary:null, occupation:'Tech Founder', company:'Quresoft', gst:'27AAFCQ2211R1Z4', pan:'AAFCQ2211R', priority:'High', rating:4, visits:1, referredBy:null, referrals:[], notes:'Halal catering required.' },
  { id:'c8', name:'Meera Reddy', phone:'+91 90820 33888', altPhone:null, email:'meera.reddy@reddyfin.in', city:'Hyderabad', community:'Telugu', dob:'11 Dec 1983', anniversary:'25 Jan 2011', occupation:'Banker', company:'Reddy Finance', gst:null, pan:'FGHPR9900N', priority:'Normal', rating:3, visits:1, referredBy:null, referrals:[], notes:'' },
];

const MENU_PACKS = [
  { id:'mp1', name:'Royal Veg Thali',    rate:1200, setup:25000, veg:true,  course:'Lunch/Dinner' },
  { id:'mp2', name:'Premium Non-Veg',    rate:1800, setup:35000, veg:false, course:'Lunch/Dinner' },
  { id:'mp3', name:'Wedding Grand Buffet',rate:2200, setup:50000, veg:false, course:'Dinner' },
  { id:'mp4', name:'South Indian Feast',  rate:1100, setup:20000, veg:true,  course:'Lunch' },
  { id:'mp5', name:'Hi-Tea Snacks',       rate:650,  setup:12000, veg:true,  course:'Hi-Tea' },
  { id:'mp6', name:'Continental Spread',  rate:1600, setup:30000, veg:false, course:'Dinner' },
];

// helper: build a date in 2026
const d = (m, day, h=10, min=0) => new Date(2026, m-1, day, h, min);

const BOOKINGS = [
  { id:'BK-24301', status:'confirmed', source:'in-app', functionName:'Kapoor Wedding Reception', functionType:'Wedding Reception', customerId:'c1', start:d(6,15,10), end:d(6,15,22), hallIds:['h1'], expectedGuests:350, confirmedGuests:312, packs:[{packId:'mp3',plates:350,slot:'Dinner'}], hallCharges:250000, discount:25000, taxPct:18, advanceReq:300000, payments:[{id:'p1',date:d(4,2),method:'UPI',ref:'UPI8821',amount:300000,by:'Anita'},{id:'p2',date:d(5,10),method:'Bank Transfer',ref:'NEFT5521',amount:60958,by:'Suresh'}], notes:'DJ confirmed 22:00–02:00. Floral arch at entry — Shyam Decorators. AC service by 10 Jun.', versions:3, pencilExpiresAt:null },
  { id:'BK-24302', status:'pencil', source:'in-app', functionName:'Sharma Anniversary Dinner', functionType:'Anniversary', customerId:'c2', start:d(6,18,11), end:d(6,18,16), hallIds:['h2'], expectedGuests:120, confirmedGuests:0, packs:[{packId:'mp1',plates:120,slot:'Lunch'}], hallCharges:120000, discount:0, taxPct:18, advanceReq:80000, payments:[], notes:'', versions:1, pencilExpiresAt:d(6,5) },
  { id:'BK-24303', status:'quotation', source:'in-app', functionName:'Mehta Birthday Celebration', functionType:'Birthday', customerId:'c3', start:d(6,20,19), end:d(6,20,23), hallIds:['h3'], expectedGuests:200, confirmedGuests:0, packs:[{packId:'mp4',plates:200,slot:'Dinner'}], hallCharges:160000, discount:10000, taxPct:18, advanceReq:100000, payments:[], notes:'Jain food for 40 guests.', versions:2, pencilExpiresAt:null },
  { id:'BK-24304', status:'enquiry', source:'google', functionName:'Kumar Engagement Ceremony', functionType:'Engagement', customerId:'c4', start:d(6,22,14), end:d(6,22,18), hallIds:['h4'], expectedGuests:80, confirmedGuests:0, packs:[{packId:'mp2',plates:80,slot:'Lunch'}], hallCharges:60000, discount:0, taxPct:18, advanceReq:40000, payments:[], notes:'', versions:1, pencilExpiresAt:null },
  { id:'BK-24305', status:'confirmed', source:'in-app', functionName:'Patel Family Reunion', functionType:'Reunion', customerId:'c5', start:d(6,25,12), end:d(6,25,17), hallIds:['h1'], expectedGuests:400, confirmedGuests:380, packs:[{packId:'mp3',plates:400,slot:'Lunch'}], hallCharges:250000, discount:40000, taxPct:18, advanceReq:350000, payments:[{id:'p3',date:d(5,1),method:'Cheque',ref:'CHQ3344',amount:350000,by:'Anita'}], notes:'', versions:2, pencilExpiresAt:null },
  { id:'BK-24306', status:'pencil', source:'in-app', functionName:'Iyer Naming Ceremony', functionType:'Naming', customerId:'c6', start:d(6,28,9), end:d(6,28,13), hallIds:['h2'], expectedGuests:90, confirmedGuests:0, packs:[{packId:'mp4',plates:90,slot:'Lunch'}], hallCharges:90000, discount:0, taxPct:18, advanceReq:50000, payments:[{id:'p4',date:d(5,20),method:'UPI',ref:'UPI9931',amount:20000,by:'Rakesh'}], notes:'South Indian catering.', versions:1, pencilExpiresAt:d(6,8) },
  { id:'BK-24307', status:'confirmed', source:'in-app', functionName:'Qureshi Walima', functionType:'Walima', customerId:'c7', start:d(7,2,19), end:d(7,2,23), hallIds:['h6'], expectedGuests:600, confirmedGuests:540, packs:[{packId:'mp2',plates:600,slot:'Dinner'}], hallCharges:320000, discount:50000, taxPct:18, advanceReq:400000, payments:[{id:'p5',date:d(5,15),method:'Bank Transfer',ref:'NEFT7788',amount:400000,by:'Suresh'}], notes:'Halal catering required. Separate ladies section.', versions:2, pencilExpiresAt:null },
  { id:'BK-24308', status:'quotation', source:'google', functionName:'Reddy Sangeet', functionType:'Sangeet', customerId:'c8', start:d(7,5,18), end:d(7,5,23), hallIds:['h7'], expectedGuests:150, confirmedGuests:0, packs:[{packId:'mp6',plates:150,slot:'Dinner'}], hallCharges:100000, discount:0, taxPct:18, advanceReq:80000, payments:[], notes:'', versions:1, pencilExpiresAt:null },
  { id:'BK-24309', status:'confirmed', source:'in-app', functionName:'Kapoor Diwali Gala', functionType:'Corporate', customerId:'c1', start:d(7,12,19), end:d(7,12,23), hallIds:['h1','h3'], expectedGuests:500, confirmedGuests:450, packs:[{packId:'mp3',plates:500,slot:'Dinner'}], hallCharges:410000, discount:60000, taxPct:18, advanceReq:500000, payments:[{id:'p6',date:d(5,25),method:'Bank Transfer',ref:'NEFT9012',amount:500000,by:'Suresh'}], notes:'Repeat annual event. VIP handling.', versions:1, pencilExpiresAt:null },
  { id:'BK-24310', status:'enquiry', source:'in-app', functionName:'Kumar Product Launch', functionType:'Corporate', customerId:'c4', start:d(7,18,16), end:d(7,18,20), hallIds:['h5'], expectedGuests:100, confirmedGuests:0, packs:[{packId:'mp5',plates:100,slot:'Hi-Tea'}], hallCharges:90000, discount:0, taxPct:18, advanceReq:50000, payments:[], notes:'', versions:1, pencilExpiresAt:null },
  { id:'BK-24311', status:'confirmed', source:'google', functionName:'Malhotra Mehendi', functionType:'Mehendi', customerId:'c2', start:d(6,15,12), end:d(6,15,16), hallIds:['h1'], expectedGuests:180, confirmedGuests:160, packs:[{packId:'mp1',plates:180,slot:'Lunch'}], hallCharges:250000, discount:20000, taxPct:18, advanceReq:200000, payments:[{id:'p7',date:d(5,18),method:'UPI',ref:'UPI4521',amount:210000,by:'Anita'}], notes:'Overlaps Kapoor Wedding — resolve hall clash.', versions:1, pencilExpiresAt:null },
];

// Activity log
const ACTIVITY = [
  { id:'a1', when:d(6,1,14,32), user:'Suresh', action:'confirmed', target:'BK-24301', fn:'Kapoor Wedding Reception', detail:'₹3.84L grand total', ip:'10.2.1.14' },
  { id:'a2', when:d(6,1,14,30), user:'Anita',  action:'added payment', target:'BK-24305', fn:'Patel Family Reunion', detail:'₹3,50,000 · Cheque CHQ3344', ip:'10.2.1.09' },
  { id:'a3', when:d(6,1,14,25), user:'Vikram', action:'updated hall', target:'BK-24302', fn:'Sharma Anniversary', detail:'Grand Ballroom → Crystal Hall', ip:'10.2.1.22' },
  { id:'a4', when:d(6,1,14,12), user:'Rakesh', action:'created enquiry', target:'BK-24310', fn:'Kumar Product Launch', detail:'Hi-Tea · 100 guests', ip:'10.2.1.31' },
  { id:'a5', when:d(6,1,13,58), user:'Anita',  action:'marked pencil', target:'BK-24306', fn:'Iyer Naming Ceremony', detail:'Expiry: 08 Jun 2026', ip:'10.2.1.09' },
  { id:'a6', when:d(6,1,13,40), user:'Suresh', action:'sent quotation', target:'BK-24308', fn:'Reddy Sangeet', detail:'₹1.77L estimate emailed', ip:'10.2.1.14' },
  { id:'a7', when:d(6,1,11,20), user:'Vikram', action:'edited menu', target:'BK-24303', fn:'Mehta Birthday', detail:'Added Jain meal x40', ip:'10.2.1.22' },
  { id:'a8', when:d(6,1,10,5), user:'Anita',  action:'confirmed', target:'BK-24307', fn:'Qureshi Walima', detail:'₹400000 advance received', ip:'10.2.1.09' },
];

const USERS = [
  { id:'u1', name:'Priya Nambiar', role:'Operations Lead', branch:'Andheri', email:'priya@bika.in', active:true },
  { id:'u2', name:'Suresh Iyer',   role:'Booking Manager', branch:'Andheri', email:'suresh@bika.in', active:true },
  { id:'u3', name:'Anita Desai',   role:'Accounts',        branch:'Bandra',  email:'anita@bika.in', active:true },
  { id:'u4', name:'Vikram Shah',   role:'Coordinator',     branch:'Powai',   email:'vikram@bika.in', active:true },
  { id:'u5', name:'Rakesh Menon',  role:'Sales',           branch:'Andheri', email:'rakesh@bika.in', active:false },
];

// ── derived helpers ─────────────────────────────────────────────
const _cust = new Map(CUSTOMERS.map(c=>[c.id,c]));
const _hall = new Map(HALLS.map(h=>[h.id,h]));
const _venue = new Map(VENUES.map(v=>[v.id,v]));
const _pack = new Map(MENU_PACKS.map(p=>[p.id,p]));

const customerById = id => _cust.get(id) || { name:'—', phone:'—' };
const hallById = id => _hall.get(id) || { name:'—' };
const venueById = id => _venue.get(id) || { name:'—' };
const packById = id => _pack.get(id) || { name:'—', rate:0, setup:0 };

function bookingTotal(b) {
  const packsTotal = b.packs.reduce((s,p)=>{ const mp=packById(p.packId); return s + p.plates*mp.rate + mp.setup; },0);
  const sub = b.hallCharges + packsTotal;
  const afterD = sub - (b.discount||0);
  const tax = afterD * (b.taxPct||0)/100;
  const grand = afterD + tax;
  const received = b.payments.reduce((s,p)=>s+p.amount,0);
  return { sub, afterD, tax, grand, received, balance:Math.max(0,grand-received), packsTotal };
}

// INR formatting → ₹X.XXL (lakhs) or ₹X.XXCr
function inr(n) {
  if (n>=10000000) return '₹'+(n/10000000).toFixed(2)+'Cr';
  if (n>=100000)   return '₹'+(n/100000).toFixed(2)+'L';
  if (n>=1000)     return '₹'+(n/1000).toFixed(0)+'K';
  return '₹'+n;
}
// full rupee with commas (Indian grouping)
function inrFull(n) {
  const s = Math.round(n).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0,-3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g,',')+','+last3 : last3;
  return '₹'+grouped;
}

const fmtDate = dt => dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
const fmtDateFull = dt => dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
const fmtTime = dt => dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false});

// conflict detection: same hall, overlapping time
function detectConflicts(bookings) {
  const out = new Set();
  for (let i=0;i<bookings.length;i++) for (let j=i+1;j<bookings.length;j++) {
    const a=bookings[i], b=bookings[j];
    if (a.status==='cancelled'||b.status==='cancelled') continue;
    const shareHall = a.hallIds.some(h=>b.hallIds.includes(h));
    if (!shareHall) continue;
    if (a.start < b.end && b.start < a.end) { out.add(a.id); out.add(b.id); }
  }
  return out;
}

// Enquiry pipeline derived
const ENQUIRY_STAGES = ['Lead','Quotation','Pencil','Won','Lost'];
const ENQUIRIES = [
  { id:'EN-0001', customerId:'c4', functionType:'Engagement', date:d(6,22), guests:80,  hallIds:['h4'], stage:'Lead',      est:120000, created:d(5,20) },
  { id:'EN-0002', customerId:'c8', functionType:'Sangeet',    date:d(7,5),  guests:150, hallIds:['h7'], stage:'Quotation', est:177000, created:d(5,22) },
  { id:'EN-0003', customerId:'c2', functionType:'Anniversary',date:d(6,18), guests:120, hallIds:['h2'], stage:'Pencil',    est:195000, created:d(5,18) },
  { id:'EN-0004', customerId:'c6', functionType:'Naming',     date:d(6,28), guests:90,  hallIds:['h2'], stage:'Pencil',    est:106000, created:d(5,19) },
  { id:'EN-0005', customerId:'c1', functionType:'Wedding',    date:d(6,15), guests:350, hallIds:['h1'], stage:'Won',       est:1180000,created:d(4,1) },
  { id:'EN-0006', customerId:'c7', functionType:'Walima',     date:d(7,2),  guests:600, hallIds:['h6'], stage:'Won',       est:2400000,created:d(5,10) },
  { id:'EN-0007', customerId:'c5', functionType:'Reunion',    date:d(6,25), guests:400, hallIds:['h1'], stage:'Won',       est:1100000,created:d(4,28) },
  { id:'EN-0008', customerId:'c3', functionType:'Birthday',   date:d(6,20), guests:200, hallIds:['h3'], stage:'Quotation', est:224000, created:d(5,15) },
  { id:'EN-0009', customerId:'c4', functionType:'Corporate',  date:d(7,18), guests:100, hallIds:['h5'], stage:'Lead',      est:108000, created:d(5,28) },
  { id:'EN-0010', customerId:'c8', functionType:'Birthday',   date:d(5,30), guests:60,  hallIds:['h4'], stage:'Lost',      est:72000,  created:d(5,1) },
];

Object.assign(window, {
  VENUES, HALLS, CUSTOMERS, MENU_PACKS, BOOKINGS, ACTIVITY, USERS, ENQUIRIES, ENQUIRY_STAGES,
  customerById, hallById, venueById, packById,
  bookingTotal, inr, inrFull, fmtDate, fmtDateFull, fmtTime, detectConflicts,
});
