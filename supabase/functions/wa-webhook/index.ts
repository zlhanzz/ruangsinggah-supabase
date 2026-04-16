import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ── CONFIGURATION ─────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || ""
const WA_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || ""
const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID') || ""
const VERIFY_TOKEN = "ruangsinggah_secret_token"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ── UTILS ─────────────────────────────────────────────────────────────────────
function cleanJson(text: string) {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

async function analyzeWithAI(text: string, context: { properties: any[], stats: any, userName: string, pendingBookingsList: any[] }) {
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

    DAFTAR PENGAJUAN SEWA MENUNGGU:
    ${context.pendingBookingsList.length === 0 ? "Tidak ada" : context.pendingBookingsList.map((tx: any) => `- ID Transaksi: ${tx.id}`).join('\n')}

    ATURAN JIKA USER MENJAWAB "TERIMA" ATAU "TOLAK":
    - Jika user merespon "Terima" atau "Tolak" (atau sinonimnya), Anda HARUS mengecek Daftar Pengajuan Sewa Menunggu di atas.
    - Jika ada minimal 1 pengajuan, set intent menjadi "ACCEPT_BOOKING" atau "REJECT_BOOKING", dan set "transaction_id" dengan ID Transaksi dari daftar tersebut (ambil yang paling pertama jika user tidak menyebut spesifik).
    - Jika kosong, beri tahu user dengan sopan bahwa tidak ada pengajuan sewa baru yang menunggu.

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
    - JANGAN BERIKAN TEMPLATE SAPAAN jika user hanya mencoba membalas "Terima". Langsung saja respon keberhasilan/kegagalan memproses konfirmasi.

    FORMAT OUTPUT (JSON SAJA):
    {
      "intent": "UPDATE_PRICE" | "GET_STATS" | "GET_MESSAGES" | "GET_APPLICATIONS" | "ACCEPT_BOOKING" | "REJECT_BOOKING" | "CHATTING",
      "property_id": "UUID (jika relevan)",
      "transaction_id": "UUID transaksi (Wajib ada Khusus ACCEPT/REJECT BOOKING)",
      "room_type_name": "Nama tipe kamar (khusus update harga)",
      "new_value": 1500000 (khusus update harga),
      "reply_text": "Balasan Anda"
    }

    PESAN USER: "${text}"
  `;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!res.ok) throw new Error(`Gemini API Error: ${res.status}`);
    const json = await res.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(cleanJson(rawText || "{}"));
  } catch (err) {
    console.error(`[Ultra-Log] AI Error: ${err.message}`);
    return { intent: "CHATTING", reply_text: "Mohon maaf Bapak/Ibu, saya sedang sedikit kendala teknis. Ada yang bisa saya bantu secara manual?" };
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
    console.error("[WA-Log] Network Error:", err);
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

      // ── HANDLER 1: SUPABASE TRIGGER (PROACTIVE NOTIFICATION) ──────────────────
      // Jika request datang dari Trigger Supabase saat ada pesan masuk di web
      if (body.table === 'chat_messages' && body.record) {
        const messageRecord = body.record;
        
        // Log basic trigger info
        console.log(`[Notification-Trigger] New message in session ${messageRecord.session_id} from ${messageRecord.sender_type}`);

        // Cari Owner & Nomor WA-nya
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('owner_id, property_id, properties(omnichannel_contact_phone, omnichannel_contact_name, title)')
          .eq('id', messageRecord.session_id)
          .single();

        if (sessionError) {
          console.error("[Notification-Error] Failed to fetch session:", JSON.stringify(sessionError));
        }

        if (session) {
          console.log("[Notification-Debug] Session data found:", JSON.stringify(session));
          const propData = session.properties as any;
          let ownerPhone = propData.omnichannel_contact_phone;
          let ownerName = propData.omnichannel_contact_name || "Pemilik Kost";
          const propTitle = propData.title || "Kost Madani";

          // FALLBACK: If omnichannel phone is empty, check owner's profile
          if (!ownerPhone && session.owner_id) {
            console.log(`[Notification-Debug] Omnichannel phone empty for owner ${session.owner_id}. Checking user profile...`);
            const { data: userData, error: ownerFetchError } = await supabase
              .from('users')
              .select('*') // Get everything to see what columns exist
              .eq('id', session.owner_id)
              .single();
            
            if (ownerFetchError) {
              console.error("[Notification-Debug] Error fetching owner profile:", JSON.stringify(ownerFetchError));
            }

            if (userData) {
              console.log("[Notification-Debug] Owner profile found:", JSON.stringify(userData));
              ownerPhone = userData.phone || userData.whatsapp || userData.phoneNumber;
              ownerName = userData.displayName || userData.full_name || userData.name || ownerName;
              if (ownerPhone) {
                console.log(`[Notification-Debug] Resolved owner phone: ${ownerPhone}`);
              } else {
                console.warn("[Notification-Debug] Owner record exists but all phone fields (phone, whatsapp, phoneNumber) are empty.");
              }
            } else {
              console.warn(`[Notification-Debug] No record found in 'users' table for ID: ${session.owner_id}`);
            }
          }

          if (!ownerPhone) {
            console.warn(`[Notification-Error] No phone number found for session ${messageRecord.session_id}. Notification aborted.`);
            return new Response("No Recipient Found", { status: 200 });
          }
          
          // Fetch sender's actual name from users table
          const { data: senderData } = await supabase
            .from('users')
            .select('name, displayName')
            .eq('id', messageRecord.sender_id)
            .single();

          const senderName = senderData?.displayName || senderData?.name || (messageRecord.sender_type === 'owner' ? "Anda (Pemilik)" : "Calon Penghuni");
          const chatLink = `https://ruangsinggah.id/chat?session_id=${messageRecord.session_id}`;

          console.log(`[Notification-Send] Sending WA to ${ownerPhone} for property ${propTitle}`);

          const notificationText = `Halo Pak/Ibu ${ownerName}, ada pesan baruu di RuangSinggah.id!\n\n` +
                                 `Properti: ${propTitle}\n` +
                                 `Pengirim: ${senderName}\n` +
                                 `Pesan: "${messageRecord.message}"\n\n` +
                                 `Balas di sini: ${chatLink}`;

          await sendWAReply(ownerPhone, notificationText);
        }
        return new Response("Notification Sent", { status: 200 });
      }

      // ── HANDLER 2: META WEBHOOK (USER CHATS ON WHATSAPP) ──────────────────────
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value.messages) continue;

          for (const message of value.messages) {
            const from = message.from;
            const text = message.text?.body;
            if (!text) continue;

            console.log(`[Ultra-Log] User Message: "${text}" from ${from}`);

            // MEGA-DEBUG: Extremely robust normalization
            const rawDigits = from.replace(/\D/g, '');
            const cleanPhone = rawDigits.slice(-9); // Use 9 digits as suffix match
            console.log(`[Mega-Debug] Incoming: ${from} | Digits: ${rawDigits} | Search Fragment: ${cleanPhone}`);

            let ownerId = "";
            let userName = "Bapak/Ibu Mitra";
            let aggregatedProperties: any[] = [];

            // STEP 1: Explicit Lookup in User Profiles (Multi-match)
            console.log(`[Mega-Debug] Searching users table for phone fragment: %${cleanPhone}%`);
            
            const { data: matchedUsers, error: lookupErr } = await supabase
              .from('users')
              .select('id, name, role, phone, email')
              .ilike('phone', `%${cleanPhone}%`);

            if (lookupErr) console.error("[Mega-Debug] Search error:", JSON.stringify(lookupErr));

            if (matchedUsers && matchedUsers.length > 0) {
              console.log(`[Mega-Debug] Found ${matchedUsers.length} user(s) matching this phone fragment.`);
              
              // SORT: Prioritize users with role === 'mitra'
              const sortedUsers = [...matchedUsers].sort((a, b) => {
                if (a.role === 'mitra' && b.role !== 'mitra') return -1;
                if (a.role !== 'mitra' && b.role === 'mitra') return 1;
                return 0;
              });

              for (const profile of sortedUsers) {
                console.log(`[Mega-Debug] Checking properties for user: ${profile.name} (${profile.id}) [Role: ${profile.role}]`);
                
                const { data: ownedProps, error: propErr } = await supabase
                  .from('properties')
                  .select('id, title, price, room_types, owner_uid, omnichannel_contact_name')
                  .eq('owner_uid', profile.id);
                
                if (propErr) console.error(`[Mega-Debug] Property fetch error for ${profile.id}:`, JSON.stringify(propErr));
                
                if (ownedProps && ownedProps.length > 0) {
                  console.log(`[Mega-Debug] Found ${ownedProps.length} property(s) for ${profile.name}.`);
                  // Add unique properties to the pool
                  ownedProps.forEach(p => {
                    if (!aggregatedProperties.find(existing => existing.id === p.id)) {
                      aggregatedProperties.push(p);
                    }
                  });
                  // First profile (mitra prioritized) with properties becomes our primary identity
                  if (!ownerId) {
                    ownerId = profile.id;
                    userName = profile.name || userName;
                    console.log(`[Mega-Debug] Primary identity established: ${userName} (${ownerId})`);
                  }
                }
              }
            } else {
              console.log("[Mega-Debug] No match found in Users table.");
            }

            // STEP 3: Fallback / Aggregate Omnichannel Listings
            console.log(`[Mega-Debug] Checking properties table for omnichannel phone fragment: %${cleanPhone}%`);
            const { data: omniProps, error: omniErr } = await supabase
              .from('properties')
              .select('id, title, price, room_types, owner_uid, omnichannel_contact_name, omnichannel_contact_phone')
              .ilike('omnichannel_contact_phone', `%${cleanPhone}%`);
            
            if (omniErr) console.error("[Mega-Debug] Omnichannel search error:", JSON.stringify(omniErr));

            if (omniProps && omniProps.length > 0) {
              console.log(`[Mega-Debug] OMNICHANNEL MATCH: Found ${omniProps.length} property(s) via omnichannel field.`);
              omniProps.forEach(op => {
                if (!aggregatedProperties.find(p => p.id === op.id)) {
                  aggregatedProperties.push(op);
                }
                if (!ownerId && op.owner_uid) ownerId = op.owner_uid;
                if (userName === "Bapak/Ibu Mitra" && op.omnichannel_contact_name) userName = op.omnichannel_contact_name;
              });
            }

            if (aggregatedProperties.length === 0) {
              console.warn(`[Mega-Debug] FINAL RESULT: No properties found for fragment ${cleanPhone}. Aborting.`);
              await sendWAReply(from, "Halo! Nomor Anda belum terdaftar sebagai Mitra RuangSinggah.id. Silakan hubungi admin kami.");
              continue;
            }

            console.log(`[Mega-Debug] SUCCESS: Proceeding with ${aggregatedProperties.length} property(s) for owner ${userName}.`);
            const propIds = aggregatedProperties.map(p => p.id);

            // Fetch Comprehensive Dashboard Stats including pending transaction records
            const { data: pendingTxData } = await supabase.from('transactions').select('*, user:user_id(name, phone)').eq('product_type', 'kost_booking').eq('status', 'PENDING_APPROVAL').in('product_id', propIds).order('created_at', { ascending: false });
            const pendingBookingsList = pendingTxData || [];

            const [unreadMsg, pendingSurveys, sessions] = await Promise.all([
              supabase.from('chat_messages').select('id', { count: 'exact' }).eq('is_read', false).in('session_id', 
                (await supabase.from('chat_sessions').select('id').eq('owner_id', ownerId)).data?.map(s => s.id) || []
              ),
              supabase.from('transactions').select('id', { count: 'exact' })
                .eq('product_type', 'survey')
                .eq('status', 'PENDING_APPROVAL')
                .in('product_id', propIds),
              supabase.from('chat_sessions').select('id').eq('owner_id', ownerId)
            ]);

            const stats = {
              unreadMessages: unreadMsg.count || 0,
              pendingBookings: pendingBookingsList.length,
              pendingSurveys: pendingSurveys.count || 0
            };

            try {
              const aiResult = await analyzeWithAI(text, { properties: aggregatedProperties, stats, userName, pendingBookingsList })

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
                       
                       // Tenant Details
                       const tenantId = txToUpdate.user_id;
                       const tenantName = Array.isArray(txToUpdate.user) ? txToUpdate.user[0]?.name : txToUpdate.user?.name || "Penyewa";
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
                           notifTitle = "Pengajuan Ditolak";
                           notifMessage = `Mohon maaf, pengajuan sewa ${itemName} Anda belum dapat disetujui oleh pemilik.`;
                           
                           aiResult.reply_text = `Baik Bapak/Ibu ${userName}. Pengajuan tersebut telah saya "Tolak" dan penyewa bersangkutan telah menerima notifikasi permohonan maaf di akunnya. Apakah ada tugas lain?`;
                       }

                       // Execute Update Transaction
                       await supabase.from('transactions').update(updates).eq('id', txToUpdate.id);

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
                        aiResult.reply_text = "Mohon maaf, ID Booking/transaksi sudah tidak valid atau sudah kadaluwarsa.";
                    }
                }
              }

              await sendWAReply(from, aiResult.reply_text)
            } catch (aiErr) {
              await sendWAReply(from, `Mohon maaf Bapak/Ibu, saya sedang sedikit gangguan. Silakan hubungi tim IT kami jika masalah berlanjut.`);
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
