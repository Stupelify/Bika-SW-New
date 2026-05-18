/**
 * booking.controller.ts
 *
 * Re-export barrel for backward compatibility with route files.
 * All logic has been split into focused modules:
 *   - booking.shared.ts      — shared utilities, types, constants
 *   - booking.read.ts        — GET handlers
 *   - booking.write.ts       — mutating handlers (create, update, cancel, delete, finalize, partyOver)
 *   - booking.payments.ts    — payment handlers
 *   - booking.pdf.ts         — PDF generation handlers
 *   - booking.financials.ts  — scheduled financial operations (releasePencilBookings)
 */
export * from './booking.shared';
export * from './booking.read';
export * from './booking.write';
export * from './booking.payments';
export * from './booking.pdf';
export * from './booking.financials';
