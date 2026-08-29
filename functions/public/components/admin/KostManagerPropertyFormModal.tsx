import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
import { FORMAT_CURRENCY, INDONESIAN_BANKS } from '../../constants';
import { 
    uploadFileAndGetURL 
} from '../../adminService';
import { 
    Zap, Home, ClipboardList, Wallet, User, Users, ShieldCheck, 
    Menu, X, LogOut, Bell, MessageSquare, Search,
    Calendar, Clock, Phone, MapPin, Navigation, Share2,
    CheckCircle2, AlertTriangle, AlertCircle, Trash2, Plus, Edit3,
    Camera, Eye, Lock, Maximize2, LocateFixed, Pin, Link as LinkIcon,
    RefreshCw, Bed, Bath, Fan, Sparkles, ImagePlus, ChevronDown, ChevronRight, Check,
    Smartphone, MessageCircle, ExternalLink, ArrowLeft, UploadCloud, Edit, Mail, Heart,
    Signal, Wifi, BatteryCharging, CheckSquare, Layers, Building2, CookingPot, AppWindow,
    ParkingCircle, Wind, Tv, Armchair, Droplets
} from 'lucide-react';

export interface KostManagerPropertyFormModalProps {
    onClose: () => void;
    onSuccess: () => void;
    ownersList: { id: string; name: string; phone: string; email?: string }[];
    newPropForm: any;
    setNewPropForm: React.Dispatch<React.SetStateAction<any>>;
    savingProp: boolean;
    setSavingProp: React.Dispatch<React.SetStateAction<boolean>>;
    editingPropertyId: string | null;
}

// Helpers
const parseDimensionParts = (sizeStr?: string) => {
    if (!sizeStr) return { length: '', width: '' };
    const str = String(sizeStr).replace(/meter/gi, '').trim();
    const parts = str.split(/[\times xX×*]/);
    return {
        length: parts[0] ? parts[0].trim() : '',
        width: parts[1] ? parts[1].trim() : ''
    };
};

const formatThousand = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    const clean = val.toString().replace(/\D/g, '');
    if (!clean) return '';
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseThousand = (str: string) => {
    if (!str) return '';
    const clean = str.replace(/\D/g, '');
    if (!clean) return '';
    return parseFloat(clean) || 0;
};

const getImageUrlString = (img: any): string => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (typeof img === 'object' && img.original) return img.original;
    if (typeof img === 'object' && img.url) return img.url;
    return '';
};

const normalizePhotoUrl = (photo: any): string => {
    if (!photo) return '';
    if (typeof photo === 'string') return photo;
    return photo.url || photo.original || photo.original_url || photo.photo_url || photo.file_url || photo.src || '';
};

// Client-Side WebP Compression
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

const detectProvinceFromAddress = (addr?: string | null): string => {
    if (!addr) return 'Sulawesi Selatan';
    const lower = addr.toLowerCase();
    if (lower.includes('sulawesi selatan') || lower.includes('makassar') || lower.includes('gowa') || lower.includes('maros') || lower.includes('takalar') || lower.includes('bone') || lower.includes('palopo') || lower.includes('parepare')) return 'Sulawesi Selatan';
    if (lower.includes('sulawesi barat') || lower.includes('mamuju') || lower.includes('polewali')) return 'Sulawesi Barat';
    if (lower.includes('sulawesi tengah') || lower.includes('palu')) return 'Sulawesi Tengah';
    if (lower.includes('sulawesi tenggara') || lower.includes('kendari')) return 'Sulawesi Tenggara';
    if (lower.includes('sulawesi utara') || lower.includes('manado')) return 'Sulawesi Utara';
    if (lower.includes('gorontalo')) return 'Gorontalo';
    if (lower.includes('dki jakarta') || lower.includes('jakarta')) return 'DKI Jakarta';
    if (lower.includes('jawa barat') || lower.includes('bandung') || lower.includes('bogor') || lower.includes('depok') || lower.includes('bekasi') || lower.includes('cimahi')) return 'Jawa Barat';
    if (lower.includes('jawa timur') || lower.includes('surabaya') || lower.includes('malang') || lower.includes('sidoarjo')) return 'Jawa Timur';
    if (lower.includes('jawa tengah') || lower.includes('semarang') || lower.includes('solo') || lower.includes('surakarta')) return 'Jawa Tengah';
    if (lower.includes('di yogyakarta') || lower.includes('yogyakarta') || lower.includes('jogja') || lower.includes('sleman') || lower.includes('bantul')) return 'DI Yogyakarta';
    if (lower.includes('bali') || lower.includes('denpasar') || lower.includes('badung')) return 'Bali';
    return 'Sulawesi Selatan';
};

const parseGoogleMapsUrl = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    const clean = url.trim();
    const atMatch = clean.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
        return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }
    const queryMatch = clean.match(/[?&](?:q|query|ll|daddr)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (queryMatch) {
        return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
    }
    const rawMatch = clean.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
    if (rawMatch) {
        return { lat: parseFloat(rawMatch[1]), lng: parseFloat(rawMatch[2]) };
    }
    return null;
};

// Check Has Facility Helper (with synonyms)
const checkHasFacility = (facilityList: string[], target: string) => {
    if (!facilityList || !Array.isArray(facilityList)) return false;
    const normalizedTarget = target.toLowerCase().trim();
    
    const synonyms: Record<string, string[]> = {
        'wifi': ['wifi', 'wi-fi', 'internet'],
        'dapur bersama': ['dapur', 'dapur bersama', 'dapur umum'],
        'area parkir': ['parkir', 'parkiran', 'tempat parkir', 'area parkir', 'parkir motor', 'parkir mobil', 'parkir sepeda'],
        'ruang tamu': ['ruang tamu', 'ruang santai'],
        'cctv': ['cctv', 'kamera keamanan'],
        'laundry': ['laundry', 'mesin cuci', 'cuci'],
        'wc umum': ['wc umum', 'toilet umum', 'kamar mandi luar', 'wc luar']
    };

    const targetSyns = synonyms[normalizedTarget] || [normalizedTarget];
    
    return facilityList.some(f => {
        const nf = (f || '').toLowerCase().trim();
        return targetSyns.some(syn => nf.includes(syn) || syn.includes(nf));
    });
};

// Photo category computator
const computeDynamicPublicPhotoCategories = (facilities: string[] = [], manualExtras: string[] = []): string[] => {
    const base = ['Bangunan Depan', 'Koridor'];
    const dynamic: string[] = [];

    const facMapping: { [key: string]: string } = {
        'area parkir': 'Area Parkir',
        'parkir': 'Area Parkir',
        'parkiran': 'Area Parkir',
        'parkir motor': 'Area Parkir',
        'parkir mobil': 'Area Parkir',
        'dapur bersama': 'Dapur Bersama',
        'ruang tamu': 'Ruang Tamu',
        'wc umum': 'WC Umum',
        'cctv': 'CCTV',
        'laundry': 'Laundry'
    };

    (facilities || []).forEach(f => {
        const lower = (f || '').toLowerCase().trim();
        let mapped = '';
        for (const [k, v] of Object.entries(facMapping)) {
            if (lower.includes(k) || k.includes(lower)) {
                mapped = v;
                break;
            }
        }
        if (mapped) {
            if (!dynamic.includes(mapped) && !base.includes(mapped)) {
                dynamic.push(mapped);
            }
        } else if (lower && lower !== 'wifi') {
            const cleanName = f.trim();
            if (!dynamic.includes(cleanName) && !base.includes(cleanName) && cleanName !== 'Lingkungan') {
                dynamic.push(cleanName);
            }
        }
    });

    const defaultTrailing = ['Lingkungan'];
    defaultTrailing.forEach(dt => {
        if (!dynamic.includes(dt) && !base.includes(dt)) {
            dynamic.push(dt);
        }
    });

    (manualExtras || []).forEach(c => {
        const clean = c.trim();
        if (clean && !dynamic.includes(clean) && !base.includes(clean)) {
            dynamic.push(clean);
        }
    });

    return [...base, ...dynamic];
};

const normalizeRoomCategoryName = (k: string, isOcc: boolean = false): string => {
    const lower = (k || '').toLowerCase().trim().replace(/(\*wajib|\(opsional\))/gi, '').trim();
    if (lower.includes('interior')) {
        return isOcc ? 'Interior Kamar (Opsional)' : 'Interior Kamar *Wajib';
    }
    if (lower === 'kasur' || lower === 'tempat tidur' || lower.includes('bed')) {
        return 'Tempat Tidur';
    }
    if (lower === 'kamar mandi' || lower === 'kamar mandi dalam' || lower === 'wc' || lower === 'toilet') {
        return 'Kamar Mandi';
    }
    if (lower === 'dapur' || lower === 'dapur dalam' || lower.includes('kitchen')) {
        return 'Dapur Dalam';
    }
    if (lower === 'lemari' || lower === 'lemari pakaian' || lower.includes('storage') || lower.includes('lemari')) {
        return 'Lemari / Storage';
    }
    if (lower === 'jendela' || lower === 'jendela luar') {
        return 'Jendela Luar';
    }
    if (lower === 'meja belajar' || lower === 'meja') {
        return 'Meja Belajar';
    }
    if (lower === 'ac') {
        return 'AC';
    }
    if (lower === 'kipas angin' || lower === 'kipas') {
        return 'Kipas Angin';
    }
    if (lower === 'water heater' || lower === 'pemanas air') {
        return 'Water Heater';
    }
    return k.replace(/(\*Wajib|\(Opsional\))/gi, '').trim();
};

const computeDynamicRoomPhotoCategories = (roomFacilities: string[] = [], status: string = 'Kosong', manualExtras: string[] = []): string[] => {
    const isOcc = status === 'terisi' || status === 'Terisi';
    const baseLabel = isOcc ? 'Interior Kamar (Opsional)' : 'Interior Kamar *Wajib';
    const categories: string[] = [baseLabel];

    const facilityPhotoMapping: { [key: string]: string } = {
        'kamar mandi dalam': 'Kamar Mandi',
        'kamar mandi': 'Kamar Mandi',
        'dapur dalam': 'Dapur Dalam',
        'dapur': 'Dapur Dalam',
        'kasur': 'Tempat Tidur',
        'tempat tidur': 'Tempat Tidur',
        'lemari': 'Lemari / Storage',
        'lemari pakaian': 'Lemari / Storage',
        'meja belajar': 'Meja Belajar',
        'ac': 'AC',
        'kipas angin': 'Kipas Angin',
        'jendela luar': 'Jendela Luar',
        'jendela': 'Jendela Luar',
        'water heater': 'Water Heater'
    };

    (roomFacilities || []).forEach(fac => {
        const lower = (fac || '').toLowerCase().trim();
        if (lower === 'kosongan (tanpa perabot)') return;

        const mapped = facilityPhotoMapping[lower];
        if (mapped) {
            if (!categories.includes(mapped)) {
                categories.push(mapped);
            }
        } else if (lower) {
            const clean = fac.trim();
            if (!categories.includes(clean)) {
                categories.push(clean);
            }
        }
    });

    (manualExtras || []).forEach(c => {
        const clean = normalizeRoomCategoryName(c, isOcc);
        if (clean && !categories.includes(clean)) {
            categories.push(clean);
        }
    });

    return categories;
};

const getRoomCategorizedPhotos = (item: any): Record<string, string[]> => {
    if (!item) return {};
    const isOcc = item.status === 'terisi' || item.status === 'Terisi';
    const cleanUrls = (urls: any[]) => (urls || []).map((u: any) => getImageUrlString(u)).filter(Boolean);
    const result: Record<string, string[]> = {};

    const addPhoto = (cat: string, url: string) => {
        if (!url) return;
        const normalizedCat = normalizeRoomCategoryName(cat, isOcc);
        if (!result[normalizedCat]) result[normalizedCat] = [];
        if (!result[normalizedCat].includes(url)) {
            result[normalizedCat].push(url);
        }
    };

    // 1. Dari categorized_photos / categorizedPhotos
    const catSources = [item.categorized_photos, item.categorizedPhotos].filter(Boolean);
    catSources.forEach(source => {
        if (source && typeof source === 'object' && !Array.isArray(source)) {
            Object.entries(source).forEach(([k, urls]) => {
                if (Array.isArray(urls)) {
                    cleanUrls(urls).forEach(u => addPhoto(k, u));
                }
            });
        }
    });

    // 2. Dari images / image_urls / photos jika ada yang belum masuk
    const images = Array.isArray(item.images) ? item.images : (Array.isArray(item.image_urls) ? item.image_urls : (Array.isArray(item.photos) ? item.photos : []));
    const categories = Array.isArray(item.photoCategories) ? item.photoCategories : [];
    images.forEach((urlItem: any, idx: number) => {
        const urlStr = getImageUrlString(urlItem);
        if (!urlStr) return;
        let cat = (typeof urlItem === 'object' && urlItem.label) 
            ? urlItem.label 
            : (categories[idx] || (idx === 0 ? (isOcc ? 'Interior Kamar (Opsional)' : 'Interior Kamar *Wajib') : 'Foto Kamar'));
        addPhoto(cat, urlStr);
    });

    return result;
};

const exportCategorizedPhotos = (categorized: Record<string, string[]>): { images: string[]; photoCategories: string[] } => {
    const images: string[] = [];
    const photoCategories: string[] = [];
    Object.entries(categorized || {}).forEach(([cat, urls]) => {
        (urls || []).forEach(u => {
            if (u) {
                images.push(u);
                photoCategories.push(cat);
            }
        });
    });
    return { images, photoCategories };
};

export const KostManagerPropertyFormModal: React.FC<KostManagerPropertyFormModalProps> = ({
    onClose,
    onSuccess,
    ownersList,
    newPropForm,
    setNewPropForm,
    savingProp,
    setSavingProp,
    editingPropertyId
}) => {
    // Stepper: 1 (PROPERTI), 2 (DATA KAMAR), 3 (REVIEW)
    const [kmStep, setKmStep] = useState<number>(1);

    // Synchronize initial listing form state
    const [kmListingForm, setKmListingForm] = useState<any>(() => {
        const addr = newPropForm.address || '';
        const prov = newPropForm.province || detectProvinceFromAddress(addr) || 'Sulawesi Selatan';
        const initialRooms = Array.isArray(newPropForm.roomTypes) ? newPropForm.roomTypes : [];
        return {
            title: newPropForm.title || '',
            description: newPropForm.description || '',
            address: addr,
            city: newPropForm.city || 'Makassar',
            area: newPropForm.area || '',
            province: prov,
            type: newPropForm.type || 'Campur',
            totalRooms: newPropForm.totalRooms || initialRooms.length || 1,
            price: newPropForm.price || 0,
            owner_uid: newPropForm.owner_uid || (ownersList[0]?.id || ''),
            roomTypes: initialRooms,
            publicBathroomFacilities: Array.isArray(newPropForm.publicBathroomFacilities) ? newPropForm.publicBathroomFacilities : [],
            publicKitchenFacilities: Array.isArray(newPropForm.publicKitchenFacilities) ? newPropForm.publicKitchenFacilities : [],
            publicParkingFacilities: Array.isArray(newPropForm.publicParkingFacilities) ? newPropForm.publicParkingFacilities : ['Parkir Motor'],
            facilities: Array.isArray(newPropForm.facilities) && newPropForm.facilities.length > 0 ? newPropForm.facilities : ['WiFi', 'Area Parkir', 'Dapur Bersama'],
            location: newPropForm.location || { lat: -5.147665, lng: 119.432731 },
            rules: Array.isArray(newPropForm.rules) && newPropForm.rules.length > 0 ? newPropForm.rules : ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
            image_urls: Array.isArray(newPropForm.imageUrls) ? newPropForm.imageUrls : (Array.isArray(newPropForm.image_urls) ? newPropForm.image_urls : []),
            campuses: Array.isArray(newPropForm.campuses) ? newPropForm.campuses : [],
            omnichannelContactName: newPropForm.omnichannelContactName || '',
            omnichannelContactPhone: newPropForm.omnichannelContactPhone || ''
        };
    });

    // Public Photo Categories
    const [photoCategories, setPhotoCategories] = useState<string[]>(['Bangunan Depan', 'Koridor', 'Area Parkir', 'Lingkungan']);
    const [newPhotoCategoryName, setNewPhotoCategoryName] = useState('');
    const [newFacilityName, setNewFacilityName] = useState('');
    const [newRuleName, setNewRuleName] = useState('');
    const [uploadingPublicAreas, setUploadingPublicAreas] = useState<Record<string, boolean>>({});

    // Step 2 Room Management States
    const [activeRoomIdx, setActiveRoomIdx] = useState<number | null>(null);
    const [temporaryRoom, setTemporaryRoom] = useState<any | null>(null);
    const [deleteRoomConfirm, setDeleteRoomConfirm] = useState<{ open: boolean; idx: number | null }>({ open: false, idx: null });
    const [customRoomFacilityInput, setCustomRoomFacilityInput] = useState('');
    const [customBathroomFacilityInput, setCustomBathroomFacilityInput] = useState('');
    const [customPublicKitchenFacilityInput, setCustomPublicKitchenFacilityInput] = useState('');
    const [customKitchenFacilityInput, setCustomKitchenFacilityInput] = useState('');
    const [customPublicBathroomFacilityInput, setCustomPublicBathroomFacilityInput] = useState('');
    const [customPublicParkingFacilityInput, setCustomPublicParkingFacilityInput] = useState('');
    const [newRoomPhotoCategoryName, setNewRoomPhotoCategoryName] = useState('');
    const [uploadingRooms, setUploadingRooms] = useState<Record<string, boolean>>({});

    // Step 3 States
    const [expandedRoomIdx, setExpandedRoomIdx] = useState<number | null>(null);
    const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
    const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Landmark States
    const [showAddLandmarkForm, setShowAddLandmarkForm] = useState(false);
    const [landmarkInputMethod, setLandmarkInputMethod] = useState<'search' | 'gmaps'>('search');
    const [newLandmarkName, setNewLandmarkName] = useState('');
    const [landmarkLocation, setLandmarkLocation] = useState<{ lat: number; lng: number }>({ lat: -5.147665, lng: 119.432731 });
    const [googleMapsUrlInput, setGoogleMapsUrlInput] = useState('');
    const [landmarkSuggestions, setLandmarkSuggestions] = useState<any[]>([]);

    // Google Maps States
    const kmMapRef = useRef<HTMLDivElement>(null);
    const kmMapInstance = useRef<any>(null);
    const kmMarkerInstance = useRef<any>(null);

    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [modalTempLocation, setModalTempLocation] = useState<{ lat: number; lng: number }>({ lat: -5.147665, lng: 119.432731 });
    const modalMapRef = useRef<HTMLDivElement>(null);
    const modalMapInstance = useRef<any>(null);
    const modalMarkerInstance = useRef<any>(null);
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
    const [isSearchingModalMap, setIsSearchingModalMap] = useState(false);
    const modalSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Lightbox modal state
    const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; label?: string } | null>(null);

    // Selected Owner info
    const selectedOwner = ownersList.find(o => o.id === kmListingForm.owner_uid) || ownersList[0];

    // Synchronize when newPropForm or editingPropertyId changes
    useEffect(() => {
        if (!newPropForm) return;
        const addr = newPropForm.address || '';
        const prov = newPropForm.province || detectProvinceFromAddress(addr) || 'Sulawesi Selatan';
        const initialRooms = Array.isArray(newPropForm.roomTypes) ? newPropForm.roomTypes : [];
        const rawImgs = Array.isArray(newPropForm.imageUrls) ? newPropForm.imageUrls : (Array.isArray(newPropForm.image_urls) ? newPropForm.image_urls : []);
        
        // Normalize loaded photos with intelligent labels matching KostManager survey
        const defaultSlots = ['Bangunan Depan', 'Koridor', 'Area Parkir', 'Lingkungan'];
        const normalizedImgs = rawImgs.map((img: any, idx: number) => {
            const url = getImageUrlString(img);
            if (!url) return null;
            let rawLabel = (typeof img === 'object' && img.label) ? img.label : '';
            const lower = rawLabel.toLowerCase().trim();
            let label = rawLabel;
            if (lower.includes('fasad') || lower.includes('depan') || lower.includes('gedung') || lower.includes('tampak depan')) {
                label = 'Bangunan Depan';
            } else if (lower.includes('koridor') || lower.includes('lorong') || lower.includes('akses') || lower.includes('pintu masuk')) {
                label = 'Koridor';
            } else if (lower.includes('parkir') || lower.includes('parkiran') || lower.includes('garasi')) {
                label = 'Area Parkir';
            } else if (lower.includes('dapur')) {
                label = 'Dapur Bersama';
            } else if (lower.includes('wc umum') || lower.includes('toilet') || lower.includes('kamar mandi luar') || lower.includes('wc luar') || lower === 'wc') {
                label = 'WC Umum';
            } else if (lower.includes('lingkungan') || lower.includes('taman') || lower.includes('sekitar')) {
                label = 'Lingkungan';
            } else if (lower.includes('ruang tamu') || lower.includes('ruang santai')) {
                label = 'Ruang Tamu';
            } else if (lower.includes('cctv')) {
                label = 'CCTV';
            } else if (lower.includes('laundry') || lower.includes('jemuran') || lower.includes('cuci')) {
                label = 'Laundry';
            }
            if (!label) {
                label = idx < defaultSlots.length ? defaultSlots[idx] : `Foto Area Lainnya ${idx - defaultSlots.length + 1}`;
            }
            return { original: url, url, label };
        }).filter((item): item is { original: string; url: string; label: string } => item !== null && Boolean(item.url));

        const loadedFacilities = Array.isArray(newPropForm.facilities) && newPropForm.facilities.length > 0 
            ? newPropForm.facilities 
            : ['WiFi', 'Area Parkir', 'Dapur Bersama'];

        // Auto-discover extra categories from existing photos
        const extraCatsFromPhotos = normalizedImgs.map((img: any) => img.label).filter(Boolean);

        setKmListingForm({
            title: newPropForm.title || '',
            description: newPropForm.description || '',
            address: addr,
            city: newPropForm.city || 'Makassar',
            area: newPropForm.area || '',
            province: prov,
            type: newPropForm.type || 'Campur',
            totalRooms: newPropForm.totalRooms || initialRooms.length || 1,
            price: newPropForm.price || 0,
            owner_uid: newPropForm.owner_uid || (ownersList[0]?.id || ''),
            roomTypes: initialRooms,
            publicBathroomFacilities: Array.isArray(newPropForm.publicBathroomFacilities) ? newPropForm.publicBathroomFacilities : [],
            publicKitchenFacilities: Array.isArray(newPropForm.publicKitchenFacilities) ? newPropForm.publicKitchenFacilities : [],
            publicParkingFacilities: Array.isArray(newPropForm.publicParkingFacilities) ? newPropForm.publicParkingFacilities : ['Parkir Motor'],
            facilities: loadedFacilities,
            location: newPropForm.location || { lat: -5.147665, lng: 119.432731 },
            rules: Array.isArray(newPropForm.rules) && newPropForm.rules.length > 0 ? newPropForm.rules : ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
            image_urls: normalizedImgs,
            photoCategories: normalizedImgs.map((img: any) => img.label),
            campuses: Array.isArray(newPropForm.campuses) ? newPropForm.campuses : [],
            omnichannelContactName: newPropForm.omnichannelContactName || '',
            omnichannelContactPhone: newPropForm.omnichannelContactPhone || ''
        });

        // Compute dynamic public photo categories including any extra categories from photos
        const dynamicPublicCats = computeDynamicPublicPhotoCategories(loadedFacilities, extraCatsFromPhotos);
        setPhotoCategories(dynamicPublicCats);
    }, [editingPropertyId, newPropForm]);

    // Dynamic Public Photo Categories sync when facilities change
    useEffect(() => {
        const currentPhotoLabels = (kmListingForm.image_urls || []).map((img: any) => (typeof img === 'object' ? img.label : '')).filter(Boolean);
        const dynamicPublicCats = computeDynamicPublicPhotoCategories(kmListingForm.facilities || [], currentPhotoLabels);
        setPhotoCategories(prev => {
            const manualExtras = prev.filter(c => !dynamicPublicCats.includes(c) && !['Bangunan Depan', 'Koridor', 'Lingkungan', 'Area Parkir', 'Parkiran', 'Dapur Bersama', 'Ruang Tamu', 'WC Umum', 'CCTV', 'Laundry'].includes(c));
            return computeDynamicPublicPhotoCategories(kmListingForm.facilities || [], [...currentPhotoLabels, ...manualExtras]);
        });
    }, [kmListingForm.facilities]);

    // Mini Map initialization
    useEffect(() => {
        if (kmStep !== 1 || !kmMapRef.current) return;
        const google = (window as any).google;
        if (!google?.maps) return;

        const curLat = kmListingForm.location?.lat || -5.147665;
        const curLng = kmListingForm.location?.lng || 119.432731;

        try {
            const map = new google.maps.Map(kmMapRef.current, {
                center: { lat: curLat, lng: curLng },
                zoom: 16,
                disableDefaultUI: true,
                zoomControl: true,
                gestureHandling: 'cooperative'
            });

            const marker = new google.maps.Marker({
                position: { lat: curLat, lng: curLng },
                map,
                draggable: true
            });

            marker.addListener('dragend', () => {
                const pos = marker.getPosition();
                if (pos) {
                    reverseGeocodeAndApply(pos.lat(), pos.lng());
                }
            });

            map.addListener('click', (e: any) => {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                marker.setPosition({ lat, lng });
                reverseGeocodeAndApply(lat, lng);
            });

            kmMapInstance.current = map;
            kmMarkerInstance.current = marker;
        } catch (e) {
            console.error('Mini Map Init Error:', e);
        }
    }, [kmStep]);

    // Fullscreen Pop-up Map Initialization Effect
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

        const startLat = modalTempLocation.lat || kmListingForm.location?.lat || -5.147665;
        const startLng = modalTempLocation.lng || kmListingForm.location?.lng || 119.432731;

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

    const reverseGeocodeAndApply = (lat: number, lng: number, fallbackAddr?: string) => {
        setKmListingForm((prev: any) => ({
            ...prev,
            location: { lat, lng }
        }));
        if (kmMarkerInstance.current) kmMarkerInstance.current.setPosition({ lat, lng });
        if (kmMapInstance.current) kmMapInstance.current.panTo({ lat, lng });

        const gw = (window as any).google;
        if (gw?.maps?.Geocoder) {
            const geocoder = new gw.maps.Geocoder();
            geocoder.geocode(
                { location: { lat, lng } },
                (results: any[], status: string) => {
                    if (status === 'OK' && results && results.length > 0) {
                        const addr = results[0].formatted_address;
                        const components = results[0].address_components || [];
                        let city = '', area = '', province = '';
                        for (const comp of components) {
                            const types = comp.types || [];
                            if (types.includes('administrative_area_level_1') && !province) province = comp.long_name;
                            if (types.includes('administrative_area_level_2') && !city) city = comp.long_name;
                            if ((types.includes('administrative_area_level_3') || types.includes('sublocality_level_1') || types.includes('sublocality')) && !area) area = comp.long_name;
                            if (types.includes('locality') && !area && comp.long_name !== city) area = comp.long_name;
                        }
                        const detectedProv = province ? province.replace(/^(Provinsi|Prov\.)\s+/i, '').trim() : detectProvinceFromAddress(addr || fallbackAddr || '');
                        setKmListingForm((prev: any) => {
                            const updates: any = { address: addr || prev.address || fallbackAddr };
                            if (city) updates.city = city.replace(/^(Kota|Kabupaten|Kab\.)\s+/i, '').trim();
                            if (area) updates.area = area.replace(/^(Kecamatan|Kec\.)\s+/i, '').trim();
                            updates.province = detectedProv || prev.province || detectProvinceFromAddress(prev.address || '');
                            return { ...prev, ...updates };
                        });
                    }
                }
            );
        }
    };

    const handleConfirmModalLocation = () => {
        reverseGeocodeAndApply(modalTempLocation.lat, modalTempLocation.lng);
        setIsMapModalOpen(false);
    };

    // Landmark Autocomplete Effect
    useEffect(() => {
        if (!newLandmarkName || newLandmarkName.trim().length < 3) {
            setLandmarkSuggestions([]);
            return;
        }
        const timer = setTimeout(() => {
            try {
                const gw = (window as any).google;
                if (!gw?.maps?.places) return;
                const svc = new gw.maps.places.AutocompleteService();
                svc.getPlacePredictions(
                    {
                        input: newLandmarkName,
                        componentRestrictions: { country: 'id' },
                        types: ['establishment', 'geocode'],
                    },
                    (predictions: any[], status: string) => {
                        if (status === gw.maps.places.PlacesServiceStatus.OK && predictions) {
                            setLandmarkSuggestions(predictions);
                        } else {
                            setLandmarkSuggestions([]);
                        }
                    }
                );
            } catch (e) {
                console.error("Suggestion fetch failed:", e);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [newLandmarkName]);

    // Canvas Drawing for Step 3
    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0b1c30';
        
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = ((clientX - rect.left) / rect.width) * canvas.width;
        const y = ((clientY - rect.top) / rect.height) * canvas.height;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = ((clientX - rect.left) / rect.width) * canvas.width;
        const y = ((clientY - rect.top) / rect.height) * canvas.height;
        
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            setSignatureData(canvas.toDataURL());
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setSignatureData(null);
            }
        }
    };

    // Public Photo Upload Handler
    const handleUploadPublicPhoto = async (category: string, files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploadingPublicAreas(prev => ({ ...prev, [category]: true }));
        try {
            const uploadedUrls: any[] = [];
            for (let i = 0; i < files.length; i++) {
                const webpFile = await compressImageToWebP(files[i]);
                const url = await uploadFileAndGetURL(webpFile, `kostmanager/public/${Date.now()}`);
                uploadedUrls.push({ original: url, url: url, label: category });
            }
            setKmListingForm((prev: any) => ({
                ...prev,
                image_urls: [...(prev.image_urls || []), ...uploadedUrls]
            }));
        } catch (err: any) {
            alert('Gagal mengunggah foto area umum: ' + err.message);
        } finally {
            setUploadingPublicAreas(prev => ({ ...prev, [category]: false }));
        }
    };

    const handleRemovePublicPhoto = (urlToRemove: string) => {
        setKmListingForm((prev: any) => ({
            ...prev,
            image_urls: (prev.image_urls || []).filter((img: any) => getImageUrlString(img) !== urlToRemove)
        }));
    };

    // Step 2 Room Management Handlers
    const handleAddNewRoom = () => {
        const nextNum = (kmListingForm.roomTypes?.length || 0) + 1;
        setTemporaryRoom({
            name: `Kamar 10${nextNum}`,
            roomNumber: `10${nextNum}`,
            floor: 'Lantai 1',
            type: 'Standard',
            size: '3x4 meter',
            dimensions: '3x4 meter',
            status: 'Kosong',
            isAvailable: true,
            price: 850000,
            pricing: [
                { period: 'bulanan', price: 850000 },
                { period: '3bulanan', price: 2500000 },
                { period: 'tahunan', price: 9500000 }
            ],
            roomFacilities: ['Kasur', 'Lemari Pakaian', 'Meja Belajar'],
            bathroomFacilities: ['Kloset Duduk', 'Shower'],
            kitchenFacilities: [],
            residentName: '',
            residentPhone: '',
            startDate: '',
            endDate: '',
            paymentPeriod: 'bulanan',
            currentOccupants: 1,
            images: [],
            photoCategories: [],
            categorizedPhotos: {}
        });
    };

    const handleSaveTemporaryRoom = () => {
        if (!temporaryRoom) return;
        if (!temporaryRoom.name?.trim()) {
            alert('Nomor/Nama kamar harus diisi');
            return;
        }

        const roomPrice = Number(temporaryRoom.price) || 
            (Array.isArray(temporaryRoom.pricing) && temporaryRoom.pricing[0]?.price) || 0;

        const finalRoom = {
            ...temporaryRoom,
            price: roomPrice,
            isAvailable: temporaryRoom.status !== 'Terisi' && temporaryRoom.status !== 'terisi'
        };

        setKmListingForm((prev: any) => ({
            ...prev,
            roomTypes: [...(prev.roomTypes || []), finalRoom]
        }));
        setTemporaryRoom(null);
    };

    const handleUpdateExistingRoom = (idx: number, updates: any) => {
        setKmListingForm((prev: any) => {
            const updated = [...(prev.roomTypes || [])];
            updated[idx] = { ...updated[idx], ...updates };
            if (updates.status !== undefined) {
                const isOcc = updates.status === 'Terisi' || updates.status === 'terisi';
                updated[idx].isAvailable = !isOcc;
                if (!isOcc) {
                    updated[idx].residentName = '';
                    updated[idx].residentPhone = '';
                }
            }
            return { ...prev, roomTypes: updated };
        });
    };

    const handleDeleteRoom = (idx: number) => {
        setKmListingForm((prev: any) => ({
            ...prev,
            roomTypes: (prev.roomTypes || []).filter((_: any, i: number) => i !== idx)
        }));
        setDeleteRoomConfirm({ open: false, idx: null });
        if (activeRoomIdx === idx) setActiveRoomIdx(null);
    };

    // Room Photo Upload Handler
    const handleUploadRoomUnitPhoto = async (targetRoom: any, setTargetRoom: (r: any) => void, category: string, files: FileList | null) => {
        if (!files || files.length === 0) return;
        const uploadKey = `${targetRoom.name}-${category}`;
        setUploadingRooms(prev => ({ ...prev, [uploadKey]: true }));
        try {
            const newPhotos = [...(targetRoom.images || [])];
            const newCats = [...(targetRoom.photoCategories || [])];
            const currentCatPhotos = { ...(targetRoom.categorizedPhotos || {}) };
            const catList = Array.isArray(currentCatPhotos[category]) ? [...currentCatPhotos[category]] : [];

            for (let i = 0; i < files.length; i++) {
                const webpFile = await compressImageToWebP(files[i]);
                const url = await uploadFileAndGetURL(webpFile, `kostmanager/rooms/${Date.now()}`);
                newPhotos.push(url);
                newCats.push(category);
                catList.push(url);
            }
            currentCatPhotos[category] = catList;

            setTargetRoom({
                ...targetRoom,
                images: newPhotos,
                photoCategories: newCats,
                categorizedPhotos: currentCatPhotos
            });
        } catch (err: any) {
            alert('Gagal mengunggah foto kamar: ' + err.message);
        } finally {
            setUploadingRooms(prev => ({ ...prev, [uploadKey]: false }));
        }
    };

    const handleRemoveRoomUnitPhoto = (targetRoom: any, setTargetRoom: (r: any) => void, photoUrl: string) => {
        const idxToRemove = (targetRoom.images || []).findIndex((u: string) => u === photoUrl);
        const newImages = (targetRoom.images || []).filter((u: string) => u !== photoUrl);
        const newCats = (targetRoom.photoCategories || []).filter((_: string, i: number) => i !== idxToRemove);
        
        const currentCatPhotos = { ...(targetRoom.categorizedPhotos || {}) };
        Object.keys(currentCatPhotos).forEach(k => {
            if (Array.isArray(currentCatPhotos[k])) {
                currentCatPhotos[k] = currentCatPhotos[k].filter((u: string) => u !== photoUrl);
            }
        });

        setTargetRoom({
            ...targetRoom,
            images: newImages,
            photoCategories: newCats,
            categorizedPhotos: currentCatPhotos
        });
    };

    // DIRECT LIVE SAVE TO SUPABASE
    const handleDirectSave = async () => {
        if (!kmListingForm.title.trim()) {
            alert('Mohon isi nama properti kost di Step 1');
            setKmStep(1);
            return;
        }
        if (!kmListingForm.address.trim()) {
            alert('Mohon isi alamat properti kost di Step 1');
            setKmStep(1);
            return;
        }
        if (!kmListingForm.roomTypes || kmListingForm.roomTypes.length === 0) {
            alert('Mohon tambahkan minimal 1 data unit kamar di Step 2 (Data Kamar)');
            setKmStep(2);
            return;
        }

        setSavingProp(true);
        try {
            const validOwnerUid = kmListingForm.owner_uid || selectedOwner?.id || null;

            // Compute lowest price
            const prices = kmListingForm.roomTypes.map((rt: any) => {
                if (Array.isArray(rt.pricing) && rt.pricing.length > 0) {
                    const bulanan = rt.pricing.find((p: any) => p.period === 'bulanan');
                    if (bulanan && bulanan.price > 0) return Number(bulanan.price);
                    return Number(rt.pricing[0].price || 0);
                }
                return Number(rt.price || 0);
            }).filter((p: number) => p > 0);
            const finalPrice = prices.length > 0 ? Math.min(...prices) : Number(kmListingForm.price || 0);

            // Normalize public photos
            const finalImageUrls = (kmListingForm.image_urls || []).map((img: any, idx: number) => {
                const urlStr = normalizePhotoUrl(img);
                if (!urlStr) return null;
                const label = photoCategories[idx] || (typeof img === 'object' && img.label) || 'Foto Area Properti';
                return { original: urlStr, url: urlStr, label };
            }).filter(Boolean);

            // Strictly normalize and sanitize room photo categories before saving
            const normalizedRoomTypesPayload = (kmListingForm.roomTypes || []).map((rm: any) => {
                const categorized = getRoomCategorizedPhotos(rm);
                const { images, photoCategories: exportedCats } = exportCategorizedPhotos(categorized);
                
                const finalImages = images.length > 0 ? images : (Array.isArray(rm.images) ? rm.images : []);
                const finalPhotoCategories = finalImages.map((u: string, i: number) => {
                    return exportedCats[i] || (rm.photoCategories && rm.photoCategories[i]) || (i === 0 ? (rm.status === 'Terisi' ? 'Interior Kamar (Opsional)' : 'Interior Kamar *Wajib') : (i === 1 ? 'Kamar Mandi' : (i === 2 ? 'Tempat Tidur' : `Foto Kamar ${i + 1}`)));
                });

                return {
                    ...rm,
                    categorized_photos: categorized,
                    categorizedPhotos: categorized,
                    images: finalImages,
                    photoCategories: finalPhotoCategories
                };
            });

            const propertyPayload: any = {
                title: kmListingForm.title.trim(),
                description: kmListingForm.description || '',
                address: kmListingForm.address.trim(),
                city: kmListingForm.city || 'Makassar',
                area: kmListingForm.area || '',
                province: kmListingForm.province || 'Sulawesi Selatan',
                type: kmListingForm.type || 'Campur',
                price: finalPrice,
                owner_uid: validOwnerUid,
                is_managed: true,
                status: 'published',
                location: kmListingForm.location || { lat: -5.147665, lng: 119.432731 },
                facilities: kmListingForm.facilities || [],
                public_parking_facilities: kmListingForm.publicParkingFacilities || [],
                public_kitchen_facilities: kmListingForm.publicKitchenFacilities || [],
                public_bathroom_facilities: kmListingForm.publicBathroomFacilities || [],
                rules: kmListingForm.rules || [],
                campuses: kmListingForm.campuses || [],
                image_urls: finalImageUrls,
                room_types: normalizedRoomTypesPayload,
                metadata: {
                    province: kmListingForm.province || '',
                    publicParkingFacilities: kmListingForm.publicParkingFacilities || [],
                    publicKitchenFacilities: kmListingForm.publicKitchenFacilities || [],
                    publicBathroomFacilities: kmListingForm.publicBathroomFacilities || [],
                    totalRooms: kmListingForm.totalRooms || kmListingForm.roomTypes.length,
                    signature_data: signatureData || null,
                    agreed_to_terms: agreedToTerms,
                    managed_at: (editingPropertyId && ((newPropForm as any)?.managed_at || (newPropForm as any)?.metadata?.managed_at)) || new Date().toISOString(),
                    omnichannelContactName: kmListingForm.omnichannelContactName || '',
                    omnichannelContactPhone: kmListingForm.omnichannelContactPhone || ''
                },
                updated_at: new Date().toISOString()
            };

            if (validOwnerUid) {
                propertyPayload.mitra_id = validOwnerUid;
            }

            let savedPropId = editingPropertyId;
            if (editingPropertyId) {
                const { error: updErr } = await supabase
                    .from('properties')
                    .update(propertyPayload)
                    .eq('id', editingPropertyId);
                if (updErr) throw updErr;
            } else {
                const { data: newProp, error: insErr } = await supabase
                    .from('properties')
                    .insert([propertyPayload])
                    .select()
                    .single();
                if (insErr) throw insErr;
                savedPropId = newProp?.id;
            }

            // Sync mitra_kostmanager table
            if (savedPropId) {
                try {
                    const kmPayload = {
                        property_id: savedPropId,
                        owner_uid: validOwnerUid,
                        title: propertyPayload.title,
                        description: propertyPayload.description,
                        price: propertyPayload.price,
                        facilities: propertyPayload.facilities,
                        address: propertyPayload.address,
                        city: propertyPayload.city,
                        area: propertyPayload.area,
                        location: propertyPayload.location,
                        rules: propertyPayload.rules,
                        campuses: propertyPayload.campuses,
                        image_urls: propertyPayload.image_urls,
                        room_types: propertyPayload.room_types
                    };
                    const { data: existingKm } = await supabase
                        .from('mitra_kostmanager')
                        .select('id')
                        .eq('property_id', savedPropId)
                        .maybeSingle();
                    if (existingKm) {
                        await supabase.from('mitra_kostmanager').update(kmPayload).eq('id', existingKm.id);
                    } else {
                        await supabase.from('mitra_kostmanager').insert([kmPayload]);
                    }
                } catch (kmErr) {
                    console.warn('Sync mitra_kostmanager skipped:', kmErr);
                }
            }

            // Sync resident_status for occupied rooms & clean up vacated rooms
            if (savedPropId && Array.isArray(kmListingForm.roomTypes)) {
                for (const rm of kmListingForm.roomTypes) {
                    const isOcc = rm.status === 'Terisi' || rm.status === 'terisi';
                    const resName = (rm.residentName || rm.tenantName || '').trim();
                    const resPhone = (rm.residentPhone || rm.tenantPhone || '').trim();
                    const roomNum = rm.name || rm.roomNumber || '';

                    if (roomNum) {
                        try {
                            if (isOcc && resName) {
                                const { data: existingRes } = await supabase
                                    .from('resident_status')
                                    .select('id, user_id')
                                    .eq('kost_id', savedPropId)
                                    .eq('room_number', roomNum)
                                    .maybeSingle();

                                const resPayload: any = {
                                    kost_id: savedPropId,
                                    room_number: roomNum,
                                    room_type: rm.type || 'Standard',
                                    status: 'ACTIVE',
                                    start_date: rm.startDate || new Date().toISOString().split('T')[0],
                                    end_date: rm.endDate || rm.dueDate || '',
                                    monthly_rent: Number(rm.price || finalPrice || 0),
                                    metadata: {
                                        residentName: resName,
                                        residentPhone: resPhone,
                                        billingPeriod: rm.paymentPeriod || 'bulanan',
                                        currentOccupants: rm.currentOccupants || 1,
                                        additionalOccupants: rm.additionalOccupants || []
                                    }
                                };

                                if (existingRes) {
                                    await supabase.from('resident_status').update(resPayload).eq('id', existingRes.id);
                                } else {
                                    await supabase.from('resident_status').insert([resPayload]);
                                }
                            } else if (!isOcc) {
                                // Bersihkan record resident_status jika kamar dikosongkan
                                await supabase
                                    .from('resident_status')
                                    .delete()
                                    .eq('kost_id', savedPropId)
                                    .eq('room_number', roomNum);
                            }
                        } catch (resErr) {
                            console.warn('Sync resident_status note:', resErr);
                        }
                    }
                }
            }

            alert(editingPropertyId ? 'Perubahan properti kelolaan KostManager berhasil disimpan langsung!' : 'Properti kelolaan KostManager baru berhasil disimpan!');
            onSuccess();
        } catch (err: any) {
            alert('Gagal menyimpan properti: ' + err.message);
        } finally {
            setSavingProp(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#f8f9ff] text-[#0b1c30] w-full max-w-4xl rounded-3xl shadow-2xl relative z-10 flex flex-col h-[92vh] max-h-[900px] overflow-hidden animate-in zoom-in-95 font-['Plus_Jakarta_Sans']">
                
                {/* 1. TOP APP BAR HEADER */}
                <div className="bg-white border-b border-[#e0c0af] px-5 sm:px-6 h-[64px] flex items-center shrink-0 justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            type="button"
                            onClick={() => {
                                if (kmStep > 1) {
                                    setKmStep(kmStep - 1);
                                } else {
                                    onClose();
                                }
                            }}
                            className="text-[#584235] p-2 rounded-full hover:bg-gray-100 transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5 shrink-0" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-extrabold text-[9px] uppercase tracking-widest border border-orange-200">
                                    KostManager
                                </span>
                                <h2 className="text-base font-extrabold text-[#0b1c30] tracking-tight">
                                    {editingPropertyId ? 'Edit Listing Properti Terkelola' : 'Form Pendataan Properti Terkelola'}
                                </h2>
                            </div>
                            <p className="text-[11px] text-[#584235] font-medium hidden sm:block">
                                Form survei dan manajemen listing kelolaan 1:1 auto-pilot
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 2. STEPPER PROGRESS BAR (1:1 DENGAN FORM AGEN) */}
                <div className="bg-white border-b border-[#e0c0af] px-4 sm:px-8 py-3 shrink-0 flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto shadow-2xs">
                    {[
                        { step: 1, label: 'PROPERTI', sub: 'Profil & Fasilitas Umum', icon: Home },
                        { step: 2, label: 'DATA KAMAR', sub: 'Tipe, Tarif & Unit Kamar', icon: Bed },
                        { step: 3, label: 'REVIEW', sub: 'Simpan Properti', icon: CheckCircle2 }
                    ].map(st => {
                        const isCurrent = kmStep === st.step;
                        const isDone = kmStep > st.step;
                        const Icon = st.icon;
                        return (
                            <button
                                key={st.step}
                                type="button"
                                onClick={() => setKmStep(st.step)}
                                className={`flex-1 min-w-[130px] sm:min-w-0 flex items-center gap-2.5 p-2 rounded-2xl transition-all cursor-pointer text-left ${
                                    isCurrent 
                                        ? 'bg-orange-50/80 border border-orange-200 shadow-2xs' 
                                        : 'hover:bg-gray-50 opacity-70 hover:opacity-100'
                                }`}
                            >
                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-all ${
                                    isDone 
                                        ? 'bg-emerald-600 text-white shadow-2xs' 
                                        : (isCurrent ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500')
                                }`}>
                                    {isDone ? <Check size={14} /> : <Icon size={14} />}
                                </span>
                                <div className="truncate">
                                    <span className={`text-[10px] font-black tracking-wider uppercase block ${isCurrent ? 'text-orange-600' : 'text-slate-700'}`}>
                                        {st.step}. {st.label}
                                    </span>
                                    <span className="text-[9px] font-medium text-slate-400 hidden sm:block truncate">
                                        {st.sub}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* 3. MODAL BODY / FORM CONTENT (STEP-BY-STEP) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    
                    {/* ==================================================== */}
                    {/* STEP 1: PROPERTI                                     */}
                    {/* ==================================================== */}
                    {kmStep === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* PROFIL & KONTAK PROPERTI */}
                            <section className="bg-white rounded-2xl p-5 border border-[#e0c0af] shadow-xs space-y-4">
                                <h3 className="font-bold text-sm text-[#0b1c30] border-b border-gray-100 pb-2 flex items-center gap-2">
                                    <Building2 size={16} className="text-orange-500" />
                                    <span>Profil &amp; Kontak Properti</span>
                                </h3>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Nama Properti Kos</label>
                                    <input 
                                        type="text"
                                        value={kmListingForm.title}
                                        onChange={e => setKmListingForm({ ...kmListingForm, title: e.target.value })}
                                        placeholder="Contoh: Kos Buana Raya Makassar"
                                        className="w-full h-[46px] px-3.5 border border-[#8c7263] rounded-xl bg-[#f8f9ff] focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00] outline-none text-sm font-semibold text-slate-900"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kos</label>
                                        <div className="flex bg-[#e5eeff] rounded-xl p-1 gap-1">
                                            {['Putra', 'Putri', 'Campur'].map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setKmListingForm({ ...kmListingForm, type: t })}
                                                    className={`flex-1 h-[36px] rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                                                        kmListingForm.type === t 
                                                            ? 'bg-[#ff7a00] text-white shadow-sm' 
                                                            : 'text-[#584235] hover:bg-[#dce9ff]'
                                                    }`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Total Jumlah Kamar</label>
                                        <input 
                                            type="number"
                                            min="1"
                                            value={kmListingForm.totalRooms || ''}
                                            onChange={e => setKmListingForm({ ...kmListingForm, totalRooms: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) })}
                                            placeholder="Masukkan total jumlah kamar (contoh: 10)"
                                            className="w-full h-[46px] px-3.5 border border-[#8c7263] rounded-xl bg-[#f8f9ff] focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00] outline-none text-sm font-semibold text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Alamat Lengkap Real Bangunan</label>
                                    <textarea
                                        value={kmListingForm.address}
                                        onChange={e => setKmListingForm({ ...kmListingForm, address: e.target.value })}
                                        placeholder="Jalan, Nomor Rumah, RT/RW, Kelurahan, Patokan..."
                                        className="w-full p-3.5 border border-[#8c7263] rounded-xl bg-[#f8f9ff] focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00] outline-none text-sm font-medium min-h-[75px] resize-none text-slate-900"
                                    />
                                </div>

                                {/* 3 Kotak Input Kategori Wilayah Terstruktur */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-[#584235] uppercase tracking-wider flex items-center gap-1">
                                            🏛️ Provinsi
                                        </label>
                                        <input
                                            type="text"
                                            value={kmListingForm.province || ''}
                                            onChange={e => setKmListingForm({ ...kmListingForm, province: e.target.value })}
                                            placeholder="Provinsi"
                                            className="w-full h-[42px] px-3 border border-[#8c7263] rounded-xl bg-[#f8f9ff] focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00] outline-none text-xs font-bold text-slate-800"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-[#584235] uppercase tracking-wider flex items-center gap-1">
                                            🏙️ Kota / Kabupaten
                                        </label>
                                        <input
                                            type="text"
                                            value={kmListingForm.city || ''}
                                            onChange={e => setKmListingForm({ ...kmListingForm, city: e.target.value })}
                                            placeholder="Kota / Kab"
                                            className="w-full h-[42px] px-3 border border-[#8c7263] rounded-xl bg-[#f8f9ff] focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00] outline-none text-xs font-bold text-slate-800"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-[#584235] uppercase tracking-wider flex items-center gap-1">
                                            📍 Kecamatan / Area
                                        </label>
                                        <input
                                            type="text"
                                            value={kmListingForm.area || ''}
                                            onChange={e => setKmListingForm({ ...kmListingForm, area: e.target.value })}
                                            placeholder="Kecamatan"
                                            className="w-full h-[42px] px-3 border border-[#8c7263] rounded-xl bg-[#f8f9ff] focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00] outline-none text-xs font-bold text-slate-800"
                                        />
                                    </div>
                                </div>

                                {/* Lokasi GPS & Mini Map Preview */}
                                <div className="flex flex-col gap-1.5 pt-2">
                                    <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Lokasi GPS &amp; Peta</label>
                                    <div className="rounded-xl overflow-hidden flex flex-col relative border border-[#e0c0af] bg-[#f8f9ff]">
                                        <div ref={kmMapRef} className="w-full h-40 z-0 relative" style={{ minHeight: '160px', touchAction: 'none' }} />
                                        
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setModalTempLocation(kmListingForm.location || { lat: -5.147665, lng: 119.432731 });
                                                setIsMapModalOpen(true);
                                            }}
                                            className="absolute top-2 right-2 z-10 bg-white/95 backdrop-blur-sm hover:bg-white text-gray-800 text-[10px] font-black px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-md flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                        >
                                            <Maximize2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                            Buka Peta Pop-up (Layar Penuh)
                                        </button>

                                        <div className="bg-slate-50 border-t border-gray-100 p-2 flex justify-between items-center">
                                            <p className="text-[10px] text-gray-700 font-black uppercase tracking-wider flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                                                Koordinat Terkunci
                                            </p>
                                            <p className="text-[9px] text-gray-500 font-mono bg-white px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                                                Lat: {kmListingForm.location?.lat?.toFixed(6) || '-'}, Lng: {kmListingForm.location?.lng?.toFixed(6) || '-'}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (navigator.geolocation) {
                                                    navigator.geolocation.getCurrentPosition((pos) => {
                                                        const plat = pos.coords.latitude;
                                                        const plng = pos.coords.longitude;
                                                        reverseGeocodeAndApply(plat, plng);
                                                        alert('Koordinat properti presisi berhasil dikunci & wilayah terdeteksi!');
                                                    }, err => alert('Gagal membaca GPS: ' + err.message));
                                                }
                                            }}
                                            className="w-full h-[44px] bg-[#e5eeff] hover:bg-[#dce9ff] text-[#ff7a00] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border-t border-[#e0c0af] cursor-pointer"
                                        >
                                            <LocateFixed className="w-4 h-4 shrink-0" />
                                            Gunakan Lokasi Saya Saat Ini
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* FULLSCREEN MAP POP-UP MODAL */}
                            {isMapModalOpen && (
                                <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex flex-col justify-center items-center p-2 sm:p-4 md:p-6 animate-fadeIn">
                                    <div className="bg-white w-full max-w-4xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 relative">
                                        <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex justify-between items-center shrink-0">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                                                    <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
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
                                                <X className="w-4 h-4 shrink-0" />
                                            </button>
                                        </div>

                                        <div className="p-3 bg-slate-50 border-b border-gray-100 flex flex-col sm:flex-row gap-2 relative z-20 shrink-0">
                                            <div className="relative flex-1">
                                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Cari nama jalan, tempat, atau lokasi di peta..."
                                                    value={modalSearchQuery}
                                                    onChange={e => handleModalSearch(e.target.value)}
                                                    className="w-full h-10 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 pl-9 pr-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                                                />
                                                {modalSearchResults.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto divide-y divide-gray-50">
                                                        {modalSearchResults.map((r: any, i: number) => (
                                                            <button
                                                                key={r.place_id || i}
                                                                type="button"
                                                                onClick={() => selectModalSearchResult(r)}
                                                                className="w-full p-2.5 text-left text-xs font-medium text-gray-700 hover:bg-orange-50 transition-colors flex items-start gap-2 cursor-pointer"
                                                            >
                                                                <MapPin className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                                                                <span className="line-clamp-2">{r.description || r.structured_formatting?.main_text}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (navigator.geolocation) {
                                                        navigator.geolocation.getCurrentPosition(pos => {
                                                            const lat = pos.coords.latitude, lng = pos.coords.longitude;
                                                            setModalTempLocation({ lat, lng });
                                                            if (modalMarkerInstance.current && modalMapInstance.current) {
                                                                modalMarkerInstance.current.setPosition({ lat, lng });
                                                                modalMapInstance.current.setCenter({ lat, lng });
                                                                modalMapInstance.current.setZoom(17);
                                                            }
                                                        }, err => alert('Gagal mendapatkan GPS: ' + err.message));
                                                    }
                                                }}
                                                className="h-10 px-3.5 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                                            >
                                                <LocateFixed className="w-4 h-4 shrink-0" />
                                                Lokasi GPS Saya
                                            </button>
                                        </div>

                                        <div className="relative flex-1 w-full bg-gray-100">
                                            <div ref={modalMapRef} className="w-full h-full" />
                                            <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-sm rounded-2xl p-3 border border-gray-200 shadow-lg z-10 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-gray-400">Koordinat Dipilih</p>
                                                        <p className="text-xs font-mono font-black text-gray-800">
                                                            {modalTempLocation.lat.toFixed(6)}, {modalTempLocation.lng.toFixed(6)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white border-t border-gray-100 p-3.5 sm:px-6 flex items-center justify-end gap-3 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setIsMapModalOpen(false)}
                                                className="px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleConfirmModalLocation}
                                                className="px-6 py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                                                Kunci &amp; Gunakan Lokasi Ini
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* LANDMARK & FASILITAS TERDEKAT */}
                            <section className="bg-white rounded-2xl p-5 border border-[#e0c0af] shadow-xs space-y-3">
                                <h4 className="font-bold text-xs text-[#0b1c30] uppercase tracking-wider flex items-center gap-2">
                                    <MapPin size={14} className="text-orange-500" />
                                    <span>Fasilitas &amp; Landmark Terdekat</span>
                                </h4>
                                
                                {kmListingForm.campuses && kmListingForm.campuses.map((camp: any, cIdx: number) => (
                                    <div key={cIdx} className="flex justify-between items-center bg-[#f8f9ff] p-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700">
                                        <span>📍 {camp.name} ({camp.lat?.toFixed(4)}, {camp.lng?.toFixed(4)})</span>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setKmListingForm({
                                                    ...kmListingForm,
                                                    campuses: kmListingForm.campuses.filter((_: any, idx: number) => idx !== cIdx)
                                                });
                                            }}
                                            className="text-red-500 hover:text-red-700 font-bold text-xs cursor-pointer"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                ))}

                                <div className="pt-2 border-t border-gray-200/60">
                                    {!showAddLandmarkForm ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddLandmarkForm(true);
                                                setLandmarkLocation(kmListingForm.location || { lat: -5.147665, lng: 119.432731 });
                                            }}
                                            className="w-full h-[40px] border border-dashed border-[#ff7a00] hover:bg-orange-50/50 text-[#ff7a00] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                        >
                                            <MapPin className="w-4 h-4 shrink-0" />
                                            + Tambah Landmark Baru
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-3 bg-[#fdfdfd] p-3.5 rounded-xl border border-[#e0c0af] mt-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-[#584235] uppercase tracking-wider">Form Tambah Landmark</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setNewLandmarkName('');
                                                        setGoogleMapsUrlInput('');
                                                        setShowAddLandmarkForm(false);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                                                >
                                                    Batal
                                                </button>
                                            </div>

                                            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() => setLandmarkInputMethod('search')}
                                                    className={`flex-1 py-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                                        landmarkInputMethod === 'search' ? 'bg-[#ff7a00] text-white shadow-xs' : 'text-[#584235] hover:bg-gray-200'
                                                    }`}
                                                >
                                                    <Search className="w-3 h-3 shrink-0" />
                                                    Cari Nama Lokasi
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLandmarkInputMethod('gmaps')}
                                                    className={`flex-1 py-1.5 text-[10px] font-extrabold uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                                        landmarkInputMethod === 'gmaps' ? 'bg-[#ff7a00] text-white shadow-xs' : 'text-[#584235] hover:bg-gray-200'
                                                    }`}
                                                >
                                                    <LinkIcon className="w-3 h-3 shrink-0" />
                                                    Konversi Link GMaps
                                                </button>
                                            </div>

                                            {landmarkInputMethod === 'search' ? (
                                                <div className="flex flex-col gap-1 w-full relative">
                                                    <div className="flex gap-2 w-full">
                                                        <input 
                                                            type="text"
                                                            placeholder="Nama Landmark (misal: Universitas Hasanuddin)"
                                                            value={newLandmarkName}
                                                            onChange={e => setNewLandmarkName(e.target.value)}
                                                            className="flex-1 h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!newLandmarkName.trim()) return alert('Ketik nama landmark yang dicari');
                                                                const gw = (window as any).google;
                                                                if (!gw?.maps?.Geocoder) return alert('Google Maps belum siap.');
                                                                const geocoder = new gw.maps.Geocoder();
                                                                geocoder.geocode(
                                                                    { address: newLandmarkName + ', Indonesia', componentRestrictions: { country: 'ID' } },
                                                                    (results: any[], status: string) => {
                                                                        if (status === 'OK' && results && results.length > 0) {
                                                                            const loc = results[0].geometry.location;
                                                                            setLandmarkLocation({ lat: loc.lat(), lng: loc.lng() });
                                                                            setLandmarkSuggestions([]);
                                                                            alert(`Lokasi ditemukan: ${results[0].formatted_address}`);
                                                                        } else {
                                                                            alert('Lokasi tidak ditemukan. Coba gunakan tab Konversi Link GMaps.');
                                                                        }
                                                                    }
                                                                );
                                                            }}
                                                            className="bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs uppercase px-3 rounded-lg border border-orange-200 transition-colors cursor-pointer"
                                                        >
                                                            Cari
                                                        </button>
                                                    </div>
                                                    
                                                    {landmarkSuggestions.length > 0 && (
                                                        <div className="absolute top-[40px] left-0 right-0 bg-white border border-[#e0c0af] rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-gray-100">
                                                            {landmarkSuggestions.map((suggestion: any, idx: number) => (
                                                                <div 
                                                                    key={suggestion.place_id || idx}
                                                                    onClick={() => {
                                                                        const gw = (window as any).google;
                                                                        if (!gw?.maps?.Geocoder) return;
                                                                        const geocoder = new gw.maps.Geocoder();
                                                                        geocoder.geocode(
                                                                            { placeId: suggestion.place_id },
                                                                            (results: any[], status: string) => {
                                                                                if (status === 'OK' && results && results.length > 0) {
                                                                                    const loc = results[0].geometry.location;
                                                                                    setLandmarkLocation({ lat: loc.lat(), lng: loc.lng() });
                                                                                }
                                                                            }
                                                                        );
                                                                        const shortName = suggestion.structured_formatting?.main_text || suggestion.description.split(',')[0];
                                                                        setNewLandmarkName(shortName);
                                                                        setLandmarkSuggestions([]);
                                                                    }}
                                                                    className="p-2.5 text-[10px] text-gray-700 font-medium hover:bg-orange-50 cursor-pointer transition-colors text-left truncate"
                                                                >
                                                                    📍 {suggestion.description || suggestion.structured_formatting?.main_text}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text"
                                                            placeholder="Tempel link Google Maps / koordinat raw"
                                                            value={googleMapsUrlInput}
                                                            onChange={e => {
                                                                setGoogleMapsUrlInput(e.target.value);
                                                                const parsed = parseGoogleMapsUrl(e.target.value);
                                                                if (parsed) setLandmarkLocation(parsed);
                                                            }}
                                                            className="flex-1 h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const parsed = parseGoogleMapsUrl(googleMapsUrlInput);
                                                                if (parsed) {
                                                                    setLandmarkLocation(parsed);
                                                                    alert('Koordinat berhasil dikonversi!');
                                                                } else {
                                                                    alert('Link atau koordinat tidak valid.');
                                                                }
                                                            }}
                                                            className="bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs uppercase px-3 rounded-lg border border-orange-200 transition-colors cursor-pointer"
                                                        >
                                                            Konversi
                                                        </button>
                                                    </div>
                                                    <input 
                                                        type="text"
                                                        placeholder="Nama Landmark..."
                                                        value={newLandmarkName}
                                                        onChange={e => setNewLandmarkName(e.target.value)}
                                                        className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                    />
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!newLandmarkName.trim()) return alert('Isi nama landmark');
                                                    setKmListingForm({
                                                        ...kmListingForm,
                                                        campuses: [
                                                            ...(kmListingForm.campuses || []),
                                                            {
                                                                name: newLandmarkName.trim(),
                                                                lat: landmarkLocation.lat,
                                                                lng: landmarkLocation.lng
                                                            }
                                                        ]
                                                    });
                                                    setNewLandmarkName('');
                                                    setGoogleMapsUrlInput('');
                                                    setShowAddLandmarkForm(false);
                                                }}
                                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-lg shadow-sm transition-all cursor-pointer"
                                            >
                                                + Simpan Landmark
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* FASILITAS UMUM PROPERTI */}
                            <div className="flex flex-col gap-1.5 p-4 bg-white rounded-2xl border border-[#e0c0af] shadow-xs relative transition-all">
                                <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">FASILITAS UMUM</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['WiFi', 'Dapur Bersama', 'Area Parkir', 'Ruang Tamu', 'CCTV', 'Laundry', 'WC Umum'].map(fac => {
                                        const isChecked = checkHasFacility(kmListingForm.facilities, fac);
                                        return (
                                            <React.Fragment key={fac}>
                                                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                                                    isChecked 
                                                        ? 'border-[#ff7a00] bg-orange-50/50 text-[#584235] font-bold shadow-xs' 
                                                        : 'border-[#e0c0af] bg-[#f8f9ff] text-gray-600'
                                                }`}>
                                                    <input 
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {
                                                            const current = kmListingForm.facilities || [];
                                                            const hasIt = checkHasFacility(current, fac);
                                                            let updated;
                                                            if (hasIt) {
                                                                const normalizedTarget = fac.toLowerCase().trim();
                                                                const synonyms: Record<string, string[]> = {
                                                                    'wifi': ['wifi', 'wi-fi', 'internet'],
                                                                    'dapur bersama': ['dapur', 'dapur bersama', 'dapur umum'],
                                                                    'area parkir': ['parkir', 'parkiran', 'tempat parkir', 'area parkir', 'parkir motor', 'parkir mobil', 'parkir sepeda'],
                                                                    'ruang tamu': ['ruang tamu', 'ruang santai'],
                                                                    'cctv': ['cctv', 'kamera keamanan'],
                                                                    'laundry': ['laundry', 'mesin cuci', 'cuci'],
                                                                    'wc umum': ['wc umum', 'toilet umum', 'kamar mandi luar', 'wc luar']
                                                                };
                                                                const targetSyns = synonyms[normalizedTarget] || [normalizedTarget];
                                                                updated = current.filter((f: string) => {
                                                                    const nf = (f || '').toLowerCase().trim();
                                                                    return !targetSyns.some(syn => nf.includes(syn) || syn.includes(nf));
                                                                });
                                                            } else {
                                                                updated = [...current, fac];
                                                            }
                                                            
                                                            let additionalFormUpdates: any = {};
                                                            if (fac === 'Area Parkir' && !hasIt && (!kmListingForm.publicParkingFacilities || kmListingForm.publicParkingFacilities.length === 0)) {
                                                                additionalFormUpdates.publicParkingFacilities = ['Parkir Motor'];
                                                            }

                                                            setKmListingForm({ ...kmListingForm, facilities: updated, ...additionalFormUpdates });
                                                        }}
                                                        className="rounded text-[#ff7a00] focus:ring-[#ff7a00] border-gray-300 w-4 h-4 cursor-pointer"
                                                    />
                                                    <span className="text-xs uppercase tracking-wider">{fac}</span>
                                                </label>

                                                {/* Sub-input Dapur Bersama - Inline Contextual */}
                                                {fac === 'Dapur Bersama' && isChecked && (
                                                    <div className="col-span-2 pl-6 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl animate-fadeIn">
                                                        <span className="text-[10px] font-black text-[#584235] uppercase tracking-wider mb-0.5">Kelengkapan Dapur Bersama:</span>
                                                        <div className="grid grid-cols-2 gap-2.5">
                                                            {['Kompor', 'Kulkas', 'Dispenser', 'Wastafel Cuci Piring', 'Peralatan Masak', 'Meja Makan'].map(kfac => {
                                                                const isKChecked = kmListingForm.publicKitchenFacilities?.includes(kfac);
                                                                return (
                                                                    <label key={kfac} className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={!!isKChecked}
                                                                            onChange={() => {
                                                                                const current = kmListingForm.publicKitchenFacilities || [];
                                                                                const updated = current.includes(kfac)
                                                                                    ? current.filter((f: string) => f !== kfac)
                                                                                    : [...current, kfac];
                                                                                setKmListingForm({ ...kmListingForm, publicKitchenFacilities: updated });
                                                                            }}
                                                                            className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5 cursor-pointer"
                                                                        />
                                                                        <span className="text-xs text-[#584235] uppercase tracking-wider font-bold">{kfac}</span>
                                                                    </label>
                                                                );
                                                            })}

                                                            {/* Custom kitchen tags */}
                                                            {(() => {
                                                                const kCustoms = kmListingForm.publicKitchenFacilities?.filter((f: string) => !['Kompor', 'Kulkas', 'Dispenser', 'Wastafel Cuci Piring', 'Peralatan Masak', 'Meja Makan'].includes(f)) || [];
                                                                if (kCustoms.length === 0) return null;
                                                                return (
                                                                    <div className="col-span-2 flex flex-wrap gap-1 mt-1 border-t border-orange-100 pt-2">
                                                                        {kCustoms.map((facItem: string) => (
                                                                            <span key={facItem} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                {facItem}
                                                                                <button 
                                                                                    type="button" 
                                                                                    onClick={() => {
                                                                                        const current = kmListingForm.publicKitchenFacilities || [];
                                                                                        setKmListingForm({ ...kmListingForm, publicKitchenFacilities: current.filter((f) => f !== facItem) });
                                                                                    }}
                                                                                    className="hover:text-orange-700 text-xs font-bold leading-none p-0.5 cursor-pointer"
                                                                                >
                                                                                    &times;
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Custom kitchen facility input adder */}
                                                            <div className="col-span-2 flex gap-1.5 mt-1 border-t border-orange-100 pt-2">
                                                                <input 
                                                                    type="text" 
                                                                    value={customPublicKitchenFacilityInput} 
                                                                    onChange={e => setCustomPublicKitchenFacilityInput(e.target.value)} 
                                                                    placeholder="Tambah kelengkapan dapur..." 
                                                                    className="flex-grow h-[32px] px-2.5 border border-[#e0c0af] rounded-lg text-[11px] bg-white outline-none text-[#584235] font-bold"
                                                                />
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!customPublicKitchenFacilityInput.trim()) return;
                                                                        const current = kmListingForm.publicKitchenFacilities || [];
                                                                        if (!current.includes(customPublicKitchenFacilityInput.trim())) {
                                                                            setKmListingForm({ ...kmListingForm, publicKitchenFacilities: [...current, customPublicKitchenFacilityInput.trim()] });
                                                                        }
                                                                        setCustomPublicKitchenFacilityInput('');
                                                                    }}
                                                                    className="h-[32px] px-3.5 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase rounded-lg flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Sub-input Area Parkir - Inline Contextual */}
                                                {fac === 'Area Parkir' && isChecked && (
                                                    <div className="col-span-2 pl-6 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl animate-fadeIn">
                                                        <span className="text-[10px] font-black text-[#584235] uppercase tracking-wider mb-0.5">Kelengkapan Area Parkir:</span>
                                                        <div className="grid grid-cols-2 gap-2.5">
                                                            {['Parkir Motor', 'Parkir Mobil', 'Parkir Sepeda'].map(pfac => {
                                                                const isPChecked = kmListingForm.publicParkingFacilities?.includes(pfac);
                                                                return (
                                                                    <label key={pfac} className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={!!isPChecked}
                                                                            onChange={() => {
                                                                                const current = kmListingForm.publicParkingFacilities || [];
                                                                                const updated = current.includes(pfac)
                                                                                    ? current.filter((f: string) => f !== pfac)
                                                                                    : [...current, pfac];
                                                                                setKmListingForm({ ...kmListingForm, publicParkingFacilities: updated });
                                                                            }}
                                                                            className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5 cursor-pointer"
                                                                        />
                                                                        <span className="text-xs text-[#584235] uppercase tracking-wider font-bold">{pfac}</span>
                                                                    </label>
                                                                );
                                                            })}

                                                            {/* Custom parking tags */}
                                                            {(() => {
                                                                const pCustoms = kmListingForm.publicParkingFacilities?.filter((f: string) => !['Parkir Motor', 'Parkir Mobil', 'Parkir Sepeda'].includes(f)) || [];
                                                                if (pCustoms.length === 0) return null;
                                                                return (
                                                                    <div className="col-span-2 flex flex-wrap gap-1 mt-1 border-t border-orange-100 pt-2">
                                                                        {pCustoms.map((facItem: string) => (
                                                                            <span key={facItem} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                {facItem}
                                                                                <button 
                                                                                    type="button" 
                                                                                    onClick={() => {
                                                                                        const current = kmListingForm.publicParkingFacilities || [];
                                                                                        setKmListingForm({ ...kmListingForm, publicParkingFacilities: current.filter((f) => f !== facItem) });
                                                                                    }}
                                                                                    className="hover:text-orange-700 text-xs font-bold leading-none p-0.5 cursor-pointer"
                                                                                >
                                                                                    &times;
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Custom parking facility input adder */}
                                                            <div className="col-span-2 flex gap-1.5 mt-1 border-t border-orange-100 pt-2">
                                                                <input 
                                                                    type="text" 
                                                                    value={customPublicParkingFacilityInput} 
                                                                    onChange={e => setCustomPublicParkingFacilityInput(e.target.value)} 
                                                                    placeholder="Tambah kelengkapan parkir..." 
                                                                    className="flex-grow h-[32px] px-2.5 border border-[#e0c0af] rounded-lg text-[11px] bg-white outline-none text-[#584235] font-bold"
                                                                />
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!customPublicParkingFacilityInput.trim()) return;
                                                                        const current = kmListingForm.publicParkingFacilities || [];
                                                                        if (!current.includes(customPublicParkingFacilityInput.trim())) {
                                                                            setKmListingForm({ ...kmListingForm, publicParkingFacilities: [...current, customPublicParkingFacilityInput.trim()] });
                                                                        }
                                                                        setCustomPublicParkingFacilityInput('');
                                                                    }}
                                                                    className="h-[32px] px-3.5 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase rounded-lg flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Sub-input WC Umum - Inline Contextual */}
                                                {fac === 'WC Umum' && isChecked && (
                                                    <div className="col-span-2 pl-6 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl animate-fadeIn">
                                                        <span className="text-[10px] font-black text-[#584235] uppercase tracking-wider mb-0.5">Kelengkapan WC Umum:</span>
                                                        <div className="grid grid-cols-2 gap-2.5">
                                                            {['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].map(bfac => {
                                                                const isBChecked = kmListingForm.publicBathroomFacilities?.includes(bfac);
                                                                return (
                                                                    <label key={bfac} className="flex items-center gap-2 cursor-pointer">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={!!isBChecked}
                                                                            onChange={() => {
                                                                                const current = kmListingForm.publicBathroomFacilities || [];
                                                                                const updated = current.includes(bfac)
                                                                                    ? current.filter((f: string) => f !== bfac)
                                                                                    : [...current, bfac];
                                                                                setKmListingForm({ ...kmListingForm, publicBathroomFacilities: updated });
                                                                            }}
                                                                            className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5 cursor-pointer"
                                                                        />
                                                                        <span className="text-xs text-[#584235] uppercase tracking-wider font-bold">{bfac}</span>
                                                                    </label>
                                                                );
                                                            })}

                                                            {/* Custom bathroom tags */}
                                                            {(() => {
                                                                const bCustoms = kmListingForm.publicBathroomFacilities?.filter((f: string) => !['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].includes(f)) || [];
                                                                if (bCustoms.length === 0) return null;
                                                                return (
                                                                    <div className="col-span-2 flex flex-wrap gap-1 mt-1 border-t border-orange-100 pt-2">
                                                                        {bCustoms.map((facItem: string) => (
                                                                            <span key={facItem} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                {facItem}
                                                                                <button 
                                                                                    type="button" 
                                                                                    onClick={() => {
                                                                                        const current = kmListingForm.publicBathroomFacilities || [];
                                                                                        setKmListingForm({ ...kmListingForm, publicBathroomFacilities: current.filter((f) => f !== facItem) });
                                                                                    }}
                                                                                    className="hover:text-orange-700 text-xs font-bold leading-none p-0.5 cursor-pointer"
                                                                                >
                                                                                    &times;
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()}

                                                            {/* Custom bathroom facility input adder */}
                                                            <div className="col-span-2 flex gap-1.5 mt-1 border-t border-orange-100 pt-2">
                                                                <input 
                                                                    type="text" 
                                                                    value={customPublicBathroomFacilityInput} 
                                                                    onChange={e => setCustomPublicBathroomFacilityInput(e.target.value)} 
                                                                    placeholder="Tambah kelengkapan WC..." 
                                                                    className="flex-grow h-[32px] px-2.5 border border-[#e0c0af] rounded-lg text-[11px] bg-white outline-none text-[#584235] font-bold"
                                                                />
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!customPublicBathroomFacilityInput.trim()) return;
                                                                        const current = kmListingForm.publicBathroomFacilities || [];
                                                                        if (!current.includes(customPublicBathroomFacilityInput.trim())) {
                                                                            setKmListingForm({ ...kmListingForm, publicBathroomFacilities: [...current, customPublicBathroomFacilityInput.trim()] });
                                                                        }
                                                                        setCustomPublicBathroomFacilityInput('');
                                                                    }}
                                                                    className="h-[32px] px-3.5 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase rounded-lg flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>

                                {/* Custom Facilities Badges */}
                                {kmListingForm.facilities && kmListingForm.facilities.filter((f: string) => !['wifi', 'dapur bersama', 'area parkir', 'ruang tamu', 'cctv', 'laundry', 'wc umum'].includes(f.toLowerCase().trim())).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {kmListingForm.facilities.filter((f: string) => !['wifi', 'dapur bersama', 'area parkir', 'ruang tamu', 'cctv', 'laundry', 'wc umum'].includes(f.toLowerCase().trim())).map((fac: string) => (
                                            <span key={fac} className="inline-flex items-center gap-1.5 bg-[#eff4ff] text-[#264191] text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-[#d3e4fe]">
                                                <span>{fac}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setKmListingForm({
                                                            ...kmListingForm,
                                                            facilities: kmListingForm.facilities.filter((f: string) => f !== fac)
                                                        });
                                                    }}
                                                    className="text-red-500 hover:text-red-700 font-bold ml-1 text-[11px] leading-none cursor-pointer"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2 mt-2">
                                    <input 
                                        type="text"
                                        placeholder="Tambah fasilitas kustom..."
                                        value={newFacilityName}
                                        onChange={e => setNewFacilityName(e.target.value)}
                                        className="flex-1 h-[38px] px-3.5 border border-[#e0c0af] rounded-xl text-xs outline-none bg-white font-medium focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!newFacilityName.trim()) return;
                                            setKmListingForm({
                                                ...kmListingForm,
                                                facilities: [...(kmListingForm.facilities || []), newFacilityName.trim()]
                                            });
                                            setNewFacilityName('');
                                        }}
                                        className="bg-[#ff7a00] hover:bg-orange-600 text-white px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                                    >
                                        + Tambah
                                    </button>
                                </div>
                            </div>

                            {/* DOKUMENTASI AREA UMUM & FASILITAS PROPERTI */}
                            <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-[#e0c0af] shadow-xs relative transition-all">
                                <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider block">
                                    DOKUMENTASI AREA UMUM &amp; FASILITAS PROPERTI
                                </label>
                                {(() => {
                                    const imagesWithCats = (kmListingForm.image_urls || []).map((urlOrObj: any, idx: number) => {
                                        const url = getImageUrlString(urlOrObj);
                                        let rawCat = (typeof urlOrObj === 'object' && urlOrObj.label)
                                            ? urlOrObj.label
                                            : (kmListingForm.photoCategories?.[idx] || (idx < photoCategories.length ? photoCategories[idx] : `Foto Area Lainnya ${idx + 1}`));
                                        
                                        const lower = (rawCat || '').toLowerCase().trim();
                                        if (lower.includes('fasad') || lower.includes('depan') || lower.includes('gedung') || lower.includes('tampak depan')) {
                                            rawCat = 'Bangunan Depan';
                                        } else if (lower.includes('koridor') || lower.includes('lorong') || lower.includes('akses') || lower.includes('pintu masuk')) {
                                            rawCat = 'Koridor';
                                        } else if (lower.includes('area umum') || lower.includes('parkiran') || lower.includes('parkir motor') || lower.includes('parkir mobil') || lower.includes('parkir') || lower.includes('garasi')) {
                                            rawCat = 'Area Parkir';
                                        } else if (lower.includes('dapur')) {
                                            rawCat = 'Dapur Bersama';
                                        } else if (lower.includes('wc') || lower.includes('toilet') || lower.includes('kamar mandi luar')) {
                                            rawCat = 'WC Umum';
                                        } else if (lower.includes('lingkungan') || lower.includes('taman') || lower.includes('sekitar')) {
                                            rawCat = 'Lingkungan';
                                        } else if (lower.includes('ruang tamu') || lower.includes('ruang santai')) {
                                            rawCat = 'Ruang Tamu';
                                        } else if (lower.includes('cctv')) {
                                            rawCat = 'CCTV';
                                        } else if (lower.includes('laundry') || lower.includes('jemuran') || lower.includes('cuci')) {
                                            rawCat = 'Laundry';
                                        }

                                        return { url, idx, rawCat };
                                    }).filter((item: any) => !!item.url);

                                    return (
                                        <div className="space-y-3">
                                            {photoCategories.map((label: string) => {
                                                const catPhotos = imagesWithCats.filter((item: any) => item.rawCat === label);

                                                return (
                                                    <div key={label} className="bg-white border border-[#e0c0af]/60 rounded-2xl p-3.5 shadow-xs space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-1.5">
                                                                {label.includes('Depan') ? <Home className="w-4 h-4 text-[#ff7a00] shrink-0" /> :
                                                                 label.includes('Parkir') ? <MapPin className="w-4 h-4 text-[#ff7a00] shrink-0" /> :
                                                                 label.includes('Dapur') ? <Home className="w-4 h-4 text-[#ff7a00] shrink-0" /> :
                                                                 <Camera className="w-4 h-4 text-[#ff7a00] shrink-0" />}
                                                                <span className="text-xs font-black text-[#0b1c30] uppercase tracking-wider">{label}</span>
                                                            </div>
                                                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                                catPhotos.length > 0 ? 'bg-orange-100 text-[#ff7a00]' : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                                {catPhotos.length} Foto
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                                            {catPhotos.map((p: any, pIdx: number) => (
                                                                <div key={p.idx} className="aspect-video w-full rounded-xl overflow-hidden border border-gray-200 relative group bg-gray-50">
                                                                    <img src={getImageUrlString(p.url)} alt={`${label} ${pIdx + 1}`} className="w-full h-full object-cover" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updatedImages = [...(kmListingForm.image_urls || [])];
                                                                            const updatedCats = [...(kmListingForm.photoCategories || [])];
                                                                            updatedImages.splice(p.idx, 1);
                                                                            updatedCats.splice(p.idx, 1);
                                                                            setKmListingForm({ 
                                                                                ...kmListingForm, 
                                                                                image_urls: updatedImages,
                                                                                photoCategories: updatedCats
                                                                            });
                                                                        }}
                                                                        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md transition-all active:scale-90 cursor-pointer"
                                                                        title="Hapus foto ini"
                                                                    >
                                                                        &times;
                                                                    </button>
                                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-1 px-1.5 text-[9px] text-white text-center uppercase font-black tracking-wider truncate">
                                                                        {label} {pIdx + 1}
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            <label 
                                                                className={`aspect-video bg-white border-2 border-dashed border-[#ff7a00] rounded-xl flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-orange-50/50 transition-all text-[#584235] ${
                                                                    catPhotos.length === 0 ? 'col-span-2 sm:col-span-3 py-6' : ''
                                                                }`}
                                                            >
                                                                <input 
                                                                    type="file"
                                                                    accept="image/*"
                                                                    multiple
                                                                    className="hidden"
                                                                    disabled={uploadingPublicAreas[`public_${label}`]}
                                                                    onChange={async (e) => {
                                                                        const files = e.target.files;
                                                                        if (files && files.length > 0) {
                                                                            const uploadKey = `public_${label}`;
                                                                            setUploadingPublicAreas(prev => ({ ...prev, [uploadKey]: true }));
                                                                            try {
                                                                                const newUrls: any[] = [];
                                                                                for (let f = 0; f < files.length; f++) {
                                                                                    const webpFile = await compressImageToWebP(files[f]);
                                                                                    const folder = `kostmanager/public/${Date.now()}_${f}`;
                                                                                    const publicUrl = await uploadFileAndGetURL(webpFile, folder);
                                                                                    newUrls.push({ original: publicUrl, url: publicUrl, label });
                                                                                }
                                                                                const updatedImages = [...(kmListingForm.image_urls || []), ...newUrls];
                                                                                const updatedCats = [...(kmListingForm.photoCategories || []), ...newUrls.map(() => label)];
                                                                                setKmListingForm({ 
                                                                                    ...kmListingForm, 
                                                                                    image_urls: updatedImages,
                                                                                    photoCategories: updatedCats
                                                                                });
                                                                            } catch (err: any) {
                                                                                alert('Gagal unggah foto: ' + err.message);
                                                                            } finally {
                                                                                setUploadingPublicAreas(prev => ({ ...prev, [uploadKey]: false }));
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                                {uploadingPublicAreas[`public_${label}`] ? (
                                                                    <span className="text-[11px] font-bold animate-pulse text-gray-500">Mengunggah...</span>
                                                                ) : (
                                                                    <>
                                                                        <ImagePlus className="w-6 h-6 text-[#ff7a00] shrink-0" />
                                                                        <span className="text-[10px] font-black uppercase tracking-wider mt-1 text-center">
                                                                            {catPhotos.length === 0 ? `+ Unggah Foto ${label}` : '+ Tambah Foto'}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </label>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}

                                <div className="flex gap-2 mt-1">
                                    <input 
                                        type="text" 
                                        placeholder="Kategori Foto Baru (misal: Dapur Bersama)" 
                                        value={newPhotoCategoryName} 
                                        onChange={e => setNewPhotoCategoryName(e.target.value)} 
                                        className="flex-1 h-[38px] px-3.5 border border-[#e0c0af] rounded-xl text-xs outline-none bg-white font-medium focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00]" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (!newPhotoCategoryName.trim()) return;
                                            const cat = newPhotoCategoryName.trim();
                                            setPhotoCategories(prev => [...prev, cat]);
                                            setNewPhotoCategoryName('');
                                        }} 
                                        className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#ff7a00] font-black text-xs uppercase tracking-wider px-4 rounded-xl border border-[#e0c0af] transition-all cursor-pointer"
                                    >
                                        + Kategori Area
                                    </button>
                                </div>
                            </div>

                            {/* PERATURAN KOST */}
                            <section className="bg-white rounded-2xl p-5 border border-[#e0c0af] shadow-xs space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-2">
                                    <div>
                                        <h4 className="font-bold text-xs text-[#0b1c30] uppercase tracking-wider flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-orange-500" />
                                            <span>Peraturan Kost</span>
                                        </h4>
                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                            Aturan &amp; tata tertib yang berlaku bagi seluruh penghuni properti
                                        </p>
                                    </div>
                                    <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-auto">
                                        {(kmListingForm.rules || []).length} Aturan Aktif
                                    </span>
                                </div>

                                {/* Quick Preset Chips */}
                                <div className="space-y-1.5 pt-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                        ⚡ Rekomendasi Aturan Populer:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            'Tidak boleh membawa hewan peliharaan',
                                            'Tamu dilarang menginap',
                                            'Dilarang merokok di dalam kamar',
                                            'Akses gerbang 24 jam',
                                            'Jam malam maksimal 23:00',
                                            'Dilarang membuat kegaduhan'
                                        ].map(preset => {
                                            const isSelected = (kmListingForm.rules || []).includes(preset);
                                            return (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => {
                                                        const cur = kmListingForm.rules || [];
                                                        const next = isSelected ? cur.filter((r: string) => r !== preset) : [...cur, preset];
                                                        setKmListingForm({ ...kmListingForm, rules: next });
                                                    }}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                                        isSelected 
                                                            ? 'bg-orange-500 text-white shadow-2xs' 
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    <span>{isSelected ? '✓ ' : '+ '}{preset}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* List of Active Rules (Editable & Deletable) */}
                                <div className="flex flex-col gap-2 pt-2">
                                    {(kmListingForm.rules || []).map((rule: string, rIdx: number) => (
                                        <div key={rIdx} className="flex items-center gap-2">
                                            <textarea 
                                                value={rule}
                                                rows={2}
                                                maxLength={100}
                                                onChange={e => {
                                                    const updated = [...(kmListingForm.rules || [])];
                                                    updated[rIdx] = e.target.value.slice(0, 100);
                                                    setKmListingForm({ ...kmListingForm, rules: updated });
                                                }}
                                                className="flex-1 min-h-[46px] p-2.5 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 bg-slate-50/50 resize-none leading-normal outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setKmListingForm({
                                                        ...kmListingForm,
                                                        rules: (kmListingForm.rules || []).filter((_: any, idx: number) => idx !== rIdx)
                                                    });
                                                }}
                                                className="text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
                                                title="Hapus Peraturan"
                                            >
                                                <Trash2 className="w-4 h-4 shrink-0" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Input Tambah Peraturan Baru */}
                                    <div className="flex gap-2 mt-1">
                                        <input 
                                            type="text"
                                            placeholder="Tambah peraturan baru..."
                                            value={newRuleName}
                                            maxLength={100}
                                            onChange={e => setNewRuleName(e.target.value.slice(0, 100))}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (!newRuleName.trim()) return;
                                                    setKmListingForm({
                                                        ...kmListingForm,
                                                        rules: [...(kmListingForm.rules || []), newRuleName.trim()]
                                                    });
                                                    setNewRuleName('');
                                                }
                                            }}
                                            className="flex-1 h-[38px] px-3.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white placeholder-slate-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!newRuleName.trim()) return;
                                                setKmListingForm({
                                                    ...kmListingForm,
                                                    rules: [...(kmListingForm.rules || []), newRuleName.trim()]
                                                });
                                                setNewRuleName('');
                                            }}
                                            className="bg-[#ff7a00] hover:bg-orange-600 text-white px-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                                        >
                                            + Tambah
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* ==================================================== */}
                    {/* STEP 2: DATA KAMAR                                   */}
                    {/* ==================================================== */}
                    {kmStep === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* PROGRESS TARGET KAMAR & DAFTAR UNIT */}
                            <div className="bg-white p-5 rounded-2xl border border-[#e0c0af] shadow-xs space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                    <div>
                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">Progres Kamar Terdata</span>
                                        <h3 className="text-sm font-black text-slate-900">
                                            {kmListingForm.roomTypes?.length || 0} dari {kmListingForm.totalRooms || 0} Kamar Didata
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddNewRoom}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
                                    >
                                        <Plus size={14} />
                                        <span>+ Tambah Kamar Baru</span>
                                    </button>
                                </div>

                                {/* LIST KAMAR ACCORDION */}
                                <div className="space-y-3">
                                    {(kmListingForm.roomTypes || []).map((rm: any, rIdx: number) => {
                                        const isExpanded = activeRoomIdx === rIdx;
                                        const isOcc = rm.status === 'Terisi' || rm.status === 'terisi';

                                        const rmCategorized = getRoomCategorizedPhotos(rm);
                                        const allPhotos = Object.values(rmCategorized).flat().filter(Boolean);
                                        const firstPhotoUrl = allPhotos[0] || (Array.isArray(rm.images) ? getImageUrlString(rm.images[0]) : '');
                                        const totalPhotos = allPhotos.length || (Array.isArray(rm.images) ? rm.images.length : 0);

                                        return (
                                            <div key={rIdx} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-xs">
                                                {/* Header Accordion */}
                                                <div 
                                                    onClick={() => setActiveRoomIdx(isExpanded ? null : rIdx)}
                                                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {firstPhotoUrl ? (
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200 shadow-2xs relative group">
                                                                <img src={firstPhotoUrl} alt={rm.name} className="w-full h-full object-cover" />
                                                                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-black text-white text-center py-0.5">
                                                                    {totalPhotos} 📷
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-orange-100/70 border border-orange-200/60 flex flex-col items-center justify-center text-orange-600 shrink-0">
                                                                <Bed size={18} />
                                                                <span className="text-[7px] font-black uppercase mt-0.5">0 Foto</span>
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="font-black text-sm text-slate-900 truncate">{rm.name || `Kamar #${rIdx + 1}`}</h4>
                                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                                    isOcc ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                                                }`}>
                                                                    {isOcc ? '🔒 Terisi' : '✨ Kosong'}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                                                                    totalPhotos > 0 ? 'bg-orange-50 text-orange-700 border border-orange-200/80' : 'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                    {totalPhotos > 0 ? `📷 ${totalPhotos} Foto` : 'Belum Ada Foto'}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 font-bold mt-0.5 truncate">
                                                                {rm.floor || 'Lantai 1'} • {rm.type || 'Standard'} • {FORMAT_CURRENCY(rm.price || 0)}/bln
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setDeleteRoomConfirm({ open: true, idx: rIdx });
                                                            }}
                                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                        <span className="p-1 text-slate-400">
                                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Expanded Room Editor */}
                                                {isExpanded && (
                                                    <div className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Nomor / Nama Kamar</label>
                                                                <input 
                                                                    type="text"
                                                                    value={rm.name || ''}
                                                                    onChange={e => handleUpdateExistingRoom(rIdx, { name: e.target.value, roomNumber: e.target.value })}
                                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Lantai</label>
                                                                <select
                                                                    value={rm.floor || 'Lantai 1'}
                                                                    onChange={e => handleUpdateExistingRoom(rIdx, { floor: e.target.value })}
                                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                                                                >
                                                                    {['Lantai 1', 'Lantai 2', 'Lantai 3', 'Lantai 4', 'Lantai 5'].map(fl => (
                                                                        <option key={fl} value={fl}>{fl}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Status Kamar</label>
                                                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUpdateExistingRoom(rIdx, { status: 'Terisi' })}
                                                                        className={`flex-1 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                                                                            isOcc ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
                                                                        }`}
                                                                    >
                                                                        Terisi
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUpdateExistingRoom(rIdx, { status: 'Kosong' })}
                                                                        className={`flex-1 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                                                                            !isOcc ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                                                                        }`}
                                                                    >
                                                                        Kosong
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Skema Tarif Bulanan */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Tarif Sewa Bulanan (Rp)</label>
                                                                <input 
                                                                    type="text"
                                                                    value={formatThousand(rm.price || 0)}
                                                                    onChange={e => {
                                                                        const num = parseThousand(e.target.value);
                                                                        handleUpdateExistingRoom(rIdx, { 
                                                                            price: num,
                                                                            pricing: [{ period: 'bulanan', price: num }]
                                                                        });
                                                                    }}
                                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Ukuran / Dimensi (Panjang x Lebar)</label>
                                                                <input 
                                                                    type="text"
                                                                    value={rm.size || '3x4 meter'}
                                                                    onChange={e => handleUpdateExistingRoom(rIdx, { size: e.target.value })}
                                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Jika Kamar Terisi -> Form Data Penghuni */}
                                                        {isOcc && (
                                                            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
                                                                <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                                                                    👤 Data Penghuni Kamar:
                                                                </span>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="text-[9px] font-bold text-slate-600 uppercase block mb-0.5">Nama Lengkap</label>
                                                                        <input 
                                                                            type="text"
                                                                            value={rm.residentName || ''}
                                                                            onChange={e => handleUpdateExistingRoom(rIdx, { residentName: e.target.value })}
                                                                            placeholder="Nama penyewa..."
                                                                            className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold outline-none"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-[9px] font-bold text-slate-600 uppercase block mb-0.5">No WhatsApp / HP</label>
                                                                        <input 
                                                                            type="text"
                                                                            value={rm.residentPhone || ''}
                                                                            onChange={e => handleUpdateExistingRoom(rIdx, { residentPhone: e.target.value })}
                                                                            placeholder="08123456789..."
                                                                            className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold outline-none"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Fasilitas Kamar Checklist */}
                                                        <div className="space-y-2 pt-2 border-t border-slate-100">
                                                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Fasilitas Kamar:</label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {['Kasur', 'Lemari Pakaian', 'Meja Belajar', 'AC', 'Kipas Angin', 'Kamar Mandi Dalam', 'Dapur Dalam', 'Jendela Luar', 'Water Heater'].map(fac => {
                                                                    const isChecked = (rm.roomFacilities || []).includes(fac);
                                                                    return (
                                                                        <button
                                                                            key={fac}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const cur = rm.roomFacilities || [];
                                                                                const next = isChecked ? cur.filter((f: string) => f !== fac) : [...cur, fac];
                                                                                handleUpdateExistingRoom(rIdx, { roomFacilities: next });
                                                                            }}
                                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                                                isChecked ? 'bg-orange-500 text-white shadow-2xs' : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                                                                            }`}
                                                                        >
                                                                            {fac}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Dokumentasi Foto Kamar Berkategori */}
                                                        <div className="space-y-3 pt-2 border-t border-slate-100">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[10px] font-black text-[#584235] uppercase tracking-widest flex items-center gap-1.5">
                                                                    <Camera size={13} className="text-orange-500" />
                                                                    <span>Dokumentasi Foto Kamar</span>
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-400">
                                                                    {totalPhotos} Total Foto Unit
                                                                </span>
                                                            </div>

                                                            {(() => {
                                                                const currentCategorized = getRoomCategorizedPhotos(rm);
                                                                const activeCats = computeDynamicRoomPhotoCategories(
                                                                    rm.roomFacilities || [], 
                                                                    rm.status, 
                                                                    Object.keys(currentCategorized)
                                                                );

                                                                const getPhotoCaption = (cLabel: string, pIdx: number) => {
                                                                    const clean = cLabel.replace(/(\*Wajib|\(Opsional\))/gi, '').trim();
                                                                    return `${clean} ${pIdx + 1}`;
                                                                };

                                                                return (
                                                                    <div className="space-y-3">
                                                                        {activeCats.map((rawLabel: string) => {
                                                                            const label = (rawLabel === 'Interior Kamar *Wajib' && isOcc) ? 'Interior Kamar (Opsional)' : rawLabel;
                                                                            const catPhotos = currentCategorized[rawLabel] 
                                                                                || currentCategorized[normalizeRoomCategoryName(rawLabel, isOcc)]
                                                                                || (rawLabel.includes('Interior') ? (currentCategorized['Interior Kamar *Wajib'] || currentCategorized['Interior Kamar (Opsional)'] || []) : []) 
                                                                                || [];

                                                                            return (
                                                                                <div key={rawLabel} className="bg-slate-50/80 border border-[#e0c0af]/60 rounded-xl p-3 shadow-xs space-y-2.5">
                                                                                    <div className="flex justify-between items-center">
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            {rawLabel.includes('Interior') ? <Home className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                              rawLabel.includes('Mandi') ? <Bath className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                              rawLabel.includes('Tidur') ? <Bed className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                              rawLabel.includes('AC') ? <Wind className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                              <Camera className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />}
                                                                                            <span className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">{label}</span>
                                                                                        </div>
                                                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${catPhotos.length > 0 ? 'bg-orange-100 text-[#ff7a00]' : 'bg-gray-100 text-gray-500'}`}>
                                                                                            {catPhotos.length} Foto
                                                                                        </span>
                                                                                    </div>

                                                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                                        {catPhotos.map((url, pIdx) => (
                                                                                            <div key={`${url}_${pIdx}`} className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200 relative group bg-gray-50 shadow-2xs">
                                                                                                <img 
                                                                                                    src={url} 
                                                                                                    alt={getPhotoCaption(label, pIdx)} 
                                                                                                    onClick={() => setLightboxPhoto({ url, label: getPhotoCaption(label, pIdx) })}
                                                                                                    className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity" 
                                                                                                />
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        const updatedCategorized = { ...currentCategorized };
                                                                                                        const targetKey = Object.keys(updatedCategorized).find(k => 
                                                                                                            k === rawLabel || 
                                                                                                            normalizeRoomCategoryName(k, isOcc) === normalizeRoomCategoryName(rawLabel, isOcc)
                                                                                                        ) || rawLabel;
                                                                                                        const list = [...(updatedCategorized[targetKey] || [])];
                                                                                                        list.splice(pIdx, 1);
                                                                                                        if (list.length > 0) {
                                                                                                            updatedCategorized[targetKey] = list;
                                                                                                        } else {
                                                                                                            delete updatedCategorized[targetKey];
                                                                                                        }
                                                                                                        const { images, photoCategories } = exportCategorizedPhotos(updatedCategorized);
                                                                                                        handleUpdateExistingRoom(rIdx, {
                                                                                                            categorized_photos: updatedCategorized,
                                                                                                            categorizedPhotos: updatedCategorized,
                                                                                                            images,
                                                                                                            photoCategories
                                                                                                        });
                                                                                                    }}
                                                                                                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md transition-all active:scale-90 cursor-pointer"
                                                                                                    title="Hapus foto ini"
                                                                                                >
                                                                                                    &times;
                                                                                                </button>
                                                                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1 text-[8px] text-white text-center uppercase font-bold tracking-wider truncate">
                                                                                                    {getPhotoCaption(label, pIdx)}
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}

                                                                                        <label className={`aspect-video bg-white border-2 border-dashed border-[#ff7a00] rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-orange-50/50 transition-all text-[#584235] ${
                                                                                            catPhotos.length === 0 ? 'col-span-2 sm:col-span-3 py-4' : ''
                                                                                        }`}>
                                                                                            <input 
                                                                                                type="file"
                                                                                                accept="image/*"
                                                                                                multiple
                                                                                                className="hidden"
                                                                                                disabled={uploadingRooms[`room_${rIdx}_${rawLabel}`]}
                                                                                                onChange={async (e) => {
                                                                                                    const files = e.target.files;
                                                                                                    if (files && files.length > 0) {
                                                                                                        const uploadKey = `room_${rIdx}_${rawLabel}`;
                                                                                                        setUploadingRooms(prev => ({ ...prev, [uploadKey]: true }));
                                                                                                        try {
                                                                                                            const newUrls = [];
                                                                                                            for (let f = 0; f < files.length; f++) {
                                                                                                                const webpFile = await compressImageToWebP(files[f]);
                                                                                                                const folder = `kostmanager/rooms/${Date.now()}_${f}`;
                                                                                                                const publicUrl = await uploadFileAndGetURL(webpFile, folder);
                                                                                                                newUrls.push(publicUrl);
                                                                                                            }
                                                                                                            const updatedCategorized = { ...currentCategorized };
                                                                                                            const targetKey = normalizeRoomCategoryName(rawLabel, isOcc);
                                                                                                            const list = [...(updatedCategorized[targetKey] || [])];
                                                                                                            newUrls.forEach(u => list.push(u));
                                                                                                            updatedCategorized[targetKey] = list;
                                                                                                            const { images, photoCategories } = exportCategorizedPhotos(updatedCategorized);
                                                                                                            handleUpdateExistingRoom(rIdx, {
                                                                                                                categorized_photos: updatedCategorized,
                                                                                                                categorizedPhotos: updatedCategorized,
                                                                                                                images,
                                                                                                                photoCategories
                                                                                                            });
                                                                                                        } catch (err: any) {
                                                                                                            alert('Gagal unggah foto kamar: ' + err.message);
                                                                                                        } finally {
                                                                                                            setUploadingRooms(prev => ({ ...prev, [uploadKey]: false }));
                                                                                                        }
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                            {uploadingRooms[`room_${rIdx}_${rawLabel}`] ? (
                                                                                                <span className="text-[10px] font-bold animate-pulse text-gray-500">Mengunggah...</span>
                                                                                            ) : (
                                                                                                <>
                                                                                                    <ImagePlus className="w-5 h-5 text-[#ff7a00] shrink-0" />
                                                                                                    <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 text-center">
                                                                                                        {catPhotos.length === 0 ? `+ Unggah Foto ${label}` : '+ Tambah Foto'}
                                                                                                    </span>
                                                                                                </>
                                                                                            )}
                                                                                        </label>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {(!kmListingForm.roomTypes || kmListingForm.roomTypes.length === 0) && !temporaryRoom && (
                                        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
                                            <p className="text-xs font-bold">Belum ada unit kamar yang didata.</p>
                                            <button
                                                type="button"
                                                onClick={handleAddNewRoom}
                                                className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
                                            >
                                                + Tambah Kamar Pertama
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* FORM DRAFT TAMBAH KAMAR BARU (temporaryRoom) */}
                                {temporaryRoom && (
                                    <div className="bg-orange-50/50 border-2 border-orange-300 rounded-3xl p-5 space-y-4 animate-in fade-in">
                                        <div className="flex items-center justify-between border-b border-orange-200 pb-2">
                                            <h4 className="font-black text-sm text-orange-950 uppercase tracking-wider">
                                                Tambah Kamar Baru
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={() => setTemporaryRoom(null)}
                                                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                                            >
                                                Batal
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Nomor Kamar</label>
                                                <input 
                                                    type="text"
                                                    value={temporaryRoom.name || ''}
                                                    onChange={e => setTemporaryRoom({ ...temporaryRoom, name: e.target.value, roomNumber: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Lantai</label>
                                                <select
                                                    value={temporaryRoom.floor || 'Lantai 1'}
                                                    onChange={e => setTemporaryRoom({ ...temporaryRoom, floor: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                                                >
                                                    {['Lantai 1', 'Lantai 2', 'Lantai 3', 'Lantai 4', 'Lantai 5'].map(fl => (
                                                        <option key={fl} value={fl}>{fl}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Status</label>
                                                <div className="flex bg-white p-1 rounded-xl border border-orange-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => setTemporaryRoom({ ...temporaryRoom, status: 'Terisi' })}
                                                        className={`flex-1 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                                                            temporaryRoom.status === 'Terisi' ? 'bg-amber-600 text-white' : 'text-slate-600'
                                                        }`}
                                                    >
                                                        Terisi
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setTemporaryRoom({ ...temporaryRoom, status: 'Kosong' })}
                                                        className={`flex-1 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                                                            temporaryRoom.status !== 'Terisi' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                                                        }`}
                                                    >
                                                        Kosong
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Tarif Sewa Bulanan (Rp)</label>
                                                <input 
                                                    type="text"
                                                    value={formatThousand(temporaryRoom.price || 0)}
                                                    onChange={e => {
                                                        const num = parseThousand(e.target.value);
                                                        setTemporaryRoom({ 
                                                            ...temporaryRoom, 
                                                            price: num,
                                                            pricing: [{ period: 'bulanan', price: num }]
                                                        });
                                                    }}
                                                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block mb-1">Ukuran / Dimensi</label>
                                                <input 
                                                    type="text"
                                                    value={temporaryRoom.size || '3x4 meter'}
                                                    onChange={e => setTemporaryRoom({ ...temporaryRoom, size: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Fasilitas Kamar */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Fasilitas Kamar:</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Kasur', 'Lemari Pakaian', 'Meja Belajar', 'AC', 'Kipas Angin', 'Kamar Mandi Dalam', 'Dapur Dalam'].map(fac => {
                                                    const isChecked = (temporaryRoom.roomFacilities || []).includes(fac);
                                                    return (
                                                        <button
                                                            key={fac}
                                                            type="button"
                                                            onClick={() => {
                                                                const cur = temporaryRoom.roomFacilities || [];
                                                                const next = isChecked ? cur.filter((f: string) => f !== fac) : [...cur, fac];
                                                                setTemporaryRoom({ ...temporaryRoom, roomFacilities: next });
                                                            }}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                                isChecked ? 'bg-orange-500 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700'
                                                            }`}
                                                        >
                                                            {fac}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSaveTemporaryRoom}
                                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                                        >
                                            ✓ Simpan Unit Kamar Ini
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ==================================================== */}
                    {/* STEP 3: REVIEW & DIRECT SAVE                         */}
                    {/* ==================================================== */}
                    {kmStep === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            
                            {/* PREVIEW HANDPHONE MOBILE SIMULATOR */}
                            <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-4 shadow-xl">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="text-orange-400" size={18} />
                                        <h4 className="font-black text-xs uppercase tracking-wider text-orange-400">
                                            Simulasi Tampilan Mobile Calon Penyewa
                                        </h4>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold">1:1 Mobile App Preview</span>
                                </div>

                                <div className="max-w-xs mx-auto bg-slate-950 rounded-3xl p-3 border-4 border-slate-800 shadow-2xl space-y-3">
                                    <div className="aspect-video bg-slate-800 rounded-2xl overflow-hidden relative">
                                        {kmListingForm.image_urls && kmListingForm.image_urls.length > 0 ? (
                                            <img 
                                                src={getImageUrlString(kmListingForm.image_urls[0])} 
                                                alt="Cover" 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                                                Foto Sampul
                                            </div>
                                        )}
                                        <span className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase">
                                            {kmListingForm.type || 'Campur'}
                                        </span>
                                    </div>

                                    <div>
                                        <h5 className="font-black text-sm text-white truncate">{kmListingForm.title || 'Nama Kos'}</h5>
                                        <p className="text-[10px] text-slate-400 font-bold truncate">📍 {kmListingForm.city}, {kmListingForm.area}</p>
                                        <p className="text-orange-400 font-black text-sm mt-1">
                                            {FORMAT_CURRENCY(kmListingForm.price || (kmListingForm.roomTypes?.[0]?.price) || 0)}
                                            <span className="text-[9px] text-slate-400 font-normal"> / bulan</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* DATA MITRA PEMILIK & REKENING PENYALURAN */}
                            <div className="bg-white p-5 rounded-2xl border border-[#e0c0af] shadow-xs space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <Users size={16} className="text-orange-500" />
                                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                                        Mitra Pemilik (Owner Payout)
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pilih Pemilik Terdaftar</span>
                                        <select
                                            value={kmListingForm.owner_uid || ''}
                                            onChange={e => setKmListingForm({ ...kmListingForm, owner_uid: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                                        >
                                            {ownersList.map(o => (
                                                <option key={o.id} value={o.id}>{o.name} ({o.phone})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-1">
                                        <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block">Rekening Penyaluran Hasil Sewa</span>
                                        <h5 className="font-black text-sm text-emerald-950">Bank Central Asia (BCA)</h5>
                                        <p className="text-xs text-emerald-900 font-mono font-bold">123-456-7890 a.n {selectedOwner?.name || 'Mitra'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* DOKUMEN PERJANJIAN & TTD DIGITAL */}
                            <div className="bg-white p-5 rounded-2xl border border-[#e0c0af] shadow-xs space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <ShieldCheck size={16} className="text-orange-500" />
                                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                                        Perjanjian Kemitraan Auto-Pilot &amp; TTD Digital
                                    </h4>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox"
                                        id="terms-cb"
                                        checked={agreedToTerms}
                                        onChange={e => setAgreedToTerms(e.target.checked)}
                                        className="w-4 h-4 text-orange-500 rounded cursor-pointer"
                                    />
                                    <label htmlFor="terms-cb" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                        Menyetujui syarat &amp; ketentuan pengelolaan penuh platform KostManager RuangSinggah
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tanda Tangan Digital Mitra:</span>
                                        <button
                                            type="button"
                                            onClick={clearSignature}
                                            className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                                        >
                                            Hapus TTD
                                        </button>
                                    </div>
                                    <div className="border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-slate-50 h-32 relative">
                                        <canvas
                                            ref={canvasRef}
                                            width={500}
                                            height={150}
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                            onTouchStart={startDrawing}
                                            onTouchMove={draw}
                                            onTouchEnd={stopDrawing}
                                            className="w-full h-full cursor-crosshair touch-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. FOOTER STICKY ACTION BAR */}
                <div className="p-4 sm:p-5 border-t border-[#e0c0af] bg-white flex flex-col sm:flex-row items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            if (kmStep > 1) {
                                setKmStep(kmStep - 1);
                            } else {
                                onClose();
                            }
                        }}
                        className="w-full sm:w-1/3 py-3 px-6 rounded-full border-2 border-[#ff7a00] text-[#ff7a00] font-black text-xs uppercase tracking-widest hover:bg-orange-50 transition-all text-center cursor-pointer active:scale-95"
                    >
                        {kmStep === 1 ? 'KELUAR' : `KEMBALI KE STEP ${kmStep - 1}`}
                    </button>

                    {kmStep < 3 ? (
                        <button
                            type="button"
                            onClick={() => setKmStep(kmStep + 1)}
                            className="w-full sm:w-2/3 py-3.5 px-6 rounded-full bg-[#ff7a00] hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/25 transition-all text-center cursor-pointer active:scale-95"
                        >
                            LANJUT KE STEP {kmStep + 1}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleDirectSave}
                            disabled={savingProp}
                            className="w-full sm:w-2/3 py-3.5 px-6 rounded-full bg-[#ff7a00] hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                            {savingProp ? (
                                <span>Menyimpan Properti...</span>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    <span>{editingPropertyId ? 'SIMPAN PERUBAHAN PROPERTI' : 'SIMPAN PROPERTI KELOLAAN'}</span>
                                </>
                            )}
                        </button>
                    )}
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

                {/* Confirmation Modal: Delete Room */}
                {deleteRoomConfirm.open && deleteRoomConfirm.idx !== null && (
                    <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4" onClick={() => setDeleteRoomConfirm({ open: false, idx: null })}>
                        <div className="max-w-sm w-full bg-white rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
                                <Trash2 size={24} />
                            </div>
                            <div className="text-center space-y-1">
                                <h4 className="font-black text-base text-slate-900">Hapus Unit Kamar?</h4>
                                <p className="text-xs text-slate-500 font-medium">Data kamar ini akan dihapus dari daftar properti kelolaan.</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeleteRoomConfirm({ open: false, idx: null })}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteRoom(deleteRoomConfirm.idx!)}
                                    className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KostManagerPropertyFormModal;
