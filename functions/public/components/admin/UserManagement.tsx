
import React, { useState } from 'react';
import { deleteUserAccount } from '../../adminService';

interface UserManagementProps {
    loading: boolean;
    onBlockUser?: (userId: string, name: string, isBlocked: boolean) => void;
    onDeleteUser?: (userId: string, name: string) => void;
    onViewProfile?: (userId: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
    activeUsers,
    loadActiveUsers,
    loading,
    onBlockUser,
    onDeleteUser,
    onViewProfile
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [tab, setTab] = useState<'all' | 'renting'>('all');

    const filteredUsers = activeUsers.filter(user => {
        const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        if (tab === 'renting') {
            // Check for renting flag or active booking indicator
            return matchesSearch && (user.is_renting === true || user.active_kost_name || user.role === 'tenant');
        }
        
        return matchesSearch;
    });



    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Kelola Pengguna</h2>
                    <p className="text-gray-500 text-sm mt-1">Manajemen seluruh pengguna yang terdaftar di platform.</p>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 flex gap-1 shadow-sm sticky top-0 z-10 transition-all sm:w-fit">
                <button 
                    onClick={() => setTab('all')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${tab === 'all' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Semua Pengguna
                </button>
                <button 
                    onClick={() => setTab('renting')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${tab === 'renting' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Sedang Menyewa
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Cari nama, email, atau no. HP..." 
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-orange-500 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center font-bold text-gray-400 uppercase tracking-widest animate-pulse">Memuat Data User...</div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-gray-50/50 text-xs font-black text-gray-500 uppercase tracking-[0.1em] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-5">Profil</th>
                                    {tab === 'renting' && (
                                        <>
                                            <th className="px-6 py-5">Kost & Kamar</th>
                                            <th className="px-6 py-5">Masa Sewa</th>
                                            <th className="px-6 py-5">Sisa Hari</th>
                                        </>
                                    )}
                                    <th className="px-6 py-5">Kontak</th>
                                    <th className="px-6 py-5">{tab === 'renting' ? 'Status' : 'Terdaftar'}</th>
                                    <th className="px-6 py-5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user: any) => {
                                    const rental = user.active_rental;
                                    const daysRem = rental?.daysRemaining;
                                    const isEndingSoon = daysRem !== null && daysRem <= 7;

                                    const handleFollowUp = () => {
                                        if (!user.phone) return alert('Nomor HP tidak tersedia');
                                        const cleanPhone = user.phone.replace(/\D/g, '');
                                        const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
                                        const msg = `Halo ${user.name || 'User'}, Saya Admin RuangSinggah. Menginfokan masa sewa Kost ${rental?.kostName || ''} akan berakhir pada ${rental?.endDate ? new Date(rental.endDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}. Apakah ingin melakukan perpanjangan? Terima kasih.`;
                                        window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                                    };

                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xs border border-orange-50">
                                                        {user.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{user.name || 'No Name'}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">#{user.id.substring(0,8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            {tab === 'renting' && (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <p className="text-gray-900 font-bold">{rental?.kostName || '-'}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{rental?.roomType || '-'}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-gray-900 font-medium">
                                                            {rental?.startDate ? new Date(rental.startDate).toLocaleDateString('id-ID') : '-'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-bold">
                                                            s/d {rental?.endDate ? new Date(rental.endDate).toLocaleDateString('id-ID') : '-'}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {daysRem !== null ? (
                                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                                isEndingSoon ? 'bg-red-50 text-red-700 border-red-100 animate-pulse' : 'bg-green-50 text-green-700 border-green-100'
                                                            }`}>
                                                                {daysRem <= 0 ? (daysRem === 0 ? 'Hari Ini' : 'Lewat') : `${daysRem} Hari Lagi`}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                </>
                                            )}

                                            <td className="px-6 py-4">
                                                <p className="text-gray-900 font-medium">{user.email}</p>
                                                <p className="text-xs text-blue-500 font-bold mt-1 cursor-pointer hover:underline" onClick={() => window.open(`https://wa.me/${user.phone}`, '_blank')}>{user.phone || '-'}</p>
                                            </td>
                                            
                                            <td className="px-6 py-4">
                                                {tab === 'renting' ? (
                                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                        rental?.status === 'paid' || rental?.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                                                    }`}>
                                                        {rental?.status || 'Active'}
                                                    </span>
                                                ) : (
                                                    <p className="text-gray-600 font-medium">{new Date(user.created_at).toLocaleDateString('id-ID')}</p>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 text-right">
                                                    {tab === 'renting' && (
                                                        <button 
                                                            onClick={handleFollowUp}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-100 active:scale-95"
                                                            title="Follow Up via WhatsApp"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217s.231.006.332.013c.101.007.237-.038.371.29.134.328.461 1.123.501 1.203.04.08.067.173.013.28-.054.106-.08.173-.16.27-.081.096-.163.16-.232.251-.08.106-.164.22-.07.382.094.162.418.69.896 1.115.614.546 1.133.715 1.296.796.163.081.259.067.355-.044.096-.111.411-.481.52-.647.109-.166.218-.139.366-.083.148.056.937.442 1.099.523s.27.121.309.189c.039.068.039.39-.105.795z"/></svg>
                                                            Follow Up
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => onViewProfile && onViewProfile(user.id)}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Lihat Profil"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => onBlockUser && onBlockUser(user.id, user.name || 'User', user.status === 'blocked')}
                                                        className={`p-2 rounded-lg transition-all ${
                                                            user.status === 'blocked' 
                                                            ? 'text-green-500 hover:bg-green-50' 
                                                            : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                                                        }`}
                                                        title={user.status === 'blocked' ? "Buka Blokir" : "Blokir Akun"}
                                                    >
                                                        {user.status === 'blocked' ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                        )}
                                                    </button>
                                                    <button 
                                                        onClick={() => onDeleteUser && onDeleteUser(user.id, user.name || 'User')}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Hapus Akun"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={tab === 'renting' ? 8 : 5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-4xl text-gray-200">🔍</span>
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">User tidak ditemukan</p>
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

export default UserManagement;
