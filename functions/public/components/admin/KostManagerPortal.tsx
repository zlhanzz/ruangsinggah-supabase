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
    Upload,
    AlertCircle,
    Fan,
    ImagePlus,
    Maximize2,
    LocateFixed,
    RefreshCw,
    Smartphone,
    BatteryCharging,
    ArrowLeft,
    UploadCloud,
    CheckSquare,
    Link as LinkIcon,
    Send,
    CheckCheck,
    Inbox,
    ClipboardList,
    UserCheck,
    UserX
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
import { 
    getKostManagerChatSessions, 
    getChatMessages, 
    sendMessage, 
    subscribeToMessages, 
    subscribeToChatSessions,
    markMessagesAsRead,
    ChatSession, 
    ChatMessage, 
    SYSTEM_ADMIN_ID 
} from '../../chatService';
import { updateBookingStatus } from '../../userService';
import KostManagerPropertyFormModal from './KostManagerPropertyFormModal';
import { 
    sendRentBillingReminderWhatsApp, 
    createRentClaimToken,
    calculateNextLeasePeriod,
    sendRentReceiptWhatsApp,
    sendBookingApprovalWhatsApp
} from '../../rentBillingService';
import DigitalReceiptModal, { ReceiptData } from '../DigitalReceiptModal';




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

const normalizePhotosWithLabels = (imgUrls: any[]): { original: string; url: string; label: string }[] => {
    if (!imgUrls || !Array.isArray(imgUrls)) return [];
    
    // Default base category slots matching KostManager survey form
    const defaultSlots = ['Bangunan Depan', 'Koridor', 'Area Parkir', 'Lingkungan'];

    return imgUrls.map((img: any, idx: number) => {
        let rawUrl = '';
        let rawLabel = '';

        if (typeof img === 'string') {
            rawUrl = img;
        } else if (typeof img === 'object' && img !== null) {
            rawUrl = img.original || img.url || img.photo_url || img.file_url || img.src || '';
            rawLabel = img.label || '';
        }

        if (!rawUrl) return null;

        let normalizedLabel = rawLabel.trim();
        const lowerLabel = normalizedLabel.toLowerCase();

        // Intelligent category resolver matching survey form
        if (lowerLabel.includes('fasad') || lowerLabel.includes('depan') || lowerLabel.includes('gedung') || lowerLabel.includes('tampak depan')) {
            normalizedLabel = 'Bangunan Depan';
        } else if (lowerLabel.includes('koridor') || lowerLabel.includes('lorong') || lowerLabel.includes('akses') || lowerLabel.includes('pintu masuk')) {
            normalizedLabel = 'Koridor';
        } else if (lowerLabel.includes('parkir') || lowerLabel.includes('parkiran') || lowerLabel.includes('garasi')) {
            normalizedLabel = 'Area Parkir';
        } else if (lowerLabel.includes('dapur')) {
            normalizedLabel = 'Dapur Bersama';
        } else if (lowerLabel.includes('wc umum') || lowerLabel.includes('toilet') || lowerLabel.includes('kamar mandi luar') || lowerLabel.includes('wc luar')) {
            normalizedLabel = 'WC Umum';
        } else if (lowerLabel.includes('lingkungan') || lowerLabel.includes('taman') || lowerLabel.includes('sekitar')) {
            normalizedLabel = 'Lingkungan';
        } else if (lowerLabel.includes('ruang tamu') || lowerLabel.includes('ruang santai')) {
            normalizedLabel = 'Ruang Tamu';
        } else if (lowerLabel.includes('cctv')) {
            normalizedLabel = 'CCTV';
        } else if (lowerLabel.includes('laundry') || lowerLabel.includes('jemuran') || lowerLabel.includes('cuci')) {
            normalizedLabel = 'Laundry';
        }

        // If still no label, assign fallback slot
        if (!normalizedLabel) {
            if (idx < defaultSlots.length) {
                normalizedLabel = defaultSlots[idx];
            } else {
                normalizedLabel = `Foto Area Lainnya ${idx - defaultSlots.length + 1}`;
            }
        }

        return {
            original: rawUrl,
            url: rawUrl,
            label: normalizedLabel
        };
    }).filter((item): item is { original: string; url: string; label: string } => item !== null && Boolean(item.url));
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

// Helper: Parse Dimension Parts ([Panjang] X [Lebar] meter)
const parseDimensionParts = (dimStr: string) => {
    if (!dimStr) return { length: '', width: '' };
    const cleaned = String(dimStr).replace(/\s*meter\s*/gi, '').trim();
    const parts = cleaned.split(/x|\*/i);
    if (parts.length >= 2) {
        return { length: parts[0].trim(), width: parts[1].trim() };
    }
    return { length: cleaned, width: '' };
};

// Helper: Format & Parse Ribuan Rupiah
const formatThousand = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    const num = Number(String(val).replace(/[^0-9]/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString('id-ID');
};

const parseThousand = (val: string) => {
    if (!val) return '';
    const clean = String(val).replace(/[^0-9]/g, '');
    return clean ? Number(clean) : '';
};

// Helper: Dynamic Room Photo Categories computation based on active room facilities
const computeDynamicRoomPhotoCategories = (roomFacilities: string[] = [], status: string = 'kosong', manualExtras: string[] = []): string[] => {
    const isOcc = status === 'terisi' || status === 'Terisi';
    const baseLabel = isOcc ? 'Interior Kamar (Opsional)' : 'Interior Kamar *Wajib';
    const categories: string[] = [baseLabel];

    const facilityPhotoMapping: { [key: string]: string } = {
        'kamar mandi dalam': 'Kamar Mandi',
        'dapur dalam': 'Dapur Dalam',
        'kasur': 'Tempat Tidur',
        'lemari': 'Lemari / Storage',
        'lemari pakaian': 'Lemari / Storage',
        'meja belajar': 'Meja Belajar',
        'ac': 'AC',
        'kipas angin': 'Kipas Angin',
        'jendela luar': 'Jendela Luar',
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
        const clean = c.trim();
        if (clean && !categories.includes(clean)) {
            categories.push(clean);
        }
    });

    return categories;
};

// Helper: Get Structured Categorized Photos from Unit
const getRoomCategorizedPhotos = (item: any): Record<string, string[]> => {
    if (!item) return {};
    const cleanUrls = (urls: any[]) => (urls || []).map((u: any) => normalizePhotoUrl(u)).filter(Boolean);

    if (item.categorizedPhotos && typeof item.categorizedPhotos === 'object' && !Array.isArray(item.categorizedPhotos)) {
        const raw = JSON.parse(JSON.stringify(item.categorizedPhotos));
        const cleaned: Record<string, string[]> = {};
        Object.entries(raw).forEach(([k, urls]) => {
            if (Array.isArray(urls)) cleaned[k] = cleanUrls(urls);
        });
        return cleaned;
    }
    if (item.categorized_photos && typeof item.categorized_photos === 'object' && !Array.isArray(item.categorized_photos)) {
        const raw = JSON.parse(JSON.stringify(item.categorized_photos));
        const cleaned: Record<string, string[]> = {};
        Object.entries(raw).forEach(([k, urls]) => {
            if (Array.isArray(urls)) cleaned[k] = cleanUrls(urls);
        });
        return cleaned;
    }

    const result: Record<string, string[]> = {};
    const images = Array.isArray(item.images) ? item.images : (Array.isArray(item.image_urls) ? item.image_urls : []);
    images.forEach((urlItem: any, idx: number) => {
        const urlStr = normalizePhotoUrl(urlItem);
        if (!urlStr) return;
        const cat = (typeof urlItem === 'object' && urlItem.label) 
            ? urlItem.label 
            : (idx === 0 ? 'Interior Kamar *Wajib' : 'Foto Kamar');
        if (!result[cat]) result[cat] = [];
        result[cat].push(urlStr);
    });
    return result;
};

// Helper: Export Categorized Photos into Flat Arrays
const exportCategorizedPhotos = (categorized: Record<string, string[]>) => {
    const images: { url: string; label: string }[] = [];
    const photoCategories: string[] = [];
    Object.entries(categorized || {}).forEach(([cat, urls]) => {
        if (Array.isArray(urls)) {
            urls.forEach(url => {
                if (url) {
                    images.push({ url, label: cat });
                    photoCategories.push(cat);
                }
            });
        }
    });
    return { images, photoCategories };
};

const DEFAULT_GLOBAL_ROOM_PHOTO_SLOTS = ['Interior Kamar', 'Kamar Mandi Dalam', 'Tempat Tidur', 'Lemari / Penyimpanan'];

const getRoomPhotosGlobal = (room: any): { url: string; label: string }[] => {
    if (!room) return [];
    const result: { url: string; label: string }[] = [];

    const catMap: Record<string, string> = {
        interior: 'Interior Kamar',
        kasur: 'Tempat Tidur',
        'tempat tidur': 'Tempat Tidur',
        wc: 'Kamar Mandi',
        'kamar mandi': 'Kamar Mandi',
        'kamar mandi dalam': 'Kamar Mandi',
        'dapur dalam': 'Dapur Dalam',
        dapur: 'Dapur Dalam',
        jendela: 'Jendela Luar',
        'jendela luar': 'Jendela Luar',
        lemari: 'Lemari / Storage',
        'lemari pakaian': 'Lemari / Storage',
        ac: 'AC',
        'kipas angin': 'Kipas Angin',
        'water heater': 'Water Heater'
    };

    const normalizeCatKey = (k: string) => {
        const lower = (k || '').toLowerCase().trim().replace(/(\*wajib|\(opsional\))/gi, '').trim();
        return catMap[lower] || k.replace(/(\*Wajib|\(Opsional\))/gi, '').trim();
    };

    // 1. Dari categorized_photos / categorizedPhotos
    const catSources = [room.categorized_photos, room.categorizedPhotos].filter(Boolean);
    catSources.forEach(source => {
        if (source && typeof source === 'object' && !Array.isArray(source)) {
            Object.entries(source).forEach(([k, list]: [string, any]) => {
                if (Array.isArray(list)) {
                    list.forEach(item => {
                        const url = typeof item === 'string' ? item : (item?.url || item?.original || '');
                        if (url && !result.some(p => p.url === url)) {
                            result.push({ url, label: normalizeCatKey(k) });
                        }
                    });
                }
            });
        }
    });

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
                result.push({ url, label: normalizeCatKey(label) });
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

// Helper pencocokan kamar & tenant yang aman, presisi, dan kebal dari bug undefined === undefined
const isMatchingRoomTenant = (t: any, roomName: string, rawRoomNumber?: string, rawName?: string): boolean => {
    if (!t) return false;
    const cleanRoomName = String(roomName || '').trim().toLowerCase();
    const cleanRawNum = String(rawRoomNumber || '').trim().toLowerCase();
    const cleanRawName = String(rawName || '').trim().toLowerCase();

    const extractNum = (str: string) => str.replace(/^kamar\s*/i, '').trim();

    const tRoomType = String(t.room_type || '').trim().toLowerCase();
    const tRoomNum = String(t.room_number || t.metadata?.roomNumber || '').trim().toLowerCase();

    if (tRoomType && cleanRoomName && (tRoomType === cleanRoomName || (extractNum(tRoomType) && extractNum(tRoomType) === extractNum(cleanRoomName)))) {
        return true;
    }
    if (tRoomNum && (
        (cleanRoomName && (tRoomNum === cleanRoomName || (extractNum(tRoomNum) && extractNum(tRoomNum) === extractNum(cleanRoomName)))) ||
        (cleanRawNum && tRoomNum === cleanRawNum) ||
        (cleanRawName && tRoomNum === cleanRawName)
    )) {
        return true;
    }

    return false;
};

const groupIntoRoomTypesGlobal = (rawList: any[], propertyTenants: any[] = []): any[] => {
    if (!Array.isArray(rawList) || rawList.length === 0) return [];

    const hasExplicitSubUnits = rawList.some(rt => (Array.isArray(rt.rooms) && rt.rooms.length > 0) || (Array.isArray(rt.unit_rooms) && rt.unit_rooms.length > 0));

    if (hasExplicitSubUnits) {
        return rawList.map((rt, idx) => {
            const rawUnits = (Array.isArray(rt.rooms) && rt.rooms.length > 0) ? rt.rooms : (Array.isArray(rt.unit_rooms) ? rt.unit_rooms : [rt]);
            const rooms = rawUnits.map((u: any, uIdx: number) => {
                const unitName = formatRoomNameGlobal(u?.name || u?.roomNumber || u?.room_number || String(uIdx + 1), uIdx);
                const matchedTenant = propertyTenants.find(t => isMatchingRoomTenant(t, unitName, u?.roomNumber, u?.name));

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
        const matchedTenant = propertyTenants.find(t => isMatchingRoomTenant(t, unitName, roomItem?.roomNumber, roomItem?.name));

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

// Helper: Unroll raw database room_types / grouped rooms to individual survey room units (1:1 format)
const unrollToSurveyRooms = (rawList: any[], propertyTenants: any[] = []): any[] => {
    if (!Array.isArray(rawList) || rawList.length === 0) return [];
    const rooms: any[] = [];
    rawList.forEach((rt: any, idx: number) => {
        const rawUnits = (Array.isArray(rt.rooms) && rt.rooms.length > 0) 
            ? rt.rooms 
            : (Array.isArray(rt.unit_rooms) ? rt.unit_rooms : null);

        if (rawUnits && rawUnits.length > 0) {
            rawUnits.forEach((u: any, uIdx: number) => {
                const uName = formatRoomNameGlobal(u?.roomNumber || u?.name || `${idx + 1}0${uIdx + 1}`, uIdx);
                const matchedTenant = propertyTenants.find(t => isMatchingRoomTenant(t, uName, u?.roomNumber, u?.name));
                const tenantName = u?.tenantName || u?.residentName || rt.residentName || matchedTenant?.user?.name || '';
                const tenantPhone = u?.tenantPhone || u?.residentPhone || rt.residentPhone || matchedTenant?.user?.phone || '';
                const isOccupied = u?.status === 'terisi' || u?.status === 'Terisi' || u?.isAvailable === false || Boolean(tenantName || tenantPhone);
                const uPhotos = getRoomPhotosGlobal(u).length > 0 ? getRoomPhotosGlobal(u) : getRoomPhotosGlobal(rt);

                rooms.push({
                    name: uName,
                    roomNumber: uName,
                    floor: u?.floor || rt?.floor || 'Lantai 1',
                    type: u?.type || rt?.name || 'Standard',
                    status: isOccupied ? 'Terisi' : 'Kosong',
                    isAvailable: !isOccupied,
                    price: Number(u?.price || rt?.price || 0),
                    pricing: Array.isArray(u?.pricing) && u.pricing.length > 0 
                        ? u.pricing 
                        : (Array.isArray(rt?.pricing) && rt.pricing.length > 0 ? rt.pricing : [{ period: 'bulanan', price: Number(u?.price || rt?.price || 0) }]),
                    size: u?.size || rt?.size || '3x4 meter',
                    dimensions: u?.size || rt?.size || '3x4 meter',
                    maxOccupants: Number(u?.maxOccupants || rt?.maxOccupants || 1),
                    roomFacilities: Array.isArray(u?.roomFacilities) ? u.roomFacilities : (Array.isArray(u?.facilities) ? u.facilities : (Array.isArray(rt?.roomFacilities) ? rt.roomFacilities : [])),
                    bathroomFacilities: Array.isArray(u?.bathroomFacilities) ? u.bathroomFacilities : (Array.isArray(rt?.bathroomFacilities) ? rt.bathroomFacilities : []),
                    kitchenFacilities: Array.isArray(u?.kitchenFacilities) ? u.kitchenFacilities : (Array.isArray(rt?.kitchenFacilities) ? rt.kitchenFacilities : []),
                    residentName: tenantName,
                    residentPhone: tenantPhone,
                    startDate: u?.startDate || matchedTenant?.start_date || '',
                    endDate: u?.dueDate || u?.endDate || matchedTenant?.end_date || '',
                    paymentPeriod: u?.billingPeriod || u?.paymentPeriod || 'bulanan',
                    currentOccupants: Number(u?.currentOccupants || 1),
                    images: uPhotos.map(p => p.url),
                    photoCategories: uPhotos.map(p => p.label),
                    categorizedPhotos: u?.categorizedPhotos || u?.categorized_photos || rt?.categorizedPhotos || rt?.categorized_photos || {}
                });
            });
        } else {
            const rName = formatRoomNameGlobal(rt?.roomNumber || rt?.name || `Kamar ${idx + 1}`, idx);
            const matchedTenant = propertyTenants.find(t => isMatchingRoomTenant(t, rName, rt?.roomNumber, rt?.name));
            const tenantName = rt?.residentName || rt?.tenantName || matchedTenant?.user?.name || '';
            const tenantPhone = rt?.residentPhone || rt?.tenantPhone || matchedTenant?.user?.phone || '';
            const isOccupied = rt?.status === 'terisi' || rt?.status === 'Terisi' || rt?.isAvailable === false || Boolean(tenantName || tenantPhone);
            const rPhotos = getRoomPhotosGlobal(rt);

            rooms.push({
                name: rName,
                roomNumber: rName,
                floor: rt?.floor || 'Lantai 1',
                type: rt?.type || rt?.name || 'Standard',
                status: isOccupied ? 'Terisi' : 'Kosong',
                isAvailable: !isOccupied,
                price: Number(rt?.price || 0),
                pricing: Array.isArray(rt?.pricing) && rt.pricing.length > 0 ? rt.pricing : [{ period: 'bulanan', price: Number(rt?.price || 0) }],
                size: rt?.size || rt?.dimensions || '3x4 meter',
                dimensions: rt?.size || rt?.dimensions || '3x4 meter',
                maxOccupants: Number(rt?.maxOccupants || 1),
                roomFacilities: Array.isArray(rt?.roomFacilities) ? rt.roomFacilities : (Array.isArray(rt?.facilities) ? rt.facilities : []),
                bathroomFacilities: Array.isArray(rt?.bathroomFacilities) ? rt.bathroomFacilities : [],
                kitchenFacilities: Array.isArray(rt?.kitchenFacilities) ? rt.kitchenFacilities : [],
                residentName: tenantName,
                residentPhone: tenantPhone,
                startDate: rt?.startDate || matchedTenant?.start_date || '',
                endDate: rt?.endDate || rt?.dueDate || matchedTenant?.end_date || '',
                paymentPeriod: rt?.paymentPeriod || rt?.billingPeriod || 'bulanan',
                currentOccupants: Number(rt?.currentOccupants || 1),
                images: rPhotos.map(p => p.url),
                photoCategories: rPhotos.map(p => p.label),
                categorizedPhotos: rt?.categorizedPhotos || rt?.categorized_photos || {}
            });
        }
    });
    return rooms;
};

// Helper: Parse Google Maps URL / Coordinate text
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

const parsePaymentPeriod = (period: string) => {
    if (!period) return { amount: 1, unit: 'bulan' };
    const val = period.toLowerCase().trim();
    if (val === 'bulanan') return { amount: 1, unit: 'bulan' };
    if (val === 'tahunan') return { amount: 1, unit: 'tahun' };
    if (val === 'mingguan') return { amount: 1, unit: 'minggu' };
    if (val === 'harian') return { amount: 1, unit: 'hari' };
    if (val === '3bulanan') return { amount: 3, unit: 'bulan' };
    if (val === '6bulanan') return { amount: 6, unit: 'bulan' };
    
    const match = val.match(/^(\d+)\s*(hari|minggu|bulan|tahun)s?$/);
    if (match) {
        return { amount: parseInt(match[1]), unit: match[2] };
    }
    return { amount: 1, unit: 'bulan' };
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
    totalRent?: number;
    rent_price?: number;
    metadata: any;
    user?: {
        name: string;
        phone: string;
        email: string;
        photo_url?: string;
    };
    property?: {
        id?: string;
        title: string;
        price?: number;
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

export const generateTenantWhatsAppInvoice = (t: TenantRecord, propTitle?: string, propPrice?: number) => {
    const phone = (t.user?.phone || t.metadata?.phone || '').replace(/[^0-9]/g, '');
    if (!phone) return '#';

    const tenantName = t.user?.name || 'Kak';
    const kostTitle = t.property?.title || propTitle || 'Kost';
    const roomName = t.room_type || t.metadata?.roomNumber || 'Kamar';
    const rentAmount = FORMAT_CURRENCY(Number(t.metadata?.basePrice) || Number(t.metadata?.price) || Number(propPrice) || 0);
    const dueDate = t.end_date || '-';
    const periodText = t.start_date && t.end_date ? `${t.start_date} s/d ${t.end_date}` : '1 Bulan';

    const msg = `🧾 *SURAT TAGIHAN SEWA - ${kostTitle.toUpperCase()}*\n━━━━━━━━━━━━━━━━━━━━\nYth. Kak *${tenantName}*,\n\nBerikut rincian tagihan sewa kamar Anda di *${kostTitle}*:\n\n🏠 *Gedung:* ${kostTitle}\n🚪 *Unit Kamar:* ${roomName}\n📅 *Periode Sewa:* ${periodText}\n⏰ *Jatuh Tempo:* *${dueDate}*\n💰 *Total Tagihan:* *${rentAmount}*\n\nMohon melakukan pembayaran sebelum tanggal jatuh tempo. Jika sudah melakukan transfer, silakan kirimkan foto/bukti pembayaran ke nomor ini.\n\nTerima kasih atas kerja samanya! 🙏✨\n— _Manajemen RuangSinggah KostManager_`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};

const KostManagerPortal: React.FC<KostManagerPortalProps> = ({ isAdmin, activeMenu, onMenuChange, onBack }) => {
    // --- TABS STATE & ROUTING ---
    const activeTab = (() => {
        if (!activeMenu) return 'overview';
        if (activeMenu.startsWith('km_')) {
            return activeMenu.substring(3) as 'overview' | 'properties' | 'bookings' | 'tenants' | 'billing' | 'packages' | 'chats';
        }
        return 'overview';
    })();

    const setActiveTab = (tab: 'overview' | 'properties' | 'bookings' | 'tenants' | 'billing' | 'packages' | 'chats') => {
        if (onMenuChange) {
            onMenuChange('km_' + tab);
        }
    };


    // Auto redirect removed to fix Back to Admin button functionality.


    // --- DATA STATE ---
    const [properties, setProperties] = useState<ManagedProperty[]>([]);
    const [tenants, setTenants] = useState<TenantRecord[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
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
        city: 'Makassar',
        area: '',
        province: 'Sulawesi Selatan',
        type: 'Campur',
        totalRooms: 1,
        price: 0,
        owner_uid: '',
        location: { lat: -5.147665, lng: 119.432731 },
        facilities: ['WiFi', 'Area Parkir', 'Dapur Bersama'],
        publicParkingFacilities: ['Parkir Motor'],
        publicKitchenFacilities: [] as string[],
        publicBathroomFacilities: [] as string[],
        imageUrls: [] as any[],
        image_urls: [] as any[],
        videoUrls: [] as string[],
        instagramUrl: '',
        tiktokUrl: '',
        rules: ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
        campuses: [] as any[],
        publicFacilities: [] as any[],
        additionalFeePrice: 0,
        additionalFeeName: '',
        additionalFeeStartsFrom: 'month_1' as 'month_1' | 'month_2',
        omnichannelContactName: '',
        omnichannelContactPhone: '',
        omnichannelContactType: 'owner' as 'owner' | 'caretaker',
        roomTypes: [] as any[]
    };

    const [isAddPropOpen, setIsAddPropOpen] = useState<boolean>(false);
    const [savingProp, setSavingProp] = useState<boolean>(false);
    const [newPropForm, setNewPropForm] = useState(DEFAULT_PROP_FORM);

    const [propertySearch, setPropertySearch] = useState('');
    const [tenantSearch, setTenantSearch] = useState('');
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [bookingSearch, setBookingSearch] = useState('');
    const [bookingStatusFilter, setBookingStatusFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'AWAITING_PAYMENT' | 'PAID' | 'REJECTED'>('ALL');
    const [isProcessingBooking, setIsProcessingBooking] = useState(false);
    const [selectedPropForTenants, setSelectedPropForTenants] = useState<ManagedProperty | null>(null);
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

    // Digital Receipt Modal States
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
    const [showDigitalReceiptModal, setShowDigitalReceiptModal] = useState<boolean>(false);


    // Property Command Center Modals (Room Matrix & Broadcast)
    const [selectedPropForRoomMatrix, setSelectedPropForRoomMatrix] = useState<ManagedProperty | null>(null);
    const [selectedPropForBroadcast, setSelectedPropForBroadcast] = useState<ManagedProperty | null>(null);
    const [broadcastCategory, setBroadcastCategory] = useState<'LISTRIK_AIR' | 'KEBERSIHAN' | 'TAGIHAN' | 'TATA_TERTIB' | 'KUSTOM'>('LISTRIK_AIR');
    const [broadcastCustomText, setBroadcastCustomText] = useState<string>('');

    // Room Occupancy Quick Mutation States (Kosong <-> Terisi)
    const [quickOccupancyModal, setQuickOccupancyModal] = useState<{
        open: boolean;
        property: ManagedProperty | null;
        roomIndex: number;
        roomName: string;
        price: number;
        residentName: string;
        residentPhone: string;
        startDate: string;
        endDate: string;
        submitting: boolean;
    }>({
        open: false,
        property: null,
        roomIndex: -1,
        roomName: '',
        price: 0,
        residentName: '',
        residentPhone: '',
        startDate: '',
        endDate: '',
        submitting: false
    });

    const [vacateConfirmModal, setVacateConfirmModal] = useState<{
        open: boolean;
        property: ManagedProperty | null;
        roomIndex: number;
        roomName: string;
        residentName?: string;
        submitting: boolean;
    }>({
        open: false,
        property: null,
        roomIndex: -1,
        roomName: '',
        residentName: '',
        submitting: false
    });

    // --- CHAT STATE ---
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);
    const [chatSearch, setChatSearch] = useState<string>('');
    const [chatPropertyFilter, setChatPropertyFilter] = useState<string>('all');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [newChatMessage, setNewChatMessage] = useState<string>('');
    const [sendingChat, setSendingChat] = useState<boolean>(false);
    const [loadingChatMessages, setLoadingChatMessages] = useState<boolean>(false);
    const [currentAdminId, setCurrentAdminId] = useState<string>(SYSTEM_ADMIN_ID);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    // Ambil auth admin ID saat component dimuat
    useEffect(() => {
        const fetchAuthUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.id) {
                    setCurrentAdminId(user.id);
                }
            } catch (err) {
                console.warn('Could not fetch admin auth user:', err);
            }
        };
        fetchAuthUser();
    }, []);

    const loadChatSessions = async (propIds: string[]) => {
        if (!propIds || propIds.length === 0) {
            setChatSessions([]);
            return;
        }
        try {
            const sessions = await getKostManagerChatSessions(propIds);
            setChatSessions(sessions);
            setSelectedChatSession(prev => {
                if (prev) {
                    const fresh = sessions.find(s => s.id === prev.id);
                    return fresh || sessions[0] || null;
                }
                return sessions[0] || null;
            });
        } catch (err) {
            console.error('Failed to load KM chat sessions:', err);
        }
    };

    // Realtime subscription untuk daftar sesi percakapan KostManager
    useEffect(() => {
        const propIds = properties.map(p => p.id).filter(Boolean);
        if (propIds.length === 0) return;

        const sub = subscribeToChatSessions(() => {
            loadChatSessions(propIds);
        });

        return () => {
            sub.unsubscribe();
        };
    }, [properties]);

    // Load messages when selectedChatSession changes
    useEffect(() => {
        if (!selectedChatSession) {
            setChatMessages([]);
            return;
        }

        let isMounted = true;
        setLoadingChatMessages(true);
        markMessagesAsRead(selectedChatSession.id, 'owner');
        setChatSessions(prev => prev.map(s => s.id === selectedChatSession.id ? { ...s, unread_count: 0 } : s));

        const fetchMsgs = async () => {
            try {
                const msgs = await getChatMessages(selectedChatSession.id);
                if (isMounted) {
                    setChatMessages(msgs);
                }
            } catch (err) {
                console.error('Failed to load chat messages:', err);
            } finally {
                if (isMounted) setLoadingChatMessages(false);
            }
        };

        fetchMsgs();

        // Subscribe to real-time incoming messages & read updates
        const subscription = subscribeToMessages(selectedChatSession.id, (incomingMsg, eventType) => {
            if (isMounted) {
                setChatMessages(prev => {
                    // 1. Jika event UPDATE (misal status is_read berubah), perbarui pesan yang ada
                    if (eventType === 'UPDATE' || prev.some(m => m.id === incomingMsg.id)) {
                        return prev.map(m => m.id === incomingMsg.id ? incomingMsg : m);
                    }

                    // 2. Jika ada pesan optimistik lokal dari pengirim yang sama dengan teks yang sama, ganti posisinya
                    const optimisticIndex = prev.findIndex(
                        m => m.sender_id === incomingMsg.sender_id && 
                             m.sender_type === incomingMsg.sender_type && 
                             m.message.trim() === incomingMsg.message.trim() &&
                             (!m.id.includes('-') || m.id.length < 20)
                    );

                    if (optimisticIndex !== -1) {
                        const updated = [...prev];
                        updated[optimisticIndex] = incomingMsg;
                        return updated;
                    }

                    // Jika pesan datang dari customer saat sesi sedang dibuka oleh CS, tandai dibaca
                    if (incomingMsg.sender_type !== 'owner') {
                        markMessagesAsRead(selectedChatSession.id, 'owner');
                        setChatSessions(prevSessions => prevSessions.map(s => s.id === selectedChatSession.id ? { ...s, unread_count: 0 } : s));
                    }

                    return [...prev, incomingMsg];
                });
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [selectedChatSession?.id]);

    // Auto scroll chat to bottom
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatMessages, loadingChatMessages]);

    // Handle Send Message
    const handleSendChatMessage = async (e?: React.FormEvent, customText?: string) => {
        if (e) e.preventDefault();
        const textToSend = customText || newChatMessage;
        if (!textToSend.trim() || !selectedChatSession || sendingChat) return;

        setSendingChat(true);
        const tempId = Date.now().toString();
        const optimisticMsg: ChatMessage = {
            id: tempId,
            session_id: selectedChatSession.id,
            sender_id: currentAdminId,
            sender_type: 'owner',
            message: textToSend.trim(),
            is_read: false,
            created_at: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, optimisticMsg]);
        if (!customText) setNewChatMessage('');

        try {
            const savedMsg = await sendMessage(
                selectedChatSession.id,
                currentAdminId,
                'owner',
                optimisticMsg.message,
                'Tim KostManager RuangSinggah'
            );
            if (savedMsg && savedMsg.id) {
                setChatMessages(prev => prev.map(m => m.id === tempId ? savedMsg : m));
            }
            const propIds = properties.map(p => p.id).filter(Boolean);
            loadChatSessions(propIds);
        } catch (err: any) {
            console.error('Failed to send message:', err);
            setChatMessages(prev => prev.filter(m => m.id !== tempId));
            alert('Gagal mengirim pesan: ' + (err.message || 'Silakan coba lagi.'));
        } finally {
            setSendingChat(false);
        }
    };




    // --- FETCH DATA ---
    const loadAllData = async () => {
        setLoading(true);
        try {
            // Load packages first so it doesn't get blocked by early returns
            const pkgs = await getKostManagerPackages();
            setPackages(pkgs);

            // 1. Ambil data dari tabel khusus mitra_kostmanager (Primary Reference Table)
            const { data: dedicatedKmProps, error: kmErr } = await supabase
                .from('mitra_kostmanager')
                .select('*')
                .order('created_at', { ascending: false });

            if (kmErr) console.warn('Warning loading mitra_kostmanager table:', kmErr);

            const kmPropertyIds = (dedicatedKmProps || []).map((k: any) => k.property_id).filter(Boolean);
            const kmOwnerIds = (dedicatedKmProps || []).map((k: any) => k.owner_uid).filter(Boolean);

            // 2. Ambil owner (mitra) dengan status langganan kostmanager
            const { data: mitras } = await supabase
                .from('mitra')
                .select('user_id, business_name, business_address')
                .eq('subscription_status', 'kostmanager');

            const ownerIds = mitras?.map(m => m.user_id).filter(Boolean) || [];

            // 3. Ambil kostmanager_requests yang ACTIVE untuk property tambahan
            const { data: kmRequests } = await supabase
                .from('kostmanager_requests')
                .select('id, user_id, kost_name, empty_rooms, property_id')
                .eq('status', 'ACTIVE');

            const reqOwnerIds = kmRequests?.map(r => r.user_id).filter(Boolean) || [];
            const reqPropertyIds = kmRequests?.map(r => r.property_id).filter(Boolean) || [];

            // 4. Ambil data dari tabel properties
            const { data: allRawProps, error: pErr } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (pErr) throw pErr;

            // 5. Filter HANYA properti yang terdaftar sebagai kelolaan KostManager secara sah
            const matchedPropsMap = new Map<string, any>();

            // A. Dari properti yang ada di properties table (is_managed = true, ada di mitra_kostmanager, atau request aktif)
            (allRawProps || []).forEach((p: any) => {
                const isInDedicatedKm = kmPropertyIds.includes(p.id);
                const isManagedFlag = p.is_managed === true;
                const isSubscribedOwner = ownerIds.includes(p.owner_uid);
                const isActiveRequestOwner = reqOwnerIds.includes(p.owner_uid);
                const isLinkedActiveRequest = Boolean(p.id && reqPropertyIds.includes(p.id));

                if (isInDedicatedKm || isManagedFlag || isSubscribedOwner || isActiveRequestOwner || isLinkedActiveRequest) {
                    matchedPropsMap.set(p.id, p);
                }
            });

            // B. Dari dedicated mitra_kostmanager table (jika record di properties belum ter-link)
            (dedicatedKmProps || []).forEach((kp: any) => {
                const existingKey = kp.property_id || kp.id;
                if (!matchedPropsMap.has(existingKey)) {
                    matchedPropsMap.set(existingKey, {
                        id: existingKey,
                        title: kp.title || 'Kost Auto-Pilot',
                        description: kp.description || '',
                        price: Number(kp.price) || 0,
                        facilities: kp.facilities || [],
                        address: kp.address || '',
                        city: kp.city || '',
                        area: kp.area || '',
                        province: kp.metadata?.province || kp.province || '',
                        location: kp.location || { lat: -5.147665, lng: 119.432731 },
                        rules: kp.rules || [],
                        campuses: kp.campuses || [],
                        image_urls: kp.image_urls || [],
                        room_types: kp.room_types || [],
                        owner_uid: kp.owner_uid,
                        status: 'published',
                        is_managed: true,
                        created_at: kp.created_at
                    });
                }
            });

            const props = Array.from(matchedPropsMap.values());

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
            const managedResidents: TenantRecord[] = (allResidents || []).filter((r: any) => managedPropIds.includes(r.kost_id)).map((r: any) => {
                const prop = props.find(p => p.id === r.kost_id);
                const rentPrice = Number(r.metadata?.basePrice) || Number(r.metadata?.price) || Number(r.last_transaction?.amount) || Number(prop?.price) || 0;
                return {
                    ...r,
                    totalRent: rentPrice,
                    rent_price: rentPrice,
                    property: {
                        id: r.kost_id,
                        title: prop?.title || r.property?.title || 'Kost',
                        price: prop?.price || 0,
                        address: prop?.address || r.property?.address || ''
                    }
                };
            });

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
                            room_number: cleanRoomName,
                            start_date: rt.startDate || rt.leaseStartDate || rt.start_date || (p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
                            end_date: rt.endDate || rt.leaseEndDate || rt.end_date || 'Sewa Berjalan',
                            status: 'ACTIVE',
                            totalRent: rentPrice,
                            rent_price: rentPrice,
                            metadata: {
                                basePrice: rentPrice,
                                price: rentPrice,
                                rentPrice: rentPrice,
                                facilityFee: 0,
                                extraPersonFee: Number(rt.extraOccupantFee) || 0,
                                billingPeriod: rt.paymentPeriod || rt.billingPeriod || 'bulanan',
                                phone: rt.residentPhone || rt.tenantPhone || '-',
                                isSurveyOccupant: true,
                                roomNumber: cleanRoomName
                            },
                            user: {
                                name: tenantName,
                                phone: rt.residentPhone || rt.tenantPhone || '-',
                                email: rt.residentEmail || rt.tenantEmail || '-',
                                photo_url: rt.residentKtpUrl || ''
                            },
                            property: {
                                id: p.id,
                                title: p.title || 'Kost',
                                price: Number(p.price) || rentPrice,
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
                    image_urls: normalizePhotosWithLabels(p.image_urls || (p as any).imageUrls || (p as any).images || (p as any).metadata?.imageUrls || (p as any).metadata?.photos || []),
                    video_urls: p.video_urls || [],
                    instagram_url: p.instagram_url || '',
                    tiktok_url: p.tiktok_url || '',
                    omnichannel_contact_name: p.omnichannel_contact_name || '',
                    omnichannel_contact_phone: p.omnichannel_contact_phone || '',
                    omnichannel_contact_type: p.omnichannel_contact_type || 'owner',
                    rules: p.rules || [],
                    created_at: p.created_at,
                    updated_at: p.updated_at,
                    managed_at: p.metadata?.managed_at || p.managed_at || (p.is_managed && p.updated_at ? p.updated_at : null) || p.created_at,
                    metadata: p.metadata || {}
                };
            });

            const allManagedIds = mappedProperties.map(p => p.id).filter(Boolean);

            // 8. Ambil tagihan manual (filter kategori sewa)
            const allInvoices = await getManualInvoices();
            const rentInvoices = allManagedIds.length === 0 ? [] : (allInvoices || []).filter((inv: any) => {
                if (inv.category !== 'sewa') return false;
                if (inv.kost_id && allManagedIds.includes(inv.kost_id)) return true;
                if (inv.kost_name) {
                    return mappedProperties.some(p =>
                        p.title?.toLowerCase().trim() === inv.kost_name?.toLowerCase().trim()
                    );
                }
                return false;
            });

            // 9. Ambil data pengajuan sewa (Booking Requests) untuk properti KostManager
            let managedBookings: any[] = [];
            if (allManagedIds.length > 0) {
                const { data: rawBookings, error: bErr } = await supabase
                    .from('transactions')
                    .select('*, user:user_id(id, name, phone, email)')
                    .in('product_id', allManagedIds)
                    .in('product_type', ['kost_booking', 'sewa', 'rent', 'tagihan_ekstra'])
                    .order('created_at', { ascending: false });

                if (bErr) console.warn('Warning loading bookings for KostManager:', bErr);

                // Grouping split transactions (Rent + Facility) into one parent booking
                const groupedBookingsMap = new Map<string, any>();
                const sessionToParentMap = new Map<string, string>();
                (rawBookings || []).forEach((b: any) => {
                    const bMeta = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : (b.metadata || {});
                    if (bMeta.booking_session_id && (b.product_type === 'kost_booking' || b.product_type === 'rent' || b.product_type === 'sewa')) {
                        sessionToParentMap.set(bMeta.booking_session_id, b.id);
                    }
                });

                (rawBookings || []).forEach((b: any) => {
                    const bMeta = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : (b.metadata || {});
                    const trueParentId = (bMeta.booking_session_id ? sessionToParentMap.get(bMeta.booking_session_id) : null) 
                                         || bMeta.parent_order_id 
                                         || b.id;

                    const matchedProp = mappedProperties.find(p => p.id === b.product_id);

                    if (!groupedBookingsMap.has(trueParentId)) {
                        groupedBookingsMap.set(trueParentId, {
                            ...b,
                            property: matchedProp || { id: b.product_id, title: bMeta.kostName || 'Kost', price: b.amount },
                            metadata: bMeta,
                            all_transactions: [b],
                            total_amount: Number(b.amount || 0)
                        });
                    } else {
                        const existing = groupedBookingsMap.get(trueParentId);
                        existing.all_transactions.push(b);
                        existing.total_amount += Number(b.amount || 0);
                        if (['kost_booking', 'rent', 'sewa'].includes(b.product_type)) {
                            existing.id = b.id;
                            existing.product_type = b.product_type;
                            existing.metadata = { ...existing.metadata, ...bMeta };
                            existing.amount = b.amount;
                            if (matchedProp) existing.property = matchedProp;
                        }
                    }
                });

                // Filter HANYA pengajuan sewa yang dibuat saat / setelah properti resmi berstatus KostManager
                managedBookings = Array.from(groupedBookingsMap.values())
                    .filter((group: any) => {
                        const bMeta = group.metadata || {};

                        // A. Jika transaksi secara eksplisit ditandai booking untuk kostmanager
                        if (bMeta.is_managed_kost === true || bMeta.isManaged === true || bMeta.managed_by === 'kostmanager') {
                            return true;
                        }

                        // B. Periksa tanggal transisi properti ke status KostManager
                        const matchedProp = group.property;
                        if (matchedProp) {
                            const kmTransitionDate = matchedProp.managed_at ||
                                                     matchedProp.metadata?.managed_at ||
                                                     matchedProp.metadata?.managed_since ||
                                                     (matchedProp.is_managed && matchedProp.updated_at ? matchedProp.updated_at : null) ||
                                                     matchedProp.created_at;

                            if (kmTransitionDate && group.created_at) {
                                const trxTime = new Date(group.created_at).getTime();
                                const kmTime = new Date(kmTransitionDate).getTime();
                                return trxTime >= kmTime;
                            }
                        }

                        return false;
                    })
                    .map((group: any) => ({
                        ...group,
                        amount: group.total_amount
                    }));
            }

            setProperties(mappedProperties);
            setTenants(combinedTenants);
            setInvoices(rentInvoices);
            setBookings(managedBookings);

            // Load Sesi Chat KostManager
            loadChatSessions(allManagedIds);
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

    // --- QUICK OCCUPANCY MUTATION HANDLERS (ROOM MATRIX TOGGLE) ---
    const handleSaveQuickOccupancy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickOccupancyModal.property || quickOccupancyModal.roomIndex < 0) return;
        const p = quickOccupancyModal.property;
        const rIdx = quickOccupancyModal.roomIndex;

        if (!quickOccupancyModal.residentName.trim()) {
            alert('Mohon isi nama penghuni');
            return;
        }

        setQuickOccupancyModal(prev => ({ ...prev, submitting: true }));
        try {
            const currentRooms = Array.isArray(p.room_types) ? JSON.parse(JSON.stringify(p.room_types)) : [];
            if (currentRooms[rIdx]) {
                currentRooms[rIdx] = {
                    ...currentRooms[rIdx],
                    status: 'Terisi',
                    isAvailable: false,
                    residentName: quickOccupancyModal.residentName.trim(),
                    residentPhone: quickOccupancyModal.residentPhone.trim(),
                    startDate: quickOccupancyModal.startDate || new Date().toISOString().split('T')[0],
                    endDate: quickOccupancyModal.endDate || '',
                    price: Number(quickOccupancyModal.price) || Number(currentRooms[rIdx].price) || Number(p.price) || 0
                };
            }

            // Update properties table
            await supabase
                .from('properties')
                .update({
                    room_types: currentRooms,
                    updated_at: new Date().toISOString()
                })
                .eq('id', p.id);

            // Sync mitra_kostmanager table if exists
            await supabase
                .from('mitra_kostmanager')
                .update({
                    room_types: currentRooms,
                    updated_at: new Date().toISOString()
                })
                .or(`property_id.eq.${p.id},id.eq.${p.id}`);

            // Refresh all data
            await loadAllData();

            // Update current selectedPropForRoomMatrix state
            setSelectedPropForRoomMatrix(prev => {
                if (!prev || prev.id !== p.id) return prev;
                const occ = currentRooms.filter((r: any) => r.status === 'Terisi' || r.isAvailable === false || Boolean(r.residentName)).length;
                return {
                    ...prev,
                    room_types: currentRooms,
                    occupant_count: occ,
                    empty_rooms: Math.max(0, currentRooms.length - occ)
                };
            });

            setQuickOccupancyModal({
                open: false,
                property: null,
                roomIndex: -1,
                roomName: '',
                price: 0,
                residentName: '',
                residentPhone: '',
                startDate: '',
                endDate: '',
                submitting: false
            });
        } catch (err: any) {
            console.error('Error saving occupancy:', err);
            alert('Gagal memperbarui status kamar: ' + err.message);
        } finally {
            setQuickOccupancyModal(prev => ({ ...prev, submitting: false }));
        }
    };

    const handleConfirmVacateRoom = async () => {
        if (!vacateConfirmModal.property || vacateConfirmModal.roomIndex < 0) return;
        const p = vacateConfirmModal.property;
        const rIdx = vacateConfirmModal.roomIndex;

        setVacateConfirmModal(prev => ({ ...prev, submitting: true }));
        try {
            const currentRooms = Array.isArray(p.room_types) ? JSON.parse(JSON.stringify(p.room_types)) : [];
            if (currentRooms[rIdx]) {
                currentRooms[rIdx] = {
                    ...currentRooms[rIdx],
                    status: 'Kosong',
                    isAvailable: true,
                    residentName: '',
                    residentPhone: '',
                    startDate: '',
                    endDate: ''
                };
            }

            // Update properties table
            await supabase
                .from('properties')
                .update({
                    room_types: currentRooms,
                    updated_at: new Date().toISOString()
                })
                .eq('id', p.id);

            // Sync mitra_kostmanager table if exists
            await supabase
                .from('mitra_kostmanager')
                .update({
                    room_types: currentRooms,
                    updated_at: new Date().toISOString()
                })
                .or(`property_id.eq.${p.id},id.eq.${p.id}`);

            // Refresh all data
            await loadAllData();

            // Update current selectedPropForRoomMatrix state
            setSelectedPropForRoomMatrix(prev => {
                if (!prev || prev.id !== p.id) return prev;
                const occ = currentRooms.filter((r: any) => r.status === 'Terisi' || r.isAvailable === false || Boolean(r.residentName)).length;
                return {
                    ...prev,
                    room_types: currentRooms,
                    occupant_count: occ,
                    empty_rooms: Math.max(0, currentRooms.length - occ)
                };
            });

            setVacateConfirmModal({
                open: false,
                property: null,
                roomIndex: -1,
                roomName: '',
                residentName: '',
                submitting: false
            });
        } catch (err: any) {
            console.error('Error vacating room:', err);
            alert('Gagal mengosongkan kamar: ' + err.message);
        } finally {
            setVacateConfirmModal(prev => ({ ...prev, submitting: false }));
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
    const handleCreateBill = async (e?: React.FormEvent, sendWhatsApp: boolean = true) => {
        if (e) e.preventDefault();
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
                due_date: billForm.dueDate || tenant.end_date || new Date().toISOString().split('T')[0],
                category: 'sewa',
                recipient_name: tenant.user?.name || 'Penyewa',
                recipient_phone: tenant.user?.phone || tenant.metadata?.phone || '',
                recipient_address: tenant.property?.address || '',
                kost_name: tenant.property?.title || 'Kost',
                rental_amount: amount,
                commission_percent: 0,
                commission_amount: 0,
                items,
                notes: billForm.notes,
                total
            });

            if (sendWhatsApp) {
                const cleanPhone = (tenant.user?.phone || tenant.metadata?.phone || '').replace(/[^0-9]/g, '');
                if (cleanPhone) {
                    const rawPeriod = tenant.metadata?.billingPeriod || tenant.metadata?.paymentPeriod || 'bulanan';
                    const leaseCalc = calculateNextLeasePeriod(tenant.start_date, tenant.end_date, rawPeriod, 1);
                    const waRes = await sendRentBillingReminderWhatsApp({
                        phone: cleanPhone,
                        tenantName: tenant.user?.name || 'Penghuni Kost',
                        propertyTitle: tenant.property?.title || 'Kost',
                        roomNumber: (tenant.room_type || '1').replace(/[^0-9]/g, '') || '1',
                        monthlyPrice: amount,
                        dueDate: billForm.dueDate || tenant.end_date || new Date().toISOString().split('T')[0],
                        propertyId: tenant.kost_id,
                        billingPeriod: leaseCalc.periodLabel,
                        previousPeriodStart: tenant.start_date,
                        previousPeriodEnd: tenant.end_date,
                        newPeriodStart: leaseCalc.newStartDate,
                        newPeriodEnd: leaseCalc.newEndDate,
                        extraFee: extra,
                        extraFeeName: billForm.extraFeeName
                    });
                    if (waRes.success) {
                        alert(`🎉 Tagihan sewa dan link auto-login berhasil dikirim ke WhatsApp ${tenant.user?.name || 'penghuni'} (+${cleanPhone})!`);
                    } else {
                        alert(`Tagihan tersimpan di sistem, namun gateway WA mengembalikan info: ${waRes.error || 'Silakan gunakan tombol WhatsApp Web manual'}`);
                    }
                } else {
                    alert('Tagihan sewa berhasil diterbitkan! (Nomor HP penghuni belum tercatat untuk kirim WA otomatis)');
                }
            } else {
                alert('Tagihan sewa bulanan berhasil diterbitkan!');
            }

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
            alert('Gagal memproses tagihan: ' + err.message);
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

        // Rekonstruksi roomTypes menjadi unit survey 1:1 identik dengan form pendataan lapangan
        const rawRoomList = Array.isArray(p.room_types) && p.room_types.length > 0
            ? p.room_types
            : ((p as any).metadata?.roomTypes || (p as any).metadata?.room_types || []);

        const reconstructedRoomTypes = unrollToSurveyRooms(rawRoomList, propResidents);

        // Fallback jika belum memiliki data unit kamar sama sekali
        if (reconstructedRoomTypes.length === 0) {
            reconstructedRoomTypes.push({
                name: 'Kamar 101',
                roomNumber: '101',
                floor: 'Lantai 1',
                type: 'Standard',
                status: 'Kosong',
                isAvailable: true,
                price: Number(p.price) || 850000,
                pricing: [{ period: 'bulanan', price: Number(p.price) || 850000 }],
                size: '3x4 meter',
                dimensions: '3x4 meter',
                maxOccupants: 1,
                roomFacilities: ['Kasur', 'Lemari Pakaian'],
                bathroomFacilities: ['Kamar Mandi Dalam'],
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
        }

        const propAddress = p.address || '';
        const propProvince = p.province || (p as any).metadata?.province || detectProvinceFromAddress(propAddress) || 'Sulawesi Selatan';
        const propCity = p.city || (p as any).metadata?.city || 'Makassar';
        const propArea = p.area || (p as any).metadata?.area || '';
        const propParking = p.publicParkingFacilities || p.public_parking_facilities || (p as any).metadata?.publicParkingFacilities || (p as any).metadata?.public_parking_facilities || ['Parkir Motor'];

        const normalizedPublicImages = normalizePhotosWithLabels(p.image_urls || []);

        setNewPropForm({
            title: p.title || '',
            description: p.description || '',
            address: propAddress,
            city: propCity,
            area: propArea,
            province: propProvince,
            type: p.type || 'Campur',
            totalRooms: p.total_rooms || (p as any).metadata?.totalRooms || reconstructedRoomTypes.length || 1,
            price: p.price || 0,
            owner_uid: p.owner_uid || '',
            location: p.location || { lat: -5.147665, lng: 119.432731 },
            facilities: p.facilities && p.facilities.length > 0 ? p.facilities : ['WiFi', 'Area Parkir', 'Dapur Bersama'],
            imageUrls: normalizedPublicImages,
            image_urls: normalizedPublicImages,
            videoUrls: p.video_urls || [],
            instagramUrl: p.instagram_url || '',
            tiktokUrl: p.tiktok_url || '',
            rules: p.rules && p.rules.length > 0 ? p.rules : ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
            campuses: p.campuses || [],
            publicFacilities: p.public_facilities || [],
            publicParkingFacilities: propParking,
            publicKitchenFacilities: p.public_kitchen_facilities || (p as any).metadata?.publicKitchenFacilities || [],
            publicBathroomFacilities: p.public_bathroom_facilities || (p as any).metadata?.publicBathroomFacilities || [],
            additionalFeePrice: p.additional_fee_price || 0,
            additionalFeeName: p.additional_fee_name || '',
            additionalFeeStartsFrom: p.additional_fee_starts_from || 'month_1',
            omnichannelContactName: p.omnichannel_contact_name || (p as any).metadata?.omnichannelContactName || '',
            omnichannelContactPhone: p.omnichannel_contact_phone || (p as any).metadata?.omnichannelContactPhone || '',
            omnichannelContactType: p.omnichannel_contact_type || 'owner',
            roomTypes: reconstructedRoomTypes
        });

        setIsAddPropOpen(true);
    };

    const handleUpdateStatusBill = async (id: string, status: 'issued' | 'paid' | 'cancelled') => {
        if (!window.confirm(`Ubah status tagihan menjadi ${status === 'paid' ? 'LUNAS (Verifikasi Pembayaran)' : status}?`)) return;
        try {
            await updateManualInvoiceStatus(id, status);

            const targetInv = invoices.find(inv => inv.id === id);
            if (status === 'paid' && targetInv) {
                // Auto-extend lease in resident_status if matching
                if (targetInv.due_date && targetInv.due_date !== 'Sewa Berjalan') {
                    const matchedTenant = tenants.find(t => 
                        (t.user?.phone && t.user.phone.replace(/[^0-9]/g, '') === (targetInv.recipient_phone || '').replace(/[^0-9]/g, '')) ||
                        t.user?.name === targetInv.recipient_name
                    );

                    if (matchedTenant && matchedTenant.id && !matchedTenant.id.startsWith('prop-resident-')) {
                        const rawPeriod = matchedTenant.metadata?.billingPeriod || 'bulanan';
                        const leaseCalc = calculateNextLeasePeriod(matchedTenant.start_date, matchedTenant.end_date, rawPeriod, 1);
                        await supabase.from('resident_status').update({
                            start_date: leaseCalc.newStartDate,
                            end_date: leaseCalc.newEndDate,
                            updated_at: new Date().toISOString()
                        }).eq('id', matchedTenant.id);
                    }
                }

                // Auto WhatsApp Receipt Dispatch
                const cleanPhone = (targetInv.recipient_phone || '').replace(/[^0-9]/g, '');
                if (cleanPhone) {
                    const extra = Number(targetInv.total || 0) - Number(targetInv.rental_amount || 0);
                    sendRentReceiptWhatsApp({
                        phone: cleanPhone,
                        tenantName: targetInv.recipient_name,
                        propertyTitle: targetInv.kost_name,
                        roomNumber: targetInv.notes?.match(/Kamar\s*([0-9a-zA-Z]+)/i)?.[1] || '1',
                        amount: Number(targetInv.total),
                        paymentMethod: 'Transfer / QRIS (Verifikasi Admin)',
                        orderId: targetInv.id,
                        paidAt: new Date().toISOString(),
                        billingPeriod: 'Bulanan',
                        newPeriodStart: targetInv.bill_date,
                        newPeriodEnd: targetInv.due_date,
                        extraFee: extra > 0 ? extra : 0,
                        extraFeeName: extra > 0 ? 'Biaya Tambahan' : undefined,
                        basePrice: Number(targetInv.rental_amount || targetInv.total)
                    }).catch(e => console.warn('WA Receipt auto-dispatch error:', e));
                }

                alert(`🎉 Status tagihan berhasil diverifikasi LUNAS! Kwitansi resmi otomatis dikirimkan ke WhatsApp ${targetInv.recipient_name}.`);
            } else {
                alert('Status tagihan berhasil diperbarui');
            }

            loadAllData();
        } catch (err: any) {
            alert('Gagal memperbarui status: ' + err.message);
        }
    };

    // Handler: Persetujuan Pengajuan Sewa (ACC) oleh Admin KostManager
    const handleApproveBooking = async (booking: any) => {
        const tenantName = booking.user?.name || booking.metadata?.tenantName || 'Calon Penghuni';
        const propTitle = booking.property?.title || booking.metadata?.kostName || 'Kost';
        const roomName = booking.metadata?.roomType || booking.metadata?.roomNumber || 'Kamar';
        const cleanPhone = (booking.user?.phone || booking.metadata?.tenantPhone || booking.metadata?.phone || '').replace(/[^0-9]/g, '');

        if (!window.confirm(`Setujui pengajuan sewa dari ${tenantName} untuk ${propTitle} (${roomName})?\n\nStatus akan diubah menjadi MENUNGGU PEMBAYARAN dan notifikasi WhatsApp resmi beserta tautan pembayaran akan otomatis dikirimkan ke calon penghuni.`)) {
            return;
        }

        setIsProcessingBooking(true);
        try {
            const transactions = booking.all_transactions || [booking];
            await Promise.all(transactions.map((t: any) => updateBookingStatus(t.id, 'AWAITING_PAYMENT')));

            // Sinkronkan status resident_status jika ada
            if (booking.resident_status_id) {
                await supabase
                    .from('resident_status')
                    .update({ status: 'AWAITING_PAYMENT', updated_at: new Date().toISOString() })
                    .eq('id', booking.resident_status_id);
            }

            // Kirim notifikasi WhatsApp resmi persetujuan sewa
            if (cleanPhone) {
                const extra = Number(booking.metadata?.extraPersonFee || 0) + Number(booking.metadata?.facilityFee || 0);
                const extraName = booking.metadata?.extraPersonFee > 0 ? 'Biaya Tambahan Orang' : (booking.metadata?.facilityFeeName || 'Biaya Fasilitas');
                const res = await sendBookingApprovalWhatsApp({
                    phone: cleanPhone,
                    tenantName,
                    propertyTitle: propTitle,
                    roomName,
                    periodLabel: booking.metadata?.periodLabel || 'Bulanan',
                    startDate: booking.metadata?.startDate || new Date().toISOString().split('T')[0],
                    totalAmount: Number(booking.amount || booking.total_amount || 0),
                    orderId: booking.id,
                    basePrice: Number(booking.metadata?.basePrice || booking.amount),
                    extraFee: extra > 0 ? extra : undefined,
                    extraFeeName: extra > 0 ? extraName : undefined,
                    occupants: Number(booking.metadata?.occupants || 1)
                });

                if (res.success) {
                    alert(`🎉 Pengajuan sewa berhasil disetujui (ACC)!\n\nSurat konfirmasi dan link pembayaran telah dikirimkan ke WhatsApp ${tenantName} (+${cleanPhone}).`);
                } else {
                    alert(`Pengajuan sewa disetujui! Namun gateway WA mengembalikan info: ${res.error || 'Silakan hubungi calon penghuni secara manual.'}`);
                }
            } else {
                alert(`🎉 Pengajuan sewa berhasil disetujui (ACC)! Calon penghuni dapat melanjutkan pembayaran.`);
            }

            await loadAllData();
        } catch (err: any) {
            console.error('Error approving booking:', err);
            alert('Gagal menyetujui pengajuan sewa: ' + err.message);
        } finally {
            setIsProcessingBooking(false);
        }
    };

    // Handler: Penolakan Pengajuan Sewa oleh Admin KostManager
    const handleRejectBooking = async (booking: any) => {
        const tenantName = booking.user?.name || booking.metadata?.tenantName || 'Calon Penghuni';
        const reason = window.prompt(`Tolak pengajuan sewa dari ${tenantName}? Masukkan catatan alasan penolakan:`, 'Kamar sedang dalam masa pemeliharaan / sudah terisi');
        if (reason === null) return;

        setIsProcessingBooking(true);
        try {
            const transactions = booking.all_transactions || [booking];
            await Promise.all(transactions.map((t: any) => updateBookingStatus(t.id, 'REJECTED')));

            if (booking.resident_status_id) {
                await supabase
                    .from('resident_status')
                    .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
                    .eq('id', booking.resident_status_id);
            }

            alert(`Pengajuan sewa dari ${tenantName} telah ditolak.`);
            await loadAllData();
        } catch (err: any) {
            console.error('Error rejecting booking:', err);
            alert('Gagal menolak pengajuan sewa: ' + err.message);
        } finally {
            setIsProcessingBooking(false);
        }
    };



    // Auto-fill bill form when tenant is selected (Struktur biaya riil tanpa hardcoded 1 Juta)
    useEffect(() => {
        if (selectedTenantIdForBill) {
            const tenant = tenants.find(t => t.id === selectedTenantIdForBill);
            if (tenant) {
                const prop = properties.find(p => p.id === tenant.kost_id) || tenant.property;
                const basePrice = Number(tenant.totalRent) || Number(tenant.rent_price) || Number(tenant.metadata?.basePrice) || Number(tenant.metadata?.price) || Number(prop?.price) || 0;
                const facilityFee = Number(tenant.metadata?.facilityFee) || 0;
                const extraPersonFee = Number(tenant.metadata?.extraPersonFee) || 0;
                const remainingBill = Number(tenant.metadata?.remainingBill) || 0;
                const propAdditionalFee = Number(prop?.additional_fee_price) || 0;
                const propAdditionalFeeName = prop?.additional_fee_name || '';

                let extraFee = facilityFee + extraPersonFee;
                let extraFeeName = '';
                if (extraPersonFee > 0) {
                    extraFeeName = 'Biaya Tambahan Orang';
                } else if (propAdditionalFee > 0 && propAdditionalFeeName) {
                    extraFee = propAdditionalFee;
                    extraFeeName = propAdditionalFeeName;
                } else if (remainingBill > 0) {
                    extraFee = remainingBill;
                    extraFeeName = 'Sisa Tagihan Awal';
                }

                // Kalkulasi tanggal jatuh tempo: mengacu pada end_date sewa berjalan (atau 1 bulan dari start_date)
                let autoDueDate = '';
                if (tenant.end_date && tenant.end_date !== 'Sewa Berjalan') {
                    autoDueDate = tenant.end_date;
                } else if (tenant.start_date) {
                    const sDate = new Date(tenant.start_date);
                    sDate.setMonth(sDate.getMonth() + 1);
                    autoDueDate = sDate.toISOString().split('T')[0];
                } else {
                    const defaultDue = new Date();
                    defaultDue.setDate(defaultDue.getDate() + 7);
                    autoDueDate = defaultDue.toISOString().split('T')[0];
                }

                setBillForm({
                    rentalAmount: basePrice,
                    extraFee,
                    extraFeeName,
                    dueDate: autoDueDate,
                    notes: ''
                });
            }
        }
    }, [selectedTenantIdForBill, tenants, properties]);

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
                        { key: 'bookings', icon: '📥', label: 'Pengajuan Sewa' },
                        { key: 'chats', icon: '💬', label: 'Pesan & Chat Customer' },
                        { key: 'tenants', icon: '👥', label: 'Penghuni' },
                        { key: 'billing', icon: '🧾', label: 'Riwayat Pembayaran Sewa' },
                        { key: 'packages', icon: '⚙️', label: 'Harga Langganan' }
                    ] as const).map(t => {
                        const unreadChatCount = chatSessions.reduce((acc, s) => acc + (s.unread_count || 0), 0);
                        const pendingBookingCount = bookings.filter(b => (b.status || '').toUpperCase() === 'PENDING_APPROVAL').length;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                                    activeTab === t.key
                                        ? 'bg-orange-50 text-orange-600 font-bold shadow-2xs'
                                        : 'text-gray-600 hover:bg-gray-50 font-semibold'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{t.icon}</span>
                                    <span className="text-xs uppercase tracking-wide">{t.label}</span>
                                </div>
                                {t.key === 'chats' && unreadChatCount > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'chats' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'}`}>
                                        {unreadChatCount}
                                    </span>
                                )}
                                {t.key === 'bookings' && pendingBookingCount > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'bookings' ? 'bg-orange-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
                                        {pendingBookingCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
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
                             activeTab === 'bookings' ? 'Pengajuan Sewa Masuk' :
                             activeTab === 'chats' ? 'Pesan & Chat Customer' :
                             activeTab === 'tenants' ? 'Daftar Penghuni' :
                             activeTab === 'billing' ? 'Riwayat Pembayaran Sewa' : 'Harga Langganan KostManager'}
                        </h2>
                        <p className="text-xs text-gray-400 font-bold mt-1">
                            {activeTab === 'overview' ? 'Analisis okupansi, tagihan, dan status auto-pilot aktif' :
                             activeTab === 'properties' ? 'Kelola detail kamar, kapasitas, dan status pemasaran properti' :
                             activeTab === 'bookings' ? 'Tinjau dan verifikasi permintaan sewa masuk dari calon penghuni sebelum pembayaran' :
                             activeTab === 'chats' ? 'Layanan CS terpusat & konsultasi calon penyewa untuk seluruh kost terkelola' :
                             activeTab === 'tenants' ? 'Daftar penghuni aktif beserta periode sewa dan detail kontak' :
                             activeTab === 'billing' ? 'Mencatat, memantau riwayat pembayaran sewa, dan mengelola tagihan sewa kost' :
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

                            {/* Alert Permintaan Sewa Baru */}
                            {bookings.filter(b => (b.status || '').toUpperCase() === 'PENDING_APPROVAL').length > 0 && (
                                <div className="bg-gradient-to-r from-amber-500 to-rose-500 text-white p-6 rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shrink-0">
                                            📥
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black uppercase tracking-tight">Ada {bookings.filter(b => (b.status || '').toUpperCase() === 'PENDING_APPROVAL').length} Pengajuan Sewa Baru Menunggu Persetujuan (ACC)!</h4>
                                            <p className="text-xs text-amber-100 font-semibold mt-0.5">Calon penghuni sedang menunggu konfirmasi admin sebelum melakukan pembayaran sewa.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('bookings')}
                                        className="px-5 py-2.5 bg-white text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
                                    >
                                        Tinjau Pengajuan ➔
                                    </button>
                                </div>
                            )}

                            {/* Status Banner */}
                            <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex gap-4">
                                <div className="text-orange-600 text-2xl shrink-0">⚡</div>
                                <div>
                                    <h4 className="text-sm font-black text-orange-950 uppercase tracking-tight">Operasional Auto-Pilot Aktif</h4>
                                    <p className="text-xs text-orange-800 leading-relaxed mt-1">
                                        Seluruh kost yang terdaftar di halaman ini berada di bawah kendali manajemen RuangSinggah. Calon penghuni baru dapat memesan langsung dari website utama. Untuk tagihan bulanan penyewa lama, gunakan tab <strong>"Riwayat Pembayaran Sewa"</strong> untuk menerbitkan dan memantau status pembayaran.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =========================================== */}
                    {/* TAB: BOOKINGS (PENGAJUAN SEWA MASUK)        */}
                    {/* =========================================== */}
                    {activeTab === 'bookings' && (() => {
                        const pendingBookings = bookings.filter(b => (b.status || '').toUpperCase() === 'PENDING_APPROVAL');
                        const awaitingPaymentBookings = bookings.filter(b => (b.status || '').toUpperCase() === 'AWAITING_PAYMENT');
                        const paidBookings = bookings.filter(b => ['PAID', 'COMPLETED'].includes((b.status || '').toUpperCase()));
                        const rejectedBookings = bookings.filter(b => ['REJECTED', 'CANCELLED'].includes((b.status || '').toUpperCase()));

                        const filteredList = bookings.filter(b => {
                            const s = (b.status || '').toUpperCase();
                            if (bookingStatusFilter === 'PENDING_APPROVAL' && s !== 'PENDING_APPROVAL') return false;
                            if (bookingStatusFilter === 'AWAITING_PAYMENT' && s !== 'AWAITING_PAYMENT') return false;
                            if (bookingStatusFilter === 'PAID' && !['PAID', 'COMPLETED'].includes(s)) return false;
                            if (bookingStatusFilter === 'REJECTED' && !['REJECTED', 'CANCELLED'].includes(s)) return false;

                            if (bookingSearch.trim()) {
                                const q = bookingSearch.toLowerCase();
                                const name = (b.user?.name || b.metadata?.tenantName || '').toLowerCase();
                                const phone = (b.user?.phone || b.metadata?.phone || b.metadata?.tenantPhone || '').toLowerCase();
                                const kostName = (b.property?.title || b.metadata?.kostName || '').toLowerCase();
                                const room = (b.metadata?.roomType || b.metadata?.roomNumber || '').toLowerCase();
                                return name.includes(q) || phone.includes(q) || kostName.includes(q) || room.includes(q);
                            }
                            return true;
                        });

                        return (
                            <div className="space-y-6">
                                {/* 1. Grid Stats Pengajuan Sewa */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <button
                                        onClick={() => setBookingStatusFilter('PENDING_APPROVAL')}
                                        className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
                                            bookingStatusFilter === 'PENDING_APPROVAL'
                                                ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-[1.02]'
                                                : 'bg-white border-slate-200/90 text-slate-700 hover:border-amber-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${bookingStatusFilter === 'PENDING_APPROVAL' ? 'text-amber-100' : 'text-slate-400'}`}>Menunggu Persetujuan</span>
                                            <span className="text-xl">⏳</span>
                                        </div>
                                        <p className="text-3xl font-black">{pendingBookings.length}</p>
                                        <p className={`text-[10px] font-bold mt-1 ${bookingStatusFilter === 'PENDING_APPROVAL' ? 'text-amber-100' : 'text-amber-600'}`}>Perlu Tindakan Admin (ACC)</p>
                                    </button>

                                    <button
                                        onClick={() => setBookingStatusFilter('AWAITING_PAYMENT')}
                                        className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
                                            bookingStatusFilter === 'AWAITING_PAYMENT'
                                                ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-[1.02]'
                                                : 'bg-white border-slate-200/90 text-slate-700 hover:border-blue-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${bookingStatusFilter === 'AWAITING_PAYMENT' ? 'text-blue-100' : 'text-slate-400'}`}>Menunggu Bayar</span>
                                            <span className="text-xl">💳</span>
                                        </div>
                                        <p className="text-3xl font-black">{awaitingPaymentBookings.length}</p>
                                        <p className={`text-[10px] font-bold mt-1 ${bookingStatusFilter === 'AWAITING_PAYMENT' ? 'text-blue-100' : 'text-blue-600'}`}>Sudah di-ACC, Tunggu Bayar</p>
                                    </button>

                                    <button
                                        onClick={() => setBookingStatusFilter('PAID')}
                                        className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
                                            bookingStatusFilter === 'PAID'
                                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-[1.02]'
                                                : 'bg-white border-slate-200/90 text-slate-700 hover:border-emerald-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${bookingStatusFilter === 'PAID' ? 'text-emerald-100' : 'text-slate-400'}`}>Disetujui & Lunas</span>
                                            <span className="text-xl">✅</span>
                                        </div>
                                        <p className="text-3xl font-black">{paidBookings.length}</p>
                                        <p className={`text-[10px] font-bold mt-1 ${bookingStatusFilter === 'PAID' ? 'text-emerald-100' : 'text-emerald-600'}`}>Penghuni Aktif Berhasil</p>
                                    </button>

                                    <button
                                        onClick={() => setBookingStatusFilter('REJECTED')}
                                        className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
                                            bookingStatusFilter === 'REJECTED'
                                                ? 'bg-rose-600 text-white border-rose-700 shadow-md scale-[1.02]'
                                                : 'bg-white border-slate-200/90 text-slate-700 hover:border-rose-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${bookingStatusFilter === 'REJECTED' ? 'text-rose-100' : 'text-slate-400'}`}>Ditolak / Batal</span>
                                            <span className="text-xl">❌</span>
                                        </div>
                                        <p className="text-3xl font-black">{rejectedBookings.length}</p>
                                        <p className={`text-[10px] font-bold mt-1 ${bookingStatusFilter === 'REJECTED' ? 'text-rose-100' : 'text-rose-600'}`}>Permintaan Dibatalkan</p>
                                    </button>
                                </div>

                                {/* 2. Search & Filter Bar */}
                                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-3xl border border-slate-200/90 shadow-soft">
                                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                                        {[
                                            { key: 'ALL', label: 'Semua Pengajuan', count: bookings.length },
                                            { key: 'PENDING_APPROVAL', label: 'Menunggu Persetujuan', count: pendingBookings.length },
                                            { key: 'AWAITING_PAYMENT', label: 'Menunggu Bayar', count: awaitingPaymentBookings.length },
                                            { key: 'PAID', label: 'Lunas', count: paidBookings.length },
                                            { key: 'REJECTED', label: 'Ditolak', count: rejectedBookings.length }
                                        ].map(f => (
                                            <button
                                                key={f.key}
                                                onClick={() => setBookingStatusFilter(f.key as any)}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                                                    bookingStatusFilter === f.key
                                                        ? 'bg-slate-900 text-white shadow-sm'
                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                                                }`}
                                            >
                                                <span>{f.label}</span>
                                                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                                                    bookingStatusFilter === f.key ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                                                }`}>
                                                    {f.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="relative w-full sm:w-72">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari pemohon, kost, unit, No. WA..."
                                            value={bookingSearch}
                                            onChange={e => setBookingSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                        />
                                    </div>
                                </div>

                                {/* 3. Tabel Daftar Pengajuan Sewa (Enterprise Grade) */}
                                <div className="bg-white border border-slate-200/90 rounded-3xl shadow-soft overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                                                    <th className="px-6 py-4">Calon Penghuni</th>
                                                    <th className="px-6 py-4">Properti & Kamar</th>
                                                    <th className="px-6 py-4">Paket & Rencana Masuk</th>
                                                    <th className="px-6 py-4">Total Biaya</th>
                                                    <th className="px-6 py-4">Status Pengajuan</th>
                                                    <th className="px-6 py-4 text-right">Aksi Manajemen</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {filteredList.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <Inbox size={32} className="text-slate-300" />
                                                                <p>Tidak ada pengajuan sewa yang sesuai dengan filter.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredList.map((b: any) => {
                                                        const rawStatus = (b.status || '').toUpperCase();
                                                        const tenantName = b.user?.name || b.metadata?.tenantName || 'Calon Penghuni';
                                                        const tenantPhone = b.user?.phone || b.metadata?.tenantPhone || b.metadata?.phone || '-';
                                                        const cleanPhone = tenantPhone.replace(/[^0-9]/g, '');
                                                        const tenantEmail = b.user?.email || b.metadata?.email || '-';
                                                        const propTitle = b.property?.title || b.metadata?.kostName || 'Kost';
                                                        const roomName = b.metadata?.roomType || b.metadata?.roomNumber || 'Kamar Standar';
                                                        const periodLabel = b.metadata?.periodLabel || b.metadata?.period || 'Bulanan';
                                                        const startDate = b.metadata?.startDate || '-';
                                                        const occupants = Number(b.metadata?.occupants || b.metadata?.occupantCount || 1);
                                                        const totalPay = Number(b.amount || b.total_amount || 0);

                                                        const isPending = rawStatus === 'PENDING_APPROVAL';
                                                        const isAwaitingPayment = rawStatus === 'AWAITING_PAYMENT';
                                                        const isPaid = ['PAID', 'COMPLETED'].includes(rawStatus);
                                                        const isRejected = ['REJECTED', 'CANCELLED'].includes(rawStatus);

                                                        return (
                                                            <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                                                                {/* Calon Penghuni */}
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0 uppercase">
                                                                            {tenantName.charAt(0) || 'U'}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-black text-slate-900 text-sm leading-snug">{tenantName}</p>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                {cleanPhone ? (
                                                                                    <a
                                                                                        href={`https://wa.me/${cleanPhone}`}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                                                                    >
                                                                                        <Phone size={11} />
                                                                                        <span>+{cleanPhone}</span>
                                                                                    </a>
                                                                                ) : (
                                                                                    <span className="text-[11px] text-slate-400">-</span>
                                                                                )}
                                                                            </div>
                                                                            {tenantEmail !== '-' && (
                                                                                <p className="text-[10px] text-slate-400 font-medium">{tenantEmail}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Properti & Kamar */}
                                                                <td className="px-6 py-4">
                                                                    <div>
                                                                        <p className="font-black text-slate-800 text-xs">{propTitle}</p>
                                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                                            <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200/60 text-[10px] font-bold">
                                                                                🚪 {roomName}
                                                                            </span>
                                                                            {occupants > 1 && (
                                                                                <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold">
                                                                                    👥 {occupants} Orang
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Paket & Rencana Masuk */}
                                                                <td className="px-6 py-4">
                                                                    <div>
                                                                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-wider mb-1">
                                                                            {periodLabel}
                                                                        </span>
                                                                        <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1">
                                                                            <Calendar size={12} className="text-slate-400" />
                                                                            <span>Masuk: {startDate !== '-' ? new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                                                                        </p>
                                                                    </div>
                                                                </td>

                                                                {/* Total Biaya */}
                                                                <td className="px-6 py-4">
                                                                    <div>
                                                                        <p className="font-black text-slate-900 text-sm">{FORMAT_CURRENCY(totalPay)}</p>
                                                                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Total Tagihan Awal</p>
                                                                    </div>
                                                                </td>

                                                                {/* Status */}
                                                                <td className="px-6 py-4">
                                                                    {isPending && (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                                                            <Clock size={11} /> Menunggu Persetujuan
                                                                        </span>
                                                                    )}
                                                                    {isAwaitingPayment && (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                                                            <CreditCard size={11} /> Menunggu Pembayaran
                                                                        </span>
                                                                    )}
                                                                    {isPaid && (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                            <CheckCircle2 size={11} /> Lunas & Aktif
                                                                        </span>
                                                                    )}
                                                                    {isRejected && (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                                                            <AlertCircle size={11} /> Ditolak / Batal
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                {/* Aksi Manajemen */}
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        {/* Tombol Hubungi WhatsApp */}
                                                                        {cleanPhone && (
                                                                            <a
                                                                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Halo Kak ${tenantName}, kami dari Manajemen KostManager RuangSinggah terkait pengajuan sewa kamar di ${propTitle}...`)}`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                                                                                title="Hubungi via WhatsApp"
                                                                            >
                                                                                <MessageSquare size={13} />
                                                                            </a>
                                                                        )}

                                                                        {isPending && (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={isProcessingBooking}
                                                                                    onClick={() => handleRejectBooking(b)}
                                                                                    className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                                                                >
                                                                                    Tolak
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={isProcessingBooking}
                                                                                    onClick={() => handleApproveBooking(b)}
                                                                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                                                                >
                                                                                    <Check size={13} strokeWidth={3} />
                                                                                    <span>Setujui (ACC)</span>
                                                                                </button>
                                                                            </>
                                                                        )}

                                                                        {isAwaitingPayment && cleanPhone && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const extra = Number(b.metadata?.extraPersonFee || 0) + Number(b.metadata?.facilityFee || 0);
                                                                                    const extraName = b.metadata?.extraPersonFee > 0 ? 'Biaya Tambahan Orang' : (b.metadata?.facilityFeeName || 'Biaya Fasilitas');
                                                                                    sendBookingApprovalWhatsApp({
                                                                                        phone: cleanPhone,
                                                                                        tenantName,
                                                                                        propertyTitle: propTitle,
                                                                                        roomName,
                                                                                        periodLabel,
                                                                                        startDate,
                                                                                        totalAmount: totalPay,
                                                                                        orderId: b.id,
                                                                                        basePrice: Number(b.metadata?.basePrice || totalPay),
                                                                                        extraFee: extra > 0 ? extra : undefined,
                                                                                        extraFeeName: extra > 0 ? extraName : undefined,
                                                                                        occupants
                                                                                    }).then(res => {
                                                                                        if (res.success) alert(`Pesan konfirmasi & link bayar berhasil dikirimkan ulang ke WA ${tenantName}!`);
                                                                                        else alert(`Gagal kirim WA: ${res.error || 'Cek koneksi'}`);
                                                                                    });
                                                                                }}
                                                                                className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                                                                            >
                                                                                <Send size={12} />
                                                                                <span>Kirim Link Bayar</span>
                                                                            </button>
                                                                        )}

                                                                        {isPaid && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setActiveTab('tenants')}
                                                                                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                                                                            >
                                                                                <Users size={12} />
                                                                                <span>Penghuni</span>
                                                                            </button>
                                                                        )}
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
                            </div>
                        );
                    })()}

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
                            const q = propertySearch.toLowerCase().trim();
                            return (
                                (p.title || '').toLowerCase().includes(q) ||
                                (p.city || '').toLowerCase().includes(q) ||
                                (p.area || '').toLowerCase().includes(q) ||
                                (p.address || '').toLowerCase().includes(q) ||
                                (p.owner_name || '').toLowerCase().includes(q) ||
                                (p.owner_phone || '').includes(q)
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
                                                                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                                                                            title="Lihat Denah Kamar & Status Ketersediaan"
                                                                        >
                                                                            <Bed size={13} />
                                                                            <span>Kamar</span>
                                                                        </button>

                                                                        {/* Tombol 3: Direktori Penghuni Properti Ini */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSelectedPropForTenants(p)}
                                                                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                                                                            title="Lihat Seluruh Daftar Penghuni Properti Ini"
                                                                        >
                                                                            <Users size={13} />
                                                                            <span>Penghuni ({p.occupant_count || 0})</span>
                                                                        </button>

                                                                        {/* Tombol 4: Chat Customer Properti Ini */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setChatPropertyFilter(p.id);
                                                                                setActiveTab('chats');
                                                                            }}
                                                                            className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                                                                            title="Buka Pesan & Chat Customer untuk Kost Ini"
                                                                        >
                                                                            <MessageSquare size={13} />
                                                                            <span>Chat ({chatSessions.filter(s => s.property_id === p.id).length})</span>
                                                                        </button>

                                                                        {/* Tombol 5: Broadcast WhatsApp Pengumuman Gedung */}
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
                                                                        <div className="mt-3 pt-2.5 border-t border-emerald-200/60 text-xs space-y-2">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-slate-500 font-bold text-[10px]">Penghuni:</span>
                                                                                <span className="font-black text-slate-900 text-xs">{tenant.user?.name || rt.residentName || 'Penyewa'}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between text-[10px]">
                                                                                <span className="text-slate-400 font-bold">Masa Sewa:</span>
                                                                                <span className="text-slate-700 font-bold font-mono">{tenant.start_date || rt.startDate || '-'} s/d {tenant.end_date || rt.endDate || '-'}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-end gap-1.5 pt-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setVacateConfirmModal({
                                                                                        open: true,
                                                                                        property: p,
                                                                                        roomIndex: rIdx,
                                                                                        roomName,
                                                                                        residentName: tenant.user?.name || rt.residentName || 'Penyewa',
                                                                                        submitting: false
                                                                                    })}
                                                                                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                                                                                    title="Ubah status kamar menjadi Kosong"
                                                                                >
                                                                                    <LogOut size={11} /> Kosongkan Kamar
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                                                                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                                                                <CheckCircle2 size={11} /> Siap Disewakan
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const todayStr = new Date().toISOString().split('T')[0];
                                                                                    const nextMonth = new Date();
                                                                                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                                                                                    const nextMonthStr = nextMonth.toISOString().split('T')[0];
                                                                                    setQuickOccupancyModal({
                                                                                        open: true,
                                                                                        property: p,
                                                                                        roomIndex: rIdx,
                                                                                        roomName,
                                                                                        price: Number(rt.price) || Number(p.price) || 0,
                                                                                        residentName: '',
                                                                                        residentPhone: '',
                                                                                        startDate: todayStr,
                                                                                        endDate: nextMonthStr,
                                                                                        submitting: false
                                                                                    });
                                                                                }}
                                                                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-wider shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                                                                                title="Ubah status kamar menjadi Terisi"
                                                                            >
                                                                                <Check size={11} /> Set Terisi
                                                                            </button>
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
                                {/* MODAL: DAFTAR PENGHUNI PROPERTI (TENANTS DIRECTORY)        */}
                                {/* ========================================================= */}
                                {selectedPropForTenants && (() => {
                                    const p = selectedPropForTenants;
                                    const propTenants = tenants.filter(t => t.kost_id === p.id && t.status === 'ACTIVE');
                                    const rooms = Array.isArray(p.room_types) ? p.room_types : [];
                                    const totalMonthlyRevenue = propTenants.reduce((sum, t) => {
                                        const basePrice = Number(t.metadata?.basePrice) || Number(t.metadata?.price) || Number(p.price) || 0;
                                        return sum + basePrice;
                                    }, 0);

                                    return (
                                        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in">
                                            <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 max-h-[85vh]" onClick={e => e.stopPropagation()}>
                                                {/* Header Modal */}
                                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/70 shrink-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                                            <Users size={18} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-black text-indigo-950 uppercase tracking-tight">Daftar Penghuni Properti</h3>
                                                            <p className="text-[10px] text-indigo-700 font-bold">{p.title} • {propTenants.length} Penghuni Aktif</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedPropForTenants(null)}
                                                        className="p-2 hover:bg-slate-200/70 rounded-full text-slate-400 transition-colors cursor-pointer"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>

                                                {/* Content Modal */}
                                                <div className="p-6 overflow-y-auto space-y-4">
                                                    {/* Ringkasan Okupansi */}
                                                    <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                                                        <div>
                                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Total Penghuni</span>
                                                            <span className="text-base font-black text-indigo-950">{propTenants.length} Orang</span>
                                                        </div>
                                                        <div className="border-x border-slate-200">
                                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Total Kamar</span>
                                                            <span className="text-base font-black text-slate-900">{rooms.length || p.total_rooms || 1} Unit</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Est. Omset Bulanan</span>
                                                            <span className="text-base font-black text-emerald-600">{FORMAT_CURRENCY(totalMonthlyRevenue)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Daftar Kartu Penyewa */}
                                                    <div className="space-y-3">
                                                        {propTenants.length === 0 ? (
                                                            <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto">
                                                                    <Users size={24} />
                                                                </div>
                                                                <h4 className="font-black text-slate-700 text-sm">Belum Ada Penghuni Aktif</h4>
                                                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                                                    Saat calon penyewa menyewa kamar melalui portal atau didata oleh agen, data penghuni akan otomatis tampil di sini.
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            propTenants.map((t, tIdx) => {
                                                                const life = calculateTenantLifecycle(t.start_date, t.end_date, t.status);
                                                                const rentAmount = Number(t.metadata?.basePrice) || Number(t.metadata?.price) || Number(p.price) || 0;
                                                                const waUrl = generateTenantWhatsAppReminder(t);
                                                                const cleanPhone = (t.user?.phone || t.metadata?.phone || '').replace(/[^0-9]/g, '');

                                                                return (
                                                                    <div key={t.id || tIdx} className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 shadow-2xs transition-all space-y-3">
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm uppercase">
                                                                                    {(t.user?.name || 'P')[0]}
                                                                                </div>
                                                                                <div>
                                                                                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                                                                                        {t.user?.name || 'Penyewa'}
                                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-orange-100 text-orange-800">
                                                                                            {t.room_type || t.metadata?.roomNumber || 'Kamar'}
                                                                                        </span>
                                                                                    </h4>
                                                                                    <p className="text-xs text-slate-500 font-mono mt-0.5">+{cleanPhone || '-'}</p>
                                                                                </div>
                                                                            </div>

                                                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-xl border ${life.badgeClass}`}>
                                                                                {life.label}
                                                                            </span>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                                                                            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl">
                                                                                <span className="text-slate-500 font-bold text-[10px]">Masa Sewa:</span>
                                                                                <span className="font-mono font-bold text-slate-800">{t.start_date || '-'} s/d {t.end_date || '-'}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl">
                                                                                <span className="text-slate-500 font-bold text-[10px]">Tarif Bulanan:</span>
                                                                                <span className="font-mono font-black text-emerald-700">{FORMAT_CURRENCY(rentAmount)}</span>
                                                                            </div>
                                                                        </div>

                                                                        {cleanPhone && (
                                                                            <div className="flex items-center justify-end gap-2 pt-1">
                                                                                <a
                                                                                    href={`https://wa.me/${cleanPhone}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5"
                                                                                    title="Chat langsung dengan penyewa di WhatsApp"
                                                                                >
                                                                                    <MessageSquare size={12} className="text-emerald-600" /> Hubungi WA
                                                                                </a>

                                                                                <a
                                                                                    href={generateTenantWhatsAppInvoice(t, p.title, p.price)}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase tracking-wider shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
                                                                                    title="Kirim Surat Tagihan Resmi via WhatsApp"
                                                                                >
                                                                                    <FileText size={12} /> Kirim Tagihan
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Footer Modal */}
                                                <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedPropForTenants(null)}
                                                        className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                                                    >
                                                        Tutup
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
                            const prop = properties.find(p => p.id === t.kost_id);
                            const basePrice = Number(t.metadata?.basePrice) || Number(t.metadata?.price) || Number(t.metadata?.monthlyPrice) || Number(t.totalRent) || Number(t.rent_price) || Number(prop?.price) || 0;
                            const facilityFee = Number(t.metadata?.facilityFee) || 0;
                            const extraFee = Number(t.metadata?.extraPersonFee) || 0;
                            const totalRent = (basePrice > 0 ? basePrice : (Number(prop?.price) || 0)) + facilityFee + extraFee;

                            return {
                                ...t,
                                lifecycle: life,
                                totalRent,
                                property: {
                                    id: t.kost_id,
                                    title: t.property?.title || prop?.title || 'Kost',
                                    price: Number(prop?.price) || totalRent,
                                    address: t.property?.address || prop?.address || ''
                                }
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
                                                                                const autoPrice = Number(t.totalRent) || Number(t.metadata?.basePrice) || Number(t.metadata?.price) || Number(t.property?.price) || 0;
                                                                                const autoDueDate = (t.end_date && t.end_date !== 'Sewa Berjalan') ? t.end_date : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                                                setBillForm({
                                                                                    dueDate: autoDueDate,
                                                                                    rentalAmount: autoPrice,
                                                                                    extraFee: 0,
                                                                                    extraFeeName: '',
                                                                                    notes: ''
                                                                                });
                                                                                setIsAddBillOpen(true);
                                                                            }}
                                                                            className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#ff7a00] border border-orange-200/80 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                                                                            title="Terbitkan Tagihan Sewa Otomatis"
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
                                                        <td className="px-6 py-4 text-right">
                                                            {inv.status === 'paid' && (
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const extra = Number(inv.total || 0) - Number(inv.rental_amount || 0);
                                                                            setSelectedReceipt({
                                                                                receiptNumber: inv.id,
                                                                                paidAt: inv.updated_at || inv.bill_date,
                                                                                tenantName: inv.recipient_name,
                                                                                tenantPhone: inv.recipient_phone,
                                                                                propertyTitle: inv.kost_name,
                                                                                roomNumber: inv.notes?.match(/Kamar\s*([0-9a-zA-Z]+)/i)?.[1] || '1',
                                                                                billingPeriod: 'Bulanan',
                                                                                newPeriodStart: inv.bill_date,
                                                                                newPeriodEnd: inv.due_date,
                                                                                baseRent: Number(inv.rental_amount || inv.total),
                                                                                extraFee: extra > 0 ? extra : 0,
                                                                                extraFeeName: extra > 0 ? 'Biaya Tambahan' : undefined,
                                                                                totalAmount: Number(inv.total),
                                                                                paymentMethod: 'Manual / Transfer / Payment Gateway'
                                                                            });
                                                                            setShowDigitalReceiptModal(true);
                                                                        }}
                                                                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                                                                        title="Buka Lembar Kwitansi Resmi"
                                                                    >
                                                                        <FileText size={11} /> Kwitansi
                                                                    </button>

                                                                    {inv.recipient_phone && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={async () => {
                                                                                const extra = Number(inv.total || 0) - Number(inv.rental_amount || 0);
                                                                                const cleanPhone = (inv.recipient_phone || '').replace(/[^0-9]/g, '');
                                                                                const res = await sendRentReceiptWhatsApp({
                                                                                    phone: cleanPhone,
                                                                                    tenantName: inv.recipient_name,
                                                                                    propertyTitle: inv.kost_name,
                                                                                    roomNumber: inv.notes?.match(/Kamar\s*([0-9a-zA-Z]+)/i)?.[1] || '1',
                                                                                    amount: Number(inv.total),
                                                                                    paymentMethod: 'Transfer / QRIS (Verifikasi Admin)',
                                                                                    orderId: inv.id,
                                                                                    paidAt: inv.updated_at || inv.bill_date,
                                                                                    billingPeriod: 'Bulanan',
                                                                                    newPeriodStart: inv.bill_date,
                                                                                    newPeriodEnd: inv.due_date,
                                                                                    extraFee: extra > 0 ? extra : 0,
                                                                                    extraFeeName: extra > 0 ? 'Biaya Tambahan' : undefined,
                                                                                    basePrice: Number(inv.rental_amount || inv.total)
                                                                                });
                                                                                if (res.success) {
                                                                                    alert(`🎉 Kwitansi resmi lunas berhasil dikirim ke WhatsApp ${inv.recipient_name} (+${cleanPhone})!`);
                                                                                } else {
                                                                                    alert(`Kirim WA kwitansi gagal: ${res.error || 'Gagal'}`);
                                                                                }
                                                                            }}
                                                                            className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all border border-emerald-200"
                                                                            title="Kirim Ulang Kwitansi Lunas ke WhatsApp Penyewa"
                                                                        >
                                                                            <Share2 size={11} /> Kirim WA
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {inv.status === 'issued' && (
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <button
                                                                        onClick={() => handleUpdateStatusBill(inv.id, 'paid')}
                                                                        className="bg-green-50 hover:bg-green-100 text-green-600 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                                                    >
                                                                        Verif Lunas
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleUpdateStatusBill(inv.id, 'cancelled')}
                                                                        className="bg-red-50 hover:bg-red-100 text-red-500 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                                                    >
                                                                        Batalkan
                                                                    </button>
                                                                </div>
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
                    {/* =========================================== */}
                    {/* TAB: CHATS (UNIFIED CS INBOX & CONTEXT BAR) */}
                    {/* =========================================== */}
                    {activeTab === 'chats' && (() => {
                        const filteredSessions = chatSessions.filter(s => {
                            const matchProp = chatPropertyFilter === 'all' || s.property_id === chatPropertyFilter;
                            const searchLower = chatSearch.toLowerCase().trim();
                            const partnerName = (s.user?.name || 'Calon Penghuni').toLowerCase();
                            const propTitle = (s.property?.title || '').toLowerCase();
                            const lastMsg = (s.last_message || '').toLowerCase();
                            const matchSearch = !searchLower || partnerName.includes(searchLower) || propTitle.includes(searchLower) || lastMsg.includes(searchLower);
                            return matchProp && matchSearch;
                        });

                        const activeProp = selectedChatSession
                            ? (properties.find(p => p.id === selectedChatSession.property_id) || selectedChatSession.property)
                            : null;

                        const propPhoto = activeProp
                            ? normalizePhotoUrl((activeProp.image_urls && activeProp.image_urls.length > 0) ? activeProp.image_urls[0] : (activeProp.images?.[0] || ''))
                            : '';

                        const activePropEmptyRooms = activeProp ? (activeProp.empty_rooms ?? 0) : 0;

                        return (
                            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[720px] max-h-[82vh] animate-in fade-in duration-300">
                                
                                {/* KOLOM KIRI: DAFTAR SESI PERCAKAPAN */}
                                <div className="w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col shrink-0 bg-slate-50/40">
                                    {/* Search & Filter Header */}
                                    <div className="p-4 border-b border-gray-100 space-y-2.5 bg-white shrink-0">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={chatSearch}
                                                onChange={e => setChatSearch(e.target.value)}
                                                placeholder="Cari calon penyewa/pesan..."
                                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            <select
                                                value={chatPropertyFilter}
                                                onChange={e => setChatPropertyFilter(e.target.value)}
                                                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs appearance-none cursor-pointer"
                                            >
                                                <option value="all">Semua Properti ({chatSessions.length})</option>
                                                {properties.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.title} ({chatSessions.filter(s => s.property_id === p.id).length})
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* List Percakapan */}
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                                        {filteredSessions.length === 0 ? (
                                            <div className="text-center py-16 px-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-300">
                                                    <MessageSquare size={24} />
                                                </div>
                                                <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Belum Ada Pesan</p>
                                                <p className="text-[10px] text-gray-400 mt-1">Pesan dari calon penyewa pada properti terkelola akan masuk di sini secara otomatis.</p>
                                            </div>
                                        ) : (
                                            filteredSessions.map(session => {
                                                const isSelected = selectedChatSession?.id === session.id;
                                                const sessProp = properties.find(p => p.id === session.property_id) || session.property;
                                                const sessPropPhoto = sessProp ? normalizePhotoUrl((sessProp.image_urls && sessProp.image_urls.length > 0) ? sessProp.image_urls[0] : (sessProp.images?.[0] || '')) : '';
                                                const customerName = session.user?.name || 'Calon Penyewa';
                                                const hasUnread = Boolean(session.unread_count && session.unread_count > 0);

                                                return (
                                                    <div
                                                        key={session.id}
                                                        onClick={() => {
                                                            setSelectedChatSession(session);
                                                            if (session.unread_count && session.unread_count > 0) {
                                                                setChatSessions(prev => prev.map(s => s.id === session.id ? { ...s, unread_count: 0 } : s));
                                                                markMessagesAsRead(session.id, 'owner');
                                                            }
                                                        }}
                                                        className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
                                                            isSelected
                                                                ? 'bg-orange-50/90 border-orange-300 shadow-xs'
                                                                : hasUnread
                                                                ? 'bg-amber-50/40 hover:bg-amber-50/70 border-amber-200/80 shadow-xs ring-1 ring-amber-400/20'
                                                                : 'bg-white hover:bg-slate-50 border-gray-100 shadow-2xs'
                                                        }`}
                                                    >
                                                        {/* Top Row: Customer Avatar, Name & Timestamp */}
                                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden relative">
                                                                    {session.user?.photo_url && (
                                                                        <img
                                                                            src={session.user.photo_url}
                                                                            alt=""
                                                                            className="w-full h-full object-cover relative z-10"
                                                                            onError={(e) => {
                                                                                (e.target as HTMLElement).style.display = 'none';
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <span className="select-none uppercase font-black">
                                                                        {(customerName || 'U').charAt(0)}
                                                                    </span>
                                                                </div>
                                                                <div className="min-w-0 flex items-center gap-1.5">
                                                                    <p className={`text-xs truncate ${hasUnread ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                                                                        {customerName}
                                                                    </p>
                                                                    {hasUnread && (
                                                                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 animate-pulse" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end shrink-0 gap-1">
                                                                <span className={`text-[9px] ${hasUnread ? 'font-black text-orange-600' : 'font-bold text-gray-400'}`}>
                                                                    {session.updated_at ? new Date(session.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                                </span>
                                                                {hasUnread && (
                                                                    <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-black leading-none shadow-xs">
                                                                        {session.unread_count}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Middle Row: Prominent Property Badge */}
                                                        {sessProp && (
                                                            <div className="mb-1.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60">
                                                                {sessPropPhoto ? (
                                                                    <img src={sessPropPhoto} alt="" className="w-4 h-4 rounded-md object-cover shrink-0" />
                                                                ) : (
                                                                    <Building2 size={12} className="text-orange-500 shrink-0" />
                                                                )}
                                                                <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight truncate">
                                                                    {sessProp.title}
                                                                </span>
                                                                <span className="text-[8px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100 ml-auto shrink-0 uppercase">
                                                                    {sessProp.type || 'Campur'}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Bottom Row: Message Snippet */}
                                                        <p className={`text-[11px] line-clamp-1 pl-1 ${hasUnread ? 'font-black text-gray-900' : 'font-medium text-gray-500'}`}>
                                                            {session.last_message || 'Mulai percakapan...'}
                                                        </p>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* KOLOM KANAN: JENDELA CHAT AKTIF & STICKY PROPERTY CONTEXT BAR */}
                                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                                    {!selectedChatSession ? (
                                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                                            <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3 shadow-sm border border-orange-100">
                                                <MessageSquare size={32} />
                                            </div>
                                            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Pilih Percakapan Customer</h3>
                                            <p className="text-xs text-gray-400 mt-1 max-w-sm">Pilih salah satu sesi di sebelah kiri untuk melayani calon penyewa dengan konteks kost yang akurat.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* 🌟 1. STICKY HIGH-CONTEXT PROPERTY BAR */}
                                            {activeProp && (
                                                <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-white border-b border-orange-100/80 p-3.5 lg:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-orange-200 shrink-0 shadow-2xs">
                                                            {propPhoto ? (
                                                                <img src={propPhoto} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-orange-400">
                                                                    <Building2 size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md bg-orange-500 text-white shadow-2xs">
                                                                    ⭐ Properti Terkelola
                                                                </span>
                                                                <span className="text-[8px] font-bold text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded-md uppercase">
                                                                    {activeProp.type || 'Campur'}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-sm font-black text-gray-900 truncate mt-0.5">{activeProp.title}</h4>
                                                            <p className="text-[10px] text-gray-500 font-medium truncate flex items-center gap-1">
                                                                <MapPin size={10} className="text-orange-500 shrink-0" />
                                                                <span>{activeProp.city || 'Makassar'}</span>
                                                                <span>•</span>
                                                                <span className="font-black text-orange-600">{FORMAT_CURRENCY(activeProp.price || 0)}/bln</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <div className="hidden sm:flex flex-col text-right mr-1">
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase">Kapasitas Kamar</span>
                                                            <span className="text-xs font-black text-emerald-600">
                                                                {activePropEmptyRooms > 0 ? `🟢 ${activePropEmptyRooms} Kamar Kosong` : '✨ Full Terisi'}
                                                            </span>
                                                        </div>
                                                        <a
                                                            href={`/kost/${activeProp.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-2 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                                            title="Buka Halaman Listing Publik Kost Ini"
                                                        >
                                                            <ExternalLink size={12} /> Buka Listing
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 💬 2. MESSAGE BUBBLE AREA */}
                                            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 bg-slate-50/40">
                                                {loadingChatMessages ? (
                                                    <div className="flex flex-col items-center justify-center py-12">
                                                        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Memuat Riwayat Chat...</p>
                                                    </div>
                                                ) : chatMessages.length === 0 ? (
                                                    <div className="text-center py-12 text-gray-400">
                                                        <p className="text-xs font-bold">Belum ada percakapan sebelumnya.</p>
                                                        <p className="text-[10px] mt-1">Ketik balasan di bawah untuk menyapa calon penyewa.</p>
                                                    </div>
                                                ) : (
                                                    chatMessages.map(msg => {
                                                        const isFromOwner = msg.sender_type === 'owner';
                                                        return (
                                                            <div
                                                                key={msg.id}
                                                                className={`flex flex-col ${isFromOwner ? 'items-end' : 'items-start'}`}
                                                            >
                                                                <div className="flex items-center gap-1.5 mb-1 px-1">
                                                                    <span className="text-[9px] font-bold text-gray-400">
                                                                        {isFromOwner ? 'CS KostManager' : (selectedChatSession.user?.name || 'Calon Penyewa')}
                                                                    </span>
                                                                    <span className="text-[8px] text-gray-300">
                                                                        {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-2xs ${
                                                                        isFromOwner
                                                                            ? 'bg-orange-500 text-white rounded-tr-xs'
                                                                            : 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-xs'
                                                                    }`}
                                                                >
                                                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[8px] ${isFromOwner ? 'text-orange-100' : 'text-gray-400'}`}>
                                                                        <span>{new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        {isFromOwner && (() => {
                                                                            const isTemp = !msg.id || (!msg.id.includes('-') && msg.id.length < 20);
                                                                            return (
                                                                                <span className="inline-flex items-center ml-0.5" title={msg.is_read ? "Dibaca oleh customer" : isTemp ? "Mengirim..." : "Terkirim ke server"}>
                                                                                    {msg.is_read ? (
                                                                                        <CheckCheck size={12} className="text-sky-300 stroke-[2.5]" />
                                                                                    ) : isTemp ? (
                                                                                        <Check size={11} className="text-orange-200" />
                                                                                    ) : (
                                                                                        <CheckCheck size={12} className="text-orange-200" />
                                                                                    )}
                                                                                </span>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* ⚡ 3. QUICK REPLIES */}
                                            <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto shrink-0">
                                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider shrink-0 mr-1">
                                                    ⚡ Cepat:
                                                </span>
                                                {[
                                                    `Halo kak! Kamar di ${activeProp?.title || 'kost kami'} saat ini masih tersedia 😊`,
                                                    `Bisa survey langsung ke lokasi kak, kami bantu jadwalkan 👍`,
                                                    `Bisa langsung booking dan bayar via web RuangSinggah untuk kunci kamar kak ✨`,
                                                    `Fasilitas sudah termasuk WiFi, listrik/air, dan dapur bersama ya kak.`
                                                ].map((quickText, qIdx) => (
                                                    <button
                                                        key={qIdx}
                                                        type="button"
                                                        onClick={() => handleSendChatMessage(undefined, quickText)}
                                                        className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-orange-600 border border-gray-200 text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-2xs"
                                                    >
                                                        {quickText.length > 35 ? quickText.substring(0, 35) + '...' : quickText}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* ✍️ 4. CHAT INPUT BAR */}
                                            <form onSubmit={handleSendChatMessage} className="p-3.5 lg:p-4 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
                                                <input
                                                    type="text"
                                                    value={newChatMessage}
                                                    onChange={e => setNewChatMessage(e.target.value)}
                                                    placeholder={`Balas ${selectedChatSession.user?.name || 'calon penyewa'} terkait ${activeProp?.title || 'kost'}...`}
                                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-2xs"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!newChatMessage.trim() || sendingChat}
                                                    className={`p-3 rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                                                        !newChatMessage.trim() || sendingChat
                                                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                            : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'
                                                    }`}
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </form>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </>
            )}
                </div>
            </div>

            {/* MODAL: TERBITKAN TAGIHAN SEWA (AUTO-PILOT WHATSAPP + MAGIC LINK) */}
            {isAddBillOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 border border-gray-100" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Auto-Pilot Penagihan Sewa</p>
                                    <h3 className="text-base font-black text-gray-900 uppercase tracking-tight mt-0.5">Tagih Sewa & WhatsApp Magic Link</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsAddBillOpen(false);
                                    setSelectedTenantIdForBill('');
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        {(() => {
                            const selectedTenant = tenants.find(t => t.id === selectedTenantIdForBill);
                            const tenantPhone = (selectedTenant?.user?.phone || selectedTenant?.metadata?.phone || '').replace(/[^0-9]/g, '');
                            const tenantName = selectedTenant?.user?.name || 'Penghuni';
                            const propTitle = selectedTenant?.property?.title || 'Kost';
                            const roomName = selectedTenant?.room_type || 'Kamar 1';
                            const totalAmount = Number(billForm.rentalAmount) + Number(billForm.extraFee || 0);
                            const formattedDueDate = billForm.dueDate ? new Date(billForm.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

                            const rawPeriod = selectedTenant?.metadata?.billingPeriod || selectedTenant?.metadata?.paymentPeriod || 'bulanan';
                            const leaseCalc = calculateNextLeasePeriod(
                                selectedTenant?.start_date,
                                selectedTenant?.end_date,
                                rawPeriod,
                                1
                            );

                            const claimToken = selectedTenant ? createRentClaimToken({
                                phone: tenantPhone,
                                tenantName,
                                propertyId: selectedTenant.kost_id,
                                propertyTitle: propTitle,
                                roomNumber: roomName.replace(/[^0-9]/g, '') || '1',
                                roomType: roomName,
                                monthlyPrice: totalAmount,
                                dueDate: billForm.dueDate || leaseCalc.newStartDate || selectedTenant.end_date || '',
                                billingPeriod: leaseCalc.periodLabel,
                                previousPeriodStart: selectedTenant.start_date,
                                previousPeriodEnd: selectedTenant.end_date,
                                newPeriodStart: leaseCalc.newStartDate,
                                newPeriodEnd: leaseCalc.newEndDate,
                                extraFee: Number(billForm.extraFee || 0),
                                extraFeeName: billForm.extraFeeName || '',
                                createdAt: Date.now()
                            }) : '';

                            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ruangsinggah.id';
                            const claimUrl = `${origin}/claim-kost?token=${claimToken}`;

                            const cleanWaNumber = tenantPhone.startsWith('0') ? '62' + tenantPhone.substring(1) : tenantPhone;
                            const lateWarningText = leaseCalc.isLate 
                                ? `⚠️ *Catatan Keterlambatan:* Masa sewa sebelumnya telah jatuh tempo (${leaseCalc.lateDays} hari lalu). Periode sewa baru tetap dihitung bersambung sejak akhir sewa sebelumnya.\n\n`
                                : '';

                            const waMessagePreview = `Halo Kak *${tenantName}*! 👋\n\n` +
                                `Kami dari Manajemen *KostManager - RuangSinggah* menginformasikan mengenai rincian perpanjangan masa sewa kamar Anda:\n\n` +
                                `🏠 *Properti:* ${propTitle}\n` +
                                `🚪 *Kamar:* ${roomName}\n` +
                                `📌 *Skema Sewa:* ${leaseCalc.periodLabel}\n` +
                                `⏳ *Masa Sewa Berjalan:* ${selectedTenant?.start_date || '-'} s/d ${selectedTenant?.end_date || '-'}\n` +
                                `🔄 *Masa Sewa Perpanjangan Baru:* ${leaseCalc.newStartDate} s/d ${leaseCalc.newEndDate}\n` +
                                `📅 *Batas Pembayaran:* ${formattedDueDate}\n` +
                                `💵 *Tarif Sewa Pokok:* ${FORMAT_CURRENCY(billForm.rentalAmount)}` + 
                                (billForm.extraFee ? `\n➕ *${billForm.extraFeeName || 'Biaya Tambahan'}:* ${FORMAT_CURRENCY(billForm.extraFee)}` : '') + `\n` +
                                `💰 *Total Ditagihkan:* ${FORMAT_CURRENCY(totalAmount)}\n\n` +
                                lateWarningText +
                                `Untuk memantau sisa masa sewa, mengunduh kwitansi resmi, dan melakukan perpanjangan sewa dengan mudah via QRIS / Transfer Bank, silakan klik tautan resmi berikut:\n\n` +
                                `👉 *Akses Kost Saya & Bayar:* \n${claimUrl}\n\n` +
                                `_(Tautan ini akan langsung membuka halaman Kost Anda secara otomatis)_\n\n` +
                                `Terima kasih atas kerjasamanya! 🙏✨`;

                            const manualWaUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(waMessagePreview)}`;

                            return (
                                <form onSubmit={e => handleCreateBill(e, true)} className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {/* Pilih Tenant */}
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                                            Pilih Penghuni Kost <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={selectedTenantIdForBill}
                                            onChange={e => {
                                                const tId = e.target.value;
                                                setSelectedTenantIdForBill(tId);
                                            }}
                                            required
                                            className="w-full border border-gray-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-orange-500 bg-white"
                                        >
                                            <option value="">-- Pilih Penghuni Aktif --</option>
                                            {tenants.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.user?.name} ({t.property?.title} - {t.room_type})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedTenant && (
                                        <>
                                            {/* Tenant Info Card */}
                                            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center shadow-sm">
                                                        {(tenantName || 'P').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-900">{tenantName}</p>
                                                        <p className="text-[11px] text-gray-500 font-bold">{propTitle} • {roomName}</p>
                                                    </div>
                                                </div>
                                                {tenantPhone ? (
                                                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                                                        <Phone size={10} /> +{tenantPhone}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
                                                        No HP Kosong
                                                    </span>
                                                )}
                                            </div>

                                            {/* SMART LEASE PERIOD CARD (Perpanjangan Sewa Bersambung) */}
                                            <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-slate-50 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                                        <RotateCw size={13} className="text-orange-500" /> Rincian Periode Sewa & Perpanjangan
                                                    </span>
                                                    <span className="text-[10px] font-black bg-amber-200/70 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                                                        Skema: {leaseCalc.periodLabel}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 pt-1">
                                                    <div className="bg-white/80 border border-amber-100 rounded-xl p-2.5">
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Masa Sewa Berjalan</p>
                                                        <p className="text-xs font-bold text-gray-800">
                                                            {selectedTenant.start_date || '-'} <span className="text-gray-400">s/d</span> {selectedTenant.end_date || '-'}
                                                        </p>
                                                    </div>
                                                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5">
                                                        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                                            <Sparkles size={10} /> Periode Perpanjangan Baru
                                                        </p>
                                                        <p className="text-xs font-black text-emerald-900">
                                                            {leaseCalc.newStartDate} <span className="text-emerald-500 font-bold">s/d</span> {leaseCalc.newEndDate}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Notice / Banner Aturan Sewa Bersambung */}
                                                {leaseCalc.isLate ? (
                                                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-[11px] text-rose-800">
                                                        <AlertTriangle size={15} className="shrink-0 text-rose-600 mt-0.5" />
                                                        <div className="leading-tight">
                                                            <span className="font-black">Masa sewa jatuh tempo ({leaseCalc.lateDays} hari lalu).</span> Sesuai aturan sewa bersambung, tanggal mulai perpanjangan baru tetap dihitung sejak akhir sewa sebelumnya (<b>{leaseCalc.newStartDate}</b>).
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-[10px] text-blue-800">
                                                        <Clock size={13} className="shrink-0 text-blue-600 mt-0.5" />
                                                        <div className="leading-tight">
                                                            Perpanjangan sewa bersambung: Periode baru terhitung mulai <b>{leaseCalc.newStartDate}</b> hingga <b>{leaseCalc.newEndDate}</b>.
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Rincian Tagihan Input Grid */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                                                        Nominal Sewa Pokok (Rp)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        required
                                                        min="0"
                                                        value={billForm.rentalAmount}
                                                        onChange={e => setBillForm({ ...billForm, rentalAmount: Number(e.target.value) })}
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-black text-gray-900 focus:outline-none focus:border-orange-500 bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                                                        Tanggal Jatuh Tempo
                                                    </label>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={billForm.dueDate}
                                                        onChange={e => setBillForm({ ...billForm, dueDate: e.target.value })}
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-orange-500 bg-white"
                                                    />
                                                </div>
                                            </div>

                                            {/* Biaya Tambahan */}
                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2.5">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Biaya Tambahan / Denda (Opsional)</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nama Biaya</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Contoh: Biaya Tambahan Orang / Denda"
                                                            value={billForm.extraFeeName}
                                                            onChange={e => setBillForm({ ...billForm, extraFeeName: e.target.value })}
                                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-orange-400 bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nominal (Rp)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={billForm.extraFee || ''}
                                                            onChange={e => setBillForm({ ...billForm, extraFee: Number(e.target.value) })}
                                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-orange-400 bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Live WhatsApp Message Preview */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                                        <MessageSquare size={12} className="text-emerald-500" /> Pratinjau Pesan WhatsApp Resmi
                                                    </label>
                                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                        ✨ Auto-Login Link Aktif
                                                    </span>
                                                </div>
                                                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-[11px] text-gray-800 font-mono whitespace-pre-wrap leading-relaxed shadow-inner max-h-48 overflow-y-auto">
                                                    {waMessagePreview}
                                                </div>
                                            </div>

                                            {/* Total Summary & Action Buttons */}
                                            <div className="pt-2 space-y-3">
                                                <div className="bg-gradient-to-r from-orange-500 to-amber-400 p-4 rounded-2xl text-white flex justify-between items-center shadow-lg">
                                                    <div>
                                                        <p className="text-[9px] font-black text-orange-100 uppercase tracking-widest">Total Ditagihkan</p>
                                                        <p className="text-xl font-black">{FORMAT_CURRENCY(totalAmount)}</p>
                                                    </div>
                                                    <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
                                                        {formattedDueDate}
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    <button
                                                        type="submit"
                                                        disabled={submittingBill || !tenantPhone}
                                                        className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                                            submittingBill || !tenantPhone
                                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-98'
                                                        }`}
                                                    >
                                                        <Send size={15} />
                                                        {submittingBill ? 'Mengirim Tagihan...' : '🚀 Kirim WhatsApp Otomatis (+ Magic Link)'}
                                                    </button>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <a
                                                            href={manualWaUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-center"
                                                        >
                                                            <ExternalLink size={12} /> Buka WA Web
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCreateBill(undefined, false)}
                                                            disabled={submittingBill}
                                                            className="py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
                                                        >
                                                            <FileText size={12} /> Simpan Invoice Saja
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </form>
                            );
                        })()}
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
            {/* MODAL 4: SET KAMAR TERISI (QUICK OCCUPANCY FORM) */}
            {quickOccupancyModal.open && quickOccupancyModal.property && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/70">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                                    <Bed size={16} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-emerald-950 uppercase tracking-tight">Set Kamar Terisi</h3>
                                    <p className="text-[10px] text-emerald-700 font-bold">{quickOccupancyModal.property.title} • {quickOccupancyModal.roomName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setQuickOccupancyModal(prev => ({ ...prev, open: false }))}
                                className="p-2 hover:bg-slate-200/70 rounded-full text-slate-400 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveQuickOccupancy} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Nama Penghuni *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Misal: Budi Santoso"
                                    value={quickOccupancyModal.residentName}
                                    onChange={e => setQuickOccupancyModal(prev => ({ ...prev, residentName: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">No. WhatsApp / HP</label>
                                <input
                                    type="tel"
                                    placeholder="Misal: 08123456789"
                                    value={quickOccupancyModal.residentPhone}
                                    onChange={e => setQuickOccupancyModal(prev => ({ ...prev, residentPhone: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Tanggal Mulai Sewa</label>
                                    <input
                                        type="date"
                                        value={quickOccupancyModal.startDate}
                                        onChange={e => setQuickOccupancyModal(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Jatuh Tempo</label>
                                    <input
                                        type="date"
                                        value={quickOccupancyModal.endDate}
                                        onChange={e => setQuickOccupancyModal(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Tarif Sewa Bulanan (Rp)</label>
                                <input
                                    type="number"
                                    value={quickOccupancyModal.price}
                                    onChange={e => setQuickOccupancyModal(prev => ({ ...prev, price: Number(e.target.value) }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setQuickOccupancyModal(prev => ({ ...prev, open: false }))}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={quickOccupancyModal.submitting}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    {quickOccupancyModal.submitting ? 'Menyimpan...' : 'Simpan & Set Terisi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: KONFIRMASI KOSONGKAN KAMAR */}
            {vacateConfirmModal.open && vacateConfirmModal.property && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                            <LogOut size={24} />
                        </div>
                        <div className="text-center space-y-1">
                            <h4 className="font-black text-base text-slate-900">Kosongkan Unit Kamar?</h4>
                            <p className="text-xs text-slate-500 font-medium">
                                Status <strong>{vacateConfirmModal.roomName}</strong> di <strong>{vacateConfirmModal.property.title}</strong> akan diubah menjadi <span className="text-emerald-600 font-bold">KOSONG</span> dan siap dipasarkan kembali.
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setVacateConfirmModal(prev => ({ ...prev, open: false }))}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={vacateConfirmModal.submitting}
                                onClick={handleConfirmVacateRoom}
                                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                {vacateConfirmModal.submitting ? 'Memproses...' : 'Ya, Kosongkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 6: DIGITAL RECEIPT MODAL */}
            <DigitalReceiptModal
                isOpen={showDigitalReceiptModal}
                onClose={() => {
                    setShowDigitalReceiptModal(false);
                    setSelectedReceipt(null);
                }}
                receipt={selectedReceipt}
            />
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


const ManagedPropertyAddModal: React.FC<ManagedPropertyAddModalProps> = (props) => {
    return <KostManagerPropertyFormModal {...props} />;
};

export default KostManagerPortal;
