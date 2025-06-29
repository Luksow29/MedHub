// components/AppointmentCalendar.tsx - Calendar view for appointments with drag-and-drop

import React, { useState, useEffect } from 'react';
import { Patient, Appointment, CalendarEvent } from '../types';
import Button from './shared/Button';
import Modal from './shared/Modal';
import { formatDateToInput } from '../utils/dateHelpers';

// API functions
import * as AppointmentAPI from '../api/appointments';
import * as TimeSlotAPI from '../api/timeSlots';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  patients: Patient[];
  userId: string;
  onAppointmentUpdate?: () => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  appointments: Appointment[];
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  patients,
  userId,
  onAppointmentUpdate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const currentDateObj = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const dateStr = formatDateToInput(currentDateObj);
      const dayAppointments = appointments.filter(apt => apt.date === dateStr);
      
      days.push({
        date: new Date(currentDateObj),
        isCurrentMonth: currentDateObj.getMonth() === month,
        appointments: dayAppointments
      });
      
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    return days;
  };

  const getWeekDays = (): CalendarDay[] => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days: CalendarDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = formatDateToInput(date);
      const dayAppointments = appointments.filter(apt => apt.date === dateStr);
      
      days.push({
        date,
        isCurrentMonth: true,
        appointments: dayAppointments
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    const dateStr = formatDateToInput(date);
    
    try {
      setIsLoading(true);
      const { data, error } = await TimeSlotAPI.getAvailableTimeSlotsForDate(userId, dateStr, 30);
      if (error) throw error;
      setAvailableSlots(data || []);
    } catch (err: any) {
      console.error('Fetch available slots error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsRescheduleModalOpen(true);
  };

  const handleReschedule = async (newDate: string, newTime: string) => {
    if (!selectedAppointment) return;

    try {
      setIsLoading(true);
      
      // Check for conflicts
      const { data: conflicts, error: conflictError } = await AppointmentAPI.checkAppointmentConflicts(
        userId,
        newDate,
        newTime,
        selectedAppointment.duration,
        selectedAppointment.id
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

      // Update appointment
      const { error: updateError } = await AppointmentAPI.updateAppointment(
        selectedAppointment.id,
        {
          date: newDate,
          time: newTime,
          status: 'rescheduled'
        },
        userId
      );

      if (updateError) throw updateError;

      setIsRescheduleModalOpen(false);
      setSelectedAppointment(null);
      if (onAppointmentUpdate) onAppointmentUpdate();
      
      alert(getBilingualLabel('Appointment rescheduled successfully!', 'சந்திப்பு வெற்றிகரமாக மாற்றப்பட்டது!'));
    } catch (err: any) {
      console.error('Reschedule appointment error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    const statusColors = {
      'scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
      'confirmed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'completed': 'bg-gray-100 text-gray-800 border-gray-200',
      'no_show': 'bg-orange-100 text-orange-800 border-orange-200',
      'rescheduled': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return statusColors[status as keyof typeof statusColors] || statusColors.scheduled;
  };

  const renderMonthView = () => {
    const days = generateCalendarDays();
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center font-medium text-slate-600 bg-slate-50">
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <div
            key={index}
            className={`min-h-24 p-1 border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ${
              !day.isCurrentMonth ? 'bg-slate-100 text-slate-400' : 'bg-white'
            } ${
              day.date.toDateString() === new Date().toDateString() ? 'bg-sky-50 border-sky-200' : ''
            }`}
            onClick={() => handleDateClick(day.date)}
          >
            <div className="text-sm font-medium mb-1">
              {day.date.getDate()}
            </div>
            <div className="space-y-1">
              {day.appointments.slice(0, 2).map(appointment => (
                <div
                  key={appointment.id}
                  className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getAppointmentStatusColor(appointment.status)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAppointmentClick(appointment);
                  }}
                >
                  <div className="font-medium truncate">{appointment.time}</div>
                  <div className="truncate">{appointment.patientName}</div>
                </div>
              ))}
              {day.appointments.length > 2 && (
                <div className="text-xs text-slate-500 text-center">
                  +{day.appointments.length - 2} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays();
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
            <div className={`p-3 text-center font-medium ${
              day.date.toDateString() === new Date().toDateString() 
                ? 'bg-sky-100 text-sky-800' 
                : 'bg-slate-50 text-slate-600'
            }`}>
              <div className="text-sm">{dayNames[day.date.getDay()]}</div>
              <div className="text-lg">{day.date.getDate()}</div>
            </div>
            <div className="p-2 space-y-2 min-h-32">
              {day.appointments.map(appointment => (
                <div
                  key={appointment.id}
                  className={`text-xs p-2 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getAppointmentStatusColor(appointment.status)}`}
                  onClick={() => handleAppointmentClick(appointment)}
                >
                  <div className="font-medium">{appointment.time}</div>
                  <div className="truncate">{appointment.patientName}</div>
                  <div className="truncate text-slate-600">{appointment.reason}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    const dateStr = formatDateToInput(currentDate);
    const dayAppointments = appointments.filter(apt => apt.date === dateStr);
    
    // Generate time slots from 8 AM to 6 PM
    const timeSlots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const appointment = dayAppointments.find(apt => apt.time === time);
        timeSlots.push({ time, appointment });
      }
    }
    
    return (
      <div className="space-y-1">
        <div className="text-center py-4 bg-slate-50 rounded-lg">
          <h3 className="text-lg font-medium text-slate-900">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {timeSlots.map(({ time, appointment }) => (
            <div
              key={time}
              className={`flex items-center p-3 border border-slate-200 rounded ${
                appointment ? 'bg-white' : 'bg-slate-50'
              }`}
            >
              <div className="w-20 text-sm font-medium text-slate-600">
                {time}
              </div>
              <div className="flex-1 ml-4">
                {appointment ? (
                  <div
                    className={`p-3 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getAppointmentStatusColor(appointment.status)}`}
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    <div className="font-medium">{appointment.patientName}</div>
                    <div className="text-sm text-slate-600">{appointment.reason}</div>
                    <div className="text-xs text-slate-500">
                      {appointment.duration} minutes • {appointment.status}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic">
                    {getBilingualLabel("Available", "கிடைக்கிறது")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold text-sky-700">
              {getBilingualLabel("Appointment Calendar", "சந்திப்பு நாட்காட்டி")}
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  if (viewMode === 'month') navigateMonth('prev');
                  else if (viewMode === 'week') navigateWeek('prev');
                  else navigateDay('prev');
                }}
                variant="secondary"
                size="sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <span className="text-lg font-medium text-slate-900 min-w-48 text-center">
                {viewMode === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                {viewMode === 'week' && `Week of ${currentDate.toLocaleDateString()}`}
                {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <Button
                onClick={() => {
                  if (viewMode === 'month') navigateMonth('next');
                  else if (viewMode === 'week') navigateWeek('next');
                  else navigateDay('next');
                }}
                variant="secondary"
                size="sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  viewMode === 'month' 
                    ? 'bg-white text-sky-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {getBilingualLabel("Month", "மாதம்")}
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  viewMode === 'week' 
                    ? 'bg-white text-sky-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {getBilingualLabel("Week", "வாரம்")}
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  viewMode === 'day' 
                    ? 'bg-white text-sky-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {getBilingualLabel("Day", "நாள்")}
              </button>
            </div>
            <Button
              onClick={() => setCurrentDate(new Date())}
              variant="secondary"
              size="sm"
            >
              {getBilingualLabel("Today", "இன்று")}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Calendar Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>
      </div>

      {/* Reschedule Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={isRescheduleModalOpen}
          onClose={() => {
            setIsRescheduleModalOpen(false);
            setSelectedAppointment(null);
          }}
          title={getBilingualLabel("Reschedule Appointment", "சந்திப்பை மாற்றியமைக்கவும்")}
        >
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium text-slate-900 mb-2">
                {getBilingualLabel("Current Appointment", "தற்போதைய சந்திப்பு")}
              </h4>
              <p><strong>{getBilingualLabel("Patient", "நோயாளி")}:</strong> {selectedAppointment.patientName}</p>
              <p><strong>{getBilingualLabel("Date", "தேதி")}:</strong> {selectedAppointment.date}</p>
              <p><strong>{getBilingualLabel("Time", "நேரம்")}:</strong> {selectedAppointment.time}</p>
              <p><strong>{getBilingualLabel("Reason", "காரணம்")}:</strong> {selectedAppointment.reason}</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newDate = formData.get('newDate') as string;
                const newTime = formData.get('newTime') as string;
                handleReschedule(newDate, newTime);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newDate" className="block text-sm font-medium text-slate-700">
                    {getBilingualLabel("New Date", "புதிய தேதி")}
                  </label>
                  <input
                    type="date"
                    id="newDate"
                    name="newDate"
                    defaultValue={selectedAppointment.date}
                    min={formatDateToInput(new Date())}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label htmlFor="newTime" className="block text-sm font-medium text-slate-700">
                    {getBilingualLabel("New Time", "புதிய நேரம்")}
                  </label>
                  <input
                    type="time"
                    id="newTime"
                    name="newTime"
                    defaultValue={selectedAppointment.time}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsRescheduleModalOpen(false);
                    setSelectedAppointment(null);
                  }}
                  disabled={isLoading}
                >
                  {getBilingualLabel("Cancel", "ரத்துசெய்")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                >
                  {getBilingualLabel("Reschedule", "மாற்றியமைக்கவும்")}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AppointmentCalendar;