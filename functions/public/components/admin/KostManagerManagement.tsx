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
                // If agent is newly assigned, keep status as PENDING_ASSIGNMENT so agent can accept it in their dashboard first
                if (computedStatus === 'PENDING_ASSIGNMENT') {
                    computedStatus = 'PENDING_ASSIGNMENT';
                }
                // If drive link is filled
                if (editForm.result_drive_link) {
                    computedStatus = 'PENDING_ONBOARDING';
                } else if (computedStatus === 'PENDING_ONBOARDING') {
                    // Revert to AGENT_ASSIGNED if drive link is cleared
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
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'AGENT_ASSIGNED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'SURVEYING':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'PENDING_ONBOARDING':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'ACTIVE':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING_ASSIGNMENT': return 'Menunggu Agen';
            case 'AGENT_ASSIGNED': return 'Agen Ditugaskan';
            case 'SURVEYING': return 'Sedang Disurvey';
            case 'PENDING_ONBOARDING': return 'Menunggu Onboarding';
            case 'ACTIVE': return 'Aktif (Auto-Pilot)';
            default: return status;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">KostManager Auto-Pilot</h2>
                    <p className="text-gray-500 text-sm mt-1">Kelola permohonan langganan KostManager dan penugasan agen survey lapangan.</p>
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

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-gray-50/50 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Info Kost</th>
                                    <th className="px-6 py-4">Pemilik (User)</th>
                                    <th className="px-6 py-4">Status & Agen</th>
                                    <th className="px-6 py-4">Transaksi</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {requests.map(req => (
                                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 uppercase">{req.kost_name}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{req.kost_type} • {req.empty_rooms} Kamar Kosong</div>
                                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{req.kost_address}</div>
                                            {req.notes && (
                                                <div className="text-[10px] text-slate-500 font-bold mt-1 normal-case truncate max-w-xs" title={req.notes}>
                                                    📝 Catatan: {req.notes.replace(/https?:\/\/[^\s]+/, '').trim() || 'Ada koordinat GPS'}
                                                </div>
                                            )}
                                            {(() => {
                                                const extractUrl = (text: string) => {
                                                    if (!text) return null;
                                                    const match = text.match(/https?:\/\/[^\s]+/);
                                                    return match ? match[0] : null;
                                                };
                                                const mapsUrl = extractUrl(req.notes) || req.transaction?.metadata?.googleMapsLink;
                                                if (mapsUrl) {
                                                    return (
                                                        <a 
                                                            href={mapsUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="inline-flex items-center gap-1 text-[10px] text-orange-600 hover:text-orange-700 font-bold uppercase tracking-wider mt-1.5 border border-orange-200 bg-orange-50 px-2 py-0.5 rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                        >
                                                            📍 Lacak Rute GPS
                                                        </a>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-800">{req.user?.name || 'User'}</div>
                                            <div className="text-xs text-gray-400">{req.user?.phone || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border rounded-full ${getStatusBadge(req.status)}`}>
                                                {getStatusLabel(req.status)}
                                            </span>
                                            {req.agent_name && (
                                                <div className="text-xs text-gray-600 mt-1 font-bold">
                                                    Agent: {req.agent_name} ({req.agent_phone})
                                                </div>
                                            )}
                                            {req.result_drive_link && (
                                                <a href={req.result_drive_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block mt-1">
                                                    📂 Google Drive
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{FORMAT_CURRENCY(req.transaction?.amount || 100000)}</div>
                                            <div className="text-xs text-green-600 font-bold uppercase tracking-wider">{req.transaction?.status || 'PAID'}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                {req.transaction?.created_at ? new Date(req.transaction.created_at).toLocaleDateString('id-ID') : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingRequest(req);
                                                        setEditForm({
                                                            status: req.status,
                                                            assigned_agent_id: req.assigned_agent_id || '',
                                                            result_drive_link: req.result_drive_link || ''
                                                        });
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors"
                                                >
                                                    Kelola
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(req.id, req.kost_name)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-wider text-xs">
                                            Tidak ada langganan KostManager terdaftar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
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
                            {editingRequest.status === 'PENDING_ONBOARDING' && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 flex flex-col gap-3 shrink-0">
                                    <div className="flex gap-2">
                                        <span className="text-lg">⚡</span>
                                        <div className="min-w-0">
                                            <p className="text-xs text-emerald-900 font-black uppercase tracking-wider">Siap Diaktifkan</p>
                                            <p className="text-[10px] text-emerald-700 font-bold mt-0.5 normal-case leading-normal">
                                                Agen survey lapangan telah mengunggah berkas foto & detail properti ke Google Drive. Layanan Autopilot siap diluncurkan!
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={async () => {
                                            if (!window.confirm("Apakah Anda yakin ingin mengaktifkan layanan Auto-Pilot untuk properti ini? Status akan berubah menjadi AKTIF.")) return;
                                            setIsSubmitting(true);
                                            try {
                                                await updateKostManagerRequest(editingRequest.id, { status: 'ACTIVE' });
                                                alert('Layanan KostManager berhasil diaktifkan sepenuhnya (ACTIVE)!');
                                                setEditingRequest(null);
                                                loadData();
                                                refreshData();
                                            } catch (err) {
                                                console.error(err);
                                                alert('Gagal mengaktifkan layanan.');
                                            } finally {
                                                setIsSubmitting(false);
                                            }
                                        }}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Mengaktifkan...' : 'Aktifkan Layanan Auto-Pilot'}
                                    </button>
                                </div>
                            )}

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
