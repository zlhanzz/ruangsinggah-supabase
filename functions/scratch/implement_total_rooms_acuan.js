const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Insert Total Jumlah Kamar input in Step 1 (under Tipe Kos)
const oldTipeKosBlock = `                                             <div className="flex flex-col gap-1.5">
                                                 <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kos</label>
                                                 <div className="flex bg-[#e5eeff] rounded-xl p-1 gap-1">
                                                     {['Putra', 'Putri', 'Campur'].map(t => (
                                                         <button
                                                             key={t}
                                                             type="button"
                                                             onClick={() => setKmListingForm({ ...kmListingForm, type: t })}
                                                             className={\`flex-1 h-[36px] rounded-lg font-bold text-xs uppercase tracking-wider transition-all \${kmListingForm.type === t ? 'bg-[#ff7a00] text-white shadow-sm' : 'text-[#584235] hover:bg-[#dce9ff]'}\`}
                                                         >
                                                             {t}
                                                         </button>
                                                     ))}
                                                 </div>
                                             </div>`;

const newTipeKosBlock = `                                             <div className="flex flex-col gap-1.5">
                                                 <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kos</label>
                                                 <div className="flex bg-[#e5eeff] rounded-xl p-1 gap-1">
                                                     {['Putra', 'Putri', 'Campur'].map(t => (
                                                         <button
                                                             key={t}
                                                             type="button"
                                                             onClick={() => setKmListingForm({ ...kmListingForm, type: t })}
                                                             className={\`flex-1 h-[36px] rounded-lg font-bold text-xs uppercase tracking-wider transition-all \${kmListingForm.type === t ? 'bg-[#ff7a00] text-white shadow-sm' : 'text-[#584235] hover:bg-[#dce9ff]'}\`}
                                                         >
                                                             {t}
                                                         </button>
                                                     ))}
                                                 </div>
                                             </div>

                                             <div className="flex flex-col gap-1.5">
                                                 <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Total Jumlah Kamar</label>
                                                 <input 
                                                     type="number"
                                                     min="1"
                                                     value={kmListingForm.totalRooms || ''}
                                                     onChange={e => setKmListingForm({ ...kmListingForm, totalRooms: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) })}
                                                     placeholder="Masukkan total jumlah kamar (contoh: 10)"
                                                     className="w-full h-[46px] px-3.5 border border-[#8c7263] rounded-xl bg-[#f8f9ff] focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00] outline-none text-sm font-semibold"
                                                 />
                                             </div>`;

if (content.includes(oldTipeKosBlock)) {
  content = content.replace(oldTipeKosBlock, newTipeKosBlock);
  console.log("Total Jumlah Kamar input added in Step 1.");
} else {
  console.log("CRITICAL: oldTipeKosBlock NOT found!");
}

// 2. Validate totalRooms when clicking Lanjut ke Step 2
const oldLanjutStep2 = `                                        <button
                                            type="button"
                                            onClick={() => setKmStep(2)}
                                            className="flex-[2] h-[48px] bg-[#ff7a00] hover:bg-orange-600 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all"
                                        >
                                            Lanjut ke Step 2
                                        </button>`;

const newLanjutStep2 = `                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!kmListingForm.totalRooms || kmListingForm.totalRooms < 1) {
                                                    alert('Silakan masukkan total jumlah kamar terlebih dahulu.');
                                                    return;
                                                }
                                                setKmStep(2);
                                            }}
                                            className="flex-[2] h-[48px] bg-[#ff7a00] hover:bg-orange-600 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all"
                                        >
                                            Lanjut ke Step 2
                                        </button>`;

if (content.includes(oldLanjutStep2)) {
  content = content.replace(oldLanjutStep2, newLanjutStep2);
  console.log("Step 2 navigation button validation added.");
} else {
  console.log("CRITICAL: oldLanjutStep2 NOT found!");
}

// 3. Add Progress Banner in Step 2 under Daftar Kamar header
const oldDaftarKamarHeader = `                                          {/* Room List Section */}
                                          <div className="space-y-4">
                                              <h2 className="text-xs font-bold text-[#0b1c30] px-1 uppercase tracking-wider">Daftar Kamar</h2>`;

const newDaftarKamarHeader = `                                          {/* Room List Section */}
                                          <div className="space-y-4">
                                              <h2 className="text-xs font-bold text-[#0b1c30] px-1 uppercase tracking-wider">Daftar Kamar</h2>
                                              <div className="flex justify-between items-center bg-[#fff4eb] border border-[#ffe2cc] p-3 rounded-xl">
                                                  <span className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Progres Pendataan Kamar</span>
                                                  <span className={\`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider \${(kmListingForm.roomTypes?.length || 0) === (kmListingForm.totalRooms || 0) ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}\`}>
                                                      {kmListingForm.roomTypes?.length || 0} / {kmListingForm.totalRooms || 0} Kamar
                                                  </span>
                                              </div>`;

if (content.includes(oldDaftarKamarHeader)) {
  content = content.replace(oldDaftarKamarHeader, newDaftarKamarHeader);
  console.log("Progress Banner added in Step 2.");
} else {
  console.log("CRITICAL: oldDaftarKamarHeader NOT found!");
}

// 4. Disable Add New Room Button when target is reached
const oldAddNewRoomButton = `                                             {/* Add New Room Button */}
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

const newAddNewRoomButton = `                                             {/* Add New Room Button */}
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

if (content.includes(oldAddNewRoomButton)) {
  content = content.replace(oldAddNewRoomButton, newAddNewRoomButton);
  console.log("Add New Room button disabled when limit is reached.");
} else {
  console.log("CRITICAL: oldAddNewRoomButton NOT found!");
}

// 5. Restrict step 3 navigation if room types count !== totalRooms
const oldLanjutStep3 = `                                         <button
                                             type="button"
                                             onClick={() => setKmStep(3)}
                                             className="flex-[2] h-[48px] bg-[#ff7a00] hover:bg-orange-600 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all"
                                         >
                                             Lanjut ke Step 3
                                         </button>`;

const newLanjutStep3 = `                                         <button
                                             type="button"
                                             disabled={(kmListingForm.roomTypes?.length || 0) !== (kmListingForm.totalRooms || 0)}
                                             onClick={() => setKmStep(3)}
                                             className={\`flex-[2] h-[48px] rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 \${(kmListingForm.roomTypes?.length || 0) === (kmListingForm.totalRooms || 0) ? 'bg-[#ff7a00] hover:bg-orange-600 text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}\`}
                                         >
                                             {(kmListingForm.roomTypes?.length || 0) !== (kmListingForm.totalRooms || 0) ? 'Kamar Belum Lengkap' : 'Lanjut ke Step 3'}
                                         </button>`;

if (content.includes(oldLanjutStep3)) {
  content = content.replace(oldLanjutStep3, newLanjutStep3);
  console.log("Step 3 navigation button validation added.");
} else {
  console.log("CRITICAL: oldLanjutStep3 NOT found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Done implementing target-based room count logic.");
