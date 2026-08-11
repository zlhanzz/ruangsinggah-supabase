const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update the template room object in "+ Tambah Kamar Baru" button
const oldRoomTemplate = `                                                     setTemporaryRoom({
                                                         name: \`Kamar \${ (kmListingForm.roomTypes || []).length + 101 }\`,
                                                         floor: 'Lantai 1',
                                                         type: 'Standard',
                                                         status: 'Kosong',
                                                         isAvailable: true,
                                                         price: kmListingForm.price || 1500000,
                                                         roomFacilities: ['Kasur', 'Lemari'],
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

if (content.includes(oldRoomTemplate)) {
  content = content.replace(oldRoomTemplate, newRoomTemplate);
  console.log("Room template defaults cleared.");
} else {
  console.error("oldRoomTemplate not found!");
}

// 2. Add Select Placeholders in temporaryRoom editor
const oldTempFloorSelect = `<select 
                                                                 value={temporaryRoom.floor || 'Lantai 1'}
                                                                 onChange={e => setTemporaryRoom({ ...temporaryRoom, floor: e.target.value })}
                                                                 className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                             >
                                                                 <option value="Lantai 1">Lantai 1</option>`;

const newTempFloorSelect = `<select 
                                                                 value={temporaryRoom.floor || ''}
                                                                 onChange={e => setTemporaryRoom({ ...temporaryRoom, floor: e.target.value })}
                                                                 className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                             >
                                                                 <option value="" disabled hidden>Pilih Lantai</option>
                                                                 <option value="Lantai 1">Lantai 1</option>`;

const oldTempTypeSelect = `<select 
                                                                 value={temporaryRoom.type || 'Standard'}
                                                                 onChange={e => setTemporaryRoom({ ...temporaryRoom, type: e.target.value })}
                                                                 className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                             >
                                                                 <option value="Standard">Standard (3x3m)</option>`;

const newTempTypeSelect = `<select 
                                                                 value={temporaryRoom.type || ''}
                                                                 onChange={e => setTemporaryRoom({ ...temporaryRoom, type: e.target.value })}
                                                                 className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                             >
                                                                 <option value="" disabled hidden>Pilih Tipe Kamar</option>
                                                                 <option value="Standard">Standard (3x3m)</option>`;

if (content.includes(oldTempFloorSelect)) {
  content = content.replace(oldTempFloorSelect, newTempFloorSelect);
}
if (content.includes(oldTempTypeSelect)) {
  content = content.replace(oldTempTypeSelect, newTempTypeSelect);
}

// 3. Add Select Placeholders in activeRoomIdx editor
const oldActiveFloorSelect = `<select 
                                                                         value={rt.floor || 'Lantai 1'}
                                                                         onChange={e => {
                                                                             const updated = [...kmListingForm.roomTypes];
                                                                             updated[activeRoomIdx] = { ...rt, floor: e.target.value };
                                                                             setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                         }}
                                                                         className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                     >
                                                                         <option value="Lantai 1">Lantai 1</option>`;

const newActiveFloorSelect = `<select 
                                                                         value={rt.floor || ''}
                                                                         onChange={e => {
                                                                             const updated = [...kmListingForm.roomTypes];
                                                                             updated[activeRoomIdx] = { ...rt, floor: e.target.value };
                                                                             setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                         }}
                                                                         className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                     >
                                                                         <option value="" disabled hidden>Pilih Lantai</option>
                                                                         <option value="Lantai 1">Lantai 1</option>`;

const oldActiveTypeSelect = `<select 
                                                                         value={rt.type || 'Standard'}
                                                                         onChange={e => {
                                                                             const updated = [...kmListingForm.roomTypes];
                                                                             updated[activeRoomIdx] = { ...rt, type: e.target.value };
                                                                             setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                         }}
                                                                         className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                     >
                                                                         <option value="Standard">Standard (3x3m)</option>`;

const newActiveTypeSelect = `<select 
                                                                         value={rt.type || ''}
                                                                         onChange={e => {
                                                                             const updated = [...kmListingForm.roomTypes];
                                                                             updated[activeRoomIdx] = { ...rt, type: e.target.value };
                                                                             setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                         }}
                                                                         className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                     >
                                                                         <option value="" disabled hidden>Pilih Tipe Kamar</option>
                                                                         <option value="Standard">Standard (3x3m)</option>`;

if (content.includes(oldActiveFloorSelect)) {
  content = content.replace(oldActiveFloorSelect, newActiveFloorSelect);
}
if (content.includes(oldActiveTypeSelect)) {
  content = content.replace(oldActiveTypeSelect, newActiveTypeSelect);
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Select placeholders updated.");
