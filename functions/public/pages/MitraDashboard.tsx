import React, { useState, useEffect } from 'react';
import KostFormMitra from '../components/KostFormMitra';
import { Kost, Page } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { getOwnerProperties, getOwnerBookings, updateBookingStatus } from '../userService';
import { getMyChatSessions, ChatSession } from '../chatService';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { 
    Zap, Home, ClipboardList, Wallet, User, 
    Plus, Edit, Eye, Check, MessageSquare, Search, Filter, MoreHorizontal, ArrowUpRight,
    Clock, LogOut, Bell, ChevronRight, TrendingUp, Menu, X
} from 'lucide-react';
import MitraProfile from './MitraProfile';
import ChatWindow from '../components/ChatWindow';

interface MitraDashboardProps {
    uid: string;
    user?: any;
    onPageChange?: (page: Page) => void;
    onAddKost?: (newKost: Kost) => void;
    onEditKost?: (updatedKost: Kost) => void;
    onDeleteKost?: (id: string) => void;
}

// ── Dummy data ────────────────────────────────────────────────────────────────
const DUMMY_PROPERTIES: Kost[] = [
    {
        id: 'P1', ownerUid: 'dummy', title: 'Kost Orange Premium', description: 'Kost eksklusif dekat kampus',
        price: 1500000, facilities: ['WiFi', 'AC', 'Parkir'], address: 'Jl. Tebet Utara No. 22', city: 'Jakarta Selatan',
        area: 'Tebet', type: 'Campur', isVerified: true, rating: 4.8, status: 'published',
        location: { lat: -6.2088, lng: 106.8456 }, imageUrls: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400'],
        videoUrls: [], roomTypes: [], reviews: [], rules: [], campuses: [], publicFacilities: [],
        views: 842, createdAt: '2024-01-01', updatedAt: '2024-03-01'
    },
    {
        id: 'P2', ownerUid: 'dummy', title: 'Kost Sunrise Putera', description: 'Khusus putra, bersih dan aman',
        price: 900000, facilities: ['WiFi', 'Dapur Bersama', 'Laundry'], address: 'Jl. Mampang No. 10', city: 'Jakarta Selatan',
        area: 'Mampang', type: 'Putra', isVerified: false, rating: 4.3, status: 'published',
        location: { lat: -6.2350, lng: 106.8295 }, imageUrls: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'],
        videoUrls: [], roomTypes: [], reviews: [], rules: [], campuses: [], publicFacilities: [],
        views: 398, createdAt: '2024-02-01', updatedAt: '2024-03-10'
    }
];

const DUMMY_BOOKINGS = [
    { id: 'B1', status: 'PENDING_APPROVAL', amount: 1500000, created_at: new Date().toISOString(), user: { name: 'Budi Santoso', email: 'budi@gmail.com', phone: '08123456789' }, metadata: { kostName: 'Kost Orange Premium', roomType: 'Kamar Standard', periodLabel: 'Per Bulan', startDate: '2026-04-01' } },
    { id: 'B2', status: 'AWAITING_PAYMENT', amount: 900000, created_at: new Date().toISOString(), user: { name: 'Siti Aminah', email: 'siti@gmail.com', phone: '08234567890' }, metadata: { kostName: 'Kost Sunrise Putera', roomType: 'Kamar Deluxe', periodLabel: 'Per 3 Bulan', startDate: '2026-04-15' } },
    { id: 'B3', status: 'PAID', amount: 1800000, created_at: new Date(Date.now() - 7 * 86400000).toISOString(), user: { name: 'Andi Wijaya', email: 'andi@gmail.com', phone: '08345678901' }, metadata: { kostName: 'Kost Orange Premium', roomType: 'Kamar Premium', periodLabel: 'Per Bulan', startDate: '2026-03-01' } },
    { id: 'B4', status: 'PENDING_APPROVAL', amount: 900000, created_at: new Date().toISOString(), user: { name: 'Dewi Lestari', email: 'dewi@gmail.com', phone: '08456789012' }, metadata: { kostName: 'Kost Sunrise Putera', roomType: 'Kamar Standard', periodLabel: 'Per Bulan', startDate: '2026-04-10' } },
];

const DUMMY_CHATS: ChatSession[] = [
    { id: 'C1', user_id: 'u1', owner_id: 'dummy', last_message: 'Halo, apakah kamar masih ada pak?', last_message_at: new Date(Date.now() - 1800000).toISOString(), created_at: '', updated_at: '', user: { name: 'Budi Santoso' }, property: { title: 'Kost Orange Premium' } } as any,
    { id: 'C2', user_id: 'u2', owner_id: 'dummy', last_message: 'Boleh survei besok jam 10?', last_message_at: new Date(Date.now() - 3600000).toISOString(), created_at: '', updated_at: '', user: { name: 'Siti Aminah' }, property: { title: 'Kost Sunrise Putera' } } as any,
    { id: 'C3', user_id: 'u3', owner_id: 'dummy', last_message: 'Terima kasih sudah disetujui!', last_message_at: new Date(Date.now() - 86400000).toISOString(), created_at: '', updated_at: '', user: { name: 'Andi Wijaya' }, property: { title: 'Kost Orange Premium' } } as any,
];

const CHART_DATA = [
    { day: 'Sen', views: 120 }, { day: 'Sel', views: 450 }, { day: 'Rab', views: 300 },
    { day: 'Kam', views: 500 }, { day: 'Jum', views: 800 }, { day: 'Sab', views: 1200 }, { day: 'Min', views: 950 }
];

type MenuKey = 'overview' | 'properties' | 'bookings' | 'chat' | 'wallet' | 'profile';

// ── Sidebar Nav Item ──────────────────────────────────────────────────────────
const SideNavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; badge?: number; onClick: () => void }> = ({ active, icon, label, badge, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${
            active
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-100'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
        <span className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-orange-500'} transition-colors`}>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {badge !== undefined && badge > 0 && (
            <span className="min-w-[20px] h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                {badge > 9 ? '9+' : badge}
            </span>
        )}
    </button>
);

// ── Bottom Nav (Mobile) ───────────────────────────────────────────────────────
const BottomNavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; badge?: number; onClick: () => void }> = ({ active, icon, label, badge, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-2 transition-all ${active ? 'text-orange-500' : 'text-gray-300'}`}>
        <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-orange-50 shadow-md shadow-orange-100 scale-105' : ''}`}>
            {icon}
            {badge !== undefined && badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5 border-2 border-white">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-wider ${active ? 'opacity-100' : 'opacity-50'}`}>{label}</span>
    </button>
);

// ── Main Component ────────────────────────────────────────────────────────────
const MitraDashboard: React.FC<MitraDashboardProps> = ({ uid, user, onPageChange }) => {
    const [activeMenu, setActiveMenu] = useState<MenuKey>('overview');
    const [bookingTab, setBookingTab] = useState<'pending' | 'awaiting_payment' | 'completed'>('pending');
    const [loading, setLoading] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [properties, setProperties] = useState<Kost[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
    const [stats, setStats] = useState({ totalRevenue: 0, pendingApprovals: 0, totalViews: 1240, ctr: 4.2 });
    const [showKostForm, setShowKostForm] = useState(false);
    const [editingKost, setEditingKost] = useState<Partial<Kost> | null>(null);

    const isVerified = user?.verification_status === 'verified';

    const checkVerification = () => {
        if (!isVerified) {
            alert('Akses Dibatasi! Anda harus memverifikasi identitas terlebih dahulu sebelum dapat menambah atau mengelola unit kost.');
            setActiveMenu('profile');
            return false;
        }
        return true;
    };

    const loadData = async () => {
        if (!uid) return;
        setLoading(true);
        try {
            const [propsData, bookingsData, chatData] = await Promise.all([
                getOwnerProperties(uid),
                getOwnerBookings(uid),
                getMyChatSessions(uid)
            ]);
            const finalProps = propsData.length > 0 ? propsData : DUMMY_PROPERTIES;
            const finalBookings = bookingsData.length > 0 ? bookingsData : DUMMY_BOOKINGS;
            const finalChats = chatData.length > 0 ? chatData : DUMMY_CHATS;

            setProperties(finalProps);
            setBookings(finalBookings);
            setChatSessions(finalChats);

            const revenue = finalBookings.filter(b => b.status === 'PAID').reduce((a, b) => a + (b.amount || 0), 0);
            const totalViews = finalProps.reduce((a, p) => a + (p.views || 0), 0);
            setStats({
                totalRevenue: revenue || 1800000,
                pendingApprovals: finalBookings.filter(b => b.status === 'PENDING_APPROVAL').length,
                totalViews: totalViews || 1240,
                ctr: totalViews > 0 ? parseFloat(((finalBookings.length * 5 / totalViews) * 100).toFixed(1)) : 4.2
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [uid]);

    const handleApprove = async (id: string) => {
        if (!window.confirm('Setujui pesanan ini? Calon penghuni akan diminta melakukan pembayaran.')) return;
        try { await updateBookingStatus(id, 'AWAITING_PAYMENT'); loadData(); } catch { alert('Gagal menyetujui.'); }
    };
    const handleReject = async (id: string) => {
        if (!window.confirm('Tolak pesanan ini?')) return;
        try { await updateBookingStatus(id, 'REJECTED'); loadData(); } catch { alert('Gagal menolak.'); }
    };

    const filteredBookings = bookings.filter(b =>
        bookingTab === 'pending' ? b.status === 'PENDING_APPROVAL' :
        bookingTab === 'awaiting_payment' ? b.status === 'AWAITING_PAYMENT' :
        (b.status === 'PAID' || b.status === 'COMPLETED')
    );

    const pendingCount = bookings.filter(b => b.status === 'PENDING_APPROVAL').length;
    const chatCount = chatSessions.length;

    const NAV_ITEMS: { key: MenuKey; icon: React.ReactNode; label: string; badge?: number }[] = [
        { key: 'overview', icon: <Zap size={20} />, label: 'Beranda' },
        { key: 'properties', icon: <Home size={20} />, label: 'Kost Saya' },
        { key: 'bookings', icon: <ClipboardList size={20} />, label: 'Pesanan', badge: pendingCount },
        { key: 'chat', icon: <MessageSquare size={20} />, label: 'Pesan', badge: chatCount },
        { key: 'wallet', icon: <Wallet size={20} />, label: 'Dompet' },
        { key: 'profile', icon: <User size={20} />, label: 'Profil' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
        );
    }

    const render = (
        <div className="min-h-screen bg-gray-50 font-sans flex">

            {/* ── DESKTOP SIDEBAR ───────────────────────────────────────────── */}
            <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-30 shadow-sm">
                {/* Logo */}
                <div className="p-6 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[1.2rem] bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Zap size={20} className="text-white" fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="text-[15px] font-black text-gray-900 leading-none tracking-tight">ruangsinggah.id</h1>
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em] mt-1 whitespace-nowrap">MITRA DASHBOARD</p>
                        </div>
                    </div>
                </div>

                {/* User Info */}
                <div className="px-4 py-5 border-b border-gray-50">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'M'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-gray-900 truncate">{user?.displayName || 'Pemilik Kost'}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${isVerified ? 'text-green-500' : 'text-orange-500'}`}>
                                {isVerified ? 'Mitra Terverifikasi ✓' : user?.verification_status === 'pending' ? 'Sedang Ditinjau' : 'Belum Verifikasi'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] px-4 mb-3">Menu Utama</p>
                    {NAV_ITEMS.map(item => (
                        <SideNavItem
                            key={item.key}
                            active={activeMenu === item.key}
                            icon={item.icon}
                            label={item.label}
                            badge={item.badge}
                            onClick={() => setActiveMenu(item.key)}
                        />
                    ))}
                </nav>

                {/* Back to Site */}
                <div className="p-4 border-t border-gray-50">
                    <button
                        onClick={() => onPageChange?.(Page.HOME)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={18} />
                        Kembali ke Beranda
                    </button>
                </div>
            </aside>

            {/* ── MOBILE OVERLAY SIDEBAR ───────────────────────────────────── */}
            {mobileSidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
                    <aside className="relative w-72 bg-white h-full flex flex-col shadow-2xl z-10">
                        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm">RS</div>
                                <p className="text-sm font-black text-gray-900">Mitra Dashboard</p>
                            </div>
                            <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-xl hover:bg-gray-50">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        <div className="px-5 py-4 border-b border-gray-50">
                            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl border border-orange-100">
                                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-sm">
                                    {user?.displayName?.charAt(0) || 'M'}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{user?.displayName || 'Pemilik Kost'}</p>
                                    <p className="text-[10px] font-bold text-orange-500">Mitra Aktif ✓</p>
                                </div>
                            </div>
                        </div>
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {NAV_ITEMS.map(item => (
                                <SideNavItem
                                    key={item.key}
                                    active={activeMenu === item.key}
                                    icon={item.icon}
                                    label={item.label}
                                    badge={item.badge}
                                    onClick={() => { setActiveMenu(item.key); setMobileSidebarOpen(false); }}
                                />
                            ))}
                        </nav>
                        <div className="p-4 border-t border-gray-50">
                            <button
                                onClick={() => onPageChange?.(Page.HOME)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <LogOut size={18} />
                                Kembali ke Beranda
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
            <div className="flex-1 lg:ml-64 xl:ml-72 flex flex-col min-h-screen">

                {/* ── MOBILE TOP BAR ──────────────────────────────────────── */}
                <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <Menu size={22} className="text-gray-700" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[1.1rem] bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Zap size={18} className="text-white" fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-[15px] font-black text-gray-900 leading-tight tracking-tight">ruangsinggah.id</h1>
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest leading-none mt-0.5">MITRA DASHBOARD</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 relative">
                            <Bell size={20} className="text-gray-500" />
                            {pendingCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />}
                        </button>
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-xs">
                            {user?.displayName?.charAt(0) || 'M'}
                        </div>
                    </div>
                </header>

                {/* ── DESKTOP TOP BAR ─────────────────────────────────────── */}
                <header className="hidden lg:flex sticky top-0 z-20 bg-white border-b border-gray-100 px-8 py-4 items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">
                            { activeMenu === 'overview' ? 'Selamat Datang 👋' :
                              activeMenu === 'properties' ? 'Kost Saya' :
                              activeMenu === 'bookings' ? 'Manajemen Pesanan' :
                              activeMenu === 'chat' ? 'Pesan & Diskusi' :
                              activeMenu === 'wallet' ? 'Dompet & Keuangan' : 'Profil Mitra' }
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                            { new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="relative w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-orange-50 transition-colors">
                            <Bell size={18} className="text-gray-500" />
                            {pendingCount > 0 && <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
                        </button>
                        <button
                            onClick={() => onPageChange?.(Page.HOME)}
                            className="h-9 px-4 rounded-xl bg-gray-50 text-gray-600 font-bold text-xs hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                            <LogOut size={14} />
                            Keluar Dashboard
                        </button>
                    </div>
                </header>

                {/* ── PAGE CONTENT ─────────────────────────────────────────── */}
                <main className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8 overflow-y-auto">

                    {/* BERANDA */}
                    {activeMenu === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Greeting — Mobile only */}
                            <div className="lg:hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-5 text-white">
                                <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Selamat Datang Kembali</p>
                                <h2 className="text-xl font-black mt-1 tracking-tight">{user?.displayName || 'Pemilik Kost'} 👋</h2>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <p className="text-xs font-bold text-white/60">{pendingCount} pesanan menunggu persetujuan</p>
                                </div>
                            </div>

                            {/* Verification Banner — Imitated from Agent Dashboard */}
                            {!isVerified && (
                                <div className="bg-orange-50 border border-orange-200 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-pulse">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">⚠️</div>
                                        <div className="text-left">
                                            <h4 className="text-orange-900 font-black uppercase text-[10px] tracking-widest mb-1">Identitas Belum Lengkap</h4>
                                            <p className="text-gray-600 text-[11px] font-medium leading-tight">
                                                {user?.verification_status === 'pending' 
                                                    ? 'Data verifikasi Anda sedang dalam peninjauan admin. Mohon tunggu.' 
                                                    : 'Verifikasi KTP Anda sekarang untuk mulai mempublikasikan iklan kost.'}
                                            </p>
                                        </div>
                                    </div>
                                    {user?.verification_status !== 'pending' && (
                                        <button 
                                            onClick={() => setActiveMenu('profile')}
                                            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-100 shrink-0"
                                        >
                                            Verifikasi Sekarang
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Stat Cards — 2 col on mobile, 3 col on desktop */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
                                <StatCard label="Kunjungan" value={`${stats.totalViews.toLocaleString()}`} sub="Total views kost" icon={<Eye size={18} className="text-blue-500" />} color="blue" />
                                <StatCard label="CTR" value={`${stats.ctr}%`} sub="Click-through rate" icon={<TrendingUp size={18} className="text-purple-500" />} color="purple" />
                                <StatCard label="Pendapatan" value={FORMAT_CURRENCY(stats.totalRevenue)} sub="Total diterima" icon={<Wallet size={18} className="text-green-500" />} color="green" />
                                <StatCard label="Permintaan" value={`${pendingCount}`} sub="Butuh persetujuan" icon={<ClipboardList size={18} className="text-orange-500" />} color="orange" alert={pendingCount > 0} />
                            </div>

                            {/* Quick Links — Mobile only */}
                            <div className="grid grid-cols-2 gap-3 lg:hidden">
                                <button onClick={() => setActiveMenu('bookings')} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm active:scale-95 transition-transform">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0"><ClipboardList size={20} /></div>
                                    <div className="text-left"><p className="text-xs font-black text-gray-900">Pesanan</p><p className="text-[10px] text-gray-400 font-bold">{pendingCount} Baru</p></div>
                                </button>
                                <button onClick={() => setActiveMenu('chat')} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm active:scale-95 transition-transform">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><MessageSquare size={20} /></div>
                                    <div className="text-left"><p className="text-xs font-black text-gray-900">Pesan</p><p className="text-[10px] text-gray-400 font-bold">{chatCount} Chat</p></div>
                                </button>
                            </div>

                            {/* Charts — 2 col on desktop, full on mobile */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                                {/* Area chart */}
                                <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-black text-gray-900 text-sm">Tren Kunjungan</h3>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">7 Hari Terakhir</span>
                                    </div>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={CHART_DATA}>
                                                <defs>
                                                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 700 }} />
                                                <YAxis hide />
                                                <RechartsTooltip contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }} />
                                                <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#gViews)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Property comparison */}
                                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                    <h3 className="font-black text-gray-900 text-sm mb-6">Performa Kost</h3>
                                    <div className="space-y-5">
                                        {properties.slice(0, 3).map(p => {
                                            const pct = Math.min(100, Math.round(((p.views || 0) / Math.max(1, stats.totalViews)) * 100));
                                            return (
                                                <div key={p.id}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                                                <img src={p.imageUrls[0] as string} className="w-full h-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                                                            </div>
                                                            <p className="text-xs font-black text-gray-900 truncate max-w-[110px]">{p.title}</p>
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-400">{p.views || 0} views</p>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-orange-400 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Bookings Shortcut */}
                            {pendingCount > 0 && (
                                <div className="bg-orange-50 border border-orange-100 rounded-3xl p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-100 shrink-0">
                                            <ClipboardList size={22} />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 text-sm">Ada {pendingCount} pesanan baru!</p>
                                            <p className="text-xs text-gray-500 font-bold mt-0.5">Segera setujui atau tolak permintaan sewa</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveMenu('bookings')} className="h-10 px-5 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 flex items-center gap-2 shrink-0">
                                        Lihat <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* KOST SAYA */}
                    {activeMenu === 'properties' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg">Kost Saya</h3>
                                    <p className="text-xs text-gray-400 font-bold mt-0.5 uppercase tracking-widest">{properties.length} Properti Aktif</p>
                                </div>
                                <button
                                    onClick={() => { 
                                        if (checkVerification()) {
                                            setEditingKost(null); 
                                            setShowKostForm(true); 
                                        }
                                    }}
                                    className="h-11 px-5 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 flex items-center gap-2 active:scale-95 transition-transform"
                                >
                                    <Plus size={16} strokeWidth={3} /> Tambah
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {properties.map(p => (
                                    <div key={p.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                        <div className="relative h-52">
                                            <img src={p.imageUrls[0] as string} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                            <div className="absolute top-4 right-4">
                                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${p.status === 'published' ? 'bg-green-500 text-white border-green-400' : 'bg-gray-700 text-white border-gray-600'}`}>
                                                    {p.status === 'published' ? '● Aktif' : '● Draft'}
                                                </span>
                                            </div>
                                            <div className="absolute bottom-4 left-4 text-white">
                                                <p className="text-[10px] font-bold opacity-70">{p.views || 0} views</p>
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h4 className="font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-orange-500 transition-colors">{p.title}</h4>
                                            <p className="text-xs font-bold text-gray-400 mt-1 flex items-center gap-1 uppercase tracking-widest truncate">
                                                <MoreHorizontal size={12} className="text-orange-400 shrink-0" /> {p.address}
                                            </p>
                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Harga/Bulan</p>
                                                    <p className="text-xs font-black text-green-600 mt-0.5">{FORMAT_CURRENCY(p.price)}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rating</p>
                                                    <p className="text-xs font-black text-gray-900 mt-0.5">⭐ {p.rating}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <button className="flex-1 h-11 rounded-xl bg-gray-50 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors border border-gray-100">Preview</button>
                                                <button
                                                    onClick={() => { 
                                                        if (checkVerification()) {
                                                            setEditingKost(p); 
                                                            setShowKostForm(true); 
                                                        }
                                                    }}
                                                    className="w-11 h-11 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-orange-500 transition-colors shadow-md">
                                                    <Edit size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PESANAN */}
                    {activeMenu === 'bookings' && (
                        <div className="space-y-5 animate-in fade-in duration-300">
                            <div>
                                <h3 className="font-black text-gray-900 text-lg">Manajemen Pesanan</h3>
                                <p className="text-xs text-gray-400 font-bold mt-0.5 uppercase tracking-widest">Kelola semua permintaan sewa</p>
                            </div>

                            {/* Tabs */}
                            <div className="flex bg-gray-100/60 p-1 rounded-2xl gap-1">
                                {[
                                    { key: 'pending', label: 'Permintaan', count: bookings.filter(b => b.status === 'PENDING_APPROVAL').length },
                                    { key: 'awaiting_payment', label: 'Tunggu Bayar', count: bookings.filter(b => b.status === 'AWAITING_PAYMENT').length },
                                    { key: 'completed', label: 'Selesai', count: bookings.filter(b => ['PAID', 'COMPLETED'].includes(b.status)).length },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setBookingTab(tab.key as any)}
                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                                            bookingTab === tab.key
                                                ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                                                : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    >
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span className={`min-w-[18px] h-[18px] rounded-full text-[9px] font-black flex items-center justify-center px-1 ${
                                                bookingTab === tab.key ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                                            }`}>{tab.count}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Booking Cards */}
                            <div className="space-y-3">
                                {filteredBookings.map(b => (
                                    <div key={b.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 text-xl font-black shrink-0">
                                                    {b.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-gray-900 text-sm">{b.user?.name}</h4>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-400 mt-0.5">
                                                        <span className="text-gray-700">{b.metadata?.kostName}</span>
                                                        {b.metadata?.roomType && <> • {b.metadata.roomType}</>}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <span className="text-[9px] font-black text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">ID #{b.id.substring(0, 6)}</span>
                                                        {b.metadata?.startDate && <span className="text-[9px] font-bold text-gray-400">Mulai: {b.metadata.startDate}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 justify-between">
                                                <div className="sm:text-right">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nominal</p>
                                                    <p className="font-black text-gray-900">{FORMAT_CURRENCY(b.amount)}</p>
                                                </div>
                                                {bookingTab === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleReject(b.id)} className="h-10 px-4 rounded-xl border border-rose-200 text-rose-500 font-black text-[10px] uppercase hover:bg-rose-50 transition-colors">Tolak</button>
                                                        <button onClick={() => handleApprove(b.id)} className="h-10 px-5 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-orange-500 transition-colors">Setujui</button>
                                                    </div>
                                                )}
                                                {bookingTab === 'awaiting_payment' && (
                                                    <div className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                        <Clock size={13} />
                                                        <span className="text-[9px] font-black uppercase tracking-wide">Menunggu Bayar</span>
                                                    </div>
                                                )}
                                                {bookingTab === 'completed' && (
                                                    <div className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-green-50 text-green-600 border border-green-100">
                                                        <Check size={13} />
                                                        <span className="text-[9px] font-black uppercase tracking-wide">Selesai</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredBookings.length === 0 && (
                                    <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                                        <ClipboardList size={40} className="mx-auto text-gray-200 mb-3" />
                                        <p className="font-black text-gray-300 text-sm uppercase tracking-widest">Tidak ada pesanan</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CHAT */}
                    {activeMenu === 'chat' && (
                        <div className="animate-in fade-in duration-300 h-[calc(100vh-12rem)] flex flex-col">
                            <div className="mb-5">
                                <h3 className="font-black text-gray-900 text-lg">Pesan & Diskusi</h3>
                                <p className="text-xs text-gray-400 font-bold mt-0.5 uppercase tracking-widest">Komunikasi dengan calon penghuni</p>
                            </div>
                            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex overflow-hidden">
                                {/* Sidebar list */}
                                <div className={`${activeChat ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 flex-col border-r border-gray-50`}>
                                    <div className="p-4 border-b border-gray-50">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" placeholder="Cari percakapan..." className="w-full h-10 bg-gray-50 rounded-xl pl-9 pr-3 text-xs font-bold text-gray-900 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                                        {chatSessions.map(session => {
                                            const ts = session.last_message_at ? new Date(session.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
                                            return (
                                                <button
                                                    key={session.id}
                                                    onClick={() => setActiveChat(session)}
                                                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${activeChat?.id === session.id ? 'bg-orange-50/50 border-l-2 border-l-orange-500' : ''}`}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                                                        {session.user?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-baseline">
                                                            <p className="text-xs font-black text-gray-900 truncate">{session.user?.name}</p>
                                                            <span className="text-[9px] font-bold text-gray-400 shrink-0 ml-2">{ts}</span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide truncate mt-0.5">{(session as any).property?.title}</p>
                                                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{session.last_message}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Chat area */}
                                <div className={`${activeChat ? 'flex' : 'hidden sm:flex'} flex-1 flex-col`}>
                                    {activeChat ? (
                                        <>
                                            <div className="sm:hidden flex items-center gap-3 p-4 border-b border-gray-50">
                                                <button onClick={() => setActiveChat(null)} className="p-2 rounded-xl hover:bg-gray-50">
                                                    <ChevronRight size={18} className="rotate-180 text-gray-500" />
                                                </button>
                                                <p className="font-black text-sm text-gray-900">{activeChat.user?.name}</p>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <ChatWindow
                                                    session={activeChat}
                                                    currentUser={user}
                                                    onClose={() => setActiveChat(null)}
                                                    propertyName={(activeChat as any).property?.title}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-center p-8">
                                            <div>
                                                <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center mx-auto mb-4 text-orange-400 border border-orange-100">
                                                    <MessageSquare size={28} />
                                                </div>
                                                <p className="font-black text-gray-900 text-sm uppercase tracking-tight">Pilih Percakapan</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 max-w-[180px] mx-auto">Buka chat untuk membalas pesan penyewa</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DOMPET */}
                    {activeMenu === 'wallet' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="font-black text-gray-900 text-lg">Dompet & Keuangan</h3>
                                <p className="text-xs text-gray-400 font-bold mt-0.5 uppercase tracking-widest">Manajemen pendapatan sewa</p>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Balance Card */}
                                <div className="bg-gray-900 p-8 rounded-3xl text-white relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Total Saldo</p>
                                                <h3 className="text-3xl font-black tracking-tighter text-orange-400">{FORMAT_CURRENCY(stats.totalRevenue)}</h3>
                                                <p className="text-[10px] font-bold text-white/30 mt-1">Siap ditarik ke rekening Anda</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                                                <Wallet size={24} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative z-10 mt-6">
                                        <button className="h-12 w-full bg-orange-500 rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-400 transition-colors active:scale-95">
                                            Tarik Dana Sekarang
                                        </button>
                                    </div>
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/15 rounded-full blur-[60px]" />
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px]" />
                                </div>

                                {/* Bank Account */}
                                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col">
                                    <h4 className="font-black text-gray-900 mb-5">Rekening Bank</h4>
                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4 flex-1">
                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 font-black text-lg border border-gray-100">BCA</div>
                                        <div>
                                            <p className="font-black text-gray-900">123 - 4567 - 8890</p>
                                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">A/N {user?.displayName || 'Pemilik Kost'}</p>
                                        </div>
                                    </div>
                                    <button className="mt-4 h-11 w-full border-2 border-dashed border-gray-200 text-gray-400 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-colors">
                                        + Ganti Rekening Bank
                                    </button>
                                </div>
                            </div>

                            {/* History */}
                            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                                <h4 className="font-black text-gray-900 mb-5">Riwayat Transaksi</h4>
                                <div className="space-y-3">
                                    {bookings.filter(b => b.status === 'PAID').map(b => (
                                        <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-black text-sm">{b.user?.name?.charAt(0)}</div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-900">{b.user?.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400">{b.metadata?.kostName}</p>
                                                </div>
                                            </div>
                                            <p className="font-black text-green-600 text-sm">+{FORMAT_CURRENCY(b.amount)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PROFIL */}
                    {activeMenu === 'profile' && (
                        <div className="animate-in fade-in duration-300">
                            <MitraProfile 
                                uid={uid} 
                                user={user} 
                                onBack={() => setActiveMenu('overview')} 
                                onLogout={() => onPageChange?.(Page.HOME)} 
                            />
                        </div>
                    )}
                </main>

                {/* ── MOBILE BOTTOM NAV ────────────────────────────────────── */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-20 flex items-center px-2 pt-1 pb-safe-or-2 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
                    {NAV_ITEMS.map(item => (
                        <BottomNavItem
                            key={item.key}
                            active={activeMenu === item.key}
                            icon={item.icon}
                            label={item.label}
                            badge={item.badge}
                            onClick={() => setActiveMenu(item.key)}
                        />
                    ))}
                </nav>
            </div>
        </div>
    );

    return (
        <>
            {render}
            {showKostForm && (
                <KostFormMitra
                    editingKost={editingKost}
                    onClose={() => { setShowKostForm(false); setEditingKost(null); }}
                    onSuccess={() => { setShowKostForm(false); setEditingKost(null); loadData(); }}
                />
            )}
        </>
    );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const COLORS: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-500',
    purple: 'bg-purple-50 text-purple-500',
    green: 'bg-green-50 text-green-500',
    orange: 'bg-orange-50 text-orange-500',
};

const StatCard: React.FC<{ label: string; value: string; sub: string; icon: React.ReactNode; color: string; alert?: boolean }> = ({ label, value, sub, icon, color, alert }) => (
    <div className={`bg-white rounded-3xl p-4 lg:p-6 border shadow-sm relative overflow-hidden hover:shadow-lg transition-shadow ${alert ? 'border-orange-200 ring-2 ring-orange-100' : 'border-gray-100'}`}>
        {alert && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500 animate-ping" />}
        <div className={`w-10 h-10 rounded-2xl ${COLORS[color]} flex items-center justify-center mb-3`}>{icon}</div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight mt-0.5 truncate">{value}</p>
        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wide truncate">{sub}</p>
    </div>
);

export default MitraDashboard;
