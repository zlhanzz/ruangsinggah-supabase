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
import { notifyMitra } from './notificationBridge';
import { FORMAT_CURRENCY } from './constants';

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
    
    // Notify Mitra (Owner) via WhatsApp & App
    try {
        const { data: prop } = await supabase
            .from('properties')
            .select('owner_uid, title')
            .eq('id', bookingData.productId)
            .single();

        const { data: sender } = await supabase
            .from('users')
            .select('name, displayName')
            .eq('id', bookingData.userId)
            .single();

        if (prop) {
            await notifyMitra({
                ownerId: prop.owner_uid,
                propertyId: bookingData.productId,
                type: 'booking',
                details: {
                    propertyTitle: prop.title,
                    senderName: sender?.displayName || sender?.name || 'Calon Penghuni',
                    period: bookingData.metadata?.periodLabel || 'Per Bulan',
                    bookingId: data.id
                }
            });
        }
    } catch (err) {
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
        updated_at: new Date().toISOString() 
      })
      .eq('id', transactionId);

    if (error) throw error;

    // If Payment is PAID (Verified), notify Owner
    if (status === 'PAID') {
        try {
            const { data: trx } = await supabase
                .from('transactions')
                .select('product_id, amount, id')
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
                            amount: FORMAT_CURRENCY(trx.amount),
                            bookingId: trx.id
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
      .or(`product_id.in.(${propertyIds.join(',')}),kost_id.in.(${propertyIds.join(',')})`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Filter to only successful or pending processing transactions that are rent-related
    const rentTypes = ['kost_booking', 'perpanjangan_sewa', 'tagihan_ekstra'];
    const filtered = (data || []).filter(t => 
      rentTypes.includes(t.product_type || t.type) &&
      ['paid', 'PENDING_APPROVAL', 'AWAITING_PAYMENT', 'success', 'approved'].includes(t.status)
    );

    return filtered;
  } catch (error) {
    console.error('Error fetching owner tenancy data:', error);
    return [];
  }
}

export async function getOwnerProperties(ownerUid: string): Promise<Kost[]> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_uid', ownerUid)
      .order('created_at', { ascending: false });

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
        createdAt: convertTimestamp(row.created_at),
        updatedAt: convertTimestamp(row.updated_at),
        views: row.views || 0,
        omnichannelContactName: row.omnichannel_contact_name,
        omnichannelContactPhone: row.omnichannel_contact_phone,
        omnichannelContactType: row.omnichannel_contact_type,
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
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        user:user_id (
          name,
          email,
          phone,
          photo_url
        )
      `)
      .in('product_id', propIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching owner bookings:', err);
    return [];
  }
}

export async function incrementPropertyView(propertyId: string) {
  try {
    const { error } = await supabase.rpc('increment_property_view', { 
      prop_id: propertyId 
    });
    if (error) {
      // If RPC fails, try generic update as fallback
      const { data: prop } = await supabase
        .from('properties')
        .select('views')
        .eq('id', propertyId)
        .single();
        
      if (prop) {
        await supabase
          .from('properties')
          .update({ views: (prop.views || 0) + 1 })
          .eq('id', propertyId);
      }
    }
  } catch (error) {
    console.warn('Failed to increment view:', error);
  }
}
