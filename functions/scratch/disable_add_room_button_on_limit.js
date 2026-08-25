const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

const oldBtnBlock = `                                             {/* Add New Room Button */}
                                             <button 
                                                 type="button"
                                                 onClick={() => {
                                                     setActiveRoomIdx(null); // Deselect existing room
                                                     setTemporaryRoom({
                                                         name: '',
                                                         floor: 'Lantai 1',
                                                         type: '',
                                                         status: '',
                                                         isAvailable: null,
                                                         price: '',
                                                         pricing: [{ period: 'bulanan', price: '' }],
                                                         roomFacilities: [],
                                                         images: [],
                                                         readyDate: '',
                                                         residentName: '',
                                                         residentPhone: '',
                                                         startDate: '',
                                                         endDate: '',
                                                         paymentPeriod: 'bulanan',
                                                         isPaid: true,
                                                         remainingBill: '',
                                                         residentKtpUrl: '',
                                                         paymentProofUrl: ''
                                                     });
                                                 }}
                                                 className="w-full py-4 bg-white border-2 border-dashed border-[#ff7a00] hover:bg-orange-50/50 rounded-xl flex items-center justify-center gap-2 text-[#ff7a00] font-bold text-xs uppercase tracking-wider transition-all active:scale-98"
                                             >
                                                 <span className="material-symbols-outlined text-sm">add_circle</span>
                                                 Tambah Kamar Baru
                                             </button>`;

const newBtnBlock = `                                             {/* Add New Room Button */}
                                             {(kmListingForm.roomTypes?.length || 0) < (kmListingForm.totalRooms || 0) ? (
                                                 <button 
                                                     type="button"
                                                     onClick={() => {
                                                         setActiveRoomIdx(null); // Deselect existing room
                                                         setTemporaryRoom({
                                                             name: '',
                                                             floor: 'Lantai 1',
                                                             type: '',
                                                             status: '',
                                                             isAvailable: null,
                                                             price: '',
                                                             pricing: [{ period: 'bulanan', price: '' }],
                                                             roomFacilities: [],
                                                             images: [],
                                                             readyDate: '',
                                                             residentName: '',
                                                             residentPhone: '',
                                                             startDate: '',
                                                             endDate: '',
                                                             paymentPeriod: 'bulanan',
                                                             isPaid: true,
                                                             remainingBill: '',
                                                             residentKtpUrl: '',
                                                             paymentProofUrl: ''
                                                         });
                                                     }}
                                                     className="w-full py-4 bg-white border-2 border-dashed border-[#ff7a00] hover:bg-orange-50/50 rounded-xl flex items-center justify-center gap-2 text-[#ff7a00] font-bold text-xs uppercase tracking-wider transition-all active:scale-98"
                                                 >
                                                     <span className="material-symbols-outlined text-sm">add_circle</span>
                                                     Tambah Kamar Baru
                                                 </button>
                                             ) : (
                                                 <div className="text-center py-4 text-[#584235] text-xs font-bold bg-[#fff4eb] rounded-xl border border-dashed border-[#ffe2cc] leading-normal p-3">
                                                     Target jumlah kamar ({kmListingForm.totalRooms}) telah tercapai.
                                                     <br />
                                                     <span className="text-[10px] text-gray-500 font-normal italic">
                                                         * Hapus kamar aktif atau kembali ke Step 1 untuk menaikkan kapasitas kamar properti.
                                                     </span>
                                                 </div>
                                             )}`;

if (content.includes(oldBtnBlock)) {
  content = content.replace(oldBtnBlock, newBtnBlock);
  console.log("Add New Room button block wrapped successfully.");
} else {
  console.log("CRITICAL: oldBtnBlock NOT found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
