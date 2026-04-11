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
    // --- LOCAL UI STATE ---
    const [adminSurveyTab, setAdminSurveyTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
    const [agentTab, setAgentTab] = useState<'pending' | 'active' | 'history'>('pending');
    const [selectedSurveyIds, setSelectedSurveyIds] = useState<string[]>([]);
    
    const [isEditingSurvey, setIsEditingSurvey] = useState<SurveyRequest | null>(null);
    const [surveyForm, setSurveyForm] = useState<Partial<SurveyRequest>>({});
    
    const [isReschedulingSurvey, setIsReschedulingSurvey] = useState<SurveyRequest | null>(null);
    const [newSurveyDate, setNewSurveyDate] = useState('');
    const [newSurveyTime, setNewSurveyTime] = useState('');
    
    const [userRating, setUserRating] = useState<number>(0);
    const [userComment, setUserComment] = useState('');
    
    const [isUploadingSurveyPhoto, setIsUploadingSurveyPhoto] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isAddingManualVerif, setIsAddingManualVerif] = useState(false);
    const [manualVerifForm, setManualVerifForm] = useState<any>({});

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

            if (updates.status !== oldStatus) {
                await notifySurveyStatusUpdate(isEditingSurvey.id, updates.status);
            }

            alert('Survey berhasil diperbarui');
            refreshData();
            setIsEditingSurvey(null);
        } catch (error) {
            console.error(error);
            alert('Gagal update survey');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestReschedule = async () => {
        if (!isReschedulingSurvey) return;
        setIsSubmitting(true);
        try {
            const updates = {
                survey_date: newSurveyDate,
                survey_time: newSurveyTime,
                notes: `(Reschedule Requested) ${isReschedulingSurvey.notes || ''}`.trim()
            };
            await updateSurveyRequest(isReschedulingSurvey.id, updates);
            
            const waText = `Halo ${isReschedulingSurvey.user?.name}, agen survey kami mengajukan perubahan jadwal survey untuk kost ${isReschedulingSurvey.kost_name} menjadi tanggal ${newSurveyDate} jam ${newSurveyTime}. Mohon konfirmasinya.`;
            window.open(`https://wa.me/${isReschedulingSurvey.user?.phone}?text=${encodeURIComponent(waText)}`, '_blank');
            
            alert('Permintaan Jadwal Ulang Terkirim');
            refreshData();
            setIsReschedulingSurvey(null);
        } catch (error) {
            alert('Gagal mengirim permintaan jadwal ulang');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitFeedback = async () => {
        if (!isEditingSurvey) return;
        setIsSubmitting(true);
        try {
            const updates = { user_rating: userRating, user_comment: userComment };
            await updateSurveyRequest(isEditingSurvey.id, updates);
            alert('Terima kasih atas feedback Anda!');
            refreshData();
            setUserRating(0);
            setUserComment('');
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

    const handleSurveyPhotoUploadLocal = async (fieldId: string, files: FileList | null) => {
        if (!files || files.length === 0 || !isEditingSurvey) return;
        setIsUploadingSurveyPhoto(fieldId);
        try {
            const uploadPromises = Array.from(files).map(file => uploadSurveyPhoto(isEditingSurvey.id, fieldId, file));
            const newUrls = await Promise.all(uploadPromises);
            
            const currentSummary = (surveyForm.evaluation_summary as any) || {};
            const currentPhotos = currentSummary[`${fieldId}_photos`] || [];
            
            setSurveyForm({
                ...surveyForm,
                evaluation_summary: {
                    ...currentSummary,
                    [`${fieldId}_photos`]: [...currentPhotos, ...newUrls]
                }
            });
        } catch (error) {
            console.error(error);
            alert('Gagal upload foto');
        } finally {
            setIsUploadingSurveyPhoto(null);
        }
    };

    const handleRemoveSurveyPhotoLocal = async (fieldId: string, url: string) => {
        if (!isEditingSurvey || !window.confirm('Hapus foto ini?')) return;
        try {
            await deleteSurveyPhoto(url);
            const currentSummary = (surveyForm.evaluation_summary as any) || {};
            const currentPhotos = currentSummary[`${fieldId}_photos`] || [];
            
            setSurveyForm({
                ...surveyForm,
                evaluation_summary: {
                    ...currentSummary,
                    [`${fieldId}_photos`]: currentPhotos.filter((p: string) => p !== url)
                }
            });
        } catch (error) {
            alert('Gagal menghapus foto');
        }
    };

    const handleOpenEdit = (req: SurveyRequest) => {
        setIsEditingSurvey(req);
        setSurveyForm(req);
    };

    const handleBulkDelete = async () => {
        if (selectedSurveyIds.length === 0) return;
        if (!window.confirm(`Hapus ${selectedSurveyIds.length} survey?`)) return;
        setIsSubmitting(true);
        try {
            await Promise.all(selectedSurveyIds.map(id => deleteSurveyRequest(id)));
            alert('Survey terpilih berhasil dihapus');
            setSelectedSurveyIds([]);
            refreshData();
        } catch (error) {
            alert('Gagal menghapus survey massal');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleManualVerifSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            // Analogous to Dashboard.tsx logic (Dummy implementation for now)
            alert('Data survey manual disimulasikan (Sesi Browser). Untuk implementasi database permanen, hubungkan ke API verifikasi.');
            setIsAddingManualVerif(false);
            setManualVerifForm({});
            if (refreshData) refreshData();
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
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Verifikasi Kost (Survey)</h2>
                    <p className="text-gray-500 text-sm mt-1">Kelola seluruh permintaan survey lapangan dari pengguna.</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setIsAddingManualVerif(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        Tambah Manual
                    </button>
                )}
            </div>

            {isAdmin && (
                <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 flex gap-1 shadow-sm sticky top-0 z-10 transition-all overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'Semua', icon: '📋' },
                        { id: 'pending', label: 'Butuh Agen', icon: '⏳' },
                        { id: 'active', label: 'Proses', icon: '⚡' },
                        { id: 'completed', label: 'Selesai', icon: '✅' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setAdminSurveyTab(t.id as any)}
                            className={`flex-1 min-w-[100px] py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                                adminSurveyTab === t.id 
                                ? 'bg-orange-600 text-white shadow-md scale-[1.02]' 
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <span>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {filteredRequests.map((req: SurveyRequest) => (
                    <div key={req.id} className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-all relative overflow-hidden ${selectedSurveyIds.includes(req.id) ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/10' : 'border-gray-100'}`}>
                        {isAdmin && (
                            <div className="absolute top-4 left-4 z-20">
                                <label className="relative flex items-center justify-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="peer h-5 w-5 appearance-none rounded-md border border-gray-300 bg-white checked:bg-orange-500 checked:border-orange-500 transition-all shadow-sm"
                                        checked={selectedSurveyIds.includes(req.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedSurveyIds([...selectedSurveyIds, req.id]);
                                            else setSelectedSurveyIds(selectedSurveyIds.filter(id => id !== req.id));
                                        }}
                                    />
                                    <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                </label>
                            </div>
                        )}
                        <div className={`flex-1 space-y-4 relative z-10 ${isAdmin ? 'pl-8' : ''}`}>
                             <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-50 pb-4 gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider">#{req.id.slice(0,8)}</span>
                                        <span className="text-xs text-gray-400 font-medium">{new Date(req.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                    </div>
                                    <p className="font-bold text-gray-900 text-lg leading-tight mb-1">{req.kost_name}</p>
                                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                        {req.user?.name || 'User'}
                                    </p>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <span className={`inline-flex w-full sm:w-auto justify-center px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border shadow-sm
                                        ${req.status === 'AWAITING_PAYMENT' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                          req.status === 'PENDING_ASSIGNMENT' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                          req.status === 'AGENT_ASSIGNED' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                          req.status === 'SURVEYING' ? 'bg-orange-600 text-white border-orange-600 animate-pulse' : 
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
                            {/* ... more details ... */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50">
                                {isAdmin && (
                                    <>
                                        <button 
                                            onClick={() => handleOpenEdit(req)}
                                            className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span>⚙️</span> Kelola Survey
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteSurveyLocal(req.id, req.kost_name)}
                                            className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase transition-all"
                                        >
                                            Hapus
                                        </button>
                                    </>
                                )}
                                {isAgent && (
                                    <button 
                                        onClick={() => handleOpenEdit(req)}
                                        className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>📝</span> Update Laporan
                                    </button>
                                )}
                                {!isAdmin && !isAgent && req.status === 'COMPLETED' && !req.user_rating && (
                                    <button 
                                        onClick={() => { setIsEditingSurvey(req); setUserRating(5); }}
                                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Beri Penilaian
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
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

            {/* MODAL: MANUAL ADD VERIF */}
            {isAddingManualVerif && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setIsAddingManualVerif(false)}>
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"></div>
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="p-10 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center group">
                            <div>
                                <h2 className="text-2xl font-black uppercase text-gray-900 tracking-tight">Input Survey Manual</h2>
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mt-2">Permintaan Luar Aplikasi</p>
                            </div>
                            <button onClick={() => setIsAddingManualVerif(false)} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-gray-100 rounded-2xl text-gray-300 hover:text-red-500 hover:border-red-500 transition-all active:scale-90 shadow-sm">&times;</button>
                        </div>
                        
                        <form onSubmit={handleManualVerifSubmit} className="flex-grow overflow-y-auto p-10 space-y-10">
                             <div className="grid grid-cols-2 gap-6">
                                <FormField label="Nama Pemesan" placeholder="Cth: Ahmad" value={manualVerifForm.name || ''} onChange={val => setManualVerifForm({...manualVerifForm, name: val})} />
                                <FormField label="No. WhatsApp" placeholder="62..." value={manualVerifForm.phone || ''} onChange={val => setManualVerifForm({...manualVerifForm, phone: val})} />
                                <div className="col-span-2">
                                    <FormField label="Nama Kost" placeholder="Cth: Kost Mawar" value={manualVerifForm.kostName || ''} onChange={val => setManualVerifForm({...manualVerifForm, kostName: val})} />
                                </div>
                                <div className="col-span-2">
                                    <FormField label="Alamat Kost" placeholder="Alamat lengkap..." value={manualVerifForm.kostAddress || ''} onChange={val => setManualVerifForm({...manualVerifForm, kostAddress: val})} />
                                </div>
                                <FormField label="Tgl Survey" type="date" value={manualVerifForm.surveyDate || ''} onChange={val => setManualVerifForm({...manualVerifForm, surveyDate: val})} />
                                <FormField label="Jam Survey" placeholder="Cth: 10:00 WIB" value={manualVerifForm.surveyTime || ''} onChange={val => setManualVerifForm({...manualVerifForm, surveyTime: val})} />
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Status Pembayaran</label>
                                    <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all" value={manualVerifForm.status || 'Selesai'} onChange={e => setManualVerifForm({...manualVerifForm, status: e.target.value})}>
                                        <option value="Selesai">LUNAS</option>
                                        <option value="Menunggu">DITENDA</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl transition-all mt-4">{isSubmitting ? '📦 Menyimpan...' : '💾 Simpan Data Survey'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: BUKTI BAYAR VERIF */}
            {viewingVerifProof && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingVerifProof(null)}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-8 border-b border-gray-50">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Bukti Transfer Survey</p>
                                <h3 className="text-xl font-black text-gray-900 leading-tight uppercase">{viewingVerifProof.name}</h3>
                            </div>
                            <button onClick={() => setViewingVerifProof(null)} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-center">&times;</button>
                        </div>
                        <div className="p-8">
                            <img src={viewingVerifProof.proofUrl} alt="Bukti" className="w-full h-auto rounded-2xl shadow-inner bg-gray-50" />
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: INVOICE VERIF */}
            {viewingVerifInvoice && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingVerifInvoice(null)}>
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="bg-orange-600 p-10 text-white relative overflow-hidden">
                            <p className="text-[10px] font-black tracking-widest uppercase opacity-60">Verification Invoice</p>
                            <h3 className="text-3xl font-black mt-2">{viewingVerifInvoice.invoiceId}</h3>
                        </div>
                        <div className="p-10 flex-1 overflow-y-auto space-y-8">
                             <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kost Target</p><p className="font-black text-gray-900 text-lg">{viewingVerifInvoice.kostName}</p></div>
                             <div className="grid grid-cols-2 gap-8 text-sm">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">User</p><p className="font-bold">{viewingVerifInvoice.name}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p><p className="font-black text-orange-600">{FORMAT_CURRENCY(viewingVerifInvoice.amount)}</p></div>
                             </div>
                        </div>
                        <div className="p-10 border-t border-gray-50 bg-gray-50/50 flex gap-4 shrink-0">
                            <button onClick={() => setViewingVerifInvoice(null)} className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">Tutup</button>
                            <button onClick={() => window.print()} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Cetak</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDIT SURVEY (LOCALIZED) */}
            {isEditingSurvey && !userRating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsEditingSurvey(null)}></div>
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
                            <div><h2 className="text-xl font-black uppercase text-orange-900">Kelola Survey</h2><p className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">Update Status & Agen Surveyor</p></div>
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
                                                {surveyForm.status === 'PENDING_ASSIGNMENT' ? 'Menunggu Agen (Paid)' : 
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

                                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Link Hasil Survey (Automated Drive)</label>
                                        {!surveyForm.result_drive_link && isAdmin && !isAgent && (
                                            <button 
                                                type="button" 
                                                onClick={handleGenerateDriveFolderLocal}
                                                className="text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? '...' : '📂 Buat Folder Manual'}
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        readOnly
                                        className="w-full bg-white/80 border border-blue-200 rounded-xl px-4 py-3 text-xs font-bold text-blue-600 cursor-not-allowed outline-none"
                                        value={surveyForm.result_drive_link || ''}
                                        placeholder="Menunggu penjadwalan/folder..."
                                    />
                                </div>

                                {isAgent && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <h3 className="text-xs font-black text-orange-900 uppercase tracking-widest mb-4 flex items-center gap-2">📝 Summary Penilaian Surveyor</h3>
                                        <div className="space-y-4">
                                             {[
                                                 { id: 'room_facilities', label: 'Fasilitas Kamar', icon: '🛏️' },
                                                 { id: 'bathroom_facilities', label: 'Fasilitas WC', icon: '🚿' },
                                                 { id: 'water_check', label: 'Pengecekan Air', icon: '💧' },
                                                 { id: 'wifi_check', label: 'Pengecekan WiFi', icon: '📶' },
                                                 { id: 'security_check', label: 'Pengecekan Keamanan', icon: '🛡️' },
                                                 { id: 'access_check', label: 'Akses Umum', icon: '📍' },
                                                 { id: 'resident_testimonial', label: 'Testimoni', icon: '💬' },
                                             ].map((field) => (
                                                 <div key={field.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-orange-200">
                                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                                         <span>{field.icon}</span> {field.label}
                                                     </label>
                                                      <textarea 
                                                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all outline-none mb-3"
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

                                                     <div className="space-y-2">
                                                         <div className="flex items-center justify-between">
                                                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bukti Foto</span>
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
                                                         </div>
                                                         <div className="grid grid-cols-5 gap-2">
                                                             {((surveyForm.evaluation_summary as any)?.[`${field.id}_photos`] || []).map((url: string, idx: number) => (
                                                                 <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm bg-gray-50">
                                                                     <img src={url} alt="Proof" className="w-full h-full object-cover" />
                                                                     <button 
                                                                         type="button"
                                                                         onClick={() => handleRemoveSurveyPhotoLocal(fieldId, url)}
                                                                         className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
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
                                    </div>
                                )}
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
