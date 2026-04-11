import React from 'react';
import { supabase } from '../../supabase';

interface ComplaintManagementProps {
    complaints: any[];
    refreshData: () => void;
}

const ComplaintManagement: React.FC<ComplaintManagementProps> = ({
    complaints,
    refreshData
}) => {
    const handleUpdateComplaintStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('complaints')
                .update({ status: newStatus })
                .eq('id', id);
                
            if (error) throw error;
            
            refreshData();
            alert('Status Komplain diperbarui ke ' + newStatus);
        } catch (e) {
            alert('Gagal mengupdate komplain');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Daftar Komplain Penghuni</h2>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm overflow-hidden">
                {complaints.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Belum ada komplain yang masuk.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500">
                            <thead className="bg-gray-50/50 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Laporan</th>
                                    <th className="px-6 py-4">Info User</th>
                                    <th className="px-6 py-4">Problem</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {complaints.map(c => (
                                    <tr key={c.id}>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : '-'}</p>
                                            <p className="text-[10px] text-gray-400 uppercase">{c.id.slice(0, 8)}</p>
                                            <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase mt-2 tracking-wider rounded-lg border ${c.status === 'open' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                                {c.status === 'open' ? 'TERBUKA' : 'SELESAI'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-700">{c.userName || '-'}</p>
                                            <p className="text-xs text-blue-500 cursor-pointer hover:underline" onClick={() => window.open('https://wa.me/' + (c.userPhone || ''))}>{c.userPhone || '-'}</p>
                                            <p className="text-xs text-gray-500 mt-1 font-bold">{c.kostName || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="font-bold text-red-600 truncate">{c.title || '-'}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{c.description || '-'}</p>
                                            {c.photoUrl && (
                                                <button onClick={() => window.open(c.photoUrl, '_blank')} className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                                    📸 Lihat Foto Lampiran
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {c.status === 'open' ? (
                                                <button onClick={() => handleUpdateComplaintStatus(c.id, 'closed')} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 shadow-sm transition-colors">
                                                    Tandai Selesai
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs font-bold">Teratasi ✔️</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplaintManagement;
