const fs = require('fs');
const path = require('path');

const agentDashboardPath = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(agentDashboardPath, 'utf-8');

// 1. Add helper getFormattedRevisionDateTime right before AgentDashboard component or near detectProvinceFromAddress
const helperCode = `export const getFormattedRevisionDateTime = (req: any, evalData?: any): string => {
    const rawDate = req.updated_at || req.created_at;
    if (rawDate) {
        try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
                const datePart = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
                return \`\${datePart}, \${timePart} WITA\`;
            }
        } catch (e) {}
    }
    return evalData?.date ? \`\${evalData.date}\` : 'Terbaru';
};

`;

if (!code.includes('getFormattedRevisionDateTime')) {
    code = code.replace('export const detectProvinceFromAddress', `${helperCode}export const detectProvinceFromAddress`);
    console.log('Added getFormattedRevisionDateTime');
}

// 2. Replace lines 4527 to 4625
const oldActiveBlock = `{agentTab === 'active' && (
                                            <>
                                                {req.status === 'REVISION_REQUIRED' || req.notes?.includes('[REVISI') ? (() => {
                                                    const evalData = parseEvaluationData(req.notes, req.status);
                                                    return (
                                                        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-amber-500/[0.08] p-4 shadow-[0_0_20px_rgba(245,158,11,0.18)] flex flex-col gap-3.5 backdrop-blur-sm transition-all">
                                                            {/* Top Glowing Gradient Accent Bar */}
                                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse" />
                                                            
                                                            {/* Header with Pulse Icon & Status Pill */}
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 animate-bounce">
                                                                        <AlertTriangle size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider block">
                                                                            Evaluasi &amp; Permintaan Revisi
                                                                        </span>
                                                                        <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">
                                                                            Catatan Admin • {evalData.date}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-200/90 text-amber-900 border border-amber-300 text-[9px] font-black uppercase tracking-wider shadow-xs animate-pulse">
                                                                    <Sparkles size={10} className="text-amber-700" />
                                                                    Perlu Tindakan
                                                                </span>
                                                            </div>

                                                            {/* List of Targeted Items as Modern Interactive Chips */}
                                                            {evalData.items.length > 0 && (
                                                                <div className="flex flex-col gap-1.5 pt-1 border-t border-amber-200/60">
                                                                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                                                                        <span>📌</span> Bagian yang Perlu Diperbaiki:
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {evalData.items.map((item, idx) => (
                                                                            <span 
                                                                                key={idx} 
                                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white text-amber-950 font-extrabold text-[11px] border border-amber-200 shadow-xs"
                                                                            >
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block shrink-0" />
                                                                                {item}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Admin Note Quote Box */}
                                                            {evalData.adminNote && (
                                                                <div className="bg-white/95 rounded-xl p-3 border border-amber-200 shadow-xs flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                                                                        <span>📝</span> Pesan Catatan Admin:
                                                                    </span>
                                                                    <p className="text-xs text-gray-800 font-semibold leading-relaxed whitespace-pre-wrap italic">
                                                                        "{evalData.adminNote}"
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Fallback if neither items nor admin note parsed cleanly */}
                                                            {!evalData.items.length && !evalData.adminNote && (
                                                                <div className="bg-white/95 rounded-xl p-3 border border-amber-200 shadow-xs">
                                                                    <p className="text-xs text-gray-800 font-semibold leading-relaxed">
                                                                        {req.notes || 'Admin meminta evaluasi data pendataan properti. Silakan buka formulir untuk melihat dan memperbaiki data.'}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* CTA Button with Glow & Shimmer */}
                                                            <button 
                                                                onClick={() => openKostManagerListing(req)} 
                                                                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition-all cursor-pointer group"
                                                            >
                                                                <Edit className="w-4 h-4 transition-transform group-hover:scale-110" />
                                                                <span>⚡ Buka &amp; Perbaiki Bagian yang Dievaluasi</span>
                                                                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                                            </button>
                                                        </div>
                                                    );
                                                })() : req.status === 'SUBMITTED' ? (
                                                    <div className="flex flex-col gap-2.5">
                                                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2 text-xs text-emerald-950">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-extrabold text-emerald-950">Data Pendataan Dikirim ke Admin</span>
                                                                <span className="text-[11px] font-medium leading-relaxed text-emerald-800">
                                                                    Data properti &amp; kamar telah dikirim untuk ditinjau oleh Admin. Anda tetap dapat mengedit atau memperbarui data kapan saja.
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => openKostManagerListing(req)} 
                                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-label-lg shadow-md active:scale-95"
                                                        >
                                                            <Edit className="w-4 h-4 inline shrink-0" />
                                                            ✏️ Edit &amp; Perbarui Data Listing
                                                        </button>
                                                    </div>
                                                ) : (`;

const newActiveBlock = `{agentTab === 'active' && (
                                            <>
                                                {(req.status === 'REVISION_REQUIRED' || req.status === 'NEED_REVISION') ? (() => {
                                                    const evalData = parseEvaluationData(req.notes, req.status);
                                                    return (
                                                        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-amber-500/[0.08] p-4 shadow-[0_0_20px_rgba(245,158,11,0.18)] flex flex-col gap-3.5 backdrop-blur-sm transition-all">
                                                            {/* Top Glowing Gradient Accent Bar */}
                                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse" />
                                                            
                                                            {/* Header with Pulse Icon & Status Pill */}
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 animate-bounce">
                                                                        <AlertTriangle size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider block">
                                                                            Evaluasi &amp; Permintaan Revisi
                                                                        </span>
                                                                        <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">
                                                                            Catatan Admin • {evalData.date}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-200/90 text-amber-900 border border-amber-300 text-[9px] font-black uppercase tracking-wider shadow-xs animate-pulse">
                                                                    <Sparkles size={10} className="text-amber-700" />
                                                                    Perlu Tindakan
                                                                </span>
                                                            </div>

                                                            {/* List of Targeted Items as Modern Interactive Chips */}
                                                            {evalData.items.length > 0 && (
                                                                <div className="flex flex-col gap-1.5 pt-1 border-t border-amber-200/60">
                                                                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                                                                        <span>📌</span> Bagian yang Perlu Diperbaiki:
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {evalData.items.map((item, idx) => (
                                                                            <span 
                                                                                key={idx} 
                                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white text-amber-950 font-extrabold text-[11px] border border-amber-200 shadow-xs"
                                                                            >
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block shrink-0" />
                                                                                {item}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Admin Note Quote Box */}
                                                            {evalData.adminNote && (
                                                                <div className="bg-white/95 rounded-xl p-3 border border-amber-200 shadow-xs flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                                                                        <span>📝</span> Pesan Catatan Admin:
                                                                    </span>
                                                                    <p className="text-xs text-gray-800 font-semibold leading-relaxed whitespace-pre-wrap italic">
                                                                        "{evalData.adminNote}"
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Fallback if neither items nor admin note parsed cleanly */}
                                                            {!evalData.items.length && !evalData.adminNote && (
                                                                <div className="bg-white/95 rounded-xl p-3 border border-amber-200 shadow-xs">
                                                                    <p className="text-xs text-gray-800 font-semibold leading-relaxed">
                                                                        {req.notes || 'Admin meminta evaluasi data pendataan properti. Silakan buka formulir untuk melihat dan memperbaiki data.'}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* CTA Button with Glow & Shimmer */}
                                                            <button 
                                                                onClick={() => openKostManagerListing(req)} 
                                                                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition-all cursor-pointer group"
                                                            >
                                                                <Edit className="w-4 h-4 transition-transform group-hover:scale-110" />
                                                                <span>⚡ Buka &amp; Perbaiki Bagian yang Dievaluasi</span>
                                                                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                                            </button>
                                                        </div>
                                                    );
                                                })() : (req.status === 'SUBMITTED' || req.status === 'PENDING_ONBOARDING') ? (() => {
                                                    const evalData = parseEvaluationData(req.notes, req.status);
                                                    const hasPastRevision = Boolean(req.notes && (req.notes.includes('[REVISI') || req.notes.toLowerCase().includes('catatan evaluasi admin')));

                                                    return (
                                                        <div className="flex flex-col gap-2.5">
                                                            {/* Satu baris kecil memanjang untuk riwayat revisi */}
                                                            {hasPastRevision && (
                                                                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 shadow-2xs">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                                        <span className="text-[11px] font-semibold truncate">
                                                                            <strong className="text-amber-950 font-black mr-1">Riwayat Revisi:</strong>
                                                                            Terkirim {getFormattedRevisionDateTime(req, evalData)}
                                                                        </span>
                                                                    </div>
                                                                    <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase tracking-wider shrink-0 border border-amber-300">
                                                                        ✓ Terkirim
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2 text-xs text-emerald-950">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-extrabold text-emerald-950">Data Pendataan Dikirim ke Admin</span>
                                                                    <span className="text-[11px] font-medium leading-relaxed text-emerald-800">
                                                                        Data properti &amp; kamar telah dikirim untuk ditinjau oleh Admin. Anda tetap dapat mengedit atau memperbarui data kapan saja.
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => openKostManagerListing(req)} 
                                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-label-lg shadow-md active:scale-95 cursor-pointer"
                                                            >
                                                                <Edit className="w-4 h-4 inline shrink-0" />
                                                                ✏️ Edit &amp; Perbarui Data Listing
                                                            </button>
                                                        </div>
                                                    );
                                                })() : (`;

if (code.includes(oldActiveBlock)) {
    code = code.replace(oldActiveBlock, newActiveBlock);
    console.log('Successfully updated active card rendering with compact single-row revision history!');
} else {
    console.error('Could not find oldActiveBlock in AgentDashboard.tsx');
}

fs.writeFileSync(agentDashboardPath, code, 'utf-8');
