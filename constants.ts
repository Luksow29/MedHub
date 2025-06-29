
import { Patient, Appointment, ReminderMethod } from './types';

export const initialPatients: Patient[] = [
  { id: 'p1', name: 'John Doe', phone: '555-1234', email: 'john.doe@email.com', preferredContactMethod: ReminderMethod.EMAIL },
  { id: 'p2', name: 'Jane Smith', phone: '555-5678', email: 'jane.smith@email.com', preferredContactMethod: ReminderMethod.SMS },
  { id: 'p3', name: 'Alice Brown', phone: '555-8765', email: 'alice.brown@email.com', preferredContactMethod: ReminderMethod.EMAIL },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(today.getDate() + 2);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

export const initialAppointments: Appointment[] = [
  { 
    id: 'a1', 
    patientId: 'p1', 
    patientName: 'John Doe',
    date: formatDate(today), 
    time: '10:00', 
    reason: 'Regular Checkup', 
    reminderSent: false 
  },
  { 
    id: 'a2', 
    patientId: 'p2', 
    patientName: 'Jane Smith',
    date: formatDate(tomorrow), 
    time: '14:30', 
    reason: 'Dental Cleaning', 
    reminderSent: true, 
    reminderSentAt: new Date(Date.now() - 24*60*60*1000).toISOString(), 
    reminderMethodUsed: ReminderMethod.SMS 
  },
  { 
    id: 'a3', 
    patientId: 'p1', 
    patientName: 'John Doe',
    date: formatDate(dayAfterTomorrow), 
    time: '09:00', 
    reason: 'Follow-up', 
    reminderSent: false 
  },
    { 
    id: 'a4', 
    patientId: 'p3', 
    patientName: 'Alice Brown',
    date: formatDate(nextWeek), 
    time: '11:00', 
    reason: 'Consultation', 
    reminderSent: false 
  },
];
    