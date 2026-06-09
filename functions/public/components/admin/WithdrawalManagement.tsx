import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { FORMAT_CURRENCY } from '../../constants';

interface WithdrawalRequest {
    id: string;
    agent_id: string;
    amount: number;
    bank_name: string;
    bank_account: string;
    bank_account_name: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    agent?: {
        name: string;
        email: string;
        phone: string;
    };
}

interface WithdrawalManagementProps {}

const WithdrawalManagement: React.FC<WithdrawalManagementProps> = () => {
    const [localLoading, setLocalLoading] = useState(false);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    const loadWithdrawals = async () => {
        setLocalLoading(true);
        try {
            const { data: wdData, error: wdError } = await supabase
                .from('withdrawal_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (wdError) throw wdError;

            if (wdData && wdData.length > 0) {
                const agentIds = [...new Set(wdData.map(w => w.agent_id).filter(Boolean))];
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('id, name, email, phone')
                    .in('id', agentIds);
                
                if (usersError) {
                    console.error('Error loading agent users:', usersError);
                }

                const userMap = new Map(usersData?.map(u => [u.id, u]) || []);
                const mappedWithdrawals = wdData.map(w => ({
                    ...w,
                    agent: userMap.get(w.agent_id) || undefined
                }));

                setWithdrawals(mappedWithdrawals);
            } else {
                setWithdrawals([]);
            }
        } catch (err) {
            console.error('Error loading withdrawals:', err);
        } finally {
            setLocalLoading(false);
        }
    };

    useEffect(() => {
        loadWithdrawals();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
        const action = newStatus === 'approved' ? 'menyetujui' : 'menolak';
        if (!window.confirm(`Apakah Anda yakin ingin ${action} pengajuan penarikan ini?`)) return;

        setLocalLoading(true);
        try {
            const { error } = await supabase
                .from('withdrawal_requests')
                .update({ 
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            
            alert(`Berhasil ${action} pengajuan penarikan.`);
            await loadWithdrawals();
        } catch (err) {
            console.error('Error updating withdrawal status:', err);
            alert('Gagal memperbarui status penarikan.');
        } finally {
            setLocalLoading(false);
        }
    };

    const filteredWithdrawals = withdrawals.filter(w => {
        const agentName = w.agent?.name || w.bank_account_name || '';
        const matchesSearch = agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (w.bank_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (w.bank_account || '').toLowerCase().includes(searchQuery.toLowerCase());

        if (tab === 'all') return matchesSearch;
        return matchesSearch && w.status === tab;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Kelola Penarikan Saldo (WD)</h2>
                    <p className="text-gray-500 text-sm mt-1">Konfirmasi pengajuan penarikan dana agen dan lakukan transfer secara manual.</p>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 flex flex-wrap gap-1 shadow-sm sticky top-0 z-10 sm:w-fit">
                <button 
                    onClick={() => setTab('pending')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${tab === 'pending' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Menunggu ({withdrawals.filter(w => w.status === 'pending').length})
                </button>
                <button 
                    onClick={() => setTab('approved')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${tab === 'approved' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Selesai ({withdrawals.filter(w => w.status === 'approved').length})
                </button>
                <button 
                    onClick={() => setTab('rejected')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${tab === 'rejected' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Ditolak ({withdrawals.filter(w => w.status === 'rejected').length})
                </button>
                <button 
                    onClick={() => setTab('all')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${tab === 'all' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Semua ({withdrawals.length})
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Cari nama agen, bank, no. rekening..." 
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-orange-500 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button 
                    onClick={loadWithdrawals}
                    className="px-5 py-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-black uppercase tracking-widest rounded-2xl shadow-sm transition-all"
                >
                    🔄 Refresh Data
                </button>
            </div>

            {localLoading ? (
                <div className="py-20 text-center font-bold text-gray-400 uppercase tracking-widest animate-pulse">Memuat Pengajuan WD...</div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-gray-50/50 text-xs font-black text-gray-500 uppercase tracking-[0.1em] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-5">Agen</th>
                                    <th className="px-6 py-5">Nominal WD</th>
                                    <th className="px-6 py-5">Rekening Tujuan</th>
                                    <th className="px-6 py-5">Tanggal Pengajuan</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredWithdrawals.map((w) => (
                                    <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xs border border-orange-50">
                                                    {(w.agent?.name || w.bank_account_name || 'A').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{w.agent?.name || w.bank_account_name || 'Agen'}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{w.agent?.email || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-gray-900 text-base">{FORMAT_CURRENCY(w.amount)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">🏦</span>
                                                <div>
                                                    <p className="font-extrabold text-gray-900 text-sm">{w.bank_name}</p>
                                                    <p className="text-xs text-gray-500 font-bold mt-0.5">{w.bank_account}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">a.n. {w.bank_account_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-700 font-medium">
                                                {new Date(w.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold">
                                                Pukul {new Date(w.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                w.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                                w.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                'bg-yellow-50 text-yellow-700 border-yellow-100'
                                            }`}>
                                                {w.status === 'approved' ? 'Selesai' :
                                                 w.status === 'rejected' ? 'Ditolak' :
                                                 'Menunggu'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {w.status === 'pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleUpdateStatus(w.id, 'rejected')}
                                                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                                    >
                                                        Tolak
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(w.id, 'approved')}
                                                        className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-green-100 transition-all active:scale-95"
                                                    >
                                                        Setujui & Transfer
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 text-xs">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredWithdrawals.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-4xl">💰</span>
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Tidak ada pengajuan penarikan</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawalManagement;
