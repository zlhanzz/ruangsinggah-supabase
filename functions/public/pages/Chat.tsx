
import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, ArrowRight, User, Home, Search } from 'lucide-react';
import { getMyChatSessions, ChatSession } from '../chatService';
import ChatWindow from '../components/ChatWindow';

interface ChatProps {
  user: any;
  onPageChange: (page: any) => void;
}

const Chat: React.FC<ChatProps> = ({ user, onPageChange }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getMyChatSessions(user.uid, 'user');
      setSessions(data);
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const partnerName = user.uid === session.user_id 
      ? (session.owner?.name || 'Pemilik Kost') 
      : (session.user?.name || 'Penyewa');
    const propertyTitle = session.property?.title || '';
    return partnerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           propertyTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-gray-50">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-4">Akses Chat Terbatas</h2>
        <p className="text-gray-500 max-w-xs mb-8">Silakan login terlebih dahulu untuk melihat pesan dan berinteraksi dengan pemilik kost.</p>
        <button 
          onClick={() => onPageChange('/login')}
          className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-500 transition-all active:scale-95"
        >
          Masuk Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="max-w-3xl mx-auto md:py-10">
        
        {/* Header */}
        <div className="p-6 md:p-0 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Pesan Anda</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Interaksi Real-time RuangSinggah</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-orange-500" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 md:px-0 mb-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari percakapan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-[2rem] pl-14 pr-6 py-5 text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Session List */}
        <div className="px-6 md:px-0 space-y-4">
          {loading ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm border border-gray-100">
               <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Memuat Percakapan...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-sm border border-gray-100">
               <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-100">
                  <MessageSquare className="w-10 h-10 text-gray-200" />
               </div>
               <h3 className="text-gray-900 font-black uppercase text-sm tracking-widest mb-2">Tidak Ada Pesan</h3>
               <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
                 {searchQuery ? 'Tidak menemukan percakapan yang cocok dengan pencarian Anda.' : 'Anda belum memulai percakapan dengan siapapun. Hubungi pemilik kost dari halaman detail properti.'}
               </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isUser = user.uid === session.user_id;
              const partner = isUser ? session.owner : session.user;
              const partnerName = partner?.name || 'User';
              const partnerPhoto = partner?.photo_url || partner?.photoURL;
              
              return (
                <div 
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 transition-all group cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-[1.25rem] bg-orange-100 flex items-center justify-center text-orange-600 font-black overflow-hidden border-2 border-white shadow-sm">
                        {partnerPhoto ? (
                          <img src={partnerPhoto} alt={partnerName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <h4 className="font-black text-gray-900 text-sm tracking-tight truncate">
                            {partnerName}
                          </h4>
                          {Boolean(session.unread_count && session.unread_count > 0) && (
                            <span className="min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shrink-0 shadow-sm animate-pulse">
                              {(session.unread_count || 0) > 9 ? '9+' : session.unread_count}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {session.last_message_at ? new Date(session.last_message_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </div>
                      
                      {session.property?.title && (
                        <div className="flex items-center gap-1 mb-1.5 overflow-hidden">
                          <Home className="w-3 h-3 text-orange-400 shrink-0" />
                          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest truncate">
                            {session.property.title}
                          </span>
                        </div>
                      )}
                      
                      <p className={`text-xs truncate ${Boolean(session.unread_count && session.unread_count > 0) ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium italic opacity-80'}`}>
                        {session.last_message || 'Belum ada pesan...'}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all shrink-0">
                       <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center px-10">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">RuangSinggah Chat Aman & Terenkripsi</p>
        </div>
      </div>

      {/* Chat Window Modal */}
      {selectedSession && (
        <ChatWindow 
          session={selectedSession}
          currentUser={user}
          onClose={() => {
            setSelectedSession(null);
            loadSessions(); // Refresh list to update last message
          }}
          propertyName={selectedSession.property?.title}
          contactName={user.uid === selectedSession.user_id ? selectedSession.owner?.name : selectedSession.user?.name}
          contactType={user.uid === selectedSession.user_id ? 'owner' : 'user' as any}
          onMessagesRead={() => {
            setSessions(prev => prev.map(s => s.id === selectedSession.id ? { ...s, unread_count: 0 } : s));
          }}
        />
      )}
    </div>
  );
};

export default Chat;
