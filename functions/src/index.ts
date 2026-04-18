// functions/src/index.ts

// --- IMPOR YANG DIBUTUHKAN ---
import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import { URL } from 'url';
// PDFDocument is lazy-loaded inside generatePDFBuffer to avoid Firebase deploy timeout
// --- AKHIR IMPOR ---

import { createSurveyFolder } from './googleDriveUtils';

admin.initializeApp();
const gcs = new Storage();
const db = admin.firestore();

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

  const bucket = gcs.bucket(fileBucket);
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
    docRef = db.collection(collectionName).doc(entityId);

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
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
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

// --- SUPABASE CLIENT SETUP ---
const { createClient } = require('@supabase/supabase-js');

// --- SUPABASE CONFIGURATION (v2 Params) ---
const { defineString } = require('firebase-functions/params');
const supabaseUrlParam = defineString('SUPABASE_URL');
const supabaseKeyParam = defineString('SUPABASE_SERVICE_ROLE_KEY');

// Helper to get supabase client securely
let supabaseInstance: any = null;
function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const url = supabaseUrlParam.value();
  const key = supabaseKeyParam.value();

  if (!url || !key) {
    // During deployment analysis, we might not have these. 
    // Return a proxy or handled null to prevent crash.
    console.warn("Supabase credentials missing. Client not initialized.");
    return null;
  }
  
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

// --- EMAIL CONFIGURATION ---
const brevoApiKeyParam = defineString('BREVO_API_KEY');

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
      .select('*, users(email, name)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
        console.error("EMAIL_SERVICE: Order not found for email:", orderId);
        return;
    }

    const userEmail = order.users?.email;
    const userName = order.users?.name || 'Pelanggan';
    
    if (!userEmail) {
        console.warn("EMAIL_SERVICE: No user email found for order:", orderId);
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
    if (!brevoApiKey) {
      console.error("EMAIL_SERVICE: BREVO_API_KEY is missing from environment params");
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
    if (!response.ok) {
      throw new Error(`Brevo API Error: ${JSON.stringify(result)}`);
    }

    console.log("EMAIL_SERVICE: Email sent successfully via Brevo REST API!", result);
  } catch (err) {
    console.error("EMAIL_SERVICE: Failed to send email via Brevo:", err);
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
    if (!response.ok) {
        const err = await response.text();
        console.error("EMAIL_ATTACH_ERROR:", err);
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
        .eq('status', 'pending');

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
        // SECURITY: Fetch authoritative price from DB based on productType
        if (productType === 'database') {
            const { data: dbProd, error: dbError } = await supabase
              .from('available_databases')
              .select('price')
              .eq('id', productId)
              .single();
            if (dbError || !dbProd) throw new Error('Produk database tidak ditemukan.');
            finalAmount = Number(dbProd.price);
        } else if (productType === 'kost_booking' || productType === 'property' || productType === 'kost') {
            const { data: prop, error: propError } = await supabase
              .from('properties')
              .select('price')
              .eq('id', productId)
              .single();
            if (propError || !prop) throw new Error('Listings properti tidak ditemukan.');
            finalAmount = Number(prop.price);
        } else if (productType === 'survey') {
            finalAmount = 70000;
        } else {
            throw new Error(`Unsupported product type: ${productType}`);
        }

        // 1. Create transaction record in Supabase
        const { data: newOrder, error: orderError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            product_id: productId,
            product_type: productType,
            amount: finalAmount,
            metadata: metadata || {},
            payment_method: method || null,
            status: 'pending'
          })
          .select('*')
          .single();

        if (orderError) throw orderError;
        order = newOrder;

        // NEW: If survey, record into survey_requests
        if (productType === 'survey') {
            console.log(`CREATE_PAYMENT: Recording survey_request for order ${order.id}`);
            
            const { data: existingSrv } = await supabase
              .from('survey_requests')
              .select('id')
              .eq('transaction_id', order.id)
              .maybeSingle();

            const surveyData = {
              transaction_id: order.id,
              user_id: userId,
              kost_name: metadata.kostName || 'Survey Kost',
              kost_address: metadata.kostAddress || '-',
              owner_phone: metadata.ownerPhone || '',
              survey_date: metadata.surveyDate || null,
              survey_time: metadata.surveyTime || null,
              notes: `${metadata.notes || ''}\n[Via Backend]`.trim(),
              status: 'AWAITING_PAYMENT'
            };

            if (existingSrv) {
              await supabase.from('survey_requests').update(surveyData).eq('id', existingSrv.id);
            } else {
              await supabase.from('survey_requests').insert([surveyData]);
            }
            
            // Send Admin Notification about NEW survey request
            try {
              const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
              if (admins) {
                for (const admin of admins) {
                  await supabase.from('notifications').insert({
                    user_id: admin.id,
                    title: 'Survey Baru Terdeteksi',
                    message: `Ada pesanan survey baru untuk Kost: ${metadata.kostName}. User sedang dialihkan ke pembayaran.`,
                    type: 'assignment'
                  });
                }
              }
            } catch (ignore) {}
        }
    }

    // 2. Construct Pakasir Checkout URL
    const pakasirSlug = 'ruangsinggah-id';
    const PAKASIR_API_KEY = 'dE2c8NpqVcyMGZG81OMhHUXywQ8uVvCB';
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
 * Now synced with real webhook logic via completeSurveyProcess.
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

    // 1. Verify Admin
    const { data: user } = await supabase.from('users').select('role').eq('id', adminUserId).single();
    if (!user || user.role !== 'admin') {
      res.status(403).send({ message: 'Unauthorized. Admin only.' });
      return;
    }

    // 2. Clear transaction status
    const { data: order, error: fetchErr } = await supabase.from('transactions').select('*').eq('id', orderId).single();
    if (fetchErr || !order) throw new Error('Order not found.');

    if (order.status === 'paid') {
      res.status(200).send({ message: 'Order already paid.' });
      return;
    }

    // 3. Mark as paid
    console.log(`SIMULATE_SUCCESS: Updating transaction ${orderId} to 'paid'`);
    await supabase.from('transactions').update({ 
        status: 'paid', 
        updated_at: new Date().toISOString(),
        metadata: { ...order.metadata, is_simulated: true }
    }).eq('id', orderId);

    // 4. Complete Survey Process (Status Update & Drive Folder)
    if (order.product_type === 'survey') {
      await completeSurveyProcess(supabase, orderId, order.product_type);
    }

    await sendSuccessEmail(orderId);

    res.status(200).send({ message: 'Simulation successful', orderId });
  } catch (err: any) {
    console.error("SIMULATE_SUCCESS_ERROR:", err);
    res.status(500).send({ message: 'Simulation failed: ' + err.message });
  }
});

/**
 * completeSurveyProcess: Helper to move survey from AWAITING_PAYMENT to PENDING_ASSIGNMENT.
 * Creates Drive folder and updates status. Shared by webhook and simulation.
 */
async function completeSurveyProcess(supabase: any, orderId: string, productType: string) {
  if (productType !== 'survey') return;
  console.log(`COMPLETE_SURVEY: Starting for Order ${orderId}`);
  try {
    const { data: srvData } = await supabase
      .from('survey_requests')
      .select('kost_name, status')
      .eq('transaction_id', orderId)
      .maybeSingle();

    if (!srvData) {
      console.warn(`COMPLETE_SURVEY: No survey_request found for transaction ${orderId}`);
      return;
    }

    if (srvData.status !== 'AWAITING_PAYMENT') {
        console.log(`COMPLETE_SURVEY: Survey ${orderId} is already ${srvData.status}. Skipping.`);
        return;
    }

    const folderName = `Survey - ${srvData.kost_name || 'Kost'} - ${orderId.substring(0,8).toUpperCase()}`;
    const ROOT_FOLDER_ID = '1KS-uAMJZg7deddNCB4XxRrPpXsQjq1tk';
    const driveLink = await createSurveyFolder(folderName, ROOT_FOLDER_ID);

    await supabase
      .from('survey_requests')
      .update({ 
        status: 'PENDING_ASSIGNMENT', 
        result_drive_link: driveLink,
        updated_at: new Date().toISOString() 
      })
      .eq('transaction_id', orderId);
      
    console.log(`COMPLETE_SURVEY: Success. Drive: ${driveLink}`);
  } catch (err) {
    console.error("COMPLETE_SURVEY_ERROR:", err);
    // Minimal fallback: at least update the status
    await supabase.from('survey_requests').update({ status: 'PENDING_ASSIGNMENT' }).eq('transaction_id', orderId);
  }
}

/**
 * pakasirWebhook: Receives payment confirmation from Pakasir
 */
export const pakasirWebhook = functions.https.onRequest(async (req, res) => {
  const payload = req.body;
  console.log("PAKASIR_WEBHOOK: Received:", JSON.stringify(payload));
  if (payload.project !== 'ruangsinggah-id') { res.status(403).send('Forbidden'); return; }
  const { order_id, status } = payload;
  if (!order_id) { res.status(400).send('Missing order_id'); return; }

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('DB Error');

    const { data: order } = await supabase.from('transactions').select('amount, status').eq('id', order_id).single();
    if (!order || order.status === 'paid') { res.status(200).send('OK'); return; }

    const isSuccess = status === 'completed' || status === 'success';
    const newStatus = isSuccess ? 'paid' : (status === 'expired' ? 'expired' : 'cancelled');

    const { data: updatedTx } = await supabase
      .from('transactions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', order_id)
      .eq('status', 'pending')
      .select().maybeSingle();
    
    if (updatedTx && newStatus === 'paid') {
      await sendSuccessEmail(order_id);
      if (updatedTx.product_type === 'survey') {
        await completeSurveyProcess(supabase, order_id, updatedTx.product_type);
      }
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error("PAKASIR_WEBHOOK_ERROR:", err);
    res.status(500).send('Internal Error');
  }
});

/**
 * handleCustomAuthEmail: Generates a Supabase auth link and sends it via Brevo with custom branding.
 * This bypasses Supabase's default sender and templates for full brand control.
 */
export const handleCustomAuthEmail = functions.https.onRequest({ cors: true }, async (req, res) => {
  const { type, email, password, metadata: userMetadata } = req.body;
  console.log(`CUSTOM_AUTH: Request received - Type: ${type}, Email: ${email}`);

  if (!email || !type) {
    res.status(400).send({ message: 'Missing email or type' });
    return;
  }

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database client not available.');

    let confirmationUrl = '';
    let subject = '';
    let htmlContent = '';
    const redirectUrl = `https://ruangsinggah.id/login`;

    if (type === 'signup') {
      console.log(`CUSTOM_AUTH: Generating signup link for ${email}`);
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email,
        password: password || Math.random().toString(36).slice(-10), // Use random if not provided (should be provided)
        options: { 
            data: userMetadata || {},
            redirectTo: redirectUrl
        }
      });
      if (error) throw error;
      confirmationUrl = data.properties.action_link;
      subject = '🛡️ Konfirmasi Akun RuangSinggah.id';
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="margin:0; padding:0; background:#f9fafb; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 0">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.05);">
                  <tr><td style="background:#1a1a2e; padding:32px; text-align:center;"><p style="margin:0; color:#f97316; font-size:24px; font-weight:900; letter-spacing:1px;">RUANGSINGGAH.ID</p></td></tr>
                  <tr>
                    <td style="padding:40px 50px;">
                      <h2 style="color:#111827; margin:0 0 20px; font-size:24px; text-align:center;">Halo! Ayo Konfirmasi Akun Anda</h2>
                      <p style="color:#374151; font-size:16px; line-height:1.7; margin:16px 0;">Terima kasih telah mendaftar di RuangSinggah.id, platform penyedia kost dan akomodasi terbaik. Keamanan akun Anda adalah prioritas kami.</p>
                      <p style="color:#374151; font-size:16px; line-height:1.7; margin:16px 0;">Untuk memulai perjalanan Anda mencarikan hunian yang nyaman, silakan klik tombol di bawah ini untuk memverifikasi alamat email dan mengaktifkan akses Anda secara penuh.</p>
                      <table cellpadding="0" cellspacing="0" border="0" style="margin:30px auto;">
                        <tr><td align="center" bgcolor="#f97316" style="border-radius:12px;"><a href="${confirmationUrl}" target="_blank" style="display:inline-block; padding:18px 45px; font-size:16px; font-weight:bold; color:#ffffff; text-decoration:none;">KONFIRMASI AKUN SEKARANG</a></td></tr>
                      </table>
                      <div style="border-top:1px solid #f3f4f6; margin-top:40px; padding-top:24px;">
                        <p style="margin:0; color:#6b7280; font-size:13px; line-height:1.5;">Anda menerima email ini karena Anda mendaftar di situs web kami atau menggunakan aplikasi RuangSinggah.id. Jika Anda merasa tidak merasa melakukan pendaftaran ini, harap abaikan saja email ini.</p>
                        <p style="margin:16px 0 0; color:#6b7280; font-size:13px; line-height:1.5; font-weight:bold;">Tim RuangSinggah.id - Jakarta, Indonesia</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>`;
    } else if (type === 'recovery') {
      console.log(`CUSTOM_AUTH: Generating recovery link for ${email}`);
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${redirectUrl}?mode=recovery` }
      });
      if (error) throw error;
      confirmationUrl = data.properties.action_link;
      subject = '🔑 Reset Kata Sandi RuangSinggah.id';
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="margin:0; padding:0; background:#f9fafb; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 0">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.05);">
                  <tr><td style="background:#1a1a2e; padding:32px; text-align:center;"><p style="margin:0; color:#f97316; font-size:24px; font-weight:900; letter-spacing:1px;">RUANGSINGGAH.ID</p></td></tr>
                  <tr>
                    <td style="padding:40px 50px;">
                      <h2 style="color:#111827; margin:0 0 20px; font-size:24px; text-align:center;">Lupa Kata Sandi?</h2>
                      <p style="color:#374151; font-size:16px; line-height:1.7; margin:16px 0;">Kami menerima permintaan untuk mereset kata sandi akun RuangSinggah.id Anda. Jangan khawatir, kami akan membantu Anda kembali masuk.</p>
                      <p style="color:#374151; font-size:16px; line-height:1.7; margin:16px 0;">Klik tombol di bawah ini untuk membuat kata sandi baru yang lebih aman. Link ini hanya berlaku selama 24 jam demi keamanan data Anda.</p>
                      <table cellpadding="0" cellspacing="0" border="0" style="margin:30px auto;">
                        <tr><td align="center" bgcolor="#f97316" style="border-radius:12px;"><a href="${confirmationUrl}" target="_blank" style="display:inline-block; padding:18px 45px; font-size:16px; font-weight:bold; color:#ffffff; text-decoration:none;">SETEL ULANG KATA SANDI</a></td></tr>
                      </table>
                      <div style="border-top:1px solid #f3f4f6; margin-top:40px; padding-top:24px;">
                        <p style="margin:0; color:#6b7280; font-size:13px; line-height:1.5;">Jika Anda tidak merasa meminta reset ini, abaikan email ini dan pastikan akun Anda tetap aman. Silakan hubungi bantuan jika ada aktivitas mencurigakan.</p>
                        <p style="margin:16px 0 0; color:#6b7280; font-size:13px; line-height:1.5; font-weight:bold;">Tim RuangSinggah.id - Managed by PT Ruang Singgah Indonesia</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>`;
    } else {
        res.status(400).send({ message: 'Unsupported type' });
        return;
    }

    // Unique ID to prevent Gmail threading/clipping
    const emailRef = `Ref: ${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const footerId = `<div style="margin-top:20px; border-top:1px solid #eee; padding-top:10px; color:#9fa6b2; font-size:10px; text-align:center;">Email ID: ${emailRef}</div>`;
    const finalHtml = htmlContent.replace('</body>', `${footerId}</body>`);

    // Send via Brevo
    const brevoApiKey = brevoApiKeyParam.value();
    const payload = {
      sender: { name: "RuangSinggah", email: "system@ruangsinggah.id" },
      to: [{ email: email }],
      subject: subject,
      htmlContent: finalHtml,
      textContent: `Halo! Ini adalah email resmi dari RuangSinggah.id. Silakan verifikasi akun Anda atau atur ulang kata sandi dengan mengikuti instruksi di link berikut: ${confirmationUrl}. [ID: ${emailRef}]. Jika Anda memerlukan bantuan, silakan hubungi tim support kami.`
    };

    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'api-key': brevoApiKey },
      body: JSON.stringify({
        ...payload,
        options: {
            "clickTracking": false,
            "openTracking": false
        }
      })
    });

    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Brevo Error: ${errorText}`);
    }

    console.log(`CUSTOM_AUTH: Email sent successfully for ${type}`);
    res.status(200).send({ message: 'Success' });
  } catch (err: any) {
    console.error("CUSTOM_AUTH_ERROR:", err);
    res.status(500).send({ message: err.message });
  }
});

/**
 * manualCreateSurveyFolder: Manually triggers folder creation for a specific survey ID.
 * Admin only.
 */
export const manualCreateSurveyFolder = functions.https.onRequest({ cors: true }, async (req, res) => {
  const { surveyId, adminUserId } = req.body;
  console.log(`MANUAL_DRIVE: Start for Survey ${surveyId} (Admin: ${adminUserId})`);

  if (!surveyId || !adminUserId) {
    res.status(400).send({ message: 'Missing surveyId or adminUserId' });
    return;
  }

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('DB Client error');

    // 1. Verify Admin
    const { data: user } = await supabase.from('users').select('role').eq('id', adminUserId).single();
    if (!user || user.role !== 'admin') {
      res.status(403).send({ message: 'Unauthorized' });
      return;
    }

    // 2. Fetch Survey Data
    const { data: survey, error } = await supabase
      .from('survey_requests')
      .select('kost_name, transaction_id, result_drive_link')
      .eq('id', surveyId)
      .single();

    if (error || !survey) throw new Error('Survey not found or error');

    // 3. Create Folder if not exists
    const ROOT_FOLDER_ID = '1KS-uAMJZg7deddNCB4XxRrPpXsQjq1tk';
    const folderName = `Survey - ${survey.kost_name || 'Kost'} - ${survey.id?.substring(0,8).toUpperCase() || surveyId.substring(0,8).toUpperCase()}`;
    
    console.log(`MANUAL_DRIVE: Creating folder: ${folderName}`);
    const driveLink = await createSurveyFolder(folderName, ROOT_FOLDER_ID);

    // 4. Update DB
    await supabase.from('survey_requests').update({ 
      result_drive_link: driveLink,
      updated_at: new Date().toISOString()
    }).eq('id', surveyId);

    res.status(200).send({ message: 'Success', driveLink });
  } catch (err: any) {
    console.error("MANUAL_DRIVE_ERROR:", err);
    res.status(500).send({ message: err.message });
  }
});

async function getDownloadURLFromRef(fileRef: any): Promise<string> {
    return `https://firebasestorage.googleapis.com/v0/b/${fileRef.bucket.name}/o/${encodeURIComponent(fileRef.name)}?alt=media`;
}

