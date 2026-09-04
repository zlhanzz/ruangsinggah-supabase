import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import KostFormMitra from '../components/KostFormMitra';
import { Kost, Page, MitraPromoPopupSetting } from '../types';
import { FORMAT_CURRENCY, INDONESIAN_BANKS } from '../constants';
import { getOwnerProperties, getOwnerBookings, updateBookingStatus } from '../userService';
import { getResidentStatus, getMitraPromoPopupSetting } from '../adminService';
import { getMyChatSessions, ChatSession, getOrCreateChatSession, markMessagesAsRead } from '../chatService';
import { getCurrentDate, setMockDate, getMockDateStr, parseDateSafely } from '../utils/timeUtils';
import { createKostSlug } from '../utils/slugUtils';
import MitraKostPreviewModal from '../components/mitra/MitraKostPreviewModal';
import { notifyAdminWithdrawalRequest } from '../emailService';
import TimeSimulator from '../components/TimeSimulator';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
    Zap, Home, ClipboardList, Wallet, User, Users, Compass,
    Plus, Edit, Eye, Check, MessageSquare, Search, Filter, MoreHorizontal, ArrowUpRight, ArrowRight,
    Clock, LogOut, Bell, ChevronRight, TrendingUp, Menu, X, Landmark, CreditCard, Save,
    Briefcase, GraduationCap, Heart, MapPin, Trash2, FileText,
    Bed, Lock, Send, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Phone
} from 'lucide-react';
import MitraProfile from './MitraProfile';
import ChatWindow from '../components/ChatWindow';
import { sendWhatsAppTemplate } from '../whatsappService';
import MitraTenantManagement from '../components/mitra/MitraTenantManagement';

interface MitraDashboardProps {
    uid: string;
    user?: any;
    onPageChange?: (page: Page) => void;
    onAddKost?: (newKost: Kost) => void;
    onEditKost?: (updatedKost: Kost) => void;
    onDeleteKost?: (id: string) => void;
    onLogout?: () => void;
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
    { id: 'B1', status: 'PENDING_APPROVAL', amount: 1500000, created_at: getCurrentDate().toISOString(), user: { name: 'Budi Santoso', email: 'budi@gmail.com', phone: '08123456789' }, metadata: { kostName: 'Kost Orange Premium', roomType: 'Kamar Standard', periodLabel: 'Per Bulan', startDate: '2026-04-01' } },
    { id: 'B2', status: 'AWAITING_PAYMENT', amount: 900000, created_at: getCurrentDate().toISOString(), user: { name: 'Siti Aminah', email: 'siti@gmail.com', phone: '08234567890' }, metadata: { kostName: 'Kost Sunrise Putera', roomType: 'Kamar Deluxe', periodLabel: 'Per 3 Bulan', startDate: '2026-04-15' } },
    { id: 'B3', status: 'PAID', amount: 1800000, created_at: new Date(getCurrentDate().getTime() - 7 * 86400000).toISOString(), user: { name: 'Andi Wijaya', email: 'andi@gmail.com', phone: '08345678901' }, metadata: { kostName: 'Kost Orange Premium', roomType: 'Kamar Premium', periodLabel: 'Per Bulan', startDate: '2026-03-01' } },
    { id: 'B4', status: 'PENDING_APPROVAL', amount: 900000, created_at: getCurrentDate().toISOString(), user: { name: 'Dewi Lestari', email: 'dewi@gmail.com', phone: '08456789012' }, metadata: { kostName: 'Kost Sunrise Putera', roomType: 'Kamar Standard', periodLabel: 'Per Bulan', startDate: '2026-04-10' } },
];

const DUMMY_CHATS: ChatSession[] = [
    { id: 'C1', user_id: 'u1', owner_id: 'dummy', last_message: 'Halo, apakah kamar masih ada pak?', last_message_at: new Date(getCurrentDate().getTime() - 1800000).toISOString(), created_at: '', updated_at: '', user: { name: 'Budi Santoso' }, property: { title: 'Kost Orange Premium' } } as any,
    { id: 'C2', user_id: 'u2', owner_id: 'dummy', last_message: 'Boleh survei besok jam 10?', last_message_at: new Date(getCurrentDate().getTime() - 3600000).toISOString(), created_at: '', updated_at: '', user: { name: 'Siti Aminah' }, property: { title: 'Kost Sunrise Putera' } } as any,
    { id: 'C3', user_id: 'u3', owner_id: 'dummy', last_message: 'Terima kasih sudah disetujui!', last_message_at: new Date(getCurrentDate().getTime() - 86400000).toISOString(), created_at: '', updated_at: '', user: { name: 'Andi Wijaya' }, property: { title: 'Kost Orange Premium' } } as any,
];

const CHART_DATA = [
    { day: 'Sen', views: 120 }, { day: 'Sel', views: 450 }, { day: 'Rab', views: 300 },
    { day: 'Kam', views: 500 }, { day: 'Jum', views: 800 }, { day: 'Sab', views: 1200 }, { day: 'Min', views: 950 }
];

type MenuKey = 'overview' | 'properties' | 'bookings' | 'tenants' | 'chat' | 'wallet' | 'profile' | 'km_progress';

// ── Sidebar Nav Item ──────────────────────────────────────────────────────────
const SideNavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; badge?: number; onClick: () => void }> = ({ active, icon, label, badge, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group ${active
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/10'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
    >
        <span className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-orange-500'} transition-colors`}>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {badge !== undefined && badge > 0 && (
            <span className="min-w-[20px] h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {badge > 9 ? '9+' : badge}
            </span>
        )}
    </button>
);

// ── Bottom Nav (Mobile) ───────────────────────────────────────────────────────
const BottomNavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; badge?: number; onClick: () => void }> = ({ active, icon, label, badge, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-3 transition-all ${active ? 'text-orange-600' : 'text-gray-600'}`}>
        <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 scale-105' : 'bg-gray-50'}`}>
            {React.cloneElement(icon as React.ReactElement, { size: active ? 22 : 20 })}
            {badge !== undefined && badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${active ? 'text-orange-600' : 'text-gray-500'}`}>{label}</span>
    </button>
);



// ── Main Component ────────────────────────────────────────────────────────────
const MitraDashboard: React.FC<MitraDashboardProps> = ({ uid, user, onPageChange, onLogout }) => {
    const navigate = useNavigate();

    const { "*": tab } = useParams();

    const getTargetMenu = (t: string | undefined): MenuKey => {
        if (!t) return 'overview';
        if (t.startsWith('profile/')) return 'profile';
        return (t as MenuKey) || 'overview';
    };

    const [activeMenu, setActiveMenu] = useState<MenuKey>(getTargetMenu(tab));

    // Sync state with URL — selalu sinkronkan saat tab berubah, termasuk saat tab kosong (fallback ke 'overview')
    useEffect(() => {
        const targetMenu = getTargetMenu(tab);
        if (targetMenu !== activeMenu) {
            setActiveMenu(targetMenu);
        }
    }, [tab]);

    const handleMenuChange = (menu: MenuKey) => {
        if (menu === 'properties' && promoPopupSetting?.is_active) {
            setShowPromoPopup(true);
        }
        navigate(`${Page.DASHBOARD_MITRA}/${menu}`);
    };
    const [bookingTab, setBookingTab] = useState<'pending' | 'awaiting_payment' | 'completed'>('pending');
    const [loading, setLoading] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [properties, setProperties] = useState<Kost[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [residentStatus, setResidentStatus] = useState<any[]>([]);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ totalRevenue: 0, availableBalance: 0, pendingApprovals: 0, totalViews: 1240, ctr: 4.2, activeTenants: 0 });
    const [showKostForm, setShowKostForm] = useState(false);
    const [editingKost, setEditingKost] = useState<Partial<Kost> | null>(null);
    const [previewingKost, setPreviewingKost] = useState<Kost | null>(null);
    const [promoPopupSetting, setPromoPopupSetting] = useState<MitraPromoPopupSetting | null>(null);
    const [showPromoPopup, setShowPromoPopup] = useState(false);
    const [isStartingFresh, setIsStartingFresh] = useState(false);
    const [quickRoomModalKost, setQuickRoomModalKost] = useState<Kost | null>(null);
    const [updatingRoomKostId, setUpdatingRoomKostId] = useState<string | null>(null);
    const draftStorageKey = useMemo(() => uid ? `kost_form_draft_${uid}` : 'kost_form_draft_guest', [uid]);
    const [activeDraft, setActiveDraft] = useState<{
        form: Partial<Kost>;
        step: number;
        managementOption?: string;
        lastSaved?: string;
    } | null>(null);

    // Load promo popup setting on mount and trigger if properties tab is open
    useEffect(() => {
        getMitraPromoPopupSetting().then(setting => {
            setPromoPopupSetting(setting);
            if (setting?.is_active && (tab === 'properties' || !tab)) {
                setShowPromoPopup(true);
            }
        });
    }, [tab]);

    // Handle Escape key for popup
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowPromoPopup(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const checkDraft = useCallback(() => {
        try {
            const raw = localStorage.getItem(draftStorageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.form && (parsed.form.title || parsed.form.address || parsed.form.price || parsed.step > 0 || (parsed.form.roomTypes && parsed.form.roomTypes.length > 0))) {
                    setActiveDraft(parsed);
                    return;
                }
            }
        } catch { }
        setActiveDraft(null);
    }, [draftStorageKey]);

    useEffect(() => {
        checkDraft();
        const handleDraftSync = () => checkDraft();
        window.addEventListener('kost_draft_updated', handleDraftSync);
        window.addEventListener('storage', handleDraftSync);
        return () => {
            window.removeEventListener('kost_draft_updated', handleDraftSync);
            window.removeEventListener('storage', handleDraftSync);
        };
    }, [checkDraft]);

    const handleDeleteDraft = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (window.confirm('Apakah Anda yakin ingin menghapus draft pendaftaran kost ini? Data formulir yang belum disimpan akan dibersihkan.')) {
            try {
                localStorage.removeItem(draftStorageKey);
                setActiveDraft(null);
                window.dispatchEvent(new Event('kost_draft_updated'));
            } catch { }
        }
    };

    const handleResumeDraft = () => {
        if (checkVerification()) {
            setEditingKost(null);
            setIsStartingFresh(false);
            setShowKostForm(true);
        }
    };

    const [dynamicChartData, setDynamicChartData] = useState<any[]>(CHART_DATA);
    const [kmRequests, setKmRequests] = useState<any[]>([]);

    // Withdrawal State
    const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isLoadingWallet, setIsLoadingWallet] = useState(false);

    // Withdrawal Bank Info State
    const [withdrawalAccount, setWithdrawalAccount] = useState({
        bank_name: user?.bank_name || 'BCA',
        bank_account: user?.bank_account || '123 - 4567 - 8890',
        bank_account_name: user?.bank_account_name || user?.displayName || user?.name || '-'
    });
    const [isEditingBank, setIsEditingBank] = useState(false);
    const [isSavingBank, setIsSavingBank] = useState(false);
    const [editForm, setEditForm] = useState({ ...withdrawalAccount });
    const [isTestingWa, setIsTestingWa] = useState(false);
    const [testWaPhone, setTestWaPhone] = useState('');
    const [selectedBookingForProfile, setSelectedBookingForProfile] = useState<any | null>(null);
    const [selectedUserForProfile, setSelectedUserForProfile] = useState<any | null>(null);

    // --- KOSTMANAGER SMART AUTO-PILOT STATE ---
    const [selectedKmForRooms, setSelectedKmForRooms] = useState<Kost | null>(null);
    const [showKmRoomTracker, setShowKmRoomTracker] = useState(false);
    const [selectedKmForRequest, setSelectedKmForRequest] = useState<Kost | null>(null);
    const [showKmRequestModal, setShowKmRequestModal] = useState(false);
    const [requestTab, setRequestTab] = useState<'hold' | 'price' | 'maintenance' | 'contact'>('hold');
    const [requestRoomNumber, setRequestRoomNumber] = useState('');
    const [requestNotes, setRequestNotes] = useState('');
    const [requestTargetPrice, setRequestTargetPrice] = useState('');
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

    // --- PANDUAN MULAI CEPAT (QUICK START GUIDE) STATE ---
    const [hasViewedListing, setHasViewedListing] = useState<boolean>(() => {
        return localStorage.getItem(`mitra_viewed_listing_${uid}`) === 'true';
    });
    const [tourCompleted, setTourCompleted] = useState<boolean>(() => {
        return localStorage.getItem('mitraTourCompleted') === 'true';
    });

    const handleViewListing = () => {
        if (properties.length > 0) {
            setPreviewingKost(properties[0]);
        } else {
            navigate(Page.LISTINGS);
        }
        setHasViewedListing(true);
        localStorage.setItem(`mitra_viewed_listing_${uid}`, 'true');
    };

    const handleCompleteTour = () => {
        localStorage.setItem('mitraTourCompleted', 'true');
        setTourCompleted(true);
    };

    const handleSubmitKmRequest = async () => {
        if (!selectedKmForRequest) return;
        if (requestTab === 'hold' && !requestRoomNumber) {
            alert('Silakan pilih nomor kamar yang ingin di-hold/kunci.');
            return;
        }
        if (requestTab === 'price' && (!requestTargetPrice || !requestNotes)) {
            alert('Silakan masukkan harga baru dan alasan penyesuaian.');
            return;
        }
        if (requestTab === 'maintenance' && !requestNotes) {
            alert('Silakan jelaskan detail perbaikan atau kendala fasilitas.');
            return;
        }

        setIsSubmittingRequest(true);
        try {
            alert('Permintaan Anda berhasil dikirim ke Tim KostManager RuangSinggah! Tim kami akan segera menindaklanjuti.');
            setShowKmRequestModal(false);
            setRequestNotes('');
            setRequestRoomNumber('');
            setRequestTargetPrice('');
        } catch (e: any) {
            alert('Gagal mengirim permintaan: ' + e.message);
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    const handleTestWhatsApp = async () => {
        if (!testWaPhone) {
            alert('Masukkan nomor WhatsApp (format 628xxx)');
            return;
        }
        setIsTestingWa(true);
        try {
            const res = await sendWhatsAppTemplate({
                to: testWaPhone,
                templateName: 'hello_world'
            });
            if (res.success) {
                alert('Berhasil! Silakan cek WhatsApp Anda.');
            } else {
                alert('Gagal: ' + (res.error?.error?.message || 'Error tidak diketahui'));
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setIsTestingWa(false);
        }
    };

    const saveWithdrawalAccount = async () => {
        setIsSavingBank(true);
        try {
            const { error } = await supabase.from('user_bank_accounts').upsert({
                user_id: uid,
                bank_name: editForm.bank_name,
                bank_account: editForm.bank_account,
                bank_account_name: editForm.bank_account_name,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            if (error) throw error;

            // Also trigger auth metadata update to sync with App.tsx
            await supabase.auth.updateUser({
                data: {
                    bank_name: editForm.bank_name,
                    bank_account: editForm.bank_account,
                    bank_account_name: editForm.bank_account_name
                }
            });

            setWithdrawalAccount({ ...editForm });
            setIsEditingBank(false);
            alert('Rekening penarikan diperbarui!');
        } catch (e: any) {
            alert('Gagal menyimpan: ' + e.message);
        } finally {
            setIsSavingBank(false);
        }
    };

    const isVerified = user?.verification_status === 'verified';

    const checkVerification = () => {
        if (!isVerified) {
            alert('Akses Dibatasi! Anda harus memverifikasi identitas terlebih dahulu sebelum dapat menambah atau mengelola unit kost.');
            handleMenuChange('profile');
            return false;
        }
        return true;
    };

    const loadData = async (silent = false) => {
        if (!uid) return;
        if (!silent) setLoading(true);
        try {
            const [propsData, rawBookingsData, statusRecords, chatData, withdrawalRequestsData, kmRequestsData] = await Promise.all([
                getOwnerProperties(uid),
                getOwnerBookings(uid),
                getResidentStatus(uid),
                getMyChatSessions(uid, 'owner'),
                supabase.from('withdrawal_requests').select('*').eq('agent_id', uid).order('created_at', { ascending: false }),
                supabase.from('kostmanager_requests').select('*').eq('user_id', uid).order('created_at', { ascending: false })
            ]);

            // GROUPING LOGIC: Group split transactions (Rent + Facility) into one card for the Owner
            const groupedBookingsMap = new Map<string, any>();

            // First pass: map all booking_session_ids to the main transaction ID
            const sessionToParentMap = new Map<string, string>();
            rawBookingsData.forEach((b: any) => {
                const bMeta = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : (b.metadata || {});
                if (bMeta.booking_session_id && (b.product_type === 'kost_booking' || b.product_type === 'perpanjangan_sewa')) {
                    sessionToParentMap.set(bMeta.booking_session_id, b.id);
                }
            });

            rawBookingsData.forEach((b: any) => {
                const bMeta = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : (b.metadata || {});

                // Determine the "True Parent ID" for this transaction
                // 1. If it has a booking_session_id that we mapped to a parent
                // 2. If it has a direct parent_order_id
                // 3. Fallback to its own ID
                const trueParentId = (bMeta.booking_session_id ? sessionToParentMap.get(bMeta.booking_session_id) : null)
                    || bMeta.parent_order_id
                    || b.id;

                if (!groupedBookingsMap.has(trueParentId)) {
                    groupedBookingsMap.set(trueParentId, {
                        ...b,
                        all_transactions: [b],
                        total_amount: Number(b.amount || 0)
                    });
                } else {
                    const existing = groupedBookingsMap.get(trueParentId);
                    existing.all_transactions.push(b);
                    existing.total_amount += Number(b.amount || 0);

                    // Priority for main display info: 'kost_booking' or 'perpanjangan_sewa'
                    const isMainProduct = ['kost_booking', 'perpanjangan_sewa', 'rent', 'kost'].includes(b.product_type);
                    if (isMainProduct) {
                        existing.id = b.id; // Ensure head ID is the Rent ID
                        existing.product_type = b.product_type;
                        existing.metadata = { ...existing.metadata, ...bMeta };
                        existing.amount = b.amount;
                    }
                }
            });

            const bookingsData = Array.from(groupedBookingsMap.values()).map(group => ({
                ...group,
                amount: group.total_amount // UI expects 'amount' to be the total
            }));

            const withdrawals = withdrawalRequestsData.data || [];
            setWithdrawalHistory(withdrawals);

            setProperties(propsData);
            setBookings(bookingsData);
            setResidentStatus(statusRecords);

            // Filter sesi chat: Pesan terkait properti KostManager dikelola oleh CS KostManager (tidak masuk ke Mitra)
            const kmPropIds = new Set(
                (propsData || [])
                    .filter((p: any) => p.is_managed === true || p.isManaged === true || p.kost_manager_status === 'ACTIVE' || p.kostManager?.status === 'ACTIVE')
                    .map((p: any) => p.id)
            );
            const nonKmChatSessions = (chatData || []).filter((s: any) => !kmPropIds.has(s.property_id));
            setChatSessions(nonKmChatSessions);

            setKmRequests(kmRequestsData.data || []);

            // --- TIME TRAVEL SYNCED ANALYTICS ---
            const now = getCurrentDate();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // 1. All-time paid revenue
            const allTimeRevenue = bookingsData
                .filter(b => ['PAID', 'COMPLETED'].includes((b.status || '').toUpperCase()))
                .reduce((a, b) => a + (b.amount || 0), 0);

            // 2. Total withdrawn
            const totalWithdrawn = withdrawals
                .filter(w => w.status !== 'rejected')
                .reduce((a, w) => a + Number(w.amount || 0), 0);

            // 3. Available balance
            const availableBalance = Math.max(0, allTimeRevenue - totalWithdrawn);

            // 4. Views (Total views from properties)
            const totalViews = propsData.reduce((a, p) => a + (p.views || 0), 0);

            // 5. Active Tenants (Direct from Resident Status Table)
            const activeCount = statusRecords.filter(r => {
                const daysLeft = r.end_date ? Math.ceil((new Date(r.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                return daysLeft >= 0;
            }).length;

            // 6. Dynamic Chart Data (Last 7 Days Views Trend)
            const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            const last7DaysData = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const dayLabel = days[d.getDay()];
                const dateKey = d.toISOString().split('T')[0];

                let dayViews = 0;
                propsData.forEach((p: any) => {
                    const meta = p.metadata || {};
                    const dv = meta.daily_views || {};
                    dayViews += Number(dv[dateKey] || 0);
                });

                last7DaysData.push({ day: dayLabel, views: dayViews });
            }
            setDynamicChartData(last7DaysData);

            // 7. Click-Through Rate (CTR) Calculation: (Bookings + Chat Inquiries) / Total Views
            const totalInteractions = bookingsData.length + nonKmChatSessions.length;
            const computedCtr = totalViews > 0
                ? parseFloat(((totalInteractions / totalViews) * 100).toFixed(1))
                : (totalInteractions > 0 ? 100 : 0);

            setStats({
                totalRevenue: allTimeRevenue,
                availableBalance: availableBalance,
                pendingApprovals: bookingsData.filter(b => (b.status || '').toUpperCase() === 'PENDING_APPROVAL' && !kmPropIds.has(b.product_id)).length,
                totalViews: totalViews,
                activeTenants: activeCount,
                ctr: computedCtr
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            setWithdrawalAccount({
                bank_name: user.bank_name || 'BCA',
                bank_account: user.bank_account || '123 - 4567 - 8890',
                bank_account_name: user.bank_account_name || user.displayName || user.name || '-'
            });
            setEditForm({
                bank_name: user.bank_name || 'BCA',
                bank_account: user.bank_account || '123 - 4567 - 8890',
                bank_account_name: user.bank_account_name || user.displayName || user.name || '-'
            });
        }
        loadData(true);

        // Real-time subscriptions
        if (uid) {
            const sessionsChannel = supabase
                .channel('mitra-chat-sessions')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'chat_sessions',
                    filter: `owner_id=eq.${uid}`
                }, () => {
                    loadData(true);
                })
                .subscribe();

            const statusChannel = supabase
                .channel('mitra-resident-status')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'resident_status'
                }, () => {
                    console.log('Resident status change detected');
                    loadData(true);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(sessionsChannel);
                supabase.removeChannel(statusChannel);
            };
        }
    }, [uid, user]);

    const handleApprove = async (group: any) => {
        if (!window.confirm('Setujui pesanan ini? Calon penghuni akan diminta melakukan pembayaran.')) return;
        try {
            setLoading(true);
            const transactions = group.all_transactions || [group];
            await Promise.all(transactions.map((t: any) => updateBookingStatus(t.id, 'AWAITING_PAYMENT')));
            await loadData();
            alert('Pengajuan sewa disetujui.');
        } catch (err: any) {
            alert('Gagal menyetujui: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (group: any) => {
        if (!window.confirm('Tolak pengajuan sewa ini?')) return;
        try {
            setLoading(true);
            const transactions = group.all_transactions || [group];
            await Promise.all(transactions.map((t: any) => updateBookingStatus(t.id, 'REJECTED')));
            await loadData();
            alert('Pengajuan sewa ditolak.');
        } catch (err: any) {
            alert('Gagal menolak: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteKost = async (id: string) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus kost ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
            setLoading(true);
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', id);
            if (error) throw error;

            alert('Kost berhasil dihapus.');
            await loadData();
        } catch (err: any) {
            alert('Gagal menghapus kost: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        const balance = stats.availableBalance;
        if (balance < 10000) {
            alert('Saldo minimal untuk penarikan adalah Rp 10.000');
            return;
        }
        if (!withdrawalAccount.bank_name || !withdrawalAccount.bank_account || !withdrawalAccount.bank_account_name) {
            alert('Silakan lengkapi dan simpan data rekening Anda terlebih dahulu.');
            return;
        }
        setIsWithdrawing(true);
        try {
            const { error } = await supabase
                .from('withdrawal_requests')
                .insert([{
                    agent_id: uid,
                    amount: balance,
                    bank_name: withdrawalAccount.bank_name,
                    bank_account: withdrawalAccount.bank_account,
                    bank_account_name: withdrawalAccount.bank_account_name,
                    status: 'pending'
                }]);
            if (error) throw error;

            alert('Pengajuan penarikan berhasil dikirim!');
            setShowWithdrawConfirm(false);
            await loadData();

            notifyAdminWithdrawalRequest({
                agent_id: uid,
                agent_name: user?.displayName || user?.name || 'Mitra (Owner)',
                amount: balance,
                bank_name: withdrawalAccount.bank_name,
                bank_account: withdrawalAccount.bank_account,
                bank_account_name: withdrawalAccount.bank_account_name
            });
        } catch (error: any) {
            console.error('Error submitting withdrawal:', error);
            alert('Gagal mengirim pengajuan penarikan: ' + error.message);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const kmPropIds = new Set(
        (properties || [])
            .filter((p: any) => p.is_managed === true || p.isManaged === true || p.kost_manager_status === 'ACTIVE' || p.kostManager?.status === 'ACTIVE')
            .map((p: any) => p.id)
    );

    const filteredBookings = bookings.filter(b => {
        const s = (b.status || '').toUpperCase();
        const isKm = kmPropIds.has(b.product_id);
        if (bookingTab === 'pending') return s === 'PENDING_APPROVAL' && !isKm;
        if (bookingTab === 'awaiting_payment') return s === 'AWAITING_PAYMENT';
        return s === 'PAID' || s === 'COMPLETED';
    });

    const pendingCount = bookings.filter(b => (b.status || '').toUpperCase() === 'PENDING_APPROVAL' && !kmPropIds.has(b.product_id)).length;
    const chatUnreadCount = (chatSessions || []).reduce((acc, s) => acc + (s.unread_count || 0), 0);

    const NAV_ITEMS: { key: MenuKey; icon: React.ReactNode; label: string; badge?: number }[] = [
        { key: 'overview', icon: <Zap size={20} />, label: 'Beranda' },
        { key: 'properties', icon: <Home size={20} />, label: 'Kost Saya' },
        { key: 'bookings', icon: <ClipboardList size={20} />, label: 'Pesanan', badge: pendingCount },
        { key: 'tenants', icon: <Users size={20} />, label: 'Penghuni Aktif', badge: stats.activeTenants },
        { key: 'chat', icon: <MessageSquare size={20} />, label: 'Pesan', badge: chatUnreadCount },
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

    const handleSelectChat = (session: ChatSession) => {
        setActiveChat(session);
        // Instant optimistic unread reset for this session
        setChatSessions(prev => prev.map(s => s.id === session.id ? { ...s, unread_count: 0 } : s));
        markMessagesAsRead(session.id, 'owner', uid);
    };

    const handleStartChat = async (tenantId: string, kostId: string) => {
        try {
            const session = await getOrCreateChatSession(tenantId, uid, kostId);
            handleSelectChat(session);
            handleMenuChange('chat');
        } catch (e: any) {
            alert('Gagal memulai percakapan: ' + e.message);
        }
    };

    const handlePromoNavigate = (url?: string) => {
        setShowPromoPopup(false);
        if (url && url.startsWith('http')) {
            window.open(url, '_blank');
            return;
        }
        const target = url ? (url === '/kost-manager' ? Page.KOSTMANAGER : url) : Page.KOSTMANAGER;
        if (onPageChange) {
            onPageChange(target as Page);
        } else {
            navigate(target);
        }
    };

    const handleQuickUpdateRooms = async (kostId: string, newAvailableCount: number, roomTypeIndex: number = 0) => {
        const targetKost = properties.find(p => p.id === kostId);
        if (!targetKost) return;

        const safeCount = Math.max(0, newAvailableCount);
        let updatedRoomTypes = [...(targetKost.roomTypes || [])];

        if (updatedRoomTypes.length === 0) {
            updatedRoomTypes = [{
                name: 'Kamar Standard',
                size: '3x3',
                price: targetKost.price || 0,
                availableRoomCount: safeCount,
                isAvailable: safeCount > 0,
                features: [],
                roomFacilities: [],
                bathroomFacilities: []
            }];
        } else if (updatedRoomTypes[roomTypeIndex]) {
            updatedRoomTypes[roomTypeIndex] = {
                ...updatedRoomTypes[roomTypeIndex],
                availableRoomCount: safeCount,
                isAvailable: safeCount > 0
            };
        } else {
            updatedRoomTypes[0] = {
                ...updatedRoomTypes[0],
                availableRoomCount: safeCount,
                isAvailable: safeCount > 0
            };
        }

        // Optimistic UI update
        const newProperties = properties.map(p => p.id === kostId ? { ...p, roomTypes: updatedRoomTypes } : p);
        setProperties(newProperties);
        if (quickRoomModalKost && quickRoomModalKost.id === kostId) {
            setQuickRoomModalKost({ ...quickRoomModalKost, roomTypes: updatedRoomTypes });
        }
        setUpdatingRoomKostId(kostId);

        try {
            const { error } = await supabase
                .from('properties')
                .update({
                    room_types: updatedRoomTypes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', kostId);

            if (error) throw error;
        } catch (err: any) {
            console.error('Error updating available rooms:', err);
            alert('Gagal memperbarui jumlah kamar: ' + err.message);
            loadData();
        } finally {
            setTimeout(() => setUpdatingRoomKostId(null), 500);
        }
    };

    const inTx = bookings
        .filter(b => ['PAID', 'COMPLETED'].includes((b.status || '').toUpperCase()))
        .map(b => ({
            id: `in-${b.id}`,
            date: new Date(b.created_at),
            type: 'IN',
            title: b.metadata?.kostName || b.property?.title || 'Sewa Kost',
            amount: b.amount,
            status: 'approved'
        }));

    const outTx = withdrawalHistory.map(w => ({
        id: `out-${w.id}`,
        date: new Date(w.created_at),
        type: 'OUT',
        title: `Penarikan Dana (${w.bank_name})`,
        amount: Number(w.amount),
        status: w.status
    }));

    const allTransactions = [...inTx, ...outTx]
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    const render = (
        <div className="min-h-screen bg-gray-50 font-sans flex">

            {/* ── DESKTOP SIDEBAR ───────────────────────────────────────────── */}
            <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col bg-white border-r border-gray-100 fixed top-20 left-0 h-[calc(100vh-5rem)] z-30">
                {/* User Info */}
                <div className="px-4 py-5 border-b border-gray-50">
                    <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100/40">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-orange-500/10">
                            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'M'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.displayName || 'Pemilik Kost'}</p>
                            <p className={`text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1 ${isVerified ? 'text-green-500' : 'text-orange-500'}`}>
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
                            onClick={() => handleMenuChange(item.key)}
                        />
                    ))}
                </nav>

                {/* Logout Option */}
                <div className="p-4 border-t border-gray-50">
                    <button
                        onClick={() => onLogout?.()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={18} />
                        Keluar Akun
                    </button>
                </div>


            </aside>

            {/* ── MOBILE OVERLAY SIDEBAR ───────────────────────────────────── */}
            {mobileSidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-[100] flex">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
                    <aside className="relative w-72 bg-white h-full flex flex-col shadow-2xl z-10">
                        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm">
                                    <Home size={18} fill="currentColor" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-xs font-black text-gray-900 leading-none tracking-tight uppercase">
                                        <span className="text-orange-500">RuangSinggah</span>.id
                                    </p>
                                    <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mt-0.5">Mitra Dashboard</p>
                                </div>
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
                                    onClick={() => { handleMenuChange(item.key); setMobileSidebarOpen(false); }}
                                />
                            ))}
                        </nav>

                        <div className="p-4 border-t border-gray-50">
                            <button
                                onClick={() => { onLogout?.(); setMobileSidebarOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={18} />
                                Keluar Akun
                            </button>
                        </div>


                    </aside>
                </div>
            )}

            <div className="flex-1 lg:ml-64 xl:ml-72 flex flex-col min-h-screen overflow-x-hidden">

                {/* Mobile Top Header Bar with Hamburger Menu */}
                <header className="lg:hidden h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-40">
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="p-2 rounded-xl hover:bg-gray-50 text-gray-600 focus:outline-none"
                    >
                        <Menu size={22} />
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-gray-950 leading-none">
                            <span className="text-orange-500">RuangSinggah</span>.id
                        </span>
                        <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest mt-0.5">Mitra Dashboard</span>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center">
                        {/* Empty space for alignment */}
                    </div>
                </header>

                {/* ── PAGE CONTENT ─────────────────────────────────────────── */}
                <main className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8 overflow-y-auto overflow-x-hidden">


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
                                            onClick={() => handleMenuChange('profile')}
                                            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-100 shrink-0"
                                        >
                                            Verifikasi Sekarang
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* KostManager Status / Upsell Banner */}
                            {(() => {
                                const hasKmActive = properties.some(p => p.isManaged) || kmRequests.length > 0;

                                if (hasKmActive) {
                                    return (
                                        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-5 lg:p-6 relative overflow-hidden shadow-md border border-emerald-500/20 text-white">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-2xl opacity-10 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                            <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between">
                                                <div className="text-left flex-1">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 rounded-full mb-2 shadow-sm backdrop-blur-sm">
                                                        <Sparkles size={11} className="text-amber-300 animate-pulse" fill="currentColor" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-200">KostManager Auto-Pilot Aktif</span>
                                                    </div>
                                                    <h3 className="text-base lg:text-lg font-black tracking-tight leading-tight">
                                                        Properti Anda Dikelola Penuh oleh RuangSinggah
                                                    </h3>
                                                    <p className="text-xs text-emerald-100 leading-relaxed max-w-2xl mt-1 font-medium font-sans">
                                                        Status kamar, foto terverifikasi, dan promosi dikelola secara profesional. Pantau okupansi kamar dan ajukan request kapan saja.
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 w-full md:w-auto">
                                                    <button
                                                        onClick={() => handleMenuChange('properties')}
                                                        className="bg-white hover:bg-emerald-50 text-emerald-800 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-transform active:scale-95 shadow-md shrink-0 flex items-center justify-center gap-1.5 w-full md:w-auto"
                                                    >
                                                        <Eye size={14} /> Pantau Properti
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return null;
                            })()}

                            {/* ── ALUR PEMILIK KOST (TIMELINE) & PANDUAN MULAI CEPAT ── */}
                            {!tourCompleted && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                    {(() => {
                                        const isKmManaged = properties.some(p => p.isManaged);
                                        const step1Done = Boolean(isVerified);
                                        const step2Done = step1Done && properties.length > 0;
                                        const step3Done = step2Done && (hasViewedListing || isKmManaged || stats.totalViews > 0);
                                        const step4Done = step3Done;

                                        const completedStepsCount = [step1Done, step2Done, step3Done, step4Done].filter(Boolean).length;
                                        const progressPercent = Math.round((completedStepsCount / 4) * 100);

                                        return (
                                            <div className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-7 shadow-sm relative overflow-hidden">
                                                {/* Decorative background element */}
                                                <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                                                {/* Header & Dismiss Button */}
                                                <div className="flex items-start justify-between relative z-10 mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Panduan Mulai Cepat</h3>
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700">
                                                                {completedStepsCount}/4 Langkah ({progressPercent}%)
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            Klik setiap langkah untuk navigasi cepat atau selesaikan panduan untuk mulai mengelola kost.
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={handleCompleteTour}
                                                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
                                                        title="Sembunyikan Panduan"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6 relative z-10">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-700"
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>

                                                {/* Steps Grid (Interactive Clickable Cards) */}
                                                <div className="relative z-10">
                                                    {/* Connecting Line (Desktop) */}
                                                    <div className="hidden lg:block absolute top-[20px] left-12 right-12 h-0.5 bg-gray-100 z-0" />

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                                                        {/* Step 1 */}
                                                        <button
                                                            onClick={() => handleMenuChange('profile')}
                                                            className={`p-4 rounded-2xl border text-left transition-all flex lg:flex-col items-center lg:items-center gap-3.5 cursor-pointer group ${step1Done
                                                                ? 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/80'
                                                                : 'bg-orange-50/40 border-orange-200 hover:bg-orange-50 ring-2 ring-orange-100'
                                                                }`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-transform group-hover:scale-110 shadow-sm ${step1Done ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-orange-500 text-white'
                                                                }`}>
                                                                {step1Done ? <Check size={18} /> : '1'}
                                                            </div>
                                                            <div className="lg:text-center min-w-0">
                                                                <p className={`text-xs font-black uppercase tracking-tight ${step1Done ? 'text-gray-900' : 'text-orange-600'}`}>
                                                                    Verifikasi Identitas
                                                                </p>
                                                                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                                                    {step1Done ? 'Identitas terverifikasi ✓' : 'Upload KTP untuk keamanan'}
                                                                </p>
                                                            </div>
                                                        </button>

                                                        {/* Step 2 */}
                                                        <button
                                                            onClick={() => { if (checkVerification()) handleMenuChange('properties'); }}
                                                            className={`p-4 rounded-2xl border text-left transition-all flex lg:flex-col items-center lg:items-center gap-3.5 cursor-pointer group ${step2Done
                                                                ? 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/80'
                                                                : (step1Done ? 'bg-orange-50/40 border-orange-200 hover:bg-orange-50 ring-2 ring-orange-100' : 'bg-gray-50/60 border-gray-100 opacity-60')
                                                                }`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-transform group-hover:scale-110 shadow-sm ${step2Done ? 'bg-emerald-500 text-white shadow-emerald-500/20' : (step1Done ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500')
                                                                }`}>
                                                                {step2Done ? <Check size={18} /> : '2'}
                                                            </div>
                                                            <div className="lg:text-center min-w-0">
                                                                <p className={`text-xs font-black uppercase tracking-tight ${step2Done ? 'text-gray-900' : (step1Done ? 'text-orange-600' : 'text-gray-500')}`}>
                                                                    Kelola & Upload Kost
                                                                </p>
                                                                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                                                    {step2Done ? `${properties.length} properti terdaftar ✓` : 'Isi detail & foto sewa'}
                                                                </p>
                                                            </div>
                                                        </button>

                                                        {/* Step 3 */}
                                                        <button
                                                            onClick={handleViewListing}
                                                            className={`p-4 rounded-2xl border text-left transition-all flex lg:flex-col items-center lg:items-center gap-3.5 cursor-pointer group ${step3Done
                                                                ? 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/80'
                                                                : (step2Done ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50 ring-2 ring-blue-100' : 'bg-gray-50/60 border-gray-100 opacity-60')
                                                                }`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-transform group-hover:scale-110 shadow-sm ${step3Done ? 'bg-emerald-500 text-white shadow-emerald-500/20' : (step2Done ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500')
                                                                }`}>
                                                                {step3Done ? <Check size={18} /> : '3'}
                                                            </div>
                                                            <div className="lg:text-center min-w-0">
                                                                <p className={`text-xs font-black uppercase tracking-tight ${step3Done ? 'text-gray-900' : (step2Done ? 'text-blue-600' : 'text-gray-500')}`}>
                                                                    Tampil di Marketplace
                                                                </p>
                                                                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                                                    {step3Done ? 'Listing aktif & siap dicari ✓' : 'Klik untuk preview POV user'}
                                                                </p>
                                                            </div>
                                                        </button>

                                                        {/* Step 4 */}
                                                        <button
                                                            onClick={() => handleMenuChange('bookings')}
                                                            className={`p-4 rounded-2xl border text-left transition-all flex lg:flex-col items-center lg:items-center gap-3.5 cursor-pointer group ${step4Done
                                                                ? 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/80'
                                                                : (step3Done ? 'bg-orange-50/40 border-orange-200 hover:bg-orange-50' : 'bg-gray-50/60 border-gray-100 opacity-60')
                                                                }`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-transform group-hover:scale-110 shadow-sm ${step4Done ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-gray-200 text-gray-500'
                                                                }`}>
                                                                {step4Done ? <Check size={18} /> : '4'}
                                                            </div>
                                                            <div className="lg:text-center min-w-0">
                                                                <p className={`text-xs font-black uppercase tracking-tight ${step4Done ? 'text-gray-900' : 'text-gray-500'}`}>
                                                                    Siap Terima Sewa
                                                                </p>
                                                                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                                                    {step4Done ? 'Siap terima transaksi ✓' : 'Terima pembayaran & sewa'}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Action Button CTA */}
                                                <div className="mt-7 flex justify-center relative z-10">
                                                    {!step1Done ? (
                                                        <button
                                                            onClick={() => handleMenuChange('profile')}
                                                            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-orange-500/25 flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <User size={15} /> Verifikasi Identitas Sekarang
                                                        </button>
                                                    ) : !step2Done ? (
                                                        <button
                                                            onClick={() => handleMenuChange('properties')}
                                                            className="bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-transform active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Plus size={15} /> Mulai Upload Kost Sekarang
                                                        </button>
                                                    ) : !step3Done ? (
                                                        <button
                                                            onClick={handleViewListing}
                                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Eye size={15} /> Lihat Listing Saya (POV User)
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={handleCompleteTour}
                                                            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Check size={16} /> Selesaikan Panduan & Buka Dashboard Penuh
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* ── MOBILE QUICK MENU (PINTAS MENU) ─────────────────── */}
                            <div className="lg:hidden grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleMenuChange('properties')}
                                    className="bg-white border-2 border-orange-100 rounded-3xl p-5 flex flex-col items-center text-center gap-3 active:scale-95 transition-all shadow-sm group hover:border-orange-500"
                                >
                                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-sm">
                                        <Home size={28} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Kelola Kost</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Atur Iklan</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleMenuChange('wallet')}
                                    className="bg-white border-2 border-blue-100 rounded-3xl p-5 flex flex-col items-center text-center gap-3 active:scale-95 transition-all shadow-sm group hover:border-blue-500"
                                >
                                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-sm">
                                        <Wallet size={28} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Cek Dompet</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Tarik Dana</p>
                                    </div>
                                </button>
                            </div>


                            {/* Stat Cards — 2 col on mobile, 3 col on desktop */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">

                                <StatCard label="Kunjungan" value={`${stats.totalViews.toLocaleString()}`} sub="Total views kost" icon={<Eye size={18} className="text-blue-500" />} color="blue" />
                                <StatCard label="CTR" value={`${stats.ctr}%`} sub="Click-through rate" icon={<TrendingUp size={18} className="text-purple-500" />} color="purple" />
                                <StatCard label="Pendapatan" value={FORMAT_CURRENCY(stats.totalRevenue)} sub="Total diterima" icon={<Wallet size={18} className="text-green-500" />} color="green" />
                                <StatCard label="Permintaan" value={`${pendingCount}`} sub="Butuh persetujuan" icon={<ClipboardList size={18} className="text-orange-500" />} color="orange" alert={pendingCount > 0} />
                            </div>

                            {/* Quick Links — Mobile only */}
                            <div className="grid grid-cols-2 gap-3 lg:hidden">
                                <button onClick={() => handleMenuChange('bookings')} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm active:scale-95 transition-transform">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0"><ClipboardList size={20} /></div>
                                    <div className="text-left"><p className="text-xs font-black text-gray-900">Pesanan</p><p className="text-[10px] text-gray-400 font-bold">{pendingCount} Baru</p></div>
                                </button>
                                <button onClick={() => handleMenuChange('chat')} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm active:scale-95 transition-transform">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><MessageSquare size={20} /></div>
                                    <div className="text-left"><p className="text-xs font-black text-gray-900">Pesan</p><p className="text-[10px] text-gray-400 font-bold">{chatUnreadCount > 0 ? `${chatUnreadCount} Belum Dibaca` : 'Semua Terbaca'}</p></div>
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
                                            <AreaChart data={dynamicChartData}>
                                                <defs>
                                                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 700 }} />
                                                <YAxis hide />
                                                <RechartsTooltip 
                                                    contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }} 
                                                    formatter={(val: any) => [`${val} Views`, 'Kunjungan']} 
                                                />
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
                                                                <img src={p.imageUrls[0] as string} className="w-full h-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
                                    <button onClick={() => handleMenuChange('bookings')} className="h-10 px-5 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 flex items-center gap-2 shrink-0">
                                        Lihat <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* KOST SAYA */}
                    {activeMenu === 'properties' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* KostManager Status / Upsell Banner */}
                            {(() => {
                                const hasKmActive = properties.some(p => p.isManaged) || kmRequests.length > 0;

                                if (hasKmActive) {
                                    return (
                                        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-5 lg:p-6 relative overflow-hidden shadow-md border border-emerald-500/20 text-white">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-2xl opacity-10 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                            <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between">
                                                <div className="text-left flex-1">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 rounded-full mb-2 shadow-sm backdrop-blur-sm">
                                                        <Sparkles size={11} className="text-amber-300 animate-pulse" fill="currentColor" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-200">KostManager Auto-Pilot Aktif</span>
                                                    </div>
                                                    <h3 className="text-base lg:text-lg font-black tracking-tight leading-tight">
                                                        Properti Anda Dikelola Penuh oleh RuangSinggah
                                                    </h3>
                                                    <p className="text-xs text-emerald-100 leading-relaxed max-w-2xl mt-1 font-medium font-sans">
                                                        Status kamar, foto terverifikasi, dan promosi dikelola secara profesional. Pantau okupansi kamar dan ajukan request kapan saja.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return null;
                            })()}

                            {(() => {
                                const publishedCount = properties.filter(p => p.status === 'published').length;
                                const inReviewCount = properties.filter(p => p.status !== 'published' && p.status !== 'suspended').length;
                                const suspendedCount = properties.filter(p => p.status === 'suspended').length;

                                return (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-black text-gray-900 text-lg">Kost Saya</h3>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs">
                                                <span className="font-black text-emerald-600 uppercase tracking-wider">
                                                    {publishedCount} Properti Tayang
                                                </span>
                                                {inReviewCount > 0 && (
                                                    <span className="font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                                                        • {inReviewCount} Menunggu Review
                                                    </span>
                                                )}
                                                {suspendedCount > 0 && (
                                                    <span className="font-black text-rose-600 uppercase tracking-wider flex items-center gap-1">
                                                        • {suspendedCount} Ditangguhkan
                                                    </span>
                                                )}
                                                {activeDraft && (
                                                    <span className="font-bold text-gray-400 uppercase tracking-wider">
                                                        • 1 Draft Pengisian
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (checkVerification()) {
                                                    setEditingKost(null);
                                                    setIsStartingFresh(true);
                                                    setShowKostForm(true);
                                                }
                                            }}
                                            className="h-11 px-5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
                                        >
                                            <Plus size={16} strokeWidth={3} /> Tambah
                                        </button>
                                    </div>
                                );
                            })()}

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {/* ── KARTU DRAFT KHUSUS (DAPAT DILANJUTKAN KAPAN SAJA) ── */}
                                {activeDraft && (
                                    <div className="bg-white rounded-3xl border-2 border-dashed border-amber-300 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between relative bg-gradient-to-b from-amber-50/40 via-white to-white">
                                        <div className="relative h-52 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-100/60 flex items-center justify-center overflow-hidden border-b border-amber-100">
                                            {activeDraft.form?.imageUrls && activeDraft.form.imageUrls.length > 0 ? (
                                                <img src={activeDraft.form.imageUrls[0] as string} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" alt="" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-amber-700/80 p-6 text-center">
                                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-amber-200 text-amber-500">
                                                        <FileText size={28} />
                                                    </div>
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-800">Draft Belum Selesai</span>
                                                </div>
                                            )}

                                            {/* Top Left: Step Info */}
                                            <div className="absolute top-4 left-4">
                                                <span className="px-3 py-1 bg-black/65 backdrop-blur-md text-white rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-1.5">
                                                    <Sparkles size={11} className="text-amber-400" /> Langkah {(activeDraft.step || 0) + 1} dari 6
                                                </span>
                                            </div>

                                            {/* Top Right: Status Badge */}
                                            <div className="absolute top-4 right-4">
                                                <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white shadow-md border border-amber-400 flex items-center gap-1.5 animate-pulse">
                                                    <Clock size={12} /> Draft
                                                </span>
                                            </div>

                                            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                                                <span className="text-[10px] font-bold bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-lg border border-white/10 text-amber-100">
                                                    Tersimpan Otomatis
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">
                                                    ● Form Dalam Pengisian
                                                </div>
                                                <h4 className="font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-orange-500 transition-colors text-base">
                                                    {activeDraft.form?.title || '(Draft Kost Tanpa Judul)'}
                                                </h4>
                                                <p className="text-xs font-bold text-gray-400 mt-1 flex items-center gap-1 uppercase tracking-widest truncate">
                                                    <MapPin size={12} className="text-amber-500 shrink-0" />
                                                    {activeDraft.form?.address || activeDraft.form?.city || 'Lokasi belum ditentukan'}
                                                </p>
                                                <div className="mt-4 p-3 bg-amber-50/80 rounded-2xl border border-amber-200/60 text-xs">
                                                    <p className="text-[11px] text-amber-900 font-semibold leading-relaxed">
                                                        Pengisian kost ini belum selesai. Klik <strong>Lanjutkan Edit</strong> untuk melengkapi data dan menayangkan kost Anda ke publik.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-5 pt-3 border-t border-amber-100">
                                                <button
                                                    onClick={handleResumeDraft}
                                                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
                                                >
                                                    <ArrowRight size={15} /> Lanjutkan Edit
                                                </button>
                                                <button
                                                    onClick={handleDeleteDraft}
                                                    className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors shadow-sm cursor-pointer"
                                                    title="Hapus Draft"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Properti Aktif */}
                                {properties.map(p => {
                                    const isKm = Boolean(p.isManaged);
                                    const totalRooms = p.roomTypes?.length || 0;
                                    const availRooms = p.roomTypes?.filter((r: any) => r.isAvailable !== false && r.status?.toLowerCase() !== 'terisi' && r.status?.toLowerCase() !== 'penuh')?.length || 0;
                                    const occRate = totalRooms > 0 ? Math.round(((totalRooms - availRooms) / totalRooms) * 100) : 0;

                                    return (
                                        <div key={p.id} className={`bg-white rounded-3xl border overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group ${isKm ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-100'}`}>
                                            <div className="relative h-52">
                                                <img src={p.imageUrls[0] as string} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                                                {/* Badges */}
                                                <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                                                    {isKm && (
                                                        <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 border border-orange-300">
                                                            <Sparkles size={11} className="text-white" /> KostManager Auto-Pilot
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="absolute top-4 right-4">
                                                    {p.status === 'published' ? (
                                                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white border border-emerald-400 shadow-md flex items-center gap-1">
                                                            <CheckCircle2 size={11} /> Tayang Publik
                                                        </span>
                                                    ) : p.status === 'suspended' ? (
                                                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white border border-rose-400 shadow-md flex items-center gap-1">
                                                            <AlertCircle size={11} /> Ditangguhkan
                                                        </span>
                                                    ) : ((p as any).revisionNotes || (p as any).metadata?.revision_notes) ? (
                                                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white border border-amber-400 shadow-md flex items-center gap-1">
                                                            <AlertCircle size={11} /> Perlu Revisi
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white border border-amber-400 shadow-md flex items-center gap-1 animate-pulse">
                                                            <Clock size={11} /> Sedang Ditinjau
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                                                    <p className="text-[10px] font-bold opacity-80">{p.views || 0} views</p>
                                                    {isKm && (
                                                        <span className="text-[10px] font-black bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/20">
                                                            Okupansi {occRate}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-5">
                                                <h4 className="font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-orange-500 transition-colors text-base">
                                                    {p.title}
                                                </h4>

                                                <p className="text-xs font-bold text-gray-400 mt-1 flex items-center gap-1 uppercase tracking-widest truncate">
                                                    <MapPin size={12} className="text-orange-400 shrink-0" /> {p.address || p.city}
                                                </p>

                                                {isKm ? (
                                                    <div className="mt-4 p-3 bg-orange-50/70 border border-orange-200/60 rounded-2xl">
                                                        <div className="flex items-center justify-between text-xs mb-1">
                                                            <span className="font-bold text-orange-950 flex items-center gap-1.5">
                                                                <Bed size={13} className="text-orange-600" />
                                                                Ketersediaan Unit
                                                            </span>
                                                            <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                                                                {availRooms} dari {totalRooms} Kamar Kosong
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-orange-800/80 font-medium leading-relaxed mt-1">
                                                            Dikelola secara Auto-Pilot. Bebas dari repot penagihan sewa & administrasi.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <>
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

                                                        {/* ── KENDALI CEPAT KAMAR TERSEDIA ── */}
                                                        <div className="mt-3.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-2xs">
                                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Bed size={13} className="text-orange-500" />
                                                                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-wider">Kamar Tersedia</span>
                                                                </div>
                                                                {availRooms > 0 ? (
                                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                        {availRooms} Kosong
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                                        Penuh
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {p.roomTypes && p.roomTypes.length > 1 ? (
                                                                <div className="space-y-1.5">
                                                                    <div className="text-[10px] text-gray-500 font-semibold flex items-center justify-between px-0.5">
                                                                        <span>{p.roomTypes.length} Tipe Kamar</span>
                                                                        <span className="text-orange-600 font-bold">{availRooms} Siap Huni</span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setQuickRoomModalKost(p)}
                                                                        className="w-full py-2 px-3 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 cursor-pointer"
                                                                    >
                                                                        <Zap size={12} fill="currentColor" /> Atur Ketersediaan Jumlah Kamar
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between gap-2 bg-white p-1.5 rounded-xl border border-slate-200/60 shadow-2xs">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickUpdateRooms(p.id, (p.roomTypes?.[0]?.availableRoomCount ?? (p.roomTypes?.[0]?.isAvailable !== false ? 1 : 0)) - 1, 0)}
                                                                        disabled={(p.roomTypes?.[0]?.availableRoomCount ?? (p.roomTypes?.[0]?.isAvailable !== false ? 1 : 0)) <= 0 || updatingRoomKostId === p.id}
                                                                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-orange-100 text-gray-700 hover:text-orange-600 disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-gray-700 font-black text-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed select-none"
                                                                        title="Kurangi 1 Kamar Kosong"
                                                                    >
                                                                        -
                                                                    </button>

                                                                    <div className="flex-1 flex flex-col items-center justify-center">
                                                                        <span className="text-sm font-black text-gray-900 leading-tight">
                                                                            {p.roomTypes?.[0]?.availableRoomCount ?? (p.roomTypes?.[0]?.isAvailable !== false ? 1 : 0)} <span className="text-[10px] font-bold text-gray-500">Kamar</span>
                                                                        </span>
                                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                                                            {updatingRoomKostId === p.id ? 'Menyimpan...' : 'Siap Disewa'}
                                                                        </span>
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickUpdateRooms(p.id, (p.roomTypes?.[0]?.availableRoomCount ?? (p.roomTypes?.[0]?.isAvailable !== false ? 1 : 0)) + 1, 0)}
                                                                        disabled={updatingRoomKostId === p.id}
                                                                        className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-black text-sm flex items-center justify-center transition-all shadow-xs shadow-orange-500/20 active:scale-95 cursor-pointer disabled:opacity-50 select-none"
                                                                        title="Tambah 1 Kamar Kosong"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}

                                                {/* Info Banner Khusus Properti Dalam Tahap Peninjauan / Revisi */}
                                                {p.status !== 'published' && p.status !== 'suspended' && ((p as any).revisionNotes || (p as any).metadata?.revision_notes) ? (
                                                    <div className="mt-3.5 p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl flex items-start gap-2.5 shadow-xs">
                                                        <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                                            <AlertCircle size={15} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <p className="font-black text-amber-950 text-xs uppercase tracking-wide">
                                                                    Perlu Revisi dari Admin
                                                                </p>
                                                                <span className="px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded text-[9px] font-black uppercase tracking-wider">
                                                                    Catatan Evaluasi
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-amber-900 font-semibold leading-relaxed">
                                                                {(p as any).revisionNotes || (p as any).metadata?.revision_notes}
                                                            </p>
                                                            <p className="text-[10px] text-amber-700/90 mt-1">
                                                                Silakan klik tombol <strong>Edit</strong> untuk memperbaiki data yang diminta, lalu ajukan kembali.
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : p.status !== 'published' && p.status !== 'suspended' ? (
                                                    <div className="mt-3.5 p-3.5 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/90 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 shadow-xs">
                                                        <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                                            <Clock size={15} className="animate-pulse" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <p className="font-black text-amber-950 text-xs uppercase tracking-wide">
                                                                    Tahap Peninjauan Admin
                                                                </p>
                                                                <span className="px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded text-[9px] font-black uppercase tracking-wider">
                                                                    Estimasi 1×24 Jam
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-amber-900/90 font-medium leading-relaxed">
                                                                Listing Anda telah berhasil diajukan dan sedang diverifikasi oleh tim RuangSinggah. Listing akan <strong>otomatis tayang di pencarian publik</strong> setelah disetujui.
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Info Banner Khusus Properti Ditangguhkan */}
                                                {p.status === 'suspended' && (
                                                    <div className="mt-3.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 shadow-xs">
                                                        <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                                                            <AlertCircle size={15} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-black text-rose-950 text-xs uppercase tracking-wide">
                                                                Listing Ditangguhkan
                                                            </p>
                                                            <p className="text-[11px] text-rose-900/90 font-medium leading-relaxed">
                                                                {(p as any).metadata?.suspend_reason || 'Listing memerlukan perbaikan data. Silakan klik tombol edit untuk memperbarui data kost Anda.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                {isKm ? (
                                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedKmForRooms(p);
                                                                setShowKmRoomTracker(true);
                                                            }}
                                                            className="h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
                                                        >
                                                            <Eye size={14} /> Pantau Kamar
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedKmForRequest(p);
                                                                setShowKmRequestModal(true);
                                                            }}
                                                            className="h-11 rounded-xl bg-gray-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                                                        >
                                                            <Send size={13} /> Request Aksi
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2 mt-4">
                                                        <button
                                                            onClick={() => setPreviewingKost(p)}
                                                            className="flex-1 h-11 rounded-xl bg-gray-50 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors border border-gray-100 flex items-center justify-center gap-1 cursor-pointer"
                                                        >
                                                            <Eye size={14} /> Preview
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (checkVerification()) {
                                                                    setEditingKost(p);
                                                                    setShowKostForm(true);
                                                                }
                                                            }}
                                                            className="w-11 h-11 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-orange-500 transition-colors shadow-md"
                                                            title="Edit Kost"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteKost(p.id)}
                                                            className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors shadow-sm"
                                                            title="Hapus Kost"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Empty State if no properties and no draft */}
                                {properties.length === 0 && !activeDraft && (
                                    <div className="col-span-full py-16 px-4 text-center bg-gray-50/60 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-3xl bg-orange-100/60 text-orange-600 flex items-center justify-center mb-4">
                                            <Home size={30} />
                                        </div>
                                        <h4 className="text-base font-black text-gray-800 uppercase tracking-tight">Belum Ada Kost yang Didaftarkan</h4>
                                        <p className="text-xs text-gray-500 font-medium max-w-sm mt-1 mb-5">
                                            Mulai daftarkan properti kost Anda untuk menjangkau ribuan calon penyewa di RuangSinggah.
                                        </p>
                                        <button
                                            onClick={() => {
                                                if (checkVerification()) {
                                                    setEditingKost(null);
                                                    setIsStartingFresh(true);
                                                    setShowKostForm(true);
                                                }
                                            }}
                                            className="h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md shadow-orange-500/20 flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
                                        >
                                            <Plus size={16} strokeWidth={3} /> Daftarkan Kost Pertama
                                        </button>
                                    </div>
                                )}
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
                                    { key: 'pending', label: 'Permintaan', count: bookings.filter(b => (b.status || '').toUpperCase() === 'PENDING_APPROVAL').length },
                                    { key: 'awaiting_payment', label: 'Tunggu Bayar', count: bookings.filter(b => (b.status || '').toUpperCase() === 'AWAITING_PAYMENT').length },
                                    { key: 'completed', label: 'Selesai', count: bookings.filter(b => ['PAID', 'COMPLETED'].includes((b.status || '').toUpperCase())).length },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setBookingTab(tab.key as any)}
                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${bookingTab === tab.key
                                            ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span className={`min-w-[18px] h-[18px] rounded-full text-[9px] font-black flex items-center justify-center px-1 ${bookingTab === tab.key ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                                                }`}>{tab.count}</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Booking Cards */}
                            <div className="space-y-3">
                                {filteredBookings.map(b => (
                                    <div key={b.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group/card">
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* Kost Preview Image */}
                                            <div className="w-full lg:w-48 h-32 rounded-2xl bg-gray-100 overflow-hidden shrink-0 relative">
                                                {(b.property?.image_urls?.[0]) ? (
                                                    <img
                                                        src={b.property.image_urls[0]}
                                                        className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                                                        alt=""
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'flex-col', 'items-center', 'justify-center');
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                                        <Home size={24} className="mb-1" />
                                                        <span className="text-[8px] font-black uppercase">No Image</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                            </div>

                                            <div className="flex-1 flex flex-col sm:flex-row justify-between gap-6">
                                                <div className="flex-1 space-y-4">
                                                    {/* Applicant Info Header - PRIORITIZED */}
                                                    <div className="flex items-center gap-5">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedBookingForProfile(b); }}
                                                            className="w-16 h-16 rounded-[1.5rem] bg-orange-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-orange-100 hover:scale-110 active:scale-95 transition-all overflow-hidden shrink-0 border-4 border-white relative"
                                                        >
                                                            {/* Layer 1: Initials (Always present in background) */}
                                                            <span className="absolute inset-0 flex items-center justify-center drop-shadow-sm pointer-events-none">
                                                                {b.user?.name?.charAt(0) || 'U'}
                                                            </span>

                                                            {/* Layer 2: Image (On top) */}
                                                            {b.user?.photo_url && (
                                                                <img
                                                                    src={b.user.photo_url}
                                                                    className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300"
                                                                    alt="" // Empty alt to prevent text-over-image on error
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            )}
                                                        </button>
                                                        <div className="min-w-0">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedBookingForProfile(b); }}
                                                                    className="font-black text-gray-900 text-2xl lg:text-3xl tracking-tight hover:text-orange-500 transition-colors text-left block truncate max-w-full leading-none"
                                                                >
                                                                    {b.user?.name}
                                                                </button>

                                                                {/* CHAT BUTTON - ONLY FOR APPROVED BOOKINGS */}
                                                                {b.status !== 'PENDING_APPROVAL' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleMenuChange('chat');
                                                                            // Logic to select this specific chat will be handled by chatService/state
                                                                        }}
                                                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 hover:bg-blue-100 transition-all active:scale-95 group shrink-0 w-fit"
                                                                    >
                                                                        <MessageSquare size={12} className="group-hover:rotate-12 transition-transform" />
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-center">Kirim Pesan</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-orange-100">
                                                                    {b.property?.title}
                                                                </span>
                                                                {kmPropIds.has(b.product_id) && (
                                                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                                                                        ⚡ Dikelola KostManager
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center">
                                                                    #{b.id.substring(0, 6)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Booking Details Grid */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                                                        <div>
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Paket Sewa</p>
                                                            <p className="text-xs font-black text-gray-700">{b.metadata?.periodLabel || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tipe Kamar</p>
                                                            <p className="text-xs font-black text-gray-700 truncate">{b.metadata?.roomType || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Penghuni</p>
                                                            <p className="text-xs font-black text-gray-700">{b.metadata?.occupantCount || 1} Orang</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tgl Masuk</p>
                                                            <p className="text-xs font-black text-gray-700">{b.metadata?.startDate || '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions & Price */}
                                                <div className="flex flex-col items-end justify-between min-w-[140px]">
                                                    <div className="text-right w-full">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Tagihan</p>
                                                        <p className="text-xl font-black text-orange-600">{FORMAT_CURRENCY(b.amount)}</p>
                                                    </div>

                                                    <div className="w-full mt-4">
                                                        {bookingTab === 'pending' && (
                                                            <div className="flex flex-col gap-2">
                                                                <button
                                                                    onClick={() => handleReject(b)}
                                                                    className="w-full h-10 rounded-xl border border-rose-200 text-rose-500 font-black text-[10px] uppercase hover:bg-rose-50 transition-colors"
                                                                >
                                                                    Tolak
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApprove(b)}
                                                                    className="w-full h-10 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-gray-200 hover:bg-orange-500 transition-all active:scale-95"
                                                                >
                                                                    Setujui
                                                                </button>
                                                            </div>
                                                        )}
                                                        {bookingTab === 'awaiting_payment' && (
                                                            <div className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 w-full animate-pulse">
                                                                <Clock size={16} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Tunggu Bayar</span>
                                                            </div>
                                                        )}
                                                        {bookingTab === 'completed' && (
                                                            <div className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-green-50 text-green-600 border border-green-100 w-full">
                                                                <Check size={16} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Selesai</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
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

                    {/* PENGHUNI AKTIF */}
                    {activeMenu === 'tenants' && (
                        <div className="animate-in fade-in duration-300">
                            <MitraTenantManagement
                                residentStatus={residentStatus}
                                properties={properties}
                                bookings={bookings}
                                refreshData={loadData}
                                onViewUserProfile={(userData) => setSelectedUserForProfile(userData)}
                                onStartChat={handleStartChat}
                            />
                        </div>
                    )}

                    {/* CHAT */}
                    {activeMenu === 'chat' && (
                        <div className="animate-in fade-in duration-300 h-[calc(100vh-8.5rem)] min-h-[640px] flex flex-col">
                            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg">Pesan & Diskusi</h3>
                                    <p className="text-xs text-gray-400 font-bold mt-0.5 uppercase tracking-widest">Komunikasi dengan calon penghuni</p>
                                </div>
                                {chatUnreadCount > 0 && (
                                    <span className="self-start sm:self-auto bg-rose-50 border border-rose-200 text-rose-600 text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                        {chatUnreadCount} Pesan Belum Dibaca
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex overflow-hidden">
                                {/* Sidebar list */}
                                <div className={`${activeChat ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 md:w-96 lg:w-[360px] xl:w-[380px] shrink-0 flex-col border-r border-gray-100 bg-white`}>
                                    <div className="p-4 border-b border-gray-100 bg-white">
                                        <div className="relative">
                                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={chatSearchQuery}
                                                onChange={(e) => setChatSearchQuery(e.target.value)}
                                                placeholder="Cari percakapan..."
                                                className="w-full h-11 bg-gray-50/80 rounded-2xl pl-10 pr-4 text-xs font-bold text-gray-900 border border-gray-100 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                                        {(() => {
                                            const filteredSessions = chatSessions.filter(session => {
                                                const tenantName = session.user?.name || '';
                                                const propTitle = (session as any).property?.title || '';
                                                const lastMsg = session.last_message || '';
                                                const q = chatSearchQuery.toLowerCase().trim();
                                                return !q || tenantName.toLowerCase().includes(q) || propTitle.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
                                            });

                                            if (filteredSessions.length === 0) {
                                                return (
                                                    <div className="p-12 text-center">
                                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                                                            <MessageSquare size={26} />
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-400">
                                                            {chatSearchQuery ? 'Tidak ada percakapan yang cocok' : 'Belum ada pesan masuk'}
                                                        </p>
                                                    </div>
                                                );
                                            }

                                            return filteredSessions.map(session => {
                                                const ts = session.last_message_at ? new Date(session.last_message_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
                                                const hasUnread = Boolean(session.unread_count && session.unread_count > 0);
                                                const isSelected = activeChat?.id === session.id;
                                                return (
                                                    <button
                                                        key={session.id}
                                                        onClick={() => handleSelectChat(session)}
                                                        className={`w-full p-4 flex items-start gap-3.5 hover:bg-orange-50/30 transition-all text-left cursor-pointer ${
                                                            isSelected 
                                                                ? 'bg-orange-50/60 border-l-4 border-l-orange-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]' 
                                                                : ''
                                                        }`}
                                                    >
                                                        <div className="relative shrink-0">
                                                            <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-sm shadow-sm overflow-hidden">
                                                                {session.user?.photo_url ? (
                                                                    <img src={session.user.photo_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    session.user?.name?.charAt(0)?.toUpperCase() || '?'
                                                                )}
                                                            </div>
                                                            {hasUnread && (
                                                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-baseline mb-0.5">
                                                                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                                                    <p className="text-xs font-black text-gray-900 truncate">{session.user?.name || 'Calon Penghuni'}</p>
                                                                    {hasUnread && (
                                                                        <span className="min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shrink-0 shadow-sm animate-pulse">
                                                                            {(session.unread_count || 0) > 9 ? '9+' : session.unread_count}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] font-bold text-gray-400 shrink-0">{ts}</span>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wide truncate">{(session as any).property?.title}</p>
                                                            <p className={`text-[11px] truncate mt-0.5 ${hasUnread ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>{session.last_message || 'Belum ada pesan'}</p>
                                                        </div>
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>

                                {/* Chat area */}
                                <div className={`${activeChat ? 'flex' : 'hidden sm:flex'} flex-1 flex-col bg-white`}>
                                    {activeChat ? (
                                        <div className="flex-1 overflow-hidden flex flex-col h-full">
                                            <ChatWindow
                                                session={activeChat}
                                                currentUser={user}
                                                onClose={() => setActiveChat(null)}
                                                propertyName={(activeChat as any).property?.title}
                                                isEmbedded={true}
                                                onMessagesRead={() => {
                                                    setChatSessions(prev => prev.map(s => s.id === activeChat.id ? { ...s, unread_count: 0 } : s));
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-center p-8 bg-slate-50/40">
                                            <div className="max-w-sm">
                                                <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center mx-auto mb-4 text-orange-500 border border-orange-100 shadow-sm">
                                                    <MessageSquare size={36} />
                                                </div>
                                                <h4 className="font-black text-gray-900 text-base tracking-tight">Pilih Percakapan</h4>
                                                <p className="text-xs font-medium text-gray-400 mt-1.5 leading-relaxed">
                                                    Pilih salah satu calon penghuni dari daftar di sebelah kiri untuk membuka pesan dan membalas diskusi.
                                                </p>
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
                                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl text-white relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-lg shadow-indigo-950/10 border border-slate-800 animate-in fade-in duration-500">
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Saldo Tersedia</p>
                                                <h3 className="text-3xl font-bold tracking-tighter text-orange-400">{FORMAT_CURRENCY(stats.availableBalance)}</h3>
                                                <p className="text-[10px] font-semibold text-white/30 mt-1">Siap ditarik ke rekening Anda</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 animate-pulse">
                                                <Wallet size={24} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative z-10 mt-6">
                                        <button
                                            onClick={() => {
                                                if (stats.availableBalance < 10000) {
                                                    alert('Saldo minimal untuk penarikan adalah Rp 10.000');
                                                    return;
                                                }
                                                if (!withdrawalAccount.bank_account || !withdrawalAccount.bank_name) {
                                                    alert('Silakan isi dan simpan data rekening penarikan terlebih dahulu.');
                                                    return;
                                                }
                                                setShowWithdrawConfirm(true);
                                            }}
                                            className="h-12 w-full bg-orange-500 rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-400 transition-colors active:scale-95"
                                        >
                                            Tarik Dana Sekarang
                                        </button>
                                    </div>
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/15 rounded-full blur-[60px]" />
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px]" />
                                </div>

                                {/* Bank Account */}
                                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col">
                                    <h4 className="font-black text-gray-900 mb-5">Rekening Penarikan</h4>
                                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4 flex-1">
                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-500 font-black text-[10px] uppercase border border-gray-100 px-2 text-center break-all leading-tight">{withdrawalAccount.bank_name}</div>
                                        <div>
                                            <p className="font-black text-gray-900">{withdrawalAccount.bank_account}</p>
                                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">A/N {withdrawalAccount.bank_account_name}</p>
                                        </div>
                                    </div>
                                    <button className="mt-4 h-11 w-full border-2 border-dashed border-gray-200 text-gray-400 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200 transition-colors" onClick={() => { setEditForm({ ...withdrawalAccount }); setIsEditingBank(true); }} >
                                        + Ganti Rekening Penarikan
                                    </button>
                                </div>
                            </div>

                            {/* History */}
                            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                                <h4 className="font-black text-gray-900 mb-5">Riwayat Transaksi</h4>
                                <div className="space-y-3">
                                    {allTransactions.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 font-bold text-xs uppercase tracking-widest">Belum ada transaksi</div>
                                    ) : (
                                        allTransactions.map(tx => (
                                            <div key={tx.id} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-50 hover:bg-white hover:border-orange-100 transition-all group gap-4 min-w-0">
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${tx.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'
                                                        }`}>
                                                        {tx.type}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-black text-gray-900 flex items-center gap-1.5 min-w-0">
                                                            <span className="block truncate flex-1">{tx.title}</span>
                                                            {tx.type === 'OUT' && tx.status === 'pending' && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 uppercase tracking-wider shrink-0">Diproses</span>
                                                            )}
                                                            {tx.type === 'OUT' && tx.status === 'rejected' && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 uppercase tracking-wider shrink-0">Ditolak</span>
                                                            )}
                                                            {tx.type === 'OUT' && tx.status === 'approved' && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-800 uppercase tracking-wider shrink-0">Selesai</span>
                                                            )}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{tx.date.toLocaleDateString('id-ID')}</p>
                                                    </div>
                                                </div>
                                                <p className={`text-sm font-black shrink-0 ${tx.type === 'IN' ? 'text-green-600' : 'text-rose-600'
                                                    }`}>
                                                    {tx.type === 'IN' ? '+' : '-'}{FORMAT_CURRENCY(tx.amount)}
                                                </p>
                                            </div>
                                        ))
                                    )}
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
                                onBack={() => handleMenuChange('overview')}
                                onLogout={() => onPageChange?.(Page.HOME)}
                                autoOpenKmProgress={tab === 'profile/km-progress'}
                            />
                        </div>
                    )}
                </main>

                {/* ── MOBILE BOTTOM NAV ────────────────────────────────────── */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex items-center px-3 pt-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
                    {NAV_ITEMS.filter(item => ['overview', 'bookings', 'tenants', 'chat', 'profile'].includes(item.key)).map(item => (
                        <BottomNavItem
                            key={item.key}
                            active={activeMenu === item.key}
                            icon={item.icon}
                            label={item.label}
                            badge={item.badge}
                            onClick={() => handleMenuChange(item.key)}
                        />
                    ))}
                </nav>
            </div>
            <TimeSimulator />
        </div>
    );

    return (
        <>
            {render}
            {previewingKost && (
                <MitraKostPreviewModal
                    kost={previewingKost}
                    onClose={() => setPreviewingKost(null)}
                    onEdit={(k) => {
                        setPreviewingKost(null);
                        if (checkVerification()) {
                            setEditingKost(k);
                            setShowKostForm(true);
                        }
                    }}
                />
            )}
            {showKostForm && (
                <KostFormMitra
                    user={user}
                    editingKost={editingKost}
                    freshStart={isStartingFresh}
                    onClose={() => { setShowKostForm(false); setEditingKost(null); setIsStartingFresh(false); checkDraft(); }}
                    onSuccess={() => { setShowKostForm(false); setEditingKost(null); setIsStartingFresh(false); checkDraft(); loadData(); }}
                />
            )}

            {/* Bank Edit Modal */}
            {isEditingBank && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsEditingBank(false)} />
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                        <div className="bg-orange-500 p-8 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md">
                                    <Landmark size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Rekening Penarikan</h3>
                                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Atur kemana dana Anda akan ditarik</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Nama Bank / Dompet (BCA, Mandiri, OVO, dll)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Landmark size={18} /></div>
                                        <select
                                            value={editForm.bank_name}
                                            onChange={e => setEditForm({ ...editForm, bank_name: e.target.value })}
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Pilih Bank / Dompet</option>
                                            {INDONESIAN_BANKS.map(bank => (
                                                <option key={bank} value={bank}>{bank}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><ChevronRight size={16} className="rotate-90" /></div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Nomor Rekening / Virtual Account</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><CreditCard size={18} /></div>
                                        <input
                                            type="text"
                                            value={editForm.bank_account}
                                            onChange={e => setEditForm({ ...editForm, bank_account: e.target.value })}
                                            placeholder="Contoh: 1234567890"
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Atas Nama (Sesuai Rekening)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><User size={18} /></div>
                                        <input
                                            type="text"
                                            value={editForm.bank_account_name}
                                            onChange={e => setEditForm({ ...editForm, bank_account_name: e.target.value.toUpperCase() })}
                                            placeholder="Contoh: AHMAD SUBARI"
                                            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-900 uppercase focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsEditingBank(false)}
                                    className="flex-1 h-12 rounded-2xl border border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={saveWithdrawalAccount}
                                    disabled={isSavingBank || !editForm.bank_name || !editForm.bank_account || !editForm.bank_account_name}
                                    className="flex-[2] h-12 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-gray-200 hover:bg-orange-500 hover:shadow-orange-100 transition-all active:scale-95 disabled:bg-gray-200 disabled:shadow-none"
                                >
                                    {isSavingBank ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Simpan Rekening
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showWithdrawConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowWithdrawConfirm(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 text-center border border-gray-100">
                        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl shadow-inner animate-bounce">💰</div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Konfirmasi Penarikan</h3>
                        <p className="text-sm text-gray-500 mb-6">Pastikan detail rekening dan nominal di bawah sudah benar.</p>

                        <div className="space-y-4 mb-6">
                            <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5 text-center">
                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Jumlah Tarik</p>
                                <p className="text-3xl font-black text-orange-600">{FORMAT_CURRENCY(stats.availableBalance)}</p>
                            </div>

                            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 text-left">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tujuan Rekening</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl border border-gray-200/80 flex items-center justify-center text-lg shadow-sm">🏦</div>
                                    <div>
                                        <p className="font-extrabold text-gray-900 text-sm">{withdrawalAccount.bank_name}</p>
                                        <p className="text-xs text-gray-500 font-bold mt-0.5">{withdrawalAccount.bank_account}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">a.n. {withdrawalAccount.bank_account_name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowWithdrawConfirm(false)}
                                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleWithdraw}
                                disabled={isWithdrawing}
                                className="flex-1 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-600/10 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isWithdrawing ? 'Memproses...' : 'Tarik Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* APPLICANT PROFILE MODAL - COMPREHENSIVE & SECURE */}
            {(selectedBookingForProfile || selectedUserForProfile) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => { setSelectedBookingForProfile(null); setSelectedUserForProfile(null); }}
                    />
                    <div className="relative bg-white w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                        {/* Modal Header */}
                        <div className="h-40 bg-gray-900 relative">
                            {/* Decorative background pattern */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] -mr-32 -mt-32" />

                            <button
                                onClick={() => { setSelectedBookingForProfile(null); setSelectedUserForProfile(null); }}
                                className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 border border-white/20 active:scale-90"
                            >
                                <X size={24} />
                            </button>

                            <div className="absolute -bottom-14 left-10">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-orange-500 border-8 border-white shadow-2xl flex items-center justify-center text-white font-black text-4xl overflow-hidden relative group">
                                    {/* Layer 1: Initials (Always present in background) */}
                                    <span className="absolute inset-0 flex items-center justify-center drop-shadow-sm pointer-events-none">
                                        {(selectedUserForProfile?.name || selectedBookingForProfile?.user?.name || 'U').charAt(0)}
                                    </span>

                                    {/* Layer 2: Image (On top) */}
                                    {(selectedUserForProfile?.photo_url || selectedBookingForProfile?.user?.photo_url) && (
                                        <img
                                            src={selectedUserForProfile?.photo_url || selectedBookingForProfile?.user?.photo_url}
                                            className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300"
                                            alt=""
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-20 pb-10 px-10">
                            <div className="mb-10">
                                <h3 className="text-3xl font-black text-gray-900 leading-none mb-3 tracking-tight">{selectedUserForProfile?.name || selectedBookingForProfile?.user?.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Profil {selectedBookingForProfile ? 'Calon Penghuni' : 'Penghuni'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Professional Info Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50/80 p-5 rounded-3xl border border-gray-100/50">
                                        <div className="flex items-center gap-3 text-orange-500 mb-3">
                                            <Briefcase size={16} />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Pekerjaan</span>
                                        </div>
                                        <p className="text-xs font-black text-gray-900">{selectedUserForProfile?.occupation || selectedBookingForProfile?.user?.occupation || 'Tidak dicantumkan'}</p>
                                    </div>
                                    <div className="bg-gray-50/80 p-5 rounded-3xl border border-gray-100/50">
                                        <div className="flex items-center gap-3 text-blue-500 mb-3">
                                            <GraduationCap size={16} />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Instansi / Kampus</span>
                                        </div>
                                        <p className="text-xs font-black text-gray-900">{selectedUserForProfile?.institution || selectedBookingForProfile?.user?.institution || 'Tidak dicantumkan'}</p>
                                    </div>
                                </div>

                                {/* Identity Info Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50/80 p-5 rounded-3xl border border-gray-100/50">
                                        <div className="flex items-center gap-3 text-purple-500 mb-3">
                                            <User size={16} />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Jenis Kelamin</span>
                                        </div>
                                        <p className="text-xs font-black text-gray-900">{selectedUserForProfile?.gender || selectedBookingForProfile?.user?.gender || '-'}</p>
                                    </div>
                                    <div className="bg-gray-50/80 p-5 rounded-3xl border border-gray-100/50">
                                        <div className="flex items-center gap-3 text-red-500 mb-3">
                                            <Heart size={16} />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Status</span>
                                        </div>
                                        <p className="text-xs font-black text-gray-900">{selectedUserForProfile?.relationship_status || selectedBookingForProfile?.user?.relationship_status || '-'}</p>
                                    </div>
                                </div>

                                {/* Origin Address */}
                                <div className="bg-gray-50/80 p-5 rounded-3xl border border-gray-100/50">
                                    <div className="flex items-center gap-3 text-green-500 mb-3">
                                        <MapPin size={16} />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Alamat Asal</span>
                                    </div>
                                    <p className="text-xs font-black text-gray-900 leading-relaxed">{selectedUserForProfile?.address || selectedBookingForProfile?.user?.address || 'Tidak dicantumkan'}</p>
                                </div>

                                <div className="pt-10">
                                    <button
                                        onClick={() => { setSelectedBookingForProfile(null); setSelectedUserForProfile(null); }}
                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-95"
                                    >
                                        Tutup Detail Profil
                                    </button>
                                    <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-6 opacity-60">
                                        Data privasi dilindungi oleh RuangSinggah.id
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ── MODAL 1: KOSTMANAGER LIVE ROOM TRACKER (OKUPANSI REAL-TIME) ── */}
            {showKmRoomTracker && selectedKmForRooms && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowKmRoomTracker(false)} />
                    <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <Bed size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-tight">
                                        Live Status Okupansi Kamar
                                    </h3>
                                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mt-0.5">
                                        {selectedKmForRooms.title} • KostManager Auto-Pilot
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowKmRoomTracker(false)}
                                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Summary Stats */}
                        <div className="p-6 pb-2 grid grid-cols-3 gap-3">
                            {(() => {
                                const total = selectedKmForRooms.roomTypes?.length || 0;
                                const avail = selectedKmForRooms.roomTypes?.filter((r: any) => r.isAvailable !== false && r.status?.toLowerCase() !== 'terisi' && r.status?.toLowerCase() !== 'penuh')?.length || 0;
                                const occupied = total - avail;
                                const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

                                return (
                                    <>
                                        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Kamar Kosong</p>
                                            <p className="text-2xl font-black text-emerald-700 mt-0.5">{avail}</p>
                                            <p className="text-[9px] text-emerald-600 font-bold">Siap Dipesan</p>
                                        </div>
                                        <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                                            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Kamar Terisi</p>
                                            <p className="text-2xl font-black text-rose-700 mt-0.5">{occupied}</p>
                                            <p className="text-[9px] text-rose-600 font-bold">Aktif Dihuni</p>
                                        </div>
                                        <div className="p-3.5 bg-orange-50 rounded-2xl border border-orange-100 text-center">
                                            <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Tingkat Okupansi</p>
                                            <p className="text-2xl font-black text-orange-700 mt-0.5">{rate}%</p>
                                            <p className="text-[9px] text-orange-600 font-bold">Total {total} Unit</p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Room Grid List */}
                        <div className="p-6 overflow-y-auto space-y-3 flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daftar Seluruh Unit Kamar</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {selectedKmForRooms.roomTypes?.map((room: any, idx: number) => {
                                    const isAvail = room.isAvailable !== false && room.status?.toLowerCase() !== 'terisi' && room.status?.toLowerCase() !== 'penuh';
                                    const rName = room.name || room.roomNumber || `Kamar ${idx + 1}`;
                                    const rFloor = room.floor || 'Lantai 1';
                                    const rSize = room.size || '2x2 meter';

                                    return (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-2xl border transition-all ${isAvail
                                                ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                                                : 'bg-rose-50/40 border-rose-200 text-slate-800'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="font-black text-sm uppercase tracking-tight flex items-center gap-1.5">
                                                    <Bed size={15} className={isAvail ? 'text-emerald-600' : 'text-rose-500'} />
                                                    {rName.startsWith('Kamar') ? rName : `Kamar ${rName}`}
                                                </span>
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isAvail
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-rose-500 text-white'
                                                        }`}
                                                >
                                                    {isAvail ? '🟢 Kosong' : '🔴 Terisi'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-2">
                                                <span>{rFloor} • {rSize}</span>
                                                <span className="font-black text-gray-900">{FORMAT_CURRENCY(room.price || selectedKmForRooms.price)}</span>
                                            </div>
                                            {room.roomFacilities && room.roomFacilities.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {room.roomFacilities.slice(0, 2).map((fac: string, fIdx: number) => (
                                                        <span key={fIdx} className="text-[8px] font-bold bg-white/80 text-gray-600 px-2 py-0.5 rounded border border-gray-200 truncate max-w-[120px]">
                                                            {fac}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                                <ShieldCheck size={14} className="text-emerald-600" />
                                Data disinkronkan otomatis oleh RuangSinggah Auto-Pilot
                            </p>
                            <button
                                onClick={() => setShowKmRoomTracker(false)}
                                className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL 2: AJUKAN REQUEST / KOORDINASI KOSTMANAGER ── */}
            {showKmRequestModal && selectedKmForRequest && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowKmRequestModal(false)} />
                    <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-tight">
                                    Ajukan Permintaan / Koordinasi
                                </h3>
                                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mt-0.5">
                                    {selectedKmForRequest.title} • KostManager Portal
                                </p>
                            </div>
                            <button
                                onClick={() => setShowKmRequestModal(false)}
                                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Request Type Selector */}
                        <div className="p-6 pb-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Pilih Jenis Request</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { key: 'hold', label: 'Hold Kamar', icon: <Lock size={14} /> },
                                    { key: 'price', label: 'Ubah Harga', icon: <CreditCard size={14} /> },
                                    { key: 'maintenance', label: 'Maintenance', icon: <Zap size={14} /> },
                                    { key: 'contact', label: 'WhatsApp Tim', icon: <Phone size={14} /> },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setRequestTab(tab.key as any)}
                                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${requestTab === tab.key
                                            ? 'bg-orange-500 border-orange-600 text-white shadow-md shadow-orange-500/20'
                                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {tab.icon}
                                        <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {requestTab === 'hold' && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                                        <p className="text-xs font-bold text-orange-950 flex items-center gap-1.5 mb-1">
                                            <Lock size={14} className="text-orange-600" />
                                            Kunci Kamar untuk Tamu / Keluarga Pribadi
                                        </p>
                                        <p className="text-[11px] text-orange-800 leading-relaxed">
                                            Kamar yang di-hold akan otomatis disembunyikan dari pencarian online agar tidak disewa penyewa publik.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Pilih Nomor Kamar</label>
                                        <select
                                            value={requestRoomNumber}
                                            onChange={(e) => setRequestRoomNumber(e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-gray-200 font-bold text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        >
                                            <option value="">-- Pilih Kamar Kosong --</option>
                                            {selectedKmForRequest.roomTypes
                                                ?.filter((r: any) => r.isAvailable !== false && r.status?.toLowerCase() !== 'terisi')
                                                .map((r: any, idx: number) => (
                                                    <option key={idx} value={r.name || r.roomNumber || `Kamar ${idx + 1}`}>
                                                        {r.name || r.roomNumber || `Kamar ${idx + 1}`} ({r.floor || 'Lt. 1'})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Durasi / Catatan Hold</label>
                                        <textarea
                                            value={requestNotes}
                                            onChange={(e) => setRequestNotes(e.target.value)}
                                            placeholder="Contoh: Dipakai saudara menginap dari tanggal 1 s/d 10 September 2026..."
                                            className="w-full p-4 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none min-h-[90px]"
                                        />
                                    </div>
                                </div>
                            )}

                            {requestTab === 'price' && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                                        <p className="text-xs font-bold text-blue-950 flex items-center gap-1.5 mb-1">
                                            <CreditCard size={14} className="text-blue-600" />
                                            Pengajuan Penyesuaian Tarif Sewa
                                        </p>
                                        <p className="text-[11px] text-blue-800 leading-relaxed">
                                            Tim operasional KostManager akan meninjau dan memperbarui harga sewa di platform publik.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Usulan Harga Baru (Rp / Bulan)</label>
                                        <input
                                            type="number"
                                            value={requestTargetPrice}
                                            onChange={(e) => setRequestTargetPrice(e.target.value)}
                                            placeholder="Contoh: 450000"
                                            className="w-full h-12 px-4 rounded-xl border border-gray-200 font-bold text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Alasan / Detail Kamar</label>
                                        <textarea
                                            value={requestNotes}
                                            onChange={(e) => setRequestNotes(e.target.value)}
                                            placeholder="Contoh: Penyesuaian tarif untuk Tipe Standard karena penambahan fasilitas WiFi baru..."
                                            className="w-full p-4 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none min-h-[90px]"
                                        />
                                    </div>
                                </div>
                            )}

                            {requestTab === 'maintenance' && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                                        <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5 mb-1">
                                            <Zap size={14} className="text-amber-600" />
                                            Request Bantuan Perbaikan & Maintenance
                                        </p>
                                        <p className="text-[11px] text-amber-800 leading-relaxed">
                                            Laporkan kendala fasilitas kost atau kebutuhan teknis lapangan untuk dikoordinasikan oleh tim operasional.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Detail Kendala / Perbaikan</label>
                                        <textarea
                                            value={requestNotes}
                                            onChange={(e) => setRequestNotes(e.target.value)}
                                            placeholder="Jelaskan kendala fasilitas, misal: Keran air di kamar mandi kamar 2 bocor, tolong dijadwalkan teknisi..."
                                            className="w-full p-4 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none min-h-[110px]"
                                        />
                                    </div>
                                </div>
                            )}

                            {requestTab === 'contact' && (
                                <div className="space-y-4 text-center py-4">
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                                        <Phone size={28} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 text-base">Account Manager KostManager</h4>
                                        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                            Hubungi PIC operasional RuangSinggah secara langsung melalui WhatsApp untuk koordinasi instan.
                                        </p>
                                    </div>
                                    <a
                                        href="https://wa.me/6281527080656?text=Halo%20Tim%20KostManager%20RuangSinggah,%20saya%20pemilik%20kost%20ingin%20koordinasi%20mengenai%20properti%20saya."
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                                    >
                                        <Phone size={15} /> Hubungi via WhatsApp (+6281527080656)
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Footer CTA */}
                        {requestTab !== 'contact' && (
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setShowKmRequestModal(false)}
                                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitKmRequest}
                                    disabled={isSubmittingRequest}
                                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send size={13} /> {isSubmittingRequest ? 'Mengirim...' : 'Kirim Permintaan'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* ── POP-UP IKLAN GRAFIS PROMO MITRA (KOSTMANAGER) ── */}
            {showPromoPopup && promoPopupSetting && promoPopupSetting.is_active && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg mx-auto">
                        {/* Tombol Close Melayang di Sudut Kanan Atas */}
                        <button
                            type="button"
                            onClick={() => setShowPromoPopup(false)}
                            className="absolute -top-3 -right-3 z-30 w-9 h-9 rounded-full bg-gray-900 text-white border-2 border-white/80 shadow-xl flex items-center justify-center hover:bg-black hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Tutup Iklan (Esc)"
                        >
                            <X size={18} />
                        </button>

                        {/* Konten Iklan */}
                        {promoPopupSetting.image_url ? (
                            /* Model 1: Desain Grafis Banner Yang Diunggah Super Admin */
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gray-900 border border-white/20 group">
                                <div
                                    onClick={() => handlePromoNavigate(promoPopupSetting.link_url)}
                                    className="cursor-pointer overflow-hidden block"
                                >
                                    <img
                                        src={promoPopupSetting.image_url}
                                        alt={promoPopupSetting.alt_text || promoPopupSetting.title || 'Promo KostManager'}
                                        className="w-full h-auto max-h-[75vh] object-contain group-hover:scale-[1.02] transition-transform duration-300"
                                    />
                                </div>
                                <div className="bg-gray-950/90 backdrop-blur-sm p-3.5 flex items-center justify-between border-t border-gray-800">
                                    <p className="text-xs font-bold text-gray-300 truncate pr-2">
                                        {promoPopupSetting.title || 'Program Unggulan KostManager'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => handlePromoNavigate(promoPopupSetting.link_url)}
                                        className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shrink-0 shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                                    >
                                        Pelajari <ArrowUpRight size={13} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Model 2: Fallback Desain Default Visual KostManager */
                            <div className="bg-gradient-to-br from-orange-600 via-amber-500 to-orange-600 rounded-3xl p-6 lg:p-8 text-white shadow-2xl border border-orange-400/30 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                                <div className="relative z-10 space-y-4">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full shadow-sm backdrop-blur-sm">
                                        <Zap size={12} className="text-white animate-pulse" fill="currentColor" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Program Eksklusif Mitra</span>
                                    </div>

                                    <h3 className="text-xl lg:text-2xl font-black text-white tracking-tight leading-snug">
                                        {promoPopupSetting.title || 'Gak Punya Waktu Kelola Kost? Upgrade ke KostManager!'}
                                    </h3>

                                    <p className="text-xs text-orange-50 leading-relaxed font-medium">
                                        Duduk manis, biarkan tim kami mengurus foto/video profesional 360°, penagihan sewa otomatis, dan promosi penuh untuk mendatangkan penyewa baru.
                                    </p>

                                    <div className="space-y-2 py-1 text-xs text-white font-semibold">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={15} className="text-white shrink-0" />
                                            <span>Foto & Video 360° Profesional RuangSinggah</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={15} className="text-white shrink-0" />
                                            <span>Penagihan otomatis & rekonsiliasi keuangan</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={15} className="text-white shrink-0" />
                                            <span>Prioritas tampil di pencarian pencari kost</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handlePromoNavigate(promoPopupSetting.link_url)}
                                            className="flex-1 py-3 bg-white hover:bg-orange-50 text-orange-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            Pelajari Sekarang <ArrowUpRight size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowPromoPopup(false)}
                                            className="px-4 py-3 bg-black/20 hover:bg-black/30 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                                        >
                                            Nanti Saja
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── MODAL CEPAT ATUR KAMAR PER TIPE ── */}
            {quickRoomModalKost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50/60 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                                    <Bed size={18} />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 text-sm leading-tight uppercase tracking-tight truncate max-w-[240px]">
                                        {quickRoomModalKost.title}
                                    </h4>
                                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-0.5">
                                        Kendali Cepat Kamar per Tipe
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setQuickRoomModalKost(null)}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content: List Room Types */}
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <p className="text-xs text-gray-500 font-medium">
                                Atur jumlah kamar kosong untuk masing-masing tipe kamar. Perubahan langsung tersimpan ke database.
                            </p>

                            <div className="space-y-3">
                                {(quickRoomModalKost.roomTypes || []).map((rt: any, idx: number) => {
                                    const count = Number(rt.availableRoomCount ?? (rt.isAvailable !== false ? 1 : 0));
                                    const isAvail = count > 0 && rt.isAvailable !== false;

                                    return (
                                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <h5 className="font-black text-gray-900 text-xs uppercase tracking-tight truncate">
                                                    {rt.name || `Tipe Kamar ${idx + 1}`}
                                                </h5>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[11px] font-black text-emerald-600">
                                                        {FORMAT_CURRENCY(rt.price || quickRoomModalKost.price || 0)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isAvail ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {isAvail ? `${count} Tersedia` : 'Penuh'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Stepper */}
                                            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200/60 shadow-2xs">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickUpdateRooms(quickRoomModalKost.id, count - 1, idx)}
                                                    disabled={count <= 0 || updatingRoomKostId === quickRoomModalKost.id}
                                                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-orange-100 text-gray-700 hover:text-orange-600 disabled:opacity-30 disabled:hover:bg-slate-100 font-black text-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed select-none"
                                                >
                                                    -
                                                </button>

                                                <span className="w-8 text-center text-sm font-black text-gray-900">
                                                    {count}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickUpdateRooms(quickRoomModalKost.id, count + 1, idx)}
                                                    disabled={updatingRoomKostId === quickRoomModalKost.id}
                                                    className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-black text-sm flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 select-none"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setQuickRoomModalKost(null)}
                                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Time Travel Controller */}
            <TimeSimulator />
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
    <div className={`bg-white rounded-3xl p-4 lg:p-6 border shadow-[0_8px_30px_rgba(0,0,0,0.01)] relative overflow-hidden hover:shadow-md transition-all duration-300 ${alert ? 'border-orange-200 ring-2 ring-orange-100' : 'border-gray-100'}`}>
        {alert && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500 animate-ping" />}
        <div className={`w-10 h-10 rounded-2xl ${COLORS[color]} flex items-center justify-center mb-3 shadow-sm`}>{icon}</div>
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight mt-0.5 truncate">{value}</p>
        <p className="text-[9px] font-medium text-gray-400 mt-1 uppercase tracking-wide truncate">{sub}</p>
    </div>
);

export default MitraDashboard;

