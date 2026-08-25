const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Declare state for newRoomPhotoCategoryName
const oldState = `    const [customBathroomFacilityInput, setCustomBathroomFacilityInput] = useState('');
    const [customPublicBathroomFacilityInput, setCustomPublicBathroomFacilityInput] = useState('');`;

const newState = `    const [customBathroomFacilityInput, setCustomBathroomFacilityInput] = useState('');
    const [customPublicBathroomFacilityInput, setCustomPublicBathroomFacilityInput] = useState('');
    const [newRoomPhotoCategoryName, setNewRoomPhotoCategoryName] = useState('');`;

if (content.includes(oldState)) {
  content = content.replace(oldState, newState);
  console.log("Declared newRoomPhotoCategoryName state.");
} else {
  console.log("CRITICAL: oldState NOT found!");
}

// 2. Modify temporaryRoom photo uploader block
const oldTempBlock = `                                                              {/* Dokumentasi Foto Kamar */}
                                                              <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-2 bg-gray-50/30">
                                                                  <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Dokumentasi Foto Kamar</span>
                                                                  <p className="text-[10px] text-gray-500 leading-relaxed mb-1">Unggah foto kondisi kamar saat ini untuk keperluan listing/marketing.</p>
                                                                  <div className="grid grid-cols-2 gap-3">
                                                                      {['Interior Kamar *Wajib', 'Kamar Mandi', 'View / Jendela', 'Lemari / Storage'].map((label, imgIdx) => {
                                                                          const hasImg = !!temporaryRoom.images?.[imgIdx];
                                                                          return (
                                                                              <div key={label} className="flex flex-col gap-1">
                                                                                  {hasImg ? (
                                                                                      <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 relative group">
                                                                                          <img src={temporaryRoom.images[imgIdx]} alt={label} className="w-full h-full object-cover" />
                                                                                          <button
                                                                                              type="button"
                                                                                              onClick={() => {
                                                                                                  const updatedImages = [...(temporaryRoom.images || [])];
                                                                                                  updatedImages[imgIdx] = '';
                                                                                                  setTemporaryRoom({ ...temporaryRoom, images: updatedImages });
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
                                                                                                      setUploadingRooms(prev => ({ ...prev, [imgIdx + 2000]: true }));
                                                                                                      try {
                                                                                                          const folder = \`kostmanager/rooms/\${Date.now()}\`;
                                                                                                          const publicUrl = await uploadFileAndGetURL(file, folder);
                                                                                                          const updatedImages = [...(temporaryRoom.images || [])];
                                                                                                          updatedImages[imgIdx] = publicUrl;
                                                                                                          setTemporaryRoom({ ...temporaryRoom, images: updatedImages });
                                                                                                      } catch (err) {
                                                                                                          alert('Gagal unggah foto: ' + (err as Error).message);
                                                                                                      } finally {
                                                                                                          setUploadingRooms(prev => ({ ...prev, [imgIdx + 2000]: false }));
                                                                                                      }
                                                                                                  }
                                                                                              };
                                                                                              input.click();
                                                                                          }}
                                                                                          className="bg-white border-2 border-dashed border-[#ff7a00] rounded-xl flex flex-col items-center justify-center p-4 h-24 cursor-pointer hover:bg-orange-50/30 transition-all"
                                                                                      >
                                                                                          {uploadingRooms[imgIdx + 2000] ? (
                                                                                              <span className="text-[10px] font-bold animate-pulse text-gray-500">Uploading...</span>
                                                                                          ) : (
                                                                                              <>
                                                                                                  <span className="material-symbols-outlined text-[#ff7a00] text-xl">add_a_photo</span>
                                                                                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#ff7a00] mt-1 text-center">{label}</span>
                                                                                              </>
                                                                                          )}
                                                                                      </div>
                                                                                  )}
                                                                              </div>
                                                                          );
                                                                      })}
                                                                  </div>
                                                              </div>`;

const newTempBlock = `                                                              {/* Dokumentasi Foto Kamar */}
                                                              <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-2 bg-gray-50/30">
                                                                  <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Dokumentasi Foto Kamar</span>
                                                                  <p className="text-[10px] text-gray-500 leading-relaxed mb-1">Unggah foto kondisi kamar saat ini untuk keperluan listing/marketing.</p>
                                                                  <div className="grid grid-cols-2 gap-3">
                                                                      {(temporaryRoom.photoCategories || ['Interior Kamar *Wajib', 'Kamar Mandi', 'View / Jendela', 'Lemari / Storage']).map((label: string, imgIdx: number) => {
                                                                          const hasImg = !!temporaryRoom.images?.[imgIdx];
                                                                          return (
                                                                              <div key={imgIdx} className="flex flex-col gap-1 relative">
                                                                                  {hasImg ? (
                                                                                      <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 relative group">
                                                                                          <img src={temporaryRoom.images[imgIdx]} alt={label} className="w-full h-full object-cover" />
                                                                                          <button
                                                                                              type="button"
                                                                                              onClick={() => {
                                                                                                  const updatedImages = [...(temporaryRoom.images || [])];
                                                                                                  const updatedCats = [...(temporaryRoom.photoCategories || ['Interior Kamar *Wajib', 'Kamar Mandi', 'View / Jendela', 'Lemari / Storage'])];
                                                                                                  if (imgIdx >= 4) {
                                                                                                      updatedImages.splice(imgIdx, 1);
                                                                                                      updatedCats.splice(imgIdx, 1);
                                                                                                  } else {
                                                                                                      updatedImages[imgIdx] = '';
                                                                                                  }
                                                                                                  setTemporaryRoom({ 
                                                                                                      ...temporaryRoom, 
                                                                                                      images: updatedImages,
                                                                                                      photoCategories: updatedCats
                                                                                                  });
                                                                                              }}
                                                                                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700"
                                                                                          >
                                                                                              &times;
                                                                                          </button>
                                                                                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-2 text-[8px] text-white text-center uppercase font-bold tracking-wider">{label}</div>
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
                                                                                                      setUploadingRooms(prev => ({ ...prev, [imgIdx + 2000]: true }));
                                                                                                      try {
                                                                                                          const folder = \`kostmanager/rooms/\${Date.now()}\`;
                                                                                                          const publicUrl = await uploadFileAndGetURL(file, folder);
                                                                                                          const updatedImages = [...(temporaryRoom.images || [])];
                                                                                                          updatedImages[imgIdx] = publicUrl;
                                                                                                          setTemporaryRoom({ ...temporaryRoom, images: updatedImages });
                                                                                                      } catch (err) {
                                                                                                          alert('Gagal unggah foto: ' + (err as Error).message);
                                                                                                      } finally {
                                                                                                          setUploadingRooms(prev => ({ ...prev, [imgIdx + 2000]: false }));
                                                                                                      }
                                                                                                  }
                                                                                              };
                                                                                              input.click();
                                                                                          }}
                                                                                          className="aspect-video bg-white border-2 border-dashed border-[#ff7a00] rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-orange-50/30 transition-all text-[#584235]"
                                                                                      >
                                                                                          {uploadingRooms[imgIdx + 2000] ? (
                                                                                              <span className="text-[10px] font-bold animate-pulse text-gray-500">Uploading...</span>
                                                                                          ) : (
                                                                                              <>
                                                                                                  <span className="material-symbols-outlined text-[#ff7a00] text-xl">add_a_photo</span>
                                                                                                  <span className="text-[9px] font-bold uppercase tracking-wider mt-1 text-center">{label}</span>
                                                                                              </>
                                                                                          )}
                                                                                      </div>
                                                                                  )}
                                                                              </div>
                                                                          );
                                                                      })}
                                                                  </div>
                                                                  
                                                                  {/* Input Kategori Tambahan Kamar */}
                                                                  <div className="flex gap-2 mt-2">
                                                                      <input 
                                                                          type="text"
                                                                          placeholder="Kategori Foto Kamar Baru (misal: Balkon Kamar)"
                                                                          value={newRoomPhotoCategoryName}
                                                                          onChange={e => setNewRoomPhotoCategoryName(e.target.value)}
                                                                          className="flex-1 h-[36px] px-3 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                                                                      />
                                                                      <button
                                                                          type="button"
                                                                          onClick={() => {
                                                                              if (!newRoomPhotoCategoryName.trim()) return;
                                                                              const cat = newRoomPhotoCategoryName.trim();
                                                                              const currentCats = [...(temporaryRoom.photoCategories || ['Interior Kamar *Wajib', 'Kamar Mandi', 'View / Jendela', 'Lemari / Storage'])];
                                                                              const currentImages = [...(temporaryRoom.images || [])];
                                                                              setTemporaryRoom({
                                                                                  ...temporaryRoom,
                                                                                  photoCategories: [...currentCats, cat],
                                                                                  images: [...currentImages, '']
                                                                              });
                                                                              setNewRoomPhotoCategoryName('');
                                                                          }}
                                                                          className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#ff7a00] font-bold text-xs uppercase px-4 rounded-lg border border-[#e0c0af] transition-colors"
                                                                      >
                                                                          + Foto Kamar
                                                                      </button>
                                                                  </div>
                                                              </div>`;

if (content.includes(oldTempBlock)) {
  content = content.replace(oldTempBlock, newTempBlock);
  console.log("Updated temporaryRoom photo uploader block.");
} else {
  console.log("CRITICAL: oldTempBlock NOT found!");
}

// 3. Modify activeRoomIdx (rt) photo uploader block
const oldRtBlock = `                                                                  {/* Dokumentasi Foto Kamar */}
                                                                  <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-2 bg-gray-50/30">
                                                                      <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Dokumentasi Foto Kamar</span>
                                                                      <p className="text-[10px] text-gray-500 leading-relaxed mb-1">Unggah foto kondisi kamar saat ini untuk keperluan listing/marketing.</p>
                                                                      <div className="grid grid-cols-2 gap-3">
                                                                          {['Interior Kamar *Wajib', 'Kamar Mandi', 'View / Jendela', 'Lemari / Storage'].map((label, imgIdx) => {
                                                                              const hasImg = !!rt.images?.[imgIdx];
                                                                              return (
                                                                                  <div key={label} className="flex flex-col gap-1">
                                                                                      {hasImg ? (
                                                                                          <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 relative group">
                                                                                              <img src={rt.images[imgIdx]} alt={label} className="w-full h-full object-cover" />
                                                                                              <button
                                                                                                  type="button"
                                                                                                  onClick={() => {
                                                                                                      const updatedImages = [...(rt.images || [])];
                                                                                                      updatedImages[imgIdx] = '';
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
                                                                                                          setUploadingRooms(prev => ({ ...prev, [imgIdx + 4000]: true }));
                                                                                                          try {
                                                                                                              const folder = \`kostmanager/rooms/\${Date.now()}\`;
                                                                                                              const publicUrl = await uploadFileAndGetURL(file, folder);
                                                                                                              const updatedImages = [...(rt.images || [])];
                                                                                                              updatedImages[imgIdx] = publicUrl;
                                                                                                              const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                                              updatedRoomTypes[activeRoomIdx] = { ...rt, images: updatedImages };
                                                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                                          } catch (err) {
                                                                                                              alert('Gagal unggah foto: ' + (err as Error).message);
                                                                                                          } finally {
                                                                                                              setUploadingRooms(prev => ({ ...prev, [imgIdx + 4000]: false }));
                                                                                                          }
                                                                                                      }
                                                                                                  };
                                                                                                  input.click();
                                                                                              }}
                                                                                              className="bg-white border-2 border-dashed border-[#ff7a00] rounded-xl flex flex-col items-center justify-center p-4 h-24 cursor-pointer hover:bg-orange-50/30 transition-all"
                                                                                          >
                                                                                              {uploadingRooms[imgIdx + 4000] ? (
                                                                                                  <span className="text-[10px] font-bold animate-pulse text-gray-500">Uploading...</span>
                                                                                              ) : (
                                                                                                  <>
                                                                                                      <span className="material-symbols-outlined text-[#ff7a00] text-xl">add_a_photo</span>
                                                                                                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#ff7a00] mt-1 text-center">{label}</span>
                                                                                                  </>
                                                                                              )}
                                                                                          </div>
                                                                                      )}
                                                                                  </div>
                                                                              );
                                                                          })}
                                                                      </div>
                                                                  </div>`;

const newRtBlock = `                                                                  {/* Dokumentasi Foto Kamar */}
                                                                  <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-2 bg-gray-50/30">
                                                                      <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Dokumentasi Foto Kamar</span>
                                                                      <p className="text-[10px] text-gray-500 leading-relaxed mb-1">Unggah foto kondisi kamar saat ini untuk keperluan listing/marketing.</p>
                                                                      <div className="grid grid-cols-2 gap-3">
                                                                          {(rt.photoCategories || ['Interior Kamar *Wajib', 'Kamar Mandi', 'View / Jendela', 'Lemari / Storage']).map((label: string, imgIdx: number) => {
                                                                              const hasImg = !!rt.images?.[imgIdx];
                                                                              return (
                                                                                  <div key={imgIdx} className="flex flex-col gap-1 relative">
                                                                                      {hasImg ? (
                                                                                          <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 relative group">
                                                                                              <img src={rt.images[imgIdx]} alt={label} className="w-full h-full object-cover" />
                                                                                              <button
                                                                                                  type="button"
                                                                                                  onClick={() => {
                                                                                                      const updatedImages = [...(rt.images || [])];
                                                                                                      const updatedCats = [...(rt.photoCategories || ['Interior Kamar *Wajib', 'Kamar Mandi', 'View / Jendela', 'Lemari / Storage'])];
                                                                                                      if (imgIdx >= 4) {
                                                                                                          updatedImages.splice(imgIdx, 1);
                                                                                                          updatedCats.splice(imgIdx, 1);
                                                                                                      } else {
                                                                                                          updatedImages[imgIdx] = '';
                                                                                                      }
                                                                                                      const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                                      updatedRoomTypes[activeRoomIdx] = { 
                                                                                                          ...rt, 
                                                                                                          images: updatedImages,
                                                                                                          photoCategories: updatedCats
                                                                                                      };
                                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                                  }}
                                                                                                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700"
                                                                                              >
                                                                                                  &times;
                                                                                              </button>
                                                                                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-2 text-[8px] text-white text-center uppercase font-bold tracking-wider">{label}</div>
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
                                                                                                          setUploadingRooms(prev => ({ ...prev, [imgIdx + 4000]: true }));
                                                                                                          try {
                                                                                                              const folder = \`kostmanager/rooms/\${Date.now()}\`;
                                                                                                              const publicUrl = await uploadFileAndGetURL(file, folder);
                                                                                                              const updatedImages = [...(rt.images || [])];
                                                                                                              updatedImages[imgIdx] = publicUrl;
                                                                                                              const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                                              updatedRoomTypes[activeRoomIdx] = { ...rt, images: updatedImages };
                                                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                                          } catch (err) {
                                                                                                              alert('Gagal unggah foto: ' + (err as Error).message);
                                                                                                          } finally {
                                                                                                              setUploadingRooms(prev => ({ ...prev, [imgIdx + 4000]: false }));
                                                                                                          }
                                                                                                      }
                                                                                                  };
                                                                                                  input.click();
                                                                                              }}
                                                                                              className="aspect-video bg-white border-2 border-dashed border-[#ff7a00] rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-orange-50/30 transition-all text-[#584235]"
                                                                                          >
                                                                                              {uploadingRooms[imgIdx + 4000] ? (
                                                                                                  <span className="text-[10px] font-bold animate-pulse text-gray-500">Uploading...</span>
                                                                                              ) : (
                                                                                                  <>
                                                                                                      <span className="material-symbols-outlined text-[#ff7a00] text-xl">add_a_photo</span>
                                                                                                      <span className="text-[9px] font-bold uppercase tracking-wider mt-1 text-center">{label}</span>
                                                                                                  </>
                                                                                              )}
                                                                                          </div>
                                                                                      )}
                                                                                  </div>
                                                                              );
                                                                          })}
                                                                      </div>
                                                                      
                                                                      {/* Input Kategori Tambahan Kamar */}
                                                                      <div className="flex gap-2 mt-2">
                                                                          <input 
                                                                              type="text"
                                                                              placeholder="Kategori Foto Kamar Baru (misal: Balkon Kamar)"
                                                                              value={newRoomPhotoCategoryName}
                                                                              onChange={e => setNewRoomPhotoCategoryName(e.target.value)}
                                                                              className="flex-1 h-[36px] px-3 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                                                                          />
                                                                          <button
                                                                              type="button"
                                                                              onClick={() => {
                                                                                  if (!newRoomPhotoCategoryName.trim()) return;
                                                                                  const cat = newRoomPhotoCategoryName.trim();
                                                                                  const currentCats = [...(rt.photoCategories || ['Interior Kamar *Wajib', 'Kamar Mandi', 'View / Jendela', 'Lemari / Storage'])];
                                                                                  const currentImages = [...(rt.images || [])];
                                                                                  const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                  updatedRoomTypes[activeRoomIdx] = {
                                                                                      ...rt,
                                                                                      photoCategories: [...currentCats, cat],
                                                                                      images: [...currentImages, '']
                                                                                  };
                                                                                  setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                  setNewRoomPhotoCategoryName('');
                                                                              }}
                                                                              className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#ff7a00] font-bold text-xs uppercase px-4 rounded-lg border border-[#e0c0af] transition-colors"
                                                                          >
                                                                              + Foto Kamar
                                                                          </button>
                                                                      </div>
                                                                  </div>`;

if (content.includes(oldRtBlock)) {
  content = content.replace(oldRtBlock, newRtBlock);
  console.log("Updated activeRoomIdx photo uploader block.");
} else {
  console.log("CRITICAL: oldRtBlock NOT found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Done enabling unlimited room photos.");
