// components/WaitlistManager.tsx - Comprehensive waitlist management component

import React, { useState, useEffect } from 'react';
import { Patient, WaitlistEntry, NewDbWaitlistEntry, WaitlistStatus, ReminderMethod } from '../types';
import Button from './shared/Button';
import Modal from './shared/Modal';
import { formatDateToInput, formatTimeToInput } from '../utils/dateHelpers';

// API functions
import * as WaitlistAPI from '../api/waitlist';
import * as AppointmentAPI from '../api/appointments';

interface WaitlistManagerProps {
  patients: Patient[];
  userId: string;
  onWaitlistUpdate?: () => void;
}

interface WaitlistFormData {
  patientId: string;
  preferredDate: string;
  preferredTime: string;
  serviceType: string;
  reason: string;
  priority: number;
  notes: string;
}

const WaitlistManager: React.FC<WaitlistManagerProps> = ({
  patients,
  userId,
  onWaitlistUpdate
}) => {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<WaitlistStatus | 'all'>('all');
  const [statistics, setStatistics] = useState({
    active: 0,
    notified: 0,
    converted: 0,
    total: 0
  });

  const [formData, setFormData] = useState<WaitlistFormData>({
    patientId: '',
    preferredDate: '',
    preferredTime: '',
    serviceType: '',
    reason: '',
    priority: 1,
    notes: ''
  });

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const serviceTypes = [
    { value: '', label: getBilingualLabel('Any Service', 'எந்த சேவையும்') },
    { value: 'consultation', label: getBilingualLabel('Consultation', 'ஆலோசனை') },
    { value: 'checkup', label: getBilingualLabel('Check-up', 'பரிசோதனை') },
    { value: 'follow_up', label: getBilingualLabel('Follow-up', 'பின்தொடர்தல்') },
    { value: 'treatment', label: getBilingualLabel('Treatment', 'சிகிச்சை') },
    { value: 'emergency', label: getBilingualLabel('Emergency', 'அவசரம்') }
  ];

  const priorityOptions = [
    { value: 1, label: getBilingualLabel('Low', 'குறைந்த') },
    { value: 2, label: getBilingualLabel('Normal', 'சாதாரண') },
    { value: 3, label: getBilingualLabel('High', 'உயர்ந்த') },
    { value: 4, label: getBilingualLabel('Urgent', 'அவசர') }
  ];

  const mapDbWaitlistToClient = (dbEntry: any): WaitlistEntry => ({
    id: dbEntry.id,
    userId: dbEntry.user_id,
    patientId: dbEntry.patient_id,
    preferredDate: dbEntry.preferred_date,
    preferredTime: dbEntry.preferred_time,
    serviceType: dbEntry.service_type,
    reason: dbEntry.reason,
    priority: dbEntry.priority,
    status: dbEntry.status,
    notes: dbEntry.notes,
    notifiedAt: dbEntry.notified_at,
    expiresAt: dbEntry.expires_at,
    createdAt: dbEntry.created_at,
    updatedAt: dbEntry.updated_at,
    patientName: dbEntry.patients?.name,
    patientPhone: dbEntry.patients?.contact_phone,
    patientEmail: dbEntry.patients?.contact_email,
    patientPreferredContactMethod: dbEntry.patients?.preferred_contact_method
  });

  const fetchWaitlistEntries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = selectedStatus === 'all' 
        ? await WaitlistAPI.getWaitlistEntries(userId)
        : await WaitlistAPI.getWaitlistEntriesByStatus(userId, selectedStatus);

      if (error) throw error;
      setWaitlistEntries(data.map(mapDbWaitlistToClient));

      // Fetch statistics
      const stats = await WaitlistAPI.getWaitlistStatistics(userId);
      setStatistics(stats);
    } catch (err: any) {
      console.error('Fetch waitlist error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlistEntries();
  }, [userId, selectedStatus]);

  const handleAddToWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const waitlistData: NewDbWaitlistEntry = {
        patient_id: formData.patientId,
        preferred_date: formData.preferredDate || null,
        preferred_time: formData.preferredTime || null,
        service_type: formData.serviceType || null,
        reason: formData.reason,
        priority: formData.priority,
        status: WaitlistStatus.ACTIVE,
        notes: formData.notes || null
      };

      const { error } = await WaitlistAPI.addWaitlistEntry(waitlistData, userId);
      if (error) throw error;

      setIsAddModalOpen(false);
      setFormData({
        patientId: '',
        preferredDate: '',
        preferredTime: '',
        serviceType: '',
        reason: '',
        priority: 1,
        notes: ''
      });
      fetchWaitlistEntries();
      if (onWaitlistUpdate) onWaitlistUpdate();
    } catch (err: any) {
      console.error('Add waitlist entry error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotifyPatient = async (entryId: string) => {
    try {
      const { error } = await WaitlistAPI.notifyWaitlistEntry(entryId, userId);
      if (error) throw error;
      fetchWaitlistEntries();
    } catch (err: any) {
      console.error('Notify patient error:', err);
      setError(err.message);
    }
  };

  const handleConvertToAppointment = async (entry: WaitlistEntry) => {
    if (!entry.preferredDate || !entry.preferredTime) {
      alert(getBilingualLabel('Please set preferred date and time first', 'முதலில் விருப்பமான தேதி மற்றும் நேரத்தை அமைக்கவும்'));
      return;
    }

    try {
      // Check for conflicts first - fix argument order
      const { data: conflicts, error: conflictError } = await AppointmentAPI.checkAppointmentConflicts(
        userId,
        entry.preferredDate,
        entry.preferredTime,
        30 // Default 30 minutes
      );

      if (conflictError) throw conflictError;

      if (conflicts && conflicts.length > 0) {
        const confirmOverride = window.confirm(
          getBilingualLabel(
            'There are conflicts with this time slot. Do you want to proceed anyway?',
            'இந்த நேர இடைவெளியில் முரண்பாடுகள் உள்ளன. எப்படியும் தொடர விரும்புகிறீர்களா?'
          )
        );
        if (!confirmOverride) return;
      }

      // Create appointment
      const appointmentData = {
        patient_id: entry.patientId,
        date: entry.preferredDate,
        time: entry.preferredTime,
        duration: 30,
        reason: entry.reason,
        service_type: entry.serviceType,
        status: 'scheduled' as const,
        notes: entry.notes
      };

      const { error: appointmentError } = await AppointmentAPI.createAppointment(appointmentData, userId);
      if (appointmentError) throw appointmentError;

      // Mark waitlist entry as converted
      const { error: convertError } = await WaitlistAPI.convertWaitlistToAppointment(entry.id, userId);
      if (convertError) throw convertError;

      fetchWaitlistEntries();
      if (onWaitlistUpdate) onWaitlistUpdate();
      
      alert(getBilingualLabel('Successfully converted to appointment!', 'வெற்றிகரமாக சந்திப்பாக மாற்றப்பட்டது!'));
    } catch (err: any) {
      console.error('Convert to appointment error:', err);
      setError(err.message);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const confirmDelete = window.confirm(
      getBilingualLabel('Are you sure you want to delete this waitlist entry?', 'இந்த காத்திருப்பு பட்டியல் உள்ளீட்டை நீக்க விரும்புகிறீர்களா?')
    );

    if (!confirmDelete) return;

    try {
      const { error } = await WaitlistAPI.deleteWaitlistEntry(entryId, userId);
      if (error) throw error;
      fetchWaitlistEntries();
    } catch (err: any) {
      console.error('Delete waitlist entry error:', err);
      setError(err.message);
    }
  };

  const getStatusBadge = (status: WaitlistStatus) => {
    const statusConfig = {
      [WaitlistStatus.ACTIVE]: { color: 'bg-blue-100 text-blue-800', label: getBilingualLabel('Active', 'செயலில்') },
      [WaitlistStatus.NOTIFIED]: { color: 'bg-yellow-100 text-yellow-800', label: getBilingualLabel('Notified', 'அறிவிக்கப்பட்டது') },
      [WaitlistStatus.CONVERTED]: { color: 'bg-green-100 text-green-800', label: getBilingualLabel('Converted', 'மாற்றப்பட்டது') },
      [WaitlistStatus.CANCELLED]: { color: 'bg-red-100 text-red-800', label: getBilingualLabel('Cancelled', 'ரத்துசெய்யப்பட்டது') }
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: number) => {
    const priorityConfig = {
      1: { color: 'bg-gray-100 text-gray-800', label: getBilingualLabel('Low', 'குறைந்த') },
      2: { color: 'bg-blue-100 text-blue-800', label: getBilingualLabel('Normal', 'சாதாரண') },
      3: { color: 'bg-orange-100 text-orange-800', label: getBilingualLabel('High', 'உயர்ந்த') },
      4: { color: 'bg-red-100 text-red-800', label: getBilingualLabel('Urgent', 'அவசர') }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig[2];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sky-700">
            {getBilingualLabel("Waitlist Management", "காத்திருப்பு பட்டியல் நிர்வாகம்")}
          </h3>
          <Button onClick={() => setIsAddModalOpen(true)} variant="primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {getBilingualLabel("Add to Waitlist", "காத்திருப்பு பட்டியலில் சேர்")}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{statistics.active}</p>
            <p className="text-sm text-slate-600">{getBilingualLabel("Active", "செயலில்")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{statistics.notified}</p>
            <p className="text-sm text-slate-600">{getBilingualLabel("Notified", "அறிவிக்கப்பட்டது")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{statistics.converted}</p>
            <p className="text-sm text-slate-600">{getBilingualLabel("Converted", "மாற்றப்பட்டது")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-600">{statistics.total}</p>
            <p className="text-sm text-slate-600">{getBilingualLabel("Total", "மொத்தம்")}</p>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-slate-700 mb-1">
              {getBilingualLabel("Filter by Status", "நிலை மூலம் வடிகட்டு")}
            </label>
            <select
              id="statusFilter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as WaitlistStatus | 'all')}
              className="px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="all">{getBilingualLabel("All Status", "அனைத்து நிலைகள்")}</option>
              <option value={WaitlistStatus.ACTIVE}>{getBilingualLabel("Active", "செயலில்")}</option>
              <option value={WaitlistStatus.NOTIFIED}>{getBilingualLabel("Notified", "அறிவிக்கப்பட்டது")}</option>
              <option value={WaitlistStatus.CONVERTED}>{getBilingualLabel("Converted", "மாற்றப்பட்டது")}</option>
              <option value={WaitlistStatus.CANCELLED}>{getBilingualLabel("Cancelled", "ரத்துசெய்யப்பட்டது")}</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <Button onClick={fetchWaitlistEntries} variant="secondary" isLoading={isLoading}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {getBilingualLabel("Refresh", "புதுப்பிக்கவும்")}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Waitlist Entries */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-slate-600">{getBilingualLabel("Loading waitlist...", "காத்திருப்பு பட்டியல் ஏற்றப்படுகிறது...")}</p>
          </div>
        ) : waitlistEntries.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">
              {getBilingualLabel("No waitlist entries", "காத்திருப்பு பட்டியல் உள்ளீடுகள் இல்லை")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {getBilingualLabel("Get started by adding a patient to the waitlist", "காத்திருப்பு பட்டியலில் ஒரு நோயாளியைச் சேர்ப்பதன் மூலம் தொடங்கவும்")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {waitlistEntries.map((entry) => (
              <div key={entry.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h4 className="text-lg font-medium text-slate-900">{entry.patientName}</h4>
                      {getStatusBadge(entry.status)}
                      {getPriorityBadge(entry.priority)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <p><strong>{getBilingualLabel("Reason", "காரணம்")}:</strong> {entry.reason}</p>
                        {entry.serviceType && (
                          <p><strong>{getBilingualLabel("Service", "சேவை")}:</strong> {entry.serviceType}</p>
                        )}
                        {entry.preferredDate && (
                          <p><strong>{getBilingualLabel("Preferred Date", "விருப்பமான தேதி")}:</strong> {entry.preferredDate}</p>
                        )}
                        {entry.preferredTime && (
                          <p><strong>{getBilingualLabel("Preferred Time", "விருப்பமான நேரம்")}:</strong> {entry.preferredTime}</p>
                        )}
                      </div>
                      <div>
                        <p><strong>{getBilingualLabel("Phone", "தொலைபேசி")}:</strong> {entry.patientPhone}</p>
                        {entry.patientEmail && (
                          <p><strong>{getBilingualLabel("Email", "மின்னஞ்சல்")}:</strong> {entry.patientEmail}</p>
                        )}
                        <p><strong>{getBilingualLabel("Added", "சேர்க்கப்பட்டது")}:</strong> {new Date(entry.createdAt).toLocaleDateString()}</p>
                        {entry.notifiedAt && (
                          <p><strong>{getBilingualLabel("Notified", "அறிவிக்கப்பட்டது")}:</strong> {new Date(entry.notifiedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    {entry.notes && (
                      <p className="mt-2 text-sm text-slate-600">
                        <strong>{getBilingualLabel("Notes", "குறிப்புகள்")}:</strong> {entry.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    {entry.status === WaitlistStatus.ACTIVE && (
                      <>
                        <Button
                          onClick={() => handleNotifyPatient(entry.id)}
                          variant="primary"
                          size="sm"
                        >
                          {getBilingualLabel("Notify", "அறிவிக்கவும்")}
                        </Button>
                        {entry.preferredDate && entry.preferredTime && (
                          <Button
                            onClick={() => handleConvertToAppointment(entry)}
                            variant="success"
                            size="sm"
                          >
                            {getBilingualLabel("Convert", "மாற்று")}
                          </Button>
                        )}
                      </>
                    )}
                    {entry.status === WaitlistStatus.NOTIFIED && entry.preferredDate && entry.preferredTime && (
                      <Button
                        onClick={() => handleConvertToAppointment(entry)}
                        variant="success"
                        size="sm"
                      >
                        {getBilingualLabel("Convert", "மாற்று")}
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDeleteEntry(entry.id)}
                      variant="danger"
                      size="sm"
                    >
                      {getBilingualLabel("Delete", "நீக்கு")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add to Waitlist Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={getBilingualLabel("Add to Waitlist", "காத்திருப்பு பட்டியலில் சேர்")}
      >
        <form onSubmit={handleAddToWaitlist} className="space-y-4">
          <div>
            <label htmlFor="patient" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Patient", "நோயாளி")}
            </label>
            <select
              id="patient"
              value={formData.patientId}
              onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
              required
              className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
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
                onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                min={formatDateToInput(new Date())}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
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
                onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
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
                onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
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
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Reason", "காரணம்")}
            </label>
            <input
              type="text"
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              required
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Notes (Optional)", "குறிப்புகள் (விருப்பமானது)")}
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isLoading}
            >
              {getBilingualLabel("Cancel", "ரத்துசெய்")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={patients.length === 0}
            >
              {getBilingualLabel("Add to Waitlist", "காத்திருப்பு பட்டியலில் சேர்")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WaitlistManager;