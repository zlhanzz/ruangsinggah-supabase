import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { FORMAT_CURRENCY } from '../../constants';
import { 
    getResidentStatus, 
    getManualInvoices, 
    saveManualInvoice, 
    updateManualInvoiceStatus, 
    uploadFileAndGetURL, 
    addPropertyWithMedia, 
    updatePropertyWithMedia,
    KostManagerPackage,
    getKostManagerPackages,
    saveKostManagerPackage,
    deleteKostManagerPackage
} from '../../adminService';

// Leaflet LocationPicker Helper Component
const LocationPicker: React.FC<{ lat: number; lng: number; onLocationChange: (lat: number, lng: number, address: string, city?: string, area?: string) => void }> = ({ lat, lng, onLocationChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);

    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstance.current) return; // Initialize once

        if (typeof window.L === 'undefined') {
            console.error("Leaflet API not loaded");
            return;
        }

        const L = window.L;
        const initialLocation = [lat, lng];

        // Initialize Map
        const map = L.map(mapContainerRef.current).setView(initialLocation, 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Initialize Marker
        const marker = L.marker(initialLocation, { draggable: true }).addTo(map);

        const updatePositionAndAddress = async (lat: number, lng: number) => {
            // Reverse Geocoding using Nominatim
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
                    headers: {
                        'User-Agent': 'RuangSinggah/1.0'
                    }
                });
                const data = await response.json();
                const addressStr = data.display_name || "Alamat tidak ditemukan";
                const addressObj = data.address || {};
                const city = addressObj.city || addressObj.town || addressObj.municipality || addressObj.county || addressObj.state || '';
                const area = addressObj.suburb || addressObj.village || addressObj.district || addressObj.neighbourhood || '';
                
                onLocationChange(lat, lng, addressStr, city, area);
                setSearchQuery(addressStr);
            } catch (error) {
                console.error("Geocoding failed:", error);
                onLocationChange(lat, lng, "Gagal memuat alamat");
            }
        };

        // Listeners
        marker.on('dragend', function (event: any) {
            const marker = event.target;
            const position = marker.getLatLng();
            updatePositionAndAddress(position.lat, position.lng);
        });

        map.on('click', function (e: any) {
            marker.setLatLng(e.latlng);
            updatePositionAndAddress(e.latlng.lat, e.latlng.lng);
        });

        mapInstance.current = map;
        markerInstance.current = marker;

        // Force map invalidation to ensure tiles load correctly after rendering
        setTimeout(() => {
            map.invalidateSize();
        }, 100);

    }, []);

    // Update marker position if props change from outside
    useEffect(() => {
        if (markerInstance.current && mapInstance.current && window.L) {
            const currentLatLng = markerInstance.current.getLatLng();
            // Check difference to avoid loops
            if (Math.abs(currentLatLng.lat - lat) > 0.0001 || Math.abs(currentLatLng.lng - lng) > 0.0001) {
                const newLatLng = [lat, lng];
                markerInstance.current.setLatLng(newLatLng);
                mapInstance.current.setView(newLatLng, 15);
            }
        }
    }, [lat, lng]);

    return (
        <div id="map" ref={mapContainerRef} style={{ height: '300px', width: '100%', border: '1px solid #ccc', borderRadius: '0.75rem', zIndex: 0 }} />
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




    // --- FETCH DATA ---
    const loadAllData = async () => {
        setLoading(true);
        try {
            // Load packages first so it doesn't get blocked by early returns
            const pkgs = await getKostManagerPackages();
            setPackages(pkgs);

            // 1. Ambil owner (mitra) dengan status langganan kostmanager
            const { data: mitras, error: mErr } = await supabase
                .from('mitra')
                .select('user_id, business_name, business_address')
                .eq('subscription_status', 'kostmanager');

            if (mErr) throw mErr;
            const ownerIds = mitras?.map(m => m.user_id) || [];

            // 2. Ambil kostmanager_requests yang ACTIVE untuk property tambahan
            const { data: kmRequests } = await supabase
                .from('kostmanager_requests')
                .select('user_id, kost_name, empty_rooms')
                .eq('status', 'ACTIVE');

            const reqOwnerIds = kmRequests?.map(r => r.user_id) || [];

            // 3. Ambil semua owner_uid unik dari tabel properties yang sudah terdaftar (hanya yang dikelola KostManager)
            const { data: allProps } = await supabase
                .from('properties')
                .select('owner_uid')
                .eq('is_managed', true);
            const propOwnerIds = allProps?.map(p => p.owner_uid).filter(Boolean) || [];

            // Hanya tampilkan jika pemilik memiliki langganan aktif ('kostmanager') atau pengajuan aktif
            const activeOwnerIds = [...new Set([...ownerIds, ...reqOwnerIds])];
            const allOwnerIds = activeOwnerIds;

            // 4. Ambil seluruh daftar pemilik (mitra) dari platform untuk dropdown modal
            const { data: allMitraUsers } = await supabase
                .from('users')
                .select('id, name, phone')
                .in('role', ['owner', 'mitra']);
            
            const finalOwnersList = allMitraUsers?.map(o => ({
                id: o.id,
                name: o.name || 'Owner RuangSinggah',
                phone: o.phone || '-'
            })) || [];
            setOwnersList(finalOwnersList);

            if (allOwnerIds.length === 0) {
                setProperties([]);
                setTenants([]);
                setInvoices([]);
                setLoading(false);
                return;
            }

            // 5. Ambil data users pemilik (mitra) untuk info kontak properti ter-load
            const { data: owners } = await supabase
                .from('users')
                .select('id, name, phone')
                .in('id', allOwnerIds);
            const ownerMap = new Map(owners?.map(o => [o.id, o]) || []);

            // 6. Ambil properti dari pemilik-pemilik tersebut
            //    Hanya yang is_managed=true DAN sudah published (bukan draft)
            //    Properti draft = pendataan agen belum diapprove admin, belum boleh masuk portal
            const { data: props, error: pErr } = await supabase
                .from('properties')
                .select('*')
                .in('owner_uid', allOwnerIds)
                .eq('is_managed', true)
                .neq('status', 'draft');

            if (pErr) throw pErr;

            // 5. Ambil data resident_status (semua penyewa)
            const allResidents = await getResidentStatus();
            // Filter hanya penyewa di properti KostManager yang sudah published (non-draft)
            const managedPropIds = props?.map(p => p.id) || [];
            const managedResidents = (allResidents || []).filter((r: any) => managedPropIds.includes(r.kost_id));

            // Map data properties
            const mappedProperties: ManagedProperty[] = (props || []).map(p => {
                const owner = ownerMap.get(p.owner_uid);
                const req = kmRequests?.find(r => r.user_id === p.owner_uid && r.kost_name?.toLowerCase() === p.title?.toLowerCase());
                const occupants = managedResidents.filter((r: any) => r.kost_id === p.id && r.status === 'ACTIVE');

                return {
                    id: p.id,
                    title: p.title || 'Kost Tanpa Nama',
                    description: p.description || '',
                    address: p.address || '',
                    city: p.city || '',
                    area: p.area || '',
                    owner_uid: p.owner_uid,
                    type: p.type || 'Campur',
                    price: Number(p.price) || 0,
                    room_types: Array.isArray(p.room_types) ? p.room_types : [],
                    status: p.status || 'draft',
                    empty_rooms: req?.empty_rooms ?? 0,
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

            // 6. Ambil tagihan manual (filter kategori sewa)
            const allInvoices = await getManualInvoices();
            // PERBAIKAN: Jika belum ada properti terkelola (published), jangan tampilkan tagihan apapun.
            // Sebelumnya: (managedPropIds.length === 0 || ...) → saat length=0, kondisi TRUE → SEMUA tagihan tampil
            // Sekarang: wajib cocok dengan property_id atau kost_name dari properti yang benar-benar terkelola
            const rentInvoices = managedPropIds.length === 0 ? [] : (allInvoices || []).filter((inv: any) => {
                if (inv.category !== 'sewa') return false;
                // Prioritas 1: Cocokkan via kost_id (field langsung, paling akurat)
                if (inv.kost_id && managedPropIds.includes(inv.kost_id)) return true;
                // Prioritas 2: Cocokkan via judul properti (exact match, bukan partial)
                if (inv.kost_name) {
                    return mappedProperties.some(p =>
                        p.title?.toLowerCase().trim() === inv.kost_name?.toLowerCase().trim()
                    );
                }
                return false;
            });


            setProperties(mappedProperties);
            setTenants(managedResidents);
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
                    {/* TAB: PROPERTIES                             */}
                    {/* =========================================== */}
                    {activeTab === 'properties' && (
                        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                            {/* Search Header */}
                            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Properti Dalam Pengelolaan</h3>
                                <div className="flex w-full sm:w-auto items-center gap-3">
                                    <input
                                        type="text"
                                        placeholder="🔍 Cari nama properti, kota, atau pemilik..."
                                        value={propertySearch}
                                        onChange={e => setPropertySearch(e.target.value)}
                                        className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 w-full sm:max-w-xs"
                                    />
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
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 shrink-0"
                                    >
                                        ➕ Tambah Properti
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Nama Kost</th>
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Tipe / Lokasi</th>
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Pemilik (Mitra)</th>
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider text-center">Kamar Terisi</th>
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider text-center">Kamar Kosong</th>
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Status Listing</th>
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {properties
                                            .filter(p => !propertySearch || 
                                                p.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
                                                p.city.toLowerCase().includes(propertySearch.toLowerCase()) ||
                                                p.owner_name?.toLowerCase().includes(propertySearch.toLowerCase())
                                            )
                                            .map(p => (
                                                <tr key={p.id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4 font-bold text-gray-900">{p.title}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                                            p.type === 'Campur' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                            p.type === 'Putri' ? 'bg-pink-50 text-pink-600 border border-pink-100' :
                                                            'bg-blue-50 text-blue-600 border border-blue-100'
                                                        }`}>
                                                            {p.type}
                                                        </span>
                                                        <p className="text-gray-400 mt-1 font-semibold">{p.city}, {p.address}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-gray-800">{p.owner_name}</p>
                                                        <p className="text-gray-400 mt-0.5 font-semibold">📱 {p.owner_phone}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-green-600 text-sm">{p.occupant_count}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-amber-500 text-sm">{p.empty_rooms}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                                                            p.status === 'published' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button
                                                            onClick={() => handleEditProperty(p)}
                                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedPropForRoomDetail(p)}
                                                            className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                                        >
                                                            🚪 Detail Kamar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* =========================================== */}
                    {/* TAB: TENANTS                                */}
                    {/* =========================================== */}
                    {activeTab === 'tenants' && (
                        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                            {/* Search Header */}
                            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Penghuni Kost Aktif</h3>
                                <input
                                    type="text"
                                    placeholder="🔍 Cari nama penghuni atau kost..."
                                    value={tenantSearch}
                                    onChange={e => setTenantSearch(e.target.value)}
                                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 w-full sm:max-w-xs"
                                />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Nama Penghuni</th>
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Properti & Kamar</th>
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Masa Sewa</th>
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Harga Sewa</th>
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 font-black text-gray-500 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {tenants
                                            .filter(t => !tenantSearch || 
                                                t.user?.name?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
                                                t.property?.title?.toLowerCase().includes(tenantSearch.toLowerCase())
                                            )
                                            .map(t => {
                                                const basePrice = Number(t.metadata?.basePrice) || 0;
                                                const facilityFee = Number(t.metadata?.facilityFee) || 0;
                                                const extraFee = Number(t.metadata?.extraPersonFee) || 0;
                                                const totalRent = basePrice + facilityFee + extraFee;

                                                return (
                                                    <tr key={t.id} className="hover:bg-gray-50/50">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                                                    {t.user?.name?.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-900">{t.user?.name || 'Penyewa'}</p>
                                                                    <p className="text-gray-400 mt-0.5 font-semibold">📱 {t.user?.phone || '-'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-gray-800">{t.property?.title || 'Kost RuangSinggah'}</p>
                                                            <p className="text-gray-400 mt-0.5 font-semibold uppercase tracking-wider text-[9px]">{t.room_type || 'Standard'}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-gray-800">{t.start_date} s/d {t.end_date}</p>
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-orange-600 text-sm">
                                                            {FORMAT_CURRENCY(totalRent)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                                                                t.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                                                            }`}>
                                                                {t.status === 'ACTIVE' ? 'Aktif' : 'Habis'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTenantIdForBill(t.id);
                                                                    setIsAddBillOpen(true);
                                                                }}
                                                                className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                                            >
                                                                🧾 Tagih Sewa
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

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
            e.target.value = ''; // Reset input value to allow uploading same file again
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

    // Nominatim Geocoding Search States
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

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearchingLocation(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=id&limit=5`, {
                    headers: { 'User-Agent': 'RuangSinggah.id/1.0' }
                });
                const data = await response.json();
                setSearchLocationResults(data);
            } catch (error) {
                console.error("Error searching location with Nominatim:", error);
                setSearchLocationResults([]);
            } finally {
                setIsSearchingLocation(false);
            }
        }, 500);
    };

    const handleSelectSearchResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const address = result.display_name;

        setNewPropForm((prev: any) => {
            const updates: any = { location: { lat, lng } };
            const addressObj = result.address || {};
            const city = addressObj.city || addressObj.town || addressObj.municipality || addressObj.county || addressObj.state || '';
            const area = addressObj.suburb || addressObj.village || addressObj.district || addressObj.neighbourhood || '';
            
            if (city) updates.city = city.replace('Kota ', '').replace('Kabupaten ', '');
            if (area) updates.area = area.replace('Kecamatan ', '');
            if (address) updates.address = address;
            return { ...prev, ...updates };
        });

        setSearchLocationText(address);
        setSearchLocationResults([]);
    };

    const sections = [
        { id: 'info', name: 'Info Dasar' },
        { id: 'location', name: 'Lokasi & Kampus' },
        { id: 'media', name: 'Media' },
        { id: 'facilities', name: 'Fasilitas & Biaya' },
        { id: 'rooms', name: 'Tipe Kamar & Penghuni' },
        { id: 'rules', name: 'Peraturan' }
    ];

    const addFacility = () => {
        if (!tempFacilityInput.trim()) return;
        const currentFacilities = newPropForm.facilities || [];
        if (!currentFacilities.includes(tempFacilityInput.trim())) {
            setNewPropForm({
                ...newPropForm,
                facilities: [...currentFacilities, tempFacilityInput.trim()]
            });
        }
        setTempFacilityInput('');
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
        setNewPropForm({
            ...newPropForm,
            roomTypes: [
                ...newPropForm.roomTypes,
                {
                    name: 'Standard ' + (newPropForm.roomTypes.length + 1),
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
    };

    const removeRoomType = (index: number) => {
        const updated = [...newPropForm.roomTypes];
        updated.splice(index, 1);
        setNewPropForm({ ...newPropForm, roomTypes: updated });
    };

    const updateRoomTypeField = (index: number, field: string, value: any) => {
        const updated = [...newPropForm.roomTypes];
        updated[index] = { ...updated[index], [field]: value };
        setNewPropForm({ ...newPropForm, roomTypes: updated });
    };

    const addRoomToType = (typeIndex: number) => {
        const updated = [...newPropForm.roomTypes];
        const nextRoomNum = String(101 + updated[typeIndex].rooms.length);
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
        const updated = [...newPropForm.roomTypes];
        updated[typeIndex].rooms.splice(roomIndex, 1);
        setNewPropForm({ ...newPropForm, roomTypes: updated });
    };

    const updateRoomField = (typeIndex: number, roomIndex: number, field: string, value: any) => {
        const updated = [...newPropForm.roomTypes];
        updated[typeIndex].rooms[roomIndex] = { ...updated[typeIndex].rooms[roomIndex], [field]: value };
        setNewPropForm({ ...newPropForm, roomTypes: updated });
    };

    const [tempTagInput, setTempTagInput] = useState<Record<string, string>>({});
    const addRoomTag = (roomIndex: number, field: 'roomFacilities' | 'bathroomFacilities', tag: string) => {
        if (!tag.trim()) return;
        const rooms = [...newPropForm.roomTypes];
        const currentTags = rooms[roomIndex][field] || [];
        rooms[roomIndex][field] = [...currentTags, tag.trim()];
        setNewPropForm({ ...newPropForm, roomTypes: rooms });
        setTempTagInput({ ...tempTagInput, [`${roomIndex}-${field}`]: '' });
    };

    const removeRoomTag = (roomIndex: number, field: 'roomFacilities' | 'bathroomFacilities', tagIndex: number) => {
        const rooms = [...newPropForm.roomTypes];
        const currentTags = rooms[roomIndex][field] || [];
        currentTags.splice(tagIndex, 1);
        rooms[roomIndex][field] = currentTags;
        setNewPropForm({ ...newPropForm, roomTypes: rooms });
    };

    // Campus & Public Facility Helpers (Similar to Dashboard.tsx)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;
        return parseFloat(d.toFixed(1));
    };

    const [isSearchingFacilityMap, setIsSearchingFacilityMap] = useState<Record<string, boolean>>({});
    const [activeMapPicker, setActiveMapPicker] = useState<{ field: 'campuses' | 'publicFacilities', index: number } | null>(null);

    const searchFacilityCoordinates = async (field: 'campuses' | 'publicFacilities', index: number, name: string) => {
        if (!name) return;
        const stateKey = `${field}-${index}`;
        setIsSearchingFacilityMap(prev => ({ ...prev, [stateKey]: true }));
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&countrycodes=id&limit=1`, {
                headers: { 'User-Agent': 'RuangSinggah.id/1.0' }
            });
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                const arr = [...(newPropForm[field] || [])];
                
                let distString = arr[index].distance;
                if (newPropForm.location && newPropForm.location.lat) {
                    const km = calculateDistance(newPropForm.location.lat, newPropForm.location.lng, lat, lng);
                    distString = `± ${km} KM`;
                }

                arr[index] = { ...arr[index], lat, lng, distance: distString };
                setNewPropForm({ ...newPropForm, [field]: arr });
            } else {
                alert('Lokasi tidak ditemukan di peta. Coba setel nama yang lebih spesifik.');
            }
        } catch (error) {
            console.error('Error fetching facility location:', error);
            alert('Gagal mencari kordinat.');
        } finally {
            setIsSearchingFacilityMap(prev => ({ ...prev, [stateKey]: false }));
        }
    };

    const handleMapPickerSave = (lat: number, lng: number) => {
        if (!activeMapPicker) return;
        const { field, index } = activeMapPicker;
        const arr = [...(newPropForm[field] || [])];
        
        let distString = arr[index].distance;
        if (newPropForm.location && newPropForm.location.lat) {
            const km = calculateDistance(newPropForm.location.lat, newPropForm.location.lng, lat, lng);
            distString = `± ${km} KM`;
        }

        arr[index] = { ...arr[index], lat, lng, distance: distString };
        setNewPropForm({ ...newPropForm, [field]: arr });
        setActiveMapPicker(null);
    };

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

    // File handlers (Main Media Tab)
    const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };
    
    const removeNewImage = (index: number) => {
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewVideoFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeNewVideo = (index: number) => {
        setNewVideoFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingMedia = (type: 'imageUrls' | 'videoUrls', urlToRemove: string) => {
        const currentList = newPropForm[type] || [];
        const newList = currentList.filter((url: string) => url !== urlToRemove);
        setNewPropForm({ ...newPropForm, [type]: newList });
    };

    // Drag and drop for images
    const handleMediaDragStart = (e: React.DragEvent, index: number, type: 'existing' | 'new') => {
        e.dataTransfer.setData('index', index.toString());
        e.dataTransfer.setData('type', type);
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    };

    const handleMediaDragEnd = (e: React.DragEvent) => {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
    };

    const handleMediaDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleMediaDrop = (e: React.DragEvent, dropIndex: number, dropType: 'existing' | 'new') => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('index'));
        const dragType = e.dataTransfer.getData('type');

        if (dragType !== dropType) return;
        if (dragIndex === dropIndex) return;

        if (dragType === 'existing') {
            const items = [...(newPropForm.imageUrls || [])];
            const [movedItem] = items.splice(dragIndex, 1);
            items.splice(dropIndex, 0, movedItem);
            setNewPropForm({ ...newPropForm, imageUrls: items });
        } else {
            const items = [...newImageFiles];
            const [movedItem] = items.splice(dragIndex, 1);
            items.splice(dropIndex, 0, movedItem);
            setNewImageFiles(items);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPropForm.owner_uid) return alert('Pilih pemilik/mitra terlebih dahulu');
        if (!newPropForm.title) return alert('Nama kost harus diisi');

        setSavingProp(true);
        try {
            // Tentukan min price sebagai price dasar listing
            let finalPrice = Number(newPropForm.price) || 0;
            if (newPropForm.roomTypes.length > 0) {
                const prices = newPropForm.roomTypes.map((rt: any) => Number(rt.price)).filter((p: number) => p > 0);
                if (prices.length > 0) finalPrice = Math.min(...prices);
            }

            const mappedRoomTypes = newPropForm.roomTypes.map((rt: any) => ({
                name: rt.name,
                price: Number(rt.price),
                size: rt.size || '3x4m',
                isAvailable: rt.rooms.some((r: any) => r.status === 'kosong'),
                availableRoomCount: rt.rooms.filter((r: any) => r.status === 'kosong').length,
                maxOccupants: rt.maxOccupants || 1,
                roomFacilities: rt.roomFacilities || [],
                bathroomFacilities: rt.bathroomFacilities || [],
                rooms: rt.rooms.map((r: any) => ({
                    roomNumber: r.roomNumber,
                    status: r.status,
                    images: r.images || []
                }))
            }));

            // Structuring data for media upload helpers
            const payload: any = {
                title: newPropForm.title,
                description: newPropForm.description || '',
                address: newPropForm.address,
                city: newPropForm.city,
                area: newPropForm.area || '',
                type: newPropForm.type,
                price: finalPrice,
                ownerUid: newPropForm.owner_uid, // to be mapped to owner_uid/mitra_id in adminService
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

            // Simpan data penghuni (loop kamar terisi)
            for (const rt of newPropForm.roomTypes) {
                for (const rm of rt.rooms) {
                    if (rm.status === 'terisi' && rm.tenantName) {
                        // Cek apakah sudah terdaftar sebagai penyewa aktif di properti ini
                        const { data: existingResidents } = await supabase
                            .from('resident_status')
                            .select('id, user:user_id(name)')
                            .eq('kost_id', propId)
                            .eq('status', 'ACTIVE');
                        
                        const isAlreadyRegistered = existingResidents?.some((res: any) => 
                            res.user?.name?.toLowerCase() === rm.tenantName.toLowerCase()
                        );

                        if (isAlreadyRegistered) {
                            continue; // Skip jika penyewa sudah aktif
                        }

                        const tenantEmail = `tenant_${Date.now()}_${Math.floor(Math.random() * 1000)}@dummy.ruangsinggah.id`;
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

                        const { error: resErr } = await supabase
                            .from('resident_status')
                            .insert([{
                                user_id: userData.id,
                                kost_id: propId,
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

            alert(editingPropertyId ? 'Properti kelolaan KostManager berhasil diperbarui!' : 'Properti kelolaan KostManager berhasil ditambahkan!');
            onSuccess();
        } catch (err: any) {
            alert('Gagal menyimpan properti: ' + err.message);
        } finally {
            setSavingProp(false);
        }
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'info': {
                const selectedOwner = ownersList.find(o => o.id === newPropForm.owner_uid);
                const filteredOwners = ownersList.filter(o => 
                    o.name.toLowerCase().includes(ownerSearchQuery.toLowerCase()) ||
                    o.phone.includes(ownerSearchQuery)
                );
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Pilih Pemilik (Mitra) <span className="text-red-500">*</span></label>
                            <div className="relative" ref={ownerDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:border-orange-400 text-left flex justify-between items-center cursor-pointer hover:border-gray-300 transition-colors"
                                >
                                    <span>
                                        {selectedOwner 
                                            ? `${selectedOwner.name} (${selectedOwner.phone})`
                                            : '-- Pilih Pemilik Properti --'}
                                    </span>
                                    <svg 
                                        className={`w-4 h-4 text-gray-400 transition-transform ${isOwnerDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {isOwnerDropdownOpen && (
                                    <div className="absolute z-[9999] w-full bg-white border border-gray-200 mt-1 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Cari nama atau nomor HP mitra..."
                                                    value={ownerSearchQuery}
                                                    onChange={e => setOwnerSearchQuery(e.target.value)}
                                                    className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-orange-400 transition-colors"
                                                    autoFocus
                                                />
                                                <svg className="w-4 h-4 text-gray-400 absolute left-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                {ownerSearchQuery && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setOwnerSearchQuery('')}
                                                        className="absolute right-2.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto p-1 divide-y divide-gray-50">
                                            {filteredOwners.length > 0 ? (
                                                filteredOwners.map(o => {
                                                    const isSelected = o.id === newPropForm.owner_uid;
                                                    return (
                                                        <button
                                                            key={o.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setNewPropForm({ ...newPropForm, owner_uid: o.id });
                                                                setIsOwnerDropdownOpen(false);
                                                                setOwnerSearchQuery('');
                                                            }}
                                                            className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors ${
                                                                isSelected 
                                                                    ? 'bg-orange-50 text-orange-600' 
                                                                    : 'text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">{o.name}</span>
                                                                <span className="text-[10px] text-gray-400 font-medium">{o.phone}</span>
                                                            </div>
                                                            {isSelected && (
                                                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-center py-6 text-xs text-gray-400 font-medium">
                                                    Tidak ada mitra yang cocok.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Nama Kost <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: Kost Singgah Sini"
                                value={newPropForm.title}
                                onChange={e => setNewPropForm({ ...newPropForm, title: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Deskripsi Kost</label>
                            <textarea
                                rows={3}
                                placeholder="Tulis deskripsi detail properti..."
                                value={newPropForm.description}
                                onChange={e => setNewPropForm({ ...newPropForm, description: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Tipe Kost</label>
                                <select
                                    value={newPropForm.type}
                                    onChange={e => setNewPropForm({ ...newPropForm, type: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400"
                                >
                                    <option value="Campur">Campur</option>
                                    <option value="Putra">Putra</option>
                                    <option value="Putri">Putri</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Harga Pokok Awal (Rp)</label>
                                <input
                                    type="number"
                                    placeholder="Contoh: 1000000"
                                    value={newPropForm.price || ''}
                                    onChange={e => setNewPropForm({ ...newPropForm, price: Number(e.target.value) })}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400"
                                />
                            </div>
                        </div>

                        {/* Omnichannel WhatsApp forwarding section */}
                        <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 space-y-3 mt-4">
                            <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1.5 text-xs">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Omnichannel Contact (WhatsApp Forwarding)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Nama Kontak</label>
                                    <input
                                        type="text"
                                        placeholder="Nama Pemilik/Penjaga"
                                        value={newPropForm.omnichannelContactName || ''}
                                        onChange={e => setNewPropForm({ ...newPropForm, omnichannelContactName: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">WhatsApp (628...)</label>
                                    <input
                                        type="text"
                                        placeholder="628123456789"
                                        value={newPropForm.omnichannelContactPhone || ''}
                                        onChange={e => setNewPropForm({ ...newPropForm, omnichannelContactPhone: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1">Pihak Bertanggung Jawab</label>
                                <div className="flex gap-4 mt-1.5">
                                    <label className="flex items-center gap-2 cursor-pointer group text-xs font-bold text-gray-700">
                                        <input
                                            type="radio"
                                            name="contactType"
                                            value="owner"
                                            checked={newPropForm.omnichannelContactType === 'owner' || !newPropForm.omnichannelContactType}
                                            onChange={() => setNewPropForm({ ...newPropForm, omnichannelContactType: 'owner' })}
                                            className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                                        />
                                        <span>Pemilik Kost</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group text-xs font-bold text-gray-700">
                                        <input
                                            type="radio"
                                            name="contactType"
                                            value="caretaker"
                                            checked={newPropForm.omnichannelContactType === 'caretaker'}
                                            onChange={() => setNewPropForm({ ...newPropForm, omnichannelContactType: 'caretaker' })}
                                            className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300"
                                        />
                                        <span>Penjaga Kost</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
            case 'location':
                return (
                    <div className="space-y-4">
                        {/* Search Location Input using Nominatim */}
                        <div className="space-y-2 relative">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">Cari Lokasi (Nama Jalan/Kota)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400"
                                    placeholder="Contoh: Jl. Sudirman, Jakarta..."
                                    value={searchLocationText}
                                    onChange={(e) => handleSearchLocation(e.target.value)}
                                />
                                {isSearchingLocation && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">Mencari...</span>
                                )}
                            </div>
                            {searchLocationResults.length > 0 && (
                                <ul className="absolute left-0 right-0 top-full bg-white border border-gray-200 rounded-xl mt-2 max-h-48 overflow-y-auto shadow-lg z-[1001] divide-y divide-gray-50">
                                    {searchLocationResults.map((result, index) => (
                                        <li
                                            key={index}
                                            className="px-3 py-2 text-xs text-gray-800 cursor-pointer hover:bg-orange-50 font-semibold"
                                            onClick={() => handleSelectSearchResult(result)}
                                        >
                                            {result.display_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Interactive Location Map Picker */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">Peta Lokasi Properti</label>
                            <div className="rounded-xl overflow-hidden border border-gray-200">
                                <LocationPicker
                                    lat={newPropForm.location?.lat ?? -6.2088}
                                    lng={newPropForm.location?.lng ?? 106.8456}
                                    onLocationChange={(lat, lng, address, city, area) => {
                                        setNewPropForm(prev => {
                                            const updates: any = { location: { lat, lng } };
                                            if (city) updates.city = city.replace('Kota ', '').replace('Kabupaten ', '');
                                            if (area) updates.area = area.replace('Kecamatan ', '');
                                            if (address) updates.address = address;
                                            return { ...prev, ...updates };
                                        });
                                    }}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 italic">Seret penanda atau klik di area peta untuk memperbarui koordinat dan alamat secara otomatis.</p>
                        </div>

                        {/* Coordinates Latitude / Longitude Display */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    readOnly
                                    value={newPropForm.location?.lat ?? ''}
                                    className="w-full border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    readOnly
                                    value={newPropForm.location?.lng ?? ''}
                                    className="w-full border border-gray-100 rounded-xl px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-50 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Kota <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Jakarta Selatan"
                                    value={newPropForm.city}
                                    onChange={e => setNewPropForm({ ...newPropForm, city: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Kecamatan/Area <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Tebet"
                                    value={newPropForm.area}
                                    onChange={e => setNewPropForm({ ...newPropForm, area: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Alamat Lengkap <span className="text-red-500">*</span></label>
                            <textarea
                                rows={2}
                                required
                                placeholder="Tulis alamat detail..."
                                value={newPropForm.address}
                                onChange={e => setNewPropForm({ ...newPropForm, address: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 resize-none"
                            />
                        </div>

                        {/* Kampus Terdekat (Array) */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h3 className="font-bold text-gray-900 border-l-4 border-orange-500 pl-3 text-xs uppercase tracking-wide">Kampus Terdekat</h3>
                            <div className="space-y-3">
                                {newPropForm.campuses?.map((campus: any, idx: number) => (
                                    <div key={idx} className="flex flex-col gap-2 items-start bg-orange-50/40 p-4 rounded-xl border border-orange-100">
                                        <div className="flex flex-col sm:flex-row gap-3 w-full items-start sm:items-center">
                                            <div className="flex-1 flex gap-2 w-full">
                                                <input
                                                    type="text"
                                                    value={campus.name}
                                                    onChange={(e) => updateObjectArrayItem('campuses', idx, 'name', e.target.value)}
                                                    className="w-full bg-white border border-orange-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
                                                    placeholder="Nama Kampus (Misal: IPB Dramaga)"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => searchFacilityCoordinates('campuses', idx, campus.name)}
                                                    disabled={isSearchingFacilityMap[`campuses-${idx}`]}
                                                    className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 hover:bg-orange-600 disabled:opacity-50"
                                                >
                                                    {isSearchingFacilityMap[`campuses-${idx}`] ? 'Mencari...' : 'Cari Koordinat'}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setActiveMapPicker({ field: 'campuses', index: idx })}
                                                    className="bg-white border text-gray-500 border-gray-200 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 hover:bg-gray-50"
                                                >
                                                    📍 Peta
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={campus.distance}
                                                    onChange={(e) => updateObjectArrayItem('campuses', idx, 'distance', e.target.value)}
                                                    className="w-24 bg-white border border-orange-200 rounded-lg px-3 py-1.5 text-xs font-medium outline-none"
                                                    placeholder="Jarak"
                                                />
                                                <button type="button" onClick={() => removeObjectArrayItem('campuses', idx)} className="text-red-400 hover:text-red-600 bg-white p-1.5 border border-red-100 rounded-lg">
                                                    &times;
                                                </button>
                                            </div>
                                        </div>
                                        {campus.distance && (() => {
                                            const kmMatch = campus.distance.match(/[\d.]+/);
                                            if (kmMatch) {
                                                const km = parseFloat(kmMatch[0]);
                                                const walk = Math.ceil((km / 5) * 60);
                                                const moto = Math.ceil((km / 30) * 60) + 2;
                                                const car = Math.ceil((km / 20) * 60) + 5;
                                                return (
                                                    <div className="flex flex-wrap items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-orange-100 w-full text-[10px] font-bold text-gray-600 mt-1">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-2">Estimasi Waktu:</span>
                                                        <span className="flex items-center gap-0.5">🚶 {walk} Mnt</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="flex items-center gap-0.5">🏍️ {moto} Mnt</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="flex items-center gap-0.5">🚗 {car} Mnt</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                ))}
                                <button type="button" onClick={() => addObjectArrayItem('campuses')} className="text-[10px] font-bold text-orange-600 hover:bg-orange-50 px-3 py-2 border border-orange-200 rounded-lg">
                                    + Tambah Kampus Dekat Sini
                                </button>
                            </div>
                        </div>

                        {/* Fasilitas Publik (Array) */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h3 className="font-bold text-gray-900 border-l-4 border-blue-500 pl-3 text-xs uppercase tracking-wide">Fasilitas Publik Sekitar</h3>
                            <div className="space-y-3">
                                {newPropForm.publicFacilities?.map((fac: any, idx: number) => (
                                    <div key={idx} className="flex flex-col gap-2 items-start bg-blue-50/40 p-4 rounded-xl border border-blue-100">
                                        <div className="flex flex-col sm:flex-row gap-3 w-full items-start sm:items-center">
                                            <div className="flex-1 flex gap-2 w-full">
                                                <input
                                                    type="text"
                                                    value={fac.name}
                                                    onChange={(e) => updateObjectArrayItem('publicFacilities', idx, 'name', e.target.value)}
                                                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
                                                    placeholder="Nama Tempat (Misal: Halte Busway)"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => searchFacilityCoordinates('publicFacilities', idx, fac.name)}
                                                    disabled={isSearchingFacilityMap[`publicFacilities-${idx}`]}
                                                    className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 hover:bg-blue-600 disabled:opacity-50"
                                                >
                                                    {isSearchingFacilityMap[`publicFacilities-${idx}`] ? 'Mencari...' : 'Cari Koordinat'}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setActiveMapPicker({ field: 'publicFacilities', index: idx })}
                                                    className="bg-white border text-gray-500 border-gray-200 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 hover:bg-gray-50"
                                                >
                                                    📍 Peta
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={fac.distance}
                                                    onChange={(e) => updateObjectArrayItem('publicFacilities', idx, 'distance', e.target.value)}
                                                    className="w-24 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-medium outline-none"
                                                    placeholder="Jarak"
                                                />
                                                <button type="button" onClick={() => removeObjectArrayItem('publicFacilities', idx)} className="text-red-400 hover:text-red-600 bg-white p-1.5 border border-red-100 rounded-lg">
                                                    &times;
                                                </button>
                                            </div>
                                        </div>
                                        {fac.distance && (() => {
                                            const kmMatch = fac.distance.match(/[\d.]+/);
                                            if (kmMatch) {
                                                const km = parseFloat(kmMatch[0]);
                                                const walk = Math.ceil((km / 5) * 60);
                                                const moto = Math.ceil((km / 30) * 60) + 2;
                                                const car = Math.ceil((km / 20) * 60) + 5;
                                                return (
                                                    <div className="flex flex-wrap items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-blue-100 w-full text-[10px] font-bold text-gray-600 mt-1">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-2">Estimasi Waktu:</span>
                                                        <span className="flex items-center gap-0.5">🚶 {walk} Mnt</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="flex items-center gap-0.5">🏍️ {moto} Mnt</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="flex items-center gap-0.5">🚗 {car} Mnt</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                ))}
                                <button type="button" onClick={() => addObjectArrayItem('publicFacilities')} className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 border border-blue-200 rounded-lg">
                                    + Tambah Fasilitas Publik
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'media':
                return (
                    <div className="space-y-6">
                        {/* Images Section */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Galeri Foto Properti</h4>
                            
                            {newPropForm.imageUrls && newPropForm.imageUrls.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                                    {newPropForm.imageUrls.map((url: any, i: number) => {
                                        const displayUrl = typeof url === 'string' ? url : (url.thumbnail || url.webp || url.original);
                                        return (
                                            <div 
                                                key={`existing-${i}`} 
                                                className="relative aspect-square rounded-xl overflow-hidden group cursor-move hover:ring-2 hover:ring-orange-500 transition-all border border-gray-150"
                                                draggable
                                                onDragStart={(e) => handleMediaDragStart(e, i, 'existing')}
                                                onDragEnd={handleMediaDragEnd}
                                                onDragOver={handleMediaDragOver}
                                                onDrop={(e) => handleMediaDrop(e, i, 'existing')}
                                            >
                                                <img src={displayUrl} className="w-full h-full object-cover" alt="" />
                                                <button type="button" onClick={() => removeExistingMedia('imageUrls', url)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] px-1 rounded flex items-center gap-0.5 font-bold">
                                                    {i + 1}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {newImageFiles.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[10px] text-green-600 font-black uppercase tracking-wider">Foto Baru ditambahkan:</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {newImageFiles.map((file, i) => (
                                            <div 
                                                key={`new-${i}`} 
                                                className="relative aspect-square rounded-xl overflow-hidden group border-2 border-green-200 cursor-move hover:ring-2 hover:ring-green-500 transition-all"
                                                draggable
                                                onDragStart={(e) => handleMediaDragStart(e, i, 'new')}
                                                onDragEnd={handleMediaDragEnd}
                                                onDragOver={handleMediaDragOver}
                                                onDrop={(e) => handleMediaDrop(e, i, 'new')}
                                            >
                                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                                                <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">&times;</button>
                                                <div className="absolute bottom-1 left-1 bg-green-500/80 text-white text-[8px] px-1 rounded flex items-center gap-0.5 font-bold">
                                                    {i + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                                    <span className="text-xl">📸</span>
                                    <p className="text-xs text-gray-500 font-bold mt-1">Klik untuk upload foto listing utama</p>
                                </div>
                                <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageFileSelect} />
                            </label>
                        </div>

                        {/* Videos Section */}
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Video Tour</h4>

                            {newPropForm.videoUrls && newPropForm.videoUrls.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    {newPropForm.videoUrls.map((url: any, i: number) => {
                                        const videoLink = typeof url === 'string' ? url : url.original;
                                        return (
                                            <div key={i} className="relative aspect-video rounded-xl overflow-hidden group bg-black">
                                                <video src={videoLink} className="w-full h-full object-cover opacity-60" />
                                                <button type="button" onClick={() => removeExistingMedia('videoUrls', url)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 z-10">&times;</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {newVideoFiles.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[10px] text-green-600 font-black uppercase tracking-wider">Video Baru:</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {newVideoFiles.map((file, i) => (
                                            <div key={i} className="relative aspect-video rounded-xl overflow-hidden group border-2 border-green-200 bg-gray-100 flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-gray-500 truncate max-w-full px-2">{file.name}</span>
                                                <button type="button" onClick={() => removeNewVideo(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                                    <span className="text-xl">🎥</span>
                                    <p className="text-xs text-gray-500 font-bold mt-1">Klik untuk upload video tour (.mp4)</p>
                                </div>
                                <input type="file" className="hidden" multiple accept="video/*" onChange={handleVideoFileSelect} />
                            </label>
                        </div>

                        {/* Social Media Links Section */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Tautan Review Social Media</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Instagram Review Link</label>
                                    <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none" value={newPropForm.instagramUrl || ''} onChange={e => setNewPropForm({ ...newPropForm, instagramUrl: e.target.value })} placeholder="https://instagram.com/reel/..." />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">TikTok Review Link</label>
                                    <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none" value={newPropForm.tiktokUrl || ''} onChange={e => setNewPropForm({ ...newPropForm, tiktokUrl: e.target.value })} placeholder="https://tiktok.com/@..." />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'facilities':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Fasilitas Properti</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Contoh: WiFi, Parkir Motor, Dapur Bersama"
                                    value={tempFacilityInput}
                                    onChange={e => setTempFacilityInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400"
                                />
                                <button type="button" onClick={addFacility} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">Tambah</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3 border-b border-gray-100 pb-4">
                                {newPropForm.facilities?.map((f: string, i: number) => (
                                    <span key={i} className="bg-orange-50 text-orange-600 px-3 py-1 rounded-xl text-xs font-bold border border-orange-100 flex items-center gap-1.5">
                                        {f}
                                        <button type="button" onClick={() => removeFacility(i)} className="hover:text-red-500 font-extrabold">&times;</button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Additional Fees section identical to Dashboard.tsx */}
                        <div className="pt-4 space-y-3">
                            <h3 className="font-bold text-gray-900 border-l-4 border-orange-500 pl-3 text-xs uppercase tracking-wide">Biaya Tambahan (Opsional)</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Keterangan Biaya Tambahan</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-orange-500" 
                                        value={newPropForm.additionalFeeName || ''} 
                                        onChange={e => setNewPropForm({ ...newPropForm, additionalFeeName: e.target.value })} 
                                        placeholder="Contoh: Air, Listrik, Sampah, WiFi" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Total Nominal Ekstra</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Rp</span>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-orange-500" 
                                            value={newPropForm.additionalFeePrice || ''} 
                                            onChange={e => setNewPropForm({ ...newPropForm, additionalFeePrice: e.target.value ? parseInt(e.target.value) : 0 })} 
                                            placeholder="Contoh: 50000" 
                                        />
                                    </div>
                                </div>

                                <div className="lg:col-span-2 pt-3 border-t border-gray-150">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Ketentuan Penagihan</p>
                                    <div className="flex gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setNewPropForm({ ...newPropForm, additionalFeeStartsFrom: 'month_1' })}
                                            className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                                                newPropForm.additionalFeeStartsFrom !== 'month_2' 
                                                    ? 'bg-orange-500 text-white shadow-sm' 
                                                    : 'bg-white text-gray-500 border border-gray-200'
                                            }`}
                                        >
                                            Mulai dari Bulan Awal Sewa Pertama
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setNewPropForm({ ...newPropForm, additionalFeeStartsFrom: 'month_2' })}
                                            className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                                                newPropForm.additionalFeeStartsFrom === 'month_2' 
                                                    ? 'bg-orange-500 text-white shadow-sm' 
                                                    : 'bg-white text-gray-500 border border-gray-200'
                                            }`}
                                        >
                                            Promo Bebas Tagihan di Bulan Pertama
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-bold mt-2 leading-relaxed">
                                        {newPropForm.additionalFeeStartsFrom === 'month_2' 
                                            ? 'ℹ️ Biaya tambahan akan GRATIS pada awal sewa (bulan pertama), dan baru akan ditagih mulai periode perpanjangan berikutnya.'
                                            : 'ℹ️ Biaya tambahan akan langsung ditagih bersamaan dengan pembayaran sewa pertama kali.'}
                                    </p>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 italic">Isi jika kost menetapkan tagihan wajib bulanan di luar tagihan pokok kamar.</p>
                        </div>
                    </div>
                );
            case 'rooms':
                return (
                    <div className="space-y-6">
                        {newPropForm.roomTypes.map((rt: any, rtIdx: number) => (
                            <div key={rtIdx} className="border border-gray-200 rounded-2xl p-4 space-y-4 bg-gray-50/20 relative">
                                <button type="button" onClick={() => removeRoomType(rtIdx)} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded-xl text-xs font-bold">Hapus Tipe</button>
                                <div className="grid grid-cols-2 gap-3 pr-16">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nama Tipe Kamar</label>
                                        <input
                                            type="text"
                                            required
                                            value={rt.name}
                                            onChange={e => updateRoomTypeField(rtIdx, 'name', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Harga Bulanan (Rp)</label>
                                        <input
                                            type="number"
                                            required
                                            value={rt.price}
                                            onChange={e => updateRoomTypeField(rtIdx, 'price', Number(e.target.value))}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ukuran Kamar</label>
                                        <input
                                            type="text"
                                            value={rt.size}
                                            onChange={e => updateRoomTypeField(rtIdx, 'size', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Maks Penghuni</label>
                                        <input
                                            type="number"
                                            value={rt.maxOccupants}
                                            onChange={e => updateRoomTypeField(rtIdx, 'maxOccupants', Number(e.target.value))}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400 bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Fasilitas Kamar</label>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {rt.roomFacilities?.map((tag: string, tIdx: number) => (
                                                <span key={tIdx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                                    {tag}
                                                    <button type="button" onClick={() => removeRoomTag(rtIdx, 'roomFacilities', tIdx)} className="font-extrabold">&times;</button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="+ Tambah (Enter)"
                                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-orange-400"
                                            value={tempTagInput[`${rtIdx}-roomFacilities`] || ''}
                                            onChange={(e) => setTempTagInput({ ...tempTagInput, [`${rtIdx}-roomFacilities`]: e.target.value })}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addRoomTag(rtIdx, 'roomFacilities', (e.target as HTMLInputElement).value);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Fasilitas Kamar Mandi</label>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {rt.bathroomFacilities?.map((tag: string, tIdx: number) => (
                                                <span key={tIdx} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                                    {tag}
                                                    <button type="button" onClick={() => removeRoomTag(rtIdx, 'bathroomFacilities', tIdx)} className="font-extrabold">&times;</button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="+ Tambah (Enter)"
                                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-orange-400"
                                            value={tempTagInput[`${rtIdx}-bathroomFacilities`] || ''}
                                            onChange={(e) => setTempTagInput({ ...tempTagInput, [`${rtIdx}-bathroomFacilities`]: e.target.value })}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addRoomTag(rtIdx, 'bathroomFacilities', (e.target as HTMLInputElement).value);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* ROOM MAP / HUNIAN DETAILS */}
                                <div className="pt-4 border-t border-gray-200 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Daftar Kamar / Peta Hunian</p>
                                        <button type="button" onClick={() => addRoomToType(rtIdx)} className="text-[10px] font-black text-orange-500 hover:underline">+ Tambah Kamar</button>
                                    </div>
                                    <div className="space-y-3">
                                        {rt.rooms.map((rm: any, rmIdx: number) => (
                                            <div key={rmIdx} className="bg-white p-3 rounded-xl border border-gray-200 space-y-3 relative">
                                                <button type="button" onClick={() => removeRoomFromType(rtIdx, rmIdx)} className="absolute top-2.5 right-3 text-[10px] text-red-500 hover:bg-red-50 px-2 py-0.5 rounded">Hapus</button>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">No. Kamar</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={rm.roomNumber}
                                                            onChange={e => updateRoomField(rtIdx, rmIdx, 'roomNumber', e.target.value)}
                                                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Status Kamar</label>
                                                        <select
                                                            value={rm.status}
                                                            onChange={e => updateRoomField(rtIdx, rmIdx, 'status', e.target.value)}
                                                            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700"
                                                        >
                                                            <option value="kosong">Kosong</option>
                                                            <option value="terisi">Terisi</option>
                                                        </select>
                                                    </div>
                                                    {rm.status === 'terisi' && (
                                                        <div>
                                                            <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Paket Sewa</label>
                                                            <select
                                                                value={rm.billingPeriod}
                                                                onChange={e => updateRoomField(rtIdx, rmIdx, 'billingPeriod', e.target.value)}
                                                                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700"
                                                            >
                                                                <option value="bulanan">Bulanan</option>
                                                                <option value="3bulanan">3 Bulan</option>
                                                                <option value="6bulanan">6 Bulan</option>
                                                                <option value="tahunan">Tahunan</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* CONDITIONAL TENANT INFORMATION */}
                                                {rm.status === 'terisi' && (
                                                    <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
                                                        <div>
                                                            <label className="text-[8px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">Nama Penghuni</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                placeholder="Nama Lengkap"
                                                                value={rm.tenantName}
                                                                onChange={e => updateRoomField(rtIdx, rmIdx, 'tenantName', e.target.value)}
                                                                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 bg-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">Nomor HP</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                placeholder="628..."
                                                                value={rm.tenantPhone}
                                                                onChange={e => updateRoomField(rtIdx, rmIdx, 'tenantPhone', e.target.value)}
                                                                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 bg-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">Jatuh Tempo Sewa</label>
                                                            <input
                                                                type="date"
                                                                required
                                                                value={rm.dueDate}
                                                                onChange={e => updateRoomField(rtIdx, rmIdx, 'dueDate', e.target.value)}
                                                                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 bg-white"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {/* ROOM PHOTO GALLERY UPLOAD */}
                                                <div className="pt-3 border-t border-gray-100 space-y-2">
                                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Foto Kamar (Spesifik Unit)</label>
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        {/* Thumbnail list */}
                                                        {rm.images?.map((imgUrl: string, imgIdx: number) => (
                                                            <div key={imgIdx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0 shadow-sm group">
                                                                <img src={imgUrl} alt="Kamar" className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteRoomPhoto(rtIdx, rmIdx, imgUrl)}
                                                                    className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold transition-all"
                                                                >
                                                                    &times;
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {/* Upload Button */}
                                                        <label className="w-14 h-14 rounded-lg border border-dashed border-gray-300 hover:border-orange-400 bg-gray-50 hover:bg-orange-50/20 flex flex-col items-center justify-center cursor-pointer transition-all shrink-0">
                                                            {uploadingRooms[`${rtIdx}-${rmIdx}`] ? (
                                                                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                                            ) : (
                                                                <>
                                                                    <span className="text-sm">📷</span>
                                                                    <span className="text-[7px] text-gray-400 font-bold uppercase mt-1">Upload</span>
                                                                </>
                                                            )}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                disabled={uploadingRooms[`${rtIdx}-${rmIdx}`]}
                                                                onChange={(e) => handleUploadRoomPhoto(rtIdx, rmIdx, e)}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addRoomType} className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-orange-500 hover:text-orange-500 transition-colors text-xs">
                            + Tambah Tipe Kamar Baru
                        </button>
                    </div>
                );
            case 'rules':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Peraturan Kost</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Contoh: Dilarang membawa hewan peliharaan"
                                    value={tempRuleInput}
                                    onChange={e => setTempRuleInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRule())}
                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-orange-400"
                                />
                                <button type="button" onClick={addRule} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">Tambah</button>
                            </div>
                            <div className="space-y-2 mt-3">
                                {newPropForm.rules?.map((r: string, i: number) => (
                                    <div key={i} className="bg-white border border-gray-100 px-3 py-2 rounded-xl text-xs font-semibold flex justify-between items-center shadow-sm">
                                        <span className="text-gray-700">{i + 1}. {r}</span>
                                        <button type="button" onClick={() => removeRule(i)} className="text-red-500 hover:bg-red-50 px-2 py-0.5 rounded font-extrabold">&times;</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <div>
                        <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Portal KostManager</span>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mt-1.5">{editingPropertyId ? 'Edit Properti Kelolaan' : 'Tambah Properti Kelolaan Baru'}</h3>
                        <p className="text-xs text-gray-400 font-bold mt-0.5">Lengkapi data properti dan pemetaan hunian secara detail</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Split-View Body */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar Nav (Style synced with Dashboard.tsx, no icons) */}
                    <aside className="w-full md:w-56 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 p-4 space-y-1 overflow-y-auto flex md:block shrink-0 gap-2">
                        {sections.map(sec => (
                            <button
                                key={sec.id}
                                type="button"
                                onClick={() => setActiveSection(sec.id)}
                                className={`w-full text-left px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                    activeSection === sec.id
                                        ? 'bg-white text-orange-600 shadow-sm border border-gray-100'
                                        : 'text-gray-400 hover:bg-white/50 hover:text-gray-600'
                                }`}
                            >
                                <span>{sec.name}</span>
                            </button>
                        ))}
                    </aside>

                    {/* Form Content Area */}
                    <div className="flex-grow overflow-y-auto p-6 bg-white">
                        {renderSectionContent()}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={savingProp}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                        {savingProp ? 'Menyimpan...' : 'Simpan Properti'}
                    </button>
                </div>

                {/* MODAL: MANUAL MAP PICKER FOR FACILITIES */}
                {activeMapPicker && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setActiveMapPicker(null)}></div>
                        <div className="bg-white max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="font-black text-gray-900 uppercase tracking-tight">Pilih Titik di Peta</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Geser peta untuk memilih lokasi presisi</p>
                                </div>
                                <button type="button" onClick={() => setActiveMapPicker(null)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 transition-colors">&times;</button>
                            </div>
                            <div className="relative h-[400px] w-full">
                                <LocationPicker
                                    lat={
                                        (newPropForm[activeMapPicker.field] || [])[activeMapPicker.index]?.lat 
                                        || newPropForm.location?.lat 
                                        || -6.2088
                                    }
                                    lng={
                                        (newPropForm[activeMapPicker.field] || [])[activeMapPicker.index]?.lng 
                                        || newPropForm.location?.lng 
                                        || 106.8456
                                    }
                                    onLocationChange={(lat, lng) => {
                                        handleMapPickerSave(lat, lng);
                                    }}
                                />
                            </div>
                            <div className="p-4 bg-orange-50 border-t border-orange-100 flex justify-end">
                              <p className="text-[10px] text-orange-600 font-bold italic">Lokasi otomatis disimpan saat penanda digeser.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KostManagerPortal;
