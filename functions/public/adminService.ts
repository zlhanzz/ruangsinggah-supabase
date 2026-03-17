import { supabase } from './supabase';
import { Kost, DatabaseProduct, ImageUrlObject, VideoUrlObject } from './types';

// ---- TYPE DEF ----
export interface BasicPropertyInfo extends Partial<Kost> {
  id: string;
  namaKost: string;
  status: 'draft' | 'published';
  address: string;
  imageUrls: string[];
  videoUrls?: string[];
  instagramUrl?: string;
  tiktokUrl?: string;
}

// ---- HELPERS ----

// Check if user is admin by querying the users table
export async function checkIfUserIsAdmin(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_admin, role')
      .eq('id', uid)
      .single();
    if (error) return false;
    return data?.is_admin === true || data?.role === 'admin';
  } catch {
    return false;
  }
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

export async function getAdminProperties(): Promise<BasicPropertyInfo[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Tidak ada admin yang login.');

  const isAdmin = await checkIfUserIsAdmin(user.id);

  let query = supabase.from('properties').select('*');
  if (!isAdmin) {
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
    } as BasicPropertyInfo;
  });
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
