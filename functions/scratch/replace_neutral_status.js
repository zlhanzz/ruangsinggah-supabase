const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update the template room object to have status: '' and isAvailable: null
const oldRoomTemplate = `                                                     setTemporaryRoom({
                                                         name: '',
                                                         floor: '',
                                                         type: '',
                                                         status: 'Kosong',
                                                         isAvailable: true,
                                                         price: '',
                                                         roomFacilities: [],
                                                         images: [],
                                                         readyDate: '',
                                                         residentName: '',
                                                         residentPhone: '',
                                                         startDate: '',
                                                         endDate: '',
                                                         residentKtpUrl: '',
                                                         paymentProofUrl: ''
                                                     });`;

const newRoomTemplate = `                                                     setTemporaryRoom({
                                                         name: '',
                                                         floor: '',
                                                         type: '',
                                                         status: '',
                                                         isAvailable: null,
                                                         price: '',
                                                         roomFacilities: [],
                                                         images: [],
                                                         readyDate: '',
                                                         residentName: '',
                                                         residentPhone: '',
                                                         startDate: '',
                                                         endDate: '',
                                                         residentKtpUrl: '',
                                                         paymentProofUrl: ''
                                                     });`;

if (content.includes(oldRoomTemplate)) {
  content = content.replace(oldRoomTemplate, newRoomTemplate);
  console.log("Room template defaults status set to neutral.");
}

// 2. We need to parse and change the temporaryRoom form to wrap the fields in the condition
// Let's locate the temporaryRoom container
const targetTempFormStart = `{/* Detail Kamar Section */}
                                                     <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">`;

const replacementTempFormStart = `{/* Conditional form display based on status selection */}
                                                     {(temporaryRoom.status === 'Terisi' || temporaryRoom.status === 'Kosong') ? (
                                                         <>
                                                             {/* Detail Kamar Section */}
                                                             <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">`;

const targetTempFormEnd = `                                                     {/* Save Button for New Room */}
                                                     <button 
                                                         type="button"
                                                         onClick={() => {
                                                             if (!temporaryRoom.name.trim()) {
                                                                 alert('Silakan isi nomor kamar terlebih dahulu.');
                                                                 return;
                                                             }
                                                             setKmListingForm({
                                                                 ...kmListingForm,
                                                                 roomTypes: [...(kmListingForm.roomTypes || []), temporaryRoom]
                                                             });
                                                             setTemporaryRoom(null);
                                                             alert('Kamar baru berhasil disimpan ke daftar!');
                                                         }}
                                                         className="w-full h-[40px] bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors shadow-sm"
                                                     >
                                                         Simpan Kamar Baru
                                                     </button>
                                                 </div>`;

const replacementTempFormEnd = `                                                             {/* Save Button for New Room */}
                                                             <button 
                                                                 type="button"
                                                                 onClick={() => {
                                                                     if (!temporaryRoom.name.trim()) {
                                                                         alert('Silakan isi nomor kamar terlebih dahulu.');
                                                                         return;
                                                                     }
                                                                     setKmListingForm({
                                                                         ...kmListingForm,
                                                                         roomTypes: [...(kmListingForm.roomTypes || []), temporaryRoom]
                                                                     });
                                                                     setTemporaryRoom(null);
                                                                     alert('Kamar baru berhasil disimpan ke daftar!');
                                                                 }}
                                                                 className="w-full h-[40px] bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors shadow-sm"
                                                             >
                                                                 Simpan Kamar Baru
                                                             </button>
                                                         </>
                                                     ) : (
                                                         <div className="text-center py-8 text-gray-400 text-xs font-bold bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                             Silakan pilih status kamar (Terisi / Kosong) di atas untuk memulai pendataan.
                                                         </div>
                                                     )}
                                                 </div>`;

if (content.includes(targetTempFormStart)) {
  content = content.replace(targetTempFormStart, replacementTempFormStart);
}
if (content.includes(targetTempFormEnd)) {
  content = content.replace(targetTempFormEnd, replacementTempFormEnd);
}

// 3. Make sure the status buttons in temporaryRoom show selected active state properly
const oldStatusButtons = `                                                     {/* Status Kamar */}
                                                     <div>
                                                         <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Status Kamar</h3>
                                                         <div className="flex gap-2">
                                                             <button 
                                                                 type="button"
                                                                 onClick={() => setTemporaryRoom({ ...temporaryRoom, status: 'Terisi', isAvailable: false })}
                                                                 className={\`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center \${(temporaryRoom.isAvailable === false || temporaryRoom.status === 'Terisi') ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}\`}
                                                             >
                                                                 Terisi
                                                             </button>
                                                             <button 
                                                                 type="button"
                                                                 onClick={() => setTemporaryRoom({ ...temporaryRoom, status: 'Kosong', isAvailable: true })}
                                                                 className={\`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center \${(temporaryRoom.isAvailable !== false && temporaryRoom.status !== 'Terisi') ? 'bg-[#ff7a00] text-white border-[#ff7a00] shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}\`}
                                                             >
                                                                 Kosong
                                                             </button>
                                                         </div>
                                                     </div>`;

const newStatusButtons = `                                                     {/* Status Kamar */}
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
                                                     </div>`;

if (content.includes(oldStatusButtons)) {
  content = content.replace(oldStatusButtons, newStatusButtons);
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Successfully updated neutral status and conditional editor visibility.");
