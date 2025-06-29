// File: api/invoices.ts

import { supabase } from '../lib/supabase';
import { DbInvoice, NewDbInvoice, UpdateDbInvoice } from '../types';

/**
 * Fetches all invoices, including the patient's name for display.
 */
export const getAllInvoices = async () => {
    const { data, error } = await supabase
        .from('invoices')
        .select('*, patients(name)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all invoices:', error);
        throw error;
    }

    const formattedData = data.map(invoice => {
        const { patients, ...rest } = invoice;
        const patientName = (patients as { name: string } | null)?.name || 'Unknown Patient';
        return {
            ...rest,
            patient_name: patientName,
        };
    });

    return formattedData as (DbInvoice & { patient_name: string })[];
};

/**
 * Fetches all invoices for a specific appointment.
 */
export const getInvoicesForAppointment = async (appointmentId: string) => {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('consultation_id', appointmentId);

    if (error) {
        console.error('Error fetching invoices for appointment:', error);
        throw error;
    }
    return data as DbInvoice[];
};

/**
 * Creates a new invoice MANUALLY.
 */
export const createManualInvoice = async (invoiceData: NewDbInvoice, userId: string) => {
    const { data, error } = await supabase
        .from('invoices')
        .insert([{ ...invoiceData, user_id: userId }])
        .select()
        .single();

    if (error) {
        console.error('Error creating manual invoice:', error);
        throw error;
    }
    return data as DbInvoice;
};

/**
 * Updates an existing invoice.
 */
export const updateInvoice = async (invoiceId: string, updates: UpdateDbInvoice) => {
    const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId)
        .select()
        .single();

    if (error) {
        console.error('Error updating invoice:', error);
        throw error;
    }
    return data as DbInvoice;
};

/**
 * Cancels an invoice by updating its status.
 */
export const cancelInvoice = async (invoiceId: string) => {
    const { data, error } = await updateInvoice(invoiceId, { status: 'cancelled' });

    if (error) {
        console.error('Error cancelling invoice:', error);
        throw error;
    }
    return data;
};

/**
 * Fetches a single invoice by its unique ID, including patient's name and phone.
 * (This is the single, corrected version of the function)
 */
export const getInvoiceById = async (invoiceId: string) => {
    const { data, error } = await supabase
        .from('invoices')
        .select('*, patients(name, contact_phone)') // Fetches both name and phone
        .eq('id', invoiceId)
        .single();

    if (error) {
        console.error(`Error fetching invoice by ID [${invoiceId}]:`, error);
        throw error;
    }

    const { patients, ...rest } = data;
    const patientName = (patients as { name: string } | null)?.name || 'Unknown Patient';
    const patientPhone = (patients as { contact_phone: string } | null)?.contact_phone || '';

    return {
        ...rest,
        patient_name: patientName,
        patient_phone: patientPhone,
    };
};

/**
 * Fetches all line items for a specific invoice.
 */
export const getInvoiceItems = async (invoiceId: string) => {
    const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

    if (error) {
        console.error(`Error fetching items for invoice [${invoiceId}]:`, error);
        throw error;
    }
    return data || [];
};
