import { formatInTimeZone } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

export function formatIST(date: Date | string | number, formatStr: string = 'PPP p'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return formatInTimeZone(d, IST_TIMEZONE, formatStr);
}
