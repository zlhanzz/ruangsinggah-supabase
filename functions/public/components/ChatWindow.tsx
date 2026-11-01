import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Clock, Check, CheckCheck, ChevronLeft, ShieldAlert, ShieldCheck, Home, Zap, Sparkles, Wrench, AlertTriangle } from 'lucide-react';
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
  ticketContext?: {
    id: string;
    title: string;
    category?: string;
    urgency?: string;
    status?: string;
    roomNumber?: string;
    kostName?: string;
    photoUrl?: string;
  };
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
  onRentClick,
  ticketContext
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set());
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [showSafetyBanner, setShowSafetyBanner] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Identitas pengirim saat ini di tingkat komponen (diakses oleh loadMessages, useEffect, dan handleSendMessage)
  const currentId = currentUser?.uid || currentUser?.id || '';
  const currentSenderType: 'user' | 'owner' = currentId === session.user_id ? 'user' : 'owner';

  // Smart Room Label Formatter: Membersihkan duplikasi kata (misal jika nomor kamar & tipe kamar sama-sama "Standard")
  const displayRoomLabel = (() => {
    const cleanNum = roomNumber ? roomNumber.replace(/^kamar\s+/i, '').trim() : '';
    const cleanType = roomType ? roomType.replace(/^tipe\s+/i, '').trim() : '';
    
    if (cleanNum && cleanType) {
      if (cleanNum.toLowerCase() === cleanType.toLowerCase()) {
        return `Tipe ${cleanType}`;
      }
      return `Kamar ${cleanNum} • Tipe ${cleanType}`;
    }
    if (cleanNum) {
      return `Kamar ${cleanNum}`;
    }
    if (cleanType) {
      return `Tipe ${cleanType}`;
    }
    return '';
  })();

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
    // Resolve partner name and photo smartly
    let resolvedPartnerName = contactName || (currentId === session.user_id ? session.owner?.name : session.user?.name) || '';
    let resolvedPartnerPhoto = (currentId === session.user_id ? session.owner?.photo_url : session.user?.photo_url) || '';

    if ((!resolvedPartnerName || resolvedPartnerName === 'Calon Penghuni') && session.last_message?.includes('|||')) {
      const parts = session.last_message.split('|||');
      if (parts.length >= 3 && parts[0] && parts[0] !== 'Calon Penghuni') {
        resolvedPartnerName = parts[0];
        if (parts[1] && !resolvedPartnerPhoto) resolvedPartnerPhoto = parts[1];
      }
    }
    const partnerName = resolvedPartnerName || (currentId === session.user_id ? 'Pemilik Kost' : 'Penghuni');
    const partnerPhoto = resolvedPartnerPhoto;
    const propTitle = propertyName || (session as any).property?.title || ticketContext?.kostName;

    return (
      <div className="flex flex-col h-full bg-white overflow-hidden">
        {/* Modern Clean Header (WhatsApp / Airbnb Style) */}
        <div className="px-3.5 py-3 sm:px-5 sm:py-3.5 bg-white border-b border-slate-100 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {/* Mobile Back button */}
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden -ml-1 p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Kembali ke daftar pesan"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Avatar Circle */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-xs overflow-hidden ring-2 ring-orange-50">
                {partnerPhoto ? (
                  <img src={partnerPhoto} alt={partnerName} className="w-full h-full object-cover" />
                ) : (
                  <span>{partnerName.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
            </div>

            {/* Contact Details */}
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate leading-tight">
                {partnerName}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5 text-slate-500">
                {ticketContext ? (
                  <span className="text-[11px] font-bold text-orange-600 truncate flex items-center gap-1">
                    <Wrench size={12} className="text-orange-500 shrink-0" />
                    <span className="truncate">Tiket #{ticketContext.id?.slice(0, 6).toUpperCase()} &bull; {ticketContext.roomNumber ? `Kamar ${ticketContext.roomNumber}` : 'Kendala Kamar'}</span>
                  </span>
                ) : propTitle ? (
                  <span className="text-[11px] font-semibold text-slate-500 truncate flex items-center gap-1">
                    <Home size={12} className="text-orange-500 shrink-0" />
                    <span className="truncate">{propTitle}</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Aktif di RuangSinggah
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Ticket Context Banner (Konteks Laporan Kendala Tersemat) */}
        {ticketContext && (
          <div className="bg-slate-900 border-b border-white/10 px-3.5 py-2.5 sm:px-4 sm:py-2.5 text-white flex items-center justify-between gap-3 shrink-0 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {ticketContext.photoUrl ? (
                <img
                  src={ticketContext.photoUrl}
                  alt="Bukti Kendala"
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/15 bg-slate-800"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 text-orange-400">
                  <Wrench size={16} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded bg-white/10 text-white">
                    #TKT-{ticketContext.id.substring(0, 6).toUpperCase()}
                  </span>
                  {ticketContext.urgency === 'EMERGENCY' ? (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Darurat
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {ticketContext.category || 'Kendala'}
                    </span>
                  )}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    ticketContext.status === 'open' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    ticketContext.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {ticketContext.status === 'open' ? 'Menunggu Tindakan' : ticketContext.status === 'in_progress' ? 'Sedang Ditangani' : 'Selesai'}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs text-white truncate mt-0.5 leading-tight">
                  {ticketContext.title}
                </h4>
                <p className="text-[10px] text-white/60 truncate">
                  {ticketContext.kostName || propertyName} &bull; Kamar {ticketContext.roomNumber || '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subtle & Dismissible Trust Notice */}
        {showSafetyBanner && (
          <div className="bg-emerald-50/90 border-b border-emerald-100/70 px-3.5 py-1.5 flex items-center justify-between gap-2 text-emerald-900 text-[11px] shrink-0 transition-all">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <p className="text-[11px] text-emerald-950 truncate">
                <span className="font-bold">Transaksi Resmi:</span> Selalu bayar sewa via RuangSinggah agar aman & terverifikasi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSafetyBanner(false)}
              className="p-1 text-emerald-700/60 hover:text-emerald-950 rounded-md hover:bg-emerald-100/60 transition-colors shrink-0 cursor-pointer"
              title="Tutup pemberitahuan"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2 bg-[#F8FAFC]"
        >
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <div className="animate-spin h-7 w-7 border-2 border-orange-500 border-t-transparent rounded-full" />
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Memuat pesan...</p>
             </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-14 h-14 bg-white shadow-xs rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100 text-orange-500">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h4 className="text-slate-900 font-extrabold text-sm tracking-tight mb-1">Mulai Percakapan</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">Kirim sapaan dan koordinasikan kebutuhan sewa atau kendala hunian dengan nyaman.</p>
            </div>
          ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender_id === currentId || (msg.sender_type === currentSenderType);
                const isTemp = !msg.id || (!msg.id.includes('-') && msg.id.length < 20);
                const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-2xs relative transition-all ${
                      isMe 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl rounded-br-xs shadow-orange-500/10' 
                        : 'bg-white border border-slate-200/70 text-slate-800 rounded-2xl rounded-bl-xs'
                    }`}>
                      <p className="text-[13px] sm:text-[13.5px] leading-relaxed whitespace-pre-wrap break-words font-medium">{msg.message}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end text-orange-100/90' : 'justify-end text-slate-400'}`}>
                        <span className="text-[10px] font-medium leading-none select-none">
                          {timeStr}
                        </span>
                        {isMe && (
                          <span className="inline-flex items-center ml-0.5" title={msg.is_read ? "Dibaca" : isTemp ? "Mengirim..." : "Terkirim ke server"}>
                            {msg.is_read ? (
                              <CheckCheck size={13} className="text-sky-200 stroke-[2.5]" />
                            ) : isTemp ? (
                              <Clock size={11} className="text-white/60" />
                            ) : (
                              <CheckCheck size={13} className="text-white/70" />
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
          <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-100 flex items-start gap-2.5 text-rose-700 animate-in slide-in-from-bottom-2 duration-200 shrink-0">
            <ShieldAlert size={16} className="shrink-0 text-rose-500 mt-0.5" />
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
          <div className="px-3.5 py-1.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-orange-500" /> Tanya Cepat:
            </span>
            {QUICK_REPLIES.map((reply, qIdx) => (
              <button
                key={qIdx}
                type="button"
                disabled={sendingMessages.size > 0}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-1 rounded-full bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-600 text-[11px] font-bold whitespace-nowrap shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Clean Input Area */}
        <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3.5 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (warningMessage) setWarningMessage(null);
            }}
            placeholder="Ketik balasan pesan..."
            maxLength={1000}
            className="flex-1 bg-slate-50/90 border border-slate-200/80 focus:bg-white rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sendingMessages.size > 0}
            className="h-10 w-10 sm:h-11 sm:w-11 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-full flex items-center justify-center shadow-md shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:hover:bg-orange-500 disabled:shadow-none cursor-pointer shrink-0"
            title="Kirim pesan"
          >
            <Send size={15} className="-ml-0.5" />
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

        {/* Pinned Ticket Context Banner (Konteks Laporan Kendala Tersemat) */}
        {ticketContext ? (
          <div className="bg-slate-900 border-t border-white/10 px-4 py-2.5 text-white flex items-center justify-between gap-3 shrink-0 shadow-sm">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {ticketContext.photoUrl ? (
                <img
                  src={ticketContext.photoUrl}
                  alt="Bukti Kendala"
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shrink-0 border border-white/15 bg-slate-800"
                />
              ) : (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 text-orange-400">
                  <Wrench size={18} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded bg-white/10 text-white">
                    #TKT-{ticketContext.id.substring(0, 6).toUpperCase()}
                  </span>
                  {ticketContext.urgency === 'EMERGENCY' ? (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Darurat
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {ticketContext.category || 'Kendala'}
                    </span>
                  )}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    ticketContext.status === 'open' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    ticketContext.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {ticketContext.status === 'open' ? 'Menunggu Tindakan' : ticketContext.status === 'in_progress' ? 'Sedang Ditangani' : 'Selesai'}
                  </span>
                </div>
                <h4 className="font-black text-xs sm:text-sm text-white truncate mt-0.5 leading-tight">
                  {ticketContext.title}
                </h4>
                <p className="text-[10px] text-white/60 truncate">
                  {ticketContext.kostName || propertyName} &bull; Kamar {ticketContext.roomNumber || '-'}
                </p>
              </div>
            </div>
          </div>
        ) : (propertyName || displayRoomLabel || (typeof roomPrice === 'number' && roomPrice > 0)) && (
          <div className="bg-slate-900/95 border-t border-white/10 px-5 py-3 text-white flex items-center justify-between gap-3 shrink-0 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {propertyPhoto && !imgFailed ? (
                <img
                  src={propertyPhoto}
                  alt={propertyName || 'Kamar Kost'}
                  onError={() => setImgFailed(true)}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shrink-0 border border-white/15 shadow-xs bg-slate-800"
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
                  {displayRoomLabel && (
                    <span className="text-[10px] font-bold text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded-md border border-orange-500/30 truncate max-w-[170px] sm:max-w-[240px]">
                      {displayRoomLabel}
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
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 sm:py-2.5 flex items-start sm:items-center gap-2.5 text-emerald-800 text-[11px] shrink-0">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 text-[11px] leading-snug sm:leading-normal text-emerald-950 font-normal break-words">
            <span className="font-extrabold text-emerald-950">Jaminan Keamanan Transaksi & Garansi Uang Kembali 100%</span>: Selalu bayar sewa resmi via sistem RuangSinggah agar terhindar dari penipuan.
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
