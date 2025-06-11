// src/api/documents.ts

import { supabase } from '../lib/supabase';
import { NewDbPatientDocument } from '../types';

export const uploadPatientDocument = async (
  data: Omit<NewDbPatientDocument, 'file_name' | 'file_path' | 'uploaded_at'>, 
  file: File, 
  patientId: string, 
  userId: string
) => {
  try {
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${file.name}`;
    const filePath = `patient_records/${patientId}/${data.document_type}/${fileName}`;

    // Upload file to storage - using correct bucket name 'patientdocuments'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('patientdocuments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('patientdocuments')
      .getPublicUrl(filePath);

    // Insert document record into database
    const documentData = {
      ...data,
      patient_id: patientId,
      user_id: userId,
      file_name: file.name,
      file_path: publicUrl,
      uploaded_at: new Date().toISOString(),
    };

    const { data: dbData, error: dbError } = await supabase
      .from('patient_documents')
      .insert(documentData)
      .select()
      .single();

    if (dbError) throw dbError;

    return { data: dbData, error: null };
  } catch (error: any) {
    console.error('Document upload error:', error);
    return { data: null, error };
  }
};

export const deletePatientDocument = async (documentId: string, userId: string) => {
  try {
    // First get the document to find the file path
    const { data: document, error: fetchError } = await supabase
      .from('patient_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Extract file path from the public URL for storage deletion
    const url = new URL(document.file_path);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('patient_records')).join('/');

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('patientdocuments')
      .remove([filePath]);

    if (storageError) {
      console.warn('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('patient_documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error: any) {
    console.error('Document deletion error:', error);
    return { error };
  }
};

export const getPatientDocuments = async (patientId: string, userId: string) => {
  return supabase
    .from('patient_documents')
    .select('*')
    .eq('patient_id', patientId)
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });
};