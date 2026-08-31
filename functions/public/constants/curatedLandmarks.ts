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
    { id: 'mks-unhas-tamalanrea', name: 'Universitas Hasanuddin (UNHAS) - Tamalanrea', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.138722, lng: 119.489115, aliases: ['unhas', 'pintu 1 unhas', 'rektorat unhas'] },
    { id: 'mks-unhas-gowa', name: 'Universitas Hasanuddin (UNHAS) - Kampus Teknik Gowa', category: 'campus', city: 'Gowa', province: 'Sulawesi Selatan', lat: -5.230784, lng: 119.502914, aliases: ['unhas gowa', 'fakultas teknik unhas'] },
    { id: 'mks-uim', name: 'Universitas Islam Makassar (UIM)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.140800, lng: 119.482700, aliases: ['uim', 'universitas islam makassar'] },
    { id: 'mks-pnup', name: 'Politeknik Negeri Ujung Pandang (PNUP)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.138650, lng: 119.496500, aliases: ['pnup', 'poltek unhas', 'politeknik negeri ujung pandang'] },
    { id: 'mks-umi', name: 'Universitas Muslim Indonesia (UMI)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.138200, lng: 119.447500, aliases: ['umi', 'umi urip', 'universitas muslim indonesia'] },
    { id: 'mks-unm-gunungsari', name: 'Universitas Negeri Makassar (UNM) - Gunungsari', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.168520, lng: 119.436540, aliases: ['unm', 'unm phinisi', 'menara phinisi unm'] },
    { id: 'mks-unm-parangtambung', name: 'Universitas Negeri Makassar (UNM) - Parangtambung', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.179800, lng: 119.428500, aliases: ['unm parangtambung', 'mipa unm'] },
    { id: 'mks-unm-banta-bantaeng', name: 'Universitas Negeri Makassar (UNM) - Banta-Bantaeng', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.163700, lng: 119.431200, aliases: ['fik unm'] },
    { id: 'mks-uin-samata', name: 'UIN Alauddin Makassar - Kampus 2 Samata', category: 'campus', city: 'Gowa', province: 'Sulawesi Selatan', lat: -5.203600, lng: 119.497100, aliases: ['uin samata', 'uin alauddin'] },
    { id: 'mks-uin-alauddin', name: 'UIN Alauddin Makassar - Kampus 1 Sultan Alauddin', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.176400, lng: 119.435700, aliases: ['uin kampus 1'] },
    { id: 'mks-unismuh', name: 'Universitas Muhammadiyah Makassar (UNISMUH)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.175500, lng: 119.437300, aliases: ['unismuh', 'unismuh tala salapang'] },
    { id: 'mks-poltekkes', name: 'Poltekkes Kemenkes Makassar (Banta-Bantaeng)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.167800, lng: 119.434200, aliases: ['poltekkes makassar'] },
    { id: 'mks-poltek-ati', name: 'Politeknik ATI Makassar', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.127800, lng: 119.429500, aliases: ['ati makassar', 'poltek ati'] },
    { id: 'mks-polimarim', name: 'Politeknik Maritim AMI Makassar (POLIMARIM)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.143500, lng: 119.445500, aliases: ['polimarim', 'ami makassar'] },
    { id: 'mks-atmajaya', name: 'Universitas Atma Jaya Makassar', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.169939, lng: 119.403211, aliases: ['atma jaya makassar'] },
    { id: 'mks-bosowa', name: 'Universitas Bosowa (UNIBOS)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.138724, lng: 119.443643, aliases: ['unibos', 'universitas 45'] },
    { id: 'mks-unifa', name: 'Universitas Fajar (UNIFA)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.149353, lng: 119.450011, aliases: ['unifa'] },
    { id: 'mks-stie-nobel', name: 'Institut Bisnis dan Keuangan Nobel Indonesia', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.170200, lng: 119.439200, aliases: ['stie nobel'] },
    { id: 'mks-stimik-handayani', name: 'Universitas Handayani Makassar', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.144800, lng: 119.456200, aliases: ['stimik handayani'] },
    { id: 'mks-stikes-megarezky', name: 'Universitas Mega Rezky Makassar', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.162332, lng: 119.477328, aliases: ['unimerz', 'stikes mega rezky'] },
    { id: 'mks-ciputra', name: 'Universitas Ciputra Makassar (CPI)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.149216, lng: 119.394935, aliases: ['uc makassar', 'ciputra cpi'] },
    { id: 'mks-poltekpar', name: 'Politeknik Pariwisata Makassar (Poltekpar)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.181820, lng: 119.409580, aliases: ['poltekpar makassar', 'akpar'] },
    { id: 'pre-ith-parepare', name: 'Institut Teknologi Bacharuddin Jusuf Habibie (ITH Parepare)', category: 'campus', city: 'Parepare', province: 'Sulawesi Selatan', lat: -4.015500, lng: 119.628500, aliases: ['ith parepare'] },
    // Mall & Ritel
    { id: 'mks-mall-panakkukang', name: 'Mall Panakkukang (MP)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.157094, lng: 119.446393, aliases: ['mp', 'panakkukang mall'] },
    { id: 'mks-nipah-park', name: 'Nipah Park Makassar', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.139000, lng: 119.443000, aliases: ['nipah mall', 'mall nipah'] },
    { id: 'mks-trans-studio', name: 'Trans Studio Mall Makassar (TSM)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.153500, lng: 119.397500, aliases: ['tsm makassar', 'trans studio'] },
    { id: 'mks-pipo', name: 'Phinisi Point Mall (PiPo)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.152387, lng: 119.403947, aliases: ['pipo mall', 'mall pipo'] },
    { id: 'mks-mtos', name: 'Makassar Town Square (MToS)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.141500, lng: 119.475500, aliases: ['mtos'] },
    { id: 'mks-mall-ratu-indah', name: 'Mall Ratu Indah (MaRI)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.153285, lng: 119.417308, aliases: ['mari', 'ratu indah'] },
    { id: 'mks-living-plaza-pettarani', name: 'Living Plaza Pettarani', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.163453, lng: 119.436096, aliases: ['living plaza', 'ace pettarani'] },
    // Kawasan Industri & Bisnis
    { id: 'mks-kima', name: 'Kawasan Industri Makassar (KIMA Daya)', category: 'industrial', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.101645, lng: 119.505443, aliases: ['pt kima', 'kima makassar'] },
    { id: 'mks-pergudangan-parangloe', name: 'Kawasan Pergudangan Parangloe Indah', category: 'industrial', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.100695, lng: 119.480635, aliases: ['parangloe', 'pergudangan parangloe'] },
    { id: 'mks-cbd-panakkukang', name: 'Kawasan Bisnis Boulevard & Pengayoman', category: 'office', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.154200, lng: 119.444500, aliases: ['boulevard panakkukang', 'pengayoman'] },
    { id: 'mks-cbd-pettarani', name: 'Kawasan Perkantoran Jl. A.P. Pettarani', category: 'office', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.152400, lng: 119.435800, aliases: ['perkantoran pettarani', 'ap pettarani'] },
    { id: 'mks-cbd-cpi', name: 'Kawasan Bisnis Center Point of Indonesia (CPI)', category: 'office', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.148500, lng: 119.398500, aliases: ['cpi makassar', 'citraland cpi'] },
    // Rumah Sakit Besar
    { id: 'mks-rsup-wahidin', name: 'RSUP Dr. Wahidin Sudirohusodo', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.134500, lng: 119.496500, aliases: ['rs wahidin', 'rsup wahidin'] },
    { id: 'mks-rs-unhas', name: 'Rumah Sakit Universitas Hasanuddin (RS UNHAS)', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.134000, lng: 119.493500, aliases: ['rs unhas', 'rs pendidikan unhas'] },
    { id: 'mks-rs-siloam', name: 'Siloam Hospitals Makassar (Metro Tanjung Bunga)', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.150044, lng: 119.407091, aliases: ['rs siloam makassar', 'siloam tanjung bunga'] },
    { id: 'mks-rs-primaya', name: 'Primaya Hospital Makassar (Eks Awal Bros)', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.134806, lng: 119.43512, aliases: ['rs awal bros', 'rs primaya'] },
    { id: 'mks-rs-primaya-hertasning', name: 'Primaya Hospital Hertasning', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.168500, lng: 119.458500, aliases: ['primaya hertasning'] },
    { id: 'mks-rs-hermina', name: 'RS Hermina Makassar (Toddopuli)', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.162782, lng: 119.457624, aliases: ['hermina makassar'] },
    { id: 'mks-rs-labuang-baji', name: 'RSUD Labuang Baji Makassar', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.161800, lng: 119.421500, aliases: ['rs labuang baji'] },
    { id: 'mks-rs-daya', name: 'RSUD Daya Kota Makassar', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.113906, lng: 119.511138, aliases: ['rs daya', 'rsud daya'] },
    { id: 'mks-rs-ibnu-sina', name: 'Rumah Sakit Ibnu Sina YBW UMI', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.137800, lng: 119.449500, aliases: ['rs ibnu sina'] },
    { id: 'mks-rs-bhayangkara', name: 'RS Bhayangkara Makassar', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.17469, lng: 119.416078, aliases: ['rs bhayangkara mks'] },
    { id: 'mks-rs-stella-maris', name: 'RS Stella Maris Makassar', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.148500, lng: 119.408200, aliases: ['stella maris'] },
    // Wisata & Ikon Kota
    { id: 'mks-pantai-losari', name: 'Kawasan Wisata Pantai Losari', category: 'tourism', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.144800, lng: 119.407200, aliases: ['pantai losari', 'losari'] },
    { id: 'mks-fort-rotterdam', name: 'Benteng Fort Rotterdam', category: 'tourism', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.133800, lng: 119.405800, aliases: ['fort rotterdam', 'benteng ujung pandang'] },
    { id: 'mks-masjid-99-kubah', name: 'Masjid 99 Kubah CPI Makassar', category: 'tourism', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.145820, lng: 119.400580, aliases: ['masjid 99 kubah', 'masjid cpi', 'masjid kubah 99 asmaul husna'] },
    // Hub Transportasi
    { id: 'mks-bandara-hasanuddin', name: 'Bandara Internasional Sultan Hasanuddin', category: 'transport', city: 'Maros', province: 'Sulawesi Selatan', lat: -5.076665, lng: 119.552242, aliases: ['bandara hasanuddin', 'bandara shiam'] },
    { id: 'mks-pelabuhan-soetta', name: 'Pelabuhan Soekarno-Hatta Makassar', category: 'transport', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.122400, lng: 119.408500, aliases: ['pelabuhan makassar', 'pelabuhan soetta'] },
    { id: 'mks-terminal-daya', name: 'Terminal Regional Daya (Makassar)', category: 'transport', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.110224, lng: 119.508035, aliases: ['terminal daya'] },
    { id: 'mks-terminal-mallengkeri', name: 'Terminal Mallengkeri Makassar', category: 'transport', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.187551, lng: 119.439664, aliases: ['terminal mallengkeri'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 2. JABODETABEK & BANTEN (JAKARTA, TANGERANG, DEPOK, BOGOR, BEKASI)
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus & Kedinasan
    { id: 'tng-pkn-stan-bintaro', name: 'Politeknik Keuangan Negara STAN (PKN STAN Bintaro)', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.266532, lng: 106.732398, aliases: ['stan', 'pkn stan', 'stan bintaro'] },
    { id: 'jkt-ui-depok', name: 'Universitas Indonesia (UI) - Kampus Depok', category: 'campus', city: 'Depok', province: 'Jawa Barat', lat: -6.365361, lng: 106.831556, aliases: ['ui depok', 'rektorat ui'] },
    { id: 'jkt-ui-salemba', name: 'Universitas Indonesia (UI) - Kampus Salemba', category: 'campus', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.195200, lng: 106.848800, aliases: ['ui salemba', 'fk ui'] },
    { id: 'jkt-pnj-depok', name: 'Politeknik Negeri Jakarta (PNJ Depok)', category: 'campus', city: 'Depok', province: 'Jawa Barat', lat: -6.371835, lng: 106.824563, aliases: ['pnj depok', 'poltek ui'] },
    { id: 'jkt-unpam-puspitek', name: 'Universitas Pamulang (UNPAM) - Kampus Viktor/Puspitek', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.346500, lng: 106.691500, aliases: ['unpam viktor', 'unpam'] },
    { id: 'jkt-unpam-pusat', name: 'Universitas Pamulang (UNPAM) - Kampus 1 Pusat', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.344500, lng: 106.738500, aliases: ['unpam pusat', 'unpam reni jaya'] },
    { id: 'jkt-uin-ciputat', name: 'UIN Syarif Hidayatullah Jakarta (Ciputat)', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.307500, lng: 106.757500, aliases: ['uin jakarta', 'uin ciputat'] },
    { id: 'jkt-uph-karawaci', name: 'Universitas Pelita Harapan (UPH Lippo Karawaci)', category: 'campus', city: 'Tangerang', province: 'Banten', lat: -6.228961, lng: 106.611922, aliases: ['uph karawaci', 'uph'] },
    { id: 'jkt-ipb-dramaga', name: 'IPB University - Kampus IPB Dramaga', category: 'campus', city: 'Bogor', province: 'Jawa Barat', lat: -6.559800, lng: 106.726500, aliases: ['ipb dramaga', 'ipb bogor'] },
    { id: 'jkt-ipb-baranangsiang', name: 'IPB University - Kampus Baranangsiang', category: 'campus', city: 'Bogor', province: 'Jawa Barat', lat: -6.601200, lng: 106.808500, aliases: ['ipb baranangsiang'] },
    { id: 'jkt-binus-kemanggisan', name: 'BINUS University - Kampus Anggrek/Syahdan', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.201800, lng: 106.782500, aliases: ['binus kemanggisan', 'binus anggrek'] },
    { id: 'jkt-binus-alsut', name: 'BINUS University - Alam Sutera', category: 'campus', city: 'Tangerang', province: 'Banten', lat: -6.223628, lng: 106.64922, aliases: ['binus alsut'] },
    { id: 'jkt-trisakti-grogol', name: 'Universitas Trisakti - Kampus A Grogol', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.167845, lng: 106.790257, aliases: ['trisakti', 'univ trisakti'] },
    { id: 'jkt-untar-grogol', name: 'Universitas Tarumanagara (UNTAR)', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.168867, lng: 106.790254, aliases: ['untar'] },
    { id: 'jkt-unj-rawamangun', name: 'Universitas Negeri Jakarta (UNJ) - Rawamangun', category: 'campus', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.194784, lng: 106.87819, aliases: ['unj rawamangun'] },
    { id: 'jkt-atmajaya-semanggi', name: 'Unika Atma Jaya Jakarta - Semanggi', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.219800, lng: 106.816500, aliases: ['atma jaya semanggi'] },
    { id: 'jkt-atmajaya-pluit', name: 'Unika Atma Jaya Jakarta - Kampus Pluit (Kedokteran)', category: 'campus', city: 'Jakarta Utara', province: 'DKI Jakarta', lat: -6.126500, lng: 106.790500, aliases: ['fk atma jaya pluit'] },
    { id: 'jkt-upn-pondoklabu', name: 'UPN Veteran Jakarta - Pondok Labu', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.315600, lng: 106.797200, aliases: ['upnvj', 'upn jakarta'] },
    { id: 'jkt-umn-gading-serpong', name: 'Universitas Multimedia Nusantara (UMN)', category: 'campus', city: 'Tangerang', province: 'Banten', lat: -6.257742, lng: 106.618159, aliases: ['umn gading serpong'] },
    { id: 'jkt-prasmul-bsd', name: 'Universitas Prasetiya Mulya - BSD Campus', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.303200, lng: 106.638500, aliases: ['prasmul bsd'] },
    { id: 'jkt-gunadarma-depok', name: 'Universitas Gunadarma - Kampus D Margonda', category: 'campus', city: 'Depok', province: 'Jawa Barat', lat: -6.368494, lng: 106.833152, aliases: ['gunadarma margonda', 'gundar d'] },
    { id: 'jkt-pancasila-lentengagung', name: 'Universitas Pancasila - Srengseng Sawah', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.339729, lng: 106.833198, aliases: ['univ pancasila'] },
    { id: 'jkt-mercubuana-meruya', name: 'Universitas Mercu Buana - Meruya', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.209693, lng: 106.739003, aliases: ['mercu buana meruya'] },
    { id: 'jkt-esaunggul-kebonjeruk', name: 'Universitas Esa Unggul - Kebon Jeruk', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.185685, lng: 106.778909, aliases: ['esa unggul'] },
    { id: 'jkt-budiluhur-petukangan', name: 'Universitas Budi Luhur - Petukangan', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.234587, lng: 106.747452, aliases: ['budi luhur'] },
    { id: 'jkt-lspr-sudirman', name: 'LSPR Institute of Communication & Business', category: 'campus', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.209500, lng: 106.819500, aliases: ['lspr sudirman park'] },
    { id: 'jkt-uki-cawang', name: 'Universitas Kristen Indonesia (UKI Cawang)', category: 'campus', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.248945, lng: 106.87229, aliases: ['uki cawang'] },
    { id: 'jkt-pertamina-simprug', name: 'Universitas Pertamina (Simprug)', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.228547, lng: 106.788985, aliases: ['univ pertamina'] },
    { id: 'jkt-alazhar-kebayoran', name: 'Universitas Al-Azhar Indonesia (UAI Kebayoran Baru)', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.235500, lng: 106.798500, aliases: ['uai kebayoran'] },
    { id: 'jkt-unpak-bogor', name: 'Universitas Pakuan (UNPAK Bogor)', category: 'campus', city: 'Bogor', province: 'Jawa Barat', lat: -6.599494, lng: 106.811712, aliases: ['unpak bogor'] },
    // Mall & Ritel
    { id: 'jkt-grand-indonesia', name: 'Grand Indonesia & Plaza Indonesia', category: 'mall', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.195200, lng: 106.821500, aliases: ['gi', 'grand indonesia'] },
    { id: 'jkt-senayan-city', name: 'Senayan City & Plaza Senayan', category: 'mall', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.227200, lng: 106.797500, aliases: ['senci', 'senayan city'] },
    { id: 'jkt-central-park', name: 'Central Park Mall & Mall Taman Anggrek', category: 'mall', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.177500, lng: 106.790500, aliases: ['central park', 'taman anggrek', 'neo soho'] },
    { id: 'jkt-gandaria-city', name: 'Gandaria City Mall (Gancit)', category: 'mall', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.244276, lng: 106.783486, aliases: ['gancit', 'gandaria city'] },
    { id: 'jkt-pondok-indah-mall', name: 'Pondok Indah Mall (PIM 1, 2, 3)', category: 'mall', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.265328, lng: 106.784657, aliases: ['pim', 'pondok indah mall'] },
    { id: 'jkt-kota-kasablanka', name: 'Kota Kasablanka (Kokas)', category: 'mall', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.223141, lng: 106.843467, aliases: ['kokas', 'kota kasablanka'] },
    { id: 'jkt-kelapa-gading', name: 'Mall Kelapa Gading (MKG 1-5)', category: 'mall', city: 'Jakarta Utara', province: 'DKI Jakarta', lat: -6.157399, lng: 106.908366, aliases: ['mkg', 'mall kelapa gading'] },
    { id: 'jkt-aeon-bsd', name: 'AEON Mall BSD City', category: 'mall', city: 'Tangerang Selatan', province: 'Banten', lat: -6.303500, lng: 106.643500, aliases: ['aeon bsd'] },
    { id: 'jkt-aeon-tanjung-barat', name: 'AEON Mall Tanjung Barat', category: 'mall', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.30615, lng: 106.840383, aliases: ['aeon tanjung barat'] },
    { id: 'jkt-summarecon-serpong', name: 'Summarecon Mall Serpong (SMS)', category: 'mall', city: 'Tangerang', province: 'Banten', lat: -6.240672, lng: 106.628575, aliases: ['sms', 'summarecon serpong'] },
    { id: 'jkt-bxc-bintaro', name: 'Bintaro Jaya Xchange Mall (BXc)', category: 'mall', city: 'Tangerang Selatan', province: 'Banten', lat: -6.284500, lng: 106.728500, aliases: ['bxc', 'bintaro xchange'] },
    { id: 'jkt-summarecon-bekasi', name: 'Summarecon Mall Bekasi (SMB)', category: 'mall', city: 'Bekasi', province: 'Jawa Barat', lat: -6.226011, lng: 107.001061, aliases: ['smb', 'summarecon bekasi'] },
    { id: 'jkt-margo-city', name: 'Margo City Mall Depok', category: 'mall', city: 'Depok', province: 'Jawa Barat', lat: -6.372886, lng: 106.835099, aliases: ['margo city', 'margocity'] },
    // Kawasan Bisnis & Perkantoran (CBD)
    { id: 'jkt-cbd-scbd', name: 'Kawasan Bisnis SCBD Sudirman', category: 'office', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.226500, lng: 106.809500, aliases: ['scbd', 'sudirman cbd', 'pacific place'] },
    { id: 'jkt-cbd-kuningan', name: 'Kawasan Rasuna Said / Kuningan CBD', category: 'office', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.222500, lng: 106.831500, aliases: ['kuningan cbd', 'rasuna said'] },
    { id: 'jkt-cbd-mega-kuningan', name: 'Kawasan Mega Kuningan', category: 'office', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.228500, lng: 106.826500, aliases: ['mega kuningan', 'world capital tower'] },
    { id: 'jkt-cbd-tb-simatupang', name: 'Koridor Bisnis TB Simatupang', category: 'office', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.297500, lng: 106.825500, aliases: ['tb simatupang', 'simatupang office'] },
    { id: 'jkt-cbd-bsd-green-office', name: 'BSD Green Office Park & Digital Hub', category: 'office', city: 'Tangerang Selatan', province: 'Banten', lat: -6.302500, lng: 106.650500, aliases: ['gop bsd', 'bsd green office'] },
    // Kawasan Industri
    { id: 'jkt-ind-jababeka', name: 'Kawasan Industri Jababeka Cikarang', category: 'industrial', city: 'Bekasi', province: 'Jawa Barat', lat: -6.28556, lng: 107.1887, aliases: ['jababeka 1', 'jababeka 2', 'kawasan jababeka'] },
    { id: 'jkt-ind-mm2100', name: 'Kawasan Industri MM2100 Cibitung', category: 'industrial', city: 'Bekasi', province: 'Jawa Barat', lat: -6.298500, lng: 107.098500, aliases: ['mm2100', 'kawasan mm2100'] },
    { id: 'jkt-ind-kiic-karawang', name: 'Kawasan Industri KIIC Karawang', category: 'industrial', city: 'Karawang', province: 'Jawa Barat', lat: -6.358500, lng: 107.285500, aliases: ['kiic', 'karawang international industrial city'] },
    { id: 'jkt-ind-surya-cipta', name: 'Kawasan Industri Surya Cipta Karawang', category: 'industrial', city: 'Karawang', province: 'Jawa Barat', lat: -6.389500, lng: 107.332500, aliases: ['surya cipta karawang'] },
    { id: 'jkt-ind-giic-deltamas', name: 'Kawasan Industri GIIC Deltamas (Pusat EV Hyundai/Wuling)', category: 'industrial', city: 'Bekasi', province: 'Jawa Barat', lat: -6.375500, lng: 107.185500, aliases: ['giic deltamas', 'kota deltamas'] },
    { id: 'jkt-ind-ejip', name: 'Kawasan Industri EJIP Cikarang Selatan', category: 'industrial', city: 'Bekasi', province: 'Jawa Barat', lat: -6.326500, lng: 107.121500, aliases: ['ejip cikarang'] },
    { id: 'jkt-ind-pulogadung', name: 'Kawasan Industri Pulogadung (JIEP)', category: 'industrial', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.20622, lng: 106.915539, aliases: ['jiep pulogadung', 'kawasan industri pulogadung'] },
    { id: 'jkt-ind-manis-tangerang', name: 'Kawasan Industri Manis & Jatake Tangerang', category: 'industrial', city: 'Tangerang', province: 'Banten', lat: -6.212500, lng: 106.575500, aliases: ['industri manis', 'jatake tangerang'] },
    // Rumah Sakit Besar
    { id: 'jkt-rsup-rscm', name: 'RSUP Nasional Dr. Cipto Mangunkusumo (RSCM)', category: 'hospital', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.197500, lng: 106.847500, aliases: ['rscm', 'rscm kencana'] },
    { id: 'jkt-rs-fatmawati', name: 'RSUP Fatmawati Jakarta Selatan', category: 'hospital', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.295056, lng: 106.796453, aliases: ['rs fatmawati'] },
    { id: 'jkt-rs-harapan-kita', name: 'RS Jantung & Anak Harapan Kita (Slipi)', category: 'hospital', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.185500, lng: 106.798500, aliases: ['rs harapan kita', 'rsab harapan kita'] },
    { id: 'jkt-rspad-gatot-soebroto', name: 'RSPAD Gatot Soebroto (Senen)', category: 'hospital', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.176729, lng: 106.836878, aliases: ['rspad', 'gatot soebroto'] },
    { id: 'jkt-rs-pon-cawang', name: 'RS Pusat Otak Nasional (RS PON Cawang)', category: 'hospital', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.246500, lng: 106.868500, aliases: ['rs pon', 'pusat otak nasional'] },
    { id: 'jkt-rs-persahabatan', name: 'RSUP Persahabatan Rawamangun', category: 'hospital', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.202500, lng: 106.885500, aliases: ['rs persahabatan'] },
    { id: 'jkt-rs-siloam-karawaci', name: 'Siloam Hospitals Lippo Village Karawaci', category: 'hospital', city: 'Tangerang', province: 'Banten', lat: -6.227500, lng: 106.609500, aliases: ['siloam karawaci'] },
    { id: 'jkt-rs-mayapada-lebakbulus', name: 'Mayapada Hospital Jakarta Selatan / Tangerang', category: 'hospital', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.298500, lng: 106.785500, aliases: ['mayapada lebak bulus'] },
    { id: 'jkt-rs-pondok-indah', name: 'RS Pondok Indah (RSPI Puri / Pondok Indah)', category: 'hospital', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.283841, lng: 106.781593, aliases: ['rspi pondok indah'] },
    { id: 'jkt-rs-ui-depok', name: 'Rumah Sakit Universitas Indonesia (RSUI Depok)', category: 'hospital', city: 'Depok', province: 'Jawa Barat', lat: -6.373343, lng: 106.829609, aliases: ['rsui depok', 'rs ui'] },
    // Hub Transportasi
    { id: 'jkt-bandara-soetta', name: 'Bandara Internasional Soekarno-Hatta (CGK)', category: 'transport', city: 'Tangerang', province: 'Banten', lat: -6.12387, lng: 106.642904, aliases: ['bandara soetta', 'terminal 3 soetta'] },
    { id: 'jkt-bandara-halim', name: 'Bandara Halim Perdanakusuma (HLP)', category: 'transport', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.263021, lng: 106.898951, aliases: ['bandara halim'] },
    { id: 'jkt-stasiun-whoosh-halim', name: 'Stasiun Kereta Cepat Whoosh Halim', category: 'transport', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.251500, lng: 106.886500, aliases: ['whoosh halim', 'kcic halim'] },
    { id: 'jkt-stasiun-gambir', name: 'Stasiun Kereta Api Gambir', category: 'transport', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.176500, lng: 106.830500, aliases: ['stasiun gambir'] },
    { id: 'jkt-stasiun-pasar-senen', name: 'Stasiun Kereta Api Pasar Senen', category: 'transport', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.174500, lng: 106.844500, aliases: ['stasiun senen'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 3. BANDUNG RAYA, CIMAHI, & JATINANGOR (JAWA BARAT)
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus & Kedinasan
    { id: 'bdg-ipdn-jatinangor', name: 'Institut Pemerintahan Dalam Negeri (IPDN Jatinangor)', category: 'campus', city: 'Sumedang', province: 'Jawa Barat', lat: -6.930304, lng: 107.763235, aliases: ['ipdn', 'ipdn jatinangor'] },
    { id: 'bdg-poltekpar-nhi', name: 'Politeknik Pariwisata NHI Bandung (Enhaii Setiabudi)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.97502, lng: 107.623531, aliases: ['enhaii', 'stpb enhaii', 'poltekpar nhi'] },
    { id: 'bdg-itb-ganesha', name: 'Institut Teknologi Bandung (ITB) - Kampus Ganesha', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.891500, lng: 107.610500, aliases: ['itb', 'itb ganesha'] },
    { id: 'bdg-itb-jatinangor', name: 'Institut Teknologi Bandung (ITB) - Kampus Jatinangor', category: 'campus', city: 'Sumedang', province: 'Jawa Barat', lat: -6.929500, lng: 107.771500, aliases: ['itb jatinangor'] },
    { id: 'bdg-unpad-dipatiukur', name: 'Universitas Padjadjaran (UNPAD) - Dipatiukur', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.892500, lng: 107.617500, aliases: ['unpad du', 'unpad dipatiukur'] },
    { id: 'bdg-unpad-jatinangor', name: 'Universitas Padjadjaran (UNPAD) - Jatinangor', category: 'campus', city: 'Sumedang', province: 'Jawa Barat', lat: -6.924214, lng: 107.774907, aliases: ['unpad jatinangor', 'rektorat unpad'] },
    { id: 'bdg-upi-setiabudi', name: 'Universitas Pendidikan Indonesia (UPI) - Setiabudi', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.864317, lng: 107.593862, aliases: ['upi setiabudi', 'upi bandung'] },
    { id: 'bdg-telkom-university', name: 'Telkom University (Tel-U Dayeuhkolot)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.973208, lng: 107.630854, aliases: ['telkom university', 'tel u'] },
    { id: 'bdg-unpar-ciumbuleuit', name: 'Universitas Katolik Parahyangan (UNPAR)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.911666, lng: 107.610871, aliases: ['unpar ciumbuleuit'] },
    { id: 'bdg-unpas-tamansari', name: 'Universitas Pasundan (UNPAS) - Tamansari & Setiabudi', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.899500, lng: 107.607500, aliases: ['unpas tamansari', 'unpas'] },
    { id: 'bdg-unisba-tamansari', name: 'Universitas Islam Bandung (UNISBA)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.903459, lng: 107.607872, aliases: ['unisba tamansari'] },
    { id: 'bdg-maranatha-suriasumantri', name: 'Universitas Kristen Maranatha', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.886669, lng: 107.580675, aliases: ['maranatha'] },
    { id: 'bdg-widyatama-cikutra', name: 'Universitas Widyatama (Cikutra)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.897932, lng: 107.644822, aliases: ['widyatama'] },
    { id: 'bdg-itenas-pku', name: 'Institut Teknologi Nasional (ITENAS Bandung)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.898599, lng: 107.639616, aliases: ['itenas'] },
    { id: 'bdg-polban-sarijadi', name: 'Politeknik Negeri Bandung (POLBAN)', category: 'campus', city: 'Bandung Barat', province: 'Jawa Barat', lat: -6.871214, lng: 107.572917, aliases: ['polban'] },
    // Mall, Bisnis & RS
    { id: 'bdg-paris-van-java', name: 'Paris Van Java Resort Mall (PVJ)', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.889500, lng: 107.596500, aliases: ['pvj bandung'] },
    { id: 'bdg-23-paskal', name: '23 Paskal Shopping Center', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.915388, lng: 107.594302, aliases: ['23 paskal'] },
    { id: 'bdg-ciwalk', name: 'Cihampelas Walk (Ciwalk)', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.89382, lng: 107.605566, aliases: ['ciwalk'] },
    { id: 'bdg-trans-studio', name: 'Trans Studio Mall Bandung (TSM)', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.925641, lng: 107.636747, aliases: ['tsm bandung'] },
    { id: 'bdg-summarecon-mall-bandung', name: 'Summarecon Mall Bandung (Gedebage)', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.955087, lng: 107.698014, aliases: ['summarecon bandung'] },
    { id: 'bdg-cbd-asia-afrika', name: 'Kawasan Perkantoran Jl. Asia Afrika / Braga', category: 'office', city: 'Bandung', province: 'Jawa Barat', lat: -6.921500, lng: 107.607500, aliases: ['asia afrika', 'braga bandung'] },
    { id: 'bdg-rsup-hasan-sadikin', name: 'RSUP Dr. Hasan Sadikin Bandung (RSHS)', category: 'hospital', city: 'Bandung', province: 'Jawa Barat', lat: -6.896500, lng: 107.598500, aliases: ['rshs', 'hasan sadikin'] },
    { id: 'bdg-rs-borromeus', name: 'RS Santo Borromeus Bandung (Dago)', category: 'hospital', city: 'Bandung', province: 'Jawa Barat', lat: -6.955469, lng: 107.701573, aliases: ['borromeus dago'] },
    { id: 'bdg-rs-immanuel', name: 'RS Immanuel Bandung (Kopo)', category: 'hospital', city: 'Bandung', province: 'Jawa Barat', lat: -6.938500, lng: 107.593500, aliases: ['rs immanuel'] },
    { id: 'bdg-stasiun-bandung', name: 'Stasiun Kereta Api Bandung (Hall & Kiaracondong)', category: 'transport', city: 'Bandung', province: 'Jawa Barat', lat: -6.914666, lng: 107.60413, aliases: ['stasiun bandung'] },
    { id: 'bdg-stasiun-whoosh-padalarang', name: 'Stasiun Whoosh Kereta Cepat Padalarang Hub', category: 'transport', city: 'Bandung Barat', province: 'Jawa Barat', lat: -6.839500, lng: 107.481500, aliases: ['whoosh padalarang'] },
    { id: 'bdg-stasiun-whoosh-tegalluar', name: 'Stasiun Whoosh Kereta Cepat Tegalluar', category: 'transport', city: 'Bandung', province: 'Jawa Barat', lat: -6.969500, lng: 107.712500, aliases: ['whoosh tegalluar'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 4. DI YOGYAKARTA & SLEMAN / BANTUL
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus & Episentrum Kost
    { id: 'jog-stie-ykpn-seturan', name: 'STIE YKPN & Kawasan Mahasiswa Seturan', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.769500, lng: 110.410500, aliases: ['ykpn', 'stie ykpn', 'seturan'] },
    { id: 'jog-ugm-bulaksumur', name: 'Universitas Gadjah Mada (UGM) - Bulaksumur', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.771500, lng: 110.377500, aliases: ['ugm', 'bulaksumur', 'rektorat ugm'] },
    { id: 'jog-uny-karangmalang', name: 'Universitas Negeri Yogyakarta (UNY)', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.773034, lng: 110.383815, aliases: ['uny'] },
    { id: 'jog-uii-terpadu-kaliurang', name: 'Universitas Islam Indonesia (UII) - Jl. Kaliurang KM 14.5', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.687500, lng: 110.414500, aliases: ['uii terpadu', 'uii kaliurang'] },
    { id: 'jog-umy-ringroad', name: 'Universitas Muhammadiyah Yogyakarta (UMY)', category: 'campus', city: 'Bantul', province: 'DI Yogyakarta', lat: -7.813684, lng: 110.32293, aliases: ['umy', 'umy terpadu'] },
    { id: 'jog-uin-sunan-kalijaga', name: 'UIN Sunan Kalijaga Yogyakarta', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.785705, lng: 110.394291, aliases: ['uin jogja', 'uin kalijaga'] },
    { id: 'jog-upn-veteran-condongcatur', name: 'UPN Veteran Yogyakarta - Condongcatur', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.762695, lng: 110.409524, aliases: ['upn jogja', 'upn conkat'] },
    { id: 'jog-atmajaya-babarsari', name: 'Universitas Atma Jaya Yogyakarta (UAJY) - Babarsari', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.779468, lng: 110.415913, aliases: ['atmajaya jogja', 'uajy', 'babarsari'] },
    { id: 'jog-sanatadharma-mrican', name: 'Universitas Sanata Dharma (USD) - Mrican & Paingan', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.776500, lng: 110.389500, aliases: ['usd jogja', 'sanata dharma'] },
    { id: 'jog-uad-kampus-4', name: 'Universitas Ahmad Dahlan (UAD) - Kampus 4 Ringroad Selatan', category: 'campus', city: 'Bantul', province: 'DI Yogyakarta', lat: -7.832500, lng: 110.384500, aliases: ['uad kampus 4', 'uad utama'] },
    { id: 'jog-amikom-condongcatur', name: 'Universitas AMIKOM Yogyakarta', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.7596, lng: 110.408722, aliases: ['amikom'] },
    { id: 'jog-isi-sewon', name: 'Institut Seni Indonesia (ISI Yogyakarta) - Sewon', category: 'campus', city: 'Bantul', province: 'DI Yogyakarta', lat: -7.851928, lng: 110.356065, aliases: ['isi jogja'] },
    // Mall, Wisata, RS & Transportasi
    { id: 'jog-pakuwon-mall-jogja', name: 'Pakuwon Mall Jogja (Eks Hartono Mall)', category: 'mall', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.758239, lng: 110.399481, aliases: ['pakuwon jogja', 'hartono mall'] },
    { id: 'jog-plaza-ambarrukmo', name: 'Plaza Ambarrukmo (Amplaz)', category: 'mall', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.782165, lng: 110.401344, aliases: ['amplaz', 'ambarrukmo plaza'] },
    { id: 'jog-jogja-city-mall', name: 'Jogja City Mall (JCM Jl. Magelang)', category: 'mall', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.753403, lng: 110.360471, aliases: ['jcm jogja'] },
    { id: 'jog-malioboro', name: 'Kawasan Malioboro & Titik Nol KM Jogja', category: 'tourism', city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.792500, lng: 110.365500, aliases: ['malioboro', 'titik nol jogja'] },
    { id: 'jog-rsup-dr-sardjito', name: 'RSUP Dr. Sardjito Yogyakarta', category: 'hospital', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.768852, lng: 110.372512, aliases: ['rs sardjito', 'rsup sardjito'] },
    { id: 'jog-rs-panti-rapih', name: 'RS Panti Rapih Yogyakarta', category: 'hospital', city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.776544, lng: 110.37741, aliases: ['panti rapih'] },
    { id: 'jog-rs-bethesda', name: 'RS Bethesda Yogyakarta (Jl. Jend. Sudirman)', category: 'hospital', city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.783513, lng: 110.37851, aliases: ['bethesda jogja'] },
    { id: 'jog-rs-jih', name: 'Jogja International Hospital (RS JIH Ringroad Utara)', category: 'hospital', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.759500, lng: 110.404500, aliases: ['rs jih jogja'] },
    { id: 'jog-stasiun-tugu', name: 'Stasiun Kereta Api Tugu Yogyakarta & Lempuyangan', category: 'transport', city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.789500, lng: 110.363500, aliases: ['stasiun tugu', 'stasiun lempuyangan'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 5. SURABAYA RAYA (SURABAYA, SIDOARJO, GRESIK), MALANG, & JEMBER (JAWA TIMUR)
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus Surabaya, Malang, & Jember
    { id: 'sby-pens-sukolilo', name: 'Politeknik Elektronika Negeri Surabaya (PENS)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.276458, lng: 112.794212, aliases: ['pens', 'pens sukolilo'] },
    { id: 'sby-ppns-sukolilo', name: 'Politeknik Perkapalan Negeri Surabaya (PPNS)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.277814, lng: 112.795709, aliases: ['ppns'] },
    { id: 'sby-its-sukolilo', name: 'Institut Teknologi Sepuluh Nopember (ITS) - Sukolilo', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.282695, lng: 112.795678, aliases: ['its sukolilo', 'its surabaya'] },
    { id: 'sby-unair-kampus-c', name: 'Universitas Airlangga (UNAIR) - Kampus C Mulyorejo', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.269500, lng: 112.784500, aliases: ['unair c', 'rektorat unair'] },
    { id: 'sby-unair-kampus-b', name: 'Universitas Airlangga (UNAIR) - Kampus B Dharmawangsa', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.272500, lng: 112.758500, aliases: ['unair b', 'feb unair'] },
    { id: 'sby-unesa-lidah-wetan', name: 'Universitas Negeri Surabaya (UNESA) - Lidah Wetan', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.29981, lng: 112.673839, aliases: ['unesa lidah wetan'] },
    { id: 'sby-ubaya-tenggilis', name: 'Universitas Surabaya (UBAYA) - Tenggilis', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.319983, lng: 112.767978, aliases: ['ubaya tenggilis'] },
    { id: 'sby-petra-siwalankerto', name: 'Universitas Kristen Petra (UK Petra)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.339468, lng: 112.737561, aliases: ['uk petra'] },
    { id: 'sby-upn-jatim', name: 'UPN Veteran Jawa Timur (Rungkut Madya)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.331333, lng: 112.787771, aliases: ['upn jatim', 'upn surabaya'] },
    { id: 'sby-ciputra-citraland', name: 'Universitas Ciputra Surabaya (UC)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.286572, lng: 112.632095, aliases: ['uc surabaya'] },
    { id: 'jbr-unej-tegalboto', name: 'Universitas Jember (UNEJ) - Kampus Tegalboto', category: 'campus', city: 'Jember', province: 'Jawa Timur', lat: -8.165500, lng: 113.717500, aliases: ['unej jember', 'tegalboto'] },
    { id: 'mlg-ub-ketawanggede', name: 'Universitas Brawijaya (UB) - Ketawanggede', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.951799, lng: 112.613839, aliases: ['ub malang', 'brawijaya'] },
    { id: 'mlg-um-sumbersari', name: 'Universitas Negeri Malang (UM)', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.961474, lng: 112.617872, aliases: ['um malang'] },
    { id: 'mlg-umm-kampus-3', name: 'Universitas Muhammadiyah Malang (UMM) - Kampus 3 Tlogomas', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.921500, lng: 112.597500, aliases: ['umm tlogomas', 'umm kampus 3'] },
    { id: 'mlg-polinema', name: 'Politeknik Negeri Malang (POLINEMA)', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.945419, lng: 112.614898, aliases: ['polinema'] },
    { id: 'mlg-unisma', name: 'Universitas Islam Malang (UNISMA Dinoyo)', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.936331, lng: 112.607267, aliases: ['unisma malang'] },
    { id: 'mlg-itn', name: 'Institut Teknologi Nasional (ITN Malang Kampus 1 & 2)', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.95838, lng: 112.61233, aliases: ['itn malang'] },
    // Mall, Industri & RS Surabaya/Malang
    { id: 'sby-tunjungan-plaza', name: 'Tunjungan Plaza (TP 1-6)', category: 'mall', city: 'Surabaya', province: 'Jawa Timur', lat: -7.262387, lng: 112.739006, aliases: ['tp surabaya', 'tunjungan plaza'] },
    { id: 'sby-pakuwon-mall', name: 'Pakuwon Mall & PTC Surabaya Barat', category: 'mall', city: 'Surabaya', province: 'Jawa Timur', lat: -7.289500, lng: 112.675500, aliases: ['pakuwon mall surabaya', 'ptc surabaya'] },
    { id: 'sby-galaxy-mall', name: 'Galaxy Mall Surabaya (GM 1, 2, 3)', category: 'mall', city: 'Surabaya', province: 'Jawa Timur', lat: -7.276402, lng: 112.780495, aliases: ['galaxy mall surabaya'] },
    { id: 'sby-ind-sier-rungkut', name: 'Kawasan Industri SIER Rungkut Surabaya', category: 'industrial', city: 'Surabaya', province: 'Jawa Timur', lat: -7.331063, lng: 112.758173, aliases: ['sier rungkut', 'kawasan sier'] },
    { id: 'sby-ind-jiipe-gresik', name: 'Kawasan Industri JIIPE Manyar Gresik (Freeport Smelter)', category: 'industrial', city: 'Gresik', province: 'Jawa Timur', lat: -7.085500, lng: 112.595500, aliases: ['jiipe gresik', 'kawasan industri manyar'] },
    { id: 'sby-rsup-dr-soetomo', name: 'RSUD Dr. Soetomo Surabaya', category: 'hospital', city: 'Surabaya', province: 'Jawa Timur', lat: -7.26803, lng: 112.758219, aliases: ['rsud dr soetomo', 'rs soetomo'] },
    { id: 'sby-rs-national-hospital', name: 'National Hospital Surabaya Barat', category: 'hospital', city: 'Surabaya', province: 'Jawa Timur', lat: -7.299366, lng: 112.676406, aliases: ['national hospital'] },
    { id: 'mlg-rs-saiful-anwar', name: 'RSUD Dr. Saiful Anwar Malang (RSSA)', category: 'hospital', city: 'Malang', province: 'Jawa Timur', lat: -7.973268, lng: 112.63204, aliases: ['rssa malang', 'saiful anwar'] },
    { id: 'mlg-mall-olympic-garden', name: 'Mall Olympic Garden (MOG Malang)', category: 'mall', city: 'Malang', province: 'Jawa Timur', lat: -7.97696, lng: 112.62387, aliases: ['mog malang'] },
    { id: 'sby-bandara-juanda', name: 'Bandara Internasional Juanda (SUB)', category: 'transport', city: 'Sidoarjo', province: 'Jawa Timur', lat: -7.379500, lng: 112.787500, aliases: ['bandara juanda'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 6. SEMARANG, SOLO, PURWOKERTO, & SALATIGA (JAWA TENGAH)
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'smg-undip-tembalang', name: 'Universitas Diponegoro (UNDIP) - Kampus Tembalang', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -7.051500, lng: 110.438500, aliases: ['undip tembalang', 'rektorat undip'] },
    { id: 'smg-polines-tembalang', name: 'Politeknik Negeri Semarang (POLINES Tembalang)', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -7.05281, lng: 110.434169, aliases: ['polines'] },
    { id: 'smg-unnes-segaran', name: 'Universitas Negeri Semarang (UNNES) - Sekaran', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -7.050244, lng: 110.398826, aliases: ['unnes sekaran'] },
    { id: 'smg-udinus-pendrikan', name: 'Universitas Dian Nuswantoro (UDINUS Semarang)', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -6.982698, lng: 110.409027, aliases: ['udinus'] },
    { id: 'smg-unissula-kaligawe', name: 'Universitas Islam Sultan Agung (UNISSULA)', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -6.954116, lng: 110.458783, aliases: ['unissula'] },
    { id: 'slo-uns-kentingan', name: 'Universitas Sebelas Maret (UNS) - Kentingan Solo', category: 'campus', city: 'Surakarta', province: 'Jawa Tengah', lat: -7.558500, lng: 110.855500, aliases: ['uns solo', 'kentingan'] },
    { id: 'slo-ums-pabelan', name: 'Universitas Muhammadiyah Surakarta (UMS) - Pabelan', category: 'campus', city: 'Sukoharjo', province: 'Jawa Tengah', lat: -7.556561, lng: 110.771025, aliases: ['ums solo', 'ums pabelan'] },
    { id: 'slt-uksw-salatiga', name: 'Universitas Kristen Satya Wacana (UKSW Salatiga)', category: 'campus', city: 'Salatiga', province: 'Jawa Tengah', lat: -7.319017, lng: 110.499461, aliases: ['uksw salatiga'] },
    { id: 'pwt-unsoed-grendeng', name: 'Universitas Jenderal Soedirman (UNSOED) - Purwokerto', category: 'campus', city: 'Banyumas', province: 'Jawa Tengah', lat: -7.403379, lng: 109.245905, aliases: ['unsoed purwokerto'] },
    { id: 'smg-ind-kik-kendal', name: 'Kawasan Industri Kendal (KIK Park by the Bay)', category: 'industrial', city: 'Kendal', province: 'Jawa Tengah', lat: -6.923735, lng: 110.268468, aliases: ['kik kendal', 'kawasan industri kendal'] },
    { id: 'smg-rsup-dr-kariadi', name: 'RSUP Dr. Kariadi Semarang', category: 'hospital', city: 'Semarang', province: 'Jawa Tengah', lat: -6.99331, lng: 110.406638, aliases: ['rs kariadi', 'rsup kariadi'] },
    { id: 'slo-rs-moewardi', name: 'RSUD Dr. Moewardi Surakarta (Solo)', category: 'hospital', city: 'Surakarta', province: 'Jawa Tengah', lat: -7.558544, lng: 110.842208, aliases: ['rs moewardi solo'] },
    { id: 'pwt-rs-margono', name: 'RSUD Prof. Dr. Margono Soekarjo Purwokerto', category: 'hospital', city: 'Banyumas', province: 'Jawa Tengah', lat: -7.437304, lng: 109.267324, aliases: ['rs margono purwokerto'] },
    { id: 'smg-mall-paragon', name: 'Pollux Mall Paragon Semarang', category: 'mall', city: 'Semarang', province: 'Jawa Tengah', lat: -6.979338, lng: 110.415958, aliases: ['paragon semarang'] },
    { id: 'slo-the-park-solo-baru', name: 'The Park Mall & Pakuwon Mall Solo Baru', category: 'mall', city: 'Sukoharjo', province: 'Jawa Tengah', lat: -7.598500, lng: 110.817500, aliases: ['the park solo', 'pakuwon solo baru'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 7. SUMATERA (ACEH, MEDAN, PALEMBANG, PADANG, PEKANBARU, LAMPUNG, BATAM, JAMBI, BENGKULU)
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'ach-usk-darussalam', name: 'Universitas Syiah Kuala (USK Banda Aceh)', category: 'campus', city: 'Banda Aceh', province: 'Aceh', lat: 5.569257, lng: 95.371226, aliases: ['usk banda aceh', 'syiah kuala'] },
    { id: 'ach-rsud-za', name: 'RSUD Dr. Zainoel Abidin Banda Aceh (RSUZA)', category: 'hospital', city: 'Banda Aceh', province: 'Aceh', lat: 5.564069, lng: 95.337225, aliases: ['rsuza banda aceh'] },
    { id: 'mdn-usu-padang-bulan', name: 'Universitas Sumatera Utara (USU) - Padang Bulan', category: 'campus', city: 'Medan', province: 'Sumatera Utara', lat: 3.561322, lng: 98.656803, aliases: ['usu medan'] },
    { id: 'mdn-unimed', name: 'Universitas Negeri Medan (UNIMED)', category: 'campus', city: 'Medan', province: 'Sumatera Utara', lat: 3.609049, lng: 98.717066, aliases: ['unimed'] },
    { id: 'mdn-unpri', name: 'Universitas Prima Indonesia (UNPRI Medan)', category: 'campus', city: 'Medan', province: 'Sumatera Utara', lat: 3.598475, lng: 98.65242, aliases: ['unpri medan'] },
    { id: 'mdn-sun-plaza', name: 'Sun Plaza Medan & Podomoro City Deli', category: 'mall', city: 'Medan', province: 'Sumatera Utara', lat: 3.585500, lng: 98.671500, aliases: ['sun plaza', 'deli park'] },
    { id: 'mdn-ind-kim', name: 'Kawasan Industri Medan (KIM 1-4 Mabar)', category: 'industrial', city: 'Medan', province: 'Sumatera Utara', lat: 3.538654, lng: 98.816149, aliases: ['kim medan', 'kawasan industri medan'] },
    { id: 'mdn-rsup-adam-malik', name: 'RSUP H. Adam Malik Medan', category: 'hospital', city: 'Medan', province: 'Sumatera Utara', lat: 3.518235, lng: 98.608534, aliases: ['rs adam malik'] },
    { id: 'plb-unsri-indralaya', name: 'Universitas Sriwijaya (UNSRI) - Kampus Indralaya', category: 'campus', city: 'Ogan Ilir', province: 'Sumatera Selatan', lat: -3.218500, lng: 104.648500, aliases: ['unsri indralaya'] },
    { id: 'plb-unsri-palembang', name: 'Universitas Sriwijaya (UNSRI) - Bukit Besar Palembang', category: 'campus', city: 'Palembang', province: 'Sumatera Selatan', lat: -2.985500, lng: 104.732500, aliases: ['unsri bukit'] },
    { id: 'plb-rsup-mohammad-hoesin', name: 'RSUP Dr. Mohammad Hoesin Palembang (RSMH)', category: 'hospital', city: 'Palembang', province: 'Sumatera Selatan', lat: -2.966263, lng: 104.749822, aliases: ['rsmh palembang'] },
    { id: 'pdg-unand-limau-manis', name: 'Universitas Andalas (UNAND) - Limau Manis Padang', category: 'campus', city: 'Padang', province: 'Sumatera Barat', lat: -0.914873, lng: 100.46271, aliases: ['unand limau manis'] },
    { id: 'pdg-unp-air-tawar', name: 'Universitas Negeri Padang (UNP Air Tawar)', category: 'campus', city: 'Padang', province: 'Sumatera Barat', lat: -0.897395, lng: 100.349958, aliases: ['unp padang'] },
    { id: 'pku-unri-panam', name: 'Universitas Riau (UNRI) - Kampus Bina Widya Panam', category: 'campus', city: 'Pekanbaru', province: 'Riau', lat: 0.481500, lng: 101.378500, aliases: ['unri panam'] },
    { id: 'pku-pcr-rumbai', name: 'Politeknik Caltex Riau (PCR Rumbai Pekanbaru)', category: 'campus', city: 'Pekanbaru', province: 'Riau', lat: 0.569679, lng: 101.425908, aliases: ['pcr pekanbaru'] },
    { id: 'pku-uir', name: 'Universitas Islam Riau (UIR Pekanbaru)', category: 'campus', city: 'Pekanbaru', province: 'Riau', lat: 0.465304, lng: 101.355291, aliases: ['uir pekanbaru'] },
    { id: 'lpg-unila-gedong-meneng', name: 'Universitas Lampung (UNILA) - Bandar Lampung', category: 'campus', city: 'Bandar Lampung', province: 'Lampung', lat: -5.377755, lng: 105.252392, aliases: ['unila'] },
    { id: 'lpg-itera', name: 'Institut Teknologi Sumatera (ITERA Lampung)', category: 'campus', city: 'Lampung Selatan', province: 'Lampung', lat: -5.366768, lng: 105.314931, aliases: ['itera'] },
    { id: 'btm-ind-batamindo', name: 'Kawasan Industri Batamindo Industrial Park (Mukakuning)', category: 'industrial', city: 'Batam', province: 'Kepulauan Riau', lat: 1.077500, lng: 104.032500, aliases: ['batamindo mukakuning'] },
    { id: 'btm-uib', name: 'Universitas Internasional Batam (UIB)', category: 'campus', city: 'Batam', province: 'Kepulauan Riau', lat: 1.118500, lng: 104.015500, aliases: ['uib batam'] },
    { id: 'jmb-unja-mendalo', name: 'Universitas Jambi (UNJA) - Kampus Utama Mendalo', category: 'campus', city: 'Muaro Jambi', province: 'Jambi', lat: -1.615500, lng: 103.525500, aliases: ['unja mendalo'] },
    { id: 'bkl-unib-kandang-limun', name: 'Universitas Bengkulu (UNIB) - Kandang Limun', category: 'campus', city: 'Bengkulu', province: 'Bengkulu', lat: -3.758667, lng: 102.271393, aliases: ['unib bengkulu'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 8. BALI, NUSA TENGGARA BARAT (LOMBOK), & NUSA TENGGARA TIMUR (KUPANG)
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'dps-unud-jimbaran', name: 'Universitas Udayana (UNUD) - Kampus Bukit Jimbaran', category: 'campus', city: 'Badung', province: 'Bali', lat: -8.798500, lng: 115.172500, aliases: ['unud jimbaran', 'rektorat unud'] },
    { id: 'dps-unud-sudirman', name: 'Universitas Udayana (UNUD) - Kampus Sudirman Denpasar', category: 'campus', city: 'Denpasar', province: 'Bali', lat: -8.672425, lng: 115.21867, aliases: ['unud sudirman'] },
    { id: 'dps-warmadewa', name: 'Universitas Warmadewa (Denpasar)', category: 'campus', city: 'Denpasar', province: 'Bali', lat: -8.658376, lng: 115.242684, aliases: ['warmadewa'] },
    { id: 'dps-pnb-jimbaran', name: 'Politeknik Negeri Bali (PNB Jimbaran)', category: 'campus', city: 'Badung', province: 'Bali', lat: -8.799197, lng: 115.161818, aliases: ['pnb bali', 'poltek bali'] },
    { id: 'dps-beachwalk-kuta', name: 'Beachwalk Shopping Center Kuta', category: 'mall', city: 'Badung', province: 'Bali', lat: -8.718500, lng: 115.169500, aliases: ['beachwalk kuta'] },
    { id: 'dps-living-world-bali', name: 'Living World Denpasar (Gatot Subroto)', category: 'mall', city: 'Denpasar', province: 'Bali', lat: -8.634388, lng: 115.232105, aliases: ['living world bali'] },
    { id: 'dps-rsup-prof-ngoerah', name: 'RSUP Prof. Ngoerah (Eks RSUP Sanglah Denpasar)', category: 'hospital', city: 'Denpasar', province: 'Bali', lat: -8.676500, lng: 115.215500, aliases: ['rs sanglah', 'rsup ngoerah'] },
    { id: 'dps-bandara-ngurah-rai', name: 'Bandara Internasional I Gusti Ngurah Rai (DPS)', category: 'transport', city: 'Badung', province: 'Bali', lat: -8.748500, lng: 115.167500, aliases: ['bandara ngurah rai'] },
    { id: 'lop-unram-mataram', name: 'Universitas Mataram (UNRAM Lombok)', category: 'campus', city: 'Mataram', province: 'Nusa Tenggara Barat', lat: -8.587324, lng: 116.093365, aliases: ['unram'] },
    { id: 'lop-epicentrum-mall', name: 'Lombok Epicentrum Mall (LEM Mataram)', category: 'mall', city: 'Mataram', province: 'Nusa Tenggara Barat', lat: -8.593497, lng: 116.10468, aliases: ['epicentrum lombok'] },
    { id: 'kpg-undana-penfui', name: 'Universitas Nusa Cendana (UNDANA Kupang)', category: 'campus', city: 'Kupang', province: 'Nusa Tenggara Timur', lat: -10.152495, lng: 123.665626, aliases: ['undana kupang'] },
    { id: 'kpg-lippo-plaza', name: 'Lippo Plaza Kupang (Fatubesi)', category: 'mall', city: 'Kupang', province: 'Nusa Tenggara Timur', lat: -10.147500, lng: 123.612500, aliases: ['lippo kupang'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 9. SULAWESI LAINNYA (PALU, KENDARI, GORONTALO, MANADO)
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'plu-untad-bumi-tadulako', name: 'Universitas Tadulako (UNTAD Palu - Tondo)', category: 'campus', city: 'Palu', province: 'Sulawesi Tengah', lat: -0.836243, lng: 119.894654, aliases: ['untad palu', 'tondo'] },
    { id: 'plu-rsud-undata', name: 'RSUD Undata Palu', category: 'hospital', city: 'Palu', province: 'Sulawesi Tengah', lat: -0.858573, lng: 119.885398, aliases: ['rs undata'] },
    { id: 'plu-grand-mall', name: 'Palu Grand Mall (PGM Cumi-Cumi)', category: 'mall', city: 'Palu', province: 'Sulawesi Tengah', lat: -0.883424, lng: 119.842603, aliases: ['palu grand mall'] },
    { id: 'kdi-uho-andounohu', name: 'Universitas Halu Oleo (UHO Kendari)', category: 'campus', city: 'Kendari', province: 'Sulawesi Tenggara', lat: -4.008056, lng: 122.521894, aliases: ['uho kendari', 'halu oleo'] },
    { id: 'kdi-the-park', name: 'The Park Kendari (Bonggoeya)', category: 'mall', city: 'Kendari', province: 'Sulawesi Tenggara', lat: -3.982957, lng: 122.519345, aliases: ['the park kendari'] },
    { id: 'kdi-rsud-bahteramas', name: 'RSUD Bahteramas Provinsi Sultra', category: 'hospital', city: 'Kendari', province: 'Sulawesi Tenggara', lat: -4.032500, lng: 122.492500, aliases: ['rs bahteramas'] },
    { id: 'gto-ung-dulomo', name: 'Universitas Negeri Gorontalo (UNG)', category: 'campus', city: 'Gorontalo', province: 'Gorontalo', lat: 0.555657, lng: 123.062939, aliases: ['ung gorontalo'] },
    { id: 'mdo-unsrat-manado', name: 'Universitas Sam Ratulangi (UNSRAT Manado)', category: 'campus', city: 'Manado', province: 'Sulawesi Utara', lat: 1.457137, lng: 124.827961, aliases: ['unsrat manado'] },
    { id: 'mdo-mantos', name: 'Manado Town Square (MANTOS 1, 2, 3)', category: 'mall', city: 'Manado', province: 'Sulawesi Utara', lat: 1.471405, lng: 124.831236, aliases: ['mantos manado'] },
    { id: 'mdo-rsup-kandou', name: 'RSUP Prof. Dr. R. D. Kandou Manado', category: 'hospital', city: 'Manado', province: 'Sulawesi Utara', lat: 1.453994, lng: 124.807059, aliases: ['rs kandou manado'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 10. KALIMANTAN (BALIKPAPAN, IKN, SAMARINDA, BANJARMASIN, PONTIANAK, TARAKAN) & MALUKU/PAPUA
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'bpn-itk-karang-joang', name: 'Institut Teknologi Kalimantan (ITK Balikpapan)', category: 'campus', city: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.150076, lng: 116.862449, aliases: ['itk balikpapan'] },
    { id: 'ikn-kipp-nusantara', name: 'KIPP Ibu Kota Nusantara (IKN Nusantara)', category: 'office', city: 'Penajam Paser Utara', province: 'Kalimantan Timur', lat: -0.963500, lng: 116.702500, aliases: ['ikn', 'titik nol ikn'] },
    { id: 'bpn-pentacity', name: 'Pentacity Shopping Venue & E-Walk Balikpapan', category: 'mall', city: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.272500, lng: 116.869500, aliases: ['pentacity', 'e walk balikpapan'] },
    { id: 'bpn-rs-kanujoso', name: 'RSUD Kanujoso Djatiwibowo Balikpapan', category: 'hospital', city: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.224185, lng: 116.868782, aliases: ['rs kanujoso'] },
    { id: 'smd-unmul-gunung-kelua', name: 'Universitas Mulawarman (UNMUL Samarinda)', category: 'campus', city: 'Samarinda', province: 'Kalimantan Timur', lat: -0.469333, lng: 117.155263, aliases: ['unmul'] },
    { id: 'smd-big-mall', name: 'Big Mall Samarinda (Jl. Untung Suropati)', category: 'mall', city: 'Samarinda', province: 'Kalimantan Timur', lat: -0.526181, lng: 117.115736, aliases: ['big mall samarinda'] },
    { id: 'bjm-ulm-banjarmasin', name: 'Universitas Lambung Mangkurat (ULM Banjarmasin & Banjarbaru)', category: 'campus', city: 'Banjarmasin', province: 'Kalimantan Selatan', lat: -3.296306, lng: 114.586271, aliases: ['ulm banjarmasin'] },
    { id: 'bjm-duta-mall', name: 'Duta Mall Banjarmasin', category: 'mall', city: 'Banjarmasin', province: 'Kalimantan Selatan', lat: -3.322419, lng: 114.603423, aliases: ['duta mall'] },
    { id: 'ptk-untan-pontianak', name: 'Universitas Tanjungpura (UNTAN Pontianak)', category: 'campus', city: 'Pontianak', province: 'Kalimantan Barat', lat: -0.057961, lng: 109.346653, aliases: ['untan pontianak'] },
    { id: 'trk-ubt-tarakan', name: 'Universitas Borneo Tarakan (UBT Kaltara)', category: 'campus', city: 'Tarakan', province: 'Kalimantan Utara', lat: 3.304009, lng: 117.646807, aliases: ['ubt tarakan'] },
    { id: 'amb-unpatti-ambon', name: 'Universitas Pattimura (UNPATTI Ambon)', category: 'campus', city: 'Ambon', province: 'Maluku', lat: -3.654472, lng: 128.196441, aliases: ['unpatti'] },
    { id: 'jay-uncen-jayapura', name: 'Universitas Cenderawasih (UNCEN Jayapura - Abepura & Waena)', category: 'campus', city: 'Jayapura', province: 'Papua', lat: -2.595500, lng: 140.668500, aliases: ['uncen jayapura'] }
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
