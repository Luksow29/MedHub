// api/patientAudit.ts - Patient audit trail and soft delete management

import { supabase } from '../lib/supabase';

export interface AuditLogEntry {
  id: string;
  userId: string;
  patientId: string;
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE';
  oldValues: any;
  newValues: any;
  changedFields: string[];
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface DeletedPatient {
  id: string;
  originalPatientId: string;
  userId: string;
  patientData: any;
  deletionReason?: string;
  deletedBy: string;
  deletedAt: string;
  canRestore: boolean;
}

// Get audit trail for a patient
export const getPatientAuditTrail = async (patientId: string, userId: string): Promise<AuditLogEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('patient_audit_log')
      .select('*')
      .eq('patient_id', patientId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(entry => ({
      id: entry.id,
      userId: entry.user_id,
      patientId: entry.patient_id,
      tableName: entry.table_name,
      operation: entry.operation,
      oldValues: entry.old_values,
      newValues: entry.new_values,
      changedFields: entry.changed_fields || [],
      ipAddress: entry.ip_address,
      userAgent: entry.user_agent,
      createdAt: entry.created_at
    }));
  } catch (error: any) {
    console.error('Get patient audit trail error:', error);
    throw new Error(`Failed to get audit trail: ${error.message}`);
  }
};

// Soft delete a patient
export const softDeletePatient = async (
  patientId: string, 
  userId: string, 
  deletionReason?: string
): Promise<void> => {
  try {
    // First, get the patient data
    const { data: patientData, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;
    if (!patientData) throw new Error('Patient not found');

    // Start a transaction-like operation
    const { error: deleteError } = await supabase.rpc('soft_delete_patient_with_backup', {
      patient_id_param: patientId,
      user_id_param: userId,
      deletion_reason_param: deletionReason || null
    });

    if (deleteError) {
      // Fallback to manual soft delete if RPC doesn't exist
      // Store in deleted_patients table
      const { error: backupError } = await supabase
        .from('deleted_patients')
        .insert({
          original_patient_id: patientId,
          user_id: userId,
          patient_data: patientData,
          deletion_reason: deletionReason,
          deleted_by: userId
        });

      if (backupError) throw backupError;

      // Mark patient as deleted
      const { error: markDeletedError } = await supabase
        .from('patients')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', patientId)
        .eq('user_id', userId);

      if (markDeletedError) throw markDeletedError;

      // Soft delete related records
      await Promise.all([
        supabase.from('medical_history').update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId }).eq('patient_id', patientId).eq('user_id', userId),
        supabase.from('medications').update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId }).eq('patient_id', patientId).eq('user_id', userId),
        supabase.from('allergies').update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId }).eq('patient_id', patientId).eq('user_id', userId),
        supabase.from('insurance_billing').update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId }).eq('patient_id', patientId).eq('user_id', userId),
        supabase.from('patient_documents').update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId }).eq('patient_id', patientId).eq('user_id', userId)
      ]);
    }
  } catch (error: any) {
    console.error('Soft delete patient error:', error);
    throw new Error(`Failed to delete patient: ${error.message}`);
  }
};

// Get deleted patients
export const getDeletedPatients = async (userId: string): Promise<DeletedPatient[]> => {
  try {
    const { data, error } = await supabase
      .from('deleted_patients')
      .select('*')
      .eq('user_id', userId)
      .order('deleted_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      originalPatientId: item.original_patient_id,
      userId: item.user_id,
      patientData: item.patient_data,
      deletionReason: item.deletion_reason,
      deletedBy: item.deleted_by,
      deletedAt: item.deleted_at,
      canRestore: item.can_restore
    }));
  } catch (error: any) {
    console.error('Get deleted patients error:', error);
    throw new Error(`Failed to get deleted patients: ${error.message}`);
  }
};

// Restore a deleted patient
export const restorePatient = async (deletedPatientId: string, userId: string): Promise<void> => {
  try {
    // Get the deleted patient data
    const { data: deletedPatient, error: fetchError } = await supabase
      .from('deleted_patients')
      .select('*')
      .eq('id', deletedPatientId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;
    if (!deletedPatient) throw new Error('Deleted patient record not found');
    if (!deletedPatient.can_restore) throw new Error('This patient cannot be restored');

    const originalPatientId = deletedPatient.original_patient_id;

    // Restore the patient
    const { error: restoreError } = await supabase
      .from('patients')
      .update({
        is_deleted: false,
        deleted_at: null,
        deleted_by: null
      })
      .eq('id', originalPatientId)
      .eq('user_id', userId);

    if (restoreError) throw restoreError;

    // Restore related records
    await Promise.all([
      supabase.from('medical_history').update({ is_deleted: false, deleted_at: null, deleted_by: null }).eq('patient_id', originalPatientId).eq('user_id', userId),
      supabase.from('medications').update({ is_deleted: false, deleted_at: null, deleted_by: null }).eq('patient_id', originalPatientId).eq('user_id', userId),
      supabase.from('allergies').update({ is_deleted: false, deleted_at: null, deleted_by: null }).eq('patient_id', originalPatientId).eq('user_id', userId),
      supabase.from('insurance_billing').update({ is_deleted: false, deleted_at: null, deleted_by: null }).eq('patient_id', originalPatientId).eq('user_id', userId),
      supabase.from('patient_documents').update({ is_deleted: false, deleted_at: null, deleted_by: null }).eq('patient_id', originalPatientId).eq('user_id', userId)
    ]);

    // Mark the deleted record as restored (can't restore again)
    const { error: markRestoredError } = await supabase
      .from('deleted_patients')
      .update({ can_restore: false })
      .eq('id', deletedPatientId);

    if (markRestoredError) throw markRestoredError;

    // Create audit log entry for restore
    await supabase
      .from('patient_audit_log')
      .insert({
        user_id: userId,
        patient_id: originalPatientId,
        table_name: 'patients',
        operation: 'RESTORE',
        new_values: { restored_from: deletedPatientId }
      });

  } catch (error: any) {
    console.error('Restore patient error:', error);
    throw new Error(`Failed to restore patient: ${error.message}`);
  }
};

// Permanently delete a patient (admin only)
export const permanentlyDeletePatient = async (patientId: string, userId: string): Promise<void> => {
  try {
    // This should only be called by authorized users
    // First delete all related records
    await Promise.all([
      supabase.from('medical_history').delete().eq('patient_id', patientId).eq('user_id', userId),
      supabase.from('medications').delete().eq('patient_id', patientId).eq('user_id', userId),
      supabase.from('allergies').delete().eq('patient_id', patientId).eq('user_id', userId),
      supabase.from('insurance_billing').delete().eq('patient_id', patientId).eq('user_id', userId),
      supabase.from('patient_documents').delete().eq('patient_id', patientId).eq('user_id', userId),
      supabase.from('appointments').delete().eq('patient_id', patientId).eq('user_id', userId)
    ]);

    // Delete the patient record
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId)
      .eq('user_id', userId);

    if (error) throw error;

    // Remove from deleted_patients table if exists
    await supabase
      .from('deleted_patients')
      .delete()
      .eq('original_patient_id', patientId)
      .eq('user_id', userId);

  } catch (error: any) {
    console.error('Permanently delete patient error:', error);
    throw new Error(`Failed to permanently delete patient: ${error.message}`);
  }
};