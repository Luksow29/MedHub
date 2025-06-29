// types/payment.ts - Types for payment and invoice functionality

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  INSURANCE = 'insurance',
  OTHER = 'other'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

// Database types (snake_case)
export interface DbPayment {
  id: string;
  user_id: string;
  patient_id: string;
  consultation_id: string | null;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_id: string | null;
  payment_date: string | null;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbInvoice {
  id: string;
  user_id: string;
  patient_id: string;
  consultation_id: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  payment_id: string | null;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbInvoiceItem {
  id: string;
  invoice_id: string;
  user_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
}

// Client-side types (camelCase)
export interface Payment {
  id: string;
  userId: string;
  patientId: string;
  consultationId: string | null;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId: string | null;
  paymentDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Join fields
  patientName?: string;
}

export interface Invoice {
  id: string;
  userId: string;
  patientId: string;
  consultationId: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  paymentId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Join fields
  patientName?: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  userId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

// Types for creating/updating records
export type NewDbPayment = Omit<DbPayment, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>;
export type UpdateDbPayment = Partial<Omit<DbPayment, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>>;

export type NewDbInvoice = Omit<DbInvoice, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>;
export type UpdateDbInvoice = Partial<Omit<DbInvoice, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>>;

export type NewDbInvoiceItem = Omit<DbInvoiceItem, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>;
export type UpdateDbInvoiceItem = Partial<Omit<DbInvoiceItem, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'deleted_at' | 'deleted_by' | 'user_id'>>;