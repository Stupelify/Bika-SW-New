// scr-crm.jsx — Enquiries kanban + Customers master-detail
const { useState:crS, useMemo:crM } = React;

// ── ENQUIRIES (kanban pipeline) ─────────────────────────────────
function Enquiries({ openCustomer }){
  const isMobile = useMedia();
  const stageColor={Lead:'var(--t4)',Quotation:'var(--blue)',Pencil:'var(--amber)',Won:'var(--green)',Lost:'var(--red)'};
  const active=ENQUIRIES.filter(e=>['Lead','Quotation','Pencil'].includes(e.stage));
  const pipeline=active.reduce((s,e)=>s+e.est,0);
  const wonVal=ENQUIRIES.filter(e=>e.stage==='Won').reduce((s,e)=>s+e.est,0);

  return (
    <div className="route" style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <Toolbar title={isMobile?null:'Enquiries'}
        stats={isMobile?null:[
          { label:'Active leads', value:active.length },
          { label:'Pipeline value', value:inr(pipeline), color:'var(--ac)' },
          { label:'Won', value:inr(wonVal), color:'var(--green)' },
        ]}
        actions={<button className="btn primary" onClick={()=>toast('New enquiry',{icon:'check'})}><Icon n="plus" s={15}/>{isMobile?'':'New enquiry'}</button>}/>
      <div style={{flex:1,overflow:'auto',padding:16}}>
        <div style={{display:'flex',gap:12,height:'100%',minWidth:isMobile?'auto':900,flexDirection:isMobile?'column':'row'}}>
          {ENQUIRY_STAGES.map(stage=>{
            const items=ENQUIRIES.filter(e=>e.stage===stage);
            const total=items.reduce((s,e)=>s+e.est,0);
            return (
              <div key={stage} style={{flex:isMobile?'none':1,minWidth:isMobile?'auto':220,display:'flex',flexDirection:'column'}}>
                <div style={{display:'flex',alignItems:'center',gap:7,padding:'0 4px 8px'}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:stageColor[stage]}}/>
                  <span style={{fontSize:12,fontWeight:600}}>{stage}</span>
                  <span style={{fontSize:10,fontFamily:'var(--fm)',color:'var(--t3)',background:'var(--sf2)',borderRadius:3,padding:'0 5px'}}>{items.length}</span>
                  <span style={{marginLeft:'auto',fontSize:10.5,fontFamily:'var(--fm)',color:'var(--t3)'}}>{inr(total)}</span>
                </div>
                <div className="stagger" style={{flex:1,display:'flex',flexDirection:'column',gap:8,background:'var(--sf2)',borderRadius:'var(--r)',padding:8,minHeight:isMobile?'auto':100}}>
                  {items.map(e=>{ const c=customerById(e.customerId);
                    return (
                      <div key={e.id} onClick={()=>openCustomer(e.customerId)} className="card lift" style={{padding:11,cursor:'pointer',boxShadow:'none'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:6,marginBottom:5}}>
                          <span style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',minWidth:0,flex:1}}>{c.name}</span>
                          {c.priority==='VIP'&&<Badge s="vip" sm/>}
                        </div>
                        <div style={{fontSize:11.5,color:'var(--t2)',marginBottom:3}}>{e.functionType}</div>
                        <div style={{fontSize:10.5,color:'var(--t3)',fontFamily:'var(--fm)',display:'flex',gap:8,flexWrap:'wrap'}}>
                          <span>{fmtDate(e.date)}</span><span>{e.guests} pax</span><span>{hallById(e.hallIds[0]).name}</span>
                        </div>
                        <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid var(--bd)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{fontSize:13,fontFamily:'var(--fm)',fontWeight:700}}>{inr(e.est)}</span>
                          <span style={{fontSize:9.5,fontFamily:'var(--fm)',color:'var(--t4)'}}>{e.id}</span>
                        </div>
                      </div>
                    );})}
                  {!items.length && <div style={{fontSize:11,color:'var(--t4)',textAlign:'center',padding:12}}>No enquiries</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── CUSTOMERS (master-detail / CRM) ─────────────────────────────
function Customers({ openId, setOpenId, openBooking }){
  const isMobile=useMedia();
  const [q,setQ]=crS('');
  const list=crM(()=>{ const t=q.toLowerCase().trim(); return CUSTOMERS.filter(c=>!t||c.name.toLowerCase().includes(t)||c.phone.includes(t)||(c.city||'').toLowerCase().includes(t)); },[q]);
  const selected = openId ? CUSTOMERS.find(c=>c.id===openId) : (isMobile?null:list[0]);

  const ListHeader=(
    <div style={{padding:12,borderBottom:'1px solid var(--bd)',background:'var(--sf)'}}>
      <div style={{position:'relative'}}>
        <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',display:'flex'}}><Icon n="search" s={15} c="var(--t4)"/></span>
        <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search customers…" style={{paddingLeft:32}}/>
      </div>
    </div>
  );
  const ListItems=(
    <div style={{flex:1,overflowY:'auto'}}>
      {list.map(c=>(
        <div key={c.id} onClick={()=>setOpenId(c.id)} style={{padding:'11px 14px',borderBottom:'1px solid var(--bd)',cursor:'pointer',display:'flex',alignItems:'center',gap:11,background:(selected&&selected.id===c.id&&!isMobile)?'var(--ac-soft)':'transparent',borderLeft:`2px solid ${(selected&&selected.id===c.id&&!isMobile)?'var(--ac)':'transparent'}`}}>
          <div style={{width:34,height:34,borderRadius:'50%',background:'var(--sf3)',display:'grid',placeItems:'center',fontSize:12,fontWeight:600,fontFamily:'var(--fm)',color:'var(--t2)',flexShrink:0}}>{c.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name}</span>{c.priority==='VIP'&&<Badge s="vip" sm/>}</div>
            <div style={{fontSize:11,color:'var(--t3)',fontFamily:'var(--fm)'}}>{c.phone}</div>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:11,fontFamily:'var(--fm)',color:'var(--t3)'}}>{c.visits} visits</div><Stars n={c.rating}/></div>
        </div>
      ))}
    </div>
  );

  if(isMobile){
    if(selected&&openId) return <CustomerDetail c={selected} onBack={()=>setOpenId(null)} openBooking={openBooking} isMobile/>;
    return <div className="route" style={{height:'100%',display:'flex',flexDirection:'column'}}>{ListHeader}{ListItems}</div>;
  }
  return (
    <div className="route" style={{height:'100%',display:'flex',overflow:'hidden'}}>
      <div style={{width:320,flexShrink:0,borderRight:'1px solid var(--bd)',background:'var(--sf)',display:'flex',flexDirection:'column'}}>{ListHeader}{ListItems}</div>
      <div style={{flex:1,minWidth:0}}>{selected?<CustomerDetail c={selected} key={selected.id} openBooking={openBooking}/>:<div style={{height:'100%',display:'grid',placeItems:'center',color:'var(--t3)'}}>Select a customer</div>}</div>
    </div>
  );
}

function Stars({n}){ return <span style={{display:'inline-flex',gap:1}}>{[1,2,3,4,5].map(i=><Icon key={i} n="star" s={10} c={i<=n?'var(--amber)':'var(--bd2)'} sw={i<=n?0:1.5}/>)}</span>; }

function CustomerDetail({c,onBack,openBooking,isMobile}){
  const bookings=BOOKINGS.filter(b=>b.customerId===c.id);
  const lifetime=bookings.reduce((s,b)=>s+bookingTotal(b).grand,0);
  return (
    <div style={{height:'100%',overflowY:'auto',background:'var(--bg)'}}>
      <div style={{padding:isMobile?'12px 16px':'18px 24px',borderBottom:'1px solid var(--bd)',background:'var(--sf)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {isMobile && <button className="btn icon sm ghost" onClick={onBack} style={{marginLeft:-6}}><Icon n="back" s={18}/></button>}
          <div style={{width:48,height:48,borderRadius:'50%',background:'var(--ac)',display:'grid',placeItems:'center',color:'#fff',fontSize:17,fontWeight:600,fontFamily:'var(--fm)',flexShrink:0}}>{c.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}><h1 style={{fontSize:isMobile?18:21,fontWeight:700}}>{c.name}</h1>{c.priority==='VIP'&&<Badge s="vip"/>}{c.priority==='High'&&<Badge s="high"/>}</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginTop:3}}><Stars n={c.rating}/><span style={{fontSize:11.5,color:'var(--t3)'}}>{c.visits} visits · {c.occupation}</span></div>
          </div>
          <div style={{display:'flex',gap:6}} className="only-desktop">
            <button className="btn sm"><Icon n="phone" s={14}/>Call</button>
            <button className="btn sm"><Icon n="mail" s={14}/>Email</button>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,auto)',gap:isMobile?10:28,marginTop:14}}>
          {[['Lifetime value',inr(lifetime)],['Bookings',bookings.length],['Avg. rating',c.rating+'/5'],['Member since','2022']].map(([k,v])=>(
            <div key={k}><div className="eyebrow">{k}</div><div style={{fontSize:17,fontWeight:700,fontFamily:'var(--fm)',marginTop:2}}>{v}</div></div>
          ))}
        </div>
      </div>
      <div style={{padding:isMobile?16:24,display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:20}}>
        <Section title="Contact">
          <Field k="Phone" v={c.phone}/><Field k="Alt phone" v={c.altPhone}/><Field k="Email" v={c.email}/><Field k="City" v={c.city}/>
        </Section>
        <Section title="Profile">
          <Field k="Community" v={c.community}/><Field k="DOB" v={c.dob}/><Field k="Anniversary" v={c.anniversary}/><Field k="Company" v={c.company}/>
        </Section>
        <Section title="Tax">
          <Field k="GST" v={c.gst}/><Field k="PAN" v={c.pan}/>
        </Section>
        <Section title="Referrals">
          <Field k="Referred by" v={c.referredBy?customerById(c.referredBy).name:'Direct'}/>
          <Field k="Referred" v={c.referrals.length?c.referrals.map(r=>customerById(r).name).join(', '):'None'}/>
        </Section>
      </div>
      {c.notes && <div style={{padding:isMobile?'0 16px 16px':'0 24px 20px'}}><Section title="Notes"><p style={{fontSize:12.5,color:'var(--t2)',lineHeight:1.6,background:'var(--sf)',border:'1px solid var(--bd)',borderRadius:'var(--r-sm)',padding:12}}>{c.notes}</p></Section></div>}
      <div style={{padding:isMobile?'0 16px 24px':'0 24px 24px'}}>
        <div className="eyebrow" style={{marginBottom:10}}>Booking history</div>
        <div className="card" style={{overflow:'hidden'}}>
          {bookings.length?(
            <table className="tbl"><thead><tr><th>ID</th><th>Function</th><th>Date</th><th style={{textAlign:'right'}}>Total</th><th>Status</th></tr></thead>
              <tbody>{bookings.map(b=>{ const t=bookingTotal(b);
                return <tr key={b.id} onClick={()=>openBooking(b.id)}><td className="mono">{b.id}</td><td style={{color:'var(--t1)'}}>{b.functionName}</td><td className="mono">{fmtDate(b.start)}</td><td className="num" style={{fontWeight:600}}>{inr(t.grand)}</td><td><Badge s={b.status} sm/></td></tr>;
              })}</tbody>
            </table>
          ):<div style={{padding:24,textAlign:'center',color:'var(--t4)',fontSize:13}}>No bookings yet.</div>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window,{ Enquiries, Customers });
