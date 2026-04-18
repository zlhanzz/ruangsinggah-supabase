import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ── CONFIGURATION ─────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
const GEMINI_KEYS_RAW = Deno.env.get('GEMINI_API_KEY') || ""
const GEMINI_KEYS = GEMINI_KEYS_RAW.split(',').map(k => k.trim()).filter(k => k)
const WA_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || ""
const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID') || ""
const VERIFY_TOKEN = "ruangsinggah_secret_token"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ── UTILS ─────────────────────────────────────────────────────────────────────
function cleanJson(text: string) {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

async function analyzeWithAI(text: string, context: { properties: any[], stats: any, userName: string, pendingBookingsList: any[] }, retries = 0): Promise<any> {
  const firstPropTitle = context.properties[0]?.title || "kost";
  const prompt = `
    IDENTITAS: Anda adalah "Dashboard Mitra Simpel" untuk RuangSinggah.id. 

    BATASAN KETAT:
    1. HANYA jawab pertanyaan terkait properti milik ${context.userName} (Daftar di bawah).
    2. HANYA jawab pertanyaan terkait performa dashboard, statistik, pesan, dan pengajuan sewa.
    3. TOLAK dengan sopan semua pertanyaan di luar konteks ini (listing orang lain, info personal, dsb).

    DATA PROPERTI ANDA:
    ${context.properties.map(p => `- ${p.title} (ID: ${p.id}, Kamar: ${p.room_types?.map((rt: any) => rt.name).join(", ")})`).join("\n")}

    STATISTIK DASHBOARD:
    - Pesan Belum Dibaca: ${context.stats.unreadMessages}
    - Pengajuan Sewa Menunggu: ${context.stats.pendingBookings}
    - Permintaan Cek Lokasi: ${context.stats.pendingSurveys}

    DAFTAR PENGAJUAN SEWA MENUNGGU (Hanya untuk referensi logika Anda):
    ${context.pendingBookingsList.length === 0 ? "Tidak ada" : context.pendingBookingsList.map((tx: any) => {
       const tName = Array.isArray(tx.user) ? tx.user[0]?.name : tx.user?.name || "Penyewa";
       return `[ID: ${tx.id}] - Penyewa: ${tName}`;
    }).join('\n')}

    ATURAN JIKA USER MENJAWAB "TERIMA" ATAU "TOLAK":
    - Jika user merespon "Terima" atau "Tolak" (atau sinonimnya), Anda HARUS mengecek Daftar Pengajuan Sewa Menunggu di atas.
    - Jika ada minimal 1 pengajuan, set intent menjadi "ACCEPT_BOOKING" atau "REJECT_BOOKING".
    - Isi "transaction_id" JELAS dengan ID murni (tanpa tanda kurung/kutip tambahan) dari daftar tersebut.
    - KOSONGKAN field "reply_text"! Sistem akan memformat teks balasan secara otomatis.

    ATURAN JIKA USER INGIN "CEK PENGAJUAN SEWA":
    - Set intent menjadi "GET_APPLICATIONS".
    - KOSONGKAN field "reply_text"! Sistem kami yang akan memformatnya secara otomatis.

    TEMPLATE SAPAAN WAJIB (Gunakan format ini HANYA jika pesan awal user tidak jelas atau sekadar menyapa):
    "*Halo Pak/Ibu ${context.userName},* ada yang bisa dibantu hari ini terkait kost *${firstPropTitle}*?

    Berikut daftar layanan yang tersedia:
    📍 *Update Harga*
    ✉️ *Cek Pesan Masuk* (Ada ${context.stats.unreadMessages} pesan baru)
    📄 *Pengajuan Sewa* (Ada ${context.stats.pendingBookings} menunggu)
    🔍 *Cek Lokasi* (Ada ${context.stats.pendingSurveys} permintaan)"

    ATURAN FORMATTING & PENTING:
    - Gunakan baris baru (newline) secara eksplisit agar teks rapi.
    - Gunakan *text* untuk menebalkan kata kunci.
    - JANGAN BERIKAN TEMPLATE SAPAAN jika user sedang menanyakan pengajuan sewa atau mencoba membalas "Terima".

    FORMAT OUTPUT (JSON SAJA):
    {
      "intent": "UPDATE_PRICE" | "GET_STATS" | "GET_MESSAGES" | "GET_APPLICATIONS" | "ACCEPT_BOOKING" | "REJECT_BOOKING" | "CHATTING",
      "property_id": "UUID (jika relevan)",
      "transaction_id": "UUID transaksi (Wajib ada Khusus ACCEPT/REJECT BOOKING)",
      "room_type_name": "Nama tipe kamar (khusus update harga)",
      "new_value": 1500000 (khusus update harga),
      "rejection_reason": "Alasan penolakan dari user (Wajib ada jika intent REJECT_BOOKING dan user memberikannya)",
      "reply_text": "Balasan string singkat Anda"
    }

    PANDUAN KHUSUS PENOLAKAN:
    - Jika user ingin menolak/membatalkan pengajuan sewa tapi TIDAK memberikan alasan, set intent menjadi "CHATTING" dan minta alasan secara sopan (misal: "Boleh tahu alasan penolakannya Pak/Bu agar sistem bisa mengabari penyewa dengan jelas?").
    - Jika user memberikan alasan (misal: "Tolak ya, kamar sudah penuh"), set intent menjadi "REJECT_BOOKING" dan isi "rejection_reason" dengan alasan tersebut.

    PESAN USER: "${text}"
  `;

  try {
    const currentKey = GEMINI_KEYS.length > 0 ? GEMINI_KEYS[retries % GEMINI_KEYS.length] : "";

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!res.ok) {
        const errorBody = await res.text();
        if (retries < (GEMINI_KEYS.length - 1) && retries < 5) {
            const delay = 800;
            console.warn(`[Ultra-Log] Gemini Error ${res.status}: ${errorBody}. Rotating to next API key... (Attempt ${retries + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return analyzeWithAI(text, context, retries + 1);
        }
        console.error(`[Ultra-Log] Gemini Final Error ${res.status}: ${errorBody}`);
        throw new Error(`Gemini API Error: ${res.status}`);
    }
    const json = await res.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    try {
        return JSON.parse(cleanJson(rawText || "{}"));
    } catch (parseErr) {
        console.error(`[Ultra-Log] JSON Parse Error. Raw Text: ${rawText}`);
        throw parseErr;
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Ultra-Log] AI Error: ${errorMsg}`);
    
    // REGEX FALLBACK: Jika AI mati, coba tangkap intent dasar secara manual
    const upperText = text.toUpperCase();
    if (upperText.includes("TERIMA") || upperText.includes("SETUJU") || upperText.includes("ACC")) {
      if (context.pendingBookingsList.length > 0) {
        return { intent: "ACCEPT_BOOKING", transaction_id: context.pendingBookingsList[0].id };
      }
    }
    if (upperText.includes("TOLAK") || upperText.includes("BATAL") || upperText.includes("REJECT")) {
      if (context.pendingBookingsList.length > 0) {
        const reasonStr = text.length > 10 ? text : ""; // Jika pesan panjang, asumsikan itu alasannya
        return { intent: "REJECT_BOOKING", transaction_id: context.pendingBookingsList[0].id, rejection_reason: reasonStr };
      }
    }
    
    return { intent: "CHATTING", reply_text: "Mohon maaf Bapak/Ibu, sistem AI kami sedang sangat sibuk (Antrean Gemini). Silakan coba lagi atau ketik 'Terima'/'Tolak' dengan jelas untuk instruksi manual." };
  }
}

// ── WHATSAPP REPLY HELPER ─────────────────────────────────────────────────────
async function sendWAReply(to: string, text: string) {
  console.log(`[WA] Sending to ${to}: ${text}`);
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${WA_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } })
    });
    const data = await res.json();
    console.log("[WA-Log] Meta Response:", JSON.stringify(data));
  } catch (err) {
    console.error("[WA-Log] Network Error:", err instanceof Error ? err.message : err);
  }
}

// ── CORE WEBHOOK HANDLER ──────────────────────────────────────────────────────
serve(async (req) => {
  const url = new URL(req.url)

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode")
    const token = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")
    if (mode === "subscribe" && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 })
    return new Response("Forbidden", { status: 403 })
  }

  if (req.method === "POST") {
    try {
      const body = await req.json()
      console.log("[Ultra-Log] Request Body:", JSON.stringify(body));

      if (body.table === 'chat_messages' && body.record) {
        const messageRecord = body.record;
        
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('owner_id, property_id, properties(omnichannel_contact_phone, omnichannel_contact_name, title)')
          .eq('id', messageRecord.session_id)
          .single();

        if (sessionError) {
          console.error("[Notification-Error] Failed to fetch session:", JSON.stringify(sessionError));
        }

        if (session) {
          const propData = session.properties as any;
          let ownerPhone = propData.omnichannel_contact_phone;
          let ownerName = propData.omnichannel_contact_name || "Pemilik Kost";
          const propTitle = propData.title || "Kost Madani";

          if (!ownerPhone && session.owner_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.owner_id)
              .single();
            
            if (userData) {
              ownerPhone = userData.phone || userData.whatsapp || userData.phoneNumber;
              ownerName = userData.displayName || userData.full_name || userData.name || ownerName;
            }
          }

          if (!ownerPhone) {
            return new Response("No Recipient Found", { status: 200 });
          }
          
          const { data: senderData } = await supabase
            .from('users')
            .select('name, displayName')
            .eq('id', messageRecord.sender_id)
            .single();

          const senderName = senderData?.displayName || senderData?.name || (messageRecord.sender_type === 'owner' ? "Anda (Pemilik)" : "Calon Penghuni");
          const chatLink = `https://ruangsinggah.id/chat?session_id=${messageRecord.session_id}`;

          const notificationText = `Halo Pak/Ibu ${ownerName}, ada pesan baruu di RuangSinggah.id!\n\n` +
                                 `Properti: ${propTitle}\n` +
                                 `Pengirim: ${senderName}\n` +
                                 `Pesan: "${messageRecord.message}"\n\n` +
                                 `Balas di sini: ${chatLink}`;

          await sendWAReply(ownerPhone, notificationText);
        }
        return new Response("Notification Sent", { status: 200 });
      }

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value.messages) continue;

          for (const message of value.messages) {
            const from = message.from;
            const text = message.text?.body;
            if (!text) continue;

            const rawDigits = from.replace(/\D/g, '');
            // Normalize: use last 10 digits for better matching than 9, or a flexible pattern
            const normalizedPhone = rawDigits.startsWith('62') ? '0' + rawDigits.slice(2) : (rawDigits.startsWith('0') ? rawDigits : '0' + rawDigits);
            const searchSuffix = rawDigits.slice(-9);

            console.log(`[Ultra-Log] Processing message from ${from}. Normalized: ${normalizedPhone}, Suffix: ${searchSuffix}`);

            let ownerId = "";
            let userName = "Bapak/Ibu Mitra";
            let aggregatedProperties: any[] = [];

            const { data: matchedUsers } = await supabase
              .from('users')
              .select('id, name, role, phone, email')
              .or(`phone.ilike.%${searchSuffix}%,phone.eq.${normalizedPhone},phone.eq.${rawDigits}`);

            if (matchedUsers && matchedUsers.length > 0) {
              const sortedUsers = [...matchedUsers].sort((a, b) => {
                if (a.role === 'mitra' && b.role !== 'mitra') return -1;
                if (a.role !== 'mitra' && b.role === 'mitra') return 1;
                return 0;
              });

              for (const profile of sortedUsers) {
                const { data: ownedProps } = await supabase
                  .from('properties')
                  .select('id, title, price, room_types, owner_uid, omnichannel_contact_name')
                  .eq('owner_uid', profile.id);
                
                if (ownedProps && ownedProps.length > 0) {
                  ownedProps.forEach(p => {
                    if (!aggregatedProperties.find(existing => existing.id === p.id)) {
                      aggregatedProperties.push(p);
                    }
                  });
                  if (!ownerId) {
                    ownerId = profile.id;
                    userName = profile.name || userName;
                  }
                }
              }
            }

            const { data: omniProps } = await supabase
              .from('properties')
              .select('id, title, price, room_types, owner_uid, omnichannel_contact_name, omnichannel_contact_phone')
              .or(`omnichannel_contact_phone.ilike.%${searchSuffix}%,omnichannel_contact_phone.eq.${normalizedPhone},omnichannel_contact_phone.eq.${rawDigits}`);
            
            if (omniProps && omniProps.length > 0) {
              omniProps.forEach(op => {
                if (!aggregatedProperties.find(p => p.id === op.id)) {
                  aggregatedProperties.push(op);
                }
                if (!ownerId && op.owner_uid) ownerId = op.owner_uid;
                if (userName === "Bapak/Ibu Mitra" && op.omnichannel_contact_name) userName = op.omnichannel_contact_name;
              });
            }

            if (aggregatedProperties.length === 0) {
              await sendWAReply(from, "Halo! Nomor Anda belum terdaftar sebagai Mitra RuangSinggah.id. Silakan hubungi admin kami.");
              continue;
            }

            const propIds = aggregatedProperties.map(p => p.id);

            const { data: pendingTxData } = await supabase.from('transactions').select('*, user:user_id(name, phone)').eq('product_type', 'kost_booking').eq('status', 'PENDING_APPROVAL').in('product_id', propIds).order('created_at', { ascending: false });
            const pendingBookingsList = pendingTxData || [];

            const [unreadMsg, pendingSurveys] = await Promise.all([
              supabase.from('chat_messages').select('id', { count: 'exact' }).eq('is_read', false).in('session_id', 
                (await supabase.from('chat_sessions').select('id').eq('owner_id', ownerId)).data?.map(s => s.id) || []
              ),
              supabase.from('transactions').select('id', { count: 'exact' })
                .eq('product_type', 'survey')
                .eq('status', 'PENDING_APPROVAL')
                .in('product_id', propIds)
            ]);

            const stats = {
              unreadMessages: unreadMsg.count || 0,
              pendingBookings: pendingBookingsList.length,
              pendingSurveys: pendingSurveys.count || 0
            };

            try {
              console.log(`[Ultra-Log] Analyzing with AI...`);
              const aiResult = await analyzeWithAI(text, { properties: aggregatedProperties, stats, userName, pendingBookingsList })
              console.log(`[Ultra-Log] AI Intent: ${aiResult.intent}, Result:`, JSON.stringify(aiResult));

              if (aiResult.intent === "UPDATE_PRICE" && aiResult.property_id && aiResult.room_type_name) {
                const targetProp = aggregatedProperties.find(p => p.id === aiResult.property_id);
                if (targetProp) {
                  const updatedRoomTypes = (targetProp.room_types || []).map((rt: any) => {
                    if (rt.name === aiResult.room_type_name) return { ...rt, price: aiResult.new_value };
                    return rt;
                  });

                  const { error: updateError } = await supabase
                    .from('properties')
                    .update({ room_types: updatedRoomTypes, price: aiResult.new_value, updated_at: new Date() })
                    .eq('id', aiResult.property_id);

                  if (updateError) {
                    aiResult.reply_text = `Mohon maaf ${userName}, terjadi kendala saat mengupdate harga. Silakan coba lagi sebentar lagi.`;
                  } else {
                    aiResult.reply_text = `Selesai Bapak/Ibu! Harga kontribusi untuk ${aiResult.room_type_name} di ${targetProp.title} telah berhasil saya update menjadi ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(aiResult.new_value)}. Apakah ada hal lain yang bisa saya bantu?`;
                  }
                }
              } else if (aiResult.intent === "ACCEPT_BOOKING" || aiResult.intent === "REJECT_BOOKING") {
                if (!aiResult.transaction_id) {
                    aiResult.reply_text = "Mohon maaf, saya tidak dapat menemukan data pengajuan sewa yang aktif saat ini.";
                } else {
                    const txToUpdate = pendingBookingsList.find(t => t.id === aiResult.transaction_id);
                    if (txToUpdate) {
                       const isAccept = aiResult.intent === "ACCEPT_BOOKING";
                       const newStatus = isAccept ? "AWAITING_PAYMENT" : "REJECTED";
                       const amount = txToUpdate.amount;
                       let paymentLink = null;
                       const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
                       
                       const { data: doubleCheck } = await supabase.from('transactions').select('status, user_email').eq('id', txToUpdate.id).single();
                       console.log(`[Ultra-Log] Status Check for ${txToUpdate.id}: ${doubleCheck?.status}`);

                       if (doubleCheck && doubleCheck.status !== 'PENDING_APPROVAL') {
                           console.log(`[Ultra-Log] Transaction ${txToUpdate.id} already processed. Concurrency skipped.`);
                           aiResult.reply_text = `Bapak/Ibu, pengajuan sewa ini sepertinya sudah diproses sebelumnya (Status: ${doubleCheck.status}). Apakah ada hal lain?`;
                       } else {
                           const tenantId = txToUpdate.user_id;
                           const tenantName = (txToUpdate.user && (Array.isArray(txToUpdate.user) ? txToUpdate.user[0]?.name : txToUpdate.user.name)) || "Penyewa";
                           const itemName = txToUpdate.metadata?.kostName || txToUpdate.metadata?.item || "Kost";
                           let notifTitle = "";
                           let notifMessage = "";
    
                           if (isAccept) {
                               paymentLink = `https://app.pakasir.com/pay/ruangsinggah-id/${amount}?order_id=${txToUpdate.id}`;
                               updates.pakasir_link = paymentLink;
                               
                               notifTitle = "Pengajuan Disetujui!";
                               notifMessage = `Pengajuan sewa ${itemName} telah disetujui. Silakan cek menu tagihan untuk melakukan pembayaran.`;
                               
                               aiResult.reply_text = `Siap Bapak/Ibu ${userName}! Pengajuan sewa dari ${tenantName} telah saya "Terima" dan disetujui.\n\nTagihan pembayaran (Pakasir) telah diterbitkan ke dashboard penyewa secara otomatis. Ada pesan atau layanan lain yang bisa saya bantu?`;
                           } else {
                               const reason = aiResult.rejection_reason || "Maaf, pengajuan Anda belum dapat disetujui oleh pemilik saat ini.";
                               updates.metadata = { ...(txToUpdate.metadata || {}), rejection_reason: reason };
                               
                               notifTitle = "Pengajuan Ditolak";
                               notifMessage = `Mohon maaf, pengajuan sewa ${itemName} Anda belum dapat disetujui. Alasan: ${reason}`;
                               
                               aiResult.reply_text = `Baik Bapak/Ibu ${userName}. Pengajuan dari ${tenantName} telah saya "Tolak" dengan alasan: "${reason}". Penyewa telah menerima notifikasi tersebut. Apakah ada tugas lain?`;

                               // AUTO-FULL LOGIC: If reason contains "full" or "penuh", update property availability
                               if (reason.toLowerCase().includes("full") || reason.toLowerCase().includes("penuh")) {
                                   const propertyId = txToUpdate.product_id;
                                   const requestedRoom = txToUpdate.metadata?.roomType;
                                   
                                   if (propertyId) {
                                       const { data: propData } = await supabase.from('properties').select('room_types, title').eq('id', propertyId).single();
                                       if (propData && propData.room_types) {
                                           let updated = false;
                                           const newRoomTypes = propData.room_types.map((rt: any) => {
                                               // Match by name if available in metadata, otherwise just mark matching ones
                                               if (!requestedRoom || rt.name === requestedRoom) {
                                                   updated = true;
                                                   return { ...rt, isAvailable: false };
                                               }
                                               return rt;
                                           });
                                           
                                           if (updated) {
                                               await supabase.from('properties').update({ room_types: newRoomTypes }).eq('id', propertyId);
                                               aiResult.reply_text += `\n\nCatatan: Karena alasan "Full", saya telah otomatis mengubah status kamar ${requestedRoom || ''} di "${propData.title}" menjadi "Penuh" agar tidak ada pengajuan baru yang masuk.`;
                                               console.log(`[Ultra-Log] Auto-Full triggered for house ${propertyId}, room ${requestedRoom}`);
                                           }
                                       }
                                   }
                               }
                           }
    
                           // Execute Update Transaction
                           const { error: updateErr } = await supabase.from('transactions').update(updates).eq('id', txToUpdate.id);
                           
                           if (!updateErr) {
                               // Execute Insert In-App Notification (Matching Manual Process)
                               if (tenantId) {
                                   await supabase.from("notifications").insert([{
                                       user_id: tenantId,
                                       title: notifTitle,
                                       message: notifMessage,
                                       type: "rental",
                                       link: "/my-bookings"
                                   }]);
                               }
                           } else {
                               console.error(`[Mega-Debug] Error updating transaction ${txToUpdate.id}:`, updateErr);
                               aiResult.reply_text = `Mohon maaf, terjadi kesalahan sistem saat mencoba mengupdate pengajuan: ${updateErr.message}`;
                           }
                       }
                    } else {
                        aiResult.reply_text = "Mohon maaf, ID Booking/transaksi sudah tidak valid atau sudah kadaluwarsa.";
                    }
                }
              } else if (aiResult.intent === "GET_APPLICATIONS") {
                  if (pendingBookingsList.length === 0) {
                      aiResult.reply_text = "Bapak/Ibu, saat ini belum ada pengajuan sewa baru yang menunggu.";
                  } else {
                      const tickets = pendingBookingsList.map(tx => {
                          const tName = (tx.user && (Array.isArray(tx.user) ? tx.user[0]?.name : tx.user.name)) || "Penyewa";
                          const meta = tx.metadata || {};
                          const priceFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(tx.amount || 0);
                          return `Nama Kost: *${meta.kostName || "Property"}*
Penyewa: ${tName}
Jenis Kamar: ${meta.roomType || meta.item || "-"}
Jumlah Penghuni: ${meta.bookingDetails?.numberOfGuests || meta.guestCount || meta.occupantCount || 1}
Tanggal Masuk: ${meta.startDate || meta.bookingDetails?.checkInDate || meta.checkInDate || "-"}
Total Tagihan: ${priceFormatted}`;
                      }).join('\n\n---\n\n');

                      aiResult.reply_text = `*Bapak/Ibu, berikut adalah daftar ${pendingBookingsList.length} pengajuan sewa yang menanti persetujuan Anda:*\n\n${tickets}\n\nKetik *"Terima"* atau *"Tolak"* untuk memproses pengajuan tersebut.`;
                  }
              }

               if (!aiResult.reply_text && (aiResult.intent === "CHATTING" || !aiResult.intent)) {
                  aiResult.reply_text = "Halo Bapak/Ibu Mitra, ada yang bisa saya bantu terkait kost Anda hari ini?";
               }

               if (aiResult.reply_text) {
                  console.log(`[Ultra-Log] Sending WA Reply: ${aiResult.reply_text.substring(0, 50)}...`);
                  await sendWAReply(from, aiResult.reply_text)
              } else {
                  console.log(`[Ultra-Log] No reply_text to send for intent: ${aiResult.intent}. Sending fallback.`);
                  await sendWAReply(from, "Siap Pak/Bu, ada lagi yang bisa saya bantu terkait dashboard Anda?");
              }
            } catch (aiErr: any) {
              console.error(`[Ultra-Log] Error in AI/WA Logic:`, aiErr);
              await sendWAReply(from, `Waduh, maaf Pak/Bu, sistem lagi sedikit pusing (${aiErr.message || 'error'}). Boleh dicoba lagi sebentar lagi?`);
            }
          }
        }
      }

      return new Response("OK", { status: 200 })
    } catch (err) {
      console.error("[Ultra-Log] Fatal Error:", err);
      return new Response("OK", { status: 200 })
    }
  }

  return new Response("Not allowed", { status: 405 })
})
