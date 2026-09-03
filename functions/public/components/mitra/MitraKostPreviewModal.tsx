import React, { useEffect } from 'react';
import { Kost } from '../../types';
import KostDetail from '../../pages/KostDetail';
import { 
    X, Edit3, Eye, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';

interface MitraKostPreviewModalProps {
    kost: Kost;
    onClose: () => void;
    onEdit: (kost: Kost) => void;
}

export const MitraKostPreviewModal: React.FC<MitraKostPreviewModalProps> = ({ kost, onClose, onEdit }) => {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Prevent background scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const kostName = kost.title || kost.name || (kost as any).namaKost || 'Kost Tanpa Nama';
    const isPublished = kost.status === 'published';
    const isSuspended = kost.status === 'suspended';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
            {/* Modal Container: 1:1 Viewport Frame */}
            <div className="relative w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-gray-150 h-[96vh]">
                
                {/* 1. Header Bilah Kontrol Mitra (Sticky Topbar) */}
                <div className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-900 text-white border-b border-gray-800 shadow-md shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                            <Eye size={16} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-black tracking-tight truncate text-white">
                                    Pratinjau 1:1 Tampilan Pengguna
                                </h2>
                                {/* Status Pill */}
                                {isPublished ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                        <CheckCircle2 size={10} /> Tayang Publik
                                    </span>
                                ) : isSuspended ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                                        <AlertCircle size={10} /> Ditangguhkan
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 animate-pulse">
                                        <Clock size={10} /> Sedang Ditinjau Admin
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-400 truncate">
                                {kostName} &bull; Representasi Tampilan Asli Calon Penyewa (Tanpa Booking/Chat)
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => onEdit(kost)}
                            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                            title="Edit Data Kost Ini"
                        >
                            <Edit3 size={13} />
                            <span>Edit Kost</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                            title="Tutup Pratinjau (Esc)"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* 2. Scrollable Body: 100% Real KostDetail View */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50">
                    <KostDetail
                        kost={kost}
                        onBack={onClose}
                        hideBookingAndChat={true}
                    />
                </div>

            </div>
        </div>
    );
};

export default MitraKostPreviewModal;
