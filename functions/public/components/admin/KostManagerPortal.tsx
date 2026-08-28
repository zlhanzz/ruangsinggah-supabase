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
    TrendingUp
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

            // 3. Ambil SELURUH properti yang is_managed = true dan non-draft
            const { data: props, error: pErr } = await supabase
                .from('properties')
                .select('*')
                .eq('is_managed', true)
                .neq('status', 'draft')
                .order('created_at', { ascending: false });

            if (pErr) throw pErr;

            const propOwnerIds = props?.map(p => p.owner_uid).filter(Boolean) || [];
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
                    area: newPropForm.area || '',
                    type: newPropForm.type,
                    price: finalPrice,
                    owner_uid: newPropForm.owner_uid,
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
                        images: r.images || []
                    };
                } else {
                    return {
                        roomNumber: r.roomNumber || `RM-${101 + idx}`,
                        status: 'kosong' as const,
                        tenantName: '',
                        tenantPhone: '',
                        billingPeriod: 'bulanan',
                        dueDate: '',
                        images: r.images || []
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
            type: p.type || 'Campur',
            price: p.price || 0,
            owner_uid: p.owner_uid || '',
            location: p.location || { lat: -6.2088, lng: 106.8456 },
            facilities: p.facilities || [],
            imageUrls: p.image_urls || [],
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
    const [activeSection, setActiveSection] = useState<string>('info');
    const [tempFacilityInput, setTempFacilityInput] = useState('');
    const [tempRuleInput, setTempRuleInput] = useState('');
    const [uploadingRooms, setUploadingRooms] = useState<Record<string, boolean>>({});

    // Local state for files (Main Media Tab)
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);

    const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
    const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
    const ownerDropdownRef = useRef<HTMLDivElement>(null);

    // Selected room type filter for room studio
    const [selectedRoomTypeTab, setSelectedRoomTypeTab] = useState<number>(0);

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

    const handleUploadRoomPhoto = async (typeIdx: number, roomIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        
        const roomKey = `${typeIdx}-${roomIdx}`;
        setUploadingRooms(prev => ({ ...prev, [roomKey]: true }));
        try {
            const folder = `kostmanager/rooms/${Date.now()}`;
            const publicUrl = await uploadFileAndGetURL(file, folder);
            
            setNewPropForm((prev: any) => {
                const updatedRoomTypes = (prev.roomTypes || []).map((rt: any, rtIdx: number) => {
                    if (rtIdx !== typeIdx) return rt;
                    const updatedRooms = (rt.rooms || []).map((rm: any, rmIdx: number) => {
                        if (rmIdx !== roomIdx) return rm;
                        const currentImages = rm.images || [];
                        if (currentImages.includes(publicUrl)) return rm;
                        return {
                            ...rm,
                            images: [...currentImages, publicUrl]
                        };
                    });
                    return { ...rt, rooms: updatedRooms };
                });
                return { ...prev, roomTypes: updatedRoomTypes };
            });
        } catch (error: any) {
            alert("Gagal mengunggah foto kamar: " + error.message);
        } finally {
            e.target.value = '';
            setUploadingRooms(prev => ({ ...prev, [roomKey]: false }));
        }
    };

    const handleDeleteRoomPhoto = (typeIdx: number, roomIdx: number, photoUrl: string) => {
        setNewPropForm((prev: any) => {
            const updatedRoomTypes = (prev.roomTypes || []).map((rt: any, rtIdx: number) => {
                if (rtIdx !== typeIdx) return rt;
                const updatedRooms = (rt.rooms || []).map((rm: any, rmIdx: number) => {
                    if (rmIdx !== roomIdx) return rm;
                    return {
                        ...rm,
                        images: (rm.images || []).filter((img: string) => img !== photoUrl)
                    };
                });
                return { ...rt, rooms: updatedRooms };
            });
            return { ...prev, roomTypes: updatedRoomTypes };
        });
    };

    // Location Search States
    const [searchLocationText, setSearchLocationText] = useState("");
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [searchLocationResults, setSearchLocationResults] = useState<any[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearchLocation = (text: string) => {
        setSearchLocationText(text);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (text.length < 3) {
            setSearchLocationResults([]);
            setIsSearchingLocation(false);
            return;
        }

        searchTimeoutRef.current = setTimeout(() => {
            setIsSearchingLocation(true);
            try {
                const gw = (window as any).google;
                if (!gw?.maps?.places?.AutocompleteService) { setIsSearchingLocation(false); return; }
                const svc = new gw.maps.places.AutocompleteService();
                svc.getPlacePredictions(
                    { input: text, componentRestrictions: { country: 'id' }, types: ['geocode', 'establishment'] },
                    (predictions: any[], status: string) => {
                        if (status === gw.maps.places.PlacesServiceStatus.OK && predictions) {
                            setSearchLocationResults(predictions);
                        } else {
                            setSearchLocationResults([]);
                        }
                        setIsSearchingLocation(false);
                    }
                );
            } catch (error) {
                console.error("Error searching location with Google Places:", error);
                setSearchLocationResults([]);
                setIsSearchingLocation(false);
            }
        }, 500);
    };

    const handleSelectSearchResult = (result: any) => {
        const gw = (window as any).google;
        if (!gw?.maps?.Geocoder) return;
        const geocoder = new gw.maps.Geocoder();
        geocoder.geocode(
            { placeId: result.place_id },
            (results: any[], status: string) => {
                if (status === 'OK' && results && results.length > 0) {
                    const loc = results[0].geometry.location;
                    const lat = loc.lat(), lng = loc.lng();
                    const address = results[0].formatted_address;
                    const components = results[0].address_components || [];
                    let city = '', area = '';
                    for (const comp of components) {
                        const types = comp.types || [];
                        if (types.includes('administrative_area_level_2') && !city) city = comp.long_name;
                        if (types.includes('administrative_area_level_3') && !city) city = comp.long_name;
                        if (types.includes('sublocality_level_1') && !area) area = comp.long_name;
                        if (types.includes('sublocality') && !area) area = comp.long_name;
                        if (types.includes('locality') && !city) city = comp.long_name;
                    }
                    setNewPropForm((prev: any) => {
                        const updates: any = { location: { lat, lng } };
                        if (city) updates.city = city.replace('Kota ', '').replace('Kabupaten ', '');
                        if (area) updates.area = area.replace('Kecamatan ', '');
                        if (address) updates.address = address;
                        return { ...prev, ...updates };
                    });
                    setSearchLocationText(address);
                    setSearchLocationResults([]);
                }
            }
        );
    };

    const sections = [
        { id: 'info', name: 'Identitas & Profil', icon: Building2, badge: newPropForm.title ? 'Siap' : 'Wajib' },
        { id: 'location', name: 'Lokasi & Kampus', icon: MapPin, badge: newPropForm.city ? 'Siap' : 'Wajib' },
        { id: 'media', name: 'Galeri Media', icon: Sparkles, badge: `${(newPropForm.imageUrls?.length || 0) + newImageFiles.length} Foto` },
        { id: 'facilities', name: 'Fasilitas & Utilitas', icon: Zap, badge: `${newPropForm.facilities?.length || 0} Item` },
        { id: 'rooms', name: 'Studio Kamar & Hunian', icon: Bed, badge: `${newPropForm.roomTypes?.reduce((s: number, rt: any) => s + (rt.rooms?.length || 0), 0) || 0} Unit` },
        { id: 'rules', name: 'Peraturan & Kebijakan', icon: ShieldCheck, badge: `${newPropForm.rules?.length || 0} Aturan` }
    ];

    const addFacility = (facName: string) => {
        const trimmed = facName.trim();
        if (!trimmed) return;
        const currentFacilities = newPropForm.facilities || [];
        if (currentFacilities.includes(trimmed)) {
            setNewPropForm({ ...newPropForm, facilities: currentFacilities.filter((f: string) => f !== trimmed) });
        } else {
            setNewPropForm({ ...newPropForm, facilities: [...currentFacilities, trimmed] });
        }
    };

    const removeFacility = (index: number) => {
        const currentFacilities = [...(newPropForm.facilities || [])];
        currentFacilities.splice(index, 1);
        setNewPropForm({ ...newPropForm, facilities: currentFacilities });
    };

    const addRule = () => {
        if (!tempRuleInput.trim()) return;
        const currentRules = newPropForm.rules || [];
        setNewPropForm({
            ...newPropForm,
            rules: [...currentRules, tempRuleInput.trim()]
        });
        setTempRuleInput('');
    };

    const removeRule = (index: number) => {
        const currentRules = [...(newPropForm.rules || [])];
        currentRules.splice(index, 1);
        setNewPropForm({ ...newPropForm, rules: currentRules });
    };

    const addRoomType = () => {
        const newIdx = (newPropForm.roomTypes?.length || 0) + 1;
        setNewPropForm({
            ...newPropForm,
            roomTypes: [
                ...(newPropForm.roomTypes || []),
                {
                    name: `Tipe Kamar ${newIdx}`,
                    price: newPropForm.price || 500000,
                    size: '3x4m',
                    maxOccupants: 1,
                    roomFacilities: ['Kasur', 'Lemari Pakaian', 'Jendela Luar'],
                    bathroomFacilities: ['Kamar Mandi Dalam'],
                    rooms: [
                        { roomNumber: String(newIdx * 100 + 1), status: 'kosong', tenantName: '', tenantPhone: '', billingPeriod: 'bulanan', dueDate: '', images: [] as string[] }
                    ]
                }
            ]
        });
        setSelectedRoomTypeTab((newPropForm.roomTypes?.length || 0));
    };

    const removeRoomType = (index: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus tipe kamar ini beserta seluruh unit di dalamnya?')) return;
        const updated = [...(newPropForm.roomTypes || [])];
        updated.splice(index, 1);
        setNewPropForm({ ...newPropForm, roomTypes: updated });
        setSelectedRoomTypeTab(0);
    };

    const updateRoomTypeField = (index: number, field: string, value: any) => {
        const updated = [...(newPropForm.roomTypes || [])];
        updated[index] = { ...updated[index], [field]: value };
        setNewPropForm({ ...newPropForm, roomTypes: updated });
    };

    const addRoomToType = (typeIndex: number) => {
        const updated = [...(newPropForm.roomTypes || [])];
        const existingRooms = updated[typeIndex].rooms || [];
        const nextRoomNum = String((typeIndex + 1) * 100 + existingRooms.length + 1);
        updated[typeIndex].rooms.push({
            roomNumber: nextRoomNum,
            status: 'kosong',
            tenantName: '',
            tenantPhone: '',
            billingPeriod: 'bulanan',
            dueDate: '',
            images: [] as string[]
        });
        setNewPropForm({ ...newPropForm, roomTypes: updated });
    };

    const removeRoomFromType = (typeIndex: number, roomIndex: number) => {
        const updated = [...(newPropForm.roomTypes || [])];
        updated[typeIndex].rooms.splice(roomIndex, 1);
        setNewPropForm({ ...newPropForm, roomTypes: updated });
    };

    const updateRoomField = (typeIndex: number, roomIndex: number, field: string, value: any) => {
        const updated = [...(newPropForm.roomTypes || [])];
        updated[typeIndex].rooms[roomIndex] = { ...updated[typeIndex].rooms[roomIndex], [field]: value };
        setNewPropForm({ ...newPropForm, roomTypes: updated });
    };

    const toggleRoomFacility = (typeIndex: number, facilityName: string) => {
        const updated = [...(newPropForm.roomTypes || [])];
        const current = updated[typeIndex].roomFacilities || [];
        if (current.includes(facilityName)) {
            updated[typeIndex].roomFacilities = current.filter((f: string) => f !== facilityName);
        } else {
            updated[typeIndex].roomFacilities = [...current, facilityName];
        }
        setNewPropForm({ ...newPropForm, roomTypes: updated });
    };

    // Campus & Public Facility Helpers
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;
        return parseFloat(d.toFixed(1));
    };

    const [activeMapPicker, setActiveMapPicker] = useState<{ field: 'campuses' | 'publicFacilities', index: number } | null>(null);

    const addObjectArrayItem = (field: 'campuses' | 'publicFacilities') => {
        setNewPropForm({ ...newPropForm, [field]: [...(newPropForm[field] || []), { name: '', distance: '', transportMode: 'walk' }] });
    };

    const updateObjectArrayItem = (field: 'campuses' | 'publicFacilities', index: number, key: string, value: any) => {
        const arr = [...(newPropForm[field] || [])];
        arr[index] = { ...arr[index], [key]: value };
        setNewPropForm({ ...newPropForm, [field]: arr });
    };

    const removeObjectArrayItem = (field: 'campuses' | 'publicFacilities', index: number) => {
        const arr = [...(newPropForm[field] || [])];
        arr.splice(index, 1);
        setNewPropForm({ ...newPropForm, [field]: arr });
    };

    // Media handlers
    const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };
    
    const removeNewImage = (index: number) => {
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingMedia = (type: 'imageUrls' | 'videoUrls', urlToRemove: string) => {
        const currentList = newPropForm[type] || [];
        const newList = currentList.filter((url: string) => url !== urlToRemove);
        setNewPropForm({ ...newPropForm, [type]: newList });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPropForm.owner_uid) return alert('Pilih pemilik/mitra terlebih dahulu');
        if (!newPropForm.title) return alert('Nama kost harus diisi');

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
                    images: r.images || []
                }))
            }));

            const payload: any = {
                title: newPropForm.title,
                description: newPropForm.description || '',
                address: newPropForm.address,
                city: newPropForm.city,
                area: newPropForm.area || '',
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

    const commonFacilities = [
        'WiFi Cepat', 'Dapur Bersama', 'Kulkas Bersama', 'Ruang Tamu', 'CCTV 24 Jam', 
        'Akses 24 Jam', 'Parkir Mobil', 'Parkir Motor', 'Ruang Cuci Jemur', 'Dispenser Air',
        'Penjaga Kost', 'Area Komunal', 'Listrik Termasuk'
    ];

    const commonRoomFacilities = [
        'AC', 'Kamar Mandi Dalam', 'Kasur', 'Lemari Pakaian', 'Meja Belajar', 
        'Kursi', 'Jendela Luar', 'Water Heater', 'Kipas Angin', 'Bantal & Guling'
    ];

    const commonRules = [
        'Dilarang merokok di dalam kamar',
        'Akses gerbang dikunci pukul 23.00 WITA',
        'Dilarang membawa hewan peliharaan',
        'Tamu lawan jenis dilarang menginap',
        'Wajib menjaga ketenangan setelah pukul 22.00',
        'Hemat penggunaan air dan listrik bersama'
    ];

    const renderSectionContent = () => {
        switch (activeSection) {
            // TAB 1: IDENTITAS & PROFIL
            case 'info': {
                const selectedOwner = ownersList.find(o => o.id === newPropForm.owner_uid);
                const filteredOwners = ownersList.filter(o => 
                    o.name.toLowerCase().includes(ownerSearchQuery.toLowerCase()) ||
                    o.phone.includes(ownerSearchQuery)
                );

                return (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* 1. Mitra Pemilik */}
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                                    Mitra Pemilik Properti <span className="text-rose-500">*</span>
                                </label>
                                <span className="text-[10px] font-bold text-slate-400">Terdaftar di RuangSinggah</span>
                            </div>

                            <div className="relative" ref={ownerDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)}
                                    className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-left flex justify-between items-center cursor-pointer shadow-2xs hover:border-orange-400 transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                                            {selectedOwner ? selectedOwner.name.charAt(0) : '?'}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900">{selectedOwner ? selectedOwner.name : '-- Pilih Pemilik Properti --'}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{selectedOwner ? selectedOwner.phone : 'Klik untuk mencari mitra'}</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight size={16} className={`text-slate-400 transition-transform ${isOwnerDropdownOpen ? 'rotate-90 text-orange-500' : ''}`} />
                                </button>
                                
                                {isOwnerDropdownOpen && (
                                    <div className="absolute z-[9999] w-full bg-white border border-slate-200 mt-2 rounded-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-3 border-b border-slate-100 bg-slate-50">
                                            <div className="relative flex items-center">
                                                <Search size={14} className="text-slate-400 absolute left-3" />
                                                <input
                                                    type="text"
                                                    placeholder="Ketik nama atau nomor telepon mitra..."
                                                    value={ownerSearchQuery}
                                                    onChange={e => setOwnerSearchQuery(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-orange-400"
                                                    autoFocus
                                                />
                                            </div>
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
                                                    className={`w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-2xl flex items-center justify-between transition-colors ${
                                                        o.id === newPropForm.owner_uid 
                                                            ? 'bg-orange-50 text-orange-600' 
                                                            : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div>
                                                        <p className="font-black">{o.name}</p>
                                                        <p className="text-[10px] text-slate-400">📱 {o.phone}</p>
                                                    </div>
                                                    {o.id === newPropForm.owner_uid && <Check size={14} className="text-orange-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Judul & Tipe Gender */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                                    Nama Gedung Kost <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Kost Madani Exclusive"
                                    value={newPropForm.title}
                                    onChange={e => setNewPropForm({ ...newPropForm, title: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                                    Tipe Gender
                                </label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {['Campur', 'Putra', 'Putri'].map(gender => (
                                        <button
                                            key={gender}
                                            type="button"
                                            onClick={() => setNewPropForm({ ...newPropForm, type: gender })}
                                            className={`py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all ${
                                                newPropForm.type === gender
                                                    ? gender === 'Putri' ? 'bg-pink-600 text-white border-pink-600 shadow-2xs' :
                                                      gender === 'Putra' ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' :
                                                      'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            {gender}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. Deskripsi & Harga Dasar */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                                    Deskripsi Singkat & Keunggulan
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Ceritakan lokasi strategis, suasana lingkungan, dan keunggulan kost..."
                                    value={newPropForm.description}
                                    onChange={e => setNewPropForm({ ...newPropForm, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                                    Harga Dasar Listing (Rp/Bulan)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span>
                                    <input
                                        type="number"
                                        placeholder="500000"
                                        value={newPropForm.price || ''}
                                        onChange={e => setNewPropForm({ ...newPropForm, price: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">Tarif terendah akan tampil sebagai harga 'Mulai dari' di katalog.</p>
                            </div>
                        </div>

                        {/* 4. Omnichannel WhatsApp Routing */}
                        <div className="bg-gradient-to-br from-orange-50/60 via-white to-amber-50/60 p-5 rounded-3xl border border-orange-200/80 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-2xs">
                                    <MessageSquare size={16} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Omnichannel WhatsApp Booking Router</h4>
                                    <p className="text-[10px] text-slate-500 font-bold">Tentukan nomor WhatsApp tujuan saat calon penyewa menekan tombol booking di web</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                <div>
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Nama Penanggung Jawab</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Admin RuangSinggah / Pak Joko (Penjaga)"
                                        value={newPropForm.omnichannelContactName || ''}
                                        onChange={e => setNewPropForm({ ...newPropForm, omnichannelContactName: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-orange-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Nomor WhatsApp (Format: 628...)</label>
                                    <input
                                        type="text"
                                        placeholder="628123456789"
                                        value={newPropForm.omnichannelContactPhone || ''}
                                        onChange={e => setNewPropForm({ ...newPropForm, omnichannelContactPhone: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono outline-none focus:border-orange-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            // TAB 2: LOKASI & KAMPUS
            case 'location': {
                return (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Kota / Kabupaten <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Makassar"
                                    value={newPropForm.city || ''}
                                    onChange={e => setNewPropForm({ ...newPropForm, city: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-400"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Kecamatan / Area</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Tamalanrea"
                                    value={newPropForm.area || ''}
                                    onChange={e => setNewPropForm({ ...newPropForm, area: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-400"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Koordinat GPS</label>
                                <div className="px-3.5 py-2.5 bg-slate-100 rounded-xl text-xs font-mono font-bold text-slate-700 flex items-center justify-between">
                                    <span>{newPropForm.location?.lat?.toFixed(5) || '-6.2088'}, {newPropForm.location?.lng?.toFixed(5) || '106.8456'}</span>
                                    <MapPin size={14} className="text-orange-500" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Alamat Lengkap Gedung <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="Jalan, Nomor, RT/RW, Patokan..."
                                value={newPropForm.address || ''}
                                onChange={e => setNewPropForm({ ...newPropForm, address: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-orange-400"
                            />
                        </div>

                        {/* Interactive Google Map Pin */}
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Titik Lokasi Peta (Location Pin)</label>
                                <span className="text-[10px] text-slate-400 font-bold">Geser penanda untuk menetapkan koordinat presisi</span>
                            </div>
                            <div className="h-64 rounded-2xl overflow-hidden border border-slate-200">
                                <LocationPicker
                                    lat={newPropForm.location?.lat || -6.2088}
                                    lng={newPropForm.location?.lng || 106.8456}
                                    onLocationChange={(lat, lng, address, city, area) => {
                                        setNewPropForm((prev: any) => ({
                                            ...prev,
                                            location: { lat, lng },
                                            address: address || prev.address,
                                            city: city || prev.city,
                                            area: area || prev.area
                                        }));
                                    }}
                                />
                            </div>
                        </div>

                        {/* Kampus Terdekat */}
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Akses Kampus Terdekat</label>
                                <button
                                    type="button"
                                    onClick={() => addObjectArrayItem('campuses')}
                                    className="px-3 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 text-[10px] font-black uppercase tracking-wider transition-all"
                                >
                                    + Tambah Kampus
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(newPropForm.campuses || []).map((camp: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-2xs">
                                        <input
                                            type="text"
                                            placeholder="Nama Kampus (misal: UNHAS / UMI / UNM)"
                                            value={camp.name || ''}
                                            onChange={e => updateObjectArrayItem('campuses', idx, 'name', e.target.value)}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Jarak (misal: 5 Menit / 800m)"
                                            value={camp.distance || ''}
                                            onChange={e => updateObjectArrayItem('campuses', idx, 'distance', e.target.value)}
                                            className="w-36 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeObjectArrayItem('campuses', idx)}
                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }

            // TAB 3: GALERI MEDIA
            case 'media': {
                const existingImages = newPropForm.imageUrls || [];

                return (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Upload Bar */}
                        <div className="border-2 border-dashed border-slate-300 hover:border-orange-400 bg-slate-50/60 p-6 rounded-3xl text-center space-y-3 transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-2xs">
                                <Sparkles size={22} />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 text-sm">Unggah Foto Bangunan Properti</p>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Format WebP, JPG, atau PNG. Foto akan otomatis dikonversi ke WebP berkualitas tinggi.</p>
                            </div>
                            <label className="inline-block px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95">
                                <span>Pilih Berkas Foto</span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageFileSelect}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* Existing Images Grid */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                                Foto Gedung Tersimpan ({existingImages.length})
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {existingImages.map((url: string, idx: number) => (
                                    <div key={idx} className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 shadow-2xs">
                                        <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            {idx === 0 && (
                                                <span className="absolute top-2 left-2 bg-orange-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md">
                                                    Cover Utama
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeExistingMedia('imageUrls', url)}
                                                className="p-1.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors"
                                                title="Hapus Foto"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Newly Selected Images Grid */}
                        {newImageFiles.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-emerald-700 uppercase tracking-wider block">
                                    Foto Baru yang Akan Diunggah ({newImageFiles.length})
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {newImageFiles.map((file, idx) => (
                                        <div key={idx} className="relative group rounded-2xl overflow-hidden border-2 border-emerald-400 aspect-video bg-slate-100 shadow-2xs">
                                            <img src={URL.createObjectURL(file)} alt="New" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(idx)}
                                                className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Video Tour Links */}
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3">
                            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">Tautan Video Virtual Tour (Opsional)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Link Reels Instagram</span>
                                    <input
                                        type="url"
                                        placeholder="https://instagram.com/reel/..."
                                        value={newPropForm.instagramUrl || ''}
                                        onChange={e => setNewPropForm({ ...newPropForm, instagramUrl: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                    />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Link Video TikTok</span>
                                    <input
                                        type="url"
                                        placeholder="https://tiktok.com/@.../video/..."
                                        value={newPropForm.tiktokUrl || ''}
                                        onChange={e => setNewPropForm({ ...newPropForm, tiktokUrl: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            // TAB 4: FASILITAS & UTILITAS
            case 'facilities': {
                return (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Fasilitas Umum Visual Chips */}
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                                    Fasilitas Umum & Area Bersama
                                </label>
                                <span className="text-[10px] font-bold text-slate-400">Klik untuk mengaktifkan / menonaktifkan</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {commonFacilities.map(fac => {
                                    const isSelected = (newPropForm.facilities || []).includes(fac);
                                    return (
                                        <button
                                            key={fac}
                                            type="button"
                                            onClick={() => addFacility(fac)}
                                            className={`px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer ${
                                                isSelected
                                                    ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            {isSelected && <Check size={12} />}
                                            <span>{fac}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Input Fasilitas Custom */}
                            <div className="flex gap-2 pt-2">
                                <input
                                    type="text"
                                    placeholder="Tambah fasilitas lain..."
                                    value={tempFacilityInput}
                                    onChange={e => setTempFacilityInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFacility(tempFacilityInput), setTempFacilityInput(''))}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        addFacility(tempFacilityInput);
                                        setTempFacilityInput('');
                                    }}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider"
                                >
                                    Tambah
                                </button>
                            </div>
                        </div>

                        {/* Biaya Tambahan (Add-on Fees) */}
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3">
                            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                                Biaya Tambahan & Add-on (Opsional)
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Nama Biaya Tambahan</span>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Parkir Mobil / Tambah Orang"
                                        value={newPropForm.additionalFeeName || ''}
                                        onChange={e => setNewPropForm({ ...newPropForm, additionalFeeName: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                    />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Tarif Biaya Tambahan (Rp/Bulan)</span>
                                    <input
                                        type="number"
                                        placeholder="100000"
                                        value={newPropForm.additionalFeePrice || ''}
                                        onChange={e => setNewPropForm({ ...newPropForm, additionalFeePrice: Number(e.target.value) })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            // TAB 5: STUDIO KAMAR & HUNIAN (THE CROWN JEWEL)
            case 'rooms': {
                const roomTypes = newPropForm.roomTypes || [];
                const currentType = roomTypes[selectedRoomTypeTab] || roomTypes[0];

                return (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Header & Type Switcher */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
                                {roomTypes.map((rt: any, rtIdx: number) => (
                                    <button
                                        key={rtIdx}
                                        type="button"
                                        onClick={() => setSelectedRoomTypeTab(rtIdx)}
                                        className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                                            selectedRoomTypeTab === rtIdx
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                        }`}
                                    >
                                        <span>{rt.name || `Tipe ${rtIdx + 1}`}</span>
                                        <span className="ml-1.5 text-[10px] opacity-70">({rt.rooms?.length || 0} Kamar)</span>
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={addRoomType}
                                className="px-3.5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shrink-0 shadow-2xs cursor-pointer"
                            >
                                + Tipe Kamar Baru
                            </button>
                        </div>

                        {currentType && (
                            <div className="space-y-6">
                                {/* Room Type Config Bar */}
                                <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2">
                                            <Bed size={18} className="text-orange-500" />
                                            <h4 className="font-black text-slate-900 text-sm uppercase">Konfigurasi {currentType.name}</h4>
                                        </div>
                                        {roomTypes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeRoomType(selectedRoomTypeTab)}
                                                className="text-rose-500 hover:bg-rose-50 px-2.5 py-1 rounded-xl text-xs font-bold"
                                            >
                                                Hapus Tipe Ini
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Nama Tipe Kamar</label>
                                            <input
                                                type="text"
                                                value={currentType.name}
                                                onChange={e => updateRoomTypeField(selectedRoomTypeTab, 'name', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Tarif Sewa (Rp/Bulan)</label>
                                            <input
                                                type="number"
                                                value={currentType.price || ''}
                                                onChange={e => updateRoomTypeField(selectedRoomTypeTab, 'price', Number(e.target.value))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Dimensi Kamar</label>
                                            <input
                                                type="text"
                                                value={currentType.size || '3x4m'}
                                                onChange={e => updateRoomTypeField(selectedRoomTypeTab, 'size', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                            />
                                        </div>
                                    </div>

                                    {/* Room Facilities Chips */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Fasilitas Dalam Kamar</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {commonRoomFacilities.map(rf => {
                                                const hasFac = (currentType.roomFacilities || []).includes(rf);
                                                return (
                                                    <button
                                                        key={rf}
                                                        type="button"
                                                        onClick={() => toggleRoomFacility(selectedRoomTypeTab, rf)}
                                                        className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                                            hasFac
                                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}
                                                    >
                                                        {rf}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Room Units Grid Header */}
                                <div className="flex justify-between items-center pt-2">
                                    <div>
                                        <h5 className="font-black text-slate-900 text-xs uppercase tracking-wider">Daftar Unit Kamar ({currentType.rooms?.length || 0} Unit)</h5>
                                        <p className="text-[10px] text-slate-400 font-bold">Atur nomor unit kamar, status keterisian, dan identitas penyewa</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => addRoomToType(selectedRoomTypeTab)}
                                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all"
                                    >
                                        + Tambah Unit Kamar
                                    </button>
                                </div>

                                {/* Room Units Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(currentType.rooms || []).map((rm: any, rmIdx: number) => {
                                        const isOccupied = rm.status === 'terisi';

                                        return (
                                            <div
                                                key={rmIdx}
                                                className={`p-5 rounded-3xl border transition-all space-y-4 ${
                                                    isOccupied
                                                        ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                                                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                                                            {rm.roomNumber || rmIdx + 1}
                                                        </div>
                                                        <div>
                                                            <input
                                                                type="text"
                                                                value={rm.roomNumber || ''}
                                                                onChange={e => updateRoomField(selectedRoomTypeTab, rmIdx, 'roomNumber', e.target.value)}
                                                                placeholder="No. Kamar"
                                                                className="font-black text-slate-900 text-xs bg-transparent border-b border-dashed border-slate-300 focus:border-orange-500 outline-none w-24"
                                                            />
                                                            <p className="text-[10px] text-slate-400 font-bold">{currentType.name}</p>
                                                        </div>
                                                    </div>

                                                    {/* Status Switcher Button */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateRoomField(selectedRoomTypeTab, rmIdx, 'status', isOccupied ? 'kosong' : 'terisi')}
                                                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                                                isOccupied
                                                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs'
                                                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                                            }`}
                                                        >
                                                            {isOccupied ? '🟢 Terisi' : '⚪ Kosong'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRoomFromType(selectedRoomTypeTab, rmIdx)}
                                                            className="text-slate-300 hover:text-rose-500 p-1"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Tenant Details (When Occupied) */}
                                                {isOccupied ? (
                                                    <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 space-y-2 text-xs">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Nama Penghuni</span>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nama penyewa..."
                                                                    value={rm.tenantName || ''}
                                                                    onChange={e => updateRoomField(selectedRoomTypeTab, rmIdx, 'tenantName', e.target.value)}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 mt-0.5"
                                                                />
                                                            </div>
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">No. WhatsApp</span>
                                                                <input
                                                                    type="text"
                                                                    placeholder="0812..."
                                                                    value={rm.tenantPhone || ''}
                                                                    onChange={e => updateRoomField(selectedRoomTypeTab, rmIdx, 'tenantPhone', e.target.value)}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 mt-0.5 font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Jatuh Tempo Sewa</span>
                                                                <input
                                                                    type="date"
                                                                    value={rm.dueDate || ''}
                                                                    onChange={e => updateRoomField(selectedRoomTypeTab, rmIdx, 'dueDate', e.target.value)}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 mt-0.5"
                                                                />
                                                            </div>
                                                            <div>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Periode Tagihan</span>
                                                                <select
                                                                    value={rm.billingPeriod || 'bulanan'}
                                                                    onChange={e => updateRoomField(selectedRoomTypeTab, rmIdx, 'billingPeriod', e.target.value)}
                                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 mt-0.5"
                                                                >
                                                                    <option value="bulanan">Bulanan</option>
                                                                    <option value="triwulan">3 Bulan</option>
                                                                    <option value="tahunan">Tahunan</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                                                        <p className="text-[11px] font-bold text-emerald-700">✨ Unit Kosong Siap Disewakan</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateRoomField(selectedRoomTypeTab, rmIdx, 'status', 'terisi')}
                                                            className="text-[10px] font-black text-orange-600 uppercase tracking-wider mt-1 hover:underline cursor-pointer"
                                                        >
                                                            + Isi Data Penghuni
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Room Photos Uploader */}
                                                <div>
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Foto Kamar ({(rm.images || []).length})</span>
                                                        <label className="text-[9px] font-black text-orange-600 uppercase tracking-wider hover:underline cursor-pointer">
                                                            {uploadingRooms[`${selectedRoomTypeTab}-${rmIdx}`] ? 'Mengunggah...' : '+ Tambah Foto'}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                disabled={uploadingRooms[`${selectedRoomTypeTab}-${rmIdx}`]}
                                                                onChange={e => handleUploadRoomPhoto(selectedRoomTypeTab, rmIdx, e)}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    </div>
                                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                                        {(rm.images || []).map((imgUrl: string, iIdx: number) => (
                                                            <div key={iIdx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 group">
                                                                <img src={imgUrl} alt="Room" className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteRoomPhoto(selectedRoomTypeTab, rmIdx, imgUrl)}
                                                                    className="absolute inset-0 bg-rose-950/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            }

            // TAB 6: PERATURAN & KEBIJAKAN
            case 'rules': {
                return (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Common Rules Suggestions */}
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3">
                            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                                Pilihan Aturan Standar KostManager
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {commonRules.map(rule => {
                                    const isAdded = (newPropForm.rules || []).includes(rule);
                                    return (
                                        <button
                                            key={rule}
                                            type="button"
                                            onClick={() => {
                                                if (isAdded) {
                                                    setNewPropForm({ ...newPropForm, rules: (newPropForm.rules || []).filter((r: string) => r !== rule) });
                                                } else {
                                                    setNewPropForm({ ...newPropForm, rules: [...(newPropForm.rules || []), rule] });
                                                }
                                            }}
                                            className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                                                isAdded
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-black'
                                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            {isAdded && <Check size={12} />}
                                            <span>{rule}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Rules List */}
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-3">
                            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                                Daftar Tata Tertib Gedung ({(newPropForm.rules || []).length})
                            </label>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Tulis aturan khusus lainnya..."
                                    value={tempRuleInput}
                                    onChange={e => setTempRuleInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRule())}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-orange-400"
                                />
                                <button
                                    type="button"
                                    onClick={addRule}
                                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider"
                                >
                                    Tambah
                                </button>
                            </div>

                            <div className="space-y-2 pt-2">
                                {(newPropForm.rules || []).map((r: string, i: number) => (
                                    <div key={i} className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl text-xs font-bold flex justify-between items-center">
                                        <span className="text-slate-800">{i + 1}. {r}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeRule(i)}
                                            className="text-slate-400 hover:text-rose-500 p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[110] flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-6xl w-full overflow-hidden max-h-[92vh] flex flex-col border border-slate-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                {/* 1. Header Bar Studio */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
                            <Building2 size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    🟢 Auto-Pilot Studio
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">
                                    {editingPropertyId ? 'Mode Pembaruan Data' : 'Pendaftaran Gedung Baru'}
                                </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-0.5">
                                {editingPropertyId ? `Studio Properti: ${newPropForm.title || 'Kost'}` : 'Tambah Properti Kost Baru'}
                            </h3>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 2. Split-View Body Workspace */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar Nav */}
                    <aside className="w-full md:w-64 bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200/80 p-3 space-y-1.5 overflow-x-auto md:overflow-y-auto flex md:block shrink-0 gap-1.5">
                        {sections.map(sec => {
                            const IconComponent = sec.icon;
                            const isActive = activeSection === sec.id;

                            return (
                                <button
                                    key={sec.id}
                                    type="button"
                                    onClick={() => setActiveSection(sec.id)}
                                    className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <IconComponent size={16} className={isActive ? 'text-orange-400' : 'text-slate-400'} />
                                        <span>{sec.name}</span>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                                    }`}>
                                        {sec.badge}
                                    </span>
                                </button>
                            );
                        })}
                    </aside>

                    {/* Form Content Area */}
                    <div className="flex-grow overflow-y-auto p-6 sm:p-8 bg-white">
                        {renderSectionContent()}
                    </div>
                </div>

                {/* 3. Sticky Bottom Action Bar */}
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-200/60 transition-all cursor-pointer"
                    >
                        Batal
                    </button>
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={savingProp}
                            className="px-7 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                        >
                            {savingProp ? (
                                <span>Menyimpan Studio...</span>
                            ) : (
                                <>
                                    <CheckCircle2 size={15} />
                                    <span>Simpan Perubahan Properti</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KostManagerPortal;
