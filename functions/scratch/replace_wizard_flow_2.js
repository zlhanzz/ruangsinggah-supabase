const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Declare activeRoomIdx state variable
const stateTarget = `    const [googleMapsUrlInput, setGoogleMapsUrlInput] = useState('');
    const [showAddLandmarkForm, setShowAddLandmarkForm] = useState(false);`;

const stateReplacement = `    const [googleMapsUrlInput, setGoogleMapsUrlInput] = useState('');
    const [showAddLandmarkForm, setShowAddLandmarkForm] = useState(false);
    const [activeRoomIdx, setActiveRoomIdx] = useState<number | null>(null);`;

if (content.includes(stateTarget) && !content.includes('activeRoomIdx')) {
  content = content.replace(stateTarget, stateReplacement);
  console.log("activeRoomIdx state declared.");
}

// 2. Locate and replace kmStep === 2 block in AgentDashboard.tsx
// Let's read from lines 3172 to 3453 to replace it exactly.
const startIdx = content.indexOf('{/* STEP 2: DATA KAMAR */}');
const endIdx = content.indexOf('{/* STEP 3: REVIEW */}');

if (startIdx !== -1 && endIdx !== -1) {
  const oldStep2Block = content.substring(startIdx, endIdx);
  
  const newStep2Block = `{/* STEP 2: DATA KAMAR */}
                                {kmStep === 2 && (
                                     <div className="space-y-6">
                                         {/* Room List Section */}
                                         <div className="space-y-4">
                                             <h2 className="text-xs font-bold text-[#0b1c30] px-1 uppercase tracking-wider">Daftar Kamar</h2>
                                             <div className="grid grid-cols-1 gap-3">
                                                 {(!kmListingForm.roomTypes || kmListingForm.roomTypes.length === 0) ? (
                                                     <div className="text-center py-6 text-gray-500 text-xs bg-white rounded-xl border border-dashed border-gray-300">
                                                         Belum ada kamar yang ditambahkan. Silakan klik tombol di bawah untuk menambah kamar.
                                                     </div>
                                                 ) : (
                                                     kmListingForm.roomTypes.map((rt: any, idx: number) => {
                                                         const isOccupied = rt.isAvailable === false || rt.status === 'Terisi';
                                                         const isActive = activeRoomIdx === idx;
                                                         return (
                                                             <div 
                                                                 key={idx} 
                                                                 onClick={() => setActiveRoomIdx(idx)}
                                                                 className={\`bg-white hover:shadow-md rounded-xl p-4 border transition-all flex justify-between items-center cursor-pointer \${isActive ? 'border-[#ff7a00] ring-1 ring-[#ff7a00]' : 'border-gray-200'}\`}
                                                             >
                                                                 <div className="flex items-center gap-3">
                                                                     <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-[#ff7a00]">
                                                                         <span className="material-symbols-outlined">bed</span>
                                                                     </div>
                                                                     <div>
                                                                         <p className="text-xs font-bold text-gray-900">{rt.name || \`Kamar \${idx + 1}\`}</p>
                                                                         <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                                                                             {rt.floor || 'Lantai 1'} • {rt.type || 'Standard'}
                                                                         </p>
                                                                     </div>
                                                                 </div>
                                                                 <div className="flex items-center gap-2">
                                                                     {isOccupied ? (
                                                                         <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider border border-green-200">Terisi</span>
                                                                     ) : (
                                                                         <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black uppercase tracking-wider border border-orange-200">Kosong</span>
                                                                     )}
                                                                     <button
                                                                         type="button"
                                                                         onClick={(e) => {
                                                                             e.stopPropagation();
                                                                             const updated = kmListingForm.roomTypes.filter((_: any, rIdx: number) => rIdx !== idx);
                                                                             setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                             if (activeRoomIdx === idx) {
                                                                                 setActiveRoomIdx(null);
                                                                             } else if (activeRoomIdx !== null && activeRoomIdx > idx) {
                                                                                 setActiveRoomIdx(activeRoomIdx - 1);
                                                                             }
                                                                         }}
                                                                         className="text-red-500 hover:text-red-700 p-1.5 rounded-lg"
                                                                     >
                                                                         <span className="material-symbols-outlined text-base">delete</span>
                                                                     </button>
                                                                 </div>
                                                             </div>
                                                         );
                                                     })
                                                 )}
                                             </div>
                                             
                                             {/* Add New Room Button */}
                                             <button 
                                                 type="button"
                                                 onClick={() => {
                                                     const newRoom = {
                                                         name: \`Kamar \${ (kmListingForm.roomTypes || []).length + 101 }\`,
                                                         floor: 'Lantai 1',
                                                         type: 'Standard',
                                                         status: 'Kosong',
                                                         isAvailable: true,
                                                         price: kmListingForm.price || 1000000,
                                                         roomFacilities: ['Kasur', 'Lemari'],
                                                         images: []
                                                     };
                                                     const updated = [...(kmListingForm.roomTypes || []), newRoom];
                                                     setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                     setActiveRoomIdx(updated.length - 1);
                                                 }}
                                                 className="w-full py-4 bg-white border-2 border-dashed border-[#ff7a00] hover:bg-orange-50/50 rounded-xl flex items-center justify-center gap-2 text-[#ff7a00] font-bold text-xs uppercase tracking-wider transition-all active:scale-98"
                                             >
                                                 <span className="material-symbols-outlined text-sm">add_circle</span>
                                                 Tambah Kamar Baru
                                             </button>
                                         </div>

                                         {/* Active Entry: Detail Kamar Card */}
                                         {activeRoomIdx !== null && kmListingForm.roomTypes?.[activeRoomIdx] && (() => {
                                             const rt = kmListingForm.roomTypes[activeRoomIdx];
                                             const isOccupied = rt.isAvailable === false || rt.status === 'Terisi';
                                             return (
                                                 <div className="bg-white rounded-xl border-2 border-[#ff7a00] overflow-hidden shadow-md transition-all">
                                                     <div className="bg-[#fff4eb] p-4 flex justify-between items-center border-b border-[#ffe2cc]">
                                                         <h2 className="text-xs font-black uppercase text-[#ff7a00] tracking-wider">Detail Kamar Baru</h2>
                                                         <button 
                                                             type="button"
                                                             onClick={() => setActiveRoomIdx(null)}
                                                             className="text-[#ff7a00] hover:bg-[#ffe2cc] rounded-full p-1 transition-all active:scale-90 flex items-center justify-center"
                                                         >
                                                             <span className="material-symbols-outlined text-base font-bold">close</span>
                                                         </button>
                                                     </div>
                                                     <div className="p-4 space-y-5">
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

                                                         {/* Form Fields */}
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
                                                                     value={rt.floor || 'Lantai 1'}
                                                                     onChange={e => {
                                                                         const updated = [...kmListingForm.roomTypes];
                                                                         updated[activeRoomIdx] = { ...rt, floor: e.target.value };
                                                                         setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                     }}
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
                                                                     value={rt.type || 'Standard'}
                                                                     onChange={e => {
                                                                         const updated = [...kmListingForm.roomTypes];
                                                                         updated[activeRoomIdx] = { ...rt, type: e.target.value };
                                                                         setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                     }}
                                                                     className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                 >
                                                                     <option value="Standard">Standard (3x3m)</option>
                                                                     <option value="Premium">Premium (4x4m)</option>
                                                                     <option value="Deluxe">Deluxe (5x5m)</option>
                                                                 </select>
                                                             </div>
                                                         </div>

                                                         {/* Fasilitas Kamar */}
                                                         <div>
                                                             <h3 className="text-[11px] font-bold text-[#584235] uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">Fasilitas Kamar</h3>
                                                             <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                                                                 {['Kasur', 'Lemari', 'AC', 'Kamar Mandi Dalam'].map(fac => {
                                                                     const isChecked = rt.roomFacilities?.includes(fac);
                                                                     return (
                                                                         <label key={fac} className="flex items-center gap-2.5 cursor-pointer">
                                                                             <input 
                                                                                 type="checkbox"
                                                                                 checked={isChecked}
                                                                                 onChange={() => {
                                                                                     const current = rt.roomFacilities || [];
                                                                                     const updated = current.includes(fac)
                                                                                         ? current.filter((f: string) => f !== fac)
                                                                                         : [...current, fac];
                                                                                     const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                     updatedRoomTypes[activeRoomIdx] = { ...rt, roomFacilities: updated };
                                                                                     setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                 }}
                                                                                 className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-5 h-5"
                                                                             />
                                                                             <span className="text-xs text-gray-700 uppercase tracking-wider font-semibold">{fac}</span>
                                                                         </label>
                                                                     );
                                                                 })}
                                                             </div>
                                                         </div>

                                                         {/* Foto Kamar */}
                                                         <div>
                                                             <h3 className="text-[11px] font-bold text-[#584235] uppercase tracking-wider mb-2">Foto Kamar</h3>
                                                             <div className="grid grid-cols-2 gap-3">
                                                                 {/* Interior Photo */}
                                                                 {rt.images?.[0] ? (
                                                                     <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 relative group">
                                                                         <img src={rt.images[0]} alt="Interior" className="w-full h-full object-cover" />
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => {
                                                                                 const updatedImages = [...rt.images];
                                                                                 updatedImages[0] = '';
                                                                                 const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                 updatedRoomTypes[activeRoomIdx] = { ...rt, images: updatedImages };
                                                                                 setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                             }}
                                                                             className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md"
                                                                         >
                                                                             &times;
                                                                         </button>
                                                                     </div>
                                                                 ) : (
                                                                     <div 
                                                                         onClick={async () => {
                                                                             const input = document.createElement('input');
                                                                             input.type = 'file';
                                                                             input.accept = 'image/*';
                                                                             input.onchange = async (e: any) => {
                                                                                 const file = e.target?.files?.[0];
                                                                                 if (file) {
                                                                                     setUploadingRooms(prev => ({ ...prev, [activeRoomIdx]: true }));
                                                                                     try {
                                                                                         const folder = \`kostmanager/rooms/\${Date.now()}\`;
                                                                                         const publicUrl = await uploadFileAndGetURL(file, folder);
                                                                                         const updatedImages = [...(rt.images || [])];
                                                                                         updatedImages[0] = publicUrl;
                                                                                         const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                         updatedRoomTypes[activeRoomIdx] = { ...rt, images: updatedImages };
                                                                                         setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                     } catch (err) {
                                                                                         alert('Gagal unggah foto: ' + (err as Error).message);
                                                                                     } finally {
                                                                                         setUploadingRooms(prev => ({ ...prev, [activeRoomIdx]: false }));
                                                                                     }
                                                                                 }
                                                                             };
                                                                             input.click();
                                                                         }}
                                                                         className="bg-white border-2 border-dashed border-[#ff7a00] rounded-xl flex flex-col items-center justify-center p-4 h-24 cursor-pointer hover:bg-orange-50/30 transition-all"
                                                                     >
                                                                         {uploadingRooms[activeRoomIdx] ? (
                                                                             <span className="text-[10px] font-bold animate-pulse text-gray-500">Uploading...</span>
                                                                         ) : (
                                                                             <>
                                                                                 <span className="material-symbols-outlined text-[#ff7a00] text-xl">add_a_photo</span>
                                                                                 <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff7a00] mt-1">Interior</span>
                                                                             </>
                                                                         )}
                                                                     </div>
                                                                 )}

                                                                 {/* Bathroom Photo */}
                                                                 {rt.images?.[1] ? (
                                                                     <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 relative group">
                                                                         <img src={rt.images[1]} alt="Bathroom" className="w-full h-full object-cover" />
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => {
                                                                                 const updatedImages = [...rt.images];
                                                                                 updatedImages[1] = '';
                                                                                 const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                 updatedRoomTypes[activeRoomIdx] = { ...rt, images: updatedImages };
                                                                                 setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                             }}
                                                                             className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md"
                                                                         >
                                                                             &times;
                                                                         </button>
                                                                     </div>
                                                                 ) : (
                                                                     <div 
                                                                         onClick={async () => {
                                                                             const input = document.createElement('input');
                                                                             input.type = 'file';
                                                                             input.accept = 'image/*';
                                                                             input.onchange = async (e: any) => {
                                                                                 const file = e.target?.files?.[0];
                                                                                 if (file) {
                                                                                     setUploadingRooms(prev => ({ ...prev, [activeRoomIdx]: true }));
                                                                                     try {
                                                                                         const folder = \`kostmanager/rooms/\${Date.now()}\`;
                                                                                         const publicUrl = await uploadFileAndGetURL(file, folder);
                                                                                         const updatedImages = [...(rt.images || [])];
                                                                                         updatedImages[1] = publicUrl;
                                                                                         const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                         updatedRoomTypes[activeRoomIdx] = { ...rt, images: updatedImages };
                                                                                         setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                     } catch (err) {
                                                                                         alert('Gagal unggah foto: ' + (err as Error).message);
                                                                                     } finally {
                                                                                         setUploadingRooms(prev => ({ ...prev, [activeRoomIdx]: false }));
                                                                                     }
                                                                                 }
                                                                             };
                                                                             input.click();
                                                                         }}
                                                                         className="bg-white border-2 border-dashed border-[#ff7a00] rounded-xl flex flex-col items-center justify-center p-4 h-24 cursor-pointer hover:bg-orange-50/30 transition-all"
                                                                     >
                                                                         {uploadingRooms[activeRoomIdx] ? (
                                                                             <span className="text-[10px] font-bold animate-pulse text-gray-500">Uploading...</span>
                                                                         ) : (
                                                                             <>
                                                                                 <span className="material-symbols-outlined text-[#ff7a00] text-xl">bathtub</span>
                                                                                 <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff7a00] mt-1">Kamar Mandi</span>
                                                                             </>
                                                                         )}
                                                                     </div>
                                                                 )}
                                                             </div>
                                                         </div>
                                                     </div>
                                                 </div>
                                             );
                                         })()}
                                     </div>
                                 )}`;

  content = content.replace(oldStep2Block, newStep2Block);
  console.log("Successfully replaced step 2 wizard block!");
} else {
  console.error("Could not locate step 2 start or step 3 start comments!");
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
