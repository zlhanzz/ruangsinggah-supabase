const fs = require('fs');
const path = require('path');

const agentDashboardPath = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(agentDashboardPath, 'utf-8');

// 1. Add Building2 to lucide-react imports if not present
if (!code.includes('Building2')) {
    code = code.replace("Signal, Wifi, BatteryCharging, CheckSquare, Layers", "Signal, Wifi, BatteryCharging, CheckSquare, Layers, Building2");
    console.log('Added Building2 to imports');
}

// 2. Add "Data Properti & Lokasi Administratif" right before "{/* Simulasi Tampilan Mobile App (Preview Listing) */}"
const targetMarker = `{/* Simulasi Tampilan Mobile App (Preview Listing) */}`;

const newSection = `{/* Data Properti & Lokasi Administratif */}
                                        <section className="bg-white border border-[#e0c0af] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                <h3 className="font-bold text-sm text-[#0b1c30]">Data Properti &amp; Lokasi Administratif</h3>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setKmStep(1)} 
                                                    className="text-xs text-[#ff7a00] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Edit className="w-3.5 h-3.5" /> Edit Wilayah
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-3 flex flex-col gap-1">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Provinsi</span>
                                                    <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                                                        {kmListingForm.province || 'Sulawesi Selatan'}
                                                    </span>
                                                </div>
                                                <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-3 flex flex-col gap-1">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Kota / Kabupaten</span>
                                                    <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                                                        {kmListingForm.city || 'Makassar'}
                                                    </span>
                                                </div>
                                                <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-3 flex flex-col gap-1">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Kecamatan / Area</span>
                                                    <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                                        <Navigation className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                                                        {kmListingForm.area || '-'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-[#ff7a00]" /> Alamat Lengkap &amp; Titik GPS
                                                    </span>
                                                    {kmListingForm.location && (
                                                        <span className="text-[10px] font-mono font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                            GPS: {typeof kmListingForm.location.lat === 'number' ? kmListingForm.location.lat.toFixed(6) : kmListingForm.location.lat}, {typeof kmListingForm.location.lng === 'number' ? kmListingForm.location.lng.toFixed(6) : kmListingForm.location.lng}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                                                    {kmListingForm.address || 'Alamat lokasi lengkap kost belum diatur'}
                                                </p>
                                            </div>
                                        </section>

                                        {/* Simulasi Tampilan Mobile App (Preview Listing) */}`;

if (code.includes(targetMarker) && !code.includes('Data Properti &amp; Lokasi Administratif')) {
    code = code.replace(targetMarker, newSection);
    console.log('Added Data Properti & Lokasi Administratif section');
}

// 3. Update mobile preview address to also show chips for kecamatan, kota/kabupaten, and provinsi
const oldMobileAddress = `{/* Address / Location Pin */}
                                                                    <div className="flex items-start text-gray-500 font-medium text-[10px] mt-1 pb-3 border-b border-gray-100">
                                                                        <MapPin className="w-3.5 h-3.5 text-[#ff7a00] shrink-0 mr-1 mt-0.5" />
                                                                        <span className="leading-normal">{kmListingForm.address || 'Alamat lokasi lengkap kost...'}</span>
                                                                    </div>`;

const newMobileAddress = `{/* Address / Location Pin & Regional Badges */}
                                                                    <div className="flex flex-col gap-1.5 pb-3 border-b border-gray-100 mt-1">
                                                                        <div className="flex items-start text-gray-500 font-medium text-[10px]">
                                                                            <MapPin className="w-3.5 h-3.5 text-[#ff7a00] shrink-0 mr-1 mt-0.5" />
                                                                            <span className="leading-normal">{kmListingForm.address || 'Alamat lokasi lengkap kost...'}</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-1 pl-4">
                                                                            {kmListingForm.area && (
                                                                                <span className="bg-orange-50 text-orange-900 px-2 py-0.5 rounded text-[8px] font-bold border border-orange-200/80">
                                                                                    Kec. {kmListingForm.area}
                                                                                </span>
                                                                            )}
                                                                            {kmListingForm.city && (
                                                                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[8px] font-bold border border-gray-200">
                                                                                    {kmListingForm.city}
                                                                                </span>
                                                                            )}
                                                                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[8px] font-bold border border-gray-200">
                                                                                {kmListingForm.province || 'Sulawesi Selatan'}
                                                                            </span>
                                                                        </div>
                                                                    </div>`;

if (code.includes(oldMobileAddress)) {
    code = code.replace(oldMobileAddress, newMobileAddress);
    console.log('Added regional badges to mobile preview address');
} else {
    console.log('Could not find oldMobileAddress verbatim, searching alternative...');
}

fs.writeFileSync(agentDashboardPath, code, 'utf-8');
