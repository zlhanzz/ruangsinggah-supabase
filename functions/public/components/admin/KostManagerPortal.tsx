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
    Navigation,
    ChevronUp,
    ChevronDown,
    ParkingCircle,
    Wind,
    Tv,
    Armchair,
    Droplets,
    Edit3,
    FolderOpen,
    Upload
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

const detectProvinceFromAddress = (addr: string): string => {
    if (!addr) return 'Sulawesi Selatan';
    const clean = addr.toLowerCase();
    if (clean.includes('sulawesi selatan') || clean.includes('sulsel') || clean.includes('makassar') || clean.includes('gowa') || clean.includes('maros')) return 'Sulawesi Selatan';
    if (clean.includes('sulawesi barat') || clean.includes('sulbar') || clean.includes('mamuju') || clean.includes('polewali')) return 'Sulawesi Barat';
    if (clean.includes('sulawesi tengah') || clean.includes('sulteng') || clean.includes('palu')) return 'Sulawesi Tengah';
    if (clean.includes('sulawesi utara') || clean.includes('sulut') || clean.includes('manado')) return 'Sulawesi Utara';
    if (clean.includes('sulawesi tenggara') || clean.includes('sultra') || clean.includes('kendari')) return 'Sulawesi Tenggara';
    if (clean.includes('gorontalo')) return 'Gorontalo';
    if (clean.includes('dki jakarta') || clean.includes('jakarta')) return 'DKI Jakarta';
    if (clean.includes('jawa barat') || clean.includes('bandung') || clean.includes('bogor') || clean.includes('depok') || clean.includes('bekasi')) return 'Jawa Barat';
    if (clean.includes('jawa tengah') || clean.includes('semarang') || clean.includes('solo') || clean.includes('surakarta')) return 'Jawa Tengah';
    if (clean.includes('di yogyakarta') || clean.includes('yogyakarta') || clean.includes('jogja') || clean.includes('sleman') || clean.includes('bantul')) return 'DI Yogyakarta';
    if (clean.includes('jawa timur') || clean.includes('surabaya') || clean.includes('malang')) return 'Jawa Timur';
    if (clean.includes('bali') || clean.includes('denpasar')) return 'Bali';
    return 'Sulawesi Selatan';
};

const normalizePhotosWithLabels = (imgUrls: any[]): { url: string; label: string }[] => {
    if (!imgUrls || !Array.isArray(imgUrls)) return [];
    return imgUrls.map((img: any, idx: number) => {
        if (typeof img === 'string') {
            const defaultLabel = idx === 0 ? 'Fasad Bangunan Depan' : idx === 1 ? 'Area Parkir' : idx === 2 ? 'Koridor & Akses Masuk' : idx === 3 ? 'Dapur Bersama' : `Foto #${idx + 1}`;
            return { url: img, label: defaultLabel };
        }
        const defaultLabel = idx === 0 ? 'Fasad Bangunan Depan' : idx === 1 ? 'Area Parkir' : idx === 2 ? 'Koridor & Akses Masuk' : idx === 3 ? 'Dapur Bersama' : `Foto #${idx + 1}`;
        return {
            url: img?.original || img?.url || img?.photo_url || '',
            label: img?.label || defaultLabel
        };
    }).filter(item => Boolean(item.url));
};

// Client-Side WebP Compression Helper (Standard Baku Workspace Rule #5)
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

const DEFAULT_GLOBAL_ROOM_PHOTO_SLOTS = ['Interior Kamar', 'Kamar Mandi Dalam', 'Tempat Tidur', 'Lemari / Penyimpanan'];

const getRoomPhotosGlobal = (room: any): { url: string; label: string }[] => {
    if (!room) return [];
    const result: { url: string; label: string }[] = [];

    // 1. Dari categorizedPhotos
    if (room.categorizedPhotos && typeof room.categorizedPhotos === 'object') {
        const catMap: Record<string, string> = {
            interior: 'Interior Kamar',
            kasur: 'Tempat Tidur',
            wc: 'Kamar Mandi',
            jendela: 'Jendela Luar'
        };
        Object.keys(room.categorizedPhotos).forEach(k => {
            const list = room.categorizedPhotos[k];
            if (Array.isArray(list)) {
                list.forEach(item => {
                    const url = typeof item === 'string' ? item : (item?.url || item?.original || '');
                    if (url && !result.some(p => p.url === url)) {
                        result.push({ url, label: catMap[k] || k });
                    }
                });
            }
        });
    }

    // 2. Dari raw images, image_urls, photos
    const rawImages = room.images || room.image_urls || room.photos || [];
    if (Array.isArray(rawImages)) {
        rawImages.forEach((img: any, imgIdx: number) => {
            const url = typeof img === 'string' ? img : (img?.url || img?.original || '');
            if (url && !result.some(p => p.url === url)) {
                let label = '';
                if (room.photoCategories?.[imgIdx]) label = room.photoCategories[imgIdx];
                else if (typeof img === 'object' && img?.label) label = img.label;
                else if (imgIdx < DEFAULT_GLOBAL_ROOM_PHOTO_SLOTS.length) label = DEFAULT_GLOBAL_ROOM_PHOTO_SLOTS[imgIdx];
                else label = `Foto #${imgIdx + 1}`;
                label = label.replace(/\s*\*Wajib/i, '').replace(/\(Opsional\)/i, '').trim();
                result.push({ url, label });
            }
        });
    }

    return result;
};

const formatRoomNameGlobal = (name: string, idx: number): string => {
    if (!name) return `Kamar ${idx + 1}`;
    const clean = String(name).trim();
    if (/^\d+$/.test(clean)) return `Kamar ${clean}`;
    if (/^kamar/i.test(clean)) return clean;
    return clean;
};

const groupIntoRoomTypesGlobal = (rawList: any[], propertyTenants: any[] = []): any[] => {
    if (!Array.isArray(rawList) || rawList.length === 0) return [];

    const hasExplicitSubUnits = rawList.some(rt => (Array.isArray(rt.rooms) && rt.rooms.length > 0) || (Array.isArray(rt.unit_rooms) && rt.unit_rooms.length > 0));

    if (hasExplicitSubUnits) {
        return rawList.map((rt, idx) => {
            const rawUnits = (Array.isArray(rt.rooms) && rt.rooms.length > 0) ? rt.rooms : (Array.isArray(rt.unit_rooms) ? rt.unit_rooms : [rt]);
            const rooms = rawUnits.map((u: any, uIdx: number) => {
                const unitName = formatRoomNameGlobal(u?.name || u?.roomNumber || u?.room_number || String(uIdx + 1), uIdx);
                const matchedTenant = propertyTenants.find(t => 
                    t.metadata?.roomNumber === unitName || 
                    t.metadata?.roomNumber === u?.roomNumber || 
                    t.metadata?.roomNumber === u?.name
                );

                const tenantName = u?.tenantName || u?.residentName || u?.occupant_name || u?.occupantName || rt.residentName || rt.occupant_name || matchedTenant?.user?.name || '';
                const tenantPhone = u?.tenantPhone || u?.residentPhone || u?.occupant_phone || u?.occupantPhone || rt.residentPhone || rt.occupant_phone || matchedTenant?.user?.phone || '';
                const billingPeriod = u?.billingPeriod || u?.paymentPeriod || u?.rentPeriod || rt.paymentPeriod || rt.rentPeriod || matchedTenant?.metadata?.billingPeriod || 'bulanan';
                const dueDate = u?.dueDate || u?.endDate || u?.rentEndDate || rt.endDate || rt.rentEndDate || matchedTenant?.end_date || '';
                const startDate = u?.startDate || u?.rentStartDate || rt.startDate || rt.rentStartDate || matchedTenant?.start_date || '';

                const isUnitOcc = u?.status === 'Terisi' || u?.status === 'terisi' || u?.status === 'occupied' || u?.is_occupied === true || u?.isAvailable === false || Boolean(tenantName || tenantPhone);
                const photos = getRoomPhotosGlobal(u).length > 0 ? getRoomPhotosGlobal(u) : getRoomPhotosGlobal(rt);

                return {
                    id: u?.id || `unit_${idx}_${uIdx}`,
                    roomNumber: unitName,
                    status: isUnitOcc ? ('terisi' as const) : ('kosong' as const),
                    tenantName,
                    tenantPhone,
                    billingPeriod,
                    dueDate,
                    startDate,
                    currentOccupants: Number(u?.currentOccupants || rt.currentOccupants || 1),
                    size: u?.size || rt.size || '3x4 meter',
                    price: Number(u?.price || rt.price || 0),
                    facilities: u?.facilities || u?.roomFacilities || rt.roomFacilities || rt.room_facilities || [],
                    bathroomFacilities: u?.bathroomFacilities || rt.bathroomFacilities || rt.bathroom_facilities || [],
                    kitchenFacilities: u?.kitchenFacilities || rt.kitchenFacilities || rt.kitchen_facilities || [],
                    images: photos,
                    categorizedPhotos: u?.categorizedPhotos || {},
                    notes: u?.notes || rt.notes || rt.surveyorNotes || ''
                };
            });

            let typeTitle = rt.typeName || rt.type || '';
            if (!typeTitle || /^\d+$/.test(String(rt.name).trim()) || /^kamar\s*\d+/i.test(String(rt.name).trim())) {
                typeTitle = rawList.length > 1 ? `Tipe Kamar #${idx + 1}` : 'Tipe Standard';
            } else {
                typeTitle = /^tipe/i.test(String(rt.name).trim()) ? rt.name.trim() : `Tipe ${rt.name.trim()}`;
            }

            return {
                id: rt.id || `rt_${idx}`,
                name: typeTitle,
                size: rt.size || '3x4 meter',
                price: Number(rt.price || 0),
                maxOccupants: rt.maxOccupants || 1,
                roomFacilities: rt.roomFacilities || rt.room_facilities || [],
                bathroomFacilities: rt.bathroomFacilities || rt.bathroom_facilities || [],
                kitchenFacilities: rt.kitchenFacilities || rt.kitchen_facilities || [],
                rooms
            };
        });
    }

    // Surveyor / Flat units grouping:
    const typeGroups: { [key: string]: any } = {};

    rawList.forEach((roomItem: any, idx: number) => {
        let typeName = roomItem.typeName || roomItem.type || '';
        const rawName = String(roomItem.name || roomItem.roomNumber || '').trim();
        if (!typeName) {
            if (rawName && !/^\d+$/.test(rawName) && !/^kamar\s*\d+/i.test(rawName)) {
                typeName = rawName;
            } else {
                typeName = 'Standard';
            }
        }
        const groupKey = `${typeName}_${roomItem.size || '3x4'}_${roomItem.price || 0}`;

        if (!typeGroups[groupKey]) {
            typeGroups[groupKey] = {
                id: `rt_group_${idx}`,
                name: /^tipe/i.test(typeName) ? typeName : `Tipe ${typeName}`,
                size: roomItem.size || '3x4 meter',
                price: Number(roomItem.price || 0),
                maxOccupants: roomItem.maxOccupants || 1,
                roomFacilities: roomItem.roomFacilities || roomItem.room_facilities || [],
                bathroomFacilities: roomItem.bathroomFacilities || roomItem.bathroom_facilities || [],
                kitchenFacilities: roomItem.kitchenFacilities || roomItem.kitchen_facilities || [],
                rooms: []
            };
        }

        const unitName = formatRoomNameGlobal(roomItem.name || roomItem.roomNumber || String(idx + 1), idx);
        const matchedTenant = propertyTenants.find(t => 
            t.metadata?.roomNumber === unitName || 
            t.metadata?.roomNumber === roomItem.roomNumber || 
            t.metadata?.roomNumber === roomItem.name
        );

        const tenantName = roomItem.tenantName || roomItem.residentName || roomItem.occupant_name || roomItem.occupantName || matchedTenant?.user?.name || '';
        const tenantPhone = roomItem.tenantPhone || roomItem.residentPhone || roomItem.occupant_phone || roomItem.occupantPhone || matchedTenant?.user?.phone || '';
        const billingPeriod = roomItem.billingPeriod || roomItem.paymentPeriod || roomItem.rentPeriod || matchedTenant?.metadata?.billingPeriod || 'bulanan';
        const dueDate = roomItem.dueDate || roomItem.endDate || roomItem.rentEndDate || matchedTenant?.end_date || '';
        const startDate = roomItem.startDate || roomItem.rentStartDate || matchedTenant?.start_date || '';

        const isUnitOcc = roomItem.status === 'Terisi' || roomItem.status === 'terisi' || roomItem.status === 'occupied' || roomItem.is_occupied === true || roomItem.isAvailable === false || Boolean(tenantName || tenantPhone);
        const photos = getRoomPhotosGlobal(roomItem);

        const normalizedUnit = {
            id: roomItem.id || `unit_${idx}`,
            roomNumber: unitName,
            status: isUnitOcc ? ('terisi' as const) : ('kosong' as const),
            tenantName,
            tenantPhone,
            billingPeriod,
            dueDate,
            startDate,
            currentOccupants: Number(roomItem.currentOccupants || 1),
            size: roomItem.size || typeGroups[groupKey].size,
            price: Number(roomItem.price || typeGroups[groupKey].price),
            facilities: roomItem.facilities || roomItem.roomFacilities || roomItem.room_facilities || typeGroups[groupKey].roomFacilities,
            bathroomFacilities: roomItem.bathroomFacilities || roomItem.bathroom_facilities || typeGroups[groupKey].bathroomFacilities,
            kitchenFacilities: roomItem.kitchenFacilities || roomItem.kitchen_facilities || typeGroups[groupKey].kitchenFacilities,
            images: photos,
            categorizedPhotos: roomItem.categorizedPhotos || {},
            notes: roomItem.notes || roomItem.surveyorNotes || ''
        };

        typeGroups[groupKey].rooms.push(normalizedUnit);
    });

    return Object.values(typeGroups);
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
    metadata?: any;
    province?: string;
    publicParkingFacilities?: string[];
    public_parking_facilities?: string[];
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
                    image_urls: normalizePhotoList(p.image_urls || (p as any).imageUrls || (p as any).images || (p as any).metadata?.imageUrls || (p as any).metadata?.photos || []),
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

        // Rekonstruksi roomTypes dengan grouping cerdas 1:1 identik dengan review hasil pendataan survei
        const rawRoomList = Array.isArray(p.room_types) && p.room_types.length > 0
            ? p.room_types
            : ((p as any).metadata?.roomTypes || (p as any).metadata?.room_types || []);

        const reconstructedRoomTypes = groupIntoRoomTypesGlobal(rawRoomList, propResidents);

        // Fallback jika belum memiliki data tipe kamar sama sekali
        if (reconstructedRoomTypes.length === 0) {
            reconstructedRoomTypes.push({
                name: 'Tipe Standard',
                price: Number(p.price) || 850000,
                size: '3x4 meter',
                maxOccupants: 1,
                roomFacilities: ['Kasur', 'Lemari Pakaian'],
                bathroomFacilities: ['Kamar Mandi Dalam'],
                kitchenFacilities: [],
                rooms: [{
                    roomNumber: '101',
                    status: 'kosong',
                    tenantName: '',
                    tenantPhone: '',
                    billingPeriod: 'bulanan',
                    dueDate: '',
                    startDate: '',
                    currentOccupants: 1,
                    images: [],
                    notes: ''
                }]
            });
        }

        const propAddress = p.address || '';
        const propProvince = p.province || (p as any).metadata?.province || detectProvinceFromAddress(propAddress) || 'Sulawesi Selatan';
        const propCity = p.city || (p as any).metadata?.city || 'Makassar';
        const propArea = p.area || (p as any).metadata?.area || '';
        const propParking = p.publicParkingFacilities || p.public_parking_facilities || (p as any).metadata?.publicParkingFacilities || (p as any).metadata?.public_parking_facilities || ['Motor'];

        setNewPropForm({
            title: p.title || '',
            description: p.description || '',
            address: propAddress,
            city: propCity,
            area: propArea,
            province: propProvince,
            type: p.type || 'Campur',
            price: p.price || 0,
            owner_uid: p.owner_uid || '',
            location: p.location || { lat: -5.147665, lng: 119.432731 },
            facilities: p.facilities && p.facilities.length > 0 ? p.facilities : ['WiFi Cepat', 'Area Parkir', 'Dapur Bersama'],
            imageUrls: normalizePhotosWithLabels(p.image_urls || []),
            videoUrls: p.video_urls || [],
            instagramUrl: p.instagram_url || '',
            tiktokUrl: p.tiktok_url || '',
            rules: p.rules || [],
            campuses: p.campuses || [],
            publicFacilities: p.public_facilities || [],
            publicParkingFacilities: propParking,
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

                                                        const primaryImage = normalizePhotoUrl((p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : ((p as any).thumbnail || (p as any).image_url || ''));

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
                                                                                    onError={(e) => {
                                                                                        const target = e.currentTarget;
                                                                                        target.style.display = 'none';
                                                                                        if (target.nextElementSibling) {
                                                                                            (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                                                                        }
                                                                                    }}
                                                                                    className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                                                                                />
                                                                            ) : null}
                                                                            <div className={`w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 ${primaryImage ? 'hidden' : ''}`}>
                                                                                <Building2 size={24} />
                                                                            </div>
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
    // 3-Step Navigation Tabs (1:1 Identical to Admin Survey Review Modal)
    const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

    // Hero photo carousel state in Step 1
    const [selectedHeroPhotoIdx, setSelectedHeroPhotoIdx] = useState<number>(0);

    // Lightbox modal state
    const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; label?: string } | null>(null);

    // Step 2 Room Gallery & Filter State
    const [selectedRoomGalleryFilter, setSelectedRoomGalleryFilter] = useState<'all' | number>('all');
    const [selectedRoomGalleryPhotoIndex, setSelectedRoomGalleryPhotoIndex] = useState<number>(0);
    const [expandedRoomTypes, setExpandedRoomTypes] = useState<Record<number, boolean>>({ 0: true });
    const [expandedStatusSections, setExpandedStatusSections] = useState<Record<string, boolean>>({ 'rt0_occ': true, 'rt0_avail': true });

    // Hover matching state between facilities & photos
    const [hoveredFacility, setHoveredFacility] = useState<{ unitId: string; facilityId: string; keywords: string[] } | null>(null);
    const [hoveredPhoto, setHoveredPhoto] = useState<{ unitId: string; photoIdx: number; label: string } | null>(null);

    // Temp Inputs & Uploading State
    const [tempFacilityInput, setTempFacilityInput] = useState('');
    const [tempRuleInput, setTempRuleInput] = useState('');
    const [tempCampusName, setTempCampusName] = useState('');
    const [tempCampusDist, setTempCampusDist] = useState('');
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

    // Helper: Normalize Building Photos with Labels
    const allBuildingPhotos: { url: string; label: string }[] = [
        ...normalizePhotosWithLabels(newPropForm.imageUrls || []),
        ...newImageFiles.map((f, fi) => ({ url: URL.createObjectURL(f), label: `Foto Baru #${fi + 1}` }))
    ];

    const selectedOwner = ownersList.find(o => o.id === newPropForm.owner_uid);
    const filteredOwners = ownersList.filter(o => 
        o.name.toLowerCase().includes(ownerSearchQuery.toLowerCase()) ||
        o.phone.includes(ownerSearchQuery)
    );

    // Helper: Format Room Name
    const formatRoomName = (name: string, idx: number) => {
        if (!name) return `Kamar ${idx + 1}`;
        const clean = String(name).trim();
        if (/^\d+$/.test(clean)) return `Kamar ${clean}`;
        if (/^kamar/i.test(clean)) return clean;
        return clean;
    };

    // Helper: Facility Icons
    const FACILITY_ICONS: Record<string, any> = {
        'parkir': ParkingCircle, 'wc': Bath, 'toilet': Bath, 'dapur': CookingPot,
        'wifi': Sparkles, 'cctv': ShieldCheck, 'tamu': Building2, 'default': Sparkles
    };
    const getFacilityIconComponent = (name: string) => {
        const lower = (name || '').toLowerCase();
        for (const [k, Icon] of Object.entries(FACILITY_ICONS)) {
            if (lower.includes(k)) return Icon;
        }
        return FACILITY_ICONS.default;
    };

    const getRoomFacilityIcon = (name: string, size = 11) => {
        const n = (name || '').toLowerCase();
        if (/(kasur|tempat tidur|bed|springbed|matras)/i.test(n)) return <Bed size={size} className="shrink-0" />;
        if (/(kamar mandi|toilet|wc|shower|bath)/i.test(n)) return <Bath size={size} className="shrink-0" />;
        if (/(dapur|kitchen|kompor|masak|pantry)/i.test(n)) return <CookingPot size={size} className="shrink-0" />;
        if (/(jendela|window|ventilasi)/i.test(n)) return <AppWindow size={size} className="shrink-0" />;
        if (/(ac|air conditioner|pendingin|kipas)/i.test(n)) return <Wind size={size} className="shrink-0" />;
        if (/(wifi|internet|hotspot)/i.test(n)) return <Wifi size={size} className="shrink-0" />;
        if (/(tv|televisi)/i.test(n)) return <Tv size={size} className="shrink-0" />;
        if (/(lemari|wardrobe|clothes|pakaian|penyimpanan)/i.test(n)) return <DoorClosed size={size} className="shrink-0" />;
        if (/(meja|kursi|desk|belajar|kerja)/i.test(n)) return <Armchair size={size} className="shrink-0" />;
        if (/(listrik|token|colokan)/i.test(n)) return <Zap size={size} className="shrink-0" />;
        if (/(kloset|duduk|jongkok)/i.test(n)) return <Sparkles size={size} className="shrink-0" />;
        if (/(air|wastafel|pdam|sumur|sink)/i.test(n)) return <Droplets size={size} className="shrink-0" />;
        if (/(balkon|teras)/i.test(n)) return <Building2 size={size} className="shrink-0" />;
        return <Sparkles size={size} className="shrink-0" />;
    };

    const normalizeKeyword = (str: string) => {
        return (str || '').toLowerCase()
            .replace(/[^a-z0-9]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const isFacilityMatchingPhoto = (facilityOrKeywords: string | string[], photoLabel: string) => {
        const p = normalizeKeyword(photoLabel);
        if (!p) return false;
        const keywords = Array.isArray(facilityOrKeywords) ? facilityOrKeywords : [facilityOrKeywords];
        return keywords.some(k => {
            const f = normalizeKeyword(k);
            if (!f) return false;
            if (f === p) return true;
            const rules: [RegExp, RegExp][] = [
                [/(kasur|tempat tidur|springbed|matras|bed)/, /(kasur|tempat tidur|springbed|matras|bed)/],
                [/(kamar mandi|toilet|wc|kloset|shower|wastafel|bak mandi)/, /(kamar mandi|toilet|wc|kloset|shower|wastafel|bathroom)/],
                [/(dapur|kitchen|kompor|pantry|sink|rak piring)/, /(dapur|kitchen|kompor|pantry|sink|masak)/],
                [/(jendela|ventilasi|window)/, /(jendela|ventilasi|window)/],
                [/(lemari|wardrobe|storage|penyimpanan)/, /(lemari|wardrobe|storage|penyimpanan)/],
                [/(meja|kursi|belajar|kerja|desk)/, /(meja|kursi|belajar|kerja|desk)/],
                [/(^|\s)(ac|air conditioner|pendingin)($|\s)/, /(^|\s)(ac|air conditioner|pendingin)($|\s)/],
                [/(kipas|kipas angin|fan)/, /(kipas|kipas angin|fan)/],
                [/(water heater|pemanas air)/, /(water heater|pemanas air)/],
                [/(^|\s)(tv|televisi)($|\s)/, /(^|\s)(tv|televisi)($|\s)/],
                [/(kulkas|lemari es)/, /(kulkas|lemari es)/],
                [/(balkon|balcony|teras)/, /(balkon|balcony|teras)/]
            ];
            for (const [rF, rP] of rules) {
                if (rF.test(f)) return rP.test(p);
            }
            const genericWords = ['kamar', 'ruang', 'ruangan', 'dalam', 'luar', 'umum', 'bersama'];
            if (!genericWords.includes(f) && !genericWords.includes(p) && f.length >= 4) {
                if (p.includes(f) || f.includes(p)) return true;
            }
            return false;
        });
    };

    interface UnifiedFacilityItem {
        id: string;
        mainName: string;
        subFacilities: string[];
        allKeywords: string[];
        category: 'room' | 'bath' | 'kitchen';
    }

    const buildUnifiedFacilities = (
        roomFacilities: string[] = [],
        bathroomFacilities: string[] = [],
        kitchenFacilities: string[] = []
    ): UnifiedFacilityItem[] => {
        const unified: UnifiedFacilityItem[] = [];
        const processedBath = new Set<string>();
        const processedKitchen = new Set<string>();
        const processedRoom = new Set<string>();

        const rList = Array.isArray(roomFacilities) ? roomFacilities : [];
        const bList = Array.isArray(bathroomFacilities) ? bathroomFacilities : [];
        const kList = Array.isArray(kitchenFacilities) ? kitchenFacilities : [];

        // 1. Kamar Mandi
        const bathKeywords = ['kamar mandi', 'wc dalam', 'wc umum', 'wc luar', 'kamar mandi dalam', 'kamar mandi luar'];
        const mainBathItem = bList.find(f => bathKeywords.some(kw => String(f).toLowerCase().includes(kw)))
            || rList.find(f => bathKeywords.some(kw => String(f).toLowerCase().includes(kw)));
        const subBathItems = bList.filter(f => !bathKeywords.some(kw => String(f).toLowerCase().includes(kw)));

        if (mainBathItem || subBathItems.length > 0) {
            const title = mainBathItem || 'Kamar Mandi';
            if (mainBathItem) {
                processedBath.add(mainBathItem);
                processedRoom.add(mainBathItem);
            }
            subBathItems.forEach(b => processedBath.add(b));
            unified.push({
                id: 'bath_group',
                mainName: title,
                subFacilities: subBathItems,
                allKeywords: [title, ...subBathItems, 'kamar mandi', 'toilet', 'wc', 'kloset', 'shower'],
                category: 'bath'
            });
        }

        // 2. Dapur
        const kitchenKeywords = ['dapur dalam', 'dapur luar', 'dapur umum', 'dapur bersama', 'dapur'];
        const mainKitchenItem = kList.find(f => kitchenKeywords.some(kw => String(f).toLowerCase().includes(kw)))
            || rList.find(f => kitchenKeywords.some(kw => String(f).toLowerCase().includes(kw)));
        const subKitchenItems = kList.filter(f => !kitchenKeywords.some(kw => String(f).toLowerCase().includes(kw)));

        if (mainKitchenItem || subKitchenItems.length > 0) {
            const title = mainKitchenItem || 'Dapur';
            if (mainKitchenItem) {
                processedKitchen.add(mainKitchenItem);
                processedRoom.add(mainKitchenItem);
            }
            subKitchenItems.forEach(k => processedKitchen.add(k));
            unified.push({
                id: 'kitchen_group',
                mainName: title,
                subFacilities: subKitchenItems,
                allKeywords: [title, ...subKitchenItems, 'dapur', 'kitchen', 'kompor', 'pantry'],
                category: 'kitchen'
            });
        }

        // 3. Fasilitas Kamar Lainnya
        rList.forEach((f, idx) => {
            const clean = String(f).trim();
            if (!clean || processedRoom.has(clean)) return;
            if (bathKeywords.some(kw => clean.toLowerCase().includes(kw))) return;
            if (kitchenKeywords.some(kw => clean.toLowerCase().includes(kw))) return;
            unified.push({
                id: `room_${idx}_${clean}`,
                mainName: clean,
                subFacilities: [],
                allKeywords: [clean],
                category: 'room'
            });
        });

        // 4. Any leftover bathroom items
        bList.forEach((b, idx) => {
            if (!processedBath.has(b)) {
                unified.push({
                    id: `bath_extra_${idx}`,
                    mainName: b,
                    subFacilities: [],
                    allKeywords: [b, 'kamar mandi', 'toilet', 'kloset'],
                    category: 'bath'
                });
            }
        });

        // 5. Any leftover kitchen items
        kList.forEach((k, idx) => {
            if (!processedKitchen.has(k)) {
                unified.push({
                    id: `kitchen_extra_${idx}`,
                    mainName: k,
                    subFacilities: [],
                    allKeywords: [k, 'dapur', 'kitchen'],
                    category: 'kitchen'
                });
            }
        });

        return unified;
    };

    const getRoomPhotos = (room: any) => {
        if (!room) return [];
        const result: { url: string; label: string }[] = [];

        // 1. From categorizedPhotos
        if (room.categorizedPhotos && typeof room.categorizedPhotos === 'object') {
            const catMap: Record<string, string> = {
                interior: 'Interior Kamar',
                kasur: 'Tempat Tidur',
                wc: 'Kamar Mandi',
                jendela: 'Jendela / Ventilasi'
            };
            Object.keys(room.categorizedPhotos).forEach(k => {
                const list = room.categorizedPhotos[k];
                if (Array.isArray(list)) {
                    list.forEach(item => {
                        const url = typeof item === 'string' ? item : (item?.url || item?.original || '');
                        if (url && !result.some(p => p.url === url)) {
                            result.push({ url, label: catMap[k] || k });
                        }
                    });
                }
            });
        }

        // 2. From raw room.images or room.photos
        const rawImages = room.images || room.image_urls || room.photos || [];
        const DEFAULT_ROOM_PHOTO_SLOTS = ['Interior Kamar', 'Kamar Mandi Dalam', 'Tempat Tidur', 'Lemari / Penyimpanan'];
        rawImages.forEach((img: any, imgIdx: number) => {
            const url = typeof img === 'string' ? img : (img?.url || img?.original || '');
            if (url && !result.some(p => p.url === url)) {
                let label = '';
                if (room.photoCategories?.[imgIdx]) label = room.photoCategories[imgIdx];
                else if (typeof img === 'object' && img?.label) label = img.label;
                else if (imgIdx < DEFAULT_ROOM_PHOTO_SLOTS.length) label = DEFAULT_ROOM_PHOTO_SLOTS[imgIdx];
                else label = `Foto Tambahan #${imgIdx + 1}`;
                label = label.replace(/\s*\*Wajib/i, '').replace(/\(Opsional\)/i, '').trim();
                result.push({ url, label });
            }
        });

        return result;
    };

    // Get current room types from newPropForm
    const currentRoomTypes = Array.isArray(newPropForm.roomTypes) && newPropForm.roomTypes.length > 0
        ? newPropForm.roomTypes
        : [{
            name: 'Tipe Standard',
            price: Number(newPropForm.price) || 850000,
            size: '3x4 meter',
            maxOccupants: 1,
            roomFacilities: ['Kasur', 'Lemari Pakaian'],
            bathroomFacilities: ['Kamar Mandi Dalam'],
            kitchenFacilities: [],
            rooms: [{
                roomNumber: '101',
                status: 'kosong',
                tenantName: '',
                tenantPhone: '',
                billingPeriod: 'bulanan',
                dueDate: '',
                startDate: '',
                currentOccupants: 1,
                images: [],
                categorizedPhotos: {},
                notes: ''
            }]
        }];

    // Calculate Room & Occupant Statistics
    let totalRooms = 0;
    let occupiedRooms = 0;
    let availableRooms = 0;
    let totalOccupants = 0;

    currentRoomTypes.forEach((rt: any) => {
        const rms = Array.isArray(rt.rooms) ? rt.rooms : [];
        rms.forEach((u: any) => {
            totalRooms++;
            const isOcc = u.status === 'terisi' || Boolean(u.tenantName || u.residentName);
            if (isOcc) {
                occupiedRooms++;
                totalOccupants += Number(u.currentOccupants || 1);
            } else {
                availableRooms++;
            }
        });
    });

    // Collect all room photos for Step 2 Room Gallery
    const allRoomPhotosWithMetadata: { url: string; label: string; roomName: string; rtIdx: number; uIdx: number; u: any }[] = [];
    let unitPhotoCounter = 0;

    currentRoomTypes.forEach((rt: any, rtIdx: number) => {
        const rms = Array.isArray(rt.rooms) ? rt.rooms : [];
        rms.forEach((u: any, uIdx: number) => {
            const uPhotos = getRoomPhotos(u);
            const currentCounter = unitPhotoCounter;
            const rName = formatRoomName(u.roomNumber || u.name, uIdx);
            uPhotos.forEach(p => {
                allRoomPhotosWithMetadata.push({
                    ...p,
                    roomName: rName,
                    rtIdx: currentCounter,
                    uIdx,
                    u
                });
            });
            unitPhotoCounter++;
        });
    });

    const displayedRoomPhotos = selectedRoomGalleryFilter === 'all'
        ? allRoomPhotosWithMetadata
        : allRoomPhotosWithMetadata.filter(p => p.rtIdx === selectedRoomGalleryFilter);

    const activeRoomPhotoIdx = displayedRoomPhotos.length > 0
        ? Math.min(selectedRoomGalleryPhotoIndex, displayedRoomPhotos.length - 1)
        : 0;
    const currentActiveRoomPhoto = displayedRoomPhotos[activeRoomPhotoIdx] || null;

    // Direct Unit Mutators
    const updateUnit = (rtIdx: number, rmIdx: number, updates: Record<string, any>) => {
        setNewPropForm((prev: any) => {
            const updatedRoomTypes = (prev.roomTypes || currentRoomTypes).map((rtItem: any, rti: number) => {
                if (rti !== rtIdx) return rtItem;
                const updatedRooms = (rtItem.rooms || []).map((rmItem: any, rmi: number) => {
                    if (rmi !== rmIdx) return rmItem;
                    return { ...rmItem, ...updates };
                });
                return { ...rtItem, rooms: updatedRooms };
            });
            return { ...prev, roomTypes: updatedRoomTypes };
        });
    };

    const toggleUnitStatus = (rtIdx: number, rmIdx: number, currentStatus: string) => {
        const nextStatus = currentStatus === 'terisi' ? 'kosong' : 'terisi';
        updateUnit(rtIdx, rmIdx, { status: nextStatus });
    };

    const handleAddUnitToType = (rtIdx: number) => {
        setNewPropForm((prev: any) => {
            const updatedRoomTypes = (prev.roomTypes || currentRoomTypes).map((rtItem: any, rti: number) => {
                if (rti !== rtIdx) return rtItem;
                const existing = rtItem.rooms || [];
                const nextNumber = String((rtIdx + 1) * 100 + existing.length + 1);
                const newUnit = {
                    roomNumber: nextNumber,
                    status: 'kosong',
                    tenantName: '',
                    tenantPhone: '',
                    billingPeriod: 'bulanan',
                    dueDate: '',
                    startDate: '',
                    currentOccupants: 1,
                    images: [],
                    categorizedPhotos: {},
                    notes: ''
                };
                return { ...rtItem, rooms: [...existing, newUnit] };
            });
            return { ...prev, roomTypes: updatedRoomTypes };
        });
    };

    const handleDeleteUnit = (rtIdx: number, rmIdx: number, unitName: string) => {
        if (totalRooms <= 1) {
            alert('Minimal properti harus memiliki 1 unit kamar.');
            return;
        }
        if (!confirm(`Apakah Anda yakin ingin menghapus Unit ${unitName}?`)) return;
        setNewPropForm((prev: any) => {
            const updatedRoomTypes = (prev.roomTypes || currentRoomTypes).map((rtItem: any, rti: number) => {
                if (rti !== rtIdx) return rtItem;
                const updatedRooms = (rtItem.rooms || []).filter((_: any, rmi: number) => rmi !== rmIdx);
                return { ...rtItem, rooms: updatedRooms };
            });
            return { ...prev, roomTypes: updatedRoomTypes };
        });
    };

    const handleAddRoomType = () => {
        const nextNum = currentRoomTypes.length + 1;
        const newType = {
            name: `Tipe Kamar #${nextNum}`,
            price: Number(newPropForm.price) || 850000,
            size: '3x4 meter',
            maxOccupants: 1,
            roomFacilities: ['Kasur', 'Lemari Pakaian'],
            bathroomFacilities: ['Kamar Mandi Dalam'],
            kitchenFacilities: [],
            rooms: [{
                roomNumber: `${nextNum}01`,
                status: 'kosong',
                tenantName: '',
                tenantPhone: '',
                billingPeriod: 'bulanan',
                dueDate: '',
                startDate: '',
                currentOccupants: 1,
                images: [],
                categorizedPhotos: {},
                notes: ''
            }]
        };
        setNewPropForm((prev: any) => ({
            ...prev,
            roomTypes: [...(prev.roomTypes || currentRoomTypes), newType]
        }));
        setExpandedRoomTypes(prev => ({ ...prev, [currentRoomTypes.length]: true }));
    };

    const handleDeleteRoomType = (rtIdx: number, typeName: string) => {
        if (currentRoomTypes.length <= 1) {
            alert('Minimal properti harus memiliki 1 tipe kamar.');
            return;
        }
        if (!confirm(`Hapus seluruh tipe kamar "${typeName}" beserta seluruh unit di dalamnya?`)) return;
        setNewPropForm((prev: any) => ({
            ...prev,
            roomTypes: (prev.roomTypes || currentRoomTypes).filter((_: any, rti: number) => rti !== rtIdx)
        }));
    };

    const updateRoomTypeField = (rtIdx: number, field: string, value: any) => {
        setNewPropForm((prev: any) => {
            const updatedRoomTypes = (prev.roomTypes || currentRoomTypes).map((rtItem: any, rti: number) => {
                if (rti !== rtIdx) return rtItem;
                return { ...rtItem, [field]: value };
            });
            return { ...prev, roomTypes: updatedRoomTypes };
        });
    };

    // Room Photo Upload & Delete
    const handleUploadRoomPhoto = async (rtIdx: number, rmIdx: number, categoryKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        const uploadKey = `${rtIdx}-${rmIdx}-${categoryKey}`;
        setUploadingRooms(prev => ({ ...prev, [uploadKey]: true }));
        try {
            const folder = `kostmanager/rooms/${Date.now()}`;
            const webpFile = await compressImageToWebP(file);
            const publicUrl = await uploadFileAndGetURL(webpFile, folder);
            const catMap: Record<string, string> = {
                interior: 'Interior Kamar',
                kasur: 'Tempat Tidur',
                wc: 'Kamar Mandi Dalam',
                jendela: 'Jendela Luar'
            };
            const photoLabel = catMap[categoryKey] || categoryKey;

            setNewPropForm((prev: any) => {
                const updatedRoomTypes = (prev.roomTypes || currentRoomTypes).map((rtItem: any, rti: number) => {
                    if (rti !== rtIdx) return rtItem;
                    const updatedRooms = (rtItem.rooms || []).map((rmItem: any, rmi: number) => {
                        if (rmi !== rmIdx) return rmItem;
                        const currentImages = Array.isArray(rmItem.images) ? [...rmItem.images] : [];
                        const currentCatPhotos = { ...(rmItem.categorizedPhotos || {}) };
                        const catList = Array.isArray(currentCatPhotos[categoryKey]) ? [...currentCatPhotos[categoryKey]] : [];
                        currentImages.push({ url: publicUrl, label: photoLabel });
                        catList.push(publicUrl);
                        currentCatPhotos[categoryKey] = catList;
                        return { ...rmItem, images: currentImages, categorizedPhotos: currentCatPhotos };
                    });
                    return { ...rtItem, rooms: updatedRooms };
                });
                return { ...prev, roomTypes: updatedRoomTypes };
            });
        } catch (err: any) {
            alert('Gagal mengunggah foto kamar: ' + err.message);
        } finally {
            e.target.value = '';
            setUploadingRooms(prev => ({ ...prev, [uploadKey]: false }));
        }
    };

    const handleDeleteRoomPhoto = (rtIdx: number, rmIdx: number, photoUrl: string) => {
        setNewPropForm((prev: any) => {
            const updatedRoomTypes = (prev.roomTypes || currentRoomTypes).map((rtItem: any, rti: number) => {
                if (rti !== rtIdx) return rtItem;
                const updatedRooms = (rtItem.rooms || []).map((rmItem: any, rmi: number) => {
                    if (rmi !== rmIdx) return rmItem;
                    const currentImages = (rmItem.images || []).filter((u: any) => {
                        const uUrl = typeof u === 'string' ? u : (u?.url || u?.original || '');
                        return uUrl !== photoUrl;
                    });
                    const currentCatPhotos = { ...(rmItem.categorizedPhotos || {}) };
                    Object.keys(currentCatPhotos).forEach(k => {
                        if (Array.isArray(currentCatPhotos[k])) {
                            currentCatPhotos[k] = currentCatPhotos[k].filter((u: any) => {
                                const uUrl = typeof u === 'string' ? u : (u?.url || u?.original || '');
                                return uUrl !== photoUrl;
                            });
                        }
                    });
                    return { ...rmItem, images: currentImages, categorizedPhotos: currentCatPhotos };
                });
                return { ...rtItem, rooms: updatedRooms };
            });
            return { ...prev, roomTypes: updatedRoomTypes };
        });
    };

    // Hero Building Photo Upload & Delete
    const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const rawFiles = Array.from(e.target.files);
            const compressedList = await Promise.all(rawFiles.map(f => compressImageToWebP(f)));
            setNewImageFiles(prev => [...prev, ...compressedList]);
        }
    };

    const handleDeleteBuildingPhoto = (idx: number) => {
        const existingList = newPropForm.imageUrls || [];
        if (idx < existingList.length) {
            const updated = existingList.filter((_: any, i: number) => i !== idx);
            setNewPropForm({ ...newPropForm, imageUrls: updated });
        } else {
            const fileIdx = idx - existingList.length;
            setNewImageFiles(prev => prev.filter((_, i) => i !== fileIdx));
        }
        setSelectedHeroPhotoIdx(Math.max(0, selectedHeroPhotoIdx - 1));
    };

    const updateHeroPhotoLabel = (idx: number, newLabel: string) => {
        const existingList = [...(newPropForm.imageUrls || [])];
        if (idx < existingList.length) {
            const currentItem = existingList[idx];
            if (typeof currentItem === 'string') {
                existingList[idx] = { url: currentItem, label: newLabel };
            } else {
                existingList[idx] = { ...currentItem, label: newLabel };
            }
            setNewPropForm({ ...newPropForm, imageUrls: existingList });
        }
    };

    // Two-way sync: Find building photo matching facility
    const getFacilityPhotoIndex = (facName: string) => {
        const lower = facName.toLowerCase();
        let targetKeywords: string[] = [lower];
        if (lower.includes('parkir')) targetKeywords = ['parkir', 'parkiran', 'tempat parkir', 'area parkir'];
        else if (lower.includes('wc') || lower.includes('toilet')) targetKeywords = ['wc', 'toilet', 'kamar mandi', 'wc umum'];
        else if (lower.includes('dapur')) targetKeywords = ['dapur', 'dapur bersama', 'kitchen'];
        else if (lower.includes('wifi')) targetKeywords = ['wifi', 'internet'];
        else if (lower.includes('tamu')) targetKeywords = ['tamu', 'ruang tamu', 'lobby', 'santai'];
        else if (lower.includes('cctv')) targetKeywords = ['cctv', 'keamanan'];
        else if (lower.includes('laundry')) targetKeywords = ['laundry', 'mesin cuci', 'jemuran'];

        return allBuildingPhotos.findIndex(p => {
            const pLabel = p.label.toLowerCase();
            return targetKeywords.some(kw => pLabel.includes(kw) || kw.includes(pLabel));
        });
    };

    // Facility toggles
    const toggleFacility = (facName: string) => {
        const current = newPropForm.facilities || [];
        if (current.includes(facName)) {
            setNewPropForm({ ...newPropForm, facilities: current.filter((f: string) => f !== facName) });
        } else {
            setNewPropForm({ ...newPropForm, facilities: [...current, facName] });
        }
    };

    const toggleParkingVehicle = (vehicleName: string) => {
        const currentParking = Array.isArray(newPropForm.publicParkingFacilities) ? newPropForm.publicParkingFacilities : [];
        if (currentParking.includes(vehicleName)) {
            setNewPropForm({ ...newPropForm, publicParkingFacilities: currentParking.filter((v: string) => v !== vehicleName) });
        } else {
            setNewPropForm({ ...newPropForm, publicParkingFacilities: [...currentParking, vehicleName] });
        }
    };

    // Campuses & Rules mutators
    const handleAddCampus = () => {
        if (!tempCampusName.trim()) return;
        const newC = {
            name: tempCampusName.trim(),
            distance: tempCampusDist.trim() || '1.0 km',
            lat: newPropForm.location?.lat || -5.147665,
            lng: newPropForm.location?.lng || 119.432731
        };
        setNewPropForm({ ...newPropForm, campuses: [...(newPropForm.campuses || []), newC] });
        setTempCampusName('');
        setTempCampusDist('');
    };

    const handleDeleteCampus = (cIdx: number) => {
        const updated = (newPropForm.campuses || []).filter((_: any, i: number) => i !== cIdx);
        setNewPropForm({ ...newPropForm, campuses: updated });
    };

    const handleAddRule = () => {
        if (!tempRuleInput.trim()) return;
        setNewPropForm({ ...newPropForm, rules: [...(newPropForm.rules || []), tempRuleInput.trim()] });
        setTempRuleInput('');
    };

    const handleDeleteRule = (rIdx: number) => {
        const updated = (newPropForm.rules || []).filter((_: any, i: number) => i !== rIdx);
        setNewPropForm({ ...newPropForm, rules: updated });
    };

    // Save handler
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPropForm.owner_uid) return alert('Pilih pemilik/mitra terlebih dahulu');
        if (!newPropForm.title) return alert('Nama gedung kost harus diisi');

        setSavingProp(true);
        try {
            let finalPrice = Number(newPropForm.price) || 0;
            if (currentRoomTypes.length > 0) {
                const prices = currentRoomTypes.map((rt: any) => Number(rt.price)).filter((p: number) => p > 0);
                if (prices.length > 0) finalPrice = Math.min(...prices);
            }

            const mappedRoomTypes = currentRoomTypes.map((rt: any) => ({
                name: rt.name,
                price: Number(rt.price),
                size: rt.size || '3x4 meter',
                isAvailable: (rt.rooms || []).some((r: any) => r.status === 'kosong'),
                availableRoomCount: (rt.rooms || []).filter((r: any) => r.status === 'kosong').length,
                maxOccupants: rt.maxOccupants || 1,
                roomFacilities: rt.roomFacilities || [],
                bathroomFacilities: rt.bathroomFacilities || [],
                kitchenFacilities: rt.kitchenFacilities || [],
                rooms: (rt.rooms || []).map((r: any) => ({
                    roomNumber: r.roomNumber,
                    status: r.status,
                    tenantName: r.tenantName || '',
                    tenantPhone: r.tenantPhone || '',
                    billingPeriod: r.billingPeriod || 'bulanan',
                    dueDate: r.dueDate || '',
                    startDate: r.startDate || '',
                    currentOccupants: Number(r.currentOccupants || 1),
                    images: r.images || [],
                    categorizedPhotos: r.categorizedPhotos || {},
                    notes: r.notes || ''
                }))
            }));

            const payload: any = {
                title: newPropForm.title,
                description: newPropForm.description || '',
                address: newPropForm.address,
                city: newPropForm.city,
                area: newPropForm.area || '',
                province: newPropForm.province || detectProvinceFromAddress(newPropForm.address) || 'Sulawesi Selatan',
                type: newPropForm.type || 'Campur',
                price: finalPrice,
                ownerUid: newPropForm.owner_uid,
                isManaged: true,
                roomTypes: mappedRoomTypes,
                location: newPropForm.location || { lat: -5.147665, lng: 119.432731 },
                facilities: newPropForm.facilities && newPropForm.facilities.length > 0 ? newPropForm.facilities : ['WiFi Cepat', 'Dapur Bersama', 'Area Parkir'],
                publicParkingFacilities: newPropForm.publicParkingFacilities || ['Motor', 'Mobil'],
                imageUrls: newPropForm.imageUrls || [],
                videoUrls: newPropForm.videoUrls || [],
                rules: newPropForm.rules || [],
                campuses: newPropForm.campuses || [],
                publicFacilities: newPropForm.publicFacilities || [],
                omnichannelContactName: newPropForm.omnichannelContactName || '',
                omnichannelContactPhone: newPropForm.omnichannelContactPhone || '',
                omnichannelContactType: newPropForm.omnichannelContactType || 'owner',
            };

            if (editingPropertyId) {
                await updatePropertyWithMedia(editingPropertyId, payload, newImageFiles, newVideoFiles);
            } else {
                payload.isVerified = true;
                await addPropertyWithMedia(payload, newImageFiles, newVideoFiles);
            }

            alert(editingPropertyId ? '✅ Properti kelolaan KostManager berhasil diperbarui!' : '✅ Properti kelolaan KostManager berhasil ditambahkan!');
            onSuccess();
        } catch (err: any) {
            console.error('Error saving managed property:', err);
            alert('Gagal menyimpan properti: ' + err.message);
        } finally {
            setSavingProp(false);
        }
    };

    // Financial Simulations
    const totalPotentialOmset = currentRoomTypes.reduce((sum: number, rt: any) => {
        const rms = Array.isArray(rt.rooms) ? rt.rooms : [];
        return sum + (rms.length * Number(rt.price || 0));
    }, 0);
    const realizedOmset = currentRoomTypes.reduce((sum: number, rt: any) => {
        const rms = Array.isArray(rt.rooms) ? rt.rooms : [];
        return sum + rms.filter((r: any) => r.status === 'terisi' || Boolean(r.tenantName)).reduce((subSum: number, r: any) => subSum + Number(r.price || rt.price || 0), 0);
    }, 0);
    const estimatedFee = Math.round(realizedOmset * 0.10);
    const estimatedPayout = realizedOmset - estimatedFee;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div 
                className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 border border-slate-100"
                onClick={e => e.stopPropagation()}
            >
                {/* ======================================================== */}
                {/* 1. MODAL HEADER (EXACT 1:1 WITH ADMIN REVIEW MODAL)      */}
                {/* ======================================================== */}
                <div className="p-6 pb-4 border-b border-gray-100 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>AKTIF TERKELOLA (AUTO-PILOT)</span>
                            </span>
                            <div className="relative inline-flex items-center">
                                <select
                                    value={newPropForm.type || 'Campur'}
                                    onChange={e => setNewPropForm({ ...newPropForm, type: e.target.value })}
                                    className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 outline-none cursor-pointer hover:bg-orange-200 transition-colors"
                                >
                                    <option value="Campur">Campur</option>
                                    <option value="Putra">Putra</option>
                                    <option value="Putri">Putri</option>
                                </select>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                                ID: #{editingPropertyId ? editingPropertyId.substring(0, 8) : 'BARU'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newPropForm.title || ''}
                                onChange={e => setNewPropForm({ ...newPropForm, title: e.target.value })}
                                placeholder="Nama Gedung Kost..."
                                className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight bg-transparent hover:bg-slate-100/80 focus:bg-white focus:ring-2 focus:ring-orange-400 rounded-xl px-2 py-0.5 outline-none w-full transition-all"
                            />
                        </div>
                        <p className="text-xs text-gray-500 font-medium truncate mt-0.5 px-2">
                            📍 {newPropForm.address || 'Alamat properti belum ditentukan'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-gray-500 flex items-center justify-center border border-gray-200 transition-all font-bold text-lg shadow-xs cursor-pointer"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                {/* ======================================================== */}
                {/* TOP INFO STRIP: OWNER & OPERATIONAL DETAILS (1:1)       */}
                {/* ======================================================== */}
                <div className="bg-slate-100/70 px-6 py-3 border-b border-gray-200/70 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                    <div className="flex items-center gap-2.5 relative" ref={ownerDropdownRef}>
                        <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-xs shadow-xs">
                            {(selectedOwner?.name || 'M').charAt(0)}
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pemilik / Mitra Kost</span>
                            <button
                                type="button"
                                onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)}
                                className="font-black text-slate-800 hover:text-orange-600 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <span>{selectedOwner?.name || '-- Pilih Mitra Pemilik --'}</span>
                                <ChevronDown size={12} className="text-slate-400" />
                            </button>
                        </div>
                        {selectedOwner?.phone && (
                            <a
                                href={`https://wa.me/${selectedOwner.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-xs"
                            >
                                <span>WhatsApp</span>
                            </a>
                        )}

                        {isOwnerDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 z-[999] w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 animate-in fade-in">
                                <input
                                    type="text"
                                    placeholder="Cari nama atau no. WA mitra..."
                                    value={ownerSearchQuery}
                                    onChange={e => setOwnerSearchQuery(e.target.value)}
                                    className="w-full text-xs p-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                                    autoFocus
                                />
                                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                                    {filteredOwners.map(o => (
                                        <button
                                            key={o.id}
                                            type="button"
                                            onClick={() => {
                                                setNewPropForm({ ...newPropForm, owner_uid: o.id });
                                                setIsOwnerDropdownOpen(false);
                                                setOwnerSearchQuery('');
                                            }}
                                            className="w-full text-left p-2 hover:bg-orange-50 text-xs rounded-xl flex justify-between items-center cursor-pointer"
                                        >
                                            <div>
                                                <span className="font-bold text-slate-800 block">{o.name}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{o.phone}</span>
                                            </div>
                                            {o.id === newPropForm.owner_uid && <Check size={14} className="text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Mode Operasional</span>
                            <span className="font-black text-slate-800">KostManager Auto-Pilot Studio</span>
                        </div>
                        {editingPropertyId && (
                            <a
                                href={`/kost/${editingPropertyId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                                <ExternalLink size={13} />
                                <span>Lihat Web ↗</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* ======================================================== */}
                {/* 3-TAB NAVIGATION BAR (1:1 WITH ADMIN REVIEW MODAL)      */}
                {/* ======================================================== */}
                <div className="flex border-b border-gray-100 bg-white px-4 gap-1 overflow-x-auto shrink-0">
                    {[
                        { key: 1, icon: <Building2 size={14}/>, label: '1. DATA PROPERTI UMUM', badge: allBuildingPhotos.length || null },
                        { key: 2, icon: <Bed size={14}/>, label: '2. DATA KAMAR & PENGHUNI', badge: totalRooms || null },
                        { key: 3, icon: <ShieldCheck size={14}/>, label: '3. DATA MITRA & KERJASAMA', badge: '✓' }
                    ].map(t => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setActiveTab(t.key as any)}
                            className={`py-3.5 px-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                                activeTab === t.key
                                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            {t.icon}
                            <span>{t.label}</span>
                            {t.badge !== null && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                                    activeTab === t.key ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                                }`}>
                                    {t.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ======================================================== */}
                {/* MODAL BODY (3-TAB CONTENT 1:1 WITH ADMIN REVIEW MODAL)   */}
                {/* ======================================================== */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* ==================================================== */}
                    {/* TAB 1: DATA PROPERTI UMUM                           */}
                    {/* ==================================================== */}
                    {activeTab === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* HERO CAROUSEL FOTO PROPERTI (16/7 DARK THEME) */}
                            {allBuildingPhotos.length > 0 ? (
                                (() => {
                                    const idx = Math.min(selectedHeroPhotoIdx, allBuildingPhotos.length - 1);
                                    const photo = allBuildingPhotos[idx];
                                    return (
                                        <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-950">
                                            {/* Main Slide */}
                                            <div className="relative" style={{ aspectRatio: '16/7' }}>
                                                <img src={photo.url} alt={photo.label} className="w-full h-full object-cover opacity-95" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />

                                                {/* Top Badges & Action Buttons */}
                                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                                                    <div className="flex items-center gap-1.5 pointer-events-auto">
                                                        <span className="px-3 py-1 rounded-xl bg-black/60 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-1">
                                                            📸 {photo.label}
                                                        </span>
                                                        <select
                                                            value={photo.label}
                                                            onChange={e => updateHeroPhotoLabel(idx, e.target.value)}
                                                            className="px-2 py-1 rounded-xl bg-black/60 text-white text-[9px] font-bold backdrop-blur-md border border-white/15 outline-none cursor-pointer"
                                                        >
                                                            <option value="Fasad Bangunan Depan">Fasad Bangunan Depan</option>
                                                            <option value="Area Parkir">Area Parkir</option>
                                                            <option value="Koridor & Akses Masuk">Koridor & Akses Masuk</option>
                                                            <option value="Dapur Bersama">Dapur Bersama</option>
                                                            <option value="Ruang Tamu / Komunal">Ruang Tamu / Komunal</option>
                                                            <option value="Lingkungan Sekitar">Lingkungan Sekitar</option>
                                                            <option value="Tampak Samping">Tampak Samping</option>
                                                            <option value={photo.label}>{photo.label}</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center gap-2 pointer-events-auto">
                                                        <label className="px-3 py-1 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-emerald-400/40 shadow-sm cursor-pointer transition-all flex items-center gap-1">
                                                            <Upload size={12} />
                                                            <span>+ Tambah Foto</span>
                                                            <input
                                                                type="file"
                                                                multiple
                                                                accept="image/*"
                                                                onChange={handleImageFileSelect}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        <span className="px-3 py-1 rounded-xl bg-black/60 text-white text-[10px] font-black backdrop-blur-md border border-white/10 shadow-sm">
                                                            {idx + 1} / {allBuildingPhotos.length} FOTO
                                                        </span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setLightboxPhoto(photo)} 
                                                            className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-md border border-white/10 shadow-sm cursor-pointer"
                                                            title="Perbesar Foto"
                                                        >
                                                            <ZoomIn size={14}/>
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleDeleteBuildingPhoto(idx)} 
                                                            className="p-2 rounded-xl bg-rose-600/80 text-white hover:bg-rose-700 transition-colors backdrop-blur-md border border-rose-400/30 shadow-sm cursor-pointer"
                                                            title="Hapus Foto Ini"
                                                        >
                                                            <Trash2 size={14}/>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Bottom Caption Bar on Main Slide */}
                                                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between pointer-events-none">
                                                    <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 shadow-lg max-w-[80%]">
                                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">
                                                            Kategori Foto Dokumentasi #{idx + 1}
                                                        </span>
                                                        <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-tight drop-shadow-sm">
                                                            {photo.label}
                                                        </h4>
                                                    </div>
                                                </div>

                                                {/* Prev / Next Navigation */}
                                                {allBuildingPhotos.length > 1 && (
                                                    <>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setSelectedHeroPhotoIdx(Math.max(0, idx - 1))} 
                                                            disabled={idx === 0}
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all disabled:opacity-20 backdrop-blur-md border border-white/10 shadow-md active:scale-95 cursor-pointer"
                                                        >
                                                            <ChevronLeft size={18}/>
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setSelectedHeroPhotoIdx(Math.min(allBuildingPhotos.length - 1, idx + 1))} 
                                                            disabled={idx === allBuildingPhotos.length - 1}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all disabled:opacity-20 backdrop-blur-md border border-white/10 shadow-md active:scale-95 cursor-pointer"
                                                        >
                                                            <ChevronRight size={18}/>
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {/* Thumbnail Strip with Complete Captions */}
                                            <div className="p-3 bg-slate-900 border-t border-white/10">
                                                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                                                    {allBuildingPhotos.map((p, i) => (
                                                        <button 
                                                            key={i} 
                                                            type="button"
                                                            onClick={() => setSelectedHeroPhotoIdx(i)}
                                                            className={`shrink-0 flex flex-col items-center gap-1.5 p-1.5 rounded-2xl border transition-all text-left group cursor-pointer ${
                                                                i === idx 
                                                                    ? 'bg-white/15 border-emerald-400 shadow-md ring-2 ring-emerald-400/30 scale-[1.02]' 
                                                                    : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100 hover:bg-white/10 hover:border-white/20'
                                                            }`}
                                                        >
                                                            <div className="w-20 sm:w-24 h-14 rounded-xl overflow-hidden relative shadow-inner bg-black/40">
                                                                <img src={p.url} alt={p.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                                                <span className="absolute bottom-1 right-1 px-1.5 py-0.2 bg-black/75 text-[8px] font-mono text-white rounded font-bold backdrop-blur-xs">
                                                                    #{i + 1}
                                                                </span>
                                                            </div>
                                                            <span className={`text-[10px] font-black uppercase tracking-wider max-w-[80px] sm:max-w-[96px] text-center leading-tight line-clamp-2 px-0.5 ${
                                                                i === idx ? 'text-emerald-300' : 'text-slate-300'
                                                            }`}>
                                                                {p.label}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="p-10 border-2 border-dashed border-slate-300 rounded-3xl text-center space-y-3 bg-slate-50">
                                    <Camera size={36} className="text-slate-300 mx-auto" />
                                    <p className="text-xs font-black text-slate-600 uppercase">Belum ada foto gedung terunggah</p>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs transition-all">
                                        <Upload size={14} />
                                        <span>Unggah Foto Gedung</span>
                                        <input type="file" multiple accept="image/*" onChange={handleImageFileSelect} className="hidden" />
                                    </label>
                                </div>
                            )}

                            {/* KARTU FASILITAS UMUM DENGAN TWO-WAY CAROUSEL SYNC & SMART SUB-INPUT */}
                            {(() => {
                                const allStandardFacilities = [
                                    'WiFi Cepat', 'Area Parkir', 'Dapur Bersama', 'CCTV 24 Jam', 'Ruang Tamu', 
                                    'Akses Kunci 24 Jam', 'Ruang Cuci Jemur', 'Kulkas Bersama', 'Dispenser Air',
                                    'Penjaga Kost', 'Listrik Termasuk', 'Air Bersih PDAM / Sumur'
                                ];
                                const activeFacilities = newPropForm.facilities || [];
                                const combinedList = Array.from(new Set([...activeFacilities, ...allStandardFacilities]));

                                const getItemVehicleIcon = (item: string) => {
                                    const lower = item.toLowerCase();
                                    if (lower.includes('motor')) return '🏍️';
                                    if (lower.includes('mobil')) return '🚗';
                                    if (lower.includes('sepeda')) return '🚲';
                                    return '✨';
                                };

                                return (
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                Fasilitas Umum Kost ({activeFacilities.length} Aktif)
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500">
                                                💡 Klik fasilitas untuk melihat foto dokumentasi / toggle status
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {combinedList.map((facName: string, fi: number) => {
                                                const isParking = facName.toLowerCase().includes('parkir');
                                                const parkingItems = newPropForm.publicParkingFacilities || ['Motor', 'Mobil'];
                                                const hasSubData = isParking && parkingItems.length > 0;

                                                const isFacilityActive = activeFacilities.includes(facName);
                                                const photoIndex = getFacilityPhotoIndex(facName);
                                                const hasPhoto = photoIndex !== -1;
                                                const isPhotoActive = hasPhoto && selectedHeroPhotoIdx === photoIndex;
                                                const Icon = getFacilityIconComponent(facName);

                                                return (
                                                    <div 
                                                        key={fi} 
                                                        onClick={() => {
                                                            if (hasPhoto) {
                                                                setSelectedHeroPhotoIdx(photoIndex);
                                                            }
                                                        }}
                                                        className={`rounded-2xl p-4 space-y-2.5 transition-all duration-200 text-left ${
                                                            hasPhoto ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''
                                                        } ${
                                                            isPhotoActive 
                                                                ? 'bg-emerald-50/90 border-2 border-emerald-500 shadow-md ring-4 ring-emerald-500/10' 
                                                                : isFacilityActive
                                                                    ? 'bg-slate-50 border border-slate-200/80 hover:border-slate-300'
                                                                    : 'bg-white/60 border border-dashed border-slate-200 opacity-65 hover:opacity-100'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                                    isPhotoActive 
                                                                        ? 'bg-emerald-600 text-white shadow-sm' 
                                                                        : isFacilityActive
                                                                            ? 'bg-emerald-100 text-emerald-700'
                                                                            : 'bg-slate-100 text-slate-400'
                                                                }`}>
                                                                    <Icon size={18}/>
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <span className={`text-xs font-black uppercase tracking-wide truncate block ${
                                                                        isPhotoActive ? 'text-emerald-950' : 'text-slate-900'
                                                                    }`}>
                                                                        {facName}
                                                                    </span>
                                                                    {hasPhoto && (
                                                                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                                                                            <Camera size={10} className="text-slate-400"/>
                                                                            <span className="hover:underline">{isPhotoActive ? 'Sedang Ditampilkan di Slider' : 'Lihat Foto di Slider'}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Toggle / Status Badge */}
                                                            <div className="shrink-0 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleFacility(facName)}
                                                                    className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                                                                        isFacilityActive
                                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                                                                    }`}
                                                                >
                                                                    {isFacilityActive ? <Check size={10}/> : null}
                                                                    <span>{isFacilityActive ? 'AKTIF' : '+ AKTIFKAN'}</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Sub-Data Rincian Parkir */}
                                                        {isParking && isFacilityActive && (
                                                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60" onClick={e => e.stopPropagation()}>
                                                                {['Motor', 'Mobil', 'Sepeda'].map(veh => {
                                                                    const isVehChecked = parkingItems.includes(veh);
                                                                    return (
                                                                        <button
                                                                            key={veh}
                                                                            type="button"
                                                                            onClick={() => toggleParkingVehicle(veh)}
                                                                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                                                                isVehChecked
                                                                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                                                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                                                                            }`}
                                                                        >
                                                                            <span>{getItemVehicleIcon(veh)}</span>
                                                                            <span>{veh}</span>
                                                                            {isVehChecked && <Check size={10}/>}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* LOKASI, ALAMAT & TITIK KOORDINAT (1:1 STRUCTURED) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3 shadow-2xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                                <MapPin size={13}/>
                                            </span>
                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                                                Alamat &amp; Titik Koordinat (Editable)
                                            </span>
                                        </div>
                                        <textarea
                                            rows={2}
                                            value={newPropForm.address || ''}
                                            onChange={e => setNewPropForm({ ...newPropForm, address: e.target.value })}
                                            placeholder="Alamat lengkap gedung kost, jalan, no rumah, patokan..."
                                            className="w-full text-xs text-slate-800 font-bold leading-relaxed bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500"
                                        />
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 text-xs">
                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex-1 min-w-[130px]">
                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Provinsi</span>
                                                <input
                                                    type="text"
                                                    value={newPropForm.province || detectProvinceFromAddress(newPropForm.address) || 'Sulawesi Selatan'}
                                                    onChange={e => setNewPropForm({ ...newPropForm, province: e.target.value })}
                                                    className="font-bold text-slate-800 text-xs w-full outline-none bg-transparent"
                                                />
                                            </div>
                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex-1 min-w-[130px]">
                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Kabupaten / Kota</span>
                                                <input
                                                    type="text"
                                                    value={newPropForm.city || 'Makassar'}
                                                    onChange={e => setNewPropForm({ ...newPropForm, city: e.target.value })}
                                                    className="font-bold text-slate-800 text-xs w-full outline-none bg-transparent"
                                                />
                                            </div>
                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex-1 min-w-[130px]">
                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Kecamatan / Area</span>
                                                <input
                                                    type="text"
                                                    value={newPropForm.area || ''}
                                                    onChange={e => setNewPropForm({ ...newPropForm, area: e.target.value })}
                                                    placeholder="Tamalanrea..."
                                                    className="font-bold text-slate-800 text-xs w-full outline-none bg-transparent"
                                                />
                                            </div>
                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex-1 min-w-[110px]">
                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Latitude</span>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={newPropForm.location?.lat ?? -5.147665}
                                                    onChange={e => setNewPropForm({ ...newPropForm, location: { ...(newPropForm.location || {}), lat: parseFloat(e.target.value) } })}
                                                    className="font-mono font-bold text-slate-800 text-xs w-full outline-none bg-transparent"
                                                />
                                            </div>
                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex-1 min-w-[110px]">
                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Longitude</span>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={newPropForm.location?.lng ?? 119.432731}
                                                    onChange={e => setNewPropForm({ ...newPropForm, location: { ...(newPropForm.location || {}), lng: parseFloat(e.target.value) } })}
                                                    className="font-mono font-bold text-slate-800 text-xs w-full outline-none bg-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Google Maps & Pin Lokasi</span>
                                        {(() => {
                                            const lat = newPropForm.location?.lat ?? -5.147665;
                                            const lng = newPropForm.location?.lng ?? 119.432731;
                                            return (
                                                <a 
                                                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider flex items-center gap-1 hover:underline"
                                                >
                                                    <MapPin size={11}/>
                                                    Buka Google Maps ↗
                                                </a>
                                            );
                                        })()}
                                    </div>
                                    <div className="h-44 sm:h-52 rounded-3xl overflow-hidden border border-slate-200 relative shadow-inner">
                                        <LocationPicker
                                            lat={newPropForm.location?.lat ?? -5.147665}
                                            lng={newPropForm.location?.lng ?? 119.432731}
                                            onLocationChange={(lat, lng, address, city, area) => {
                                                setNewPropForm((prev: any) => ({
                                                    ...prev,
                                                    location: { lat, lng },
                                                    address: address || prev.address,
                                                    city: city || prev.city,
                                                    area: area || prev.area,
                                                    province: detectProvinceFromAddress(address || prev.address)
                                                }));
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* KAMPUS & LANDMARK TERDEKAT DENGAN RUTE GOOGLE MAPS */}
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3.5 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                                            <Navigation size={13}/>
                                        </span>
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                                            Kampus &amp; Landmark Terdekat ({(newPropForm.campuses || []).length})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nama Kampus..."
                                            value={tempCampusName}
                                            onChange={e => setTempCampusName(e.target.value)}
                                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Jarak (1.2 km)..."
                                            value={tempCampusDist}
                                            onChange={e => setTempCampusDist(e.target.value)}
                                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none w-24"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCampus}
                                            className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-black uppercase cursor-pointer hover:bg-orange-600"
                                        >
                                            + Tambah
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(newPropForm.campuses || []).map((c: any, i: number) => {
                                        const cName = typeof c === 'string' ? c : (c?.name || '-');
                                        const cLat = typeof c === 'object' ? c?.lat : undefined;
                                        const cLng = typeof c === 'object' ? c?.lng : undefined;
                                        const dist = c?.distance || '1.2 km';
                                        const kostLat = newPropForm.location?.lat ?? -5.147665;
                                        const kostLng = newPropForm.location?.lng ?? 119.432731;
                                        const destinationParam = (cLat && cLng) ? `${cLat},${cLng}` : encodeURIComponent(`${cName}, Makassar`);
                                        const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${kostLat},${kostLng}&destination=${destinationParam}`;

                                        return (
                                            <div key={i} className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-orange-700 flex items-center justify-center shrink-0 text-base">
                                                            🏫
                                                        </span>
                                                        <div className="min-w-0">
                                                            <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                                                                {cName}
                                                            </h5>
                                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                <MapPin size={10} className="text-slate-400"/>
                                                                {cLat && cLng ? `Pin: ${Number(cLat).toFixed(4)}, ${Number(cLng).toFixed(4)}` : 'Makassar'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                                                            📍 {dist}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteCampus(i)}
                                                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Estimasi Waktu Tempuh */}
                                                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 text-[10px] font-bold">
                                                    <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1">
                                                        🚶 <span>15 mnt</span>
                                                    </span>
                                                    <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-1">
                                                        🏍️ <span>4 mnt</span>
                                                    </span>
                                                    <span className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-1">
                                                        🚗 <span>7 mnt</span>
                                                    </span>
                                                </div>

                                                {/* Tombol Lihat Rute Google Maps */}
                                                <a
                                                    href={mapsDirectionsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-98 shadow-2xs hover:shadow-xs"
                                                >
                                                    <Navigation size={11} className="text-orange-600"/>
                                                    <span>Lihat Rute di Google Maps ↗</span>
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* PERATURAN & KETENTUAN KOST */}
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                                            <ShieldAlert size={13}/>
                                        </span>
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                                            Peraturan &amp; Ketentuan Kost ({(newPropForm.rules || []).length})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Contoh: Dilarang merokok di kamar..."
                                            value={tempRuleInput}
                                            onChange={e => setTempRuleInput(e.target.value)}
                                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none sm:w-64"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddRule}
                                            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-black uppercase cursor-pointer hover:bg-rose-700"
                                        >
                                            + Tambah
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {(newPropForm.rules || []).map((r: string, i: number) => (
                                        <div key={i} className="bg-white border border-rose-100 rounded-2xl p-3.5 flex items-center justify-between gap-2.5 shadow-2xs">
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <span className="w-5 h-5 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 text-xs font-black mt-0.5">
                                                    ⛔
                                                </span>
                                                <span className="text-xs font-bold text-slate-800 leading-snug">
                                                    {r}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteRule(i)}
                                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0 cursor-pointer"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================================================== */}
                    {/* TAB 2: DATA KAMAR & PENGHUNI (1:1 DIRECT EDITABLE)   */}
                    {/* ==================================================== */}
                    {activeTab === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* GRID 4 TOP KPI GLANCE CARDS (1:1) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                                {/* Total Kamar */}
                                <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all">
                                    <span className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                        <DoorClosed size={20}/>
                                    </span>
                                    <div className="min-w-0">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                                            Total Kamar
                                        </span>
                                        <h4 className="text-lg font-black text-slate-900 leading-tight">
                                            {totalRooms} <span className="text-xs text-slate-500 font-bold">Unit</span>
                                        </h4>
                                        <span className="text-[10px] font-bold text-blue-600">Semua Tipe Kamar</span>
                                    </div>
                                </div>

                                {/* Kamar Terisi */}
                                <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all">
                                    <span className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                        <Lock size={20}/>
                                    </span>
                                    <div className="min-w-0">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                                            Kamar Terisi
                                        </span>
                                        <h4 className="text-lg font-black text-amber-600 leading-tight">
                                            {occupiedRooms} <span className="text-xs text-slate-500 font-bold">Unit</span>
                                        </h4>
                                        <span className="text-[10px] font-bold text-amber-700">Sedang Dihuni</span>
                                    </div>
                                </div>

                                {/* Kamar Kosong */}
                                <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all">
                                    <span className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Sparkles size={20}/>
                                    </span>
                                    <div className="min-w-0">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                                            Kamar Kosong
                                        </span>
                                        <h4 className="text-lg font-black text-emerald-600 leading-tight">
                                            {availableRooms} <span className="text-xs text-slate-500 font-bold">Unit</span>
                                        </h4>
                                        <span className="text-[10px] font-bold text-emerald-700">Siap Pasarkan</span>
                                    </div>
                                </div>

                                {/* Total Penghuni */}
                                <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all">
                                    <span className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                        <Users size={20}/>
                                    </span>
                                    <div className="min-w-0">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                                            Total Penghuni
                                        </span>
                                        <h4 className="text-lg font-black text-indigo-600 leading-tight">
                                            {totalOccupants} <span className="text-xs text-slate-500 font-bold">Orang</span>
                                        </h4>
                                        <span className="text-[10px] font-bold text-indigo-700">Penyewa Terdata</span>
                                    </div>
                                </div>
                            </div>

                            {/* CAROUSEL GALERI FOTO SELURUH KAMAR & FILTER PER-KAMAR */}
                            {allRoomPhotosWithMetadata.length > 0 && (
                                <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
                                    {/* Header Galeri Foto Kamar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-[#ff7a00] flex items-center justify-center shrink-0">
                                                <Camera size={18} />
                                            </span>
                                            <div>
                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                                    Galeri Foto Kamar Hasil Pendataan
                                                </h3>
                                                <p className="text-[10px] text-slate-400 font-bold">
                                                    {selectedRoomGalleryFilter === 'all'
                                                        ? `Menampilkan seluruh ${allRoomPhotosWithMetadata.length} foto kamar yang terkumpul`
                                                        : `Menampilkan foto kamar terfilter`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                                                {displayedRoomPhotos.length} Foto Tersedia
                                            </span>
                                        </div>
                                    </div>

                                    {/* Hero Carousel Frame Display */}
                                    {displayedRoomPhotos.length > 0 && currentActiveRoomPhoto ? (
                                        <div className="space-y-3">
                                            <div className="relative aspect-video sm:aspect-21/9 max-h-[360px] w-full rounded-2xl overflow-hidden bg-slate-950 group shadow-inner flex items-center justify-center">
                                                <img
                                                    src={currentActiveRoomPhoto.url}
                                                    alt={currentActiveRoomPhoto.label || 'Foto Kamar'}
                                                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                                                {/* Top Category Badge */}
                                                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
                                                    <span className="px-2.5 py-1 rounded-lg bg-[#ff7a00]/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                                                        <Camera size={11} />
                                                        {currentActiveRoomPhoto.label || 'Foto Kamar'}
                                                    </span>
                                                </div>

                                                {/* Floating Room Detail Card (Bottom-Left) */}
                                                <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm rounded-xl p-3 text-white space-y-1 min-w-[180px] max-w-[280px] sm:max-w-none text-left z-10 pointer-events-none shadow-md border border-white/10">
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Nomor Kamar</p>
                                                    <p className="text-base font-black leading-tight">{currentActiveRoomPhoto.roomName}</p>
                                                    <p className="text-[10px] font-bold text-slate-300">{currentActiveRoomPhoto.u?.size || '3x4 meter'}</p>
                                                    {currentActiveRoomPhoto.u?.price ? (
                                                        <p className="text-sm font-black text-emerald-400">TARIF {FORMAT_CURRENCY(currentActiveRoomPhoto.u.price)}/bln</p>
                                                    ) : null}
                                                    {((currentActiveRoomPhoto.u?.facilities && currentActiveRoomPhoto.u.facilities.length > 0) ? currentActiveRoomPhoto.u.facilities : (currentActiveRoomPhoto.u?.roomFacilities || [])).length > 0 && (
                                                        <div className="flex flex-wrap gap-1 pt-1 max-w-[260px]">
                                                            {((currentActiveRoomPhoto.u?.facilities && currentActiveRoomPhoto.u.facilities.length > 0) ? currentActiveRoomPhoto.u.facilities : (currentActiveRoomPhoto.u?.roomFacilities || [])).slice(0, 3).map((f: string, i: number) => (
                                                                <span key={i} className="inline-block px-1.5 py-0.5 rounded-md bg-white/20 text-[9px] font-black text-white">{f}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Photo Counter */}
                                                <div className="absolute top-3 right-3 pointer-events-none">
                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black tracking-widest shadow-sm">
                                                        {activeRoomPhotoIdx + 1} / {displayedRoomPhotos.length}
                                                    </span>
                                                </div>

                                                {/* Navigation Left / Right Buttons */}
                                                {displayedRoomPhotos.length > 1 && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedRoomGalleryPhotoIndex(prev => (prev > 0 ? prev - 1 : displayedRoomPhotos.length - 1))}
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 z-20 cursor-pointer"
                                                        >
                                                            <ChevronLeft size={20} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedRoomGalleryPhotoIndex(prev => (prev < displayedRoomPhotos.length - 1 ? prev + 1 : 0))}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 z-20 cursor-pointer"
                                                        >
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {/* Horizontal Thumbnail Strip */}
                                            {displayedRoomPhotos.length > 1 && (
                                                <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                                                    {displayedRoomPhotos.map((p, pIdx) => (
                                                        <button
                                                            key={pIdx}
                                                            type="button"
                                                            onClick={() => setSelectedRoomGalleryPhotoIndex(pIdx)}
                                                            className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all group cursor-pointer ${
                                                                pIdx === activeRoomPhotoIdx
                                                                    ? 'border-[#ff7a00] ring-2 ring-orange-400/30 scale-105 shadow-md'
                                                                    : 'border-slate-200 opacity-65 hover:opacity-100'
                                                            }`}
                                                        >
                                                            <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                                                            <span className="absolute top-1 left-1 bg-slate-900/85 text-[8px] font-black text-orange-300 px-1.5 py-0.2 rounded-md shadow-xs pointer-events-none">
                                                                {p.roomName}
                                                            </span>
                                                            <span className="absolute bottom-0 inset-x-0 bg-slate-900/85 backdrop-blur-xs text-white text-[8.5px] font-bold px-1.5 py-0.5 truncate text-center block">
                                                                {p.label || 'Foto Kamar'}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* LIST TIPE KAMAR SEJATI (LEVEL 1 PARENT ACCORDION) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                        Daftar Tipe Kamar & Unit Kelolaan
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleAddRoomType}
                                        className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
                                    >
                                        <Plus size={14} />
                                        <span>+ Tambah Tipe Kamar</span>
                                    </button>
                                </div>

                                {currentRoomTypes.map((rt: any, rtIdx: number) => {
                                    const isExpanded = Boolean(expandedRoomTypes[rtIdx]);
                                    const occupiedKey = `rt${rtIdx}_occ`;
                                    const availableKey = `rt${rtIdx}_avail`;
                                    const isOccExpanded = Boolean(expandedStatusSections[occupiedKey] ?? true);
                                    const isAvailExpanded = Boolean(expandedStatusSections[availableKey] ?? true);

                                    const allUnitsInType = Array.isArray(rt.rooms) ? rt.rooms : [];
                                    const occupiedUnits = allUnitsInType.map((u: any, uIdx: number) => ({ ...u, originalIdx: uIdx }))
                                        .filter((u: any) => u.status === 'terisi' || Boolean(u.tenantName || u.residentName));
                                    const vacantUnits = allUnitsInType.map((u: any, uIdx: number) => ({ ...u, originalIdx: uIdx }))
                                        .filter((u: any) => !(u.status === 'terisi' || Boolean(u.tenantName || u.residentName)));

                                    return (
                                        <div key={rtIdx} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                                            {/* LEVEL 1: ACCORDION HEADER TIPE KAMAR */}
                                            <div className="w-full flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50/80 transition-colors text-left gap-4 border-b border-slate-100">
                                                <div 
                                                    className="flex items-start gap-3.5 min-w-0 flex-1 cursor-pointer"
                                                    onClick={() => setExpandedRoomTypes(prev => ({ ...prev, [rtIdx]: !isExpanded }))}
                                                >
                                                    <span className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs mt-0.5">
                                                        <Bed size={20}/>
                                                    </span>
                                                    <div className="min-w-0 flex-1 space-y-1.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipe Kamar #{rtIdx + 1}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={rt.name || ''}
                                                                onChange={e => updateRoomTypeField(rtIdx, 'name', e.target.value)}
                                                                onClick={e => e.stopPropagation()}
                                                                placeholder="Nama Tipe Kamar..."
                                                                className="text-sm font-black text-slate-900 uppercase tracking-tight bg-slate-100/70 hover:bg-white focus:bg-white rounded-lg px-2 py-0.5 outline-none"
                                                            />
                                                        </div>
                                                        {/* Specs & Full Facility Chips */}
                                                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-[10px] font-black text-blue-800 flex items-center gap-1 shadow-2xs">
                                                                📐
                                                                <input
                                                                    type="text"
                                                                    value={rt.size || '3x4 meter'}
                                                                    onChange={e => updateRoomTypeField(rtIdx, 'size', e.target.value)}
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="w-20 bg-transparent outline-none font-black text-blue-900"
                                                                />
                                                            </span>
                                                            {(rt.roomFacilities || []).map((f: string, fi: number) => (
                                                                <span key={`rf_${fi}`} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/90 text-[10px] font-bold text-slate-700 shadow-2xs">
                                                                    {f}
                                                                </span>
                                                            ))}
                                                            {(rt.bathroomFacilities || []).map((bf: string, bfi: number) => (
                                                                <span key={`rbf_${bfi}`} className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/90 text-[10px] font-bold text-sky-800 shadow-2xs">
                                                                    {bf}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                                    <div className="text-right" onClick={e => e.stopPropagation()}>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs font-bold text-slate-400">Rp</span>
                                                            <input
                                                                type="number"
                                                                value={rt.price || 0}
                                                                onChange={e => updateRoomTypeField(rtIdx, 'price', Number(e.target.value))}
                                                                className="text-sm font-black text-emerald-700 w-24 text-right bg-slate-100/70 hover:bg-white focus:bg-white rounded px-1.5 py-0.5 outline-none"
                                                            />
                                                            <span className="text-[10px] text-slate-400 font-bold">/bln</span>
                                                        </div>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                                        ✨ {vacantUnits.length} Kosong
                                                    </span>
                                                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                                                        🔒 {occupiedUnits.length} Dihuni
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedRoomTypes(prev => ({ ...prev, [rtIdx]: !isExpanded }))}
                                                        className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 cursor-pointer"
                                                    >
                                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRoomType(rtIdx, rt.name)}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer"
                                                        title="Hapus Tipe Kamar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* LEVEL 2: BODY TIPE KAMAR (DUA SUB-PARENT ACCORDIONS BERPASANGAN) */}
                                            {isExpanded && (
                                                <div className="p-5 space-y-4">
                                                    <div className="flex justify-between items-center pb-1">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                                            Unit Kamar pada Tipe Ini ({allUnitsInType.length} Unit)
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddUnitToType(rtIdx)}
                                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-2xs"
                                                        >
                                                            <Plus size={12} />
                                                            <span>+ Tambah Kamar ke Tipe Ini</span>
                                                        </button>
                                                    </div>

                                                    {/* Sub-Parent 1: KAMAR TERISI (AMBER) */}
                                                    <div className="rounded-2xl border border-amber-200 overflow-hidden bg-white shadow-2xs">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedStatusSections(prev => ({ ...prev, [occupiedKey]: !isOccExpanded }))}
                                                            className="w-full flex items-center justify-between p-4 bg-amber-50/80 hover:bg-amber-100/80 transition-colors text-left cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm shrink-0">
                                                                    🔒
                                                                </span>
                                                                <div>
                                                                    <span className="text-xs font-black text-amber-900 uppercase tracking-wide">KAMAR SEDANG DIHUNI / TERISI</span>
                                                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">{occupiedUnits.length} UNIT</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-amber-700 text-[10px] font-black uppercase tracking-wider">
                                                                <span>{isOccExpanded ? 'TUTUP LIST' : 'BUKA LIST'}</span>
                                                                {isOccExpanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                                                            </div>
                                                        </button>

                                                        {isOccExpanded && (
                                                            <div className="p-4 bg-amber-50/30 border-t border-amber-100 space-y-4">
                                                                {occupiedUnits.length > 0 ? (
                                                                    occupiedUnits.map((u: any) => {
                                                                        const origIdx = u.originalIdx;
                                                                        const unitPhotos = getRoomPhotos(u);
                                                                        const uName = formatRoomName(u.roomNumber || u.name, origIdx);
                                                                        const unifiedFacilities = buildUnifiedFacilities(
                                                                            u.facilities || rt.roomFacilities || [],
                                                                            u.bathroomFacilities || rt.bathroomFacilities || [],
                                                                            u.kitchenFacilities || rt.kitchenFacilities || []
                                                                        );

                                                                        return (
                                                                            <div key={origIdx} className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-sm space-y-3.5 hover:border-amber-300 transition-all">
                                                                                {/* Top Bar: Room Name & Status Switch */}
                                                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100/80 pb-2.5">
                                                                                    <div className="flex items-center gap-2.5">
                                                                                        <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
                                                                                            <Lock size={15} />
                                                                                        </span>
                                                                                        <div>
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest">UNIT KAMAR</span>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => toggleUnitStatus(rtIdx, origIdx, 'terisi')}
                                                                                                    className="px-2 py-0.2 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[9px] font-black uppercase hover:bg-emerald-100 hover:text-emerald-900 hover:border-emerald-300 transition-colors cursor-pointer"
                                                                                                    title="Klik untuk ubah menjadi Kosong"
                                                                                                >
                                                                                                    🔒 Dihuni (Klik untuk Kosongkan)
                                                                                                </button>
                                                                                            </div>
                                                                                            <input
                                                                                                type="text"
                                                                                                value={u.roomNumber || u.name || ''}
                                                                                                onChange={e => updateUnit(rtIdx, origIdx, { roomNumber: e.target.value })}
                                                                                                className="text-sm font-black text-slate-900 leading-tight bg-slate-50 hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-none"
                                                                                            />
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="text-right">
                                                                                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Tarif Sewa</span>
                                                                                            <span className="text-xs font-black text-emerald-700">{FORMAT_CURRENCY(u.price || rt.price)}<span className="text-[9px] text-slate-400 font-bold">/bln</span></span>
                                                                                        </div>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleDeleteUnit(rtIdx, origIdx, uName)}
                                                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                                                                            title="Hapus Kamar Ini"
                                                                                        >
                                                                                            <Trash2 size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Grid Data Penghuni & Detail Sewa (Editable) */}
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                                                                                    {/* 1. Nama Penghuni */}
                                                                                    <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 space-y-1">
                                                                                        <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block">
                                                                                            👤 Nama Penghuni
                                                                                        </span>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={u.tenantName || u.residentName || ''}
                                                                                            onChange={e => updateUnit(rtIdx, origIdx, { tenantName: e.target.value, residentName: e.target.value })}
                                                                                            placeholder="Nama penyewa..."
                                                                                            className="font-black text-slate-900 text-xs w-full bg-white border border-amber-200 rounded-lg px-2 py-1 outline-none"
                                                                                        />
                                                                                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                                                            <span>Penghuni:</span>
                                                                                            <input
                                                                                                type="number"
                                                                                                min={1}
                                                                                                max={5}
                                                                                                value={u.currentOccupants || 1}
                                                                                                onChange={e => updateUnit(rtIdx, origIdx, { currentOccupants: Number(e.target.value) })}
                                                                                                className="w-10 bg-white border border-slate-200 rounded px-1 text-center font-bold text-slate-800"
                                                                                            />
                                                                                            <span>Orang</span>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* 2. Kontak WhatsApp */}
                                                                                    <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 space-y-1">
                                                                                        <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block">
                                                                                            📱 Kontak WhatsApp
                                                                                        </span>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={u.tenantPhone || u.residentPhone || ''}
                                                                                            onChange={e => updateUnit(rtIdx, origIdx, { tenantPhone: e.target.value, residentPhone: e.target.value })}
                                                                                            placeholder="08123456789"
                                                                                            className="font-black text-slate-900 text-xs w-full bg-white border border-amber-200 rounded-lg px-2 py-1 outline-none font-mono"
                                                                                        />
                                                                                        {(u.tenantPhone || u.residentPhone) && (
                                                                                            <a 
                                                                                                href={`https://wa.me/${String(u.tenantPhone || u.residentPhone).replace(/\D/g, '')}`} 
                                                                                                target="_blank" 
                                                                                                rel="noreferrer" 
                                                                                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline"
                                                                                            >
                                                                                                Hubungi via WA ↗
                                                                                            </a>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* 3. Periode & Tagihan */}
                                                                                    <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 sm:col-span-2 md:col-span-1 space-y-1">
                                                                                        <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block">
                                                                                            📅 Periode &amp; Tagihan
                                                                                        </span>
                                                                                        <select
                                                                                            value={u.billingPeriod || u.paymentPeriod || 'bulanan'}
                                                                                            onChange={e => updateUnit(rtIdx, origIdx, { billingPeriod: e.target.value, paymentPeriod: e.target.value })}
                                                                                            className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none capitalize"
                                                                                        >
                                                                                            <option value="bulanan">Bulanan</option>
                                                                                            <option value="triwulan">3 Bulan (Triwulan)</option>
                                                                                            <option value="semester">6 Bulan (Semester)</option>
                                                                                            <option value="tahunan">Tahunan</option>
                                                                                        </select>
                                                                                        <div className="flex items-center justify-between text-[10px] pt-1">
                                                                                            <span className="text-slate-500">Jatuh Tempo:</span>
                                                                                            <input
                                                                                                type="date"
                                                                                                value={u.dueDate || u.endDate || ''}
                                                                                                onChange={e => updateUnit(rtIdx, origIdx, { dueDate: e.target.value, endDate: e.target.value })}
                                                                                                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-amber-800 outline-none text-[10px]"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Spesifikasi & Fasilitas Kamar Terpasang */}
                                                                                <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 space-y-2 text-xs">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">
                                                                                            🛋️ Fasilitas &amp; Spesifikasi Terpasang
                                                                                        </span>
                                                                                        <span className="px-2 py-0.5 rounded bg-slate-200/80 text-[9px] font-black text-slate-700">
                                                                                            📐 {u.size || rt.size || '3x4 meter'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                                                        {unifiedFacilities.map((uf) => {
                                                                                            const isThisFacilityHovered = hoveredFacility?.unitId === String(origIdx) && hoveredFacility?.facilityId === uf.id;
                                                                                            const isMatchedByPhotoHover = hoveredPhoto?.unitId === String(origIdx) && isFacilityMatchingPhoto(uf.allKeywords, hoveredPhoto.label);
                                                                                            const isHighlighted = isThisFacilityHovered || isMatchedByPhotoHover;
                                                                                            const hasMatchingPhoto = unitPhotos.some(p => isFacilityMatchingPhoto(uf.allKeywords, p.label));

                                                                                            return (
                                                                                                <div
                                                                                                    key={uf.id}
                                                                                                    onMouseEnter={() => setHoveredFacility({ unitId: String(origIdx), facilityId: uf.id, keywords: uf.allKeywords })}
                                                                                                    onMouseLeave={() => setHoveredFacility(null)}
                                                                                                    className={`inline-flex flex-col justify-center px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none gap-1 ${
                                                                                                        isHighlighted
                                                                                                            ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400 scale-105 z-10'
                                                                                                            : hasMatchingPhoto
                                                                                                                ? 'bg-white border-amber-300 text-amber-950 hover:border-amber-500 hover:bg-amber-50 shadow-2xs'
                                                                                                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                                                                                    }`}
                                                                                                >
                                                                                                    <div className="flex items-center gap-1.5">
                                                                                                        {getRoomFacilityIcon(uf.mainName, 12)}
                                                                                                        <span className="font-black text-[10px]">{uf.mainName}</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Dokumentasi Foto Unit Kamar */}
                                                                                <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 space-y-2">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-[9px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                                                                            <Camera size={13} className="text-emerald-700" />
                                                                                            Foto Dokumentasi Unit ({unitPhotos.length})
                                                                                        </span>
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            {['interior', 'kasur', 'wc', 'jendela'].map(ck => (
                                                                                                <label key={ck} className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black uppercase cursor-pointer transition-all">
                                                                                                    + {ck}
                                                                                                    <input
                                                                                                        type="file"
                                                                                                        accept="image/*"
                                                                                                        onChange={e => handleUploadRoomPhoto(rtIdx, origIdx, ck, e)}
                                                                                                        className="hidden"
                                                                                                    />
                                                                                                </label>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                    {unitPhotos.length > 0 ? (
                                                                                        <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-1 scrollbar-thin">
                                                                                            {unitPhotos.map((photo: any, pi: number) => {
                                                                                                return (
                                                                                                    <div key={pi} className="relative w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-emerald-200 group bg-black shadow-2xs">
                                                                                                        <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                                                                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                                                                                                            <button
                                                                                                                type="button"
                                                                                                                onClick={() => setLightboxPhoto(photo)}
                                                                                                                className="p-1 bg-white/80 hover:bg-white text-slate-900 rounded-lg cursor-pointer"
                                                                                                                title="Zoom"
                                                                                                            >
                                                                                                                <ZoomIn size={12} />
                                                                                                            </button>
                                                                                                            <button
                                                                                                                type="button"
                                                                                                                onClick={() => handleDeleteRoomPhoto(rtIdx, origIdx, photo.url)}
                                                                                                                className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
                                                                                                                title="Hapus Foto"
                                                                                                            >
                                                                                                                <Trash2 size={12} />
                                                                                                            </button>
                                                                                                        </div>
                                                                                                        <div className="absolute inset-x-0 bottom-0 py-0.5 px-1 text-[8px] font-bold truncate text-center bg-black/70 text-white">
                                                                                                            {photo.label}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="py-2 text-center text-[10px] text-slate-400 italic">
                                                                                            Belum ada foto unit terunggah. Gunakan tombol di atas untuk menambah foto.
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Catatan Kondisi Kamar */}
                                                                                <div className="space-y-1">
                                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                                                                                        📝 Catatan Kondisi Kamar
                                                                                    </span>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={u.notes || ''}
                                                                                        onChange={e => updateUnit(rtIdx, origIdx, { notes: e.target.value })}
                                                                                        placeholder="Catatan kondisi kamar..."
                                                                                        className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <div className="p-4 bg-white rounded-xl border border-dashed border-amber-200 text-center text-xs font-bold text-amber-800">
                                                                        Tidak ada kamar terisi pada tipe ini.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Sub-Parent 2: KAMAR KOSONG / SIAP HUNI (EMERALD) */}
                                                    <div className="rounded-2xl border border-emerald-200 overflow-hidden bg-white shadow-2xs">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedStatusSections(prev => ({ ...prev, [availableKey]: !isAvailExpanded }))}
                                                            className="w-full flex items-center justify-between p-4 bg-emerald-50/80 hover:bg-emerald-100/80 transition-colors text-left cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                                                                    ✨
                                                                </span>
                                                                <div>
                                                                    <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">KAMAR KOSONG / SIAP HUNI</span>
                                                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black">{vacantUnits.length} UNIT</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                                                                <span>{isAvailExpanded ? 'TUTUP LIST' : 'BUKA LIST'}</span>
                                                                {isAvailExpanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                                                            </div>
                                                        </button>

                                                        {isAvailExpanded && (
                                                            <div className="p-4 bg-emerald-50/30 border-t border-emerald-100 space-y-4">
                                                                {vacantUnits.length > 0 ? (
                                                                    vacantUnits.map((u: any) => {
                                                                        const origIdx = u.originalIdx;
                                                                        const unitPhotos = getRoomPhotos(u);
                                                                        const uName = formatRoomName(u.roomNumber || u.name, origIdx);
                                                                        const unifiedFacilities = buildUnifiedFacilities(
                                                                            u.facilities || rt.roomFacilities || [],
                                                                            u.bathroomFacilities || rt.bathroomFacilities || [],
                                                                            u.kitchenFacilities || rt.kitchenFacilities || []
                                                                        );

                                                                        return (
                                                                            <div key={origIdx} className="bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-sm space-y-3.5 hover:border-emerald-300 transition-all">
                                                                                {/* Top Bar: Room Name & Status Switch */}
                                                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/80 pb-2.5">
                                                                                    <div className="flex items-center gap-2.5">
                                                                                        <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                                                                                            <Sparkles size={15} />
                                                                                        </span>
                                                                                        <div>
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">UNIT KAMAR</span>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => toggleUnitStatus(rtIdx, origIdx, 'kosong')}
                                                                                                    className="px-2 py-0.2 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-[9px] font-black uppercase hover:bg-amber-100 hover:text-amber-900 hover:border-amber-300 transition-colors cursor-pointer"
                                                                                                    title="Klik untuk pasang penghuni (Terisi)"
                                                                                                >
                                                                                                    ✨ Kosong (Klik untuk Pasang Penghuni)
                                                                                                </button>
                                                                                            </div>
                                                                                            <input
                                                                                                type="text"
                                                                                                value={u.roomNumber || u.name || ''}
                                                                                                onChange={e => updateUnit(rtIdx, origIdx, { roomNumber: e.target.value })}
                                                                                                className="text-sm font-black text-slate-900 leading-tight bg-slate-50 hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 outline-none"
                                                                                            />
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="text-right">
                                                                                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Tarif Sewa</span>
                                                                                            <span className="text-xs font-black text-emerald-700">{FORMAT_CURRENCY(u.price || rt.price)}<span className="text-[9px] text-slate-400 font-bold">/bln</span></span>
                                                                                        </div>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleDeleteUnit(rtIdx, origIdx, uName)}
                                                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                                                                            title="Hapus Kamar Ini"
                                                                                        >
                                                                                            <Trash2 size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Status Banner Kosong */}
                                                                                <div className="p-3 bg-emerald-50 rounded-xl border border-dashed border-emerald-200 flex items-center justify-between text-xs">
                                                                                    <span className="font-bold text-emerald-800">
                                                                                        ✨ Unit kamar ini siap dihuni dan dipasarkan ke calon penyewa
                                                                                    </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => toggleUnitStatus(rtIdx, origIdx, 'kosong')}
                                                                                        className="text-[10px] font-black text-orange-600 uppercase hover:underline cursor-pointer"
                                                                                    >
                                                                                        + Masukkan Data Penghuni
                                                                                    </button>
                                                                                </div>

                                                                                {/* Grid Spesifikasi Kamar & Kelengkapan (1:1 Identik Review Survei) */}
                                                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                                                                    {/* 1. Dimensi Kamar */}
                                                                                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
                                                                                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block mb-1">
                                                                                            📐 Ukuran Kamar
                                                                                        </span>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={u.size || rt.size || '3x4 meter'}
                                                                                            onChange={e => updateUnit(rtIdx, origIdx, { size: e.target.value })}
                                                                                            className="font-black text-slate-900 bg-white border border-emerald-200 rounded px-2 py-0.5 text-xs w-full outline-none"
                                                                                        />
                                                                                        <span className="text-[10px] text-slate-500 font-semibold block mt-1">Ruangan Kosong</span>
                                                                                    </div>

                                                                                    {/* 2. Kelengkapan Kamar Ber-Icon & Interaktif */}
                                                                                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 sm:col-span-2 space-y-1.5">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">
                                                                                                🛋️ Fasilitas Terpasang
                                                                                            </span>
                                                                                            <span className="text-[8.5px] text-emerald-700/80 font-medium hidden sm:inline">
                                                                                                (Sorot fasilitas untuk melihat foto terkait 🎯)
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                                                            {unifiedFacilities.map((uf) => {
                                                                                                const isThisFacilityHovered = hoveredFacility?.unitId === String(origIdx) && hoveredFacility?.facilityId === uf.id;
                                                                                                const isMatchedByPhotoHover = hoveredPhoto?.unitId === String(origIdx) && isFacilityMatchingPhoto(uf.allKeywords, hoveredPhoto.label);
                                                                                                const isHighlighted = isThisFacilityHovered || isMatchedByPhotoHover;
                                                                                                const hasMatchingPhoto = unitPhotos.some(p => isFacilityMatchingPhoto(uf.allKeywords, p.label));

                                                                                                return (
                                                                                                    <div
                                                                                                        key={uf.id}
                                                                                                        onMouseEnter={() => setHoveredFacility({ unitId: String(origIdx), facilityId: uf.id, keywords: uf.allKeywords })}
                                                                                                        onMouseLeave={() => setHoveredFacility(null)}
                                                                                                        className={`inline-flex flex-col justify-center px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none gap-1 ${
                                                                                                            isHighlighted
                                                                                                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400 scale-105 z-10'
                                                                                                                : hasMatchingPhoto
                                                                                                                    ? 'bg-white border-emerald-300 text-emerald-950 hover:border-emerald-500 hover:bg-emerald-50 shadow-2xs'
                                                                                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                                                                                        }`}
                                                                                                    >
                                                                                                        <div className="flex items-center gap-1.5">
                                                                                                            {getRoomFacilityIcon(uf.mainName, 12)}
                                                                                                            <span className="font-black text-[10px]">{uf.mainName}</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Dokumentasi Foto Unit Kamar */}
                                                                                <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 space-y-2">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-[9px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                                                                            <Camera size={13} className="text-emerald-700" />
                                                                                            Foto Dokumentasi Unit ({unitPhotos.length})
                                                                                        </span>
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            {['interior', 'kasur', 'wc', 'jendela'].map(ck => (
                                                                                                <label key={ck} className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black uppercase cursor-pointer transition-all">
                                                                                                    + {ck}
                                                                                                    <input
                                                                                                        type="file"
                                                                                                        accept="image/*"
                                                                                                        onChange={e => handleUploadRoomPhoto(rtIdx, origIdx, ck, e)}
                                                                                                        className="hidden"
                                                                                                    />
                                                                                                </label>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                    {unitPhotos.length > 0 ? (
                                                                                        <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-1 scrollbar-thin">
                                                                                            {unitPhotos.map((photo: any, pi: number) => (
                                                                                                <div key={pi} className="relative w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-emerald-200 group bg-black shadow-2xs">
                                                                                                    <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                                                                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={() => setLightboxPhoto(photo)}
                                                                                                            className="p-1 bg-white/80 hover:bg-white text-slate-900 rounded-lg cursor-pointer"
                                                                                                            title="Zoom"
                                                                                                        >
                                                                                                            <ZoomIn size={12} />
                                                                                                        </button>
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={() => handleDeleteRoomPhoto(rtIdx, origIdx, photo.url)}
                                                                                                            className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
                                                                                                            title="Hapus Foto"
                                                                                                        >
                                                                                                            <Trash2 size={12} />
                                                                                                        </button>
                                                                                                    </div>
                                                                                                    <div className="absolute inset-x-0 bottom-0 py-0.5 px-1 text-[8px] font-bold truncate text-center bg-black/70 text-white">
                                                                                                        {photo.label}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="py-2 text-center text-[10px] text-slate-400 italic">
                                                                                            Belum ada foto unit terunggah. Gunakan tombol di atas untuk menambah foto.
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Catatan Kondisi Kamar */}
                                                                                <div className="space-y-1">
                                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                                                                                        📝 Catatan Kondisi Kamar
                                                                                    </span>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={u.notes || ''}
                                                                                        onChange={e => updateUnit(rtIdx, origIdx, { notes: e.target.value })}
                                                                                        placeholder="Catatan kondisi kamar..."
                                                                                        className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <div className="p-4 bg-white rounded-xl border border-dashed border-emerald-200 text-center text-xs font-bold text-emerald-800">
                                                                        Seluruh unit pada tipe kamar ini sedang terisi (0 kamar kosong).
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ==================================================== */}
                    {/* TAB 3: DATA MITRA & KERJASAMA (1:1 STRUCTURED)       */}
                    {/* ==================================================== */}
                    {activeTab === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* DOKUMEN PERJANJIAN KEMITRAAN (1:1) */}
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dokumen Perjanjian Kemitraan</span>
                                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                            Salinan Syarat &amp; Ketentuan Penggunaan KostManager (Auto-Pilot)
                                        </h4>
                                    </div>
                                    <span className="self-start sm:self-auto px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                                        <Check size={12} className="text-emerald-700"/> Disetujui Mitra Secara Digital
                                    </span>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-3.5 leading-relaxed max-h-72 overflow-y-auto font-medium shadow-inner">
                                    <p className="font-bold text-slate-900 text-xs pb-1 border-b border-slate-100">Perjanjian Pengelolaan Properti Kos &amp; Layanan Manajemen KostManager RuangSinggah:</p>
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-900 text-xs">1. Mekanisme &amp; Otorisasi Pengelolaan Auto-Pilot</p>
                                        <p className="text-[11px] text-slate-600">Mitra Pemilik Kos memberikan hak dan wewenang eksklusif kepada platform RuangSinggah untuk mengelola pencatatan reservasi, publikasi listing properti, penerimaan calon penghuni, serta penagihan otomatis biaya sewa bulanan kamar sesuai data yang diverifikasi.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-900 text-xs">2. Akurasi &amp; Validitas Data Lapangan</p>
                                        <p className="text-[11px] text-slate-600">Mitra bertanggung jawab penuh atas kebenaran seluruh informasi properti, tarif sewa kamar, spesifikasi fasilitas, serta ketersediaan unit kamar yang didata bersama agen surveyor lapangan RuangSinggah.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-900 text-xs">3. Penyaluran Hasil Sewa &amp; Transparansi Keuangan</p>
                                        <p className="text-[11px] text-slate-600">Seluruh transaksi pembayaran sewa penghuni diproses melalui rekening penampung resmi platform dan disalurkan secara transparan dan berkala ke rekening terdaftar Mitra dengan laporan keuangan real-time pada portal KostManager.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-900 text-xs">4. Legalitas Kepemilikan &amp; Hak Pengelolaan</p>
                                        <p className="text-[11px] text-slate-600">Mitra menyatakan dan menjamin bahwa properti yang didaftarkan berstatus sah secara hukum, tidak dalam sengketa, dan memiliki izin operasional pemondokan / rumah kos sesuai perundang-undangan yang berlaku.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                    {['Persetujuan Program Auto-Pilot', 'Kebenaran Hak Kelola Properti', 'Otorisasi Pemasaran RuangSinggah'].map((item, i) => (
                                        <div key={i} className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0 border border-emerald-100">
                                                ✓
                                            </span>
                                            <span className="text-xs font-bold text-slate-800">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DATA MITRA PEMILIK & REKENING PENAMPUNG */}
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <Users size={16} className="text-[#ff7a00]" />
                                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Mitra Pemilik (Owner Payout)</h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Profil Pemilik Terdaftar</span>
                                        <h5 className="font-black text-sm text-slate-900">{selectedOwner?.name || 'Belum dipilih'}</h5>
                                        <p className="text-xs text-slate-500 font-mono">📱 {selectedOwner?.phone || '-'}</p>
                                        <button
                                            type="button"
                                            onClick={() => setIsOwnerDropdownOpen(true)}
                                            className="text-[11px] font-black text-orange-600 hover:underline pt-1 block cursor-pointer"
                                        >
                                            Ganti Pemilik Mitra...
                                        </button>
                                    </div>

                                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
                                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block">Rekening Penyaluran Hasil Sewa</span>
                                        <h5 className="font-black text-sm text-emerald-950">Bank Central Asia (BCA)</h5>
                                        <p className="text-xs text-emerald-900 font-mono font-bold">123-456-7890 a.n {selectedOwner?.name || 'Mitra'}</p>
                                        <span className="text-[9px] text-emerald-700 font-bold block">Penyaluran otomatis terjadwal via sistem</span>
                                    </div>
                                </div>
                            </div>

                            {/* OMNICHANNEL WHATSAPP ROUTER */}
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
                                            placeholder="Contoh: CS RuangSinggah / Pengelola"
                                            value={newPropForm.omnichannelContactName || ''}
                                            onChange={e => setNewPropForm({ ...newPropForm, omnichannelContactName: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Nomor WhatsApp (628...)</label>
                                        <input
                                            type="text"
                                            placeholder="628123456789"
                                            value={newPropForm.omnichannelContactPhone || ''}
                                            onChange={e => setNewPropForm({ ...newPropForm, omnichannelContactPhone: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SIMULASI FINANSIAL PORTOFOLIO */}
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <DollarSign size={16} className="text-emerald-600" />
                                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Simulasi Finansial &amp; Bagi Hasil Pemilik</h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Potensi Omset Penuh</span>
                                        <p className="text-sm font-black text-slate-900 mt-0.5">{FORMAT_CURRENCY(totalPotentialOmset)}</p>
                                        <span className="text-[9px] text-slate-400 font-bold">Jika seluruh {totalRooms} kamar terisi</span>
                                    </div>
                                    <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider block">Realisasi Sewa Berjalan</span>
                                        <p className="text-sm font-black text-emerald-800 mt-0.5">{FORMAT_CURRENCY(realizedOmset)}</p>
                                        <span className="text-[9px] text-emerald-600 font-bold">{occupiedRooms} kamar terisi aktif</span>
                                    </div>
                                    <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
                                        <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider block">Estimasi Payout Pemilik</span>
                                        <p className="text-sm font-black text-blue-800 mt-0.5">{FORMAT_CURRENCY(estimatedPayout)}</p>
                                        <span className="text-[9px] text-blue-600 font-bold">Setelah fee KostManager (10%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ======================================================== */}
                {/* 4. FOOTER STICKY ACTION BAR                              */}
                {/* ======================================================== */}
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
                                <button type="button" onClick={() => setLightboxPhoto(null)} className="p-1 hover:bg-slate-700 rounded-lg cursor-pointer">
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
