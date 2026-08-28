import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { FORMAT_CURRENCY } from '../../constants';
import { 
    Users, 
    Calendar, 
    Clock, 
    AlertTriangle, 
    CheckCircle2, 
    DollarSign, 
    DoorClosed, 
    RotateCw, 
    LogOut, 
    MessageSquare, 
    Phone, 
    FileText, 
    Eye, 
    Search, 
    Sparkles, 
    Bed, 
    CreditCard, 
    X,
    Building2,
    ShieldAlert,
    ExternalLink,
    Grid,
    Radio,
    Megaphone,
    Share2,
    Key,
    Wifi,
    Zap,
    Building,
    Check,
    Layers,
    ShieldCheck,
    ArrowUpRight,
    TrendingUp,
    MapPin,
    Camera,
    ZoomIn,
    Bath,
    CookingPot,
    ChevronLeft,
    ChevronRight,
    Home,
    Lock,
    AppWindow,
    Plus,
    Trash2,
    Navigation
} from 'lucide-react';
import { KostManagerPackage } from '../../types';
import { 
    getResidentStatus, 
    getManualInvoices, 
    saveManualInvoice, 
    updateManualInvoiceStatus, 
    uploadFileAndGetURL, 
    addPropertyWithMedia, 
    updatePropertyWithMedia,
    getKostManagerPackages,
    saveKostManagerPackage,
    deleteKostManagerPackage
} from '../../adminService';


// Helper: Normalisasi URL Foto (Handle string, object { url, label }, dsb.)
const normalizePhotoUrl = (photo: any): string => {
    if (!photo) return '';
    if (typeof photo === 'string') return photo;
    return photo.url || photo.original || photo.original_url || photo.photo_url || photo.file_url || photo.src || '';
};

const normalizePhotoList = (photos: any[]): string[] => {
    if (!Array.isArray(photos)) return [];
    return photos.map(normalizePhotoUrl).filter(Boolean);
};

// Google Maps LocationPicker Component
const LocationPicker: React.FC<{ lat: number; lng: number; onLocationChange: (lat: number, lng: number, address: string, city?: string, area?: string) => void }> = ({ lat, lng, onLocationChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);
    const geocoderInstance = useRef<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const reverseGeocode = (latVal: number, lngVal: number) => {
        if (!geocoderInstance.current) return;
        geocoderInstance.current.geocode({ location: { lat: latVal, lng: lngVal } }, (results: any[], status: string) => {
            if (status === 'OK' && results[0]) {
                const result = results[0];
                const addressStr = result.formatted_address;
                const components = result.address_components || [];
                const getComp = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || '';
                const city = getComp('locality') || getComp('administrative_area_level_2') || getComp('administrative_area_level_1');
                const area = getComp('sublocality_level_1') || getComp('sublocality') || getComp('neighborhood');
                setSearchQuery(addressStr);
                onLocationChange(latVal, lngVal, addressStr, city, area);
            } else {
                onLocationChange(latVal, lngVal, `GPS: ${latVal.toFixed(6)}, ${lngVal.toFixed(6)}`);
            }
        });
    };

    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstance.current) return;

        const google = (window as any).google;
        if (!google?.maps) {
            console.error("Google Maps API not loaded");
            return;
        }

        const initialLatLng = { lat, lng };

        const map = new google.maps.Map(mapContainerRef.current, {
            center: initialLatLng,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
        });

        const marker = new google.maps.Marker({
            position: initialLatLng,
            map,
            draggable: true,
        });

        geocoderInstance.current = new google.maps.Geocoder();

        marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            reverseGeocode(pos.lat(), pos.lng());
        });

        map.addListener('click', (e: any) => {
            marker.setPosition(e.latLng);
            reverseGeocode(e.latLng.lat(), e.latLng.lng());
        });

        mapInstance.current = map;
        markerInstance.current = marker;

        if (searchInputRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
                componentRestrictions: { country: 'id' },
                fields: ['geometry', 'formatted_address', 'address_components'],
            });
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (!place.geometry?.location) return;
                const newLat = place.geometry.location.lat();
                const newLng = place.geometry.location.lng();
                map.setCenter({ lat: newLat, lng: newLng });
                map.setZoom(17);
                marker.setPosition({ lat: newLat, lng: newLng });
                const components = place.address_components || [];
                const getComp = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || '';
                const city = getComp('locality') || getComp('administrative_area_level_2') || getComp('administrative_area_level_1');
                const area = getComp('sublocality_level_1') || getComp('sublocality') || getComp('neighborhood');
                setSearchQuery(place.formatted_address || '');
                onLocationChange(newLat, newLng, place.formatted_address || '', city, area);
            });
        }
    }, []);

    useEffect(() => {
        if (markerInstance.current && mapInstance.current) {
            const google = (window as any).google;
            if (!google?.maps) return;
            const currentPos = markerInstance.current.getPosition();
            if (!currentPos || Math.abs(currentPos.lat() - lat) > 0.0001 || Math.abs(currentPos.lng() - lng) > 0.0001) {
                markerInstance.current.setPosition({ lat, lng });
                mapInstance.current.setCenter({ lat, lng });
            }
        }
    }, [lat, lng]);

    return (
        <div className="flex flex-col gap-2">
            <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 Cari lokasi / nama jalan / nama tempat..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <div ref={mapContainerRef} style={{ height: '300px', width: '100%', borderRadius: '0.75rem', zIndex: 0 }} />
        </div>
    );
};

interface KostManagerPortalProps {
    isAdmin: boolean;
    activeMenu?: string;
    onMenuChange?: (menu: any) => void;
    onBack: () => void;
}

interface ManagedProperty {
    id: string;
    title: string;
    description?: string;
    address: string;
    city: string;
    area?: string;
    owner_uid: string;
    type: string;
    price: number;
    room_types: any[];
    status: string;
    empty_rooms?: number;
    owner_name?: string;
    owner_phone?: string;
    occupant_count?: number;
    location?: { lat: number; lng: number };
    facilities?: string[];
    additional_fee_price?: number;
    additional_fee_name?: string;
    additional_fee_starts_from?: string;
    campuses?: any[];
    public_facilities?: any[];
    image_urls?: any[];
    video_urls?: any[];
    instagram_url?: string;
    tiktok_url?: string;
    omnichannel_contact_name?: string;
    omnichannel_contact_phone?: string;
    omnichannel_contact_type?: string;
    rules?: string[];
}

interface TenantRecord {
    id: string;
    user_id: string;
    kost_id: string;
    room_type: string;
    start_date: string;
    end_date: string;
    status: string;
    metadata: any;
    user?: {
        name: string;
        phone: string;
        email: string;
        photo_url?: string;
    };
    property?: {
        title: string;
        address: string;
    };
}

interface InvoiceRecord {
    id: string;
    bill_number: string;
    bill_date: string;
    due_date: string;
    category: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    kost_name: string;
    rental_amount: number;
    commission_percent: number;
    commission_amount: number;
    items: any[];
    notes: string;
    total: number;
    status: 'issued' | 'paid' | 'cancelled';
    created_at: string;
}


// --- TENANT LIFECYCLE ENGINE TYPES & HELPERS ---
export interface TenantLifecycleInfo {
    status: 'ACTIVE_RUNNING' | 'DUE_SOON' | 'OVERDUE' | 'CHECKOUT_PLANNED' | 'CHECKED_OUT';
    label: string;
    color: string;
    badgeClass: string;
    daysDiff: number;
    daysText: string;
    dueDateFormatted: string;
    isOverdue: boolean;
    isDueSoon: boolean;
}

export const calculateTenantLifecycle = (startDate?: string, endDate?: string, status?: string): TenantLifecycleInfo => {
    if (status === 'CHECKED_OUT' || status === 'INACTIVE' || status === 'Habis') {
        return {
            status: 'CHECKED_OUT',
            label: 'Alumni / Keluar',
            color: 'slate',
            badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
            daysDiff: 0,
            daysText: 'Sewa Selesai',
            dueDateFormatted: endDate || '-',
            isOverdue: false,
            isDueSoon: false
        };
    }

    if (status === 'CHECKOUT_PLANNED') {
        return {
            status: 'CHECKOUT_PLANNED',
            label: 'Rencana Keluar',
            color: 'purple',
            badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-400/20',
            daysDiff: 0,
            daysText: 'Move-Out Disiapkan',
            dueDateFormatted: endDate || '-',
            isOverdue: false,
            isDueSoon: false
        };
    }

    if (!endDate || endDate === 'Sewa Berjalan') {
        return {
            status: 'ACTIVE_RUNNING',
            label: 'Sewa Berjalan',
            color: 'emerald',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            daysDiff: 999,
            daysText: 'Sewa Berjalan',
            dueDateFormatted: 'Sewa Berjalan',
            isOverdue: false,
            isDueSoon: false
        };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const due = new Date(endDate);
    due.setHours(0, 0, 0, 0);

    if (isNaN(due.getTime())) {
        return {
            status: 'ACTIVE_RUNNING',
            label: 'Sewa Berjalan',
            color: 'emerald',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            daysDiff: 999,
            daysText: 'Sewa Berjalan',
            dueDateFormatted: endDate,
            isOverdue: false,
            isDueSoon: false
        };
    }

    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        const daysLate = Math.abs(diffDays);
        return {
            status: 'OVERDUE',
            label: `Menunggak (+${daysLate} Hari)`,
            color: 'rose',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20 font-black animate-pulse',
            daysDiff: diffDays,
            daysText: `Terlambat ${daysLate} hari`,
            dueDateFormatted: endDate,
            isOverdue: true,
            isDueSoon: false
        };
    } else if (diffDays <= 7) {
        return {
            status: 'DUE_SOON',
            label: diffDays === 0 ? 'Jatuh Tempo Hari Ini!' : `Jatuh Tempo H-${diffDays}`,
            color: 'amber',
            badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-500/20 font-black',
            daysDiff: diffDays,
            daysText: diffDays === 0 ? 'Hari ini' : `${diffDays} hari lagi`,
            dueDateFormatted: endDate,
            isOverdue: false,
            isDueSoon: true
        };
    } else {
        return {
            status: 'ACTIVE_RUNNING',
            label: 'Sewa Berjalan',
            color: 'emerald',
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            daysDiff: diffDays,
            daysText: `${diffDays} hari lagi`,
            dueDateFormatted: endDate,
            isOverdue: false,
            isDueSoon: false
        };
    }
};

export const generateTenantWhatsAppReminder = (t: TenantRecord) => {
    const phone = (t.user?.phone || t.metadata?.phone || '').replace(/[^0-9]/g, '');
    if (!phone) return '#';

    const life = calculateTenantLifecycle(t.start_date, t.end_date, t.status);
    const tenantName = t.user?.name || 'Kak';
    const kostTitle = t.property?.title || 'Kost';
    const roomName = t.room_type || 'Kamar';
    const rentAmount = FORMAT_CURRENCY(Number(t.metadata?.basePrice) || Number(t.metadata?.price) || 0);

    let msg = '';
    if (life.isOverdue) {
        msg = `Halo Kak *${tenantName}* 👋,\n\nKami dari Manajemen *${kostTitle}* (RuangSinggah KostManager) ingin menginformasikan bahwa tagihan sewa bulanan untuk unit *${roomName}* sebesar *${rentAmount}* telah melewati tanggal jatuh tempo (${life.dueDateFormatted}).\n\nMohon untuk segera melakukan pembayaran atau konfirmasi kepada kami. Terima kasih atas kerjasamanya! 🙏`;
    } else if (life.isDueSoon) {
        msg = `Halo Kak *${tenantName}* 👋,\n\nPengingat ramah dari Manajemen *${kostTitle}* (RuangSinggah KostManager):\nTagihan sewa bulanan untuk unit *${roomName}* sebesar *${rentAmount}* akan jatuh tempo pada *${life.dueDateFormatted}* (${life.daysText}).\n\nMohon konfirmasi pembayaran atau perpanjangan sewa. Terima kasih banyak! ✨`;
    } else {
        msg = `Halo Kak *${tenantName}* 👋,\n\nSalam dari Manajemen *${kostTitle}* (RuangSinggah KostManager).\nIni rincian data sewa unit *${roomName}* Anda (Tarif: *${rentAmount}*).\n\nAda yang bisa kami bantu terkait fasilitas atau kenyamanan kamar Anda?`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};

const KostManagerPortal: React.FC<KostManagerPortalProps> = ({ isAdmin, activeMenu, onMenuChange, onBack }) => {
    // --- TABS STATE & ROUTING ---
    const activeTab = (() => {
        if (!activeMenu) return 'overview';
        if (activeMenu.startsWith('km_')) {
            return activeMenu.substring(3) as 'overview' | 'properties' | 'tenants' | 'billing' | 'packages';
        }
        return 'overview';
    })();

    const setActiveTab = (tab: 'overview' | 'properties' | 'tenants' | 'billing' | 'packages') => {
        if (onMenuChange) {
            onMenuChange('km_' + tab);
        }
    };


    // Auto redirect removed to fix Back to Admin button functionality.


    // --- DATA STATE ---
    const [properties, setProperties] = useState<ManagedProperty[]>([]);
    const [tenants, setTenants] = useState<TenantRecord[]>([]);
    const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [ownersList, setOwnersList] = useState<{ id: string; name: string; phone: string }[]>([]);
    const [packages, setPackages] = useState<KostManagerPackage[]>([]);
    const [isAddPkgOpen, setIsAddPkgOpen] = useState(false);
    const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
    const [pkgForm, setPkgForm] = useState({
        duration_months: 1,
        price: 0,
        label: '',
        is_active: true
    });
    const [savingPkg, setSavingPkg] = useState(false);

    // --- UI/MODAL STATE ---
    const [isAddBillOpen, setIsAddBillOpen] = useState<boolean>(false);
    const [submittingBill, setSubmittingBill] = useState<boolean>(false);
    const [selectedTenantIdForBill, setSelectedTenantIdForBill] = useState<string>('');
    const [billForm, setBillForm] = useState({
        dueDate: '',
        notes: '',
        rentalAmount: 0,
        extraFee: 0,
        extraFeeName: ''
    });

    const DEFAULT_PROP_FORM = {
        title: '',
        description: '',
        address: '',
        city: '',
        area: '',
        province: '',
        type: 'Campur',
        price: 0,
        owner_uid: '',
        location: { lat: -6.2088, lng: 106.8456 },
        facilities: [] as string[],
        imageUrls: [] as string[],
        videoUrls: [] as string[],
        instagramUrl: '',
        tiktokUrl: '',
        rules: [] as string[],
        campuses: [] as any[],
        publicFacilities: [] as any[],
        additionalFeePrice: 0,
        additionalFeeName: '',
        additionalFeeStartsFrom: 'month_1' as 'month_1' | 'month_2',
        omnichannelContactName: '',
        omnichannelContactPhone: '',
        omnichannelContactType: 'owner' as 'owner' | 'caretaker',
        roomTypes: [
            {
                name: 'Standard',
                price: 1000000,
                size: '3x4m',
                maxOccupants: 1,
                roomFacilities: [] as string[],
                bathroomFacilities: [] as string[],
                rooms: [
                    { roomNumber: '101', status: 'kosong', tenantName: '', tenantPhone: '', billingPeriod: 'bulanan', dueDate: '', images: [] as string[] }
                ]
            }
        ]
    };

    const [isAddPropOpen, setIsAddPropOpen] = useState<boolean>(false);
    const [savingProp, setSavingProp] = useState<boolean>(false);
    const [newPropForm, setNewPropForm] = useState(DEFAULT_PROP_FORM);

    const [propertySearch, setPropertySearch] = useState('');
    const [tenantSearch, setTenantSearch] = useState('');
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [selectedPropForRoomDetail, setSelectedPropForRoomDetail] = useState<ManagedProperty | null>(null);
    const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

    // Lifecycle Filter Tab State
    const [tenantLifecycleFilter, setTenantLifecycleFilter] = useState<'ALL' | 'ACTIVE' | 'DUE_SOON' | 'OVERDUE' | 'CHECKOUT'>('ALL');

    // Operational Modals States (Renew, Checkout, Detail)
    const [selectedTenantForRenew, setSelectedTenantForRenew] = useState<TenantRecord | null>(null);
    const [renewMonths, setRenewMonths] = useState<number>(1);
    const [isRenewing, setIsRenewing] = useState<boolean>(false);

    const [selectedTenantForCheckout, setSelectedTenantForCheckout] = useState<TenantRecord | null>(null);
    const [checkoutNotes, setCheckoutNotes] = useState<string>('');
    const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

    const [selectedTenantForDetail, setSelectedTenantForDetail] = useState<TenantRecord | null>(null);

    // Property Command Center Modals (Room Matrix & Broadcast)
    const [selectedPropForRoomMatrix, setSelectedPropForRoomMatrix] = useState<ManagedProperty | null>(null);
    const [selectedPropForBroadcast, setSelectedPropForBroadcast] = useState<ManagedProperty | null>(null);
    const [broadcastCategory, setBroadcastCategory] = useState<'LISTRIK_AIR' | 'KEBERSIHAN' | 'TAGIHAN' | 'TATA_TERTIB' | 'KUSTOM'>('LISTRIK_AIR');
    const [broadcastCustomText, setBroadcastCustomText] = useState<string>('');




    // --- FETCH DATA ---
    const loadAllData = async () => {
        setLoading(true);
        try {
            // Load packages first so it doesn't get blocked by early returns
            const pkgs = await getKostManagerPackages();
            setPackages(pkgs);

            // 1. Ambil owner (mitra) dengan status langganan kostmanager
            const { data: mitras } = await supabase
                .from('mitra')
                .select('user_id, business_name, business_address')
                .eq('subscription_status', 'kostmanager');

            const ownerIds = mitras?.map(m => m.user_id).filter(Boolean) || [];

            // 2. Ambil kostmanager_requests yang ACTIVE untuk property tambahan
            const { data: kmRequests } = await supabase
                .from('kostmanager_requests')
                .select('id, user_id, kost_name, empty_rooms, property_id')
                .eq('status', 'ACTIVE');

            const reqOwnerIds = kmRequests?.map(r => r.user_id).filter(Boolean) || [];
            const reqPropertyIds = kmRequests?.map(r => r.property_id).filter(Boolean) || [];

            // 3. Ambil data properti dan filter HANYA properti yang terdaftar sebagai kelolaan KostManager
            const { data: allRawProps, error: pErr } = await supabase
                .from('properties')
                .select('*')
                .neq('status', 'draft')
                .order('created_at', { ascending: false });

            if (pErr) throw pErr;

            // Filter ketat isolasi: Hanya properti KostManager (is_managed = true atau milik mitra berlangganan/request aktif)
            const props = (allRawProps || []).filter((p: any) => {
                const isManagedFlag = p.is_managed === true;
                const isSubscribedOwner = ownerIds.includes(p.owner_uid);
                const isActiveRequestOwner = reqOwnerIds.includes(p.owner_uid);
                const isLinkedActiveRequest = Boolean(p.id && reqPropertyIds.includes(p.id));
                return isManagedFlag || isSubscribedOwner || isActiveRequestOwner || isLinkedActiveRequest;
            });

            const propOwnerIds = props.map((p: any) => p.owner_uid).filter(Boolean);
            const allRelevantOwnerUids = [...new Set([...ownerIds, ...reqOwnerIds, ...propOwnerIds])];

            // 4. Ambil seluruh daftar pemilik (mitra) dari platform untuk dropdown modal
            const { data: allMitraUsers } = await supabase
                .from('users')
                .select('id, name, phone, email')
                .in('role', ['owner', 'mitra']);
            
            const finalOwnersList = allMitraUsers?.map(o => ({
                id: o.id,
                name: o.name || 'Owner RuangSinggah',
                phone: o.phone || '-'
            })) || [];
            setOwnersList(finalOwnersList);

            // 5. Ambil data users pemilik (mitra) untuk info kontak properti ter-load
            let ownerMap = new Map();
            if (allRelevantOwnerUids.length > 0) {
                const { data: owners } = await supabase
                    .from('users')
                    .select('id, name, phone, email')
                    .in('id', allRelevantOwnerUids);
                ownerMap = new Map(owners?.map(o => [o.id, o]) || []);
            }

            // 6. Ambil data resident_status (penyewa online dari DB)
            const allResidents = await getResidentStatus();
            const managedPropIds = props?.map(p => p.id) || [];
            const managedResidents: TenantRecord[] = (allResidents || []).filter((r: any) => managedPropIds.includes(r.kost_id));

            // 7. Ekstraksi penghuni terdata dari hasil pendataan kamar properti (offline/survey occupants)
            const propertyTenants: TenantRecord[] = [];
            (props || []).forEach(p => {
                const roomList = Array.isArray(p.room_types) ? p.room_types : [];
                roomList.forEach((rt: any, rIdx: number) => {
                    const isOccupied = rt.isAvailable === false || rt.status === 'Terisi' || Boolean(rt.residentName || rt.tenantName);
                    if (isOccupied) {
                        const tenantName = rt.residentName || rt.tenantName || `Penghuni Kamar ${rt.name || rIdx + 1}`;
                        const cleanRoomName = rt.name ? (String(rt.name).trim().toLowerCase().startsWith('kamar') ? rt.name : `Kamar ${rt.name}`) : `Kamar ${rIdx + 1}`;
                        const rentPrice = Number(rt.price) || Number(rt.monthlyPrice) || (Array.isArray(rt.pricing) && rt.pricing[0]?.price) || Number(p.price) || 0;

                        propertyTenants.push({
                            id: `prop-resident-${p.id}-${rIdx}`,
                            user_id: p.owner_uid,
                            kost_id: p.id,
                            room_type: cleanRoomName,
                            start_date: rt.startDate || rt.leaseStartDate || rt.start_date || (p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
                            end_date: rt.endDate || rt.leaseEndDate || rt.end_date || 'Sewa Berjalan',
                            status: 'ACTIVE',
                            metadata: {
                                basePrice: rentPrice,
                                price: rentPrice,
                                facilityFee: 0,
                                extraPersonFee: Number(rt.extraOccupantFee) || 0,
                                billingPeriod: rt.paymentPeriod || rt.billingPeriod || 'bulanan',
                                phone: rt.residentPhone || rt.tenantPhone || '-',
                                isSurveyOccupant: true
                            },
                            user: {
                                name: tenantName,
                                phone: rt.residentPhone || rt.tenantPhone || '-',
                                email: rt.residentEmail || rt.tenantEmail || '-',
                                photo_url: rt.residentKtpUrl || ''
                            },
                            property: {
                                title: p.title || 'Kost',
                                address: p.address || ''
                            }
                        });
                    }
                });
            });

            // Gabungkan penyewa online + penghuni offline hasil survei (deduplikasi per kamar)
            const combinedTenants: TenantRecord[] = [...managedResidents];
            propertyTenants.forEach(pt => {
                const exists = combinedTenants.some(ct => ct.kost_id === pt.kost_id && ct.room_type?.toLowerCase() === pt.room_type?.toLowerCase());
                if (!exists) {
                    combinedTenants.push(pt);
                }
            });

            // Map data properties dengan jumlah penghuni akurat
            const mappedProperties: ManagedProperty[] = (props || []).map(p => {
                const req = kmRequests?.find(r => r.property_id === p.id || (r.user_id === p.owner_uid && r.kost_name?.toLowerCase() === p.title?.toLowerCase()) || r.kost_name?.toLowerCase() === p.title?.toLowerCase());
                const owner = ownerMap.get(p.owner_uid) || (req?.user_id ? ownerMap.get(req.user_id) : null);
                const occupants = combinedTenants.filter(r => r.kost_id === p.id && r.status === 'ACTIVE');

                const totalRooms = Array.isArray(p.room_types) ? p.room_types.length : 0;
                const emptyRoomsCalculated = totalRooms > 0 ? Math.max(0, totalRooms - occupants.length) : (req?.empty_rooms ?? 0);

                return {
                    id: p.id,
                    title: p.title || req?.kost_name || 'Kost Tanpa Nama',
                    description: p.description || '',
                    address: p.address || '',
                    city: p.city || '',
            province: p.province || '',
                    area: p.area || '',
                    owner_uid: p.owner_uid,
                    type: p.type || 'Campur',
                    price: Number(p.price) || 0,
                    room_types: Array.isArray(p.room_types) ? p.room_types : [],
                    status: p.status || 'active',
                    empty_rooms: emptyRoomsCalculated,
                    owner_name: owner?.name || 'Owner RuangSinggah',
                    owner_phone: owner?.phone || '-',
                    occupant_count: occupants.length,
                    location: p.location || { lat: -6.2088, lng: 106.8456 },
                    facilities: p.facilities || [],
                    additional_fee_price: p.additional_fee_price,
                    additional_fee_name: p.additional_fee_name,
                    additional_fee_starts_from: p.additional_fee_starts_from,
                    campuses: p.campuses || [],
                    public_facilities: p.public_facilities || [],
                    image_urls: p.image_urls || [],
                    video_urls: p.video_urls || [],
                    instagram_url: p.instagram_url || '',
                    tiktok_url: p.tiktok_url || '',
                    omnichannel_contact_name: p.omnichannel_contact_name || '',
                    omnichannel_contact_phone: p.omnichannel_contact_phone || '',
                    omnichannel_contact_type: p.omnichannel_contact_type || 'owner',
                    rules: p.rules || []
                };
            });

            // 8. Ambil tagihan manual (filter kategori sewa)
            const allInvoices = await getManualInvoices();
            const rentInvoices = managedPropIds.length === 0 ? [] : (allInvoices || []).filter((inv: any) => {
                if (inv.category !== 'sewa') return false;
                if (inv.kost_id && managedPropIds.includes(inv.kost_id)) return true;
                if (inv.kost_name) {
                    return mappedProperties.some(p =>
                        p.title?.toLowerCase().trim() === inv.kost_name?.toLowerCase().trim()
                    );
                }
                return false;
            });

            setProperties(mappedProperties);
            setTenants(combinedTenants);
            setInvoices(rentInvoices);
        } catch (err) {
            console.error('Error loading KostManager Portal data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    
    // Handler: Perpanjang Masa Sewa Penghuni
    const handleRenewLease = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantForRenew) return;

        setIsRenewing(true);
        try {
            const tenant = selectedTenantForRenew;
            const prop = properties.find(p => p.id === tenant.kost_id);
            if (!prop) throw new Error('Data properti tidak ditemukan');

            // Hitung tanggal akhir baru
            const currentEndDate = tenant.end_date && tenant.end_date !== 'Sewa Berjalan' ? new Date(tenant.end_date) : new Date();
            const newEndDate = new Date(currentEndDate);
            newEndDate.setMonth(newEndDate.getMonth() + Number(renewMonths));
            const newEndDateStr = newEndDate.toISOString().split('T')[0];
            const newStartDateStr = currentEndDate.toISOString().split('T')[0];

            // Update room_types di database
            const currentRooms = Array.isArray(prop.room_types) ? [...prop.room_types] : [];
            let updated = false;

            const newRooms = currentRooms.map((rt: any, idx: number) => {
                const rName = rt.name ? (String(rt.name).trim().toLowerCase().startsWith('kamar') ? rt.name : `Kamar ${rt.name}`) : `Kamar ${idx + 1}`;
                if (rName.toLowerCase() === tenant.room_type?.toLowerCase() || rt.residentName === tenant.user?.name) {
                    updated = true;
                    return {
                        ...rt,
                        startDate: newStartDateStr,
                        endDate: newEndDateStr,
                        status: 'Terisi',
                        isAvailable: false
                    };
                }
                return rt;
            });

            if (!updated && newRooms.length > 0) {
                newRooms[0] = {
                    ...newRooms[0],
                    startDate: newStartDateStr,
                    endDate: newEndDateStr,
                    status: 'Terisi',
                    isAvailable: false
                };
            }

            const { error: pErr } = await supabase
                .from('properties')
                .update({ 
                    room_types: newRooms,
                    updated_at: new Date().toISOString()
                })
                .eq('id', prop.id);

            if (pErr) throw pErr;

            alert(`✅ Masa sewa untuk ${tenant.user?.name} (${tenant.room_type}) berhasil diperpanjang ${renewMonths} bulan hingga ${newEndDateStr}!`);
            setSelectedTenantForRenew(null);
            await loadAllData();
        } catch (err: any) {
            console.error('Error renewing lease:', err);
            alert('Gagal memperpanjang sewa: ' + err.message);
        } finally {
            setIsRenewing(false);
        }
    };

    // Handler: Check-Out / Pelepasan Kamar Penghuni
    const handleCheckoutTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantForCheckout) return;

        setIsCheckingOut(true);
        try {
            const tenant = selectedTenantForCheckout;
            const prop = properties.find(p => p.id === tenant.kost_id);
            if (!prop) throw new Error('Data properti tidak ditemukan');

            // Update room_types di database: kosongkan kamar
            const currentRooms = Array.isArray(prop.room_types) ? [...prop.room_types] : [];
            const newRooms = currentRooms.map((rt: any, idx: number) => {
                const rName = rt.name ? (String(rt.name).trim().toLowerCase().startsWith('kamar') ? rt.name : `Kamar ${rt.name}`) : `Kamar ${idx + 1}`;
                if (rName.toLowerCase() === tenant.room_type?.toLowerCase() || rt.residentName === tenant.user?.name) {
                    return {
                        ...rt,
                        status: 'Kosong',
                        isAvailable: true,
                        residentName: '',
                        residentPhone: '',
                        startDate: '',
                        endDate: ''
                    };
                }
                return rt;
            });

            const { error: pErr } = await supabase
                .from('properties')
                .update({ 
                    room_types: newRooms,
                    updated_at: new Date().toISOString()
                })
                .eq('id', prop.id);

            if (pErr) throw pErr;

            alert(`✅ Proses check-out selesai! Unit ${tenant.room_type} di "${prop.title}" kini kembali KOSONG dan siap dipasarkan.`);
            setSelectedTenantForCheckout(null);
            setCheckoutNotes('');
            await loadAllData();
        } catch (err: any) {
            console.error('Error checking out tenant:', err);
            alert('Gagal melakukan check-out: ' + err.message);
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleSavePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pkgForm.duration_months <= 0) return alert('Durasi harus minimal 1 bulan');
        if (pkgForm.price <= 0) return alert('Harga harus diisi dengan benar');
        if (!pkgForm.label) return alert('Label paket harus diisi');

        setSavingPkg(true);
        try {
            await saveKostManagerPackage({
                id: editingPkgId || undefined,
                duration_months: Number(pkgForm.duration_months),
                price: Number(pkgForm.price),
                label: pkgForm.label,
                is_active: pkgForm.is_active
            });
            alert('Paket langganan berhasil disimpan!');
            setIsAddPkgOpen(false);
            setEditingPkgId(null);
            setPkgForm({ duration_months: 1, price: 0, label: '', is_active: true });
            // Reload packages
            const pkgs = await getKostManagerPackages();
            setPackages(pkgs);
        } catch (err: any) {
            alert('Gagal menyimpan paket: ' + err.message);
        } finally {
            setSavingPkg(false);
        }
    };

    const handleDeletePackage = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus paket langganan ini?')) return;
        try {
            await deleteKostManagerPackage(id);
            alert('Paket langganan berhasil dihapus!');
            // Reload packages
            const pkgs = await getKostManagerPackages();
            setPackages(pkgs);
        } catch (err: any) {
            alert('Gagal menghapus paket: ' + err.message);
        }
    };

    // --- FORM SUBMIT HANDLER ---
    const handleCreateBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantIdForBill) return alert('Pilih penghuni terlebih dahulu');
        const tenant = tenants.find(t => t.id === selectedTenantIdForBill);
        if (!tenant) return alert('Penghuni tidak ditemukan');

        setSubmittingBill(true);
        try {
            const amount = Number(billForm.rentalAmount);
            const extra = Number(billForm.extraFee);
            const total = amount + extra;

            const items = [
                {
                    id: 'main',
                    name: `Sewa Kost - ${tenant.room_type || 'Standard'}`,
                    qty: 1,
                    unitPrice: amount
                }
            ];

            if (extra > 0 && billForm.extraFeeName) {
                items.push({
                    id: 'extra',
                    name: billForm.extraFeeName,
                    qty: 1,
                    unitPrice: extra
                });
            }

            const ymd = new Date().getFullYear().toString() +
                String(new Date().getMonth() + 1).padStart(2, '0') +
                String(new Date().getDate()).padStart(2, '0');
            const rand = Math.floor(1000 + Math.random() * 9000);
            const billNumber = `RS-KM-${ymd}-${rand}`;

            await saveManualInvoice({
                bill_number: billNumber,
                bill_date: new Date().toISOString().split('T')[0],
                due_date: billForm.dueDate,
                category: 'sewa',
                recipient_name: tenant.user?.name || 'Penyewa',
                recipient_phone: tenant.user?.phone || '',
                recipient_address: tenant.property?.address || '',
                kost_name: tenant.property?.title || '',
                rental_amount: amount,
                commission_percent: 0,
                commission_amount: 0,
                items,
                notes: billForm.notes,
                total
            });

            alert('Tagihan sewa bulanan berhasil dibuat dan dikirim!');
            setIsAddBillOpen(false);
            setSelectedTenantIdForBill('');
            setBillForm({
                dueDate: '',
                notes: '',
                rentalAmount: 0,
                extraFee: 0,
                extraFeeName: ''
            });
            loadAllData();
        } catch (err: any) {
            alert('Gagal menyimpan tagihan: ' + err.message);
        } finally {
            setSubmittingBill(false);
        }
    };

    const handleSaveManagedProperty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPropForm.owner_uid) return alert('Pilih pemilik/mitra terlebih dahulu');
        if (!newPropForm.title) return alert('Nama kost harus diisi');

        setSavingProp(true);
        try {
            // 1. Hitung empty_rooms
            let totalRooms = 0;
            let occupiedRooms = 0;
            newPropForm.roomTypes.forEach(rt => {
                totalRooms += rt.rooms.length;
                rt.rooms.forEach(r => {
                    if (r.status === 'terisi') occupiedRooms++;
                });
            });

            // 2. Insert ke properties
            const mappedRoomTypes = newPropForm.roomTypes.map(rt => ({
                name: rt.name,
                price: Number(rt.price),
                size: rt.size || '3x4m',
                isAvailable: rt.rooms.some(r => r.status === 'kosong'),
                availableRoomCount: rt.rooms.filter(r => r.status === 'kosong').length,
                maxOccupants: rt.maxOccupants || 1,
                roomFacilities: rt.roomFacilities || [],
                bathroomFacilities: rt.bathroomFacilities || []
            }));

            // Tentukan min price sebagai price dasar listing
            let finalPrice = Number(newPropForm.price) || 0;
            if (newPropForm.roomTypes.length > 0) {
                const prices = newPropForm.roomTypes.map(rt => Number(rt.price)).filter(p => p > 0);
                if (prices.length > 0) finalPrice = Math.min(...prices);
            }

            const { data: propData, error: propErr } = await supabase
                .from('properties')
                .insert([{
                    title: newPropForm.title,
                    description: newPropForm.description || '',
                    address: newPropForm.address,
                    city: newPropForm.city,
                metadata: {
                    ...(newPropForm.metadata || {}),
                    province: newPropForm.province || ''
                },
                    area: newPropForm.area || '',
                    type: newPropForm.type,
                    price: finalPrice,
                    owner_uid: newPropForm.owner_uid,
                    is_managed: true,
                    room_types: mappedRoomTypes,
                    status: 'published',
                    location: newPropForm.location,
                    facilities: newPropForm.facilities.length > 0 ? newPropForm.facilities : ['WiFi', 'Kasur', 'Lemari Pakaian']
                }])
                .select()
                .single();

            if (propErr) throw propErr;

            // 3. Simpan data penghuni (loop kamar terisi)
            for (const rt of newPropForm.roomTypes) {
                for (const rm of rt.rooms) {
                    if (rm.status === 'terisi' && rm.tenantName) {
                        // Buat user bayangan untuk tenant
                        const tenantEmail = `tenant_${Date.now()}_${Math.floor(Math.random() * 1000)}@dummy.ruangsinggah.id`;
                        
                        // Buat record user di auth/public users
                        const { data: userData, error: uErr } = await supabase
                            .from('users')
                            .insert([{
                                name: rm.tenantName,
                                phone: rm.tenantPhone || '-',
                                email: tenantEmail,
                                role: 'user',
                                status: 'active'
                            }])
                            .select()
                            .single();

                        if (uErr) throw uErr;

                        // Insert ke resident_status
                        const { error: resErr } = await supabase
                            .from('resident_status')
                            .insert([{
                                user_id: userData.id,
                                kost_id: propData.id,
                                room_type: rt.name,
                                start_date: new Date().toISOString().split('T')[0],
                                end_date: rm.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                                status: 'ACTIVE',
                                metadata: {
                                    basePrice: rt.price,
                                    facilityFee: 0,
                                    extraPersonFee: 0,
                                    nik: '-',
                                    billingPeriod: rm.billingPeriod
                                }
                            }]);

                        if (resErr) throw resErr;
                    }
                }
            }

            alert('Properti kelolaan KostManager berhasil ditambahkan!');
            setIsAddPropOpen(false);
            setNewPropForm(DEFAULT_PROP_FORM);
            loadAllData();
        } catch (err: any) {
            alert('Gagal menyimpan properti: ' + err.message);
        } finally {
            setSavingProp(false);
        }
    };

    const handleEditProperty = (p: ManagedProperty) => {
        setEditingPropertyId(p.id);
        
        // Filter penyewa aktif di properti ini
        const propResidents = tenants.filter(t => t.kost_id === p.id && t.status === 'ACTIVE');

        // Rekonstruksi roomTypes
        const reconstructedRoomTypes = p.room_types.map(rt => {
            const typeResidents = propResidents.filter(t => t.room_type?.toLowerCase() === rt.name?.toLowerCase());
            
            // Periksa apakah sudah ada list kamar tersimpan di database tipe kamar
            const dbRooms = Array.isArray(rt.rooms) ? rt.rooms : [];

            const allRooms = dbRooms.map((r: any, idx: number) => {
                if (r.status === 'terisi') {
                    const tenant = typeResidents.find(t => t.metadata?.roomNumber === r.roomNumber) || typeResidents[idx];
                    return {
                        roomNumber: r.roomNumber || `RM-${101 + idx}`,
                        status: 'terisi' as const,
                        tenantName: tenant?.user?.name || '',
                        tenantPhone: tenant?.user?.phone || '',
                        billingPeriod: tenant?.metadata?.billingPeriod || 'bulanan',
                        dueDate: tenant?.end_date || '',
                        images: normalizePhotoList(r.images || []),
                        categorizedPhotos: {
                            interior: normalizePhotoList(r.categorizedPhotos?.interior || r.images || []),
                            kasur: normalizePhotoList(r.categorizedPhotos?.kasur || []),
                            wc: normalizePhotoList(r.categorizedPhotos?.wc || []),
                            jendela: normalizePhotoList(r.categorizedPhotos?.jendela || [])
                        }
                    };
                } else {
                    return {
                        roomNumber: r.roomNumber || `RM-${101 + idx}`,
                        status: 'kosong' as const,
                        tenantName: '',
                        tenantPhone: '',
                        billingPeriod: 'bulanan',
                        dueDate: '',
                        images: normalizePhotoList(r.images || []),
                        categorizedPhotos: {
                            interior: normalizePhotoList(r.categorizedPhotos?.interior || r.images || []),
                            kasur: normalizePhotoList(r.categorizedPhotos?.kasur || []),
                            wc: normalizePhotoList(r.categorizedPhotos?.wc || []),
                            jendela: normalizePhotoList(r.categorizedPhotos?.jendela || [])
                        }
                    };
                }
            });

            // Fallback jika properti lama belum memiliki array rooms
            if (allRooms.length === 0) {
                const occupiedRooms = typeResidents.map((t, idx) => ({
                    roomNumber: t.metadata?.roomNumber || `RM-${101 + idx}`,
                    status: 'terisi' as const,
                    tenantName: t.user?.name || '',
                    tenantPhone: t.user?.phone || '',
                    billingPeriod: t.metadata?.billingPeriod || 'bulanan',
                    dueDate: t.end_date || '',
                    images: [] as string[]
                }));

                const emptyRoomsCount = rt.availableRoomCount || 0;
                const emptyRooms = Array.from({ length: emptyRoomsCount }).map((_, idx) => ({
                    roomNumber: `RM-${101 + occupiedRooms.length + idx}`,
                    status: 'kosong' as const,
                    tenantName: '',
                    tenantPhone: '',
                    billingPeriod: 'bulanan',
                    dueDate: '',
                    images: [] as string[]
                }));

                allRooms.push(...occupiedRooms, ...emptyRooms);
            }

            if (allRooms.length === 0) {
                allRooms.push({
                    roomNumber: '101',
                    status: 'kosong',
                    tenantName: '',
                    tenantPhone: '',
                    billingPeriod: 'bulanan',
                    dueDate: '',
                    images: [] as string[]
                });
            }

            return {
                name: rt.name,
                price: rt.price,
                size: rt.size || '3x4m',
                maxOccupants: rt.maxOccupants || 1,
                roomFacilities: rt.roomFacilities || [],
                bathroomFacilities: rt.bathroomFacilities || [],
                rooms: allRooms
            };
        });

        setNewPropForm({
            title: p.title || '',
            description: p.description || '',
            address: p.address || '',
            city: p.city || '',
            area: p.area || '',
            province: (p as any).province || p.metadata?.province || '',
            type: p.type || 'Campur',
            price: p.price || 0,
            owner_uid: p.owner_uid || '',
            location: p.location || { lat: -6.2088, lng: 106.8456 },
            facilities: p.facilities || [],
            imageUrls: normalizePhotoList(p.image_urls || []),
            videoUrls: p.video_urls || [],
            instagramUrl: p.instagram_url || '',
            tiktokUrl: p.tiktok_url || '',
            rules: p.rules || [],
            campuses: p.campuses || [],
            publicFacilities: p.public_facilities || [],
            additionalFeePrice: p.additional_fee_price || 0,
            additionalFeeName: p.additional_fee_name || '',
            additionalFeeStartsFrom: p.additional_fee_starts_from || 'month_1',
            omnichannelContactName: p.omnichannel_contact_name || '',
            omnichannelContactPhone: p.omnichannel_contact_phone || '',
            omnichannelContactType: p.omnichannel_contact_type || 'owner',
            roomTypes: reconstructedRoomTypes
        });

        setIsAddPropOpen(true);
    };

    const handleUpdateStatusBill = async (id: string, status: 'issued' | 'paid' | 'cancelled') => {
        if (!window.confirm(`Ubah status tagihan menjadi ${status}?`)) return;
        try {
            await updateManualInvoiceStatus(id, status);
            alert('Status tagihan berhasil diperbarui');
            loadAllData();
        } catch (err: any) {
            alert('Gagal memperbarui status: ' + err.message);
        }
    };

    // Auto-fill bill form when tenant is selected
    useEffect(() => {
        if (selectedTenantIdForBill) {
            const tenant = tenants.find(t => t.id === selectedTenantIdForBill);
            if (tenant) {
                const basePrice = Number(tenant.metadata?.basePrice) || 0;
                const facilityFee = Number(tenant.metadata?.facilityFee) || 0;
                const extraPersonFee = Number(tenant.metadata?.extraPersonFee) || 0;
                const totalRent = basePrice + facilityFee + extraPersonFee;

                const defaultDue = new Date();
                defaultDue.setDate(defaultDue.getDate() + 7);

                setBillForm(prev => ({
                    ...prev,
                    rentalAmount: totalRent || 1000000, // fallback
                    dueDate: defaultDue.toISOString().split('T')[0]
                }));
            }
        }
    }, [selectedTenantIdForBill, tenants]);

    // --- STATISTIK ---
    const totalOccupants = tenants.filter(t => t.status === 'ACTIVE').length;
    const totalEmpty = properties.reduce((sum, p) => sum + (p.empty_rooms || 0), 0);
    const totalRooms = totalOccupants + totalEmpty;
    const occupancyRate = totalRooms > 0 ? Math.round((totalOccupants / totalRooms) * 100) : 0;

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
    const totalUnpaid = invoices.filter(inv => inv.status === 'issued').reduce((sum, inv) => sum + inv.total, 0);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* SIDEBAR PORTAL KOSTMANAGER */}
            <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col sticky top-0 z-10 shrink-0">
                <div className="p-6 border-b border-gray-100">
                    <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest block w-fit mb-2">Auto-Pilot Mode</span>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Portal KostManager</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Operasional Terpusat</p>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {([
                        { key: 'overview', icon: '📊', label: 'Ringkasan' },
                        { key: 'properties', icon: '🏠', label: 'Properti Terkelola' },
                        { key: 'tenants', icon: '👥', label: 'Penghuni' },
                        { key: 'billing', icon: '🧾', label: 'Tagihan Bulanan' },
                        { key: 'packages', icon: '⚙️', label: 'Harga Langganan' }
                    ] as const).map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                activeTab === t.key
                                    ? 'bg-orange-50 text-orange-600 font-bold'
                                    : 'text-gray-600 hover:bg-gray-50 font-semibold'
                            }`}
                        >
                            <span className="text-lg">{t.icon}</span>
                            <span className="text-xs uppercase tracking-wide">{t.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={onBack}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                        ⬅️ Admin Utama
                    </button>
                </div>
            </aside>

            {/* CONTENT AREA */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                            {activeTab === 'overview' ? 'Ringkasan Operasional' :
                             activeTab === 'properties' ? 'Properti Terkelola' :
                             activeTab === 'tenants' ? 'Daftar Penghuni' :
                             activeTab === 'billing' ? 'Tagihan Bulanan' : 'Harga Langganan KostManager'}
                        </h2>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                            {activeTab === 'overview' ? 'Analisis okupansi, tagihan, dan status auto-pilot aktif' :
                             activeTab === 'properties' ? 'Kelola detail kamar, kapasitas, dan status pemasaran properti' :
                             activeTab === 'tenants' ? 'Daftar penghuni aktif beserta periode sewa dan detail kontak' :
                             activeTab === 'billing' ? 'Menerbitkan dan mengelola riwayat tagihan sewa bulanan' :
                             'Mengatur pilihan durasi dan harga paket langganan KostManager untuk Mitra'}
                        </p>
                    </div>

                    {loading ? (
                        <div className="bg-white border text-center border-gray-100 rounded-3xl p-16 shadow-sm flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-bold uppercase text-xs tracking-wider">Memuat Data Operasional...</p>
                        </div>
                    ) : (
                        <>
                    {/* =========================================== */}
                    {/* TAB: OVERVIEW                               */}
                    {/* =========================================== */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Grid Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl text-orange-600">🏠</div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kost Terkelola</p>
                                        <p className="text-2xl font-black text-gray-900 mt-0.5">{properties.length}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl text-green-600">👥</div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Penghuni Aktif</p>
                                        <p className="text-2xl font-black text-gray-900 mt-0.5">{totalOccupants}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl text-blue-600">🛏️</div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kamar Kosong</p>
                                        <p className="text-2xl font-black text-gray-900 mt-0.5">{totalEmpty} / {totalRooms}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl text-purple-600">📈</div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Okupansi Rate</p>
                                        <p className="text-2xl font-black text-gray-900 mt-0.5">{occupancyRate}%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Billing Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 rounded-3xl text-white shadow-md">
                                    <p className="text-[10px] font-black text-orange-100 uppercase tracking-widest">Total Ditagihkan (Sewa)</p>
                                    <p className="text-3xl font-black mt-2">{FORMAT_CURRENCY(totalBilled)}</p>
                                    <p className="text-[10px] text-orange-200 mt-2">Akumulasi seluruh tagihan KostManager</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tagihan Lunas</p>
                                    <p className="text-3xl font-black text-green-600 mt-2">{FORMAT_CURRENCY(totalPaid)}</p>
                                    <p className="text-[10px] text-gray-400 mt-2">Pembayaran sewa kost berhasil terverifikasi</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum Dibayar / Jatuh Tempo</p>
                                    <p className="text-3xl font-black text-amber-500 mt-2">{FORMAT_CURRENCY(totalUnpaid)}</p>
                                    <p className="text-[10px] text-gray-400 mt-2">Menunggu pembayaran transfer atau QRIS</p>
                                </div>
                            </div>

                            {/* Status Banner */}
                            <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex gap-4">
                                <div className="text-orange-600 text-2xl shrink-0">⚡</div>
                                <div>
                                    <h4 className="text-sm font-black text-orange-950 uppercase tracking-tight">Operasional Auto-Pilot Aktif</h4>
                                    <p className="text-xs text-orange-800 leading-relaxed mt-1">
                                        Seluruh kost yang terdaftar di halaman ini berada di bawah kendali manajemen RuangSinggah. Calon penghuni baru dapat memesan langsung dari website utama. Untuk tagihan bulanan penyewa lama, gunakan tab <strong>"Tagihan Bulanan"</strong> untuk menerbitkan tagihan secara berkala.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =========================================== */}
                    {/* TAB: PROPERTIES (PROPERTY COMMAND CENTER)   */}
                    {/* =========================================== */}
                    {activeTab === 'properties' && (() => {
                        // Portfolio Global Metrics
                        const totalPropsCount = properties.length;
                        const totalRoomsAll = properties.reduce((sum, p) => sum + (Array.isArray(p.room_types) ? p.room_types.length : 0), 0);
                        const totalOccupiedAll = properties.reduce((sum, p) => sum + (p.occupant_count || 0), 0);
                        const totalVacantAll = properties.reduce((sum, p) => sum + (p.empty_rooms || 0), 0);
                        const globalOccupancy = totalRoomsAll > 0 ? Math.round((totalOccupiedAll / totalRoomsAll) * 100) : 0;
                        
                        const totalPotentialOmsetAll = properties.reduce((sum, p) => {
                            const roomsPotential = Array.isArray(p.room_types) && p.room_types.length > 0
                                ? p.room_types.reduce((rSum: number, rt: any) => rSum + (Number(rt.price) || Number(p.price) || 0), 0)
                                : (Number(p.price) * (p.empty_rooms + p.occupant_count || 1));
                            return sum + roomsPotential;
                        }, 0);

                        const totalRealizedOmsetAll = tenants.filter(t => t.status === 'ACTIVE').reduce((sum, t) => {
                            const bPrice = Number(t.metadata?.basePrice) || Number(t.metadata?.price) || Number(t.metadata?.monthlyPrice) || 0;
                            const extra = Number(t.metadata?.extraPersonFee) || 0;
                            return sum + bPrice + extra;
                        }, 0);

                        // Filter properties by search
                        const filteredProps = properties.filter(p => {
                            if (!propertySearch.trim()) return true;
                            const q = propertySearch.toLowerCase();
                            return (
                                p.title.toLowerCase().includes(q) ||
                                p.city.toLowerCase().includes(q) ||
                                p.address.toLowerCase().includes(q) ||
                                p.owner_name?.toLowerCase().includes(q) ||
                                p.owner_phone?.includes(q)
                            );
                        });

                        return (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* 1. TOP KPI GLANCE BAR (PORTFOLIO WIDE) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Card 1: Total Properti Terkelola */}
                                    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-soft flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Properti Terkelola</span>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="text-2xl font-black text-slate-900">{totalPropsCount}</span>
                                                <span className="text-xs text-slate-500 font-bold">Gedung Aktif</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
                                            <Building2 size={22} />
                                        </div>
                                    </div>

                                    {/* Card 2: Kapasitas Kamar Global */}
                                    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-soft flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Kapasitas Kamar</span>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="text-2xl font-black text-slate-900">{totalRoomsAll}</span>
                                                <span className="text-xs text-slate-500 font-bold">Unit ({totalOccupiedAll} Terisi • {totalVacantAll} Kosong)</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
                                            <Bed size={22} />
                                        </div>
                                    </div>

                                    {/* Card 3: Rata-Rata Okupansi Global */}
                                    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-soft flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tingkat Okupansi</span>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className={`text-2xl font-black ${
                                                    globalOccupancy >= 80 ? 'text-emerald-600' : globalOccupancy >= 50 ? 'text-amber-600' : 'text-rose-600'
                                                }`}>
                                                    {globalOccupancy}%
                                                </span>
                                                <span className="text-xs text-slate-500 font-bold">Rata-Rata Portofolio</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-2xs">
                                            <TrendingUp size={22} />
                                        </div>
                                    </div>

                                    {/* Card 4: Valuasi Omset Terkelola */}
                                    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-soft flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Omset Realisasi / Potensi</span>
                                            <div className="mt-1">
                                                <span className="text-lg font-black text-slate-900 block">{FORMAT_CURRENCY(totalRealizedOmsetAll)}</span>
                                                <span className="text-[10px] font-bold text-slate-400">Potensi: {FORMAT_CURRENCY(totalPotentialOmsetAll)}</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                                            <DollarSign size={22} />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. ACTIONS & SEARCH HEADER */}
                                <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-soft flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                                    <div className="relative w-full sm:max-w-md">
                                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama kost, kota, alamat, atau nama mitra pemilik..."
                                            value={propertySearch}
                                            onChange={e => setPropertySearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                                        />
                                    </div>

                                    <button
                                        onClick={() => {
                                            setEditingPropertyId(null);
                                            setNewPropForm({
                                                title: '',
                                                description: '',
                                                address: '',
                                                city: '',
                                                area: '',
                                                type: 'Campur',
                                                price: 0,
                                                owner_uid: '',
                                                location: { lat: -6.2088, lng: 106.8456 },
                                                facilities: [] as string[],
                                                roomTypes: [
                                                    {
                                                        name: 'Standard',
                                                        price: 1000000,
                                                        size: '3x4m',
                                                        maxOccupants: 1,
                                                        roomFacilities: [] as string[],
                                                        bathroomFacilities: [] as string[],
                                                        rooms: [
                                                            { roomNumber: '101', status: 'kosong', tenantName: '', tenantPhone: '', billingPeriod: 'bulanan', dueDate: '', images: [] as string[] }
                                                        ]
                                                    }
                                                ]
                                            });
                                            setIsAddPropOpen(true);
                                        }}
                                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>➕ Daftarkan Properti Baru</span>
                                    </button>
                                </div>

                                {/* 3. TABLE OF MANAGED PROPERTIES (ENTERPRISE GRADE) */}
                                <div className="bg-white border border-slate-200/90 rounded-3xl shadow-soft overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                                                    <th className="px-6 py-4">Properti & Visual</th>
                                                    <th className="px-6 py-4">Pemilik (Mitra)</th>
                                                    <th className="px-6 py-4">Tingkat Okupansi</th>
                                                    <th className="px-6 py-4">Performa Omset</th>
                                                    <th className="px-6 py-4">Status Auto-Pilot</th>
                                                    <th className="px-6 py-4 text-right">Aksi Operasional</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {filteredProps.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                                                            Tidak ada properti terkelola yang sesuai dengan pencarian.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredProps.map(p => {
                                                        const cleanOwnerPhone = (p.owner_phone || '').replace(/[^0-9]/g, '');
                                                        const roomList = Array.isArray(p.room_types) ? p.room_types : [];
                                                        const totalRooms = roomList.length > 0 ? roomList.length : (p.empty_rooms + p.occupant_count || 1);
                                                        const occupiedRooms = p.occupant_count || 0;
                                                        const vacantRooms = p.empty_rooms ?? Math.max(0, totalRooms - occupiedRooms);
                                                        const occPercent = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

                                                        // Revenue calculations
                                                        const potentialOmset = roomList.length > 0
                                                            ? roomList.reduce((sum: number, rt: any) => sum + (Number(rt.price) || Number(p.price) || 0), 0)
                                                            : (Number(p.price) * totalRooms);

                                                        const propertyActiveTenants = tenants.filter(t => t.kost_id === p.id && t.status === 'ACTIVE');
                                                        const realizedOmset = propertyActiveTenants.reduce((sum, t) => {
                                                            const bPrice = Number(t.metadata?.basePrice) || Number(t.metadata?.price) || Number(t.metadata?.monthlyPrice) || 0;
                                                            const extra = Number(t.metadata?.extraPersonFee) || 0;
                                                            return sum + bPrice + extra;
                                                        }, 0);

                                                        const primaryImage = (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : '';

                                                        return (
                                                            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                                                                {/* 1. Properti & Visual */}
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3.5">
                                                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs relative group/img">
                                                                            {primaryImage ? (
                                                                                <img
                                                                                    src={primaryImage}
                                                                                    alt={p.title}
                                                                                    className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                                                                                />
                                                                            ) : (
                                                                                <Building2 size={24} className="text-slate-400" />
                                                                            )}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                                <h4 className="font-black text-slate-900 text-sm tracking-tight">{p.title}</h4>
                                                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                                                    p.type === 'Campur' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                                    p.type === 'Putri' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                                                                                    'bg-blue-50 text-blue-700 border-blue-200'
                                                                                }`}>
                                                                                    {p.type}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-[11px] text-slate-400 font-bold mt-0.5 truncate max-w-xs">
                                                                                📍 {p.city ? `${p.city}, ` : ''}{p.address || 'Alamat belum diatur'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* 2. Pemilik (Mitra) */}
                                                                <td className="px-6 py-4">
                                                                    <p className="font-black text-slate-900 text-xs">{p.owner_name || 'Mitra RuangSinggah'}</p>
                                                                    {cleanOwnerPhone ? (
                                                                        <a
                                                                            href={`https://wa.me/${cleanOwnerPhone}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-[11px] text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                                                                        >
                                                                            <Phone size={10} className="text-emerald-500 shrink-0" />
                                                                            <span>+{cleanOwnerPhone}</span>
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-[10px] text-slate-400">-</span>
                                                                    )}
                                                                </td>

                                                                {/* 3. Tingkat Okupansi (Progress Bar) */}
                                                                <td className="px-6 py-4">
                                                                    <div className="space-y-1.5 w-36">
                                                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                                                            <span className="text-slate-700 font-black">{occPercent}% Terisi</span>
                                                                            <span className="text-slate-400 font-mono">{occupiedRooms}/{totalRooms}</span>
                                                                        </div>
                                                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.2">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all duration-500 ${
                                                                                    occPercent >= 80 ? 'bg-emerald-500' :
                                                                                    occPercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                                                }`}
                                                                                style={{ width: `${Math.max(5, occPercent)}%` }}
                                                                            />
                                                                        </div>
                                                                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                                                            {vacantRooms > 0 ? (
                                                                                <span className="text-emerald-600 font-bold">🟢 {vacantRooms} Kamar Siap Huni</span>
                                                                            ) : (
                                                                                <span className="text-purple-600 font-bold">✨ Full Terisi</span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </td>

                                                                {/* 4. Performa Omset */}
                                                                <td className="px-6 py-4">
                                                                    <span className="font-black text-slate-900 text-xs block">
                                                                        {FORMAT_CURRENCY(realizedOmset)}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 font-bold block">
                                                                        Potensi: {FORMAT_CURRENCY(potentialOmset)}
                                                                    </span>
                                                                </td>

                                                                {/* 5. Status Auto-Pilot */}
                                                                <td className="px-6 py-4">
                                                                    <span className="text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs inline-flex items-center gap-1.5">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                        <span>Aktif Terkelola</span>
                                                                    </span>
                                                                </td>

                                                                {/* 6. Aksi Operasional */}
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        {/* Tombol 1: Buka Web Publik Listing */}
                                                                        <a
                                                                            href={`/kost/${p.id}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs"
                                                                            title="Buka Halaman Listing Publik"
                                                                        >
                                                                            <ExternalLink size={13} />
                                                                        </a>

                                                                        {/* Tombol 2: Peta Denah Kamar (Room Matrix) */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSelectedPropForRoomMatrix(p)}
                                                                            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-all cursor-pointer shadow-2xs"
                                                                            title="Lihat Denah Kamar Visual"
                                                                        >
                                                                            <Grid size={13} />
                                                                        </button>

                                                                        {/* Tombol 3: Broadcast WhatsApp Pengumuman Gedung */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedPropForBroadcast(p);
                                                                                setBroadcastCategory('LISTRIK_AIR');
                                                                                setBroadcastCustomText('');
                                                                            }}
                                                                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
                                                                            title="Broadcast WhatsApp ke Seluruh Penghuni"
                                                                        >
                                                                            <Megaphone size={13} />
                                                                        </button>

                                                                        {/* Tombol 4: Detail Kamar Full */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSelectedPropForRoomDetail(p)}
                                                                            className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#ff7a00] border border-orange-200/80 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                                                                            title="Detail Data Kamar"
                                                                        >
                                                                            🚪 Kamar
                                                                        </button>

                                                                        {/* Tombol 5: Edit Data Properti */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleEditProperty(p)}
                                                                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs"
                                                                            title="Edit Data & Tarif Properti"
                                                                        >
                                                                            <FileText size={13} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* ========================================================= */}
                                {/* MODAL: PETA DENAH KAMAR (ROOM MATRIX VISUALIZER)          */}
                                {/* ========================================================= */}
                                {selectedPropForRoomMatrix && (() => {
                                    const p = selectedPropForRoomMatrix;
                                    const rooms = Array.isArray(p.room_types) ? p.room_types : [];
                                    const propTenants = tenants.filter(t => t.kost_id === p.id && t.status === 'ACTIVE');

                                    return (
                                        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in">
                                            <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 max-h-[85vh]" onClick={e => e.stopPropagation()}>
                                                {/* Header Modal */}
                                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70 shrink-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                                                            <Grid size={18} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Peta Unit Kamar (Room Matrix)</h3>
                                                            <p className="text-[10px] text-slate-500 font-bold">{p.title} • {rooms.length} Total Kamar</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedPropForRoomMatrix(null)}
                                                        className="p-2 hover:bg-slate-200/70 rounded-full text-slate-400 transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>

                                                {/* Grid Content */}
                                                <div className="p-6 overflow-y-auto space-y-4">
                                                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                                                        <div className="flex items-center gap-4">
                                                            <span className="flex items-center gap-1.5 font-bold text-slate-700">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                                                <span>Terisi ({p.occupant_count})</span>
                                                            </span>
                                                            <span className="flex items-center gap-1.5 font-bold text-slate-700">
                                                                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                                                                <span>Kosong ({p.empty_rooms})</span>
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                            Denah Lantai
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {rooms.map((rt: any, rIdx: number) => {
                                                            const roomName = rt.name ? (String(rt.name).trim().toLowerCase().startsWith('kamar') ? rt.name : `Kamar ${rt.name}`) : `Kamar ${rIdx + 1}`;
                                                            const isOccupied = rt.isAvailable === false || rt.status === 'Terisi' || Boolean(rt.residentName);
                                                            const tenant = propTenants.find(t => t.room_type?.toLowerCase() === roomName.toLowerCase()) || (isOccupied ? {
                                                                user: { name: rt.residentName || 'Penyewa', phone: rt.residentPhone || '-' },
                                                                start_date: rt.startDate || '-',
                                                                end_date: rt.endDate || '-'
                                                            } : null);

                                                            return (
                                                                <div
                                                                    key={rIdx}
                                                                    className={`p-4 rounded-2xl border transition-all ${
                                                                        isOccupied
                                                                            ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs'
                                                                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-black text-slate-900 text-sm">{roomName}</span>
                                                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                                                    isOccupied ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                                                                }`}>
                                                                                    {isOccupied ? 'Terisi' : 'Kosong'}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{rt.dimensions || 'Ukuran Standar'} • {rt.floor || 'Lantai 1'}</p>
                                                                        </div>
                                                                        <span className="font-black text-orange-600 text-xs font-mono">
                                                                            {FORMAT_CURRENCY(Number(rt.price) || Number(p.price) || 0)}
                                                                        </span>
                                                                    </div>

                                                                    {isOccupied && tenant ? (
                                                                        <div className="mt-3 pt-2.5 border-t border-emerald-200/60 text-xs space-y-1">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-slate-500 font-bold text-[10px]">Penghuni:</span>
                                                                                <span className="font-black text-slate-900 text-xs">{tenant.user?.name}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between text-[10px]">
                                                                                <span className="text-slate-400 font-bold">Masa Sewa:</span>
                                                                                <span className="text-slate-700 font-bold font-mono">{tenant.start_date} s/d {tenant.end_date}</span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
                                                                            <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                                                                                <CheckCircle2 size={11} /> Unit Siap Disewakan
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Footer Modal */}
                                                <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedPropForRoomMatrix(null)}
                                                        className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                                    >
                                                        Tutup Denah
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* ========================================================= */}
                                {/* MODAL: BROADCAST WHATSAPP PENGUMUMAN GEDUNG               */}
                                {/* ========================================================= */}
                                {selectedPropForBroadcast && (() => {
                                    const p = selectedPropForBroadcast;
                                    const propTenants = tenants.filter(t => t.kost_id === p.id && t.status === 'ACTIVE');

                                    // Templates
                                    let templateText = '';
                                    if (broadcastCategory === 'LISTRIK_AIR') {
                                        templateText = `Halo Penghuni ${p.title} 👋,\n\nKami dari Manajemen KostManager ingin menginformasikan bahwa akan ada pemeliharaan sistem air/listrik pada: [Isi Waktu/Tanggal].\n\nMohon kesediaannya untuk menampung air secukupnya. Terima kasih atas pengertiannya! 🙏`;
                                    } else if (broadcastCategory === 'KEBERSIHAN') {
                                        templateText = `Halo Penghuni ${p.title} 👋,\n\nJadwal kebersihan area publik dan kuras toren akan dilakukan pada hari [Isi Hari/Tanggal].\n\nMohon untuk tidak meletakkan barang pribadi di lorong umum. Terima kasih atas kerjasamanya! ✨`;
                                    } else if (broadcastCategory === 'TAGIHAN') {
                                        templateText = `Halo Penghuni ${p.title} 👋,\n\nPengingat pembayaran tagihan sewa bulanan telah diterbitkan. Mohon untuk melakukan konfirmasi transfer atau pembayaran melalui portal. Terima kasih banyak! 🧾`;
                                    } else if (broadcastCategory === 'TATA_TERTIB') {
                                        templateText = `Halo Penghuni ${p.title} 👋,\n\nHimbauan keamanan & ketertiban bersama: Mohon selalu mengunci pintu gerbang dan menjaga ketenangan setelah pukul 22.00 WITA. Terima kasih! 🔒`;
                                    } else {
                                        templateText = broadcastCustomText || `Halo Penghuni ${p.title} 👋,\n\n[Tulis pesan pengumuman Anda di sini...]`;
                                    }

                                    return (
                                        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in">
                                            <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 max-h-[85vh]" onClick={e => e.stopPropagation()}>
                                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/70 shrink-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                                            <Megaphone size={18} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-black text-emerald-950 uppercase tracking-tight">Broadcast Pengumuman Gedung</h3>
                                                            <p className="text-[10px] text-emerald-700 font-bold">{p.title} • {propTenants.length} Penghuni Aktif</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedPropForBroadcast(null)}
                                                        className="p-2 hover:bg-slate-200/70 rounded-full text-slate-400 transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>

                                                <div className="p-6 overflow-y-auto space-y-4">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Pilih Kategori Pengumuman</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {[
                                                                { key: 'LISTRIK_AIR', label: '⚡ Listrik & Air' },
                                                                { key: 'KEBERSIHAN', label: '🧹 Jadwal Kebersihan' },
                                                                { key: 'TAGIHAN', label: '🧾 Tagihan Serentak' },
                                                                { key: 'TATA_TERTIB', label: '🔒 Tata Tertib' },
                                                                { key: 'KUSTOM', label: '✏️ Pesan Bebas' }
                                                            ].map(cat => (
                                                                <button
                                                                    key={cat.key}
                                                                    type="button"
                                                                    onClick={() => setBroadcastCategory(cat.key as any)}
                                                                    className={`px-3 py-2 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                                                                        broadcastCategory === cat.key
                                                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black'
                                                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                                                    }`}
                                                                >
                                                                    {cat.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {broadcastCategory === 'KUSTOM' && (
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Tulis Pesan Pengumuman</label>
                                                            <textarea
                                                                rows={3}
                                                                value={broadcastCustomText}
                                                                onChange={e => setBroadcastCustomText(e.target.value)}
                                                                placeholder="Tulis pengumuman Anda di sini..."
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Daftar Penerima WhatsApp */}
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">Kirim ke Penghuni ({propTenants.length} Nomor)</label>
                                                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                                            {propTenants.length === 0 ? (
                                                                <p className="text-xs text-slate-400 font-bold text-center py-4 bg-slate-50 rounded-xl">Belum ada penghuni aktif terdata di properti ini.</p>
                                                            ) : (
                                                                propTenants.map((t, tIdx) => {
                                                                    const cleanPhone = (t.user?.phone || t.metadata?.phone || '').replace(/[^0-9]/g, '');
                                                                    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(templateText.replace(/\\n/g, '\n'))}`;

                                                                    return (
                                                                        <div key={tIdx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                                                                            <div>
                                                                                <p className="font-bold text-slate-900">{t.user?.name} <span className="text-slate-400 font-normal">({t.room_type})</span></p>
                                                                                <p className="text-[10px] text-emerald-600 font-mono">+{cleanPhone}</p>
                                                                            </div>
                                                                            <a
                                                                                href={waUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider shadow-2xs transition-all flex items-center gap-1"
                                                                            >
                                                                                <MessageSquare size={10} /> Kirim WA
                                                                            </a>
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedPropForBroadcast(null)}
                                                        className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                                    >
                                                        Selesai
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    })()}

                    {/* =========================================== */}
                    {/* TAB: TENANTS (AUTO-PILOT LIFECYCLE ENGINE) */}
                    {/* =========================================== */}
                    {activeTab === 'tenants' && (() => {
                        // Compute Lifecycle for all tenants
                        const enrichedTenants = tenants.map(t => {
                            const life = calculateTenantLifecycle(t.start_date, t.end_date, t.status);
                            const basePrice = Number(t.metadata?.basePrice) || Number(t.metadata?.price) || Number(t.metadata?.monthlyPrice) || 0;
                            const facilityFee = Number(t.metadata?.facilityFee) || 0;
                            const extraFee = Number(t.metadata?.extraPersonFee) || 0;
                            const totalRent = basePrice + facilityFee + extraFee;

                            return {
                                ...t,
                                lifecycle: life,
                                totalRent
                            };
                        });

                        // Calculate KPIs
                        const totalTenantsCount = enrichedTenants.length;
                        const totalMonthlyRevenue = enrichedTenants.reduce((sum, t) => sum + (t.totalRent || 0), 0);
                        const overdueTenants = enrichedTenants.filter(t => t.lifecycle.isOverdue);
                        const dueSoonTenants = enrichedTenants.filter(t => t.lifecycle.isDueSoon);
                        const totalVacantRooms = properties.reduce((sum, p) => sum + (p.empty_rooms || 0), 0);
                        const totalRoomsAll = properties.reduce((sum, p) => sum + (Array.isArray(p.room_types) ? p.room_types.length : 0), 0);
                        const occupancyRate = totalRoomsAll > 0 ? Math.round((totalTenantsCount / totalRoomsAll) * 100) : 0;

                        // Filter by tab pipeline & search
                        const filteredTenants = enrichedTenants.filter(t => {
                            // 1. Pipeline Filter
                            if (tenantLifecycleFilter === 'ACTIVE' && t.lifecycle.status !== 'ACTIVE_RUNNING') return false;
                            if (tenantLifecycleFilter === 'DUE_SOON' && !t.lifecycle.isDueSoon) return false;
                            if (tenantLifecycleFilter === 'OVERDUE' && !t.lifecycle.isOverdue) return false;
                            if (tenantLifecycleFilter === 'CHECKOUT' && t.lifecycle.status !== 'CHECKOUT_PLANNED' && t.lifecycle.status !== 'CHECKED_OUT') return false;

                            // 2. Search Filter
                            if (tenantSearch.trim()) {
                                const q = tenantSearch.toLowerCase();
                                const matchName = t.user?.name?.toLowerCase().includes(q);
                                const matchKost = t.property?.title?.toLowerCase().includes(q);
                                const matchRoom = t.room_type?.toLowerCase().includes(q);
                                const matchPhone = (t.user?.phone || '').includes(q);
                                return matchName || matchKost || matchRoom || matchPhone;
                            }
                            return true;
                        });

                        return (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* 1. TOP KPI GLANCE CARDS */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Card 1: Total Penghuni */}
                                    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-soft flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Penghuni Aktif</span>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="text-2xl font-black text-slate-900">{totalTenantsCount}</span>
                                                <span className="text-xs text-slate-500 font-bold">Orang ({occupancyRate}% Terisi)</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
                                            <Users size={22} />
                                        </div>
                                    </div>

                                    {/* Card 2: Estimasi Omset */}
                                    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-soft flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Omset Sewa / Bulan</span>
                                            <div className="mt-1">
                                                <span className="text-xl font-black text-slate-900">{FORMAT_CURRENCY(totalMonthlyRevenue)}</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs">
                                            <DollarSign size={22} />
                                        </div>
                                    </div>

                                    {/* Card 3: Perlu Ditindak (Due Soon & Overdue) */}
                                    <div className={`bg-white rounded-3xl p-5 border shadow-soft flex items-center justify-between ${
                                        overdueTenants.length > 0 ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-slate-200/90'
                                    }`}>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Perlu Ditindak</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-2xl font-black ${overdueTenants.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                                    {dueSoonTenants.length + overdueTenants.length}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500">
                                                    (🟡 {dueSoonTenants.length} H-7 • 🔴 {overdueTenants.length} Nunggak)
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xs ${
                                            overdueTenants.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                                        }`}>
                                            <AlertTriangle size={22} />
                                        </div>
                                    </div>

                                    {/* Card 4: Kamar Kosong Siap Huni */}
                                    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-soft flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Kamar Kosong</span>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="text-2xl font-black text-emerald-600">{totalVacantRooms}</span>
                                                <span className="text-xs text-slate-500 font-bold">Kamar Siap Huni</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-2xs">
                                            <DoorClosed size={22} />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. PIPELINE FILTER TABS & SEARCH BAR */}
                                <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-soft flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                                    {/* Pipeline Filters */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                                        {[
                                            { key: 'ALL', label: 'Semua Penghuni', count: enrichedTenants.length, color: 'bg-slate-100 text-slate-800' },
                                            { key: 'ACTIVE', label: '🟢 Sewa Berjalan', count: enrichedTenants.filter(t => t.lifecycle.status === 'ACTIVE_RUNNING').length, color: 'bg-emerald-100 text-emerald-800' },
                                            { key: 'DUE_SOON', label: '🟡 Jatuh Tempo (H-7)', count: dueSoonTenants.length, color: 'bg-amber-100 text-amber-800 font-black' },
                                            { key: 'OVERDUE', label: '🔴 Menunggak', count: overdueTenants.length, color: 'bg-rose-100 text-rose-800 font-black' },
                                            { key: 'CHECKOUT', label: '📦 Rencana Keluar', count: enrichedTenants.filter(t => t.lifecycle.status === 'CHECKOUT_PLANNED' || t.lifecycle.status === 'CHECKED_OUT').length, color: 'bg-purple-100 text-purple-800' }
                                        ].map(tab => (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                onClick={() => setTenantLifecycleFilter(tab.key as any)}
                                                className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
                                                    tenantLifecycleFilter === tab.key
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                                                }`}
                                            >
                                                <span>{tab.label}</span>
                                                <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${tab.color}`}>
                                                    {tab.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Search Input */}
                                    <div className="relative w-full md:max-w-xs shrink-0">
                                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama, kost, unit, No. HP..."
                                            value={tenantSearch}
                                            onChange={e => setTenantSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* 3. TABLE OF TENANTS (ENTERPRISE GRADE) */}
                                <div className="bg-white border border-slate-200/90 rounded-3xl shadow-soft overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                                                    <th className="px-6 py-4">Profil Penghuni</th>
                                                    <th className="px-6 py-4">Properti & Unit Kamar</th>
                                                    <th className="px-6 py-4">Periode & Jatuh Tempo</th>
                                                    <th className="px-6 py-4">Tarif Sewa</th>
                                                    <th className="px-6 py-4">Status Siklus Hidup</th>
                                                    <th className="px-6 py-4 text-right">Aksi Manajemen</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {filteredTenants.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                                                            Tidak ada data penghuni dalam kategori filter ini.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredTenants.map(t => {
                                                        const cleanPhone = (t.user?.phone || t.metadata?.phone || '').replace(/[^0-9]/g, '');
                                                        const waLink = generateTenantWhatsAppReminder(t);

                                                        return (
                                                            <tr key={t.id} className="hover:bg-slate-50/60 transition-colors group">
                                                                {/* 1. Profil Penghuni */}
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center font-black text-sm uppercase shadow-2xs shrink-0">
                                                                            {(t.user?.name || 'P').charAt(0)}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <p className="font-black text-slate-900 text-xs truncate">{t.user?.name || 'Penghuni Terdata'}</p>
                                                                                <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                                                                    {t.metadata?.billingPeriod || 'Bulanan'}
                                                                                </span>
                                                                            </div>
                                                                            {cleanPhone ? (
                                                                                <a
                                                                                    href={`https://wa.me/${cleanPhone}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-[11px] text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                                                                                >
                                                                                    <Phone size={10} className="text-emerald-500 shrink-0" />
                                                                                    <span>+{cleanPhone}</span>
                                                                                </a>
                                                                            ) : (
                                                                                <span className="text-[10px] text-slate-400">-</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* 2. Properti & Unit Kamar */}
                                                                <td className="px-6 py-4">
                                                                    <p className="font-black text-slate-900 text-xs">{t.property?.title || 'Kost RuangSinggah'}</p>
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200/80 text-[#ff7a00] font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                                                                            <DoorClosed size={10} />
                                                                            {t.room_type || 'Kamar'}
                                                                        </span>
                                                                    </div>
                                                                </td>

                                                                {/* 3. Periode & Jatuh Tempo */}
                                                                <td className="px-6 py-4">
                                                                    <p className="font-bold text-slate-800 text-[11px] font-mono">
                                                                        {t.start_date} <span className="text-slate-400 font-normal">s/d</span> {t.end_date}
                                                                    </p>
                                                                    <p className="text-[10px] font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                                                                        <Clock size={10} className="text-slate-400" />
                                                                        <span>{t.lifecycle.daysText}</span>
                                                                    </p>
                                                                </td>

                                                                {/* 4. Tarif Sewa */}
                                                                <td className="px-6 py-4">
                                                                    <span className="font-black text-slate-900 text-sm">
                                                                        {FORMAT_CURRENCY(t.totalRent)}
                                                                    </span>
                                                                    <span className="text-[9px] text-slate-400 font-bold block">
                                                                        / {t.metadata?.billingPeriod || 'bulan'}
                                                                    </span>
                                                                </td>

                                                                {/* 5. Status Siklus Hidup */}
                                                                <td className="px-6 py-4">
                                                                    <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border shadow-2xs inline-flex items-center gap-1.5 ${t.lifecycle.badgeClass}`}>
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                                        <span>{t.lifecycle.label}</span>
                                                                    </span>
                                                                </td>

                                                                {/* 6. Aksi Cepat Multi-Fungsi */}
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        {/* Tombol 1: WA Reminder Link */}
                                                                        {cleanPhone && (
                                                                            <a
                                                                                href={waLink}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
                                                                                title="Kirim Reminder WA Otomatis"
                                                                            >
                                                                                <MessageSquare size={13} />
                                                                            </a>
                                                                        )}

                                                                        {/* Tombol 2: Tagih Sewa */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedTenantIdForBill(t.id);
                                                                                setBillForm({
                                                                                    ...billForm,
                                                                                    rentalAmount: t.totalRent || 0
                                                                                });
                                                                                setIsAddBillOpen(true);
                                                                            }}
                                                                            className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#ff7a00] border border-orange-200/80 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                                                                            title="Terbitkan Tagihan Sewa"
                                                                        >
                                                                            🧾 Tagih
                                                                        </button>

                                                                        {/* Tombol 3: Perpanjang Sewa */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedTenantForRenew(t);
                                                                                setRenewMonths(1);
                                                                            }}
                                                                            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-all cursor-pointer shadow-2xs"
                                                                            title="Perpanjang Masa Sewa"
                                                                        >
                                                                            <RotateCw size={13} />
                                                                        </button>

                                                                        {/* Tombol 4: Check-out Kamar */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedTenantForCheckout(t);
                                                                                setCheckoutNotes('');
                                                                            }}
                                                                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 transition-all cursor-pointer shadow-2xs"
                                                                            title="Proses Check-Out / Kosongkan Kamar"
                                                                        >
                                                                            <LogOut size={13} />
                                                                        </button>

                                                                        {/* Tombol 5: Detail & KTP */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSelectedTenantForDetail(t)}
                                                                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs"
                                                                            title="Lihat Detail Profil & Dokumen"
                                                                        >
                                                                            <Eye size={13} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* ========================================================= */}
                                {/* MODAL 1: PERPANJANG MASA SEWA (LEASE RENEWAL MODAL)       */}
                                {/* ========================================================= */}
                                {selectedTenantForRenew && (
                                    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in">
                                        <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                                                        <RotateCw size={16} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Perpanjang Masa Sewa</h3>
                                                        <p className="text-[10px] text-slate-500 font-bold">{selectedTenantForRenew.user?.name} - {selectedTenantForRenew.room_type}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedTenantForRenew(null)}
                                                    className="p-2 hover:bg-slate-200/70 rounded-full text-slate-400 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            <form onSubmit={handleRenewLease} className="p-6 space-y-4">
                                                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs space-y-1">
                                                    <p className="text-blue-900 font-bold">Properti: {selectedTenantForRenew.property?.title}</p>
                                                    <p className="text-blue-700 text-[11px]">Masa sewa saat ini: <span className="font-mono font-bold">{selectedTenantForRenew.start_date} s/d {selectedTenantForRenew.end_date}</span></p>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Tambah Durasi Sewa</label>
                                                    <select
                                                        value={renewMonths}
                                                        onChange={e => setRenewMonths(Number(e.target.value))}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500/20"
                                                    >
                                                        <option value={1}>+1 Bulan (Bulanan)</option>
                                                        <option value={2}>+2 Bulan</option>
                                                        <option value={3}>+3 Bulan (Triwulan)</option>
                                                        <option value={6}>+6 Bulan (Semester)</option>
                                                        <option value={12}>+12 Bulan (Tahunan)</option>
                                                    </select>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTenantForRenew(null)}
                                                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer"
                                                    >
                                                        Batal
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={isRenewing}
                                                        className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                                                    >
                                                        {isRenewing ? 'Menyimpan...' : 'Konfirmasi Perpanjang'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                {/* ========================================================= */}
                                {/* MODAL 2: CHECK-OUT / RELEASE KAMAR (MOVE-OUT MODAL)       */}
                                {/* ========================================================= */}
                                {selectedTenantForCheckout && (
                                    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in">
                                        <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/70">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                                                        <LogOut size={16} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-black text-rose-950 uppercase tracking-tight">Proses Check-Out Penghuni</h3>
                                                        <p className="text-[10px] text-rose-700 font-bold">{selectedTenantForCheckout.user?.name} - {selectedTenantForCheckout.room_type}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedTenantForCheckout(null)}
                                                    className="p-2 hover:bg-slate-200/70 rounded-full text-slate-400 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            <form onSubmit={handleCheckoutTenant} className="p-6 space-y-4">
                                                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
                                                    <p className="text-amber-900 font-bold flex items-center gap-1">
                                                        <AlertTriangle size={12} className="text-amber-600" />
                                                        Perhatian Pelepasan Unit Kamar
                                                    </p>
                                                    <p className="text-amber-800 text-[11px] leading-relaxed">
                                                        Setelah proses check-out dikonfirmasi, unit <strong>{selectedTenantForCheckout.room_type}</strong> di <strong>{selectedTenantForCheckout.property?.title}</strong> akan otomatis diubah statusnya menjadi <strong>KOSONG (Tersedia)</strong> dan siap dipasarkan ke pencari kost baru.
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Catatan Serah Terima / Kondisi Kamar (Opsional)</label>
                                                    <textarea
                                                        rows={3}
                                                        placeholder="Kunci diterima lengkap, meteran listrik 1420 kWh, tidak ada kerusakan..."
                                                        value={checkoutNotes}
                                                        onChange={e => setCheckoutNotes(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20"
                                                    />
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTenantForCheckout(null)}
                                                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer"
                                                    >
                                                        Batal
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={isCheckingOut}
                                                        className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                                                    >
                                                        {isCheckingOut ? 'Memproses...' : 'Kosongkan Unit Kamar'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                {/* ========================================================= */}
                                {/* MODAL 3: DETAIL PROFIL & DOKUMEN PENGHUNI                */}
                                {/* ========================================================= */}
                                {selectedTenantForDetail && (
                                    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in">
                                        <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center font-black text-sm uppercase shadow-xs">
                                                        {(selectedTenantForDetail.user?.name || 'P').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{selectedTenantForDetail.user?.name}</h3>
                                                        <p className="text-[10px] text-slate-500 font-bold">{selectedTenantForDetail.property?.title} - {selectedTenantForDetail.room_type}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedTenantForDetail(null)}
                                                    className="p-2 hover:bg-slate-200/70 rounded-full text-slate-400 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                                                {/* Info Grid */}
                                                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                    <div>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">No. WhatsApp</span>
                                                        <span className="font-bold text-slate-800">{selectedTenantForDetail.user?.phone || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Tarif Sewa</span>
                                                        <span className="font-bold text-orange-600">{FORMAT_CURRENCY(selectedTenantForDetail.totalRent || 0)} / bln</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Mulai Sewa</span>
                                                        <span className="font-bold text-slate-800 font-mono">{selectedTenantForDetail.start_date || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Jatuh Tempo</span>
                                                        <span className="font-bold text-slate-800 font-mono">{selectedTenantForDetail.end_date || '-'}</span>
                                                    </div>
                                                </div>

                                                {/* Foto KTP jika ada */}
                                                {selectedTenantForDetail.user?.photo_url && (
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Foto Dokumen KTP Penghuni</label>
                                                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-56 flex items-center justify-center">
                                                            <img
                                                                src={selectedTenantForDetail.user.photo_url}
                                                                alt="KTP Penghuni"
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTenantForDetail(null)}
                                                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                                >
                                                    Tutup
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* =========================================== */}
                    {/* TAB: BILLING                                */}
                    {/* =========================================== */}
                    {activeTab === 'billing' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {/* Actions bar */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                                <input
                                    type="text"
                                    placeholder="🔍 Cari nomor tagihan atau penerima..."
                                    value={invoiceSearch}
                                    onChange={e => setInvoiceSearch(e.target.value)}
                                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 w-full sm:max-w-xs"
                                />
                                <button
                                    onClick={() => {
                                        if (tenants.length === 0) return alert('Belum ada data penghuni aktif di properti KostManager untuk ditagih.');
                                        setIsAddBillOpen(true);
                                    }}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 flex items-center gap-2 self-stretch sm:self-auto justify-center"
                                >
                                    ➕ Terbitkan Tagihan Sewa
                                </button>
                            </div>

                            {/* Invoices list */}
                            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">No. Tagihan</th>
                                                <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Penerima (Kost)</th>
                                                <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Tanggal Tagihan</th>
                                                <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Jatuh Tempo</th>
                                                <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Total Tagihan</th>
                                                <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {invoices
                                                .filter(inv => !invoiceSearch || 
                                                    inv.bill_number.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                                                    inv.recipient_name.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                                                    inv.kost_name.toLowerCase().includes(invoiceSearch.toLowerCase())
                                                )
                                                .map(inv => (
                                                    <tr key={inv.id} className="hover:bg-gray-50/50">
                                                        <td className="px-6 py-4 font-bold text-gray-900">{inv.bill_number}</td>
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-gray-800">{inv.recipient_name}</p>
                                                            <p className="text-gray-400 mt-0.5 font-semibold">{inv.kost_name}</p>
                                                        </td>
                                                        <td className="px-6 py-4 font-semibold text-gray-600">
                                                            {new Date(inv.bill_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 font-semibold text-gray-600">
                                                            {new Date(inv.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-orange-600 text-sm">
                                                            {FORMAT_CURRENCY(inv.total)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${
                                                                inv.status === 'paid' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                                inv.status === 'cancelled' ? 'bg-red-50 text-red-500 border border-red-100' :
                                                                'bg-blue-50 text-blue-600 border border-blue-100'
                                                            }`}>
                                                                {inv.status === 'paid' ? 'Lunas' : inv.status === 'cancelled' ? 'Batal' : 'Terbit'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right space-x-2">
                                                            {inv.status === 'issued' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleUpdateStatusBill(inv.id, 'paid')}
                                                                        className="bg-green-50 hover:bg-green-100 text-green-600 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                                                    >
                                                                        Verif Lunas
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateStatusBill(inv.id, 'cancelled')}
                                                                        className="bg-red-50 hover:bg-red-100 text-red-500 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                                                    >
                                                                        Batalkan
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =========================================== */}
                    {/* TAB: PACKAGES                               */}
                    {/* =========================================== */}
                    {activeTab === 'packages' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {/* Actions bar */}
                            <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Daftar Paket Langganan KostManager</h3>
                                <button
                                    onClick={() => {
                                        setEditingPkgId(null);
                                        setPkgForm({
                                            duration_months: 1,
                                            price: 15000,
                                            label: '',
                                            is_active: true
                                        });
                                        setIsAddPkgOpen(true);
                                    }}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 flex items-center gap-2"
                                >
                                    ➕ Tambah Paket Baru
                                </button>
                            </div>

                            {/* Packages list */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {packages.map(pkg => (
                                    <div key={pkg.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group">
                                        {!pkg.is_active && (
                                            <div className="absolute top-2 right-2 bg-gray-100 text-gray-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Nonaktif
                                            </div>
                                        )}
                                        {pkg.is_active && (
                                            <div className="absolute top-2 right-2 bg-orange-100 text-orange-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Aktif
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">{pkg.label}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Durasi: {pkg.duration_months} Bulan</p>
                                            <div className="my-4 text-3xl font-black text-orange-500">
                                                {FORMAT_CURRENCY(pkg.price)}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-4 border-t border-gray-50 mt-4 font-sans">
                                            <button
                                                onClick={() => {
                                                    setEditingPkgId(pkg.id);
                                                    setPkgForm({
                                                        duration_months: pkg.duration_months,
                                                        price: pkg.price,
                                                        label: pkg.label,
                                                        is_active: pkg.is_active
                                                    });
                                                    setIsAddPkgOpen(true);
                                                }}
                                                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeletePackage(pkg.id)}
                                                className="bg-red-50 hover:bg-red-100 text-red-500 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                            >
                                                🗑️ Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
                </div>
            </div>

            {/* MODAL: TERBITKAN TAGIHAN SEWA */}
            {isAddBillOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Formulir Tagihan</p>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mt-0.5">Tagih Sewa Bulanan</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setIsAddBillOpen(false);
                                    setSelectedTenantIdForBill('');
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleCreateBill} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Pilih Tenant */}
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Pilih Penghuni Kost <span className="text-red-500">*</span></label>
                                <select
                                    value={selectedTenantIdForBill}
                                    onChange={e => setSelectedTenantIdForBill(e.target.value)}
                                    required
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400"
                                >
                                    <option value="">-- Pilih Penghuni Aktif --</option>
                                    {tenants.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.user?.name} ({t.property?.title} - {t.room_type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedTenantIdForBill && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Nominal Sewa Pokok (Rp)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={billForm.rentalAmount}
                                                onChange={e => setBillForm({ ...billForm, rentalAmount: Number(e.target.value) })}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Tanggal Jatuh Tempo</label>
                                            <input
                                                type="date"
                                                required
                                                value={billForm.dueDate}
                                                onChange={e => setBillForm({ ...billForm, dueDate: e.target.value })}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Biaya Tambahan */}
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Biaya Tambahan / Denda (Opsional)</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nama Biaya</label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: Denda Keterlambatan / Listrik"
                                                    value={billForm.extraFeeName}
                                                    onChange={e => setBillForm({ ...billForm, extraFeeName: e.target.value })}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nominal (Rp)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={billForm.extraFee || ''}
                                                    onChange={e => setBillForm({ ...billForm, extraFee: Number(e.target.value) })}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Catatan Tagihan</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Contoh: Tagihan sewa periode Juni 2026. Mohon bayar tepat waktu."
                                            value={billForm.notes}
                                            onChange={e => setBillForm({ ...billForm, notes: e.target.value })}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 resize-none"
                                        />
                                    </div>

                                    {/* Total Summary */}
                                    <div className="bg-gradient-to-r from-orange-500 to-amber-400 p-5 rounded-2xl text-white flex justify-between items-center shadow-lg">
                                        <div>
                                            <p className="text-[10px] font-black text-orange-100 uppercase tracking-widest">Total Ditagihkan</p>
                                            <p className="text-2xl font-black">{FORMAT_CURRENCY(Number(billForm.rentalAmount) + Number(billForm.extraFee))}</p>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submittingBill}
                                            className="bg-white text-orange-600 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                                        >
                                            {submittingBill ? 'Memproses...' : 'Kirim Tagihan'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: TAMBAH/EDIT PAKET LANGGANAN */}
            {isAddPkgOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pengaturan Paket</p>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mt-0.5">
                                    {editingPkgId ? 'Edit Paket Langganan' : 'Tambah Paket Baru'}
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setIsAddPkgOpen(false);
                                    setEditingPkgId(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSavePackage} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Durasi Paket (Dalam Bulan) <span className="text-red-500">*</span></label>
                                <select
                                    value={pkgForm.duration_months}
                                    onChange={e => {
                                        const dur = Number(e.target.value);
                                        let defaultLabel = '';
                                        if (dur === 1) defaultLabel = 'Bulanan';
                                        else if (dur === 12) defaultLabel = 'Tahunan';
                                        else defaultLabel = `${dur} Bulan`;

                                        setPkgForm({ 
                                            ...pkgForm, 
                                            duration_months: dur,
                                            label: pkgForm.label ? pkgForm.label : defaultLabel
                                        });
                                    }}
                                    required
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white"
                                >
                                    <option value={1}>1 Bulan (Bulanan)</option>
                                    {[2,3,4,5,6,7,8,9,10,11].map(m => (
                                        <option key={m} value={m}>{m} Bulan</option>
                                    ))}
                                    <option value={12}>12 Bulan (Tahunan)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Label Paket <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Bulanan / Tahunan / 3 Bulan"
                                    value={pkgForm.label}
                                    onChange={e => setPkgForm({ ...pkgForm, label: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Harga Paket (Rp) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    required
                                    placeholder="Contoh: 100000"
                                    value={pkgForm.price || ''}
                                    onChange={e => setPkgForm({ ...pkgForm, price: Number(e.target.value) })}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="pkg-active-cb"
                                    checked={pkgForm.is_active}
                                    onChange={e => setPkgForm({ ...pkgForm, is_active: e.target.checked })}
                                    className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded cursor-pointer bg-white"
                                />
                                <label htmlFor="pkg-active-cb" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                                    Aktifkan Paket Ini (Muncul di Landing Page)
                                </label>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddPkgOpen(false);
                                        setEditingPkgId(null);
                                    }}
                                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPkg}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                                >
                                    {savingPkg ? 'Menyimpan...' : 'Simpan Paket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: TAMBAH PROPERTI KELOLAAN KOSTMANAGER (LAYOUT SUPER ADMIN SPLIT-VIEW & ACCORDION) */}
            {isAddPropOpen && (
                <ManagedPropertyAddModal
                    onClose={() => setIsAddPropOpen(false)}
                    onSuccess={() => {
                        setIsAddPropOpen(false);
                        loadAllData();
                    }}
                    ownersList={ownersList}
                    newPropForm={newPropForm}
                    setNewPropForm={setNewPropForm}
                    savingProp={savingProp}
                    setSavingProp={setSavingProp}
                    editingPropertyId={editingPropertyId}
                />
            )}

            {/* MODAL: DETAIL KAMAR PROPERTI */}
            {selectedPropForRoomDetail && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Detail Hunian & Kamar</span>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mt-1.5">{selectedPropForRoomDetail.title}</h3>
                                <p className="text-xs text-gray-400 font-bold mt-0.5">{selectedPropForRoomDetail.city}, {selectedPropForRoomDetail.address}</p>
                            </div>
                            <button
                                onClick={() => setSelectedPropForRoomDetail(null)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {selectedPropForRoomDetail.room_types.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 font-bold uppercase tracking-wider text-xs">
                                    Belum ada data tipe kamar yang terdaftar pada properti ini.
                                </div>
                            ) : (
                                selectedPropForRoomDetail.room_types.map((rt: any, index: number) => {
                                    // Cari penghuni di room type ini
                                    const roomTenants = tenants.filter(t => 
                                        t.kost_id === selectedPropForRoomDetail.id && 
                                        t.room_type?.toLowerCase() === rt.name?.toLowerCase() &&
                                        t.status === 'ACTIVE'
                                    );

                                    // Hitung kamar kosong
                                    const occupiedCount = roomTenants.length;
                                    const totalCount = rt.availableRoomCount ? (rt.availableRoomCount + occupiedCount) : Math.max(occupiedCount, 1);
                                    const emptyCount = Math.max(totalCount - occupiedCount, 0);

                                    return (
                                        <div key={index} className="border border-gray-100 rounded-2xl p-5 space-y-4 bg-gray-50/30">
                                            {/* Room Type Header */}
                                            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                                                <div>
                                                    <h4 className="font-black text-gray-900 text-sm uppercase tracking-tight">{rt.name}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Ukuran: {rt.size || 'N/A'} • Kapasitas: {rt.maxOccupants || 1} Org</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-orange-600 text-sm">{FORMAT_CURRENCY(rt.price)}<span className="text-[10px] text-gray-400 font-medium">/bulan</span></p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Total Kamar: {totalCount}</p>
                                                </div>
                                            </div>

                                            {/* Occupied List */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Daftar Kamar Terisi ({occupiedCount})</p>
                                                {roomTenants.map((t: any) => (
                                                    <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                                                                {t.user?.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-950 text-xs">{t.user?.name}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">📱 {t.user?.phone || '-'} • NIK: {t.metadata?.nik || '-'}</p>
                                                                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">
                                                                    Masa Sewa: {t.start_date} s/d {t.end_date}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex sm:flex-col items-start sm:items-end gap-2 justify-between">
                                                            <div>
                                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-left sm:text-right">Jatuh Tempo</p>
                                                                <p className="text-xs font-bold text-orange-600">{t.end_date}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPropForRoomDetail(null);
                                                                    setSelectedTenantIdForBill(t.id);
                                                                    setIsAddBillOpen(true);
                                                                }}
                                                                className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                                            >
                                                                🧾 Tagih
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {occupiedCount === 0 && (
                                                    <p className="text-[10px] text-gray-400 italic">Tidak ada kamar terisi saat ini.</p>
                                                )}
                                            </div>

                                            {/* Empty List */}
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Daftar Kamar Kosong</p>
                                                {emptyCount > 0 || occupiedCount === 0 ? (
                                                    <div className="bg-white border border-gray-100 border-dashed rounded-xl p-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-xl">🚪</span>
                                                            <div>
                                                                <p className="font-bold text-gray-800 text-xs">{emptyCount || 1} Kamar Kosong</p>
                                                                <p className="text-[9px] text-gray-400 font-semibold mt-0.5">Tersedia untuk disewa</p>
                                                            </div>
                                                        </div>
                                                        <span className="bg-green-50 text-green-600 border border-green-100 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                            📢 Siap Dipasarkan
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-gray-400 italic">Semua unit kamar tipe ini penuh.</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
                            <button
                                onClick={() => setSelectedPropForRoomDetail(null)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface ManagedPropertyAddModalProps {
    onClose: () => void;
    onSuccess: () => void;
    ownersList: { id: string; name: string; phone: string }[];
    newPropForm: any;
    setNewPropForm: React.Dispatch<React.SetStateAction<any>>;
    savingProp: boolean;
    setSavingProp: React.Dispatch<React.SetStateAction<boolean>>;
    editingPropertyId: string | null;
}

const ManagedPropertyAddModal: React.FC<ManagedPropertyAddModalProps> = ({
    onClose,
    onSuccess,
    ownersList,
    newPropForm,
    setNewPropForm,
    savingProp,
    setSavingProp,
    editingPropertyId
}) => {
    // 3-Step Navigation Tabs (Identical to Survey Review/Pendataan)
    const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
    
    // Active Room Index in Step 2
    const [activeRoomIdx, setActiveRoomIdx] = useState<number>(0);
    
    // Hero photo carousel state in Step 1
    const [selectedHeroPhotoIdx, setSelectedHeroPhotoIdx] = useState<number>(0);

    // Lightbox modal state
    const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; label?: string } | null>(null);

    // Temp Inputs
    const [tempFacilityInput, setTempFacilityInput] = useState('');
    const [tempRuleInput, setTempRuleInput] = useState('');
    const [uploadingRooms, setUploadingRooms] = useState<Record<string, boolean>>({});

    // Local files state
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);

    // Owner search dropdown
    const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
    const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
    const ownerDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(event.target as Node)) {
                setIsOwnerDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Helper: Normalize Room List across roomTypes
    const roomTypes = Array.isArray(newPropForm.roomTypes) ? newPropForm.roomTypes : [];
    
    // Flat rooms helper
    const getFlattenedRooms = () => {
        const list: any[] = [];
        roomTypes.forEach((rt: any, rtIdx: number) => {
            const rooms = Array.isArray(rt.rooms) ? rt.rooms : [];
            rooms.forEach((rm: any, rmIdx: number) => {
                list.push({
                    ...rm,
                    parentTypeIdx: rtIdx,
                    parentRoomIdx: rmIdx,
                    typeName: rt.name,
                    typePrice: rt.price,
                    typeSize: rt.size,
                    typeFacilities: rt.roomFacilities || [],
                    typeBathroomFacilities: rt.bathroomFacilities || []
                });
            });
        });
        return list;
    };

    const flatRooms = getFlattenedRooms();
    const activeRoom = flatRooms[activeRoomIdx] || flatRooms[0] || null;

    // Room Photo Upload per category (Kamar, Kasur, Kamar Mandi, Jendela)
    const handleUploadCategorizedRoomPhoto = async (categoryKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeRoom) return;
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];

        const uploadKey = `${activeRoom.parentTypeIdx}-${activeRoom.parentRoomIdx}-${categoryKey}`;
        setUploadingRooms(prev => ({ ...prev, [uploadKey]: true }));

        try {
            const folder = `kostmanager/rooms/${Date.now()}`;
            const publicUrl = await uploadFileAndGetURL(file, folder);

            setNewPropForm((prev: any) => {
                const updatedRoomTypes = (prev.roomTypes || []).map((rt: any, rtIdx: number) => {
                    if (rtIdx !== activeRoom.parentTypeIdx) return rt;
                    const updatedRooms = (rt.rooms || []).map((rm: any, rmIdx: number) => {
                        if (rmIdx !== activeRoom.parentRoomIdx) return rm;
                        const currentImages = Array.isArray(rm.images) ? [...rm.images] : [];
                        const currentCatPhotos = { ...(rm.categorizedPhotos || {}) };
                        const catList = Array.isArray(currentCatPhotos[categoryKey]) ? [...currentCatPhotos[categoryKey]] : [];
                        
                        if (!currentImages.includes(publicUrl)) currentImages.push(publicUrl);
                        if (!catList.includes(publicUrl)) catList.push(publicUrl);
                        currentCatPhotos[categoryKey] = catList;

                        return {
                            ...rm,
                            images: currentImages,
                            categorizedPhotos: currentCatPhotos
                        };
                    });
                    return { ...rt, rooms: updatedRooms };
                });
                return { ...prev, roomTypes: updatedRoomTypes };
            });
        } catch (error: any) {
            alert('Gagal mengunggah foto kamar: ' + error.message);
        } finally {
            e.target.value = '';
            setUploadingRooms(prev => ({ ...prev, [uploadKey]: false }));
        }
    };

    const handleDeleteCategorizedRoomPhoto = (categoryKey: string, photoUrl: string) => {
        if (!activeRoom) return;
        setNewPropForm((prev: any) => {
            const updatedRoomTypes = (prev.roomTypes || []).map((rt: any, rtIdx: number) => {
                if (rtIdx !== activeRoom.parentTypeIdx) return rt;
                const updatedRooms = (rt.rooms || []).map((rm: any, rmIdx: number) => {
                    if (rmIdx !== activeRoom.parentRoomIdx) return rm;
                    const currentImages = (rm.images || []).filter((u: string) => u !== photoUrl);
                    const currentCatPhotos = { ...(rm.categorizedPhotos || {}) };
                    if (currentCatPhotos[categoryKey]) {
                        currentCatPhotos[categoryKey] = currentCatPhotos[categoryKey].filter((u: string) => u !== photoUrl);
                    }
                    return {
                        ...rm,
                        images: currentImages,
                        categorizedPhotos: currentCatPhotos
                    };
                });
                return { ...rt, rooms: updatedRooms };
            });
            return { ...prev, roomTypes: updatedRoomTypes };
        });
    };

    // Update active room field directly
    const updateActiveRoomField = (field: string, value: any) => {
        if (!activeRoom) return;
        setNewPropForm((prev: any) => {
            const updatedRoomTypes = (prev.roomTypes || []).map((rt: any, rtIdx: number) => {
                if (rtIdx !== activeRoom.parentTypeIdx) return rt;
                const updatedRooms = (rt.rooms || []).map((rm: any, rmIdx: number) => {
                    if (rmIdx !== activeRoom.parentRoomIdx) return rm;
                    return { ...rm, [field]: value };
                });
                return { ...rt, rooms: updatedRooms };
            });
            return { ...prev, roomTypes: updatedRoomTypes };
        });
    };

    // Update active room type specification
    const updateActiveRoomTypeField = (field: string, value: any) => {
        if (!activeRoom) return;
        setNewPropForm((prev: any) => {
            const updatedRoomTypes = (prev.roomTypes || []).map((rt: any, rtIdx: number) => {
                if (rtIdx !== activeRoom.parentTypeIdx) return rt;
                return { ...rt, [field]: value };
            });
            return { ...prev, roomTypes: updatedRoomTypes };
        });
    };

    // Add new room unit to active type
    const handleAddNewRoomUnit = () => {
        if (!activeRoom) return;
        setNewPropForm((prev: any) => {
            const updatedRoomTypes = (prev.roomTypes || []).map((rt: any, rtIdx: number) => {
                if (rtIdx !== activeRoom.parentTypeIdx) return rt;
                const existing = rt.rooms || [];
                const nextNum = String((rtIdx + 1) * 100 + existing.length + 1);
                return {
                    ...rt,
                    rooms: [
                        ...existing,
                        {
                            roomNumber: nextNum,
                            status: 'kosong',
                            tenantName: '',
                            tenantPhone: '',
                            billingPeriod: 'bulanan',
                            dueDate: '',
                            images: [],
                            categorizedPhotos: {}
                        }
                    ]
                };
            });
            return { ...prev, roomTypes: updatedRoomTypes };
        });
        setActiveRoomIdx(flatRooms.length);
    };

    // Delete active room unit
    const handleDeleteActiveRoomUnit = () => {
        if (!activeRoom) return;
        if (flatRooms.length <= 1) {
            alert('Minimal properti harus memiliki 1 unit kamar.');
            return;
        }
        if (!confirm(`Apakah Anda yakin ingin menghapus Unit Kamar ${activeRoom.roomNumber || activeRoomIdx + 1}?`)) return;

        setNewPropForm((prev: any) => {
            const updatedRoomTypes = (prev.roomTypes || []).map((rt: any, rtIdx: number) => {
                if (rtIdx !== activeRoom.parentTypeIdx) return rt;
                const updatedRooms = (rt.rooms || []).filter((_: any, rmIdx: number) => rmIdx !== activeRoom.parentRoomIdx);
                return { ...rt, rooms: updatedRooms };
            });
            return { ...prev, roomTypes: updatedRoomTypes };
        });
        setActiveRoomIdx(Math.max(0, activeRoomIdx - 1));
    };

    // Toggle facility chips
    const toggleFacility = (facilityName: string) => {
        const current = newPropForm.facilities || [];
        if (current.includes(facilityName)) {
            setNewPropForm({ ...newPropForm, facilities: current.filter((f: string) => f !== facilityName) });
        } else {
            setNewPropForm({ ...newPropForm, facilities: [...current, facilityName] });
        }
    };

    // Toggle active room facility chips
    const toggleActiveRoomFacility = (facilityName: string) => {
        if (!activeRoom) return;
        setNewPropForm((prev: any) => {
            const updatedRoomTypes = (prev.roomTypes || []).map((rt: any, rtIdx: number) => {
                if (rtIdx !== activeRoom.parentTypeIdx) return rt;
                const currentFacs = rt.roomFacilities || [];
                const updatedFacs = currentFacs.includes(facilityName)
                    ? currentFacs.filter((f: string) => f !== facilityName)
                    : [...currentFacs, facilityName];
                return { ...rt, roomFacilities: updatedFacs };
            });
            return { ...prev, roomTypes: updatedRoomTypes };
        });
    };

    // Main media files select
    const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeExistingHeroImage = (urlToRemove: string) => {
        const currentList = newPropForm.imageUrls || [];
        const newList = currentList.filter((url: string) => url !== urlToRemove);
        setNewPropForm({ ...newPropForm, imageUrls: newList });
        setSelectedHeroPhotoIdx(Math.max(0, selectedHeroPhotoIdx - 1));
    };

    // Save handler
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPropForm.owner_uid) return alert('Pilih pemilik/mitra terlebih dahulu');
        if (!newPropForm.title) return alert('Nama gedung kost harus diisi');

        setSavingProp(true);
        try {
            let finalPrice = Number(newPropForm.price) || 0;
            if (newPropForm.roomTypes && newPropForm.roomTypes.length > 0) {
                const prices = newPropForm.roomTypes.map((rt: any) => Number(rt.price)).filter((p: number) => p > 0);
                if (prices.length > 0) finalPrice = Math.min(...prices);
            }

            const mappedRoomTypes = (newPropForm.roomTypes || []).map((rt: any) => ({
                name: rt.name,
                price: Number(rt.price),
                size: rt.size || '3x4m',
                isAvailable: (rt.rooms || []).some((r: any) => r.status === 'kosong'),
                availableRoomCount: (rt.rooms || []).filter((r: any) => r.status === 'kosong').length,
                maxOccupants: rt.maxOccupants || 1,
                roomFacilities: rt.roomFacilities || [],
                bathroomFacilities: rt.bathroomFacilities || [],
                rooms: (rt.rooms || []).map((r: any) => ({
                    roomNumber: r.roomNumber,
                    status: r.status,
                    tenantName: r.tenantName || '',
                    tenantPhone: r.tenantPhone || '',
                    billingPeriod: r.billingPeriod || 'bulanan',
                    dueDate: r.dueDate || '',
                    images: r.images || [],
                    categorizedPhotos: r.categorizedPhotos || {}
                }))
            }));

            const payload: any = {
                title: newPropForm.title,
                description: newPropForm.description || '',
                address: newPropForm.address,
                city: newPropForm.city,
                area: newPropForm.area || '',
                province: newPropForm.province || '',
                type: newPropForm.type,
                price: finalPrice,
                ownerUid: newPropForm.owner_uid,
                isManaged: true,
                roomTypes: mappedRoomTypes,
                location: newPropForm.location,
                facilities: newPropForm.facilities && newPropForm.facilities.length > 0 ? newPropForm.facilities : ['WiFi', 'Kasur', 'Lemari Pakaian'],
                imageUrls: newPropForm.imageUrls || [],
                videoUrls: newPropForm.videoUrls || [],
                instagramUrl: newPropForm.instagramUrl || '',
                tiktokUrl: newPropForm.tiktokUrl || '',
                rules: newPropForm.rules || [],
                campuses: newPropForm.campuses || [],
                publicFacilities: newPropForm.publicFacilities || [],
                additionalFeePrice: newPropForm.additionalFeePrice || 0,
                additionalFeeName: newPropForm.additionalFeeName || '',
                additionalFeeStartsFrom: newPropForm.additionalFeeStartsFrom || 'month_1',
                omnichannelContactName: newPropForm.omnichannelContactName || '',
                omnichannelContactPhone: newPropForm.omnichannelContactPhone || '',
                omnichannelContactType: newPropForm.omnichannelContactType || 'owner',
            };

            let propId = editingPropertyId;
            if (editingPropertyId) {
                await updatePropertyWithMedia(editingPropertyId, payload, newImageFiles, newVideoFiles);
            } else {
                payload.isVerified = true;
                propId = await addPropertyWithMedia(payload, newImageFiles, newVideoFiles);
            }

            alert(editingPropertyId ? '✅ Properti kelolaan KostManager berhasil diperbarui!' : '✅ Properti kelolaan KostManager berhasil ditambahkan!');
            onSuccess();
        } catch (err: any) {
            console.error('Error saving property studio:', err);
            alert('Gagal menyimpan properti: ' + err.message);
        } finally {
            setSavingProp(false);
        }
    };

    // Master Facility Categories (Identical to Survey Form)
    const facilityCategories = [
        {
            name: 'Kenyamanan & Umum',
            icon: Sparkles,
            items: ['WiFi Cepat', 'Dapur Bersama', 'Kulkas Bersama', 'Dispenser Air', 'Ruang Tamu', 'Ruang Cuci Jemur', 'Area Komunal']
        },
        {
            name: 'Keamanan & Akses',
            icon: ShieldCheck,
            items: ['CCTV 24 Jam', 'Akses Kunci 24 Jam', 'Penjaga Kost', 'Parkir Mobil', 'Parkir Motor', 'Gerbang Tertutup']
        },
        {
            name: 'Utilitas & Listrik',
            icon: Zap,
            items: ['Listrik Termasuk', 'Air PDAM / Sumur Bersih', 'Token Mandiri Tiap Kamar', 'Iuran Sampah Termasuk']
        }
    ];

    const allHeroImages = [
        ...normalizePhotoList(newPropForm.imageUrls || []), 
        ...newImageFiles.map(f => URL.createObjectURL(f))
    ];
    const totalOccupiedUnits = flatRooms.filter(r => r.status === 'terisi').length;
    const totalVacantUnits = flatRooms.length - totalOccupiedUnits;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-5xl w-full overflow-hidden max-h-[92vh] flex flex-col border border-slate-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                
                {/* ========================================================= */}
                {/* 1. HEADER MODAL (SURVEY REVIEW THEME)                    */}
                {/* ========================================================= */}
                <div className="p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff7a00] to-amber-500 text-white flex items-center justify-center shadow-xs">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span>KostManager Auto-Pilot</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">
                                    {editingPropertyId ? 'Mode Editor Properti' : 'Pendaftaran Baru'}
                                </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight mt-0.5">
                                {newPropForm.title || 'Properti Kelolaan Baru'}
                            </h3>
                        </div>
                    </div>

                    {/* 3-Tab Navigator Pills */}
                    <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
                        <button
                            type="button"
                            onClick={() => setActiveTab(1)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 1
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }`}
                        >
                            <Building2 size={14} className={activeTab === 1 ? 'text-orange-400' : 'text-slate-400'} />
                            <span>1. Profil Gedung</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab(2)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 2
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }`}
                        >
                            <Bed size={14} className={activeTab === 2 ? 'text-orange-400' : 'text-slate-400'} />
                            <span>2. Kamar & Penghuni ({flatRooms.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab(3)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeTab === 3
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }`}
                        >
                            <ShieldCheck size={14} className={activeTab === 3 ? 'text-orange-400' : 'text-slate-400'} />
                            <span>3. Mitra & Auto-Pilot</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors hidden sm:block"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ========================================================= */}
                {/* 2. BODY CONTENT (3 TABS)                                  */}
                {/* ========================================================= */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-slate-50/50">

                    {/* ===================================================== */}
                    {/* TAB 1: PROFIL & FASILITAS GEDUNG                     */}
                    {/* ===================================================== */}
                    {activeTab === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Hero Carousel: Foto Utama / Fasad Gedung */}
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Camera size={16} className="text-[#ff7a00]" />
                                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Foto Utama & Fasad Gedung ({allHeroImages.length})</h4>
                                    </div>
                                    <label className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#ff7a00] border border-orange-200 text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all">
                                        + Tambah Foto Gedung
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageFileSelect}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {allHeroImages.length > 0 ? (
                                    <div className="space-y-3">
                                        {/* Active Hero Image Display */}
                                        <div className="relative aspect-[16/8] sm:aspect-[16/7] rounded-2xl overflow-hidden bg-slate-950 shadow-inner group">
                                            <img
                                                src={allHeroImages[selectedHeroPhotoIdx] || allHeroImages[0]}
                                                alt="Fasad Bangunan"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                                <span>📸 Foto #{selectedHeroPhotoIdx + 1} of {allHeroImages.length}</span>
                                            </div>
                                            <div className="absolute top-3 right-3 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxPhoto({ url: allHeroImages[selectedHeroPhotoIdx], label: 'Foto Bangunan' })}
                                                    className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors"
                                                    title="Perbesar Foto"
                                                >
                                                    <ZoomIn size={14} />
                                                </button>
                                                {newPropForm.imageUrls && newPropForm.imageUrls[selectedHeroPhotoIdx] && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExistingHeroImage(newPropForm.imageUrls[selectedHeroPhotoIdx])}
                                                        className="p-2 rounded-xl bg-rose-600/80 text-white hover:bg-rose-700 transition-colors"
                                                        title="Hapus Foto Ini"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Thumbnail Strip */}
                                        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                            {allHeroImages.map((imgUrl, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setSelectedHeroPhotoIdx(idx)}
                                                    className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                                                        selectedHeroPhotoIdx === idx ? 'border-orange-500 ring-2 ring-orange-500/20 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                                                    }`}
                                                >
                                                    <img src={imgUrl} alt="Thumb" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                                        <Camera size={28} className="text-slate-300 mx-auto" />
                                        <p className="text-xs font-bold text-slate-500">Belum ada foto gedung yang diunggah.</p>
                                    </div>
                                )}
                            </div>

                            {/* Identitas Properti */}
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <Home size={16} className="text-[#ff7a00]" />
                                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Identitas & Tipe Kost</h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Nama Kost <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={newPropForm.title || ''}
                                            onChange={e => setNewPropForm({ ...newPropForm, title: e.target.value })}
                                            placeholder="Contoh: Kost Madani Exclusive"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-900 outline-none focus:bg-white focus:border-orange-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Tipe Gender</label>
                                        <select
                                            value={newPropForm.type || 'Campur'}
                                            onChange={e => setNewPropForm({ ...newPropForm, type: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-400"
                                        >
                                            <option value="Campur">Campur</option>
                                            <option value="Putra">Putra</option>
                                            <option value="Putri">Putri</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Deskripsi & Keunggulan</label>
                                    <textarea
                                        rows={3}
                                        value={newPropForm.description || ''}
                                        onChange={e => setNewPropForm({ ...newPropForm, description: e.target.value })}
                                        placeholder="Ceritakan suasana kost, lingkungan sekitar, dan fasilitas unggulan..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-orange-400 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Titik GPS & Alamat */}
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <MapPin size={16} className="text-[#ff7a00]" />
                                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Lokasi & Titik Koordinat GPS</h4>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-emerald-600" />
                                        <span>Smart Geocoding: Wilayah & Alamat Terdeteksi Otomatis</span>
                                    </span>
                                    <div className="px-3 py-1 bg-slate-100 rounded-xl text-[10px] font-mono font-bold text-slate-700 flex items-center gap-1.5">
                                        <Navigation size={12} className="text-orange-500" />
                                        <span>GPS: {newPropForm.location?.lat?.toFixed(5) || '-6.2088'}, {newPropForm.location?.lng?.toFixed(5) || '106.8456'}</span>
                                    </div>
                                </div>

                                {/* 3 Kolom Kategori Wilayah Terstruktur */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">🏛️ Provinsi</label>
                                        <input
                                            type="text"
                                            value={newPropForm.province || ''}
                                            onChange={e => setNewPropForm({ ...newPropForm, province: e.target.value })}
                                            placeholder="Contoh: Sulawesi Selatan"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-orange-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">🏙️ Kota / Kabupaten</label>
                                        <input
                                            type="text"
                                            value={newPropForm.city || ''}
                                            onChange={e => setNewPropForm({ ...newPropForm, city: e.target.value })}
                                            placeholder="Contoh: Makassar"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-orange-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">📍 Kecamatan / Area</label>
                                        <input
                                            type="text"
                                            value={newPropForm.area || ''}
                                            onChange={e => setNewPropForm({ ...newPropForm, area: e.target.value })}
                                            placeholder="Contoh: Tamalanrea"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-orange-400"
                                        />
                                    </div>
                                </div>

                                {/* Alamat Lengkap Real Bangunan */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                                            Alamat Lengkap Real Bangunan (Detail Jalan, No, RT/RW, Patokan) <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-[9px] text-slate-400 font-medium">Ditampilkan ke calon penyewa</span>
                                    </div>
                                    <textarea
                                        rows={2}
                                        value={newPropForm.address || ''}
                                        onChange={e => setNewPropForm({ ...newPropForm, address: e.target.value })}
                                        placeholder="Jalan, Nomor Rumah, RT/RW, Kelurahan, Patokan..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-orange-400 resize-none"
                                    />
                                </div>

                                <div className="h-60 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                                    <LocationPicker
                                        lat={newPropForm.location?.lat || -6.2088}
                                        lng={newPropForm.location?.lng || 106.8456}
                                        onLocationChange={(lat, lng, address, city, area, province) => {
                                            setNewPropForm((prev: any) => ({
                                                ...prev,
                                                location: { lat, lng },
                                                address: address || prev.address,
                                                city: city || prev.city,
                                                area: area || prev.area,
                                                province: province || prev.province
                                            }));
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Fasilitas Umum 3 Kategori */}
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <Sparkles size={16} className="text-[#ff7a00]" />
                                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Fasilitas Umum & Area Bersama ({newPropForm.facilities?.length || 0} Terpilih)</h4>
                                </div>

                                <div className="space-y-4">
                                    {facilityCategories.map((cat, cIdx) => (
                                        <div key={cIdx} className="space-y-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                                                {cat.name}
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {cat.items.map(fItem => {
                                                    const isChecked = (newPropForm.facilities || []).includes(fItem);
                                                    return (
                                                        <button
                                                            key={fItem}
                                                            type="button"
                                                            onClick={() => toggleFacility(fItem)}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                                                isChecked
                                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black'
                                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                                            }`}
                                                        >
                                                            {isChecked && <Check size={12} strokeWidth={3} />}
                                                            <span>{fItem}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===================================================== */}
                    {/* TAB 2: RINCIAN KAMAR & PENGHUNI TERDATA              */}
                    {/* ===================================================== */}
                    {activeTab === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Horizontal Room Selector Strip (Exact survey theme) */}
                            <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                        Pilih Unit Kamar untuk Dikelola:
                                    </span>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                                        <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                            Total: {flatRooms.length} Kamar
                                        </span>
                                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                            🔒 {totalOccupiedUnits} Terisi
                                        </span>
                                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                            ✨ {totalVacantUnits} Kosong
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                    {flatRooms.map((rm: any, rIdx: number) => {
                                        const isSelected = activeRoomIdx === rIdx;
                                        const isOccupied = rm.status === 'terisi' || Boolean(rm.tenantName);

                                        return (
                                            <button
                                                key={rIdx}
                                                type="button"
                                                onClick={() => setActiveRoomIdx(rIdx)}
                                                className={`px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
                                                    isSelected
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-orange-500/30'
                                                        : isOccupied
                                                            ? 'bg-amber-50/80 hover:bg-amber-100 text-slate-800 border-amber-200/90 shadow-2xs'
                                                            : 'bg-emerald-50/80 hover:bg-emerald-100 text-slate-800 border-emerald-200/90 shadow-2xs'
                                                }`}
                                            >
                                                <DoorClosed size={14} className={isSelected ? 'text-[#ff7a00]' : isOccupied ? 'text-amber-600' : 'text-emerald-600'} />
                                                <span>Kamar {rm.roomNumber || rIdx + 1}</span>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                                    isSelected
                                                        ? isOccupied ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'
                                                        : isOccupied ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                                                }`}>
                                                    {isOccupied ? '🔒 Terisi' : '✨ Kosong'}
                                                </span>
                                            </button>
                                        );
                                    })}

                                    <button
                                        type="button"
                                        onClick={handleAddNewRoomUnit}
                                        className="px-3.5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
                                    >
                                        <Plus size={14} /> + Tambah Kamar
                                    </button>
                                </div>
                            </div>

                            {/* Active Room Workspace */}
                            {activeRoom && (
                                <div className="space-y-5">
                                    {/* Active Room Banner */}
                                    <div className="p-4 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-white rounded-3xl border border-orange-200/80 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#ff7a00] text-white flex items-center justify-center font-black text-sm shadow-xs">
                                                #{activeRoomIdx + 1}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase">
                                                    Kamar {activeRoom.roomNumber || activeRoomIdx + 1} ({activeRoom.typeName || 'Standard'})
                                                </h4>
                                                <p className="text-[10px] text-slate-500 font-bold">
                                                    Tarif: {FORMAT_CURRENCY(Number(activeRoom.typePrice) || Number(newPropForm.price) || 0)}/bln • {activeRoom.typeSize || '3x4m'} • {activeRoom.status === 'terisi' ? '🔒 Terisi' : '✨ Kosong'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateActiveRoomField('status', activeRoom.status === 'terisi' ? 'kosong' : 'terisi')}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                                    activeRoom.status === 'terisi'
                                                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                                                        : 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                                }`}
                                            >
                                                {activeRoom.status === 'terisi' ? '🔒 Status: Terisi' : '✨ Status: Kosong'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDeleteActiveRoomUnit}
                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                                                title="Hapus Unit Kamar Ini"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* 1. Spesifikasi Kamar (Dimensi & Tarif) */}
                                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                            <Layers size={16} className="text-[#ff7a00]" />
                                            <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Dimensi & Tarif Kamar</h4>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Nomor Unit Kamar</label>
                                                <input
                                                    type="text"
                                                    value={activeRoom.roomNumber || ''}
                                                    onChange={e => updateActiveRoomField('roomNumber', e.target.value)}
                                                    placeholder="Contoh: 101 / A1"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Tarif Sewa (Rp/Bulan)</label>
                                                <input
                                                    type="number"
                                                    value={activeRoom.typePrice || ''}
                                                    onChange={e => updateActiveRoomTypeField('price', Number(e.target.value))}
                                                    placeholder="500000"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Dimensi Kamar (PxL)</label>
                                                <input
                                                    type="text"
                                                    value={activeRoom.typeSize || '3x4m'}
                                                    onChange={e => updateActiveRoomTypeField('size', e.target.value)}
                                                    placeholder="3x4 meter"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                                />
                                            </div>
                                        </div>

                                        {/* Fasilitas Kamar Chips */}
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Fasilitas Dalam Kamar</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['AC', 'Kamar Mandi Dalam', 'Kasur', 'Lemari Pakaian', 'Meja Belajar', 'Kursi', 'Jendela Luar', 'Water Heater', 'Kipas Angin'].map(rf => {
                                                    const isChecked = (activeRoom.typeFacilities || []).includes(rf);
                                                    return (
                                                        <button
                                                            key={rf}
                                                            type="button"
                                                            onClick={() => toggleActiveRoomFacility(rf)}
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer ${
                                                                isChecked
                                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                                            }`}
                                                        >
                                                            {isChecked && <Check size={11} strokeWidth={3} />}
                                                            <span>{rf}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Data Penghuni Terdata */}
                                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                            <Users size={16} className="text-[#ff7a00]" />
                                            <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Status Sewa & Data Penghuni</h4>
                                        </div>

                                        {activeRoom.status === 'terisi' ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Nama Penghuni</label>
                                                    <input
                                                        type="text"
                                                        value={activeRoom.tenantName || ''}
                                                        onChange={e => updateActiveRoomField('tenantName', e.target.value)}
                                                        placeholder="Nama penyewa aktif..."
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">No. WhatsApp Penghuni</label>
                                                    <input
                                                        type="text"
                                                        value={activeRoom.tenantPhone || ''}
                                                        onChange={e => updateActiveRoomField('tenantPhone', e.target.value)}
                                                        placeholder="08123456789"
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Jatuh Tempo Sewa</label>
                                                    <input
                                                        type="date"
                                                        value={activeRoom.dueDate || ''}
                                                        onChange={e => updateActiveRoomField('dueDate', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Periode Tagihan</label>
                                                    <select
                                                        value={activeRoom.billingPeriod || 'bulanan'}
                                                        onChange={e => updateActiveRoomField('billingPeriod', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                                    >
                                                        <option value="bulanan">Bulanan</option>
                                                        <option value="triwulan">3 Bulan</option>
                                                        <option value="tahunan">Tahunan</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-emerald-50 rounded-2xl border border-dashed border-emerald-200 text-center">
                                                <p className="text-xs font-bold text-emerald-800">✨ Unit Kamar Ini Berstatus Kosong (Siap Huni)</p>
                                                <button
                                                    type="button"
                                                    onClick={() => updateActiveRoomField('status', 'terisi')}
                                                    className="text-[11px] font-black text-orange-600 uppercase tracking-wider mt-1 hover:underline cursor-pointer"
                                                >
                                                    + Pasang Penghuni ke Kamar Ini
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Dokumentasi Foto Unit Kamar (4 Kategori Standar Survei) */}
                                    <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                            <Camera size={16} className="text-[#ff7a00]" />
                                            <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Dokumentasi Foto Unit Kamar (4 Kategori)</h4>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {[
                                                { key: 'interior', label: '🛏️ Interior Kamar' },
                                                { key: 'kasur', label: '🛌 Kasur & Bantal' },
                                                { key: 'wc', label: '🚿 Kamar Mandi' },
                                                { key: 'jendela', label: '🪟 Jendela / Ventilasi' }
                                            ].map(cat => {
                                                const catPhotos = (activeRoom.categorizedPhotos && activeRoom.categorizedPhotos[cat.key]) || [];
                                                const hasPhoto = catPhotos.length > 0;
                                                const uploadKey = `${activeRoom.parentTypeIdx}-${activeRoom.parentRoomIdx}-${cat.key}`;

                                                return (
                                                    <div key={cat.key} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{cat.label}</span>
                                                            <label className="text-[9px] font-black text-orange-600 uppercase cursor-pointer hover:underline">
                                                                {uploadingRooms[uploadKey] ? '...' : '+ Foto'}
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    disabled={uploadingRooms[uploadKey]}
                                                                    onChange={e => handleUploadCategorizedRoomPhoto(cat.key, e)}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                        </div>

                                                        {hasPhoto ? (
                                                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 group bg-black">
                                                                <img src={catPhotos[0]} alt={cat.label} className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setLightboxPhoto({ url: catPhotos[0], label: cat.label })}
                                                                        className="p-1 bg-white/80 text-slate-900 rounded-lg"
                                                                    >
                                                                        <ZoomIn size={12} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteCategorizedRoomPhoto(cat.key, catPhotos[0])}
                                                                        className="p-1 bg-rose-600 text-white rounded-lg"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="aspect-[4/3] rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 text-center bg-white/60">
                                                                <Camera size={18} className="text-slate-300 mb-0.5" />
                                                                <span className="text-[8px] text-slate-400 font-bold">Belum Ada</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===================================================== */}
                    {/* TAB 3: MITRA, REKENING & AUTO-PILOT HUB              */}
                    {/* ===================================================== */}
                    {activeTab === 3 && (() => {
                        const selectedOwner = ownersList.find(o => o.id === newPropForm.owner_uid);
                        const filteredOwners = ownersList.filter(o => 
                            o.name.toLowerCase().includes(ownerSearchQuery.toLowerCase()) ||
                            o.phone.includes(ownerSearchQuery)
                        );

                        // Financial simulation
                        const totalPotentialOmset = flatRooms.reduce((sum, r) => sum + (Number(r.typePrice) || Number(newPropForm.price) || 0), 0);
                        const realizedOmset = flatRooms.filter(r => r.status === 'terisi').reduce((sum, r) => sum + (Number(r.typePrice) || Number(newPropForm.price) || 0), 0);
                        const estimatedFee = Math.round(realizedOmset * 0.10);
                        const estimatedPayout = realizedOmset - estimatedFee;

                        return (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                {/* Mitra Pemilik Properti */}
                                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                        <Users size={16} className="text-[#ff7a00]" />
                                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Mitra Pemilik (Owner Payout) <span className="text-rose-500">*</span></h4>
                                    </div>

                                    <div className="relative" ref={ownerDropdownRef}>
                                        <button
                                            type="button"
                                            onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none text-left flex justify-between items-center cursor-pointer hover:border-orange-400"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                                                    {selectedOwner ? selectedOwner.name.charAt(0) : '?'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900">{selectedOwner ? selectedOwner.name : '-- Pilih Mitra Pemilik --'}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{selectedOwner ? `📱 ${selectedOwner.phone}` : 'Klik untuk mencari data mitra'}</p>
                                                </div>
                                            </div>
                                            <ArrowUpRight size={16} className={`text-slate-400 transition-transform ${isOwnerDropdownOpen ? 'rotate-90 text-orange-500' : ''}`} />
                                        </button>

                                        {isOwnerDropdownOpen && (
                                            <div className="absolute z-[9999] w-full bg-white border border-slate-200 mt-2 rounded-3xl shadow-xl overflow-hidden">
                                                <div className="p-3 border-b border-slate-100 bg-slate-50">
                                                    <input
                                                        type="text"
                                                        placeholder="Cari nama atau nomor WhatsApp mitra..."
                                                        value={ownerSearchQuery}
                                                        onChange={e => setOwnerSearchQuery(e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-56 overflow-y-auto p-1.5 divide-y divide-slate-50">
                                                    {filteredOwners.map(o => (
                                                        <button
                                                            key={o.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setNewPropForm({ ...newPropForm, owner_uid: o.id });
                                                                setIsOwnerDropdownOpen(false);
                                                                setOwnerSearchQuery('');
                                                            }}
                                                            className={`w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-2xl flex items-center justify-between ${
                                                                o.id === newPropForm.owner_uid ? 'bg-orange-50 text-orange-600' : 'text-slate-700 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <div>
                                                                <p className="font-black">{o.name}</p>
                                                                <p className="text-[10px] text-slate-400">{o.phone}</p>
                                                            </div>
                                                            {o.id === newPropForm.owner_uid && <Check size={14} className="text-orange-500" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Omnichannel WhatsApp Router */}
                                <div className="bg-gradient-to-br from-orange-50/60 via-white to-amber-50/60 p-5 rounded-3xl border border-orange-200/80 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-2xs">
                                            <MessageSquare size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Omnichannel WhatsApp Booking Router</h4>
                                            <p className="text-[10px] text-slate-500 font-bold">Nomor WhatsApp tujuan saat calon penyewa menekan tombol booking di web</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Nama Penanggung Jawab</label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: CS RuangSinggah / Pak Joko"
                                                value={newPropForm.omnichannelContactName || ''}
                                                onChange={e => setNewPropForm({ ...newPropForm, omnichannelContactName: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Nomor WhatsApp (628...)</label>
                                            <input
                                                type="text"
                                                placeholder="628123456789"
                                                value={newPropForm.omnichannelContactPhone || ''}
                                                onChange={e => setNewPropForm({ ...newPropForm, omnichannelContactPhone: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Simulasi Finansial Portofolio */}
                                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                        <DollarSign size={16} className="text-emerald-600" />
                                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Simulasi Finansial & Bagi Hasil Pemilik</h4>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Potensi Omset Penuh</span>
                                            <p className="text-sm font-black text-slate-900 mt-0.5">{FORMAT_CURRENCY(totalPotentialOmset)}</p>
                                            <span className="text-[9px] text-slate-400 font-bold">Jika seluruh {flatRooms.length} kamar terisi</span>
                                        </div>
                                        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider block">Realisasi Sewa Berjalan</span>
                                            <p className="text-sm font-black text-emerald-800 mt-0.5">{FORMAT_CURRENCY(realizedOmset)}</p>
                                            <span className="text-[9px] text-emerald-600 font-bold">{totalOccupiedUnits} kamar terisi aktif</span>
                                        </div>
                                        <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
                                            <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider block">Estimasi Payout Pemilik</span>
                                            <p className="text-sm font-black text-blue-800 mt-0.5">{FORMAT_CURRENCY(estimatedPayout)}</p>
                                            <span className="text-[9px] text-blue-600 font-bold">Setelah fee KostManager (10%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* ========================================================= */}
                {/* 3. FOOTER STICKY ACTION BAR                              */}
                {/* ========================================================= */}
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-200/60 transition-all cursor-pointer"
                    >
                        Batal
                    </button>

                    <div className="flex items-center gap-2">
                        {activeTab > 1 && (
                            <button
                                type="button"
                                onClick={() => setActiveTab((activeTab - 1) as any)}
                                className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer"
                            >
                                ← Sebelumnya
                            </button>
                        )}

                        {activeTab < 3 ? (
                            <button
                                type="button"
                                onClick={() => setActiveTab((activeTab + 1) as any)}
                                className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                            >
                                Lanjut: {activeTab === 1 ? 'Kamar & Penghuni →' : 'Mitra & Auto-Pilot →'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={savingProp}
                                className="px-7 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                            >
                                {savingProp ? (
                                    <span>Menyimpan Properti...</span>
                                ) : (
                                    <>
                                        <CheckCircle2 size={15} />
                                        <span>Simpan Perubahan Properti</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Lightbox Preview Modal */}
                {lightboxPhoto && (
                    <div className="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-4" onClick={() => setLightboxPhoto(null)}>
                        <div className="max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
                            <div className="p-3 bg-slate-800 text-white flex justify-between items-center text-xs font-bold">
                                <span>{lightboxPhoto.label || 'Preview Foto'}</span>
                                <button type="button" onClick={() => setLightboxPhoto(null)} className="p-1 hover:bg-slate-700 rounded-lg">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-2 flex items-center justify-center">
                                <img src={lightboxPhoto.url} alt="Full Preview" className="max-h-[75vh] w-auto object-contain rounded-2xl" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KostManagerPortal;
