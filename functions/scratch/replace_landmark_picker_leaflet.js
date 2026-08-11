const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Declare state and refs
const stateTarget = `    const [newLandmarkLat, setNewLandmarkLat] = useState<number>(0);
    const [newLandmarkLng, setNewLandmarkLng] = useState<number>(0);`;

const stateReplacement = `    const [landmarkLocation, setLandmarkLocation] = useState<{ lat: number; lng: number }>({ lat: -5.147665, lng: 119.432731 });
    const kmLandmarkMapRef = useRef<HTMLDivElement>(null);
    const kmLandmarkMapInstance = useRef<any>(null);
    const kmLandmarkMarkerInstance = useRef<any>(null);`;

if (content.includes(stateTarget)) {
  content = content.replace(stateTarget, stateReplacement);
  console.log("Landmark map states and refs declared.");
}

// 2. Add Leaflet map pickers useEffect handlers for landmark
const effectTarget = `    const kmMapRef = useRef<HTMLDivElement>(null);
    const kmMapInstance = useRef<any>(null);
    const kmMarkerInstance = useRef<any>(null);
    const kmOriginalLocationRef = useRef<any>(null);`;

const effectReplacement = `    const kmMapRef = useRef<HTMLDivElement>(null);
    const kmMapInstance = useRef<any>(null);
    const kmMarkerInstance = useRef<any>(null);
    const kmOriginalLocationRef = useRef<any>(null);

    // Initializer for landmark map picker
    useEffect(() => {
        if (kmLandmarkMapInstance.current) {
            kmLandmarkMapInstance.current.remove();
            kmLandmarkMapInstance.current = null;
            kmLandmarkMarkerInstance.current = null;
        }

        if (!isEditingKostManager || kmStep !== 1 || !kmLandmarkMapRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        const initialLat = kmListingForm.location?.lat || -5.147665;
        const initialLng = kmListingForm.location?.lng || 119.432731;

        try {
            const map = L.map(kmLandmarkMapRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([initialLat, initialLng], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            const marker = L.marker([initialLat, initialLng]).addTo(map);

            map.on('click', (e: any) => {
                setLandmarkLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
            });

            kmLandmarkMapInstance.current = map;
            kmLandmarkMarkerInstance.current = marker;

            setTimeout(() => {
                map.invalidateSize();
            }, 250);
        } catch (e) {
            console.error("Leaflet landmark init error:", e);
        }

        return () => {
            if (kmLandmarkMapInstance.current) {
                kmLandmarkMapInstance.current.remove();
                kmLandmarkMapInstance.current = null;
                kmLandmarkMarkerInstance.current = null;
            }
        };
    }, [isEditingKostManager, kmStep, !!kmLandmarkMapRef.current]);

    // Update landmark marker position when state updates
    useEffect(() => {
        if (kmLandmarkMarkerInstance.current && landmarkLocation) {
            kmLandmarkMarkerInstance.current.setLatLng([landmarkLocation.lat, landmarkLocation.lng]);
            if (kmLandmarkMapInstance.current) {
                kmLandmarkMapInstance.current.panTo([landmarkLocation.lat, landmarkLocation.lng]);
            }
        }
    }, [landmarkLocation.lat, landmarkLocation.lng]);

    // Sync landmark location with main property location when property coordinates are locked
    useEffect(() => {
        if (kmListingForm.location && kmLandmarkMapInstance.current) {
            kmLandmarkMapInstance.current.setView([kmListingForm.location.lat, kmListingForm.location.lng]);
            setLandmarkLocation({ lat: kmListingForm.location.lat, lng: kmListingForm.location.lng });
        }
    }, [kmListingForm.location?.lat, kmListingForm.location?.lng]);`;

if (content.includes(effectTarget)) {
  content = content.replace(effectTarget, effectReplacement);
  console.log("Landmark map pickers useEffect hooks added.");
}

// 3. Replace the landmark JSX inputs block with the interactive map picker
const jsxTarget = `                                                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200/60">
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

const jsxReplacement = `                                                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200/60">
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
    console.error("Could not find the target landmark picker JSX block in the file!");
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
