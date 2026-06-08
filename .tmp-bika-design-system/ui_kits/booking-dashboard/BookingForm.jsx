// BookingForm.jsx — Bika Banquet UI Kit (New Booking Modal)
// Exports: BookingForm to window

const { useState: useFormState } = React;

function BookingForm({ onClose, onSave }) {
  const [form, setForm] = useFormState({
    customerName: '', phone: '', email: '',
    functionName: '', functionType: 'Wedding',
    functionDate: '', functionTime: '18:00',
    expectedGuests: '', hall: 'Crystal Hall',
    grandTotal: '', advanceAmount: '',
    notes: '',
  });
  const [step, setStep] = useFormState(1);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5 };
  const inputStyle = { width: '100%', borderRadius: 12, padding: '8px 12px', fontSize: 13.5, fontFamily: 'inherit', border: '1px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s' };
  const inputFocusOn = e => { e.target.style.borderColor = '#14b8a6'; e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.18)'; };
  const inputFocusOff = e => { e.target.style.borderColor = 'var(--border-2)'; e.target.style.boxShadow = 'none'; };

  const STEPS = ['Customer', 'Event Details', 'Payment'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: '0 20px 40px rgba(15,23,42,0.18)', width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'modalIn 0.2s cubic-bezier(0.32,0.72,0,1)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>New Booking</h2>
            <p style={{ fontSize: 12, color: 'var(--text-4)', margin: '2px 0 0' }}>Step {step} of {STEPS.length} — {STEPS[step-1]}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 6, borderRadius: 8, display: 'flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', padding: '12px 24px', gap: 8, flexShrink: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ height: 3, borderRadius: 2, background: i + 1 <= step ? 'var(--teal-500)' : 'var(--surface-3)', transition: 'background 0.3s' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: i + 1 <= step ? 'var(--teal-600)' : 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '4px 24px 20px', overflowY: 'auto', flex: 1 }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input style={inputStyle} placeholder="Customer full name" value={form.customerName} onChange={e => set('customerName', e.target.value)} onFocus={inputFocusOn} onBlur={inputFocusOff} />
                </div>
                <div>
                  <label style={labelStyle}>Phone *</label>
                  <input style={inputStyle} placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} onFocus={inputFocusOn} onBlur={inputFocusOff} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input style={inputStyle} type="email" placeholder="customer@email.com" value={form.email} onChange={e => set('email', e.target.value)} onFocus={inputFocusOn} onBlur={inputFocusOff} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Function Name *</label>
                <input style={inputStyle} placeholder="e.g. Sharma Wedding Reception" value={form.functionName} onChange={e => set('functionName', e.target.value)} onFocus={inputFocusOn} onBlur={inputFocusOff} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Function Type</label>
                  <select style={{ ...inputStyle, appearance: 'none' }} value={form.functionType} onChange={e => set('functionType', e.target.value)} onFocus={inputFocusOn} onBlur={inputFocusOff}>
                    {['Wedding','Reception','Birthday','Corporate','Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Hall</label>
                  <select style={{ ...inputStyle, appearance: 'none' }} value={form.hall} onChange={e => set('hall', e.target.value)} onFocus={inputFocusOn} onBlur={inputFocusOff}>
                    {['Crystal Hall','Grand Banquet','Emerald Room','Rose Garden','Sapphire Suite'].map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Function Date *</label>
                  <input style={inputStyle} type="date" value={form.functionDate} onChange={e => set('functionDate', e.target.value)} onFocus={inputFocusOn} onBlur={inputFocusOff} />
                </div>
                <div>
                  <label style={labelStyle}>Expected Guests</label>
                  <input style={inputStyle} type="number" placeholder="500" value={form.expectedGuests} onChange={e => set('expectedGuests', e.target.value)} onFocus={inputFocusOn} onBlur={inputFocusOff} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Grand Total (₹)</label>
                  <input style={inputStyle} type="number" placeholder="350000" value={form.grandTotal} onChange={e => set('grandTotal', e.target.value)} onFocus={inputFocusOn} onBlur={inputFocusOff} />
                </div>
                <div>
                  <label style={labelStyle}>Advance Amount (₹)</label>
                  <input style={inputStyle} type="number" placeholder="100000" value={form.advanceAmount} onChange={e => set('advanceAmount', e.target.value)} onFocus={inputFocusOn} onBlur={inputFocusOff} />
                </div>
              </div>
              {form.grandTotal && form.advanceAmount && (
                <div style={{ background: 'var(--teal-50)', border: '1px solid var(--teal-100)', borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>Balance Due</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal-700)', fontVariantNumeric: 'tabular-nums' }}>₹{(Number(form.grandTotal) - Number(form.advanceAmount)).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div>
                <label style={labelStyle}>Special Notes</label>
                <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} placeholder="Any special requirements, dietary notes, or arrangements…" value={form.notes} onChange={e => set('notes', e.target.value)} onFocus={inputFocusOn} onBlur={inputFocusOff} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexShrink: 0, gap: 10 }}>
          <button onClick={step === 1 ? onClose : () => setStep(s => s-1)}
            style={{ padding: '8px 18px', borderRadius: 12, border: '1px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <button onClick={step < STEPS.length ? () => setStep(s => s+1) : () => { onSave && onSave(form); onClose(); }}
            style={{ padding: '8px 22px', borderRadius: 12, border: 'none', background: 'var(--teal-600)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 3px rgba(13,148,136,0.25)' }}>
            {step < STEPS.length ? 'Continue →' : 'Create Booking'}
          </button>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.97) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

Object.assign(window, { BookingForm });
