const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. We will replace the entire Tipe Kamar section in temporaryRoom editor
const oldTempTypeBlock = `<div className="md:col-span-2 flex flex-col gap-1.5">
                                                             <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kamar</label>
                                                             <select 
                                                                 value={temporaryRoom.type || ''}
                                                                 onChange={e => setTemporaryRoom({ ...temporaryRoom, type: e.target.value })}
                                                                 className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                             >
                                                                 <option value="" disabled hidden>Pilih Tipe Kamar</option>
                                                                 <option value="Standard">Standard (3x3m)</option>
                                                                 <option value="Premium">Premium (4x4m)</option>
                                                                 <option value="Deluxe">Deluxe (5x5m)</option>
                                                             </select>
                                                         </div>`;

const newTempTypeBlock = `<div className="md:col-span-2 flex flex-col gap-1.5">
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
                                                         </div>`;

if (content.includes(oldTempTypeBlock)) {
  content = content.replace(oldTempTypeBlock, newTempTypeBlock);
  console.log("Updated Tipe Kamar for temporaryRoom.");
} else {
  console.error("oldTempTypeBlock not found!");
}

// 2. We will replace the entire Tipe Kamar section in activeRoomIdx editor
const oldActiveTypeBlock = `<div className="md:col-span-2 flex flex-col gap-1.5">
                                                                 <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kamar</label>
                                                                 <select 
                                                                     value={rt.type || ''}
                                                                     onChange={e => {
                                                                         const updated = [...kmListingForm.roomTypes];
                                                                         updated[activeRoomIdx] = { ...rt, type: e.target.value };
                                                                         setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                     }}
                                                                     className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                 >
                                                                     <option value="" disabled hidden>Pilih Tipe Kamar</option>
                                                                     <option value="Standard">Standard (3x3m)</option>
                                                                     <option value="Premium">Premium (4x4m)</option>
                                                                     <option value="Deluxe">Deluxe (5x5m)</option>
                                                                 </select>
                                                             </div>`;

const newActiveTypeBlock = `<div className="md:col-span-2 flex flex-col gap-1.5">
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
                                                             </div>`;

if (content.includes(oldActiveTypeBlock)) {
  content = content.replace(oldActiveTypeBlock, newActiveTypeBlock);
  console.log("Updated Tipe Kamar for activeRoomIdx.");
} else {
  console.error("oldActiveTypeBlock not found!");
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Successfully updated Tipe Kamar to allow custom inputs.");
