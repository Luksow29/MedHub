// src/api/documents.ts

import { supabase } from '../lib/supabase';
import { DbPatientDocument, NewDbPatientDocument } from '../types';

export const getPatientDocumentsByPatientId = async (patientId: string, userId: string) => {
  return supabase.from('patient_documents').select('*').eq('patient_id', patientId).eq('user_id', userId).order('uploaded_at', { ascending: false });
};

export const uploadPatientDocument = async (
  data: Omit<NewDbPatientDocument, 'file_name' | 'file_path' | 'uploaded_at'>, // UI இலிருந்து வரும் பகுதிகள்
  file: File,
  patientId: string,
  userId: string
) => {
  const filePath = `patient_records/${patientId}/${data.document_type || 'untyped'}/${file.name}`;

  // 1. சுபாபேஸ் சேமிப்பகத்தில் கோப்பைப் பதிவேற்றவும்
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('patient_documents') // உங்கள் பக்கெட்டின் பெயர் (முன்பு உருவாக்கியது)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // 2. பதிவேற்றிய கோப்பின் பொது URL ஐப் பெறவும்
  const publicUrl = supabase.storage.from('patient_documents').getPublicUrl(filePath).data.publicUrl;

  // 3. தரவுத்தளத்தில் ஆவண metadata ஐச் செருகவும்
  const { data: newDocEntry, error: dbError } = await supabase
    .from('patient_documents')
    .insert({
      ...data,
      patient_id: patientId,
      user_id: userId, // User who uploaded
      file_name: file.name,
      file_path: publicUrl, // பொது URL ஐ சேமிக்கவும்
      uploaded_at: new Date().toISOString() // பதிவேற்றிய நேரத்தை பதிவு செய்கிறோம்
    })
    .select()
    .single();

  if (dbError) throw dbError;
  return { data: newDocEntry, error: null };
};

export const deletePatientDocument = async (id: string, filePath: string, userId: string) => {
  // 1. சேமிப்பகத்திலிருந்து கோப்பை நீக்க
  const { error: storageError } = await supabase.storage.from('patient_documents').remove([filePath.split('patient_records/')[1]]); // பக்கெட்டிலிருந்து பாதை
  if (storageError) console.warn("சேமிப்பகத்திலிருந்து ஆவணத்தை நீக்குவதில் பிழை:", storageError.message); // பிழை ஏற்பட்டாலும் தொடரலாம்

  // 2. தரவுத்தள பதிவை நீக்க
  return supabase.from('patient_documents').delete().eq('id', id).eq('user_id', userId);
};