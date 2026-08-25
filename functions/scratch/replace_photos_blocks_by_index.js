const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// 1. Replace temporaryRoom photo block (formerly lines 3769 to 3836)
let tempStart = lines.findIndex(l => l.includes('Dokumentasi Foto Kamar') && l.includes('{/*') && lines[lines.indexOf(l) + 1] && lines[lines.indexOf(l) + 1].includes('bg-gray-50/30'));
let tempEnd = -1;
if (tempStart !== -1) {
  for (let j = tempStart; j < tempStart + 100; j++) {
    if (lines[j].trim() === '</div>' && lines[j-1].trim() === '</div>' && lines[j-2].trim() === '</div>') {
      // Wait, let's verify line index matches the end of uploader container
    }
  }
  // Let's search for the line starting index of `/* TERISI: PENDATAAN PENGHUNI */`
  let terisiIdx = lines.findIndex(l => l.includes('/* TERISI: PENDATAAN PENGHUNI */'));
  if (terisiIdx !== -1) {
    // The closing div of Dokumentasi Foto Kamar in temporaryRoom is right before the `</>` of KOSONG: PENDATAAN KAMAR
    for (let k = terisiIdx - 1; k >= tempStart; k--) {
      if (lines[k].trim() === '</div>') {
        tempEnd = k;
        break;
      }
    }
  }
}

if (tempStart !== -1 && tempEnd !== -1) {
  console.log("Replacing temporaryRoom photo block at lines:", tempStart + 1, "to", tempEnd + 1);
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
                                                                                                  <span className="material-symbols-outlined text-[#ff7a00] text-xl">
                                                                                                      {imgIdx === 0 ? 'add_a_photo' : imgIdx === 1 ? 'bathtub' : imgIdx === 2 ? 'window' : imgIdx === 3 ? 'view_cozy' : 'add_a_photo'}
                                                                                                  </span>
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
  lines.splice(tempStart, tempEnd - tempStart + 1, newTempBlock);
} else {
  console.log("CRITICAL: tempStart NOT found!");
}

// 2. Replace activeRoomIdx photo block (requires re-joining and splitting due to lines splice shifting)
let intermediateContent = lines.join('\n');
const intermediateLines = intermediateContent.split('\n');

let activeStart = -1;
let activeEnd = -1;
// Scan for the second occurrence of Dokumentasi Foto Kamar
let occurrences = [];
intermediateLines.forEach((line, idx) => {
  if (line.includes('Dokumentasi Foto Kamar') && line.includes('{/*')) {
    occurrences.push(idx);
  }
});

if (occurrences.length >= 2) {
  activeStart = occurrences[1];
  // Find where it ends before the next conditional section
  let nextSectionIdx = intermediateLines.findIndex((l, idx) => idx > activeStart && l.includes('/* TERISI: PENDATAAN PENGHUNI */'));
  if (nextSectionIdx !== -1) {
    for (let k = nextSectionIdx - 1; k >= activeStart; k--) {
      if (intermediateLines[k].trim() === '</div>') {
        activeEnd = k;
        break;
      }
    }
  }
}

if (activeStart !== -1 && activeEnd !== -1) {
  console.log("Replacing activeRoomIdx photo block at lines:", activeStart + 1, "to", activeEnd + 1);
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
                                                                                                      <span className="material-symbols-outlined text-[#ff7a00] text-xl">
                                                                                                          {imgIdx === 0 ? 'add_a_photo' : imgIdx === 1 ? 'bathtub' : imgIdx === 2 ? 'window' : imgIdx === 3 ? 'view_cozy' : 'add_a_photo'}
                                                                                                      </span>
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
  intermediateLines.splice(activeStart, activeEnd - activeStart + 1, newRtBlock);
} else {
  console.log("CRITICAL: activeStart/activeEnd NOT found!");
}

let finalContent = intermediateLines.join('\n');
// Convert back to CRLF
finalContent = finalContent.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalContent, 'utf8');

console.log("Room photos uploader blocks successfully replaced.");
