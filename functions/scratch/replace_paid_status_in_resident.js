const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update setTemporaryRoom template
const oldRoomTemplate = `                                                     setTemporaryRoom({
                                                         name: '',
                                                         floor: '',
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
                                                     });`;

if (content.includes(oldRoomTemplate)) {
  content = content.replace(oldRoomTemplate, newRoomTemplate);
  console.log("Room template updated with isPaid and remainingBill.");
}

// 2. Define target search and replace for temporaryRoom Informasi Penghuni dates grid
const targetTempGrid = `                                                                      <div className="grid grid-cols-2 gap-2">
                                                                          <div className="flex flex-col gap-1">
                                                                              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tanggal Pembayaran Terakhir</label>
                                                                              <input 
                                                                                  type="date"
                                                                                  value={temporaryRoom.startDate || ''}
                                                                                  onChange={e => setTemporaryRoom({ ...temporaryRoom, startDate: e.target.value })}
                                                                                  className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                              />
                                                                          </div>
                                                                          <div className="flex flex-col gap-1">
                                                                              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tagihan Berikutnya</label>
                                                                              <input 
                                                                                  type="date"
                                                                                  value={temporaryRoom.endDate || ''}
                                                                                  onChange={e => setTemporaryRoom({ ...temporaryRoom, endDate: e.target.value })}
                                                                                  className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                              />
                                                                          </div>
                                                                      </div>`;

const replacementTempGrid = `                                                                      <div className="grid grid-cols-2 gap-2">
                                                                          <div className="flex flex-col gap-1">
                                                                              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tanggal Pembayaran Terakhir</label>
                                                                              <input 
                                                                                  type="date"
                                                                                  value={temporaryRoom.startDate || ''}
                                                                                  onChange={e => setTemporaryRoom({ ...temporaryRoom, startDate: e.target.value })}
                                                                                  className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                              />
                                                                          </div>
                                                                          <div className="flex flex-col gap-1">
                                                                              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tagihan Berikutnya</label>
                                                                              <input 
                                                                                  type="date"
                                                                                  value={temporaryRoom.endDate || ''}
                                                                                  onChange={e => setTemporaryRoom({ ...temporaryRoom, endDate: e.target.value })}
                                                                                  className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                              />
                                                                          </div>
                                                                      </div>

                                                                      {/* Status Pembayaran */}
                                                                      <div className="flex flex-col gap-1.5 mt-1 border-t border-gray-100 pt-3">
                                                                          <label className="text-[10px] font-bold text-[#584235] uppercase tracking-wider">Status Pembayaran</label>
                                                                          <div className="flex gap-2">
                                                                              <button
                                                                                  type="button"
                                                                                  onClick={() => setTemporaryRoom({ ...temporaryRoom, isPaid: true, remainingBill: '' })}
                                                                                  className={\`flex-1 h-[36px] rounded-lg text-xs font-bold transition-all uppercase tracking-wider \${(temporaryRoom.isPaid ?? true) === true ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                                                                              >
                                                                                  Lunas
                                                                              </button>
                                                                              <button
                                                                                  type="button"
                                                                                  onClick={() => setTemporaryRoom({ ...temporaryRoom, isPaid: false })}
                                                                                  className={\`flex-1 h-[36px] rounded-lg text-xs font-bold transition-all uppercase tracking-wider \${temporaryRoom.isPaid === false ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                                                                              >
                                                                                  Belum Lunas
                                                                              </button>
                                                                          </div>
                                                                      </div>

                                                                      {temporaryRoom.isPaid === false && (
                                                                          <div className="flex flex-col gap-1.5 bg-red-50/50 border border-red-100 p-3 rounded-lg mt-1">
                                                                              <label className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Sisa Tagihan (Rp)</label>
                                                                              <input
                                                                                  type="number"
                                                                                  value={temporaryRoom.remainingBill || ''}
                                                                                  onChange={e => setTemporaryRoom({ ...temporaryRoom, remainingBill: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                                                                                  className="w-full h-[36px] px-3 border border-red-200 rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                  placeholder="Masukkan sisa tagihan (cth: 500000)"
                                                                              />
                                                                              <span className="text-[9px] text-red-500 leading-normal italic">
                                                                                  * Tagihan akan langsung dikirimkan ke penghuni dari sekarang.
                                                                              </span>
                                                                          </div>
                                                                      )}`;

// 3. Define target search and replace for activeRoomIdx Informasi Penghuni dates grid
const targetActiveGrid = `                                                                          <div className="grid grid-cols-2 gap-2">
                                                                              <div className="flex flex-col gap-1">
                                                                                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tanggal Pembayaran Terakhir</label>
                                                                                  <input 
                                                                                      type="date"
                                                                                      value={rt.startDate || ''}
                                                                                      onChange={e => {
                                                                                          const updated = [...kmListingForm.roomTypes];
                                                                                          updated[activeRoomIdx] = { ...rt, startDate: e.target.value };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      }}
                                                                                      className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                  />
                                                                              </div>
                                                                              <div className="flex flex-col gap-1">
                                                                                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tagihan Berikutnya</label>
                                                                                  <input 
                                                                                      type="date"
                                                                                      value={rt.endDate || ''}
                                                                                      onChange={e => {
                                                                                          const updated = [...kmListingForm.roomTypes];
                                                                                          updated[activeRoomIdx] = { ...rt, endDate: e.target.value };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      }}
                                                                                      className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                  />
                                                                              </div>
                                                                          </div>`;

const replacementActiveGrid = `                                                                          <div className="grid grid-cols-2 gap-2">
                                                                              <div className="flex flex-col gap-1">
                                                                                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tanggal Pembayaran Terakhir</label>
                                                                                  <input 
                                                                                      type="date"
                                                                                      value={rt.startDate || ''}
                                                                                      onChange={e => {
                                                                                          const updated = [...kmListingForm.roomTypes];
                                                                                          updated[activeRoomIdx] = { ...rt, startDate: e.target.value };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      }}
                                                                                      className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                  />
                                                                              </div>
                                                                              <div className="flex flex-col gap-1">
                                                                                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tagihan Berikutnya</label>
                                                                                  <input 
                                                                                      type="date"
                                                                                      value={rt.endDate || ''}
                                                                                      onChange={e => {
                                                                                          const updated = [...kmListingForm.roomTypes];
                                                                                          updated[activeRoomIdx] = { ...rt, endDate: e.target.value };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      }}
                                                                                      className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                  />
                                                                              </div>
                                                                          </div>

                                                                          {/* Status Pembayaran */}
                                                                          <div className="flex flex-col gap-1.5 mt-1 border-t border-gray-100 pt-3">
                                                                              <label className="text-[10px] font-bold text-[#584235] uppercase tracking-wider">Status Pembayaran</label>
                                                                              <div className="flex gap-2">
                                                                                  <button
                                                                                      type="button"
                                                                                      onClick={() => {
                                                                                          const updated = [...kmListingForm.roomTypes];
                                                                                          updated[activeRoomIdx] = { ...rt, isPaid: true, remainingBill: '' };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      }}
                                                                                      className={\`flex-1 h-[36px] rounded-lg text-xs font-bold transition-all uppercase tracking-wider \${(rt.isPaid ?? true) === true ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                                                                                  >
                                                                                      Lunas
                                                                                  </button>
                                                                                  <button
                                                                                      type="button"
                                                                                      onClick={() => {
                                                                                          const updated = [...kmListingForm.roomTypes];
                                                                                          updated[activeRoomIdx] = { ...rt, isPaid: false };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      }}
                                                                                      className={\`flex-1 h-[36px] rounded-lg text-xs font-bold transition-all uppercase tracking-wider \${rt.isPaid === false ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}\`}
                                                                                  >
                                                                                      Belum Lunas
                                                                                  </button>
                                                                              </div>
                                                                          </div>

                                                                          {rt.isPaid === false && (
                                                                              <div className="flex flex-col gap-1.5 bg-red-50/50 border border-red-100 p-3 rounded-lg mt-1">
                                                                                  <label className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Sisa Tagihan (Rp)</label>
                                                                                  <input
                                                                                      type="number"
                                                                                      value={rt.remainingBill || ''}
                                                                                      onChange={e => {
                                                                                          const updated = [...kmListingForm.roomTypes];
                                                                                          updated[activeRoomIdx] = { ...rt, remainingBill: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      }}
                                                                                      className="w-full h-[36px] px-3 border border-red-200 rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                      placeholder="Masukkan sisa tagihan (cth: 500000)"
                                                                                  />
                                                                                  <span className="text-[9px] text-red-500 leading-normal italic">
                                                                                      * Tagihan akan langsung dikirimkan ke penghuni dari sekarang.
                                                                                  </span>
                                                                              </div>
                                                                          )}`;

if (content.includes(targetTempGrid)) {
  content = content.replace(targetTempGrid, replacementTempGrid);
  console.log("temporaryRoom paid selection integrated.");
} else {
  console.log("targetTempGrid NOT found.");
}

if (content.includes(targetActiveGrid)) {
  content = content.replace(targetActiveGrid, replacementActiveGrid);
  console.log("activeRoomIdx paid selection integrated.");
} else {
  console.log("targetActiveGrid NOT found.");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Done updating payment status logic.");
