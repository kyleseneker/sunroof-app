/**
 * Core Types for Sunroof App
 */

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
  };
  created_at?: string;
}

export interface Journey {
  id: string;
  user_id: string;
  name: string;
  destination?: string;
  unlock_date: string;
  status: 'active' | 'unlocked' | 'archived' | 'completed' | string;
  shared_with?: string[];
  deleted_at?: string | null;
  created_at: string;
  memory_count?: number;
  cover_url?: string;
}

export interface Memory {
  id: string;
  journey_id: string;
  type: 'photo' | 'text';
  url?: string;
  note?: string;
  deleted_at?: string | null;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh?: string;
  auth?: string;
  created_at: string;
  updated_at?: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export interface AIRecapResponse {
  recap: string | null;
  highlights: string[];
  error?: string;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface HapticPattern {
  light: number;
  medium: number;
  heavy: number;
  success: number[];
  warning: number[];
  error: number[];
  selection: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export interface CompressionStats {
  originalKB: number;
  compressedKB: number;
  savedKB: number;
  percentage: number;
}

