import React, { useState } from 'react';
import { SurveyRequest } from '../../types';
import { FORMAT_CURRENCY } from '../../constants';
import { supabase } from '../../supabaseClient';
import { 
    updateSurveyRequest, 
    deleteSurveyRequest, 
    generateManualDriveFolder, 
    uploadSurveyPhoto, 
    deleteSurveyPhoto 
} from '../../adminService';
import { notifySurveyStatusUpdate } from '../../notificationService';

interface SurveyManagementProps {
    isAdmin: boolean;
    isAgent: boolean;
    uid?: string;
    surveyRequests: SurveyRequest[];
    surveyAgents: any[];
    refreshData: () => void;
}

const SurveyManagement: React.FC<SurveyManagementProps> = ({
    isAdmin,
    isAgent,
    uid,
    surveyRequests,
    surveyAgents,
    refreshData
}) => {
    // --- HELPER COMPONENTS ---
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

    const StarRatingDisplay: React.FC<{ rating?: number }> = ({ rating }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`text-sm ${rating && star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>
                    ★
                </span>
            ))}
        </div>
    );

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

    // --- LOCAL UI STATE ---
    const [adminSurveyTab, setAdminSurveyTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
    const [agentTab, setAgentTab] = useState<'pending' | 'active' | 'history'>('pending');
    const [selectedSurveyIds, setSelectedSurveyIds] = useState<string[]>([]);
    
    const [isEditingSurvey, setIsEditingSurvey] = useState<SurveyRequest | null>(null);
    const [surveyForm, setSurveyForm] = useState<Partial<SurveyRequest>>({});
    
    // [NEW] Order-level management state
    const [isEditingOrder, setIsEditingOrder] = useState<any>(null);
    const [orderForm, setOrderForm] = useState<{ assigned_agent_id?: string; drive_links: Record<string, string> }>({ drive_links: {} });

    const [isReschedulingSurvey, setIsReschedulingSurvey] = useState<SurveyRequest | null>(null);
    const [newSurveyDate, setNewSurveyDate] = useState('');
    const [newSurveyTime, setNewSurveyTime] = useState('');
    
    const [userRating, setUserRating] = useState<number>(0);
    const [userComment, setUserComment] = useState('');
    
    const [isUploadingSurveyPhoto, setIsUploadingSurveyPhoto] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isAddingManualSurvey, setIsAddingManualSurvey] = useState(false);
    const [manualSurveyForm, setManualSurveyForm] = useState<any>({});

    const [viewingSurveyProof, setViewingSurveyProof] = useState<any>(null);
    const [viewingSurveyInvoice, setViewingSurveyInvoice] = useState<any>(null);

    // --- HANDLERS ---
    const handleDeleteSurveyLocal = async (id: string, name: string) => {
        if (!window.confirm(`Hapus survey "${name}"?`)) return;
        setIsSubmitting(true);
        try {
            await deleteSurveyRequest(id);
            alert('Survey berhasil dihapus');
            refreshData();
        } catch (error) {
            console.error(error);
            alert('Gagal menghapus survey');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditingOrder) return;
        setIsSubmitting(true);
        try {
            const agent = surveyAgents.find(a => a.id === orderForm.assigned_agent_id);
            
            // Loop all surveys in the order and update them
            for (const req of isEditingOrder.surveys) {
                const updates: any = {};
                if (agent) {
                    updates.assigned_agent_id = agent.id;
                    updates.agent_name = agent.name;
                    updates.agent_phone = agent.phone;
                    updates.agent_photo_url = agent.photo_url;
                    if (req.status === 'AWAITING_PAYMENT') {
                        updates.status = 'PENDING_ASSIGNMENT';
                    }
                } else if (orderForm.assigned_agent_id === '') {
                    // Cleared agent
                    updates.assigned_agent_id = null;
                    updates.agent_name = null;
                    updates.agent_phone = null;
                    updates.agent_photo_url = null;
                    if (req.status === 'AGENT_ASSIGNED') {
                        updates.status = 'PENDING_ASSIGNMENT';
                    }
                }

                // Update drive link if changed
                if (orderForm.drive_links[req.id] !== undefined) {
                    updates.result_drive_link = orderForm.drive_links[req.id];
                }

                if (Object.keys(updates).length > 0) {
                    await updateSurveyRequest(req.id, updates);
                    // Notify agent if assigned
                    if (updates.assigned_agent_id && !req.assigned_agent_id) {
                        await notifySurveyStatusUpdate(req.id, 'ASSIGNED_TO_AGENT');
                    }
                }
            }

            alert('Order survey berhasil diperbarui');
            setIsEditingOrder(null);
            refreshData();
        } catch (error) {
            console.error(error);
            alert('Gagal mengupdate order survey');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSurvey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditingSurvey) return;
        setIsSubmitting(true);
        try {
            const oldStatus = isEditingSurvey.status;
            const finalData = { ...surveyForm };
            
            const SURVEY_DB_COLUMNS = [
                'status', 'kost_name', 'kost_address', 'owner_phone', 
                'survey_date', 'survey_time', 'notes', 
                'agent_name', 'agent_phone', 'agent_photo_url', 'assigned_agent_id',
                'result_drive_link', 'evaluation_summary', 
                'user_rating', 'user_comment'
            ];

            const updates: any = {};
            SURVEY_DB_COLUMNS.forEach(col => {
                if (finalData.hasOwnProperty(col)) {
                    updates[col] = (finalData as any)[col];
                }
            });

            if (isAgent && updates.status === 'SURVEYING') {
                updates.status = 'COMPLETED';
            }

            await updateSurveyRequest(isEditingSurvey.id, updates);

            // [NEW] Trigger notifikasi email ke AGEN jika ini penugasan pertama
            if (!isEditingSurvey.assigned_agent_id && updates.assigned_agent_id) {
                await notifySurveyStatusUpdate(isEditingSurvey.id, 'ASSIGNED_TO_AGENT');
            }

            if (updates.status !== oldStatus) {
                await notifySurveyStatusUpdate(isEditingSurvey.id, updates.status);
            }

            alert('Data survey berhasil diperbarui');
            setIsEditingSurvey(null);
            refreshData();
        } catch (error) {
            console.error(error);
            alert('Gagal mengupdate survey');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRescheduleLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isReschedulingSurvey) return;
        setIsSubmitting(true);
        try {
            await updateSurveyRequest(isReschedulingSurvey.id, {
                survey_date: newSurveyDate,
                survey_time: newSurveyTime,
                status: 'RESCHEDULED'
            });
            await notifySurveyStatusUpdate(isReschedulingSurvey.id, 'RESCHEDULED');
            alert('Jadwal survey berhasil diubah');
            setIsReschedulingSurvey(null);
            refreshData();
        } catch (error) {
            alert('Gagal mengubah jadwal');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitFeedback = async () => {
        if (!isEditingSurvey || userRating === 0) return;
        setIsSubmitting(true);
        try {
            await updateSurveyRequest(isEditingSurvey.id, {
                user_rating: userRating,
                user_comment: userComment
            });
            alert('Terima kasih atas penilaian Anda!');
            setIsEditingSurvey(null);
            setUserRating(0);
            setUserComment('');
            refreshData();
        } catch (error) {
            alert('Gagal menyimpan feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateDriveFolderLocal = async () => {
        if (!isEditingSurvey) return;
        setIsSubmitting(true);
        try {
            const driveLink = await generateManualDriveFolder(isEditingSurvey.id);
            setSurveyForm(prev => ({ ...prev, result_drive_link: driveLink }));
            alert('Folder Drive berhasil dibuat!');
            refreshData();
        } catch (error: any) {
            alert(error.message || 'Gagal generate folder');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateDriveFolderForOrderUnit = async (surveyId: string) => {
        setIsSubmitting(true);
        try {
            const driveLink = await generateManualDriveFolder(surveyId);
            setOrderForm(prev => ({
                ...prev,
                drive_links: {
                    ...prev.drive_links,
                    [surveyId]: driveLink
                }
            }));
            alert('Folder Drive berhasil dibuat!');
            refreshData();
        } catch (error: any) {
            alert(error.message || 'Gagal generate folder');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSurveyPhotoUploadLocal = async (fieldId: string, files: FileList | null) => {
        if (!isEditingSurvey || !files || files.length === 0) return;
        setIsUploadingSurveyPhoto(fieldId);
        try {
            const uploads = Array.from(files).map(file => uploadSurveyPhoto(isEditingSurvey.id, fieldId, file));
            const urls = await Promise.all(uploads);
            
            const photoField = `${fieldId}_photos`;
            const currentSummary = (surveyForm.evaluation_summary as any) || {};
            const existingPhotos = currentSummary[photoField] || [];

            setSurveyForm({
                ...surveyForm,
                evaluation_summary: {
                    ...currentSummary,
                    [photoField]: [...existingPhotos, ...urls]
                }
            });
        } catch (error) {
            alert('Gagal mengupload foto survey');
            console.error(error);
        } finally {
            setIsUploadingSurveyPhoto(null);
        }
    };

    const handleRemoveSurveyPhotoLocal = async (fieldId: string, url: string) => {
        if (!isEditingSurvey || !window.confirm('Hapus foto ini?')) return;
        try {
            await deleteSurveyPhoto(url);
            const photoField = `${fieldId}_photos`;
            const currentSummary = (surveyForm.evaluation_summary as any) || {};
            const existingPhotos = currentSummary[photoField] || [];

            setSurveyForm({
                ...surveyForm,
                evaluation_summary: {
                    ...currentSummary,
                    [photoField]: existingPhotos.filter((p: string) => p !== url)
                }
            });
        } catch (error) {
            alert('Gagal menghapus foto');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedSurveyIds.length === 0) return;
        if (!window.confirm(`Hapus ${selectedSurveyIds.length} survey terpilih secara permanen?`)) return;
        setIsSubmitting(true);
        try {
            const deletes = selectedSurveyIds.map(id => deleteSurveyRequest(id));
            await Promise.all(deletes);
            alert('Survey terpilih berhasil dihapus');
            setSelectedSurveyIds([]);
            refreshData();
        } catch (error) {
            alert('Gagal menghapus survey massal');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleManualSurveySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            // Simulasi penambahan manual ke DB
            alert('Data survey manual disimulasikan (Sesi Browser).');
            setIsAddingManualSurvey(false);
            setManualSurveyForm({});
            refreshData();
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredRequests = surveyRequests.filter(r => {
        if (isAdmin) {
            if (adminSurveyTab === 'all') return true;
            if (adminSurveyTab === 'pending') return r.status === 'PENDING_ASSIGNMENT';
            if (adminSurveyTab === 'active') return ['AGENT_ASSIGNED', 'SURVEYING', 'RESCHEDULED'].includes(r.status);
            if (adminSurveyTab === 'completed') return r.status === 'COMPLETED';
        }
        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Layanan Jasa Survey</h2>
                    <p className="text-gray-500 text-sm mt-1">Kelola seluruh permintaan survey lapangan dari pengguna.</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setIsAddingManualSurvey(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        Tambah Manual
                    </button>
                )}
            </div>

            {isAdmin && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {[
                        { id: 'all', label: 'Semua Survey', icon: '📋' },
                        { id: 'pending', label: 'Menunggu Agen', icon: '⏳' },
                        { id: 'active', label: 'Sedang Berjalan', icon: '🚀' },
                        { id: 'completed', label: 'Selesai', icon: '✅' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setAdminSurveyTab(tab.id as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${adminSurveyTab === tab.id
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-100'
                                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 gap-8">
                {(() => {
                    // Grouping surveyRequests by transaction_id
                    const groups: Record<string, SurveyRequest[]> = {};
                    filteredRequests.forEach(req => {
                        const key = req.transaction_id || req.id;
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(req);
                    });

                    const groupedOrders = Object.entries(groups).map(([txId, list]) => {
                        const first = list[0];
                        const dateObj = new Date(first.created_at);
                        const doneCount = list.filter(r => ['SUBMITTED', 'COMPLETED'].includes(r.status)).length;
                        const allDone = list.every(r => r.status === 'COMPLETED');
                        return {
                            transactionId: txId,
                            surveys: list,
                            user: first.user,
                            createdAt: dateObj,
                            doneCount,
                            totalCount: list.length,
                            allDone,
                            first
                        };
                    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

                    return groupedOrders.map((order) => (
                        <div key={order.transactionId} className="bg-white border border-gray-100 rounded-[2.5rem] p-6 sm:p-8 hover:shadow-xl transition-all duration-500 relative group overflow-hidden shadow-sm">
                            {/* Accent Background */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

                            {/* Order Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-100 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-orange-50 rounded-[1.2rem] flex items-center justify-center border border-orange-100/50 shrink-0 text-2xl">
                                        📦
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Order Survey</span>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">• ID: {order.transactionId.substring(0, 8)}...</span>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">• {order.createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-black text-gray-900 leading-tight">Pemesan: {order.user?.name || 'User'}</h3>
                                            {order.user?.phone && (
                                                <a 
                                                    href={`https://wa.me/${order.user.phone.replace(/\D/g, '')}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors text-[9px] font-black uppercase rounded-lg tracking-wider"
                                                >
                                                    📱 Chat User
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Progress Info */}
                                <div className="flex flex-col md:flex-row items-end md:items-center gap-4 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                                    {isAdmin && !isAgent && (
                                        <button
                                            onClick={() => {
                                                setIsEditingOrder(order);
                                                const links: Record<string, string> = {};
                                                order.surveys.forEach(s => {
                                                    if (s.result_drive_link) links[s.id] = s.result_drive_link;
                                                });
                                                setOrderForm({
                                                    assigned_agent_id: order.first.assigned_agent_id || '',
                                                    drive_links: links
                                                });
                                            }}
                                            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white shadow-xl shadow-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 border border-gray-800"
                                        >
                                            👔 Kelola Order
                                        </button>
                                    )}
                                    <div className="flex-1 md:text-right w-full md:w-auto">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 ${
                                            order.allDone 
                                                ? 'bg-green-50 text-green-600 border-green-100' 
                                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                            {order.allDone ? 'Selesai 100%' : 'Dalam Proses'}
                                        </span>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1">{order.doneCount}/{order.totalCount} Kost Disurvey</p>
                                    </div>
                                    <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0">
                                        <div 
                                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700" 
                                            style={{ width: `${(order.doneCount / order.totalCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Kost List */}
                            <div className="space-y-4">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Daftar Kost Target Survey ({order.totalCount} Unit)</p>
                                {order.surveys.map((req, idx) => {
                                    const isDone = req.status === 'COMPLETED';
                                    const isSubmitted = req.status === 'SUBMITTED';
                                    const isAwaiting = req.status === 'PENDING_ASSIGNMENT';
                                    
                                    return (
                                        <div key={req.id} className={`rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
                                            isDone ? 'bg-green-50/20 border-green-100/50' : 
                                            isSubmitted ? 'bg-emerald-50/20 border-emerald-100/50' : 
                                            'bg-gray-50/40 border-gray-100'
                                        } hover:border-gray-200`}>
                                            <div className="flex flex-col lg:flex-row justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                        <div className="flex items-center gap-2">
                                                            {isAdmin && (
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer" 
                                                                    checked={selectedSurveyIds.includes(req.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setSelectedSurveyIds([...selectedSurveyIds, req.id]);
                                                                        else setSelectedSurveyIds(selectedSurveyIds.filter(id => id !== req.id));
                                                                    }}
                                                                />
                                                            )}
                                                            <span className="w-5 h-5 bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center text-[10px] font-black">
                                                                {idx + 1}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-base font-black text-gray-900 truncate uppercase">{req.kost_name || `Kost #${idx + 1}`}</h4>
                                                        <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black tracking-widest border uppercase ${
                                                            isDone ? 'bg-green-50 text-green-600 border-green-100' :
                                                            isSubmitted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            isAwaiting ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                                                            'bg-blue-50 text-blue-600 border-blue-100'
                                                        }`}>
                                                            {req.status}
                                                        </span>
                                                        {req.survey_date && (
                                                            <span className="text-[9px] font-bold text-gray-400 italic">
                                                                Jadwal: {req.survey_date} @ {req.survey_time || '-'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-gray-500 font-medium ml-7 mb-3 leading-relaxed">{req.kost_address}</p>

                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ml-7 text-[11px] pt-3 border-t border-gray-100/50">
                                                        <div>
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">WhatsApp Owner</p>
                                                            {req.owner_phone && req.owner_phone !== '-' ? (
                                                                <a 
                                                                    href={`https://wa.me/${req.owner_phone.replace(/\D/g, '')}`} 
                                                                    target="_blank" 
                                                                    rel="noreferrer"
                                                                    className="font-bold text-emerald-600 hover:underline flex items-center gap-1 mt-0.5"
                                                                >
                                                                    🟢 {req.owner_phone}
                                                                </a>
                                                            ) : (
                                                                <p className="font-bold text-gray-400 italic mt-0.5">Belum ada</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Surveyor Lapangan</p>
                                                            <p className="font-bold text-gray-800 mt-0.5">{req.agent_name || 'Belum ditugaskan'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Drive Folder</p>
                                                            {req.result_drive_link ? (
                                                                <a href={req.result_drive_link} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                                                                    📂 Buka Folder
                                                                </a>
                                                            ) : (
                                                                <p className="font-bold text-gray-400 italic mt-0.5">Belum tersedia</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-wrap sm:flex-nowrap lg:flex-col items-center justify-end gap-2 lg:w-44 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-dashed border-gray-100 lg:pl-3">
                                                    {(!isAdmin || isAgent || isDone || isSubmitted) && (
                                                        <button
                                                            onClick={() => {
                                                                setIsEditingSurvey(req);
                                                                setSurveyForm(req);
                                                            }}
                                                            className="flex-1 lg:w-full py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 text-center flex items-center justify-center gap-1.5"
                                                        >
                                                            {isAgent ? '📝 Proses' : '📋 Hasil Survey'}
                                                        </button>
                                                    )}
                                                    
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteSurveyLocal(req.id, req.kost_name)}
                                                            className="flex-1 lg:w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 text-center flex items-center justify-center gap-1.5 border border-red-100"
                                                        >
                                                            🗑️ Hapus
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ));
                })()}

                {filteredRequests.length === 0 && (
                    <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Belum ada data survey.</p>
                    </div>
                )}
            </div>

            {isAdmin && selectedSurveyIds.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-bottom-10">
                    <button 
                        onClick={handleBulkDelete}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 active:scale-95 transition-all group border-4 border-white"
                    >
                        <span className="w-6 h-6 bg-red-800 rounded-lg flex items-center justify-center text-xs font-black">{selectedSurveyIds.length}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Hapus Survey Terpilih</span>
                    </button>
                </div>
            )}

            {/* --- MODALS SECTION --- */}

            {/* MODAL: MANUAL ADD SURVEY */}
            {isAddingManualSurvey && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setIsAddingManualSurvey(false)}>
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="p-10 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center group">
                            <div>
                                <h2 className="text-2xl font-black uppercase text-gray-900 tracking-tight">Input Survey Manual</h2>
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mt-2">Permintaan Luar Aplikasi</p>
                            </div>
                            <button onClick={() => setIsAddingManualSurvey(false)} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-gray-100 rounded-2xl text-gray-300 hover:text-red-500 hover:border-red-500 transition-all active:scale-90 shadow-sm">&times;</button>
                        </div>
                        
                        <form onSubmit={handleManualSurveySubmit} className="flex-grow overflow-y-auto p-10 space-y-10">
                             <div className="grid grid-cols-2 gap-6">
                                <FormField label="Nama Pemesan" placeholder="Cth: Ahmad" value={manualSurveyForm.name || ''} onChange={val => setManualSurveyForm({...manualSurveyForm, name: val})} />
                                <FormField label="No. WhatsApp" placeholder="62..." value={manualSurveyForm.phone || ''} onChange={val => setManualSurveyForm({...manualSurveyForm, phone: val})} />
                                <div className="col-span-2">
                                    <FormField label="Nama Kost" placeholder="Cth: Kost Mawar" value={manualSurveyForm.kostName || ''} onChange={val => setManualSurveyForm({...manualSurveyForm, kostName: val})} />
                                </div>
                                <div className="col-span-2">
                                    <FormField label="Alamat Kost" placeholder="Alamat lengkap..." value={manualSurveyForm.kostAddress || ''} onChange={val => setManualSurveyForm({...manualSurveyForm, kostAddress: val})} />
                                </div>
                                <FormField label="Tgl Survey" type="date" value={manualSurveyForm.surveyDate || ''} onChange={val => setManualSurveyForm({...manualSurveyForm, surveyDate: val})} />
                                <FormField label="Jam Survey" placeholder="Cth: 10:00 WIB" value={manualSurveyForm.surveyTime || ''} onChange={val => setManualSurveyForm({...manualSurveyForm, surveyTime: val})} />
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Status Pembayaran</label>
                                    <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" value={manualSurveyForm.status || 'Selesai'} onChange={e => setManualSurveyForm({...manualSurveyForm, status: e.target.value})}>
                                        <option value="Selesai">LUNAS</option>
                                        <option value="Menunggu">DIPENDING</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl transition-all mt-4">{isSubmitting ? '📦 Menyimpan...' : '💾 Simpan Data Survey'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: BUKTI BAYAR SURVEY (REFACTORED) */}
            {viewingSurveyProof && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingSurveyProof(null)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-8 border-b border-gray-50">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Bukti Transfer Survey</p>
                                <h3 className="text-xl font-black text-gray-900 leading-tight uppercase">{viewingSurveyProof.name}</h3>
                            </div>
                            <button onClick={() => setViewingSurveyProof(null)} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-center">&times;</button>
                        </div>
                        <div className="p-8 text-center">
                            <img src={viewingSurveyProof.proofUrl} alt="Bukti" className="w-full h-auto rounded-2xl shadow-inner bg-gray-50 max-h-[60vh] object-contain mx-auto" />
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: INVOICE SURVEY (REFACTORED) */}
            {viewingSurveyInvoice && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingSurveyInvoice(null)}>
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="bg-orange-600 p-10 text-white relative overflow-hidden">
                            <p className="text-[10px] font-black tracking-widest uppercase opacity-60">Survey Invoice</p>
                            <h3 className="text-3xl font-black mt-2">{viewingSurveyInvoice.invoiceId}</h3>
                        </div>
                        <div className="p-10 flex-1 overflow-y-auto space-y-8">
                             <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kost Target</p><p className="font-black text-gray-900 text-lg">{viewingSurveyInvoice.kostName}</p></div>
                             <div className="grid grid-cols-2 gap-8 text-sm">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">User</p><p className="font-bold">{viewingSurveyInvoice.name}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p><p className="font-black text-orange-600">{FORMAT_CURRENCY(viewingSurveyInvoice.amount)}</p></div>
                             </div>
                        </div>
                        <div className="p-10 border-t border-gray-50 bg-gray-50/50 flex gap-4 shrink-0">
                            <button onClick={() => setViewingSurveyInvoice(null)} className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">Tutup</button>
                            <button onClick={() => window.print()} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Cetak</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: EDIT ORDER (ALL UNITS) */}
            {isEditingOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsEditingOrder(null)}></div>
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div><h2 className="text-xl font-black uppercase text-gray-900">Kelola Order Survey</h2><p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{isEditingOrder.totalCount} Unit Kost • ID: {isEditingOrder.transactionId.substring(0, 8)}</p></div>
                            <button onClick={() => setIsEditingOrder(null)} className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-white transition-colors">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateOrder} className="flex-grow overflow-y-auto p-6 space-y-6">
                            
                            {/* PENETAPAN AGEN */}
                            <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <span>👔</span> Penetapan Agen Surveyor (Terapkan ke semua unit)
                                </label>
                                <select 
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                                    value={orderForm.assigned_agent_id || ''}
                                    onChange={e => setOrderForm({ ...orderForm, assigned_agent_id: e.target.value })}
                                >
                                    <option value="">-- Belum Ada Agen --</option>
                                    {surveyAgents.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} (⭐ {a.rating || '0.0'})</option>
                                    ))}
                                </select>
                            </div>

                            {/* LINK DRIVE PER UNIT */}
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <span>📂</span> Link Drive Folder (Per Unit Kost)
                                </label>
                                <div className="space-y-3">
                                    {isEditingOrder.surveys.map((req: any, idx: number) => (
                                        <div key={req.id} className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <span className="w-6 h-6 bg-white text-gray-400 rounded flex items-center justify-center text-[10px] font-black shrink-0 border border-gray-100 mt-1">{idx + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-[10px] font-black text-gray-900 uppercase truncate max-w-[120px] sm:max-w-[200px]">{req.kost_name}</p>
                                                    {!orderForm.drive_links[req.id] && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleGenerateDriveFolderForOrderUnit(req.id)}
                                                            className="text-[9px] font-black text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200 transition-all uppercase tracking-widest active:scale-95 disabled:opacity-50"
                                                            disabled={isSubmitting}
                                                        >
                                                            {isSubmitting ? '...' : '📂 Buat Folder'}
                                                        </button>
                                                    )}
                                                </div>
                                                <input 
                                                    type="url"
                                                    placeholder="Masukkan link Google Drive..."
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={orderForm.drive_links[req.id] || ''}
                                                    onChange={e => {
                                                        const newLinks = { ...orderForm.drive_links, [req.id]: e.target.value };
                                                        setOrderForm({ ...orderForm, drive_links: newLinks });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                            <button type="submit" disabled={isSubmitting} onClick={handleUpdateOrder} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {isSubmitting ? '🔄 Menyimpan...' : '💾 Simpan Perubahan Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDIT SURVEY (LOCALIZED) */}
            {isEditingSurvey && !userRating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsEditingSurvey(null)}></div>
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div><h2 className="text-xl font-black uppercase text-gray-900">Kelola Survey</h2><p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Update Status & Agen Surveyor</p></div>
                            <button onClick={() => setIsEditingSurvey(null)} className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-white transition-colors">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateSurvey} className="flex-grow overflow-y-auto p-6 space-y-5">
                            <div className="space-y-4">
                                {!isAgent && (
                                    <div>
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Pesanan</label>
                                            {isAdmin && isEditingSurvey && (
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const phone = isEditingSurvey.user?.phone?.startsWith('+62') ? isEditingSurvey.user.phone.replace('+62', '62') : (isEditingSurvey.user?.phone?.startsWith('0') ? '62' + isEditingSurvey.user.phone.substring(1) : isEditingSurvey.user?.phone);
                                                        const msg = surveyForm.status === 'AGENT_ASSIGNED' 
                                                            ? `Halo%20${encodeURIComponent(isEditingSurvey.user?.name || '')},%20tim%20kami%20telah%20menugaskan%20agent%20untuk%20survey%20kost%20${encodeURIComponent(surveyForm.kost_name || '')}.%20Mohon%20tunggu%20update%20selanjutnya.`
                                                            : `Halo%20${encodeURIComponent(isEditingSurvey.user?.name || '')},%20update%20terbaru%20untuk%20survey%20kost%20${encodeURIComponent(surveyForm.kost_name || '')}:%20${surveyForm.status}.`;
                                                        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                                                    }}
                                                    className="text-[10px] font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 uppercase tracking-widest"
                                                >
                                                    <span>📱</span> Hubungi User
                                                </button>
                                            )}
                                        </div>
                                        <div className="mt-1.5 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between">
                                            <span className={`text-xs font-black uppercase tracking-widest ${
                                                surveyForm.status === 'COMPLETED' ? 'text-green-600' : 
                                                surveyForm.status === 'SURVEYING' ? 'text-orange-600 font-bold' :
                                                surveyForm.status === 'RESCHEDULED' ? 'text-amber-600' :
                                                'text-orange-600'
                                            }`}>
                                                {surveyForm.status === 'PENDING_ASSIGNMENT' ? 'Menunggu Agen' : 
                                                 surveyForm.status === 'AGENT_ASSIGNED' ? 'Agen Ditetapkan' :
                                                 surveyForm.status === 'SURVEYING' ? 'Sedang Survey' :
                                                 surveyForm.status === 'COMPLETED' ? 'Survey Selesai' :
                                                 surveyForm.status === 'AWAITING_PAYMENT' ? 'Menunggu Pembayaran' :
                                                 surveyForm.status === 'CANCELLED' ? 'Dibatalkan' :
                                                 surveyForm.status === 'RESCHEDULED' ? 'Penjadwalan Ulang' :
                                                 surveyForm.status}
                                            </span>
                                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                                        </div>
                                    </div>
                                )}

                                {isAdmin && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Agen Surveyor</label>
                                            <select 
                                                className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                                                value={surveyForm.assigned_agent_id || ''}
                                                onChange={e => {
                                                    const agentId = e.target.value;
                                                    const agent = surveyAgents.find(a => a.id === agentId);
                                                    if (agent) {
                                                        const newStatus = surveyForm.status === 'AWAITING_PAYMENT' ? 'PENDING_ASSIGNMENT' : surveyForm.status;
                                                        setSurveyForm({ 
                                                            ...surveyForm, 
                                                            assigned_agent_id: agent.id, 
                                                            agent_name: agent.name, 
                                                            agent_phone: agent.phone,
                                                            agent_photo_url: agent.photo_url, 
                                                            status: newStatus 
                                                        });
                                                    } else {
                                                        setSurveyForm({ ...surveyForm, assigned_agent_id: null, agent_name: '', agent_phone: '', agent_photo_url: '' });
                                                    }
                                                }}
                                            >
                                                <option value="">-- Belum Ada Agen --</option>
                                                {surveyAgents.map(a => (
                                                    <option key={a.id} value={a.id}>{a.name} (⭐ {a.rating || '0.0'})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {(isAdmin || isAgent) && (
                                    <div>
                                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            {isAdmin ? '📋 Peninjauan Laporan Surveyor' : '📝 Summary Penilaian Surveyor'}
                                        </h3>
                                        <div className="space-y-4">
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
                                                                         <label className={`flex items-center gap-2 p-2 rounded-lg border text-[10px] sm:text-xs transition-colors ${isChecked ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'} ${isAdmin && !isAgent ? 'opacity-80 cursor-default hover:bg-gray-50' : 'cursor-pointer'}`}>
                                                                             <input
                                                                                 type="checkbox"
                                                                                 className="w-3.5 h-3.5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 cursor-pointer disabled:cursor-default"
                                                                                 checked={isChecked}
                                                                                 onChange={(e) => {
                                                                                     if (isAdmin && !isAgent) return;
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
                                                                                 disabled={isAdmin && !isAgent}
                                                                             />
                                                                             <span className="truncate" title={item}>{item}</span>
                                                                         </label>
                                                                         
                                                                         {isDekat && isChecked && (
                                                                             <div className="flex flex-col gap-1 px-1">
                                                                                 <div className="flex items-center gap-1">
                                                                                    {isAdmin && !isAgent ? (
                                                                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                                                                            Jarak: {(surveyForm.evaluation_summary as any)?.[`${field.id}_${item}_dist`] || '-'} {(surveyForm.evaluation_summary as any)?.[`${field.id}_${item}_unit`] || ''}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <>
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
                                                                                            >
                                                                                                <option value="m">m</option>
                                                                                                <option value="km">km</option>
                                                                                            </select>
                                                                                        </>
                                                                                    )}
                                                                                 </div>

                                                                                 {item === 'Dekat Kampus/Kantor' && (
                                                                                    <div className="mt-0.5">
                                                                                        {isAdmin && !isAgent ? (
                                                                                            <span className="text-[10px] font-bold text-gray-500 italic block">
                                                                                                Nama: {(surveyForm.evaluation_summary as any)?.[`${field.id}_${item}_name`] || '-'}
                                                                                            </span>
                                                                                        ) : (
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
                                                                                            />
                                                                                        )}
                                                                                    </div>
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
                                                            <div className={`flex items-center gap-2 ${isAdmin && !isAgent ? 'bg-gray-50/50' : 'bg-gray-50'} border border-gray-200 rounded-xl px-4 py-2.5`}>
                                                                {isAdmin && !isAgent ? (
                                                                    <div className="flex-1 text-sm font-bold text-gray-700">
                                                                        {(surveyForm.evaluation_summary as any)?.wifi_speed || '-'}
                                                                    </div>
                                                                ) : (
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
                                                                    />
                                                                )}
                                                                <span className="text-xs font-black text-gray-400 tracking-widest">MBPS</span>
                                                            </div>
                                                         </div>
                                                     )}

                                                      {field.id !== 'kost_type' && (
                                                          <>
                                                              <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-gray-100 pt-3">
                                                                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Penilaian Keseluruhan</label>
                                                                 {isAdmin ? (
                                                                     <StarRatingDisplay rating={(surveyForm.evaluation_summary as any)?.[`${field.id}_rating`]} />
                                                                 ) : (
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
                                                                     />
                                                                 )}
                                                              </div>

                                                              <textarea 
                                                                  readOnly={isAdmin && !isAgent}
                                                                  className={`w-full ${isAdmin && !isAgent ? 'bg-gray-50/50 cursor-default' : 'bg-gray-50'} border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all outline-none mb-3`}
                                                                  rows={2}
                                                                  value={(surveyForm.evaluation_summary as any)?.[field.id] || ''}
                                                                  onChange={e => {
                                                                      if (isAdmin && !isAgent) return;
                                                                      setSurveyForm({ 
                                                                          ...surveyForm, 
                                                                          evaluation_summary: { 
                                                                              ...(surveyForm.evaluation_summary || {}), 
                                                                              [field.id]: e.target.value 
                                                                          } 
                                                                      });
                                                                  }}
                                                                  placeholder={isAdmin && !isAgent ? 'Belum ada catatan...' : `Tulis hasil pengecekan ${field.label.toLowerCase()}...`}
                                                              />

                                                              <div className="space-y-2">
                                                                  <div className="flex items-center justify-between">
                                                                      <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Bukti Foto</span>
                                                                       {isAgent && (
                                                                         <label className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-600 cursor-pointer hover:bg-orange-100 flex items-center gap-1.5 ${isUploadingSurveyPhoto === field.id ? 'opacity-50' : ''}`}>
                                                                             {isUploadingSurveyPhoto === field.id ? 'Uploading...' : 'Tambah Foto'}
                                                                             <input 
                                                                                 type="file" 
                                                                                 multiple 
                                                                                 accept="image/*" 
                                                                                 className="hidden" 
                                                                                 disabled={isUploadingSurveyPhoto === field.id}
                                                                                 onChange={(e) => handleSurveyPhotoUploadLocal(field.id, e.target.files)} 
                                                                             />
                                                                         </label>
                                                                       )}
                                                                  </div>
                                                                  <div className="grid grid-cols-5 gap-2">
                                                                      {((surveyForm.evaluation_summary as any)?.[`${field.id}_photos`] || []).map((url: string, idx: number) => (
                                                                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm bg-gray-50">
                                                                              <img src={url} alt="Proof" className="w-full h-full object-cover" />
                                                                              {isAgent && (
                                                                                 <button 
                                                                                     type="button"
                                                                                     onClick={() => handleRemoveSurveyPhotoLocal(field.id, url)}
                                                                                     className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                                                                 >
                                                                                     &times;
                                                                                 </button>
                                                                              )}
                                                                          </div>
                                                                      ))}
                                                                      {((surveyForm.evaluation_summary as any)?.[`${field.id}_photos`] || []).length === 0 && (
                                                                         <div className="col-span-5 py-3 border border-dashed border-gray-100 rounded-xl flex items-center justify-center">
                                                                             <span className="text-[10px] font-bold text-gray-300 italic">Tidak ada foto</span>
                                                                         </div>
                                                                      )}
                                                                  </div>
                                                              </div>
                                                          </>
                                                      )}
                                                 </div>
                                             ))}
                                         </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-100">
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Link Hasil Survey (Foto & Video)</label>
                                            {!surveyForm.result_drive_link && isAdmin && !isAgent && (
                                                <button 
                                                    type="button" 
                                                    onClick={handleGenerateDriveFolderLocal}
                                                    className="text-[10px] font-black text-white bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? '...' : '📂 Buat Folder Manual'}
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            readOnly
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-600 cursor-not-allowed outline-none"
                                            value={surveyForm.result_drive_link || ''}
                                            placeholder="Menunggu penjadwalan/folder..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsEditingSurvey(null)} className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                                    {isSubmitting ? 'Simpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL USER RATING (LOCALIZED) */}
            {isEditingSurvey && userRating > 0 && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => { setIsEditingSurvey(null); setUserRating(0); }}></div>
                    <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 text-center">
                        <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6">⭐</div>
                        <h3 className="text-xl font-black text-gray-900 uppercase">Beri Penilaian</h3>
                        <p className="text-xs font-bold text-gray-400 mt-2 mb-8 uppercase tracking-widest">Bagaimana layanan survey kami?</p>
                        
                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button 
                                    key={num} 
                                    onClick={() => setUserRating(num)}
                                    className={`w-10 h-10 rounded-xl text-lg transition-all ${userRating >= num ? 'bg-orange-500 text-white shadow-lg scale-110' : 'bg-gray-50 text-gray-300'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <textarea 
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none transition-all mb-6"
                            placeholder="Tulis testimoni Anda (opsional)..."
                            value={userComment}
                            onChange={e => setUserComment(e.target.value)}
                            rows={3}
                        />

                        <button 
                            onClick={handleSubmitFeedback}
                            disabled={isSubmitting}
                            className="w-full py-4 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Mengirim...' : 'Kirim Penilaian'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const FormField = ({ label, placeholder, value, onChange, type = "text" }: { label: string, placeholder?: string, value: string, onChange: (val: string) => void, type?: string }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <input 
            required
            type={type} 
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500/20 outline-none transition-all placeholder:text-gray-300"
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

export default SurveyManagement;
