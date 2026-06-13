import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { SurveyRequest } from '../types';
import { FORMAT_CURRENCY, INDONESIAN_BANKS } from '../constants';
import { 
    updateSurveyRequest, 
    uploadSurveyPhoto, 
    deleteSurveyPhoto 
} from '../adminService';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { 
    Zap, Home, ClipboardList, Wallet, User, ShieldCheck, 
    Menu, X, LogOut, Bell, MessageSquare, Search
} from 'lucide-react';
import { notifySurveyStatusUpdate } from '../notificationService';
import { notifyAdminWithdrawalRequest } from '../emailService';
import AgentProfile from './AgentProfile';
import { Page } from '../types';

const DUMMY_WITHDRAWAL_DATA = [
    {
        id: 'WD-DUMMY-101',
        amount: 210000,
        date: new Date(Date.now() - 432000000).toISOString(),
        status: 'Selesai',
        bank_name: 'BCA',
        bank_account: '1234567890',
        bank_account_name: 'Agen Survey Dummy'
    },
    {
        id: 'WD-DUMMY-102',
        amount: 140000,
        date: new Date(Date.now() - 864000000).toISOString(),
        status: 'Selesai',
        bank_name: 'BCA',
        bank_account: '1234567890',
        bank_account_name: 'Agen Survey Dummy'
    }
];

interface AgentDashboardProps {
    uid: string;
    surveyRequests: SurveyRequest[];
    loadSurveyRequests: (silent?: boolean) => Promise<void>;
    activeMenu: 'overview' | 'tasks' | 'wallet' | 'profile';
    onMenuChange: (menu: 'overview' | 'tasks' | 'wallet' | 'profile') => void;
    verificationStatus?: string;
    user?: any;
    onLogout?: () => void;
    onPageChange?: (p: Page) => void;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ 
    uid, 
    user,
    surveyRequests, 
    loadSurveyRequests,
    activeMenu,
    onMenuChange,
    verificationStatus,
    onLogout,
    onPageChange
}) => {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [uploadSourceFieldId, setUploadSourceFieldId] = useState<string | null>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const agentTab = (searchParams.get('status') as 'pending' | 'active' | 'history') || 'pending';
    const setAgentTab = (newTab: 'pending' | 'active' | 'history') => {
        setSearchParams({ status: newTab });
    };
    const [profileImgError, setProfileImgError] = useState(false);
    const [agentReferralCode, setAgentReferralCode] = useState('');

    const generateReferralCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'AG';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    useEffect(() => {
        const checkAndFetchReferral = async () => {
            if (user && user.role === 'survey_agent' && uid) {
                try {
                    const { data, error } = await supabase
                        .from('agents')
                        .select('referral_code')
                        .eq('user_id', uid)
                        .maybeSingle();
                    
                    if (data?.referral_code) {
                        setAgentReferralCode(data.referral_code);
                    } else {
                        const code = generateReferralCode();
                        console.log("Generating referral code for agent:", code);
                        const { error: upsertError } = await supabase
                            .from('agents')
                            .upsert({ user_id: uid, referral_code: code }, { onConflict: 'user_id' });
                        if (upsertError) {
                            console.warn("Failed to save generated referral code:", upsertError.message);
                        } else {
                            setAgentReferralCode(code);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching/generating referral code:", err);
                }
            }
        };
        checkAndFetchReferral();
    }, [user, uid]);

    // Wallet State
    const [walletView, setWalletView] = useState<'balance' | 'history' | 'bank'>('balance');
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
    const [agentBankName, setAgentBankName] = useState('BCA');
    const [agentBankAccount, setAgentBankAccount] = useState('');
    const [agentAccountName, setAgentAccountName] = useState('');
    const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
    const [isLoadingWallet, setIsLoadingWallet] = useState(false);
    
    // Modal State
    const [isEditingSurvey, setIsEditingSurvey] = useState<SurveyRequest | null>(null);
    const [surveyForm, setSurveyForm] = useState<any>({});
    const [isUploadingSurveyPhoto, setIsUploadingSurveyPhoto] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReschedulingSurvey, setIsReschedulingSurvey] = useState<SurveyRequest | null>(null);
    const [newSurveyDate, setNewSurveyDate] = useState('');
    const [newSurveyTime, setNewSurveyTime] = useState('');
    const [rescheduleReason, setRescheduleReason] = useState('');

    // Load bank settings from user database profile
    useEffect(() => {
        if (user) {
            if (user.bank_name) setAgentBankName(user.bank_name);
            if (user.bank_account) setAgentBankAccount(user.bank_account);
            if (user.bank_account_name) setAgentAccountName(user.bank_account_name);
            else if (user.displayName || user.name) setAgentAccountName(user.displayName || user.name);
        }
    }, [user]);

    // Load withdrawal history from database
    const loadWalletData = async () => {
        if (!uid) return;
        setIsLoadingWallet(true);
        try {
            const { data, error } = await supabase
                .from('withdrawal_requests')
                .select('*')
                .eq('agent_id', uid)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setWithdrawalHistory(data || []);
        } catch (error) {
            console.error('Error loading withdrawal history:', error);
        } finally {
            setIsLoadingWallet(false);
        }
    };

    useEffect(() => {
        if (activeMenu === 'wallet') {
            loadWalletData();
        }
    }, [activeMenu, uid]);

    const saveBankSettings = async () => {
        if (!agentBankName || !agentBankAccount || !agentAccountName) {
            alert('Mohon lengkapi data rekening.');
            return;
        }
        setIsSubmitting(true);
        try {
            // Update public.user_bank_accounts table in Supabase
            const { error: dbError } = await supabase
                .from('user_bank_accounts')
                .upsert({
                    user_id: uid,
                    bank_name: agentBankName,
                    bank_account: agentBankAccount,
                    bank_account_name: agentAccountName,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            
            if (dbError) throw dbError;

            // Also update Auth metadata to trigger USER_UPDATED event in App.tsx
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    bank_name: agentBankName,
                    bank_account: agentBankAccount,
                    bank_account_name: agentAccountName
                }
            });
            if (authError) throw authError;

            alert('Data rekening berhasil disimpan!');
        } catch (error: any) {
            console.error(error);
            alert('Gagal menyimpan data rekening: ' + (error.message || error));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Auto-save draft effect
    useEffect(() => {
        if (isEditingSurvey && surveyForm && Object.keys(surveyForm).length > 0) {
            const draftKey = `survey_draft_${isEditingSurvey.id}`;
            localStorage.setItem(draftKey, JSON.stringify(surveyForm));
        }
    }, [surveyForm, isEditingSurvey]);

    const openSurveyEditor = (req: SurveyRequest, defaultStatus: string) => {
        setIsEditingSurvey(req);
        const defaultForm = {
            status: defaultStatus,
            assigned_agent_id: req.assigned_agent_id,
            agent_name: req.agent_name,
            agent_phone: req.agent_phone,
            result_drive_link: req.result_drive_link,
            evaluation_summary: req.evaluation_summary || {}
        };
        const draftKey = `survey_draft_${req.id}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setSurveyForm(parsed);
            } catch (e) {
                setSurveyForm(defaultForm);
            }
        } else {
            setSurveyForm(defaultForm);
        }
    };

    // Dynamic earnings and balance calculations based on 70% share from real transactions
    const completedSurveys = surveyRequests.filter(r => r.status === 'COMPLETED');
    const ratings = completedSurveys.map(r => r.user_rating || 0).filter(r => r > 0);
    const avgRating = ratings.length > 0 
        ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) 
        : 5.0;

    const totalEarnings = completedSurveys.reduce((sum, r) => {
        // Find how many requests share this transaction ID
        const siblingRequests = surveyRequests.filter(sr => sr.transaction_id === r.transaction_id);
        const count = siblingRequests.length > 0 ? siblingRequests.length : 1;
        const trxAmount = r.transaction?.amount || 100000;
        const unitPrice = trxAmount / count;
        return sum + (unitPrice * 0.7);
    }, 0);

    const totalWithdrawn = withdrawalHistory
        .filter(w => w.status !== 'rejected')
        .reduce((sum, w) => sum + Number(w.amount), 0);

    const availableBalance = Math.max(0, totalEarnings - totalWithdrawn);

    const stats = {
        total: surveyRequests.length,
        completed: completedSurveys.length,
        rating: avgRating,
        earnings: totalEarnings,
        availableBalance: availableBalance
    };

    const inTx = completedSurveys.map(r => {
        const siblingRequests = surveyRequests.filter(sr => sr.transaction_id === r.transaction_id);
        const count = siblingRequests.length > 0 ? siblingRequests.length : 1;
        const trxAmount = r.transaction?.amount || 100000;
        const unitPrice = trxAmount / count;
        const earned = unitPrice * 0.7;
        return {
            id: `in-${r.id}`,
            date: new Date(r.created_at),
            type: 'IN',
            title: r.kost_name,
            amount: earned,
            status: 'approved'
        };
    });

    const outTx = withdrawalHistory.filter(w => w.status !== 'rejected').map(w => ({
        id: `out-${w.id}`,
        date: new Date(w.created_at),
        type: 'OUT',
        title: `Penarikan Dana (${w.bank_name})`,
        amount: Number(w.amount),
        status: w.status
    }));

    const allTransactions = [...inTx, ...outTx]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);

    const handleWithdraw = async () => {
        if (availableBalance < 10000) {
            alert('Saldo minimal untuk penarikan adalah Rp 10.000');
            return;
        }
        if (!agentBankName || !agentBankAccount || !agentAccountName) {
            alert('Silakan lengkapi dan simpan data rekening Anda terlebih dahulu.');
            return;
        }
        setIsWithdrawing(true);
        try {
            const { error } = await supabase
                .from('withdrawal_requests')
                .insert([{
                    agent_id: uid,
                    amount: availableBalance,
                    bank_name: agentBankName,
                    bank_account: agentBankAccount,
                    bank_account_name: agentAccountName,
                    status: 'pending'
                }]);
            if (error) throw error;

            alert('Pengajuan penarikan berhasil dikirim!');
            setShowWithdrawConfirm(false);
            await loadWalletData();

            // Kirim notifikasi email ke Admin via FormSubmit
            notifyAdminWithdrawalRequest({
                agent_id: uid,
                agent_name: user?.displayName || user?.name || 'Surveyor',
                amount: availableBalance,
                bank_name: agentBankName,
                bank_account: agentBankAccount,
                bank_account_name: agentAccountName
            });
        } catch (error) {
            console.error('Error submitting withdrawal:', error);
            alert('Gagal mengirim pengajuan penarikan.');
        } finally {
            setIsWithdrawing(false);
        }
    };
    const getSurveyWorkDate = (r: any): Date => {
        if (r.evaluation_summary?.submitted_at) {
            return new Date(r.evaluation_summary.submitted_at);
        }
        const summary = r.evaluation_summary || {};
        for (const key in summary) {
            if (key.endsWith('_photos') && Array.isArray(summary[key])) {
                for (const url of summary[key]) {
                    if (typeof url === 'string') {
                        const match = url.match(/\/(\d+)_[a-zA-Z0-9]+\.webp/);
                        if (match && match[1]) {
                            const epoch = parseInt(match[1]);
                            if (epoch > 1700000000000 && epoch < 2000000000000) {
                                return new Date(epoch);
                            }
                        }
                    }
                }
            }
        }
        return new Date(r.created_at);
    };

    const getWeeklyData = () => {
        const daysMap = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const result = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const dayLabel = daysMap[date.getDay()];
            
            const tasksCount = completedSurveys.filter(r => {
                const workDate = getSurveyWorkDate(r);
                return workDate >= startOfDay && workDate <= endOfDay;
            }).length;

            result.push({
                day: dayLabel,
                tasks: tasksCount
            });
        }

        return result;
    };

    const weeklyData = getWeeklyData();

    const handleUpdateSurvey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditingSurvey) return;

        // Validation: Ensure all 7 points are filled and have photos
        const requiredSections = [
            { id: 'room_facilities', label: 'Fasilitas Kamar' },
            { id: 'bathroom_facilities', label: 'Fasilitas WC' },
            { id: 'water_check', label: 'Pengecekan Air' },
            { id: 'wifi_check', label: 'Pengecekan WiFi' },
            { id: 'security_check', label: 'Pengecekan Keamanan' },
            { id: 'access_check', label: 'Akses Umum/Toko/Kampus' },
            { id: 'environmental_conditions', label: 'Kondisi Lingkungan Sekitar Kost' }
        ];

        const missing = [];
        for (const section of requiredSections) {
            const text = (surveyForm.evaluation_summary as any)?.[section.id];
            const photos = (surveyForm.evaluation_summary as any)?.[`${section.id}_photos`];
            const rating = (surveyForm.evaluation_summary as any)?.[`${section.id}_rating`];
            
            if (!text || text.trim().length < 1) {
                missing.push(`${section.label} (Keterangan belum diisi)`);
            }
            if (!photos || photos.length === 0) {
                missing.push(`${section.label} (Foto bukti belum diupload)`);
            }
            if (!rating || rating === 0) {
                missing.push(`${section.label} (Rating bintang belum dipilih)`);
            }
        }

        if (missing.length > 0) {
            alert(`Laporan belum lengkap! Mohon lengkapi bagian berikut:\n\n- ${missing.join('\n- ')}`);
            return;
        }

        setIsSubmitting(true);
        try {
            // Change status to SUBMITTED for user confirmation
            const finalForm = {
                ...surveyForm,
                status: 'SUBMITTED',
                evaluation_summary: {
                    ...(surveyForm.evaluation_summary || {}),
                    submitted_at: new Date().toISOString()
                }
            };
            await updateSurveyRequest(isEditingSurvey.id, finalForm);
            await notifySurveyStatusUpdate(isEditingSurvey.id, 'SUBMITTED');
            localStorage.removeItem(`survey_draft_${isEditingSurvey.id}`);
            setIsEditingSurvey(null);
            alert('Laporan berhasil dikirim! Menunggu konfirmasi dari User.');
            await loadSurveyRequests();
            setAgentTab('history');
        } catch (error) {
            console.error('Error updating survey:', error);
            alert('Gagal update survey');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSurveyPhotoUpload = async (sectionId: string, files: FileList | null) => {
        if (!files || !isEditingSurvey) return;
        setIsUploadingSurveyPhoto(sectionId);
        try {
            const uploadedUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const url = await uploadSurveyPhoto(files[i], isEditingSurvey.id);
                uploadedUrls.push(url);
            }
            
            if (sectionId === 'whatsapp_evidence_url') {
                setSurveyForm({
                    ...surveyForm,
                    evaluation_summary: {
                        ...(surveyForm.evaluation_summary || {}),
                        whatsapp_evidence_url: uploadedUrls[0]
                    }
                });
            } else {
                const currentPhotos = (surveyForm.evaluation_summary as any)?.[`${sectionId}_photos`] || [];
                setSurveyForm({
                    ...surveyForm,
                    evaluation_summary: {
                        ...(surveyForm.evaluation_summary || {}),
                        [`${sectionId}_photos`]: [...currentPhotos, ...uploadedUrls]
                    }
                });
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Gagal upload foto');
        } finally {
            setIsUploadingSurveyPhoto(null);
        }
    };

    const handleRemoveSurveyPhoto = async (sectionId: string, url: string) => {
        if (!isEditingSurvey) return;
        if (!window.confirm('Hapus foto ini?')) return;
        try {
            await deleteSurveyPhoto(url);
            const currentPhotos = (surveyForm.evaluation_summary as any)?.[`${sectionId}_photos`] || [];
            setSurveyForm({
                ...surveyForm,
                evaluation_summary: {
                    ...(surveyForm.evaluation_summary || {}),
                    [`${sectionId}_photos`]: currentPhotos.filter((p: string) => p !== url)
                }
            });
        } catch (error) {
            console.error('Error deleting photo:', error);
        }
    };

    const handleRequestReschedule = async () => {
        if (!isReschedulingSurvey) return;
        setIsSubmitting(true);
        try {
            // Build reschedule history
            const currentSummary = isReschedulingSurvey.evaluation_summary || {};
            const newHistoryItem = {
                date: newSurveyDate,
                time: newSurveyTime,
                reason: rescheduleReason,
                updatedAt: new Date().toISOString()
            };
            const rescheduleHistory = Array.isArray((currentSummary as any).reschedule_history)
                ? [...(currentSummary as any).reschedule_history, newHistoryItem]
                : [newHistoryItem];
            
            const updatedSummary = {
                ...currentSummary,
                reschedule_history: rescheduleHistory
            };

            await updateSurveyRequest(isReschedulingSurvey.id, {
                status: 'RESCHEDULED',
                survey_date: newSurveyDate,
                survey_time: newSurveyTime,
                notes: rescheduleReason,
                evaluation_summary: updatedSummary
            });
            await notifySurveyStatusUpdate(isReschedulingSurvey.id, 'RESCHEDULED');
            setIsReschedulingSurvey(null);
            await loadSurveyRequests();
        } catch (error) {
            console.error('Error rescheduling:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── UI HELPERS ─────────────────────────────────────────────────────────────
    const NAV_ITEMS = [
        { key: 'overview', icon: <Zap size={20} />, label: 'Beranda' },
        { key: 'tasks', icon: <ClipboardList size={20} />, label: 'Tugas', badge: surveyRequests.filter(r => r.status === 'PENDING_ASSIGNMENT').length },
        { key: 'wallet', icon: <Wallet size={20} />, label: 'Dompet' },
        { key: 'profile', icon: <User size={20} />, label: 'Profil' },
    ];

    const SideNavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void; badge?: number }> = ({ active, icon, label, onClick, badge }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 translate-x-1' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
        >
            <div className="flex items-center gap-3">
                <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
                <span className={`text-sm ${active ? 'font-black' : 'font-bold'}`}>{label}</span>
            </div>
            {badge !== undefined && badge > 0 && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? 'bg-white text-orange-600' : 'bg-rose-500 text-white'}`}>
                    {badge}
                </span>
            )}
        </button>
    );

    const BottomNavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void; badge?: number }> = ({ active, icon, label, onClick, badge }) => (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-2xl transition-all relative ${active ? 'text-orange-500' : 'text-gray-400'}`}
        >
            <div className={`transition-transform duration-300 ${active ? 'scale-110 -translate-y-1' : ''}`}>
                {icon}
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce-short">
                        {badge}
                    </span>
                )}
            </div>
            <span className={`text-[9px] uppercase tracking-tighter transition-all ${active ? 'font-black opacity-100' : 'font-bold opacity-60'}`}>{label}</span>
            {active && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]" />}
        </button>
    );

    const categoryChecklists: Record<string, string[]> = {
        kost_type: ['Putra', 'Putri', 'Campur', 'Pasutri'],
        room_facilities: ['Tanpa Fasilitas', 'Tempat Tidur', 'Bantal', 'Sprei', 'Lemari Pakaian', 'Meja Belajar/Kerja', 'Kursi', 'Cermin', 'Rak Sepatu', 'AC', 'Kipas Angin', 'TV', 'Kulkas', 'Stop Kontak', 'Listrik/Kamar'],
        bathroom_facilities: ['WC Dalam', 'WC Umum', 'Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Bak Mandi', 'Gayung', 'Ember', 'Wastafel', 'Cermin WC', 'Gantungan Baju', 'Exhaust Fan', 'Water Heater'],
        kitchen_facilities: ['Dapur Umum', 'Dapur Dalam', 'Kompor', 'Gas', 'Kulkas', 'Wastafel Dapur', 'Rak Piring', 'Meja Dapur', 'Alat Masak', 'Alat Makan', 'Tempat Sampah'],
        public_facilities: ['Ruang Tamu', 'Dapur Bersama', 'WiFi', 'Listrik Umum', 'Jemuran', 'Mesin Cuci', 'Ruang Santai', 'Parkir Motor', 'Parkir Mobil'],
        water_check: ['Air Bersih/Jernih', 'Air Tidak Berbau', 'Aliran Air Deras', 'Keran Berfungsi Baik'],
        wifi_check: ['Tidak Ada WiFi'],
        security_check: ['CCTV Aktif', 'Gembok/Pagar', 'Akses 24 Jam', 'Batas Jam Malam', 'Penjaga Kos/Satpam', 'Lingkungan Aman'],
        access_check: ['Akses Mobil Mudah', 'Akses Motor Mudah', 'Dalam Gang', 'Dekat Jalan Utama', 'Dekat Masjid', 'Dekat Gereja', 'Dekat Warung Makan', 'Dekat Minimarket', 'Dekat Toko Grosir', 'Dekat Kampus/Kantor', 'Jalanan Beraspal', 'Bebas Banjir'],
        environmental_conditions: ['Area Kostan', 'Area Perumahan', 'Padat Penduduk', 'Lingkungan Tenang', 'Bebas Bau/Polusi', 'Pencahayaan Baik', 'Bebas Hewan/Serangga'],
        building_conditions: ['Bangunan Baru', 'Bangunan Terawat', 'Cat Masih Bagus', 'Tidak Ada Retak', 'Atap Tidak Bocor', 'Tidak Ada Rembes', 'Tidak Ada Jamur Dinding', 'Sirkulasi Udara Lancar']
    };

    const StarRatingInput: React.FC<{ value: number; onChange: (rating: number) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => (
        <div className="flex gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-gray-50/80 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(star)}
                    className={`text-xl sm:text-2xl transition-all duration-200 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                        star <= value 
                        ? 'text-yellow-400 bg-yellow-50 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)] scale-110 border border-yellow-200' 
                        : 'text-gray-300 bg-white hover:bg-gray-100 hover:text-gray-400 border border-gray-200 shadow-sm'
                    } ${!disabled && 'active:scale-95 cursor-pointer'} ${disabled && 'cursor-not-allowed opacity-70'}`}
                >
                    {star <= value ? '★' : '☆'}
                </button>
            ))}
        </div>
    );

    const renderOverview = () => (
        <div className="space-y-6">
            {verificationStatus !== 'verified' && (
                <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl">⚠️</div>
                        <div>
                            <h4 className="text-orange-900 font-black uppercase text-sm">Akun Belum Terverifikasi</h4>
                            <p className="text-orange-700 text-xs font-medium">Lengkapi identitas Anda di menu Profil untuk mulai menerima tugas survey.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onMenuChange('profile')}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-200"
                    >
                        Verifikasi Sekarang
                    </button>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="text-sm">🎯</span> Total Tugas</p>
                    <p className="text-2xl font-black text-gray-900 leading-tight">{stats.total}</p>
                    <p className="text-[10px] text-green-500 font-bold mt-1 uppercase tracking-tight">+12% vs bulan lalu</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="text-sm">✅</span> Survey Selesai</p>
                    <p className="text-2xl font-black text-gray-900 leading-tight">{stats.completed}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Tingkat sukses 100%</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="text-sm">⭐</span> Rating Rata-rata</p>
                    <p className="text-2xl font-black text-orange-600 leading-tight">{stats.rating}</p>
                    <div className="flex text-yellow-400 text-[10px] mt-1 tracking-tighter">
                        {[...Array(5)].map((_, idx) => (
                            <span key={idx}>{idx < Math.round(stats.rating) ? '★' : '☆'}</span>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="text-sm">💰</span> Total Pendapatan</p>
                    <p className="text-2xl font-black text-orange-600 leading-tight">{FORMAT_CURRENCY(stats.earnings)}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Per 30 hari terakhir</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Aktivitas Survey 7 Hari Terakhir</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total {weeklyData.reduce((a, b) => a + b.tasks, 0)} Tugas Berhasil</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#9CA3AF' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#9CA3AF' }} dx={-10} allowDecimals={false} />
                                <RechartsTooltip 
                                    cursor={{fill: '#F9FAFB'}}
                                    wrapperStyle={{ outline: 'none' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800, fontSize: '12px', outline: 'none' }}
                                />
                                <Bar dataKey="tasks" fill="#f97316" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-100 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10 flex-grow">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Status Performa</p>
                        <h4 className="text-xl font-black leading-tight mb-4">Luar Biasa, {user?.displayName?.split(' ')[0] || 'Agen'}! 🚀</h4>
                        <p className="text-xs leading-relaxed opacity-90 mb-6 font-medium">Bulan ini kamu sudah menyelesaikan <strong>{stats.completed} survey</strong> dengan tingkat kepuasan pelanggan yang sangat tinggi. Pertahankan respon cepatmu!</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Tanggapan Pengguna</h4>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-lg">New Feedback</span>
                </div>
                <div className="space-y-4">
                    {surveyRequests.filter(r => r.status === 'COMPLETED' && r.user_comment).slice(0, 2).map((r, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg shrink-0">👤</div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-black text-gray-900">{r.user?.name || 'User'}</p>
                                    <div className="flex text-yellow-400 text-[8px]">
                                        {[...Array(5)].map((_, idx) => (
                                            <span key={idx}>{idx < (r.user_rating || 0) ? '★' : '☆'}</span>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 italic leading-relaxed">"{r.user_comment}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderTasks = () => {
        const filteredRequests = surveyRequests.filter(req => {
            if (agentTab === 'pending') return req.status === 'PENDING_ASSIGNMENT';
            if (agentTab === 'active') return ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING', 'RESCHEDULED'].includes(req.status);
            if (agentTab === 'history') return ['SUBMITTED', 'COMPLETED', 'CANCELLED'].includes(req.status);
            return false;
        });

        return (
            <div className="space-y-6 pb-32">
                <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 flex gap-1 shadow-sm sticky top-0 z-10 transition-all">
                    {[
                        { id: 'pending', label: 'Permintaan', icon: '📥' },
                        { id: 'active', label: 'Aktif', icon: '⚡' },
                        { id: 'history', label: 'Riwayat', icon: '📜' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setAgentTab(t.id as any)}
                            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                                agentTab === t.id 
                                ? 'bg-orange-600 text-white shadow-md scale-[1.02]' 
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <span>{t.icon}</span>
                            {t.label}
                            {surveyRequests.filter(r => {
                                if (t.id === 'pending') return r.status === 'PENDING_ASSIGNMENT';
                                if (t.id === 'active') return ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING', 'RESCHEDULED'].includes(r.status);
                                if (t.id === 'history') return ['SUBMITTED', 'COMPLETED', 'CANCELLED'].includes(r.status);
                                return false;
                            }).length > 0 && (
                                <span className={`w-2 h-2 rounded-full ${agentTab === t.id ? 'bg-white' : 'bg-red-500'}`} />
                            )}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {filteredRequests.map((req: SurveyRequest) => (
                        <div key={req.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
                            {(req.status === 'AGENT_ASSIGNED' || req.status === 'SURVEYING') && <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-bl-full"></div>}
                            <div className="flex-1 space-y-4 relative z-10">
                                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-50 pb-4 gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider">#{req.id.slice(0,8)}</span>
                                            <span className="text-xs text-gray-400 font-medium">{new Date(req.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                            <div className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100 italic">Survey Live</div>
                                        </div>
                                        <p className="font-bold text-gray-900 text-lg leading-tight mb-1">{req.kost_name}</p>
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            {req.user?.name || 'User'}
                                        </p>
                                    </div>
                                    <div className="w-full sm:w-auto">
                                        <span className={`inline-flex w-full sm:w-auto justify-center px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border shadow-sm
                                            ${req.status === 'AWAITING_PAYMENT' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                              req.status === 'PENDING_ASSIGNMENT' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                              req.status === 'HEADING_TO_LOCATION' ? 'bg-indigo-600 text-white border-indigo-600' :
                                              req.status === 'SURVEYING' ? 'bg-orange-600 text-white border-orange-600 animate-pulse' : 
                                              req.status === 'SUBMITTED' ? 'bg-blue-600 text-white border-blue-600' :
                                              req.status === 'COMPLETED' ? 'bg-green-600 text-white border-green-600' : 
                                              req.status === 'RESCHEDULED' ? 'bg-amber-500 text-white border-amber-600 shadow-amber-100' : 
                                              'bg-red-50 text-red-700 border-red-200'}`}>
                                            {req.status === 'AWAITING_PAYMENT' ? 'Menunggu Bayar' : 
                                             req.status === 'PENDING_ASSIGNMENT' ? 'Menunggu Agen' : 
                                             req.status === 'AGENT_ASSIGNED' ? 'Tugas Baru' : 
                                             req.status === 'HEADING_TO_LOCATION' ? 'Menuju Lokasi' :
                                             req.status === 'SURVEYING' ? 'Sedang Survey' : 
                                             req.status === 'SUBMITTED' ? 'Menunggu Konfirmasi' :
                                             req.status === 'COMPLETED' ? 'Selesai' : 
                                             req.status === 'RESCHEDULED' ? 'Jadwal Ulang' : 
                                             req.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 mt-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lokasi Kost</p><p className="font-bold text-gray-900 text-xs sm:text-sm leading-relaxed">{req.kost_address}</p></div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 mt-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Jadwal Survey</p><p className="font-bold text-orange-700 text-xs sm:text-sm">{req.survey_date} · {req.survey_time}</p></div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 mt-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        </div>
                                        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kontak Pemilik</p><p className="font-bold text-gray-900 text-xs sm:text-sm">{req.owner_phone}</p></div>
                                    </div>
                                </div>
                                {req.status === 'RESCHEDULED' && (
                                    <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0 mt-0.5">🗓️</div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Informasi Jadwal Ulang</p>
                                            <p className="text-xs text-amber-800 font-medium leading-relaxed italic">"{req.notes || 'User/Admin meminta perubahan jadwal survey sesuai kesepakatan baru.'}"</p>
                                        </div>
                                    </div>
                                )}
                                {req.notes && req.status !== 'RESCHEDULED' && (
                                    <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Catatan Pemesan</p>
                                        <p className="text-sm text-gray-700 italic">"{req.notes}"</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2.5 md:w-52 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 relative z-10">
                                {agentTab === 'pending' && (
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={async () => {
                                                if (verificationStatus !== 'verified') {
                                                    alert('Akun Anda belum terverifikasi. Silahkan lengkapi identitas di menu Profil.');
                                                    onMenuChange('profile');
                                                    return;
                                                }
                                                if (window.confirm('Terima tugas survey ini?')) {
                                                    try {
                                                        setIsSubmitting(true);
                                                        await updateSurveyRequest(req.id, { 
                                                            status: 'AGENT_ASSIGNED',
                                                            agent_name: user?.name || user?.displayName || 'Surveyor RuangSinggah',
                                                            agent_phone: user?.phone || user?.phoneNumber || '',
                                                            agent_photo_url: user?.photo_url || user?.photoURL || ''
                                                        });
                                                        await notifySurveyStatusUpdate(req.id, 'AGENT_ASSIGNED');
                                                        alert('Pesanan Diterima! Tugas kini ada di tab Aktif.');
                                                        await loadSurveyRequests(true);
                                                        setAgentTab('active');
                                                    } catch (error) {
                                                        alert('Gagal menerima tugas.');
                                                    } finally {
                                                        setIsSubmitting(false);
                                                    }
                                                }
                                            }} 
                                            disabled={isSubmitting}
                                            className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all ${
                                                verificationStatus === 'verified' && !isSubmitting
                                                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {isSubmitting ? 'Memproses...' : 'Terima Tugas'}
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                if (window.confirm('Yakin ingin menolak tugas ini? Tugas akan dikembalikan ke Admin untuk ditugaskan ulang.')) {
                                                    try {
                                                        setIsSubmitting(true);
                                                        await updateSurveyRequest(req.id, { 
                                                            assigned_agent_id: null,
                                                            agent_name: '',
                                                            agent_phone: ''
                                                        } as any);
                                                        alert('Tugas Ditolak.');
                                                        await loadSurveyRequests(true);
                                                    } catch (error) {
                                                        alert('Gagal menolak tugas.');
                                                    } finally {
                                                        setIsSubmitting(false);
                                                    }
                                                }
                                            }} 
                                            disabled={isSubmitting}
                                            className="w-full bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                        >
                                            Tolak
                                        </button>
                                    </div>
                                )}
                                
                                {agentTab === 'active' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        setIsSubmitting(true);
                                                        await updateSurveyRequest(req.id, { status: 'HEADING_TO_LOCATION' });
                                                        await notifySurveyStatusUpdate(req.id, 'HEADING_TO_LOCATION');
                                                        await loadSurveyRequests(true);
                                                    } catch (e) {
                                                        alert('Gagal update status');
                                                    } finally {
                                                        setIsSubmitting(false);
                                                    }
                                                }}
                                                disabled={isSubmitting || req.status === 'HEADING_TO_LOCATION' || req.status === 'SURVEYING' || req.status === 'COMPLETED'}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                                                    req.status === 'HEADING_TO_LOCATION' || req.status === 'SURVEYING' || req.status === 'COMPLETED'
                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                    : 'bg-orange-600 hover:bg-orange-700 text-white border-orange-800'
                                                }`}
                                            >
                                                🚗 {req.status === 'HEADING_TO_LOCATION' || req.status === 'SURVEYING' || req.status === 'COMPLETED' ? 'Sudah OTW' : 'Menuju Lokasi'}
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        setIsSubmitting(true);
                                                        await updateSurveyRequest(req.id, { status: 'SURVEYING' });
                                                        await notifySurveyStatusUpdate(req.id, 'SURVEYING');
                                                        await loadSurveyRequests(true);
                                                    } catch (e) {
                                                        alert('Gagal update status');
                                                    } finally {
                                                        setIsSubmitting(false);
                                                    }
                                                }}
                                                disabled={isSubmitting || req.status !== 'HEADING_TO_LOCATION'}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                                                    req.status === 'HEADING_TO_LOCATION'
                                                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-700'
                                                    : req.status === 'SURVEYING' || req.status === 'COMPLETED'
                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                }`}
                                            >
                                                📷 {req.status === 'SURVEYING' || req.status === 'COMPLETED' ? 'Sedang Survey' : 'Sedang Survey'}
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <button onClick={() => window.open(`https://wa.me/${req.user?.phone}?text=${encodeURIComponent(`Halo ${req.user?.name}, saya Arif agen survey RuangSinggah.`)}`, '_blank')} className="bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 py-2.5 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1">
                                                💬 Chat User
                                            </button>
                                            <button onClick={() => window.open(`https://wa.me/${req.owner_phone}?text=${encodeURIComponent(`Halo Pemilik Kost, saya Arif agen survey RuangSinggah.`)}`, '_blank')} className="bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200 py-2.5 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1">
                                                🏢 Chat Pemilik
                                            </button>
                                        </div>

                                        {req.result_drive_link && (
                                            <button 
                                                onClick={() => window.open(req.result_drive_link, '_blank')} 
                                                className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-1"
                                            >
                                                📁 Buka Folder Drive (Upload)
                                            </button>
                                        )}

                                        <button 
                                            onClick={() => {
                                                setIsReschedulingSurvey(req);
                                                setNewSurveyDate(req.survey_date || '');
                                                setNewSurveyTime(req.survey_time || '');
                                                setRescheduleReason(req.notes && req.status === 'RESCHEDULED' ? req.notes : '');
                                            }} 
                                            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                        >
                                            📅 Jadwal Ulang
                                        </button>

                                        <button 
                                            onClick={() => openSurveyEditor(req, 'COMPLETED')} 
                                            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md animate-pulse active:scale-95 transition-all flex justify-center items-center gap-2"
                                        >
                                            📝 Buat Laporan
                                        </button>
                                    </>
                                )}

                                {agentTab === 'history' && (
                                    <>
                                        <button 
                                            onClick={() => openSurveyEditor(req, req.status)} 
                                            className="w-full bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2"
                                        >
                                            {req.evaluation_summary?.room_facilities ? '✅ Lihat Laporan' : '📝 Detail Progress'}
                                        </button>

                                        <div className="mt-3 bg-orange-50/50 rounded-2xl p-4 border border-orange-100 flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Rating & Feedback User</p>
                                                {req.user_rating ? (
                                                    <div className="flex text-yellow-500 text-[10px]">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i}>{i < (req.user_rating || 0) ? '★' : '☆'}</span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-gray-400 italic">Belum ada rating</span>
                                                )}
                                            </div>
                                            <p className={`text-xs italic font-medium leading-relaxed ${req.user_comment ? 'text-gray-700' : 'text-gray-400'}`}>
                                                {req.user_comment ? `"${req.user_comment}"` : 'User belum memberikan ulasan.'}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredRequests.length === 0 && (
                        <div className="bg-gray-50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-gray-200">
                            <p className="text-gray-500 font-bold">Belum ada tugas di tab ini.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderWallet = () => (
        <div className="space-y-6">
            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-orange-500/30"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Saldo Pendapatan Agen</p>
                            <h3 className="text-4xl font-black">{FORMAT_CURRENCY(stats.availableBalance)}</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center text-xl">💳</div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <button 
                            onClick={() => setShowWithdrawConfirm(true)}
                            className="w-full sm:w-auto px-10 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                        >
                            Tarik Saldo
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="flex p-1.5 gap-1 border-b border-gray-50 bg-gray-50/50">
                    <button onClick={() => setWalletView('balance')} className={`flex-1 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider truncate whitespace-nowrap px-1 transition-all ${walletView === 'balance' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Dompet</button>
                    <button onClick={() => setWalletView('history')} className={`flex-1 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider truncate whitespace-nowrap px-1 transition-all ${walletView === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Riwayat WD</button>
                    <button onClick={() => setWalletView('bank')} className={`flex-1 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider truncate whitespace-nowrap px-1 transition-all ${walletView === 'bank' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Rekening</button>
                </div>

                <div className="p-6">
                    {walletView === 'balance' && (
                        <div className="space-y-6">
                             <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex gap-4 items-center">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">💡</div>
                                <p className="text-xs font-bold text-orange-900 leading-relaxed flex-1 min-w-0">Pencairan dana diproses setiap hari kerja. Pastikan nomor rekening sudah benar sebelum melakukan penarikan.</p>
                            </div>
                            
                            <div>
                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Transaksi Terakhir</h5>
                                <div className="space-y-3">
                                    {allTransactions.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 font-bold text-xs">Belum ada transaksi.</div>
                                    ) : (
                                        allTransactions.map((tx) => (
                                            <div key={tx.id} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-50 hover:bg-white hover:border-orange-100 transition-all group gap-4 min-w-0">
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                                        tx.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'
                                                    }`}>
                                                        {tx.type}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-black text-gray-900 flex items-center gap-1.5 min-w-0">
                                                            <span className="block truncate flex-1">{tx.title}</span>
                                                            {tx.type === 'OUT' && tx.status === 'pending' && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 uppercase tracking-wider shrink-0">Diproses</span>
                                                            )}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{tx.date.toLocaleDateString('id-ID')}</p>
                                                    </div>
                                                </div>
                                                <p className={`text-sm font-black shrink-0 ${
                                                    tx.type === 'IN' ? 'text-green-600' : 'text-rose-600'
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

                    {walletView === 'history' && (
                        <div className="space-y-4">
                            {isLoadingWallet ? (
                                <div className="text-center py-8 text-gray-400 font-bold text-xs">Memuat riwayat...</div>
                            ) : withdrawalHistory.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 font-bold text-xs">Belum ada riwayat penarikan.</div>
                            ) : (
                                withdrawalHistory.map((wd) => (
                                    <div key={wd.id} className="flex justify-between items-center p-5 rounded-3xl bg-gray-50 border border-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">🏧</div>
                                            <div>
                                                <p className="text-xs font-black text-gray-900">{FORMAT_CURRENCY(Number(wd.amount))}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{new Date(wd.created_at).toLocaleDateString()} · {wd.bank_name}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                            wd.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            wd.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {wd.status === 'approved' ? 'Selesai' :
                                             wd.status === 'rejected' ? 'Ditolak' :
                                             'Menunggu'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {walletView === 'bank' && (
                        <div className="space-y-6 max-w-md mx-auto">
                            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank</label>
                                        <select 
                                            className="w-full mt-1.5 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-600 outline-none transition-all cursor-pointer" 
                                            value={agentBankName} 
                                            onChange={e => setAgentBankName(e.target.value)}
                                        >
                                            {INDONESIAN_BANKS.map((bank, index) => (
                                                <option key={index} value={bank}>{bank}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. Rekening</label><input className="w-full mt-1.5 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-600 outline-none transition-all" value={agentBankAccount} onChange={e => setAgentBankAccount(e.target.value)} /></div>
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Atas Nama</label><input className="w-full mt-1.5 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-600 outline-none transition-all" value={agentAccountName} onChange={e => setAgentAccountName(e.target.value)} /></div>
                                </div>
                            </div>
                            <button onClick={saveBankSettings} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Simpan Rekening Default</button>
                        </div>
                    )}
                </div>
            </div>

            {showWithdrawConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowWithdrawConfirm(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 text-center border border-gray-100">
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
                                        <p className="font-extrabold text-gray-900 text-sm">{agentBankName}</p>
                                        <p className="text-xs text-gray-500 font-bold mt-0.5">{agentBankAccount}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">a.n. {agentAccountName}</p>
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
        </div>
    );


    const render = (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden">

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
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em] mt-1 whitespace-nowrap">AGENT DASHBOARD</p>
                        </div>
                    </div>
                </div>

                {/* User Info */}
                <div className="px-4 py-5 border-b border-gray-50">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden">
                            {(user?.photoURL || user?.photo_url) && !profileImgError ? (
                                <img 
                                    src={user.photoURL || user.photo_url} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover" 
                                    onError={() => setProfileImgError(true)}
                                />
                            ) : (
                                user?.displayName?.charAt(0) || user?.name?.charAt(0) || 'A'
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-gray-900 truncate">{user?.displayName || user?.name || 'Surveyor'}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${verificationStatus === 'verified' ? 'text-green-500' : 'text-orange-500'}`}>
                                {verificationStatus === 'verified' ? 'verified agent ✓' : 'unverified'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto border-b border-gray-50">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] px-4 mb-3">Menu Utama</p>
                    {NAV_ITEMS.map(item => (
                        <SideNavItem
                            key={item.key}
                            active={activeMenu === item.key}
                            icon={item.icon}
                            label={item.label}
                            badge={item.badge}
                            onClick={() => onMenuChange(item.key as any)}
                        />
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-50">
                    <button
                        onClick={() => onLogout?.()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={18} />
                        Keluar Akun
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
                                <div className="w-10 h-10 rounded-[1.1rem] bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                   <Zap size={20} className="text-white" fill="currentColor" />
                                </div>
                                <div className="flex flex-col">
                                   <h1 className="text-[14px] font-black text-gray-900 leading-tight tracking-tight">ruangsinggah.id</h1>
                                   <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest leading-none mt-0.5">AGENT DASHBOARD</p>
                                </div>
                            </div>
                            <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-xl hover:bg-gray-50">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {NAV_ITEMS.map(item => (
                                <SideNavItem
                                    key={item.key}
                                    active={activeMenu === item.key}
                                    icon={item.icon}
                                    label={item.label}
                                    badge={item.badge}
                                    onClick={() => { onMenuChange(item.key as any); setMobileSidebarOpen(false); }}
                                />
                            ))}
                        </nav>
                        <div className="p-4 border-t border-gray-50">
                            <button
                                onClick={() => { onLogout?.(); setMobileSidebarOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <LogOut size={18} />
                                Keluar Akun
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
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest leading-none mt-0.5">AGENT DASHBOARD</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 relative">
                            <Bell size={20} className="text-gray-500" />
                            {surveyRequests.filter(r => r.status === 'PENDING_ASSIGNMENT').length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />}
                        </button>
                        <button 
                            onClick={() => onMenuChange('profile')}
                            className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-xs overflow-hidden"
                        >
                            {(user?.photoURL || user?.photo_url) && !profileImgError ? (
                                <img 
                                    src={user.photoURL || user.photo_url} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover" 
                                    onError={() => setProfileImgError(true)}
                                />
                            ) : (
                                user?.displayName?.charAt(0) || user?.name?.charAt(0) || 'A'
                            )}
                        </button>
                    </div>
                </header>

                {/* ── DESKTOP TOP BAR ─────────────────────────────────────── */}
                <header className="hidden lg:flex sticky top-0 z-20 bg-white border-b border-gray-100 px-8 py-4 items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">
                            { activeMenu === 'overview' ? 'Selamat Datang, Agen 👋' :
                              activeMenu === 'tasks' ? 'Daftar Tugas Survey' :
                              activeMenu === 'wallet' ? 'Dompet & Pendapatan' : 'Profil Surveyor' }
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                            { new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-black text-[10px] uppercase tracking-widest border border-orange-100">
                             <ShieldCheck size={14} />
                             {verificationStatus === 'verified' ? 'Verified surveyor' : 'Pending Verification'}
                        </button>
                        <div className="w-px h-6 bg-gray-100 mx-2" />
                        <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 relative group transition-all">
                            <Bell size={20} className="text-gray-400 group-hover:text-orange-500" />
                            {surveyRequests.filter(r => r.status === 'PENDING_ASSIGNMENT').length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />}
                        </button>
                        <button 
                            onClick={() => onMenuChange('profile')}
                            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-gray-50 transition-all group"
                        >
                            <div className="text-right hidden xl:block">
                                <p className="text-xs font-black text-gray-900">{user?.displayName || user?.name || 'Surveyor'}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">ID: #{uid.slice(0, 6)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-500/20 overflow-hidden">
                                {(user?.photoURL || user?.photo_url) && !profileImgError ? (
                                    <img 
                                        src={user.photoURL || user.photo_url} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                        onError={() => setProfileImgError(true)}
                                    />
                                ) : (
                                    user?.displayName?.charAt(0) || user?.name?.charAt(0) || 'A'
                                )}
                            </div>
                        </button>
                    </div>
                </header>

                {/* ── SCROLLABLE CONTENT ───────────────────────────────────── */}
                <main className="flex-1 p-4 lg:p-8 pb-32 min-w-0 overflow-x-hidden">
                    {activeMenu === 'overview' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{renderOverview()}</div>}
                    {activeMenu === 'tasks' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{renderTasks()}</div>}
                    {activeMenu === 'wallet' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{renderWallet()}</div>}
                    {activeMenu === 'profile' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><AgentProfile uid={uid} onEditModeChange={() => {}} /></div>}
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
                            onClick={() => onMenuChange(item.key as any)}
                        />
                    ))}
                </nav>

                {/* ── MODAL SURVEY REPORT (AGENT) ────────────────────────────── */}
                {isEditingSurvey && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsEditingSurvey(null)}></div>
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div><h2 className="text-xl font-black uppercase text-gray-900">Form Laporan Survey</h2><p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Lengkapi data pengecekan</p></div>
                                <button onClick={() => setIsEditingSurvey(null)} className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-white transition-colors">&times;</button>
                            </div>
                            <form onSubmit={handleUpdateSurvey} className="flex-grow overflow-y-auto p-0 m-0">
                                <div className="p-6 space-y-5">
                                    {localStorage.getItem(`survey_draft_${isEditingSurvey.id}`) && (
                                        <div className="bg-orange-50 text-orange-800 text-[11px] font-bold px-4 py-3 rounded-2xl border border-orange-100 flex items-center justify-between gap-2 mb-4 animate-in slide-in-from-top duration-200">
                                            <span>🔄 Memulihkan draf laporan otomatis.</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm("Hapus draf laporan ini dan mulai ulang dari awal?")) {
                                                        localStorage.removeItem(`survey_draft_${isEditingSurvey.id}`);
                                                        setSurveyForm({
                                                            status: isEditingSurvey.status === 'COMPLETED' ? 'COMPLETED' : isEditingSurvey.status,
                                                            assigned_agent_id: isEditingSurvey.assigned_agent_id,
                                                            agent_name: isEditingSurvey.agent_name,
                                                            agent_phone: isEditingSurvey.agent_phone,
                                                            result_drive_link: isEditingSurvey.result_drive_link,
                                                            evaluation_summary: isEditingSurvey.evaluation_summary || {}
                                                        });
                                                    }
                                                }}
                                                className="text-[9px] font-black uppercase px-2 py-1 bg-white hover:bg-orange-100 text-orange-700 rounded-lg border border-orange-200 transition-colors shadow-sm"
                                            >
                                                Mulai Ulang
                                            </button>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                            Summary Penilaian Surveyor
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            {/* WA Evidence Section */}
                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6">
                                                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Bukti Screenshot WhatsApp Video Call / Chat dengan user</label>
                                                <div className="mt-1.5 flex items-center gap-3">
                                                    {(isEditingSurvey?.status !== 'COMPLETED' && isEditingSurvey?.status !== 'SUBMITTED') && (
                                                        <label className="flex-1 bg-white border border-dashed border-gray-300 shadow-sm rounded-xl px-4 py-4 text-xs font-black text-gray-500 cursor-pointer hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 transition-all flex flex-col items-center justify-center gap-2">
                                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                            </div>
                                                            <span className="uppercase tracking-widest">{(surveyForm.evaluation_summary as any)?.whatsapp_evidence_url ? 'Ganti Bukti WA' : 'Upload Bukti WA'}</span>
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                className="hidden" 
                                                                onChange={(e) => handleSurveyPhotoUpload('whatsapp_evidence_url', e.target.files)} 
                                                            />
                                                        </label>
                                                    )}
                                                    {(surveyForm.evaluation_summary as any)?.whatsapp_evidence_url && (
                                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl overflow-hidden border border-orange-200 flex-shrink-0 cursor-zoom-in group relative" onClick={() => window.open(Array.isArray((surveyForm.evaluation_summary as any).whatsapp_evidence_url) ? (surveyForm.evaluation_summary as any).whatsapp_evidence_url[0] : (surveyForm.evaluation_summary as any).whatsapp_evidence_url, '_blank')}>
                                                            <img 
                                                                src={Array.isArray((surveyForm.evaluation_summary as any).whatsapp_evidence_url) ? (surveyForm.evaluation_summary as any).whatsapp_evidence_url[0] : (surveyForm.evaluation_summary as any).whatsapp_evidence_url} 
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                                                alt="WA Evidence" 
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {[
                                                { id: 'kost_type', label: 'Jenis Kost', icon: '👤' },
                                                { id: 'room_facilities', label: 'Fasilitas Kamar', icon: '🛏️' },
                                                { id: 'bathroom_facilities', label: 'Fasilitas WC', icon: '🚿' },
                                                { id: 'kitchen_facilities', label: 'Fasilitas Dapur', icon: '🍳' },
                                                { id: 'public_facilities', label: 'Fasilitas Umum', icon: '🛋️' },
                                                { id: 'water_check', label: 'Pengecekan Air', icon: '💧' },
                                                { id: 'wifi_check', label: 'Pengecekan WiFi', icon: '📶' },
                                                { id: 'security_check', label: 'Pengecekan Keamanan', icon: '🛡️' },
                                                { id: 'access_check', label: 'Akses Umum/Kampus/Kantor', icon: '📍' },
                                                { id: 'building_conditions', label: 'Kondisi Bangunan/Kamar', icon: '🏠' },
                                                { id: 'environmental_conditions', label: 'Lingkungan Sekitar', icon: '🌳' },
                                            ].map((field) => (
                                                <div key={field.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-orange-200">
                                                    <div className="mb-3">
                                                        <label className="text-[10px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                                                            <span>{field.icon}</span> {field.label}
                                                        </label>
                                                    </div>
                                                    
                                                    {categoryChecklists[field.id] && (
                                                        <div className="mb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                            {categoryChecklists[field.id].map(item => {
                                                                const isChecked = ((surveyForm.evaluation_summary as any)?.[`${field.id}_checklist`] || []).includes(item);
                                                                const isDekat = item.toLowerCase().startsWith('dekat');
                                                                return (
                                                                    <div key={item} className="flex flex-col gap-1.5">
                                                                       <label className={`flex items-center gap-2 p-2 rounded-lg border text-[10px] sm:text-xs transition-colors ${isChecked ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'} cursor-pointer`}>
                                                                           <input
                                                                               type="checkbox"
                                                                               className="w-3.5 h-3.5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 cursor-pointer disabled:cursor-default"
                                                                               checked={isChecked}
                                                                               onChange={(e) => {
                                                                                   const currentList = (surveyForm.evaluation_summary as any)?.[`${field.id}_checklist`] || [];
                                                                                   const newList = e.target.checked 
                                                                                       ? [...currentList, item] 
                                                                                       : currentList.filter((i: string) => i !== item);
                                                                                   
                                                                                   setSurveyForm({ 
                                                                                       ...surveyForm, 
                                                                                       evaluation_summary: { 
                                                                                           ...(surveyForm.evaluation_summary || {}), 
                                                                                           [`${field.id}_checklist`]: newList 
                                                                                       } 
                                                                                   });
                                                                               }}
                                                                               disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                                           />
                                                                           <span className="truncate" title={item}>{item}</span>
                                                                       </label>
                                                                       
                                                                       {isDekat && isChecked && (
                                                                           <div className="flex flex-col gap-1 px-1">
                                                                               <div className="flex items-center gap-1">
                                                                                   <input 
                                                                                       type="number"
                                                                                       className="w-16 bg-white border border-gray-200 rounded-md px-1.5 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-orange-500"
                                                                                       placeholder="Angka"
                                                                                       value={(surveyForm.evaluation_summary as any)?.[`${field.id}_${item}_dist`] || ''}
                                                                                       onChange={e => setSurveyForm({
                                                                                           ...surveyForm,
                                                                                           evaluation_summary: {
                                                                                               ...(surveyForm.evaluation_summary || {}),
                                                                                               [`${field.id}_${item}_dist`]: e.target.value
                                                                                           }
                                                                                       })}
                                                                                       disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                                                   />
                                                                                   <select 
                                                                                       className="bg-white border border-gray-200 rounded-md px-1 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                                                                       value={(surveyForm.evaluation_summary as any)?.[`${field.id}_${item}_unit`] || 'm'}
                                                                                       onChange={e => setSurveyForm({
                                                                                           ...surveyForm,
                                                                                           evaluation_summary: {
                                                                                               ...(surveyForm.evaluation_summary || {}),
                                                                                               [`${field.id}_${item}_unit`]: e.target.value
                                                                                           }
                                                                                       })}
                                                                                       disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                                                   >
                                                                                       <option value="m">m</option>
                                                                                       <option value="km">km</option>
                                                                                   </select>
                                                                               </div>
                                                                               
                                                                               {item === 'Dekat Kampus/Kantor' && (
                                                                                   <input 
                                                                                       type="text"
                                                                                       className="w-full bg-white border border-gray-200 rounded-md px-2 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-orange-500"
                                                                                       placeholder="Nama Kampus/Kantor..."
                                                                                       value={(surveyForm.evaluation_summary as any)?.[`${field.id}_${item}_name`] || ''}
                                                                                       onChange={e => setSurveyForm({
                                                                                           ...surveyForm,
                                                                                           evaluation_summary: {
                                                                                               ...(surveyForm.evaluation_summary || {}),
                                                                                               [`${field.id}_${item}_name`]: e.target.value
                                                                                           }
                                                                                       })}
                                                                                       disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                                                   />
                                                                               )}
                                                                           </div>
                                                                       )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {field.id === 'wifi_check' && (
                                                        <div className="mb-3">
                                                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-orange-500 transition-all">
                                                                <input 
                                                                    type="number"
                                                                    className="flex-1 bg-transparent text-sm font-bold outline-none text-gray-700"
                                                                    placeholder="Ketik kecepatan internet..."
                                                                    value={(surveyForm.evaluation_summary as any)?.wifi_speed || ''}
                                                                    onChange={e => setSurveyForm({
                                                                        ...surveyForm,
                                                                        evaluation_summary: {
                                                                            ...(surveyForm.evaluation_summary || {}),
                                                                            wifi_speed: e.target.value
                                                                        }
                                                                    })}
                                                                    disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                                />
                                                                <span className="text-xs font-black text-gray-400 tracking-widest">MBPS</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                     {field.id !== 'kost_type' && (
                                                         <>
                                                    <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-gray-100 pt-3">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Penilaian Keseluruhan</label>
                                                        <StarRatingInput 
                                                            value={(surveyForm.evaluation_summary as any)?.[`${field.id}_rating`] || 0}
                                                            onChange={(val) => {
                                                                setSurveyForm({ 
                                                                    ...surveyForm, 
                                                                    evaluation_summary: { 
                                                                        ...(surveyForm.evaluation_summary || {}), 
                                                                        [`${field.id}_rating`]: val 
                                                                    } 
                                                                });
                                                            }}
                                                            disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                        />
                                                    </div>

                                                    <textarea 
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all outline-none mb-3 disabled:bg-gray-100 disabled:opacity-80"
                                                        rows={2}
                                                        value={(surveyForm.evaluation_summary as any)?.[field.id] || ''}
                                                        onChange={e => {
                                                            setSurveyForm({ 
                                                                ...surveyForm, 
                                                                evaluation_summary: { 
                                                                    ...(surveyForm.evaluation_summary || {}), 
                                                                    [field.id]: e.target.value 
                                                                } 
                                                            });
                                                        }}
                                                        disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                        placeholder={`Tulis hasil pengecekan ${field.label.toLowerCase()}...`}
                                                    />
                                                    
                                                    {/* Photo Upload Section */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Bukti Foto</span>
                                                            {(isEditingSurvey?.status !== 'COMPLETED' && isEditingSurvey?.status !== 'SUBMITTED') && (
                                                                <button 
                                                                                type="button"
                                                                                onClick={() => setUploadSourceFieldId(field.id)}
                                                                                disabled={isUploadingSurveyPhoto === field.id}
                                                                                className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-600 transition-colors flex items-center gap-1.5 cursor-pointer hover:bg-orange-100 ${isUploadingSurveyPhoto === field.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            >
                                                                                {isUploadingSurveyPhoto === field.id ? (
                                                                                    <>
                                                                                        <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                                                                        Uploading...
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                                                        Tambah Foto
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Photo Preview Grid */}
                                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                                            {((surveyForm.evaluation_summary as any)?.[`${field.id}_photos`] || []).map((url: string, idx: number) => (
                                                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group shadow-sm bg-gray-50">
                                                                    <img src={url} alt="Proof" className="w-full h-full object-cover cursor-zoom-in" onClick={() => window.open(url, '_blank')} />
                                                                    {(isEditingSurvey?.status !== 'COMPLETED' && isEditingSurvey?.status !== 'SUBMITTED') && (
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => handleRemoveSurveyPhoto(field.id, url)}
                                                                            className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]"
                                                                        >
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                         </>
                                                     )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Link Hasil Survey (Foto & Video)</label>
                                                {surveyForm.result_drive_link && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => window.open(surveyForm.result_drive_link, '_blank')}
                                                        className="text-[10px] font-black text-gray-700 hover:text-gray-900 flex items-center gap-1 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm transition-all active:scale-95"
                                                    >
                                                        <span>📁</span> Buka Folder
                                                    </button>
                                                )}
                                            </div>
                                            <input 
                                                readOnly
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-600 cursor-not-allowed outline-none"
                                                value={surveyForm.result_drive_link || ''}
                                                placeholder="Sistem belum membuat folder drive..."
                                            />
                                            <p className="text-[9px] text-gray-500 mt-2 font-medium italic">
                                                {surveyForm.result_drive_link 
                                                    ? "✓ Folder Drive otomatis telah berhasil dibuat. Upload video pengecekan ke dalam folder tersebut." 
                                                    : "ℹ Folder akan dibuat otomatis oleh sistem saat survey berhasil."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 p-6 border-t border-gray-100 sticky bottom-0 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditingSurvey(null)}
                                        className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Batal/Tutup
                                    </button>
                                    {(isEditingSurvey?.status !== 'COMPLETED' && isEditingSurvey?.status !== 'SUBMITTED') && (
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="flex-[2] py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                        >
                                            {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden Inputs for Camera and Gallery */}
            <input 
                ref={cameraInputRef}
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={(e) => {
                    if (uploadSourceFieldId) {
                        handleSurveyPhotoUpload(uploadSourceFieldId, e.target.files);
                        setUploadSourceFieldId(null);
                    }
                }} 
            />
            <input 
                ref={galleryInputRef}
                type="file" 
                accept="image/*" 
                multiple
                className="hidden" 
                onChange={(e) => {
                    if (uploadSourceFieldId) {
                        handleSurveyPhotoUpload(uploadSourceFieldId, e.target.files);
                        setUploadSourceFieldId(null);
                    }
                }} 
            />

            {/* ── MODAL RESCHEDULE SURVEY (AGENT) ────────────────────────── */}
            {isReschedulingSurvey && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsReschedulingSurvey(null)}></div>
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-black uppercase text-gray-900">Jadwal Ulang Survey</h2>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Kost: {isReschedulingSurvey.kost_name}</p>
                            </div>
                            <button onClick={() => setIsReschedulingSurvey(null)} className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-white transition-colors">&times;</button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleRequestReschedule(); }} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block mb-2">Tanggal Baru</label>
                                <input 
                                    type="date"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                    value={newSurveyDate}
                                    onChange={e => setNewSurveyDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block mb-2">Waktu Baru</label>
                                <input 
                                    type="time"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                    value={newSurveyTime}
                                    onChange={e => setNewSurveyTime(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block mb-2">Alasan Penjadwalan Ulang</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all resize-none"
                                    placeholder="Tulis alasan reschedule agar pemesan dapat memahaminya..."
                                    value={rescheduleReason}
                                    onChange={e => setRescheduleReason(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsReschedulingSurvey(null)}
                                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="flex-1 py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                >
                                    {isSubmitting ? 'Mengirim...' : 'Simpan Jadwal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Native Source Selection Action Sheet */}
            {uploadSourceFieldId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end justify-center" onClick={() => setUploadSourceFieldId(null)}>
                    <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 space-y-5 animate-in slide-in-from-bottom duration-200 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2"></div>
                        <h3 className="text-sm font-bold text-gray-800 text-center uppercase tracking-widest">Pilih Sumber Foto</h3>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    cameraInputRef.current?.click();
                                }}
                                className="flex flex-col items-center justify-center p-5 bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-3xl transition-all active:scale-95 shadow-sm"
                            >
                                <span className="text-3xl mb-2">📸</span>
                                <span className="text-xs font-black text-orange-600 tracking-wider">KAMERA HP</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    galleryInputRef.current?.click();
                                }}
                                className="flex flex-col items-center justify-center p-5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-3xl transition-all active:scale-95 shadow-sm"
                            >
                                <span className="text-3xl mb-2">🖼️</span>
                                <span className="text-xs font-black text-gray-700 tracking-wider">GALERI / FILE</span>
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setUploadSourceFieldId(null)}
                            className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return render;
};

export default AgentDashboard;
