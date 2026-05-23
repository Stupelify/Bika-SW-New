export interface PaymentRow {
  id?: string;
  mode: string;
  narration: string;
  date: string;
  receivedBy: string;
  amount: string;
  reference: string;
  clearingDate: string;
  _original?: {
    mode: string;
    narration: string;
    date: string;
    receivedBy: string;
    amount: string;
    reference: string;
    clearingDate: string;
  };
}

export interface MenuItemLike {
  id: string;
  name: string;
  point?: number | null;
  points?: number | null;
  itemType?: {
    id: string;
    name: string;
    order?: number | null;
    displayOrder?: number | null;
  };
}
