import { supabase } from './supabase';
import { sendNotification } from './notificationService';

// Fallback UUID for properties without owners. Change this to your real Admin UUID.
export const SYSTEM_ADMIN_ID = '00000000-0000-0000-0000-000000000000';

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
 * Mendapatkan atau membuat sesi chat antara user dan owner
 */
export async function getOrCreateChatSession(userId: string, ownerId: string, propertyId?: string): Promise<ChatSession> {
  // Normalize ownerId if it matches legacy placeholder
  const finalOwnerId = (ownerId === 'admin-system-id' || !isValidUUID(ownerId)) 
    ? SYSTEM_ADMIN_ID 
    : ownerId;

  // Cek apakah sudah ada sesi untuk kombinasi ini
  let query = supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('owner_id', finalOwnerId);
    
  if (propertyId) {
    query = query.eq('property_id', propertyId);
  } else {
    query = query.is('property_id', null);
  }

  const { data: existing, error: fetchError } = await query.maybeSingle();

  if (fetchError) {
    console.error('Error fetching chat session:', fetchError);
    throw fetchError;
  }

  if (existing) return existing;

  // Buat sesi baru jika belum ada
  const { data: newSession, error: createError } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      owner_id: finalOwnerId,
      property_id: propertyId
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

/**
 * Mengirim pesan baru
 */
export async function sendMessage(sessionId: string, senderId: string, senderType: 'user' | 'owner', content: string) {
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
  const { error: sessionError } = await supabase
    .from('chat_sessions')
    .update({
      last_message: content,
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
      .select('user_id, owner_id')
      .eq('id', sessionId)
      .single();

    if (session) {
      const recipientId = senderType === 'user' ? session.owner_id : session.user_id;
      // We don't have sender name here easily, so we use a generic title
      sendNotification(
        recipientId,
        'Pesan Baru',
        content.length > 60 ? content.substring(0, 60) + '...' : content,
        'info', // We didn't define 'chat' as a valid type in notificationService
        { sessionId, link: '/my-bookings' }
      ).catch(err => console.error("Failed to create chat notification:", err));
    }
  } catch (err) {
    console.error("Error in notification trigger:", err);
  }

  return data;
}

/**
 * Subscribe ke pesan baru secara real-time
 */
export function subscribeToMessages(sessionId: string, onMessage: (message: ChatMessage) => void) {
  return supabase
    .channel(`chat:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();
}

/**
 * Mendapatkan daftar semua sesi chat milik user
 */
export async function getMyChatSessions(userId: string): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select(`
      *,
      owner:owner_id (name, photo_url),
      user:user_id (name, photo_url),
      property:property_id (title)
    `)
    .or(`user_id.eq.${userId},owner_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching my chat sessions:', error);
    return [];
  }

  return data || [];
}
