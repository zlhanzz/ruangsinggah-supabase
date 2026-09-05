import { supabase } from './supabase';
import { Kost, DatabaseProduct, ImageUrlObject } from './types';
import { notifyAdminTransaction } from './emailService';
import { getCurrentDate } from './utils/timeUtils';

// Helper to safely convert timestamps
const convertTimestamp = (ts: any): string => {
  if (!ts) return getCurrentDate().toISOString();
  if (typeof ts === 'string') return ts;
  return ts;
};

// Helper to extract display URL from image object or string
// Prioritize WebP > Original > Thumbnail
export const getDisplayImageUrl = (img: any): string => {
  if (!img) return '';
  if (typeof img === 'string') return ensureAbsoluteUrl(img, 'properties');
  const path = img.webp || img.original || img.thumbnail || img.url || '';
  return ensureAbsoluteUrl(path, 'properties');
};

// Helper to extract rich image object with full metadata (url, label, category, caption)
export const getDisplayImageObject = (img: any): ImageUrlObject | null => {
  if (!img) return null;
  if (typeof img === 'string') {
    const u = ensureAbsoluteUrl(img, 'properties');
    return { original: u, url: u, label: '', category: '', caption: '' };
  }
  const path = img.webp || img.original || img.thumbnail || img.url || '';
  const u = ensureAbsoluteUrl(path, 'properties');
  const label = img.label || img.category || '';
  const category = img.category || img.label || '';
  const caption = img.caption || label || category || '';
  return {
    ...img,
    original: ensureAbsoluteUrl(img.original || path, 'properties'),
    url: u,
    label,
    category,
    caption
  };
};

// Helper to ensure URL is absolute (Supabase Storage support)
export const ensureAbsoluteUrl = (path: string, bucket: string): string => {
  if (!path) return '';
  const trimmedPath = path.trim();
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sgcmnsnokrztocnhxnqm.supabase.co';
  const cfProxy = 'https://media.ruangsinggah.id';

  if (trimmedPath.startsWith('http') || trimmedPath.startsWith('data:')) {
    if (trimmedPath.startsWith(supabaseUrl)) {
      return trimmedPath.replace(supabaseUrl, cfProxy);
    }
    return trimmedPath;
  }
  
  // Clean leading slash for Supabase storage paths
  let cleanPath = trimmedPath.startsWith('/') ? trimmedPath.substring(1) : trimmedPath;
  
  // If the path already starts with the bucket name (e.g. from a migration or folder-level path)
  // we remove it to avoid double bucket prefixes in the final URL.
  // Example: 'profile-photos/user123.jpg' -> 'user123.jpg'
  if (cleanPath.startsWith(bucket + '/')) {
    cleanPath = cleanPath.substring(bucket.length + 1);
  }
  
  // Use public storage URL for relative paths
  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
  let publicUrl = data.publicUrl;
  if (publicUrl && publicUrl.startsWith(supabaseUrl)) {
    publicUrl = publicUrl.replace(supabaseUrl, cfProxy);
  }
  return publicUrl;
};

// Helper to extract video URL
const getDisplayVideoUrl = (vid: any): string => {
  if (!vid) return '';
  if (typeof vid === 'string') return vid;
  return vid.original || '';
};

/**
 * Calculates the "Effective Monthly Price" for a room variant
 * Logic prioritized: Monthly > Yearly/12 > 6mo/6 > 3mo/3 > Weekly > Daily
 */
export const getRoomEffectivePrice = (room: any) => {
  const pricing = room.pricing || [];
  
  // 1. Try explicit Monthly
  const monthly = pricing.find((p: any) => p.period === 'bulanan');
  if (monthly) return { price: monthly.price, unit: '/bln', priority: 1 };

  // 2. Try Yearly (divided by 12)
  const yearly = pricing.find((p: any) => p.period === 'tahunan');
  if (yearly) return { price: yearly.price / 12, unit: '/bln', priority: 2 };

  // 3. Try 6 Months (divided by 6)
  const sixMonth = pricing.find((p: any) => p.period === '6bulanan');
  if (sixMonth) return { price: sixMonth.price / 6, unit: '/bln', priority: 3 };

  // 4. Try 3 Months (divided by 3)
  const threeMonth = pricing.find((p: any) => p.period === '3bulanan');
  if (threeMonth) return { price: threeMonth.price / 3, unit: '/bln', priority: 4 };

  // 5. Fallback: Weekly
  const weekly = pricing.find((p: any) => p.period === 'mingguan');
  if (weekly) return { price: weekly.price, unit: '/minggu', priority: 5 };

  // 6. Fallback: Daily
  const daily = pricing.find((p: any) => p.period === 'harian');
  if (daily) return { price: daily.price, unit: '/hari', priority: 6 };

  // 7. Absolute Fallback (Legacy data structure or base price)
  return { price: Number(room.price) || 0, unit: '/bln', priority: 7 };
};

export interface PropertyFilterParams {
  searchTerm?: string;
  typeFilter?: string;
  selectedProvince?: string;
  selectedCity?: string;
  selectedDistrict?: string;
  selectedCampus?: string;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export function transformPropertyRow(row: any): Kost {
  const rawImages = row.image_urls || [];
  const images = rawImages.map(getDisplayImageUrl).filter((u: string) => u !== '');
  const photosMeta = (row.metadata?.photos_meta || rawImages).map(getDisplayImageObject).filter(Boolean) as ImageUrlObject[];

  const rawVideos = row.video_urls || [];
  const videos = rawVideos.map(getDisplayVideoUrl).filter((u: string) => u !== '');

  return {
    id: row.id,
    ownerUid: row.owner_uid,
    title: row.title || 'Tanpa Nama',
    description: row.description || '',
    price: row.price || (row.room_types && row.room_types.length > 0 ? row.room_types[0].price : 0),
    facilities: row.facilities || [],
    address: row.address || '',
    province: row.province || row.metadata?.province || '',
    city: row.city || '',
    area: row.area || '',
    type: row.type || 'Campur',
    status: row.status || 'published',
    isVerified: row.is_verified ?? false,
    isManaged: row.is_managed ?? false,
    rating: row.rating || 0,
    location: row.location || { lat: 0, lng: 0 },
    imageUrls: images,
    photosMeta,
    videoUrls: videos,
    instagramUrl: row.instagram_url || '',
    tiktokUrl: row.tiktok_url || '',
    roomTypes: row.room_types || [],
    reviews: row.reviews || [],
    rules: row.rules || [],
    campuses: row.campuses || [],
    publicFacilities: row.public_facilities || [],
    virtualTourUrl: row.virtual_tour_url || '',
    additionalFeePrice: row.additional_fee_price,
    additionalFeeName: row.additional_fee_name,
    additionalFeeStartsFrom: row.additional_fee_starts_from,
    createdAt: convertTimestamp(row.created_at),
    updatedAt: convertTimestamp(row.updated_at),
    omnichannelContactName: row.omnichannel_contact_name,
    omnichannelContactPhone: row.omnichannel_contact_phone,
    omnichannelContactType: row.omnichannel_contact_type,
    photoCategories: row.photo_categories || row.photoCategories || (row.metadata && (row.metadata.photo_categories || row.metadata.photoCategories)) || [],
    categorizedPhotos: row.categorized_photos || row.categorizedPhotos || (row.metadata && (row.metadata.categorized_photos || row.metadata.categorizedPhotos)) || {},
  } as Kost;
}

// ── SWR / CACHE-FIRST STRATEGY FOR PROPERTIES & FILTERS ──────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Menit
const OPTIONS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 Menit

const filteredPropertiesCache = new Map<string, { data: { kosts: Kost[]; totalCount: number }; timestamp: number }>();
let publishedPropertiesCache: { data: Kost[]; timestamp: number } | null = null;
let availableOptionsCache: { data: { provinces: string[]; cities: string[]; districts: string[]; campuses: string[]; rawRelations: GeoRelationEntry[] }; timestamp: number } | null = null;

export function invalidatePropertiesCache(): void {
  filteredPropertiesCache.clear();
  publishedPropertiesCache = null;
  availableOptionsCache = null;
  try {
    sessionStorage.removeItem('rs_filter_options_cache');
  } catch {}
}

export async function getPublishedProperties(forceRefresh = false): Promise<Kost[]> {
  if (!forceRefresh && publishedPropertiesCache && (Date.now() - publishedPropertiesCache.timestamp < CACHE_TTL_MS)) {
    return publishedPropertiesCache.data;
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    const mapped = data.map(transformPropertyRow);
    publishedPropertiesCache = { data: mapped, timestamp: Date.now() };
    return mapped;
  } catch (error: any) {
    console.error('Error fetching published properties:', error);
    if (publishedPropertiesCache) return publishedPropertiesCache.data;
    return [];
  }
}

/**
 * Backend Database Query: Filter, search, and paginate properties directly from PostgreSQL
 * Supports Cache-First strategy with TTL & background revalidation
 */
export async function getFilteredProperties(params: PropertyFilterParams = {}, forceRefresh = false): Promise<{
  kosts: Kost[];
  totalCount: number;
}> {
  const cacheKey = JSON.stringify({
    p: params.page || 1,
    l: params.limit || 9,
    s: (params.searchTerm || '').trim().toLowerCase(),
    t: params.typeFilter || 'Semua',
    c: params.selectedCity || 'Semua',
    d: params.selectedDistrict || 'Semua',
    ca: params.selectedCampus || 'Semua',
    pr: params.selectedProvince || 'Semua',
    mp: params.maxPrice || 5000000
  });

  if (!forceRefresh) {
    const cached = filteredPropertiesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data;
    }
  }

  try {
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    // 1. Multi-column Text Search (Title, Address, Area)
    if (params.searchTerm && params.searchTerm.trim() !== '') {
      const term = params.searchTerm.trim();
      query = query.or(`title.ilike.%${term}%,address.ilike.%${term}%,area.ilike.%${term}%`);
    }

    // 2. Room / Kost Type Filter
    if (params.typeFilter && params.typeFilter !== 'Semua') {
      query = query.eq('type', params.typeFilter);
    }

    // 3. City Filter
    if (params.selectedCity && params.selectedCity !== 'Semua') {
      query = query.eq('city', params.selectedCity);
    }

    // 4. District / Area Filter
    if (params.selectedDistrict && params.selectedDistrict !== 'Semua') {
      query = query.eq('area', params.selectedDistrict);
    }

    // 5. Max Price Filter
    if (params.maxPrice && params.maxPrice < 5000000) {
      query = query.lte('price', params.maxPrice);
    }

    // Sort newest updated first
    query = query.order('updated_at', { ascending: false });

    const isCampusFiltered = params.selectedCampus && params.selectedCampus !== 'Semua';
    const isProvinceFiltered = params.selectedProvince && params.selectedProvince !== 'Semua';
    const isCustomFiltered = isCampusFiltered || isProvinceFiltered;

    // Server-side range only if no in-memory custom filters
    if (!isCustomFiltered && params.page && params.limit) {
      const from = (params.page - 1) * params.limit;
      const to = from + params.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    if (!data) return { kosts: [], totalCount: 0 };

    let mappedKosts = data.map(transformPropertyRow);

    // Filter province if selected
    if (isProvinceFiltered) {
      const targetProv = params.selectedProvince!.toLowerCase();
      mappedKosts = mappedKosts.filter(k => 
        (k.province || 'sulawesi selatan').toLowerCase().includes(targetProv)
      );
    }

    // Filter campus if selected
    if (isCampusFiltered) {
      const targetCampus = params.selectedCampus!.toLowerCase();
      mappedKosts = mappedKosts.filter(k => 
        k.campuses && k.campuses.some(c => c.name && c.name.toLowerCase().includes(targetCampus))
      );
    }

    let result = { kosts: mappedKosts, totalCount: count ?? mappedKosts.length };

    if (isCustomFiltered) {
      const totalCustomCount = mappedKosts.length;
      if (params.page && params.limit) {
        const from = (params.page - 1) * params.limit;
        mappedKosts = mappedKosts.slice(from, from + params.limit);
      }
      result = { kosts: mappedKosts, totalCount: totalCustomCount };
    }

    // Save to Cache
    filteredPropertiesCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (error: any) {
    console.error('Error in getFilteredProperties:', error);
    const cached = filteredPropertiesCache.get(cacheKey);
    if (cached) return cached.data;
    return { kosts: [], totalCount: 0 };
  }
}

export interface GeoRelationEntry {
  province: string;
  city: string;
  district: string;
  campuses: string[];
}

/**
 * Fetch unique provinces, cities, districts/areas, and campuses available in the database for dropdown filter options,
 * along with raw relational entries for cascading dependency.
 * Uses Cache-First strategy (10-minute TTL / sessionStorage).
 */
export async function getAvailableFilterOptions(forceRefresh = false): Promise<{
  provinces: string[];
  cities: string[];
  districts: string[];
  campuses: string[];
  rawRelations: GeoRelationEntry[];
}> {
  if (!forceRefresh) {
    if (availableOptionsCache && (Date.now() - availableOptionsCache.timestamp < OPTIONS_CACHE_TTL_MS)) {
      return availableOptionsCache.data;
    }
    try {
      const sessionData = sessionStorage.getItem('rs_filter_options_cache');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed && (Date.now() - parsed.timestamp < OPTIONS_CACHE_TTL_MS)) {
          availableOptionsCache = parsed;
          return parsed.data;
        }
      }
    } catch {}
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'published');

    if (error || !data) return { provinces: [], cities: [], districts: [], campuses: [], rawRelations: [] };

    const provinces = new Set<string>();
    const cities = new Set<string>();
    const districts = new Set<string>();
    const campuses = new Set<string>();
    const rawRelations: GeoRelationEntry[] = [];

    data.forEach((row: any) => {
      const city = (row.city || row.metadata?.city || '').trim();
      const prov = (row.province || row.metadata?.province || (city ? 'Sulawesi Selatan' : '') || 'Sulawesi Selatan').trim();
      const area = (row.area || row.metadata?.area || '').trim();
      const itemCampuses: string[] = [];

      if (prov !== '') provinces.add(prov);
      if (city !== '') cities.add(city);
      if (area !== '') districts.add(area);

      if (Array.isArray(row.campuses)) {
        row.campuses.forEach((c: any) => {
          if (c?.name && c.name.trim() !== '') {
            const cName = c.name.trim();
            campuses.add(cName);
            itemCampuses.push(cName);
          }
        });
      }

      rawRelations.push({
        province: prov,
        city: city,
        district: area,
        campuses: itemCampuses
      });
    });

    const result = {
      provinces: Array.from(provinces).sort(),
      cities: Array.from(cities).sort(),
      districts: Array.from(districts).sort(),
      campuses: Array.from(campuses).sort(),
      rawRelations
    };

    availableOptionsCache = { data: result, timestamp: Date.now() };
    try {
      sessionStorage.setItem('rs_filter_options_cache', JSON.stringify({ data: result, timestamp: Date.now() }));
    } catch {}

    return result;
  } catch (error: any) {
    console.error('Error fetching available filter options:', error);
    if (availableOptionsCache) return availableOptionsCache.data;
    return { provinces: [], cities: [], districts: [], campuses: [], rawRelations: [] };
  }
}

export async function getPublishedPropertyDetails(propertyId: string): Promise<Kost | null> {
  try {
    let row: any = null;

    // 1. Coba ambil jika status published (terbuka untuk umum)
    const { data: pubRow } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('status', 'published')
      .maybeSingle();

    if (pubRow) {
      row = pubRow;
    } else {
      // 2. Mode Pratinjau (Preview Mode): jika belum published, izinkan pemilik atau admin melihat propertinya
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: privRow } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .maybeSingle();

        if (privRow) {
          const isOwner = privRow.owner_uid === user.id;
          let isAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin';
          if (!isAdmin) {
            const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
            if (dbUser?.role === 'admin') isAdmin = true;
          }
          if (isOwner || isAdmin) {
            row = privRow;
          }
        }
      }
    }

    if (!row) return null;

    const rawImages = row.image_urls || [];
    const images = rawImages.map(getDisplayImageUrl).filter((u: string) => u !== '');
    const photosMeta = (row.metadata?.photos_meta || rawImages).map(getDisplayImageObject).filter(Boolean) as ImageUrlObject[];

    const rawVideos = row.video_urls || [];
    const videos = rawVideos.map(getDisplayVideoUrl).filter((u: string) => u !== '');

    return {
      id: row.id,
      ownerUid: row.owner_uid,
      title: row.title || 'Tanpa Nama',
      description: row.description || '',
      price: row.price || 0,
      facilities: row.facilities || [],
      address: row.address || '',
      city: row.city || '',
      type: row.type || 'Campur',
      status: row.status || 'published',
      isVerified: row.is_verified ?? false,
      isManaged: row.is_managed ?? false,
      rating: row.rating || 0,
      location: row.location || { lat: 0, lng: 0 },
      imageUrls: images,
      photosMeta,
      videoUrls: videos,
      instagramUrl: row.instagram_url || '',
      tiktokUrl: row.tiktok_url || '',
      roomTypes: row.room_types || [],
      reviews: row.reviews || [],
      rules: row.rules || [],
      campuses: row.campuses || [],
      publicFacilities: row.public_facilities || [],
      createdAt: convertTimestamp(row.created_at),
      updatedAt: convertTimestamp(row.updated_at),
      additionalFeePrice: row.additional_fee_price,
      additionalFeeName: row.additional_fee_name,
      additionalFeeStartsFrom: row.additional_fee_starts_from,
      omnichannelContactName: row.omnichannel_contact_name,
      omnichannelContactPhone: row.omnichannel_contact_phone,
      omnichannelContactType: row.omnichannel_contact_type,
      photoCategories: row.photo_categories || row.photoCategories || (row.metadata && (row.metadata.photo_categories || row.metadata.photoCategories)) || [],
      categorizedPhotos: row.categorized_photos || row.categorizedPhotos || (row.metadata && (row.metadata.categorized_photos || row.metadata.categorizedPhotos)) || {},
    } as Kost;
  } catch (error) {
    console.error('Error getting property details:', error);
    throw error;
  }
}

export async function getPublicDatabaseProducts(): Promise<DatabaseProduct[]> {
  try {
    const { data, error } = await supabase
      .from('available_databases')
      .select('*')
      .eq('status', 'available');

    if (error) throw error;
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      campus: row.campus || '',
      city: row.city || '',
      area: row.area || '',
      description: row.description || '',
      price: row.price || 0,
      totalData: row.total_data || 0,
      fileUrls: row.file_urls || {},
      fileType: row.file_type || 'link',
      fileName: row.file_name || '',
      status: row.status || 'available',
      createdAt: convertTimestamp(row.created_at),
      updatedAt: convertTimestamp(row.updated_at),
    } as DatabaseProduct));
  } catch (error) {
    console.error('Error fetching databases:', error);
    return [];
  }
}

export async function getUserTransactions(uid: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        user:user_id (
          name,
          email,
          phone,
          photo_url,
          gender,
          occupation,
          institution,
          religion,
          relationship_status,
          address
        )
      `)
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return [];
  }
}

export async function addPropertyReview(propertyId: string, review: { userId: string; userName: string; rating: number; comment: string }) {
  try {
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('reviews, rating')
      .eq('id', propertyId)
      .single();

    if (fetchError) throw fetchError;

    const currentReviews = Array.isArray(property?.reviews) ? property.reviews : [];
    const newReview = {
      ...review,
      rating: Number(review.rating) || 5,
      date: getCurrentDate().toISOString()
    };

    // Upsert review by userId if user already submitted a review previously
    const existingIndex = currentReviews.findIndex((r: any) => r.userId === review.userId);
    let updatedReviews: any[] = [];
    if (existingIndex >= 0) {
      updatedReviews = [...currentReviews];
      updatedReviews[existingIndex] = newReview;
    } else {
      updatedReviews = [...currentReviews, newReview];
    }

    // Calculate new average rating
    const totalRating = updatedReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
    const newAverageRating = Number((totalRating / updatedReviews.length).toFixed(1));

    // Try direct update first
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        reviews: updatedReviews,
        rating: newAverageRating
      })
      .eq('id', propertyId);

    if (updateError) {
      // Fallback to RPC if RLS restricts direct update
      const { error: rpcError } = await supabase.rpc('submit_property_review', {
        prop_id: propertyId,
        new_review: newReview,
        new_rating: newAverageRating
      });
      if (rpcError) {
        console.warn('RPC submit_property_review fallback also encountered error:', rpcError);
      }
    }

    return { success: true, newAverageRating, reviews: updatedReviews };
  } catch (error) {
    console.error('Error adding property review:', error);
    throw error;
  }
}

export async function getExtraBills(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('product_type', 'tagihan_ekstra')
      .in('status', ['pending', 'AWAITING_PAYMENT', 'PAID', 'SUCCESS', 'berhasil']);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching extra bills:', error);
    return [];
  }
}
import { notifyMitra } from './notificationBridge';
export async function createBookingRequest(bookingData: {
  userId: string;
  productId: string;
  productType: string;
  amount: number;
  metadata: any;
}) {
  try {
    const facilityAmount = Number(bookingData.metadata?.facilityFee || 0);
    const rentAmount = bookingData.amount - facilityAmount;

    const bookingSessionId = crypto.randomUUID();
    
    // 0. Create Resident Status record (Inactive/Pending until payment)
    const { data: resStatus, error: resError } = await supabase
      .from('resident_status')
      .insert([{
        user_id: bookingData.userId,
        kost_id: bookingData.productId,
        status: 'PENDING', // Will be activated on payment
        start_date: bookingData.metadata?.startDate || getCurrentDate().toISOString().split('T')[0],
        end_date: bookingData.metadata?.endDate || getCurrentDate().toISOString().split('T')[0],
        room_type: bookingData.metadata?.roomType || '-',
        room_number: bookingData.metadata?.roomNumber || bookingData.metadata?.variantName || null,
        metadata: {
            ...bookingData.metadata,
            booking_session_id: bookingSessionId,
            created_via: 'booking_request'
        }
      }])
      .select()
      .single();

    if (resError) {
        console.error("Error creating resident status:", resError);
        // We continue even if this fails to not block the booking, but it's ideal to have it.
    }

    const residentStatusId = resStatus?.id || null;

    // 1. Create Main Rent Transaction (kost_booking)
    const { data: rentTrx, error: rentError } = await supabase
      .from('transactions')
      .insert([{
        user_id: bookingData.userId,
        product_id: bookingData.productId,
        product_type: bookingData.productType,
        amount: rentAmount,
        status: 'PENDING_APPROVAL',
        resident_status_id: residentStatusId,
        metadata: {
          ...bookingData.metadata,
          billName: `Sewa Kost: ${bookingData.metadata?.kostName || 'Kost'}`,
          booking_session_id: bookingSessionId,
          is_bundled_parent: true,
          resident_status_id: residentStatusId
        }
      }])
      .select()
      .single();

    if (rentError) throw rentError;

    // 2. Create Facility Transaction (tagihan_ekstra) if needed
    if (facilityAmount > 0) {
      await supabase
        .from('transactions')
        .insert([{
          user_id: bookingData.userId,
          product_id: bookingData.productId,
          product_type: 'tagihan_ekstra',
          amount: facilityAmount,
          status: 'PENDING_APPROVAL',
          resident_status_id: residentStatusId,
          metadata: {
            ...bookingData.metadata, // Spread full metadata for consistency
            billName: `Fasilitas: ${bookingData.metadata?.kostName || 'Kost'} (Bundled)`,
            type: 'tagihan_ekstra',
            is_bundled: true,
            booking_session_id: bookingSessionId,
            parent_order_id: rentTrx.id,
            resident_status_id: residentStatusId,
            createdAt: getCurrentDate().toISOString()
          }
        }]);
    }

    const data = rentTrx;
    
    // Notify Mitra (Owner) via WhatsApp & App
    try {
        const { data: prop } = await supabase
            .from('properties')
            .select('owner_uid, title')
            .eq('id', bookingData.productId)
            .single();

        const { data: sender } = await supabase
            .from('users')
            .select('name')
            .eq('id', bookingData.userId)
            .maybeSingle();

        if (prop) {
            await notifyMitra({
                ownerId: prop.owner_uid,
                propertyId: bookingData.productId,
                type: 'booking',
                details: {
                    propertyTitle: prop.title,
                    senderName: sender?.name || 'Calon Penghuni',
                    period: bookingData.metadata?.periodLabel || 'Per Bulan',
                    bookingId: data.id,
                    roomType: bookingData.metadata?.roomType || '-',
                    occupants: bookingData.metadata?.occupantCount || 1,
                    startDate: bookingData.metadata?.startDate || '-',
                    amount: "Rp " + (bookingData.amount || 0).toLocaleString('id-ID')
                }
            });
        }
    } catch (err: any) {
        console.error('Failed to notify mitra of new booking:', err);
    }

    // Notify admin (Email)
    notifyAdminTransaction("Pemesanan Kost (Booking)", {
      "User ID": bookingData.userId,
      "Tipe Produk": bookingData.productType,
      "Total Bayar": `Rp ${bookingData.amount.toLocaleString('id-ID')}`,
    });

    return data;
  } catch (error) {
    console.error('Error creating booking request:', error);
    throw error;
  }
}

export async function updateBookingStatus(transactionId: string, status: 'PAID' | 'REJECTED' | 'CANCELLED' | string): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ 
        status, 
        updated_at: getCurrentDate().toISOString() 
      })
      .eq('id', transactionId);

    if (error) throw error;

    // If Payment is PAID (Verified), notify Owner
    if (status === 'PAID') {
        try {
            const { data: trx } = await supabase
                .from('transactions')
                .select('*, user:user_id(name)')
                .eq('id', transactionId)
                .single();

            if (trx) {
                const { data: prop } = await supabase
                    .from('properties')
                    .select('owner_uid, title')
                    .eq('id', trx.product_id)
                    .single();

                if (prop) {
                    await notifyMitra({
                        ownerId: prop.owner_uid,
                        propertyId: trx.product_id,
                        type: 'payment',
                        details: {
                            propertyTitle: prop.title,
                            amount: "Rp " + (trx.amount || 0).toLocaleString('id-ID'),
                            bookingId: trx.id,
                            senderName: trx.user?.name || trx.metadata?.tenantName || 'Penyewa',
                            roomType: trx.metadata?.roomType || '-',
                            period: trx.metadata?.periodLabel || trx.metadata?.period || '-',
                            startDate: trx.metadata?.startDate || '-',
                            endDate: trx.metadata?.endDate || '-'
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Failed to notify mitra of successful payment:', err);
        }
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}

export const BOOKING_EXPIRY_HOURS = 24;

export async function expireBookingTransaction(transactionId: string, residentStatusId?: string): Promise<void> {
  try {
    const nowIso = getCurrentDate().toISOString();
    
    // 1. Panggil Edge Function untuk bypass RLS
    try {
      await supabase.functions.invoke('cancel-booking', {
        body: { 
          transactionId, 
          residentStatusId,
          action: 'expire' 
        }
      });
    } catch (edgeErr) {
      console.warn('Edge function invoke fallback:', edgeErr);
    }

    // 2. Client-side update sebagai fallback/redundansi
    await supabase
      .from('transactions')
      .update({ 
        status: 'EXPIRED', 
        updated_at: nowIso 
      })
      .eq('id', transactionId);

    // Expire child transactions if any
    try {
      await supabase
        .from('transactions')
        .update({ 
          status: 'EXPIRED', 
          updated_at: nowIso 
        })
        .filter('metadata->>parent_order_id', 'eq', transactionId);
    } catch (_) {}

    // Update resident_status
    if (residentStatusId) {
      await supabase
        .from('resident_status')
        .update({ 
          status: 'EXPIRED', 
          updated_at: nowIso 
        })
        .eq('id', residentStatusId);
    } else {
      const { data: trx } = await supabase
        .from('transactions')
        .select('resident_status_id')
        .eq('id', transactionId)
        .maybeSingle();

      if (trx?.resident_status_id) {
        await supabase
          .from('resident_status')
          .update({ 
            status: 'EXPIRED', 
            updated_at: nowIso 
          })
          .eq('id', trx.resident_status_id);
      }
    }
  } catch (error) {
    console.error('Error expiring booking transaction:', error);
  }
}


export async function createStandaloneBill(billData: {
  userId: string;
  productId: string;
  amount: number;
  billName: string;
  metadata?: any;
}) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: billData.userId,
        product_id: billData.productId,
        product_type: 'tagihan_ekstra',
        amount: billData.amount,
        status: 'AWAITING_PAYMENT',
        metadata: {
          ...billData.metadata,
          billName: billData.billName,
          type: 'tagihan_ekstra',
          createdAt: getCurrentDate().toISOString()
        }
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating standalone bill:', error);
    throw error;
  }
}

export async function settlePendingBills(billIds: string[]) {
  try {
    if (!billIds || billIds.length === 0) return;
    
    // Filter out virtual IDs (like 'v-fac-1') which are not UUIDs
    const realTrxIds = billIds.filter(id => !id.startsWith('v-'));
    if (realTrxIds.length === 0) return;

    const { error } = await supabase
      .from('transactions')
      .update({ 
        status: 'PAID',
        updated_at: getCurrentDate().toISOString() 
      })
      .in('id', realTrxIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error settling pending bills:', error);
    throw error;
  }
}

export async function cancelBookingRequest(transactionId: string, sessionId?: string) {
  try {
    const nowIso = getCurrentDate().toISOString();

    // 1. Panggil Edge Function untuk bypass RLS (Service Role)
    try {
      const { data: edgeRes, error: edgeErr } = await supabase.functions.invoke('cancel-booking', {
        body: {
          transactionId,
          sessionId,
          action: 'cancel'
        }
      });
      if (!edgeErr && edgeRes?.success) {
        return { success: true };
      }
    } catch (edgeErr) {
      console.warn('Edge function invoke fallback for cancelBookingRequest:', edgeErr);
    }

    // 2. Client-side update sebagai fallback
    const { error } = await supabase
      .from('transactions')
      .update({ 
        status: 'CANCELLED',
        updated_at: nowIso 
      })
      .eq('id', transactionId);

    if (error) console.warn('Direct client update warning for transactions:', error);

    // Also cancel any child transactions
    try {
      await supabase
        .from('transactions')
        .update({ 
          status: 'CANCELLED',
          updated_at: nowIso 
        })
        .filter('metadata->>parent_order_id', 'eq', transactionId);
    } catch (_) {}

    if (sessionId) {
      // Also cancel any split or companion bills belonging to the same booking session
      await supabase
        .from('transactions')
        .update({ 
          status: 'CANCELLED',
          updated_at: nowIso 
        })
        .filter('metadata->>booking_session_id', 'eq', sessionId);
    }

    // Update linked resident_status jika ada
    try {
      await supabase
        .from('resident_status')
        .update({
          status: 'CANCELLED',
          updated_at: nowIso
        })
        .or(`last_transaction_id.eq.${transactionId},id.eq.${transactionId}`);
    } catch (_) {}

    return { success: true };
  } catch (error) {
    console.error('Error cancelling booking request:', error);
    throw error;
  }
}

export async function getOwnerTenancyData(ownerUid: string): Promise<any[]> {
  try {
    // 1. Get all property IDs owned by this Mitra
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id')
      .eq('owner_uid', ownerUid);

    if (propError) throw propError;
    if (!properties || properties.length === 0) return [];

    const propertyIds = properties.map(p => p.id);

    // 2. Fetch all transactions related to these properties
    // We fetch bookings (kost_booking), extensions (perpanjangan_sewa), and bills (tagihan_ekstra)
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        user:user_id (
          name,
          email,
          phone,
          photo_url,
          gender,
          occupation,
          institution,
          religion,
          relationship_status,
          address
        )
      `)
      .in('product_id', propertyIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Filter to only successful or pending processing transactions that are rent-related
    const rentTypes = ['kost_booking', 'perpanjangan_sewa', 'tagihan_ekstra', 'kost'];
    // Clean paths for users
    const filtered = (data || []).map(t => {
      if (t.user) {
        t.user.photo_url = ensureAbsoluteUrl(t.user.photo_url, 'profile-photos');
      }
      return t;
    }).filter(t => {
      const type = t.product_type || t.type;
      const status = t.status?.toUpperCase();
      const validStatuses = ['PAID', 'SUCCESS', 'COMPLETED', 'BERHASIL', 'LUNAS'];
      return rentTypes.includes(type) && validStatuses.includes(status);
    });

    return filtered;
  } catch (error) {
    console.error('Error fetching owner tenancy data:', error);
    return [];
  }
}

export async function getOwnerProperties(ownerUid: string): Promise<Kost[]> {
  try {
    const { data: directProps, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_uid', ownerUid)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    let allProps = directProps || [];
    const directIds = new Set(allProps.map(p => p.id));

    // Also check if user has KostManager requests with linked property_id
    try {
      const { data: kmReqs } = await supabase
        .from('kostmanager_requests')
        .select('property_id')
        .eq('user_id', ownerUid)
        .not('property_id', 'is', null);

      const extraIds = (kmReqs || [])
        .map((r: any) => r.property_id)
        .filter((id: string) => id && !directIds.has(id));

      if (extraIds.length > 0) {
        const { data: extraProps } = await supabase
          .from('properties')
          .select('*')
          .in('id', extraIds);
        if (extraProps && extraProps.length > 0) {
          allProps = [...allProps, ...extraProps];
        }
      }
    } catch (kmE) {
      console.warn("getOwnerProperties: KM fallback error", kmE);
    }

    if (!allProps || allProps.length === 0) return [];

    return allProps.map((row) => {
      const rawImages = row.image_urls || [];
      const images = rawImages.map(getDisplayImageUrl).filter((u: string) => u !== '');
      const photosMeta = (row.metadata?.photos_meta || rawImages).map(getDisplayImageObject).filter(Boolean) as ImageUrlObject[];

      const rawVideos = row.video_urls || [];
      const videos = rawVideos.map(getDisplayVideoUrl).filter((u: string) => u !== '');

      const photoCategories = row.photo_categories || row.photoCategories || (row.metadata && (row.metadata.photo_categories || row.metadata.photoCategories)) || [];
      const categorizedPhotos = row.categorized_photos || row.categorizedPhotos || (row.metadata && (row.metadata.categorized_photos || row.metadata.categorizedPhotos)) || {};

      return {
        id: row.id,
        ownerUid: row.owner_uid,
        title: row.title || 'Tanpa Nama',
        description: row.description || '',
        price: row.price || 0,
        facilities: row.facilities || [],
        address: row.address || '',
        province: row.province || row.metadata?.province || '',
        city: row.city || '',
        area: row.area || '',
        type: row.type || 'Campur',
        status: row.status || 'published',
        isVerified: row.is_verified ?? false,
        isManaged: row.is_managed ?? false,
        rating: row.rating || 0,
        location: row.location || { lat: 0, lng: 0 },
        imageUrls: images,
        photosMeta,
        videoUrls: videos,
        instagramUrl: row.instagram_url || '',
        tiktokUrl: row.tiktok_url || '',
        roomTypes: row.room_types || [],
        reviews: row.reviews || [],
        rules: row.rules || [],
        campuses: row.campuses || [],
        publicFacilities: row.public_facilities || [],
        virtualTourUrl: row.virtual_tour_url || '',
        createdAt: convertTimestamp(row.created_at),
        updatedAt: convertTimestamp(row.updated_at),
        views: row.views || 0,
        additionalFeePrice: row.additional_fee_price,
        additionalFeeName: row.additional_fee_name,
        additionalFeeStartsFrom: row.additional_fee_starts_from,
        omnichannelContactName: row.omnichannel_contact_name,
        omnichannelContactPhone: row.omnichannel_contact_phone,
        omnichannelContactType: row.omnichannel_contact_type,
        managed_by: row.managed_by || row.metadata?.managed_by || (row.is_managed ? 'kostmanager' : 'self'),
        photoCategories,
        categorizedPhotos,
        metadata: row.metadata || {},
      } as Kost;
    });
  } catch (error: any) {
    console.error('Error fetching owner properties:', error);
    return [];
  }
}

export async function getOwnerBookings(ownerId: string): Promise<any[]> {
  try {
    // 1. Get properties owned by this Mitra
    const { data: props } = await supabase
      .from('properties')
      .select('id')
      .eq('owner_uid', ownerId);
    
    if (!props || props.length === 0) return [];
    const propIds = props.map(p => p.id);

    // 2. Fetch all transactions for these properties
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        user:user_id (
          name,
          photo_url,
          occupation,
          institution,
          gender,
          religion,
          relationship_status,
          address
        )
      `)
      .in('product_id', propIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!transactions || transactions.length === 0) return [];

    // 3. Manual Join for Property details (Batch fetch)
    const uniquePropIds = [...new Set(transactions.map((t: any) => t.product_id))];
    const { data: propertyInfos } = await supabase
      .from('properties')
      .select('id, title, image_urls')
      .in('id', uniquePropIds);

    // Create a map for quick lookup
    const propMap = (propertyInfos || []).reduce((acc: any, p: any) => {
      acc[p.id] = p;
      return acc;
    }, {});

    // Attach property info to transactions and ensure robust fallbacks
    return transactions.map((t: any) => {
      const mergedProperty = propMap[t.product_id] || null;
      
      // Build robust user object
      const userProfile = {
        ...(t.user || {}),
        name: t.user?.name || 
              t.metadata?.userName || 
              t.metadata?.user_name || 
              t.metadata?.displayName || 
              t.metadata?.fullName || 
              t.metadata?.tenant_name || 
              t.metadata?.name || 
              'Calon Penghuni',
        photo_url: ensureAbsoluteUrl(t.user?.photo_url || t.metadata?.userPhoto || t.metadata?.user_photo || t.metadata?.photoUrl, 'profile-photos') || null
      };

      // Build robust property object
      const rawPropertyImages = mergedProperty?.image_urls || t.metadata?.imageUrls || t.metadata?.image_urls || [];
      const resolvedPropertyImages = (Array.isArray(rawPropertyImages) ? rawPropertyImages : [])
        .map(img => ensureAbsoluteUrl(typeof img === 'string' ? img : (img.webp || img.original || ''), 'properties'))
        .filter(url => !!url);

      const propertyInfo = {
        ...(mergedProperty || {}),
        title: mergedProperty?.title || t.metadata?.kostName || t.metadata?.kost_name || 'Unit Kost',
        image_urls: resolvedPropertyImages
      };

      return {
        ...t,
        amount: Number(t.amount) || 0,
        user: userProfile,
        property: propertyInfo
      };
    });
  } catch (err) {
    console.error('Error fetching owner bookings:', err);
    return [];
  }
}

export async function incrementPropertyView(propertyId: string, viewerUid?: string) {
  try {
    if (!propertyId) return;

    // 1. Anti-spam per browser session agar tidak mencatat dobel saat refresh berulang
    const sessionKey = `viewed_kost_${propertyId}`;
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, '1');
    }

    const todayStr = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // 2. Ambil data properti saat ini
    const { data: prop, error: fetchError } = await supabase
      .from('properties')
      .select('id, views, owner_uid, metadata')
      .eq('id', propertyId)
      .maybeSingle();

    if (fetchError || !prop) return;

    // Abaikan kunjungan jika yang melihat adalah pemilik kost itu sendiri
    if (viewerUid && prop.owner_uid === viewerUid) return;

    const newViews = Number(prop.views || 0) + 1;
    const meta = typeof prop.metadata === 'object' && prop.metadata !== null ? { ...prop.metadata } : {};
    const dailyViews = typeof meta.daily_views === 'object' && meta.daily_views !== null ? { ...meta.daily_views } : {};
    
    dailyViews[todayStr] = Number(dailyViews[todayStr] || 0) + 1;

    // Bersihkan tanggal yang lebih dari 60 hari lalu agar metadata tetap ramping
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const cutoffStr = sixtyDaysAgo.toISOString().split('T')[0];
    for (const dKey of Object.keys(dailyViews)) {
      if (dKey < cutoffStr) delete dailyViews[dKey];
    }

    meta.daily_views = dailyViews;

    // 3. Simpan pembaruan views dan metadata ke Supabase
    await supabase
      .from('properties')
      .update({
        views: newViews,
        metadata: meta
      })
      .eq('id', propertyId);
  } catch (error) {
    // Silent fail agar tidak mengganggu rendering UI user
    console.warn('View counter increment failed (non-critical):', error);
  }
}

export interface PropertyReportPayload {
  propertyId: string;
  propertyName?: string;
  reporterId?: string;
  reporterName: string;
  reporterPhone: string;
  category: string;
  categoryLabel?: string;
  description: string;
  evidenceUrls?: string[];
}

export async function uploadReportEvidence(file: File, propertyId: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const cleanFileName = `report_${propertyId.substring(0, 8)}_${timestamp}.webp`;
    const filePath = `reports/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('properties')
      .upload(filePath, file, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.warn('Upload to properties bucket failed, trying survey-photos fallback:', uploadError.message);
      const { error: fallbackError } = await supabase.storage
        .from('survey-photos')
        .upload(filePath, file, { contentType: 'image/webp', upsert: true });
      if (fallbackError) throw fallbackError;
      return supabase.storage.from('survey-photos').getPublicUrl(filePath).data.publicUrl;
    }

    return supabase.storage.from('properties').getPublicUrl(filePath).data.publicUrl;
  } catch (err: any) {
    console.error('Failed uploading report evidence:', err);
    throw new Error('Gagal mengunggah foto bukti: ' + (err.message || err));
  }
}

export async function submitPropertyReport(payload: PropertyReportPayload): Promise<void> {
  const now = getCurrentDate().toISOString();
  
  const insertData = {
    property_id: payload.propertyId,
    reporter_id: payload.reporterId || null,
    reporter_name: payload.reporterName,
    reporter_phone: payload.reporterPhone,
    category: payload.category,
    description: payload.description,
    evidence_urls: payload.evidenceUrls || [],
    status: 'pending',
    created_at: now,
    updated_at: now
  };

  const { error } = await supabase
    .from('property_reports')
    .insert([insertData]);

  if (error) {
    console.warn('Inserting into property_reports table returned notice/fallback:', error.message);
    // If the table property_reports isn't created in Supabase yet, we fallback to complaints table with type 'property_report'
    const fallbackData = {
      user_id: payload.reporterId || null,
      user_name: payload.reporterName,
      user_phone: payload.reporterPhone,
      kost_id: payload.propertyId,
      kost_name: payload.propertyName || 'Listing Properti',
      title: `[Laporan Properti] ${payload.propertyName || 'Kost'}`,
      category: `REPORT: ${payload.category}`,
      description: `[ADUAN LISTING] ${payload.description}`,
      photo_url: payload.evidenceUrls?.[0] || null,
      status: 'open',
      created_at: now,
      updated_at: now
    };
    const { error: fallbackErr } = await supabase.from('complaints').insert([fallbackData]);
    if (fallbackErr) {
      console.error('Fallback insert into complaints also failed:', fallbackErr);
      throw error;
    }
  }
}

// ── RIWAYAT TRANSAKSI KOMPREHENSIF (5 KATEGORI) ─────────────────────────────
export interface NormalizedTransaction {
  id: string;
  invoiceNumber: string;
  category: 'booking' | 'extension' | 'facility' | 'survey' | 'database' | 'other';
  categoryLabel: string;
  categoryBadgeClass: string;
  title: string;
  subtitle: string;
  description?: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'FAILED';
  statusLabel: string;
  statusBadgeClass: string;
  paymentMethod: string;
  pakasirOrderId?: string;
  pakasirLink?: string;
  createdAt: string;
  updatedAt: string;
  productId?: string;
  metadata: any;
  propertyTitle?: string;
  roomNumber?: string;
  billingPeriod?: string;
  periodStart?: string;
  periodEnd?: string;
  extraFee?: number;
  extraFeeName?: string;
  propertyImage?: string;
}

export async function getUserAllTransactionsHistory(userId: string): Promise<NormalizedTransaction[]> {
  if (!userId) return [];

  try {
    // 1. Ambil seluruh transaksi milik user ini dari tabel transactions
    const { data: rawTrxs, error: trxErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (trxErr) {
      console.error('[userService] Error fetching transactions:', trxErr);
      throw trxErr;
    }

    if (!rawTrxs || rawTrxs.length === 0) return [];

    // 2. Kumpulkan product_id untuk fetch detail properti terkait (jika ada)
    const propertyIds = Array.from(
      new Set(
        rawTrxs
          .map((t: any) => {
            const meta = typeof t.metadata === 'string' ? JSON.parse(t.metadata || '{}') : (t.metadata || {});
            return t.product_id || t.kost_id || meta.kostId || meta.propertyId;
          })
          .filter(Boolean)
      )
    );

    let propMap: Record<string, any> = {};
    if (propertyIds.length > 0) {
      const { data: props } = await supabase
        .from('properties')
        .select('id, title, address, image_urls, city, area')
        .in('id', propertyIds);

      if (props) {
        props.forEach((p: any) => {
          propMap[p.id] = p;
        });
      }
    }

    // 3. Normalisasi setiap transaksi ke dalam struktur seragam
    const normalized: NormalizedTransaction[] = rawTrxs.map((t: any) => {
      const meta = typeof t.metadata === 'string' ? JSON.parse(t.metadata || '{}') : (t.metadata || {});
      const pType = (t.product_type || t.type || meta.product_type || '').toLowerCase();
      const rawStatus = (t.status || 'PENDING').toUpperCase();

      // Normalisasi Status
      let status: 'PAID' | 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'FAILED' = 'PENDING';
      let statusLabel = 'Menunggu Pembayaran';
      let statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

      if (['PAID', 'SUCCESS', 'SETTLEMENT', 'BERHASIL', 'SELESAI', 'APPROVED'].includes(rawStatus)) {
        status = 'PAID';
        statusLabel = 'Lunas / Selesai';
        statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      } else if (rawStatus === 'EXPIRED') {
        status = 'EXPIRED';
        statusLabel = 'Kedaluwarsa';
        statusBadgeClass = 'bg-gray-100 text-gray-600 border-gray-200';
      } else if (['CANCELLED', 'DIBATALKAN'].includes(rawStatus)) {
        status = 'CANCELLED';
        statusLabel = 'Dibatalkan';
        statusBadgeClass = 'bg-rose-50 text-rose-600 border-rose-200';
      } else if (['REJECTED', 'FAILED', 'GAGAL'].includes(rawStatus)) {
        status = 'FAILED';
        statusLabel = 'Gagal / Ditolak';
        statusBadgeClass = 'bg-red-50 text-red-600 border-red-200';
      }

      // Hubungkan info properti
      const relatedPropId = t.product_id || t.kost_id || meta.kostId || meta.propertyId;
      const propInfo = relatedPropId ? propMap[relatedPropId] : null;
      const propTitle = propInfo?.title || meta.propertyTitle || meta.kostName || meta.title || '';
      const propImg = propInfo?.image_urls?.[0] ? getDisplayImageUrl(propInfo.image_urls[0]) : '';

      // Tentukan Kategori Transaksi dari 5 Kategori Baku
      let category: 'booking' | 'extension' | 'facility' | 'survey' | 'database' | 'other' = 'other';
      let categoryLabel = 'Transaksi Lainnya';
      let categoryBadgeClass = 'bg-gray-50 text-gray-700 border-gray-200';
      let title = propTitle || 'Transaksi RuangSinggah';
      let subtitle = 'Pembayaran Layanan';

      if (['database', 'database_access', 'product', 'produk_database'].includes(pType)) {
        category = 'database';
        categoryLabel = 'Database Kontak Kost';
        categoryBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        title = meta.productName || meta.title || meta.packageName || 'Akses Database Kontak Kost';
        subtitle = 'Akses Lengkap Kontak Pemilik Kost Terverifikasi';
      } else if (['survey', 'survey_order', 'survey_booking', 'jasa_survey'].includes(pType) || (Number(t.amount) === 70000 && !pType.includes('kost'))) {
        category = 'survey';
        categoryLabel = 'Jasa Survey Lokasi';
        categoryBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
        title = propTitle || meta.surveyKostName || meta.kost_name || 'Jasa Survey Lapangan Kost';
        subtitle = `Lokasi: ${meta.location || meta.address || propInfo?.city || 'Makassar'} • Surveyor Resmi`;
      } else if (['perpanjangan_sewa', 'extension', 'rent_extension', 'renewal'].includes(pType)) {
        category = 'extension';
        categoryLabel = 'Perpanjangan Sewa';
        categoryBadgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        title = propTitle || 'Perpanjangan Masa Sewa Kost';
        const roomName = meta.roomNumber || meta.roomCategory || '1';
        const period = meta.extensionPeriod || meta.billingPeriod || meta.periodLabel || '1 Bulan';
        subtitle = `Unit Kamar ${roomName} • Durasi Perpanjangan: ${period}`;
      } else if (['tagihan_ekstra', 'facility_bill', 'extra_occupant', 'facility', 'bill'].includes(pType) || meta.billPayment === true) {
        category = 'facility';
        categoryLabel = 'Tagihan Fasilitas Khusus';
        categoryBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
        const billName = meta.extraFeeName || meta.billName || meta.facilityName || 'Tagihan Fasilitas / Ekstra Penghuni';
        title = billName;
        subtitle = `${propTitle || 'Unit Kost'} • Kamar ${meta.roomNumber || '-'}`;
      } else if (['kost_booking', 'rent', 'kost', 'sewa', 'booking', 'dp'].includes(pType)) {
        category = 'booking';
        categoryLabel = 'Sewa Kost Baru (DP)';
        categoryBadgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
        title = propTitle || 'Penyewaan Kamar Kost';
        const roomName = meta.roomNumber || meta.roomCategory || '1';
        const period = meta.periodLabel || meta.period || 'Bulanan';
        subtitle = `Unit Kamar ${roomName} • Periode Sewa: ${period}`;
      }

      const invoiceNumber = t.id ? `INV-${t.id.substring(0, 8).toUpperCase()}` : `INV-${Date.now().toString().slice(-8)}`;

      return {
        id: t.id,
        invoiceNumber,
        category,
        categoryLabel,
        categoryBadgeClass,
        title,
        subtitle,
        description: meta.description || meta.note || '',
        amount: Number(t.amount || 0),
        status,
        statusLabel,
        statusBadgeClass,
        paymentMethod: (t.payment_method || meta.payment_method || meta.paymentType || 'QRIS / Payment Gateway').toUpperCase(),
        pakasirOrderId: t.pakasir_order_id,
        pakasirLink: t.pakasir_link,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        productId: relatedPropId,
        metadata: meta,
        propertyTitle: propTitle,
        roomNumber: meta.roomNumber || meta.roomCategory,
        billingPeriod: meta.periodLabel || meta.billingPeriod,
        periodStart: meta.startDate || meta.newPeriodStart || meta.moveInDate,
        periodEnd: meta.endDate || meta.newPeriodEnd,
        extraFee: Number(meta.extraFee || meta.extraPersonFee || 0),
        extraFeeName: meta.extraFeeName,
        propertyImage: propImg
      };
    });

    return normalized;
  } catch (err) {
    console.error('[userService] Exception in getUserAllTransactionsHistory:', err);
    return [];
  }
}

export interface UserRentalHistoryItem {
  id: string;
  kostId: string;
  kostTitle: string;
  kostSlug?: string;
  kostAddress: string;
  kostCity: string;
  kostImage: string;
  roomNumber: string;
  roomType: string;
  startDate: string | null;
  endDate: string | null;
  rentPackage: string;
  price: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CHECKED_OUT' | 'PENDING';
  statusLabel: string;
  statusBadgeClass: string;
  isCurrentlyActive: boolean;
  createdAt: string;
  notes?: string;
}

export async function getUserRentalHistory(userId: string): Promise<UserRentalHistoryItem[]> {
  try {
    if (!userId) return [];

    // 1. Fetch Resident Status
    const { data: statusData, error: statusErr } = await supabase
      .from('resident_status')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (statusErr) console.error('[userService] getUserRentalHistory status error:', statusErr);

    // 2. Fetch rent transactions for any booking not yet linked to resident_status
    const { data: rentTrxData, error: trxErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['PAID', 'PENDING', 'SETTLEMENT', 'SUCCESS'])
      .order('created_at', { ascending: false });

    if (trxErr) console.error('[userService] getUserRentalHistory trx error:', trxErr);

    const residentList = statusData || [];
    const validRentTrxs = (rentTrxData || []).filter((t: any) => {
      const pType = (t.product_type || t.type || '').toLowerCase();
      return ['rent', 'kost_booking', 'kost', 'sewa', 'dp'].includes(pType) || t.category === 'kost';
    });

    // 3. Collect unique property IDs
    const propIdSet = new Set<string>();
    residentList.forEach((r: any) => {
      if (r.kost_id) propIdSet.add(r.kost_id);
    });
    validRentTrxs.forEach((t: any) => {
      const meta = typeof t.metadata === 'object' && t.metadata !== null ? t.metadata : {};
      const kId = t.product_id || t.kost_id || meta.kostId || meta.propertyId;
      if (kId) propIdSet.add(kId);
    });

    // 4. Fetch property details
    const propMap: Record<string, any> = {};
    if (propIdSet.size > 0) {
      const { data: props, error: propErr } = await supabase
        .from('properties')
        .select('id, title, slug, address, city, area, image_urls, price, room_types')
        .in('id', Array.from(propIdSet));

      if (!propErr && props) {
        props.forEach((p: any) => {
          propMap[p.id] = p;
        });
      }
    }

    const items: UserRentalHistoryItem[] = [];
    const now = new Date();

    // Process resident_status records first
    residentList.forEach((r: any) => {
      const prop = r.kost_id ? propMap[r.kost_id] : null;
      const meta = typeof r.metadata === 'object' && r.metadata !== null ? r.metadata : {};
      const endDate = r.end_date ? new Date(r.end_date) : null;
      const rawStatus = (r.status || 'ACTIVE').toUpperCase();
      
      const isCurrentlyActive = (rawStatus === 'ACTIVE' || rawStatus === 'PAID') && (!endDate || endDate >= now);
      
      let status: 'ACTIVE' | 'COMPLETED' | 'CHECKED_OUT' | 'PENDING' = isCurrentlyActive ? 'ACTIVE' : 'COMPLETED';
      let statusLabel = isCurrentlyActive ? 'Aktif Dihuni' : 'Selesai / Pernah Dihuni';
      let statusBadgeClass = isCurrentlyActive 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
        : 'bg-gray-100 text-gray-700 border-gray-200';

      if (rawStatus === 'CHECKED_OUT' || rawStatus === 'COMPLETED') {
        status = 'COMPLETED';
        statusLabel = 'Selesai / Pernah Dihuni';
        statusBadgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
      }

      const img = prop?.image_urls?.[0] ? getDisplayImageUrl(prop.image_urls[0]) : '';
      const roomNum = r.room_number || meta.roomNumber || meta.room_number || (meta.roomCategory ? `Kamar ${meta.roomCategory}` : '1');
      const roomType = r.room_type || meta.roomType || meta.room_type || prop?.room_types?.[0]?.name || 'Standar';

      items.push({
        id: r.id,
        kostId: r.kost_id,
        kostTitle: prop?.title || meta.kostName || meta.propertyTitle || 'Kost RuangSinggah',
        kostSlug: prop?.slug || '',
        kostAddress: prop?.address || meta.address || '',
        kostCity: prop?.city || meta.city || 'Makassar',
        kostImage: img,
        roomNumber: String(roomNum),
        roomType: String(roomType),
        startDate: r.start_date || meta.startDate || null,
        endDate: r.end_date || meta.endDate || null,
        rentPackage: meta.paketSewa || meta.period || meta.periodLabel || 'Bulanan',
        price: Number(meta.price || meta.monthlyPrice || prop?.price || 0),
        status,
        statusLabel,
        statusBadgeClass,
        isCurrentlyActive,
        createdAt: r.created_at || new Date().toISOString(),
        notes: r.notes || meta.notes
      });
    });

    // Process standalone booking transactions not in resident_status
    const existingResidentKostIds = new Set(residentList.map((r: any) => r.kost_id));
    validRentTrxs.forEach((t: any) => {
      const meta = typeof t.metadata === 'object' && t.metadata !== null ? t.metadata : {};
      const kId = t.product_id || t.kost_id || meta.kostId || meta.propertyId;
      if (!kId || existingResidentKostIds.has(kId)) return; // Avoid duplication

      const prop = propMap[kId];
      const img = prop?.image_urls?.[0] ? getDisplayImageUrl(prop.image_urls[0]) : '';
      const isPaid = ['PAID', 'SETTLEMENT', 'SUCCESS'].includes((t.status || '').toUpperCase());
      const roomNum = meta.roomNumber || meta.roomCategory || '1';
      const roomType = meta.roomType || prop?.room_types?.[0]?.name || 'Standar';

      items.push({
        id: t.id,
        kostId: kId,
        kostTitle: prop?.title || meta.propertyTitle || meta.kostName || 'Kost RuangSinggah',
        kostSlug: prop?.slug || '',
        kostAddress: prop?.address || meta.address || '',
        kostCity: prop?.city || meta.city || 'Makassar',
        kostImage: img,
        roomNumber: String(roomNum),
        roomType: String(roomType),
        startDate: meta.startDate || meta.moveInDate || null,
        endDate: meta.endDate || null,
        rentPackage: meta.periodLabel || meta.period || 'Bulanan',
        price: Number(t.amount || prop?.price || 0),
        status: isPaid ? 'COMPLETED' : 'PENDING',
        statusLabel: isPaid ? 'Pernah Disewa (Selesai)' : 'Menunggu Pembayaran',
        statusBadgeClass: isPaid ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-amber-50 text-amber-700 border-amber-200',
        isCurrentlyActive: false,
        createdAt: t.created_at || new Date().toISOString()
      });
    });

    // Hanya kembalikan riwayat sewa yang sudah selesai/lewat masa sewa (bukan yang aktif saat ini)
    const pastRentalItems = items.filter(item => !item.isCurrentlyActive && item.status !== 'PENDING');

    return pastRentalItems;
  } catch (err) {
    console.error('[userService] Exception in getUserRentalHistory:', err);
    return [];
  }
}


