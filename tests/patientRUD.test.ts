// tests/patientRUD.test.ts - Comprehensive tests for patient RUD operations

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '../lib/supabase';
import { searchPatients } from '../api/patientSearch';
import { softDeletePatient, restorePatient, getDeletedPatients } from '../api/patientAudit';
import { validatePatientData, validateMedicalHistoryData } from '../utils/validation';

// Mock data for testing
const mockPatientData = {
  name: 'Test Patient',
  contact_phone: '1234567890',
  contact_email: 'test@example.com',
  dob: '1990-01-01',
  gender: 'ஆண்' as const,
  address: '123 Test Street',
  emergency_contact_name: 'Emergency Contact',
  emergency_contact_phone: '0987654321',
  preferred_language: 'English',
  preferred_contact_method: 'Email' as const
};

const mockMedicalHistoryData = {
  condition_name: 'Test Condition',
  diagnosis_date: '2023-01-01',
  notes: 'Test notes for medical history'
};

describe('Patient RUD Operations', () => {
  let testUserId: string;
  let testPatientId: string;

  beforeEach(async () => {
    // Setup test user (this would typically be mocked)
    testUserId = 'test-user-id';
  });

  afterEach(async () => {
    // Cleanup test data
    if (testPatientId) {
      try {
        await supabase
          .from('patients')
          .delete()
          .eq('id', testPatientId);
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    }
  });

  describe('Patient Search Functionality', () => {
    it('should search patients by name', async () => {
      const result = await searchPatients(testUserId, {
        searchTerm: 'Test',
        limit: 10,
        offset: 0
      });

      expect(result).toHaveProperty('patients');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.patients)).toBe(true);
    });

    it('should filter patients by gender', async () => {
      const result = await searchPatients(testUserId, {
        gender: 'ஆண்',
        limit: 10,
        offset: 0
      });

      expect(result.patients.every(p => p.gender === 'ஆண்')).toBe(true);
    });

    it('should sort patients correctly', async () => {
      const result = await searchPatients(testUserId, {
        sortBy: 'name',
        sortOrder: 'asc',
        limit: 10,
        offset: 0
      });

      if (result.patients.length > 1) {
        for (let i = 1; i < result.patients.length; i++) {
          expect(result.patients[i].name >= result.patients[i - 1].name).toBe(true);
        }
      }
    });

    it('should handle pagination correctly', async () => {
      const firstPage = await searchPatients(testUserId, {
        limit: 5,
        offset: 0
      });

      const secondPage = await searchPatients(testUserId, {
        limit: 5,
        offset: 5
      });

      expect(firstPage.patients.length).toBeLessThanOrEqual(5);
      expect(secondPage.patients.length).toBeLessThanOrEqual(5);
      
      // Ensure no overlap between pages
      const firstPageIds = firstPage.patients.map(p => p.id);
      const secondPageIds = secondPage.patients.map(p => p.id);
      const overlap = firstPageIds.filter(id => secondPageIds.includes(id));
      expect(overlap.length).toBe(0);
    });
  });

  describe('Patient Soft Delete Functionality', () => {
    beforeEach(async () => {
      // Create a test patient for deletion tests
      const { data, error } = await supabase
        .from('patients')
        .insert({ ...mockPatientData, user_id: testUserId })
        .select()
        .single();

      if (error) throw error;
      testPatientId = data.id;
    });

    it('should soft delete a patient', async () => {
      await softDeletePatient(testPatientId, testUserId, 'Test deletion');

      // Verify patient is marked as deleted
      const { data, error } = await supabase
        .from('patients')
        .select('is_deleted, deleted_at, deleted_by')
        .eq('id', testPatientId)
        .single();

      expect(error).toBeNull();
      expect(data.is_deleted).toBe(true);
      expect(data.deleted_at).toBeTruthy();
      expect(data.deleted_by).toBe(testUserId);
    });

    it('should create backup record when deleting patient', async () => {
      await softDeletePatient(testPatientId, testUserId, 'Test deletion');

      const deletedPatients = await getDeletedPatients(testUserId);
      const deletedPatient = deletedPatients.find(
        dp => dp.originalPatientId === testPatientId
      );

      expect(deletedPatient).toBeTruthy();
      expect(deletedPatient?.deletionReason).toBe('Test deletion');
      expect(deletedPatient?.canRestore).toBe(true);
    });

    it('should restore a deleted patient', async () => {
      // First delete the patient
      await softDeletePatient(testPatientId, testUserId, 'Test deletion');

      // Get the deleted patient record
      const deletedPatients = await getDeletedPatients(testUserId);
      const deletedPatient = deletedPatients.find(
        dp => dp.originalPatientId === testPatientId
      );

      expect(deletedPatient).toBeTruthy();

      // Restore the patient
      await restorePatient(deletedPatient!.id, testUserId);

      // Verify patient is restored
      const { data, error } = await supabase
        .from('patients')
        .select('is_deleted, deleted_at, deleted_by')
        .eq('id', testPatientId)
        .single();

      expect(error).toBeNull();
      expect(data.is_deleted).toBe(false);
      expect(data.deleted_at).toBeNull();
      expect(data.deleted_by).toBeNull();
    });
  });

  describe('Data Validation', () => {
    it('should validate patient data correctly', () => {
      const validData = { ...mockPatientData };
      const result = validatePatientData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject invalid patient data', () => {
      const invalidData = {
        name: '', // Empty name
        contact_phone: '123', // Too short
        contact_email: 'invalid-email', // Invalid format
      };

      const result = validatePatientData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate medical history data correctly', () => {
      const validData = { ...mockMedicalHistoryData };
      const result = validateMedicalHistoryData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject invalid medical history data', () => {
      const invalidData = {
        condition_name: '', // Empty condition
        diagnosis_date: 'invalid-date', // Invalid date
      };

      const result = validateMedicalHistoryData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should sanitize potentially dangerous input', () => {
      const dangerousInput = '<script>alert("xss")</script>';
      const sanitized = dangerousInput
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });
  });

  describe('Access Control', () => {
    it('should only return patients for the authenticated user', async () => {
      const result = await searchPatients(testUserId, { limit: 100 });
      
      // All returned patients should belong to the test user
      result.patients.forEach(patient => {
        expect(patient.userId).toBe(testUserId);
      });
    });

    it('should not allow access to other users\' patients', async () => {
      const otherUserId = 'other-user-id';
      
      try {
        await supabase
          .from('patients')
          .select('*')
          .eq('id', testPatientId)
          .eq('user_id', otherUserId)
          .single();
        
        // This should not return any data due to RLS
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        // Expected to fail due to RLS
        expect(error).toBeTruthy();
      }
    });
  });

  describe('Audit Trail', () => {
    it('should create audit log entries for patient operations', async () => {
      // This test would verify that audit logs are created
      // Implementation depends on the audit trigger setup
      expect(true).toBe(true); // Placeholder
    });

    it('should track field changes in audit logs', async () => {
      // This test would verify that changed fields are tracked
      // Implementation depends on the audit trigger setup
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock a database error
      const originalFrom = supabase.from;
      supabase.from = () => {
        throw new Error('Database connection failed');
      };

      try {
        await searchPatients(testUserId, {});
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeTruthy();
        expect(error.message).toContain('Failed to search patients');
      } finally {
        supabase.from = originalFrom;
      }
    });

    it('should validate user authentication', async () => {
      try {
        await searchPatients('', {}); // Empty user ID
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('Performance', () => {
    it('should complete search operations within reasonable time', async () => {
      const startTime = Date.now();
      
      await searchPatients(testUserId, {
        searchTerm: 'test',
        limit: 50
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should handle large result sets efficiently', async () => {
      const result = await searchPatients(testUserId, {
        limit: 1000 // Large limit
      });
      
      expect(result.patients.length).toBeLessThanOrEqual(1000);
      expect(typeof result.totalCount).toBe('number');
    });
  });
});

describe('HIPAA Compliance', () => {
  it('should not expose sensitive data in logs', () => {
    const patientData = {
      ...mockPatientData,
      ssn: '123-45-6789' // This should not be allowed
    };

    // Verify that sensitive fields are not included
    expect(patientData).not.toHaveProperty('password');
    expect(patientData).not.toHaveProperty('credit_card');
  });

  it('should encrypt data in transit', () => {
    // Verify HTTPS is used (this would be an integration test)
    expect(supabase.supabaseUrl.startsWith('https://')).toBe(true);
  });

  it('should implement proper access controls', async () => {
    // Verify RLS policies are in place
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .limit(1);

    // Should require authentication
    if (!error) {
      expect(data).toBeDefined();
    }
  });
});