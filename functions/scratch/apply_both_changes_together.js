const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
let lines = content.split('\n');

// ==========================================
// ACTION 1: REORGANIZE STATUS INSIDE DETAIL KAMAR
// ==========================================

// 1.1 temporaryRoom (Index 3340 to 3424 in original)
const tempStatusStart = 3340;
const tempDetailEnd = 3424;

const newTempDetailContainer = `                                                     {/* Detail Kamar Section */}
                                                     <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-1">Detail Kamar</span>
                                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                             <div className="flex flex-col gap-1.5">
                                                                 <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Nomor Kamar</label>
                                                                 <input 
                                                                     type="text"
                                                                     value={temporaryRoom.name || ''}
                                                                     onChange={e => setTemporaryRoom({ ...temporaryRoom, name: e.target.value })}
                                                                     className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                     placeholder="Nomor Kamar"
                                                                 />
                                                             </div>
                                                             <div className="flex flex-col gap-1.5">
                                                                 <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Lantai</label>
                                                                 <select 
                                                                     value={temporaryRoom.floor || 'Lantai 1'}
                                                                     onChange={e => setTemporaryRoom({ ...temporaryRoom, floor: e.target.value })}
                                                                     className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                 >
                                                                     <option value="Lantai 1">Lantai 1</option>
                                                                     <option value="Lantai 2">Lantai 2</option>
                                                                     <option value="Lantai 3">Lantai 3</option>
                                                                     <option value="Lantai 4">Lantai 4</option>
                                                                 </select>
                                                             </div>
                                                             <div className="md:col-span-2 flex flex-col gap-1.5">
                                                                 <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kamar</label>
                                                                 <select 
                                                                     value={['Standard', 'Premium', 'Deluxe', ''].includes(temporaryRoom.type || '') ? (temporaryRoom.type || '') : '__custom__'}
                                                                     onChange={e => {
                                                                         const val = e.target.value;
                                                                         if (val === '__custom__') {
                                                                             setTemporaryRoom({ ...temporaryRoom, type: 'Kustom' });
                                                                         } else {
                                                                             setTemporaryRoom({ ...temporaryRoom, type: val });
                                                                         }
                                                                     }}
                                                                     className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                 >
                                                                     <option value="" disabled hidden>Pilih Tipe Kamar</option>
                                                                     <option value="Standard">Standard</option>
                                                                     <option value="Premium">Premium</option>
                                                                     <option value="Deluxe">Deluxe</option>
                                                                     <option value="__custom__">Tipe Kustom...</option>
                                                                 </select>
                                                                 {!['Standard', 'Premium', 'Deluxe', ''].includes(temporaryRoom.type || '') && (
                                                                     <div className="mt-1.5">
                                                                         <input 
                                                                             type="text"
                                                                             value={temporaryRoom.type === 'Kustom' ? '' : temporaryRoom.type}
                                                                             onChange={e => setTemporaryRoom({ ...temporaryRoom, type: e.target.value })}
                                                                             placeholder="Masukkan tipe kamar kustom..."
                                                                             className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                         />
                                                                     </div>
                                                                 )}
                                                             </div>
                                                             
                                                             {/* Status Kamar (Last Input) */}
                                                             <div className="md:col-span-2 flex flex-col gap-1.5 mt-2 border-t border-gray-100 pt-3">
                                                                 <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Status Kamar</label>
                                                                 <div className="flex gap-2">
                                                                     <button 
                                                                         type="button"
                                                                         onClick={() => setTemporaryRoom({ ...temporaryRoom, status: 'Terisi', isAvailable: false })}
                                                                         className={\`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center \${(temporaryRoom.status === 'Terisi') ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}\`}
                                                                     >
                                                                         Terisi
                                                                     </button>
                                                                     <button 
                                                                         type="button"
                                                                         onClick={() => setTemporaryRoom({ ...temporaryRoom, status: 'Kosong', isAvailable: true })}
                                                                         className={\`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center \${(temporaryRoom.status === 'Kosong') ? 'bg-[#ff7a00] text-white border-[#ff7a00] shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}\`}
                                                                     >
                                                                         Kosong
                                                                     </button>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     </div>

                                                     {/* Conditional form display based on detail fields completed */}
                                                     {!!(temporaryRoom.name?.trim() && (temporaryRoom.floor || 'Lantai 1') && temporaryRoom.type && temporaryRoom.type !== 'Kustom' && temporaryRoom.status) && (
                                                         <>`;

lines.splice(tempStatusStart, tempDetailEnd - tempStatusStart, newTempDetailContainer);

let newSilakanIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Silakan pilih status kamar (Terisi / Kosong)')) {
    newSilakanIdx = i;
    break;
  }
}

if (newSilakanIdx !== -1) {
  lines.splice(newSilakanIdx - 3, 6, `                                                         </>\n                                                     )}`);
}

// 1.2 activeRoomIdx (rt)
let midContent = lines.join('\n');
const lines2 = midContent.split('\n');

let activeStatusStart = -1;
let activeDetailEnd = -1;

for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('Status Kamar') && lines2[i].includes('h3') && i > 4000) {
    activeStatusStart = i - 1;
    break;
  }
}

for (let i = activeStatusStart; i < lines2.length; i++) {
  if (lines2[i].includes('Skema Tarif / Harga Kamar Section') && i > 4000) {
    activeDetailEnd = i - 1;
    break;
  }
}

const newActiveDetailContainer = `                                                          {/* Detail Kamar Section */}
                                                          <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-1">Detail Kamar</span>
                                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                  <div className="flex flex-col gap-1.5">
                                                                      <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Nomor Kamar</label>
                                                                      <input 
                                                                          type="text"
                                                                          value={rt.name || ''}
                                                                          onChange={e => {
                                                                              const updated = [...kmListingForm.roomTypes];
                                                                              updated[activeRoomIdx] = { ...rt, name: e.target.value };
                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                          }}
                                                                          className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                          placeholder="Nomor Kamar"
                                                                      />
                                                                  </div>
                                                                  <div className="flex flex-col gap-1.5">
                                                                      <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Lantai</label>
                                                                      <select 
                                                                          value={rt.floor || ''}
                                                                          onChange={e => {
                                                                              const updated = [...kmListingForm.roomTypes];
                                                                              updated[activeRoomIdx] = { ...rt, floor: e.target.value };
                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                          }}
                                                                          className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                      >
                                                                          <option value="" disabled hidden>Pilih Lantai</option>
                                                                          <option value="Lantai 1">Lantai 1</option>
                                                                          <option value="Lantai 2">Lantai 2</option>
                                                                          <option value="Lantai 3">Lantai 3</option>
                                                                          <option value="Lantai 4">Lantai 4</option>
                                                                      </select>
                                                                  </div>
                                                                  <div className="md:col-span-2 flex flex-col gap-1.5">
                                                                      <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kamar</label>
                                                                      <select 
                                                                          value={['Standard', 'Premium', 'Deluxe', ''].includes(rt.type || '') ? (rt.type || '') : '__custom__'}
                                                                          onChange={e => {
                                                                              const val = e.target.value;
                                                                              const updated = [...kmListingForm.roomTypes];
                                                                              if (val === '__custom__') {
                                                                                  updated[activeRoomIdx] = { ...rt, type: 'Kustom' };
                                                                              } else {
                                                                                  updated[activeRoomIdx] = { ...rt, type: val };
                                                                              }
                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                          }}
                                                                          className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                      >
                                                                          <option value="" disabled hidden>Pilih Tipe Kamar</option>
                                                                          <option value="Standard">Standard</option>
                                                                          <option value="Premium">Premium</option>
                                                                          <option value="Deluxe">Deluxe</option>
                                                                          <option value="__custom__">Tipe Kustom...</option>
                                                                      </select>
                                                                      {!['Standard', 'Premium', 'Deluxe', ''].includes(rt.type || '') && (
                                                                          <div className="mt-1.5">
                                                                              <input 
                                                                                  type="text"
                                                                                  value={rt.type === 'Kustom' ? '' : rt.type}
                                                                                  onChange={e => {
                                                                                      const updated = [...kmListingForm.roomTypes];
                                                                                      updated[activeRoomIdx] = { ...rt, type: e.target.value };
                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                  }}
                                                                                  placeholder="Masukkan tipe kamar kustom..."
                                                                                  className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                              />
                                                                          </div>
                                                                      )}
                                                                  </div>
                                                                  
                                                                  {/* Status Kamar (Last Input) */}
                                                                  <div className="md:col-span-2 flex flex-col gap-1.5 mt-2 border-t border-gray-100 pt-3">
                                                                      <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Status Kamar</label>
                                                                      <div className="flex gap-2">
                                                                          <button 
                                                                              type="button"
                                                                              onClick={() => {
                                                                                  const updated = [...kmListingForm.roomTypes];
                                                                                  updated[activeRoomIdx] = { ...rt, status: 'Terisi', isAvailable: false };
                                                                                  setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                              }}
                                                                              className={\`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center \${isOccupied ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}\`}
                                                                          >
                                                                              Terisi
                                                                          </button>
                                                                          <button 
                                                                              type="button"
                                                                              onClick={() => {
                                                                                  const updated = [...kmListingForm.roomTypes];
                                                                                  updated[activeRoomIdx] = { ...rt, status: 'Kosong', isAvailable: true };
                                                                                  setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                              }}
                                                                              className={\`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center \${!isOccupied ? 'bg-[#ff7a00] text-white border-[#ff7a00] shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}\`}
                                                                          >
                                                                              Kosong
                                                                          </button>
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          </div>

                                                          {/* Conditional form display based on detail fields completed */}
                                                          {!!(rt.name?.trim() && rt.floor && rt.type && rt.type !== 'Kustom' && rt.status) && (
                                                              <>`;

if (activeStatusStart !== -1 && activeDetailEnd !== -1) {
  lines2.splice(activeStatusStart, activeDetailEnd - activeStatusStart + 1, newActiveDetailContainer);
  
  // Find where "Simpan Perubahan Button" starts in shifted lines
  let newSelesaiIdx = -1;
  for (let i = 0; i < lines2.length; i++) {
    if (lines2[i].includes('Simpan Perubahan Button') && i > 4000) {
      newSelesaiIdx = i;
      break;
    }
  }
  
  if (newSelesaiIdx !== -1) {
    lines2.splice(newSelesaiIdx, 0, `                                                          </>\n                                                          )}`);
  }
}

// ==========================================
// ACTION 2: IMPLEMENT TOTAL ROOMS RESTRICTION
// ==========================================
let mapIdx = -1;
for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes("['Putra', 'Putri', 'Campur'].map")) {
    mapIdx = i;
    break;
  }
}

if (mapIdx !== -1) {
  let closeDivIdx = -1;
  for (let j = mapIdx; j < mapIdx + 20; j++) {
    if (lines2[j].includes('</div>')) {
      closeDivIdx = j;
      break;
    }
  }
  if (closeDivIdx !== -1) {
    const totalRoomsInput = `                                             <div className="flex flex-col gap-1.5">
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
    lines2.splice(closeDivIdx + 1, 0, totalRoomsInput);
  }
}

let headerIdx = -1;
for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('Daftar Kamar') && lines2[i].includes('h2') && i > 3000) {
    headerIdx = i;
    break;
  }
}

if (headerIdx !== -1) {
  const banner = `                                              <div className="flex justify-between items-center bg-[#fff4eb] border border-[#ffe2cc] p-3 rounded-xl">
                                                  <span className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Progres Pendataan Kamar</span>
                                                  <span className={\`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider \${(kmListingForm.roomTypes?.length || 0) === (kmListingForm.totalRooms || 0) ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}\`}>
                                                      {kmListingForm.roomTypes?.length || 0} / {kmListingForm.totalRooms || 0} Kamar
                                                  </span>
                                              </div>`;
  lines2.splice(headerIdx + 1, 0, banner);
}

// Enclose Add New Room Button in a conditional block
let addRoomBtnIdx = -1;
for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('Add New Room Button') && i > 3200) {
    addRoomBtnIdx = i;
    break;
  }
}

if (addRoomBtnIdx !== -1) {
  let closeButtonIdx = -1;
  for (let j = addRoomBtnIdx; j < addRoomBtnIdx + 45; j++) {
    if (lines2[j].includes('</button>')) {
      closeButtonIdx = j;
      break;
    }
  }
  if (closeButtonIdx !== -1) {
    const oldBtnLines = lines2.slice(addRoomBtnIdx + 1, closeButtonIdx + 1);
    const oldBtnBlock = oldBtnLines.join('\n');
    const newBtnBlock = `                                             {(kmListingForm.roomTypes?.length || 0) < (kmListingForm.totalRooms || 0) ? (
${oldBtnBlock}
                                             ) : (
                                                 <div className="text-center py-4 text-[#584235] text-xs font-bold bg-[#fff4eb] rounded-xl border border-dashed border-[#ffe2cc] leading-normal p-3">
                                                     Target jumlah kamar ({kmListingForm.totalRooms}) telah tercapai.
                                                     <br />
                                                     <span className="text-[10px] text-gray-500 font-normal italic">
                                                         * Hapus kamar aktif atau kembali ke Step 1 untuk menaikkan kapasitas kamar properti.
                                                     </span>
                                                 </div>
                                             )}`;
    lines2.splice(addRoomBtnIdx + 1, closeButtonIdx - addRoomBtnIdx, newBtnBlock);
  }
}

let setStep2Idx = -1;
for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('setKmStep(2)') && lines2[i].includes('onClick') && i > 4500) {
    setStep2Idx = i;
    break;
  }
}

if (setStep2Idx !== -1) {
  lines2[setStep2Idx] = `                                             onClick={() => {
                                                 if (!kmListingForm.totalRooms || kmListingForm.totalRooms < 1) {
                                                     alert('Silakan masukkan total jumlah kamar terlebih dahulu.');
                                                     return;
                                                 }
                                                 setKmStep(2);
                                             }}`;
}

let setStep3BtnIdx = -1;
for (let i = 0; i < lines2.length; i++) {
  if (lines2[i].includes('Lanjut ke Step 3') && i > 4500) {
    for (let j = i - 10; j <= i; j++) {
      if (lines2[j].includes('<button')) {
        setStep3BtnIdx = j;
        break;
      }
    }
    if (setStep3BtnIdx !== -1) break;
  }
}

if (setStep3BtnIdx !== -1) {
  let closeBtn3Idx = -1;
  for (let j = setStep3BtnIdx; j < setStep3BtnIdx + 20; j++) {
    if (lines2[j].includes('</button>')) {
      closeBtn3Idx = j;
      break;
    }
  }
  if (closeBtn3Idx !== -1) {
    const newLanjutStep3 = `                                         <button
                                             type="button"
                                             disabled={(kmListingForm.roomTypes?.length || 0) !== (kmListingForm.totalRooms || 0)}
                                             onClick={() => setKmStep(3)}
                                             className={\`flex-[2] h-[48px] rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 \${(kmListingForm.roomTypes?.length || 0) === (kmListingForm.totalRooms || 0) ? 'bg-[#ff7a00] hover:bg-orange-600 text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}\`}
                                         >
                                             {(kmListingForm.roomTypes?.length || 0) !== (kmListingForm.totalRooms || 0) ? 'Kamar Belum Lengkap' : 'Lanjut ke Step 3'}
                                         </button>`;
    lines2.splice(setStep3BtnIdx, closeBtn3Idx - setStep3BtnIdx + 1, newLanjutStep3);
  }
}

let finalContent = lines2.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Both features combined successfully with flexible indices!");
