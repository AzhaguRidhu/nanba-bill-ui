export interface Customer {
  id: string;
  name: string;
  place: string;
  whatsapp: string;
  mobile: string;
  createdAt: string;
}

export interface BillItem {
  id: string;
  category: string;
  itemName: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  amount: number;
}

export interface Payment {
  id: string;
  billId: string;
  amount: number;
  type: 'advance' | 'full' | 'credit' | 'balance';
  date: string;
  note: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  billDate: string;
  customerId: string;
  customerName: string;
  customerPlace: string;
  customerMobile: string;
  customerWhatsapp: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  charges: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'Pending' | 'Advance Paid' | 'Partially Paid' | 'Fully Paid' | 'Credit' | 'Overdue';
  payments: Payment[];
  createdAt: string;
}

export interface Expense {
  id: string;
  category: 'direct' | 'fixed' | 'depreciation' | 'printing';
  name: string;
  amount: number;
  date: string;
  note: string;
}

export const CATEGORIES = ['Flex', 'Photo Frame', 'LED Board', 'Offset Printing', 'Visiting Card'];

export const TERMS = [
  'Payment should be made according to the agreed payment terms.',
  'Advance payment is non-refundable where production/work has already started.',
  'Customer should verify order details before production.',
  'Changes after confirmation may result in additional charges.',
  'Delivery time depends on the type and quantity of work.',
  'Customer is responsible for providing correct name, phone number, content, design, and other required information.',
  'Balance payment should be settled as agreed.',
  'Credit amounts must be cleared within the agreed credit period.',
  'Printed/design materials cannot be returned after production unless otherwise agreed.',
  'The final bill amount mentioned in the invoice is payable by the customer.'
];
