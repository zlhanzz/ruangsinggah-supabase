// functions/src/index.ts

// --- IMPOR YANG DIBUTUHKAN ---
import * as functions from 'firebase-functions/v2';
import { URL } from 'url';
// Heavy imports (admin, Storage, googleDriveUtils) are lazy-loaded below to avoid deployment timeouts


// --- CONFIGURATION PARAMS ---
import { defineString } from 'firebase-functions/params';
const supabaseUrlParam = defineString('SUPABASE_URL');
const supabaseKeyParam = defineString('SUPABASE_SERVICE_ROLE_KEY');
const brevoApiKeyParam = defineString('BREVO_API_KEY');
const pakasirApiKeyParam = defineString('PAKASIR_API_KEY');
const activeGatewayParam = defineString('ACTIVE_GATEWAY', { default: 'MIDTRANS' }); // Options: MIDTRANS or PAKASIR

const midtransMerchantIdParam = defineString('MIDTRANS_MERCHANT_ID');
const midtransClientKeyParam = defineString('MIDTRANS_CLIENT_KEY');
const midtransServerKeyParam = defineString('MIDTRANS_SERVER_KEY');
import { defineBoolean } from 'firebase-functions/params';
const midtransIsProductionParam = defineBoolean('MIDTRANS_IS_PRODUCTION', { default: false });

const googlePrivateKeyParam = defineString('GOOGLE_PRIVATE_KEY');
const googleClientEmailParam = defineString('GOOGLE_SERVICE_ACCOUNT_EMAIL');

const activeKeys = {
    merchant_id: midtransMerchantIdParam.value(),
    client_key: midtransClientKeyParam.value(),
    server_key: midtransServerKeyParam.value()
};

const MIDTRANS_IS_PRODUCTION = midtransIsProductionParam.value();

// --- DIAGNOSTIC LOGS ---
console.log("MIDTRANS_DIAGNOSTIC: Environment is", MIDTRANS_IS_PRODUCTION ? "PRODUCTION" : "SANDBOX");
console.log("MIDTRANS_DIAGNOSTIC: Server Key Length:", activeKeys.server_key?.length);
console.log("MIDTRANS_DIAGNOSTIC: Client Key Length:", activeKeys.client_key?.length);
console.log("MIDTRANS_DIAGNOSTIC: Merchant ID:", activeKeys.merchant_id);
// -----------------------
const activeEnv = MIDTRANS_IS_PRODUCTION ? 'PRODUCTION' : 'SANDBOX';

let snap: any = null;
function getMidtransSnap() {
  if (!snap) {
    const midtransClient = require('midtrans-client');
    snap = new midtransClient.Snap({
      isProduction: MIDTRANS_IS_PRODUCTION,
      serverKey: activeKeys.server_key,
      clientKey: activeKeys.client_key,
      merchantId: activeKeys.merchant_id
    });
  }
  return snap;
}

let coreApi: any = null;
function getMidtransCoreApi() {
  if (!coreApi) {
    const midtransClient = require('midtrans-client');
    coreApi = new midtransClient.CoreApi({
      isProduction: MIDTRANS_IS_PRODUCTION,
      serverKey: activeKeys.server_key,
      clientKey: activeKeys.client_key,
      merchantId: activeKeys.merchant_id
    });
  }
  return coreApi;
}

// Services will be initialized lazily to avoid deployment timeouts
let adminApp: any = null;
function getAdmin() {
    if (!adminApp) {
        adminApp = require('firebase-admin');
        adminApp.initializeApp();
    }
    return adminApp;
}

let db: any = null;
function getFirestore() {
    if (!db) db = getAdmin().firestore();
    return db;
}

let gcs: any = null;
function getStorage() {
    if (!gcs) {
        const { Storage } = require('@google-cloud/storage');
        gcs = new Storage();
    }
    return gcs;
}

interface ImageUrlObject {
  original: string;
  webp?: string;
  thumbnail?: string;
}

// Helper untuk membersihkan URL Firebase Storage dari token dan alt=media
function normalizeFirebaseStorageUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        urlObj.searchParams.delete('alt'); // Hapus parameter alt
        urlObj.searchParams.delete('token'); // Hapus parameter token
        return urlObj.toString();
    } catch (e) {
        console.warn("CF_LOG: Gagal menormalisasi URL:", url, e);
        return url; // Jika gagal, kembalikan saja URL asli
    }
}


const MASTER_PAYMENT_METHODS = [
  { code: 'qris', name: 'QRIS', icon: '📱', iconUrl: '/payment-logos/qris-logo.svg', color: 'bg-white', category: 'none' },
  { code: 'gopay', name: 'GoPay', icon: '💸', iconUrl: '/payment-logos/gopay-logo.svg', color: 'bg-white', category: 'ewallet' },
  { code: 'dana', name: 'DANA', icon: '💸', iconUrl: '/payment-logos/dana-logo.svg', color: 'bg-white', category: 'ewallet' },

  // Virtual Accounts (Sesuai Production)
  { code: 'bri_va', name: 'BRI Virtual Account', icon: '🏦', iconUrl: '/payment-logos/bank-rakyat-indonesia-(bri)-logo.svg', color: 'bg-white', category: 'va' },
  { code: 'bni_va', name: 'BNI Virtual Account', icon: '🏦', iconUrl: '/payment-logos/bank-negara-indonesia-(bni)-logo.svg', color: 'bg-white', category: 'va' },
  { code: 'mandiri_va', name: 'Mandiri Virtual Account', icon: '🏦', iconUrl: '/payment-logos/bank-mandiri-logo.svg', color: 'bg-white', category: 'va' },
  { code: 'bsi_va', name: 'BSI Virtual Account', icon: '🌙', iconUrl: '/payment-logos/bank-bsi-logo.svg', color: 'bg-white', category: 'va' },
  { code: 'permata_va', name: 'Permata Virtual Account', icon: '🏦', iconUrl: '/payment-logos/bank-permata-logo.svg', color: 'bg-white', category: 'va' },
  { code: 'cimb_va', name: 'CIMB Virtual Account', icon: '🏦', iconUrl: '/payment-logos/bank-cimb-niaga-logo.svg', color: 'bg-white', category: 'va' }
];

/**
 * getPaymentConfig: Returns current active gateway configuration and enabled methods to frontend.
 */
export const getPaymentConfig = functions.https.onRequest({ cors: true }, async (req, res) => {
  res.status(200).send({
    activeGateway: activeGatewayParam.value(),
    midtransEnv: activeEnv,
    midtransClientKey: activeKeys.client_key,
    paymentMethods: MASTER_PAYMENT_METHODS
  });
});

export const optimizeImageAndSaveUrl = functions.storage.onObjectFinalized(async (event) => {
  const object = event.data;

  if (!object) {
    console.error("CF_LOG: No object data found in event.");
    return;
  }

  const fileBucket = object.bucket;
  const filePath = object.name || '';
  const contentType = object.contentType || '';

  if (!contentType.startsWith('image/') || !filePath.includes('/original/')) {
    console.log('CF_LOG: Bukan upload original image, atau bukan gambar. Melewatkan.');
    return;
  }
  if (filePath.includes('/webp/') || filePath.includes('/thumbnail/')) {
    console.log('CF_LOG: File yang diupload adalah versi teroptimasi. Melewatkan.');
    return;
  }
  const bucket = getStorage().bucket(fileBucket);
  const file = bucket.file(filePath);

  const pathParts = filePath.split('/');
  if (pathParts.length < 6) {
    console.error('CF_LOG: Format path gambar tidak cukup panjang. Melewatkan:', filePath);
    return;
  }

  const entityType = pathParts[0];
  const entityOwnerId = pathParts[1];
  const entityId = pathParts[2];
  const subFolder = pathParts[3];
  const versionFolder = pathParts[4];
  const originalFileNameWithExt = pathParts[5];

  if (!['properties', 'databases'].includes(entityType) ||
      (entityType === 'properties' && subFolder !== 'images') ||
      (entityType === 'databases' && subFolder !== 'cover') ||
      versionFolder !== 'original' ||
      !entityOwnerId || !entityId || !originalFileNameWithExt) {
    console.error('CF_LOG: Format path gambar tidak valid (tipe entitas, subfolder, atau versi). Melewatkan:', filePath);
    return;
  }

  const lastDotIndex = originalFileNameWithExt.lastIndexOf('.');
  const baseFileName = (lastDotIndex !== -1) ? originalFileNameWithExt.substring(0, lastDotIndex) : originalFileNameWithExt;

  const encodedBaseFileName = encodeURIComponent(baseFileName);

  const webpFilePath = `${entityType}/${entityOwnerId}/${entityId}/${subFolder}/webp/${encodedBaseFileName}.webp`;
  const thumbnailFilePath = `${entityType}/${entityOwnerId}/${entityId}/${subFolder}/thumbnail/${encodedBaseFileName}_thumb.webp`;

  const webpFile = bucket.file(webpFilePath);
  const thumbnailFile = bucket.file(thumbnailFilePath);

  console.log(`CF_LOG: Memproses gambar: ${filePath} untuk ${entityType}/${entityId}. Base: ${baseFileName}`);

  try { // Try utama
    const [downloadBuffer] = await file.download();

    const sharpModule = require('sharp');

    const webpBuffer = await sharpModule(downloadBuffer)
      .resize({ width: 1200, withoutEnlargement: true, fit: sharpModule.fit.inside })
      .toFormat('webp', { quality: 80 })
      .toBuffer();

    const thumbnailBuffer = await sharpModule(downloadBuffer)
      .resize({ width: 200, height: 200, fit: 'cover' })
      .toFormat('webp', { quality: 70 })
      .toBuffer();

    await webpFile.save(webpBuffer, {
      contentType: 'image/webp',
      metadata: {
        cacheControl: 'public, max-age=31536000',
        originalFilePath: filePath,
        processed: 'true',
      },
    });
    await thumbnailFile.save(thumbnailBuffer, {
      contentType: 'image/webp',
      metadata: {
        cacheControl: 'public, max-age=31536000',
        originalFilePath: filePath,
        processed: 'true',
      },
    });

    const webpDownloadUrl = await getDownloadURLFromRef(webpFile);
    const thumbnailUrl = await getDownloadURLFromRef(thumbnailFile);
    const originalDownloadUrl = await getDownloadURLFromRef(file);
    
    const normalizedOriginalDownloadUrl = normalizeFirebaseStorageUrl(originalDownloadUrl);

    let docRef: FirebaseFirestore.DocumentReference;
    let collectionName: string;

    if (entityType === 'properties') {
        collectionName = 'properties';
    } else if (entityType === 'databases') {
        collectionName = 'availableDatabases';
    } else {
        console.error(`CF_LOG: Tipe entitas tidak didukung: ${entityType}. Melewatkan update Firestore.`);
        return;
    }
    docRef = getFirestore().collection(collectionName).doc(entityId);

    console.log(`CF_LOG: Memulai update Firestore untuk dokumen: ${collectionName}/${entityId}`);
    try { // Try untuk update Firestore
      // --- KOREKSI KRUSIAL: Menunggu dokumen ada atau retrying ---
      let docRetries = 0;
      const MAX_DOC_RETRIES = 5; // Coba hingga 5 kali (sekitar 5 detik)
      const DOC_RETRY_DELAY_MS = 1000; // Jeda 1 detik

      let docSnap: FirebaseFirestore.DocumentSnapshot | undefined; // <--- INISIALISASI DENGAN UNDEFINED
      while (docRetries < MAX_DOC_RETRIES) {
        docSnap = await docRef.get(); // Coba ambil dokumen
        if (docSnap.exists) {
          console.log(`CF_LOG: Dokumen ${collectionName}/${entityId} ditemukan setelah ${docRetries} percobaan.`);
          break; // Keluar dari loop jika ditemukan
        }
        console.warn(`CF_LOG: Peringatan: Dokumen ${collectionName}/${entityId} belum ada. Mencoba lagi (${docRetries + 1}/${MAX_DOC_RETRIES}).`);
        await new Promise(resolve => setTimeout(resolve, DOC_RETRY_DELAY_MS));
        docRetries++;
      }

      if (!docSnap || !docSnap.exists) { // <--- PERIKSA docSnap agar tidak undefined
        console.error(`CF_LOG: ERROR: Dokumen ${collectionName}/${entityId} tidak ditemukan setelah beberapa percobaan!`);
        throw new Error(`Dokumen ${collectionName}/${entityId} tidak ditemukan setelah beberapa percobaan!`);
      }
      // --- AKHIR KOREKSI ---

      const currentData = docSnap.data();
      let finalUpdatePayload: { imageUrls?: ImageUrlObject[], fileUrls?: any, updatedAt: FirebaseFirestore.FieldValue };

      if (entityType === 'properties') {
          const currentImageUrls: ImageUrlObject[] = currentData?.imageUrls || [];
          console.log("CF_LOG: currentData (properties):", JSON.stringify(currentData));
          console.log("CF_LOG: currentImageUrls (properties):", JSON.stringify(currentImageUrls));

          const updatedImageUrls = currentImageUrls.map((img: ImageUrlObject) => {
            if (normalizeFirebaseStorageUrl(img.original) === normalizedOriginalDownloadUrl) {
                console.log(`CF_LOG: Menemukan URL original properti yang cocok di Firestore, memperbarui dengan WebP/Thumbnail.`);
                return { original: originalDownloadUrl, webp: webpDownloadUrl, thumbnail: thumbnailUrl };
            }
            return img;
          });
          
          const originalUrlExistsInFirestore = currentImageUrls.some(
              (img: ImageUrlObject) => normalizeFirebaseStorageUrl(img.original) === normalizedOriginalDownloadUrl
          );

          if (!originalUrlExistsInFirestore) {
              console.warn(`CF_LOG: Peringatan: URL original properti yang baru diproses tidak ditemukan di Firestore, menambahkannya sebagai entri baru.`);
              updatedImageUrls.push({ original: originalDownloadUrl, webp: webpDownloadUrl, thumbnail: thumbnailUrl });
          }

          finalUpdatePayload = {
              imageUrls: updatedImageUrls,
              updatedAt: getAdmin().firestore.FieldValue.serverTimestamp()
          };

      } else if (entityType === 'databases') {
          const currentFileUrls = currentData?.fileUrls || {};
          console.log("CF_LOG: currentData (databases):", JSON.stringify(currentData));
          console.log("CF_LOG: currentFileUrls (databases):", JSON.stringify(currentFileUrls));
          console.log("CF_LOG: currentFileUrls.coverImage (databases):", JSON.stringify(currentFileUrls.coverImage));

          const updatedCoverImage: ImageUrlObject = {
              original: originalDownloadUrl,
              webp: webpDownloadUrl,
              thumbnail: thumbnailUrl,
          };
          
          finalUpdatePayload = {
              fileUrls: {
                  ...currentFileUrls,
                  coverImage: updatedCoverImage
              },
              updatedAt: getAdmin().firestore.FieldValue.serverTimestamp()
          };
          console.log(`CF_LOG: Memperbarui coverImage di fileUrls untuk database dengan WebP/Thumbnail.`);
      } else {
             throw new Error(`CF_LOG: Tipe entitas tidak didukung: ${entityType}. Tidak dapat membuat payload update.`);
      }

      console.log("CF_LOG: Final updatePayload Firestore sebelum commit:", JSON.stringify(finalUpdatePayload));
      await docRef.update(finalUpdatePayload); // Langsung update
      console.log(`CF_LOG: Update Firestore berhasil commit untuk dokumen: ${collectionName}/${entityId}`);

      await file.delete();
      console.log(`CF_LOG: File original ${filePath} telah dihapus.`);

      console.log(`CF_LOG: Gambar ${filePath} berhasil diproses. WebP: ${webpDownloadUrl}, Thumbnail: ${thumbnailUrl}`);

    } catch (firestoreError: any) { // Catch untuk update Firestore
      console.error(`CF_LOG: ERROR: Terjadi error pada update Firestore untuk dokumen ${collectionName}/${entityId}:`, firestoreError);
      throw firestoreError;
    }

  } catch (outerError) { // Catch utama untuk seluruh fungsi
    console.error(`CF_LOG: ERROR: Terjadi error di luar update Firestore untuk gambar ${filePath}:`, outerError);
  }
}); // Akhir fungsi utama

// Helper to get supabase client securely
let supabaseInstance: any = null;
function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const url = supabaseUrlParam.value();
  const key = supabaseKeyParam.value();

  if (!url || !key) {
    console.warn("Supabase credentials missing. Client not initialized.");
    return null;
  }
  
  // Lazy-load the library
  const { createClient } = require('@supabase/supabase-js');
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}



/**
 * sendSuccessEmail: Fetches user and product data, then sends notification email via Brevo API.
 */
async function sendSuccessEmail(orderId: string) {
  console.log(`EMAIL_SERVICE: Preparing email for Order ${orderId}`);
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // 1. Fetch transaction details
    const { data: order, error: orderError } = await supabase
      .from('transactions')
      .select('*, users(email, full_name)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
        console.error("EMAIL_SERVICE: Order not found for email:", orderId, "Error:", orderError);
        return;
    }

    const userEmail = order.users?.email;
    const userName = order.users?.full_name || 'Pelanggan';
    
    console.log(`EMAIL_SERVICE: Target Email: ${userEmail}, Target Name: ${userName}`);

    if (!userEmail) {
        console.warn("EMAIL_SERVICE: No user email found for order:", orderId, "Order Metadata:", JSON.stringify(order.metadata));
        return;
    }

    // 2. Fetch product details (especially if it's a database)
    let productLink = '';
    let productName = 'Produk RuangSinggah';

    if (order.product_type === 'database') {
        const { data: product } = await supabase
          .from('available_databases')
          .select('campus, area, file_urls, file_type')
          .eq('id', order.product_id)
          .single();
        
        if (product) {
            productName = `Database Kost ${product.campus || product.area || ''}`;
            productLink = product.file_urls?.link || product.file_urls?.file || product.file_urls?.googleDrive || '';
        }
    } else if (order.product_type === 'kost_booking') {
        const kName = order.metadata?.kostName || order.metadata?.item || '';
        const kPeriod = order.metadata?.periodLabel || order.metadata?.period || '-';
        productName = kName ? `Sewa Kost ${kName} (${kPeriod})` : "Booking Kost";
        productLink = "https://ruangsinggah.id/my-kost";
    } else if (order.product_type === 'survey') {
        productName = "Jasa Survey Lokasi Kost";
        productLink = "https://ruangsinggah.id/survey-service";
    }

    // 3. Configure Sender
    const senderEmail = order.product_type === 'database' ? 'invoice@ruangsinggah.id' : 'system@ruangsinggah.id';
    const brevoApiKey = brevoApiKeyParam.value();

    console.log(`EMAIL_SERVICE: Sender: ${senderEmail}, API Key: ${brevoApiKey ? 'FOUND (Length: ' + brevoApiKey.length + ')' : 'MISSING'}`);

    if (!brevoApiKey) {
      console.error("EMAIL_SERVICE: BREVO_API_KEY is missing from environment params (defineString)");
      return;
    }

    // 4. Send Email via Brevo REST API
    const payload = {
      sender: { name: "RuangSinggah.id", email: senderEmail },
      to: [{ email: userEmail, name: userName }],
      subject: `Pembayaran Berhasil! - ${productName}`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 10px;">
          <h2 style="color: #f97316;">Halo, ${userName}!</h2>
          <p>Terima kasih telah melakukan pembayaran di <strong>RuangSinggah.id</strong>.</p>
          <p>Pembayaran Anda untuk <strong>${productName}</strong> senilai <strong>Rp ${order.amount.toLocaleString('id-ID')}</strong> telah kami terima.</p>
          
          ${order.product_type === 'database' ? `
            <div style="background: #fff7ed; padding: 20px; border-radius: 12px; border: 1px solid #ffedd5; margin: 20px 0;">
              <p style="margin-top: 0;">Berikut adalah link akses database yang Anda beli:</p>
              <a href="${productLink}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">AKSES DATABASE SEKARANG</a>
              <p style="font-size: 12px; color: #9a3412; margin-top: 15px;">*Harap simpan link ini dengan baik.</p>
            </div>
          ` : order.product_type === 'survey' ? `
            <div style="background: #eff6ff; padding: 20px; border-radius: 12px; border: 1px solid #dbeafe; margin: 20px 0;">
              <p style="margin-top: 0;">Terima kasih telah memesan <strong>Jasa Survey Lokasi</strong>.</p>
              <p>Tim kami akan segera memverifikasi pembayaran Anda dan menghubungi Anda melalui WhatsApp untuk jadwal video call.</p>
              <p style="font-size: 12px; color: #1e40af; margin-top: 15px;">*Pastikan nomor WhatsApp Anda aktif.</p>
            </div>
          ` : order.product_type === 'kost_booking' ? `
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #334155; font-size: 16px;">Detail Penyewaan:</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #475569;">
                <tr><td style="padding: 6px 0; width: 40%;"><strong>Nama Kost</strong></td><td>: ${order.metadata?.kostName || order.metadata?.item || '-'}</td></tr>
                <tr><td style="padding: 6px 0;"><strong>Tipe Kamar</strong></td><td>: ${order.metadata?.roomType || '-'}</td></tr>
                <tr><td style="padding: 6px 0;"><strong>Durasi Sewa</strong></td><td>: ${order.metadata?.periodLabel || order.metadata?.period || '-'}</td></tr>
                <tr><td style="padding: 6px 0;"><strong>Masa Sewa</strong></td><td>: ${order.metadata?.startDate || '-'} s/d ${order.metadata?.endDate || '-'}</td></tr>
              </table>
            </div>
            <p>Silakan cek status pesanan Anda di halaman "My Kost" pada aplikasi kami.</p>
            <a href="${productLink}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">CEK STATUS BOOKING</a>
          ` : `
            <p>Silakan cek status pesanan Anda di halaman "My Kost" pada aplikasi kami.</p>
            <a href="${productLink}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">CEK STATUS BOOKING</a>
          `}
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Jika ada pertanyaan, silakan hubungi admin kami melalui WhatsApp di website.</p>
          <p style="font-size: 12px; color: #666;">Salam hangat,<br />Tim RuangSinggah.id</p>
        </div>
      `
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log(`EMAIL_SERVICE: Brevo Status: ${response.status} ${response.statusText}`, JSON.stringify(result));
    
    if (!response.ok) {
      const errorMsg = `Brevo API Error (${response.status}): ${JSON.stringify(result)}`;
      console.error("EMAIL_SERVICE:", errorMsg);
      
      // Record failure in DB
      await supabase.from('transactions').update({
          metadata: { 
              ...(order.metadata || {}), 
              email_sent_status: 'FAILED',
              email_error: errorMsg,
              email_last_attempt: new Date().toISOString()
          }
      }).eq('id', orderId);
      
      throw new Error(errorMsg);
    }

    console.log("EMAIL_SERVICE: Email sent successfully via Brevo REST API!", result);
    
    // Record success in DB
    await supabase.from('transactions').update({
        metadata: { 
            ...(order.metadata || {}), 
            email_sent_status: 'SUCCESS',
            email_sent_at: new Date().toISOString()
        }
    }).eq('id', orderId);

  } catch (err: any) {
    console.error("EMAIL_SERVICE: Exception in sendSuccessEmail:", err);
    // Generic failure record if not already caught
    try {
        const supabase = getSupabase();
        if (supabase) {
            await supabase.from('transactions').update({
                metadata: { 
                    email_sent_status: 'ERROR',
                    email_error: err.message || 'Unknown Error',
                    email_last_attempt: new Date().toISOString()
                }
            }).eq('id', orderId);
        }
    } catch (dbErr) {
        console.error("EMAIL_SERVICE: Failed to record error to DB:", dbErr);
    }
  }
}

/**
 * sendEmailWithAttachment: Generic helper to send an email with an attachment (like an invoice) via Brevo.
 */
async function sendEmailWithAttachment(toEmail: string, subject: string, text: string, attachmentBase64: string, filename: string) {
  const brevoApiKey = brevoApiKeyParam.value();
  if (!brevoApiKey) return;

  const payload = {
    sender: { name: "RuangSinggah.id", email: "invoice@ruangsinggah.id" },
    to: [{ email: toEmail }],
    subject: subject,
    textContent: text,
    attachment: [{
      content: attachmentBase64,
      name: filename
    }]
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json().catch(() => ({}));
    console.log(`EMAIL_ATTACH: Brevo Status: ${response.status}`);
    
    if (!response.ok) {
        console.error("EMAIL_ATTACH_ERROR:", JSON.stringify(result));
    } else {
        console.log("EMAIL_ATTACH_SUCCESS:", result);
    }
  } catch (err) {
    console.error("EMAIL_ATTACH_EXCEPTION:", err);
  }
}

function generatePDFBuffer(orderId: string, userName: string, productName: string, amount: number, dateStr: string, detailLabel: string = 'Produk', headerTitle: string = 'INVOICE', periodText: string = ''): Promise<string> {
  const PDFDocument = require('pdfkit');
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: any[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData.toString('base64'));
      });

      // --- HEADER & LOGO ---
      // Logo "RuangSinggah.id" (styled like navbar)
      doc.fontSize(24).font('Helvetica-Bold')
         .fillColor('#f97316').text('RuangSinggah', 50, 50, { continued: true })
         .fillColor('#111827').text('.id');
      
      // Invoice Info Right Aligned
      doc.fontSize(20).fillColor('#374151').text(headerTitle.toUpperCase(), 50, 50, { align: 'right', width: 495 });
      doc.fontSize(10).fillColor('#6b7280').text(`Order ID: #${orderId.substring(0,8).toUpperCase()}`, 50, 75, { align: 'right', width: 495 });
      doc.text(`Tanggal: ${dateStr}`, 50, 90, { align: 'right', width: 495 });
      
      doc.moveDown(3);

      // --- BILLING INFO ---
      doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold').text('Ditagihkan Kepada:', 50, 140);
      doc.fontSize(10).font('Helvetica').fillColor('#374151').text(userName, 50, 155);
      
      // --- TABLE HEADER ---
      const tableTop = 220;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827');
      doc.text(`Deskripsi ${detailLabel}`, 50, tableTop);
      doc.text('Kuantitas', 350, tableTop, { width: 50, align: 'center' });
      doc.text('Harga Satuan', 420, tableTop, { width: 125, align: 'right' });
      
      // Line under header
      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#e5e7eb').lineWidth(2).stroke();

      // --- TABLE CONTENT ---
      const rowTop = tableTop + 30;
      doc.font('Helvetica').fontSize(10).fillColor('#374151');
      doc.text(productName, 50, rowTop, { width: 280 });
      doc.text('1' + (periodText ? periodText.replace(' /', '') : ''), 350, rowTop, { width: 50, align: 'center' });
      doc.text(`Rp ${amount.toLocaleString('id-ID')}`, 420, rowTop, { width: 125, align: 'right' });

      // Line under row
      doc.moveTo(50, rowTop + 25).lineTo(545, rowTop + 25).strokeColor('#f3f4f6').lineWidth(1).stroke();

      // --- TOTAL SECTION ---
      const totalTop = rowTop + 50;
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
      doc.text('Total Tagihan', 250, totalTop, { width: 150, align: 'right' });
      doc.fillColor('#f97316').text(`Rp ${amount.toLocaleString('id-ID')}`, 420, totalTop, { width: 125, align: 'right' });

      // --- FOOTER ---
      doc.fontSize(10).font('Helvetica').fillColor('#9ca3af')
         .text('Terima kasih atas pesanan Anda. Silakan selesaikan pembayaran Anda dengan memilih', 50, 700, { align: 'center', width: 495 });
      doc.text('metode pembayaran (QRIS, VA, dll) di platform RuangSinggah.id', 50, 715, { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}



/**
 * createPakasirPayment: Unified bridge function for all product types
 * Securely fetches prices from DB and creates Pakasir transaction.
 */
export const createPakasirPayment = functions.https.onRequest({ cors: true }, async (req, res) => {
  const { productId, productType, userId, metadata, method, existingOrderId } = req.body;
  
  // [SECURITY] Anti-Spam Validation
  const spamCheck = validateAntiSpam(req.body);
  if (!spamCheck.valid) {
      res.status(403).send({ message: spamCheck.message });
      return;
  }

  console.log(`CREATE_PAYMENT: Start (Type: ${productType}, ID: ${productId}, User: ${userId}, Method: ${method || 'none'}, existingOrderId: ${existingOrderId})`);
  
  if (!productId || !productType || !userId) {
    res.status(400).send({ message: 'Missing parameters: productId, productType, userId' });
    return;
  }

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database client not available.');

    let finalAmount = 0;
    let order: any = null;

    // Check for existing pending orders to prevent duplicates and handle expiration
    if (!existingOrderId) {
      const { data: existingPending, error: fetchPendingErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .in('status', ['pending', 'PENDING_APPROVAL', 'AWAITING_PAYMENT']);

      if (!fetchPendingErr && existingPending && existingPending.length > 0) {
        const now = new Date().getTime();
        for (const pendingOrder of existingPending) {
          const createdTime = new Date(pendingOrder.created_at).getTime();
          const diffSecs = Math.floor((now - createdTime) / 1000);
          
          if (diffSecs >= 10800) {
            console.log(`CREATE_PAYMENT: Marking expired order ${pendingOrder.id}`);
            await supabase.from('transactions').update({ status: 'expired' }).eq('id', pendingOrder.id);
          } else {
            // Check if it's the exact same product (or same kost for survey)
            const isSameSurvey = productType === 'survey' && 
                                (pendingOrder.metadata as any)?.kostName === (metadata as any)?.kostName;
            const isSameProduct = pendingOrder.product_id === productId;

            if (isSameProduct || isSameSurvey) {
              // Priority 1: Check if method matches exactly to avoid double payment same method
              if (method && pendingOrder.payment_method === method) {
                console.log(`CREATE_PAYMENT: Reusing existing EXACT order ${pendingOrder.id}`);
                order = pendingOrder;
                break;
              }
              
              // Priority 2: Resume existing order but maybe with new method
              console.log(`CREATE_PAYMENT: Resuming existing pending order ${pendingOrder.id} for ${productType}`);
              const { data: updatedOrder } = await supabase
                .from('transactions')
                .update({ payment_method: method || pendingOrder.payment_method })
                .eq('id', pendingOrder.id)
                .select()
                .single();
              
              order = updatedOrder || pendingOrder;
              finalAmount = Number(order.amount);
              break;
            }
          }
        }
      }
    }

    if (existingOrderId && !order) {
        console.log(`CREATE_PAYMENT: Reusing existing order: ${existingOrderId}`);
        const { data: extOrder, error: extError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', existingOrderId)
          .single();
        if (extError || !extOrder) throw new Error('Order lama tidak ditemukan.');
        if (extOrder.status === 'expired') throw new Error('Sesi pembayaran ini telah kadaluarsa (3 jam). Silakan buat pesanan baru.');
        order = extOrder;
        finalAmount = Number(order.amount);
    } else if (!order) {
        const reqAmount = Number(req.body.amount);
        
        // SECURITY/LOGIC: Fetch authoritative price from DB based on productType
        if (productType === 'database') {
            const { data: dbProd, error: dbError } = await supabase
              .from('available_databases')
              .select('price')
              .eq('id', productId)
              .single();
            if (dbError || !dbProd) throw new Error('Produk database tidak ditemukan.');
            finalAmount = reqAmount || Number(dbProd.price);
        } else if (productType === 'kost_booking' || productType === 'property' || productType === 'kost') {
            const { data: prop, error: propError } = await supabase
              .from('properties')
              .select('price')
              .eq('id', productId)
              .single();
            if (propError || !prop) throw new Error('Listings properti tidak ditemukan.');
            // Prioritize reqAmount for kost_booking to support additions (occupants, etc)
            finalAmount = reqAmount || Number(prop.price);
        } else if (productType === 'survey') {
            finalAmount = 70000;
        } else {
            throw new Error(`Unsupported product type: ${productType}`);
        }

        const finalMetadata = { 
          ...metadata, 
          is_simulated: false,
          item_details: req.body.item_details || metadata?.item_details || undefined
        };

        // 1. Create transaction record in Supabase
        const { data: newOrder, error: orderError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            product_id: productId,
            product_type: productType,
            amount: finalAmount,
            metadata: finalMetadata,
            payment_method: method || null,
            status: 'pending'
          })
          .select('*')
          .single();

        if (orderError) throw orderError;
        order = newOrder;
    }

    // NEW & FIXED: If survey, record into survey_requests
    // This must happen OUTSIDE the 'if (!order)' block to handle resumed transactions
    if (productType === 'survey') {
        console.log(`CREATE_PAYMENT: Recording/Updating survey_request for order ${order.id}`);
        await syncSurveyRequestsBackend(supabase, order);
        
        // Send Admin Notification about NEW survey request
        try {
          const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
          if (admins) {
            for (const admin of admins) {
              await supabase.from('notifications').insert({
                user_id: admin.id,
                title: 'Survey Baru Terdeteksi',
                message: `Ada pesanan survey baru untuk Kost: ${metadata.kostName || 'Survey Kost'}. Status: ${order.status}.`,
                type: 'assignment'
              });
            }
          }
        } catch (ignore) {}
    }

    // 2. Construct Pakasir Checkout URL
    const pakasirSlug = 'ruangsinggah-id';
    const PAKASIR_API_KEY = pakasirApiKeyParam.value();
    const checkoutUrl = `https://app.pakasir.com/pay/${pakasirSlug}/${finalAmount}?order_id=${order.id}`;

    let directPayment = null;
    let apiStatus = 'not_requested';

    if (method) {
      try {
        const apiUrl = `https://app.pakasir.com/api/transactioncreate/${method}`;
        const cleanOrderId = order.id;
        const cleanAmount = Math.round(Number(order.amount) || finalAmount);

        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: pakasirSlug,
            order_id: cleanOrderId,
            amount: cleanAmount,
            api_key: PAKASIR_API_KEY
          })
        });
        const result = await apiResponse.json();
        console.log(`CREATE_PAYMENT: Pakasir Response:`, JSON.stringify(result));

        if (result.status === 'success' || result.payment || result.data) {
          directPayment = result.payment || result.data || result;
          apiStatus = 'success';
        } else {
          apiStatus = result.status || 'api_error';
          metadata.pakasir_error = result.message || JSON.stringify(result);
        }
      } catch (e: any) {
        apiStatus = 'fetch_exception';
        metadata.pakasir_error = `Fetch Error: ${e.message}`;
      }
    }

    // 3. Update order with results
    const updatePayload: any = { 
        pakasir_link: checkoutUrl,
        payment_method: method || order.payment_method
    };
    if (directPayment) {
      updatePayload.pakasir_order_id = directPayment.id || directPayment.order_id;
      updatePayload.metadata = { ...order.metadata, is_simulated: false };
    }

    const { data: updatedOrder } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('id', order.id)
      .select('*')
      .single();

    // 4. Send Invoice Email if method selected and API success
    if (method && apiStatus === 'success' && directPayment) {
      try {
        const { data: userData } = await supabase.from('users').select('full_name, email').eq('id', userId).single();
        if (userData && userData.email) {
          const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          const productName = productType === 'survey' ? `Survey Kost: ${metadata.kostName}` : (productType === 'database' ? 'Akses Database' : 'Booking Properti');
          
          const pdfBase64 = await generatePDFBuffer(
            order.id, 
            userData.full_name || 'Pelanggan', 
            productName, 
            finalAmount, 
            dateStr
          );

          await sendEmailWithAttachment(
            userData.email,
            `Invoice Pembayaran #${order.id.substring(0,8).toUpperCase()}`,
            `Halo ${userData.full_name || 'User'}, silakan selesaikan pembayaran Anda. Detail invoice terlampir.`,
            pdfBase64,
            `Invoice-${order.id.substring(0,8)}.pdf`
          );
        }
      } catch (err) {
        console.error("CREATE_PAYMENT: Failed to send invoice email:", err);
      }
    }

    res.status(200).send({ 
      order: updatedOrder || order,
      directPayment: directPayment,
      apiStatus: apiStatus,
      message: metadata.pakasir_error || null
    });
  } catch (error: any) {
    console.error("CREATE_PAYMENT_ERROR:", error);
    res.status(500).send({ message: error.message || 'Gagal memproses pembayaran' });
  }
});

/**
 * simulatePaymentSuccess: Admin-only function to manually trigger a success state for testing.
 * Handles both single and bundled (Rent+Facility) payments.
 */
export const simulatePaymentSuccess = functions.https.onRequest({ cors: true }, async (req, res) => {
  const { orderId, adminUserId } = req.body;
  console.log(`SIMULATE_SUCCESS: Start for Order ${orderId} (By: ${adminUserId})`);

  if (!orderId || !adminUserId) {
    res.status(400).send({ message: 'Missing orderId or adminUserId' });
    return;
  }

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database client not available.');

    const { data: user } = await supabase.from('users').select('role').eq('id', adminUserId).single();
    if (!user || user.role !== 'admin') {
      res.status(403).send({ message: 'Unauthorized. Admin only.' });
      return;
    }

    const { data: order, error: fetchErr } = await supabase.from('transactions').select('*').eq('id', orderId).single();
    if (fetchErr || !order) throw new Error('Order not found.');

    if (order.status === 'PAID') {
      res.status(200).send({ message: 'Order already paid.' });
      return;
    }

    const metadata = order.metadata || {};
    const settlementDate = metadata.simulated_date 
        ? new Date(metadata.simulated_date).toISOString() 
        : new Date().toISOString();
    
    // Update Parent & Children with metadata and status
    console.log(`SIMULATE_SUCCESS: Updating metadata for Order ${orderId} (Settlement: ${settlementDate})`);
    await supabase.from('transactions').update({ 
        status: 'PAID', 
        payment_method: 'SIMULATED_BY_ADMIN', 
        pakasir_order_id: `SIM-${orderId.substring(0,8).toUpperCase()}`,
        updated_at: settlementDate, 
        metadata: { ...metadata, is_simulated: true, settlement_date: settlementDate } 
    }).or(`id.eq."${orderId}",metadata->>parent_order_id.eq."${orderId}"`);

    const hasPendingBills = metadata.pendingBills && Array.isArray(metadata.pendingBills) && metadata.pendingBills.length > 0;
    
    if (order.product_type === 'survey') {
        await completeSurveyProcess(supabase, orderId, 'survey');
    } else if (hasPendingBills || metadata.is_bundled_parent) {
        await completeExtraBillProcess(supabase, orderId);
    } else if (['kost_booking', 'rent', 'kost', 'perpanjangan_sewa'].includes(order.product_type)) {
        await completeBookingProcess(supabase, orderId);
    }

    await sendSuccessEmail(orderId);
    res.status(200).send({ message: 'Simulation successful', orderId });
  } catch (err: any) {
    console.error("SIMULATE_SUCCESS_ERROR:", err);
    res.status(500).send({ message: 'Simulation failed: ' + err.message });
  }
});


/**
 * syncSurveyRequestsBackend: Synchronizes a survey transaction with the survey_requests table.
 * Handled entirely in the backend to ensure reliable multi-kost entries.
 */
async function syncSurveyRequestsBackend(supabase: any, order: any) {
  try {
    const orderId = order.id;
    const userId = order.user_id;
    const metadata = order.metadata || {};
    
    console.log(`SYNC_SURVEY_BACKEND: [DEBUG] Starting for Order ${orderId}`);

    const normalizePhone = (p: string) => {
      if (!p || p === '-') return '-';
      let clean = p.replace(/\D/g, '');
      if (clean.startsWith('0')) clean = clean.substring(1);
      if (clean.startsWith('62')) clean = clean.substring(2);
      return `+62${clean}`;
    };

    // Fetch ALL existing records for this transaction (bisa N records)
    const { data: existingRecords, error: fetchErr } = await supabase
      .from('survey_requests')
      .select('*')
      .eq('transaction_id', orderId);

    if (fetchErr) {
      console.error("SYNC_SURVEY_BACKEND: [ERROR] Failed to fetch existing survey requests", fetchErr);
      return;
    }

    // Sort existing records so they are index-aligned with the kostList order
    const sortedExisting = existingRecords 
      ? [...existingRecords].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      : [];

    const kostList: any[] = Array.isArray(metadata.kostList) && metadata.kostList.length > 0
      ? metadata.kostList
      : [{ // Fallback untuk order lama (1 kost)
          kostName: metadata.kostName || metadata.title || 'Kost Terdaftar',
          kostAddress: metadata.kostAddress || metadata.address || '-',
          ownerPhone: metadata.ownerPhone || metadata.owner_phone || '-',
        }];

    console.log(`SYNC_SURVEY_BACKEND: [DEBUG] Syncing ${kostList.length} kost(s) for order ${orderId}`);

    for (let i = 0; i < kostList.length; i++) {
      const kost = kostList[i];
      // Match based on index in sorted existing records
      const existing = sortedExisting[i] || null;

      const currentStatus = (existing?.status || 'AWAITING_PAYMENT').toUpperCase();
      let targetStatus = 'AWAITING_PAYMENT';
      if (order.status === 'PAID') {
        targetStatus = 'PENDING_ASSIGNMENT';
      } else if (existing && currentStatus !== 'AWAITING_PAYMENT') {
        targetStatus = existing.status;
      }

      const payload: any = {
        user_id: userId,
        transaction_id: orderId,
        status: targetStatus,
        kost_name: kost.kostName || `Kost #${i + 1}`,
        kost_address: kost.kostAddress || '-',
        owner_phone: normalizePhone(kost.ownerPhone || kost.owner_phone || ''),
        survey_date: metadata.surveyDate || existing?.survey_date || null,
        survey_time: metadata.surveyTime || existing?.survey_time || null,
        notes: `${metadata.notes || ''}\n[Sync]`.trim(),
        updated_at: new Date().toISOString(),
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
        console.log(`SYNC_SURVEY_BACKEND: [DEBUG] Updating kost #${i + 1} (ID: ${existing.id})`);
        const { error: updateErr } = await supabase
          .from('survey_requests')
          .update(payload)
          .eq('id', existing.id);
        if (updateErr) console.error(`SYNC_SURVEY_BACKEND: Update error for kost #${i + 1}:`, updateErr);
      } else {
        console.log(`SYNC_SURVEY_BACKEND: [DEBUG] Creating NEW record for kost #${i + 1}: ${kost.kostName}`);
        payload.created_at = order.created_at || new Date().toISOString();
        const { error: insertErr } = await supabase
          .from('survey_requests')
          .insert([payload]);
        if (insertErr) console.error(`SYNC_SURVEY_BACKEND: Insert error for kost #${i + 1}:`, insertErr);
      }
    }

    console.log(`SYNC_SURVEY_BACKEND: [SUCCESS] ${kostList.length} kost record(s) synchronized for order ${orderId}`);
  } catch (err) {
    console.error("SYNC_SURVEY_BACKEND_ERROR:", err);
  }
}

/**
 * completeSurveyProcess: Helper to move survey from AWAITING_PAYMENT to PENDING_ASSIGNMENT.
 * Creates Drive folder and updates status. Shared by webhook and simulation.
 */
async function completeSurveyProcess(supabase: any, orderId: string, productType: string) {
  if (productType !== 'survey') return;
  console.log(`COMPLETE_SURVEY: Starting for Order ${orderId}`);
  try {
    // 1. Ensure all survey requests for this transaction are in sync and marked appropriately
    const { data: order } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (order) {
      await syncSurveyRequestsBackend(supabase, order);
    }

    // 2. Fetch all survey requests for this transaction
    const { data: surveys, error: fetchErr } = await supabase
      .from('survey_requests')
      .select('id, kost_name, status, result_drive_link')
      .eq('transaction_id', orderId);

    if (fetchErr || !surveys || surveys.length === 0) {
      console.warn(`COMPLETE_SURVEY: No survey_requests found for transaction ${orderId}`);
      return;
    }

    console.log(`COMPLETE_SURVEY: Found ${surveys.length} survey_requests to process.`);

    const ROOT_FOLDER_ID = '1KS-uAMJZg7deddNCB4XxRrPpXsQjq1tk';
    const { createSurveyFolder } = require('./googleDriveUtils');

    for (const srvData of surveys) {
      try {
        if (srvData.result_drive_link) {
          console.log(`COMPLETE_SURVEY: Survey ${srvData.id} already has a Drive link. Skipping.`);
          continue;
        }

        if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(srvData.status?.toUpperCase())) {
          console.log(`COMPLETE_SURVEY: Survey ${srvData.id} is in final state (${srvData.status}). Skipping.`);
          continue;
        }

        const folderName = `Survey - ${srvData.kost_name || 'Kost'} - ${srvData.id.substring(0,8).toUpperCase()}`;
        console.log(`COMPLETE_SURVEY: Creating Drive folder: "${folderName}"`);
        
        const driveLink = await createSurveyFolder(folderName, ROOT_FOLDER_ID, {
          privateKey: googlePrivateKeyParam.value(),
          clientEmail: googleClientEmailParam.value()
        });

        await supabase
          .from('survey_requests')
          .update({ 
            status: 'PENDING_ASSIGNMENT', 
            result_drive_link: driveLink,
            updated_at: new Date().toISOString() 
          })
          .eq('id', srvData.id);
          
        console.log(`COMPLETE_SURVEY: Success for Survey ${srvData.id}. Drive: ${driveLink}`);
      } catch (itemErr) {
        console.error(`COMPLETE_SURVEY_ITEM_ERROR for Survey ${srvData.id}:`, itemErr);
        await supabase
          .from('survey_requests')
          .update({ status: 'PENDING_ASSIGNMENT' })
          .eq('id', srvData.id);
      }
    }
  } catch (err) {
    console.error("COMPLETE_SURVEY_ERROR:", err);
    await supabase
      .from('survey_requests')
      .update({ status: 'PENDING_ASSIGNMENT' })
      .eq('transaction_id', orderId);
  }
}

/**
 * completeBookingProcess: Handle side effects for kost booking success (notifications, etc).
 */
async function completeBookingProcess(supabase: any, orderId: string) {
  console.log(`COMPLETE_BOOKING: Starting for Order ${orderId}`);
  try {
    const { data: trx } = await supabase.from('transactions').select('user_id, product_id, metadata').eq('id', orderId).single();
    if (!trx) return;

    // Fetch Property Info
    const { data: prop } = await supabase.from('properties').select('title, owner_uid').eq('id', trx.product_id).single();
    
    // Notify Tenant
    await supabase.from('notifications').insert({
        user_id: trx.user_id,
        title: 'Pembayaran Kost Berhasil! ✨',
        message: `Pembayaran sewa untuk ${prop?.title || 'Kost'} telah berhasil diverifikasi. Selamat tinggal di hunian baru Anda!`,
        type: 'success',
        link: '/my-kost'
    });

    // Notify Owner (Mitra)
    if (prop?.owner_uid) {
        await supabase.from('notifications').insert({
            user_id: prop.owner_uid,
            title: 'Booking Kost Baru! 🏠',
            message: `Seorang penyewa telah melunasi pembayaran untuk ${prop.title}. Silakan cek dashboard Mitra Anda.`,
            type: 'assignment',
            link: '/mitra/tenants'
        });
    }
    // [FIX] Retroactively update the bill_name to be more specific if it was generic
    const initialName = trx.metadata?.bill_name || 'Sewa Kost';
    let prefix = 'Pembayaran Kost';
    if (trx.product_type === 'kost_booking') {
        prefix = 'Pembayaran Booking';
    } else if (['perpanjangan_sewa', 'rent', 'kost'].includes(trx.product_type)) {
        prefix = 'Perpanjangan Sewa';
    }

    const specificName = initialName.toLowerCase().includes('sewa')
        ? initialName.replace(/sewa\s+kost/i, prefix)
        : (initialName.startsWith(prefix) ? initialName : `${prefix}: ${initialName}`);
    
    await supabase.from('transactions').update({ 
        bill_name: specificName,
        metadata: { ...trx.metadata, bill_name: specificName }
    }).eq('id', orderId);

    console.log(`COMPLETE_BOOKING: Success for Order ${orderId}`);
  } catch (err) {
    console.error("COMPLETE_BOOKING_ERROR:", err);
  }
}

/**
 * createMidtransPayment: Generates a Midtrans Snap Token for secure payments.
 * Supports bundled payments (Rent + Facility) by splitting the transaction in Supabase while keeping one Midtrans bill.
 */
export const createMidtransPayment = functions.https.onRequest({ cors: true }, async (req, res) => {
  const { productId, productType, userId, metadata, item_details, existingOrderId } = req.body;
  
  // [SECURITY] Anti-Spam Validation
  const spamCheck = validateAntiSpam(req.body);
  if (!spamCheck.valid) {
      res.status(403).send({ message: spamCheck.message });
      return;
  }

  const reqAmount = Number(req.body.amount || 0);
  
  console.log(`MIDTRANS_CREATE: Start (Type: ${productType}, ID: ${productId}, User: ${userId}, Amount: ${reqAmount})`);

  if (!productId || !productType || !userId || !reqAmount) {
    res.status(400).send({ message: 'Missing required parameters' });
    return;
  }

  // [FIX] Hoist supabase + tracker di luar try agar bisa diakses di catch untuk cleanup zombie
  const supabase = getSupabase();
  if (!supabase) {
    res.status(500).send({ message: 'DB Error' });
    return;
  }
  let createdOrderId: string | null = null; // ID transaksi yang baru dibuat (bukan resume)

  try {
    // [FIX] Ambil profil lengkap untuk memenuhi syarat 'Risk Scanning' Midtrans Produksi
    // Gunakan field 'name' sesuai skema SQL, fallback ke 'full_name' jika ada variasi
    const { data: userProfile } = await supabase.from('users').select('email, name, phone, address').eq('id', userId).maybeSingle();
    
    const safeEmail = (userProfile?.email || metadata?.userEmail || 'customer@example.com').trim();
    const safePhone = (userProfile?.phone || metadata?.userPhone || '').trim();
    const safeAddress = (userProfile?.address || metadata?.userAddress || '').trim();
    
    const surveyId = metadata?.surveyId || null;

    let finalAmount = reqAmount;
    
    // Identify if the existingOrderId is a real UUID or a temporary string (e.g. KOST_BOOKING-123)
    const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");
    const finalOrderId = isUuid(existingOrderId) ? existingOrderId : null;

    // Logic for splitting bundled payments (e.g. Rent + Facility)
    const facilityAmount = Number(metadata?.facilityAmount || metadata?.composition?.facilityFee || 0);
    const hasSplit = facilityAmount > 0 && (productType === 'kost_booking' || productType === 'perpanjangan_sewa');
    const rentAmount = finalAmount - facilityAmount;

    const residentStatusId = (metadata?.resident_status_id && metadata.resident_status_id.length > 10) ? metadata.resident_status_id : null;

    // [FIX] Extract original_due_date from item_details so history shows simulated month, not real month
    const rentItemDetail = (metadata.item_details || []).find((i: any) => i.metadata?.isRent !== false && (i.metadata?.isRent || (i.name || '').toLowerCase().includes('sewa')));
    const facilityItemDetail = (metadata.item_details || []).find((i: any) => i.metadata?.isRent === false);
    const parentOriginalDueDate = rentItemDetail?.metadata?.original_due_date || metadata.simulated_date || null;
    const facilityOriginalDueDate = facilityItemDetail?.metadata?.original_due_date || metadata.simulated_date || null;

    let order;
    if (finalOrderId) {
      console.log(`MIDTRANS_CREATE: Updating existing bundle for Order ${finalOrderId}`);
      
      // 1. Update Parent Specifically (Amount & Full Metadata)
      // [FIX] Distinguish between split extension (visible) and batch payment (hidden)
      const isBatchParent = metadata.pendingBills && Array.isArray(metadata.pendingBills) && metadata.pendingBills.length > 1;
      const isSplitExtension = !!hasSplit;

      const { error: up1Error } = await supabase.from('transactions').update({ 
          amount: hasSplit ? rentAmount : finalAmount, 
          resident_status_id: residentStatusId,
          metadata: { 
              ...metadata, 
              surveyId, 
              is_bundled_parent: isBatchParent || isSplitExtension, 
              hidden_from_history: isBatchParent, // [FIX] ONLY hide if it's a batch summary. Extensions should be visible.
              isRent: ['perpanjangan_sewa', 'kost_booking', 'rent', 'kost'].includes(productType) || metadata.isRent === true,
              item_details: req.body.item_details || metadata?.item_details || undefined
          } 
      }).eq('id', finalOrderId);

      if (up1Error) {
          console.error("MIDTRANS_CREATE: Parent Update Error:", up1Error);
          throw new Error(`Gagal update transaksi induk: ${up1Error.message}`);
      }

      // 2. Sync Shared Status to BOTH Parent & Children safely
      const { error: up2Error } = await supabase.from('transactions').update({ 
          status: 'pending', 
          resident_status_id: residentStatusId,
          payment_method: req.body.paymentMethod || null
      }).or(`id.eq."${finalOrderId}",metadata->>parent_order_id.eq."${finalOrderId}"`);

      if (up2Error) {
          console.error("MIDTRANS_CREATE: Children Sync Error:", up2Error);
      }
      
      const { data: parentData } = await supabase.from('transactions').select('*').eq('id', finalOrderId).single();
      order = parentData;
    } else {
      console.log(`MIDTRANS_CREATE: Creating new transaction record for User ${userId}`);
      // [FIX] Use descriptive name passed from frontend, or fallback to generic by product type
      const rawBillName = metadata.bill_name || metadata.billName || '';

      // Determine prefix based on product type
      let prefix = 'Pembayaran Kost';
      if (productType === 'kost_booking') {
          prefix = 'Booking Kost';
      } else if (['perpanjangan_sewa', 'rent', 'kost'].includes(productType)) {
          prefix = 'Perpanjangan Sewa';
      } else if (productType === 'database') {
          prefix = 'Pembelian Database';
      } else if (productType === 'survey') {
          prefix = 'Jasa Survey';
      }

      // [FIX] Avoid double-prefix (e.g. "Pembelian Database: Pembayaran Kost" -> "Pembelian Database: Database Kost UMI")
      // If rawBillName is empty OR is a generic fallback, just use the prefix
      const GENERIC_NAMES = ['pembayaran kost', 'pembayaran', ''];
      const isGeneric = GENERIC_NAMES.includes(rawBillName.toLowerCase().trim());
      const parentBillName = isGeneric
        ? prefix
        : (rawBillName.toLowerCase().startsWith(prefix.toLowerCase()) ? rawBillName : `${prefix}: ${rawBillName}`);

        // [FIX] Distinguish between split extension (visible) and batch payment (hidden)
        const isBatchParent = metadata.pendingBills && Array.isArray(metadata.pendingBills) && metadata.pendingBills.length > 1;
        const isSplitExtension = !!hasSplit;

        const { data: inserted, error: insError } = await supabase.from('transactions').insert({ 
            user_id: userId, 
            product_id: productId, 
            product_type: productType, 
            amount: hasSplit ? rentAmount : finalAmount, 
            bill_name: parentBillName, 
            payment_method: req.body.paymentMethod || null,
            resident_status_id: residentStatusId,
            metadata: { 
                ...metadata, 
                bill_name: parentBillName, 
                surveyId, 
                is_bundled_parent: isBatchParent || isSplitExtension,
                hidden_from_history: isBatchParent, // [FIX] ONLY hide if it's a batch summary.
                isRent: ['perpanjangan_sewa', 'kost_booking', 'rent', 'kost'].includes(productType) || metadata.isRent === true,
                original_due_date: parentOriginalDueDate 
            }, 
            status: 'pending' 
        }).select('*').single();

      if (insError) {
          console.error("MIDTRANS_CREATE: Insert Error:", insError);
          throw new Error(`Gagal membuat record transaksi: ${insError.message}`);
      }
      order = inserted;
      createdOrderId = inserted?.id ?? null; // [FIX] Lacak ID baru untuk cleanup jika Midtrans gagal
    }

    if (!order) throw new Error('Failed to create order record');

    // Create child transaction for facility if bundled
    if (hasSplit) {
      const parentName = order.bill_name || ''; // Use the already processed parent name from the record
      const facilityName = metadata.additional_fee_name || 'Fasilitas';
      
      // [FIX] Ensure the month in facility matches the parent (e.g. "Sewa Kost Juni" -> "Fasilitas Juni")
      // Extract month part from parentName if it exists
      const monthMatch = parentName.match(/(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}/i);
      const periodSuffix = monthMatch ? ` ${monthMatch[0]}` : "";
      const childBillName = `Tagihan ${facilityName}${periodSuffix}`;

      // [FIX] If there's an existing facility bill ID, update it instead of inserting a new one
      const existingFacId = metadata?.existing_facility_id;
      
      const childPayload = {
          status: 'pending',
          bill_name: `Fasilitas: ${childBillName}`, // [FORCE] Very distinct name
          resident_status_id: residentStatusId,
          payment_method: req.body.paymentMethod || null,
          metadata: { 
              ...metadata, 
              bill_name: `Fasilitas: ${childBillName}`,
              parent_order_id: order.id, 
              is_bundled: true, 
              isRent: false,
              original_due_date: facilityOriginalDueDate // [FIX] Use simulated date for history display
          } 
      };

      if (existingFacId) {
          console.log(`MIDTRANS_CREATE: Linking existing facility bill ${existingFacId} to parent ${order.id}`);
          const { error: childError } = await supabase.from('transactions').update(childPayload).eq('id', existingFacId);
          if (childError) {
              console.error("MIDTRANS_CREATE: Child Update Error:", childError);
          }
      } else {
          const { error: childError } = await supabase.from('transactions').insert({ 
              ...childPayload,
              user_id: userId, 
              product_id: productId, 
              product_type: 'tagihan_ekstra', 
              amount: facilityAmount
          });
          if (childError) {
              console.error("MIDTRANS_CREATE: Child Insert Error:", childError);
          }
      }
    }

    const midtransOrderId = `${order.id}-${Date.now().toString().slice(-6)}`;
    
    // [FIX] Sanitasi item_details sebelum dikirim ke Midtrans:
    let roundedItemDetails: any[] | null = null;
    if (item_details && Array.isArray(item_details)) {
        roundedItemDetails = item_details.map((item: any) => ({
            id: String(item.id || 'item').substring(0, 50),
            price: Math.round(Number(item.price || 0)),
            quantity: Number(item.quantity || 1),
            name: String(item.name || 'Item Pembayaran').substring(0, 50),
        }));
    }

    const finalGrossAmount = roundedItemDetails 
        ? roundedItemDetails.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        : Math.round(finalAmount);

    // [FIX] Professional human-readable names for Midtrans item_details
    let productDisplayName = productType;
    if (productType === 'database') productDisplayName = 'Pembelian Database Kost';
    else if (productType === 'survey') productDisplayName = 'Jasa Survey Lokasi';
    else if (productType === 'kost_booking') productDisplayName = 'Booking Kost / DP';
    else if (['perpanjangan_sewa', 'rent', 'kost'].includes(productType)) productDisplayName = 'Perpanjangan Sewa Kost';

    const parameter: any = {
      transaction_details: { order_id: midtransOrderId, gross_amount: finalGrossAmount },
      customer_details: { 
          first_name: 'Pelanggan', 
          email: safeEmail,
          phone: safePhone,
          billing_address: {
              first_name: 'Pelanggan',
              email: safeEmail,
              phone: safePhone,
              address: safeAddress || 'Indonesia'
          },
          shipping_address: {
              first_name: 'Pelanggan',
              email: safeEmail,
              phone: safePhone,
              address: safeAddress || 'Indonesia'
          }
      },
      item_details: roundedItemDetails || [{ id: productId, price: Math.round(finalAmount), quantity: 1, name: productDisplayName }],
      metadata: { ...metadata, surveyId }
    };

    let responseData: any = {};
    const method = req.body.paymentMethod;

    if (method) {
        console.log(`MIDTRANS_CREATE: Direct Charge for method ${method}`);
        // 1. VIRTUAL ACCOUNT (Standard)
        if (['bni_va', 'bri_va', 'permata_va', 'bsi_va', 'cimb_va'].includes(method)) {
            parameter.payment_type = 'bank_transfer';
            parameter.bank_transfer = { bank: method.split('_')[0] };
        } 
        // 2. BCA VA
        else if (method === 'bca_va') {
            parameter.payment_type = 'bank_transfer';
            parameter.bank_transfer = { bank: 'bca' };
        }
        // 4. MANDIRI (echannel)
        else if (method === 'mandiri_va') {
            parameter.payment_type = 'echannel';
            parameter.echannel = { 
                bill_info1: "Payment", 
                bill_info2: "Booking" 
            };
        } 
        // 5. GOPAY (Direct Charge with Deeplink)
        else if (method === 'gopay') {
            parameter.payment_type = 'gopay';
            parameter.gopay = { enable_callback: true, callback_url: `https://ruangsinggah.id/payment-status/${order.id}` };
        }
        // 5b. QRIS / OVO
        else if (['qris', 'ovo'].includes(method)) {
            parameter.payment_type = 'qris';
            parameter.qris = { };
        }
        // 5c. DANA (Force Snap for Direct Redirect/Deeplink behavior)
        else if (method === 'dana') {
            console.log("MIDTRANS_CREATE: DANA requested, using Snap redirect flow");
            parameter.enabled_payments = ['dana'];
            // Inject callbacks.finish so Midtrans redirects back with real UUID (not {order_id} template)
            (parameter as any).callbacks = { finish: `https://ruangsinggah.id/payment-status/${order.id}` };
        }
        // 6. SHOPEEPAY
        else if (method === 'shopeepay') {
            parameter.payment_type = 'shopeepay';
            parameter.shopeepay = { callback_url: `https://ruangsinggah.id/payment-status/${order.id}` };
        }
        // 6. CONVENIENCE STORE (Alfamart, Indomaret)
        else if (['alfamart', 'indomaret'].includes(method)) {
            parameter.payment_type = 'cstore';
            parameter.cstore = { 
                store: method, 
                message: `Pembayaran ${order.bill_name || 'RS Kost'}`.substring(0, 45) 
            };
        } 
        // 7. PAYLATER (Akulaku, Kredivo)
        else if (['akulaku', 'kredivo'].includes(method)) {
            parameter.payment_type = method;
        } 
        // 8. CREDIT CARD (Always fallback to Snap for 3DS security)
        else if (['credit_card', 'mastercard', 'jcb', 'amex'].includes(method)) {
            console.log(`MIDTRANS_CREATE: Method CC requested, forcing Snap for 3DS security`);
            delete parameter.payment_type;
        } 
        else {
            console.log(`MIDTRANS_CREATE: Method ${method} fallback to Snap`);
        }
    }

    if (parameter.payment_type) {
        // Direct Charge via Core API with fallback
        try {
            console.log("MIDTRANS_CREATE: Final Parameter for Core API:", JSON.stringify(parameter, null, 2));
            const transaction = await getMidtransCoreApi().charge(parameter);
            console.log("MIDTRANS_CREATE: Core API Success Response:", JSON.stringify(transaction, null, 2));
            
            // [ROBUST] Extract VA/Payment Number on server-side to simplify frontend
            const vaNumber = transaction.va_numbers?.[0]?.va_number || 
                             transaction.bill_key || 
                             transaction.permata_va_number || 
                             transaction.payment_code || 
                             transaction.payment_number;

            responseData = {
                directPayment: transaction,
                paymentNumber: vaNumber, // [NEW] Explicit flattened payment number
                orderId: order.id,
                order: order, // [NEW] Return full order object for frontend state sync
                midtransOrderId: midtransOrderId
            };
        } catch (coreErr: any) {
            // DETAILED LOGGING FOR DEBUGGING PRODUCTION
            const errorBody = coreErr.ApiResponse || coreErr.body || coreErr;
            console.error("MIDTRANS_CORE_FAILURE_DETAIL:", JSON.stringify(errorBody, null, 2));
            
            if (errorBody?.status_code === "402") {
                console.warn("MIDTRANS_CREATE: Account is likely SNAP-ONLY. Forcing Snap fallback.");
            }
            
            console.warn(`MIDTRANS_CREATE: Core API Failed (${coreErr.message}). Falling back to Snap...`);
            
            // --- CLEANUP PARAMETERS FOR SNAP SUCCESS ---
            // Remove specific payment types to allow Snap to show whatever is active
            const snapParameter = { ...parameter };
            
            // MAP UI METHOD TO MIDTRANS ENABLE_PAYMENTS
            let enabledPayments: string[] = [];
            if (method === 'mandiri_va') enabledPayments = ['echannel'];
            else if (method.includes('_va')) enabledPayments = [method.replace('_va', '_va')];
            else if (method === 'gopay') enabledPayments = ['gopay'];
            else if (method === 'dana') enabledPayments = ['dana'];
            else if (method === 'qris') enabledPayments = ['qris'];
            else if (method === 'shopeepay') enabledPayments = ['shopeepay'];
            else if (['alfamart', 'indomaret'].includes(method)) enabledPayments = [method];
            
            if (enabledPayments.length > 0) {
                console.log("MIDTRANS_SNAP: Forcing specific payment method for integration:", enabledPayments);
                (snapParameter as any).enabled_payments = enabledPayments;
            }

            // Ensure Snap fallback also has finish callback with real UUID
            if (!(snapParameter as any).callbacks) {
                (snapParameter as any).callbacks = { finish: `https://ruangsinggah.id/payment-status/${order.id}` };
            }
            const transaction = await getMidtransSnap().createTransaction(snapParameter);
            responseData = {
                token: transaction.token,
                redirect_url: transaction.redirect_url,
                orderId: order.id,
                order: order, // [NEW] Return full order object
                midtransOrderId: midtransOrderId
            };
        }
    } else {
        console.log(`MIDTRANS_CREATE: Requesting Snap Token for ${midtransOrderId}`);
        // Inject callbacks.finish with real UUID so redirect always resolves correctly
        if (!(parameter as any).callbacks) {
            (parameter as any).callbacks = { finish: `https://ruangsinggah.id/payment-status/${order.id}` };
        }
        const transaction = await getMidtransSnap().createTransaction(parameter);
        responseData = {
            token: transaction.token,
            redirect_url: transaction.redirect_url,
            orderId: order.id,
            order: order, // [NEW] Return full order object
            midtransOrderId: midtransOrderId
        };
    }
    
    console.log(`MIDTRANS_CREATE: Finalizing metadata sync for ${order.id}`);
    
    // 1. Update Parent Specifically (Full Metadata with Snap Token / Direct Result)
    await supabase.from('transactions').update({ 
        metadata: { 
            ...order.metadata, 
            snap_token: responseData.token || null,
            midtrans_charge_response: responseData.directPayment || null,
            payment_number: responseData.paymentNumber || null,
            payment_method: method || null,
            midtrans_order_id: midtransOrderId
        } 
    }).eq('id', order.id);

    // 2. Sync Shared Links to BOTH Parent & Children safely
    await supabase.from('transactions').update({ 
        pakasir_link: responseData.redirect_url || null, 
        pakasir_order_id: midtransOrderId,
        payment_method: method || null
    }).or(`id.eq."${order.id}",metadata->>parent_order_id.eq."${order.id}"`);

    res.status(200).send(responseData);
  } catch (err: any) {
    console.error("MIDTRANS_CREATE_ERROR:", err);

    // [FIX] Cleanup zombie transactions: jika ini adalah order BARU (bukan resume) dan Midtrans gagal,
    // tandai sebagai 'failed' agar TIDAK muncul sebagai "Tagihan Aktif" di dashboard penyewa.
    if (createdOrderId) {
      try {
        console.log(`MIDTRANS_CREATE: Cleaning up zombie transaction ${createdOrderId} → status: failed`);
        await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .or(`id.eq."${createdOrderId}",metadata->>'parent_order_id'.eq."${createdOrderId}"`);
      } catch (cleanupErr) {
        console.error('MIDTRANS_CREATE: Cleanup error (non-critical):', cleanupErr);
      }
    }

    res.status(500).send({ message: err.message });
  }
});

/**
 * midtransWebhook: Receives payment status updates from Midtrans.
 */
export const midtransWebhook = functions.https.onRequest(async (req, res) => {
  const data = req.body;
  const transaction_status = data.transaction_status;
  const fraud_status = data.fraud_status;
  const midtrans_order_id = data.order_id;
  
  console.log(`MIDTRANS_WEBHOOK: Received for Full ID: ${midtrans_order_id}, Status: ${transaction_status}`);

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('DB Error');

    // [SMART FIX] UUID-Safe extraction:
    // 1. Try to find the order with the full ID first
    let { data: order } = await supabase.from('transactions').select('*').eq('id', midtrans_order_id).single();
    let order_id = midtrans_order_id;

    // 2. If not found, try searching by pakasir_order_id (fallback for custom IDs)
    if (!order) {
        console.log(`MIDTRANS_WEBHOOK: ID ${midtrans_order_id} not found as Primary Key, trying fallback search...`);
        const { data: fallbackOrder } = await supabase.from('transactions').select('*').eq('pakasir_order_id', midtrans_order_id).single();
        if (fallbackOrder) {
            order = fallbackOrder;
            order_id = fallbackOrder.id;
        }
    }

    // 3. If still not found, try to strip the suffix (case for midtransOrderId = uuid + timestamp)
    if (!order) {
        // Standard UUID is 36 chars. If longer, it likely has our suffix.
        if (midtrans_order_id.length > 36) {
            const truncatedId = midtrans_order_id.substring(0, 36);
            console.log(`MIDTRANS_WEBHOOK: Fallback failed, trying UUID-truncated ID: ${truncatedId}`);
            const { data: truncatedOrder } = await supabase.from('transactions').select('*').eq('id', truncatedId).single();
            if (truncatedOrder) {
                order = truncatedOrder;
                order_id = truncatedId;
            }
        }
        
        // Final fallback: search for anything where midtrans_order_id starts with the record's ID
        // (This handles non-UUID or custom format suffixes)
        if (!order && midtrans_order_id.includes('-')) {
             const lastHyphenIndex = midtrans_order_id.lastIndexOf('-');
             const altTruncatedId = midtrans_order_id.substring(0, lastHyphenIndex);
             console.log(`MIDTRANS_WEBHOOK: Final attempt with alt truncation: ${altTruncatedId}`);
             const { data: altOrder } = await supabase.from('transactions').select('*').eq('id', altTruncatedId).single();
             if (altOrder) {
                 order = altOrder;
                 order_id = altOrder.id;
             }
        }
    }

    if (!order) { 
        console.error(`MIDTRANS_WEBHOOK: Order ${midtrans_order_id} NOT FOUND in database after all fallback attempts.`);
        res.status(200).send('OK'); 
        return; 
    }

    const isSuccess = (transaction_status === 'capture' && fraud_status === 'accept') || transaction_status === 'settlement';
    
    // [COMPREHENSIVE FIX] Always update payment metadata regardless of status to ensure data integrity
    console.log(`MIDTRANS_WEBHOOK: Processing Order ${order_id} (Status: ${transaction_status}, Method: ${data.payment_type})`);
    
    const metadata = order.metadata || {};
    const currentSimDate = metadata.simulated_date ? new Date(metadata.simulated_date).toISOString() : new Date().toISOString();

    // 1. Initial Metadata Update (Methods & Order IDs)
    await supabase.from('transactions').update({ 
        payment_method: data.payment_type || 'MIDTRANS_WEBHOOK', 
        pakasir_order_id: data.transaction_id,
        updated_at: currentSimDate
    }).eq('id', order_id);

    if (isSuccess) {
      console.log(`MIDTRANS_WEBHOOK: SUCCESS detected for Order ${order_id}.`);
      const settlementDate = metadata.simulated_date ? new Date(metadata.simulated_date).toISOString() : new Date().toISOString();
      
      // 2. [ROBUST UPDATE] Set PAID status for Parent first
      const { error: parentUpdateError } = await supabase.from('transactions').update({ 
          status: 'PAID', 
          payment_method: data.payment_type,
          pakasir_order_id: data.transaction_id,
          updated_at: settlementDate,
          metadata: { ...metadata, settlement_date: settlementDate }
      }).eq('id', order_id);

      if (parentUpdateError) {
          console.error(`MIDTRANS_WEBHOOK: CRITICAL - Failed to mark parent ${order_id} as PAID:`, parentUpdateError);
      } else {
          console.log(`MIDTRANS_WEBHOOK: Parent ${order_id} marked as PAID successfully.`);
      }

      // 3. Update Children (Bundled) if any
      await supabase.from('transactions').update({ 
          status: 'PAID', 
          payment_method: data.payment_type,
          pakasir_order_id: data.transaction_id,
          updated_at: settlementDate
      }).eq('metadata->>parent_order_id', order_id);
      
      // 4. [SAFETY WRAPPER] Run fulfillment logic once
      if (order.status !== 'PAID') {
          console.log(`MIDTRANS_WEBHOOK: Starting fulfillment sequence for ${order_id}`);
          try {
              const hasPendingBills = metadata.pendingBills && Array.isArray(metadata.pendingBills) && metadata.pendingBills.length > 0;
              const isRentRelated = ['kost_booking', 'rent', 'kost', 'perpanjangan_sewa'].includes(order.product_type);
              
              let residentIdForChildren = null;
              
              // A. Sync Resident Status
              if (isRentRelated) {
                  try {
                      residentIdForChildren = await syncResidentStatus(order_id);
                      if (residentIdForChildren) {
                          console.log(`MIDTRANS_WEBHOOK: Resident sync successful (${residentIdForChildren})`);
                          // Minor delay then sync ID to all related records
                          await new Promise(resolve => setTimeout(resolve, 500));
                          await supabase.from('transactions').update({ 
                              resident_status_id: residentIdForChildren 
                          }).or(`id.eq."${order_id}",metadata->>parent_order_id.eq."${order_id}"`);
                      }
                  } catch (resErr) {
                      console.error(`MIDTRANS_WEBHOOK: Non-blocking Resident Sync Error:`, resErr);
                  }
              }

              // B. Process Specific Product Types
              if (order.product_type === 'survey') {
                  await completeSurveyProcess(supabase, order_id, 'survey');
              } else if (hasPendingBills || metadata.is_bundled_parent) {
                  await completeExtraBillProcess(supabase, order_id, residentIdForChildren);
              } else if (isRentRelated) {
                  await completeBookingProcess(supabase, order_id);
              }
              
              // C. Send Success Email
              try {
                  await sendSuccessEmail(order_id);
              } catch (mailErr) {
                  console.error(`MIDTRANS_WEBHOOK: Non-blocking Email Error:`, mailErr);
              }

          } catch (fulfillErr) {
              console.error(`MIDTRANS_WEBHOOK: Fulfillment Logic Error (Order ${order_id}):`, fulfillErr);
              // We DON'T fail the whole webhook here because the status is already updated to PAID in step 2.
          }
      }
    } else if (['expire', 'cancel', 'deny'].includes(transaction_status)) {
        console.log(`MIDTRANS_WEBHOOK: Transaction ${order_id} failed with status: ${transaction_status}`);
        await supabase.from('transactions').update({ status: 'CANCELLED' }).eq('id', order_id);
    }

    res.status(200).send('OK');
  } catch (err: any) {
    console.error("MIDTRANS_WEBHOOK_ERROR:", err);
    res.status(500).send('Error');
  }
});

/**
 * completeExtraBillProcess: Handles fulfillment for bundled or virtual bill payments.
 * Crucially handles lease extension logic and child transaction splitting.
 */
async function completeExtraBillProcess(supabase: any, orderId: string, overrideResidentId?: string | null) {
  console.log(`COMPLETE_EXTRA: Starting for Parent Order ${orderId} (Override ResID: ${overrideResidentId})`);
  try {
    const { data: parentTrx } = await supabase.from('transactions').select('*').eq('id', orderId).single();
    if (!parentTrx) return;

    const metadata = parentTrx.metadata || {};
    const pendingBills = metadata.pendingBills || [];
    const settlementDateStr = parentTrx.updated_at || new Date().toISOString();

    let totalMasaSewaHari = 0;
    const pBillName = (parentTrx.bill_name || parentTrx.billName || '').toLowerCase();
    const pIsRent = parentTrx.product_type === 'perpanjangan_sewa' || parentTrx.product_type === 'kost_booking' || (parentTrx.metadata?.isRent === true) || (pBillName.includes('sewa') && !pBillName.includes('fasilitas'));

    if (pIsRent && (pendingBills.length <= 1 || metadata.is_bundled_parent)) {
      totalMasaSewaHari = Number(parentTrx.masa_sewa_hari || parentTrx.metadata?.masa_sewa_hari || 0);
      if (totalMasaSewaHari === 0 && metadata.extensionPeriod) {
          totalMasaSewaHari = Number(metadata.extensionPeriod) * 30;
      }
    }

    // [FIX] Explicitly handle existing facility bill if ID was provided in metadata
    if (metadata.existing_facility_id) {
        console.log(`COMPLETE_EXTRA: Explicitly marking existing facility bill ${metadata.existing_facility_id} as PAID`);
        await supabase.from('transactions').update({ 
            status: 'PAID', 
            resident_status_id: overrideResidentId || parentTrx.resident_status_id,
            updated_at: settlementDateStr,
            metadata: { 
                ...(metadata.facility_bill_metadata || {}), // If we preserved original metadata
                settlement_date: settlementDateStr,
                is_bundled_child: true,
                parent_order_id: orderId
            }
        }).eq('id', metadata.existing_facility_id);
    }

    // Process Child Transactions (Split logic)
    if (pendingBills.length > 1) {
      console.log(`COMPLETE_EXTRA: Processing ${pendingBills.length} items in bundle`);
      for (const bill of pendingBills) {
        const isR = !!bill.isRent || (bill.bill_name || '').toLowerCase().includes('sewa');
        const isVirtual = String(bill.id || '').startsWith('v-');

        // [FIX] Skip ALL virtual bills if parent is bundled.
        // Reason: real child transactions were already created by createMidtransPayment.
        // Inserting virtual bills here would cause duplicates (Triple Transactions).
        if (metadata.is_bundled_parent && isVirtual) {
            console.log(`COMPLETE_EXTRA: Skipping virtual bill ${bill.id} (bundled parent already handled split).`);
            continue;
        }

        // [CRITICAL] Only insert if it's a VIRTUAL bill (from "Lihat Tagihan" menu).
        if (!isVirtual) {
            console.log(`COMPLETE_EXTRA: Updating existing bill ${bill.id} with ResID ${overrideResidentId} and specific name`);
            
            // [FIX] Retroactively update the bill_name if it was generically inherited from parent
            const currentBillName = bill.bill_name || (parentTrx.bill_name || 'Sewa Kost');
            const facilitySpecificName = currentBillName.toLowerCase().includes('sewa')
                ? currentBillName.replace(/sewa\s+kost/i, 'Tagihan Fasilitas')
                : currentBillName;

            const updatePayload: any = { 
                status: 'PAID', // [FIX] Ensure arrears bill becomes PAID
                bill_name: facilitySpecificName,
                updated_at: settlementDateStr, // [FIX] Use simulated time for consistency
                metadata: { 
                    ...bill, 
                    bill_name: facilitySpecificName,
                    settlement_date: settlementDateStr,
                    simulated_date: metadata.simulated_date // [FIX] Pass simulator date down
                }
            };
            if (overrideResidentId || parentTrx.resident_status_id) {
                updatePayload.resident_status_id = overrideResidentId || parentTrx.resident_status_id;
            }

            await supabase.from('transactions').update(updatePayload).eq('id', bill.id);
            continue;
        }


        let childBillName = bill.bill_name || (isR ? 'Sewa Kost' : 'Tagihan Fasilitas');
        
        // If it's NOT rent but the name contains "Sewa", force replace it
        if (!isR && childBillName.toLowerCase().includes('sewa')) {
            childBillName = childBillName.replace(/sewa\s+kost/i, 'Tagihan Fasilitas');
        }

        const childPayload = {
          user_id: parentTrx.user_id,
          product_id: parentTrx.product_id,
          product_type: isR ? parentTrx.product_type : 'tagihan_ekstra',
          amount: bill.total || bill.amount || 0,
          status: 'PAID',
          bill_name: childBillName,
          payment_method: parentTrx.payment_method,
          pakasir_order_id: parentTrx.pakasir_order_id,
          pakasir_link: parentTrx.pakasir_link,
          resident_status_id: overrideResidentId || parentTrx.resident_status_id,
          metadata: { 
              ...bill, 
              bill_name: childBillName,
              parent_order_id: orderId, 
              is_batch_split_child: true, 
              settlement_date: settlementDateStr, 
              isRent: isR, 
              simulated_date: metadata.simulated_date 
          },
          updated_at: settlementDateStr
        };
        await supabase.from('transactions').insert(childPayload);
        
        if (isR) {
          totalMasaSewaHari += (Number(bill.masa_sewa_hari) > 0 ? Number(bill.masa_sewa_hari) : 30);
        }
      }
    }

    // Note: syncResidentStatus is now called earlier in the webhook flow for better ID propagation
    console.log(`COMPLETE_EXTRA: Success for ${orderId}`);
  } catch (err) {
    console.error("COMPLETE_EXTRA_ERROR:", err);
  }
}

/**
 * validateAntiSpam: A server-side guard against bot attacks and spam.
 * Prevents long strings, external links in names, and crypto-scam keywords.
 */
function validateAntiSpam(data: any): { valid: boolean; message?: string } {
    const blacklistedKeywords = [
        'bitcoin', 'donate', 'paypal', 'wallet', 'click here', 
        'sum is appreciated', 'hosting and bandwidth', 'small sum'
    ];
    
    // Check all string values in the object recursively
    const values = JSON.stringify(data).toLowerCase();
    
    // 1. Check for blacklisted keywords
    for (const keyword of blacklistedKeywords) {
        if (values.includes(keyword)) {
            console.warn(`CF_SECURITY: Blocked request containing keyword: "${keyword}"`);
            return { valid: false, message: 'Konten tidak diizinkan (Security Block)' };
        }
    }

    // 2. Specific field validations
    if (data.metadata?.userName && data.metadata.userName.length > 100) return { valid: false, message: 'Nama terlalu panjang' };
    if (data.metadata?.userEmail && data.metadata.userEmail.length > 100) return { valid: false, message: 'Email tidak valid' };
    
    // 3. Prevent URLs in Name
    if (data.metadata?.userName && (data.metadata.userName.includes('http') || data.metadata.userName.includes('www.'))) {
        return { valid: false, message: 'Nama tidak boleh mengandung tautan' };
    }

    return { valid: true };
}

/**
 * syncResidentStatus: The single source of truth for updating lease dates and status.
 */
export async function syncResidentStatus(trxId: string, options: { overrideMasaSewaHari?: number, isManualExtension?: boolean } = {}) {
  console.log(`SYNC_RESIDENT: Starting for Transaction ${trxId}`);
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { data: trx } = await supabase.from('transactions').select('*').eq('id', trxId).single();
    if (!trx || trx.status !== 'PAID') {
        console.warn(`SYNC_RESIDENT: Transaction ${trxId} not eligible (not found or not PAID)`);
        return;
    }

    if (trx.metadata?.is_lease_synced === true) {
        console.log(`SYNC_RESIDENT: Transaction ${trxId} already synced. Skipping.`);
        return;
    }

    const metadata = trx.metadata || {};
    const bName = (trx.bill_name || metadata.bill_name || '').toLowerCase();
    const isRentRelated = ['rent', 'kost_booking', 'kost', 'perpanjangan_sewa'].includes(trx.product_type) || metadata.isRent === true || (bName.includes('sewa') && !bName.includes('fasilitas'));
    
    if (!isRentRelated) {
        console.log(`SYNC_RESIDENT: Transaction ${trxId} is not rent-related. Skipping sync.`);
        return;
    }

    let resId = trx.resident_status_id || metadata.resident_status_id;
    let resident: any = null;

    if (resId) {
        const { data } = await supabase.from('resident_status').select('*').eq('id', resId).single();
        resident = data;
    }

    // [UPSERT LOGIC] If no resident record found, try searching by user_id and product_id
    if (!resident) {
        console.log(`SYNC_RESIDENT: Searching for existing record for User ${trx.user_id} at Kost ${trx.product_id}`);
        const { data: existing } = await supabase.from('resident_status')
            .select('*')
            .eq('user_id', trx.user_id)
            .eq('kost_id', trx.product_id)
            .maybeSingle();
        
        if (existing) {
            resident = existing;
            resId = existing.id;
            console.log(`SYNC_RESIDENT: Found existing resident record ${resId}`);
        }
    }

    let newEnd: Date;
    let startDate: string;

    if (resident) {
        newEnd = new Date(resident.endDate || resident.end_date || new Date());
        startDate = resident.start_date || resident.startDate || new Date().toISOString().split('T')[0];
    } else {
        // [CREATE NEW] For first-time bookings
        console.log(`SYNC_RESIDENT: Creating new resident status for first-time booking.`);
        startDate = metadata.startDate || metadata.move_in_date || new Date().toISOString().split('T')[0];
        newEnd = new Date(startDate);
    }

    const isManualExt = options.isManualExtension || metadata.isManualExtension;
    const now = new Date(metadata.simulated_date || new Date());

    // [FIX v2] LEASE JUMP LOGIC: Jika masa sewa sudah expired, mulai perpanjangan dari hari ini (simulated_date).
    // Tidak lagi melompat ke "awal bulan" dari nama tagihan, karena ini menyebabkan hari bonus
    // (misal: lompat ke 1 Juli + 90 hari = 29 Sept, padahal hari ini 17 Juni = 104 hari tersisa, bukan 90).
    if (isManualExt && newEnd < now) {
        console.log(`SYNC_RESIDENT: Lease expired (end: ${newEnd.toISOString().split('T')[0]}, now: ${now.toISOString().split('T')[0]}). Starting extension from today.`);
        newEnd = new Date(now);
    }

    // CALCULATE DURATION
    const masaSewaHari = options.overrideMasaSewaHari || Number(metadata.masa_sewa_hari || 0);
    const durationMonths = Number(metadata.extensionPeriod || 0);
    
    if (masaSewaHari > 0) {
      newEnd.setDate(newEnd.getDate() + masaSewaHari);
    } else if (durationMonths > 0) {
      newEnd.setMonth(newEnd.getMonth() + durationMonths);
    } else {
      newEnd.setDate(newEnd.getDate() + 30);
    }

    // [FIX] Calculate total_months from start_date to new end_date
    const startDateObj = new Date(startDate);
    const totalMonthsCalc = (newEnd.getFullYear() - startDateObj.getFullYear()) * 12 + (newEnd.getMonth() - startDateObj.getMonth());

    // [FIX] Build metadata to persist pricing and composition info.
    // IMPORTANT: basePrice must be PER-MONTH (divide total by extensionPeriod).
    // IMPORTANT: do NOT overwrite 'period' with extension duration — period is the kost's billing cycle.
    const extPeriodCount = Number(metadata.extensionPeriod || 1);
    const rawBaseRent = Number(metadata.composition?.baseRent || metadata.basePrice || 0);
    const rawExtraFee = Number(metadata.composition?.extraPersonFee || metadata.extraPersonFee || 0);
    const residentMeta = {
      ...(resident?.metadata && typeof resident.metadata === 'object' ? resident.metadata : {}),
      roomType: trx.room_type || metadata.roomType || metadata.variantName || resident?.room_type || '-',
      // Divide by extensionPeriod to get per-month base price (composition stores TOTAL for N months)
      basePrice: rawBaseRent > 0 ? Math.round(rawBaseRent / extPeriodCount) : (resident?.metadata?.basePrice || 0),
      extraPersonFee: rawExtraFee > 0 ? Math.round(rawExtraFee / extPeriodCount) : (resident?.metadata?.extraPersonFee || 0),
      facilityFee: metadata.composition?.facilityFee || metadata.facilityFee || resident?.metadata?.facilityFee || 0,
      // [FIX] Do NOT store extension duration as period. Preserve kost billing cycle.
      // period is intentionally NOT set here — it comes from the kost listing, not the extension.
      last_payment_simulated_date: metadata.simulated_date || null,
    };

    const payload = {
      user_id: trx.user_id,
      kost_id: trx.product_id,
      start_date: startDate,
      end_date: newEnd.toISOString().split('T')[0],
      total_months: Math.max(totalMonthsCalc, 1),
      last_transaction_id: trxId,
      status: 'ACTIVE',
      updated_at: metadata.simulated_date ? new Date(metadata.simulated_date).toISOString() : new Date().toISOString(),
      room_type: trx.room_type || metadata.roomType || metadata.variantName || (resident?.room_type || '-'),
      metadata: residentMeta
    };


    let syncError: any = null;
    let finalResId = resId;

    if (resident) {
        console.log(`SYNC_RESIDENT: Updating existing resident status ${resId}`);
        const { error } = await supabase.from('resident_status').update(payload).eq('id', resId);
        syncError = error;
    } else {
        console.log(`SYNC_RESIDENT: Inserting new resident record for User ${trx.user_id}`);
        const { data: inserted, error } = await supabase.from('resident_status').insert([payload]).select().single();
        syncError = error;
        if (inserted) {
            finalResId = inserted.id;
            console.log(`SYNC_RESIDENT: Successfully created Resident Status with ID ${finalResId}`);
        }
    }

    if (syncError) throw syncError;

    // [PROPAGATE ID] Update all related transactions with the resident_status_id
    const parentOrderId = metadata.parent_order_id || trx.id;
    const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const finalOrderId = isUuid(parentOrderId) ? parentOrderId : null;
    
    console.log(`SYNC_RESIDENT: Propagating Resident ID ${finalResId} to Parent ${finalOrderId} and its children.`);
    
    // 1. Update the parent specifically by ID
    if (finalOrderId) {
        const { error: pErr } = await supabase.from('transactions').update({ resident_status_id: finalResId }).eq('id', finalOrderId);
        if (pErr) console.error(`SYNC_RESIDENT: Failed to update parent ${finalOrderId}:`, pErr);
    }
    
    // 2. Fetch all children to ensure we have their exact IDs
    console.log(`SYNC_RESIDENT: Searching for children with parent_order_id: ${parentOrderId}`);
    const { data: children, error: cFetchErr } = await supabase.from('transactions')
        .select('id')
        .contains('metadata', { parent_order_id: parentOrderId });
    
    if (cFetchErr) {
        console.error(`SYNC_RESIDENT: Error fetching children for ${parentOrderId}:`, cFetchErr);
    } else if (children && children.length > 0) {
        const childIds = children.map((c: any) => c.id);
        console.log(`SYNC_RESIDENT: Found ${childIds.length} children. Updating...`);
        
        const { error: cUpdateErr } = await supabase.from('transactions')
            .update({ resident_status_id: finalResId })
            .in('id', childIds);
            
        if (cUpdateErr) console.error(`SYNC_RESIDENT: Failed to update children:`, cUpdateErr);
        else console.log(`SYNC_RESIDENT: Successfully updated ${childIds.length} children.`);
    } else {
        console.log(`SYNC_RESIDENT: No children found for ${parentOrderId} using .contains(). Trying fallback filter...`);
        // Fallback for different metadata structures
        const { data: fallbackChildren } = await supabase.from('transactions')
            .select('id')
            .filter('metadata->>parent_order_id', 'eq', parentOrderId);
            
        if (fallbackChildren && fallbackChildren.length > 0) {
            const fChildIds = fallbackChildren.map((c: any) => c.id);
            await supabase.from('transactions').update({ resident_status_id: finalResId }).in('id', fChildIds);
            console.log(`SYNC_RESIDENT: Fallback update successful for ${fChildIds.length} children.`);
        } else {
            console.warn(`SYNC_RESIDENT: Absolutely no children found for ${parentOrderId}`);
        }
    }

    // 3. [PRODUCT ID SWEEP] Emergency fallback: Update any transaction for this user & product that is PAID but missing ResID
    console.log(`SYNC_RESIDENT: Starting Product ID Sweep for User ${trx.user_id} and Product ${trx.product_id}`);
    const { data: sweepTargets, error: sError } = await supabase.from('transactions')
        .select('id')
        .eq('user_id', trx.user_id)
        .eq('product_id', trx.product_id)
        .eq('status', 'PAID')
        .is('resident_status_id', null);
        
    if (sError) {
        console.error(`SYNC_RESIDENT: Sweep fetch error:`, sError);
    } else if (sweepTargets && sweepTargets.length > 0) {
        const sweepIds = sweepTargets.map((t: any) => t.id);
        console.log(`SYNC_RESIDENT: Sweep found ${sweepIds.length} missing transactions. Fixing now...`);
        const { error: sweepUpdErr } = await supabase.from('transactions')
            .update({ resident_status_id: finalResId })
            .in('id', sweepIds);
        if (sweepUpdErr) console.error(`SYNC_RESIDENT: Sweep update failed:`, sweepUpdErr);
        else console.log(`SYNC_RESIDENT: Sweep successfully fixed ${sweepIds.length} transactions.`);
    } else {
        console.log(`SYNC_RESIDENT: Sweep found no missing transactions.`);
    }

    // 4. [IDEMPOTENCY] Mark this transaction as synced to prevent doubling lease on retry/double call
    const updatedMetadata = { ...metadata, is_lease_synced: true };
    await supabase.from('transactions').update({ metadata: updatedMetadata }).eq('id', trxId);

    console.log(`SYNC_RESIDENT: Successfully synced all transactions to Resident ${finalResId}`);
    return finalResId;

  } catch (err) {
    console.error("SYNC_RESIDENT_ERROR:", err);
    return null;
  }
}



/**
 * pakasirWebhook: Receives payment confirmation from Pakasir
 */
export const pakasirWebhook = functions.https.onRequest(async (req, res) => {
  const payload = req.body;
  console.log("PAKASIR_WEBHOOK: Received:", JSON.stringify(payload));
  if (payload.project !== 'ruangsinggah-id') { res.status(403).send('Forbidden'); return; }
  
  const { order_id } = payload;
  if (!order_id) { res.status(400).send('Missing order_id'); return; }

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('DB Error');

    const lastHyphenIndex = order_id.lastIndexOf('-');
    const orderIdBase = lastHyphenIndex !== -1 ? order_id.substring(0, lastHyphenIndex) : order_id;

    const { data: order } = await supabase.from('transactions').select('*').eq('id', orderIdBase).single();
    if (!order) { 
        console.error(`PAKASIR_WEBHOOK: Order ${orderIdBase} not found.`);
        res.status(200).send('OK'); 
        return; 
    }

    const isSuccess = payload.status === 'completed' || payload.status === 'success';
    
    // Always update metadata if possible
    await supabase.from('transactions').update({ 
        payment_method: 'PAKASIR_WEBHOOK', 
        pakasir_order_id: order_id,
        updated_at: new Date().toISOString()
    }).or(`id.eq."${orderIdBase}",metadata->>parent_order_id.eq."${orderIdBase}"`);

    if (isSuccess && order.status?.toUpperCase() !== 'PAID') {
      const settlementDate = new Date().toISOString();
      const metadata = order.metadata || {};
      
      // Update Parent & Children
      await supabase.from('transactions').update({ 
          status: 'PAID', 
          metadata: { ...metadata, settlement_date: settlementDate }
      }).or(`id.eq."${orderIdBase}",metadata->>parent_order_id.eq."${orderIdBase}"`);
      
      const hasPendingBills = metadata.pendingBills && Array.isArray(metadata.pendingBills) && metadata.pendingBills.length > 0;
      
      // Sync Resident Status for Rent-related bookings
      if (['kost_booking', 'rent', 'kost', 'perpanjangan_sewa'].includes(order.product_type)) {
          await syncResidentStatus(orderIdBase);
      }

      if (order.product_type === 'survey') {
          await completeSurveyProcess(supabase, orderIdBase, 'survey');
      } else if (hasPendingBills || metadata.is_bundled_parent) {
          await completeExtraBillProcess(supabase, orderIdBase);
      } else if (['kost_booking', 'rent', 'kost', 'perpanjangan_sewa'].includes(order.product_type)) {
          await completeBookingProcess(supabase, orderIdBase);
      }
      
      await sendSuccessEmail(orderIdBase);
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error("PAKASIR_WEBHOOK_ERROR:", err);
    res.status(500).send('Internal Error');
  }
});

/**
 * handleCustomAuthEmail: Generates a Supabase auth link and sends it via Brevo.
 */
export const handleCustomAuthEmail = functions.https.onRequest({ cors: true }, async (req, res) => {
  const { type, email, password, metadata: userMetadata } = req.body;
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('DB Client error');

    const { data, error } = await supabase.auth.admin.generateLink({
      type,
      email,
      password: password || Math.random().toString(36).slice(-10),
      options: { data: userMetadata || {}, redirectTo: 'https://ruangsinggah.id/login' }
    });
    if (error) throw error;
    
    const brevoApiKey = brevoApiKeyParam.value();
    const actionLink = data.properties.action_link;
    const isSignup = type === 'signup';
    const titleText = isSignup ? 'Konfirmasi Pendaftaran Akun' : 'Reset Kata Sandi Anda';
    const subTitleText = isSignup ? 'Selamat datang di RuangSinggah.id! Selangkah lagi untuk mengaktifkan akun Anda.' : 'Kami menerima permintaan untuk mereset kata sandi akun RuangSinggah.id Anda.';
    const buttonText = isSignup ? 'KONFIRMASI AKUN SEKARANG' : 'ATUR ULANG KATA SANDI';
    const footerText = isSignup ? 'Jika Anda tidak merasa mendaftar akun di RuangSinggah.id, silakan abaikan email ini.' : 'Jika Anda tidak meminta reset kata sandi, abaikan email ini dan kata sandi Anda akan tetap sama.';

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px 20px; text-align: center;">
        <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: left;">
          
          <!-- Header Branding Banner -->
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
            <img src="https://ruangsinggah.id/logo.png" alt="RuangSinggah.id Logo" style="max-height: 45px; margin-bottom: 20px;" onerror="this.style.display='none'">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${titleText}</h1>
          </div>
          
          <!-- Content Body -->
          <div style="padding: 40px 35px; color: #374151; line-height: 1.6;">
            <p style="font-size: 16px; font-weight: 600; margin-top: 0; color: #111827;">Halo,</p>
            <p style="font-size: 15px; color: #4b5563; margin-bottom: 30px; margin-top: 0;">${subTitleText}</p>
            
            <!-- CTA Button Container -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${actionLink}" style="display: inline-block; background-color: #f97316; color: #ffffff; padding: 16px 32px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 14px; box-shadow: 0 8px 20px rgba(249, 115, 22, 0.25);">
                ${buttonText}
              </a>
            </div>
            
            <!-- Fallback URL -->
            <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 15px; margin: 30px 0; word-break: break-all;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0 0 5px 0;">Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:</p>
              <a href="${actionLink}" style="font-size: 12px; color: #f97316; text-decoration: none;">${actionLink}</a>
            </div>
            
            <p style="font-size: 13px; color: #9ca3af; margin: 0; line-height: 1.5;">${footerText}</p>
          </div>
          
          <!-- Footer Branding / Support -->
          <div style="background-color: #fafafa; border-top: 1px solid #f3f4f6; padding: 25px 35px; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} RuangSinggah.id. All rights reserved.</p>
            <p style="font-size: 11px; color: #d1d5db; margin: 5px 0 0 0;">Layanan Sewa Kost & Jasa Survey Properti Terpercaya</p>
          </div>
          
        </div>
      </div>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': brevoApiKey },
      body: JSON.stringify({
        sender: { name: "RuangSinggah", email: "system@ruangsinggah.id" },
        to: [{ email }],
        subject: isSignup ? '🛡️ Konfirmasi Akun RuangSinggah.id' : '🔑 Reset Kata Sandi',
        htmlContent: emailHtml
      })
    });
    
    const result = await response.json().catch(() => ({}));
    console.log(`AUTH_EMAIL: Brevo Status: ${response.status}`);
    
    if (!response.ok) {
      console.error("AUTH_EMAIL_ERROR:", JSON.stringify(result));
      throw new Error(`Brevo Auth Email Error: ${JSON.stringify(result)}`);
    }
    
    res.status(200).send({ message: 'Success' });
  } catch (err: any) {
    console.error("AUTH_EMAIL_EXCEPTION:", err);
    res.status(500).send({ message: err.message });
  }
});

/**
 * manualCreateSurveyFolder: Creates a Drive folder for a survey manually.
 */
export const manualCreateSurveyFolder = functions.https.onRequest({ cors: true }, async (req, res) => {
  const { surveyId, adminUserId } = req.body;
  try {
    const supabase = getSupabase();
    const { data: user } = await supabase.from('users').select('role').eq('id', adminUserId).single();
    if (!user || user.role !== 'admin') { res.status(403).send('Forbidden'); return; }
    
    const { data: survey } = await supabase.from('survey_requests').select('kost_name').eq('id', surveyId).single();
    const { createSurveyFolder } = require('./googleDriveUtils');
    const folderName = `Survey - ${survey.kost_name || 'Kost'} - ${surveyId.substring(0,8).toUpperCase()}`;
    const driveLink = await createSurveyFolder(folderName, '1KS-uAMJZg7deddNCB4XxRrPpXsQjq1tk', {
      privateKey: googlePrivateKeyParam.value(),
      clientEmail: googleClientEmailParam.value()
    });
    
    await supabase.from('survey_requests').update({ result_drive_link: driveLink }).eq('id', surveyId);
    res.status(200).send({ driveLink });
  } catch (err: any) {
    res.status(500).send({ message: err.message });
  }
});


async function getDownloadURLFromRef(fileRef: any): Promise<string> {
    return `https://firebasestorage.googleapis.com/v0/b/${fileRef.bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media`;
}

export const testEmailNotification = functions.https.onRequest({ cors: true }, async (req, res) => {
  const { orderId } = req.query;
  await sendSuccessEmail(orderId as string);
  res.status(200).send('OK');
});


/**
 * sendSurveyStatusEmail: Sends email notification for survey lifecycle events.
 */
export const sendSurveyStatusEmail = functions.https.onRequest({ cors: true }, async (req, res) => {
  const { surveyId, status, recipientRole } = req.body;
  console.log(`SURVEY_EMAIL: Start (ID: ${surveyId}, Status: ${status}, Role: ${recipientRole})`);

  if (!surveyId || !status) {
    res.status(400).send({ message: 'Missing surveyId or status' });
    return;
  }

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('DB Error');

    // Fetch survey details with user and agent info
    const { data: survey, error: surveyError } = await supabase
      .from('survey_requests')
      .select('*, users!survey_requests_user_id_fkey(email, full_name)')
      .eq('id', surveyId)
      .single();

    if (surveyError || !survey) {
      console.error("SURVEY_EMAIL: Survey not found:", surveyId, surveyError);
      res.status(404).send({ message: 'Survey not found' });
      return;
    }

    const userName = survey.users?.full_name || 'Pelanggan';
    const userEmail = survey.users?.email;
    const kostName = survey.kost_name || 'Kost';
    const surveyDate = survey.survey_date;
    const surveyTime = survey.survey_time;

    let targetEmail = '';
    let targetName = '';
    let subject = '';
    let htmlContent = '';

    const brevoApiKey = brevoApiKeyParam.value();
    if (!brevoApiKey) throw new Error('BREVO_API_KEY missing');

    // Logic based on status and recipient
    if (recipientRole === 'agent') {
      // Notification to Agent about NEW assignment
      const { data: agent } = await supabase.from('users').select('email, full_name').eq('id', survey.assigned_agent_id).single();
      if (!agent || !agent.email) {
          console.warn("SURVEY_EMAIL: Agent email not found");
          res.status(200).send({ message: 'Agent email not found, skipping' });
          return;
      }
      targetEmail = agent.email;
      targetName = agent.full_name || 'Surveyor';
      subject = `Tugas Survey Baru: ${kostName} 📋`;
      htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #f97316;">Halo, ${targetName}!</h2>
          <p>Anda telah ditugaskan untuk melakukan survey lapangan untuk properti berikut:</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <table style="width: 100%; font-size: 14px;">
              <tr><td style="padding: 5px 0; width: 35%;"><strong>Kost</strong></td><td>: ${kostName}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Alamat</strong></td><td>: ${survey.kost_address}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Jadwal</strong></td><td>: ${surveyDate} @ ${surveyTime}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Catatan</strong></td><td>: ${survey.notes || '-'}</td></tr>
            </table>
          </div>
          <p>Silakan buka Dashboard Agen Anda untuk menerima tugas ini.</p>
          <a href="https://ruangsinggah.id/dashboard-agent" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">BUKA DASHBOARD AGEN</a>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Salam,<br />Tim RuangSinggah.id</p>
        </div>
      `;
    } else {
      // Notifications to USER
      if (!userEmail) {
          console.warn("SURVEY_EMAIL: User email not found");
          res.status(200).send({ message: 'User email not found, skipping' });
          return;
      }
      targetEmail = userEmail;
      targetName = userName;

      if (status === 'AGENT_ASSIGNED') {
        subject = `Surveyor Telah Ditemukan! - ${kostName} 🔎`;
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #f97316;">Halo, ${targetName}!</h2>
            <p>Kabar baik! Kami telah menetapkan surveyor untuk pengecekan kost <strong>${kostName}</strong>.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7; margin: 20px 0;">
              <p style="margin: 0;"><strong>Surveyor:</strong> ${survey.agent_name || 'Tim RuangSinggah'}</p>
              <p style="margin: 5px 0 0 0;"><strong>Jadwal:</strong> ${surveyDate} @ ${surveyTime}</p>
            </div>
            <p>Surveyor akan menghubungi Anda atau pemilik kost sesuai jadwal di atas. Anda akan menerima notifikasi saat surveyor menuju ke lokasi.</p>
            <a href="https://ruangsinggah.id/my-kost" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">CEK STATUS SURVEY</a>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">Salam hangat,<br />Tim RuangSinggah.id</p>
          </div>
        `;
      } else if (status === 'HEADING_TO_LOCATION') {
        subject = `Surveyor Sedang Menuju Lokasi! 🚗`;
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #f97316;">Halo, ${targetName}!</h2>
            <p>Surveyor kami, <strong>${survey.agent_name}</strong>, saat ini sedang dalam perjalanan menuju <strong>${kostName}</strong>.</p>
            <p>Proses pengecekan akan segera dilakukan. Mohon pastikan Anda dapat dihubungi melalui WhatsApp jika surveyor membutuhkan informasi tambahan.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">Salam,<br />Tim RuangSinggah.id</p>
          </div>
        `;
      } else if (status === 'RESCHEDULED') {
        subject = `Perubahan Jadwal Survey - ${kostName} 🗓️`;
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #f97316;">Halo, ${targetName}!</h2>
            <p>Terdapat perubahan jadwal untuk survey kost <strong>${kostName}</strong> Anda.</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 12px; border: 1px solid #fef3c7; margin: 20px 0;">
              <p style="margin: 0;"><strong>Jadwal Baru:</strong> ${surveyDate} @ ${surveyTime}</p>
            </div>
            <p>Mohon maaf atas ketidaknyamanan ini. Tim kami akan tetap melakukan pengecekan sesuai jadwal terbaru.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">Salam,<br />Tim RuangSinggah.id</p>
          </div>
        `;
      } else if (status === 'COMPLETED') {
        subject = `Survey Selesai! Hasil Tersedia ✅`;
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #f97316;">Halo, ${targetName}!</h2>
            <p>Survey untuk kost <strong>${kostName}</strong> telah selesai dilaksanakan.</p>
            <p>Anda kini dapat melihat laporan detail pengecekan, foto-foto kondisi terbaru, serta penilaian surveyor di halaman <strong>My Kost</strong>.</p>
            <div style="margin: 25px 0;">
               <a href="https://ruangsinggah.id/my-kost" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">LIHAT HASIL SURVEY</a>
            </div>
            <p>Terima kasih telah menggunakan jasa survey RuangSinggah.id!</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">Salam hangat,<br />Tim RuangSinggah.id</p>
          </div>
        `;
      } else {
        res.status(200).send({ message: 'Status not mapped for email' });
        return;
      }
    }

    // Send via Brevo
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        sender: { name: "RuangSinggah.id", email: "system@ruangsinggah.id" },
        to: [{ email: targetEmail, name: targetName }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    const result = await response.json();
    console.log(`SURVEY_EMAIL: Brevo Status: ${response.status}`, JSON.stringify(result));
    
    if (!response.ok) {
      throw new Error(`Brevo Error: ${JSON.stringify(result)}`);
    }

    res.status(200).send({ success: true, messageId: result.messageId });

  } catch (err: any) {
    console.error("SURVEY_EMAIL_EXCEPTION:", err);
    res.status(500).send({ message: err.message });
  }
});

/**
 * sitemap: Menghasilkan sitemap.xml secara dinamis dengan query ke Supabase
 */
export const sitemap = functions.https.onRequest(async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseClient = createClient(supabaseUrlParam.value(), supabaseKeyParam.value());

    // Ambil artikel yang berstatus published
    const { data: articles, error: articlesError } = await supabaseClient
      .from('articles')
      .select('slug, updated_at')
      .eq('status', 'published');

    if (articlesError) {
      console.error("CF_LOG: Error fetching articles for sitemap:", articlesError);
    }

    // helper to slugify text in sitemap
    function slugify(text: string): string {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    }

    // Ambil properti/kost yang berstatus published beserta kampus & area (pSEO)
    const { data: properties, error: propertiesError } = await supabaseClient
      .from('properties')
      .select('id, updated_at, campuses, area')
      .eq('status', 'published');

    if (propertiesError) {
      console.error("CF_LOG: Error fetching properties for sitemap:", propertiesError);
    }

    // Daftar halaman statis utama yang valid dari React Router
    const staticPages = [
      '',
      '/listings',
      '/products',
      '/owner',
      '/about',
      '/contact',
      '/survey-service',
      '/syarat-ketentuan',
      '/artikel'
    ];

    const baseUrl = 'https://ruangsinggah.id';
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Tambahkan halaman statis
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    }

    // 2. Tambahkan halaman artikel dinamis
    if (articles && Array.isArray(articles)) {
      for (const art of articles) {
        const lastMod = art.updated_at ? new Date(art.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/artikel/${art.slug}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // 3. Tambahkan halaman properti kost dinamis
    if (properties && Array.isArray(properties)) {
      for (const prop of properties) {
        const lastMod = prop.updated_at ? new Date(prop.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/kost/${prop.id}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.9</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    // 4. Tambahkan rute Kampus Dinamis (pSEO) jika ada datanya
    const uniqueCampuses = new Set<string>();
    const uniqueAreas = new Set<string>();

    if (properties && Array.isArray(properties)) {
      for (const prop of properties) {
        if (prop.campuses && Array.isArray(prop.campuses)) {
          for (const c of prop.campuses) {
            if (c.name && c.name.trim() !== '') {
              uniqueCampuses.add(c.name);
            }
          }
        }
        if (prop.area && prop.area.trim() !== '') {
          uniqueAreas.add(prop.area);
        }
      }
    }

    for (const campus of uniqueCampuses) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/kost-dekat/${slugify(campus)}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // 5. Tambahkan rute Area Dinamis (pSEO) jika ada datanya
    for (const area of uniqueAreas) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/kost-area/${slugify(area)}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (err: any) {
    console.error("CF_LOG: Sitemap generation error:", err);
    res.status(500).send("Error generating sitemap");
  }
});

