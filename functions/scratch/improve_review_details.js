const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Fix map_pin icon to location_on
content = content.replace(
  '<span className="material-symbols-outlined text-gray-400 text-sm mt-0.5 shrink-0">map_pin</span>',
  '<span className="material-symbols-outlined text-gray-400 text-sm mt-0.5 shrink-0">location_on</span>'
);

// 2. Fix room statistics calculation in review step (Step 3)
const searchStats = `{/* Summary Stats Cards */}
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 flex flex-col">
                                                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Total</span>
                                                    <span className="text-sm font-extrabold text-blue-900 mt-0.5">
                                                        {kmListingForm.roomTypes?.reduce((acc, curr) => acc + (parseInt(curr.availableRoomCount) || 0), 0) || 0}
                                                    </span>
                                                </div>
                                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 flex flex-col">
                                                    <span className="text-[9px] font-bold text-[#ff7a00] uppercase tracking-wider">Terisi</span>
                                                    <span className="text-sm font-extrabold text-orange-950 mt-0.5">
                                                        {kmListingForm.roomTypes?.reduce((acc, curr) => acc + (curr.status === 'Terisi' ? (parseInt(curr.availableRoomCount) || 0) : 0), 0) || 0}
                                                    </span>
                                                </div>
                                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex flex-col">
                                                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Kosong</span>
                                                    <span className="text-sm font-extrabold text-emerald-900 mt-0.5">
                                                        {kmListingForm.roomTypes?.reduce((acc, curr) => acc + (curr.status !== 'Terisi' ? (parseInt(curr.availableRoomCount) || 0) : 0), 0) || 0}
                                                    </span>
                                                </div>
                                            </div>`;

const replacementStats = `{/* Summary Stats Cards */}
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 flex flex-col">
                                                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Total</span>
                                                    <span className="text-sm font-extrabold text-blue-900 mt-0.5">
                                                        {kmListingForm.roomTypes?.length || 0}
                                                    </span>
                                                </div>
                                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 flex flex-col">
                                                    <span className="text-[9px] font-bold text-[#ff7a00] uppercase tracking-wider">Terisi</span>
                                                    <span className="text-sm font-extrabold text-orange-950 mt-0.5">
                                                        {kmListingForm.roomTypes?.filter((r: any) => r.status === 'Terisi').length || 0}
                                                    </span>
                                                </div>
                                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex flex-col">
                                                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Kosong</span>
                                                    <span className="text-sm font-extrabold text-emerald-900 mt-0.5">
                                                        {kmListingForm.roomTypes?.filter((r: any) => r.status !== 'Terisi').length || 0}
                                                    </span>
                                                </div>
                                            </div>`;

if (content.includes(searchStats)) {
  content = content.replace(searchStats, replacementStats);
  console.log("Room statistics calculation successfully corrected.");
} else {
  console.error("CRITICAL: Room stats render block not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
