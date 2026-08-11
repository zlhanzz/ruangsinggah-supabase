import React, { useState } from 'react';
import { Clock, X, Zap, RefreshCcw } from 'lucide-react';
import { getCurrentDate, setMockDate, getMockDateStr } from '../utils/timeUtils';

const TimeSimulator: React.FC = () => {
    const [mockDate, setMockDateState] = useState(getMockDateStr());
    const [isExpanded, setIsExpanded] = useState(false);

    const activeDate = getCurrentDate();
    const isMocking = !!mockDate;

    const handleTravel = () => {
        if (!mockDate) return;
        setMockDate(mockDate);
    };

    const handleReset = () => {
        setMockDate(null);
        setMockDateState('');
    };

    const fastTravel = (days: number) => {
        const target = new Date(activeDate);
        target.setDate(target.getDate() + days);
        const dateStr = target.toISOString().split('T')[0];
        setMockDate(dateStr);
    };

    return (
        <div className={`fixed bottom-24 right-6 lg:bottom-8 lg:right-8 z-[9999] transition-all duration-500 ${isExpanded ? 'w-80' : 'w-14 h-14'}`}>
            {!isExpanded ? (
                <button
                    onClick={() => setIsExpanded(true)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 ${isMocking ? 'bg-orange-600 text-white animate-pulse' : 'bg-gray-900 text-white'}`}
                >
                    <Clock className="w-6 h-6" />
                </button>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 p-6 animate-in zoom-in-95 slide-in-from-bottom-10">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isMocking ? 'bg-orange-500 animate-ping' : 'bg-emerald-500'}`} />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Simulator</p>
                        </div>
                        <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tanggal Aktif Sistem</p>
                            <p className="text-lg font-black text-gray-900 leading-none">
                                {activeDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            {isMocking && <p className="text-[9px] font-bold text-orange-600 uppercase mt-2">⚠️ Mode Simulasi Aktif</p>}
                        </div>

                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Lakukan Time Travel</p>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                                value={mockDate}
                                onChange={(e) => setMockDateState(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => fastTravel(7)} className="py-2 bg-gray-50 hover:bg-gray-100 text-[10px] font-black text-gray-600 rounded-xl transition-all uppercase border border-gray-100">+7 Hari</button>
                            <button onClick={() => fastTravel(30)} className="py-2 bg-gray-50 hover:bg-gray-100 text-[10px] font-black text-gray-600 rounded-xl transition-all uppercase border border-gray-100">+1 Bulan</button>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleTravel}
                                disabled={!mockDate}
                                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-100"
                            >
                                Pergi
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                                title="Segarkan Data"
                            >
                                <RefreshCcw size={14} />
                                Sync
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSimulator;

