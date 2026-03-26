
import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ExternalLink, MessageSquare, CreditCard, Home, Info } from 'lucide-react';
import { notificationService, Notification } from '../notificationService';

interface NotificationDropdownProps {
  user: any;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ user, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const subscription = notificationService.subscribeToNotifications(user.uid, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user.uid]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(user.uid);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'rental': return <Home className="w-4 h-4 text-orange-500" />;
      case 'chat': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <div className="absolute md:right-0 left-0 md:left-auto right-0 mx-auto md:mx-0 mt-3 w-[calc(100vw-2rem)] md:w-96 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden z-[110] animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Header */}
      <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Pemberitahuan</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            {notifications.filter(n => !n.is_read).length} Pesan Baru
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleMarkAllAsRead}
            className="p-2 hover:bg-orange-50 text-gray-400 hover:text-orange-600 rounded-xl transition-all"
            title="Tandai semua dibaca"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-2 bg-gray-50/30 gap-1 border-b border-gray-50">
        <button 
          onClick={() => setFilter('unread')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'unread' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Belum Dibaca
        </button>
        <button 
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Semua
        </button>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {loading && notifications.length === 0 ? (
          <div className="p-10 text-center">
             <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Memuat...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-gray-200" />
             </div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tidak ada pemberitahuan</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-5 hover:bg-orange-50/30 transition-all group relative ${!notif.is_read ? 'bg-orange-50/10' : ''}`}
                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
              >
                {!notif.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
                )}
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 ${!notif.is_read ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className={`text-xs uppercase tracking-tight truncate pr-4 ${!notif.is_read ? 'font-black text-gray-900' : 'font-bold text-gray-500'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[9px] font-bold text-gray-300 shrink-0">
                        {new Date(notif.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    {notif.link && (
                      <a 
                        href={notif.link} 
                        target={notif.link?.startsWith('http') ? '_blank' : '_self'}
                        rel={notif.link?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="mt-2 text-[9px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        Lihat Selengkapnya <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50/50 border-t border-gray-50 text-center">
         <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Pusat Notifikasi RuangSinggah</p>
      </div>
    </div>
  );
};

export default NotificationDropdown;
