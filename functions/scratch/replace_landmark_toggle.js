const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Declare showAddLandmarkForm state variable
const stateTarget = `    const [googleMapsUrlInput, setGoogleMapsUrlInput] = useState('');`;
const stateReplacement = `    const [googleMapsUrlInput, setGoogleMapsUrlInput] = useState('');
    const [showAddLandmarkForm, setShowAddLandmarkForm] = useState(false);`;

if (content.includes(stateTarget) && !content.includes('showAddLandmarkForm')) {
  content = content.replace(stateTarget, stateReplacement);
  console.log("showAddLandmarkForm state declared.");
}

// 2. Reset showAddLandmarkForm in openKostManagerListing
const openKMTarget = `                setPhotoCategories(loadedCategories);`;
const openKMReplacement = `                setPhotoCategories(loadedCategories);
                setShowAddLandmarkForm(false);`;

if (content.includes(openKMTarget)) {
  content = content.replace(openKMTarget, openKMReplacement);
  console.log("Reset showAddLandmarkForm in openKMTarget.");
}

const fallbackTarget = `        setPhotoCategories(['Bangunan Depan', 'Parkiran', 'Koridor', 'Lingkungan']);`;
const fallbackReplacement = `        setPhotoCategories(['Bangunan Depan', 'Parkiran', 'Koridor', 'Lingkungan']);
        setShowAddLandmarkForm(false);`;

// Let's also check if fallback has 'Parkiran' or 'Area Umum' because of earlier updates
const fallbackTargetAlt = `        setPhotoCategories(['Bangunan Depan', 'Koridor', 'Parkiran', 'Lingkungan']);`;
if (content.includes(fallbackTarget)) {
  content = content.replace(fallbackTarget, fallbackReplacement);
  console.log("Reset showAddLandmarkForm in fallback.");
} else if (content.includes(fallbackTargetAlt)) {
  content = content.replace(fallbackTargetAlt, `        setPhotoCategories(['Bangunan Depan', 'Koridor', 'Parkiran', 'Lingkungan']);
        setShowAddLandmarkForm(false);`);
  console.log("Reset showAddLandmarkForm in fallback Alt.");
}

// 3. Replace landmark JSX inputs with collapsible toggle layout
const jsxTarget = `                                                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200/60">
                                                    <input 
                                                        type="text"
                                                        placeholder="Nama Landmark (misal: Universitas Hasanuddin)"
                                                        value={newLandmarkName}
                                                        onChange={e => setNewLandmarkName(e.target.value)}
                                                        className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                    />
                                                    
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <span className="text-[9px] font-bold text-[#584235] uppercase tracking-wider">Tentukan Lokasi Landmark di Peta:</span>
                                                        <div ref={kmLandmarkMapRef} className="w-full h-32 z-0 relative rounded-lg border border-[#e0c0af]" style={{ minHeight: '120px' }} />
                                                        <p className="text-[8px] text-gray-500 font-mono mt-1 bg-white px-2 py-0.5 rounded border border-gray-200 self-end shadow-sm">
                                                            Lat: {landmarkLocation.lat.toFixed(6)}, Lng: {landmarkLocation.lng.toFixed(6)}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <span className="text-[9px] font-bold text-[#584235] uppercase tracking-wider">Konversi Link Google Maps / Koordinat:</span>
                                                        <div className="flex gap-2">
                                                            <input 
                                                                type="text"
                                                                placeholder="Tempel link Google Maps / koordinat raw (misal: -5.132, 119.488)"
                                                                value={googleMapsUrlInput}
                                                                onChange={e => {
                                                                    setGoogleMapsUrlInput(e.target.value);
                                                                    const parsed = parseGoogleMapsUrl(e.target.value);
                                                                    if (parsed) {
                                                                        setLandmarkLocation(parsed);
                                                                    }
                                                                }}
                                                                className="flex-1 h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white outline-none"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    const parsed = parseGoogleMapsUrl(googleMapsUrlInput);
                                                                    if (parsed) {
                                                                        setLandmarkLocation(parsed);
                                                                        alert('Berhasil mengonversi koordinat dari input!');
                                                                    } else if (googleMapsUrlInput.includes('maps.app.goo.gl') || googleMapsUrlInput.includes('goo.gl')) {
                                                                        alert('Mengonversi short link Google Maps... Silakan tunggu sebentar.');
                                                                        const shortParsed = await parseShortLinkCoordinates(googleMapsUrlInput);
                                                                        if (shortParsed) {
                                                                            setLandmarkLocation(shortParsed);
                                                                            alert('Berhasil mengonversi koordinat dari short link maps!');
                                                                        } else {
                                                                            alert('Gagal mengonversi short link. Pastikan link maps valid dan aktif.');
                                                                        }
                                                                    } else {
                                                                        alert('Format tidak dikenali atau koordinat tidak ditemukan.');
                                                                    }
                                                                }}
                                                                className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#264191] font-bold text-xs uppercase px-3 rounded-lg border border-[#d3e4fe] transition-colors"
                                                            >
                                                                Konversi
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!newLandmarkName.trim()) {
                                                                alert('Silakan isi nama landmark terlebih dahulu.');
                                                                return;
                                                            }
                                                            setKmListingForm({
                                                                ...kmListingForm,
                                                                campuses: [
                                                                    ...(kmListingForm.campuses || []),
                                                                    { name: newLandmarkName.trim(), lat: landmarkLocation.lat, lng: landmarkLocation.lng }
                                                                ]
                                                            });
                                                            setNewLandmarkName('');
                                                            setGoogleMapsUrlInput('');
                                                            alert('Landmark berhasil ditambahkan!');
                                                        }}
                                                        className="w-full h-[40px] bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-colors mt-1"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">add_location_alt</span>
                                                        Tambah Landmark Baru
                                                    </button>
                                                </div>`;

const jsxReplacement = `                                                <div className="pt-2 border-t border-gray-200/60">
                                                    {!showAddLandmarkForm ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowAddLandmarkForm(true);
                                                                setLandmarkLocation(kmListingForm.location || { lat: -5.147665, lng: 119.432731 });
                                                            }}
                                                            className="w-full h-[40px] border border-dashed border-[#ff7a00] hover:bg-orange-50/50 text-[#ff7a00] font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">add_location_alt</span>
                                                            + Tambah Landmark Baru
                                                        </button>
                                                    ) : (
                                                        <div className="flex flex-col gap-2 bg-[#fdfdfd] p-3 rounded-lg border border-[#e0c0af]/50 mt-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[10px] font-bold text-[#584235] uppercase tracking-wider">Form Tambah Landmark</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNewLandmarkName('');
                                                                        setGoogleMapsUrlInput('');
                                                                        setShowAddLandmarkForm(false);
                                                                    }}
                                                                    className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                                                                >
                                                                    Batal
                                                                </button>
                                                            </div>
                                                            <input 
                                                                type="text"
                                                                placeholder="Nama Landmark (misal: Universitas Hasanuddin)"
                                                                value={newLandmarkName}
                                                                onChange={e => setNewLandmarkName(e.target.value)}
                                                                className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                            />
                                                            
                                                            <div className="flex flex-col gap-1 mt-1">
                                                                <span className="text-[9px] font-bold text-[#584235] uppercase tracking-wider">Tentukan Lokasi Landmark di Peta:</span>
                                                                <div ref={kmLandmarkMapRef} className="w-full h-32 z-0 relative rounded-lg border border-[#e0c0af]" style={{ minHeight: '120px' }} />
                                                                <p className="text-[8px] text-gray-500 font-mono mt-1 bg-white px-2 py-0.5 rounded border border-gray-200 self-end shadow-sm">
                                                                    Lat: {landmarkLocation.lat.toFixed(6)}, Lng: {landmarkLocation.lng.toFixed(6)}
                                                                </p>
                                                            </div>

                                                            <div className="flex flex-col gap-1 mt-1">
                                                                <span className="text-[9px] font-bold text-[#584235] uppercase tracking-wider">Konversi Link Google Maps / Koordinat:</span>
                                                                <div className="flex gap-2">
                                                                    <input 
                                                                        type="text"
                                                                        placeholder="Tempel link Google Maps / koordinat raw"
                                                                        value={googleMapsUrlInput}
                                                                        onChange={e => {
                                                                            setGoogleMapsUrlInput(e.target.value);
                                                                            const parsed = parseGoogleMapsUrl(e.target.value);
                                                                            if (parsed) {
                                                                                setLandmarkLocation(parsed);
                                                                            }
                                                                        }}
                                                                        className="flex-1 h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white outline-none"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={async () => {
                                                                            const parsed = parseGoogleMapsUrl(googleMapsUrlInput);
                                                                            if (parsed) {
                                                                                setLandmarkLocation(parsed);
                                                                                alert('Berhasil mengonversi koordinat dari input!');
                                                                            } else if (googleMapsUrlInput.includes('maps.app.goo.gl') || googleMapsUrlInput.includes('goo.gl')) {
                                                                                alert('Mengonversi short link Google Maps... Silakan tunggu sebentar.');
                                                                                const shortParsed = await parseShortLinkCoordinates(googleMapsUrlInput);
                                                                                if (shortParsed) {
                                                                                    setLandmarkLocation(shortParsed);
                                                                                    alert('Berhasil mengonversi koordinat dari short link maps!');
                                                                                } else {
                                                                                    alert('Gagal mengonversi short link. Pastikan link maps valid dan aktif.');
                                                                                }
                                                                            } else {
                                                                                alert('Format tidak dikenali atau koordinat tidak ditemukan.');
                                                                            }
                                                                        }}
                                                                        className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#264191] font-bold text-xs uppercase px-3 rounded-lg border border-[#d3e4fe] transition-colors"
                                                                    >
                                                                        Konversi
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2 mt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!newLandmarkName.trim()) {
                                                                            alert('Silakan isi nama landmark terlebih dahulu.');
                                                                            return;
                                                                        }
                                                                        setKmListingForm({
                                                                            ...kmListingForm,
                                                                            campuses: [
                                                                                ...(kmListingForm.campuses || []),
                                                                                { name: newLandmarkName.trim(), lat: landmarkLocation.lat, lng: landmarkLocation.lng }
                                                                            ]
                                                                        });
                                                                        setNewLandmarkName('');
                                                                        setGoogleMapsUrlInput('');
                                                                        setShowAddLandmarkForm(false);
                                                                        alert('Landmark berhasil ditambahkan!');
                                                                    }}
                                                                    className="flex-1 h-[40px] bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-colors"
                                                                >
                                                                    Simpan Landmark
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNewLandmarkName('');
                                                                        setGoogleMapsUrlInput('');
                                                                        setShowAddLandmarkForm(false);
                                                                    }}
                                                                    className="h-[40px] px-4 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-gray-200 transition-colors"
                                                                >
                                                                    Batal
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>`;

if (content.includes(jsxTarget)) {
  content = content.replace(jsxTarget, jsxReplacement);
  console.log("Successfully replaced exact!");
} else {
  const cleanTarget = jsxTarget.replace(/\s+/g, ' ');
  const cleanContent = content.replace(/\s+/g, ' ');
  if (cleanContent.includes(cleanTarget)) {
    const escaped = jsxTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    content = content.replace(new RegExp(escaped), jsxReplacement);
    console.log("Successfully replaced via regex!");
  } else {
    console.error("Could not find the target landmark inputs block in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
