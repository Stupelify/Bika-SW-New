'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  History,
  Lock,
  PencilLine,
  Plus,
  Printer,
  Save,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import FormPromptModal from '@/components/FormPromptModal';
import { formatDateDDMMYYYY } from '@/lib/date';
import { handleEnterAsTabKeyDown } from '@/lib/focusNextField';
import type { PackKey } from '@/lib/booking-form/constants';
import type { MenuItemLike } from '@/lib/booking-form/types';
import BookingPaymentsLedger from '@/components/BookingPaymentsLedger';
import BookingFinancialSummary from '@/components/BookingFinancialSummary';
import FinalizedVersionHistory from '@/components/booking/FinalizedVersionHistory';
import BookingPartyOverForm from '@/components/BookingPartyOverForm';
import { AutoResizeTextarea } from '@/components/AutoResizeTextarea';
import BookingTermsSection from '@/components/booking/BookingTermsSection';
import BookingMenuEditorModal from '@/components/booking/BookingMenuEditorModal';
import BookingPackTable from '@/components/booking/BookingPackTable';
import BookingPackMobileCards from '@/components/booking/BookingPackMobileCards';
import QuickCustomerModal from './QuickCustomerModal';
import MenuPdfModal from './MenuPdfModal';
import {
  FUNCTION_TYPE_OPTIONS,
  LONGEST_FUNCTION_TYPE_OPTION,
  PACK_LABELS,
  PRIMARY_CUSTOMER_FIELD_CH,
  computePencilExpiry,
  formatCustomerLabel,
  type Booking,
  type CustomerSearchField,
} from '../_lib/types';
import type { useBookingForm } from '../_hooks/useBookingForm';

export type BookingFormModalProps = ReturnType<typeof useBookingForm>;

export default function BookingFormModal(props: BookingFormModalProps) {
  const {
    canAddCustomer,
    canExportMenuPdf,
    showCreateForm,
    editingBookingId,
    closeBookingForm,
    isFormDirty,
    activeBookingTab,
    setActiveBookingTab,
    formData,
    draftOffer,
    resumeDraft,
    discardDraft,
    externalUpdateNotice,
    setExternalUpdateNotice,
    openEditBooking,
    isReadOnlyBooking,
    formRef,
    handleSubmitBooking,
    saving,
    setSaving,
    setMenuPdfBooking,
    bookingsForMenuPdf,
    activeBookingObj,
    availabilityChip,
    openQuickCustomerForm,
    renderCustomerTypeahead,
    setFormData,
    todayIsoDate,
    hallClashWarnings,
    halls,
    banquets,
    formDiff,
    openHallPickerPack,
    setOpenHallPickerPack,
    hallPickerContainerRef,
    hallPickerPortalRef,
    hallPickerAnchorRect,
    setHallPickerAnchorRect,
    updatePackRow,
    requestCateringToggle,
    requestHallToggle,
    setMenuEditorPack,
    setMenuItemSearch,
    formatComputedAmount,
    packRowAmount,
    billingTotals,
    mealsBillBase,
    payableGrandTotal,
    setAmountSyncMode,
    setDiscountManuallySet,
    normalizeAmountSnapshot,
    netAmountDraft,
    setNetAmountDraft,
    setIsFormDirty,
    handleFinalizeBooking,
    enabledPackAmountRows,
    totalBillBase,
    totalBillAmount,
    notifyDataChanged,
    showAddCustomerForm,
    setShowAddCustomerForm,
    customerReferrerOptions,
    handleQuickCustomerCreated,
    menuEditorPack,
    activeMenuPackRow,
    templateMenus,
    menuItemSearch,
    groupedMenuItems,
    selectedMenuItemsByGroup,
    importTemplateToPack,
    togglePackMenuItem,
    itemTypes,
    setQuickItemForm,
    setShowQuickAddItem,
    menuPdfBooking,
    showFinalizeReview,
    setShowFinalizeReview,
    customers,
    customerSearchInputs,
    confirmFinalizeBooking,
    saveConflict,
    setSaveConflict,
    doSaveBooking,
    showQuickAddItem,
    quickItemForm,
    submitQuickAddItem,
    savingQuickItem,
    historicalVersions,
    items,
  } = props as BookingFormModalProps & { bookingsForMenuPdf?: Booking[]; notifyDataChanged?: () => Promise<void> };

  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <>
      <FormPromptModal
        open={showCreateForm}
        title={editingBookingId ? 'Edit Booking' : 'Booking Form'}
        onClose={closeBookingForm}
        widthClass="max-w-[1400px]"
        isDirty={isFormDirty}
        headerContent={
          <div
            className="flex min-w-0 flex-1 items-end gap-1"
            role="tablist"
            aria-label="Booking form sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeBookingTab === 'details'}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeBookingTab === 'details'
                  ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                  : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
              onClick={() => setActiveBookingTab('details')}
            >
              Booking Form
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeBookingTab === 'payments'}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeBookingTab === 'payments'
                  ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                  : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
              }`}
              onClick={() => setActiveBookingTab('payments')}
            >
              Payments &amp; Party Over
              {formData.payments.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary-100 dark:bg-primary-900/40 text-[10px] font-bold text-primary-700 dark:text-primary-300">
                  {formData.payments.length}
                </span>
              )}
            </button>
          </div>
        }
      >
        {draftOffer && (
          <div className="fade-in-soft mb-4 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-500/10 px-3 py-2.5 flex flex-wrap items-center gap-2 text-sm text-sky-900 dark:text-sky-200">
            <History className="w-4 h-4 shrink-0" aria-hidden />
            <span className="min-w-0">
              Unsaved draft from{' '}
              {new Date(draftOffer.savedAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              found.
              {draftOffer.stale &&
                ' Note: this booking has changed on the server since the draft was made.'}
            </span>
            <span className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary text-xs px-2.5 py-1.5"
                onClick={resumeDraft}
              >
                Resume draft
              </button>
              <button
                type="button"
                className="btn btn-secondary text-xs px-2.5 py-1.5"
                onClick={discardDraft}
              >
                Discard
              </button>
            </span>
          </div>
        )}

        {externalUpdateNotice && editingBookingId && (
          <div
            role="status"
            className="fade-in-soft mb-4 rounded-xl border border-amber-300 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200"
          >
            {!externalUpdateNotice.confirmingReload ? (
              <div className="flex flex-wrap items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  This booking was updated outside this form at{' '}
                  {new Date(externalUpdateNotice.at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  . Totals and payments shown may be out of date.
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary text-xs px-2.5 py-1.5"
                    onClick={() =>
                      setExternalUpdateNotice({ ...externalUpdateNotice, confirmingReload: true })
                    }
                  >
                    Reload latest
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary text-xs px-2.5 py-1.5"
                    onClick={() => setExternalUpdateNotice(null)}
                  >
                    Keep editing
                  </button>
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  Reloading replaces your unsaved edits with the latest saved version.
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-danger text-xs px-2.5 py-1.5"
                    onClick={() => {
                      setExternalUpdateNotice(null);
                      void openEditBooking(editingBookingId);
                    }}
                  >
                    Reload &amp; discard my edits
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary text-xs px-2.5 py-1.5"
                    onClick={() =>
                      setExternalUpdateNotice({ ...externalUpdateNotice, confirmingReload: false })
                    }
                  >
                    Back
                  </button>
                </span>
              </div>
            )}
          </div>
        )}

        <fieldset disabled={isReadOnlyBooking}>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            if (!isReadOnlyBooking) handleSubmitBooking(e);
          }}
          onChange={() => setIsFormDirty(true)}
          onKeyDown={(e) => {
            if (
              (e.target as HTMLElement).getAttribute('aria-expanded') === 'true'
            ) {
              return;
            }
            handleEnterAsTabKeyDown(e, formRef.current);
          }}
          className="space-y-5"
        >
            {!isReadOnlyBooking && availabilityChip && (
              <div className="flex justify-end">{availabilityChip}</div>
            )}

            {isReadOnlyBooking && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                This booking is completed (party over) and is now read-only.
              </div>
            )}

            {activeBookingTab === 'details' && (<>
            <section className="rounded-2xl border border-[var(--border-2)] p-4">
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-[var(--text-1)]">Booking Details</h3>
                {/* Row 1 mobile */}
                <div className="space-y-3 md:hidden">
                  {canAddCustomer && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn btn-secondary text-xs px-2.5 py-1.5"
                        onClick={openQuickCustomerForm}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Customer
                      </button>
                    </div>
                  )}
                  <div className="space-y-1.5 min-w-0">
                    <span className="label block">
                      Primary Customer <span className="text-red-500">*</span>
                    </span>
                    {renderCustomerTypeahead({
                      field: 'primary',
                      label: '',
                      required: true,
                      placeholder: 'Type customer name or number',
                    })}
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <input
                      className="input bg-[var(--surface-2)] dark:bg-slate-800/30 cursor-not-allowed"
                      type="number"
                      readOnly
                      value={formData.priority}
                      title="Priority is set from the selected customer's profile"
                    />
                    <p className="mt-1 text-xs text-[var(--text-4)]">
                      Auto-set from customer profile
                    </p>
                  </div>
                  <div>
                    <label className="label">
                      Function Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input"
                      type="date"
                      value={formData.functionDate}
                      min={!editingBookingId ? todayIsoDate : undefined}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, functionDate: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                {/* Row 1 desktop: primary | add customer | priority | date */}
                <div className="hidden md:flex md:flex-wrap md:items-end md:gap-3">
                  <div
                    className="min-w-0 shrink-0 space-y-1.5"
                    style={{ width: `calc(${PRIMARY_CUSTOMER_FIELD_CH}ch + 2.5rem)` }}
                  >
                    <span className="label block">
                      Primary Customer <span className="text-red-500">*</span>
                    </span>
                    {renderCustomerTypeahead({
                      field: 'primary',
                      label: '',
                      required: true,
                      placeholder: 'Type customer name or number',
                      inputClassName: 'truncate',
                    })}
                  </div>
                  {canAddCustomer && (
                    <button
                      type="button"
                      className="btn btn-secondary shrink-0 text-xs px-2.5 py-1.5"
                      onClick={openQuickCustomerForm}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Customer
                    </button>
                  )}
                  <div className="w-[4.5rem] shrink-0 space-y-1.5">
                    <label className="label block">Priority</label>
                    <input
                      className="input bg-[var(--surface-2)] dark:bg-slate-800/30 cursor-not-allowed"
                      type="number"
                      readOnly
                      value={formData.priority}
                      title="Priority is set from the selected customer's profile"
                    />
                  </div>
                  <div className="w-[11.5rem] shrink-0 space-y-1.5">
                    <label className="label block">
                      Function Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input"
                      type="date"
                      value={formData.functionDate}
                      min={!editingBookingId ? todayIsoDate : undefined}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, functionDate: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                {/* Row 2 mobile */}
                <div className="space-y-3 md:hidden">
                  <div>
                    <label className="label">
                      Function Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input"
                      value={formData.functionType}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, functionType: e.target.value }))
                      }
                      required
                    >
                      <option value="">Select function type</option>
                      {FUNCTION_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  {renderCustomerTypeahead({
                    field: 'referred',
                    label: 'Referred By',
                    placeholder: 'Type customer name or number',
                  })}
                  {renderCustomerTypeahead({
                    field: 'second',
                    label: 'Second Customer',
                    placeholder: 'Type customer name or number',
                  })}
                </div>

                {/* Row 2 desktop: function type (fit longest option) | referred | second */}
                <div className="hidden md:flex md:items-end md:gap-3">
                  <div
                    className="shrink-0 space-y-1.5"
                    style={{ width: `${LONGEST_FUNCTION_TYPE_OPTION.length + 3}ch` }}
                  >
                    <label className="label block">
                      Function Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input w-full max-w-full"
                      value={formData.functionType}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, functionType: e.target.value }))
                      }
                      required
                    >
                      <option value="">Select function type</option>
                      {FUNCTION_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-0 flex-1">
                    {renderCustomerTypeahead({
                      field: 'referred',
                      label: 'Referred By',
                      placeholder: 'Type customer name or number',
                    })}
                  </div>
                  <div className="min-w-0 flex-1">
                    {renderCustomerTypeahead({
                      field: 'second',
                      label: 'Second Customer',
                      placeholder: 'Type customer name or number',
                    })}
                  </div>
                </div>

                {/* Pencil booking toggle */}
                {!isReadOnlyBooking && (
                  <div className="rounded-xl border border-[var(--border-2)] bg-[var(--surface-2)] dark:bg-slate-800/30 p-3 space-y-3">
                    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded accent-[var(--brand)]"
                        checked={formData.isPencilBooking}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => ({
                            ...prev,
                            isPencilBooking: checked,
                            pencilDays: checked ? prev.pencilDays || '3' : '3',
                            pencilExpiresAt: checked
                              ? computePencilExpiry(Number(prev.pencilDays || '3'))
                              : '',
                          }));
                        }}
                      />
                      <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-1)]">
                        <PencilLine className="w-4 h-4 text-[var(--text-3)]" />
                        Pencil Booking
                      </span>
                      <span className="text-xs text-[var(--text-4)]">— temporary hall hold</span>
                    </label>
                    {formData.isPencilBooking && (
                      <div className="space-y-2 pl-6">
                        <div className="flex items-end gap-3">
                          <div className="space-y-1">
                            <label className="label text-xs">Hold duration (days) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              className="input w-24"
                              min="1"
                              max="365"
                              value={formData.pencilDays}
                              onChange={(e) => {
                                const days = Math.max(1, Number(e.target.value) || 1);
                                setFormData((prev) => ({
                                  ...prev,
                                  pencilDays: String(days),
                                  pencilExpiresAt: computePencilExpiry(days),
                                }));
                              }}
                            />
                          </div>
                          <div className="space-y-1 flex-1">
                            <label className="label text-xs">Or pick date directly</label>
                            <input
                              type="date"
                              className="input"
                              value={formData.pencilExpiresAt}
                              min={todayIsoDate}
                              onChange={(e) => {
                                const dateVal = e.target.value;
                                const diffMs = new Date(dateVal).getTime() - new Date(todayIsoDate).getTime();
                                const diffDays = Math.max(1, Math.round(diffMs / 86400000));
                                setFormData((prev) => ({
                                  ...prev,
                                  pencilExpiresAt: dateVal,
                                  pencilDays: String(diffDays),
                                }));
                              }}
                              required={formData.isPencilBooking}
                            />
                          </div>
                        </div>
                        {formData.pencilExpiresAt && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <PencilLine className="w-3 h-3" />
                            Hall auto-releases at 11:59 PM on {new Date(formData.pencilExpiresAt + 'T23:59:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {formData.isPencilBooking && isReadOnlyBooking && formData.pencilExpiresAt && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <PencilLine className="w-4 h-4 shrink-0" />
                    Pencil hold — auto-releases on {new Date(formData.pencilExpiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}

                {/* Availability check status — visible for every state so a
                    failed check can never be mistaken for "hall is free" */}
                {availabilityChip && !isReadOnlyBooking && (
                  <div className="mt-1">{availabilityChip}</div>
                )}

                {/* Hall clash warning banner */}
                {hallClashWarnings.length > 0 && (
                  <div className="col-span-full mt-1 rounded-lg border border-amber-300 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-500/10 p-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-amber-600 shrink-0" aria-hidden>⚠️</span>
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                          Hall timing clash detected on this date
                        </p>
                        <ul className="mt-1 space-y-0.5 text-xs text-amber-700 dark:text-amber-200">
                          {hallClashWarnings.map((clash) => (
                            <li key={clash.bookingId}>
                              <span className="font-medium">{clash.functionName}</span>
                              {clash.functionType ? ` (${clash.functionType})` : ''}
                              {(clash.startTime && clash.endTime)
                                ? ` · ${clash.startTime}–${clash.endTime}`
                                : clash.functionTime ? ` · ${clash.functionTime}` : ''}
                              {' — '}
                              {clash.clashingHalls.map((h) => h.name).join(', ')}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1 text-xs text-amber-600">
                          Saving will be blocked if the halls and times overlap.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── Pack & Summary Table (desktop) ── */}
            <section className="space-y-3">
              {/* ── Desktop/tablet table (lg+) — scrolls horizontally rather
                    than dropping columns on narrower screens ── */}
              <BookingPackTable
                formData={formData}
                setFormData={setFormData}
                formDiff={formDiff}
                halls={halls}
                banquets={banquets}
                openHallPickerPack={openHallPickerPack}
                setOpenHallPickerPack={setOpenHallPickerPack}
                hallPickerContainerRef={hallPickerContainerRef}
                hallPickerPortalRef={hallPickerPortalRef}
                hallPickerAnchorRect={hallPickerAnchorRect}
                setHallPickerAnchorRect={setHallPickerAnchorRect}
                updatePackRow={updatePackRow}
                requestCateringToggle={requestCateringToggle}
                requestHallToggle={requestHallToggle}
                setMenuEditorPack={setMenuEditorPack}
                setMenuItemSearch={setMenuItemSearch}
                formatComputedAmount={formatComputedAmount}
                packRowAmount={packRowAmount}
                billingTotals={billingTotals}
                mealsBillBase={mealsBillBase}
                payableGrandTotal={payableGrandTotal}
                setAmountSyncMode={setAmountSyncMode}
                setDiscountManuallySet={setDiscountManuallySet}
                normalizeAmountSnapshot={normalizeAmountSnapshot}
                netAmountDraft={netAmountDraft}
                setNetAmountDraft={setNetAmountDraft}
                isReadOnlyBooking={isReadOnlyBooking}
                setIsFormDirty={setIsFormDirty}
                saving={saving}
                handleFinalizeBooking={handleFinalizeBooking}
              />

              {/* ── Mobile cards (below lg) ── */}
              <BookingPackMobileCards
                formData={formData}
                setFormData={setFormData}
                formDiff={formDiff}
                halls={halls}
                banquets={banquets}
                openHallPickerPack={openHallPickerPack}
                setOpenHallPickerPack={setOpenHallPickerPack}
                hallPickerContainerRef={hallPickerContainerRef}
                updatePackRow={updatePackRow}
                requestCateringToggle={requestCateringToggle}
                requestHallToggle={requestHallToggle}
                setMenuEditorPack={setMenuEditorPack}
                setMenuItemSearch={setMenuItemSearch}
                formatComputedAmount={formatComputedAmount}
                packRowAmount={packRowAmount}
                enabledPackAmountRows={enabledPackAmountRows}
                billingTotals={billingTotals}
                mealsBillBase={mealsBillBase}
                payableGrandTotal={payableGrandTotal}
                setAmountSyncMode={setAmountSyncMode}
                setDiscountManuallySet={setDiscountManuallySet}
                normalizeAmountSnapshot={normalizeAmountSnapshot}
                isReadOnlyBooking={isReadOnlyBooking}
                setIsFormDirty={setIsFormDirty}
              />
            </section>

            <div>
              <label className="label">Notes</label>
              <AutoResizeTextarea
                className="input"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            </>)}

            {activeBookingTab === 'payments' && (
              <div className="space-y-6 max-w-full overflow-x-hidden">
                <BookingPaymentsLedger
                  payments={formData.payments}
                  isReadOnly={isReadOnlyBooking}
                  onAdd={(payment) =>
                    setFormData((prev) => ({ ...prev, payments: [...prev.payments, payment] }))
                  }
                  onUpdate={(index, patch) =>
                    setFormData((prev) => ({
                      ...prev,
                      payments: prev.payments.map((p, i) => (i === index ? { ...p, ...patch } : p)),
                    }))
                  }
                  onRemove={(index) =>
                    setFormData((prev) => ({
                      ...prev,
                      payments: prev.payments.filter((_, i) => i !== index),
                    }))
                  }
                />

                <BookingFinancialSummary
                  preDiscountTotal={totalBillBase}
                  extrasSubtotal={billingTotals.extrasSubtotal}
                  payableGrandTotal={payableGrandTotal}
                  payments={formData.payments}
                  functionDate={formData.functionDate}
                  discountPercent={parseFloat(formData.finalDiscountPercent || '0') || 0}
                  isPartyOver={activeBookingObj?.status === 'completed'}
                  totalBilledAmount={
                    activeBookingObj?.status === 'completed' && activeBookingObj?.packs?.length > 0
                      ? activeBookingObj.packs.reduce((sum: number, pack: any) => {
                          const discPct = activeBookingObj.discountPercentageValue ?? activeBookingObj.discountPercentage ?? 0;
                          const dr = (pack.ratePerPlate ?? 0) * (1 - discPct / 100);
                          const billedP = Math.max(pack.packCount ?? 0, (pack.packCount ?? 0) + (pack.extraPlate ?? 0));
                          return sum + dr * billedP;
                        }, 0)
                      : undefined
                  }
                  settlementTotalAmount={activeBookingObj?.settlementTotalAmount ?? undefined}
                  settlementDiscountAmount={activeBookingObj?.settlementDiscountAmount ?? undefined}
                />

                <BookingPartyOverForm
                  booking={activeBookingObj}
                  functionDate={formData.functionDate}
                  discountPercent={parseFloat(formData.finalDiscountPercent || '0') || 0}
                  isPartyOverSubmitted={activeBookingObj?.status === 'completed'}
                  saving={saving}
                  onSubmit={async (payload) => {
                    if (!editingBookingId) return;
                    try {
                      setSaving(true);
                      const response = await api.partyOverBooking(editingBookingId, payload);
                      toast.success('Party finalized permanently!');
                      await notifyDataChanged?.();
                      if (response.data?.data?.newBookingId) {
                        await openEditBooking(response.data.data.newBookingId);
                      } else {
                        closeBookingForm();
                      }
                    } catch (error: any) {
                      toast.error(error?.response?.data?.error || 'Failed to submit party over');
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              </div>
            )}

            <div
              className="form-actions"
              style={{
                position: 'sticky',
                bottom: 0,
                background: 'var(--surface)',
                borderTop: '1px solid var(--border)',
                padding: '12px 16px',
                marginTop: 12,
                zIndex: 20,
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowTermsModal(true)}
              >
                Terms &amp; Conditions
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
              >
                <span className="inline-flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print Form
                </span>
              </button>
              {editingBookingId && canExportMenuPdf && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const b =
                      (bookingsForMenuPdf ?? []).find((bk) => bk.id === editingBookingId) ||
                      (activeBookingObj as Booking | null);
                    if (b) setMenuPdfBooking(b);
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Menu PDF
                  </span>
                </button>
              )}
              <span className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeBookingForm}
                >
                  Cancel
                </button>
                {!isReadOnlyBooking && (
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <span className="inline-flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Submit'}
                    </span>
                  </button>
                )}
              </span>
            </div>
          </form>
        </fieldset>

        <FinalizedVersionHistory
          historicalVersions={historicalVersions}
          halls={halls}
          items={items as MenuItemLike[]}
          templateMenus={templateMenus}
        />
      </FormPromptModal>

      <FormPromptModal
        open={showTermsModal}
        title="Terms & Conditions"
        onClose={() => setShowTermsModal(false)}
        widthClass="max-w-lg"
      >
        <BookingTermsSection compact hideTitle />
      </FormPromptModal>

      <QuickCustomerModal
        open={showAddCustomerForm}
        onClose={() => setShowAddCustomerForm(false)}
        canAddCustomer={canAddCustomer}
        referrerOptions={customerReferrerOptions}
        onCreated={handleQuickCustomerCreated}
      />

      <BookingMenuEditorModal
        packKey={menuEditorPack}
        packRow={activeMenuPackRow}
        templateMenus={templateMenus}
        menuItemSearch={menuItemSearch}
        onMenuItemSearchChange={setMenuItemSearch}
        groupedMenuItems={groupedMenuItems}
        selectedMenuItemsByGroup={selectedMenuItemsByGroup}
        formDiff={formDiff}
        onImportTemplate={importTemplateToPack}
        onToggleMenuItem={togglePackMenuItem}
        onQuickAddItem={() => {
          setQuickItemForm({ name: '', itemTypeId: itemTypes[0]?.id || '', points: '' });
          setShowQuickAddItem(true);
        }}
        onClose={() => {
          setMenuEditorPack(null);
          setMenuItemSearch('');
        }}
      />
      <MenuPdfModal
        booking={menuPdfBooking}
        onClose={() => setMenuPdfBooking(null)}
      />
      {showFinalizeReview &&
        (() => {
          const enabledPacks = (Object.keys(formData.packs) as PackKey[])
            .map((key) => ({ key, row: formData.packs[key] }))
            .filter((entry) => entry.row.enabled);
          const hallNamesFor = (hallIds: string[]) =>
            hallIds
              .map((id) => halls.find((hall) => hall.id === id)?.name)
              .filter(Boolean)
              .join(', ');
          const customerLabel =
            customerSearchInputs.primary ||
            formatCustomerLabel(
              customers.find((customer) => customer.id === formData.customerId)
            ) ||
            '—';
          const paymentsTotal = formData.payments.reduce(
            (sum, p) => sum + (Number(p.amount) || 0),
            0
          );
          return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/45"
                onClick={() => setShowFinalizeReview(false)}
                aria-label="Cancel finalize"
              />
              <div className="modal-panel relative bg-surface rounded-2xl border border-[var(--border)] shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-1)] mb-1 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
                    Review before finalizing
                  </h3>
                  <p className="text-sm text-[var(--text-3)]">
                    Finalizing saves the booking, locks this version permanently as
                    read-only, and creates a new editable replica.
                  </p>
                </div>

                <dl className="text-sm space-y-1.5">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-3)]">Customer</dt>
                    <dd className="font-medium text-[var(--text-1)] text-right">{customerLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-3)]">Function</dt>
                    <dd className="font-medium text-[var(--text-1)] text-right">
                      {formData.functionType || '—'}
                      {formData.functionDate
                        ? ` · ${formatDateDDMMYYYY(formData.functionDate)}`
                        : ''}
                    </dd>
                  </div>
                </dl>

                <div className="rounded-xl border border-[var(--border-2)] divide-y divide-[var(--border)] text-sm">
                  {enabledPacks.length === 0 && (
                    <p className="px-3 py-2.5 text-[var(--text-4)]">No meal packs enabled.</p>
                  )}
                  {enabledPacks.map(({ key, row }) => (
                    <div key={key} className="px-3 py-2.5">
                      <p className="font-medium text-[var(--text-1)]">
                        {PACK_LABELS[key]}
                        {row.startTime && row.endTime ? (
                          <span className="ml-2 text-xs font-normal text-[var(--text-3)]">
                            {row.startTime}–{row.endTime}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-[var(--text-3)] mt-0.5">
                        {hallNamesFor(row.hallIds) || 'No hall'}
                        {row.pax ? ` · ${row.pax} PAX` : ''}
                        {row.ratePerPlate
                          ? ` · ₹${Number(row.ratePerPlate).toLocaleString('en-IN')}/plate`
                          : ''}
                      </p>
                    </div>
                  ))}
                </div>

                <dl className="text-sm space-y-1.5 border-t border-[var(--border)] pt-3">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-3)]">Grand total</dt>
                    <dd className="font-semibold text-[var(--text-1)]">
                      ₹{Number(payableGrandTotal || 0).toLocaleString('en-IN')}
                    </dd>
                  </div>
                  {Number(formData.finalDiscountAmount) > 0 && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--text-3)]">Discount</dt>
                      <dd className="text-[var(--text-1)]">
                        ₹{Number(formData.finalDiscountAmount).toLocaleString('en-IN')}
                        {Number(formData.finalDiscountPercent) > 0
                          ? ` (${formData.finalDiscountPercent}%)`
                          : ''}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-3)]">
                      Payments recorded (incl. pending cheques)
                    </dt>
                    <dd className="text-[var(--text-1)]">
                      {formData.payments.length} · ₹{paymentsTotal.toLocaleString('en-IN')}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-3 justify-end pt-1">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowFinalizeReview(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={() => void confirmFinalizeBooking()}
                  >
                    {saving ? 'Working…' : 'Save & Finalize'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {saveConflict && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            onClick={() => setSaveConflict(null)}
            aria-label="Dismiss conflict dialog"
          />
          <div className="modal-panel relative bg-surface rounded-2xl border border-[var(--border)] shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-1)] mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
                Booking changed by someone else
              </h3>
              <p className="text-sm text-[var(--text-3)]">
                This booking was updated
                {saveConflict.serverUpdatedAt
                  ? ` at ${new Date(saveConflict.serverUpdatedAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : ''}{' '}
                while you were editing. Saving now would overwrite those changes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSaveConflict(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSaveConflict(null);
                  if (editingBookingId) void openEditBooking(editingBookingId);
                }}
              >
                Reload latest (discard my edits)
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  const pendingOpts = saveConflict.opts;
                  setSaveConflict(null);
                  void doSaveBooking({ ...pendingOpts, skipConflictCheck: true });
                }}
              >
                Save anyway (overwrite)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Quick Add Item Modal */}
      <FormPromptModal
        open={showQuickAddItem}
        onClose={() => setShowQuickAddItem(false)}
        title="Create New Item"
      >
        <form onSubmit={submitQuickAddItem} className="space-y-4">
          <div>
            <label className="label">Item Type <span className="text-red-500">*</span></label>
            <select
              className="input"
              value={quickItemForm.itemTypeId}
              onChange={(e) => setQuickItemForm((prev) => ({ ...prev, itemTypeId: e.target.value }))}
              required
            >
              <option value="">Select type...</option>
              {itemTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Item Name <span className="text-red-500">*</span></label>
            <input
              className="input"
              placeholder="e.g. Paneer Butter Masala"
              value={quickItemForm.name}
              onChange={(e) => setQuickItemForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Points <span className="text-red-500">*</span></label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 1.5"
              value={quickItemForm.points}
              onChange={(e) => setQuickItemForm((prev) => ({ ...prev, points: e.target.value }))}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setShowQuickAddItem(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingQuickItem}>
              {savingQuickItem ? 'Creating...' : 'Create & Select'}
            </button>
          </div>
        </form>
      </FormPromptModal>
    </>
  );
}
