import { supabase } from './supabase';
import { Kost, DatabaseProduct, ImageUrlObject, VideoUrlObject, SurveyRequest } from './types';

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

  const sanitizedFileName = processedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
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

  let query = supabase.from('properties').select('*');
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
      omnichannelContactType: row.omnichannel_contact_type,
    } as BasicPropertyInfo;
  });
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
        relationship_status
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
  const mapped = transactions.map(t => ({
    ...t,
    product_name: t.metadata?.item || t.product_id,
    properties: propertyMap.get(t.product_id) || null,
    database: dbMap.get(t.product_id) || null,
  })) as (AdminTransaction & { properties: any })[];

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
  if (!isAdmin) throw new Error('Unauthorized: User is not an admin.');

  const { error } = await supabase
    .from('transactions')
    .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString(),
        ...additionalUpdates
    })
    .eq('id', transactionId);

  if (error) {
    console.error('Error updating transaction status:', error);
    throw new Error(error.message);
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
    .select('id, name, phone, photo_url')
    .eq('role', 'survey_agent');

  if (error) throw error;
  return data || [];
}

export async function getAgentVerificationRequests(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'survey_agent')
    .eq('verification_status', 'pending')
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
      updated_at: new Date().toISOString()
    })
    .eq('id', agentId);

  if (error) throw error;

  // Optional: If you want to also update auth user metadata (if they are synced)
  // This is tricky because we can't update other people's auth metadata from the client.
  // We assume the system uses public.users for the source of truth for verification.
}
