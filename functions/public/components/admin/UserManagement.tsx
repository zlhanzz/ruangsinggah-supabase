
import React, { useState } from 'react';
import { deleteUserAccount } from '../../adminService';

interface UserManagementProps {
    activeUsers: any[];
    loadActiveUsers: () => void;
    loading: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({
    activeUsers,
    loadActiveUsers,
    loading
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [tab, setTab] = useState<'all' | 'renting'>('all');

    const filteredUsers = activeUsers.filter(user => 
        (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (uId: string, name: string) => {
        if (!window.confirm(`Hapus akun "${name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;
        try {
            await deleteUserAccount(uId);
            alert('User berhasil dihapus');
            loadActiveUsers();
        } catch (e) {
            alert('Gagal menghapus user');
        }
    };

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
                                    <th className="px-6 py-5">Kontak</th>
                                    <th className="px-6 py-5">Status Akun</th>
                                    <th className="px-6 py-5">Terdaftar</th>
                                    <th className="px-6 py-5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user: any) => (
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
                                        <td className="px-6 py-4">
                                            <p className="text-gray-900 font-medium">{user.email}</p>
                                            <p className="text-xs text-blue-500 font-bold mt-1 cursor-pointer hover:underline" onClick={() => window.open(`https://wa.me/${user.phone}`, '_blank')}>{user.phone || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider border border-green-100">Aktif</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-600 font-medium">{new Date(user.created_at).toLocaleDateString('id-ID')}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleDelete(user.id, user.name)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Hapus Akun"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
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
