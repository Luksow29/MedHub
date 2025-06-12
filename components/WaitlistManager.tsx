// components/WaitlistManager.tsx - Waitlist management interface

import React, { useState, useEffect } from 'react';
import { WaitlistEntry, Patient, WaitlistStatus } from '../types';
import { 
  getAllWaitlistEntries, 
  addToWaitlist, 
  updateWaitlistEntry, 
  removeFromWaitlist,
  notifyWaitlistEntry,
  convertWaitlistToAppointment,
  updateWaitlistPriorities
} from '../api/waitlist';
import { supabase } from '../lib/supabase';
import Button from './shared/Button';
import Modal from './shared/Modal';

interface WaitlistManagerProps {
  patients: Patient[];
  onAppointmentCreated?: (appointmentId: string) => void;
}

const WaitlistManager: React.FC<WaitlistManagerProps> = ({ 
  patients, 
  onAppointmentCreated 
}) => {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // Form state for adding to waitlist
  const [formData, setFormData] = useState({
    patientId: '',
    preferredDate: '',
    preferredTime: '',
    serviceType: '',
    reason: '',
    priority: 1,
    notes: ''
  });

  // Conversion form state
  const [conversionData, setConversionData] = useState({
    appointmentDate: '',
    appointmentTime: ''
  });

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const serviceTypes = [
    { value: '', label: getBilingualLabel('Any Service', 'எந்த சேவையும்') },
    { value: 'consultation', label: getBilingualLabel('Consultation', 'ஆலோசனை') },
    { value: 'checkup', label: getBilingualLabel('Check-up', 'பரிசோதனை') },
    { value: 'follow_up', label: getBilingualLabel('Follow-up', 'பின்தொடர்தல்') },
    { value: 'procedure', label: getBilingualLabel('Procedure', 'செயல்முறை') },
    { value: 'emergency', label: getBilingualLabel('Emergency', 'அவசரம்') }
  ];

  // Fetch waitlist entries
  const fetchWaitlistEntries = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("User not authenticated");

      const { data, error } = await getAllWaitlistEntries(currentUser.data.user.id);
      if (error) throw error;

      // Map database entries to client format
      const mappedEntries = (data || []).map((entry: any) => ({
        id: entry.id,
        userId: entry.user_id,
        patientId: entry.patient_id,
        preferredDate: entry.preferred_date,
        preferredTime: entry.preferred_time,
        serviceType: entry.service_type,
        reason: entry.reason,
        priority: entry.priority,
        status: entry.status,
        notes: entry.notes,
        notifiedAt: entry.notified_at,
        expiresAt: entry.expires_at,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
        patientName: entry.patients?.name,
        patientPhone: entry.patients?.contact_phone,
        patientEmail: entry.patients?.contact_email
      }));

      setWaitlistEntries(mappedEntries);
    } catch (err: any) {
      console.error('Error fetching waitlist entries:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlistEntries();
  }, []);

  // Handle form submission for adding to waitlist
  const handleAddToWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.reason) {
      alert(getBilingualLabel("Please fill in required fields.", "தேவையான புலங்களை நிரப்பவும்."));
      return;
    }

    setIsLoading(true);

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("User not authenticated");

      const { error } = await addToWaitlist({
        patient_id: formData.patientId,
        preferred_date: formData.preferredDate || null,
        preferred_time: formData.preferredTime || null,
        service_type: formData.serviceType || null,
        reason: formData.reason,
        priority: formData.priority,
        status: 'active' as WaitlistStatus,
        notes: formData.notes || null
      }, currentUser.data.user.id);

      if (error) throw error;

      // Reset form and close modal
      setFormData({
        patientId: '',
        preferredDate: '',
        preferredTime: '',
        serviceType: '',
        reason: '',
        priority: 1,
        notes: ''
      });
      setIsAddModalOpen(false);
      fetchWaitlistEntries();
    } catch (err: any) {
      console.error('Error adding to waitlist:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle priority update
  const handlePriorityUpdate = async (entryId: string, newPriority: number) => {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("User not authenticated");

      const { error } = await updateWaitlistEntry(entryId, {
        priority: newPriority
      }, currentUser.data.user.id);

      if (error) throw error;
      fetchWaitlistEntries();
    } catch (err: any) {
      console.error('Error updating priority:', err);
      setError(err.message);
    }
  };

  // Handle notify patient
  const handleNotifyPatient = async (entryId: string) => {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("User not authenticated");

      const { error } = await notifyWaitlistEntry(entryId, currentUser.data.user.id);
      if (error) throw error;

      fetchWaitlistEntries();
      alert(getBilingualLabel("Patient notified successfully!", "நோயாளி வெற்றிகரமாக அறிவிக்கப்பட்டார்!"));
    } catch (err: any) {
      console.error('Error notifying patient:', err);
      setError(err.message);
    }
  };

  // Handle convert to appointment
  const handleConvertToAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEntry || !conversionData.appointmentDate || !conversionData.appointmentTime) {
      alert(getBilingualLabel("Please fill in appointment details.", "சந்திப்பு விவரங்களை நிரப்பவும்."));
      return;
    }

    setIsLoading(true);

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("User not authenticated");

      const { data, error } = await convertWaitlistToAppointment(
        selectedEntry.id,
        conversionData.appointmentDate,
        conversionData.appointmentTime,
        currentUser.data.user.id
      );

      if (error) throw error;

      setIsConvertModalOpen(false);
      setSelectedEntry(null);
      setConversionData({ appointmentDate: '', appointmentTime: '' });
      fetchWaitlistEntries();

      if (onAppointmentCreated && data) {
        onAppointmentCreated(data.id);
      }

      alert(getBilingualLabel("Appointment created successfully!", "சந்திப்பு வெற்றிகரமாக உருவாக்கப்பட்டது!"));
    } catch (err: any) {
      console.error('Error converting to appointment:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle remove from waitlist
  const handleRemoveFromWaitlist = async (entryId: string) => {
    if (!window.confirm(getBilingualLabel(
      "Are you sure you want to remove this entry from the waitlist?",
      "இந்த பதிவை காத்திருப்பு பட்டியலில் இருந்து நீக்க விரும்புகிறீர்களா?"
    ))) return;

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("User not authenticated");

      const { error } = await removeFromWaitlist(entryId, currentUser.data.user.id);
      if (error) throw error;

      fetchWaitlistEntries();
    } catch (err: any) {
      console.error('Error removing from waitlist:', err);
      setError(err.message);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: WaitlistStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'notified':
        return 'bg-yellow-100 text-yellow-800';
      case 'converted':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status label
  const getStatusLabel = (status: WaitlistStatus) => {
    switch (status) {
      case 'active':
        return getBilingualLabel('Active', 'செயலில்');
      case 'notified':
        return getBilingualLabel('Notified', 'அறிவிக்கப்பட்டது');
      case 'converted':
        return getBilingualLabel('Converted', 'மாற்றப்பட்டது');
      case 'cancelled':
        return getBilingualLabel('Cancelled', 'ரத்துசெய்யப்பட்டது');
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-slate-800">
          {getBilingualLabel("Waitlist Management", "காத்திருப்பு பட்டியல் மேலாண்மை")}
        </h3>
        <Button onClick={() => setIsAddModalOpen(true)} variant="primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {getBilingualLabel("Add to Waitlist", "காத்திருப்பு பட்டியலில் சேர்")}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Waitlist entries */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{getBilingualLabel("Loading waitlist...", "காத்திருப்பு பட்டியல் ஏற்றப்படுகிறது...")}</p>
        </div>
      ) : waitlistEntries.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">
            {getBilingualLabel("No waitlist entries", "காத்திருப்பு பட்டியல் பதிவுகள் இல்லை")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {getBilingualLabel("Add patients to the waitlist to get started.", "தொடங்க நோயாளிகளை காத்திருப்பு பட்டியலில் சேர்க்கவும்.")}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-slate-200">
            {waitlistEntries.map((entry) => (
              <li key={entry.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-slate-900">
                          {entry.patientName}
                        </h4>
                        <p className="text-sm text-slate-600">{entry.reason}</p>
                        {entry.serviceType && (
                          <p className="text-xs text-slate-500">
                            {getBilingualLabel("Service:", "சேவை:")} {entry.serviceType}
                          </p>
                        )}
                        {entry.preferredDate && (
                          <p className="text-xs text-slate-500">
                            {getBilingualLabel("Preferred:", "விருப்பம்:")} {entry.preferredDate} {entry.preferredTime && `at ${entry.preferredTime}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-xs text-slate-500">{getBilingualLabel("Priority", "முன்னுரிமை")}</p>
                          <select
                            value={entry.priority}
                            onChange={(e) => handlePriorityUpdate(entry.id, parseInt(e.target.value))}
                            className="text-sm border border-slate-300 rounded px-2 py-1"
                          >
                            {[1, 2, 3, 4, 5].map(priority => (
                              <option key={priority} value={priority}>{priority}</option>
                            ))}
                          </select>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(entry.status)}`}>
                          {getStatusLabel(entry.status)}
                        </span>
                      </div>
                    </div>
                    {entry.notes && (
                      <p className="mt-2 text-sm text-slate-600">{entry.notes}</p>
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="mt-4 flex space-x-3">
                  {entry.status === 'active' && (
                    <>
                      <Button
                        onClick={() => handleNotifyPatient(entry.id)}
                        variant="secondary"
                        size="sm"
                      >
                        {getBilingualLabel("Notify", "அறிவிக்கவும்")}
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedEntry(entry);
                          setIsConvertModalOpen(true);
                        }}
                        variant="primary"
                        size="sm"
                      >
                        {getBilingualLabel("Convert to Appointment", "சந்திப்பாக மாற்று")}
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => handleRemoveFromWaitlist(entry.id)}
                    variant="danger"
                    size="sm"
                  >
                    {getBilingualLabel("Remove", "நீக்கு")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add to Waitlist Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={getBilingualLabel("Add to Waitlist", "காத்திருப்பு பட்டியலில் சேர்")}
      >
        <form onSubmit={handleAddToWaitlist} className="space-y-4">
          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Patient", "நோயாளி")}
            </label>
            <select
              id="patientId"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              <option value="">{getBilingualLabel("Select a patient", "ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்")}</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="preferredDate" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Preferred Date (Optional)", "விருப்பமான தேதி (விருப்பமானது)")}
              </label>
              <input
                type="date"
                id="preferredDate"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="preferredTime" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Preferred Time (Optional)", "விருப்பமான நேரம் (விருப்பமானது)")}
              </label>
              <input
                type="time"
                id="preferredTime"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Service Type", "சேவை வகை")}
              </label>
              <select
                id="serviceType"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                {serviceTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Priority", "முன்னுரிமை")}
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                {[1, 2, 3, 4, 5].map(priority => (
                  <option key={priority} value={priority}>
                    {priority} {priority === 1 ? `(${getBilingualLabel("Highest", "மிக உயர்ந்த")})` : 
                      priority === 5 ? `(${getBilingualLabel("Lowest", "மிக குறைந்த")})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Reason", "காரணம்")}
            </label>
            <textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              required
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Notes (Optional)", "குறிப்புகள் (விருப்பமானது)")}
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              {getBilingualLabel("Cancel", "ரத்துசெய்")}
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {getBilingualLabel("Add to Waitlist", "காத்திருப்பு பட்டியலில் சேர்")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Convert to Appointment Modal */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title={getBilingualLabel("Convert to Appointment", "சந்திப்பாக மாற்று")}
      >
        {selectedEntry && (
          <form onSubmit={handleConvertToAppointment} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="font-medium text-slate-900">{selectedEntry.patientName}</h4>
              <p className="text-sm text-slate-600">{selectedEntry.reason}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="appointmentDate" className="block text-sm font-medium text-slate-700">
                  {getBilingualLabel("Appointment Date", "சந்திப்பு தேதி")}
                </label>
                <input
                  type="date"
                  id="appointmentDate"
                  value={conversionData.appointmentDate}
                  onChange={(e) => setConversionData({ ...conversionData, appointmentDate: e.target.value })}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="appointmentTime" className="block text-sm font-medium text-slate-700">
                  {getBilingualLabel("Appointment Time", "சந்திப்பு நேரம்")}
                </label>
                <input
                  type="time"
                  id="appointmentTime"
                  value={conversionData.appointmentTime}
                  onChange={(e) => setConversionData({ ...conversionData, appointmentTime: e.target.value })}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsConvertModalOpen(false)}>
                {getBilingualLabel("Cancel", "ரத்துசெய்")}
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                {getBilingualLabel("Create Appointment", "சந்திப்பை உருவாக்கு")}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default WaitlistManager;