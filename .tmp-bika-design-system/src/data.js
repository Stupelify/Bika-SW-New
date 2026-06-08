// Mock data for Bika Banquet prototype
window.BIKA = (function() {

  const halls = [
    { id: 'H1', name: 'Grand Ballroom', cap: 800, tier: 'Premium' },
    { id: 'H2', name: 'Crystal Hall',   cap: 450, tier: 'Premium' },
    { id: 'H3', name: 'Heritage Hall',  cap: 600, tier: 'Standard' },
    { id: 'H4', name: 'Garden Pavilion',cap: 250, tier: 'Outdoor' },
    { id: 'H5', name: 'Emerald Suite',  cap: 150, tier: 'Compact' },
  ];

  const customers = [
    { id: 'CUS-1142', name: 'Aarav & Diya Sharma',  phone: '+91 98201 23456', city: 'Mumbai',     bookings: 3, value: 1850000, since: '2024' },
    { id: 'CUS-1098', name: 'Rohan Mehta',           phone: '+91 99812 44091', city: 'Pune',       bookings: 1, value: 425000,  since: '2026' },
    { id: 'CUS-1077', name: 'Kavya Iyer',            phone: '+91 98330 11267', city: 'Bengaluru',  bookings: 2, value: 680000,  since: '2025' },
    { id: 'CUS-1056', name: 'The Patel Family',     phone: '+91 90041 88822', city: 'Surat',      bookings: 6, value: 4250000, since: '2022' },
    { id: 'CUS-1042', name: 'Sneha Reddy',           phone: '+91 80850 90021', city: 'Hyderabad',  bookings: 1, value: 320000,  since: '2026' },
    { id: 'CUS-1039', name: 'Vikram Singh',          phone: '+91 70422 18370', city: 'Delhi',      bookings: 2, value: 940000,  since: '2024' },
    { id: 'CUS-1021', name: 'Anaya Gupta',           phone: '+91 99809 24400', city: 'Mumbai',     bookings: 1, value: 290000,  since: '2026' },
    { id: 'CUS-1014', name: 'Karthik Subramaniam',  phone: '+91 96770 50221', city: 'Chennai',    bookings: 4, value: 2110000, since: '2023' },
  ];

  // Generated bookings, mostly for next 60 days
  const today = new Date('2026-05-28');
  function fmtDay(d) { return d.toISOString().slice(0,10); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

  const fnTypes = ['Wedding Reception','Sangeet','Engagement','Corporate Gala','Birthday','Anniversary','Mehendi','Haldi','Conference','Product Launch'];
  const statuses = ['confirmed','confirmed','confirmed','pencil','pencil','quotation','enquiry','cancelled'];

  function rand(n) { return Math.floor(Math.random()*n); }
  let seed = 7;
  function srand() { seed = (seed*9301 + 49297) % 233280; return seed/233280; }
  function pick(arr) { return arr[Math.floor(srand()*arr.length)]; }

  const bookings = [];
  for (let i = 0; i < 64; i++) {
    const cust = pick(customers);
    const hall = pick(halls);
    const offset = Math.floor(srand()*60) - 8;
    const date = addDays(today, offset);
    const guests = 80 + Math.floor(srand()*600);
    const total = guests * (900 + Math.floor(srand()*1400));
    const advance = Math.floor(total * (0.2 + srand()*0.7));
    const status = pick(statuses);
    bookings.push({
      id: 'BK-' + (24300 + i),
      ref: 'BK-' + (24300 + i),
      customerId: cust.id,
      customer: cust.name,
      phone: cust.phone,
      function: pick(fnTypes),
      date: fmtDay(date),
      time: pick(['11:00','17:00','19:00','19:30','20:00']),
      hall: hall.name,
      hallId: hall.id,
      guests,
      total,
      advance,
      balance: total - advance,
      status,
      created: fmtDay(addDays(date, -(20 + Math.floor(srand()*40)))),
    });
  }
  bookings.sort((a,b)=> a.date.localeCompare(b.date));

  const enquiries = [];
  for (let i = 0; i < 18; i++) {
    enquiries.push({
      id: 'EN-' + (8810 + i),
      customer: pick(customers).name,
      phone: '+91 9' + (1000000000 + Math.floor(srand()*999999999)).toString().slice(0,9),
      function: pick(fnTypes),
      date: fmtDay(addDays(today, 5 + Math.floor(srand()*120))),
      guests: 100 + Math.floor(srand()*500),
      source: pick(['Website','Walk-in','Referral','WhatsApp','Just Dial']),
      assignee: pick(['Priya N.','Rahul S.','Ananya K.','Sameer V.']),
      age: pick(['2h','5h','1d','2d','4d','1w']),
      score: pick(['Hot','Warm','Cold']),
    });
  }

  const payments = [];
  bookings.filter(b => b.advance > 0).slice(0, 30).forEach((b,i) => {
    payments.push({
      id: 'PMT-' + (5500 + i),
      bookingId: b.id,
      customer: b.customer,
      method: pick(['UPI','NEFT','Cash','Card','Cheque']),
      amount: b.advance,
      date: b.created,
      type: 'Advance',
      status: 'Cleared'
    });
  });

  const insights = [
    { kind:'good', ttl:'Bookings ahead of last quarter', sub:'Q3 confirmed bookings up 18.4% vs Q2. Wedding season early.' },
    { kind:'warn', ttl:'4 pencil bookings expiring this week', sub:'₹14.2L of provisional revenue at risk. Send follow-ups.' },
    { kind:'info', ttl:'Crystal Hall has 11 open weekends', sub:'Lowest utilization in your portfolio for Jun–Aug.' },
    { kind:'bad',  ttl:'Outstanding balance over 30 days: ₹6.8L', sub:'3 customers, 4 bookings. Priority follow-up advised.' },
  ];

  return { halls, customers, bookings, enquiries, payments, insights, today, fmtDay, addDays };
})();
