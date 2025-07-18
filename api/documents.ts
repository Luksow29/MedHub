// src/api/documents.ts (சரிசெய்யப்பட்ட குறியீடு)

import { supabase } from '../lib/supabase';
import { NewDbPatientDocument } from '../types';

export const uploadPatientDocument = async (
  data: Omit<NewDbPatientDocument, 'file_name' | 'file_path' | 'uploaded_at'>,
  file: File,
  patientId: string,
  userId: string // user_id ஐ இங்கு அனுப்ப வேண்டும்
) => {
  try {
    const fileExt = file.name.split('.').pop();
    // கோப்புப் பாதையை மாற்றப்பட்டது: user_id ஐ முதலில் சேர்க்கிறது
    // இது கொள்கையில் உள்ள (storage.foldername(name))[1] உடன் பொருந்தும்.
    const fileName = `${Math.random().toString(36).substring(2)}_${file.name}`; // தனித்துவமான பெயர்
    const filePath = `${userId}/${patientId}/${data.document_type || 'untyped'}/${fileName}`; // filePath திருத்தப்பட்டது
    // உதாரணப் பாதை: YOUR_USER_ID/PATIENT_ID/DOCUMENT_TYPE/UNIQUE_FILENAME

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
      file_name: file.name, // அசல் கோப்புப் பெயர்
      file_path: publicUrl, // பொது URL ஐ சேமிக்கவும்
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
    // பொது URL: .../public/patientdocuments/USER_ID/PATIENT_ID/DOCUMENT_TYPE/FILENAME
    // நமக்கு தேவையானது: USER_ID/PATIENT_ID/DOCUMENT_TYPE/FILENAME
    const url = new URL(document.file_path);
    const pathSegments = url.pathname.split('/');
    // 'patientdocuments' என்பதற்குப் பிறகு உள்ள பகுதியைப் பெறவும்.
    // எ.கா: ['','storage','v1','object','public','patientdocuments','USER_ID','PATIENT_ID','DOCUMENT_TYPE','FILENAME']
    const bucketIndex = pathSegments.indexOf('patientdocuments');
    const filePathInBucket = pathSegments.slice(bucketIndex + 1).join('/'); // USER_ID/PATIENT_ID/DOCUMENT_TYPE/FILENAME

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('patientdocuments')
      .remove([filePathInBucket]); // filePathInBucket ஐப் பயன்படுத்துகிறோம்

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