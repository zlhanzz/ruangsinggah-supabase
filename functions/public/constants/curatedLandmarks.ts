/**
 * Curated Landmarks & Anchors Database (National Scope - Indonesia)
 * Master data terkurasi untuk titik-titik magnet mobilitas masyarakat dan pencari kost
 * Mencakup seluruh episentrum hunian mahasiswa, pekerja industri, medis, dan perkantoran se-Indonesia (350+ Titik Anchor Utama).
 */

export type LandmarkCategory = 
    | 'campus'       // 🎓 Kampus & Perguruan Tinggi Resmi
    | 'mall'         // 🛍️ Mall Besar & Pusat Ritel Modern
    | 'office'       // 🏢 Kawasan Perkantoran & Bisnis (CBD)
    | 'industrial'   // 🏭 Kawasan Industri & Pergudangan
    | 'hospital'     // 🏥 Rumah Sakit Rujukan & RS Besar
    | 'tourism'      // 🏖️ Destinasi Wisata & Ikon Kota
    | 'transport';   // 🚆✈️ Bandara, Stasiun Kereta, Terminal, Pelabuhan

export interface CuratedLandmark {
    id: string;
    name: string;
    category: LandmarkCategory;
    city: string;
    province: string;
    lat: number;
    lng: number;
    aliases?: string[];
}

export interface CuratedLandmarkResult {
    name: string;
    lat: number;
    lng: number;
    distance: string;
    kmVal: number;
    category: LandmarkCategory;
    transportMode: 'walk' | 'motorcycle' | 'car';
    isCuratedMaster: boolean;
}

export const CURATED_LANDMARKS: CuratedLandmark[] = [
    // ══════════════════════════════════════════════════════════════════════════════
    // 1. MAKASSAR, GOWA, MAROS, & PAREPARE (SULAWESI SELATAN)
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus
    { id: 'mks-unhas-tamalanrea', name: 'Universitas Hasanuddin (UNHAS) - Tamalanrea', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.134187, lng: 119.488079, aliases: ['unhas', 'pintu 1 unhas', 'rektorat unhas'] },
    { id: 'mks-unhas-gowa', name: 'Universitas Hasanuddin (UNHAS) - Kampus Teknik Gowa', category: 'campus', city: 'Gowa', province: 'Sulawesi Selatan', lat: -5.230260, lng: 119.502134, aliases: ['unhas gowa', 'fakultas teknik unhas'] },
    { id: 'mks-uim', name: 'Universitas Islam Makassar (UIM)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.140859, lng: 119.480621, aliases: ['uim', 'universitas islam makassar'] },
    { id: 'mks-pnup', name: 'Politeknik Negeri Ujung Pandang (PNUP)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.129739, lng: 119.481846, aliases: ['pnup', 'poltek unhas', 'politeknik negeri ujung pandang'] },
    { id: 'mks-umi', name: 'Universitas Muslim Indonesia (UMI)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.136255, lng: 119.447830, aliases: ['umi', 'umi urip', 'universitas muslim indonesia'] },
    { id: 'mks-unm-gunungsari', name: 'Universitas Negeri Makassar (UNM) - Gunungsari', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.168463, lng: 119.434955, aliases: ['unm', 'unm phinisi', 'menara phinisi unm'] },
    { id: 'mks-unm-parangtambung', name: 'Universitas Negeri Makassar (UNM) - Parangtambung', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.185413, lng: 119.429111, aliases: ['unm parangtambung', 'mipa unm'] },
    { id: 'mks-unm-banta-bantaeng', name: 'Universitas Negeri Makassar (UNM) - Banta-Bantaeng', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.158509, lng: 119.429616, aliases: ['fik unm'] },
    { id: 'mks-uin-samata', name: 'UIN Alauddin Makassar - Kampus 2 Samata', category: 'campus', city: 'Gowa', province: 'Sulawesi Selatan', lat: -5.202604, lng: 119.495973, aliases: ['uin samata', 'uin alauddin'] },
    { id: 'mks-uin-alauddin', name: 'UIN Alauddin Makassar - Kampus 1 Sultan Alauddin', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.176519, lng: 119.433902, aliases: ['uin kampus 1'] },
    { id: 'mks-unismuh', name: 'Universitas Muhammadiyah Makassar (UNISMUH)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.182766, lng: 119.441093, aliases: ['unismuh', 'unismuh tala salapang'] },
    { id: 'mks-poltekkes', name: 'Poltekkes Kemenkes Makassar (Banta-Bantaeng)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.177534, lng: 119.445956, aliases: ['poltekkes makassar'] },
    { id: 'mks-poltek-ati', name: 'Politeknik ATI Makassar', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.119467, lng: 119.431446, aliases: ['ati makassar', 'poltek ati'] },
    { id: 'mks-polimarim', name: 'Politeknik Maritim AMI Makassar (POLIMARIM)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.169630, lng: 119.405468, aliases: ['polimarim', 'ami makassar'] },
    { id: 'mks-atmajaya', name: 'Universitas Atma Jaya Makassar', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.170373, lng: 119.403496, aliases: ['atma jaya makassar'] },
    { id: 'mks-bosowa', name: 'Universitas Bosowa (UNIBOS)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.138736, lng: 119.443551, aliases: ['unibos', 'universitas 45'] },
    { id: 'mks-unifa', name: 'Universitas Fajar (UNIFA)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.149272, lng: 119.450086, aliases: ['unifa'] },
    { id: 'mks-stie-nobel', name: 'Institut Bisnis dan Keuangan Nobel Indonesia', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.178753, lng: 119.439044, aliases: ['stie nobel'] },
    { id: 'mks-stimik-handayani', name: 'Universitas Handayani Makassar', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.151877, lng: 119.449133, aliases: ['stimik handayani'] },
    { id: 'mks-stikes-megarezky', name: 'Universitas Mega Rezky Makassar', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.161742, lng: 119.477110, aliases: ['unimerz', 'stikes mega rezky'] },
    { id: 'mks-ciputra', name: 'Universitas Ciputra Makassar (CPI)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.149144, lng: 119.395197, aliases: ['uc makassar', 'ciputra cpi'] },
    { id: 'mks-poltekpar', name: 'Politeknik Pariwisata Makassar (Poltekpar)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.188734, lng: 119.394910, aliases: ['poltekpar makassar', 'akpar'] },
    { id: 'pre-ith-parepare', name: 'Institut Teknologi Bacharuddin Jusuf Habibie (ITH Parepare)', category: 'campus', city: 'Parepare', province: 'Sulawesi Selatan', lat: -4.028765, lng: 119.633334, aliases: ['ith parepare'] },
    // Mall & Ritel
    { id: 'mks-mall-panakkukang', name: 'Mall Panakkukang (MP)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.157727, lng: 119.447676, aliases: ['mp', 'panakkukang mall'] },
    { id: 'mks-nipah-park', name: 'Nipah Park Makassar', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.139114, lng: 119.449891, aliases: ['nipah mall', 'mall nipah'] },
    { id: 'mks-trans-studio', name: 'Trans Studio Mall Makassar (TSM)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.159236, lng: 119.394272, aliases: ['tsm makassar', 'trans studio'] },
    { id: 'mks-pipo', name: 'Phinisi Point Mall (PiPo)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.152936, lng: 119.403639, aliases: ['pipo mall', 'mall pipo'] },
    { id: 'mks-mtos', name: 'Makassar Town Square (MToS)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.144912, lng: 119.475336, aliases: ['mtos'] },
    { id: 'mks-mall-ratu-indah', name: 'Mall Ratu Indah (MaRI)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.153316, lng: 119.417591, aliases: ['mari', 'ratu indah'] },
    { id: 'mks-living-plaza-pettarani', name: 'Living Plaza Pettarani', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.163312, lng: 119.435829, aliases: ['living plaza', 'ace pettarani'] },
    // Kawasan Industri & Bisnis
    { id: 'mks-kima', name: 'Kawasan Industri Makassar (KIMA Daya)', category: 'industrial', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.108046, lng: 119.500051, aliases: ['pt kima', 'kima makassar'] },
    { id: 'mks-pergudangan-parangloe', name: 'Kawasan Pergudangan Parangloe Indah', category: 'industrial', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.097798, lng: 119.485578, aliases: ['parangloe', 'pergudangan parangloe'] },
    { id: 'mks-cbd-panakkukang', name: 'Kawasan Bisnis Boulevard & Pengayoman', category: 'office', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.157614, lng: 119.446453, aliases: ['boulevard panakkukang', 'pengayoman'] },
    { id: 'mks-cbd-pettarani', name: 'Kawasan Perkantoran Jl. A.P. Pettarani', category: 'office', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.166429, lng: 119.435106, aliases: ['perkantoran pettarani', 'ap pettarani'] },
    { id: 'mks-cbd-cpi', name: 'Kawasan Bisnis Center Point of Indonesia (CPI)', category: 'office', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.148504, lng: 119.407163, aliases: ['cpi makassar', 'citraland cpi'] },
    // Rumah Sakit Besar
    { id: 'mks-rsup-wahidin', name: 'RSUP Dr. Wahidin Sudirohusodo', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.134776, lng: 119.494041, aliases: ['rs wahidin', 'rsup wahidin'] },
    { id: 'mks-rs-unhas', name: 'Rumah Sakit Universitas Hasanuddin (RS UNHAS)', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.133327, lng: 119.494403, aliases: ['rs unhas', 'rs pendidikan unhas'] },
    { id: 'mks-rs-siloam', name: 'Siloam Hospitals Makassar (Metro Tanjung Bunga)', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.149955, lng: 119.407308, aliases: ['rs siloam makassar', 'siloam tanjung bunga'] },
    { id: 'mks-rs-primaya', name: 'Primaya Hospital Makassar (Eks Awal Bros)', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.135131, lng: 119.435315, aliases: ['rs awal bros', 'rs primaya'] },
    { id: 'mks-rs-primaya-hertasning', name: 'Primaya Hospital Hertasning', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.176790, lng: 119.456655, aliases: ['primaya hertasning'] },
    { id: 'mks-rs-hermina', name: 'RS Hermina Makassar (Toddopuli)', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.162750, lng: 119.457537, aliases: ['hermina makassar'] },
    { id: 'mks-rs-labuang-baji', name: 'RSUD Labuang Baji Makassar', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.162474, lng: 119.418240, aliases: ['rs labuang baji'] },
    { id: 'mks-rs-daya', name: 'RSUD Daya Kota Makassar', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.113787, lng: 119.511506, aliases: ['rs daya', 'rsud daya'] },
    { id: 'mks-rs-ibnu-sina', name: 'Rumah Sakit Ibnu Sina YBW UMI', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.139695, lng: 119.446234, aliases: ['rs ibnu sina'] },
    { id: 'mks-rs-bhayangkara', name: 'RS Bhayangkara Makassar', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.174686, lng: 119.415807, aliases: ['rs bhayangkara mks'] },
    { id: 'mks-rs-stella-maris', name: 'RS Stella Maris Makassar', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.143902, lng: 119.408911, aliases: ['stella maris'] },
    // Wisata & Ikon Kota
    { id: 'mks-pantai-losari', name: 'Kawasan Wisata Pantai Losari', category: 'tourism', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.143620, lng: 119.407482, aliases: ['pantai losari', 'losari'] },
    { id: 'mks-fort-rotterdam', name: 'Benteng Fort Rotterdam', category: 'tourism', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.134000, lng: 119.405631, aliases: ['fort rotterdam', 'benteng ujung pandang'] },
    { id: 'mks-masjid-99-kubah', name: 'Masjid 99 Kubah CPI Makassar', category: 'tourism', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.143942, lng: 119.404141, aliases: ['masjid 99 kubah', 'masjid cpi', 'masjid kubah 99 asmaul husna'] },
    // Hub Transportasi
    { id: 'mks-bandara-hasanuddin', name: 'Bandara Internasional Sultan Hasanuddin', category: 'transport', city: 'Maros', province: 'Sulawesi Selatan', lat: -5.077707, lng: 119.549314, aliases: ['bandara hasanuddin', 'bandara shiam'] },
    { id: 'mks-pelabuhan-soetta', name: 'Pelabuhan Soekarno-Hatta Makassar', category: 'transport', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.124777, lng: 119.407977, aliases: ['pelabuhan makassar', 'pelabuhan soetta'] },
    { id: 'mks-terminal-daya', name: 'Terminal Regional Daya (Makassar)', category: 'transport', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.110282, lng: 119.507997, aliases: ['terminal daya'] },
    { id: 'mks-terminal-mallengkeri', name: 'Terminal Mallengkeri Makassar', category: 'transport', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.187637, lng: 119.440257, aliases: ['terminal mallengkeri'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 2. JABODETABEK & BANTEN (JAKARTA, TANGERANG, DEPOK, BOGOR, BEKASI)
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus & Kedinasan
    { id: 'tng-pkn-stan-bintaro', name: 'Politeknik Keuangan Negara STAN (PKN STAN Bintaro)', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.267967, lng: 106.732855, aliases: ['stan', 'pkn stan', 'stan bintaro'] },
    { id: 'jkt-ui-depok', name: 'Universitas Indonesia (UI) - Kampus Depok', category: 'campus', city: 'Depok', province: 'Jawa Barat', lat: -6.360623, lng: 106.827234, aliases: ['ui depok', 'rektorat ui'] },
    { id: 'jkt-ui-salemba', name: 'Universitas Indonesia (UI) - Kampus Salemba', category: 'campus', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.193975, lng: 106.848409, aliases: ['ui salemba', 'fk ui'] },
    { id: 'jkt-pnj-depok', name: 'Politeknik Negeri Jakarta (PNJ Depok)', category: 'campus', city: 'Depok', province: 'Jawa Barat', lat: -6.370885, lng: 106.824488, aliases: ['pnj depok', 'poltek ui'] },
    { id: 'jkt-unpam-puspitek', name: 'Universitas Pamulang (UNPAM) - Kampus Viktor/Puspitek', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.346096, lng: 106.691514, aliases: ['unpam viktor', 'unpam'] },
    { id: 'jkt-unpam-pusat', name: 'Universitas Pamulang (UNPAM) - Kampus 1 Pusat', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.344168, lng: 106.737155, aliases: ['unpam pusat', 'unpam reni jaya'] },
    { id: 'jkt-uin-ciputat', name: 'UIN Syarif Hidayatullah Jakarta (Ciputat)', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.306661, lng: 106.756196, aliases: ['uin jakarta', 'uin ciputat'] },
    { id: 'jkt-uph-karawaci', name: 'Universitas Pelita Harapan (UPH Lippo Karawaci)', category: 'campus', city: 'Tangerang', province: 'Banten', lat: -6.228373, lng: 106.611269, aliases: ['uph karawaci', 'uph'] },
    { id: 'jkt-ipb-dramaga', name: 'IPB University - Kampus IPB Dramaga', category: 'campus', city: 'Bogor', province: 'Jawa Barat', lat: -6.555274, lng: 106.722906, aliases: ['ipb dramaga', 'ipb bogor'] },
    { id: 'jkt-ipb-baranangsiang', name: 'IPB University - Kampus Baranangsiang', category: 'campus', city: 'Bogor', province: 'Jawa Barat', lat: -6.599830, lng: 106.806654, aliases: ['ipb baranangsiang'] },
    { id: 'jkt-binus-kemanggisan', name: 'BINUS University - Kampus Anggrek/Syahdan', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.201759, lng: 106.782255, aliases: ['binus kemanggisan', 'binus anggrek'] },
    { id: 'jkt-binus-alsut', name: 'BINUS University - Alam Sutera', category: 'campus', city: 'Tangerang', province: 'Banten', lat: -6.223203, lng: 106.649035, aliases: ['binus alsut'] },
    { id: 'jkt-trisakti-grogol', name: 'Universitas Trisakti - Kampus A Grogol', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.168275, lng: 106.789241, aliases: ['trisakti', 'univ trisakti'] },
    { id: 'jkt-untar-grogol', name: 'Universitas Tarumanagara (UNTAR)', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.169179, lng: 106.789502, aliases: ['untar'] },
    { id: 'jkt-unj-rawamangun', name: 'Universitas Negeri Jakarta (UNJ) - Rawamangun', category: 'campus', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.194259, lng: 106.879044, aliases: ['unj rawamangun'] },
    { id: 'jkt-atmajaya-semanggi', name: 'Unika Atma Jaya Jakarta - Semanggi', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.218444, lng: 106.815375, aliases: ['atma jaya semanggi'] },
    { id: 'jkt-atmajaya-pluit', name: 'Unika Atma Jaya Jakarta - Kampus Pluit (Kedokteran)', category: 'campus', city: 'Jakarta Utara', province: 'DKI Jakarta', lat: -6.125913, lng: 106.793327, aliases: ['fk atma jaya pluit'] },
    { id: 'jkt-upn-pondoklabu', name: 'UPN Veteran Jakarta - Pondok Labu', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.315751, lng: 106.794330, aliases: ['upnvj', 'upn jakarta'] },
    { id: 'jkt-umn-gading-serpong', name: 'Universitas Multimedia Nusantara (UMN)', category: 'campus', city: 'Tangerang', province: 'Banten', lat: -6.256738, lng: 106.618303, aliases: ['umn gading serpong'] },
    { id: 'jkt-prasmul-bsd', name: 'Universitas Prasetiya Mulya - BSD Campus', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.300393, lng: 106.639976, aliases: ['prasmul bsd'] },
    { id: 'jkt-gunadarma-depok', name: 'Universitas Gunadarma - Kampus D Margonda', category: 'campus', city: 'Depok', province: 'Jawa Barat', lat: -6.368521, lng: 106.833194, aliases: ['gunadarma margonda', 'gundar d'] },
    { id: 'jkt-pancasila-lentengagung', name: 'Universitas Pancasila - Srengseng Sawah', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.339829, lng: 106.833252, aliases: ['univ pancasila'] },
    { id: 'jkt-mercubuana-meruya', name: 'Universitas Mercu Buana - Meruya', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.209407, lng: 106.738741, aliases: ['mercu buana meruya'] },
    { id: 'jkt-esaunggul-kebonjeruk', name: 'Universitas Esa Unggul - Kebon Jeruk', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.185837, lng: 106.779043, aliases: ['esa unggul'] },
    { id: 'jkt-budiluhur-petukangan', name: 'Universitas Budi Luhur - Petukangan', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.234782, lng: 106.747327, aliases: ['budi luhur'] },
    { id: 'jkt-lspr-sudirman', name: 'LSPR Institute of Communication & Business', category: 'campus', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.205181, lng: 106.817919, aliases: ['lspr sudirman park'] },
    { id: 'jkt-uki-cawang', name: 'Universitas Kristen Indonesia (UKI Cawang)', category: 'campus', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.250710, lng: 106.872064, aliases: ['uki cawang'] },
    { id: 'jkt-pertamina-simprug', name: 'Universitas Pertamina (Simprug)', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.228568, lng: 106.789164, aliases: ['univ pertamina'] },
    { id: 'jkt-alazhar-kebayoran', name: 'Universitas Al-Azhar Indonesia (UAI Kebayoran Baru)', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.235043, lng: 106.799260, aliases: ['uai kebayoran'] },
    { id: 'jkt-unpak-bogor', name: 'Universitas Pakuan (UNPAK Bogor)', category: 'campus', city: 'Bogor', province: 'Jawa Barat', lat: -6.599466, lng: 106.811790, aliases: ['unpak bogor'] },
    // Mall & Ritel
    { id: 'jkt-grand-indonesia', name: 'Grand Indonesia & Plaza Indonesia', category: 'mall', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.193598, lng: 106.821947, aliases: ['gi', 'grand indonesia'] },
    { id: 'jkt-senayan-city', name: 'Senayan City & Plaza Senayan', category: 'mall', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.227195, lng: 106.797012, aliases: ['senci', 'senayan city'] },
    { id: 'jkt-central-park', name: 'Central Park Mall & Mall Taman Anggrek', category: 'mall', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.176165, lng: 106.791929, aliases: ['central park', 'taman anggrek', 'neo soho'] },
    { id: 'jkt-gandaria-city', name: 'Gandaria City Mall (Gancit)', category: 'mall', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.244108, lng: 106.783870, aliases: ['gancit', 'gandaria city'] },
    { id: 'jkt-pondok-indah-mall', name: 'Pondok Indah Mall (PIM 1, 2, 3)', category: 'mall', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.265217, lng: 106.784317, aliases: ['pim', 'pondok indah mall'] },
    { id: 'jkt-kota-kasablanka', name: 'Kota Kasablanka (Kokas)', category: 'mall', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.224030, lng: 106.842480, aliases: ['kokas', 'kota kasablanka'] },
    { id: 'jkt-kelapa-gading', name: 'Mall Kelapa Gading (MKG 1-5)', category: 'mall', city: 'Jakarta Utara', province: 'DKI Jakarta', lat: -6.157444, lng: 106.908460, aliases: ['mkg', 'mall kelapa gading'] },
    { id: 'jkt-aeon-bsd', name: 'AEON Mall BSD City', category: 'mall', city: 'Tangerang Selatan', province: 'Banten', lat: -6.304861, lng: 106.643263, aliases: ['aeon bsd'] },
    { id: 'jkt-aeon-tanjung-barat', name: 'AEON Mall Tanjung Barat', category: 'mall', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.306613, lng: 106.840210, aliases: ['aeon tanjung barat'] },
    { id: 'jkt-summarecon-serpong', name: 'Summarecon Mall Serpong (SMS)', category: 'mall', city: 'Tangerang', province: 'Banten', lat: -6.241087, lng: 106.628338, aliases: ['sms', 'summarecon serpong'] },
    { id: 'jkt-bxc-bintaro', name: 'Bintaro Jaya Xchange Mall (BXc)', category: 'mall', city: 'Tangerang Selatan', province: 'Banten', lat: -6.285448, lng: 106.728545, aliases: ['bxc', 'bintaro xchange'] },
    { id: 'jkt-summarecon-bekasi', name: 'Summarecon Mall Bekasi (SMB)', category: 'mall', city: 'Bekasi', province: 'Jawa Barat', lat: -6.225964, lng: 107.000705, aliases: ['smb', 'summarecon bekasi'] },
    { id: 'jkt-margo-city', name: 'Margo City Mall Depok', category: 'mall', city: 'Depok', province: 'Jawa Barat', lat: -6.372967, lng: 106.834423, aliases: ['margo city', 'margocity'] },
    // Kawasan Bisnis & Perkantoran (CBD)
    { id: 'jkt-cbd-scbd', name: 'Kawasan Bisnis SCBD Sudirman', category: 'office', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.224591, lng: 106.811086, aliases: ['scbd', 'sudirman cbd', 'pacific place'] },
    { id: 'jkt-cbd-kuningan', name: 'Kawasan Rasuna Said / Kuningan CBD', category: 'office', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.218820, lng: 106.836932, aliases: ['kuningan cbd', 'rasuna said'] },
    { id: 'jkt-cbd-mega-kuningan', name: 'Kawasan Mega Kuningan', category: 'office', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.224650, lng: 106.827090, aliases: ['mega kuningan', 'world capital tower'] },
    { id: 'jkt-cbd-tb-simatupang', name: 'Koridor Bisnis TB Simatupang', category: 'office', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.302000, lng: 106.832859, aliases: ['tb simatupang', 'simatupang office'] },
    { id: 'jkt-cbd-bsd-green-office', name: 'BSD Green Office Park & Digital Hub', category: 'office', city: 'Tangerang Selatan', province: 'Banten', lat: -6.306841, lng: 106.654023, aliases: ['gop bsd', 'bsd green office'] },
    // Kawasan Industri
    { id: 'jkt-ind-jababeka', name: 'Kawasan Industri Jababeka Cikarang', category: 'industrial', city: 'Bekasi', province: 'Jawa Barat', lat: -6.293935, lng: 107.145936, aliases: ['jababeka 1', 'jababeka 2', 'kawasan jababeka'] },
    { id: 'jkt-ind-mm2100', name: 'Kawasan Industri MM2100 Cibitung', category: 'industrial', city: 'Bekasi', province: 'Jawa Barat', lat: -6.244173, lng: 107.140334, aliases: ['mm2100', 'kawasan mm2100'] },
    { id: 'jkt-ind-kiic-karawang', name: 'Kawasan Industri KIIC Karawang', category: 'industrial', city: 'Karawang', province: 'Jawa Barat', lat: -6.359437, lng: 107.274253, aliases: ['kiic', 'karawang international industrial city'] },
    { id: 'jkt-ind-surya-cipta', name: 'Kawasan Industri Surya Cipta Karawang', category: 'industrial', city: 'Karawang', province: 'Jawa Barat', lat: -6.374018, lng: 107.327635, aliases: ['surya cipta karawang'] },
    { id: 'jkt-ind-giic-deltamas', name: 'Kawasan Industri GIIC Deltamas (Pusat EV Hyundai/Wuling)', category: 'industrial', city: 'Bekasi', province: 'Jawa Barat', lat: -6.370914, lng: 107.195119, aliases: ['giic deltamas', 'kota deltamas'] },
    { id: 'jkt-ind-ejip', name: 'Kawasan Industri EJIP Cikarang Selatan', category: 'industrial', city: 'Bekasi', province: 'Jawa Barat', lat: -6.329727, lng: 107.107451, aliases: ['ejip cikarang'] },
    { id: 'jkt-ind-pulogadung', name: 'Kawasan Industri Pulogadung (JIEP)', category: 'industrial', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.188692, lng: 106.916912, aliases: ['jiep pulogadung', 'kawasan industri pulogadung'] },
    { id: 'jkt-ind-manis-tangerang', name: 'Kawasan Industri Manis & Jatake Tangerang', category: 'industrial', city: 'Tangerang', province: 'Banten', lat: -6.211997, lng: 106.573287, aliases: ['industri manis', 'jatake tangerang'] },
    // Rumah Sakit Besar
    { id: 'jkt-rsup-rscm', name: 'RSUP Nasional Dr. Cipto Mangunkusumo (RSCM)', category: 'hospital', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.197636, lng: 106.847025, aliases: ['rscm', 'rscm kencana'] },
    { id: 'jkt-rs-fatmawati', name: 'RSUP Fatmawati Jakarta Selatan', category: 'hospital', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.295064, lng: 106.796214, aliases: ['rs fatmawati'] },
    { id: 'jkt-rs-harapan-kita', name: 'RS Jantung & Anak Harapan Kita (Slipi)', category: 'hospital', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.185604, lng: 106.798143, aliases: ['rs harapan kita', 'rsab harapan kita'] },
    { id: 'jkt-rspad-gatot-soebroto', name: 'RSPAD Gatot Soebroto (Senen)', category: 'hospital', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.176120, lng: 106.837749, aliases: ['rspad', 'gatot soebroto'] },
    { id: 'jkt-rs-pon-cawang', name: 'RS Pusat Otak Nasional (RS PON Cawang)', category: 'hospital', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.246107, lng: 106.870466, aliases: ['rs pon', 'pusat otak nasional'] },
    { id: 'jkt-rs-persahabatan', name: 'RSUP Persahabatan Rawamangun', category: 'hospital', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.203987, lng: 106.883866, aliases: ['rs persahabatan'] },
    { id: 'jkt-rs-siloam-karawaci', name: 'Siloam Hospitals Lippo Village Karawaci', category: 'hospital', city: 'Tangerang', province: 'Banten', lat: -6.225232, lng: 106.597961, aliases: ['siloam karawaci'] },
    { id: 'jkt-rs-mayapada-lebakbulus', name: 'Mayapada Hospital Jakarta Selatan / Tangerang', category: 'hospital', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.298245, lng: 106.786221, aliases: ['mayapada lebak bulus'] },
    { id: 'jkt-rs-pondok-indah', name: 'RS Pondok Indah (RSPI Puri / Pondok Indah)', category: 'hospital', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.283610, lng: 106.781501, aliases: ['rspi pondok indah'] },
    { id: 'jkt-rs-ui-depok', name: 'Rumah Sakit Universitas Indonesia (RSUI Depok)', category: 'hospital', city: 'Depok', province: 'Jawa Barat', lat: -6.372954, lng: 106.828947, aliases: ['rsui depok', 'rs ui'] },
    // Hub Transportasi
    { id: 'jkt-bandara-soetta', name: 'Bandara Internasional Soekarno-Hatta (CGK)', category: 'transport', city: 'Tangerang', province: 'Banten', lat: -6.124843, lng: 106.660103, aliases: ['bandara soetta', 'terminal 3 soetta'] },
    { id: 'jkt-bandara-halim', name: 'Bandara Halim Perdanakusuma (HLP)', category: 'transport', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.265338, lng: 106.885553, aliases: ['bandara halim'] },
    { id: 'jkt-stasiun-whoosh-halim', name: 'Stasiun Kereta Cepat Whoosh Halim', category: 'transport', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.246141, lng: 106.884281, aliases: ['whoosh halim', 'kcic halim'] },
    { id: 'jkt-stasiun-gambir', name: 'Stasiun Kereta Api Gambir', category: 'transport', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.176565, lng: 106.830590, aliases: ['stasiun gambir'] },
    { id: 'jkt-stasiun-pasar-senen', name: 'Stasiun Kereta Api Pasar Senen', category: 'transport', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.174700, lng: 106.844350, aliases: ['stasiun senen'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 3. BANDUNG RAYA, CIMAHI, & JATINANGOR (JAWA BARAT)
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus & Kedinasan
    { id: 'bdg-ipdn-jatinangor', name: 'Institut Pemerintahan Dalam Negeri (IPDN Jatinangor)', category: 'campus', city: 'Sumedang', province: 'Jawa Barat', lat: -6.933423, lng: 107.763836, aliases: ['ipdn', 'ipdn jatinangor'] },
    { id: 'bdg-poltekpar-nhi', name: 'Politeknik Pariwisata NHI Bandung (Enhaii Setiabudi)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.868306, lng: 107.594517, aliases: ['enhaii', 'stpb enhaii', 'poltekpar nhi'] },
    { id: 'bdg-itb-ganesha', name: 'Institut Teknologi Bandung (ITB) - Kampus Ganesha', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.890362, lng: 107.610191, aliases: ['itb', 'itb ganesha'] },
    { id: 'bdg-itb-jatinangor', name: 'Institut Teknologi Bandung (ITB) - Kampus Jatinangor', category: 'campus', city: 'Sumedang', province: 'Jawa Barat', lat: -6.933777, lng: 107.768358, aliases: ['itb jatinangor'] },
    { id: 'bdg-unpad-dipatiukur', name: 'Universitas Padjadjaran (UNPAD) - Dipatiukur', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.893419, lng: 107.617293, aliases: ['unpad du', 'unpad dipatiukur'] },
    { id: 'bdg-unpad-jatinangor', name: 'Universitas Padjadjaran (UNPAD) - Jatinangor', category: 'campus', city: 'Sumedang', province: 'Jawa Barat', lat: -6.926132, lng: 107.774688, aliases: ['unpad jatinangor', 'rektorat unpad'] },
    { id: 'bdg-upi-setiabudi', name: 'Universitas Pendidikan Indonesia (UPI) - Setiabudi', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.861301, lng: 107.592083, aliases: ['upi setiabudi', 'upi bandung'] },
    { id: 'bdg-telkom-university', name: 'Telkom University (Tel-U Dayeuhkolot)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.973416, lng: 107.630406, aliases: ['telkom university', 'tel u'] },
    { id: 'bdg-unpar-ciumbuleuit', name: 'Universitas Katolik Parahyangan (UNPAR)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.875374, lng: 107.604870, aliases: ['unpar ciumbuleuit'] },
    { id: 'bdg-unpas-tamansari', name: 'Universitas Pasundan (UNPAS) - Tamansari & Setiabudi', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.866502, lng: 107.593245, aliases: ['unpas tamansari', 'unpas'] },
    { id: 'bdg-unisba-tamansari', name: 'Universitas Islam Bandung (UNISBA)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.903714, lng: 107.608236, aliases: ['unisba tamansari'] },
    { id: 'bdg-maranatha-suriasumantri', name: 'Universitas Kristen Maranatha', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.885897, lng: 107.580528, aliases: ['maranatha'] },
    { id: 'bdg-widyatama-cikutra', name: 'Universitas Widyatama (Cikutra)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.898010, lng: 107.645279, aliases: ['widyatama'] },
    { id: 'bdg-itenas-pku', name: 'Institut Teknologi Nasional (ITENAS Bandung)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.897198, lng: 107.636371, aliases: ['itenas'] },
    { id: 'bdg-polban-sarijadi', name: 'Politeknik Negeri Bandung (POLBAN)', category: 'campus', city: 'Bandung Barat', province: 'Jawa Barat', lat: -6.872207, lng: 107.573773, aliases: ['polban'] },
    // Mall, Bisnis & RS
    { id: 'bdg-paris-van-java', name: 'Paris Van Java Resort Mall (PVJ)', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.889564, lng: 107.596007, aliases: ['pvj bandung'] },
    { id: 'bdg-23-paskal', name: '23 Paskal Shopping Center', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.915084, lng: 107.597611, aliases: ['23 paskal'] },
    { id: 'bdg-ciwalk', name: 'Cihampelas Walk (Ciwalk)', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.894317, lng: 107.605014, aliases: ['ciwalk'] },
    { id: 'bdg-trans-studio', name: 'Trans Studio Mall Bandung (TSM)', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.925584, lng: 107.636697, aliases: ['tsm bandung'] },
    { id: 'bdg-summarecon-mall-bandung', name: 'Summarecon Mall Bandung (Gedebage)', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.955178, lng: 107.697701, aliases: ['summarecon bandung'] },
    { id: 'bdg-cbd-asia-afrika', name: 'Kawasan Perkantoran Jl. Asia Afrika / Braga', category: 'office', city: 'Bandung', province: 'Jawa Barat', lat: -6.921948, lng: 107.616111, aliases: ['asia afrika', 'braga bandung'] },
    { id: 'bdg-rsup-hasan-sadikin', name: 'RSUP Dr. Hasan Sadikin Bandung (RSHS)', category: 'hospital', city: 'Bandung', province: 'Jawa Barat', lat: -6.898142, lng: 107.598325, aliases: ['rshs', 'hasan sadikin'] },
    { id: 'bdg-rs-borromeus', name: 'RS Santo Borromeus Bandung (Dago)', category: 'hospital', city: 'Bandung', province: 'Jawa Barat', lat: -6.893996, lng: 107.613680, aliases: ['borromeus dago'] },
    { id: 'bdg-rs-immanuel', name: 'RS Immanuel Bandung (Kopo)', category: 'hospital', city: 'Bandung', province: 'Jawa Barat', lat: -6.934958, lng: 107.596510, aliases: ['rs immanuel'] },
    { id: 'bdg-stasiun-bandung', name: 'Stasiun Kereta Api Bandung (Hall & Kiaracondong)', category: 'transport', city: 'Bandung', province: 'Jawa Barat', lat: -6.914647, lng: 107.602438, aliases: ['stasiun bandung'] },
    { id: 'bdg-stasiun-whoosh-padalarang', name: 'Stasiun Whoosh Kereta Cepat Padalarang Hub', category: 'transport', city: 'Bandung Barat', province: 'Jawa Barat', lat: -6.842233, lng: 107.496139, aliases: ['whoosh padalarang'] },
    { id: 'bdg-stasiun-whoosh-tegalluar', name: 'Stasiun Whoosh Kereta Cepat Tegalluar', category: 'transport', city: 'Bandung', province: 'Jawa Barat', lat: -6.964647, lng: 107.714770, aliases: ['whoosh tegalluar'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 4. DI YOGYAKARTA & SLEMAN / BANTUL
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus & Episentrum Kost
    { id: 'jog-stie-ykpn-seturan', name: 'STIE YKPN & Kawasan Mahasiswa Seturan', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.769026, lng: 110.410216, aliases: ['ykpn', 'stie ykpn', 'seturan'] },
    { id: 'jog-ugm-bulaksumur', name: 'Universitas Gadjah Mada (UGM) - Bulaksumur', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.770860, lng: 110.377869, aliases: ['ugm', 'bulaksumur', 'rektorat ugm'] },
    { id: 'jog-uny-karangmalang', name: 'Universitas Negeri Yogyakarta (UNY)', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.773724, lng: 110.386251, aliases: ['uny'] },
    { id: 'jog-uii-terpadu-kaliurang', name: 'Universitas Islam Indonesia (UII) - Jl. Kaliurang KM 14.5', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.687650, lng: 110.414237, aliases: ['uii terpadu', 'uii kaliurang'] },
    { id: 'jog-umy-ringroad', name: 'Universitas Muhammadiyah Yogyakarta (UMY)', category: 'campus', city: 'Bantul', province: 'DI Yogyakarta', lat: -7.811210, lng: 110.320966, aliases: ['umy', 'umy terpadu'] },
    { id: 'jog-uin-sunan-kalijaga', name: 'UIN Sunan Kalijaga Yogyakarta', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.784784, lng: 110.394359, aliases: ['uin jogja', 'uin kalijaga'] },
    { id: 'jog-upn-veteran-condongcatur', name: 'UPN Veteran Yogyakarta - Condongcatur', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.762233, lng: 110.409279, aliases: ['upn jogja', 'upn conkat'] },
    { id: 'jog-atmajaya-babarsari', name: 'Universitas Atma Jaya Yogyakarta (UAJY) - Babarsari', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.780440, lng: 110.414111, aliases: ['atmajaya jogja', 'uajy', 'babarsari'] },
    { id: 'jog-sanatadharma-mrican', name: 'Universitas Sanata Dharma (USD) - Mrican & Paingan', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.775294, lng: 110.389412, aliases: ['usd jogja', 'sanata dharma'] },
    { id: 'jog-uad-kampus-4', name: 'Universitas Ahmad Dahlan (UAD) - Kampus 4 Ringroad Selatan', category: 'campus', city: 'Bantul', province: 'DI Yogyakarta', lat: -7.833377, lng: 110.383141, aliases: ['uad kampus 4', 'uad utama'] },
    { id: 'jog-amikom-condongcatur', name: 'Universitas AMIKOM Yogyakarta', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.760060, lng: 110.409136, aliases: ['amikom'] },
    { id: 'jog-isi-sewon', name: 'Institut Seni Indonesia (ISI Yogyakarta) - Sewon', category: 'campus', city: 'Bantul', province: 'DI Yogyakarta', lat: -7.851621, lng: 110.356534, aliases: ['isi jogja'] },
    // Mall, Wisata, RS & Transportasi
    { id: 'jog-pakuwon-mall-jogja', name: 'Pakuwon Mall Jogja (Eks Hartono Mall)', category: 'mall', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.758707, lng: 110.399150, aliases: ['pakuwon jogja', 'hartono mall'] },
    { id: 'jog-plaza-ambarrukmo', name: 'Plaza Ambarrukmo (Amplaz)', category: 'mall', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.782760, lng: 110.400989, aliases: ['amplaz', 'ambarrukmo plaza'] },
    { id: 'jog-jogja-city-mall', name: 'Jogja City Mall (JCM Jl. Magelang)', category: 'mall', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.753418, lng: 110.360527, aliases: ['jcm jogja'] },
    { id: 'jog-malioboro', name: 'Kawasan Malioboro & Titik Nol KM Jogja', category: 'tourism', city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.801397, lng: 110.364764, aliases: ['malioboro', 'titik nol jogja'] },
    { id: 'jog-rsup-dr-sardjito', name: 'RSUP Dr. Sardjito Yogyakarta', category: 'hospital', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.768616, lng: 110.373474, aliases: ['rs sardjito', 'rsup sardjito'] },
    { id: 'jog-rs-panti-rapih', name: 'RS Panti Rapih Yogyakarta', category: 'hospital', city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.777237, lng: 110.376169, aliases: ['panti rapih'] },
    { id: 'jog-rs-bethesda', name: 'RS Bethesda Yogyakarta (Jl. Jend. Sudirman)', category: 'hospital', city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.783340, lng: 110.378217, aliases: ['bethesda jogja'] },
    { id: 'jog-rs-jih', name: 'Jogja International Hospital (RS JIH Ringroad Utara)', category: 'hospital', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.757557, lng: 110.403572, aliases: ['rs jih jogja'] },
    { id: 'jog-stasiun-tugu', name: 'Stasiun Kereta Api Tugu Yogyakarta & Lempuyangan', category: 'transport', city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.789310, lng: 110.362981, aliases: ['stasiun tugu', 'stasiun lempuyangan'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 5. SURABAYA RAYA (SURABAYA, SIDOARJO, GRESIK), MALANG, & JEMBER (JAWA TIMUR)
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus Surabaya, Malang, & Jember
    { id: 'sby-pens-sukolilo', name: 'Politeknik Elektronika Negeri Surabaya (PENS)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.275824, lng: 112.793757, aliases: ['pens', 'pens sukolilo'] },
    { id: 'sby-ppns-sukolilo', name: 'Politeknik Perkapalan Negeri Surabaya (PPNS)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.277379, lng: 112.795888, aliases: ['ppns'] },
    { id: 'sby-its-sukolilo', name: 'Institut Teknologi Sepuluh Nopember (ITS) - Sukolilo', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.280249, lng: 112.793216, aliases: ['its sukolilo', 'its surabaya'] },
    { id: 'sby-unair-kampus-c', name: 'Universitas Airlangga (UNAIR) - Kampus C Mulyorejo', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.268709, lng: 112.784231, aliases: ['unair c', 'rektorat unair'] },
    { id: 'sby-unair-kampus-b', name: 'Universitas Airlangga (UNAIR) - Kampus B Dharmawangsa', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.272134, lng: 112.758667, aliases: ['unair b', 'feb unair'] },
    { id: 'sby-unesa-lidah-wetan', name: 'Universitas Negeri Surabaya (UNESA) - Lidah Wetan', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.300866, lng: 112.672669, aliases: ['unesa lidah wetan'] },
    { id: 'sby-ubaya-tenggilis', name: 'Universitas Surabaya (UBAYA) - Tenggilis', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.320103, lng: 112.767937, aliases: ['ubaya tenggilis'] },
    { id: 'sby-petra-siwalankerto', name: 'Universitas Kristen Petra (UK Petra)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.339037, lng: 112.736983, aliases: ['uk petra'] },
    { id: 'sby-upn-jatim', name: 'UPN Veteran Jawa Timur (Rungkut Madya)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.333721, lng: 112.788325, aliases: ['upn jatim', 'upn surabaya'] },
    { id: 'sby-ciputra-citraland', name: 'Universitas Ciputra Surabaya (UC)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.285591, lng: 112.631599, aliases: ['uc surabaya'] },
    { id: 'jbr-unej-tegalboto', name: 'Universitas Jember (UNEJ) - Kampus Tegalboto', category: 'campus', city: 'Jember', province: 'Jawa Timur', lat: -8.165158, lng: 113.716413, aliases: ['unej jember', 'tegalboto'] },
    { id: 'mlg-ub-ketawanggede', name: 'Universitas Brawijaya (UB) - Ketawanggede', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.949625, lng: 112.611950, aliases: ['ub malang', 'brawijaya'] },
    { id: 'mlg-um-sumbersari', name: 'Universitas Negeri Malang (UM)', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.960409, lng: 112.618594, aliases: ['um malang'] },
    { id: 'mlg-umm-kampus-3', name: 'Universitas Muhammadiyah Malang (UMM) - Kampus 3 Tlogomas', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.921517, lng: 112.597365, aliases: ['umm tlogomas', 'umm kampus 3'] },
    { id: 'mlg-polinema', name: 'Politeknik Negeri Malang (POLINEMA)', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.946891, lng: 112.616121, aliases: ['polinema'] },
    { id: 'mlg-unisma', name: 'Universitas Islam Malang (UNISMA Dinoyo)', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.936657, lng: 112.607300, aliases: ['unisma malang'] },
    { id: 'mlg-itn', name: 'Institut Teknologi Nasional (ITN Malang Kampus 1 & 2)', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.957802, lng: 112.612216, aliases: ['itn malang'] },
    // Mall, Industri & RS Surabaya/Malang
    { id: 'sby-tunjungan-plaza', name: 'Tunjungan Plaza (TP 1-6)', category: 'mall', city: 'Surabaya', province: 'Jawa Timur', lat: -7.263171, lng: 112.740071, aliases: ['tp surabaya', 'tunjungan plaza'] },
    { id: 'sby-pakuwon-mall', name: 'Pakuwon Mall & PTC Surabaya Barat', category: 'mall', city: 'Surabaya', province: 'Jawa Timur', lat: -7.290529, lng: 112.673845, aliases: ['pakuwon mall surabaya', 'ptc surabaya'] },
    { id: 'sby-galaxy-mall', name: 'Galaxy Mall Surabaya (GM 1, 2, 3)', category: 'mall', city: 'Surabaya', province: 'Jawa Timur', lat: -7.275992, lng: 112.782004, aliases: ['galaxy mall surabaya'] },
    { id: 'sby-ind-sier-rungkut', name: 'Kawasan Industri SIER Rungkut Surabaya', category: 'industrial', city: 'Surabaya', province: 'Jawa Timur', lat: -7.330151, lng: 112.759089, aliases: ['sier rungkut', 'kawasan sier'] },
    { id: 'sby-ind-jiipe-gresik', name: 'Kawasan Industri JIIPE Manyar Gresik (Freeport Smelter)', category: 'industrial', city: 'Gresik', province: 'Jawa Timur', lat: -7.085925, lng: 112.603026, aliases: ['jiipe gresik', 'kawasan industri manyar'] },
    { id: 'sby-rsup-dr-soetomo', name: 'RSUD Dr. Soetomo Surabaya', category: 'hospital', city: 'Surabaya', province: 'Jawa Timur', lat: -7.268206, lng: 112.758066, aliases: ['rsud dr soetomo', 'rs soetomo'] },
    { id: 'sby-rs-national-hospital', name: 'National Hospital Surabaya Barat', category: 'hospital', city: 'Surabaya', province: 'Jawa Timur', lat: -7.299401, lng: 112.676450, aliases: ['national hospital'] },
    { id: 'mlg-rs-saiful-anwar', name: 'RSUD Dr. Saiful Anwar Malang (RSSA)', category: 'hospital', city: 'Malang', province: 'Jawa Timur', lat: -7.972362, lng: 112.631410, aliases: ['rssa malang', 'saiful anwar'] },
    { id: 'mlg-mall-olympic-garden', name: 'Mall Olympic Garden (MOG Malang)', category: 'mall', city: 'Malang', province: 'Jawa Timur', lat: -7.976780, lng: 112.623949, aliases: ['mog malang'] },
    { id: 'sby-bandara-juanda', name: 'Bandara Internasional Juanda (SUB)', category: 'transport', city: 'Sidoarjo', province: 'Jawa Timur', lat: -7.380968, lng: 112.792629, aliases: ['bandara juanda'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 6. SEMARANG, SOLO, PURWOKERTO, & SALATIGA (JAWA TENGAH)
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'smg-undip-tembalang', name: 'Universitas Diponegoro (UNDIP) - Kampus Tembalang', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -7.051962, lng: 110.440892, aliases: ['undip tembalang', 'rektorat undip'] },
    { id: 'smg-polines-tembalang', name: 'Politeknik Negeri Semarang (POLINES Tembalang)', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -7.052642, lng: 110.434420, aliases: ['polines'] },
    { id: 'smg-unnes-segaran', name: 'Universitas Negeri Semarang (UNNES) - Sekaran', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -7.050636, lng: 110.392423, aliases: ['unnes sekaran'] },
    { id: 'smg-udinus-pendrikan', name: 'Universitas Dian Nuswantoro (UDINUS Semarang)', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -6.982637, lng: 110.409036, aliases: ['udinus'] },
    { id: 'smg-unissula-kaligawe', name: 'Universitas Islam Sultan Agung (UNISSULA)', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -6.955618, lng: 110.458093, aliases: ['unissula'] },
    { id: 'slo-uns-kentingan', name: 'Universitas Sebelas Maret (UNS) - Kentingan Solo', category: 'campus', city: 'Surakarta', province: 'Jawa Tengah', lat: -7.559489, lng: 110.856330, aliases: ['uns solo', 'kentingan'] },
    { id: 'slo-ums-pabelan', name: 'Universitas Muhammadiyah Surakarta (UMS) - Pabelan', category: 'campus', city: 'Sukoharjo', province: 'Jawa Tengah', lat: -7.558134, lng: 110.771682, aliases: ['ums solo', 'ums pabelan'] },
    { id: 'slt-uksw-salatiga', name: 'Universitas Kristen Satya Wacana (UKSW Salatiga)', category: 'campus', city: 'Salatiga', province: 'Jawa Tengah', lat: -7.319266, lng: 110.499494, aliases: ['uksw salatiga'] },
    { id: 'pwt-unsoed-grendeng', name: 'Universitas Jenderal Soedirman (UNSOED) - Purwokerto', category: 'campus', city: 'Banyumas', province: 'Jawa Tengah', lat: -7.404092, lng: 109.246316, aliases: ['unsoed purwokerto'] },
    { id: 'smg-ind-kik-kendal', name: 'Kawasan Industri Kendal (KIK Park by the Bay)', category: 'industrial', city: 'Kendal', province: 'Jawa Tengah', lat: -6.937275, lng: 110.245830, aliases: ['kik kendal', 'kawasan industri kendal'] },
    { id: 'smg-rsup-dr-kariadi', name: 'RSUP Dr. Kariadi Semarang', category: 'hospital', city: 'Semarang', province: 'Jawa Tengah', lat: -6.994212, lng: 110.407490, aliases: ['rs kariadi', 'rsup kariadi'] },
    { id: 'slo-rs-moewardi', name: 'RSUD Dr. Moewardi Surakarta (Solo)', category: 'hospital', city: 'Surakarta', province: 'Jawa Tengah', lat: -7.558705, lng: 110.841872, aliases: ['rs moewardi solo'] },
    { id: 'pwt-rs-margono', name: 'RSUD Prof. Dr. Margono Soekarjo Purwokerto', category: 'hospital', city: 'Banyumas', province: 'Jawa Tengah', lat: -7.437427, lng: 109.267379, aliases: ['rs margono purwokerto'] },
    { id: 'smg-mall-paragon', name: 'Pollux Mall Paragon Semarang', category: 'mall', city: 'Semarang', province: 'Jawa Tengah', lat: -6.979088, lng: 110.415942, aliases: ['paragon semarang'] },
    { id: 'slo-the-park-solo-baru', name: 'The Park Mall & Pakuwon Mall Solo Baru', category: 'mall', city: 'Sukoharjo', province: 'Jawa Tengah', lat: -7.598964, lng: 110.816217, aliases: ['the park solo', 'pakuwon solo baru'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 7. SUMATERA (ACEH, MEDAN, PALEMBANG, PADANG, PEKANBARU, LAMPUNG, BATAM, JAMBI, BENGKULU)
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'ach-usk-darussalam', name: 'Universitas Syiah Kuala (USK Banda Aceh)', category: 'campus', city: 'Banda Aceh', province: 'Aceh', lat: 5.570063, lng: 95.369728, aliases: ['usk banda aceh', 'syiah kuala'] },
    { id: 'ach-rsud-za', name: 'RSUD Dr. Zainoel Abidin Banda Aceh (RSUZA)', category: 'hospital', city: 'Banda Aceh', province: 'Aceh', lat: 5.564449, lng: 95.336993, aliases: ['rsuza banda aceh'] },
    { id: 'mdn-usu-padang-bulan', name: 'Universitas Sumatera Utara (USU) - Padang Bulan', category: 'campus', city: 'Medan', province: 'Sumatera Utara', lat: 3.561676, lng: 98.656342, aliases: ['usu medan'] },
    { id: 'mdn-unimed', name: 'Universitas Negeri Medan (UNIMED)', category: 'campus', city: 'Medan', province: 'Sumatera Utara', lat: 3.608151, lng: 98.716807, aliases: ['unimed'] },
    { id: 'mdn-unpri', name: 'Universitas Prima Indonesia (UNPRI Medan)', category: 'campus', city: 'Medan', province: 'Sumatera Utara', lat: 3.598839, lng: 98.652710, aliases: ['unpri medan'] },
    { id: 'mdn-sun-plaza', name: 'Sun Plaza Medan & Podomoro City Deli', category: 'mall', city: 'Medan', province: 'Sumatera Utara', lat: 3.582177, lng: 98.671701, aliases: ['sun plaza', 'deli park'] },
    { id: 'mdn-ind-kim', name: 'Kawasan Industri Medan (KIM 1-4 Mabar)', category: 'industrial', city: 'Medan', province: 'Sumatera Utara', lat: 3.664688, lng: 98.672253, aliases: ['kim medan', 'kawasan industri medan'] },
    { id: 'mdn-rsup-adam-malik', name: 'RSUP H. Adam Malik Medan', category: 'hospital', city: 'Medan', province: 'Sumatera Utara', lat: 3.518295, lng: 98.608378, aliases: ['rs adam malik'] },
    { id: 'plb-unsri-indralaya', name: 'Universitas Sriwijaya (UNSRI) - Kampus Indralaya', category: 'campus', city: 'Ogan Ilir', province: 'Sumatera Selatan', lat: -3.216935, lng: 104.648666, aliases: ['unsri indralaya'] },
    { id: 'plb-unsri-palembang', name: 'Universitas Sriwijaya (UNSRI) - Bukit Besar Palembang', category: 'campus', city: 'Palembang', province: 'Sumatera Selatan', lat: -2.984985, lng: 104.733371, aliases: ['unsri bukit'] },
    { id: 'plb-rsup-mohammad-hoesin', name: 'RSUP Dr. Mohammad Hoesin Palembang (RSMH)', category: 'hospital', city: 'Palembang', province: 'Sumatera Selatan', lat: -2.966407, lng: 104.750214, aliases: ['rsmh palembang'] },
    { id: 'pdg-unand-limau-manis', name: 'Universitas Andalas (UNAND) - Limau Manis Padang', category: 'campus', city: 'Padang', province: 'Sumatera Barat', lat: -0.915231, lng: 100.458106, aliases: ['unand limau manis'] },
    { id: 'pdg-unp-air-tawar', name: 'Universitas Negeri Padang (UNP Air Tawar)', category: 'campus', city: 'Padang', province: 'Sumatera Barat', lat: -0.896973, lng: 100.350236, aliases: ['unp padang'] },
    { id: 'pku-unri-panam', name: 'Universitas Riau (UNRI) - Kampus Bina Widya Panam', category: 'campus', city: 'Pekanbaru', province: 'Riau', lat: 0.476378, lng: 101.380646, aliases: ['unri panam'] },
    { id: 'pku-pcr-rumbai', name: 'Politeknik Caltex Riau (PCR Rumbai Pekanbaru)', category: 'campus', city: 'Pekanbaru', province: 'Riau', lat: 0.570975, lng: 101.426097, aliases: ['pcr pekanbaru'] },
    { id: 'pku-uir', name: 'Universitas Islam Riau (UIR Pekanbaru)', category: 'campus', city: 'Pekanbaru', province: 'Riau', lat: 0.447018, lng: 101.453947, aliases: ['uir pekanbaru'] },
    { id: 'lpg-unila-gedong-meneng', name: 'Universitas Lampung (UNILA) - Bandar Lampung', category: 'campus', city: 'Bandar Lampung', province: 'Lampung', lat: -5.364295, lng: 105.243047, aliases: ['unila'] },
    { id: 'lpg-itera', name: 'Institut Teknologi Sumatera (ITERA Lampung)', category: 'campus', city: 'Lampung Selatan', province: 'Lampung', lat: -5.360213, lng: 105.315003, aliases: ['itera'] },
    { id: 'btm-ind-batamindo', name: 'Kawasan Industri Batamindo Industrial Park (Mukakuning)', category: 'industrial', city: 'Batam', province: 'Kepulauan Riau', lat: 1.068224, lng: 104.025128, aliases: ['batamindo mukakuning'] },
    { id: 'btm-uib', name: 'Universitas Internasional Batam (UIB)', category: 'campus', city: 'Batam', province: 'Kepulauan Riau', lat: 1.119543, lng: 104.003043, aliases: ['uib batam'] },
    { id: 'jmb-unja-mendalo', name: 'Universitas Jambi (UNJA) - Kampus Utama Mendalo', category: 'campus', city: 'Muaro Jambi', province: 'Jambi', lat: -1.612342, lng: 103.518155, aliases: ['unja mendalo'] },
    { id: 'bkl-unib-kandang-limun', name: 'Universitas Bengkulu (UNIB) - Kandang Limun', category: 'campus', city: 'Bengkulu', province: 'Bengkulu', lat: -3.759520, lng: 102.272388, aliases: ['unib bengkulu'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 8. BALI, NUSA TENGGARA BARAT (LOMBOK), & NUSA TENGGARA TIMUR (KUPANG)
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'dps-unud-jimbaran', name: 'Universitas Udayana (UNUD) - Kampus Bukit Jimbaran', category: 'campus', city: 'Badung', province: 'Bali', lat: -8.673233, lng: 115.219101, aliases: ['unud jimbaran', 'rektorat unud'] },
    { id: 'dps-unud-sudirman', name: 'Universitas Udayana (UNUD) - Kampus Sudirman Denpasar', category: 'campus', city: 'Denpasar', province: 'Bali', lat: -8.673233, lng: 115.219101, aliases: ['unud sudirman'] },
    { id: 'dps-warmadewa', name: 'Universitas Warmadewa (Denpasar)', category: 'campus', city: 'Denpasar', province: 'Bali', lat: -8.659344, lng: 115.242598, aliases: ['warmadewa'] },
    { id: 'dps-pnb-jimbaran', name: 'Politeknik Negeri Bali (PNB Jimbaran)', category: 'campus', city: 'Badung', province: 'Bali', lat: -8.798698, lng: 115.162487, aliases: ['pnb bali', 'poltek bali'] },
    { id: 'dps-beachwalk-kuta', name: 'Beachwalk Shopping Center Kuta', category: 'mall', city: 'Badung', province: 'Bali', lat: -8.716948, lng: 115.168807, aliases: ['beachwalk kuta'] },
    { id: 'dps-living-world-bali', name: 'Living World Denpasar (Gatot Subroto)', category: 'mall', city: 'Denpasar', province: 'Bali', lat: -8.634148, lng: 115.232232, aliases: ['living world bali'] },
    { id: 'dps-rsup-prof-ngoerah', name: 'RSUP Prof. Ngoerah (Eks RSUP Sanglah Denpasar)', category: 'hospital', city: 'Denpasar', province: 'Bali', lat: -8.675631, lng: 115.211604, aliases: ['rs sanglah', 'rsup ngoerah'] },
    { id: 'dps-bandara-ngurah-rai', name: 'Bandara Internasional I Gusti Ngurah Rai (DPS)', category: 'transport', city: 'Badung', province: 'Bali', lat: -8.746993, lng: 115.168166, aliases: ['bandara ngurah rai'] },
    { id: 'lop-unram-mataram', name: 'Universitas Mataram (UNRAM Lombok)', category: 'campus', city: 'Mataram', province: 'Nusa Tenggara Barat', lat: -8.587233, lng: 116.092239, aliases: ['unram'] },
    { id: 'lop-epicentrum-mall', name: 'Lombok Epicentrum Mall (LEM Mataram)', category: 'mall', city: 'Mataram', province: 'Nusa Tenggara Barat', lat: -8.593796, lng: 116.104685, aliases: ['epicentrum lombok'] },
    { id: 'kpg-undana-penfui', name: 'Universitas Nusa Cendana (UNDANA Kupang)', category: 'campus', city: 'Kupang', province: 'Nusa Tenggara Timur', lat: -10.153211, lng: 123.658357, aliases: ['undana kupang'] },
    { id: 'kpg-lippo-plaza', name: 'Lippo Plaza Kupang (Fatubesi)', category: 'mall', city: 'Kupang', province: 'Nusa Tenggara Timur', lat: -10.158877, lng: 123.611219, aliases: ['lippo kupang'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 9. SULAWESI LAINNYA (PALU, KENDARI, GORONTALO, MANADO)
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'plu-untad-bumi-tadulako', name: 'Universitas Tadulako (UNTAD Palu - Tondo)', category: 'campus', city: 'Palu', province: 'Sulawesi Tengah', lat: -0.836432, lng: 119.893694, aliases: ['untad palu', 'tondo'] },
    { id: 'plu-rsud-undata', name: 'RSUD Undata Palu', category: 'hospital', city: 'Palu', province: 'Sulawesi Tengah', lat: -0.857844, lng: 119.884047, aliases: ['rs undata'] },
    { id: 'plu-grand-mall', name: 'Palu Grand Mall (PGM Cumi-Cumi)', category: 'mall', city: 'Palu', province: 'Sulawesi Tengah', lat: -0.882872, lng: 119.842721, aliases: ['palu grand mall'] },
    { id: 'kdi-uho-andounohu', name: 'Universitas Halu Oleo (UHO Kendari)', category: 'campus', city: 'Kendari', province: 'Sulawesi Tenggara', lat: -4.008496, lng: 122.520754, aliases: ['uho kendari', 'halu oleo'] },
    { id: 'kdi-the-park', name: 'The Park Kendari (Bonggoeya)', category: 'mall', city: 'Kendari', province: 'Sulawesi Tenggara', lat: -3.983929, lng: 122.519529, aliases: ['the park kendari'] },
    { id: 'kdi-rsud-bahteramas', name: 'RSUD Bahteramas Provinsi Sultra', category: 'hospital', city: 'Kendari', province: 'Sulawesi Tenggara', lat: -4.034887, lng: 122.491533, aliases: ['rs bahteramas'] },
    { id: 'gto-ung-dulomo', name: 'Universitas Negeri Gorontalo (UNG)', category: 'campus', city: 'Gorontalo', province: 'Gorontalo', lat: 0.556517, lng: 123.063683, aliases: ['ung gorontalo'] },
    { id: 'mdo-unsrat-manado', name: 'Universitas Sam Ratulangi (UNSRAT Manado)', category: 'campus', city: 'Manado', province: 'Sulawesi Utara', lat: 1.458335, lng: 124.828426, aliases: ['unsrat manado'] },
    { id: 'mdo-mantos', name: 'Manado Town Square (MANTOS 1, 2, 3)', category: 'mall', city: 'Manado', province: 'Sulawesi Utara', lat: 1.472176, lng: 124.831559, aliases: ['mantos manado'] },
    { id: 'mdo-rsup-kandou', name: 'RSUP Prof. Dr. R. D. Kandou Manado', category: 'hospital', city: 'Manado', province: 'Sulawesi Utara', lat: 1.453812, lng: 124.808181, aliases: ['rs kandou manado'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 10. KALIMANTAN (BALIKPAPAN, IKN, SAMARINDA, BANJARMASIN, PONTIANAK, TARAKAN) & MALUKU/PAPUA
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'bpn-itk-karang-joang', name: 'Institut Teknologi Kalimantan (ITK Balikpapan)', category: 'campus', city: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.149949, lng: 116.862184, aliases: ['itk balikpapan'] },
    { id: 'ikn-kipp-nusantara', name: 'KIPP Ibu Kota Nusantara (IKN Nusantara)', category: 'office', city: 'Penajam Paser Utara', province: 'Kalimantan Timur', lat: -0.973056, lng: 116.708611, aliases: ['ikn', 'titik nol ikn'] },
    { id: 'bpn-pentacity', name: 'Pentacity Shopping Venue & E-Walk Balikpapan', category: 'mall', city: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.274169, lng: 116.857030, aliases: ['pentacity', 'e walk balikpapan'] },
    { id: 'bpn-rs-kanujoso', name: 'RSUD Kanujoso Djatiwibowo Balikpapan', category: 'hospital', city: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.224643, lng: 116.868382, aliases: ['rs kanujoso'] },
    { id: 'smd-unmul-gunung-kelua', name: 'Universitas Mulawarman (UNMUL Samarinda)', category: 'campus', city: 'Samarinda', province: 'Kalimantan Timur', lat: -0.468459, lng: 117.153997, aliases: ['unmul'] },
    { id: 'smd-big-mall', name: 'Big Mall Samarinda (Jl. Untung Suropati)', category: 'mall', city: 'Samarinda', province: 'Kalimantan Timur', lat: -0.526274, lng: 117.115938, aliases: ['big mall samarinda'] },
    { id: 'bjm-ulm-banjarmasin', name: 'Universitas Lambung Mangkurat (ULM Banjarmasin & Banjarbaru)', category: 'campus', city: 'Banjarmasin', province: 'Kalimantan Selatan', lat: -3.297889, lng: 114.585213, aliases: ['ulm banjarmasin'] },
    { id: 'bjm-duta-mall', name: 'Duta Mall Banjarmasin', category: 'mall', city: 'Banjarmasin', province: 'Kalimantan Selatan', lat: -3.323020, lng: 114.603136, aliases: ['duta mall'] },
    { id: 'ptk-untan-pontianak', name: 'Universitas Tanjungpura (UNTAN Pontianak)', category: 'campus', city: 'Pontianak', province: 'Kalimantan Barat', lat: -0.060726, lng: 109.344947, aliases: ['untan pontianak'] },
    { id: 'trk-ubt-tarakan', name: 'Universitas Borneo Tarakan (UBT Kaltara)', category: 'campus', city: 'Tarakan', province: 'Kalimantan Utara', lat: 3.303487, lng: 117.649063, aliases: ['ubt tarakan'] },
    { id: 'amb-unpatti-ambon', name: 'Universitas Pattimura (UNPATTI Ambon)', category: 'campus', city: 'Ambon', province: 'Maluku', lat: -3.654619, lng: 128.195675, aliases: ['unpatti'] },
    { id: 'jay-uncen-jayapura', name: 'Universitas Cenderawasih (UNCEN Jayapura - Abepura & Waena)', category: 'campus', city: 'Jayapura', province: 'Papua', lat: -2.582292, lng: 140.655892, aliases: ['uncen jayapura'] }
];

/**
 * Menghitung jarak garis lurus geografis antara 2 titik koordinat (Haversine Formula) dalam KM
 */
export const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius bumi dalam KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return parseFloat(d.toFixed(1));
};

/**
 * Mencari anchor & landmark terkurasi di sekitar koordinat titik kost
 * Memprioritaskan:
 * - 🎓 Kampus terdekat (hingga 3 kampus dalam radius 7 KM)
 * - 🛍️ Mall terdekat (1 mall dalam radius 7 KM)
 * - 🏥 Rumah Sakit Besar terdekat (1 RS dalam radius 5 KM)
 * - 🏢 / 🏭 Kawasan Industri atau Perkantoran terdekat (1 lokasi dalam radius 7 KM)
 * - 🏖️ / 🚆 Ikon Wisata atau Hub Transportasi terdekat (1 lokasi dalam radius 7 KM)
 */
export const findNearbyCuratedLandmarks = (kostLat: number, kostLng: number, maxDistanceKm = 7.0): CuratedLandmarkResult[] => {
    if (!kostLat || !kostLng) return [];

    // Hitung jarak ke seluruh curated landmarks
    const landmarksWithDistance = CURATED_LANDMARKS.map(item => {
        const kmVal = calculateHaversineDistance(kostLat, kostLng, item.lat, item.lng);
        return {
            ...item,
            kmVal
        };
    }).filter(item => item.kmVal <= maxDistanceKm);

    // Kelompokkan berdasarkan kategori
    const campuses = landmarksWithDistance.filter(i => i.category === 'campus').sort((a, b) => a.kmVal - b.kmVal).slice(0, 3);
    const malls = landmarksWithDistance.filter(i => i.category === 'mall').sort((a, b) => a.kmVal - b.kmVal).slice(0, 1);
    const hospitals = landmarksWithDistance.filter(i => i.category === 'hospital').sort((a, b) => a.kmVal - b.kmVal).slice(0, 1);
    const industriesOrOffices = landmarksWithDistance.filter(i => i.category === 'industrial' || i.category === 'office').sort((a, b) => a.kmVal - b.kmVal).slice(0, 1);
    const tourismOrTransport = landmarksWithDistance.filter(i => i.category === 'tourism' || i.category === 'transport').sort((a, b) => a.kmVal - b.kmVal).slice(0, 1);

    // Gabungkan hasil terkurasi
    const mergedList = [...campuses, ...malls, ...hospitals, ...industriesOrOffices, ...tourismOrTransport];

    // Format menjadi entitas yang siap ditampilkan pada form properti
    return mergedList.map(item => {
        return {
            name: item.name,
            lat: item.lat,
            lng: item.lng,
            distance: `± ${item.kmVal} KM`,
            kmVal: item.kmVal,
            category: item.category,
            transportMode: item.kmVal <= 1.0 ? 'walk' : 'motorcycle',
            isCuratedMaster: true
        };
    });
};
