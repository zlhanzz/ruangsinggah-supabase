const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// 1. Insert Total Jumlah Kamar input in Step 1 (under Tipe Kos)
let mapIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("['Putra', 'Putri', 'Campur'].map")) {
    mapIdx = i;
    break;
  }
}

if (mapIdx !== -1) {
  // Find the next closing div
  let closeDivIdx = -1;
  for (let j = mapIdx; j < mapIdx + 20; j++) {
    if (lines[j].includes('</div>')) {
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
    console.log("Inserting Total Jumlah Kamar input after line", closeDivIdx + 1);
    lines.splice(closeDivIdx + 1, 0, totalRoomsInput);
  }
}

// 2. Add Progress Banner in Step 2 under Daftar Kamar header
let headerIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Daftar Kamar') && lines[i].includes('h2') && i > 3000) {
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
  console.log("Inserting Progress Banner after line", headerIdx + 1);
  lines.splice(headerIdx + 1, 0, banner);
}

// 3. Disable Add New Room Button when target is reached
let addRoomBtnIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Tambah Kamar Baru') && lines[i].includes('span') && i > 3200) {
    // Find the enclosing button tag index
    for (let j = i - 5; j <= i; j++) {
      if (lines[j].includes('<button') && lines[j].includes('Add New Room Button')) {
        addRoomBtnIdx = j;
        break;
      }
    }
    if (addRoomBtnIdx !== -1) break;
  }
}

if (addRoomBtnIdx !== -1) {
  // Find where the button closes
  let closeButtonIdx = -1;
  for (let j = addRoomBtnIdx; j < addRoomBtnIdx + 40; j++) {
    if (lines[j].includes('</button>')) {
      closeButtonIdx = j;
      break;
    }
  }
  if (closeButtonIdx !== -1) {
    console.log("Replacing Add New Room button block at lines", addRoomBtnIdx + 1, "to", closeButtonIdx + 1);
    const oldBtnBlock = lines.slice(addRoomBtnIdx, closeButtonIdx + 1).join('\n');
    const newBtnBlock = `                                             {/* Add New Room Button */}
                                             {(kmListingForm.roomTypes?.length || 0) < (kmListingForm.totalRooms || 0) ? (
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
    lines.splice(addRoomBtnIdx, closeButtonIdx - addRoomBtnIdx + 1, newBtnBlock);
  }
}

// 4. Validate totalRooms when clicking Lanjut ke Step 2
let setStep2Idx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('setKmStep(2)') && lines[i].includes('onClick')) {
    setStep2Idx = i;
    break;
  }
}

if (setStep2Idx !== -1) {
  console.log("Replacing setKmStep(2) onClick action at line", setStep2Idx + 1);
  lines[setStep2Idx] = `                                             onClick={() => {
                                                 if (!kmListingForm.totalRooms || kmListingForm.totalRooms < 1) {
                                                     alert('Silakan masukkan total jumlah kamar terlebih dahulu.');
                                                     return;
                                                 }
                                                 setKmStep(2);
                                             }}`;
}

// 5. Restrict step 3 navigation if room types count !== totalRooms
let setStep3BtnIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Lanjut ke Step 3')) {
    for (let j = i - 5; j <= i; j++) {
      if (lines[j].includes('<button')) {
        setStep3BtnIdx = j;
        break;
      }
    }
    if (setStep3BtnIdx !== -1) break;
  }
}

if (setStep3BtnIdx !== -1) {
  // Find where the button closes
  let closeBtn3Idx = -1;
  for (let j = setStep3BtnIdx; j < setStep3BtnIdx + 20; j++) {
    if (lines[j].includes('</button>')) {
      closeBtn3Idx = j;
      break;
    }
  }
  if (closeBtn3Idx !== -1) {
    console.log("Replacing Lanjut ke Step 3 button at lines", setStep3BtnIdx + 1, "to", closeBtn3Idx + 1);
    const newLanjutStep3 = `                                         <button
                                             type="button"
                                             disabled={(kmListingForm.roomTypes?.length || 0) !== (kmListingForm.totalRooms || 0)}
                                             onClick={() => setKmStep(3)}
                                             className={\`flex-[2] h-[48px] rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 \${(kmListingForm.roomTypes?.length || 0) === (kmListingForm.totalRooms || 0) ? 'bg-[#ff7a00] hover:bg-orange-600 text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}\`}
                                         >
                                             {(kmListingForm.roomTypes?.length || 0) !== (kmListingForm.totalRooms || 0) ? 'Kamar Belum Lengkap' : 'Lanjut ke Step 3'}
                                         </button>`;
    lines.splice(setStep3BtnIdx, closeBtn3Idx - setStep3BtnIdx + 1, newLanjutStep3);
  }
}

let finalContent = lines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, finalContent, 'utf8');
console.log("Done implementing target-based room count logic.");
