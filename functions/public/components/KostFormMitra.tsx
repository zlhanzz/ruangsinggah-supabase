import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Kost, RoomType, PricingPeriod } from '../types';
import { addPropertyWithMedia, updatePropertyWithMedia } from '../adminService';
import { findNearbyCuratedLandmarks } from '../constants/curatedLandmarks';
import {
    X, ChevronRight, ChevronLeft, Camera, Video, MapPin, Home, Wifi,
    Plus, Trash2, Check, AlertCircle, Loader2, Upload, Image as ImageIcon,
    Phone, BookOpen, DollarSign, Search, Navigation, ShieldCheck, User, Users, Maximize2,
    Crosshair, CheckCircle2, Sparkles, LocateFixed, FileText, RotateCcw, Save, Droplets, Bed
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
    { id: 'rooms',      label: 'Kamar',     icon: <Check size={16} /> },
    { id: 'facilities', label: 'Fasilitas', icon: <Wifi size={16} /> },
    { id: 'media',      label: 'Foto',      icon: <Camera size={16} /> },
    { id: 'rules',      label: 'Peraturan', icon: <BookOpen size={16} /> },
];

const ROOM_TYPE_PRESETS = ['Standard', 'Deluxe', 'VIP', 'Premium', 'Exclusive'];
const ROOM_SIZE_PRESETS = ['3x3 m', '3x4 m', '4x4 m', '4x5 m'];

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

interface PublicPhotoCategoryDef {
    id: string;
    label: string;
    desc: string;
    required?: boolean;
}

const PUBLIC_PHOTO_CATEGORIES: PublicPhotoCategoryDef[] = [
    { id: 'Bangunan Depan', label: 'Bangunan Depan (Fasad)', desc: 'Tampak depan gedung & jalan akses (Cover Utama)', required: true },
    { id: 'Koridor', label: 'Koridor & Akses Masuk', desc: 'Lorong antar kamar, tangga, atau pintu masuk utama' },
    { id: 'Area Parkir', label: 'Area Parkir', desc: 'Tempat parkir motor atau mobil penghuni' },
    { id: 'Dapur Bersama', label: 'Dapur Bersama', desc: 'Area memasak bersama, wastafel, & kompor' },
    { id: 'Ruang Tamu', label: 'Ruang Tamu & Bersama', desc: 'Ruang santai atau ruang tamu penerima kunjungan' },
    { id: 'WC Umum', label: 'WC Umum / Luar', desc: 'Kamar mandi luar untuk fasilitas bersama' },
    { id: 'Lingkungan', label: 'Lingkungan Sekitar', desc: 'Suasana jalan dan lingkungan di sekitar kost' },
    { id: 'Fasilitas Lainnya', label: 'Fasilitas & Area Lainnya', desc: 'Rooftop, tempat jemuran, pos keamanan, dll.' },
];

interface NewPhotoItem {
    id: string;
    file: File;
    preview: string;
    category: string;
}

const initialForm: Partial<Kost> = {
    title: '', description: '', type: 'Campur', status: 'published',
    province: '', city: '', area: '', address: '',
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
    onLocationChange: (lat: number, lng: number, address: string, city?: string, area?: string, province?: string) => void;
}> = ({ lat, lng, onLocationChange }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [pendingLocationChange, setPendingLocationChange] = useState<{ lat: number; lng: number } | null>(null);
    const [modalTempLocation, setModalTempLocation] = useState<{ lat: number; lng: number }>({ lat, lng });
    const [isLocating, setIsLocating] = useState(false);
    const [isLocatingModal, setIsLocatingModal] = useState(false);
    const modalMapRef = useRef<HTMLDivElement>(null);
    const modalMapInstance = useRef<any>(null);
    const modalMarkerInstance = useRef<any>(null);
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
    const [isSearchingModalMap, setIsSearchingModalMap] = useState(false);
    const modalSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isMapModalOpen || !modalMapRef.current) {
            if (modalMapInstance.current) {
                (window as any).google?.maps?.event?.clearInstanceListeners(modalMapInstance.current);
                modalMapInstance.current = null;
                modalMarkerInstance.current = null;
            }
            return;
        }

        const google = (window as any).google;
        if (!google?.maps) return;

        const startLat = modalTempLocation.lat || lat;
        const startLng = modalTempLocation.lng || lng;

        try {
            const map = new google.maps.Map(modalMapRef.current, {
                center: { lat: startLat, lng: startLng },
                zoom: 17,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: false,
                zoomControl: true,
                gestureHandling: 'greedy',
            });

            const marker = new google.maps.Marker({
                position: { lat: startLat, lng: startLng },
                map,
                draggable: true,
                animation: google.maps.Animation.DROP,
            });

            map.addListener('click', (e: any) => {
                const clickLat = e.latLng.lat();
                const clickLng = e.latLng.lng();
                marker.setPosition({ lat: clickLat, lng: clickLng });
                setModalTempLocation({ lat: clickLat, lng: clickLng });
            });

            marker.addListener('dragend', () => {
                const pos = marker.getPosition();
                if (pos) {
                    setModalTempLocation({ lat: pos.lat(), lng: pos.lng() });
                }
            });

            modalMapInstance.current = map;
            modalMarkerInstance.current = marker;
        } catch (e) {
            console.error("Modal Map Init Error:", e);
        }

        return () => {
            if (modalMapInstance.current) {
                (window as any).google?.maps?.event?.clearInstanceListeners(modalMapInstance.current);
                modalMapInstance.current = null;
                modalMarkerInstance.current = null;
            }
        };
    }, [isMapModalOpen]);

    const handleModalSearch = (text: string) => {
        setModalSearchQuery(text);
        if (modalSearchDebounceRef.current) clearTimeout(modalSearchDebounceRef.current);
        if (text.length < 3) { setModalSearchResults([]); return; }
        modalSearchDebounceRef.current = setTimeout(() => {
            setIsSearchingModalMap(true);
            try {
                const gw = (window as any).google;
                if (!gw?.maps?.places?.AutocompleteService) { setIsSearchingModalMap(false); return; }
                const svc = new gw.maps.places.AutocompleteService();
                svc.getPlacePredictions(
                    { input: text, componentRestrictions: { country: 'id' }, types: ['geocode', 'establishment'] },
                    (predictions: any[], status: string) => {
                        if (status === gw.maps.places.PlacesServiceStatus.OK && predictions) {
                            setModalSearchResults(predictions);
                        } else {
                            setModalSearchResults([]);
                        }
                        setIsSearchingModalMap(false);
                    }
                );
            } catch { setModalSearchResults([]); setIsSearchingModalMap(false); }
        }, 500);
    };

    const selectModalSearchResult = (result: any) => {
        setModalSearchQuery(result.description || result.structured_formatting?.main_text || '');
        setModalSearchResults([]);
        const gw = (window as any).google;
        if (!gw?.maps?.Geocoder) return;
        const geocoder = new gw.maps.Geocoder();
        geocoder.geocode(
            { placeId: result.place_id },
            (results: any[], status: string) => {
                if (status === 'OK' && results && results.length > 0) {
                    const loc = results[0].geometry.location;
                    const plat = loc.lat(), plng = loc.lng();
                    setModalTempLocation({ lat: plat, lng: plng });
                    if (modalMarkerInstance.current && modalMapInstance.current) {
                        modalMarkerInstance.current.setPosition({ lat: plat, lng: plng });
                        modalMapInstance.current.setCenter({ lat: plat, lng: plng });
                        modalMapInstance.current.setZoom(17);
                    }
                }
            }
        );
    };

    const handleConfirmModalLocation = () => {
        reverseGeocode(modalTempLocation.lat, modalTempLocation.lng);
        setIsMapModalOpen(false);
    };

    const extractIndonesianLocationComponents = (components: any[]) => {
        let province = '';
        let city = '';
        let area = '';
        let subdistrict = '';

        for (const comp of components) {
            const types: string[] = comp.types || [];

            // 1. PROVINSI (administrative_area_level_1)
            if (types.includes('administrative_area_level_1') && !province) {
                province = comp.long_name || comp.short_name || '';
            }

            // 2. KABUPATEN / KOTA (administrative_area_level_2)
            if (types.includes('administrative_area_level_2') && !city) {
                city = comp.long_name || '';
            }

            // 3. KECAMATAN (administrative_area_level_3 atau sublocality_level_1 atau sublocality)
            if (types.includes('administrative_area_level_3') && !area) {
                area = comp.long_name || '';
            }
            if (types.includes('sublocality_level_1') && !subdistrict) {
                subdistrict = comp.long_name || '';
            }
            if (types.includes('sublocality') && !subdistrict) {
                subdistrict = comp.long_name || '';
            }
        }

        // Fallback jika area belum terisi dari level 3
        if (!area && subdistrict) {
            area = subdistrict;
        }

        // Fallback untuk kota jika level 2 tidak ada tapi ada locality
        if (!city) {
            const localityComp = components.find((c: any) => c.types?.includes('locality'));
            if (localityComp && localityComp.long_name !== area) {
                city = localityComp.long_name;
            }
        }

        // Standardisasi nama Kota / Kabupaten:
        let cleanCity = city;
        if (cleanCity) {
            cleanCity = cleanCity.replace(/^(Kota\s+Administrasi\s+|Kota\s+|Kabupaten\s+|Kab\.\s+)/i, '').trim();
        }

        // Standardisasi nama Kecamatan / Area:
        let cleanArea = area;
        if (cleanArea) {
            cleanArea = cleanArea.replace(/^(Kecamatan\s+|Kec\.\s+)/i, '').trim();
        }

        // Standardisasi nama Provinsi:
        let cleanProvince = province;
        if (cleanProvince) {
            cleanProvince = cleanProvince.replace(/^(Daerah Khusus Ibukota\s+|Daerah Istimewa\s+)/i, (match) => {
                if (match.toLowerCase().includes('ibukota')) return 'DKI ';
                if (match.toLowerCase().includes('istimewa')) return 'DI ';
                return '';
            }).trim();
        }

        return {
            province: cleanProvince,
            city: cleanCity,
            area: cleanArea
        };
    };

    const reverseGeocode = useCallback((lat: number, lng: number) => {
        const gw = (window as any).google;
        if (!gw?.maps?.Geocoder) {
            onLocationChange(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            return;
        }
        const geocoder = new gw.maps.Geocoder();
        geocoder.geocode(
            { location: { lat, lng } },
            (results: any[], status: string) => {
                if (status === 'OK' && results && results.length > 0) {
                    const addr = results[0].formatted_address;
                    const { city, area, province } = extractIndonesianLocationComponents(results[0].address_components || []);
                    onLocationChange(lat, lng, addr, city, area, province);
                    setSearchQuery(addr);
                } else {
                    onLocationChange(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                }
            }
        );
    }, [onLocationChange]);

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Browser Anda tidak mendukung deteksi lokasi otomatis.');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            pos => {
                const plat = pos.coords.latitude;
                const plng = pos.coords.longitude;
                reverseGeocode(plat, plng);
                if (markerInstance.current && mapInstance.current) {
                    markerInstance.current.setPosition({ lat: plat, lng: plng });
                    mapInstance.current.setCenter({ lat: plat, lng: plng });
                    mapInstance.current.setZoom(17);
                }
                setIsLocating(false);
            },
            err => {
                setIsLocating(false);
                let msg = 'Gagal mendeteksi lokasi GPS.';
                if (err.code === 1) msg = 'Izin akses lokasi ditolak oleh browser. Silakan aktifkan izin lokasi di pengaturan browser Anda.';
                else if (err.code === 2) msg = 'Sinyal GPS / posisi perangkat tidak dapat ditentukan.';
                else if (err.code === 3) msg = 'Waktu permintaan lokasi GPS habis (timeout). Silakan coba kembali.';
                alert(msg);
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;
        const gw = (window as any).google;
        if (!gw?.maps?.Map) return;

        const map = new gw.maps.Map(mapRef.current, {
            center: { lat, lng },
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
        });

        const marker = new gw.maps.Marker({
            position: { lat, lng },
            map,
            draggable: true,
        });

        marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            if (pos) {
                setPendingLocationChange({ lat: pos.lat(), lng: pos.lng() });
                marker.setPosition({ lat, lng });
            }
        });

        map.addListener('click', (e: any) => {
            const clickLat = e.latLng.lat(), clickLng = e.latLng.lng();
            setPendingLocationChange({ lat: clickLat, lng: clickLng });
        });

        mapInstance.current = map;
        markerInstance.current = marker;
    }, []);

    useEffect(() => {
        if (markerInstance.current && mapInstance.current) {
            const curPos = markerInstance.current.getPosition();
            if (!curPos || Math.abs(curPos.lat() - lat) > 0.0001 || Math.abs(curPos.lng() - lng) > 0.0001) {
                markerInstance.current.setPosition({ lat, lng });
                mapInstance.current.setCenter({ lat, lng });
            }
        }
    }, [lat, lng]);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (text.length < 3) { setSearchResults([]); return; }
        debounceRef.current = setTimeout(() => {
            setIsSearching(true);
            try {
                const gw = (window as any).google;
                if (!gw?.maps?.places?.AutocompleteService) { setIsSearching(false); return; }
                const svc = new gw.maps.places.AutocompleteService();
                svc.getPlacePredictions(
                    { input: text, componentRestrictions: { country: 'id' }, types: ['geocode', 'establishment'] },
                    (predictions: any[], status: string) => {
                        if (status === gw.maps.places.PlacesServiceStatus.OK && predictions) {
                            setSearchResults(predictions);
                        } else {
                            setSearchResults([]);
                        }
                        setIsSearching(false);
                    }
                );
            } catch { setSearchResults([]); setIsSearching(false); }
        }, 500);
    };

    const selectResult = (r: any) => {
        setSearchQuery(r.description || r.structured_formatting?.main_text || '');
        setSearchResults([]);
        
        const gw = (window as any).google;
        if (!gw?.maps?.Geocoder) return;
        const geocoder = new gw.maps.Geocoder();
        geocoder.geocode(
            { placeId: r.place_id },
            (results: any[], status: string) => {
                if (status === 'OK' && results && results.length > 0) {
                    const loc = results[0].geometry.location;
                    const plat = loc.lat(), plng = loc.lng();
                    const addr = results[0].formatted_address;
                    const { city, area, province } = extractIndonesianLocationComponents(results[0].address_components || []);
                    onLocationChange(plat, plng, addr, city, area, province);
                    if (markerInstance.current && mapInstance.current) {
                        markerInstance.current.setPosition({ lat: plat, lng: plng });
                        mapInstance.current.setCenter({ lat: plat, lng: plng });
                        mapInstance.current.setZoom(16);
                    }
                }
            }
        );
    };

    return (
        <div className="space-y-3">
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
                    disabled={isLocating}
                    title="Gunakan lokasi saya sekarang (GPS)"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    {isLocating ? <Loader2 size={14} className="animate-spin text-orange-500" /> : <Crosshair size={14} />}
                </button>

                {(isSearching || searchResults.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                        {isSearching ? (
                            <p className="p-3 text-xs font-bold text-gray-400 flex items-center gap-2">
                                <Loader2 size={14} className="animate-spin" /> Mencari...
                            </p>
                        ) : (
                            searchResults.map((r: any, i: number) => (
                                <button
                                    key={r.place_id || i} type="button"
                                    onClick={() => selectResult(r)}
                                    className="w-full p-3 text-left text-xs font-medium text-gray-700 hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors flex items-start gap-2"
                                >
                                    <MapPin size={12} className="text-orange-400 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{r.description || r.structured_formatting?.main_text}</span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={handleCurrentLocation}
                disabled={isLocating}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 cursor-pointer"
            >
                {isLocating ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Mendeteksi Lokasi GPS Anda...</span>
                    </>
                ) : (
                    <>
                        <Crosshair size={16} className="text-white" />
                        <span>Gunakan Lokasi Saya Sekarang (GPS)</span>
                    </>
                )}
            </button>

            <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-sm group">
                <div ref={mapRef} style={{ height: 280, width: '100%', zIndex: 0, touchAction: 'none' }} />
                
                <button
                    type="button"
                    onClick={() => {
                        setModalTempLocation({ lat, lng });
                        setIsMapModalOpen(true);
                    }}
                    className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm hover:bg-white text-gray-800 text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                    <Maximize2 size={14} className="text-orange-500" />
                    <span>Perbesar Peta (Pop-up)</span>
                </button>

                <button
                    type="button"
                    onClick={handleCurrentLocation}
                    disabled={isLocating}
                    title="Kunci titik ke lokasi GPS saya"
                    className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm hover:bg-white text-orange-600 text-xs font-bold p-2.5 rounded-xl border border-gray-200 shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                >
                    {isLocating ? <Loader2 size={14} className="animate-spin text-orange-500" /> : <Crosshair size={14} className="text-orange-500" />}
                    <span className="hidden sm:inline">Lokasi Saya</span>
                </button>

                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-[10px] font-bold text-gray-500 border border-gray-100">
                    📍 Klik peta atau seret marker untuk memilih lokasi
                </div>
            </div>

            {isMapModalOpen && (
                <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex flex-col justify-center items-center p-2 sm:p-4 md:p-6 animate-fadeIn">
                    <div className="bg-white w-full max-w-4xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 relative">
                        
                        <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 leading-tight">Tentukan Titik Lokasi Presisi Properti</h3>
                                    <p className="text-[11px] font-medium text-gray-500">Seret marker atau klik peta untuk menentukan koordinat kost dengan bebas</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMapModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 border-b border-gray-100 flex flex-col sm:flex-row gap-2 relative z-20 shrink-0">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama jalan, tempat, atau lokasi di peta..."
                                    value={modalSearchQuery}
                                    onChange={e => handleModalSearch(e.target.value)}
                                    className="w-full h-10 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 pl-9 pr-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                                />
                                
                                {(isSearchingModalMap || modalSearchResults.length > 0) && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto divide-y divide-gray-50">
                                        {isSearchingModalMap ? (
                                            <p className="p-3 text-xs font-bold text-gray-400 flex items-center gap-2">
                                                <Loader2 size={14} className="animate-spin" /> Mencari lokasi...
                                            </p>
                                        ) : (
                                            modalSearchResults.map((r: any, i: number) => (
                                                <button
                                                    key={r.place_id || i}
                                                    type="button"
                                                    onClick={() => selectModalSearchResult(r)}
                                                    className="w-full p-2.5 text-left text-xs font-medium text-gray-700 hover:bg-orange-50 transition-colors flex items-start gap-2"
                                                >
                                                    <MapPin size={14} className="text-orange-500 mt-0.5 shrink-0" />
                                                    <span className="line-clamp-2">{r.description || r.structured_formatting?.main_text}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!navigator.geolocation) {
                                        alert('Browser Anda tidak mendukung deteksi lokasi otomatis.');
                                        return;
                                    }
                                    setIsLocatingModal(true);
                                    navigator.geolocation.getCurrentPosition(
                                        pos => {
                                            const plat = pos.coords.latitude, plng = pos.coords.longitude;
                                            setModalTempLocation({ lat: plat, lng: plng });
                                            if (modalMarkerInstance.current && modalMapInstance.current) {
                                                modalMarkerInstance.current.setPosition({ lat: plat, lng: plng });
                                                modalMapInstance.current.setCenter({ lat: plat, lng: plng });
                                                modalMapInstance.current.setZoom(17);
                                            }
                                            setIsLocatingModal(false);
                                        },
                                        err => {
                                            setIsLocatingModal(false);
                                            let msg = 'Gagal mendeteksi lokasi GPS.';
                                            if (err.code === 1) msg = 'Izin akses lokasi ditolak oleh browser. Silakan aktifkan izin lokasi di pengaturan browser Anda.';
                                            else if (err.code === 2) msg = 'Sinyal GPS / posisi perangkat tidak dapat ditentukan.';
                                            else if (err.code === 3) msg = 'Waktu permintaan lokasi GPS habis (timeout).';
                                            alert(msg);
                                        },
                                        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
                                    );
                                }}
                                disabled={isLocatingModal}
                                className="h-10 px-3.5 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 whitespace-nowrap cursor-pointer disabled:opacity-60"
                            >
                                {isLocatingModal ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin text-orange-500" />
                                        <span>Mendeteksi GPS...</span>
                                    </>
                                ) : (
                                    <>
                                        <Crosshair size={14} />
                                        <span>Lokasi GPS Saya</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="relative flex-1 w-full bg-gray-100">
                            <div ref={modalMapRef} className="w-full h-full" style={{ touchAction: 'none' }} />

                            <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-sm rounded-2xl p-3 border border-gray-200 shadow-lg z-10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} className="text-orange-500" />
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-400">Koordinat Dipilih</p>
                                        <p className="text-xs font-mono font-black text-gray-800">
                                            {modalTempLocation.lat.toFixed(6)}, {modalTempLocation.lng.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsMapModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmModalLocation}
                                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all active:scale-95"
                            >
                                <Check size={16} />
                                Kunci & Gunakan Lokasi Ini
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {pendingLocationChange && (
                <div className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 flex flex-col items-center text-center relative">
                        
                        <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 mb-4 shadow-inner relative">
                            <MapPin size={28} className="animate-bounce text-orange-500" />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black">!</div>
                        </div>

                        <h3 className="text-base font-black text-gray-900 mb-1">Konfirmasi Pindah Titik Lokasi</h3>
                        <p className="text-xs text-gray-500 mb-5 leading-relaxed font-medium">
                            Peta tersentuh atau diklik. Apakah Anda yakin ingin memindahkan koordinat lokasi kost ke titik baru ini?
                        </p>

                        <div className="w-full bg-slate-50 border border-gray-200/80 rounded-2xl p-3.5 mb-6 text-left space-y-2.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Lokasi Saat Ini</span>
                                <span className="font-mono font-bold text-gray-600 bg-gray-200/60 px-2 py-0.5 rounded-md text-[11px]">
                                    {lat.toFixed(6)}, {lng.toFixed(6)}
                                </span>
                            </div>
                            <div className="border-t border-dashed border-gray-200" />
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-orange-600 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                                    <Crosshair size={13} />
                                    Titik Baru (Dipilih)
                                </span>
                                <span className="font-mono font-black text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-md text-[11px]">
                                    {pendingLocationChange.lat.toFixed(6)}, {pendingLocationChange.lng.toFixed(6)}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => setPendingLocationChange(null)}
                                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer"
                            >
                                Batal (Tetap)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const newLoc = pendingLocationChange;
                                    reverseGeocode(newLoc.lat, newLoc.lng);
                                    if (markerInstance.current) {
                                        markerInstance.current.setPosition(newLoc);
                                    }
                                    if (mapInstance.current) {
                                        mapInstance.current.panTo(newLoc);
                                    }
                                    setPendingLocationChange(null);
                                }}
                                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <CheckCircle2 size={15} />
                                Ya, Ubah Lokasi
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

// ── Dedicated Facility Location Modal (Peta Gerbang Landmark Presisi) ─────────
interface FacilityLocationModalProps {
    facilityName: string;
    initialLat?: number;
    initialLng?: number;
    kostLat?: number;
    kostLng?: number;
    cityName?: string;
    provinceName?: string;
    onSave: (lat: number, lng: number) => void;
    onClose: () => void;
}

const FacilityLocationModal: React.FC<FacilityLocationModalProps> = ({
    facilityName,
    initialLat,
    initialLng,
    kostLat,
    kostLng,
    cityName,
    onSave,
    onClose
}) => {
    // Fallback koordinat awal: gunakan initial jika ada, atau pusat kost
    const hasValidInitial = typeof initialLat === 'number' && typeof initialLng === 'number' && (initialLat !== 0 || initialLng !== 0);
    const defaultLat = hasValidInitial ? initialLat! : (kostLat || -5.1343);
    const defaultLng = hasValidInitial ? initialLng! : (kostLng || 119.4870);

    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number }>({
        lat: defaultLat,
        lng: defaultLng
    });

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapObjRef = useRef<any>(null);
    const landmarkMarkerRef = useRef<any>(null);
    const kostMarkerRef = useRef<any>(null);
    const polylineRef = useRef<any>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isGoogleVerified, setIsGoogleVerified] = useState(false);
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Hitung jarak Haversine real-time ke lokasi kost
    const currentDistanceKm = (kostLat && kostLng) 
        ? (() => {
            const R = 6371;
            const dLat = (selectedLocation.lat - kostLat) * Math.PI / 180;
            const dLon = (selectedLocation.lng - kostLng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(kostLat * Math.PI / 180) * Math.cos(selectedLocation.lat * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return parseFloat((R * c).toFixed(1));
        })()
        : null;

    const updatePolyline = (targetLat: number, targetLng: number) => {
        if (!polylineRef.current || !kostLat || !kostLng) return;
        polylineRef.current.setPath([
            { lat: kostLat, lng: kostLng },
            { lat: targetLat, lng: targetLng }
        ]);
    };

    useEffect(() => {
        if (!mapContainerRef.current) return;
        const google = (window as any).google;
        if (!google?.maps) return;

        try {
            const map = new google.maps.Map(mapContainerRef.current, {
                center: { lat: defaultLat, lng: defaultLng },
                zoom: 17,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: false,
                zoomControl: true,
                gestureHandling: 'greedy',
            });

            // Marker Landmark (Draggable)
            const landmarkMarker = new google.maps.Marker({
                position: { lat: defaultLat, lng: defaultLng },
                map,
                draggable: true,
                title: facilityName || 'Titik Gerbang / Gedung Landmark',
                animation: google.maps.Animation.DROP,
            });

            // Marker Kost Acuan (Jika ada)
            let kostMarker = null;
            if (kostLat && kostLng) {
                kostMarker = new google.maps.Marker({
                    position: { lat: kostLat, lng: kostLng },
                    map,
                    draggable: false,
                    title: 'Lokasi Kost Anda'
                });

                const polyline = new google.maps.Polyline({
                    path: [
                        { lat: kostLat, lng: kostLng },
                        { lat: defaultLat, lng: defaultLng }
                    ],
                    geodesic: true,
                    strokeColor: '#f97316',
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                    map: map
                });
                polylineRef.current = polyline;
            }

            landmarkMarker.addListener('drag', () => {
                const pos = landmarkMarker.getPosition();
                if (pos) {
                    setSelectedLocation({ lat: pos.lat(), lng: pos.lng() });
                    updatePolyline(pos.lat(), pos.lng());
                }
            });

            landmarkMarker.addListener('dragend', () => {
                const pos = landmarkMarker.getPosition();
                if (pos) {
                    setSelectedLocation({ lat: pos.lat(), lng: pos.lng() });
                    updatePolyline(pos.lat(), pos.lng());
                }
            });

            map.addListener('click', (e: any) => {
                const clickLat = e.latLng.lat();
                const clickLng = e.latLng.lng();
                landmarkMarker.setPosition({ lat: clickLat, lng: clickLng });
                setSelectedLocation({ lat: clickLat, lng: clickLng });
                updatePolyline(clickLat, clickLng);
            });

            mapObjRef.current = map;
            landmarkMarkerRef.current = landmarkMarker;
            kostMarkerRef.current = kostMarker;
        } catch (e) {
            console.error("FacilityMap init error:", e);
        }

        return () => {
            if (mapObjRef.current) {
                (window as any).google?.maps?.event?.clearInstanceListeners(mapObjRef.current);
                mapObjRef.current = null;
                landmarkMarkerRef.current = null;
                kostMarkerRef.current = null;
                polylineRef.current = null;
            }
        };
    }, []);

    // Pencarian gerbang / tempat di dalam modal
    const handleModalSearch = (text: string) => {
        setSearchQuery(text);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (text.length < 3) { setSearchResults([]); return; }
        searchDebounceRef.current = setTimeout(() => {
            setIsSearching(true);
            try {
                const gw = (window as any).google;
                if (!gw?.maps?.places?.AutocompleteService) { setIsSearching(false); return; }
                const svc = new gw.maps.places.AutocompleteService();
                const bounds = mapObjRef.current?.getBounds();
                svc.getPlacePredictions(
                    {
                        input: text,
                        componentRestrictions: { country: 'id' },
                        bounds: bounds || undefined,
                        types: ['establishment', 'geocode']
                    },
                    (predictions: any[], status: string) => {
                        if (status === gw.maps.places.PlacesServiceStatus.OK && predictions) {
                            setSearchResults(predictions);
                        } else {
                            setSearchResults([]);
                        }
                        setIsSearching(false);
                    }
                );
            } catch {
                setSearchResults([]);
                setIsSearching(false);
            }
        }, 400);
    };

    const selectSearchResult = (result: any) => {
        setSearchQuery(result.description || result.structured_formatting?.main_text || '');
        setSearchResults([]);
        const gw = (window as any).google;
        if (!gw?.maps?.Geocoder) return;
        const geocoder = new gw.maps.Geocoder();
        geocoder.geocode({ placeId: result.place_id }, (results: any[], status: string) => {
            if (status === 'OK' && results && results.length > 0) {
                const loc = results[0].geometry.location;
                const plat = loc.lat(), plng = loc.lng();
                setSelectedLocation({ lat: plat, lng: plng });
                if (landmarkMarkerRef.current && mapObjRef.current) {
                    landmarkMarkerRef.current.setPosition({ lat: plat, lng: plng });
                    mapObjRef.current.setCenter({ lat: plat, lng: plng });
                    mapObjRef.current.setZoom(17);
                    updatePolyline(plat, plng);
                }
            }
        });
    };

    const handleManualCoordinateChange = (newLatStr: string, newLngStr: string) => {
        const pLat = parseFloat(newLatStr);
        const pLng = parseFloat(newLngStr);
        if (!isNaN(pLat) && !isNaN(pLng)) {
            setSelectedLocation({ lat: pLat, lng: pLng });
            if (landmarkMarkerRef.current && mapObjRef.current) {
                landmarkMarkerRef.current.setPosition({ lat: pLat, lng: pLng });
                mapObjRef.current.panTo({ lat: pLat, lng: pLng });
                updatePolyline(pLat, pLng);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[120000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="bg-white max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 flex flex-col h-[580px] max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 text-sm leading-tight line-clamp-1">{facilityName || 'Tentukan Titik Gerbang Landmark'}</h3>
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">Geser penanda merah atau masukkan angka koordinat presisi</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Search in modal */}
                <div className="p-3 bg-slate-50 border-b border-gray-100 relative z-20 shrink-0">
                    <div className="relative">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Cari lokasi spesifik di peta (Cth: Pintu 1 ${facilityName || ''})...`}
                            value={searchQuery}
                            onChange={e => handleModalSearch(e.target.value)}
                            className="w-full h-10 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 pl-9 pr-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                        />
                        {(isSearching || searchResults.length > 0) && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto divide-y divide-gray-50">
                                {isSearching ? (
                                    <p className="p-3 text-xs font-bold text-gray-400 flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin" /> Mencari tempat di peta...
                                    </p>
                                ) : (
                                    searchResults.map((r: any, i: number) => (
                                        <button
                                            key={r.place_id || i}
                                            type="button"
                                            onClick={() => selectSearchResult(r)}
                                            className="w-full p-2.5 text-left text-xs font-medium text-gray-700 hover:bg-orange-50 transition-colors flex items-start gap-2"
                                        >
                                            <MapPin size={14} className="text-orange-500 mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{r.description || r.structured_formatting?.main_text}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Map View */}
                <div className="relative flex-1 w-full bg-slate-100">
                    <div ref={mapContainerRef} className="w-full h-full" style={{ touchAction: 'none' }} />

                    {/* Live distance floating badge */}
                    {currentDistanceKm !== null && (
                        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl border border-orange-200/80 shadow-lg z-10 flex items-center gap-2.5">
                            <span className="text-sm">📏</span>
                            <div>
                                <p className="text-[9px] uppercase font-bold text-gray-400">Jarak ke Kost Anda</p>
                                <p className="text-xs font-black text-orange-600">± {currentDistanceKm} KM</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with Manual Lat/Lng Edit */}
                <div className="p-3.5 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1">
                            <span className="text-[10px] font-bold text-gray-400">Lat:</span>
                            <input
                                type="text"
                                value={selectedLocation.lat}
                                onChange={e => handleManualCoordinateChange(e.target.value, selectedLocation.lng.toString())}
                                className="w-24 bg-transparent text-xs font-mono font-bold text-gray-800 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1">
                            <span className="text-[10px] font-bold text-gray-400">Lng:</span>
                            <input
                                type="text"
                                value={selectedLocation.lng}
                                onChange={e => handleManualCoordinateChange(selectedLocation.lat.toString(), e.target.value)}
                                className="w-24 bg-transparent text-xs font-mono font-bold text-gray-800 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => onSave(selectedLocation.lat, selectedLocation.lng)}
                            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                            <Check size={16} />
                            Gunakan Titik Ini
                        </button>
                    </div>
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

// ── DRAFT STORAGE HELPERS ───────────────────────────────────────────────────
const getDraftStorageKey = (userId?: string) => `ruangsinggah_kost_form_draft_${userId || 'default'}`;

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
interface KostFormMitraProps {
    user: User | null;
    editingKost: Kost | null;
    onClose: () => void;
    onSuccess: () => void;
    freshStart?: boolean;
}

const KostFormMitra: React.FC<KostFormMitraProps> = ({ user, editingKost, onClose, onSuccess, freshStart = false }) => {
    const isEditing = Boolean(editingKost);
    const storageKey = useMemo(() => user?.id ? `kost_form_draft_${user.id}` : 'kost_form_draft_guest', [user?.id]);

    const [step, setStep] = useState(() => {
        if (isEditing || freshStart) return 0;
        try {
            const savedDraft = localStorage.getItem(storageKey);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (typeof parsed.step === 'number' && parsed.step >= 0 && parsed.step < STEPS.length) {
                    return parsed.step;
                }
            }
        } catch {}
        return 0;
    });

    const [managementOption, setManagementOption] = useState<'none' | 'self' | 'kostmanager'>(() => {
        if (editingKost) return editingKost.managed_by || 'self';
        if (freshStart) return 'self';
        try {
            const savedDraft = localStorage.getItem(storageKey);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed.managementOption) return parsed.managementOption;
            }
        } catch {}
        return 'self';
    });

    const [restoredDraftInfo, setRestoredDraftInfo] = useState<{ savedAt?: string } | null>(() => {
        if (isEditing || freshStart) return null;
        try {
            const savedDraft = localStorage.getItem(storageKey);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed.form && (parsed.form.title || parsed.form.address || parsed.form.price || parsed.step > 0)) {
                    return { savedAt: parsed.lastSaved };
                }
            }
        } catch {}
        return null;
    });

    const [form, setForm] = useState<Partial<Kost>>(() => {
        if (editingKost) return { ...initialForm, ...editingKost };
        if (freshStart) return initialForm;
        try {
            const savedDraft = localStorage.getItem(storageKey);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed.form && typeof parsed.form === 'object') {
                    const loadedForm = { ...initialForm, ...parsed.form };
                    // Bersihkan kampus/landmark sampah yang sempat tersimpan dari draft lama
                    if (Array.isArray(loadedForm.campuses)) {
                        const garbagePatterns = [
                            'bimbel', 'bimbingan belajar', 'les ', 'kursus', 'training', 'kumon', 'gandhi',
                            'study club', 'daycare', 'kindergarten', 'paud', 'tk ', 'taman kanak',
                            'sd ', 'smp ', 'sma ', 'smk ', 'madrasah', 'driving school', 'kursus mengemudi',
                            'english course', 'lpk ', 'balai latihan', 'rektorat', 'fakultas', 'dekanat',
                            'prodi', 'jurusan', 'pintu ', 'gate ', 'danau ', 'gedung ', 'hall ', 'auditorium',
                            'asrama', 'rusunawa', 'kantin', 'parkiran', 'full bright'
                        ];
                        loadedForm.campuses = loadedForm.campuses.filter((c: any) => {
                            if (!c || !c.name) return false;
                            const lower = c.name.toLowerCase();
                            return !garbagePatterns.some(p => lower.includes(p));
                        });
                    }
                    return loadedForm;
                }
            }
        } catch {}
        return initialForm;
    });

    const [newPhotoItems, setNewPhotoItems] = useState<NewPhotoItem[]>([]);
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [newCategoryInput, setNewCategoryInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [tempRule, setTempRule] = useState('');
    
    // State sub-wizard pengisian kamar bertahap (Langkah 3)
    const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null);
    const [roomSubStep, setRoomSubStep] = useState<1 | 2 | 3>(1);
    const [draftRoom, setDraftRoom] = useState<RoomType>({
        name: 'Standard',
        size: '3x4 m',
        price: 0,
        pricing: [{ period: 'bulanan', price: 0 }],
        features: [],
        roomFacilities: [],
        bathroomFacilities: [],
        isAvailable: true,
        availableRoomCount: 1,
        maxOccupants: 1,
        additionalCostPerPerson: 0
    });
    const [hasExtraFee, setHasExtraFee] = useState<boolean>(false);

    const isInitialMount = useRef(true);

    // Auto-save draft to localStorage whenever form, step, or managementOption changes
    useEffect(() => {
        if (isEditing) return;

        // Skip saving on initial mount to avoid overwriting with defaults prematurely
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            try {
                const hasData = form.title || form.address || form.description || form.city || step > 0 || (form.roomTypes && form.roomTypes.length > 0);
                if (hasData) {
                    const payload = {
                        form,
                        step,
                        managementOption,
                        lastSaved: new Date().toISOString()
                    };
                    localStorage.setItem(storageKey, JSON.stringify(payload));
                    window.dispatchEvent(new Event('kost_draft_updated'));
                }
            } catch (err) {
                console.warn('Gagal menyimpan draft kost ke localStorage:', err);
            }
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [form, step, managementOption, isEditing, storageKey]);

    // Handle clear draft and start fresh
    const handleClearDraft = () => {
        try {
            localStorage.removeItem(storageKey);
            window.dispatchEvent(new Event('kost_draft_updated'));
        } catch {}
        setForm(initialForm);
        setStep(0);
        setManagementOption('self');
        setRestoredDraftInfo(null);
        setError('');
        if (user) {
            setForm({
                ...initialForm,
                omnichannelContactName: user.displayName || user.name || '',
                omnichannelContactPhone: (user.phone || '').replace(/\D/g, '') || '',
                omnichannelContactType: 'owner',
                contactSelection: 'profile'
            });
        }
    };
    
    // Auto-populate profile data if it's a new listing and source is profile
    useEffect(() => {
        if (!isEditing && user && !restoredDraftInfo) {
            setForm(prev => ({
                ...prev,
                omnichannelContactName: user.displayName || user.name || prev.omnichannelContactName,
                omnichannelContactPhone: (user.phone || '').replace(/\D/g, '') || prev.omnichannelContactPhone,
                omnichannelContactType: 'owner',
                contactSelection: 'profile'
            }));
        }
    }, [user, isEditing, restoredDraftInfo]);

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

    // Helper untuk memperkaya landmark dengan durasi rute nyata Google Maps (DistanceMatrixService)
    const enrichLandmarksWithGoogleDistanceMatrix = useCallback((kostLat: number, kostLng: number, landmarks: any[]) => {
        if (!landmarks || landmarks.length === 0 || !kostLat || !kostLng) return;
        const google = (window as any).google;
        if (!google?.maps?.DistanceMatrixService) return;

        try {
            const service = new google.maps.DistanceMatrixService();
            const origin = new google.maps.LatLng(kostLat, kostLng);
            const validLandmarks = landmarks.filter(l => l && typeof l.lat === 'number' && typeof l.lng === 'number');
            if (validLandmarks.length === 0) return;

            const destinations = validLandmarks.map(l => new google.maps.LatLng(l.lat, l.lng));

            const fetchMatrix = (travelMode: any) => {
                return new Promise<{ status: string; response: any }>((resolve) => {
                    service.getDistanceMatrix(
                        {
                            origins: [origin],
                            destinations: destinations,
                            travelMode: travelMode,
                            unitSystem: google.maps.UnitSystem.METRIC,
                        },
                        (response: any, status: any) => {
                            resolve({ status, response });
                        }
                    );
                });
            };

            Promise.all([
                fetchMatrix(google.maps.TravelMode.DRIVING),
                fetchMatrix(google.maps.TravelMode.WALKING)
            ]).then(([drivingRes, walkingRes]) => {
                const drivingElements = (drivingRes.status === 'OK' && drivingRes.response?.rows?.[0]?.elements) ? drivingRes.response.rows[0].elements : [];
                const walkingElements = (walkingRes.status === 'OK' && walkingRes.response?.rows?.[0]?.elements) ? walkingRes.response.rows[0].elements : [];

                setForm(prev => {
                    const currentCampuses = [...(prev.campuses || [])];
                    let hasChange = false;

                    validLandmarks.forEach((vl, idx) => {
                        const dEl = drivingElements[idx];
                        const wEl = walkingElements[idx];

                        const targetIdx = currentCampuses.findIndex(c => c.name === vl.name || (c.lat === vl.lat && c.lng === vl.lng));
                        if (targetIdx !== -1) {
                            let updatedItem = { ...currentCampuses[targetIdx] };
                            if (dEl && dEl.status === 'OK') {
                                const distText = dEl.distance.text;
                                const motoMin = Math.max(1, Math.round(dEl.duration.value / 60));
                                const carMin = Math.max(1, Math.round(dEl.duration.value / 60) + 1);
                                const distKm = dEl.distance.value / 1000;

                                let walkStr = `${Math.max(1, Math.ceil((distKm / 4.2) * 60))} mnt`;
                                if (wEl && wEl.status === 'OK') {
                                    walkStr = wEl.duration.text;
                                }

                                updatedItem = {
                                    ...updatedItem,
                                    distance: distText,
                                    duration: dEl.duration.text,
                                    walkDuration: walkStr,
                                    motoDuration: `${motoMin} mnt`,
                                    carDuration: `${carMin} mnt`,
                                    isLiveGoogleApi: true
                                };
                                currentCampuses[targetIdx] = updatedItem;
                                hasChange = true;
                            } else if (wEl && wEl.status === 'OK') {
                                updatedItem = {
                                    ...updatedItem,
                                    distance: wEl.distance.text,
                                    duration: wEl.duration.text,
                                    walkDuration: wEl.duration.text,
                                    motoDuration: `${Math.max(1, Math.ceil((wEl.distance.value / 1000 / 28) * 60) + 1)} mnt`,
                                    carDuration: `${Math.max(2, Math.ceil((wEl.distance.value / 1000 / 18) * 60) + 2)} mnt`,
                                    isLiveGoogleApi: true
                                };
                                currentCampuses[targetIdx] = updatedItem;
                                hasChange = true;
                            }
                        }
                    });

                    if (hasChange) {
                        return { ...prev, campuses: currentCampuses };
                    }
                    return prev;
                });
            }).catch(err => {
                console.warn('[DistanceMatrixService Mitra] Error:', err);
            });
        } catch (e) {
            console.error('[DistanceMatrixService Mitra] Init error:', e);
        }
    }, []);

    const handleMapPickerSave = (lat: number, lng: number) => {
        if (!activeMapPicker) return;
        const { field, index } = activeMapPicker;
        const arr = [...(form[field] || [])];
        
        let distString = arr[index].distance;
        if (form.location && form.location.lat) {
            const km = calculateDistance(form.location.lat, form.location.lng, lat, lng);
            distString = `± ${km} KM`;
        }

        const updatedItem = { ...arr[index], lat, lng, distance: distString };
        arr[index] = updatedItem;
        upd(field, arr);
        setActiveMapPicker(null);

        // Langsung hitung rute Google Maps nyata untuk titik baru ini
        if (form.location?.lat && form.location?.lng) {
            enrichLandmarksWithGoogleDistanceMatrix(form.location.lat, form.location.lng, [updatedItem]);
        }
    };

    const [isSearchingFacility, setIsSearchingFacility] = useState<Record<string, boolean>>({});

    const searchFacilityCoordinates = (field: 'campuses' | 'publicFacilities', index: number, name: string) => {
        if (!name) return;
        const stateKey = `${field}-${index}`;
        setIsSearchingFacility(prev => ({ ...prev, [stateKey]: true }));
        const gw = (window as any).google;
        if (!gw?.maps?.Geocoder) {
            setIsSearchingFacility(prev => ({ ...prev, [stateKey]: false }));
            alert('Google Maps belum siap.');
            return;
        }
        const geocoder = new gw.maps.Geocoder();
        const cityContext = form.city ? `, ${form.city}` : '';
        const provinceContext = form.province ? `, ${form.province}` : '';
        const queryAddress = `${name}${cityContext}${provinceContext}, Indonesia`;
        
        geocoder.geocode(
            { address: queryAddress, componentRestrictions: { country: 'ID' } },
            (results: any[], status: string) => {
                if (status === 'OK' && results && results.length > 0) {
                    const loc = results[0].geometry.location;
                    const lat = loc.lat(), lng = loc.lng();
                    const arr = [...(form[field] || [])];
                    
                    let distString = arr[index].distance;
                    if (form.location && form.location.lat) {
                        const km = calculateDistance(form.location.lat, form.location.lng, lat, lng);
                        distString = `± ${km} KM`;
                    }

                    arr[index] = { ...arr[index], lat, lng, distance: distString };
                    upd(field, arr);
                    setIsSearchingFacility(prev => ({ ...prev, [stateKey]: false }));
                } else {
                    // Fallback search tanpa context kota jika terlalu spesifik
                    geocoder.geocode(
                        { address: name + ', Indonesia', componentRestrictions: { country: 'ID' } },
                        (fallbackResults: any[], fallbackStatus: string) => {
                            if (fallbackStatus === 'OK' && fallbackResults && fallbackResults.length > 0) {
                                const loc = fallbackResults[0].geometry.location;
                                const lat = loc.lat(), lng = loc.lng();
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
                            setIsSearchingFacility(prev => ({ ...prev, [stateKey]: false }));
                        }
                    );
                }
            }
        );
    };

    const [isScanningLandmarks, setIsScanningLandmarks] = useState(false);
    const landmarkScanAbortRef = useRef<number>(0);

    const isInvalidCampus = useCallback((name: string) => {
        if (!name) return false;
        const lower = name.toLowerCase();
        const blacklist = [
            'bimbel', 'bimbingan belajar', 'les ', 'kursus', 'training', 'kumon', 'gandhi',
            'study club', 'daycare', 'kindergarten', 'paud', 'tk ', 'taman kanak',
            'sd ', 'smp ', 'sma ', 'smk ', 'madrasah', 'driving school', 'kursus mengemudi',
            'english', 'course', 'language', 'center', 'lpk ', 'balai latihan', 'rektorat', 'fakultas', 'dekanat',
            'prodi', 'jurusan', 'pintu ', 'gate ', 'danau ', 'gedung ', 'hall ', 'auditorium',
            'asrama', 'rusunawa', 'kantin', 'parkiran', 'full bright', 'hasanuddin university',
            'makassar islamic university', 'indonesia muslim university'
        ];
        return blacklist.some(b => lower.includes(b));
    }, []);

    const detectNearbyLandmarks = useCallback((centerLat: number, centerLng: number) => {
        if (!centerLat || !centerLng) return;

        const scanId = Date.now();
        landmarkScanAbortRef.current = scanId;

        const getKm = (pLat: number, pLng: number) => {
            return calculateDistance(centerLat, centerLng, pLat, pLng);
        };

        // 1. DAPATKAN MASTER DATA TERKURASI SECARA INSTAN (0ms, Bebas Kuota, 100% Presisi)
        const curatedAnchors = findNearbyCuratedLandmarks(centerLat, centerLng, 7.0);
        const curatedCampuses = curatedAnchors
            .filter(a => a.category === 'campus')
            .map(c => ({
                name: c.name,
                lat: c.lat,
                lng: c.lng,
                distance: c.distance,
                kmVal: c.kmVal,
                transportMode: c.transportMode,
                isLiveGoogleApi: true
            }));

        const curatedOthers = curatedAnchors
            .filter(a => a.category !== 'campus')
            .map(c => ({
                name: c.name,
                lat: c.lat,
                lng: c.lng,
                distance: c.distance,
                kmVal: c.kmVal,
                transportMode: c.transportMode,
                isLiveGoogleApi: true
            }));

        // LANGSUNG PERBARUI STATE FORM SECARA SINKRON (0ms) DENGAN MASTER DATA MURNI
        const initialCombined = [...curatedCampuses, ...curatedOthers];
        if (initialCombined.length > 0) {
            setForm(prev => ({
                ...prev,
                campuses: initialCombined.map(({ kmVal, ...item }: any) => item),
                publicFacilities: curatedOthers.map(({ kmVal, ...item }: any) => item)
            }));
        }

        // 2. CEK KETERSEDIAAN GOOGLE PLACES API UNTUK SCAN FASILITAS MIKRO (Minimarket, Laundry, Tempat Ibadah)
        const google = (window as any).google;
        if (!google?.maps?.places?.PlacesService) {
            setIsScanningLandmarks(false);
            return;
        }

        setIsScanningLandmarks(true);

        const tempDiv = document.createElement('div');
        const service = new google.maps.places.PlacesService(tempDiv);
        const centerLatLng = new google.maps.LatLng(centerLat, centerLng);

        // Helper generic search promise
        const performSearch = (request: any): Promise<any[]> => {
            return new Promise((resolve) => {
                try {
                    service.nearbySearch(request, (results: any[], status: string) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                            resolve(results);
                        } else {
                            resolve([]);
                        }
                    });
                } catch {
                    resolve([]);
                }
            });
        };

        // 3. Scan Kampus Fallback: HANYA JIKA TIDAK ADA SAMA SEKALI KAMPUS DI MASTER DATASET
        const scanCampusesFallback = curatedCampuses.length > 0 
            ? Promise.resolve([]) 
            : performSearch({
                location: centerLatLng,
                radius: 7000,
                type: 'university'
            }).then(results => {
                const validKeywords = ['universitas', 'institut', 'politeknik', 'stie', 'stikes', 'uin', 'iain', 'stmik', 'sekolah tinggi', 'akademi'];
                return results
                    .filter(p => {
                        if (!p.name || !p.geometry?.location) return false;
                        const lower = p.name.toLowerCase();
                        const hasValidKeyword = validKeywords.some(k => lower.includes(k));
                        return hasValidKeyword && !isInvalidCampus(p.name);
                    })
                    .map(p => {
                        const pLat = p.geometry.location.lat();
                        const pLng = p.geometry.location.lng();
                        const km = getKm(pLat, pLng);
                        const ratingsCount = p.user_ratings_total || 0;
                        const rating = p.rating || 0;
                        const popularityScore = Math.log10(ratingsCount + 1) * 35 + (rating * 3) - ((km / 7) * 8);
                        return {
                            name: p.name,
                            lat: pLat,
                            lng: pLng,
                            distance: `± ${km} KM`,
                            kmVal: km,
                            popularityScore,
                            transportMode: km <= 1.0 ? 'walk' : 'motorcycle',
                            isLiveGoogleApi: true
                        };
                    })
                    .sort((a, b) => b.popularityScore - a.popularityScore)
                    .slice(0, 3);
            });

        // 4. Scan Fasilitas Harian Mikro: Minimarket Terdekat (Radius 2 KM - Tepat 1 Terdekat)
        const scanMinimarket = performSearch({
            location: centerLatLng,
            radius: 2000,
            keyword: 'indomaret|alfamidi|alfamart|supermarket'
        }).then(results => {
            return results
                .filter(p => p.name && p.geometry?.location)
                .map(p => {
                    const pLat = p.geometry.location.lat();
                    const pLng = p.geometry.location.lng();
                    const km = getKm(pLat, pLng);
                    return {
                        name: p.name,
                        lat: pLat,
                        lng: pLng,
                        distance: `± ${km} KM`,
                        kmVal: km,
                        transportMode: km <= 1.0 ? 'walk' : 'motorcycle',
                        isLiveGoogleApi: true
                    };
                })
                .sort((a, b) => a.kmVal - b.kmVal)
                .slice(0, 1);
        });

        // 5. Scan Fasilitas Harian Mikro: Laundry Kiloan Terdekat (Radius 2 KM - Tepat 1 Terdekat)
        const scanLaundry = performSearch({
            location: centerLatLng,
            radius: 2000,
            keyword: 'laundry|laundry kiloan|cuci pakaian'
        }).then(results => {
            return results
                .filter(p => p.name && p.geometry?.location)
                .map(p => {
                    const pLat = p.geometry.location.lat();
                    const pLng = p.geometry.location.lng();
                    const km = getKm(pLat, pLng);
                    return {
                        name: p.name,
                        lat: pLat,
                        lng: pLng,
                        distance: `± ${km} KM`,
                        kmVal: km,
                        transportMode: km <= 1.0 ? 'walk' : 'motorcycle',
                        isLiveGoogleApi: true
                    };
                })
                .sort((a, b) => a.kmVal - b.kmVal)
                .slice(0, 1);
        });

        // 6. Scan Fasilitas Harian Mikro: Masjid / Musholla Terdekat (Radius 2 KM - Tepat 1 Terdekat)
        const scanMosque = performSearch({
            location: centerLatLng,
            radius: 2000,
            type: 'mosque',
            keyword: 'masjid|musholla'
        }).then(results => {
            return results
                .filter(p => p.name && p.geometry?.location)
                .map(p => {
                    const pLat = p.geometry.location.lat();
                    const pLng = p.geometry.location.lng();
                    const km = getKm(pLat, pLng);
                    return {
                        name: p.name,
                        lat: pLat,
                        lng: pLng,
                        distance: `± ${km} KM`,
                        kmVal: km,
                        transportMode: km <= 1.0 ? 'walk' : 'motorcycle',
                        isLiveGoogleApi: true
                    };
                })
                .sort((a, b) => a.kmVal - b.kmVal)
                .slice(0, 1);
        });

        // 7. Scan Fasilitas Harian Mikro: Gereja Terdekat (Radius 3.5 KM - Tepat 1 Terdekat)
        const scanChurch = performSearch({
            location: centerLatLng,
            radius: 3500,
            type: 'church',
            keyword: 'gereja|church|katedral|gki|gbi|hkbp|gpdi'
        }).then(results => {
            return results
                .filter(p => p.name && p.geometry?.location)
                .map(p => {
                    const pLat = p.geometry.location.lat();
                    const pLng = p.geometry.location.lng();
                    const km = getKm(pLat, pLng);
                    return {
                        name: p.name,
                        lat: pLat,
                        lng: pLng,
                        distance: `± ${km} KM`,
                        kmVal: km,
                        transportMode: km <= 1.0 ? 'walk' : 'motorcycle',
                        isLiveGoogleApi: true
                    };
                })
                .sort((a, b) => a.kmVal - b.kmVal)
                .slice(0, 1);
        });

        // 8. Scan Fasilitas Vital: SPBU / Pom Bensin Terdekat (Radius 3.5 KM - Tepat 1 Terdekat)
        const scanGasStation = performSearch({
            location: centerLatLng,
            radius: 3500,
            type: 'gas_station',
            keyword: 'spbu|pertamina|shell|bp|pom bensin'
        }).then(results => {
            return results
                .filter(p => p.name && p.geometry?.location)
                .map(p => {
                    const pLat = p.geometry.location.lat();
                    const pLng = p.geometry.location.lng();
                    const km = getKm(pLat, pLng);
                    return {
                        name: p.name,
                        lat: pLat,
                        lng: pLng,
                        distance: `± ${km} KM`,
                        kmVal: km,
                        transportMode: 'motorcycle',
                        isLiveGoogleApi: true
                    };
                })
                .sort((a, b) => a.kmVal - b.kmVal)
                .slice(0, 1);
        });

        Promise.all([
            scanCampusesFallback,
            scanMinimarket,
            scanLaundry,
            scanMosque,
            scanChurch,
            scanGasStation
        ]).then(([fallbackCampuses, minimarketList, laundryList, mosqueList, churchList, gasStationList]) => {
            if (landmarkScanAbortRef.current !== scanId) return;
            setIsScanningLandmarks(false);

            // 1. Kampus Terdekat (Murni Master Data jika tersedia)
            const finalCampuses = curatedCampuses.length > 0 
                ? [...curatedCampuses] 
                : [...fallbackCampuses];

            // 2. Gabungkan fasilitas: Master Data (Mall, RS, CBD) + 5 Fasilitas Harian Mikro Terdekat (Maks 1 per tipe)
            const finalFacilities = [
                ...curatedOthers,
                ...minimarketList,
                ...laundryList,
                ...gasStationList,
                ...mosqueList,
                ...churchList
            ];

            // 3. Gabungkan seluruh list bebas duplikasi untuk form
            const combinedLandmarks = [...finalCampuses];
            finalFacilities.forEach(fac => {
                const exists = combinedLandmarks.some(c => 
                    c.name.toLowerCase() === fac.name.toLowerCase() ||
                    (c.lat === fac.lat && c.lng === fac.lng)
                );
                if (!exists) {
                    combinedLandmarks.push(fac);
                }
            });

            if (combinedLandmarks.length > 0) {
                setForm(prev => ({
                    ...prev,
                    campuses: combinedLandmarks.map(({ kmVal, ...item }: any) => item),
                    publicFacilities: finalFacilities.map(({ kmVal, ...item }: any) => item)
                }));

                // Langsung hitung rute nyata Google Maps via DistanceMatrixService
                enrichLandmarksWithGoogleDistanceMatrix(centerLat, centerLng, combinedLandmarks);
            }
        }).catch(() => {
            if (landmarkScanAbortRef.current === scanId) {
                setIsScanningLandmarks(false);
            }
        });
    }, [isInvalidCampus, enrichLandmarksWithGoogleDistanceMatrix]);

    // ── location ───────────────────────────────────────────────────────────────
    const handleLocationChange = useCallback((lat: number, lng: number, address: string, city?: string, area?: string, province?: string) => {
        setForm(prev => {
            const updates: Partial<Kost> = { location: { lat, lng }, address };
            if (city) updates.city = city;
            if (area) updates.area = area;
            if (province) updates.province = province;
            return { ...prev, ...updates };
        });

        // Trigger deteksi landmark & kampus terdekat otomatis
        if (lat && lng) {
            detectNearbyLandmarks(lat, lng);
        }
    }, [detectNearbyLandmarks]);

    // Auto-sync master landmarks saat step lokasi aktif jika campuses kosong atau memuat data sampah / bahasa Inggris
    useEffect(() => {
        if (step === 1 && form.location?.lat && form.location?.lng) {
            const currentCampuses = form.campuses || [];
            const hasGarbage = currentCampuses.some(c => 
                isInvalidCampus(c.name) || 
                c.name.toLowerCase().includes('university') ||
                c.name.toLowerCase().includes('full bright')
            );
            if (currentCampuses.length === 0 || hasGarbage) {
                detectNearbyLandmarks(form.location.lat, form.location.lng);
            }
        }
    }, [step, form.location?.lat, form.location?.lng, detectNearbyLandmarks, isInvalidCampus]);

    // ── image handling (categorized & client-side webp) ─────────────────────────
    const compressImageToWebP = async (file: File, quality = 0.82, maxDimension = 1920): Promise<File> => {
        return new Promise((resolve) => {
            if (!file.type.startsWith('image/')) return resolve(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let { width, height } = img;
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        } else {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return resolve(file);
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (!blob) return resolve(file);
                        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                        const webpFile = new File([blob], newFileName, { type: "image/webp" });
                        resolve(webpFile);
                    }, "image/webp", quality);
                };
                img.onerror = () => resolve(file);
                img.src = e.target?.result as string;
            };
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
        });
    };

    const handleCategoryFilesUpload = async (category: string, files: FileList | File[] | null) => {
        if (!files) return;
        const fileArr = Array.from(files);
        if (fileArr.length === 0) return;

        const newItems: NewPhotoItem[] = [];
        for (const file of fileArr) {
            try {
                const webpFile = await compressImageToWebP(file);
                const preview = URL.createObjectURL(webpFile);
                newItems.push({
                    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    file: webpFile,
                    preview,
                    category
                });
            } catch (err) {
                console.error("Error compressing image:", err);
                const preview = URL.createObjectURL(file);
                newItems.push({
                    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    file,
                    preview,
                    category
                });
            }
        }
        setNewPhotoItems(prev => [...prev, ...newItems]);
    };

    const removeNewPhotoItem = (id: string) => {
        setNewPhotoItems(prev => {
            const target = prev.find(p => p.id === id);
            if (target) {
                try { URL.revokeObjectURL(target.preview); } catch {}
            }
            return prev.filter(p => p.id !== id);
        });
    };

    const removeExistingImage = (targetUrl: any) => {
        const cur = form.imageUrls || [];
        const filtered = cur.filter((u: any) => {
            const src = typeof u === 'string' ? u : (u?.original || u?.url);
            const targetSrc = typeof targetUrl === 'string' ? targetUrl : (targetUrl?.original || targetUrl?.url);
            return src !== targetSrc;
        });
        upd('imageUrls', filtered);
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

    // ── room types (Step-by-step Mini-wizard & Management) ──────────────────────
    const startAddRoom = () => {
        const count = (form.roomTypes || []).length;
        const defaultName = count === 0 ? 'Standard' : (count === 1 ? 'Deluxe' : (count === 2 ? 'VIP' : (count === 3 ? 'Premium' : 'Exclusive')));
        setDraftRoom({
            name: defaultName,
            size: '3x4 m',
            price: 0,
            pricing: [{ period: 'bulanan', price: 0 }],
            features: [],
            roomFacilities: [],
            bathroomFacilities: [],
            isAvailable: true,
            availableRoomCount: 1,
            maxOccupants: 1,
            additionalCostPerPerson: 0
        });
        setRoomSubStep(1);
        setHasExtraFee(false);
        setEditingRoomIndex(-1); // -1 = Tambah Baru
    };

    const startEditRoom = (index: number) => {
        const target = (form.roomTypes || [])[index];
        if (!target) return;
        const pricing = target.pricing && target.pricing.length > 0
            ? [...target.pricing]
            : [{ period: 'bulanan' as PricingPeriod, price: target.price || 0 }];
        setDraftRoom({
            ...target,
            pricing
        });
        setHasExtraFee((target.additionalCostPerPerson || 0) > 0);
        setRoomSubStep(1);
        setEditingRoomIndex(index);
    };

    const updDraftRoom = (key: keyof RoomType, val: any) => {
        setDraftRoom(prev => {
            let newVal = val;
            let isAvail = prev.isAvailable;
            let count = prev.availableRoomCount || 0;

            if (key === 'availableRoomCount') {
                count = parseInt(val) || 0;
                isAvail = count > 0;
                newVal = count;
            } else if (key === 'isAvailable') {
                isAvail = val;
                if (val === true && count <= 0) count = 1;
                else if (val === false) count = 0;
            }

            return {
                ...prev,
                [key]: newVal,
                isAvailable: isAvail,
                availableRoomCount: count
            };
        });
    };

    const toggleDraftRoomPricingPeriod = (period: PricingPeriod) => {
        setDraftRoom(prev => {
            const currentPricing = prev.pricing || [];
            const exists = currentPricing.some(p => p.period === period);
            let nextPricing: { period: PricingPeriod; price: number }[];
            if (exists) {
                if (currentPricing.length <= 1) return prev; // Minimal 1 periode
                nextPricing = currentPricing.filter(p => p.period !== period);
            } else {
                nextPricing = [...currentPricing, { period, price: 0 }];
            }
            return { ...prev, pricing: nextPricing };
        });
    };

    const formatCurrencyInput = (val: number | string | undefined | null): string => {
        if (val === undefined || val === null || val === '') return '';
        const numStr = String(val).replace(/\D/g, '');
        if (!numStr) return '';
        return parseInt(numStr, 10).toLocaleString('id-ID');
    };

    const parseCurrencyInput = (rawStr: string): number => {
        const clean = rawStr.replace(/\D/g, '');
        return clean ? parseInt(clean, 10) : 0;
    };

    const updDraftRoomPrice = (period: PricingPeriod, price: number) => {
        setDraftRoom(prev => {
            const pricing = [...(prev.pricing || [])];
            const idx = pricing.findIndex(p => p.period === period);
            if (idx >= 0) pricing[idx] = { period, price };
            else pricing.push({ period, price });
            
            const monthlyPrice = pricing.find(p => p.period === 'bulanan')?.price || price;
            return {
                ...prev,
                pricing,
                price: monthlyPrice
            };
        });
    };

    const saveDraftRoom = () => {
        if (!draftRoom.name.trim()) {
            alert('Silakan pilih atau masukkan nama tipe kamar.');
            setRoomSubStep(1);
            return;
        }

        const monthlyPrice = draftRoom.pricing?.find(p => p.period === 'bulanan')?.price || draftRoom.price || 0;
        const finalizedRoom: RoomType = {
            ...draftRoom,
            price: monthlyPrice
        };

        const currentRooms = [...(form.roomTypes || [])];
        if (editingRoomIndex !== null && editingRoomIndex >= 0) {
            currentRooms[editingRoomIndex] = finalizedRoom;
        } else {
            currentRooms.push(finalizedRoom);
        }

        upd('roomTypes', currentRooms);
        setEditingRoomIndex(null);
        setRoomSubStep(1);
    };

    const cancelRoomDraft = () => {
        setEditingRoomIndex(null);
        setRoomSubStep(1);
    };

    const removeRoom = (i: number) => {
        upd('roomTypes', (form.roomTypes || []).filter((_, idx) => idx !== i));
        if (editingRoomIndex === i) {
            setEditingRoomIndex(null);
            setRoomSubStep(1);
        }
    };

    const toggleRoomFeature = (roomIdx: number, field: 'roomFacilities' | 'bathroomFacilities', val: string) => {
        const rooms = [...(form.roomTypes || [])];
        const text = rooms[roomIdx][field] || [];
        const nextList = text.includes(val) ? text.filter((x: string) => x !== val) : [...text, val];
        rooms[roomIdx] = { ...rooms[roomIdx], [field]: nextList };
        upd('roomTypes', rooms);
    };

    const addCustomRoomFeature = (roomIdx: number, field: 'roomFacilities' | 'bathroomFacilities', val: string) => {
        const rooms = [...(form.roomTypes || [])];
        const text = rooms[roomIdx][field] || [];
        if (!text.includes(val)) {
            rooms[roomIdx] = { ...rooms[roomIdx], [field]: [...text, val] };
            upd('roomTypes', rooms);
        }
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

            // Susun urutan foto: Bangunan Depan selalu di urutan paling awal (Cover Utama)
            const sortedNewItems = [...newPhotoItems].sort((a, b) => {
                if (a.category === 'Bangunan Depan' && b.category !== 'Bangunan Depan') return -1;
                if (a.category !== 'Bangunan Depan' && b.category === 'Bangunan Depan') return 1;
                return 0;
            });

            const uploadPayload = sortedNewItems.map(item => ({
                file: item.file,
                label: item.category,
                category: item.category
            }));

            const existingImagesWithLabels = (form.imageUrls || []).map((img: any, idx: number) => {
                const url = typeof img === 'string' ? img : (img?.original || img?.url || '');
                const label = typeof img === 'object' && (img?.label || img?.category)
                    ? (img.label || img.category)
                    : (Array.isArray(form.photoCategories) && form.photoCategories[idx] ? form.photoCategories[idx] : (idx === 0 ? 'Bangunan Depan' : 'Fasilitas Lainnya'));
                return { original: url, url, label, category: label };
            }).sort((a: any, b: any) => {
                if (a.label === 'Bangunan Depan' && b.label !== 'Bangunan Depan') return -1;
                if (a.label !== 'Bangunan Depan' && b.label === 'Bangunan Depan') return 1;
                return 0;
            });

            const totalPhotos = existingImagesWithLabels.length + uploadPayload.length;
            if (totalPhotos < 1) {
                setError('Mohon unggah minimal 1 foto kost (terutama Bangunan Depan / Fasad).');
                setStep(4);
                setSubmitting(false);
                return;
            }

            const allPhotoCategories = Array.from(new Set([
                ...existingImagesWithLabels.map((img: any) => img.label),
                ...sortedNewItems.map(item => item.category)
            ]));

            const data = { 
                ...form, 
                ...contactUpdates, 
                imageUrls: existingImagesWithLabels,
                photoCategories: allPhotoCategories,
                price: finalPrice, 
                managed_by: managementOption 
            };
            
            if (isEditing && editingKost?.id) {
                await updatePropertyWithMedia(editingKost.id, data, uploadPayload, []);
            } else {
                await addPropertyWithMedia({ ...data, isVerified: false }, uploadPayload, []);
                // Clear draft after successful creation
                try {
                    localStorage.removeItem(storageKey);
                    window.dispatchEvent(new Event('kost_draft_updated'));
                } catch {}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Provinsi" hint="Otomatis terdeteksi dari titik peta">
                            <Input placeholder="Contoh: Sulawesi Selatan / DKI Jakarta"
                                value={form.province || ''} onChange={e => upd('province', e.target.value)}
                                icon={<MapPin size={16} className="text-orange-500" />} />
                        </Field>

                        <Field label="Kota / Kabupaten" required hint="Contoh: Makassar, Jakarta Selatan">
                            <Input placeholder="Contoh: Makassar / Jakarta Selatan"
                                value={form.city || ''} onChange={e => upd('city', e.target.value)}
                                icon={<MapPin size={16} className="text-orange-500" />} />
                        </Field>
                    </div>

                    <Field label="Kecamatan / Area" hint="Contoh: Tamalanrea, Tebet, Coblong">
                        <Input placeholder="Contoh: Tamalanrea, Tebet, Coblong"
                            value={form.area || ''} onChange={e => upd('area', e.target.value)}
                            icon={<MapPin size={16} className="text-gray-400" />} />
                    </Field>

                    <Field label="Alamat Lengkap" hint="Otomatis terisi dari peta, bisa diedit manual">
                        <Textarea rows={3} placeholder="Jl. Perintis Kemerdekaan KM 10, Tamalanrea..."
                            value={form.address || ''} onChange={e => upd('address', e.target.value)} />
                    </Field>

                    {managementOption !== 'kostmanager' && (
                        <Field label="Dekat Kampus & Landmark Terdekat" hint="Otomatis terdeteksi dari titik Google Maps, bisa diedit atau ditambah manual">
                            <div className="space-y-3">
                                {isScanningLandmarks && (
                                    <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-800 text-xs font-bold animate-pulse">
                                        <Loader2 size={16} className="text-amber-500 animate-spin shrink-0" />
                                        <span>Memindai kampus, rumah sakit, mall, & fasilitas terdekat dari Google Maps...</span>
                                    </div>
                                )}

                                {(form.campuses || []).map((c, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-gray-50 p-2.5 rounded-2xl border border-gray-100 transition-all hover:border-orange-200">
                                        <div className="flex-1 space-y-2 w-full">
                                            <div className="flex gap-2 w-full">
                                                <Input placeholder="Nama kampus/landmark (Cth: UNHAS / RS Wahidin)" value={c.name}
                                                    onChange={e => { const a = [...(form.campuses||[])]; a[i]={...a[i],name:e.target.value}; upd('campuses',a); }} 
                                                    className="w-full"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => searchFacilityCoordinates('campuses', i, c.name)}
                                                    disabled={isSearchingFacility[`campuses-${i}`]}
                                                    className="bg-orange-500 text-white px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold shrink-0 hover:bg-orange-600 disabled:opacity-50"
                                                >
                                                    {isSearchingFacility[`campuses-${i}`] ? 'Mencari...' : 'Cari'}
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
                                                const walk = c.walkDuration || (() => {
                                                    const kmMatch = c.distance.match(/[\d.]+/);
                                                    return kmMatch ? `${Math.ceil((parseFloat(kmMatch[0]) / 4.2) * 60)} Mnt` : '5 Mnt';
                                                })();
                                                const moto = c.motoDuration || (() => {
                                                    const kmMatch = c.distance.match(/[\d.]+/);
                                                    return kmMatch ? `${Math.ceil((parseFloat(kmMatch[0]) / 28) * 60) + 1} Mnt` : '2 Mnt';
                                                })();
                                                const car = c.carDuration || (() => {
                                                    const kmMatch = c.distance.match(/[\d.]+/);
                                                    return kmMatch ? `${Math.ceil((parseFloat(kmMatch[0]) / 18) * 60) + 2} Mnt` : '4 Mnt';
                                                })();

                                                return (
                                                    <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 w-full mt-2 shadow-xs">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Rute Google Maps:</span>
                                                            {c.isLiveGoogleApi && (
                                                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-md border border-emerald-200/60">
                                                                    Live Rute
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                                                            <span className="flex items-center gap-1" title="Jalan Kaki">🚶 {walk}</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="flex items-center gap-1" title="Sepeda Motor">🏍️ {moto}</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="flex items-center gap-1" title="Mobil">🚗 {car}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input placeholder="Jarak" value={c.distance}
                                                onChange={e => { const a=[...(form.campuses||[])]; a[i]={...a[i],distance:e.target.value}; upd('campuses',a); }}
                                                className="!w-24 sm:!w-32 shrink-0" 
                                            />
                                            <button type="button" onClick={() => upd('campuses',(form.campuses||[]).filter((_,idx)=>idx!==i))}
                                                className="p-3 text-rose-400 hover:bg-rose-100 bg-white rounded-xl shrink-0"
                                                title="Hapus Landmark Ini">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                    <button type="button"
                                        onClick={() => upd('campuses',[...(form.campuses||[]),{name:'',distance:'',transportMode:'walk'}])}
                                        className="flex-1 h-10 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2">
                                        <Plus size={14} /> Tambah Landmark / Kampus Manual
                                    </button>

                                    {form.location?.lat && form.location?.lng && (
                                        <button type="button"
                                            onClick={() => detectNearbyLandmarks(form.location!.lat, form.location!.lng)}
                                            disabled={isScanningLandmarks}
                                            className="h-10 px-4 bg-orange-50 border border-orange-200 rounded-2xl text-xs font-bold text-orange-600 hover:bg-orange-100 transition-colors flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50">
                                            <Sparkles size={14} /> Pindai Ulang Landmark
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Field>
                    )}

                    {/* MODAL: DEDICATED FACILITY LOCATION PICKER */}
                    {activeMapPicker && (
                        <FacilityLocationModal
                            facilityName={(form[activeMapPicker.field] || [])[activeMapPicker.index]?.name || 'Landmark'}
                            initialLat={(form[activeMapPicker.field] || [])[activeMapPicker.index]?.lat}
                            initialLng={(form[activeMapPicker.field] || [])[activeMapPicker.index]?.lng}
                            kostLat={form.location?.lat}
                            kostLng={form.location?.lng}
                            cityName={form.city}
                            provinceName={form.province}
                            onSave={(lat, lng) => handleMapPickerSave(lat, lng)}
                            onClose={() => setActiveMapPicker(null)}
                        />
                    )}
                </div>
            );

            // ── STEP 2 (Langkah 3): Tipe Kamar & Harga (Bertahap & Ringkasan) ──
            case 2: {
                const roomList = form.roomTypes || [];
                const isFormOpen = editingRoomIndex !== null || roomList.length === 0;

                // ── A. TAMPILAN SUB-WIZARD BERTAHAP (Tambah / Edit Kamar) ──
                if (isFormOpen) {
                    const isNew = editingRoomIndex === null || editingRoomIndex === -1;
                    const isCustomName = !ROOM_TYPE_PRESETS.includes(draftRoom.name);
                    const activePeriods = (draftRoom.pricing || []).map(p => p.period);
                    const lowestPeriod = activePeriods.length > 0 
                        ? activePeriods.reduce((min, p) => periodWeights[p] < periodWeights[min] ? p : min, activePeriods[0]) 
                        : 'bulanan';
                    const lowestPeriodLabel = periodLabels[lowestPeriod] || 'Bulanan';

                    return (
                        <div className="space-y-5 animate-in fade-in-50 duration-200">
                            {/* Header Form Bertahap */}
                            <div className="bg-gradient-to-br from-orange-50 via-amber-50/40 to-white p-4 sm:p-5 rounded-3xl border border-orange-200/80 shadow-xs">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                                            <Bed size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                                {isNew ? 'Tambah Tipe Kamar Baru' : `Edit: ${draftRoom.name || 'Tipe Kamar'}`}
                                            </h3>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                Isi detail kamar secara bertahap (Tahap {roomSubStep} dari 3)
                                            </p>
                                        </div>
                                    </div>

                                    {roomList.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={cancelRoomDraft}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            Batal
                                        </button>
                                    )}
                                </div>

                                {/* Mini Stepper 3 Tahap */}
                                <div className="flex items-center justify-between gap-1 pt-2 border-t border-orange-100/80">
                                    {[
                                        { s: 1, label: '1. Profil & Ukuran' },
                                        { s: 2, label: '2. Kapasitas & Unit' },
                                        { s: 3, label: '3. Periode & Harga' },
                                    ].map((item, idx) => (
                                        <div key={item.s} className="flex-1 flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // Boleh kembali ke step sebelumnya, atau maju jika sudah tervalidasi
                                                    if (item.s < roomSubStep || (roomSubStep === 1 && draftRoom.name) || (roomSubStep === 2)) {
                                                        setRoomSubStep(item.s as 1 | 2 | 3);
                                                    }
                                                }}
                                                className={`flex-1 flex items-center justify-center py-2 px-1 rounded-xl text-[10px] sm:text-xs font-black transition-all text-center ${
                                                    roomSubStep === item.s
                                                        ? 'bg-orange-500 text-white shadow-xs'
                                                        : roomSubStep > item.s
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-white/60 text-gray-400 border border-gray-200/60'
                                                }`}
                                            >
                                                {roomSubStep > item.s ? '✓ ' : ''}{item.label}
                                            </button>
                                            {idx < 2 && <span className="text-gray-300 mx-1 hidden sm:inline">➔</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* KONTEN TAHAP 1: Profil & Ukuran Kamar */}
                            {roomSubStep === 1 && (
                                <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-4 sm:p-6 space-y-5 animate-in fade-in-50 duration-200">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
                                                Nama Tipe Kamar
                                            </label>
                                            <span className="text-[10px] text-gray-400 font-bold">Pilih preset</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                                            {ROOM_TYPE_PRESETS.map(preset => {
                                                const isSelected = draftRoom.name === preset;
                                                return (
                                                    <button
                                                        key={preset}
                                                        type="button"
                                                        onClick={() => updDraftRoom('name', preset)}
                                                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-orange-500 text-white shadow-xs scale-102'
                                                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                                                        }`}
                                                    >
                                                        {preset}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!isCustomName) updDraftRoom('name', '');
                                                }}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                                    isCustomName
                                                        ? 'bg-orange-500 text-white shadow-xs scale-102'
                                                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                                                }`}
                                            >
                                                + Kustom
                                            </button>
                                        </div>

                                        {isCustomName && (
                                            <div className="animate-in fade-in-50 duration-200">
                                                <input
                                                    type="text"
                                                    placeholder="Tuliskan nama tipe kamar kustom (Contoh: VIP Mezzanine, Standard AC)..."
                                                    value={draftRoom.name || ''}
                                                    onChange={e => updDraftRoom('name', e.target.value)}
                                                    className="w-full h-10 px-3.5 bg-gray-50/70 border border-orange-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-orange-500 outline-none transition-all"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
                                                Ukuran Kamar
                                            </label>
                                            <span className="text-[10px] text-gray-400 font-bold">Pilih cepat atau ketik</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {ROOM_SIZE_PRESETS.map(sp => (
                                                <button
                                                    key={sp}
                                                    type="button"
                                                    onClick={() => updDraftRoom('size', sp)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                        draftRoom.size === sp
                                                            ? 'bg-gray-900 text-white shadow-xs'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {sp}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="Contoh: 3x4 m, 4x5 m" 
                                                value={draftRoom.size || ''} 
                                                onChange={e => updDraftRoom('size', e.target.value)} 
                                                className="w-full h-10 pl-3.5 pr-9 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:border-orange-500 outline-none"
                                            />
                                            <Maximize2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>

                                    {/* Tombol Lanjut ke Tahap 2 */}
                                    <div className="pt-3 border-t border-gray-100 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!draftRoom.name?.trim()) {
                                                    alert('Mohon tentukan nama tipe kamar terlebih dahulu.');
                                                    return;
                                                }
                                                setRoomSubStep(2);
                                            }}
                                            className="h-11 px-6 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                                        >
                                            <span>Lanjut ke Kapasitas</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* KONTEN TAHAP 2: Kapasitas & Ketersediaan Kamar */}
                            {roomSubStep === 2 && (
                                <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-4 sm:p-6 space-y-5 animate-in fade-in-50 duration-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                                        {/* Kapasitas Maksimal */}
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">
                                                Maks. Kapasitas Penghuni
                                            </label>
                                            <div className="flex gap-1.5">
                                                {[1, 2, 3].map(cap => (
                                                    <button
                                                        key={cap}
                                                        type="button"
                                                        onClick={() => updDraftRoom('maxOccupants', cap)}
                                                        className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                            (draftRoom.maxOccupants || 1) === cap
                                                                ? 'bg-orange-500 text-white shadow-xs'
                                                                : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
                                                        }`}
                                                    >
                                                        {cap} Orang
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sisa Kamar */}
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">
                                                Ketersediaan Unit
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = draftRoom.availableRoomCount || 0;
                                                        if (current > 0) updDraftRoom('availableRoomCount', current - 1);
                                                    }}
                                                    className="w-9 h-9 bg-white border border-gray-200 hover:border-gray-400 rounded-xl flex items-center justify-center font-bold text-gray-700 active:scale-95 cursor-pointer"
                                                >
                                                    -
                                                </button>
                                                <div className="flex-1 text-center font-black text-sm bg-white border border-gray-200 rounded-xl h-9 flex items-center justify-center px-2">
                                                    <span className="text-gray-900">{draftRoom.availableRoomCount || 0}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold ml-1">Kamar</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = draftRoom.availableRoomCount || 0;
                                                        updDraftRoom('availableRoomCount', current + 1);
                                                    }}
                                                    className="w-9 h-9 bg-white border border-gray-200 hover:border-gray-400 rounded-xl flex items-center justify-center font-bold text-gray-700 active:scale-95 cursor-pointer"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pertanyaan Eksplisit Biaya Tambahan Penghuni > 1 Orang */}
                                    {(draftRoom.maxOccupants || 1) > 1 ? (
                                        <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2.5 animate-in fade-in-50 duration-200">
                                            <div>
                                                <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                                                    <Users size={15} className="text-amber-600" />
                                                    <span>Biaya Sewa Tambahan Penghuni</span>
                                                </div>
                                                <p className="text-[11px] text-gray-600 mt-1">
                                                    Apakah ada biaya sewa tambahan jika kamar dihuni lebih dari 1 orang?
                                                </p>
                                            </div>

                                            {/* Pilihan: Tidak / Ya */}
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setHasExtraFee(false);
                                                        updDraftRoom('additionalCostPerPerson', 0);
                                                    }}
                                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                        !hasExtraFee && (draftRoom.additionalCostPerPerson || 0) === 0
                                                            ? 'bg-gray-900 text-white shadow-xs'
                                                            : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    Tidak, Biaya Tetap Sama
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setHasExtraFee(true)}
                                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                        hasExtraFee || (draftRoom.additionalCostPerPerson || 0) > 0
                                                            ? 'bg-orange-500 text-white shadow-xs'
                                                            : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300'
                                                    }`}
                                                >
                                                    Ya, Ada Biaya Tambahan
                                                </button>
                                            </div>

                                            {/* Hint informatif bahwa nominal ditentukan di Tahap 3 */}
                                            {(hasExtraFee || (draftRoom.additionalCostPerPerson || 0) > 0) && (
                                                <p className="text-[10px] text-amber-800 font-medium bg-amber-100/60 p-2.5 rounded-xl border border-amber-200/50 animate-in fade-in-50 duration-200">
                                                    💡 Besaran nominal biaya tambahan per orang akan Anda tentukan pada langkah berikutnya (Harga Sewa).
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/70 text-[11px] text-gray-500 flex items-center gap-2">
                                            <Users size={15} className="text-gray-400 shrink-0" />
                                            <span>Kamar ini dikhususkan untuk 1 penghuni. Pilih <strong>2 Orang</strong> atau <strong>3 Orang</strong> jika ingin mengizinkan penghuni tambahan &amp; mengatur biaya tambahannya.</span>
                                        </div>
                                    )}

                                    {/* Tombol Navigasi Tahap 2 */}
                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setRoomSubStep(1)}
                                            className="h-11 px-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <ChevronLeft size={16} />
                                            <span>Kembali</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRoomSubStep(3)}
                                            className="h-11 px-6 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                                        >
                                            <span>Lanjut ke Harga</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* KONTEN TAHAP 3: Periode Sewa & Harga */}
                            {roomSubStep === 3 && (
                                <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-4 sm:p-6 space-y-5 animate-in fade-in-50 duration-200">
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
                                                Periode Sewa yang Ditawarkan
                                            </label>
                                            <span className="text-[10px] text-gray-400 font-bold">Pilih minimal 1 periode</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mb-2.5">
                                            Aktifkan periode sewa yang tersedia untuk tipe kamar ini (Bulanan aktif otomatis).
                                        </p>

                                        {/* Chips Pilihan Periode */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {PRICING_PERIODS.map(({ key, label }) => {
                                                const isActive = (draftRoom.pricing || []).some(p => p.period === key);
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => toggleDraftRoomPricingPeriod(key)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                            isActive
                                                                ? 'bg-orange-500 text-white shadow-xs'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                                                        }`}
                                                    >
                                                        <span>{isActive ? '✓' : '+'}</span>
                                                        <span>{label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Input Kolom Harga Hanya untuk Periode yang Aktif */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        {PRICING_PERIODS.filter(({ key }) => (draftRoom.pricing || []).some(p => p.period === key)).map(({ key, label }) => {
                                            const val = draftRoom.pricing?.find(p => p.period === key)?.price || '';
                                            const isMonthly = key === 'bulanan';

                                            return (
                                                <div 
                                                    key={key} 
                                                    className={`p-3.5 rounded-2xl border transition-all ${
                                                        isMonthly 
                                                            ? 'bg-orange-50/40 border-orange-200 ring-1 ring-orange-200' 
                                                            : 'bg-gray-50 border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[11px] font-black text-gray-800 flex items-center gap-1.5">
                                                            <DollarSign size={13} className={isMonthly ? 'text-orange-600' : 'text-gray-400'} />
                                                            <span>Harga Sewa {label}</span>
                                                            {isMonthly && (
                                                                <span className="px-1.5 py-0.5 bg-orange-200 text-orange-800 text-[8px] font-black uppercase rounded-md">
                                                                    Utama
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                                            Rp
                                                        </span>
                                                        <input 
                                                            type="text" 
                                                            inputMode="numeric"
                                                            placeholder="0"
                                                            value={val !== '' && val !== 0 ? formatCurrencyInput(val) : ''}
                                                            onChange={e => updDraftRoomPrice(key, parseCurrencyInput(e.target.value))}
                                                            className="w-full h-10 pl-9 pr-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" 
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Input Nominal Biaya Tambahan Penghuni (Ditampilkan Terpadu di Tahap Harga) */}
                                    {(hasExtraFee || (draftRoom.additionalCostPerPerson || 0) > 0) && (
                                        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2 animate-in fade-in-50 duration-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                                                    <Users size={15} className="text-amber-600" />
                                                    <span>Biaya Tambahan Penghuni Ekstra (&gt; 1 Orang)</span>
                                                </div>
                                                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[9px] font-black uppercase rounded-md">
                                                    Per Orang / Bulan
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-600">
                                                Ditagihkan per orang tambahan jika kamar diisi oleh lebih dari 1 penghuni.
                                            </p>
                                            <div className="relative w-full sm:w-72 pt-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                                    Rp
                                                </span>
                                                <input 
                                                    type="text" 
                                                    inputMode="numeric"
                                                    placeholder="Contoh: 50.000" 
                                                    value={draftRoom.additionalCostPerPerson ? formatCurrencyInput(draftRoom.additionalCostPerPerson) : ''} 
                                                    onChange={e => updDraftRoom('additionalCostPerPerson', parseCurrencyInput(e.target.value))} 
                                                    className="w-full h-10 bg-white border border-gray-300 rounded-xl pl-9 pr-3 text-sm font-black text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Tombol Simpan Tipe Kamar */}
                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setRoomSubStep(2)}
                                            className="h-11 px-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <ChevronLeft size={16} />
                                            <span>Kembali</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={saveDraftRoom}
                                            className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
                                        >
                                            <CheckCircle2 size={16} />
                                            <span>Simpan Tipe Kamar</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }

                // ── B. TAMPILAN RINGKASAN KARTU TIPE KAMAR (Summary View) ──
                return (
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <Bed className="w-5 h-5 text-orange-600" />
                                <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm sm:text-base">
                                    Tipe Kamar &amp; Harga
                                </h3>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Kelola daftar tipe kamar yang tersedia. Anda dapat menambah, mengedit, atau menghapus tipe kamar.
                            </p>
                        </div>

                        {/* Daftar Kartu Ringkasan Kamar Tersimpan */}
                        <div className="space-y-3.5">
                            {roomList.map((room, ri) => {
                                const activePricing = (room.pricing || []).filter(p => p.price > 0);
                                const monthlyPrice = room.pricing?.find(p => p.period === 'bulanan')?.price || room.price || 0;

                                return (
                                    <div 
                                        key={ri} 
                                        className="bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-sm p-4 sm:p-5 transition-all space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-sm shrink-0">
                                                    #{ri + 1}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-gray-900 text-sm sm:text-base">
                                                            {room.name || `Tipe Kamar #${ri + 1}`}
                                                        </h4>
                                                        {room.size && (
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg">
                                                                {room.size}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                                                        <span className="flex items-center gap-1 font-medium">
                                                            <Users size={13} className="text-gray-400" />
                                                            <span>Maks. {room.maxOccupants || 1} Orang</span>
                                                        </span>
                                                        <span>•</span>
                                                        <span className={`font-bold ${room.isAvailable !== false && (room.availableRoomCount || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {room.isAvailable !== false && (room.availableRoomCount || 0) > 0 
                                                                ? `${room.availableRoomCount} Kamar Tersedia` 
                                                                : 'Kamar Penuh'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tombol Edit & Hapus */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditRoom(ri)}
                                                    className="h-8 px-3 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoom(ri)}
                                                    className="w-8 h-8 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                                                    title="Hapus kamar ini"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Bagian Harga Ringkas */}
                                        <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                    Tarif Pokok
                                                </span>
                                                <span className="text-sm sm:text-base font-black text-orange-600">
                                                    {monthlyPrice > 0 
                                                        ? `Rp ${monthlyPrice.toLocaleString('id-ID')} / Bulan`
                                                        : 'Belum menetapkan harga bulanan'}
                                                </span>
                                            </div>

                                            {/* Periode Tambahan Lainnya yang Aktif */}
                                            {activePricing.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {activePricing.filter(p => p.period !== 'bulanan').map(p => (
                                                        <span key={p.period} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-bold rounded-lg">
                                                            {periodLabels[p.period]}: Rp {p.price.toLocaleString('id-ID')}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Tombol Tambah Kamar Baru Lainnya */}
                        <button 
                            type="button" 
                            onClick={startAddRoom}
                            className="w-full h-20 border-2 border-dashed border-orange-200 hover:border-orange-400 bg-orange-50/20 hover:bg-orange-50/50 rounded-3xl flex items-center justify-center gap-2 transition-all text-orange-600 cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus size={18}/>
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider">+ Tambah Tipe Kamar Lainnya</span>
                        </button>

                        {/* Info Pemandu Langkah Berikutnya */}
                        <div className="p-3.5 bg-orange-50/60 rounded-2xl border border-orange-100 text-[11px] text-orange-900 flex items-center gap-2 font-medium">
                            <Sparkles size={16} className="text-orange-500 shrink-0" />
                            <span>Seluruh fasilitas kamar tidur &amp; kamar mandi serta foto untuk tipe-tipe di atas akan diatur di <strong>Langkah 4 (Fasilitas)</strong> dan <strong>Langkah 5 (Foto)</strong>.</span>
                        </div>
                    </div>
                );
            }

            // ── STEP 3 (Langkah 4): Fasilitas Properti & Kamar Dinamis ───────────
            case 3: return (
                <div className="space-y-6">
                    {/* Bagian 1: Fasilitas Umum / Gedung */}
                    <div className="space-y-4">
                        <Field label="Fasilitas Gedung / Umum" hint="Pilih preset fasilitas bersama atau tambahkan fasilitas kustom">
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

                    {/* Bagian 2: Fasilitas Kamar per Tipe Kamar (Dinamis) */}
                    <div className="pt-5 border-t border-gray-200 space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                <Bed size={18} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Fasilitas per Tipe Kamar</h4>
                                <p className="text-xs text-gray-500">Tentukan fasilitas kamar tidur &amp; kamar mandi untuk masing-masing tipe kamar yang telah dibuat.</p>
                            </div>
                        </div>

                        {(form.roomTypes || []).length === 0 ? (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-3">
                                <AlertCircle size={18} className="shrink-0 text-amber-600" />
                                <span>Belum ada tipe kamar yang terdata. Silakan klik tombol <strong>Kembali</strong> ke Langkah 3 untuk menambahkan tipe kamar terlebih dahulu.</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(form.roomTypes || []).map((room, ri) => (
                                    <div key={ri} className="bg-white rounded-3xl border border-orange-200/90 p-4 sm:p-5 space-y-4 shadow-xs">
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider">
                                                    {room.name || `Tipe Kamar ${ri + 1}`}
                                                </span>
                                                {room.size && (
                                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                                                        Ukuran: {room.size}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                Tipe #{ri + 1}
                                            </span>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <span>🛏️</span> Fasilitas Kamar Tidur ({room.name || `Tipe ${ri+1}`})
                                            </p>
                                            <FacilityInput
                                                selected={room.roomFacilities || []}
                                                presets={ROOM_AMENITIES}
                                                onToggle={f => toggleRoomFeature(ri, 'roomFacilities', f)}
                                                onAdd={f => addCustomRoomFeature(ri, 'roomFacilities', f)}
                                                onRemove={f => toggleRoomFeature(ri, 'roomFacilities', f)}
                                                placeholder="Contoh: Sofa, Balkon, Kulkas Mini..."
                                            />
                                        </div>

                                        <div className="pt-3 border-t border-gray-100">
                                            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <span>🚿</span> Fasilitas Kamar Mandi ({room.name || `Tipe ${ri+1}`})
                                            </p>
                                            <FacilityInput
                                                selected={room.bathroomFacilities || []}
                                                presets={BATH_AMENITIES}
                                                onToggle={f => toggleRoomFeature(ri, 'bathroomFacilities', f)}
                                                onAdd={f => addCustomRoomFeature(ri, 'bathroomFacilities', f)}
                                                onRemove={f => toggleRoomFeature(ri, 'bathroomFacilities', f)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );

            // ── STEP 4 (Langkah 5): Foto Properti & Kamar Dinamis ────────────────
            case 4: {
                // 1. Kategori Area Umum Pokok
                const dynamicGeneralCategories: PublicPhotoCategoryDef[] = [
                    { id: 'Bangunan Depan', label: 'Bangunan Depan (Fasad)', desc: 'Tampak depan gedung & jalan akses (Cover Utama)', required: true },
                    { id: 'Koridor', label: 'Koridor & Akses Masuk', desc: 'Lorong antar kamar, tangga, atau pintu masuk utama' },
                    { id: 'Lingkungan', label: 'Lingkungan Sekitar', desc: 'Suasana jalan dan lingkungan di sekitar kost' },
                ];

                // 2. Kategori Area Umum Dinamis (Berdasarkan Fasilitas Gedung yang Dipilih)
                const currentFacilities = form.facilities || [];
                if (currentFacilities.some(f => /parkir/i.test(f))) {
                    dynamicGeneralCategories.push({ id: 'Area Parkir', label: 'Area Parkir', desc: 'Tempat parkir motor atau mobil penghuni' });
                }
                if (currentFacilities.some(f => /dapur/i.test(f))) {
                    dynamicGeneralCategories.push({ id: 'Dapur Bersama', label: 'Dapur Bersama', desc: 'Area memasak bersama, wastafel, & kompor' });
                }
                if (currentFacilities.some(f => /(wc|toilet|kamar mandi)/i.test(f))) {
                    dynamicGeneralCategories.push({ id: 'WC Umum', label: 'WC Umum / Luar', desc: 'Kamar mandi luar untuk fasilitas bersama' });
                }
                if (currentFacilities.some(f => /(tamu|santai|bersama)/i.test(f))) {
                    dynamicGeneralCategories.push({ id: 'Ruang Tamu', label: 'Ruang Tamu & Bersama', desc: 'Ruang santai atau ruang tamu penerima kunjungan' });
                }
                if (currentFacilities.some(f => /(laundry|cuci|jemur)/i.test(f))) {
                    dynamicGeneralCategories.push({ id: 'Area Laundry', label: 'Area Laundry & Jemuran', desc: 'Tempat mencuci dan menjemur pakaian' });
                }

                // Fasilitas umum kustom yang diinput mitra otomatis jadi kategori foto
                const customGeneralFacilities = currentFacilities.filter(f => !BUILDING_FACILITIES.includes(f));
                customGeneralFacilities.forEach(cg => {
                    if (!dynamicGeneralCategories.some(c => c.id.toLowerCase() === cg.toLowerCase())) {
                        dynamicGeneralCategories.push({ id: cg, label: cg, desc: `Dokumentasi fasilitas ${cg}` });
                    }
                });

                // Tambahkan kategori kustom tambahan dari user
                customCategories.forEach(cc => {
                    if (!dynamicGeneralCategories.some(c => c.id.toLowerCase() === cc.toLowerCase())) {
                        dynamicGeneralCategories.push({ id: cc, label: cc, desc: `Foto area ${cc} properti` });
                    }
                });

                // 3. Kategori Kamar Dinamis (Berdasarkan Tipe Kamar & Fasilitasnya)
                const dynamicRoomCategories: PublicPhotoCategoryDef[] = [];
                (form.roomTypes || []).forEach((room, ri) => {
                    const roomName = room.name || `Tipe Kamar ${ri + 1}`;
                    dynamicRoomCategories.push({
                        id: `Kamar: ${roomName}`,
                        label: `Kamar: ${roomName}`,
                        desc: `Foto interior tempat tidur & suasana ${roomName}`
                    });

                    // Cek jika tipe kamar ini punya kamar mandi dalam
                    const hasInsideBath = (room.bathroomFacilities || []).some((f: string) => /dalam/i.test(f));
                    if (hasInsideBath) {
                        dynamicRoomCategories.push({
                            id: `Kamar Mandi: ${roomName}`,
                            label: `KM Dalam: ${roomName}`,
                            desc: `Foto kamar mandi dalam untuk ${roomName}`
                        });
                    }
                });

                const allActiveCategories = [...dynamicGeneralCategories, ...dynamicRoomCategories];

                const existingWithCats = (form.imageUrls || []).map((img: any, idx: number) => {
                    const src = typeof img === 'string' ? img : (img?.original || img?.url || '');
                    let cat = 'Bangunan Depan';
                    if (typeof img === 'object' && (img.label || img.category)) {
                        cat = img.label || img.category;
                    } else if (Array.isArray(form.photoCategories) && form.photoCategories[idx]) {
                        cat = form.photoCategories[idx];
                    } else if (idx > 0) {
                        cat = 'Fasilitas Lainnya';
                    }
                    return { src, cat, raw: img, idx };
                }).filter(p => !!p.src);

                const totalAllPhotos = existingWithCats.length + newPhotoItems.length;
                const hasFrontCover = existingWithCats.some(p => p.cat === 'Bangunan Depan') || newPhotoItems.some(p => p.category === 'Bangunan Depan');

                return (
                    <div className="space-y-6">
                        {/* Header Ringkasan Media */}
                        <div className="bg-gradient-to-br from-orange-50 via-amber-50/50 to-white p-4 sm:p-5 rounded-3xl border border-orange-200/80 shadow-xs">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Camera className="w-5 h-5 text-orange-600" />
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                                            Dokumentasi Foto Properti &amp; Kamar
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Daftar foto otomatis menyesuaikan dengan fasilitas umum dan tipe kamar yang Anda pilih.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-white border border-orange-200 text-orange-600 rounded-full text-xs font-black shadow-xs">
                                        📸 {totalAllPhotos} Foto Terpilih
                                    </span>
                                </div>
                            </div>

                            {/* Status Cover Alert */}
                            {!hasFrontCover && (
                                <div className="mt-3 flex items-center gap-2 bg-amber-100/70 border border-amber-300/80 text-amber-900 text-xs px-3 py-2 rounded-xl">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span><strong>Perhatian:</strong> Mohon unggah minimal 1 foto pada <strong>Bangunan Depan (Fasad)</strong> untuk dijadikan foto Cover Utama kost Anda.</span>
                                </div>
                            )}
                        </div>

                        {/* SECTION A: Foto Area & Fasilitas Umum */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Home className="w-4 h-4 text-orange-600" />
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Area Gedung &amp; Fasilitas Umum</h4>
                            </div>

                            {dynamicGeneralCategories.map(cat => {
                                const currentCatExisting = existingWithCats.filter(p => p.cat === cat.id);
                                const currentCatNew = newPhotoItems.filter(p => p.category === cat.id);
                                const catPhotosCount = currentCatExisting.length + currentCatNew.length;
                                const isFront = cat.id === 'Bangunan Depan';

                                return (
                                    <div 
                                        key={cat.id} 
                                        className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                                            catPhotosCount > 0 
                                                ? 'bg-white border-orange-200 shadow-xs' 
                                                : isFront 
                                                    ? 'bg-orange-50/20 border-dashed border-orange-300' 
                                                    : 'bg-white border-gray-200/80'
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                            <div className="flex items-start gap-2.5">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                    isFront ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                                                }`}>
                                                    {isFront ? <Home size={16} /> :
                                                     cat.id === 'Koridor' ? <Navigation size={16} /> :
                                                     cat.id === 'Area Parkir' ? <MapPin size={16} /> :
                                                     cat.id === 'WC Umum' ? <Droplets size={16} /> :
                                                     cat.id === 'Lingkungan' ? <Sparkles size={16} /> :
                                                     <Camera size={16} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs sm:text-sm font-black text-gray-900">
                                                            {cat.label}
                                                        </span>
                                                        {isFront && (
                                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-black uppercase rounded-md tracking-wider">
                                                                Cover Utama
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        {cat.desc}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                                catPhotosCount > 0 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                    : isFront 
                                                        ? 'bg-amber-100 text-amber-800' 
                                                        : 'bg-gray-100 text-gray-400'
                                            }`}>
                                                {catPhotosCount} Foto
                                            </span>
                                        </div>

                                        {/* Grid Foto Kategori Ini */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {currentCatExisting.map((p, idx) => (
                                                <div key={`existing-${idx}`} className="aspect-square rounded-2xl overflow-hidden border border-gray-200 relative group bg-gray-50">
                                                    <img src={p.src} alt={cat.label} className="w-full h-full object-cover" />
                                                    {isFront && idx === 0 && (
                                                        <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                                                            Cover
                                                        </span>
                                                    )}
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeExistingImage(p.raw)}
                                                        className="absolute top-1.5 right-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-md transition-all active:scale-90"
                                                        title="Hapus foto ini"
                                                    >
                                                        &times;
                                                    </button>
                                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-1 px-1.5 text-[9px] text-white font-bold text-center truncate">
                                                        {cat.label}
                                                    </div>
                                                </div>
                                            ))}

                                            {currentCatNew.map((item) => (
                                                <div key={item.id} className="aspect-square rounded-2xl overflow-hidden border-2 border-orange-400 relative group bg-gray-50 shadow-xs animate-in zoom-in-95 duration-200">
                                                    <img src={item.preview} alt={cat.label} className="w-full h-full object-cover" />
                                                    <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                                                        Baru
                                                    </span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeNewPhotoItem(item.id)}
                                                        className="absolute top-1.5 right-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-md transition-all active:scale-90"
                                                        title="Hapus foto ini"
                                                    >
                                                        &times;
                                                    </button>
                                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-1 px-1.5 text-[9px] text-white font-bold text-center truncate">
                                                        {cat.label}
                                                    </div>
                                                </div>
                                            ))}

                                            <label className="aspect-square border-2 border-dashed border-orange-200 hover:border-orange-500 bg-orange-50/40 hover:bg-orange-50/80 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all gap-1.5 p-3 text-center group">
                                                <input 
                                                    type="file" 
                                                    multiple 
                                                    accept="image/*" 
                                                    className="hidden" 
                                                    onChange={e => {
                                                        handleCategoryFilesUpload(cat.id, e.target.files);
                                                        e.target.value = '';
                                                    }} 
                                                />
                                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Plus size={18} />
                                                </div>
                                                <span className="text-[11px] font-black text-orange-600 group-hover:underline">
                                                    + Tambah Foto
                                                </span>
                                                <span className="text-[9px] text-gray-400 font-medium">
                                                    Pilih dari Galeri
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* SECTION B: Foto per Tipe Kamar Dinamis */}
                        {dynamicRoomCategories.length > 0 && (
                            <div className="pt-4 border-t border-gray-200 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Bed className="w-4 h-4 text-orange-600" />
                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Foto Tipe Kamar Tidur &amp; Kamar Mandi Dalam</h4>
                                </div>

                                {dynamicRoomCategories.map(cat => {
                                    const currentCatExisting = existingWithCats.filter(p => p.cat === cat.id);
                                    const currentCatNew = newPhotoItems.filter(p => p.category === cat.id);
                                    const catPhotosCount = currentCatExisting.length + currentCatNew.length;
                                    const isBathroom = cat.id.startsWith('Kamar Mandi:');

                                    return (
                                        <div 
                                            key={cat.id} 
                                            className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                                                catPhotosCount > 0 
                                                    ? 'bg-white border-orange-200 shadow-xs' 
                                                    : 'bg-white border-gray-200/80'
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                                <div className="flex items-start gap-2.5">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                        isBathroom ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                                    }`}>
                                                        {isBathroom ? <Droplets size={16} /> : <Bed size={16} />}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs sm:text-sm font-black text-gray-900">
                                                            {cat.label}
                                                        </span>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                                            {cat.desc}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                                    catPhotosCount > 0 
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                        : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {catPhotosCount} Foto
                                                </span>
                                            </div>

                                            {/* Grid Foto Kategori Kamar Ini */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                {currentCatExisting.map((p, idx) => (
                                                    <div key={`existing-${idx}`} className="aspect-square rounded-2xl overflow-hidden border border-gray-200 relative group bg-gray-50">
                                                        <img src={p.src} alt={cat.label} className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeExistingImage(p.raw)}
                                                            className="absolute top-1.5 right-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-md transition-all active:scale-90"
                                                            title="Hapus foto ini"
                                                        >
                                                            &times;
                                                        </button>
                                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-1 px-1.5 text-[9px] text-white font-bold text-center truncate">
                                                            {cat.label}
                                                        </div>
                                                    </div>
                                                ))}

                                                {currentCatNew.map((item) => (
                                                    <div key={item.id} className="aspect-square rounded-2xl overflow-hidden border-2 border-orange-400 relative group bg-gray-50 shadow-xs animate-in zoom-in-95 duration-200">
                                                        <img src={item.preview} alt={cat.label} className="w-full h-full object-cover" />
                                                        <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                                                            Baru
                                                        </span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeNewPhotoItem(item.id)}
                                                            className="absolute top-1.5 right-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-md transition-all active:scale-90"
                                                            title="Hapus foto ini"
                                                        >
                                                            &times;
                                                        </button>
                                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-1 px-1.5 text-[9px] text-white font-bold text-center truncate">
                                                            {cat.label}
                                                        </div>
                                                    </div>
                                                ))}

                                                <label className="aspect-square border-2 border-dashed border-orange-200 hover:border-orange-500 bg-orange-50/40 hover:bg-orange-50/80 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all gap-1.5 p-3 text-center group">
                                                    <input 
                                                        type="file" 
                                                        multiple 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        onChange={e => {
                                                            handleCategoryFilesUpload(cat.id, e.target.files);
                                                            e.target.value = '';
                                                        }} 
                                                    />
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Plus size={18} />
                                                    </div>
                                                    <span className="text-[11px] font-black text-orange-600 group-hover:underline">
                                                        + Tambah Foto
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 font-medium">
                                                        Pilih dari Galeri
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Tambah Kategori Kustom Tambahan */}
                        <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row gap-2.5 items-center">
                            <input 
                                type="text"
                                placeholder="Tambah kategori foto lainnya (Cth: Rooftop, Kolam Renang, Balkon)..."
                                value={newCategoryInput}
                                onChange={e => setNewCategoryInput(e.target.value)}
                                className="w-full h-10 px-3.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium"
                            />
                            <button 
                                type="button"
                                onClick={() => {
                                    const trimmed = newCategoryInput.trim();
                                    if (!trimmed) return;
                                    if (!customCategories.includes(trimmed) && !allActiveCategories.some(c => c.id.toLowerCase() === trimmed.toLowerCase())) {
                                        setCustomCategories(prev => [...prev, trimmed]);
                                    }
                                    setNewCategoryInput('');
                                }}
                                className="w-full sm:w-auto h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer"
                            >
                                + Kategori
                            </button>
                        </div>
                    </div>
                );
            }

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
                    <div className="flex items-center gap-2">
                        <h2 className="font-black text-gray-900 text-base">{isEditing ? 'Edit Listing' : 'Tambah Kost Baru'}</h2>
                        {!isEditing && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-[9px] font-bold text-emerald-700">
                                <CheckCircle2 size={10} className="text-emerald-500" />
                                <span>Draft Aktif</span>
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Langkah {step + 1} dari {activeSteps.length}</p>
                </div>
                <button 
                    onClick={onClose} 
                    className="w-10 h-10 rounded-2xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                    title="Tutup Formulir (Draft Tersimpan Otomatis)"
                >
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
