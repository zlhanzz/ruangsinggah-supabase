const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Declare state variables for landmark coords
const stateTarget = `    const [newPhotoCategoryName, setNewPhotoCategoryName] = useState('');`;
const stateReplacement = `    const [newPhotoCategoryName, setNewPhotoCategoryName] = useState('');
    const [newLandmarkLat, setNewLandmarkLat] = useState<number>(0);
    const [newLandmarkLng, setNewLandmarkLng] = useState<number>(0);`;

if (content.includes(stateTarget) && !content.includes('newLandmarkLat')) {
  content = content.replace(stateTarget, stateReplacement);
  console.log("Landmark coords states added.");
}

// 2. Replace the Landmark inputs in JSX
const jsxTarget = `                                                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200/60">
                                                    <input 
                                                        type="text"
                                                        placeholder="Nama Landmark (misal: Universitas Indonesia)"
                                                        value={newLandmarkName}
                                                        onChange={e => setNewLandmarkName(e.target.value)}
                                                        className="w-full h-[36px] px-3 border border-[#8c7263] rounded-lg text-xs"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!newLandmarkName.trim()) return;
                                                            if (navigator.geolocation) {
                                                                navigator.geolocation.getCurrentPosition((pos) => {
                                                                    setKmListingForm({
                                                                        ...kmListingForm,
                                                                        campuses: [
                                                                            ...(kmListingForm.campuses || []),
                                                                            { name: newLandmarkName.trim(), lat: pos.coords.latitude, lng: pos.coords.longitude }
                                                                        ]
                                                                    });
                                                                    setNewLandmarkName('');
                                                                    alert('Landmark berhasil ditambahkan dengan GPS terkunci!');
                                                                }, err => {
                                                                    // Fallback to property location
                                                                    setKmListingForm({
                                                                        ...kmListingForm,
                                                                        campuses: [
                                                                            ...(kmListingForm.campuses || []),
                                                                            { name: newLandmarkName.trim(), lat: kmListingForm.location?.lat, lng: kmListingForm.location?.lng }
                                                                        ]
                                                                    });
                                                                    setNewLandmarkName('');
                                                                    alert('Landmark ditambahkan menggunakan koordinat properti default.');
                                                                });
                                                            }
                                                        }}
                                                        className="bg-[#e5eeff] hover:bg-[#dce9ff] text-[#ff7a00] font-bold text-xs uppercase py-2 rounded-lg flex items-center justify-center gap-1 border border-[#e0c0af] transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-xs">add_location_alt</span>
                                                        Kunci & Tambah Landmark
                                                    </button>
                                                </div>`;

const jsxReplacement = `                                                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200/60">
                                                    <input 
                                                        type="text"
                                                        placeholder="Nama Landmark (misal: Universitas Indonesia)"
                                                        value={newLandmarkName}
                                                        onChange={e => setNewLandmarkName(e.target.value)}
                                                        className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-medium"
                                                    />
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="number"
                                                            step="any"
                                                            placeholder="Latitude (misal: -5.1326)"
                                                            value={newLandmarkLat || ''}
                                                            onChange={e => setNewLandmarkLat(parseFloat(e.target.value) || 0)}
                                                            className="flex-1 h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white"
                                                        />
                                                        <input 
                                                            type="number"
                                                            step="any"
                                                            placeholder="Longitude (misal: 119.4886)"
                                                            value={newLandmarkLng || ''}
                                                            onChange={e => setNewLandmarkLng(parseFloat(e.target.value) || 0)}
                                                            className="flex-1 h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setNewLandmarkLat(kmListingForm.location?.lat || -5.147665);
                                                                setNewLandmarkLng(kmListingForm.location?.lng || 119.432731);
                                                            }}
                                                            className="flex-1 h-[32px] bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-[10px] uppercase tracking-wider rounded-lg border border-gray-200 transition-colors"
                                                        >
                                                            Gunakan Titik Peta Kost
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (navigator.geolocation) {
                                                                    navigator.geolocation.getCurrentPosition((pos) => {
                                                                        setNewLandmarkLat(pos.coords.latitude);
                                                                        setNewLandmarkLng(pos.coords.longitude);
                                                                    }, err => alert('Gagal membaca GPS: ' + err.message));
                                                                }
                                                            }}
                                                            className="flex-1 h-[32px] bg-[#eff4ff] hover:bg-[#dce9ff] text-[#264191] font-bold text-[10px] uppercase tracking-wider rounded-lg border border-[#d3e4fe] transition-colors"
                                                        >
                                                            Deteksi GPS Saya
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!newLandmarkName.trim()) return;
                                                            const lat = newLandmarkLat || kmListingForm.location?.lat || -5.147665;
                                                            const lng = newLandmarkLng || kmListingForm.location?.lng || 119.432731;
                                                            setKmListingForm({
                                                                ...kmListingForm,
                                                                campuses: [
                                                                    ...(kmListingForm.campuses || []),
                                                                    { name: newLandmarkName.trim(), lat, lng }
                                                                ]
                                                            });
                                                            setNewLandmarkName('');
                                                            setNewLandmarkLat(0);
                                                            setNewLandmarkLng(0);
                                                            alert('Landmark berhasil ditambahkan!');
                                                        }}
                                                        className="w-full h-[40px] bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-colors mt-1"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">add_location_alt</span>
                                                        Tambah Landmark Baru
                                                    </button>
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
    console.error("Could not find the target landmark picker block in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
