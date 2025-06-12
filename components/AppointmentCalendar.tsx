// components/AppointmentCalendar.tsx - Calendar interface for appointment scheduling

import React, { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, Appointment, Patient, AppointmentStatus } from '../types';
import { getCalendarAppointments } from '../api/appointments';
import { supabase } from '../lib/supabase';
import Button from './shared/Button';

interface AppointmentCalendarProps {
  onAppointmentSelect?: (appointment: Appointment) => void;
  onTimeSlotSelect?: (date: string, time: string) => void;
  patients: Patient[];
  selectedDate?: string;
}

type CalendarView = 'month' | 'week' | 'day';

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  onAppointmentSelect,
  onTimeSlotSelect,
  patients,
  selectedDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate || new Date()));
  const [view, setView] = useState<CalendarView>('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // Generate time slots for day/week view
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  // Get date range for current view
  const getDateRange = useCallback(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (view) {
      case 'day':
        break;
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }, [currentDate, view]);

  // Fetch appointments for current view
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) throw new Error("User not authenticated");

      const { start, end } = getDateRange();
      const { data, error } = await getCalendarAppointments(
        currentUser.data.user.id,
        start,
        end
      );

      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for a specific date and time
  const getEventsForSlot = (date: string, time: string) => {
    return events.filter(event => {
      const eventDate = event.start.toISOString().split('T')[0];
      const eventTime = event.start.toTimeString().slice(0, 5);
      return eventDate === date && eventTime === time;
    });
  };

  // Check if a time slot is available
  const isTimeSlotAvailable = (date: string, time: string) => {
    const slotEvents = getEventsForSlot(date, time);
    return slotEvents.length === 0;
  };

  // Handle time slot click
  const handleTimeSlotClick = (date: string, time: string) => {
    if (isTimeSlotAvailable(date, time) && onTimeSlotSelect) {
      onTimeSlotSelect(date, time);
    }
  };

  // Handle appointment click
  const handleAppointmentClick = (event: CalendarEvent) => {
    if (onAppointmentSelect && event.resource) {
      onAppointmentSelect(event.resource);
    }
  };

  // Get status color class
  const getStatusColorClass = (status: AppointmentStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Format date for display
  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Render day view
  const renderDayView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const timeSlots = generateTimeSlots();

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {formatDateForDisplay(currentDate)}
          </h3>
        </div>
        <div className="divide-y divide-slate-200">
          {timeSlots.map((time) => {
            const slotEvents = getEventsForSlot(dateStr, time);
            const isAvailable = slotEvents.length === 0;

            return (
              <div
                key={time}
                className={`p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                  !isAvailable ? 'bg-slate-50' : ''
                }`}
                onClick={() => handleTimeSlotClick(dateStr, time)}
              >
                <div className="text-sm font-medium text-slate-600">{time}</div>
                <div className="flex-1 ml-4">
                  {slotEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`inline-block px-2 py-1 rounded text-xs border mr-2 cursor-pointer ${getStatusColorClass(
                        event.resource?.status || 'scheduled'
                      )}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(event);
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {isAvailable && (
                    <span className="text-xs text-slate-400">
                      {getBilingualLabel("Available", "கிடைக்கும்")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      weekDays.push(day);
    }

    const timeSlots = generateTimeSlots();

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Week header */}
        <div className="grid grid-cols-8 border-b border-slate-200">
          <div className="p-3 text-sm font-medium text-slate-600">
            {getBilingualLabel("Time", "நேரம்")}
          </div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="p-3 text-center border-l border-slate-200">
              <div className="text-sm font-medium text-slate-900">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-xs text-slate-600">
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="max-h-96 overflow-y-auto">
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 border-b border-slate-100">
              <div className="p-2 text-xs text-slate-600 border-r border-slate-200">
                {time}
              </div>
              {weekDays.map((day) => {
                const dateStr = day.toISOString().split('T')[0];
                const slotEvents = getEventsForSlot(dateStr, time);
                const isAvailable = slotEvents.length === 0;

                return (
                  <div
                    key={`${dateStr}-${time}`}
                    className={`p-1 border-l border-slate-100 min-h-[2rem] cursor-pointer hover:bg-slate-50 ${
                      !isAvailable ? 'bg-slate-50' : ''
                    }`}
                    onClick={() => handleTimeSlotClick(dateStr, time)}
                  >
                    {slotEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs px-1 py-0.5 rounded border mb-1 cursor-pointer ${getStatusColorClass(
                          event.resource?.status || 'scheduled'
                        )}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAppointmentClick(event);
                        }}
                        title={event.title}
                      >
                        {event.title.length > 15 ? `${event.title.slice(0, 15)}...` : event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startOfCalendar = new Date(startOfMonth);
    startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay());

    const calendarDays = [];
    const current = new Date(startOfCalendar);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      calendarDays.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Month header */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-slate-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dateStr = day.toISOString().split('T')[0];
            const dayEvents = events.filter(event => 
              event.start.toISOString().split('T')[0] === dateStr
            );
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={dateStr}
                className={`min-h-[6rem] p-2 border-b border-r border-slate-100 cursor-pointer hover:bg-slate-50 ${
                  !isCurrentMonth ? 'bg-slate-50 text-slate-400' : ''
                } ${isToday ? 'bg-sky-50' : ''}`}
                onClick={() => {
                  setCurrentDate(day);
                  setView('day');
                }}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-sky-600' : ''}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs px-1 py-0.5 rounded border cursor-pointer ${getStatusColorClass(
                        event.resource?.status || 'scheduled'
                      )}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(event);
                      }}
                      title={event.title}
                    >
                      {event.title.length > 12 ? `${event.title.slice(0, 12)}...` : event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-slate-500">
                      +{dayEvents.length - 3} {getBilingualLabel("more", "மேலும்")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{getBilingualLabel("Error loading calendar:", "காலெண்டரை ஏற்றுவதில் பிழை:")} {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <Button onClick={navigatePrevious} variant="secondary" size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 min-w-[200px] text-center">
            {view === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {view === 'week' && `${getBilingualLabel("Week of", "வாரம்")} ${formatDateForDisplay(currentDate)}`}
            {view === 'day' && formatDateForDisplay(currentDate)}
          </h2>
          <Button onClick={navigateNext} variant="secondary" size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={goToToday} variant="secondary" size="sm">
            {getBilingualLabel("Today", "இன்று")}
          </Button>
          <div className="flex rounded-md shadow-sm">
            {(['month', 'week', 'day'] as CalendarView[]).map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-3 py-1 text-sm font-medium border ${
                  view === viewType
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                } ${viewType === 'month' ? 'rounded-l-md' : viewType === 'day' ? 'rounded-r-md' : ''}`}
              >
                {viewType === 'month' && getBilingualLabel("Month", "மாதம்")}
                {viewType === 'week' && getBilingualLabel("Week", "வாரம்")}
                {viewType === 'day' && getBilingualLabel("Day", "நாள்")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      )}

      {/* Calendar view */}
      {!isLoading && (
        <>
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </>
      )}

      {/* Legend */}
      <div className="bg-slate-50 rounded-md p-4">
        <h4 className="text-sm font-medium text-slate-700 mb-2">
          {getBilingualLabel("Status Legend", "நிலை குறியீடு")}
        </h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded border bg-blue-100 border-blue-200 mr-2"></div>
            {getBilingualLabel("Scheduled", "திட்டமிடப்பட்டது")}
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded border bg-green-100 border-green-200 mr-2"></div>
            {getBilingualLabel("Confirmed", "உறுதிப்படுத்தப்பட்டது")}
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded border bg-gray-100 border-gray-200 mr-2"></div>
            {getBilingualLabel("Completed", "முடிக்கப்பட்டது")}
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded border bg-red-100 border-red-200 mr-2"></div>
            {getBilingualLabel("Cancelled", "ரத்துசெய்யப்பட்டது")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;