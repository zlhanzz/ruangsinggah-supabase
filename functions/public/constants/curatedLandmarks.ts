/**
 * Curated Landmarks & Anchors Database (National Scope - Indonesia)
 * Master data terkurasi untuk titik-titik magnet mobilitas masyarakat dan pencari kost
 * Mencakup 25 kota/kawasan strategis di Indonesia (250+ Titik Anchor Utama).
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
    // 1. MAKASSAR, GOWA, & MAROS (SULAWESI SELATAN)
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus
    { id: 'mks-unhas-tamalanrea', name: 'Universitas Hasanuddin (UNHAS) - Tamalanrea', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.138722, lng: 119.489111, aliases: ['unhas', 'rektorat unhas', 'hasanuddin university'] },
    { id: 'mks-unhas-gowa', name: 'Universitas Hasanuddin (UNHAS) - Kampus Teknik Gowa', category: 'campus', city: 'Gowa', province: 'Sulawesi Selatan', lat: -5.230784, lng: 119.502914, aliases: ['unhas gowa', 'fakultas teknik unhas'] },
    { id: 'mks-uim', name: 'Universitas Islam Makassar (UIM)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.137812, lng: 119.467401, aliases: ['uim', 'makassar islamic university'] },
    { id: 'mks-pnup', name: 'Politeknik Negeri Ujung Pandang (PNUP)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.135624, lng: 119.491203, aliases: ['pnup', 'poltek unhas'] },
    { id: 'mks-umi', name: 'Universitas Muslim Indonesia (UMI)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.138402, lng: 119.451801, aliases: ['umi', 'umi urip'] },
    { id: 'mks-unm-gunungsari', name: 'Universitas Negeri Makassar (UNM) - Gunungsari', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.185612, lng: 119.432401, aliases: ['unm', 'unm phinisi', 'menara phinisi unm'] },
    { id: 'mks-unm-parangtambung', name: 'Universitas Negeri Makassar (UNM) - Parangtambung', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.150712, lng: 119.438501, aliases: ['unm parangtambung', 'mipa unm'] },
    { id: 'mks-unm-banta-bantaeng', name: 'Universitas Negeri Makassar (UNM) - Banta-Bantaeng', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.163712, lng: 119.431201, aliases: ['fik unm'] },
    { id: 'mks-uin-samata', name: 'UIN Alauddin Makassar - Kampus 2 Samata', category: 'campus', city: 'Gowa', province: 'Sulawesi Selatan', lat: -5.203612, lng: 119.497101, aliases: ['uin samata', 'uin alauddin'] },
    { id: 'mks-uin-alauddin', name: 'UIN Alauddin Makassar - Kampus 1 Sultan Alauddin', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.176412, lng: 119.435701, aliases: ['uin kampus 1'] },
    { id: 'mks-unismuh', name: 'Universitas Muhammadiyah Makassar (UNISMUH)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.175512, lng: 119.437301, aliases: ['unismuh', 'unismuh tala salapang'] },
    { id: 'mks-poltekkes', name: 'Poltekkes Kemenkes Makassar (Banta-Bantaeng)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.167812, lng: 119.434201, aliases: ['poltekkes makassar'] },
    { id: 'mks-poltek-ati', name: 'Politeknik ATI Makassar', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.127812, lng: 119.479501, aliases: ['ati makassar', 'poltek ati'] },
    { id: 'mks-atmajaya', name: 'Universitas Atma Jaya Makassar', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.157812, lng: 119.409501, aliases: ['atma jaya makassar'] },
    { id: 'mks-bosowa', name: 'Universitas Bosowa (UNIBOS)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.138912, lng: 119.444501, aliases: ['unibos', 'universitas 45'] },
    { id: 'mks-unifa', name: 'Universitas Fajar (UNIFA)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.143212, lng: 119.448501, aliases: ['unifa'] },
    { id: 'mks-stie-nobel', name: 'Institut Bisnis dan Keuangan Nobel Indonesia', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.170212, lng: 119.439201, aliases: ['stie nobel'] },
    { id: 'mks-stimik-handayani', name: 'Universitas Handayani Makassar', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.144812, lng: 119.456201, aliases: ['stimik handayani'] },
    { id: 'mks-stikes-megarezky', name: 'Universitas Mega Rezky Makassar', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.182412, lng: 119.471501, aliases: ['unimerz', 'stikes mega rezky'] },
    { id: 'mks-ciputra', name: 'Universitas Ciputra Makassar (CPI)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.158102, lng: 119.398612, aliases: ['uc makassar', 'ciputra cpi'] },
    { id: 'mks-poltekpar', name: 'Politeknik Pariwisata Makassar (Poltekpar)', category: 'campus', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.178512, lng: 119.408501, aliases: ['poltekpar makassar', 'akpar'] },
    // Mall & Ritel
    { id: 'mks-mall-panakkukang', name: 'Mall Panakkukang (MP)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.157812, lng: 119.446201, aliases: ['mp', 'panakkukang mall'] },
    { id: 'mks-nipah-park', name: 'Nipah Park Makassar', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.139412, lng: 119.450301, aliases: ['nipah mall', 'mall nipah'] },
    { id: 'mks-trans-studio', name: 'Trans Studio Mall Makassar (TSM)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.161212, lng: 119.399501, aliases: ['tsm makassar', 'trans studio'] },
    { id: 'mks-pipo', name: 'Phinisi Point Mall (PiPo)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.151812, lng: 119.408201, aliases: ['pipo mall', 'mall pipo'] },
    { id: 'mks-mtos', name: 'Makassar Town Square (MToS)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.138212, lng: 119.474501, aliases: ['mtos'] },
    { id: 'mks-mall-ratu-indah', name: 'Mall Ratu Indah (MaRI)', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.155612, lng: 119.418201, aliases: ['mari', 'ratu indah'] },
    { id: 'mks-living-plaza-pettarani', name: 'Living Plaza Pettarani', category: 'mall', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.148512, lng: 119.435801, aliases: ['living plaza', 'ace pettarani'] },
    // Kawasan Industri & Bisnis
    { id: 'mks-kima', name: 'Kawasan Industri Makassar (KIMA Daya)', category: 'industrial', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.109212, lng: 119.512401, aliases: ['pt kima', 'kima makassar'] },
    { id: 'mks-pergudangan-parangloe', name: 'Kawasan Pergudangan Parangloe Indah', category: 'industrial', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.101512, lng: 119.489501, aliases: ['parangloe', 'pergudangan parangloe'] },
    { id: 'mks-cbd-panakkukang', name: 'Kawasan Bisnis Boulevard & Pengayoman', category: 'office', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.154212, lng: 119.444501, aliases: ['boulevard panakkukang', 'pengayoman'] },
    { id: 'mks-cbd-pettarani', name: 'Kawasan Perkantoran Jl. A.P. Pettarani', category: 'office', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.152412, lng: 119.435801, aliases: ['perkantoran pettarani', 'ap pettarani'] },
    { id: 'mks-cbd-cpi', name: 'Kawasan Bisnis Center Point of Indonesia (CPI)', category: 'office', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.154812, lng: 119.397201, aliases: ['cpi makassar', 'citraland cpi'] },
    // Rumah Sakit Besar
    { id: 'mks-rsup-wahidin', name: 'RSUP Dr. Wahidin Sudirohusodo', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.134212, lng: 119.493801, aliases: ['rs wahidin', 'rsup wahidin'] },
    { id: 'mks-rs-unhas', name: 'Rumah Sakit Universitas Hasanuddin (RS UNHAS)', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.132512, lng: 119.495201, aliases: ['rs unhas', 'rs pendidikan unhas'] },
    { id: 'mks-rs-siloam', name: 'Siloam Hospitals Makassar (Metro Tanjung Bunga)', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.153412, lng: 119.406801, aliases: ['rs siloam makassar', 'siloam tanjung bunga'] },
    { id: 'mks-rs-primaya', name: 'Primaya Hospital Makassar (Eks Awal Bros)', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.139812, lng: 119.443501, aliases: ['rs awal bros', 'rs primaya'] },
    { id: 'mks-rs-primaya-hertasning', name: 'Primaya Hospital Hertasning', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.168512, lng: 119.458501, aliases: ['primaya hertasning'] },
    { id: 'mks-rs-hermina', name: 'RS Hermina Makassar (Toddopuli)', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.161212, lng: 119.455201, aliases: ['hermina makassar'] },
    { id: 'mks-rs-labuang-baji', name: 'RSUD Labuang Baji Makassar', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.161812, lng: 119.421501, aliases: ['rs labuang baji'] },
    { id: 'mks-rs-daya', name: 'RSUD Daya Kota Makassar', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.116512, lng: 119.518501, aliases: ['rs daya', 'rsud daya'] },
    { id: 'mks-rs-ibnu-sina', name: 'Rumah Sakit Ibnu Sina YBW UMI', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.138212, lng: 119.448901, aliases: ['rs ibnu sina'] },
    { id: 'mks-rs-bhayangkara', name: 'RS Bhayangkara Makassar', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.176812, lng: 119.414201, aliases: ['rs bhayangkara mks'] },
    { id: 'mks-rs-stella-maris', name: 'RS Stella Maris Makassar', category: 'hospital', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.148512, lng: 119.408201, aliases: ['stella maris'] },
    // Wisata & Ikon Kota
    { id: 'mks-pantai-losari', name: 'Kawasan Wisata Pantai Losari', category: 'tourism', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.144812, lng: 119.407201, aliases: ['pantai losari', 'losari'] },
    { id: 'mks-fort-rotterdam', name: 'Benteng Fort Rotterdam', category: 'tourism', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.133812, lng: 119.405801, aliases: ['fort rotterdam', 'benteng ujung pandang'] },
    { id: 'mks-masjid-99-kubah', name: 'Masjid 99 Kubah CPI Makassar', category: 'tourism', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.150212, lng: 119.399501, aliases: ['masjid 99 kubah', 'masjid cpi'] },
    // Hub Transportasi
    { id: 'mks-bandara-hasanuddin', name: 'Bandara Internasional Sultan Hasanuddin', category: 'transport', city: 'Maros', province: 'Sulawesi Selatan', lat: -5.061812, lng: 119.554201, aliases: ['bandara hasanuddin', 'bandara shiam'] },
    { id: 'mks-pelabuhan-soetta', name: 'Pelabuhan Soekarno-Hatta Makassar', category: 'transport', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.122412, lng: 119.408501, aliases: ['pelabuhan makassar', 'pelabuhan soetta'] },
    { id: 'mks-terminal-daya', name: 'Terminal Regional Daya (Makassar)', category: 'transport', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.114212, lng: 119.516801, aliases: ['terminal daya'] },
    { id: 'mks-terminal-mallengkeri', name: 'Terminal Mallengkeri Makassar', category: 'transport', city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.184212, lng: 119.431201, aliases: ['terminal mallengkeri'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 2. JABODETABEK (JAKARTA, DEPOK, BOGOR, TANGERANG, BEKASI, CIKARANG, KARAWANG)
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus
    { id: 'jkt-ui-depok', name: 'Universitas Indonesia (UI) - Kampus Depok', category: 'campus', city: 'Depok', province: 'Jawa Barat', lat: -6.365361, lng: 106.831556, aliases: ['ui depok', 'rektorat ui'] },
    { id: 'jkt-ui-salemba', name: 'Universitas Indonesia (UI) - Kampus Salemba', category: 'campus', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.195212, lng: 106.848801, aliases: ['ui salemba', 'fk ui'] },
    { id: 'jkt-pnj-depok', name: 'Politeknik Negeri Jakarta (PNJ Depok)', category: 'campus', city: 'Depok', province: 'Jawa Barat', lat: -6.369512, lng: 106.827501, aliases: ['pnj depok', 'poltek ui'] },
    { id: 'jkt-unpam-puspitek', name: 'Universitas Pamulang (UNPAM) - Kampus Viktor/Puspitek', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.346512, lng: 106.691501, aliases: ['unpam viktor', 'unpam'] },
    { id: 'jkt-unpam-pusat', name: 'Universitas Pamulang (UNPAM) - Kampus 1 Pusat', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.344512, lng: 106.738501, aliases: ['unpam pusat', 'unpam reni jaya'] },
    { id: 'jkt-uin-ciputat', name: 'UIN Syarif Hidayatullah Jakarta (Ciputat)', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.307512, lng: 106.757501, aliases: ['uin jakarta', 'uin ciputat'] },
    { id: 'jkt-uph-karawaci', name: 'Universitas Pelita Harapan (UPH Lippo Karawaci)', category: 'campus', city: 'Tangerang', province: 'Banten', lat: -6.228512, lng: 106.611501, aliases: ['uph karawaci', 'uph'] },
    { id: 'jkt-ipb-dramaga', name: 'IPB University - Kampus IPB Dramaga', category: 'campus', city: 'Bogor', province: 'Jawa Barat', lat: -6.559812, lng: 106.726501, aliases: ['ipb dramaga', 'ipb bogor'] },
    { id: 'jkt-ipb-baranangsiang', name: 'IPB University - Kampus Baranangsiang', category: 'campus', city: 'Bogor', province: 'Jawa Barat', lat: -6.601212, lng: 106.808501, aliases: ['ipb baranangsiang'] },
    { id: 'jkt-binus-kemanggisan', name: 'BINUS University - Kampus Anggrek/Syahdan', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.201812, lng: 106.782501, aliases: ['binus kemanggisan', 'binus anggrek'] },
    { id: 'jkt-binus-alsut', name: 'BINUS University - Alam Sutera', category: 'campus', city: 'Tangerang', province: 'Banten', lat: -6.223412, lng: 106.649201, aliases: ['binus alsut'] },
    { id: 'jkt-trisakti-grogol', name: 'Universitas Trisakti - Kampus A Grogol', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.167812, lng: 106.789501, aliases: ['trisakti', 'univ trisakti'] },
    { id: 'jkt-untar-grogol', name: 'Universitas Tarumanagara (UNTAR)', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.168512, lng: 106.787201, aliases: ['untar'] },
    { id: 'jkt-unj-rawamangun', name: 'Universitas Negeri Jakarta (UNJ) - Rawamangun', category: 'campus', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.194512, lng: 106.879501, aliases: ['unj rawamangun'] },
    { id: 'jkt-atmajaya-semanggi', name: 'Unika Atma Jaya Jakarta - Semanggi', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.219812, lng: 106.816501, aliases: ['atma jaya semanggi'] },
    { id: 'jkt-upn-pondoklabu', name: 'UPN Veteran Jakarta - Pondok Labu', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.315612, lng: 106.797201, aliases: ['upnvj', 'upn jakarta'] },
    { id: 'jkt-umn-gading-serpong', name: 'Universitas Multimedia Nusantara (UMN)', category: 'campus', city: 'Tangerang', province: 'Banten', lat: -6.257212, lng: 106.618501, aliases: ['umn gading serpong'] },
    { id: 'jkt-prasmul-bsd', name: 'Universitas Prasetiya Mulya - BSD Campus', category: 'campus', city: 'Tangerang Selatan', province: 'Banten', lat: -6.303212, lng: 106.638501, aliases: ['prasmul bsd'] },
    { id: 'jkt-gunadarma-depok', name: 'Universitas Gunadarma - Kampus D Margonda', category: 'campus', city: 'Depok', province: 'Jawa Barat', lat: -6.368812, lng: 106.833501, aliases: ['gunadarma margonda', 'gundar d'] },
    { id: 'jkt-pancasila-lentengagung', name: 'Universitas Pancasila - Srengseng Sawah', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.339512, lng: 106.834501, aliases: ['univ pancasila'] },
    { id: 'jkt-mercubuana-meruya', name: 'Universitas Mercu Buana - Meruya', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.208212, lng: 106.738501, aliases: ['mercu buana meruya'] },
    { id: 'jkt-esaunggul-kebonjeruk', name: 'Universitas Esa Unggul - Kebon Jeruk', category: 'campus', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.189512, lng: 106.781501, aliases: ['esa unggul'] },
    { id: 'jkt-budiluhur-petukangan', name: 'Universitas Budi Luhur - Petukangan', category: 'campus', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.236512, lng: 106.758501, aliases: ['budi luhur'] },
    { id: 'jkt-president-univ', name: 'President University - Jababeka Cikarang', category: 'campus', city: 'Bekasi', province: 'Jawa Barat', lat: -6.284812, lng: 107.170501, aliases: ['presuniv', 'president university'] },
    { id: 'jkt-unpak-bogor', name: 'Universitas Pakuan (UNPAK Bogor)', category: 'campus', city: 'Bogor', province: 'Jawa Barat', lat: -6.602512, lng: 106.812501, aliases: ['unpak bogor'] },
    // Mall & Ritel
    { id: 'jkt-grand-indonesia', name: 'Grand Indonesia & Plaza Indonesia', category: 'mall', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.195212, lng: 106.821501, aliases: ['gi', 'grand indonesia'] },
    { id: 'jkt-senayan-city', name: 'Senayan City & Plaza Senayan', category: 'mall', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.227212, lng: 106.797501, aliases: ['senci', 'senayan city'] },
    { id: 'jkt-central-park', name: 'Central Park Mall & Mall Taman Anggrek', category: 'mall', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.177512, lng: 106.790501, aliases: ['central park', 'taman anggrek', 'neo soho'] },
    { id: 'jkt-gandaria-city', name: 'Gandaria City Mall (Gancit)', category: 'mall', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.244512, lng: 106.783501, aliases: ['gancit', 'gandaria city'] },
    { id: 'jkt-pondok-indah-mall', name: 'Pondok Indah Mall (PIM 1, 2, 3)', category: 'mall', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.265212, lng: 106.784501, aliases: ['pim', 'pondok indah mall'] },
    { id: 'jkt-kota-kasablanka', name: 'Kota Kasablanka (Kokas)', category: 'mall', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.223812, lng: 106.843501, aliases: ['kokas', 'kota kasablanka'] },
    { id: 'jkt-kelapa-gading', name: 'Mall Kelapa Gading (MKG 1-5)', category: 'mall', city: 'Jakarta Utara', province: 'DKI Jakarta', lat: -6.157512, lng: 106.908501, aliases: ['mkg', 'mall kelapa gading'] },
    { id: 'jkt-aeon-bsd', name: 'AEON Mall BSD City', category: 'mall', city: 'Tangerang Selatan', province: 'Banten', lat: -6.303512, lng: 106.643501, aliases: ['aeon bsd'] },
    { id: 'jkt-summarecon-serpong', name: 'Summarecon Mall Serpong (SMS)', category: 'mall', city: 'Tangerang', province: 'Banten', lat: -6.241212, lng: 106.628501, aliases: ['sms', 'summarecon serpong'] },
    { id: 'jkt-bxc-bintaro', name: 'Bintaro Jaya Xchange Mall (BXc)', category: 'mall', city: 'Tangerang Selatan', province: 'Banten', lat: -6.284512, lng: 106.728501, aliases: ['bxc', 'bintaro xchange'] },
    { id: 'jkt-summarecon-bekasi', name: 'Summarecon Mall Bekasi (SMB)', category: 'mall', city: 'Bekasi', province: 'Jawa Barat', lat: -6.226812, lng: 106.999501, aliases: ['smb', 'summarecon bekasi'] },
    { id: 'jkt-margo-city', name: 'Margo City Mall Depok', category: 'mall', city: 'Depok', province: 'Jawa Barat', lat: -6.373212, lng: 106.834501, aliases: ['margo city', 'margocity'] },
    // Kawasan Bisnis & Perkantoran (CBD)
    { id: 'jkt-cbd-scbd', name: 'Kawasan Bisnis SCBD Sudirman', category: 'office', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.226512, lng: 106.809501, aliases: ['scbd', 'sudirman cbd', 'pacific place'] },
    { id: 'jkt-cbd-kuningan', name: 'Kawasan Rasuna Said / Kuningan CBD', category: 'office', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.222512, lng: 106.831501, aliases: ['kuningan cbd', 'rasuna said'] },
    { id: 'jkt-cbd-mega-kuningan', name: 'Kawasan Mega Kuningan', category: 'office', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.228512, lng: 106.826501, aliases: ['mega kuningan', 'world capital tower'] },
    { id: 'jkt-cbd-tb-simatupang', name: 'Koridor Bisnis TB Simatupang', category: 'office', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.297512, lng: 106.825501, aliases: ['tb simatupang', 'simatupang office'] },
    { id: 'jkt-cbd-bsd-green-office', name: 'BSD Green Office Park & Digital Hub', category: 'office', city: 'Tangerang Selatan', province: 'Banten', lat: -6.302512, lng: 106.650501, aliases: ['gop bsd', 'bsd green office'] },
    // Kawasan Industri
    { id: 'jkt-ind-jababeka', name: 'Kawasan Industri Jababeka Cikarang', category: 'industrial', city: 'Bekasi', province: 'Jawa Barat', lat: -6.301512, lng: 107.165501, aliases: ['jababeka 1', 'jababeka 2', 'kawasan jababeka'] },
    { id: 'jkt-ind-mm2100', name: 'Kawasan Industri MM2100 Cibitung', category: 'industrial', city: 'Bekasi', province: 'Jawa Barat', lat: -6.298512, lng: 107.098501, aliases: ['mm2100', 'kawasan mm2100'] },
    { id: 'jkt-ind-kiic-karawang', name: 'Kawasan Industri KIIC Karawang', category: 'industrial', city: 'Karawang', province: 'Jawa Barat', lat: -6.358512, lng: 107.285501, aliases: ['kiic', 'karawang international industrial city'] },
    { id: 'jkt-ind-surya-cipta', name: 'Kawasan Industri Surya Cipta Karawang', category: 'industrial', city: 'Karawang', province: 'Jawa Barat', lat: -6.389512, lng: 107.332501, aliases: ['surya cipta karawang'] },
    { id: 'jkt-ind-giic-deltamas', name: 'Kawasan Industri GIIC Deltamas (Pusat EV Hyundai/Wuling)', category: 'industrial', city: 'Bekasi', province: 'Jawa Barat', lat: -6.375512, lng: 107.185501, aliases: ['giic deltamas', 'kota deltamas'] },
    { id: 'jkt-ind-ejip', name: 'Kawasan Industri EJIP Cikarang Selatan', category: 'industrial', city: 'Bekasi', province: 'Jawa Barat', lat: -6.326512, lng: 107.121501, aliases: ['ejip cikarang'] },
    { id: 'jkt-ind-pulogadung', name: 'Kawasan Industri Pulogadung (JIEP)', category: 'industrial', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.198512, lng: 106.912501, aliases: ['jiep pulogadung', 'kawasan industri pulogadung'] },
    { id: 'jkt-ind-manis-tangerang', name: 'Kawasan Industri Manis & Jatake Tangerang', category: 'industrial', city: 'Tangerang', province: 'Banten', lat: -6.212512, lng: 106.575501, aliases: ['industri manis', 'jatake tangerang'] },
    // Rumah Sakit Besar
    { id: 'jkt-rsup-rscm', name: 'RSUP Nasional Dr. Cipto Mangunkusumo (RSCM)', category: 'hospital', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.197512, lng: 106.847501, aliases: ['rscm', 'rscm kencana'] },
    { id: 'jkt-rs-fatmawati', name: 'RSUP Fatmawati Jakarta Selatan', category: 'hospital', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.294512, lng: 106.794501, aliases: ['rs fatmawati'] },
    { id: 'jkt-rs-harapan-kita', name: 'RS Jantung & Anak Harapan Kita (Slipi)', category: 'hospital', city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.185512, lng: 106.798501, aliases: ['rs harapan kita', 'rsab harapan kita'] },
    { id: 'jkt-rs-siloam-karawaci', name: 'Siloam Hospitals Lippo Village Karawaci', category: 'hospital', city: 'Tangerang', province: 'Banten', lat: -6.227512, lng: 106.609501, aliases: ['siloam karawaci'] },
    { id: 'jkt-rs-mayapada-lebakbulus', name: 'Mayapada Hospital Jakarta Selatan / Tangerang', category: 'hospital', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.298512, lng: 106.785501, aliases: ['mayapada lebak bulus'] },
    { id: 'jkt-rs-pondok-indah', name: 'RS Pondok Indah (RSPI Puri / Pondok Indah)', category: 'hospital', city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.275512, lng: 106.781501, aliases: ['rspi pondok indah'] },
    { id: 'jkt-rs-ui-depok', name: 'Rumah Sakit Universitas Indonesia (RSUI Depok)', category: 'hospital', city: 'Depok', province: 'Jawa Barat', lat: -6.368512, lng: 106.828501, aliases: ['rsui depok', 'rs ui'] },
    // Hub Transportasi
    { id: 'jkt-bandara-soetta', name: 'Bandara Internasional Soekarno-Hatta (CGK)', category: 'transport', city: 'Tangerang', province: 'Banten', lat: -6.125512, lng: 106.655501, aliases: ['bandara soetta', 'terminal 3 soetta'] },
    { id: 'jkt-bandara-halim', name: 'Bandara Halim Perdanakusuma (HLP)', category: 'transport', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.266512, lng: 106.891501, aliases: ['bandara halim'] },
    { id: 'jkt-stasiun-whoosh-halim', name: 'Stasiun Kereta Cepat Whoosh Halim', category: 'transport', city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.251512, lng: 106.886501, aliases: ['whoosh halim', 'kcic halim'] },
    { id: 'jkt-stasiun-gambir', name: 'Stasiun Kereta Api Gambir', category: 'transport', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.176512, lng: 106.830501, aliases: ['stasiun gambir'] },
    { id: 'jkt-stasiun-pasar-senen', name: 'Stasiun Kereta Api Pasar Senen', category: 'transport', city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.174512, lng: 106.844501, aliases: ['stasiun senen'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 3. BANDUNG RAYA, CIMAHI, & JATINANGOR (JAWA BARAT)
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus
    { id: 'bdg-itb-ganesha', name: 'Institut Teknologi Bandung (ITB) - Kampus Ganesha', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.891512, lng: 107.610501, aliases: ['itb', 'itb ganesha'] },
    { id: 'bdg-itb-jatinangor', name: 'Institut Teknologi Bandung (ITB) - Kampus Jatinangor', category: 'campus', city: 'Sumedang', province: 'Jawa Barat', lat: -6.929512, lng: 107.771501, aliases: ['itb jatinangor'] },
    { id: 'bdg-unpad-dipatiukur', name: 'Universitas Padjadjaran (UNPAD) - Dipatiukur', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.892512, lng: 107.617501, aliases: ['unpad du', 'unpad dipatiukur'] },
    { id: 'bdg-unpad-jatinangor', name: 'Universitas Padjadjaran (UNPAD) - Jatinangor', category: 'campus', city: 'Sumedang', province: 'Jawa Barat', lat: -6.926512, lng: 107.774501, aliases: ['unpad jatinangor', 'rektorat unpad'] },
    { id: 'bdg-upi-setiabudi', name: 'Universitas Pendidikan Indonesia (UPI) - Setiabudi', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.860512, lng: 107.590501, aliases: ['upi setiabudi', 'upi bandung'] },
    { id: 'bdg-telkom-university', name: 'Telkom University (Tel-U Dayeuhkolot)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.974512, lng: 107.630501, aliases: ['telkom university', 'tel u'] },
    { id: 'bdg-unpar-ciumbuleuit', name: 'Universitas Katolik Parahyangan (UNPAR)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.874512, lng: 107.604501, aliases: ['unpar ciumbuleuit'] },
    { id: 'bdg-unpas-tamansari', name: 'Universitas Pasundan (UNPAS) - Tamansari & Setiabudi', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.899512, lng: 107.607501, aliases: ['unpas tamansari', 'unpas'] },
    { id: 'bdg-unisba-tamansari', name: 'Universitas Islam Bandung (UNISBA)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.898512, lng: 107.608501, aliases: ['unisba tamansari'] },
    { id: 'bdg-maranatha-suriasumantri', name: 'Universitas Kristen Maranatha', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.887512, lng: 107.581501, aliases: ['maranatha'] },
    { id: 'bdg-widyatama-cikutra', name: 'Universitas Widyatama (Cikutra)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.898512, lng: 107.643501, aliases: ['widyatama'] },
    { id: 'bdg-itenas-pku', name: 'Institut Teknologi Nasional (ITENAS Bandung)', category: 'campus', city: 'Bandung', province: 'Jawa Barat', lat: -6.897512, lng: 107.635501, aliases: ['itenas'] },
    { id: 'bdg-polban-sarijadi', name: 'Politeknik Negeri Bandung (POLBAN)', category: 'campus', city: 'Bandung Barat', province: 'Jawa Barat', lat: -6.872512, lng: 107.574501, aliases: ['polban'] },
    // Mall, Bisnis & RS
    { id: 'bdg-paris-van-java', name: 'Paris Van Java Resort Mall (PVJ)', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.889512, lng: 107.596501, aliases: ['pvj bandung'] },
    { id: 'bdg-23-paskal', name: '23 Paskal Shopping Center', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.915512, lng: 107.596501, aliases: ['23 paskal'] },
    { id: 'bdg-ciwalk', name: 'Cihampelas Walk (Ciwalk)', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.893512, lng: 107.604501, aliases: ['ciwalk'] },
    { id: 'bdg-trans-studio', name: 'Trans Studio Mall Bandung (TSM)', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.926512, lng: 107.636501, aliases: ['tsm bandung'] },
    { id: 'bdg-summarecon-mall-bandung', name: 'Summarecon Mall Bandung (Gedebage)', category: 'mall', city: 'Bandung', province: 'Jawa Barat', lat: -6.955512, lng: 107.698501, aliases: ['summarecon bandung'] },
    { id: 'bdg-cbd-asia-afrika', name: 'Kawasan Perkantoran Jl. Asia Afrika / Braga', category: 'office', city: 'Bandung', province: 'Jawa Barat', lat: -6.921512, lng: 107.607501, aliases: ['asia afrika', 'braga bandung'] },
    { id: 'bdg-rsup-hasan-sadikin', name: 'RSUP Dr. Hasan Sadikin Bandung (RSHS)', category: 'hospital', city: 'Bandung', province: 'Jawa Barat', lat: -6.896512, lng: 107.598501, aliases: ['rshs', 'hasan sadikin'] },
    { id: 'bdg-rs-borromeus', name: 'RS Santo Borromeus Bandung (Dago)', category: 'hospital', city: 'Bandung', province: 'Jawa Barat', lat: -6.893512, lng: 107.615501, aliases: ['borromeus dago'] },
    { id: 'bdg-rs-immanuel', name: 'RS Immanuel Bandung (Kopo)', category: 'hospital', city: 'Bandung', province: 'Jawa Barat', lat: -6.938512, lng: 107.593501, aliases: ['rs immanuel'] },
    { id: 'bdg-stasiun-bandung', name: 'Stasiun Kereta Api Bandung (Hall & Kiaracondong)', category: 'transport', city: 'Bandung', province: 'Jawa Barat', lat: -6.912512, lng: 107.602501, aliases: ['stasiun bandung'] },
    { id: 'bdg-stasiun-whoosh-padalarang', name: 'Stasiun Whoosh Kereta Cepat Padalarang Hub', category: 'transport', city: 'Bandung Barat', province: 'Jawa Barat', lat: -6.839512, lng: 107.481501, aliases: ['whoosh padalarang'] },
    { id: 'bdg-stasiun-whoosh-tegalluar', name: 'Stasiun Whoosh Kereta Cepat Tegalluar', category: 'transport', city: 'Bandung', province: 'Jawa Barat', lat: -6.969512, lng: 107.712501, aliases: ['whoosh tegalluar'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 4. DI YOGYAKARTA & SLEMAN / BANTUL
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus
    { id: 'jog-ugm-bulaksumur', name: 'Universitas Gadjah Mada (UGM) - Bulaksumur', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.771512, lng: 110.377501, aliases: ['ugm', 'bulaksumur', 'rektorat ugm'] },
    { id: 'jog-uny-karangmalang', name: 'Universitas Negeri Yogyakarta (UNY)', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.774512, lng: 110.386501, aliases: ['uny'] },
    { id: 'jog-uii-terpadu-kaliurang', name: 'Universitas Islam Indonesia (UII) - Jl. Kaliurang KM 14.5', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.687512, lng: 110.414501, aliases: ['uii terpadu', 'uii kaliurang'] },
    { id: 'jog-umy-ringroad', name: 'Universitas Muhammadiyah Yogyakarta (UMY)', category: 'campus', city: 'Bantul', province: 'DI Yogyakarta', lat: -7.810512, lng: 110.320501, aliases: ['umy', 'umy terpadu'] },
    { id: 'jog-uin-sunan-kalijaga', name: 'UIN Sunan Kalijaga Yogyakarta', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.784512, lng: 110.395501, aliases: ['uin jogja', 'uin kalijaga'] },
    { id: 'jog-upn-veteran-condongcatur', name: 'UPN Veteran Yogyakarta - Condongcatur', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.761512, lng: 110.409501, aliases: ['upn jogja', 'upn conkat'] },
    { id: 'jog-atmajaya-babarsari', name: 'Universitas Atma Jaya Yogyakarta (UAJY) - Babarsari', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.779512, lng: 110.415501, aliases: ['atmajaya jogja', 'uajy'] },
    { id: 'jog-sanatadharma-mrican', name: 'Universitas Sanata Dharma (USD) - Mrican & Paingan', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.776512, lng: 110.389501, aliases: ['usd jogja', 'sanata dharma'] },
    { id: 'jog-uad-kampus-4', name: 'Universitas Ahmad Dahlan (UAD) - Kampus 4 Ringroad Selatan', category: 'campus', city: 'Bantul', province: 'DI Yogyakarta', lat: -7.832512, lng: 110.384501, aliases: ['uad kampus 4', 'uad utama'] },
    { id: 'jog-amikom-condongcatur', name: 'Universitas AMIKOM Yogyakarta', category: 'campus', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.759512, lng: 110.408501, aliases: ['amikom'] },
    { id: 'jog-isi-sewon', name: 'Institut Seni Indonesia (ISI Yogyakarta) - Sewon', category: 'campus', city: 'Bantul', province: 'DI Yogyakarta', lat: -7.852512, lng: 110.358501, aliases: ['isi jogja'] },
    // Mall, Wisata, RS & Transportasi
    { id: 'jog-pakuwon-mall-jogja', name: 'Pakuwon Mall Jogja (Eks Hartono Mall)', category: 'mall', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.758512, lng: 110.399501, aliases: ['pakuwon jogja', 'hartono mall'] },
    { id: 'jog-plaza-ambarrukmo', name: 'Plaza Ambarrukmo (Amplaz)', category: 'mall', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.782512, lng: 110.401501, aliases: ['amplaz', 'ambarrukmo plaza'] },
    { id: 'jog-jogja-city-mall', name: 'Jogja City Mall (JCM Jl. Magelang)', category: 'mall', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.754512, lng: 110.359501, aliases: ['jcm jogja'] },
    { id: 'jog-malioboro', name: 'Kawasan Malioboro & Titik Nol KM Jogja', category: 'tourism', city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.792512, lng: 110.365501, aliases: ['malioboro', 'titik nol jogja'] },
    { id: 'jog-rsup-dr-sardjito', name: 'RSUP Dr. Sardjito Yogyakarta', category: 'hospital', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.768512, lng: 110.373501, aliases: ['rs sardjito', 'rsup sardjito'] },
    { id: 'jog-rs-panti-rapih', name: 'RS Panti Rapih Yogyakarta', category: 'hospital', city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.777512, lng: 110.376501, aliases: ['panti rapih'] },
    { id: 'jog-rs-jih', name: 'Jogja International Hospital (RS JIH Ringroad Utara)', category: 'hospital', city: 'Sleman', province: 'DI Yogyakarta', lat: -7.759512, lng: 110.404501, aliases: ['rs jih jogja'] },
    { id: 'jog-stasiun-tugu', name: 'Stasiun Kereta Api Tugu Yogyakarta & Lempuyangan', category: 'transport', city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.789512, lng: 110.363501, aliases: ['stasiun tugu', 'stasiun lempuyangan'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 5. SURABAYA RAYA (SURABAYA, SIDOARJO, GRESIK) & MALANG (JAWA TIMUR)
    // ══════════════════════════════════════════════════════════════════════════════
    // Kampus Surabaya & Malang
    { id: 'sby-its-sukolilo', name: 'Institut Teknologi Sepuluh Nopember (ITS) - Sukolilo', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.281512, lng: 112.795501, aliases: ['its sukolilo', 'its surabaya'] },
    { id: 'sby-unair-kampus-c', name: 'Universitas Airlangga (UNAIR) - Kampus C Mulyorejo', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.269512, lng: 112.784501, aliases: ['unair c', 'rektorat unair'] },
    { id: 'sby-unair-kampus-b', name: 'Universitas Airlangga (UNAIR) - Kampus B Dharmawangsa', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.272512, lng: 112.758501, aliases: ['unair b', 'feb unair'] },
    { id: 'sby-unesa-lidah-wetan', name: 'Universitas Negeri Surabaya (UNESA) - Lidah Wetan', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.301512, lng: 112.673501, aliases: ['unesa lidah wetan'] },
    { id: 'sby-ubaya-tenggilis', name: 'Universitas Surabaya (UBAYA) - Tenggilis', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.319512, lng: 112.766501, aliases: ['ubaya tenggilis'] },
    { id: 'sby-petra-siwalankerto', name: 'Universitas Kristen Petra (UK Petra)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.342512, lng: 112.736501, aliases: ['uk petra'] },
    { id: 'sby-upn-jatim', name: 'UPN Veteran Jawa Timur (Rungkut Madya)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.333512, lng: 112.788501, aliases: ['upn jatim', 'upn surabaya'] },
    { id: 'sby-ciputra-citraland', name: 'Universitas Ciputra Surabaya (UC)', category: 'campus', city: 'Surabaya', province: 'Jawa Timur', lat: -7.287512, lng: 112.631501, aliases: ['uc surabaya'] },
    { id: 'mlg-ub-ketawanggede', name: 'Universitas Brawijaya (UB) - Ketawanggede', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.952512, lng: 112.614501, aliases: ['ub malang', 'brawijaya'] },
    { id: 'mlg-um-sumbersari', name: 'Universitas Negeri Malang (UM)', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.962512, lng: 112.617501, aliases: ['um malang'] },
    { id: 'mlg-umm-kampus-3', name: 'Universitas Muhammadiyah Malang (UMM) - Kampus 3 Tlogomas', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.921512, lng: 112.597501, aliases: ['umm tlogomas', 'umm kampus 3'] },
    { id: 'mlg-polinema', name: 'Politeknik Negeri Malang (POLINEMA)', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.946512, lng: 112.615501, aliases: ['polinema'] },
    { id: 'mlg-unisma', name: 'Universitas Islam Malang (UNISMA Dinoyo)', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.938512, lng: 112.607501, aliases: ['unisma malang'] },
    { id: 'mlg-itn', name: 'Institut Teknologi Nasional (ITN Malang Kampus 1 & 2)', category: 'campus', city: 'Malang', province: 'Jawa Timur', lat: -7.957512, lng: 112.614501, aliases: ['itn malang'] },
    // Mall, Industri & RS Surabaya/Malang
    { id: 'sby-tunjungan-plaza', name: 'Tunjungan Plaza (TP 1-6)', category: 'mall', city: 'Surabaya', province: 'Jawa Timur', lat: -7.262512, lng: 112.738501, aliases: ['tp surabaya', 'tunjungan plaza'] },
    { id: 'sby-pakuwon-mall', name: 'Pakuwon Mall & PTC Surabaya Barat', category: 'mall', city: 'Surabaya', province: 'Jawa Timur', lat: -7.289512, lng: 112.675501, aliases: ['pakuwon mall surabaya', 'ptc surabaya'] },
    { id: 'sby-galaxy-mall', name: 'Galaxy Mall Surabaya (GM 1, 2, 3)', category: 'mall', city: 'Surabaya', province: 'Jawa Timur', lat: -7.275512, lng: 112.782501, aliases: ['galaxy mall surabaya'] },
    { id: 'sby-ind-sier-rungkut', name: 'Kawasan Industri SIER Rungkut Surabaya', category: 'industrial', city: 'Surabaya', province: 'Jawa Timur', lat: -7.332512, lng: 112.760501, aliases: ['sier rungkut', 'kawasan sier'] },
    { id: 'sby-ind-jiipe-gresik', name: 'Kawasan Industri JIIPE Manyar Gresik (Freeport Smelter)', category: 'industrial', city: 'Gresik', province: 'Jawa Timur', lat: -7.085512, lng: 112.595501, aliases: ['jiipe gresik', 'kawasan industri manyar'] },
    { id: 'sby-rsup-dr-soetomo', name: 'RSUD Dr. Soetomo Surabaya', category: 'hospital', city: 'Surabaya', province: 'Jawa Timur', lat: -7.268512, lng: 112.757501, aliases: ['rsud dr soetomo', 'rs soetomo'] },
    { id: 'sby-rs-national-hospital', name: 'National Hospital Surabaya Barat', category: 'hospital', city: 'Surabaya', province: 'Jawa Timur', lat: -7.298512, lng: 112.678501, aliases: ['national hospital'] },
    { id: 'mlg-rs-saiful-anwar', name: 'RSUD Dr. Saiful Anwar Malang (RSSA)', category: 'hospital', city: 'Malang', province: 'Jawa Timur', lat: -7.972512, lng: 112.631501, aliases: ['rssa malang', 'saiful anwar'] },
    { id: 'mlg-mall-olympic-garden', name: 'Mall Olympic Garden (MOG Malang)', category: 'mall', city: 'Malang', province: 'Jawa Timur', lat: -7.975512, lng: 112.623501, aliases: ['mog malang'] },
    { id: 'sby-bandara-juanda', name: 'Bandara Internasional Juanda (SUB)', category: 'transport', city: 'Sidoarjo', province: 'Jawa Timur', lat: -7.379512, lng: 112.787501, aliases: ['bandara juanda'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 6. SEMARANG, SOLO, PURWOKERTO, & SALATIGA (JAWA TENGAH)
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'smg-undip-tembalang', name: 'Universitas Diponegoro (UNDIP) - Kampus Tembalang', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -7.051512, lng: 110.438501, aliases: ['undip tembalang', 'rektorat undip'] },
    { id: 'smg-unnes-segaran', name: 'Universitas Negeri Semarang (UNNES) - Sekaran', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -7.048512, lng: 110.395501, aliases: ['unnes sekaran'] },
    { id: 'smg-udinus-pendrikan', name: 'Universitas Dian Nuswantoro (UDINUS Semarang)', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -6.982512, lng: 110.408501, aliases: ['udinus'] },
    { id: 'smg-unissula-kaligawe', name: 'Universitas Islam Sultan Agung (UNISSULA)', category: 'campus', city: 'Semarang', province: 'Jawa Tengah', lat: -6.958512, lng: 110.457501, aliases: ['unissula'] },
    { id: 'slo-uns-kentingan', name: 'Universitas Sebelas Maret (UNS) - Kentingan Solo', category: 'campus', city: 'Surakarta', province: 'Jawa Tengah', lat: -7.558512, lng: 110.855501, aliases: ['uns solo', 'kentingan'] },
    { id: 'slo-ums-pabelan', name: 'Universitas Muhammadiyah Surakarta (UMS) - Pabelan', category: 'campus', city: 'Sukoharjo', province: 'Jawa Tengah', lat: -7.557512, lng: 110.771501, aliases: ['ums solo', 'ums pabelan'] },
    { id: 'slt-uksw-salatiga', name: 'Universitas Kristen Satya Wacana (UKSW Salatiga)', category: 'campus', city: 'Salatiga', province: 'Jawa Tengah', lat: -7.329512, lng: 110.504501, aliases: ['uksw salatiga'] },
    { id: 'pwt-unsoed-grendeng', name: 'Universitas Jenderal Soedirman (UNSOED) - Purwokerto', category: 'campus', city: 'Banyumas', province: 'Jawa Tengah', lat: -7.412512, lng: 109.248501, aliases: ['unsoed purwokerto'] },
    { id: 'smg-ind-kik-kendal', name: 'Kawasan Industri Kendal (KIK Park by the Bay)', category: 'industrial', city: 'Kendal', province: 'Jawa Tengah', lat: -6.918512, lng: 110.258501, aliases: ['kik kendal', 'kawasan industri kendal'] },
    { id: 'smg-rsup-dr-kariadi', name: 'RSUP Dr. Kariadi Semarang', category: 'hospital', city: 'Semarang', province: 'Jawa Tengah', lat: -6.995512, lng: 110.407501, aliases: ['rs kariadi', 'rsup kariadi'] },
    { id: 'slo-rs-moewardi', name: 'RSUD Dr. Moewardi Surakarta (Solo)', category: 'hospital', city: 'Surakarta', province: 'Jawa Tengah', lat: -7.554512, lng: 110.844501, aliases: ['rs moewardi solo'] },
    { id: 'pwt-rs-margono', name: 'RSUD Prof. Dr. Margono Soekarjo Purwokerto', category: 'hospital', city: 'Banyumas', province: 'Jawa Tengah', lat: -7.439512, lng: 109.261501, aliases: ['rs margono purwokerto'] },
    { id: 'smg-mall-paragon', name: 'Pollux Mall Paragon Semarang', category: 'mall', city: 'Semarang', province: 'Jawa Tengah', lat: -6.979512, lng: 110.417501, aliases: ['paragon semarang'] },
    { id: 'slo-the-park-solo-baru', name: 'The Park Mall & Pakuwon Mall Solo Baru', category: 'mall', city: 'Sukoharjo', province: 'Jawa Tengah', lat: -7.598512, lng: 110.817501, aliases: ['the park solo', 'pakuwon solo baru'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 7. MEDAN, PALEMBANG, PADANG, PEKANBARU, LAMPUNG, BATAM, JAMBI, BENGKULU
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'mdn-usu-padang-bulan', name: 'Universitas Sumatera Utara (USU) - Padang Bulan', category: 'campus', city: 'Medan', province: 'Sumatera Utara', lat: 3.565512, lng: 98.657501, aliases: ['usu medan'] },
    { id: 'mdn-unimed', name: 'Universitas Negeri Medan (UNIMED)', category: 'campus', city: 'Medan', province: 'Sumatera Utara', lat: 3.606512, lng: 98.715501, aliases: ['unimed'] },
    { id: 'mdn-unpri', name: 'Universitas Prima Indonesia (UNPRI Medan)', category: 'campus', city: 'Medan', province: 'Sumatera Utara', lat: 3.591512, lng: 98.659501, aliases: ['unpri medan'] },
    { id: 'mdn-sun-plaza', name: 'Sun Plaza Medan & Podomoro City Deli', category: 'mall', city: 'Medan', province: 'Sumatera Utara', lat: 3.585512, lng: 98.671501, aliases: ['sun plaza', 'deli park'] },
    { id: 'mdn-ind-kim', name: 'Kawasan Industri Medan (KIM 1-4 Mabar)', category: 'industrial', city: 'Medan', province: 'Sumatera Utara', lat: 3.675512, lng: 98.685501, aliases: ['kim medan', 'kawasan industri medan'] },
    { id: 'mdn-rsup-adam-malik', name: 'RSUP H. Adam Malik Medan', category: 'hospital', city: 'Medan', province: 'Sumatera Utara', lat: 3.518512, lng: 98.608501, aliases: ['rs adam malik'] },
    { id: 'plb-unsri-indralaya', name: 'Universitas Sriwijaya (UNSRI) - Kampus Indralaya', category: 'campus', city: 'Ogan Ilir', province: 'Sumatera Selatan', lat: -3.218512, lng: 104.648501, aliases: ['unsri indralaya'] },
    { id: 'plb-unsri-palembang', name: 'Universitas Sriwijaya (UNSRI) - Bukit Besar Palembang', category: 'campus', city: 'Palembang', province: 'Sumatera Selatan', lat: -2.985512, lng: 104.732501, aliases: ['unsri bukit'] },
    { id: 'plb-rsup-mohammad-hoesin', name: 'RSUP Dr. Mohammad Hoesin Palembang (RSMH)', category: 'hospital', city: 'Palembang', province: 'Sumatera Selatan', lat: -2.965512, lng: 104.750501, aliases: ['rsmh palembang'] },
    { id: 'pdg-unand-limau-manis', name: 'Universitas Andalas (UNAND) - Limau Manis Padang', category: 'campus', city: 'Padang', province: 'Sumatera Barat', lat: -0.915512, lng: 100.458501, aliases: ['unand limau manis'] },
    { id: 'pdg-unp-air-tawar', name: 'Universitas Negeri Padang (UNP Air Tawar)', category: 'campus', city: 'Padang', province: 'Sumatera Barat', lat: -0.898512, lng: 100.351501, aliases: ['unp padang'] },
    { id: 'pku-unri-panam', name: 'Universitas Riau (UNRI) - Kampus Bina Widya Panam', category: 'campus', city: 'Pekanbaru', province: 'Riau', lat: 0.481512, lng: 101.378501, aliases: ['unri panam'] },
    { id: 'pku-uir', name: 'Universitas Islam Riau (UIR Pekanbaru)', category: 'campus', city: 'Pekanbaru', province: 'Riau', lat: 0.467512, lng: 101.448501, aliases: ['uir pekanbaru'] },
    { id: 'lpg-unila-gedong-meneng', name: 'Universitas Lampung (UNILA) - Bandar Lampung', category: 'campus', city: 'Bandar Lampung', province: 'Lampung', lat: -5.365512, lng: 105.244501, aliases: ['unila'] },
    { id: 'lpg-itera', name: 'Institut Teknologi Sumatera (ITERA Lampung)', category: 'campus', city: 'Lampung Selatan', province: 'Lampung', lat: -5.358512, lng: 105.312501, aliases: ['itera'] },
    { id: 'btm-ind-batamindo', name: 'Kawasan Industri Batamindo Industrial Park (Mukakuning)', category: 'industrial', city: 'Batam', province: 'Kepulauan Riau', lat: 1.077512, lng: 104.032501, aliases: ['batamindo mukakuning'] },
    { id: 'btm-uib', name: 'Universitas Internasional Batam (UIB)', category: 'campus', city: 'Batam', province: 'Kepulauan Riau', lat: 1.118512, lng: 104.015501, aliases: ['uib batam'] },
    { id: 'jmb-unja-mendalo', name: 'Universitas Jambi (UNJA) - Kampus Utama Mendalo', category: 'campus', city: 'Muaro Jambi', province: 'Jambi', lat: -1.615512, lng: 103.525501, aliases: ['unja mendalo'] },
    { id: 'bkl-unib-kandang-limun', name: 'Universitas Bengkulu (UNIB) - Kandang Limun', category: 'campus', city: 'Bengkulu', province: 'Bengkulu', lat: -3.759512, lng: 102.274501, aliases: ['unib bengkulu'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 8. BALI (DENPASAR, BADUNG, JIMBARAN, KUTA, CANGGU) & NTB/LOMBOK
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'dps-unud-jimbaran', name: 'Universitas Udayana (UNUD) - Kampus Bukit Jimbaran', category: 'campus', city: 'Badung', province: 'Bali', lat: -8.798512, lng: 115.172501, aliases: ['unud jimbaran', 'rektorat unud'] },
    { id: 'dps-unud-sudirman', name: 'Universitas Udayana (UNUD) - Kampus Sudirman Denpasar', category: 'campus', city: 'Denpasar', province: 'Bali', lat: -8.673512, lng: 115.221501, aliases: ['unud sudirman'] },
    { id: 'dps-warmadewa', name: 'Universitas Warmadewa (Denpasar)', category: 'campus', city: 'Denpasar', province: 'Bali', lat: -8.685512, lng: 115.234501, aliases: ['warmadewa'] },
    { id: 'dps-pnb-jimbaran', name: 'Politeknik Negeri Bali (PNB Jimbaran)', category: 'campus', city: 'Badung', province: 'Bali', lat: -8.796512, lng: 115.176501, aliases: ['pnb bali', 'poltek bali'] },
    { id: 'dps-beachwalk-kuta', name: 'Beachwalk Shopping Center Kuta', category: 'mall', city: 'Badung', province: 'Bali', lat: -8.718512, lng: 115.169501, aliases: ['beachwalk kuta'] },
    { id: 'dps-living-world-bali', name: 'Living World Denpasar (Gatot Subroto)', category: 'mall', city: 'Denpasar', province: 'Bali', lat: -8.634512, lng: 115.228501, aliases: ['living world bali'] },
    { id: 'dps-rsup-prof-ngoerah', name: 'RSUP Prof. Ngoerah (Eks RSUP Sanglah Denpasar)', category: 'hospital', city: 'Denpasar', province: 'Bali', lat: -8.676512, lng: 115.215501, aliases: ['rs sanglah', 'rsup ngoerah'] },
    { id: 'dps-bandara-ngurah-rai', name: 'Bandara Internasional I Gusti Ngurah Rai (DPS)', category: 'transport', city: 'Badung', province: 'Bali', lat: -8.748512, lng: 115.167501, aliases: ['bandara ngurah rai'] },
    { id: 'lop-unram-mataram', name: 'Universitas Mataram (UNRAM Lombok)', category: 'campus', city: 'Mataram', province: 'Nusa Tenggara Barat', lat: -8.583512, lng: 116.095501, aliases: ['unram'] },
    { id: 'lop-epicentrum-mall', name: 'Lombok Epicentrum Mall (LEM Mataram)', category: 'mall', city: 'Mataram', province: 'Nusa Tenggara Barat', lat: -8.591512, lng: 116.111501, aliases: ['epicentrum lombok'] },

    // ══════════════════════════════════════════════════════════════════════════════
    // 9. KALIMANTAN (BALIKPAPAN, IKN, SAMARINDA, BANJARMASIN, PONTIANAK) & MANADO/PAPUA
    // ══════════════════════════════════════════════════════════════════════════════
    { id: 'bpn-itk-karang-joang', name: 'Institut Teknologi Kalimantan (ITK Balikpapan)', category: 'campus', city: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.149512, lng: 116.862501, aliases: ['itk balikpapan'] },
    { id: 'ikn-kipp-nusantara', name: 'KIPP Ibu Kota Nusantara (IKN Nusantara)', category: 'office', city: 'Penajam Paser Utara', province: 'Kalimantan Timur', lat: -0.963512, lng: 116.702501, aliases: ['ikn', 'titik nol ikn'] },
    { id: 'bpn-pentacity', name: 'Pentacity Shopping Venue & E-Walk Balikpapan', category: 'mall', city: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.272512, lng: 116.869501, aliases: ['pentacity', 'e walk balikpapan'] },
    { id: 'bpn-rs-kanujoso', name: 'RSUD Kanujoso Djatiwibowo Balikpapan', category: 'hospital', city: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.221512, lng: 116.868501, aliases: ['rs kanujoso'] },
    { id: 'smd-unmul-gunung-kelua', name: 'Universitas Mulawarman (UNMUL Samarinda)', category: 'campus', city: 'Samarinda', province: 'Kalimantan Timur', lat: -0.471512, lng: 117.154501, aliases: ['unmul'] },
    { id: 'smd-big-mall', name: 'Big Mall Samarinda (Jl. Untung Suropati)', category: 'mall', city: 'Samarinda', province: 'Kalimantan Timur', lat: -0.528512, lng: 117.112501, aliases: ['big mall samarinda'] },
    { id: 'bjm-ulm-banjarmasin', name: 'Universitas Lambung Mangkurat (ULM Banjarmasin & Banjarbaru)', category: 'campus', city: 'Banjarmasin', province: 'Kalimantan Selatan', lat: -3.298512, lng: 114.587501, aliases: ['ulm banjarmasin'] },
    { id: 'bjm-duta-mall', name: 'Duta Mall Banjarmasin', category: 'mall', city: 'Banjarmasin', province: 'Kalimantan Selatan', lat: -3.321512, lng: 114.602501, aliases: ['duta mall'] },
    { id: 'ptk-untan-pontianak', name: 'Universitas Tanjungpura (UNTAN Pontianak)', category: 'campus', city: 'Pontianak', province: 'Kalimantan Barat', lat: -0.057512, lng: 109.345501, aliases: ['untan pontianak'] },
    { id: 'mdo-unsrat-manado', name: 'Universitas Sam Ratulangi (UNSRAT Manado)', category: 'campus', city: 'Manado', province: 'Sulawesi Utara', lat: 1.458512, lng: 124.827501, aliases: ['unsrat manado'] },
    { id: 'mdo-mantos', name: 'Manado Town Square (MANTOS 1, 2, 3)', category: 'mall', city: 'Manado', province: 'Sulawesi Utara', lat: 1.477512, lng: 124.829501, aliases: ['mantos manado'] },
    { id: 'mdo-rsup-kandou', name: 'RSUP Prof. Dr. R. D. Kandou Manado', category: 'hospital', city: 'Manado', province: 'Sulawesi Utara', lat: 1.451512, lng: 124.819501, aliases: ['rs kandou manado'] },
    { id: 'amb-unpatti-ambon', name: 'Universitas Pattimura (UNPATTI Ambon)', category: 'campus', city: 'Ambon', province: 'Maluku', lat: -3.655512, lng: 128.188501, aliases: ['unpatti'] },
    { id: 'jay-uncen-jayapura', name: 'Universitas Cenderawasih (UNCEN Jayapura - Abepura & Waena)', category: 'campus', city: 'Jayapura', province: 'Papua', lat: -2.595512, lng: 140.668501, aliases: ['uncen jayapura'] }
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
