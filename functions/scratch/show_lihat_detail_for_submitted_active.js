const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const lines = content.split('\n');

const startIndex = lines.findIndex((line, idx) => 
  line.includes("agentTab === 'active'") && 
  lines[idx + 1] && 
  lines[idx + 1].includes('<>') && 
  lines[idx + 2] && 
  lines[idx + 2].includes('grid grid-cols-2 gap-2')
);

if (startIndex !== -1) {
  let endIdx = startIndex;
  // Look for the corresponding closing tag or history tab marker
  while (endIdx < lines.length && !lines[endIdx].includes("agentTab === 'history'")) {
    endIdx++;
  }
  
  // Backtrack to find the closing parentheses of agentTab === 'active' block
  let closeIndex = endIdx - 1;
  while (closeIndex > startIndex && !lines[closeIndex].includes(')')) {
    closeIndex--;
  }

  console.log(`Found active tab render block starting at line ${startIndex + 1} and ending around ${closeIndex + 1}`);

  const activeTabReplacement = `                                {agentTab === 'active' && (
                                    <>
                                        {req.status === 'SUBMITTED' ? (
                                            <>
                                                {req.notes?.includes('KostManager') ? (
                                                    <button 
                                                        onClick={() => openKostManagerListing(req)} 
                                                        className="w-full bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2"
                                                    >
                                                        ✅ Lihat Detail Listing
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => openSurveyEditor(req, req.status)} 
                                                        className="w-full bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2"
                                                    >
                                                        {req.evaluation_summary?.room_facilities ? '✅ Lihat Laporan' : '📝 Detail Progress'}
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                setIsSubmitting(true);
                                                                await updateSurveyRequest(req.id, { status: 'HEADING_TO_LOCATION' });
                                                                await notifySurveyStatusUpdate(req.id, 'HEADING_TO_LOCATION');
                                                                await loadSurveyRequests(true);
                                                            } catch (e) {
                                                                alert('Gagal update status');
                                                            } finally {
                                                                setIsSubmitting(false);
                                                            }
                                                        }}
                                                        disabled={isSubmitting || req.status === 'HEADING_TO_LOCATION' || req.status === 'SURVEYING' || req.status === 'COMPLETED'}
                                                        className={\`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 \${
                                                            req.status === 'HEADING_TO_LOCATION' || req.status === 'SURVEYING' || req.status === 'COMPLETED'
                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                            : 'bg-orange-600 hover:bg-orange-700 text-white border-orange-800'
                                                        }\`}
                                                    >
                                                        🚗 {req.status === 'HEADING_TO_LOCATION' || req.status === 'SURVEYING' || req.status === 'COMPLETED' ? 'Sudah OTW' : 'Menuju Lokasi'}
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                setIsSubmitting(true);
                                                                await updateSurveyRequest(req.id, { status: 'SURVEYING' });
                                                                await notifySurveyStatusUpdate(req.id, 'SURVEYING');
                                                                await loadSurveyRequests(true);
                                                            } catch (e) {
                                                                alert('Gagal update status');
                                                            } finally {
                                                                setIsSubmitting(false);
                                                            }
                                                        }}
                                                        disabled={isSubmitting || req.status !== 'HEADING_TO_LOCATION'}
                                                        className={\`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 \${
                                                            req.status === 'HEADING_TO_LOCATION'
                                                            ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-700'
                                                            : req.status === 'SURVEYING' || req.status === 'COMPLETED'
                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                        }\`}
                                                    >
                                                        📷 {req.status === 'SURVEYING' || req.status === 'COMPLETED' ? 'Sedang Survey' : 'Sedang Survey'}
                                                    </button>
                                                </div>
                                                
                                                {req.notes?.includes('KostManager') ? (
                                                    <div className="w-full mt-1">
                                                        <button 
                                                            onClick={() => window.open(\`https://wa.me/\${req.user?.phone || req.owner_phone || ''}?text=\${encodeURIComponent(\`Halo Pemilik Kost, saya Arif agen survey RuangSinggah.\`)}\`, '_blank')} 
                                                            className="w-full bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white border border-emerald-200 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-1 shadow-sm"
                                                        >
                                                            💬 Chat Pemilik Kost
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                                        <button onClick={() => window.open(\`https://wa.me/\${req.user?.phone}\`, '_blank')} className="bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 py-2.5 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1">
                                                            💬 Chat User
                                                        </button>
                                                        <button onClick={() => window.open(\`https://wa.me/\${req.owner_phone}\`, '_blank')} className="bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200 py-2.5 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1">
                                                            🏢 Chat Pemilik
                                                        </button>
                                                    </div>
                                                )}

                                                {req.result_drive_link && (
                                                    <button 
                                                        onClick={() => window.open(req.result_drive_link, '_blank')} 
                                                        className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-1"
                                                    >
                                                        📁 Buka Folder Drive (Upload)
                                                    </button>
                                                )}

                                                <button 
                                                    onClick={() => {
                                                        setIsReschedulingSurvey(req);
                                                        setNewSurveyDate(req.survey_date || '');
                                                        setNewSurveyTime(req.survey_time || '');
                                                        setRescheduleReason(req.notes && req.status === 'RESCHEDULED' ? req.notes : '');
                                                    }} 
                                                    className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                                >
                                                    📅 Jadwal Ulang
                                                </button>

                                                {req.notes?.includes('KostManager') ? (
                                                    <button 
                                                        onClick={() => openKostManagerListing(req)} 
                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md active:scale-95 transition-all flex justify-center items-center gap-2"
                                                    >
                                                        ⚡ Isi Listing & Kamar
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => openSurveyEditor(req, 'COMPLETED')} 
                                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md animate-pulse active:scale-95 transition-all flex justify-center items-center gap-2"
                                                    >
                                                        📝 Buat Laporan
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}`;

  lines.splice(startIndex, (closeIndex - startIndex) + 1, activeTabReplacement);
  console.log("Successfully replaced active tab block with conditional view details option!");
} else {
  console.error("CRITICAL ERROR: active tab render block start not found!");
}

const finalContent = lines.join('\n');

// Convert back to CRLF
content = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
