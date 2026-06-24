import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Kost, RoomType, PricingPeriod } from '../types';
import { addPropertyWithMedia, updatePropertyWithMedia } from '../adminService';
import {
    X, ChevronRight, ChevronLeft, Camera, Video, MapPin, Home, Wifi,
    Plus, Trash2, Check, AlertCircle, Loader2, Upload, Image as ImageIcon,
    Phone, BookOpen, DollarSign, Search, Navigation, ShieldCheck, User
} from 'lucide-react';

interface KostFormMitraProps {
    user?: any;
    editingKost?: Partial<Kost> | null;
    onClose: () => void;
    onSuccess: () => void;
}

// ── constants ──────────────────────────────────────────────────────────────────
const STEPS = [
    { id: 'info',       label: 'Info',      icon: <Home size={16} /> },
    { id: 'location',   label: 'Lokasi',    icon: <MapPin size={16} /> },
    { id: 'media',      label: 'Foto',      icon: <Camera size={16} /> },
    { id: 'facilities', label: 'Fasilitas', icon: <Wifi size={16} /> },
    { id: 'rooms',      label: 'Kamar',     icon: <Check size={16} /> },
    { id: 'rules',      label: 'Peraturan', icon: <BookOpen size={16} /> },
];

const BUILDING_FACILITIES = [
    'WiFi', 'Parkir Motor', 'Parkir Mobil', 'CCTV', 'AC', 'Laundry',
    'Dapur Bersama', 'Ruang Tamu', 'Mushola', 'Jemuran', 'Kulkas Bersama',
    'Water Heater', 'Cleaning Service', 'Security 24 Jam', 'Akses 24 Jam', 'Lift',
];
const ROOM_AMENITIES = ['Kasur', 'Lemari', 'Meja Belajar', 'Kursi', 'AC', 'TV', 'Kipas Angin', 'Jendela'];
const BATH_AMENITIES = ['Kamar Mandi Dalam', 'Kamar Mandi Luar', 'Water Heater', 'Shower', 'Bathtub', 'Toilet Duduk'];
const PRICING_PERIODS: { key: PricingPeriod; label: string }[] = [
    { key: 'harian',   label: 'Harian' },
    { key: 'mingguan', label: 'Mingguan' },
    { key: 'bulanan',  label: 'Bulanan' },
    { key: '3bulanan', label: '3 Bulan' },
    { key: '6bulanan', label: '6 Bulan' },
    { key: 'tahunan',  label: 'Tahunan' },
];

const periodWeights: Record<string, number> = {
    'harian': 1, 'mingguan': 7, 'bulanan': 30, '3bulanan': 90, '6bulanan': 180, 'tahunan': 365
};

const periodLabels: Record<string, string> = {
    'harian': 'Harian', 'mingguan': 'Mingguan', 'bulanan': 'Bulanan', '3bulanan': '3 Bulan', '6bulanan': '6 Bulan', 'tahunan': 'Tahunan'
};

const initialForm: Partial<Kost> = {
    title: '', description: '', type: 'Campur', status: 'published',
    city: '', area: '', address: '',
    location: { lat: -6.2088, lng: 106.8456 },
    imageUrls: [], videoUrls: [],
    instagramUrl: '', tiktokUrl: '',
    additionalFeePrice: 0, additionalFeeName: '',
    additionalFeeStartsFrom: 'month_1',
    campuses: [], publicFacilities: [],
    omnichannelContactName: '', omnichannelContactPhone: '', omnichannelContactType: 'owner',
    contactSelection: 'profile', caretakerName: '', caretakerGender: 'Pria', caretakerPhone: '',
};

// ── helpers ────────────────────────────────────────────────────────────────────
const Field: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({ label, required, hint, children }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-1">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {children}
        {hint && <p className="text-[10px] text-gray-400 font-medium">{hint}</p>}
    </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }> = ({ icon, className, ...props }) => (
    <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
            {...props}
            className={`w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 px-4 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all ${icon ? 'pl-10' : ''} ${className || ''}`}
        />
    </div>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
    <textarea
        {...props}
        className={`w-full bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 px-4 py-3 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all resize-none ${className || ''}`}
    />
);

const ChipToggle: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`h-9 px-4 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${active ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
    >
        {active && <span className="mr-1">✓</span>}{label}
    </button>
);

// ── Map Picker ─────────────────────────────────────────────────────────────────
const MapPicker: React.FC<{
    lat: number;
    lng: number;
    onLocationChange: (lat: number, lng: number, address: string, city?: string, area?: string) => void;
}> = ({ lat, lng, onLocationChange }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                { headers: { 'User-Agent': 'RuangSinggah.id/1.0' } }
            );
            const data = await res.json();
            const addr = data.display_name || 'Alamat tidak ditemukan';
            const address = data.address || {};
            const city = address.city || address.town || address.municipality || address.county || address.state || '';
            const area = address.suburb || address.village || address.district || address.neighbourhood || '';
            
            onLocationChange(lat, lng, addr, city, area);
            setSearchQuery(addr);
        } catch {
            onLocationChange(lat, lng, 'Gagal memuat alamat');
        }
    }, [onLocationChange]);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;
        const L = (window as any).L;
        if (!L) return;

        const map = L.map(mapRef.current).setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on('dragend', (e: any) => {
            const pos = e.target.getLatLng();
            reverseGeocode(pos.lat, pos.lng);
        });
        map.on('click', (e: any) => {
            marker.setLatLng(e.latlng);
            reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        mapInstance.current = map;
        markerInstance.current = marker;
        setTimeout(() => map.invalidateSize(), 100);
    }, []);

    useEffect(() => {
        if (markerInstance.current && mapInstance.current) {
            const cur = markerInstance.current.getLatLng();
            if (Math.abs(cur.lat - lat) > 0.0001 || Math.abs(cur.lng - lng) > 0.0001) {
                markerInstance.current.setLatLng([lat, lng]);
                mapInstance.current.setView([lat, lng], 15);
            }
        }
    }, [lat, lng]);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (text.length < 3) { setSearchResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=id&limit=5`,
                    { headers: { 'User-Agent': 'RuangSinggah.id/1.0' } }
                );
                setSearchResults(await res.json());
            } catch { setSearchResults([]); }
            finally { setIsSearching(false); }
        }, 500);
    };

    const selectResult = async (r: any) => {
        const plat = parseFloat(r.lat), plng = parseFloat(r.lon);
        setSearchQuery(r.display_name);
        setSearchResults([]);
        
        // Reverse geocode explicitly to get the detailed address object for city and area
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${plat}&lon=${plng}&addressdetails=1`, { headers: { 'User-Agent': 'RuangSinggah.id/1.0' } });
            const data = await res.json();
            const address = data.address || {};
            const city = address.city || address.town || address.municipality || address.county || address.state || '';
            const area = address.suburb || address.village || address.district || address.neighbourhood || '';
            onLocationChange(plat, plng, r.display_name, city, area);
        } catch {
            onLocationChange(plat, plng, r.display_name);
        }

        if (markerInstance.current && mapInstance.current) {
            markerInstance.current.setLatLng([plat, plng]);
            mapInstance.current.setView([plat, plng], 16);
        }
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(pos => {
            reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        });
    };

    return (
        <div className="space-y-3">
            {/* Search bar */}
            <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Cari alamat atau nama tempat..."
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 pl-10 pr-12 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                />
                <button
                    type="button"
                    onClick={handleCurrentLocation}
                    title="Gunakan lokasi saat ini"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-colors"
                >
                    <Navigation size={14} />
                </button>

                {/* Search results dropdown */}
                {(isSearching || searchResults.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                        {isSearching ? (
                            <p className="p-3 text-xs font-bold text-gray-400 flex items-center gap-2">
                                <Loader2 size={14} className="animate-spin" /> Mencari...
                            </p>
                        ) : (
                            searchResults.map((r, i) => (
                                <button
                                    key={i} type="button"
                                    onClick={() => selectResult(r)}
                                    className="w-full p-3 text-left text-xs font-medium text-gray-700 hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors flex items-start gap-2"
                                >
                                    <MapPin size={12} className="text-orange-400 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{r.display_name}</span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
                <div ref={mapRef} style={{ height: 280, width: '100%', zIndex: 0 }} />
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-[10px] font-bold text-gray-500 border border-gray-100">
                    📍 Klik peta atau seret marker untuk memilih lokasi
                </div>
            </div>

            {/* Coordinate display */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-gray-50 rounded-xl p-2 border border-gray-100 text-center">
                    <p className="text-gray-400 font-bold uppercase tracking-wide">Lat</p>
                    <p className="font-black text-gray-700 mt-0.5">{lat.toFixed(6)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2 border border-gray-100 text-center">
                    <p className="text-gray-400 font-bold uppercase tracking-wide">Lng</p>
                    <p className="font-black text-gray-700 mt-0.5">{lng.toFixed(6)}</p>
                </div>
            </div>
        </div>
    );
};

// ── Custom Facility Input ──────────────────────────────────────────────────────
const FacilityInput: React.FC<{
    selected: string[];
    presets: string[];
    onToggle: (f: string) => void;
    onAdd: (f: string) => void;
    onRemove: (f: string) => void;
    placeholder?: string;
}> = ({ selected, presets, onToggle, onAdd, onRemove, placeholder }) => {
    const [custom, setCustom] = useState('');
    const customFacilities = selected.filter(f => !presets.includes(f));

    const addCustom = () => {
        const val = custom.trim();
        if (!val || selected.includes(val)) return;
        onAdd(val);
        setCustom('');
    };

    return (
        <div className="space-y-3">
            {/* Preset chips */}
            <div className="flex flex-wrap gap-2">
                {presets.map(f => (
                    <ChipToggle key={f} label={f} active={selected.includes(f)} onClick={() => onToggle(f)} />
                ))}
            </div>

            {/* Custom entries */}
            {customFacilities.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                    <p className="w-full text-[9px] font-black text-gray-400 uppercase tracking-widest">Fasilitas Custom</p>
                    {customFacilities.map(f => (
                        <span key={f} className="h-9 pl-4 pr-2 rounded-full text-xs font-bold border bg-blue-500 text-white border-blue-500 shadow-sm flex items-center gap-2">
                            {f}
                            <button type="button" onClick={() => onRemove(f)} className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors">
                                <X size={9} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Custom input */}
            <div className="flex gap-2 items-center border-t border-dashed border-gray-200 pt-3">
                <div className="relative flex-1">
                    <Plus size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder={placeholder || 'Tambah fasilitas lain...'}
                        value={custom}
                        onChange={e => setCustom(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                        className="w-full h-10 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-900 pl-9 pr-4 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                </div>
                <button
                    type="button"
                    onClick={addCustom}
                    disabled={!custom.trim()}
                    className="h-10 px-4 bg-orange-500 text-white rounded-full text-xs font-bold disabled:opacity-40 hover:bg-orange-600 transition-colors shrink-0"
                >
                    Tambah
                </button>
            </div>
        </div>
    );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const KostFormMitra: React.FC<KostFormMitraProps> = ({ user, editingKost, onClose, onSuccess }) => {
    const isEditing = !!editingKost?.id;
    const [step, setStep] = useState(0);
    const [managementOption, setManagementOption] = useState<'none' | 'self' | 'kostmanager'>(
        editingKost ? (editingKost.managed_by || 'self') : 'self'
    );
    const [form, setForm] = useState<Partial<Kost>>(editingKost ? { ...initialForm, ...editingKost } : initialForm);
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [tempRule, setTempRule] = useState('');
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    
    // Auto-populate profile data if it's a new listing and source is profile
    useEffect(() => {
        if (!isEditing && user) {
            setForm(prev => ({
                ...prev,
                omnichannelContactName: user.displayName || user.name || prev.omnichannelContactName,
                omnichannelContactPhone: (user.phone || '').replace(/\D/g, '') || prev.omnichannelContactPhone,
                omnichannelContactType: 'owner',
                contactSelection: 'profile'
            }));
        }
    }, [user, isEditing]);

    const upd = (key: keyof Kost, val: any) => setForm(prev => ({ ...prev, [key]: val }));

    const activeSteps = managementOption === 'kostmanager'
        ? STEPS.slice(0, 2) // Hanya Info & Lokasi
        : STEPS;

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

    const updateFacilityMode = (field: 'campuses' | 'publicFacilities', index: number, value: string) => {
        const arr = [...(form[field] || [])];
        const item = { ...arr[index], transportMode: value };
        if (item.lat && item.lng && form.location?.lat) {
            const km = calculateDistance(form.location.lat, form.location.lng, item.lat, item.lng);
            item.distance = `± ${km} KM`;
        }
        arr[index] = item;
        upd(field, arr);
    };

    const [activeMapPicker, setActiveMapPicker] = useState<{ field: 'campuses' | 'publicFacilities', index: number } | null>(null);

    const handleMapPickerSave = (lat: number, lng: number) => {
        if (!activeMapPicker) return;
        const { field, index } = activeMapPicker;
        const arr = [...(form[field] || [])];
        
        let distString = arr[index].distance;
        if (form.location && form.location.lat) {
            const km = calculateDistance(form.location.lat, form.location.lng, lat, lng);
            distString = `± ${km} KM`;
        }

        arr[index] = { ...arr[index], lat, lng, distance: distString };
        upd(field, arr);
        setActiveMapPicker(null);
    };

    const [isSearchingFacility, setIsSearchingFacility] = useState<Record<string, boolean>>({});

    const searchFacilityCoordinates = async (field: 'campuses' | 'publicFacilities', index: number, name: string) => {
        if (!name) return;
        const stateKey = `${field}-${index}`;
        setIsSearchingFacility(prev => ({ ...prev, [stateKey]: true }));
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&countrycodes=id&limit=1`, {
                headers: { 'User-Agent': 'RuangSinggah.id/1.0' }
            });
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                const arr = [...(form[field] || [])];
                
                let distString = arr[index].distance;
                if (form.location && form.location.lat) {
                    const km = calculateDistance(form.location.lat, form.location.lng, lat, lng);
                    distString = `± ${km} KM`;
                }

                arr[index] = { ...arr[index], lat, lng, distance: distString };
                upd(field, arr);
            } else {
                alert('Lokasi tidak ditemukan di peta. Coba setel nama yang lebih spesifik.');
            }
        } catch (error) {
            console.error('Error fetching facility location:', error);
            alert('Gagal mencari kordinat.');
        } finally {
            setIsSearchingFacility(prev => ({ ...prev, [stateKey]: false }));
        }
    };

    // ── location ───────────────────────────────────────────────────────────────
    const handleLocationChange = useCallback((lat: number, lng: number, address: string, city?: string, area?: string) => {
        setForm(prev => {
            const updates: Partial<Kost> = { location: { lat, lng }, address };
            if (city && !prev.city) updates.city = city.replace('Kota ', '').replace('Kabupaten ', '');
            if (area && !prev.area) updates.area = area.replace('Kecamatan ', '');
            // Auto overwrite city and area anyway to keep it synced with map if map moved
            if (city) updates.city = city.replace('Kota ', '').replace('Kabupaten ', '');
            if (area) updates.area = area.replace('Kecamatan ', '');
            return { ...prev, ...updates };
        });
    }, []);

    // ── image handling ─────────────────────────────────────────────────────────
    const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setNewImageFiles(prev => [...prev, ...files]);
        files.forEach(f => {
            const reader = new FileReader();
            reader.onload = ev => setImagePreviews(prev => [...prev, ev.target?.result as string]);
            reader.readAsDataURL(f);
        });
    };
    const removeNewImage = (i: number) => {
        setNewImageFiles(prev => prev.filter((_, idx) => idx !== i));
        setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
    };
    const removeExistingImage = (url: any) => {
        upd('imageUrls', (form.imageUrls || []).filter(u => u !== url));
    };

    const handleVideos = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setNewVideoFiles(prev => [...prev, ...files]);
    };

    // ── facilities ─────────────────────────────────────────────────────────────
    const toggleFacility = (f: string) => {
        const cur = form.facilities || [];
        upd('facilities', cur.includes(f) ? cur.filter(x => x !== f) : [...cur, f]);
    };
    const addCustomFacility = (f: string) => {
        upd('facilities', [...(form.facilities || []), f]);
    };
    const removeCustomFacility = (f: string) => {
        upd('facilities', (form.facilities || []).filter(x => x !== f));
    };

    // ── room types ─────────────────────────────────────────────────────────────
    const addRoom = () => {
        const newRoom: RoomType = {
            name: 'Kamar Baru', size: '', price: 0,
            pricing: [{ period: 'bulanan', price: 0 }],
            features: [], roomFacilities: [], bathroomFacilities: [], isAvailable: true,
            availableRoomCount: 1,
            maxOccupants: 1, additionalCostPerPerson: 0
        };
        upd('roomTypes', [...(form.roomTypes || []), newRoom]);
    };
    const updRoom = (i: number, key: keyof RoomType, val: any) => {
        const rooms = [...(form.roomTypes || [])];
        let newVal = val;
        
        // Dynamic correlation
        if (key === 'availableRoomCount') {
            const count = parseInt(val) || 0;
            rooms[i].isAvailable = count > 0;
            newVal = count;
        } else if (key === 'isAvailable') {
            // If manually toggled to Available, ensure count is at least 1 if it was 0
            if (val === true && (rooms[i].availableRoomCount || 0) <= 0) {
                rooms[i].availableRoomCount = 1;
            } else if (val === false) {
                rooms[i].availableRoomCount = 0;
            }
        }

        rooms[i] = { ...rooms[i], [key]: newVal };
        
        if (key === 'pricing') {
            const monthly = (val as any[]).find((p: any) => p.period === 'bulanan');
            if (monthly) rooms[i].price = monthly.price;
        }
        upd('roomTypes', rooms);
    };
    const updRoomPrice = (roomIdx: number, period: PricingPeriod, price: number) => {
        const rooms = [...(form.roomTypes || [])];
        const pricing = [...(rooms[roomIdx].pricing || [])];
        const existing = pricing.findIndex(p => p.period === period);
        if (existing >= 0) pricing[existing] = { period, price };
        else pricing.push({ period, price });
        updRoom(roomIdx, 'pricing', pricing);
    };
    const toggleRoomFeature = (roomIdx: number, field: 'roomFacilities' | 'bathroomFacilities', val: string) => {
        const rooms = [...(form.roomTypes || [])];
        const text = rooms[roomIdx][field] || [];
        updRoom(roomIdx, field, text.includes(val) ? text.filter((x: string) => x !== val) : [...text, val]);
    };
    const addCustomRoomFeature = (roomIdx: number, field: 'roomFacilities' | 'bathroomFacilities', val: string) => {
        const rooms = [...(form.roomTypes || [])];
        const text = rooms[roomIdx][field] || [];
        if (!text.includes(val)) updRoom(roomIdx, field, [...text, val]);
    };
    const removeRoom = (i: number) => {
        upd('roomTypes', (form.roomTypes || []).filter((_, idx) => idx !== i));
    };

    // ── submit ──────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!form.title?.trim()) { setError('Nama kost wajib diisi.'); setStep(0); return; }
        if (!form.city?.trim())  { setError('Kota wajib diisi.'); setStep(1); return; }

        let finalPrice = form.price || 0;
        if ((form.roomTypes || []).length > 0) {
            const monthlyPrices = (form.roomTypes || [])
                .map(r => r.pricing?.find(p => p.period === 'bulanan')?.price || r.price)
                .filter(p => p > 0);
            if (monthlyPrices.length > 0) finalPrice = Math.min(...monthlyPrices);
        }

        setSubmitting(true);
        setError('');
        try {
            // Auto-populate contact from user profile since step was removed for Mitra
            const contactUpdates = {
                omnichannelContactName: user?.displayName || user?.name || '',
                omnichannelContactPhone: (user?.phone || '').replace(/\D/g, ''),
                omnichannelContactType: 'owner'
            };

            const data = { 
                ...form, 
                ...contactUpdates, 
                price: finalPrice, 
                managed_by: managementOption 
            };
            
            if (isEditing && editingKost?.id) {
                await updatePropertyWithMedia(editingKost.id, data, newImageFiles, newVideoFiles);
            } else {
                await addPropertyWithMedia({ ...data, isVerified: false }, newImageFiles, newVideoFiles);
            }
            onSuccess();
        } catch (e: any) {
            setError(e.message || 'Gagal menyimpan. Coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };



    // ── render step ─────────────────────────────────────────────────────────────
    const renderStep = () => {
        switch (step) {

            // ── STEP 0: Info Dasar ─────────────────────────────────────────────
            case 0: return (
                <div className="space-y-5">
                    <Field label="Nama Kost" required>
                        <Input
                            placeholder="Contoh: Kost Orange Premium Tebet"
                            value={form.title || ''}
                            onChange={e => upd('title', e.target.value)}
                            icon={<Home size={16} />}
                        />
                    </Field>

                    <Field label="Tipe Kost" required>
                        <div className="flex gap-2">
                            {(['Putra', 'Putri', 'Campur'] as const).map(t => (
                                <button key={t} type="button" onClick={() => upd('type', t)}
                                    className={`flex-1 h-12 rounded-2xl text-sm font-bold border-2 transition-all ${form.type === t ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                                    {t === 'Putra' ? '♂ Putra' : t === 'Putri' ? '♀ Putri' : '⚡ Campur'}
                                </button>
                            ))}
                        </div>
                    </Field>

                    <Field label="Deskripsi Kost" required hint="Ceritakan keunggulan kost Anda (min. 50 karakter)">
                        <Textarea
                            rows={4}
                            placeholder="Kost nyaman dan strategis dekat kampus, dilengkapi fasilitas lengkap..."
                            value={form.description || ''}
                            onChange={e => upd('description', e.target.value)}
                        />
                    </Field>
                </div>
            );

            // ── STEP 1: Lokasi ─────────────────────────────────────────────────
            case 1: return (
                <div className="space-y-5">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-xs font-medium text-blue-700">
                        🗺️ Gunakan peta di bawah untuk menentukan lokasi kost secara presisi. Klik peta atau cari alamat.
                    </div>

                    <Field label="Pilih Lokasi di Peta" required>
                        <MapPicker
                            lat={form.location?.lat || -6.2088}
                            lng={form.location?.lng || 106.8456}
                            onLocationChange={handleLocationChange}
                        />
                    </Field>

                    <Field label="Kota" required hint="Isi manual jika tidak otomatis terdeteksi">
                        <Input placeholder="Contoh: Jakarta Selatan"
                            value={form.city || ''} onChange={e => upd('city', e.target.value)}
                            icon={<MapPin size={16} />} />
                    </Field>

                    <Field label="Kecamatan / Area">
                        <Input placeholder="Contoh: Tebet, Mampang, Setiabudi"
                            value={form.area || ''} onChange={e => upd('area', e.target.value)} />
                    </Field>

                    <Field label="Alamat Lengkap" hint="Otomatis terisi dari peta, bisa diedit manual">
                        <Textarea rows={3} placeholder="Jl. Tebet Utara No. 22A, RT 005/RW 003..."
                            value={form.address || ''} onChange={e => upd('address', e.target.value)} />
                    </Field>

                    {managementOption !== 'kostmanager' && (
                        <Field label="Dekat Kampus / Fasilitas Umum" hint="Tambahkan lokasi penting di sekitar kost">
                            <div className="space-y-2">
                                {(form.campuses || []).map((c, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                                        <div className="flex-1 space-y-2 w-full">
                                            <div className="flex gap-2 w-full">
                                                <Input placeholder="Nama kampus/fasilitas (Cth: IPB)" value={c.name}
                                                    onChange={e => { const a = [...(form.campuses||[])]; a[i]={...a[i],name:e.target.value}; upd('campuses',a); }} 
                                                    className="w-full"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => searchFacilityCoordinates('campuses', i, c.name)}
                                                    disabled={isSearchingFacility[`campuses-${i}`]}
                                                    className="bg-orange-500 text-white px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold shrink-0 hover:bg-orange-600 disabled:opacity-50"
                                                >
                                                    {isSearchingFacility[`campuses-${i}`] ? 'Mencari...' : 'Cari Koordinat'}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setActiveMapPicker({ field: 'campuses', index: i })}
                                                    className="bg-white border text-gray-500 border-gray-200 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center shrink-0 hover:bg-gray-50 hover:text-orange-500 transition-colors"
                                                    title="Pilih Manual di Peta"
                                                >
                                                    📍 Peta
                                                </button>
                                            </div>
                                            {c.distance && (() => {
                                                const kmMatch = c.distance.match(/[\d.]+/);
                                                if (kmMatch) {
                                                    const km = parseFloat(kmMatch[0]);
                                                    const walk = Math.ceil((km / 5) * 60);
                                                    const moto = Math.ceil((km / 30) * 60) + 2;
                                                    const car = Math.ceil((km / 20) * 60) + 5;
                                                    return (
                                                        <div className="flex flex-wrap items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100 w-full mt-2">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Estimasi Waktu:</span>
                                                            <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                                                                <span className="flex items-center gap-1">🚶 {walk} Mnt</span>
                                                                <span className="text-gray-300">•</span>
                                                                <span className="flex items-center gap-1">🏍️ {moto} Mnt</span>
                                                                <span className="text-gray-300">•</span>
                                                                <span className="flex items-center gap-1">🚗 {car} Mnt</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input placeholder="Jarak" value={c.distance}
                                                onChange={e => { const a=[...(form.campuses||[])]; a[i]={...a[i],distance:e.target.value}; upd('campuses',a); }}
                                                className="!w-24 sm:!w-32 shrink-0" 
                                            />
                                            <button type="button" onClick={() => upd('campuses',(form.campuses||[]).filter((_,idx)=>idx!==i))}
                                                className="p-3 text-rose-400 hover:bg-rose-100 bg-white rounded-xl shrink-0">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button"
                                    onClick={() => upd('campuses',[...(form.campuses||[]),{name:'',distance:'',transportMode:'walk'}])}
                                    className="w-full h-10 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors flex items-center justify-center gap-2">
                                    <Plus size={14} /> Tambah Kampus / Fasilitas Terdekat
                                </button>
                            </div>
                        </Field>
                    )}

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
                                    <MapPicker
                                        lat={
                                            (form[activeMapPicker.field] || [])[activeMapPicker.index]?.lat 
                                            || form.location?.lat 
                                            || -6.2088
                                        }
                                        lng={
                                            (form[activeMapPicker.field] || [])[activeMapPicker.index]?.lng 
                                            || form.location?.lng 
                                            || 106.8456
                                        }
                                        onLocationChange={(lat, lng) => handleMapPickerSave(lat, lng)}
                                    />
                                </div>
                                <div className="p-4 bg-orange-50 border-t border-orange-100 flex justify-end">
                                  <p className="text-[10px] text-orange-600 font-bold italic">Lokasi otomatis disimpan saat penanda digeser.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );

            // ── STEP 2: Media ──────────────────────────────────────────────────
            case 2: return (
                <div className="space-y-6">
                    <Field label="Foto Kost" required hint="Upload minimal 3 foto terbaik. Foto pertama akan jadi cover.">
                        {(form.imageUrls || []).length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {(form.imageUrls || []).map((url, i) => {
                                    const src = typeof url === 'string' ? url : (url as any).original;
                                    return (
                                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group">
                                            <img src={src} className="w-full h-full object-cover" alt="" />
                                            {i === 0 && <span className="absolute top-1 left-1 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">COVER</span>}
                                            <button type="button" onClick={() => removeExistingImage(url)}
                                                className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {imagePreviews.map((src, i) => (
                                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-orange-200 group">
                                        <img src={src} className="w-full h-full object-cover" alt="" />
                                        <span className="absolute bottom-1 left-1 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">BARU</span>
                                        <button type="button" onClick={() => removeNewImage(i)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImages} />
                        <button type="button" onClick={() => imageInputRef.current?.click()}
                            className="w-full h-20 border-2 border-dashed border-orange-200 rounded-3xl flex flex-col items-center justify-center gap-1 hover:bg-orange-50 hover:border-orange-400 transition-all text-orange-400">
                            <Camera size={22} />
                            <span className="text-xs font-bold">Pilih Foto dari Galeri</span>
                        </button>
                    </Field>

                    <Field label="Video Kost" hint="Opsional — video tur singkat meningkatkan minat calon penyewa">
                        <input ref={videoInputRef} type="file" multiple accept="video/*" className="hidden" onChange={handleVideos} />
                        <button type="button" onClick={() => videoInputRef.current?.click()}
                            className="w-full h-20 border-2 border-dashed border-orange-200 rounded-3xl flex flex-col items-center justify-center gap-1 hover:bg-orange-50 hover:border-orange-400 transition-all text-orange-400">
                            <Video size={22} />
                            <span className="text-xs font-bold">Pilih Video dari Galeri</span>
                        </button>
                    </Field>
                </div>
            );

            // ── STEP 3: Fasilitas Gedung ───────────────────────────────────────
            case 3: return (
                <div className="space-y-6">
                    <Field label="Fasilitas Gedung" hint="Pilih preset atau ketik fasilitas lain yang dimiliki">
                        <FacilityInput
                            selected={form.facilities || []}
                            presets={BUILDING_FACILITIES}
                            onToggle={toggleFacility}
                            onAdd={addCustomFacility}
                            onRemove={removeCustomFacility}
                            placeholder="Contoh: Kolam Renang, Gym, Rooftop..."
                        />
                    </Field>

                    <Field label="Biaya Tambahan (Opsional)" hint="Isi jika kost menetapkan tagihan wajib bulanan di luar tagihan pokok kamar.">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <Input placeholder="Nama biaya (Listrik)" value={form.additionalFeeName||''} onChange={e => upd('additionalFeeName',e.target.value)} icon={<BookOpen size={16}/>} />
                            <Input type="number" placeholder="Nominal (Rp)" value={form.additionalFeePrice||''} onChange={e => upd('additionalFeePrice',parseInt(e.target.value)||0)} icon={<span className="text-[10px] font-bold text-gray-400">Rp</span>} />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Ketentuan Penagihan</p>
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={() => upd('additionalFeeStartsFrom', 'month_1')}
                                    className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase transition-all ${
                                        form.additionalFeeStartsFrom !== 'month_2' 
                                            ? 'bg-orange-500 text-white shadow-md' 
                                            : 'bg-white text-gray-500 border border-gray-200'
                                    }`}
                                >
                                    Mulai dari Bulan Awal Sewa Pertama
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => upd('additionalFeeStartsFrom', 'month_2')}
                                    className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase transition-all ${
                                        form.additionalFeeStartsFrom === 'month_2' 
                                            ? 'bg-orange-500 text-white shadow-md' 
                                            : 'bg-white text-gray-500 border border-gray-200'
                                    }`}
                                >
                                    Promo Bebas Tagihan di Bulan Pertama
                                </button>
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold mt-3 leading-relaxed">
                                {form.additionalFeeStartsFrom === 'month_2' 
                                    ? 'ℹ️ Biaya tambahan akan GRATIS pada awal sewa (bulan pertama), dan baru akan ditagih mulai periode perpanjangan berikutnya.'
                                    : 'ℹ️ Biaya tambahan akan langsung ditagih bersamaan dengan pembayaran sewa pertama kali.'}
                            </p>
                        </div>
                    </Field>
                </div>
            );

            // ── STEP 4: Tipe Kamar & Harga ─────────────────────────────────────
            case 4: return (
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-black text-gray-900 uppercase tracking-tight">Tipe Kamar & Harga</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Tambahkan minimal 1 tipe kamar</p>
                        </div>
                        <button type="button" onClick={addRoom}
                            className="h-9 px-4 bg-orange-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                            <Plus size={14}/> Tambah
                        </button>
                    </div>

                    <div className="space-y-4">
                        {(form.roomTypes || []).map((room, ri) => (
                            <div key={ri} className="bg-gray-50 rounded-3xl border border-gray-100 p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Input placeholder="Nama tipe kamar (contoh: Kamar Standard)"
                                        value={room.name}
                                        onChange={e => updRoom(ri, 'name', e.target.value)}
                                        className="bg-white border-gray-200 text-sm font-black flex-1 mr-2" />
                                    <button type="button" onClick={() => removeRoom(ri)} className="w-9 h-9 text-rose-400 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ukuran Kamar</p>
                                        <Input placeholder="Contoh: 3x4m" value={room.size || ''} onChange={e => updRoom(ri,'size',e.target.value)} className="bg-white" />
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Harga Sewa</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PRICING_PERIODS.map(({ key, label }) => {
                                            const val = room.pricing?.find(p => p.period === key)?.price || '';
                                            return (
                                                <div key={key} className="bg-white rounded-xl border border-gray-200 p-2">
                                                    <p className="text-[9px] font-bold text-gray-400 mb-1">{label}</p>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">Rp</span>
                                                        <input type="number" min="0" placeholder="0"
                                                            value={val}
                                                            onChange={e => updRoomPrice(ri, key, parseInt(e.target.value)||0)}
                                                            className="w-full h-8 pl-7 pr-2 text-xs font-bold text-gray-900 bg-transparent focus:outline-none" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {(() => {
                                    const activePeriods = room.pricing?.filter(p => p.price > 0).map(p => p.period) || [];
                                    const lowestPeriod = activePeriods.length > 0 
                                        ? activePeriods.reduce((min, p) => periodWeights[p] < periodWeights[min] ? p : min, activePeriods[0]) 
                                        : 'bulanan';
                                    
                                    const lowestPeriodLabel = periodLabels[lowestPeriod] || 'Bulanan';

                                    return (
                                        <div className="grid grid-cols-2 gap-4 mt-2 py-4 border-t border-gray-100">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Maks. Penghuni</p>
                                                <input type="number" min="1" placeholder="1" value={room.maxOccupants || ''} onChange={e => updRoom(ri,'maxOccupants',parseInt(e.target.value) || 1)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                    {'Biaya Tambahan (> 1 Penghuni)'} (Per {lowestPeriodLabel})
                                                </p>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">Rp</span>
                                                    <input type="number" min="0" placeholder="0" value={room.additionalCostPerPerson || ''} onChange={e => updRoom(ri,'additionalCostPerPerson',parseInt(e.target.value) || 0)} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:border-orange-500" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Fasilitas Kamar</p>
                                    <FacilityInput
                                        selected={room.roomFacilities || []}
                                        presets={ROOM_AMENITIES}
                                        onToggle={f => toggleRoomFeature(ri,'roomFacilities',f)}
                                        onAdd={f => addCustomRoomFeature(ri,'roomFacilities',f)}
                                        onRemove={f => toggleRoomFeature(ri,'roomFacilities',f)}
                                        placeholder="Contoh: Sofa, Balkon..."
                                    />
                                </div>

                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Fasilitas Kamar Mandi</p>
                                    <FacilityInput
                                        selected={room.bathroomFacilities || []}
                                        presets={BATH_AMENITIES}
                                        onToggle={f => toggleRoomFeature(ri,'bathroomFacilities',f)}
                                        onAdd={f => addCustomRoomFeature(ri,'bathroomFacilities',f)}
                                        onRemove={f => toggleRoomFeature(ri,'bathroomFacilities',f)}
                                    />
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={room.isAvailable !== false} 
                                            onChange={e => updRoom(ri, 'isAvailable', e.target.checked)} 
                                            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" 
                                        />
                                        <span className="text-sm font-bold text-gray-700">Kamar Tersedia</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sisa Kamar:</span>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            className="w-14 border-b border-gray-200 py-1 text-center font-bold focus:border-orange-500 outline-none text-xs" 
                                            placeholder="0" 
                                            value={room.availableRoomCount || 0} 
                                            onChange={e => updRoom(ri, 'availableRoomCount', e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(form.roomTypes||[]).length === 0 && (
                            <button type="button" onClick={addRoom}
                                className="w-full h-24 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-1 hover:border-orange-300 transition-colors text-gray-300">
                                <Plus size={24}/>
                                <span className="text-xs font-bold">Tambah tipe kamar pertama</span>
                            </button>
                        )}
                    </div>
                </div>
            );

            // ── STEP 5: Peraturan Kost ─────────────────────────────────────────
            case 5: return (
                <div className="space-y-6">
                    <Field label="Peraturan Kost" hint="Tambahkan aturan yang berlaku di kost Anda untuk calon penyewa">
                        <div className="space-y-2">
                            {(form.rules || []).map((r, i) => (
                                <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                                    <p className="text-xs font-medium text-gray-700 flex-1">{r}</p>
                                    <button type="button" onClick={() => upd('rules',(form.rules||[]).filter((_,idx)=>idx!==i))} className="text-rose-400 shrink-0"><X size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Input placeholder="Contoh: Dilarang membawa tamu di atas jam 21.00"
                                value={tempRule} onChange={e => setTempRule(e.target.value)}
                                onKeyDown={e => { if (e.key==='Enter') { e.preventDefault(); if(tempRule.trim()){ upd('rules',[...(form.rules||[]),tempRule.trim()]); setTempRule(''); }} }} />
                            <button type="button" onClick={() => { if(tempRule.trim()){ upd('rules',[...(form.rules||[]),tempRule.trim()]); setTempRule(''); }}}
                                className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shrink-0">
                                <Plus size={18}/>
                            </button>
                        </div>
                    </Field>
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <div>
                    <h2 className="font-black text-gray-900 text-base">{isEditing ? 'Edit Listing' : 'Tambah Kost Baru'}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Langkah {step + 1} dari {activeSteps.length}</p>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-2xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Step Indicators */}
            <div className="px-5 pt-4 pb-2 shrink-0">
                <div className="flex items-center gap-1">
                    {activeSteps.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <button
                                type="button"
                                onClick={() => i < step && setStep(i)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${
                                    i === step ? 'bg-orange-500 text-white shadow-md' :
                                    i < step ? 'bg-green-100 text-green-600 cursor-pointer' :
                                    'bg-gray-100 text-gray-400'
                                }`}>
                                {i < step ? <Check size={10} /> : s.icon}
                                <span className="hidden sm:inline">{s.label}</span>
                            </button>
                            {i < activeSteps.length - 1 && (
                                <div className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? 'bg-green-300' : 'bg-gray-100'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="h-1 bg-gray-100 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${((step + 1) / activeSteps.length) * 100}%` }} />
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mx-5 mt-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 shrink-0">
                    <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-rose-600">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-rose-400"><X size={14}/></button>
                </div>
            )}

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
                {renderStep()}
            </div>

            {/* Footer Navigation */}
            <div className="px-5 py-4 border-t border-gray-100 shrink-0 bg-white">
                <div className="flex gap-3">
                    {step > 0 && (
                        <button type="button" onClick={() => setStep(s => s - 1)}
                            className="h-14 px-6 rounded-2xl border-2 border-gray-200 text-gray-600 font-black text-sm flex items-center gap-2 hover:border-gray-300 transition-colors shrink-0">
                            <ChevronLeft size={18}/> Kembali
                        </button>
                    )}

                    {step < activeSteps.length - 1 ? (
                        <button type="button" onClick={() => { setError(''); setStep(s => s + 1); }}
                            className="flex-1 h-14 bg-orange-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-100 active:scale-95 transition-transform">
                            Lanjut <ChevronRight size={18}/>
                        </button>
                    ) : (
                        <button type="button" disabled={submitting} onClick={handleSubmit}
                            className={`flex-1 h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${submitting ? 'bg-gray-300 text-gray-400' : 'bg-gray-900 text-white shadow-gray-200'}`}>
                            {submitting ? (
                                <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
                            ) : (
                                <><Upload size={18} /> {isEditing ? 'Simpan Perubahan' : 'Publikasikan Kost'}</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KostFormMitra;
