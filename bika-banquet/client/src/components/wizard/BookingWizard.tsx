'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { X } from 'lucide-react';

import {
  BanquetOption,
  CustomerOption,
  HallOption,
  INITIAL_WIZARD_DATA,
  ItemOption,
  PackKey,
  TemplateMenuOption,
  WIZARD_STEPS,
  WizardFormData,
  WizardStep,
  PACK_LABELS,
} from './types';
import Step1EventCustomer from './Step1EventCustomer';
import Step2VenuesTiming from './Step2VenuesTiming';
import Step3MenuPacks from './Step3MenuPacks';
import Step4PricingPayments from './Step4PricingPayments';
import Step5Review from './Step5Review';

// ── Types ──────────────────────────────────────────────────────────────────────

interface BookingWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingBookingId?: string | null;
  initialData?: Partial<WizardFormData> | null;
  customers: CustomerOption[];
  banquets: BanquetOption[];
  halls: HallOption[];
  items: ItemOption[];
  templateMenus: TemplateMenuOption[];
  canAddCustomer?: boolean;
  onAddCustomer?: () => void;
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ currentStep, totalSteps }: { currentStep: WizardStep; totalSteps: number }) {
  return (
    <div style={{ padding: '20px 24px 0' }}>
      {/* Step labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        {WIZARD_STEPS.map((step) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flex: 1,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  background: done
                    ? 'var(--teal-500)'
                    : active
                    ? 'var(--teal-600)'
                    : 'var(--surface-2)',
                  color: done || active ? 'white' : 'var(--text-4)',
                  border: active ? '2px solid var(--teal-300)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {done ? '✓' : step.id}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--teal-600)' : done ? 'var(--teal-500)' : 'var(--text-4)',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {step.shortLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress track */}
      <div
        style={{
          height: 4,
          borderRadius: 100,
          background: 'var(--surface-2)',
          marginBottom: 2,
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 100,
            background: 'var(--teal-500)',
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function BookingWizard({
  open,
  onClose,
  onSuccess,
  editingBookingId,
  initialData,
  customers,
  banquets,
  halls,
  items,
  templateMenus,
  canAddCustomer,
  onAddCustomer,
}: BookingWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [data, setData] = useState<WizardFormData>(INITIAL_WIZARD_DATA);
  const [saving, setSaving] = useState(false);
  const [clashWarnings, setClashWarnings] = useState<
    Array<{
      bookingId: string;
      functionName: string;
      functionType: string;
      startTime: string | null;
      endTime: string | null;
      functionTime: string | null;
      clashingHalls: Array<{ id: string; name: string }>;
    }>
  >([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Hydrate with initial data when editing
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setData(initialData ? { ...INITIAL_WIZARD_DATA, ...initialData } : INITIAL_WIZARD_DATA);
    setClashWarnings([]);
  }, [open, initialData]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Scroll to top on step change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Hall availability check
  const selectedHallIds = useMemo(() => {
    const ids = new Set<string>();
    (Object.keys(data.packs) as PackKey[]).forEach((k) => {
      const row = data.packs[k];
      if (row.enabled) row.hallIds.forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [data.packs]);

  const availabilityKey = `${data.functionDate}|${[...selectedHallIds].sort().join(',')}`;
  const availabilityKeyRef = useRef(availabilityKey);
  availabilityKeyRef.current = availabilityKey;

  useEffect(() => {
    if (!data.functionDate || selectedHallIds.length === 0) {
      setClashWarnings([]);
      return;
    }
    const t = window.setTimeout(async () => {
      if (availabilityKeyRef.current !== availabilityKey) return;
      try {
        const res = await api.checkBookingAvailability({
          hallIds: selectedHallIds.join(','),
          date: data.functionDate,
          ...(editingBookingId ? { excludeBookingId: editingBookingId } : {}),
        });
        const d = res.data?.data;
        setClashWarnings(d && !d.available ? (d.clashes || []) : []);
      } catch {
        setClashWarnings([]);
      }
    }, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityKey, editingBookingId]);

  // ── Bill calculation ────────────────────────────────────────────────────────

  const totalBillAmount = useMemo(() => {
    let total = 0;
    const seen = new Map<string, number>();

    (Object.keys(data.packs) as PackKey[]).forEach((key) => {
      const row = data.packs[key];
      if (!row.enabled) return;

      // Hall charges — de-dup by hallId, take max
      if (row.withHall) {
        row.hallIds.forEach((hallId) => {
          const charge = parseFloat(row.hallRate || '0') || 0;
          seen.set(hallId, Math.max(seen.get(hallId) || 0, charge));
        });
      }

      // Pack charges
      if (row.withCatering) {
        const pax = parseFloat(row.pax || '0') || 0;
        const rpp = parseFloat(row.ratePerPlate || '0') || 0;
        total += pax * rpp;
      }
    });

    seen.forEach((charge) => { total += charge; });

    // Additional items
    data.additionalRequirements.forEach((item) => {
      total += parseFloat(item.amount || '0') || 0;
    });

    return Math.max(0, total);
  }, [data.packs, data.additionalRequirements]);

  const totalPaid = useMemo(
    () => data.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
    [data.payments]
  );

  // ── Step navigation ──────────────────────────────────────────────────────────

  const validateStep = (s: WizardStep): string | null => {
    if (s === 1) {
      if (!data.functionType) return 'Select a function type';
      if (!data.functionDate) return 'Select a function date';
      if (!data.customerId) return 'Select a primary customer';
    }
    if (s === 2) {
      const enabled = (Object.keys(data.packs) as PackKey[]).filter((k) => data.packs[k].enabled);
      if (enabled.length === 0) return 'Enable at least one meal slot';
      for (const k of enabled) {
        const row = data.packs[k];
        if (row.withHall && !row.banquetId) return `Select a banquet for ${PACK_LABELS[k]}`;
        if (row.withHall && row.hallIds.length === 0) return `Select at least one hall for ${PACK_LABELS[k]}`;
        if (!row.pax || parseInt(row.pax) < 1) return `Enter pax for ${PACK_LABELS[k]}`;
      }
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step as WizardStep);
    if (err) { toast.error(err); return; }
    if (step < WIZARD_STEPS.length) setStep((s) => (s + 1) as WizardStep);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as WizardStep);
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const err = validateStep(1);
    if (err) { toast.error(err); return; }

    try {
      setSaving(true);

      const toNum = (v: string) => { const n = parseFloat(v); return isFinite(n) ? n : 0; };

      const enabledPacks = (Object.keys(data.packs) as PackKey[]).filter(
        (k) => data.packs[k].enabled
      );

      const hallChargeMap = new Map<string, number>();
      enabledPacks.forEach((k) => {
        const row = data.packs[k];
        if (!row.withHall) return;
        row.hallIds.forEach((hallId) => {
          const charge = toNum(row.hallRate || '0');
          hallChargeMap.set(hallId, Math.max(hallChargeMap.get(hallId) || 0, charge));
        });
      });

      const hallsPayload = Array.from(hallChargeMap.entries()).map(([hallId, charges]) => ({
        hallId,
        charges,
      }));

      const packsPayload = enabledPacks.map((k) => {
        const row = data.packs[k];
        const tmpl = templateMenus.find((t) => t.id === row.templateMenuId);
        const validHallIds = row.withHall ? row.hallIds : [];
        const hallNames = validHallIds
          .map((id) => halls.find((h) => h.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        return {
          packName: PACK_LABELS[k],
          packCount: Math.max(1, toNum(row.pax || '1')),
          noOfPack: Math.max(1, toNum(row.pax || '1')),
          ratePerPlate: row.withCatering ? toNum(row.ratePerPlate) : 0,
          startTime: row.startTime || undefined,
          endTime: row.endTime || undefined,
          hallRate: row.withHall ? row.hallRate || undefined : undefined,
          hallName: row.withHall ? hallNames || undefined : undefined,
          hallIds: validHallIds,
          menu: {
            name: tmpl?.name || `${PACK_LABELS[k]} Menu`,
            templateMenuId: row.templateMenuId || undefined,
            items: row.menuItemIds.map((itemId) => ({ itemId, quantity: 1 })),
          },
        };
      });

      const additionalItems = data.additionalRequirements
        .filter((r) => r.description || parseFloat(r.amount) > 0)
        .map((r) => ({
          description: r.description || 'Additional Requirement',
          charges: Math.max(0, toNum(r.amount || '0')),
          quantity: 1,
        }));

      const discountAmount = Math.min(totalBillAmount, Math.max(0, toNum(data.finalDiscountAmount || '0')));
      const discountPercent = Math.min(100, Math.max(0, toNum(data.finalDiscountPercent || '0')));
      const functionTime = enabledPacks[0] ? data.packs[enabledPacks[0]].startTime : '12:00';
      const expectedGuests = Math.max(
        1,
        ...enabledPacks.map((k) => toNum(data.packs[k].pax || '0')).filter((v) => v > 0)
      );

      const payload = {
        customerId: data.customerId,
        secondCustomerId: data.includeSecondCustomer && data.secondCustomerId
          ? data.secondCustomerId
          : undefined,
        referredById: data.referredById || undefined,
        priority: data.priority ? toNum(data.priority) : undefined,
        functionName: data.functionType,
        functionType: data.functionType,
        functionDate: data.functionDate,
        functionTime,
        startTime: enabledPacks[0] ? data.packs[enabledPacks[0]].startTime : undefined,
        endTime: enabledPacks[0] ? data.packs[enabledPacks[0]].endTime : undefined,
        expectedGuests,
        isQuotation: false,
        halls: hallsPayload.length ? hallsPayload : undefined,
        packs: packsPayload.length ? packsPayload : undefined,
        additionalItems: additionalItems.length ? additionalItems : undefined,
        discountAmount,
        discountPercentage: discountPercent,
        advanceRequired: data.advanceRequired || undefined,
        paymentReceivedAmount: totalPaid > 0 ? totalPaid.toFixed(2) : undefined,
        dueAmount: data.dueAmount || undefined,
        notes: data.notes || undefined,
      };

      if (editingBookingId) {
        await api.updateBooking(editingBookingId, payload);
        toast.success('Booking updated successfully');
      } else {
        await api.createBooking(payload);
        toast.success('Booking created successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
          (editingBookingId ? 'Failed to update booking' : 'Failed to create booking')
      );
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, editingBookingId, halls, templateMenus, totalBillAmount, totalPaid]);

  if (!open) return null;

  const stepLabel = WIZARD_STEPS.find((s) => s.id === step)?.label ?? '';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'max(env(safe-area-inset-top), 20px) 12px 20px',
        backdropFilter: 'blur(3px)',
        overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 780,
          background: 'var(--surface)',
          borderRadius: 20,
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - 40px)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>
              {editingBookingId ? 'Edit Booking' : 'New Booking'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-4)' }}>
              Step {step} of {WIZARD_STEPS.length} — {stepLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <ProgressBar currentStep={step} totalSteps={WIZARD_STEPS.length} />

        {/* Step body */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', padding: '24px 24px' }}
        >
          {step === 1 && (
            <Step1EventCustomer
              data={data}
              onChange={(patch) => setData((d) => ({ ...d, ...patch }))}
              customers={customers}
              canAddCustomer={Boolean(canAddCustomer)}
              onAddCustomer={onAddCustomer}
            />
          )}
          {step === 2 && (
            <Step2VenuesTiming
              data={data}
              onChange={(patch) => setData((d) => ({ ...d, ...patch }))}
              banquets={banquets}
              halls={halls}
              clashWarnings={clashWarnings}
            />
          )}
          {step === 3 && (
            <Step3MenuPacks
              data={data}
              onChange={(patch) => setData((d) => ({ ...d, ...patch }))}
              items={items}
              templateMenus={templateMenus}
            />
          )}
          {step === 4 && (
            <Step4PricingPayments
              data={data}
              onChange={(patch) => setData((d) => ({ ...d, ...patch }))}
              totalBillAmount={totalBillAmount}
            />
          )}
          {step === 5 && (
            <Step5Review
              data={data}
              customers={customers}
              halls={halls}
              templateMenus={templateMenus}
              totalBillAmount={totalBillAmount}
              totalPaid={totalPaid}
              isEditing={Boolean(editingBookingId)}
              saving={saving}
              onBack={goBack}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {/* Footer nav (hidden on step 5 which has its own submit) */}
        {step < 5 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
              background: 'var(--surface)',
            }}
          >
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className="btn btn-secondary"
              style={{ minWidth: 100, opacity: step === 1 ? 0.4 : 1 }}
            >
              ← Back
            </button>

            {/* Mini bill preview */}
            {totalBillAmount > 0 && (
              <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>
                Bill:{' '}
                <strong style={{ color: 'var(--teal-600)' }}>
                  ₹{totalBillAmount.toLocaleString('en-IN')}
                </strong>
              </span>
            )}

            <button
              type="button"
              onClick={goNext}
              className="btn btn-primary"
              style={{ minWidth: 100 }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <style>{`
        .wizard-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-3);
          margin-bottom: 5px;
        }
        .wizard-input {
          width: 100%;
          padding: 9px 12px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          outline: none;
          font-size: 14px;
          background: var(--surface);
          color: var(--text-1);
          box-sizing: border-box;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .wizard-input:focus {
          border-color: var(--teal-400);
        }
      `}</style>
    </div>
  );
}
