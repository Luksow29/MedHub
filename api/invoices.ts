// api/invoices.ts - Invoice management API functions

import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { 
  Invoice, 
  NewDbInvoice, 
  UpdateDbInvoice,
  InvoiceStatus,
  NewDbInvoiceItem,
  InvoiceItem
} from '../types/payment';

// Get invoices by patient ID
export const getInvoicesByPatientId = async (patientId: string, userId: string) => {
  return supabase
    .from('invoices')
    .select(`
      *,
      patients (
        id,
        name,
        contact_phone,
        contact_email
      )
    `)
    .eq('patient_id', patientId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
};

// Get invoices by consultation ID
export const getInvoicesByConsultationId = async (consultationId: string, userId: string) => {
  return supabase
    .from('invoices')
    .select(`
      *,
      patients (
        id,
        name,
        contact_phone,
        contact_email
      )
    `)
    .eq('consultation_id', consultationId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
};

// Get invoice by ID with items
export const getInvoiceById = async (invoiceId: string, userId: string) => {
  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        patients (
          id,
          name,
          contact_phone,
          contact_email,
          address
        )
      `)
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();
      
    if (invoiceError) throw invoiceError;
    
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
      
    if (itemsError) throw itemsError;
    
    // Map to client types
    const mappedInvoice: Invoice = {
      id: invoice.id,
      userId: invoice.user_id,
      patientId: invoice.patient_id,
      consultationId: invoice.consultation_id,
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.invoice_date,
      dueDate: invoice.due_date,
      amount: invoice.amount,
      currency: invoice.currency,
      taxAmount: invoice.tax_amount,
      discountAmount: invoice.discount_amount,
      totalAmount: invoice.total_amount,
      status: invoice.status,
      paymentId: invoice.payment_id,
      notes: invoice.notes,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
      patientName: invoice.patients?.name,
      items: items?.map(item => ({
        id: item.id,
        invoiceId: item.invoice_id,
        userId: item.user_id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: item.amount,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      })) || []
    };
    
    return { data: mappedInvoice, error: null };
  } catch (error: any) {
    console.error('Error getting invoice by ID:', error);
    return { data: null, error };
  }
};

// Generate invoice number
export const generateInvoiceNumber = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('invoices')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);
      
    if (error) throw error;
    
    const prefix = 'INV';
    const year = new Date().getFullYear().toString().substring(2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const sequence = (count || 0) + 1;
    
    return `${prefix}-${year}${month}-${sequence.toString().padStart(4, '0')}`;
  } catch (error: any) {
    console.error('Error generating invoice number:', error);
    // Fallback to a random invoice number
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${new Date().getFullYear().toString().substring(2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${randomPart}`;
  }
};

// Create invoice with items
export const createInvoice = async (
  invoiceData: Omit<NewDbInvoice, 'invoice_number'>,
  invoiceItems: Omit<NewDbInvoiceItem, 'invoice_id'>[],
  userId: string
) => {
  try {
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(userId);
    
    // Start a transaction
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({ ...invoiceData, invoice_number: invoiceNumber, user_id: userId })
      .select()
      .single();
      
    if (invoiceError) throw invoiceError;
    
    // Insert invoice items
    if (invoiceItems.length > 0) {
      const itemsWithInvoiceId = invoiceItems.map(item => ({
        ...item,
        invoice_id: invoice.id,
        user_id: userId
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);
        
      if (itemsError) throw itemsError;
    }
    
    return { data: invoice, error: null };
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return { data: null, error };
  }
};

// Update invoice
export const updateInvoice = async (id: string, data: UpdateDbInvoice, userId: string) => {
  return supabase
    .from('invoices')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Delete invoice (soft delete)
export const deleteInvoice = async (id: string, userId: string) => {
  return supabase
    .from('invoices')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', id)
    .eq('user_id', userId);
};

// Add invoice item
export const addInvoiceItem = async (invoiceId: string, data: Omit<NewDbInvoiceItem, 'invoice_id'>, userId: string) => {
  return supabase
    .from('invoice_items')
    .insert({ ...data, invoice_id: invoiceId, user_id: userId })
    .select()
    .single();
};

// Update invoice item
export const updateInvoiceItem = async (id: string, data: Partial<Omit<NewDbInvoiceItem, 'invoice_id'>>, userId: string) => {
  return supabase
    .from('invoice_items')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Delete invoice item
export const deleteInvoiceItem = async (id: string, userId: string) => {
  return supabase
    .from('invoice_items')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', id)
    .eq('user_id', userId);
};

// Mark invoice as paid
export const markInvoiceAsPaid = async (id: string, paymentId: string, userId: string) => {
  return supabase
    .from('invoices')
    .update({
      status: InvoiceStatus.PAID,
      payment_id: paymentId
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Get invoice statistics
export const getInvoiceStatistics = async (userId: string) => {
  try {
    const [paidResult, overdueResult, draftResult] = await Promise.all([
      // Paid invoices
      supabase
        .from('invoices')
        .select('total_amount', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', InvoiceStatus.PAID)
        .eq('is_deleted', false),
        
      // Overdue invoices
      supabase
        .from('invoices')
        .select('total_amount', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', InvoiceStatus.OVERDUE)
        .eq('is_deleted', false),
        
      // Draft invoices
      supabase
        .from('invoices')
        .select('total_amount', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', InvoiceStatus.DRAFT)
        .eq('is_deleted', false)
    ]);
    
    // Calculate total amounts
    const paidAmount = paidResult.data?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0;
    const overdueAmount = overdueResult.data?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0;
    
    return {
      paidCount: paidResult.count || 0,
      paidAmount,
      overdueCount: overdueResult.count || 0,
      overdueAmount,
      draftCount: draftResult.count || 0
    };
  } catch (error: any) {
    console.error('Error getting invoice statistics:', error);
    return {
      paidCount: 0,
      paidAmount: 0,
      overdueCount: 0,
      overdueAmount: 0,
      draftCount: 0
    };
  }
};