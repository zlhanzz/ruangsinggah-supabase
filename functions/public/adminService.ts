import { supabase } from './supabase';
import { Kost, DatabaseProduct, ImageUrlObject, VideoUrlObject, SurveyRequest, Banner } from './types';
import { notifyAdminStatusUpdate } from './emailService';
import { ensureAbsoluteUrl } from './userService';

// ---- TYPE DEF ----
export interface BasicPropertyInfo extends Partial<Kost> {
  id: string;
  namaKost: string;
  status: 'draft' | 'published';
  address: string;
  area: string;
  imageUrls: string[];
  videoUrls?: string[];
  instagramUrl?: string;
  tiktokUrl?: string;
  ownerName?: string;
  ownerRole?: string;
}

export interface AdminTransaction {
  id: string;
  user_id: string;
  product_id: string;
  product_type: string;
  amount: number;
  status: string;
  payment_method: string;
  pakasir_order_id: string;
  pakasir_link: string;
  metadata: any;
  created_at: string;
  user: {
    name: string;
    email: string;
    phone: string;
    photo_url?: string;
    occupation?: string;
    institution?: string;
    gender?: string;
    religion?: string;
    relationship_status?: string;
  };
  database?: {
    campus: string;
    city: string;
    area: string;
    file_type: string;
    file_name: string;
    price: number;
  };
}

export interface AnalyticsSummary {
  totalUsers: number;
  totalRevenue: number;
  totalMitra: number;
  totalDatabases: number;
  kostStats: {
    users: number;
    active: number;
    revenue: number;
  };
  dbStats: {
    buyers: number;
    active: number;
    revenue: number;
  };
  verifStats: {
    orders: number;
    revenue: number;
  };
  trendData: any[];
}

// ---- HELPERS ----

// Get current user role
export async function getUserRole(uid: string): Promise<string> {
  if (!uid) return 'user';
  try {
    const { data, error } = await supabase.from('users').select('role, is_admin').eq('id', uid).single();
    if (error || !data) return 'user';
    if (data.role && data.role !== 'user') return data.role;
    if (data.is_admin === true) return 'admin';
    return 'user';
  } catch {
    return 'user';
  }
}

// Check if user is admin by querying the users table
export async function checkIfUserIsAdmin(uid: string): Promise<boolean> {
  if (!uid) return false;
  const role = await getUserRole(uid);
  return role === 'admin';
}

// Delete file from Supabase Storage using URL parsing
async function deleteFileFromStorage(fileUrl: string): Promise<void> {
  if (!fileUrl) return;
  try {
    // Supabase Storage URL format:
    // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/storage/v1/object/public/');
    if (pathParts.length < 2) return;
    const rest = pathParts[1];
    const slashIdx = rest.indexOf('/');
    if (slashIdx === -1) return;
    const bucket = rest.substring(0, slashIdx);
    const filePath = rest.substring(slashIdx + 1);
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) console.warn('Storage delete warning:', error.message);
  } catch (e) {
    console.warn('deleteFileFromStorage error (non-fatal):', e);
  }
}

// Upload survey photo
export async function uploadSurveyPhoto(file: File, surveyId: string): Promise<string> {
  try {
    const webpFile = await convertToWebP(file);
    const fileName = `evidence/${surveyId}/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
    
    const { error } = await supabase.storage
      .from('survey-photos')
      .upload(fileName, webpFile);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('survey-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading survey photo:', error);
    throw error;
  }
}

// Delete survey photo
export async function deleteSurveyPhoto(fileUrl: string): Promise<void> {
  await deleteFileFromStorage(fileUrl);
}

// Helper: Convert Image to WebP client-side
async function convertToWebP(file: File, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    // Only process jpeg and png images
    if (!file.type.match(/image\/(jpeg|jpg|png)/i)) {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        
        // Remove old extension and append .webp
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const webpFile = new File([blob], `${baseName}.webp`, {
          type: 'image/webp',
          lastModified: Date.now(),
        });
        resolve(webpFile);
      }, 'image/webp', quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fallback to original file if parsing fails
    };

    img.src = objectUrl;
  });
}

// Helper: Upload file to Supabase Storage, return public URL
async function uploadFileToStorage(
  file: File,
  bucket: string,
  pathPrefix: string
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: tidak ada user yang login.');

  // Convert to WebP if image
  const processedFile = await convertToWebP(file);

  let sanitizedFileName = processedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Ensure .webp extension if it was converted but somehow lost its name extension
  if (processedFile.type === 'image/webp' && !sanitizedFileName.toLowerCase().endsWith('.webp')) {
    sanitizedFileName += '.webp';
  }

  const fileName = `${Date.now()}_${sanitizedFileName}`;
  const fullPath = `${pathPrefix}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fullPath, processedFile, {
      contentType: processedFile.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);
  return urlData.publicUrl;
}

// Public Helper
export async function uploadFileAndGetURL(file: File, folderName: string): Promise<string> {
  return uploadFileToStorage(file, 'properties', folderName);
}

// ---- PROPERTY FUNCTIONS ----

export async function getAdminProperties(ownerUid?: string): Promise<BasicPropertyInfo[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Tidak ada admin yang login.');

  const isAdmin = await checkIfUserIsAdmin(user.id);

  let query = supabase.from('properties').select('*, users(name, full_name, role)');
  if (ownerUid) {
    query = query.eq('owner_uid', ownerUid);
  } else if (!isAdmin) {
    query = query.eq('owner_uid', user.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data) return [];

  return data.map((row) => {
    const rawImages = row.image_urls || [];
    const images: string[] = rawImages.map((img: any) =>
      typeof img === 'string' ? img : (img.webp || img.original || img.thumbnail || '')
    ).filter((u: string) => u !== '');

    const rawVideos = row.video_urls || [];
    const videos: string[] = rawVideos.map((vid: any) =>
      typeof vid === 'string' ? vid : (vid.original || '')
    ).filter((u: string) => u !== '');

    const ownerData = Array.isArray(row.users) ? row.users[0] : row.users;
    const isSystemId = ['super_admin_id', 'admin-system-id'].includes(row.owner_uid?.toLowerCase());

    return {
      id: row.id,
      namaKost: row.title || row.namaKost,
      status: row.status,
      address: row.address,
      imageUrls: images,
      videoUrls: videos,
      instagramUrl: row.instagram_url || '',
      tiktokUrl: row.tiktok_url || '',
      price: row.price || 0,
      city: row.city || '',
      area: row.area || '',
      type: row.type || 'Campur',
      ownerUid: row.owner_uid,
      title: row.title,
      description: row.description,
      location: row.location,
      facilities: row.facilities,
      roomTypes: row.room_types,
      rules: row.rules,
      campuses: row.campuses,
      publicFacilities: row.public_facilities,
      isVerified: row.is_verified,
      omnichannelContactName: row.omnichannel_contact_name,
      omnichannelContactPhone: row.omnichannel_contact_phone,
      ownerName: ownerData?.name || ownerData?.full_name || (isSystemId ? 'Super Admin' : `Tanpa Pemilik (${row.owner_uid?.substring(0,8)}...)`),
      ownerRole: ownerData?.role || (isSystemId ? 'admin' : 'owner'),
      } as BasicPropertyInfo;
  });
}

/**
 * Memindahkan kepemilikan properti ke Mitra baru
 */
export async function transferPropertyOwnership(propertyId: string, newOwnerId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Hanya Super Admin yang dapat mentransfer properti.');

  // Check current owner to prevent transferring to the same person
  const { data: currentProp, error: fetchError } = await supabase
    .from('properties')
    .select('owner_uid')
    .eq('id', propertyId)
    .single();

  if (fetchError || !currentProp) throw new Error('Properti tidak ditemukan.');
  
  if (currentProp.owner_uid === newOwnerId) {
    throw new Error('Properti ini sudah dimiliki oleh Mitra tersebut.');
  }

  const { error } = await supabase
    .from('properties')
    .update({ 
      owner_uid: newOwnerId,
      mitra_id: newOwnerId,
      updated_at: new Date().toISOString()
    })
    .eq('id', propertyId);

  if (error) {
    console.error('Error transferring property:', error);
    throw new Error(`Gagal mentransfer properti: ${error.message}`);
  }
}
export async function getAdminTransactions(limitOrType?: number | string, ownerUid?: string): Promise<AdminTransaction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  const limit = typeof limitOrType === 'number' ? limitOrType : 50;

  // 1. Fetch Transactions
  const { data: rawTransactions, error: trxError } = await supabase
    .from('transactions')
    .select(`
      *,
      user:user_id (
        name, 
        email, 
        phone,
        photo_url,
        occupation,
        institution,
        gender,
        religion,
        relationship_status,
        address
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (trxError) throw trxError;
  const transactions = (rawTransactions || []) as any[];

  // 2. Fetch Properties for mapping
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, owner_uid');
  const propertyMap = new Map(properties?.map(p => [p.id, p]) || []);

  // 3. Fetch Databases for mapping (optimistically)
  const dbIds = transactions.filter(t => t.product_type === 'database').map(t => t.product_id);
  let dbMap = new Map();
  if (dbIds.length > 0) {
    const { data: dbs } = await supabase
      .from('available_databases')
      .select('id, campus, city, area, file_type, file_name, price')
      .in('id', dbIds);
    dbMap = new Map(dbs?.map(db => [db.id, db]) || []);
  }

  // 4. Map & Filter
  const mapped = transactions.map(t => {
    // Resolve user profile photo if it exists
    if (t.user && t.user.photo_url) {
      t.user.photo_url = ensureAbsoluteUrl(t.user.photo_url, 'profile-photos');
    }
    
    return {
      ...t,
      product_name: t.metadata?.item || t.product_id,
      properties: propertyMap.get(t.product_id) || null,
      database: dbMap.get(t.product_id) || null,
    };
  }) as (AdminTransaction & { properties: any })[];

  if (ownerUid) {
    return mapped.filter(t => t.properties?.owner_uid === ownerUid) as AdminTransaction[];
  }

  return mapped as AdminTransaction[];
}

export async function updateTransactionStatus(
  transactionId: string,
  newStatus: string,
  additionalUpdates: any = {}
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  
  // Fetch transaction to check ownership
  const { data: trx, error: fetchErr } = await supabase
    .from('transactions')
    .select('user_id, product_id, properties(owner_uid)')
    .eq('id', transactionId)
    .single();

  if (fetchErr || !trx) throw new Error('Transaksi tidak ditemukan.');

  const isOwner = (trx.properties as any)?.owner_uid === user.id;

  if (!isAdmin && !isOwner) {
    throw new Error('Unauthorized: Anda tidak memiliki izin untuk mengupdate transaksi ini.');
  }

  // Handle metadata updates if not provided
  let finalUpdates = { ...additionalUpdates };
  if (additionalUpdates.metadata) {
    // Merge metadata if needed
    const { data: currentTrx } = await supabase.from('transactions').select('metadata').eq('id', transactionId).single();
    finalUpdates.metadata = { ...(currentTrx?.metadata || {}), ...additionalUpdates.metadata };
  }

  const { error } = await supabase
    .from('transactions')
    .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString(),
        ...finalUpdates
    })
    .eq('id', transactionId);

  if (error) {
    console.error('Error updating transaction status:', error);
    throw new Error(error.message);
  } else {
    notifyAdminStatusUpdate("Transaksi", transactionId, newStatus, additionalUpdates.metadata);
  }
}

export async function processBookingApproval(
  transactionId: string,
  decision: 'accept' | 'reject',
  reason?: string
): Promise<{ success: boolean; status: string; paymentLink?: string; whatsappUrl?: string }> {
  const { data, error } = await supabase.functions.invoke('process-booking-approval', {
    body: { transactionId, decision, reason }
  });

  if (error) {
    console.error('Edge Function Error:', error);
    throw new Error(error.message || 'Gagal memproses persetujuan booking.');
  }

  notifyAdminStatusUpdate("Pemesanan Kost", transactionId, data.status, { 
    "Aksi": decision,
    "Alasan": reason || '-'
  });

  return data;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Unauthorized: User is not an admin.');

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw new Error(error.message);
  }
}

export async function deleteTransactions(transactionIds: string[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Unauthorized: User is not an admin.');

  const { error } = await supabase
    .from('transactions')
    .delete()
    .in('id', transactionIds);

  if (error) {
    console.error('Error deleting multiple transactions:', error);
    throw new Error(error.message);
  }
}

export async function addPropertyWithMedia(
  kostData: Partial<Kost>,
  imageFiles: File[],
  videoFiles: File[]
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Anda harus login.');

  // Generate a temporary ID for Storage path (will be overwritten with DB-generated UUID)
  const tempId = crypto.randomUUID();

  const existingImages = (kostData.imageUrls || []).map((url: any) =>
    typeof url === 'string' ? { original: url } : url
  );
  const existingVideos = (kostData.videoUrls || []).map((url: any) =>
    typeof url === 'string' ? { original: url } : url
  );

  // Upload new images
  const newImageObjects: ImageUrlObject[] = [];
  for (const file of imageFiles) {
    const url = await uploadFileToStorage(file, 'properties', `${user.id}/${tempId}/images/original`);
    newImageObjects.push({ original: url });
  }

  // Upload new videos
  const newVideoObjects: VideoUrlObject[] = [];
  for (const file of videoFiles) {
    const url = await uploadFileToStorage(file, 'properties', `${user.id}/${tempId}/videos/original`);
    newVideoObjects.push({ original: url });
  }

  // Insert into Supabase (PostgreSQL)
  const { data: inserted, error } = await supabase
    .from('properties')
    .insert({
      owner_uid: user.id,
      mitra_id: user.id, // Menambahkan mitra_id karena constraint di DB
      title: kostData.title,
      description: kostData.description,
      price: Number(kostData.price || 0),
      facilities: kostData.facilities || [],
      address: kostData.address,
      city: kostData.city,
      area: kostData.area || '',
      type: kostData.type,
      property_type: kostData.type, // Map the type specifically for Supabase DB
      status: kostData.status || 'draft',
      is_verified: kostData.isVerified ?? false,
      rating: Number(kostData.rating || 0),
      location: kostData.location,
      image_urls: [...existingImages, ...newImageObjects],
      video_urls: [...existingVideos, ...newVideoObjects],
      instagram_url: kostData.instagramUrl || '',
      tiktok_url: kostData.tiktokUrl || '',
      room_types: kostData.roomTypes || [],
      reviews: kostData.reviews || [],
      rules: kostData.rules || [],
      campuses: kostData.campuses || [],
      public_facilities: kostData.publicFacilities || [],
      virtual_tour_url: kostData.virtualTourUrl || '',
      additional_fee_price: kostData.additionalFeePrice ? Number(kostData.additionalFeePrice) : null,
      additional_fee_name: kostData.additionalFeeName || '',
      omnichannel_contact_name: kostData.omnichannelContactName || '',
      omnichannel_contact_phone: kostData.omnichannelContactPhone || '',
      omnichannel_contact_type: kostData.omnichannelContactType || 'owner',
    })
    .select('id')
    .single();

  if (error) {
    console.error("Supabase Insert Error:", error);
    throw new Error(error.message);
  }

  if (error) throw error;
  return inserted.id;
}

export async function updatePropertyWithMedia(
  propertyId: string,
  kostData: Partial<Kost>,
  newImageFiles: File[],
  newVideoFiles: File[]
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Anda harus login.');

  const { data: existing, error: fetchError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (fetchError || !existing) throw new Error('Properti tidak ditemukan.');

  const isOwner = existing.owner_uid === user.id;
  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isOwner && !isAdmin) throw new Error('Tidak memiliki izin.');

  const currentImageObjects = existing.image_urls || [];
  const currentVideoObjects = existing.video_urls || [];

  const keptImageStrings = kostData.imageUrls || [];
  const keptVideoStrings = kostData.videoUrls || [];

  // Determine deletions
  const itemsToDelete = currentImageObjects.filter((imgObj: any) => {
    const isKept = keptImageStrings.some(keptUrl =>
      keptUrl === imgObj.original ||
      keptUrl === imgObj.webp ||
      keptUrl === imgObj.thumbnail ||
      keptUrl === imgObj
    );
    return !isKept;
  });

  const videosToDelete = currentVideoObjects.filter((vidObj: any) => {
    const url = typeof vidObj === 'string' ? vidObj : vidObj.original;
    return !keptVideoStrings.includes(url);
  });

  // Delete removed files from Storage
  await Promise.all([
    ...itemsToDelete.map(async (item: any) => {
      if (typeof item === 'string') await deleteFileFromStorage(item);
      else {
        if (item.original) await deleteFileFromStorage(item.original);
        if (item.webp) await deleteFileFromStorage(item.webp);
        if (item.thumbnail) await deleteFileFromStorage(item.thumbnail);
      }
    }),
    ...videosToDelete.map(async (v: any) => {
      const url = typeof v === 'string' ? v : v.original;
      await deleteFileFromStorage(url);
    })
  ]);

  // Filter kept objects
  const finalImageObjects = currentImageObjects.filter((imgObj: any) => {
    return keptImageStrings.some(keptUrl =>
      keptUrl === imgObj.original ||
      keptUrl === imgObj.webp ||
      keptUrl === imgObj.thumbnail ||
      keptUrl === imgObj
    );
  });

  const finalVideoObjects = currentVideoObjects.filter((vidObj: any) => {
    const url = typeof vidObj === 'string' ? vidObj : vidObj.original;
    return keptVideoStrings.includes(url);
  });

  // Upload new files
  const newImageObjects: ImageUrlObject[] = [];
  for (const file of newImageFiles) {
    const url = await uploadFileToStorage(file, 'properties', `${user.id}/${propertyId}/images/original`);
    newImageObjects.push({ original: url });
  }

  const newVideoObjects: VideoUrlObject[] = [];
  for (const file of newVideoFiles) {
    const url = await uploadFileToStorage(file, 'properties', `${user.id}/${propertyId}/videos/original`);
    newVideoObjects.push({ original: url });
  }

  const { error: updateError } = await supabase
    .from('properties')
    .update({
      mitra_id: user.id,
      title: kostData.title,
      description: kostData.description,
      price: Number(kostData.price || 0),
      facilities: kostData.facilities,
      address: kostData.address,
      city: kostData.city,
      area: kostData.area,
      type: kostData.type,
      property_type: kostData.type, // Sync added column
      status: kostData.status,
      is_verified: kostData.isVerified,
      rating: Number(kostData.rating || 0),
      location: kostData.location,
      image_urls: [...finalImageObjects, ...newImageObjects],
      video_urls: [...finalVideoObjects, ...newVideoObjects],
      instagram_url: kostData.instagramUrl,
      tiktok_url: kostData.tiktokUrl,
      room_types: kostData.roomTypes,
      reviews: kostData.reviews,
      rules: kostData.rules,
      campuses: kostData.campuses,
      public_facilities: kostData.publicFacilities,
      virtual_tour_url: kostData.virtualTourUrl,
      additional_fee_price: kostData.additionalFeePrice ? Number(kostData.additionalFeePrice) : null,
      additional_fee_name: kostData.additionalFeeName,
      omnichannel_contact_name: kostData.omnichannelContactName,
      omnichannel_contact_phone: kostData.omnichannelContactPhone,
      omnichannel_contact_type: kostData.omnichannelContactType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId);

  if (updateError) {
    console.error("Supabase Update Error:", updateError);
    throw new Error(updateError.message);
  }
}

export async function updatePropertyStatus(propertyId: string, newStatus: 'draft' | 'published'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Tidak ada admin yang login.');

  const { data: existing, error: fetchError } = await supabase
    .from('properties')
    .select('owner_uid')
    .eq('id', propertyId)
    .single();

  if (fetchError || !existing) throw new Error('Properti tidak ditemukan.');

  const isOwner = existing.owner_uid === user.id;
  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isOwner && !isAdmin) throw new Error('Anda tidak memiliki izin.');

  const { error } = await supabase
    .from('properties')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', propertyId);

  if (error) throw error;
}

export async function deleteProperty(propertyId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Tidak ada admin yang login.');

  const { data: existing, error: fetchError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (fetchError || !existing) throw new Error('Properti tidak ditemukan.');

  const isOwner = existing.owner_uid === user.id;
  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isOwner && !isAdmin) throw new Error('Anda tidak memiliki izin untuk menghapusnya.');

  // Delete all media files
  const deletePromises: Promise<void>[] = [];
  (existing.image_urls || []).forEach((img: any) => {
    if (typeof img === 'string') {
      deletePromises.push(deleteFileFromStorage(img));
    } else {
      if (img.original) deletePromises.push(deleteFileFromStorage(img.original));
      if (img.webp) deletePromises.push(deleteFileFromStorage(img.webp));
      if (img.thumbnail) deletePromises.push(deleteFileFromStorage(img.thumbnail));
    }
  });

  (existing.video_urls || []).forEach((vid: any) => {
    const url = typeof vid === 'string' ? vid : vid.original;
    if (url) deletePromises.push(deleteFileFromStorage(url));
  });

  await Promise.all(deletePromises);

  const { error } = await supabase.from('properties').delete().eq('id', propertyId);
  if (error) throw error;
  console.log('Properti berhasil dihapus:', propertyId);
}

export async function getPropertyDetails(propertyId: string): Promise<any | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Tidak ada pengguna yang login.');

  const { data: row, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (error || !row) return null;

  // Normalize image URLs
  row.imageUrls = (row.image_urls || []).map((img: any) => ({
    original: typeof img === 'string' ? img : img.original,
    webp: typeof img === 'string' ? img : (img.webp || img.original),
    thumbnail: typeof img === 'string' ? img : (img.thumbnail || img.webp || img.original)
  }));
  row.videoUrls = row.video_urls || [];

  return row;
}

// ---- DATABASE PRODUCT FUNCTIONS ----

export async function getAllDatabases(): Promise<DatabaseProduct[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  const { data, error } = await supabase
    .from('available_databases')
    .select('*')
    .order('created_at', { ascending: false });

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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as DatabaseProduct));
}

export async function addDatabaseProduct(
  data: Partial<DatabaseProduct>,
  coverFile: File | null,
  documentFile: File | null
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const tempId = crypto.randomUUID();
  let fileUrls = data.fileUrls || {};
  let fileName = data.fileName || '';

  if (coverFile) {
    const url = await uploadFileToStorage(coverFile, 'databases', `${user.id}/${tempId}/cover/original`);
    fileUrls = { ...fileUrls, coverImage: { original: url } };
  }

  if (data.fileType === 'upload' && documentFile) {
    const docUrl = await uploadFileToStorage(documentFile, 'databases', `${user.id}/${tempId}`);
    fileName = documentFile.name;
    fileUrls = { ...fileUrls, file: docUrl };
    if (fileName.toLowerCase().endsWith('.pdf')) {
      fileUrls = { ...fileUrls, pdf: docUrl }; // Keep for backward compatibility
    } else {
      fileUrls = { ...fileUrls, excel: docUrl }; // Keep for backward compatibility
    }
  } else if (data.fileType === 'link') {
    const linkValue = (data as any).fileUrl || fileUrls.link || fileUrls.googleDrive;
    if (linkValue) {
      fileUrls = { ...fileUrls, link: linkValue };
    }
  }

  const { data: inserted, error } = await supabase
    .from('available_databases')
    .insert({
      owner_uid: user.id,
      campus: data.campus,
      city: data.city,
      area: data.area,
      description: data.description,
      price: data.price,
      total_data: data.totalData,
      file_urls: fileUrls,
      file_type: data.fileType || 'link',
      file_name: fileName,
      status: data.status || 'available',
    })
    .select('id')
    .single();

  if (error) throw error;
  return inserted.id;
}

// Alias
export { addDatabaseProduct as addDatabaseWithMedia };

export async function updateDatabaseProduct(
  id: string,
  data: Partial<DatabaseProduct>,
  newCoverFile: File | null,
  newDocumentFile: File | null
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: current, error: fetchError } = await supabase
    .from('available_databases')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !current) throw new Error('Database not found');

  let fileUrls = { ...(current.file_urls || {}), ...(data.fileUrls || {}) };

  if (newCoverFile) {
    // Delete old cover
    const oldCover = current.file_urls?.coverImage;
    if (oldCover) {
      if (oldCover.original) await deleteFileFromStorage(oldCover.original);
      if (oldCover.webp) await deleteFileFromStorage(oldCover.webp);
      if (oldCover.thumbnail) await deleteFileFromStorage(oldCover.thumbnail);
    }
    const url = await uploadFileToStorage(newCoverFile, 'databases', `${current.owner_uid}/${id}/cover/original`);
    fileUrls.coverImage = { original: url };
  }

  let updates: any = {
    campus: data.campus,
    city: data.city,
    area: data.area,
    description: data.description,
    price: data.price,
    total_data: data.totalData,
    file_type: data.fileType,
    status: data.status,
    updated_at: new Date().toISOString(),
  };

  if (data.fileType === 'upload') {
    if (newDocumentFile) {
      // Delete old doc
      if (current.file_urls?.file) await deleteFileFromStorage(current.file_urls.file);
      if (current.file_urls?.excel) await deleteFileFromStorage(current.file_urls.excel);
      if (current.file_urls?.pdf) await deleteFileFromStorage(current.file_urls.pdf);
      
      const docUrl = await uploadFileToStorage(newDocumentFile, 'databases', `${current.owner_uid}/${id}`);
      updates.file_name = newDocumentFile.name;
      fileUrls.file = docUrl;
      
      if (newDocumentFile.name.toLowerCase().endsWith('.pdf')) {
        fileUrls.pdf = docUrl;
        delete fileUrls.excel;
      } else {
        fileUrls.excel = docUrl;
        delete fileUrls.pdf;
      }
    }
  } else if (data.fileType === 'link') {
    const linkValue = (data as any).fileUrl || fileUrls.link || fileUrls.googleDrive;
    if (linkValue !== undefined) {
      fileUrls.link = linkValue;
    }
  }

  updates.file_urls = fileUrls;

  const { error } = await supabase.from('available_databases').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteDatabase(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  const { data: current, error: fetchError } = await supabase
    .from('available_databases')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !current) throw new Error('Database tidak ditemukan.');

  const deletePromises: Promise<void>[] = [];
  const fu = current.file_urls || {};
  if (fu.coverImage) {
    if (fu.coverImage.original) deletePromises.push(deleteFileFromStorage(fu.coverImage.original));
    if (fu.coverImage.webp) deletePromises.push(deleteFileFromStorage(fu.coverImage.webp));
    if (fu.coverImage.thumbnail) deletePromises.push(deleteFileFromStorage(fu.coverImage.thumbnail));
  }
  if (fu.excel) deletePromises.push(deleteFileFromStorage(fu.excel));
  if (fu.pdf) deletePromises.push(deleteFileFromStorage(fu.pdf));

  await Promise.all(deletePromises);

  const { error } = await supabase.from('available_databases').delete().eq('id', id);
  if (error) throw error;
  console.log('Database berhasil dihapus:', id);
}

export async function getDatabaseDetails(databaseId: string): Promise<DatabaseProduct | null> {
  const { data: row, error } = await supabase
    .from('available_databases')
    .select('*')
    .eq('id', databaseId)
    .single();

  if (error || !row) return null;

  return {
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as DatabaseProduct;
}

// ---- MITRA REGISTRATION ----

export async function getMitraRegistrations(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  const { data, error } = await supabase
    .from('mitra_requests')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => ({
    ...row,
    date: row.timestamp
      ? new Date(row.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Hari Ini'
  }));
}

export async function updateMitraRegistrationStatus(id: string, status: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  const { error } = await supabase
    .from('mitra_requests')
    .update({ status: status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function getAnalyticsSummary(
  dateFilter: string = 'all', 
  customStart?: string, 
  customEnd?: string,
  ownerUid?: string
): Promise<AnalyticsSummary> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(authUser.id);
  if (!isAdmin) throw new Error('Access Denied');

  // 1. Total User Count (Global)
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // 2. Total Databases
  const { count: totalDatabases } = await supabase
    .from('available_databases')
    .select('*', { count: 'exact', head: true });

  // 3. Properties (Active Listings & Mitra)
  let propQuery = supabase.from('properties').select('owner_uid');
  if (ownerUid) {
    propQuery = propQuery.eq('owner_uid', ownerUid);
  }
  const { data: properties } = await propQuery;
  
  const totalMitra = new Set(properties?.map(p => p.owner_uid)).size;
  const totalActiveKosts = properties?.length || 0;

  // 4. Transactions with Date Filtering
  let query = supabase
    .from('transactions')
    .select('product_type, amount, status, created_at, product_id')
    .or('status.eq.paid,status.eq.Selesai');

  if (dateFilter && dateFilter !== 'all') {
    const now = new Date();
    if (dateFilter === 'hari_ini') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query = query.gte('created_at', start.toISOString());
    } else if (dateFilter === 'minggu_ini') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
      const start = new Date(now.setDate(diff));
      start.setHours(0,0,0,0);
      query = query.gte('created_at', start.toISOString());
    } else if (dateFilter === 'bulan_ini') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      query = query.gte('created_at', start.toISOString());
    } else if (dateFilter === 'tahunan') {
      const start = new Date(now.getFullYear(), 0, 1);
      query = query.gte('created_at', start.toISOString());
    } else if (dateFilter === 'custom' && customStart) {
      query = query.gte('created_at', new Date(customStart).toISOString());
      if (customEnd) {
        const endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }
    }
  }

  const { data: rawTransactions, error: trxError } = await query;
  if (trxError) throw trxError;

  // Filter transactions by ownerUid in-memory if needed
  let transactions = rawTransactions || [];
  if (ownerUid) {
    const { data: ownerProps } = await supabase
      .from('properties')
      .select('id')
      .eq('owner_uid', ownerUid);
    
    const ownerPropIds = new Set(ownerProps?.map(p => p.id) || []);
    transactions = transactions.filter(t => ownerPropIds.has(t.product_id));
  }

  const result: AnalyticsSummary = {
    totalUsers: totalUsers || 0,
    totalRevenue: 0,
    totalMitra,
    totalDatabases: totalDatabases || 0,
    kostStats: { users: 0, active: totalActiveKosts, revenue: 0 },
    dbStats: { buyers: 0, active: totalDatabases || 0, revenue: 0 },
    verifStats: { orders: 0, revenue: 0 },
    trendData: []
  };

  // Grouping for Trend Data
  const trendMap = new Map<string, { pendapatan: number, pengguna: Set<string> }>();

  transactions?.forEach(t => {
    const amount = Number(t.amount || 0);
    result.totalRevenue += amount;
    if (t.product_type === 'rent') {
      result.kostStats.revenue += amount;
      result.kostStats.users++;
    } else if (t.product_type === 'database') {
      result.dbStats.revenue += amount;
      result.dbStats.buyers++;
    } else if (t.product_type === 'survey') {
      result.verifStats.revenue += amount;
      result.verifStats.orders++;
    }

    // Trend Grouping
    const date = new Date(t.created_at);
    let key = '';
    if (dateFilter === 'hari_ini') {
      key = `${date.getHours().toString().padStart(2, '0')}:00`;
    } else if (dateFilter === 'minggu_ini') {
       const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
       key = days[date.getDay()];
    } else if (dateFilter === 'bulan_ini') {
       const week = Math.ceil(date.getDate() / 7);
       key = `Minggu ${week > 4 ? 4 : week}`;
    } else if (dateFilter === 'tahunan') {
       const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
       key = months[date.getMonth()];
    } else {
       key = `${date.getDate()}/${date.getMonth() + 1}`;
    }

    if (!trendMap.has(key)) trendMap.set(key, { pendapatan: 0, pengguna: new Set() });
    const entry = trendMap.get(key)!;
    entry.pendapatan += amount;
    if ((t as any).user_id) entry.pengguna.add((t as any).user_id);
  });

  // Sort and format trend data
  const sortedKeys = Array.from(trendMap.keys());
  // Basic sort for time keys
  // For simplicity, we just return the map entries. 
  // In a real app we'd want to fill missing gaps (e.g. 0 revenue days).
  result.trendData = sortedKeys.map(k => ({
     time: k,
     pendapatan: trendMap.get(k)!.pendapatan,
     pengguna: trendMap.get(k)!.pengguna.size
  }));

  // If no trend data, provide at least one point to avoid chart crash
  if (result.trendData.length === 0) {
      result.trendData = [{ time: '-', pendapatan: 0, pengguna: 0 }];
  }

  return result;
}
// ---- SURVEY REQUEST FUNCTIONS ----

// interface SurveyRequest was here, now in types.ts

export async function generateManualDriveFolder(surveyId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized.');

    const response = await fetch('https://us-central1-ruangsinggahid-3afb2.cloudfunctions.net/manualCreateSurveyFolder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId, adminUserId: user.id })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal membuat folder Drive.');
    
    return result.driveLink;
}

export async function getAdminSurveyRequests(): Promise<SurveyRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const role = await getUserRole(user.id);
  const isAdmin = role === 'admin';
  const isAgent = role === 'survey_agent';

  // Allow regular users too

  let query = supabase
    .from('survey_requests')
    .select(`
      *,
      user:user_id (
        name,
        email,
        phone,
        photo_url
      ),
      transaction:transaction_id (
        amount,
        status
      )
    `);

  if (isAgent) {
    query = query.eq('assigned_agent_id', user.id);
  } else if (!isAdmin) {
    // Regular user: only see their own requests
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SurveyRequest[];
}

export async function updateSurveyRequest(
  id: string,
  updates: Partial<SurveyRequest>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const role = await getUserRole(user.id);
  const isAdmin = role === 'admin';
  const isAgent = role === 'survey_agent';

  // Regular users can update their own (for feedback/rating)
  const { data: existing } = await supabase.from('survey_requests').select('user_id, assigned_agent_id').eq('id', id).single();
  
  if (!isAdmin && user.id !== existing?.user_id && user.id !== existing?.assigned_agent_id) {
     throw new Error('Access Denied');
  }

  const { error } = await supabase
    .from('survey_requests')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
  else if (updates.status) {
    notifyAdminStatusUpdate("Permintaan Survey", id, updates.status);
  }
}

export async function deleteSurveyRequest(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const role = await getUserRole(user.id);
  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';

  if (!isAdmin && !isOwner) throw new Error('Access Denied');

  const { error } = await supabase
    .from('survey_requests')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function deleteSurveyRequests(ids: string[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const role = await getUserRole(user.id);
  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';

  if (!isAdmin && !isOwner) throw new Error('Access Denied');

  const { error } = await supabase
    .from('survey_requests')
    .delete()
    .in('id', ids);

  if (error) throw error;
}

export async function getSurveyAgents(): Promise<{id: string, name: string, phone: string, photo_url?: string}[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const role = await getUserRole(user.id);
  if (role !== 'admin') throw new Error('Access Denied');

  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone, photo_url, role, verification_status');

  if (error) throw error;
  
  // Filter in memory for maximum reliability
  return (data || []).filter(u => 
    ['survey_agent', 'agen', 'agent'].includes(u.role?.toLowerCase())
  ).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    photo_url: u.photo_url,
    status: u.status || 'active'
  }));
}

export async function getAgentVerificationRequests(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('verification_status', 'pending')
    .in('role', ['survey_agent', 'agen', 'agent'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateAgentVerificationStatus(agentId: string, status: 'verified' | 'unverified' | 'rejected', reason?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  const { error } = await supabase
    .from('users')
    .update({ 
      verification_status: status,
      verification_notes: reason || null,
      role: status === 'verified' ? 'survey_agent' : undefined,
      updated_at: new Date().toISOString()
    })
    .eq('id', agentId);

  if (error) throw error;
}

// ---- MITRA MANAGEMENT FUNCTIONS ----

export async function getAdminMitraRequests(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  // 1. Fetch from mitra_requests (Registration requests)
  const { data: regRequests, error: regError } = await supabase
    .from('mitra_requests')
    .select('*')
    .order('timestamp', { ascending: false });

  if (regError) throw regError;

  // 2. Fetch from users who are already 'owner' but verification is pending
  const { data: verRequests, error: verError } = await supabase
    .from('users')
    .select('*')
    .eq('verification_status', 'pending')
    .in('role', ['owner', 'mitra'])
    .order('created_at', { ascending: false });

  if (verError) throw verError;

  // 3. Map verifications to match registration request format for UI compatibility
  const mappedVerifications = (verRequests || []).map(u => ({
    id: u.id,
    user_id: u.id,
    name: u.full_name || u.name,
    phone: u.phone,
    email: u.email,
    timestamp: u.updated_at || u.created_at,
    status: 'pending',
    type: 'verification', // Special flag for UI
    ktp_photo: u.ktp_photo_url,
    ktp_number: u.ktp_number,
    address: u.ktp_address
  }));

  const mappedRegistrations = (regRequests || []).map(r => ({
    ...r,
    type: 'registration' // Regular flag
  }));

  return [...mappedVerifications, ...mappedRegistrations];
}

export async function updateMitraRequestStatus(
  requestId: string, 
  status: 'accepted' | 'rejected' | 'pending', 
  userId?: string,
  type: 'registration' | 'verification' = 'registration'
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  if (type === 'registration') {
    // 1. Update the request status in mitra_requests table
    const { error: requestError } = await supabase
      .from('mitra_requests')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', requestId);

    if (requestError) throw requestError;

    // 2. If accepted and userId is provided, update the user's role in the users table
    if (status === 'accepted' && (userId || requestId)) {
      const targetId = userId || requestId;
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          role: 'owner', 
          updated_at: new Date().toISOString()
        })
        .eq('id', targetId);

      if (userError) {
        console.warn('Failed to update user role, but request was accepted:', userError);
      }
    }
  } else {
    // Handle Identity Verification (updating users table directly)
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        verification_status: status === 'accepted' ? 'verified' : (status === 'rejected' ? 'rejected' : 'pending'),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId); // For verification, requestId is the userId

    if (userError) throw userError;
  }
}

// ---- BANNER MANAGEMENT FUNCTIONS ----

export async function getAdminBanners(): Promise<Banner[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addBanner(bannerData: Partial<Banner>, imageFile: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  // 1. Upload Image
  const imageUrl = await uploadFileToStorage(imageFile, 'banners', 'promo');

  // 2. Insert Record
  const { data, error } = await supabase
    .from('banners')
    .insert({
      title: bannerData.title,
      image_url: imageUrl,
      link_url: bannerData.link_url || '',
      is_active: bannerData.is_active ?? true,
      sort_order: bannerData.sort_order || 0
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateBanner(bannerId: string, updates: Partial<Banner>, newImageFile?: File): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  let imageUrl = updates.image_url;

  // 1. If new image provided, upload and delete old one
  if (newImageFile) {
    // Get old image URL to delete later
    const { data: oldData } = await supabase.from('banners').select('image_url').eq('id', bannerId).single();
    
    imageUrl = await uploadFileToStorage(newImageFile, 'banners', 'promo');
    
    if (oldData?.image_url) {
      await deleteFileFromStorage(oldData.image_url);
    }
  }

  // 2. Update Record
  const { error } = await supabase
    .from('banners')
    .update({
      title: updates.title,
      image_url: imageUrl,
      link_url: updates.link_url,
      is_active: updates.is_active,
      sort_order: updates.sort_order,
      updated_at: new Date().toISOString()
    })
    .eq('id', bannerId);

  if (error) throw error;
}

export async function deleteBanner(bannerId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  // 1. Get image URL to delete from storage
  const { data } = await supabase.from('banners').select('image_url').eq('id', bannerId).single();
  if (data?.image_url) {
    await deleteFileFromStorage(data.image_url);
  }

  // 2. Delete record
  const { error } = await supabase.from('banners').delete().eq('id', bannerId);
  if (error) throw error;
}

// ---- USER MANAGEMENT FUNCTIONS ----

/**
 * Get users filtered by their role
 * @param role 'user' | 'owner' | 'survey_agent' | 'admin'
 */
export async function getUsersByRole(role: string): Promise<any[]> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(authUser.id);
  if (!isAdmin) throw new Error('Access Denied');

  // Fetch users for categorization
  let query = supabase.from('users').select('*');
  const { data: allUsers, error: userError } = await query.order('created_at', { ascending: false });
  
  if (userError) throw userError;
  if (!allUsers) return [];

  let filteredUsers = [];
  if (role === 'survey_agent') {
    filteredUsers = allUsers.filter(u => 
      ['survey_agent', 'agen', 'agent'].includes(u.role?.toLowerCase())
    );
  } else if (role === 'owner') {
    filteredUsers = allUsers.filter(u => ['owner', 'mitra'].includes(u.role?.toLowerCase()));
  } else if (role === 'user') {
    // 1. Identify active renters first (regardless of role)
    const { data: rentTransactions } = await supabase
      .from('transactions')
      .select('user_id, product_type, status, metadata, product_id, amount');

    const activeRenterMap = new Map<string, any>();
    if (rentTransactions) {
      rentTransactions.forEach(t => {
        const type = (t.product_type || '').toLowerCase();
        const status = (t.status || t.metadata?.status || '').toLowerCase();
        const isRentType = ['rent', 'kost_booking', 'sewa_kost'].includes(type) || !type;
        const isActiveStatus = ['paid', 'selesai', 'success', 'berhasil', 'approved', 'pending_approval', 'success'].includes(status);
        
        if (isRentType && isActiveStatus) {
            const metadata = t.metadata || {};
            const endDateString = metadata.endDate || t.end_date;
            let daysRem = null;
            if (endDateString) {
                const end = new Date(endDateString);
                if (!isNaN(end.getTime())) {
                    const diff = end.getTime() - new Date().getTime();
                    daysRem = Math.ceil(diff / (1000 * 60 * 60 * 24));
                }
            }

            const currentInfo = {
                kostName: t.kost_name || metadata.kostName || 'Kost Terdaftar',
                roomType: metadata.roomType || '-',
                duration: t.duration || metadata.duration || '-',
                period: t.period || metadata.periodLabel || 'bulan',
                startDate: t.move_in_date || metadata.startDate,
                endDate: endDateString,
                daysRemaining: daysRem,
                status: t.status
            };

            // Priority: keep the one with latest end date if multiple
            const existing = activeRenterMap.get(t.user_id);
            if (!existing || (new Date(currentInfo.endDate || 0) > new Date(existing.endDate || 0))) {
                activeRenterMap.set(t.user_id, currentInfo);
            }
        }
      });
    }

    // 2. Identify users: either they are general users/tenants, OR they have an active rental
    filteredUsers = allUsers.filter(u => 
      !u.role || 
      ['user', 'tenant'].includes(u.role?.toLowerCase()) ||
      activeRenterMap.has(u.id)
    );

    const result = filteredUsers.map(u => ({
      ...u,
      name: u.name || u.full_name || 'No Name',
      full_name: u.full_name || u.name || 'No Name',
      is_renting: u.role === 'tenant' || activeRenterMap.has(u.id),
      active_rental: activeRenterMap.get(u.id) || null
    }));

    // DEEP DIAGNOSTICS
    console.log('[DEBUG:UserManagement] allUsers total:', allUsers.length);
    console.log('[DEBUG:UserManagement] filtered results (inclusive):', result.length);
    if (result.length > 0) console.log('[DEBUG:UserManagement] Sample:', result[0]);

    return result;
  } else {
    filteredUsers = allUsers.filter(u => u.role === role);
  }

  // Common mapping for other categories
  return filteredUsers.map(u => ({
    ...u,
    name: u.name || u.full_name || 'No Name',
    full_name: u.full_name || u.name || 'No Name'
  }));
}

/**
 * Get active mitra (owners) with their property count
 */
export async function getActiveMitra(): Promise<any[]> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(authUser.id);
  if (!isAdmin) throw new Error('Access Denied');

  // Fetch users with role 'owner' or 'mitra'
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .or(`role.eq.owner,role.eq.mitra`)
    .order('created_at', { ascending: false });

  if (userError) throw userError;
  if (!users) return [];

  // Fetch property counts for each owner
  const { data: props, error: propsError } = await supabase
    .from('properties')
    .select('owner_uid');

  if (propsError) throw propsError;

  const countMap = new Map<string, number>();
  props?.forEach(p => {
    countMap.set(p.owner_uid, (countMap.get(p.owner_uid) || 0) + 1);
  });

  return users.map(u => ({
    ...u,
    name: u.name || u.full_name || 'No Name',
    propertyCount: countMap.get(u.id) || 0,
    status: u.status || 'active'
  }));
}

/**
 * Get comprehensive user details for admin profile view
 */
export async function getUserFullDetails(userId: string): Promise<any> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Unauthorized');

    const isAdmin = await checkIfUserIsAdmin(authUser.id);
    if (!isAdmin) throw new Error('Access Denied');

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (userError) throw userError;

    // Optional: Get brief history/summary
    // 1. If owner: get properties
    let properties = [];
    if (['owner', 'mitra'].includes(userData.role?.toLowerCase())) {
        const { data: props } = await supabase.from('properties').select('id, title, city, status').eq('owner_uid', userId);
        properties = props || [];
    }

    // 2. If agent: get surveys count
    let surveysCount = 0;
    if (['survey_agent', 'agen', 'agent'].includes(userData.role?.toLowerCase())) {
        const { count } = await supabase.from('survey_requests').select('*', { count: 'exact', head: true }).eq('agent_id', userId);
        surveysCount = count || 0;
    }

    return {
        ...userData,
        properties,
        surveysCount
    };
}

/**
 * Delete a user account (Warning: Permanent)
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(authUser.id);
  if (!isAdmin) throw new Error('Access Denied');

  // Note: Only deleting from the 'users' table. 
  // Auth delete usually requires Service Role which should be careful.
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Update user status (e.g., 'active', 'blocked')
 */
export async function updateUserStatus(userId: string, status: 'active' | 'blocked'): Promise<void> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(authUser.id);
  if (!isAdmin) throw new Error('Access Denied');

  const { error } = await supabase
    .from('users')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId);

  if (error) throw error;
}
