/**
 * TypeScript interfaces and types for email templates
 */

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

export type ButtonVariant = 'primary' | 'secondary';

export interface BaseEmailProps {
  previewText?: string;
}

export interface UserInfo {
  userName: string;
  userEmail: string;
}

export interface EventDetails {
  eventName: string;
  hours: number;
  eventDate: string;
}

export interface VacationDetails {
  startDate: string;
  finishDate: string;
  days: number;
}

export interface ApprovalDetails {
  approvedDate: string;
  approvedBy?: string;
}
