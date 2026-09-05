import { supabase } from './supabase';
import { Kost } from './types';
import { transformPropertyRow } from './userService';

const LOCAL_STORAGE_KEY = 'ruangsinggah_saved_kosts';
export const FAVORITES_UPDATED_EVENT = 'rs_favorites_updated';

/**
 * Mendapatkan daftar ID properti favorit pengguna (dari Supabase jika login, fallback ke LocalStorage).
 */
export async function getUserFavoriteIds(userId?: string): Promise<string[]> {
  try {
    if (userId) {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('property_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const ids = data.map((item: any) => item.property_id).filter(Boolean);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));
        } catch {}
        return ids;
      }
    }
  } catch (err) {
    console.warn('[favoriteService] Gagal fetch favorit dari Supabase, beralih ke cache lokal:', err);
  }

  // Fallback LocalStorage (untuk guest atau jika offline/network issue)
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const ids: string[] = JSON.parse(raw);
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

/**
 * Memeriksa apakah sebuah properti berstatus favorit secara instan dari cache lokal
 */
export function isPropertyFavoritedLocally(propertyId: string): boolean {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return false;
    const ids: string[] = JSON.parse(raw);
    return Array.isArray(ids) && ids.includes(propertyId);
  } catch {
    return false;
  }
}

/**
 * Toggle status favorit properti (Simpan / Hapus dari Favorit)
 */
export async function toggleFavoriteProperty(
  propertyId: string,
  userId?: string
): Promise<{ isFavorited: boolean; error?: string }> {
  if (!propertyId) return { isFavorited: false, error: 'Property ID tidak valid' };

  let currentIds: string[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    currentIds = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(currentIds)) currentIds = [];
  } catch {
    currentIds = [];
  }

  const isCurrentlyFavorited = currentIds.includes(propertyId);
  const nextFavoritedState = !isCurrentlyFavorited;

  // 1. Update status di Supabase jika user terautentikasi
  if (userId) {
    try {
      if (nextFavoritedState) {
        const { error } = await supabase
          .from('user_favorites')
          .upsert(
            { user_id: userId, property_id: propertyId },
            { onConflict: 'user_id,property_id' }
          );
        if (error) {
          console.error('[favoriteService] Error inserting favorite to Supabase:', error);
        }
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('property_id', propertyId);
        if (error) {
          console.error('[favoriteService] Error deleting favorite from Supabase:', error);
        }
      }
    } catch (err: any) {
      console.warn('[favoriteService] Supabase toggle exception:', err);
    }
  }

  // 2. Update LocalStorage cache
  let updatedIds: string[];
  if (nextFavoritedState) {
    updatedIds = Array.from(new Set([propertyId, ...currentIds]));
  } else {
    updatedIds = currentIds.filter(id => id !== propertyId);
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedIds));
  } catch {}

  // 3. Pancarkan event reaktif ke seluruh aplikasi
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(FAVORITES_UPDATED_EVENT, {
        detail: {
          propertyId,
          isFavorited: nextFavoritedState,
          totalFavorites: updatedIds.length,
        },
      })
    );
  }

  return { isFavorited: nextFavoritedState };
}

/**
 * Mengambil detail seluruh listing Kost yang tersimpan di daftar favorit pengguna.
 */
export async function getFavoritePropertiesDetails(userId?: string): Promise<Kost[]> {
  try {
    const favoriteIds = await getUserFavoriteIds(userId);
    if (!favoriteIds || favoriteIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .in('id', favoriteIds)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Map rows ke Kost structure
    const mapped = data.map(transformPropertyRow);

    // Urutkan sesuai urutan favoriteIds (terbaru disimpan di atas)
    const sorted = mapped.sort((a, b) => {
      const idxA = favoriteIds.indexOf(a.id);
      const idxB = favoriteIds.indexOf(b.id);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return sorted;
  } catch (error) {
    console.error('[favoriteService] Gagal memuat detail properti favorit:', error);
    return [];
  }
}

/**
 * Sinkronisasi data favorit guest dari LocalStorage ke akun Supabase saat login
 */
export async function syncGuestFavoritesToUser(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const guestIds: string[] = JSON.parse(raw);
    if (!Array.isArray(guestIds) || guestIds.length === 0) return;

    const payload = guestIds.map(propertyId => ({
      user_id: userId,
      property_id: propertyId,
    }));

    const { error } = await supabase
      .from('user_favorites')
      .upsert(payload, { onConflict: 'user_id,property_id' });

    if (error) {
      console.warn('[favoriteService] Gagal sinkronisasi favorit guest ke Supabase:', error);
    }
  } catch (err) {
    console.warn('[favoriteService] Error syncing guest favorites:', err);
  }
}
