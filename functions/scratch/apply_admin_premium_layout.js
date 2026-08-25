const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/components/admin/KostManagerManagement.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Inject state variables after setEditingRequest/editForm states
const stateSearch = '    const [editForm, setEditForm] = useState<any>({});';
const stateReplacement = `    const [editForm, setEditForm] = useState<any>({});
    const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<any>(null);
    const [loadingProperty, setLoadingProperty] = useState(false);
    const [showReviewAccordion, setShowReviewAccordion] = useState(false);
    const [activeTab, setActiveTab] = useState<'ALL' | 'NEED_AGENT' | 'SURVEYING' | 'VERIFICATION' | 'ACTIVE'>('ALL');
    const [selectedMitra, setSelectedMitra] = useState<any | null>(null);
    const [isMitraModalOpen, setIsMitraModalOpen] = useState(false);
    const [assignAgentMap, setAssignAgentMap] = useState<{ [reqId: string]: string }>({});`;

if (content.includes(stateSearch)) {
    content = content.replace(stateSearch, stateReplacement);
    console.log("State variables injected successfully.");
} else {
    console.error("ERROR: State search pattern not found!");
    process.exit(1);
}

// 2. Inject helper function & pipeline count logic before the return statement
const returnSearch = '    return (';
const helperReplacement = `    const handleAssignAgentInline = async (reqId: string, agentId: string) => {
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
        if (activeTab === 'VERIFICATION') return req.status === 'PENDING_ONBOARDING';
        if (activeTab === 'ACTIVE') return req.status === 'ACTIVE';
        return true;
    });

    const totalAll = requests.length;
    const totalNeedAgent = requests.filter(r => r.status === 'PENDING_ASSIGNMENT').length;
    const totalSurveying = requests.filter(r => r.status === 'AGENT_ASSIGNED' || r.status === 'SURVEYING').length;
    const totalVerification = requests.filter(r => r.status === 'PENDING_ONBOARDING').length;
    const totalActive = requests.filter(r => r.status === 'ACTIVE').length;

    return (`;

if (content.includes(returnSearch)) {
    content = content.replace(returnSearch, helperReplacement);
    console.log("Inline assignment helper and filter counters injected successfully.");
} else {
    console.error("ERROR: Return statement search pattern not found!");
    process.exit(1);
}

// 3. Replace the entire render block starting from return ( down to export default KostManagerManagement;
const startIdx = content.indexOf('    return (');
const endIdx = content.lastIndexOf('export default KostManagerManagement;');

if (startIdx !== -1 && endIdx !== -1) {
    const originalPre = content.substring(0, startIdx);
    const replacementRender = `    return (
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

            {/* Pipeline Tabs Status Filter */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
                {[
                    { key: 'ALL', label: 'Semua Permohonan', count: totalAll, color: 'bg-gray-100 text-gray-800' },
                    { key: 'NEED_AGENT', label: '🔴 Butuh Agen', count: totalNeedAgent, color: 'bg-amber-100 text-amber-800' },
                    { key: 'SURVEYING', label: '⚡ Proses Survey', count: totalSurveying, color: 'bg-blue-100 text-blue-800' },
                    { key: 'VERIFICATION', label: '📥 Butuh Verifikasi', count: totalVerification, color: 'bg-indigo-100 text-indigo-800' },
                    { key: 'ACTIVE', label: '🟢 Aktif Autopilot', count: totalActive, color: 'bg-green-100 text-green-800' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        type="button"
                        className={\`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border \${
                            activeTab === tab.key
                                ? 'bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-900/10'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }\`}
                    >
                        <span>{tab.label}</span>
                        <span className={\`px-1.5 py-0.5 rounded-full text-[9px] font-black \${tab.color}\`}>
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
                                // Extract coordinates from notes or metadata
                                const extractCoords = (text: string) => {
                                    if (!text) return null;
                                    const match = text.match(/(-?\\d+\\.\\d+),\\s*(-?\\d+\\.\\d+)/);
                                    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
                                    const gmapsUrl = text.match(/https?:\\/\\/[^\\s]+/);
                                    if (gmapsUrl) {
                                        // Simple regex for lat/lng in URL
                                        const urlMatch = gmapsUrl[0].match(/@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/) || gmapsUrl[0].match(/q=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/);
                                        if (urlMatch) return { lat: parseFloat(urlMatch[1]), lng: parseFloat(urlMatch[2]) };
                                    }
                                    return null;
                                };
                                const coords = extractCoords(req.notes) || (req.transaction?.metadata?.latitude && req.transaction?.metadata?.longitude ? { lat: req.transaction.metadata.latitude, lng: req.transaction.metadata.longitude } : null);

                                return (
                                    <div key={req.id} className="bg-white rounded-3xl border border-gray-150 p-6 flex flex-col justify-between shadow-soft hover:shadow-md transition-all">
                                        <div>
                                            {/* Profil Mitra Pengaju (Interactive Header) */}
                                            <div className="flex items-center gap-3 pb-4 border-b border-gray-50 mb-4">
                                                <div 
                                                    onClick={() => {
                                                        setSelectedMitra(req.user || { name: 'Mitra', phone: req.owner_phone || '-' });
                                                        setIsMitraModalOpen(true);
                                                    }}
                                                    className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-sm uppercase cursor-pointer hover:bg-orange-200 transition-all"
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
                                                        href={\`https://wa.me/\${(req.user?.phone || req.owner_phone || '').replace(/[^0-9]/g, '')}\`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-gray-500 font-bold block hover:text-orange-500 transition-colors"
                                                    >
                                                        📞 {req.user?.phone || req.owner_phone || '-'}
                                                    </a>
                                                </div>
                                                <span className={\`ml-auto px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border \${getStatusBadge(req.status)}\`}>
                                                    {getStatusLabel(req.status)}
                                                </span>
                                            </div>

                                            {/* Detail Properti */}
                                            <div className="space-y-2">
                                                <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{req.kost_name}</h3>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                                                    <span>{req.kost_type}</span>
                                                    <span>•</span>
                                                    <span>Kamar: {req.transaction?.metadata?.totalRooms || req.transaction?.metadata?.total_rooms || '-'} Total / {req.empty_rooms || 0} Kosong</span>
                                                </p>
                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{req.kost_address}</p>

                                                {/* Maps Mini Iframe Embed */}
                                                {coords && (
                                                    <div className="w-full h-28 rounded-2xl overflow-hidden border border-gray-150 relative mt-3">
                                                        <iframe
                                                            title={\`map-\${req.id}\`}
                                                            width="100%"
                                                            height="100%"
                                                            frameBorder="0"
                                                            marginHeight={0}
                                                            marginWidth={0}
                                                            src={\`https://maps.google.com/maps?q=\${coords.lat},\${coords.lng}&z=14&output=embed\`}
                                                            className="absolute inset-0"
                                                        />
                                                    </div>
                                                )}

                                                {req.notes && (
                                                    <div className="text-[9px] bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-slate-500 font-bold leading-normal normal-case mt-2">
                                                        📝 Catatan: {req.notes.replace(/https?:\\/\\/[^\\s]+/, '').trim() || 'Ada koordinat GPS'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-50 space-y-3 shrink-0">
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
                                                            className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                        >
                                                            📂 GDrive
                                                        </a>
                                                    )}
                                                </div>
                                            ) : null}

                                            {/* Transaksi & Action Buttons */}
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Total Bayar</span>
                                                    <span className="font-black text-gray-900 text-sm">{FORMAT_CURRENCY(req.transaction?.amount || 150000)}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
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
                                    href={\`https://wa.me/\${(selectedMitra.phone || '').replace(/[^0-9]/g, '')}\`}
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

                        {/* Review Data Lapangan Agen / Accordion */}
                        {selectedPropertyDetails && (
                            <div className="mb-6 border border-slate-100 rounded-3xl overflow-hidden shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewAccordion(!showReviewAccordion)}
                                    className="w-full bg-slate-50 hover:bg-slate-100/80 px-6 py-4 flex justify-between items-center transition-colors border-b border-slate-100"
                                >
                                    <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                                        🔍 Review Data Lapangan Agen {loadingProperty && <span className="animate-pulse text-[10px] text-orange-500 font-bold">Memuat...</span>}
                                    </span>
                                    <span className="text-slate-500 font-bold text-sm">{showReviewAccordion ? '▲' : '▼'}</span>
                                </button>
                                {showReviewAccordion && (
                                    <div className="p-6 bg-white space-y-4 max-h-80 overflow-y-auto text-xs font-bold text-gray-600">
                                        <div>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Deskripsi Properti</span>
                                            <p className="text-gray-800 mt-1 font-medium leading-relaxed normal-case">{selectedPropertyDetails.description || '-'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Latitude</span>
                                                <span className="text-gray-800 font-bold">{selectedPropertyDetails.latitude || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Longitude</span>
                                                <span className="text-gray-800 font-bold">{selectedPropertyDetails.longitude || '-'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Fasilitas Properti</span>
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {selectedPropertyDetails.facilities?.map((f, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded bg-gray-50 border border-gray-150 text-[10px] text-gray-500 font-black uppercase">{f}</span>
                                                )) || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Landmark Terdekat</span>
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {selectedPropertyDetails.landmarks?.map((l, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded bg-orange-50 border border-orange-100 text-[10px] text-orange-600 font-black uppercase">{l}</span>
                                                )) || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Foto Galeri Properti</span>
                                            <div className="grid grid-cols-4 gap-2 mt-2">
                                                {selectedPropertyDetails.image_urls?.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-video rounded-lg overflow-hidden border border-gray-150">
                                                        <img src={url} alt={\`properti-\${i}\`} className="w-full h-full object-cover" />
                                                    </a>
                                                )) || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Daftar Tipe Kamar & Detail</span>
                                            <div className="space-y-3 mt-2">
                                                {selectedPropertyDetails.room_types?.map((type, i) => (
                                                    <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-black text-slate-800 uppercase text-xs">{type.name} ({type.size})</span>
                                                            <span className="text-orange-600 font-black">{FORMAT_CURRENCY(type.price)}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {type.roomFacilities?.map((f, idx) => (
                                                                <span key={idx} className="px-1.5 py-0.5 bg-white border border-gray-150 rounded text-[9px] text-gray-400">{f}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )) || '-'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

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
`;
    content = originalPre + replacementRender;
    console.log("Entire render block replaced successfully.");
} else {
    console.error("ERROR: Failed to find target boundaries for entire return block replacement!");
    process.exit(1);
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, content, 'utf8');
console.log("apply_admin_premium_layout.js execution finished successfully.");
