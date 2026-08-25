const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Declare the new states customPublicKitchenFacilityInput and customPublicBathroomFacilityInput
const stateTarget = `    const [customBathroomFacilityInput, setCustomBathroomFacilityInput] = useState('');`;
const stateReplacement = `    const [customBathroomFacilityInput, setCustomBathroomFacilityInput] = useState('');
    const [customPublicKitchenFacilityInput, setCustomPublicKitchenFacilityInput] = useState('');`;

if (content.includes(stateTarget)) {
  content = content.replace(stateTarget, stateReplacement);
  console.log("Custom public facility inputs states declared.");
} else {
  console.error("CRITICAL: customBathroomFacilityInput state target not found!");
}

// 2. Add publicKitchenFacilities and publicBathroomFacilities fields to state schemas
// A. Default State
const defaultStateTarget = `    const [kmListingForm, setKmListingForm] = useState<any>({
        title: '',
        description: '',
        address: '',
        city: 'Makassar',
        area: '',
        type: 'Campur',
        price: 0,
        owner_uid: '',
        roomTypes: [],`;

const defaultStateReplacement = `    const [kmListingForm, setKmListingForm] = useState<any>({
        title: '',
        description: '',
        address: '',
        city: 'Makassar',
        area: '',
        type: 'Campur',
        price: 0,
        owner_uid: '',
        roomTypes: [],
        publicBathroomFacilities: [],
        publicKitchenFacilities: [],`;

if (content.includes(defaultStateTarget)) {
  content = content.replace(defaultStateTarget, defaultStateReplacement);
  console.log("publicKitchenFacilities and publicBathroomFacilities added to Default State.");
} else {
  console.error("CRITICAL: Default State target not found!");
}

// B. closeKostManagerListing
const closeTarget = `        setKmListingForm({
            title: '',
            description: '',
            address: '',
            city: 'Makassar',
            area: '',
            type: 'Campur',
            price: 0,
            owner_uid: '',
            roomTypes: [],`;

const closeReplacement = `        setKmListingForm({
            title: '',
            description: '',
            address: '',
            city: 'Makassar',
            area: '',
            type: 'Campur',
            price: 0,
            owner_uid: '',
            roomTypes: [],
            publicBathroomFacilities: [],
            publicKitchenFacilities: [],`;

if (content.includes(closeTarget)) {
  content = content.replace(closeTarget, closeReplacement);
  console.log("publicKitchenFacilities and publicBathroomFacilities added to closeKostManagerListing.");
} else {
  console.error("CRITICAL: closeKostManagerListing target not found!");
}

// C. openKostManagerListing fallback (target owner_uid directly for safety)
const openFallbackTarget = `            price: 0,
            totalRooms: 0,
            owner_uid: req.user_id,`;

const openFallbackReplacement = `            price: 0,
            totalRooms: 0,
            owner_uid: req.user_id,
            roomTypes: [],
            publicBathroomFacilities: [],
            publicKitchenFacilities: [],`;

if (content.includes(openFallbackTarget)) {
  content = content.replace(openFallbackTarget, openFallbackReplacement);
  console.log("publicKitchenFacilities and publicBathroomFacilities added to openKostManagerListing fallback.");
} else {
  console.error("CRITICAL: openKostManagerListing fallback target not found!");
}

// D. openKostManagerListing existingProp
const openExistingTarget = `                setKmListingForm({
                    title: existingProp.title || req.kost_name,
                    description: existingProp.description || '',
                    address: existingProp.address || req.kost_address,
                    city: existingProp.city || 'Makassar',
                    area: existingProp.area || '',
                    type: existingProp.type || 'Campur',
                    price: existingProp.price || 0,
                    totalRooms: existingProp.total_rooms || 0,
                    owner_uid: req.user_id,
                    roomTypes: [], // Start empty for Kost Manager onboarding as requested
                    facilities: existingProp.facilities || ['WiFi', 'Parkir Motor'],
                    location: existingProp.location || { lat: -5.147665, lng: 119.432731 },
                    rules: existingProp.rules || ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
                    image_urls: existingProp.image_urls || [],
                    campuses: existingProp.campuses || [],
                    publicBathroomFacilities: existingProp.metadata?.publicBathroomFacilities || []`;

const openExistingReplacement = `                setKmListingForm({
                    title: existingProp.title || req.kost_name,
                    description: existingProp.description || '',
                    address: existingProp.address || req.kost_address,
                    city: existingProp.city || 'Makassar',
                    area: existingProp.area || '',
                    type: existingProp.type || 'Campur',
                    price: existingProp.price || 0,
                    totalRooms: existingProp.total_rooms || 0,
                    owner_uid: req.user_id,
                    roomTypes: [], // Start empty for Kost Manager onboarding as requested
                    facilities: existingProp.facilities || ['WiFi', 'Parkir Motor'],
                    location: existingProp.location || { lat: -5.147665, lng: 119.432731 },
                    rules: existingProp.rules || ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
                    image_urls: existingProp.image_urls || [],
                    campuses: existingProp.campuses || [],
                    publicBathroomFacilities: existingProp.metadata?.publicBathroomFacilities || [],
                    publicKitchenFacilities: existingProp.metadata?.publicKitchenFacilities || []`;

if (content.includes(openExistingTarget)) {
  content = content.replace(openExistingTarget, openExistingReplacement);
  console.log("publicKitchenFacilities added to openKostManagerListing existingProp.");
} else {
  console.error("CRITICAL: openKostManagerListing existingProp target not found!");
}

// 3. Save publicKitchenFacilities in Supabase submission payload metadata
const payloadMetadataTarget = `                metadata: {
                    publicBathroomFacilities: kmListingForm.publicBathroomFacilities || [],
                    digitalSignature: signatureData
                }`;

const payloadMetadataReplacement = `                metadata: {
                    publicBathroomFacilities: kmListingForm.publicBathroomFacilities || [],
                    publicKitchenFacilities: kmListingForm.publicKitchenFacilities || [],
                    digitalSignature: signatureData
                }`;

if (content.includes(payloadMetadataTarget)) {
  content = content.replace(payloadMetadataTarget, payloadMetadataReplacement);
  console.log("publicKitchenFacilities added to payload metadata.");
} else {
  console.error("CRITICAL: payload metadata target not found!");
}

const kmPayloadMetadataTarget = `                    metadata: {
                        publicBathroomFacilities: kmListingForm.publicBathroomFacilities || []
                    }`;

const kmPayloadMetadataReplacement = `                    metadata: {
                        publicBathroomFacilities: kmListingForm.publicBathroomFacilities || [],
                        publicKitchenFacilities: kmListingForm.publicKitchenFacilities || []
                    }`;

if (content.includes(kmPayloadMetadataTarget)) {
  content = content.replace(kmPayloadMetadataTarget, kmPayloadMetadataReplacement);
  console.log("publicKitchenFacilities added to mitra_kostmanager metadata.");
} else {
  console.error("CRITICAL: mitra_kostmanager metadata target not found!");
}

// 4. Render publicKitchenFacilities and publicBathroomFacilities sub-inputs
// Target the specific closing tags with flexible regex or lines index for safety
const linesTarget = content.split('\n');
const gridEndIndex = linesTarget.findIndex((l) => l.includes("['WiFi', 'Dapur Bersama', 'Area Parkir', 'Ruang Tamu', 'CCTV', 'Laundry', 'WC Umum'].map(fac"));

if (gridEndIndex !== -1) {
  // Find the closing </div> of that container
  let closeDivIndex = -1;
  for (let i = gridEndIndex; i < gridEndIndex + 40; i++) {
    if (linesTarget[i].includes('</div>') && linesTarget[i].trim() === '</div>') {
      closeDivIndex = i;
      break;
    }
  }
  
  if (closeDivIndex !== -1) {
    console.log(`Found facilities grid closing </div> at line ${closeDivIndex + 1}. Inserting sub-inputs.`);
    const subInputsBlock = `

                                                {/* Sub-input Dapur Bersama */}
                                                {checkHasFacility(kmListingForm.facilities, 'Dapur Bersama') && (
                                                    <div className="mt-2.5 pl-6 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl">
                                                        <span className="text-[10px] font-black text-[#584235] uppercase tracking-wider mb-0.5">Kelengkapan Dapur Bersama:</span>
                                                        <div className="grid grid-cols-2 gap-2.5">
                                                            {['Kompor', 'Kulkas', 'Dispenser', 'Wastafel Cuci Piring', 'Peralatan Masak', 'Meja Makan'].map(kfac => {
                                                                const isKChecked = kmListingForm.publicKitchenFacilities?.includes(kfac);
                                                                return (
                                                                    <label key={kfac} className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={isKChecked}
                                                                            onChange={() => {
                                                                                const current = kmListingForm.publicKitchenFacilities || [];
                                                                                const updated = current.includes(kfac)
                                                                                    ? current.filter((f: string) => f !== kfac)
                                                                                    : [...current, kfac];
                                                                                setKmListingForm({ ...kmListingForm, publicKitchenFacilities: updated });
                                                                            }}
                                                                            className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                        />
                                                                        <span className="text-xs text-[#584235] uppercase tracking-wider font-bold">{kfac}</span>
                                                                    </label>
                                                                );
                                                            })}

                                                            {/* Custom kitchen tags */}
                                                            {(() => {
                                                                const kCustoms = kmListingForm.publicKitchenFacilities?.filter((f: string) => !['Kompor', 'Kulkas', 'Dispenser', 'Wastafel Cuci Piring', 'Peralatan Masak', 'Meja Makan'].includes(f)) || [];
                                                                if (kCustoms.length === 0) return null;
                                                                return (
                                                                    <div className="col-span-2 flex flex-wrap gap-1 mt-1 border-t border-orange-100 pt-2">
                                                                        {kCustoms.map((fac: string) => (
                                                                            <span key={fac} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                {fac}
                                                                                <button 
                                                                                    type="button" 
                                                                                    onClick={() => {
                                                                                        const current = kmListingForm.publicKitchenFacilities || [];
                                                                                        setKmListingForm({ ...kmListingForm, publicKitchenFacilities: current.filter((f) => f !== fac) });
                                                                                    }}
                                                                                    className="hover:text-orange-700 text-xs font-bold leading-none p-0.5"
                                                                                >
                                                                                    &times;
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Custom kitchen facility input adder */}
                                                            <div className="col-span-2 flex gap-1.5 mt-1 border-t border-orange-100 pt-2">
                                                                <input 
                                                                    type="text" 
                                                                    value={customPublicKitchenFacilityInput} 
                                                                    onChange={e => setCustomPublicKitchenFacilityInput(e.target.value)} 
                                                                    placeholder="Tambah kelengkapan dapur..." 
                                                                    className="flex-grow h-[28px] px-2 border border-[#e0c0af] rounded text-[11px] bg-white outline-none text-[#584235] font-bold"
                                                                />
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!customPublicKitchenFacilityInput.trim()) return;
                                                                        const current = kmListingForm.publicKitchenFacilities || [];
                                                                        if (!current.includes(customPublicKitchenFacilityInput.trim())) {
                                                                            setKmListingForm({ ...kmListingForm, publicKitchenFacilities: [...current, customPublicKitchenFacilityInput.trim()] });
                                                                        }
                                                                        setCustomPublicKitchenFacilityInput('');
                                                                    }}
                                                                    className="h-[28px] px-3 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center transition-colors shadow-sm"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Sub-input WC Umum */}
                                                {checkHasFacility(kmListingForm.facilities, 'WC Umum') && (
                                                    <div className="mt-2.5 pl-6 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl">
                                                        <span className="text-[10px] font-black text-[#584235] uppercase tracking-wider mb-0.5">Kelengkapan WC Umum:</span>
                                                        <div className="grid grid-cols-2 gap-2.5">
                                                            {['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].map(bfac => {
                                                                const isBChecked = kmListingForm.publicBathroomFacilities?.includes(bfac);
                                                                return (
                                                                    <label key={bfac} className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={isBChecked}
                                                                            onChange={() => {
                                                                                const current = kmListingForm.publicBathroomFacilities || [];
                                                                                const updated = current.includes(bfac)
                                                                                    ? current.filter((f: string) => f !== bfac)
                                                                                    : [...current, bfac];
                                                                                setKmListingForm({ ...kmListingForm, publicBathroomFacilities: updated });
                                                                            }}
                                                                            className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                        />
                                                                        <span className="text-xs text-[#584235] uppercase tracking-wider font-bold">{bfac}</span>
                                                                    </label>
                                                                );
                                                            })}

                                                            {/* Custom bathroom tags */}
                                                            {(() => {
                                                                const bCustoms = kmListingForm.publicBathroomFacilities?.filter((f: string) => !['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].includes(f)) || [];
                                                                if (bCustoms.length === 0) return null;
                                                                return (
                                                                    <div className="col-span-2 flex flex-wrap gap-1 mt-1 border-t border-orange-100 pt-2">
                                                                        {bCustoms.map((fac: string) => (
                                                                            <span key={fac} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                {fac}
                                                                                <button 
                                                                                    type="button" 
                                                                                    onClick={() => {
                                                                                        const current = kmListingForm.publicBathroomFacilities || [];
                                                                                        setKmListingForm({ ...kmListingForm, publicBathroomFacilities: current.filter((f) => f !== fac) });
                                                                                    }}
                                                                                    className="hover:text-orange-700 text-xs font-bold leading-none p-0.5"
                                                                                >
                                                                                    &times;
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Custom bathroom facility input adder */}
                                                            <div className="col-span-2 flex gap-1.5 mt-1 border-t border-orange-100 pt-2">
                                                                <input 
                                                                    type="text" 
                                                                    value={customPublicBathroomFacilityInput} 
                                                                    onChange={e => setCustomPublicBathroomFacilityInput(e.target.value)} 
                                                                    placeholder="Tambah kelengkapan WC..." 
                                                                    className="flex-grow h-[28px] px-2 border border-[#e0c0af] rounded text-[11px] bg-white outline-none text-[#584235] font-bold"
                                                                />
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!customPublicBathroomFacilityInput.trim()) return;
                                                                        const current = kmListingForm.publicBathroomFacilities || [];
                                                                        if (!current.includes(customPublicBathroomFacilityInput.trim())) {
                                                                            setKmListingForm({ ...kmListingForm, publicBathroomFacilities: [...current, customPublicBathroomFacilityInput.trim()] });
                                                                        }
                                                                        setCustomPublicBathroomFacilityInput('');
                                                                    }}
                                                                    className="h-[28px] px-3 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center transition-colors shadow-sm"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}`;
    linesTarget.splice(closeDivIndex + 1, 0, subInputsBlock);
    content = linesTarget.join('\n');
  } else {
    console.error("CRITICAL: Facilities grid closing </div> not found!");
  }
} else {
  console.error("CRITICAL: Facilities grid map trigger not found!");
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');
