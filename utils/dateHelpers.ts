
export const formatDateToInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTimeToInput = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatReadableDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatReadableTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const isUpcomingInDays = (appointmentDate: Date, days: number): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days + 1); // +1 to include the 7th day fully

  // Normalize appointmentDate to the start of its day for comparison
  const normalizedAppointmentDate = new Date(appointmentDate);
  normalizedAppointmentDate.setHours(0,0,0,0);

  return normalizedAppointmentDate >= today && normalizedAppointmentDate < futureDate;
};
    