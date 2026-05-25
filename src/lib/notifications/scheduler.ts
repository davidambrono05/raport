import type { NotificationFrequency } from './types';

export function getNextRunDate(frequency: NotificationFrequency, from = new Date()): Date {
  const d = new Date(from);

  if (frequency.type === 'immediate') return d;

  if (frequency.type === 'daily') {
    d.setHours(frequency.hour, 0, 0, 0);
    if (d <= from) d.setDate(d.getDate() + 1);
    return d;
  }

  if (frequency.type === 'weekly') {
    const currentDay = d.getDay();
    const diff = (frequency.dayOfWeek - currentDay + 7) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
    d.setHours(frequency.hour, 0, 0, 0);
    return d;
  }

  if (frequency.type === 'monthly') {
    d.setDate(frequency.dayOfMonth);
    d.setHours(frequency.hour, 0, 0, 0);
    if (d <= from) d.setMonth(d.getMonth() + 1);
    return d;
  }

  return d;
}

export function shouldRunNow(
  frequency: NotificationFrequency,
  lastRun: Date | null,
  now = new Date()
): boolean {
  if (frequency.type === 'immediate') return true;
  if (!lastRun) return true;

  const next = getNextRunDate(frequency, lastRun);
  return now >= next;
}

export function formatFrequency(frequency: NotificationFrequency): string {
  const DAYS = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

  if (frequency.type === 'immediate') return 'Imediat';
  if (frequency.type === 'daily') return `Zilnic la ${frequency.hour}:00`;
  if (frequency.type === 'weekly')
    return `Săptămânal, ${DAYS[frequency.dayOfWeek]} la ${frequency.hour}:00`;
  if (frequency.type === 'monthly')
    return `Lunar, ziua ${frequency.dayOfMonth} la ${frequency.hour}:00`;
  return 'Necunoscut';
}
