import { supabase } from './supabase';
import { Kost, DatabaseProduct } from './types';
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
const getDisplayImageUrl = (img: any): string => {
  if (!img) return '';
  if (typeof img === 'string') return ensureAbsoluteUrl(img, 'properties');
  const path = img.webp || img.original || img.thumbnail || '';
  return ensureAbsoluteUrl(path, 'properties');
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
        isManaged: row.is_managed ?? false,
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
        additionalFeeStartsFrom: row.additional_fee_starts_from,
        createdAt: convertTimestamp(row.created_at),
        updatedAt: convertTimestamp(row.updated_at),
        omnichannelContactName: row.omnichannel_contact_name,
        omnichannelContactPhone: row.omnichannel_contact_phone,
        omnichannelContactType: row.omnichannel_contact_type,
        photoCategories: row.photo_categories || row.photoCategories || [],
        categorizedPhotos: row.categorized_photos || row.categorizedPhotos || {},
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
      isManaged: row.is_managed ?? false,
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
      additionalFeePrice: row.additional_fee_price,
      additionalFeeName: row.additional_fee_name,
      additionalFeeStartsFrom: row.additional_fee_starts_from,
      omnichannelContactName: row.omnichannel_contact_name,
      omnichannelContactPhone: row.omnichannel_contact_phone,
      omnichannelContactType: row.omnichannel_contact_type,
      photoCategories: row.photo_categories || row.photoCategories || [],
      categorizedPhotos: row.categorized_photos || row.categorizedPhotos || {},
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
      date: getCurrentDate().toISOString()
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
        additionalFeePrice: row.additional_fee_price,
        additionalFeeName: row.additional_fee_name,
        additionalFeeStartsFrom: row.additional_fee_starts_from,
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

export async function incrementPropertyView(propertyId: string) {
  try {
    if (!propertyId) return;

    // 1. Try RPC first
    const { error: rpcError } = await supabase.rpc('increment_property_view', { 
      prop_id: propertyId 
    });

    // 2. Fallback to manual update if RPC is missing (404) or failed
    if (rpcError) {
      console.log("[DEBUG] RPC increment_property_view failed, trying manual update...", rpcError.message);
      
      const { data: prop, error: fetchError } = await supabase
        .from('properties')
        .select('views')
        .eq('id', propertyId)
        .maybeSingle();
        
      if (!fetchError && prop) {
        await supabase
          .from('properties')
          .update({ views: (prop.views || 0) + 1 })
          .eq('id', propertyId);
      }
    }
  } catch (error) {
    // Silent fail for view counter to not disrupt user experience
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
    console.error('Failed inserting property report into property_reports:', error);
    // If the table property_reports isn't created in Supabase yet, we fallback to complaints table with type 'property_report'
    const fallbackData = {
      user_id: payload.reporterId || null,
      user_name: payload.reporterName,
      user_phone: payload.reporterPhone,
      kost_id: payload.propertyId,
      kost_name: payload.propertyName || 'Listing Properti',
      category: `REPORT: ${payload.category}`,
      description: `[ADUAN LISTING] ${payload.description}`,
      photos: payload.evidenceUrls || [],
      status: 'pending',
      created_at: now,
      updated_at: now
    };
    const { error: fallbackErr } = await supabase.from('complaints').insert([fallbackData]);
    if (fallbackErr) throw error;
  }
}
