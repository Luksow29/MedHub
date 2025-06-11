// features/patient-management/components/PatientList.tsx
import React from 'react';
import { Patient, ReminderMethod } from '../../../types';

interface PatientListProps {
  patients: Patient[];
}

// விருப்பமான தொடர்பு முறைக்கு UI லேபலை வழங்கும் செயல்பாடு
const getReminderMethodUILabel = (method: ReminderMethod) => {
  switch (method) {
    case ReminderMethod.EMAIL:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 mr-1.5">
            <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.002.051.005.076.005H14.924c.025 0 .05-.003.076-.005V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
            <path d="M15 6.954V11.5A1.5 1.5 0 0 1 13.5 13h-11A1.5 1.5 0 0 1 1 11.5V6.954l5.262 3.329a1.5 1.5 0 0 0 1.476 0L15 6.954Z" />
          </svg>
          மின்னஞ்சல்
        </span>
      );
    case ReminderMethod.SMS:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 mr-1.5">
            <path fillRule="evenodd" d="M4 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1H4V2Zm2 3.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM4.5 1h7A1.5 1.5 0 0 1 13 2.5v11A1.5 1.5 0 0 1 11.5 15h-7A1.5 1.5 0 0 1 3 13.5v-11A1.5 1.5 0 0 1 4.5 1Z" clipRule="evenodd" />
          </svg>
          எஸ்எம்எஸ்
        </span>
      );
    case ReminderMethod.NONE:
        return (
         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
           ஏதுமில்லை
         </span>
       );
    default:
      return method;
  }
};

const PatientList: React.FC<PatientListProps> = ({ patients }) => {
  if (patients.length === 0) {
    return <p className="text-center text-slate-600 py-8">இன்னும் நோயாளிகள் யாரும் பதிவு செய்யப்படவில்லை. தொடங்க "நோயாளியைச் சேர்" என்பதைக் கிளிக் செய்யவும்.</p>;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">பெயர்</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">தொலைபேசி</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">மின்னஞ்சல்</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">விருப்பமான தொடர்பு</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{patient.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{patient.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{patient.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {getReminderMethodUILabel(patient.preferredContactMethod)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientList;