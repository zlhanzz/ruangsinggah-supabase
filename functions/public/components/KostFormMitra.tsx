import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Kost, RoomType, PricingPeriod } from '../types';
import { addPropertyWithMedia, updatePropertyWithMedia } from '../adminService';
import { findNearbyCuratedLandmarks } from '../constants/curatedLandmarks';
import {
    X, ChevronRight, ChevronLeft, Camera, Video, MapPin, Home, Wifi,
    Plus, Trash2, Check, AlertCircle, Loader2, Upload, Image as ImageIcon,
    Phone, BookOpen, DollarSign, Search, Navigation, ShieldCheck, User, Maximize2,
    Crosshair, CheckCircle2, Sparkles, LocateFixed, FileText, RotateCcw, Save
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

            // Auto-resolve geocoding gerbang jika koordinat awal kosong
            if (!hasValidInitial && facilityName) {
                const geocoder = new google.maps.Geocoder();
                const cityCtx = cityName ? `, ${cityName}` : '';
                const queryStr = `${facilityName}${cityCtx}, Indonesia`;
                geocoder.geocode({ address: queryStr, componentRestrictions: { country: 'ID' } }, (results: any[], status: string) => {
                    if (status === 'OK' && results && results.length > 0) {
                        const loc = results[0].geometry.location;
                        const plat = loc.lat(), plng = loc.lng();
                        setSelectedLocation({ lat: plat, lng: plng });
                        landmarkMarker.setPosition({ lat: plat, lng: plng });
                        map.setCenter({ lat: plat, lng: plng });
                        map.setZoom(17);
                        updatePolyline(plat, plng);
                    }
                });
            }
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
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">Geser penanda merah atau cari gerbang spesifik di peta</p>
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
                            placeholder={`Cari gerbang / gedung spesifik (Cth: Pintu 1 ${facilityName || ''})...`}
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

                {/* Footer */}
                <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center gap-3 shrink-0">
                    <div className="text-[11px] font-mono font-bold text-gray-500 hidden sm:block">
                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => onSave(selectedLocation.lat, selectedLocation.lng)}
                            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                            <Check size={16} />
                            Gunakan Titik Gerbang Ini
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
const KostFormMitra: React.FC<KostFormMitraProps> = ({ user, editingKost, onClose, onSuccess }) => {
    const isEditing = !!editingKost?.id;
    const storageKey = getDraftStorageKey(user?.id || user?.uid);

    // Initial state loader with Draft support
    const [step, setStep] = useState<number>(() => {
        if (isEditing) return 0;
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
        if (isEditing) return null;
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

    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [tempRule, setTempRule] = useState('');
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
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

        // 4. Scan Fasilitas Harian Mikro: Minimarket / Supermarket Terdekat (Radius 2 KM)
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
                .slice(0, 2);
        });

        // 5. Scan Fasilitas Harian Mikro: Laundry Kiloan Terdekat (Radius 2 KM)
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

        // 6. Scan Fasilitas Harian Mikro: Tempat Ibadah Terdekat (Radius 2 KM)
        const scanWorship = performSearch({
            location: centerLatLng,
            radius: 2000,
            type: 'place_of_worship',
            keyword: 'masjid|musholla|gereja'
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

        // 7. Scan Fasilitas Medis: Rumah Sakit Terdekat (Hanya jika belum ada di curated master)
        const hasCuratedHospital = curatedOthers.some(o => o.name.toLowerCase().includes('rs') || o.name.toLowerCase().includes('rumah sakit'));
        const scanHospitalFallback = hasCuratedHospital
            ? Promise.resolve([])
            : performSearch({
                location: centerLatLng,
                radius: 5000,
                type: 'hospital',
                keyword: 'rumah sakit|rsup|rsud|klinik'
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

        // 8. Scan Mall Terdekat (Hanya jika belum ada di curated master)
        const hasCuratedMall = curatedOthers.some(o => o.name.toLowerCase().includes('mall') || o.name.toLowerCase().includes('park') || o.name.toLowerCase().includes('square'));
        const scanMallFallback = hasCuratedMall
            ? Promise.resolve([])
            : performSearch({
                location: centerLatLng,
                radius: 7000,
                type: 'shopping_mall',
                keyword: 'mall|plaza|square|trade center'
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

        Promise.all([
            scanCampusesFallback,
            scanMinimarket,
            scanLaundry,
            scanWorship,
            scanHospitalFallback,
            scanMallFallback
        ]).then(([fallbackCampuses, minimarketList, laundryList, worshipList, fallbackHospitals, fallbackMalls]) => {
            if (landmarkScanAbortRef.current !== scanId) return;
            setIsScanningLandmarks(false);

            // 1. Kampus Terdekat (Jika ada Master Dataset, 100% MURNI DARI MASTER DATASET TANPA BERCAMPUR DENGAN GOOGLE PLACES!)
            const finalCampuses = curatedCampuses.length > 0 
                ? [...curatedCampuses] 
                : [...fallbackCampuses];

            // 2. Gabungkan fasilitas harian mikro & anchor regional
            const finalFacilities = [
                ...curatedOthers,
                ...fallbackMalls,
                ...fallbackHospitals,
                ...minimarketList,
                ...laundryList,
                ...worshipList
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
            }
        }).catch(() => {
            if (landmarkScanAbortRef.current === scanId) {
                setIsScanningLandmarks(false);
            }
        });
    }, [isInvalidCampus]);

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
                // Clear draft after successful creation
                try {
                    localStorage.removeItem(storageKey);
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
                                                const kmMatch = c.distance.match(/[\d.]+/);
                                                if (kmMatch) {
                                                    const km = parseFloat(kmMatch[0]);
                                                    const walk = Math.ceil((km / 5) * 60);
                                                    const moto = Math.ceil((km / 30) * 60) + 2;
                                                    const car = Math.ceil((km / 20) * 60) + 5;
                                                    return (
                                                        <div className="flex flex-wrap items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 w-full mt-2">
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

            {/* Restored Draft Notice Banner */}
            {restoredDraftInfo && !isEditing && (
                <div className="mx-5 mt-3 p-3 bg-gradient-to-r from-amber-50/90 to-orange-50/90 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                            <FileText size={16} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-black text-gray-800 truncate">Melanjutkan Draft Pengisian</p>
                            <p className="text-[10px] font-bold text-gray-500 truncate">
                                Progres sebelumnya tersimpan otomatis • Langkah {step + 1} ({activeSteps[step]?.label})
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClearDraft}
                        className="px-3 py-1.5 bg-white border border-gray-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-[11px] font-bold text-gray-600 transition-all shrink-0 shadow-xs flex items-center gap-1.5"
                    >
                        <RotateCcw size={12} />
                        <span>Mulai Baru</span>
                    </button>
                </div>
            )}

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
