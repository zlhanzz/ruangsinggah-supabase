import { supabase } from './supabase';
import { Kost, DatabaseProduct, ImageUrlObject, VideoUrlObject, SurveyRequest, Banner, KostManagerPackage } from './types';
import { notifyAdminStatusUpdate } from './emailService';
import { ensureAbsoluteUrl } from './userService';
import { getCurrentDate } from './utils/timeUtils';

// ---- TYPE DEF ----
export interface BasicPropertyInfo extends Partial<Kost> {
  id: string;
  namaKost: string;
  status: 'draft' | 'published' | 'suspended' | string;
  address: string;
  area: string;
  imageUrls: string[];
  videoUrls?: string[];
  instagramUrl?: string;
  tiktokUrl?: string;
  ownerName?: string;
  ownerRole?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerVerificationStatus?: string;
  suspendReason?: string;
  createdAt?: string;
  updatedAt?: string;
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

/**
 * Memaksa tab lain untuk reload data (misal: Mitra Dashboard) 
 * saat Admin melakukan perubahan data krusial.
 */
export const triggerCrossTabRefresh = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('RS_DATA_REFRESH', Date.now().toString());
  }
};

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
export async function convertToWebP(file: File, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    // Only process jpeg, png and webp images
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/i)) {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      
      const TARGET_WIDTH = 1200;
      const TARGET_HEIGHT = 900; // Standard 4:3 landscape ratio

      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;

      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      const imgRatio = img.width / img.height;
      const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;
      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

      if (imgRatio > targetRatio) {
        // Image is wider than 4:3 target - crop horizontally
        sWidth = img.height * targetRatio;
        sx = (img.width - sWidth) / 2;
      } else {
        // Image is taller than 4:3 target - crop vertically
        sHeight = img.width / targetRatio;
        sy = (img.height - sHeight) / 2;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

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

  let query = supabase.from('properties').select('*, users(id, name, full_name, role, phone, email, verification_status)');
  if (ownerUid) {
    query = query.eq('owner_uid', ownerUid);
  } else if (!isAdmin) {
    query = query.eq('owner_uid', user.id);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
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
    const isManaged = Boolean(row.is_managed);

    let suspendReason = '';
    if (row.metadata) {
      const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
      suspendReason = meta?.suspend_reason || meta?.suspendReason || '';
    }

    return {
      id: row.id,
      namaKost: row.title || row.namaKost || 'Kost Tanpa Nama',
      status: row.status || 'draft',
      address: row.address || '',
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
      facilities: row.facilities || [],
      roomTypes: row.room_types || [],
      rules: row.rules || [],
      campuses: row.campuses || [],
      publicFacilities: row.public_facilities || [],
      isVerified: isManaged ? true : Boolean(row.is_verified),
      isManaged: isManaged,
      omnichannelContactName: row.omnichannel_contact_name,
      omnichannelContactPhone: row.omnichannel_contact_phone,
      additionalFeePrice: row.additional_fee_price,
      additionalFeeName: row.additional_fee_name,
      additionalFeeStartsFrom: row.additional_fee_starts_from,
      ownerName: ownerData?.name || ownerData?.full_name || (isSystemId ? 'Super Admin' : `Tanpa Pemilik (${row.owner_uid?.substring(0,8)}...)`),
      ownerRole: ownerData?.role || (isSystemId ? 'admin' : 'owner'),
      ownerPhone: ownerData?.phone || row.omnichannel_contact_phone || '',
      ownerEmail: ownerData?.email || '',
      ownerVerificationStatus: ownerData?.verification_status || 'unverified',
      suspendReason: suspendReason,
      createdAt: row.created_at,
      updatedAt: row.updated_at
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
      updated_at: getCurrentDate().toISOString()
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
  const role = await getUserRole(user.id);
  const isOwner = role === 'owner' || role === 'mitra';

  if (!isAdmin && !isOwner) throw new Error('Access Denied');

  const limit = typeof limitOrType === 'number' ? limitOrType : 1000;

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

/**
 * getResidentStatus: Fetches the current lease state for all active residents.
 * Reads from resident_status table AND extracts offline/survey occupants from properties.room_types.
 */
export async function getResidentStatus(filters?: { ownerUid?: string; userId?: string } | string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    let ownerUid: string | undefined;
    let userId: string | undefined;

    if (typeof filters === 'string') {
        ownerUid = filters;
    } else if (filters) {
        ownerUid = filters.ownerUid;
        userId = filters.userId;
    }

    console.log("FETCH_RESIDENTS: Fetching for", { ownerUid, userId });
    
    // 1. Fetch relevant properties (especially if ownerUid is specified, with dual-check fallback for KostManager requests)
    let propertiesForExtraction: any[] = [];
    let propIds: string[] = [];

    if (ownerUid) {
        const [propsRes, kmReqsRes] = await Promise.all([
            supabase.from('properties').select('id, title, address, city, area, image_urls, location, price, room_types, additional_fee_name, additional_fee_price, owner_uid, created_at').eq('owner_uid', ownerUid),
            supabase.from('kostmanager_requests').select('property_id').eq('user_id', ownerUid)
        ]);

        let combinedProps = propsRes.data || [];
        const kmPropIds = (kmReqsRes.data || []).map(r => r.property_id).filter(Boolean);
        if (kmPropIds.length > 0) {
            const missingKmIds = kmPropIds.filter(id => !combinedProps.some(p => p.id === id));
            if (missingKmIds.length > 0) {
                const { data: kmProps } = await supabase.from('properties').select('id, title, address, city, area, image_urls, location, price, room_types, additional_fee_name, additional_fee_price, owner_uid, created_at').in('id', missingKmIds);
                if (kmProps) combinedProps = [...combinedProps, ...kmProps];
            }
        }
        propertiesForExtraction = combinedProps;
        propIds = combinedProps.map(p => p.id);
        
        if (propIds.length === 0) {
            console.log("FETCH_RESIDENTS: No properties found for owner", ownerUid);
            return [];
        }
    } else if (!userId) {
        // Admin view - fetch all properties to extract offline occupants as well
        const { data: allProps } = await supabase.from('properties').select('id, title, address, city, area, image_urls, location, price, room_types, additional_fee_name, additional_fee_price, owner_uid, created_at');
        propertiesForExtraction = allProps || [];
    }

    // 2. Fetch base records from resident_status
    let query = supabase.from('resident_status').select('*');
    if (propIds.length > 0) {
        query = query.in('kost_id', propIds);
    }
    if (userId) {
        query = query.eq('user_id', userId);
    }
    
    const { data: residents, error: resError } = await query.order('created_at', { ascending: false });
    
    if (resError) {
        console.error("getResidentStatus error:", resError.message);
        return [];
    }

    const onlineResidents = residents || [];

    // 3. Perform Manual Joins for online residents
    const userIds = [...new Set(onlineResidents.map(r => r.user_id).filter(Boolean))];
    const propertyIds = [...new Set([...onlineResidents.map(r => r.kost_id).filter(Boolean), ...propIds])];
    const trxIds = [...new Set(onlineResidents.map(r => r.last_transaction_id).filter(Boolean))];

    const [usersRes, propsRes, trxsRes] = await Promise.all([
        userIds.length > 0 ? supabase.from('users').select('id, name, full_name, photo_url, phone, occupation, institution, city, address, email').in('id', userIds) : { data: [] },
        propertyIds.length > 0 ? supabase.from('properties').select('id, title, address, city, area, image_urls, location, price, room_types, additional_fee_name, additional_fee_price, owner_uid, created_at').in('id', propertyIds) : { data: [] },
        trxIds.length > 0 ? supabase.from('transactions').select('id, amount, status, payment_method, pakasir_order_id, metadata, product_type').in('id', trxIds.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))) : { data: [] }
    ]);

    const userMap = new Map(usersRes.data?.map(u => [u.id, u]) || []);
    const propMap = new Map((propsRes.data || propertiesForExtraction).map(p => [p.id, p]));
    const trxMap = new Map(trxsRes.data?.map(t => [t.id, t]) || []);

    // 4. Assemble online records
    const mappedData = onlineResidents.map(r => {
        const userData = userMap.get(r.user_id);
        const propData = propMap.get(r.kost_id);
        const trxData = trxMap.get(r.last_transaction_id);

        return {
            ...r,
            user: userData || null,
            property: propData || null,
            last_transaction: trxData || null
        };
    });

    // 5. Ekstraksi Penghuni Offline / KostManager Survey (Jika tidak mencari spesifik userId penyewa lain)
    const offlineResidents: any[] = [];
    if (!userId) {
        const occupiedRoomSet = new Set(
            mappedData.map(r => `${r.kost_id}_${String(r.room_type || '').toLowerCase().trim()}`)
        );

        const propsToCheck = propertiesForExtraction.length > 0 ? propertiesForExtraction : (propsRes.data || []);
        
        propsToCheck.forEach(p => {
            const roomList = Array.isArray(p.room_types) ? p.room_types : [];
            roomList.forEach((rt: any, rIdx: number) => {
                const isOccupied = rt.isAvailable === false || rt.status === 'Terisi' || Boolean(rt.residentName || rt.tenantName || rt.occupant_name);
                if (isOccupied) {
                    const cleanRoomName = rt.name ? (String(rt.name).trim().toLowerCase().startsWith('kamar') ? rt.name : `Kamar ${rt.name}`) : `Kamar ${rIdx + 1}`;
                    const roomKey = `${p.id}_${cleanRoomName.toLowerCase().trim()}`;
                    
                    if (!occupiedRoomSet.has(roomKey)) {
                        const tenantName = (rt.residentName || rt.tenantName || rt.occupant_name || `Penghuni Kamar ${rt.name || rIdx + 1}`).trim();
                        const rentPrice = Number(rt.price) || Number(rt.monthlyPrice) || (Array.isArray(rt.pricing) && rt.pricing[0]?.price) || Number(p.price) || 0;
                        const startDate = rt.startDate || rt.leaseStartDate || rt.start_date || (p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
                        const endDate = rt.endDate || rt.leaseEndDate || rt.end_date || '';

                        offlineResidents.push({
                            id: `survey-resident-${p.id}-${rIdx}`,
                            user_id: p.owner_uid || ownerUid || `survey-user-${p.id}-${rIdx}`,
                            kost_id: p.id,
                            room_type: cleanRoomName,
                            start_date: startDate,
                            end_date: endDate || 'Sewa Berjalan',
                            status: 'ACTIVE',
                            total_months: 1,
                            last_transaction_id: `survey-trx-${p.id}-${rIdx}`,
                            created_at: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
                            user: {
                                id: `survey-user-${p.id}-${rIdx}`,
                                name: tenantName,
                                full_name: tenantName,
                                phone: rt.residentPhone || rt.tenantPhone || rt.occupant_phone || '-',
                                email: rt.residentEmail || rt.tenantEmail || '-',
                                photo_url: rt.residentKtpUrl || '',
                                occupation: 'Penghuni Kost',
                                institution: '-',
                                city: p.city || '-',
                                address: p.address || '-'
                            },
                            property: p,
                            last_transaction: {
                                id: `survey-trx-${p.id}-${rIdx}`,
                                amount: rentPrice,
                                status: 'PAID',
                                payment_method: 'CASH / Survey',
                                metadata: {
                                    basePrice: rentPrice,
                                    price: rentPrice,
                                    occupants: Number(rt.currentOccupants) || 1,
                                    extraPersonFee: Number(rt.extraOccupantFee) || 0,
                                    facilityAmount: 0,
                                    platformFee: 0,
                                    billingPeriod: rt.paymentPeriod || rt.billingPeriod || 'bulanan',
                                    phone: rt.residentPhone || rt.tenantPhone || rt.occupant_phone || '-',
                                    isSurveyOccupant: true
                                }
                            }
                        });
                    }
                }
            });
        });
    }

    const allCombined = [...mappedData, ...offlineResidents];
    console.log(`FETCH_RESIDENTS: Assembled ${allCombined.length} total records (${mappedData.length} online, ${offlineResidents.length} survey/offline)`);
    return allCombined;
}

/**
 * syncResidentStatus: Synchronizes a PAID transaction with the resident_status table.
 * This is the frontend implementation of the backend logic to handle simulation gaps.
 */
export async function syncResidentStatus(transactionId: string, metadataOverride?: any, transactionOverride?: any) {
    try {
        console.log(`SYNC_RESIDENT: Starting for Transaction ${transactionId}`);
        
        // 1. Get transaction data (Use override if provided to avoid race conditions)
        let trx = transactionOverride;
        
        if (!trx) {
            const { data, error: fetchErr } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', transactionId)
                .maybeSingle(); // Use maybeSingle to avoid 406/single errors
                
            if (fetchErr || !data) {
                console.error("SYNC_RESIDENT: Transaction not found in DB", fetchErr);
                return;
            }
            trx = data;
        } else {
            console.log("SYNC_RESIDENT: Using provided transaction override (Fast-track)");
        }

        // Only sync if PAID or SUCCESS (or if we have manual override from simulation)
        const status = (trx.status || '').toUpperCase();
        console.log(`SYNC_RESIDENT: [DEBUG] Checking status for trx ${transactionId}. Current status: ${status}`);
        
        if (status !== 'PAID' && status !== 'SUCCESS' && !metadataOverride) {
            console.log(`SYNC_RESIDENT: Skipping. Status is ${status}. Sync only runs for PAID/SUCCESS.`);
            return;
        }

        if (metadataOverride) {
            console.log("SYNC_RESIDENT: [DEBUG] Manual Sync Triggered for Extension Simulation");
        }

        const dbMeta = trx.metadata || {};
        // Merge instead of override to preserve existing data (like roomType from DB)
        const meta = { ...dbMeta, ...(metadataOverride || {}) };
        
        const parseDateSafely = (d: any) => {
            if (!d) return null;
            if (d instanceof Date) return d;
            
            // Handle Indonesian Month Names if present
            let cleanDate = String(d);
            const monthsIndo: Record<string, string> = {
                'januari': 'January', 'februari': 'February', 'maret': 'March', 'april': 'April',
                'mei': 'May', 'juni': 'June', 'juli': 'July', 'agustus': 'August',
                'september': 'September', 'oktober': 'October', 'november': 'November', 'desember': 'December',
                'jan': 'January', 'feb': 'February', 'mar': 'March', 'apr': 'April', 'jun': 'June',
                'jul': 'July', 'ags': 'August', 'sep': 'September', 'okt': 'October', 'nov': 'November', 'des': 'December'
            };
            
            Object.entries(monthsIndo).forEach(([indo, eng]) => {
                const regex = new RegExp(`\\b${indo}\\b`, 'gi');
                cleanDate = cleanDate.replace(regex, eng);
            });

            const date = new Date(cleanDate);
            if (!isNaN(date.getTime())) return date;
            
            // Fallback for YYYY-MM-DD
            const isoMatch = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (isoMatch) {
                return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
            }
            
            return null;
        };

        const userId = trx.user_id;
        // Get kostId from all possible sources
        const kostId = trx.kost_id || meta.kostId || trx.product_id;
        const roomType = trx.room_type || meta.roomType || meta.variantName || '-';

        // 3. Determine Duration Types EARLY
        const isExtension = trx.product_type === 'perpanjangan_sewa' || !!meta.extensionPeriod || meta.extensionType === 'manual_extension';
        const isFacilityOnly = (trx.product_type === 'tagihan_ekstra' || meta.isFacilityPayment || meta.isFacilityOnly || (meta.billPayment && !isExtension)) && !isExtension;

        if (!userId || !kostId) {
            console.warn("SYNC_RESIDENT: Missing userId or kostId");
            return;
        }

        // 2. Fetch Existing Record — COMPREHENSIVE SEARCH
        let existing: any = null;
        const incomingSessionId = meta.booking_session_id || meta.bookingSessionId;
        console.log(`SYNC_RESIDENT: [DEBUG] Starting Comprehensive Search for User: ${userId}, Kost: ${kostId}`);

        // Fetch all records for this user and kost to find a match
        const { data: candidates, error: listErr } = await supabase
            .from('resident_status')
            .select('*')
            .eq('user_id', userId)
            .eq('kost_id', kostId);

        if (listErr) {
            console.error("SYNC_RESIDENT: [DEBUG] Failed to fetch resident candidates", listErr);
        } else if (candidates && candidates.length > 0) {
            console.log(`SYNC_RESIDENT: [DEBUG] Found ${candidates.length} candidate records.`);
            
            // PRIORITY 1: Match by booking_session_id
            if (incomingSessionId) {
                existing = candidates.find(r => r.metadata?.booking_session_id === incomingSessionId);
            }

            // PRIORITY 2: Match by ACTIVE status (if no session match)
            if (!existing) {
                existing = candidates.find(r => (r.status || '').toUpperCase() === 'ACTIVE');
            }

            // PRIORITY 3: Match by latest updated_at
            if (!existing) {
                existing = candidates.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0];
            }

            if (existing) {
                console.log(`SYNC_RESIDENT: [DEBUG] ✅ Match found (ID: ${existing.id}, Status: ${existing.status})`);
            }
        }
        
        // 3. Determine Duration (Already calculated types above)
        
        console.log(`SYNC_RESIDENT: [DEBUG] TransactionID=${transactionId}, isExtension=${isExtension}, isFacilityOnly=${isFacilityOnly}`);
        
        // 3. Determine Duration (Comprehensive Parsing)
        const possibleDurationFields = [
            meta.extensionPeriod, 
            meta.duration, 
            meta.periodLabel, 
            meta.period, 
            meta.paketSewa
        ];
        
        let durationInMonths = 0;
        let foundYearly = false;
        let numericValue = 1;

        // Search through all fields for a year indicator
        for (const field of possibleDurationFields) {
            if (!field) continue;
            const strField = String(field).toLowerCase();
            if (strField.includes('tahun') || strField.includes('year') || strField.includes('thn')) {
                const match = strField.match(/(\d+)/);
                numericValue = match ? parseInt(match[1], 10) : 1;
                durationInMonths = numericValue * 12;
                foundYearly = true;
                console.log(`SYNC_RESIDENT: [DEBUG] Year-based duration detected in field: ${field}. Result: ${durationInMonths} months.`);
                break;
            }
        }

        // If no yearly indicator found, fall back to month-based parsing
        if (!foundYearly) {
            const rawDuration = meta.extensionPeriod ?? meta.duration ?? meta.periodLabel ?? meta.period ?? '1';
            numericValue = typeof rawDuration === 'number' 
                ? rawDuration 
                : (parseInt(String(rawDuration).match(/(\d+)/)?.[1] || '1', 10) || 1);
            durationInMonths = numericValue;
            console.log(`SYNC_RESIDENT: [DEBUG] Month-based duration detected: ${durationInMonths} months.`);
        }

        // If it's an extension but no duration found, default to 1 month
        if (isExtension && durationInMonths === 0) {
            console.log("SYNC_RESIDENT: [DEBUG] Extension detected but no duration found. Defaulting to 1 month.");
            durationInMonths = 1;
        }

        // If it's JUST a facility bill payment, don't add duration to the rent
        if (isFacilityOnly) {
            console.log("SYNC_RESIDENT: [DEBUG] Facility bill only detected. Setting duration increase to 0.");
            durationInMonths = 0;
        }

        console.log(`SYNC_RESIDENT: [DEBUG] Final Duration to Add: ${durationInMonths} months`);
        
        if (isExtension) {
            console.log(`SYNC_RESIDENT: [DEBUG] Perpanjangan Sewa (+${durationInMonths} Bulan) detected.`);
        }

        // 4. Determine Dates
        const startDateRaw = meta.startDate || meta.move_in_date || trx.created_at;
        
        // IDEMPOTENCY CHECK 1: Check existing last_transaction_id
        if (existing && existing.last_transaction_id === transactionId && !metadataOverride) {
            console.log("SYNC_RESIDENT: [DEBUG] Transaction already processed (last_transaction_id match). Skipping.");
            return;
        }

        // IDEMPOTENCY CHECK 2: Check processed_transactions array (Synced with Backend)
        const processedTrx = Array.isArray(existing?.metadata?.processed_transactions) ? existing.metadata.processed_transactions : [];
        if (processedTrx.includes(transactionId) && !metadataOverride) {
            console.log(`SYNC_RESIDENT: [DEBUG] Transaction ${transactionId} already processed in processed_transactions array. Skipping.`);
            return;
        }

        // IDEMPOTENCY CHECK 3: Check if this is a Parent transaction whose Child was already processed
        if (meta.is_bundled_parent && existing && !metadataOverride) {
            // Check if any processed transaction is a child of this parent
            // Since we don't have the full child list here easily, we just check if any processed ID starts with this parent ID
            const hasProcessedChild = processedTrx.some((id: string) => id.startsWith(transactionId + '-'));
            if (hasProcessedChild) {
                console.log(`SYNC_RESIDENT: [DEBUG] Parent Transaction ${transactionId} skipped because its Child was already processed.`);
                return;
            }
        }

        // NEW SESSION DETECTION: Jika ada booking_session_id baru, kita abaikan riwayat lama
        const isNewSession = !isExtension && incomingSessionId && (!existing || (existing.metadata?.booking_session_id && existing.metadata?.booking_session_id !== incomingSessionId));

        // Only extend if it's NOT a new session and it's an extension or has duration
        let baseDateForExtension: Date | null = null;
        if (existing && !isNewSession && (isExtension || (existing.end_date && durationInMonths > 0))) {
            baseDateForExtension = parseDateSafely(existing.end_date);
            console.log(`SYNC_RESIDENT: [DEBUG] EXTENDING from existing end_date: ${existing.end_date}`);
        } else if (existing && !isNewSession) {
            // Preserve current dates for facility payments
            baseDateForExtension = parseDateSafely(existing.end_date);
            console.log(`SYNC_RESIDENT: [DEBUG] Facility payment. Preserving existing dates.`);
            durationInMonths = 0;
        } else {
            // FRESH START (New Session or No Existing Record)
            baseDateForExtension = parseDateSafely(startDateRaw);
            console.log(`SYNC_RESIDENT: [DEBUG] STARTING FRESH from: ${startDateRaw}`);
        }

        if (!baseDateForExtension) {
            baseDateForExtension = getCurrentDate();
            console.warn("SYNC_RESIDENT: [DEBUG] Fallback to today (via TimeSimulator) for base date.");
        }

        const newEndDate = new Date(baseDateForExtension);
        console.log(`SYNC_RESIDENT: [DEBUG] Before Add Month: ${newEndDate.toISOString()} + ${durationInMonths} months`);
        newEndDate.setMonth(newEndDate.getMonth() + durationInMonths);
        console.log(`SYNC_RESIDENT: [DEBUG] After Add Month: ${newEndDate.toISOString()}`);

        const parseDateISO = (d: any) => {
            const date = parseDateSafely(d);
            return date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]; // ALWAYS fallback to today
        };

        const startDate = (existing?.start_date && !isNewSession) ? existing.start_date : parseDateISO(startDateRaw);
        const currentTotalMonths = isNewSession ? 0 : Number(existing?.total_months || 0);
        const newTotalMonths = currentTotalMonths + durationInMonths;
        const endDate = parseDateISO(newEndDate);

        console.log(`SYNC_RESIDENT: [DEBUG] FINAL CALCULATION: Start=${startDate}, End=${endDate} (+${durationInMonths} months)`);

        const durationLabel = durationInMonths >= 12 && durationInMonths % 12 === 0 
            ? `${durationInMonths / 12} Tahun` 
            : `${durationInMonths} Bulan`;

        // 5. Save computed data back to transaction for record keeping
        await supabase
            .from('transactions')
            .update({ 
                metadata: { 
                    ...meta, 
                    computedEndDate: endDate, 
                    computedStartDate: startDate,
                    paketSewa: durationLabel
                }
            })
            .eq('id', transactionId);

        // 6. Build Payload
        const resolvedSessionId = incomingSessionId || existing?.metadata?.booking_session_id;

        const mergedMetadata = {
            ...(existing?.metadata || {}),
            ...meta,
            booking_session_id: resolvedSessionId,
            extraPersonFee: (() => {
                const dur = Number(meta.extensionPeriod || meta.duration || (meta.period === 'bulanan' ? 1 : (meta.period === '3bulanan' ? 3 : (meta.period === '6bulanan' ? 6 : (meta.period === 'tahunan' ? 12 : 1)))));
                if (meta.composition?.extraPersonFee) return Number(meta.composition.extraPersonFee) / (Number(meta.extensionPeriod || 1));
                if (meta.extraPersonFee) return Number(meta.extraPersonFee) / dur;
                return existing?.metadata?.extraPersonFee || 0;
            })(),
            occupants: meta.occupants || meta.occupantsCount || meta.composition?.occupants || existing?.metadata?.occupants || 1,
            paketSewa: durationInMonths > 0 ? durationLabel : (existing?.metadata?.paketSewa),
            lastExtendedAt: durationInMonths > 0 ? getCurrentDate().toISOString() : (existing?.metadata?.lastExtendedAt),
            lastFacilityPaidAt: isFacilityOnly ? getCurrentDate().toISOString() : (existing?.metadata?.lastFacilityPaidAt),
            paidBills: meta.billId ? Array.from(new Set([...(existing?.metadata?.paidBills || []), meta.billId])) : (existing?.metadata?.paidBills || []),
            lastEndDate: endDate,
            accumulatedMonths: newTotalMonths,
            processed_transactions: Array.from(new Set([...processedTrx, transactionId]))
        };

        // --- RESOLVE RELATIONAL ROOM_ID ---
        let roomId: string | null = existing?.room_id || null;
        if (kostId && !roomId) {
            const targetRoomNumber = meta.roomNumber || meta.room_number || meta.roomName || null;
            if (targetRoomNumber) {
                const { data: matchedRoom } = await supabase
                    .from('rooms')
                    .select('id')
                    .eq('property_id', kostId)
                    .eq('room_number', String(targetRoomNumber).trim())
                    .maybeSingle();
                if (matchedRoom?.id) roomId = matchedRoom.id;
            }

            if (!roomId && roomType && roomType !== '-') {
                const { data: matchedRooms } = await supabase
                    .from('rooms')
                    .select('id, status')
                    .eq('property_id', kostId)
                    .eq('room_type_name', roomType);
                if (matchedRooms && matchedRooms.length > 0) {
                    const availableRoom = matchedRooms.find(r => r.status === 'available') || matchedRooms[0];
                    roomId = availableRoom.id;
                }
            }
        }

        const payload: any = {
            user_id: userId,
            kost_id: kostId,
            room_id: roomId,
            room_type: roomType !== '-' ? roomType : (existing?.room_type || roomType),
            start_date: startDate,
            end_date: endDate,
            total_months: newTotalMonths,
            last_transaction_id: isFacilityOnly && existing?.last_transaction_id ? existing.last_transaction_id : transactionId,
            status: 'ACTIVE',
            metadata: mergedMetadata,
            updated_at: getCurrentDate().toISOString()
        };

        console.log('[DEBUG] Syncing resident_status payload:', JSON.stringify(payload, null, 2));

        // 7. PERFORM DB OPERATION (UPSERT)
        let syncError: any = null;

        if (existing) {
            console.log(`SYNC_RESIDENT: [DEBUG] Performing UPDATE for resident_status ${existing.id}`);
            const { error } = await supabase.from('resident_status').update(payload).eq('id', existing.id);
            syncError = error;
        } else {
            // Check once more right before insert to prevent race-condition duplicates
            const { data: doubleCheck } = await supabase
                .from('resident_status')
                .select('id')
                .eq('user_id', userId)
                .eq('kost_id', kostId)
                .maybeSingle();

            if (doubleCheck?.id) {
                console.log(`SYNC_RESIDENT: [DEBUG] Race-condition prevented: Found existing resident_status ${doubleCheck.id}, updating instead of insert.`);
                const { error } = await supabase.from('resident_status').update(payload).eq('id', doubleCheck.id);
                syncError = error;
            } else {
                const { error } = await supabase.from('resident_status').insert([payload]);
                if (error && error.code === '23505') {
                    const { data: retryRow } = await supabase.from('resident_status').select('id').eq('user_id', userId).eq('kost_id', kostId).maybeSingle();
                    if (retryRow?.id) {
                        const { error: updateErr } = await supabase.from('resident_status').update(payload).eq('id', retryRow.id);
                        syncError = updateErr;
                    }
                } else {
                    syncError = error;
                }
            }
        }

        if (syncError) throw syncError;

        // Update room status to occupied in the properties.room_types array & sync to mitra_kostmanager
        if (!isFacilityOnly && kostId) {
            const targetRoomName = (meta.roomNumber || meta.variantName || meta.roomName || '').trim();
            const tenantDisplayName = (meta.tenantName || meta.userName || meta.name || '').trim();
            const tenantPhoneNum = (meta.userPhone || meta.phone || meta.residentPhone || '').trim();

            try {
                const { data: propRow } = await supabase
                    .from('properties')
                    .select('id, room_types')
                    .eq('id', kostId)
                    .maybeSingle();

                if (propRow && Array.isArray(propRow.room_types)) {
                    let roomMatched = false;
                    const updatedRoomTypes = propRow.room_types.map((rm: any, rmIdx: number) => {
                        const curRoomNum = (rm.name || rm.roomNumber || '').trim();
                        const curRoomNumNorm = curRoomNum.replace(/^kamar\s*/i, '').toLowerCase();
                        const targetRoomNumNorm = targetRoomName.replace(/^kamar\s*/i, '').toLowerCase();

                        const isMatch = targetRoomName && (
                            curRoomNum.toLowerCase() === targetRoomName.toLowerCase() ||
                            (curRoomNumNorm && targetRoomNumNorm && curRoomNumNorm === targetRoomNumNorm) ||
                            (rm.id && rm.id === roomId)
                        );

                        if (isMatch) {
                            roomMatched = true;
                            return {
                                ...rm,
                                status: 'Terisi',
                                isAvailable: false,
                                residentName: tenantDisplayName || rm.residentName || 'Penghuni Terdata',
                                residentPhone: tenantPhoneNum || rm.residentPhone || '',
                                startDate: startDate || rm.startDate || '',
                                endDate: endDate || rm.endDate || ''
                            };
                        }
                        return rm;
                    });

                    if (roomMatched) {
                        await supabase
                            .from('properties')
                            .update({
                                room_types: updatedRoomTypes,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', kostId);

                        // Sync to mitra_kostmanager table as well
                        await supabase
                            .from('mitra_kostmanager')
                            .update({ room_types: updatedRoomTypes })
                            .eq('property_id', kostId);

                        console.log(`SYNC_RESIDENT: [SUCCESS] Room ${targetRoomName} marked as occupied in properties.room_types for ${kostId}`);
                    }
                }
            } catch (propRoomErr) {
                console.warn('SYNC_RESIDENT: Failed to update room_types on property:', propRoomErr);
            }
        }

        // Update legacy room status if roomId present
        if (!isFacilityOnly && roomId) {
            await supabase
                .from('rooms')
                .update({ status: 'occupied' })
                .eq('id', roomId);
        }

        const { data: activeRes } = await supabase.from('resident_status').select('id').eq('user_id', userId).eq('kost_id', kostId).eq('status', 'ACTIVE').order('created_at', { ascending: false }).limit(1).single();
        if (activeRes?.id) {
            await supabase.from('transactions').update({ resident_status_id: activeRes.id }).or(`id.eq.${transactionId},metadata->>parent_order_id.eq.${transactionId}`);
        }
    } catch (err) {
        console.error("SYNC_RESIDENT_ERROR:", err);
    }
}

/**
 * syncPropertyRooms: Synchronizes rooms from JSONB properties.room_types to public.rooms table.
 */
export async function syncPropertyRooms(propertyId: string, inputRooms?: any[]): Promise<void> {
    try {
        console.log(`[SYNC_ROOMS] Starting room sync for property ${propertyId}`);
        
        let rawRooms = inputRooms;
        if (!rawRooms) {
            const { data: prop, error: fetchErr } = await supabase
                .from('properties')
                .select('id, room_types')
                .eq('id', propertyId)
                .maybeSingle();

            if (fetchErr || !prop) {
                console.error(`[SYNC_ROOMS] Property not found or query error:`, fetchErr);
                return;
            }
            rawRooms = Array.isArray(prop.room_types) ? prop.room_types : [];
        }

        let flatRooms: any[] = [];
        if (Array.isArray(rawRooms)) {
            rawRooms.forEach((item: any) => {
                // If it's a grouped room type (has a nested rooms array)
                if (Array.isArray(item.rooms)) {
                    item.rooms.forEach((r: any) => {
                        flatRooms.push({
                            roomNumber: r.roomNumber || r.room_number || r.name || '',
                            roomTypeName: item.name || r.roomTypeName || r.room_type_name || 'Standard',
                            price: Number(r.price || item.price) || 0,
                            status: r.status || 'available',
                            roomFacilities: r.roomFacilities || item.roomFacilities || [],
                            bathroomFacilities: r.bathroomFacilities || item.bathroomFacilities || [],
                            images: r.images || r.imageUrls || [],
                            floor: r.floor || item.floor || '',
                            size: r.size || item.size || '3x4m'
                        });
                    });
                } else {
                    // It's a flat room object
                    flatRooms.push({
                        roomNumber: item.name || item.roomNumber || item.room_number || '',
                        roomTypeName: item.type || item.roomTypeName || item.room_type_name || 'Standard',
                        price: Number(item.price || item.price_per_month) || 0,
                        status: item.status || 'available',
                        roomFacilities: item.roomFacilities || [],
                        bathroomFacilities: item.bathroomFacilities || [],
                        images: item.images || item.imageUrls || [],
                        floor: item.floor || '',
                        size: item.size || '3x4m'
                    });
                }
            });
        }

        if (flatRooms.length === 0) {
            console.log(`[SYNC_ROOMS] No physical rooms to sync.`);
            return;
        }

        const roomsPayload = flatRooms.map((r: any) => {
            const roomNumber = String(r.roomNumber).trim();
            const isOccupied = r.status === 'occupied' || r.status === 'terisi';
            const isMaintenance = r.status === 'maintenance' || r.status === 'perbaikan';
            let finalStatus = 'available';
            if (isOccupied) finalStatus = 'occupied';
            else if (isMaintenance) finalStatus = 'maintenance';

            return {
                property_id: propertyId,
                room_number: roomNumber,
                room_type_name: r.roomTypeName,
                price_per_month: Number(r.price) || 0,
                status: finalStatus,
                updated_at: new Date().toISOString()
            };
        });

        // 1. Fetch existing rooms in db
        const { data: dbRooms } = await supabase
            .from('rooms')
            .select('id, room_number')
            .eq('property_id', propertyId);

        const activeRoomNumbers = roomsPayload.map(r => r.room_number);

        if (dbRooms && dbRooms.length > 0) {
            const roomsToDelete = dbRooms.filter(dr => !activeRoomNumbers.includes(dr.room_number));
            if (roomsToDelete.length > 0) {
                const idsToDelete = roomsToDelete.map(dr => dr.id);
                console.log(`[SYNC_ROOMS] Deleting ${idsToDelete.length} removed rooms...`);
                const { error: deleteErr } = await supabase
                    .from('rooms')
                    .delete()
                    .in('id', idsToDelete);
                if (deleteErr) console.error("[SYNC_ROOMS] Delete removed rooms error:", deleteErr);
            }
        }

        // 2. Perform upsert of rooms
        console.log(`[SYNC_ROOMS] Performing upsert for ${roomsPayload.length} rooms...`);
        const { error: upsertErr } = await supabase
            .from('rooms')
            .upsert(roomsPayload, { onConflict: 'property_id,room_number' });

        if (upsertErr) {
            console.error(`[SYNC_ROOMS] Error upserting rooms:`, upsertErr.message);
        } else {
            console.log(`[SYNC_ROOMS] Successfully synced rooms.`);
        }

        // 3. Group flatRooms by roomTypeName and update parent properties table
        const groups: Record<string, any[]> = {};
        flatRooms.forEach((r: any) => {
            const key = r.roomTypeName || 'Standard';
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        });

        const aggregatedRoomTypes = Object.keys(groups).map(typeName => {
            const roomsInGroup = groups[typeName];
            const prices = roomsInGroup.map(r => Number(r.price)).filter(p => p > 0);
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const availableRooms = roomsInGroup.filter(r => r.status === 'available' || r.status === 'kosong' || r.status === 'kosong_siap');
            const availableCount = availableRooms.length;
            const isAvailable = availableCount > 0;
            
            const firstRoom = roomsInGroup[0] || {};
            
            return {
                name: typeName,
                price: minPrice,
                size: firstRoom.size || '3x4m',
                isAvailable: isAvailable,
                availableRoomCount: availableCount,
                maxOccupants: firstRoom.maxOccupants || 1,
                roomFacilities: firstRoom.roomFacilities || [],
                bathroomFacilities: firstRoom.bathroomFacilities || [],
                rooms: roomsInGroup.map(r => ({
                    roomNumber: r.roomNumber,
                    status: r.status,
                    images: r.images || []
                }))
            };
        });

        const allPrices = flatRooms.map(r => Number(r.price)).filter(p => p > 0);
        const finalMinPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

        console.log(`[SYNC_ROOMS] Updating properties table for property ${propertyId} with aggregated room_types...`);
        const { error: propUpdateErr } = await supabase
            .from('properties')
            .update({
                room_types: aggregatedRoomTypes,
                price: finalMinPrice
            })
            .eq('id', propertyId);

        if (propUpdateErr) {
            console.error(`[SYNC_ROOMS] Error updating property:`, propUpdateErr.message);
        }
    } catch (err) {
        console.error(`[SYNC_ROOMS] Fatal error during sync:`, err);
    }
}


/**
 * Generates a valid UUID v4 string deterministically based on transactionId and index.
 */
export function generateDeterministicUuid(transactionId: string, index: number): string {
    const str = `${transactionId}_${index}`;
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    const hex = ((h1 >>> 0).toString(16).padStart(8, '0') + 
                 (h2 >>> 0).toString(16).padStart(8, '0') + 
                 (h1 ^ h2 >>> 0).toString(16).padStart(8, '0') + 
                 (h1 & h2 >>> 0).toString(16).padStart(8, '0')).substring(0, 32);
                 
    const part1 = hex.substring(0, 8);
    const part2 = hex.substring(8, 12);
    const part3 = '4' + hex.substring(13, 16); // force version 4
    const part4 = ((parseInt(hex.substring(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hex.substring(18, 20); // force variant
    const part5 = hex.substring(20, 32);
    
    return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

/**
 * syncSurveyRequest: Synchronizes a PAID survey transaction with the survey_requests table.
 */
export async function syncSurveyRequest(transactionId: string, transactionOverride?: any) {
    try {
        console.log(`SYNC_SURVEY: [DEBUG] Starting for Transaction ${transactionId}`);
        
        let trx = transactionOverride;
        if (!trx) {
            const { data, error: fetchErr } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', transactionId)
                .maybeSingle();
                
            if (fetchErr || !data) {
                console.error("SYNC_SURVEY: [ERROR] Transaction not found in DB", fetchErr);
                return;
            }
            trx = data;
        }

        const status = (trx.status || '').toUpperCase();
        const productType = (trx.product_type || trx.type || '').toLowerCase();

        if (productType !== 'survey') {
            console.log(`SYNC_SURVEY: [DEBUG] Skipping. Product type is ${productType}.`);
            return;
        }

        const PAID_STATUS_LIST = ['PAID', 'SUCCESS', 'SELESAI', 'SETTLEMENT', 'CAPTURE', 'BERHASIL'];
        const isPaid = PAID_STATUS_LIST.includes(status);

        const meta = trx.metadata || {};

        // Normalize phone helper
        const normalizePhone = (p: string) => {
            if (!p || p === '-') return '-';
            let clean = p.replace(/\D/g, '');
            if (clean.startsWith('0')) clean = clean.substring(1);
            if (clean.startsWith('62')) clean = clean.substring(2);
            return `+62${clean}`;
        };

        // Fetch ALL existing records for this transaction (bisa N records)
        const { data: existingRecords } = await supabase
            .from('survey_requests')
            .select('*')
            .eq('transaction_id', transactionId);

        // Sort existing records so they are index-aligned with the kostList order
        const sortedExisting = existingRecords 
            ? [...existingRecords].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            : [];

        const kostList: any[] = Array.isArray(meta.kostList) && meta.kostList.length > 0
            ? meta.kostList
            : [{ // Fallback untuk order lama (1 kost)
                kostName: meta.kostName || meta.title || 'Kost Terdaftar',
                kostAddress: meta.kostAddress || meta.address || '-',
                ownerPhone: meta.ownerPhone || meta.owner_phone || '-',
            }];

        console.log(`SYNC_SURVEY: [DEBUG] Processing ${kostList.length} kost(s) for transaction ${transactionId}`);

        for (let i = 0; i < kostList.length; i++) {
            const kost = kostList[i];
            const targetId = generateDeterministicUuid(transactionId, i);
            // Match by deterministic ID first, fallback to index
            const existing = sortedExisting.find(r => r.id === targetId) || sortedExisting[i] || null;

            // Jika transaksi sudah memiliki record terproses (bukan AWAITING_PAYMENT), jangan buat record PENDING_ASSIGNMENT baru
            const hasProcessedRecord = sortedExisting.some(r => r.status && r.status !== 'AWAITING_PAYMENT');
            if (!existing && hasProcessedRecord) {
                console.log(`SYNC_SURVEY: [DEBUG] Skipping insert. Transaction ${transactionId} already has processed survey record(s).`);
                continue;
            }

            let targetStatus = 'AWAITING_PAYMENT';
            if (existing && existing.status) {
                if (isPaid && existing.status === 'AWAITING_PAYMENT') {
                    targetStatus = 'PENDING_ASSIGNMENT';
                } else {
                    targetStatus = existing.status;
                }
            } else {
                if (isPaid) {
                    targetStatus = 'PENDING_ASSIGNMENT';
                } else {
                    targetStatus = 'AWAITING_PAYMENT';
                }
            }

            const payload: any = {
                id: targetId, // Force deterministic ID
                user_id: trx.user_id,
                transaction_id: transactionId,
                status: targetStatus,
                kost_name: kost.kostName || `Kost #${i + 1}`,
                kost_address: kost.kostAddress || '-',
                owner_phone: normalizePhone(kost.ownerPhone || kost.owner_phone || ''),
                survey_date: meta.surveyDate || existing?.survey_date || getCurrentDate().toISOString().split('T')[0],
                survey_time: meta.surveyTime || existing?.survey_time || '10:00',
                notes: meta.notes || existing?.notes || '',
                updated_at: getCurrentDate().toISOString(),
            };

            // Jangan timpa result_drive_link jika sudah ada
            if (existing?.result_drive_link) {
                payload.result_drive_link = existing.result_drive_link;
            }
            // Jangan timpa evaluation_summary jika sudah ada
            if (existing?.evaluation_summary) {
                payload.evaluation_summary = existing.evaluation_summary;
            }
            // Jangan timpa assigned_agent_id jika sudah ada
            if (existing?.assigned_agent_id) {
                payload.assigned_agent_id = existing.assigned_agent_id;
            }

            if (existing) {
                console.log(`SYNC_SURVEY: [DEBUG] Updating kost #${i + 1} (Target ID: ${targetId}, Existing ID: ${existing.id})`);
                const { error: updateErr } = await supabase
                    .from('survey_requests')
                    .update(payload)
                    .eq('id', existing.id);
                if (updateErr) console.error(`SYNC_SURVEY: Update error for kost #${i + 1}:`, updateErr);
            } else {
                console.log(`SYNC_SURVEY: [DEBUG] Creating NEW record for kost #${i + 1}: ${kost.kostName}`);
                payload.created_at = trx.created_at || getCurrentDate().toISOString();
                const { error: insertErr } = await supabase
                    .from('survey_requests')
                    .insert([payload]);
                if (insertErr) console.error(`SYNC_SURVEY: Insert error for kost #${i + 1}:`, insertErr);
            }
        }

        console.log(`SYNC_SURVEY: [SUCCESS] ${kostList.length} kost record(s) synchronized for transaction ${transactionId}`);

    } catch (err) {
        console.error("SYNC_SURVEY_ERROR:", err);
    }
}

/**
 * syncKostManagerRequest: Synchronizes a PAID kostmanager transaction with the kostmanager_requests table.
 */
export async function syncKostManagerRequest(transactionId: string, transactionOverride?: any) {
    try {
        console.log(`SYNC_KOSTMANAGER: [DEBUG] Starting for Transaction ${transactionId}`);
        
        let trx = transactionOverride;
        if (!trx) {
            const { data, error: fetchErr } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', transactionId)
                .maybeSingle();
                
            if (fetchErr || !data) {
                console.error("SYNC_KOSTMANAGER: [ERROR] Transaction not found in DB", fetchErr);
                return;
            }
            trx = data;
        }

        const status = (trx.status || '').toUpperCase();
        const productType = (trx.product_type || trx.type || '').toLowerCase();

        if (productType !== 'kostmanager' && productType !== 'kostmanager_subscription') {
            console.log(`SYNC_KOSTMANAGER: [DEBUG] Skipping. Product type is ${productType}.`);
            return;
        }

        const PAID_STATUS_LIST = ['PAID', 'SUCCESS', 'SELESAI', 'SETTLEMENT', 'CAPTURE', 'BERHASIL'];
        const isPaid = PAID_STATUS_LIST.includes(status);

        const meta = trx.metadata || {};

        // Fetch existing record
        const { data: existing } = await supabase
            .from('kostmanager_requests')
            .select('*')
            .eq('transaction_id', transactionId)
            .maybeSingle();

        let targetStatus = 'PENDING_ASSIGNMENT';
        if (existing && existing.status) {
            targetStatus = existing.status;
        } else if (isPaid) {
            targetStatus = 'PENDING_ASSIGNMENT';
        }

        const mockDriveLink = `https://drive.google.com/drive/folders/mock-${transactionId.slice(0, 8)}`;

        const isUpgrade = !!meta.propertyId;
        const onboardingType = isUpgrade ? 'Upgrade Mitra Biasa' : 'Pendaftaran Kost Baru';

        const payload: any = {
            user_id: trx.user_id,
            transaction_id: transactionId,
            status: targetStatus,
            kost_name: meta.kostName || meta.title || 'Kost Terdaftar',
            kost_type: meta.kostType || 'Campur',
            empty_rooms: parseInt(meta.emptyRooms) || 0,
            kost_address: meta.address || meta.kostAddress || '-',
            property_id: meta.propertyId || existing?.property_id || null,
            survey_date: meta.surveyDate || existing?.survey_date || null,
            survey_time: meta.surveyTime || existing?.survey_time || null,
            notes: `KostManager Onboarding [${onboardingType}] - Survey Pendataan Lapangan${meta.googleMapsLink ? `\n📍 Link GPS: ${meta.googleMapsLink}` : ''}`,
            result_drive_link: existing?.result_drive_link || mockDriveLink,
            updated_at: getCurrentDate().toISOString(),
        };
        if (existing?.assigned_agent_id) {
            payload.assigned_agent_id = existing.assigned_agent_id;
        }
        if (existing?.agent_name) {
            payload.agent_name = existing.agent_name;
        }
        if (existing?.agent_phone) {
            payload.agent_phone = existing.agent_phone;
        }
        if (existing?.survey_date) {
            payload.survey_date = existing.survey_date;
        }
        if (existing?.survey_time) {
            payload.survey_time = existing.survey_time;
        }
        if (existing?.notes) {
            payload.notes = existing.notes;
        }

        if (existing) {
            console.log(`SYNC_KOSTMANAGER: [DEBUG] Updating KostManager request (ID: ${existing.id})`);
            const { error: updateErr } = await supabase
                .from('kostmanager_requests')
                .update(payload)
                .eq('id', existing.id);
            if (updateErr) console.error(`SYNC_KOSTMANAGER: Update error:`, updateErr);
        } else {
            console.log(`SYNC_KOSTMANAGER: [DEBUG] Creating NEW record: ${payload.kost_name}`);
            payload.created_at = trx.created_at || getCurrentDate().toISOString();
            const { error: insertErr } = await supabase
                .from('kostmanager_requests')
                .insert([payload]);
            if (insertErr) console.error(`SYNC_KOSTMANAGER: Insert error:`, insertErr);
        }

        // Sync to survey_requests and mark property/mitra as managed if PAID
        if (isPaid) {
            // 1. If an existing property was selected, link it (is_managed will be set to true when admin activates Auto-Pilot)
            if (meta.propertyId) {
                console.log(`SYNC_KOSTMANAGER: [DEBUG] Existing property linked: ${meta.propertyId}. (Will set is_managed = true upon Auto-Pilot activation)`);
            }
            
            // 2. Set subscription_status to 'kostmanager' in the mitra table for the owner
            console.log(`SYNC_KOSTMANAGER: [DEBUG] Upgrading subscription_status to 'kostmanager' for user ${trx.user_id}`);
            await supabase
                .from('mitra')
                .update({ subscription_status: 'kostmanager' })
                .eq('user_id', trx.user_id);

            const surveyId = generateDeterministicUuid(transactionId, 999);
            const { data: existingSurvey } = await supabase
                .from('survey_requests')
                .select('*')
                .eq('id', surveyId)
                .maybeSingle();

            let surveyStatus = 'PENDING_ASSIGNMENT';
            if (targetStatus === 'ACTIVE') surveyStatus = 'COMPLETED';
            else if (targetStatus === 'PENDING_ONBOARDING') surveyStatus = 'SURVEYING';
            else surveyStatus = targetStatus;

            // Fetch registered user/mitra phone number as fallback
            let userPhone = '-';
            if (trx.user_id) {
                const { data: uData } = await supabase
                    .from('users')
                    .select('phone')
                    .eq('id', trx.user_id)
                    .maybeSingle();
                if (uData && uData.phone) {
                    userPhone = uData.phone;
                }
            }

            const surveyPayload: any = {
                id: surveyId,
                user_id: trx.user_id,
                transaction_id: transactionId,
                status: surveyStatus,
                kost_name: payload.kost_name,
                kost_address: payload.kost_address,
                owner_phone: meta.ownerPhone || meta.owner_phone || userPhone || '-',
                survey_date: meta.surveyDate || existingSurvey?.survey_date || null,
                survey_time: meta.surveyTime || existingSurvey?.survey_time || null,
                notes: `KostManager Onboarding - Survey Pendataan Lapangan${meta.googleMapsLink ? `\n📍 Link GPS: ${meta.googleMapsLink}` : ''}`,
                updated_at: getCurrentDate().toISOString(),
            };

            if (payload.result_drive_link) surveyPayload.result_drive_link = payload.result_drive_link;
            if (payload.assigned_agent_id) surveyPayload.assigned_agent_id = payload.assigned_agent_id;
            if (payload.agent_name) surveyPayload.agent_name = payload.agent_name;
            if (payload.agent_phone) surveyPayload.agent_phone = payload.agent_phone;

            if (existingSurvey) {
                await supabase.from('survey_requests').update(surveyPayload).eq('id', surveyId);
            } else {
                surveyPayload.created_at = trx.created_at || getCurrentDate().toISOString();
                await supabase.from('survey_requests').insert([surveyPayload]);
            }
        }

        console.log(`SYNC_KOSTMANAGER: [SUCCESS] record synchronized for transaction ${transactionId}`);

    } catch (err) {
        console.error("SYNC_KOSTMANAGER_ERROR:", err);
    }
}


/**
 * autoSyncAllSurveys: Scans for survey transactions that are missing from survey_requests.
 */
export async function autoSyncAllSurveys(userId?: string) {
    try {
        console.log("AUTO_SYNC_SURVEY: [DEBUG] Starting comprehensive scan...");
        
        // Query transactions of type survey
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('product_type', 'survey');
            
        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data: transactions, error } = await query;
        if (error) throw error;

        if (!transactions || transactions.length === 0) {
            console.log("AUTO_SYNC_SURVEY: [DEBUG] No survey transactions found.");
            return;
        }

        console.log(`AUTO_SYNC_SURVEY: [DEBUG] Found ${transactions.length} survey transactions. Processing sync for each...`);

        // Process all found transactions to ensure they exist in survey_requests
        for (const trx of transactions) {
            await syncSurveyRequest(trx.id, trx);
        }
        
        console.log("AUTO_SYNC_SURVEY: [SUCCESS] Scan and sync completed.");
        
    } catch (err) {
        console.error("AUTO_SYNC_SURVEY_ERROR:", err);
    }
}

/**
 * autoSyncAllKostManagers: Scans for kostmanager transactions that are missing from kostmanager_requests.
 */
export async function autoSyncAllKostManagers(userId?: string) {
    try {
        console.log("AUTO_SYNC_KOSTMANAGER: [DEBUG] Starting comprehensive scan...");
        
        let query = supabase
            .from('transactions')
            .select('*')
            .in('product_type', ['kostmanager', 'kostmanager_subscription']);
            
        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data: transactions, error } = await query;
        if (error) throw error;

        if (!transactions || transactions.length === 0) {
            console.log("AUTO_SYNC_KOSTMANAGER: [DEBUG] No kostmanager transactions found.");
            return;
        }

        console.log(`AUTO_SYNC_KOSTMANAGER: [DEBUG] Found ${transactions.length} transactions. Processing sync...`);

        for (const trx of transactions) {
            await syncKostManagerRequest(trx.id, trx);
        }
        
        console.log("AUTO_SYNC_KOSTMANAGER: [SUCCESS] Scan and sync completed.");
        
    } catch (err) {
        console.error("AUTO_SYNC_KOSTMANAGER_ERROR:", err);
    }
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
        updated_at: getCurrentDate().toISOString(),
        ...finalUpdates
    })
    .eq('id', transactionId);

  if (error) {
    console.error('Error updating transaction status:', error.message);
    throw new Error(error.message);
  } else {
    // Post-update logic for certain types
    if (newStatus === 'PAID') {
        const { data: currentTrx } = await supabase.from('transactions').select('*').eq('id', transactionId).single();
        if (currentTrx) {
            const type = (currentTrx.product_type || '').toLowerCase();
            
            // 1. If it's a new booking, trigger the edge function (handles notifications, etc)
            if (type === 'rent' || type === 'kost_booking') {
                console.log(`[AdminService] Detected ${type} transaction. Triggering approval process and sync...`);
                await processBookingApproval(transactionId, 'accept').catch(e => console.error("Auto-process booking error:", e));
                
                // Also call syncResidentStatus directly as a guaranteed fallback,
                // in case the Edge Function fails or is not deployed.
                console.log(`[AdminService] Triggering syncResidentStatus fallback for ${transactionId}`);
                await syncResidentStatus(transactionId).catch(e => {
                    console.error("syncResidentStatus fallback error (non-fatal):", e);
                    // Jika gagal, berikan notifikasi ke konsol yang lebih jelas
                    console.error("CRITICAL: Resident status sync failed for PAID transaction. Data might be out of sync.");
                });
            }
            
            // 2. If it's an extension, update the resident_status end_date
            if (type === 'perpanjangan_sewa' || type === 'extension') {
                await syncResidentStatus(transactionId);
            }

            // 3. If it's a survey, initialize the survey_request record
            if (type === 'survey') {
                console.log(`[AdminService] Detected survey transaction. Syncing survey request...`);
                await syncSurveyRequest(transactionId);
            }

            // 4. If it's a kostmanager subscription, initialize the kostmanager_request record
            if (type === 'kostmanager' || type === 'kostmanager_subscription') {
                console.log(`[AdminService] Detected kostmanager transaction. Syncing request...`);
                await syncKostManagerRequest(transactionId);
            }

        }
    }

    notifyAdminStatusUpdate("Transaksi", transactionId, newStatus, additionalUpdates.metadata);
    triggerCrossTabRefresh();
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

  triggerCrossTabRefresh();
  return data;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Unauthorized: User is not an admin.');

  console.log(`ADMIN_DELETE: Starting cleanup for transaction ${transactionId}`);

  // 1. Get the transaction details before deleting
  const { data: trx } = await supabase.from('transactions').select('*').eq('id', transactionId).single();
  
  if (trx) {
    // 2. Clear references in resident_status
    await supabase
      .from('resident_status')
      .update({ 
        last_transaction_id: null,
        // If this was the only transaction, maybe we should mark it as INACTIVE or similar
        // to prevent "zombie" virtual bills from appearing
      })
      .eq('last_transaction_id', transactionId);

    // 3. Optional: If it's a rent booking being deleted, we might want to be more aggressive
    // to allow a clean simulation re-run.
  }

  // 4. Safely delete the transaction
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw new Error(error.message);
  }
  
  triggerCrossTabRefresh();
}

export async function deleteTransactions(transactionIds: string[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: User not logged in.');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Unauthorized: User is not an admin.');

  console.log(`ADMIN_DELETE_BULK: Cleaning up dependencies for ${transactionIds.length} transactions`);

  // Step 1: Release foreign key in resident_status for ALL selected transactions
  await supabase
    .from('resident_status')
    .update({ last_transaction_id: null })
    .in('last_transaction_id', transactionIds);

  // Step 2: Now safely delete the transactions in bulk
  const { error } = await supabase
    .from('transactions')
    .delete()
    .in('id', transactionIds);

  if (error) {
    console.error('Error deleting multiple transactions:', error);
    throw new Error(error.message);
  }
  triggerCrossTabRefresh();
}

/**
 * deleteResidentStatus: Safely deletes a resident record by breaking circular FK dependencies.
 */
export async function deleteResidentStatus(residentId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Unauthorized: Hanya admin yang dapat menghapus status penghuni.');

  console.log(`ADMIN_DELETE_RESIDENT: Starting cleanup for ${residentId}`);

  // Step 1: Release foreign key in transactions pointing to this resident
  await supabase
    .from('transactions')
    .update({ resident_status_id: null })
    .eq('resident_status_id', residentId);

  // Step 2: Release its own FK to transaction (if any) to be extra safe
  await supabase
    .from('resident_status')
    .update({ last_transaction_id: null })
    .eq('id', residentId);

  // Step 3: Now delete the resident status record
  const { error } = await supabase
    .from('resident_status')
    .delete()
    .eq('id', residentId);

  if (error) {
    console.error('Error deleting resident status:', error);
    throw new Error(error.message);
  }
  
  triggerCrossTabRefresh();
}

export async function addPropertyWithMedia(
  kostData: Partial<Kost>,
  imageFiles: (File | { file: File; label?: string; category?: string })[],
  videoFiles: File[] = []
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Anda harus login.');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  const targetOwnerUid = (isAdmin && kostData.ownerUid) ? kostData.ownerUid : user.id;

  // Generate a temporary ID for Storage path (will be overwritten with DB-generated UUID)
  const tempId = crypto.randomUUID();

  const existingImages = (kostData.imageUrls || []).map((url: any) => {
    if (typeof url === 'string') return { original: url, url };
    return {
      original: url.original || url.url || '',
      url: url.url || url.original || '',
      ...(url.label ? { label: url.label } : {}),
      ...(url.category ? { category: url.category } : {})
    };
  });
  const existingVideos = (kostData.videoUrls || []).map((url: any) =>
    typeof url === 'string' ? { original: url } : url
  );

  // Upload new images with category label support
  const newImageObjects: any[] = [];
  for (const item of imageFiles) {
    const rawFile = (item && 'file' in item) ? item.file : (item as File);
    const label = (item && 'label' in item) ? (item.label || item.category) : undefined;
    const webpFile = await convertToWebP(rawFile);
    const url = await uploadFileToStorage(webpFile, 'properties', `${user.id}/${tempId}/images/original`);
    newImageObjects.push({ 
      original: url, 
      url, 
      ...(label ? { label } : {}) 
    });
  }

  // Upload new videos
  const newVideoObjects: VideoUrlObject[] = [];
  for (const file of videoFiles) {
    const url = await uploadFileToStorage(file, 'properties', `${user.id}/${tempId}/videos/original`);
    newVideoObjects.push({ original: url });
  }

  const allImages = [...existingImages, ...newImageObjects];
  const derivedPhotoCategories = kostData.photoCategories && kostData.photoCategories.length > 0
    ? kostData.photoCategories
    : allImages.map((img: any) => img.label || '');

  const derivedCategorizedPhotos = (kostData.categorizedPhotos && Object.keys(kostData.categorizedPhotos).length > 0)
    ? kostData.categorizedPhotos
    : (() => {
        const catMap: Record<string, string[]> = {};
        allImages.forEach((img: any) => {
          const cat = img.label || 'Foto Properti';
          const u = img.original || img.url;
          if (u) {
            if (!catMap[cat]) catMap[cat] = [];
            catMap[cat].push(u);
          }
        });
        return catMap;
      })();

  // Insert into Supabase (PostgreSQL)
  const { data: inserted, error } = await supabase
    .from('properties')
    .insert({
      owner_uid: targetOwnerUid,
      mitra_id: targetOwnerUid, // Menambahkan mitra_id karena constraint di DB
      title: kostData.title,
      description: kostData.description,
      price: Number(kostData.price || 0),
      facilities: kostData.facilities || [],
      address: kostData.address,
      city: kostData.city,
      area: kostData.area || '',
      metadata: {
        ...(kostData.metadata || {}),
        province: kostData.province || '',
        photo_categories: derivedPhotoCategories,
        categorized_photos: derivedCategorizedPhotos
      },
      type: kostData.type,
      property_type: kostData.type, // Map the type specifically for Supabase DB
      status: kostData.status || 'draft',
      is_verified: kostData.isVerified ?? false,
      is_managed: kostData.isManaged ?? false,
      rating: Number(kostData.rating || 0),
      location: kostData.location,
      image_urls: allImages,
      photo_categories: derivedPhotoCategories,
      categorized_photos: derivedCategorizedPhotos,
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
      additional_fee_starts_from: kostData.additionalFeeStartsFrom || 'month_1',
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

  await syncPropertyRooms(inserted.id);
  return inserted.id;
}

export async function updatePropertyWithMedia(
  propertyId: string,
  kostData: Partial<Kost>,
  newImageFiles: (File | { file: File; label?: string; category?: string })[],
  newVideoFiles: File[] = []
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

  const keptImageStrings = (kostData.imageUrls || []).map((img: any) => 
    typeof img === 'string' ? img : (img?.original || img?.url || '')
  );
  const keptVideoStrings = kostData.videoUrls || [];

  // Determine deletions
  const itemsToDelete = currentImageObjects.filter((imgObj: any) => {
    const isKept = keptImageStrings.some(keptUrl =>
      keptUrl === imgObj.original ||
      keptUrl === imgObj.webp ||
      keptUrl === imgObj.thumbnail ||
      keptUrl === imgObj ||
      keptUrl === imgObj.url
    );
    return !isKept;
  });

  const videosToDelete = currentVideoObjects.filter((vidObj: any) => {
    const isKept = keptVideoStrings.some(keptUrl =>
      keptUrl === vidObj.original ||
      keptUrl === vidObj.webp ||
      keptUrl === vidObj
    );
    return !isKept;
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

  // Filter kept objects and sync labels from kostData.imageUrls if updated
  const finalImageObjects = (kostData.imageUrls && kostData.imageUrls.length > 0)
    ? kostData.imageUrls.map((img: any) => {
        if (typeof img === 'string') return { original: img, url: img };
        return {
          original: img.original || img.url || '',
          url: img.url || img.original || '',
          ...(img.label ? { label: img.label } : {}),
          ...(img.category ? { category: img.category } : {})
        };
      })
    : currentImageObjects.filter((imgObj: any) => {
        return keptImageStrings.some(keptUrl =>
          keptUrl === imgObj.original ||
          keptUrl === imgObj.webp ||
          keptUrl === imgObj.thumbnail ||
          keptUrl === imgObj ||
          keptUrl === imgObj.url
        );
      });

  const finalVideoObjects = currentVideoObjects.filter((vidObj: any) => {
    const url = typeof vidObj === 'string' ? vidObj : vidObj.original;
    return keptVideoStrings.includes(url);
  });

  // Upload new files with category label support
  const newImageObjects: any[] = [];
  for (const item of newImageFiles) {
    const rawFile = (item && 'file' in item) ? item.file : (item as File);
    const label = (item && 'label' in item) ? (item.label || item.category) : undefined;
    const webpFile = await convertToWebP(rawFile);
    const url = await uploadFileToStorage(webpFile, 'properties', `${user.id}/${propertyId}/images/original`);
    newImageObjects.push({ 
      original: url, 
      url, 
      ...(label ? { label } : {}) 
    });
  }

  const newVideoObjects: VideoUrlObject[] = [];
  for (const file of newVideoFiles) {
    const url = await uploadFileToStorage(file, 'properties', `${user.id}/${propertyId}/videos/original`);
    newVideoObjects.push({ original: url });
  }

  const targetOwnerUid = (isAdmin && kostData.ownerUid) ? kostData.ownerUid : existing.owner_uid;
  const allImages = [...finalImageObjects, ...newImageObjects];

  const derivedPhotoCategories = kostData.photoCategories && kostData.photoCategories.length > 0
    ? kostData.photoCategories
    : allImages.map((img: any) => img.label || '');

  const derivedCategorizedPhotos = (kostData.categorizedPhotos && Object.keys(kostData.categorizedPhotos).length > 0)
    ? kostData.categorizedPhotos
    : (() => {
        const catMap: Record<string, string[]> = {};
        allImages.forEach((img: any) => {
          const cat = img.label || 'Foto Properti';
          const u = img.original || img.url;
          if (u) {
            if (!catMap[cat]) catMap[cat] = [];
            catMap[cat].push(u);
          }
        });
        return catMap;
      })();

  const { error: updateError } = await supabase
    .from('properties')
    .update({
      owner_uid: targetOwnerUid,
      mitra_id: targetOwnerUid,
      title: kostData.title,
      description: kostData.description,
      price: Number(kostData.price || 0),
      facilities: kostData.facilities,
      address: kostData.address,
      city: kostData.city,
      area: kostData.area,
      metadata: {
        ...(existing.metadata || {}),
        ...(kostData.metadata || {}),
        ...(kostData.province !== undefined ? { province: kostData.province } : {}),
        photo_categories: derivedPhotoCategories,
        categorized_photos: derivedCategorizedPhotos
      },
      type: kostData.type,
      property_type: kostData.type, // Sync added column
      status: kostData.status,
      is_verified: kostData.isVerified,
      is_managed: kostData.isManaged,
      rating: Number(kostData.rating || 0),
      location: kostData.location,
      image_urls: allImages,
      photo_categories: derivedPhotoCategories,
      categorized_photos: derivedCategorizedPhotos,
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
      additional_fee_starts_from: kostData.additionalFeeStartsFrom,
      omnichannel_contact_name: kostData.omnichannelContactName,
      omnichannel_contact_phone: kostData.omnichannelContactPhone,
      omnichannel_contact_type: kostData.omnichannelContactType,
      updated_at: getCurrentDate().toISOString(),
    })
    .eq('id', propertyId);

  if (updateError) {
    console.error("Supabase Update Error:", updateError);
    throw new Error(updateError.message);
  }
  await syncPropertyRooms(propertyId);
}

export async function updatePropertyStatus(
  propertyId: string, 
  newStatus: 'draft' | 'published' | 'suspended' | string,
  reason?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Tidak ada admin yang login.');

  const { data: existing, error: fetchError } = await supabase
    .from('properties')
    .select('owner_uid, metadata')
    .eq('id', propertyId)
    .single();

  if (fetchError || !existing) throw new Error('Properti tidak ditemukan.');

  const isOwner = existing.owner_uid === user.id;
  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isOwner && !isAdmin) throw new Error('Anda tidak memiliki izin.');

  const currentMeta = typeof existing.metadata === 'string' ? JSON.parse(existing.metadata) : (existing.metadata || {});
  const updatedMeta = {
    ...currentMeta,
    ...(reason !== undefined ? { suspend_reason: reason } : {})
  };

  const { error } = await supabase
    .from('properties')
    .update({ 
      status: newStatus, 
      metadata: updatedMeta,
      updated_at: getCurrentDate().toISOString() 
    })
    .eq('id', propertyId);

  if (error) throw error;
}

export async function freezeProperty(propertyId: string, reason: string): Promise<void> {
  return updatePropertyStatus(propertyId, 'suspended', reason);
}

export async function unfreezeProperty(propertyId: string): Promise<void> {
  return updatePropertyStatus(propertyId, 'published', '');
}

export async function togglePropertyVerification(propertyId: string, isVerified: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Tidak ada admin yang login.');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Hanya admin yang dapat mengubah status verifikasi.');

  const { error } = await supabase
    .from('properties')
    .update({ 
      is_verified: isVerified, 
      updated_at: getCurrentDate().toISOString() 
    })
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
  const role = await getUserRole(authUser.id);
  const isOwner = role === 'owner' || role === 'mitra';

  if (!isAdmin && !isOwner) throw new Error('Access Denied');

  // 1. Total User Count (Global)
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // 2. Total Databases
  const { count: totalDatabases } = await supabase
    .from('available_databases')
    .select('*', { count: 'exact', head: true });

  // 3. Properties (Active Listings & Mitra)
  let propQuery = supabase.from('properties').select('id, owner_uid');
  if (ownerUid) {
    propQuery = propQuery.eq('owner_uid', ownerUid);
  }
  const { data: properties } = await propQuery;
  
  const ownerPropertyIds = properties?.map(p => p.id) || [];
  const totalMitra = new Set(properties?.map(p => p.owner_uid)).size;
  const totalActiveKosts = properties?.length || 0;

  // 4. Transactions with Date Filtering
  let query = supabase
    .from('transactions')
    .select('product_type, amount, status, created_at, product_id, user_id')
    .or('status.eq.paid,status.eq.Selesai');

  if (dateFilter && dateFilter !== 'all') {
    const now = getCurrentDate();
    if (dateFilter === 'hari_ini') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query = query.gte('created_at', start.toISOString());
    } else if (dateFilter === 'minggu_ini') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
      const start = new Date(now.getFullYear(), now.getMonth(), diff);
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

  let transactions = rawTransactions || [];
  if (ownerUid) {
    transactions = transactions.filter(t => ownerPropertyIds.includes(t.product_id));
  }

  const result: AnalyticsSummary = {
    totalUsers: ownerUid ? new Set(transactions.map(t => (t as any).user_id)).size : (totalUsers || 0),
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
    if (t.product_type === 'rent' || t.product_type === 'kost_booking' || t.product_type === 'perpanjangan_sewa') {
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
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized.');

        const response = await fetch('https://us-central1-ruangsinggahid-3afb2.cloudfunctions.net/manualCreateSurveyFolder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ surveyId, adminUserId: user.id })
        });

        const result = await response.json();
        if (response.ok && result.driveLink) return result.driveLink;
    } catch (e) {
        console.warn("Failed to generate Google Drive folder, using local mock fallback:", e);
    }
    return `https://drive.google.com/drive/folders/mock-${surveyId.slice(0, 8)}`;
}

/**
 * repairSurveyRequestStatuses: Memulihkan status dan konsolidasi data evaluation_summary survei terdahulu di Supabase.
 */
export async function repairSurveyRequestStatuses() {
  try {
    const { data: requests } = await supabase
      .from('survey_requests')
      .select(`
        id, transaction_id, status, result_drive_link, evaluation_summary, agent_name, agent_phone, assigned_agent_id, survey_date, created_at, owner_phone,
        transaction:transaction_id ( metadata )
      `);

    if (!requests || requests.length === 0) return;

    const grouped = new Map<string, any[]>();
    for (const r of requests) {
      if (!r.transaction_id) continue;
      const list = grouped.get(r.transaction_id) || [];
      list.push(r);
      grouped.set(r.transaction_id, list);
    }

    const todayStr = getCurrentDate().toISOString().split('T')[0];

    for (const [, list] of grouped.entries()) {
      let bestSummary: any = null;
      let bestDrive: string | null = null;
      let bestAgentId: string | null = null;
      let bestAgentName: string | null = null;
      let bestAgentPhone: string | null = null;
      let isProcessed = false;

      for (const r of list) {
        let summaryObj = r.evaluation_summary;
        if (typeof summaryObj === 'string') {
          try { summaryObj = JSON.parse(summaryObj); } catch (e) { summaryObj = null; }
        }

        // Cek fallback di transaction metadata
        if ((!summaryObj || Object.keys(summaryObj).length === 0) && r.transaction?.metadata) {
          const meta = r.transaction.metadata;
          summaryObj = meta.evaluation_summary || meta.surveyForm || meta.surveyResult || null;
        }

        if (summaryObj && typeof summaryObj === 'object' && Object.keys(summaryObj).length > 0) {
          if (!bestSummary || Object.keys(summaryObj).length > Object.keys(bestSummary).length) {
            bestSummary = summaryObj;
          }
        }

        if (r.result_drive_link && r.result_drive_link.trim() !== '') {
          bestDrive = r.result_drive_link;
        }
        if (r.assigned_agent_id) {
          bestAgentId = r.assigned_agent_id;
        }
        if (r.agent_name && r.agent_name.trim() !== '') {
          bestAgentName = r.agent_name;
        }
        if (r.agent_phone && r.agent_phone.trim() !== '') {
          bestAgentPhone = r.agent_phone;
        }

        if (['COMPLETED', 'SUBMITTED', 'SURVEYING', 'AGENT_ASSIGNED', 'ACTIVE'].includes(r.status)) {
          isProcessed = true;
        }
      }

      const hasEvidence = bestSummary || bestDrive || bestAgentId || bestAgentName || isProcessed;

      // Pilih 1 primary row untuk dipertahankan (utamakan row yang memiliki evaluation_summary atau agent)
      const primaryRow = list.find(r => 
        (r.evaluation_summary && typeof r.evaluation_summary === 'object' && Object.keys(r.evaluation_summary).length > 0) || r.assigned_agent_id
      ) || list[0];

      if (hasEvidence) {
        const sDate = primaryRow.survey_date ? String(primaryRow.survey_date).split('T')[0] : '';
        const cDate = primaryRow.created_at ? String(primaryRow.created_at).split('T')[0] : '';
        const isPastDate = (sDate && sDate < todayStr) || (cDate && cDate < todayStr);

        const targetStatus = (isPastDate || bestSummary || bestDrive || isProcessed) ? 'COMPLETED' : 'PENDING_ASSIGNMENT';

        const updatePayload: any = {
          status: targetStatus,
          updated_at: new Date().toISOString()
        };

        if (bestSummary) updatePayload.evaluation_summary = bestSummary;
        if (bestDrive) updatePayload.result_drive_link = bestDrive;
        if (bestAgentId) updatePayload.assigned_agent_id = bestAgentId;
        if (bestAgentName) updatePayload.agent_name = bestAgentName;
        if (bestAgentPhone) updatePayload.agent_phone = bestAgentPhone;

        await supabase.from('survey_requests').update(updatePayload).eq('id', primaryRow.id);

        // Hapus row duplikat lainnya untuk transaction_id ini
        for (const r of list) {
          if (r.id !== primaryRow.id) {
            await supabase.from('survey_requests').delete().eq('id', r.id);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error repairing survey request statuses:", err);
  }
}

export async function getAdminSurveyRequests(): Promise<SurveyRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const role = await getUserRole(user.id);
  const isAdmin = role === 'admin';
  const isAgent = role === 'survey_agent';

  // Jalankan pemulihan status survei ter-reset di Supabase
  await repairSurveyRequestStatuses();

  // Auto-sync missing requests in background (Hanya untuk Admin agar tidak mereset status/membuat duplikat untuk agen)
  if (isAdmin) {
    autoSyncAllSurveys().catch(console.error);
  }

  // 1. Fetch survei biasa dari survey_requests
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
        id,
        amount,
        status,
        metadata,
        created_at,
        payment_method
      )
    `);
    if (isAgent) {
    query = query.or(`assigned_agent_id.eq.${user.id},assigned_agent_id.is.null,status.eq.PENDING_ASSIGNMENT`);
  } else if (!isAdmin) {
    // Regular user: only see their own requests
    query = query.eq('user_id', user.id);
  }

  // Fetch active managed properties & active KostManager requests to auto-complete surveys that are already published
  const [propsRes, kmActiveReqsRes] = await Promise.all([
    supabase
      .from('properties')
      .select('id, title, is_managed, status')
      .or('is_managed.eq.true,status.eq.published'),
    supabase
      .from('kostmanager_requests')
      .select('id, kost_name, property_id, status, transaction_id')
      .in('status', ['ACTIVE', 'APPROVED', 'COMPLETED'])
  ]);

  const managedPropTitles = new Set(
    (propsRes.data || [])
      .filter(p => p.is_managed || p.status === 'published' || p.status === 'active')
      .map(p => (p.title || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const managedPropIds = new Set(
    (propsRes.data || [])
      .filter(p => p.is_managed || p.status === 'published' || p.status === 'active')
      .map(p => p.id)
      .filter(Boolean)
  );

  const activeKmTxIds = new Set(
    (kmActiveReqsRes.data || [])
      .map(r => r.transaction_id)
      .filter(Boolean)
  );

  const activeKmPropIds = new Set(
    (kmActiveReqsRes.data || [])
      .map(r => r.property_id)
      .filter(Boolean)
  );

  const activeKmTitles = new Set(
    (kmActiveReqsRes.data || [])
      .map(r => (r.kost_name || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const { data: surveys, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  const mappedSurveys = (surveys || []).map((s: any) => {
    const isKostManager = s.notes?.includes('KostManager Onboarding') || false;
    let summary = s.evaluation_summary;
    if (typeof summary === 'string') {
      try { summary = JSON.parse(summary); } catch (e) { summary = null; }
    }
    if ((!summary || Object.keys(summary).length === 0) && s.transaction?.metadata) {
      summary = s.transaction.metadata.evaluation_summary || s.transaction.metadata.surveyForm || s.transaction.metadata.surveyResult || summary;
    }

    const sTitle = (s.kost_name || '').trim().toLowerCase();
    const isAlreadyManagedAndActive = 
      (s.kost_id && (managedPropIds.has(s.kost_id) || activeKmPropIds.has(s.kost_id))) ||
      (sTitle && (managedPropTitles.has(sTitle) || activeKmTitles.has(sTitle))) ||
      (s.transaction_id && activeKmTxIds.has(s.transaction_id));

    let finalStatus = s.status;
    if (isAlreadyManagedAndActive && ['SUBMITTED', 'ACTIVE', 'APPROVED'].includes(s.status)) {
      finalStatus = 'COMPLETED';
    }

    return {
      ...s,
      status: finalStatus,
      evaluation_summary: summary || {},
      task_type: isKostManager ? 'kostmanager' : 'survei_biasa'
    };
  });

  // 2. Fetch survei KostManager dari kostmanager_surveys (gabungkan dengan kostmanager_requests untuk mengambil data kost)
  let mappedKmSurveys: any[] = [];
  if (isAdmin || isAgent) {
    let kmQuery = supabase
      .from('kostmanager_surveys')
      .select(`
        *,
        request:kostmanager_request_id (
          id,
          status,
          property_id,
          kost_name,
          kost_type,
          kost_address,
          empty_rooms,
          notes,
          survey_date,
          user:user_id (
            name,
            email,
            phone,
            photo_url
          ),
          transaction:transaction_id (
            id,
            amount,
            status,
            metadata,
            created_at,
            payment_method
          )
        )
      `);

    if (isAgent) {
      kmQuery = kmQuery.or(`assigned_agent_id.eq.${user.id},assigned_agent_id.is.null,status.eq.PENDING_ASSIGNMENT`);
    }

    const { data: kmSurveys, error: kmErr } = await kmQuery.order('created_at', { ascending: false });
    if (!kmErr && kmSurveys) {
      mappedKmSurveys = kmSurveys.map((ks: any) => {
        const kmTitle = (ks.request?.kost_name || '').trim().toLowerCase();
        const isKmManagedAndActive =
          ks.request?.status === 'ACTIVE' ||
          ks.status === 'COMPLETED' ||
          ks.status === 'APPROVED' ||
          (ks.request?.property_id && managedPropIds.has(ks.request?.property_id)) ||
          (kmTitle && managedPropTitles.has(kmTitle));

        let computedStatus = ks.status;
        if (isKmManagedAndActive) {
          computedStatus = 'COMPLETED';
        } else if (ks.status === 'REVISION_REQUIRED' || ks.request?.status === 'REVISION_REQUIRED') {
          computedStatus = 'REVISION_REQUIRED';
        } else if (ks.status === 'SUBMITTED' || ks.request?.status === 'PENDING_ONBOARDING') {
          computedStatus = 'SUBMITTED';
        } else if (ks.status === 'SURVEYING' && ks.request?.status === 'AGENT_ASSIGNED') {
          computedStatus = 'PENDING_ASSIGNMENT';
        }

        return {
          id: ks.id,
          task_type: 'kostmanager',
          kostmanager_survey_id: ks.id,
          kostmanager_request_id: ks.kostmanager_request_id,
          assigned_agent_id: ks.assigned_agent_id,
          status: computedStatus,
          result_drive_link: ks.result_drive_link,
          signature_data: ks.signature_data,
          created_at: ks.created_at,
          updated_at: ks.updated_at,
          // Map data dari request agar compatible dengan model SurveyRequest
          kost_id: ks.request?.property_id,
          user_id: ks.request?.user_id,
          transaction_id: ks.request?.transaction_id,
          kost_name: ks.request?.kost_name || 'KostManager Listing',
          kost_address: ks.request?.kost_address || '',
          kost_type: ks.request?.kost_type || '',
          empty_rooms: ks.request?.empty_rooms || 0,
          notes: ks.request?.notes || ks.notes || '',
          survey_date: ks.request?.survey_date,
          user: ks.request?.user,
          transaction: ks.request?.transaction
        };
      });
    }
  }

  // Bersihkan duplikat record PENDING_ASSIGNMENT jika transaksi sudah memiliki record terproses (COMPLETED / SUBMITTED / DLL)
  const processedTxIds = new Set(
    mappedSurveys
      .filter((s: any) => s.transaction_id && ['COMPLETED', 'SUBMITTED', 'REVISION_REQUIRED', 'SURVEYING', 'HEADING_TO_LOCATION', 'AGENT_ASSIGNED', 'RESCHEDULED', 'ACTIVE'].includes(s.status))
      .map((s: any) => s.transaction_id)
  );

  const deduplicatedSurveys = mappedSurveys.filter((s: any) => {
    if (s.transaction_id && ['PENDING_ASSIGNMENT', 'AWAITING_PAYMENT'].includes(s.status) && processedTxIds.has(s.transaction_id)) {
      return false;
    }
    return true;
  });

  // Gabungkan dan urutkan berdasarkan tanggal dibuat desc (hindari duplikasi jika request KostManager sudah ada di kostmanager_surveys)
  const kmTxIds = new Set(mappedKmSurveys.map((ks: any) => ks.transaction_id).filter(Boolean));
  const filteredSurveys = deduplicatedSurveys.filter((s: any) => !s.transaction_id || !kmTxIds.has(s.transaction_id));
  const allSurveys = [...filteredSurveys, ...mappedKmSurveys];
  return allSurveys.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()) as SurveyRequest[];
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

  // --- CHECK IF TARGET IS KOSTMANAGER SURVEY ---
  const { data: existingKmSurvey } = await supabase
    .from('kostmanager_surveys')
    .select('id, kostmanager_request_id')
    .eq('id', id)
    .maybeSingle();

  if (existingKmSurvey) {
    if (updates.assigned_agent_id === null) {
      // Tolak / Deassign
      const { error: delErr } = await supabase
        .from('kostmanager_surveys')
        .delete()
        .eq('id', id);
      if (delErr) throw delErr;

      const { error: reqErr } = await supabase
        .from('kostmanager_requests')
        .update({
          assigned_agent_id: null,
          agent_name: null,
          agent_phone: null,
          status: 'PENDING_ASSIGNMENT',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingKmSurvey.kostmanager_request_id);
      if (reqErr) throw reqErr;
      return;
    }

    const kmSurveyUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.status) {
      if (updates.status === 'AGENT_ASSIGNED' || updates.status === 'SURVEYING') {
        kmSurveyUpdates.status = 'SURVEYING';
      } else if (updates.status === 'SUBMITTED' || updates.status === 'PENDING_ONBOARDING') {
        kmSurveyUpdates.status = 'SUBMITTED';
      } else if (updates.status === 'ACTIVE' || updates.status === 'APPROVED') {
        kmSurveyUpdates.status = 'APPROVED';
      } else {
        kmSurveyUpdates.status = updates.status;
      }
    }
    if (updates.assigned_agent_id !== undefined) kmSurveyUpdates.assigned_agent_id = updates.assigned_agent_id;
    if (updates.result_drive_link !== undefined) kmSurveyUpdates.result_drive_link = updates.result_drive_link;

    const { error: kmSurveyErr } = await supabase
      .from('kostmanager_surveys')
      .update(kmSurveyUpdates)
      .eq('id', id);
    if (kmSurveyErr) throw kmSurveyErr;

    const kmReqUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.status) {
      if (updates.status === 'AGENT_ASSIGNED' || updates.status === 'SURVEYING') {
        kmReqUpdates.status = 'SURVEYING';
      } else if (updates.status === 'SUBMITTED' || updates.status === 'PENDING_ONBOARDING') {
        kmReqUpdates.status = 'PENDING_ONBOARDING';
      } else if (updates.status === 'ACTIVE' || updates.status === 'APPROVED') {
        kmReqUpdates.status = 'ACTIVE';
      } else {
        kmReqUpdates.status = updates.status;
      }
    }
    if (updates.assigned_agent_id !== undefined) kmReqUpdates.assigned_agent_id = updates.assigned_agent_id;
    if (updates.agent_name !== undefined) kmReqUpdates.agent_name = updates.agent_name;
    if (updates.agent_phone !== undefined) kmReqUpdates.agent_phone = updates.agent_phone;
    if (updates.result_drive_link !== undefined) kmReqUpdates.result_drive_link = updates.result_drive_link;

    const { error: kmReqErr } = await supabase
      .from('kostmanager_requests')
      .update(kmReqUpdates)
      .eq('id', existingKmSurvey.kostmanager_request_id);
    if (kmReqErr) throw kmReqErr;
    return;
  }

  // Regular users can update their own (for feedback/rating), agents can update assigned or unassigned tasks
  const { data: existing } = await supabase.from('survey_requests').select('user_id, assigned_agent_id, transaction_id, status').eq('id', id).single();
  
  if (!isAdmin && user.id !== existing?.user_id && user.id !== existing?.assigned_agent_id && existing?.assigned_agent_id !== null && existing?.status !== 'PENDING_ASSIGNMENT') {
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
  
  // Sync back to kostmanager_requests if this survey is linked to a KostManager transaction
  if (existing?.transaction_id) {
    const { data: trx } = await supabase
      .from('transactions')
      .select('product_type')
      .eq('id', existing.transaction_id)
      .maybeSingle();

    if (trx && (trx.product_type === 'kostmanager' || trx.product_type === 'kostmanager_subscription')) {
      const kmUpdates: any = {};
      if (updates.status) {
        if (updates.status === 'COMPLETED') kmUpdates.status = 'ACTIVE';
        else if (updates.status === 'SURVEYING') kmUpdates.status = 'SURVEYING';
        else if (updates.status === 'SUBMITTED') kmUpdates.status = 'PENDING_ONBOARDING';
        else kmUpdates.status = updates.status;
      }
      if (updates.assigned_agent_id !== undefined) kmUpdates.assigned_agent_id = updates.assigned_agent_id;
      if (updates.agent_name !== undefined) kmUpdates.agent_name = updates.agent_name;
      if (updates.agent_phone !== undefined) kmUpdates.agent_phone = updates.agent_phone;
      if (updates.result_drive_link !== undefined) kmUpdates.result_drive_link = updates.result_drive_link;
      if (updates.survey_date !== undefined) kmUpdates.survey_date = updates.survey_date;
      if (updates.survey_time !== undefined) kmUpdates.survey_time = updates.survey_time;
      if (updates.notes !== undefined) kmUpdates.notes = updates.notes;

      if (Object.keys(kmUpdates).length > 0) {
        await supabase
          .from('kostmanager_requests')
          .update({ ...kmUpdates, updated_at: new Date().toISOString() })
          .eq('transaction_id', existing.transaction_id);
      }
    }
  }

  if (updates.status) {
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

// ---- KOSTMANAGER CRUD FUNCTIONS ----

export async function getAdminKostManagerRequests(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const role = await getUserRole(user.id);
  const isAdmin = role === 'admin';
  const isAgent = role === 'survey_agent';

  // Auto-sync missing requests in background
  if (isAdmin) {
    autoSyncAllKostManagers().catch(console.error);
  } else {
    autoSyncAllKostManagers(user.id).catch(console.error);
  }

  let query = supabase
    .from('kostmanager_requests')
    .select(`
      *,
      user:user_id (
        name,
        email,
        phone,
        photo_url
      ),
      transaction:transaction_id (
        id,
        amount,
        status,
        metadata,
        created_at,
        payment_method
      )
    `);

  if (isAgent) {
    query = query.eq('assigned_agent_id', user.id);
  } else if (!isAdmin) {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  
  return data || [];
}

export async function updateKostManagerRequest(
  id: string,
  updates: Partial<any>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const role = await getUserRole(user.id);
  const isAdmin = role === 'admin';

  const { data: existing } = await supabase.from('kostmanager_requests').select('user_id, assigned_agent_id, transaction_id').eq('id', id).single();
  
  if (!isAdmin && user.id !== existing?.user_id && user.id !== existing?.assigned_agent_id) {
     throw new Error('Access Denied');
  }

  const { error } = await supabase
    .from('kostmanager_requests')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;

  // --- SYNC TO Dedicated kostmanager_surveys (Tabel Baru) ---
  if (id) {
    try {
      const { data: existingKmSurvey } = await supabase
        .from('kostmanager_surveys')
        .select('id')
        .eq('kostmanager_request_id', id)
        .maybeSingle();

      const kmSurveyPayload: any = {
        kostmanager_request_id: id,
        updated_at: new Date().toISOString()
      };

      if (updates.assigned_agent_id !== undefined) kmSurveyPayload.assigned_agent_id = updates.assigned_agent_id;
      if (updates.result_drive_link !== undefined) kmSurveyPayload.result_drive_link = updates.result_drive_link;
      
      if (updates.status) {
        if (updates.status === 'ACTIVE') kmSurveyPayload.status = 'APPROVED';
        else if (updates.status === 'SURVEYING') kmSurveyPayload.status = 'SURVEYING';
        else if (updates.status === 'PENDING_ONBOARDING') kmSurveyPayload.status = 'SUBMITTED';
        else if (updates.status === 'PENDING_ASSIGNMENT') kmSurveyPayload.status = 'SURVEYING';
        else if (updates.status === 'AGENT_ASSIGNED') kmSurveyPayload.status = 'SURVEYING';
      }

      if (existingKmSurvey) {
        await supabase
          .from('kostmanager_surveys')
          .update(kmSurveyPayload)
          .eq('id', existingKmSurvey.id);
      } else if (updates.assigned_agent_id) {
        // Buat baru jika ada agen yang baru ditugaskan — mulai dari SURVEYING
        // agar lolos check constraint, dan dinamis dimap ke PENDING_ASSIGNMENT di frontend/service
        kmSurveyPayload.status = 'SURVEYING';
        kmSurveyPayload.assigned_agent_id = updates.assigned_agent_id;
        await supabase
          .from('kostmanager_surveys')
          .insert([kmSurveyPayload]);
      }
    } catch (syncKmErr) {
      console.error("Error syncing to kostmanager_surveys:", syncKmErr);
    }
  }

  // --- BACKWARDS COMPATIBILITY SYNC TO survey_requests ---
  if (existing?.transaction_id) {
    const surveyId = generateDeterministicUuid(existing.transaction_id, 999);
    const { data: existingSurvey } = await supabase
      .from('survey_requests')
      .select('id')
      .eq('id', surveyId)
      .maybeSingle();

    if (existingSurvey) {
      const surveyUpdates: any = {};
      if (updates.status) {
        if (updates.status === 'ACTIVE') surveyUpdates.status = 'COMPLETED';
        else if (updates.status === 'PENDING_ONBOARDING') surveyUpdates.status = 'SURVEYING';
        else if (updates.status === 'PENDING_ASSIGNMENT') surveyUpdates.status = 'PENDING_ASSIGNMENT';
        else surveyUpdates.status = updates.status;
      }
      if (updates.assigned_agent_id !== undefined) surveyUpdates.assigned_agent_id = updates.assigned_agent_id;
      if (updates.agent_name !== undefined) surveyUpdates.agent_name = updates.agent_name;
      if (updates.agent_phone !== undefined) surveyUpdates.agent_phone = updates.agent_phone;
      if (updates.result_drive_link !== undefined) surveyUpdates.result_drive_link = updates.result_drive_link;
      if (updates.survey_date !== undefined) surveyUpdates.survey_date = updates.survey_date;
      if (updates.survey_time !== undefined) surveyUpdates.survey_time = updates.survey_time;
      if (updates.notes !== undefined) surveyUpdates.notes = updates.notes;

      if (Object.keys(surveyUpdates).length > 0) {
        await supabase
          .from('survey_requests')
          .update({ ...surveyUpdates, updated_at: new Date().toISOString() })
          .eq('id', surveyId);
      }
    }
  }

  if (updates.status) {
    notifyAdminStatusUpdate("KostManager Request", id, updates.status);
  }
}

export async function deleteKostManagerRequest(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const role = await getUserRole(user.id);
  const isAdmin = role === 'admin';

  if (!isAdmin) throw new Error('Access Denied');

  // 1. Ambil transaction_id dari kostmanager_requests sebelum dihapus
  //    agar kita bisa mencari survey_requests yang terhubung
  const { data: kmReq, error: fetchErr } = await supabase
    .from('kostmanager_requests')
    .select('transaction_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw fetchErr;

  // 2. Hapus survey_requests yang memiliki transaction_id yang sama
  //    (ini yang muncul sebagai kartu di dashboard agen)
  if (kmReq?.transaction_id) {
    const { error: surveyDeleteErr } = await supabase
      .from('survey_requests')
      .delete()
      .eq('transaction_id', kmReq.transaction_id);

    if (surveyDeleteErr) {
      console.warn('Warning: gagal hapus survey_requests terkait:', surveyDeleteErr.message);
      // Lanjutkan tetap hapus kostmanager_requests meskipun survey_requests gagal
    }
  }

  // 3. Hapus kostmanager_requests itu sendiri
  const { error } = await supabase
    .from('kostmanager_requests')
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
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone, photo_url, role, verification_status');

  if (error) throw error;
  
  // Filter in memory for maximum reliability
  return (data || []).filter((u: any) => 
    ['survey_agent', 'agen', 'agent'].includes(u.role?.toLowerCase())
  ).map((u: any) => ({
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

export async function updateAgentVerificationStatus(agentId: string, status: 'verified' | 'unverified' | 'rejected' | 'banned', reason?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  let finalStatus: 'verified' | 'unverified' | 'rejected' | 'banned' = status;

  if (status === 'rejected') {
    const { data: usr } = await supabase.from('users').select('rejection_count').eq('id', agentId).single();
    const currentCount = usr?.rejection_count || 0;
    const newCount = currentCount + 1;

    if (newCount >= 3) {
      finalStatus = 'banned';
      const banReason = reason || "Telah mencapai batas maksimal 3 kali penolakan verifikasi identitas.";
      reason = banReason;

      await supabase.from('users').update({
        role: 'user',
        verification_status: 'banned',
        verification_notes: banReason,
        rejection_count: newCount,
        updated_at: new Date().toISOString()
      }).eq('id', agentId);

      await supabase.from('user_verifications').upsert({
        user_id: agentId,
        verification_status: 'banned',
        verification_notes: banReason,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } else {
      await supabase.from('users').update({
        verification_status: 'rejected',
        verification_notes: reason || null,
        rejection_count: newCount,
        updated_at: new Date().toISOString()
      }).eq('id', agentId);

      await supabase.from('user_verifications').upsert({
        user_id: agentId,
        verification_status: 'rejected',
        verification_notes: reason || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    }
  } else if (status === 'verified') {
    await supabase.from('users').update({
      verification_status: 'verified',
      role: 'survey_agent',
      rejection_count: 0,
      verification_notes: null,
      updated_at: new Date().toISOString()
    }).eq('id', agentId);

    await supabase.from('user_verifications').update({
      verification_status: 'verified',
      updated_at: new Date().toISOString()
    }).eq('user_id', agentId);
  } else if (status === 'banned') {
    await supabase.from('users').update({
      role: 'user',
      verification_status: 'banned',
      verification_notes: reason || null,
      updated_at: new Date().toISOString()
    }).eq('id', agentId);

    await supabase.from('user_verifications').upsert({
      user_id: agentId,
      verification_status: 'banned',
      verification_notes: reason || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  }

  // Send status email if possible
  const { data: usr } = await supabase.from('users').select('email, name, full_name').eq('id', agentId).single();
  if (usr && usr.email) {
    fetch('https://us-central1-ruangsinggahid-3afb2.cloudfunctions.net/sendMitraStatusEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usr.email,
        name: usr.full_name || usr.name,
        status: finalStatus,
        reason,
        type: 'verification'
      })
    }).catch(err => {
      console.warn('Error sending status email notification:', err);
    });
  }
}

export async function getBannedAgents(): Promise<any[]> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(authUser.id);
  if (!isAdmin) throw new Error('Access Denied');

  // Find users who have an entry in the agents table
  const { data: agentsData } = await supabase.from('agents').select('user_id');
  const agentUserIds = agentsData?.map(a => a.user_id) || [];

  if (agentUserIds.length === 0) return [];

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('verification_status', 'banned')
    .in('id', agentUserIds)
    .order('updated_at', { ascending: false });

  if (userError) throw userError;
  if (!users) return [];

  const userIds = users.map(u => u.id);
  let verificationsMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: verDetails } = await supabase
      .from('user_verifications')
      .select('*')
      .in('user_id', userIds);
    
    if (verDetails) {
      verDetails.forEach(v => {
        verificationsMap[v.user_id] = v;
      });
    }
  }

  return users.map(u => {
    const verInfo = verificationsMap[u.id] || {};
    return {
      ...u,
      name: u.name || u.full_name || 'No Name',
      ktp_photo: verInfo.ktp_photo_url || u.ktp_photo_url,
      ktp_number: verInfo.ktp_number || u.ktp_number,
      address: verInfo.ktp_address || u.ktp_address,
      domicile_address: u.address || '-',
      birth_place: u.birth_place || '-',
      birth_date: u.birth_date || '-',
      whatsapp_verified: u.whatsapp_verified || false,
      email_verified: true,
      type: 'verification'
    };
  });
}

export async function banAgentRequest(agentId: string, reason: string): Promise<void> {
  await updateAgentVerificationStatus(agentId, 'banned', reason);
}

export async function unbanAgentRequest(userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  await supabase.from('users').update({
    role: 'survey_agent',
    verification_status: 'unverified',
    rejection_count: 0,
    verification_notes: null,
    updated_at: new Date().toISOString()
  }).eq('id', userId);

  await supabase.from('user_verifications').update({
    verification_status: 'unverified',
    verification_notes: null,
    updated_at: new Date().toISOString()
  }).eq('user_id', userId);

  const { data: usr } = await supabase.from('users').select('email, name, full_name').eq('id', userId).single();
  if (usr && usr.email) {
    fetch('https://us-central1-ruangsinggahid-3afb2.cloudfunctions.net/sendMitraStatusEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usr.email,
        name: usr.full_name || usr.name,
        status: 'unbanned',
        reason: 'Akun agen Anda telah diaktifkan kembali oleh admin. Anda sekarang dapat mengajukan verifikasi ulang.',
        type: 'verification'
      })
    }).catch(err => {
      console.warn('Error sending status email notification:', err);
    });
  }
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

  // Fetch all user_verifications and referral codes for these users
  const userIds = (verRequests || []).map(u => u.id);
  let verificationsMap: Record<string, any> = {};
  let referralsMap: Record<string, string> = {};
  let agentsMap: Record<string, string> = {};

  if (userIds.length > 0) {
    // A. Fetch verifications
    const { data: verDetails, error: detailsError } = await supabase
      .from('user_verifications')
      .select('*')
      .in('user_id', userIds);
    
    if (!detailsError && verDetails) {
      verDetails.forEach(v => {
        verificationsMap[v.user_id] = v;
      });
    }

    // B. Fetch mitra table (to find referred_by)
    const { data: mitraData } = await supabase
      .from('mitra')
      .select('user_id, referred_by')
      .in('user_id', userIds);
    
    if (mitraData) {
      mitraData.forEach(m => {
        if (m.referred_by) {
          referralsMap[m.user_id] = m.referred_by;
        }
      });
    }

    // C. Find Agent names who invited them
    const referralCodes = Object.values(referralsMap).filter(Boolean);
    if (referralCodes.length > 0) {
      const { data: agentsData } = await supabase
        .from('agents')
        .select(`
          referral_code,
          user:user_id (
            name
          )
        `)
        .in('referral_code', referralCodes);
      
      if (agentsData) {
        agentsData.forEach((a: any) => {
          agentsMap[a.referral_code] = a.user?.name || 'Agen RS';
        });
      }
    }
  }

  // 3. Map verifications to match registration request format for UI compatibility
  const mappedVerifications = (verRequests || []).map(u => {
    const verInfo = verificationsMap[u.id] || {};
    const refCode = referralsMap[u.id] || null;
    return {
      id: u.id,
      user_id: u.id,
      name: u.full_name || u.name,
      phone: u.phone,
      email: u.email,
      timestamp: u.updated_at || u.created_at,
      status: 'pending',
      type: 'verification', // Special flag for UI
      ktp_photo: verInfo.ktp_photo_url || u.ktp_photo_url,
      ktp_number: verInfo.ktp_number || u.ktp_number,
      address: verInfo.ktp_address || u.ktp_address,
      domicile_address: u.address || '-',
      birth_place: u.birth_place || '-',
      birth_date: u.birth_date || '-',
      whatsapp_verified: u.whatsapp_verified || false,
      email_verified: true, // Since they are registered in public.users, their email is verified
      referred_by_code: refCode,
      referred_by_agent_name: refCode ? (agentsMap[refCode] || 'Agen RS') : null,
      gender: u.gender || '-',
      religion: u.religion || '-',
      occupation: u.occupation || '-',
      relationship_status: u.relationship_status || '-'
    };
  });

  const mappedRegistrations = (regRequests || []).map(r => ({
    ...r,
    type: 'registration', // Regular flag
    whatsapp_verified: false, // Default for non-integrated offline form
    email_verified: false
  }));

  return [...mappedVerifications, ...mappedRegistrations];
}


export async function updateMitraRequestStatus(
  requestId: string, 
  status: 'accepted' | 'rejected' | 'pending' | 'banned', 
  userId?: string,
  type: 'registration' | 'verification' = 'registration',
  reason?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  let targetEmail = '';
  let targetName = '';
  let matchedUserId = '';

  // 1. Fetch basic info
  if (type === 'registration') {
    const { data: regReq } = await supabase.from('mitra_requests').select('*').eq('id', requestId).single();
    if (regReq) {
      targetEmail = regReq.email;
      targetName = regReq.name;
      // Try to find user by email
      const { data: usr } = await supabase.from('users').select('id').eq('email', regReq.email).maybeSingle();
      if (usr) {
        matchedUserId = usr.id;
      }
    }
  } else {
    matchedUserId = requestId; // For verification, requestId is the user ID
    const { data: usr } = await supabase.from('users').select('email, name, full_name').eq('id', matchedUserId).single();
    if (usr) {
      targetEmail = usr.email;
      targetName = usr.full_name || usr.name;
    }
  }

  let finalStatus: 'accepted' | 'rejected' | 'pending' | 'banned' = status;

  // 2. Handle Rejection Limit if status is rejected
  if (status === 'rejected' && matchedUserId) {
    const { data: usr } = await supabase.from('users').select('rejection_count').eq('id', matchedUserId).single();
    const currentCount = usr?.rejection_count || 0;
    const newCount = currentCount + 1;

    if (newCount >= 3) {
      // Automatic Banned
      finalStatus = 'banned';
      const banReason = reason || "Telah mencapai batas maksimal 3 kali penolakan verifikasi identitas.";
      reason = banReason;

      await supabase.from('users').update({
        role: 'user',
        verification_status: 'banned',
        verification_notes: banReason,
        rejection_count: newCount,
        updated_at: new Date().toISOString()
      }).eq('id', matchedUserId);

      await supabase.from('user_verifications').upsert({
        user_id: matchedUserId,
        verification_status: 'banned',
        verification_notes: banReason,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } else {
      // Just increment and set rejected status
      await supabase.from('users').update({
        verification_status: 'rejected',
        verification_notes: reason,
        rejection_count: newCount,
        updated_at: new Date().toISOString()
      }).eq('id', matchedUserId);

      await supabase.from('user_verifications').upsert({
        user_id: matchedUserId,
        verification_status: 'rejected',
        verification_notes: reason,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    }
  } else if (status === 'accepted' && matchedUserId) {
    // Reset rejection count on success
    await supabase.from('users').update({
      rejection_count: 0,
      updated_at: new Date().toISOString()
    }).eq('id', matchedUserId);
  }

  // 3. Process primary request records
  if (type === 'registration') {
    const requestStatusUpdate = finalStatus === 'banned' ? 'rejected' : finalStatus;
    const { error: requestError } = await supabase
      .from('mitra_requests')
      .update({ 
        status: requestStatusUpdate, 
        message: reason || null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', requestId);

    if (requestError) throw requestError;

    if (finalStatus === 'accepted' && (userId || requestId)) {
      const targetId = userId || requestId;
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          role: 'owner', 
          verification_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetId);

      if (userError) {
        console.warn('Failed to update user role, but request was accepted:', userError);
      }
    }
  } else {
    // Identity Verification Flow
    const verifStatus = finalStatus === 'accepted' ? 'verified' : (finalStatus === 'rejected' ? 'rejected' : (finalStatus === 'banned' ? 'banned' : 'pending'));
    
    if (finalStatus === 'accepted') {
      await supabase.from('users').update({
        verification_status: 'verified',
        role: 'owner',
        updated_at: new Date().toISOString()
      }).eq('id', requestId);

      await supabase.from('user_verifications').update({
        verification_status: 'verified',
        updated_at: new Date().toISOString()
      }).eq('user_id', requestId);
    }
  }

  // 4. Trigger sendMitraStatusEmail Cloud Function
  if (targetEmail) {
    fetch('https://us-central1-ruangsinggahid-3afb2.cloudfunctions.net/sendMitraStatusEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        name: targetName,
        status: finalStatus,
        reason,
        type
      })
    }).then(res => {
      if (!res.ok) {
        console.warn('Failed to send status email notification via Cloud Function');
      }
    }).catch(err => {
      console.warn('Error sending status email notification:', err);
    });
  }
}

export async function banMitraRequest(
  requestId: string,
  type: 'registration' | 'verification' = 'registration',
  reason: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  let targetEmail = '';
  let targetName = '';
  let matchedUserId = '';

  if (type === 'registration') {
    const { data: regReq } = await supabase.from('mitra_requests').select('*').eq('id', requestId).single();
    if (regReq) {
      targetEmail = regReq.email;
      targetName = regReq.name;
      // Try to find user by email
      const { data: usr } = await supabase.from('users').select('id').eq('email', regReq.email).maybeSingle();
      if (usr) {
        matchedUserId = usr.id;
      }

      await supabase.from('mitra_requests').update({
        status: 'rejected',
        message: `BLOKIR PERMANEN: ${reason}`,
        updated_at: new Date().toISOString()
      }).eq('id', requestId);
    }
  } else {
    matchedUserId = requestId;
    const { data: usr } = await supabase.from('users').select('email, name, full_name').eq('id', matchedUserId).single();
    if (usr) {
      targetEmail = usr.email;
      targetName = usr.full_name || usr.name;
    }
  }

  if (matchedUserId) {
    await supabase.from('users').update({
      role: 'user',
      verification_status: 'banned',
      verification_notes: reason,
      updated_at: new Date().toISOString()
    }).eq('id', matchedUserId);

    await supabase.from('user_verifications').upsert({
      user_id: matchedUserId,
      verification_status: 'banned',
      verification_notes: reason,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  }

  if (targetEmail) {
    fetch('https://us-central1-ruangsinggahid-3afb2.cloudfunctions.net/sendMitraStatusEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        name: targetName,
        status: 'banned',
        reason,
        type
      })
    }).then(res => {
      if (!res.ok) {
        console.warn('Failed to send status email notification via Cloud Function');
      }
    }).catch(err => {
      console.warn('Error sending status email notification:', err);
    });
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
      rentTransactions.forEach((t: any) => {
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
                    const diff = end.getTime() - getCurrentDate().getTime();
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

    const [userRes, verifRes, bankRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('user_verifications').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_bank_accounts').select('*').eq('user_id', userId).maybeSingle()
    ]);

    if (userRes.error) throw userRes.error;

    const userData = {
        ...userRes.data,
        ...(verifRes.data || {}),
        ...(bankRes.data || {})
    };

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

/**
 * parseDateSafely: Robust date parser for various Indonesian and ISO formats
 */
function parseDateSafely(dateStr: any): Date | null {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    
    // Try native parser first
    const nativeDate = new Date(dateStr);
    if (!isNaN(nativeDate.getTime())) return nativeDate;

    // Handle Indonesian format like "28 Mei 2026"
    try {
        const months: { [key: string]: string } = {
            'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04', 'Mei': '05', 'Juni': '06',
            'Juli': '07', 'Agustus': '08', 'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
        };
        
        let cleaned = String(dateStr).trim();
        for (const [indo, numeric] of Object.entries(months)) {
            if (cleaned.includes(indo)) {
                cleaned = cleaned.replace(indo, numeric);
                break;
            }
        }

        // Try to parse "28 05 2026" or "28/05/2026"
        const parts = String(dateStr).trim().split(/[\s/-]+/);
        if (parts.length === 3) {
            // Assume Day Month Year
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            const iso = `${year}-${month}-${day}`;
            const d = new Date(iso);
            if (!isNaN(d.getTime())) return d;
        }
    } catch (e) {
        console.warn("parseDateSafely: Failed to parse", dateStr, e);
    }

    return null;
}

/**
 * createManualExtension: Creates a new transaction record for a manual extension
 * and syncs it with the resident_status table.
 */
export async function createManualExtension(payload: {
    userId: string;
    kostId: string;
    amount: number;
    durationMonths: number;
    paymentMethod?: string;
    metadata?: any;
}) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        // 1. Get Property Info for metadata
        const { data: property } = await supabase
            .from('properties')
            .select('namaKost, price')
            .eq('id', payload.kostId)
            .single();

        // 2. Insert into transactions
        const { data: trx, error: trxError } = await supabase
            .from('transactions')
            .insert([{
                user_id: payload.userId,
                kost_id: payload.kostId,
                product_id: payload.kostId,
                product_type: 'perpanjangan_sewa',
                type: 'perpanjangan_sewa',
                amount: payload.amount,
                status: 'PAID',
                payment_method: payload.paymentMethod || 'Manual/Cash',
                metadata: {
                    ...(payload.metadata || {}),
                    kostName: property?.namaKost || 'Kost',
                    extensionPeriod: payload.durationMonths,
                    isManualEntry: true,
                    processedBy: user.id,
                    processedAt: new Date().toISOString()
                },
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (trxError) throw trxError;

        // 3. Sync with resident_status
        await syncResidentStatus(trx.id);
        
        triggerCrossTabRefresh();
        return trx;
    } catch (err) {
        console.error("CREATE_MANUAL_EXTENSION_ERROR:", err);
        throw err;
    }
}

// ---- APP SETTINGS (SURVEY CATALOG) ----

export interface SurveyCatalogSettings {
  price: number;
  discount_price: number;
  description: string;
  price_per_kost: number;
  agent_commission_flat?: number;
}

/**
 * Ambil pengaturan katalog jasa survey dari tabel app_settings.
 * Bisa dipanggil tanpa login (public read).
 */
export async function getSurveyCatalogSettings(): Promise<SurveyCatalogSettings> {
  const DEFAULT: SurveyCatalogSettings = {
    price: 70000,
    discount_price: 50000,
    description: 'Dapatkan bantuan profesional untuk mengecek kondisi kost impian Anda secara langsung via Video Call. Hemat waktu, tenaga, dan hindari penipuan ZONK!',
    price_per_kost: 35000,
    agent_commission_flat: 35000,
  };

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'survey_catalog')
      .single();

    if (error || !data) {
      console.warn('getSurveyCatalogSettings: fallback ke default.', error?.message);
      return DEFAULT;
    }

    return {
      price: Number(data.value?.price ?? DEFAULT.price),
      discount_price: Number(data.value?.discount_price ?? DEFAULT.discount_price),
      description: String(data.value?.description ?? DEFAULT.description),
      price_per_kost: Number(data.value?.price_per_kost ?? DEFAULT.price_per_kost),
      agent_commission_flat: Number(data.value?.agent_commission_flat ?? DEFAULT.agent_commission_flat ?? 35000),
    };
  } catch (err) {
    console.error('getSurveyCatalogSettings error:', err);
    return DEFAULT;
  }
}

export interface SurveyCatalogLogEntry {
  timestamp: string;
  admin_email: string;
  price: number;
  discount_price: number;
  price_per_kost: number;
  agent_commission_flat: number;
}

export async function getSurveyCatalogLogs(): Promise<SurveyCatalogLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'survey_catalog_logs')
      .single();

    if (error || !data) return [];
    return Array.isArray(data.value?.logs) ? data.value.logs : [];
  } catch (err) {
    console.error('getSurveyCatalogLogs error:', err);
    return [];
  }
}

/**
 * Simpan pengaturan katalog jasa survey ke tabel app_settings.
 * Hanya bisa dipanggil oleh user yang sudah login (admin).
 */
export async function saveSurveyCatalogSettings(settings: SurveyCatalogSettings): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: harus login sebagai admin.');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Hanya admin yang dapat mengubah pengaturan katalog.');

  const adminEmail = user.email || 'Admin';

  const { error } = await supabase
    .from('app_settings')
    .upsert(
      {
        key: 'survey_catalog',
        value: {
          price: settings.price,
          discount_price: settings.discount_price,
          description: settings.description,
          price_per_kost: settings.price_per_kost,
          agent_commission_flat: settings.agent_commission_flat ?? 35000,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) throw new Error(`Gagal menyimpan katalog survey: ${error.message}`);

  // Simpan riwayat perubahan log
  try {
    const currentLogs = await getSurveyCatalogLogs();
    const newLog: SurveyCatalogLogEntry = {
      timestamp: new Date().toISOString(),
      admin_email: adminEmail,
      price: settings.price,
      discount_price: settings.discount_price,
      price_per_kost: settings.price_per_kost,
      agent_commission_flat: settings.agent_commission_flat ?? 35000,
    };
    const updatedLogs = [newLog, ...currentLogs].slice(0, 50); // Batasi 50 log terakhir
    await supabase
      .from('app_settings')
      .upsert({
        key: 'survey_catalog_logs',
        value: { logs: updatedLogs },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
  } catch (err) {
    console.error('Failed to save survey catalog change log:', err);
  }
}

export async function getBannedMitra(): Promise<any[]> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(authUser.id);
  if (!isAdmin) throw new Error('Access Denied');

  // Find users who have an entry in the mitra table
  const { data: mitraData } = await supabase.from('mitra').select('user_id');
  const mitraUserIds = mitraData?.map(m => m.user_id) || [];

  if (mitraUserIds.length === 0) return [];

  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('verification_status', 'banned')
    .in('id', mitraUserIds)
    .order('updated_at', { ascending: false });

  if (userError) throw userError;
  if (!users) return [];

  const userIds = users.map(u => u.id);
  let verificationsMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: verDetails } = await supabase
      .from('user_verifications')
      .select('*')
      .in('user_id', userIds);
    
    if (verDetails) {
      verDetails.forEach(v => {
        verificationsMap[v.user_id] = v;
      });
    }
  }

  return users.map(u => {
    const verInfo = verificationsMap[u.id] || {};
    return {
      ...u,
      name: u.name || u.full_name || 'No Name',
      ktp_photo: verInfo.ktp_photo_url || u.ktp_photo_url,
      ktp_number: verInfo.ktp_number || u.ktp_number,
      address: verInfo.ktp_address || u.ktp_address,
      domicile_address: u.address || '-',
      birth_place: u.birth_place || '-',
      birth_date: u.birth_date || '-',
      whatsapp_verified: u.whatsapp_verified || false,
      email_verified: true,
      type: 'verification'
    };
  });
}

export async function unbanMitraRequest(userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  await supabase.from('users').update({
    role: 'owner',
    verification_status: 'unverified',
    rejection_count: 0,
    verification_notes: null,
    updated_at: new Date().toISOString()
  }).eq('id', userId);

  await supabase.from('user_verifications').update({
    verification_status: 'unverified',
    verification_notes: null,
    updated_at: new Date().toISOString()
  }).eq('user_id', userId);

  const { data: usr } = await supabase.from('users').select('email, name, full_name').eq('id', userId).single();
  if (usr && usr.email) {
    fetch('https://us-central1-ruangsinggahid-3afb2.cloudfunctions.net/sendMitraStatusEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: usr.email,
        name: usr.full_name || usr.name,
        status: 'unbanned',
        reason: 'Akun Anda telah diaktifkan kembali oleh admin. Anda sekarang dapat mengajukan verifikasi ulang.',
        type: 'verification'
      })
    }).catch(err => {
      console.warn('Error sending status email notification:', err);
    });
  }
}

// ============================================================
// MANUAL INVOICE (TAGIHAN MANUAL) FUNCTIONS
// ============================================================

export interface ManualInvoice {
  id?: string;
  bill_number: string;
  bill_date: string;
  due_date: string;
  category: 'sewa' | 'survey' | 'database';
  recipient_name: string;
  recipient_phone?: string;
  recipient_address?: string;
  // Khusus sewa
  kost_name?: string;
  rental_amount?: number;
  commission_percent?: number;
  commission_amount?: number;
  // Non-sewa
  items?: { id: string; name: string; qty: number; unitPrice: number }[];
  notes?: string;
  total: number;
  status?: 'issued' | 'paid' | 'cancelled';
  created_by?: string;
  created_at?: string;
}

/**
 * Simpan invoice manual baru ke tabel manual_invoices
 */
export async function saveManualInvoice(invoice: ManualInvoice): Promise<ManualInvoice> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Hanya admin yang dapat menyimpan tagihan.');

  const payload = {
    bill_number: invoice.bill_number,
    bill_date: invoice.bill_date,
    due_date: invoice.due_date,
    category: invoice.category,
    recipient_name: invoice.recipient_name,
    recipient_phone: invoice.recipient_phone || null,
    recipient_address: invoice.recipient_address || null,
    kost_name: invoice.kost_name || null,
    rental_amount: invoice.rental_amount || 0,
    commission_percent: invoice.commission_percent || 0,
    commission_amount: invoice.commission_amount || 0,
    items: invoice.items || [],
    notes: invoice.notes || null,
    total: invoice.total,
    status: 'issued',
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from('manual_invoices')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(`Gagal menyimpan tagihan: ${error.message}`);
  return data as ManualInvoice;
}

/**
 * Ambil semua invoice manual (admin only)
 */
export async function getManualInvoices(): Promise<ManualInvoice[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('manual_invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Gagal memuat riwayat tagihan: ${error.message}`);
  return (data || []) as ManualInvoice[];
}

/**
 * Hapus invoice manual berdasarkan ID
 */
export async function deleteManualInvoice(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Hanya admin yang dapat menghapus tagihan.');

  const { error } = await supabase
    .from('manual_invoices')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Gagal menghapus tagihan: ${error.message}`);
}

/**
 * Update status invoice (issued / paid / cancelled)
 */
export async function updateManualInvoiceStatus(id: string, status: 'issued' | 'paid' | 'cancelled'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Hanya admin yang dapat mengubah status tagihan.');

  const { error } = await supabase
    .from('manual_invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Gagal mengubah status tagihan: ${error.message}`);
}

// ============================================================
// REFERRAL REWARDS MANAGEMENT
// ============================================================

export interface ReferralReward {
  id: string;
  agent_user_id: string;
  mitra_user_id: string;
  referral_code: string;
  bonus_amount: number;
  status: 'pending' | 'realized' | 'paid';
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  agent_name?: string;
  agent_phone?: string;
  mitra_name?: string;
  mitra_phone?: string;
  has_property?: boolean;
}

/**
 * Mendapatkan semua data reward referral agen beserta status realisasinya
 */
export async function getReferralRewards(): Promise<ReferralReward[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Access Denied');

  // 1. Jalankan sinkronisasi referral dari tabel mitra ke referral_rewards
  await syncReferralRewardsInternal();

  // 2. Ambil semua data referral_rewards
  const { data: rewards, error: fetchError } = await supabase
    .from('referral_rewards')
    .select('*')
    .order('created_at', { ascending: false });

  if (fetchError) throw new Error(`Gagal mengambil data referral: ${fetchError.message}`);

  const rewardList: ReferralReward[] = (rewards || []) as ReferralReward[];

  if (rewardList.length === 0) return [];

  // 3. Ambil data user profil untuk Agen dan Mitra
  const userIds = Array.from(new Set([
    ...rewardList.map(r => r.agent_user_id),
    ...rewardList.map(r => r.mitra_user_id)
  ]));

  const { data: userData } = await supabase
    .from('users')
    .select('id, name, phone')
    .in('id', userIds);

  const userMap: Record<string, { name: string; phone: string }> = {};
  if (userData) {
    userData.forEach(u => {
      userMap[u.id] = { name: u.name || 'User Tanpa Nama', phone: u.phone || '-' };
    });
  }

  // 4. Periksa apakah mitra sudah upload properti pertamanya (agar status pending -> realized secara real-time)
  const mitraIds = rewardList.map(r => r.mitra_user_id);
  
  // Query ke tabel properties untuk mencari properti milik mitra tersebut
  const { data: propertiesData } = await supabase
    .from('properties')
    .select('owner_id')
    .in('owner_id', mitraIds);

  const activeMitrasWithProperty = new Set<string>();
  if (propertiesData) {
    propertiesData.forEach(p => {
      if (p.owner_id) activeMitrasWithProperty.add(p.owner_id);
    });
  }

  // 5. Mapping dan verifikasi status realisasi
  const finalRewards: ReferralReward[] = [];

  for (const reward of rewardList) {
    const hasProperty = activeMitrasWithProperty.has(reward.mitra_user_id);
    let currentStatus = reward.status;

    // Jika mitra sudah upload properti pertama dan status di DB masih pending, 
    // update statusnya ke realized secara otomatis di background database
    if (hasProperty && currentStatus === 'pending') {
      currentStatus = 'realized';
      await supabase
        .from('referral_rewards')
        .update({ status: 'realized', realized_at: new Date().toISOString() })
        .eq('id', reward.id);
    }

    finalRewards.push({
      ...reward,
      status: currentStatus,
      agent_name: userMap[reward.agent_user_id]?.name || 'Agen RS',
      agent_phone: userMap[reward.agent_user_id]?.phone || '-',
      mitra_name: userMap[reward.mitra_user_id]?.name || 'Mitra Baru',
      mitra_phone: userMap[reward.mitra_user_id]?.phone || '-',
      has_property: hasProperty
    });
  }

  return finalRewards;
}

/**
 * Konfirmasi pembayaran bonus referral kepada agen
 */
export async function payReferralReward(rewardId: string, notes?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const isAdmin = await checkIfUserIsAdmin(user.id);
  if (!isAdmin) throw new Error('Hanya admin yang dapat mengonfirmasi pembayaran reward.');

  const { error } = await supabase
    .from('referral_rewards')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_by: user.id,
      notes: notes || null
    })
    .eq('id', rewardId);

  if (error) throw new Error(`Gagal memproses pembayaran reward: ${error.message}`);
}

/**
 * Fungsi internal untuk sinkronisasi data referred_by dari tabel mitra ke referral_rewards
 */
async function syncReferralRewardsInternal(): Promise<void> {
  // 1. Ambil semua mitra yang memiliki kode referral pengundang (referred_by)
  const { data: mitras } = await supabase
    .from('mitra')
    .select('user_id, referred_by')
    .not('referred_by', 'is', null);

  if (!mitras || mitras.length === 0) return;

  // 2. Ambil semua kode referral dari agen survey untuk memvalidasi dan mencocokkan user_id agen
  const referralCodes = Array.from(new Set(mitras.map(m => m.referred_by).filter(Boolean)));
  if (referralCodes.length === 0) return;

  const { data: agents } = await supabase
    .from('agents')
    .select('user_id, referral_code')
    .in('referral_code', referralCodes);

  if (!agents || agents.length === 0) return;

  // Map referral_code ke user_id agen
  const agentCodeMap: Record<string, string> = {};
  agents.forEach(a => {
    if (a.referral_code && a.user_id) {
      agentCodeMap[a.referral_code] = a.user_id;
    }
  });

  // 3. Ambil data referral_rewards yang sudah terdaftar agar tidak double insert
  const { data: existingRewards } = await supabase
    .from('referral_rewards')
    .select('mitra_user_id');

  const registeredMitraIds = new Set<string>();
  if (existingRewards) {
    existingRewards.forEach(r => registeredMitraIds.add(r.mitra_user_id));
  }

  // 4. Masukkan baris baru ke referral_rewards untuk pasangan agen & mitra baru yang terdeteksi
  const rewardsToInsert = [];
  for (const m of mitras) {
    if (!m.referred_by || registeredMitraIds.has(m.user_id)) continue;

    const agentUserId = agentCodeMap[m.referred_by];
    if (agentUserId) {
      rewardsToInsert.push({
        agent_user_id: agentUserId,
        mitra_user_id: m.user_id,
        referral_code: m.referred_by,
        bonus_amount: 50000,
        status: 'pending'
      });
    }
  }

  if (rewardsToInsert.length > 0) {
    await supabase
      .from('referral_rewards')
      .insert(rewardsToInsert);
  }
}

// --- KOSTMANAGER PACKAGE CONFIGURATIONS ---

export const DEFAULT_KOSTMANAGER_PACKAGES: KostManagerPackage[] = [
  { id: 'bulanan', duration_months: 1, price: 15000, label: 'Bulanan', is_active: true },
  { id: '2bulan', duration_months: 2, price: 30000, label: '2 Bulan', is_active: true },
  { id: '3bulan', duration_months: 3, price: 45000, label: '3 Bulan', is_active: true },
  { id: '6bulan', duration_months: 6, price: 80000, label: '6 Bulan', is_active: true },
  { id: 'tahunan', duration_months: 12, price: 100000, label: 'Tahunan', is_active: true }
];

export async function getKostManagerPackages(): Promise<KostManagerPackage[]> {
  try {
    const { data, error } = await supabase
      .from('kostmanager_packages')
      .select('*')
      .order('duration_months', { ascending: true });

    if (error) {
      console.warn('kostmanager_packages table query failed, using defaults:', error.message);
      return DEFAULT_KOSTMANAGER_PACKAGES;
    }

    return (data || []).map(d => ({
      id: d.id,
      duration_months: d.duration_months,
      price: d.price,
      label: d.label,
      is_active: d.is_active
    }));
  } catch (err: any) {
    console.error('Failed to get KostManager packages:', err);
    return DEFAULT_KOSTMANAGER_PACKAGES;
  }
}

export async function saveKostManagerPackage(pkg: Omit<KostManagerPackage, 'id'> & { id?: string }): Promise<void> {
  const payload = {
    duration_months: pkg.duration_months,
    price: pkg.price,
    label: pkg.label,
    is_active: pkg.is_active ?? true
  };
  
  if (pkg.id && !pkg.id.startsWith('pkg_') && pkg.id.length > 10) { // UUID check
    const { error } = await supabase
      .from('kostmanager_packages')
      .update(payload)
      .eq('id', pkg.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('kostmanager_packages')
      .upsert(payload, { onConflict: 'duration_months' });
    if (error) throw error;
  }
}

export async function deleteKostManagerPackage(id: string): Promise<void> {
  const { error } = await supabase
    .from('kostmanager_packages')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- PROPERTY REPORTS MANAGEMENT ---

export interface PropertyReportItem {
  id: string;
  property_id: string;
  reporter_id?: string;
  reporter_name: string;
  reporter_phone: string;
  category: string;
  description: string;
  evidence_urls?: string[];
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed' | string;
  admin_notes?: string;
  action_taken?: string;
  created_at: string;
  updated_at: string;
  propertyName?: string;
  propertyCity?: string;
  propertyAddress?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerUid?: string;
}

export async function getPropertyReports(statusFilter?: string): Promise<PropertyReportItem[]> {
  try {
    let query = supabase
      .from('property_reports')
      .select(`
        *,
        properties (
          id,
          title,
          city,
          address,
          owner_uid
        )
      `)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Querying property_reports table returned error, checking complaints fallback:', error.message);
      const { data: compData, error: compErr } = await supabase
        .from('complaints')
        .select('*')
        .ilike('category', '%REPORT:%')
        .order('created_at', { ascending: false });

      if (compErr || !compData) return [];

      return compData.map(c => ({
        id: c.id,
        property_id: c.kost_id || '',
        reporter_name: c.user_name || 'Pengguna',
        reporter_phone: c.user_phone || '',
        category: (c.category || '').replace('REPORT: ', ''),
        description: (c.description || '').replace('[ADUAN LISTING] ', ''),
        evidence_urls: c.photos || (c.photo_url ? [c.photo_url] : []),
        status: c.status || 'pending',
        admin_notes: '',
        action_taken: '',
        created_at: c.created_at,
        updated_at: c.updated_at,
        propertyName: c.kost_name || c.title || 'Kost',
        propertyCity: '',
        propertyAddress: '',
        ownerName: '',
        ownerPhone: ''
      }));
    }

    if (!data || data.length === 0) return [];

    // Collect unique owner_uids to batch fetch user details
    const ownerUids = Array.from(new Set(data.map((r: any) => r.properties?.owner_uid).filter(Boolean)));
    const ownerMap: Record<string, any> = {};

    if (ownerUids.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, full_name, phone, email')
        .in('id', ownerUids);

      (usersData || []).forEach(u => {
        ownerMap[u.id] = u;
      });
    }

    return data.map((row: any) => {
      const prop = row.properties;
      const owner = prop?.owner_uid ? ownerMap[prop.owner_uid] : null;
      return {
        id: row.id,
        property_id: row.property_id,
        reporter_id: row.reporter_id,
        reporter_name: row.reporter_name || 'Pengguna',
        reporter_phone: row.reporter_phone || '',
        category: row.category,
        description: row.description,
        evidence_urls: row.evidence_urls || [],
        status: row.status || 'pending',
        admin_notes: row.admin_notes || '',
        action_taken: row.action_taken || '',
        created_at: row.created_at,
        updated_at: row.updated_at,
        propertyName: prop?.title || 'Kost',
        propertyCity: prop?.city || '',
        propertyAddress: prop?.address || '',
        ownerName: owner?.name || owner?.full_name || 'Mitra',
        ownerPhone: owner?.phone || '',
        ownerUid: prop?.owner_uid
      };
    });
  } catch (err) {
    console.error('Failed fetching property reports:', err);
    return [];
  }
}

export async function updatePropertyReportStatus(
  reportId: string, 
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed' | string,
  adminNotes?: string,
  actionTaken?: string
): Promise<void> {
  const now = getCurrentDate().toISOString();
  const payload: any = {
    status,
    updated_at: now
  };
  if (adminNotes !== undefined) payload.admin_notes = adminNotes;
  if (actionTaken !== undefined) payload.action_taken = actionTaken;

  const { error } = await supabase
    .from('property_reports')
    .update(payload)
    .eq('id', reportId);

  if (error) {
    await supabase
      .from('complaints')
      .update({ status: status === 'resolved' ? 'closed' : status })
      .eq('id', reportId);
  }
}


