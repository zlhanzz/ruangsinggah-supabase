import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Clock, Check, CheckCheck, ChevronLeft } from 'lucide-react';
import { ChatSession, ChatMessage, getChatMessages, sendMessage, subscribeToMessages, markMessagesAsRead } from '../chatService';

interface ChatWindowProps {
  session: ChatSession;
  currentUser: any;
  onClose: () => void;
  propertyName?: string;
  contactName?: string;
  contactType?: 'owner' | 'caretaker' | 'admin' | 'manager';
  isEmbedded?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ session, currentUser, onClose, propertyName, contactName, contactType, isEmbedded }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Identitas pengirim saat ini di tingkat komponen (diakses oleh loadMessages, useEffect, dan handleSendMessage)
  const currentId = currentUser?.uid || currentUser?.id || '';
  const currentSenderType: 'user' | 'owner' = currentId === session.user_id ? 'user' : 'owner';

  useEffect(() => {
    loadMessages();
    if (currentSenderType) {
      markMessagesAsRead(session.id, currentSenderType);
    }
    
    // Subscribe ke pesan baru & update status baca secara real-time
    const subscription = subscribeToMessages(session.id, (msg, eventType) => {
      setMessages((prev) => {
        // 1. Jika event UPDATE (misal status is_read berubah), perbarui pesan yang ada
        if (eventType === 'UPDATE' || prev.some(m => m.id === msg.id)) {
          return prev.map(m => m.id === msg.id ? msg : m);
        }

        // 2. Jika ada pesan optimistik lokal dari pengirim yang sama dengan teks yang sama, ganti posisinya
        const optimisticIndex = prev.findIndex(
          m => m.sender_id === msg.sender_id && 
               m.sender_type === msg.sender_type && 
               m.message.trim() === msg.message.trim() &&
               (!m.id.includes('-') || m.id.length < 20)
        );

        if (optimisticIndex !== -1) {
          const updated = [...prev];
          updated[optimisticIndex] = msg;
          return updated;
        }

        // Jika pesan datang dari lawan bicara saat window terbuka, tandai sebagai dibaca
        if (msg.sender_type !== currentSenderType) {
          markMessagesAsRead(session.id, currentSenderType);
        }

        return [...prev, msg];
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [session.id, currentSenderType]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await getChatMessages(session.id);
      setMessages(msgs);
      if (currentSenderType) {
        markMessagesAsRead(session.id, currentSenderType);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessages.size > 0) return;

    const tempId = Date.now().toString();
    setSendingMessages(prev => new Set(prev).add(tempId));
    
    // Add optimistic message
    const optimisticMsg: ChatMessage = {
      id: tempId,
      session_id: session.id,
      sender_id: currentId,
      sender_type: currentSenderType,
      message: newMessage.trim(),
      is_read: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');

    try {
      if (!currentId) throw new Error("ID User tidak ditemukan. Silakan login ulang.");
      const senderType = optimisticMsg.sender_type;
      const savedMsg = await sendMessage(session.id, currentId, senderType, optimisticMsg.message);
      if (savedMsg && savedMsg.id) {
        setMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m));
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert(`Gagal mengirim pesan: ${err.message || 'Coba lagi nanti'}`);
    } finally {
      setSendingMessages(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  };

  if (isEmbedded) {
    return (
      <div className="flex flex-col h-full bg-white overflow-hidden">
        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
        >
          {loading ? (
             <div className="flex justify-center py-10">
               <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
             </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 px-10">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                <MessageSquare className="w-8 h-8 text-gray-300" />
              </div>
              <h4 className="text-gray-900 font-black uppercase text-[10px] tracking-widest mb-1">Belum Ada Pesan</h4>
            </div>
          ) : (
              messages.map((msg, idx) => {
                const currentId = currentUser.uid || currentUser.id;
                const isMe = msg.sender_id === currentId;
                const isTemp = !msg.id || (!msg.id.includes('-') && msg.id.length < 20);

                return (
                  <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                    <div className={`max-w-[85%] rounded-[1.25rem] px-4 py-2.5 shadow-sm relative ${isMe ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                      <p className="text-[12px] font-medium leading-relaxed">{msg.message}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[8px] font-bold uppercase ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {isMe && (
                          <span className="inline-flex items-center ml-0.5" title={msg.is_read ? "Dibaca" : isTemp ? "Mengirim..." : "Terkirim ke server"}>
                            {msg.is_read ? (
                              <CheckCheck size={12} className="text-sky-300 stroke-[2.5]" />
                            ) : isTemp ? (
                              <Check size={11} className="text-white/60" />
                            ) : (
                              <CheckCheck size={12} className="text-white/60" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-50 flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik balasan..."
            maxLength={1000}
            className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sendingMessages.size > 0}
            className="w-11 h-11 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 active:scale-90 transition-all disabled:bg-gray-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg h-full sm:h-[600px] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="bg-gray-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <MessageSquare className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight leading-none mb-1">
                {propertyName || 'RuangSinggah Chat'}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> 
                {(() => {
                  const isKM = contactType === 'admin' || contactType === 'manager' || contactName?.toLowerCase().includes('kostmanager');
                  const roleLabel = isKM ? 'Pengelola Resmi' : (contactType === 'caretaker' ? 'Penjaga Kost' : 'Pemilik Kost');
                  return contactName ? `${contactName} (${roleLabel})` : roleLabel;
                })()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Messages List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 px-10">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                <MessageSquare className="w-10 h-10 text-gray-300" />
              </div>
              <h4 className="text-gray-900 font-black uppercase text-xs tracking-widest mb-2">Belum Ada Pesan</h4>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const currentId = currentUser.uid || currentUser.id;
              const isMe = msg.sender_id === currentId;
              const isTemp = !msg.id || (!msg.id.includes('-') && msg.id.length < 20);

              return (
                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[80%] rounded-3xl px-5 py-3.5 shadow-sm relative ${isMe ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                    <p className="text-[13px] font-medium leading-relaxed">{msg.message}</p>
                    <div className={`flex items-center gap-1.5 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-[9px] font-bold uppercase ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {isMe && (
                        <span className="inline-flex items-center ml-0.5" title={msg.is_read ? "Dibaca" : isTemp ? "Mengirim..." : "Terkirim ke server"}>
                          {msg.is_read ? (
                            <CheckCheck size={14} className="text-sky-300 stroke-[2.5]" />
                          ) : isTemp ? (
                            <Check size={13} className="text-white/60" />
                          ) : (
                            <CheckCheck size={14} className="text-white/60" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-100 flex items-center gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik balasan..."
            maxLength={1000}
            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sendingMessages.size > 0}
            className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all disabled:bg-gray-100"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
