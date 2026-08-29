import { supabase } from './supabase';
import { sendNotification } from './notificationService';

// Primary Administrator UUID (admin@ruangsinggah.id) terdaftar di public.users
export const SYSTEM_ADMIN_ID = '8c8b8d89-0114-4c0c-a814-27055fc777fc';

function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export interface ChatSession {
  id: string;
  user_id: string;
  owner_id: string;
  property_id?: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  owner?: any;
  user?: any;
  property?: any;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  sender_type: 'user' | 'owner';
  message: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Memastikan profil user ada di tabel public.users sebelum melakukan operasi yang memerlukan foreign key
 */
async function ensureUserProfileExists(userId: string): Promise<void> {
  // Ambil data auth terlebih dahulu untuk mendapatkan data terbaru
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authUser || authUser.id !== userId) {
    throw new Error('Gagal memverifikasi identitas Anda. Silakan login ulang.');
  }

  const metadata = authUser.user_metadata || {};
  const userName = metadata.full_name || metadata.name || metadata.displayName || authUser.email?.split('@')[0] || 'User Baru';
  const photoUrl = metadata.avatar_url || metadata.picture || '';

  // 1. Cek apakah email ini sudah digunakan oleh ID LAIN (Conflict Prevention)
  if (authUser.email) {
    const { data: conflictingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', authUser.email)
      .neq('id', userId) // Cari yang ID-nya bukan ID saya
      .maybeSingle();

    if (conflictingUser) {
      console.warn(`Email conflict detected: ${authUser.email} is already owned by user ${conflictingUser.id}. Skipping automatic profile update.`);
      // Kita skip upsert untuk menghindari Error 23505
      return; 
    }
  }

  // 2. Gunakan UPSERT: Masukkan data jika belum ada, abaikan jika sudah ada (id sebagai kunci utama)
  const { error: upsertError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: authUser.email,
      name: userName,
      full_name: userName, // Synchronize both name fields to satisfy NOT NULL constraint
      photo_url: photoUrl,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (upsertError) {
    console.error('CRITICAL: Failed to sync user profile:', upsertError);
    // Jika error karena RLS (403/Policy), kita harus memberitahu user
    throw new Error(`Sistem gagal mendaftarkan profil Anda (Error: ${upsertError.code}). Silakan hubungi Admin RS.`);
  }
}

/**
 * Mendapatkan atau membuat sesi chat antara user dan owner
 */
export async function getOrCreateChatSession(
  userId: string, 
  ownerId: string, 
  propertyId?: string,
  requesterName?: string,
  requesterPhoto?: string
): Promise<ChatSession> {
  // 0. Ensure user profile exists in public.users to avoid FK violations
  await ensureUserProfileExists(userId);

  // Normalize ownerId if it matches legacy placeholder
  const finalOwnerId = (ownerId === 'admin-system-id' || !isValidUUID(ownerId)) 
    ? SYSTEM_ADMIN_ID 
    : ownerId;

  // 1. Cek apakah sudah ada sesi untuk user dan properti ini (cegah duplikasi)
  let query = supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId);
    
  if (propertyId) {
    query = query.eq('property_id', propertyId);
  } else {
    query = query.eq('owner_id', finalOwnerId).is('property_id', null);
  }

  const { data: existingSessions, error: fetchError } = await query.order('created_at', { ascending: false });

  if (fetchError) {
    console.error('Error fetching chat session:', fetchError);
    throw fetchError;
  }

  if (existingSessions && existingSessions.length > 0) {
    const existing = existingSessions[0];
    // Jika status kelola properti berubah (misal upgrade ke KostManager), sinkronkan owner_id
    if (existing.owner_id !== finalOwnerId) {
      await supabase
        .from('chat_sessions')
        .update({ owner_id: finalOwnerId })
        .eq('id', existing.id);
      existing.owner_id = finalOwnerId;
    }
    return existing;
  }

  // Buat sesi baru jika belum ada
  // RLS BYPASS: Proactively tunnel the requester's name/photo so the Mitra can see it immediately
  let initialMetadata = '';
  
  // Use provided name/photo first (Frontend Injection)
  const name = requesterName || 'Calon Penghuni';
  const photo = requesterPhoto || '';
  initialMetadata = `${name}|||${photo}|||Mulai percakapan...`;

  const { data: newSession, error: createError } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      owner_id: finalOwnerId,
      property_id: propertyId,
      last_message: initialMetadata
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating chat session:', createError);
    throw createError;
  }

  return newSession;
}

/**
 * Mengambil semua pesan dalam satu sesi
 */
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }

  return data || [];
}

import { notifyMitra } from './notificationBridge';

/**
 * Mengirim pesan baru
 */
export async function sendMessage(
  sessionId: string, 
  senderId: string, 
  senderType: 'user' | 'owner', 
  content: string,
  optName?: string,
  optPhoto?: string
) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      sender_id: senderId,
      sender_type: senderType,
      message: content
    })
    .select()
    .single();

  if (error) {
    console.error('[Ultra-Log] Error sending message to DB:', error);
    throw new Error(`Gagal mengirim ke DB: ${error.message}`);
  }

  // Update last_message di sesi untuk preview di daftar chat
  // RLS BYPASS: Store sender metadata in last_message so the recipient can read it
  let tunneledMessage = content;
  
  if (senderType === 'user') {
    const name = optName || 'Calon Penghuni';
    const photo = optPhoto || '';
    tunneledMessage = `${name}|||${photo}|||${content}`;
  } else {
    // If sender is OWNER, we must PRESERVE the existing tenant metadata from the previous last_message
    try {
      const { data: currentSession } = await supabase
        .from('chat_sessions')
        .select('last_message')
        .eq('id', sessionId)
        .single();
      
      if (currentSession?.last_message?.includes('|||')) {
        const parts = currentSession.last_message.split('|||');
        if (parts.length >= 3) {
          const tenantName = parts[0];
          const tenantPhoto = parts[1];
          tunneledMessage = `${tenantName}|||${tenantPhoto}|||${content}`;
        }
      }
    } catch (e) {
      console.error('Failed to preserve metadata during owner reply:', e);
    }
  }

  const { error: sessionError } = await supabase
    .from('chat_sessions')
    .update({
      last_message: tunneledMessage,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (sessionError) {
    console.error('Error updating session last message:', sessionError);
  }

  // Notify recipient
  try {
    const { data: session } = await supabase
      .from('chat_sessions')
      .select(`
        user_id, 
        owner_id, 
        property_id,
        property:property_id (title)
      `)
      .eq('id', sessionId)
      .single();

    if (session && senderType === 'user') {
      // RLS RESILIENT NAME LOOKUP: 
      // 1. Try optName (frontend injection)
      // 2. Try direct lookup from users table (bypasses join restrictions)
      let senderName = optName;
      if (!senderName) {
        const { data: senderProfile } = await supabase
          .from('users')
          .select('name')
          .eq('id', senderId)
          .maybeSingle();
        senderName = senderProfile?.name;
      }

      // User -> Owner: Notify Mitra via WhatsApp
      await notifyMitra({
        ownerId: session.owner_id,
        propertyId: (session as any).property_id,
        type: 'chat',
        details: {
          propertyTitle: (session as any).property?.title || 'Kost Anda',
          senderName: senderName || 'Calon Penghuni',
          messageSnippet: content.length > 50 ? content.substring(0, 50) + '...' : content,
          sessionId: sessionId
        }
      });
    } else if (session && senderType === 'owner') {
      // Owner -> User: Site notification only for now
      sendNotification(
        session.user_id,
        'Pesan Baru',
        content.length > 60 ? content.substring(0, 60) + '...' : content,
        'info',
        { sessionId, link: '/my-bookings' }
      ).catch(err => console.error("Failed to create chat notification:", err));
    }
  } catch (err) {
    console.error("Error in notification trigger:", err);
  }

  return data;
}

/**
 * Menandai semua pesan dalam sesi yang ditujukan kepada pembaca sebagai sudah dibaca (is_read = true)
 */
export async function markMessagesAsRead(sessionId: string, readerSenderType: 'user' | 'owner') {
  try {
    const targetSenderType = readerSenderType === 'user' ? 'owner' : 'user';
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('session_id', sessionId)
      .eq('sender_type', targetSenderType)
      .eq('is_read', false);

    if (error) {
      console.warn('Error marking messages as read:', error);
    }
  } catch (err) {
    console.warn('Failed to mark messages as read:', err);
  }
}

/**
 * Subscribe ke pesan baru & status update pembacaan secara real-time
 */
export function subscribeToMessages(
  sessionId: string, 
  onMessage: (message: ChatMessage, eventType?: 'INSERT' | 'UPDATE') => void
) {
  return supabase
    .channel(`chat:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        if (payload.new && (payload.new as any).id) {
          onMessage(payload.new as ChatMessage, payload.eventType as 'INSERT' | 'UPDATE');
        }
      }
    )
    .subscribe();
}

/**
 * Subscribe ke update sesi chat (misal penambahan sesi baru atau pembaruan last_message)
 */
export function subscribeToChatSessions(onSessionChange: () => void) {
  return supabase
    .channel('public:chat_sessions_realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_sessions'
      },
      () => {
        onSessionChange();
      }
    )
    .subscribe();
}

/**
 * Mendapatkan daftar semua sesi chat milik user
 */
export async function getMyChatSessions(userId: string): Promise<ChatSession[]> {
  // 1. Fetch raw sessions with property details
  const { data: sessions, error } = await supabase
    .from('chat_sessions')
    .select(`
      *,
      property:property_id (title)
    `)
    .or(`user_id.eq.${userId},owner_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching my chat sessions:', error);
    return [];
  }

  if (!sessions || sessions.length === 0) return [];

  // 2. Fetch Profiles separately to prevent join issues
  const uniqueUserIds = [...new Set([
    ...sessions.map(s => s.user_id),
    ...sessions.map(s => s.owner_id)
  ])].filter(Boolean);

  const { data: profiles } = await supabase
    .from('users')
    .select('id, name, photo_url')
    .in('id', uniqueUserIds);

  const profileMap = new Map();
  profiles?.forEach((p: any) => {
    profileMap.set(p.id, {
      name: p.name,
      photo_url: p.photo_url || p.avatar_url || ''
    });
  });

  // 3. RLS BYPASS: If names are still missing (due to Supabase restrictions),
  // try to find them via 'transactions' table which usually allows owner-to-tenant joins.
  const missingIds = uniqueUserIds.filter(id => !profileMap.get(id)?.name);
  if (missingIds.length > 0) {
    const { data: transProfiles } = await supabase
      .from('transactions')
      .select(`
        user_id,
        user:user_id (name, photo_url)
      `)
      .in('user_id', missingIds);

    transProfiles?.forEach(tp => {
      const u = (tp as any).user;
      if (u && !profileMap.get(tp.user_id)?.name) {
        profileMap.set(tp.user_id, {
          name: u.name || 'Calon Penghuni',
          photo_url: u.photo_url || ''
        });
      }
    });
  }

  // 3.5. Fetch unread messages for user
  const sessionIds = sessions.map(s => s.id);
  const { data: unreadRows } = sessionIds.length > 0
    ? await supabase
        .from('chat_messages')
        .select('session_id')
        .in('session_id', sessionIds)
        .neq('sender_id', userId)
        .eq('is_read', false)
    : { data: [] };

  const unreadMap = new Map<string, number>();
  unreadRows?.forEach((r: any) => {
    unreadMap.set(r.session_id, (unreadMap.get(r.session_id) || 0) + 1);
  });

  // 3.6. Fetch session IDs with actual messages (filter out empty sessions)
  const { data: messageCounts } = sessionIds.length > 0
    ? await supabase
        .from('chat_messages')
        .select('session_id')
        .in('session_id', sessionIds)
    : { data: [] };

  const activeSessionIds = new Set((messageCounts || []).map(m => m.session_id));

  // 4. Map back to sessions, filter empty ones, and parse tunneled metadata
  return sessions
    .filter(s => activeSessionIds.has(s.id))
    .map(s => {
    let ownerInfo = profileMap.get(s.owner_id) || { name: 'Pemilik', photo_url: '' };
    let userInfo = profileMap.get(s.user_id) || { name: 'Calon Penghuni', photo_url: '' };
    let cleanMessage = s.last_message || '';

    // PARSE TUNNELED METADATA: NAME|||PHOTO|||MESSAGE
    if (s.last_message?.includes('|||')) {
      const parts = s.last_message.split('|||');
      if (parts.length >= 3) {
        const tunneledName = parts[0];
        const tunneledPhoto = parts[1];
        cleanMessage = parts.slice(2).join('|||');

        // Update userInfo if it's currently generic
        if (userInfo.name === 'Calon Penghuni' || !userInfo.name) {
          userInfo = {
            name: tunneledName,
            photo_url: tunneledPhoto || userInfo.photo_url
          };
        }
      }
    }
    
    return {
      ...s,
      last_message: cleanMessage,
      unread_count: unreadMap.get(s.id) || 0,
      user: userInfo,
      owner: ownerInfo
    };
  }) as ChatSession[];
}

/**
 * Mendapatkan daftar sesi chat untuk seluruh properti yang dikelola KostManager
 */
export async function getKostManagerChatSessions(managedPropertyIds: string[]): Promise<ChatSession[]> {
  try {
    // 1. Fetch raw sessions where owner_id = SYSTEM_ADMIN_ID (Hanya chat yang masuk di era KostManager)
    let query = supabase.from('chat_sessions').select('*').eq('owner_id', SYSTEM_ADMIN_ID);
    
    if (managedPropertyIds && managedPropertyIds.length > 0) {
      query = query.in('property_id', managedPropertyIds);
    }

    const { data: sessions, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching KostManager chat sessions:', error);
      return [];
    }

    if (!sessions || sessions.length === 0) return [];

    // 2. Fetch Properties details separately to avoid schema relationship / column errors
    const propIds = [...new Set(sessions.map(s => s.property_id))].filter(Boolean);
    const { data: propRows } = propIds.length > 0
      ? await supabase.from('properties').select('id, title, address, city, price, type, images, image_urls, room_types').in('id', propIds)
      : { data: [] };

    const propMap = new Map();
    propRows?.forEach((p: any) => {
      propMap.set(p.id, p);
    });

    // 3. Fetch User profiles
    const uniqueUserIds = [...new Set(sessions.map(s => s.user_id))].filter(Boolean);
    const { data: profiles } = uniqueUserIds.length > 0
      ? await supabase.from('users').select('id, name, photo_url').in('id', uniqueUserIds)
      : { data: [] };

    const profileMap = new Map();
    profiles?.forEach((p: any) => {
      profileMap.set(p.id, {
        name: p.name,
        photo_url: p.photo_url || p.avatar_url || ''
      });
    });

    // 3.5. Fetch Unread Message Counts for CS
    const sessionIds = sessions.map(s => s.id);
    const { data: unreadRows } = sessionIds.length > 0
      ? await supabase
          .from('chat_messages')
          .select('session_id')
          .in('session_id', sessionIds)
          .eq('sender_type', 'user')
          .eq('is_read', false)
      : { data: [] };

    const unreadMap = new Map<string, number>();
    unreadRows?.forEach((r: any) => {
      unreadMap.set(r.session_id, (unreadMap.get(r.session_id) || 0) + 1);
    });

    // 3.6. Fetch session IDs with actual messages (filter out empty sessions)
    const { data: messageCounts } = sessionIds.length > 0
      ? await supabase
          .from('chat_messages')
          .select('session_id')
          .in('session_id', sessionIds)
      : { data: [] };

    const activeSessionIds = new Set((messageCounts || []).map(m => m.session_id));

    // 4. Map back to sessions, filter empty ones, and parse tunneled metadata
    return sessions
      .filter(s => activeSessionIds.has(s.id))
      .map(s => {
      let userInfo = profileMap.get(s.user_id) || { name: 'Calon Penghuni', photo_url: '' };
      let cleanMessage = s.last_message || '';

      if (s.last_message?.includes('|||')) {
        const parts = s.last_message.split('|||');
        if (parts.length >= 3) {
          const tunneledName = parts[0];
          const tunneledPhoto = parts[1];
          cleanMessage = parts.slice(2).join('|||');

          if (userInfo.name === 'Calon Penghuni' || !userInfo.name) {
            userInfo = {
              name: tunneledName,
              photo_url: tunneledPhoto || userInfo.photo_url
            };
          }
        }
      }

      const propData = propMap.get(s.property_id) || null;

      return {
        ...s,
        property: propData,
        last_message: cleanMessage,
        unread_count: unreadMap.get(s.id) || 0,
        user: userInfo,
        owner: { name: 'Tim KostManager RuangSinggah', photo_url: '' }
      };
    }) as ChatSession[];
  } catch (err) {
    console.error('Exception fetching KostManager chat sessions:', err);
    return [];
  }
}
