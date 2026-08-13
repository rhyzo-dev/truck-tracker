import { createClient } from '@supabase/supabase-js';

// These values come from your Supabase project settings
// Set them in Cloudflare Pages environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export interface Plant {
  id: string;
  code: string;
  name: string;
}

export interface LogisticCompany {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
}

export interface Truck {
  id: string;
  truck_no: string;
  logistic_company_id?: string;
}

export interface TruckVisit {
  id: string;
  visit_date: string;
  plant_id: string;
  truck_id: string;
  time_in: string | null;
  time_out: string | null;
  status: TruckStatus;
  issue_note?: string;
  destination: string;
  logistic_company_id: string;
  contact_no: string;
  registered_by: string;
  registered_at: string;
  updated_at: string;
  // Joined fields
  plants?: Plant;
  trucks?: Truck & { logistic_companies?: LogisticCompany };
  logistic_companies?: LogisticCompany;
}

export type TruckStatus =
  | 'scheduled'
  | 'arrived'
  | 'weighbridge_in'
  | 'loading'
  | 'loaded'
  | 'weighbridge_out'
  | 'departed'
  | 'delayed'
  | 'cancelled'
  | 'issue';

export const STATUS_LABELS: Record<TruckStatus, string> = {
  scheduled: 'Scheduled',
  arrived: 'Arrived',
  weighbridge_in: 'Weighbridge In',
  loading: 'Loading',
  loaded: 'Loaded',
  weighbridge_out: 'Weighbridge Out',
  departed: 'Departed',
  delayed: 'Delayed',
  cancelled: 'Cancelled',
  issue: 'Issue',
};

export const STATUS_COLORS: Record<TruckStatus, string> = {
  scheduled: '#94a3b8',
  arrived: '#3b82f6',
  weighbridge_in: '#6366f1',
  loading: '#f59e0b',
  loaded: '#22c55e',
  weighbridge_out: '#14b8a6',
  departed: '#6b7280',
  delayed: '#ef4444',
  cancelled: '#ef4444',
  issue: '#ef4444',
};

export const STATUS_ORDER: TruckStatus[] = [
  'scheduled',
  'arrived',
  'weighbridge_in',
  'loading',
  'loaded',
  'weighbridge_out',
  'departed',
  'delayed',
  'cancelled',
  'issue',
];