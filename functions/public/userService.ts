import { supabase } from './supabase';
import { Kost, DatabaseProduct } from './types';
import { notifyAdminTransaction } from './emailService';

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
        omnichannelContactName: row.omnichannel_contact_name,
        omnichannelContactPhone: row.omnichannel_contact_phone,
        omnichannelContactType: row.omnichannel_contact_type,
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
      omnichannelContactName: row.omnichannel_contact_name,
      omnichannelContactPhone: row.omnichannel_contact_phone,
      omnichannelContactType: row.omnichannel_contact_type,
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
      .select('reviews')
      .eq('id', propertyId)
      .single();

    if (fetchError) throw fetchError;

    const currentReviews = property.reviews || [];
    const newReview = {
      ...review,
      date: new Date().toISOString()
    };
    const updatedReviews = [...currentReviews, newReview];

    // Calculate new average rating
    const totalRating = updatedReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
    const newAverageRating = Number((totalRating / updatedReviews.length).toFixed(1));

    // Use RPC to bypass RLS for rating/reviews update if necessary
    const { error: rpcError } = await supabase.rpc('submit_property_review', {
      prop_id: propertyId,
      new_review: newReview, // RPC appends this to the array
      new_rating: newAverageRating
    });

    if (rpcError) throw rpcError;
    return { success: true };
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
      .eq('status', 'pending');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching extra bills:', error);
    return [];
  }
}
export async function createBookingRequest(bookingData: {
  userId: string;
  productId: string;
  productType: string;
  amount: number;
  metadata: any;
}) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: bookingData.userId,
        product_id: bookingData.productId,
        product_type: bookingData.productType,
        amount: bookingData.amount,
        status: 'PENDING_APPROVAL',
        metadata: bookingData.metadata
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Notify admin
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

export async function getOwnerProperties(ownerUid: string): Promise<Kost[]> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_uid', ownerUid)
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
        views: row.views || 0,
        createdAt: convertTimestamp(row.created_at),
        updatedAt: convertTimestamp(row.updated_at),
      } as Kost;
    });
  } catch (error) {
    console.error('Error fetching owner properties:', error);
    return [];
  }
}

export async function incrementPropertyView(propertyId: string) {
  try {
    const { error } = await supabase.rpc('increment_property_view', { prop_id: propertyId });
    // If RPC fails (e.g. not created yet), fallback to regular increment
    if (error) {
      const { data: prop } = await supabase.from('properties').select('views').eq('id', propertyId).single();
      const newViews = (prop?.views || 0) + 1;
      await supabase.from('properties').update({ views: newViews }).eq('id', propertyId);
    }
  } catch (error) {
    console.error('Error incrementing view:', error);
  }
}

export async function getOwnerBookings(ownerUid: string): Promise<any[]> {
  try {
    // First, get all property IDs owned by this Mitra
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id')
      .eq('owner_uid', ownerUid);

    if (propError) throw propError;
    if (!properties || properties.length === 0) return [];

    const propertyIds = properties.map(p => p.id);

    // Then, fetch transactions related to these properties
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
          institution
        )
      `)
      .in('product_id', propertyIds)
      .eq('product_type', 'kost_booking')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    return [];
  }
}

export async function updateBookingStatus(transactionId: string, status: 'PAID' | 'REJECTED' | 'CANCELLED' | string): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', transactionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}

export async function cancelBookingRequest(transactionId: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({ 
        status: 'CANCELLED', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error cancelling booking request:', error);
    throw error;
  }
}
