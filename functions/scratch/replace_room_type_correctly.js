const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF for reliable search and replace
content = content.replace(/\r\n/g, '\n');

// 1. Replace Tipe Kamar in temporaryRoom
const oldTempTypeBlock = `                                                              <div className="md:col-span-2 flex flex-col gap-1.5">
                                                                  <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kamar</label>
                                                                  <select 
                                                                      value={temporaryRoom.type || 'Standard'}
                                                                      onChange={e => setTemporaryRoom({ ...temporaryRoom, type: e.target.value })}
                                                                      className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                  >
                                                                      <option value="Standard">Standard (3x3m)</option>
                                                                      <option value="Premium">Premium (4x4m)</option>
                                                                      <option value="Deluxe">Deluxe (5x5m)</option>
                                                                  </select>
                                                              </div>`;

const newTempTypeBlock = `                                                              <div className="md:col-span-2 flex flex-col gap-1.5">
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
  console.log("Replaced temporaryRoom Tipe Kamar block successfully.");
} else {
  console.error("oldTempTypeBlock not found in content!");
}

// 2. Replace Tipe Kamar in activeRoomIdx
const oldActiveTypeBlock = `                                                                 <select 
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
                                                                 </select>`;

const newActiveTypeBlock = `                                                                 <select 
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
                                                                 )}`;

if (content.includes(oldActiveTypeBlock)) {
  content = content.replace(oldActiveTypeBlock, newActiveTypeBlock);
  console.log("Replaced activeRoomIdx Tipe Kamar block successfully.");
} else {
  console.error("oldActiveTypeBlock not found in content!");
}

// Convert back to CRLF for Windows compatibility
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
