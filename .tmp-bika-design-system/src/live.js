// Live activity feed generator
window.createActivityFeed = function(setActivity, isLive) {
  const templates = [
    { kind:'confirmed', who:'Priya N.',   action:'confirmed booking', target:'BK-24319',  detail:'Aarav & Diya Sharma · Grand Ballroom · ₹3.8L' },
    { kind:'payment',   who:'Rahul S.',   action:'recorded payment',  target:'₹85,000',   detail:'UPI · BK-24312 advance' },
    { kind:'enquiry',   who:'Ananya K.',  action:'logged enquiry',    target:'EN-8821',   detail:'Wedding · 380 pax · Jun 2026 · Hot' },
    { kind:'confirmed', who:'Sameer V.',  action:'updated status',    target:'BK-24307',  detail:'Pencil → Confirmed · Heritage Hall' },
    { kind:'payment',   who:'Priya N.',   action:'recorded payment',  target:'₹1.20L',    detail:'NEFT · BK-24301 balance partial' },
    { kind:'enquiry',   who:'Rahul S.',   action:'sent quotation',    target:'BK-24317',  detail:'Quotation v3 emailed to Mehta' },
    { kind:'cancel',    who:'System',     action:'cancelled booking', target:'BK-24289',  detail:'Customer request · refund initiated' },
    { kind:'confirmed', who:'Ananya K.',  action:'created booking',   target:'BK-24321',  detail:'Karthik Subramaniam · Sangeet · Emerald Suite' },
    { kind:'payment',   who:'Sameer V.',  action:'cleared advance',   target:'₹45,000',   detail:'Cash · BK-24315 token payment' },
    { kind:'enquiry',   who:'System',     action:'received walk-in',  target:'EN-8822',   detail:'Corporate event · 200 pax · Patel Family referral' },
  ];

  const timeLabels = ['just now', '1m ago', '2m ago', '3m ago', '5m ago', '8m ago', '12m ago', '18m ago', '24m ago', '31m ago', '45m ago', '1h ago'];
  let idx = 0;
  let counter = 1000;

  // Seed initial activity
  const initial = templates.map((t, i) => ({
    ...t, id: counter++, time: timeLabels[Math.min(i, timeLabels.length-1)], fresh: false
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
        const fresh = { ...t, id: counter++, time: 'just now', fresh: true };
        return [fresh, ...aged].slice(0, 18);
      }
      return aged.slice(0, 18);
    });
  }

  return tick;
};
