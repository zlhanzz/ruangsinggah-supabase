const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Declare state variables and canvas reference
const stateSearch = "const [kmStep, setKmStep] = useState<number>(1);";
const stateReplacement = `const [kmStep, setKmStep] = useState<number>(1);
    const [mitraProfile, setMitraProfile] = useState<any>(null);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
    const [expandedRoomIdx, setExpandedRoomIdx] = useState<number | null>(null);
    const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0b1c30';
        
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = ((clientX - rect.left) / rect.width) * canvas.width;
        const y = ((clientY - rect.top) / rect.height) * canvas.height;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = ((clientX - rect.left) / rect.width) * canvas.width;
        const y = ((clientY - rect.top) / rect.height) * canvas.height;
        
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            setSignatureData(canvas.toDataURL());
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setSignatureData(null);
            }
        }
    };`;

content = content.replace(stateSearch, stateReplacement);

// 2. Fetch owner profile in openKostManagerListing
const openSearch = `const openKostManagerListing = async (req: SurveyRequest) => {
        setIsEditingKostManager(req);`;
const openReplacement = `const openKostManagerListing = async (req: SurveyRequest) => {
        setIsEditingKostManager(req);
        setAgreedToTerms(false);
        setSignatureData(null);
        setExpandedRoomIdx(null);
        setActivePhotoIdx(0);
        
        // Fetch owner user profile
        try {
            const { data: userData } = await supabase.from('users').select('*').eq('id', req.user_id).maybeSingle();
            if (userData) {
                setMitraProfile(userData);
            } else {
                setMitraProfile({
                    full_name: req.agent_name || 'Budi Santoso',
                    phone: req.owner_phone || '+62 812-3456-7890',
                    email: 'budi.santoso@email.com'
                });
            }
        } catch (e) {
            console.error("Error fetching user profile:", e);
            setMitraProfile({
                full_name: 'Budi Santoso',
                phone: req.owner_phone || '+62 812-3456-7890',
                email: 'budi.santoso@email.com'
            });
        }`;

content = content.replace(openSearch, openReplacement);

// 3. Clear states on closeKostManagerListing
const closeSearch = `const closeKostManagerListing = () => {
        setIsEditingKostManager(null);`;
const closeReplacement = `const closeKostManagerListing = () => {
        setIsEditingKostManager(null);
        setMitraProfile(null);
        setSignatureData(null);
        setAgreedToTerms(false);
        setExpandedRoomIdx(null);
        setActivePhotoIdx(0);`;

content = content.replace(closeSearch, closeReplacement);

// 4. Save signature in listing metadata
const saveSearch = `metadata: {
                    publicBathroomFacilities: kmListingForm.publicBathroomFacilities || []
                }`;
const saveReplacement = `metadata: {
                    publicBathroomFacilities: kmListingForm.publicBathroomFacilities || [],
                    digitalSignature: signatureData
                }`;

content = content.replace(saveSearch, saveReplacement);

// 5. Replace step 3 UI
const lines = content.split('\n');
let step3StartIdx = lines.findIndex(l => l.includes('kmStep === 3 && ('));

if (step3StartIdx !== -1) {
  // Find matching closing parenthesis for this step 3 block
  let openBrackets = 0;
  let endIdx = -1;
  for (let i = step3StartIdx; i < lines.length; i++) {
    const line = lines[i];
    openBrackets += (line.match(/\(/g) || []).length;
    openBrackets -= (line.match(/\)/g) || []).length;
    if (openBrackets <= 0) {
      endIdx = i;
      break;
    }
  }

  if (endIdx !== -1) {
    console.log(`Found step 3 render block from lines ${step3StartIdx + 1} to ${endIdx + 1}`);
    
    const step3UI = `                                {kmStep === 3 && (
                                    <div className="space-y-6">
                                        {/* Data Pemilik / Mitra */}
                                        <section className="bg-white border border-[#e0c0af] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                                            <h3 className="font-bold text-sm text-[#0b1c30] border-b border-gray-100 pb-2">Data Pemilik / Mitra</h3>
                                            
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff7a00] shrink-0">
                                                        <span className="material-symbols-outlined text-lg">person</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-800">\${mitraProfile?.full_name || isEditingKostManager?.agent_name || 'Budi Santoso'}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pemilik / Mitra</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                                    <span className="material-symbols-outlined text-gray-400 text-sm">call</span>
                                                    <span className="font-semibold">\${mitraProfile?.phone || isEditingKostManager?.owner_phone || '+62 812-3456-7890'}</span>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                                    <span className="material-symbols-outlined text-gray-400 text-sm">mail</span>
                                                    <span className="font-semibold">\${mitraProfile?.email || 'budi.santoso@email.com'}</span>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Ringkasan Properti & Carousel */}
                                        <section className="bg-white border border-[#e0c0af] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                                            {/* Photo Carousel */}
                                            {kmListingForm.image_urls && kmListingForm.image_urls.length > 0 ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 border border-gray-150">
                                                        <img 
                                                            src={getImageUrlString(kmListingForm.image_urls[activePhotoIdx])} 
                                                            alt="Property" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-[10px] font-bold tracking-wider uppercase">
                                                            \${activePhotoIdx + 1}/\${kmListingForm.image_urls.length} FOTO
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Thumbnails strip */}
                                                    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                                        {kmListingForm.image_urls.map((img: any, idx: number) => (
                                                            <button 
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => setActivePhotoIdx(idx)}
                                                                className={\`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all \\\${activePhotoIdx === idx ? 'border-[#ff7a00] scale-95 shadow-sm' : 'border-transparent opacity-60'}\`}
                                                            >
                                                                <img src={getImageUrlString(img)} className="w-full h-full object-cover" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="aspect-[16/10] rounded-xl bg-gray-50 border border-dashed border-[#e0c0af] flex flex-col items-center justify-center text-gray-400 gap-1.5">
                                                    <span className="material-symbols-outlined text-2xl">image</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Belum ada foto properti</span>
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-1.5 mt-1">
                                                <h3 className="font-extrabold text-sm text-[#ff7a00]">\${kmListingForm.title || '-'}</h3>
                                                <div className="flex items-start gap-1.5 text-xs text-gray-600">
                                                    <span className="material-symbols-outlined text-gray-400 text-sm mt-0.5 shrink-0">map_pin</span>
                                                    <span className="leading-relaxed font-semibold">\${kmListingForm.address || '-'}</span>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-1.5 mt-2 pt-3 border-t border-gray-100">
                                                    {kmListingForm.facilities?.map((f: string) => (
                                                        <span key={f} className="bg-orange-50/50 text-[#ff7a00] px-2.5 py-1 rounded-md font-extrabold uppercase text-[9px] tracking-wide border border-orange-100/50">\${f}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </section>

                                        {/* Data Kamar */}
                                        <section className="bg-white border border-[#e0c0af] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                                            <h3 className="font-bold text-sm text-[#0b1c30] border-b border-gray-100 pb-2">Data Kamar</h3>
                                            
                                            {/* Summary Stats Cards */}
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 flex flex-col">
                                                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Total</span>
                                                    <span className="text-sm font-extrabold text-blue-900 mt-0.5">
                                                        \${kmListingForm.roomTypes?.reduce((acc, curr) => acc + (parseInt(curr.availableRoomCount) || 0), 0) || 0}
                                                    </span>
                                                </div>
                                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 flex flex-col">
                                                    <span className="text-[9px] font-bold text-[#ff7a00] uppercase tracking-wider">Terisi</span>
                                                    <span className="text-sm font-extrabold text-orange-950 mt-0.5">
                                                        \${kmListingForm.roomTypes?.reduce((acc, curr) => acc + (curr.status === 'Terisi' ? (parseInt(curr.availableRoomCount) || 0) : 0), 0) || 0}
                                                    </span>
                                                </div>
                                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex flex-col">
                                                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Kosong</span>
                                                    <span className="text-sm font-extrabold text-emerald-900 mt-0.5">
                                                        \${kmListingForm.roomTypes?.reduce((acc, curr) => acc + (curr.status !== 'Terisi' ? (parseInt(curr.availableRoomCount) || 0) : 0), 0) || 0}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 mt-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Daftar Kamar</span>
                                                <div className="space-y-2">
                                                    {kmListingForm.roomTypes?.map((rt: any, idx: number) => {
                                                        const isExpanded = expandedRoomIdx === idx;
                                                        const isTerisi = rt.status === 'Terisi';
                                                        return (
                                                            <div key={idx} className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-sm">
                                                                {/* Accordion Trigger */}
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setExpandedRoomIdx(isExpanded ? null : idx)}
                                                                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        <span className="text-xs font-bold text-gray-800">\${rt.name || \`Kamar \\\${idx + 1}\`}</span>
                                                                        <span className={\`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider \\\${isTerisi ? 'bg-orange-100 text-[#ff7a00]' : 'bg-blue-100 text-blue-700'}\`}>
                                                                            \${isTerisi ? 'Terisi' : 'Kosong'}
                                                                        </span>
                                                                    </div>
                                                                    <span className="material-symbols-outlined text-gray-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                                                                        keyboard_arrow_down
                                                                    </span>
                                                                </button>
                                                                
                                                                {/* Accordion Content */}
                                                                {isExpanded && (
                                                                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/30 flex flex-col gap-3 text-xs text-gray-700">
                                                                        \${isTerisi ? (
                                                                            <div className="grid grid-cols-2 gap-3.5">
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Nama Penghuni</span>
                                                                                    <span className="font-bold text-gray-800">\${rt.residentName || '-'}</span>
                                                                                </div>
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Nomor WA</span>
                                                                                    <span className="font-bold text-gray-800">\${rt.residentPhone || '-'}</span>
                                                                                </div>
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tipe Sewa</span>
                                                                                    <span className="font-bold text-gray-850 uppercase text-[10px]">\${rt.paymentPeriod || 'Bulanan'}</span>
                                                                                </div>
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Harga Sewa</span>
                                                                                    <span className="font-extrabold text-[#ff7a00]">Rp \${formatThousand(rt.price || 0)}</span>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="grid grid-cols-2 gap-3.5">
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Harga Kamar</span>
                                                                                    <span className="font-extrabold text-[#ff7a00]">Rp \${formatThousand(rt.price || 0)}</span>
                                                                                </div>
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Kapasitas</span>
                                                                                    <span className="font-bold text-gray-850">\${rt.maxOccupants || 1} Orang</span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </section>

                                        {/* Syarat & Ketentuan */}
                                        <section className="bg-white border border-[#e0c0af] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                                            <h3 className="font-bold text-sm text-[#0b1c30] border-b border-gray-100 pb-2">Syarat & Ketentuan</h3>
                                            
                                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 max-h-[140px] overflow-y-auto text-[10px] text-gray-650 leading-relaxed font-semibold">
                                                <p className="font-black text-gray-800 mb-1 text-[11px]">Syarat & Ketentuan Penggunaan KostManager</p>
                                                <p className="mb-2">Dengan mendaftarkan properti Anda di KostManager, Anda menyetujui persyaratan berikut:</p>
                                                <p className="mb-1">1. <b>Mekanisme Listing:</b> Properti yang didaftarkan akan diverifikasi oleh tim internal sebelum status dinyatakan aktif secara penuh.</p>
                                                <p className="mb-1">2. <b>Akurasi Data:</b> Mitra bertanggung jawab sepenuhnya atas kebenaran seluruh informasi properti, fasilitas, dan kamar yang didata oleh agen survey.</p>
                                                <p className="mb-1">3. <b>Persetujuan Layanan:</b> Mitra sepakat untuk tunduk pada regulasi manajemen penagihan sewa dan pengelolaan penghuni sesuai sistem KostManager.</p>
                                            </div>
                                            
                                            <label className="flex items-start gap-2.5 cursor-pointer mt-1">
                                                <input 
                                                    type="checkbox"
                                                    checked={agreedToTerms}
                                                    onChange={e => setAgreedToTerms(e.target.checked)}
                                                    className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5 mt-0.5 shrink-0"
                                                />
                                                <span className="text-[10px] text-gray-600 font-bold leading-relaxed">
                                                    Saya menyetujui syarat dan ketentuan yang berlaku di atas serta menyatakan bahwa data yang diisi adalah benar.
                                                </span>
                                            </label>
                                        </section>

                                        {/* Tanda Tangan Digital Pemilik */}
                                        <section className="bg-white border border-[#e0c0af] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                <h3 className="font-bold text-sm text-[#0b1c30]">Tanda Tangan Digital Pemilik</h3>
                                                <button 
                                                    type="button" 
                                                    onClick={clearSignature}
                                                    className="text-xs text-red-500 font-bold hover:underline"
                                                >
                                                    Reset
                                                </button>
                                            </div>
                                            
                                            <div className="relative border-2 border-dashed border-[#e0c0af] rounded-xl bg-gray-50/50 aspect-[5/2] w-full overflow-hidden flex flex-col items-center justify-center">
                                                <canvas 
                                                    ref={canvasRef}
                                                    width={500}
                                                    height={200}
                                                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                                                    onMouseDown={startDrawing}
                                                    onMouseMove={draw}
                                                    onMouseUp={stopDrawing}
                                                    onMouseLeave={stopDrawing}
                                                    onTouchStart={startDrawing}
                                                    onTouchMove={draw}
                                                    onTouchEnd={stopDrawing}
                                                />
                                                {!signatureData && (
                                                    <div className="pointer-events-none flex flex-col items-center gap-1.5 text-gray-400">
                                                        <span className="material-symbols-outlined text-2xl">draw</span>
                                                        <span className="text-[9px] font-bold uppercase tracking-wider">Tanda tangan di area ini</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-505 text-center leading-relaxed font-semibold">
                                                Sebagai persetujuan akhir penambahan properti Kos pada layanan KostManager.
                                            </p>
                                        </section>
                                    </div>
                                )}`;
    lines.splice(step3StartIdx, (endIdx - step3StartIdx) + 1, step3UI);
  }
}

// 6. Update bottom submit buttons for review step
let finalContent = lines.join('\n');
const lines5 = finalContent.split('\n');

const buttonsSearch = `                                {kmStep === 3 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setKmStep(2)}
                                            className="flex-1 h-[48px] border border-gray-300 text-gray-600 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors"
                                        >
                                            Kembali ke Step 2
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveKostManagerListing}
                                            disabled={isSubmitting}
                                            className="flex-[2] h-[48px] bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center"
                                        >
                                            {isSubmitting ? 'Mengirim...' : 'Simpan & Kirim Listing'}
                                        </button>
                                    </>
                                )}`;

const buttonsReplacement = `                                {kmStep === 3 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setKmStep(2)}
                                            className="flex-1 h-[48px] border border-[#ff7a00] text-[#ff7a00] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-orange-50/50 transition-colors active:scale-95"
                                        >
                                            Kembali ke Step 2
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveKostManagerListing}
                                            disabled={isSubmitting || !agreedToTerms || !signatureData}
                                            className={\`flex-[2] h-[48px] rounded-full font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 \\\${(agreedToTerms && signatureData) ? 'bg-[#ff7a00] hover:bg-orange-600 text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}\`}
                                        >
                                            <span className="material-symbols-outlined text-sm">cloud_upload</span>
                                            {isSubmitting ? 'Mengirim...' : 'Selesaikan & Submit'}
                                        </button>
                                    </>
                                )}`;

let finalResult = finalContent.replace(buttonsSearch, buttonsReplacement);

// Convert back to CRLF
finalResult = finalResult.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, finalResult, 'utf8');

console.log("Done rewriting review step interface.");
