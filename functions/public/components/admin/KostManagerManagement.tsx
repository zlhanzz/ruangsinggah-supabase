import React, { useState, useEffect } from 'react';
import { FORMAT_CURRENCY } from '../../constants';
import { supabase } from '../../supabase';
import { 
    updateKostManagerRequest, 
    deleteKostManagerRequest, 
    getSurveyAgents,
    generateManualDriveFolder
} from '../../adminService';

interface KostManagerManagementProps {
    isAdmin: boolean;
    refreshData: () => void;
    onNavigateToPortal?: () => void;
}

const KostManagerManagement: React.FC<KostManagerManagementProps> = ({
    isAdmin,
    refreshData,
    onNavigateToPortal
}) => {
    const [requests, setRequests] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Dialog/Editing State
    const [editingRequest, setEditingRequest] = useState<any | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'ALL' | 'NEED_AGENT' | 'SURVEYING' | 'VERIFICATION' | 'ACTIVE'>('ALL');
    const [selectedMitra, setSelectedMitra] = useState<any | null>(null);
    const [isMitraModalOpen, setIsMitraModalOpen] = useState(false);
    const [assignAgentMap, setAssignAgentMap] = useState<{ [reqId: string]: string }>({});

    // Comprehensive Review Modal States
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewRequest, setReviewRequest] = useState<any | null>(null);
    const [reviewProperty, setReviewProperty] = useState<any | null>(null);
    const [reviewSurvey, setReviewSurvey] = useState<any | null>(null);
    const [loadingReview, setLoadingReview] = useState(false);
    const [reviewActiveTab, setReviewActiveTab] = useState<'info' | 'photos' | 'rooms' | 'legal'>('info');
    const [photoCategoryFilter, setPhotoCategoryFilter] = useState<string>('ALL');
    const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; label?: string } | null>(null);
    
    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch requests
            const { data: reqData, error: reqErr } = await supabase
                .from('kostmanager_requests')
                .select(`
                    *,
                    user:user_id (
                        name,
                        email,
                        phone
                    ),
                    transaction:transaction_id (
                        amount,
                        status,
                        payment_method,
                        created_at,
                        metadata
                    )
                `)
                .order('created_at', { ascending: false });

            if (reqErr) throw reqErr;
            setRequests(reqData || []);

            // Fetch agents
            const surveyAgents = await getSurveyAgents();
            setAgents(surveyAgents || []);
        } catch (err) {
            console.error('Error loading KostManager requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Open Comprehensive Review Modal and load all connected property & survey assets
    const openReviewModal = async (req: any) => {
        setReviewRequest(req);
        setReviewModalOpen(true);
        setLoadingReview(true);
        setReviewActiveTab('info');
        setPhotoCategoryFilter('ALL');
        try {
            let propData: any = null;
            // 1. Fetch from properties by property_id
            if (req.property_id) {
                const { data } = await supabase.from('properties').select('*').eq('id', req.property_id).maybeSingle();
                if (data) propData = data;
            }
            // 2. Fetch from properties by transaction metadata
            if (!propData && req.transaction?.metadata?.propertyId) {
                const { data } = await supabase.from('properties').select('*').eq('id', req.transaction.metadata.propertyId).maybeSingle();
                if (data) propData = data;
            }
            // 3. Fallback to properties by owner_uid / user_id
            if (!propData && req.user_id) {
                const { data } = await supabase.from('properties').select('*').eq('owner_uid', req.user_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
                if (data) propData = data;
            }
            // 4. Fallback from dedicated mitra_kostmanager table
            if (!propData && req.property_id) {
                const { data } = await supabase.from('mitra_kostmanager').select('*').eq('property_id', req.property_id).maybeSingle();
                if (data) propData = data;
            }
            setReviewProperty(propData);

            // Fetch survey metadata (signature, drive link, etc.) from kostmanager_surveys and fallback to survey_requests
            let survData: any = null;
            const { data: kmSurv } = await supabase
                .from('kostmanager_surveys')
                .select('*')
                .or(`kostmanager_request_id.eq.${req.id},id.eq.${req.id}`)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (kmSurv) {
                survData = kmSurv;
            } else if (req.transaction_id) {
                const { data: sReq } = await supabase
                    .from('survey_requests')
                    .select('signature_data, result_drive_link, status, created_at')
                    .eq('transaction_id', req.transaction_id)
                    .maybeSingle();
                if (sReq) survData = sReq;
            }

            // Also check properties / metadata for signature fallback
            if (!survData?.signature_data && (propData?.metadata?.signature_data || req.signature_data)) {
                survData = {
                    ...(survData || {}),
                    signature_data: propData?.metadata?.signature_data || req.signature_data
                };
            }

            setReviewSurvey(survData || null);
        } catch (err) {
            console.error("Error loading review details:", err);
        } finally {
            setLoadingReview(false);
        }
    };

    // Approve and Activate Auto-Pilot service
    const handleApproveAndActivate = async (req: any, prop: any) => {
        if (!window.confirm(`Setujui seluruh hasil pendataan dan aktifkan layanan Auto-Pilot untuk "${req.kost_name}" sekarang?\n\nProperti akan langsung berstatus AKTIF dan tayang di platform pencarian.`)) return;
        setIsSubmitting(true);
        try {
            // 1. Update kostmanager_requests to ACTIVE
            await supabase.from('kostmanager_requests')
                .update({ 
                    status: 'ACTIVE',
                    updated_at: new Date().toISOString()
                })
                .eq('id', req.id);

            // 2. Update properties to active & is_managed = true
            const propId = prop?.id || req.property_id;
            if (propId) {
                await supabase.from('properties')
                    .update({ 
                        status: 'active',
                        is_managed: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', propId);
            }

            // 3. Update kostmanager_surveys to COMPLETED
            await supabase.from('kostmanager_surveys')
                .update({ 
                    status: 'COMPLETED',
                    updated_at: new Date().toISOString()
                })
                .eq('kostmanager_request_id', req.id);

            // 4. Update survey_requests to COMPLETED if any
            if (req.transaction_id) {
                await supabase.from('survey_requests')
                    .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
                    .eq('transaction_id', req.transaction_id);
            }

            alert(`✅ Layanan KostManager untuk "${req.kost_name}" berhasil diaktifkan sepenuhnya (ACTIVE)!`);
            setReviewModalOpen(false);
            await loadData();
            refreshData();
        } catch (err) {
            console.error('Error activating KostManager:', err);
            alert('Gagal mengaktifkan layanan: ' + (err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatusAndAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRequest) return;
        setIsSubmitting(true);
        try {
            // Determine automatic status
            let computedStatus = editingRequest.status;
            
            if (!editForm.assigned_agent_id) {
                computedStatus = 'PENDING_ASSIGNMENT';
            } else {
                if (computedStatus === 'PENDING_ASSIGNMENT') {
                    computedStatus = 'PENDING_ASSIGNMENT';
                }
                if (editForm.result_drive_link) {
                    computedStatus = 'PENDING_ONBOARDING';
                } else if (computedStatus === 'PENDING_ONBOARDING') {
                    computedStatus = 'AGENT_ASSIGNED';
                }
            }

            const updates: any = {
                status: computedStatus,
                assigned_agent_id: editForm.assigned_agent_id || null,
                result_drive_link: editForm.result_drive_link || null
            };

            if (editForm.assigned_agent_id) {
                const selectedAgent = agents.find(a => a.id === editForm.assigned_agent_id);
                if (selectedAgent) {
                    updates.agent_name = selectedAgent.name;
                    updates.agent_phone = selectedAgent.phone;
                }
            } else {
                updates.agent_name = null;
                updates.agent_phone = null;
            }

            await updateKostManagerRequest(editingRequest.id, updates);
            alert('Permintaan KostManager berhasil diperbarui.');
            setEditingRequest(null);
            loadData();
            refreshData();
        } catch (err) {
            console.error(err);
            alert('Gagal memperbarui data.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus permintaan KostManager untuk "${name}"?`)) return;
        setIsSubmitting(true);
        try {
            await deleteKostManagerRequest(id);
            alert('Permintaan berhasil dihapus.');
            loadData();
            refreshData();
        } catch (err) {
            console.error(err);
            alert('Gagal menghapus permintaan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING_ASSIGNMENT':
                return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
            case 'AGENT_ASSIGNED':
                return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
            case 'SURVEYING':
                return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
            case 'PENDING_ONBOARDING':
            case 'SUBMITTED':
                return 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold';
            case 'ACTIVE':
                return 'bg-green-100 text-green-900 border-green-300 font-bold';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING_ASSIGNMENT': return 'Menunggu Agen';
            case 'AGENT_ASSIGNED': return 'Agen Ditugaskan';
            case 'SURVEYING': return 'Sedang Disurvey';
            case 'PENDING_ONBOARDING':
            case 'SUBMITTED': return 'Menunggu Onboarding Admin';
            case 'ACTIVE': return 'Aktif (Auto-Pilot)';
            default: return status;
        }
    };

    const handleAssignAgentInline = async (reqId: string, agentId: string) => {
        if (!agentId) return alert('Silakan pilih agen terlebih dahulu.');
        const selectedAgent = agents.find(a => a.id === agentId);
        if (!selectedAgent) return;
        
        setIsSubmitting(true);
        try {
            const updates = {
                status: 'AGENT_ASSIGNED',
                assigned_agent_id: agentId,
                agent_name: selectedAgent.name,
                agent_phone: selectedAgent.phone
            };
            await updateKostManagerRequest(reqId, updates);
            alert('Agen berhasil ditugaskan.');
            loadData();
            refreshData();
        } catch (err) {
            console.error(err);
            alert('Gagal menugaskan agen.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'NEED_AGENT') return req.status === 'PENDING_ASSIGNMENT';
        if (activeTab === 'SURVEYING') return req.status === 'AGENT_ASSIGNED' || req.status === 'SURVEYING';
        if (activeTab === 'VERIFICATION') return req.status === 'PENDING_ONBOARDING' || req.status === 'SUBMITTED';
        if (activeTab === 'ACTIVE') return req.status === 'ACTIVE';
        return true;
    });

    const totalAll = requests.length;
    const totalNeedAgent = requests.filter(r => r.status === 'PENDING_ASSIGNMENT').length;
    const totalSurveying = requests.filter(r => r.status === 'AGENT_ASSIGNED' || r.status === 'SURVEYING').length;
    const totalVerification = requests.filter(r => r.status === 'PENDING_ONBOARDING' || r.status === 'SUBMITTED').length;
    const totalActive = requests.filter(r => r.status === 'ACTIVE').length;

    // Helper for photos array
    const normalizePhotos = (imgUrls: any[]) => {
        if (!imgUrls || !Array.isArray(imgUrls)) return [];
        return imgUrls.map((img: any, idx: number) => {
            if (typeof img === 'string') {
                return { url: img, label: `Foto ${idx + 1}` };
            }
            return {
                url: img?.original || img?.url || '',
                label: img?.label || `Foto ${idx + 1}`
            };
        }).filter(item => Boolean(item.url));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">KostManager Auto-Pilot</h2>
                    <p className="text-gray-500 text-sm mt-1">Kelola permohonan langganan KostManager, verifikasi hasil pendataan survey, dan aktivasi layanan.</p>
                </div>
                {onNavigateToPortal && (
                    <button
                        onClick={onNavigateToPortal}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0"
                    >
                        📊 Buka Portal Operasional KostManager
                    </button>
                )}
            </div>

            {/* Pipeline Tabs Status Filter */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
                {[
                    { key: 'ALL', label: 'Semua Permohonan', count: totalAll, color: 'bg-gray-100 text-gray-800' },
                    { key: 'NEED_AGENT', label: '🔴 Butuh Agen', count: totalNeedAgent, color: 'bg-amber-100 text-amber-800' },
                    { key: 'SURVEYING', label: '⚡ Proses Survey', count: totalSurveying, color: 'bg-blue-100 text-blue-800' },
                    { key: 'VERIFICATION', label: '📥 Butuh Verifikasi / Review', count: totalVerification, color: 'bg-emerald-100 text-emerald-900 font-bold' },
                    { key: 'ACTIVE', label: '🟢 Aktif Autopilot', count: totalActive, color: 'bg-green-100 text-green-800' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        type="button"
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
                            activeTab === tab.key
                                ? 'bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-900/10'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${tab.color}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredRequests.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 font-bold uppercase tracking-wider text-xs">
                            Tidak ada permohonan dalam kategori ini.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRequests.map(req => {
                                const isReadyForReview = req.status === 'PENDING_ONBOARDING' || req.status === 'SUBMITTED';

                                // Extract coordinates from notes or metadata
                                const extractCoords = (text: string) => {
                                    if (!text) return null;
                                    const match = text.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
                                    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
                                    const gmapsUrl = text.match(/https?:\/\/[^\s]+/);
                                    if (gmapsUrl) {
                                        const urlMatch = gmapsUrl[0].match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || gmapsUrl[0].match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
                                        if (urlMatch) return { lat: parseFloat(urlMatch[1]), lng: parseFloat(urlMatch[2]) };
                                    }
                                    return null;
                                };
                                const coords = extractCoords(req.notes) || (req.transaction?.metadata?.latitude && req.transaction?.metadata?.longitude ? { lat: req.transaction.metadata.latitude, lng: req.transaction.metadata.longitude } : null);

                                return (
                                    <div 
                                        key={req.id} 
                                        className={`bg-white rounded-3xl p-6 flex flex-col justify-between transition-all ${
                                            isReadyForReview 
                                                ? 'border-2 border-emerald-300 shadow-md ring-4 ring-emerald-500/10 bg-gradient-to-b from-emerald-50/20 via-white to-white' 
                                                : 'border border-gray-150 shadow-soft hover:shadow-md'
                                        }`}
                                    >
                                        <div>
                                            {/* Profil Mitra Pengaju (Interactive Header) */}
                                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
                                                <div 
                                                    onClick={() => {
                                                        setSelectedMitra(req.user || { name: 'Mitra', phone: req.owner_phone || '-' });
                                                        setIsMitraModalOpen(true);
                                                    }}
                                                    className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-sm uppercase cursor-pointer hover:bg-orange-200 transition-all shadow-sm"
                                                >
                                                    {(req.user?.name || req.user?.email || 'M').charAt(0)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span 
                                                        onClick={() => {
                                                            setSelectedMitra(req.user || { name: 'Mitra', phone: req.owner_phone || '-' });
                                                            setIsMitraModalOpen(true);
                                                        }}
                                                        className="text-xs font-black text-gray-900 uppercase tracking-tight hover:text-orange-600 cursor-pointer block truncate"
                                                    >
                                                        {req.user?.name || 'Mitra Pengaju'}
                                                    </span>
                                                    <a 
                                                        href={`https://wa.me/${(req.user?.phone || req.owner_phone || '').replace(/[^0-9]/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-gray-500 font-bold block hover:text-orange-500 transition-colors"
                                                    >
                                                        📞 {req.user?.phone || req.owner_phone || '-'}
                                                    </a>
                                                </div>
                                                <span className={`ml-auto px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-xs ${getStatusBadge(req.status)}`}>
                                                    {getStatusLabel(req.status)}
                                                </span>
                                            </div>

                                            {/* Detail Properti */}
                                            <div className="space-y-2.5">
                                                <h3 className="text-base font-black text-gray-900 uppercase tracking-tight leading-tight">{req.kost_name}</h3>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">{req.kost_type || 'Campur'}</span>
                                                    <span>•</span>
                                                    <span>Kamar: {req.transaction?.metadata?.totalRooms || req.transaction?.metadata?.total_rooms || '-'} Total / {req.empty_rooms || 0} Kosong</span>
                                                </p>
                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{req.kost_address}</p>

                                                {/* Maps Mini Iframe Embed */}
                                                {coords && (
                                                    <div className="w-full h-28 rounded-2xl overflow-hidden border border-gray-150 relative mt-2 shadow-inner">
                                                        <iframe
                                                            title={`map-${req.id}`}
                                                            width="100%"
                                                            height="100%"
                                                            frameBorder="0"
                                                            marginHeight={0}
                                                            marginWidth={0}
                                                            src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=14&output=embed`}
                                                            className="absolute inset-0"
                                                        />
                                                    </div>
                                                )}

                                                {req.notes && (
                                                    <div className="text-[9px] bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-slate-500 font-bold leading-normal normal-case mt-2">
                                                        📝 Catatan: {req.notes.replace(/https?:\/\/[^\s]+/, '').trim() || 'Ada koordinat GPS'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 shrink-0">
                                            {/* Highlight Action Banner for PENDING_ONBOARDING / SUBMITTED */}
                                            {isReadyForReview && (
                                                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex flex-col gap-2.5 shadow-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-2 w-2 relative">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                                                        </span>
                                                        <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wider">Hasil Survey Siap Ditinjau</span>
                                                    </div>
                                                    <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">
                                                        Data properti, kamar, dan foto hasil survey telah dikirim oleh surveyor lapangan.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => openReviewModal(req)}
                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-base">fact_check</span>
                                                        Tinjau Hasil Pendataan Lengkap
                                                    </button>
                                                </div>
                                            )}

                                            {/* Button for ACTIVE properties to view details */}
                                            {req.status === 'ACTIVE' && (
                                                <button
                                                    type="button"
                                                    onClick={() => openReviewModal(req)}
                                                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-base">visibility</span>
                                                    Lihat Detail Listing &amp; Data
                                                </button>
                                            )}

                                            {/* Agent Assignment Info / Dropdown Inline */}
                                            {req.status === 'PENDING_ASSIGNMENT' ? (
                                                <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-2xl space-y-2">
                                                    <label className="text-[9px] font-black text-orange-700 uppercase tracking-widest block">Tugaskan Agen Survey</label>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={assignAgentMap[req.id] || ''}
                                                            onChange={e => setAssignAgentMap({ ...assignAgentMap, [req.id]: e.target.value })}
                                                            className="flex-1 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                                                        >
                                                            <option value="">-- Pilih Agen --</option>
                                                            {agents.map(agent => (
                                                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAssignAgentInline(req.id, assignAgentMap[req.id])}
                                                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shrink-0"
                                                        >
                                                            Tugaskan
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : req.agent_name ? (
                                                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex justify-between items-center text-xs font-bold">
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Agen Survey Lapangan</span>
                                                        <span className="font-bold text-slate-800">{req.agent_name}</span>
                                                    </div>
                                                    {req.result_drive_link && (
                                                        <a
                                                            href={req.result_drive_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1"
                                                        >
                                                            📂 GDrive
                                                        </a>
                                                    )}
                                                </div>
                                            ) : null}

                                            {/* Transaksi & Action Buttons */}
                                            <div className="flex justify-between items-center pt-2">
                                                <div>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Total Bayar</span>
                                                    <span className="font-black text-gray-900 text-sm">{FORMAT_CURRENCY(req.transaction?.amount || 150000)}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingRequest(req);
                                                            setEditForm({
                                                                assigned_agent_id: req.assigned_agent_id || '',
                                                                result_drive_link: req.result_drive_link || ''
                                                            });
                                                        }}
                                                        className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                                                    >
                                                        Kelola
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(req.id, req.kost_name)}
                                                        className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ======================================================== */}
            {/* COMPREHENSIVE KOSTMANAGER REVIEW & INSPECTION MODAL */}
            {/* ======================================================== */}
            {reviewModalOpen && reviewRequest && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
                    <div className="absolute inset-0" onClick={() => setReviewModalOpen(false)}></div>
                    <div 
                        className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 border border-slate-100"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 pb-4 border-b border-gray-100 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-xs ${getStatusBadge(reviewRequest.status)}`}>
                                        {getStatusLabel(reviewRequest.status)}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                                        {reviewProperty?.type || reviewRequest.kost_type || 'Campur'}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                                        ID: #{reviewRequest.id.substring(0, 8)}
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight truncate">
                                    {reviewProperty?.title || reviewRequest.kost_name}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                                    📍 {reviewProperty?.address || reviewRequest.kost_address}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalOpen(false)}
                                    className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-gray-500 flex items-center justify-center border border-gray-200 transition-all font-bold text-lg shadow-xs"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Top Info Strip: Owner & Agent Details */}
                        <div className="bg-slate-100/70 px-6 py-3 border-b border-gray-200/70 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-xs">
                                    {(reviewRequest.user?.name || 'M').charAt(0)}
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pemilik / Mitra Kost</span>
                                    <span className="font-black text-slate-800">{reviewRequest.user?.name || reviewRequest.owner_name || 'Mitra Pemesan'}</span>
                                </div>
                                <a
                                    href={`https://wa.me/${(reviewRequest.user?.phone || reviewRequest.owner_phone || '').replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-xs"
                                >
                                    <span>WhatsApp</span>
                                </a>
                            </div>

                            <div className="flex items-center gap-3">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Surveyor Lapangan</span>
                                    <span className="font-black text-slate-800">{reviewRequest.agent_name || 'Agen RuangSinggah'}</span>
                                </div>
                                {(reviewSurvey?.result_drive_link || reviewRequest.result_drive_link) && (
                                    <a
                                        href={reviewSurvey?.result_drive_link || reviewRequest.result_drive_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-sm">cloud_download</span>
                                        Folder GDrive
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Interactive Navigation Tabs */}
                        <div className="flex border-b border-gray-100 bg-white px-6 gap-2 overflow-x-auto shrink-0">
                            {[
                                { key: 'info', label: '🏢 Info & Lokasi GPS', badge: null },
                                { key: 'photos', label: '📸 Galeri Foto Berkategori', badge: normalizePhotos(reviewProperty?.image_urls).length },
                                { key: 'rooms', label: '🛏️ Tipe Kamar & Fasilitas', badge: (reviewProperty?.room_types || []).length },
                                { key: 'legal', label: '✍️ Legalitas & Tanda Tangan', badge: reviewSurvey?.signature_data ? '✓' : null }
                            ].map(t => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setReviewActiveTab(t.key as any)}
                                    className={`py-3.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                                        reviewActiveTab === t.key
                                            ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                                            : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <span>{t.label}</span>
                                    {t.badge !== null && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                                            reviewActiveTab === t.key ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                            {t.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Modal Body / Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {loadingReview ? (
                                <div className="py-24 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                                    <p className="text-xs font-bold text-gray-400 mt-3 uppercase tracking-wider">Memuat Seluruh Berkas Pendataan...</p>
                                </div>
                            ) : (
                                <>
                                    {/* ================= TAB 1: INFO & LOKASI ================= */}
                                    {reviewActiveTab === 'info' && (
                                        <div className="space-y-6 animate-in fade-in duration-300">
                                            {/* Deskripsi Properti */}
                                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Deskripsi &amp; Profil Kost</span>
                                                <p className="text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                                                    {reviewProperty?.description || 'Tidak ada deskripsi rinci dari agen.'}
                                                </p>
                                            </div>

                                            {/* Lokasi & Peta GPS */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Alamat &amp; Titik Koordinat</span>
                                                        <p className="text-xs text-slate-800 font-bold leading-relaxed">
                                                            {reviewProperty?.address || reviewRequest.kost_address}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 text-xs">
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Kota / Wilayah</span>
                                                                <span className="font-bold text-slate-800">{reviewProperty?.city || reviewProperty?.area || 'Makassar'}</span>
                                                            </div>
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Latitude</span>
                                                                <span className="font-mono font-bold text-slate-800">
                                                                    {reviewProperty?.location?.lat || reviewProperty?.latitude || '-'}
                                                                </span>
                                                            </div>
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Longitude</span>
                                                                <span className="font-mono font-bold text-slate-800">
                                                                    {reviewProperty?.location?.lng || reviewProperty?.longitude || '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Landmark Kampus / Titik Terdekat */}
                                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Kampus / Tempat Terdekat</span>
                                                        {reviewProperty?.campuses && reviewProperty.campuses.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {reviewProperty.campuses.map((c: any, i: number) => {
                                                                    const cName = typeof c === 'string' ? c : (c?.name || '-');
                                                                    const cDist = typeof c === 'object' && c?.distance ? c.distance : null;
                                                                    return (
                                                                        <span key={i} className="px-3 py-1.5 rounded-xl bg-orange-100/80 text-orange-900 border border-orange-200 font-black text-xs flex items-center gap-1.5 shadow-2xs">
                                                                            <span>🏫 {cName}</span>
                                                                            {cDist && <span className="text-[10px] bg-white px-1.5 py-0.2 rounded font-bold text-orange-700">{cDist}</span>}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-slate-400 font-medium">Tidak ada data kampus terdekat terlampir.</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Peta Mini Preview */}
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Preview Google Maps</span>
                                                    {(() => {
                                                        const lat = reviewProperty?.location?.lat || reviewProperty?.latitude || -5.147665;
                                                        const lng = reviewProperty?.location?.lng || reviewProperty?.longitude || 119.432731;
                                                        return (
                                                            <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
                                                                <iframe
                                                                    title="review-map"
                                                                    width="100%"
                                                                    height="100%"
                                                                    frameBorder="0"
                                                                    src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                                                                    className="absolute inset-0"
                                                                />
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Fasilitas & Peraturan Kost */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fasilitas Umum Kost</span>
                                                    {reviewProperty?.facilities && reviewProperty.facilities.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {reviewProperty.facilities.map((f: string, i: number) => (
                                                                <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                                                                    ✨ {f}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400">Tidak ada fasilitas umum terdata.</p>
                                                    )}
                                                </div>

                                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Peraturan &amp; Ketentuan Kost</span>
                                                    {reviewProperty?.rules && reviewProperty.rules.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {reviewProperty.rules.map((r: string, i: number) => (
                                                                <span key={i} className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-100 text-xs font-bold text-red-700 shadow-2xs">
                                                                    ⛔ {r}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400">Tidak ada peraturan khusus terdata.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ================= TAB 2: GALERI FOTO BERKATEGORI ================= */}
                                    {reviewActiveTab === 'photos' && (
                                        <div className="space-y-6 animate-in fade-in duration-300">
                                            {(() => {
                                                const allPhotos = normalizePhotos(reviewProperty?.image_urls);
                                                const categories = Array.from(new Set(allPhotos.map(p => p.label)));
                                                const filteredPhotos = photoCategoryFilter === 'ALL' 
                                                    ? allPhotos 
                                                    : allPhotos.filter(p => p.label === photoCategoryFilter);

                                                return (
                                                    <>
                                                        {/* Category Filter Pills */}
                                                        <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => setPhotoCategoryFilter('ALL')}
                                                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                                                    photoCategoryFilter === 'ALL'
                                                                        ? 'bg-gray-900 text-white shadow-sm'
                                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                }`}
                                                            >
                                                                Semua Kategori ({allPhotos.length})
                                                            </button>
                                                            {categories.map((cat, idx) => {
                                                                const count = allPhotos.filter(p => p.label === cat).length;
                                                                return (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        onClick={() => setPhotoCategoryFilter(cat)}
                                                                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                                                            photoCategoryFilter === cat
                                                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                        }`}
                                                                    >
                                                                        {cat} ({count})
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Photos Grid */}
                                                        {filteredPhotos.length === 0 ? (
                                                            <div className="py-16 text-center text-slate-400 font-bold uppercase text-xs">
                                                                Tidak ada foto dalam kategori ini.
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                                {filteredPhotos.map((photo, i) => (
                                                                    <div 
                                                                        key={i}
                                                                        onClick={() => setLightboxPhoto(photo)}
                                                                        className="group relative aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-xs hover:shadow-md transition-all hover:scale-[1.02]"
                                                                    >
                                                                        <img 
                                                                            src={photo.url} 
                                                                            alt={photo.label} 
                                                                            className="w-full h-full object-cover" 
                                                                        />
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                                                                            <span className="text-[10px] font-black text-white uppercase tracking-wider drop-shadow-sm">
                                                                                {photo.label}
                                                                            </span>
                                                                        </div>
                                                                        <span className="absolute top-2 right-2 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <span className="material-symbols-outlined text-sm">zoom_in</span>
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {/* ================= TAB 3: TIPE KAMAR & FASILITAS ================= */}
                                    {reviewActiveTab === 'rooms' && (
                                        <div className="space-y-4 animate-in fade-in duration-300">
                                            {reviewProperty?.room_types && reviewProperty.room_types.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {reviewProperty.room_types.map((room: any, i: number) => {
                                                        const DEFAULT_ROOM_PHOTO_SLOTS = [
                                                            'Interior Kamar',
                                                            'Kamar Mandi Dalam',
                                                            'Tempat Tidur',
                                                            'Lemari / Penyimpanan'
                                                        ];

                                                        const rawImages = room.images || room.image_urls || room.photos || [];
                                                        const roomPhotos: { url: string; label: string }[] = [];

                                                        rawImages.forEach((img: any, imgIdx: number) => {
                                                            if (!img) return;
                                                            const url = typeof img === 'string' ? img : (img?.url || img?.original || '');
                                                            if (!url) return;

                                                            let label = '';
                                                            if (room.photoCategories && room.photoCategories[imgIdx]) {
                                                                label = room.photoCategories[imgIdx];
                                                            } else if (typeof img === 'object' && img?.label) {
                                                                label = img.label;
                                                            } else if (imgIdx < DEFAULT_ROOM_PHOTO_SLOTS.length) {
                                                                label = DEFAULT_ROOM_PHOTO_SLOTS[imgIdx];
                                                            } else {
                                                                label = `Foto Tambahan ${imgIdx - DEFAULT_ROOM_PHOTO_SLOTS.length + 1}`;
                                                            }

                                                            label = label.replace(/\s*\*Wajib/i, '').replace(/\(Opsional\)/i, '').trim();
                                                            roomPhotos.push({ url, label });
                                                        });

                                                        return (
                                                            <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs hover:shadow-xs transition-shadow">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tipe Kamar #{i + 1}</span>
                                                                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">{room.name}</h4>
                                                                        <p className="text-xs text-slate-500 font-bold">Ukuran: {room.size || '3x4 meter'}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-sm font-black text-emerald-700">{FORMAT_CURRENCY(room.price)}</span>
                                                                        <span className="text-[10px] text-slate-400 block font-bold">/ bulan</span>
                                                                    </div>
                                                                </div>

                                                                {/* Ketersediaan Kamar */}
                                                                <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs font-bold">
                                                                    <span className="text-slate-600">Total Kamar: <strong className="text-slate-900">{room.totalRooms || 1}</strong></span>
                                                                    <span className="text-emerald-700">Kamar Kosong: <strong>{room.availableRooms || 1}</strong></span>
                                                                </div>

                                                                {/* Fasilitas Kamar */}
                                                                {room.roomFacilities && room.roomFacilities.length > 0 && (
                                                                    <div>
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fasilitas Kamar</span>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {room.roomFacilities.map((f: string, idx: number) => (
                                                                                <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700">
                                                                                    🛏️ {f}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Fasilitas Kamar Mandi */}
                                                                {room.bathroomFacilities && room.bathroomFacilities.length > 0 && (
                                                                    <div>
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fasilitas Kamar Mandi</span>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {room.bathroomFacilities.map((f: string, idx: number) => (
                                                                                <span key={idx} className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-[10px] font-bold text-blue-800">
                                                                                    🚿 {f}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Dokumentasi Foto Kamar */}
                                                                <div className="pt-1 border-t border-slate-200/60">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                                                            📸 Dokumentasi Foto Kamar ({roomPhotos.length})
                                                                        </span>
                                                                    </div>
                                                                    {roomPhotos.length > 0 ? (
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                            {roomPhotos.map((photo: any, pIdx: number) => (
                                                                                <div 
                                                                                    key={pIdx}
                                                                                    onClick={() => setLightboxPhoto(photo)}
                                                                                    className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
                                                                                >
                                                                                    <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-2 opacity-90 group-hover:opacity-100 transition-opacity">
                                                                                        <span className="text-[8px] font-black text-white uppercase tracking-wider drop-shadow-sm truncate">
                                                                                            {photo.label}
                                                                                        </span>
                                                                                    </div>
                                                                                    <span className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        <span className="material-symbols-outlined text-xs">zoom_in</span>
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="bg-white p-3 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-[10px] font-bold">
                                                                            Foto spesifik tipe kamar ini belum diunggah.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="py-16 text-center text-slate-400 font-bold uppercase text-xs">
                                                    Tidak ada data tipe kamar terdata.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ================= TAB 4: LEGALITAS & TANDA TANGAN ================= */}
                                    {reviewActiveTab === 'legal' && (
                                        <div className="space-y-6 animate-in fade-in duration-300">
                                            {/* Salinan Lengkap Syarat & Ketentuan Penggunaan KostManager */}
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dokumen Perjanjian Kemitraan</span>
                                                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                                            Salinan Syarat &amp; Ketentuan Penggunaan KostManager (Auto-Pilot)
                                                        </h4>
                                                    </div>
                                                    <span className="self-start sm:self-auto px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                                                        <span className="material-symbols-outlined text-sm text-emerald-700">verified</span>
                                                        Disetujui Mitra Secara Digital
                                                    </span>
                                                </div>

                                                {/* Text Klausul Perjanjian */}
                                                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-3.5 leading-relaxed max-h-72 overflow-y-auto font-medium shadow-inner">
                                                    <p className="font-bold text-slate-900 text-xs pb-1 border-b border-slate-100">
                                                        Perjanjian Pengelolaan Properti Kos &amp; Layanan Manajemen KostManager RuangSinggah:
                                                    </p>
                                                    
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-900 text-xs">1. Mekanisme &amp; Otorisasi Pengelolaan Auto-Pilot</p>
                                                        <p className="text-[11px] text-slate-600">
                                                            Mitra Pemilik Kos memberikan hak dan wewenang eksklusif kepada platform RuangSinggah untuk mengelola pencatatan reservasi, publikasi listing properti, penerimaan calon penghuni, serta penagihan otomatis biaya sewa bulanan kamar sesuai data yang diverifikasi.
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-900 text-xs">2. Akurasi &amp; Validitas Data Lapangan</p>
                                                        <p className="text-[11px] text-slate-600">
                                                            Mitra bertanggung jawab penuh atas kebenaran seluruh informasi properti, tarif sewa kamar, spesifikasi fasilitas, serta ketersediaan unit kamar yang didata bersama agen surveyor lapangan RuangSinggah.
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-900 text-xs">3. Penyaluran Hasil Sewa &amp; Transparansi Keuangan</p>
                                                        <p className="text-[11px] text-slate-600">
                                                            Seluruh transaksi pembayaran sewa penghuni diproses melalui rekening penampung resmi platform dan disalurkan secara transparan dan berkala ke rekening terdaftar Mitra dengan laporan keuangan real-time pada portal KostManager.
                                                        </p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-900 text-xs">4. Legalitas Kepemilikan &amp; Hak Pengelolaan</p>
                                                        <p className="text-[11px] text-slate-600">
                                                            Mitra menyatakan dan menjamin bahwa properti yang didaftarkan berstatus sah secara hukum, tidak dalam sengketa, dan memiliki izin operasional pemondokan / rumah kos sesuai perundang-undangan yang berlaku.
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Klausul Persetujuan Box */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">✓</span>
                                                        <span className="text-[11px] font-bold text-slate-800 leading-tight">Persetujuan Program Auto-Pilot</span>
                                                    </div>
                                                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">✓</span>
                                                        <span className="text-[11px] font-bold text-slate-800 leading-tight">Kebenaran Hak Kelola Properti</span>
                                                    </div>
                                                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">✓</span>
                                                        <span className="text-[11px] font-bold text-slate-800 leading-tight">Otorisasi Pemasaran RuangSinggah</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tanda Tangan Digital & Verifikasi Surveyor */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Canvas Tanda Tangan Mitra */}
                                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-3.5 shadow-2xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                            Tanda Tangan Digital Pemilik / Mitra
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-500">
                                                            Mitra: <strong className="text-slate-900">{reviewRequest.user?.name || reviewRequest.owner_name || 'Mitra Kost'}</strong>
                                                        </span>
                                                    </div>

                                                    {reviewSurvey?.signature_data ? (
                                                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center justify-center min-h-[170px] relative group">
                                                            <img 
                                                                src={reviewSurvey.signature_data} 
                                                                alt="Tanda Tangan Digital Pemilik" 
                                                                className="max-h-36 max-w-full object-contain"
                                                            />
                                                            <div className="absolute bottom-2 right-3 text-[9px] font-mono text-slate-400">
                                                                Digital Signature Verified
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center min-h-[170px] gap-2">
                                                            <span className="material-symbols-outlined text-3xl text-slate-300">draw</span>
                                                            <span>Tanda tangan digital belum terlampir saat pendataan.</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 text-[10px] text-emerald-900 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                                                        <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
                                                        <span>Terverifikasi dan disahkan secara digital pada saat pendataan lapangan</span>
                                                    </div>
                                                </div>

                                                {/* Informasi Pengesahan & Surveyor */}
                                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-2xs flex flex-col justify-between">
                                                    <div className="space-y-3">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                            Metadata Pengesahan &amp; Surveyor
                                                        </span>
                                                        
                                                        <div className="space-y-2.5 text-xs font-bold text-slate-700">
                                                            <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase">Petugas Survey Lapangan</span>
                                                                <span className="text-slate-900 font-black">{reviewRequest.agent_name || 'Agen RuangSinggah'}</span>
                                                            </div>
                                                            <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase">Waktu Pengajuan / Survey</span>
                                                                <span className="text-slate-900 font-bold">{new Date(reviewRequest.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</span>
                                                            </div>
                                                            <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase">Status Kelayakan Data</span>
                                                                <span className="text-emerald-700 font-black flex items-center gap-1">
                                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                                    LENGKAP &amp; SIAP ONBOARDING
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {(reviewSurvey?.result_drive_link || reviewRequest.result_drive_link) && (
                                                        <a
                                                            href={reviewSurvey?.result_drive_link || reviewRequest.result_drive_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                        >
                                                            <span className="material-symbols-outlined text-base">folder_open</span>
                                                            Buka Dokumen &amp; Berkas di Google Drive
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="p-4 sm:p-6 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalOpen(false)}
                                    className="px-5 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-wider hover:bg-gray-100 transition-colors w-full sm:w-auto"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReviewModalOpen(false);
                                        setEditingRequest(reviewRequest);
                                        setEditForm({
                                            assigned_agent_id: reviewRequest.assigned_agent_id || '',
                                            result_drive_link: reviewRequest.result_drive_link || ''
                                        });
                                    }}
                                    className="px-4 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 w-full sm:w-auto justify-center"
                                >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                    Edit Penugasan / Link
                                </button>
                            </div>

                            {reviewRequest.status !== 'ACTIVE' ? (
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => handleApproveAndActivate(reviewRequest, reviewProperty)}
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-base">rocket_launch</span>
                                    {isSubmitting ? 'Mengaktifkan...' : 'Setujui & Aktifkan Layanan Auto-Pilot (LIVE)'}
                                </button>
                            ) : (
                                <div className="px-4 py-2 bg-green-100 border border-green-200 text-green-900 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    Layanan Sedang Aktif di Platform
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX FULLSCREEN PHOTO VIEWER */}
            {lightboxPhoto && (
                <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setLightboxPhoto(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img 
                            src={lightboxPhoto.url} 
                            alt={lightboxPhoto.label} 
                            className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10" 
                        />
                        <div className="mt-3 flex items-center justify-between w-full text-white px-2">
                            <span className="text-sm font-black uppercase tracking-wider">{lightboxPhoto.label}</span>
                            <button
                                type="button"
                                onClick={() => setLightboxPhoto(null)}
                                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-black uppercase tracking-wider transition-colors"
                            >
                                Tutup ✕
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MITRA DETAIL POPUP MODAL */}
            {isMitraModalOpen && selectedMitra && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="absolute inset-0" onClick={() => setIsMitraModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Detail Profil Mitra</h3>
                            <button onClick={() => setIsMitraModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                        </div>
                        <div className="space-y-4 text-sm font-bold text-gray-600">
                            <div>
                                <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">Nama Mitra</span>
                                <span className="text-gray-900 font-black text-base">{selectedMitra.name || selectedMitra.full_name || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">No. WhatsApp</span>
                                <a 
                                    href={`https://wa.me/${(selectedMitra.phone || '').replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-600 font-black text-base hover:underline block"
                                >
                                    {selectedMitra.phone || '-'}
                                </a>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">Alamat Email</span>
                                <span className="text-gray-900 block font-bold">{selectedMitra.email || '-'}</span>
                            </div>
                            {selectedMitra.business_name && (
                                <div>
                                    <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">Nama Bisnis / Instansi</span>
                                    <span className="text-gray-900 block font-bold">{selectedMitra.business_name}</span>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMitraModalOpen(false)}
                            className="mt-6 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* EDIT ASSIGNMENT MODAL */}
            {editingRequest && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="absolute inset-0" onClick={() => setEditingRequest(null)}></div>
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Kelola KostManager</h3>
                            <button onClick={() => setEditingRequest(null)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200 transition-colors text-lg font-bold">&times;</button>
                        </div>

                        {/* Detail Informasi Pendaftaran (Read-only) */}
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-xs font-bold uppercase text-slate-500 mb-6 space-y-4 shrink-0">
                            <h4 className="text-[10px] font-black text-slate-400 tracking-wider">Detail Pendaftaran Pengaju</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left normal-case">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">Nama Mitra</span>
                                    <span className="text-slate-800 font-black text-orange-600">{editingRequest.user?.name || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">No. Telepon Mitra</span>
                                    <span className="text-slate-800 font-bold">{editingRequest.user?.phone || editingRequest.owner_phone || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">Nama Properti</span>
                                    <span className="text-slate-800 font-black">{editingRequest.kost_name}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">Tipe Kost</span>
                                    <span className="text-slate-800 font-bold">{editingRequest.kost_type || '-'} ({editingRequest.empty_rooms || 0} Kamar Kosong)</span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">Alamat Kost</span>
                                    <span className="text-slate-800 font-medium leading-relaxed">{editingRequest.kost_address}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">Metode Pembayaran</span>
                                    <span className="text-slate-800 font-bold">{editingRequest.transaction?.payment_method || 'TRANSFER (MIDTRANS)'}</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateStatusAndAgent} className="space-y-6 flex-1">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Tugaskan Agen Survey</label>
                                <select
                                    value={editForm.assigned_agent_id}
                                    onChange={e => setEditForm({ ...editForm, assigned_agent_id: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                                >
                                    <option value="">-- Pilih Agen --</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>{agent.name} ({agent.phone})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Link Folder Google Drive Hasil Konten</label>
                                    {!editForm.result_drive_link && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setIsSubmitting(true);
                                                try {
                                                    const link = await generateManualDriveFolder(editingRequest.id);
                                                    setEditForm({ ...editForm, result_drive_link: link });
                                                    alert('Folder Google Drive berhasil dibuat!');
                                                } catch (err) {
                                                    alert('Gagal membuat folder: ' + (err as Error).message);
                                                } finally {
                                                    setIsSubmitting(false);
                                                }
                                            }}
                                            className="text-[9px] font-black text-orange-600 uppercase tracking-wider hover:underline"
                                        >
                                            ⚙️ Buat Folder Otomatis
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={editForm.result_drive_link}
                                    onChange={e => setEditForm({ ...editForm, result_drive_link: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all mt-6 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Penugasan & Link'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KostManagerManagement;
