const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Declare properties on initial state
content = content.replace(
  "maxOccupants: 1,\n                additionalCostPerPerson: 0,",
  "maxOccupants: 1,\n                extraOccupantFee: 0,\n                otherFeeAmount: 0,\n                otherFeeCoveredItems: [],\n                additionalCostPerPerson: 0,"
);

// Declare state defaults for edit loads
content = content.replace(
  "maxOccupants: 1,\n                    additionalCostPerPerson: 0,",
  "maxOccupants: 1,\n                    extraOccupantFee: 0,\n                    otherFeeAmount: 0,\n                    otherFeeCoveredItems: [],\n                    additionalCostPerPerson: 0,"
);

const lines = content.split('\n');

// 2. Add temporaryRoom Maks Occupants & Extra Occupant Fee under Pricing container
let tempTextIdx = lines.findIndex(l => l.includes('* Jika tarif Tahunan tidak diisi') && l.includes('12x tarif Bulanan'));
if (tempTextIdx !== -1) {
  let closeDivIdx = lines.findIndex((l, idx) => idx > tempTextIdx && l.trim() === '</div>');
  if (closeDivIdx !== -1) {
    console.log("Found temporaryRoom pricing end at line", closeDivIdx + 1);
    
    const tempExtension = `
                                                          {/* Kelengkapan Penghuni & Biaya Lain */}
                                                          <div className="border-t border-gray-150 pt-4 mt-4 space-y-4">
                                                              <div className="grid grid-cols-2 gap-4">
                                                                  <div className="flex flex-col gap-1.5">
                                                                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Maks. Penghuni per Kamar</label>
                                                                      <div className="flex items-center gap-2">
                                                                          <input 
                                                                              type="number"
                                                                              min="1"
                                                                              value={temporaryRoom?.maxOccupants || 1}
                                                                              onChange={e => setTemporaryRoom({ ...temporaryRoom, maxOccupants: parseInt(e.target.value) || 1 })}
                                                                              className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                          />
                                                                          <span className="text-[10px] text-gray-500 font-bold uppercase">Orang</span>
                                                                      </div>
                                                                  </div>
                                                                  
                                                                  <div className="flex flex-col gap-1.5">
                                                                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Biaya Tambahan Orang (Rp/Bulan)</label>
                                                                      <div className="relative">
                                                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">Rp</span>
                                                                          <input 
                                                                              type="text"
                                                                              value={formatThousand(temporaryRoom?.extraOccupantFee || 0)}
                                                                              onChange={e => setTemporaryRoom({ ...temporaryRoom, extraOccupantFee: parseThousand(e.target.value) })}
                                                                              className="w-full h-[36px] pl-8 pr-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                              placeholder="0"
                                                                          />
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          </div>`;
    lines.splice(closeDivIdx, 0, tempExtension);
  }
}

// Re-split and find activeRoomIdx
const midContent = lines.join('\n');
const lines2 = midContent.split('\n');

let activeTextIdx = lines2.findIndex((l, idx) => idx > (tempTextIdx || 3800) + 100 && l.includes('* Jika tarif Tahunan tidak diisi') && l.includes('12x tarif Bulanan'));
if (activeTextIdx !== -1) {
  let closeDivIdx = lines2.findIndex((l, idx) => idx > activeTextIdx && l.trim() === '</div>');
  if (closeDivIdx !== -1) {
    console.log("Found activeRoomIdx pricing end at line", closeDivIdx + 1);
    
    const activeExtension = `
                                                          {/* Kelengkapan Penghuni & Biaya Lain */}
                                                          <div className="border-t border-gray-150 pt-4 mt-4 space-y-4">
                                                              <div className="grid grid-cols-2 gap-4">
                                                                  <div className="flex flex-col gap-1.5">
                                                                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Maks. Penghuni per Kamar</label>
                                                                      <div className="flex items-center gap-2">
                                                                          <input 
                                                                              type="number"
                                                                              min="1"
                                                                              value={rt?.maxOccupants || 1}
                                                                              onChange={e => {
                                                                                  const updated = [...kmListingForm.roomTypes];
                                                                                  updated[activeRoomIdx] = { ...rt, maxOccupants: parseInt(e.target.value) || 1 };
                                                                                  setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                              }}
                                                                              className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                          />
                                                                          <span className="text-[10px] text-gray-500 font-bold uppercase">Orang</span>
                                                                      </div>
                                                                  </div>
                                                                  
                                                                  <div className="flex flex-col gap-1.5">
                                                                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Biaya Tambahan Orang (Rp/Bulan)</label>
                                                                      <div className="relative">
                                                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">Rp</span>
                                                                          <input 
                                                                              type="text"
                                                                              value={formatThousand(rt?.extraOccupantFee || 0)}
                                                                              onChange={e => {
                                                                                  const val = parseThousand(e.target.value);
                                                                                  const updated = [...kmListingForm.roomTypes];
                                                                                  updated[activeRoomIdx] = { ...rt, extraOccupantFee: val };
                                                                                  setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                              }}
                                                                              className="w-full h-[36px] pl-8 pr-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                              placeholder="0"
                                                                          />
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          </div>`;
    lines2.splice(closeDivIdx, 0, activeExtension);
  }
}

// Re-split for facilities insertion
const content3 = lines2.join('\n');
const lines3 = content3.split('\n');

// 3. Add temporaryRoom Other Fees under Fasilitas Kamar
let tempFacAdderIdx = lines3.findIndex(l => l.includes('const customs = temporaryRoom.roomFacilities?.filter'));
if (tempFacAdderIdx !== -1) {
  let firstClose = lines3.findIndex((l, idx) => idx > tempFacAdderIdx && l.trim() === '</div>');
  let secondClose = lines3.findIndex((l, idx) => idx > firstClose && l.trim() === '</div>');
  
  if (secondClose !== -1) {
    console.log("Found temporaryRoom facilities end at line", secondClose + 1);
    
    const tempFacilitiesExtension = `
                                                          {/* Biaya Tambahan Bulanan Lainnya */}
                                                          <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                              <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Biaya Tambahan Bulanan Lainnya</span>
                                                              
                                                              <div className="flex flex-col gap-1.5">
                                                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nominal Biaya Tambahan Bulanan (Rp/Bulan)</label>
                                                                  <div className="relative">
                                                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">Rp</span>
                                                                      <input 
                                                                          type="text"
                                                                          value={formatThousand(temporaryRoom?.otherFeeAmount || 0)}
                                                                          onChange={e => setTemporaryRoom({ ...temporaryRoom, otherFeeAmount: parseThousand(e.target.value) })}
                                                                          className="w-full h-[36px] pl-8 pr-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                          placeholder="0"
                                                                      />
                                                                  </div>
                                                              </div>

                                                              <div className="flex flex-col gap-1.5 mt-1">
                                                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cakupan Biaya Tambahan</label>
                                                                  <div className="grid grid-cols-2 gap-2">
                                                                      {['Listrik', 'Air', 'Sampah', 'Wifi', 'Keamanan/Parkir'].map(feeName => {
                                                                          const isChecked = temporaryRoom?.otherFeeCoveredItems?.includes(feeName);
                                                                          return (
                                                                              <label key={feeName} className="flex items-center gap-2 cursor-pointer p-2.5 bg-white border border-[#e0c0af] rounded-lg shadow-sm">
                                                                                  <input 
                                                                                      type="checkbox"
                                                                                      checked={!!isChecked}
                                                                                      onChange={() => {
                                                                                          const current = temporaryRoom?.otherFeeCoveredItems || [];
                                                                                          const updated = current.includes(feeName)
                                                                                              ? current.filter(item => item !== feeName)
                                                                                              : [...current, feeName];
                                                                                          setTemporaryRoom({ ...temporaryRoom, otherFeeCoveredItems: updated });
                                                                                      }}
                                                                                      className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                                  />
                                                                                  <span className="text-[10px] font-bold text-gray-650 uppercase tracking-wider">{feeName}</span>
                                                                              </label>
                                                                          );
                                                                      })}
                                                                  </div>
                                                              </div>
                                                          </div>`;
    lines3.splice(secondClose + 1, 0, tempFacilitiesExtension);
  }
}

// Re-split for activeRoomIdx facilities insertion
const content4 = lines3.join('\n');
const lines4 = content4.split('\n');

let activeFacAdderIdx = lines4.findIndex(l => l.includes('const customs = rt.roomFacilities?.filter'));
if (activeFacAdderIdx !== -1) {
  let firstClose = lines4.findIndex((l, idx) => idx > activeFacAdderIdx && l.trim() === '</div>');
  let secondClose = lines4.findIndex((l, idx) => idx > firstClose && l.trim() === '</div>');
  
  if (secondClose !== -1) {
    console.log("Found activeRoomIdx facilities end at line", secondClose + 1);
    
    const activeFacilitiesExtension = `
                                                          {/* Biaya Tambahan Bulanan Lainnya */}
                                                          <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                              <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Biaya Tambahan Bulanan Lainnya</span>
                                                              
                                                              <div className="flex flex-col gap-1.5">
                                                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nominal Biaya Tambahan Bulanan (Rp/Bulan)</label>
                                                                  <div className="relative">
                                                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">Rp</span>
                                                                      <input 
                                                                          type="text"
                                                                          value={formatThousand(rt?.otherFeeAmount || 0)}
                                                                          onChange={e => {
                                                                              const val = parseThousand(e.target.value);
                                                                              const updated = [...kmListingForm.roomTypes];
                                                                              updated[activeRoomIdx] = { ...rt, otherFeeAmount: val };
                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                          }}
                                                                          className="w-full h-[36px] pl-8 pr-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                          placeholder="0"
                                                                      />
                                                                  </div>
                                                              </div>

                                                              <div className="flex flex-col gap-1.5 mt-1">
                                                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cakupan Biaya Tambahan</label>
                                                                  <div className="grid grid-cols-2 gap-2">
                                                                      {['Listrik', 'Air', 'Sampah', 'Wifi', 'Keamanan/Parkir'].map(feeName => {
                                                                          const isChecked = rt?.otherFeeCoveredItems?.includes(feeName);
                                                                          return (
                                                                              <label key={feeName} className="flex items-center gap-2 cursor-pointer p-2.5 bg-white border border-[#e0c0af] rounded-lg shadow-sm">
                                                                                  <input 
                                                                                      type="checkbox"
                                                                                      checked={!!isChecked}
                                                                                      onChange={() => {
                                                                                          const current = rt?.otherFeeCoveredItems || [];
                                                                                          const updated = current.includes(feeName)
                                                                                              ? current.filter(item => item !== feeName)
                                                                                              : [...current, feeName];
                                                                                          const updatedRooms = [...kmListingForm.roomTypes];
                                                                                          updatedRooms[activeRoomIdx] = { ...rt, otherFeeCoveredItems: updated };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updatedRooms });
                                                                                      }}
                                                                                      className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                                  />
                                                                                  <span className="text-[10px] font-bold text-gray-655 uppercase tracking-wider">{feeName}</span>
                                                                              </label>
                                                                          );
                                                                      })}
                                                                  </div>
                                                              </div>
                                                          </div>`;
    lines4.splice(secondClose + 1, 0, activeFacilitiesExtension);
  }
}

let finalContent = lines4.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Done adding pricing and other fee inputs to rooms.");
