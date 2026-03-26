import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Zap, Clock } from 'lucide-react';
import { ChatSession, ChatMessage, getChatMessages, sendMessage, subscribeToMessages } from '../chatService';

interface ChatWindowProps {
  session: ChatSession;
  currentUser: any;
  onClose: () => void;
  propertyName?: string;
  contactName?: string;
  contactType?: 'owner' | 'caretaker';
}

const ChatWindow: React.FC<ChatWindowProps> = ({ session, currentUser, onClose, propertyName, contactName, contactType }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    
    // Subscribe ke pesan baru secara real-time
    const subscription = subscribeToMessages(session.id, (msg) => {
      setMessages((prev) => {
        // Hindari duplikasi pesan
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [session.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = await getChatMessages(session.id);
      setMessages(msgs);
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
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const senderType = currentUser.uid === session.user_id ? 'user' : 'owner';
      await sendMessage(session.id, currentUser.uid, senderType, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

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
                {contactName 
                  ? `${contactName} (${contactType === 'caretaker' ? 'Penjaga' : 'Pemilik'})` 
                  : (contactType === 'caretaker' ? 'Penjaga Kost' : 'Pemilik Kost')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>


        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50"
        >
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
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Ketik pesan pertama Anda di bawah untuk memulai percakapan dengan pemilik properti.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_id === currentUser.uid;
              return (
                <div 
                  key={msg.id || idx}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`max-w-[80%] rounded-3xl px-5 py-3.5 shadow-sm relative ${
                    isMe 
                      ? 'bg-orange-500 text-white rounded-tr-none' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    <p className="text-[13px] font-medium leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center gap-1.5 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <Clock className={`w-3 h-3 ${isMe ? 'text-white/60' : 'text-gray-400'}`} />
                      <span className={`text-[9px] font-bold uppercase ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <form 
          onSubmit={handleSendMessage}
          className="p-6 bg-white border-t border-gray-100 flex items-center gap-4"
        >
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Tulis pesan..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${
              !newMessage.trim() || isSending
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100'
            }`}
          >
            {isSending ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="w-6 h-6" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
