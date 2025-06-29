// api/payments.ts - Payment management API functions

import { supabase } from '../lib/supabase';
import { 
  Payment, 
  NewDbPayment, 
  UpdateDbPayment,
  PaymentStatus,
  PaymentMethod
} from '../types/payment';

// Get payments by patient ID
export const getPaymentsByPatientId = async (patientId: string, userId: string) => {
  return supabase
    .from('payments')
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

// Get payments by consultation ID
export const getPaymentsByConsultationId = async (consultationId: string, userId: string) => {
  return supabase
    .from('payments')
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

// Add a payment
export const addPayment = async (data: NewDbPayment, userId: string) => {
  return supabase
    .from('payments')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
};

// Update a payment
export const updatePayment = async (id: string, data: UpdateDbPayment, userId: string) => {
  return supabase
    .from('payments')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
};

// Delete a payment (soft delete)
export const deletePayment = async (id: string, userId: string) => {
  return supabase
    .from('payments')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', id)
    .eq('user_id', userId);
};

// Process payment with Stripe
export const processStripePayment = async (
  amount: number,
  currency: string,
  patientId: string,
  consultationId: string | null,
  userId: string,
  paymentMethodId: string
) => {
  try {
    // This would typically call a serverless function that handles the Stripe API
    // For now, we'll simulate a successful payment
    
    // Create a payment record
    const paymentData: NewDbPayment = {
      patient_id: patientId,
      consultation_id: consultationId,
      amount,
      currency,
      payment_method: PaymentMethod.CREDIT_CARD,
      payment_status: PaymentStatus.COMPLETED,
      transaction_id: `sim_${Math.random().toString(36).substring(2, 15)}`,
      payment_date: new Date().toISOString(),
      notes: 'Payment processed via Stripe'
    };
    
    const { data, error } = await addPayment(paymentData, userId);
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error processing Stripe payment:', error);
    return { data: null, error };
  }
};

// Get payment statistics
export const getPaymentStatistics = async (userId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    const [todayResult, monthResult, totalResult] = await Promise.all([
      // Today's payments
      supabase
        .from('payments')
        .select('amount', { count: 'exact' })
        .eq('user_id', userId)
        .eq('payment_status', 'completed')
        .eq('is_deleted', false)
        .gte('payment_date', today),
        
      // This month's payments
      supabase
        .from('payments')
        .select('amount', { count: 'exact' })
        .eq('user_id', userId)
        .eq('payment_status', 'completed')
        .eq('is_deleted', false)
        .gte('payment_date', firstDayOfMonth),
        
      // Total payments
      supabase
        .from('payments')
        .select('amount')
        .eq('user_id', userId)
        .eq('payment_status', 'completed')
        .eq('is_deleted', false)
    ]);
    
    // Calculate total revenue
    const totalRevenue = totalResult.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    
    return {
      todayCount: todayResult.count || 0,
      todayAmount: todayResult.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
      monthCount: monthResult.count || 0,
      monthAmount: monthResult.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
      totalRevenue
    };
  } catch (error: any) {
    console.error('Error getting payment statistics:', error);
    return {
      todayCount: 0,
      todayAmount: 0,
      monthCount: 0,
      monthAmount: 0,
      totalRevenue: 0
    };
  }
};