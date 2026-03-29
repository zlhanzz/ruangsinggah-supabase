import React, { useState, useEffect } from 'react';
import { SurveyRequest } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { 
    updateSurveyRequest, 
    uploadSurveyPhoto, 
    deleteSurveyPhoto 
} from '../adminService';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { Zap, Home, ClipboardList, Wallet, User, ShieldCheck } from 'lucide-react';
import AgentProfile from './AgentProfile';

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
    loadSurveyRequests: () => Promise<void>;
    onPageChange?: (page: any) => void;
    verificationStatus?: string;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ 
    uid, 
    surveyRequests, 
    loadSurveyRequests,
    onPageChange,
    verificationStatus
}) => {
    const [activeMenu, setActiveMenu] = useState<'overview' | 'tasks' | 'wallet' | 'profile'>('overview');
    const [isProfileEditing, setIsProfileEditing] = useState(false);
    const [agentTab, setAgentTab] = useState<'pending' | 'active' | 'history'>('pending');
    
    // Wallet State
    const [walletView, setWalletView] = useState<'balance' | 'history' | 'bank'>('balance');
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
    const [agentBankName, setAgentBankName] = useState('BCA');
    const [agentBankAccount, setAgentBankAccount] = useState('1234567890');
    const [agentAccountName, setAgentAccountName] = useState('Arif (Surveyor)');
    
    // Modal State
    const [isEditingSurvey, setIsEditingSurvey] = useState<SurveyRequest | null>(null);
    const [surveyForm, setSurveyForm] = useState<any>({});
    const [isUploadingSurveyPhoto, setIsUploadingSurveyPhoto] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReschedulingSurvey, setIsReschedulingSurvey] = useState<SurveyRequest | null>(null);
    const [newSurveyDate, setNewSurveyDate] = useState('');
    const [newSurveyTime, setNewSurveyTime] = useState('');

    const stats = {
        total: surveyRequests.length,
        completed: surveyRequests.filter(r => r.status === 'COMPLETED').length,
        rating: 4.8,
        earnings: surveyRequests.filter(r => r.status === 'COMPLETED').length * 70000,
        availableBalance: 420000 // Dummy available
    };

    const weeklyData = [
        { day: 'Sen', tasks: 2 },
        { day: 'Sel', tasks: 5 },
        { day: 'Rab', tasks: 3 },
        { day: 'Kam', tasks: 8 },
        { day: 'Jum', tasks: 4 },
        { day: 'Sab', tasks: 1 },
        { day: 'Min', tasks: 0 },
    ];

    const handleUpdateSurvey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditingSurvey) return;
        setIsSubmitting(true);
        try {
            await updateSurveyRequest(isEditingSurvey.id, surveyForm);
            setIsEditingSurvey(null);
            await loadSurveyRequests();
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
                const url = await uploadSurveyPhoto(isEditingSurvey.id, sectionId, files[i]);
                uploadedUrls.push(url);
            }
            const currentPhotos = (surveyForm.evaluation_summary as any)?.[`${sectionId}_photos`] || [];
            setSurveyForm({
                ...surveyForm,
                evaluation_summary: {
                    ...(surveyForm.evaluation_summary || {}),
                    [`${sectionId}_photos`]: [...currentPhotos, ...uploadedUrls]
                }
            });
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
            await updateSurveyRequest(isReschedulingSurvey.id, {
                status: 'RESCHEDULED',
                survey_date: newSurveyDate,
                survey_time: newSurveyTime
            });
            setIsReschedulingSurvey(null);
            await loadSurveyRequests();
        } catch (error) {
            console.error('Error rescheduling:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWithdraw = () => {
        setIsWithdrawing(true);
        setTimeout(() => {
            setIsWithdrawing(false);
            setShowWithdrawConfirm(false);
            alert('Permintaan penarikan saldo berhasil dikirim. Estimasi 1-2 hari kerja.');
        }, 2000);
    };

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
                        onClick={() => setActiveMenu('profile')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-200"
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
                    <div className="flex text-yellow-400 text-[10px] mt-1 tracking-tighter">★★★★★</div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="text-sm">💰</span> Total Pendapatan</p>
                    <p className="text-2xl font-black text-orange-500 leading-tight">{FORMAT_CURRENCY(stats.earnings)}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Per 30 hari terakhir</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Aktivitas Survey Minggu Ini</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total {weeklyData.reduce((a, b) => a + b.tasks, 0)} Tugas Berhasil</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#9CA3AF' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#9CA3AF' }} dx={-10} />
                                <RechartsTooltip 
                                    cursor={{fill: '#F9FAFB'}}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800, fontSize: '12px' }}
                                />
                                <Bar dataKey="tasks" fill="#F97316" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-100 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10 flex-grow">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Status Performa</p>
                        <h4 className="text-xl font-black leading-tight mb-4">Luar Biasa, Arif! 🚀</h4>
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
                                    <div className="flex text-yellow-400 text-[8px]">★★★★★</div>
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
            if (agentTab === 'active') return ['AGENT_ASSIGNED', 'SURVEYING', 'RESCHEDULED'].includes(req.status);
            if (agentTab === 'history') return ['COMPLETED', 'CANCELLED'].includes(req.status);
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
                                if (t.id === 'active') return ['AGENT_ASSIGNED', 'SURVEYING', 'RESCHEDULED'].includes(r.status);
                                if (t.id === 'history') return ['COMPLETED', 'CANCELLED'].includes(r.status);
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
                            {(req.status === 'AGENT_ASSIGNED' || req.status === 'SURVEYING') && <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full"></div>}
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
                                              req.status === 'SURVEYING' ? 'bg-blue-600 text-white border-blue-600 animate-pulse' : 
                                              req.status === 'COMPLETED' ? 'bg-green-600 text-white border-green-600' : 
                                              req.status === 'RESCHEDULED' ? 'bg-amber-500 text-white border-amber-600 shadow-amber-100' : 
                                              'bg-red-50 text-red-700 border-red-200'}`}>
                                            {req.status === 'AWAITING_PAYMENT' ? 'Menunggu Bayar' : 
                                             req.status === 'PENDING_ASSIGNMENT' ? 'Menunggu Agen' : 
                                             req.status === 'AGENT_ASSIGNED' ? 'Tugas Baru' : 
                                             req.status === 'SURVEYING' ? 'Sedang Survey' : 
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
                                        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Lokasi Kost</p><p className="font-bold text-gray-900 text-xs sm:text-sm leading-relaxed">{req.kost_address}</p></div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 mt-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Jadwal Survey</p><p className="font-bold text-orange-700 text-xs sm:text-sm">{req.survey_date} · {req.survey_time}</p></div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 mt-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        </div>
                                        <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Kontak Pemilik</p><p className="font-bold text-gray-900 text-xs sm:text-sm">{req.owner_phone}</p></div>
                                    </div>
                                </div>
                                {req.status === 'RESCHEDULED' && (
                                    <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0 mt-0.5">🗓️</div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Informasi Jadwal Ulang</p>
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
                                            onClick={() => {
                                                if (verificationStatus !== 'verified') {
                                                    alert('Akun Anda belum terverifikasi. Silahkan lengkapi identitas di menu Profil.');
                                                    setActiveMenu('profile');
                                                    return;
                                                }
                                                alert('Pesanan Diterima!');
                                            }} 
                                            className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all ${
                                                verificationStatus === 'verified' 
                                                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            Terima Tugas
                                        </button>
                                        <button onClick={() => alert('Pesanan Ditolak')} className="w-full bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                                            Tolak
                                        </button>
                                    </div>
                                )}
                                
                                {agentTab === 'active' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => alert('Status: Menuju Lokasi')} className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm transition-all border-b-4 border-orange-700 active:border-b-0 active:translate-y-1">
                                                🚗 Menuju Lokasi
                                            </button>
                                            <button onClick={() => alert('Status: Sedang Survey')} className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm transition-all border-b-4 border-blue-700 active:border-b-0 active:translate-y-1">
                                                📷 Sedang Survey
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <button onClick={() => window.open(`https://wa.me/${req.user?.phone}?text=${encodeURIComponent(`Halo ${req.user?.name}, saya Arif agen survey RuangSinggah.`)}`, '_blank')} className="bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 py-2.5 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1">
                                                💬 Chat User
                                            </button>
                                            <button onClick={() => window.open(`https://wa.me/${req.owner_phone}?text=${encodeURIComponent(`Halo Pemilik Kost, saya Arif agen survey RuangSinggah.`)}`, '_blank')} className="bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white border border-blue-200 py-2.5 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1">
                                                🏢 Chat Pemilik
                                            </button>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                setIsReschedulingSurvey(req);
                                                setNewSurveyDate(req.survey_date || '');
                                                setNewSurveyTime(req.survey_time || '');
                                            }} 
                                            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                        >
                                            📅 Jadwal Ulang
                                        </button>

                                        <button 
                                            onClick={() => {
                                                setIsEditingSurvey(req);
                                                setSurveyForm({
                                                    status: 'COMPLETED',
                                                    assigned_agent_id: req.assigned_agent_id,
                                                    agent_name: req.agent_name,
                                                    agent_phone: req.agent_phone,
                                                    result_drive_link: req.result_drive_link,
                                                    evaluation_summary: req.evaluation_summary || {}
                                                });
                                            }} 
                                            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md animate-pulse active:scale-95 transition-all flex justify-center items-center gap-2"
                                        >
                                            📝 Buat Laporan
                                        </button>
                                    </>
                                )}

                                {agentTab === 'history' && (
                                    <>
                                        <button 
                                            onClick={() => {
                                                setIsEditingSurvey(req);
                                                setSurveyForm({
                                                    status: req.status,
                                                    assigned_agent_id: req.assigned_agent_id,
                                                    agent_name: req.agent_name,
                                                    agent_phone: req.agent_phone,
                                                    result_drive_link: req.result_drive_link,
                                                    evaluation_summary: req.evaluation_summary || {}
                                                });
                                            }} 
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
                            className="w-full sm:w-auto px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                        >
                            Tarik Saldo
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="flex p-2 gap-1 border-b border-gray-50 bg-gray-50/50">
                    <button onClick={() => setWalletView('balance')} className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${walletView === 'balance' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Dompet</button>
                    <button onClick={() => setWalletView('history')} className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${walletView === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Riwayat WD</button>
                    <button onClick={() => setWalletView('bank')} className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${walletView === 'bank' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Rekening</button>
                </div>

                <div className="p-6">
                    {walletView === 'balance' && (
                        <div className="space-y-6">
                             <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex gap-4 items-center">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">💡</div>
                                <p className="text-xs font-bold text-orange-900 leading-relaxed">Pencairan dana diproses setiap hari kerja. Pastikan nomor rekening sudah benar sebelum melakukan penarikan.</p>
                            </div>
                            
                            <div>
                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Transaksi Terakhir</h5>
                                <div className="space-y-3">
                                    {surveyRequests.filter(r => r.status === 'COMPLETED').slice(0, 3).map((r, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-50 hover:bg-white hover:border-orange-100 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center font-bold">IN</div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-900">{r.kost_name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-green-600">+Rp 70.000</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {walletView === 'history' && (
                        <div className="space-y-4">
                            {DUMMY_WITHDRAWAL_DATA.map((wd) => (
                                <div key={wd.id} className="flex justify-between items-center p-5 rounded-3xl bg-gray-50 border border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">🏧</div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900">{FORMAT_CURRENCY(wd.amount)}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{new Date(wd.date).toLocaleDateString()} · {wd.bank_name}</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest">{wd.status}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {walletView === 'bank' && (
                        <div className="space-y-6 max-w-md mx-auto">
                            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                <div className="space-y-4">
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank</label><input className="w-full mt-1.5 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all" value={agentBankName} onChange={e => setAgentBankName(e.target.value)} /></div>
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. Rekening</label><input className="w-full mt-1.5 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all" value={agentBankAccount} onChange={e => setAgentBankAccount(e.target.value)} /></div>
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Atas Nama</label><input className="w-full mt-1.5 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all" value={agentAccountName} onChange={e => setAgentAccountName(e.target.value)} /></div>
                                </div>
                            </div>
                            <button onClick={() => alert('Data rekening berhasil disimpan!')} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Simpan Rekening Default</button>
                        </div>
                    )}
                </div>
            </div>

            {showWithdrawConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowWithdrawConfirm(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 text-center">
                        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">💰</div>
                        <h3 className="text-xl font-black uppercase text-gray-900 mb-2">Konfirmasi Penarikan</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Dana akan dikirim ke rekening default Anda.</p>
                        
                        <div className="bg-gray-50 rounded-3xl p-6 text-left mb-8 border border-gray-100">
                             <div className="mb-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Jumlah Tarik</p>
                                <p className="text-xl font-black text-orange-600">{FORMAT_CURRENCY(stats.availableBalance)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tujuan Rekening</p>
                                <p className="text-sm font-black text-gray-800">{agentBankName} — {agentBankAccount}</p>
                                <p className="text-xs font-bold text-gray-500 mt-0.5">{agentAccountName}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleWithdraw}
                                disabled={isWithdrawing}
                                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isWithdrawing ? 'Memproses...' : 'Tarik Sekarang'}
                            </button>
                            <button 
                                onClick={() => setShowWithdrawConfirm(false)}
                                className="w-full py-3 text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Batalkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderProfile = () => (
        <AgentProfile 
            uid={uid} 
            onEditModeChange={setIsProfileEditing} 
        />
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-32">
             <div className="max-w-6xl mx-auto px-4 pt-8">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Agent Dashboard</h1>
                        <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-widest">Selamat bekerja, Arif! • {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long'})}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="text-right">
                             <p className="text-sm font-black text-gray-900 uppercase">Arif Surveyor</p>
                             <p className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest inline-block ${
                                 verificationStatus === 'verified' 
                                 ? 'text-orange-600 bg-orange-50' 
                                 : 'text-orange-600 bg-orange-50'
                             }`}>
                                 {verificationStatus === 'verified' ? 'Verified Agent' : 'Unverified'}
                             </p>
                        </div>
                        <button 
                            onClick={() => setActiveMenu('profile')}
                            className={`w-12 h-12 rounded-2xl border-4 border-white shadow-sm flex items-center justify-center text-xl hover:bg-gray-200 transition-all active:scale-95 ${activeMenu === 'profile' ? 'bg-orange-100 ring-2 ring-orange-500' : 'bg-gray-100'}`}
                        >
                            👤
                        </button>
                    </div>
                </div>

                {/* TOP TABS - Hidden on Mobile, Visible on Desktop */}
                <div className="hidden sm:flex gap-2 mb-8 bg-gray-100/50 p-1.5 rounded-[2rem] w-fit mx-auto sm:mx-0">
                    <button onClick={() => setActiveMenu('overview')} className={`px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeMenu === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Beranda</button>
                    <button onClick={() => setActiveMenu('tasks')} className={`px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeMenu === 'tasks' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Tugas</button>
                    <button onClick={() => setActiveMenu('wallet')} className={`px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeMenu === 'wallet' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Wallet</button>
                    <button onClick={() => setActiveMenu('profile')} className={`px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeMenu === 'profile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Profil</button>
                </div>

                {activeMenu === 'overview' && renderOverview()}
                {activeMenu === 'tasks' && renderTasks()}
                {activeMenu === 'wallet' && renderWallet()}
                {activeMenu === 'profile' && renderProfile()}
            </div>

            {/* SHARED MODALS FROM DASHBOARD (EXTRACTED) */}
            {isEditingSurvey && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsEditingSurvey(null)}></div>
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
                            <div>
                                <h2 className="text-xl font-black uppercase text-orange-900">Kelola Survey</h2>
                                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">Input Hasil & Laporan Lapangan</p>
                            </div>
                            <button onClick={() => setIsEditingSurvey(null)} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-orange-500 hover:text-white transition-all">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateSurvey} className="flex-grow overflow-y-auto p-8 space-y-8">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Link Hasil Survey (Google Drive)</label>
                                <input 
                                    className="w-full mt-2 bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-gray-300"
                                    value={surveyForm.result_drive_link || ''}
                                    onChange={e => setSurveyForm({ ...surveyForm, result_drive_link: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                />
                                <p className="text-[10px] text-gray-400 mt-2 font-medium italic ml-1">* Link ini akan tampil di dashboard pengguna.</p>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-orange-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                                     Summary Penilaian Surveyor
                                </h3>
                                
                                {[
                                    { id: 'room_facilities', label: 'Fasilitas Kamar', icon: '🛏️' },
                                    { id: 'bathroom_facilities', label: 'Fasilitas WC', icon: '🚿' },
                                    { id: 'water_check', label: 'Pengecekan Air', icon: '💧' },
                                    { id: 'wifi_check', label: 'Pengecekan WiFi', icon: '📶' },
                                    { id: 'security_check', label: 'Pengecekan Keamanan', icon: '🛡️' },
                                    { id: 'access_check', label: 'Akses Umum/Toko/Kampus', icon: '📍' },
                                    { id: 'resident_testimonial', label: 'Testimoni Penghuni', icon: '💬' },
                                ].map((field) => (
                                    <div key={field.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:border-orange-200">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                            <span>{field.icon}</span> {field.label}
                                        </label>
                                        <textarea 
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-orange-500/10 transition-all outline-none mb-4"
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
                                            placeholder={`Tulis hasil pengecekan ${field.label.toLowerCase()}...`}
                                        />
                                        
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bukti Foto {field.label}</span>
                                                <label className={`text-[9px] font-black uppercase px-3 py-2 rounded-xl bg-orange-50 text-orange-600 transition-all flex items-center gap-2 cursor-pointer hover:bg-orange-600 hover:text-white ${isUploadingSurveyPhoto === field.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                    {isUploadingSurveyPhoto === field.id ? 'Uploading...' : '+ Tambah'}
                                                    <input 
                                                        type="file" 
                                                        multiple 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        disabled={isUploadingSurveyPhoto === field.id}
                                                        onChange={(e) => handleSurveyPhotoUpload(field.id, e.target.files)} 
                                                    />
                                                </label>
                                            </div>
                                            
                                            <div className="grid grid-cols-5 gap-2">
                                                {((surveyForm.evaluation_summary as any)?.[`${field.id}_photos`] || []).map((url: string, idx: number) => (
                                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                                                        <img src={url} alt="Proof" className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleRemoveSurveyPhoto(field.id, url)}
                                                            className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]"
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </form>
                        <div className="p-8 border-t bg-gray-50 flex gap-4">
                            <button 
                                type="button"
                                onClick={() => setIsEditingSurvey(null)}
                                className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                            >
                                Batal
                            </button>
                            <button 
                                type="button"
                                onClick={handleUpdateSurvey}
                                disabled={isSubmitting}
                                className="flex-[2] py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Laporan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isReschedulingSurvey && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsReschedulingSurvey(null)}></div>
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-10 animate-in zoom-in-95 text-center">
                        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl rotate-12 flex items-center justify-center mx-auto mb-8 shadow-inner shadow-orange-500/10">
                            <svg className="w-10 h-10 -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-2xl font-black uppercase text-gray-900 mb-2">Jadwal Ulang</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">Ajukan Waktu Baru ke User</p>

                        <div className="space-y-5 text-left mb-10">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Tanggal Baru</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                                    value={newSurveyDate}
                                    onChange={e => setNewSurveyDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Jam Baru (WIB)</label>
                                <input 
                                    type="time" 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                                    value={newSurveyTime}
                                    onChange={e => setNewSurveyTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleRequestReschedule}
                                disabled={isSubmitting}
                                className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan'}
                            </button>
                            <button 
                                onClick={() => setIsReschedulingSurvey(null)}
                                className="w-full py-3 text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Batalkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
             {!isProfileEditing && (
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-gray-100 pb-safe shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.08)]">
                    <div className="flex justify-around items-center px-4 py-3">
                        <button 
                            onClick={() => setActiveMenu('overview')}
                            className={`flex flex-col items-center gap-1.5 py-1 px-4 rounded-2xl transition-all duration-300 ${activeMenu === 'overview' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Home className={`w-6 h-6 transition-transform duration-300 ${activeMenu === 'overview' ? 'scale-110' : 'scale-100'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-wider transition-all ${activeMenu === 'overview' ? 'opacity-100 translate-y-0' : 'opacity-80'}`}>Beranda</span>
                            {activeMenu === 'overview' && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-orange-600 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveMenu('tasks')}
                            className={`flex flex-col items-center gap-1.5 py-1 px-4 rounded-2xl transition-all duration-300 relative ${activeMenu === 'tasks' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <ClipboardList className={`w-6 h-6 transition-transform duration-300 ${activeMenu === 'tasks' ? 'scale-110' : 'scale-100'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-wider transition-all ${activeMenu === 'tasks' ? 'opacity-100 translate-y-0' : 'opacity-80'}`}>Tugas</span>
                            {activeMenu === 'tasks' && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-orange-600 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>}
                            {surveyRequests.filter(r => r.status === 'PENDING_ASSIGNMENT' || r.status === 'AGENT_ASSIGNED').length > 0 && (
                                <div className="absolute top-0.5 right-4 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveMenu('wallet')}
                            className={`flex flex-col items-center gap-1.5 py-1 px-4 rounded-2xl transition-all duration-300 relative ${activeMenu === 'wallet' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Wallet className={`w-6 h-6 transition-transform duration-300 ${activeMenu === 'wallet' ? 'scale-110' : 'scale-100'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-wider transition-all ${activeMenu === 'wallet' ? 'opacity-100 translate-y-0' : 'opacity-80'}`}>Dompet</span>
                            {activeMenu === 'wallet' && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-orange-600 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveMenu('profile')}
                            className={`flex flex-col items-center gap-1.5 py-1 px-4 rounded-2xl transition-all duration-300 relative ${activeMenu === 'profile' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <User className={`w-6 h-6 transition-transform duration-300 ${activeMenu === 'profile' ? 'scale-110' : 'scale-100'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-wider transition-all ${activeMenu === 'profile' ? 'opacity-100 translate-y-0' : 'opacity-80'}`}>Profil</span>
                            {activeMenu === 'profile' && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-orange-600 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentDashboard;
