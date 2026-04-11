
import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { Zap } from 'lucide-react';
import { AnalyticsSummary } from '../../adminService';
import { FORMAT_CURRENCY } from '../../constants';

interface AnalyticsViewProps {
    analyticsSummary: AnalyticsSummary | null;
    dateFilter: string;
    setDateFilter: (filter: string) => void;
    customStartDate: string;
    setCustomStartDate: (date: string) => void;
    customEndDate: string;
    setCustomEndDate: (date: string) => void;
    selectedYear: string;
    setSelectedYear: (year: string) => void;
    dashboardViewMode: 'personal' | 'global';
    setDashboardViewMode: (mode: 'personal' | 'global') => void;
    currentYear: number;
    getMaxEndDate: () => string;
}

const StatCard = ({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{title}</p>
            <p className="text-xl font-black text-gray-900 mt-1">{value}</p>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl z-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-xs font-bold" style={{ color: entry.color }}>
                        {entry.name}: {entry.name.toLowerCase().includes('pendapatan') ? FORMAT_CURRENCY(entry.value) : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({
    analyticsSummary,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    selectedYear,
    setSelectedYear,
    dashboardViewMode,
    setDashboardViewMode,
    currentYear,
    getMaxEndDate
}) => {
    const statsGeneral = {
        users: analyticsSummary?.totalUsers || 0,
        revenue: analyticsSummary?.totalRevenue || 0,
        mitra: analyticsSummary?.totalMitra || 0,
        dbActive: analyticsSummary?.totalDatabases || 0
    };

    const statsKost = analyticsSummary?.kostStats || { users: 0, active: 0, revenue: 0 };
    const statsDb = analyticsSummary?.dbStats || { buyers: 0, active: 0, revenue: 0 };
    const statsVerif = analyticsSummary?.verifStats || { orders: 0, revenue: 0 };
    const trendData = analyticsSummary?.trendData || [];

    const verifikasiPrice = 70000; // Hardcoded or pass as prop if dynamic

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Analisis & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Ringkasan Analisis</h2>
                    <p className="text-gray-500 text-sm mt-1">Pantau performa bisnis dan pertumbuhan pengguna RuangSinggah.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
                    {dateFilter === 'custom' && (
                        <div className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => {
                                    setCustomStartDate(e.target.value);
                                    if (customEndDate) {
                                        const start = new Date(e.target.value);
                                        const end = new Date(customEndDate);
                                        const maxEnd = new Date(start);
                                        maxEnd.setMonth(start.getMonth() + 3);
                                        if (end < start || end > maxEnd) setCustomEndDate('');
                                    }
                                }}
                                className="text-xs bg-white border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <span className="text-gray-400 text-xs font-bold">-</span>
                            <input
                                type="date"
                                min={customStartDate}
                                max={getMaxEndDate()}
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="text-xs bg-white border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    )}
                    {dateFilter === 'tahunan' && (
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block p-2.5 font-bold outline-none"
                        >
                            {Array.from({ length: Math.max(1, currentYear - 2025 + 1) }, (_, i) => 2025 + i).map(year => (
                                <option key={year} value={year.toString()}>{year}</option>
                            ))}
                        </select>
                    )}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block w-full md:w-auto p-2.5 font-bold uppercase tracking-wider outline-none"
                    >
                        <option value="all">Semua Waktu</option>
                        <option value="hari_ini">Hari Ini</option>
                        <option value="minggu_ini">Minggu Ini</option>
                        <option value="bulan_ini">Bulan Ini</option>
                        <option value="tahunan">Tahunan</option>
                        <option value="custom">Rentang Kustom</option>
                    </select>
                </div>
            </div>

            {/* GENERAL SUMMARY SECTION */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-xl">🌐</span> Ringkasan Umum
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard title="Total Pengguna" value={statsGeneral.users.toString()} icon="👥" color="bg-blue-100 text-blue-700" />
                    <StatCard title="Total Pendapatan" value={FORMAT_CURRENCY(statsGeneral.revenue)} icon="💰" color="bg-orange-100 text-orange-700" />
                    <StatCard title="Total Mitra Aktif" value={statsGeneral.mitra.toString()} icon="🤝" color="bg-emerald-100 text-emerald-700" />
                    <StatCard title="Total Database Aktif" value={statsGeneral.dbActive.toString()} icon="🗄️" color="bg-purple-100 text-purple-700" />
                </div>

                {/* Chart Tren Ringkasan Umum */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Tren Pengguna vs Pendapatan</h4>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPengguna" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(value) => `${value / 1000000}M`} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <Area yAxisId="left" type="monotone" dataKey="pendapatan" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorPendapatan)" name="Pendapatan" />
                                <Area yAxisId="right" type="monotone" dataKey="pengguna" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPengguna)" name="Pengguna Aktif" />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* KOST SECTION */}
            <div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-xl">🏠</span> Performa Berlangganan / Sewa Kost
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Total Penyewa Baru" value={statsKost.users.toString()} icon="👥" color="bg-blue-50 text-blue-600" />
                    <StatCard title="Total Kost Tersewa" value={statsKost.active.toString()} icon="🔑" color="bg-green-50 text-green-600" />
                    <StatCard title="Pendapatan Sewa (Est)" value={FORMAT_CURRENCY(statsKost.revenue)} icon="💰" color="bg-orange-50 text-orange-600" />
                </div>

                {/* Chart Tren Sewa Kost */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Grafik Tren Sewa Baru</h4>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="sewa" fill="#22c55e" radius={[4, 4, 0, 0]} name="Sewa Baru" maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* DB SECTION */}
            <div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8">
                    <span className="text-xl">🗄️</span> Performa Penjualan Database
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Total Pembeli Baru" value={statsDb.buyers.toString()} icon="🛒" color="bg-indigo-50 text-indigo-600" />
                    <StatCard title="Total File Terjual" value={statsDb.active.toString()} icon="📦" color="bg-purple-50 text-purple-600" />
                    <StatCard title="Pendapatan Penjualan DB" value={FORMAT_CURRENCY(statsDb.revenue)} icon="💳" color="bg-pink-50 text-pink-600" />
                </div>

                {/* Chart Tren Penjualan Database */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Grafik Tren Penjualan DB</h4>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <Area type="monotone" dataKey="db" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorDb)" name="Pembelian DB" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* VERIFIKASI SECTION */}
            <div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8">
                    <span className="text-xl">✅</span> Performa Layanan Verifikasi Kost
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Total Pesanan" value={statsVerif.orders.toString()} icon="📝" color="bg-orange-50 text-orange-600" />
                    <StatCard title="Pendapatan Verifikasi" value={FORMAT_CURRENCY(statsVerif.revenue)} icon="💰" color="bg-pink-50 text-pink-600" />
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">Target vs Pencapaian Verifikasi Kost</h4>
                            <div className="mt-4">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="text-4xl font-black text-gray-900">{statsVerif.orders} <span className="text-sm text-gray-400 font-medium">pesanan {dateFilter !== 'all' ? 'periode ini' : ''}</span></p>
                                    <p className="text-sm font-bold text-orange-500">{FORMAT_CURRENCY(statsVerif.revenue)}</p>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min(100, (statsVerif.orders / 100) * 100)}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-500 flex justify-between">
                                    <span>Target Bulanan: 100</span>
                                    <span className="font-bold">{(statsVerif.orders / 100 * 100).toFixed(0)}%</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* NEW GRAPH FOR VERIFIKASI KOST */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-black text-gray-900">Performa Layanan Verifikasi Kost</h3>
                            <p className="text-xs text-gray-500 font-medium mt-1">Tren pesanan bulanan berdasarkan layanan video call langsung eksklusif.</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pesanan Aktual</p>
                            <p className="text-xl font-bold text-gray-900">{statsVerif.orders}</p>
                        </div>
                    </div>
                    <div className="w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={10} tickFormatter={(val) => `Rp ${val / 1000000}M`} />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                <Bar yAxisId="left" dataKey="verifikasi" name="Jumlah Verifikasi" stroke="#8b5cf6" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar yAxisId="right" dataKey={(data) => data.verifikasi * verifikasiPrice} name="Pendapatan (Hrg Config)" stroke="#f59e0b" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
