const fs = require('fs');
const path = require('path');

const agentDashboardPath = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(agentDashboardPath, 'utf-8');

// 1. Add detectProvinceFromAddress helper right before parseEvaluationData
const detectProvinceCode = `export const detectProvinceFromAddress = (addr?: string | null): string => {
    if (!addr) return 'Sulawesi Selatan';
    const lower = addr.toLowerCase();
    if (lower.includes('sulawesi selatan') || lower.includes('makassar') || lower.includes('gowa') || lower.includes('maros') || lower.includes('takalar') || lower.includes('bone') || lower.includes('palopo') || lower.includes('parepare')) return 'Sulawesi Selatan';
    if (lower.includes('sulawesi barat') || lower.includes('mamuju') || lower.includes('polewali')) return 'Sulawesi Barat';
    if (lower.includes('sulawesi tengah') || lower.includes('palu')) return 'Sulawesi Tengah';
    if (lower.includes('sulawesi tenggara') || lower.includes('kendari')) return 'Sulawesi Tenggara';
    if (lower.includes('sulawesi utara') || lower.includes('manado')) return 'Sulawesi Utara';
    if (lower.includes('gorontalo')) return 'Gorontalo';
    if (lower.includes('dki jakarta') || lower.includes('jakarta')) return 'DKI Jakarta';
    if (lower.includes('jawa barat') || lower.includes('bandung') || lower.includes('bogor') || lower.includes('depok') || lower.includes('bekasi') || lower.includes('cimahi')) return 'Jawa Barat';
    if (lower.includes('jawa timur') || lower.includes('surabaya') || lower.includes('malang') || lower.includes('sidoarjo')) return 'Jawa Timur';
    if (lower.includes('jawa tengah') || lower.includes('semarang') || lower.includes('solo') || lower.includes('surakarta')) return 'Jawa Tengah';
    if (lower.includes('di yogyakarta') || lower.includes('yogyakarta') || lower.includes('jogja') || lower.includes('sleman') || lower.includes('bantul')) return 'DI Yogyakarta';
    if (lower.includes('bali') || lower.includes('denpasar') || lower.includes('badung')) return 'Bali';
    if (lower.includes('banten') || lower.includes('tangerang') || lower.includes('serang') || lower.includes('cilegon')) return 'Banten';
    if (lower.includes('sumatera utara') || lower.includes('medan')) return 'Sumatera Utara';
    if (lower.includes('sumatera barat') || lower.includes('padang')) return 'Sumatera Barat';
    if (lower.includes('sumatera selatan') || lower.includes('palembang')) return 'Sumatera Selatan';
    if (lower.includes('riau') || lower.includes('pekanbaru')) return 'Riau';
    if (lower.includes('kepulauan riau') || lower.includes('batam')) return 'Kepulauan Riau';
    if (lower.includes('lampung') || lower.includes('bandar lampung')) return 'Lampung';
    if (lower.includes('kalimantan timur') || lower.includes('samarinda') || lower.includes('balikpapan')) return 'Kalimantan Timur';
    return 'Sulawesi Selatan';
};

`;

if (!code.includes('detectProvinceFromAddress')) {
    code = code.replace('export const parseEvaluationData =', `${detectProvinceCode}export const parseEvaluationData =`);
    console.log('Added detectProvinceFromAddress');
}

// 2. Update parseEvaluationData definition
const oldParseFn = `export const parseEvaluationData = (notesText?: string | null): EvaluationData => {
    const rawNotes = (notesText || '').trim();
    const lower = rawNotes.toLowerCase();
    
    const hasRevision = lower.includes('[revisi') || lower.includes('evaluasi admin') || lower.includes('perlu diperbaiki') || lower.includes('revisi');`;

const newParseFn = `export const parseEvaluationData = (notesText?: string | null, status?: string | null): EvaluationData => {
    const rawNotes = (notesText || '').trim();
    const lower = rawNotes.toLowerCase();
    
    const containsRevisionTag = lower.includes('[revisi') || lower.includes('evaluasi admin') || lower.includes('perlu diperbaiki') || lower.includes('revisi');
    const isSubmittedOrApproved = status === 'SUBMITTED' || status === 'APPROVED' || status === 'COMPLETED' || status === 'PENDING_ONBOARDING';
    const hasRevision = Boolean(containsRevisionTag && !isSubmittedOrApproved);`;

if (code.includes(oldParseFn)) {
    code = code.replace(oldParseFn, newParseFn);
    console.log('Updated parseEvaluationData definition');
}

// 3. Update reverseGeocodeAndApply to use detectProvinceFromAddress
const oldRevGeo = `                        setKmListingForm((prev: any) => {
                            const updates: any = { address: addr || prev.address || fallbackAddr };
                            if (city) updates.city = city.replace(/^(Kota|Kabupaten|Kab\\.)\\s+/i, '').trim();
                            if (area) updates.area = area.replace(/^(Kecamatan|Kec\\.)\\s+/i, '').trim();
                            if (province) updates.province = province.replace(/^(Provinsi|Prov\\.)\\s+/i, '').trim();
                            return { ...prev, ...updates };
                        });`;

const newRevGeo = `                        const detectedProv = province ? province.replace(/^(Provinsi|Prov\\.)\\s+/i, '').trim() : detectProvinceFromAddress(addr || fallbackAddr || '');
                        setKmListingForm((prev: any) => {
                            const updates: any = { address: addr || prev.address || fallbackAddr };
                            if (city) updates.city = city.replace(/^(Kota|Kabupaten|Kab\\.)\\s+/i, '').trim();
                            if (area) updates.area = area.replace(/^(Kecamatan|Kec\\.)\\s+/i, '').trim();
                            updates.province = detectedProv || prev.province || detectProvinceFromAddress(prev.address || '');
                            return { ...prev, ...updates };
                        });`;

if (code.includes(oldRevGeo)) {
    code = code.replace(oldRevGeo, newRevGeo);
    console.log('Updated reverseGeocodeAndApply with detectProvinceFromAddress');
}

// 4. Update openKostManagerListing draft loading & DB loading
const oldDraftMerge = `                    const mergedForm = {
                        ...parsed.kmListingForm,
                        image_urls: draftImageUrls,
                        photoCategories: draftPhotoCats,
                        campuses: draftCampuses,
                        title: parsed.kmListingForm.title || req.kost_name,
                        address: parsed.kmListingForm.address || req.kost_address,
                        owner_uid: resolvedInitialOwnerUid
                    };`;

const newDraftMerge = `                    const mergedForm = {
                        ...parsed.kmListingForm,
                        image_urls: draftImageUrls,
                        photoCategories: draftPhotoCats,
                        campuses: draftCampuses,
                        title: parsed.kmListingForm.title || req.kost_name,
                        address: parsed.kmListingForm.address || req.kost_address,
                        province: parsed.kmListingForm.province || detectProvinceFromAddress(parsed.kmListingForm.address || req.kost_address),
                        owner_uid: resolvedInitialOwnerUid
                    };`;

if (code.includes(oldDraftMerge)) {
    code = code.replace(oldDraftMerge, newDraftMerge);
    console.log('Updated draft merge with province detection');
}

const oldKmDbLoad = `                let rawKmCity = dbKmProp.city || 'Makassar';
                let rawKmArea = dbKmProp.area || '';
                let rawKmProvince = dbKmProp.province || dbKmProp.metadata?.province || '';`;

const newKmDbLoad = `                let rawKmCity = dbKmProp.city || 'Makassar';
                let rawKmArea = dbKmProp.area || '';
                let rawKmProvince = dbKmProp.province || dbKmProp.metadata?.province || detectProvinceFromAddress(dbKmProp.address || req.kost_address);`;

if (code.includes(oldKmDbLoad)) {
    code = code.replace(oldKmDbLoad, newKmDbLoad);
    console.log('Updated rawKmProvince fallback');
}

const oldPropDbLoad = `                let rawPropCity = dbPropertyRecord.city || 'Makassar';
                let rawPropArea = dbPropertyRecord.area || '';
                let rawPropProvince = dbPropertyRecord.province || dbPropertyRecord.metadata?.province || '';`;

const newPropDbLoad = `                let rawPropCity = dbPropertyRecord.city || 'Makassar';
                let rawPropArea = dbPropertyRecord.area || '';
                let rawPropProvince = dbPropertyRecord.province || dbPropertyRecord.metadata?.province || detectProvinceFromAddress(dbPropertyRecord.address || req.kost_address);`;

if (code.includes(oldPropDbLoad)) {
    code = code.replace(oldPropDbLoad, newPropDbLoad);
    console.log('Updated rawPropProvince fallback');
}

const oldCleanSlate = `            address: req.kost_address,
            city: 'Makassar',
            area: '',`;

const newCleanSlate = `            address: req.kost_address,
            province: detectProvinceFromAddress(req.kost_address),
            city: 'Makassar',
            area: '',`;

if (code.includes(oldCleanSlate)) {
    code = code.replace(oldCleanSlate, newCleanSlate);
    console.log('Updated clean slate province');
}

// 5. Update parseEvaluationData call sites
code = code.replace(`const roomEval = parseEvaluationData(isEditingKostManager?.notes);`, `const roomEval = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);`);
code = code.replace(`const evalData = parseEvaluationData(req.notes);`, `const evalData = parseEvaluationData(req.notes, req.status);`);
code = code.replace(`const currentEvalData = parseEvaluationData(isEditingKostManager?.notes);`, `const currentEvalData = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);`);
code = code.replace(`const currentEvalData = parseEvaluationData(isEditingKostManager?.notes);`, `const currentEvalData = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);`);
code = code.replace(`const currentEvalData = parseEvaluationData(isEditingKostManager?.notes);`, `const currentEvalData = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);`);
code = code.replace(`const currentEvalData = parseEvaluationData(isEditingKostManager?.notes);`, `const currentEvalData = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);`);
code = code.replace(`const currentEvalData = parseEvaluationData(isEditingKostManager?.notes);`, `const currentEvalData = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);`);

// 6. Update step 1 banner when submitted
const oldEvalBanner = `                                {/* Modern Glowing Evaluation Notice Banner with Structured Chips & Quick-Jump */}
                                {(() => {
                                    const currentEvalData = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);
                                    if (!currentEvalData.hasRevision) return null;`;

const newEvalBanner = `                                {/* Modern Glowing Evaluation Notice Banner with Structured Chips & Quick-Jump */}
                                {(() => {
                                    const currentEvalData = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);
                                    if (isEditingKostManager?.status === 'SUBMITTED' || isEditingKostManager?.status === 'PENDING_ONBOARDING') {
                                        return (
                                            <div className="relative overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-50 to-teal-500/[0.05] p-4 shadow-sm flex flex-col gap-2.5 backdrop-blur-sm animate-fadeIn">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                                                            <CheckCircle2 size={18} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                                                                Data Revisi Telah Dikirim ke Admin
                                                            </h3>
                                                            <p className="text-[10px] font-bold text-emerald-700">
                                                                Status: SUBMITTED • Menunggu Verifikasi & Persetujuan Admin
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300 text-[9px] font-black uppercase tracking-wider">
                                                        Terkirim
                                                    </span>
                                                </div>
                                                {currentEvalData.items.length > 0 && (
                                                    <div className="text-[10px] font-semibold text-emerald-800 bg-white/70 p-2.5 rounded-xl border border-emerald-200/60">
                                                        <p className="font-bold text-emerald-900 mb-1">Riwayat Catatan yang Telah Diperbarui:</p>
                                                        <ul className="list-disc list-inside space-y-0.5 text-emerald-700">
                                                            {currentEvalData.items.map((it, idx) => (
                                                                <li key={idx}>{it}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    if (!currentEvalData.hasRevision) return null;`;

if (code.includes(oldEvalBanner)) {
    code = code.replace(oldEvalBanner, newEvalBanner);
    console.log('Updated evaluation notice banner with submitted confirmation state');
}

fs.writeFileSync(agentDashboardPath, code, 'utf-8');
console.log('AgentDashboard.tsx successfully updated!');
