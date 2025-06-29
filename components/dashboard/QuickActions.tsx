import React from 'react';
import Button from '../shared/Button';

interface QuickActionsProps {
  onAddPatient: () => void;
  onScheduleAppointment: () => void;
  onViewWaitlist: () => void;
  onEmergencyMode: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onAddPatient,
  onScheduleAppointment,
  onViewWaitlist,
  onEmergencyMode
}) => {
  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const actions = [
    {
      id: 'add-patient',
      label: getBilingualLabel('Add New Patient', 'புதிய நோயாளியைச் சேர்'),
      description: getBilingualLabel('Register a new patient', 'புதிய நோயாளியைப் பதிவு செய்யவும்'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      onClick: onAddPatient,
      color: 'bg-blue-500 hover:bg-blue-600',
      shortcut: 'Ctrl+N'
    },
    {
      id: 'schedule-appointment',
      label: getBilingualLabel('Schedule Appointment', 'சந்திப்பை திட்டமிடு'),
      description: getBilingualLabel('Book a new appointment', 'புதிய சந்திப்பை முன்பதிவு செய்யவும்'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      onClick: onScheduleAppointment,
      color: 'bg-green-500 hover:bg-green-600',
      shortcut: 'Ctrl+A'
    },
    {
      id: 'view-waitlist',
      label: getBilingualLabel('Manage Waitlist', 'காத்திருப்பு பட்டியலை நிர்வகிக்கவும்'),
      description: getBilingualLabel('View and manage patient waitlist', 'நோயாளர் காத்திருப்பு பட்டியலைப் பார்க்கவும் நிர்வகிக்கவும்'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: onViewWaitlist,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      shortcut: 'Ctrl+W'
    },
    {
      id: 'emergency-mode',
      label: getBilingualLabel('Emergency Mode', 'அவசர முறை'),
      description: getBilingualLabel('Quick access for urgent cases', 'அவசர வழக்குகளுக்கான விரைவு அணுகல்'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      onClick: onEmergencyMode,
      color: 'bg-red-500 hover:bg-red-600',
      shortcut: 'Ctrl+E'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        {getBilingualLabel('Quick Actions', 'விரைவு செயல்கள்')}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`
              ${action.color} text-white p-4 rounded-lg transition-all duration-200 
              transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-opacity-50 group
            `}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {action.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{action.label}</p>
                <p className="text-sm opacity-90">{action.description}</p>
                <p className="text-xs opacity-75 mt-1">{action.shortcut}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Keyboard shortcuts info */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {getBilingualLabel(
            'Use keyboard shortcuts for faster access',
            'வேகமான அணுகலுக்கு விசைப்பலகை குறுக்குவழிகளைப் பயன்படுத்தவும்'
          )}
        </p>
      </div>
    </div>
  );
};

export default QuickActions;