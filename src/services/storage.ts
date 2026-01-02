/**
 * Storage Service
 */

import { supabase } from '@/lib';
import type { ServiceResult } from './types';

export interface UploadResult {
  publicUrl: string;
  path: string;
}

/**
 * Upload a memory photo
 */
export async function uploadMemoryPhoto(
  userId: string,
  journeyId: string,
  file: Blob,
  contentType: string = 'image/jpeg'
): Promise<ServiceResult<UploadResult>> {
  try {
    const filename = `${Date.now()}.jpg`;
    const path = `${userId}/${journeyId}/${filename}`;
    
    const { error: uploadError } = await supabase.storage
      .from('sunroof-media')
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[StorageService] Upload memory error:', uploadError);
      return { data: null, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from('sunroof-media')
      .getPublicUrl(path);

    return {
      data: {
        publicUrl: urlData.publicUrl,
        path,
      },
      error: null,
    };
  } catch (err) {
    console.error('[StorageService] Upload memory exception:', err);
    return { data: null, error: 'Failed to upload photo' };
  }
}

/**
 * Upload a user avatar
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<ServiceResult<UploadResult>> {
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `avatar.${ext}`;
    const path = `${userId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('[StorageService] Upload avatar error:', uploadError);
      return { data: null, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    // Add cache buster for immediate update
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    return {
      data: {
        publicUrl,
        path,
      },
      error: null,
    };
  } catch (err) {
    console.error('[StorageService] Upload avatar exception:', err);
    return { data: null, error: 'Failed to upload avatar' };
  }
}

/**
 * Remove user avatar
 */
export async function removeAvatar(userId: string): Promise<ServiceResult<boolean>> {
  try {
    // List all files in user's avatar folder
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(userId);

    if (listError) {
      console.error('[StorageService] List avatars error:', listError);
      return { data: null, error: listError.message };
    }

    // Delete all avatar files
    if (files && files.length > 0) {
      const filesToDelete = files.map(f => `${userId}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(filesToDelete);

      if (deleteError) {
        console.error('[StorageService] Delete avatar error:', deleteError);
        return { data: null, error: deleteError.message };
      }
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[StorageService] Remove avatar exception:', err);
    return { data: null, error: 'Failed to remove avatar' };
  }
}

/**
 * Delete all storage files for a user (account deletion)
 */
export async function deleteAllUserStorage(userId: string): Promise<ServiceResult<boolean>> {
  try {
    // Delete avatars
    await removeAvatar(userId);

    // Note: Memory photos are typically cleaned up when memories are deleted
    // through database cascades or RLS policies. If needed, add cleanup here.

    return { data: true, error: null };
  } catch (err) {
    console.error('[StorageService] Delete all storage exception:', err);
    return { data: null, error: 'Failed to delete storage' };
  }
}

/**
 * Upload a memory audio file
 */
export async function uploadMemoryAudio(
  userId: string,
  journeyId: string,
  file: Blob,
  contentType: string = 'audio/webm'
): Promise<ServiceResult<UploadResult>> {
  try {
    const ext = contentType.includes('webm') ? 'webm' : contentType.includes('mp4') ? 'm4a' : 'wav';
    const filename = `${Date.now()}.${ext}`;
    const path = `${userId}/${journeyId}/${filename}`;
    
    const { error: uploadError } = await supabase.storage
      .from('sunroof-media')
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[StorageService] Upload audio error:', uploadError);
      return { data: null, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from('sunroof-media')
      .getPublicUrl(path);

    return {
      data: {
        publicUrl: urlData.publicUrl,
        path,
      },
      error: null,
    };
  } catch (err) {
    console.error('[StorageService] Upload audio exception:', err);
    return { data: null, error: 'Failed to upload audio' };
  }
}

/**
 * Get public URL for a storage path
 */
export function getPublicUrl(bucket: 'memories' | 'avatars', path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

