export type BookingFormPrintTab = 'details' | 'payments';

export function prepareBookingFormPrint(
  activeTab: BookingFormPrintTab,
  setActiveTab: (tab: BookingFormPrintTab) => void,
  print: () => void,
  defer: (callback: () => void) => void = (callback) => window.setTimeout(callback, 0)
) {
  if (activeTab !== 'details') {
    setActiveTab('details');
    defer(print);
    return;
  }

  print();
}
