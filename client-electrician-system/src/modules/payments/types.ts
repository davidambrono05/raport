export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface Payment {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  dueDate: Date;
  paidAt?: Date;
  status: PaymentStatus;
}

export interface PaymentSummaryData {
  totalInvoiced: number;
  totalPaid: number;
  totalOverdue: number;
  overdueCount: number;
}
