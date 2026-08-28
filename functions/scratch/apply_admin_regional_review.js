const fs = require('fs');
const path = require('path');

const kmPath = path.join(__dirname, '../public/components/admin/KostManagerManagement.tsx');
let code = fs.readFileSync(kmPath, 'utf-8');

// 1. Add detectProvinceFromAddress if not present
if (!code.includes('detectProvinceFromAddress')) {
    const helperCode = `const detectProvinceFromAddress = (addr: string): string => {
    if (!addr) return 'Sulawesi Selatan';
    const clean = addr.toLowerCase();
    if (clean.includes('sulawesi selatan') || clean.includes('sulsel') || clean.includes('makassar') || clean.includes('gowa') || clean.includes('maros')) return 'Sulawesi Selatan';
    if (clean.includes('sulawesi barat') || clean.includes('sulbar') || clean.includes('mamuju') || clean.includes('polewali')) return 'Sulawesi Barat';
    if (clean.includes('sulawesi tengah') || clean.includes('sulteng') || clean.includes('palu')) return 'Sulawesi Tengah';
    if (clean.includes('sulawesi utara') || clean.includes('sulut') || clean.includes('manado')) return 'Sulawesi Utara';
    if (clean.includes('sulawesi tenggara') || clean.includes('sultra') || clean.includes('kendari')) return 'Sulawesi Tenggara';
    if (clean.includes('gorontalo')) return 'Gorontalo';
    if (clean.includes('dki jakarta') || clean.includes('jakarta')) return 'DKI Jakarta';
    if (clean.includes('jawa barat') || clean.includes('bandung') || clean.includes('bogor') || clean.includes('depok') || clean.includes('bekasi')) return 'Jawa Barat';
    if (clean.includes('jawa tengah') || clean.includes('semarang') || clean.includes('solo') || clean.includes('surakarta')) return 'Jawa Tengah';
    if (clean.includes('di yogyakarta') || clean.includes('yogyakarta') || clean.includes('jogja') || clean.includes('sleman') || clean.includes('bantul')) return 'DI Yogyakarta';
    if (clean.includes('jawa timur') || clean.includes('surabaya') || clean.includes('malang')) return 'Jawa Timur';
    if (clean.includes('bali') || clean.includes('denpasar')) return 'Bali';
    return 'Sulawesi Selatan';
};

`;
    code = helperCode + code;
    console.log('Added detectProvinceFromAddress helper');
}

// 2. Replace the 3 boxes under Alamat & Titik Koordinat in Comprehensive Review Modal
const oldBoxes = `<div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 text-xs">
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Kota / Wilayah</span>
                                                                <span className="font-bold text-slate-800">{reviewProperty?.city || reviewProperty?.area || 'Makassar'}</span>
                                                            </div>
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Latitude</span>
                                                                <span className="font-mono font-bold text-slate-800">{reviewProperty?.location?.lat || reviewProperty?.latitude || '-'}</span>
                                                            </div>
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Longitude</span>
                                                                <span className="font-mono font-bold text-slate-800">{reviewProperty?.location?.lng || reviewProperty?.longitude || '-'}</span>
                                                            </div>
                                                        </div>`;

const newBoxes = `<div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 text-xs">
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Provinsi</span>
                                                                <span className="font-bold text-slate-800">{reviewProperty?.province || reviewProperty?.metadata?.province || detectProvinceFromAddress(reviewProperty?.address || reviewRequest.kost_address) || 'Sulawesi Selatan'}</span>
                                                            </div>
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Kabupaten / Kota</span>
                                                                <span className="font-bold text-slate-800">{reviewProperty?.city || reviewProperty?.metadata?.city || 'Makassar'}</span>
                                                            </div>
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Kecamatan / Area</span>
                                                                <span className="font-bold text-slate-800">{reviewProperty?.area || reviewProperty?.metadata?.area || '-'}</span>
                                                            </div>
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Latitude</span>
                                                                <span className="font-mono font-bold text-slate-800">{reviewProperty?.location?.lat || reviewProperty?.latitude || '-'}</span>
                                                            </div>
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Longitude</span>
                                                                <span className="font-mono font-bold text-slate-800">{reviewProperty?.location?.lng || reviewProperty?.longitude || '-'}</span>
                                                            </div>
                                                        </div>`;

if (code.includes(oldBoxes)) {
    code = code.replace(oldBoxes, newBoxes);
    console.log('Replaced Alamat & Titik Koordinat boxes in Comprehensive Review Modal');
} else {
    console.log('Could not find oldBoxes verbatim');
}

// 3. Update Audit card GPS
const oldAuditGps = `<p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                            Lat: {reviewProperty?.location?.lat || reviewProperty?.latitude || '-'} | Lng: {reviewProperty?.location?.lng || reviewProperty?.longitude || '-'}
                                                        </p>`;

const newAuditGps = `<div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                            <span className="bg-white text-slate-700 px-2 py-0.5 rounded text-[8.5px] font-bold border border-slate-200">
                                                                🏛️ {reviewProperty?.province || reviewProperty?.metadata?.province || detectProvinceFromAddress(reviewProperty?.address || reviewRequest?.address) || 'Sulawesi Selatan'}
                                                            </span>
                                                            <span className="bg-white text-slate-700 px-2 py-0.5 rounded text-[8.5px] font-bold border border-slate-200">
                                                                🏙️ {reviewProperty?.city || reviewProperty?.metadata?.city || 'Makassar'}
                                                            </span>
                                                            <span className="bg-white text-slate-700 px-2 py-0.5 rounded text-[8.5px] font-bold border border-slate-200">
                                                                📍 Kec. {reviewProperty?.area || reviewProperty?.metadata?.area || '-'}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-mono font-bold">
                                                                Lat: {reviewProperty?.location?.lat || reviewProperty?.latitude || '-'} | Lng: {reviewProperty?.location?.lng || reviewProperty?.longitude || '-'}
                                                            </span>
                                                        </div>`;

if (code.includes(oldAuditGps)) {
    code = code.replace(oldAuditGps, newAuditGps);
    console.log('Updated Audit GPS card');
} else {
    console.log('Could not find oldAuditGps verbatim');
}

fs.writeFileSync(kmPath, code, 'utf-8');
