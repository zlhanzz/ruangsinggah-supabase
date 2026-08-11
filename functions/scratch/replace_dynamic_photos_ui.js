const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Replace the delete handler inside map
const deleteTarget = `                                                                            onClick={() => {
                                                                                const updated = [...(kmListingForm.image_urls || [])];
                                                                                updated[idx] = '';
                                                                                setKmListingForm({ ...kmListingForm, image_urls: updated });
                                                                            }}`;

const deleteReplacement = `                                                                            onClick={() => {
                                                                                const updated = [...(kmListingForm.image_urls || [])];
                                                                                if (idx >= 4) {
                                                                                    updated.splice(idx, 1);
                                                                                    setPhotoCategories(prev => prev.filter((_, i) => i !== idx));
                                                                                } else {
                                                                                    updated[idx] = '';
                                                                                }
                                                                                setKmListingForm({ ...kmListingForm, image_urls: updated });
                                                                            }}`;

if (content.includes(deleteTarget)) {
  content = content.replace(deleteTarget, deleteReplacement);
  console.log("Delete handler updated successfully!");
} else {
  // Try normalized regex
  const escaped = deleteTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  content = content.replace(new RegExp(escaped), deleteReplacement);
  console.log("Delete handler updated via regex!");
}

// 2. Append the Add Category layout under grid
const gridTarget = `                                                    {photoCategories.map((label, idx) => {
                                                         const imgUrl = getImageUrlString(kmListingForm.image_urls?.[idx]);
                                                         return (
                                                             <div key={label} className="relative group">`;

// Let's find where the map ends. We can find the closing code around the grid
const gridEndTarget = `                                                                 )}
                                                             </div>
                                                         );
                                                     })}
                                                 </div>`;

const gridEndReplacement = `                                                                 )}
                                                             </div>
                                                         );
                                                     })}
                                                 </div>

                                                 <div className="flex gap-2 mt-2">
                                                     <input 
                                                         type="text"
                                                         placeholder="Nama Kategori Foto Baru (misal: Dapur Bersama)"
                                                         value={newPhotoCategoryName}
                                                         onChange={e => setNewPhotoCategoryName(e.target.value)}
                                                         className="flex-1 h-[36px] px-3 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500"
                                                     />
                                                     <button
                                                         type="button"
                                                         onClick={() => {
                                                             if (!newPhotoCategoryName.trim()) return;
                                                             const cat = newPhotoCategoryName.trim();
                                                             setPhotoCategories(prev => [...prev, cat]);
                                                             setKmListingForm((prev: any) => ({
                                                                 ...prev,
                                                                 image_urls: [...(prev.image_urls || []), '']
                                                             }));
                                                             setNewPhotoCategoryName('');
                                                         }}
                                                         className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#ff7a00] font-bold text-xs uppercase px-4 rounded-lg border border-[#e0c0af] transition-colors"
                                                     >
                                                         + Tambah Kategori
                                                     </button>
                                                 </div>`;

if (content.includes(gridEndTarget)) {
  content = content.replace(gridEndTarget, gridEndReplacement);
  console.log("Grid Add button layout appended successfully!");
} else {
  const escaped = gridEndTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  content = content.replace(new RegExp(escaped), gridEndReplacement);
  console.log("Grid Add button layout appended via regex!");
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
