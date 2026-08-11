const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Declare state variables for photo categories
const stateTarget = `    const [isEditingKostManager, setIsEditingKostManager] = useState<SurveyRequest | null>(null);`;
const stateReplacement = `    const [isEditingKostManager, setIsEditingKostManager] = useState<SurveyRequest | null>(null);
    const [photoCategories, setPhotoCategories] = useState<string[]>(['Bangunan Depan', 'Koridor', 'Parkiran', 'Lingkungan']);
    const [newPhotoCategoryName, setNewPhotoCategoryName] = useState('');`;

if (content.includes(stateTarget)) {
  content = content.replace(stateTarget, stateReplacement);
  console.log("State variables added.");
} else {
  console.error("stateTarget not found!");
}

// 2. Update openKostManagerListing to parse existing image categories
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
  console.log("openKostManagerListing existingProp category parser added.");
} else {
  console.error("openKMTarget not found!");
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
  console.log("openKostManagerListing fallback category reset added.");
} else {
  console.error("fallbackTarget not found!");
}

// 3. Update handleSaveKostManagerListing format image_urls
const saveTarget = `                image_urls: (kmListingForm.image_urls || []).map((img: any) => {
                    if (!img) return null;
                    if (typeof img === 'string') return { original: img };
                    if (typeof img === 'object' && img.original) return img;
                    return null;
                }).filter(Boolean),`;

const saveReplacement = `                image_urls: (kmListingForm.image_urls || []).map((img: any, idx: number) => {
                    const url = getImageUrlString(img);
                    if (!url) return null;
                    const label = photoCategories[idx] || 'Foto Lainnya';
                    return { original: url, label: label };
                }).filter(Boolean),`;

if (content.includes(saveTarget)) {
  content = content.replace(saveTarget, saveReplacement);
  console.log("handleSaveKostManagerListing payload mapping updated.");
} else {
  console.error("saveTarget not found!");
}

// 4. Update JSX mapping for Dokumentasi Area Umum
const jsxTarget = `                                                    {['Bangunan Depan', 'Koridor', 'Area Umum', 'Lingkungan'].map((label, idx) => {
                                                         const imgUrl = getImageUrlString(kmListingForm.image_urls?.[idx]);`;

const jsxReplacement = `                                                    {photoCategories.map((label, idx) => {
                                                         const imgUrl = getImageUrlString(kmListingForm.image_urls?.[idx]);`;

if (content.includes(jsxTarget)) {
  content = content.replace(jsxTarget, jsxReplacement);
  console.log("JSX map target updated.");
} else {
  // Let's search with general search or handle manually
  console.error("jsxTarget not found. Looking with 'Area Umum' instead of 'Parkiran' since we didn't change it yet?");
  
  // Ah, wait! In our previous turn we had: ['Bangunan Depan', 'Koridor', 'Area Umum', 'Lingkungan'] in JSX!
  // Yes! The target was exactly that! Let's see if we can find it.
  const jsxTargetAlt = `                                                    {['Bangunan Depan', 'Koridor', 'Area Umum', 'Lingkungan'].map((label, idx) => {`;
  if (content.includes(jsxTargetAlt)) {
     content = content.replace(jsxTargetAlt, `                                                    {photoCategories.map((label, idx) => {`);
     console.log("JSX map target replaced using Alt.");
  }
}

// 5. Update delete button inside JSX mapping
const deleteTarget = `                                                                                 const updated = [...(kmListingForm.image_urls || [])];
                                                                                 updated[idx] = '';
                                                                                 setKmListingForm({ ...kmListingForm, image_urls: updated });`;

const deleteReplacement = `                                                                                 const updated = [...(kmListingForm.image_urls || [])];
                                                                                 if (idx >= 4) {
                                                                                     updated.splice(idx, 1);
                                                                                     setPhotoCategories(prev => prev.filter((_, i) => i !== idx));
                                                                                 } else {
                                                                                     updated[idx] = '';
                                                                                 }
                                                                                 setKmListingForm({ ...kmListingForm, image_urls: updated });`;

if (content.includes(deleteTarget)) {
  content = content.replace(deleteTarget, deleteReplacement);
  console.log("JSX delete handler updated.");
} else {
  console.error("deleteTarget not found!");
}

// 6. Append + Tambah Kategori Foto Baru button under grid
const gridEndTarget = `                                                    })}
                                                </div>`;

const gridEndReplacement = `                                                    })}
                                                </div>

                                                <div className="flex gap-2 mt-2">
                                                    <input 
                                                        type="text"
                                                        placeholder="Nama Kategori Foto Baru (misal: Dapur)"
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
  // Wait, gridEndTarget might match multiple times! Let's check how many times it matches.
  // Actually, we want to match it specifically in the Dokumentasi Area Umum section.
  // Let's do a more specific replace in a node script.
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done phase 1.");
