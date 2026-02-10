/**
 * Date and number formatting utilities for email templates
 */

import { format, formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const TIMEZONE = 'Asia/Tokyo';

/**
 * Format a date for display in emails
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "15 de enero, 2024")
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatInTimeZone(date, TIMEZONE, "d 'de' MMMM, yyyy", { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Format a date with time for display in emails
 * @param dateString - ISO date string
 * @returns Formatted date-time string (e.g., "15 de enero, 2024 14:30")
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatInTimeZone(date, TIMEZONE, "d 'de' MMMM, yyyy HH:mm", { locale: es });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return dateString;
  }
}

/**
 * Format a date range for display in emails
 * @param startDate - ISO start date string
 * @param finishDate - ISO finish date string
 * @returns Formatted date range (e.g., "15 - 20 de enero, 2024")
 */
export function formatDateRange(startDate: string, finishDate: string): string {
  try {
    const start = new Date(startDate);
    const finish = new Date(finishDate);
    const startDay = formatInTimeZone(start, TIMEZONE, 'd');
    const finishDay = formatInTimeZone(finish, TIMEZONE, "d 'de' MMMM, yyyy", { locale: es });

    return `${startDay} - ${finishDay}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return `${startDate} - ${finishDate}`;
  }
}

/**
 * Format hours for display
 * @param hours - Number of hours
 * @returns Formatted hours string (e.g., "2 horas", "1 hora")
 */
export function formatHours(hours: number): string {
  if (hours === 1) {
    return '1 hora';
  }
  return `${hours} horas`;
}

/**
 * Format days for display
 * @param days - Number of days
 * @returns Formatted days string (e.g., "5 días", "1 día")
 */
export function formatDays(days: number): string {
  if (days === 1) {
    return '1 día';
  }
  return `${days} días`;
}

/**
 * Format a number with currency style
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-PE').format(num);
}
