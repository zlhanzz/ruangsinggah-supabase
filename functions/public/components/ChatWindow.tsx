import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Clock, Check, CheckCheck, ChevronLeft, ShieldAlert, ShieldCheck, Home, Zap, Sparkles } from 'lucide-react';
import { ChatSession, ChatMessage, getChatMessages, sendMessage, subscribeToMessages, markMessagesAsRead, containsPhoneNumber } from '../chatService';

interface ChatWindowProps {
  session: ChatSession;
  currentUser: any;
  onClose: () => void;
  propertyName?: string;
  contactName?: string;
  contactType?: 'owner' | 'caretaker' | 'admin' | 'manager';
  isEmbedded?: boolean;
  onMessagesRead?: () => void;
  propertyPhoto?: string;
  roomNumber?: string;
  roomType?: string;
  roomPrice?: number;
  propertyId?: string;
  onRentClick?: () => void;
}

const QUICK_REPLIES = [
  'Apakah kamar ini masih tersedia?',
  'Berapa biaya listrik & airnya?',
  'Apakah ada jam malam atau aturan tamu?',
  'Apakah bisa survey lokasi resmi via RuangSinggah?'
];

const ChatWindow: React.FC<ChatWindowProps> = ({
  session,
  currentUser,
  onClose,
  propertyName,
  contactName,
  contactType,
  isEmbedded,
  onMessagesRead,
  propertyPhoto,
  roomNumber,
  roomType,
  roomPrice,
  propertyId,
  onRentClick
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set());
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Identitas pengirim saat ini di tingkat komponen (diakses oleh loadMessages, useEffect, dan handleSendMessage)
  const currentId = currentUser?.uid || currentUser?.id || '';
  const currentSenderType: 'user' | 'owner' = currentId === session.user_id ? 'user' : 'owner';

  useEffect(() => {
    loadMessages();
    if (currentSenderType) {
      markMessagesAsRead(session.id, currentSenderType, currentId);
      onMessagesRead?.();
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
        if (msg.sender_type !== currentSenderType || msg.sender_id !== currentId) {
          markMessagesAsRead(session.id, currentSenderType, currentId);
          onMessagesRead?.();
        }

        return [...prev, msg];
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [session.id, currentSenderType, currentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await getChatMessages(session.id);
      setMessages(msgs);
      if (currentSenderType) {
        markMessagesAsRead(session.id, currentSenderType, currentId);
        onMessagesRead?.();
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

  const sendTextMessage = async (textToSend: string) => {
    if (!textToSend || sendingMessages.size > 0) return;

    // VALIDASI OTOMATIS: Larangan pengiriman nomor HP / Kontak Luar (Anti-Disintermediation)
    const phoneCheck = containsPhoneNumber(textToSend);
    if (phoneCheck.blocked) {
      setWarningMessage(phoneCheck.reason || 'Pengiriman nomor telepon/WhatsApp dilarang demi keamanan transaksi di aplikasi.');
      return;
    } else {
      setWarningMessage(null);
    }

    const tempId = Date.now().toString();
    setSendingMessages(prev => new Set(prev).add(tempId));
    
    // Add optimistic message
    const optimisticMsg: ChatMessage = {
      id: tempId,
      session_id: session.id,
      sender_id: currentId,
      sender_type: currentSenderType,
      message: textToSend,
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
      onMessagesRead?.();
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendTextMessage(newMessage.trim());
  };

  const handleQuickReply = async (replyText: string) => {
    await sendTextMessage(replyText);
  };

  if (isEmbedded) {
    const partnerName = contactName || (currentId === session.user_id ? session.owner?.name : session.user?.name) || 'Calon Penghuni';
    const partnerPhoto = (currentId === session.user_id ? session.owner?.photo_url : session.user?.photo_url) || '';
    const propTitle = propertyName || (session as any).property?.title;

    return (
      <div className="flex flex-col h-full bg-white overflow-hidden">
        {/* Modern Embedded Chat Header */}
        <div className="px-5 py-3.5 bg-white border-b border-gray-100 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] z-10 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Mobile Back button */}
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
              title="Kembali ke daftar pesan"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-sm shadow-sm overflow-hidden">
                {partnerPhoto ? (
                  <img src={partnerPhoto} alt={partnerName} className="w-full h-full object-cover" />
                ) : (
                  <span>{partnerName.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
            </div>

            {/* Contact Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-gray-900 text-sm tracking-tight truncate">
                  {partnerName}
                </h4>
                <span className="px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100/80 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0">
                  {currentId === session.user_id ? 'Pemilik Kost' : 'Calon Penghuni'}
                </span>
              </div>
              
              {propTitle ? (
                <div className="flex items-center gap-1.5 mt-0.5 text-gray-500">
                  <span className="text-[11px] font-black text-orange-500 uppercase tracking-wider truncate max-w-[260px] sm:max-w-[400px]">
                    🏠 {propTitle}
                  </span>
                </div>
              ) : (
                <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online • Siap Berdiskusi
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Trust & Safety Banner */}
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center gap-2 text-emerald-800 text-[11px] font-semibold shrink-0">
          <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
          <div className="flex-1 truncate">
            <span className="font-extrabold text-emerald-950">Jaminan Keamanan Transaksi & Garansi Uang Kembali 100%</span>: Bayar sewa resmi via sistem RuangSinggah.
          </div>
        </div>

        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/70"
        >
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <div className="animate-spin h-8 w-8 border-3 border-orange-500 border-t-transparent rounded-full" />
               <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Memuat pesan...</p>
             </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 px-8">
              <div className="w-16 h-16 bg-white shadow-sm rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <MessageSquare className="w-8 h-8 text-orange-400" />
              </div>
              <h4 className="text-gray-900 font-black text-sm tracking-tight mb-1">Mulai Diskusi dengan Calon Penghuni</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">Sapa calon penyewa kost Anda dan jawab pertanyaan ketersediaan kamar dengan ramah.</p>
            </div>
          ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender_id === currentId || (msg.sender_type === currentSenderType);
                const isTemp = !msg.id || (!msg.id.includes('-') && msg.id.length < 20);

                return (
                  <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative transition-all ${
                      isMe 
                        ? 'bg-orange-500 text-white rounded-tr-xs shadow-orange-500/10' 
                        : 'bg-white border border-gray-100/80 text-gray-900 rounded-tl-xs shadow-slate-100'
                    }`}>
                      <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                      <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end text-white/75' : 'justify-start text-gray-400'}`}>
                        <span className="text-[9px] font-bold">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {isMe && (
                          <span className="inline-flex items-center ml-0.5" title={msg.is_read ? "Dibaca" : isTemp ? "Mengirim..." : "Terkirim ke server"}>
                            {msg.is_read ? (
                              <CheckCheck size={13} className="text-sky-200 stroke-[2.5]" />
                            ) : isTemp ? (
                              <Clock size={11} className="text-white/60" />
                            ) : (
                              <CheckCheck size={13} className="text-white/60" />
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

        {/* Warning Banner Anti-Disintermediation */}
        {warningMessage && (
          <div className="px-5 py-3 bg-rose-50 border-t border-rose-100 flex items-start gap-3 text-rose-700 animate-in slide-in-from-bottom-2 duration-200 shrink-0">
            <ShieldAlert size={18} className="shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold leading-tight">{warningMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setWarningMessage(null)}
              className="text-rose-400 hover:text-rose-600 p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Quick Reply Chips Bar di atas Input */}
        {currentSenderType === 'user' && (
          <div className="px-4 py-2 bg-slate-50/80 border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-orange-500" /> Tanya Cepat:
            </span>
            {QUICK_REPLIES.map((reply, qIdx) => (
              <button
                key={qIdx}
                type="button"
                disabled={sendingMessages.size > 0}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-600 text-[11px] font-bold whitespace-nowrap shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 sm:p-5 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (warningMessage) setWarningMessage(null);
            }}
            placeholder="Ketik balasan pesan..."
            maxLength={1000}
            className="flex-1 bg-gray-50/80 border border-gray-200/80 focus:bg-white rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-gray-400 placeholder:font-medium"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sendingMessages.size > 0}
            className="h-12 w-12 sm:w-auto sm:px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:hover:bg-orange-500 disabled:shadow-none cursor-pointer shrink-0"
          >
            <Send size={15} />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg h-full sm:h-[620px] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 sm:py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
              <MessageSquare className="w-5 h-5 text-orange-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-none mb-1 truncate">
                {propertyName || 'RuangSinggah Chat'}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" /> 
                <span className="truncate">
                  {(() => {
                    const isKM = contactType === 'admin' || contactType === 'manager' || contactName?.toLowerCase().includes('kostmanager');
                    const roleLabel = isKM ? 'Pengelola Resmi' : (contactType === 'caretaker' ? 'Penjaga Kost' : 'Pemilik Kost');
                    return contactName ? `${contactName} (${roleLabel})` : roleLabel;
                  })()}
                </span>
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-gray-400 hover:text-white shrink-0 ml-2"
            title="Tutup Obrolan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pinned Room Card (Konteks Kamar Tersemat) */}
        {(propertyName || roomType || (typeof roomPrice === 'number' && roomPrice > 0)) && (
          <div className="bg-slate-900/95 border-t border-white/10 px-5 py-3 text-white flex items-center justify-between gap-3 shrink-0 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {propertyPhoto ? (
                <img
                  src={propertyPhoto}
                  alt={propertyName || 'Kamar Kost'}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shrink-0 border border-white/15 shadow-xs"
                />
              ) : (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 text-orange-400">
                  <Home size={18} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-xs sm:text-sm text-white truncate leading-tight">
                  {propertyName || 'Kamar Kost'}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {(roomNumber || roomType) && (
                    <span className="text-[10px] font-bold text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded-md border border-orange-500/30 truncate max-w-[160px] sm:max-w-[220px]">
                      {roomNumber ? `Kamar ${roomNumber} • ${roomType || ''}` : roomType}
                    </span>
                  )}
                  {typeof roomPrice === 'number' && roomPrice > 0 && (
                    <span className="text-[11px] font-extrabold text-white/90">
                      Rp {roomPrice.toLocaleString('id-ID')}
                      <span className="text-[9px] font-medium text-white/60">/bln</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            {onRentClick && (
              <button
                type="button"
                onClick={onRentClick}
                className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 shadow-md shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Langsung ajukan sewa resmi via RuangSinggah"
              >
                <Zap size={13} className="fill-white" />
                <span>Ajukan Sewa</span>
              </button>
            )}
          </div>
        )}

        {/* Trust & Safety Banner: Jaminan Keamanan Transaksi & Garansi Uang Kembali 100% */}
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center gap-2 text-emerald-800 text-[11px] font-semibold shrink-0">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <div className="flex-1 truncate">
            <span className="font-extrabold text-emerald-950">Jaminan Keamanan Transaksi & Garansi Uang Kembali 100%</span>: Bayar sewa resmi via sistem RuangSinggah.
          </div>
        </div>

        {/* Messages List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-gray-50/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="animate-spin h-8 w-8 border-3 border-orange-500 border-t-transparent rounded-full" />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Memuat pesan...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 px-4 sm:px-6">
              <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                <MessageSquare className="w-7 h-7 text-orange-500" />
              </div>
              <h4 className="text-gray-900 font-black text-sm tracking-tight mb-1">
                Tanya Langsung ke {contactName || 'Pemilik Kost'}
              </h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4 leading-relaxed">
                Tanyakan ketersediaan kamar atau aturan kost. Transaksi Anda dilindungi jaminan keamanan 100%.
              </p>
              {currentSenderType === 'user' && (
                <div className="flex flex-col gap-1.5 max-w-sm mx-auto">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5 text-center">
                    Mulai dengan pertanyaan cepat:
                  </span>
                  {QUICK_REPLIES.map((reply, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      disabled={sendingMessages.size > 0}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 text-xs font-bold border border-gray-200/80 hover:border-orange-200 shadow-2xs text-left active:scale-98 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{reply}</span>
                      <Send size={12} className="text-gray-300 group-hover:text-orange-500 shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map((msg, idx) => {
              const currentId = currentUser?.uid || currentUser?.id;
              const isMe = msg.sender_id === currentId || (msg.sender_type === currentSenderType);
              const isTemp = !msg.id || (!msg.id.includes('-') && msg.id.length < 20);

              return (
                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-5 py-3 shadow-sm relative ${isMe ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                    <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                    <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-[9px] font-bold uppercase ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {isMe && (
                        <span className="inline-flex items-center ml-0.5" title={msg.is_read ? "Dibaca" : isTemp ? "Mengirim..." : "Terkirim ke server"}>
                          {msg.is_read ? (
                            <CheckCheck size={14} className="text-sky-300 stroke-[2.5]" />
                          ) : isTemp ? (
                            <Clock size={12} className="text-white/60" />
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

        {/* Warning Banner Anti-Disintermediation */}
        {warningMessage && (
          <div className="px-6 py-3 bg-rose-50 border-t border-rose-100 flex items-start gap-3 text-rose-700 animate-in slide-in-from-bottom-2 duration-200 shrink-0">
            <ShieldAlert size={18} className="shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold leading-tight">{warningMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setWarningMessage(null)}
              className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Quick Reply Chips Bar di atas Input */}
        {currentSenderType === 'user' && (
          <div className="px-4 py-2 bg-slate-50/90 border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-orange-500" /> Tanya Cepat:
            </span>
            {QUICK_REPLIES.map((reply, qIdx) => (
              <button
                key={qIdx}
                type="button"
                disabled={sendingMessages.size > 0}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-600 text-[11px] font-bold whitespace-nowrap shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 sm:p-5 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (warningMessage) setWarningMessage(null);
            }}
            placeholder="Ketik balasan pesan..."
            maxLength={1000}
            className="flex-1 bg-gray-50 border border-gray-200/80 rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sendingMessages.size > 0}
            className="h-12 w-12 sm:w-auto sm:px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:hover:bg-orange-500 disabled:shadow-none cursor-pointer shrink-0"
          >
            <Send size={16} />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
