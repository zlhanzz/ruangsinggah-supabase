import React, { useState, useRef, useEffect } from 'react';
import { Page } from '../types';
import { Bell, MessageSquare, Home, Search, ClipboardList, User } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { notificationService } from '../notificationService';

interface NavbarProps {
  activePage: Page;
  onPageChange: (page: Page) => void;
  user?: any; // Added user prop
  onLogout?: () => void; // Added logout prop
  hideBottomNav?: boolean;
  hideNavLinks?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ activePage, onPageChange, user, onLogout, hideBottomNav, hideNavLinks }) => {
  const isAdminPage = activePage.startsWith(Page.DASHBOARD_ADMIN);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const desktopProfileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: 'Cari Kost', id: Page.LISTINGS },
    { label: 'Data Kost', id: Page.PRODUCTS },
    { label: 'Jasa Survey', id: Page.SURVEY_SERVICE },
    { label: 'Jadi Mitra', id: Page.OWNER },
  ];

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideDesktop = !desktopProfileRef.current || !desktopProfileRef.current.contains(target);
      const isOutsideMobile = !mobileProfileRef.current || !mobileProfileRef.current.contains(target);
      const isOutsideNotifications = !notificationsRef.current || !notificationsRef.current.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        setIsProfileOpen(false);
      }
      if (isOutsideNotifications) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notification Sync
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const notifs = await notificationService.getNotifications(user.uid);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
      } catch (err) {
        console.error("Failed to fetch unread count:", err);
      }
    };

    fetchUnread();

    const subscription = notificationService.subscribeToNotifications(user.uid, () => {
      fetchUnread();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const getInitials = (name: string) => {
    return name
      ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';
  };

  const handleNavClick = (pageId: Page) => {
    // No dynamic restrictions here; page-level logic handles auth where needed

    onPageChange(pageId);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => onPageChange(Page.HOME)}>
              <img src="/logo.png" alt="RuangSinggah.id" className="h-10 sm:h-12 w-auto mr-1.5" width="48" height="48" fetchPriority="high" />
              <span className="text-orange-500 font-extrabold text-2xl tracking-tight">RuangSinggah</span>
              <span className="text-gray-900 font-bold text-2xl">.id</span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              {!hideNavLinks && navItems.map((item, index) => (
                <button
                  key={`${item.id}-${index}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`${activePage === item.id
                    ? 'text-orange-600 font-semibold'
                    : 'text-gray-600 hover:text-orange-500'
                    } transition-colors duration-200 text-sm font-medium`}
                >
                  {item.label}
                </button>
              ))}

              {!hideNavLinks && <div className="h-6 w-px bg-gray-200 mx-2"></div>}

              {user ? (
                <div className="flex items-center gap-4">
                  {['admin', 'survey_agent', 'owner', 'mitra'].includes(user.role) && (
                    <button
                      onClick={() => {
                        const targetPage = user.role === 'admin' 
                          ? (isAdminPage ? Page.HOME : Page.DASHBOARD_ADMIN) 
                          : (user.role === 'survey_agent' ? Page.DASHBOARD_AGENT : Page.DASHBOARD_MITRA);
                        onPageChange(targetPage);
                      }}
                      className="bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-colors"
                    >
                      {user.role === 'admin' 
                        ? (isAdminPage ? 'Mode User' : 'Admin Panel') 
                        : (user.role === 'survey_agent' ? 'Agent Panel' : 'Owner Panel')}
                    </button>
                  )}

                  {/* NOTIFICATION BELL */}
                  <div className="relative" ref={notificationsRef}>
                    <button 
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all relative group"
                    >
                      <Bell className={`w-6 h-6 transition-transform group-hover:rotate-12 ${isNotificationsOpen ? 'text-orange-500' : ''}`} />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce-short">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotificationsOpen && (
                      <NotificationDropdown 
                        user={user} 
                        onClose={() => setIsNotificationsOpen(false)} 
                      />
                    )}
                  </div>

                  <div className="relative" ref={desktopProfileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2 text-gray-900 hover:text-orange-500 transition-colors focus:outline-none"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black border border-orange-200 relative overflow-hidden">
                        {/* Layer 1: Initials (Always present in background) */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 z-0">
                          {getInitials(user.displayName || user.name)}
                        </div>
                        
                        {/* Layer 2: Profile Photo (Stacked on top) */}
                        {user.photoURL && (
                          <img 
                            src={user.photoURL} 
                            alt="Profile" 
                            className="absolute inset-0 w-full h-full rounded-full object-cover z-10 transition-opacity duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        {/* Admin Indicator on Avatar */}
                        {user.role === 'admin' && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white" title="Admin">
                            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 max-w-[120px]">
                        <span className="text-sm font-bold truncate">{user.displayName || user.name || 'User'}</span>
                        {user.role === 'admin' && (
                          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <title>Admin Terverifikasi</title>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <svg className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b border-gray-50">
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            {user.role === 'admin' ? 'Login Sebagai Admin' : 'Login Sebagai'}
                          </p>
                          <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            onPageChange(Page.PROFILE);
                            setIsProfileOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                        >
                          Profil Saya
                        </button>
                        <button
                          onClick={() => {
                            onPageChange(Page.MY_BOOKINGS);
                            setIsProfileOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 border-t border-gray-50"
                        >
                          Kost Saya
                        </button>
                        {['admin', 'survey_agent', 'owner', 'mitra'].includes(user.role) && (
                          <button
                            onClick={() => {
                              const targetPage = user.role === 'admin' 
                                ? (isAdminPage ? Page.HOME : Page.DASHBOARD_ADMIN) 
                                : (user.role === 'survey_agent' ? Page.DASHBOARD_AGENT : Page.DASHBOARD_MITRA);
                              onPageChange(targetPage);
                              setIsProfileOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-bold border-t border-gray-50"
                          >
                            {user.role === 'admin' 
                              ? (isAdminPage ? 'Tampilan User' : 'Dashboard Admin') 
                              : (user.role === 'survey_agent' ? 'Dashboard Agen' : 'Dashboard Pemilik')}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (onLogout) onLogout();
                            setIsProfileOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                        >
                          Keluar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onPageChange(Page.LOGIN)}
                  className="text-gray-900 font-bold text-sm hover:text-orange-500 transition-colors"
                >
                  Masuk / Daftar
                </button>
              )}

              {!user && (
                <button
                  onClick={() => onPageChange(Page.CONTACT)}
                  className="bg-orange-500 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-orange-600 transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
                >
                  Hubungi Kami
                </button>
              )}
            </div>

            <div className="md:hidden flex items-center gap-2">
              {/* MOBILE NOTIFICATION BELL */}
              {user && (
                <div className="relative" ref={notificationsRef}>
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="p-2 text-gray-400 hover:text-orange-500 rounded-xl transition-all relative"
                  >
                    <Bell className={`w-5 h-5 ${isNotificationsOpen ? 'text-orange-500' : ''}`} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="fixed inset-x-0 top-20 px-4 z-[110]">
                      <NotificationDropdown 
                        user={user} 
                        onClose={() => setIsNotificationsOpen(false)} 
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Mobile User Profile (Avatar only) or Login button */}
              {user ? (
                <div className="relative" ref={mobileProfileRef}>
                  <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="relative w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black border border-orange-200 focus:outline-none overflow-hidden">
                    {/* Layer 1: Initials */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 z-0">
                      {getInitials(user.displayName || user.name)}
                    </div>
                    
                    {/* Layer 2: Photo */}
                    {user.photoURL && (
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        className="absolute inset-0 w-full h-full rounded-full object-cover z-10" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    {user.role === 'admin' && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white">
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 animate-in fade-in slide-in-from-top-2 z-[101]">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                          {user.role === 'admin' ? 'Login Sebagai Admin' : 'Login Sebagai'}
                        </p>
                        <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          onPageChange(Page.PROFILE);
                          setIsProfileOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      >
                        Profil Saya
                      </button>
                      <button
                        onClick={() => {
                          onPageChange(Page.MY_BOOKINGS);
                          setIsProfileOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 border-t border-gray-50"
                      >
                        Kost Saya
                      </button>
                      {['admin', 'survey_agent', 'owner', 'mitra'].includes(user.role) && (
                        <button
                          onClick={() => {
                            const targetPage = user.role === 'admin' 
                              ? (isAdminPage ? Page.HOME : Page.DASHBOARD_ADMIN) 
                              : (user.role === 'survey_agent' ? Page.DASHBOARD_AGENT : Page.DASHBOARD_MITRA);
                            onPageChange(targetPage);
                            setIsProfileOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-bold border-t border-gray-50"
                        >
                          {user.role === 'admin' 
                            ? (isAdminPage ? 'Tampilan User' : 'Dashboard Admin') 
                            : (user.role === 'survey_agent' ? 'Dashboard Agen' : 'Dashboard Pemilik')}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (onLogout) onLogout();
                          setIsProfileOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                      >
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onPageChange(Page.LOGIN)}
                    className="text-gray-800 font-bold text-sm hover:text-orange-500 transition-colors px-3 py-2 cursor-pointer"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => onPageChange(Page.LOGIN)}
                    className="bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-sm px-5 py-2 rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    Daftar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (4 Items: Home, Search, Orders, Profile) */}
      {[Page.HOME, Page.LISTINGS, Page.PRODUCTS, Page.MY_BOOKINGS, Page.CHAT, Page.PROFILE].includes(activePage) && !hideBottomNav && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[100] bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around py-1.5 px-2">
            {/* 1. Home */}
            <button
              onClick={() => onPageChange(Page.HOME)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1 transition-all cursor-pointer ${
                activePage === Page.HOME ? 'text-orange-500' : 'text-gray-400 hover:text-gray-800'
              }`}
            >
              <Home size={22} className={activePage === Page.HOME ? 'stroke-orange-500 stroke-[2.5]' : 'stroke-gray-400'} />
              <span className={`text-[10px] ${activePage === Page.HOME ? 'font-bold text-orange-500' : 'font-medium text-gray-500'}`}>
                Home
              </span>
            </button>

            {/* 2. Search */}
            <button
              onClick={() => onPageChange(Page.LISTINGS)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1 transition-all cursor-pointer ${
                activePage === Page.LISTINGS ? 'text-orange-500' : 'text-gray-400 hover:text-gray-800'
              }`}
            >
              <Search size={22} className={activePage === Page.LISTINGS ? 'stroke-orange-500 stroke-[2.5]' : 'stroke-gray-400'} />
              <span className={`text-[10px] ${activePage === Page.LISTINGS ? 'font-bold text-orange-500' : 'font-medium text-gray-500'}`}>
                Search
              </span>
            </button>

            {/* 3. Orders */}
            <button
              onClick={() => onPageChange(Page.MY_BOOKINGS)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1 transition-all cursor-pointer ${
                activePage === Page.MY_BOOKINGS ? 'text-orange-500' : 'text-gray-400 hover:text-gray-800'
              }`}
            >
              <ClipboardList size={22} className={activePage === Page.MY_BOOKINGS ? 'stroke-orange-500 stroke-[2.5]' : 'stroke-gray-400'} />
              <span className={`text-[10px] ${activePage === Page.MY_BOOKINGS ? 'font-bold text-orange-500' : 'font-medium text-gray-500'}`}>
                Orders
              </span>
            </button>

            {/* 4. Profile */}
            <button
              onClick={() => onPageChange(user ? Page.PROFILE : Page.LOGIN)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1 transition-all cursor-pointer ${
                activePage === Page.PROFILE || activePage === Page.LOGIN ? 'text-orange-500' : 'text-gray-400 hover:text-gray-800'
              }`}
            >
              <User size={22} className={activePage === Page.PROFILE || activePage === Page.LOGIN ? 'stroke-orange-500 stroke-[2.5]' : 'stroke-gray-400'} />
              <span className={`text-[10px] ${activePage === Page.PROFILE || activePage === Page.LOGIN ? 'font-bold text-orange-500' : 'font-medium text-gray-500'}`}>
                Profile
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
