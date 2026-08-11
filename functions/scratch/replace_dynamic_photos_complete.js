const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Declare state variables
const stateTarget = `    const [isEditingKostManager, setIsEditingKostManager] = useState<SurveyRequest | null>(null);`;
const stateReplacement = `    const [isEditingKostManager, setIsEditingKostManager] = useState<SurveyRequest | null>(null);
    const [photoCategories, setPhotoCategories] = useState<string[]>(['Bangunan Depan', 'Koridor', 'Parkiran', 'Lingkungan']);
    const [newPhotoCategoryName, setNewPhotoCategoryName] = useState('');`;

if (content.includes(stateTarget) && !content.includes('photoCategories')) {
  content = content.replace(stateTarget, stateReplacement);
  console.log("State variables added.");
}

// 2. Add getImageUrlString helper
const helperTarget = `    const checkHasFacility = (facilityList: string[], target: string) => {`;
const helperReplacement = `    const getImageUrlString = (img: any): string => {
        if (!img) return '';
        if (typeof img === 'string') return img;
        if (typeof img === 'object' && img.original) return img.original;
        if (typeof img === 'object' && img.url) return img.url;
        return '';
    };

    const checkHasFacility = (facilityList: string[], target: string) => {`;

if (content.includes(helperTarget) && !content.includes('getImageUrlString')) {
  content = content.replace(helperTarget, helperReplacement);
  console.log("getImageUrlString helper added.");
}

// 3. Update openKostManagerListing existingProp parsing
const openKMTarget = `            if (existingProp) {
                console.log("openKostManagerListing: found existing property to load:", existingProp.id);
                kmOriginalLocationRef.current = existingProp.location || null;
                setKmListingForm({`;

const openKMReplacement = `            if (existingProp) {
                console.log("openKostManagerListing: found existing property to load:", existingProp.id);
                kmOriginalLocationRef.current = existingProp.location || null;
                
                // Parse photo categories
                const loadedCategories = ['Bangunan Depan', 'Koridor', 'Parkiran', 'Lingkungan'];
                if (existingProp.image_urls && Array.isArray(existingProp.image_urls)) {
                    existingProp.image_urls.forEach((img: any, idx: number) => {
                        let label = img.label || '';
                        if (label.toLowerCase() === 'area umum') {
                            label = 'Parkiran';
                        }
                        if (idx < 4) {
                            if (label) {
                                loadedCategories[idx] = label;
                            }
                        } else {
                            loadedCategories.push(label || \`Foto Lainnya \${idx - 3}\`);
                        }
                    });
                }
                setPhotoCategories(loadedCategories);

                setKmListingForm({`;

if (content.includes(openKMTarget)) {
  content = content.replace(openKMTarget, openKMReplacement);
  console.log("openKostManagerListing existingProp parsing updated.");
}

// Update openKostManagerListing fallback branch
const fallbackTarget = `        // Fallback initialization
        kmOriginalLocationRef.current = null;
        setKmListingForm({`;

const fallbackReplacement = `        // Fallback initialization
        kmOriginalLocationRef.current = null;
        setPhotoCategories(['Bangunan Depan', 'Koridor', 'Parkiran', 'Lingkungan']);
        setKmListingForm({`;

if (content.includes(fallbackTarget)) {
  content = content.replace(fallbackTarget, fallbackReplacement);
  console.log("openKostManagerListing fallback updated.");
}

// 4. Update handleSaveKostManagerListing format image_urls
const saveTarget = `                image_urls: kmListingForm.image_urls,`;
const saveReplacement = `                image_urls: (kmListingForm.image_urls || []).map((img: any, idx: number) => {
                    const url = getImageUrlString(img);
                    if (!url) return null;
                    const label = photoCategories[idx] || 'Foto Lainnya';
                    return { original: url, label: label };
                }).filter(Boolean),`;

if (content.includes(saveTarget)) {
  content = content.replace(saveTarget, saveReplacement);
  console.log("handleSaveKostManagerListing payload format updated.");
}

// 5. Replace Dokumentasi Area Umum JSX block completely
const jsxBlockTarget = `                                            <div className="flex flex-col gap-2">
                                                <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Dokumentasi Area Umum</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['Bangunan Depan', 'Koridor', 'Area Umum', 'Lingkungan'].map((label, idx) => {
                                                        const imgUrl = kmListingForm.image_urls?.[idx];
                                                        return (
                                                            <div key={label} className="relative group">
                                                                {imgUrl ? (
                                                                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 relative">
                                                                        <img src={imgUrl} alt={label} className="w-full h-full object-cover" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const updated = [...(kmListingForm.image_urls || [])];
                                                                                updated[idx] = '';
                                                                                setKmListingForm({ ...kmListingForm, image_urls: updated });
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
                                                                                    setUploadingPublicAreas(prev => ({ ...prev, [idx]: true }));
                                                                                    try {
                                                                                        const folder = \`kostmanager/public/\${Date.now()}\`;
                                                                                        const publicUrl = await uploadFileAndGetURL(file, folder);
                                                                                        setKmListingForm((prev: any) => {
                                                                                            const currentImages = [...(prev.image_urls || [])];
                                                                                            currentImages[idx] = publicUrl;
                                                                                            return { ...prev, image_urls: currentImages };
                                                                                        });
                                                                                    } catch (err) {
                                                                                        alert('Gagal unggah foto: ' + (err as Error).message);
                                                                                    } finally {
                                                                                        setUploadingPublicAreas(prev => ({ ...prev, [idx]: false }));
                                                                                    }
                                                                                }
                                                                            };
                                                                            input.click();
                                                                        }}
                                                                        className="aspect-video bg-[#e5eeff] border-2 border-dashed border-[#e0c0af] rounded-xl flex flex-col items-center justify-center gap-1 text-[#584235] hover:bg-[#dce9ff] transition-colors cursor-pointer"
                                                                    >
                                                                        {uploadingPublicAreas[idx] ? (
                                                                            <span className="text-[10px] font-bold animate-pulse">Uploading...</span>
                                                                        ) : (
                                                                            <>
                                                                                <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                                                                                <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>`;

const jsxBlockReplacement = `                                            <div className="flex flex-col gap-2">
                                                <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Dokumentasi Area Umum</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {photoCategories.map((label, idx) => {
                                                        const imgUrl = getImageUrlString(kmListingForm.image_urls?.[idx]);
                                                        return (
                                                            <div key={label} className="relative group">
                                                                {imgUrl ? (
                                                                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 relative">
                                                                        <img src={imgUrl} alt={label} className="w-full h-full object-cover" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const updated = [...(kmListingForm.image_urls || [])];
                                                                                if (idx >= 4) {
                                                                                    updated.splice(idx, 1);
                                                                                    setPhotoCategories(prev => prev.filter((_, i) => i !== idx));
                                                                                } else {
                                                                                    updated[idx] = '';
                                                                                }
                                                                                setKmListingForm({ ...kmListingForm, image_urls: updated });
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
                                                                                    setUploadingPublicAreas(prev => ({ ...prev, [idx]: true }));
                                                                                    try {
                                                                                        const folder = \`kostmanager/public/\${Date.now()}\`;
                                                                                        const publicUrl = await uploadFileAndGetURL(file, folder);
                                                                                        setKmListingForm((prev: any) => {
                                                                                            const currentImages = [...(prev.image_urls || [])];
                                                                                            currentImages[idx] = publicUrl;
                                                                                            return { ...prev, image_urls: currentImages };
                                                                                        });
                                                                                    } catch (err) {
                                                                                        alert('Gagal unggah foto: ' + (err as Error).message);
                                                                                    } finally {
                                                                                        setUploadingPublicAreas(prev => ({ ...prev, [idx]: false }));
                                                                                    }
                                                                                }
                                                                            };
                                                                            input.click();
                                                                        }}
                                                                        className="aspect-video bg-[#e5eeff] border-2 border-dashed border-[#e0c0af] rounded-xl flex flex-col items-center justify-center gap-1 text-[#584235] hover:bg-[#dce9ff] transition-colors cursor-pointer"
                                                                    >
                                                                        {uploadingPublicAreas[idx] ? (
                                                                            <span className="text-[10px] font-bold animate-pulse">Uploading...</span>
                                                                        ) : (
                                                                            <>
                                                                                <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                                                                                <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex gap-2 mt-2">
                                                    <input 
                                                        type="text"
                                                        placeholder="Kategori Foto Baru (misal: Dapur Bersama)"
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
                                                </div>
                                            </div>`;

if (content.includes(jsxBlockTarget)) {
  content = content.replace(jsxBlockTarget, jsxBlockReplacement);
  console.log("JSX layout block replaced exactly!");
} else {
  // Try normalized replacement
  const cleanTarget = jsxBlockTarget.replace(/\s+/g, ' ');
  const cleanContent = content.replace(/\s+/g, ' ');
  if (cleanContent.includes(cleanTarget)) {
    const escaped = jsxBlockTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    content = content.replace(new RegExp(escaped), jsxBlockReplacement);
    console.log("JSX layout block replaced via regex!");
  } else {
    console.error("Could not find the target JSX block in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Replaced fully.");
