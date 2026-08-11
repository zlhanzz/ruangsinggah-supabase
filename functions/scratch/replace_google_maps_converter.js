const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Declare state variable for Google Maps URL input
const stateTarget = `    const [newPhotoCategoryName, setNewPhotoCategoryName] = useState('');`;
const stateReplacement = `    const [newPhotoCategoryName, setNewPhotoCategoryName] = useState('');
    const [googleMapsUrlInput, setGoogleMapsUrlInput] = useState('');`;

if (content.includes(stateTarget) && !content.includes('googleMapsUrlInput')) {
  content = content.replace(stateTarget, stateReplacement);
  console.log("googleMapsUrlInput state declared.");
}

// 2. Declare helper function parseGoogleMapsUrl
const helperTarget = `    const checkHasFacility = (facilityList: string[], target: string) => {`;
const helperReplacement = `    const parseGoogleMapsUrl = (url: string) => {
        if (!url) return null;
        // Format: @-5.1326,119.4886
        const regex1 = /@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/;
        // Format: q=-5.1326,119.4886
        const regex2 = /[?&]q=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/;
        // Format: /maps/place/-5.1326,119.4886
        const regex3 = /\\/place\\/(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/;
        // Format raw: -5.1326, 119.4886
        const regexRaw = /^(-?\\d+\\.\\d+)\\s*,\\s*(-?\\d+\\.\\d+)$/;

        let match = url.match(regex1);
        if (!match) match = url.match(regex2);
        if (!match) match = url.match(regex3);
        if (!match) match = url.match(regexRaw);

        if (match && match[1] && match[2]) {
            return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
            };
        }
        return null;
    };

    const checkHasFacility = (facilityList: string[], target: string) => {`;

if (content.includes(helperTarget) && !content.includes('parseGoogleMapsUrl')) {
  content = content.replace(helperTarget, helperReplacement);
  console.log("parseGoogleMapsUrl helper added.");
}

// 3. Add Google Maps Converter layout in JSX
const jsxTarget = `                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <span className="text-[9px] font-bold text-[#584235] uppercase tracking-wider">Tentukan Lokasi Landmark di Peta:</span>
                                                        <div ref={kmLandmarkMapRef} className="w-full h-32 z-0 relative rounded-lg border border-[#e0c0af]" style={{ minHeight: '120px' }} />
                                                        <p className="text-[8px] text-gray-500 font-mono mt-1 bg-white px-2 py-0.5 rounded border border-gray-200 self-end shadow-sm">
                                                            Lat: {landmarkLocation.lat.toFixed(6)}, Lng: {landmarkLocation.lng.toFixed(6)}
                                                        </p>
                                                    </div>`;

const jsxReplacement = `                                                    <div className="flex flex-col gap-1 mt-1">
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
                                                                onClick={() => {
                                                                    const parsed = parseGoogleMapsUrl(googleMapsUrlInput);
                                                                    if (parsed) {
                                                                        setLandmarkLocation(parsed);
                                                                        alert('Berhasil mengonversi koordinat dari input!');
                                                                    } else {
                                                                        alert('Format tidak dikenali atau koordinat tidak ditemukan.');
                                                                    }
                                                                }}
                                                                className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#264191] font-bold text-xs uppercase px-3 rounded-lg border border-[#d3e4fe] transition-colors"
                                                            >
                                                                Konversi
                                                            </button>
                                                        </div>
                                                    </div>`;

if (content.includes(jsxTarget)) {
  content = content.replace(jsxTarget, jsxReplacement);
  console.log("JSX Google Maps converter block inserted successfully!");
} else {
  console.error("jsxTarget not found!");
}

// 4. Reset input after campus/landmark is added
const addTarget = `                                                            setKmListingForm({
                                                                ...kmListingForm,
                                                                campuses: [
                                                                    ...(kmListingForm.campuses || []),
                                                                    { name: newLandmarkName.trim(), lat: landmarkLocation.lat, lng: landmarkLocation.lng }
                                                                ]
                                                            });
                                                            setNewLandmarkName('');
                                                            alert('Landmark berhasil ditambahkan!');`;

const addReplacement = `                                                            setKmListingForm({
                                                                ...kmListingForm,
                                                                campuses: [
                                                                    ...(kmListingForm.campuses || []),
                                                                    { name: newLandmarkName.trim(), lat: landmarkLocation.lat, lng: landmarkLocation.lng }
                                                                ]
                                                            });
                                                            setNewLandmarkName('');
                                                            setGoogleMapsUrlInput('');
                                                            alert('Landmark berhasil ditambahkan!');`;

if (content.includes(addTarget)) {
  content = content.replace(addTarget, addReplacement);
  console.log("Add handler reset updated.");
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Done.");
