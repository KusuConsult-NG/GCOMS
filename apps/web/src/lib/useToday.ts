'use client';

import { useEffect, useState } from 'react';

/**
 * The current date, captured on the client after mount.
 *
 * Reading the clock during render makes the render impure: the server renders
 * one answer and the client another, so hydration mismatches, and React is free
 * to render again and get a third. Anything relative to "now" — a patient's age,
 * the days remaining on a contract — has to come from a value that is fixed for
 * the lifetime of the render instead.
 *
 * Null until mounted, which is also the only honest answer during SSR: the
 * server does not know what day it is where the reader is.
 */
export function useToday(): Date | null {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    setToday(new Date());
  }, []);
  return today;
}

/** Whole days from `today` until `date`; null while today is unknown. */
export function daysUntil(date: string | Date, today: Date | null): number | null {
  if (!today) return null;
  const target = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

/** Calendar age in whole years; null while today is unknown or the date is bad. */
export function ageInYears(dateOfBirth: string, today: Date | null): number | null {
  if (!today || !dateOfBirth) return null;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return null;
  let age = today.getFullYear() - born.getFullYear();
  // Calendar arithmetic, not a division by 365.25: the approximation is wrong
  // for anyone whose birthday has not come round yet this year.
  const monthDelta = today.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < born.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}
