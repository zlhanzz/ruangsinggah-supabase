const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// --- PART 1: temporaryRoom REORGANIZATION ---
// We will replace the entire <div className="p-4 space-y-5">... Detail Kamar Section ... </div> block in temporaryRoom
const oldTempBlockPattern = `<div className="p-4 space-y-5">
                                                     {/* Status Kamar */}
                                                     <div>
                                                         <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Status Kamar</h3>
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

                                                     {/* Conditional form display based on status selection */}
                                                     {(temporaryRoom.status === 'Terisi' || temporaryRoom.status === 'Kosong') ? (
                                                         <>
                                                             {/* Detail Kamar Section */}
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
                                                         </div>
                                                     </div>`;

const newTempBlock = `<div className="p-4 space-y-5">
                                                     {/* Detail Kamar Section */}
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

if (content.includes(oldTempBlockPattern)) {
  content = content.replace(oldTempBlockPattern, newTempBlock);
  console.log("temporaryRoom Detail Kamar block replaced.");
} else {
  console.log("CRITICAL: oldTempBlockPattern NOT found!");
}

// Replace the end of temporaryRoom conditional block:
const oldTempEndPattern = `                                                          </>
                                                      ) : (
                                                          <div className="text-center py-8 text-gray-400 text-xs font-bold bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                              Silakan pilih status kamar (Terisi / Kosong) di atas untuk memulai pendataan.
                                                          </div>
                                                      )}
                                                  </div>`;

const newTempEnd = `                                                          </>
                                                      )}
                                                  </div>`;

if (content.includes(oldTempEndPattern)) {
  content = content.replace(oldTempEndPattern, newTempEnd);
  console.log("temporaryRoom conditional end block replaced.");
} else {
  console.log("CRITICAL: oldTempEndPattern NOT found!");
}


// --- PART 2: activeRoomIdx / rt REORGANIZATION ---
const oldActiveBlockPattern = `<div className="p-4 space-y-5">
                                                          {/* Status Kamar */}
                                                          <div>
                                                              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Status Kamar</h3>
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

                                                          {/* Detail Kamar Section */}
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
                                                              </div>
                                                          </div>`;

const newActiveBlock = `<div className="p-4 space-y-5">
                                                          {/* Detail Kamar Section */}
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

if (content.includes(oldActiveBlockPattern)) {
  content = content.replace(oldActiveBlockPattern, newActiveBlock);
  console.log("activeRoomIdx Detail Kamar block replaced.");
} else {
  console.log("CRITICAL: oldActiveBlockPattern NOT found!");
}

// For activeRoomIdx end of conditional block:
const oldActiveEndPattern = `                                                          {/* Simpan Perubahan Button */}
                                                          <button 
                                                              type="button"
                                                              onClick={() => {
                                                                  setActiveRoomIdx(null);
                                                                  alert('Perubahan kamar berhasil disimpan!');
                                                              }}
                                                              className="w-full h-[40px] bg-[#eff4ff] hover:bg-[#dce9ff] text-[#264191] font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors border border-[#d3e4fe] shadow-sm"
                                                          >
                                                              Selesai & Tutup Editor
                                                          </button>
                                                      </div>`;

const newActiveEnd = `                                                          </>
                                                          )}

                                                          {/* Simpan Perubahan Button */}
                                                          <button 
                                                              type="button"
                                                              onClick={() => {
                                                                  setActiveRoomIdx(null);
                                                                  alert('Perubahan kamar berhasil disimpan!');
                                                              }}
                                                              className="w-full h-[40px] bg-[#eff4ff] hover:bg-[#dce9ff] text-[#264191] font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors border border-[#d3e4fe] shadow-sm"
                                                          >
                                                              Selesai & Tutup Editor
                                                          </button>
                                                      </div>`;

if (content.includes(oldActiveEndPattern)) {
  content = content.replace(oldActiveEndPattern, newActiveEnd);
  console.log("activeRoomIdx conditional end block replaced.");
} else {
  console.log("CRITICAL: oldActiveEndPattern NOT found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Done reorganizing Detail Kamar flow.");
