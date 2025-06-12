// api/consultationDocuments.ts - Consultation documents management API functions

import { supabase } from '../lib/supabase';
import { 
  NewDbConsultationDocument
} from '../types';

// Get documents for a consultation
export const getDocumentsByConsultationId = async (consultationId: string, userId: string) => {
  return supabase
    .from('consultation_documents')
    .select('*')
    .eq('consultation_id', consultationId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
};

// Get documents for a patient
export const getDocumentsByPatientId = async (patientId: string, userId: string) => {
  return supabase
    .from('consultation_documents')
    .select(`
      *,
      consultations (
        id,
        consultation_date,
        consultation_time,
        attending_physician,
        chief_complaint
      )
    `)
    .eq('patient_id', patientId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });
};

// Upload a document
export const uploadConsultationDocument = async (
  data: Omit<NewDbConsultationDocument, 'file_name' | 'file_path'>,
  file: File,
  consultationId: string,
  patientId: string,
  userId: string
) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${file.name}`; // Unique name
    const filePath = `${userId}/${patientId}/consultations/${consultationId}/${fileName}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('consultationdocuments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('consultationdocuments')
      .getPublicUrl(filePath);

    // Insert document record into database
    const documentData = {
      ...data,
      consultation_id: consultationId,
      patient_id: patientId,
      user_id: userId,
      file_name: file.name, // Original file name
      file_path: publicUrl, // Public URL
    };

    const { data: dbData, error: dbError } = await supabase
      .from('consultation_documents')
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

// Delete a document
export const deleteConsultationDocument = async (documentId: string, userId: string) => {
  try {
    // First get the document to find the file path
    const { data: document, error: fetchError } = await supabase
      .from('consultation_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Extract file path from the public URL for storage deletion
    const url = new URL(document.file_path);
    const pathSegments = url.pathname.split('/');
    const bucketIndex = pathSegments.indexOf('consultationdocuments');
    const filePathInBucket = pathSegments.slice(bucketIndex + 1).join('/');

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('consultationdocuments')
      .remove([filePathInBucket]);

    if (storageError) {
      console.warn('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Mark as deleted in database
    const { error: dbError } = await supabase
      .from('consultation_documents')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .eq('id', documentId)
      .eq('user_id', userId);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error: any) {
    console.error('Document deletion error:', error);
    return { error };
  }
};

// Generate medical certificate
export const generateMedicalCertificate = async (
  consultationId: string,
  userId: string,
  startDate: string,
  endDate: string,
  reason: string
) => {
  try {
    // Get consultation details
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .select(`
        *,
        patients (
          id,
          name,
          dob,
          gender,
          contact_phone,
          contact_email,
          address
        )
      `)
      .eq('id', consultationId)
      .eq('user_id', userId)
      .single();
      
    if (consultationError) throw consultationError;
    
    // Get diagnoses for the consultation
    const { data: diagnoses, error: diagnosesError } = await supabase
      .from('diagnoses')
      .select('icd_code, description, is_primary')
      .eq('consultation_id', consultationId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('is_primary', { ascending: false });
      
    if (diagnosesError) throw diagnosesError;
    
    // Format the certificate data
    const certificateData = {
      certificateId: `MED-CERT-${Date.now().toString().substring(5)}`,
      issueDate: new Date().toISOString().split('T')[0],
      patientName: consultation.patients?.name,
      patientDob: consultation.patients?.dob,
      patientGender: consultation.patients?.gender,
      consultationDate: consultation.consultation_date,
      physician: consultation.attending_physician,
      diagnoses: diagnoses || [],
      startDate: startDate,
      endDate: endDate,
      daysOff: calculateDaysBetween(startDate, endDate),
      reason: reason
    };
    
    return { data: certificateData, error: null };
  } catch (error: any) {
    console.error('Error generating medical certificate:', error);
    return { data: null, error };
  }
};

// Helper function to calculate days between two dates
const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end dates
};