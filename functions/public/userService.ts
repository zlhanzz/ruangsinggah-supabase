import { supabase } from './supabase';
import { Kost, DatabaseProduct } from './types';

// Helper to safely convert timestamps
const convertTimestamp = (ts: any): string => {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') return ts;
  return ts;
};

// Helper to extract display URL from image object or string
// Prioritize WebP > Original > Thumbnail
const getDisplayImageUrl = (img: any): string => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  return img.webp || img.original || img.thumbnail || '';
};

// Helper to extract video URL
const getDisplayVideoUrl = (vid: any): string => {
  if (!vid) return '';
  if (typeof vid === 'string') return vid;
  return vid.original || '';
};

export async function getPublishedProperties(): Promise<Kost[]> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((row) => {
      const rawImages = row.image_urls || [];
      const images = rawImages.map(getDisplayImageUrl).filter((u: string) => u !== '');

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
        city: row.city || '',
        type: row.type || 'Campur',
        status: row.status || 'published',
        isVerified: row.is_verified ?? false,
        rating: row.rating || 0,
        location: row.location || { lat: 0, lng: 0 },
        imageUrls: images,
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
        createdAt: convertTimestamp(row.created_at),
        updatedAt: convertTimestamp(row.updated_at),
      } as Kost;
    });
  } catch (error: any) {
    console.error('Error fetching published properties:', error);
    return [];
  }
}

export async function getPublishedPropertyDetails(propertyId: string): Promise<Kost | null> {
  try {
    const { data: row, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('status', 'published')
      .single();

    if (error || !row) return null;

    const rawImages = row.image_urls || [];
    const images = rawImages.map(getDisplayImageUrl).filter((u: string) => u !== '');

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
      rating: row.rating || 0,
      location: row.location || { lat: 0, lng: 0 },
      imageUrls: images,
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
