import { TZDate } from '@date-fns/tz';
import { endOfDay, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const TIMEZONE = 'America/Bogota';

// Obtiene la fecha y hora exacta de Colombia como TZDate
export const getColombiaDate = (date: Date): TZDate => {
  // Usa TZDate.tz para obtener la fecha en la zona horaria de Colombia
  return TZDate.tz(TIMEZONE, date);
};

// Obtiene la fecha y hora exacta de Colombia como Date estándar (útil para guardar en DB)
export const getColombiaDateAsDate = (date: Date): Date => {
  const tzDate = getColombiaDate(date);
  return new Date(
    tzDate.getFullYear(),
    tzDate.getMonth(),
    tzDate.getDate(),
    tzDate.getHours(),
    tzDate.getMinutes(),
    tzDate.getSeconds(),
    tzDate.getMilliseconds()
  );
};

export const formatColombiaDate = (date: Date): string => {
  const colombiaDate = getColombiaDate(date);
  return format(colombiaDate, 'EEEE, d MMMM yyyy', {
    locale: es,
  }).toUpperCase();
};

export const getDateKey = (date: Date): string => {
  const colombiaDate = getColombiaDate(date);
  return format(colombiaDate, 'yyyy-MM-dd');
};

export const getStartEndDayInColombia = (date: Date) => {
  const colombiaDate = getColombiaDate(date);
  const start = startOfDay(colombiaDate);
  const end = endOfDay(colombiaDate);
  return { start, end };
};

export const toColombiaDate = (date: Date): TZDate => {
  return getColombiaDate(date);
};

// Convierte un Date a string para input type="datetime-local" en zona America/Bogota
export const toColombiaDatetimeLocalString = (date: Date): string => {
  const tzDate = getColombiaDate(date);
  // yyyy-MM-ddTHH:mm
  return format(tzDate, "yyyy-MM-dd'T'HH:mm");
};

// Convierte un string de input type="datetime-local" a Date local puro (sin zona horaria)
export const fromDatetimeLocalStringToColombiaDate = (value: string): Date => {
  // value: 'yyyy-MM-ddTHH:mm'
  // Crear un Date local puro (sin conversión de zona horaria)
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  // El constructor Date(año, mes, día, hora, minuto) crea la fecha en la zona local del navegador
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};
