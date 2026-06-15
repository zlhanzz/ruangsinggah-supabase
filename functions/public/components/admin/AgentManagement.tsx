import React, { useState } from 'react';
import { updateAgentVerificationStatus, banAgentRequest, unbanAgentRequest } from '../../adminService';

interface AgentManagementProps {
    agentVerifications: any[];
    surveyAgents: any[];
    bannedAgents?: any[];
    loadAgentVerifications: () => void;
    loadActiveAgents: () => void;
    loading: boolean;
    onBlockUser?: (userId: string, name: string, isBlocked: boolean) => void;
    onDeleteUser?: (userId: string, name: string) => void;
    onViewProfile?: (userId: string) => void;
}

const AgentManagement: React.FC<AgentManagementProps> = ({
    agentVerifications,
    surveyAgents,
    bannedAgents = [],
    loadAgentVerifications,
    loadActiveAgents,
    loading,
    onBlockUser,
    onDeleteUser,
    onViewProfile
}) => {
    const [tab, setTab] = useState<'requests' | 'active' | 'blocked'>('requests');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAgents = surveyAgents.filter(agent => 
        (agent.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agent.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agent.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderRequests = () => (
        <div className="space-y-6">
            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex gap-3 mb-2">
                <span className="text-orange-500 shrink-0">🛡️</span>
                <p className="text-sm font-medium text-orange-900">Periksa kecocokan data NIK dan Nama dengan Foto KTP sebelum memberikan persetujuan.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {agentVerifications.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🏜️</div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Tidak Ada Antrian</h3>
                        <p className="text-gray-500 max-w-sm mx-auto font-medium">Semua pengajuan verifikasi agen telah diproses.</p>
                    </div>
                ) : agentVerifications.map((agent: any) => (
                    <div key={agent.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-8">
                        {/* KTP Photo Section */}
                        <div className="lg:w-72 shrink-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Foto KTP</p>
                            <div 
                                className="aspect-[3/2] rounded-xl border border-gray-100 overflow-hidden bg-gray-50 cursor-zoom-in group relative"
                                onClick={() => window.open(agent.ktp_photo_url, '_blank')}
                            >
                                {agent.ktp_photo_url ? (
                                    <>
                                        <img src={agent.ktp_photo_url} alt="KTP" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-xs font-bold uppercase tracking-widest">Klik Perbesar</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-[10px] uppercase font-black">Tanpa Foto</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="flex-grow flex-1">
                            <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider">#{agent.id.slice(0,8)}</span>
                                        <span className="text-xs text-gray-400 font-medium">Diajukan: {new Date(agent.updated_at || agent.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900">{agent.display_name || agent.name}</h3>
                                    <p className="text-sm font-medium text-gray-500 mt-1">E-mail: <span className="text-orange-600 font-bold">{agent.email}</span></p>
                                </div>
                                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={async () => {
                                                if (window.confirm('Verifikasi identitas agen ini?')) {
                                                    try {
                                                        await updateAgentVerificationStatus(agent.id, 'verified');
                                                        loadAgentVerifications();
                                                        loadActiveAgents();
                                                        alert('Agen berhasil diverifikasi!');
                                                    } catch (err: any) {
                                                        alert('Gagal memproses verifikasi: ' + err.message);
                                                    }
                                                }
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            Terima
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                const reason = window.prompt('Alasan penolakan verifikasi agen (wajib diisi):', 'Foto KTP buram atau data tidak cocok.');
                                                if (reason !== null) {
                                                    const trimmedReason = reason.trim();
                                                    if (trimmedReason === "") {
                                                        alert("Alasan penolakan wajib diisi agar agen mengetahui letak kesalahannya.");
                                                        return;
                                                    }
                                                    try {
                                                        await updateAgentVerificationStatus(agent.id, 'rejected', trimmedReason);
                                                        loadAgentVerifications();
                                                        alert('Pendaftaran ditolak.');
                                                    } catch (err: any) {
                                                        alert('Gagal memproses penolakan: ' + err.message);
                                                    }
                                                }
                                            }}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 text-center"
                                        >
                                            Tolak
                                        </button>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            const reason = window.prompt('Masukkan alasan BLOKIR PERMANEN akses pengajuan agen:', 'Terdeteksi pemalsuan dokumen identitas atau indikasi penipuan.');
                                            if (reason !== null) {
                                                const trimmedReason = reason.trim();
                                                if (trimmedReason === "") {
                                                    alert("Alasan pemblokiran wajib diisi.");
                                                    return;
                                                }
                                                try {
                                                    await banAgentRequest(agent.id, trimmedReason);
                                                    loadAgentVerifications();
                                                    loadActiveAgents();
                                                    alert('Akses kemitraan agen ini telah diblokir secara permanen.');
                                                } catch (err: any) {
                                                    alert('Gagal memproses pemblokiran: ' + err.message);
                                                }
                                            }
                                        }}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all text-center shadow-sm"
                                    >
                                        Blokir Kemitraan
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50 text-left">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">No. NIK (KTP)</p>
                                    <p className="font-bold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 text-xs">{agent.ktp_number || 'TIDAK ADA'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">No. WhatsApp</p>
                                    <p className="font-bold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 text-xs">{agent.phone || 'TIDAK ADA'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alamat Sesuai KTP</p>
                                    <p className="font-bold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 leading-relaxed text-xs">{agent.ktp_address || 'TIDAK ADA'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderActive = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Cari agen berdasarkan nama, email, atau HP..." 
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-orange-500 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgents.map((agent: any) => (
                    <div key={agent.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-xl overflow-hidden border-2 border-orange-50">
                                {agent.photo_url || agent.agent_photo_url ? (
                                    <img src={agent.photo_url || agent.agent_photo_url} className="w-full h-full object-cover animate-in fade-in" />
                                ) : (
                                    <span>👤</span>
                                )}
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-900 leading-tight">{agent.name || agent.display_name}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-yellow-400 text-xs">★</span>
                                    <span className="text-xs font-black text-gray-900">{agent.rating || '0.0'}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase ml-1">Survey Agent</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 mb-6 text-left">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400 font-bold">WHATSAPP</span>
                                <span className="text-gray-900 font-black">{agent.phone || '-'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400 font-bold">EMAIL</span>
                                <span className="text-gray-900 font-black truncate max-w-[150px]">{agent.email || '-'}</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => window.open(`https://wa.me/${agent.phone}`, '_blank')}
                                className="w-full py-2.5 bg-orange-50 text-orange-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all border border-orange-100"
                            >
                                Hubungi Agen
                            </button>

                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => onViewProfile && onViewProfile(agent.id)}
                                    className="flex flex-col items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100 group"
                                    title="Lihat Profil"
                                >
                                    <span className="text-[14px] mb-0.5 group-hover:scale-110 transition-transform">👁️</span>
                                    <span className="text-[8px] font-black uppercase tracking-tighter">Detail</span>
                                </button>
                                <button 
                                    onClick={() => onBlockUser && onBlockUser(agent.id, agent.name || agent.display_name, agent.status === 'blocked')}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border group ${
                                        agent.status === 'blocked' 
                                        ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white' 
                                        : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white'
                                    }`}
                                    title={agent.status === 'blocked' ? 'Buka Blokir' : 'Blokir'}
                                >
                                    <span className="text-[14px] mb-0.5 group-hover:scale-110 transition-transform">
                                        {agent.status === 'blocked' ? '🔓' : '🚫'}
                                    </span>
                                    <span className="text-[8px] font-black uppercase tracking-tighter">
                                        {agent.status === 'blocked' ? 'Unblock' : 'Blokir'}
                                    </span>
                                </button>
                                <button 
                                    onClick={() => onDeleteUser && onDeleteUser(agent.id, agent.name || agent.display_name)}
                                    className="flex flex-col items-center justify-center p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-900 hover:text-white transition-all border border-gray-100 group"
                                    title="Hapus User"
                                >
                                    <span className="text-[14px] mb-0.5 group-hover:scale-110 transition-transform">🗑️</span>
                                    <span className="text-[8px] font-black uppercase tracking-tighter">Hapus</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredAgents.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Agen tidak ditemukan</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderBlocked = () => (
        <div className="space-y-6">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 mb-2">
                <span className="text-red-500 shrink-0">🚫</span>
                <p className="text-sm font-medium text-red-900">Daftar pengguna yang akses kemitraan agennya telah **diblokir secara permanen**. Anda dapat memulihkan akses mereka jika diperlukan.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {bannedAgents.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl">
                        <div className="text-4xl mb-4">🔓</div>
                        <h3 className="text-gray-900 font-bold mb-1">Tidak Ada Akun Diblokir</h3>
                        <p className="text-gray-500 text-sm">Semua agen memiliki akses aktif dan bersih.</p>
                    </div>
                ) : (
                    bannedAgents.map((agent: any) => (
                        <div key={agent.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row gap-6 hover:shadow-md transition-shadow">
                            {agent.ktp_photo && (
                                <div className="w-full lg:w-60 shrink-0">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Dokumen KTP</p>
                                    <div 
                                        className="aspect-[3/2] rounded-xl border border-gray-100 overflow-hidden bg-gray-50 cursor-pointer group relative shadow-inner"
                                        onClick={() => window.open(agent.ktp_photo, '_blank')}
                                    >
                                        <img src={agent.ktp_photo} alt="KTP" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-[10px] font-black uppercase tracking-widest">Lihat KTP</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex-grow flex-1 text-left">
                                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-red-100 text-red-700">
                                                Akses Diblokir
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">Banned: {new Date(agent.updated_at || agent.created_at).toLocaleDateString('id-ID')}</span>
                                        </div>
                                        <p className="font-medium text-gray-500 text-sm">Nama: <span className="font-black text-gray-900 text-base">{agent.name}</span></p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                                        <p className="font-bold text-gray-900 text-xs mt-0.5 truncate">{agent.email || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No. WhatsApp</p>
                                        <p className="font-bold text-gray-900 text-xs mt-0.5">{agent.phone || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No. KTP</p>
                                        <p className="font-bold text-gray-950 text-xs mt-0.5 tracking-wider">{agent.ktp_number || '-'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alasan Blokir / Penolakan</p>
                                        <p className="font-bold text-red-600 text-[11px] mt-0.5 leading-relaxed">{agent.verification_notes || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:w-44 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-5 justify-center">
                                <button 
                                    onClick={async () => {
                                        if (window.confirm(`Aktifkan kembali akses kemitraan agen untuk ${agent.name}?`)) {
                                            try {
                                                await unbanAgentRequest(agent.id);
                                                alert('Akses kemitraan agen berhasil dipulihkan!');
                                                loadAgentVerifications();
                                                loadActiveAgents();
                                            } catch (err: any) {
                                                alert('Gagal memulihkan akses: ' + err.message);
                                            }
                                        }
                                    }} 
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 flex justify-center items-center gap-1.5 shadow-md shadow-blue-100"
                                >
                                    Pulihkan Akses
                                </button>
                                <button onClick={() => window.open(`https://wa.me/${agent.phone}`, '_blank')} className="w-full bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5">
                                    Hubungi WA
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div className="text-left">
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Manajemen Agen Survey</h2>
                    <p className="text-gray-500 text-sm mt-1">Total {surveyAgents.length} agen aktif, {agentVerifications.length} menunggu verifikasi, {bannedAgents.length} diblokir.</p>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 flex gap-1 shadow-sm sticky top-0 z-10 transition-all sm:w-fit">
                <button 
                    onClick={() => setTab('requests')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${tab === 'requests' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Permintaan Verifikasi
                    {agentVerifications.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                </button>
                <button 
                    onClick={() => setTab('active')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${tab === 'active' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Daftar Agen Aktif
                </button>
                <button 
                    onClick={() => setTab('blocked')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${tab === 'blocked' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Akun Diblokir
                    {bannedAgents.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center font-bold text-gray-400 uppercase tracking-widest animate-pulse">Memuat Data...</div>
            ) : (
                tab === 'requests' ? renderRequests() : (tab === 'active' ? renderActive() : renderBlocked())
            )}
        </div>
    );
};

export default AgentManagement;
