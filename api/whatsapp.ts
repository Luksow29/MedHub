// File: api/whatsapp.ts

import { supabase } from '../lib/supabase';

// --- Template CRUD Functions ---

/**
 * Fetches all WhatsApp templates.
 * அனைத்து வாட்ஸ்அப் டெம்ப்ளேட்களையும் பெற.
 */
export const getTemplates = async () => {
    const { data, error } = await supabase.from('whatsapp_templates').select('*').order('name');
    if (error) throw error;
    return data;
};

/**
 * Creates a new WhatsApp template.
 * ஒரு புதிய டெம்ப்ளேட்டை உருவாக்க.
 */
export const createTemplate = async (templateData: { name: string; template_text: string; variables: string[] }) => {
    const { data, error } = await supabase.from('whatsapp_templates').insert(templateData).select().single();
    if (error) throw error;
    return data;
};

/**
 * Updates an existing WhatsApp template.
 * ஒரு டெம்ப்ளேட்டைத் திருத்த.
 */
export const updateTemplate = async (id: string, updates: { name?: string; template_text?: string; variables?: string[] }) => {
    const { data, error } = await supabase.from('whatsapp_templates').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

/**
 * Deletes a WhatsApp template.
 * ஒரு டெம்ப்ளேட்டை நீக்க.
 */
export const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id);
    if (error) throw error;
};


// --- Patient Data Function ---

/**
 * Fetches all details for a patient (appointments, consultations, invoices).
 * ஒரு நோயாளியின் முழு விவரங்களையும் பெற.
 */
export const getPatientFullDetails = async (patientId: string) => {
    const { data, error } = await supabase.rpc('get_patient_full_details', { p_patient_id: patientId });
    if (error) throw error;
    return data;
};

/**
 * Fetches a simple list of all patients for dropdown selectors.
 * selector-க்காக அனைத்து நோயாளிகளின் பட்டியலைப் பெற.
 */
export const getAllPatientsForSelect = async () => {
    const { data, error } = await supabase.from('patients').select('id, name').order('name');
    if (error) throw error;
    return data;
}
