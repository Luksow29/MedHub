// src/api/payments.ts

import { supabase } from '../lib/supabase';
import { DbPayment, UpdateDbPayment } from '../types';

/**
 * Fetches all payments for a specific invoice.
 * ஒரு இன்வாய்ஸின் அனைத்து கட்டணங்களையும் பெற இது உதவுகிறது.
 */
export const getPaymentsForInvoice = async (invoiceId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
  return data as DbPayment[];
};

/**
 * Records a new payment by calling our secure backend function.
 * This is the NEW and CORRECT way to create a payment.
 * கட்டணத்தைப் பதிவு செய்ய, நமது பாதுகாப்பான பின்தள ஃபங்ஷனை அழைக்கும் புதிய முறை இது.
 */
export const recordPayment = async (params: {
  p_invoice_id: string;
  p_amount_paid: number;
  p_payment_method: string;
  p_notes?: string;
  p_transaction_id?: string;
}) => {
  const { data, error } = await supabase.rpc('process_payment', params);

  if (error) {
    console.error('Error processing payment via RPC:', error);
    throw error;
  }
  
  // The backend function returns a JSON object. We check it for success.
  if (!data.success) {
      console.error('Backend returned an error:', data.message);
      throw new Error(data.message);
  }

  return data; // Returns { success: true, message: '...', new_invoice_status: '...' }
};


/**
 * Updates an existing payment.
 * Should be used with caution, e.g., only for adding notes.
 * குறிப்புகளைச் சேர்ப்பது போன்ற சிறிய திருத்தங்களுக்கு மட்டும் இதைப் பயன்படுத்தவும்.
 */
export const updatePayment = async (paymentId: string, updates: UpdateDbPayment) => {
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', paymentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
  return data as DbPayment;
};

// The 'createPayment' function has been removed because 'recordPayment' (using RPC) is superior.
// 'createPayment' ஃபங்ஷன் நீக்கப்பட்டுள்ளது, ஏனெனில் 'recordPayment' சிறந்த மற்றும் பாதுகாப்பான முறை.

// The 'deletePayment' function has been intentionally removed.
// 'deletePayment' ஃபங்ஷன் தணிக்கை காரணங்களுக்காக நீக்கப்பட்டுள்ளது.
// File: api/payments.ts
// ... (keep existing functions)

/**
 * Fetches all payments from all invoices, including invoice and patient info.
 * அனைத்து கட்டணப் பரிவர்த்தனைகளையும் அவற்றின் இன்வாய்ஸ் மற்றும் நோயாளி விவரங்களுடன் பெற.
 */
export const getAllPayments = async () => {
  const { data, error } = await supabase
      .from('payments')
      .select('*, invoices(invoice_number, patients(name))')
      .order('payment_date', { ascending: false });

  if (error) {
      console.error('Error fetching all payments:', error);
      throw error;
  }
  return data || [];
};